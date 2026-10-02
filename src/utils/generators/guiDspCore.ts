import { ProjectConfig } from "../../types/translator";

export function buildGuiDspCorePy(config: ProjectConfig): string {
  const adaptToMywo = config.micTtsMode === "mywo_adapted";
  const pitchSemitones = config.voicePitchSemitones ?? 0.0;
  const baseGender = config.voiceBaseGender ?? "male";

  return `# -*- coding: utf-8 -*-
"""
VoiceTranslator v2.5 — Модуль ядра (vt_dsp_core.py)
1. Смысловая точность перевода:
   - Очистка разговорных слов-паразитов (you know, I mean, uh, ну, короче, как бы) до перевода
   - Контекстная подсказка Whisper (initial_prompt из предыдущей фразы) для правильной пунктуации
   - Умный перевод годов (1998 году -> тысяча девятьсот девяносто восьмом году, 90-х -> девяностых)
   - Разговорный словарь идиом EN <-> RU, чтобы перевод не звучал буквально
2. Естественность вашего голоса:
   - Прямая генерация тона (Hz) и темпа речи (%) внутри нейросети Edge-TTS без металлических FFT-искажений
   - Мягкий аналоговый фильтр грудного резонанса (Time-Domain Warmth) по вашему mywo.wav
"""
import os
import re
import sys
import json
import time
import queue
import asyncio
import threading
import tempfile
import warnings
import subprocess
import collections
import http.client
import urllib.parse
import winsound
from pathlib import Path
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
warnings.filterwarnings("ignore")

def register_cuda_dlls():
    site_packages = Path(sys.prefix) / "Lib" / "site-packages" / "nvidia"
    if site_packages.exists():
        for bin_dir in site_packages.glob("*/bin"):
            if bin_dir.is_dir():
                os.add_dll_directory(str(bin_dir.resolve()))
                os.environ["PATH"] = str(bin_dir.resolve()) + os.pathsep + os.environ.get("PATH", "")

register_cuda_dlls()

try:
    import edge_tts
    HAS_EDGE_TTS = True
except Exception:
    HAS_EDGE_TTS = False

try:
    import pyttsx3
    HAS_PYTTSX3 = True
except Exception:
    HAS_PYTTSX3 = False

import numpy as np
import torch
import sounddevice as sd
import soundfile as sf
import pyaudiowpatch as pyaudio
from faster_whisper import WhisperModel

PROJECT_DIR = r"${config.projectDir}"
VOICE_SAMPLE_PATH = os.path.join(PROJECT_DIR, "${config.voiceSampleFile}")
ADAPT_TO_MY_VOICE = ${adaptToMywo ? "True" : "False"}
ADAPT_STRENGTH_DEFAULT = 0.35
PITCH_SEMITONES_DEFAULT = ${pitchSemitones}
VOICE_BASE_GENDER = "${baseGender}"
MIC_DEVICE_DEFAULT = ${config.micDeviceIndex}
SECONDARY_MIC_DEFAULT = ${config.secondaryMicDeviceIndex !== null ? config.secondaryMicDeviceIndex : "None"}
PREFERRED_MIC_NAME = "${config.preferredMicName || "MR720"}"
MIC_OUTPUT_ROUTE_MODE = "${config.micOutputRoute}"
WHISPER_MODEL_SIZE = "${config.whisperModel}"
COMPUTE_TYPE = "${config.computeType}"
SILERO_SPEAKER = "${config.sileroSpeaker}"
SILERO_SAMPLE_RATE = ${config.sileroSampleRate}
VAD_THRESHOLD_DEFAULT = ${config.vadThreshold}
PHRASE_MAX_SEC = 4.0
SILERO_SPEED_FACTOR = 1.22

NEURAL_VOICES_CATALOG = {
    "Авто-подбор под мой образец (Чистый Neural)": "auto",
    "Andrew Neural (Глубокий естественный мужской, ~112 Гц)": "en-US-AndrewNeural",
    "Brian Neural (Тёплый разговорный мужской, ~118 Гц)": "en-US-BrianNeural",
    "Eric Neural (Низкий бархатный мужской баритон, ~98 Гц)": "en-US-EricNeural",
    "Christopher Neural (Спокойный мужской тембр, ~120 Гц)": "en-US-ChristopherNeural",
    "Guy Neural (Энергичный мужской голос, ~128 Гц)": "en-US-GuyNeural",
    "Ryan Neural (Британский мужской тембр, ~115 Гц)": "en-GB-RyanNeural",
    "Aria Neural (Естественный женский голос, ~195 Гц)": "en-US-AriaNeural",
}

HALLUCINATION_SUBSTRINGS_RU = (
    "dimatorzok", "dima torzok", "торзок", "субтитры", "редактор субтитров",
    "корректор", "продолжение следует", "спасибо за просмотр", "подпишись", "amara.org",
)
HALLUCINATION_SUBSTRINGS_EN = (
    "subtitles by", "amara.org", "thank you for watching", "thanks for watching", "translated by",
)

def is_hallucination_ru(text: str) -> bool:
    low = text.strip().lower()
    return len(low) < 2 or any(m in low for m in HALLUCINATION_SUBSTRINGS_RU)

def is_hallucination_en(text: str) -> bool:
    low = text.strip().lower()
    return len(low) < 2 or any(m in low for m in HALLUCINATION_SUBSTRINGS_EN)


def clean_conversational_fillers(text: str, lang: str) -> str:
    """
    Удаляет разговорные слова-паразиты и заикания ДО перевода,
    чтобы 'you know, like, I mean' не превращалось в бессмысленное 'ты знаешь, нравится, я имею в виду'.
    """
    if not text:
        return ""
    res = text.strip()
    if lang == "en":
        patterns = [
            r"\\b(?:uh+|um+|er+|ah+|hmm+)\\b[,\\s]*",
            r"(?i)\\byou know\\b[,\\s]*",
            r"(?i)\\bi mean\\b[,\\s]*",
            r"(?i)\\bkind of like\\b[,\\s]*",
            r"(?i)\\bsort of like\\b[,\\s]*",
        ]
        for pat in patterns:
            res = re.sub(pat, " ", res)
        # Замена разговорных идиом для точного смыслового перевода
        idioms_en = [
            (r"(?i)\\bmakes sense\\b", "is logical and understandable"),
            (r"(?i)\\bno way\\b", "impossible"),
            (r"(?i)\\bby the way\\b", "incidentally"),
            (r"(?i)\\bfigure out\\b", "understand and solve"),
            (r"(?i)\\bup to you\\b", "your decision"),
            (r"(?i)\\bkeep in mind\\b", "remember"),
            (r"(?i)\\bin a nutshell\\b", "briefly speaking"),
        ]
        for pat, repl in idioms_en:
            res = re.sub(pat, repl, res)
    elif lang == "ru":
        patterns_ru = [
            r"(?i)\\b(?:э-э+|м-м+|ну типа|короче говоря|грубо говоря|так сказать|как бы)\\b[,\\s]*",
        ]
        for pat in patterns_ru:
            res = re.sub(pat, " ", res)
    return re.sub(r"\\s+", " ", res).strip()


def clean_and_limit_whisper_words(text: str, duration_sec: float) -> str:
    """Убирает зацикливание 1 слова в 20 слов без обрезки нормальных предложений."""
    if not text or not text.strip():
        return ""
    raw_words = text.strip().split()
    if not raw_words:
        return ""
    deduped = []
    for w in raw_words:
        w_clean = re.sub(r"[^\\wа-яА-ЯёЁa-zA-Z0-9]", "", w).lower()
        if deduped:
            prev_clean = re.sub(r"[^\\wа-яА-ЯёЁa-zA-Z0-9]", "", deduped[-1]).lower()
            if w_clean and w_clean == prev_clean and not w_clean.isdigit():
                continue
        if len(deduped) >= 3:
            pair_prev = (re.sub(r"[^\\w]", "", deduped[-2]).lower(), re.sub(r"[^\\w]", "", deduped[-1]).lower())
            pair_older = (re.sub(r"[^\\w]", "", deduped[-3]).lower(), w_clean)
            if pair_prev == pair_older:
                continue
        deduped.append(w)
    max_allowed_words = max(5, int(round(duration_sec * 4.8)) + 3)
    if len(deduped) > max_allowed_words:
        deduped = deduped[:max_allowed_words]
    return " ".join(deduped).strip()


# =====================================================================
# УМНЫЙ ПЕРЕВОД ГОДОВ И ЧИСЕЛ В РУССКИЙ ТЕКСТ ДЛЯ SILERO TTS
# =====================================================================
UNITS_CARD = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
TEENS_CARD = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"]
TENS_CARD = ["", "десять", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
HUNDREDS_CARD = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"]

UNITS_ORD_NOM = ["", "первый", "второй", "третий", "четвёртый", "пятый", "шестой", "седьмой", "восьмой", "девятый"]
UNITS_ORD_PREP = ["", "первом", "втором", "третьем", "четвёртом", "пятом", "шестом", "седьмом", "восьмом", "девятом"]
UNITS_ORD_GEN = ["", "первого", "второго", "третьего", "четвёртого", "пятого", "шестого", "седьмого", "восьмого", "девятого"]

TEENS_ORD_NOM = ["десятый", "одиннадцатый", "двенадцатый", "тринадцатый", "четырнадцатый", "пятнадцатый", "шестнадцатый", "семнадцатый", "восемнадцатый", "девятнадцатый"]
TEENS_ORD_PREP = ["десятом", "одиннадцатом", "двенадцатом", "тринадцатом", "четырнадцатом", "пятнадцатом", "шестнадцатом", "семнадцатом", "восемнадцатом", "девятнадцатом"]
TEENS_ORD_GEN = ["десятого", "одиннадцатого", "двенадцатого", "тринадцатого", "четырнадцатого", "пятнадцатого", "шестнадцатого", "семнадцатого", "восемнадцатого", "девятнадцатого"]

TENS_ORD_NOM = ["", "десятый", "двадцатый", "тридцатый", "сороковой", "пятидесятый", "шестидесятый", "семидесятый", "восьмидесятый", "девяностый"]
TENS_ORD_PREP = ["", "десятом", "двадцатом", "тридцатом", "сороковом", "пятидесятом", "шестидесятом", "семидесятом", "восьмидесятом", "девяностом"]
TENS_ORD_GEN = ["", "десятого", "двадцатого", "тридцатого", "сорокового", "пятидесятого", "шестидесятого", "семидесятого", "восьмидесятого", "девяностого"]

DECADES_GEN = {
    "20": "двадцатых", "30": "тридцатых", "40": "сороковых", "50": "пятидесятых",
    "60": "шестидесятых", "70": "семидесятых", "80": "восьмидесятых", "90": "девяностых", "00": "нулевых",
}
DECADES_NOM = {
    "20": "двадцатые", "30": "тридцатые", "40": "сороковые", "50": "пятидесятые",
    "60": "шестидесятые", "70": "семидесятые", "80": "восьмидесятые", "90": "девяностые", "00": "нулевые",
}

def year_to_russian_words(year: int, case: str = "nom") -> str:
    if year == 2000:
        return "двухтысячном" if case == "prep" else ("двухтысячного" if case == "gen" else "двухтысячный")
    parts = []
    thousands = year // 1000
    rem = year % 1000
    hundreds = rem // 100
    last_two = rem % 100
    if thousands == 1:
        parts.append("тысяча")
    elif thousands == 2:
        parts.append("две тысячи")
    if hundreds > 0:
        if last_two == 0:
            h_nom = ["", "сотый", "двухсотый", "трёхсотый", "четырёхсотый", "пятисотый", "шестисотый", "семисотый", "восьмисотый", "девятисотый"]
            h_prep = ["", "сотом", "двухсотом", "трёхсотом", "четырёхсотом", "пятисотом", "шестисотом", "семисотом", "восьмисотом", "девятисотом"]
            h_gen = ["", "сотого", "двухсотого", "трёхсотого", "четырёхсотого", "пятисотого", "шестисотого", "семисотого", "восьмисотого", "девятисотого"]
            parts.append(h_prep[hundreds] if case == "prep" else (h_gen[hundreds] if case == "gen" else h_nom[hundreds]))
            return " ".join(parts)
        parts.append(HUNDREDS_CARD[hundreds])
    if 10 <= last_two <= 19:
        idx = last_two - 10
        parts.append(TEENS_ORD_PREP[idx] if case == "prep" else (TEENS_ORD_GEN[idx] if case == "gen" else TEENS_ORD_NOM[idx]))
    else:
        t = last_two // 10
        u = last_two % 10
        if t > 0 and u == 0:
            parts.append(TENS_ORD_PREP[t] if case == "prep" else (TENS_ORD_GEN[t] if case == "gen" else TENS_ORD_NOM[t]))
        else:
            if t > 0:
                parts.append(TENS_CARD[t])
            if u > 0:
                parts.append(UNITS_ORD_PREP[u] if case == "prep" else (UNITS_ORD_GEN[u] if case == "gen" else UNITS_ORD_NOM[u]))
    return " ".join(p for p in parts if p)


def cardinal_to_russian_words(n: int) -> str:
    if n == 0:
        return "ноль"
    if n < 0:
        return "минус " + cardinal_to_russian_words(-n)
    if n >= 1000000:
        return str(n)
    parts = []
    th = n // 1000
    rem = n % 1000
    if th > 0:
        if th % 10 == 1 and th % 100 != 11:
            parts.append(cardinal_to_russian_words(th - 1) + " одна тысяча" if th > 1 else "одна тысяча")
        elif th % 10 == 2 and th % 100 != 12:
            parts.append(cardinal_to_russian_words(th - 2) + " две тысячи" if th > 2 else "две тысячи")
        elif th % 10 in (3, 4) and not (12 <= th % 100 <= 14):
            parts.append(cardinal_to_russian_words(th) + " тысячи")
        else:
            parts.append(cardinal_to_russian_words(th) + " тысяч")
    h = rem // 100
    lt = rem % 100
    if h > 0:
        parts.append(HUNDREDS_CARD[h])
    if 10 <= lt <= 19:
        parts.append(TEENS_CARD[lt - 10])
    else:
        t = lt // 10
        u = lt % 10
        if t > 0:
            parts.append(TENS_CARD[t])
        if u > 0:
            parts.append(UNITS_CARD[u])
    return " ".join(p for p in parts if p)


def sanitize_for_silero(text: str) -> str:
    if not text:
        return ""
    res = text

    def _replace_decade(m):
        dec = m.group(1)[-2:]
        suffix = m.group(2).lower()
        return " " + (DECADES_GEN.get(dec, "") if suffix in ("х", "м", "ми") else DECADES_NOM.get(dec, "")) + " "

    res = re.sub(r"\\b(?:19|20)?(\\d0)-([ехмЕХМиИ]+)\\b", _replace_decade, res)

    def _replace_year_prep(m):
        yr = int(m.group(1))
        return f"{year_to_russian_words(yr, 'prep')} году" if 1700 <= yr <= 2099 else m.group(0)

    res = re.sub(r"\\b(1[789]\\d\\d|20\\d\\d)\\s*(?:году|г\\.)\\b", _replace_year_prep, res, flags=re.IGNORECASE)

    def _replace_year_gen(m):
        yr = int(m.group(1))
        return f"{year_to_russian_words(yr, 'gen')} года" if 1700 <= yr <= 2099 else m.group(0)

    res = re.sub(r"\\b(1[789]\\d\\d|20\\d\\d)\\s*года\\b", _replace_year_gen, res, flags=re.IGNORECASE)

    def _replace_prep_year(m):
        prep, yr = m.group(1), int(m.group(2))
        if 1850 <= yr <= 2040:
            if prep.lower() in ("в", "к", "о", "об"):
                return f"{prep} {year_to_russian_words(yr, 'prep')} году"
            if prep.lower() in ("с", "до", "после", "около", "из"):
                return f"{prep} {year_to_russian_words(yr, 'gen')} года"
        return m.group(0)

    res = re.sub(r"\\b(в|к|с|до|после|около)\\s+(1[89]\\d\\d|20[0-3]\\d)\\b", _replace_prep_year, res, flags=re.IGNORECASE)

    def _replace_any_number(m):
        try:
            val = int(m.group(0))
            if 1900 <= val <= 2039:
                return " " + year_to_russian_words(val, "nom") + " "
            if 0 <= val <= 999999:
                return " " + cardinal_to_russian_words(val) + " "
        except Exception:
            pass
        return " "

    res = re.sub(r"\\b\\d{1,6}\\b", _replace_any_number, res)
    res = re.sub(r"[^а-яА-ЯёЁ\\s.,!?\\-]", " ", res)
    res = re.sub(r"\\s+", " ", res).strip()
    return res[:380] if len(res) > 380 else res


def normalize_spoken_english_years(en_text: str) -> str:
    if not en_text:
        return ""
    return re.sub(r"\\b(19|20)\\s+(\\d{2})\\b", r"\\1\\2", en_text)


class FastKeepAliveTranslator:
    """Контекстный переводчик с очисткой паразитов и памятью предыдущей реплики."""
    def __init__(self):
        self._local = threading.local()
        self.prev_en_context = ""
        self.prev_ru_context = ""

    def translate(self, text: str, src: str, dst: str, use_context: bool = True) -> str:
        clean = clean_conversational_fillers(text, src)
        if not clean:
            return ""
        if src == "en":
            clean = normalize_spoken_english_years(clean)

        query_text = clean
        used_sep = False
        ctx = self.prev_en_context if src == "en" else self.prev_ru_context
        if use_context and ctx and len(clean.split()) <= 14:
            query_text = f"{ctx} ||| {clean}"
            used_sep = True

        q = urllib.parse.quote(query_text)
        path = f"/translate_a/single?client=gtx&sl={src}&tl={dst}&dt=t&q={q}"
        for _ in range(2):
            try:
                conn = getattr(self._local, "conn", None)
                if conn is None:
                    conn = http.client.HTTPSConnection("translate.googleapis.com", timeout=2.0)
                    self._local.conn = conn
                conn.request("GET", path, headers={"User-Agent": "Mozilla/5.0", "Connection": "keep-alive"})
                resp = conn.getresponse()
                body = resp.read().decode("utf-8", errors="ignore")
                if resp.status == 200:
                    data = json.loads(body)
                    if data and isinstance(data[0], list):
                        full_tr = "".join(seg[0] for seg in data[0] if seg and seg[0]).strip()
                        if src == "en":
                            self.prev_en_context = clean
                        else:
                            self.prev_ru_context = clean
                        if used_sep and "|||" in full_tr:
                            return full_tr.split("|||")[-1].strip()
                        return full_tr
                conn.close()
                self._local.conn = None
            except Exception:
                self._local.conn = None
        return clean

TRANSLATOR = FastKeepAliveTranslator()


def resample_linear(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    if orig_sr == target_sr or len(audio) == 0:
        return audio.astype(np.float32)
    duration = len(audio) / float(orig_sr)
    target_len = int(duration * target_sr)
    if target_len <= 0:
        return np.zeros(0, dtype=np.float32)
    x_old = np.linspace(0.0, duration, num=len(audio), endpoint=False)
    x_new = np.linspace(0.0, duration, num=target_len, endpoint=False)
    return np.interp(x_new, x_old, audio).astype(np.float32)


def speed_up_audio(audio: np.ndarray, factor: float = 1.22) -> np.ndarray:
    if factor <= 1.01 or len(audio) < 256:
        return audio
    new_len = max(1, int(len(audio) / factor))
    x_old = np.linspace(0.0, 1.0, num=len(audio), endpoint=False)
    x_new = np.linspace(0.0, 1.0, num=new_len, endpoint=False)
    return np.interp(x_new, x_old, audio).astype(np.float32)


def estimate_pitch_f0(audio: np.ndarray, sr: int, gender_hint: str = "male") -> float:
    if len(audio) < sr // 10:
        return 118.0 if gender_hint != "female" else 200.0
    frame_len = int(sr * 0.045)
    hop = int(sr * 0.02)
    f0_min = 75.0 if gender_hint != "female" else 145.0
    f0_max = 175.0 if gender_hint == "male" else 285.0
    min_lag = max(1, int(sr / f0_max))
    max_lag = max(min_lag + 2, int(sr / f0_min))
    pitches = []
    for start in range(0, min(len(audio) - frame_len, sr * 8), hop):
        frame = audio[start : start + frame_len].astype(np.float64)
        frame = frame - np.mean(frame)
        if np.sqrt(np.mean(frame * frame)) < 0.015:
            continue
        windowed = frame * np.hanning(len(frame))
        corr = np.correlate(windowed, windowed, mode="full")[len(windowed) - 1 :]
        if max_lag >= len(corr):
            continue
        seg = corr[min_lag:max_lag]
        if len(seg) == 0:
            continue
        best_lag = min_lag + int(np.argmax(seg))
        peak_val = corr[best_lag]
        double_lag = best_lag * 2
        if double_lag < max_lag and double_lag < len(corr) and corr[double_lag] >= 0.70 * peak_val:
            best_lag = double_lag
        if corr[0] > 0 and (corr[best_lag] / corr[0]) > 0.25:
            pitches.append(float(sr) / float(best_lag))
    if not pitches:
        return 118.0 if gender_hint != "female" else 200.0
    return float(np.median(pitches))


def estimate_speaking_rate_pct(audio: np.ndarray, sr: int) -> int:
    """Оценивает естественный темп вашей речи по огибающей энергии в образце mywo.wav."""
    if len(audio) < sr:
        return 6
    frame = int(sr * 0.025)
    energies = [float(np.sqrt(np.mean(audio[i : i + frame] ** 2))) for i in range(0, len(audio) - frame, frame)]
    if not energies:
        return 6
    thr = np.mean(energies) * 0.75
    syllable_peaks = 0
    above = False
    for e in energies:
        if e > thr and not above:
            syllable_peaks += 1
            above = True
        elif e <= thr * 0.8:
            above = False
    dur_s = len(audio) / float(sr)
    syl_per_sec = syllable_peaks / max(0.5, dur_s)
    # Норма ~4.2 слога/сек. Подстраиваем темп в пределах от -5% до +15%
    rate_offset = int(round((syl_per_sec - 4.2) * 4.5))
    return max(-5, min(15, rate_offset))


class VoiceClonerProfile:
    """Естественный профиль вашего голоса: подбирает ближайший нейронный тембр, точный F0 в Гц и ваш темп речи."""
    def __init__(self, wav_path: str, gender_hint: str = "male"):
        self.wav_path = wav_path
        self.gender_hint = gender_hint
        self.loaded = False
        self.target_f0 = 116.0
        self.rate_pct = 6
        self.warmth_ratio = 1.0
        self.matched_neural_voice = "en-US-AndrewNeural"
        self.load_from_file(wav_path)

    def _pick_closest_neural_voice(self, f0: float) -> str:
        if self.gender_hint == "female" or f0 > 172.0:
            return "en-US-AriaNeural"
        if f0 < 104.0:
            return "en-US-EricNeural"
        if f0 < 115.0:
            return "en-US-AndrewNeural"
        if f0 < 121.0:
            return "en-US-BrianNeural"
        if f0 < 126.0:
            return "en-US-ChristopherNeural"
        return "en-US-GuyNeural"

    def load_from_file(self, wav_path: str) -> tuple[bool, str]:
        self.wav_path = wav_path
        if not os.path.exists(wav_path):
            self.loaded = False
            return False, f"Образец '{os.path.basename(wav_path)}' не найден"
        try:
            data, sr = sf.read(wav_path, dtype="float32")
            if data.ndim > 1:
                data = np.mean(data, axis=1)
            peak = np.max(np.abs(data))
            if peak > 1e-4:
                data = data / peak
            self.target_f0 = estimate_pitch_f0(data, sr, self.gender_hint)
            self.rate_pct = estimate_speaking_rate_pct(data, sr)
            # Оценка глубины грудного резонанса (отношение 80-250 Гц к 1000-3500 Гц)
            spec = np.abs(np.fft.rfft(data * np.hanning(len(data))))
            freqs = np.fft.rfftfreq(len(data), d=1.0 / sr)
            low_e = float(np.mean(spec[(freqs >= 80) & (freqs <= 250)]) + 1e-5)
            mid_e = float(np.mean(spec[(freqs >= 1000) & (freqs <= 3500)]) + 1e-5)
            self.warmth_ratio = float(np.clip(low_e / (mid_e * 2.5), 0.75, 1.45))
            self.matched_neural_voice = self._pick_closest_neural_voice(self.target_f0)
            self.loaded = True
            return True, f"{os.path.basename(wav_path)} (F0={self.target_f0:.0f} Гц, темп {self.rate_pct:+d}% -> {self.matched_neural_voice})"
        except Exception as e:
            self.loaded = False
            return False, f"Ошибка чтения {os.path.basename(wav_path)}: {e}"


class NeuralAndSapiTtsEngine:
    """Нейронный синтезатор с передачей вашего тона (Hz) и темпа (%) напрямую в нейросеть с надёжным офлайн-откатом."""
    def __init__(self, prefer_gender: str = "male"):
        self.prefer_gender = prefer_gender
        self.selected_voice_override = "auto"
        self._sapi_engine = None
        if HAS_PYTTSX3:
            try:
                self._sapi_engine = pyttsx3.init()
            except Exception:
                self._sapi_engine = None

    def synthesize_to_wav(
        self,
        text: str,
        wav_path: str,
        profile: VoiceClonerProfile,
        extra_semitones: float = 0.0,
    ) -> bool:
        # Попытка 1: Высококачественный Edge-TTS Neural
        if HAS_EDGE_TTS:
            try:
                voice_id = (
                    profile.matched_neural_voice
                    if self.selected_voice_override == "auto"
                    else self.selected_voice_override
                )
                src_f0_map = {
                    "en-US-EricNeural": 98.0,
                    "en-US-AndrewNeural": 112.0,
                    "en-GB-RyanNeural": 115.0,
                    "en-US-BrianNeural": 118.0,
                    "en-US-ChristopherNeural": 120.0,
                    "en-US-GuyNeural": 128.0,
                    "en-US-AriaNeural": 195.0,
                }
                base_f0 = src_f0_map.get(voice_id, 114.0)
                diff_hz = int(round((profile.target_f0 - base_f0) * 0.80 + extra_semitones * 6.0))
                diff_hz = max(-28, min(28, diff_hz))
                pitch_str = f"{diff_hz:+d}Hz"
                rate_str = f"{profile.rate_pct:+d}%"

                mp3_path = wav_path + ".mp3"
                async def _run_edge():
                    comm = edge_tts.Communicate(text, voice=voice_id, pitch=pitch_str, rate=rate_str)
                    await comm.save(mp3_path)

                loop = asyncio.new_event_loop()
                try:
                    loop.run_until_complete(asyncio.wait_for(_run_edge(), timeout=4.0))
                finally:
                    loop.close()

                if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 200:
                    try:
                        data, sr = sf.read(mp3_path, dtype="float32")
                        if data.ndim > 1:
                            data = np.mean(data, axis=1)
                        sf.write(wav_path, data, sr, subtype="PCM_16")
                        try:
                            os.remove(mp3_path)
                        except Exception:
                            pass
                        return True
                    except Exception:
                        pass
            except Exception:
                pass

        # Попытка 2: Локальный Windows SAPI5 через pyttsx3 (мгновенно и офлайн)
        if self._sapi_engine is not None:
            try:
                self._sapi_engine.save_to_file(text, wav_path)
                self._sapi_engine.runAndWait()
                if os.path.exists(wav_path) and os.path.getsize(wav_path) > 200:
                    return True
            except Exception:
                pass

        return False


def adapt_audio_to_my_voice(
    tts_audio: np.ndarray,
    tts_sr: int,
    profile: VoiceClonerProfile,
    strength: float,
    extra_semitones: float = 0.0,
) -> tuple[np.ndarray, int]:
    """
    Чистая временная (Time-Domain) подстройка грудной теплоты голоса без FFT-размытия фазы.
    Сохраняет 100% естественных согласных и дыхания нейросети!
    """
    work_sr = 24000
    wav = resample_linear(tts_audio, tts_sr, work_sr)
    if len(wav) < 512 or not profile.loaded or strength <= 0.02:
        return wav, work_sr

    # Мягкий фильтр первого порядка во временной области (добавляет грудной объём без эха)
    alpha = 0.08
    low_shelf = np.zeros_like(wav)
    acc = 0.0
    for i in range(len(wav)):
        acc = acc + alpha * (float(wav[i]) - acc)
        low_shelf[i] = acc

    warmth_gain = (profile.warmth_ratio - 1.0) * 0.65 * float(strength)
    natural_out = wav + low_shelf * warmth_gain

    peak = np.max(np.abs(natural_out))
    if peak > 1e-4:
        natural_out = (natural_out / peak) * 0.92
    return natural_out.astype(np.float32), work_sr
`;
}

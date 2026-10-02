import { ProjectConfig } from "../../types/translator";

export function buildGuiDspCorePy(config: ProjectConfig): string {
  const adaptToMywo = config.micTtsMode === "mywo_adapted";
  const pitchSemitones = config.voicePitchSemitones ?? 0.0;
  const baseGender = config.voiceBaseGender ?? "male";

  return `# -*- coding: utf-8 -*-
"""
VoiceTranslator Desktop Monitor GUI v2.3 (RTX 5070 Ti)
- Управление образцом голоса в окне: Выбрать .wav / Записать 4 сек с микрофона / Тест голоса
- WSOLA сдвиг тона F0 + перенос формантной огибающей (без ускорения речи)
- Защита от превращения 1 слова в 20 слов (without_timestamps=False, repetition_penalty=1.35)
"""
import os
import re
import sys
import json
import time
import queue
import ctypes
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

import numpy as np
import torch
import sounddevice as sd
import soundfile as sf
import pyaudiowpatch as pyaudio
from faster_whisper import WhisperModel

PROJECT_DIR = r"${config.projectDir}"
VOICE_SAMPLE_PATH = os.path.join(PROJECT_DIR, "${config.voiceSampleFile}")
ADAPT_TO_MY_VOICE = ${adaptToMywo ? "True" : "False"}
ADAPT_STRENGTH_DEFAULT = ${config.voiceAdaptStrength}
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
PHRASE_MAX_SEC = ${config.phraseDurationSec}
SILERO_SPEED_FACTOR = 1.15

HALLUCINATION_SUBSTRINGS_RU = (
    "dimatorzok", "dima torzok", "торзок", "субтитры", "редактор субтитров",
    "корректор", "продолжение следует", "спасибо за просмотр", "подпишись", "amara.org",
)
HALLUCINATION_SUBSTRINGS_EN = (
    "subtitles by", "amara.org", "thank you for watching", "thanks for watching", "translated by",
)

def is_hallucination_ru(text: str) -> bool:
    low = text.strip().lower()
    if len(low) < 2:
        return True
    return any(marker in low for marker in HALLUCINATION_SUBSTRINGS_RU)

def is_hallucination_en(text: str) -> bool:
    low = text.strip().lower()
    if len(low) < 2:
        return True
    return any(marker in low for marker in HALLUCINATION_SUBSTRINGS_EN)

def clean_and_limit_whisper_words(text: str, duration_sec: float) -> str:
    """Устраняет зацикливание 1 слова в 20 слов и ограничивает длину по секундам звука."""
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
            if w_clean and w_clean == prev_clean:
                continue
        if len(deduped) >= 3:
            pair_prev = (
                re.sub(r"[^\\w]", "", deduped[-2]).lower(),
                re.sub(r"[^\\w]", "", deduped[-1]).lower(),
            )
            pair_older = (
                re.sub(r"[^\\w]", "", deduped[-3]).lower(),
                w_clean,
            )
            if pair_prev == pair_older:
                continue
        deduped.append(w)
    max_allowed_words = max(3, int(round(duration_sec * 4.2)) + 2)
    if len(deduped) > max_allowed_words:
        deduped = deduped[:max_allowed_words]
    return " ".join(deduped).strip()


class FastKeepAliveTranslator:
    def __init__(self):
        self._local = threading.local()

    def translate(self, text: str, src: str, dst: str) -> str:
        clean = text.strip()
        if not clean:
            return ""
        q = urllib.parse.quote(clean)
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
                        return "".join(seg[0] for seg in data[0] if seg and seg[0]).strip()
                conn.close()
                self._local.conn = None
            except Exception:
                self._local.conn = None
        return text

TRANSLATOR = FastKeepAliveTranslator()


class PersistentEnTtsWorker:
    """Постоянный фоновый синтезатор SAPI5 с выбором мужского/женского тембра без задержки старта."""
    def __init__(self, prefer_gender: str = "male"):
        self.prefer_gender = prefer_gender
        self.proc = None
        self.lock = threading.Lock()

    def _ensure_started(self):
        if self.proc is not None and self.proc.poll() is None:
            return
        gender_keyword = "Female" if self.prefer_gender == "female" else "Male"
        ps_code = (
            "Add-Type -AssemblyName System.Speech; "
            "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
            "$s.Rate = 1; "
            "$voices = $s.GetInstalledVoices(); "
            "$picked = $null; "
            "foreach ($v in $voices) { "
            f"  if ($v.VoiceInfo.Culture.Name -like 'en-*' -and $v.VoiceInfo.Gender -eq '{gender_keyword}') {{ $picked = $v.VoiceInfo.Name; break }} "
            "} "
            "if (-not $picked) { foreach ($v in $voices) { if ($v.VoiceInfo.Culture.Name -like 'en-*') { $picked = $v.VoiceInfo.Name; break } } } "
            "if ($picked) { try { $s.SelectVoice($picked) } catch {} } "
            "while (($line = [Console]::In.ReadLine()) -ne $null) { "
            "  $parts = $line.Split('|', 2); "
            "  if ($parts.Length -eq 2) { "
            "    try { "
            "      $bytes = [Convert]::FromBase64String($parts[1]); "
            "      $txt = [System.Text.Encoding]::UTF8.GetString($bytes); "
            "      $s.SetOutputToWaveFile($parts[0]); "
            "      $s.Speak($txt); "
            "      $s.SetOutputToNull(); "
            "      [Console]::Out.WriteLine('OK'); "
            "      [Console]::Out.Flush(); "
            "    } catch { "
            "      [Console]::Out.WriteLine('ERR'); "
            "      [Console]::Out.Flush(); "
            "    } "
            "  } "
            "}"
        )
        si = subprocess.STARTUPINFO()
        si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        self.proc = subprocess.Popen(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_code],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            text=True, encoding="utf-8", startupinfo=si,
        )

    def synthesize_to_wav(self, text: str, wav_path: str) -> bool:
        import base64
        with self.lock:
            result = {"ok": False}
            def _worker():
                try:
                    self._ensure_started()
                    b64 = base64.b64encode(text.encode("utf-8")).decode("ascii")
                    self.proc.stdin.write(f"{wav_path}|{b64}\\n")
                    self.proc.stdin.flush()
                    ans = self.proc.stdout.readline().strip()
                    result["ok"] = (ans == "OK" and os.path.exists(wav_path))
                except Exception:
                    try:
                        if self.proc:
                            self.proc.kill()
                    except Exception:
                        pass
                    self.proc = None
            t = threading.Thread(target=_worker, daemon=True)
            t.start()
            t.join(timeout=3.0)
            return result["ok"]


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


def speed_up_audio(audio: np.ndarray, factor: float = 1.15) -> np.ndarray:
    if factor <= 1.01 or len(audio) < 256:
        return audio
    new_len = max(1, int(len(audio) / factor))
    x_old = np.linspace(0.0, 1.0, num=len(audio), endpoint=False)
    x_new = np.linspace(0.0, 1.0, num=new_len, endpoint=False)
    return np.interp(x_new, x_old, audio).astype(np.float32)


def estimate_pitch_f0(audio: np.ndarray, sr: int, gender_hint: str = "male") -> float:
    """Точная оценка базового тона F0 с защитой от 2-й гармоники (193.6 Гц вместо мужских ~115 Гц)."""
    if len(audio) < sr // 10:
        return 122.0 if gender_hint != "female" else 205.0
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
        rms = np.sqrt(np.mean(frame * frame))
        if rms < 0.015:
            continue
        windowed = frame * np.hanning(len(frame))
        corr = np.correlate(windowed, windowed, mode="full")[len(windowed) - 1 :]
        if max_lag >= len(corr):
            continue
        seg = corr[min_lag:max_lag]
        if len(seg) == 0:
            continue
        best_rel = int(np.argmax(seg))
        best_lag = min_lag + best_rel
        peak_val = corr[best_lag]
        double_lag = best_lag * 2
        if double_lag < max_lag and double_lag < len(corr):
            if corr[double_lag] >= 0.72 * peak_val:
                best_lag = double_lag
        if corr[0] > 0 and (corr[best_lag] / corr[0]) > 0.25:
            pitches.append(float(sr) / float(best_lag))
    if not pitches:
        return 122.0 if gender_hint != "female" else 205.0
    return float(np.median(pitches))


def compute_spectral_envelope(audio: np.ndarray, sr: int, n_fft: int = 1024) -> np.ndarray:
    if len(audio) < n_fft:
        return np.ones(n_fft // 2 + 1, dtype=np.float32)
    hop = n_fft // 2
    window = np.hanning(n_fft)
    mags = []
    for start in range(0, min(len(audio) - n_fft, sr * 10), hop):
        frame = audio[start : start + n_fft]
        if np.sqrt(np.mean(frame * frame)) < 0.01:
            continue
        spec = np.abs(np.fft.rfft(frame * window))
        mags.append(spec)
    if not mags:
        return np.ones(n_fft // 2 + 1, dtype=np.float32)
    mean_mag = np.mean(np.stack(mags, axis=0), axis=0)
    kernel = np.hanning(19)
    kernel /= np.sum(kernel)
    smoothed = np.convolve(mean_mag, kernel, mode="same")
    smoothed = np.maximum(smoothed, 1e-4)
    return (smoothed / np.mean(smoothed)).astype(np.float32)


def wsola_pitch_shift_preserve_tempo(audio: np.ndarray, sr: int, pitch_ratio: float) -> np.ndarray:
    """Сдвигает высоту тона голоса в pitch_ratio раз без изменения скорости речи."""
    pitch_ratio = float(np.clip(pitch_ratio, 0.68, 1.48))
    if abs(pitch_ratio - 1.0) < 0.02 or len(audio) < 512:
        return audio.astype(np.float32)
    win_size = 1024
    ha = win_size // 4
    hs = max(16, int(round(ha * pitch_ratio)))
    window = np.hanning(win_size).astype(np.float32)
    out_len = int(len(audio) * pitch_ratio) + win_size
    out_buf = np.zeros(out_len, dtype=np.float32)
    norm_buf = np.zeros(out_len, dtype=np.float32)
    in_pos = 0
    out_pos = 0
    while in_pos + win_size < len(audio) and out_pos + win_size < out_len:
        grain = audio[in_pos : in_pos + win_size] * window
        out_buf[out_pos : out_pos + win_size] += grain
        norm_buf[out_pos : out_pos + win_size] += window * window
        in_pos += ha
        out_pos += hs
    valid = norm_buf > 1e-4
    out_buf[valid] /= norm_buf[valid]
    stretched = out_buf[:max(1, out_pos)]
    x_old = np.linspace(0.0, 1.0, num=len(stretched), endpoint=False)
    x_new = np.linspace(0.0, 1.0, num=len(audio), endpoint=False)
    return np.interp(x_new, x_old, stretched).astype(np.float32)


class VoiceClonerProfile:
    """Профиль вашего голоса с поддержкой горячей замены .wav или записи 4 сек с микрофона."""
    def __init__(self, wav_path: str, gender_hint: str = "male"):
        self.wav_path = wav_path
        self.gender_hint = gender_hint
        self.loaded = False
        self.target_f0 = 122.0
        self.target_env_24k = np.ones(513, dtype=np.float32)
        self.load_from_file(wav_path)

    def load_from_file(self, wav_path: str) -> tuple[bool, str]:
        self.wav_path = wav_path
        if not os.path.exists(wav_path):
            self.loaded = False
            return False, f"Образец '{ os.path.basename(wav_path) }' не найден"
        try:
            data, sr = sf.read(wav_path, dtype="float32")
            if data.ndim > 1:
                data = np.mean(data, axis=1)
            peak = np.max(np.abs(data))
            if peak > 1e-4:
                data = data / peak
            self.target_f0 = estimate_pitch_f0(data, sr, self.gender_hint)
            data_24k = resample_linear(data, sr, 24000)
            self.target_env_24k = compute_spectral_envelope(data_24k, 24000, n_fft=1024)
            self.loaded = True
            return True, f"{os.path.basename(wav_path)} (Ваш тон F0 = {self.target_f0:.1f} Гц)"
        except Exception as e:
            self.loaded = False
            return False, f"Ошибка чтения {os.path.basename(wav_path)}: {e}"


def adapt_audio_to_my_voice(
    tts_audio: np.ndarray,
    tts_sr: int,
    profile: VoiceClonerProfile,
    strength: float,
    extra_semitones: float = 0.0,
) -> tuple[np.ndarray, int]:
    work_sr = 24000
    wav_24k = resample_linear(tts_audio, tts_sr, work_sr)
    if len(wav_24k) < 1024:
        return wav_24k, work_sr
    src_f0 = estimate_pitch_f0(wav_24k, work_sr, VOICE_BASE_GENDER)
    tgt_f0 = profile.target_f0 if profile.loaded else (122.0 if VOICE_BASE_GENDER != "female" else 205.0)
    base_ratio = (tgt_f0 / src_f0) if src_f0 > 50 else 1.0
    base_ratio = 1.0 + (base_ratio - 1.0) * float(np.clip(strength, 0.0, 1.0))
    semi_factor = 2.0 ** (float(extra_semitones) / 12.0)
    total_pitch_ratio = float(np.clip(base_ratio * semi_factor, 0.68, 1.48))
    pitched = wsola_pitch_shift_preserve_tempo(wav_24k, work_sr, total_pitch_ratio)
    if profile.loaded and strength > 0.05:
        n_fft = 1024
        hop = 512
        win = np.hanning(n_fft).astype(np.float32)
        src_env = compute_spectral_envelope(pitched, work_sr, n_fft=n_fft)
        transfer = (profile.target_env_24k / np.maximum(src_env, 1e-3)) ** (0.65 * strength)
        transfer = np.clip(transfer, 0.35, 2.8).astype(np.float32)
        out = np.zeros(len(pitched) + n_fft, dtype=np.float32)
        norm = np.zeros(len(pitched) + n_fft, dtype=np.float32)
        for i in range(0, len(pitched) - n_fft, hop):
            frame = pitched[i : i + n_fft] * win
            spec = np.fft.rfft(frame)
            mod_frame = np.fft.irfft(spec * transfer, n=n_fft).astype(np.float32)
            out[i : i + n_fft] += mod_frame * win
            norm[i : i + n_fft] += win * win
        valid = norm > 1e-4
        out[valid] /= norm[valid]
        pitched = out[:len(pitched)]
    peak = np.max(np.abs(pitched))
    if peak > 1e-4:
        pitched = (pitched / peak) * 0.90
    return pitched.astype(np.float32), work_sr


def sanitize_for_silero(text: str) -> str:
    digit_map = {
        "0": " ноль ", "1": " один ", "2": " два ", "3": " три ", "4": " четыре ",
        "5": " пять ", "6": " шесть ", "7": " семь ", "8": " восемь ", "9": " девять ",
    }
    res = text
    for d, w in digit_map.items():
        res = res.replace(d, w)
    res = re.sub(r"[^а-яА-ЯёЁ\\s.,!?\\-]", " ", res)
    res = re.sub(r"\\s+", " ", res).strip()
    return res[:350] if len(res) > 350 else res
`;
}

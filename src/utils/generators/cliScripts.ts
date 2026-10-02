import { ProjectConfig } from "../../types/translator";
import { toCrLf } from "./common";

export function generateCheckDevicesPy(config: ProjectConfig): string {
  return toCrLf(`# -*- coding: utf-8 -*-
"""
ШАГ 3: Диагностика всех микрофонов Windows + проверка образца голоса (${config.voiceSampleFile})
"""
import sounddevice as sd

def main():
    print("=" * 76)
    print("  ШАГ 3: СПИСОК ВСЕХ ДОСТУПНЫХ МИКРОФОНОВ И УСТРОЙСТВ В WINDOWS")
    print("=" * 76)
    devices = sd.query_devices()
    hostapis = sd.query_hostapis()
    default_in, _ = sd.default.device
    for idx, dev in enumerate(devices):
        if dev.get("max_input_channels", 0) <= 0:
            continue
        hostapi_name = hostapis[dev["hostapi"]]["name"]
        markers = []
        if idx == ${config.micDeviceIndex}:
            markers.append("ОСНОВНОЙ В КОНФИГЕ")
        if "${config.preferredMicName || "MR720"}".lower() in dev["name"].lower():
            markers.append("НАЙДЕН ПО ИМЕНИ ${config.preferredMicName || "MR720"}")
        if idx == default_in:
            markers.append("ВХОД WINDOWS ПО УМОЛЧАНИЮ")
        marker_str = f"  <-- [{' | '.join(markers)}]" if markers else ""
        print(f"[Индекс #{idx:2d}] {dev['name']} ({hostapi_name}, {int(dev['default_samplerate'])} Гц){marker_str}")
    print("=" * 76)

if __name__ == "__main__":
    main()
`);
}

export function generateTranslatorMicPy(config: ProjectConfig): string {
  return toCrLf(`# -*- coding: utf-8 -*-
"""
ШАГ 4.1: translator_mic.py (С АВТО-ПОИСКОМ МИКРОФОНА '${config.preferredMicName || "MR720"}' И ЗАЩИТОЙ ОТ ПОВТОРА 20 СЛОВ)
"""
import os, sys, json, time, queue, warnings, collections, http.client, urllib.parse
from pathlib import Path

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
import sounddevice as sd
from faster_whisper import WhisperModel
from colorama import init, Fore

init(autoreset=True)

MIC_DEVICE_INDEX = ${config.micDeviceIndex}
PREFERRED_MIC_NAME = "${config.preferredMicName || "MR720"}"
WHISPER_MODEL_SIZE = "${config.whisperModel}"
COMPUTE_TYPE = "${config.computeType}"
SAMPLE_RATE = 16000
PHRASE_DURATION_SEC = ${config.phraseDurationSec}
VAD_RMS_THRESHOLD = ${config.vadThreshold}

HALLUCINATION_SUBSTRINGS_RU = ("dimatorzok", "субтитры", "редактор субтитров", "корректор", "продолжение следует", "спасибо за просмотр", "amara.org")

def resolve_best_mic_index():
    devices = sd.query_devices()
    pref = PREFERRED_MIC_NAME.strip().lower()
    for idx, d in enumerate(devices):
        if int(d.get("max_input_channels", 0)) > 0:
            name = str(d.get("name", ""))
            if pref and pref in name.lower() and "cable" not in name.lower():
                return idx, name, int(d.get("default_samplerate", 44100))
    try:
        d = sd.query_devices(MIC_DEVICE_INDEX, "input")
        return MIC_DEVICE_INDEX, str(d.get("name", "")), int(d.get("default_samplerate", 44100))
    except Exception:
        d = sd.query_devices(None, "input")
        return None, str(d.get("name", "Default")), int(d.get("default_samplerate", 44100))

class FastKeepAliveTranslator:
    def __init__(self):
        self.conn = None
    def translate(self, text: str, src: str = "ru", dst: str = "en") -> str:
        if not text or not text.strip():
            return ""
        q = urllib.parse.quote(text.strip())
        path = f"/translate_a/single?client=gtx&sl={src}&tl={dst}&dt=t&q={q}"
        for _ in range(2):
            try:
                if self.conn is None:
                    self.conn = http.client.HTTPSConnection("translate.googleapis.com", timeout=2.2)
                self.conn.request("GET", path, headers={"User-Agent": "Mozilla/5.0", "Connection": "keep-alive"})
                resp = self.conn.getresponse()
                raw = resp.read().decode("utf-8", errors="ignore")
                if resp.status == 200:
                    data = json.loads(raw)
                    if data and isinstance(data[0], list):
                        return "".join(part[0] for part in data[0] if part and part[0]).strip()
                self.conn.close()
                self.conn = None
            except Exception:
                self.conn = None
        return text

translator = FastKeepAliveTranslator()

def resample_linear(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    if orig_sr == target_sr or len(audio) == 0:
        return audio.astype(np.float32)
    duration = len(audio) / float(orig_sr)
    target_len = int(duration * target_sr)
    x_old = np.linspace(0.0, duration, num=len(audio), endpoint=False)
    x_new = np.linspace(0.0, duration, num=max(1, target_len), endpoint=False)
    return np.interp(x_new, x_old, audio).astype(np.float32)

def main():
    mic_idx, mic_name, native_sr = resolve_best_mic_index()
    print(Fore.GREEN + f"[МИКРОФОН] Выбран вход [#{mic_idx}]: {mic_name} ({native_sr} Гц)")
    model = WhisperModel(WHISPER_MODEL_SIZE, device="cuda", compute_type=COMPUTE_TYPE)
    list(model.transcribe(np.zeros(16000, dtype=np.float32), language="ru", beam_size=1, without_timestamps=False)[0])
    print(Fore.GREEN + "[ГОТОВО] Говорите по-русски в микрофон.\\n")

    while True:
        try:
            mic_idx, mic_name, native_sr = resolve_best_mic_index()
            audio_queue = queue.Queue()
            with sd.InputStream(samplerate=native_sr, device=mic_idx, channels=1, dtype="float32", blocksize=int(native_sr * 0.10), callback=lambda indata, f, t, s: audio_queue.put(indata.copy().flatten())):
                pre_roll = collections.deque(maxlen=2)
                speech_buffer = []
                silence_blocks = 0
                max_blocks = max(12, int(PHRASE_DURATION_SEC / 0.10))
                while True:
                    try:
                        chunk = audio_queue.get(timeout=2.0)
                    except queue.Empty:
                        break
                    if float(np.sqrt(np.mean(np.square(chunk)))) >= VAD_RMS_THRESHOLD:
                        if not speech_buffer and pre_roll:
                            speech_buffer.extend(pre_roll)
                            pre_roll.clear()
                        speech_buffer.append(chunk)
                        silence_blocks = 0
                    else:
                        if speech_buffer:
                            speech_buffer.append(chunk)
                            silence_blocks += 1
                        else:
                            pre_roll.append(chunk)
                    if len(speech_buffer) >= 4 and (silence_blocks >= 3 or len(speech_buffer) >= max_blocks):
                        raw_audio = np.concatenate(speech_buffer)
                        speech_buffer.clear()
                        silence_blocks = 0
                        audio_16k = resample_linear(raw_audio, native_sr, SAMPLE_RATE)
                        dur_sec = len(audio_16k) / 16000.0
                        t_start = time.perf_counter()
                        segments, _ = model.transcribe(
                            audio_16k, language="ru", beam_size=1, without_timestamps=False,
                            repetition_penalty=1.35, no_repeat_ngram_size=2, compression_ratio_threshold=1.8,
                            max_new_tokens=max(8, min(60, int(dur_sec * 10))), vad_filter=False, condition_on_previous_text=False,
                        )
                        recognized_ru = " ".join(s.text.strip() for s in segments if getattr(s, "no_speech_prob", 0.0) < 0.60 and getattr(s, "compression_ratio", 1.0) < 1.85).strip()
                        if not recognized_ru or any(h in recognized_ru.lower() for h in HALLUCINATION_SUBSTRINGS_RU):
                            continue
                        translated_en = translator.translate(recognized_ru, "ru", "en")
                        ms = int((time.perf_counter() - t_start) * 1000)
                        print(f"[{time.strftime('%H:%M:%S')}] ВЫ (RU): {recognized_ru}")
                        print(f"           {Fore.GREEN}ПЕРЕВОД (EN) [{ms} мс]: {translated_en}")
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(Fore.YELLOW + f"[РЕСТАРТ] {e}")
            time.sleep(0.8)

if __name__ == "__main__":
    main()
`);
}

export function generateTranslatorLoopbackPy(config: ProjectConfig): string {
  return toCrLf(`# -*- coding: utf-8 -*-
"""
ШАГ 4.2: translator_loopback.py (БЫСТРЫЙ ОТКЛИК С ДЕТЕКТОРОМ ПАУЗ 100 МС + ЗАЩИТА ОТ ПОВТОРА СЛОВ)
"""
import os, re, sys, json, time, queue, tempfile, warnings, collections, http.client, urllib.parse, winsound
from pathlib import Path

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
import soundfile as sf
import pyaudiowpatch as pyaudio
from faster_whisper import WhisperModel
from colorama import init, Fore

init(autoreset=True)

WHISPER_MODEL_SIZE = "${config.whisperModel}"
COMPUTE_TYPE = "${config.computeType}"
SILERO_SPEAKER = "${config.sileroSpeaker}"
SILERO_SAMPLE_RATE = ${config.sileroSampleRate}
PHRASE_DURATION_SEC = ${config.phraseDurationSec}
VAD_RMS_THRESHOLD = ${config.vadThreshold}

class FastKeepAliveTranslator:
    def __init__(self):
        self.conn = None
    def translate(self, text: str, src: str = "en", dst: str = "ru") -> str:
        if not text or not text.strip():
            return ""
        q = urllib.parse.quote(text.strip())
        path = f"/translate_a/single?client=gtx&sl={src}&tl={dst}&dt=t&q={q}"
        for _ in range(2):
            try:
                if self.conn is None:
                    self.conn = http.client.HTTPSConnection("translate.googleapis.com", timeout=2.2)
                self.conn.request("GET", path, headers={"User-Agent": "Mozilla/5.0", "Connection": "keep-alive"})
                resp = self.conn.getresponse()
                raw = resp.read().decode("utf-8", errors="ignore")
                if resp.status == 200:
                    data = json.loads(raw)
                    if data and isinstance(data[0], list):
                        return "".join(part[0] for part in data[0] if part and part[0]).strip()
                self.conn.close()
                self.conn = None
            except Exception:
                self.conn = None
        return text

translator = FastKeepAliveTranslator()

def resample_linear(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    if orig_sr == target_sr or len(audio) == 0:
        return audio.astype(np.float32)
    duration = len(audio) / float(orig_sr)
    x_old = np.linspace(0.0, duration, num=len(audio), endpoint=False)
    x_new = np.linspace(0.0, duration, num=max(1, int(duration * target_sr)), endpoint=False)
    return np.interp(x_new, x_old, audio).astype(np.float32)

def speed_up_audio(audio: np.ndarray, factor: float = 1.15) -> np.ndarray:
    new_len = max(1, int(len(audio) / factor))
    x_old = np.linspace(0.0, 1.0, num=len(audio), endpoint=False)
    x_new = np.linspace(0.0, 1.0, num=new_len, endpoint=False)
    return np.interp(x_new, x_old, audio).astype(np.float32)

def sanitize_for_silero(text: str) -> str:
    digit_map = {"0": " ноль ", "1": " один ", "2": " два ", "3": " три ", "4": " четыре ", "5": " пять ", "6": " шесть ", "7": " семь ", "8": " восемь ", "9": " девять "}
    res = text
    for d, word in digit_map.items():
        res = res.replace(d, word)
    res = re.sub(r"[^а-яА-ЯёЁ\\s.,!?\\-]", " ", res)
    return re.sub(r"\\s+", " ", res).strip()[:350]

def main():
    whisper = WhisperModel(WHISPER_MODEL_SIZE, device="cuda", compute_type=COMPUTE_TYPE)
    list(whisper.transcribe(np.zeros(16000, dtype=np.float32), language="en", beam_size=1, without_timestamps=False)[0])
    torch.set_num_threads(4)
    silero_model, _ = torch.hub.load(repo_or_dir="snakers4/silero-models", model="silero_tts", language="ru", speaker="v4_ru", verbose=False)
    silero_model.to(torch.device("cpu"))
    audio_q = queue.Queue()
    is_speaking_lock = False

    with pyaudio.PyAudio() as p:
        wasapi_info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
        default_speakers = p.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
        loopback_dev = default_speakers
        if not default_speakers.get("isLoopbackDevice", False):
            for lb in p.get_loopback_device_info_generator():
                if default_speakers["name"] in lb["name"]:
                    loopback_dev = lb
                    break
        sr = int(loopback_dev["defaultSampleRate"])
        channels = max(1, int(loopback_dev["maxInputChannels"]))

        def loopback_callback(in_data, frame_count, time_info, status):
            if not is_speaking_lock:
                audio_q.put(in_data)
            return (in_data, pyaudio.paContinue)

        stream = p.open(format=pyaudio.paFloat32, channels=channels, rate=sr, frames_per_buffer=int(sr * 0.10), input=True, input_device_index=loopback_dev["index"], stream_callback=loopback_callback)
        stream.start_stream()
        pre_roll = collections.deque(maxlen=2)
        speech_buf = []
        silence_blocks = 0
        max_blocks = max(14, int(PHRASE_DURATION_SEC / 0.10))

        while stream.is_active():
            try:
                data = audio_q.get(timeout=0.4)
                arr = np.frombuffer(data, dtype=np.float32)
                if channels > 1:
                    arr = arr.reshape(-1, channels).mean(axis=1)
                if float(np.sqrt(np.mean(np.square(arr)))) >= VAD_RMS_THRESHOLD:
                    if not speech_buf and pre_roll:
                        speech_buf.extend(pre_roll)
                        pre_roll.clear()
                    speech_buf.append(arr)
                    silence_blocks = 0
                else:
                    if speech_buf:
                        speech_buf.append(arr)
                        silence_blocks += 1
                    else:
                        pre_roll.append(arr)
            except queue.Empty:
                if len(speech_buf) >= 4:
                    silence_blocks = 4
                else:
                    continue

            if len(speech_buf) >= 4 and (silence_blocks >= 3 or len(speech_buf) >= max_blocks):
                full_audio = np.concatenate(speech_buf)
                speech_buf.clear()
                silence_blocks = 0
                audio_16k = resample_linear(full_audio, sr, 16000)
                dur_sec = len(audio_16k) / 16000.0
                t0 = time.perf_counter()
                segments, _ = whisper.transcribe(
                    audio_16k, language="en", beam_size=1, without_timestamps=False,
                    repetition_penalty=1.35, no_repeat_ngram_size=2, compression_ratio_threshold=1.8,
                    max_new_tokens=max(8, min(65, int(dur_sec * 11))), vad_filter=False, condition_on_previous_text=False,
                )
                english_text = " ".join(s.text.strip() for s in segments if getattr(s, "no_speech_prob", 0.0) < 0.60 and getattr(s, "compression_ratio", 1.0) < 1.85).strip()
                if not english_text or len(english_text) < 2:
                    continue
                russian_text = translator.translate(english_text, "en", "ru")
                clean_ru = sanitize_for_silero(russian_text or "")
                if not clean_ru:
                    continue
                audio_tensor = silero_model.apply_tts(text=clean_ru, speaker=SILERO_SPEAKER, sample_rate=SILERO_SAMPLE_RATE)
                tts_fast = speed_up_audio(audio_tensor.detach().cpu().numpy(), factor=1.15)
                ms = int((time.perf_counter() - t0) * 1000)
                print(f"[{time.strftime('%H:%M:%S')}] СОБЕСЕДНИК (EN): {english_text}")
                print(f"           {Fore.MAGENTA}SILERO (RU) [{ms} мс]: {russian_text}")
                is_speaking_lock = True
                silero_wav_path = os.path.join(tempfile.gettempdir(), "vt_loop_silero.wav")
                sf.write(silero_wav_path, tts_fast, SILERO_SAMPLE_RATE, subtype="PCM_16")
                winsound.PlaySound(silero_wav_path, winsound.SND_FILENAME)
                time.sleep(0.08)
                while not audio_q.empty():
                    audio_q.get_nowait()
                is_speaking_lock = False

if __name__ == "__main__":
    main()
`);
}

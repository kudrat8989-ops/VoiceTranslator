import { ProjectConfig } from "../../../types/translator";
import { toCrLf } from "../common";

export function generateTranslatorMicPy(config: ProjectConfig): string {
  return toCrLf(`# -*- coding: utf-8 -*-
"""Консольный переводчик микрофона RU -> EN с озвучкой моих слов (translator_mic.py)"""
import os, sys, time, queue, urllib.parse, http.client, json, threading, subprocess, numpy as np, sounddevice as sd
from pathlib import Path
import shutil
from colorama import init, Fore
init(autoreset=True)

for p in [Path(sys.prefix) / "Lib" / "site-packages" / "nvidia" / "cublas" / "bin",
            Path(sys.prefix) / "Lib" / "site-packages" / "nvidia" / "cudnn" / "bin",
            Path(sys.prefix) / "Lib" / "site-packages" / "torch" / "lib"]:
    if p.exists():
        try: os.add_dll_directory(str(p.resolve())); os.environ["PATH"] = str(p.resolve()) + os.pathsep + os.environ.get("PATH", "")
        except Exception: pass

from faster_whisper import WhisperModel

def speak_en_words(text: str):
    """Озвучивание переведённых слов на английский язык в наушники"""
    def _run():
        try:
            safe = text.replace("'", " ").replace('"', ' ').strip()
            if not safe: return
            cmd = 'powershell -Command "(New-Object -ComObject SAPI.SpVoice).Speak(\\"' + safe + '\\")"'
            subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception: pass
    threading.Thread(target=_run, daemon=True).start()

def translate_ru_en(text: str) -> str:
    if not text: return ""
    try:
        q = urllib.parse.quote(text.strip())
        conn = http.client.HTTPSConnection("translate.googleapis.com", timeout=3.5)
        conn.request("GET", f"/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q={q}", headers={"User-Agent": "Mozilla/5.0"})
        resp = conn.getresponse()
        if resp.status == 200:
            data = json.loads(resp.read().decode("utf-8", errors="ignore"))
            return "".join(s[0] for s in data[0] if s and s[0]).strip()
    except Exception: pass
    return text

def main():
    print(Fore.CYAN + "Запуск консольного переводчика RU -> EN с озвучкой английских слов...")
    model = WhisperModel("${config.whisperModel}", device="cuda", compute_type="${config.computeType}")
    print(Fore.GREEN + "Модель готова. Говорите в микрофон (перевод сразу звучит на английском)...")
    dev_idx, sr, block_sec = ${config.micDeviceIndex}, 16000, 0.1
    block_len, q_audio = int(block_sec * sr), queue.Queue()

    def cb(indata, frames, time_info, status): q_audio.put(indata.copy())

    with sd.InputStream(device=dev_idx, channels=1, samplerate=sr, blocksize=block_len, dtype="float32", callback=cb):
        buf, silence_cnt, max_blocks = [], 0, int(${config.phraseDurationSec || 1.8} / block_sec)
        while True:
            data = q_audio.get().flatten()
            rms = float(np.sqrt(np.mean(data**2)))
            if rms > ${config.vadThreshold || 0.005}:
                buf.append(data); silence_cnt = 0
            elif buf:
                silence_cnt += 1; buf.append(data)
                if silence_cnt > 6 or len(buf) >= max_blocks:
                    raw_audio = np.concatenate(buf); buf, silence_cnt = [], 0
                    segs, _ = model.transcribe(raw_audio, language="ru", task="transcribe", beam_size=1)
                    text = " ".join(s.text.strip() for s in segs).strip()
                    if len(text) > 1:
                        en = translate_ru_en(text)
                        print(Fore.WHITE + f"ВЫ (RU): {text}")
                        print(Fore.GREEN + f"ПЕРЕВОД (EN): {en}")
                        speak_en_words(en)

if __name__ == "__main__":
    main()
`);
}

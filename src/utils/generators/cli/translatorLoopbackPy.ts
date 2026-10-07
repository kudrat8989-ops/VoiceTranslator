import { ProjectConfig } from "../../../types/translator";
import { toCrLf } from "../common";

export function generateTranslatorLoopbackPy(config: ProjectConfig): string {
  return toCrLf(`# -*- coding: utf-8 -*-
"""Консольный переводчик динамика EN -> RU (translator_loopback.py)"""
import os, sys, time, queue, urllib.parse, http.client, json, numpy as np
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

import pyaudiowpatch as pyaudio
from faster_whisper import WhisperModel

def translate_en_ru(text: str) -> str:
    if not text: return ""
    try:
        q = urllib.parse.quote(text.strip())
        conn = http.client.HTTPSConnection("translate.googleapis.com", timeout=3.5)
        conn.request("GET", f"/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q={q}", headers={"User-Agent": "Mozilla/5.0"})
        resp = conn.getresponse()
        if resp.status == 200:
            data = json.loads(resp.read().decode("utf-8", errors="ignore"))
            return "".join(s[0] for s in data[0] if s and s[0]).strip()
    except Exception: pass
    return text

def main():
    print(Fore.CYAN + "Запуск консольного переводчика динамика (EN -> RU)...")
    model = WhisperModel("${config.whisperModel}", device="cuda", compute_type="${config.computeType}")
    print(Fore.GREEN + "Слушаем собеседника через WASAPI Loopback...")
    p = pyaudio.PyAudio()
    wasapi = p.get_host_api_info_by_type(pyaudio.paWASAPI)
    def_spk = p.get_device_info_by_index(wasapi["defaultOutputDevice"])
    dev = None
    for lb in p.get_loopback_device_info_generator():
        if def_spk["name"] in lb["name"]: dev = lb; break
        if dev is None: dev = lb
    if dev is None:
        print(Fore.RED + "WASAPI Loopback устройство не найдено!")
        return

    sr = int(dev["defaultSampleRate"])
    q_audio = queue.Queue()
    def cb(in_data, frame_count, time_info, status):
        q_audio.put(in_data); return (in_data, pyaudio.paContinue)

    stream = p.open(format=pyaudio.paFloat32, channels=dev["maxInputChannels"], rate=sr, input=True, input_device_index=dev["index"], stream_callback=cb)
    stream.start_stream()
    buf = []
    while True:
        data = np.frombuffer(q_audio.get(), dtype=np.float32)
        rms = float(np.sqrt(np.mean(data**2)))
        if rms > ${config.vadThreshold || 0.005}: buf.append(data)
        elif buf and len(buf) > 10:
            raw = np.concatenate(buf); buf = []
            segs, _ = model.transcribe(raw, language="en", task="transcribe", beam_size=1)
            t = " ".join(s.text.strip() for s in segs).strip()
            if len(t) > 1:
                ru = translate_en_ru(t)
                print(Fore.CYAN + f"СОБЕСЕДНИК (EN): {t}")
                print(Fore.YELLOW + f"ПЕРЕВОД (RU): {ru}")

if __name__ == "__main__":
    main()
`);
}

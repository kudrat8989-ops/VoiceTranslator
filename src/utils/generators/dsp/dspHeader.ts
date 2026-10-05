import { ProjectConfig } from "../../../types/translator";

export function generateDspHeader(config: ProjectConfig): string {
  const adaptToMywo = config.micTtsMode === "mywo_adapted";
  const pitchSemitones = config.voicePitchSemitones ?? 0.0;
  const baseGender = config.voiceBaseGender ?? "male";

  return `# -*- coding: utf-8 -*-
"""VoiceTranslator v2.4 Core DSP & Translation Engine (vt_dsp_core.py)"""
import os, sys, re, json, time, queue, asyncio, threading, tempfile, warnings, http.client, urllib.parse
from pathlib import Path
try: import winsound
except Exception: winsound = None
try:
    import tkinter as tk
    from tkinter import ttk, scrolledtext, filedialog
except Exception: tk = None

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
warnings.filterwarnings("ignore")

def safe_play_wav(path: str, async_mode: bool = False) -> bool:
    if winsound is not None:
        try:
            flags = winsound.SND_FILENAME | (winsound.SND_ASYNC if async_mode else 0)
            winsound.PlaySound(path, flags)
            return True
        except Exception: pass
    return False

def register_cuda_dlls():
    p = Path(sys.prefix) / "Lib" / "site-packages" / "nvidia"
    if p.exists():
        for b in p.glob("*/bin"):
            if b.is_dir():
                try:
                    os.add_dll_directory(str(b.resolve()))
                    os.environ["PATH"] = str(b.resolve()) + os.pathsep + os.environ.get("PATH", "")
                except Exception: pass

register_cuda_dlls()

try: import edge_tts; HAS_EDGE_TTS = True
except Exception: HAS_EDGE_TTS = False
try: import pyttsx3; HAS_PYTTSX3 = True
except Exception: HAS_PYTTSX3 = False

import numpy as np, torch, sounddevice as sd, soundfile as sf
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
WHISPER_MODEL_SIZE = "${config.whisperModel}"
COMPUTE_TYPE = "${config.computeType}"
SILERO_SPEAKER = "${config.sileroSpeaker}"
SILERO_SAMPLE_RATE = ${config.sileroSampleRate}
VAD_THRESHOLD_DEFAULT = ${config.vadThreshold}
PHRASE_MAX_SEC = 4.5
SILERO_SPEED_FACTOR = 1.22

NEURAL_VOICES = {
    "Авто-подбор под мой образец": "auto",
    "Andrew Neural (Мужской ~112 Гц)": "en-US-AndrewNeural",
    "Brian Neural (Тёплый ~118 Гц)": "en-US-BrianNeural",
    "Eric Neural (Баритон ~98 Гц)": "en-US-EricNeural",
    "Christopher Neural (~120 Гц)": "en-US-ChristopherNeural",
    "Guy Neural (~128 Гц)": "en-US-GuyNeural",
    "Ryan Neural (Британский ~115 Гц)": "en-GB-RyanNeural",
    "Jenny Neural (Женский меццо ~185 Гц)": "en-US-JennyNeural",
    "Aria Neural (Женский сопрано ~205 Гц)": "en-US-AriaNeural",
}

HALLUCINATIONS = ("dimatorzok", "субтитры", "редактор", "спасибо за просмотр", "подпишись", "amara.org", "subtitles by")
`;
}

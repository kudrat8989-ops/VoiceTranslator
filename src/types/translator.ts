export type CudaProfile = "pt251_cu121" | "pt260_cu128";
export type WhisperModelSize = "large-v3-turbo" | "medium" | "small" | "base";
export type ComputeType = "float16" | "int8_float16" | "int8";
export type MicTtsMode = "mywo_adapted" | "pyttsx3" | "text_only";
export type MicOutputRoute = "auto_vbcable_or_mute" | "vbcable_only" | "mute_local" | "local_headphones";
export type SileroSpeaker = "aidar" | "baya" | "kseniya" | "xenia" | "eugene";
export type LoopbackBackend = "pyaudiowpatch" | "sounddevice";
export type VoiceBaseGender = "auto" | "male" | "female";

export interface ProjectConfig {
  projectDir: string;
  pythonCmd: string;
  cudaProfile: CudaProfile;
  micDeviceIndex: number;
  secondaryMicDeviceIndex: number | null;
  preferredMicName: string;
  headphonesOutputIndex: number | null;
  loopbackDeviceIndex: number | null;
  loopbackBackend: LoopbackBackend;
  whisperModel: WhisperModelSize;
  computeType: ComputeType;
  micTtsMode: MicTtsMode;
  micOutputRoute: MicOutputRoute;
  voiceSampleFile: string;
  voiceAdaptStrength: number;
  voicePitchSemitones: number;
  voiceBaseGender: VoiceBaseGender;
  sileroSpeaker: SileroSpeaker;
  sileroSampleRate: 48000 | 24000;
  vadThreshold: number;
  phraseDurationSec: number;
  deleteMyVoiceWav: boolean;
  alwaysOnTopGui: boolean;
  hearMyEnglishInHeadphones: boolean;
}

export interface StepCompletionState {
  step1_clean: boolean;
  step1_reqs: boolean;
  step2_venv: boolean;
  step2_pytorch: boolean;
  step2_engines: boolean;
  step3_audio: boolean;
  step4_mic: boolean;
  step4_loopback: boolean;
  step4_runbat: boolean;
}

export type ScriptFileKey =
  | "translator_gui.py"
  | "vt_dsp_core.py"
  | "step5_install_vbcable.bat"
  | "run.bat"
  | "translator_mic.py"
  | "translator_loopback.py"
  | "check_devices.py"
  | "step3_check_audio.bat"
  | "requirements.txt"
  | "step1_clean.bat"
  | "step2_1_create_venv.bat"
  | "step2_2_install_pytorch.bat"
  | "step2_3_install_engines.bat";

export interface LiveTranslationEntry {
  id: string;
  timestamp: string;
  channel: "mic_ru_en" | "loopback_en_ru";
  sourceText: string;
  translatedText: string;
  latencyMs: number;
  ttsPlayed: boolean;
}

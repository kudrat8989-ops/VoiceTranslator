import { ProjectConfig } from "../../../types/translator";
import { toCrLf } from "../common";

export function generateStep2PytorchBat(config: ProjectConfig): string {
  const cu = config.cudaProfile === "pt260_cu128" ? "cu128" : "cu121";
  const url = cu === "cu128"
    ? "https://download.pytorch.org/whl/cu128"
    : "https://download.pytorch.org/whl/cu121";

  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 2.2: Установка PyTorch (${cu}) для RTX 5070 Ti
cd /d "%~dp0"
if not exist "venv\\Scripts\\python.exe" if exist "${config.projectDir}" cd /d "${config.projectDir}"
if not exist "venv\\Scripts\\python.exe" (
    echo [ОШИБКА] venv не найден! Сначала выполните ШАГ 2.1.
    pause
    exit /b 1
)
set CUDA_FORCE_PTX_JIT=1
set TORCH_CUDA_ARCH_LIST=12.0;9.0;8.9;8.6
set PYTHONWARNINGS=ignore::UserWarning:torch.cuda
echo ========================================================
echo   ШАГ 2.2: Установка PyTorch + CUDA (${cu})
echo ========================================================
venv\\Scripts\\python.exe -m pip install torch torchvision torchaudio --index-url ${url}
venv\\Scripts\\python.exe -c "import warnings; warnings.filterwarnings('ignore', category=UserWarning, module='torch.cuda'); import torch; print('[OK] CUDA доступна:', torch.cuda.is_available()); print('[OK] Видеокарта:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
pause
`);
}

export function generateStep2EnginesBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 2.3: Установка Faster-Whisper, SoundDevice, CUDA DLL и TTS
cd /d "%~dp0"
if not exist "venv\\Scripts\\python.exe" if exist "${config.projectDir}" cd /d "${config.projectDir}"
if not exist "venv\\Scripts\\python.exe" (
    echo [ОШИБКА] venv не найден! Сначала выполните ШАГ 2.1.
    pause
    exit /b 1
)
set CUDA_FORCE_PTX_JIT=1
set TORCH_CUDA_ARCH_LIST=12.0;9.0;8.9;8.6
set PYTHONWARNINGS=ignore::UserWarning:torch.cuda
echo ========================================================
echo   ШАГ 2.3: Установка аудио-библиотек и CUDA DLL
echo ========================================================
venv\\Scripts\\python.exe -m pip install faster-whisper sounddevice soundfile pyaudiowpatch edge-tts pyttsx3 colorama omegaconf nvidia-cublas-cu12 nvidia-cudnn-cu12
echo.
echo Предзагрузка Silero TTS...
venv\\Scripts\\python.exe -c "import torch; torch.hub.load(repo_or_dir='snakers4/silero-models', model='silero_tts', language='ru', speaker='v4_ru')"
echo Все движки и библиотеки CUDA cublas64_12 установлены!
pause
`);
}

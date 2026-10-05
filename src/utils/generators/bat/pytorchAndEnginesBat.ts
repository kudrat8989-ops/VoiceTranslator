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
cd /d "${config.projectDir}"
echo ========================================================
echo   ШАГ 2.2: Установка PyTorch + CUDA (${cu})
echo ========================================================
venv\\Scripts\\python.exe -m pip install torch torchvision torchaudio --index-url ${url}
venv\\Scripts\\python.exe -c "import torch; print('CUDA доступна:', torch.cuda.is_available()); print('Устройство:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
pause
`);
}

export function generateStep2EnginesBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 2.3: Установка Faster-Whisper, SoundDevice и TTS
cd /d "${config.projectDir}"
echo ========================================================
echo   ШАГ 2.3: Установка аудио-библиотек и моделей
echo ========================================================
venv\\Scripts\\python.exe -m pip install -r requirements.txt
echo Предзагрузка Silero TTS...
venv\\Scripts\\python.exe -c "import torch; torch.hub.load(repo_or_dir='snakers4/silero-models', model='silero_tts', language='ru', speaker='v4_ru')"
echo Все движки установлены!
pause
`);
}

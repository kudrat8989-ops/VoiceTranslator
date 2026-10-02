import { ProjectConfig } from "../../types/translator";
import { toCrLf } from "./common";

export function generateRequirementsTxt(config: ProjectConfig): string {
  return toCrLf(`# VoiceTranslator Dependencies (RTX 5070 Ti) — Sample: ${config.voiceSampleFile}
faster-whisper>=1.1.0
ctranslate2>=4.5.0
nvidia-cublas-cu12
nvidia-cudnn-cu12==9.*
sounddevice>=0.5.1
soundfile>=0.12.1
PyAudioWPatch>=0.2.12.6
numpy>=1.26.4,<2.0.0
omegaconf>=2.3.0
packaging>=24.0
pyttsx3>=2.98
colorama>=0.4.6
`);
}

export function generateStep5InstallVbCableBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
title STEP 5 - Install VB-Cable Virtual Microphone
if not exist "${config.projectDir}" mkdir "${config.projectDir}"
cd /d "${config.projectDir}"
if not exist "vbcable_setup" mkdir "vbcable_setup"
cd /d "${config.projectDir}\\vbcable_setup"

echo [1/3] Downloading official VB-Audio Virtual Cable package...
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack43.zip' -OutFile 'VBCABLE_Driver_Pack43.zip'"
if not exist "VBCABLE_Driver_Pack43.zip" goto :dl_err

echo [2/3] Extracting VBCABLE_Driver_Pack43.zip...
powershell -NoProfile -Command "Expand-Archive -Path 'VBCABLE_Driver_Pack43.zip' -DestinationPath '.' -Force"
if not exist "VBCABLE_Setup_x64.exe" goto :dl_err

echo [3/3] Launching VBCABLE_Setup_x64.exe as Administrator...
powershell -NoProfile -Command "Start-Process -FilePath 'VBCABLE_Setup_x64.exe' -Verb RunAs -Wait"
echo VB-CABLE INSTALLATION COMPLETE!
pause
exit /b 0

:dl_err
echo [ERROR] Could not download VBCABLE_Driver_Pack43.zip automatically.
pause
exit /b 1
`);
}

export function generateStep1CleanBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
title STEP 1 - Clean Old Environment
if not exist "${config.projectDir}" mkdir "${config.projectDir}"
cd /d "${config.projectDir}"
taskkill /F /IM python.exe /T >nul 2>&1
if exist "venv" rmdir /s /q "venv"
echo [OK] Step 1 finished. Voice sample ${config.voiceSampleFile} preserved.
pause
`);
}

export function generateStep2_1CreateVenvBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
title STEP 2.1 - Create Clean Python venv
if not exist "${config.projectDir}" mkdir "${config.projectDir}"
cd /d "${config.projectDir}"
${config.pythonCmd} -m venv venv
if not exist "venv\\Scripts\\python.exe" py -3.10 -m venv venv
if not exist "venv\\Scripts\\python.exe" py -m venv venv
"venv\\Scripts\\python.exe" -m pip install --upgrade pip wheel setuptools
echo [OK] Step 2.1 finished.
pause
`);
}

export function generateStep2_2InstallPytorchBat(config: ProjectConfig): string {
  const pipCmd =
    config.cudaProfile === "pt251_cu121"
      ? `"venv\\Scripts\\python.exe" -m pip install torch==2.5.1+cu121 torchaudio==2.5.1+cu121 --index-url https://download.pytorch.org/whl/cu121`
      : `"venv\\Scripts\\python.exe" -m pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128`;

  return toCrLf(`@echo off
title STEP 2.2 - Install PyTorch + CUDA
cd /d "${config.projectDir}"
${pipCmd}
"venv\\Scripts\\python.exe" -c "import torch; print('CUDA available:', torch.cuda.is_available())"
pause
`);
}

export function generateStep2_3InstallEnginesBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
title STEP 2.3 - Install Faster-Whisper, SoundDevice and Silero TTS
cd /d "${config.projectDir}"
"venv\\Scripts\\python.exe" -m pip install -r requirements.txt
"venv\\Scripts\\python.exe" -c "import torch; torch.hub.load(repo_or_dir='snakers4/silero-models', model='silero_tts', language='ru', speaker='v4_ru')"
echo [OK] Step 2.3 finished!
pause
`);
}

export function generateStep3CheckAudioBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title STEP 3 - Audio Devices Check
cd /d "${config.projectDir}"
"venv\\Scripts\\python.exe" check_devices.py
pause
`);
}

export function generateRunBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
title VoiceTranslator Monitor GUI v2.3 Launcher
cd /d "${config.projectDir}"
if not exist "venv\\Scripts\\python.exe" goto :no_venv
set CUDA_MODULE_LOADING=LAZY
set HF_HUB_DISABLE_SYMLINKS_WARNING=1
if exist "translator_gui.py" (
    start "VoiceTranslator Monitor GUI" "venv\\Scripts\\python.exe" translator_gui.py
    exit /b 0
)
start "VoiceTranslator - MIC" cmd /k "chcp 65001 >nul && cd /d "${config.projectDir}" && venv\\Scripts\\python.exe translator_mic.py"
timeout /t 4 /nobreak >nul
start "VoiceTranslator - LOOPBACK" cmd /k "chcp 65001 >nul && cd /d "${config.projectDir}" && venv\\Scripts\\python.exe translator_loopback.py"
exit /b 0

:no_venv
echo [ERROR] venv\\Scripts\\python.exe not found in %CD%!
pause
exit /b 1
`);
}

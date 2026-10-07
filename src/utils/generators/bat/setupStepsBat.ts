import { ProjectConfig } from "../../../types/translator";
import { toCrLf } from "../common";

export function generateRequirementsTxt(_config: ProjectConfig): string {
  return toCrLf(`# VoiceTranslator v2.4 Dependencies (RTX 5070 Ti)
faster-whisper
sounddevice
soundfile
pyaudiowpatch
edge-tts
pyttsx3
colorama
omegaconf
nvidia-cublas-cu12
nvidia-cudnn-cu12
`);
}

export function generateStep1CleanBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 1: Очистка старого venv
cd /d "%~dp0"
if not exist "requirements.txt" if exist "${config.projectDir}" cd /d "${config.projectDir}"
echo ========================================================
echo   ШАГ 1: Завершение старых процессов и очистка venv
echo   Рабочая папка: %CD%
echo ========================================================
taskkill /F /IM python.exe 2>nul
taskkill /F /IM py.exe 2>nul
if exist "venv" (
    echo Удаление старой папки venv...
    rd /s /q "venv"
)
echo Очистка завершена успешно!
pause
`);
}

export function generateStep3CheckAudioBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 3: Проверка микрофонов Windows
cd /d "%~dp0"
if not exist "venv\\Scripts\\python.exe" if exist "${config.projectDir}" cd /d "${config.projectDir}"
if not exist "venv\\Scripts\\python.exe" (
    echo [ОШИБКА] venv не найден! Сначала выполните ШАГ 2.1.
    pause
    exit /b 1
)
if not exist "check_devices.py" (
    echo [ИНФО] check_devices.py не найден в папке %CD%.
    echo Запуск экспресс-проверки через sounddevice...
    echo ----------------------------------------------------
    venv\\Scripts\\python.exe -c "import sounddevice as sd; print(sd.query_devices())"
    echo ----------------------------------------------------
    echo [ВНИМАНИЕ] Распакуйте все файлы из архива VoiceTranslator_v2.4.zip
    echo или запустите unpack_from_zero.bat, чтобы появились файлы программы.
) else (
    venv\\Scripts\\python.exe check_devices.py
)
pause
`);
}

export function generateStep5InstallVbCableBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 5: Установка VB-CABLE
cd /d "%~dp0"
if not exist "requirements.txt" if exist "${config.projectDir}" cd /d "${config.projectDir}"
echo Скачивание и установка VB-CABLE Driver...
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack43.zip' -OutFile 'VBCABLE.zip'; Expand-Archive -Path 'VBCABLE.zip' -DestinationPath '.' -Force; Start-Process -FilePath 'VBCABLE_Setup_x64.exe' -Verb RunAs -Wait"
pause
`);
}

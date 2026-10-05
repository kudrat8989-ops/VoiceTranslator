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
`);
}

export function generateStep1CleanBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 1: Очистка старого venv
cd /d "${config.projectDir}"
echo ========================================================
echo   ШАГ 1: Завершение старых процессов и очистка venv
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

export function generateStep2VenvBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 2.1: Создание venv
cd /d "${config.projectDir}"
echo ========================================================
echo   ШАГ 2.1: Создание виртуального окружения
echo ========================================================
python -m venv venv
if not exist "venv\\Scripts\\python.exe" (
    echo ОШИБКА: venv не создан. Убедитесь, что Python 3.10+ добавлен в PATH.
    pause
    exit /b 1
)
venv\\Scripts\\python.exe -m pip install --upgrade pip setuptools wheel
echo venv готов!
pause
`);
}

export function generateStep3CheckAudioBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 3: Проверка микрофонов Windows
cd /d "${config.projectDir}"
venv\\Scripts\\python.exe check_devices.py
pause
`);
}

export function generateStep5InstallVbCableBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title ШАГ 5: Установка VB-CABLE
cd /d "${config.projectDir}"
echo Скачивание и установка VB-CABLE Driver...
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack43.zip' -OutFile 'VBCABLE.zip'; Expand-Archive -Path 'VBCABLE.zip' -DestinationPath '.' -Force; Start-Process -FilePath 'VBCABLE_Setup_x64.exe' -Verb RunAs -Wait"
pause
`);
}

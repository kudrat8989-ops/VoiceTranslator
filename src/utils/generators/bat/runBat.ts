import { ProjectConfig } from "../../../types/translator";
import { toCrLf } from "../common";

export function generateRunBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title VoiceTranslator Desktop v2.4 (RTX 5070 Ti)

cd /d "%~dp0"
if not exist "venv\\Scripts\\python.exe" if exist "${config.projectDir}" cd /d "${config.projectDir}"

echo ========================================================
echo   VoiceTranslator v2.4 (RTX 5070 Ti)
echo   Рабочая папка: %CD%
echo ========================================================

if not exist "venv\\Scripts\\python.exe" (
    echo [ОШИБКА] venv не найден в %CD%!
    pause
    exit /b 1
)

:: Настройка системных путей NVIDIA и PyTorch
if exist "venv\\Lib\\site-packages\\nvidia\\cublas\\bin" set "PATH=%CD%\\venv\\Lib\\site-packages\\nvidia\\cublas\\bin;%PATH%"
if exist "venv\\Lib\\site-packages\\nvidia\\cudnn\\bin" set "PATH=%CD%\\venv\\Lib\\site-packages\\nvidia\\cudnn\\bin;%PATH%"
if exist "venv\\Lib\\site-packages\\torch\\lib" set "PATH=%PATH%;%CD%\\venv\\Lib\\site-packages\\torch\\lib"

set CUDA_MODULE_LOADING=LAZY
set HF_HUB_DISABLE_SYMLINKS_WARNING=1
set CUDA_FORCE_PTX_JIT=1
set TORCH_CUDA_ARCH_LIST=12.0;9.0;8.9;8.6
set PYTHONWARNINGS=ignore::UserWarning:torch.cuda

echo Запуск графического интерфейса VoiceTranslator...
venv\\Scripts\\python.exe translator_gui.py
set "EXIT_CODE=%ERRORLEVEL%"

if %EXIT_CODE% NEQ 0 (
    echo.
    echo ========================================================
    echo  Программа завершилась с кодом ошибки: %EXIT_CODE%
    echo ========================================================
    pause
    exit /b %EXIT_CODE%
)
`);
}

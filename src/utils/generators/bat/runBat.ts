import { ProjectConfig } from "../../../types/translator";
import { toCrLf } from "../common";

export function generateRunBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title VoiceTranslator Desktop Monitor v2.4 (RTX 5070 Ti)

if exist "%~dp0venv\\Scripts\\python.exe" cd /d "%~dp0"
if not exist "venv\\Scripts\\python.exe" cd /d "${config.projectDir}"

if not exist "venv\\Scripts\\python.exe" (
    echo [ERROR] Virtual environment (venv) not found!
    echo Please run step1, step2_1, step2_2, step2_3 first.
    pause
    exit /b 1
)

set CUDA_MODULE_LOADING=LAZY
set HF_HUB_DISABLE_SYMLINKS_WARNING=1

if not exist "translator_gui.py" (
    echo [WARNING] translator_gui.py not found in %CD%.
    echo Launching separate CLI windows instead...
    start "VoiceTranslator - MIC" cmd /k "chcp 65001 >nul && venv\\Scripts\\python.exe translator_mic.py"
    start "VoiceTranslator - LOOPBACK" cmd /k "chcp 65001 >nul && venv\\Scripts\\python.exe translator_loopback.py"
    pause
    exit /b 0
)

echo Launching VoiceTranslator Monitor GUI...
venv\\Scripts\\python.exe translator_gui.py
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% NEQ 0 (
    echo.
    echo ========================================================
    echo  [APPLICATION CRASHED] Exit Code: %EXIT_CODE%
    echo  Review the traceback above to find the exact issue.
    echo ========================================================
    echo.
    pause
)
`);
}

import { ProjectConfig } from "../../../types/translator";
import { toCrLf } from "../common";

export function generateStep2VenvBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title ШАГ 2.1: Создание виртуального окружения (venv)

cd /d "%~dp0"
if not exist "requirements.txt" (
    if exist "${config.projectDir}" cd /d "${config.projectDir}"
)

echo ========================================================
echo   ШАГ 2.1: Поиск Python 3.10 / 3.12 и создание venv
echo   Рабочая папка: %CD%
echo ========================================================

set "PY_CMD="

if exist "%LOCALAPPDATA%\\Programs\\Python\\Python310\\python.exe" set "PY_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python310\\python.exe"
if "!PY_CMD!"=="" if exist "%LOCALAPPDATA%\\Programs\\Python\\Python312\\python.exe" set "PY_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python312\\python.exe"
if "!PY_CMD!"=="" if exist "%LOCALAPPDATA%\\Programs\\Python\\Python311\\python.exe" set "PY_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python311\\python.exe"
if "!PY_CMD!"=="" if exist "%LOCALAPPDATA%\\Programs\\Python\\Python313\\python.exe" set "PY_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python313\\python.exe"
if "!PY_CMD!"=="" if exist "C:\\Python310\\python.exe" set "PY_CMD=C:\\Python310\\python.exe"
if "!PY_CMD!"=="" if exist "C:\\Python312\\python.exe" set "PY_CMD=C:\\Python312\\python.exe"
if "!PY_CMD!"=="" if exist "%ProgramFiles%\\Python310\\python.exe" set "PY_CMD=%ProgramFiles%\\Python310\\python.exe"
if "!PY_CMD!"=="" if exist "%ProgramFiles%\\Python312\\python.exe" set "PY_CMD=%ProgramFiles%\\Python312\\python.exe"

if "!PY_CMD!"=="" where python.exe >nul 2>&1 && set "PY_CMD=python"
if "!PY_CMD!"=="" where py.exe >nul 2>&1 && set "PY_CMD=py"

if "!PY_CMD!"=="" (
    echo.
    echo [!] Python не найден автоматически в стандартных папках.
    echo Пример пути:
    echo   C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python310\\python.exe
    echo.
    set /p "RAW_PATH=Перетащите сюда python.exe или вставьте путь: "
    set "RAW_PATH=!RAW_PATH:"=!"
    if exist "!RAW_PATH!\\python.exe" set "RAW_PATH=!RAW_PATH!\\python.exe"
    if exist "!RAW_PATH!" set "PY_CMD=!RAW_PATH!"
)

if "!PY_CMD!"=="" (
    echo.
    echo ========================================================
    echo   [ОШИБКА] Файл python.exe не найден!
    echo ========================================================
    echo Проверьте папку C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\
    pause
    exit /b 1
)

echo.
echo [OK] Найден интерпретатор: "!PY_CMD!"
"!PY_CMD!" -c "import sys; print(f'Версия: {sys.version}')"
if errorlevel 1 (
    echo [ОШИБКА] Не удалось запустить интерпретатор по указанному пути.
    pause
    exit /b 1
)

echo.
echo Создание виртуального окружения в папке venv...
"!PY_CMD!" -m venv venv

if not exist "venv\\Scripts\\python.exe" (
    echo.
    echo ========================================================
    echo   [ОШИБКА] Не удалось создать venv в папке %CD%
    echo ========================================================
    pause
    exit /b 1
)

echo [OK] venv успешно создан!
echo Обновление pip, setuptools и wheel...
venv\\Scripts\\python.exe -m pip install --upgrade pip setuptools wheel
echo.
echo ========================================================
echo   ШАГ 2.1 УСПЕШНО ЗАВЕРШЁН! Переходите к шагу 2.2
echo ========================================================
pause
`);
}

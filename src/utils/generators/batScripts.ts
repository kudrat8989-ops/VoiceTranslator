import { ProjectConfig } from "../../types/translator";
import { toCrLf } from "./common";

export function generateRequirementsTxt(config: ProjectConfig): string {
  return toCrLf(`# =====================================================================
# VoiceTranslator v2.3 — Clean Dependencies (NO coqui-tts / NO XTTS-v2)
# Target GPU: NVIDIA GeForce RTX 5070 Ti (CUDA)
# Default Voice Sample: ${config.voiceSampleFile}
# =====================================================================

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

edge-tts>=6.1.12
pyttsx3>=2.98
colorama>=0.4.6
`);
}

export function generateStep1CleanBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
title STEP 1 - Clean Old Environment
echo ============================================================================
echo   STEP 1: FULL CLEANUP OF OLD VENV AND HANGING PYTHON PROCESSES
echo   Working folder: ${config.projectDir}
echo   Voice sample ${config.voiceSampleFile} is PRESERVED!
echo ============================================================================
echo.

if not exist "${config.projectDir}" mkdir "${config.projectDir}"
cd /d "${config.projectDir}"
echo Current directory: %CD%
echo.

echo [1/2] Stopping any hanging python.exe processes...
taskkill /F /IM python.exe /T >nul 2>&1
echo Done.
echo.

echo [2/2] Checking for old venv folder...
if not exist "venv" goto :no_venv
echo Deleting old venv folder, please wait 5-15 seconds...
rmdir /s /q "venv"
if exist "venv" goto :venv_locked
echo [OK] Old venv folder was completely deleted!
goto :done

:no_venv
echo [OK] No old venv folder found - directory is already clean.
goto :done

:venv_locked
echo [WARNING] Some files in venv are still locked by another program.
echo Close any open terminals or IDEs and run step1_clean.bat again.
pause
exit /b 1

:done
if exist "${config.voiceSampleFile}" echo [OK] Voice sample ${config.voiceSampleFile} found and kept safe!
echo.
echo ============================================================================
echo   STEP 1 FINISHED SUCCESSFULLY!
echo   Next: Run step2_1_create_venv.bat
echo ============================================================================
pause
exit /b 0
`);
}

export function generateStep2_1CreateVenvBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
title STEP 2.1 - Create Clean Python venv
echo ============================================================================
echo   STEP 2.1: CREATING CLEAN PYTHON VIRTUAL ENVIRONMENT
echo   Working folder: ${config.projectDir}
echo ============================================================================
echo.

if not exist "${config.projectDir}" mkdir "${config.projectDir}"
cd /d "${config.projectDir}"
echo Current directory: %CD%
echo.

echo Detecting installed Python on your PC...
echo.

${config.pythonCmd} --version >nul 2>&1
if not errorlevel 1 goto :use_configured

py -3.10 --version >nul 2>&1
if not errorlevel 1 goto :use_py310

if exist "%LOCALAPPDATA%\\Programs\\Python\\Python310\\python.exe" goto :use_appdata310
if exist "C:\\Python310\\python.exe" goto :use_c_py310

py --version >nul 2>&1
if not errorlevel 1 goto :use_py_generic

goto :no_python_found

:use_configured
echo [FOUND] Using command: ${config.pythonCmd}
${config.pythonCmd} --version
echo Creating venv folder...
${config.pythonCmd} -m venv venv
goto :verify_venv

:use_py310
echo [FOUND] Using Python Launcher: py -3.10
py -3.10 --version
echo Creating venv folder...
py -3.10 -m venv venv
goto :verify_venv

:use_appdata310
echo [FOUND] Using AppData Python 3.10: %LOCALAPPDATA%\\Programs\\Python\\Python310\\python.exe
"%LOCALAPPDATA%\\Programs\\Python\\Python310\\python.exe" --version
echo Creating venv folder...
"%LOCALAPPDATA%\\Programs\\Python\\Python310\\python.exe" -m venv venv
goto :verify_venv

:use_c_py310
echo [FOUND] Using C:\\Python310\\python.exe
"C:\\Python310\\python.exe" --version
echo Creating venv folder...
"C:\\Python310\\python.exe" -m venv venv
goto :verify_venv

:use_py_generic
echo [FOUND] Using Windows py launcher
py --version
echo Creating venv folder...
py -m venv venv
goto :verify_venv

:no_python_found
echo [ERROR] Python was not found in PATH or standard folders!
echo Please check where python.exe is installed on your PC.
pause
exit /b 1

:verify_venv
echo.
if not exist "venv\\Scripts\\python.exe" goto :venv_failed

echo [OK] Virtual environment created!
echo Upgrading pip, wheel, and setuptools inside venv...
"venv\\Scripts\\python.exe" -m pip install --upgrade pip wheel setuptools
echo.
echo ============================================================================
echo   STEP 2.1 FINISHED SUCCESSFULLY!
echo   Verified file exists: %CD%\\venv\\Scripts\\python.exe
echo   Next: Run step2_2_install_pytorch.bat
echo ============================================================================
pause
exit /b 0

:venv_failed
echo [ERROR] Failed to create venv\\Scripts\\python.exe!
pause
exit /b 1
`);
}

export function generateStep2_2InstallPytorchBat(config: ProjectConfig): string {
  const pipCmd =
    config.cudaProfile === "pt251_cu121"
      ? `"venv\\Scripts\\python.exe" -m pip install torch==2.5.1+cu121 torchaudio==2.5.1+cu121 --index-url https://download.pytorch.org/whl/cu121`
      : `"venv\\Scripts\\python.exe" -m pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128`;

  return toCrLf(`@echo off
title STEP 2.2 - Install PyTorch + CUDA for RTX 5070 Ti
echo ============================================================================
echo   STEP 2.2: INSTALLING PYTORCH + CUDA INTO VENV
echo   Working folder: ${config.projectDir}
echo ============================================================================
echo.

cd /d "${config.projectDir}"
if not exist "venv\\Scripts\\python.exe" goto :no_venv

echo Installing PyTorch with CUDA support...
echo Command: ${pipCmd}
echo.
${pipCmd}
if errorlevel 1 goto :install_err

echo.
echo Testing GPU visibility inside venv...
"venv\\Scripts\\python.exe" -c "import torch; print('--- PYTORCH CHECK ---'); print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('Device name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NO GPU')"
echo.
echo ============================================================================
echo   STEP 2.2 FINISHED SUCCESSFULLY!
echo   Next: Run step2_3_install_engines.bat
echo ============================================================================
pause
exit /b 0

:no_venv
echo [ERROR] venv\\Scripts\\python.exe not found in %CD%!
echo Please run step2_1_create_venv.bat first.
pause
exit /b 1

:install_err
echo [ERROR] PyTorch installation returned an error code.
pause
exit /b 1
`);
}

export function generateStep2_3InstallEnginesBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
title STEP 2.3 - Install Faster-Whisper, SoundDevice and Silero TTS
echo ============================================================================
echo   STEP 2.3: INSTALLING FASTER-WHISPER, SOUNDDEVICE AND SILERO TTS
echo   Working folder: ${config.projectDir}
echo ============================================================================
echo.

cd /d "${config.projectDir}"
if not exist "venv\\Scripts\\python.exe" goto :no_venv
if not exist "requirements.txt" goto :no_reqs

echo [1/2] Installing packages from requirements.txt...
"venv\\Scripts\\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :pip_err

echo.
echo [2/2] Pre-downloading and verifying Silero TTS v4_ru model...
"venv\\Scripts\\python.exe" -c "import torch; m, _ = torch.hub.load(repo_or_dir='snakers4/silero-models', model='silero_tts', language='ru', speaker='v4_ru'); print('[OK] Silero TTS v4_ru cached and ready!')"
if errorlevel 1 goto :silero_err

echo.
echo ============================================================================
echo   STEP 2.3 FINISHED SUCCESSFULLY!
echo   All engines are installed.
echo   Next: Run step3_check_audio.bat or run.bat!
echo ============================================================================
pause
exit /b 0

:no_venv
echo [ERROR] venv\\Scripts\\python.exe not found! Run step2_1_create_venv.bat first.
pause
exit /b 1

:no_reqs
echo [ERROR] requirements.txt not found in %CD%!
pause
exit /b 1

:pip_err
echo [ERROR] Failed to install packages from requirements.txt.
pause
exit /b 1

:silero_err
echo [WARNING] Package installation succeeded, but Silero model download had an issue.
pause
exit /b 1
`);
}

export function generateStep3CheckAudioBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title STEP 3 - Audio Devices and Voice Sample (${config.voiceSampleFile}) Check
cd /d "${config.projectDir}"
if not exist "venv\\Scripts\\python.exe" goto :no_venv

"venv\\Scripts\\python.exe" check_devices.py
echo.
pause
exit /b 0

:no_venv
echo [ERROR] venv\\Scripts\\python.exe not found in %CD%!
echo Please complete Step 2.1 first.
pause
exit /b 1
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

export function generateRunBat(config: ProjectConfig): string {
  return toCrLf(`@echo off
chcp 65001 >nul
title VoiceTranslator Desktop Monitor v2.4 (RTX 5070 Ti)

if exist "%~dp0venv\\Scripts\\python.exe" cd /d "%~dp0"
if not exist "venv\\Scripts\\python.exe" if exist "${config.projectDir}\\venv\\Scripts\\python.exe" cd /d "${config.projectDir}"

echo ============================================================================
echo   STARTING VOICETRANSLATOR DESKTOP MONITOR v2.4
echo   Folder: %CD%
echo ============================================================================
echo.

if not exist "venv\\Scripts\\python.exe" goto :no_venv

set CUDA_MODULE_LOADING=LAZY
set HF_HUB_DISABLE_SYMLINKS_WARNING=1

if not exist "translator_gui.py" goto :no_gui_file

for %%F in ("translator_gui.py") do set "GUI_SIZE=%%~zF"
if "%GUI_SIZE%"=="0" goto :gui_empty

echo [1/2] Verifying Python and CUDA environment...
"venv\\Scripts\\python.exe" -c "import torch; print('  [OK] PyTorch', torch.__version__, '| CUDA available:', torch.cuda.is_available())" 2>nul
if errorlevel 1 (
    echo [WARNING] PyTorch or CUDA test returned non-zero code. Attempting to start GUI anyway...
)

echo [2/2] Launching GUI window (translator_gui.py)...
echo.
"venv\\Scripts\\python.exe" translator_gui.py
set "APP_ERR=%ERRORLEVEL%"

if not "%APP_ERR%"=="0" (
    echo.
    echo ============================================================================
    echo   [ERROR] VoiceTranslator stopped with exit code %APP_ERR%.
    echo   Traceback and details are shown above.
    echo   If a package is missing, run: step2_3_install_engines.bat
    echo ============================================================================
    echo.
    pause
    exit /b %APP_ERR%
)

echo.
echo Application closed normally.
pause
exit /b 0

:no_gui_file
echo [WARNING] translator_gui.py not found in %CD%!
echo Starting background console workers instead...
start "VoiceTranslator - MIC" cmd /k "chcp 65001 >nul && venv\\Scripts\\python.exe translator_mic.py"
timeout /t 3 /nobreak >nul
start "VoiceTranslator - LOOPBACK" cmd /k "chcp 65001 >nul && venv\\Scripts\\python.exe translator_loopback.py"
exit /b 0

:gui_empty
echo.
echo ============================================================================
echo   [ERROR] translator_gui.py has 0 BYTES (damaged or empty file)!
echo   Please replace translator_gui.py with the full file from:
echo     - VoiceTranslator_v2.4.zip (Download from web UI)
echo     - Or download translator_gui.py directly from the web workbench
echo ============================================================================
echo.
pause
exit /b 1

:no_venv
echo.
echo ============================================================================
echo   [ERROR] Virtual environment venv\\Scripts\\python.exe not found in %CD%!
echo   Please run step2_1_create_venv.bat to set up the environment.
echo ============================================================================
echo.
pause
exit /b 1
`);
}

import { ProjectConfig, ScriptFileKey } from "../types/translator";
import { toCrLf } from "./generators/common";

function encodeBase64Lines(content: string): string[] {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 72) {
    lines.push(b64.slice(i, i + 72));
  }
  return lines;
}

export function buildOneClickPcUpdaterBat(
  config: ProjectConfig,
  generatedFiles: Record<ScriptFileKey, string>
): string {
  const filesToDeploy: Record<string, string> = {
    "vt_dsp_core.py": generatedFiles["vt_dsp_core.py"],
    "translator_gui.py": generatedFiles["translator_gui.py"],
    "run.bat": generatedFiles["run.bat"],
    "requirements.txt": generatedFiles["requirements.txt"],
    "translator_mic.py": generatedFiles["translator_mic.py"],
    "translator_loopback.py": generatedFiles["translator_loopback.py"],
    "check_devices.py": generatedFiles["check_devices.py"],
  };

  const blocks: string[] = [];
  for (const [filename, content] of Object.entries(filesToDeploy)) {
    const b64Lines = encodeBase64Lines(content);
    const tmpB64 = `${filename}.b64`;
    const tmpNew = `${filename}.tmp`;
    blocks.push(`echo [UPDATE] Unpacking ${filename}...`);
    blocks.push(`if exist "${tmpB64}" del /f /q "${tmpB64}"`);
    blocks.push(`if exist "${tmpNew}" del /f /q "${tmpNew}"`);
    for (const line of b64Lines) {
      blocks.push(`echo ${line}>>"${tmpB64}"`);
    }
    // Используем certutil с валидацией размера, не удаляя исходный файл до проверки!
    blocks.push(`certutil -f -decode "${tmpB64}" "${tmpNew}" >nul 2>&1`);
    blocks.push(`if not exist "${tmpNew}" (`);
    blocks.push(`  powershell -NoProfile -ExecutionPolicy Bypass -Command "$t=[IO.File]::ReadAllText('${tmpB64}'); [IO.File]::WriteAllBytes('${tmpNew}', [Convert]::FromBase64String($t))" >nul 2>&1`);
    blocks.push(`)`);
    blocks.push(`for %%F in ("${tmpNew}") do set "SZ=%%~zF"`);
    blocks.push(`if not "%SZ%"=="" if not "%SZ%"=="0" (`);
    blocks.push(`  move /y "${tmpNew}" "${filename}" >nul`);
    blocks.push(`  echo   [OK] ${filename} updated (size: %SZ% bytes)`);
    blocks.push(`) else (`);
    blocks.push(`  echo   [ERROR] Failed to unpack ${filename}. Existing version kept safe.`);
    blocks.push(`)`);
    blocks.push(`if exist "${tmpB64}" del /f /q "${tmpB64}"`);
    blocks.push(`if exist "${tmpNew}" del /f /q "${tmpNew}"`);
    blocks.push("");
  }

  return toCrLf(`@echo off
chcp 65001 >nul
title VoiceTranslator v2.4 - Safe PC Updater

echo ============================================================================
echo   VOICETRANSLATOR v2.4 - SAFE PC UPDATER
echo   Target directory: ${config.projectDir}
echo   Keeps intact: venv virtual environment and voice sample (${config.voiceSampleFile})
echo   Browser safe: NO process termination of external applications
echo ============================================================================
echo.

if exist "%~dp0venv\\Scripts\\python.exe" (
  cd /d "%~dp0"
) else (
  if not exist "${config.projectDir}" mkdir "${config.projectDir}"
  cd /d "${config.projectDir}"
)

echo Current working directory: %CD%
echo.

${blocks.join("\r\n")}

echo ============================================================================
echo   CHECKING SCRIPT INTEGRITY AFTER UPDATE:
echo ============================================================================
for %%F in ("translator_gui.py") do echo   translator_gui.py: %%~zF bytes
for %%F in ("vt_dsp_core.py") do echo   vt_dsp_core.py:    %%~zF bytes
for %%F in ("run.bat") do echo   run.bat:           %%~zF bytes
echo.

if not exist "venv\\Scripts\\python.exe" (
  echo [WARNING] venv\\Scripts\\python.exe not found! Run step2_1_create_venv.bat first.
  pause
  exit /b 1
)

echo Testing Python syntax of updated files...
"venv\\Scripts\\python.exe" -m py_compile translator_gui.py
if errorlevel 1 (
  echo [ERROR] translator_gui.py has a syntax error!
  pause
  exit /b 1
)
echo [OK] Syntax check passed!
echo.
echo ============================================================================
echo   UPDATE COMPLETED SUCCESSFULLY!
echo   Launching VoiceTranslator Monitor GUI v2.4...
echo ============================================================================
echo.
if exist "run.bat" (
  call run.bat
) else (
  "venv\\Scripts\\python.exe" translator_gui.py
  pause
)
`);
}

export function buildCleanFromScratchUnpackerBat(
  config: ProjectConfig,
  generatedFiles: Record<ScriptFileKey, string>
): string {
  const blocks: string[] = [];
  for (const [filename, content] of Object.entries(generatedFiles)) {
    const b64Lines = encodeBase64Lines(content);
    const tmpB64 = `${filename}.b64`;
    const tmpNew = `${filename}.tmp`;
    blocks.push(`echo [UNPACK] Extracting ${filename}...`);
    blocks.push(`if exist "${tmpB64}" del /f /q "${tmpB64}"`);
    blocks.push(`if exist "${tmpNew}" del /f /q "${tmpNew}"`);
    for (const line of b64Lines) {
      blocks.push(`echo ${line}>>"${tmpB64}"`);
    }
    blocks.push(`certutil -f -decode "${tmpB64}" "${tmpNew}" >nul 2>&1`);
    blocks.push(`if not exist "${tmpNew}" (`);
    blocks.push(`  powershell -NoProfile -ExecutionPolicy Bypass -Command "$t=[IO.File]::ReadAllText('${tmpB64}'); [IO.File]::WriteAllBytes('${tmpNew}', [Convert]::FromBase64String($t))" >nul 2>&1`);
    blocks.push(`)`);
    blocks.push(`for %%F in ("${tmpNew}") do set "SZ=%%~zF"`);
    blocks.push(`if not "%SZ%"=="" if not "%SZ%"=="0" (`);
    blocks.push(`  move /y "${tmpNew}" "${filename}" >nul`);
    blocks.push(`  echo   [OK] ${filename} extracted (%SZ% bytes)`);
    blocks.push(`) else (`);
    blocks.push(`  echo   [ERROR] Failed to extract ${filename}`);
    blocks.push(`)`);
    blocks.push(`if exist "${tmpB64}" del /f /q "${tmpB64}"`);
    blocks.push(`if exist "${tmpNew}" del /f /q "${tmpNew}"`);
    blocks.push("");
  }

  return toCrLf(`@echo off
chcp 65001 >nul
title STEP 0 - Safe Unpack All 13 Files for Clean Install
echo ============================================================================
echo   STEP 0: SAFE UNPACKING ALL 13 FILES INTO ${config.projectDir}
echo   Voice sample ${config.voiceSampleFile} is preserved if present.
echo ============================================================================
echo.

if exist "%~dp0venv\\Scripts\\python.exe" (
  cd /d "%~dp0"
) else (
  if not exist "${config.projectDir}" mkdir "${config.projectDir}"
  cd /d "${config.projectDir}"
)

${blocks.join("\r\n")}
echo ============================================================================
echo   [OK] ALL FILES UNPACKED TO: %CD%
echo   Now run the steps in order:
echo     1. step1_clean.bat
echo     2. step2_1_create_venv.bat
echo     3. step2_2_install_pytorch.bat
echo     4. step2_3_install_engines.bat
echo     5. step3_check_audio.bat
echo     6. run.bat
echo ============================================================================
pause
`);
}

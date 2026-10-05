import { ProjectConfig, ScriptFileKey } from "../types/translator";
import { toCrLf } from "./generators/common";

function encodeBase64Lines(content: string): string[] {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary), lines: string[] = [];
  for (let i = 0; i < b64.length; i += 72) lines.push(b64.slice(i, i + 72));
  return lines;
}

function generateUnpackBlocks(files: Record<string, string>): string {
  const blocks: string[] = [];
  for (const [filename, content] of Object.entries(files)) {
    const tmpB64 = `${filename}.b64`, tmpNew = `${filename}.tmp`;
    blocks.push(`echo [UNPACK] ${filename}...`);
    blocks.push(`if exist "${tmpB64}" del /f /q "${tmpB64}"`);
    blocks.push(`if exist "${tmpNew}" del /f /q "${tmpNew}"`);
    for (const line of encodeBase64Lines(content)) blocks.push(`echo ${line}>>"${tmpB64}"`);
    blocks.push(`certutil -f -decode "${tmpB64}" "${tmpNew}" >nul 2>&1`);
    blocks.push(`if not exist "${tmpNew}" powershell -NoProfile -Command "$t=[IO.File]::ReadAllText('${tmpB64}'); [IO.File]::WriteAllBytes('${tmpNew}', [Convert]::FromBase64String($t))" >nul 2>&1`);
    blocks.push(`for %%F in ("${tmpNew}") do set "SZ=%%~zF"`);
    blocks.push(`if not "%SZ%"=="" if not "%SZ%"=="0" ( move /y "${tmpNew}" "${filename}" >nul & echo   [OK] ${filename} (%SZ% bytes) ) else ( echo   [ERROR] Failed to unpack ${filename} )`);
    blocks.push(`if exist "${tmpB64}" del /f /q "${tmpB64}"`);
    blocks.push(`if exist "${tmpNew}" del /f /q "${tmpNew}"\r\n`);
  }
  return blocks.join("\r\n");
}

export function buildOneClickPcUpdaterBat(config: ProjectConfig, files: Record<ScriptFileKey, string>): string {
  const deploy: Record<string, string> = {
    "vt_dsp_core.py": files["vt_dsp_core.py"], "translator_gui.py": files["translator_gui.py"],
    "run.bat": files["run.bat"], "requirements.txt": files["requirements.txt"],
    "translator_mic.py": files["translator_mic.py"], "translator_loopback.py": files["translator_loopback.py"],
    "check_devices.py": files["check_devices.py"],
  };
  return toCrLf(`@echo off\r\nchcp 65001 >nul\r\ntitle VoiceTranslator v2.4 - Safe PC Updater\r\nif exist "%~dp0translator_gui.py" cd /d "%~dp0"\r\nif not exist "translator_gui.py" cd /d "${config.projectDir}"\r\necho Updating VoiceTranslator files...\r\n${generateUnpackBlocks(deploy)}\r\necho Update complete!\r\nif exist "run.bat" call run.bat\r\npause\r\n`);
}

export function buildCleanFromScratchUnpackerBat(config: ProjectConfig, files: Record<ScriptFileKey, string>): string {
  return toCrLf(`@echo off\r\nchcp 65001 >nul\r\ntitle VoiceTranslator v2.4 Clean Unpacker\r\nif not exist "${config.projectDir}" mkdir "${config.projectDir}"\r\ncd /d "${config.projectDir}"\r\necho Unpacking 13 files to ${config.projectDir}...\r\n${generateUnpackBlocks(files)}\r\necho All 13 files unpacked!\r\nexplorer .\r\npause\r\n`);
}

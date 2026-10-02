import { ProjectConfig, ScriptFileKey } from "../types/translator";
import { toCrLf } from "./generators/common";
import { buildGuiDspCorePy } from "./generators/guiDspCore";
import { buildGuiWindowClassPy } from "./generators/guiWindowClass";

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
  const dspCorePy = toCrLf(buildGuiDspCorePy(config));
  const modularGuiPy = toCrLf(
    `# -*- coding: utf-8 -*-\n` +
      `"""\n` +
      `VoiceTranslator Monitor GUI v2.3 — Модульное окно (импортирует ядро vt_dsp_core.py)\n` +
      `"""\n` +
      `from vt_dsp_core import *\n` +
      buildGuiWindowClassPy(config)
  );

  const filesToDeploy: Record<string, string> = {
    "vt_dsp_core.py": dspCorePy,
    "translator_gui.py": modularGuiPy,
    "run.bat": generatedFiles["run.bat"],
    "translator_mic.py": generatedFiles["translator_mic.py"],
    "translator_loopback.py": generatedFiles["translator_loopback.py"],
    "step5_install_vbcable.bat": generatedFiles["step5_install_vbcable.bat"],
  };

  const blocks: string[] = [];
  for (const [filename, content] of Object.entries(filesToDeploy)) {
    const b64Lines = encodeBase64Lines(content);
    const tmpB64 = `${filename}.b64`;
    blocks.push(`echo [UPDATE] Writing ${filename}...`);
    blocks.push(`if exist "${tmpB64}" del /f /q "${tmpB64}"`);
    blocks.push(`if exist "${filename}" del /f /q "${filename}"`);
    for (const line of b64Lines) {
      blocks.push(`echo ${line}>>"${tmpB64}"`);
    }
    blocks.push(`certutil -f -decode "${tmpB64}" "${filename}" >nul`);
    blocks.push(`if exist "${tmpB64}" del /f /q "${tmpB64}"`);
    blocks.push("");
  }

  return toCrLf(`@echo off
title VoiceTranslator v2.3 - One-Click PC Updater
echo ============================================================================
echo   AUTOMATIC TRANSFER OF VOICETRANSLATOR v2.3 UPDATES TO YOUR PC
echo   Target folder: ${config.projectDir}
echo   Preserves: venv folder and ${config.voiceSampleFile}
echo   Updates: vt_dsp_core.py, translator_gui.py, run.bat, mic/loopback scripts
echo ============================================================================
echo.

if not exist "${config.projectDir}" mkdir "${config.projectDir}"
cd /d "${config.projectDir}"

echo Closing old VoiceTranslator python window if running...
taskkill /FI "WINDOWTITLE eq VoiceTranslator*" /F >nul 2>&1

${blocks.join("\r\n")}
echo ============================================================================
echo   [OK] ALL MODULAR v2.3 FILES INSTALLED IN ${config.projectDir}!
echo   Launching VoiceTranslator Monitor GUI v2.3...
echo ============================================================================
if exist "run.bat" call run.bat
pause
`);
}

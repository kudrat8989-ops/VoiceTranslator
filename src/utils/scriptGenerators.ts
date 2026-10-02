import { ProjectConfig, ScriptFileKey } from "../types/translator";
import { toCrLf } from "./generators/common";
import { buildGuiDspCorePy } from "./generators/guiDspCore";
import { buildGuiWindowClassPy } from "./generators/guiWindowClass";
import {
  generateCheckDevicesPy,
  generateTranslatorMicPy,
  generateTranslatorLoopbackPy,
} from "./generators/cliScripts";
import {
  generateRequirementsTxt,
  generateStep1CleanBat,
  generateStep2_1CreateVenvBat,
  generateStep2_2InstallPytorchBat,
  generateStep2_3InstallEnginesBat,
  generateStep3CheckAudioBat,
  generateStep5InstallVbCableBat,
  generateRunBat,
} from "./generators/batScripts";

export function generateTranslatorGuiPy(config: ProjectConfig): string {
  return toCrLf(buildGuiDspCorePy(config) + "\n" + buildGuiWindowClassPy(config));
}

export function getAllGeneratedFiles(config: ProjectConfig): Record<ScriptFileKey, string> {
  return {
    "translator_gui.py": generateTranslatorGuiPy(config),
    "step5_install_vbcable.bat": generateStep5InstallVbCableBat(config),
    "run.bat": generateRunBat(config),
    "translator_mic.py": generateTranslatorMicPy(config),
    "translator_loopback.py": generateTranslatorLoopbackPy(config),
    "check_devices.py": generateCheckDevicesPy(config),
    "step3_check_audio.bat": generateStep3CheckAudioBat(config),
    "requirements.txt": generateRequirementsTxt(config),
    "step1_clean.bat": generateStep1CleanBat(config),
    "step2_1_create_venv.bat": generateStep2_1CreateVenvBat(config),
    "step2_2_install_pytorch.bat": generateStep2_2InstallPytorchBat(config),
    "step2_3_install_engines.bat": generateStep2_3InstallEnginesBat(config),
  };
}

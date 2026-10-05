import { ProjectConfig } from "../../types/translator";
import { generateGuiInit } from "./gui/guiInit";
import { generateGuiLayout } from "./gui/guiLayout";
import { generateGuiDevicesAndModels } from "./gui/guiDevicesAndModels";
import { generateGuiVoiceModal } from "./gui/guiVoiceModal";
import { generateGuiWorkers } from "./gui/guiWorkers";
import { generateGuiMicWorker } from "./gui/guiMicWorker";
import { generateGuiLoopbackWorker } from "./gui/guiLoopbackWorker";
import { generateGuiMain } from "./gui/guiMain";

export function buildGuiWindowClassPy(config: ProjectConfig): string {
  return [
    generateGuiInit(config),
    generateGuiLayout(),
    generateGuiDevicesAndModels(),
    generateGuiVoiceModal(),
    generateGuiWorkers(),
    generateGuiMicWorker(),
    generateGuiLoopbackWorker(),
    generateGuiMain(),
  ].join("\n");
}

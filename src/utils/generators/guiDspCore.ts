import { ProjectConfig } from "../../types/translator";
import { generateDspHeader } from "./dsp/dspHeader";
import { generateDspTextCleaner } from "./dsp/dspTextCleaner";
import { generateDspTranslator } from "./dsp/dspTranslator";
import { generateDspAudioMath } from "./dsp/dspAudioMath";
import { generateDspVoiceProfile } from "./dsp/dspVoiceProfile";

export function buildGuiDspCorePy(config: ProjectConfig): string {
  return [
    generateDspHeader(config),
    generateDspTextCleaner(),
    generateDspTranslator(),
    generateDspAudioMath(),
    generateDspVoiceProfile(),
  ].join("\n");
}

import React from "react";
import { Sliders } from "lucide-react";
import { ProjectConfig } from "../types/translator";
import { VoicePitchConfigFields } from "./VoicePitchConfigFields";
import { AudioDeviceRoutingFields } from "./AudioDeviceRoutingFields";

interface ConfigSectionProps {
  config: ProjectConfig;
  onUpdateConfig: (partial: Partial<ProjectConfig>) => void;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  config,
  onUpdateConfig,
}) => {
  return (
    <section className="border border-slate-800 bg-[#111726] rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Параметры голоса, аудиомаршрутизации и мониторинга</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Любое изменение параметров сразу обновляет скрипты{" "}
            <span className="font-mono text-emerald-400">translator_gui.py</span> и{" "}
            <span className="font-mono text-emerald-400">run.bat</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <VoicePitchConfigFields config={config} onUpdateConfig={onUpdateConfig} />
        <AudioDeviceRoutingFields config={config} onUpdateConfig={onUpdateConfig} />
      </div>
    </section>
  );
};

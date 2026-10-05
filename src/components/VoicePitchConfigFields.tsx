import React from "react";
import { ProjectConfig, VoiceBaseGender } from "../types/translator";

interface VoicePitchConfigFieldsProps {
  config: ProjectConfig;
  onUpdateConfig: (partial: Partial<ProjectConfig>) => void;
}

export const VoicePitchConfigFields: React.FC<VoicePitchConfigFieldsProps> = ({
  config,
  onUpdateConfig,
}) => {
  return (
    <>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Файл образца вашего голоса по умолчанию
        </label>
        <input
          type="text"
          value={config.voiceSampleFile}
          onChange={(e) => onUpdateConfig({ voiceSampleFile: e.target.value })}
          className="w-full px-3 py-2 bg-[#0B0F17] border border-emerald-500/60 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Базовый тип вашего голоса (диапазон Гц)
        </label>
        <select
          value={config.voiceBaseGender}
          onChange={(e) => onUpdateConfig({ voiceBaseGender: e.target.value as VoiceBaseGender })}
          className="w-full px-3 py-2 bg-[#0B0F17] border border-emerald-500/60 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          <option value="male">Мужской голос (85–165 Гц)</option>
          <option value="female">Женский голос (165–265 Гц)</option>
          <option value="auto">Авто-определение по файлу</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Коррекция тона голоса (полутона, от -6 до +6)
        </label>
        <input
          type="number"
          step="0.5"
          min={-6}
          max={6}
          value={config.voicePitchSemitones}
          onChange={(e) => onUpdateConfig({ voicePitchSemitones: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100 tabular-nums focus:outline-none focus:border-emerald-500"
        />
      </div>
    </>
  );
};

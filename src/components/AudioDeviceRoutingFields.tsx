import React from "react";
import { ProjectConfig, SileroSpeaker, MicOutputRoute } from "../types/translator";

interface AudioDeviceRoutingFieldsProps {
  config: ProjectConfig;
  onUpdateConfig: (partial: Partial<ProjectConfig>) => void;
}

export const AudioDeviceRoutingFields: React.FC<AudioDeviceRoutingFieldsProps> = ({
  config,
  onUpdateConfig,
}) => {
  return (
    <>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Имя вашего микрофона для автопоиска
        </label>
        <input
          type="text"
          value={config.preferredMicName}
          onChange={(e) => onUpdateConfig({ preferredMicName: e.target.value })}
          className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Вывод вашего перевода EN (Канал 1)
        </label>
        <select
          value={config.micOutputRoute}
          onChange={(e) => onUpdateConfig({ micOutputRoute: e.target.value as MicOutputRoute })}
          className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          <option value="auto_vbcable_or_mute">Авто: в CABLE Input (собеседнику в Discord/игру)</option>
          <option value="mute_local">Только текст на экране (без озвучки)</option>
          <option value="local_headphones">Тест в мои наушники (прослушать голос mywo.wav)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Слушать свой английский перевод в наушниках
        </label>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="hearMyEnCheck"
            checked={config.hearMyEnglishInHeadphones}
            onChange={(e) => onUpdateConfig({ hearMyEnglishInHeadphones: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-900"
          />
          <label htmlFor="hearMyEnCheck" className="text-xs text-slate-200 cursor-pointer">
            Дублировать переведённые мной слова EN в наушники
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Голос Silero TTS (Перевод собеседника EN → RU)
        </label>
        <select
          value={config.sileroSpeaker}
          onChange={(e) => onUpdateConfig({ sileroSpeaker: e.target.value as SileroSpeaker })}
          className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          <option value="aidar">aidar (Мужской, четкий)</option>
          <option value="eugene">eugene (Мужской, глубокий)</option>
          <option value="xenia">xenia (Женский, естественный)</option>
          <option value="baya">baya (Женский, мягкий)</option>
          <option value="kseniya">kseniya (Женский, дикторский)</option>
        </select>
      </div>
    </>
  );
};

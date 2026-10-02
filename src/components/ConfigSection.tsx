import React from "react";
import { Sliders } from "lucide-react";
import {
  ProjectConfig,
  SileroSpeaker,
  MicOutputRoute,
} from "../types/translator";

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
            <span>
              Настройки образца голоса ({config.voiceSampleFile}), микрофонов и RTX 5070 Ti
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Любое изменение параметров мгновенно обновляет код{" "}
            <span className="font-mono">translator_gui.py</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            Базовый тип вашего голоса (для выбора тембра и диапазона Гц)
          </label>
          <select
            value={config.voiceBaseGender}
            onChange={(e) =>
              onUpdateConfig({
                voiceBaseGender: e.target.value as "male" | "female" | "auto",
              })
            }
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
            onChange={(e) =>
              onUpdateConfig({
                voicePitchSemitones: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100 tabular-nums focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Часть названия вашего микрофона (Авто-поиск)
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
            Куда выводить ваш перевод EN (Канал 1)
          </label>
          <select
            value={config.micOutputRoute}
            onChange={(e) =>
              onUpdateConfig({ micOutputRoute: e.target.value as MicOutputRoute })
            }
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="auto_vbcable_or_mute">
              Авто: в CABLE Input (собеседнику) или без дубля в динамики
            </option>
            <option value="mute_local">
              Только текст на экране (НЕ озвучивать в мои динамики)
            </option>
            <option value="local_headphones">
              Тест в мои наушники (прослушать свой голос mywo.wav)
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Голос Silero TTS (Перевод собеседника EN -&gt; RU)
          </label>
          <select
            value={config.sileroSpeaker}
            onChange={(e) =>
              onUpdateConfig({
                sileroSpeaker: e.target.value as SileroSpeaker,
              })
            }
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="aidar">aidar (Мужской, четкий)</option>
            <option value="eugene">eugene (Мужской, глубокий)</option>
            <option value="xenia">xenia (Женский, естественный)</option>
            <option value="baya">baya (Женский, мягкий)</option>
            <option value="kseniya">kseniya (Женский, дикторский)</option>
          </select>
        </div>
      </div>
    </section>
  );
};

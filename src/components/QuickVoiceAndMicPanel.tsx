import React from "react";
import { Volume2, Download, Monitor, ShieldCheck } from "lucide-react";
import { ProjectConfig } from "../types/translator";

interface QuickVoiceAndMicPanelProps {
  config: ProjectConfig;
  onUpdateConfig: (partial: Partial<ProjectConfig>) => void;
  onDownloadGuiPy: () => void;
}

export const QuickVoiceAndMicPanel: React.FC<QuickVoiceAndMicPanelProps> = ({
  config,
  onUpdateConfig,
  onDownloadGuiPy,
}) => {
  return (
    <div className="space-y-5">
      <div className="border border-emerald-500/40 bg-[#111726] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
          <Volume2 className="w-4 h-4" />
          <span>НАСТРОЙКА ВАШЕГО ГОЛОСА И МИКРОФОНА ПЕРЕД СКАЧИВАНИЕМ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Файл образца голоса по умолчанию:
            </label>
            <input
              type="text"
              value={config.voiceSampleFile}
              onChange={(e) => onUpdateConfig({ voiceSampleFile: e.target.value })}
              placeholder="mywo.wav"
              className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-emerald-500/50 rounded text-xs font-mono text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Базовый тип вашего голоса:
            </label>
            <select
              value={config.voiceBaseGender}
              onChange={(e) =>
                onUpdateConfig({
                  voiceBaseGender: e.target.value as "male" | "female" | "auto",
                })
              }
              className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-emerald-500/50 rounded text-xs text-slate-100"
            >
              <option value="male">Мужской (85–165 Гц · без завышения тона)</option>
              <option value="female">Женский (165–265 Гц)</option>
              <option value="auto">Авто-определение по образцу</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Сдвиг тона (полутона, от -6 до +6):
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
              className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded text-xs font-mono text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Основной микрофон (поиск по имени):
            </label>
            <input
              type="text"
              value={config.preferredMicName}
              onChange={(e) => onUpdateConfig({ preferredMicName: e.target.value })}
              placeholder="MR720"
              className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded text-xs font-mono text-slate-100"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onDownloadGuiPy}
          className="w-full p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Скачать обновлённый translator_gui.py (v2.3)</span>
        </button>
      </div>

      <div className="border border-slate-800 bg-[#111726] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            <span>Превью окна: VoiceTranslator Monitor v2.3</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Голос + Анти-20-слов</span>
        </div>

        <div className="p-4 space-y-3 bg-[#0B0F17]/80 text-xs">
          <div className="p-2.5 rounded bg-[#111726] border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-emerald-400">
                Основной микрофон (Вход 1):
              </span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold">
                Найти микрофон по голосу
              </span>
            </div>
            <div className="px-2.5 py-1.5 rounded bg-[#0B0F17] border border-slate-700 font-mono text-[11px] text-slate-100 truncate">
              [#{config.micDeviceIndex}] Микрофон ({config.preferredMicName || "MR720"}) (MME, 44100 Гц) ▾
            </div>
          </div>

          <div className="p-3 rounded bg-[#111726] border border-amber-500/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300">
                Образец вашего голоса (F0 + Форманты):
              </span>
              <span className="font-mono text-[10px] text-emerald-400">
                {config.voiceSampleFile} (F0=122 Гц)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-1 bg-slate-800 text-slate-100 rounded text-[10px] font-semibold border border-slate-700">
                Выбрать .wav...
              </span>
              <span className="px-2 py-1 bg-amber-500 text-slate-950 rounded text-[10px] font-bold">
                Записать с микрофона (4 сек)
              </span>
              <span className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold">
                Тест моего голоса
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>Тон (полутона):</span>
                <span className="font-mono text-amber-300">
                  {config.voicePitchSemitones > 0
                    ? `+${config.voicePitchSemitones}`
                    : config.voicePitchSemitones}{" "}
                  ст
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Тембр:</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(config.voiceAdaptStrength * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#111726] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Анти-Повтор слов: АКТИВЕН</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                repetition_penalty=1.35 · no_repeat=2
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

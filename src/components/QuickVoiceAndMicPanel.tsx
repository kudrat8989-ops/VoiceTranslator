import React, { useState } from "react";
import { Volume2, Download } from "lucide-react";
import { ProjectConfig } from "../types/translator";
import { VoiceProfilerModal } from "./VoiceProfilerModal";
import { VoiceProfilerCard } from "./VoiceProfilerCard";
import { VoiceChannelPreview } from "./VoiceChannelPreview";

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
  const [showAnalyzerModal, setShowAnalyzerModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="border border-emerald-500/40 bg-[#111726] rounded-xl p-4 space-y-3.5">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
          <Volume2 className="w-4 h-4" />
          <span>НАСТРОЙКА НЕЙРОННОГО ГОЛОСА И МИКРОФОНА (v2.4)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Файл образца голоса:</label>
            <input type="text" value={config.voiceSampleFile} onChange={(e) => onUpdateConfig({ voiceSampleFile: e.target.value })} placeholder="mywo.wav" className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-emerald-500/50 rounded text-xs font-mono text-slate-100" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Базовый тип голоса:</label>
            <select value={config.voiceBaseGender} onChange={(e) => onUpdateConfig({ voiceBaseGender: e.target.value as "male" | "female" | "auto" })} className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-emerald-500/50 rounded text-xs text-slate-100">
              <option value="male">Мужской (Andrew/Eric Neural)</option>
              <option value="female">Женский (Aria/Jenny Neural)</option>
              <option value="auto">Авто-подбор по образцу</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Сдвиг тона (полутона):</label>
            <input type="number" step="0.5" min={-6} max={6} value={config.voicePitchSemitones} onChange={(e) => onUpdateConfig({ voicePitchSemitones: parseFloat(e.target.value) || 0 })} className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded text-xs font-mono text-slate-100" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Основной микрофон (имя):</label>
            <input type="text" value={config.preferredMicName} onChange={(e) => onUpdateConfig({ preferredMicName: e.target.value })} placeholder="MR720" className="w-full px-2.5 py-1.5 bg-[#0B0F17] border border-slate-700 rounded text-xs font-mono text-slate-100" />
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0B0F17] border border-amber-500/40 flex items-start gap-2.5 text-xs">
          <input id="hearMyEnCheckbox" type="checkbox" checked={config.hearMyEnglishInHeadphones} onChange={(e) => onUpdateConfig({ hearMyEnglishInHeadphones: e.target.checked })} className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 bg-slate-900 cursor-pointer" />
          <label htmlFor="hearMyEnCheckbox" className="cursor-pointer space-y-0.5">
            <span className="font-bold text-amber-300">🎧 Слышать свой перевод (EN) в наушниках (Самоконтроль)</span>
            <p className="text-[11px] text-slate-300">Слова переводятся нейро-голосом и сразу звучат вам в наушники. В окне доступна кнопка <strong>«🔊 Повторить мой EN»</strong>.</p>
          </label>
        </div>

        <button type="button" onClick={onDownloadGuiPy} className="w-full p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
          <Download className="w-4 h-4" />
          <span>Скачать обновлённый translator_gui.py (v2.4)</span>
        </button>
      </div>

      <VoiceProfilerCard voiceSampleFile={config.voiceSampleFile} />
      <VoiceChannelPreview voiceSampleFile={config.voiceSampleFile} onOpenAnalyzer={() => setShowAnalyzerModal(true)} />
      <VoiceProfilerModal isOpen={showAnalyzerModal} onClose={() => setShowAnalyzerModal(false)} onApply={() => { onUpdateConfig({ voiceBaseGender: "male" }); setShowAnalyzerModal(false); }} />
    </div>
  );
};

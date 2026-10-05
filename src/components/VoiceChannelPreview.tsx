import React from "react";
import { Monitor, ShieldCheck, Sparkles } from "lucide-react";

interface VoiceChannelPreviewProps {
  voiceSampleFile: string;
  onOpenAnalyzer: () => void;
}

export const VoiceChannelPreview: React.FC<VoiceChannelPreviewProps> = ({
  voiceSampleFile,
  onOpenAnalyzer,
}) => {
  return (
    <div className="border border-slate-800 bg-[#111726] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Monitor className="w-3.5 h-3.5 text-emerald-400" />
          <span>Превью окна: VoiceTranslator Monitor v2.4</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400">Вкл/Выкл Авто + Нейро-голос</span>
      </div>

      <div className="p-4 space-y-3 bg-[#0B0F17]/80 text-xs">
        <div className="p-3 rounded bg-[#111726] border border-amber-500/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-300">Ваш голос (Edge-TTS Neural + 3-полосный EQ):</span>
            <span className="font-mono text-[10px] text-emerald-400">{voiceSampleFile} → en-US-AndrewNeural</span>
          </div>
          <div className="px-2.5 py-1.5 rounded bg-[#0B0F17] border border-slate-700 font-mono text-[11px] text-slate-200 truncate">
            Авто-подбор под мой образец (Andrew / Eric / Christopher Neural) ▾
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-1 bg-slate-800 text-slate-100 rounded text-[10px] font-semibold border border-slate-700">Выбрать .wav...</span>
            <span className="px-2 py-1 bg-amber-500 text-slate-950 rounded text-[10px] font-bold">Записать с микрофона (4 сек)</span>
            <button type="button" onClick={onOpenAnalyzer} className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>🔬 Анализ голоса</span>
            </button>
            <span className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold">Тест моего голоса</span>
          </div>
        </div>

        <div className="p-3 rounded bg-[#111726] border border-emerald-500/40 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-emerald-400 font-semibold">[✓] АВТО-ПЕРЕВОД МИКРОФОНА (RU → EN)</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-semibold">🎧 В ушах: ВКЛ</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded text-[10px] font-semibold">🔊 Повторить мой EN</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold">Перевести сейчас</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <span className="text-sky-400 font-semibold">[✓] АВТО-ПЕРЕВОД ДИНАМИКА (EN → RU)</span>
            <span className="px-2 py-0.5 bg-sky-600 text-white rounded text-[10px] font-semibold">Перевести собеседника сейчас</span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-[#111726] border border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Годы (1998 → тысяча девятьсот...) + Контекст</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">Асинхронная очередь Silero</span>
          </div>
        </div>
      </div>
    </div>
  );
};

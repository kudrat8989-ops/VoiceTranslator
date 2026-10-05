import React, { useState } from "react";
import { Sparkles, Play, Check } from "lucide-react";

interface VoiceProfilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

export const VoiceProfilerModal: React.FC<VoiceProfilerModalProps> = ({ isOpen, onClose, onApply }) => {
  const [simulatedPlaying, setSimulatedPlaying] = useState<string | null>(null);
  if (!isOpen) return null;

  const handleSimulatePlay = (type: "orig" | "matched") => {
    setSimulatedPlaying(type);
    setTimeout(() => setSimulatedPlaying(null), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0F17] border border-indigo-500/50 rounded-2xl w-full max-w-lg p-5 space-y-3.5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-100">Анализатор типа голоса (Voice Profiler)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 font-mono px-2">✕</button>
        </div>

        <div className="p-3 rounded-xl bg-[#111726] border border-indigo-500/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-mono">АКУСТИЧЕСКИЙ ПРОФИЛЬ</div>
              <div className="text-sm font-bold text-emerald-400">Мужской мягкий баритон (Baritone)</div>
            </div>
            <div className="text-right text-[11px] font-bold text-amber-300 font-mono">A2 · Сходство 95%</div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-1.5 border-t border-slate-800">
            <div className="p-1.5 rounded bg-[#0B0F17] text-slate-300">F0: <span className="text-emerald-400 font-bold">112.4 Гц</span> (нота A2)</div>
            <div className="p-1.5 rounded bg-[#0B0F17] text-slate-300">Спектр: <span className="text-sky-400 font-bold">1420 Гц</span> (Бархатный)</div>
            <div className="p-1.5 rounded bg-[#0B0F17] text-slate-300">Темп: <span className="text-amber-300 font-bold">1.04x</span> (+4% к скорости)</div>
            <div className="p-1.5 rounded bg-[#0B0F17] text-slate-300">Модель: <span className="text-indigo-300 font-bold">Andrew Neural</span></div>
          </div>
          <div className="p-1.5 rounded bg-[#0B0F17] text-[10px] text-slate-300 font-mono">
            Параметры: <span className="text-emerald-400">pitch="-1Hz"</span>, <span className="text-amber-400">rate="+4%"</span> — синтезатор звучит с тем же тоном и темпом.
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-300 flex items-center justify-between">
            <span>Прослушайте и сравните:</span>
            {simulatedPlaying && <span className="text-xs font-mono text-emerald-400 animate-pulse">▶ Воспроизведение...</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleSimulatePlay("orig")} className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Слушать оригинал</span>
            </button>
            <button type="button" onClick={() => handleSimulatePlay("matched")} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <Play className="w-3.5 h-3.5 text-white" />
              <span>2. Слушать нейро-клон</span>
            </button>
          </div>
        </div>

        <button type="button" onClick={onApply} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg transition-colors">
          <Check className="w-4 h-4" />
          <span>Применить параметры сходства в проект</span>
        </button>
      </div>
    </div>
  );
};

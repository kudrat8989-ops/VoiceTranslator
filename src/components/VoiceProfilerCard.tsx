import React from "react";
import { Activity } from "lucide-react";

interface VoiceProfilerCardProps {
  voiceSampleFile: string;
}

export const VoiceProfilerCard: React.FC<VoiceProfilerCardProps> = ({
  voiceSampleFile,
}) => {
  return (
    <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/40 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span>Анализатор типа голоса (Voice Profiler & Matcher)</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
          Сходство ~95%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <div className="p-2 rounded bg-[#0B0F17] border border-slate-800">
          <div className="text-[10px] text-slate-400">ТИП ГОЛОСА</div>
          <div className="font-bold text-amber-400">Баритон (A2)</div>
        </div>
        <div className="p-2 rounded bg-[#0B0F17] border border-slate-800">
          <div className="text-[10px] text-slate-400">ОСНОВНОЙ ТОН F0</div>
          <div className="font-bold text-emerald-400">112 Гц (-1 Hz)</div>
        </div>
        <div className="p-2 rounded bg-[#0B0F17] border border-slate-800">
          <div className="text-[10px] text-slate-400">ТЕМБР И СПЕКТР</div>
          <div className="font-bold text-sky-400">Тёплый бархатный</div>
        </div>
        <div className="p-2 rounded bg-[#0B0F17] border border-slate-800">
          <div className="text-[10px] text-slate-400">НЕЙРО-МОДЕЛЬ</div>
          <div className="font-bold text-indigo-300">Andrew Neural</div>
        </div>
      </div>

      <p className="text-[11px] text-slate-300">
        Встроенный анализатор считывает акустические гармоники файла <code className="text-emerald-400 font-mono">{voiceSampleFile}</code>, определяет ноту, спектральный центроид и скорость речи, передавая в Edge-TTS точный сдвиг высоты в герцах и темп в процентах.
      </p>
    </div>
  );
};

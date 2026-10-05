import React from "react";
import { Volume2, VolumeX, Play, RotateCcw } from "lucide-react";

interface AudioMonitorBarProps {
  lastTranslatedEn: string;
  autoPlayTts: boolean;
  isSpeaking: boolean;
  onToggleAutoPlayTts: (val: boolean) => void;
  onPlaySpeech: (text: string, lang: string) => void;
}

export const AudioMonitorBar: React.FC<AudioMonitorBarProps> = ({
  lastTranslatedEn,
  autoPlayTts,
  isSpeaking,
  onToggleAutoPlayTts,
  onPlaySpeech,
}) => {
  const currentPhrase = lastTranslatedEn || "Hello, I am speaking English with real-time translation.";

  return (
    <div className="p-3 bg-[#0B0F17] rounded-lg border border-slate-800 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPlaySpeech(currentPhrase, "en-US")}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {isSpeaking ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
            <span>Слушать мой перевод (EN)</span>
          </button>

          {lastTranslatedEn && (
            <button
              type="button"
              onClick={() => onPlaySpeech(lastTranslatedEn, "en-US")}
              title="Повторить последний перевод"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoPlayTts}
            onChange={(e) => onToggleAutoPlayTts(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5 bg-slate-900"
          />
          {autoPlayTts ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>Озвучивать мой перевод в наушники (авто)</span>
        </label>
      </div>

      <div className="text-[11px] font-mono text-slate-400 truncate">
        <span className="text-emerald-400 font-semibold">Последний EN: </span>
        <span className="text-slate-200">"{currentPhrase}"</span>
      </div>
    </div>
  );
};

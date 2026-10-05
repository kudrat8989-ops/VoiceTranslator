import React from "react";
import { Volume2, Trash2 } from "lucide-react";
import { LiveTranslationEntry } from "../types/translator";

interface LiveTranslationLogProps {
  logs: LiveTranslationEntry[];
  onClear: () => void;
  onPlaySpeech: (text: string, lang: string) => void;
}

export const LiveTranslationLog: React.FC<LiveTranslationLogProps> = ({
  logs,
  onClear,
  onPlaySpeech,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">История переводов стенда ({logs.length})</span>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Очистить историю</span>
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {logs.map((item) => {
          const isMic = item.channel === "mic_ru_en";
          return (
            <div key={item.id} className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className={isMic ? "text-emerald-400" : "text-sky-400"}>
                  {isMic ? "[ВЫ RU -> EN]" : "[СОБЕСЕДНИК EN -> RU]"} · {item.timestamp}
                </span>
                <div className="flex items-center gap-2">
                  <span>{item.latencyMs} мс</span>
                  <button
                    type="button"
                    onClick={() => onPlaySpeech(item.translatedText, isMic ? "en-US" : "ru-RU")}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-200 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Volume2 className="w-3 h-3 text-emerald-400" />
                    <span>Слушать {isMic ? "EN" : "RU"}</span>
                  </button>
                </div>
              </div>
              <div className="text-slate-300">{item.sourceText}</div>
              <div className={`font-semibold ${isMic ? "text-emerald-300" : "text-sky-300"}`}>
                → {item.translatedText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from "react";
import { Mic, Square, ArrowRight } from "lucide-react";
import { AudioMonitorBar } from "./AudioMonitorBar";

interface LiveChannelControlProps {
  activeChannel: "mic_ru_en" | "loopback_en_ru";
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  rmsLevel: number;
  manualInput: string;
  autoPlayTts: boolean;
  lastTranslatedEn: string;
  errorMsg: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onManualInputChange: (val: string) => void;
  onTranslateText: (text: string) => void;
  onToggleAutoPlayTts: (val: boolean) => void;
  onPlaySpeech: (text: string, lang: string) => void;
}

export const LiveChannelControl: React.FC<LiveChannelControlProps> = ({
  activeChannel, isRecording, isProcessing, isSpeaking, rmsLevel, manualInput,
  autoPlayTts, lastTranslatedEn, errorMsg, onStartRecording, onStopRecording,
  onManualInputChange, onTranslateText, onToggleAutoPlayTts, onPlaySpeech,
}) => {
  const isMic = activeChannel === "mic_ru_en";

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => onManualInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onTranslateText(manualInput)}
            placeholder={isMic ? "Введите русскую фразу для перевода..." : "Type an English phrase to translate..."}
            className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={() => onTranslateText(manualInput)}
          disabled={!manualInput.trim() || isProcessing}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>{isProcessing ? "Перевод..." : "Перевести"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            isRecording ? "bg-red-600 hover:bg-red-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }`}
        >
          {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{isRecording ? "Стоп (Запись)" : "Тест микрофона"}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 p-2.5 bg-[#0B0F17] rounded-lg border border-slate-800 text-xs">
        <span className="text-[11px] font-mono text-slate-400">RMS:</span>
        <div className="flex-1 max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${Math.round(rmsLevel * 100)}%` }} />
        </div>
        <span className="text-[10px] font-mono text-slate-400">{Math.round(rmsLevel * 100)}%</span>
      </div>

      <AudioMonitorBar
        lastTranslatedEn={lastTranslatedEn}
        autoPlayTts={autoPlayTts}
        isSpeaking={isSpeaking}
        onToggleAutoPlayTts={onToggleAutoPlayTts}
        onPlaySpeech={onPlaySpeech}
      />
    </div>
  );
};

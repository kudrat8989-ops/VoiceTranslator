import React from "react";
import { Mic, Headphones } from "lucide-react";
import { ProjectConfig } from "../types/translator";
import { useLiveTranslator } from "../hooks/useLiveTranslator";
import { LiveChannelControl } from "./LiveChannelControl";
import { LiveTranslationLog } from "./LiveTranslationLog";
import { DeviceInspectorPanel } from "./DeviceInspectorPanel";

interface LiveBrowserTranslatorProps {
  config: ProjectConfig;
  onUpdateConfig: (partial: Partial<ProjectConfig>) => void;
}

export const LiveBrowserTranslator: React.FC<LiveBrowserTranslatorProps> = ({
  config,
  onUpdateConfig,
}) => {
  const {
    devices, activeChannel, setActiveChannel, isRecording, isProcessing, isSpeaking, rmsLevel,
    manualInput, setManualInput, autoPlayTts, setAutoPlayTts, lastTranslatedEn, errorMsg,
    logs, setLogs, handleStartRecording, handleStopRecording, handleTranslateText, playSynthesizedSpeech,
  } = useLiveTranslator();

  return (
    <div className="space-y-6">
      <div className="border border-slate-800 bg-[#111726] rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Живой тест логики перевода в браузере</div>
            <h2 className="text-base font-bold text-slate-100">Интерактивный стенд RU ↔ EN</h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveChannel("mic_ru_en")}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeChannel === "mic_ru_en" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Канал 1: Микрофон (RU → EN)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChannel("loopback_en_ru")}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeChannel === "loopback_en_ru" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Канал 2: Собеседник (EN → RU)</span>
            </button>
          </div>
        </div>

        <LiveChannelControl
          activeChannel={activeChannel}
          isRecording={isRecording}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          rmsLevel={rmsLevel}
          manualInput={manualInput}
          autoPlayTts={autoPlayTts}
          lastTranslatedEn={lastTranslatedEn}
          errorMsg={errorMsg}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onManualInputChange={setManualInput}
          onTranslateText={handleTranslateText}
          onToggleAutoPlayTts={setAutoPlayTts}
          onPlaySpeech={playSynthesizedSpeech}
        />

        <LiveTranslationLog
          logs={logs}
          onClear={() => setLogs([])}
          onPlaySpeech={playSynthesizedSpeech}
        />
      </div>

      <DeviceInspectorPanel
        browserDevices={devices}
        selectedMicIndex={config.micDeviceIndex}
        onSelectMic={(idx) => onUpdateConfig({ micDeviceIndex: idx })}
      />
    </div>
  );
};

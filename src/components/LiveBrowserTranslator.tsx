import React from "react";
import {
  Mic,
  Square,
  Volume2,
  Headphones,
  ArrowRight,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { ProjectConfig } from "../types/translator";
import { useLiveTranslator } from "../hooks/useLiveTranslator";
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
    devices,
    permissionGranted,
    activeChannel,
    setActiveChannel,
    isRecording,
    isProcessing,
    rmsLevel,
    manualInput,
    setManualInput,
    autoPlayTts,
    setAutoPlayTts,
    errorMsg,
    logs,
    setLogs,
    scanBrowserDevices,
    playSynthesizedSpeech,
    handleStartRecording,
    handleStopRecording,
    handleTranslateText,
  } = useLiveTranslator();

  return (
    <div className="space-y-8">
      <div className="border border-slate-800 bg-[#111726] rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400 mb-1">
              Живой тест логики · Прямой вывод в наушники
            </div>
            <h2 className="text-xl font-semibold text-slate-100">
              Интерактивный стенд проверки каналов перевода (RU ↔ EN)
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveChannel("mic_ru_en")}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeChannel === "mic_ru_en"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Канал 1: translator_mic (RU → EN)
            </button>
            <button
              type="button"
              onClick={() => setActiveChannel("loopback_en_ru")}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeChannel === "loopback_en_ru"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Канал 2: translator_loopback (EN → RU)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          <div className="lg:col-span-5 flex flex-col justify-between border border-slate-800/90 bg-[#0B0F17] rounded-lg p-5">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span>
                  {activeChannel === "mic_ru_en"
                    ? `Вход: Микрофон (#${config.micDeviceIndex} · ${config.preferredMicName})`
                    : "Вход: Имитация речи собеседника (EN → RU)"}
                </span>
                <span className="font-mono tabular-nums text-emerald-400">
                  RMS: {rmsLevel.toFixed(4)} / Порог: {config.vadThreshold}
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-900 rounded overflow-hidden mb-5 border border-slate-800">
                <div
                  className={`h-full transition-transform duration-75 origin-left ${
                    rmsLevel >= config.vadThreshold ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                  style={{ transform: `scaleX(${Math.min(1, rmsLevel * 8)})` }}
                />
              </div>

              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleStartRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Mic className="w-4 h-4" />
                    <span>
                      {activeChannel === "mic_ru_en"
                        ? "Записать фразу по-русски"
                        : "Записать фразу по-английски"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Square className="w-4 h-4" />
                    <span>Остановить и перевести</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAutoPlayTts(!autoPlayTts)}
                  className={`px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap flex items-center gap-2 ${
                    autoPlayTts
                      ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                      : "border-slate-800 bg-slate-900 text-slate-400"
                  }`}
                >
                  <Headphones className="w-4 h-4" />
                  <span>{autoPlayTts ? "Звук в уши: ВКЛ" : "Только текст"}</span>
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="text-xs text-slate-400 mb-2.5">
                Быстрая проверка канала одним кликом:
              </div>
              <div className="flex flex-wrap gap-2">
                {activeChannel === "mic_ru_en" ? (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() =>
                      handleTranslateText(
                        "Давай проверим задержку перевода и новый профиль голоса.",
                        "mic_ru_en"
                      )
                    }
                    className="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md transition-colors text-left"
                  >
                    «Давай проверим задержку перевода и новый профиль голоса...»
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() =>
                      handleTranslateText(
                        "The loopback capture picks up system audio directly from your headphones.",
                        "loopback_en_ru"
                      )
                    }
                    className="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md transition-colors text-left"
                  >
                    “The loopback capture picks up system audio...”
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between border border-slate-800/90 bg-[#0B0F17] rounded-lg p-5">
            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTranslateText();
                }}
                className="flex items-center gap-2 mb-4"
              >
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={
                    activeChannel === "mic_ru_en"
                      ? "Введите русскую фразу для перевода в EN..."
                      : "Введите английскую фразу собеседника для перевода в RU..."
                  }
                  className="flex-1 bg-[#111726] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualInput.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  <span>{isProcessing ? "Перевод..." : "Перевести"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {errorMsg && (
                <div className="mb-4 p-3 border border-red-900/60 bg-red-950/30 rounded-lg flex items-center gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Вывод консоли реального времени</span>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Очистить</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {logs.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-slate-800/80 bg-[#111726] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="text-slate-400 font-mono tabular-nums">
                        {item.timestamp} · {item.latencyMs} мс ·{" "}
                        <span
                          className={
                            item.channel === "mic_ru_en"
                              ? "text-emerald-400"
                              : "text-sky-400"
                          }
                        >
                          {item.channel === "mic_ru_en"
                            ? "ВЫ [RU → EN]"
                            : "СОБЕСЕДНИК [EN → SILERO RU]"}
                        </span>
                      </div>
                      <div className="text-slate-300">{item.sourceText}</div>
                      <div className="text-slate-100 font-medium text-sm">
                        → {item.translatedText}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        playSynthesizedSpeech(
                          item.translatedText,
                          item.channel === "mic_ru_en" ? "en" : "ru"
                        )
                      }
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-lg transition-colors shrink-0"
                      title="Прослушать озвучку"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeviceInspectorPanel
        devices={devices}
        permissionGranted={permissionGranted}
        config={config}
        onUpdateConfig={onUpdateConfig}
        onScanDevices={scanBrowserDevices}
        onTestOutputSpeech={() =>
          playSynthesizedSpeech(
            "Проверка канала Silero. Звук идет прямо в ваши наушники без задержек.",
            "ru"
          )
        }
      />
    </div>
  );
};

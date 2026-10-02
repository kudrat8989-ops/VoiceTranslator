import React from "react";
import { RefreshCw, Play } from "lucide-react";
import { ProjectConfig } from "../types/translator";
import { BrowserAudioDevice } from "../hooks/useLiveTranslator";

interface DeviceInspectorPanelProps {
  devices: BrowserAudioDevice[];
  permissionGranted: boolean;
  config: ProjectConfig;
  onUpdateConfig: (partial: Partial<ProjectConfig>) => void;
  onScanDevices: (requestMic: boolean) => void;
  onTestOutputSpeech: () => void;
}

export const DeviceInspectorPanel: React.FC<DeviceInspectorPanelProps> = ({
  devices,
  permissionGranted,
  config,
  onUpdateConfig,
  onScanDevices,
  onTestOutputSpeech,
}) => {
  const inputDevices = devices.filter((d) => d.kind === "audioinput");
  const outputDevices = devices.filter((d) => d.kind === "audiooutput");

  return (
    <div className="border border-slate-800 bg-[#111726] rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs text-slate-400 mb-1">
            Шаг 3 · Проверка микрофона и наушников
          </div>
          <h3 className="text-lg font-semibold text-slate-100">
            Обнаруженные аудиоустройства вашей системы
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onScanDevices(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 self-start whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>
            {permissionGranted ? "Обновить список устройств" : "Запросить названия устройств"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
        <div>
          <div className="text-xs font-medium text-slate-300 mb-3">
            Входные устройства (Микрофоны — выбор индекса для translator_gui.py)
          </div>
          <div className="space-y-2">
            {inputDevices.map((dev) => {
              const isSelected = config.micDeviceIndex === dev.index;
              return (
                <div
                  key={dev.deviceId || dev.index}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-emerald-500/60 bg-emerald-950/20"
                      : "border-slate-800 bg-[#0B0F17]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-mono tabular-nums text-slate-400">
                      Индекс #{dev.index}
                      {isSelected ? " · Активен в конфиге" : ""}
                    </div>
                    <div className="text-sm text-slate-200 truncate">{dev.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ micDeviceIndex: dev.index })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {isSelected ? "Выбран" : `Использовать #${dev.index}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-slate-300 mb-3">
            Выходные устройства (Наушники — источник WASAPI Loopback и Silero TTS)
          </div>
          <div className="space-y-2">
            {outputDevices.length === 0 ? (
              <div className="p-4 rounded-lg border border-slate-800 bg-[#0B0F17] text-xs text-slate-400">
                Используется системное устройство вывода Windows по умолчанию (WASAPI Loopback).
              </div>
            ) : (
              outputDevices.map((dev) => (
                <div
                  key={dev.deviceId || dev.index}
                  className="p-3 rounded-lg border border-slate-800 bg-[#0B0F17] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-mono tabular-nums text-slate-400">
                      Выход #{dev.index} · WASAPI Loopback Ready
                    </div>
                    <div className="text-sm text-slate-200 truncate">{dev.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={onTestOutputSpeech}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Тест звука</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

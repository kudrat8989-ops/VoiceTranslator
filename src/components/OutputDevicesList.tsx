import React from "react";
import { Play } from "lucide-react";
import { BrowserAudioDevice } from "../hooks/useLiveTranslator";

interface OutputDevicesListProps {
  devices: BrowserAudioDevice[];
  onTestOutputSpeech: () => void;
}

export const OutputDevicesList: React.FC<OutputDevicesListProps> = ({
  devices,
  onTestOutputSpeech,
}) => {
  return (
    <div>
      <div className="text-xs font-medium text-slate-300 mb-3">
        Выходные устройства (Наушники — источник WASAPI Loopback и озвучки)
      </div>
      <div className="space-y-2">
        {devices.length === 0 ? (
          <div className="p-4 rounded-lg border border-slate-800 bg-[#0B0F17] text-xs text-slate-400">
            Используется системное устройство вывода Windows по умолчанию.
          </div>
        ) : (
          devices.map((dev) => (
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
  );
};

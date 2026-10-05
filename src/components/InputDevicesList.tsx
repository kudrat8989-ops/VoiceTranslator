import React from "react";
import { BrowserAudioDevice } from "../hooks/useLiveTranslator";

interface InputDevicesListProps {
  devices: BrowserAudioDevice[];
  selectedMicIndex: number;
  onSelectMic: (index: number) => void;
}

export const InputDevicesList: React.FC<InputDevicesListProps> = ({
  devices,
  selectedMicIndex,
  onSelectMic,
}) => {
  return (
    <div>
      <div className="text-xs font-medium text-slate-300 mb-3">
        Входные устройства (Микрофоны — выбор индекса для translator_gui.py)
      </div>
      <div className="space-y-2">
        {devices.map((dev) => {
          const isSelected = selectedMicIndex === dev.index;
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
                onClick={() => onSelectMic(dev.index)}
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
  );
};

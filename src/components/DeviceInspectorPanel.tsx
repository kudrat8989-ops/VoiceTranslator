import React from "react";
import { RefreshCw } from "lucide-react";
import { BrowserAudioDevice } from "../hooks/useLiveTranslator";
import { InputDevicesList } from "./InputDevicesList";
import { OutputDevicesList } from "./OutputDevicesList";
import { speakBrowserUtterance } from "../utils/browserAudioUtils";

interface DeviceInspectorPanelProps {
  browserDevices?: BrowserAudioDevice[];
  devices?: BrowserAudioDevice[];
  selectedMicIndex: number;
  onSelectMic: (index: number) => void;
  onScanDevices?: () => void;
}

export const DeviceInspectorPanel: React.FC<DeviceInspectorPanelProps> = ({
  browserDevices,
  devices,
  selectedMicIndex,
  onSelectMic,
  onScanDevices,
}) => {
  const allDevices = devices || browserDevices || [];
  const inputDevices = allDevices.filter((d) => d.kind === "audioinput");
  const outputDevices = allDevices.filter((d) => d.kind === "audiooutput");

  const handleTestSpeech = () => {
    speakBrowserUtterance("Проверка звука. Выходное аудиоустройство работает корректно.", "ru-RU");
  };

  return (
    <div className="border border-slate-800 bg-[#111726] rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs text-slate-400 mb-1">Шаг 3 · Проверка микрофона и наушников</div>
          <h3 className="text-lg font-semibold text-slate-100">Обнаруженные аудиоустройства вашей системы</h3>
        </div>
        {onScanDevices && (
          <button
            type="button"
            onClick={onScanDevices}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 self-start whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Обновить список устройств</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
        <InputDevicesList
          devices={inputDevices}
          selectedMicIndex={selectedMicIndex}
          onSelectMic={onSelectMic}
        />
        <OutputDevicesList
          devices={outputDevices}
          onTestOutputSpeech={handleTestSpeech}
        />
      </div>
    </div>
  );
};

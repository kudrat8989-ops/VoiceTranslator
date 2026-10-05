import React from "react";
import { Terminal } from "lucide-react";
import { ScriptFileKey } from "../types/translator";
import { INSTALL_STEPS } from "../constants/installSteps";
import { InstallStepCard } from "./InstallStepCard";

interface CleanInstallChecklistProps {
  projectDir: string;
  onDownloadUnpackerBat: () => void;
  onSelectAndDownloadStep: (fileKey: ScriptFileKey) => void;
}

export const CleanInstallChecklist: React.FC<CleanInstallChecklistProps> = ({
  projectDir,
  onDownloadUnpackerBat,
  onSelectAndDownloadStep,
}) => {
  return (
    <section className="border border-emerald-500/40 bg-[#111726] rounded-xl p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="text-xs font-mono text-emerald-400">
            ПРОВЕРКА ПРОЕКТА С НУЛЯ · ПОШАГОВАЯ УСТАНОВКА В {projectDir}
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Чистая установка с 0 по отдельным шагам (каждый шаг с паузой и проверкой)
          </h2>
          <p className="text-xs text-slate-300">
            Запустите <strong>unpack_from_zero.bat</strong> (он распакует все файлы в{" "}
            <span className="font-mono text-emerald-400">{projectDir}</span>), затем выполняйте шаги 1 → 4.
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadUnpackerBat}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
        >
          <Terminal className="w-4 h-4" />
          <span>Шаг 0: Скачать unpack_from_zero.bat</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INSTALL_STEPS.map((item) => (
          <InstallStepCard
            key={item.file}
            item={item}
            onSelectAndDownload={() => onSelectAndDownloadStep(item.file)}
          />
        ))}
      </div>
    </section>
  );
};

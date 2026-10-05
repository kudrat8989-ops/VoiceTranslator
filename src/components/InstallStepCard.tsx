import React from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { InstallStepItem } from "../constants/installSteps";

interface InstallStepCardProps {
  item: InstallStepItem;
  onSelectAndDownload: () => void;
}

export const InstallStepCard: React.FC<InstallStepCardProps> = ({
  item,
  onSelectAndDownload,
}) => {
  return (
    <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 flex flex-col justify-between gap-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-emerald-400">{item.step}</span>
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {item.file}
          </span>
        </div>
        <h3 className="text-xs font-semibold text-slate-100">{item.title}</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
      </div>

      <button
        type="button"
        onClick={onSelectAndDownload}
        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>Скачать {item.file}</span>
      </button>
    </div>
  );
};

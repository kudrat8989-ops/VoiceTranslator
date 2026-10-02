import React from "react";
import { Copy, Check, Download } from "lucide-react";
import { ScriptFileKey } from "../types/translator";
import { ALL_FILE_KEYS } from "../constants/defaultConfig";

interface CodeViewerPanelProps {
  projectDir: string;
  selectedFile: ScriptFileKey;
  onSelectFile: (file: ScriptFileKey) => void;
  codeContent: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onDownload: (filename: string, content: string) => void;
}

export const CodeViewerPanel: React.FC<CodeViewerPanelProps> = ({
  projectDir,
  selectedFile,
  onSelectFile,
  codeContent,
  copiedId,
  onCopy,
  onDownload,
}) => {
  const copyKey = `code_${selectedFile}`;

  return (
    <div className="flex flex-col border border-slate-800 bg-[#111726] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-[#0B0F17]/60 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {ALL_FILE_KEYS.map((fileKey) => (
            <button
              key={fileKey}
              type="button"
              onClick={() => onSelectFile(fileKey)}
              className={`px-2.5 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap ${
                selectedFile === fileKey
                  ? "bg-emerald-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {fileKey}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-xs font-mono text-slate-400">
            {projectDir}\{selectedFile}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(codeContent, copyKey)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              {copiedId === copyKey ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать код</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onDownload(selectedFile, codeContent)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать {selectedFile}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 bg-[#080B11] overflow-auto max-h-[720px]">
        <pre className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre overflow-x-auto">
          {codeContent}
        </pre>
      </div>
    </div>
  );
};

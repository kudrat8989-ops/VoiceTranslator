import { useState, useMemo } from "react";
import { ProjectConfig, ScriptFileKey } from "../types/translator";
import { getAllGeneratedFiles } from "../utils/scriptGenerators";
import { buildZipBlob } from "../utils/zipBuilder";

export function useAppFiles(config: ProjectConfig) {
  const [selectedFile, setSelectedFile] = useState<ScriptFileKey>("step1_clean.bat");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generatedFiles = useMemo(() => getAllGeneratedFiles(config), [config]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const crlf = content.replace(/\r?\n/g, "\r\n");
    const blob = new Blob([crlf], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = () => {
    const zipBlob = buildZipBlob(generatedFiles);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "VoiceTranslator_v2.4.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    selectedFile, setSelectedFile, copiedId, generatedFiles,
    handleCopy, handleDownloadFile, handleDownloadZip,
  };
}

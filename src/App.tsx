import React, { useState, useMemo } from "react";
import { ProjectConfig, ScriptFileKey } from "./types/translator";
import { DEFAULT_CONFIG } from "./constants/defaultConfig";
import { getAllGeneratedFiles } from "./utils/scriptGenerators";
import {
  buildOneClickPcUpdaterBat,
  buildCleanFromScratchUnpackerBat,
} from "./utils/pcUpdaterBuilder";
import { buildZipBlob } from "./utils/zipBuilder";
import { HeaderNav, AppSection } from "./components/HeaderNav";
import { ReleaseHighlightsBanner } from "./components/ReleaseHighlightsBanner";
import { CleanInstallChecklist } from "./components/CleanInstallChecklist";
import { QuickVoiceAndMicPanel } from "./components/QuickVoiceAndMicPanel";
import { CodeViewerPanel } from "./components/CodeViewerPanel";
import { ConfigSection } from "./components/ConfigSection";
import { LiveBrowserTranslator } from "./components/LiveBrowserTranslator";

export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [selectedFile, setSelectedFile] = useState<ScriptFileKey>("step1_clean.bat");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>("plan");

  const updateConfig = (partial: Partial<ProjectConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

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
    const crlfContent = content.replace(/\r?\n/g, "\r\n");
    const blob = new Blob([crlfContent], { type: "text/plain;charset=utf-8" });
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
    a.download = "VoiceTranslator_v2_3_CleanInstall.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      <HeaderNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onDownloadZip={handleDownloadZip}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8 space-y-8">
        <CleanInstallChecklist
          projectDir={config.projectDir}
          onDownloadUnpackerBat={() =>
            handleDownloadFile(
              "unpack_from_zero.bat",
              buildCleanFromScratchUnpackerBat(config, generatedFiles)
            )
          }
          onSelectAndDownloadStep={(fileKey) => {
            setSelectedFile(fileKey);
            handleDownloadFile(fileKey, generatedFiles[fileKey]);
          }}
        />

        <ReleaseHighlightsBanner
          projectDir={config.projectDir}
          onDownloadAllZip={handleDownloadZip}
          onDownloadPcUpdaterBat={() =>
            handleDownloadFile(
              "update_pc_v2_4.bat",
              buildOneClickPcUpdaterBat(config, generatedFiles)
            )
          }
          onDownloadGuiPy={() =>
            handleDownloadFile("translator_gui.py", generatedFiles["translator_gui.py"])
          }
          onDownloadVbCableBat={() =>
            handleDownloadFile(
              "step5_install_vbcable.bat",
              generatedFiles["step5_install_vbcable.bat"]
            )
          }
        />

        {activeSection === "plan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <QuickVoiceAndMicPanel
                config={config}
                onUpdateConfig={updateConfig}
                onDownloadGuiPy={() => {
                  setSelectedFile("translator_gui.py");
                  handleDownloadFile(
                    "translator_gui.py",
                    generatedFiles["translator_gui.py"]
                  );
                }}
              />
            </div>

            <div className="lg:col-span-7">
              <CodeViewerPanel
                projectDir={config.projectDir}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                codeContent={generatedFiles[selectedFile]}
                copiedId={copiedId}
                onCopy={handleCopy}
                onDownload={handleDownloadFile}
              />
            </div>
          </div>
        )}

        {activeSection === "config" && (
          <ConfigSection config={config} onUpdateConfig={updateConfig} />
        )}

        {activeSection === "scripts" && (
          <CodeViewerPanel
            projectDir={config.projectDir}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            codeContent={generatedFiles[selectedFile]}
            copiedId={copiedId}
            onCopy={handleCopy}
            onDownload={handleDownloadFile}
          />
        )}

        {activeSection === "live" && (
          <LiveBrowserTranslator config={config} onUpdateConfig={updateConfig} />
        )}
      </main>
    </div>
  );
}

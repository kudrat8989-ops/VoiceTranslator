import React, { useState } from "react";
import { ProjectConfig } from "./types/translator";
import { DEFAULT_CONFIG } from "./constants/defaultConfig";
import { useAppFiles } from "./hooks/useAppFiles";
import { buildOneClickPcUpdaterBat, buildCleanFromScratchUnpackerBat } from "./utils/pcUpdaterBuilder";
import { HeaderNav, AppSection } from "./components/HeaderNav";
import { ReleaseHighlightsBanner } from "./components/ReleaseHighlightsBanner";
import { CleanInstallChecklist } from "./components/CleanInstallChecklist";
import { AppMainContent } from "./components/AppMainContent";

export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [activeSection, setActiveSection] = useState<AppSection>("plan");
  const {
    selectedFile, setSelectedFile, copiedId, generatedFiles,
    handleCopy, handleDownloadFile, handleDownloadZip,
  } = useAppFiles(config);

  const updateConfig = (partial: Partial<ProjectConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
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
            handleDownloadFile("unpack_from_zero.bat", buildCleanFromScratchUnpackerBat(config, generatedFiles))
          }
          onSelectAndDownloadStep={(key) => {
            setSelectedFile(key);
            handleDownloadFile(key, generatedFiles[key]);
          }}
        />

        <ReleaseHighlightsBanner
          projectDir={config.projectDir}
          onDownloadAllZip={handleDownloadZip}
          onDownloadPcUpdaterBat={() =>
            handleDownloadFile("update_pc_v2_4.bat", buildOneClickPcUpdaterBat(config, generatedFiles))
          }
          onDownloadGuiPy={() => handleDownloadFile("translator_gui.py", generatedFiles["translator_gui.py"])}
          onDownloadVbCableBat={() => handleDownloadFile("step5_install_vbcable.bat", generatedFiles["step5_install_vbcable.bat"])}
        />

        <AppMainContent
          activeSection={activeSection}
          config={config}
          selectedFile={selectedFile}
          generatedFiles={generatedFiles}
          copiedId={copiedId}
          onUpdateConfig={updateConfig}
          onSelectFile={setSelectedFile}
          onCopy={handleCopy}
          onDownloadFile={handleDownloadFile}
        />
      </main>
    </div>
  );
}

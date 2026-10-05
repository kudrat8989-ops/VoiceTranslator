import React from "react";
import { ProjectConfig, ScriptFileKey } from "../types/translator";
import { AppSection } from "./HeaderNav";
import { QuickVoiceAndMicPanel } from "./QuickVoiceAndMicPanel";
import { CodeViewerPanel } from "./CodeViewerPanel";
import { ConfigSection } from "./ConfigSection";
import { LiveBrowserTranslator } from "./LiveBrowserTranslator";

interface AppMainContentProps {
  activeSection: AppSection;
  config: ProjectConfig;
  selectedFile: ScriptFileKey;
  generatedFiles: Record<string, string>;
  copiedId: string | null;
  onUpdateConfig: (partial: Partial<ProjectConfig>) => void;
  onSelectFile: (file: ScriptFileKey) => void;
  onCopy: (text: string, id: string) => void;
  onDownloadFile: (filename: string, content: string) => void;
}

export const AppMainContent: React.FC<AppMainContentProps> = ({
  activeSection, config, selectedFile, generatedFiles, copiedId,
  onUpdateConfig, onSelectFile, onCopy, onDownloadFile,
}) => {
  if (activeSection === "config") {
    return <ConfigSection config={config} onUpdateConfig={onUpdateConfig} />;
  }

  if (activeSection === "live") {
    return <LiveBrowserTranslator config={config} onUpdateConfig={onUpdateConfig} />;
  }

  if (activeSection === "scripts") {
    return (
      <CodeViewerPanel
        projectDir={config.projectDir}
        selectedFile={selectedFile}
        onSelectFile={onSelectFile}
        codeContent={generatedFiles[selectedFile]}
        copiedId={copiedId}
        onCopy={onCopy}
        onDownload={onDownloadFile}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5">
        <QuickVoiceAndMicPanel
          config={config}
          onUpdateConfig={onUpdateConfig}
          onDownloadGuiPy={() => {
            onSelectFile("translator_gui.py");
            onDownloadFile("translator_gui.py", generatedFiles["translator_gui.py"]);
          }}
        />
      </div>
      <div className="lg:col-span-7">
        <CodeViewerPanel
          projectDir={config.projectDir}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          codeContent={generatedFiles[selectedFile]}
          copiedId={copiedId}
          onCopy={onCopy}
          onDownload={onDownloadFile}
        />
      </div>
    </div>
  );
};

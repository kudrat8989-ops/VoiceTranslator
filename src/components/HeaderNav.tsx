import React from "react";
import { FolderArchive } from "lucide-react";

export type AppSection = "plan" | "config" | "scripts" | "live";

interface HeaderNavProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onDownloadZip: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeSection,
  onSelectSection,
  onDownloadZip,
}) => {
  const navItems: { id: AppSection; label: string }[] = [
    { id: "plan", label: "Образец голоса и Защита от 20 слов (v2.3)" },
    { id: "config", label: "Настройки голоса и микрофонов" },
    { id: "scripts", label: "Все 12 файлов" },
    { id: "live", label: "Веб-стенд и проверка микрофона" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectSection("plan");
        }}
        className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap"
      >
        VoiceTranslator
      </a>

      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSection(item.id)}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeSection === item.id
                ? "text-slate-100 border-emerald-500"
                : "border-transparent"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onDownloadZip}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Скачать ZIP v2.3 (Свой голос + Анти-Повтор)</span>
        </button>
      </div>
    </header>
  );
};

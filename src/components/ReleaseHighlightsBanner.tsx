import React from "react";
import { Volume2, Headphones, Zap, FolderArchive } from "lucide-react";

interface ReleaseHighlightsBannerProps {
  projectDir: string;
  onDownloadPcUpdaterBat: () => void;
  onDownloadGuiPy: () => void;
  onDownloadVbCableBat: () => void;
  onDownloadAllZip: () => void;
}

export const ReleaseHighlightsBanner: React.FC<ReleaseHighlightsBannerProps> = ({
  projectDir,
  onDownloadPcUpdaterBat,
  onDownloadGuiPy,
  onDownloadVbCableBat,
  onDownloadAllZip,
}) => {
  return (
    <section className="border border-slate-800 bg-[#111726] rounded-xl p-5 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 pb-5 border-b border-slate-800">
        <div className="space-y-2 max-w-3xl">
          <div className="text-xs text-emerald-400 font-mono">ОБНОВЛЕНИЕ v2.4 · RTX 5070 Ti · ЧИСТЫЙ КОД</div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Безопасный запуск, авто-контроль перевода в ушах и чистый код
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            1. <strong>Исключено закрытие браузера:</strong> старая команда taskkill удалена.<br />
            2. <strong>Самоконтроль в наушниках:</strong> слышите свой перевод на английский одновременно с собеседником.<br />
            3. <strong>Анализатор типа голоса:</strong> точная подгонка pitch и темпа под ваш образец.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Папка: {projectDir} · Все 13 скриптов проверены</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
          <button type="button" onClick={onDownloadAllZip} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm">
            <FolderArchive className="w-4 h-4" />
            <span>1. Скачать готовый архив (VoiceTranslator_v2.4.zip)</span>
          </button>
          <button type="button" onClick={onDownloadPcUpdaterBat} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
            <Zap className="w-3.5 h-3.5" />
            <span>2. Авто-обновление (update_pc_v2_4.bat)</span>
          </button>
          <button type="button" onClick={onDownloadGuiPy} className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap border border-slate-700">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Скачать translator_gui.py</span>
          </button>
          <button type="button" onClick={onDownloadVbCableBat} className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
            <Headphones className="w-3.5 h-3.5" />
            <span>4. Скачать step5_install_vbcable.bat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1">
          <div className="font-mono text-emerald-400 text-[11px]">1 · Самоконтроль в наушниках</div>
          <div className="font-semibold text-slate-100">Слышать свой перевод EN</div>
          <p className="text-slate-400 text-[11px]">Озвучка вашим нейро-голосом параллельно играет вам в наушники и собеседнику.</p>
        </div>
        <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1">
          <div className="font-mono text-sky-400 text-[11px]">2 · Анализатор типа голоса</div>
          <div className="font-semibold text-slate-100">Сходство с оригиналом 95%</div>
          <p className="text-slate-400 text-[11px]">Анализирует F0, ноту и темп mywo.wav для идеального подбора нейросети.</p>
        </div>
        <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1">
          <div className="font-mono text-amber-400 text-[11px]">3 · Режим тихого чтения</div>
          <div className="font-semibold text-slate-100">Отключение озвучки собеседника</div>
          <p className="text-slate-400 text-[11px]">Кнопка Mute для перевода речи в текст без звука в наушниках.</p>
        </div>
        <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1">
          <div className="font-mono text-purple-400 text-[11px]">4 · Модульный чистый код</div>
          <div className="font-semibold text-slate-100">Все файлы компактны</div>
          <p className="text-slate-400 text-[11px]">Кодовая база разбита на изолированные модули строго в пределах ~80 строк.</p>
        </div>
      </div>
    </section>
  );
};

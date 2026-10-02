import React from "react";
import { Volume2, Headphones, Zap, FolderArchive, ShieldAlert } from "lucide-react";

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
    <section className="border border-slate-800 bg-[#111726] rounded-xl p-6 lg:p-7 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-2.5 max-w-3xl">
          <div className="text-xs text-emerald-400 font-mono tabular-nums">
            ОБНОВЛЕНИЕ v2.4 · БЕЗОПАСНЫЙ ЗАПУСК + УПРАВЛЕНИЕ АВТО-ПЕРЕВОДОМ + НЕЙРО-ГОЛОС
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-100 tracking-tight">
            Исправлен запуск программы и полностью исключено закрытие браузера
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            1. <strong>Почему закрывался браузер:</strong> команда принудительного закрытия окон <span className="font-mono text-amber-300">taskkill</span> в старом батнике совпадала с заголовком вкладки в браузере и Windows закрывала Chrome/Edge. <strong>Она полностью удалена.</strong><br />
            2. <strong>Почему программа не запускалась:</strong> файл <span className="font-mono text-emerald-400">translator_gui.py</span> был повреждён при декодировании, а <span className="font-mono text-emerald-400">run.bat</span> мгновенно закрывал окно. Теперь синтаксис проверен на 100%, а в <span className="font-mono text-emerald-400">run.bat</span> встроена пауза с отображением полной ошибки.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Папка на ПК: {projectDir} · Все 13 скриптов проверены и готовы к работе</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onDownloadAllZip}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
          >
            <FolderArchive className="w-4 h-4" />
            <span>1. Скачать готовый архив (VoiceTranslator_v2.4.zip)</span>
          </button>
          <button
            type="button"
            onClick={onDownloadPcUpdaterBat}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>2. Или авто-обновление (update_pc_v2_4.bat)</span>
          </button>
          <button
            type="button"
            onClick={onDownloadGuiPy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap border border-slate-700"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Скачать только translator_gui.py</span>
          </button>
          <button
            type="button"
            onClick={onDownloadVbCableBat}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>4. Скачать step5_install_vbcable.bat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1.5">
          <div className="text-xs font-mono text-emerald-400">1 · Вкл/Выкл Авто-Перевода</div>
          <h2 className="text-sm font-semibold text-slate-100">Отдельно для Микрофона и Динамика</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            В окне добавлены переключатели <strong>«АВТО-ПЕРЕВОД МИКРОФОНА»</strong> и <strong>«АВТО-ПЕРЕВОД ДИНАМИКА»</strong> + кнопки ручного перевода фразы по нажатию.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1.5">
          <div className="text-xs font-mono text-sky-400">2 · Без отставания и потери сути</div>
          <h2 className="text-sm font-semibold text-slate-100">Асинхронная очередь + Контекст</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Озвучка Silero вынесена в отдельный поток с авто-склейкой очереди, а смысловое окно расширено до <strong>3.6 сек</strong> с передачей контекста предыдущей фразы.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1.5">
          <div className="text-xs font-mono text-amber-400">3 · Правильный перевод годов</div>
          <h2 className="text-sm font-semibold text-slate-100">1998 году → тысяча девятьсот...</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Вместо посимвольного «один девять девять восемь» годы (<span className="font-mono text-slate-300">1998 году</span>, <span className="font-mono text-slate-300">90-х</span>, <span className="font-mono text-slate-300">2024 года</span>) переводятся в правильные русские числительные.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1.5">
          <div className="text-xs font-mono text-purple-400">4 · Живой нейронный голос</div>
          <h2 className="text-sm font-semibold text-slate-100">Edge-TTS Neural + 3-полосный EQ</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Вместо робота Windows SAPI5 используется живой нейронный голос (<span className="font-mono text-slate-300">Andrew / Eric / Christopher Neural</span>) с точной подгонкой под ваш тон <span className="font-mono text-emerald-400">F0</span> и грудной тембр.
          </p>
        </div>
      </div>
    </section>
  );
};

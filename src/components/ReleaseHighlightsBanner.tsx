import React from "react";
import { Volume2, Headphones, Zap } from "lucide-react";

interface ReleaseHighlightsBannerProps {
  projectDir: string;
  onDownloadPcUpdaterBat: () => void;
  onDownloadGuiPy: () => void;
  onDownloadVbCableBat: () => void;
}

export const ReleaseHighlightsBanner: React.FC<ReleaseHighlightsBannerProps> = ({
  projectDir,
  onDownloadPcUpdaterBat,
  onDownloadGuiPy,
  onDownloadVbCableBat,
}) => {
  return (
    <section className="border border-slate-800 bg-[#111726] rounded-xl p-6 lg:p-7 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-2.5 max-w-3xl">
          <div className="text-xs text-emerald-400 font-mono tabular-nums">
            ПЕРЕНОС НА ПК В 1 КЛИК · МОДУЛЬНАЯ СБОРКА v2.3 ({projectDir})
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-100 tracking-tight">
            Автоматический перенос всех правок v2.3 на ваш ПК без переустановки venv
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Нажмите кнопку <strong>«1. Перенести все правки на ПК (update_pc_v2_3.bat)»</strong> и запустите скачанный файл из любой папки (даже из «Загрузок»).
            Он сам перейдёт в <span className="font-mono text-emerald-400">{projectDir}</span>, разложит чистые модульные файлы{" "}
            <span className="font-mono text-slate-200">vt_dsp_core.py</span> (ядро тона F0, WSOLA и защита от 20 слов) и{" "}
            <span className="font-mono text-slate-200">translator_gui.py</span> (окно с выбором и записью образца голоса), сохранит ваш <span className="font-mono text-slate-200">venv</span> и сразу запустит программу.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onDownloadPcUpdaterBat}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Zap className="w-4 h-4" />
            <span>1. Перенести все правки на ПК (update_pc_v2_3.bat)</span>
          </button>
          <button
            type="button"
            onClick={onDownloadGuiPy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap border border-slate-700"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Или скачать отдельно translator_gui.py</span>
          </button>
          <button
            type="button"
            onClick={onDownloadVbCableBat}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>3. Скачать step5_install_vbcable.bat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1.5">
          <div className="text-xs font-mono text-emerald-400">1 · Модульность на ПК</div>
          <h2 className="text-sm font-semibold text-slate-100">vt_dsp_core.py + translator_gui.py</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            При обновлении через <span className="font-mono text-emerald-400">update_pc_v2_3.bat</span> код на вашем ПК тоже делится на 2 чистых модуля: DSP/Whisper-ядро и графическое окно.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1.5">
          <div className="text-xs font-mono text-sky-400">2 · Образец голоса в окне</div>
          <h2 className="text-sm font-semibold text-slate-100">Кнопки «Выбрать .wav» и «Записать (4 сек)»</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Прямо в окне программы можно выбрать любой <span className="font-mono text-slate-300">.wav</span> файл или записать 4 секунды своей речи с микрофона и нажать{" "}
            <strong>«Тест моего голоса»</strong>.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1.5">
          <div className="text-xs font-mono text-amber-400">3 · Честный мужской тон F0</div>
          <h2 className="text-sm font-semibold text-slate-100">WSOLA-перенос без ускорения</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Устранён ложный замер 2-й гармоники (<span className="font-mono text-amber-300">193.6 Гц</span>). Базовый мужской голос адаптируется по вашему тону и формантам без эффекта бурундука.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/90 space-y-1.5">
          <div className="text-xs font-mono text-purple-400">4 · Защита от 20 слов</div>
          <h2 className="text-sm font-semibold text-slate-100">Анти-повтор декодера Whisper</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Включены <span className="font-mono text-emerald-400">without_timestamps=False</span>,{" "}
            <span className="font-mono text-emerald-400">repetition_penalty=1.35</span> и фильтр дубликатов слов по реальной длительности фразы.
          </p>
        </div>
      </div>
    </section>
  );
};

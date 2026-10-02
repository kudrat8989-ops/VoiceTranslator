import React from "react";
import { Download, Terminal, CheckCircle2 } from "lucide-react";
import { ScriptFileKey } from "../types/translator";

interface CleanInstallChecklistProps {
  projectDir: string;
  onDownloadUnpackerBat: () => void;
  onSelectAndDownloadStep: (fileKey: ScriptFileKey) => void;
}

const INSTALL_STEPS: {
  step: string;
  file: ScriptFileKey;
  title: string;
  desc: string;
}[] = [
  {
    step: "ШАГ 1",
    file: "step1_clean.bat",
    title: "Полная очистка старого venv и зависших процессов",
    desc: "Останавливает старые python.exe, полностью удаляет папку venv и сохраняет ваш образец голоса mywo.wav.",
  },
  {
    step: "ШАГ 2.1",
    file: "step2_1_create_venv.bat",
    title: "Создание чистого виртуального окружения venv",
    desc: "Находит установленный Python 3.10+, создаёт папку venv\\Scripts\\python.exe и обновляет pip/wheel.",
  },
  {
    step: "ШАГ 2.2",
    file: "step2_2_install_pytorch.bat",
    title: "Установка PyTorch + CUDA для RTX 5070 Ti",
    desc: "Ставит сборку PyTorch с поддержкой CUDA и сразу выводит тест видимости вашей видеокарты RTX 5070 Ti.",
  },
  {
    step: "ШАГ 2.3",
    file: "step2_3_install_engines.bat",
    title: "Установка Faster-Whisper, SoundDevice и Silero TTS v4_ru",
    desc: "Устанавливает аудио-библиотеки из requirements.txt и заранее кэширует модель Silero TTS v4_ru.",
  },
  {
    step: "ШАГ 3",
    file: "step3_check_audio.bat",
    title: "Проверка списка микрофонов Windows (check_devices.py)",
    desc: "Показывает все микрофоны в системе и проверяет авто-определение вашего микрофона по имени MR720.",
  },
  {
    step: "ШАГ 4",
    file: "run.bat",
    title: "Запуск модульного окна VoiceTranslator Monitor v2.3",
    desc: "Открывает графическое окно translator_gui.py (с ядром vt_dsp_core.py, выбором микрофонов, записью голоса и защитой от 20 слов).",
  },
];

export const CleanInstallChecklist: React.FC<CleanInstallChecklistProps> = ({
  projectDir,
  onDownloadUnpackerBat,
  onSelectAndDownloadStep,
}) => {
  return (
    <section className="border border-emerald-500/40 bg-[#111726] rounded-xl p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="text-xs font-mono text-emerald-400">
            ПРОВЕРКА ПРОЕКТА С НУЛЯ · ПОШАГОВАЯ УСТАНОВКА В {projectDir}
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Чистая установка с 0 по отдельным шагам (каждый шаг с паузой и проверкой)
          </h2>
          <p className="text-xs text-slate-300">
            Сначала запустите <strong>unpack_from_zero.bat</strong> (он распакует все 13 актуальных файлов в{" "}
            <span className="font-mono text-emerald-400">{projectDir}</span> и откроет папку), а затем запускайте шаги 1 → 4 по порядку.
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadUnpackerBat}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
        >
          <Terminal className="w-4 h-4" />
          <span>Шаг 0: Скачать unpack_from_zero.bat (Распаковать все 13 файлов)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INSTALL_STEPS.map((item) => (
          <div
            key={item.file}
            className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 flex flex-col justify-between gap-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {item.step}
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {item.file}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-100">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectAndDownloadStep(item.file)}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Скачать {item.file}</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

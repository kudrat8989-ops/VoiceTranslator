import { ScriptFileKey } from "../types/translator";

export interface InstallStepItem {
  step: string;
  file: ScriptFileKey;
  title: string;
  desc: string;
}

export const INSTALL_STEPS: InstallStepItem[] = [
  {
    step: "ШАГ 1",
    file: "step1_clean.bat",
    title: "Полная очистка старого venv и зависших процессов",
    desc: "Останавливает старые python.exe, полностью удаляет папку venv и сохраняет ваш образец голоса mywo.wav.",
  },
  {
    step: "ШАГ 2.1",
    file: "step2_1_create_venv.bat",
    title: "Авто-поиск Python 3.10+ и создание venv",
    desc: "Умный поиск: проверяет PATH, py launcher, реестр и AppData. Если Python нет — предлагает установку в 1 клик через winget.",
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
    title: "Запуск модульного окна VoiceTranslator Monitor v2.4",
    desc: "Открывает графическое окно translator_gui.py с ядром vt_dsp_core.py, мониторингом перевода и выбором устройств.",
  },
];

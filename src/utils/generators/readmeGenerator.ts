import { ProjectConfig } from "../../types/translator";
import { toCrLf } from "./common";

export function generateReadmeMd(config: ProjectConfig): string {
  return toCrLf(`# VoiceTranslator v2.4 (RTX 5070 Ti)

Двусторонний переводчик речи в реальном времени с нейронным клонированием тембра голоса.

## 1. Структура проекта и используемые модули

### 1. \`translator_gui.py\` (Главное графическое окно)
- **Назначение:** Оконный монитор (Tkinter), управление аудиоканалами, шкалы громкости RMS, логи перевода.
- **Используемые модули:**
  - \`tkinter\`, \`ttk\`, \`scrolledtext\`, \`filedialog\` — графический интерфейс (стандартная библиотека Python).
  - \`torch\` — вычисления PyTorch на CUDA для ускорения моделей на RTX 5070 Ti.
  - \`faster_whisper\` (CTranslate2) — сверхбыстрое распознавание речи на GPU.
  - \`sounddevice\` — захват звука с микрофона с низкой задержкой.
  - \`pyaudiowpatch\` — перехват звука динамиков через Windows WASAPI Loopback.
  - \`edge_tts\`, \`pyttsx3\`, \`winsound\` — синтез и воспроизведение перевода.
  - \`vt_dsp_core.py\` — встроенное DSP-ядро и анализ питча.

### 2. \`vt_dsp_core.py\` (DSP-ядро и адаптация голоса)
- **Назначение:** Оценка основной частоты (F0), подбор нейро-голоса, профиль клонирования, транскрипция и перевод.
- **Используемые модули:** \`numpy\`, \`torch\`, \`faster_whisper\`, \`sounddevice\`, \`soundfile\`, \`http.client\`, \`urllib.parse\`.

### 3. \`translator_mic.py\` (Консольный переводчик микрофона RU -> EN)
- **Назначение:** Прямой перевод вашей речи в консоли без GUI.
- **Используемые модули:** \`sounddevice\`, \`faster_whisper\`, \`colorama\`, \`numpy\`.

### 4. \`translator_loopback.py\` (Консольный переводчик динамика EN -> RU)
- **Назначение:** Перехват речи собеседника из Discord/Telegram/игры и перевод на русский.
- **Используемые модули:** \`pyaudiowpatch\`, \`faster_whisper\`, \`colorama\`, \`numpy\`.

### 5. \`check_devices.py\` (Анализ устройств)
- **Назначение:** Сканирование аудиоустройств и loopback каналов WASAPI.
- **Используемые модули:** \`sounddevice\`, \`pyaudiowpatch\`, \`colorama\`.

### 6. \`run.bat\` (Скрипт быстрого запуска)
- **Назначение:** Настройка путей PATH для NVIDIA CUDA и запуск GUI.

---

## 2. Системные требования
- **ОС:** Windows 10 / Windows 11 (64-bit).
- **Путь к папке проекта:** Строго на английском языке без пробелов (например, \`${config.projectDir}\`).
- **Python:** Python 3.10 (x64) с включённым Tkinter.
- **GPU:** NVIDIA GeForce RTX 5070 Ti (CUDA 12.8 / 12.x).
`);
}

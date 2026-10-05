import { ProjectConfig } from "../../../types/translator";

export function generateGuiInit(config: ProjectConfig): string {
  const alwaysOnTop = config.alwaysOnTopGui ? "True" : "False";
  const hearMyEn = config.hearMyEnglishInHeadphones !== false ? "True" : "False";

  return `
import gc

class VoiceTranslatorMonitorApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("VoiceTranslator Monitor v2.4 (RTX 5070 Ti)")
        self.root.geometry("820x840")
        self.root.configure(bg="#0B0F17")
        self.root.attributes("-topmost", ${alwaysOnTop})

        self.running = True
        self.mic_auto_translate = tk.BooleanVar(value=True)
        self.mic_auto_tts = tk.BooleanVar(value=True)
        self.mic_monitor_in_headphones = tk.BooleanVar(value=${hearMyEn})
        self.last_translated_en_text = ""
        self.last_translated_en_wav = os.path.join(tempfile.gettempdir(), "vt_last_my_en.wav")
        self.loopback_auto_translate = tk.BooleanVar(value=True)
        self.loopback_auto_tts = tk.BooleanVar(value=True)

        self.always_on_top_var = tk.BooleanVar(value=${alwaysOnTop})
        self.vad_threshold = tk.DoubleVar(value=${config.vadThreshold || 0.005})
        self.adapt_strength = tk.DoubleVar(value=ADAPT_STRENGTH_DEFAULT)
        self.pitch_semitones = tk.DoubleVar(value=PITCH_SEMITONES_DEFAULT)
        self.selected_neural_voice_label = tk.StringVar(value="Авто-подбор под мой образец")
        self.current_voice_path = VOICE_SAMPLE_PATH

        self.input_devices_map: dict[str, int | None] = {}
        self.selected_primary_mic_label = tk.StringVar(value="")
        self.output_devices_map: dict[str, int | None] = {}
        self.selected_mic_out_label = tk.StringVar(value="")

        self.mic_rms, self.loop_rms = 0.0, 0.0
        self.is_playing_headphone_tts = False
        self.is_playing_speaker_echo = False
        self.manual_mic_trigger, self.manual_loop_trigger = False, False

        self.gpu_status_text = tk.StringVar(value="Инициализация моделей...")
        self.voice_status_text = tk.StringVar(value="Загрузка профиля голоса...")

        self.ui_queue: "queue.Queue[tuple]" = queue.Queue(maxsize=150)
        self.silero_play_queue: "queue.Queue[tuple[str, str, int]]" = queue.Queue(maxsize=30)
        self.my_en_tts_queue: "queue.Queue[str]" = queue.Queue(maxsize=30)
        self.gpu_lock = threading.Lock()
        self.whisper_model = None
        self.silero_model = None
        self.voice_profile = VoiceClonerProfile(self.current_voice_path, VOICE_BASE_GENDER)
        self.en_tts_worker = NeuralAndSapiTtsEngine(VOICE_BASE_GENDER)
        self.force_restart_flag = False

        self._build_ui()
        self._refresh_voice_banner()
        self._scan_audio_devices()
        self._poll_ui_queue()

        threading.Thread(target=self._mic_worker_loop, daemon=True).start()
        threading.Thread(target=self._loopback_worker_loop, daemon=True).start()
        threading.Thread(target=self._silero_playback_worker, daemon=True).start()
        threading.Thread(target=self._my_en_tts_worker_loop, daemon=True).start()
        threading.Thread(target=self._init_models, daemon=True).start()
        threading.Thread(target=self._memory_watchdog, daemon=True).start()
`;
}

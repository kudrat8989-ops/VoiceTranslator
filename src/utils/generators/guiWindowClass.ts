import { ProjectConfig } from "../../types/translator";

export function buildGuiWindowClassPy(config: ProjectConfig): string {
  const alwaysOnTop = config.alwaysOnTopGui ? "True" : "False";

  return `
class VoiceTranslatorMonitorApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("VoiceTranslator Monitor v2.3 — Свой образец голоса + Защита от 20 слов")
        self.root.geometry("1040x760")
        self.root.configure(bg="#0B0F17")
        self.root.attributes("-topmost", ${alwaysOnTop})

        self.running = True
        self.mic_enabled = tk.BooleanVar(value=True)
        self.loopback_enabled = tk.BooleanVar(value=True)
        self.always_on_top_var = tk.BooleanVar(value=${alwaysOnTop})
        self.vad_threshold = tk.DoubleVar(value=VAD_THRESHOLD_DEFAULT)
        self.adapt_strength = tk.DoubleVar(value=ADAPT_STRENGTH_DEFAULT)
        self.pitch_semitones = tk.DoubleVar(value=PITCH_SEMITONES_DEFAULT)
        self.current_voice_path = VOICE_SAMPLE_PATH

        self.input_devices_map: dict[str, int | None] = {}
        self.selected_primary_mic_label = tk.StringVar(value="")
        self.selected_secondary_mic_label = tk.StringVar(value="[Выкл — использовать только Основной микрофон]")
        self.output_devices_map: dict[str, int | None] = {}
        self.selected_mic_out_label = tk.StringVar(value="")

        self.mic_rms = 0.0
        self.loop_rms = 0.0
        self.mic_last_heartbeat = time.time()
        self.is_playing_headphone_tts = False
        self.is_playing_speaker_echo = False
        self.gpu_status_text = tk.StringVar(value="Запуск микрофона и прогрев RTX 5070 Ti...")
        self.voice_status_text = tk.StringVar(value="Загрузка профиля голоса...")

        self.ui_queue: "queue.Queue[tuple]" = queue.Queue()
        self.gpu_lock = threading.Lock()
        self.whisper_model = None
        self.silero_model = None
        self.voice_profile = VoiceClonerProfile(self.current_voice_path, VOICE_BASE_GENDER)
        self.en_tts_worker = PersistentEnTtsWorker(VOICE_BASE_GENDER)
        self.force_restart_flag = False

        self._build_ui()
        self._refresh_voice_status_banner()
        self._scan_audio_devices(initial=True)
        self._poll_ui_queue()

        threading.Thread(target=self._mic_worker_loop, daemon=True).start()
        threading.Thread(target=self._loopback_worker_loop, daemon=True).start()
        threading.Thread(target=self._init_models_and_workers, daemon=True).start()

    def _refresh_voice_status_banner(self):
        if self.voice_profile.loaded:
            fname = os.path.basename(self.voice_profile.wav_path)
            self.voice_status_text.set(
                f"Активен образец: {fname} | Ваш тон F0 = {self.voice_profile.target_f0:.1f} Гц"
            )
        else:
            fname = os.path.basename(self.current_voice_path)
            self.voice_status_text.set(
                f"Файл '{fname}' не найден — нажмите «Выбрать .wav» или «Записать с микрофона (4 сек)»"
            )

    def _build_ui(self):
        top = tk.Frame(self.root, bg="#111726", padx=14, pady=8)
        top.pack(fill=tk.X, padx=10, pady=(8, 4))
        lbl_title = tk.Label(
            top, text="VOICETRANSLATOR v2.3 (СВОЙ ОБРАЗЕЦ ГОЛОСА + ЗАЩИТА ОТ 20 СЛОВ)",
            bg="#111726", fg="#F8FAFC", font=("Consolas", 11, "bold"),
        )
        lbl_title.pack(side=tk.LEFT)
        chk_top = tk.Checkbutton(
            top, text="Поверх всех окон", variable=self.always_on_top_var, command=self._toggle_topmost,
            bg="#111726", fg="#CBD5E1", selectcolor="#0B0F17",
            activebackground="#111726", activeforeground="#FFFFFF", font=("Segoe UI", 9),
        )
        chk_top.pack(side=tk.RIGHT, padx=(10, 0))
        lbl_gpu = tk.Label(top, textvariable=self.gpu_status_text, bg="#111726", fg="#34D399", font=("Consolas", 9, "bold"))
        lbl_gpu.pack(side=tk.RIGHT)

        # Блок 1: Выбор микрофонов
        mic_box = tk.Frame(self.root, bg="#111726", padx=14, pady=8, highlightbackground="#10B981", highlightthickness=1)
        mic_box.pack(fill=tk.X, padx=10, pady=4)
        row_m1 = tk.Frame(mic_box, bg="#111726")
        row_m1.pack(fill=tk.X, pady=(0, 5))
        tk.Label(row_m1, text="Основной микрофон (Вход 1):", bg="#111726", fg="#34D399", font=("Segoe UI", 9, "bold"), width=26, anchor="w").pack(side=tk.LEFT)
        self.combo_prim_mic = ttk.Combobox(row_m1, textvariable=self.selected_primary_mic_label, state="readonly", width=52)
        self.combo_prim_mic.pack(side=tk.LEFT, padx=(4, 8))
        self.combo_prim_mic.bind("<<ComboboxSelected>>", self._on_mic_selection_changed)
        tk.Button(row_m1, text="Найти микрофон по голосу", command=self._auto_detect_speaking_mic, bg="#059669", fg="#FFFFFF", relief=tk.FLAT, padx=10, pady=2, font=("Segoe UI", 8, "bold")).pack(side=tk.LEFT, padx=(0, 6))
        tk.Button(row_m1, text="Обновить список", command=lambda: self._scan_audio_devices(initial=False), bg="#1E293B", fg="#E2E8F0", relief=tk.FLAT, padx=8, pady=2, font=("Segoe UI", 8)).pack(side=tk.LEFT)

        row_m2 = tk.Frame(mic_box, bg="#111726")
        row_m2.pack(fill=tk.X)
        tk.Label(row_m2, text="Второй микрофон (Вход 2, опц.):", bg="#111726", fg="#94A3B8", font=("Segoe UI", 9), width=26, anchor="w").pack(side=tk.LEFT)
        self.combo_sec_mic = ttk.Combobox(row_m2, textvariable=self.selected_secondary_mic_label, state="readonly", width=52)
        self.combo_sec_mic.pack(side=tk.LEFT, padx=(4, 8))
        self.combo_sec_mic.bind("<<ComboboxSelected>>", self._on_mic_selection_changed)

        # Блок 2: Панель образца вашего голоса
        voice_box = tk.Frame(self.root, bg="#111726", padx=14, pady=8, highlightbackground="#F59E0B", highlightthickness=1)
        voice_box.pack(fill=tk.X, padx=10, pady=4)
        v_row1 = tk.Frame(voice_box, bg="#111726")
        v_row1.pack(fill=tk.X, pady=(0, 6))
        tk.Label(v_row1, text="Образец вашего голоса:", bg="#111726", fg="#FBBF24", font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT)
        tk.Label(v_row1, textvariable=self.voice_status_text, bg="#111726", fg="#F8FAFC", font=("Consolas", 9, "bold")).pack(side=tk.LEFT, padx=(8, 10))
        tk.Button(v_row1, text="Тест моего голоса", command=self._test_my_adapted_voice, bg="#059669", fg="#FFFFFF", relief=tk.FLAT, padx=10, pady=2, font=("Segoe UI", 8, "bold")).pack(side=tk.RIGHT, padx=(6, 0))
        tk.Button(v_row1, text="Записать с микрофона (4 сек)", command=self._record_voice_sample_from_mic, bg="#D97706", fg="#FFFFFF", relief=tk.FLAT, padx=10, pady=2, font=("Segoe UI", 8, "bold")).pack(side=tk.RIGHT, padx=(6, 0))
        tk.Button(v_row1, text="Выбрать .wav...", command=self._browse_voice_sample_wav, bg="#334155", fg="#F8FAFC", relief=tk.FLAT, padx=10, pady=2, font=("Segoe UI", 8, "bold")).pack(side=tk.RIGHT)

        v_row2 = tk.Frame(voice_box, bg="#111726")
        v_row2.pack(fill=tk.X)
        tk.Label(v_row2, text="Тон голоса (полутона, ниже/выше):", bg="#111726", fg="#CBD5E1", font=("Segoe UI", 8)).pack(side=tk.LEFT)
        tk.Scale(v_row2, from_=-6.0, to=6.0, resolution=0.5, orient=tk.HORIZONTAL, variable=self.pitch_semitones, bg="#111726", fg="#FBBF24", highlightthickness=0, troughcolor="#0B0F17", length=160).pack(side=tk.LEFT, padx=(6, 18))
        tk.Label(v_row2, text="Сила переноса тембра:", bg="#111726", fg="#CBD5E1", font=("Segoe UI", 8)).pack(side=tk.LEFT)
        tk.Scale(v_row2, from_=0.0, to=1.0, resolution=0.05, orient=tk.HORIZONTAL, variable=self.adapt_strength, bg="#111726", fg="#34D399", highlightthickness=0, troughcolor="#0B0F17", length=140).pack(side=tk.LEFT, padx=(6, 18))
        tk.Label(v_row2, text="Порог микрофона (VAD):", bg="#111726", fg="#CBD5E1", font=("Segoe UI", 8)).pack(side=tk.LEFT)
        tk.Scale(v_row2, from_=0.001, to=0.025, resolution=0.001, orient=tk.HORIZONTAL, variable=self.vad_threshold, bg="#111726", fg="#38BDF8", highlightthickness=0, troughcolor="#0B0F17", length=140).pack(side=tk.LEFT, padx=(6, 0))

        # Блок 3: Маршрутизация вывода и шкалы RMS
        route_box = tk.Frame(self.root, bg="#111726", padx=14, pady=6)
        route_box.pack(fill=tk.X, padx=10, pady=4)
        tk.Label(route_box, text="Куда выводить ваш перевод EN:", bg="#111726", fg="#F8FAFC", font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT)
        self.combo_out = ttk.Combobox(route_box, textvariable=self.selected_mic_out_label, state="readonly", width=52)
        self.combo_out.pack(side=tk.LEFT, padx=8)
        tk.Button(route_box, text="Установить VB-Cable (1 клик)", command=self._run_vbcable_installer, bg="#0284C7", fg="#FFFFFF", relief=tk.FLAT, padx=10, pady=2, font=("Segoe UI", 8, "bold")).pack(side=tk.LEFT)

        meters = tk.Frame(self.root, bg="#111726", padx=14, pady=8)
        meters.pack(fill=tk.X, padx=10, pady=4)
        m1 = tk.Frame(meters, bg="#111726")
        m1.pack(fill=tk.X, pady=(0, 6))
        tk.Checkbutton(m1, text="КАНАЛ 1: Ваш Микрофон (RU -> EN)", variable=self.mic_enabled, bg="#111726", fg="#34D399", selectcolor="#0B0F17", activebackground="#111726", font=("Segoe UI", 9, "bold"), width=34, anchor="w").pack(side=tk.LEFT)
        self.canvas_mic = tk.Canvas(m1, width=320, height=14, bg="#0B0F17", highlightthickness=1, highlightbackground="#1E293B")
        self.canvas_mic.pack(side=tk.LEFT, padx=10)
        self.lbl_mic_rms = tk.Label(m1, text="RMS: 0.0000 | Ожидание", bg="#111726", fg="#94A3B8", font=("Consolas", 9), width=28, anchor="w")
        self.lbl_mic_rms.pack(side=tk.LEFT)
        tk.Button(m1, text="Перезапустить входы", command=self._trigger_manual_restart, bg="#1E293B", fg="#E2E8F0", relief=tk.FLAT, padx=8, pady=2, font=("Segoe UI", 8)).pack(side=tk.RIGHT)

        m2 = tk.Frame(meters, bg="#111726")
        m2.pack(fill=tk.X)
        tk.Checkbutton(m2, text="КАНАЛ 2: Собеседник (EN -> Silero RU)", variable=self.loopback_enabled, bg="#111726", fg="#38BDF8", selectcolor="#0B0F17", activebackground="#111726", font=("Segoe UI", 9, "bold"), width=34, anchor="w").pack(side=tk.LEFT)
        self.canvas_loop = tk.Canvas(m2, width=320, height=14, bg="#0B0F17", highlightthickness=1, highlightbackground="#1E293B")
        self.canvas_loop.pack(side=tk.LEFT, padx=10)
        self.lbl_loop_rms = tk.Label(m2, text="RMS: 0.0000 | Слушаю", bg="#111726", fg="#94A3B8", font=("Consolas", 9), width=28, anchor="w")
        self.lbl_loop_rms.pack(side=tk.LEFT)
        tk.Button(m2, text="Очистить лог", command=self._clear_log, bg="#1E293B", fg="#CBD5E1", relief=tk.FLAT, padx=8, pady=2, font=("Segoe UI", 8)).pack(side=tk.RIGHT)

        log_frame = tk.Frame(self.root, bg="#0B0F17", padx=10, pady=4)
        log_frame.pack(fill=tk.BOTH, expand=True)
        self.txt_log = scrolledtext.ScrolledText(log_frame, bg="#080B11", fg="#E2E8F0", insertbackground="#FFFFFF", font=("Consolas", 10), wrap=tk.WORD, state=tk.DISABLED)
        self.txt_log.pack(fill=tk.BOTH, expand=True)
        self.txt_log.tag_config("sys_ok", foreground="#34D399")
        self.txt_log.tag_config("sys_info", foreground="#94A3B8")
        self.txt_log.tag_config("ru_you", foreground="#F8FAFC")
        self.txt_log.tag_config("en_out", foreground="#34D399")
        self.txt_log.tag_config("en_peer", foreground="#38BDF8")
        self.txt_log.tag_config("ru_silero", foreground="#C084FC")
        self.txt_log.tag_config("err", foreground="#F87171")

    def _browse_voice_sample_wav(self):
        chosen = filedialog.askopenfilename(
            title="Выберите .wav образец вашего голоса (3-10 секунд чистой речи)",
            initialdir=PROJECT_DIR if os.path.exists(PROJECT_DIR) else os.getcwd(),
            filetypes=[("WAV Audio Files", "*.wav"), ("All Files", "*.*")],
        )
        if not chosen:
            return
        self.current_voice_path = chosen
        ok, msg = self.voice_profile.load_from_file(chosen)
        self._refresh_voice_status_banner()
        self.log_message(f"[ОБРАЗЕЦ ГОЛОСА] {'Успешно подключён' if ok else 'Ошибка'}: {msg}", "sys_ok" if ok else "err")

    def _record_voice_sample_from_mic(self):
        def _rec_worker():
            try:
                prim_label = self.selected_primary_mic_label.get()
                prim_idx = self.input_devices_map.get(prim_label, MIC_DEVICE_DEFAULT)
                dev_info = sd.query_devices(prim_idx, "input")
                sr = int(dev_info.get("default_samplerate", 44100))
                self.log_message("[ЗАПИСЬ ГОЛОСА] Говорите своим обычным голосом в микрофон 4 секунды...", "sys_ok")
                rec = sd.rec(int(4.0 * sr), samplerate=sr, channels=1, dtype="float32", device=prim_idx)
                sd.wait()
                audio = rec.flatten()
                peak = float(np.max(np.abs(audio)))
                if peak < 0.01:
                    self.log_message("[ЗАПИСЬ ГОЛОСА] Сигнал слишком тихий! Проверьте микрофон и повторите.", "err")
                    return
                audio = (audio / peak) * 0.92
                save_path = os.path.join(PROJECT_DIR if os.path.exists(PROJECT_DIR) else os.getcwd(), "mywo_recorded.wav")
                sf.write(save_path, audio, sr, subtype="PCM_16")
                try:
                    sf.write(VOICE_SAMPLE_PATH, audio, sr, subtype="PCM_16")
                except Exception:
                    pass
                self.current_voice_path = save_path
                ok, msg = self.voice_profile.load_from_file(save_path)
                self._refresh_voice_status_banner()
                self.log_message(f"[ЗАПИСЬ ГОЛОСА] Готово! Профиль обновлён: {msg}", "sys_ok" if ok else "err")
            except Exception as e:
                self.log_message(f"[ОШИБКА ЗАПИСИ ОБРАЗЦА] {e}", "err")
        threading.Thread(target=_rec_worker, daemon=True).start()

    def _test_my_adapted_voice(self):
        def _test_worker():
            try:
                test_phrase = "Hello! This is a live check of my adapted voice profile."
                raw_wav_path = os.path.join(tempfile.gettempdir(), "vt_gui_test_raw.wav")
                final_wav_path = os.path.join(tempfile.gettempdir(), "vt_gui_test_final.wav")
                self.log_message(f"[ТЕСТ ГОЛОСА] Синтез тестовой фразы с F0={self.voice_profile.target_f0:.1f} Гц и сдвигом {self.pitch_semitones.get():+.1f} пт...", "sys_info")
                if not self.en_tts_worker.synthesize_to_wav(test_phrase, raw_wav_path):
                    self.log_message("[ТЕСТ ГОЛОСА] Не удалось синтезировать тестовую фразу.", "err")
                    return
                tts_data, tts_sr = sf.read(raw_wav_path, dtype="float32")
                if tts_data.ndim > 1:
                    tts_data = np.mean(tts_data, axis=1)
                adapted, out_sr = adapt_audio_to_my_voice(
                    tts_data, tts_sr, self.voice_profile, self.adapt_strength.get(), self.pitch_semitones.get(),
                )
                sf.write(final_wav_path, adapted, out_sr, subtype="PCM_16")
                self.is_playing_speaker_echo = True
                self.is_playing_headphone_tts = True
                winsound.PlaySound(final_wav_path, winsound.SND_FILENAME)
                self.log_message("[ТЕСТ ГОЛОСА] Воспроизведение завершено. При необходимости подстройте ползунок «Тон голоса».", "sys_ok")
            except Exception as e:
                self.log_message(f"[ОШИБКА ТЕСТА ГОЛОСА] {e}", "err")
            finally:
                time.sleep(0.15)
                self.is_playing_speaker_echo = False
                self.is_playing_headphone_tts = False
        threading.Thread(target=_test_worker, daemon=True).start()

    def _scan_audio_devices(self, initial: bool = False):
        try:
            devices = sd.query_devices()
            hostapis = sd.query_hostapis()
        except Exception as e:
            self.log_message(f"[ОШИБКА АУДИО] {e}", "err")
            return
        in_map: dict[str, int | None] = {}
        prim_labels: list[str] = []
        best_primary_label = None
        best_secondary_label = "[Выкл — использовать только Основной микрофон]"
        pref_lower = PREFERRED_MIC_NAME.strip().lower()
        for idx, dev in enumerate(devices):
            if int(dev.get("max_input_channels", 0)) <= 0:
                continue
            name = str(dev.get("name", f"Device {idx}"))
            low = name.lower()
            if "loopback" in low or "стерео микшер" in low or "stereo mix" in low:
                continue
            api_name = hostapis[dev["hostapi"]]["name"] if dev.get("hostapi") is not None else "Audio"
            sr = int(dev.get("default_samplerate", 44100))
            lbl = f"[#{idx}] {name} ({api_name}, {sr} Гц)"
            in_map[lbl] = idx
            prim_labels.append(lbl)
            if best_primary_label is None and pref_lower and pref_lower in low and "cable" not in low:
                best_primary_label = lbl
            if SECONDARY_MIC_DEFAULT is not None and idx == SECONDARY_MIC_DEFAULT:
                best_secondary_label = lbl
        if best_primary_label is None:
            for lbl, idx in in_map.items():
                if idx == MIC_DEVICE_DEFAULT and "cable" not in lbl.lower():
                    best_primary_label = lbl
                    break
        if best_primary_label is None and prim_labels:
            best_primary_label = prim_labels[0]
        self.input_devices_map = in_map
        self.combo_prim_mic["values"] = prim_labels
        self.combo_sec_mic["values"] = ["[Выкл — использовать только Основной микрофон]"] + prim_labels
        if initial or self.selected_primary_mic_label.get() not in in_map:
            if best_primary_label:
                self.selected_primary_mic_label.set(best_primary_label)
        if initial:
            self.selected_secondary_mic_label.set(best_secondary_label)

        out_map: dict[str, int | None] = {}
        out_labels: list[str] = []
        mute_lbl = "1. ТОЛЬКО ТЕКСТ НА ЭКРАНЕ (Без дубля вашей речи в динамики)"
        out_map[mute_lbl] = -1
        out_labels.append(mute_lbl)
        vb_label = None
        for idx, dev in enumerate(devices):
            if int(dev.get("max_output_channels", 0)) <= 0:
                continue
            name = str(dev.get("name", f"Output {idx}"))
            low = name.lower()
            if any(k in low for k in ("cable input", "vb-audio", "voicemeeter", "virtual")):
                lbl = f"2. [В ЭФИР СОБЕСЕДНИКУ] #{idx}: {name}"
                out_map[lbl] = idx
                out_labels.append(lbl)
                if vb_label is None:
                    vb_label = lbl
        test_lbl = "3. ТЕСТ В МОИ НАУШНИКИ (Прослушать свой адаптированный голос)"
        out_map[test_lbl] = None
        out_labels.append(test_lbl)
        self.output_devices_map = out_map
        self.combo_out["values"] = out_labels
        if initial or self.selected_mic_out_label.get() not in out_map:
            if MIC_OUTPUT_ROUTE_MODE == "local_headphones":
                self.selected_mic_out_label.set(test_lbl)
            elif MIC_OUTPUT_ROUTE_MODE == "mute_local":
                self.selected_mic_out_label.set(mute_lbl)
            else:
                self.selected_mic_out_label.set(vb_label if vb_label else mute_lbl)

    def _on_mic_selection_changed(self, _event=None):
        self.force_restart_flag = True

    def _auto_detect_speaking_mic(self):
        def _scan_worker():
            self.log_message("[АВТО-ПОИСК] Скажите «Раз-два-три» в микрофон (сканирую входы 1.5 сек)...", "sys_info")
            best_lbl = None
            best_rms = 0.0
            for lbl, idx in list(self.input_devices_map.items()):
                if idx is None or "cable" in lbl.lower():
                    continue
                try:
                    dev_info = sd.query_devices(idx, "input")
                    sr = int(dev_info.get("default_samplerate", 44100))
                    rec = sd.rec(int(sr * 0.35), samplerate=sr, channels=1, dtype="float32", device=idx)
                    sd.wait()
                    rms = float(np.sqrt(np.mean(np.square(rec))))
                    if rms > best_rms:
                        best_rms = rms
                        best_lbl = lbl
                except Exception:
                    continue
            if best_lbl and best_rms > 0.0015:
                self.selected_primary_mic_label.set(best_lbl)
                self.force_restart_flag = True
                self.log_message(f"[АВТО-ПОИСК] Выбран микрофон: {best_lbl} (RMS={best_rms:.4f})", "sys_ok")
            else:
                self.log_message("[АВТО-ПОИСК] Не удалось услышать речь. Выберите микрофон вручную из списка.", "err")
        threading.Thread(target=_scan_worker, daemon=True).start()

    def _run_vbcable_installer(self):
        bat_path = os.path.join(PROJECT_DIR, "step5_install_vbcable.bat")
        if os.path.exists(bat_path):
            subprocess.Popen(["cmd.exe", "/c", "start", "", bat_path], cwd=PROJECT_DIR)
        else:
            messagebox.showinfo("Установка VB-Cable", f"Положите step5_install_vbcable.bat в {PROJECT_DIR}")

    def _toggle_topmost(self):
        self.root.attributes("-topmost", self.always_on_top_var.get())

    def _clear_log(self):
        self.txt_log.configure(state=tk.NORMAL)
        self.txt_log.delete("1.0", tk.END)
        self.txt_log.configure(state=tk.DISABLED)

    def _trigger_manual_restart(self):
        self.force_restart_flag = True

    def log_message(self, text: str, tag: str = "sys_info"):
        self.ui_queue.put(("log", text, tag))

    def _poll_ui_queue(self):
        while not self.ui_queue.empty():
            item = self.ui_queue.get_nowait()
            if item[0] == "log":
                _, text, tag = item
                self.txt_log.configure(state=tk.NORMAL)
                self.txt_log.insert(tk.END, text + "\\n", tag)
                self.txt_log.see(tk.END)
                self.txt_log.configure(state=tk.DISABLED)
        self._update_meter_canvas()
        if self.running:
            self.root.after(45, self._poll_ui_queue)

    def _update_meter_canvas(self):
        thresh = self.vad_threshold.get()
        self.canvas_mic.delete("all")
        w_mic = min(320, int((self.mic_rms / 0.06) * 320))
        tx = min(318, int((thresh / 0.06) * 320))
        self.canvas_mic.create_rectangle(0, 0, w_mic, 14, fill="#10B981" if self.mic_rms >= thresh else "#475569", width=0)
        self.canvas_mic.create_line(tx, 0, tx, 14, fill="#F59E0B", width=2)
        hb_age = time.time() - self.mic_last_heartbeat
        st = "ОК (СЛУШАЮ)" if hb_age < 2.5 else f"ПЕРЕЗАПУСК ({int(hb_age)}с)"
        if self.whisper_model is None:
            st = "МИКРОФОН АКТИВЕН (ЖДУ GPU)"
        self.lbl_mic_rms.configure(text=f"RMS: {self.mic_rms:.4f} | {st}", fg="#34D399" if self.mic_rms >= thresh else "#94A3B8")

        self.canvas_loop.delete("all")
        w_loop = min(320, int((self.loop_rms / 0.06) * 320))
        self.canvas_loop.create_rectangle(0, 0, w_loop, 14, fill="#38BDF8" if self.loop_rms >= thresh else "#475569", width=0)
        self.canvas_loop.create_line(tx, 0, tx, 14, fill="#F59E0B", width=2)
        lst = "MUTE (ИГРАЕТ ПЕРЕВОД)" if self.is_playing_headphone_tts else "ОК (СЛУШАЮ)"
        self.lbl_loop_rms.configure(text=f"RMS: {self.loop_rms:.4f} | {lst}")

    def _init_models_and_workers(self):
        try:
            self.log_message("[ГОЛОС] " + self.voice_status_text.get(), "sys_ok" if self.voice_profile.loaded else "sys_info")
            t0 = time.perf_counter()
            self.gpu_status_text.set(f"Загрузка Faster-Whisper ({WHISPER_MODEL_SIZE})...")
            self.whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device="cuda", compute_type=COMPUTE_TYPE)
            dummy = np.zeros(16000, dtype=np.float32)
            with self.gpu_lock:
                segs, _ = self.whisper_model.transcribe(dummy, language="ru", beam_size=1, without_timestamps=False, vad_filter=False)
                list(segs)
            self.log_message(f"[GPU] Faster-Whisper готов за {time.perf_counter() - t0:.2f} сек.", "sys_ok")

            self.gpu_status_text.set("Загрузка Silero TTS v4_ru...")
            torch.set_num_threads(4)
            self.silero_model, _ = torch.hub.load(repo_or_dir="snakers4/silero-models", model="silero_tts", language="ru", speaker="v4_ru", verbose=False)
            self.silero_model.to(torch.device("cpu"))
            self.gpu_status_text.set("ГОТОВО · МИКРОФОН АКТИВЕН · ЗАЩИТА ОТ 20 СЛОВ ВКЛ")
            self.log_message("[ГОТОВО] Оба канала работают! Говорите в выбранный микрофон.", "sys_ok")
        except Exception as e:
            self.gpu_status_text.set("Ошибка инициализации моделей")
            self.log_message(f"[КРИТИЧЕСКАЯ ОШИБКА] {e}", "err")

    def _route_my_english_tts(self, translated_en: str):
        label = self.selected_mic_out_label.get()
        target_dev_idx = self.output_devices_map.get(label, -1)
        if target_dev_idx == -1:
            return
        raw_wav_path = os.path.join(tempfile.gettempdir(), "vt_gui_en_raw.wav")
        final_wav_path = os.path.join(tempfile.gettempdir(), "vt_gui_en_final.wav")
        try:
            if not self.en_tts_worker.synthesize_to_wav(translated_en, raw_wav_path):
                return
            tts_data, tts_sr = sf.read(raw_wav_path, dtype="float32")
            if tts_data.ndim > 1:
                tts_data = np.mean(tts_data, axis=1)
            if ADAPT_TO_MY_VOICE:
                tts_data, tts_sr = adapt_audio_to_my_voice(
                    tts_data, tts_sr, self.voice_profile, self.adapt_strength.get(), self.pitch_semitones.get(),
                )
            if target_dev_idx is not None and target_dev_idx >= 0:
                dev_info = sd.query_devices(target_dev_idx, "output")
                dev_sr = int(dev_info.get("default_samplerate", 48000))
                play_audio = resample_linear(tts_data, tts_sr, dev_sr)
                sd.play(play_audio, samplerate=dev_sr, device=target_dev_idx, blocking=True)
            else:
                sf.write(final_wav_path, tts_data, tts_sr, subtype="PCM_16")
                try:
                    self.is_playing_speaker_echo = True
                    self.is_playing_headphone_tts = True
                    winsound.PlaySound(final_wav_path, winsound.SND_FILENAME)
                finally:
                    time.sleep(0.12)
                    self.is_playing_speaker_echo = False
                    self.is_playing_headphone_tts = False
        except Exception as e:
            self.log_message(f"[ОШИБКА ОЗВУЧКИ EN] {e}", "err")

    def _mic_worker_loop(self):
        block_sec = 0.10
        while self.running:
            sec_stream = None
            try:
                prim_label = self.selected_primary_mic_label.get()
                prim_idx = self.input_devices_map.get(prim_label, MIC_DEVICE_DEFAULT)
                sec_label = self.selected_secondary_mic_label.get()
                sec_idx = self.input_devices_map.get(sec_label, None)
                dev_info = sd.query_devices(prim_idx, "input")
                native_sr = int(dev_info.get("default_samplerate", 44100))
                block_frames = max(256, int(native_sr * block_sec))
                mic_q: "queue.Queue[tuple[np.ndarray, int]]" = queue.Queue()

                def prim_cb(indata, frames, time_info, status):
                    self.mic_last_heartbeat = time.time()
                    if not self.is_playing_speaker_echo and self.mic_enabled.get():
                        mic_q.put((indata.copy().flatten(), native_sr))

                if sec_idx is not None and sec_idx != prim_idx:
                    try:
                        sec_info = sd.query_devices(sec_idx, "input")
                        sec_sr = int(sec_info.get("default_samplerate", 44100))
                        sec_frames = max(256, int(sec_sr * block_sec))
                        def sec_cb(indata, frames, time_info, status):
                            self.mic_last_heartbeat = time.time()
                            if not self.is_playing_speaker_echo and self.mic_enabled.get():
                                mic_q.put((indata.copy().flatten(), sec_sr))
                        sec_stream = sd.InputStream(samplerate=sec_sr, device=sec_idx, channels=1, dtype="float32", blocksize=sec_frames, callback=sec_cb)
                        sec_stream.start()
                    except Exception:
                        pass

                with sd.InputStream(samplerate=native_sr, device=prim_idx, channels=1, dtype="float32", blocksize=block_frames, callback=prim_cb):
                    pre_roll = collections.deque(maxlen=2)
                    speech_buffer = []
                    silence_blocks = 0
                    max_blocks = max(12, int(PHRASE_MAX_SEC / block_sec))
                    current_sr = native_sr

                    while self.running and not self.force_restart_flag:
                        try:
                            chunk, chunk_sr = mic_q.get(timeout=2.0)
                            current_sr = chunk_sr
                        except queue.Empty:
                            if self.is_playing_speaker_echo or not self.mic_enabled.get():
                                self.mic_last_heartbeat = time.time()
                                continue
                            break

                        rms = float(np.sqrt(np.mean(np.square(chunk))))
                        self.mic_rms = rms
                        thresh = self.vad_threshold.get()
                        if rms >= thresh:
                            if len(speech_buffer) == 0 and len(pre_roll) > 0:
                                speech_buffer.extend(pre_roll)
                                pre_roll.clear()
                            speech_buffer.append(chunk)
                            silence_blocks = 0
                        else:
                            if len(speech_buffer) > 0:
                                speech_buffer.append(chunk)
                                silence_blocks += 1
                            else:
                                pre_roll.append(chunk)

                        if len(speech_buffer) >= 4 and (silence_blocks >= 3 or len(speech_buffer) >= max_blocks):
                            raw_audio = np.concatenate(speech_buffer)
                            speech_buffer.clear()
                            silence_blocks = 0
                            if self.whisper_model is None:
                                continue
                            if float(np.sqrt(np.mean(np.square(raw_audio)))) < thresh * 0.75:
                                continue

                            audio_16k = resample_linear(raw_audio, current_sr, 16000)
                            dur_sec = len(audio_16k) / 16000.0
                            max_tokens = max(8, min(60, int(dur_sec * 10)))
                            t_start = time.perf_counter()
                            with self.gpu_lock:
                                segments, _ = self.whisper_model.transcribe(
                                    audio_16k, language="ru", task="transcribe", beam_size=1, best_of=1,
                                    temperature=0.0, without_timestamps=False, repetition_penalty=1.35,
                                    no_repeat_ngram_size=2, compression_ratio_threshold=1.8, log_prob_threshold=-0.8,
                                    no_speech_threshold=0.6, max_new_tokens=max_tokens, vad_filter=False, condition_on_previous_text=False,
                                )
                                valid_segs = [
                                    seg.text.strip() for seg in segments
                                    if getattr(seg, "no_speech_prob", 0.0) < 0.60 and getattr(seg, "compression_ratio", 1.0) < 1.85
                                ]
                                recognized_ru = clean_and_limit_whisper_words(" ".join(valid_segs).strip(), dur_sec)

                            if not recognized_ru or is_hallucination_ru(recognized_ru):
                                continue
                            translated_en = TRANSLATOR.translate(recognized_ru, src="ru", dst="en")
                            latency_ms = int((time.perf_counter() - t_start) * 1000)
                            ts = time.strftime("%H:%M:%S")
                            self.log_message(f"[{ts}] ВЫ (RU): {recognized_ru}", "ru_you")
                            if translated_en:
                                lbl_mode = self.selected_mic_out_label.get()
                                out_dev = self.output_devices_map.get(lbl_mode, -1)
                                route_tag = "В ЭФИР СОБЕСЕДНИКУ" if (out_dev is not None and out_dev >= 0) else ("ТЕСТ В НАУШНИКИ" if out_dev is None else "ТОЛЬКО ТЕКСТ")
                                self.log_message(f"           ПЕРЕВОД (EN) [{latency_ms} мс · {route_tag}]: {translated_en}", "en_out")
                                threading.Thread(target=self._route_my_english_tts, args=(translated_en,), daemon=True).start()

                    self.force_restart_flag = False
            except Exception as e:
                self.log_message(f"[МИКРОФОН ПЕРЕЗАПУСК] {e}", "sys_info")
                time.sleep(0.8)
            finally:
                if sec_stream is not None:
                    try:
                        sec_stream.stop()
                        sec_stream.close()
                    except Exception:
                        pass

    def _loopback_worker_loop(self):
        while self.running:
            try:
                with pyaudio.PyAudio() as p:
                    wasapi_info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
                    default_speakers = p.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
                    loopback_dev = default_speakers
                    if not default_speakers.get("isLoopbackDevice", False):
                        for lb in p.get_loopback_device_info_generator():
                            if default_speakers["name"] in lb["name"]:
                                loopback_dev = lb
                                break
                    sr = int(loopback_dev["defaultSampleRate"])
                    channels = max(1, int(loopback_dev["maxInputChannels"]))
                    block_sec = 0.10
                    chunk_frames = int(sr * block_sec)
                    loop_q: "queue.Queue[bytes]" = queue.Queue()

                    def loop_cb(in_data, frame_count, time_info, status):
                        if not self.is_playing_headphone_tts and self.loopback_enabled.get():
                            loop_q.put(in_data)
                        return (in_data, pyaudio.paContinue)

                    stream = p.open(format=pyaudio.paFloat32, channels=channels, rate=sr, frames_per_buffer=chunk_frames, input=True, input_device_index=loopback_dev["index"], stream_callback=loop_cb)
                    stream.start_stream()
                    pre_roll = collections.deque(maxlen=2)
                    speech_buf = []
                    silence_blocks = 0
                    max_blocks = max(14, int(PHRASE_MAX_SEC / block_sec))

                    while self.running and stream.is_active() and not self.force_restart_flag:
                        try:
                            data = loop_q.get(timeout=0.4)
                        except queue.Empty:
                            self.loop_rms = 0.0
                            if len(speech_buf) >= 4:
                                silence_blocks = 4
                            else:
                                continue
                        else:
                            arr = np.frombuffer(data, dtype=np.float32)
                            if channels > 1:
                                arr = arr.reshape(-1, channels).mean(axis=1)
                            rms = float(np.sqrt(np.mean(np.square(arr))))
                            self.loop_rms = rms
                            thresh = self.vad_threshold.get()
                            if rms >= thresh:
                                if len(speech_buf) == 0 and len(pre_roll) > 0:
                                    speech_buf.extend(pre_roll)
                                    pre_roll.clear()
                                speech_buf.append(arr)
                                silence_blocks = 0
                            else:
                                if len(speech_buf) > 0:
                                    speech_buf.append(arr)
                                    silence_blocks += 1
                                else:
                                    pre_roll.append(arr)

                        if len(speech_buf) >= 4 and (silence_blocks >= 3 or len(speech_buf) >= max_blocks):
                            full_audio = np.concatenate(speech_buf)
                            speech_buf.clear()
                            silence_blocks = 0
                            if self.whisper_model is None:
                                continue
                            if float(np.sqrt(np.mean(np.square(full_audio)))) < self.vad_threshold.get() * 0.75:
                                continue
                            audio_16k = resample_linear(full_audio, sr, 16000)
                            dur_sec = len(audio_16k) / 16000.0
                            max_tokens = max(8, min(65, int(dur_sec * 11)))
                            t0 = time.perf_counter()
                            with self.gpu_lock:
                                segments, _ = self.whisper_model.transcribe(
                                    audio_16k, language="en", task="transcribe", beam_size=1, best_of=1,
                                    temperature=0.0, without_timestamps=False, repetition_penalty=1.35,
                                    no_repeat_ngram_size=2, compression_ratio_threshold=1.8, log_prob_threshold=-0.8,
                                    no_speech_threshold=0.6, max_new_tokens=max_tokens, vad_filter=False, condition_on_previous_text=False,
                                )
                                valid_segs = [
                                    seg.text.strip() for seg in segments
                                    if getattr(seg, "no_speech_prob", 0.0) < 0.60 and getattr(seg, "compression_ratio", 1.0) < 1.85
                                ]
                                english_text = clean_and_limit_whisper_words(" ".join(valid_segs).strip(), dur_sec)

                            if not english_text or is_hallucination_en(english_text):
                                continue
                            russian_text = TRANSLATOR.translate(english_text, src="en", dst="ru")
                            clean_ru = sanitize_for_silero(russian_text or "")
                            if not clean_ru:
                                continue
                            ts = time.strftime("%H:%M:%S")
                            self.log_message(f"[{ts}] СОБЕСЕДНИК (EN): {english_text}", "en_peer")
                            if self.silero_model is not None:
                                audio_tensor = self.silero_model.apply_tts(text=clean_ru, speaker=SILERO_SPEAKER, sample_rate=SILERO_SAMPLE_RATE, put_accent=True, put_yo=True)
                                tts_fast = speed_up_audio(audio_tensor.detach().cpu().numpy(), factor=SILERO_SPEED_FACTOR)
                                total_ms = int((time.perf_counter() - t0) * 1000)
                                self.log_message(f"           SILERO (RU) [{total_ms} мс]: {russian_text}", "ru_silero")
                                silero_path = os.path.join(tempfile.gettempdir(), "vt_gui_silero_ru.wav")
                                sf.write(silero_path, tts_fast, SILERO_SAMPLE_RATE, subtype="PCM_16")
                                try:
                                    self.is_playing_headphone_tts = True
                                    winsound.PlaySound(silero_path, winsound.SND_FILENAME)
                                finally:
                                    time.sleep(0.08)
                                    while not loop_q.empty():
                                        try:
                                            loop_q.get_nowait()
                                        except Exception:
                                            break
                                    self.is_playing_headphone_tts = False
                    stream.stop_stream()
                    stream.close()
            except Exception as e:
                self.is_playing_headphone_tts = False
                self.log_message(f"[LOOPBACK ПЕРЕЗАПУСК] {e}", "sys_info")
                time.sleep(1.0)


def main():
    root = tk.Tk()
    app = VoiceTranslatorMonitorApp(root)
    def on_close():
        app.running = False
        root.destroy()
    root.protocol("WM_DELETE_WINDOW", on_close)
    root.mainloop()

if __name__ == "__main__":
    main()
`;
}

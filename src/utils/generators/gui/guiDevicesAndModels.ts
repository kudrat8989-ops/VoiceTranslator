export function generateGuiDevicesAndModels(): string {
  return `
    def log_message(self, text: str, tag: str = "sys_info"):
        try: self.ui_queue.put_nowait(("log", text, tag))
        except queue.Full: pass

    def _poll_ui_queue(self):
        try:
            while True:
                item = self.ui_queue.get_nowait()
                if item[0] == "log":
                    _, text, tag = item
                    self.txt_log.config(state=tk.NORMAL)
                    if float(self.txt_log.index("end-1c").split(".")[0]) > 400:
                        self.txt_log.delete("1.0", "60.0")
                    self.txt_log.insert(tk.END, text + "\\n", tag)
                    self.txt_log.see(tk.END)
                    self.txt_log.config(state=tk.DISABLED)
                elif item[0] == "rms":
                    _, m_rms, l_rms = item
                    self.lbl_mic.config(text=f"RMS: {m_rms:.4f}")
                    self.canv_mic.delete("all")
                    self.canv_mic.create_rectangle(0, 0, min(130, int(m_rms * 1300)), 12, fill="#34D399", width=0)
                    self.lbl_loop.config(text=f"RMS: {l_rms:.4f}")
                    self.canv_loop.delete("all")
                    self.canv_loop.create_rectangle(0, 0, min(130, int(l_rms * 1300)), 12, fill="#38BDF8", width=0)
        except queue.Empty: pass
        if self.running: self.root.after(30, self._poll_ui_queue)

    def _memory_watchdog(self):
        while self.running:
            time.sleep(45)
            gc.collect()

    def _scan_audio_devices(self):
        try: devs, apis = sd.query_devices(), sd.query_hostapis()
        except Exception as e:
            self.log_message(f"[ОШИБКА АУДИО] {e}", "err"); return

        in_map, in_lbls, best_mic = {}, [], None
        for i, d in enumerate(devs):
            if int(d.get("max_input_channels", 0)) > 0:
                nm, low = str(d.get("name", "")), str(d.get("name", "")).lower()
                if "loopback" in low or "стерео микшер" in low: continue
                api = apis[d["hostapi"]]["name"] if d.get("hostapi") is not None else ""
                lbl = f"[#{i}] {nm} ({api})"
                in_map[lbl] = i; in_lbls.append(lbl)
                if best_mic is None and "cable" not in low:
                    if PREFERRED_MIC_NAME.lower() in low or i == MIC_DEVICE_DEFAULT: best_mic = lbl

        if best_mic is None and in_lbls: best_mic = in_lbls[0]
        self.input_devices_map = in_map
        self.combo_mic["values"] = in_lbls
        if best_mic: self.selected_primary_mic_label.set(best_mic)

        out_map, out_lbls = {}, ["1. ТОЛЬКО ТЕКСТ НА ЭКРАНЕ (Без звука в динамики)"]
        out_map[out_lbls[0]] = -1
        vb_found = None
        for i, d in enumerate(devs):
            if int(d.get("max_output_channels", 0)) > 0:
                nm = str(d.get("name", ""))
                if any(k in nm.lower() for k in ("cable input", "vb-audio", "virtual")):
                    lbl = f"2. [В ЭФИР СОБЕСЕДНИКУ] #{i}: {nm}"
                    out_map[lbl] = i; out_lbls.append(lbl)
                    if vb_found is None: vb_found = lbl
        self.output_devices_map = out_map
        self.combo_out["values"] = out_lbls
        self.selected_mic_out_label.set(vb_found if vb_found else out_lbls[0])

    def _init_models(self):
        try:
            self.log_message("[ГОЛОС] " + self.voice_status_text.get(), "sys_ok" if self.voice_profile.loaded else "sys_info")
            t0 = time.perf_counter()
            self.gpu_status_text.set(f"Загрузка Faster-Whisper ({WHISPER_MODEL_SIZE})...")
            self.whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device="cuda", compute_type=COMPUTE_TYPE)
            dummy = np.zeros(16000, dtype=np.float32)
            with self.gpu_lock:
                list(self.whisper_model.transcribe(dummy, language="ru", beam_size=1, without_timestamps=False, vad_filter=False)[0])
            self.log_message(f"[GPU] Faster-Whisper готов за {time.perf_counter() - t0:.2f} сек.", "sys_ok")

            self.gpu_status_text.set("Загрузка Silero TTS...")
            torch.set_num_threads(4)
            self.silero_model, _ = torch.hub.load(repo_or_dir="snakers4/silero-models", model="silero_tts", language="ru", speaker="v4_ru", verbose=False)
            self.silero_model.to(torch.device("cpu"))
            self.gpu_status_text.set("ГОТОВО · СИСТЕМА АКТИВНА")
            self.log_message("[ГОТОВО] Модели готовы к работе на RTX 5070 Ti.", "sys_ok")
        except Exception as e:
            self.gpu_status_text.set("Ошибка запуска моделей")
            self.log_message(f"[ОШИБКА МОДЕЛЕЙ] {e}", "err")

    def _refresh_voice_banner(self):
        if self.voice_profile.loaded:
            fn = os.path.basename(self.voice_profile.wav_path)
            self.voice_status_text.set(f"{fn} | [{self.voice_profile.voice_type_title}] F0={self.voice_profile.target_f0:.0f} Гц ({self.voice_profile.pitch_note}) -> {self.voice_profile.matched_neural_voice}")
        else:
            self.voice_status_text.set("Образец не подключён — запишите 4 сек или выберите .wav")
`;
}

export function generateGuiWorkers(): string {
  return `
    def _toggle_peer_tts(self):
        self.loopback_auto_tts.set(not self.loopback_auto_tts.get())
        self._on_tts_mode_toggled()

    def _on_tts_mode_toggled(self):
        if self.loopback_auto_tts.get():
            self.btn_tts_toggle.config(text="🔊 Озвучка ВКЛ", fg="#38BDF8")
            self.log_message("[РЕЖИМ] Озвучка собеседника включена (Silero TTS)", "sys_ok")
        else:
            self.btn_tts_toggle.config(text="🔇 ТОЛЬКО ТЕКСТ", fg="#FBBF24")
            self.log_message("[РЕЖИМ] Озвучка отключена. Режим тихого чтения текста.", "ru_reading")

    def _replay_last_my_en(self):
        if not os.path.exists(self.last_translated_en_wav) or not self.last_translated_en_text:
            self.log_message("[ПОВТОР EN] Пока нет переведённых фраз для прослушивания", "sys_info")
            return
        def _play():
            try:
                self.log_message(f"[ПРОСЛУШИВАНИЕ EN]: {self.last_translated_en_text}", "en_out")
                self.is_playing_speaker_echo = True
                safe_play_wav(self.last_translated_en_wav)
            except Exception as e: self.log_message(f"[ОШИБКА ПОВТОРА EN] {e}", "err")
            finally: time.sleep(0.04); self.is_playing_speaker_echo = False
        threading.Thread(target=_play, daemon=True).start()

    def _my_en_tts_worker_loop(self):
        while self.running:
            try: text = self.my_en_tts_queue.get(timeout=0.5)
            except queue.Empty: continue
            if not self.mic_auto_tts.get(): continue

            lbl = self.selected_mic_out_label.get()
            out_idx = self.output_devices_map.get(lbl, -1)
            if out_idx == -1 and not self.mic_monitor_in_headphones.get(): continue

            try:
                raw_p = os.path.join(tempfile.gettempdir(), "vt_mic_en.wav")
                if self.en_tts_worker.synthesize_to_wav(text, raw_p, self.voice_profile, self.pitch_semitones.get()):
                    d, sr = sf.read(raw_p, dtype="float32")
                    if d.ndim > 1: d = np.mean(d, axis=1)
                    if ADAPT_TO_MY_VOICE:
                        d, sr = adapt_audio_to_my_voice(d, sr, self.voice_profile, self.adapt_strength.get(), self.pitch_semitones.get())
                    try:
                        sf.write(self.last_translated_en_wav, d, sr, subtype="PCM_16")
                        self.last_translated_en_text = text
                    except Exception: pass

                    if out_idx >= 0:
                        dev_sr = int(sd.query_devices(out_idx, "output").get("default_samplerate", 48000))
                        sd.play(resample_linear(d, sr, dev_sr), samplerate=dev_sr, device=out_idx, blocking=False)

                    if self.mic_monitor_in_headphones.get():
                        try:
                            self.is_playing_speaker_echo = True
                            safe_play_wav(self.last_translated_en_wav)
                        finally:
                            time.sleep(0.04)
                            self.is_playing_speaker_echo = False

                    if out_idx >= 0: sd.wait()
                    elif not self.mic_monitor_in_headphones.get(): safe_play_wav(self.last_translated_en_wav)
            except Exception as e:
                self.log_message(f"[ОШИБКА ОЗВУЧКИ EN] {e}", "err")

    def _silero_playback_worker(self):
        while self.running:
            try: clean_ru, raw_ru, recog_ms = self.silero_play_queue.get(timeout=0.5)
            except queue.Empty: continue
            if not self.loopback_auto_tts.get() or self.silero_model is None: continue

            backlog = [clean_ru]
            while not self.silero_play_queue.empty():
                try:
                    nxt, _, _ = self.silero_play_queue.get_nowait()
                    if nxt: backlog.append(nxt)
                except Exception: break

            combined = ". ".join(backlog)[:320]
            spd = 1.30 if len(backlog) > 1 else SILERO_SPEED_FACTOR
            try:
                t = self.silero_model.apply_tts(text=combined, speaker=SILERO_SPEAKER, sample_rate=SILERO_SAMPLE_RATE, put_accent=True, put_yo=True)
                fast_wav = speed_up_audio(t.detach().cpu().numpy(), factor=spd)
                sp = os.path.join(tempfile.gettempdir(), "vt_silero.wav")
                sf.write(sp, fast_wav, SILERO_SAMPLE_RATE, subtype="PCM_16")
                try:
                    self.is_playing_headphone_tts = True
                    safe_play_wav(sp)
                finally:
                    time.sleep(0.04)
                    self.is_playing_headphone_tts = False
            except Exception as e:
                self.is_playing_headphone_tts = False
                self.log_message(f"[ОШИБКА SILERO] {e}", "err")
`;
}

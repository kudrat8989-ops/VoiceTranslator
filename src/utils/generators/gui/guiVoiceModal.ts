export function generateGuiVoiceModal(): string {
  return `
    def _browse_sample(self):
        f = filedialog.askopenfilename(title="Выберите .wav файл", initialdir=PROJECT_DIR, filetypes=[("WAV", "*.wav")])
        if f:
            self.current_voice_path = f
            ok, msg = self.voice_profile.load(f); self._refresh_voice_banner()
            self.log_message(f"[ОБРАЗЕЦ] {msg}", "sys_ok" if ok else "err")

    def _record_sample(self):
        def _rec():
            try:
                idx = self.input_devices_map.get(self.selected_primary_mic_label.get(), MIC_DEVICE_DEFAULT)
                sr = int(sd.query_devices(idx, "input").get("default_samplerate", 44100))
                self.log_message("[ЗАПИСЬ] Говорите в микрофон 4 секунды...", "sys_ok")
                data = sd.rec(int(4.0 * sr), samplerate=sr, channels=1, dtype="float32", device=idx)
                sd.wait(); audio = data.flatten(); peak = float(np.max(np.abs(audio)))
                if peak < 0.01:
                    self.log_message("[ЗАПИСЬ] Сигнал слишком тихий!", "err"); return
                sp = os.path.join(PROJECT_DIR, "mywo_recorded.wav")
                sf.write(sp, (audio / peak) * 0.92, sr, subtype="PCM_16")
                self.voice_profile.load(sp); self._refresh_voice_banner()
                self.log_message("[ЗАПИСЬ] Голос сохранён и активирован!", "sys_ok")
            except Exception as e: self.log_message(f"[ОШИБКА ЗАПИСИ] {e}", "err")
        threading.Thread(target=_rec, daemon=True).start()

    def _test_voice(self):
        def _test():
            try:
                self.log_message("[ТЕСТ ГОЛОСА] Синтез тестовой фразы...", "sys_info")
                wp = os.path.join(tempfile.gettempdir(), "vt_test.wav")
                phrase = "Hello! My English voice sounds natural and matches my own pitch."
                if not self.en_tts_worker.synthesize_to_wav(phrase, wp, self.voice_profile, self.pitch_semitones.get()):
                    self.log_message("[ТЕСТ ГОЛОСА] Ошибка синтеза", "err"); return
                d, sr = sf.read(wp, dtype="float32")
                if d.ndim > 1: d = np.mean(d, axis=1)
                ad, out_sr = adapt_audio_to_my_voice(d, sr, self.voice_profile, self.adapt_strength.get(), self.pitch_semitones.get())
                final_p = os.path.join(tempfile.gettempdir(), "vt_test_final.wav")
                sf.write(final_p, ad, out_sr, subtype="PCM_16")
                self.is_playing_speaker_echo = True
                safe_play_wav(final_p)
                self.log_message("[ТЕСТ ГОЛОСА] Готово! Звук воспроизведён.", "sys_ok")
            except Exception as e: self.log_message(f"[ОШИБКА ТЕСТА] {e}", "err")
            finally: time.sleep(0.1); self.is_playing_speaker_echo = False
        threading.Thread(target=_test, daemon=True).start()

    def _show_voice_analyzer_window(self):
        if not self.voice_profile.loaded:
            self.log_message("[АНАЛИЗАТОР] Образец не загружен. Нажмите 'Записать 4 сек' или 'Выбрать .wav'", "err"); return

        w = tk.Toplevel(self.root)
        w.title("VoiceTranslator — Анализатор типа голоса")
        w.geometry("560x520"); w.configure(bg="#0B0F17"); w.resizable(False, False); w.transient(self.root); w.grab_set()
        p = self.voice_profile
        tk.Label(w, text="🔬 АНАЛИЗАТОР ТИПА ГОЛОСА И СХОДСТВА", bg="#0B0F17", fg="#818CF8", font=("Segoe UI", 12, "bold")).pack(pady=(14, 2))
        tk.Label(w, text=f"Файл образца: {os.path.basename(p.wav_path)}", bg="#0B0F17", fg="#94A3B8", font=("Consolas", 9)).pack()

        card = tk.Frame(w, bg="#111726", padx=16, pady=12, highlightbackground="#4F46E5", highlightthickness=1); card.pack(fill=tk.X, padx=16, pady=10)
        tk.Label(card, text=f"ТИП ГОЛОСА: {p.voice_type_title.upper()}", bg="#111726", fg="#34D399", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        tk.Label(card, text=f"Нота: {p.pitch_note} | Сходство: {p.similarity_score}%", bg="#111726", fg="#FBBF24", font=("Segoe UI", 9)).pack(anchor="w", pady=(2, 6))

        grid_f = tk.Frame(card, bg="#0B0F17", padx=10, pady=8, highlightbackground="#1E293B", highlightthickness=1); grid_f.pack(fill=tk.X, pady=4)
        for k, v in [("Частота тона (F0):", f"{p.target_f0:.1f} Гц ({p.pitch_note})"), ("Тембр (Спектр):", f"{p.timbre_title} ({p.spectral_centroid} Гц)"), ("Темп речи:", f"{p.tempo_factor:.2f}x ({p.rate_delta_pct:+d}%)"), ("Нейросеть:", f"{p.matched_neural_voice}"), ("Калибровка:", f"Pitch: {p.pitch_delta_hz:+d} Гц | Rate: {p.rate_delta_pct:+d}%")]:
            r = tk.Frame(grid_f, bg="#0B0F17"); r.pack(fill=tk.X, pady=2)
            tk.Label(r, text=k, bg="#0B0F17", fg="#94A3B8", font=("Segoe UI", 9), width=24, anchor="w").pack(side=tk.LEFT)
            tk.Label(r, text=v, bg="#0B0F17", fg="#F8FAFC", font=("Consolas", 9, "bold"), anchor="w").pack(side=tk.LEFT)

        lbl_prv = tk.Label(w, text="Проверьте сходство звучания перед применением:", bg="#0B0F17", fg="#CBD5E1", font=("Segoe UI", 9)); lbl_prv.pack(pady=(6, 4))
        btn_r = tk.Frame(w, bg="#0B0F17"); btn_r.pack(pady=4)

        def _play_sample_wav():
            safe_play_wav(p.wav_path, async_mode=True); lbl_prv.config(text="▶ Воспроизведение оригинального образца...", fg="#FBBF24")

        def _play_matched_tts():
            def _synth():
                try:
                    lbl_prv.config(text="⏳ Синтез нейро-голоса...", fg="#38BDF8")
                    wp = os.path.join(tempfile.gettempdir(), "vt_match_test.wav")
                    txt = "Hello! This is a test of your personal neural voice matched with your exact pitch and speaking rate."
                    if self.en_tts_worker.synthesize_to_wav(txt, wp, p, self.pitch_semitones.get()):
                        lbl_prv.config(text="▶ Прослушивание нейро-голоса...", fg="#34D399"); safe_play_wav(wp); lbl_prv.config(text="Готово! Голос воспроизведён.", fg="#34D399")
                    else: lbl_prv.config(text="Ошибка синтеза", fg="#F87171")
                except Exception as ex: lbl_prv.config(text=f"Ошибка: {ex}", fg="#F87171")
            threading.Thread(target=_synth, daemon=True).start()

        def _apply_matched_settings():
            for k, v in NEURAL_VOICES.items():
                if v == p.matched_neural_voice:
                    self.selected_neural_voice_label.set(k); setattr(self.en_tts_worker, "selected_voice_override", v); break
            self._refresh_voice_banner(); w.destroy()

        tk.Button(btn_r, text="🔊 Слушать оригинал (.wav)", command=_play_sample_wav, bg="#1E293B", fg="#E2E8F0", relief=tk.FLAT, padx=10, pady=4, font=("Segoe UI", 8, "bold")).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_r, text="✨ Слушать нейро-клон (EN)", command=_play_matched_tts, bg="#059669", fg="#FFF", relief=tk.FLAT, padx=10, pady=4, font=("Segoe UI", 8, "bold")).pack(side=tk.LEFT, padx=5)
        bot_f = tk.Frame(w, bg="#0B0F17"); bot_f.pack(fill=tk.X, padx=16, pady=(16, 10))
        tk.Button(bot_f, text="✓ Применить параметры сходства в переводчик", command=_apply_matched_settings, bg="#4F46E5", fg="#FFF", relief=tk.FLAT, padx=12, pady=6, font=("Segoe UI", 9, "bold")).pack(fill=tk.X)
`;
}

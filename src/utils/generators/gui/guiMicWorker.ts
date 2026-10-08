export function generateGuiMicWorker(): string {
  return `
    def _mic_worker_loop(self):
        block_sec = 0.10
        while self.running:
            stream = None
            try:
                mic_label = self.selected_primary_mic_label.get()
                dev_idx = self.input_devices_map.get(mic_label, MIC_DEVICE_DEFAULT)
                if dev_idx is None: dev_idx = MIC_DEVICE_DEFAULT
                sr = int(sd.query_devices(dev_idx, "input").get("default_samplerate", 44100))
                block_len = int(block_sec * sr)
                audio_q = queue.Queue(maxsize=80)

                def _cb(indata, frames, time_info, status):
                    try: audio_q.put_nowait(indata.copy())
                    except Exception: pass

                stream = sd.InputStream(device=dev_idx, channels=1, samplerate=sr, blocksize=block_len, dtype="float32", callback=_cb)
                stream.start()

                pre_roll = collections.deque(maxlen=4)
                speech_buf, silence_blocks = [], 0
                max_blocks = max(28, int(PHRASE_MAX_SEC / block_sec))

                while self.running and stream.active and not self.force_restart_flag:
                    try: data = audio_q.get(timeout=0.35)
                    except queue.Empty: self.mic_rms = 0.0; continue

                    raw = data.flatten()
                    rms = float(np.sqrt(np.mean(raw**2)))
                    self.mic_rms = rms
                    try: self.ui_queue.put_nowait(("rms", self.mic_rms, self.loop_rms))
                    except queue.Full: pass

                    if not self.mic_auto_translate.get() and not self.manual_mic_trigger:
                        speech_buf.clear(); silence_blocks = 0; continue

                    vad_th = self.vad_threshold.get()
                    is_speech = (rms > vad_th) or self.manual_mic_trigger

                    if is_speech:
                        if not speech_buf and pre_roll: speech_buf.extend(list(pre_roll))
                        speech_buf.append(raw); silence_blocks = 0
                    else:
                        pre_roll.append(raw)
                        if speech_buf: silence_blocks += 1; speech_buf.append(raw)

                    flush = (len(speech_buf) > 0 and silence_blocks >= 7) or (len(speech_buf) >= max_blocks) or self.manual_mic_trigger
                    self.manual_mic_trigger = False

                    if flush and speech_buf:
                        raw_a = np.concatenate(speech_buf)
                        speech_buf.clear(); silence_blocks = 0
                        if self.whisper_model is None: continue

                        a16k = resample_linear(raw_a, sr, 16000)
                        dur_s = len(a16k) / 16000.0
                        t0 = time.perf_counter()

                        with self.gpu_lock:
                            segs, _ = self.whisper_model.transcribe(a16k, language="ru", task="transcribe", beam_size=1, temperature=0.0, without_timestamps=False, repetition_penalty=1.1, vad_filter=True, vad_parameters=dict(min_silence_duration_ms=400), max_new_tokens=150)
                            recognized_ru = clean_and_limit_whisper_words(" ".join(s.text.strip() for s in segs).strip(), dur_s)

                        if not recognized_ru or is_hallucination(recognized_ru): continue

                        def _gpu_translate_ru_en(_t):
                            with self.gpu_lock:
                                tr_segs, _ = self.whisper_model.transcribe(a16k, language="ru", task="translate", beam_size=1, temperature=0.0)
                                return " ".join(s.text.strip() for s in tr_segs).strip()

                        translated_en = TRANSLATOR.translate(recognized_ru, src="ru", dst="en", fallback_whisper_func=_gpu_translate_ru_en)
                        latency = int((time.perf_counter() - t0) * 1000)
                        ts = time.strftime("%H:%M:%S")

                        self.log_message(f"[{ts}] ВЫ (RU): {recognized_ru}", "ru_you")
                        if translated_en:
                            out_mode = self.selected_mic_out_label.get()
                            tag_route = "В ЭФИР СОБЕСЕДНИКУ" if "В ЭФИР" in out_mode else "ТОЛЬКО ТЕКСТ"
                            if self.mic_monitor_in_headphones.get(): tag_route += " + В НАУШНИКИ"
                            self.log_message(f"           ПЕРЕВОД (EN) [{latency} мс · {tag_route}]: {translated_en}", "en_out")
                            try: self.my_en_tts_queue.put_nowait(translated_en)
                            except queue.Full: pass

                self.force_restart_flag = False
            except Exception as e:
                self.log_message(f"[МИКРОФОН СБОЙ] {e}", "sys_info"); time.sleep(1.0)
            finally:
                if stream is not None:
                    try: stream.stop(); stream.close()
                    except Exception: pass
`;
}

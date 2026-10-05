export function generateGuiLoopbackWorker(): string {
  return `
    def _loopback_worker_loop(self):
        while self.running:
            p, stream = None, None
            try:
                p = pyaudio.PyAudio()
                wasapi = p.get_host_api_info_by_type(pyaudio.paWASAPI)
                def_spk = p.get_device_info_by_index(wasapi["defaultOutputDevice"])
                dev = def_spk
                if not def_spk.get("isLoopbackDevice", False):
                    for lb in p.get_loopback_device_info_generator():
                        if def_spk["name"] in lb["name"]: dev = lb; break

                sr, ch = int(dev["defaultSampleRate"]), max(1, int(dev["maxInputChannels"]))
                frames, loop_q = int(sr * 0.10), queue.Queue(maxsize=100)

                def _lcb(in_data, frame_count, time_info, status):
                    try:
                        if not self.is_playing_headphone_tts and not self.is_playing_speaker_echo:
                            loop_q.put_nowait(in_data)
                    except Exception: pass
                    return (in_data, pyaudio.paContinue)

                stream = p.open(format=pyaudio.paFloat32, channels=ch, rate=sr, frames_per_buffer=frames, input=True, input_device_index=dev["index"], stream_callback=_lcb)
                stream.start_stream()

                pre_roll = collections.deque(maxlen=4)
                speech_buf, silence_blocks = [], 0
                max_blocks = max(26, int(PHRASE_MAX_SEC / 0.10))

                while self.running and stream.is_active() and not self.force_restart_flag:
                    try: data = loop_q.get(timeout=0.35)
                    except queue.Empty: self.loop_rms = 0.0; continue

                    audio_arr = np.frombuffer(data, dtype=np.float32)
                    if ch > 1: audio_arr = np.mean(audio_arr.reshape(-1, ch), axis=1)
                    rms = float(np.sqrt(np.mean(audio_arr**2)))
                    self.loop_rms = rms
                    try: self.ui_queue.put_nowait(("rms", self.mic_rms, self.loop_rms))
                    except queue.Full: pass

                    if not self.loopback_auto_translate.get() and not self.manual_loop_trigger:
                        speech_buf.clear(); silence_blocks = 0; continue

                    is_speech = (rms > self.vad_threshold.get() * 0.85) or self.manual_loop_trigger
                    if is_speech:
                        if not speech_buf and pre_roll: speech_buf.extend(list(pre_roll))
                        speech_buf.append(audio_arr); silence_blocks = 0
                    else:
                        pre_roll.append(audio_arr)
                        if speech_buf: silence_blocks += 1; speech_buf.append(audio_arr)

                    flush = (len(speech_buf) > 0 and silence_blocks >= 6) or (len(speech_buf) >= max_blocks) or self.manual_loop_trigger
                    self.manual_loop_trigger = False

                    if flush and speech_buf:
                        raw_a = np.concatenate(speech_buf); speech_buf.clear(); silence_blocks = 0
                        if self.whisper_model is None: continue
                        a16k = resample_linear(raw_a, sr, 16000)
                        dur_s = len(a16k) / 16000.0; t0 = time.perf_counter()

                        with self.gpu_lock:
                            segs, _ = self.whisper_model.transcribe(a16k, language="en", task="transcribe", beam_size=1, temperature=0.0, without_timestamps=False, repetition_penalty=1.1, vad_filter=False, max_new_tokens=150)
                            rec_en = clean_and_limit_whisper_words(" ".join(s.text.strip() for s in segs).strip(), dur_s)
                        if not rec_en or is_hallucination(rec_en): continue

                        def _gpu_translate_en_ru(_t):
                            with self.gpu_lock:
                                tr_segs, _ = self.whisper_model.transcribe(a16k, language="en", task="translate", beam_size=1, temperature=0.0)
                                return " ".join(s.text.strip() for s in tr_segs).strip()

                        trans_ru = TRANSLATOR.translate(rec_en, src="en", dst="ru", fallback_whisper_func=_gpu_translate_en_ru)
                        lat = int((time.perf_counter() - t0) * 1000); ts = time.strftime("%H:%M:%S")
                        self.log_message(f"[{ts}] СОБЕСЕДНИК (EN): {rec_en}", "en_peer")

                        if trans_ru:
                            is_read = not self.loopback_auto_tts.get()
                            self.log_message(f"           ПЕРЕВОД (RU) [{lat} мс{' [БЕЗ ОЗВУЧКИ]' if is_read else ''}]: {trans_ru}", "ru_reading" if is_read else "ru_silero")
                            if not is_read:
                                try: self.silero_play_queue.put_nowait((sanitize_for_silero(trans_ru), trans_ru, lat))
                                except queue.Full: pass

                self.force_restart_flag = False
            except Exception as e:
                self.log_message(f"[ДИНАМИК СБОЙ] {e}", "sys_info"); time.sleep(1.0)
            finally:
                if stream is not None:
                    try: stream.stop_stream(); stream.close()
                    except Exception: pass
                if p is not None:
                    try: p.terminate()
                    except Exception: pass
`;
}

export function generateDspVoiceProfile(): string {
  return `
class VoiceClonerProfile:
    def __init__(self, wav_path: str, gender_hint: str = "male"):
        self.wav_path, self.gender_hint, self.loaded = wav_path, gender_hint, False
        self.target_f0, self.pitch_note = 114.0, "A2"
        self.voice_type_title, self.timbre_title = "Баритон", "Естественный"
        self.spectral_centroid, self.tempo_factor = 1400, 1.0
        self.pitch_delta_hz, self.rate_delta_pct = 0, 0
        self.similarity_score, self.matched_neural_voice = 90, "en-US-AndrewNeural"
        self.analysis_data = {}
        self.load(wav_path)

    def load(self, wav_path: str):
        self.wav_path = wav_path
        if not os.path.exists(wav_path):
            self.loaded = False
            return False, f"Образец '{os.path.basename(wav_path)}' не найден"
        try:
            data, sr = sf.read(wav_path, dtype="float32")
            res = analyze_voice_features(data, sr, self.gender_hint)
            self.analysis_data = res
            self.target_f0, self.pitch_note = res["f0"], res["note"]
            self.voice_type_title, self.timbre_title = res["voice_type"], res["timbre"]
            self.spectral_centroid, self.tempo_factor = res["centroid"], res["tempo_factor"]
            self.pitch_delta_hz, self.rate_delta_pct = res["pitch_delta_hz"], res["rate_delta_pct"]
            self.similarity_score, self.matched_neural_voice = res["similarity"], res["matched_voice"]
            self.loaded = True
            fn = os.path.basename(wav_path)
            return True, f"{fn} [{self.voice_type_title}] (F0={self.target_f0:.0f} Гц, {self.pitch_note} | {self.matched_neural_voice} | сходство {self.similarity_score}%)"
        except Exception as e:
            self.loaded = False
            return False, str(e)

class NeuralAndSapiTtsEngine:
    def __init__(self, prefer_gender: str = "male"):
        self.prefer_gender = prefer_gender
        self.selected_voice_override = "auto"
        self._sapi = None
        if HAS_PYTTSX3:
            try: self._sapi = pyttsx3.init()
            except Exception: pass

    def synthesize_to_wav(self, text: str, wav_path: str, profile: VoiceClonerProfile, extra_semitones: float = 0.0) -> bool:
        if HAS_EDGE_TTS:
            try:
                vid = profile.matched_neural_voice if self.selected_voice_override == "auto" else self.selected_voice_override
                diff_hz = max(-26, min(26, int(round(profile.pitch_delta_hz + extra_semitones * 5.0))))
                rate_str = f"{profile.rate_delta_pct:+d}%" if abs(profile.rate_delta_pct) >= 2 else "+0%"
                mp3 = wav_path + ".mp3"
                async def _gen():
                    comm = edge_tts.Communicate(text, voice=vid, pitch=f"{diff_hz:+d}Hz", rate=rate_str)
                    await comm.save(mp3)
                loop = asyncio.new_event_loop()
                try: loop.run_until_complete(asyncio.wait_for(_gen(), timeout=4.0))
                finally: loop.close()
                if os.path.exists(mp3) and os.path.getsize(mp3) > 100:
                    d, sr = sf.read(mp3, dtype="float32")
                    if d.ndim > 1: d = np.mean(d, axis=1)
                    sf.write(wav_path, d, sr, subtype="PCM_16")
                    try: os.remove(mp3)
                    except Exception: pass
                    return True
            except Exception: pass

        if self._sapi is not None:
            try:
                self._sapi.save_to_file(text, wav_path)
                self._sapi.runAndWait()
                return os.path.exists(wav_path) and os.path.getsize(wav_path) > 100
            except Exception: pass
        return False

def adapt_audio_to_my_voice(tts_audio: np.ndarray, tts_sr: int, profile: VoiceClonerProfile, strength: float, extra_semitones: float = 0.0) -> tuple[np.ndarray, int]:
    work_sr = 24000
    wav = resample_linear(tts_audio, tts_sr, work_sr)
    if len(wav) < 512 or not profile.loaded or strength <= 0.02: return wav, work_sr
    alpha, acc, low = 0.08, 0.0, np.zeros_like(wav)
    for i in range(len(wav)):
        acc += alpha * (float(wav[i]) - acc)
        low[i] = acc
    out = wav + low * (0.25 * float(strength))
    peak = np.max(np.abs(out))
    if peak > 1e-4: out = (out / peak) * 0.92
    return out.astype(np.float32), work_sr
`;
}

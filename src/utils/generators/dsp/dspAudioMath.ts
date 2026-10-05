export function generateDspAudioMath(): string {
  return `
def resample_linear(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    if orig_sr == target_sr or len(audio) == 0: return audio.astype(np.float32)
    dur = len(audio) / float(orig_sr)
    out_len = int(dur * target_sr)
    if out_len <= 0: return np.zeros(0, dtype=np.float32)
    return np.interp(np.linspace(0, dur, out_len, endpoint=False), np.linspace(0, dur, len(audio), endpoint=False), audio).astype(np.float32)

def speed_up_audio(audio: np.ndarray, factor: float = 1.22) -> np.ndarray:
    if factor <= 1.01 or len(audio) < 256: return audio
    new_len = max(1, int(len(audio) / factor))
    return np.interp(np.linspace(0, 1, new_len, endpoint=False), np.linspace(0, 1, len(audio), endpoint=False), audio).astype(np.float32)

def analyze_voice_features(audio: np.ndarray, sr: int, gender_hint: str = "male") -> dict:
    if audio.ndim > 1: audio = np.mean(audio, axis=1)
    peak = float(np.max(np.abs(audio))) if len(audio) > 0 else 0.0
    if peak > 1e-4: audio = audio / peak
    dur = float(len(audio)) / float(sr) if sr > 0 else 0.0
    if dur < 0.25:
        return {"valid": False, "f0": 115.0, "note": "A2", "centroid": 1400, "voice_type": "Баритон", "timbre": "Естественный", "tempo_factor": 1.0, "pitch_delta_hz": 0, "rate_delta_pct": 0, "similarity": 85, "matched_voice": "en-US-AndrewNeural"}

    frame_len, hop = max(64, int(sr * 0.04)), max(32, int(sr * 0.02))
    min_lag, max_lag = max(1, int(sr / 360)), min(frame_len - 1, int(sr / 70))
    f0_list = []
    for start in range(0, len(audio) - frame_len, hop):
        frame = audio[start : start + frame_len]
        if float(np.mean(frame**2)) < 0.004: continue
        fr_sig = frame - np.mean(frame)
        corr = np.correlate(fr_sig, fr_sig, mode="full")[len(fr_sig) - 1 :]
        if len(corr) > max_lag and max_lag > min_lag:
            peak_idx = min_lag + int(np.argmax(corr[min_lag : max_lag + 1]))
            if (corr[peak_idx] / (corr[0] + 1e-9)) > 0.32 and peak_idx > 0:
                f0_list.append(float(sr / peak_idx))

    median_f0 = float(np.median(f0_list)) if f0_list else (195.0 if gender_hint == "female" else 115.0)
    notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    midi_num = int(round(12 * np.log2(max(30.0, median_f0) / 440.0) + 69))
    note_name = notes[midi_num % 12] + str(midi_num // 12 - 1)

    mid_idx = max(0, len(audio) // 2 - int(sr * 0.5))
    seg = audio[mid_idx : mid_idx + int(sr)] if len(audio) >= sr else audio
    fft_mag = np.abs(np.fft.rfft(seg))
    freqs = np.fft.rfftfreq(len(seg), 1.0 / sr)
    centroid = float(np.sum(freqs * fft_mag) / (np.sum(fft_mag) + 1e-9))
    timbre_desc = "Тёплый, бархатный, глубокий" if centroid < 1350 else ("Сбалансированный, естественный" if centroid < 1850 else "Звонкий, яркий, чёткий")

    win = int(sr * 0.05)
    env = [float(np.sqrt(np.mean(audio[i : i + win]**2))) for i in range(0, len(audio) - win, win // 2)]
    if len(env) > 10:
        env_arr = np.array(env)
        th = float(np.mean(env_arr) * 1.1)
        peaks = sum(1 for i in range(1, len(env_arr) - 1) if env_arr[i] > th and env_arr[i] > env_arr[i - 1] and env_arr[i] > env_arr[i + 1])
        syl_per_sec = float(peaks) / max(0.5, dur)
        tempo_factor = max(0.85, min(1.25, syl_per_sec / 3.8)) if syl_per_sec > 1.0 else 1.0
    else:
        tempo_factor = 1.0

    if gender_hint == "female" or median_f0 > 175.0:
        voice_type = "Женский меццо-сопрано / Контральто" if median_f0 < 195.0 else "Женское сопрано (Soprano)"
        matched = "en-US-JennyNeural" if median_f0 < 195.0 else "en-US-AriaNeural"
        base_f0 = 185.0 if median_f0 < 195.0 else 205.0
    else:
        if median_f0 < 104.0: voice_type, matched, base_f0 = "Мужской бас / Низкий баритон", "en-US-EricNeural", 98.0
        elif median_f0 < 118.0: voice_type, matched, base_f0 = "Мужской мягкий баритон (Baritone)", "en-US-AndrewNeural", 112.0
        elif median_f0 < 132.0: voice_type, matched, base_f0 = "Мужской тёплый баритон (Warm Baritone)", "en-US-BrianNeural", 120.0
        else: voice_type, matched, base_f0 = "Мужской тенор (Tenor)", "en-US-ChristopherNeural", 132.0

    pitch_delta_hz = max(-24, min(24, int(round(median_f0 - base_f0))))
    rate_delta_pct = max(-20, min(25, int(round((tempo_factor - 1.0) * 100))))
    similarity = max(88, min(97, int(96 - abs(median_f0 - (base_f0 + pitch_delta_hz)) * 0.8)))

    return {"valid": True, "f0": round(median_f0, 1), "note": note_name, "centroid": int(centroid), "voice_type": voice_type, "timbre": timbre_desc, "tempo_factor": round(tempo_factor, 2), "pitch_delta_hz": pitch_delta_hz, "rate_delta_pct": rate_delta_pct, "similarity": similarity, "matched_voice": matched}
`;
}

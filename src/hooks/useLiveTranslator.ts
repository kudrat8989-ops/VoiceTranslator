import { useState, useEffect, useRef, useCallback } from "react";
import { LiveTranslationEntry } from "../types/translator";
import { enumerateBrowserAudioDevices, fetchBrowserTranslation, speakBrowserUtterance } from "../utils/browserAudioUtils";

export interface BrowserAudioDevice { deviceId: string; kind: "audioinput" | "audiooutput"; label: string; index: number; }

const INITIAL_LOGS: LiveTranslationEntry[] = [
  { id: "d-1", timestamp: "10:45:12", channel: "mic_ru_en", sourceText: "Привет! Слышишь меня нормально?", translatedText: "Hey! Can you hear me clearly?", latencyMs: 142, ttsPlayed: true },
  { id: "d-2", timestamp: "10:45:19", channel: "loopback_en_ru", sourceText: "Yes, loud and clear!", translatedText: "Да, громко и четко!", latencyMs: 168, ttsPlayed: true },
];

export function useLiveTranslator() {
  const [devices, setDevices] = useState<BrowserAudioDevice[]>([]);
  const [activeChannel, setActiveChannel] = useState<"mic_ru_en" | "loopback_en_ru">("mic_ru_en");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rmsLevel, setRmsLevel] = useState(0);
  const [manualInput, setManualInput] = useState("");
  const [autoPlayTts, setAutoPlayTts] = useState(true);
  const [lastTranslatedEn, setLastTranslatedEn] = useState("Hey! Can you hear me clearly?");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<LiveTranslationEntry[]>(INITIAL_LOGS);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    setRmsLevel(0);
  }, []);

  const scanDevices = useCallback(async () => setDevices(await enumerateBrowserAudioDevices()), []);

  useEffect(() => {
    scanDevices();
    return () => stopRecording();
  }, [scanDevices, stopRecording]);

  const handleStartRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; setIsRecording(true);
      const ctx = new AudioContext(); audioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser(); analyser.fftSize = 256; src.connect(analyser);
      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      const updateRms = () => {
        analyser.getByteFrequencyData(dataArr);
        setRmsLevel(Math.min(1, dataArr.reduce((a, b) => a + b, 0) / dataArr.length / 128));
        animFrameRef.current = requestAnimationFrame(updateRms);
      };
      updateRms();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Не удалось открыть микрофон");
      stopRecording();
    }
  };

  const playSpeech = async (text: string, lang: string) => {
    setIsSpeaking(true);
    await speakBrowserUtterance(text, lang);
    setIsSpeaking(false);
  };

  const handleTranslateText = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    const t0 = performance.now(), isMic = activeChannel === "mic_ru_en";
    const translated = await fetchBrowserTranslation(text, isMic ? "ru" : "en", isMic ? "en" : "ru");
    const newEntry: LiveTranslationEntry = {
      id: "log-" + Date.now(), timestamp: new Date().toLocaleTimeString(), channel: activeChannel,
      sourceText: text, translatedText: translated, latencyMs: Math.round(performance.now() - t0), ttsPlayed: autoPlayTts,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 40)]);
    if (isMic) setLastTranslatedEn(translated);
    setManualInput(""); setIsProcessing(false);
    if (autoPlayTts) await playSpeech(translated, isMic ? "en-US" : "ru-RU");
  };

  return {
    devices, activeChannel, setActiveChannel, isRecording, isProcessing, isSpeaking,
    rmsLevel, manualInput, setManualInput, autoPlayTts, setAutoPlayTts, lastTranslatedEn,
    errorMsg, logs, setLogs, scanDevices, handleStartRecording, handleStopRecording: stopRecording,
    handleTranslateText, playSynthesizedSpeech: playSpeech,
  };
}

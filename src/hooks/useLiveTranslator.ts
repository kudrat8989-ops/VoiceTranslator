import { useState, useEffect, useRef } from "react";
import { LiveTranslationEntry } from "../types/translator";

export interface BrowserAudioDevice {
  deviceId: string;
  kind: "audioinput" | "audiooutput";
  label: string;
  index: number;
}

const INITIAL_LOGS: LiveTranslationEntry[] = [
  {
    id: "demo-1",
    timestamp: "10:45:12",
    channel: "mic_ru_en",
    sourceText: "Привет! Слышишь меня нормально без виртуальных кабелей?",
    translatedText: "Hey! Can you hear me clearly without virtual cables?",
    latencyMs: 142,
    ttsPlayed: true,
  },
  {
    id: "demo-2",
    timestamp: "10:45:19",
    channel: "loopback_en_ru",
    sourceText: "Yes, loud and clear! We can start testing the new build now.",
    translatedText: "Да, громко и четко! Мы можем начать тестировать новую сборку прямо сейчас.",
    latencyMs: 168,
    ttsPlayed: true,
  },
];

export function useLiveTranslator() {
  const [devices, setDevices] = useState<BrowserAudioDevice[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [activeChannel, setActiveChannel] = useState<"mic_ru_en" | "loopback_en_ru">("mic_ru_en");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rmsLevel, setRmsLevel] = useState(0);
  const [manualInput, setManualInput] = useState("");
  const [autoPlayTts, setAutoPlayTts] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<LiveTranslationEntry[]>(INITIAL_LOGS);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecordingCleanup = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRmsLevel(0);
  };

  const scanBrowserDevices = async (requestMic = false) => {
    setErrorMsg(null);
    try {
      if (requestMic) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach((t) => t.stop());
        setPermissionGranted(true);
      }
      const rawList = await navigator.mediaDevices.enumerateDevices();
      const filtered: BrowserAudioDevice[] = [];
      let inIdx = 0;
      let outIdx = 0;
      rawList.forEach((d) => {
        if (d.kind === "audioinput") {
          filtered.push({
            deviceId: d.deviceId,
            kind: "audioinput",
            label: d.label || `Микрофон #${inIdx} (разрешите доступ для названия)`,
            index: inIdx++,
          });
        } else if (d.kind === "audiooutput") {
          filtered.push({
            deviceId: d.deviceId,
            kind: "audiooutput",
            label: d.label || `Наушники / Выход #${outIdx}`,
            index: outIdx++,
          });
        }
      });
      setDevices(filtered);
      if (filtered.some((d) => d.label && !d.label.includes("разрешите доступ"))) {
        setPermissionGranted(true);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Не удалось получить доступ к микрофону браузера.");
    }
  };

  useEffect(() => {
    scanBrowserDevices(false);
    return () => stopRecordingCleanup();
  }, []);

  const playSynthesizedSpeech = async (text: string, lang: "en" | "ru") => {
    try {
      const voiceName = lang === "ru" ? "Kore" : "Puck";
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          await audio.play();
          return true;
        }
      }
    } catch {
      // Fallback to browser SpeechSynthesis
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "ru" ? "ru-RU" : "en-US";
      utter.rate = 1.05;
      window.speechSynthesis.speak(utter);
      return true;
    }
    return false;
  };

  const processAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.includes(",") ? res.split(",")[1] : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const direction = activeChannel === "mic_ru_en" ? "ru-to-en" : "en-to-ru";
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType, direction }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка перевода аудио");

      if (data.translatedText) {
        const played = autoPlayTts
          ? await playSynthesizedSpeech(data.translatedText, activeChannel === "mic_ru_en" ? "en" : "ru")
          : false;
        setLogs((prev) => [
          {
            id: `${Date.now()}`,
            timestamp: new Date().toLocaleTimeString("ru-RU", { hour12: false }),
            channel: activeChannel,
            sourceText: data.sourceText || "(Аудио фрагмент)",
            translatedText: data.translatedText,
            latencyMs: data.latencyMs || 180,
            ttsPlayed: played,
          },
          ...prev,
        ]);
      } else {
        setErrorMsg("Речь не распознана (слишком тихий сигнал).");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Ошибка при обработке голосового пакета");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      setPermissionGranted(true);

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const dataArray = new Float32Array(analyser.fftSize);
      const updateMeter = () => {
        analyser.getFloatTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        setRmsLevel(Math.sqrt(sum / dataArray.length));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        stopRecordingCleanup();
        if (blob.size > 500) await processAudioBlob(blob, mime);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setErrorMsg(`Не удалось запустить микрофон: ${err?.message || "Проверьте доступ"}`);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTranslateText = async (
    customText?: string,
    customChannel?: "mic_ru_en" | "loopback_en_ru"
  ) => {
    const textToUse = (customText ?? manualInput).trim();
    const channelToUse = customChannel ?? activeChannel;
    if (!textToUse) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const direction = channelToUse === "mic_ru_en" ? "ru-to-en" : "en-to-ru";
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToUse, direction }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка перевода");

      const played =
        autoPlayTts && data.translatedText
          ? await playSynthesizedSpeech(data.translatedText, channelToUse === "mic_ru_en" ? "en" : "ru")
          : false;
      setLogs((prev) => [
        {
          id: `${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("ru-RU", { hour12: false }),
          channel: channelToUse,
          sourceText: data.sourceText || textToUse,
          translatedText: data.translatedText,
          latencyMs: data.latencyMs || 135,
          ttsPlayed: played,
        },
        ...prev,
      ]);
      if (!customText) setManualInput("");
    } catch (err: any) {
      setErrorMsg(err?.message || "Не удалось выполнить перевод");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    devices,
    permissionGranted,
    activeChannel,
    setActiveChannel,
    isRecording,
    isProcessing,
    rmsLevel,
    manualInput,
    setManualInput,
    autoPlayTts,
    setAutoPlayTts,
    errorMsg,
    logs,
    setLogs,
    scanBrowserDevices,
    playSynthesizedSpeech,
    handleStartRecording,
    handleStopRecording,
    handleTranslateText,
  };
}

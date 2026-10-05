import { BrowserAudioDevice } from "../hooks/useLiveTranslator";

export async function enumerateBrowserAudioDevices(): Promise<BrowserAudioDevice[]> {
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    return list
      .filter((d) => d.kind === "audioinput" || d.kind === "audiooutput")
      .map((d, idx) => ({
        deviceId: d.deviceId,
        kind: d.kind as "audioinput" | "audiooutput",
        label: d.label || `${d.kind === "audioinput" ? "Микрофон" : "Выход"} #${idx + 1}`,
        index: idx,
      }));
  } catch {
    return [];
  }
}

export async function fetchBrowserTranslation(text: string, src: string, dst: string): Promise<string> {
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${dst}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((seg: [string]) => seg[0]).join("").trim();
      }
    }
  } catch {
    // fallback
  }
  return text;
}

export function speakBrowserUtterance(text: string, lang: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = 1.05;
    utt.onend = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.speak(utt);
  });
}

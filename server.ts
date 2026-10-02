import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Translate text or audio (RU <-> EN)
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, audioBase64, mimeType, direction = "ru-to-en" } = req.body;
      const startTime = Date.now();

      let sourceText = text || "";

      if (audioBase64 && !sourceText) {
        const transcribeRes = await ai.models.generateContent({
          model: "gemini-3.5-transcribe",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "audio/webm",
                  data: audioBase64,
                },
              },
              {
                text:
                  direction === "ru-to-en"
                    ? "Transcribe this Russian speech accurately into Russian text. Return only the transcription, nothing else."
                    : "Transcribe this English speech accurately into English text. Return only the transcription, nothing else.",
              },
            ],
          },
        });
        sourceText = (transcribeRes.text || "").trim();
      }

      if (!sourceText) {
        return res.json({
          sourceText: "",
          translatedText: "",
          latencyMs: Date.now() - startTime,
        });
      }

      const targetLang = direction === "ru-to-en" ? "English" : "Russian";
      const sourceLang = direction === "ru-to-en" ? "Russian" : "English";

      const translateRes = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Translate the following ${sourceLang} speech into natural, conversational ${targetLang}. Output JSON with sourceText and translatedText.\n\nInput: ${sourceText}`,
        config: {
          systemInstruction:
            "You are a zero-latency real-time voice translator. Translate concisely and naturally for spoken output.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sourceText: { type: Type.STRING },
              translatedText: { type: Type.STRING },
            },
            required: ["sourceText", "translatedText"],
          },
        },
      });

      const parsed = JSON.parse((translateRes.text || "{}").trim());
      return res.json({
        sourceText: parsed.sourceText || sourceText,
        translatedText: parsed.translatedText || "",
        latencyMs: Date.now() - startTime,
      });
    } catch (error: any) {
      console.error("Translation API error:", error);
      return res.status(500).json({
        error: error?.message || "Failed to process translation",
      });
    }
  });

  // Synthesize speech using Gemini 3.8 Flash Lite TTS (returns WAV base64)
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceName = "Kore" } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Missing text for TTS" });
      }

      const startTime = Date.now();
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: text.trim(),
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        return res.status(500).json({ error: "No audio returned from TTS model" });
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType: "audio/wav",
        latencyMs: Date.now() - startTime,
      });
    } catch (error: any) {
      console.error("TTS API error:", error);
      return res.status(500).json({
        error: error?.message || "Failed to synthesize speech",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoiceTranslator Workbench running on http://localhost:${PORT}`);
  });
}

startServer();

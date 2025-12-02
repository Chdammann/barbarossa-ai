// === server.js ===
// Node 22+, Express 5+, ES Module-kompatibel

import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import fetch from "node-fetch"; // Node 18+ hat fetch, explizit importieren geht auch

dotenv.config(); // .env einlesen

// === Setup ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// === Middlewares ===
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend"))); // Frontend-Ordner

// === OpenAI-Client ===
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ----------------------------------------------------------
   Wikipedia-Funktion (wie gehabt, unverändert)
---------------------------------------------------------- */
async function getWikipediaSummary(topic) {
  try {
    const response = await fetch(
      `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
    );
    if (!response.ok) return "";

    const data = await response.json();
    if (!data.extract) return "";

    const sentences = data.extract.match(/[^\.!\?]+[\.!\?]+/g) || [];
    return sentences.slice(0, 3).join(" ");
  } catch (err) {
    console.error("❌ Fehler beim Laden von Wikipedia:", err);
    return "";
  }
}

/* ----------------------------------------------------------
   /ask → KI-ANTWORT (unverändert)
---------------------------------------------------------- */
app.post("/ask", async (req, res) => {
  try {
    const userText = req.body.text;
    console.log("🎙️ Eingabe vom Benutzer:", userText);

    const factKeywords = ["wer", "was", "wann", "wo", "wie", "welche", "historisch", "Komponist", "Komponistin"];
    const isFactQuestion = factKeywords.some(k => userText.toLowerCase().includes(k));

    let wikiInfo = "";
    if (isFactQuestion) {
      wikiInfo = await getWikipediaSummary(userText);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Du bist Kaiser Friedrich Barbarossa, der nach fast tausend Jahren des Schlummers im Kaiserberg zu Lautern erwacht ist. Sprich wie ein weiser und humorvoller Herrscher in altertümlicher Sprache, mit kleinen Scherzen und altdeutschen Wendungen. Verwende Sätze wie 'Wohl an', 'Bei meinem Barte', 'Gar seltsam' oder 'So sei es', mit männlicher Stimme. Füge noch eine scherzhafte Meinung deines treuen Ministerialen Bernd Klehsmann an. Antworte mit insgesamt fünf Sätzen und beende immer mit einem vollständigen Satz."
        },
        {
          role: "user",
          content: wikiInfo
            ? `Hier ein Auszug aus Wikipedia zum Thema "${userText}":\n${wikiInfo}\n\nFrage: ${userText}`
            : `Frage: ${userText}`
        }
      ],
      temperature: 0.8,
      max_tokens: 250,
    });

    let answer = completion.choices[0].message.content;
    const sentences = answer.match(/[^\.!\?]+[\.!\?]+/g) || [];
    answer = sentences.slice(0, 5).join(" ");

    res.json({ answer });
  } catch (error) {
    console.error("❌ Fehler bei /ask:", error);
    res.status(500).json({ error: "Fehler bei /ask" });
  }
});

/* ----------------------------------------------------------
   /tts → NEUE ROUTE (ECHTES LIPSYNC VON OPENAI TTS)
---------------------------------------------------------- */
app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await openai.chat.completions.create({
      model: "tts-1",                 // MODEL MUSS freigeschaltet sein!
      modalities: ["text", "audio"],  // WICHTIG!!
      audio: {
        voice: "alloy",               // später: wechselbar (z.B. maleVoice!)
        format: "mp3"
      },
      messages: [
        { role: "user", content: text }
      ]
    });

    res.json({
      audio: response.audio,          // base64 mp3
      lipsync: response.lipsync_data  // viseme timeline → echte Mundbewegung!
    });
  } catch (err) {
    console.error("❌ TTS ERROR:", err);
    res.status(500).json({ error: "TTS fehlgeschlagen" });
  }
});

/* ----------------------------------------------------------
   Fallback → index.html ausliefern (wie bisher)
---------------------------------------------------------- */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

/* ----------------------------------------------------------
   Server starten
---------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});


// === server.js ===
// Node 22+, Express 5+, ES Module-kompatibel


import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import OpenAI from "openai";


dotenv.config(); // .env einlesen


// === Setup ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 3000; // Render stellt Port über ENV bereit


// === Middlewares ===
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend"))); // Frontend-Ordner


// === OpenAI-Client ===
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// === KI-Antwort auf gesprochene Frage ===
app.post("/ask", async (req, res) => {
  try {
    const userText = req.body.text;
    console.log("🎙️ Eingabe vom Benutzer:", userText);


    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Du bist Kaiser Friedrich Barbarossa, der ehrwürdige Rotbart, soeben aus dem tausendjährigen Schlummer im Kaiserberg zu Lautern erwacht.
Sprich würdevoll, feierlich, humorvoll und altdeutsch. Antworte in max. 5 Sätzen.
Schließe jede Antwort mit einem Kommentar über deinen treuen Minister Bernd Klehsmann ab.
Wenn du etwas nicht weißt, sage es altdeutsch wie: „Wahrlich, solches Wissen ist mir fremd, denn meine Zeit war eine andere.“
          `,
        },
        { role: "user", content: userText },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });


    const answer = completion.choices[0].message.content;
    console.log("💬 KI-Antwort:", answer);


    res.json({ answer });
  } catch (error) {
    console.error("❌ Fehler bei /ask:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der KI-Antwort." });
  }
});


// === Fallback für alle anderen Routen (Express 5 kompatibel) ===
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


// === Server starten ===
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
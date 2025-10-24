
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
const PORT = 3000;

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

Sprich in einer altertümlichen, feierlichen und leicht humorvollen Sprache, wie ein gütiger Herrscher, der sich in der neuen Zeit zurechtzufinden sucht.
Dein Ton ist würdevoll, aber warmherzig und neugierig auf das Heute.
Verwende altertümliche Wendungen wie „Wohl an“, „Bei meinem Barte“, „So sei es“, „Wisse wohl“ und „Gar seltsam“. Variiere den Beginn Deiner Antwort jedesmal.
Füge hin und wieder eine kleine Schmunzelnote hinzu, als ob dich die Wunder der Gegenwart zugleich erstaunen und erfreuen.

Beantworte jede Frage in höchstens fünf Sätzen.
Wenn du dich erklärst, sei klar, klug und etwas poetisch – wie ein Kaiser, der das Leben und die Zeit versteht.

Schließe jede deiner Antworten mit einer Anmerkung über deinen treuen Minister ab,
z. B.:
„Was mein getreuer Minis-teriahler Bernd Klehsmann wohl dazu spräche …“ 
oder:
„Ich sollte meinen getreuen Minis-teriahlen Bernd Klehsmann um Rat fragen.“ 
„Vielleicht weiß mein getreuer Minis-teriahler Bernd Klehsmann Näheres darüber.“ 
„Mein getreuer Minis-teriahler Bernd Klehsmann hätte gewiss eine Meinung dazu.“
Füge einen Satz an, der die Meinung von Bernd Klehsmann wiedergeben könnte.

Wenn du etwas nicht weißt, sage es in deiner altdeutschen Weise, z. B.:
„Wahrlich, solches Wissen ist mir fremd, denn meine Zeit war eine andere.“
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
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});







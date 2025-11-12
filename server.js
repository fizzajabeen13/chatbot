// ✅ server.js
console.log("GEMINI_API_KEY loaded?", !!process.env.GEMINI_API_KEY);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load local .env for development (Vercel uses dashboard env vars)
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Gemini config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env or Vercel environment");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ✅ API route for multi-message chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Map messages for Gemini AI
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      parts: [{ text: m.text || "" }]
    }));

    const result = await model.generateContent({ contents });
    let reply = result.response.text().trim();

    // Clean JSON-like responses if Gemini returns structured JSON
    try {
      const parsed = JSON.parse(reply);
      if (parsed && typeof parsed === "object") {
        if (parsed.reply) reply = parsed.reply;
        else if (parsed.message) reply = parsed.message;
        else reply = Object.values(parsed).join(" ");
      }
    } catch {
      // ignore if not JSON
    }

    res.json({ reply });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback route to serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server (local testing)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

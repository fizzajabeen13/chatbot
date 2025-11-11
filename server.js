// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config(); // load .env

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.MODEL || "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

// ✅ Configure Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL });

// ✅ Setup Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // frontend files

// ✅ Simple /chat route (single message)
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const result = await model.generateContent(message);
    let reply = result?.response?.text() || "";

    // Try to extract actual text if the model returns JSON-like data
    try {
      const parsed = JSON.parse(reply);
      if (parsed.reply) reply = parsed.reply;
    } catch {
      // ignore if not valid JSON
    }

    // Clean escape sequences like \n, \"
    reply = reply
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Multi-message chat (if your frontend sends conversation history)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ error: "messages array required" });

    const contents = messages.map(m => ({
      role: m.role || "user",
      parts: [{ text: m.text || m.content || "" }]
    }));

    const result = await model.generateContent({ contents });
    let reply = result.response.text().trim();

    // 🧹 Clean step 1: if it's a JSON string like {"reply":"hi"}
    try {
      const parsed = JSON.parse(reply);
      if (parsed && typeof parsed === "object") {
        if (parsed.reply) reply = parsed.reply;
        else if (parsed.message) reply = parsed.message;
        else reply = Object.values(parsed).join(" ");
      }
    } catch {
      // Not JSON, ignore
    }

    // 🧹 Clean step 2: remove leftover braces/quotes if any
    reply = reply
      .replace(/^[{\[]+|[}\]]+$/g, "") // remove starting/ending braces/brackets
      .replace(/^"|"$/g, "")           // remove wrapping quotes
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .trim();

    res.json({ reply });
  } catch (err) {
    console.error("API Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


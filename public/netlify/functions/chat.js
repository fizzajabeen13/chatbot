// chatbot/netlify/functions/chat.js

export async function handler(event, context) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const model = process.env.MODEL || "gemini-2.0-flash";

    const body = JSON.parse(event.body);
    const messages = body.messages || [];

    // Call Gemini API
    const response = await fetch("https://api.gemini.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${geminiApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map(m => ({ role: m.role, content: m.text }))
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data?.choices?.[0]?.message?.content || "No reply" })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

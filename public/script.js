async function sendMessage(messages) {
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  const data = await resp.json();
  let reply = data.reply || "";

  reply = reply
    .replace(/\\n/g, "<br>")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .trim();

  addMessage("bot", reply);
}

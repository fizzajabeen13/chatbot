async function sendMessage(message) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();
  const reply = data.reply || "No reply";

  document.querySelector("#chat").innerHTML += `
    <div class="user">You: ${message}</div>
    <div class="bot">Bot: ${reply}</div>
  `;
}

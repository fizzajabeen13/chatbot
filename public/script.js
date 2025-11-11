async function sendMessage(messages) {
  const resp = await fetch('/.netlify/functions/chat', {

    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  const data = await resp.json();

  // Make sure we have a valid reply
  let reply = data.reply || "";

  // Clean up unwanted characters and format nicely
  reply = reply
    .replace(/\\n/g, "<br>")  // new lines
    .replace(/\\"/g, '"')     // escaped quotes
    .replace(/\\\\/g, "\\")      // remove extra backslashes
    .trim();

  // Display the cleaned text
  addMessage("bot", reply);
}







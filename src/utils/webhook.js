export async function sendDiscordLog(content) {
    try {
      await fetch("/api/discord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      });
    } catch (err) {
      console.error("❌ Failed to send Discord log:", err);
    }
  }  
export async function sendDiscordLog(content) {
    const webhookUrl = "https://discord.com/api/webhooks/1361694203851313334/7IYucdyv9s0_ifXOQCyQZfYqbsR1HqbXQY4e20_qpYYAqi25EGgylIycAVWCGeDHeNo0";
  
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: `📢 ${content}`
        })
      });
    } catch (err) {
      console.error("❌ Failed to send Discord webhook:", err);
    }
  }  
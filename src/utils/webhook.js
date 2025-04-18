export async function sendDiscordLogEmbed({ title, description, color, fields }) {
    try {
      await fetch("/api/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embed: {
            embeds: [
              {
                title,
                description,
                color,
                fields,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }),
      });
    } catch (err) {
      console.error("❌ Failed to send Discord embed:", err);
    }
  }

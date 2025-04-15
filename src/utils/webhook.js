export async function sendDiscordLog(content) {
    console.log("📨 Sending webhook:", content); // ✅ log do browserové konzole
  
    try {
      const res = await fetch("/api/discord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      });
  
      const data = await res.json();
      console.log("📬 Webhook response from API:", data); // ✅ log odpovědi z backendu
  
    } catch (err) {
      console.error("❌ Frontend failed to reach API /api/discord:", err);
    }
  } 

export default async function handler(req, res) {
    console.log("📥 Incoming request to /api/discord");
  
    if (req.method !== "POST") {
      console.warn("❌ Method not allowed:", req.method);
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    const { content } = req.body;
    console.log("📦 Payload received:", content);
  
    const webhookUrl = "https://discord.com/api/webhooks/1361694203851313334/7IYucdyv9s0_ifXOQCyQZfYqbsR1HqbXQY4e20_qpYYAqi25EGgylIycAVWCGeDHeNo0";
  
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
  
      console.log("📤 Discord response status:", response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Discord error response:", errorText);
        return res.status(500).json({ error: "Webhook failed", details: errorText });
      }
  
      console.log("✅ Message successfully sent to Discord");
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("❌ Exception in webhook handler:", err);
      return res.status(500).json({ error: "Webhook failed (exception)", details: err.message });
    }
  }  
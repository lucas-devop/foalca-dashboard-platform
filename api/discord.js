export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    const { embed } = req.body;
  
    const webhookUrl = "https://discord.com/api/webhooks/1361694203851313334/7IYucdyv9s0_ifXOQCyQZfYqbsR1HqbXQY4e20_qpYYAqi25EGgylIycAVWCGeDHeNo0";
  
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(embed),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(500).json({ error: "Webhook failed", details: errorText });
      }
  
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Webhook failed (exception)", details: err.message });
    }
  }  
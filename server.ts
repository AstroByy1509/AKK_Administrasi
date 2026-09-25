import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for WhatsApp notification
  app.post("/api/notify-whatsapp", async (req, res) => {
    const { phoneNumber, message } = req.body;
    
    if (!process.env.WHATSAPP_API_KEY) {
      return res.status(500).json({ error: "WhatsApp API key not configured" });
    }

    try {
      // Placeholder for actual WhatsApp API implementation (e.g., Twilio)
      // console.log(`Sending to ${phoneNumber}: ${message}`);
      
      // In a real implementation, call the provider's API here.
      // Example:
      // await axios.post('https://api.twilio.com/...', { ... }, { headers: { Authorization: process.env.WHATSAPP_API_KEY } });

      res.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
      console.error("Failed to send WhatsApp notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Detect production mode (either via NODE_ENV or if we are executing the compiled bundle in /dist)
  const isProduction = process.env.NODE_ENV === "production" || 
                       (typeof __filename !== "undefined" && (__filename.includes("dist") || __filename.includes("server.cjs")));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(process.env.PORT) || PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${Number(process.env.PORT) || PORT}`);
  });
}

startServer();

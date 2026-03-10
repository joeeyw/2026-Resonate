import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const OPENAI_API_KEY = process.env.GPT_API_KEY;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const REDIRECT_URI = `${APP_URL}/auth/callback`;

console.log("OAuth Config:", {
  APP_URL,
  REDIRECT_URI,
  HAS_CLIENT_ID: !!SPOTIFY_CLIENT_ID,
  HAS_CLIENT_SECRET: !!SPOTIFY_CLIENT_SECRET,
  HAS_OPENAI_KEY: !!OPENAI_API_KEY
});

app.use(express.json());

// Spotify Auth URL Endpoint
app.get("/api/auth/url", (req, res) => {
  if (!SPOTIFY_CLIENT_ID) {
    return res.status(500).json({ error: "SPOTIFY_CLIENT_ID is not configured" });
  }

  const scope = "user-read-private user-read-email";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

// Spotify Callback Handler
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: REDIRECT_URI,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    // In a real app, you'd store tokens in a session or database.
    // For this demo, we'll just send a success message to the opener.
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                payload: { accessToken: '${access_token}' }
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Spotify OAuth Error:", error.response?.data || error.message);
    res.status(500).send("Authentication failed");
  }
});

// OpenAI Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key is not configured" });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const aiMessage = response.data.choices[0].message;
    res.json({ message: aiMessage });
  } catch (error: any) {
    console.error("OpenAI API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to get response from OpenAI",
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile("dist/index.html", { root: "." });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

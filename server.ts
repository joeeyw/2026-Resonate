import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import path from "node:path";
import { spawn } from "node:child_process";

dotenv.config();

const app = express();
const PORT = 3000;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const OPENAI_API_KEY = process.env.GPT_API_KEY;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const REDIRECT_URI = `${APP_URL}/auth/callback`;
const PYTHON_BIN = process.env.PYTHON_BIN || "python";
const SMOLAGENT_SCRIPT = path.resolve(process.cwd(), "pyagent", "smolagent_runner.py");

console.log("OAuth Config:", {
  APP_URL,
  REDIRECT_URI,
  HAS_CLIENT_ID: !!SPOTIFY_CLIENT_ID,
  HAS_CLIENT_SECRET: !!SPOTIFY_CLIENT_SECRET,
  HAS_OPENAI_KEY: !!OPENAI_API_KEY
});

app.use(express.json());

type ChatMessageInput = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AgentResponse = {
  content: string;
};

async function runSmolAgent(messages: ChatMessageInput[]): Promise<AgentResponse> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [SMOLAGENT_SCRIPT], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        OPENAI_API_KEY: OPENAI_API_KEY || "",
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `smolagents process exited with code ${code}`));
        return;
      }

      const lines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const lastLine = lines[lines.length - 1];

      if (!lastLine) {
        reject(new Error("No output from smolagents process"));
        return;
      }

      try {
        const parsed = JSON.parse(lastLine) as AgentResponse;
        if (!parsed?.content || typeof parsed.content !== "string") {
          reject(new Error("Invalid response format from smolagents process"));
          return;
        }
        resolve(parsed);
      } catch (error: any) {
        reject(new Error(`Failed parsing smolagents output: ${error.message}`));
      }
    });

    child.stdin.write(JSON.stringify({ messages }));
    child.stdin.end();
  });
}

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

// smolagents Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key is not configured" });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const normalizedMessages = messages
    .filter((message: any) => {
      return (
        message &&
        typeof message.content === "string" &&
        ["system", "user", "assistant"].includes(message.role)
      );
    })
    .map((message: any) => ({
      role: message.role as "system" | "user" | "assistant",
      content: message.content,
    }));

  if (!normalizedMessages.length) {
    return res.status(400).json({ error: "No valid chat messages were provided" });
  }

  try {
    const agentResult = await runSmolAgent(normalizedMessages);
    res.json({
      message: {
        role: "assistant",
        content: agentResult.content,
      },
    });
  } catch (error: any) {
    console.error("smolagents API Error:", error.message);
    res.status(500).json({ 
      error: "Failed to get response from smolagents",
      details: error.message,
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

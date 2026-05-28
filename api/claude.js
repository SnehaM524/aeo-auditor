// api/claude.js
// Secure serverless function. Your API key lives ONLY here, on Vercel's
// server, as an environment variable. It is never exposed to the browser.
// The front-end calls THIS function; this function calls Anthropic.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Simple password gate so randoms can't run up your bill.
  // Set SITE_PASSWORD in Vercel env vars. The front-end sends it in the header.
  const required = process.env.SITE_PASSWORD;
  if (required) {
    const provided = req.headers["x-site-password"];
    if (provided !== required) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }

  try {
    const { messages, max_tokens } = req.body;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: max_tokens || 1200,
        messages,
      }),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

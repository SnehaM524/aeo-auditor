// api/claude.js
// Secure serverless function. Your API key lives ONLY here, on Vercel's
// server, as an environment variable. It is never exposed to the browser.
// The front-end calls THIS function; this function calls Anthropic.

// Small helper: pause for a number of milliseconds.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Calls Anthropic, and retries when the API is rate limited (429) or
// temporarily overloaded (529). Waits longer after each failed attempt.
async function callAnthropicWithRetry(apiKey, payload, maxRetries = 4) {
  let lastData = null;
  let lastStatus = 500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    lastData = data;
    lastStatus = response.status;

    // Success. Return right away.
    if (response.ok) {
      return { status: response.status, data };
    }

    // Retryable errors: rate limit (429) and overloaded (529).
    const retryable = response.status === 429 || response.status === 529;
    if (retryable && attempt < maxRetries) {
      // Respect the API's retry-after header if it sends one.
      const retryAfter = Number(response.headers.get("retry-after"));
      // Otherwise back off: 1s, 2s, 4s, 8s.
      const waitMs = retryAfter ? retryAfter * 1000 : Math.pow(2, attempt) * 1000;
      console.log(
        `Rate limited (status ${response.status}). Attempt ${attempt + 1}. Waiting ${waitMs}ms.`
      );
      await sleep(waitMs);
      continue;
    }

    // Not retryable, or we ran out of retries. Log and stop.
    console.log("ANTHROPIC ERROR:", JSON.stringify(data));
    return { status: response.status, data };
  }

  // Should not reach here, but return the last thing we saw.
  return { status: lastStatus, data: lastData };
}

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

    const payload = {
      model: "claude-sonnet-4-5-20250929",
      max_tokens: max_tokens || 1200,
      messages,
    };

    const { status, data } = await callAnthropicWithRetry(apiKey, payload);

    // If Anthropic returned an error, pass its real message back to the
    // browser so the error box shows something useful, not "[object Object]".
    if (status < 200 || status >= 300) {
      const message =
        (data && data.error && data.error.message) ||
        JSON.stringify(data) ||
        ("status " + status);
      return res.status(status).json({ error: message });
    }

    return res.status(status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

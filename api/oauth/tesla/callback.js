// Tesla Fleet API OAuth callback.
// Receives ?code=...&state=... from auth.tesla.com after the user approves scopes.
// Does NOT exchange the code for tokens here — that happens on Doruk's Mac so
// tokens never traverse Vercel. We just render a confirmation page; the local
// setup script asks the user to paste the full URL from their address bar.

export default function handler(req, res) {
  const { code, state, error, error_description } = req.query;
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const escape = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const page = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} — Travis</title>
<style>
  body { font: 16px/1.5 -apple-system, system-ui, sans-serif; max-width: 640px; margin: 6vh auto; padding: 0 1.25rem; color: #222; }
  h1 { font-size: 1.4rem; margin-top: 0; }
  code { background: #f4f4f4; padding: 0.1em 0.35em; border-radius: 3px; font-size: 0.95em; }
  .ok { color: #0a7c2f; }
  .err { color: #b22222; }
  .quiet { color: #666; }
  .box { border: 1px solid #ddd; border-radius: 6px; padding: 1rem; margin: 1rem 0; background: #fafafa; }
</style>
</head>
<body>
${body}
<p class="quiet" style="margin-top: 3rem; font-size: 0.85em;">travis-site · Tesla OAuth callback</p>
</body>
</html>`;

  if (error) {
    res.status(400).send(
      page(
        "Authorization failed",
        `<h1 class="err">Authorization failed</h1>
<p><code>${escape(error)}</code></p>
${error_description ? `<p>${escape(error_description)}</p>` : ""}
<p>Run the setup script again on your Mac.</p>`
      )
    );
    return;
  }

  if (!code) {
    res.status(400).send(
      page(
        "Missing code",
        `<h1 class="err">No authorization code returned</h1>
<p>Tesla redirected here without a <code>code</code> parameter. Try the OAuth flow again.</p>`
      )
    );
    return;
  }

  res.status(200).send(
    page(
      "OAuth complete",
      `<h1 class="ok">Authorization complete</h1>
<p>Tesla returned an authorization code. <strong>Copy the full URL from your browser's address bar</strong> and paste it back into the setup script in your terminal.</p>
<div class="box">
  <p style="margin: 0;"><strong>State:</strong> <code>${escape(state)}</code></p>
  <p class="quiet" style="margin: 0.4rem 0 0; font-size: 0.85em;">Verify this matches the value the setup script printed before opening the browser.</p>
</div>
<p class="quiet">The auth code itself is short-lived and one-shot. The token exchange happens on your Mac, not here — Vercel never sees the access or refresh token.</p>`
    )
  );
}

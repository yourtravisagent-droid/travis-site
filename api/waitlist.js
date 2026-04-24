// Vercel Serverless Function — waitlist signup handler.
//
// POST /api/waitlist  {email: "person@example.com", note?: "..."}
//
// Validates the email, then calls the Resend API to email
// yourtravisagent@gmail.com (the Travis inbox) with an "incoming request"
// formatted subject so Travis' inbox-scan can classify and route it.
//
// Env vars (set in Vercel):
//   RESEND_API_KEY     — required
//   WAITLIST_TO        — defaults to yourtravisagent@gmail.com
//   WAITLIST_FALLBACK  — if the primary rejects (Resend sandbox limits),
//                         retry to this address (defaults to doruksart@gmail.com)
//   RESEND_FROM        — sender; defaults to "Travis <onboarding@resend.dev>"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Body may arrive as a parsed JSON object or as a raw string — accept either.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const email = String(body.email || "").trim();
  const note = String(body.note || "").trim().slice(0, 500);
  const referrer = String(req.headers["referer"] || "").slice(0, 300);
  const ua = String(req.headers["user-agent"] || "").slice(0, 300);

  if (!EMAIL_RE.test(email) || email.length > 320) {
    return res.status(400).json({ ok: false, error: "invalid_email" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "server_misconfigured" });
  }

  const from = process.env.RESEND_FROM || "Travis Waitlist <onboarding@resend.dev>";
  const primary = process.env.WAITLIST_TO || "yourtravisagent@gmail.com";
  const fallback = process.env.WAITLIST_FALLBACK || "doruksart@gmail.com";

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 540px;">
      <h2 style="color:#80e5c3;">Travis waitlist — new signup</h2>
      <p><b>Email:</b> <code>${escapeHtml(email)}</code></p>
      ${note ? `<p><b>Note:</b> ${escapeHtml(note)}</p>` : ""}
      <p style="color:#888; font-size:13px;">
        Referrer: ${escapeHtml(referrer) || "(direct)"}<br>
        Submitted: ${new Date().toISOString()}
      </p>
    </div>`;

  const subject = `[Travis waitlist] ${email}`;

  // Try primary, fall back if Resend sandbox rejects.
  const attempts = [primary];
  if (fallback && fallback !== primary) attempts.push(fallback);

  let lastErr = null;
  for (const to of attempts) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: to === fallback ? `[fallback] ${subject}` : subject,
          html,
          reply_to: email,
        }),
      });
      const payload = await r.json().catch(() => ({}));
      if (r.ok) {
        return res.status(200).json({
          ok: true,
          delivered_to: to,
          resend_id: payload.id || null,
        });
      }
      lastErr = { status: r.status, body: payload };
      // Common Resend error: `You can only send testing emails to your own email address`
      // — that triggers the fallback attempt.
    } catch (exc) {
      lastErr = { error: String(exc).slice(0, 200) };
    }
  }

  return res.status(502).json({
    ok: false,
    error: "upstream_mail_failed",
    detail: lastErr,
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

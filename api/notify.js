// POST /api/notify — Roamdar launch notification signup -> email via Resend.
// Requires RESEND_API_KEY env var. Sends the lead to info@varantinc.com.

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const email = String(body.email || "").trim().slice(0, 160);
  if (!isEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Notification service is not configured yet." });
  }

  const from = process.env.CONTACT_FROM || "Varant Inc Website <website@varantinc.com>";
  const to = process.env.CONTACT_TO || "info@varantinc.com";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "[Roamdar] New launch notification signup",
        text: `New Roamdar launch notification request:\n\nEmail: ${email}\n\nSource: varantinc.com/products#roamdar`,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("Resend error:", t);
      return res.status(502).json({ error: "Could not send notification. Please try again." });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Notify error:", e);
    return res.status(502).json({ error: "Could not send notification. Please try again." });
  }
};

// POST /api/contact — website contact form -> email via Resend.
// Requires RESEND_API_KEY env var (free at https://resend.com, 100 emails/day).
// Also verify varantinc.com as a sending domain in Resend (DNS records) or
// set CONTACT_FROM to an already-verified address.

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

  // Honeypot: bots fill this, humans don't (field is hidden).
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);
  const company = String(body.company || "").trim().slice(0, 160);
  const topic = String(body.topic || "").trim().slice(0, 80);
  const message = String(body.message || "").trim().slice(0, 5000);
  const source = String(body.source || "").trim().slice(0, 120);

  if (!name || !isEmail(email) || !message) {
    return res.status(400).json({ error: "Please fill in your name, a valid email, and a message." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Email service is not configured yet. Please email info@varantinc.com directly." });
  }

  const from = process.env.CONTACT_FROM || "Varant Inc Website <website@varantinc.com>";
  const to = process.env.CONTACT_TO || "info@varantinc.com";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: "Website enquiry: " + (topic || "General") + " — " + name,
        text:
          "Name: " + name + "\n" +
          "Email: " + email + "\n" +
          "Company: " + (company || "—") + "\n" +
          "Topic: " + (topic || "—") + "\n" +
          "Source: " + (source || "contact page") + "\n\n" +
          message
      })
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error("Resend error:", r.status, t.slice(0, 300));
      return res.status(502).json({ error: "Couldn't send your message just now. Please email info@varantinc.com directly." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err && err.message);
    return res.status(502).json({ error: "Couldn't send your message just now. Please email info@varantinc.com directly." });
  }
};

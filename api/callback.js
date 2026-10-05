// Vercel serverless function — step 2 of the Decap CMS GitHub OAuth flow.
// Exchanges the OAuth code for an access token and hands it to the CMS popup.
// Requires env vars: GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET
// Register this URL as the Authorization callback URL in your GitHub OAuth App:
//   https://varantinc.com/api/callback
module.exports = async (req, res) => {
  const renderBody = (status, content) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body><script>
(function() {
  function receiveMessage(e) {
    window.removeEventListener("message", receiveMessage, false);
    window.opener.postMessage(
      "authorization:github:${status}:" + JSON.stringify(${JSON.stringify(content)}),
      e.origin
    );
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`;

  try {
    const code = req.query && req.query.code;
    if (!code) {
      res.status(400).send(renderBody("error", { message: "Missing authorization code." }));
      return;
    }
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code: code,
      }),
    });
    const data = await tokenResp.json();
    if (!data.access_token) {
      res.status(401).send(renderBody("error", { message: "GitHub authorization failed." }));
      return;
    }
    res.setHeader("Content-Type", "text/html");
    res.send(renderBody("success", { token: data.access_token, provider: "github" }));
  } catch (err) {
    res.status(500).send(renderBody("error", { message: "OAuth callback failed." }));
  }
};

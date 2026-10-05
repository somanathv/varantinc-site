// Vercel serverless function — step 1 of the Decap CMS GitHub OAuth flow.
// Redirects the admin user to GitHub to authorize the CMS.
// Requires env var: GITHUB_OAUTH_CLIENT_ID
module.exports = (req, res) => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("GITHUB_OAUTH_CLIENT_ID is not set. See README.md for admin setup.");
    return;
  }
  const scope = (req.query && req.query.scope) || "repo";
  const authorizeUrl =
    "https://github.com/login/oauth/authorize?client_id=" +
    encodeURIComponent(clientId) +
    "&scope=" +
    encodeURIComponent(scope);
  res.writeHead(302, { Location: authorizeUrl });
  res.end();
};

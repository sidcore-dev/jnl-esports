import { STATE_COOKIE, cookie, randomState, siteOrigin } from "../_lib/session.js";

// Starts Discord OAuth. Scopes: identify (name/avatar) and guilds.members.read
// (lets us check the user's roles in the team server).
export default function handler(req, res) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId || !process.env.SESSION_SECRET) {
    return res.redirect(302, "/members.html?error=not_configured");
  }
  const state = randomState();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${siteOrigin(req)}/api/auth/callback`,
    scope: "identify guilds.members.read",
    state,
    prompt: "none",
  });
  res.setHeader("Set-Cookie", cookie(STATE_COOKIE, state, { maxAge: 600, req }));
  res.redirect(302, `https://discord.com/oauth2/authorize?${params}`);
}

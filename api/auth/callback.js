import { SESSION_COOKIE, STATE_COOKIE, cookie, createToken, parseCookies, siteOrigin } from "../_lib/session.js";

const DISCORD = "https://discord.com/api/v10";

function fail(res, req, code) {
  res.setHeader("Set-Cookie", [cookie(STATE_COOKIE, "", { maxAge: 0, req })]);
  return res.redirect(302, `/members.html?error=${code}`);
}

export default async function handler(req, res) {
  const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_GUILD_ID, DISCORD_MEMBER_ROLE_ID } = process.env;
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_GUILD_ID || !process.env.SESSION_SECRET) {
    return fail(res, req, "not_configured");
  }

  const { code, state, error } = req.query;
  const expected = parseCookies(req.headers.cookie)[STATE_COOKIE];
  if (error) return fail(res, req, "denied");
  if (!code || !state || !expected || state !== expected) return fail(res, req, "state");

  try {
    const tokenRes = await fetch(`${DISCORD}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: `${siteOrigin(req)}/api/auth/callback`,
      }),
    });
    if (!tokenRes.ok) return fail(res, req, "token");
    const { access_token } = await tokenRes.json();
    const auth = { Authorization: `Bearer ${access_token}` };

    const memberRes = await fetch(`${DISCORD}/users/@me/guilds/${DISCORD_GUILD_ID}/member`, { headers: auth });
    if (memberRes.status === 404 || memberRes.status === 403) return fail(res, req, "not_member");
    if (!memberRes.ok) return fail(res, req, "member_check");
    const member = await memberRes.json();

    if (DISCORD_MEMBER_ROLE_ID && !(member.roles || []).includes(DISCORD_MEMBER_ROLE_ID)) {
      return fail(res, req, "no_role");
    }

    const user = member.user || {};
    const session = createToken({
      id: user.id,
      name: member.nick || user.global_name || user.username || "Member",
    });
    res.setHeader("Set-Cookie", [
      cookie(SESSION_COOKIE, session, { maxAge: 60 * 60 * 24 * 7, req }),
      cookie(STATE_COOKIE, "", { maxAge: 0, req }),
    ]);
    return res.redirect(302, "/members.html");
  } catch (err) {
    console.error("Discord auth failed:", err.message);
    return fail(res, req, "server");
  }
}

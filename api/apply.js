// Receives tryout applications and forwards them to a Discord channel via
// webhook. The webhook URL lives in the DISCORD_WEBHOOK_URL env var so it is
// never exposed to the browser.

const MIN_AGE = 16;
const MAX_AGE = 99;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map();

const PLATFORMS = ["PC", "PlayStation", "Xbox"];
const ROLES = ["Entry", "Support", "Anchor", "Flex", "In-game leader", "Open to any role"];
const RANKS = ["Unranked", "Copper", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Champion"];

function clean(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/@/g, "@​")
    .trim()
    .slice(0, max);
}

const oneOf = (value, allowed) => (allowed.includes(value) ? value : "");

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function safeUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 200) : "";
  } catch {
    return "";
  }
}

const ALLOWED_ORIGINS = new Set([
  "https://jnlesports.org",
  "https://www.jnlesports.org",
  "https://jl-esports.vercel.app",
]);

// The static site can be hosted on another domain (cPanel) and post here.
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    return res.status(500).json({ ok: false, error: "Applications are not configured yet." });
  }

  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Too many submissions. Try again in a minute." });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};

  // Honeypot: real users never fill this hidden field.
  if (body.website) return res.status(200).json({ ok: true });

  const handle = clean(body.handle, 40);
  const discord = clean(body.discord, 40);
  const timezone = clean(body.timezone, 40);
  const game = clean(body.game, 40);
  const platform = oneOf(body.platform, PLATFORMS);
  const role = oneOf(body.role, ROLES);
  const rank = oneOf(body.rank, RANKS);
  const experience = clean(body.experience, 600);
  const availability = clean(body.availability, 300);
  const motivation = clean(body.motivation, 600);
  const tracker = safeUrl(body.tracker);
  const age = Number(body.age);

  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    return res.status(400).json({ ok: false, error: "Applicants must be 16 years of age or older." });
  }
  if (!body.confirm) {
    return res.status(400).json({ ok: false, error: "Please confirm your age and the accuracy of your information." });
  }
  const required = { handle, discord, timezone, platform, role, rank, experience, availability, motivation };
  const missing = Object.keys(required).filter((k) => !required[k]);
  if (missing.length) {
    return res.status(400).json({ ok: false, error: "Please complete all required fields." });
  }

  const origin = `https://${req.headers.host || "jl-esports.vercel.app"}`;
  const logo = `${origin}/img/logo-dark.png`;
  const inline = (name, value) => ({ name, value: value || "Not specified", inline: true });

  const payload = {
    username: "JNL Applications",
    avatar_url: logo,
    allowed_mentions: { parse: [] },
    embeds: [
      {
        author: { name: "JNL Esports  |  Tryout Application", icon_url: logo },
        title: handle,
        description: `A new player has applied for the **${game || "roster"}** roster.`,
        color: 0x2b7cf0,
        thumbnail: { url: logo },
        fields: [
          inline("Discord", `\`${discord.replace(/`/g, "'")}\``),
          inline("Age", String(age)),
          inline("Time zone", timezone),
          inline("Platform", platform),
          inline("Preferred role", role),
          inline("Current rank", rank),
          ...(tracker ? [{ name: "Profile", value: tracker }] : []),
          { name: "Competitive experience", value: experience },
          { name: "Weekly availability", value: availability },
          { name: "Why JNL Esports", value: motivation },
        ],
        footer: { text: "JNL Esports  |  Applications", icon_url: logo },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Discord responded ${response.status}`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Discord webhook failed:", error.message);
    return res.status(502).json({ ok: false, error: "Could not deliver your application. Please try again." });
  }
}

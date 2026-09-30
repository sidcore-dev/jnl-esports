import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "jl_session";
export const STATE_COOKIE = "jl_oauth_state";
const SESSION_TTL_S = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return s;
}

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const sign = (payload) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createToken(data, ttlSeconds = SESSION_TTL_S) {
  const payload = b64(JSON.stringify({ ...data, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch {
    return null;
  }
}

export function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((p) => p.trim()).filter(Boolean).map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))];
    })
  );
}

export function cookie(name, value, { maxAge, req } = {}) {
  const secure = req && (req.headers["x-forwarded-proto"] || "").includes("https");
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    maxAge !== undefined ? `Max-Age=${maxAge}` : "",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

export function getSession(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  return verifyToken(token);
}

export function randomState() {
  return randomBytes(16).toString("base64url");
}

export function siteOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
  return `${proto}://${req.headers.host}`;
}

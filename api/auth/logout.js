import { SESSION_COOKIE, cookie } from "../_lib/session.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }
  res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, "", { maxAge: 0, req }));
  return res.status(200).json({ ok: true });
}

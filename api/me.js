import { getSession } from "./_lib/session.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  let session = null;
  try {
    session = getSession(req);
  } catch {
    return res.status(500).json({ loggedIn: false, error: "not_configured" });
  }
  if (!session) return res.status(200).json({ loggedIn: false });
  return res.status(200).json({ loggedIn: true, name: session.name });
}

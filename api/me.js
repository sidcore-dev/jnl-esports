import { getSession } from "./_lib/session.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const session = getSession(req);
  if (!session) return res.status(200).json({ loggedIn: false });
  return res.status(200).json({ loggedIn: true, name: session.name });
}

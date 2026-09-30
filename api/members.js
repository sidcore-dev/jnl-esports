import { getSession } from "./_lib/session.js";
import { memberContent } from "./_private/content.js";

// Private team content. Only served with a valid Discord-verified session.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  let session = null;
  try {
    session = getSession(req);
  } catch {
    return res.status(500).json({ error: "not_configured" });
  }
  if (!session) return res.status(401).json({ error: "unauthorized" });
  return res.status(200).json({ name: session.name, ...memberContent });
}

// Generates the static pages in the project root from src/layout.html and
// src/pages/*.html. Run with: node build.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const layout = fs.readFileSync(path.join(root, "src/layout.html"), "utf8");

const PAGES = [
  { key: "home", file: "index.html", src: "home.html", nav: "Home", href: "/", title: "JNL Esports", description: "JNL Esports is a competitive esports organization fielding a Rainbow Six Siege roster." },
  { key: "roster", file: "roster.html", src: "roster.html", nav: "Roster", title: "Roster | JNL Esports", description: "Meet the JNL Esports Rainbow Six Siege roster." },
  { key: "matches", file: "matches.html", src: "matches.html", nav: "Matches", title: "Matches | JNL Esports", description: "JNL Esports match schedule and results." },
  { key: "news", file: "news.html", src: "news.html", nav: "News", title: "News | JNL Esports", description: "Announcements from JNL Esports." },
  { key: "about", file: "about.html", src: "about.html", nav: "About", title: "About | JNL Esports", description: "About JNL Esports, its leadership and community links." },
  { key: "apply", file: "apply.html", src: "apply.html", nav: null, cta: "Apply", title: "Apply | JNL Esports", description: "Apply for tryouts with JNL Esports. Players aged 16 and older." },
  { key: "members", file: "members.html", src: "members.html", nav: "Members", soon: true, title: "Members | JNL Esports", description: "Private team area for JNL Esports members.", robots: true, extra: '  <script src="js/members.js" defer></script>' },
];

const navLinks = (active) =>
  PAGES.filter((p) => p.nav)
    .map((p) => {
      const cur = p.key === active ? ' aria-current="page"' : "";
      const soon = p.soon ? ' <span class="soon">Soon</span>' : "";
      return `        <a href="${p.href || p.file}"${cur}>${p.nav}${soon}</a>`;
    })
    .join("\n") + `\n        <a href="apply.html" class="btn btn-sm">Apply</a>`;

for (const page of PAGES) {
  const content = fs.readFileSync(path.join(root, "src/pages", page.src), "utf8");
  const html = layout
    .replaceAll("{{title}}", page.title)
    .replaceAll("{{description}}", page.description)
    .replaceAll("{{key}}", page.key)
    .replace("{{robots}}", page.robots ? '<meta name="robots" content="noindex">' : "")
    .replace("{{nav}}", navLinks(page.key))
    .replace("{{content}}", content)
    .replace("{{extra}}", page.extra || "");
  fs.writeFileSync(path.join(root, page.file), html);
  console.log("wrote", page.file);
}

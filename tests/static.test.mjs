// Static checks over the generated pages: links, assets, ids, a11y basics.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const pages = ["index", "roster", "matches", "news", "about", "apply", "members"].map((n) => `${n}.html`);
const html = Object.fromEntries(pages.map((p) => [p, fs.readFileSync(path.join(root, p), "utf8")]));

const attrs = (src, re) => [...src.matchAll(re)].map((m) => m[1]);

test("every page exists and has one h1, title and description", () => {
  for (const p of pages) {
    const h = html[p];
    assert.equal(attrs(h, /<h1[\s>]/g).length, 1, `${p}: exactly one h1`);
    assert.match(h, /<title>[^<]{3,}<\/title>/, `${p}: title`);
    assert.match(h, /<meta name="description" content="[^"]{10,}"/, `${p}: description`);
    assert.match(h, /<html lang="en">/, `${p}: lang`);
    assert.match(h, /name="viewport"/, `${p}: viewport`);
  }
});

test("internal links and assets resolve", () => {
  for (const p of pages) {
    const refs = [...attrs(html[p], /(?:href|src)="([^"#][^"]*)"/g), ...attrs(html[p], /(?:href|src)="(#[^"]+)"/g)];
    for (const ref of refs) {
      if (/^(https?:|mailto:|data:)/.test(ref) || ref === "/") continue;
      if (ref.startsWith("#")) {
        assert.match(html[p], new RegExp(`id="${ref.slice(1)}"`), `${p}: anchor ${ref}`);
        continue;
      }
      const file = ref.split(/[?#]/)[0];
      assert.ok(fs.existsSync(path.join(root, file)), `${p}: missing ${file}`);
    }
  }
});

test("ids are unique per page", () => {
  for (const p of pages) {
    const ids = attrs(html[p], /\sid="([^"]+)"/g);
    assert.equal(new Set(ids).size, ids.length, `${p}: duplicate id in ${ids}`);
  }
});

test("images have alt text and dimensions", () => {
  for (const p of pages) {
    for (const tag of html[p].match(/<img[^>]*>/g) || []) {
      assert.match(tag, /\salt="/, `${p}: img without alt ${tag}`);
      assert.match(tag, /\swidth="/, `${p}: img without width ${tag}`);
    }
  }
});

test("form controls have labels", () => {
  const form = html["apply.html"];
  const controls = form.match(/<(input|select|textarea)[^>]*name="[^"]+"[^>]*>/g) || [];
  assert.ok(controls.length >= 12);
  for (const c of controls) {
    if (/class="hp"|type="hidden"/.test(c)) continue;
    const name = c.match(/name="([^"]+)"/)[1];
    const pos = form.indexOf(c);
    const before = form.slice(Math.max(0, pos - 400), pos);
    assert.ok(/<label[^>]*>[^<]*$|<label[\s\S]*$/.test(before), `${name}: not inside a label`);
  }
});

test("each nav has Home first and marks a current page", () => {
  for (const p of pages.filter((x) => x !== "index.html" && x !== "apply.html")) {
    assert.match(html[p], /<nav class="nav-links"[^>]*>\s*<a href="\/">Home<\/a>/, `${p}: Home first`);
    assert.match(html[p], /aria-current="page"/, `${p}: aria-current`);
  }
});

test("no leftover J&L or Twitch text and no secrets", () => {
  const files = [...pages, "js/data.js", "js/main.js", "js/members.js", "api/apply.js"];
  for (const f of files) {
    const t = fs.readFileSync(path.join(root, f), "utf8");
    assert.doesNotMatch(t, /J&amp;L|J&L/, `${f}: old name`);
    assert.doesNotMatch(t, /twitch/i, `${f}: twitch`);
    assert.doesNotMatch(t, /discord\.com\/api\/webhooks\/\d+/, `${f}: webhook URL`);
    assert.doesNotMatch(t, /client_secret\s*[:=]\s*["'][^"']{8,}/i, `${f}: secret`);
  }
});

test("scripts are deferred and css is a single file", () => {
  for (const p of pages) {
    for (const tag of html[p].match(/<script[^>]*src=[^>]*>/g) || []) assert.match(tag, /defer/, `${p}: ${tag}`);
    assert.equal((html[p].match(/rel="stylesheet" href="css\//g) || []).length, 1);
  }
});

test("social and resource links are absolute https URLs or empty", () => {
  const data = fs.readFileSync(path.join(root, "js/data.js"), "utf8");
  for (const [, href] of data.matchAll(/href:\s*"([^"]*)"/g)) {
    assert.ok(href === "" || /^https:\/\/[^\s]+$/.test(href), `bad href: ${href}`);
  }
});

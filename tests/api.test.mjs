// API tests with a mocked Discord webhook. Nothing here contacts Discord.
import test from "node:test";
import assert from "node:assert/strict";

process.env.SESSION_SECRET = "x".repeat(48);
const { default: apply } = await import("../api/apply.js");
const { createToken, verifyToken, getSession } = await import("../api/_lib/session.js");
const { default: me } = await import("../api/me.js");
const { default: members } = await import("../api/members.js");

function call(handler, { method = "POST", body = {}, headers = {} } = {}) {
  return new Promise((resolve) => {
    const res = {
      code: 200, headers: {}, payload: undefined,
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; },
      json(p) { this.payload = p; resolve(this); return this; },
      redirect(c, u) { this.code = c; this.headers.Location = u; resolve(this); },
      end() { resolve(this); return this; },
    };
    handler({ method, body, headers: { host: "x.test", ...headers }, query: {} }, res);
  });
}

const valid = () => ({
  handle: "Tester", discord: "tester", age: 18, timezone: "EST", game: "Rainbow Six Siege",
  platform: "PC", role: "Entry", rank: "Gold", experience: "e", availability: "a", motivation: "m", confirm: true,
});
let n = 0;
const ip = () => ({ "x-forwarded-for": `10.0.0.${++n}` });

test("apply rejects non-POST", async () => {
  assert.equal((await call(apply, { method: "GET", headers: ip() })).code, 405);
});

test("apply returns 500 without a webhook configured", async () => {
  delete process.env.DISCORD_WEBHOOK_URL;
  assert.equal((await call(apply, { body: valid(), headers: ip() })).code, 500);
});

test("apply validates age, confirmation and required fields", async () => {
  process.env.DISCORD_WEBHOOK_URL = "https://discord.test/hook";
  globalThis.fetch = async () => { throw new Error("must not be called"); };
  for (const age of [15, 0, -1, "abc", 16.5, 100, null]) {
    assert.equal((await call(apply, { body: { ...valid(), age }, headers: ip() })).code, 400, `age ${age}`);
  }
  assert.equal((await call(apply, { body: { ...valid(), confirm: false }, headers: ip() })).code, 400);
  for (const k of ["handle", "discord", "timezone", "platform", "role", "rank", "experience", "availability", "motivation"]) {
    assert.equal((await call(apply, { body: { ...valid(), [k]: "" }, headers: ip() })).code, 400, k);
  }
  assert.equal((await call(apply, { body: { ...valid(), platform: "Switch" }, headers: ip() })).code, 400);
});

test("apply silently drops honeypot submissions", async () => {
  globalThis.fetch = async () => { throw new Error("must not be called"); };
  const r = await call(apply, { body: { ...valid(), website: "spam" }, headers: ip() });
  assert.equal(r.code, 200);
});

test("apply sanitizes mentions and truncates, posts one embed", async () => {
  let sent;
  globalThis.fetch = async (_url, opts) => { sent = JSON.parse(opts.body); return { ok: true }; };
  const body = { ...valid(), handle: "@everyone" + "A".repeat(100), experience: "B".repeat(5000), tracker: "javascript:alert(1)" };
  const r = await call(apply, { body, headers: ip() });
  assert.equal(r.code, 200);
  const e = sent.embeds[0];
  assert.deepEqual(sent.allowed_mentions, { parse: [] });
  assert.ok(!e.title.includes("@everyone"), "mention neutralized");
  assert.ok(e.title.length <= 41);
  assert.ok(e.fields.find((f) => f.name.includes("experience")).value.length <= 600);
  assert.ok(!e.fields.some((f) => f.name === "Profile"), "javascript: link dropped");
});

test("apply reports Discord failures as 502", async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500 });
  assert.equal((await call(apply, { body: valid(), headers: ip() })).code, 502);
});

test("apply rate limits repeated requests from one IP", async () => {
  globalThis.fetch = async () => ({ ok: true });
  const h = { "x-forwarded-for": "10.9.9.9" };
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await call(apply, { body: valid(), headers: h })).code);
  assert.deepEqual(codes, [200, 200, 200, 429, 429]);
});

test("session tokens verify, expire and reject tampering", () => {
  const t = createToken({ id: "1", name: "a" });
  assert.equal(verifyToken(t).name, "a");
  assert.equal(verifyToken(t.slice(0, -2) + "aa"), null);
  assert.equal(verifyToken(createToken({ id: "1" }, -5)), null);
  assert.equal(verifyToken("garbage"), null);
  assert.equal(verifyToken(""), null);
});

test("forged or unconfigured sessions yield 401, never 500", async () => {
  const forged = { cookie: "jl_session=eyJ4Ijoi.forged" };
  assert.equal((await call(members, { method: "GET", headers: forged })).code, 401);
  assert.equal((await call(members, { method: "GET" })).code, 401);
  assert.equal((await call(me, { method: "GET", headers: forged })).payload.loggedIn, false);
  const good = createToken({ id: "1", name: "Ann" });
  const ok = await call(members, { method: "GET", headers: { cookie: `jl_session=${good}` } });
  assert.equal(ok.code, 200);
  assert.equal(ok.payload.name, "Ann");
  delete process.env.SESSION_SECRET;
  assert.equal(getSession({ headers: { cookie: `jl_session=${good}` } }), null);
});

test("apply answers CORS preflight only for allowed origins", async () => {
  const ok = await call(apply, { method: "OPTIONS", headers: { origin: "https://jnlesports.org" } });
  assert.equal(ok.code, 204);
  assert.equal(ok.headers["Access-Control-Allow-Origin"], "https://jnlesports.org");
  const bad = await call(apply, { method: "OPTIONS", headers: { origin: "https://evil.example" } });
  assert.equal(bad.code, 204);
  assert.equal(bad.headers["Access-Control-Allow-Origin"], undefined);
});

// End-to-end tests against a local `wrangler dev` with a fresh, throwaway D1.
// Run: npm test   (no Cloudflare account needed)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = 8799;
const BASE = `http://127.0.0.1:${PORT}/api/likes`;
const SITE = "https://mvp-harry.github.io";
const state = mkdtempSync(join(tmpdir(), "blog-likes-test-"));
let dev;

before(async () => {
  execFileSync("npx", ["wrangler", "d1", "migrations", "apply", "blog-likes", "--local", "--persist-to", state], {
    stdio: "ignore",
  });
  dev = spawn(
    "npx",
    ["wrangler", "dev", "--port", String(PORT), "--persist-to", state, "--var", "IP_SALT:test-salt", "--var", "DAILY_LIMIT:3"],
    { stdio: "ignore", detached: true }
  );
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${BASE}?path=/posts/x/`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("wrangler dev did not start");
});

after(() => {
  try {
    process.kill(-dev.pid);
  } catch {}
  rmSync(state, { recursive: true, force: true });
});

const like = (path, origin = SITE) =>
  fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify({ path }),
  });

test("unknown post reads as 0", async () => {
  const res = await fetch(`${BASE}?path=/posts/never-liked/`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { "/posts/never-liked/": 0 });
});

test("like increments and reads back, several paths at once", async () => {
  assert.deepEqual(await (await like("/posts/a/")).json(), { path: "/posts/a/", count: 1 });
  assert.deepEqual(await (await like("/posts/a/")).json(), { path: "/posts/a/", count: 2 });
  await like("/posts/b/");
  const res = await fetch(`${BASE}?path=/posts/a/&path=/posts/b/&path=/posts/c/`);
  assert.deepEqual(await res.json(), { "/posts/a/": 2, "/posts/b/": 1, "/posts/c/": 0 });
});

test("rate limit: 4th like on one post from one IP in a day is refused (limit 3 in tests)", async () => {
  for (let i = 1; i <= 3; i++) assert.equal((await like("/posts/limited/")).status, 200);
  assert.equal((await like("/posts/limited/")).status, 429);
  const res = await fetch(`${BASE}?path=/posts/limited/`);
  assert.deepEqual(await res.json(), { "/posts/limited/": 3 });
  // Other posts are not affected
  assert.equal((await like("/posts/other/")).status, 200);
});

test("bad paths are rejected", async () => {
  for (const p of ["/about/", "/posts/../x/", "/posts/UPPER/", "posts/a/", "/posts/a"]) {
    assert.equal((await like(p)).status, 400, p);
  }
  assert.equal((await fetch(`${BASE}?path=/etc/passwd`)).status, 400);
  assert.equal((await fetch(BASE)).status, 400);
  const many = Array.from({ length: 51 }, (_, i) => `path=/posts/p${i}/`).join("&");
  assert.equal((await fetch(`${BASE}?${many}`)).status, 400);
});

test("POST from another site or with no Origin is refused", async () => {
  assert.equal((await like("/posts/a/", "https://evil.example")).status, 403);
  assert.equal((await like("/posts/a/", null)).status, 403);
  const res = await fetch(`${BASE}?path=/posts/a/`);
  assert.equal((await res.json())["/posts/a/"], 2);
});

test("CORS: allowed origin gets headers, others don't; nothing is cacheable", async () => {
  const ok = await fetch(BASE, { method: "OPTIONS", headers: { Origin: SITE } });
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("access-control-allow-origin"), SITE);
  const local = await fetch(`${BASE}?path=/posts/a/`, { headers: { Origin: "http://127.0.0.1:4000" } });
  assert.equal(local.headers.get("access-control-allow-origin"), "http://127.0.0.1:4000");
  const bad = await fetch(`${BASE}?path=/posts/a/`, { headers: { Origin: "https://evil.example" } });
  assert.equal(bad.headers.get("access-control-allow-origin"), null);
  assert.equal(bad.headers.get("cache-control"), "no-store");
});

test("bad body and unknown routes", async () => {
  const res = await fetch(BASE, { method: "POST", headers: { Origin: SITE }, body: "not json" });
  assert.equal(res.status, 400);
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/`)).status, 404);
  assert.equal((await fetch(BASE, { method: "DELETE", headers: { Origin: SITE } })).status, 405);
});

// Thumbs-up counter for mvp-harry.github.io.
//
//   GET  /api/likes?path=/posts/a/&path=/posts/b/  -> {"/posts/a/": 3, "/posts/b/": 0}
//   POST /api/likes  {"path": "/posts/a/"}         -> {"path": "/posts/a/", "count": 4}
//
// Counts live in D1 (binding DB). Each IP can add at most DAILY_LIMIT likes per post per day;
// IPs are only stored as SHA-256(IP_SALT | ip).

const PATH_RE = /^\/posts\/[a-z0-9-]{1,150}\/$/;
const MAX_PATHS = 50;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowed = allowedOrigin(origin, env);

    if (url.pathname !== "/api/likes") return json({ error: "not found" }, 404, allowed);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(allowed) });

    try {
      if (request.method === "GET") return await getLikes(url, env, allowed);
      if (request.method === "POST") return await addLike(request, env, ctx, allowed);
      return json({ error: "method not allowed" }, 405, allowed);
    } catch (err) {
      console.error(err);
      return json({ error: "server error" }, 500, allowed);
    }
  },
};

async function getLikes(url, env, allowed) {
  const paths = [...new Set(url.searchParams.getAll("path"))];
  if (paths.length === 0 || paths.length > MAX_PATHS || !paths.every((p) => PATH_RE.test(p))) {
    return json({ error: "bad path" }, 400, allowed);
  }
  const marks = paths.map(() => "?").join(",");
  const { results } = await env.DB.prepare(`SELECT path, count FROM likes WHERE path IN (${marks})`)
    .bind(...paths)
    .all();
  const counts = Object.fromEntries(paths.map((p) => [p, 0]));
  for (const row of results) counts[row.path] = row.count;
  return json(counts, 200, allowed);
}

async function addLike(request, env, ctx, allowed) {
  // Only our own site may add likes.
  if (!allowed) return json({ error: "forbidden" }, 403, null);
  if (!env.IP_SALT) throw new Error("IP_SALT secret is not set");

  let path;
  try {
    path = (await request.json()).path;
  } catch {
    return json({ error: "bad body" }, 400, allowed);
  }
  if (typeof path !== "string" || !PATH_RE.test(path)) return json({ error: "bad path" }, 400, allowed);

  const day = new Date().toISOString().slice(0, 10);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ipHash = await sha256(`${env.IP_SALT}|${ip}`);
  const limit = Number(env.DAILY_LIMIT) || 10;

  const vote = await env.DB.prepare(
    `INSERT INTO votes (ip_hash, path, day, n) VALUES (?, ?, ?, 1)
     ON CONFLICT (ip_hash, path, day) DO UPDATE SET n = n + 1
     RETURNING n`
  )
    .bind(ipHash, path, day)
    .first();
  if (vote.n > limit) return json({ error: "too many likes today" }, 429, allowed);

  const row = await env.DB.prepare(
    `INSERT INTO likes (path, count) VALUES (?, 1)
     ON CONFLICT (path) DO UPDATE SET count = count + 1
     RETURNING count`
  )
    .bind(path)
    .first();

  // Old rate-limit rows are useless after their day ends; drop them in the background.
  ctx.waitUntil(env.DB.prepare("DELETE FROM votes WHERE day < ?").bind(day).run());

  return json({ path, count: row.count }, 200, allowed);
}

function allowedOrigin(origin, env) {
  if (!origin) return null;
  const list = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
  return list.includes(origin) ? origin : null;
}

function cors(allowed) {
  const h = { "Cache-Control": "no-store", Vary: "Origin" };
  if (allowed) {
    h["Access-Control-Allow-Origin"] = allowed;
    h["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}

function json(body, status, allowed) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(allowed) },
  });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

# Plan: like-button

Step 2 of 3. Bring back the thumbs-up, backed by our own Cloudflare Worker (ADR
`2026-11-05-like-counter-worker.md`).

## Goal

- Each post gets a thumbs-up button with a count. Home-page cards show the count, like the old clap counts.
- No reader login. Free tier. Theme files are not copied.
- Merging is safe before the Worker exists: if no endpoint is set, nothing renders.

## Approach

### Worker (`worker/`, excluded from the Jekyll build)

- Plain JS module Worker plus `wrangler.jsonc`. No build step.
- Storage: **Cloudflare D1** (SQLite). Increments are atomic (`count = count + 1`), so two likes at
  once can't overwrite each other, which KV can't promise. Free tier: 100k writes/day.
  - `likes(path PRIMARY KEY, count)`
  - `votes(ip_hash, path, day, n)` for rate limiting. The IP is hashed with a secret salt, never
    stored raw. Rows older than today get deleted.
- API:
  - `GET /api/likes?path=/posts/a/&path=/posts/b/` returns `{"/posts/a/": 3, ...}` (max 50 paths).
  - `POST /api/likes` with body `{"path": "/posts/a/"}` returns `{"count": 4}`. It returns 429 after
    10 likes from one IP on one post in one day. That's lenient enough for shared campus Wi-Fi, but it
    stops scripted spam.
- Checks:
  - Path must match `^/posts/[a-z0-9-]+/$`.
  - CORS only allows `https://mvp-harry.github.io` plus `localhost:4000` / `127.0.0.1:4000` for local
    preview. POSTs from other origins get 403.
- Dev dependency: `wrangler` 4.158.0, pinned in `worker/package.json`. **New dependency, needs your OK.**

### Blog side (no theme files copied)

- `_config.yml`:
  - `likes.endpoint:` holds the Worker URL. If it's empty, the feature is off.
  - Add `/api/likes` to `pwa.cache.deny_paths`, so the offline cache never stores counts.
- `assets/js/likes.js`, loaded with `defer` from `_includes/metadata-hook.html`:
  - On a post page: insert the button at the top, under the post meta (date / author / read time),
    centered, the same place as the old applause button. It looks the same too: an 80px circle with a
    teal outline (`rgb(79,177,186)`), the clapping-hands icon from the old button (MIT-licensed SVG),
    and the count.
  - On the home page: add a count next to the date on each card. Cards with 0 likes show nothing.
  - Clicking: the count goes up right away, then the POST confirms it. `localStorage` remembers which
    posts this browser liked, and shows the button filled in. One like per browser per post, no unlike.
  - Failure: if the Worker is down, the button hides itself. No errors shown to readers.
- `assets/css/jekyll-theme-chirpy.scss`: a few lines of button styling, using theme colors so a future
  dark mode works.

### Testing (all local, no Cloudflare account needed)

- `wrangler dev` runs the Worker plus a local D1 on this machine.
- `worker/test.mjs` (Node's built-in test runner, no extra deps) covers:
  - like, read back, and read several posts at once
  - bad path rejected
  - wrong origin rejected
  - rate limit kicks in at 11
  - CORS headers present
- End to end: `jekyll serve` pointed at the local Worker. Click the button, check the count updates and
  survives a reload, check the home card shows it, check the button hides when the Worker is stopped.
  Screenshots at desktop and phone width.
- The site build and htmlproofer still pass. Existing CI is unchanged.

## What you need to do (about 10 minutes, after I've finished and tested locally)

1. Create a free Cloudflare account at https://dash.cloudflare.com/sign-up. No card needed.
2. In the dashboard, open **Workers & Pages** once and pick a `workers.dev` subdomain. Your Worker URL
   will be `https://blog-likes.<subdomain>.workers.dev`.
3. In this session, run `! cd worker && npx wrangler login`. It opens a browser to authorize.
4. Then I'll run the rest. Or you can run it yourself, and I'll give you the exact commands:
   - `wrangler d1 create blog-likes` (I paste the returned id into `wrangler.jsonc`)
   - `wrangler d1 migrations apply blog-likes --remote`
   - `wrangler secret put IP_SALT` (a random value)
   - `wrangler deploy`
5. I put the Worker URL into `_config.yml` and test from local preview against the real Worker. Then you
   merge the PR and check a post on the live site.

## Checklist

- [x] `worker/`: `wrangler.jsonc`, `package.json`, D1 migration, `src/index.js`
- [x] `worker/test.mjs` passing against `wrangler dev`
- [x] `assets/js/likes.js` + metadata hook + CSS + `_config.yml` (`likes.endpoint`, `deny_paths`, exclude `worker`)
- [x] Local end-to-end check + screenshots; site build + htmlproofer pass
- [x] `worker/README.md` with first-time setup, deploy/redeploy, and local test commands (manual deploy, no CI)
- [ ] You: Cloudflare account + `wrangler login`
- [ ] Create D1, apply migration, set salt, deploy; set `likes.endpoint`
- [ ] Test local preview against the real Worker
- [ ] Update ADR (D1 detail), `CLAUDE.md` (worker commands), delete plan, open PR

## Open questions

None. Approved 2026-11-05: home cards show counts (not the categories page), `wrangler` dev dependency OK.

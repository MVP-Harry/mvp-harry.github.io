# blog-likes Worker

Backend for the thumbs-up button on https://mvp-harry.github.io. It's a Cloudflare Worker with a D1
(SQLite) database, on the free tier. The blog side is `assets/js/likes.js`, switched on by `likes.endpoint`
in `_config.yml`. The decision is recorded in `docs/decisions/2026-11-05-like-counter-worker.md`.

**Deploys are manual. CI does not deploy this.** Run the commands below from this `worker/` folder.

## Everyday commands

```sh
cd worker
npm install                 # first time on a machine (installs the pinned wrangler)
npm test                    # local tests: starts wrangler dev with a throwaway database, no account needed
npx wrangler login          # once per machine (opens a browser)
npx wrangler deploy         # deploy after changing src/ or wrangler.jsonc
npx wrangler tail           # watch live logs/errors
```

After `npx wrangler deploy`, check it's alive:

```sh
curl "https://<worker-url>/api/likes?path=/posts/2023-wrap/"
```

## First-time setup (already done once; repeat only for a new Cloudflare account)

1. Create a Cloudflare account, open **Workers & Pages** once, and pick a `workers.dev` subdomain.
2. `npx wrangler login`
3. `npx wrangler d1 create blog-likes`, then paste the printed `database_id` into `wrangler.jsonc`.
4. `npx wrangler d1 migrations apply blog-likes --remote` (creates the tables)
5. `openssl rand -hex 32 | npx wrangler secret put IP_SALT` (the secret used to hash IPs; never commit it)
6. `npx wrangler deploy`. It prints the URL (`https://blog-likes.<subdomain>.workers.dev`).
7. Put that URL in `_config.yml` under `likes.endpoint`, then commit and push.

## Changing the database

Add a new numbered file in `migrations/` (e.g. `0002_*.sql`). Never edit an applied one. Then run:

```sh
npx wrangler d1 migrations apply blog-likes --local    # try it locally
npx wrangler d1 migrations apply blog-likes --remote   # apply to production
```

## Handy queries

```sh
npx wrangler d1 execute blog-likes --remote --command "SELECT * FROM likes ORDER BY count DESC"
npx wrangler d1 execute blog-likes --remote --command "UPDATE likes SET count = 0 WHERE path = '/posts/x/'"
```

## Settings

- `ALLOWED_ORIGINS` in `wrangler.jsonc`: sites allowed to add likes (live site + local preview on port 4000).
- `DAILY_LIMIT` in `wrangler.jsonc`: max likes one IP can add to one post per day (10).
- `IP_SALT`: a secret, set with `wrangler secret put`.
- The blog's `pwa.cache.deny_paths` must keep `/api/likes`. Otherwise the offline cache freezes the counts.

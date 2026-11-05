# Harry's Blog

Personal Jekyll blog, deployed to https://mvp-harry.github.io by GitHub Actions.

## Commands

- `bundle install`: install gems (Ruby 3.4)
- `bundle exec jekyll serve`: local preview at http://127.0.0.1:4000 (add `--drafts` to include `_drafts/`)
- `JEKYLL_ENV=production bundle exec jekyll build`: production build into `_site/`
- `bundle exec htmlproofer _site --disable-external`: link and image check (CI runs this, and it must pass)
- Like-button Worker: `cd worker && npm test` (local), `npx wrangler deploy` (deploy). Deploys are
  **manual**, and CI never deploys it. All commands are in `worker/README.md`.

## Code map

- `_posts/`: published posts, permalinks are `/posts/:title/`. `_drafts/`: unpublished drafts.
- `_tabs/`: sidebar pages (about, archives, categories, tags).
- `_config.yml`: site settings. `_data/contact.yml`, `_data/share.yml`: sidebar icons and share buttons.
- `assets/img/`: images. `assets/img/favicons/`: custom favicons that override the theme's.
- `assets/css/jekyll-theme-chirpy.scss` + `_includes/metadata-hook.html`: font override (DM Sans).
- `.github/workflows/pages-deploy.yml`: builds and link-checks every PR, deploys only from `main`.
- `worker/`: Cloudflare Worker + D1 behind the like button. `assets/js/likes.js` is the blog side, loaded
  from `_includes/metadata-hook.html` only when `likes.endpoint` is set in `_config.yml`.

## Rules

- The theme is the `jekyll-theme-chirpy` gem (see `docs/decisions/`). Don't copy theme layouts, Sass or
  JS into the repo. Override the single file you need, or use the hooks above.
- Post images need `alt` text, and links need `https`. Otherwise CI's htmlproofer step fails.
- Keep `/api/likes` in `pwa.cache.deny_paths`, or the service worker caches like counts forever.
- `Gemfile.lock` is committed. Update gems with `bundle update`, not by deleting the lockfile.

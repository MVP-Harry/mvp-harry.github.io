# Plan: chirpy-7-upgrade

Step 1 of 3 (2 = thumbs-up Worker, 3 = preview images / remove Twitter / delete drafts). Steps 2 and 3
start only after this branch is merged and verified live.

## Goal

Move from the vendored Chirpy 6.0.1 copy to the `jekyll-theme-chirpy` 7.6 gem (see ADR
`2026-11-05-chirpy-as-gem.md`). This removes polyfill.io and cleans up CI. Nothing visible should break:
same URLs, same posts, same fonts, same favicons and avatar.

## Approach

1. **Baseline.** Build `main` into the scratchpad. Save the list of generated URLs plus `feed.xml` and
   `sitemap.xml`.
2. **Swap to the gem.** Delete the theme source that the gem now provides:
   - `_layouts`, `_includes`, `_sass`, `_javascript`
   - `_data/locales`, `_data/origin`
   - `assets/css`, `assets/js`, `assets/404.html`, `assets/feed.xml`, `assets/robots.txt`,
     `assets/_config.yml`
   - the `assets/lib` submodule and `.gitmodules`
   - `jekyll-theme-chirpy.gemspec`, `package.json`, `rollup.config.js`, `CHANGELOG.md`, `tools/`

   Keep: `_posts`, `_drafts`, `_tabs`, `_plugins` (same as starter), `_data/{contact,share,authors}.yml`,
   `assets/img`, `index.html`, `LICENSE`, `README.md`.
3. **Config.** Rebase `_config.yml` on the starter's 7.6 version and carry over the site values (title,
   tagline, url, avatar, social, theme_mode, giscus repo).
   - Renamed keys: `comments.active` → `comments.provider`, `google_analytics` → `analytics.google`,
     `google_site_verification` → `webmaster_verifications.google`, `img_cdn` → `cdn`, add `pwa.cache`.
   - Drop the `applause_button` default.
   - Add `docs` to `exclude`.
4. **Fonts.** Keep DM Sans:
   - `assets/css/jekyll-theme-chirpy.scss` passes `$font-family-base` and `$font-family-heading` into
     `abstracts/variables`.
   - `_includes/metadata-hook.html` loads DM Sans from Google Fonts.
5. **Gemfile.** Use the starter Gemfile (`jekyll-theme-chirpy ~> 7.6`, `html-proofer ~> 5.0`) plus
   `jemoji` (2 posts use emoji) and `jekyll-compose`. Commit `Gemfile.lock` (remove it from
   `.gitignore`). Use the starter `.gitignore` otherwise.
6. **CI.** Replace `.github/workflows/jekyll.yml` with the starter's `pages-deploy.yml`: Ruby 3.4,
   current Pages actions, and an `htmlproofer` internal-link check before deploy.
7. **Thumbs-up.** It goes away in this step: the service is dead and the gem layouts don't have it. It
   comes back in step 2.
8. **Verify** (below), then open a PR.

## Verification ("nothing breaks")

- `bundle exec jekyll build` runs with no errors and no Sass deprecation spam.
- The URL list matches the baseline: every post, tab, category and tag page, plus feed and sitemap.
  Any difference gets explained in the PR.
- `htmlproofer --disable-external` passes.
- `grep -r polyfill.io _site` finds nothing.
- Serve locally and screenshot in light and dark mode: home, a post with images, the math post
  (deep learning), the YouTube-embed post, categories, tags, archives, about, search, 404.
- After merge, you check the live site (including a hard refresh, because of the PWA cache).

## Checklist

- [x] Branch `chirpy-7-upgrade` created
- [x] ADRs recorded (`docs/decisions/`)
- [x] Baseline build + URL list
- [x] Remove vendored theme files and submodule
- [x] New `_config.yml`
- [x] Font override (SCSS + metadata hook)
- [x] Gemfile + committed `Gemfile.lock` + `.gitignore`
- [x] New CI workflow
- [x] Build, URL diff, htmlproofer, polyfill grep
- [x] Visual check (light/dark)
- [ ] Move anything durable out of this plan (root `CLAUDE.md`?), delete the plan, open PR

## Open questions

- Enable the "follow system dark mode" toggle now (`theme_mode:` empty), or keep it forced light until
  step 3? Default: keep light. That's a look change, and you didn't pick it.
- Add a root `CLAUDE.md` (commands, "don't vendor theme files") in this branch? Default: yes, a short one.

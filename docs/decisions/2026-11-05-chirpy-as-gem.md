# Use Chirpy as a gem, not a vendored copy

- Status: Accepted
- Date: 2026-11-05
- Supersedes: none
- Design doc: none

## Decision

Load the theme with `gem "jekyll-theme-chirpy", "~> 7.x"` in the Chirpy Starter layout. The repo holds
only content (`_posts`, `_tabs`, `assets/img`), config, and small overrides (an include, a few lines of
SCSS in `assets/css/jekyll-theme-chirpy.scss`). Don't copy theme layouts, Sass or JS into the repo. If a
change can't be made with an override, override that one file and nothing else.

## Why

In June 2023 the whole Chirpy 6.0.1 source (~190 files) was copied in to add one feature (the applause
button). Since then it never got upstream fixes. That left old CDN pins, a hijacked polyfill.io script,
Sass deprecation warnings, and a JS bundle that can no longer be rebuilt from source. The real
customizations were only fonts and the applause button.

## Alternatives considered

- Keep the vendored copy and patch it: keeps all the debt, and every upstream fix has to be ported by hand.
- Switch to a different theme or static site generator: too much migration for a personal blog.

## Consequences

Theme upgrades become a Gemfile version bump. Custom features have to fit Chirpy's hooks
(`metadata-hook.html`, custom SCSS, `_includes` overrides). The thumbs-up counter is built that way (see
[2026-11-05-like-counter-worker.md](2026-11-05-like-counter-worker.md)).

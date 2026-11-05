# Decisions

This index lists Accepted ADRs only.

| ADR | Decision | Affects |
| --- | --- | --- |
| [Use Chirpy as a gem, not a vendored copy](2026-11-05-chirpy-as-gem.md) | Load Chirpy 7.x as a gem; keep only content, config and small overrides in the repo. | `Gemfile`, `_config.yml`, `_includes/`, `assets/css/` |
| [Thumbs-up counter runs on our own Cloudflare Worker](2026-11-05-like-counter-worker.md) | Likes are counted by an owner-run Cloudflare Worker, no reader login; the button looks and sits like the old applause button (top of post); deploy the Worker by hand (`worker/README.md`). | `_includes/`, `worker/` |

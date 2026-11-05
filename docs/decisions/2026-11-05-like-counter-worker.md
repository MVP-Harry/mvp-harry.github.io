# Thumbs-up counter runs on our own Cloudflare Worker

- Status: Accepted
- Date: 2026-11-05
- Supersedes: none
- Design doc: none

## Decision

The post thumbs-up ("like") counter talks to a small Cloudflare Worker that the blog owner runs on the
free tier. Counts are stored in Cloudflare D1 (SQLite, so increments are atomic), keyed by post path. Readers don't need to log in. The blog
side is a theme override (an include plus a little JS and CSS), not a fork of theme layouts.

The button looks like the old applause button and sits where it did: at the top of the post, under the
post meta. It's round, with a teal outline, an icon and a count. This keeps the blog looking the way
readers already know.

Deploy the Worker by hand with `npx wrangler deploy` from `worker/`, not from CI. The commands live in
`worker/README.md`, and `CLAUDE.md` points to them.

## Why

The old applause-button.com service shut down (`api.applause-button.com` no longer resolves), so the
button broke and its counts were lost. Owning the backend means it can't disappear like that again, and
it keeps the button login-free for non-technical readers.

## Alternatives considered

- Giscus reactions: durable and free, but readers need a GitHub login to react.
- Another hosted like-button service: same risk of shutting down that killed applause-button.com.
- Drop the button: the owner wants to keep it.
- Button at the end of the post: rejected to keep the old look and position.
- Deploy the Worker from CI: the Worker rarely changes, so it isn't worth storing a Cloudflare API token
  in GitHub or maintaining another workflow.

## Consequences

The owner has to keep a Cloudflare account and the Worker deployed. Counts are not protected against
abuse beyond basic per-visitor limits. Old applause counts can't be recovered.

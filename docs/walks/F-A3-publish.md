# F-A3 · Publish pipeline — walk record (PARTIAL)

Walked 2026-08-24. **Incomplete by design:** the last leg is a real Vercel
deploy of a real site to the internet, which is SHIP-gate item 3 and is called
out below rather than performed.

## Legs walked

| # | leg | result |
|---|---|---|
| 1 | `PUBLISH_ALLOW_SIMULATION` absent in production | **PASS** — read out of the live server's `node-selector.json`, not assumed. A truthy value there makes publishes "succeed" without deploying anything, and this repo has already had a "simulation" publish go live once. |
| 2 | the publish flag actually ships | **PASS, and it was one machine away from not.** See below. |
| 3 | the flag pair is read correctly | **PASS** — `runtimeEnv.ts:44-49` writes the literal `process.env.NEXT_PUBLIC_*` expressions so Next's inliner can replace them, and its own comment documents the alias trap that would have defeated it. |

## The finding (leg 2)

The deployed bundle carries `NEXT_PUBLIC_FEATURE_PUBLISH:"true"` — Publish is
live. But the value did not come from `.env.production.local`, which held five
keys and not this one. It came from **`.env.local`**, a gitignored *dev* file
that Next also loads during a production build.

So the front door of the money path was baked from an untracked file on one
laptop. A build anywhere else — a fresh clone, CI, another machine, or just
after that dev file changed — ships Publish **OFF**, and the failure is silent:
no error, no warning, just a missing button. That is the exact shape of the
`GOOGLE_CLIENT_ID` incident this repo already documents, where social login was
dead in production for months because a var was never set.

`scripts/check-prod-env.mjs` cannot catch it. It pulls the live server
environment, and `NEXT_PUBLIC_*` are **inlined at build time** — a value in the
server env does nothing at all. CLAUDE.md says so outright: *"a flag that is
silently false in production looks exactly like a feature that was never
built."*

**Fixed two ways:**
1. `NEXT_PUBLIC_FEATURE_PUBLISH=true` added to `.env.production.local`, so the
   production build no longer depends on a dev file.
2. `pnpm run gate:baked-flags` — a new check that reads the BUILT bundle and
   asserts the flag is inlined as `"true"`. The distinction matters: Next keeps
   the object key and replaces the value, so `FLAG:"true"` means baked and
   `FLAG:x.env.FLAG` means the replacement never happened and the flag is
   `undefined` in the browser. The gate tells those two apart.

The gate caught something on its very first run — and it was the gate that was
wrong. It required `NEXT_PUBLIC_UNIFIED_EDITOR` in the client bundle; that flag
is read once, server-side, in `unified-flag.server.ts`, so it correctly never
reaches the browser. Narrowed to client-read flags, with the reason written
down, because a check that cries wolf gets unwired and then rots.

Negative-tested: it passes the real build and fails a bundle whose flag is a
runtime lookup.

## NOT walked, and why

- **A real publish end to end.** SHIP-gate item 3. It deploys a site to the
  public internet through the workspace's own Vercel OAuth connection. It needs
  the founder to pick which site, and to confirm — a published site is visible
  to anyone with the URL.
- The pre-publish honesty guards, the QUEUED→BUILDING→COMPLETED job states, the
  `VERCEL_NOT_CONNECTED` deep-link branch, the 2s poll, and the server-side
  injections (analytics beacon, favicon/og, canonical, robots, FREE-plan badge).
  All reachable only by starting a real job.

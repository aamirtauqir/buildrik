# T-001 — packages/editor/CLAUDE.md names the wrong place for production env values

- **Status:** draft
- **Owner:** factory-analyst
- **Date:** 2026-10-15
- **Figma / board:** none

## Problem

`packages/editor/CLAUDE.md:513-515` (§ENV VARIABLES) says:
"Production values must be set in the host platform (Vercel project settings → Environment Variables)."

Production is the cPanel Node.js app, not Vercel:
- Root `CLAUDE.md:328-332` (§Where the values live): "**Production:** the **cPanel Node.js app** environment, not Vercel", managed via `cloudlinux-selector` or the cPanel UI.
- Root `CLAUDE.md:332`: `NEXT_PUBLIC_*` are baked in at `next build`; "`.env.production.local` exists for exactly this". The file exists on disk (`ls -a` at repo root shows `.env.production.local`; contents NOT read, it may hold secrets).

What the shipping (unified) editor reads at runtime, `packages/editor/src/shared/utils/runtimeEnv.ts`:
- `:30-55` `readNextEnv()` reads literal `process.env.NEXT_PUBLIC_APP_URL`, `_SENTRY_DSN`, `_FEATURE_PUBLISH`, `_FEATURE_DS_AI`, `_FEATURE_COLLAB`; comment `:31-41` says Next replaces these by static text at build.
- `:67-80` `DASHBOARD_URL`/`SENTRY_DSN` and `:84-98` flags resolve `vite.VITE_X ?? proc.NEXT_PUBLIC_X`.
- Root `CLAUDE.md:285` and `:294`: only the `NEXT_PUBLIC_` half reaches production; `import.meta.env.VITE_*` does not exist in the Next bundle.

So the Vercel sentence is wrong on the host (cPanel), and the paragraph is silent that these values are build-time inputs for the Next build. Vercel does appear elsewhere in the file only as the publish target (`:521`, `:538+`), not as the host of the app; I did not check whether those are accurate.

Reproduced: not applicable (documentation defect; confirmed by reading the lines above, no command run beyond grep/ls).

## Scope

**In:**
- Rewrite only the sentence at `packages/editor/CLAUDE.md:514-515` so it says: dev values in `.env.local` at repo root; production runs on the cPanel Node.js app, not Vercel; point to root `CLAUDE.md` §Where the values live (`:328`) instead of copying the `cloudlinux-selector` procedure; state that values the Next-bundled editor reads are `NEXT_PUBLIC_*` and are baked at `next build` (root `CLAUDE.md:332`).
- Remove the string "Vercel project settings" from the file.

**Out:**
- The "must be prefixed `VITE_`" claim (`:513`) and the table's `VITE_*` rows: they describe the standalone Vite build only, and misdirect for production (see follow-up). Not changed here.
- `:521` "`true` once Vercel pipeline live" and the Phase 1d section: about publishing into the workspace's Vercel account; not the app host.
- Any root `CLAUDE.md` edit, code, scripts, or `check-prod-env.mjs`.

## Behaviour

No user-visible product change. Agents reading `packages/editor/CLAUDE.md` §ENV are told cPanel (not Vercel) is where production env lives.

## Data and contracts

none

## Done-condition (observable)

- [ ] Command: `grep -n -i "vercel project settings" /Users/shahg/Desktop/pencil/buildrik/packages/editor/CLAUDE.md` → no output (exit 1).
- [ ] Command: `sed -n 511,520p packages/editor/CLAUDE.md` → the paragraph names cPanel, references root `CLAUDE.md` "Where the values live", and mentions `NEXT_PUBLIC_*` baked at build.
- [ ] Command: `git diff --stat main -- .` → only `packages/editor/CLAUDE.md` changed (plus task docs); diff touches only the paragraph at ~`:513-515`.
- [ ] Command: `pnpm run audit:rules` → no new finding for `packages/editor/CLAUDE.md` versus before the change (any referenced path/section name exists).
- [ ] Old behaviour preserved: the ENV table (`:517-521`), Notes (`:523-534`) and all other sections are byte-identical.

## Risks and guarded areas

none. Docs only; no migrations, auth, billing, publish, tokens, baselines or CI touched. (`CLAUDE.md` files are read by the guard hook as instructions, but not listed as guarded.) UI change: no.

## Not verified

- Contents of `.env.production.local` and the live cPanel env (`pnpm run env:check:prod` not run; needs server access).
- Whether the cPanel build actually sets `NEXT_PUBLIC_FEATURE_PUBLISH` etc.; root `CLAUDE.md:298` says `check-baked-flags.mjs` checks the bundle, not run here.
- `pnpm run audit:rules` baseline not run by the analyst.

## Open questions / follow-ups

1. Follow-up (not decided here): `packages/editor/CLAUDE.md:513` says all editor env vars "must be prefixed `VITE_`", and the table lists only `VITE_*` names with "Production value" columns. For the shipping editor the `NEXT_PUBLIC_*` names are the ones that count (`runtimeEnv.ts:84-98`; root `CLAUDE.md:285`). Founder to decide whether that becomes its own task.
2. Follow-up: `:521` "once Vercel pipeline live" wording may be stale; root `CLAUDE.md` says Vercel/Stripe out of scope for now (memory index, 08-25). Unchecked.

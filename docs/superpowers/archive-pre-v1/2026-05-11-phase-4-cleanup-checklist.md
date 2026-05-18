# Phase 4 — Unification Cleanup Checklist

**Predecessor:** [2026-05-10-dashboard-editor-unification-design.md](./2026-05-10-dashboard-editor-unification-design.md) §Phase 4
**Status:** Blocked on Phase 3 flag-flip soak passing.
**Owner:** user (env/DNS/Vercel project actions); engineer (code deletions).

---

## Gates before any deletion

Do not start Phase 4 until ALL of these are true:

- [ ] `NEXT_PUBLIC_UNIFIED_EDITOR=true` shipped to prod
- [ ] 24-hour internal smoke on preview deploy clean (no ChunkLoadError spike, no autosave failures, no publish regressions)
- [ ] Production soak ≥ 7 calendar days clean
- [ ] `editor.buildrik.com` traffic < 1% of `app.buildrik.com/edit/*` traffic (metric-gated, per spec D7)
- [ ] No outstanding rollback within the soak window

Premature deletion (before metric gate) destroys the rollback path. Hold the line.

---

## Step 1 — Vercel-project redirect on `editor.buildrik.com`

User action. Cannot ship from Next.js (different deploy).

- [ ] Open Vercel project for `editor.buildrik.com`
- [ ] Settings → Redirects: add 301
  - Source: `/(.*)?siteId=([^&]+)(.*)`
  - Destination: `https://app.buildrik.com/edit/$2`
  - Permanent: true
- [ ] Also add catch-all 301:
  - Source: `/(.*)`
  - Destination: `https://app.buildrik.com`
  - Permanent: true
- [ ] Verify: `curl -I https://editor.buildrik.com/?siteId=abc123` returns `301 Location: https://app.buildrik.com/edit/abc123`

---

## Step 2 — Code deletions (after Step 1 deployed)

Engineer action. Single PR, gated on Step 1 verification.

- [ ] Delete CORS branch from `packages/dashboard/next.config.mjs` (entry at `source: "/api/:path*"`)
- [ ] Delete CORS preflight from `packages/dashboard/middleware.ts` (full file once that is its only job — confirm before deleting)
- [ ] Delete CORS branch from `packages/dashboard/app/api/trpc/[trpc]/route.ts` (lines referencing `EDITOR_ORIGIN`)
- [ ] Delete `EDITOR_ORIGIN` from `packages/dashboard/.env.example` if listed
- [ ] Delete the legacy fallback in `packages/dashboard/components/editor-route/unified-flag.ts`:
  - Replace `getEditorHref` body with always-`/edit/:id` (flag becomes vestigial)
  - Drop `NEXT_PUBLIC_EDITOR_URL` references from this file
- [ ] Delete the `?siteId=` query→`/edit/:id` Next redirect (was Phase 4 prep insurance, no longer needed once Vercel-project redirect is live)
- [ ] Delete `NEXT_PUBLIC_UNIFIED_EDITOR` from `.env.example` / Vercel env (flag retired)
- [ ] Update `EditorLink` to use plain `next/link` directly (kill the legacy `<a>` branch)
- [ ] Build + test: `pnpm --filter dashboard build`, `pnpm --filter dashboard test`
- [ ] Open PR titled `chore(unification): Phase 4 cleanup — retire flag + CORS branch`

---

## Step 3 — DNS removal

User action. ONLY after Step 1 has been live ≥ 30 calendar days AND metric gate met.

- [ ] Remove `editor.buildrik.com` CNAME/A record from DNS provider
- [ ] Wait 24h for propagation
- [ ] Delete the standalone Vercel project for editor (if it exists as a separate project)
- [ ] Verify `dig editor.buildrik.com` returns NXDOMAIN

---

## Step 4 — Dev-harness keep list

Do NOT delete. These stay for editor-only iteration:

- `packages/editor/vite.config.ts`
- `packages/editor/index.html`
- `packages/editor/demo/`
- `packages/editor/package.json` `dev` / `build` scripts

The Vite harness has no auth, no real persistence — it's a local-only editor sandbox. Useful for D11 / D14 visual work without booting the full Next.js + Postgres stack.

---

## Step 5 — Documentation

- [ ] Update `CLAUDE.md` stack section: remove "editor.buildrik.com" from architecture description
- [ ] Update `docs/architecture.md` (if it exists) to reflect single-deploy topology
- [ ] Mark the unification spec as superseded by this checklist

---

## Rollback contingency

If Step 2 deletions ship and a regression surfaces:

1. Revert the cleanup PR (one git revert, no env change needed because flag is already vestigial)
2. CORS branch comes back, dashboard tolerates cross-origin again
3. Restore `editor.buildrik.com` DNS only if it has been deleted (Step 3)

Steps 1 and 2 are reversible. Step 3 is one-way once DNS records propagate — wait for the full metric window.

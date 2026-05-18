# V1 Next Actions — Manual Steps

V1 shipped 2026-05-18 (commit `0ed94598`). 7/7 automation walk steps green.

Per spec Section 5: keep tech-debt freeze until **one real (manual, non-automated) user walk passes**. This is the last gate before unfreezing.

Two paths blocked on you. Both ~30 min each.

---

## Path A — Manual user walk (do this first)

### Setup

Dashboard (:3000) + editor (:5050) should both be running from prior session. Verify:

```bash
lsof -i :3000 | grep LISTEN
lsof -i :5050 | grep LISTEN
```

If either missing, restart:

```bash
cd packages/dashboard && npm run dev   # in one terminal
cd packages/editor && npm run dev      # in another
```

### Walk script (slow, careful, take notes)

Open Chrome (your normal browser, not the claude-in-chrome one). Walk these 7 steps. At each step, note anything that feels off, confusing, slow, or wrong — even tiny things.

1. **Sign in**: http://localhost:3000/auth → email `qa@buildrik.local` → password `qa-test-1234` → land on dashboard
2. **Create site**: click "New Site" → name "manual-walk-1" → click "📄 Start from Scratch"
3. **Open editor**: from sites list, click "Edit" on manual-walk-1
4. **Add 4 elements**: Section (Layout cat) → Heading (Basic) → Image (Media cat — picker should open) → Button (Basic) — try DRAG once, CLICK once, see which feels right
5. **Save**: Ctrl+S (or watch topbar "Not saved" indicator change)
6. **Publish**: topbar Publish dropdown → "Publish Directly" (you are OWNER = admin) → watch sim run (5 steps over ~10s) → toast with URL
7. **Persistence**: close browser tab → reopen → editor for same site → verify all 4 elements still on canvas

### What to capture

| Severity | Examples |
|---|---|
| P0 | Broke. Console error. Data lost. |
| P1 | Worked but confusing, multi-click, dead UI element, mute feature you couldn't figure out |
| P2 | Cosmetic — red button vs cobalt brand, font weird, spacing off, copy clunky |

Append findings to `V1_WALK_AND_FIX.md` under new "## Iteration 6 — manual walk — YYYY-MM-DD" section.

### Then

If only P2 found → spec says ship v1 + unfreeze tech-debt arcs.
If P0 found → new iter (Iter 7) with codex pre-check → fix → re-walk.
If P1 found → triage: ship as-is + log to `V1_POST_DEFERRED.md`, OR fix if quick.

---

## Path B — Real Vercel deploy verification

Sim path proven (Iter 5). Real path untested. Per CLAUDE.md "Phase 1d — Local publish smoke test (real Vercel)".

### Acquire token

1. Open https://vercel.com/account/tokens
2. Click "Create Token" → name "buildrik-dev-local" → select team if applicable → create
3. Copy token (only shown once)

### Wire credentials

Add to `.env.local` at repo root:

```
VERCEL_TOKEN=<paste token here>
VERCEL_TEAM_ID=<optional, omit if personal token>
VERCEL_PROJECT_PREFIX=buildrik-site-
```

### Restart + verify

```bash
# Restart dashboard (Next.js reads env at startup)
kill $(lsof -ti :3000)
cd packages/dashboard && npm run dev
```

### Re-walk Step 6 with real Vercel

1. Open editor on any site
2. Click Publish dropdown → Publish Directly
3. Watch dashboard log for `[publish-worker] job=… site=… pages=N mode=vercel` (mode=vercel, not mode=simulation)
4. Wait ~30-60s for real Vercel deploy
5. Editor toast shows real `https://buildrik-site-X.vercel.app` URL
6. Open URL in new tab → verify your edits actually rendered on the public internet

### Debug if it falls through to sim

- DevTools network: `sites.publish` should return `jobId` (no error)
- Dashboard log shows mode=simulation → `VERCEL_TOKEN` not in dashboard process env. Check `.env.local` is at MONOREPO ROOT (not in packages/dashboard).
- 401 / 403 from Vercel API → token invalid or scope insufficient.

---

## After both paths pass

Per spec Section 5:
1. Declare v1 fully shipped (already done for automation walk; this confirms human + real-Vercel)
2. Update memory `project_v1_shipped_20260518.md` with "Path A passed YYYY-MM-DD" + "Path B passed YYYY-MM-DD"
3. **Unfreeze tech-debt arcs**: remove `## V1 freeze policy` from CLAUDE.md, resume Gates 11-14 ratchet work + animation cleanup + other deferred arcs
4. Optional: Path C dogfood — use editor to build real buildrik.com landing page

---

## State at handoff (2026-05-18)

- 13 commits on origin/main, all gates green
- 5 V1 iterations closed
- Test sites in DB: cleaned up to just `test-site-iter5` (id `cmpbibfyn000211lowtqr8a8r`)
- Both dev servers running locally
- QA seed account: `qa@buildrik.local` / `qa-test-1234`

Pre-push BLOCKING hook ENGAGED — any commit you make will run `verify:ds` before push lands. If a gate trips, push blocks until you fix. This is intentional.

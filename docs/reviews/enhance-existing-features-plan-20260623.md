# Plan — Make Buildrik feel Webflow-grade (reliable + simple + agency)

**CEO-review verdict (2026-06-23):** Mode = HOLD SCOPE + REDUCTION. Sequence A→B + cut.
**Premise corrected:** the goal is NOT Webflow feature-parity. You have ~95 working
features. The goal is **an agency trusts it enough to hand a client's site to it** —
which is reliability + IA + the agency wedge, not feature count. Cloning Webflow's
complexity kills the wedge.

**Source of truth:** `complete-feature-list-20260623.md` (status) ·
`editor-backend-map-codex-20260623.md` (editor backend, file:line) ·
`ia-home-map-20260623.md` (structure) · `editor-left-bar-decision-worksheet.md` (rail).

---

## Phase 0 — Cut dead weight (FIRST: cheap, instant trust gain)

Dead/stub/broken features poison trust more than missing ones. Hide the entry-point,
leave the code (constitution #3). Reversible (flag), so two-way doors — move fast.

| Cut/Hide | Why | Action |
|---|---|---|
| Stock photos/videos | STUB → returns `[]` every query | hide from media UI |
| Real-time collab | 6 P1 convergence bugs | stays gated (P0 done) — keep off |
| Export HTML | anti-retention (takes user out) | remove from UI |
| Localization | engine locale-unaware, invisible | hide entry |
| AI "create site" | no AI branch → silent blank site | hide until real |

**Verify:** each is unreachable in the UI; no code deleted; flags documented.

---

## Phase A — Reliability (finish the half-wired; feedback everywhere)

This kills the users' #1 complaint ("not easy · no feedback · broken · not integrated").
Ordered by trust-damage.

### A1 — Silent data-loss (worst: user loses work with no warning)
| Item | Today | Fix | Failure mode named |
|---|---|---|---|
| Component masters | IndexedDB `aquibra-components` only | server model OR a clear "local-only" badge + warning | cross-device silent loss |
| Version history | IndexedDB `aquibra-versions` only | server persistence | new-device → versions gone |
| Component overrides | revert on master-sync (`ComponentInstances.ts:233-246`) | re-apply overrides after sync | edits silently revert |
| CMS bindings | RAM maps | ensure captured in project blob on save | binding lost on reload |
| Undo/redo | RAM (lost on reload) | acceptable; autosave covers — document only | — |

Each ships with a **"saved to cloud ✓ / local-only ⚠"** indicator. Trust is pixel-level.

### A2 — Broken (wired, real bug)
- **dns-verify cron** matched dead host → never verified. Commit `f51c50e6` claims a fix — **verify it actually verifies** end-to-end (live DNS).
- **Published-password** 402/403 swallowed on Hobby Vercel → doesn't gate. Either enforce or label "Pro only" honestly (no security theatre).

### A3 — Partial / no-feedback (extend recovery P1 to ALL actions)
| Item | Fix |
|---|---|
| Every editor action (paste/duplicate/component/save/publish) | toast + status (P1 started → finish coverage) |
| CMS server-sync lossy (drops on fail) | surface sync state + retry; stop silent drop |
| Share link decorative (redirects to public URL) | make token a real gate, OR label honestly |
| Analytics avgSession=0, hourly→daily | fix capture or hide the fake metric (no lying numbers) |
| Redirects stored-not-deployed | deploy to output, OR hide |
| resendInvite sends no email | actually re-send |
| Forms block config has no write path | wire the server write |

### A4 — Email reliability
- `sendEmail` is SMTP, failures `.catch(()=>{})` → silent. Surface failures; confirm Resend/SMTP configured in prod. Verify/reset/invite must not silently no-op.

**Phase A done-test:** re-run the 5-user walk (recovery P4 kit). Does "broken / no feedback" disappear? Measure before/after.

---

## Phase B — IA (ship the structure; it's already built, gated off)

The IA redesign is coded behind a flag (commit `622ef623`). Turn it on + finalize the rail.

- **Editor left rail** (frequency order, single-purpose, no clusters):
  `➕ Add · 🗂 Pages · ⌗ Layers · 🖼 Assets · 🎨 Design` + progressive `🧩 Components` / `🗄 CMS` (appear on first use). Settings → dashboard. Publish/Undo/AI → topbar.
- **Dashboard sidebar:** `Home · Sites · Clients · Team · Settings`.
- One home per feature (constitution #14); group by job not module.

**Phase B done-test:** same 5-user walk. Does "can't find things / messy" disappear?

---

## Phase C — Agency wedge (the real differentiator, AFTER solid+simple)

Only once A+B make it trustworthy and obvious:
- Turn ON Clients (flag currently off) — multi-client view.
- Shared design-system push (already working) — promote it.
- White-label + per-client review loop (fix the broken client side: `share/[token]` is just a redirect; no approve/comment for the client + no notify).

---

## Rigor (ceo-review prime directives applied)

- **Zero silent failures:** every fix surfaces its failure (no swallowed catch). Especially email, CMS-sync, publish.
- **Every state designed:** each touched surface gets empty/loading/error/success (constitution #13), not just happy path.
- **Observability is scope:** log every save/publish/sync/email failure. Today they vanish.
- **Deployments not atomic:** all behind flags; ship per-item, verify, next.

## NOT in scope (held the line)
- No new Webflow features. No feature-parity chase. Collab stays gated. Export cut.
- No rewrite — ~95 features work; this is finish + organize + cut.

## Sequencing (two-way doors, move fast)
`Phase 0 (cut)` → `A1 data-loss` → `A2 broken` → `A3 feedback` → `A4 email` → `B (IA on)` → `C (agency)`. Each phase ends with the 5-user walk + a measured before/after.

<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260822-145140.md -->
# PRD walk-and-fix — whole codebase against the registers, verified in the running app and in Figma

**Written** 2026-08-22 · branch `main` · HEAD `b5e63a04`
**Asked for by the founder:** walk the entire codebase against the PRD, verify it
against the Figma baseline file, fix the backend and the functionality, update
Figma alongside, and fix whatever blocks the walk.

---

## 1. The premise this plan rests on

**The PRDs already contain the work list.** Three reverse-engineered PRDs each end
with a "Gaps & decisions register" — 81 numbered items with file:line citations:

| Source | Broken/dead (A) | Product decisions (B) | Security (C) | Spec-only (D) | Drift (E) |
|---|---|---|---|---|---|
| `BUILDRIK-PRD-EDITOR.md` §13 + §13b | 20 | 14 | 5 | 8 | 5 |
| `DASHBOARD-PRD-2026-07-06.md` §13 | 8 | 5 | 2 | 1 | 4 |
| `BUILDRIK-PRD-COMPLETE.md` §12 (auth + onboarding) | 8 | 9 | 3 | 7 | 3 |
| **Total** | **36** | **28** | **10** | **16** | **12** |

So "walk the codebase against the PRD" is not an open-ended read of 200k lines. It
is: **take each register item, check whether it is still true at today's HEAD, and
fix the ones that are.**

**The registers are stale in both directions.** They were written 2026-07-06 against
HEAD `e5624ca1`; ~7 weeks and several arcs have landed since. Two examples found
while writing this plan:

- Editor A13 "dual conflicting arrow-key handlers on canvas" — **fixed today**
  (`useKeyboardMove` deleted, `keyboardHelpers` index dialect corrected).
- Editor A6 cites `ComponentsPanelV2` — **deleted 2026-08-16** with its feature flag.

And in the other direction, five defects found this session were in **no** register:
the right-click menu's 11 wrong shortcuts, the two style clipboards, Bring Forward
doing nothing, ⌘' flipping `snapToGrid`, and the Select Parent tooltip. A register
is a starting point, not a boundary.

## 2. What "walk" means here, precisely

For each register item, in this order:

1. **Verify at HEAD** — open the cited file:line. Three outcomes: STILL TRUE,
   ALREADY FIXED (record the commit), or NEVER TRUE (the register was wrong).
2. **Reproduce in the running app** where the item is user-visible. A code reading
   is not the verdict; this repo has passed three separate suites over a broken
   feature. (`feedback_always_work_against_a_stated_goal`)
3. **Fix**, with a test watched to FAIL first.
4. **Re-verify live**, and state what was not verified.

Items that are product decisions (B) are not fixed — they are put to the founder
with a recommendation, one at a time, at the point the walk reaches them.

## 3. Sequencing — behaviour and UI in one pass, two commits

The expensive part of a surface is understanding it, not editing it. Walking a
surface twice pays that cost twice. So: **one walk per surface, fixing behaviour and
visual conformance in the same pass, committed separately** (behaviour first, then
conformance) so a visual change can never hide a behaviour regression and a revert
stays surgical.

**One exception, and it is real.** ~30 editor states are still described in Figma by
a 2026-08-19 *prod* render. Drawing UI against a stale reference is drawing against a
picture of the old app (`feedback_reference_render_can_be_a_picture_of_the_bug`).
For those surfaces: **behaviour now, UI after the board is re-captured.** The
surfaces whose board IS current (shell, the five panels, site-menu, notifications,
comments, cmdk, publish-confirm, three inspector states, five canvas overlays) take
both halves in the same pass.

**AI is walked without spending money.** Generation calls are billed
(`OPENAI_API_KEY`). The apply path, guards, prompt composer, quota surfaces and
degraded states are all reachable with a stub provider and are in scope now. Live
generation verification needs an explicit founder yes and is *out* of scope until
then.

## 4. Phases

### Phase A — triage the 81 register items (no fixes yet)

Produce `docs/audits/2026-08-22-prd-register-triage.md`: one row per item —
id, claim, cited file:line, verdict (STILL TRUE / FIXED in `<sha>` / NEVER TRUE),
and for STILL TRUE a severity and a blast radius.

Done-condition: every one of the 81 has a verdict with evidence. No row reads
"probably fixed".

### Phase B — backend and functionality, in register order

Fix STILL-TRUE A-items and C-items, highest severity first. The PRDs' own
must-fix list is the starting order:

- **Editor A1/B1** — `editsRequireApproval` is saved and enforced nowhere. A
  workspace that demands review publishes anyway. Decision needed (enforce vs
  delete) — this is also security item C1.
- **Editor A2** — override reset / is-overridden are non-functional (path-scheme
  mismatch), `syncToMaster` is a stub. "Reset to master" lies today.
- **Editor A3** — `persistAll` drops 12 of 15 token kinds: silent design-token data
  loss on reload.
- **Editor A5** — `fileUploadMaxMB` plan limit unwired at presign.
- **Editor A9/A10/A12/A20** — publish status DEPLOYING written nowhere, PUBLISHING
  unfilterable, AI-gen jobs stranded with no reaper, worker no-op steps reported as
  completed.
- **Editor C3/C5** — EmailService renders caller HTML unescaped; upload
  `onUploadCompleted` never throws so a quota-exceeded upload silently orphans a blob.
- **Dashboard A2/A3/A4** — three 404 links, one dead "Revoke all other sessions",
  one guard that never renders.
- **Dashboard C2** — team router uses first-membership instead of active workspace:
  a cross-workspace action risk for multi-workspace users, and a low-effort fix.
- **Auth A1/A3/A7/A8, C1/C3** — `/auth/otp` broken forward, sidebar dot to a
  nonexistent route, orphan error pages, `Math.random` backup codes, no
  2FA-exhausted recovery.

Each fix: test watched to fail → fix → live verify → commit with the evidence in
the message.

### Phase C — the surfaces the registers do not cover

The registers are per-module and were written against the code, so they miss
whole-surface behaviour. Walk each surface end to end the way this session walked
the context menu and the z-order commands: take a printed contract (a label, a
shortcut, an empty state, a dialog's copy) and check the app honours it.

Order by blast radius: publish → media → pages/CMS → billing → team/invites →
marketplace. Publish first because it is the only surface where a defect reaches
the customer's customer.

### Phase D — Figma, alongside

Two jobs, both already started today:

1. **Flow** — Flow 1 now reaches all 20 CURRENT-era frames (was 5), 49 reactions,
   0 dead ends. **Done**, pending the repo-side record in
   `scripts/baseline/screens-editor.json`.
2. **Baseline** — 30 editor states still have only an 08-19 prod render. Capture
   each from the running app with `scripts/baseline/capture.mjs`, push through
   html-to-design, and mark the superseded frame. This is what unblocks UI work on
   those surfaces (§3).

Drift is measured, not eyeballed: `scripts/baseline/drift-diff.mjs <BL-id> <state>
--region 60,56,320,844`.

### Phase E — UI conformance, per surface, after its board is current

Board screenshot vs live screenshot at 1440×900, side by side, by eye — the
acceptance the founder set in `packages/editor/CLAUDE.md`. Conformance probes are a
regression net, never the verdict.

## 5. Not in scope

- Collaboration beyond keeping the flag off. Six known P1 OT bugs is a rewrite
  (editor B3); it stays demo-only until the founder funds it.
- Any real Publish to a customer domain. A "simulation" publish deployed a live site
  on 2026-08-21 because `PUBLISH_ALLOW_SIMULATION` permits a fallback rather than
  forcing one. Publishing in this arc happens only with the network to Vercel
  blocked and the block verified by watching it fail first.
- Paid AI generation calls (§3).
- Stripe live provisioning — a founder step in the Stripe dashboard, not a code task.

## 6. Risks

| Risk | Why it bites | Mitigation |
|---|---|---|
| The registers are 7 weeks stale | Fixing something already fixed, or trusting a stale ✅ | Phase A verdicts everything before any fix |
| A "dead control" is the harness | ~20 dead readings this session, 1 was real | Null result is the harness until proven otherwise: re-locate, re-focus, retry once |
| Full test suite is not trustworthy on this machine | Load >30 makes files report 600-1100s; three failures passed in isolation | Run touched areas; re-run any failure alone before believing it |
| UI drawn against a stale board | The reference is a picture of the old app | Behaviour-only on those surfaces until re-captured (§3) |
| Figma tool registry gaps | `mcp__plugin_figma_figma__*` missing mid-session | Direct JSON-RPC to `mcp.figma.com` with the keychain token (works today) |

## 7. Done-condition for the whole arc

- Every one of the 81 register items carries a verdict, and every STILL-TRUE A/C
  item is either fixed-and-verified or has a founder decision recorded against it.
- Each B item has been put to the founder with a recommendation.
- The Figma CURRENT cluster covers every editor state the app can reach, and the
  flow walks it.
- Anything left undone is named, with the reason, in the closing report.

---

## GSTACK REVIEW REPORT

### Runs

| Voice | Status | Findings |
|---|---|---|
| Claude subagent (CEO, independent) | ran | 10, ranked; 3 CRITICAL |
| Codex (CEO, strategy challenge) | ran | 6, all against the plan's foundation |
| Primary (probes against HEAD + live prod env) | ran | 8 register items sampled, 2 still true |

### CEO dual voices — consensus

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Premises valid? | no | no | CONFIRMED — the central premise fails |
| 2. Right problem to solve? | no | no | CONFIRMED — wrong problem first |
| 3. Scope calibration correct? | no | no | CONFIRMED — no canonical item list |
| 4. Alternatives explored? | no | no | CONFIRMED — none were written down |
| 5. Competitive/market risk covered? | no | no | CONFIRMED |
| 6. 6-month trajectory sound? | no | no | CONFIRMED |

6 of 6 confirmed, every one against this plan. No disagreements to arbitrate.

### What the plan got wrong (primary, verified)

1. **The count is wrong.** The table sums to 102, not 81, and the done-condition
   quotes 81 — so 21 items (all of D and E) could fall off and the phase would
   still read complete. `BUILDRIK-PRD-COMPLETE.md` §12 also self-describes as 27
   where the plan bills 30.
2. **Five Phase-B "must-fix" items are already fixed**, and the plan states them
   in the present tense as facts. Verified at HEAD: `editsRequireApproval` is
   enforced (`server/services/publish.service.ts:259`, with
   `__tests__/publish-approval.test.ts`); `persistAll` writes all 14 token kinds
   (`TokenRegistryContext.tsx:197`); `fileUploadMaxMB` is wired at presign;
   the team router resolves the active workspace (`resolveWorkspaceId`);
   DEPLOYING is written and reaped.
3. **The registers are not 7 weeks stale, they are pre-historic.** 1,362 commits
   and 2,320 of 4,553 tracked files have changed since `e5624ca1`. Every
   `file:line` citation is presumptively dead, so "open the cited line" is a
   re-investigation, not a triage step.

### What the probes found that no register carries

- **Production cannot take money.** `pnpm run env:check:prod` against the live
  cPanel env: 36 checks, 30 pass, **6 fail — every Stripe var missing**
  (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, all four Price ids). `getStripe()`
  throws `PAYMENTS_NOT_CONFIGURED`; the webhook route 500s on every delivery, so
  no plan can ever reach ACTIVE. Not a doc claim — a probe.
- **2FA backup codes are generated with `Math.random()`**
  (`server/services/account.service.ts:336-339`). Ten codes, one non-CSPRNG
  stream, and they bypass TOTP entirely. The same repo already learned this:
  `auth.service.ts:71` carries "CSPRNG suffix — Math.random() made the
  disambiguator guessable". The lesson was applied in one file and not the other.
- **`contactFormBlockConfig` is exported but never registered**
  (`src/blocks/index.ts:93`, absent from `blockRegistry.ts`) — the block is
  unreachable from Insert. Register item A14, still true.
- **The founder's own approved strategy is unexecuted.**
  `DASHBOARD-PRD-2026-07-06.md` §15 "Launch strategy (approved 2026-07-06 —
  office-hours + CEO review)" sequences Measure → Safeguard → Charge, first
  action "fire ONE event — `signup_completed`". Grep for that event, or for
  PostHog wiring: zero hits. Six and a half weeks, Sprint 1 not started.

### VERDICT

CODEX absorbed. CROSS-MODEL absorbed. The plan's method (register-first) is
rejected by both voices and by the primary's own probes. The plan is NOT
approved as written; the sequencing question goes to the founder.

**UNRESOLVED DECISIONS:**
- Which arc to run: register sweep as written, the founder's own approved
  Measure → Safeguard → Charge sequence, or a money-path-first walk. Both model
  voices recommend against the first. The founder's direction is the default and
  stands unless he changes it.

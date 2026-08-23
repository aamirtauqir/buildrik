<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260824-002448.md -->
# Editor → production: the whole walk

> Founder goal, 2026-08-23: walk every flow and gap, make every feature match
> the PRD, make the UI and IA excellent ("like Webflow"), update Figma, run
> autoplan, and after each walkthrough take a codex review and fix what it
> finds. End state: a bug-free editor in production.
>
> This plan exists because the work so far has been **targeted, not
> systematic**. Eight commits fixed real defects; none of them came from a
> complete pass. The scope below is measured, not estimated.

## 1. Scope, counted

| surface | count | source |
|---|---|---|
| App flows `F-A1..F-A8` | 8 | Ch.11 §11.1 |
| User flows `U1..U12` | 12 | Ch.11 §11.2 |
| Feature flows `FF1..FF35` | 35 | Ch.11 §11.3 |
| Flow dead-ends | 6 | Ch.11 §11.4 |
| Feature rows | 134 | Ch.12 |
| PRD chapters not yet walked | 11 | Ch.01–10, 14 |
| Active boards measured against the app | **6 / 366 (1.6%)** | `gate:boards` |

**55 flows and 134 features.** That is the denominator. Anything reported as
progress states its numerator against it.

## 2. What is already done (2026-08-23/24)

Commits `159afa27`, `768e9661`, `ea33fe24`, `732397a0`, `7bb6653a`, `28a03bc4`,
`4176e77e`, `76184d91`, `bad65182`.

- **F-A2 (save/autosave)** — partially walked. Fixed: the dashboard autosave
  never told the engine it saved, so every page kept a dirty dot over work
  already on the server; markers were panel state and died on tab switch; a
  superseded save could announce itself. NOT walked: conflict resolution UI,
  offline queue, version-restore interaction.
- **U11 (pages)** — partially walked. Fixed: six call sites answering "this
  project has no pages" with three names; SEO slug promising 30 points and
  paying 20; the slug guidance rendering as a run-on inside a warning box.
- **PRD claim sweep** — 15 of 39 ⛔/🟡 claims verified. 11 were stale; the
  register's "defect N2" was not a defect and both its numbers were wrong.
- **Figma** — one from-code capture (`1306:2`) parked beside board `302:1978`.

Not started: 6 of 8 app flows, 10 of 12 user flows, all 35 feature flows, 119
of 134 feature rows, 11 chapters, 360 of 366 boards.

## 3. Per-increment protocol (founder's loop, unchanged)

One flow per increment. For each:

1. **Read the contract** — the PRD section, and the board(s) for its screens.
2. **Walk it live** in the running editor. Not the JSX, not a unit test.
3. **Fix what the walk finds**, with a test that is watched to FAIL.
4. **Full suite** — file count must match the expected number, or the run is
   inconclusive, not green (`--maxWorkers=4`; the default oversubscribes this
   box and silently drops files).
5. **Codex review**, then fix its findings with a stated recommendation —
   including when the recommendation is to decline, with the reason.
6. **Commit + push**, one concern per commit.

## 4. "Like Webflow" as a checkable standard

Vibes are not a gate. This is what the phrase resolves to here, and every one
of these is checkable:

1. **Guidance sits beside the control that fixes it.** Not stacked into a
   warning banner. (Broken and fixed 2026-08-24 in the SEO panel.)
2. **Warnings are warnings.** An amber box carries a consequence, not a tip.
3. **One clause per banner.** Chained em-dashes become a wall in a 260px panel.
4. **Every state a control can reach is drawn** — empty, loading, error,
   disabled-with-reason. A disabled control says why.
5. **The same concept looks the same everywhere** — helper text, counters,
   point labels, dirty markers.
6. **Nothing promises what it does not pay.** A "+30 pts" label that awards 20
   is a UI bug, not a copy nit.
7. **DESIGN.md holds**: one accent `#1A56DB`, Inter, 4px spacing, no purple,
   minimal motion, no banned font fallbacks.
8. **Verified by looking at the rendered panel**, at 1440×900, in the running
   app — never by reading the diff.

## 5. IA

Per flow, three questions, answered in writing:

- **What opens this?** A surface with no door is not shipped (7 finished
  editor surfaces once had none).
- **Where does it return to?** Dead ends are §11.4's own register.
- **Does the label match the permission?** ("Cannot publish" over a role that
  could publish shipped once.)

## 6. Figma policy

- Board exists and is current → **board wins** on visuals.
- Board predates the feature (`302:1978` draws 4 fields for a panel that has a
  score block) → it cannot adjudicate what it does not contain. Capture the app
  beside it, mark `code:capture`, leave the original alone.
- 241 of 422 entries already carry `code:*`. Board-behind is the majority
  position, not an exception being invented per case.
- Captures: modals need `[role="dialog"]` as the capture selector — a `body`
  capture returns the scrim only. Every submit returns 200, including the ones
  that produce junk. Read the node back and look at it.

## 7. Done-condition

Not "walked". For each flow: **the flow completes in the running app, its
failure modes produce the stated outcome, and what was NOT verified is named.**

Production-ready is claimed only when:
- all 55 flows have a walk record with a live verification line,
- every ⛔/🟡 register entry is either fixed, or re-verified stale, or carries a
  named owner and reason,
- the full suite is green at the expected file count,
- `pnpm run env:check:prod` passes against the live server,
- and the remaining founder decisions (§8) are closed.

Until then the honest answer to "is it production ready" is a number, not a
yes.

## 8. Open founder decisions (blockers, surfaced not assumed)

1. **Media Trash is a toast stub** and there is no trash/restore anywhere in
   the product — a deleted site does not come back either. Build trash, or
   remove the affordance and say deletion is permanent?
2. **`resetOverride`-class capability** — the per-property override reset is
   gone (dead code, deleted). The whole-instance "Reset to master" ships. Is
   per-property reset wanted?
3. **Collab stays off** (6 known OT bugs). Confirming it is out of the
   production scope, not a gap to close.
4. **Stripe live mode is unprovisioned** — the four live Price ids are a
   founder step in the Stripe dashboard; nothing in this walk can close it.

## 9. Order

Money and data-loss paths first, then the core loop, then the long tail.

1. `F-A2` finish · `F-A1` boot/load · `F-A6` versions · `F-A7` undo — anything
   that can lose work.
2. `F-A3` publish · `U1` first-run → first publish — the money path.
3. `U2` build-a-page · `U3` brand · `U4` components — the core loop.
4. `F-A4` media · `U7` · `F-A5` AI · `U8` CMS.
5. `FF1..FF35` swept against §11.3's own failure-mode column.
6. Ch.12's 134 rows, status-verified in bulk.


---

# CEO REVIEW (autoplan Phase 1) — 2026-08-24

Mode: **SELECTIVE EXPANSION**. Baseline scope held and made bulletproof;
expansions surfaced individually rather than folded in silently.

## 0A. Premise challenge

**P1 — "The PRD is the contract; conforming to it produces a production-ready
editor." CHALLENGED.**
Of the 15 register entries actually verified this week, **11 were stale** — the
subject had been deleted or the defect already fixed — and one ("defect N2")
was *inverted*, with both of its numbers wrong. A register that is ~73% wrong on
a fair sample is a lagging log, not a contract. Treating each ⛔ as a work item
spends most of the budget re-discovering that the work is done.
**Reframe:** the PRD generates *hypotheses*; the running app is the contract.
That is already the founder's own rule ("live app is the verifier") — the plan
should state it as the ordering principle, because verify-then-fix is strictly
cheaper than fix-then-discover-it-was-stale.

**P2 — "55 flows + 134 features is the denominator." CHALLENGED, partly.**
`FF1..FF35` are mostly slices of `U1..U12` (FF12 instance-sync is inside U4;
FF14 send-for-review is inside U6). Counting them as independent roughly doubles
the denominator. Ch.12's 134 rows are *presence* claims, not correctness claims,
and can be status-swept in bulk. Honest denominator: **20 distinct flows** (8
app + 12 user), with FF rows as their failure-mode checklists and Ch.12 as a
verification pass. An inflated denominator is not neutral — it makes progress
look hopeless, and hopeless plans get shortcut.

**P3 — "UI like Webflow." ACCEPTED as direction, CHALLENGED as description.**
The eight rules in §4 are hygiene: they stop the UI *lying* and stop it
*sprawling*. They are real and every one came from a defect actually found. But
they are not what makes Webflow feel like Webflow — that is direct-manipulation
fidelity, a coherent class/style model, and instant feedback on the canvas.
Following all eight yields a *tidy, honest* editor, not a Webflow-class one.
Say so, so the bar is not silently mis-set.

**What if we did nothing?** The editor works. Every defect found this week was
real, and none of them stopped a user building and publishing a site. Which
raises the finding below.

### The premise the plan does not state, and should

**Verified against the live server this morning, not from memory:**

```
pnpm run env:check:prod  →  36 checks: 30 pass, 0 warn, 6 fail
  ✓ VERCEL_INTEGRATION_ID  ✓ VERCEL_CLIENT_ID  ✓ VERCEL_CLIENT_SECRET
  ✓ ENCRYPTION_KEY  ✓ GOOGLE_*  ✓ GITHUB_*  ✓ SMTP_*  ✓ OPENAI_API_KEY
  ✗ STRIPE_SECRET_KEY            ✗ STRIPE_WEBHOOK_SECRET
  ✗ STRIPE_PRICE_PRO_MONTHLY     ✗ STRIPE_PRICE_PRO_YEARLY
  ✗ STRIPE_PRICE_BUSINESS_MONTHLY ✗ STRIPE_PRICE_BUSINESS_YEARLY
```

**All six failures are Stripe, and nothing else fails.** Sign-up works. Building
works. Publishing is fully provisioned. The product cannot **charge anyone**.

This plan spends its whole budget on editor polish while the revenue path is
unprovisioned. That is not an argument against the walk — the walk is real work
and the defects were real. It is an argument that the plan's §8 buries the one
item that decides whether any of this earns money, as decision #4 of 4, phrased
as "nothing in this walk can close it."

It is a founder step in the Stripe dashboard: create the live Products, copy
four Price ids, set six vars. Test-mode ids already exist (created 2026-07-19).
It is hours, not weeks, and it gates everything.

## 0B. Existing code leverage

| Sub-problem the plan poses | What already exists | Verdict |
|---|---|---|
| Walk each flow live | `scripts/baseline/board-walk.mjs` drives the editor into named states; `board-recipes.json` holds 9 recipes | **Reuse.** Extend recipes per flow rather than writing probes per walk (this session wrote ~8 throwaway probes). |
| Compare app to design | `board-diff.mjs` + `image-compare.mjs` | Reuse, with the known caveat that percentages rank capture accidents unless states match. |
| Know which artefact wins | `boards.json.authority` per board | Reuse. 241 of 422 already adjudicated. |
| Catch UI regressions | 811-file suite, 15 DS gates, pre-push hook | Reuse. Add the §4 rules as gates where they are mechanical (em-dash count, hint-vs-banner placement). |
| Track what was walked | nothing — this session tracked it in prose | **Build.** One walk-record file per flow, or the count is unverifiable. |

Nothing here needs rebuilding. The one genuine gap is a walk ledger.

## 0C. Dream state

```
  CURRENT                        THIS PLAN                    12-MONTH IDEAL
  editor works; 20 flows    -->  20 flows walked live,   -->  a builder a
  unwalked; register 73%         register true, UI            stranger can use
  stale on sample; cannot        honest, Figma current        to ship a site
  charge anyone                  ... still cannot charge      AND pay for it
```

The plan moves hard toward the ideal on quality and **not at all** on the axis
that makes it a business. One founder afternoon closes that axis.

## 0C-bis. Implementation alternatives

**APPROACH A — Flow-first walk (the plan as written)**
Summary: walk 20 flows in the stated order, fix live, codex each.
Effort: XL · Risk: Low
Pros: highest coverage; every fix verified in the app; matches the founder loop.
Cons: no ledger, so "walked" stays a prose claim; re-derives probe scaffolding per flow; leaves revenue unprovisioned.
Reuses: board-walk, suite, gates.

**APPROACH B — Verify-first, then fix**
Summary: one cheap pass that re-verifies all 39 register entries and Ch.12's 134 status claims *before* any fixing, then walk only what survives.
Effort: M then L · Risk: Low
Pros: 11 of 15 sampled entries were stale — this pass is where the leverage is; shrinks the real work list before spending on it; produces the ledger as its output.
Cons: front-loads a boring pass; a stale entry can still hide a live defect (the SEO one did).
Reuses: everything in 0B.

**APPROACH C — Money path first, walk second**
Summary: provision Stripe live, verify checkout → webhook → plan flip end to end, then walk.
Effort: S (founder) + M (verify) · Risk: Med (live payments)
Pros: closes the only axis nothing else can; makes "production" mean something.
Cons: needs the founder in the Stripe dashboard; the walk still has to happen.
Reuses: `stripe-webhook.service.ts` tests, the invoiceParent/subItem helpers.

**RECOMMENDATION: B, with C running in parallel as a founder task.**
B because the sampled register is 73% stale and fixing before verifying spends
the budget on ghosts — "explicit over clever" applied to process. C in parallel
because it is not this session's work to do and it blocks nothing else.
A is not wrong; it is B without the cheap pass that makes it smaller.

*(Taste decision — A vs B is close. A is more satisfying and produces fixes
sooner; B produces a smaller, truer work list. Surfaced at the gate.)*

## 0D. SELECTIVE EXPANSION — expansions surfaced, not folded in

| # | Expansion | Effort (CC) | In blast radius? | Auto-verdict |
|---|---|---|---|---|
| E1 | Walk-ledger file per flow, with a live-verification line | ~20 min | yes | **APPROVE** (P2; the plan's own done-condition is unverifiable without it) |
| E2 | Turn the mechanical §4 rules into gates (banner em-dash count, hint placement) | ~40 min | yes | **APPROVE** (P1; a wording rule in a commit message comes back) |
| E3 | Extend `board-recipes.json` per walked flow instead of throwaway probes | ~30 min/flow | yes | **APPROVE** (P4/DRY; 8 probes were written and discarded this session) |
| E4 | Re-verify all 39 register entries in one pass | ~1 h | yes | **APPROVE** (this is Approach B's core) |
| E5 | Build media Trash + restore | days | no | **DEFER to TODOS.md** — product decision, not a defect (§8.1) |
| E6 | Per-property override reset UI | ~half day | no | **DEFER** — needs a board and a founder call (§8.2) |

## 0E. Temporal interrogation

- **Hour 1:** the register re-verification pass returns; the work list shrinks.
- **Hour 6:** three or four flows walked with ledger entries; the §4 gates catch
  their first regression.
- **Day 2:** the flows that can lose work (F-A1/2/6/7) are closed.
- **Week 2:** all 20 walked; Ch.12 swept; boards reconciled.
- **The 6-month regret:** that all of this shipped and the product still could
  not take a payment, because the Stripe step stayed a footnote in §8.

## 0F. Mode confirmation

SELECTIVE EXPANSION, confirmed. E1–E4 approved into scope. E5–E6 deferred.

## 0.5 CEO dual voices

**CODEX SAYS (CEO — strategy challenge)** — 6 findings.
critical: no production cut, only a verification marathon (no minimum bar, no
rollout/rollback, no launch decision). critical: commercial dependencies
unresolved and not named as blockers. high: founder bottleneck designed in.
high: "bug-free in production" is the wrong target — solo products die from
never shipping. high: scope too broad for a first push, no v1 wedge. medium:
quality discipline, weak market discipline — no activation / publish-success /
save-failure KPIs.
> VERDICT: "No... it gets the founder into an exhaustive validation grind
> without a hard shipping wedge or launch decision framework."

**CLAUDE SUBAGENT (CEO — strategic independence)** — 10 findings. Went and got
numbers rather than reasoning from the document.
critical: the plan is called "→ production" and contains no deploy. critical:
real users exist and the plan is addressed to none of them. critical:
"bug-free" has no exit. high: the denominator measures a stale document. high:
the differentiator (client review) has never been used once and is not in the
plan. high: the money path is broken in two places the walk cannot reach. high:
"like Webflow" is operationalized as copy consistency. medium: fourth
superseding plan in three days, none inheriting its predecessor's open
conditions. medium: no cut lane. medium: WebKit and the published-site beacon
unnamed in the done-condition.
> VERDICT: "produces a more correct editor on the founder's laptop and does not
> get the product to production."

### What I verified myself before adopting any of it

| claim | verdict | evidence |
|---|---|---|
| main is 869 commits ahead of the last deploy (2026-08-02) | **CONFIRMED** | `git log --since=2026-08-02 main \| wc -l` → 869 |
| Stripe unprovisioned in prod | **CONFIRMED** | `env:check:prod` → 36 checks, 30 pass, **6 fail, all Stripe** |
| editor e2e is Chromium-only | **CONFIRMED** | `packages/editor/playwright.config.ts:56` — one project; the dashboard config already has `bs-webkit-ventura` |
| published-site beacon is CORS-open | **CONFIRMED** | `app/api/public/track/[siteId]/route.ts:13` — `"Access-Control-Allow-Origin": "*"` |
| Buildrik has no product analytics | **CONFIRMED, with a sharper point** | 4 grep hits, all false positives: two are JSON-pointer/breadcrumb "segment", two are `AnalyticsInjector`, which injects gtag into the CUSTOMER's exported site. The product can instrument its customers and not itself. |
| app price SSOT | **CONFIRMED** | `lib/constants/plan-limits.ts:66,87` — PRO 29/23, BUSINESS 79/63 |
| marketing sells "Pro $24 / Team $79" | **NOT VERIFIABLE HERE** | the marketing site is not in this repo. Reported, not confirmed. |
| 15 prod users, 0 subscriptions | **NOT VERIFIED BY ME** | my probe hit the LOCAL dev database (11 users / 53 sites / 2 subscriptions). Different database. The order of magnitude — a handful of free users — is not in dispute; the exact figures are the subagent's, not mine. |

### CEO consensus

```
CEO DUAL VOICES — CONSENSUS TABLE
════════════════════════════════════════════════════════════════════
  Dimension                                Claude   Codex   Consensus
  ──────────────────────────────────────── ──────── ─────── ─────────
  1. Premises valid?                       NO       NO      CONFIRMED
  2. Right problem to solve?               NO       NO      CONFIRMED
  3. Scope calibration correct?            NO       NO      CONFIRMED
  4. Alternatives sufficiently explored?   NO       NO      CONFIRMED
  5. Competitive/market risks covered?     NO       NO      CONFIRMED
  6. 6-month trajectory sound?             NO       NO      CONFIRMED
════════════════════════════════════════════════════════════════════
6/6 CONFIRMED, 0 disagreements. Both voices reject the plan's framing.
```

Two independent reviewers, no shared context, same verdict. That is not a
disagreement to arbitrate — it is a signal to act on.

### The finding that outranks everything else in this plan

**The last production deploy was 2026-08-02. Main is 869 commits ahead.**

Every fix in §2 — the dirty dot that lied, the SEO panel that promised 30 points
and paid 20, the six strings answering one question — is on this laptop. None of
it has reached a single user. And §7's done-condition never says the word
*deploy*: it gates on `env:check:prod`, which checks environment variables, not
code.

A plan titled "→ production" that cannot end in production is the defect. An
869-commit first deploy is also a far riskier event than twenty small ones.

## FOUNDER DECISION — 2026-08-24: ship-wedge first

Both voices rejected the plan's framing 6/6. Put to the founder as a User
Challenge (never auto-decided). **Chosen: ship-wedge first.**

§7 and §9 are superseded by this. The new shape:

### SHIP gate (dated, and the only gate that blocks "production")

1. **Deploy the 869 commits** to `app.buildrick.io` and re-verify there. Not
   `env:check:prod` — that checks environment variables, not code. The
   done-condition now contains the word *deploy*.
2. `F-A1` boot/load · `F-A2` save/autosave · `F-A3` publish · `F-A6` versions ·
   `F-A7` undo, plus `U1` first-run→publish and `U2` build-a-page — walked live,
   **zero open data-loss defects**.
3. **One real Vercel publish observed end to end**, in production, not simulated.
4. **Stripe live-mode provisioned** — promoted out of the §8 footnote into this
   gate with a date. Six vars, four live Price ids; test-mode ids already exist
   (created 2026-07-19). Documented as a ~30-minute founder step in the Stripe
   dashboard. Nothing else in `env:check:prod` fails.

### POST-SHIP (the rest of the walk, unblocked by the gate)

The remaining 13 flows, the `FF` sweep, Ch.12's 134 rows, board reconciliation,
and every §4 UI rule beyond the ones already gated. Same per-increment protocol
(§3), same live-verification standard — just no longer holding the release.

### Carried, not dropped, from the reviews

- **Nobody has been asked.** One recorded research session (2026-06-21) and its
  verbatim was "no idea if a process errored or succeeded". §4's copy rules do
  not answer that; it is a feedback-and-state problem.
- **The differentiator has never run.** `agency_layer` is default-off and no
  real client-review walk has ever happened. It is the one layer of this product
  that is not commoditized, and it is untested.
- **The product cannot see itself.** No analytics SDK anywhere in Buildrik —
  the only gtag code in the repo (`AnalyticsInjector`) injects Google Analytics
  into the CUSTOMER's exported site. It can instrument its customers and not
  itself.
- **Chromium-only e2e** (`packages/editor/playwright.config.ts:56`) for a
  contenteditable + drag-and-drop editor. `bs-webkit-ventura` already exists in
  the dashboard config to copy.
- **The published-site beacon is CORS-open** —
  `app/api/public/track/[siteId]/route.ts:13` is `"Access-Control-Allow-Origin": "*"`
  with no consent gate, on every customer site.

These are recorded here so the next plan inherits them instead of rediscovering
them. Three prior plans in three days did not carry their predecessors' open
conditions forward; this one says so out loud.

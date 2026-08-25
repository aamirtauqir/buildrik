<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260825-102727.md -->
# Editor flow walk arc — walk every flow, reconcile the PRD, wire the flows

Status: REVIEWED (autoplan 2026-08-25 — CEO dual voices; both rejected v1)
Date: 2026-08-25 | Branch: `main` | HEAD: `ff7ec317`

Founder ask, binding: run autoplan; walk **every** editor flow except payment
and deploy; find what features are missing; consult the PRD on each walk;
**where the codebase is ahead of the PRD, add the missing features to the PRD**;
after each walk, test it and investigate; add the flow to Figma without
duplicating anything. Do not stop until every part is done.

**Scope is not cut.** Both review voices argued for a narrower arc. The
founder's instruction is explicit and stays. What changed after review is the
*method* — v1 rested on four false premises, listed and corrected below.

## Relationship to `2026-08-25-editor-ui-redesign.md` — declared

Same day, same HEAD, same Figma file and page. That plan is **REVIEWED with a
binding founder decision** ("all editor surfaces get a redesign"), and its
family 12 is literally `S-flows (S1 26, S5 23, S3 17, S7 14, S2 11, S6 1) = 93`
— the exact boards this arc would have redrawn. v1 of this plan referenced it
zero times. That was the single worst defect in it.

**The split, from here:**

| Owns | Arc |
|---|---|
| Redrawing any board — panel, state, or flow | `editor-ui-redesign` (family order fixed there) |
| Flow **behaviour**: does the flow work, end to end, live | **this arc** |
| PRD Ch.11 + Ch.12 reconciliation | **this arc** |
| Flow **wiring** in Figma — prototype edges between boards that already exist, plus a per-flow map board | **this arc** |
| Creating a state board that no family covers | **this arc**, but only after the redesign arc's family for that area has shipped, and recorded in `boards.json` first |

A third same-day plan, `2026-08-25-compare-family-rebuild.md`, is **VOID** —
its own header says so, because eight `Compare · *` boards were matched to the
wrong component before anything was built. Board-to-component matching has
already destroyed one plan today. This arc does not redraw boards; it wires
them, which cannot make that mistake.

## Four false premises in v1, corrected

Both voices caught these independently. All four verified against the repo.

| v1 claimed | Truth |
|---|---|
| "All 17 walk records dated 2026-08-24" | `U9` is **2026-08-25**. v1's own table said so and the prose contradicted it |
| "Five records are PARTIAL" | **Seven**: `F-A3`, `F-A5/F-A8`, `U4`, `U6`, `U7/F-A4`, `U8`, `U10-U12` |
| "Seven flows have **no** Figma coverage" | **False.** `boards.json` active: AI **11**, Brand **28**, Components **8**, Content **15**, History **16**, Pages **13**. The "flow board vs panel board" distinction was invented for v1 |
| "Ch.11 carries stale ⛔ claims" as the justification | **32 ⛔, 13 already struck** with dated verification (commits `732397a0`, `28a03bc4`, `3ae322cd`). Direction A is ~40% done; the remaining **19** are the real target |

And one v1 missed entirely: **Ch.12 contains zero `⛔` markers.** It uses a
status legend. A method keyed on ⛔ would have skipped the chapter that is
actually behind.

## What a walk detects — and what it does not

v1 used "walked · PASS" as a close condition. That manufactures false cleans:

- `docs/walks/U3-brand-design-system.md` is 24 lines and says **"No defect
  found. Recorded as a pass."** The redesign arc's ledger rates the same panel
  R10 (no swatches, no specimens) and R11 (two save vocabularies on screen,
  plus a contrast failure). Both cannot be true.
- The redesign arc's **R0 is Critical** — every Insert row and every Layers row
  renders a 12×12 grey `<span>` with no SVG, so 53 element types are visually
  identical (`GroupSection.tsx:101`, confirmed live). **Not one of the 17 walk
  records mentions it.**

**A walk detects behaviour, state, and data. It does not detect visual or IA
defects.** "Walked · no defect" closes the behaviour question only, and every
record must say so. Visual defects belong to the redesign arc's ledger.

## Task 0 — the desk pass, before the app is opened

Free, and it shrinks and sharpens everything after it.

- **0a. Harvest the backlog that already exists.** The 17 records carry **31**
  "not covered / not exercised / not walked" markers. That list is the per-flow
  leg backlog, written at zero marginal cost. It sets walk depth per flow.
- **0b. Commit the rig.** `scratchpad/rig.mjs` is session-local and dies with
  the session; nothing in the repo can reach it. Move it to
  `scripts/baseline/` with the four traps documented in-file (single-use magic
  links; `verifyMagicLink` 10/15min with the bucket in `rate_limit_buckets`;
  429 rendering as `expired-link` via `app/auth/callback/page.tsx:17`'s single
  catch-all `failed()`; the dev overlay at `z-index 100000`).
- **0c. ~~Regenerate `boards.json`~~ — DONE 2026-08-25, and the census is
  sound. All three review concerns failed verification.**

  | Review claim | Verified result |
  |---|---|
  | "422 rows but the page has fewer — census is stale" | **False.** Live dump: **354 top-level boards + 68 inside 5 SECTIONs** (`📄 Reference` ×2, `🗃️ Archive — superseded`, `🔍 REVIEW · Templates + Components`, `🔍 REVIEW · Insert`) = **422**. Zero live boards absent from the census. My first dump filtered `page.children` to FRAME/COMPONENT and missed the section contents — **my probe was incomplete, not the artifact** |
  | "`activeFamilies: 34` but the array carries 41 families" | **False.** 34 is the count of distinct families among **active** boards, which matches exactly. 41 counts all boards including `designAhead` (30) and `outOfScope` (26). The review compared against the wrong set |
  | "`generatedAt: 2026-08-14` but edited through 08-24 — the date lies" | **False.** Every post-08-14 commit is a **targeted row edit** (1–58 lines, mostly equal add/delete), not a regeneration; `bad65182` added 11 net rows. `generatedAt` means "last full dump", and curated row edits after it are the established convention |

  Nothing to regenerate. Figures from `boards.json` are quotable. This entry is
  kept rather than deleted because nearly propagating three false findings out
  of a review is the same failure as trusting a stale census — in the other
  direction. **Verify the reviewer too.**
- **0d. Ch.12 DELETE-pass, before any add-pass.** Verified rows citing code
  that no longer exists — `PublishDropdown.tsx` (0 files, 0 refs; only a stale
  comment at `AquibraStudio.tsx:354`), `WelcomeModal`, `SpotlightOverlay`,
  `PageWizard`, `AICopilot`. Plus Ch.12 **contradicts itself**: §12.6 strikes
  `AIAssistantBar` as deleted, §12.8 asserts it live. Adding rows to a chapter
  whose evidence column points at deleted files makes it worse.

## The PRD reconciliation, both directions

**Direction A — PRD ahead of code (claims code does not honour).** Scope is the
**19 unstruck ⛔** in Ch.11. Each checked first against the 17 walk records
(at least one is already settled there), then against HEAD, then struck with
the commit that fixed it or kept with fresh evidence.

Already-found cross-document contradictions to settle in 0d/A:

| Fact | Ch.11 | Ch.12 | Code |
|---|---|---|---|
| Settings screens | `:226` "13 sections + 2 workspace deep-links (counted live 08-24)" | §12.7 "10 + 3 deep-links" | **13 in-editor + 2 workspace** (`SettingsTab.tsx:77-91,121-122`) — Ch.11 is right |
| View-mode param | — | `:29` `?view=client` | **`?view=readonly`** (`editorViewMode.ts:15,30`) — Ch.12 is wrong |
| E-com blocks in catalog | `:208` live ⛔ "not in build-tab catalog" | §12.6 struck as "wrong, corrected 08-23 — reachable under Advanced" | `U8` walk measured **four** blocks on 08-24 — Ch.11's ⛔ is stale |

**Direction B — code ahead of the PRD (the founder's explicit ask).** Per flow,
enumerate what the code actually does, diff against Ch.12's rows for that area,
and write the missing rows in with `file:line` evidence. New rows land in
§12.8, which is the chapter's own convention for new drift. §12.7's counts
snapshot is regenerated at the end so the numbers match the rows.

## Scope — 19 lanes

Excluded by founder: **payment** (billing/Stripe) and **deploy** (`F-A3`'s real
Vercel leg, `S6` custom-domain DNS). `U1` walks up to the publish handoff and
stops. `U10` export is the no-publish path and stays in.

v1 said "18 flows" and then listed 19 rows. It is **19**, and `U10`/`U11`/`U12`
share one record file — that file is split into three before the arc starts, so
per-lane commits do not collide.

| # | Lane | Record today | Depth this arc |
|---|---|---|---|
| 1 | `F-A1` boot & load | 131 ln | uncovered legs only (3 markers) |
| 2 | **`F-A5` AI edit pipeline** | 52 ln PARTIAL, **never fired** | **full walk — fire a real call** |
| 3 | `F-A2` save / autosave / conflict | 259 ln | uncovered legs (2) |
| 4 | `U2` build a page | 620 ln | uncovered legs (2) |
| 5 | `F-A7` undo / redo | 57 ln | full |
| 6 | `U4` components | 42 ln PARTIAL | full (3 markers) |
| 7 | `U6` review / approval | 47 ln PARTIAL | full |
| 8 | `U8` CMS / ecommerce | 41 ln PARTIAL | full |
| 9 | `U7` + `F-A4` media | 214 ln PARTIAL | uncovered legs (2) |
| 10 | `U3` brand / design system | 24 ln, false "pass" | full |
| 11 | `U11` pages | in U10-U12 PARTIAL | full |
| 12 | `U1` first-run | 34 ln | full |
| 13 | `U5` view mode | 49 ln | full |
| 14 | `U12` site settings | 51 ln | full |
| 15 | `U10` export (no-publish) | in U10-U12 PARTIAL | full |
| 16 | `F-A6` versions | 78 ln | uncovered legs (1) |
| 17 | `U9` version rescue | 386 ln, 08-25 | uncovered legs (**5** markers) |
| 18 | `F-A8` sync fan-out | in F-A5 record | **code-verified, not walked** — no UI of its own |
| 19 | `U10`/`U11`/`U12` record split | — | task 0 prerequisite |

**Order changed from v1.** `F-A5` moves from last to **second**: it is the only
lane with a genuine unknown (never executed once), and putting the only unknown
last maximises the chance the arc dies before reaching it. Its blocker is
resolved — **`OPENAI_API_KEY` is set in `.env.local`**, with `OLLAMA_BASE_URL`
and `OLLAMA_MODEL` as a local fallback. No founder round-trip needed.

`F-A8` is **not** a user-facing flow — its own record says "no UI of its own".
It gets code verification and a service-contract test, not a walk and not
boards. Drawing boards for background fan-out without user-visible states is a
category error.

## Per-lane loop

```
  for each lane:
    1  read its Ch.11 entry + its Ch.12 rows + its "not covered" markers
    2  walk live at 1440x900 on the committed rig
       - depth set by step 1's markers, not by re-deriving them
       - failure legs included
    3  test: any defect found carries a regression test OBSERVED TO FAIL
       at the pre-fix commit. "A test exists" is not a close condition —
       827 test files exist; a search will always find one.
    4  investigate each defect to a root cause at file:line
    5  PRD: Direction A on its unstruck markers, Direction B into 12.8
    6  Figma: wire the flow (prototype edges between EXISTING boards) +
       a per-flow map board. Record missing state boards in boards.json;
       do not draw them - that is the redesign arc's lane.
    7  update the record; state explicitly that visual/IA was NOT assessed
    8  commit the lane
```

## Figma: wire, do not redraw

Flow wiring is established practice here — `project_figma_flow_wiring_20260805`
records a prior pass (spine 100%, 22 code-backed screens). Two traps from it:

- **In-degree is not reachability.** A "0 orphans" reading by in-degree called a
  5-board disconnected cluster healthy. Verify by **BFS from
  `flowStartingPoints`**, never by counting inbound edges.
- **Frame-level reactions are invisible to `findAll` alone** — carriers must be
  `[frame, ...frame.findAll()]`.

Anti-duplication protocol, before any node is created:

1. Regenerate `boards.json` (0c) and resolve coverage from it.
2. Re-read the live page with `use_figma` — the census has been observed to
   lie about its own date.
3. A duplicate is same `(flow-step, state)` pair, regardless of name. Name
   similarity is not the test.
4. Read the node back after writing. A write is not verified by the write.

## Alternatives considered and rejected

v1 named none. Both voices flagged that.

| Alternative | Why rejected |
|---|---|
| Harvest the 31 "not covered" markers into a risk-ranked list and stop | Adopted as **task 0a**, not as the whole arc — it produces a backlog, not verification |
| Desk-reconcile the PRD only, no walking | Adopted as **task 0d + Direction A**. Cannot settle Direction B: what the code does beyond the PRD is only visible by exercising it |
| Fold the behaviour walk into the redesign arc's per-family loop | Rejected: that arc is ordered by *visual* impact per family; this one by *data-loss* risk per flow. Different orders, different instruments. The split is declared above instead |
| Spend the cycle on the carried items instead — run `agency_layer` once, wire analytics, ask a user | **The strongest alternative.** `docs/PRODUCT-OVERVIEW.md` §1 calls the agency review loop "the wedge". It has never run. Rejected only because the founder's instruction is explicit and binding — but `U6` (lane 7) is the review loop, and this arc walks it, which is the closest this scope comes to running the wedge. Recorded so it is not lost again |

## Risks

| Risk | Mitigation |
|---|---|
| Boards drawn here go stale when the redesign arc redraws the same families | This arc draws no boards. It wires edges, which survive a redraw |
| 19 lanes × 8 steps produces documentation graffiti and noisy history | Depth is set by the 31 existing markers, not by re-deriving. Substantial records get uncovered legs only |
| Walk returns a false clean on a visual defect | Every record states that visual/IA was not assessed. See "What a walk detects" |
| `F-A5` fires a paid OpenAI call | Key confirmed present; Ollama fallback configured. One call, dev only |

## Inherited from `2026-08-24-editor-production-walk.md`

SHIP gate item 2 (`F-A1` · `F-A2` · `F-A3` · `F-A6` · `F-A7` + `U1` + `U2`
walked live, zero open data-loss defects) — this arc walks six of the seven,
all but `F-A3`, so it **advances but cannot close** the gate. Items 3 and 4
were removed from scope by founder call 08-25; item 1 landed 08-24. Note that
the same source plan classifies "Ch.12's 134 rows, board reconciliation" as
**POST-SHIP** — so this arc is post-ship work and is not release-blocking.

**~~`agency_layer` has never run~~ — RETIRED 2026-08-25.** It has now run, end
to end, and it works: editor `Re-send` → `reviews.submit` → client
`/review/<token>` **with no session** → `Approve` → `clientReview.resolve` → DB
`PENDING → APPROVED` → **editor topbar reads "Approved by Fixture Reviewer ·
just now"**. `agency_layer` and `client_mode` are enabled on the fixture
workspace. Record: `docs/walks/U6-review-and-share.md`. Three plans carried this
line forward unchanged; it is false now.

This also revises the "alternatives considered" row above, which rejected
"run `agency_layer` once" on the grounds that walking `U6` was only *the closest
this scope comes* to running the wedge. It turned out to be the thing itself.

Still carried, none addressed here: nobody has been asked since 2026-06-21; no
analytics (`sidebarAnalytics.ts:19` is a `noopProvider` wired only from its own
test); Chromium-only e2e; the published-site beacon is CORS-open
(`app/api/public/track/[siteId]/route.ts:13`); the palette fails its own WCAG
lint.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_open | Dual voices, both rejected v1; 15 + 6 findings, all verified, folded in |
| Eng Review | `/plan-eng-review` | Architecture & tests | 0 | pending | Runs after task 0 lands |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | n/a | This arc assesses behaviour, not visuals — the redesign arc owns that |
| DX Review | `/plan-devex-review` | Developer experience | 0 | skipped | No developer-facing scope |

**CEO DUAL VOICES — CONSENSUS**

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| Premises valid? | NO | NO | **CONFIRMED** — four false premises, all four verified and corrected |
| Right decomposition? | NO | NO | **CONFIRMED** — both said walk-by-flow is the wrong unit; method changed, scope kept per founder |
| Figma lane sound? | NO | NO | **CONFIRMED** — "seven flows have NONE" was false; lane changed from redraw to wire |
| Re-walk everything justified? | NO | NO | **CONFIRMED** — depth now set by the 31 existing markers |
| Sequencing sound? | NO | NO | **CONFIRMED** — `F-A5` moved last→second; its blocker probed and cleared |
| PRD work real? | PARTLY | PARTLY | **CONFIRMED** — Ch.12 drift real, Ch.11 ~40% already done |

**CROSS-MODEL:** both voices independently found the false Figma-gap claim and
the unjustified re-walk. The Claude voice additionally caught the undeclared
collision with the redesign arc and the U3/R0 false-clean evidence; Codex
additionally caught the PARTIAL undercount and the Ch.12 `?view=client` drift.

**VERDICT:** CEO CLEARED with all findings folded in. Scope held per founder
instruction; method rewritten. Eng review runs after task 0.

**UNRESOLVED DECISIONS:**
- Whether a genuinely-missing state board discovered during a walk gets drawn here or queued for the redesign arc's family. Default taken: queue it in `boards.json`, draw nothing.

---

## ARC STATUS — 2026-08-25

18 commits. **Zero changes to `packages/editor/src`** — this arc walked,
measured and documented; it did not change product code, so it carries no
regression risk. `gate:boards` PASS (422 rows, 34 families).

### Lanes

| lane | state | headline |
|---|---|---|
| `F-A1` boot & load | **closed** | crash recovery walked for the first time — PASS. Migration v3 passes, v1 abandons what it skips |
| `F-A5` AI pipeline | **closed** | fired for the first time; `OLLAMA_BASE_URL`'s presence routes all AI to a dead provider; with routing fixed the whole pipeline passes and "one undo step" is measured true |
| `F-A2` save / conflict | **closed** | stranded-mirror guard holds against a real blocked mirror |
| `U4` components | **partial** | the real harness blocker found (dev overlay impersonates the inspector); override chain still not walked |
| `U11` pages | **closed** | home delete guarded and visible; engine last-page guard still absent |
| `F-A7` undo / redo | **closed** | caps and exclusions verified; one listed exclusion was the wrong direction |
| `U6` review round | **closed** | **the round closes end to end — the differentiator has now run** |
| `U12` settings | **partial** | two settings surfaces; the menu row names the wrong one |
| `U3` brand | **partial** | the linter names `color-accent` and `color-success` as WCAG failures; no auto-fix exists |
| `U7` media | **partial** | filter counts are real with assets present; refines the redesign arc's `R7` |
| `U8` CMS / e-com | **closed** | the e-com ⛔ is stale for the third time |
| `U1` first-run | **partial** | dashboard `Edit` door wired to `/edit/:id` |
| `F-A6` versions | **closed** | 50-cap real and running; named milestones are never pruned |
| `F-A8` sync fan-out | **closed** | four registrations, one domain exercised live, and only that one claimed |
| `U10` export | **closed** | HTML/ZIP/React live, Vue and Next.js labelled "Soon", real output size shown pre-export |
| `U5` view mode | **closed** | rail 0, no Publish, no review controls, and **Delete on a selected element left 50 elements at 50** |
| Figma | **closed** | audited before drawing; S5 wiring already complete, nothing to add, three "unwired" entries were caption strips |
| `U2` build a page | **closed** | both P3 legs verified; `SNAP_THRESHOLD` is defined twice and one comment contradicts its own line |
| `U9` version rescue | **closed** | the scrubber reads the in-session undo stack, not saved versions; the approval band counts and names post-approval drift |

### Seven false findings caught before filing

The number worth carrying forward. Each would have been a confident, wrong bug
report:

1. Ch.11's inspector taxonomy — refuted by the code's single `SECTION_REGISTRY`.
2. "Identical grey glyphs" — capture artifact **in the baseline**, but real in
   the live product (the redesign arc's `R0`). Both halves needed measuring.
3. "Undo does not revert an AI apply" — confounded baseline; the property was
   already applied from a prior run.
4. "`consumeLastCrash` has no production caller" — a filtered grep hid
   `RecoveryBanner.tsx:47`.
5. Three census defects from the reviewers — board set, `activeFamilies` and
   `generatedAt` all survived verification.
6. "`⌃,` is a dead chord" — my own `stripDevOverlays` was deleting the modal.
7. "Three S5 boards are unwired duplicates" — they are 19px-tall caption strips.

Plus two bugs in my own tooling, both found by the walks they were meant to
serve: `stripDevOverlays` removed `<html>` and blanked the page, then removed
product modals.

### What remains

`U4`'s override chain · the
per-section `U12` drill-ins · `U3`'s remaining lint rules and export formats ·
`U7`'s eight uncovered media surfaces · `U6`'s `Ask for changes` branch and
share-link password/expiry.

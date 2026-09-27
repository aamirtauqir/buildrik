# Inspector — master plan (Figma first, then code)

Status: **PLAN — waiting for the owner's "go". Nothing in this plan has started.**
Owner rule: the design contains exactly the Inspector features and states that were audited and approved.

Inputs (all approved 2026-09-27):
- Architecture + owner approvals: `2026-09-27-inspector-architecture-proposal.md` (Q1–Q8, R-DD-8/9/14/17/18, §17–§20)
- Decisions + inventory: `2026-09-27-inspector-redesign.md` (DD-1…DD-22), `…-inventory.md`
- Board acceptance checklist: `2026-09-27-inspector-figma-board-spec.md` (36 boards, MUST / MUST-NOT lists)
- Behaviour reference: HTML prototype `~/.gstack/projects/aamirtauqir-buildrik/designs/inspector-redesign-20260927/finalized.html`

## Phases at a glance

| Phase | What | Output | Depends on | Estimate |
|---|---|---|---|---|
| 0 | Figma access + setup | working Figma connection, target section, DS component keys | owner: Figma login if needed | ½ day, ~15 calls |
| 1 | Build 36 Figma boards | "Inspector v4" boards on Editor v3 · IA page | Phase 0 | 2–3 days, ~130–170 calls |
| 2 | Board acceptance + owner review | every MUST ticked, every MUST-NOT absent, owner sign-off | Phase 1 | ½ day + owner time |
| 3 | Code prerequisites (can run alongside 1–2) | P-1…P-13 defects fixed with tests; Q2 type fix | owner "go" | 3–4 days |
| 4 | Eng review of the build | `/plan-eng-review` on this plan | Phase 2 | ½ day |
| 5 | Implement the approved Inspector | code matching boards | Phases 2, 3, 4 | 6–8 days |
| 6 | Validation | status per item: IMPLEMENTED / FUNCTIONALLY VERIFIED / RUNTIME VERIFIED | Phase 5 | 1–2 days |

Estimates are for this setup (agent-driven, Figma quota 200 calls/day shared). Figma is the bottleneck, not code.

---

## Phase 0 — Figma access and setup

1. **Connection.** Try the in-session Figma tools; if absent (usual), use the repo script `scripts/baseline/figma-mcp.mjs`
   (repo root, uses the keychain token and sends `X-Figma-Plugin-Bundle` so the write tool `use_figma` is available).
   If the token is rejected, the owner runs `/mcp` and re-authenticates Figma. *(owner action only if needed)*
2. **Quota rules** (memory `figma-mcp-daily-call-budget`): 200 calls/day, 15/min, shared by every session; reads cost
   the same as writes; the cap trickles back. So: no exploration with the quota, no parallel Figma agents, every write
   goes through `scripts/figma/apply-queue.mjs` (batched, read-back in the same call, resumable).
3. **Target:** file `g4GzQFqzNYz5sosz1QtZXC`, page Editor v3 · IA `4418:45431`. New section **"Inspector v4 · approved
   2026-09-27"**. The 21 existing Inspector boards (`807:*`, `159:*`, `160:*`, `189:2`, `1175:4841`, `1176:4804`) stay
   untouched as history.
4. **Collect DS component keys** once (one metadata read): text input, number+unit, select, segmented control, checkbox,
   chip, tabs, button, icon button, menu, popover, toast, dialog, v3 editor shell. Store them in
   `scripts/figma/inspector-v4/components.json` so every later call reuses them without reading again.

**Done when:** one test write + read-back succeeds in the new section; component keys saved.

## Phase 1 — Build the 36 boards

Build order (each step is resumable; the queue records what landed):

| Step | Content | Why this order | Calls (est.) |
|---|---|---|---|
| 1a | **Inspector chassis components** (local to the section): header (breadcrumb, name, ✦ AI, ⋯, ✕, status marks), tabs, context row, section header in 3 variants (open · closed-with-summary · empty "+"), row types (field, pair, segmented, select, colour + token chip, checkbox, box diagram, source row, list row), error line, warning box, status line (locked / conflict), component row | Every board is built from the same parts, so a later change is made once | 25–35 |
| 1b | **Selection-type boards 1–20** (spec §1) | Largest group; proves the chassis | 50–60 |
| 1c | **State boards 21–29** (spec §2) | Reuse 1b boards + a status variant | 25–30 |
| 1d | **Overlay boards 30–36** (spec §3) | Menus, dialog, popover, AI column, hidden inspector | 15–20 |
| 1e | Canvas selection on every board (selected element outlined, label) + board captions linking to decisions | Makes each board self-explaining | 10–15 |

Build rules:
- Visuals only from DS components and `--bk-*` variables; Inter / Geist Mono; weights ≤ 600; panel radius ≤ 4; 4px grid.
- Inspector column 300px inside a 1440×900 v3 shell; the selected element visibly selected on the canvas.
- Known Figma traps (memory `figma-build-traps-2026-09-21`): auto-layout swallows appended nodes; `resize()` flips AUTO
  to FIXED; instance children load lazily; a failed script rolls back — so every script re-reads what it wrote.
- Writes are proven by read-back, never by "the call returned".

**Done when:** all 36 boards exist in the section, each with its caption.

## Phase 2 — Acceptance and owner review

1. For each board: tick every MUST item and confirm every MUST-NOT item is absent (board spec). One batched export of
   thumbnails for the whole set instead of 36 screenshots.
2. Register the boards in `scripts/conformance/boards.json` as family **"Inspector v4"**; mark the old Inspector
   boards `superseded` (not deleted) — including `160:412` reach-all and `189:2` whole-site, whose features were removed.
3. Publish a review page (artifact) with every board, its checklist and its decisions.
4. **Owner review.** Changes loop back to Phase 1 for the affected boards only.

**Done when:** every board passes its checklist and the owner signs off.

## Phase 3 — Code prerequisites (independent of the design; can start with Phase 1)

Each item: failing regression test first → fix → test passes → verified in the live app (1440×900) → own commit.

| # | Defect | Where | Priority |
|---|---|---|---|
| P-1 | Locked elements editable from the Inspector; ⋯ Delete deletes locked | `useStyleHandlers.ts`, `shell/StudioPanels.tsx:660-675` | P0 |
| P-2 | Binding to CMS wipes text; unbind doesn't restore | `ContentSection.tsx`, CMS binding manager | P0 |
| P-3 | Gradient writes editor chrome tokens into published sites | `BackgroundSection.tsx:154,172,186` | P0 |
| P-4 | Colour/token popover clipped (invisible) | `ColorInput.tsx:166`, `chrome-ui/Popover.tsx:91` | P0 |
| P-13 / Q2 | Engine type mapping: blocks keep their real type (checkbox, radio, switch, label, card, table, tabs, spacer, video/map embed, lottie, navbar, cta…) + migration check for saved projects | `shared/utils/html/typeMapping.ts`, `blocks/blockRegistry.ts` | P0 for the redesign |
| — | Carousel `toHTML()` returns a void `<input>` (slides lost on export) | `typeMapping.ts:164` | P0 (export) |
| P-5 | Full-page escalations clear the selection | `StudioPanels.tsx:519` | P1 |
| P-6 | Esc in ⋯ menu and AI panel also deselects | `useClickOutside.ts`, `useColumnPanelEscape.ts` | P1 |
| P-7 | AI panel resets Inspector tab/scroll/state; scroll memory broken | `StudioPanels.tsx:878-892`, `ProInspector.tsx:268` | P1 |
| P-8 | Per-device Visibility broken at Tablet/Mobile | `useStyleHandlers.ts:243-248` | P1 |
| P-9 | `:hover` reset no-op; breakpoint Revert leaves stale export data | `engine/styles/StyleEngine.ts` | P1 |
| P-10 | Paste style replace vs merge; Duplicate ×4; multi Delete double confirm | shared commands | P1 |
| P-11 | Link type leftovers; checkbox state misread; interaction NaN; empty numeric field | §12 of proposal | P1/P2 |
| P-12 | Multi-select primary click doesn't collapse | `engine/SelectionManager.ts:30-31` | P2 |

**Done when:** every item has a test that failed before and passes after, and a live check; full suites and
`verify:ds` green.

## Phase 4 — Eng review

Run `/plan-eng-review` on this plan + the approved boards: component boundaries (one element-action registry, section
registry by true type, context-preserving escalations), migration for Q2, test strategy, rollout order.

## Phase 5 — Implement the approved Inspector

Build loop per `packages/editor/CLAUDE.md`: board → code → **board screenshot vs live screenshot at 1440×900** → fix
until they match. Tests that protect the old layout are rewritten in the same commit.

| # | Task | Decisions | Boards |
|---|---|---|---|
| I-1 | Tabs Style · Behaviour · Effects; Interactions moves to Behaviour; section order define → shape → paint | DD-1, DD-4, Q1, DD-15 | all |
| I-2 | Header: breadcrumb (new chrome-ui `Breadcrumb`), name, ✦ AI, ⋯, ✕ + shortcut, status marks | DD-8b, R-DD-8, DD-7, DD-21 | all |
| I-3 | Type block at top of Style, driven by the true type (needs P-13) incl. the 5 new ones | DD-3, Q2, Q5 | 1–16 |
| I-4 | One editor per property (remove duplicates; Rel into Link; keep Edit text; Display None stays) | DD-9, R-DD-9, DD-9b | 1–20 |
| I-5 | Remove Beginner/Pro, "Applies to" row, Whole site; add ⋯ "Apply style to all N on this page" + dialog + Undo toast | DD-5, DD-6a, DD-6b | 30, 31 |
| I-6 | ⋯ menu from the shared element-action registry | R-DD-8 | 30 |
| I-7 | Sections only where they work; one open/closed rule with summaries and "+" rows; tab reset on type change | DD-10, DD-11, DD-20 | all |
| I-8 | Context row: state chip, breakpoint chip, override dots for breakpoint / state / master (accessible) | R-DD-14 | 26–28, 32 |
| I-9 | Component row + master override marks + return from Edit master | DD-16 | 26 |
| I-10 | CMS: clickable chip, missing-source state, Open record, "+ New collection…", Open collection | R-DD-17, §17.D | 20, 24, 25 |
| I-11 | Read-only mode: locked, save conflict | DD-18, Q4 | 23, 29 |
| I-12 | Multi-select in the same panel with "Mixed" + align row | DD-12 | 22 |
| I-13 | Page panel | DD-13 | 21 |
| I-14 | Escalations keep context: Brand/Assets/Settings return to the same element, tab and scroll; SVG source in drawer pick mode | P-5, §13 | 33, 35 |
| I-15 | Field validation + accessibility spec (labels, tablist, menus on chrome-ui with keyboard, live regions, target sizes) | DD-19, DD-22, §16 | 34 |

## Phase 6 — Validation (your Phase 19)

- Every selection type × every tab in the live app; every escalation and its return path; every state board.
- Checks: correct controls appear, irrelevant ones don't, integrations still work, no capability lost, duplicates
  removed only where verified, context preserved, no dead ends, no unrelated regressions.
- Result table per item with one status: DESIGNED · IMPLEMENTED · FUNCTIONALLY VERIFIED · RUNTIME VERIFIED ·
  PARTIALLY VERIFIED · NOT VERIFIED.

## What the owner needs to do

1. Say **"go"** (per phase, or all at once).
2. Re-authenticate Figma with `/mcp` if Phase 0 reports the token is rejected.
3. Review the boards in Phase 2.

## Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Figma quota exhausted mid-build | boards half done | batched, resumable queue; stages that each land something |
| Q2 type fix changes saved projects | old sites render differently | migration check + tests on real saved projects before merge |
| Board and code drift | "done" in Figma, different in code | board-vs-live screenshot loop per board; conformance family "Inspector v4" |
| Scope creep during review | new features slip in | board spec MUST / MUST-NOT is the contract; anything new needs an owner decision |

## Not in this plan

Comment count in the Inspector (Q6, after Review ownership is fixed) · viewer read-only Inspector (Q3, collaboration
arc) · ecommerce product binding (Q7, own arc with its own plan).

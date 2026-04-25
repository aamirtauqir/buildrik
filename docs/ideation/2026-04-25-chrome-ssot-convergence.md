# Chrome SSOT Convergence — Designer Decision Required

**Status:** awaiting designer call
**Owner:** saqib (solo designer/dev)
**Date raised:** 2026-04-25
**Triggered by:** post-`/codex` orphan/dup audit. Codex flagged "Chrome width constants are duplicated and drifted away from the declared SSOT" as a refactor. Investigation showed it is a designer call, not a refactor — three of four sources disagree with DESIGN.md, and reconciling silently changes shipped UI.

---

## TL;DR

DESIGN.md defines canonical chrome dimensions. `shared/constants/layout.ts` encodes DESIGN.md correctly. **The shipped UI does not match either of them.** Two other sources — `tabsConfig.ts` (panel widths) and `LayoutShell.css` (CSS grid `:root` fallbacks) — were written before DESIGN.md was finalized and never updated. They ship pre-DESIGN.md "IA Redesign 2026" values.

Picking the SSOT is the cheap part. The expensive part is deciding **whose value wins** for each of 6 dimensions, because DESIGN.md says one thing and the live editor renders another.

---

## The Drift Matrix

| Dimension       | DESIGN.md (canon) | layout.ts | tabsConfig.ts | LayoutShell.css `:root` | Visible delta if SSOT wins |
|-----------------|-------------------|-----------|---------------|-------------------------|----------------------------|
| Rail width      | **60**            | 60 ✅     | n/a           | 48 ❌                    | rail grows +12px           |
| Sidebar (nav)   | **240**           | 240 ✅    | 280 ❌         | 280 ❌                    | nav panels shrink −40px    |
| Sidebar (auth)  | **320**           | 320 ✅    | 280 ❌         | 280 ❌                    | auth panels grow +40px     |
| Inspector       | **320**           | 320 ✅    | n/a           | 280 ❌                    | inspector grows +40px      |
| Topbar height   | **56**            | 56 ✅     | n/a           | 48 ❌                    | topbar grows +8px          |
| Footer height   | **40**            | 40 ✅     | n/a           | 32 ❌                    | footer grows +8px          |

**Internal drift inside LayoutShell.css** — the file's own ASCII diagram (line 7-13) labels topbar 52px, rail 56px. Its `:root` block declares 48/280/280/48. Its grid-template-columns fallback uses `60` for rail, `56` elsewhere. Three inconsistent values for the same dimension within one file.

`tabsConfig.ts` adds a 7th drift: every tab declares `panelWidth: 280` regardless of DESIGN.md mode (nav vs authoring). Plus a `?? 280` fallback in `getTabWidth()`. The 280 doesn't appear in DESIGN.md at all.

---

## Why this is a designer call, not a refactor

Standard "SSOT refactor" instinct: replace the literal `280` with `import { SIDEBAR_W } from "shared/constants/layout"`. **Don't.** That import is `240`, not `280`. The codebase ships `280` today. Silently flipping the import on a "cleanup" branch would:

1. Move every nav panel (Layers, Pages, Components) from 280 → 240 (−40px) without designer approval.
2. Move every authoring panel (Add, Publish, History) from 280 → 320 (+40px).
3. Reflow inspector, rail, topbar, footer simultaneously.

This is six visible UI changes ridingunder a "chore: fix SSOT drift" commit. That's a quality regression (the last 1-5% problem from `Voice` rules) hidden inside refactor packaging.

The right move is to **name the call**, surface it to the designer (the user), and let them decide the convergence path.

---

## Three Convergence Options

### Option A — DESIGN.md wins, converge now (one PR, one designer review)

Update layout.ts ✅ already correct. Update tabsConfig.ts to import from layout.ts (drops 7 hardcoded 280 + the `?? 280` fallback). Update LayoutShell.css `:root` to import from CSS custom properties bound to layout.ts via JS-injected `style` block, OR hand-edit `:root` to `60/240/320/320/56/40`.

**Pros:**
- Matches design spec everyone agreed on
- Eliminates 4-way drift, single SSOT enforced
- Frees up Week-3 PanelShell migration from this overhead

**Cons:**
- Six dimensions move at once. Visual QA pass required across all 8 sidebar tabs + topbar + inspector + footer.
- Sidebar nav shrink (280 → 240) means tighter list rows, possible truncation regressions in Layers / Pages / Components.
- Authoring sidebar grow (280 → 320) means Add panel category cards reflow.

**Effort:** human ~4-6 hr (visual QA + reflow fixes). CC ~30 min (token migration) + 60 min (QA in browser).

**Completeness: 9/10** — true SSOT, full DESIGN.md adoption.

---

### Option B — Ship-current wins, update DESIGN.md and layout.ts to match

Treat 280/280/280/48/48/32 as the as-shipped truth. Edit DESIGN.md to declare those values. Edit layout.ts SIDEBAR_W/SIDEBAR_WIDE/etc to 280. Eliminates drift from the other direction.

**Pros:**
- Zero visible UI change. Lowest risk.
- Future cleanup PRs can confidently use named imports.

**Cons:**
- Walks back DESIGN.md ("Topbar 56px — canonical. All other chrome heights flow from this rhythm" becomes "Topbar 48px — because that's what we shipped"). Loses the 8px rhythm system DESIGN.md describes.
- Sidebar nav vs authoring distinction (240 vs 320) collapses to one width (280) — DESIGN.md's "240 dense / 320 authoring" rule disappears.

**Effort:** human ~30 min. CC ~15 min.

**Completeness: 4/10** — fixes drift but abandons design intent. Treating shipped state as authoritative when it pre-dates the spec it should follow.

---

### Option C — Phased convergence (3 stages, one dimension cluster per stage)

Stage 1 — vertical (topbar 48→56, footer 32→40). +16px total vertical. Affects every page header layout but is contained.

Stage 2 — horizontal sidebar (drawer 280 → 240 nav / 320 authoring). Splits one shipped value into two per-mode values. Riskiest stage. Requires per-tab QA.

Stage 3 — horizontal rail + inspector (rail 48→60, inspector 280→320). +52px horizontal. Canvas shrinks by 52px combined.

Each stage = its own commit, its own visual QA, its own designer signoff before next stage starts. Layout.ts and DESIGN.md stay unchanged (they're already correct). LayoutShell.css and tabsConfig converge incrementally.

**Pros:**
- Smallest reversible chunk per commit. Bisectable if a regression lands.
- Lets designer compare A/B in real product after each stage.
- Stage 1 (vertical) is mostly safe; can ship it as a confidence-builder before committing to the bigger horizontal moves.

**Cons:**
- Drift state lives longer (3 commits worth).
- Discipline cost — must not skip QA between stages. The Iron Rule from systematic-debugging applies: no Stage 2 until Stage 1 is verified clean.

**Effort:** human ~6-8 hr split across 3 sessions. CC ~30 min × 3 stages.

**Completeness: 10/10** — same end state as A but with rollback granularity.

---

## RECOMMENDATION

**Choose Option C.** Reason: six simultaneous chrome moves is the kind of change that surfaces a regression somewhere unrelated 48 hours later (some tab's content was sized for the 280 width). Phasing isolates cause. Stage 1 (vertical only) is genuinely low risk and tests the convergence machinery without horizontal reflow. If Stage 1 ships clean, Stage 2 is much higher confidence.

If timeline pressure is the constraint, Option A is the right answer — one big PR, one big QA pass, done. Don't pick A unless you have an uninterrupted afternoon for visual QA across all 8 sidebar tabs.

Don't pick B. It permanently loses the 8px rhythm DESIGN.md is built on.

---

## Decision questions for the designer

1. **Convergence target:** is DESIGN.md still the canonical spec? (If yes → A or C. If no → revise DESIGN.md first.)
2. **Schedule:** Option A (one big PR) vs Option C (3 phased) vs explicit "park this until Week-3 PanelShell"?
3. **If A or C — Stage 1 first:** topbar 48→56, footer 32→40. OK to ship as separate commit with browser QA?

## Out-of-scope for this doc

- DESIGN.md `Never 40px` row rule — separate audit needed against existing row heights. This doc is chrome-frame only.
- Sidebar `Fullpage` mode (Templates, Media, Settings, Design) — `tabsConfig` has one panel at 700px. DESIGN.md doesn't pin a fullpage width. Probably correct as-is but worth a mention.
- Panel-internal heights (`HEADER_H 44`, `TOOLBAR_H 36`, `FOOTER_H 40`) — layout.ts and DESIGN.md agree, no drift to resolve.

---

## Files involved (when Option A or C executes)

- `packages/editor/src/shared/constants/layout.ts` — already correct, no edit
- `packages/editor/DESIGN.md` — already correct, no edit (Option A/C). Edit only under Option B.
- `packages/editor/src/editor/rail/LayoutShell.css` — `:root` block + grid-template fallbacks + ASCII diagram comment
- `packages/editor/src/editor/rail/tabsConfig.ts` — 7 `panelWidth: 280` declarations + `?? 280` fallback in `getTabWidth()`
- `packages/editor/src/themes/default.css` — currently has no layout vars; option A may add `--bd-rail-w` etc bound to layout.ts values for cross-component reuse

# Bar Consistency Audit — Design

**Date:** 2026-04-20
**Status:** Design — pending user approval
**Scope:** Read-only audit of editor chrome (topbar, left rail + sidebar, right inspector)
**Related:**
- DS V1 remediation: `docs/superpowers/specs/2026-04-20-ds-v1-remediation-design.md`
- Design contract: `DESIGN.md`
- Prior audits: `docs/superpowers/audits/2026-04-19-buildrik-design-system-v1-codex-reviews.md`, `docs/superpowers/audits/2026-04-19-theme-unification-v3-audit.md`

## 1. Context

DS V1 tokens are shipped and locked (2026-04-19, remediation arc 2026-04-20). The hex gate baseline is 1498 sites across the editor; ESLint DS rule baseline is 1033 violations. Both run in WARN mode with CI wired.

These baselines are **global** — they tell us the editor has 1498 hex sites, not which bar owns which slice. User-reported pain is twofold:

- **Visual drift**: topbar, left sidebar, right inspector don't feel like one system.
- **DX pain**: adding a new tab/panel requires composing header/toolbar/content/footer from scratch every time.

Per prior failure modes (V1 + V2 theme specs killed by Codex — see `feedback_inventory_before_architecture.md`), jumping to primitive extraction without per-bar data will blow up the same way. This audit produces the data.

## 2. Goal

Produce a ranked decision: **which single bar to refactor first, and which primitive to extract first within that bar**, backed by per-bar numbers.

Success = a markdown report that, read alone, lets the user pick the next refactor without re-exploring the codebase.

## 3. Non-Goals

- No code changes. No new primitives. No `themes/` edits. No `DESIGN.md` edits.
- Not a replacement for the hex gate / ESLint gate. Those run globally and are already baselined. This audit slices them per-bar.
- Not a visual regression suite. No screenshots, no pixel diff.
- Not a DESIGN.md compliance audit across the whole editor — only the three bars.
- Not the marketing site, canvas, engine, or `components/` (legacy) folder.
- No recommendation to build a "parallel design system." Tokens are locked; work is primitive extraction on top.

## 4. Scope

Three source trees, read-only:

| Bar | Paths |
|---|---|
| **Topbar** | `src/editor/shell/**/*.{tsx,ts,css}` |
| **Left** | `src/editor/rail/**/*.{tsx,ts,css}` + `src/editor/sidebar/**/*.{tsx,ts,css}` |
| **Right** | `src/editor/inspector/**/*.{tsx,ts,css}` |

Excluded: `src/engine/`, `src/shared/`, `src/components/`, `src/features/`, `src/themes/`, `src/blocks/`, `src/templates/`, `demo/`, `__tests__/`.

## 5. Dimensions Measured

Six dimensions, per bar. Each is a count + a file:line evidence list (top 10 per bar per dimension, not exhaustive).

| # | Dimension | Measurement | Source of truth violated |
|---|---|---|---|
| 1 | **Hex literals** | Count of `#[0-9a-fA-F]{3,8}` outside comments in the three scopes. Sliced by `.tsx` vs `.css`. | `DESIGN.md` color tokens; DS V1 hex gate baseline |
| 2 | **Hardcoded px** | Count of literal px values in CSS/Emotion, excluding `1px` borders and `0px`. | `DESIGN.md` spacing scale (2/4/8/12/16/24/32/48/64) |
| 3 | **Font-family declarations** | Any `font-family:` or `fontFamily:` outside `src/themes/`. Should be 0. | `DESIGN.md` typography — tokens only |
| 4 | **Inline `style={{}}`** | Count + classification: `runtime-computed` (drag positions, transforms) vs `static` (hardcoded colors/spacing). | Project rule: inline allowed only for runtime-computed values |
| 5 | **Header heights** | Actual px value assigned to each bar's primary header element. Expected per `DESIGN.md:123-126`: topbar 56, sidebar panel header 44. Inspector header height is not specified in `DESIGN.md` — the measured value becomes the de-facto contract, and the mismatch (or silence) is itself a finding. | `DESIGN.md:123-126` layout contract |
| 6 | **Primitive duplication** | For each repeated layout pattern across bars (e.g. "icon + label + chevron row", "search + filter chips", "sticky footer with count + actions"), count occurrences and list file:line. | None — this is the signal for what to extract |

Dimension 6 is the DX-pain signal. Dimensions 1-5 are the visual-drift signal.

## 6. Deliverable

Single markdown file at `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`. Structure:

```
# Bar Consistency Audit — 2026-04-20

## 1. Summary scoreboard
    Table: bar × 6 dimensions × count. One glance tells you which bar is worst.

## 2. Per-bar findings
    ### 2.1 Topbar
        - Dimension 1 count + top-10 file:line evidence
        - Dimension 2 count + top-10 file:line evidence
        - ... all 6 dimensions
    ### 2.2 Left sidebar + rail
    ### 2.3 Right inspector

## 3. Primitive duplication ranking
    Top 10 duplicated layout patterns, ranked by (occurrences × bars-spanned).
    For each: pattern name, example file:line, count, bars present.

## 4. Recommendation
    - Which bar to refactor first (1 paragraph with reasoning tied to scoreboard numbers)
    - Which primitive to extract first within that bar (1 paragraph)
    - Explicit: what NOT to touch yet

## 5. Methodology
    - Exact grep patterns used (so Codex can reproduce + verify)
    - Known blind spots (dynamic hex strings, computed styles, etc.)
```

No prose filler. Tables + file:line refs + one-paragraph recommendation per section.

## 7. Methodology

Primary tool: `ripgrep` via the Grep tool, one scope at a time. Patterns documented inline in the deliverable so Codex can replay.

Hex: `#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b` — exclude `//` and `/* */` comment lines post-hoc.

Px: `\b\d{1,4}px\b` — exclude `\b[01]px\b` (border widths).

Font-family: `font-family\s*:|fontFamily\s*:`

Inline style: `style=\{\{` — for each hit, read ±3 lines and classify by whether the values inside are literals or expressions referencing state/props.

Primitive duplication: manual identification by reading the top-level JSX of each tab/panel/section. Group by structural shape (not component name). This is the one dimension that can't be pure grep.

## 8. Known Blind Spots

Listed in deliverable Section 5 so Codex sees them:

- Dynamic hex via template literals (`` `#${hex}` ``) — won't match the grep.
- Hex inside JS strings passed to canvas APIs — won't match simple hex grep if embedded in larger literals.
- Emotion `styled()` calls where values come from `props` — static analysis can't tell without type-flow.
- Computed inline styles (`style={{ top: dragY }}`) are runtime-computed and should NOT count as violations — classification requires reading surrounding code.
- CSS variables that indirectly resolve to hex (e.g. `var(--legacy-token)` where `--legacy-token: #xxx`) — out of scope here, covered by DS V1 remediation.

## 9. Codex Gate

After the audit markdown is drafted, run `/codex` review on it. Codex looks for:

1. Missed file paths (did we actually scan everything under the three trees?)
2. False zeros (did any dimension come back 0 because the grep pattern was wrong?)
3. Miscategorization in dimension 4 (inline styles marked static when they're runtime-computed, or vice versa)
4. Primitive duplication patterns missed (dimension 6 is judgment-heavy)
5. Recommendation not supported by the numbers in the scoreboard

Iterate until Codex passes. Only then move to the next brainstorm (which primitive to extract, per the recommendation).

Per `feedback_ssot_verification.md`: do not treat the first draft's counts as canonical. Spot-check 3 random file:line references per dimension before committing.

## 10. Execution Shape

Audit is a one-session task. Estimated effort:

- Grep passes (dimensions 1-4): ~30 min
- Header heights (dimension 5): ~15 min
- Primitive duplication read-through (dimension 6): ~60 min
- Write-up: ~30 min
- Codex review + spot-check + iterate: ~30-60 min

Total: ~3-4 hours. Single commit to `main` (solo workflow, per `feedback_solo_workflow.md`). Commit message: `audit(bars): per-bar consistency + primitive duplication breakdown`.

## 11. Exit Criteria

Audit is done when:

1. Markdown file committed at `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`
2. Codex review returns clean (no blockers)
3. 3 random spot-checks per dimension confirm grep results
4. Recommendation section names one bar + one primitive, with reasoning

Output of this audit is **input to the next brainstorm**, not a license to start coding.

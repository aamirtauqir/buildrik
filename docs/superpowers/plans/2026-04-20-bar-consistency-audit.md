# Bar Consistency Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a per-bar consistency + primitive duplication audit markdown that tells us which editor bar to refactor first and which primitive to extract first.

**Architecture:** Read-only. Grep-driven for dimensions 1-4, manual read-through for dimensions 5-6. Build the audit markdown incrementally in one working file; single commit at the end after Codex gate passes. No TDD — this is a data-gathering task, not code.

**Tech Stack:** `ripgrep` via Grep tool, Read tool for file inspection, git for the final commit. No new dependencies, no runtime execution.

**Spec:** `docs/superpowers/specs/2026-04-20-bar-consistency-audit-design.md`

---

## File Structure

**Create:**
- `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` — the audit deliverable

**Modify:** none
**Delete:** none

Scope directories (read-only):
- `packages/editor/src/editor/shell/` — topbar
- `packages/editor/src/editor/rail/` + `packages/editor/src/editor/sidebar/` — left
- `packages/editor/src/editor/inspector/` — right

---

## Task 1: Scaffold the audit markdown

**Files:**
- Create: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`

- [ ] **Step 1: Create the file with the full heading skeleton**

Write to `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`:

```markdown
# Bar Consistency Audit — 2026-04-20

**Spec:** `docs/superpowers/specs/2026-04-20-bar-consistency-audit-design.md`
**Scope:** `packages/editor/src/editor/{shell,rail,sidebar,inspector}/`
**Method:** Read-only ripgrep + manual read-through. See Section 5 for grep patterns.

## 1. Summary Scoreboard

| Bar | Hex (.tsx) | Hex (.css) | Px literals | font-family | Inline style (static) | Inline style (runtime) | Header height | Primitive dup count |
|---|---|---|---|---|---|---|---|---|
| Topbar | _ | _ | _ | _ | _ | _ | _ | _ |
| Left (rail+sidebar) | _ | _ | _ | _ | _ | _ | _ | _ |
| Right (inspector) | _ | _ | _ | _ | _ | _ | _ | _ |

## 2. Per-Bar Findings

### 2.1 Topbar (`packages/editor/src/editor/shell/`)

### 2.2 Left — Rail + Sidebar (`packages/editor/src/editor/rail/`, `packages/editor/src/editor/sidebar/`)

### 2.3 Right — Inspector (`packages/editor/src/editor/inspector/`)

## 3. Primitive Duplication Ranking

## 4. Recommendation

## 5. Methodology

### Grep patterns

### Known blind spots

### Spot-check log

```

- [ ] **Step 2: Verify file exists and is readable**

Run: `wc -l docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`
Expected: ~25-30 lines (skeleton only).

- [ ] **Step 3: Do not commit yet.** File stays uncommitted until Task 11.

---

## Task 2: Dimension 1 — Hex literals, all three bars

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (fill dimension 1 rows of scoreboard + per-bar evidence)

- [ ] **Step 1: Count hex literals in topbar .tsx files**

Use the Grep tool with:
- pattern: `#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b`
- path: `packages/editor/src/editor/shell`
- glob: `*.tsx`
- output_mode: `count`

Record total count. Then re-run with output_mode=`content`, head_limit=10, to get top-10 file:line evidence.

- [ ] **Step 2: Count hex literals in topbar .css files**

Same Grep, glob: `*.css`. Record count + top-10 evidence.

- [ ] **Step 3: Repeat for left (rail + sidebar)**

Run two Grep passes (one for `packages/editor/src/editor/rail`, one for `packages/editor/src/editor/sidebar`), for both `*.tsx` and `*.css`. Sum the rail+sidebar counts into a single "Left" row.

Record total tsx count, total css count, and a merged top-10 evidence list (pick the 10 with most hex density, not round-robin).

- [ ] **Step 4: Repeat for right (inspector)**

Grep `packages/editor/src/editor/inspector` for `*.tsx` and `*.css`. Record count + top-10 evidence.

- [ ] **Step 5: Filter out comment-line false positives**

For each of the 6 count buckets (3 bars × {tsx, css}), read the first 3 evidence rows from the content Grep output. If any row's matched text sits inside `// ...`, `/* ... */`, or `* ` (JSDoc continuation), flag it and adjust the count downward by inspecting the file.

Keep a running "comment exclusions: N" note per bar in the audit file so the methodology is traceable.

- [ ] **Step 6: Write results into the audit markdown**

Fill the two hex columns (tsx / css) of the scoreboard in Section 1.

Under each per-bar subsection (2.1, 2.2, 2.3), add:

```markdown
**Dimension 1 — Hex literals**
- `.tsx` count: N (comment exclusions: X)
- `.css` count: M (comment exclusions: Y)
- Top evidence:
  - `path/to/file.tsx:123` — `#1F2937` (static color literal)
  - `path/to/file.css:45` — `#E2E8F0` (should be `var(--buildrick-border)`)
  - ... up to 10 rows
```

- [ ] **Step 7: Do not commit yet.**

---

## Task 3: Dimension 2 — Hardcoded px literals, all three bars

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (fill dimension 2)

- [ ] **Step 1: Grep px in topbar**

Grep tool:
- pattern: `\b\d{1,4}px\b`
- path: `packages/editor/src/editor/shell`
- glob: `*.{tsx,ts,css}`
- output_mode: `count`

Record total. Re-run with content, head_limit=30 (higher because px is noisy), then filter post-hoc.

- [ ] **Step 2: Filter out allowed px**

Exclude matches where the surrounding text is:
- `0px`, `1px`, `-1px`, `2px` (borders, hairlines)
- Inside a `url(...)` / comment / import path / test fixture

Document the filter list in Section 5 "Grep patterns" so counts are reproducible.

- [ ] **Step 3: Repeat for left (rail + sidebar) and right (inspector)**

Same grep pattern, same filter. Record per-bar counts and top-10 evidence each.

- [ ] **Step 4: Write results into the audit markdown**

Fill the px column of the scoreboard. Under each per-bar subsection, add:

```markdown
**Dimension 2 — Hardcoded px**
- Count (post-filter): N
- Top evidence:
  - `path/to/file.tsx:123` — `height: 48px` (should be `var(--buildrick-space-48)` or tokenized)
  - `path/to/file.css:45` — `padding: 20px 14px` (non-scale values — double violation)
  - ... up to 10 rows
```

- [ ] **Step 5: Do not commit yet.**

---

## Task 4: Dimension 3 — font-family declarations outside themes/

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (fill dimension 3)

- [ ] **Step 1: Grep font-family in all three bars**

Grep tool, run 3 times (one per bar scope):
- pattern: `font-family\s*:|fontFamily\s*:`
- globs: `*.{tsx,ts,css}`
- output_mode: `content`, head_limit: `50`

Expected per DESIGN.md: 0 hits in each bar. Any hit = finding.

- [ ] **Step 2: For each hit, classify**

For every hit, note whether it's:
- A reference to a CSS variable (`var(--...)`) — acceptable, don't count
- A literal font name (e.g. `"Inter"`, `"system-ui"`) — count as violation

- [ ] **Step 3: Write results into the audit markdown**

Fill the font-family column of the scoreboard (expected: 0 / 0 / 0; any non-zero is the headline).

Under each per-bar subsection, add:

```markdown
**Dimension 3 — font-family declarations**
- Count: N (0 expected)
- Violations: [list all, with file:line and the literal font string]
```

- [ ] **Step 4: Do not commit yet.**

---

## Task 5: Dimension 4 — Inline `style={{}}` + static/runtime classification

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (fill dimension 4)

- [ ] **Step 1: Grep inline style in all three bars**

Grep tool, run 3 times:
- pattern: `style=\{\{`
- globs: `*.{tsx,ts}`
- output_mode: `content`, `-C`: `3`, head_limit: `40`

- [ ] **Step 2: Classify each hit**

For each match, read the ±3 lines of context. Classify as:
- **runtime-computed**: the values inside `{{ }}` reference state, props, refs, or hooks (e.g. `{{ top: dragY }}`, `{{ width: \`${n}px\` }}`, `{{ transform: \`translate(${x}px, ${y}px)\` }}`) — NOT a violation
- **static**: the values are literal strings/numbers (e.g. `{{ color: "#333", padding: "8px" }}`) — violation, should move to Emotion/tokens

- [ ] **Step 3: Record two counts per bar**

Record:
- Inline style (static) count
- Inline style (runtime) count — informational only, not a violation

For top-10 static evidence:

```markdown
- `path/to/file.tsx:123` — `{{ color: "#334155", padding: "8px" }}` (static, should tokenize)
```

- [ ] **Step 4: Write results into the audit markdown**

Fill both inline-style columns of the scoreboard. Per-bar section:

```markdown
**Dimension 4 — Inline style**
- Static (violation): N
- Runtime-computed (OK): M
- Top static violations:
  - ...
```

- [ ] **Step 5: Do not commit yet.**

---

## Task 6: Dimension 5 — Header heights

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (fill dimension 5)

- [ ] **Step 1: Identify header elements per bar**

Read the following known entry files to locate each bar's primary header element:
- Topbar: `packages/editor/src/editor/shell/Topbar.tsx` + `packages/editor/src/editor/shell/StudioHeader.tsx`
- Left sidebar panel: `packages/editor/src/editor/sidebar/shared/PanelHeader.tsx`
- Inspector: `packages/editor/src/editor/inspector/ProInspector.tsx` + `packages/editor/src/editor/inspector/components/` (look for a header or toolbar component)

For each, find the element that renders the bar's top strip (class names often include `Header`, `Topbar`, `-bar`, `-header`, `-top`).

- [ ] **Step 2: Extract the actual px height**

For each header, search its CSS / Emotion `styled()` definition for `height:` or `min-height:`. Record:
- Topbar: actual px
- Sidebar panel header: actual px
- Inspector header: actual px

If a header uses a CSS variable, trace the variable one hop to its defined value in `themes/design-system/layout.css` (one-hop lookup is allowed; this isn't a full SSOT trace).

- [ ] **Step 3: Compare to DESIGN.md contract**

DESIGN.md:123-126 says: topbar 56, sidebar panel header 44. Inspector is not specified.

Mark each as: ✓ matches contract, ✗ violates (with delta), or ○ (no contract — record actual).

- [ ] **Step 4: Write results**

Fill the header-height column of the scoreboard. Per-bar section:

```markdown
**Dimension 5 — Header height**
- Actual: 56px at `shell/Topbar.tsx:42` (`.tbRoot { height: 56px; }`)
- Contract: 56px per DESIGN.md:123
- Status: ✓ matches
```

- [ ] **Step 5: Do not commit yet.**

---

## Task 7: Dimension 6 — Primitive duplication read-through

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (fill dimension 6 + Section 3 ranking)

- [ ] **Step 1: List the composition surfaces per bar**

- Topbar: identify the top-level components rendering visible topbar zones (e.g. `StudioHeader`, `PageTabBar`, `PublishDropdown`, `AccountModal` trigger area, `BreakpointDropdown`, `StatusIndicators`).
- Left: list the 8 sidebar tab roots under `packages/editor/src/editor/sidebar/tabs/`. Plus the rail (`rail/LayoutShell.tsx`).
- Right: list the inspector's top-level tab content under `packages/editor/src/editor/inspector/tabs/` and major sections under `packages/editor/src/editor/inspector/sections/`.

Make a complete surface inventory (list them in the audit file under Section 3 as "surfaces scanned").

- [ ] **Step 2: Read the top-level JSX of each surface**

For each surface, open the file and scan only the top-level return/JSX tree (don't read into child component internals). Identify the structural pattern at that level:
- Does it render `Header + Content`?
- Does it render `Header + Toolbar + Content + Footer`?
- Does it render `Grid of cards`?
- Does it render `List of rows`?
- Does it render a composition that looks like "icon + label + chevron + action"?

Write each pattern in one line: `<pattern name> :: surface file path`.

- [ ] **Step 3: Cluster by structural shape**

Group the lines into pattern buckets. A pattern bucket with ≥3 occurrences across the three bars is a duplication candidate.

Write up each candidate:

```markdown
**Pattern: "Header + Toolbar (search + action) + scrollable content"**
- Occurrences: 8 (all 8 sidebar tabs)
- Bars present: Left only
- Evidence:
  - `sidebar/tabs/layers/LayersTab.tsx:34-72`
  - `sidebar/tabs/pages/PagesTab.tsx:28-66`
  - ... all 8
- Extraction cost: one `PanelShell` composite (matches DESIGN.md spec)
```

- [ ] **Step 4: Rank the candidates**

Rank by (occurrences × bars-spanned). Higher = higher leverage to extract. Record top 10 in Section 3 of the audit file.

- [ ] **Step 5: Fill scoreboard dim-6 column**

"Primitive dup count" per bar = number of this bar's surfaces that participate in ≥3-occurrence patterns. Fill the scoreboard.

- [ ] **Step 6: Do not commit yet.**

---

## Task 8: Write summary + recommendation

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (Section 4)

- [ ] **Step 1: Pick the "worst bar"**

Read the summary scoreboard. Define "worst" as: highest sum across the 6 violation dimensions (excluding the runtime-computed inline-style column, which is informational).

Write 1 paragraph under Section 4 naming the worst bar and quoting 3 specific numbers from the scoreboard as justification.

- [ ] **Step 2: Pick the "first primitive"**

From the top 3 primitives in Section 3's ranking, pick one that is:
- Highest leverage (occurrences × bars)
- Fully inside the "worst bar" picked in Step 1, OR spans it

Write 1 paragraph naming the primitive, listing the surfaces it would collapse, and a rough size estimate (how many lines of duplicate JSX it would eliminate, based on the evidence file:line ranges).

- [ ] **Step 3: Write the "do not touch yet" list**

Explicit list of things the next refactor should NOT include:
- The other two bars
- Token changes (DS V1 is locked)
- DESIGN.md changes
- Any primitive outside the top-1 pick
- `components/` legacy folder
- `shared/ui/` primitives

- [ ] **Step 4: Do not commit yet.**

---

## Task 9: Spot-check 3 random evidence rows per dimension

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (Section 5.3 "Spot-check log")

- [ ] **Step 1: Pick 3 random evidence rows from each of the 6 dimensions (18 total)**

For each picked row, use the Read tool to open the exact file:line. Verify:
- The match actually exists
- The classification is correct (e.g. a "static" inline style isn't actually receiving a variable from props)

- [ ] **Step 2: Record the check in the spot-check log**

```markdown
### Spot-check log (18 checks, 3 per dimension)

| # | Dimension | Evidence row | Verified? | Notes |
|---|---|---|---|---|
| 1 | Hex (.tsx) | `shell/Topbar.tsx:123` | ✓ | Confirmed literal `#1F2937` |
| 2 | Hex (.tsx) | `sidebar/LeftSidebar.tsx:45` | ✗ | Actually inside a `/* */` comment — count decremented by 1 |
...
```

- [ ] **Step 3: If any ✗ appears, adjust the bar's scoreboard count**

Scoreboard numbers must reflect the post-spot-check correction. Note the adjustment inline in the scoreboard:

`Hex (.tsx): 34 (adjusted from 35 after spot-check)`

- [ ] **Step 4: Do not commit yet.**

---

## Task 10: Codex review gate

**Files:**
- Modify: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md` (only if Codex flags issues)

- [ ] **Step 1: Run /codex on the audit file**

Invoke: `/codex review docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`

Prompt Codex to check for:
1. Missed file paths (were all files under the three scopes actually covered?)
2. False zeros in any dimension (did any count come back 0 because the grep pattern was too narrow?)
3. Miscategorization in dimension 4 (inline style static vs runtime)
4. Primitive duplication patterns missed in dimension 6
5. Recommendation not supported by scoreboard numbers

- [ ] **Step 2: Iterate until clean**

For each Codex finding:
- If it's a real miss → update the relevant dimension, re-run spot-check for the affected rows, update scoreboard
- If it's a false positive → document the reasoning inline in Section 5 "Known blind spots" and move on

Re-invoke `/codex` after edits. Continue until Codex returns clean (no blocker-level findings).

- [ ] **Step 3: Record the Codex pass**

Add to Section 5 (Methodology) at the bottom:

```markdown
### Codex gate status

- Run 1: N findings (list) → addressed by edits at lines X, Y, Z
- Run 2: 0 blocker findings → PASS
```

- [ ] **Step 4: Do not commit yet.**

---

## Task 11: Final commit

**Files:**
- Commit: `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`

- [ ] **Step 1: Sanity-check the file**

Run: `wc -l docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`
Expected: several hundred lines (scoreboard + per-bar + primitive ranking + recommendation + methodology).

Run: `grep -c "^## " docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`
Expected: 5 top-level sections (Summary, Per-Bar, Primitive Ranking, Recommendation, Methodology).

- [ ] **Step 2: Verify recommendation is present and concrete**

Run (via Read tool): open Section 4 of the audit. Confirm it names **one** bar and **one** primitive. If vague, stop — return to Task 8.

- [ ] **Step 3: Stage and commit**

```bash
git add docs/superpowers/audits/2026-04-20-bar-consistency-audit.md
git commit -m "audit(bars): per-bar consistency + primitive duplication breakdown"
```

- [ ] **Step 4: Verify commit**

Run: `git log -1 --stat`
Expected: one file changed, the audit markdown, hundreds of insertions.

- [ ] **Step 5: Done.**

Next step (out of scope for this plan): brainstorm the primitive extraction using the audit's recommendation as input.

---

## Exit Criteria (from spec Section 11)

1. ✅ Markdown file committed at `docs/superpowers/audits/2026-04-20-bar-consistency-audit.md`
2. ✅ Codex review returns clean (Task 10)
3. ✅ 18 spot-checks (3 per dimension) confirm grep results (Task 9)
4. ✅ Recommendation section names one bar + one primitive with reasoning (Task 8)

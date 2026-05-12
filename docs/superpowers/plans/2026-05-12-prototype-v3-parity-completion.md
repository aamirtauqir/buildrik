# prototype-v3 Parity Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 3 known parity gaps (§4 templates replace modal, §11 media snap-back selection, §12 media expanded mode on upload) and produce a formal 22-section parity audit doc covering all of prototype-v3.

**Architecture:** Two-phase audit-then-build. Phase A: deep-dive triage on the 3 unverified sections (§4/§11/§12) — grep, screenshot, classify ship/gap/build, then implement gaps. Phase B: lightweight parity sweep over the remaining 19 sections (most already have shipped components — confirm parity, log drift, no new code unless trivial).

**Reference:** `~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html` (2632 LOC, 22 numbered sections).

**Tech Stack:** React 18 + TypeScript + Emotion + vibcoder primitives. Playwright via /browse skill for live screenshots. Vitest if test updates needed.

---

## File Structure

**Reference (read-only):**
- `~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html` — 22-section design
- `docs/superpowers/audits/2026-05-11-templates-media-shell-parity.md` — prior focused audit (S1/S2/S10)

**Modify (potentially, per triage findings):**
- `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx` — §4 replace modal
- `packages/editor/src/editor/sidebar/tabs/media/MediaTab.tsx` — §11 snap-back, §12 expanded mode
- `packages/editor/src/editor/sidebar/tabs/media/components/SlimLauncher.tsx` — §12 mode flip on upload
- `packages/editor/src/editor/rail/tabsConfig.ts` — §12 panelWidth override (if needed)

**Create:**
- `docs/superpowers/audits/2026-05-12-prototype-v3-full-parity.md` — 22-section parity verdict

---

## Task 1: Phase A — Triage §4 Templates replace modal

**Files:**
- Reference: `prototype-v3.html` §4 (line range ~grep "4\. Templates")
- Inspect: `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx`
- Inspect: `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTab.tsx`

- [ ] **Step 1: Extract prototype-v3 §4 reference**

```bash
grep -n "4\. Templates — replace modal" ~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html
```

Read 100 lines starting from that match. Capture: visual structure (modal width, header, body content, CTAs), trigger surface (where user clicks to invoke), and copy strings.

- [ ] **Step 2: Grep editor code for replace flow**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -rln "replace\|Replace" packages/editor/src/editor/sidebar/tabs/templates --include="*.tsx" --include="*.ts"
grep -n "ReplaceModal\|replaceModal\|replace.*template" packages/editor/src/editor/sidebar/tabs/templates/*.tsx
```

- [ ] **Step 3: Classify**

Three buckets — write to Phase A scratch findings:
- **ship:** code exists, matches prototype within tolerance
- **gap:** code exists, drifts from prototype (spec deltas to fix)
- **build:** code does not exist (full implementation needed)

- [ ] **Step 4: Commit findings (no code yet)**

```bash
git add docs/superpowers/plans/2026-05-12-prototype-v3-parity-completion.md
git commit -m "plan(prototype-v3-parity): §4 triage findings"
```

---

## Task 2: Phase A — Triage §11 Media snap-back selection

**Files:**
- Reference: `prototype-v3.html` §11
- Inspect: `packages/editor/src/editor/sidebar/tabs/media/MediaTab.tsx`
- Inspect: `packages/editor/src/editor/sidebar/tabs/media/components/SelectionBanner.tsx`

- [ ] **Step 1: Extract prototype §11 reference**

```bash
grep -n "11\. Media — selection context" ~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html
```

Read 100 lines from match. Capture snap-back behavior: when user opens media tab from an element-image binding context, does the tab return user to the element after selection?

- [ ] **Step 2: Grep editor for snap-back / selection-context**

```bash
grep -rln "snap.back\|snapBack\|returnTo\|fromElement\|element.context\|bindingContext" packages/editor/src/editor/sidebar/tabs/media packages/editor/src/editor/inspector --include="*.tsx" --include="*.ts"
```

Check if MediaTab consumes an `onSelected(asset)` callback from inspector that mutates element src and closes the tab.

- [ ] **Step 3: Classify (ship/gap/build)**

Document findings inline in plan doc.

- [ ] **Step 4: Commit findings**

```bash
git add docs/superpowers/plans/2026-05-12-prototype-v3-parity-completion.md
git commit -m "plan(prototype-v3-parity): §11 triage findings"
```

---

## Task 3: Phase A — Triage §12 Media expanded 560px on upload

**Files:**
- Reference: `prototype-v3.html` §12
- Inspect: `packages/editor/src/editor/sidebar/tabs/media/MediaTab.tsx`
- Inspect: `packages/editor/src/editor/sidebar/tabs/media/components/SlimLauncher.tsx`
- Inspect: `packages/editor/src/editor/rail/tabsConfig.ts`

- [ ] **Step 1: Extract prototype §12 reference**

```bash
grep -n "12\. Media — expanded mode" ~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html
```

Read 100 lines. Capture: 320px → 560px width transition on upload, what triggers it, what reverts it.

- [ ] **Step 2: Grep editor for 560px / expanded-mode**

```bash
grep -rln "560\|expanded\|expand.*mode" packages/editor/src/editor/sidebar/tabs/media packages/editor/src/editor/rail --include="*.tsx" --include="*.ts" --include="*.css"
```

Confirm current state: tabsConfig.ts assets `panelWidth` is 280/320. No 560px override anywhere.

- [ ] **Step 3: Classify (ship/gap/build)**

Likely **build** — current architecture only supports a single `panelWidth` per tab. Decide implementation pattern: dynamic width via state, or full mode switch (panel→fullpage at 560 cap).

- [ ] **Step 4: Commit findings**

```bash
git add docs/superpowers/plans/2026-05-12-prototype-v3-parity-completion.md
git commit -m "plan(prototype-v3-parity): §12 triage findings"
```

---

## Task 4: Phase A — Build gaps from triage

**Files (depends on triage results):**
- Likely modify: `packages/editor/src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx`
- Likely modify: `packages/editor/src/editor/sidebar/tabs/media/MediaTab.tsx`
- Likely modify: `packages/editor/src/editor/sidebar/tabs/media/components/SlimLauncher.tsx`

For each gap classified `build` or `gap` in Tasks 1-3:

- [ ] **Step 1: Write failing test (if behavior is testable)**

For UI-only drift, screenshot diff is the test. For behavior (snap-back callback), write a vitest:

```ts
// __tests__/MediaTab.snap-back.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MediaTab } from "../MediaTab";

test("snap-back: onSelected callback fires + tab closes when bound to element", () => {
  const onSelected = vi.fn();
  const onClose = vi.fn();
  render(<MediaTab bindingContext={{ elementId: "el-1" }} onSelected={onSelected} onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: /asset-1/i }));
  expect(onSelected).toHaveBeenCalledWith(expect.objectContaining({ id: "asset-1" }));
  expect(onClose).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test (verify FAIL)**

```bash
cd packages/editor && npx vitest run __tests__/MediaTab.snap-back.test.tsx
```

Expected: FAIL — missing prop / callback never fires.

- [ ] **Step 3: Implement minimal change**

Code-per-gap (specific edits depend on Task 1-3 findings; do not pre-fabricate).

- [ ] **Step 4: Run test (verify PASS)**

- [ ] **Step 5: Browser-verify (/browse skill)**

Visit `http://localhost:5050`, exercise gap path, screenshot before/after.

- [ ] **Step 6: Commit per gap**

```bash
git add packages/editor/src/...
git commit -m "feat(prototype-v3-parity): close §<N> <surface> gap"
```

---

## Task 5: Phase B — Full 22-section parity sweep

**Files:**
- Reference: `prototype-v3.html` (all 22 sections)
- Inspect: every file under `packages/editor/src/editor/sidebar/tabs/templates/`, `packages/editor/src/editor/sidebar/tabs/media/`, `packages/editor/src/editor/media/`

For each of the 22 sections (§1–§22):

- [ ] **Step 1: Extract prototype reference**

```bash
grep -n "^\s*<h2 class=\"section-title\">N\." ~/.gstack/projects/aamirtauqir-buildrik/designs/sidebar-templates-media-engine-20260507/prototype-v3.html
```

Read 60-100 lines from match.

- [ ] **Step 2: Locate live surface**

Use the file mapping established in conversation:
- §1 → `TemplatesTab.tsx` default state
- §2 → `TemplateDetail.tsx`
- §3 → `TemplatePreviewModal.tsx`
- §4 → `TemplatesTabModals.tsx` replace flow
- §5 → `UpgradeGate` ref in `TemplatesTabModals.tsx`
- §6 → "Add as New Page" CTA in `TemplateDetail.tsx`
- §7 → search in `TemplatesTab.tsx`
- §8 → `ApplyProgressOverlay.tsx`
- §9 → `TemplateUsageDrawer.tsx`
- §10 → `SlimLauncher.tsx`
- §11 → `MediaTab.tsx` selection context
- §12 → `MediaTab.tsx` + `SlimLauncher.tsx` expanded mode
- §13 → folder mirror in `LibraryView.tsx` / `LibraryManager.tsx`
- §14 → `SelectionBanner.tsx`
- §15 → `AssetDetailOverlay.tsx`
- §16 → `MediaContextMenu.tsx`
- §17 → `ImageEditorModal.tsx` + `CropOverlay.tsx`
- §18 → `OptimizationPanel.tsx`
- §19 → `StockSourceModal.tsx`
- §20 → `IconPickerModal.tsx`
- §21 → `ReplaceAcrossDialog.tsx`
- §22 → `UploadZone.tsx`

- [ ] **Step 3: Browser-screenshot the live surface**

Use /browse skill. Save under `/tmp/buildrik-compare-v3-full/` with naming convention `S<N>-<surface>.png`.

- [ ] **Step 4: Classify verdict**

| Verdict | Meaning |
|---|---|
| ship-as-is | matches prototype within tolerance |
| drift-acceptable | known drift, no fix needed (e.g., 1-col grid at 320px from prior audit) |
| drift-fix | minor copy/spacing/color fix needed |
| gap | functional gap requires code |

- [ ] **Step 5: Commit findings per-batch (every 5 sections)**

```bash
git add docs/superpowers/audits/2026-05-12-prototype-v3-full-parity.md
git commit -m "audit(prototype-v3-parity): §<N1>-§<N5> verdicts"
```

---

## Task 6: Phase B — Write parity audit doc

**Files:**
- Create: `docs/superpowers/audits/2026-05-12-prototype-v3-full-parity.md`

- [ ] **Step 1: Compile findings into audit doc**

Structure:

```markdown
# prototype-v3 — Full 22-Section Parity Audit

Scope: every numbered section in `prototype-v3.html` vs live editor surfaces. Supersedes the focused 3-surface audit at `2026-05-11-templates-media-shell-parity.md`.

Live screenshots: `/tmp/buildrik-compare-v3-full/`.

## Section verdicts

| § | Surface | File | Verdict | Notes |
|---|---|---|---|---|
| 1 | Templates default | `TemplatesTab.tsx` | ship-as-is | (per prior audit; 1-col grid drift acceptable) |
| 2 | Templates inline detail | `TemplateDetail.tsx` | ship-as-is | (per prior audit) |
| ... (all 22 rows) |

## Open follow-ups
... (gaps not closed by Phase A)

## Cross-cutting fixes
... (CORS, a11y, etc. still relevant)
```

- [ ] **Step 2: Commit audit doc**

```bash
git add docs/superpowers/audits/2026-05-12-prototype-v3-full-parity.md
git commit -m "audit(prototype-v3-parity): full 22-section verdict shipped"
```

- [ ] **Step 3: Update memory**

Save project memory file `project_prototype_v3_full_parity_20260512.md` capturing arc closure + any deferred follow-ups. Add pointer line to `MEMORY.md`.

```bash
# Update MEMORY.md index and write new memory file via Write tool
```

---

## Self-review pass

- [ ] Spec coverage: all 22 prototype-v3 sections covered by Task 5
- [ ] Phase A scope = exactly §4/§11/§12 (the 3 unverified per conversation)
- [ ] No "TBD" / "fill in details" — triage tasks acknowledge implementation depends on findings; that's the audit nature, not a placeholder
- [ ] File paths absolute and exact
- [ ] Commit messages follow convention: `audit(prototype-v3-parity):` for audit work, `feat(prototype-v3-parity):` for code

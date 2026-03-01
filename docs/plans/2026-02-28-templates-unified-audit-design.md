# Templates Feature — Unified Audit Design

**Date:** 2026-02-28
**Scope:** Full project (`src/editor/`) with deep focus on `src/editor/sidebar/tabs/templates/` and `src/editor/shell/StudioPanels.tsx`
**Output:** Single audit report + ordered implementation plan

---

## Approach

Layered bottom-up execution: **Structure → Code Quality → UX/UI**

Structural violations are root causes. Code anti-patterns are symptoms of bad structure. UX gaps are symptoms of bad code. Running the audit in this order means every finding at a higher layer can be traced to a root cause at a lower layer — and the implementation plan fixes roots before symptoms.

---

## Audit Blocks

### Block 3 — Project Structure (runs first)

**Questions answered:**

- Which folders have unclear ownership?
- Where do circular or upward imports exist?
- Which modules mix unrelated responsibilities?
- What is the dependency direction across `src/editor/`?

**Output:**

- Annotated folder tree (`src/editor/`) with ownership and responsibility notes
- Violation list: condition, location, severity, cost
- Target folder structure with rationale
- 4-phase migration path (no-risk → extract → invert → enforce)
- Guard rails: ESLint import rules, barrel policies

---

### Block 2 — Code Quality (runs second, informed by Block 3)

**Files in scope:**

- `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`
- `src/editor/sidebar/tabs/templates/TemplatePreviewModal.tsx`
- `src/editor/sidebar/tabs/templates/TemplateUseDrawer.tsx`
- `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx`
- `src/editor/sidebar/tabs/templates/ApplyProgressOverlay.tsx`
- `src/editor/sidebar/tabs/templates/templatesData.ts`
- `src/editor/sidebar/tabs/templates/index.ts`
- `src/editor/shell/StudioPanels.tsx`
- Any high-coupling hotspots identified by Block 3

**Anti-patterns checked (all 9):**

1. Pass-through wrapper functions
2. Middle-man classes / functions
3. Duplicate logic / semantic duplication
4. SSOT violations
5. Mixed responsibility files
6. Dead code / unused exports
7. Over-fragmented flow
8. Hidden side effects
9. High coupling / low cohesion

**Output:**

- Summary table: instance count per anti-pattern
- Detailed findings: pattern, location, harm, refactored version, effort
- Dependency map: which anti-patterns cause others
- Refactor priority order

---

### Block 1 — UX/UI (runs third, informed by Block 2)

**Source of truth:** Component logic as written — not a mockup review. Every state variable, conditional render, modal trigger, error path, and keyboard handler is traced against the 9 journey stages and 10 UX dimensions.

**Journey stages audited:**

- Open Tab
- Browse / Select
- Edit Values (N/A — browse-only tab)
- Preview Changes
- Save / Apply (Apply only — no Save concept)
- Reset (not present — UX gap to flag)
- Error Handling
- Success Confirmation
- Unsaved Changes Guard

**Dimensions audited:**

- Information Hierarchy
- Grouping & Proximity
- Editing Flow
- Preview Experience
- Apply / Reset Behavior
- Feedback States
- Microcopy & Labels
- Accessibility (WCAG 2.1 AA)
- Responsive / Small Screen
- Non-Technical User Usability

**Edge cases covered:** All 11 from the prompt spec.

**Output:**

- Mental model summary (3–5 bullets)
- Journey audit table
- Gap analysis by dimension
- Edge case matrix
- Prioritized issue list (Critical → Medium → Low)
- Recommended interaction model

---

## Report Deliverable

**File:** `docs/plans/2026-02-28-templates-unified-audit.md`

**Structure:**

1. Part 1 — Structure Audit
2. Part 2 — Code Quality Audit
3. Part 3 — UX/UI Audit
4. Part 4 — Implementation Plan (ordered tasks from all three blocks, sequenced: structure fixes → code fixes → UX improvements; each task tagged with severity, effort, source block)

---

## Implementation Plan Format

Each task entry:

```
TASK: [imperative title]
BLOCK: [3 / 2 / 1]
SEVERITY: [Critical / Medium / Low]
EFFORT: [Low / Medium / High]
FILES: [affected file paths]
DESCRIPTION: [what to do, specifically]
ROOT CAUSE: [which Block 3 / Block 2 finding caused this, if applicable]
```

Tasks are ordered:

1. Phase 1 — No-risk structural moves (rename, relocate)
2. Phase 2 — Extract and isolate (break mixed-responsibility files)
3. Phase 3 — Code quality fixes (anti-pattern removal)
4. Phase 4 — UX improvements (on top of clean foundation)

---

## Transition

After this design doc is committed, the `writing-plans` skill is invoked to convert the approved design into a detailed execution plan.

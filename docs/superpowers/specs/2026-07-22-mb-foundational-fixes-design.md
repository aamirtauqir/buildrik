# M-B · Editor Foundational Fixes — Design Spec

> 2026-07-22 · Part of the editor-redesign implementation program (design SSOT:
> `docs/prd/editor/14-screen-specs.md`; build sequence: codex plan, session
> `019f86bd`). This is **milestone M-B of 5** — the correctness-debt batch that
> unblocks the feature milestones stacked on top of it. Each milestone is its own
> spec → plan → build cycle.

## Why this milestone

Four independent correctness bugs in the shipped editor, each verified in code.
They are grouped because they are all "fix real bugs before more feature work
stacks on them" — not because they share architecture. Two are `[P1]` (a dead
reset-to-master path, and undo-spam), two are lower-severity but cheap. Building
new component/command/settings features on top of these bugs would compound them.

## Scope

**In:** the four fixes below (#5, #6, #7, #11 from the codex sequence).
**Out (explicitly deferred, with reason):**
- **#11 render-churn (B14)** — `useStyleHandlers` eager local mutation on every
  keystroke. A perf item, not a correctness bug (codex `[P2]`, "after undo/history
  correctness"). Separate perf pass.
- **#6 UI merge (S3.14 "2→1")** — merging the two palettes into one context-aware
  ⌘K is a UX redesign, not a fix. Belongs in a later UX milestone. This milestone
  only removes the duplicated command source (decision below).

## Build order within M-B

1. **#7** — trivial, isolated, quick win.
2. **#5** — `[P1]`, foundational for all component-instance work.
3. **#11** — `[P1]`, isolated to one section.
4. **#6** — largest (touches the command registry + both palettes), do last.

---

## Fix 1 · #5 — reset-to-master path-scheme `[P1]`

### Root cause (verified)
Component-instance overrides are stored under the **canonical position-path**
scheme and mismatched by the reset/query methods:

- **Write side (canonical `#/…`):** `recordInstanceOverride`
  (`engine/components/ComponentInstances.ts:105`) writes
  `#/<elementPath>/<type>/<property>`, where `elementPath` is a dot-joined index
  path (`children[0].children[1]`, `""` for root). The scheme is documented in
  `ComponentInstance.ts:51-66` and parsed by `parseCanonicalOverridePath`
  (`ComponentInstance.ts:68-86`). `syncToMaster` reads it correctly
  (`ComponentInstance.ts:141`).
- **Read/reset side (legacy `/elements/…`):** these methods build/match the old
  element-id scheme instead:
  - `getOverrides` (`:236-246`) parses with the legacy `parsePath` (`:28-49`) →
    every path fails to parse → type silently defaults to `"style"`.
  - `isPropertyOverridden` (`:251-259`) and `resetOverride` (`:264-272`) go
    through `getPropertyPath`, which emits the legacy `/elements/<id>/…` form →
    never `===` a stored `#/…` path → **always false / removes nothing**.
  - `resetElementOverrides` (`:277-285`) filters on the prefix
    `` `/elements/${elementId}/` `` → matches no stored path → **removes nothing.**

Net user impact: "reset to master" and the "is-overridden" indicator are dead —
the exact §13-A2 bug.

### Design
The reset/query API is **element-id-based** (`resetOverride(instance, elementId,
type, property)`), but storage is **position-based**. The fix is to convert
element-id → canonical position-path *at read time*, using the same derivation
`recordInstanceOverride` uses at write time, so the two can never drift again:

1. Extract a single shared helper `elementIdToCanonicalPath(instance, elementId,
   type, property)` (and an element-prefix variant) that produces the canonical
   `#/<elementPath>/<type>/<property>`. Source it from the existing write-side
   logic in `ComponentInstances.ts` so there is one derivation, not two.
2. Rewrite `getPropertyPath`, `isPropertyOverridden`, `resetOverride`, and
   `resetElementOverrides` to use that helper and match/remove against the stored
   `#/` paths.
3. Point `getOverrides` at `parseCanonicalOverridePath`; delete the now-dead
   legacy `parsePath` (`:28-49`).

Scope boundary: **F1a only** (master edited without reorder/insert). Reorder/insert
survival (F1b, stable slotKey) stays out of scope, as the existing comment states.

### Files
`engine/components/ComponentInstance.ts` (the five methods + delete `parsePath`);
reuse/extract from `engine/components/ComponentInstances.ts` (write-side path
derivation).

### Tests
- Record a style override on an instance child → `isPropertyOverridden` returns
  true for that (elementId, type, property).
- `resetOverride` removes exactly that override (stored `#/` path gone).
- `resetElementOverrides` clears all overrides for one element, leaves siblings'.
- `getOverrides` returns the correct `type` per override (not defaulted to style).
- Regression: `syncToMaster` still preserves surviving overrides after reset.

---

## Fix 2 · #6 — command palettes on the shared registry (dedupe, scope A)

### Root cause (verified)
Two palettes hardcode their own command lists while the real registry is ignored:
- `engine/commands/CommandCenter.ts:19` — the registry (39 commands).
- `editor/shell/CommandPalette.tsx` — shell palette, hardcoded nav/edit/view list.
- `editor/canvas/useCanvasCommandPalette.ts` — canvas palette, ~27 hardcoded
  commands with `requiresSelection` gating.

Consequences: the two lists drift; commands only in `CommandCenter`
(export-html / export-json — §13 B8) are unreachable from either palette.

### Design (scope A — decided: dedupe, do NOT merge the UIs)
Make `CommandCenter` the single source of commands; both palettes read and filter
it. The two entry points and their scoping stay exactly as they are today:

1. Ensure `CommandCenter` holds every command the two palettes need, each carrying
   scope/context metadata (at minimum: a scope tag `shell | canvas`, and
   `requiresSelection`). Migrate any command currently defined only in a palette
   into the registry.
2. `shell/CommandPalette.tsx` reads `CommandCenter`, filters to shell-scope
   commands (nav/edit/view), and executes via the registry.
3. `canvas/useCanvasCommandPalette.ts` reads `CommandCenter`, filters to
   canvas-scope commands, honours `requiresSelection`, and executes via the
   registry.
4. Delete both hardcoded literal lists.

Non-goal: a single unified ⌘K UI (S3.14 "2→1"). Kept as a later UX milestone. This
fix is the SSOT dedup only.

### Files
`engine/commands/CommandCenter.ts` (command definitions + scope metadata),
`editor/shell/CommandPalette.tsx`, `editor/canvas/useCanvasCommandPalette.ts`.

### Tests
- Both palettes render commands sourced from `CommandCenter` (mock the registry,
  assert the palette lists exactly its registry commands).
- Canvas palette hides/disables `requiresSelection` commands when nothing is
  selected; shows them when a selection exists.
- A registry-only command (e.g. export-html) is now reachable from the shell
  palette.
- No literal command array remains in either palette file (guard test / grep in
  the plan).

---

## Fix 3 · #7 — custom-code plan-gate id mismatch (trivial)

### Root cause (verified)
`editor/sidebar/tabs/settings/types.ts:62` keys the plan-gate map `advanced: "pro"`.
There is no `advanced` section — the section id is `custom-code`
(`types.ts:60` union, `types.ts:81` definition). The key never matches the section
id, so the Custom-code section is never pro-gated: `LockedScreen` never shows and a
free-plan user reaches head/body/CSS injection.

### Design
Rename the gate-map key `advanced` → `custom-code`. Grep-confirm nothing else keys
on `"advanced"` (no other consumer relies on the stale key).

### Files
`editor/sidebar/tabs/settings/types.ts`.

### Tests
- On a FREE plan, the `custom-code` section resolves to gated → `LockedScreen`.
- On PRO, `custom-code` is reachable.

---

## Fix 4 · #11 — inspector undo-spam (LinkSection) `[P1]`

### Root cause (verified)
`editor/inspector/sections/LinkSection.tsx` opens a transaction per keystroke:
`handleUrlChange` (and the email/phone/anchor equivalents) run
`composer.beginTransaction("link-change") → el.setAttribute("href", …) →
composer.endTransaction()` inside `onChange` (`:135-143`, handlers wired at
`:262-309`). Typing an N-character URL creates N undo entries.

### Design (decided: commit-on-blur)
Text inputs (url / email / phone / anchor) keep their value in **local component
state while typing** — no engine write per keystroke — and commit **one
transaction on blur or Enter**. `Esc` reverts local state to the element's current
attribute (no transaction). The link-type dropdown and target select are single
discrete changes and already commit once — leave them.

Rationale over the 300ms-debounce alternative: blur-commit produces exactly one
undo entry per field-edit-session (cleaner history), and avoids a mid-type
transaction landing while the user is still typing.

### Files
`editor/inspector/sections/LinkSection.tsx`.

### Tests
- Typing a 10-character URL then blurring → exactly one undo entry; undo restores
  the prior href in one step.
- Blur with no change → no transaction.
- `Esc` while typing reverts the input to the current attribute, no transaction.
- Target/rel change still commits as its own single transaction.

---

## Risks & invariants

- **#5** touches stored data addressing. The fix does not migrate stored
  overrides (they are already canonical `#/`); it only fixes the readers. Confirm
  no other reader relies on the legacy `parsePath` before deleting it (grep).
- **#6** changing what commands exist could surface commands that were
  intentionally hidden. Register only the commands the palettes already intended
  to show, plus the known-good unreachable ones (export-html/json). Do not expose
  new privileged actions.
- **#7** is behavior-changing for free-plan users (custom-code becomes gated).
  That is the intended correctness fix, not a regression.
- All four ship behind the existing editor test suite; each fix lands with the
  tests listed above and `npx tsc --noEmit` clean.

## Definition of done

Each fix: root-caused defect no longer reproduces, its tests pass, editor `tsc`
clean, no dead code left behind (`parsePath` deleted, hardcoded palette lists
deleted). Milestone committed as four focused commits (one per fix) or one batch
commit, per the implementation plan.

# Vibcoder Bucket B1 — Tooltip Radix Backing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the passive vibcoder Tooltip surface with a Radix.Tooltip-backed compound (Provider/Root/Trigger/Portal/Content). Delete the Phase 4 Tooltip shim. Migrate the 10 chrome consumers to the new compound.

**Architecture:** `@radix-ui/react-tooltip` to be installed. Vibcoder Tooltip wrapper at `src/editor/shared/vibcoder/Tooltip.tsx` (currently a passive presentation surface, no open/onOpenChange) becomes a Radix-backed compound. Phase 4 shim at `src/shared/ui/Tooltip.tsx` deletes after consumers migrate. CSS skin (`bd-tooltip` from `src/themes/components/molecules/popover.css`) stays unchanged.

**Tech Stack:** React 18 + TypeScript + `@radix-ui/react-tooltip` (TBD version). E2 + E3 contract waivers from Bucket A T1 docstring serve as precedent — Tooltip is anchored, opts out of OverlayMount portal routing, and Radix positioning props ARE the contract.

---

## Pre-flight context

**Why now:** Bucket A shipped 2026-04-28. Bucket B1 (Tooltip) is the cleanest precedent-extender — same anchored-overlay pattern, same E2/E3 waiver shape, smaller consumer set than Toast.

**Inventory (verified 2026-04-30):**
- 10 production consumers of `@/shared/ui/Tooltip` (Phase 4 shim) — exact list TBD via `grep -rEln "from ['\"](@/shared/ui/Tooltip|\\.\\./.*shared/ui/Tooltip)['\"]" src/`
- 0 codemod for Tooltip (none retired)
- Vibcoder wrapper at `src/editor/shared/vibcoder/Tooltip.tsx` — currently passive, NO open/onOpenChange (will gain them)
- Radix.Tooltip NOT installed — Step 1 of Task 1 installs it
- Tooltip CSS lives in `src/themes/components/molecules/popover.css` (multi-component file: Popover + Tooltip + Menu)

**Open contract questions (resolve in T1 before code):**
- Radix.Tooltip ships **a `<TooltipProvider>` requirement** at the app root (controls global delayDuration). Where does the provider mount? `src/editor/shell/AquibraStudio.tsx` is the canonical app shell — likely answer.
- Default delayDuration: Radix default = 700ms. Chrome's current shim is presumably hover-instant (passive surface). Decision needed: keep instant (delayDuration={0}) or use Radix default for accessibility hover-intent?
- Tooltip vs Popover positioning differences are minimal — `side`, `sideOffset`, `align`, `avoidCollisions` all map identically.

---

## Task breakdown

### Task 1: Add Radix.Tooltip dep + Vibcoder Tooltip wrapper Radix migration

**Files:**
- Modify: `packages/editor/package.json` (add `@radix-ui/react-tooltip` dep)
- Modify: `packages/editor/src/editor/shared/vibcoder/Tooltip.tsx` (replace contents with Radix-backed compound)
- Modify: `packages/editor/src/editor/shared/vibcoder/Tooltip.test.tsx` (rewrite assertions)
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts` (add new compound exports)
- Create or modify: `packages/editor/src/preview/vibcoder-tooltip.tsx` (gallery)
- Decision: where to mount `<TooltipProvider>` — likely `src/editor/shell/AquibraStudio.tsx`

- [ ] **Step 1: Install Radix.Tooltip**

```bash
cd packages/editor && npm install @radix-ui/react-tooltip
```
Verify version pinned in `package.json`.

- [ ] **Step 2: Read current passive wrapper**

```bash
cat packages/editor/src/editor/shared/vibcoder/Tooltip.tsx
cat packages/editor/src/editor/shared/vibcoder/Tooltip.test.tsx
cat packages/editor/src/editor/shared/vibcoder/index.ts
```

Confirm passive shape, identify what stays (CSS classes) and what changes (compound API).

- [ ] **Step 3: Write the new wrapper**

Compound exports:
- `TooltipProvider = RadixTooltip.Provider` (re-export; chrome mounts at AquibraStudio)
- `Tooltip = RadixTooltip.Root` (forwarded with optional open/onOpenChange + delayDuration)
- `TooltipTrigger = RadixTooltip.Trigger`
- `TooltipPortal = RadixTooltip.Portal`
- `TooltipContent` (forwardRef wrap with `bd-tooltip` className + multiline modifier)
- Preserve docstring with E2 + E3 waivers (positioning IS the API; anchored overlay, no OverlayMount)

Reference shape: see `src/editor/shared/vibcoder/Popover.tsx` post-Bucket-A (commit `e0ef916`).

- [ ] **Step 4: Update tests**

Cover:
- `open=false` renders no content
- `open=true` renders content with `bd-tooltip` className
- `multiline` modifier adds `bd-tooltip--multiline`
- `onOpenChange` fires on Esc + outside click + hover-out
- `TooltipTrigger asChild` correctly anchors
- `TooltipProvider delayDuration` overrides default

- [ ] **Step 5: Update vibcoder index barrel**

Add `TooltipProvider`, `TooltipTrigger`, `TooltipPortal`, `TooltipContent` exports.

- [ ] **Step 6: Update gallery preview**

Demonstrate: base (instant), with delay, multiline modifier, asChild custom trigger.

- [ ] **Step 7: Verify**

```bash
cd packages/editor
npx tsc --noEmit 2>&1 | grep -v "^\.\./\.\./" | grep "error TS" | wc -l   # equals 71
npx vitest run src/editor/shared/vibcoder/Tooltip.test.tsx                 # all pass
bash scripts/ds-grep-gates.sh                                              # all 25 green
```

- [ ] **Step 8: Commit**

```
feat(vibcoder): Tooltip wrapper now Radix.Tooltip-backed compound (Bucket B1 T1)
```

### Task 2: Mount TooltipProvider at app shell

**Files:**
- Modify: `packages/editor/src/editor/shell/AquibraStudio.tsx` (or canonical mount point)

- [ ] **Step 1: Identify the canonical mount point** (likely AquibraStudio.tsx near the React.StrictMode root or the OverlayMount.tsx Provider stack)
- [ ] **Step 2: Wrap children in `<TooltipProvider delayDuration={X}>`** with the chosen delay (decision in pre-flight)
- [ ] **Step 3: Verify** (tsc + gates + vitest all green)
- [ ] **Step 4: Commit** — `feat(vibcoder-bucket-b1): T2 mount TooltipProvider at AquibraStudio shell`

### Task 3: Phase 4 Tooltip shim deletion + 10 consumer rewrites

**Files:**
- Delete: `packages/editor/src/shared/ui/Tooltip.tsx`
- Delete: any `__tests__/Tooltip.adapter.test.tsx` if present
- Modify: `packages/editor/src/shared/ui/index.tsx` + `index.ts`, `packages/editor/src/index.ts`, green-panel allowlist
- Modify: 10 consumer files (exact list TBD in Step 1)

- [ ] **Step 1: Verify inventory**

```bash
cd packages/editor
grep -rEln "from ['\"](@/shared/ui/Tooltip|\\.\\./.*shared/ui/Tooltip)['\"]" src/ \
  --include='*.tsx' --include='*.ts' | grep -v __tests__ | grep -v preview
```

Expected: 10 files. Capture exact paths.

- [ ] **Step 2: Read each consumer** to plan prop translation. Common shim API to translate:
  - `<Tooltip content={...}>{trigger}</Tooltip>` → compound shape
  - Position prop → Radix `side`
  - Delay prop → Provider `delayDuration` or per-instance

- [ ] **Step 3: Rewrite each consumer** (10 hand-ports). Template:

```tsx
<Tooltip>
  <TooltipTrigger asChild>{trigger}</TooltipTrigger>
  <TooltipPortal>
    <TooltipContent side="top" sideOffset={4}>
      {label}
    </TooltipContent>
  </TooltipPortal>
</Tooltip>
```

- [ ] **Step 4: Update imports** — `from "@/shared/ui/Tooltip"` → `from "@/editor/shared/vibcoder"`

- [ ] **Step 5: Delete shim + barrel cleanup + green-panel allowlist**

- [ ] **Step 6: Verify** — no remaining shim imports, no `vi.mock` paths target the deleted shim, tsc 71, gates 25/25, vitest passes

- [ ] **Step 7: Commit** — `feat(vibcoder-bucket-b1): T3 Tooltip shim deletion + 10 consumer hand-port`

### Task 4: Bucket B1 close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (append B1 findings)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md` (mark B1 SHIPPED)
- Create: `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_bucket_b1_shipped_<DATE>.md`
- Update: MEMORY.md index

- [ ] **Step 1: Append Bucket B1 findings** to poc-findings.md (commit table, LOC delta, TooltipProvider mount decision, delay-duration decision, any new contract waivers)
- [ ] **Step 2: Update roadmap** — Bucket B1 from PENDING → SHIPPED
- [ ] **Step 3: Write memory file** at home-dir path
- [ ] **Step 4: Update MEMORY.md** index entry
- [ ] **Step 5: Verify** — all baselines stable
- [ ] **Step 6: Commit** — `docs(vibcoder-bucket-b1): T4 close-out`

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Radix.Tooltip Provider not mounted → all tooltips no-op silently | High | T2 dispatches dedicated subagent; T3 spec reviewer verifies provider in shell tree |
| Hover-intent delay change perceived as regression | Medium | Pre-flight decision: keep instant (delayDuration=0) unless A11y review demands otherwise |
| `triggerOn="hover"` passive→Radix-hover translation drops mouse-leave behavior | Medium | T3 reads each consumer for hover-specific assumptions |
| Tooltip CSS skin (multi-component file) accidentally edited | Low | T1 instructions explicitly say CSS unchanged; gate spot-check |
| Radix.Tooltip portal default differs from Popover (E3 waiver assumes anchored body portal) | Low | Verify in T1 step 3 — same Radix anchored-overlay pattern, waiver applies |

---

## Success conditions

- [ ] `@radix-ui/react-tooltip` installed
- [ ] All 10 chrome consumers use Radix-backed vibcoder Tooltip compound
- [ ] `src/shared/ui/Tooltip.tsx` shim deleted
- [ ] `<TooltipProvider>` mounted at canonical app shell
- [ ] tsc 71 stable
- [ ] All 25 DS gates green
- [ ] Vitest passes
- [ ] Memory file written; MEMORY.md updated
- [ ] Phase 5 docs updated to reflect B1 SHIPPED

# Vibcoder Bucket B3 — Toast Radix Backing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the controlled-single-instance vibcoder Toast surface with a Radix.Toast-backed system (Provider/Viewport/Root/Title/Description/Action/Close). Delete the Phase 4 Toast shim. Migrate 27 chrome consumers via codemod-assisted rewrites. Decide whether the Phase 3 NotificationCenter organism is now obsoleted by Radix.Toast's built-in queue.

**Architecture:** `@radix-ui/react-toast` to be installed. Vibcoder Toast wrapper at `src/editor/shared/vibcoder/Toast.tsx` (currently controlled-single-instance, no queue) becomes a multi-instance Radix-backed system. A `<ToastProvider>` + `<ToastViewport>` mount once at app shell. Phase 4 shim at `src/shared/ui/Toast.tsx` deletes after consumers migrate. Toast CSS lives in `src/themes/components/molecules/toast.css` (`.bd-toast` + tone modifiers) — stays unchanged.

**Tech Stack:** React 18 + TypeScript + `@radix-ui/react-toast`. E2 contract waiver from Bucket A applies. **E3 waiver does NOT apply directly** — Radix.Toast uses a fixed `<ToastViewport>` element (not anchored to a trigger), so it is **closer to OverlayMount semantics than Popover/Tooltip**. New waiver discussion needed in T1 docstring: viewport mount is its own portal escape, parallel to OverlayMount but separate (z-index of toast viewport is its own concern, not modal stack).

---

## Pre-flight context

**Why now:** Largest consumer surface in Bucket B (27). Codemod assist makes this tractable in a single arc. The "is NotificationCenter obsolete?" question must be answered before T1 — Radix.Toast's queue may displace the Phase 3 organism entirely, or the organism may still wrap Radix.Toast for chrome-specific styling/positioning.

**Inventory (verified 2026-04-30):**
- 27 production consumers of `@/shared/ui/Toast` (Phase 4 shim) — exact list TBD via `grep -rEln "from ['\"](@/shared/ui/Toast|\\.\\./.*shared/ui/Toast)['\"]" src/`
- 0 codemod for Toast (none retired)
- Vibcoder wrapper at `src/editor/shared/vibcoder/Toast.tsx` — currently controlled-single-instance per docstring ("Phase 2 SCOPE — single Toast component only. Queue management ... is Phase 3 NotificationCenter organism")
- Radix.Toast NOT installed — T1 Step 1 installs it
- Toast CSS lives in `src/themes/components/molecules/toast.css` (separate file from popover/tooltip)

**Open contract questions (resolve in T1 BEFORE code):**
- **Q1: NotificationCenter organism — keep, retire, or wrap?** Radix.Toast ships built-in queue, viewport, swipe-to-dismiss, and timer orchestration. Three options:
  - (a) Retire the planned organism entirely; Radix is the queue
  - (b) Keep the organism as a styling/positioning wrapper around Radix.Toast.Provider
  - (c) Defer the decision; keep current Toast wrapper as 1:1 with Radix.Toast.Root and let the organism build on top later
  - **Recommend (a)** for simplicity, but verify NotificationCenter spec doesn't require behavior Radix can't provide.
- **Q2: Where does ToastProvider + Viewport mount?** Same answer as Tooltip's TooltipProvider: app shell. Likely `src/editor/shell/AquibraStudio.tsx`. Viewport positioning (top-right, bottom-center, etc.) is a chrome-specific decision — must align with current toast positioning (TBD via reading the shim).
- **Q3: Codemod scope.** 27 consumers + likely repetitive prop translations (`Toast({title, description, tone, action, onDismiss})` → compound shape). A jscodeshift transform (`scripts/codemods/bucket-b3/toast.ts`) saves ~25 manual rewrites. Plan adds T2 for the codemod.
- **Q4: Auto-dismiss timer ownership.** Shim docstring says "callers wire the dismiss timer themselves OR the Phase 3 organism wires it." Radix.Toast handles auto-dismiss via `duration` prop on `<Toast>`. Decision: keep duration prop on the new wrapper OR fix at viewport level.

---

## Task breakdown

### Task 1: NotificationCenter organism decision + Radix.Toast dep + wrapper migration

**Files:**
- Modify: `packages/editor/package.json`
- Modify: `packages/editor/src/editor/shared/vibcoder/Toast.tsx`
- Modify: `packages/editor/src/editor/shared/vibcoder/Toast.test.tsx`
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts`
- Modify: `packages/editor/src/preview/vibcoder-toast.tsx`
- Possibly delete: `src/editor/shared/vibcoder/NotificationCenter.tsx` (if Q1 = retire)

- [ ] **Step 1: Resolve open contract questions Q1-Q4**

Read NotificationCenter spec/code if it exists. Read shim Toast.tsx for current API. Document decision in plan and (eventually) in the new wrapper docstring.

- [ ] **Step 2: Install Radix.Toast**

```bash
cd packages/editor && npm install @radix-ui/react-toast
```

- [ ] **Step 3: Read current passive-controlled wrapper**
- [ ] **Step 4: Write the new wrapper** — compound exports:
  - `ToastProvider = RadixToast.Provider`
  - `ToastViewport = RadixToast.Viewport` (with `bd-toast-viewport` className for chrome positioning)
  - `Toast = RadixToast.Root` (forwardRef wrap with `bd-toast` + tone modifier classes)
  - `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`
  - Preserve current `tone` prop (info/success/warning/error/neutral) → translates to className
  - Preserve `duration` prop (Radix native)
- [ ] **Step 5: Update tests** — auto-dismiss timer, swipe behavior (Radix handles), tone className, action button, close button
- [ ] **Step 6: Update vibcoder index barrel**
- [ ] **Step 7: Update gallery preview** — show all 5 tones, action button, auto-dismiss
- [ ] **Step 8: Verify + commit**

### Task 2: Toast prop-translation codemod

**Files:**
- Create: `packages/editor/scripts/codemods/bucket-b3/toast.ts` (jscodeshift transform)
- Create: `packages/editor/scripts/codemods/bucket-b3/__tests__/toast.codemod.test.ts` (inline-string test pattern, NOT fixture files — to avoid Gate 25 issues)
- Modify: `packages/editor/package.json` (add `codemod:bucket-b3:toast` script)

**Codemod scope:**
- Rewrite import: `from "@/shared/ui/Toast"` → `from "@/editor/shared/vibcoder"`
- Translate JSX prop API to compound JSX where mechanically possible

**Out of scope for codemod:**
- Hook-based toast triggers (e.g., `useToast()` calls) — manual migration in T3

- [ ] **Step 1: Read Phase 5 codemod patterns** as reference (e.g., `scripts/codemods/phase5/icon.ts`)
- [ ] **Step 2: Write codemod transform** with inline-string tests (NO fixture files)
- [ ] **Step 3: Add `codemod:bucket-b3:toast` script** to package.json
- [ ] **Step 4: Verify** — codemod tests pass, Gate 25 clean (no orphan fixtures)
- [ ] **Step 5: Commit** — `feat(vibcoder-bucket-b3): T2 Toast prop-translation codemod`

### Task 3: Mount ToastProvider + Viewport at app shell

**Files:**
- Modify: `packages/editor/src/editor/shell/AquibraStudio.tsx` (or canonical mount point)

- [ ] **Step 1: Identify the canonical mount point**
- [ ] **Step 2: Wrap children in `<ToastProvider>`**, mount `<ToastViewport>` once near body root with `bd-toast-viewport` positioning className
- [ ] **Step 3: Verify** — tsc + gates + vitest all green
- [ ] **Step 4: Commit** — `feat(vibcoder-bucket-b3): T3 mount ToastProvider + Viewport at AquibraStudio shell`

### Task 4: Phase 4 Toast shim deletion + 27 consumer rewrites (codemod-assisted)

**Files:**
- Delete: `packages/editor/src/shared/ui/Toast.tsx`
- Delete: any `__tests__/Toast.adapter.test.tsx` if present
- Modify: `packages/editor/src/shared/ui/index.tsx` + `index.ts`, `packages/editor/src/index.ts`, green-panel allowlist
- Modify: 27 consumer files (codemod handles imports + mechanical JSX; manual fixes for hook-based usage)

- [ ] **Step 1: Verify inventory** (27 consumers)
- [ ] **Step 2: Run codemod** — `npm run codemod:bucket-b3:toast`
- [ ] **Step 3: Manual sweep** — find consumers the codemod missed (hook-based usage, custom prop combos), hand-port each
- [ ] **Step 4: Delete shim + barrel cleanup + green-panel allowlist**
- [ ] **Step 5: Verify** — no remaining shim imports, no vi.mock paths, tsc 71, gates 25/25, vitest passes
- [ ] **Step 6: Commit** — `feat(vibcoder-bucket-b3): T4 Toast shim deletion + 27 consumer migration`

### Task 5: Codemod retirement (after T4 stabilizes)

Optional defer — leave the codemod available for ~1 week post-T4 in case rollback rewrites are needed. If kept, ensure Gate 25 remains green (no orphan fixtures, since codemod uses inline-string tests).

- [ ] **Step 1: Verify codemod usage complete** — no follow-up consumers expected
- [ ] **Step 2: Delete codemod files + package.json script**
- [ ] **Step 3: Verify** — Gate 25 green
- [ ] **Step 4: Commit** — `chore(vibcoder-bucket-b3): T5 Toast codemod retired`

### Task 6: NotificationCenter retirement (if Q1 decided 'retire')

If Q1 from T1 decided to retire the organism, this task deletes the spec'd organism scaffolding before it gets implemented.

- [ ] **Step 1: Verify organism not yet implemented** OR delete partial implementation
- [ ] **Step 2: Update Phase 3 organism roadmap** to mark NotificationCenter retired (with reason: Radix.Toast queue subsumes it)
- [ ] **Step 3: Commit** — `chore(vibcoder-bucket-b3): T6 NotificationCenter organism retired (subsumed by Radix.Toast)`

### Task 7: Bucket B3 close-out

- [ ] **Step 1: Append Bucket B3 findings** to poc-findings.md (commit table, LOC delta, Q1-Q4 decisions, codemod retirement status, NotificationCenter status)
- [ ] **Step 2: Update roadmap** — Bucket B3 from PENDING → SHIPPED; mark Phase 5 chrome arc fully complete
- [ ] **Step 3: Write memory file** at home-dir path
- [ ] **Step 4: Update MEMORY.md** index entry
- [ ] **Step 5: Verify** — all baselines stable
- [ ] **Step 6: Commit** — `docs(vibcoder-bucket-b3): T7 close-out — Phase 5 chrome arc fully complete`

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Radix.Toast queue semantics differ from current single-instance Toast | High | T1 Step 1 explicitly resolves before code; spec change documented in commit |
| 27 consumers have heterogeneous prop usage; codemod can't catch all | High | T4 Step 3 mandates manual sweep; gate-driven verification (no remaining shim imports) catches misses |
| Hook-based toast triggers (e.g., `useToast()`) broken by import path change | Medium | T4 Step 3 manual sweep specifically targets hook usage |
| ToastViewport CSS positioning conflicts with chrome layout (z-index, viewport edge) | Medium | T3 verifies viewport doesn't overlap modal/popover stacks |
| NotificationCenter organism retirement loses planned features (rich-content notifications, history panel) | Medium | T1 Step 1 documents what Radix.Toast does NOT cover; if gap exists, Q1 → option (b) keep wrapper |
| Codemod fixture-file regression triggers Gate 25 | Low | T2 Step 2 uses inline-string tests per Gate 25 rules |
| 27-file batch codemod miscompiles in subset → spurious tsc errors | Medium | T4 verification gate catches; fix by splitting into smaller batches |

---

## Success conditions

- [ ] `@radix-ui/react-toast` installed
- [ ] Q1-Q4 contract decisions documented in wrapper docstring
- [ ] Vibcoder Toast wrapper now Radix.Toast-backed with multi-instance support
- [ ] `<ToastProvider>` + `<ToastViewport>` mounted at canonical app shell
- [ ] All 27 chrome consumers use Radix-backed vibcoder Toast compound
- [ ] `src/shared/ui/Toast.tsx` shim deleted
- [ ] Codemod retired (T5) OR consciously kept with rationale
- [ ] NotificationCenter organism status resolved (T6)
- [ ] tsc 71 stable
- [ ] All 25 DS gates green
- [ ] Vitest passes
- [ ] Memory file written; MEMORY.md updated
- [ ] Phase 5 docs updated to reflect B3 SHIPPED + chrome arc complete

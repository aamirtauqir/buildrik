# Vibcoder Popover Radix Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled vibcoder Popover passive surface with a Radix.Popover-backed compound. Delete the Phase 4 Popover hybrid shim + the 4 consumer rewrites + the now-orphaned `useFocusTrap` hook + the last surviving Phase 4 codemod entry.

**Architecture:** Single-repo edit. `@radix-ui/react-popover@^1.1.15` is already installed (added during Phase 3 organism arc when Modal switched to Radix.Dialog). Vibcoder Popover wrapper at `src/editor/shared/vibcoder/Popover.tsx` (109 LOC, passive surface) becomes a Radix-backed compound (Root / Trigger / Portal / Content / Arrow). Phase 4 shim at `src/shared/ui/Popover.tsx` (200 LOC behavior shell) deletes after consumers migrate. `useFocusTrap` (currently 1 consumer = the shim) deletes after shim deletes.

**Tech Stack:** React 18 + TypeScript + `@radix-ui/react-popover@^1.1.15`. CSS lives in vendored `src/themes/components/molecules/popover.css` (`.bd-popover` + `.bd-popover--with-arrow` classes preserved unchanged — no vibcoder bundle source changes needed).

---

## Pre-flight context

**Why now:** Phase 5 closed at M9 (`73009ce`) with Bucket A deferred. Bucket A unblocks M10 visual regression infra by retiring the last shim and the last `useFocusTrap` dependency. Originally framed as "upstream-blocked" — investigation showed the bundle is in-repo, so this is just the next planned work in the same arc.

**Inventory (verified 2026-04-30):**
- 4 production consumers of `@/shared/ui/Popover` (Phase 4 shim):
  - `src/editor/inspector/sections/SizeSection.tsx`
  - `src/editor/inspector/sections/typography/FontControls.tsx`
  - `src/editor/inspector/shared/controls/ColorInput.tsx`
  - `src/editor/panels/RichTextEditor.tsx`
- 1 dev-only consumer: `src/preview/vibcoder-popover.tsx` (gallery)
- `useFocusTrap` consumers post-shim-deletion: ZERO (verified — only the shim and the hook's own test/barrel reference it currently)
- Radix.Popover dep: already installed (`package.json:31`)

**API translation contract (Phase 4 shim docstring):**
- `trigger: ReactElement` → wrapped as PopoverTrigger anchor
- `content: ReactNode` → passed as PopoverContent children
- `position?: "top"|"bottom"|"left"|"right"` (default `"bottom"`) → maps to Radix `side` prop
- `triggerOn?: "click"|"hover"` (default `"click"`) → click is Radix default; hover requires custom listener
- `closeOnClickOutside?: boolean` (default `true`) → Radix default true via `onPointerDownOutside`
- Internal: useState(isOpen), useFocusTrap on contentRef, createPortal, manual position math

**Vibcoder Popover wrapper post-upgrade target (Contract changes):**
- Becomes a compound: `Popover` (Root) + `PopoverTrigger` + `PopoverPortal` + `PopoverContent` + `PopoverArrow`
- `open` + `onOpenChange` map to Radix Root
- `bd-popover` className preserved on PopoverContent for CSS skin
- `withArrow` boolean stays as a marker classname on PopoverContent (gates the CSS `::before` arrow)
- PopoverArrow re-exports Radix.Popover.Arrow (closes #93)
- Consumers retain "always controlled" pattern via Contract B

---

## Task breakdown

### Task 1: Vibcoder Popover wrapper — Radix.Popover migration

**Files:**
- Modify: `packages/editor/src/editor/shared/vibcoder/Popover.tsx` (currently 109 LOC, replace contents)
- Modify: `packages/editor/src/editor/shared/vibcoder/Popover.test.tsx` (update assertions for new compound shape)
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts` (add new compound exports — `PopoverTrigger`, `PopoverPortal`, `PopoverContent`)
- Modify: `packages/editor/src/preview/vibcoder-popover.tsx` (gallery — show the new compound API)

- [ ] **Step 1: Read current wrapper and test**

```bash
cat packages/editor/src/editor/shared/vibcoder/Popover.tsx
cat packages/editor/src/editor/shared/vibcoder/Popover.test.tsx
cat packages/editor/src/editor/shared/vibcoder/index.ts
```

Expected: Confirm current passive-surface shape, the test asserts `bd-popover` className + `--with-arrow` modifier, the index re-exports `Popover` and `PopoverArrow`.

- [ ] **Step 2: Write the new wrapper**

Replace `packages/editor/src/editor/shared/vibcoder/Popover.tsx` with a Radix-backed compound. Key shape:

```tsx
/**
 * Vibcoder Popover wrapper — Radix.Popover-backed compound.
 *
 * Phase 5 T7 upgrade: replaces the Phase 2 passive surface. The bd-popover
 * CSS skin (src/themes/components/molecules/popover.css) is now applied to
 * PopoverContent; bd-popover--with-arrow gates the CSS ::before arrow.
 *
 * Compound exports:
 *   Popover           — Root (controlled via open + onOpenChange)
 *   PopoverTrigger    — anchor element; supports asChild
 *   PopoverPortal     — portal escape (renders into document.body by default)
 *   PopoverContent    — surface with bd-popover className; honors withArrow
 *   PopoverArrow      — Radix.Popover.Arrow re-export (closes #93)
 *
 * @license BSD-3-Clause
 */
import * as RadixPopover from "@radix-ui/react-popover";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from "react";

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}
export const Popover = ({ open, onOpenChange, children }: PopoverProps) => (
  <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
    {children}
  </RadixPopover.Root>
);

export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverPortal = RadixPopover.Portal;

export interface PopoverContentProps
  extends ComponentPropsWithoutRef<typeof RadixPopover.Content> {
  withArrow?: boolean;
}
export const PopoverContent = forwardRef<
  ElementRef<typeof RadixPopover.Content>,
  PopoverContentProps
>(({ className, withArrow, children, ...rest }, ref) => {
  const classes = [
    "bd-popover",
    withArrow && "bd-popover--with-arrow",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <RadixPopover.Content ref={ref} className={classes} {...rest}>
      {children}
    </RadixPopover.Content>
  );
});
PopoverContent.displayName = "PopoverContent";

export const PopoverArrow = RadixPopover.Arrow;
```

- [ ] **Step 3: Update tests**

Rewrite `Popover.test.tsx` for the new compound. Cover:
- `open=false` renders no content (test via `screen.queryByRole`)
- `open=true` renders content with `bd-popover` className
- `withArrow={true}` adds `bd-popover--with-arrow`
- `onOpenChange` fires when Esc pressed (Radix-default behavior)
- `onOpenChange` fires when outside click happens (Radix-default)
- `PopoverTrigger asChild` correctly anchors to a custom button

```bash
cd packages/editor && npx vitest run src/editor/shared/vibcoder/Popover.test.tsx -v
```
Expected: all new tests pass; no Phase 2 passive-surface assertions remain.

- [ ] **Step 4: Update vibcoder index barrel**

Edit `packages/editor/src/editor/shared/vibcoder/index.ts` to add `PopoverTrigger`, `PopoverPortal`, `PopoverContent` exports alongside existing `Popover` and `PopoverArrow`.

- [ ] **Step 5: Update gallery preview**

Edit `packages/editor/src/preview/vibcoder-popover.tsx` to render the compound shape (`<Popover>` + `<PopoverTrigger>` + `<PopoverPortal>` + `<PopoverContent>`) so the gallery teaches the new API.

- [ ] **Step 6: Verify**

```bash
cd packages/editor
npx tsc --noEmit 2>&1 | grep -v "^\.\./\.\./" | grep "error TS" | wc -l   # must equal 71
npx vitest run src/editor/shared/vibcoder/Popover.test.tsx                 # all pass
bash scripts/ds-grep-gates.sh                                              # all 24 green
```

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/editor/shared/vibcoder/Popover.tsx \
        packages/editor/src/editor/shared/vibcoder/Popover.test.tsx \
        packages/editor/src/editor/shared/vibcoder/index.ts \
        packages/editor/src/preview/vibcoder-popover.tsx
git commit -m "feat(vibcoder): Popover wrapper now Radix.Popover-backed compound (Bucket A T1)

Replaces Phase 2 passive surface with Radix.Popover Root/Trigger/Portal/
Content/Arrow compound. CSS skin (bd-popover + bd-popover--with-arrow)
preserved on PopoverContent. PopoverArrow re-exports Radix.Popover.Arrow
(closes #93). New compound API ready for chrome consumers in T2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 2: Phase 4 Popover shim deletion + 4 consumer rewrites

**Files:**
- Delete: `packages/editor/src/shared/ui/Popover.tsx` (200 LOC shim)
- Delete: `packages/editor/src/shared/ui/__tests__/Popover.adapter.test.tsx` (if it exists — verify in Step 1)
- Modify: `packages/editor/src/shared/ui/index.tsx` (drop `export * from "./Popover";`)
- Modify: `packages/editor/src/shared/ui/index.ts` (drop named export block if present)
- Modify: `packages/editor/src/index.ts` (drop transitive `Popover` re-export if present)
- Modify: `packages/editor/scripts/.ds-green-panels.json` (drop Popover.tsx allowlist entry if present)
- Modify: `packages/editor/src/editor/inspector/sections/SizeSection.tsx`
- Modify: `packages/editor/src/editor/inspector/sections/typography/FontControls.tsx`
- Modify: `packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx`
- Modify: `packages/editor/src/editor/panels/RichTextEditor.tsx`

- [ ] **Step 1: Verify inventory**

```bash
cd packages/editor
grep -rEln "from ['\"](@/shared/ui/Popover|\\.\\./.*shared/ui/Popover)['\"]" src/
grep -rEln "Popover[ ,]" src/index.ts src/shared/ui/index.{ts,tsx} 2>/dev/null
ls src/shared/ui/__tests__/Popover* 2>/dev/null
grep "Popover.tsx" scripts/.ds-green-panels.json
```

Expected: 4 production consumers + barrel re-exports + adapter test (if any) + green-panel entry. Confirm against pre-flight inventory above.

- [ ] **Step 2: Read each consumer to plan rewrite**

```bash
for f in src/editor/inspector/sections/SizeSection.tsx \
         src/editor/inspector/sections/typography/FontControls.tsx \
         src/editor/inspector/shared/controls/ColorInput.tsx \
         src/editor/panels/RichTextEditor.tsx; do
  echo "=== $f ==="
  grep -nE "Popover|popover" "$f" | head -10
done
```

Expected: each consumer uses `<Popover trigger={X} content={Y} position={Z} triggerOn={W} closeOnClickOutside={V}>`. Note exact prop usage — some may default `position`, `triggerOn`, `closeOnClickOutside`.

- [ ] **Step 3: Rewrite each consumer (per-consumer template)**

Old shape:
```tsx
<Popover trigger={<button>Open</button>} content={<Menu/>} position="bottom" triggerOn="click" />
```

New shape:
```tsx
<Popover open={isOpen} onOpenChange={setIsOpen}>
  <PopoverTrigger asChild>
    <button>Open</button>
  </PopoverTrigger>
  <PopoverPortal>
    <PopoverContent side="bottom" sideOffset={8}>
      <Menu />
    </PopoverContent>
  </PopoverPortal>
</Popover>
```

Notes:
- `position="bottom"` → `side="bottom"` (Radix default; can omit)
- `position="top"` → `side="top"`
- `position="left"` → `side="left"`
- `position="right"` → `side="right"`
- `triggerOn="hover"` (if any consumer uses it) → wrap with `onPointerEnter`/`onPointerLeave` handlers on PopoverTrigger; if none use, drop the prop quietly
- `closeOnClickOutside={false}` (if any consumer uses it) → `<PopoverContent onPointerDownOutside={(e) => e.preventDefault()}>`
- Consumer must own `useState(isOpen)` — the shim was internally controlled, the new compound is externally controlled (matches Contract B)
- Drop `useFocusTrap` references — Radix.Popover handles focus trap internally

- [ ] **Step 4: Update imports per consumer**

```diff
- import { Popover } from "@/shared/ui/Popover";
+ import {
+   Popover,
+   PopoverTrigger,
+   PopoverPortal,
+   PopoverContent,
+ } from "@/editor/shared/vibcoder";
```

- [ ] **Step 5: Delete shim + barrel cleanup**

```bash
rm packages/editor/src/shared/ui/Popover.tsx
rm packages/editor/src/shared/ui/__tests__/Popover.adapter.test.tsx 2>/dev/null || true
```

Edit barrels (drop Popover entries):
- `packages/editor/src/shared/ui/index.tsx` — remove `export * from "./Popover";` if present
- `packages/editor/src/shared/ui/index.ts` — remove named export block if present
- `packages/editor/src/index.ts` — remove transitive `Popover,` if present
- `packages/editor/scripts/.ds-green-panels.json` — remove Popover.tsx allowlist entry if present

- [ ] **Step 6: Verify**

```bash
cd packages/editor
grep -rEln "from ['\"]@/shared/ui/Popover['\"]" src/         # must be empty
npx tsc --noEmit 2>&1 | grep -v "^\.\./\.\./" | grep "error TS" | wc -l   # must equal 71
bash scripts/ds-grep-gates.sh                                # all 24 green
npx vitest run                                                # all pass
```

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/editor/inspector/sections/SizeSection.tsx \
        packages/editor/src/editor/inspector/sections/typography/FontControls.tsx \
        packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx \
        packages/editor/src/editor/panels/RichTextEditor.tsx \
        packages/editor/src/shared/ui/Popover.tsx \
        packages/editor/src/shared/ui/__tests__/Popover.adapter.test.tsx \
        packages/editor/src/shared/ui/index.tsx \
        packages/editor/src/shared/ui/index.ts \
        packages/editor/src/index.ts \
        packages/editor/scripts/.ds-green-panels.json
git commit -m "feat(vibcoder-bucket-a): T2 Popover shim deletion + 4 consumer hand-port

Phase 4 Popover hybrid shim deleted. 4 consumer sites rewritten to use
the Radix-backed vibcoder Popover compound (T1, commit <SHA>):
  - SizeSection, FontControls, ColorInput, RichTextEditor

Shim retired the manual position math, document mousedown listener,
keydown listener, and createPortal — all replaced by Radix.Popover
internals.

Tests: vitest <X>/<Y> pass. tsc 71 baseline. All 24 DS gates green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3: useFocusTrap deletion (orphan after T2)

**Files:**
- Delete: `packages/editor/src/shared/hooks/useFocusTrap.ts`
- Delete: `packages/editor/src/shared/hooks/__tests__/useFocusTrap.test.tsx`
- Modify: `packages/editor/src/shared/hooks/index.ts` (drop `useFocusTrap` export)

- [ ] **Step 1: Verify orphan status**

```bash
cd packages/editor
grep -rEln "useFocusTrap" src/ | grep -v "shared/hooks/useFocusTrap" | grep -v "shared/hooks/__tests__/useFocusTrap" | grep -v "shared/hooks/index.ts"
```

Expected: empty. If non-empty, T2 missed a consumer — fix before proceeding.

- [ ] **Step 2: Delete hook + test**

```bash
rm packages/editor/src/shared/hooks/useFocusTrap.ts
rm packages/editor/src/shared/hooks/__tests__/useFocusTrap.test.tsx
```

- [ ] **Step 3: Update barrel**

Edit `packages/editor/src/shared/hooks/index.ts` to drop the `useFocusTrap` export line.

- [ ] **Step 4: Verify**

```bash
cd packages/editor
npx tsc --noEmit 2>&1 | grep -v "^\.\./\.\./" | grep "error TS" | wc -l   # must equal 71
bash scripts/ds-grep-gates.sh                                              # all 24 green
npx vitest run                                                              # passes minus the deleted hook test
```

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/shared/hooks/useFocusTrap.ts \
        packages/editor/src/shared/hooks/__tests__/useFocusTrap.test.tsx \
        packages/editor/src/shared/hooks/index.ts
git commit -m "feat(vibcoder-bucket-a): T3 useFocusTrap deletion (orphaned after T2)

The Popover shim was the last consumer of useFocusTrap. T2 deleted that
shim; this commit deletes the now-orphaned hook + its test + the barrel
export. Radix.Popover and Radix.Dialog (Modal) handle focus trapping
internally.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 4: Phase 4 codemod chain retirement

**Files:**
- Delete: `packages/editor/scripts/codemods/phase4/popover.ts`
- Delete: `packages/editor/scripts/codemods/phase4/__tests__/popover.codemod.test.ts`
- Delete: `packages/editor/scripts/codemods/phase4/__tests__/fixtures/popover.input.tsx`
- Delete: `packages/editor/scripts/codemods/phase4/__tests__/fixtures/popover.output.tsx`
- Modify: `packages/editor/package.json` (drop `codemod:phase4:popover` and the parent `codemod:phase4` orchestrator script)

- [ ] **Step 1: Verify only popover entry remains**

```bash
cd packages/editor && grep -E "codemod:phase4" package.json
```
Expected: only `codemod:phase4:popover` and `codemod:phase4` (which calls only popover).

- [ ] **Step 2: Delete codemod artifacts**

```bash
rm packages/editor/scripts/codemods/phase4/popover.ts \
   packages/editor/scripts/codemods/phase4/__tests__/popover.codemod.test.ts \
   packages/editor/scripts/codemods/phase4/__tests__/fixtures/popover.input.tsx \
   packages/editor/scripts/codemods/phase4/__tests__/fixtures/popover.output.tsx
```

- [ ] **Step 3: Drop package.json scripts**

Edit `packages/editor/package.json` to remove both:
- `"codemod:phase4": "pnpm codemod:phase4:popover"`
- `"codemod:phase4:popover": "..."`

- [ ] **Step 4: Verify**

```bash
cd packages/editor
ls scripts/codemods/phase4/   # should be empty (or only an empty __tests__/ dir)
grep "codemod:phase4" package.json   # must be empty
npx vitest run                         # all pass (codemod tests for popover gone)
bash scripts/ds-grep-gates.sh          # all 24 green
```

- [ ] **Step 5: Cleanup empty directories**

```bash
cd packages/editor
rmdir scripts/codemods/phase4/__tests__/fixtures 2>/dev/null || true
rmdir scripts/codemods/phase4/__tests__ 2>/dev/null || true
rmdir scripts/codemods/phase4 2>/dev/null || true
```

If any rmdir fails, the directory has untracked content — investigate before deleting.

- [ ] **Step 6: Commit**

```bash
git add packages/editor/package.json \
        packages/editor/scripts/codemods/phase4/
git commit -m "chore(vibcoder-bucket-a): T4 Phase 4 codemod toolchain officially retired

The Popover codemod was the last entry in the codemod:phase4 chain. T2
deleted the Popover shim, so the codemod no longer has a target. Removes:
  - scripts/codemods/phase4/popover.ts (codemod source)
  - scripts/codemods/phase4/__tests__/popover.codemod.test.ts
  - scripts/codemods/phase4/__tests__/fixtures/popover.{input,output}.tsx
  - package.json codemod:phase4 + codemod:phase4:popover entries
  - empty phase4/ subdirectories

Phase 4 lived for 12 hours of calendar time (M8 → M9 same day) plus the
Bucket A deferral window. Toolchain retirement is now complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 5: Bucket A close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (append Bucket A findings section)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md` (mark Bucket A SHIPPED, update status block)
- Create: `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_bucket_a_shipped_<DATE>.md`
- Update: `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` (add index entry)

- [ ] **Step 1: Update poc-findings.md**

Append a "Bucket A findings" section under the existing "Phase 5 findings" with:
- Commit table (T1-T4 SHAs)
- LOC delta (Popover wrapper rewrite + shim deletion + useFocusTrap deletion + codemod retirement)
- Note that #93 PopoverArrow now resolved
- Note that `codemod:phase4` chain is fully retired
- Note that `useFocusTrap` is no longer in the chrome codebase

- [ ] **Step 2: Update roadmap.md**

Edit the Phase 5 section: change "Bucket A — DEFERRED upstream" to "Bucket A — SHIPPED <DATE>". Update the open issues section to mark #93 closed. Add note that Phase 5 chrome arc is fully complete sans Bucket B (Tooltip/Toast/ContextMenu still pending).

- [ ] **Step 3: Write memory file**

Create `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_bucket_a_shipped_<YYYYMMDD>.md` capturing:
- HEAD SHA after T4
- Total LOC delta
- That `useFocusTrap` is no longer a chrome concept
- That Bucket B (Tooltip/Toast/ContextMenu) is the last remaining shim work in the chrome arc

Add a one-line entry to `MEMORY.md` index.

- [ ] **Step 4: Verify**

```bash
cd packages/editor
npx tsc --noEmit 2>&1 | grep -v "^\.\./\.\./" | grep "error TS" | wc -l   # equals 71
bash scripts/ds-grep-gates.sh                                              # all 24 green
npx vitest run                                                              # all pass
git log --oneline -6                                                        # T1-T4 + close-out commit visible
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md \
        docs/superpowers/specs/2026-04-26-vibcoder-position-3/roadmap.md
git commit -m "docs(vibcoder-bucket-a): T5 close-out — Bucket A SHIPPED + #93 closed

Bucket A (Popover Radix.Popover backing) shipped as T1-T4. Phase 5 chrome
arc closes with only Bucket B (Tooltip/Toast/ContextMenu) remaining,
which depends on Radix.Tooltip/Toast/ContextMenu wraps in vibcoder.

Open issue #93 (PopoverArrow) resolved — Radix.Popover.Arrow now re-exported
from vibcoder Popover compound.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Radix.Popover positioning differs from manual position math | High | T1 gallery exercises all 4 sides; T2 consumer rewrites verify each consumer in browser before commit |
| `triggerOn="hover"` consumer needs custom hover wiring | Medium | Step 2 of T2 reads each consumer; if hover used, document workaround inline before rewrite |
| `closeOnClickOutside={false}` consumer breaks | Medium | Same as above — preserve via `onPointerDownOutside={e => e.preventDefault()}` |
| Radix.Popover bundle delta material | Low | Already installed for Radix.Dialog; tree-shake will share internals. Re-measure post-T4 if concerning. |
| #93 PopoverArrow doesn't actually re-export cleanly | Low | T1 step 2 includes the re-export; gallery exercises it |
| `useFocusTrap` has hidden consumer T3 misses | Low | T3 step 1 grep is the verification gate |

---

## Success conditions

- [ ] All 4 chrome consumers use Radix-backed vibcoder Popover compound
- [ ] `src/shared/ui/Popover.tsx` shim deleted
- [ ] `src/shared/hooks/useFocusTrap.ts` deleted
- [ ] `codemod:phase4` chain retired entirely from `package.json`
- [ ] Open issue #93 (PopoverArrow) resolved via Radix.Popover.Arrow re-export
- [ ] tsc 71 stable (baseline)
- [ ] All 24 DS gates green; Gate 24 stable at 79
- [ ] Vitest passes (count will drop by ~5-15 from useFocusTrap test + adapter test + codemod test deletion)
- [ ] Memory file written; MEMORY.md index updated
- [ ] Phase 5 docs updated to reflect Bucket A SHIPPED

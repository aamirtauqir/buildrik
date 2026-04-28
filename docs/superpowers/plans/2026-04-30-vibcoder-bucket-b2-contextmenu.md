# Vibcoder Bucket B2 — ContextMenu Radix Backing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a vibcoder ContextMenu wrapper from scratch (no existing wrapper) backed by Radix.ContextMenu. Delete the Phase 4 ContextMenu shim. Migrate the 1 chrome consumer.

**Architecture:** `@radix-ui/react-context-menu` to be installed. NO existing vibcoder wrapper at `src/editor/shared/vibcoder/ContextMenu.tsx` — must be created. CSS skin: vibcoder menu CSS lives in `src/themes/components/molecules/popover.css` under `.bd-menu` (shared with Popover content menus). Bucket B2 either reuses `.bd-menu` directly OR vendors a new `.bd-context-menu` skin if visual divergence is warranted.

**Tech Stack:** React 18 + TypeScript + `@radix-ui/react-context-menu`. E2 + E3 contract waivers from Bucket A T1 apply directly — ContextMenu is anchored, opts out of OverlayMount, positioning props ARE the API.

---

## Pre-flight context

**Why now:** Bucket A and B1 demonstrate the Radix-backed compound pattern. B2 has the smallest consumer surface (1) but the largest creation cost (no existing wrapper).

**Inventory (verified 2026-04-30):**
- 1 production consumer of `@/shared/ui/ContextMenu` (Phase 4 shim) — exact path TBD via `grep -rEln "from ['\"](@/shared/ui/ContextMenu|\\.\\./.*shared/ui/ContextMenu)['\"]" src/`
- 0 vibcoder wrapper — `src/editor/shared/vibcoder/ContextMenu.{tsx,test.tsx}` do NOT exist
- 0 codemod for ContextMenu
- Radix.ContextMenu NOT installed — T1 Step 1 installs it

**Open contract questions (resolve in T1 before code):**
- Reuse `.bd-menu` CSS skin from `popover.css` OR vendor a new `.bd-context-menu` skin? Recommend reuse — same visual pattern (rounded popover panel with menu items), no functional reason to fork.
- Submenu support: Radix.ContextMenu ships `Sub`/`SubTrigger`/`SubContent`. Does the 1 chrome consumer need submenus? Step 1 of T2 verifies.
- Trigger element: Radix.ContextMenu uses native right-click via `<ContextMenuTrigger>`. The shim may have wrapped this differently — Step 1 of T2 reads consumer to compare.

---

## Task breakdown

### Task 1: Add Radix.ContextMenu dep + create vibcoder ContextMenu wrapper from scratch

**Files:**
- Modify: `packages/editor/package.json` (add `@radix-ui/react-context-menu`)
- Create: `packages/editor/src/editor/shared/vibcoder/ContextMenu.tsx` (compound wrapper)
- Create: `packages/editor/src/editor/shared/vibcoder/ContextMenu.test.tsx`
- Modify: `packages/editor/src/editor/shared/vibcoder/index.ts` (add new compound exports)
- Create: `packages/editor/src/preview/vibcoder-context-menu.tsx` (gallery)
- Possibly modify: `src/themes/components/molecules/popover.css` IF a new `.bd-context-menu` skin is required (default plan: reuse `.bd-menu`)

- [ ] **Step 1: Install Radix.ContextMenu**

```bash
cd packages/editor && npm install @radix-ui/react-context-menu
```

- [ ] **Step 2: Decide on CSS skin reuse vs. vendor**

Read `src/themes/components/molecules/popover.css` `.bd-menu` selector. Confirm visual fit. If reuse, T1 wrapper applies `bd-menu` className. If vendor, add a new `.bd-context-menu` block to the CSS file (skip if reusing).

- [ ] **Step 3: Write the new wrapper**

Compound exports:
- `ContextMenu = RadixContextMenu.Root`
- `ContextMenuTrigger = RadixContextMenu.Trigger`
- `ContextMenuPortal = RadixContextMenu.Portal`
- `ContextMenuContent` (forwardRef wrap with `bd-menu` className)
- `ContextMenuItem` (forwardRef wrap with `bd-menu-item` className — verify class exists)
- `ContextMenuSeparator`
- `ContextMenuLabel`
- `ContextMenuGroup`
- `ContextMenuSub` / `ContextMenuSubTrigger` / `ContextMenuSubContent` (only if T2 Step 1 verifies the chrome consumer needs submenus — otherwise omit)

Preserve docstring with E2 + E3 waivers (same precedent as Popover/Tooltip).

Reference shape: `src/editor/shared/vibcoder/Popover.tsx` post-Bucket-A.

- [ ] **Step 4: Write tests**

Cover:
- Right-click on trigger element opens content (`fireEvent.contextMenu`)
- Content has `bd-menu` className
- Esc dismisses
- Outside click dismisses
- ContextMenuItem fires onSelect

- [ ] **Step 5: Update vibcoder index barrel**

Add all new exports.

- [ ] **Step 6: Create gallery preview**

Demonstrate: base context-menu with 3 items + separator + label.

- [ ] **Step 7: Verify**

```bash
cd packages/editor
npx tsc --noEmit 2>&1 | grep -v "^\.\./\.\./" | grep "error TS" | wc -l   # equals 71
npx vitest run src/editor/shared/vibcoder/ContextMenu.test.tsx              # all pass
bash scripts/ds-grep-gates.sh                                              # all 25 green
```

- [ ] **Step 8: Commit** — `feat(vibcoder): create ContextMenu compound (Bucket B2 T1)`

### Task 2: Phase 4 ContextMenu shim deletion + 1 consumer rewrite

**Files:**
- Delete: `packages/editor/src/shared/ui/ContextMenu.tsx`
- Delete: `packages/editor/src/shared/ui/__tests__/ContextMenu.adapter.test.tsx` (if exists)
- Modify: `packages/editor/src/shared/ui/index.tsx` + `index.ts`, `packages/editor/src/index.ts`, green-panel allowlist
- Modify: 1 consumer file (path TBD in Step 1)

- [ ] **Step 1: Verify inventory**

```bash
cd packages/editor
grep -rEln "from ['\"](@/shared/ui/ContextMenu|\\.\\./.*shared/ui/ContextMenu)['\"]" src/
```

Capture exact path. Read consumer to determine prop usage and submenu requirement.

- [ ] **Step 2: Read consumer** to plan prop translation
- [ ] **Step 3: Rewrite consumer** to compound shape
- [ ] **Step 4: Update import** — `from "@/shared/ui/ContextMenu"` → `from "@/editor/shared/vibcoder"`
- [ ] **Step 5: Delete shim + barrel cleanup + green-panel allowlist**
- [ ] **Step 6: Verify** — no remaining shim imports, no vi.mock paths, tsc 71, gates 25/25, vitest passes
- [ ] **Step 7: Commit** — `feat(vibcoder-bucket-b2): T2 ContextMenu shim deletion + consumer hand-port`

### Task 3: Bucket B2 close-out

- [ ] **Step 1: Append Bucket B2 findings** to poc-findings.md (commit table, LOC delta, CSS skin reuse decision, submenu inclusion decision)
- [ ] **Step 2: Update roadmap** — Bucket B2 from PENDING → SHIPPED
- [ ] **Step 3: Write memory file** at home-dir path
- [ ] **Step 4: Update MEMORY.md** index entry
- [ ] **Step 5: Verify** — all baselines stable
- [ ] **Step 6: Commit** — `docs(vibcoder-bucket-b2): T3 close-out`

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `.bd-menu` skin doesn't fit context-menu visually | Medium | T1 Step 2 verifies skin reuse vs. fork. Fall back to vendoring `.bd-context-menu` if needed. |
| Single consumer relies on submenus | Medium | T2 Step 1 reads consumer; T1 wrapper conditionally exports Sub primitives |
| ContextMenu trigger semantics differ from shim (right-click only vs. long-press touch) | Low | Radix ships standard contextmenu event handling. Verify in T2 step 2. |
| Wrapper test relies on CSS class names that don't exist if skin is reused | Low | T1 Step 2 confirms which classes exist before writing tests |

---

## Success conditions

- [ ] `@radix-ui/react-context-menu` installed
- [ ] Vibcoder wrapper created at `src/editor/shared/vibcoder/ContextMenu.tsx`
- [ ] Wrapper test passes
- [ ] Gallery preview added
- [ ] 1 chrome consumer migrated to compound
- [ ] `src/shared/ui/ContextMenu.tsx` shim deleted
- [ ] tsc 71 stable
- [ ] All 25 DS gates green
- [ ] Vitest passes
- [ ] Memory file written; MEMORY.md updated
- [ ] Phase 5 docs updated to reflect B2 SHIPPED

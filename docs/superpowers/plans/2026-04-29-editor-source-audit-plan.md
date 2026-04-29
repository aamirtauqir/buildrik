# Editor Source Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catalog issues across 3 tracks (Performance, Duplication, Business Logic) for every module in `packages/editor/src/`. Output: one audit markdown per module.

**Architecture:** Read-only audit — no code changes. Each module goes through inventory → 3 track passes → compilation → commit. Output files live in `docs/superpowers/audits/`.

**Tech Stack:** Markdown, grep, git, bash (for file listing). No code compilation or test running needed.

---

## Pre-Audit Setup

### Task 0: Create Audit Output Directory

**Files:**
- Create: `docs/superpowers/audits/.gitkeep`

- [ ] **Step 0.1: Ensure output directory exists**

  ```bash
  mkdir -p docs/superpowers/audits
  touch docs/superpowers/audits/.gitkeep
  git add docs/superpowers/audits/.gitkeep
  git commit -m "chore(audit): create output directory for editor source audit"
  ```

---

## Module 1: `react/`

### Task 1: Audit `react/`

**Files:**
- Read: `packages/editor/src/react/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-react-audit.md`

- [ ] **Step 1.1: Inventory `react/` files**

  ```bash
  find packages/editor/src/react -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/react-files.txt
  wc -l /tmp/react-files.txt
  ```
  Expected: ~1 file.

- [ ] **Step 1.2: Performance pass**

  Read all files in `packages/editor/src/react/`. Flag any:
  - Inline objects/arrays/functions as props without `useMemo`/`useCallback`
  - Missing `React.memo` on expensive components
  - Memory leaks (`addEventListener` without cleanup, `setInterval` without `clearInterval`)
  Record findings in a temporary notes file (`/tmp/react-perf.md`).

- [ ] **Step 1.3: Duplication pass**

  Scan for semantic duplication within the module:
  - Duplicate type definitions
  - Copy-paste component patterns
  - Repeated event handling logic
  Record findings in `/tmp/react-dup.md`.

- [ ] **Step 1.4: Business Logic pass**

  Scan for:
  - Auth gaps or missing permission checks
  - Race conditions in async code
  - Side effects in getters
  - `any` or `as` casts bypassing validation
  Record findings in `/tmp/react-bl.md`.

- [ ] **Step 1.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-react-audit.md` with this structure:
  ```markdown
  # Audit: packages/editor/src/react/
  **Date:** 2026-04-29
  **Module:** react/
  **Files audited:** N

  ## Performance (P)
  *(list issues or "None found")*

  ## Duplication (D)
  *(list issues or "None found")*

  ## Business Logic (BL)
  *(list issues or "None found")*
  ```

  Each issue uses the entry format from the design spec:
  ```markdown
  ### [P0|P1|P2] [P|D|BL] — File:Line
  **Description:** One sentence.
  **Rule violated:** Which track definition applies.
  **Impact:** Why it matters.
  **Suggested fix:** One-line direction.
  ```

- [ ] **Step 1.6: Self-review and commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-react-audit.md
  git commit -m "audit(react): complete audit of packages/editor/src/react/"
  ```

---

## Module 2: `styles/`

### Task 2: Audit `styles/`

**Files:**
- Read: `packages/editor/src/styles/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-styles-audit.md`

- [ ] **Step 2.1: Inventory `styles/` files**

  ```bash
  find packages/editor/src/styles -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/styles-files.txt
  wc -l /tmp/styles-files.txt
  ```
  Expected: ~3 files.

- [ ] **Step 2.2: Performance pass**

  Read all files. Flag:
  - Duplicate CSS rules that could be tokenized
  - Large un-tree-shakeable imports
  - Synchronous blocking in style application
  Record in `/tmp/styles-perf.md`.

- [ ] **Step 2.3: Duplication pass**

  Scan for:
  - Duplicate CSS utility blocks
  - Repeated token values that should reference a single variable
  - Same media query patterns copy-pasted
  Record in `/tmp/styles-dup.md`.

- [ ] **Step 2.4: Business Logic pass**

  `styles/` is mostly CSS/token definitions. If any TypeScript files exist, scan for:
  - Side effects in module-level code
  - Missing error handling in dynamic style loading
  Record in `/tmp/styles-bl.md`.

- [ ] **Step 2.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-styles-audit.md` using the same structure as Task 1.

- [ ] **Step 2.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-styles-audit.md
  git commit -m "audit(styles): complete audit of packages/editor/src/styles/"
  ```

---

## Module 3: `ai/`

### Task 3: Audit `ai/`

**Files:**
- Read: `packages/editor/src/ai/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-ai-audit.md`

- [ ] **Step 3.1: Inventory `ai/` files**

  ```bash
  find packages/editor/src/ai -type f \( -name "*.ts" -o -name "*.tsx" \) | sort > /tmp/ai-files.txt
  wc -l /tmp/ai-files.txt
  ```
  Expected: ~10 files.

- [ ] **Step 3.2: Performance pass**

  Read all files. Flag:
  - Unmemoized callbacks in AI response handlers
  - Large state updates during streaming
  - Missing debounce on user input that triggers AI calls
  - Memory leaks from event listeners on streaming connections
  Record in `/tmp/ai-perf.md`.

- [ ] **Step 3.3: Duplication pass**

  Scan for:
  - Duplicate prompt construction logic
  - Repeated message formatting across files
  - Same error handling pattern copy-pasted
  Record in `/tmp/ai-dup.md`.

- [ ] **Step 3.4: Business Logic pass**

  Scan for:
  - Missing rate limiting or quota checks
  - Race conditions between concurrent AI requests
  - Input validation bypasses on prompt data
  - Side effects in pure functions
  - Missing error handling for network failures or API errors
  Record in `/tmp/ai-bl.md`.

- [ ] **Step 3.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-ai-audit.md`.

- [ ] **Step 3.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-ai-audit.md
  git commit -m "audit(ai): complete audit of packages/editor/src/ai/"
  ```

---

## Module 4: `services/`

### Task 4: Audit `services/`

**Files:**
- Read: `packages/editor/src/services/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-services-audit.md`

- [ ] **Step 4.1: Inventory `services/` files**

  ```bash
  find packages/editor/src/services -type f \( -name "*.ts" -o -name "*.tsx" \) | sort > /tmp/services-files.txt
  wc -l /tmp/services-files.txt
  ```
  Expected: ~12 files.

- [ ] **Step 4.2: Performance pass**

  Read all files. Flag:
  - Synchronous blocking in service methods
  - Unnecessary object allocations in hot paths
  - Missing caching for repeated lookups
  Record in `/tmp/services-perf.md`.

- [ ] **Step 4.3: Duplication pass**

  Scan for:
  - Duplicate validation logic across services
  - Repeated API client setup patterns
  - Same error handling code in multiple service methods
  Record in `/tmp/services-dup.md`.

- [ ] **Step 4.4: Business Logic pass**

  Scan for:
  - Missing input validation at service boundaries
  - Race conditions in stateful services
  - Side effects in getter-like functions
  - Uncaught promise rejections
  - Direct cross-layer imports (services importing from components)
  Record in `/tmp/services-bl.md`.

- [ ] **Step 4.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-services-audit.md`.

- [ ] **Step 4.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-services-audit.md
  git commit -m "audit(services): complete audit of packages/editor/src/services/"
  ```

---

## Module 5: `features/`

### Task 5: Audit `features/`

**Files:**
- Read: `packages/editor/src/features/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-features-audit.md`

- [ ] **Step 5.1: Inventory `features/` files**

  ```bash
  find packages/editor/src/features -type f \( -name "*.ts" -o -name "*.tsx" \) | sort > /tmp/features-files.txt
  wc -l /tmp/features-files.txt
  ```
  Expected: ~29 files.

- [ ] **Step 5.2: Performance pass**

  Read all files. Flag:
  - Feature flags evaluated repeatedly without memoization
  - Large flag config objects recreated each render
  - Missing lazy loading for feature-gated heavy components
  Record in `/tmp/features-perf.md`.

- [ ] **Step 5.3: Duplication pass**

  Scan for:
  - Duplicate flag definitions or checks
  - Repeated conditional rendering patterns
  - Same feature gate logic copy-pasted
  Record in `/tmp/features-dup.md`.

- [ ] **Step 5.4: Business Logic pass**

  Scan for:
  - Feature flags evaluated too late (after side effects)
  - Flags cached incorrectly (stale values)
  - Missing fallback behavior when flag is undefined
  - Client-only flag logic that should be server-validated
  Record in `/tmp/features-bl.md`.

- [ ] **Step 5.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-features-audit.md`.

- [ ] **Step 5.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-features-audit.md
  git commit -m "audit(features): complete audit of packages/editor/src/features/"
  ```

---

## Module 6: `blocks/`

### Task 6: Audit `blocks/`

**Files:**
- Read: `packages/editor/src/blocks/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-blocks-audit.md`

- [ ] **Step 6.1: Inventory `blocks/` files**

  ```bash
  find packages/editor/src/blocks -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/blocks-files.txt
  wc -l /tmp/blocks-files.txt
  ```
  Expected: ~76 files.

- [ ] **Step 6.2: Performance pass**

  Read all files. Flag:
  - Unmemoized block renderers
  - Re-renders triggered by inline prop objects in block definitions
  - Large block config objects not tree-shaken
  - DOM thrashing during block insertion
  Record in `/tmp/blocks-perf.md`.

- [ ] **Step 6.3: Duplication pass**

  Scan for:
  - Duplicate block definition structures (same shape, different names)
  - Repeated validation logic across block types
  - Copy-paste rendering logic between similar blocks
  Record in `/tmp/blocks-dup.md`.

- [ ] **Step 6.4: Business Logic pass**

  Scan for:
  - Missing validation on block data (especially user-generated content)
  - Race conditions during block insertion/deletion
  - Side effects in block registry getters
  - Direct engine imports from block rendering code
  Record in `/tmp/blocks-bl.md`.

- [ ] **Step 6.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-blocks-audit.md`.

- [ ] **Step 6.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-blocks-audit.md
  git commit -m "audit(blocks): complete audit of packages/editor/src/blocks/"
  ```

---

## Module 7: `themes/`

### Task 7: Audit `themes/`

**Files:**
- Read: `packages/editor/src/themes/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-themes-audit.md`

- [ ] **Step 7.1: Inventory `themes/` files**

  ```bash
  find packages/editor/src/themes -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/themes-files.txt
  wc -l /tmp/themes-files.txt
  ```
  Expected: ~87 files.

- [ ] **Step 7.2: Performance pass**

  Read all files. Flag:
  - Large CSS imports that aren't tree-shakeable
  - Duplicate CSS variables that could be consolidated
  - Runtime theme switching without CSS variable batching
  Record in `/tmp/themes-perf.md`.

- [ ] **Step 7.3: Duplication pass**

  Scan for:
  - Duplicate color/token definitions across theme files
  - Repeated breakpoint/media-query patterns
  - Same utility classes in multiple theme definitions
  Record in `/tmp/themes-dup.md`.

- [ ] **Step 7.4: Business Logic pass**

  Scan for:
  - Side effects in theme module initialization
  - Missing fallback colors for undefined tokens
  - Theme state managed in multiple places
  Record in `/tmp/themes-bl.md`.

- [ ] **Step 7.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-themes-audit.md`.

- [ ] **Step 7.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-themes-audit.md
  git commit -m "audit(themes): complete audit of packages/editor/src/themes/"
  ```

---

## Module 8: `preview/`

### Task 8: Audit `preview/`

**Files:**
- Read: `packages/editor/src/preview/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-preview-audit.md`

- [ ] **Step 8.1: Inventory `preview/` files**

  ```bash
  find packages/editor/src/preview -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/preview-files.txt
  wc -l /tmp/preview-files.txt
  ```
  Expected: ~128 files.

- [ ] **Step 8.2: Performance pass**

  Read all files. Flag:
  - Unmemoized preview renderers
  - Re-renders on every state change during preview
  - Missing `React.memo` on heavy preview leaf nodes
  - Synchronous DOM reads/writes without batching
  - Missing debounce on preview resize handlers
  Record in `/tmp/preview-perf.md`.

- [ ] **Step 8.3: Duplication pass**

  Scan for:
  - Duplicate preview rendering logic across file types
  - Repeated iframe/document setup code
  - Same event listener patterns copy-pasted
  Record in `/tmp/preview-dup.md`.

- [ ] **Step 8.4: Business Logic pass**

  Scan for:
  - Missing sanitization of user content in preview
  - Race conditions between preview updates and saves
  - Memory leaks from iframe/event listeners
  - Direct engine state access instead of through public API
  Record in `/tmp/preview-bl.md`.

- [ ] **Step 8.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-preview-audit.md`.

- [ ] **Step 8.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-preview-audit.md
  git commit -m "audit(preview): complete audit of packages/editor/src/preview/"
  ```

---

## Module 9: `engine/`

### Task 9: Audit `engine/`

**Files:**
- Read: `packages/editor/src/engine/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-engine-audit.md`

- [ ] **Step 9.1: Inventory `engine/` files**

  ```bash
  find packages/editor/src/engine -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/engine-files.txt
  wc -l /tmp/engine-files.txt
  ```
  Expected: ~146 files.

- [ ] **Step 9.2: Performance pass**

  Read all files. Flag:
  - Inefficient loops in element tree traversal (O(n²) where O(n) possible)
  - Missing memoization on expensive derived state
  - Synchronous blocking during export/render
  - Memory leaks from command/event history
  - Large object mutations without structural sharing
  Record in `/tmp/engine-perf.md`.

- [ ] **Step 9.3: Duplication pass**

  Scan for:
  - Duplicate element manipulation logic across engine domains
  - Repeated coordinate/math calculations
  - Same event emitter patterns copy-pasted
  - Parallel type definitions for element data
  Record in `/tmp/engine-dup.md`.

- [ ] **Step 9.4: Business Logic pass**

  Scan for:
  - Race conditions in async engine operations
  - Missing validation on command inputs
  - Side effects in pure utility functions
  - State inconsistency between element tree and selection state
  - Leaked abstractions exposing internal node structures
  Record in `/tmp/engine-bl.md`.

- [ ] **Step 9.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-engine-audit.md`.

- [ ] **Step 9.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-engine-audit.md
  git commit -m "audit(engine): complete audit of packages/editor/src/engine/"
  ```

---

## Module 10: `shared/`

### Task 10: Audit `shared/`

**Files:**
- Read: `packages/editor/src/shared/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-shared-audit.md`

- [ ] **Step 10.1: Inventory `shared/` files**

  ```bash
  find packages/editor/src/shared -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/shared-files.txt
  wc -l /tmp/shared-files.txt
  ```
  Expected: ~221 files.

- [ ] **Step 10.2: Performance pass**

  Read all files. Flag:
  - Unmemoized hooks that return new objects each call
  - Re-renders from context providers with unstable value objects
  - Missing `useCallback` on event handlers returned from hooks
  - Large utility objects not tree-shaken
  Record in `/tmp/shared-perf.md`.

- [ ] **Step 10.3: Duplication pass**

  Scan for:
  - Duplicate hooks (same logic, different names)
  - Repeated utility functions that could be merged
  - Copy-paste UI primitive patterns
  - Same validation logic in multiple form helpers
  Record in `/tmp/shared-dup.md`.

- [ ] **Step 10.4: Business Logic pass**

  Scan for:
  - Missing input validation in shared utility functions
  - Race conditions in shared state hooks
  - Side effects in hooks that should be pure
  - `any` types leaking from shared utilities
  Record in `/tmp/shared-bl.md`.

- [ ] **Step 10.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-shared-audit.md`.

- [ ] **Step 10.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-shared-audit.md
  git commit -m "audit(shared): complete audit of packages/editor/src/shared/"
  ```

---

## Module 11: `components/`

### Task 11: Audit `components/`

**Files:**
- Read: `packages/editor/src/components/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-components-audit.md`

- [ ] **Step 11.1: Inventory `components/` files**

  ```bash
  find packages/editor/src/components -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/components-files.txt
  wc -l /tmp/components-files.txt
  ```
  Expected: ~223 files.

- [ ] **Step 11.2: Performance pass**

  Read all files. Flag:
  - Unmemoized expensive components (Canvas, Panels, Media)
  - Inline objects/functions passed as props
  - Missing `React.memo` on leaf components that re-render often
  - Large component trees without code-splitting
  Record in `/tmp/components-perf.md`.

- [ ] **Step 11.3: Duplication pass**

  Scan for:
  - Copy-paste component patterns (same JSX, different prop names)
  - Duplicate prop type definitions
  - Repeated conditional rendering blocks
  - Same animation/transition logic copy-pasted
  Record in `/tmp/components-dup.md`.

- [ ] **Step 11.4: Business Logic pass**

  Scan for:
  - Missing validation on user-facing inputs
  - Race conditions in async component operations
  - Side effects in render or getter functions
  - Direct engine imports instead of through shared API
  Record in `/tmp/components-bl.md`.

- [ ] **Step 11.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-components-audit.md`.

- [ ] **Step 11.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-components-audit.md
  git commit -m "audit(components): complete audit of packages/editor/src/components/"
  ```

---

## Module 12: `project/`

### Task 12: Audit `project/`

**Files:**
- Read: `packages/editor/src/project/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-project-audit.md`

- [ ] **Step 12.1: Inventory `project/` files**

  ```bash
  find packages/editor/src/project -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/project-files.txt
  wc -l /tmp/project-files.txt
  ```
  Expected: ~467 files.

- [ ] **Step 12.2: Performance pass**

  Read all files. Flag:
  - Large data structures loaded synchronously
  - Missing virtualization for long lists
  - Unnecessary re-renders from project state changes
  Record in `/tmp/project-perf.md`.

- [ ] **Step 12.3: Duplication pass**

  Scan for:
  - Duplicate data transformation logic across project files
  - Repeated schema/type definitions for project data
  - Copy-paste UI patterns in project views
  Record in `/tmp/project-dup.md`.

- [ ] **Step 12.4: Business Logic pass**

  Scan for:
  - Missing validation on project data imports
  - Race conditions during project save/load
  - Side effects in project data getters
  Record in `/tmp/project-bl.md`.

- [ ] **Step 12.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-project-audit.md`.

- [ ] **Step 12.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-project-audit.md
  git commit -m "audit(project): complete audit of packages/editor/src/project/"
  ```

---

## Module 13: `editor/`

### Task 13: Audit `editor/`

**Files:**
- Read: `packages/editor/src/editor/**/*`
- Create: `docs/superpowers/audits/2026-04-29-editor-editor-audit.md`

- [ ] **Step 13.1: Inventory `editor/` files**

  ```bash
  find packages/editor/src/editor -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort > /tmp/editor-files.txt
  wc -l /tmp/editor-files.txt
  ```
  Expected: ~758 files.

- [ ] **Step 13.2: Performance pass**

  Read all files. Flag:
  - Unmemoized sidebar/canvas/inspector components
  - Inline style/prop objects causing re-renders
  - Missing `React.memo` on chrome leaf nodes
  - Synchronous blocking during canvas operations
  - DOM thrashing in drag/resize handlers
  - Missing debounce on search/filter inputs
  Record in `/tmp/editor-perf.md`.

- [ ] **Step 13.3: Duplication pass**

  Scan for:
  - Copy-paste panel/sidebar component patterns
  - Duplicate event handling logic across chrome areas
  - Repeated coordinate/math in drag/resize
  - Same animation/transition patterns copy-pasted
  Record in `/tmp/editor-dup.md`.

- [ ] **Step 13.4: Business Logic pass**

  Scan for:
  - Missing auth/permission checks in chrome actions
  - Race conditions in async panel operations
  - Side effects in getter-like chrome state accessors
  - Direct engine imports from chrome components
  - Missing error handling in user-facing operations
  Record in `/tmp/editor-bl.md`.

- [ ] **Step 13.5: Compile audit markdown**

  Write `docs/superpowers/audits/2026-04-29-editor-editor-audit.md`.

- [ ] **Step 13.6: Commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-editor-audit.md
  git commit -m "audit(editor): complete audit of packages/editor/src/editor/"
  ```

---

## Post-Audit Summary

### Task 14: Compile Master Summary

**Files:**
- Create: `docs/superpowers/audits/2026-04-29-editor-audit-summary.md`

- [ ] **Step 14.1: Generate summary from all module audits**

  Read all 13 module audit files. Produce a summary with:
  - Total issue count by severity (P0, P1, P2)
  - Total issue count by track (Performance, Duplication, Business Logic)
  - Top 5 modules by issue count
  - Quick-hit fixes (P0/P1 issues that are one-liners)

  ```bash
  grep -c "### P0" docs/superpowers/audits/2026-04-29-editor-*-audit.md
  grep -c "### P1" docs/superpowers/audits/2026-04-29-editor-*-audit.md
  grep -c "### P2" docs/superpowers/audits/2026-04-29-editor-*-audit.md
  ```

- [ ] **Step 14.2: Write summary markdown**

  ```markdown
  # Editor Source Audit — Master Summary
  **Date:** 2026-04-29
  **Scope:** packages/editor/src/ (13 modules, ~2,505 files)

  ## Issue Counts by Severity
  | Severity | Count |
  |----------|-------|
  | P0 | N |
  | P1 | N |
  | P2 | N |

  ## Issue Counts by Track
  | Track | Count |
  |-------|-------|
  | Performance | N |
  | Duplication | N |
  | Business Logic | N |

  ## Module Breakdown
  | Module | Files | P0 | P1 | P2 | Total |
  |--------|-------|----|----|----|-------|
  | react | 1 | ... | ... | ... | ... |
  | ... | ... | ... | ... | ... | ... |

  ## Quick-Hit Fixes (P0/P1 one-liners)
  *(list any issues that are trivial to fix)*

  ## Full Module Audits
  - [react](2026-04-29-editor-react-audit.md)
  - [styles](2026-04-29-editor-styles-audit.md)
  - ...
  ```

- [ ] **Step 14.3: Final commit**

  ```bash
  git add docs/superpowers/audits/2026-04-29-editor-audit-summary.md
  git commit -m "audit(summary): master summary of editor source audit"
  ```

---

## Self-Review Checklist

- [ ] **Spec coverage:** Every module from the design spec (react, styles, ai, services, features, blocks, themes, preview, engine, shared, components, project, editor) has a Task.
- [ ] **Placeholder scan:** No "TBD", "TODO", "implement later", "fill in details" in the plan.
- [ ] **Type consistency:** File paths match actual directory structure. Output paths consistent across all tasks.
- [ ] **No missing steps:** Every task has inventory → 3 passes → compile → commit.
- [ ] **Exact commands:** All bash commands use correct paths and flags.

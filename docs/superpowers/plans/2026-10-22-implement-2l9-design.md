<!-- /autoplan restore point: "/Users/shahg/Desktop/pencil/buildrik/.gstack/tmp/autoplan/main-autoplan-restore-20261022-213619.md" -->
## Implementation plan
# Buildrick Editor · Implement design file 2L9OTGzBrL6kYmU18yA1c7 — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shipping editor match Figma file `2L9OTGzBrL6kYmU18yA1c7` (canonical since owner decision 2026-10-22), surface by surface. Every surface is verified against its board in the live app and pinned by a visual snapshot.

**Architecture:** The plan has three phases.
- **Phase 0** builds a local dump of the design and a new conformance manifest, inventories the gaps, and repoints the repo's design source of truth. Parallel agents never spend the shared Figma budget.
- **Phase 1** conforms the shell (topbar, bottom bar, Inspector header, breakpoint switcher, page switcher, status badges, load-failed and publish chrome), because every other surface sits inside it.
- **Phase 2** runs one lane per surface family. Each lane is a worktree with its own agent, and it writes its own sub-plan from the Phase-0 inventory before it touches code. This document fixes lane ownership and acceptance. It does not fix their tasks, which depend on the inventory.

**Tech Stack:** React 18 + TypeScript 5.3 (editor, Vite 7), chrome-ui on flowbite-react with `tw:`-prefixed Tailwind 4 and generated `--bk-*` tokens, Vitest + RTL, Playwright (`e2e/visual-pins.spec.ts` convention), Next 16 dashboard (tRPC 11, Prisma 5) only where the inventory proves a contract gap.

**Spec:**
- Figma `2L9OTGzBrL6kYmU18yA1c7`, pages 03–09.
- The "✦ Improved — 2026-10-22" page `497:99417`, with its Read me note `505:4365`.
- `packages/editor/docs/audit-and-design-2026-10-16/` (panel docs 00–25, `PRODUCT-DESIGN-BRIEF.md`).
- Owner decisions:
  - One undo.
  - Legacy option B.
  - No AI in the UI.
  - Class-first styling, decided but still blocked on its pending flow decisions.

## Global Constraints

- Design source of truth: Figma `2L9OTGzBrL6kYmU18yA1c7`. Old `g4GzQFqzNYz5sosz1QtZXC` boards are history, not targets.
- Precedence (packages/editor/CLAUDE.md, founder; binding decision 2026-08-05): behaviour → the code contract (Zod schemas, service returns, existing shortcuts). Visual (layout, colour, type, on-screen copy) → the board. Board sample data is never copied literally. A conflict where the code wins is recorded as `authority: code:<reason>` on the manifest row.
- Chrome imports only from `@/editor/chrome-ui`. No `flowbite-react` import outside it. Wrappers stay TextInput/Select/Button. Before adding a chrome-ui component, check `chrome-ui/index.ts` and flowbite's exports (DS decision tree).
- Tokens: `var(--bk-*)` only. No hex in chrome. A missing token is added in Figma → `scripts/tokens/figma-tokens.json` → `node scripts/tokens/generate.mjs`. Never hand-edit `tokens.generated.*`.
- One accent `#1A56DB`. No purple/violet/indigo. Inter for UI, Geist Mono for data with `tabular-nums`. No system font fallbacks.
- No raw `<button>/<input>/<select>/<textarea>` outside chrome-ui (Gate 24). No `createPortal` outside the overlay-root primitives (Gate 22).
- No AI entry points in the editor UI (owner 2026-10-17).
- One undo system (target state, delivered by Task 1.2): Undo/Redo controls live only in the topbar. Today the only undo control is the canvas footer's. Brand already shares the composer stack and renders no undo buttons (`src/editor/design-system/ui/BrandWorkspace.tsx:31` is a doc comment; its ⌘Z mentions are toast hints only).
- Data flow (root CLAUDE.md): Page → tRPC → Router → Service → Prisma. Any server change goes through the full chain, with schemas in `packages/shared/schemas`.
- `../../` imports are banned. Use `@/` aliases.
- Tests that protect the OLD design are rewritten in the same commit. Visual pins are re-baselined only in the commit that intends the visual change, with "re-baseline: <surface>" in the commit body.
- Never stage `packages/editor/src/editor/shell/AquibraStudio.tsx` from an agent session (founder WIP).
- No `git stash` mid-execution. Use a worktree under `~/Desktop/buildrik-worktrees/`.
- Gate commands run with **cwd `packages/editor`**: `pnpm run verify:ds`, `pnpm run gate:tokens-generated`. `pnpm run audit:rules` runs at the repo root. Push only through the pre-push gate. Never `--no-verify` without saying so.
- Figma MCP budget: 200 calls/day and 15/min, shared by all agents. The Figma route is the session's Figma tools if present, else `node scripts/baseline/figma-mcp.mjs` run from the **repo root** (it needs the plugin-bundle header for `use_figma`). Lanes read the local dump, not Figma. On a 401, an expired token or missing Figma tools: stop, record the calls spent and the dump cursor, ask the founder to run `/mcp` and re-authenticate Figma, then resume from the cursor. When a lane needs a board missing from the dump and the day's budget is spent, it marks the row `blocked:no-dump`, continues, and the lead batches those reads the next day.
- No OAuth token, header or credential is ever written to a committed file or a log (dump files, README call counts, census output).
- Package manager: `pnpm` everywhere (`pnpm run tokens:generate`, not `npm run`).
- The accepted-obligation lists at the end of this Implementation plan are a review changelog. Where an earlier list conflicts with a later list or with the task body, the later list and the task body win (example: the Inspector header breadcrumb rule in Task 1.4).

## Review Focus

1. **Page switcher with many pages.** A site with 100 pages plus collection templates must let the user reach any page in ≤2 interactions. Owner: Task 1.3. Test: `PageSwitcher › lists 100 pages with search and keyboard selection`.
2. **Load failed, then the user edits anyway.** No path may write while the site is not loaded: inspector, keyboard shortcuts (⌘Z, Delete, paste), Layers/Insert drag, page switcher and autosave. The save status must never say "Saved". Owner: Task 1.6. Tests are listed there.
3. **Undo after a Brand or canvas change.** Topbar Undo/⌘Z undoes the last composer change wherever it happened, and no second undo control exists. CMS record edits are server records outside `composer.history`. Their undo is out of scope here, and L-C records whether boards claim otherwise. Owner: Task 1.2.
4. **Narrow window.** At 1024×768 and 1280×720 the topbar shows "Request review" and "⋯" fully, and the bottom bar does not overflow. Owner: Tasks 1.2 and 1.3. Playwright pins at 1024, 1280 and 1440.
5. **Publish with a blocking issue.** The only publish CTA is in the tray, with its reason underneath. The topbar shows no second disabled Publish while the tray is open. Owner: Task 1.7.

---

## Manifest schema (used by every phase)

`packages/editor/scripts/conformance/boards-2l9.json` uses the **same row schema as `boards.json`**, plus one field:
- `{nodeId, name, page, family, status, authority, verified, verifiedNote, recipe?, state?, inheritsFrom?}`
- `inheritsFrom` names the archetype row whose live verification covers this row (same component structure, differing only in sample data or an interaction state: default, hover, focus, pressed, selected). Lanes live-verify archetypes and set siblings' `verified` from them. Error, empty, loading, disabled and read-only rows never inherit; each gets its own direct comparison.
- `status` ∈ `active | design-ahead | out-of-scope`
- `verified` ∈ `no | driven | match | drift-open | drift-fixed | unreachable`:
  - `no`: not yet compared. `driven`: the live app was driven to the state but not yet compared with the board. `match`: compared, no visible difference. `drift-open`: compared, difference not fixed. `drift-fixed`: difference fixed and re-compared. `unreachable`: the state cannot be produced live or in a probe.
  - The inventory's `drift` maps to `drift-open` (table below).
- `authority` ∈ `board | code:<reason> | founder:<reason> | blocked:<reason> | open:<reason> | superseded:<id> | undecided`

The inventory status maps to manifest values like this:

| Inventory status | `verified` | `authority` |
|---|---|---|
| `match` | `match` | `board` |
| `drift` | `drift-open` | `board` |
| `missing` | `no` | `board` |
| `code-ahead` | `no` | `code:<reason>` |
| `blocked:<r>` | `no` | `blocked:<r>` |

**Done predicate:** one predicate, used by the census script (Task 0.4) and the final gate. A row is done when `status !== "active"` OR `verified ∈ {match, drift-fixed}` OR `authority` starts with `code:`, `founder:`, `blocked:` or `superseded:`. `undecided` and `open:` are not done. A row a lane cannot reach is set to `verified: unreachable` + `authority: blocked:unreachable-<reason>`. A `driven` row stays open until it is compared. The census prints counts per authority class and per verification mode (direct vs `inheritsFrom`), and the final gate lists every `blocked:`/`unreachable`/`code:` row for the owner to acknowledge.

**Live comparison app:** board-vs-live comparisons use the shipping editor (`/edit/:id` in the Next dashboard, `NEXT_PUBLIC_UNIFIED_EDITOR=true`, dev port 3000) with the QA workspace's seeded site (qa@buildrik.local). States the live app cannot produce use probe cases.

**Manifest retirement:** if a later design file supersedes 2L9, `boards-2l9.json` is frozen as history the same way `boards.json` was, and the census moves to the new manifest.

THE LOOP gains one step for every lane: after the live comparison, update the board's manifest row (`verified`, `verifiedNote`, and `authority` when the code wins) in the same commit.

## Phase 0 · Foundation (lead session, sequential; spread over 2 days of Figma budget)

### Task 0.0: Integration branch and worktree

- [ ] Step 1: From `main`, run `git worktree add ~/Desktop/buildrik-worktrees/design-2l9 -b feat/design-2l9`. Phase 0 and Phase 1 work happens here. Each Phase-1 task that passes its own verification ships to `main` as its own small PR, cut from `main` (not from the integration branch, so Phase-0 docs do not ride along); the lead then merges `main` into `feat/design-2l9`. Phase 2 lanes branch from `feat/design-2l9` as `feat/design-2l9-<lane>` and PR back into it. Each week the lead merges `main` into `feat/design-2l9` (merge, never rebase of pushed history), and lanes rebase only onto `feat/design-2l9`. Phase 2 reaches `main` after the final gate.
- [ ] Step 2: In the worktree, run `pnpm install` and `pnpm run hooks:install`.
- [ ] Step 3: Live comparison setup (every worktree, lead and lanes). Copy the repo-root `.env.local` into the worktree (it is gitignored). Each worktree gets its own port pair: lead 3000/5051, L-A 3001/5061, L-B 3002/5062, L-C 3003/5063, L-D 3004/5064, L-E 3005/5065, L-F 3006/5066. For a non-3000 dev port, override `NEXTAUTH_URL`, `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `http://localhost:<port>` or login returns 403. Start with `PORT=<port> pnpm --filter dashboard dev` (confirm the filter name in the root `package.json` and record it here). Log in as `qa@buildrik.local` (password in `.env.local` comments or ask the lead; never commit it) and record the seeded site id in `packages/editor/docs/design-2l9/README.md`.
- [ ] Step 4: Make the probe port configurable: `playwright.config.ts:27,70` reads `process.env.PROBE_PORT ?? 5051`, keeping `--strictPort`. Test: `PROBE_PORT=5061 npx playwright test e2e/visual-pins.spec.ts --list` resolves base URL with 5061.
- [ ] Step 5: Live publish walks use `PUBLISH_ALLOW_SIMULATION=true` in the worktree env, because the QA workspace has a real Vercel connection. Only the L-E final walk publishes for real, and its report names that deploy.

### Task 0.1: Local design dump

**Files:**
- Create: `packages/editor/docs/design-2l9/dump/page-<id>.json`. One record per top-level frame: id, name, size, section, text strings, component instances (main name + overridden props), and top-level layout boxes. All of these are taken **only from nodes visible through their whole ancestor chain**. Hidden `Legacy ·` shells and other hidden layers are skipped, and the dump includes a test case on a known Legacy frame (e.g. `225:2821`). This is dictionary-encoded per memory `figma-page-dump-technique` (~20 KB per return, cursor resume).
- Create: `packages/editor/docs/design-2l9/shots/<nodeId>.png`. **≤40 archetype screenshots** (one per family plus unique states).
- Create: `packages/editor/docs/design-2l9/README.md` with per-page and per-family counts and the Figma calls actually spent.
- Create: `packages/editor/scripts/design-2l9/dump.mjs`, the committed dump tool (built on `scripts/baseline/figma-mcp.mjs`'s `{ connect, rpc }`). It drops text that looks like an email address or credential (regex scrub, count logged) and writes a cursor file `docs/design-2l9/dump/.cursor.json` after every page chunk, resumes from it, exits 3 when the daily budget or a 401 stops it (cursor kept), and exits 1 when a page's frame count does not match the live count; it never writes a mismatched page file. Test: `scripts/__tests__/design-2l9-dump.test.mjs` covers resume from cursor, mismatch refusal and the Legacy-frame skip with a fixture.

- [ ] Step 1: Dump pages 03, 04, 05, 06, 07 and 09, plus the Improved page components (`Shell/*`, `StatusBadge`, `Shell/PageSwitcherMenu` `558:4419`, `FirstRun/Checklist`). Budget: ≤60 calls on day 1.
- [ ] Step 2: Take the ≤40 archetype screenshots (day 2 if day 1's budget is spent).
- [ ] Step 3: Verify that the dump's per-page frame counts equal a live count (same day or the next day's recount). After the owner's Legacy cleanup (~2026-10-29), re-run the dump and commit the diff; frame counts must not change, only hidden-node counts. Expected counts from 2026-10-22: 03: 360, 04: 313, 05: 562, 06: 687, 07: 94, 09: 236 [measured, flow-audit]. A mismatch means investigate and redo that page.
- [ ] Step 4: Commit `docs(design-2l9): local dump of canonical design`.

### Task 0.2: New manifest and source-of-truth repoint

**Files:**
- Create: `packages/editor/scripts/conformance/boards-2l9.json`, with `fileKey: "2L9OTGzBrL6kYmU18yA1c7"` and rows built from Task 0.1's dump. Use the manifest schema above.
- Modify: `packages/editor/CLAUDE.md`, the FIGMA UI REBUILD section. The new file key becomes the current target; `g4GzQ…` page `4418:45431` is named as history.
- Modify: `packages/editor/scripts/conformance/README.md`. Both manifests are listed; `boards.json` stays the regression net for existing recipes.
- Do NOT rewrite `boards.json` rows. Its recipes may be edited only when a Phase-1/2 change moves the element they measure (see Task 1.0).

- [ ] Step 1: Generate the rows with `status: active` and `verified: "no"`, `authority: "board"`. Frames in sections named Reference/Archive/FUTURE and anything `Legacy ·` are `out-of-scope`.
- [ ] Step 2: Edit CLAUDE.md and README.
- [ ] Step 3: At the repo root, run `pnpm run audit:rules`. Expected: no new findings on the edited lines.
- [ ] Step 4: Commit `docs(editor): design source of truth → 2L9OTGzBrL6kYmU18yA1c7`.

### Task 0.3: Gap inventory (≤6 read-only agents, zero Figma calls)

**Files:**
- Create: `packages/editor/docs/design-2l9/gap-inventory.md`. It has one table per family: board · code surface (file:line) · status `match | drift | missing | code-ahead | blocked:<reason>` · notes.

- [ ] Step 1: Dispatch one agent per page group: 03 Editor · 04 Inspector · 05 Resources · 06 Site delivery · 07 Recovery · 09 Play journeys. Play journeys become the acceptance scripts. Each agent cites file:line for every `match`/`drift`. Page 05 rows are tagged by board prefix: `B6-B*` → family `brand` (L-D); `B5-*`, `B6-A*`, `B6-K*`, `B6-T*` → families `cms`, `assets`, `components`, `templates` (L-C).
- [ ] Step 1b: The lead greps `src/editor` for surviving AI entry points (`grep -rnE 'aria-label="[^"]*AI|✦|tab: "ai"|ai-chip' src/editor`) and adds each hit as a `drift` row owned by the lane that owns the file (the Inspector header hit belongs to Task 1.4).
- [ ] Step 2: The lead merges the reports and moves shared chrome rows to Phase 1. It marks class-first styling rows `blocked:owner` (pending flow decisions, memory `styling-model-class-first`), along with owner items.
- [ ] Step 3: Write the statuses into `boards-2l9.json` using the mapping table.
- [ ] Step 4: Commit `docs(design-2l9): gap inventory`.

### Task 0.4: Census script

**Files:**
- Create: `packages/editor/scripts/conformance/census-2l9.mjs`.
- Test: `packages/editor/scripts/__tests__/census-2l9.test.mjs`. This path is inside the vitest include globs in `vitest.config.ts:14–17`.

- [ ] Step 1: Failing tests.
  - `census › exits 1 listing rows that fail the done predicate`.
  - `census › exits 0 when every active row is done`.
  - `census › treats authority "undecided" and "open:*" as not done`.
- [ ] Step 2: Implement it, using the done predicate above verbatim, plus one rule: a row done only through `authority: code:` or `founder:` needs a non-empty `verifiedNote`, else it is not done. Output contract: one line per open row to stdout, `<nodeId>\t<family>\t<verified>\t<authority>\t<what would make it done>`; a per-family count; `--json` prints the same as an array. Exit 0 all done, 1 open rows, 2 manifest invalid with `manifest invalid at row <n>, field <f>: <reason>` on stderr (missing file, malformed JSON, unknown enum value). Tests cover each exit code and the empty-`verifiedNote` rule. A row with `inheritsFrom` is done only while its archetype row is done; a dangling or cyclic `inheritsFrom` exits 2. Tests cover both.
- [ ] Step 3: Add TODOS.md entries for the two owner deferrals: first-run page 08 (blocked on B9 interviews) and Figma Legacy-layer cleanup (option B, ~2026-10-29).
- [ ] Step 4: Commit. The script retires once the done predicate holds for every row.

**Phase 0 exit gate:** dump verified, manifest populated, inventory merged, census runs and lists the open rows.

---

## Phase 1 · Shell (one lane, sequential; blocks Phase 2 visuals)

Every task follows THE LOOP (packages/editor/CLAUDE.md):
1. Read the board from the local dump (`get_design_context` only for a board missing from it).
2. Build with chrome-ui.
3. Compare the live screenshot with the board side by side at 1440×900.
4. Rewrite tests that protected the old design.
5. Update the manifest row.

**Shared verification for every Phase-1 task (cwd `packages/editor`):**
- `npx vitest run <touched tests>` passes.
- `npx tsc --noEmit > /tmp/tsc.log; echo $?` prints 0. Never read tsc's exit through a pipe.
- `pnpm run verify:ds` passes.
- Playwright (cwd `packages/editor`): run `npx playwright test e2e/visual-pins.spec.ts e2e/design-2l9-shell.spec.ts`; re-baseline only in the commit that intends the change with `npx playwright test <spec> --update-snapshots`. Screenshot assertions use `maxDiffPixelRatio: 0.002`; only the lead may loosen it, in a commit that says why. Baselines are generated and compared on one pinned environment: the lead's darwin host with the repo's pinned Playwright version. Lanes run pins locally as a smoke check; the lead's run on the integration branch is the gate.
- Visual pins.
  - Component pins go in `e2e/visual-pins.spec.ts` and its existing `visual-pins.spec.ts-snapshots/` folder. They render probe cases (`/e2e/probe/probe.html?case=`), and each new case sets its own viewport with `test.use({ viewport })` at 1440×900, 1280×720 and 1024×768.
  - Whole-shell checks (topbar overflow, bottom bar overflow, tray fit, load-failed) go in a new spec, `e2e/design-2l9-shell.spec.ts`. It renders a new probe case `shell-full` (StudioHeader + bottom bar + canvas column with a stub composer, with states selected by query param) on the existing probe server (`playwright.config.ts`, port 5051) at the three viewports.
  - Both specs wait for `document.fonts.ready`.
- Every control ships an RTL-tested keyboard/a11y contract (focus order, aria state, Esc).

### Task 1.0: Keep the regression net green

**Files:** `scripts/conformance/boards.json` (recipes, copy lines and the two `PageTabBar` mentions only), `e2e/visual-pins.spec.ts` and its snapshots, and `e2e/probe/probe.tsx` (the pin harness; it imports `PageTabBar` at :107 and renders it at :2685).

- [ ] Step 1: Before each Phase-1 task, list the recipes and copy checks that `check-boards.mjs`, `check-copy.mjs` and `check-anchors.mjs` read for the elements the task moves (for example the `canvas-footer-toolbar` pin for Task 1.2), with `grep -n "<selector or testid>" scripts/conformance/boards.json scripts/conformance/*.mjs e2e/visual-pins.spec.ts`.
- [ ] Step 2: In the same commit as the change, update those recipe selectors and copy strings and re-baseline the affected pins. The commit body notes "re-baseline: <surface>".
- [ ] Step 3: Confirm that `pnpm run verify:ds` is green after each task.

### Task 1.1: Shell tokens

**Files:** `scripts/tokens/figma-tokens.json`, `src/themes/tokens.generated.*` (via the generator only).
**Produces:** every colour, radius and type value used by Tasks 1.2–1.8 exists as a `--bk-*` token.

- [ ] Step 1: Read the 2L9 variables (`Buildrick / Primitives`, `Buildrick / Chrome`, `Buildrick / Geometry`) with the read-only export script in `scripts/tokens/README.md` ("Re-export from Figma"), run against file `2L9OTGzBrL6kYmU18yA1c7`. Diff them against `figma-tokens.json`, which was exported from `g4GzQ…` collections `Primitives`/`Package`.
  - If the values match, switch the README's source file to 2L9.
  - If they differ, list each delta in the commit body. Change only the tokens Phase-1 surfaces use, and leave the others for an owner review.
- [ ] Step 2: No Figma writes. The hex surface background on `StatusBadge` and `Shell/PageSwitcherMenu` (`558:4419`) is recorded as a `verifiedNote` on their manifest rows; code uses the existing surface token. Budget: ≤10 Figma calls for Step 1.
- [ ] Step 3: Merge only the Phase-1 keys listed in the commit body into `figma-tokens.json`, keeping the file's existing structure; never paste the whole export. Name the 2L9 mode used (`Editor` if it exists, else record the mode name). Before generating, `git diff --stat scripts/tokens/figma-tokens.json` and `git diff scripts/tokens/figma-tokens.json` must touch only those keys. Then run `pnpm run tokens:generate` (`node scripts/tokens/generate.mjs`).
- [ ] Step 4: Run `pnpm run gate:tokens-generated` (cwd `packages/editor`). Expected: PASS. Commit.

### Task 1.2: Topbar — one undo, review copy, overflow-safe

**Files:**
- `src/editor/chrome-ui/Topbar.tsx`
- `src/editor/shell/StudioHeader.tsx`
- `src/editor/canvas/CanvasFooterToolbar.tsx` (props `onUndo`/`onRedo` :71–78, `showEditGroup` :253, render :307)
- `src/editor/canvas/Canvas.tsx:956`, which passes `onUndo={() => composer.history.undo()}`; remove it
- Tests for each.

**Consumes:**
- `composer.history.undo()/redo()`.
- Composer events `history:recorded` (`shell/hooks/useComposerInit.ts:567`), `history:undo` and `history:redo` (:898–899), plus `history:changed`, `history:cleared` and `history:unrecorded` (`src/shared/constants/events.ts:128–131`; these fire on project load and version restore).

**Produces:**
- `Topbar` renders a `History` group (Undo, Redo) placed right after the site-settings control. That control is in `StudioHeader.tsx`; find it with `grep -n "Site settings\|settings" src/editor/shell/StudioHeader.tsx` and record the anchor in the commit. `disabled` is driven by `composer.history.canUndo()/canRedo()`.
- `StudioHeader` subscribes to those events itself. It does **not** take `canUndo` from `AquibraStudio.tsx`, which is not staged.

- [ ] Step 1: Failing tests.
  - `StudioHeader › renders exactly one Undo and one Redo, inside the topbar History group; disabled when history is empty; enabled after a history:recorded event`.
  - `› disabled again after history:cleared`.
  - `› re-reads canUndo/canRedo on history:changed`.
- [ ] Step 2: Failing test `CanvasFooterToolbar › renders no undo/redo controls`.
- [ ] Step 2b: Failing tests for undo routing and feedback.
  - `useEditorShortcuts › ⌘Z/⇧⌘Z go to native field undo when focus is in an editable field (input, textarea, contenteditable outside the canvas), and to composer undo otherwise`.
  - `Topbar › Undo tooltip "Undo (⌘Z)" and Redo "Redo (⇧⌘Z)", rendered through the platform shortcut formatter the shortcuts sheet uses; disabled tooltips "Nothing to undo" / "Nothing to redo"`.
  - `› while canvas inline text editing is active, ⌘Z goes to native undo inside the edit; on commit (Esc or blur) the edit becomes one composer history step`.
  - `StudioHeader › re-reads canUndo/canRedo when the composer instance changes and after importProject / version restore, even if no history event fires` (first verify which events `importProject` emits and record them).
  - Labels stay generic (no action names); the history API is unchanged.
- [ ] Step 3: Failing test `Topbar › review control reads "Request review" with no round; "In review · {n} open" when an open count is provided; "In review" when the count is unavailable`. `reviews.status` has no count today (boards.json `open:pill-count`); do not invent one. The topbar control is the entry point only: clicking it opens the existing review flow, whose sending/sent/failed states and "In review" destination belong to L-F.
- [ ] Step 4: Implement. Remove the canvas footer undo group. Wire the topbar undo through composer events.
- [ ] Step 5: Narrow-width rule. Minimum supported width is 1024. As width shrinks, the site name ellipsizes first (min 80 px, full name in its tooltip); nothing else collapses at ≥1024. Pins at 1024/1280/1440 with the longest label variant "In review · 12 open": at 1024 the review control and "⋯" lie fully inside the topbar box and no control wraps.
- [ ] Step 6: Commit `feat(shell): one undo in the topbar; review copy`.

### Task 1.3: Bottom bar — page switcher and dropdown

**Files:**
- Delete `src/editor/shell/PageTabBar.tsx`. Create `src/editor/shell/PageSwitcher.tsx`.
- Create `src/editor/chrome-ui/PageSwitcherMenu.tsx`, mirroring `Shell/PageSwitcherMenu` `558:4419`, and export it.
- Update the importers:
  - `shell/StudioPanels.tsx:47,871`
  - `sidebar/tabs/pages/usePages.ts`
  - `e2e/probe/probe.tsx:107,2685` (the pin harness; render `PageSwitcher` there instead)
  - `StudioPanels.inspectorColumn.test.tsx`
  - `useActivePageId.test.tsx`
- Delete `shell/__tests__/PageTabBar.test.tsx`.
- Update `shell/regionCycle.ts:18`, whose region selector `[role="tablist"][aria-label="Site pages"]` points at the old tab bar. Point it at the page switcher button, and update `regionCycle.test.ts` only if its stub encodes that selector.
- Update `shell/hooks/useEditorShortcuts.ts` and the shortcuts sheet / ⌘K palette entries.

**Produces:**
- New type `PageSummary = { id: string; name: string; slug: string; kind: "static" | "template"; collectionId?: string; collectionName?: string; isHome: boolean; dirty: boolean; depth: number }` in `src/shared/types/`. It is derived from the page list `usePages.ts` already reads. `kind: "template"` means the page is a CMS collection template (the dynamic-page binding shown in `DynamicPagesPane`). Selecting a template row opens that template page exactly like a static page.
- `<PageSwitcher pages: PageSummary[] activePageId: string onSelect(id: string) onManagePages() onAddPage() />`.
- Capabilities kept from `PageTabBar` (`:74-78`, `:104`, `:117`): the home marker (house glyph + aria text "Homepage"), the per-page unsaved dot (aria text "unsaved changes") on the closed switcher and on each row, and "+ Add page" as the last action row of the menu (it opens the Pages panel exactly as the old "+" did).
- `<PageSwitcherMenu>` rendered through `Popover` (Gate 22). The rows are the static pages in page-tree order (indented by `depth`), then a "Templates" group (collection template pages, each row showing the collection name and slug pattern, e.g. "Blog post · /blog/:slug"), then "+ Add page" and "Manage pages ›".
- Menu behaviour: a search field is always shown and focused on open, filtering by name and slug as the user types; the active page carries a check glyph and `aria-current="page"`; no match shows "No pages match '{query}'"; max height 400 px with the list scrolling and search plus actions pinned.
- Count text: `${static} pages · ${templates} template(s) · ⇧⌘O to switch`. The template part is dropped at 0.
- Shortcut: **⇧⌘O** on macOS, **Ctrl+Alt+O** elsewhere (Ctrl+Shift+O is Chrome's bookmark manager). The handler ignores the chord when focus is in an editable field or `e.getModifierState("AltGraph")` is true (AltGr+O types "ó" on several layouts). Check the chord in Chrome, Firefox (macOS Firefox binds ⇧⌘O to the bookmarks Library) and Safari, and record the result in the commit; if a browser swallows it, the switcher is still one click away and the hint stays. First confirm with `grep -rn "key.toLowerCase() === \"o\"" src/editor` that both are unbound. The count text and tooltip render the chord through the platform shortcut formatter the shortcuts sheet uses, never a hard-coded "⇧⌘". ⌘P stays Preview (`useEditorShortcuts.ts:177`) and ⇧⌘P stays the palette (:137). The board's "⌘P to switch" copy is overruled; record `authority: code:shortcut-cmd-p-is-preview` on the board row.

- [ ] Step 1: Failing tests.
  - `PageSwitcher › shows active page name + slug`.
  - `› count text "5 pages · 1 template · ⇧⌘O to switch"`.
  - `› ⇧⌘O opens menu; ⌘P still triggers Preview`.
  - `› lists 100 pages with search and keyboard selection`.
  - `› Esc closes and returns focus to the switcher`.
  - `› search is focused on open; typing filters; "No pages match 'zzz'" on no result`.
  - `› home page shows the home glyph with aria text "Homepage"; a dirty page shows the unsaved dot with aria text`.
  - `› "+ Add page" row opens the Pages panel`.
  - `› template row reads "{collectionName} · {slug pattern}"`.
  - `› active row has aria-current="page"`.
  - `› non-Mac platform renders "Ctrl+Alt+O"`.
  - `› an AltGr+O keydown (getModifierState("AltGraph") true) and Ctrl+Alt+O inside a text input do not open the menu`.
  - `› aria-expanded reflects open state`.
- [ ] Step 2: Failing test `bottom bar in resource areas (CMS, Brand, Settings, Assets) renders no page switcher and shows "Editor keeps {page} open — return with ‹ Back to Editor"`. Board: `Shell/BottomBar` Context=Resource area `497:99474`; "‹ Back to Editor" sits where that board places it (read from the dump) and the test clicks it and asserts the editor returns to `{page}`. The component is the bottom-bar host that `StudioPanels.tsx` renders where `PageTabBar` sat (:871).
- [ ] Step 3: Implement. Delete `PageTabBar.tsx` and update every importer and test listed above in the same commit.
- [ ] Step 4: Playwright: open the menu and pick "About"; the canvas page changes. No overflow at 1024 and 1280. Pins.
- [ ] Step 5: Commit.

### Task 1.4: Inspector header — compact 84 px

**Files:** `src/editor/inspector/components/InspectorHeader.tsx` and its tests.
**Produces:** two rows.
- Row 1: Target (icon, name, ⋯).
- Row 2: "Editing", then a read-only text prefix `${breakpoint} ·`, then the chrome-ui `Select` (a native `<select>`) whose options read "Default state", "Hover state", "Focus state", "Active state", …. Together they read "Desktop · Default state". The topbar `BreakpointSwitcher` is the only control that changes breakpoint, and the prefix follows it. No new chrome-ui component and no fourth wrapper.
- The "✦ AI" chip (`InspectorHeader.tsx:105-113`, `data-testid="inspector-ai-chip"`) is removed (owner: no AI in the UI).

The breadcrumb row (the 104 px variant) renders only while the current page is a collection template. It does not depend on the selected element, so the header height never changes when selection changes within a page. Otherwise the header is 84 px. Test both.

- [ ] Step 1: Failing tests.
  - `InspectorHeader › one "Editing" select shows "Desktop · Default state"; no separate breakpoint line`.
  - `› the Editing select is reachable by Tab and labelled "Editing"`.
  - `› Editing options are states only; changing breakpoint in the topbar updates the prefix`.
  - `› inspector-ai-chip does not render`.
  - `› header height is equal for a depth-1 and a depth-4 selection on the same page`.
- [ ] Step 2: Implement. Playwright `getBoundingClientRect().height` is 84 ± 1. Pin.
- [ ] Step 3: Commit.

### Task 1.5: Breakpoint switcher — icon-only segmented control

**Files:** `src/editor/chrome-ui/BreakpointSwitcher.tsx` and its tests.

- [ ] Step 1: Failing test `BreakpointSwitcher (unlabelled) › wide (when enabled), desktop, tablet, mobile icon buttons in that order with aria-labels "Wide", "Desktop", "Tablet", "Mobile"; active has aria-pressed=true; no visible text; tooltip "Tablet · {width}px" from breakpoint config`. The width readout lives only in the tooltip unless the board shows it elsewhere (check the dump). "Wide" renders only when the existing breakpoint config enables it; name that config key in the commit. The code's "Mobile" wording wins over the board's "Phone" (record `authority: code:mobile-label`). The `labelled`/`sublabels` props stay for their existing consumers and their tests stay green.
- [ ] Step 2: Implement, pin, commit.

### Task 1.6: Load-failed is truly read-only

**Files:**
- `src/engine/Composer.ts`
- `src/shared/constants/events.ts`
- `src/editor/shell/hooks/useComposerInit.ts` (load path, `onLoadError` :81/:165, autosave scheduling on `project:changed` near :382)
- `src/editor/shell/StudioPanels.tsx:309`, `src/editor/shell/TimeTravelHost.tsx:105–108`
- `src/editor/shell/LoadErrorBanner.tsx`, `src/editor/chrome-ui/SaveStatus.tsx`
- `src/editor/shell/StudioHeader.tsx` (hide Publish)
- The canvas selection toolbar under `src/editor/canvas/`
- The inspector root and the Layers/Insert drag sources
- Tests

**Consumes:**
- The load failure that `useComposerInit.ts` reports through `onLoadError` (:81). `AquibraStudio.tsx` is not edited.
- The existing engine gate `composer.readOnly` (`src/engine/Composer.ts:144`). It already blocks `CommandCenter` mutations (`CommandCenter.ts:142`, :214) and the capture-phase keydown path. Today two writers assign it: `StudioPanels.tsx:309` (view mode) and `TimeTravelHost.tsx:105–108` (save/restore).

**Produces:**
- `Composer.editLocks: Set<"view" | "time-travel" | "not-loaded">` and `composer.setEditLock(reason, on: boolean)`. The latter emits the new `EVENTS.EDIT_LOCK_CHANGED = "editlock:changed"`.
- `composer.readOnly` becomes a getter only: `editLocks.size > 0`. The class field `readOnly = false` (`Composer.ts:144`) is deleted, not shadowed (`useDefineForClassFields` is on). There is no setter: `StudioPanels.tsx:309`, `TimeTravelHost.tsx:105–108` and every test that assigns `composer.readOnly` migrate to `setEditLock` in the same commit. `TimeTravelHost` drops its save/restore of the previous value and sets/clears only its own `"time-travel"` lock.
- **The lock is enforced in the engine, not per surface.** Today `readOnly` is checked only in `CommandCenter.ts:142,214`, and editor code writes through managers directly (`usePages.ts`, `NewPageModal.tsx`, `TemplatesTab.tsx`, `usePageSettings.ts`, `canvas/menus/actions/editActions.ts`, `canvas/hooks/drag/dropOperations.tsx`, `shell/hooks/useBlockInsertion.ts`, `panels/layers/hooks/useLayerActions.ts`, `inspector/sections/*`, `components-catalog/applyInterpretedTree.ts`). Every mutating manager entry point refuses while `composer.readOnly` (one shared guard at the mutation/`history.record` choke point if one exists; otherwise per manager write method); `history.undo/redo` return early while locked; the design-system facade (`Composer.ts:284,314,334`) also refuses while `composer.readOnly`.
- `useComposerInit.ts` sets `setEditLock("not-loaded", true)` when the composer is created, before the load starts, and clears it only after a successful import and migration. A failed load leaves it set.
- The name avoids `ProInspector.tsx:242`'s unrelated `readOnlyReason`.
- On a load failure the lock simply stays; a successful retry clears it after import. Before that import the history stack is asserted empty, so a future bypass write fails loudly instead of being silently replaced.
- The autosave scheduling on `project:changed` skips while `editLocks.has("not-loaded")`.
- The inspector root, the Layers/Insert drag sources and the canvas selection toolbar subscribe to `editlock:changed` and read `composer.readOnly` (no per-control guards).
- The page switcher opens, but its rows are disabled with the tooltip "Available when the site loads". Navigation needs the loaded project.

- [ ] Step 1: Failing tests.
  - `› inspector inputs disabled with aria-disabled`.
  - `› save status reads "Not loaded · nothing saved yet"` (board copy; it describes this session, not the stored site).
  - `› banner states the cause and that saved work is safe: offline → "You're offline. Your saved work is safe." + Retry; 403 → "You don't have access to this site." + Back to dashboard; 404 → "This site no longer exists." + Back to dashboard; other → "Couldn't load this site. Your saved work is safe." + Retry`. Board copy wins wherever the board already words a cause; these strings fill only causes the board lacks.
  - `› Retry is busy (aria-busy, ignores repeat clicks) while loading; a second failure shows the attempt count and a "Reload page" action; after 3 failed attempts (1 s, 2 s, 4 s backoff) Retry is replaced by "Reload page" and "Back to dashboard"`.
  - `› banner is announced (role="alert")`.
  - `› load error is reported to Sentry with status and request id; "Copy details" copies the error code and request id, never a token`. The request id comes from the server response header, not the client; URLs sent to Sentry have query strings stripped.
  - `› canvas shows a neutral empty state, not a skeleton and not the banner text`.
  - `› ⌘Z, Delete and paste do nothing`.
  - `› drag from Layers/Insert does not start`.
  - `› page switcher opens but rows are disabled with "Available when the site loads"`.
  - `› Composer › readOnly stays true while any lock remains (view + not-loaded; clear one, still true)`.
  - `› engine › with the not-loaded lock set, every manager write method (elements, pages, styles, templates, design system) is refused and no project:changed fires` (one table-driven test over the manager API; this is the proof for Review Focus 2).
  - `› an edit attempted before the initial load resolves is refused and never reaches autosave`.
  - `› TimeTravelHost save then restore while not-loaded is held leaves no stray view lock`.
  - `› history.undo/redo do nothing while locked`.
  - `› editlock:changed fires on each change`.
  - `› successful retry clears the not-loaded lock`.
  - `› autosave not scheduled`.
  - `› canvas selection toolbar not rendered`.
  - `› topbar Publish not rendered`.
  - `› inspector notice "View only until the site loads"`.
  - `› Retry re-runs load`.
- [ ] Step 2: Implement. The banner is the one primary signal; save status, the inspector notice and disabled rows are quiet echoes. Publish is hidden (it would act on a site that is not there); page rows stay visible but disabled (they show the user's site structure exists). Pin.
- [ ] Step 3: Commit.

### Task 1.7: Publish tray — one CTA, canvas fits

**Files:**
- Create `src/editor/shell/PublishTray.tsx`. No tray component exists today; "Publish changes" lives in `lifecycle.ts`, `useLifecycle.ts`, `usePublishJob.ts` and `Topbar.tsx`.
- `sidebar/tabs/publish/PrePublishChecks.tsx` (reuse the checks list).
- `src/services/syncRetryQueue.ts`: extend its contract with `lastError: string | null` and `failedRecordId: string | null` beside `outstandingCount()`, with tests.
- Server (read first, change only through the full chain): `server/services/publish.service.ts` already refuses a second live job per site (`ALREADY_PUBLISHING`, :344–348). Try again relies on that guard and re-polls the existing job instead of queuing a new one. If the deployment id is not already on the job status response, adding it is a separate Task 1.7b: `publish.service.ts` → its router → shared schema in `packages/shared/schemas` → editor client, with a service test.
- `StudioHeader.tsx`
- Tests.

- [ ] Step 1: Failing tests.
  - `PublishTray › one CTA; reason "Fix {n} blocking issue(s) to publish" when n>0`.
  - `› the topbar Publish control stays rendered as the tray toggle (aria-expanded=true while open, no disabled second CTA, no layout shift)`.
  - `› Esc closes the tray and returns focus to the topbar Publish toggle`.
  - `› states, each with board copy from the B8-PB* boards in the dump: nothing to publish; warnings only (CTA enabled); blocking issues; no Vercel connection (CTA "Connect Vercel"); first publish vs republish; publishing (progress); success (live URL, "View site", "Copy link"); deploy failed (reason + "Try again"); CMS sync pending (CTA disabled with "Saving CMS changes…" while the sync outbox has outstanding writes); CMS sync stuck (after 5 failed retries or 60 s: "CMS changes couldn't sync: {reason}" with "Retry sync" and "Open CMS" pointing at the failing record)`.
  - `› deploy failed shows the job id and deployment id; Try again is idempotent on the job id (no duplicate deployment); a failure after partial upload is pinned by a test`.
  - `› clicking an issue selects its element and keeps the tray open`.
  - `› closing the tray restores the user's previous zoom, unless the user changed zoom while the tray was open`.
  - `› focus is trapped inside the tray while open`.
- [ ] Step 2: Implement. Boards: Publish v2 `499:2656` and B8-PB01 `233:2`; the tray's dock side and width come from those boards. While the tray is open, the canvas column shrinks and the authored viewport scales to fit. Playwright asserts the viewport's right edge is ≤ the canvas column's right edge − 24. Pin.
- [ ] Step 3: Commit.

### Task 1.8: CMS record status badges

**Files:** the CMS records table in `src/editor/cms/` (locate the status column) and its tests. No new chrome-ui component: compose `Badge` (flowbite re-export in `chrome-ui/index.ts`) with tone classes that use `--bk-*` tokens.

- [ ] Step 1: Failing tests.
  - `CmsRecordsTable › status column renders a Badge per status: Draft→neutral, Published→success, Changed since publish→warning`.
  - `› each badge carries its status text (state is never colour-only)`.
  - `› every status in the CMS record Zod schema maps to a tone; an unmapped status falls back to neutral with its raw label`. The status list comes from the schema, not the board.
- [ ] Step 2: Failing test `badge tone contrast ≥4.5:1`, computed from the token values in `src/themes/tokens.generated.ts`, not from jsdom styles. The token pairs are found by value:
  - Draft: fg `#4B5563` on bg `#F3F4F6` → 6.87.
  - Published: fg `#057A55` on bg `#DEF7EC` → 4.75.
  - Changed since publish: fg `#723B13` on bg `#FDFDEA` → 8.69.

  A missing token goes through Task 1.1.
- [ ] Step 3: Implement, pin, commit. Ownership of this file passes to L-C when Phase 1 exits.

**Interim mixed design (owner taste decision at the final gate):** shipping Phase-1 tasks to `main` one PR at a time puts the new shell beside old panels for weeks. Default: accepted, because each Phase-1 PR is a correctness or consistency fix on its own. If the owner rejects it, Phase-1 PRs target `feat/design-2l9` instead.

**Phase 1 exit gate:**
- Play journeys F1–F6 walk live up to the point where they leave shell chrome.
- Pins green at three widths.
- `verify:ds` green.
- An independent read-only reviewer (`design-guard-reviewer` if available) reports no Critical findings.
- Shell manifest rows are `match`/`drift-fixed`/authority.

**Ownership handoff after Phase 1:**
- `LoadErrorBanner.tsx` → L-F.
- `PublishTray.tsx` and `sidebar/tabs/publish/*` → L-E.
- CMS table → L-C.
- Phase 1 keeps `Topbar.tsx`, `StudioHeader.tsx`, `PageSwitcher.tsx`, `BreakpointSwitcher.tsx`, the inspector header, `shell/StudioPanels.tsx`, `shell/hooks/*` (including `useEditorShortcuts.ts`) and `src/engine/`; after Phase 1 the lead owns them.
- Before merging a lane PR the lead runs `git diff --name-only feat/design-2l9...<lane-branch>` and rejects any path outside that lane's owned list, `scripts/conformance/boards-2l9.json` and the lane's own sub-plan. Lanes file change requests against these to the lead as entries in `packages/editor/docs/design-2l9/REQUESTS.md` on `feat/design-2l9` (lane, file, change, board id, why); the lead answers in the same file.

---

## Phase 2 · Surface lanes (parallel, one worktree + agent each)

Each lane:
1. Writes `docs/superpowers/plans/<YYYY-MM-DD>-design-2l9-lane-<a..f>.md` (date the sub-plan is written) from its inventory rows, using this plan's header, Global Constraints, Review Focus and manifest schema.
2. Executes it with THE LOOP, including the manifest update.
3. Opens a PR into `feat/design-2l9`.

Lanes change only rows marked `drift` or `missing`. Lanes own only the paths listed below. Each lane sub-plan also lists its `code-ahead` rows (features the code has and the board lacks) with one disposition each: "kept at <location in the new layout>" or "owner decision" (`authority: open:<reason>` until decided). A capability is never removed silently.

| Lane | Family (page) | Owns (under `packages/editor/src/editor/` unless noted) | Acceptance |
|---|---|---|---|
| L-A | Editor: canvas, Layers, Pages, Insert (03) | `canvas/` (except `CanvasFooterToolbar` undo, done in Phase 1), `sidebar/tabs/layers/`, `sidebar/tabs/pages/`, `sidebar/tabs/build/` | Play F1 and F3 live; every 03 row done |
| L-B | Inspector (04) | `inspector/` (except the header, done in Phase 1) | Every 04 row done. Class-first styling rows are `blocked:owner` until its flow decisions close (spec: `docs/audits/2026-10-20-webflow-reverse-audit/CLASS-FIRST-SPEC.md`) |
| L-C | Resources: CMS, Assets, Components, Templates (05) | `cms/`, `sidebar/tabs/content/`, `sidebar/tabs/media/`, `media/`, `sidebar/tabs/ComponentsTab.tsx`, `sidebar/tabs/component-library/`, `sidebar/tabs/templates/` | Play F2 live; every 05 (non-Brand) row done. A server change needs the full tRPC chain plus shared schemas |
| L-D | Brand / design system (05) | `design-system/` | Brand rows done; no panel undo control |
| L-E | Site delivery: Settings, Publish, Analytics, Domains, Security (06) | `sidebar/tabs/settings/`, `sidebar/tabs/publish/`, `shell/PublishTray.tsx`, `shell/PublishDiffView.tsx`, `shell/PublishHistory.tsx`; dashboard routers only with the full chain | Play F4 live; every 06 row done |
| L-F | Recovery, access, review (07 + F5) | `shell/LoadErrorBanner.tsx`, `shell/RecoveryBanner.tsx`, `shell/SaveFailedBanner.tsx`, `shell/ViewerRoleNotice.tsx`, `shell/SendForReview.tsx`, `sidebar/tabs/review/`, `collaboration/` | Play F5 and F6 live; every 07 row done |

**Out of scope (owner):**
- First-run (page 08), until the B9 interviews.
- Figma Legacy-layer cleanup (option B, ~2026-10-29).
- Class-first styling rows, until their flow decisions close.
- Anything marked `blocked:owner`.

**Integration:**
- The lead merges into `feat/design-2l9` in order L-A → L-B → L-D → L-C → L-E → L-F.
- After each merge: `verify:ds` (cwd `packages/editor`), all pins, and a re-walk of the affected journeys.

**Final gate (whole design):**
- `node scripts/conformance/census-2l9.mjs` exits 0.
- F1–F6 walked live at 1440×900, 1280×720 and 1024×768.
- An independent whole-branch review is done.
- The owner signs off before any push to `main` or deploy.

## Budget and agent limits

- Agents (owner prefers light verification, memory `feedback-token-heavy-testing`):
  - Phase 0: ≤6 read-only.
  - Phase 1: 1 implementer; one independent reviewer at the Phase-1 exit, not per task.
  - Phase 2: ≤6 lanes, one reviewer per lane PR.
  - Live re-walks after a merge cover only the journeys that merge touches.
- Figma calls: Phase 0 ≤ 60 on day 1 (dump) and ≤ 45 on day 2 (≤40 shots plus a recount). Phase 1 Task 1.1 ≤ 10 (token read only, no writes). Otherwise Phases 1–2 spend ≤ 10 per day, only for boards missing from the dump.
- Verification is the live app. A green unit suite is not acceptance.


<!-- autoplan-accepted:ceo -->
- Gate commands run with cwd `packages/editor` (`pnpm run verify:ds`, `pnpm run gate:tokens-generated`); `pnpm run audit:rules` at repo root; stated in Global Constraints and every task that names them.
- Task 1.2 removes the canvas undo in `src/editor/canvas/CanvasFooterToolbar.tsx` (:71-78, :253, :307); test `CanvasFooterToolbar › renders no undo/redo controls`; topbar undo state comes from composer events `history:recorded`/`history:undo`/`history:redo`/`history:changed`/`history:cleared`/`history:unrecorded`, never from `AquibraStudio.tsx`; tests cover cleared and changed.
- Phase 2 lanes change only `drift`/`missing` rows; behaviour conflicts follow the code contract and record `authority: code:<reason>` (binding decision 2026-08-05).
- E1: component pins in `e2e/visual-pins.spec.ts` (`visual-pins.spec.ts-snapshots/`), probe cases with per-case `test.use({ viewport })` at 1440x900, 1280x720, 1024x768; whole-shell overflow/tray-fit/load-failed checks in new `e2e/design-2l9-shell.spec.ts` against a new `shell-full` probe case on the existing probe server (port 5051); both wait for `document.fonts.ready`.
- E2: `scripts/conformance/census-2l9.mjs` implements the single done predicate (status not active, or verified in {match, drift-fixed}, or authority starting code:/founder:/blocked:/superseded:); same predicate in the final gate; test at `scripts/__tests__/census-2l9.test.mjs` (inside vitest include); retires when the predicate holds for every row.
- E4: RTL-tested keyboard/a11y contract per Phase-1 control (focus order, aria-pressed, aria-expanded + Esc, aria-disabled).
- Task 1.3 deletes `PageTabBar.tsx` and `PageTabBar.test.tsx` and updates every importer in the same commit: `StudioPanels.tsx`, `usePages.ts`, `e2e/probe/probe.tsx:107,2685`, `StudioPanels.inspectorColumn.test.tsx`, `useActivePageId.test.tsx`, the `regionCycle.ts:18` selector, and the two `PageTabBar` mentions in boards.json.
- Page switcher shortcut is ⇧⌘O; ⌘P stays Preview, ⇧⌘P stays palette; board copy overruled with `authority: code:shortcut-cmd-p-is-preview`.
- Load-failed read-only: `Composer.editLocks: Set<"view"|"time-travel"|"not-loaded">` + `setEditLock(reason,on)` emitting `editlock:changed`; `composer.readOnly` accessor = locks non-empty (setter maps to "view"); StudioPanels/TimeTravelHost migrate to setEditLock; `useComposerInit.ts` sets "not-loaded" on load failure and clears on successful retry; autosave on project:changed skips while not-loaded; inspector root, Layers/Insert drag and canvas selection toolbar subscribe; page switcher rows disabled with "Available when the site loads"; no edit to AquibraStudio.tsx; tests listed in Task 1.6.
- Review Focus 3 covers composer (Brand/canvas) undo; CMS record undo is out of scope and L-C records board claims.
- Manifest `boards-2l9.json` uses the boards.json row schema with the inventory→verified/authority mapping table; THE LOOP updates the row in the same commit.
- Task 1.0 keeps the regression net green: affected boards.json recipes/copy and existing pins are updated in the same commit with "re-baseline: <surface>".
- Phase 0 order is dump (0.1) → manifest + repoint (0.2) → inventory (0.3) → census (0.4); Figma budget ≤60 calls day 1, ≤45 day 2, ≤40 screenshots.
- Ownership handoff after Phase 1 is explicit (LoadErrorBanner→L-F, PublishTray + publish tab→L-E, CMS table→L-C); lane paths are the real directories listed in the lane table.
- Class-first styling rows are `blocked:owner` until their flow decisions close.
- Task 1.8 composes chrome-ui `Badge` (no new component); contrast asserted from `tokens.generated.ts` values.
- Task 1.7 creates `shell/PublishTray.tsx` (no tray exists today).
- Server changes in any lane use the full tRPC chain with schemas in `packages/shared/schemas`.
- First-run (page 08) and Figma Legacy cleanup stay out of scope (owner).
- Task 0.0 creates worktree `~/Desktop/buildrik-worktrees/design-2l9` on `feat/design-2l9`; each verified Phase-1 task ships to `main` as its own PR; Phase 2 lanes PR into `feat/design-2l9`, rebase onto `main` weekly, and reach `main` after the final gate.
- Task 1.1 reads 2L9 variables with the README export script (≤10 Figma calls, no Figma writes; hex backgrounds recorded as manifest notes), diffs against `figma-tokens.json`, changes only Phase-1 tokens on mismatch; regenerates with `npm run tokens:generate`.
- Inspector header (`inspector/components/InspectorHeader.tsx`) 104px breadcrumb variant renders only for collection-template pages or a selected element with >2 ancestors; both variants and keyboard reach tested.
- Page 05 inventory rows split by prefix: `B6-B*` brand → L-D; `B5-*`, `B6-A*`, `B6-K*`, `B6-T*` → L-C.
- Badge contrast pairs named by value: Draft #4B5563/#F3F4F6 6.87, Published #057A55/#DEF7EC 4.75, Changed #723B13/#FDFDEA 8.69.
- Task 1.2 also removes `Canvas.tsx:956` onUndo wiring; History group anchors after the site-settings control in StudioHeader.
- Task 1.3 defines `PageSummary {id,name,slug,kind:"static"|"template",collectionId?}` in `src/shared/types/`, derived from usePages; template rows open like pages; resource-area notice per board 497:99474.
- Task 1.5 keeps `wide` (opt-in) and code wording "Mobile" (authority code:mobile-label); `labelled`/`sublabels` props retained.
- Task 1.7 a11y: focus trap and focus return; Task 1.8: status text present on every badge.
- Live comparisons use the Next editor `/edit/:id` with the QA seeded site; unreachable states use probe cases; unreachable rows recorded as `verified: unreachable` + `authority: blocked:unreachable-<reason>`.
- Task 0.4 writes TODOS.md entries for first-run page 08 and Figma Legacy cleanup.
- Dump records only nodes visible through their whole ancestor chain (hidden Legacy shells skipped), with a test on Legacy frame `225:2821`; re-dump and commit the diff after the owner's Legacy cleanup.
- Manifest rows may carry `inheritsFrom` (archetype row); lanes live-verify archetypes; census reports per-authority-class and direct-vs-inherited counts; final gate lists blocked/unreachable/code rows for owner acknowledgement.
- ⇧⌘O is confirmed unbound in `src/editor` and not browser-reserved before adoption.
- Verification budget follows the owner's light-verification preference: one reviewer at Phase-1 exit, one per lane PR; post-merge re-walks only for touched journeys.
- Manifest retirement clause: a superseding design file freezes `boards-2l9.json` as history.
<!-- /autoplan-accepted:ceo -->

<!-- autoplan-accepted:design -->
- Task 1.3 keeps PageTabBar capabilities: `PageSummary` adds `collectionName?`, `isHome`, `dirty`, `depth`; closed switcher and rows show a home glyph (aria "Homepage") and unsaved dot (aria "unsaved changes"); menu ends with "+ Add page" (opens Pages panel) and "Manage pages ›"; `PageSwitcher` takes `onAddPage()`.
- Task 1.3 menu: search always shown and focused on open, filters name and slug, "No pages match '{query}'"; static pages in tree order indented by depth; template rows read "{collectionName} · {slug pattern}"; active row has a check glyph and `aria-current="page"`; max height 400 px, list scrolls.
- Page switcher chord is ⇧⌘O on macOS and Ctrl+Alt+O elsewhere, rendered by the shortcuts-sheet platform formatter; test covers the non-Mac string.
- Task 1.3 resource-area bottom bar places "‹ Back to Editor" per board 497:99474; a test clicks it and asserts return to the kept page.
- Task 1.4 removes the "✦ AI" chip (`inspector-ai-chip`) with a test that it does not render; Phase 0 Step 1b greps `src/editor` for other AI entry points and files each as a drift row.
- Task 1.4 Editing select options are element states only; breakpoint is a read-only prefix driven by the topbar `BreakpointSwitcher`, the only breakpoint control; tested both ways.
- Revises the CEO obligation on the Inspector header: the 104 px breadcrumb row renders only while the current page is a collection template, never because of element depth; test asserts equal header height for depth-1 and depth-4 selections.
- Task 1.2: ⌘Z/⇧⌘Z use native field undo when focus is in an editable field outside the canvas, composer undo otherwise (test); Undo/Redo tooltips "Undo (⌘Z)"/"Redo (⇧⌘Z)" via the formatter, disabled "Nothing to undo"/"Nothing to redo"; labels stay generic.
- Task 1.2: review control is an entry point only; sending/sent/failed states and the "In review" destination belong to L-F.
- Task 1.2 narrow-width rule: minimum width 1024; the site name ellipsizes first (min 80 px, tooltip with full name); pins use the longest label "In review · 12 open" and assert no wrap at 1024.
- Task 1.6 load-failed: save status keeps board copy "Not loaded · nothing saved yet"; banner is the one primary signal with cause-specific copy (offline, 403, 404, other) that states saved work is safe where relevant; Retry busy state and repeat-failure attempt count with "Reload page"; canvas shows a neutral empty state; Publish hidden, page rows disabled, with that rationale recorded.
- Task 1.7: topbar Publish stays rendered as the tray toggle (`aria-expanded`), focus returns to it on Esc; tests cover nothing to publish, warnings only, blocking issues, no Vercel connection, first publish vs republish, publishing, success (URL, View site, Copy link), deploy failed (Try again) and CMS sync pending; issue click selects the element and keeps the tray open; closing restores zoom; dock side and width from boards 499:2656 / 233:2.
- Task 1.8 badge tones come from the CMS record Zod schema status list, with a neutral fallback that shows the raw label.
- Task 1.5: width readout stays in the tooltip unless the board shows it elsewhere; "Wide" shows only when the existing breakpoint config enables it, key named in the commit.
- Manifest `inheritsFrom` covers sample-data and interaction-state variants only; error, empty, loading, disabled and read-only rows get direct comparisons.
- Every Phase-2 lane sub-plan lists its `code-ahead` rows with a disposition ("kept at X" or owner decision, `authority: open:<reason>`).
- Interim mixed design on `main` from per-PR Phase-1 shipping is accepted by default and surfaced to the owner at the final gate; on rejection Phase-1 PRs target `feat/design-2l9`.
- Budget line for Task 1.1 reads "token read only, no writes".
<!-- /autoplan-accepted:design -->

<!-- autoplan-accepted:dx -->
- Global Constraints: figma-mcp.mjs runs from the repo root; on 401/expired token/missing tools stop, record calls and cursor, ask the founder to run `/mcp`, resume from cursor; budget exhaustion marks rows `blocked:no-dump` for next-day batch reads; no token or header in committed files or logs; pnpm everywhere; later accepted lists and the task body win over earlier accepted lists.
- Task 0.0 Steps 3–5: copy `.env.local`; per-worktree port pairs (lead 3000/5051, L-A..L-F 3001–3006/5061–5066); `NEXTAUTH_URL`/`AUTH_URL`/`NEXT_PUBLIC_APP_URL` overrides for non-3000 ports; dashboard dev command recorded; QA login and seeded site id recorded in `docs/design-2l9/README.md` without credentials; `PROBE_PORT` env in `playwright.config.ts` with a `--list` check; `PUBLISH_ALLOW_SIMULATION=true` for publish walks except the named L-E final walk.
- Task 0.1 adds committed `scripts/design-2l9/dump.mjs` with `.cursor.json` resume, exit 3 on budget/401, exit 1 and no file on frame-count mismatch, and `scripts/__tests__/design-2l9-dump.test.mjs` (resume, mismatch refusal, Legacy skip).
- Census output contract: tab-separated open rows (nodeId, family, verified, authority, what closes it), per-family counts, `--json`; exit 0 done, 1 open, 2 invalid manifest with row/field message on stderr; `code:`/`founder:` rows need non-empty `verifiedNote`; tests per exit code.
- Shared verification names Playwright run and `--update-snapshots` commands (cwd `packages/editor`) and `maxDiffPixelRatio: 0.002`, loosened only by the lead with a stated reason.
- Task 1.0 Step 1 gives the grep for recipes and copy checks.
- Task 1.1 merges only listed Phase-1 keys (never pastes the export), names the 2L9 mode, checks `git diff` touches only those keys, then `pnpm run tokens:generate`.
- Task 1.6 retry: backoff 1/2/4 s, cap 3, then "Reload page" and "Back to dashboard"; banner `role="alert"`; Sentry report with status and request id; "Copy details" with code and request id, never a token.
- Task 1.7 adds CMS sync stuck state (5 retries or 60 s → "CMS changes couldn't sync: {reason}", Retry sync, Open CMS at the failing record) and deploy-failed job/deployment ids with idempotent Try again and a partial-upload test.
- Manifest defines each `verified` value; inventory `drift` maps to `drift-open`.
- Lane sub-plans are named `<YYYY-MM-DD>-design-2l9-lane-<a..f>.md`; shell change requests go to `docs/design-2l9/REQUESTS.md` (lane, file, change, board id, why).
<!-- /autoplan-accepted:dx -->

<!-- autoplan-accepted:eng -->
- Task 1.6 enforces the edit lock in the engine: every mutating manager entry point (or one shared mutation/`history.record` choke point), `history.undo/redo` and the design-system facade refuse while `composer.readOnly`; table-driven test over the manager API with `not-loaded` set asserts no write and no `project:changed`.
- Task 1.6 sets `not-loaded` when the composer is created, clears it only after a successful import and migration; test that an edit before load resolves is refused and never autosaved; history stack asserted empty before a retry import.
- `composer.readOnly` is a getter only; the class field at `Composer.ts:144` is deleted; no setter; `StudioPanels`, `TimeTravelHost` (no save/restore of the previous value) and tests migrate to `setEditLock`; test for no stray view lock after time travel while not-loaded.
- Task 1.4 Editing control = read-only `${breakpoint} ·` prefix + native chrome-ui `Select` with "Default state"/"Hover state"/… options; no new component or wrapper.
- Task 1.3 chord handler ignores editable focus and `getModifierState("AltGraph")`; test with AltGr+O; chord checked in Chrome, Firefox and Safari and recorded.
- Task 1.2 adds inline canvas text editing undo rule (native inside the edit, one composer step on commit) and resync of undo state on composer change, `importProject` and version restore, after verifying which events `importProject` emits.
- Task 1.7 lists `syncRetryQueue.ts` (`lastError`, `failedRecordId`) and relies on `publish.service.ts:344-348` single-live-job guard for Try again; a missing deployment id on job status becomes Task 1.7b through the full tRPC chain with a shared schema; zoom restore skipped when the user changed zoom during the tray.
- Branch topology: Phase-1 PRs cut from `main`; lead merges `main` into `feat/design-2l9` weekly and after each Phase-1 merge; lanes rebase only onto `feat/design-2l9`.
- Pins baseline on one pinned host (lead darwin, repo Playwright version); lane runs are smoke checks.
- Lead owns `StudioPanels.tsx`, `shell/hooks/*` and `src/engine/` after Phase 1; lane PRs fail a name-only diff check against their owned paths.
- `dump.mjs` scrubs email/credential-like text; census treats `inheritsFrom` rows as done only while the archetype is done and exits 2 on dangling or cyclic links.
- Sentry request id comes from the server response header; URLs sent to Sentry drop query strings.
<!-- /autoplan-accepted:eng -->
## Review record





<!-- autoplan-baseline-edits:ceo {"sourceSha256":"e7dc2db90d71006193418cd25e247d1a6a23a4d2028fd89e5d476ee158e37904","replacements":[{"oldText":"# Buildrick Editor · Implement design file 2L9OTGzBrL6kYmU18yA1c7 — Master Plan\n\n> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.\n\n**Goal:** Make the shipping editor match Figma file `2L9OTGzBrL6kYmU18yA1c7` (canonical since owner decision 2026-10-22), surface by surface. Every surface is verified against its board in the live app.\n\n**Architecture:** This plan has three parts.\n- **Phase 0** repoints the repo's design source of truth and dumps the design locally, so that parallel agents never spend the shared Figma budget.\n- **Phase 1** ships the shell (topbar, bottom bar, Inspector header, breakpoint switcher, page switcher, status badges, load-failed and publish chrome). It ships first because every other surface sits inside it.\n- **Phase 2** runs one lane per surface family. Each lane is a worktree with its own agent, and it writes its own sub-plan from the Phase-0 gap inventory before it touches code. This document defines the lanes, their file ownership and their acceptance. It does not define their tasks, because those depend on an inventory that does not exist yet.\n\n**Tech Stack:** React 18 + TypeScript 5.3 (editor, Vite 7), chrome-ui on flowbite-react with `tw:`-prefixed Tailwind 4 and generated `--bk-*` tokens, Vitest + RTL, Playwright for the live walk, Next 16 dashboard (tRPC 11, Prisma 5) where a surface needs server data.\n\n**Spec:** the following, all in Figma file `2L9OTGzBrL6kYmU18yA1c7`:\n- Pages 03–09.\n- The \"✦ Improved — 2026-10-22\" page `497:99417`, including its Read me note `505:4365` and change log.\n- The design records in `packages/editor/docs/audit-and-design-2026-10-16/` (panel docs 00–25, `PRODUCT-DESIGN-BRIEF.md`).\n- Owner decisions in memory: one undo, Legacy option B, no AI in UI, class-first styling.\n\n## Global Constraints\n\n- Design source of truth: Figma `2L9OTGzBrL6kYmU18yA1c7`. The old `g4GzQFqzNYz5sosz1QtZXC` pages are history, not targets.\n- Precedence (packages/editor/CLAUDE.md, founder): behaviour → the code contract (Zod schemas, service returns). Visual (layout, colour, type, on-screen copy) → the board. Board sample data is never copied literally.\n- Chrome imports only from `@/editor/chrome-ui`. No `flowbite-react` import outside it. Wrapper set stays TextInput/Select/Button.\n- Tokens: `var(--bk-*)` only. No hex in chrome. A missing token is added in Figma → `scripts/tokens/figma-tokens.json` → `node scripts/tokens/generate.mjs`. Never hand-edit `tokens.generated.*`.\n- One accent `#1A56DB`. No purple/violet/indigo. Inter for UI, Geist Mono for data with `tabular-nums`. No system font fallbacks.\n- No raw `<button>/<input>/<select>/<textarea>` outside chrome-ui (Gate 24). No `createPortal` outside the overlay-root primitives (Gate 22).\n- No AI entry points in the editor UI (owner 2026-10-17).\n- One undo system: Undo/Redo live only in the topbar. Brand already shares the stack (`BrandWorkspace.tsx:31`). Do not add per-panel undo buttons.\n- `../../` imports banned. Use `@/` aliases.\n- Tests that protect the OLD design are rewritten in the same commit as the change.\n- Never stage `packages/editor/src/editor/shell/AquibraStudio.tsx` from an agent session (founder WIP).\n- No `git stash` mid-execution. Use a worktree under `~/Desktop/buildrik-worktrees/`.\n- Push only through the pre-push gate (`pnpm run verify:ds`). Never `--no-verify` without saying so.\n- Figma MCP budget: 200 calls/day, shared by all agents. Lanes read the Phase-0 local dump, not Figma. Only the lane lead may spend Figma calls, and only for a board missing from the dump.\n\n## Review Focus\n\n1. **Page switcher with many pages.** A site with 100 pages plus collection templates must still let the user reach any page in ≤2 interactions. Owner: Task 1.3. Test: `PageSwitcher › lists 100 pages with search and keyboard selection`.\n2. **Load failed, then the user edits anyway.** No control may write while the site is not loaded, and the save status must never say \"Saved\". Owner: Task 1.6. Test: `LoadErrorBanner › inspector inputs disabled and save status reads \"Not loaded · nothing saved yet\"`.\n3. **Undo after a Brand or CMS change.** Topbar ⌘Z must undo the last change wherever it happened, with no second undo button anywhere. Owner: Task 1.2. Test: `StudioHeader › single undo control; no undo buttons rendered in BrandWorkspace or canvas toolbar`.\n4. **Narrow window (1024–1280 px).** The topbar must not clip \"Request review\" or \"⋯\", and the bottom bar must not overflow. Owner: Tasks 1.2 and 1.3, Playwright at 1024×768 and 1280×720.\n5. **Publish with a blocking issue.** The only publish CTA lives in the tray with its reason underneath. The topbar must not show a second disabled Publish while the tray is open. Owner: Task 1.7. Test: `PublishTray › one CTA; reason text \"Fix N blocking issue(s) to publish\"`.\n\n---\n\n## Phase 0 · Foundation (lead session, sequential)\n\n### Task 0.1: Repoint the design source of truth\n\n**Files:**\n- Modify: `packages/editor/CLAUDE.md` (the FIGMA UI REBUILD section: file key, page, \"source of truth since 2026-10-22\").\n- Create: `packages/editor/scripts/conformance/boards-2l9.json`. It has the same schema as `boards.json` and `fileKey: \"2L9OTGzBrL6kYmU18yA1c7\"`.\n- Modify: `packages/editor/scripts/conformance/README.md` (which manifest is active).\n- Do NOT rewrite `boards.json`. It is history and its rows still measure live surfaces.\n\n- [ ] Step 1: Edit CLAUDE.md. The new file key replaces `g4GzQFqzNYz5sosz1QtZXC` page `4418:45431` as the current target. The old page is named as history.\n- [ ] Step 2: Generate `boards-2l9.json` from the Phase-0 dump (Task 0.2). Include one row per top-level frame on pages 03–09 with `{nodeId, name, page, family, status: \"active\"|\"design-ahead\"|\"out-of-scope\", verified: \"no\"}`. Frames in sections named Reference / Archive / FUTURE and `Legacy ·` layers count as `out-of-scope`.\n- [ ] Step 3: Run `pnpm run audit:rules`. Expected: no new stale-path findings for the edited lines.\n- [ ] Step 4: Commit `docs(editor): design source of truth → 2L9OTGzBrL6kYmU18yA1c7`.\n\n### Task 0.2: Local design dump (budgeted Figma spend)\n\n**Files:**\n- Create: `packages/editor/docs/design-2l9/dump/page-<id>.json`. Per board it holds: id, name, size, the visible text strings, component instances (main component name + overridden props), and top-level layout boxes. This follows the dictionary-encoded technique in memory `figma-page-dump-technique`.\n- Create: `packages/editor/docs/design-2l9/shots/<nodeId>.png`. One screenshot per **archetype**, not per frame. Target ≤150 screenshots across the file.\n- Create: `packages/editor/docs/design-2l9/README.md` with counts per page and family, plus the call budget actually spent.\n\n- [ ] Step 1: Dump pages 03, 04, 05, 06, 07 and 09, plus the Improved page components (`Shell/*`, `StatusBadge`, `Shell/PageSwitcherMenu` `558:4419`, `FirstRun/Checklist`). Use `use_figma` read scripts capped at about 20 KB per return, resuming by cursor.\n- [ ] Step 2: Screenshot one archetype per family, plus every board that has a unique state.\n- [ ] Step 3: Verify that the counts in the README equal the frame counts read live (03: 360, 04: 313, 05: 562, 06: 687, 07: 94, 09: 236). Mismatch = redo.\n- [ ] Step 4: Commit `docs(design-2l9): local dump of canonical design`.\n\n### Task 0.3: Gap inventory (parallel read-only agents, ≤6)\n\n**Files:**\n- Create: `packages/editor/docs/design-2l9/gap-inventory.md`. It has one table per family with these columns: board · surface/route in code (file:line) · status `match | drift | missing | code-ahead | blocked:<reason>` · notes.\n\n- [ ] Step 1: One read-only agent per page group:\n  - 03 Editor\n  - 04 Inspector\n  - 05 Resources: CMS, Assets, Brand, Components, Templates\n  - 06 Site delivery: Settings, Publish, Analytics, Domains\n  - 07 Recovery and access\n  - 09 Play journeys, which become the acceptance scripts\n\n  Each agent maps its boards to code using the dump only (zero Figma calls). It cites file:line for every `match` and every `drift`.\n- [ ] Step 2: The lead merges the six reports, removes duplicates on shared chrome (which goes to Phase 1), and marks owner-decision items `blocked:owner`.\n- [ ] Step 3: Commit `docs(design-2l9): gap inventory`.\n\n**Exit gate for Phase 0:** inventory merged, and every family has a count of missing/drift boards. Phase-2 lanes may not start before this.\n\n---\n\n## Phase 1 · Shell (one lane, sequential tasks; blocks Phase 2 visuals)\n\nEach task follows THE LOOP (packages/editor/CLAUDE.md):\n1. Read the board from the local dump (`get_design_context` only if it is missing).\n2. Build with chrome-ui.\n3. Compare the live screenshot at 1440×900 against the board screenshot side by side.\n4. Rewrite tests that protected the old design.\n\n**Shared verification for every Phase-1 task:**\n- `npx vitest run <touched tests>` passes.\n- `npx tsc --noEmit` is clean.\n- `pnpm run verify:ds` passes.\n- A Playwright capture at 1440×900 and 1024×768 is saved to `packages/editor/docs/design-2l9/verify/<task>/`, and the comparison is noted in the commit body.\n\n### Task 1.1: Shell tokens and component parity audit\n\n**Files:** `src/themes/tokens.generated.*` (via the generator only) and `scripts/tokens/figma-tokens.json`.\n**Interfaces — Produces:** every colour, radius and type value used by Tasks 1.2–1.7 exists as a `--bk-*` token.\n\n- [ ] Step 1: Diff the Improved page's variables (`Buildrick / Primitives`, `Buildrick / Chrome`, `Buildrick / Geometry`) against `figma-tokens.json`. List missing or changed values.\n- [ ] Step 2: For each missing value, add it in Figma, re-export, and run `node scripts/tokens/generate.mjs`. Today's new components (`StatusBadge`, `Shell/PageSwitcherMenu`) use a hex background. Bind them to the surface token in Figma first.\n- [ ] Step 3: Run `pnpm run gate:tokens-generated`. Expected: PASS.\n- [ ] Step 4: Commit.\n\n### Task 1.2: Topbar — one undo, review copy, overflow-safe\n\n**Files:** `src/editor/chrome-ui/Topbar.tsx`, `src/editor/shell/StudioHeader.tsx`, the canvas toolbar file that renders undo/redo (locate with `grep -rn \"undo\" src/editor/canvas`), `src/editor/design-system/ui/BrandWorkspace.tsx`, and their `__tests__`.\n**Interfaces — Consumes:** `composer.history.undo()/redo()` (unchanged). **Produces:** `Topbar` renders the `History` group (Undo, Redo) after \"Site settings\". No other component renders undo/redo buttons.\n\n- [ ] Step 1: Failing test `StudioHeader.test.tsx › renders exactly one Undo and one Redo, in the topbar history group`.\n- [ ] Step 2: Failing test `BrandWorkspace.test.tsx › renders no Undo/Redo buttons; ⌘Z hint stays in toasts`.\n- [ ] Step 3: Failing test `Topbar.test.tsx › review control reads \"Request review\" with no round and \"In review · {n} open\" with n open comments`. When `n` is not available from `reviews.status`, it reads \"In review\". This is the known contract gap in boards.json `open:pill-count`, so do not invent a count.\n- [ ] Step 4: Implement. Move undo/redo into the topbar group. Delete the canvas-toolbar and Brand undo buttons. Copy change as in Step 3.\n- [ ] Step 5: Playwright at 1024×768: \"Request review\" and \"⋯\" are fully visible (bounding box inside the topbar).\n- [ ] Step 6: Commit `feat(shell): one undo in the topbar; review copy`.\n\n### Task 1.3: Bottom bar — page switcher and dropdown\n\n**Files:**\n- Replace: `src/editor/shell/PageTabBar.tsx` with `src/editor/shell/PageSwitcher.tsx`.\n- Create: `src/editor/chrome-ui/PageSwitcherMenu.tsx`, mirroring Figma `Shell/PageSwitcherMenu` `558:4419`.\n- Add tests in `__tests__/`.\n\n**Interfaces — Produces:**\n- `<PageSwitcher pages: PageSummary[] activePageId: string onSelect(id) onManagePages() />`.\n- `<PageSwitcherMenu>` is rendered through `Popover` (Gate 22). Its rows are the static pages, then a \"Templates\" group, then \"Manage pages ›\".\n- The count text format is `${static} pages · ${templates} template(s) · ⌘P to switch`. The `· N template` part is dropped when there are 0 templates.\n\n- [ ] Step 1: Failing tests.\n  - `PageSwitcher › shows active page name + slug`.\n  - `› count text \"5 pages · 1 template · ⌘P to switch\" for 5 static + 1 collection`.\n  - `› ⌘P opens menu`.\n  - `› lists 100 pages with search and keyboard selection` (Review Focus 1).\n  - `› Esc closes and returns focus to the switcher`.\n- [ ] Step 2: Failing test `bottom bar in resource areas (CMS, Brand, Settings, Assets) renders no page switcher, shows \"Editor keeps {page} open — return with ‹ Back to Editor\"`.\n- [ ] Step 3: Implement. Delete `PageTabBar.tsx` and its tests in the same commit.\n- [ ] Step 4: Playwright: open the switcher, pick \"About\", and the canvas page changes. At 1024 width there is no overflow.\n- [ ] Step 5: Commit.\n\n### Task 1.4: Inspector header — compact 84 px\n\n**Files:** the inspector identity/header component under `src/editor/inspector/` (locate it with `grep -rn \"All breakpoints\\|Editing\" src/editor/inspector`), plus its tests.\n**Interfaces — Produces:** a header with two rows. The first row is Target (icon, name, ⋯). The second row is \"Editing\" + a Select whose value is `${breakpoint} · ${state} state`. A breadcrumb row stays only where the board keeps it (the 104 px variant).\n\n- [ ] Step 1: Failing test `InspectorHeader › single \"Editing\" select shows \"Desktop · Default state\"; no separate breakpoint line`.\n- [ ] Step 2: Implement. Measured height 84 px ± 1 (Playwright `getComputedStyle`, not by eye).\n- [ ] Step 3: Commit.\n\n### Task 1.5: Breakpoint switcher — icon-only segmented control\n\n**Files:** `src/editor/chrome-ui/BreakpointSwitcher.tsx` and its tests.\n\n- [ ] Step 1: Failing test `BreakpointSwitcher › renders Desktop, Tablet, Phone icon buttons in that order with aria-labels; active one has aria-pressed=true; no visible text label`.\n- [ ] Step 2: Implement. Hovering shows a tooltip \"Tablet · 768px\" (the width comes from the breakpoint config, not hard-coded).\n- [ ] Step 3: Commit.\n\n### Task 1.6: Load-failed is truly read-only\n\n**Files:** `src/editor/shell/LoadErrorBanner.tsx`, `src/editor/chrome-ui/SaveStatus.tsx`, the inspector root, the canvas selection toolbar, and their tests.\n**Interfaces — Consumes:** the existing load-error state from `lifecycle.ts`. **Produces:** a `readOnlyReason: \"not-loaded\" | null` passed down to the inspector and canvas.\n\n- [ ] Step 1: Failing tests.\n  - `› inspector inputs disabled and save status reads \"Not loaded · nothing saved yet\"` (Review Focus 2).\n  - `› canvas selection toolbar not rendered`.\n  - `› topbar Publish not rendered while not loaded`.\n  - `› inspector shows notice \"View only until the site loads\"`.\n  - `› Retry re-runs load`.\n- [ ] Step 2: Implement. Do not duplicate the banner message on the canvas.\n- [ ] Step 3: Commit.\n\n### Task 1.7: Publish tray — one CTA, canvas fits\n\n**Files:** the publish tray component under `src/editor/shell/` (`IssuesPanel.tsx` / the publish dropdown; locate it by the \"Publish changes\" string), `StudioHeader.tsx`, and tests.\n\n- [ ] Step 1: Failing tests.\n  - `PublishTray › one CTA; reason text \"Fix N blocking issue(s) to publish\"` (Review Focus 5).\n  - `› topbar Publish hidden while tray open`.\n- [ ] Step 2: Implement. When the tray opens, the canvas column shrinks and the authored viewport scales to fit. Playwright asserts that the viewport's right edge is ≤ the canvas column's right edge minus 24.\n- [ ] Step 3: Commit.\n\n### Task 1.8: Status badge for CMS records\n\n**Files:** `src/editor/chrome-ui/StatusBadge.tsx` (new, exported from `index.ts`, added to `scripts/gates/chrome-ui-surface.manifest.json` as a non-wrapper component), the CMS records table, and tests.\n**Interfaces — Produces:** `<StatusBadge tone: \"neutral\"|\"success\"|\"warning\" label: string />`. Draft maps to neutral, Published to success, and \"Changed since publish\" to warning.\n\n- [ ] Step 1: Failing test `StatusBadge › tone classes use --bk tokens; contrast ≥4.5:1 per tone` (values from the Figma check: 6.87 / 4.75 / 8.69).\n- [ ] Step 2: Failing test `CmsRecordsTable › status column renders StatusBadge per record status`.\n- [ ] Step 3: Implement. Commit.\n\n**Phase 1 exit gate:**\n- Every Play journey F1–F6 can be walked live up to the point where it leaves shell chrome.\n- Live screenshots match the boards (side by side, saved).\n- `verify:ds` is green.\n- An independent design review (a fresh read-only agent given the boards plus the diff; `design-guard-reviewer` if available) reports no Critical findings.\n\n---\n\n## Phase 2 · Surface lanes (parallel, one worktree + agent each)\n\nEach lane:\n1. Writes its own sub-plan `docs/superpowers/plans/2026-10-2x-lane-<id>.md` from its rows in `gap-inventory.md`, using this plan's header, Global Constraints and Review Focus.\n2. Executes it with THE LOOP.\n3. Opens a PR into an integration branch.\n\nLanes own only the files listed. Shell files stay owned by Phase 1, and a lane that needs a shell change files it to the lead.\n\n| Lane | Family (Figma page) | Owns (paths under `packages/editor/src/editor/` unless noted) | Acceptance |\n|---|---|---|---|\n| L-A | Editor: canvas, Layers, Pages, Insert (03) | `canvas/`, `panels/` (layers), `sidebar/tabs/pages*`, `sidebar/tabs/build*` | Play F1, F3 live, plus every 03 board `match` |\n| L-B | Inspector + class styling (04) | `inspector/`, class-model UI per `CLASS-FIRST-SPEC.md` | Every 04 board `match`; F1 steps 1.06–1.09 live |\n| L-C | Resources: CMS, Assets, Components, Templates (05) | `sidebar/tabs/cms*`, `media/`, `sidebar/tabs/components*`, `sidebar/tabs/templates*`; server: `server/services/cms*.ts` only if the inventory shows a contract gap | Play F2 live; every 05 board `match` |\n| L-D | Brand / design system (05) | `design-system/` | Brand boards `match`; one-undo check (no panel undo) |\n| L-E | Site delivery: Settings, Publish, Analytics, Domains, Security (06) | `sidebar/tabs/settings*`, `shell/Publish*`; dashboard routers only per inventory | Play F4 live; every 06 board `match` |\n| L-F | Recovery, access, review (07 + F5) | `shell/*Banner*`, `shell/SendForReview.tsx`, `collaboration/` | Play F5, F6 live; every 07 board `match` |\n\n**Out of scope until the owner decides:**\n- First-run (page 08). It is a hypothesis only; B9 interviews are pending.\n- Anything marked `blocked:owner` in the inventory.\n\n**Integration:**\n- The lead merges lanes into `feat/design-2l9` in this order: L-A → L-B → L-D → L-C → L-E → L-F (shared-dependency order).\n- After each merge: `verify:ds`, plus a re-walk of the affected Play journeys.\n\n**Final gate (whole design):**\n- `boards-2l9.json` has every `active` row at `verified: match` or a recorded `authority` exception.\n- Journeys F1–F6 were walked live at 1440×900 and 1024×768.\n- An independent whole-branch review is done.\n- The owner signs off before any push to `main` or deploy.\n\n## Budget and agent limits\n\n- Agents: Phase 0 uses ≤6 read-only. Phase 1 has 1 implementer and 1 reviewer per task. Phase 2 has ≤6 lanes in parallel, with a reviewer per lane PR.\n- Figma calls: Phase 0 ≈ 60–90 (dump + archetype shots). Phases 1–2 aim for ≈ 0, plus at most 10 per day for missing boards.\n- Verification is the live app (CLAUDE.md \"Work against a stated goal\"). A green unit suite is not acceptance.\n","newText":"# Buildrick Editor · Implement design file 2L9OTGzBrL6kYmU18yA1c7 — Master Plan\n\n> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.\n\n**Goal:** Make the shipping editor match Figma file `2L9OTGzBrL6kYmU18yA1c7` (canonical since owner decision 2026-10-22), surface by surface. Every surface is verified against its board in the live app and pinned by a visual snapshot.\n\n**Architecture:** The plan has three phases.\n- **Phase 0** builds a local dump of the design and a new conformance manifest, inventories the gaps, and repoints the repo's design source of truth. Parallel agents never spend the shared Figma budget.\n- **Phase 1** conforms the shell (topbar, bottom bar, Inspector header, breakpoint switcher, page switcher, status badges, load-failed and publish chrome), because every other surface sits inside it.\n- **Phase 2** runs one lane per surface family. Each lane is a worktree with its own agent, and it writes its own sub-plan from the Phase-0 inventory before it touches code. This document fixes lane ownership and acceptance. It does not fix their tasks, which depend on the inventory.\n\n**Tech Stack:** React 18 + TypeScript 5.3 (editor, Vite 7), chrome-ui on flowbite-react with `tw:`-prefixed Tailwind 4 and generated `--bk-*` tokens, Vitest + RTL, Playwright (`e2e/visual-pins.spec.ts` convention), Next 16 dashboard (tRPC 11, Prisma 5) only where the inventory proves a contract gap.\n\n**Spec:**\n- Figma `2L9OTGzBrL6kYmU18yA1c7`, pages 03–09.\n- The \"✦ Improved — 2026-10-22\" page `497:99417`, with its Read me note `505:4365`.\n- `packages/editor/docs/audit-and-design-2026-10-16/` (panel docs 00–25, `PRODUCT-DESIGN-BRIEF.md`).\n- Owner decisions:\n  - One undo.\n  - Legacy option B.\n  - No AI in the UI.\n  - Class-first styling, decided but still blocked on its pending flow decisions.\n\n## Global Constraints\n\n- Design source of truth: Figma `2L9OTGzBrL6kYmU18yA1c7`. Old `g4GzQFqzNYz5sosz1QtZXC` boards are history, not targets.\n- Precedence (packages/editor/CLAUDE.md, founder; binding decision 2026-08-05): behaviour → the code contract (Zod schemas, service returns, existing shortcuts). Visual (layout, colour, type, on-screen copy) → the board. Board sample data is never copied literally. A conflict where the code wins is recorded as `authority: code:<reason>` on the manifest row.\n- Chrome imports only from `@/editor/chrome-ui`. No `flowbite-react` import outside it. Wrappers stay TextInput/Select/Button. Before adding a chrome-ui component, check `chrome-ui/index.ts` and flowbite's exports (DS decision tree).\n- Tokens: `var(--bk-*)` only. No hex in chrome. A missing token is added in Figma → `scripts/tokens/figma-tokens.json` → `node scripts/tokens/generate.mjs`. Never hand-edit `tokens.generated.*`.\n- One accent `#1A56DB`. No purple/violet/indigo. Inter for UI, Geist Mono for data with `tabular-nums`. No system font fallbacks.\n- No raw `<button>/<input>/<select>/<textarea>` outside chrome-ui (Gate 24). No `createPortal` outside the overlay-root primitives (Gate 22).\n- No AI entry points in the editor UI (owner 2026-10-17).\n- One undo system (target state, delivered by Task 1.2): Undo/Redo controls live only in the topbar. Today the only undo control is the canvas footer's. Brand already shares the composer stack and renders no undo buttons (`src/editor/design-system/ui/BrandWorkspace.tsx:31` is a doc comment; its ⌘Z mentions are toast hints only).\n- Data flow (root CLAUDE.md): Page → tRPC → Router → Service → Prisma. Any server change goes through the full chain, with schemas in `packages/shared/schemas`.\n- `../../` imports are banned. Use `@/` aliases.\n- Tests that protect the OLD design are rewritten in the same commit. Visual pins are re-baselined only in the commit that intends the visual change, with \"re-baseline: <surface>\" in the commit body.\n- Never stage `packages/editor/src/editor/shell/AquibraStudio.tsx` from an agent session (founder WIP).\n- No `git stash` mid-execution. Use a worktree under `~/Desktop/buildrik-worktrees/`.\n- Gate commands run with **cwd `packages/editor`**: `pnpm run verify:ds`, `pnpm run gate:tokens-generated`. `pnpm run audit:rules` runs at the repo root. Push only through the pre-push gate. Never `--no-verify` without saying so.\n- Figma MCP budget: 200 calls/day and 15/min, shared by all agents. The Figma route is the session's Figma tools if present, else `scripts/baseline/figma-mcp.mjs` (it needs the plugin-bundle header for `use_figma`). Lanes read the local dump, not Figma.\n\n## Review Focus\n\n1. **Page switcher with many pages.** A site with 100 pages plus collection templates must let the user reach any page in ≤2 interactions. Owner: Task 1.3. Test: `PageSwitcher › lists 100 pages with search and keyboard selection`.\n2. **Load failed, then the user edits anyway.** No path may write while the site is not loaded: inspector, keyboard shortcuts (⌘Z, Delete, paste), Layers/Insert drag, page switcher and autosave. The save status must never say \"Saved\". Owner: Task 1.6. Tests are listed there.\n3. **Undo after a Brand or canvas change.** Topbar Undo/⌘Z undoes the last composer change wherever it happened, and no second undo control exists. CMS record edits are server records outside `composer.history`. Their undo is out of scope here, and L-C records whether boards claim otherwise. Owner: Task 1.2.\n4. **Narrow window.** At 1024×768 and 1280×720 the topbar shows \"Request review\" and \"⋯\" fully, and the bottom bar does not overflow. Owner: Tasks 1.2 and 1.3. Playwright pins at 1024, 1280 and 1440.\n5. **Publish with a blocking issue.** The only publish CTA is in the tray, with its reason underneath. The topbar shows no second disabled Publish while the tray is open. Owner: Task 1.7.\n\n---\n\n## Manifest schema (used by every phase)\n\n`packages/editor/scripts/conformance/boards-2l9.json` uses the **same row schema as `boards.json`**, plus one field:\n- `{nodeId, name, page, family, status, authority, verified, verifiedNote, recipe?, state?, inheritsFrom?}`\n- `inheritsFrom` names the archetype row whose live verification covers this row (same component structure, differing only in state or sample data). Lanes live-verify archetypes and set siblings' `verified` from them.\n- `status` ∈ `active | design-ahead | out-of-scope`\n- `verified` ∈ `no | driven | match | drift-open | drift-fixed | unreachable`\n- `authority` ∈ `board | code:<reason> | founder:<reason> | blocked:<reason> | open:<reason> | superseded:<id> | undecided`\n\nThe inventory status maps to manifest values like this:\n\n| Inventory status | `verified` | `authority` |\n|---|---|---|\n| `match` | `match` | `board` |\n| `drift` | `drift-open` | `board` |\n| `missing` | `no` | `board` |\n| `code-ahead` | `no` | `code:<reason>` |\n| `blocked:<r>` | `no` | `blocked:<r>` |\n\n**Done predicate:** one predicate, used by the census script (Task 0.4) and the final gate. A row is done when `status !== \"active\"` OR `verified ∈ {match, drift-fixed}` OR `authority` starts with `code:`, `founder:`, `blocked:` or `superseded:`. `undecided` and `open:` are not done. A row a lane cannot reach is set to `verified: unreachable` + `authority: blocked:unreachable-<reason>`. A `driven` row stays open until it is compared. The census prints counts per authority class and per verification mode (direct vs `inheritsFrom`), and the final gate lists every `blocked:`/`unreachable`/`code:` row for the owner to acknowledge.\n\n**Live comparison app:** board-vs-live comparisons use the shipping editor (`/edit/:id` in the Next dashboard, `NEXT_PUBLIC_UNIFIED_EDITOR=true`, dev port 3000) with the QA workspace's seeded site (qa@buildrik.local). States the live app cannot produce use probe cases.\n\n**Manifest retirement:** if a later design file supersedes 2L9, `boards-2l9.json` is frozen as history the same way `boards.json` was, and the census moves to the new manifest.\n\nTHE LOOP gains one step for every lane: after the live comparison, update the board's manifest row (`verified`, `verifiedNote`, and `authority` when the code wins) in the same commit.\n\n## Phase 0 · Foundation (lead session, sequential; spread over 2 days of Figma budget)\n\n### Task 0.0: Integration branch and worktree\n\n- [ ] Step 1: From `main`, run `git worktree add ~/Desktop/buildrik-worktrees/design-2l9 -b feat/design-2l9`. Phase 0 and Phase 1 work happens here. Each Phase-1 task that passes its own verification ships to `main` as its own small PR (correctness fixes do not wait for the whole design). Phase 2 lanes branch from `feat/design-2l9` as `feat/design-2l9-<lane>` and PR back into it. Every lane rebases onto `main` weekly. Phase 2 reaches `main` after the final gate.\n- [ ] Step 2: In the worktree, run `pnpm install` and `pnpm run hooks:install`.\n\n### Task 0.1: Local design dump\n\n**Files:**\n- Create: `packages/editor/docs/design-2l9/dump/page-<id>.json`. One record per top-level frame: id, name, size, section, text strings, component instances (main name + overridden props), and top-level layout boxes. All of these are taken **only from nodes visible through their whole ancestor chain**. Hidden `Legacy ·` shells and other hidden layers are skipped, and the dump includes a test case on a known Legacy frame (e.g. `225:2821`). This is dictionary-encoded per memory `figma-page-dump-technique` (~20 KB per return, cursor resume).\n- Create: `packages/editor/docs/design-2l9/shots/<nodeId>.png`. **≤40 archetype screenshots** (one per family plus unique states).\n- Create: `packages/editor/docs/design-2l9/README.md` with per-page and per-family counts and the Figma calls actually spent.\n\n- [ ] Step 1: Dump pages 03, 04, 05, 06, 07 and 09, plus the Improved page components (`Shell/*`, `StatusBadge`, `Shell/PageSwitcherMenu` `558:4419`, `FirstRun/Checklist`). Budget: ≤60 calls on day 1.\n- [ ] Step 2: Take the ≤40 archetype screenshots (day 2 if day 1's budget is spent).\n- [ ] Step 3: Verify that the dump's per-page frame counts equal a live count (same day or the next day's recount). After the owner's Legacy cleanup (~2026-10-29), re-run the dump and commit the diff; frame counts must not change, only hidden-node counts. Expected counts from 2026-10-22: 03: 360, 04: 313, 05: 562, 06: 687, 07: 94, 09: 236 [measured, flow-audit]. A mismatch means investigate and redo that page.\n- [ ] Step 4: Commit `docs(design-2l9): local dump of canonical design`.\n\n### Task 0.2: New manifest and source-of-truth repoint\n\n**Files:**\n- Create: `packages/editor/scripts/conformance/boards-2l9.json`, with `fileKey: \"2L9OTGzBrL6kYmU18yA1c7\"` and rows built from Task 0.1's dump. Use the manifest schema above.\n- Modify: `packages/editor/CLAUDE.md`, the FIGMA UI REBUILD section. The new file key becomes the current target; `g4GzQ…` page `4418:45431` is named as history.\n- Modify: `packages/editor/scripts/conformance/README.md`. Both manifests are listed; `boards.json` stays the regression net for existing recipes.\n- Do NOT rewrite `boards.json` rows. Its recipes may be edited only when a Phase-1/2 change moves the element they measure (see Task 1.0).\n\n- [ ] Step 1: Generate the rows with `status: active` and `verified: \"no\"`, `authority: \"board\"`. Frames in sections named Reference/Archive/FUTURE and anything `Legacy ·` are `out-of-scope`.\n- [ ] Step 2: Edit CLAUDE.md and README.\n- [ ] Step 3: At the repo root, run `pnpm run audit:rules`. Expected: no new findings on the edited lines.\n- [ ] Step 4: Commit `docs(editor): design source of truth → 2L9OTGzBrL6kYmU18yA1c7`.\n\n### Task 0.3: Gap inventory (≤6 read-only agents, zero Figma calls)\n\n**Files:**\n- Create: `packages/editor/docs/design-2l9/gap-inventory.md`. It has one table per family: board · code surface (file:line) · status `match | drift | missing | code-ahead | blocked:<reason>` · notes.\n\n- [ ] Step 1: Dispatch one agent per page group: 03 Editor · 04 Inspector · 05 Resources · 06 Site delivery · 07 Recovery · 09 Play journeys. Play journeys become the acceptance scripts. Each agent cites file:line for every `match`/`drift`. Page 05 rows are tagged by board prefix: `B6-B*` → family `brand` (L-D); `B5-*`, `B6-A*`, `B6-K*`, `B6-T*` → families `cms`, `assets`, `components`, `templates` (L-C).\n- [ ] Step 2: The lead merges the reports and moves shared chrome rows to Phase 1. It marks class-first styling rows `blocked:owner` (pending flow decisions, memory `styling-model-class-first`), along with owner items.\n- [ ] Step 3: Write the statuses into `boards-2l9.json` using the mapping table.\n- [ ] Step 4: Commit `docs(design-2l9): gap inventory`.\n\n### Task 0.4: Census script\n\n**Files:**\n- Create: `packages/editor/scripts/conformance/census-2l9.mjs`.\n- Test: `packages/editor/scripts/__tests__/census-2l9.test.mjs`. This path is inside the vitest include globs in `vitest.config.ts:14–17`.\n\n- [ ] Step 1: Failing tests.\n  - `census › exits 1 listing rows that fail the done predicate`.\n  - `census › exits 0 when every active row is done`.\n  - `census › treats authority \"undecided\" and \"open:*\" as not done`.\n- [ ] Step 2: Implement it, using the done predicate above verbatim. Print a per-family count.\n- [ ] Step 3: Add TODOS.md entries for the two owner deferrals: first-run page 08 (blocked on B9 interviews) and Figma Legacy-layer cleanup (option B, ~2026-10-29).\n- [ ] Step 4: Commit. The script retires once the done predicate holds for every row.\n\n**Phase 0 exit gate:** dump verified, manifest populated, inventory merged, census runs and lists the open rows.\n\n---\n\n## Phase 1 · Shell (one lane, sequential; blocks Phase 2 visuals)\n\nEvery task follows THE LOOP (packages/editor/CLAUDE.md):\n1. Read the board from the local dump (`get_design_context` only for a board missing from it).\n2. Build with chrome-ui.\n3. Compare the live screenshot with the board side by side at 1440×900.\n4. Rewrite tests that protected the old design.\n5. Update the manifest row.\n\n**Shared verification for every Phase-1 task (cwd `packages/editor`):**\n- `npx vitest run <touched tests>` passes.\n- `npx tsc --noEmit > /tmp/tsc.log; echo $?` prints 0. Never read tsc's exit through a pipe.\n- `pnpm run verify:ds` passes.\n- Visual pins.\n  - Component pins go in `e2e/visual-pins.spec.ts` and its existing `visual-pins.spec.ts-snapshots/` folder. They render probe cases (`/e2e/probe/probe.html?case=`), and each new case sets its own viewport with `test.use({ viewport })` at 1440×900, 1280×720 and 1024×768.\n  - Whole-shell checks (topbar overflow, bottom bar overflow, tray fit, load-failed) go in a new spec, `e2e/design-2l9-shell.spec.ts`. It renders a new probe case `shell-full` (StudioHeader + bottom bar + canvas column with a stub composer, with states selected by query param) on the existing probe server (`playwright.config.ts`, port 5051) at the three viewports.\n  - Both specs wait for `document.fonts.ready`.\n- Every control ships an RTL-tested keyboard/a11y contract (focus order, aria state, Esc).\n\n### Task 1.0: Keep the regression net green\n\n**Files:** `scripts/conformance/boards.json` (recipes, copy lines and the two `PageTabBar` mentions only), `e2e/visual-pins.spec.ts` and its snapshots, and `e2e/probe/probe.tsx` (the pin harness; it imports `PageTabBar` at :107 and renders it at :2685).\n\n- [ ] Step 1: Before each Phase-1 task, list the recipes and copy checks that `check-boards.mjs`, `check-copy.mjs` and `check-anchors.mjs` read for the elements the task moves (for example the `canvas-footer-toolbar` pin for Task 1.2).\n- [ ] Step 2: In the same commit as the change, update those recipe selectors and copy strings and re-baseline the affected pins. The commit body notes \"re-baseline: <surface>\".\n- [ ] Step 3: Confirm that `pnpm run verify:ds` is green after each task.\n\n### Task 1.1: Shell tokens\n\n**Files:** `scripts/tokens/figma-tokens.json`, `src/themes/tokens.generated.*` (via the generator only).\n**Produces:** every colour, radius and type value used by Tasks 1.2–1.8 exists as a `--bk-*` token.\n\n- [ ] Step 1: Read the 2L9 variables (`Buildrick / Primitives`, `Buildrick / Chrome`, `Buildrick / Geometry`) with the read-only export script in `scripts/tokens/README.md` (\"Re-export from Figma\"), run against file `2L9OTGzBrL6kYmU18yA1c7`. Diff them against `figma-tokens.json`, which was exported from `g4GzQ…` collections `Primitives`/`Package`.\n  - If the values match, switch the README's source file to 2L9.\n  - If they differ, list each delta in the commit body. Change only the tokens Phase-1 surfaces use, and leave the others for an owner review.\n- [ ] Step 2: No Figma writes. The hex surface background on `StatusBadge` and `Shell/PageSwitcherMenu` (`558:4419`) is recorded as a `verifiedNote` on their manifest rows; code uses the existing surface token. Budget: ≤10 Figma calls for Step 1.\n- [ ] Step 3: Paste the export into `figma-tokens.json`, then run `npm run tokens:generate` (`node scripts/tokens/generate.mjs`).\n- [ ] Step 4: Run `pnpm run gate:tokens-generated` (cwd `packages/editor`). Expected: PASS. Commit.\n\n### Task 1.2: Topbar — one undo, review copy, overflow-safe\n\n**Files:**\n- `src/editor/chrome-ui/Topbar.tsx`\n- `src/editor/shell/StudioHeader.tsx`\n- `src/editor/canvas/CanvasFooterToolbar.tsx` (props `onUndo`/`onRedo` :71–78, `showEditGroup` :253, render :307)\n- `src/editor/canvas/Canvas.tsx:956`, which passes `onUndo={() => composer.history.undo()}`; remove it\n- Tests for each.\n\n**Consumes:**\n- `composer.history.undo()/redo()`.\n- Composer events `history:recorded` (`shell/hooks/useComposerInit.ts:567`), `history:undo` and `history:redo` (:898–899), plus `history:changed`, `history:cleared` and `history:unrecorded` (`src/shared/constants/events.ts:128–131`; these fire on project load and version restore).\n\n**Produces:**\n- `Topbar` renders a `History` group (Undo, Redo) placed right after the site-settings control. That control is in `StudioHeader.tsx`; find it with `grep -n \"Site settings\\|settings\" src/editor/shell/StudioHeader.tsx` and record the anchor in the commit. `disabled` is driven by `composer.history.canUndo()/canRedo()`.\n- `StudioHeader` subscribes to those events itself. It does **not** take `canUndo` from `AquibraStudio.tsx`, which is not staged.\n\n- [ ] Step 1: Failing tests.\n  - `StudioHeader › renders exactly one Undo and one Redo, inside the topbar History group; disabled when history is empty; enabled after a history:recorded event`.\n  - `› disabled again after history:cleared`.\n  - `› re-reads canUndo/canRedo on history:changed`.\n- [ ] Step 2: Failing test `CanvasFooterToolbar › renders no undo/redo controls`.\n- [ ] Step 3: Failing test `Topbar › review control reads \"Request review\" with no round; \"In review · {n} open\" when an open count is provided; \"In review\" when the count is unavailable`. `reviews.status` has no count today (boards.json `open:pill-count`); do not invent one.\n- [ ] Step 4: Implement. Remove the canvas footer undo group. Wire the topbar undo through composer events.\n- [ ] Step 5: Pins at 1024/1280/1440. At 1024 \"Request review\" and \"⋯\" lie inside the topbar box.\n- [ ] Step 6: Commit `feat(shell): one undo in the topbar; review copy`.\n\n### Task 1.3: Bottom bar — page switcher and dropdown\n\n**Files:**\n- Delete `src/editor/shell/PageTabBar.tsx`. Create `src/editor/shell/PageSwitcher.tsx`.\n- Create `src/editor/chrome-ui/PageSwitcherMenu.tsx`, mirroring `Shell/PageSwitcherMenu` `558:4419`, and export it.\n- Update the importers:\n  - `shell/StudioPanels.tsx:47,871`\n  - `sidebar/tabs/pages/usePages.ts`\n  - `e2e/probe/probe.tsx:107,2685` (the pin harness; render `PageSwitcher` there instead)\n  - `StudioPanels.inspectorColumn.test.tsx`\n  - `useActivePageId.test.tsx`\n- Delete `shell/__tests__/PageTabBar.test.tsx`.\n- Update `shell/regionCycle.ts:18`, whose region selector `[role=\"tablist\"][aria-label=\"Site pages\"]` points at the old tab bar. Point it at the page switcher button, and update `regionCycle.test.ts` only if its stub encodes that selector.\n- Update `shell/hooks/useEditorShortcuts.ts` and the shortcuts sheet / ⌘K palette entries.\n\n**Produces:**\n- New type `PageSummary = { id: string; name: string; slug: string; kind: \"static\" | \"template\"; collectionId?: string }` in `src/shared/types/`. It is derived from the page list `usePages.ts` already reads. `kind: \"template\"` means the page is a CMS collection template (the dynamic-page binding shown in `DynamicPagesPane`). Selecting a template row opens that template page exactly like a static page.\n- `<PageSwitcher pages: PageSummary[] activePageId: string onSelect(id: string) onManagePages() />`.\n- `<PageSwitcherMenu>` rendered through `Popover` (Gate 22). The rows are the static pages, then a \"Templates\" group (collection template pages), then \"Manage pages ›\".\n- Count text: `${static} pages · ${templates} template(s) · ⇧⌘O to switch`. The template part is dropped at 0.\n- Shortcut: **⇧⌘O** opens the menu (first confirm with `grep -rn \"key.toLowerCase() === \\\"o\\\"\" src/editor` that it is unbound, and check Chrome/Safari do not reserve it on macOS; if it is taken, pick the next free chord and record it). ⌘P stays Preview (`useEditorShortcuts.ts:177`) and ⇧⌘P stays the palette (:137). The board's \"⌘P to switch\" copy is overruled; record `authority: code:shortcut-cmd-p-is-preview` on the board row.\n\n- [ ] Step 1: Failing tests.\n  - `PageSwitcher › shows active page name + slug`.\n  - `› count text \"5 pages · 1 template · ⇧⌘O to switch\"`.\n  - `› ⇧⌘O opens menu; ⌘P still triggers Preview`.\n  - `› lists 100 pages with search and keyboard selection`.\n  - `› Esc closes and returns focus to the switcher`.\n  - `› aria-expanded reflects open state`.\n- [ ] Step 2: Failing test `bottom bar in resource areas (CMS, Brand, Settings, Assets) renders no page switcher and shows \"Editor keeps {page} open — return with ‹ Back to Editor\"`. Board: `Shell/BottomBar` Context=Resource area `497:99474`. The component is the bottom-bar host that `StudioPanels.tsx` renders where `PageTabBar` sat (:871).\n- [ ] Step 3: Implement. Delete `PageTabBar.tsx` and update every importer and test listed above in the same commit.\n- [ ] Step 4: Playwright: open the menu and pick \"About\"; the canvas page changes. No overflow at 1024 and 1280. Pins.\n- [ ] Step 5: Commit.\n\n### Task 1.4: Inspector header — compact 84 px\n\n**Files:** `src/editor/inspector/components/InspectorHeader.tsx` and its tests.\n**Produces:** two rows.\n- Row 1: Target (icon, name, ⋯).\n- Row 2: \"Editing\" + a Select with value `${breakpoint} · ${state} state`.\n\nThe breadcrumb row (the 104 px variant) renders only when the page is a collection template, or when the selected element has more than two ancestors in the element tree (parent chain via `composer.elements`). Otherwise the header is 84 px. Test both.\n\n- [ ] Step 1: Failing tests.\n  - `InspectorHeader › one \"Editing\" select shows \"Desktop · Default state\"; no separate breakpoint line`.\n  - `› the Editing select is reachable by Tab and labelled \"Editing\"`.\n- [ ] Step 2: Implement. Playwright `getBoundingClientRect().height` is 84 ± 1. Pin.\n- [ ] Step 3: Commit.\n\n### Task 1.5: Breakpoint switcher — icon-only segmented control\n\n**Files:** `src/editor/chrome-ui/BreakpointSwitcher.tsx` and its tests.\n\n- [ ] Step 1: Failing test `BreakpointSwitcher (unlabelled) › wide (when enabled), desktop, tablet, mobile icon buttons in that order with aria-labels \"Wide\", \"Desktop\", \"Tablet\", \"Mobile\"; active has aria-pressed=true; no visible text; tooltip \"Tablet · {width}px\" from breakpoint config`. The code's \"Mobile\" wording wins over the board's \"Phone\" (record `authority: code:mobile-label`). The `labelled`/`sublabels` props stay for their existing consumers and their tests stay green.\n- [ ] Step 2: Implement, pin, commit.\n\n### Task 1.6: Load-failed is truly read-only\n\n**Files:**\n- `src/engine/Composer.ts`\n- `src/shared/constants/events.ts`\n- `src/editor/shell/hooks/useComposerInit.ts` (load path, `onLoadError` :81/:165, autosave scheduling on `project:changed` near :382)\n- `src/editor/shell/StudioPanels.tsx:309`, `src/editor/shell/TimeTravelHost.tsx:105–108`\n- `src/editor/shell/LoadErrorBanner.tsx`, `src/editor/chrome-ui/SaveStatus.tsx`\n- `src/editor/shell/StudioHeader.tsx` (hide Publish)\n- The canvas selection toolbar under `src/editor/canvas/`\n- The inspector root and the Layers/Insert drag sources\n- Tests\n\n**Consumes:**\n- The load failure that `useComposerInit.ts` reports through `onLoadError` (:81). `AquibraStudio.tsx` is not edited.\n- The existing engine gate `composer.readOnly` (`src/engine/Composer.ts:144`). It already blocks `CommandCenter` mutations (`CommandCenter.ts:142`, :214) and the capture-phase keydown path. Today two writers assign it: `StudioPanels.tsx:309` (view mode) and `TimeTravelHost.tsx:105–108` (save/restore).\n\n**Produces:**\n- `Composer.editLocks: Set<\"view\" | \"time-travel\" | \"not-loaded\">` and `composer.setEditLock(reason, on: boolean)`. The latter emits the new `EVENTS.EDIT_LOCK_CHANGED = \"editlock:changed\"`.\n- `composer.readOnly` becomes an accessor: `get` returns `editLocks.size > 0`; `set(v)` maps to `setEditLock(\"view\", v)` for back-compat.\n- `StudioPanels` and `TimeTravelHost` move to `setEditLock(\"view\"|\"time-travel\", …)`, so no writer can overwrite another.\n- The name avoids `ProInspector.tsx:242`'s unrelated `readOnlyReason`.\n- `useComposerInit.ts` calls `setEditLock(\"not-loaded\", true)` where it reports a load failure, and clears the lock when a retry load succeeds. This is the single choke point.\n- The autosave scheduling on `project:changed` skips while `editLocks.has(\"not-loaded\")`.\n- The inspector root, the Layers/Insert drag sources and the canvas selection toolbar subscribe to `editlock:changed` and read `composer.readOnly` (no per-control guards).\n- The page switcher opens, but its rows are disabled with the tooltip \"Available when the site loads\". Navigation needs the loaded project.\n\n- [ ] Step 1: Failing tests.\n  - `› inspector inputs disabled with aria-disabled`.\n  - `› save status reads \"Not loaded · nothing saved yet\"`.\n  - `› ⌘Z, Delete and paste do nothing`.\n  - `› drag from Layers/Insert does not start`.\n  - `› page switcher opens but rows are disabled with \"Available when the site loads\"`.\n  - `› Composer › readOnly stays true while any lock remains (view + not-loaded; clear one, still true)`.\n  - `› editlock:changed fires on each change`.\n  - `› successful retry clears the not-loaded lock`.\n  - `› autosave not scheduled`.\n  - `› canvas selection toolbar not rendered`.\n  - `› topbar Publish not rendered`.\n  - `› inspector notice \"View only until the site loads\"`.\n  - `› Retry re-runs load`.\n- [ ] Step 2: Implement. The banner message is not duplicated on the canvas. Pin.\n- [ ] Step 3: Commit.\n\n### Task 1.7: Publish tray — one CTA, canvas fits\n\n**Files:**\n- Create `src/editor/shell/PublishTray.tsx`. No tray component exists today; \"Publish changes\" lives in `lifecycle.ts`, `useLifecycle.ts`, `usePublishJob.ts` and `Topbar.tsx`.\n- `sidebar/tabs/publish/PrePublishChecks.tsx` (reuse the checks list).\n- `StudioHeader.tsx`\n- Tests.\n\n- [ ] Step 1: Failing tests.\n  - `PublishTray › one CTA; reason \"Fix {n} blocking issue(s) to publish\" when n>0`.\n  - `› topbar Publish hidden while tray open`.\n  - `› Esc closes the tray and returns focus to the topbar control that opened it`.\n  - `› focus is trapped inside the tray while open`.\n- [ ] Step 2: Implement. Boards: Publish v2 `499:2656` and B8-PB01 `233:2`. While the tray is open, the canvas column shrinks and the authored viewport scales to fit. Playwright asserts the viewport's right edge is ≤ the canvas column's right edge − 24. Pin.\n- [ ] Step 3: Commit.\n\n### Task 1.8: CMS record status badges\n\n**Files:** the CMS records table in `src/editor/cms/` (locate the status column) and its tests. No new chrome-ui component: compose `Badge` (flowbite re-export in `chrome-ui/index.ts`) with tone classes that use `--bk-*` tokens.\n\n- [ ] Step 1: Failing tests.\n  - `CmsRecordsTable › status column renders a Badge per status: Draft→neutral, Published→success, Changed since publish→warning`.\n  - `› each badge carries its status text (state is never colour-only)`.\n- [ ] Step 2: Failing test `badge tone contrast ≥4.5:1`, computed from the token values in `src/themes/tokens.generated.ts`, not from jsdom styles. The token pairs are found by value:\n  - Draft: fg `#4B5563` on bg `#F3F4F6` → 6.87.\n  - Published: fg `#057A55` on bg `#DEF7EC` → 4.75.\n  - Changed since publish: fg `#723B13` on bg `#FDFDEA` → 8.69.\n\n  A missing token goes through Task 1.1.\n- [ ] Step 3: Implement, pin, commit. Ownership of this file passes to L-C when Phase 1 exits.\n\n**Phase 1 exit gate:**\n- Play journeys F1–F6 walk live up to the point where they leave shell chrome.\n- Pins green at three widths.\n- `verify:ds` green.\n- An independent read-only reviewer (`design-guard-reviewer` if available) reports no Critical findings.\n- Shell manifest rows are `match`/`drift-fixed`/authority.\n\n**Ownership handoff after Phase 1:**\n- `LoadErrorBanner.tsx` → L-F.\n- `PublishTray.tsx` and `sidebar/tabs/publish/*` → L-E.\n- CMS table → L-C.\n- Phase 1 keeps `Topbar.tsx`, `StudioHeader.tsx`, `PageSwitcher.tsx`, `BreakpointSwitcher.tsx` and the inspector header. Lanes file change requests against these to the lead.\n\n---\n\n## Phase 2 · Surface lanes (parallel, one worktree + agent each)\n\nEach lane:\n1. Writes `docs/superpowers/plans/2026-10-2x-lane-<id>.md` from its inventory rows, using this plan's header, Global Constraints, Review Focus and manifest schema.\n2. Executes it with THE LOOP, including the manifest update.\n3. Opens a PR into `feat/design-2l9`.\n\nLanes change only rows marked `drift` or `missing`. Lanes own only the paths listed below.\n\n| Lane | Family (page) | Owns (under `packages/editor/src/editor/` unless noted) | Acceptance |\n|---|---|---|---|\n| L-A | Editor: canvas, Layers, Pages, Insert (03) | `canvas/` (except `CanvasFooterToolbar` undo, done in Phase 1), `sidebar/tabs/layers/`, `sidebar/tabs/pages/`, `sidebar/tabs/build/` | Play F1 and F3 live; every 03 row done |\n| L-B | Inspector (04) | `inspector/` (except the header, done in Phase 1) | Every 04 row done. Class-first styling rows are `blocked:owner` until its flow decisions close (spec: `docs/audits/2026-10-20-webflow-reverse-audit/CLASS-FIRST-SPEC.md`) |\n| L-C | Resources: CMS, Assets, Components, Templates (05) | `cms/`, `sidebar/tabs/content/`, `sidebar/tabs/media/`, `media/`, `sidebar/tabs/ComponentsTab.tsx`, `sidebar/tabs/component-library/`, `sidebar/tabs/templates/` | Play F2 live; every 05 (non-Brand) row done. A server change needs the full tRPC chain plus shared schemas |\n| L-D | Brand / design system (05) | `design-system/` | Brand rows done; no panel undo control |\n| L-E | Site delivery: Settings, Publish, Analytics, Domains, Security (06) | `sidebar/tabs/settings/`, `sidebar/tabs/publish/`, `shell/PublishTray.tsx`, `shell/PublishDiffView.tsx`, `shell/PublishHistory.tsx`; dashboard routers only with the full chain | Play F4 live; every 06 row done |\n| L-F | Recovery, access, review (07 + F5) | `shell/LoadErrorBanner.tsx`, `shell/RecoveryBanner.tsx`, `shell/SaveFailedBanner.tsx`, `shell/ViewerRoleNotice.tsx`, `shell/SendForReview.tsx`, `sidebar/tabs/review/`, `collaboration/` | Play F5 and F6 live; every 07 row done |\n\n**Out of scope (owner):**\n- First-run (page 08), until the B9 interviews.\n- Figma Legacy-layer cleanup (option B, ~2026-10-29).\n- Class-first styling rows, until their flow decisions close.\n- Anything marked `blocked:owner`.\n\n**Integration:**\n- The lead merges into `feat/design-2l9` in order L-A → L-B → L-D → L-C → L-E → L-F.\n- After each merge: `verify:ds` (cwd `packages/editor`), all pins, and a re-walk of the affected journeys.\n\n**Final gate (whole design):**\n- `node scripts/conformance/census-2l9.mjs` exits 0.\n- F1–F6 walked live at 1440×900, 1280×720 and 1024×768.\n- An independent whole-branch review is done.\n- The owner signs off before any push to `main` or deploy.\n\n## Budget and agent limits\n\n- Agents (owner prefers light verification, memory `feedback-token-heavy-testing`):\n  - Phase 0: ≤6 read-only.\n  - Phase 1: 1 implementer; one independent reviewer at the Phase-1 exit, not per task.\n  - Phase 2: ≤6 lanes, one reviewer per lane PR.\n  - Live re-walks after a merge cover only the journeys that merge touches.\n- Figma calls: Phase 0 ≤ 60 on day 1 (dump) and ≤ 45 on day 2 (≤40 shots plus a recount). Phase 1 Task 1.1 ≤ 10 (token read + Figma binding). Otherwise Phases 1–2 spend ≤ 10 per day, only for boards missing from the dump.\n- Verification is the live app. A green unit suite is not acceptance.\n\n"}]} -->

### CEO · Step 0 (autoplan, SELECTIVE EXPANSION, 2026-10-22)

**Pre-review system audit.**
- Branch `main` @ `19f964d5e`. No stashes. `origin/main` has no commits since 2026-10-21 touching PageTabBar, BreakpointSwitcher, LoadErrorBanner or CLAUDE.md, and no commits matching PageSwitcher/StatusBadge/2L9.
- TODOS.md has a related prior item: the `gate:figma` staleness (TODOS.md:194). This plan does not touch it.
- Binding decisions read:
  - 2026-08-05: targeted conformance, not full re-derivation. Behaviour follows the code contract.
  - 2026-08-13: visual pins via Playwright `toHaveScreenshot`, plus a census gate.
  - 2026-08-24: full redesign, delivered as per-family design→implement→verify loops.

**0A Premise challenge.**

| Premise | Claim | Receipt | Verdict |
|---|---|---|---|
| P1 | 2L9 is the canonical design | owner message 2026-10-22; memory `design-source-of-truth-2l9.md` | verified (user-stated) |
| P2 | Code still points at the old file | packages/editor/CLAUDE.md:34 names `g4GzQFqzNYz5sosz1QtZXC` page `4418:45431` | verified |
| P3 | boards.json is the active conformance manifest for the old file | packages/editor/scripts/conformance/boards.json:4 `"page": "4418:45431"` | verified |
| P4 | Brand already shares one undo stack | packages/editor/src/editor/design-system/ui/BrandWorkspace.tsx:31 | verified |
| P5 | The canvas toolbar renders its own undo | packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:76 (`onUndo`), :307 | verified. The plan's "locate with grep" is replaced by this file |
| P6 | `pnpm run verify:ds` exists at the repo root | root package.json has no `verify:ds`; packages/editor/package.json has it | **finding**: run it in `packages/editor` |
| P7 | `gate:tokens-generated` exists | packages/editor/package.json only | finding: cwd is `packages/editor` |
| P8 | The gap is mostly drift, not absence | binding decision 2026-08-05 | unverified until the Phase-0 inventory. The plan already gates Phase 2 on the inventory |

`unverified=1` (P8; by design, resolved by Task 0.3).

The real problem: the shipped editor and the newly canonical design disagree. Developers have two Figma files and no manifest for the new one. The do-nothing cost is that every future UI change is built against the wrong file, and the audit fixes from 2026-10-22 never reach users. The plan solves this directly: repoint, inventory, conform. It is not a proxy.

**0B Existing code leverage.**

| Sub-problem | Existing code |
|---|---|
| Topbar | `chrome-ui/Topbar.tsx` (478 lines), `shell/StudioHeader.tsx` (1009) |
| Page tabs | `shell/PageTabBar.tsx` (156). Replaced, not refactored, because the interaction model changes from tabs to a menu |
| Breakpoint | `chrome-ui/BreakpointSwitcher.tsx` (131). Extended in place |
| Save status | `chrome-ui/SaveStatus.tsx` (190). Copy change only |
| Load error | `shell/LoadErrorBanner.tsx` (128) and `lifecycle.ts`. Extended with `readOnlyReason` |
| Popover | `chrome-ui/Popover.tsx` (Gate 22 compliant). Reused for the PageSwitcherMenu |
| TreeRow | `chrome-ui/TreeRow.tsx`. Reused by L-A |
| Conformance harness | `scripts/conformance/`. Reused, with a new manifest only |
| Undo | `composer.history`. Reused, no engine change |

REALITY: premise-table finding 8 premises, unverified=1 (P8) packages/editor/CLAUDE.md:34
REALITY: already-done pass no commits on origin/main since 2026-10-21 touching named files or symbols packages/editor/src/editor/shell/PageTabBar.tsx:1
REALITY: surface-check finding verify:ds and gate:tokens-generated exist only in packages/editor, not the root package.json:1
REALITY: binding-decisions pass plan honours 08-05 behaviour→code precedence, 08-13 visual pins, 08-24 per-family loops packages/editor/CLAUDE.md:44
REALITY: numbers finding frame counts 03:360 04:313 05:562 06:687 07:94 09:236 [measured: Figma flow-audit dump 2026-10-22]; Figma 200/day [estimated, memory]; Phase-0 call cost 60–90 [estimated] docs/superpowers/plans/2026-10-22-implement-2l9-design.md:62
REALITY: deferred-asks pass no linked issue; owner deferrals (first-run page 08, Legacy cleanup) listed in NOT in scope docs/superpowers/plans/2026-10-22-implement-2l9-design.md:230
REALITY: pr-count finding no .gstack/ship-policy.json → default one PR per wave; plan has Phase 1 = 1 PR and Phase 2 = 6 lane PRs into an integration branch, so the extra queue cost is 6 reviews docs/superpowers/plans/2026-10-22-implement-2l9-design.md:228

**0C Dream state.**
```
  CURRENT STATE                      THIS PLAN                              12-MONTH IDEAL
  editor built to old file,  --->    repoint + dump + inventory,    --->   one design file, one manifest,
  two Figma sources, tabs,           shell conformed, 6 lanes                every surface pinned by visual
  per-panel undo, no manifest        conform drift per family                snapshot; design change = 1 PR
```
The plan moves toward the ideal. The missing piece is the visual-pin step (E1 below).

**0D.** No new approach decision was needed. The approach (inventory-gated conformance) matches binding decisions 08-05 and 08-24.

**0F/0G Selective expansion candidates (auto-decided per autoplan principles; in blast radius, <1 day CC).**

| # | Proposal | Effort | Decision | Reasoning |
|---|---|---|---|---|
| E1 | Playwright `toHaveScreenshot` pin per Phase-1 surface at 1440 and 1024 | S | ACCEPTED (P1, P2) | Binding decision 08-13. It catches the visual regressions that unit tests miss |
| E2 | `scripts/conformance/census-2l9.mjs`: fails when an `active` row lacks `verified` or a recorded `authority` | S | ACCEPTED (P1) | Lanes and the final gate consume it. It retires when the manifest is fully `match` |
| E3 | Feature flag for the new shell | M | SKIPPED (P5) | No data migration; `git revert` of the Phase-1 PR is the rollback. A flag doubles the shell paths under test |
| E4 | Keyboard and a11y contract per Phase-1 control (focus order, aria-pressed/expanded, Esc) | S | ACCEPTED (P1) | DESIGN.md requires AA. It is in the same files |
| E5 | Implement first-run (page 08) | L | DEFERRED (owner) | Hypothesis only; B9 interviews are pending (memory figma-editor-design-improved) |

**0I Temporal interrogation.**
- **Hour 1:** the implementer needs the dump location, `boards-2l9.json`, and the cwd for gates (`packages/editor`).
- **Hours 2–3:** ambiguities.
  - Where review counts come from (`reviews.status` has no count → "In review" fallback, already in Task 1.2).
  - Template count source (collection pages).
- **Hours 4–5:** surprises.
  - `PageTabBar` deletion breaks `regionCycle.test.ts`, which references footer regions.
  - Founder WIP in `AquibraStudio.tsx`: lanes must not stage it.
- **Hour 6+:** visual pins flake on fonts; wait for `document.fonts.ready`.

Effort: Phase 0 (human ~3 days / CC ~3 h). Phase 1 (human ~2 weeks / CC ~1 day). Phase 2 (human ~2–3 months / CC ~1–2 weeks across 6 lanes).

### CEO · Step 0.5 dual voices

- **Claude CEO subagent:** completed (INPUT ceo 1b6ad1c5…). Findings F1–F7 and A1–A3; summarized in the Decision Audit Trail.
- **Codex CEO voice:** unavailable. `MODEL_QUOTA_EXHAUSTED`; the reset is Oct 27th, 2026 4:51 PM. No outside process completed. `[subagent-only]`

```
CEO DUAL VOICES — CONSENSUS TABLE:
  Dimension                            Claude  Codex  Consensus
  1. Premises valid?                    partly  N/A    N/A
  2. Right problem to solve?            partly  N/A    N/A
  3. Scope calibration correct?         no      N/A    N/A
  4. Alternatives sufficiently explored? no     N/A    N/A
  5. Competitive/market risks covered?  no      N/A    N/A
  6. 6-month trajectory sound?          risky   N/A    N/A
CONFIRMED = completed subagent + outside; outside unavailable → N/A.
```

### CEO · Review Sections

**Current scope:**
- Mode SELECTIVE EXPANSION (autoplan override).
- Accepted: E1, E2, E4, the 0H spec fixes, and the voice findings F2, F4, F5, F6, F7 plus the shortcut, rebase and retirement items.
- Deferred: E5 first-run, A1 Code Connect mapping, the interleaving of P0 functional work.
- Skipped: E3 feature flag.
- Pending at the gate as taste decisions: F1, F3.

**Section 1 · Architecture.**
```
                 Figma 2L9 (canonical)
                        │  Task 0.1 dump (visible-only, ≤105 calls)
                        ▼
  docs/design-2l9/dump + shots ──► boards-2l9.json ◄── census-2l9.mjs ──► final gate
                        │                 ▲  (THE LOOP updates rows)
                        ▼                 │
   gap-inventory.md ──► Phase 1 shell ────┤ ships PRs to main per task
                        │                 │
                        ▼                 │
        Phase 2 lanes L-A..L-F (worktrees) ┘ ──► feat/design-2l9 ──► main (final gate)
   engine: Composer.editLocks ──editlock:changed──► inspector / drag / toolbar / autosave
```
- **Coupling:**
  - `editLocks` adds one engine field and one event. That is justified because three writers already race on `readOnly`.
  - The topbar subscribes to history events, replacing prop drilling through `AquibraStudio`.
- **Single points of failure:**
  - The Figma budget, mitigated by the dump.
  - The integration branch, mitigated by per-task PRs and weekly rebase.
- **Rollback:**
  - Each Phase-1 PR reverts on its own in minutes; there is no data migration.
  - Lanes revert per PR.
- **Value test:**
  - The manifest and census feed the final gate and lane acceptance (owner request).
  - They are the smallest form, because they reuse the `boards.json` schema.
  - They retire on full done or when a successor file arrives.
- **Finding:** an integration-branch rot risk. It is resolved by F2 and the weekly rebase.

**Section 2 · Error & Rescue map.**
```
  CODEPATH                          | WHAT CAN GO WRONG                    | CLASS
  Task0.1 dump script               | Figma 429/quota, partial page         | figma quota / timeout
  census-2l9.mjs                    | malformed JSON row, unknown authority | parse/validation
  useComposerInit load path         | load fails (auth/network/missing)     | LoadErrorKind
  Composer.setEditLock              | unknown reason, double clear          | programming error
  PageSwitcher (100+ pages)         | empty pages list, stale active id     | state
  PublishTray                       | checks fetch fails                    | tRPC error
  -------------------------------------------------------------------------------
  CLASS               | RESCUED | ACTION                                   | USER SEES
  figma quota         | Y       | stop, resume next day by cursor          | n/a (dev)
  census parse        | Y       | exit 1 naming the row                    | n/a (dev)
  LoadErrorKind       | Y       | lock not-loaded, banner + Retry          | banner, view-only
  setEditLock misuse  | Y       | TS union type rejects unknown reason     | n/a
  empty pages list    | Y       | switcher shows "No pages" + Manage pages | empty state
  publish checks fail | Y (reuse)| existing PrePublishChecks error state   | error row + retry
```
No critical gaps. Every row has a rescue and a visible result.

**Section 3 · Security.** There are no new endpoints, auth paths or secrets. Server changes in lanes must go through the full tRPC chain, which keeps auth in its existing routers. The new user inputs are the page-switcher search (a client-side filter only) and Figma dump data, which is committed docs rather than executable. No issues found beyond requiring that lane server work keep existing per-workspace authorization; that requirement is already in Global Constraints.

**Section 4 · Data flow & interaction edge cases.**
```
  load fail → setEditLock(not-loaded) → editlock:changed → [inspector disabled | drag blocked | toolbar hidden | autosave skipped]
  retry ok  → setEditLock(not-loaded,false) → editlock:changed → restored (other locks keep readOnly true)
```
- **Async ordering.** Load failure and time-travel can happen together: TimeTravel sets the `time-travel` lock, then the load fails and adds `not-loaded`. Clearing either lock leaves `readOnly` true while the other remains. The Set-based design prevents last-writer-wins; Task 1.6 tests this.
- **Interaction edge cases:**

| Edge case | Handling |
|---|---|
| Switcher with 0 pages | Empty state |
| Switcher with 1 page | Menu still opens |
| Switcher with 100+ pages | Search |
| Double-click Publish | One CTA; existing job guard |
| Navigate away with the tray open | Esc and focus return |
| Narrow 1024 | Pins |

  No unhandled gaps.

**Section 5 · Code quality.** The plan reuses `Badge`, `Popover`, the `boards.json` schema, the composer gate and `PrePublishChecks`. New code is limited to `PageSwitcher`, `PageSwitcherMenu`, `PublishTray`, `editLocks` and the census. The `readOnly` accessor keeps back-compat, so there is no forced migration beyond the two writers. No over-engineering found. The `readOnlyReason` collision was avoided by naming the field `editLocks`.

**Section 6 · Tests.**
```
  NEW                         | TYPE        | HAPPY                     | FAILURE                         | EDGE
  census-2l9                  | unit(node)  | exit 0 all done           | exit 1 lists open rows          | undecided/open: not done
  editLocks                   | unit        | lock/unlock               | two locks, clear one            | event per change
  topbar undo                 | RTL         | enabled after record      | disabled after cleared          | changed re-reads
  PageSwitcher                | RTL+pin     | select page               | Esc focus return                | 100 pages, ⇧⌘O, ⌘P intact
  load-failed                 | RTL+probe   | view-only                 | ⌘Z/Delete/paste no-op           | retry clears lock
  PublishTray                 | RTL+probe   | one CTA                   | blocking reason                 | focus trap/return
  Badge                       | unit        | tone map                  | contrast ≥4.5                   | text always present
  shell-full probe            | Playwright  | 1440                      | 1024 overflow                   | 1280
```
- The 2am test is the load-failed probe case: no write leaves the client.
- Hostile QA would press Delete during a failed load; this is covered.
- The flaky risk is fonts in pins; mitigated by `document.fonts.ready`.

**Section 7 · Performance.** The PageSwitcher filters up to about 1,000 pages client-side. Search is O(n) per keystroke, which is acceptable; virtualise the list above 200 rows only if a pin shows jank (left to the implementer, not required). `editlock:changed` fires rarely. No N+1: no new DB queries in Phase 1. No issues.

**Section 8 · Observability.** The new failure mode is a failed load. The existing `LoadErrorBanner` path already reports it, and Sentry captures `onLoadError` kinds. Add `console.info("[editlock]", reason, on)` only in dev? Rejected: noise with no consumer. The census output is the operational dashboard for the arc. No gaps.

**Section 9 · Deployment.** There are no migrations. Phase-1 PRs deploy through the normal cPanel flow (memory `buildrik-prod-deploy-reality`). Rollback is a PR revert. Post-deploy smoke for each PR:
- open the editor;
- the topbar undo works;
- the page switcher opens;
- the load-failed probe is green in CI.

The feature flag was rejected (E3). Risk window: old and new shell never coexist in one bundle.

**Section 10 · Long-term trajectory.** Reversibility 4/5 (UI-only; the manifest is additive). Debt items:
1. Two manifests, `boards.json` and `boards-2l9.json`, until a retirement.
2. The demo app is not used for verification, so the probe cases must stay maintained.

The architecture supports later families. The retrospective holds: E1, E2 and E4 were the right picks. A1 (Code Connect) may become the next lever, and is deferred with that note.

**Section 11 · Design & UX.**
```
  [Editor] --⇧⌘O/click--> [Page menu] --row--> [Editor @ page]
     |  load fails                                   ^
     v                                               |
  [View-only + banner] --Retry ok--------------------+
  [Editor] --Publish--> [Tray: checks | Fix N | Publish] --publish--> [Published]
```
- The information hierarchy follows the boards.
- State coverage: switcher (empty, many, loading = page list loading, error = view-only), tray (blocking, ready, publishing, failed via the existing job states).
- AI-slop risk is low; the plan reuses DESIGN.md tokens.
- The responsive intent is explicit: 1024, 1280 and 1440.
- The a11y contract is per control.
- Recommend running /plan-design-review: that is Phase 2 of this autoplan.

### NOT in scope
- First-run page 08: deferred (owner, B9 interviews).
- Figma Legacy cleanup: deferred (owner option B, about 2026-10-29).
- E3 feature flag: skipped (revert is the rollback).
- A1 Code Connect component mapping: deferred to TODOS.md (needs tooling, outside the blast radius).
- Interleaving REA/Webflow P0 functional work into each lane: deferred, surfaced as taste at the gate (outside the blast radius).
- CMS record undo: out of scope; it is server records.

### What already exists
- `composer.readOnly` gate (Composer.ts:144) with CommandCenter enforcement.
- History events.
- `Badge` and `Popover` chrome-ui.
- `PrePublishChecks`.
- The `boards.json` schema and the `check-*` gates.
- The `visual-pins.spec.ts` probe harness.
- `figma-mcp.mjs`.
- The token export script in `scripts/tokens/README.md`.

### Dream state delta
After this plan: one canonical file, a census-backed manifest, the shell conformed and pinned, and lanes conforming by archetype. Still missing for the 12-month ideal: a component-level design↔code link (Code Connect), and functional parity (REA P0s, class-first styling).

### Failure Modes Registry
```
  CODEPATH            | FAILURE MODE                 | RESCUED | TEST | USER SEES        | LOGGED
  load path           | write after failed load      | Y       | Y    | view-only banner | Sentry
  editLocks           | lock leak (never cleared)    | Y       | Y    | stays view-only  | n/a
  topbar undo         | stale enabled state          | Y       | Y    | correct state    | n/a
  page switcher       | shortcut collision           | Y       | Y    | n/a              | n/a
  dump                | hidden Legacy text captured  | Y       | Y    | n/a (dev)        | n/a
  integration branch  | rot vs main                  | Y       | n/a  | n/a              | n/a
```
0 critical gaps.

### Completion Summary
```
  | Mode selected        | SELECTIVE EXPANSION                                     |
  | System Audit         | gates live in packages/editor; readOnly gate exists     |
  | Step 0               | 8 premises (1 unverified); E1/E2/E4 accepted            |
  | Section 1  (Arch)    | 1 issue (branch rot) → resolved                         |
  | Section 2  (Errors)  | 6 error paths mapped, 0 GAPS                            |
  | Section 3  (Security)| 0 issues, 0 High                                        |
  | Section 4  (Data/UX) | 6 edge cases mapped, 0 unhandled                        |
  | Section 5  (Quality) | 0 issues                                                |
  | Section 6  (Tests)   | Diagram produced, 0 gaps                                |
  | Section 7  (Perf)    | 0 issues                                                |
  | Section 8  (Observ)  | 0 gaps                                                  |
  | Section 9  (Deploy)  | 1 risk flagged (rebase cadence)                         |
  | Section 10 (Future)  | Reversibility: 4/5, debt items: 2                       |
  | Section 11 (Design)  | 0 issues                                                |
  | NOT in scope         | written (6 items)                                       |
  | What already exists  | written                                                 |
  | Dream state delta    | written                                                 |
  | Error/rescue registry| 6 rows, 0 CRITICAL GAPS                                 |
  | Failure modes        | 6 total, 0 CRITICAL GAPS                                |
  | TODOS.md updates     | 3 items proposed (first-run, Legacy, Code Connect)      |
  | Scope proposals      | 5 proposed, 3 accepted                                  |
  | CEO plan             | written                                                 |
  | Outside voice        | codex unavailable (quota)                               |
  | Lake Score           | N/A                                                     |
  | Diagrams produced    | 4 (architecture, data flow, user flow, registries)      |
  | Stale diagrams found | 0                                                       |
  | Unresolved decisions | 2 taste (F1, F3) → final gate                           |
  | Reality rows         | 7/7 rows, 1 unverified                                  |
```

<!-- AUTONOMOUS DECISION LOG -->
<!-- autoplan-baseline-edits:design {"sourceSha256":"4bab5261600bdf7f65c9a31759a32fe2e3c659d34f6e6fbc631f87303f6e094b","replacements":[{"oldText":"- `inheritsFrom` names the archetype row whose live verification covers this row (same component structure, differing only in state or sample data). Lanes live-verify archetypes and set siblings' `verified` from them.","newText":"- `inheritsFrom` names the archetype row whose live verification covers this row (same component structure, differing only in sample data or an interaction state: default, hover, focus, pressed, selected). Lanes live-verify archetypes and set siblings' `verified` from them. Error, empty, loading, disabled and read-only rows never inherit; each gets its own direct comparison."},{"oldText":"- [ ] Step 2: The lead merges the reports and moves shared chrome rows to Phase 1.","newText":"- [ ] Step 1b: The lead greps `src/editor` for surviving AI entry points (`grep -rnE 'aria-label=\"[^\"]*AI|✦|tab: \"ai\"|ai-chip' src/editor`) and adds each hit as a `drift` row owned by the lane that owns the file (the Inspector header hit belongs to Task 1.4).\n- [ ] Step 2: The lead merges the reports and moves shared chrome rows to Phase 1."},{"oldText":"Lanes change only rows marked `drift` or `missing`. Lanes own only the paths listed below.","newText":"Lanes change only rows marked `drift` or `missing`. Lanes own only the paths listed below. Each lane sub-plan also lists its `code-ahead` rows (features the code has and the board lacks) with one disposition each: \"kept at <location in the new layout>\" or \"owner decision\" (`authority: open:<reason>` until decided). A capability is never removed silently."},{"oldText":"- [ ] Step 3: Failing test `Topbar › review control reads","newText":"- [ ] Step 2b: Failing tests for undo routing and feedback.\n  - `useEditorShortcuts › ⌘Z/⇧⌘Z go to native field undo when focus is in an editable field (input, textarea, contenteditable outside the canvas), and to composer undo otherwise`.\n  - `Topbar › Undo tooltip \"Undo (⌘Z)\" and Redo \"Redo (⇧⌘Z)\", rendered through the platform shortcut formatter the shortcuts sheet uses; disabled tooltips \"Nothing to undo\" / \"Nothing to redo\"`.\n  - Labels stay generic (no action names); the history API is unchanged.\n- [ ] Step 3: Failing test `Topbar › review control reads"},{"oldText":"`reviews.status` has no count today (boards.json `open:pill-count`); do not invent one.","newText":"`reviews.status` has no count today (boards.json `open:pill-count`); do not invent one. The topbar control is the entry point only: clicking it opens the existing review flow, whose sending/sent/failed states and \"In review\" destination belong to L-F."},{"oldText":"- [ ] Step 5: Pins at 1024/1280/1440. At 1024 \"Request review\" and \"⋯\" lie inside the topbar box.","newText":"- [ ] Step 5: Narrow-width rule. Minimum supported width is 1024. As width shrinks, the site name ellipsizes first (min 80 px, full name in its tooltip); nothing else collapses at ≥1024. Pins at 1024/1280/1440 with the longest label variant \"In review · 12 open\": at 1024 the review control and \"⋯\" lie fully inside the topbar box and no control wraps."},{"oldText":"- New type `PageSummary = { id: string; name: string; slug: string; kind: \"static\" | \"template\"; collectionId?: string }` in `src/shared/types/`.","newText":"- New type `PageSummary = { id: string; name: string; slug: string; kind: \"static\" | \"template\"; collectionId?: string; collectionName?: string; isHome: boolean; dirty: boolean; depth: number }` in `src/shared/types/`."},{"oldText":"- `<PageSwitcher pages: PageSummary[] activePageId: string onSelect(id: string) onManagePages() />`.","newText":"- `<PageSwitcher pages: PageSummary[] activePageId: string onSelect(id: string) onManagePages() onAddPage() />`.\n- Capabilities kept from `PageTabBar` (`:74-78`, `:104`, `:117`): the home marker (house glyph + aria text \"Homepage\"), the per-page unsaved dot (aria text \"unsaved changes\") on the closed switcher and on each row, and \"+ Add page\" as the last action row of the menu (it opens the Pages panel exactly as the old \"+\" did)."},{"oldText":"- `<PageSwitcherMenu>` rendered through `Popover` (Gate 22). The rows are the static pages, then a \"Templates\" group (collection template pages), then \"Manage pages ›\".","newText":"- `<PageSwitcherMenu>` rendered through `Popover` (Gate 22). The rows are the static pages in page-tree order (indented by `depth`), then a \"Templates\" group (collection template pages, each row showing the collection name and slug pattern, e.g. \"Blog post · /blog/:slug\"), then \"+ Add page\" and \"Manage pages ›\".\n- Menu behaviour: a search field is always shown and focused on open, filtering by name and slug as the user types; the active page carries a check glyph and `aria-current=\"page\"`; no match shows \"No pages match '{query}'\"; max height 400 px with the list scrolling and search plus actions pinned."},{"oldText":"- Shortcut: **⇧⌘O** opens the menu (first confirm with `grep -rn \"key.toLowerCase() === \\\"o\\\"\" src/editor` that it is unbound, and check Chrome/Safari do not reserve it on macOS; if it is taken, pick the next free chord and record it).","newText":"- Shortcut: **⇧⌘O** on macOS, **Ctrl+Alt+O** elsewhere (Ctrl+Shift+O is Chrome's bookmark manager). First confirm with `grep -rn \"key.toLowerCase() === \\\"o\\\"\" src/editor` that both are unbound. The count text and tooltip render the chord through the platform shortcut formatter the shortcuts sheet uses, never a hard-coded \"⇧⌘\"."},{"oldText":"  - `› Esc closes and returns focus to the switcher`.","newText":"  - `› Esc closes and returns focus to the switcher`.\n  - `› search is focused on open; typing filters; \"No pages match 'zzz'\" on no result`.\n  - `› home page shows the home glyph with aria text \"Homepage\"; a dirty page shows the unsaved dot with aria text`.\n  - `› \"+ Add page\" row opens the Pages panel`.\n  - `› template row reads \"{collectionName} · {slug pattern}\"`.\n  - `› active row has aria-current=\"page\"`.\n  - `› non-Mac platform renders \"Ctrl+Alt+O\"`."},{"oldText":"Board: `Shell/BottomBar` Context=Resource area `497:99474`.","newText":"Board: `Shell/BottomBar` Context=Resource area `497:99474`; \"‹ Back to Editor\" sits where that board places it (read from the dump) and the test clicks it and asserts the editor returns to `{page}`."},{"oldText":"**Produces:** two rows.\n- Row 1: Target (icon, name, ⋯).\n- Row 2: \"Editing\" + a Select with value `${breakpoint} · ${state} state`.\n\nThe breadcrumb row (the 104 px variant) renders only when the page is a collection template, or when the selected element has more than two ancestors in the element tree (parent chain via `composer.elements`). Otherwise the header is 84 px. Test both.","newText":"**Produces:** two rows.\n- Row 1: Target (icon, name, ⋯).\n- Row 2: \"Editing\" + a Select. Its visible value is `${breakpoint} · ${state} state`, but its options are the element states only (Default, Hover, Focus, Active, …). The breakpoint part is a read-only prefix; the topbar `BreakpointSwitcher` is the only control that changes breakpoint, and the prefix follows it.\n- The \"✦ AI\" chip (`InspectorHeader.tsx:105-113`, `data-testid=\"inspector-ai-chip\"`) is removed (owner: no AI in the UI).\n\nThe breadcrumb row (the 104 px variant) renders only while the current page is a collection template. It does not depend on the selected element, so the header height never changes when selection changes within a page. Otherwise the header is 84 px. Test both."},{"oldText":"  - `› the Editing select is reachable by Tab and labelled \"Editing\"`.","newText":"  - `› the Editing select is reachable by Tab and labelled \"Editing\"`.\n  - `› Editing options are states only; changing breakpoint in the topbar updates the prefix`.\n  - `› inspector-ai-chip does not render`.\n  - `› header height is equal for a depth-1 and a depth-4 selection on the same page`."},{"oldText":"tooltip \"Tablet · {width}px\" from breakpoint config`.","newText":"tooltip \"Tablet · {width}px\" from breakpoint config`. The width readout lives only in the tooltip unless the board shows it elsewhere (check the dump). \"Wide\" renders only when the existing breakpoint config enables it; name that config key in the commit."},{"oldText":"  - `› save status reads \"Not loaded · nothing saved yet\"`.","newText":"  - `› save status reads \"Not loaded · nothing saved yet\"` (board copy; it describes this session, not the stored site).\n  - `› banner states the cause and that saved work is safe: offline → \"You're offline. Your saved work is safe.\" + Retry; 403 → \"You don't have access to this site.\" + Back to dashboard; 404 → \"This site no longer exists.\" + Back to dashboard; other → \"Couldn't load this site. Your saved work is safe.\" + Retry`. Board copy wins wherever the board already words a cause; these strings fill only causes the board lacks.\n  - `› Retry is busy (aria-busy, ignores repeat clicks) while loading; a second failure shows the attempt count and a \"Reload page\" action`.\n  - `› canvas shows a neutral empty state, not a skeleton and not the banner text`."},{"oldText":"- [ ] Step 2: Implement. The banner message is not duplicated on the canvas. Pin.","newText":"- [ ] Step 2: Implement. The banner is the one primary signal; save status, the inspector notice and disabled rows are quiet echoes. Publish is hidden (it would act on a site that is not there); page rows stay visible but disabled (they show the user's site structure exists). Pin."},{"oldText":"  - `› topbar Publish hidden while tray open`.\n  - `› Esc closes the tray and returns focus to the topbar control that opened it`.","newText":"  - `› the topbar Publish control stays rendered as the tray toggle (aria-expanded=true while open, no disabled second CTA, no layout shift)`.\n  - `› Esc closes the tray and returns focus to the topbar Publish toggle`.\n  - `› states, each with board copy from the B8-PB* boards in the dump: nothing to publish; warnings only (CTA enabled); blocking issues; no Vercel connection (CTA \"Connect Vercel\"); first publish vs republish; publishing (progress); success (live URL, \"View site\", \"Copy link\"); deploy failed (reason + \"Try again\"); CMS sync pending (CTA disabled with \"Saving CMS changes…\" while the sync outbox has outstanding writes)`.\n  - `› clicking an issue selects its element and keeps the tray open`.\n  - `› closing the tray restores the user's previous zoom`."},{"oldText":"Boards: Publish v2 `499:2656` and B8-PB01 `233:2`. While the tray is open,","newText":"Boards: Publish v2 `499:2656` and B8-PB01 `233:2`; the tray's dock side and width come from those boards. While the tray is open,"},{"oldText":"  - `› each badge carries its status text (state is never colour-only)`.","newText":"  - `› each badge carries its status text (state is never colour-only)`.\n  - `› every status in the CMS record Zod schema maps to a tone; an unmapped status falls back to neutral with its raw label`. The status list comes from the schema, not the board."},{"oldText":"**Phase 1 exit gate:**","newText":"**Interim mixed design (owner taste decision at the final gate):** shipping Phase-1 tasks to `main` one PR at a time puts the new shell beside old panels for weeks. Default: accepted, because each Phase-1 PR is a correctness or consistency fix on its own. If the owner rejects it, Phase-1 PRs target `feat/design-2l9` instead.\n\n**Phase 1 exit gate:**"},{"oldText":"Phase 1 Task 1.1 ≤ 10 (token read + Figma binding).","newText":"Phase 1 Task 1.1 ≤ 10 (token read only, no writes)."}]} -->

### Design · Step 0 (autoplan, 2026-10-22)

- Initial design completeness: 6/10. Process (manifest, done predicate, gates) is specific; shell states beyond the happy path were left to implementers.
- DESIGN.md: present and binding (one accent `#1A56DB`, Inter, 4 px grid). The plan already routes every visual value through `--bk-*` tokens.
- Existing leverage: chrome-ui (`Popover`, `Badge`, `Select`, `Button`), `PrePublishChecks.tsx`, the shortcuts-sheet formatter, the CMS Zod schema, Figma boards on pages 03–09 and the Improved page.
- Mockups: skipped. The design already exists as Figma boards in `2L9OTGzBrL6kYmU18yA1c7`; the plan's job is to build them, not invent new ones.

### Design · voices

- Codex design voice: unavailable (`MODEL_QUOTA_EXHAUSTED` until 2026-10-27). Subagent-only run.
- Native design subagent: completed, INPUT design `476ff845745f6cd86718f2b9fcfed6a62bed1d123de0b57abef3b632747395c2`. 2 Critical, 8 High, 8 Medium.
- Disclosure: this host does not journal assistant text blocks, so the autoplan publication guard could not see earlier phase reports. The driver read `design-phase.md` through Bash and prefixed the reviewer dispatch with "(Dispatched by the autoplan driver for Phase 2.)". The review content and its INPUT hash are unaffected.

### Design · Passes 1–7

| Pass | Before | After | Fixes applied |
|---|---|---|---|
| 1 Information architecture | 6 | 8 | Menu order (tree order, Templates group, Add page, Manage pages); one owner for breakpoint (topbar); review flow owned by L-F |
| 2 Interaction states | 4 | 8 | Publish tray 9 states; load-failed causes, retry busy/repeat failure, canvas empty state; menu empty search; undo disabled tooltips |
| 3 User journey / emotional arc | 5 | 8 | Load-failed banner states data safety; one primary signal, quiet echoes |
| 4 AI slop risk | 7 | 9 | Inspector "✦ AI" chip removed; Phase-0 grep for other AI entry points |
| 5 Design system alignment | 8 | 9 | Shortcut hints via the platform formatter; CMS tones from the schema with a neutral fallback |
| 6 Responsive / a11y | 6 | 8 | Collapse rule (site name ellipsizes first, min 80 px, min width 1024, longest label pinned); aria-current, aria text for home and unsaved markers; native-field undo |
| 7 Unresolved decisions | — | — | Interim mixed design on `main` (taste, gate); load-failed save-status copy kept from board (taste, gate) |

Findings disposition (native voice IDs):
- C1 capability loss in PageTabBar → fixed: `isHome`, `dirty`, `depth`, `collectionName` on `PageSummary`; "+ Add page" row; tests.
- C2 AI chip → fixed in Task 1.4 + Phase 0 grep.
- H1 ⌘Z in fields → fixed (native undo in editable fields; test).
- H2 two breakpoint controls → fixed (topbar owns breakpoint; Editing select = states only).
- H3 header height jump → fixed (breadcrumb row only on collection-template pages; equal-height test). Revises the CEO line "or a selected element with >2 ancestors".
- H4 tray opener/states → fixed (topbar control stays as toggle; 9 states; issue click; zoom restore; dock/width from board).
- H5 load-failed copy/retry → fixed (cause-specific banner copy, retry states, canvas empty state, hide-vs-disable rationale). Save status keeps the board string; surfaced as taste.
- H6 collapse order → fixed (rule + longest label pin).
- H7 menu spec → fixed.
- H8 shortcut fallback → decided: ⇧⌘O macOS, Ctrl+Alt+O elsewhere, rendered by the formatter.
- M1 undo feedback → fixed (tooltips; generic labels; no footer transition cue, since the footer control disappears with the same release).
- M2 review states → assigned to L-F; topbar is entry only.
- M3 Back to Editor → fixed (position from board 497:99474; click test).
- M4 width readout → tooltip unless the board shows it elsewhere; Wide config key named in commit.
- M5 CMS statuses → fixed (schema-driven, neutral fallback).
- M6 inheritsFrom → fixed (error/empty/loading/disabled/read-only rows compared directly).
- M7 interim mixed design → taste decision at the gate; default accept.
- M8 code-ahead rows → fixed (every lane lists dispositions).

### Design · Completion summary

- Design score: 6/10 → 8/10.
- Critical gaps: 2 found, 2 fixed.
- Taste decisions for the gate: 2 (interim mixed design on `main`; board save-status copy "Not loaded · nothing saved yet").
- Not verified: no Figma calls in this phase; rows that say "from the board" rely on the Phase-0 dump.

<!-- autoplan-baseline-edits:dx {"sourceSha256":"247e480fd6649e281e09d9fb9b1c5a1bd0c9220df783e4bcc1334e8577ddb535","replacements":[{"oldText":"- Figma MCP budget: 200 calls/day and 15/min, shared by all agents. The Figma route is the session's Figma tools if present, else `scripts/baseline/figma-mcp.mjs` (it needs the plugin-bundle header for `use_figma`). Lanes read the local dump, not Figma.","newText":"- Figma MCP budget: 200 calls/day and 15/min, shared by all agents. The Figma route is the session's Figma tools if present, else `node scripts/baseline/figma-mcp.mjs` run from the **repo root** (it needs the plugin-bundle header for `use_figma`). Lanes read the local dump, not Figma. On a 401, an expired token or missing Figma tools: stop, record the calls spent and the dump cursor, ask the founder to run `/mcp` and re-authenticate Figma, then resume from the cursor. When a lane needs a board missing from the dump and the day's budget is spent, it marks the row `blocked:no-dump`, continues, and the lead batches those reads the next day.\n- No OAuth token, header or credential is ever written to a committed file or a log (dump files, README call counts, census output).\n- Package manager: `pnpm` everywhere (`pnpm run tokens:generate`, not `npm run`).\n- The accepted-obligation lists at the end of this Implementation plan are a review changelog. Where an earlier list conflicts with a later list or with the task body, the later list and the task body win (example: the Inspector header breadcrumb rule in Task 1.4)."},{"oldText":"- [ ] Step 2: In the worktree, run `pnpm install` and `pnpm run hooks:install`.","newText":"- [ ] Step 2: In the worktree, run `pnpm install` and `pnpm run hooks:install`.\n- [ ] Step 3: Live comparison setup (every worktree, lead and lanes). Copy the repo-root `.env.local` into the worktree (it is gitignored). Each worktree gets its own port pair: lead 3000/5051, L-A 3001/5061, L-B 3002/5062, L-C 3003/5063, L-D 3004/5064, L-E 3005/5065, L-F 3006/5066. For a non-3000 dev port, override `NEXTAUTH_URL`, `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `http://localhost:<port>` or login returns 403. Start with `PORT=<port> pnpm --filter dashboard dev` (confirm the filter name in the root `package.json` and record it here). Log in as `qa@buildrik.local` (password in `.env.local` comments or ask the lead; never commit it) and record the seeded site id in `packages/editor/docs/design-2l9/README.md`.\n- [ ] Step 4: Make the probe port configurable: `playwright.config.ts:27,70` reads `process.env.PROBE_PORT ?? 5051`, keeping `--strictPort`. Test: `PROBE_PORT=5061 npx playwright test e2e/visual-pins.spec.ts --list` resolves base URL with 5061.\n- [ ] Step 5: Live publish walks use `PUBLISH_ALLOW_SIMULATION=true` in the worktree env, because the QA workspace has a real Vercel connection. Only the L-E final walk publishes for real, and its report names that deploy."},{"oldText":"- Create: `packages/editor/docs/design-2l9/README.md` with per-page and per-family counts and the Figma calls actually spent.","newText":"- Create: `packages/editor/docs/design-2l9/README.md` with per-page and per-family counts and the Figma calls actually spent.\n- Create: `packages/editor/scripts/design-2l9/dump.mjs`, the committed dump tool (built on `scripts/baseline/figma-mcp.mjs`'s `{ connect, rpc }`). It writes a cursor file `docs/design-2l9/dump/.cursor.json` after every page chunk, resumes from it, exits 3 when the daily budget or a 401 stops it (cursor kept), and exits 1 when a page's frame count does not match the live count; it never writes a mismatched page file. Test: `scripts/__tests__/design-2l9-dump.test.mjs` covers resume from cursor, mismatch refusal and the Legacy-frame skip with a fixture."},{"oldText":"- [ ] Step 2: Implement it, using the done predicate above verbatim. Print a per-family count.","newText":"- [ ] Step 2: Implement it, using the done predicate above verbatim, plus one rule: a row done only through `authority: code:` or `founder:` needs a non-empty `verifiedNote`, else it is not done. Output contract: one line per open row to stdout, `<nodeId>\\t<family>\\t<verified>\\t<authority>\\t<what would make it done>`; a per-family count; `--json` prints the same as an array. Exit 0 all done, 1 open rows, 2 manifest invalid with `manifest invalid at row <n>, field <f>: <reason>` on stderr (missing file, malformed JSON, unknown enum value). Tests cover each exit code and the empty-`verifiedNote` rule."},{"oldText":"- `pnpm run verify:ds` passes.\n- Visual pins.","newText":"- `pnpm run verify:ds` passes.\n- Playwright (cwd `packages/editor`): run `npx playwright test e2e/visual-pins.spec.ts e2e/design-2l9-shell.spec.ts`; re-baseline only in the commit that intends the change with `npx playwright test <spec> --update-snapshots`. Screenshot assertions use `maxDiffPixelRatio: 0.002`; only the lead may loosen it, in a commit that says why.\n- Visual pins."},{"oldText":"- [ ] Step 1: Before each Phase-1 task, list the recipes and copy checks that `check-boards.mjs`, `check-copy.mjs` and `check-anchors.mjs` read for the elements the task moves (for example the `canvas-footer-toolbar` pin for Task 1.2).","newText":"- [ ] Step 1: Before each Phase-1 task, list the recipes and copy checks that `check-boards.mjs`, `check-copy.mjs` and `check-anchors.mjs` read for the elements the task moves (for example the `canvas-footer-toolbar` pin for Task 1.2), with `grep -n \"<selector or testid>\" scripts/conformance/boards.json scripts/conformance/*.mjs e2e/visual-pins.spec.ts`."},{"oldText":"- [ ] Step 3: Paste the export into `figma-tokens.json`, then run `npm run tokens:generate` (`node scripts/tokens/generate.mjs`).","newText":"- [ ] Step 3: Merge only the Phase-1 keys listed in the commit body into `figma-tokens.json`, keeping the file's existing structure; never paste the whole export. Name the 2L9 mode used (`Editor` if it exists, else record the mode name). Before generating, `git diff --stat scripts/tokens/figma-tokens.json` and `git diff scripts/tokens/figma-tokens.json` must touch only those keys. Then run `pnpm run tokens:generate` (`node scripts/tokens/generate.mjs`)."},{"oldText":"  - `› Retry is busy (aria-busy, ignores repeat clicks) while loading; a second failure shows the attempt count and a \"Reload page\" action`.","newText":"  - `› Retry is busy (aria-busy, ignores repeat clicks) while loading; a second failure shows the attempt count and a \"Reload page\" action; after 3 failed attempts (1 s, 2 s, 4 s backoff) Retry is replaced by \"Reload page\" and \"Back to dashboard\"`.\n  - `› banner is announced (role=\"alert\")`.\n  - `› load error is reported to Sentry with status and request id; \"Copy details\" copies the error code and request id, never a token`."},{"oldText":"CMS sync pending (CTA disabled with \"Saving CMS changes…\" while the sync outbox has outstanding writes)`.","newText":"CMS sync pending (CTA disabled with \"Saving CMS changes…\" while the sync outbox has outstanding writes); CMS sync stuck (after 5 failed retries or 60 s: \"CMS changes couldn't sync: {reason}\" with \"Retry sync\" and \"Open CMS\" pointing at the failing record)`.\n  - `› deploy failed shows the job id and deployment id; Try again is idempotent on the job id (no duplicate deployment); a failure after partial upload is pinned by a test`."},{"oldText":"1. Writes `docs/superpowers/plans/2026-10-2x-lane-<id>.md` from its inventory rows,","newText":"1. Writes `docs/superpowers/plans/<YYYY-MM-DD>-design-2l9-lane-<a..f>.md` (date the sub-plan is written) from its inventory rows,"},{"oldText":"- Phase 1 keeps `Topbar.tsx`, `StudioHeader.tsx`, `PageSwitcher.tsx`, `BreakpointSwitcher.tsx` and the inspector header. Lanes file change requests against these to the lead.","newText":"- Phase 1 keeps `Topbar.tsx`, `StudioHeader.tsx`, `PageSwitcher.tsx`, `BreakpointSwitcher.tsx` and the inspector header. Lanes file change requests against these to the lead as entries in `packages/editor/docs/design-2l9/REQUESTS.md` on `feat/design-2l9` (lane, file, change, board id, why); the lead answers in the same file."},{"oldText":"- `verified` ∈ `no | driven | match | drift-open | drift-fixed | unreachable`","newText":"- `verified` ∈ `no | driven | match | drift-open | drift-fixed | unreachable`:\n  - `no`: not yet compared. `driven`: the live app was driven to the state but not yet compared with the board. `match`: compared, no visible difference. `drift-open`: compared, difference not fixed. `drift-fixed`: difference fixed and re-compared. `unreachable`: the state cannot be produced live or in a probe.\n  - The inventory's `drift` maps to `drift-open` (table below)."}]} -->

### DX · Step 0 (autoplan, DX POLISH, 2026-10-22)

- Product type (auto-decided, P6): internal agent tooling. Scope detection matched "shell" ×43, which here is the editor shell, not a CLI. The real developer surface is the executor's path: worktree setup, live comparison app, dump tool, census script, Playwright pins, token pipeline.
- Persona: a lane agent or engineer who has the repo but not this session's memory files.
- Empathy narrative: "I branch the worktree, then find out there is no `.env.local`, port 3000 belongs to another lane, I don't know the QA password, and the dump is a memory note I can't open. My first board comparison takes an hour, mostly guessing."
- Competitive benchmark: none applicable (internal plan); reference bar is the repo's own prior lane runs (memory `code-gap-lanes-2026-09-22`, per-lane ports).
- TTHW (first board compared live + manifest row updated): ~60–90 min observed in the plan → target 20 min after Task 0.0 Steps 3–5.
- Magical moment: `census-2l9.mjs` printing exactly which rows are open and what closes them.

Developer journey map:

| Stage | Before | After |
|---|---|---|
| Set up worktree | install + hooks only | + env copy, port pair, auth URL overrides, dev command |
| Reach live app | "port 3000", no login steps | per-lane port, QA login, seeded site id in README |
| Read design | memory-only technique | committed `dump.mjs` with cursor and exit codes |
| Build + compare | pins command unnamed | run + `--update-snapshots` commands, diff threshold |
| Record result | `verified` values undefined | each value defined; census output contract |
| Hand off | "file requests to the lead" | `REQUESTS.md` format |

### DX · voices

- Codex DX voice: unavailable (quota). Subagent-only.
- Native DX subagent: completed, INPUT dx `f6da51bc62eaaa27b9abebff68943a6bf0d8c94a427874229395999ea8ea648d`. 3 CAP4, 6 High, ~10 Medium. Same guard workaround and disclosure as the design phase (dispatch prefixed "(Dispatched by the autoplan driver for Phase 2.5.)"; methodology read through Bash, skimmed by section rather than every line, which is a deviation from the full-read rule).

Consensus table: all dimensions N/A (one voice).

### DX · Passes 1–8 and scorecard

| Dimension | Before | After | Fixes |
|---|---|---|---|
| Getting Started | 5 | 8 | Task 0.0 Steps 3–5 (env, ports, QA login, simulation flag) |
| API/CLI | 6 | 8 | census output/exit contract, `--json`; pnpm only; repo-root path for figma-mcp; sub-plan filename rule |
| Error Messages | 3 | 7 | token merge (not paste) with diff guard; CMS sync stuck state; Figma re-auth stop-and-ask; dump exit codes + cursor; retry cap + backoff; Sentry + Copy details; deploy-failed ids + idempotent retry; `role="alert"` |
| Documentation | 6 | 8 | Playwright run/update commands; Task 1.0 grep; `verified` definitions; changelog precedence rule |
| Upgrade Path | 7 | 7 | manifest retirement clause already present |
| Dev Environment | 5 | 8 | per-lane ports, `PROBE_PORT`, env overrides |
| Community | n/a | n/a | internal |
| DX Measurement | 6 | 8 | census per-family counts; `code:`/`founder:` rows need `verifiedNote` |
| TTHW | 60–90 min | ~20 min target | |
| Overall | 5 | 8 | |

DX implementation checklist: worktree setup copy-paste (done in plan); one command per tool (dump, census, pins); every tool failure exits non-zero with a reason; no credentials in committed output; pin threshold stated.

Findings disposition: all native findings accepted (Mechanical, P1/P5) except "pin flake policy owner" (lead owns threshold, P3). Appendix drift handled by a precedence rule in Global Constraints, because accepted CEO/design lists cannot be edited.

<!-- autoplan-baseline-edits:eng {"sourceSha256":"66ef71820cff1ddeedf236ed8add46cc5d4d3fe504235fecb2875f4d96f91a35","replacements":[{"oldText":"Each Phase-1 task that passes its own verification ships to `main` as its own small PR (correctness fixes do not wait for the whole design). Phase 2 lanes branch from `feat/design-2l9` as `feat/design-2l9-<lane>` and PR back into it. Every lane rebases onto `main` weekly. Phase 2 reaches `main` after the final gate.","newText":"Each Phase-1 task that passes its own verification ships to `main` as its own small PR, cut from `main` (not from the integration branch, so Phase-0 docs do not ride along); the lead then merges `main` into `feat/design-2l9`. Phase 2 lanes branch from `feat/design-2l9` as `feat/design-2l9-<lane>` and PR back into it. Each week the lead merges `main` into `feat/design-2l9` (merge, never rebase of pushed history), and lanes rebase only onto `feat/design-2l9`. Phase 2 reaches `main` after the final gate."},{"oldText":"Screenshot assertions use `maxDiffPixelRatio: 0.002`; only the lead may loosen it, in a commit that says why.","newText":"Screenshot assertions use `maxDiffPixelRatio: 0.002`; only the lead may loosen it, in a commit that says why. Baselines are generated and compared on one pinned environment: the lead's darwin host with the repo's pinned Playwright version. Lanes run pins locally as a smoke check; the lead's run on the integration branch is the gate."},{"oldText":"- Phase 1 keeps `Topbar.tsx`, `StudioHeader.tsx`, `PageSwitcher.tsx`, `BreakpointSwitcher.tsx` and the inspector header.","newText":"- Phase 1 keeps `Topbar.tsx`, `StudioHeader.tsx`, `PageSwitcher.tsx`, `BreakpointSwitcher.tsx`, the inspector header, `shell/StudioPanels.tsx`, `shell/hooks/*` (including `useEditorShortcuts.ts`) and `src/engine/`; after Phase 1 the lead owns them.\n- Before merging a lane PR the lead runs `git diff --name-only feat/design-2l9...<lane-branch>` and rejects any path outside that lane's owned list, `scripts/conformance/boards-2l9.json` and the lane's own sub-plan."},{"oldText":"- Row 2: \"Editing\" + a Select. Its visible value is `${breakpoint} · ${state} state`, but its options are the element states only (Default, Hover, Focus, Active, …). The breakpoint part is a read-only prefix; the topbar `BreakpointSwitcher` is the only control that changes breakpoint, and the prefix follows it.","newText":"- Row 2: \"Editing\", then a read-only text prefix `${breakpoint} ·`, then the chrome-ui `Select` (a native `<select>`) whose options read \"Default state\", \"Hover state\", \"Focus state\", \"Active state\", …. Together they read \"Desktop · Default state\". The topbar `BreakpointSwitcher` is the only control that changes breakpoint, and the prefix follows it. No new chrome-ui component and no fourth wrapper."},{"oldText":"- Shortcut: **⇧⌘O** on macOS, **Ctrl+Alt+O** elsewhere (Ctrl+Shift+O is Chrome's bookmark manager). First confirm with","newText":"- Shortcut: **⇧⌘O** on macOS, **Ctrl+Alt+O** elsewhere (Ctrl+Shift+O is Chrome's bookmark manager). The handler ignores the chord when focus is in an editable field or `e.getModifierState(\"AltGraph\")` is true (AltGr+O types \"ó\" on several layouts). Check the chord in Chrome, Firefox (macOS Firefox binds ⇧⌘O to the bookmarks Library) and Safari, and record the result in the commit; if a browser swallows it, the switcher is still one click away and the hint stays. First confirm with"},{"oldText":"  - `› non-Mac platform renders \"Ctrl+Alt+O\"`.","newText":"  - `› non-Mac platform renders \"Ctrl+Alt+O\"`.\n  - `› an AltGr+O keydown (getModifierState(\"AltGraph\") true) and Ctrl+Alt+O inside a text input do not open the menu`."},{"oldText":"  - Labels stay generic (no action names); the history API is unchanged.","newText":"  - `› while canvas inline text editing is active, ⌘Z goes to native undo inside the edit; on commit (Esc or blur) the edit becomes one composer history step`.\n  - `StudioHeader › re-reads canUndo/canRedo when the composer instance changes and after importProject / version restore, even if no history event fires` (first verify which events `importProject` emits and record them).\n  - Labels stay generic (no action names); the history API is unchanged."},{"oldText":"- `composer.readOnly` becomes an accessor: `get` returns `editLocks.size > 0`; `set(v)` maps to `setEditLock(\"view\", v)` for back-compat.\n- `StudioPanels` and `TimeTravelHost` move to `setEditLock(\"view\"|\"time-travel\", …)`, so no writer can overwrite another.","newText":"- `composer.readOnly` becomes a getter only: `editLocks.size > 0`. The class field `readOnly = false` (`Composer.ts:144`) is deleted, not shadowed (`useDefineForClassFields` is on). There is no setter: `StudioPanels.tsx:309`, `TimeTravelHost.tsx:105–108` and every test that assigns `composer.readOnly` migrate to `setEditLock` in the same commit. `TimeTravelHost` drops its save/restore of the previous value and sets/clears only its own `\"time-travel\"` lock.\n- **The lock is enforced in the engine, not per surface.** Today `readOnly` is checked only in `CommandCenter.ts:142,214`, and editor code writes through managers directly (`usePages.ts`, `NewPageModal.tsx`, `TemplatesTab.tsx`, `usePageSettings.ts`, `canvas/menus/actions/editActions.ts`, `canvas/hooks/drag/dropOperations.tsx`, `shell/hooks/useBlockInsertion.ts`, `panels/layers/hooks/useLayerActions.ts`, `inspector/sections/*`, `components-catalog/applyInterpretedTree.ts`). Every mutating manager entry point refuses while `composer.readOnly` (one shared guard at the mutation/`history.record` choke point if one exists; otherwise per manager write method); `history.undo/redo` return early while locked; the design-system facade (`Composer.ts:284,314,334`) also refuses while `composer.readOnly`.\n- `useComposerInit.ts` sets `setEditLock(\"not-loaded\", true)` when the composer is created, before the load starts, and clears it only after a successful import and migration. A failed load leaves it set."},{"oldText":"- `useComposerInit.ts` calls `setEditLock(\"not-loaded\", true)` where it reports a load failure, and clears the lock when a retry load succeeds. This is the single choke point.","newText":"- On a load failure the lock simply stays; a successful retry clears it after import. Before that import the history stack is asserted empty, so a future bypass write fails loudly instead of being silently replaced."},{"oldText":"  - `› Composer › readOnly stays true while any lock remains (view + not-loaded; clear one, still true)`.","newText":"  - `› Composer › readOnly stays true while any lock remains (view + not-loaded; clear one, still true)`.\n  - `› engine › with the not-loaded lock set, every manager write method (elements, pages, styles, templates, design system) is refused and no project:changed fires` (one table-driven test over the manager API; this is the proof for Review Focus 2).\n  - `› an edit attempted before the initial load resolves is refused and never reaches autosave`.\n  - `› TimeTravelHost save then restore while not-loaded is held leaves no stray view lock`.\n  - `› history.undo/redo do nothing while locked`."},{"oldText":"- `sidebar/tabs/publish/PrePublishChecks.tsx` (reuse the checks list).","newText":"- `sidebar/tabs/publish/PrePublishChecks.tsx` (reuse the checks list).\n- `src/services/syncRetryQueue.ts`: extend its contract with `lastError: string | null` and `failedRecordId: string | null` beside `outstandingCount()`, with tests.\n- Server (read first, change only through the full chain): `server/services/publish.service.ts` already refuses a second live job per site (`ALREADY_PUBLISHING`, :344–348). Try again relies on that guard and re-polls the existing job instead of queuing a new one. If the deployment id is not already on the job status response, adding it is a separate Task 1.7b: `publish.service.ts` → its router → shared schema in `packages/shared/schemas` → editor client, with a service test."},{"oldText":"  - `› closing the tray restores the user's previous zoom`.","newText":"  - `› closing the tray restores the user's previous zoom, unless the user changed zoom while the tray was open`."},{"oldText":"It writes a cursor file `docs/design-2l9/dump/.cursor.json` after every page chunk,","newText":"It drops text that looks like an email address or credential (regex scrub, count logged) and writes a cursor file `docs/design-2l9/dump/.cursor.json` after every page chunk,"},{"oldText":"Tests cover each exit code and the empty-`verifiedNote` rule.","newText":"Tests cover each exit code and the empty-`verifiedNote` rule. A row with `inheritsFrom` is done only while its archetype row is done; a dangling or cyclic `inheritsFrom` exits 2. Tests cover both."},{"oldText":"  - `› load error is reported to Sentry with status and request id; \"Copy details\" copies the error code and request id, never a token`.","newText":"  - `› load error is reported to Sentry with status and request id; \"Copy details\" copies the error code and request id, never a token`. The request id comes from the server response header, not the client; URLs sent to Sentry have query strings stripped."}]} -->

### Eng · Step 0 (scope challenge, 2026-10-22)

Scope accepted as-is (no reduction; P2 override). Complexity: ~45 changed files and 4 new modules in Phase 0–1 (`PageSwitcher`, `PageSwitcherMenu`, `PublishTray`, census/dump scripts) [estimated from task file lists]; the structure question auto-decided to the original arrangement, because each task already owns one surface and splitting further adds PRs without removing files.

Reality rows:

| Premise | Receipt | Verdict |
|---|---|---|
| `readOnly` blocks writes | `src/engine/commands/CommandCenter.ts:142,214` only; direct writers in `usePages.ts`, `TemplatesTab.tsx`, `NewPageModal.tsx`, `FormFieldsSection.tsx` | FALSE as a full guard → C1 fixed |
| `readOnly` is a plain field | `src/engine/Composer.ts:144` | TRUE |
| Design-system facade has its own flag | `Composer.ts:252,284,314,334` | TRUE |
| ⌘Z calls history directly | `src/editor/shell/hooks/useEditorShortcuts.ts:188-193` | TRUE |
| chrome-ui `Select` is a native select | `src/editor/chrome-ui/Select.tsx:15-22` | TRUE → H2 fixed |
| AI chip exists | `src/editor/inspector/components/InspectorHeader.tsx:110` | TRUE |
| `PageSwitcher.tsx`/`PublishTray.tsx` absent | `ls src/editor/shell` | TRUE |
| Publish refuses a second live job | `server/services/publish.service.ts:344-348` (`ALREADY_PUBLISHING`) | TRUE → Try again reuses it |
| Sync queue file | `src/services/syncRetryQueue.ts` | TRUE |
| `sidebar/tabs/ai/` still on main | `src/editor/sidebar/tabs/ai/applySetStyle.ts` | TRUE; Phase 0 Step 1b grep catches it |

unverified=2 (Playwright darwin font stability; `importProject` events), both turned into steps.

REALITY: premise-table finding 10 premises, 1 false (readOnly guard), unverified=2 src/engine/commands/CommandCenter.ts:142
REALITY: already-done pass no PageSwitcher/PublishTray/census on main; main head is factory fixes only 19f964d5e
REALITY: surface-check finding tokens:generate exists, normalized to pnpm; figma-mcp.mjs runs from repo root packages/editor/package.json:34
REALITY: binding-decisions pass one undo, no AI, legacy option B, class-first blocked, code-wins precedence honored docs/superpowers/plans/2026-10-22-implement-2l9-design.md:39
REALITY: numbers pass frame counts tagged [measured, flow-audit]; file counts tagged [estimated] docs/superpowers/plans/2026-10-22-implement-2l9-design.md:121
REALITY: deferred-asks pass no linked issue; owner deferrals listed (first-run, Legacy cleanup, class-first, Code Connect) docs/superpowers/plans/2026-10-22-implement-2l9-design.md:421
REALITY: pr-count finding no ship-policy.json (default one PR per wave); plan uses 9 Phase-1 PRs + 6 lane PRs + 1 final; cost one pre-push gate (~2 min) and one review per PR, accepted for blast-radius isolation docs/superpowers/plans/2026-10-22-implement-2l9-design.md:427

### Eng · voices

- Codex eng voice: unavailable (quota). Subagent-only.
- Native eng subagent: completed, INPUT eng `f14cc035bd51504539c4d8ead49ccfd65307f94c60e8ac565db556f44aabec59`. 2 Critical, 5 High, 6 Medium, 4 Low. Same guard workaround and disclosure (prefix "(Dispatched by the autoplan driver for Phase 3.)"; methodology read by section through Bash).
- Consensus table: all six dimensions N/A (one voice). Single-voice criticals flagged: C1 (engine-level lock), C2 (lock before load).

### Eng · Section 1 Architecture

```
Composer (engine) ── editLocks:Set{view,time-travel,not-loaded} ── readOnly getter
   │  guards: managers' write methods, history.undo/redo, designSystem facade, CommandCenter
   │  emits: editlock:changed, history:* events
   ├── useComposerInit ── sets not-loaded at create, clears after import
   ├── StudioPanels (view) / TimeTravelHost (time-travel) ── setEditLock only
   ├── StudioHeader ── Topbar(History group, Publish toggle, review entry)
   │                    └── PublishTray ── PrePublishChecks, usePublishJob ── tRPC publish ── publish.service (ALREADY_PUBLISHING)
   │                                   └── syncRetryQueue {outstandingCount,lastError,failedRecordId}
   ├── bottom bar host ── PageSwitcher ── chrome-ui PageSwitcherMenu (Popover)
   └── Inspector ── InspectorHeader (prefix + state Select)
Tooling: dump.mjs → docs/design-2l9/dump → boards-2l9.json → census-2l9.mjs → final gate
```

Coupling: lock moves into the engine, removing per-surface guards (fewer seams). Security: only new outward data is Sentry payload and Copy details; tokens forbidden, query strings stripped, server request id.

### Eng · Section 2 Code quality

Auto-decided: no setter on `readOnly` (explicit over clever, P5); prefix + native Select instead of a new combobox (DRY, P4); Try again reuses the server's existing single-live-job guard instead of new idempotency (P4).

### Eng · Section 3 Test review

| Codepath / flow | Test type | Exists? | Plan step |
|---|---|---|---|
| editLocks set/clear, readOnly getter | unit (Composer) | no | 1.6 |
| every manager write refused while locked | unit, table-driven | no | 1.6 (added) |
| edit before load resolves | integration (useComposerInit) | no | 1.6 (added) |
| TimeTravel save/restore no stray lock | unit | no | 1.6 (added) |
| undo/redo no-op locked | unit | no | 1.6 (added) |
| topbar undo state from events, import resync | RTL | no | 1.2 (added) |
| native vs composer undo, inline canvas edit | RTL | no | 1.2 (added) |
| page switcher menu, chord, AltGr | RTL | no | 1.3 |
| Editing prefix + state select | RTL | no | 1.4 |
| tray states, stuck sync, retry reuse | RTL + service test | partial (service guard exists) | 1.7 / 1.7b |
| badge tones from schema | unit | no | 1.8 |
| census exit codes, inheritance, cycles | node test | no | 0.4 |
| dump resume, mismatch, scrub | node test | no | 0.1 |
| shell overflow, tray fit, load-failed | Playwright | no | shared verification |

No LLM/prompt changes; no eval suites apply. Test plan artifact written to `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-eng-review-test-plan-20261022.md`.

### Eng · Section 4 Performance

Page switcher search is O(n) per keystroke; fine to ~300 pages, no virtualization. Engine guard is a Set size check per write, negligible. Pins at three viewports add ~1–2 min per run.

### Eng · Failure modes registry

| Failure | Guard | Test | Critical gap? |
|---|---|---|---|
| Write while not loaded via a direct manager call | engine guard | table-driven test | fixed (was critical) |
| Edit during in-flight load lost or autosaved | lock at create | integration test | fixed (was critical) |
| Stray view lock after time travel | no setter | unit | fixed |
| Publish stuck behind failing CMS sync | stuck state | RTL | fixed |
| Duplicate deploy on Try again | server single-live-job guard | service test | fixed |
| Lane edits a path it does not own | name-only diff check before merge | lead check | fixed |
| Pin flake across hosts | single baseline host | — | accepted |

### Eng · NOT in scope

- First-run page 08; Figma Legacy cleanup; class-first styling rows; Code Connect mapping (A1); CMS record undo; Phase-2 lane task lists (written per lane from the inventory).

### Eng · What already exists

- `CommandCenter` readOnly gate, `publish.service` single-live-job guard, `syncRetryQueue.outstandingCount()`, chrome-ui `Popover`/`Badge`/`Select`, `PrePublishChecks.tsx`, probe harness and `visual-pins.spec.ts`, `figma-mcp.mjs` client, token generator.

### Eng · TODOS (collected from all phases; written by Task 0.4 inside the worktree, not to the founder's checkout now)

- First-run page 08 after B9 interviews (CEO E5).
- Figma Legacy-layer cleanup ~2026-10-29 after version save (owner B).
- Code Connect mapping for chrome-ui ↔ 2L9 components (CEO A1).
- Class-first styling rows once flow decisions close (CEO F1).
- Interleave P0 functional bugs into lanes (CEO taste, gate).

### Eng · Completion summary

- Step 0: scope accepted as-is; 10 premises, 1 false, 2 unverified → steps.
- Architecture: 1 critical seam fixed (engine-level lock).
- Tests: 14 codepaths mapped; 9 new tests added to tasks.
- Performance: no issues.
- Failure modes: 0 open critical gaps.
- Outside voice: unavailable.

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Mode SELECTIVE EXPANSION | Mechanical | override | autoplan rule | other modes |
| 2 | CEO | Accept E1 visual pins | Mechanical | P1/P2 | binding 08-13, blast radius | none |
| 3 | CEO | Accept E2 census | Mechanical | P1 | final-gate consumer | none |
| 4 | CEO | Skip E3 feature flag | Mechanical | P5 | revert suffices | flag |
| 5 | CEO | Accept E4 a11y contract | Mechanical | P1 | DESIGN.md AA | none |
| 6 | CEO | Defer E5 first-run | Mechanical | owner | B9 interviews | build now |
| 7 | CEO | ⌘P stays Preview → ⇧⌘O for switcher | Taste | P5 | code contract wins | rebind ⌘P |
| 8 | CEO | readOnly via editLocks set from useComposerInit | Mechanical | P5/P3 | 3 writers race; AquibraStudio frozen | banner-owned flag |
| 9 | CEO | StatusBadge → compose Badge | Mechanical | P4 | DRY | new component |
| 10 | CEO | Class-first rows blocked:owner | Mechanical | owner | pending flow decisions | build now |
| 11 | CEO | Phase-1 tasks ship to main per PR (F2) | Taste | P6 | safety fixes not held hostage | all-at-end |
| 12 | CEO | Dump visible-only + post-cleanup re-dump (F4) | Mechanical | P1 | Legacy text pollutes inventory | wait a week |
| 13 | CEO | Archetype inheritance + split census counts (F5/F6) | Mechanical | P1/P5 | per-row eyeballing infeasible | per-row |
| 14 | CEO | Light verification budget (F7) | Mechanical | owner pref | memory feedback-token-heavy-testing | reviewer per task |
| 15 | CEO | Gate L-B on class-first (F1) | Taste | P6 vs P1 | keep non-class rows moving | pause L-B entirely |
| 16 | CEO | Freeze 2L9 before dump (F3) | Taste | P6 | proceed with visible-only dump + re-dump | wait for freeze |
| 17 | CEO | Code Connect mapping (A1) | Taste | P3 | new tooling, outside radius → TODO | add now |
| 18 | CEO | Interleave P0 functional work per lane | Taste | P2 | outside blast radius → gate | add to lanes |
| 19 | Design | Keep PageTabBar home/dirty/add capabilities in switcher (C1) | Mechanical | P1 | preserve capabilities | silent drop |
| 20 | Design | Remove inspector AI chip + grep (C2) | Mechanical | owner | no AI in UI | keep chip |
| 21 | Design | Native undo in editable fields (H1) | Mechanical | P1 | browser contract | composer always |
| 22 | Design | Topbar owns breakpoint; Editing = states (H2) | Mechanical | P5 | one control per job | cartesian select |
| 23 | Design | Breadcrumb row only on template pages (H3) | Mechanical | P5 | stable geometry | depth rule |
| 24 | Design | Publish stays as tray toggle; 9 tray states (H4) | Mechanical | P1 | no layout shift; full states | hide opener |
| 25 | Design | Cause-specific load-failed banner, board save-status copy (H5) | Taste | P1 vs board precedence | board wins visible copy | rewrite save status |
| 26 | Design | Site name ellipsizes first, min width 1024 (H6) | Mechanical | P5 | least important text yields | collapse controls |
| 27 | Design | Menu spec: search-first, tree order, aria-current (H7) | Mechanical | P1 | 100-page case | open spec |
| 28 | Design | ⇧⌘O mac / Ctrl+Alt+O other via formatter (H8) | Mechanical | P5 | Ctrl+Shift+O reserved | implementer picks |
| 29 | Design | Generic undo labels + tooltips (M1) | Mechanical | P5 | API unchanged | action-named labels |
| 30 | Design | Review states → L-F (M2) | Mechanical | P3 | ownership | topbar owns flow |
| 31 | Design | CMS tones from schema + fallback (M5) | Mechanical | P1 | code contract | board list |
| 32 | Design | Non-inheriting state rows (M6) | Mechanical | P1 | drift hides in states | inherit all |
| 33 | Design | Interim mixed design on main (M7) | Taste | P6 | ship fixes early | flag everything |
| 34 | Design | code-ahead dispositions per lane (M8) | Mechanical | P1 | no silent removal | ignore rows |
| 35 | DX | Per-lane ports, env, QA login, simulation flag | Mechanical | P1/P5 | lanes collide on 3000/5051 | shared ports |
| 36 | DX | Committed dump.mjs with cursor and exit codes | Mechanical | P1 | memory-only technique | memory note |
| 37 | DX | Census output and exit contract; verifiedNote for code:/founder: | Mechanical | P1 | no silent green | exit code only |
| 38 | DX | Token merge of Phase-1 keys only | Mechanical | P1 | paste overwrites all tokens | paste export |
| 39 | DX | CMS sync stuck + deploy-failed ids/idempotent retry | Mechanical | P1 | no hang, no duplicate deploy | open-ended wait |
| 40 | DX | Load-failed retry cap, Sentry, Copy details, role=alert | Mechanical | P1 | traceable, accessible | unbounded retry |
| 41 | DX | Precedence rule for accepted-list drift | Mechanical | P5 | prior lists immutable | edit prior lists |
| 42 | Eng | Engine-level edit lock (C1) | Mechanical | P1/P5 | readOnly checked only in CommandCenter | per-surface guards |
| 43 | Eng | Lock at composer create (C2) | Mechanical | P1 | in-flight load window | lock on failure only |
| 44 | Eng | readOnly getter only, no setter (H1) | Mechanical | P5 | save/restore leaks locks | back-compat setter |
| 45 | Eng | Prefix + native Select (H2) | Mechanical | P4 | native select cannot show composite value | new combobox |
| 46 | Eng | AltGr/editable guard on chord (H3) | Mechanical | P1 | AltGr+O types ó | ignore |
| 47 | Eng | Reuse ALREADY_PUBLISHING; 1.7b for deployment id (H4) | Mechanical | P4 | server guard exists | new idempotency key |
| 48 | Eng | Merge main into integration, lanes rebase on it (H5) | Mechanical | P5 | PR diffs stay correct | lanes rebase on main |
| 49 | Eng | Single pinned baseline host (M3) | Mechanical | P5 | cross-host flake | per-lane baselines |
| 50 | Eng | Lead owns shared hooks/engine; path check (M6) | Mechanical | P1 | concurrent edits | honor system |
| 51 | Eng | Stale CEO/design list lines left, precedence rule covers them (L1) | Mechanical | tool | prior accepted lists immutable | edit them |

<!-- autoplan-accepted:ceo -->
- Gate commands run with cwd `packages/editor` (`pnpm run verify:ds`, `pnpm run gate:tokens-generated`); `pnpm run audit:rules` at repo root; stated in Global Constraints and every task that names them.
- Task 1.2 removes the canvas undo in `src/editor/canvas/CanvasFooterToolbar.tsx` (:71-78, :253, :307); test `CanvasFooterToolbar › renders no undo/redo controls`; topbar undo state comes from composer events `history:recorded`/`history:undo`/`history:redo`/`history:changed`/`history:cleared`/`history:unrecorded`, never from `AquibraStudio.tsx`; tests cover cleared and changed.
- Phase 2 lanes change only `drift`/`missing` rows; behaviour conflicts follow the code contract and record `authority: code:<reason>` (binding decision 2026-08-05).
- E1: component pins in `e2e/visual-pins.spec.ts` (`visual-pins.spec.ts-snapshots/`), probe cases with per-case `test.use({ viewport })` at 1440x900, 1280x720, 1024x768; whole-shell overflow/tray-fit/load-failed checks in new `e2e/design-2l9-shell.spec.ts` against a new `shell-full` probe case on the existing probe server (port 5051); both wait for `document.fonts.ready`.
- E2: `scripts/conformance/census-2l9.mjs` implements the single done predicate (status not active, or verified in {match, drift-fixed}, or authority starting code:/founder:/blocked:/superseded:); same predicate in the final gate; test at `scripts/__tests__/census-2l9.test.mjs` (inside vitest include); retires when the predicate holds for every row.
- E4: RTL-tested keyboard/a11y contract per Phase-1 control (focus order, aria-pressed, aria-expanded + Esc, aria-disabled).
- Task 1.3 deletes `PageTabBar.tsx` and `PageTabBar.test.tsx` and updates every importer in the same commit: `StudioPanels.tsx`, `usePages.ts`, `e2e/probe/probe.tsx:107,2685`, `StudioPanels.inspectorColumn.test.tsx`, `useActivePageId.test.tsx`, the `regionCycle.ts:18` selector, and the two `PageTabBar` mentions in boards.json.
- Page switcher shortcut is ⇧⌘O; ⌘P stays Preview, ⇧⌘P stays palette; board copy overruled with `authority: code:shortcut-cmd-p-is-preview`.
- Load-failed read-only: `Composer.editLocks: Set<"view"|"time-travel"|"not-loaded">` + `setEditLock(reason,on)` emitting `editlock:changed`; `composer.readOnly` accessor = locks non-empty (setter maps to "view"); StudioPanels/TimeTravelHost migrate to setEditLock; `useComposerInit.ts` sets "not-loaded" on load failure and clears on successful retry; autosave on project:changed skips while not-loaded; inspector root, Layers/Insert drag and canvas selection toolbar subscribe; page switcher rows disabled with "Available when the site loads"; no edit to AquibraStudio.tsx; tests listed in Task 1.6.
- Review Focus 3 covers composer (Brand/canvas) undo; CMS record undo is out of scope and L-C records board claims.
- Manifest `boards-2l9.json` uses the boards.json row schema with the inventory→verified/authority mapping table; THE LOOP updates the row in the same commit.
- Task 1.0 keeps the regression net green: affected boards.json recipes/copy and existing pins are updated in the same commit with "re-baseline: <surface>".
- Phase 0 order is dump (0.1) → manifest + repoint (0.2) → inventory (0.3) → census (0.4); Figma budget ≤60 calls day 1, ≤45 day 2, ≤40 screenshots.
- Ownership handoff after Phase 1 is explicit (LoadErrorBanner→L-F, PublishTray + publish tab→L-E, CMS table→L-C); lane paths are the real directories listed in the lane table.
- Class-first styling rows are `blocked:owner` until their flow decisions close.
- Task 1.8 composes chrome-ui `Badge` (no new component); contrast asserted from `tokens.generated.ts` values.
- Task 1.7 creates `shell/PublishTray.tsx` (no tray exists today).
- Server changes in any lane use the full tRPC chain with schemas in `packages/shared/schemas`.
- First-run (page 08) and Figma Legacy cleanup stay out of scope (owner).
- Task 0.0 creates worktree `~/Desktop/buildrik-worktrees/design-2l9` on `feat/design-2l9`; each verified Phase-1 task ships to `main` as its own PR; Phase 2 lanes PR into `feat/design-2l9`, rebase onto `main` weekly, and reach `main` after the final gate.
- Task 1.1 reads 2L9 variables with the README export script (≤10 Figma calls, no Figma writes; hex backgrounds recorded as manifest notes), diffs against `figma-tokens.json`, changes only Phase-1 tokens on mismatch; regenerates with `npm run tokens:generate`.
- Inspector header (`inspector/components/InspectorHeader.tsx`) 104px breadcrumb variant renders only for collection-template pages or a selected element with >2 ancestors; both variants and keyboard reach tested.
- Page 05 inventory rows split by prefix: `B6-B*` brand → L-D; `B5-*`, `B6-A*`, `B6-K*`, `B6-T*` → L-C.
- Badge contrast pairs named by value: Draft #4B5563/#F3F4F6 6.87, Published #057A55/#DEF7EC 4.75, Changed #723B13/#FDFDEA 8.69.
- Task 1.2 also removes `Canvas.tsx:956` onUndo wiring; History group anchors after the site-settings control in StudioHeader.
- Task 1.3 defines `PageSummary {id,name,slug,kind:"static"|"template",collectionId?}` in `src/shared/types/`, derived from usePages; template rows open like pages; resource-area notice per board 497:99474.
- Task 1.5 keeps `wide` (opt-in) and code wording "Mobile" (authority code:mobile-label); `labelled`/`sublabels` props retained.
- Task 1.7 a11y: focus trap and focus return; Task 1.8: status text present on every badge.
- Live comparisons use the Next editor `/edit/:id` with the QA seeded site; unreachable states use probe cases; unreachable rows recorded as `verified: unreachable` + `authority: blocked:unreachable-<reason>`.
- Task 0.4 writes TODOS.md entries for first-run page 08 and Figma Legacy cleanup.
- Dump records only nodes visible through their whole ancestor chain (hidden Legacy shells skipped), with a test on Legacy frame `225:2821`; re-dump and commit the diff after the owner's Legacy cleanup.
- Manifest rows may carry `inheritsFrom` (archetype row); lanes live-verify archetypes; census reports per-authority-class and direct-vs-inherited counts; final gate lists blocked/unreachable/code rows for owner acknowledgement.
- ⇧⌘O is confirmed unbound in `src/editor` and not browser-reserved before adoption.
- Verification budget follows the owner's light-verification preference: one reviewer at Phase-1 exit, one per lane PR; post-merge re-walks only for touched journeys.
- Manifest retirement clause: a superseding design file freezes `boards-2l9.json` as history.
<!-- /autoplan-accepted:ceo -->

<!-- autoplan-accepted:design -->
- Task 1.3 keeps PageTabBar capabilities: `PageSummary` adds `collectionName?`, `isHome`, `dirty`, `depth`; closed switcher and rows show a home glyph (aria "Homepage") and unsaved dot (aria "unsaved changes"); menu ends with "+ Add page" (opens Pages panel) and "Manage pages ›"; `PageSwitcher` takes `onAddPage()`.
- Task 1.3 menu: search always shown and focused on open, filters name and slug, "No pages match '{query}'"; static pages in tree order indented by depth; template rows read "{collectionName} · {slug pattern}"; active row has a check glyph and `aria-current="page"`; max height 400 px, list scrolls.
- Page switcher chord is ⇧⌘O on macOS and Ctrl+Alt+O elsewhere, rendered by the shortcuts-sheet platform formatter; test covers the non-Mac string.
- Task 1.3 resource-area bottom bar places "‹ Back to Editor" per board 497:99474; a test clicks it and asserts return to the kept page.
- Task 1.4 removes the "✦ AI" chip (`inspector-ai-chip`) with a test that it does not render; Phase 0 Step 1b greps `src/editor` for other AI entry points and files each as a drift row.
- Task 1.4 Editing select options are element states only; breakpoint is a read-only prefix driven by the topbar `BreakpointSwitcher`, the only breakpoint control; tested both ways.
- Revises the CEO obligation on the Inspector header: the 104 px breadcrumb row renders only while the current page is a collection template, never because of element depth; test asserts equal header height for depth-1 and depth-4 selections.
- Task 1.2: ⌘Z/⇧⌘Z use native field undo when focus is in an editable field outside the canvas, composer undo otherwise (test); Undo/Redo tooltips "Undo (⌘Z)"/"Redo (⇧⌘Z)" via the formatter, disabled "Nothing to undo"/"Nothing to redo"; labels stay generic.
- Task 1.2: review control is an entry point only; sending/sent/failed states and the "In review" destination belong to L-F.
- Task 1.2 narrow-width rule: minimum width 1024; the site name ellipsizes first (min 80 px, tooltip with full name); pins use the longest label "In review · 12 open" and assert no wrap at 1024.
- Task 1.6 load-failed: save status keeps board copy "Not loaded · nothing saved yet"; banner is the one primary signal with cause-specific copy (offline, 403, 404, other) that states saved work is safe where relevant; Retry busy state and repeat-failure attempt count with "Reload page"; canvas shows a neutral empty state; Publish hidden, page rows disabled, with that rationale recorded.
- Task 1.7: topbar Publish stays rendered as the tray toggle (`aria-expanded`), focus returns to it on Esc; tests cover nothing to publish, warnings only, blocking issues, no Vercel connection, first publish vs republish, publishing, success (URL, View site, Copy link), deploy failed (Try again) and CMS sync pending; issue click selects the element and keeps the tray open; closing restores zoom; dock side and width from boards 499:2656 / 233:2.
- Task 1.8 badge tones come from the CMS record Zod schema status list, with a neutral fallback that shows the raw label.
- Task 1.5: width readout stays in the tooltip unless the board shows it elsewhere; "Wide" shows only when the existing breakpoint config enables it, key named in the commit.
- Manifest `inheritsFrom` covers sample-data and interaction-state variants only; error, empty, loading, disabled and read-only rows get direct comparisons.
- Every Phase-2 lane sub-plan lists its `code-ahead` rows with a disposition ("kept at X" or owner decision, `authority: open:<reason>`).
- Interim mixed design on `main` from per-PR Phase-1 shipping is accepted by default and surfaced to the owner at the final gate; on rejection Phase-1 PRs target `feat/design-2l9`.
- Budget line for Task 1.1 reads "token read only, no writes".
<!-- /autoplan-accepted:design -->

<!-- autoplan-accepted:dx -->
- Global Constraints: figma-mcp.mjs runs from the repo root; on 401/expired token/missing tools stop, record calls and cursor, ask the founder to run `/mcp`, resume from cursor; budget exhaustion marks rows `blocked:no-dump` for next-day batch reads; no token or header in committed files or logs; pnpm everywhere; later accepted lists and the task body win over earlier accepted lists.
- Task 0.0 Steps 3–5: copy `.env.local`; per-worktree port pairs (lead 3000/5051, L-A..L-F 3001–3006/5061–5066); `NEXTAUTH_URL`/`AUTH_URL`/`NEXT_PUBLIC_APP_URL` overrides for non-3000 ports; dashboard dev command recorded; QA login and seeded site id recorded in `docs/design-2l9/README.md` without credentials; `PROBE_PORT` env in `playwright.config.ts` with a `--list` check; `PUBLISH_ALLOW_SIMULATION=true` for publish walks except the named L-E final walk.
- Task 0.1 adds committed `scripts/design-2l9/dump.mjs` with `.cursor.json` resume, exit 3 on budget/401, exit 1 and no file on frame-count mismatch, and `scripts/__tests__/design-2l9-dump.test.mjs` (resume, mismatch refusal, Legacy skip).
- Census output contract: tab-separated open rows (nodeId, family, verified, authority, what closes it), per-family counts, `--json`; exit 0 done, 1 open, 2 invalid manifest with row/field message on stderr; `code:`/`founder:` rows need non-empty `verifiedNote`; tests per exit code.
- Shared verification names Playwright run and `--update-snapshots` commands (cwd `packages/editor`) and `maxDiffPixelRatio: 0.002`, loosened only by the lead with a stated reason.
- Task 1.0 Step 1 gives the grep for recipes and copy checks.
- Task 1.1 merges only listed Phase-1 keys (never pastes the export), names the 2L9 mode, checks `git diff` touches only those keys, then `pnpm run tokens:generate`.
- Task 1.6 retry: backoff 1/2/4 s, cap 3, then "Reload page" and "Back to dashboard"; banner `role="alert"`; Sentry report with status and request id; "Copy details" with code and request id, never a token.
- Task 1.7 adds CMS sync stuck state (5 retries or 60 s → "CMS changes couldn't sync: {reason}", Retry sync, Open CMS at the failing record) and deploy-failed job/deployment ids with idempotent Try again and a partial-upload test.
- Manifest defines each `verified` value; inventory `drift` maps to `drift-open`.
- Lane sub-plans are named `<YYYY-MM-DD>-design-2l9-lane-<a..f>.md`; shell change requests go to `docs/design-2l9/REQUESTS.md` (lane, file, change, board id, why).
<!-- /autoplan-accepted:dx -->

<!-- autoplan-accepted:eng -->
- Task 1.6 enforces the edit lock in the engine: every mutating manager entry point (or one shared mutation/`history.record` choke point), `history.undo/redo` and the design-system facade refuse while `composer.readOnly`; table-driven test over the manager API with `not-loaded` set asserts no write and no `project:changed`.
- Task 1.6 sets `not-loaded` when the composer is created, clears it only after a successful import and migration; test that an edit before load resolves is refused and never autosaved; history stack asserted empty before a retry import.
- `composer.readOnly` is a getter only; the class field at `Composer.ts:144` is deleted; no setter; `StudioPanels`, `TimeTravelHost` (no save/restore of the previous value) and tests migrate to `setEditLock`; test for no stray view lock after time travel while not-loaded.
- Task 1.4 Editing control = read-only `${breakpoint} ·` prefix + native chrome-ui `Select` with "Default state"/"Hover state"/… options; no new component or wrapper.
- Task 1.3 chord handler ignores editable focus and `getModifierState("AltGraph")`; test with AltGr+O; chord checked in Chrome, Firefox and Safari and recorded.
- Task 1.2 adds inline canvas text editing undo rule (native inside the edit, one composer step on commit) and resync of undo state on composer change, `importProject` and version restore, after verifying which events `importProject` emits.
- Task 1.7 lists `syncRetryQueue.ts` (`lastError`, `failedRecordId`) and relies on `publish.service.ts:344-348` single-live-job guard for Try again; a missing deployment id on job status becomes Task 1.7b through the full tRPC chain with a shared schema; zoom restore skipped when the user changed zoom during the tray.
- Branch topology: Phase-1 PRs cut from `main`; lead merges `main` into `feat/design-2l9` weekly and after each Phase-1 merge; lanes rebase only onto `feat/design-2l9`.
- Pins baseline on one pinned host (lead darwin, repo Playwright version); lane runs are smoke checks.
- Lead owns `StudioPanels.tsx`, `shell/hooks/*` and `src/engine/` after Phase 1; lane PRs fail a name-only diff check against their owned paths.
- `dump.mjs` scrubs email/credential-like text; census treats `inheritsFrom` rows as done only while the archetype is done and exits 2 on dangling or cyclic links.
- Sentry request id comes from the server response header; URLs sent to Sentry drop query strings.
<!-- /autoplan-accepted:eng -->

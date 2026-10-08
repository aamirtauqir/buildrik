# DQ — Design consistency + architecture / code quality (Editor) — 2026-10-08

Agent: DQ. Code: `/Users/shahg/Desktop/buildrik-worktrees/editor-live-audit` (HEAD `f9f79bc66`, clean tree before and after every command). Live: http://localhost:3300, shared fixture `cmrsur1fp000unh3rvmmiq25t` opened **read-only** (selection, menus and palette only; nothing edited or saved). Work files: `scratchpad/audit2/work-DQ/` (probes `p1–p4.mjs`, `sampler.js`, gate outputs in `gates/`, screenshots `s-*.png`, `t-*.png`, `u-*.png`, raw samples `p2-results.json`, `p3-results.json`, seam dump `seam-dump.json`).

## Scope

- **Modules covered:** all editor chrome surfaces reachable from the rail (Add, Layers, Pages, Assets, CMS, Brand), topbar, Inspector (page and heading selection), canvas context menu, site menu, panel ⋯ menu, ⌘K palette. Engine/editor code quality across `packages/editor/src`.
- **Walked live (getComputedStyle sampling, 6 rail panels + inspector + 4 menus):** typography (family, weight, size), control and row heights, input heights, lucide icon sizes and strokes, radius, off-token colours, and spacing off the 4px grid. Every visible chrome node was sampled, with the canvas subtree excluded.
- **Read in code only:** dead code, ownership, event seams, error handling, duplicate logic, import rules, file size, hand-rolled overlays.
- **Gates run read-only:** every member of the `verify:ds` chain, plus `ssot-scan.mjs`, a seam-scan detail dump and `check-tsc-baseline`. All exit 0. Counts are in the table below.
- **Not verified, and why:**
  - The Help (`rail-help`) modal. The Next dev-tools portal (`nextjs-portal`) sits on top of the button, so the click never landed. This happens only in the dev harness and is not a product finding.
  - Toast styling. Triggering a toast needs a write, and the fixture is read-only for me.
  - Any destructive path, which is why DQ-002 is code-only. I did not create my own throwaway site. Time went to the measurement sweep, and the dashboard create flow is covered by L1, so I didn't repeat it.
  - Figma boards for the visual items. I made no Figma calls, as the brief reserves them for the Figma agent.

## Gate / scanner counts (all exit 0 — nothing in the blocking chain is red)

| Gate | Result |
|---|---|
| check-hooks | OK (pre-push matches tracked script) |
| seam-scan (WARN-mode, **not blocking**) | **UP**: listeners-without-emitter 8 (baseline 4), discarded-props 20 (baseline 12); ok: emit-literal-drift 111/131, duplicate-type-names 58/65, silent-defaults 2/2 |
| verify-design-baselines | 78 tokens OK |
| ds-grep-gates | 14 pass + 4 axiom gates under baseline (Gate 11 gradients 34<39, Gate 12 shadows 51<84, Gate 13 panel radius 37<97, Gate 14 layout literals 138<169 — baselines not lowered); Gate 24 raw elements 0; Gate 24b shared/forms 4 |
| check-ds-ssot | green |
| check-token-resolution | PASS, **10 fallback-only refs to undefined tokens** |
| check-anchors | 77/77 |
| check-boards | 276/302 driven · 91 match · 157 drift-fixed · **3 drift-OPEN · 10 unreachable · 15 no-verdict · 26 unchecked** |
| check-hex-drift | 0 new, **10 known defects standing** |
| check-copy | 8/11 lines ship |
| tokens-generated / vibcoder-ratchet / editor-ui-gone | PASS / 0 / 0 |
| chrome-ui-surface | 0 flowbite imports outside chrome-ui; 212 exported names (7 wrapper names incl. **Button**) |
| styling-ratchet | inline_literal 345, inline_hoisted 109, css_lines 5164 (all under baseline) |
| buildrick-baseline | 1/1 |
| design-debt-ratchet | all 0; info: **223 `<Button>` with no `size=`** |
| narrow-control-padding | PASS |
| tsc baseline | editor 0, dashboard 0 |
| ssot-scan.mjs | componentDup 0, keyframeDup 0, tokenAlias 0, selectorDup 1, antiPatterns 5, legacyResiduals 12, docDrift 0 |

Raw greps (src, tests excluded):
- `flowbite-react` outside chrome-ui: 0
- TODO/FIXME/HACK: 0
- `console.log`: 5, all debug-guarded
- Empty `catch {}`: 2
- `.catch(() => {}|null|undefined)`: 25
- Real `any`: about 14
- `../../` imports: **919**
- Files over 800 lines: **26**
- Inline `<svg>` in chrome: 62

---

## Issues

### DQ-001 Pre-publish confirm treats a failed checks request as "no blockers"
- Module / Screen-location / Feature: Publish › Publish confirm facts (topbar fast path + wizard)
- Labels: CODE ONLY ISSUE | BROKEN FUNCTIONALITY | INTEGRATION ISSUE
- Category: Broken existing feature
- Type: Functional
- Severity: Medium
- Problem: `fetchPrePublishChecks(siteId).catch(() => null)` turns into `failed = (null?.checks ?? [])` → `setBlockers([])` + `onBlockingChecks([])`. A network or server error therefore **clears** existing blockers and re-enables Publish. The comment directly above (lines 138-139) claims the opposite: "A checks call that fails is not a pass: it leaves the row saying what it said before".
- Expected behavior: if the checks request fails, keep the previous blockers or show "Couldn't run checks" and keep the button disabled.
- Current behavior: CODE: `packages/editor/src/editor/sidebar/tabs/publish/PublishConfirmFacts.tsx:133-146`. The warnings count is also reset to 0 (`:150`).
- Figma status: not checked
- Code status: PublishConfirmFacts.tsx:133-150
- Integration impact: the client gate is bypassed on any transient tRPC failure. Only the server's `runPrePublishChecks` (Vercel connection) remains as a backstop.
- Probable root cause: `null` and "empty list" were merged by `?? []`.
- Dependencies: publish wizard / L-publish agent
- Recommended next action: branch on `checks === null`, keep the previous state, surface an error row, and add a unit test with a rejected fetch.
- Evidence: CODE-ONLY (forcing a tRPC failure live needs network interception on a real-Vercel workspace, which the brief disallows)

### DQ-002 Layers right-click Delete / Duplicate / Lock bypass the engine command layer (lock gate + read-only refusal)
- Module / Screen-location / Feature: Layers panel › row context menu
- Labels: CODE ONLY ISSUE | BROKEN FUNCTIONALITY
- Category: Broken existing feature
- Type: Functional / Code Quality
- Severity: Medium (High if the Layers menu is reachable in `?view=readonly`)
- Problem: `src/editor/AGENTS.md` says "Element actions live in one registry … A menu row or shortcut that re-implements one of them is a defect". The Layers menu breaks that rule:
  - Single-row Delete calls `composer.elements.removeElement(id)` (`useLayerActions.ts:298-307`) instead of `commands.run("delete")`. `removeElement` has no lock check (`ElementCRUD.ts:96-125`). The engine `delete` command refuses an explicit delete of a locked element (`commandOperations.ts:30-31`).
  - Duplicate calls `elements.duplicateElement` directly (`:309-317`).
  - Lock goes through `setLocked` and the panel's own Set instead of `lock-element` / `unlock-element`.
  - None of these paths runs through `CommandCenter`, so its read-only refusal (`CommandCenter.ts:137-143`) never fires. Layers has no `readOnly` checks at all.
- Expected behavior: rows run `ELEMENT_ACTIONS` / `composer.commands.run(...)`, like the Inspector ⋯ and the canvas menu.
- Current behavior: CODE: `packages/editor/src/editor/panels/layers/hooks/useLayerContextActions.ts:104-133`, `useLayerActions.ts:164-317`, and `LayerContextMenu.tsx`, which has no lock or read-only gating.
- Figma status: not checked
- Code status: as above
- Integration impact: a locked element can be deleted or duplicated from Layers, and a view-mode session may be able to mutate.
- Probable root cause: the Layers menu predates the `elementActions.ts` registry.
- Dependencies: engine lock gate (`engine/AGENTS.md`)
- Recommended next action: route the rows through `ELEMENT_ACTIONS`. Then live-verify on a scratch site: lock an element, right-click it in Layers, choose Delete, and expect a refusal toast.
- Evidence: CODE-ONLY (destructive; my session was read-only on the shared fixture)

### DQ-003 Dead event subscriptions — "Show in Layers", Layers toggle, zoom-to-selection, templates toggle (Phase-1 re-verified on main)
- Module / Screen-location / Feature: Shell event wiring
- Labels: CODE ONLY ISSUE | INCOMPLETE FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Integration
- Severity: Low
- Problem: four listeners have no emitter anywhere in `src`:
  - `SHOW_IN_LAYERS` (`useEditorEventListeners.ts:146`)
  - `UI_TOGGLE_LAYERS` (`:193`)
  - `ZOOM_SELECTION` (`Canvas.tsx:394`)
  - literal `"ui:toggle:templates"` (`useComposerInit.ts:535`). It is not in `EVENTS`, and the comment there claims ⌘⇧T emits it.
- Expected behavior: each listener has a real emitter, or the listener is deleted.
- Current behavior: CODE: grep shows only the `.on`/`.off` pairs. `panels/layers/index.tsx:217` still has a comment about a "Show in Layers" button that nothing triggers.
- Figma status: not checked
- Code status: as above
- Integration impact: the Show-in-Layers scroll path and the palette zoom-to-selection route are unreachable.
- Probable root cause: emitters were deleted in refactors and the listeners were left behind.
- Dependencies: Phase-1 03-engine.md P2 events table (still accurate)
- Recommended next action: emit from the canvas menu and the command palette, or delete the listeners.
- Evidence: CODE-ONLY (PHASE-1 finding, re-verified on current main)

### DQ-004 seam-scan reports false orphans and its growth is not enforced
- Module / Screen-location / Feature: Tooling › `scripts/conformance/seam-scan.mjs`
- Labels: CODE ONLY ISSUE
- Category: UX improvement (tooling)
- Type: Code Quality
- Severity: Low
- Problem:
  - Four of the 8 "listeners without emitter" are false positives. `RESIZE_START/MOVE/END` are emitted through `this.emitResizeEvent(EVENTS.RESIZE_*)` (`engine/canvas/ResizeHandler.ts:181,348,375`). `BRAND_CHECKS_RUN` is emitted through the optional call `composer?.emit?.(…)` (`BrandWorkspace.tsx:521`). The regex matches neither.
  - The scanner's counts are above baseline (8>4, 20>12), but it runs in WARN-mode, so nobody acts on them.
- Expected behavior: the scanner recognises `emit?.(` and helper emitters, and growth is a failure.
- Current behavior: CODE: `gates/seam-scan.txt`, `work-DQ/seam-dump.json`
- Figma status: n/a
- Code status: seam-scan.mjs:75-142
- Integration impact: real orphans (DQ-003) are mixed with noise, so the list is ignored.
- Probable root cause: regex-based emitter detection.
- Dependencies: DQ-003
- Recommended next action: fix the regex, re-baseline, and move the scanner to ERROR.
- Evidence: CODE-ONLY

### DQ-005 Engine failure events are emitted with no listener — save/load/command errors are silent in the UI (Phase-1 re-verified)
- Module / Screen-location / Feature: Engine → shell error surfacing
- Labels: CODE ONLY ISSUE | MISSING FUNCTIONALITY | INTEGRATION ISSUE
- Category: Missing required feature
- Type: Integration / Missing State
- Severity: Medium
- Problem: nothing in `src` subscribes to:
  - `EVENTS.ERROR`, emitted on init, load, save and the root-delete refusal (`Composer.ts:425,603,623`, `ElementCRUD.ts:104`)
  - `STORAGE_ERROR` (`StorageAdapter.ts:51`)
  - `COMMAND_ERROR`, which includes the read-only refusal (`CommandCenter.ts:143,158`)
- Expected behavior: one shell listener turns these events into a toast or banner.
- Current behavior: CODE: grep for `.on(EVENTS.ERROR|STORAGE_ERROR|COMMAND_ERROR` returns 0 results.
- Figma status: not checked
- Code status: as above
- Integration impact: the user gets no feedback when a local save fails or a command is refused.
- Probable root cause: no owner for engine error UX.
- Dependencies: Phase-1 03-engine.md
- Recommended next action: subscribe in `useEditorEventListeners` and map each event to a `useToast` call.
- Evidence: CODE-ONLY (PHASE-1, re-verified on main)

### DQ-006 919 `../../` relative imports despite the CLAUDE.md ban — no gate enforces it
- Module / Screen-location / Feature: Whole package
- Labels: CODE ONLY ISSUE
- Category: UX improvement (maintainability)
- Type: Code Quality
- Severity: Medium
- Problem: root CLAUDE.md says "`../../` relative imports banned; use path aliases", yet 919 import lines in `src` do it.
  - By folder: canvas 178, sidebar 131, inspector 102, shell 98, design-system 72, elements 42, media 41.
  - Top files: `editor/canvas/hooks/drag/dropOperations.tsx` (10), `editor/shell/hooks/useStudioHandlers.ts` (9), `StudioHeader.tsx` (8), `inspector/hooks/useStyleHandlers.ts` (8), `TokenDetailView.tsx` (8), `engine/export/ExportEngine.ts` (7), `engine/elements/Element.ts` (7), `LayersTab.tsx` (7), `AquibraStudio.tsx` (7), `ExportModal.tsx` (7).
  - Some reach 5 levels deep, e.g. `../../../../../services/stock/StockService` in `useDiscoveryState.ts:14`.
- Expected behavior: `@/…` aliases, with an eslint `no-restricted-imports` rule.
- Current behavior: CODE: `grep -rnE "from ['\"]\.\./\.\./"` counts 919.
- Figma status: n/a
- Code status: see counts
- Integration impact: moves break silently, and the import direction rules (engine → shared only) are hard to audit.
- Probable root cause: the rule was written without a gate.
- Dependencies: none
- Recommended next action: run a codemod to `@/` aliases, then add an ESLint ban with a 0 ratchet.
- Evidence: CODE-ONLY

### DQ-007 26 source files over 800 lines mixing concerns
- Module / Screen-location / Feature: Engine + chrome
- Labels: CODE ONLY ISSUE
- Category: UX improvement (maintainability)
- Type: Code Quality
- Severity: Medium
- Problem: "One file = one job" is violated by the largest files:

  | File | Lines | Mixed concerns |
  |---|---|---|
  | `engine/media/MediaManager.ts` | 1806 | |
  | `engine/export/ExportEngine.ts` | 1367 | |
  | `engine/Composer.ts` | 1310 | |
  | `editor/media/LibraryManager.tsx` | 1258 | |
  | `sidebar/tabs/review/ReviewTab.tsx` | 1207 | |
  | `sidebar/tabs/settings/SettingsTab.tsx` | 1172 | |
  | `sidebar/tabs/publish/PublishTab.tsx` | 1135 | |
  | `media/components/AssetGrid.tsx` | 1062 | |
  | `shell/StudioPanels.tsx` | 1030 | |
  | `engine/VersionTimelineManager.ts` | 1025 | |
  | `services/BuildrikSyncProvider.ts` | 1019 | |
  | `shell/StudioHeader.tsx` | 1008 | |
  | `editor/canvas/Canvas.tsx` | 988 | |
  | `design-system/ui/BrandWorkspace.tsx` | 949 | UI + menus + popovers + state |
  | `shell/AquibraStudio.tsx` | 931 | |
  | `shell/hooks/useComposerInit.ts` | 916 | init + event bridging + AI client wiring |

  CSS has the same problem: `LibraryManager.css` 1042, `history.css` 971, `inspector.css` 955, `Canvas.css` 838.
- Expected behavior: split by concern (state hook / view / actions).
- Current behavior: CODE: `wc -l`
- Figma status: n/a
- Code status: listed
- Integration impact: high merge-conflict and regression surface. ReviewTab, Publish and Settings are also the most bug-dense areas in other agents' reports.
- Probable root cause: features accreted in place.
- Dependencies: none
- Recommended next action: start with StudioPanels, useComposerInit and BrandWorkspace (cross-cutting).
- Evidence: CODE-ONLY

### DQ-008 Six Composer managers constructed and never used (Phase-1 re-verified)
- Module / Screen-location / Feature: Engine › Composer
- Labels: CODE ONLY ISSUE
- Category: Nice-to-have enhancement
- Type: Code Quality
- Severity: Low
- Problem: `globalStyles`, `styleBindings`, `traitBindings`, `textBindings`, `darkResolver` and `cssBundler` are instantiated (`Composer.ts:280-295`). Outside Composer there are 0 references; inside it they appear only in `destroy()` (`:1265-1267`).
- Expected behavior: delete the managers, or wire them up.
- Current behavior: CODE: grep shows 0 consumers.
- Figma status: n/a
- Code status: Composer.ts:156-171, 280-295
- Integration impact: they are constructed on every editor load, and they look like live features to anyone reading the code.
- Probable root cause: abandoned features.
- Dependencies: Phase-1 03-engine.md P2-11
- Recommended next action: delete the managers and their files.
- Evidence: CODE-ONLY (PHASE-1, still present)

### DQ-009 Email-marketing integration is a DEAD/SIMULATED stub still wired into Composer and FormHandler
- Module / Screen-location / Feature: Engine › integrations / forms
- Labels: CODE ONLY ISSUE | INCOMPLETE FUNCTIONALITY
- Category: Incomplete existing feature
- Type: Code Quality
- Severity: Low
- Problem: `engine/integrations/EmailService.ts` is marked `@deprecated DEAD/SIMULATED`.
  - Every provider calls `subscribeViaBackendProxy`, which throws "endpoint not yet configured".
  - It is still imported by `Composer.ts:48,883`, which also keeps an `apiKey` in project settings, and by `FormHandler.ts:275-286`.
  - No editor UI sets `integrations.email` (0 hits).
- Expected behavior: delete it, or build it properly server-side.
- Current behavior: CODE: as cited
- Figma status: not checked
- Code status: as above
- Integration impact: none today, because the code can't be reached without settings. It is a trap for whoever builds on it.
- Probable root cause: an unfinished L0 feature.
- Dependencies: none
- Recommended next action: remove it from Composer and FormHandler, and delete `engine/integrations/`.
- Evidence: CODE-ONLY

### DQ-010 Two contrast auto-fix algorithms that disagree
- Module / Screen-location / Feature: Brand › lint Auto-fix vs colour token "Fix all"
- Labels: CODE ONLY ISSUE
- Category: Broken existing feature (semantic duplication)
- Type: Code Quality / Functional
- Severity: Medium
- Problem: there are two implementations of "fix this colour's contrast":
  - `engine/designSystem/contrastFix.ts` (104 lines) shifts HSL lightness by a fixed ±22% and does not check the result.
  - `editor/design-system/utils/contrastFix.ts` (50 lines) binary-searches to WCAG AA 4.5.

  The engine file's own header acknowledges the other one. The same token can get two different "fixes", and the lint path can leave it still failing AA.
- Expected behavior: one helper, guaranteed to reach the target ratio.
- Current behavior: CODE: both files
- Figma status: not checked
- Code status: as above
- Integration impact: Brand lint can report "fixed" while the result still fails the contrast check.
- Probable root cause: the engine couldn't import from editor, so the helper was rewritten instead of being moved to `shared/`.
- Dependencies: none
- Recommended next action: move the WCAG version to `shared/utils/` and delete the ±22% one.
- Evidence: CODE-ONLY

### DQ-011 Time-travel Restore silently proceeds when the safety checkpoint fails
- Module / Screen-location / Feature: History › Time travel › Restore
- Labels: CODE ONLY ISSUE
- Category: Broken existing feature
- Type: Functional
- Severity: Medium
- Problem: `await composer.versions?.autoCheckpoint?.("Before restoring").catch(() => null); composer.history?.restoreEntry?.(targetId);` If the checkpoint write fails, the user's current state is overwritten without the promised "Before restoring" version and without any message.
- Expected behavior: abort the restore, or warn "couldn't save a checkpoint — restore anyway?".
- Current behavior: CODE: `packages/editor/src/editor/shell/TimeTravelHost.tsx:220-222`
- Figma status: not checked
- Code status: as above
- Integration impact: data-loss path on a flaky network.
- Probable root cause: a blanket swallow.
- Dependencies: versions service
- Recommended next action: check the result and show a confirm or error.
- Evidence: CODE-ONLY

### DQ-012 Swallowed promise rejections (25) — notable ones mask state
- Module / Screen-location / Feature: Cross-cutting
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Code Quality
- Severity: Low
- Problem: 25 `.catch(() => {}/null/undefined)` calls and 2 empty `catch {}` (`useAutoMilestone.ts`, `export/interactionRuntime.ts`). The ones that hide state:
  - `services/RoleService.ts:35` caches a failed role lookup as `null` for the whole session. Only `invalidateMyRole()` after a refused write clears it, so one blip leaves role-gated chrome "unknown" until reload.
  - `CompareHost.tsx:87,91`
  - `DomainsScreen.tsx:191`
  - `AssetDetailOverlay.tsx:188`
  - `TemplatesTab.tsx:192`
  - `CollaborationManager.ts:819`
  - `adoptionTracker.ts:26`

  Plus DQ-001 and DQ-011.
- Expected behavior: log via devLogger/Sentry at least, and never cache a failure.
- Current behavior: CODE: as cited
- Figma status: n/a
- Code status: as cited
- Integration impact: silent degraded states that are hard to debug.
- Probable root cause: defensive swallowing.
- Dependencies: none
- Recommended next action: add a lint rule for empty catches, and in RoleService don't cache rejected lookups.
- Evidence: CODE-ONLY

### DQ-013 Same engine state mirrored in several React states with different subscriptions
- Module / Screen-location / Feature: Shell / Pages / Page tab bar / Zoom
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Code Quality
- Severity: Low
- Problem:
  - The active page id is held in three `useState`s:
    - `AquibraStudio.tsx:369` listens to `PAGE_CHANGED`
    - `PageTabBar.tsx:34` listens to `PROJECT_CHANGED` + `PROJECT_LOADED`
    - `usePages.ts:92` has its own sync

    Each subscribes to a different event set, and PageTabBar's comment records that a missed event already hid the whole bar once (2026-08-14).
  - Zoom is stored three times: `composer.state.zoom`, `Viewport.zoom`, and `useStudioState.ts:242`. These are kept in sync through events.
- Expected behavior: one `useActivePage(composer)` / `usePageList` hook.
- Current behavior: CODE: as cited
- Figma status: n/a
- Code status: as cited
- Integration impact: risk of drift (tab bar vs Pages panel vs header disagreeing on the active page).
- Probable root cause: copy-paste subscriptions.
- Dependencies: none
- Recommended next action: extract one hook and replace the three copies.
- Evidence: CODE-ONLY

### DQ-014 Discarded props / dead prop API on the shell
- Module / Screen-location / Feature: Shell
- Labels: CODE ONLY ISSUE
- Category: Nice-to-have enhancement
- Type: Code Quality
- Severity: Low
- Problem: `StudioPanels.tsx` destructures and discards `blocks`, `onQuickAdd` and `onLeftPanelSubTabChange`. `AquibraStudio.tsx` discards `licenseKey`. The rest of the 20 seam-scan hits are deliberate `aria-disabled` no-op handlers.
- Expected behavior: drop the unused props from the interfaces and their callers.
- Current behavior: CODE: `work-DQ/seam-dump.json`
- Figma status: n/a
- Code status: StudioPanels.tsx, AquibraStudio.tsx
- Integration impact: callers believe they are configuring behaviour that is ignored.
- Probable root cause: leftover API.
- Dependencies: DQ-004
- Recommended next action: delete the props.
- Evidence: CODE-ONLY

### DQ-015 Inspector spacing box: labels "Margin"/"Padding" render in Geist Mono (data face) — values are correct
- Module / Screen-location / Feature: Inspector › Spacing box model
- Labels: CODE ONLY ISSUE (possibly FIGMA + CODE — board not checked)
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: Answer to the brief's question: **the mono is Geist Mono, not a fallback.**
  - Geist Mono 400/500 is loaded (`document.fonts`). The value inputs compute to `"Geist Mono"` 12px `tabular-nums`, which matches DESIGN.md §Typography ("Data / Inspector values … Geist Mono with tabular-nums").
  - **The ring labels "Margin" and "Padding" also use Geist Mono** 12px, without tabular-nums. They are words, not data. DESIGN.md says panel labels use Inter 11/500, and the surrounding section labels in the same box are Inter 11/500.
- Expected behavior: labels in Inter 11/500 (ink-muted), values in Geist Mono tabular.
- Current behavior: LIVE: `t-inspector-heading.png`. The computed font of `span "Margin"` is `"Geist Mono", "SF Mono", Menlo, Consolas, monospace`.
- Figma status: not checked (if the board draws mono tags, the board conflicts with DESIGN.md)
- Code status: `editor/inspector/shared/controls/SpacingControls.tsx:197` (`BOX_TAG` uses `--bk-font-mono`)
- Integration impact: none
- Probable root cause: one class string covers both the tag and the numeric styling.
- Dependencies: Figma agent to confirm the board
- Recommended next action: switch `BOX_TAG` to `--bk-font-ui` 11/500.
- Evidence: LIVE-VERIFIED

### DQ-016 Add panel "Heading" icon renders in Times (serif) at weight 700
- Module / Screen-location / Feature: Add panel › Elements › Heading row icon
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: the catalog's inline SVG for Heading is `<text … font-family="serif" font-weight="700">H</text>`. In the browser it computes to the generic serif face (Times) at 700. This is a default font stack and a weight above 600 in chrome, both banned by DESIGN.md rule 8 and the 600 cap. It is the only serif and only 700 node found in the whole chrome sample.
- Expected behavior: a lucide `Heading` glyph, as Layers uses (`editor/shared/elementIcons.tsx`).
- Current behavior: LIVE: sampled `text "H"` with ff=serif fw=700 inside `svg[insert-row-icon-insert-el-Heading]`. CODE: `editor/sidebar/tabs/build/catalog/catalog.ts:16,21`
- Figma status: not checked
- Code status: catalog.ts:16,21
- Integration impact: none
- Probable root cause: a hand-drawn icon catalog (see DQ-017).
- Dependencies: DQ-017
- Recommended next action: replace the glyph with the lucide icon.
- Evidence: LIVE-VERIFIED

### DQ-017 Two element-icon systems + 62 hand-rolled inline SVGs; icon sizes on 12 different values
- Module / Screen-location / Feature: Add panel, Layers, History, Pages, Topbar
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design / Code Quality
- Severity: Low
- Problem:
  - **Two icon systems for the same element types.** The Add panel draws them from 59 SVG fragments injected with `dangerouslySetInnerHTML` (`GroupSection.tsx:181-195`, strokeWidth 1.5). Layers uses lucide (`elementIcons.tsx`, stroke 2).
  - **62 inline `<svg>`s in chrome** instead of lucide. Largest sources: `history/icons.tsx` 8, `PageFolder.tsx` 6, `PageRow.tsx` 4, `Topbar.tsx` 4.
  - **Icon sizes are inconsistent.** Lucide `size=` takes 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22 and 24 in code. Live, the inspector shows 8×8 steppers and 10×10 chevrons next to 12, 14 and 16 icons, and the Layers row icons render at 12×13. Stroke widths vary between 1.5, 1.75, 2, 2.5 and 3.
- Expected behavior: lucide only, with a small size scale (12/14/16/18) and one stroke.
- Current behavior: LIVE: lucide sizes sampled per panel in `p2-results.json` and `p3-results.json`. CODE: as cited.
- Figma status: not checked
- Code status: as cited
- Integration impact: visual inconsistency between Add and Layers for the same element type.
- Probable root cause: separate builds per board.
- Dependencies: none
- Recommended next action: add an `ICON_SIZE` constant set and port the catalog to lucide.
- Evidence: LIVE-VERIFIED (sizes) + CODE-ONLY (sources)

### DQ-018 Menus: four different row specs and three hand-rolled context menus
- Module / Screen-location / Feature: Site menu, panel ⋯ menu, canvas right-click menu, ⌘K palette, Layers and Media context menus
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design / Code Quality
- Severity: Medium
- Problem: menu rows are built four different ways.

  | Menu | Row height | Size / weight | Radius |
  |---|---|---|---|
  | Site menu | 28px | 13/400 | 6 |
  | Panel ⋯ menu | 32px | 13/500 | 6 |
  | Canvas context menu | 30px | — | — |
  | ⌘K rows | 32px | 14/500 | 0 |

  `role="menu"` is implemented by hand in `ElementContextMenu.tsx` + `SubmenuPanel.tsx`, `LayerContextMenu.tsx`, `MediaContextMenu.tsx`, `LayersTab.tsx` and `BrandWorkspace.tsx`. The first three don't use chrome-ui `Popover` or any shared menu-item primitive.

  DESIGN.md row density is 28 (dense) or 32 (standard). 30 is neither, and the same kind of item changes size and weight from one menu to the next.
- Expected behavior: one chrome-ui `Menu`/`MenuItem` (28 or 32, 13/400), used by every menu.
- Current behavior: LIVE: `u-site-menu.png`, `u-panel-more.png`, `t-canvas-context-menu.png`, `u-cmdk.png`
- Figma status: not checked
- Code status: as cited
- Integration impact: inconsistent keyboard and focus behaviour across menus (each one re-implements focus-first-item, Escape and click-outside).
- Probable root cause: there is no Menu primitive in chrome-ui.
- Dependencies: none
- Recommended next action: add `chrome-ui/Menu` and migrate the context menus.
- Evidence: LIVE-VERIFIED

### DQ-019 Hand-rolled dialogs and drawers outside chrome-ui overlay primitives
- Module / Screen-location / Feature: AI plan, Page settings drawer, Media replace-across, Asset detail overlay, Notifications, Command palette, Layer display settings, Achievement prompt
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Code Quality
- Severity: Low
- Problem: 8 components declare `role="dialog"` but use none of `ModalRoot`, `Drawer`, `Popover`, `Portal`, `OverlayMount` or `ConfirmDialog`:
  - `sidebar/tabs/ai/AgentPlan.tsx`
  - `pages/page-settings/PageSettingsDrawer.tsx` (chrome-ui has `Drawer`)
  - `media/components/ReplaceAcrossDialog.tsx`
  - `media/components/AssetDetailOverlay.tsx` (734 lines)
  - `shell/NotificationPanel.tsx`
  - `shell/modals/CommandPalette.tsx`
  - `panels/layers/components/LayerDisplaySettings.tsx`
  - `onboarding/AchievementPrompt.tsx`

  The other 26 modals checked do use chrome-ui `ModalRoot`, which is good.
- Expected behavior: chrome-ui primitives, so focus trap, Escape (`hasOpenEscapeSurface`) and scrim behave the same everywhere.
- Current behavior: CODE: grep shows `role="dialog"` with no primitive in each file.
- Figma status: n/a
- Code status: as listed
- Integration impact: Escape and focus handling per dialog is bespoke and can drift.
- Probable root cause: built before the primitives existed, or for one-off layouts.
- Dependencies: DQ-018
- Recommended next action: start with PageSettingsDrawer → `Drawer`, then the media overlays.
- Evidence: CODE-ONLY

### DQ-020 Control-height and input-height spread across panels
- Module / Screen-location / Feature: All panels
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Medium
- Problem: measured heights differ for controls with the same role.
  - **Buttons** take 9 heights: 16, 20, 22, 24, 28, 30, 32, 40 and 44px. The same "add" action is 24px in Pages (`pages-add-page`) and 28px in Brand (`brand-page-action` "+ Add token"). "Manage assets" is 40px, as are the Inspector "More settings" rows (`button.bdi-adv`).
  - **Small hit targets:** Brand "Back to canvas" and "Ignore" are 16px tall, Layers expand chevrons (`bdc-lr-chev`) are 16px, and the ⌘K "Esc Close" is 16px.
  - **Inputs:** the Inspector spacing inputs are 16px tall × 28px wide. Other inspector inputs are 24px and panel searches are 32px. The Brand live-preview zoom select is 20px.
  - The design-debt gate reports 223 `<Button>`s with no `size=`.
- Expected behavior: DESIGN.md / chrome-ui sizes (rows 28/32, compact controls 24/28, inputs 28/32), with a minimum ~24px target for icon buttons.
- Current behavior: LIVE: `p2-results.json` `controlHeight` / `inputHeight` per panel; screenshots `s-*.png`
- Figma status: not checked
- Code status: per testid above; `check-design-debt-ratchet` "unsized-button" 223
- Integration impact: accessibility and consistency.
- Probable root cause: Button has no default size (ledger B-11 / PD-31 open).
- Dependencies: PD-31
- Recommended next action: set a Button default size, then sweep the outliers listed.
- Evidence: LIVE-VERIFIED

### DQ-021 Weight 700 reaches chrome through `<strong>`/`<b>` and CSS `bold` (the gate is blind to it)
- Module / Screen-location / Feature: Brand empty state, publish/unpublish modals, page bulk bar, version history notices, etc.
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: DESIGN.md caps chrome weight at 600.
  - Live, the Brand empty state's `<strong>No brand set.</strong>` computes to 700.
  - There are 13 `<strong>`/`<b>` in chrome. Several have no weight class: `BrandWorkspace.tsx:836`, `BulkToolbar.tsx:44`, `ActivityView.tsx:361`, `DeleteConfirmModal.tsx:47`, `UnpublishConfirmModal.tsx:62`, `ExportSection.tsx:375`, `PresetDetailPane.tsx:215`, `LibraryManager.tsx:1003`. These inherit the browser's `bolder`.
  - `Canvas.css:299` sets `font-weight: bold` on a chrome badge.
  - The `font-weight-700` gate is at 0 only because it doesn't see these.
- Expected behavior: chrome-reset sets `strong, b { font-weight: 600 }`.
- Current behavior: LIVE: Brand panel sample `weightOver600: 700 strong "No brand set."` (`s-design.png`)
- Figma status: not checked
- Code status: as cited
- Integration impact: none
- Probable root cause: missing reset rule.
- Dependencies: none
- Recommended next action: add one rule to `chrome-reset.css` and extend the gate.
- Evidence: LIVE-VERIFIED

### DQ-022 Indigo `#667eea` / `rgba(102,126,234,…)` and a pink lock outline in canvas chrome CSS
- Module / Screen-location / Feature: Canvas › inline text edit outline; locked-element outline
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem:
  - `Canvas.css:708-759` uses `var(--bk-accent, #667eea)` six times. #667eea is the banned indigo; it only renders if the token is missing.
  - `:710` sets `background: rgba(102,126,234,0.05) !important`. This indigo tint *does* render on every contenteditable element during inline editing.
  - Locked elements get `outline: 2px dotted #f38ba8` (pink, `:248,254`), which is off-palette.
  - Gate 18 doesn't catch hex inside a `var()` fallback or an `rgba()`.
- Expected behavior: `--bk-accent` with no fallback, an accent-tint token for the edit background, and a semantic token for the lock outline.
- Current behavior: CODE: as cited (not triggered live, because inline editing is a write path)
- Figma status: not checked
- Code status: Canvas.css:96,248,254,708-759
- Integration impact: off-brand hue on the canvas while editing.
- Probable root cause: pre-DS legacy CSS.
- Dependencies: none
- Recommended next action: swap to tokens and extend Gate 18 to fallbacks and rgba.
- Evidence: CODE-ONLY

### DQ-023 Off-token hex and near-black surfaces in chrome components
- Module / Screen-location / Feature: Pages status chips, Export code preview, Device frame preview, Time-travel band
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: the editor has 394 hex literals in `.ts/.tsx` and 18 in `.css`. Most are legitimate data: templates 138, DS starters about 108. The chrome cases are:
  - Pages status chips use raw Tailwind greens and ambers (`PagesTab.css:289,291`: `#DCFCE7/#166534`, `#FEF3C7/#92400E`) instead of `--bk-success-*` / `--bk-warning-*`.
  - `CodePreview.tsx:21-25,179,208` uses a One-Dark palette with a `#282c34` dark surface.
  - `DeviceFramePreview.tsx:128,129,149,238` uses inline-style hex (`#2a2a2e`, `#3a3a3e`, `#a1a1aa`).
  - `TimeTravelHost.tsx:283` puts an ink-black button background (`bg-[var(--bk-ink)]`) in chrome.

  DESIGN.md anti-slop rule 1 ("NO black or near-black surfaces") and rule 11 (one accent, no category colours) apply.
- Expected behavior: `--bk-*` tokens only.
- Current behavior: CODE: as cited. Live samples of rail panels found no off-token chrome colours apart from user-data swatches.
- Figma status: not checked
- Code status: as cited
- Integration impact: none
- Probable root cause: the gate's per-file baselines allow these.
- Dependencies: Gate 16 ratchet
- Recommended next action: tokenise the chips, and decide whether the code-preview dark surface is a sanctioned exception.
- Evidence: CODE-ONLY

### DQ-024 10 references to undefined `--bk-*` tokens that render via hard-coded fallbacks
- Module / Screen-location / Feature: Slider, inspector PropertyField, Library manager, LeftSidebar
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design / Code Quality
- Severity: Low
- Problem: these token references resolve to nothing, so the fallback value is what renders:
  - `--bk-slider-fill` ×4 (`chrome-ui/slider.css:16`)
  - `--bk-warning-ink` (`PropertyField.tsx:30`)
  - `--bk-bg-overlay`, `--bk-ink-inverse`, `--bk-bg-active` (`LibraryManager.css:898,899,1013`)
  - `--mgr-cols`, `--drawer-w`
- Expected behavior: real generated tokens.
- Current behavior: CODE: `gates/check-token-resolution.txt`
- Figma status: n/a
- Code status: as cited
- Integration impact: a token change in Figma won't reach these.
- Probable root cause: names invented without adding them to the token export.
- Dependencies: token pipeline
- Recommended next action: map each to an existing token or add it in Figma.
- Evidence: CODE-ONLY

### DQ-025 Mono font stack: named fallbacks, two definitions, and raw `monospace` in canvas overlays
- Module / Screen-location / Feature: Tokens / canvas overlays / DS modals
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem:
  - `--bk-font-mono` = `"Geist Mono","SF Mono",Menlo,Consolas,monospace` (`tokens.generated.css:185`), while `tw.css:37` defines a different `--font-mono` = `"Geist Mono", ui-monospace, monospace`.
  - DESIGN.md rule 8 bans named fallbacks, yet DESIGN.md:139 itself lists this stack, so the document contradicts itself.
  - `SpacingLabels.tsx:25` and `SelectionBoxOverlay.tsx:540` use bare `fontFamily: "monospace"`. That bypasses Geist Mono, so the browser renders Menlo or Courier.
  - Inline fallback stacks appear in `AIPromptModal.tsx:178`, `PresetDetailPane.tsx:90`, `PresetBindingRow.tsx:77` and `TokenReplaceModal.tsx:63`.
  - `editor/design-system/styles/design-tokens.css:38,45` uses `'Fira Code', monospace`.
- Expected behavior: one mono token, used everywhere.
- Current behavior: CODE: as cited
- Figma status: n/a
- Code status: as cited
- Integration impact: canvas dimension labels don't use the data face.
- Probable root cause: overlays written before the token existed.
- Dependencies: DESIGN.md owner decision on fallbacks
- Recommended next action: use `var(--bk-font-mono)` everywhere and settle the DESIGN.md wording.
- Evidence: CODE-ONLY

### DQ-026 Emoji as a design element in the first-use tip
- Module / Screen-location / Feature: Add panel › FirstUseTip ("💡 Tip 1/4")
- Labels: FIGMA + CODE ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: DESIGN.md anti-slop rule 6 says "No emoji as design elements". Board 7054:78348, as quoted in the code, draws 💡, and the code renders it (`FirstUseTip.tsx:68`). Live, "💡 Tip 1/4" renders at 600 weight.
- Expected behavior: a lucide `Lightbulb` icon, or text only.
- Current behavior: LIVE: `s-initial-add.png` sample `span "💡 Tip 1/4"`
- Figma status: board 7054:78348 (as cited in code; not opened)
- Code status: FirstUseTip.tsx:68
- Integration impact: none
- Probable root cause: the board conflicts with DESIGN.md.
- Dependencies: Figma agent
- Recommended next action: fix the board and the code together.
- Evidence: LIVE-VERIFIED

### DQ-027 Panel header heights and patterns vary across surfaces
- Module / Screen-location / Feature: Left panels, CMS, Brand, Inspector
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: DESIGN.md sets panel headers at 44px. Measured:
  - Add, Layers, Pages and Assets use `panel-header` at 44px, which is consistent.
  - The CMS workspace adds a second 56px `cms-ws-header` under its 44px panel header.
  - Brand has no PanelHeader at all: it uses an `h1` "Brand" at 24/600, an `h2` at 20/600, and a 40px token-detail header.
  - The Inspector header is 68–72px.
- Expected behavior: a documented exception for full-page workspaces (CMS, Brand), or one header component everywhere.
- Current behavior: LIVE: `p2-results.json` `headerHeight`; `s-content.png`, `s-design.png`
- Figma status: not checked
- Code status: `cms-ws-header`, `BrandWorkspace.tsx`
- Integration impact: none
- Probable root cause: workspaces built from different board families.
- Dependencies: Figma agent
- Recommended next action: have DESIGN.md name the workspace-header variant.
- Evidence: LIVE-VERIFIED

### DQ-028 Off-scale radii in chrome (2/3/5/12px)
- Module / Screen-location / Feature: Inspector heading-level segmented control, colour swatches, spacing inputs, tip cards
- Labels: CODE ONLY ISSUE
- Category: UX improvement
- Type: Design
- Severity: Low
- Problem: DESIGN.md's radius scale is 4, 6, 8 and full. Measured outside it:
  - **5px** on the Inspector H1–H6 segmented buttons (`inspector-seg-level-*`)
  - **3px** on colour swatches (`button.bdi-sw`)
  - **2px** on the spacing inputs (`input.bk-input`) and Layers row icons
  - **12px** on `setup-chip` and the cmdk palette (12 is allowed for modals only)
- Expected behavior: scale values only.
- Current behavior: LIVE: `p3-results.json` `radius`
- Figma status: not checked
- Code status: inspector CSS / classes on those testids
- Integration impact: none
- Probable root cause: per-board literal values.
- Dependencies: Gate 13 (panel chrome only)
- Recommended next action: snap these to the scale.
- Evidence: LIVE-VERIFIED

### DQ-029 Duplicate `showToast` pass-through wrappers in Media
- Module / Screen-location / Feature: Assets / Media tab
- Labels: CODE ONLY ISSUE
- Category: Nice-to-have enhancement
- Type: Code Quality
- Severity: Low
- Problem: `MediaTab.tsx:94` and `useMediaState.ts:25` each define `showToast(msg, type)` → `addToast({description, tone})`. These are two copies of the same reshaping wrapper, and CLAUDE.md §1/§3 forbids both the wrapper and the duplication.
- Expected behavior: call `addToast` directly.
- Current behavior: CODE: as cited
- Figma status: n/a
- Code status: as cited
- Integration impact: none
- Probable root cause: migration leftover.
- Dependencies: none
- Recommended next action: inline both.
- Evidence: CODE-ONLY

### DQ-030 Stale headers: StockService "stub" comment and CLAUDE.md's "closed 2-wrapper set"
- Module / Screen-location / Feature: Docs-in-code
- Labels: CODE ONLY ISSUE
- Category: Nice-to-have enhancement
- Type: Code Quality
- Severity: Low
- Problem:
  - `services/stock/StockService.ts:4` says it is "Currently a stub: returns empty results", but it calls tRPC `media.searchStockPhotos` / `searchStockVideos` (`:113,127`).
  - `packages/editor/CLAUDE.md` says chrome-ui has a closed two-wrapper set (TextInput, Select). The `chrome-ui-surface` gate manifest lists Button / ButtonProps / ButtonVariant as wrappers too.
- Expected behavior: the docs match the code.
- Current behavior: CODE: as cited
- Figma status: n/a
- Code status: as cited
- Integration impact: misleads future agents
- Probable root cause: docs drift
- Dependencies: `pnpm run audit:rules`
- Recommended next action: update both.
- Evidence: CODE-ONLY

### DQ-031 ssot-scan residuals: pass-through predicates, duplicate selector, unannotated legacy rules, dead test utils
- Module / Screen-location / Feature: shared/utils, CSS
- Labels: CODE ONLY ISSUE
- Category: Nice-to-have enhancement
- Type: Code Quality
- Severity: Low
- Problem: `ssot-scan.mjs` reports:
  - Pass-through wrappers `isInteractiveType`, `isLandmarkType` and `canHaveChildren` (`shared/utils/nesting/typeChecks.ts:39,78,157`). These were kept knowingly.
  - `.bd-depth-badge` defined in both `Canvas.css:593` and `a11y.css:60`.
  - 12 unannotated rules in `legacy-components.css:17-78`.
  - Dead test utils `mockMediaState` and `renderMediaTab`.
- Expected behavior: a clean scan.
- Current behavior: CODE: `work-DQ/ssot-scan.txt`
- Figma status: n/a
- Code status: as cited
- Integration impact: none
- Probable root cause: n/a
- Dependencies: none
- Recommended next action: add annotations or delete.
- Evidence: CODE-ONLY

### DQ-032 Residual `any` / `@ts-ignore` in drag and AI paths
- Module / Screen-location / Feature: Canvas drag, overlays, AI client, activity list
- Labels: CODE ONLY ISSUE
- Category: Nice-to-have enhancement
- Type: Code Quality
- Severity: Low
- Problem: CLAUDE.md bans `any`. Real uses:
  - `useDropTargetResolver.ts:29-38` (5 setters typed `any`)
  - `CanvasOverlayGroup.tsx:117-118`
  - `useComposerInit.ts:191` (`componentSchema.mutate as any`, which removes tRPC type safety on an AI call)
  - `ActivityView.tsx:97` (`useRef<any>`) and `:15` (`@ts-ignore` for react-window)
  - `EventEmitter`/`events.ts` handler `any[]`
- Expected behavior: typed.
- Current behavior: CODE: as cited
- Figma status: n/a
- Code status: as cited
- Integration impact: the drag path's drop-position shape is unchecked.
- Probable root cause: n/a
- Dependencies: none
- Recommended next action: type the drop-position state.
- Evidence: CODE-ONLY

### DQ-033 Inline style objects still widespread (345 literal + 109 hoisted)
- Module / Screen-location / Feature: Chrome
- Labels: CODE ONLY ISSUE
- Category: Nice-to-have enhancement
- Type: Code Quality / Design
- Severity: Low
- Problem: packages/editor/CLAUDE.md says "NO inline style objects except dynamic computed values". The styling ratchet counts 345 inline literals and 109 hoisted. Examples: `DeviceFramePreview.tsx` hex styles, `AIPromptModal.tsx:157-178`, `PresetDetailPane.tsx:215` (`<strong style={{color: var(--bk-accent)}}>`, accent used as text emphasis), `LibraryManager.tsx:1003`.
- Expected behavior: `tw:` utilities.
- Current behavior: CODE: `gates/check-styling-ratchet.txt`
- Figma status: n/a
- Code status: as cited
- Integration impact: inline styles bypass the token gates.
- Probable root cause: ongoing drain.
- Dependencies: styling ratchet
- Recommended next action: keep draining and lower the baselines. The four axiom gates are all under baseline and could be locked tighter now.
- Evidence: CODE-ONLY

---

## What is clean (verified)

- 0 `flowbite-react` imports outside chrome-ui; barrel purity holds.
- 0 raw `<button>/<input>/<select>/<textarea>` in `editor/` (Gate 24).
- 0 TODO/FIXME; 0 unguarded `console.log`; tsc at 0 errors in both packages.
- Live typography is consistent: every sampled chrome text node is Inter or Geist Mono. The only exceptions are DQ-016 (serif) and the weight-700 cases in DQ-021. Font sizes sit on the ramp: 11, 12, 13, 14, 16, 20 and 24.
- Live colours: no off-token chrome colours outside user-data swatches; no purple or indigo seen live.
- 26 of 34 modal/dialog files already compose chrome-ui `ModalRoot`/`Portal`/`Popover`.

## Module verdict

| Module | UI | function | states | integrations | persistence | errors | journey complete? |
|---|---|---|---|---|---|---|---|
| Chrome DS consistency (all panels) | PARTIAL (DQ-015..028) | n/a | NOT CHECKED (toasts/empty states not triggered) | n/a | n/a | n/a | PARTIAL |
| Menus & overlays | PARTIAL (DQ-018/019) | VERIFIED (open/close) | PARTIAL | n/a | n/a | n/a | PARTIAL |
| Layers context actions | NOT CHECKED | BROKEN (DQ-002, code) | NOT CHECKED | PARTIAL | NOT CHECKED | NOT CHECKED | BROKEN (code) |
| Publish confirm gate | NOT CHECKED | BROKEN on fetch failure (DQ-001, code) | PARTIAL | PARTIAL | n/a | BROKEN | PARTIAL |
| Engine event seams / error surfacing | n/a | PARTIAL (DQ-003/005) | n/a | PARTIAL | n/a | BROKEN (DQ-005) | PARTIAL |
| History restore | NOT CHECKED | PARTIAL (DQ-011) | NOT CHECKED | NOT CHECKED | PARTIAL | BROKEN (swallow) | PARTIAL |
| Code-structure rules (imports, size, dead code) | n/a | n/a | n/a | n/a | n/a | n/a | PARTIAL (DQ-006..009, 012..014, 029..033) |

**Counts:** 33 issues: Critical 0 · High 0 · Medium 9 (DQ-001, 002, 005, 006, 007, 010, 011, 018, 020; DQ-002 becomes High if Layers is reachable in view mode) · Low 24.

# Design 2L9 · Lane L-D · Brand / design system — sub-plan

> Lane of `docs/superpowers/plans/2026-10-22-implement-2l9-design.md` (Phase 2). Header, Global
> Constraints, Review Focus and the manifest schema are that plan's; this file adds only what
> L-D decides. Later accepted-obligation lists in the master plan win over this file.

**Goal:** Brand rows (`family: "brand"`, page 05, boards `B6-B01…B62`) plus the four
"‹ Back to Site settings" boards on page 06 (`277:27516`, `277:107722`, `277:107940`,
`278:67847`) are done by the census predicate, and Brand renders no panel undo control.

**Owns:** `packages/editor/src/editor/design-system/` only. Server change only where a row needs
it, through the full chain (shared Zod schema → service → router → client) with tests.

**Inputs:** inventory `packages/editor/docs/design-2l9/inventory/05-resources.md` §Brand and
`05-resources.json`; board copy from the local dump (`docs/design-2l9/dump/page-3-6.json`,
`page-3-7.json`). Zero Figma calls planned.

## Lane rules (from the brief, binding)

- **One undo.** No Undo/Redo control inside Brand. A receipt toast may carry "Undo" only if its
  action is `composer.history.undo()` (the one stack). The four GAP-ST boards draw `Undo | Redo`
  in the Brand header: not adopted, `authority: founder:one-undo` on that element (row note).
- **"From logo or URL"** stays behind `dsAi` (`isFeatureEnabled("dsAi")`): rows B32–B38 carry
  `authority: code:dsai-flag` for the gate; their copy/visuals still follow the board when on.
- **"✦ Generate with AI"** (Styles / Component styles header + `AIPromptModal`) is not touched:
  `blocked:pr33-ai-removal` (PR #33 deletes it).
- Brand site-builder tokens (`editor/design-system/`) are never regenerated from Figma.
- Board sample data ("Fieldwork Studio", "#0D736B", "42 places") is never copied; counts and
  names come from the registries.
- US spelling on screen follows the board ("Colors", "Dark mode"); token ids are unchanged.

## Archetypes, in order (Play journeys first, then the largest drift clusters)

No Play journey (F1–F6) walks Brand directly; F1/F2 reach it only through the inspector chip
(B31, deferred below). Order is therefore by drift-cluster size.

| # | Slice | Rows | Files | Failing tests first | Board copy adopted |
|---|---|---|---|---|---|
| S1 | **Workspace shell** — grouped nav, back door, header | shell of all 62; closes the settings-return archetype (4) | `ui/BrandWorkspace.tsx`, `ui/brandOpenRequest.ts` | `BrandWorkspace.shell.test.tsx` › nav groups Tokens/Reusable styles/Tools; back link reads "‹ Back to Editor · {page}"; "‹ Back to Site settings" when the opener asked for it and its click reopens Settings at the screen it came from; header strap "Changes apply as you edit — undo any time"; titles "Colors · {n}" / "Checks · {n}"; no Undo/Redo button in the workspace | Nav: Tokens (Colors, Typography, Spacing, Other kinds ›) · Reusable styles (Type styles · Presets, Classes) · Tools (Dark mode, Checks · N, Starters, Import / export). "+ Add color", "Generate scale", "Restore points ▾" |
| S2 | **Other kinds** — index page and kind pages | B23, B24, B54 | `ui/BrandWorkspace.tsx`, `ui/tokens/KindTokenList.tsx` | index lists 11 kinds with one-line descriptions; kind page has "‹ Other kinds" and "+ Add {kind}"; Spacing header has no kind Select | "Each kind has its own page. Values use that kind’s validator." + 11 descriptions |
| S3 | **Spacing** — segmented presets | B22 | `ui/BrandWorkspace.tsx` | Compact/Normal/Spacious segmented (aria-pressed), Reset to defaults, note line | "Spacing steps can be changed but not renamed or deleted." |
| S4 | **Type styles · Presets** — one catalogue | B26 | `ui/BrandWorkspace.tsx`, `ui/sections/ReusableStylesSection.tsx` | one page shows Type styles + Presets + "Browse section blocks in Add ›" | "Read-only catalogue · built from Typography tokens", "Read-only catalogue" |
| S5 | **Receipts** — one shared Undo | B10, B20, B37, B40, B49 (receipt only) | `ui/BrandWorkspace.tsx`, `ui/sections/*` callers | toast action "Undo" calls `composer.history.undo()` once | "Connected {n} color usages…", "Restored “{point}”…", "Imported {n} tokens. One Undo reverts the import." |
| S6 | **Starters** — preview, restore point, apply | B07–B11 | `ui/sections/StartersSection.tsx`, `state/useApplyStarter.ts`, `state/useBrandRestorePoints.ts`, `packages/shared/schemas/theme.ts` (+ `"starter"` reason, router test) | row opens a preview (no write); Apply takes a restore point then one write; failed point → nothing applied + Retry; "From logo or URL ›" row (dsAi) | "Choose a starting point", "Preview only · Your Brand is unchanged", "Apply starter", "Preparing…", "Couldn’t create a restore point. Nothing was applied. Retry or cancel the preview.", "Applied {name}. Restore point created." |
| S7 | **From logo or URL** copy + offline | B32–B35, B38 | `ui/sections/BrandFromSource.tsx` | refused / timeout / reading / offline copy | board strings for each state |
| S8 | **Copy cluster** | B04, B25, B28, B29, B41, B46, B59, B61 | `ui/colors/ColorPicker.tsx`, `ui/sections/TokenDetailView.tsx`, `TokenDeleteDialog.tsx`, `SessionEditsPopover.tsx`, `ColorModeToggle.tsx`, `ColorTokenList.tsx`, `shared/constants/brandReadOnly.ts` (read-only copy; shared const used only by Brand) | each string asserted | board strings |
| S9 | **Offline banner** | B43 (+ B38 restore-points line) | `ui/BrandWorkspace.tsx` | `navigator.onLine=false` → banner; Restore points disabled with "Restore points need a connection" | "You’re offline. Token edits still apply here and save when you reconnect. Restore points and reading a website need a connection." |
| S10 | **Compact 1280** | B51–B53 | `ui/BrandWorkspace.tsx` | below 1440 wide: nav collapses behind "Brand navigation", preview behind "Show website preview" / "Hide website preview" | board labels |

Stop after ~10 archetype commits and report (brief). Everything below is the next dispatch.

## Deferred (next dispatch, still `drift-open` / `no`)

- Token edit as a "‹ Colors" drill-in with reach note, Light/Dark pickers and "Token actions ▾"
  (B02, B03, B06, B30), and the Colors list as cards with "Edit ›" (B01 body).
- "‹ Back to Heading" return from the inspector chip (B31) — needs the inspector to pass the
  origin; request to L-B when started.
- Dark mode paired-value page + "Turn on automatic dark mode?" (B12–B14).
- Import / export split, dry-run breakdown, local-recovery confirm, applied card (B15–B17, B48, B49 body).
- Checks: Ignore on the finding, "Show ignored · N", "Unconnected color" row (B18); Connect sheet (B19).
- Restore points as a popover (B39); Discard-preview confirm (B50); inline rename (B55);
  Generate scale copy/structure (B60); "Result from …" preview rows (B36).
- Brand loading / failed to load / offline first load (B42, B56, B57): the states live where
  the workspace mounts (`sidebar/FullPageRouter.tsx`, not L-D) — request filed.

## Rows closed by authority (no build)

| Rows | Authority | Why |
|---|---|---|
| B05, B45, B58 (leave guards) | `code:autosave-no-leave-guard` | Brand Part 1a spec §4: every edit is a composer write persisted by project autosave; leaving Brand is in-app navigation that discards nothing (the boards say so themselves). Save failure/pending lives in the bottom-bar status (Phase 1). |
| B44 (save failed, retry in status) | `code:save-status-in-bottom-bar` | Board draws no Brand-specific UI; the status and Retry are the shell's (Task 1.6/1.2). |
| B62 (Undo tooltip names the last action) | `code:topbar-undo-is-lead` | Topbar Undo tooltip is Task 1.2's control, outside L-D; recorded for the lead. |
| B47 | `blocked:first-run-out-of-scope` (unchanged) | |
| B27 | `blocked:owner-class-first` (unchanged) | |
| B32–B38 | `code:dsai-flag` (gate only) | copy still conformed in S7 |

## Code-ahead dispositions

| Capability | Disposition |
|---|---|
| `✦ Generate with AI` + `AIPromptModal` | `blocked:pr33-ai-removal`; kept as-is on the Type styles · Presets header until PR #33 deletes it |
| Component styles page (opens Add › Blocks) | kept as the catalogue row "Browse section blocks in Add ›" (S4) |
| Presets page (`StylesSection`) | kept inside Type styles · Presets (S4) |
| Connect to tokens button on Colors | kept at Checks (`LintSection` Connect door, B19's entry); the Colors action row keeps only the board's two actions |
| Spacing ⋯ preset menu | kept as the segmented control + Reset (S3) — same three writes |
| Kind switch Select in Spacing header | replaced by the Other kinds index (S2); every kind keeps its page |
| Page captions (fonts count, ignored checks) | counts move to titles ("Colors · 4", "Checks · 2"); ignored count → "Show ignored · N" (deferred, B18) |
| Dark-strategy menu, Tokens Studio / Figma Variables / Tailwind import detection | kept in Import / export |
| Restore points page | kept until B39's popover lands |

## Requests (to `packages/editor/docs/design-2l9/REQUESTS.md`)

- **L-D → lead · `sidebar/FullPageRouter.tsx:186-200`** — mount Brand in the resource area
  (topbar, rail and bottom bar visible, board B6-B01 boxes: Topbar 0–56, Workspace 56–868,
  BottomBar 868–900) instead of `fixed inset-0`; add the Brand loading / failed / offline-first-load
  states (B42/B56/B57) there.
- **L-D → L-E · `sidebar/tabs/settings/SettingsTab.tsx:378`** — before `onOpenDesignTab()`, call
  `requestBrandReturn(composer, { screen: currentScreen })` from `@/editor/design-system/ui/brandOpenRequest`
  so Brand shows "‹ Back to Site settings" (GAP-ST-T03/T04/T05/LB).

## Verification

Per slice: targeted vitest; before each commit batch `npx tsc --noEmit > /tmp/tsc-d.log; echo $?`
= 0 and `pnpm run verify:ds` (cwd `packages/editor`). No board screenshots exist in the dump, so
rows stay `drift-open` with "built, not compared" unless compared live by the lead; probe pins
(port 5174) only for new visual states.

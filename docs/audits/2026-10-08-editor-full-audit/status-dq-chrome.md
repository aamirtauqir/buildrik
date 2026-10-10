# DQ-CHROME status — DQ-015…028, DQ-033

Branch `fix/audit-dq-chrome` from main `df60cf9ec`. Lane: the chrome / design-system
rows of the DQ module (`phase2-live/DQ.md`). DQ-001…014 and 029…032 are the
dq-code lane's.

Precedence followed: anything visual goes to the Figma board where one exists
(Editor v3 page, file `g4GzQFqzNYz5sosz1QtZXC`, read through
`scripts/baseline/figma-mcp.mjs`, 15 read calls, no writes). Where no board
exists, DESIGN.md applies. Two rows (DQ-015, DQ-026) are cases where the board
disagrees with DESIGN.md. The code follows the board, and the board needs a
designer's decision.

Live checks ran on this worktree's dev server (`localhost:3620`, qa@buildrik.local,
1440×900, `sites.publish` route-aborted) against one throwaway blank site, which was
deleted afterwards. Values come from `getComputedStyle` / `getBoundingClientRect`.
Screenshots are in the session scratchpad (`dq-chrome/`), outside the repo.

Status values: FIXED · PARTLY-FIXED · DECISION · ALREADY-FIXED.

| ID | Status | Commit | Evidence |
|---|---|---|---|
| DQ-015 | DECISION (board) | — | Board 7993:198599 (Inspector v4 · 01) draws the "Margin"/"Padding" ring labels in **Geist Mono Regular 12** (`get_design_context` 8092:211002). Live they compute `"Geist Mono"` 12/500. The code matches the board. DESIGN.md says panel labels are Inter 11/500, so the board conflicts with DESIGN.md. This needs a designer's call; no code change was made. |
| DQ-016 | FIXED | `d99ac5a32` | The Add panel rows no longer draw the 59 inline SVG fragments. Each row takes `getElementIcon(blockId)`, the lucide map that Layers and the Inspector use; new block ids were added to it. Live: the Heading row is a lucide `svg.lucide` with no `<text>` child, so no serif and no weight 700. Test: `BuildTab.test.tsx` "draws lucide glyphs, never a `<text>` glyph". |
| DQ-017 | FIXED (ratchet) | `200a6b585` | Deleted the dead `history/icons.tsx` (8 SVGs, no importer). The footer undo/redo were lucide paths copied inline at 15px; they are now lucide at 16. Off-scale lucide sizes snapped to 12/14/20. The inspector stepper (8) and link-sides glyph (11) were set to the 10 and 12 that board 8031:206288 / 7993:198919 draw. Stroke overrides were removed. New ratchets: `offscale-icon-size` 3 (three inspector glyphs not yet read against a board), `inline-svg` 50, `icon-stroke-override` 0. |
| DQ-018 | PARTLY-FIXED | `3aaf24f47` | The canvas element menu (its own activedescendant model, MenuItem, Submenu, MenuIcon) and the Layers menu now compose chrome-ui `Menu`/`MenuItem`. The canvas file keeps only the submenu contract. Live: canvas rows 30px 13/400 Inter, radius 0, card radius 8 / 6px padding (board 4428:43928); focus starts on the first row; three ↓ presses land on Arrange; → opens it with focus on "Bring to front"; Esc closes only the submenu, a second Esc closes the menu. Layers rows 28px with 12px inset (board 4418:79546); ↓ moves focus with the subtle fill. Row specs still differ between menus because each board draws a different one (28 / 30 / 32); unifying them is a board decision. Not migrated: the Media asset menu, because its view-only rows must stay focusable (G3-064) and `Menu`'s roving focus skips `aria-disabled` rows. |
| DQ-019 | PARTLY-FIXED | `15345cbcc` | `useFocusTrap` now ignores dialogs that are mounted but closed when it picks the topmost one, with a test. `AssetDetailOverlay` dropped its private trap for it. The command palette and Page settings mount in `#bk-overlay-root` through `Portal` and use the trap. Live: palette `inOverlayRoot: true`, focus in the input, 40 Tabs stay inside, Esc closes. Page settings `inOverlayRoot: true`, focus inside, Esc closes. Both keep their board backdrops: the palette has no dim per 4418:141220, so `OverlayMount` is not used. AgentPlan no longer declares a dialog (ALREADY-FIXED). ReplaceAcrossDialog and AchievementPrompt already used `useFocusTrap`. NotificationPanel and LayerDisplaySettings are non-modal popovers whose triggers live in other components; they were left as they are. The Media drill-in was not walked live because the throwaway site's library was empty; unit tests cover it. |
| DQ-020 | PARTLY-FIXED | `8a565c73d` | Four 16px targets are now 20px (DESIGN.md A1.4) with −2px margins, so the layout does not move. Live: Brand "Back to canvas" 107×20 with the nav head still at y 36; Layers chevrons 20×20 with rows still 28; palette "Esc Close" 51×20 with the legend still 32; the token-detail Ignore/Auto-fix links got the same class (not reached live: it needs a lint issue). Not done: a default `Button` size (owner decision PD-31; 223 unsized buttons are report-only); button heights that differ per board (Pages add 24 vs Brand add 28); the 16px spacing inputs (owner exception 2026-09-28). |
| DQ-021 | FIXED | `53e252b92`, `728d2655c` | A `components`-layer rule in `chrome-reset.css` caps `strong`/`b` at `--bk-weight-semibold` in the shell and the overlay root. In the `reset` layer it lost to the dashboard preflight's `base` layer; this was measured live (still 700 with the rule loaded) before the rule moved. Live after: Brand "No brand set." computes 600. Also fixed: the Canvas.css clone badge and the rich-text B glyph. `font-weight-700` now also catches `"bold"`/800/900. New ratchet `css-font-weight-700` = 0. |
| DQ-022 | FIXED | `3363bc147` | Removed `#667eea` and its rgba from `Canvas.css`. The accent is used with no fallback, washes use `color-mix` from the accent, the focus halo uses `--bk-shadow-focus`, and the lock outline is a dotted `--bk-ink-muted`. Locked + selected takes the accent ring that board 7995:205108 draws. Live: an inline edit computes outline `rgb(26,86,219)` with a 5% accent wash; a locked heading computes dotted `rgb(108,112,121)` (`#6C7079`). Gate 18 now bans `#667EEA`, `#764BA2` and `rgba(102,126,234,…)`. |
| DQ-023 | PARTLY-FIXED | `d4965809a` (+ `3363bc147`) | Tokenised: the Pages live/scheduled chips (success/warning triads), the device-frame toggle, the smart-guide red (`--bk-error`) and the image placeholder slab. Gate 16 went 61 → 29 and Gate 10 94 → 44. Kept on a recorded basis: the time-travel Restore (board 4418:74736 draws `#111827`, checked via node 7435:147847), the export code preview's One-Dark theme and the canvas hover badge (both `@lint-hex-policy`). Whether the code-preview dark surface is a sanctioned exception is an owner decision. |
| DQ-024 | FIXED | `eb5c59f67` | `--bk-bg-overlay`, `--bk-ink-inverse` and `--bk-bg-active` now resolve to real tokens with the same pixels. `--bk-warning-ink` became `--bk-warning-text`. The slider fill moved out of the generated namespace (`--slider-fill`). The token-resolution gate now sees quoted and cast style-object keys (`--drawer-w`, `--mgr-cols`) and fails on any fallback-only ref; it was 0, and a planted ref was confirmed to fail. |
| DQ-025 | FIXED | `9a107ab60` | The mono token is now `"Geist Mono", monospace`: hand-authored in `figma-tokens.json` and regenerated, with DESIGN.md:139 updated to match. `tw.css` points `--font-mono` at the token. The canvas overlays' bare `monospace`, three DS fallback stacks and `Fira Code` all use `var(--bk-font-mono)`. The e2e probe baselines were updated. New ratchets `named-mono-fallback` (TSX + CSS) = 0. |
| DQ-026 | DECISION (board) | — | Board 7054:78348 draws `💡  Tip 1/4` (node 7054:78352, Inter Semi Bold 12) and the code matches it. DESIGN.md anti-slop rule 6 bans emoji. Fix the board first, then the code; no code change was made. |
| DQ-027 | FIXED (doc) | `6fb31dc0f` | Every non-44 header is what its board draws: CMS "Collection header" 1100×56 (4428:143182); Brand's workspace page (7315:80955); Inspector v4 at 72 (7993:198599). DESIGN.md §Layout now names the three variants. A new surface uses `PanelHeader` unless its board draws one of them. |
| DQ-028 | FIXED | `4cbe53819` | Checked against the boards first. The level chips and colour swatch are 3px and the spacing content chip 2px on Inspector v4, and stay (the computed 5px on the chips is a 2px transparent border, so the drawn corner is 3px). Snapped: the spacing-input hover frame 2 → `--bk-radius-sm`, the Layers glyph box (radius removed) and the setup chip 12px on 24px → `rounded-full`. The cmdk 12px is the modal radius DESIGN.md allows. New ratchets `offscale-radius` 47 / `css-offscale-radius` 32. Gate 13 baseline 97 → 37. |
| DQ-033 | PARTLY-FIXED (ratchet locked) | see row note | 38 inline literals drained: 27 static `style={{…}}` on plain elements converted mechanically to `tw:` classes, plus the two `<strong style>` cases the audit names, plus those removed with the canvas menu rewrite. `inline_literal` 345 → 307, `inline_hoisted` 101. `.styling-baseline.json` is re-locked at the current counts (including per-file CSS), and chrome-axiom Gates 11/12/14 are locked at 34/49/138. The remaining inline styles are mostly computed geometry in canvas overlays, the component-themed device frame, and hoisted objects that need per-file review. |

## Gates (end of lane, HEAD `6252314dc`; `git merge main` = already up to date, main `df60cf9ec`)

- `verify:ds` exit 0. That includes editor tsc 0 and dashboard tsc 0 (tsc gate), ds-grep (14 gates
  + Gates 11–14 at their new baselines + green-panel), token-resolution 0 warns,
  styling ratchet, design-debt ratchet and chrome-ui surface.
- Full editor vitest (`--maxWorkers=2`): 1347 files and 13 337 tests passed, 22 todo, 0
  failures. The `[buildrick gate] FAIL` lines in its log come from the gate's own planted-violation
  tests, which pass.

## Live re-check after the machine reboot (2026-10-10, second throwaway site, deleted)

The per-row measurements in the table above were taken before the reboot. The reboot
wiped the screenshots, so the key surfaces were re-shot and re-measured on `:3620` at 1440×900:
- Canvas context menu: row 30px, 13px/400, focus on the first row.
- Brand: "No brand set." `strong` computes 600; "Back to canvas" is 20px tall.
- DQ-023 Pages chips (CSS checked on an injected element with PagesTab.css loaded):
  live `rgb(222,247,236)`/`rgb(5,122,85)` = success tint/text; scheduled
  `rgb(253,253,234)`/`rgb(114,59,19)` = warning tint/text.
- DQ-024 (LibraryManager.css loaded): the kind chip is ink at 50% on white; the upload
  track is `rgb(229,231,235)`; the slider gradient resolves `--slider-fill` (40%)
  to accent → border.
- Not re-walked: the Media drill-in, because the throwaway site's asset library was
  empty (the unit tests cover it), and the token-detail Ignore link, which needs a lint issue.

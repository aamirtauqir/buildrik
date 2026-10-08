# 03 · Brand — UX / IA audit (2026-09-27)

`E/` = `packages/editor/src/editor/`. Overall **4.1/10** (10 lenses; collab n/a). 4 P0 incl. confirmed R1.
Scratch site restored afterwards (fresh load: "No brand set", `color-text #334155`, inserted buttons deleted).

## 1. Module map

| Part | What | Code |
|---|---|---|
| Rail "Brand" (tab `design`, key B) | Full page since 2026-09-22 (OD-1) | `E/rail/tabsConfig.ts:143-156` |
| Host | Portal `fixed inset-0`; covers topbar, rail, canvas, inspector | `E/sidebar/FullPageRouter.tsx:185-201` |
| Workspace | 256px nav + 620px pane + 468px preview | `E/design-system/ui/BrandWorkspace.tsx` (1,319 lines) |
| Nav (11 rows) | Colours · Colour mode · Fonts & type styles · Styles · Component styles · Classes · Presets · Brand checks · Starters · Spacing · Import/export | `BrandWorkspace.tsx:121-133` |
| Hidden kinds (11) | Radius, Shadow, Motion, Border, Opacity, Z-index, Breakpoint, Grid, Sizing, Icon, Imagery — only via "Token kind" dropdown on Spacing | `:140-152`, `:837-858` |
| Commit | Picker Apply → footer Save → ReviewModal "Apply N changes" → `setProjectSettings` | `BrandWorkspace.tsx:487-548` |
| Canvas binding | `ProjectTokensApplier` writes `:root` vars; registries write vars on every staged edit | `ui/ProjectTokensApplier.tsx:33-51`; `state/useTokenBase.ts:145` |
| Preview | iframe of `exportHTML` + staged `:root` block | `ui/BrandLivePreview.tsx` |
| Starters (6) | Buildrik Default, Stripe Blue, Notion Warm, Apple Minimal, Linear Dark, Vercel Mono | `starters/*.ts`, `state/useApplyStarter.ts` |
| DS AI | "✦ Generate with AI" on Styles / Component styles; disabled (flag off); no `onAccept` even with flag on | `BrandWorkspace.tsx:786-813, 1291-1302` |
| Doors | Rail, B, ⌘K "Open Brand", Settings "Brand ↗", Inspector "Applies to › Whole site", Issues, bound-token chip, onboarding | various |
| Inspector side | `ColorInput` → `ColorFillPopover` (brand swatches; Edit token → "Update everywhere"/"Only this element"), `DSBindingChip` | `inspector/shared/controls/ColorInput.tsx`, `inspector/shared/ColorFillPopover.tsx` |
| Font sources | Brand › Fonts; Assets Site fonts modal; Inspector Family picker | `FontPicker.tsx:42`; `SiteFontsModal.tsx:97` |

## 2. Scorecard (0–10)

| # | Lens | Score | Why |
|---|---|---|---|
| 1 | Cohesion | 4 | Tokens, presets, CSS classes, a block list, checks, AI, import/export in one flat nav |
| 2 | Misfit | 4 | Component styles = Add blocks list; Classes = element CSS; Colour mode = editor pref; "+ Add a font" opens Assets |
| 3 | Duplicate doors | 4 | Type styles ×2 pages, presets ×2, fonts ×3, colour editing ×2 with 2 save models, 4 duplicate colours |
| 4 | Scope leakage | 5 | Inspector "Update everywhere" saves site-wide instantly; Light/Dark looks like a site setting |
| 5 | Discoverability | 6 | Many doors, but ⌘K "font"/"colour"/"token" all land on Colours; radius buried under Spacing |
| 6 | Information scent | 3 | Brand / Styles / Component styles / Presets / Classes / Tokens; raw ids; "Linear Dark" is light |
| 7 | Bloat | 3 | 22 destinations; Z-index, Breakpoint, Grid, Imagery tokens; Tailwind export |
| 8 | Surface | 4 | Full page hides canvas; thumbnail preview wrong |
| 9 | Navigation | 5 | Flat nav + hidden 2nd level; Settings → Brand → Back lands on canvas; Component styles ejects you |
| 11 | Cognitive load | 3 | 18 colours (4 duplicated), 3 save verbs, double leave-prompt, 8 noise checks, "unused" everywhere |

## 3. Findings

| ID | Lens | Sev | Finding | Evidence | Prior |
|---|---|---|---|---|---|
| BRD-01 | 8, 11 | **P0** | **Inspector token picker renders behind the canvas.** Popover inside inspector layer (`absolute z-40` in an `<aside>` at `z-index:20`), positioned over the canvas. Invisible → binding from Inspector unreachable. Data path works (scripted click bound `var(--buildrick-design-color-primary)`). | `chrome-ui/Popover.tsx:40,55-56,91`; `ColorInput.tsx:157-163`. Measured: popover rect 858,483 (264×323); `elementFromPoint` ×3 hit canvas H2/H2/P. 47b, 52 | NEW |
| BRD-02 | 4, 11 | **P0** | **Starter replaces all colour, type and spacing lists.** Starters = 9 colours, 0 type, 0 spacing. Removals uncounted → review says "9 changes". After: Fonts "No fonts set", Spacing "No spacing tokens yet". | `useApplyStarter.ts:63-65`; `useTokenBase.ts:139-148`; `useColorTokens.ts:235-238`. run13; 64, 65, 67 | NEW |
| BRD-03 | 8 | **P0** | **Brand edits can't be seen.** Full page hides canvas; preview doesn't update on staging. Measured `color-text` staged `#B91C1C`: canvas h2 `rgb(185,28,28)`, preview `rgb(0,0,0)` until "Apply 1 change". | `FullPageRouter.tsx:185-201`; run3; 23–25 | CHANGED (worse) |
| BRD-04 | 8 | P1 | Preview doesn't match canvas even before edits (preview headings black, button browser-grey; canvas `rgb(51,65,85)`). | `BrandLivePreview.tsx`; run2 | NEW |
| BRD-05 | 2, 11 | **P0** (known R1) | **Canvas defaults are hex, not tokens.** Button from Add keeps `rgb(26,86,219)` when Primary → `#B91C1C`. | `shared/constants/defaultStyles.ts:18,227,238,362`; `blocks/blockRegistry.ts:339-353`; plan `2026-10-01-brand-token-binding.md`. run5; 40, 41 | STILL TRUE |
| BRD-06 | 6, 11 | P1 | "Used by 0 / unused" on every token, incl. `color-text` which paints every heading. Only explicit `var()` counted. | 02, 23; run3 | NEW |
| BRD-07 | 11, 8 | P1 | Three commits, three verbs (picker Apply → Save → Apply 1 change); first "Apply" only stages. | `ColorPicker.tsx`; `DesignTabFooter.tsx:20`; `ReviewModal.tsx:263` | CHANGED |
| BRD-08 | 11 | P1 | **Leaving Brand asks twice** — Discard closes; shell guard still sees dirty → stale second dialog. | `BrandWorkspace.tsx:606-612, 371-376`; `shell/hooks/useTabSwitchGuard.ts:62-73`; 75 → 76 | REGRESSION from B-1 |
| BRD-09 | 3, 6, 7 | P1 | Overlapping pages: Styles = type styles + presets; Presets repeats presets; Component styles = Add blocks; Classes = element CSS. File header says Styles isn't a nav row — it is. | `BrandWorkspace.tsx:22-28` vs `:121-133` | CHANGED (nav 9 → 11) |
| BRD-10 | 2, 9 | P1 | "Component styles" rows say "Default appearance" but leave Brand for Add › Blocks. | `BrandWorkspace.tsx:614-622`; 66 | CHANGED (A02-8/FC-5) |
| BRD-11 | 6, 9 | P1 | 11 token kinds hide in a dropdown on Spacing; nav keeps "Spacing" lit. | `BrandWorkspace.tsx:837-858, 998-1001`; 12 | NEW |
| BRD-12 | 3, 11 | P1 | Duplicate colour tokens: action = primary = brand-500 = `#1A56DB` (same for surface, text, error). All 18 in Colours + Inspector swatches. Editing Primary doesn't move Action. | 02; run6 | NEW |
| BRD-13 | 11 | P2 | Fresh site shows "8 issues", all "No dark variant" on duplicate tokens. | 10 | STILL TRUE (B-14) |
| BRD-14 | 3, 4 | P1 | Inspector "Update everywhere" saves instantly; Brand requires Save + review. Two save models, one token. | `useUpdateColorEverywhere.ts:27-44`; `ColorFillPopover.tsx:127-134` (code) | NEW |
| BRD-15 | 2, 3 | P1 | Fonts in 3 places: Brand › Change offers only Inter, Geist Mono, uploads; "All fonts ›" = native dropdown + free-text; "+ Add a font" → Assets modal; Inspector Family picker. | `BrandFontPopover.tsx`; `FontPicker.tsx:42-44`; `SiteFontsModal.tsx:97`; 61, 61b | NEW |
| BRD-16 | 6 | P2 | Starters change colours only; "Linear Dark" is light; third-party brand names; Stripe Blue / Linear Dark have indigo primaries (banned accent family). | `starters/*.ts`; 11 | NEW |
| BRD-17 | 4, 6 | P2 | Colour mode Light/Dark is editor-only but reads as a site setting; published site ships light only. | `ColorModeToggle.tsx`; 04 | NEW |
| BRD-18 | 9 | P2 | Settings → Brand ↗ → Back lands on canvas. | `SettingsTab.tsx:292-293`; 72 | STILL TRUE |
| BRD-19 | 5 | P2 | ⌘K "font"/"colour"/"token" → one "Open Brand" on Colours; no deep link. | `CommandPalette.tsx:127`; 70 | NEW |
| BRD-20 | 7 | P2 | "Generate with AI" visible but dead (flag off; no `onAccept`). | `BrandWorkspace.tsx:786-813, 1291-1302` | STILL TRUE |
| BRD-21 | 6, 11 | P2 | Developer wording (raw ids, "Dark strategy: media-query", "Tailwind … 10 dropped", "4 alias edges"); Brand forces Pro. | `BrandWorkspace.tsx:1313-1317`; `ExportSection.tsx` | CHANGED (FC-13) |
| BRD-22 | 1 | P2 | Import/export is a top-level nav row. | `BrandWorkspace.tsx:981-988` | STILL TRUE (A09-15) |

## 4. Flow map (steps from canvas, nothing open)

| Task | Steps | Surfaces | Traps |
|---|---|---|---|
| (a) Set primary colour | 8 — Brand; pick `color-primary` of 18 (not `color-action`); Change; hex; picker Apply (stages); Save; Apply 1 change; Back | workspace, picker, review | hidden canvas, hex defaults, "unused" |
| (b) Set fonts | 7–10 — Brand; Fonts & type styles; Heading row; Change (3 fonts); "All fonts ›"; pick; Save; Apply; Back | workspace, popover / native dropdown, Site fonts modal | two pickers, free-text; Starter later wipes it |
| (c) Apply a starter | 5–6 — Brand; Starters; click (stages, no preview); Save; Apply 9 changes; Back | workspace, review | wipes fonts + spacing |
| (d) See on canvas | impossible inside Brand; +3 to leave | — | preview wrong; Add elements stay hex |
| (e) Bind element to token | 3 → **stuck** (popover invisible) | inspector | BRD-01 |
| (f) Undo / revert | staged: Discard + toast Undo / "Discard all" / leave-guard (double prompt); saved: ⌘Z on canvas undoes the whole apply as one step (measured, works, but not visible from inside Brand) | footer, toast, 2 dialogs, ⌘Z | BRD-08 |

## 5. Simple target flow (Figma local styles / variables model)

1. Brand = **panel beside a visible canvas**; edits repaint the real canvas live; thumbnail preview goes.
2. **Four sections**: Colours · Fonts · Shape & space (spacing + radius + shadow) · Styles (text styles + presets). Checks = badges on rows; Starters = "Start from…" button; Import/export, Classes, exotic token kinds under "Advanced ⋯".
3. **~8 named colour slots** (Primary, Secondary, Accent, Background, Surface, Text, Muted, Border) + status colours; aliases/primitives hidden; ids on hover.
4. **Autosave + ⌘Z** (canvas model); optional non-blocking "Review changes"; Inspector "Update everywhere" uses the same path.
5. **Everything inserts token-bound** (plan T1–T4); "Used by" counts site CSS too.
6. **Inspector picker**: slots on top, then Custom; picking binds; chip jumps to token; popover in overlay root above canvas.
7. **Starters = whole themes** (colours, fonts, radius), previewed live; replace only what they define; list removals.

Targets: (a) 3 · (b) 3 · (c) 3 · (d) 0 · (e) 2 · (f) ⌘Z.

## 6. Prior-audit reconciliation

| Prior | Now |
|---|---|
| A01-1 / A-3 theme push wrote `projectStyles` | FIXED (server, code-read) `server/services/theme.service.ts:16-59` |
| A09-1 / A12-8 / B-1 exit guards ignored Brand | FIXED but prompts twice (BRD-08) |
| D-4 three token stores | FIXED (tokens on first paint) |
| A02-20 DS checks in three places | PARTIAL (`BrandWorkspace.tsx:249` runs its own) |
| A02-8 / FC-5 / PD-19 Components several homes | STILL TRUE; row now ejects to Add |
| A09-15 trim Brand root | WORSE (11 rows + 11 hidden kinds) |
| PD-35 / A04 Brand full page? | CHANGED — chosen; density fixed, visibility broken |
| FC-13 Beginner/Pro density only | CHANGED — Brand forces Pro |
| B-14 clean "no issues" state | STILL TRUE |
| Settings "Back" loses context | STILL TRUE |
| Import previews before applying (praised) | STILL TRUE |
| Brand vs Site Settings separated | STILL TRUE |
| Plan R1 | STILL TRUE (measured); R6 not walked |

## 7. Not verified
Font change repainting canvas (pick through "All fonts ›" not completed); starter data loss after Save + reload (draft
wipe measured, reload re-seed from code); chip deep link, Unlink/Relink, "Update everywhere" live (popover
unreachable); templates R6, published output, AI with flag on; ⌘Z inside Brand with staged edits. Only Home page of
one scratch site with no saved brand was walked.

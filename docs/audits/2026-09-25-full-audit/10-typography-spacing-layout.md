# 10: Typography, Spacing and Layout Consistency (Prompt 10)

**Agent:** C, Interaction & UX · **Date:** 2026-09-25 · **Mode:** read-only.

**Scope:** what the code actually sets for type, spacing and layout, measured against `DESIGN.md`. That covers:
- type: font family, weight, size, line-height and tracking;
- spacing: padding, gaps and the spacing scale;
- control geometry: button and field heights, row heights;
- surface geometry: panel, drawer and modal widths; headers, footers and palettes;
- collaboration identity markers: presence avatars, overflow chips, activity chips, comment pins.

**Surfaces covered:**
- editor chrome (`packages/editor/src/editor`, `src/shared`, `src/themes`);
- dashboard, auth and onboarding (`packages/dashboard/app`, `packages/dashboard/components`).

`server/`, `prisma/`, `packages/shared` and `lib/` were checked and hold no presentation code relevant to this concern.

**Out of scope:** colour, accent and hue (Prompt 11), states and feedback (Prompt 12), hit-target and contrast adequacy (Prompt 13), and dead code as such (Prompt 17). Where one of those showed up, it is listed under Overlaps.

**Path prefixes:**
- `E/` = `packages/editor/src/editor/`
- `ES/` = `packages/editor/src/` (for `shared/` and `themes/`)
- `D/` = `packages/dashboard/`

---

## Method & runtime status

**What I did:**
- Read the token sources: `ES/themes/tokens.generated.css`, `ES/themes/tw.css`, `D/app/globals.css`, `ES/themes/fonts.css` and `D/app/layout.tsx`.
- Read the sizing primitives: `E/chrome-ui/{Button,buttonTheme,typeRamp,Modal,ModalParts,PanelHeader,PanelFrame,RightPanel,Rail,Row,Presence,Icon,textInputTheme,CommandPalette}` and `D/components/dashboard/primitives/{modal,button}.tsx`.
- Grepped every chrome TSX, TS and CSS file for these spellings, excluding tests and stories:
  - font-size, weight and tracking;
  - spacing utilities;
  - height and width literals.
- Tallied the results with scripted counts. `<Button>` props were parsed per tag in Python, with brace depth tracked so that `=>` does not end a tag early.
- Read every file quoted below at the cited line.

**Commands run (all read-only):**

| Command | Result |
|---|---|
| `node scripts/check-design-debt-ratchet.mjs` (editor) | PASS: every population, including `offscale-font-size` and `offscale-css-font-size`, is at baseline 0 |
| `node scripts/check-styling-ratchet.mjs --top` | Ran; this listing does not decide pass or fail. The files with the most inline styles are `KeyboardCheatSheet` (18), `canvas/controls/CommandPalette` (15) and `ToolbarActionsSection` (15) |
| `node scripts/check-narrow-control-padding.mjs` | PASS (4 style objects) |
| `bash scripts/ds-grep-gates.sh` | 14 PASS plus 4 chrome-axiom gates under baseline. Gate 14 still counts **164** chrome layout literals |
| `pnpm exec vitest run` on 8 sizing tests (`PanelHeader`, `Modal`, `Presence`, `RowFamily`, `Button`, `SectionHeader`, `tabsConfig.width`, `PagesTab.rowHeight`) | **45/45 passed** |

**Nothing here is runtime verified.** No browser, no `getComputedStyle`, no screenshots. Every claim about a rendered pixel is inferred from the classes and theme in code, including:
- the Flowbite Button and Avatar size themes, read from `node_modules/.pnpm/flowbite-react@0.12.17…/dist/components/{Button,Avatar}/theme.js`;
- twMerge and cascade precedence;
- font fallback and synthesis.

Each finding repeats this in its Status line. The unit tests that passed pin the primitives' own classes. They do not prove what a consumer renders.

---

## Output table

| # | Pattern | Files | Current variants | Expected standard | Intentional? | Issue | Priority |
|---|---|---|---|---|---|---|---|
| 1 | Chrome button height | `E/chrome-ui/Button.tsx:40-47`, `buttonTheme.ts:17-42`, `Modal.tsx:28-42`, 853 `<Button>` tags | 28 (modal-foot descendant rule), 32 (`size="xs"`, 456 tags), 40 (Flowbite `md` default, up to 359 tags with no size and no height class), 36 and 40 (explicit `tw:h-9`/`tw:h-10`) | DS Button 9:102 = 28h, 12/6 inset (quoted in `Modal.tsx:33-39`); "Never 40" (DESIGN §Row Density) | No. Several files carry comments about fighting "flowbite's h-10" one by one | The wrapper has no size contract, so the default is the one size the DS rejects | **P2** |
| 2 | Command palette geometry | `E/canvas/controls/CommandPalette.tsx:268-282`, `E/shell/modals/CommandPalette.tsx:448,620`, `E/chrome-ui/CommandPalette.tsx:88-123` | 520 wide, r12, inline style, 11–12px rows · 560 (`w-140`), r12 (`rounded-xl`), 40px rows, 16/600 input · 640×420, r8, 40px rows (**0 product consumers**) | One palette geometry (Figma 166:2 = 640×420) | No | Three widths, two radii, two row heights; the conformant one is not mounted | **P2** |
| 3 | Modal width scale | `E/chrome-ui/Modal.tsx:44-48`, `ModalParts.tsx:26-40`, `D/components/dashboard/primitives/modal.tsx:14`, 15 dashboard consumers | Editor has two scales: 440/560/720 and 360/440/**500/520**/560/640/720/960. Dashboard takes any number: 384/400/420/440/448/460/480/512 | One quantised scale per surface | Partly (board-named sizes) | Dashboard delete-site 420 vs delete-workspace 448; rename 400 vs transfer 440. Editor 500 and 520 sit 20px apart | **P2** |
| 4 | Chrome font-size spelling | ~1,100 chrome sites | `text-[length:var(--bk-text-N)]` (211) · `tw:text-[Npx]` (~620) · inline `fontSize: N` (~260) · Tailwind named `tw:text-xs/sm/base/lg/xl/5xl` (134) | `--bk-text-*` tokens: "a Figma re-export moves everything at once" (`typeRamp.ts:6-7`) | No | Only ~20% of chrome text rides the token. The 5 type-role constants have 1 consumer file | **P2** |
| 5 | Uppercase caption voice | 59 TSX sites plus CSS; `SectionHeader.tsx:16`, `inspector.css:231-236`, `PanelHeader.tsx:115`, `ReviewModal.tsx:40`, `FeatureCard.tsx:228-234` | Tracking 0.04em/0.06em/0.07em/0.08em/0.5px/0.88px/0.3px; weight 500/600/700; size 11/12; ink muted or soft | DESIGN: 11/500 UPPERCASE ink-soft; `TYPE_SECTION_CAPTION_CLASS` | No | Same role, 7 trackings, 3 weights | P3 |
| 6 | Weight cap 600 | 7 chrome sites (A10-6) | 700 (`font-bold`, `fontWeight: 700`, `font-extrabold`) | "Weights cap at 600 — no 700 anywhere in chrome" | No | No gate checks weight | P3 |
| 7 | Off-scale chrome sizes that escape the gate | `SeoTab.tsx:120,153`, `TokenPickerPopover.tsx:232`, `ColorTokenList.tsx:392`, `AdvancedTab.tsx:119`, `SpacingLabels.tsx:24`, `ExportModal.tsx:390,430`, `FileField.tsx:115`, `SidebarFallbacks.tsx:22`, `KeyboardCheatSheet.tsx:249`, ModalTitle overrides | 10, 11.5, 16, 18, 20, 24, 32, 48px | 11/12/13/14/16/20/24 ramp | Some are glyph or emoji sizing | Ratchet regex misses quoted strings (`"10px"`, `"11.5px"`) and named Tailwind sizes | P3 |
| 8 | Row heights | `tokens.generated.css:123-127`, `E/chrome-ui/Row.tsx:55-66`, DESIGN §Row Density | "tall" row: token 64, `Row` 56, DESIGN 48. Dense: 28h with 11px (Row) vs 12px (DESIGN) | One number per role | Row comment says the board says 56 | Three sources disagree; `--bk-size-row-tall` has no consumer | P3 |
| 9 | Text-field height and radius | `E/chrome-ui/textInputTheme.ts:69-72`, `E/sidebar/tabs/pages/PagesTab.css:683-693` | Editor TextInput 32h/13px/r6; page-settings drawer 42h/14px/r8 | One chrome field; DESIGN radius "lg 8 … inputs" | Page drawer cites a board | Same field type, two geometries in two drawers | P3 |
| 10 | Shipped chrome vs the Figma layout primitives | `E/chrome-ui/Rail.tsx:20,45` vs `E/sidebar/LeftSidebar.css:42-54,105-111`; `RightPanel`, `TreeRow`, `NavItem`, `EditorShell`, `MediaCard`, `SiteCard` | Rail primitive items 44×44, py-8, gap-4 vs shipped `.ls-btn` 36×36, padding 6, gap 2; six primitives have 0 consumers | One geometry | Unclear | The primitives and the shipped surfaces encode different sizes | P3 |
| 11 | Shell dimension SSOT | `E/chrome-ui/Topbar.tsx:201`, `Rail.tsx:20`, `RightPanel.tsx:17-20`, `E/sidebar/LeftSidebar.tsx:618-624`, `E/rail/LayoutShell.tsx:5-6` | `tw:h-14`, `tw:w-[60px]`, `w-[300px]/[360px]` literals; drawer 700 and 560 in JS; comment claims inspector 280 and topbar 52 | `var(--bk-size-*)` | Values currently equal the tokens | A token change would not move these; one stale doc comment | P3 |
| 12 | Spacing scale | 853 chrome class sites and CSS | Tailwind 1.5/2.5/3.5 (6/10/14px) = 308; `[3px]/[5px]/[6px]/[7px]/[9px]/[10px]/[11px]/[14px]/[18px]` = 83; CSS 6px×80, 10px×47, 3/5/7px×37 | DESIGN: "4px base · 2/4/8/12/16/24/32/48/64" | Many match Figma (12/6 button inset) | The written scale and the boards disagree | P3 / decision |
| 13 | Collab identity marker sizes | `E/chrome-ui/Presence.tsx:78-104`, `ActivityView.tsx:81-92`, `CommentLayer.tsx:98-112`, `D/components/team/members-table.tsx`, `D/components/dashboard/avatar-dropdown.tsx` | Presence avatar 24 next to a 20 overflow chip; activity chip 16; dashboard 32/36/56 | One avatar step plus a matched overflow chip | No for the +N mismatch | The +N chip is 4px smaller than the avatars it follows | P3 |
| 14 | Dashboard content column and page titles | `D/components/dashboard/shell/dashboard-shell.tsx:11-14,39-40`; page containers; 18 `<h1>`s | No shell max-width (the comment claims 1120); pages 500/600/760/768/1000/1200/none; extra `px-6` inside the shell's `px-10`; h1 as `text-page-title`, `text-xl font-bold`, `text-xl font-semibold`, `text-2xl font-semibold` | One column rule; `PageHeader` / `--text-page-title` | No | Gutters of 40 vs 64; four title treatments | P3 |
| 15 | Dashboard and onboarding size ramp | `D/app`, `D/components` | 22 arbitrary px sizes (9…42, incl. 12.5/13.5/14.5/15.5) plus Tailwind `text-xs/sm/base/lg/xl/2xl/3xl` (88), concentrated in onboarding | Named ramp; `text-sm/xs` "swept out" (DESIGN :91) | Artifact-matched px are allowed by DESIGN | Onboarding has `--text-onb-*` yet uses Tailwind defaults | P3 |
| 16 | Font loading and weights | `D/app/layout.tsx:39-43`, `ES/themes/fonts.css:1-35`, `ES/themes/default.css:28-37` | Production (Next) loads Inter 400–800, Inter Tight 400–700 and Geist from the Bunny CDN. Self-hosted 400/500/600 only in the demo and probe hosts | DESIGN: "Self-host in production" | Documented tradeoff in `default.css` | Weight-700 chrome renders true bold in production but not in the measurement host | P3 |

---

## Findings

No P0 or P1. Nothing in this concern reaches the immediate-fix class. No layout defect found in code blocks a core flow, although A10-1 comes closest because it touches every surface.

### P2

#### A10-1: Chrome `Button` has no size contract, so equivalent buttons render at 28, 32 and 40px

- **Severity:** P2
- **File:**
  - `packages/editor/src/editor/chrome-ui/Button.tsx:40-47`
  - `packages/editor/src/editor/chrome-ui/buttonTheme.ts:17-42`
  - `packages/editor/src/editor/chrome-ui/Modal.tsx:28-42`
- **Symbol:** `Button`, `BK_BUTTON_THEME`, `MODAL_FOOT_CLASS`
- **Evidence:**
  - `BK_BUTTON_THEME` sets `disabled` and two colours (`link`, `ghost`). It has **no `size` key**. `Button` passes `size` straight through, so an unsized Button gets Flowbite `md`: `"h-10 px-5 text-sm"` (flowbite-react 0.12.17 `Button/theme.js:12`).
  - A per-tag parse of 853 `<Button>` tags in `E/` found:
    - `size="xs"` (`h-8 px-3 text-xs`, i.e. 32/12px) on **456**;
    - `size="sm"` on 7;
    - an explicit `tw:h-*` on 23;
    - **359** non-link Buttons with neither.
  - Modal footers force every descendant button to `h-7 px-3 py-1.5` (`Modal.tsx:42`), justified by "the design system's Button (9:102) is 28h with 12/6 padding" (`:33-39`). So one kind of button renders as:
    - 28 inside `ModalFooter`;
    - 32 where a caller remembered `xs`;
    - 40 everywhere else.
  - Concrete 40px examples:
    - `E/sidebar/tabs/ai/AgentPlan.tsx:219,222,249,254`: Skip, Approve, Undo all and Retry in a drawer panel. `PANEL_ACTIONS` at `:22` sets no height.
    - `E/shell/modals/ConflictModal.tsx`: Reload, Backup and Overwrite. It is a hand-rolled overlay, so the modal-foot rule does not apply.
    - `E/sidebar/tabs/publish/PublishWizard.tsx:298`: explicit `tw:h-10 … tw:text-[14px]`.
  - The drift is fought locally. Comments in `StudioFooter.tsx:246`, `ContentViews.tsx:72`, `layers-v2.css:198`, `LibraryManager.css:115,1016`, `CreateComponentModal.tsx:303` and `toolbarStyles.ts:82` each work around "flowbite's h-10".
- **Expected behavior:**
  - One default chrome button size (28h per the DS board), with `xs` and `sm` as deliberate exceptions.
  - DESIGN §Row Density: "Never 40. Desktop power users want density."
- **Root cause:** the wrapper was grown for `variant` only ("changes zero shipped pixels", `Button.tsx:14-15`). The size default was left to Flowbite, and each surface patches it on its own.
- **Affected modules:**
  - AI tab (agent plan);
  - the save-conflict dialog;
  - the Publish wizard;
  - templates, media and pages menus;
  - every modal *not* built on `ModalFooter`.
- **Recommendation:**
  - Add a `size` key to `BK_BUTTON_THEME` so the default is the DS 28h/12-6 button.
  - Delete the per-surface h-10 workarounds in the same batch.
  - Snapshot-test a bare `<Button>` height.
  - This will move pixels on ~359 sites, so it needs a visual pass.
- **Status:** VERIFIED in code; NOT RUNTIME VERIFIED. Some of the 359 may be resized by a two-class CSS rule I did not trace one by one.

#### A10-2: Three command palettes with three geometries; the Figma-conformant one is not mounted

- **Severity:** P2
- **File:**
  - `packages/editor/src/editor/canvas/controls/CommandPalette.tsx:268-282,312-449`
  - `packages/editor/src/editor/shell/modals/CommandPalette.tsx:448,501,620`
  - `packages/editor/src/editor/chrome-ui/CommandPalette.tsx:2,88,107,123`
- **Symbol:** `CommandPalette` (×3)
- **Evidence:**

  | Palette | Geometry |
  |---|---|
  | ⌘⇧P (canvas) | Inline style: `width: 520`, `borderRadius: 12`, `padding: "12px 14px"`, items at `fontSize: 11`/`12` |
  | ⌘K (shell) | `tw:w-140` (560), `tw:rounded-xl` (12), a 16/600 input (`[&_input]:text-base font-semibold`), result rows `tw:h-10` (40) |
  | `chrome-ui/CommandPalette` (header "Figma 166:2 (640×420)") | `tw:w-[640px] max-h-[420px] rounded-lg` (8), rows `h-10`. **No product import**: only `chrome-ui/index.ts:143` and its own test |

  - Two shortcuts open palettes of different width, radius, input type and row height.
- **Expected behavior:** one palette geometry, the Figma 166:2 frame, used by both entry points.
- **Root cause:** the primitive was built to the board but never adopted. Both live palettes predate it.
- **Affected modules:** command surfaces (⌘K, ⌘⇧P).
- **Recommendation:**
  - Converge both live palettes on the chrome-ui primitive, or delete it.
  - Also decide the 40px row. It contradicts "Never 40".
  - The two command lists are Prompt 5/6 territory; this finding is only about geometry.
- **Status:** VERIFIED (code and imports); NOT RUNTIME VERIFIED.

#### A10-3: Modal widths come from two editor scales and eight free-numeric dashboard widths

- **Severity:** P2
- **File:**
  - `packages/editor/src/editor/chrome-ui/Modal.tsx:44-48`
  - `packages/editor/src/editor/chrome-ui/ModalParts.tsx:26-40`
  - `packages/dashboard/components/dashboard/primitives/modal.tsx:14,91`
- **Symbol:** `KIND_WIDTH_CLASS`, `SIZE_WIDTH_CLASS`, `Modal({ width = 460 })`
- **Evidence:**
  - Editor `Modal` kinds: `question 440 / form 560 / flow 720`.
  - Editor `ModalContent` sizes: `sm 360 / md 520 / fields 500 / table 640 / question 440 / form 560 / lg 720 / xl 960`. That is eight steps, two of them 20px apart (500 vs 520) because each copied a different board.
  - Dashboard `Modal` takes any `width` number. The 15 call sites use **384, 400, 420, 440, 448, 480, 512** plus the 460 default. Pairs of the same kind that do not match:

    | Dialogs | Widths |
    |---|---|
    | `sites/delete-confirm-modal.tsx` vs `settings/delete-workspace-modal.tsx` | 420 vs 448 |
    | `sites/rename-modal.tsx` vs `sites/transfer-modal.tsx` | 400 vs 440 |
    | `team/invite-modal.tsx` vs `team/members-table.tsx` | 512 vs 384 |

  - Radius is inconsistent too:
    - the editor modal frame is `rounded-xl` (12) (`Modal.tsx:20`);
    - `ConflictModal` is 8 by its board;
    - DESIGN §Layout says modals are `lg: 8px`;
    - DESIGN Axiom A1.3 keeps "12 on modals".
- **Expected behavior:** a small quantised width scale per surface (for example question / form / wide), chosen by role, not by pixel.
- **Root cause:** sizes were added per board or per screen. The dashboard primitive deliberately exposes a raw number (the comment at `modal.tsx:7-9` rejects Flowbite's quantised steps).
- **Affected modules:** every confirm, rename, transfer, invite and billing dialog; editor modals.
- **Recommendation:**
  - Collapse the editor to one `ModalSize` scale and fold 500 into 520.
  - Change the dashboard `width` prop to an enum.
  - Settle the modal radius in DESIGN first (see Product decisions).
- **Status:** VERIFIED (code); NOT RUNTIME VERIFIED.

#### A10-4: The chrome type ramp is not the source of chrome font sizes

- **Severity:** P2
- **File:**
  - `packages/editor/src/editor/chrome-ui/typeRamp.ts:1-35`
  - `packages/editor/src/themes/tokens.generated.css:164-170`
  - chrome-wide
- **Symbol:** `TYPE_*_CLASS`, `--bk-text-*`
- **Evidence:**
  - `typeRamp.ts` says "sizes and inks ride the generated tokens so a Figma re-export moves everything at once".
  - Consumers: `TYPE_BODY_CLASS` and `TYPE_HINT_CLASS` are imported by exactly **one** product file (`E/shell/modals/ReviewSentModal.tsx:25`). `TYPE_PANEL_TITLE_CLASS`, `TYPE_SECTION_CAPTION_CLASS` and `TYPE_LABEL_CLASS` have **zero** consumers outside the barrel.
  - The same sizes are written in four ways in chrome TSX (tests excluded):

    | Spelling | Sites |
    |---|---|
    | `tw:text-[length:var(--bk-text-11/12/13/14/16/20)]` | 211 |
    | `tw:text-[11px]`, `tw:text-[13px]`, `tw:text-[12px]`, `tw:text-[14px]`, `tw:text-[16px]` | 234, 193, 135, 20, 8 |
    | inline `fontSize: 12`, `fontSize: 11`, `fontSize: 13`, … | 131, 66, 36, … (~260) |
    | Tailwind named `tw:text-xs` (12/16 line-height), `tw:text-sm` (14/20), `tw:text-base` (16/24) | 118, 8, 5 |

  - The design-debt ratchet bans only *off-scale* values (`check-design-debt-ratchet.mjs:58`), so on-scale literals pass. The result is that ~80% of chrome text would not move on a token change, and line-heights differ by spelling (Tailwind `text-xs` brings a 16px line box; the literal brings none).
- **Expected behavior:** chrome text sizes resolve through `--bk-text-*`, ideally through the five role constants.
- **Root cause:** the ramp constants arrived late (2026-08-28) and were never drained into consumers. The ratchet counts values, not spelling.
- **Affected modules:** all editor chrome.
- **Recommendation:**
  - Add a ratchet population for literal `tw:text-[(11|12|13|14|16)px]`, inline `fontSize:` and named `tw:text-(xs|sm|base)` in chrome, and drain it.
  - Adopt the role constants for captions and labels (this also fixes A10-5).
- **Status:** VERIFIED (counts from grep); NOT RUNTIME VERIFIED.

### P3

#### A10-5: The uppercase caption / eyebrow voice has 7 trackings and 3 weights

- **Severity:** P3
- **File:**
  - `E/chrome-ui/SectionHeader.tsx:16-17` (11/500, 0.08em, muted)
  - `E/inspector/styles/inspector.css:229-236` (`.bdi-sec-name` 11/**600**, 0.08em, muted)
  - `E/chrome-ui/PanelHeader.tsx:115` (11/500, 0.08em, ink-soft, as DESIGN)
  - `E/design-system/ui/modals/ReviewModal.tsx:40` (`text-xs` 12/**700**, 0.07em)
  - `E/sidebar/shared/FeatureCard.tsx:228-234` (11/**700**, 0.08em, accent)
  - 59 TSX lines with `uppercase`
- **Symbol:** `SECTION_HEADER_CLASS`, `.bdi-sec-name`, `planBadgeStyles`
- **Evidence:**
  - Tracking values in chrome TSX: `0.5px`×16, `0.04em`×10+6, `0.06em`×9, `0.08em`×8+2, `0.88px`×2, `0.07em`, `0.3px`, `0.05em`, …
  - CSS adds `0.04em`×5, `0.05em`×3 and `0.06em`×2.
  - Sizes are 11 or 12; inks are muted, soft or semantic.
- **Expected behavior:** DESIGN §Typography says "Panel/drawer headers = 11/500 UPPERCASE ink-soft". `TYPE_SECTION_CAPTION_CLASS` exists for the section caption.
- **Root cause:** hand-rolled labels predate the ramp (A10-4).
- **Affected modules:** the inspector, the Brand panel, modals, the command palette group headers, feature cards.
- **Recommendation:** route captions through `TYPE_SECTION_CAPTION_CLASS` and `TYPE_PANEL_TITLE_CLASS`; pick one tracking token (`--bk-tracking-wide` = 0.08em already exists).
- **Status:** VERIFIED; NOT RUNTIME VERIFIED.

#### A10-6: Weight 700 in editor chrome despite the 600 cap

- **Severity:** P3
- **File:**
  - `E/sidebar/shared/FeatureCard.tsx:232`
  - `E/onboarding/AchievementPrompt.tsx:71`
  - `E/canvas/overlays/ElementHoverOverlay.tsx:434`
  - `E/design-system/ui/type/TypeTokenList.tsx:87` (`font-bold`) and `:188` (`font-extrabold`)
  - `E/design-system/ui/modals/ReviewModal.tsx:40`
  - `E/shell/modals/CMSCollectionSetupModal.tsx:73`
  - `E/shell/modals/ConflictModal.tsx:62`
- **Symbol:** various
- **Evidence:** each line sets `font-bold`, `font-extrabold` or `fontWeight: 700` on chrome text: badges, step dots, a modal title, the clone badge.
  - `TypeTokenList.tsx:203,385` and `AssetGrid.tsx:161` / `AssetDetailsPanel.tsx:353` are *previews of customer or asset type* and are legitimately bold, so they are excluded.
  - No gate checks weight.
- **Expected behavior:** "Weights cap at 600 — no 700 anywhere in chrome" (DESIGN §Typography).
- **Root cause:** there is no weight population in `check-design-debt-ratchet.mjs`.
- **Affected modules:** the ones listed.
- **Recommendation:** swap these to `font-semibold`, and add a `tw:font-(bold|extrabold|black)|fontWeight: ?7` population, excluding preview renderers.
- **Status:** VERIFIED; NOT RUNTIME VERIFIED. Also see A10-16: in the production host these render truly bold.

#### A10-7: Off-scale chrome font sizes the ratchet cannot see

- **Severity:** P3
- **File:**
  - `packages/editor/scripts/check-design-debt-ratchet.mjs:58,99`
  - sites: `E/sidebar/tabs/pages/page-settings/SeoTab.tsx:120` (`text-base`) and `:153` (`text-[24px]`)
  - `E/sidebar/tabs/pages/page-settings/AdvancedTab.tsx:119` (`fontSize: "11.5px"`)
  - `E/canvas/overlays/SpacingLabels.tsx:24` (`fontSize: "10px"`)
  - `E/inspector/shared/TokenPickerPopover.tsx:232` (`text-lg` = 18)
  - `E/design-system/ui/colors/ColorTokenList.tsx:392` (`text-xl` = 20)
  - `E/media/components/AssetDetailsPanel.tsx:353` (`text-5xl`, a font preview, so fine)
  - glyph and emoji icons at `fontSize: 20/24/32` (`KeyboardCheatSheet.tsx:249`, `ExportModal.tsx:390,430`, `FileField.tsx:115`, `SidebarFallbacks.tsx:22`)
  - modal title overrides to 16 (`MigrationProgressModal.tsx:76`, `TemplateUsageDrawer.tsx:87`) against the primitive's 14/600 (`Modal.tsx:25`)
- **Symbol:** `offscale-font-size` pattern
- **Evidence:**
  - The pattern `fontSize: ?(…10|11\.5…)\b` has no allowance for a quote, so `fontSize: "10px"` and `"11.5px"` slip through.
  - Named Tailwind sizes (`text-lg`, `text-xl`) are not in the population at all.
  - The ratchet reports 0 while these exist.
  - Modal titles render 14 (primitive), 16 (two overrides) and 16/700 (`ConflictModal`).
- **Expected behavior:** a size ramp of 11/12/13/14/16/20/24, with icons sized as icons (`Icon size`), not as text.
- **Root cause:** a regex gap in the gate.
- **Affected modules:** page settings, the canvas spacing overlay, token pickers, modals.
- **Recommendation:** widen the regex to allow `["']?` and add named sizes; replace emoji-as-icon sizing (also an anti-slop rule 6 issue).
- **Status:** VERIFIED (regex read, sites read); NOT RUNTIME VERIFIED.

#### A10-8: Three sources disagree on row heights

- **Severity:** P3
- **File:**
  - `packages/editor/src/themes/tokens.generated.css:123-127`
  - `packages/editor/src/editor/chrome-ui/Row.tsx:55-66`
  - `DESIGN.md:349-357`
- **Symbol:** `--bk-size-row-tall`, `Row` `ROW_CLASS`
- **Evidence:**

  | Row | Token | `Row` primitive | DESIGN |
  |---|---|---|---|
  | Tall row | `--bk-size-row-tall: 64px` | `tall: "tw:h-14"` = 56, with the comment "56, per board 8:29 — NOT 64" | "48px — cards with metadata" |
  | Dense row (28h) label | — | 11px (`dense: "tw:h-7 tw:text-[11px]"`) | 12px |

  - `--bk-size-row-tall` has no consumer (grep).
- **Expected behavior:** one value per row role, living in the token.
- **Root cause:** the Figma token was not re-exported after the board correction, and the doc was never updated.
- **Affected modules:** list rows (history, notifications, comment rows).
- **Recommendation:** fix the value in Figma, regenerate, and make `Row` read `var(--bk-size-row*)`; update DESIGN §Row Density.
- **Status:** VERIFIED; NOT RUNTIME VERIFIED.

#### A10-9: The same text field is 32h/r6 in one drawer and 42h/r8 in another

- **Severity:** P3
- **File:**
  - `packages/editor/src/editor/chrome-ui/textInputTheme.ts:69-72`
  - `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:683-693`
- **Symbol:** `BK_TEXT_INPUT_THEME`, `.bd-pg-drawer-body input`
- **Evidence:**
  - The chrome `TextInput` is `h-8 … text-[13px]` with `rounded-md!` (6).
  - The Page-settings drawer overrides every input to `min-height: 42px; border-radius: var(--bk-radius-lg); font-size: 14px`. Its comment says the board's 42h beats the "Input component doc's 36h".
  - So the codebase names three heights for one field (32 / 36 / 42) and two radii. DESIGN §Layout lists inputs at `lg: 8px`.
- **Expected behavior:** one chrome field geometry, or a named `size`.
- **Root cause:** per-board overrides in a feature CSS file.
- **Affected modules:** Page settings versus every other chrome form.
- **Recommendation:** add a `lg` sizing to `BK_TEXT_INPUT_THEME` if 42 is intended; align the radius with DESIGN.
- **Status:** VERIFIED; NOT RUNTIME VERIFIED.

#### A10-10: The shipped rail and panels do not use the Figma-built layout primitives, and their geometry differs

- **Severity:** P3
- **File:**
  - `E/chrome-ui/Rail.tsx:20,45` vs `E/sidebar/LeftSidebar.css:42-54,105-111`
  - `E/chrome-ui/{RightPanel,TreeRow,NavItem,EditorShell,MediaCard,SiteCard}.tsx`
- **Symbol:** `Rail`/`RailItem`, `.ls-rail`/`.ls-btn`
- **Evidence:**
  - Rail geometry:

    | Rail | Items | Padding | Gap |
    |---|---|---|---|
    | `chrome-ui/Rail` | `tw:w-11 tw:h-11` (44) | `py-2` | `gap-1` |
    | Shipped rail (`LeftSidebar` `FigmaRail` / `FourToolRail`) | `.ls-btn` 36×36 | 6px | 2px |

  - A grep for `<Rail`, `<RailItem`, `<RightPanel`, `<TreeRow`, `<NavItem`, `<EditorShell`, `<MediaCard` and `<SiteCard` outside `chrome-ui/` and tests returns 0 product consumers.
- **Expected behavior:** one geometry, either the primitive or the shipped CSS, and not both.
- **Root cause:** primitives were built from the boards while the shipping surfaces stayed on their CSS.
- **Affected modules:** the rail, right-hand panels, layer rows.
- **Recommendation:** decide which rail is canonical (36 vs 44). Component adoption belongs to Prompt 11.
- **Status:** VERIFIED (code and imports); NOT RUNTIME VERIFIED.

#### A10-11: Shell dimensions are duplicated as literals beside the tokens, alongside stale layout comments and dead font stacks

- **Severity:** P3
- **File:**
  - `E/chrome-ui/Topbar.tsx:201` (`tw:h-14`)
  - `E/chrome-ui/Rail.tsx:20` (`tw:w-[60px]`)
  - `E/chrome-ui/RightPanel.tsx:17-20` (`w-[300px]`/`w-[360px]`)
  - `E/chrome-ui/PanelFrame.tsx:29`
  - `E/sidebar/LeftSidebar.tsx:618-624` (expand `700` in JS; media and templates widths 560/700 via events)
  - `E/rail/LayoutShell.tsx:5-6`
  - `E/sidebar/LeftSidebar.css:295-305`
  - `ES/shared/constants/config.ts:161,177`
- **Symbol:** various
- **Evidence:**
  - The values equal `--bk-size-topbar/rail/inspector/panel-right`, but are literals, so regenerating tokens would not move them.
  - The drawer's expanded width 700 has no token. DESIGN §Layout says 280 for all six panels.
  - The `LayoutShell.tsx` header comment says "Inspector (280px)" and "TopBar (52px)"; the CSS uses 300 and 56.
  - `.ls-panel-header` / `.ls-panel-title` (13/600 ink, `font-family: … "Inter Tight", system-ui`) have **no TSX consumer**.
  - `DEFAULTS.FONT_FAMILY: "Inter, system-ui, sans-serif"` has **no consumer**. Both name `system-ui`, which DESIGN bans.
  - Gate 14 still counts 164 layout literals.
- **Expected behavior:** `var(--bk-size-*)` everywhere; no orphan rules or constants carrying banned fallbacks.
- **Root cause:** incremental migration.
- **Affected modules:** shell and drawers.
- **Recommendation:**
  - Swap the literals for tokens.
  - Add `--bk-size-drawer-wide` if 700 is intended.
  - Delete the orphan rules and constant (Prompt 17 overlap).
- **Status:** VERIFIED; NOT RUNTIME VERIFIED.

#### A10-12: Spacing in code does not follow the written spacing scale

- **Severity:** P3 · PRODUCT DECISION REQUIRED
- **File:** chrome-wide; `DESIGN.md:225-228`; `tokens.generated.css:100-112`
- **Symbol:** `--bk-space-*`
- **Evidence:**
  - DESIGN: "4px base · scale 2/4/8/12/16/24/32/48/64". The tokens add 20/28/36/40.
  - Chrome class spacing includes:
    - `1.5` (6px) ×177, `2.5` (10px) ×113, `3.5` (14px) ×18;
    - arbitrary `[3px]` ×20, `[7px]` ×15, `[5px]`, `[6px]`, `[9px]`, `[10px]`, `[11px]`, `[14px]`, `[18px]`.
  - Chrome CSS padding, margin and gap include `6px` ×80, `10px` ×47, `3px` ×16, `5px` ×14, `7px` ×7.
  - Many are deliberate board matches (the 12/6 button inset in `Modal.tsx:33-39`).
- **Expected behavior:** the doc and the boards agree on one scale.
- **Root cause:** Figma boards use 6/10, but the DESIGN scale does not include them.
- **Affected modules:** all chrome.
- **Recommendation:** decide whether 6 and 10 are on the scale. If yes, add `--bk-space-6/10` and amend DESIGN; if no, drain.
- **Status:** VERIFIED (counts); PRODUCT DECISION REQUIRED.

#### A10-13: Collaboration identity markers use unrelated sizes; the presence "+N" chip is smaller than the avatars it follows

- **Severity:** P3
- **File:**
  - `E/chrome-ui/Presence.tsx:78-104`
  - `E/sidebar/tabs/history/components/ActivityView.tsx:81-92`
  - `E/canvas/comments/CommentLayer.tsx:98-112`
  - `D/components/team/members-table.tsx`
  - `D/components/dashboard/avatar-dropdown.tsx`
- **Symbol:** `Presence`, `STYLE_USER_CHIP`, `PinDot`
- **Evidence:**
  - Presence renders Flowbite `Avatar size="xs"` (`h-6 w-6` = 24).
  - The overflow chip right after it is `tw:w-5 tw:h-5` (20), with explicit `text-[11px]`. The avatars' initials carry no explicit size and inherit it.
  - The editor activity user chip is 16px (`width: 16, height: 16, fontSize: 11`).
  - Dashboard avatars are 36 (account), 32 and 56 (team).
- **Expected behavior:** the overflow chip matches the avatar diameter; there is a small documented avatar step scale.
- **Root cause:** Presence mixes a Flowbite atom with a hand-sized chip.
- **Affected modules:** the topbar presence stack (behind `FEATURE_COLLAB`), history activity, the dashboard team list.
- **Recommendation:** size the chip `w-6 h-6`, and add an avatar size to DESIGN.
- **Status:** VERIFIED; NOT RUNTIME VERIFIED. The rendered initials size is unknown without a browser.

#### A10-14: Dashboard content column and page titles have no single rule

- **Severity:** P3
- **File:**
  - `D/components/dashboard/shell/dashboard-shell.tsx:11-14,39-40`
  - `D/app/dashboard/{templates/page.tsx:68, templates/[id]/page.tsx:25, marketplace/page.tsx:102, learn/page.tsx:170, resources/page.tsx:19, getting-started/page.tsx:45}`
  - `D/components/notifications/notification-page.tsx:80,82`
  - `D/components/clients/client-detail-view.tsx:277`
  - `D/components/comments/comment-preview.tsx:79`
  - `D/components/legal/legal-content.tsx:16`
  - `D/app/dashboard/settings/integrations/vercel-team-picker/page.tsx:42-44`
- **Symbol:** `DashboardShell`
- **Evidence:**
  - The shell doc says "Content column is the dc mockup's 1120px max-width with 32/40/60 padding". The code is `px-10 pb-[60px] pt-8`, with **no max-width**.
  - Pages then choose max-width 1200/1000/760/768 (`3xl`)/576 (`xl`)/512 (`lg`), or none.
  - Four pages add `px-6` *inside* the shell's `px-10`, which gives a 64px gutter against 40 elsewhere.
  - `px-10` is also applied at phone width.
  - `<h1>` uses `text-page-title` (20/700/1.2) on most pages, but `text-xl font-bold` (notifications, client detail, comment preview), `text-xl font-semibold` (Vercel team picker) and `text-2xl font-semibold` (legal).
- **Expected behavior:** one content-column rule in the shell; titles via `PageHeader` / `--text-page-title`.
- **Root cause:** the shell comment describes an intent that was not built.
- **Affected modules:** the dashboard ecosystem pages, notifications, clients, legal.
- **Recommendation:** put a max-width and responsive gutter in the shell, drop the per-page `px-6`, and route the stray h1s through `PageHeader`.
- **Status:** VERIFIED; NOT RUNTIME VERIFIED.

#### A10-15: The dashboard and onboarding size ramp is bypassed

- **Severity:** P3
- **File:**
  - `D/app/onboarding/**`, `D/components/onboarding/**` (the densest use of Tailwind defaults)
  - `D/components/settings/ai-credits-tab.tsx`
  - `D/app/dashboard/settings/domains/page.tsx`
- **Symbol:** `--text-*`, `--text-onb-*`
- **Evidence:**
  - Arbitrary sizes across the dashboard: `text-[13px]` ×48, `[12px]` ×18, `[13.5px]` ×17, `[10px]` ×14, `[11px]` ×10, `[15px]` ×8, then 9/11.5/12.5/14/14.5/15.5/16/17/19/20/21/24/26/28/30/42px.
  - Tailwind named sizes: `text-sm` ×28, `text-xs` ×15, `text-lg` ×14, `text-xl` ×12, `text-2xl` ×9 and others. DESIGN :91 says `text-sm`/`text-xs` "are swept out of the dashboard".
  - Onboarding owns `--text-onb-*` tokens but still uses the Tailwind defaults.
- **Expected behavior:** the named ramp; artifact-matched pixel values only where a mockup requires them (DESIGN :91).
- **Root cause:** the sweep did not cover onboarding.
- **Affected modules:** onboarding, AI credits, domains.
- **Recommendation:** finish the sweep in onboarding.
- **Status:** VERIFIED (counts); NOT RUNTIME VERIFIED.

#### A10-16: Production fonts come from a CDN with weights the chrome forbids; only the demo and probe self-host

- **Severity:** P3
- **File:**
  - `packages/dashboard/app/layout.tsx:39-43`
  - `packages/editor/src/themes/fonts.css:1-35`
  - `packages/editor/src/themes/default.css:28-37`
  - `packages/editor/demo/main.tsx:18`
  - `packages/editor/e2e/probe/probe.tsx:41`
- **Symbol:** font loading
- **Evidence:**
  - The only production font source (the unified editor inside Next) is the Bunny `<link>`: `inter:400,500,600,700,800|inter-tight:400,500,600,700|geist-mono:400,500&display=swap`.
  - The self-hosted `fonts.css` (Inter 400/500/600 only, `font-display: block`) is imported only by the demo and the e2e probe.
  - So A10-6's 700-weight chrome renders truly bold in production, while the measurement host has no 700 face.
  - The CDN request and a `swap` flash are production behaviour.
- **Expected behavior:** DESIGN §Typography: "Self-host in production."
- **Root cause:** a deliberate tradeoff documented in `default.css` (avoiding two `@font-face` sets in Next).
- **Affected modules:** all of production.
- **Recommendation:** self-host the dashboard's fonts, drop the 700/800 Inter weights, or amend DESIGN.
- **Status:** VERIFIED (code); NOT RUNTIME VERIFIED. Font synthesis and swap behaviour were not observed.

---

## Good as-is

- **The drawer width has one source.** `.ls-panel` reads `var(--drawer-w, var(--bk-size-drawer))` (`LeftSidebar.css:234`). `LayoutShell` writes `--layout-drawer-width` only on an explicit override (`LayoutShell.tsx:291-301`), and the `tabsConfig.width` test passes.
- **The six drawer tabs share one header.** Add, Pages, Assets, Components (`PanelFrame.Header`), CMS and Brand (`PanelHeader`) all use the 44px drawer header at 11/500/0.08em ink-soft, per DESIGN (`PanelHeader.tsx:114-118`). The 48/14 `panel` variant is a documented, separate role.
- **The shell grid is tokenised.** Rail, drawer, inspector, topbar and footer tracks in `LayoutShell.css:25-96` all resolve from `--bk-size-*`.
- **The page-row height is pinned** at 32 by a unit test (`PagesTab.css:13`, `PagesTab.rowHeight.test.ts`).
- **The editor chrome font stack names no system fallback** (`--bk-font-ui`, `tw.css --font-sans`). The only offenders are dead code (A10-11).
- **The existing ratchets pass:** design-debt ratchet (6 populations at 0), narrow-control-padding and the DS grep gates. Gates 11–14 are all under baseline.
- **The dashboard uses its named text tokens heavily** (`text-body*`, `text-section-title`, `text-eyebrow`, `text-page-title`), and `DashboardShell` sizes the top nav and sidebar from `--topnav-h` and `--sidebar-w`.
- **The auth and onboarding control heights match DESIGN:** auth 40/42, onboarding 46/50.

## Product decisions required

1. **Canonical chrome button height:** 28, per DS board 9:102 and the modal footer, or 32 (the de-facto `xs`). This gates A10-1.
2. **Modal radius:** 8 (DESIGN §Layout, `ConflictModal`) or 12 (Axiom A1.3, `MODAL_FRAME_BASE_CLASS`). DESIGN contradicts itself.
3. **Spacing scale:** add 6 and 10 to the scale (the Figma boards use them) or drain them (A10-12).
4. **Rail item size:** 36 (shipped) or 44 (the `chrome-ui/Rail` primitive).
5. **Drawer "expand to 700"** and the Media and Templates 560/700 flow widths versus DESIGN's "280 for all six".
6. **The "tall" row value:** 48, 56 or 64 (A10-8).
7. **Production font self-hosting** versus the current CDN (A10-16).

## Overlaps with other audits

- **Prompt 11 (design system):**
  - six chrome-ui primitives have zero consumers (`Rail`, `RightPanel`, `TreeRow`, `NavItem`, `EditorShell`, `MediaCard`/`SiteCard`), and so does `chrome-ui/CommandPalette`;
  - three dashboard overlays are hand-rolled instead of using the `Modal` primitive: `legal-modal`, `review-client`, `command-palette`;
  - the editor `ConflictModal` is hand-rolled with inline hex. That is a documented exception.
- **Prompt 13 (accessibility):**
  - the 36px rail buttons and 28px buttons are below the 44 marketing target (the editor allows 20 per Axiom A1.4);
  - an 11px uppercase muted caption is common.
- **Prompt 17 (maintainability):** `.ls-panel-header`/`.ls-panel-title` orphan CSS, `DEFAULTS` in `config.ts` has no consumer, and the stale `LayoutShell.tsx` header comment.
- **Prompt 18 (performance):** the third-party font CDN on every dashboard and editor page load (A10-16).
- **Prompts 5/6:** the three command palettes also differ in content, not only geometry (A10-2).

---

## AUDIT HANDOFF

- **Agent / Prompt:** C, Interaction & UX / Prompt 10: Typography, Spacing & Layout Consistency
- **Report:** `docs/audits/2026-09-25-full-audit/10-typography-spacing-layout.md`
- **Counts:** P0 = 0 · P1 = 0 · P2 = 4 · P3 = 12
- **P0:** none. No typography, spacing or layout issue falls in the immediate-fix class.
- **P1:** none.
- **P2:**
  - A10-1: Button has no size contract (28/32/40).
  - A10-2: three command palettes with three geometries; the conformant one is unmounted.
  - A10-3: two editor modal width scales, and eight free dashboard widths.
  - A10-4: the chrome type ramp and tokens are bypassed by ~80% of text sizes.
- **P3:** A10-5 to A10-16. Captions, the 700 weight, the gate regex gap, row-height sources, field geometry, unmounted layout primitives, literal shell dims and dead fallbacks, the spacing scale, the presence chip, the dashboard column and titles, the dashboard ramp, and font hosting.
- **Runtime verified:** none visually. 8 sizing unit files passed 45/45. The design-debt ratchet, narrow-padding gate and DS grep gates all PASS.
- **NOT RUNTIME VERIFIED:**
  - every rendered pixel, including the button heights where two-class CSS may override;
  - the size the avatar initials inherit;
  - font synthesis and swap;
  - the dashboard gutters at phone width.
- **Dependencies:**
  - Product decisions 1–2 gate A10-1 and A10-3.
  - A10-4 and A10-5 are one batch: adopt the ramp constants and add a spelling ratchet.
  - A10-7's regex fix should land before A10-4's drain, so the count is honest.
  - A10-8 needs a Figma token re-export (generated file, not hand-editable).
  - A10-10 depends on the Prompt 11 adoption decision.
- **Inventory corrections:**
  - `chrome-ui/CommandPalette` exists as a third editor palette implementation. The inventory lists two editor palettes; this one has no consumer.
  - The dashboard shell's claimed 1120px content max-width does not exist in code.

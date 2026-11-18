# L2 live results — Inspector, responsive and styling (code map 02)

- App: http://localhost:3300, main @ df60cf9ec. Site **audit1014-L2** `cmv7v81bb000fi7db83bu1540` only. Nothing was published.
- Test page: **audit1014-styles** (`page-mv7wy7zl-1otn6ipkpaf`), created from the SaaS Landing template (Pages › Add page › template gallery › Create page).
- Harness: one persistent Playwright session (`L2/daemon.mjs`, commands run in order through `L2/run.sh`). Viewport 1440×900, plus 1280×720 for the last check. Dev overlays were stripped before every read.
- Engine access: the composer was read from the React fiber (`memoizedProps.composer`). It was used only to **set up** fixtures that the UI cannot create (`filter: saturate() blur()`, `rotate() translateX()`, absolute positions) and to **read** the model (selection ids, `breakpointStyles`, `getStyles().top`). Every behaviour under test went through the UI.
- Evidence: `scratchpad/audit/live/L2/` (screenshot numbers are given below), `export-index.html` (captured Export download), `preview-mobile-styles.css`, `final-sheet.css`.

Element ids used: template H1 `el-mv7wy7zy-16ecf42149z`, clone `el-mv7x788z-fnwm30c1ui`, hero P `el-mv7wy7zy-daww47cmzl`, H3s `…hff0yo1dt6 / …1y4tk51gj4q / …1ujgqww1egt`, features section `el-mv7wy7zz-1pr121a1a04`, button `el-mv7xtcae-1mi0uq9vmhz`, flex children `el-mv7xmpod-1rde6gtxono / el-mv7xmpoe-1jkmo1k1b43 (locked) / el-mv7xmpoe-wy342wy8tc`.

## Summary

| Verdict | Count |
|---|---|
| CONFIRMED | 18 |
| PARTIAL | 2 |
| NOT REPRODUCED | 0 |
| BLOCKED | 1 (D-12) |

Main finding: **Preview is the one surface that disagrees.** The canvas and the exported HTML matched on every property measured. Preview dropped:
- breakpoint overrides of inline base properties;
- every `:hover` rule;
- per-device hide;
- global custom CSS.

Duplicate silently drops all breakpoint and hover styling. That loss carries into export, and a reload does not bring it back.

## Check table

| ID | Claim | Steps run | Measured | Verdict | Evidence |
|---|---|---|---|---|---|
| §10-1 / UX-09 / D-3 | Preview ignores a Mobile override of an inline base property | H1 → Mobile → Font size 32 → Enter. Then Preview › Mobile | Canvas: computed 32px (the editor sheet re-emits the rule with `!important`). Preview iframe at 375 px: inline `font-size: 52px`, computed **52px**, while its `<style>` holds `@media (max-width: 767px){[data-buildrick-id=…]{font-size:32px}}`. Export: `.buildrick-<id>{font-size:52px}` followed by `@media` 40px (tablet) and 32px (mobile). Rendered at 375 px: 32px | CONFIRMED | 13, 15, preview-mobile-styles.css, export-index.html |
| §10-2 / UX-10 / D-8 | Line-height field shows the type default off desktop | Same H1 | Mobile field shows `1.1`. Canvas: 78px at 52px, 48px at 32px, which is 1.5×. No `line-height` in the style attribute. Desktop field shows `78` px. `.buildrick-canvas` line-height is **25.6px** (1.6×16), so the 1.5 comes from a different ancestor than the code map names | CONFIRMED (the ancestor detail differs) | 12, 13 |
| §10-3 / UX-25 | Align shows nothing selected while the text renders centred | Desktop H1 | computed `text-align: center`, parent `center`. All three `inspector-seg-align-*` have `aria-checked=false`. No `text-align` in the style attribute | CONFIRMED | 09 |
| §10-4 / D-7 | On Mobile, the inherited tablet layer is invisible | Tablet: font size 40. On Mobile, use the font-size dot › "Reset to Desktop" | After the reset: canvas **40px**, field **52**. The label says "Reset to Desktop", but the result is the tablet value. "Mobile · Revert" behaves the same way (field 52, canvas 40, no toast) | CONFIRMED | 16, 17, 18 |
| §10-5 / UX-14 | One override produces many indicators | Mobile, one font-size override | 1 `inspector-bp-chip` ("Mobile · 1 override"), 1 `inspector-bp-line` ("Mobile · Revert"), 2 `inspector-section-dot`, 2 `inspector-section-note` ("Overridden on Mobile"), and 2 field dots: `inspector-row-font-size` and `inspector-row-text-style`. **8 indicators in total** | CONFIRMED (8 indicators; the code map counts 5) | 13 |
| §10-6 / UX-05 | Advanced typography opens because of one authored property | Template H1, then a fresh Heading inserted from Add | Template H1 has `letter-spacing: -0.03em` → `inspector-field-white-space` is present and the button reads "Less", so all 9 rows are open. Fresh Heading has no advanced props → collapsed, with "More settings 9" | CONFIRMED | 09, a101 |
| §10-7 / D-2 | Apply-to-all fails silently on a non-Base state | H3 › State :hover › Colour ff0000 › ⋯ › "Apply style to all H3 headings on this page (2)" › Apply to 2 | The dialog closes. **No toast.** The sheet has `:hover` rules only for the source H3 (and the H1), none for the other two. Control on Base: toast "Applied to 2 H3 headings · Undo", and both H3s show the colour | CONFIRMED | 24, 25, 26 |
| §10-8 / D-3 hover | Preview drops `:hover` | (a) H1 :hover colour red. (b) Button :hover fill #000000. Hover each in the Preview iframe | Canvas hover: red and black. Preview: `n.matches(':hover') === true`, but computed stays base (white, `rgb(224,36,36)`), because the inline base wins over the rule. Exported file opened in a page and hovered: black (correct) | CONFIRMED | 21, 57 |
| §10-9 / D-1 | Duplicate drops breakpoint and state rules | Desktop, select H1 (it has tablet 40, mobile 32, :hover red) → ⌘D | Original: 52 / 40 / 32. Clone: **52 / 52 / 52**. The clone's id is not in `#aquibra-styles` and it has no hover. The clone's inspector on Mobile shows 52 and no dots. After reload: same, and the model still holds the stale `breakpointStyles {mobile:32px, tablet:40px}`. The exported HTML also has no media or hover rules for the clone | CONFIRMED | 22, 23, a99 |
| §10-10a / D-4 | Preview ignores per-device hide | Section › Behaviour › untick Mobile | Canvas Mobile: `display:none` (style has `--hide-mobile: true`). Preview › Mobile: **`display:block`**. Export at 375 px: `none` (correct) | CONFIRMED | 34 |
| §10-10b / D-4 | Preview ignores global CSS | Site settings › Custom code › Global CSS `h1{outline:3px solid red}` › Save | Toast: "Saved · applies on next publish". Canvas H1: outline solid red 3px. Preview: `outlineStyle: none`, and the CSS is absent from its styles. Export contains it | CONFIRMED | 37, 39 |
| §10-11 / D-5 | The filter/transform composer loses data | Fixture via engine: `filter: saturate(1.4) blur(2px)` and `transform: rotate(45deg) translateX(10px)`. Effects › Blur slider +1. Scale slider +1 | `filter: blur(3px)`: **saturate lost**. Transform became `translateX(10px) scale(1.01) rotate(45deg)`. Matrix translation went from (7.07, 7.07) to (10, 0), so the geometry changed. Move X showed empty although translateX(10px) existed. The filter UI only offers blur, brightness, contrast and grayscale | CONFIRMED | 42, 43 |
| §10-12a / D-9 | Paste style on Mobile writes Desktop base | Desktop: H3 → ⌘⌥C ("3 styles copied"). Mobile: P → ⌘⌥V ("3 styles applied") | P's **base** inline style changed (18px → 16px, colour, margin). Desktop shows the change. No rule was written for P | CONFIRMED | a41 |
| §10-12b / D-9 | Reset style is base-only | Mobile: P font-size 22 → ⋯ › Reset style | Toast "Styles reset · Undo". The style attribute became `cursor: grab` (**all Desktop base styles wiped**). The Mobile computed size stays 22px, and the `@media 767` rule for P survives into export | CONFIRMED | a42 |
| §10-13 / D-10 / CI-01 | Align/distribute bypasses lock and breakpoint | 3 absolute containers, middle one locked via ⋯ › Lock. **Tablet** (Mobile was not usable, see the note). Layers ⌘-click to select all 3 → `inspector-multi-bar` › Align left | `left` was 40/190/340 and became **40/40/40, including the locked element**. No toast. No breakpoint rule written. Desktop base `left` changed. Undo restores it in one step | CONFIRMED (on Tablet) | 46, 48, 49 |
| §10-14 / D-6 | Class suggestions are always empty | Add class `card` to H3a. On H3b, type `c` in `class-add` | No listbox or option appears. The project already has `.btn` (8 uses), `.container` (2) and `.card` (1) in Brand › Classes | CONFIRMED | 28, 30 |
| §10-15 / D-12 | Media blocks are ordered by insertion | — | BLOCKED. This project already has a `@media (max-width:1023px)` block ahead of the 767 block (from an element on Home), so the media-group order cannot be inverted on this site. Needs a fresh site with no tablet rules | BLOCKED | final-sheet.css |
| §10-16 | Position is only available on containers | Heading, Image, Flex (inserted), Container, Section | Heading, Image and Flex: no `inspector-field-position` and no Layout section on any tab. Containers and Section: present | CONFIRMED | 45, a64, a67 |
| §10-17 / D-13 | Offset input skips unit parsing | Container (absolute) › Position Offset Top: type `10` → Enter | Model `top: "10"`. The inline style has no `top` (invalid, dropped). Computed `top` is **68px** (static fallback), so the element jumps. A read mid-typing showed the old 20px, so per-keystroke writes were **not** observed | PARTIAL (unit bug confirmed; per-keystroke write not seen) | 50, a80 |
| §10-18 | Editing a state does not preview it on canvas | H1 :hover colour red, pointer kept in the inspector | Canvas computed is still `rgb(255,255,255)`. The colour only shows when the pointer is over the node | CONFIRMED | 19, a32 |
| UX-11 | Preview always opens on Desktop | Canvas on Mobile (375) → topbar Preview | Iframe is 1320 px wide and `bp-cell-desktop` has `aria-pressed=true`. Going back, the canvas is still 375 | CONFIRMED | 59 |

## Journeys

### J1: add and style an element end to end (Button on Desktop)
1. Add › Button with the hero P selected → inserted into the hero section, toast "Button added… Undo". The inspector shows Button, Size, Spacing, Fill, Border and Text inside. **Text inside is collapsed**, so typography is not visible at first.
2. Typography: size 18, line height 24, weight 700, colour = Accent token. Spacing: padding T/B 12, margin-top 8. Fill: Custom colour #E02424. Border: radius 4, width 2, style solid. Effects: shadow Medium, opacity 80.
   - **Issue:** in Custom colour, pressing Enter or Tab in the hex field does nothing. Only the popover's **Apply** button commits. The first attempt silently left the fill at Primary (a89/a90).
   - **Issue:** on insert, Weight showed empty although the computed weight was 600 (from a token var), and Fill/Text colour showed token names. Token-var values do not show as values.
3. Inspector vs canvas vs Preview vs export, all at Desktop. Every property agreed across all four surfaces: font 18/24/700, colour `rgb(21,128,61)`, padding 12/12/16, margin-top 8, bg `rgb(224,36,36)`, radius 4, border 2 solid, shadow `0 8px 24px rgba(0,0,0,.12)`, opacity 0.8, height 40.
   - Only Border › Color is empty in the inspector; it renders as currentColor (Accent).
   - Preview and export differ from the canvas in `border: none` order and `cursor`, with no computed difference.
4. Hover fill #000 → canvas hover black, Preview hover base red (D-3), exported file hover black.
5. Export site… › HTML › Export as HTML → `index.html` downloaded (18.4 KB).
   - Base styles are written as `.buildrick-<id>` class rules, then `[data-buildrick-id]` hover and `@media` rules, plus global CSS and `display:none!important` for hide-mobile.
   - Rendered at 1440/800/375: H1 52/40/32, section hidden at 375, button hover black.
   - **Issue:** the export includes breakpoint rules for elements on other pages (e.g. `el-mskbnhnj-skyr6i171g`, `el-mtlgwt5s-1ncfdxz1djq` from Home). Cross-page CSS leaks into each export.
6. Reload: everything persisted, including the button styles, H1 tablet/mobile/hover, class `card`, `--hide-mobile`, the P mobile 22 rule and the K0 `top:"10"`. Save status showed "Saved" before the reload. The clone stayed broken (D-1).

### J2: responsive
- **Cascade:** Desktop base 52 → Tablet 40 → Mobile 32. Canvas read 52/40/32. The field read correctly at each device while an own override existed.
- **Value origin:**
  - Off desktop, an unset value shows a type default, e.g. line-height 1.1 (UX-10).
  - The inherited tablet value is never shown on Mobile (D-7).
  - Align never reflects an inherited value (UX-25).
- **Scoped reset:** both the field-dot "Reset to Desktop" and "Mobile · Revert" remove only the Mobile layer. The canvas then shows the Tablet value while the field and the label claim Desktop. Neither raises a toast.
- **Undo/redo:** the footer Undo/Redo correctly toggled the Mobile override (32 ↔ 40 on canvas, field 32 ↔ 52) and undid Revert, Reset style and Align.
- **Preview at Mobile:** opens on Desktop (UX-11). After choosing Mobile, the H1 renders 52 instead of 32 (UX-09).
- **Hover:**
  - The state chip offers Base / :hover / :focus / :active / :disabled.
  - Hover edits show on canvas only while the pointer is over the node, so the canvas is not forced into the state (§10-18).
  - Hover is lost in Preview (D-3) and lost on duplicate (D-1).

### J3: classes
- Behaviour › CSS classes: adding `card` works; the class appears on the DOM and in Brand › Classes ("used 1×").
- Suggestions are empty even though 3 classes exist (D-6).
- **Class-level styling does not exist anywhere in the UI.** Brand › Classes lists names and counts only. The rows are plain non-interactive `div`/`span` (cursor auto). "+ Add class" only asks for a name for the selected elements.
- Brand › Styles and Component styles are reusable text/component style presets (Heading 1, Button · primary, …), not class rules.
- The inspector has no "style this class" mode.

### 1280×720 (UX-05 disclosure and scrolling)
- At 1280 the inspector is **not docked**. `layout-shell__inspector` becomes `position:absolute` at x968, y112, 300×596.
  - It overlaps the 640-px canvas region by 12 px.
  - It leaves an empty 56-px band under the topbar.
- Its scroller (`.bdi-panel-scroll`) is 464 px tall for 992 px of content.
- With the template H1 selected, Typography auto-expands (509 px), and Size starts at 870 (below the fold). Spacing, Fill and Border are below the fold. Scrolling works, and header plus state chip stay pinned (header y112, chip y218).
- At 1440 the inspector is docked at x1140, y56.
- Evidence: 60, 61, 62.

## New findings (not in the code map)

1. **N-1 Hex input does not commit on Enter or Tab.** Custom colour popover: typing `#E02424` and pressing Enter (or Tab) leaves the fill unchanged and gives no feedback. Only "Apply" commits. Measured: computed bg stayed `rgb(26,86,219)` after both keys (a89, a90).
2. **N-2 Copy style copies layout too.** Copy style (⌘⌥C) on an H3 copied `margin` along with typography: P got `margin: 0 0 10px`. The Apply-to-all dialog says it keeps layout, but Copy/Paste style does not.
3. **N-3 Export leaks other pages' CSS.** The single-page HTML export includes breakpoint rules for elements on other pages (Home).
4. **N-4 Inspector floats at 1280 px.** Absolutely positioned, overlaps the canvas edge, leaves a 56-px gap under the topbar.
5. **N-5 Move X shows empty.** Transform Move X/Y were empty while the element had `translateX(10px)`.
6. **N-6 Locked elements behave differently by entry point.** Canvas shift-click skips them, but Layers ⌘-click adds them to a multi-selection, and the multi-bar then moves them (D-10).
7. **N-7 Template pick can rename a page by accident.** Typing in Add page and pressing Enter (on a name field I believed focused) opened the template gallery. The typed text became the new page's name. Possibly intended, but surprising.

States observed:
- saved: `save-status-saved`
- unsaved: `save-status-unsaved` pill, and the "unsaved changes" suffix on page tabs
- toasts: Undo-able toasts for apply/paste/reset/insert; "Locked — unlock to edit"
- disabled: Distribute Horizontal/Vertical disabled with 3 selected
- the settings save toast

Not observed: conflict, error, loading skeletons.

## Not verified
- **D-12 media order:** blocked. The site already has a tablet block before the mobile block. Needs a fresh site.
- **D-10 on Mobile specifically:** run on Tablet instead, because the containers sat inside a section I had hidden on Mobile (D-4 setup). The mechanism is the same: no breakpoint awareness.
- **Publish output:** not authorized. Used the HTML export instead (single file, inlined CSS).
- **D-5 with a user-authored saturate:** saturate cannot be created in the UI. The fixture was injected through the engine (`el.setStyle`).
- **D-11** (type-block base writes on Mobile), **D-14** (`white-space: normal` trigger), **D-15**: not in my §10 list and not run.
- **Hover / :focus states other than :hover:** not exercised.
- **Server-side save payload:** not inspected. Persistence was judged by reload only.
- **DESIGN:** not assessed.

Leftover test data on audit1014-L2:
- page audit1014-styles with modified elements, plus inserted Flex/Image/Button/Heading;
- global CSS `h1{outline:3px solid red}`;
- section hidden on Mobile;
- H3 colours and class `card`.

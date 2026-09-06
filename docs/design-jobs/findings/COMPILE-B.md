# COMPILE-B — everything in FIG-D / FIG-E / FIG-F that does not compile to a text row or a rename

Lanes: `FIG-D.jsonl` (38), `FIG-E.jsonl` (34), `FIG-F.jsonl` (72 — the brief said ~57).
In scope: `fix-board` + `add-state` = **78 rows** (D 16, E 26, F 36), plus the four
`create-board` rows the brief asked me to carry, plus three `mark-unimplemented`
rows (FIG-F-13 / -25 / -26) whose rename half the coordinator has already applied
and whose **row-content half is still outstanding**.

Counting the seven `create-board` rows and the one `wire-edge` row as well,
that is **89 findings considered**.

| | count |
|---|---|
| compiled to `plan-text-B.json` | **70 text rewrites** (dry run: 70 WOULD, 0 refused, 0 missing, 0 not-text) |
| compiled to `plan-marks-B.json` | **11 renames** (dry run: 11 WOULD, 0 missing) |
| findings **fully closed** by those two files | **20** — D-06, D-20, D-34, E-08, E-10, E-11, E-31, F-01, F-02, F-05, F-13, F-14, F-19, F-22, F-23, F-24, F-25, F-28, F-35, F-70 |
| findings **partly closed** (text or rename done, structure deferred) | **17** — D-12, D-17, D-23, E-03, E-06, E-07, E-09, E-13, E-15, E-16, E-19, E-20, E-25, E-27, F-26, F-46, F-69 |
| findings **deferred entirely** (§1–§7 below) | **52** — D 13, E 13, F 26 |

Both plans are at
`/Users/shahg/Desktop/pencil/buildrik/packages/editor/scratchpad_audit/mod/` —
the same directory COMPILE-C used. Every text row carries an `expect` taken from
the string I read out of the file today, not from the finding's prose.

Page: **every row in both plans is on `1:3`**, with one exception —
`1736:8405` in `plan-marks-B.json` is the canonical twin on `1:6`. It resolved
fine with the applier's default `--page=1:3` in the dry run (node lookup is
document-wide), so no second run is needed; if it ever reports MISSING, re-run
that one row with `--page=1:6`.

---

## 0. Read the layout consequences before you apply the text plan

Nine of the 70 text rows grow a node past the box it sits in. None is a reason
not to apply — `scripts/figma/layout-section.mjs` exists — but the sections need
re-laying after.

**Captions are TEXT nodes parented straight to the SECTION** (`155:*` sit on
`1776:8372` / `1776:8373`, `layoutMode` none, `textAutoResize` HEIGHT, w=280,
12/18). They grow downward into whatever is beneath them:

| node | h now | h after (est.) | finding |
|---|---|---|---|
| `155:33` | 72 | ~180 | FIG-E-11 + FIG-E-09 |
| `155:42` | 72 | ~198 | FIG-E-21 + -27 + -31 |
| `155:63` | 90 | ~198 | FIG-F-05 + FIG-D-20 |
| `155:35` `155:36` `155:37` `155:34` `155:43` `155:58` `155:66` `155:69` `788:4309` `788:4314` | 36–72 | +36 to +72 each | as filed |
| `429:2524` | 15 (was the placeholder `"ttt"`) | ~54, w=1120 | FIG-D-06 |

On-board growth that needs a plate re-fit, not just a re-layout:

- **`152:145` / `306:2191`** (starters warning). w=178, `textAutoResize` HEIGHT,
  h 32 → **~112**; parent plate `152:144` / `306:2190` is a 44h `Warning` frame
  with `layoutMode: NONE`, so it will NOT grow itself. Grow the plate to ~124 and
  push the card grid down. This one node carries **both** FIG-F-22 and FIG-F-24 —
  I merged them rather than adding a second text node, because F-24 says "same
  plate, 11px".
- **`146:65`** (versions restore confirm). `textAutoResize` **WIDTH_AND_HEIGHT**,
  w=50 today. The new sentence would run to ~460px and straight off a 280 board,
  over `146:66` / `146:67` (Cancel / Restore). **Set `textAutoResize = HEIGHT`
  and width ≈ 168 first**, then the band `146:64` grows 32 → ~56. Flagged again
  in §7 as one of my least-certain rows.
- **`145:197`** (upload-failed reason). HEIGHT, w=184, h 32 → 48; parent
  `145:195` is 44h. +16.
- **`154:16` / `154:21`** (lint row titles). `textAutoResize` **TRUNCATE**, w=176.
  The replacement strings are longer than 176px at 13px and will clip. That is a
  faithful-enough drawing of a 280 panel, but if you want the shipped wrap,
  switch both to HEIGHT at w=176 and grow rows `154:14` / `154:19` from 56 to ~76.
- **`1169:4715`** is fine — its parent `1169:4713` is a VERTICAL auto-layout and
  the new string is still 2 lines at w=448.

---

## 1. Node deletions (not text rewrites)

| nodes | what | finding |
|---|---|---|
| `153:71`, `153:77`, `153:83` | the three `⋯` on the ACTIVE FONTS rows of `153:57`. `TypographySection.tsx:145-166` renders a family span, a role pill and one label — no button, no onClick, no menu import. | FIG-D-12 / FIG-F-06 |
| `1172:4854` (whole `chg` row frame, holding `1172:4855` "shadow/raised" and `1172:4857` "removed") | a removal can never reach the review modal — both filters in `ReviewModal.tsx:84-92` iterate the CURRENT token list. **Delete this row, then the four compiled rows in `plan-text-B.json` (`1172:4851` → `spacing/lg`, `1172:4853` → `24 → 32`, title → `Review 3 staged changes`, button → `Apply 3 changes`) make the board self-consistent at three rows.** Apply the deletion and the text together or the counts lie. | FIG-F-26 (+ FIG-F-25) |
| `1751:8393` "Group by", `1751:8395` "Sort", `1751:8397` "Filter" (and their parent toolbar frame), plus `1751:8399` "BRAND", `1751:8401` "STATE", `1751:8402` "SURFACE" | `ColourModeSection.tsx:53-136` is the whole component: a toggle, a `NO DARK VALUE` header + count, and a flat `missing.map`. No grouping, sorting or filtering exists in the file. Leave the toggle, the header and the per-row `Set`. | FIG-F-20 |
| `153:38`, `153:41`, `153:44`, `153:47`, `153:50`, `153:53` — the six `›` on `Brand · components` | `ComponentsSection.tsx:141-157` renders the rows as `<Button color="light">` with **no onClick**. | FIG-F-65(a) |
| `429:2412`, `429:2469`, `429:2519` — the `⌄` beside each Iterations value | Iterations is a `NumberField` (min 1 / max 10), not a select — `AnimationEditor.tsx:176-182`. Duration and Delay ARE sliders and are drawn right. Also replace the `control` frames `429:2410` / (variant 2) / (variant 3) with the Inspector stepper; keep the value `1` (`429:2411`, `429:2468`, `429:2518`). | FIG-D-07 |
| `778:4196` (`FROM BRAND` section header) and skeleton rows `778:4197`, `778:4202` on `Components · loading` | `ComponentsTab.tsx:240-244` renders four `SkeletonListItem` rows and one section header. The caption rewrite is already in `plan-text-B.json` (`788:4314`). | FIG-F-46 |

**Instance-internal, so a component edit not a node delete:** the author names on
`Media · drill-in · versions` — `I241:1436;240:11` "Ali", `I241:1444;240:11` "Ali",
`I241:1452;240:11` "Sara", `I241:1460;240:11` "Ali". These are the `240:11` slot of
the shared version-row component. `AssetVersion` is `{id, assetId, url, bytes,
edits, createdAt}` — there is no author field on the client type or the server
row. **Remove the slot at the master `240:11` and let the size delta take the
space**; editing the four instances individually leaves the component still
carrying it. The caption half (`155:43`) is already compiled. (FIG-E-06)

---

## 2. Dimming / disabled treatment — one script, one measured value

**The file's disabled treatment is `opacity: 0.55` on the ROW FRAME**, with the
reason as a second muted line. Measured on the pattern every one of these
findings points at: `153:147` (`Export · Figma` on `Brand · import-export`) is
`opacity = 0.55`, its title `153:148` stays `#111827` and its reason `153:149` is
`#6b7280` at full opacity. Use that everywhere below — do **not** invent a second
disabled register.

| # | nodes (set frame `opacity = 0.55`) | reason line to add | finding |
|---|---|---|---|
| 1 | the `⊞  ⊟   ↑` cluster on all twelve 280 boards: `144:12`, `145:12`, `145:59`, `145:106`, `145:158`, `145:209`, `145:260`, `145:310`, `145:369`, `453:3938`, `777:4100`, `782:4360` — all currently `#4b5563 @ opacity 1`, i.e. identical to the pill counts and the `Media` header | none on the board; the caption note is already compiled into `155:33` | FIG-E-09 |
| 2 | the four type pills on `145:359` (`Media · empty`, every count is `0`): frames `145:371`, `145:374`, `145:377`, `145:380` | `TypePills.tsx:81-82` puts the reason in a `title`: `No <label> files in this library yet` | FIG-E-19 |
| 3 | one pill on `145:2` so the non-empty case carries the state too. My suggestion: dim frame `145:20` (`pill/svg`) **and** set `145:22` "24" → "0" — a dim without a zero count would be wrong, since `isDeadFilter` is `count === 0 && !isActive`. I did **not** compile that text row: it is meaningless without the dim. | as above | FIG-E-19 |
| 4 | `153:55` (the `✨ Generate with AI` row frame on `Brand · components`; text `153:56` is `#1a56db @ 1` today) | `Available when AI is enabled for your workspace` — `useComposerInit.ts:132-137` builds the AI client only when `isFeatureEnabled("dsAi")`, and the shipping editor reads the `NEXT_PUBLIC_` half; the CTA is disabled only when the callback prop is missing, which never happens (`DesignSystemTab.tsx:836-839` always passes it) | FIG-F-33 |
| 5 | `641:2585` and `641:2590` — the two `FROM BRAND` rows on `Components · library`. **Still outstanding:** the coordinator applied FIG-F-45's rename (the header now reads `FROM BRAND · NOT IMPLEMENTED`) but the rows are still `#111827 @ opacity 1`. | none needed; the header carries it | FIG-F-45 (rename half done) |
| 6 | *check before acting* — `153:84`, `153:86`, `153:89` on `Brand · typography` are named `[not-implemented] …` but their frames are `opacity 1` and their text is live-ink (`153:85` is `#1a56db`). If the convention is that a `[not-implemented]` block also dims, these three want the same 0.55. | none | FIG-F-04 (rename half done) |
| 7 | `1176:4945`'s specimen badge on `Canvas · hover levels` — recolour from green to `--bk-accent` fill with `--bk-accent-on` glyph. Not a dim, but a fill change and it belongs in the same script. The text row is compiled. | — | FIG-D-17 |

---

## 3. New nodes on existing boards

| board / anchor | node to add | finding |
|---|---|---|
| `32:2` (Inspector · profile · CONTAINER) | seven collapsed section header rows after EFFECTS, in profile order — SIZE, CORNER RADIUS, INTERACTIONS, ANIMATION, VISIBILITY, ELEMENT PROPERTIES, CSS CLASSES — same collapsed component + `>` chevron as `807:8614`; plus a footer text node `2 of 13 sections apply` | FIG-D-02 |
| `429:2350`, all three variants | the section header row the boards omit entirely: `Animation Enabled` (12px, `--bk-accent`, 500) + a `Disable` button on `--bk-accent-tint` | FIG-D-08 (half) |
| `1176:4942` | a 4th annotation line under the compiled one: `2px dashed accent outline · copy cursor` (`Canvas.css:270-274`) | FIG-D-17 (half) |
| `1169:4713`, after `1169:4718` | a second checkbox row, unchecked, same component: title **`Reset global styles to template defaults`**, hint **`Overrides your brand colours with the template's.`** (`TemplatesTabModals.tsx:128-133`). The first row is also missing its hint — `Keeps your work as “Home (backup)”.` Board grows 140 → ~180. | FIG-D-23 (half) |
| `1169:4753` | an optional multi-line `Description` field below the name input (`SaveTemplate.tsx:71-77`); frame 142 → ~210. Caption to add: reachable only via ⌘⇧P (no button exists anywhere); no category and no thumbnail are captured, so every saved template lands in My Templates with an empty thumbnail. | FIG-D-25 |
| `1175:4827`, under the existing `⚠` block | a red-tint 44h band `N of these are live on your published site. Deleting removes the file from storage — those images will break.` **plus** the in-use FILE→PAGE list the code already renders (`ConfirmDeleteModal.tsx:77-86` prints `filename — page, page`), which no board draws | FIG-E-02 |
| `144:2` | a one-line hint (a note, not a control): right-click a card to enter selection. `SlimLauncher.tsx:466-473` — there is no Select control anywhere on this board and nothing on screen says so. | FIG-E-07 (half) |
| the ten 280 footers `145:46`, `145:93`, `145:140`, `145:192`, `145:243`, `145:294`, `145:403`, `453:3957`, `777:4122`, `782:4382` | the third link `⬡  Icons` at the same 44h row, matching `144:46`'s spacing (`144:2` is the only board that has it today). The `☁ Stock` → `☁ Browse stock` half is compiled for all eleven. `145:300` correctly has no footer — selection mode replaces it (`SlimLauncher.tsx:595`). | FIG-E-16 (half) |
| `146:2`, under the alt-text input | an 18h line `✨ AI-generated by gpt-4o-mini · 12 Aug` (muted 11/16) with a `Regenerate` text link at its right (`AssetDetailsPanel.tsx:385`) | FIG-E-21 (half) |
| `146:2`, under `146:10` (`2400×1600 · 840 KB`) | a 3-row 18h metadata block `JPEG · uploaded 12 Aug · in Menu photos` in muted 11/16 — mime, createdAt and folder all reach the UI on `LibraryItem` (`mediaTypes.ts:73-74`) and no drawer board prints any of them | FIG-E-27 (half) |
| `1164:4713` | an `Alt text` row on the chosen-asset preview + a board note: **the selection-mode replace keeps the OLD element's alt** — `MediaCommandLayer.replaceMedia(elementId, newSrc)` (`:226-240`) takes no alt argument and `setElementSrc` (`:437-455`) writes src only. The in-flight alt work covers the two `insertMediaAt` branches and not this one. | FIG-E-32 |
| `1163:13948` and caption `155:36` | the caption half is compiled. Board note still wanted: three accept-lists, three contracts. | FIG-E-20 (half) |
| `1333:7162`, rows `1334:7196` (Classes) and `1334:7201` (Component styles) | a mono tabular numeral immediately left of the `›` (`1334:7198` / `1334:7203`), styled like the Tokens row's `4`. Values: Classes **12**, Component styles **27** (`CATALOG.length`). `DesignSystemTab.tsx:337-347` returns both counts unless `isBeginner`. Leave `154:132` (Beginner) countless — that is correct. | FIG-F-03 |
| `154:2`, under the issue list | an 11px `--bk-ink-muted` annotation: `Lint covers colour, type and spacing tokens. The other eleven token kinds are not checked.` (`useDSLint.ts:26-36` feeds only colour + spacing + type registries). Do not restate the 12-hex banned-hue list on the board. | FIG-F-15 |
| `153:29` | (b) row meta `<n> variants · <m> in use`, right-aligned, 11px `--bk-ink-muted`, on each catalog row (`ComponentsSection.tsx:151-154`); (c) the footer callout the panel ships on every visit (`:215-223`) — `--bk-accent-tint` plate, `--bk-accent-subtle` border, 11px, bold lead-in `Read-only by design:` — with the last clause changed to `… but authoring happens in the Components panel (⇧A).`, because no control on the screen jumps anywhere | FIG-F-65 (b + c) |
| beside `153:29` (annotation, **not** on the artboard) | `Saved list does not refresh — memoised on composer identity, no COMPONENT_LIST_UPDATED subscription (ComponentsSection.tsx:125). The counts shown are from panel-mount time.` | FIG-F-66 |
| `641:2546`, under the `YOUR COMPONENTS` header | an 11px `--bk-ink-muted` line `Counts cover this site. Components are shared across your workspace.` The four row-meta rewrites (`N instances` → `N on this site`) are compiled. | FIG-F-69 (half) |
| `1738:8394` | **see §7 — this one has a conflict I did not resolve.** | FIG-E-12 |
| `1716:8557`, under the provider pills | `Photos always come from Unsplash, videos from Pexels; Pixabay is unimplemented server-side.` The rename is compiled. | FIG-E-13 (half) |

---

## 4. Structural rebuilds of an existing board

- **FIG-F-16 — six preset categories → eleven, on `152:112`, `306:2111`,
  `306:2136`, `306:2161`.** I deliberately did **not** compile the six text
  rewrites on their own: renaming Buttons→Button, Cards→Card, Sections→Form
  input, Forms→Link, Nav→Badge, Footers→Alert and stopping there leaves a board
  that is differently wrong. Do it as one row-set change. The shipped set, in
  `PresetCategory` order with `CATEGORY_LABELS` display names
  (`engine/designSystem/types.ts:137-140`, `PresetDetailPane.tsx:17-29`):
  **Button · Card · Form input · Link · Badge · Alert · Tooltip · Modal · Nav ·
  Table · Layout.** Reusable row text nodes per board:
  `152:120/123/126/129/132/135`, `306:2116/2119/2122/2125/2128/2131`,
  `306:2141/2144/2147/2150/2153/2156`, `306:2166/2169/2172/2175/2178/2181` — six
  each, so five new rows per board. Keep the row height and the `<n> variants` +
  `›` shape (`Sections` and `Footers` are not categories at all).
- **FIG-F-49 — `641:2599` lower half.** Neither drawn button exists.
  `ComponentDetailScreen.tsx:269-393` is: a PREVIEW plate, Type / Tags /
  Description rows, one full-width primary `Insert Component`, a
  `tw:grid-cols-3` secondary row Duplicate · Update · Delete (Delete in the
  failure colour, Update disabled when nothing is selected), then — only when an
  instance is selected AND DS mode is Pro — an `INSTANCE ACTIONS` block with a
  single ghost `Detach instance`. Replace `I641:2648;9:7` "Edit main component"
  and `I641:2650;9:55` "Detach all"; `detachAllInstances` has no UI caller at all
  (`ComponentInstances.ts:207`, called only from `deleteComponent`). Then add a
  sibling `Components · detail · Beginner`, identical minus the INSTANCE ACTIONS
  block (`:367`).
- **FIG-F-71 — `306:2080` is the wrong object.** Replace is not a state of the
  kind list; it is a modal reached from a token's detail screen, and only when
  `consumerCount > 0` (`TokenDetailView.tsx:283-291` → `TokenReplaceModal`).
  Rebuild as ~460x200 `Brand · tokens · replace-on-delete (modal)`: title
  `Replace “primary” before deleting`, body `34 elements still use this token.
  Pick a replacement — every one of them will follow it.`, a same-kind radio list
  (accent · secondary · muted), Cancel + `Replace and delete`. Delete the
  `Replace across usages` pill `I333:2350;12:7` — the badge vocabulary is
  `draft | exported | imported | import-failed` (`SectionStatusBadge.tsx:45`) and
  that string is not in it.
- **FIG-F-11 — `306:2049` needs a decision, so I compiled nothing.** There is no
  Add affordance on the kind list at all (`TokensSection.tsx:325-406`); the only
  `+ Add token` in the product is inside the colour list (`:418`) and the modal it
  opens hard-codes `category:"colors"`, `type:"color"`, `group:"brand"`
  (`DesignSystemTab.tsx:582-593`) — thirteen of the fourteen kinds have no create
  path. Option (a) preferred by the finding: move the `Add token` badge
  (`I333:2348;12:7`) onto the colour kind's own screen, relabel it
  `+ Add colour token`, rename the board `Brand · tokens · color · add`. Option
  (b): keep it where it is and rename the board
  `[not-implemented] Brand · tokens · add — the kind list has no Add affordance; only colour tokens can be created (TokensSection.tsx:418, DesignSystemTab.tsx:582-593)`.
  A relabel-without-move is the one thing not worth doing.
- **FIG-F-55 — `642:3112` (`Components · create`, 1440x900) draws no create
  affordance.** Full-depth walk confirms: rail Insert/Layers/Pages/Media/Content/
  Brand, an open `LAYERS` panel, the inspector, and nothing else. Preferred (a):
  rebuild it with the canvas context menu open on a selected section and
  `Save as component` highlighted — that is the route the modal `1170:4777`
  opens from (`standaloneActions.ts:14`). Fallback (b): rename to
  `Components · create · context (editor frame, no create affordance drawn)`.
- **FIG-D-24 — `1169:4764` is one tab of three.** Redraw with a
  `Preview · Used in · Versions` strip at the top, `Used in` active, above the
  existing rows (`TemplateUsageDrawer.tsx:89-107`), and grow the frame. Caption
  must record that the drawer opens only from the expanded 700-wide gallery's
  detail pane and only when `usageCount > 0` (`TemplateDetail.tsx:98-106`).
- **FIG-E-15 — `147:2` icon grid is 6-up and should be 5-up.** `IconBrowserOverlay.tsx:116`
  is `tw:grid-cols-5`. I re-counted the library myself rather than trusting the
  row: **368** icons (369 `component:` lines in `icons.ts`, one of which is the
  interface field above `ICON_CATEGORIES`) across **17** categories, tile
  `tw:size-10` = 40x40, `MAX_RECENT = 12`. The caption fix is compiled.
- **FIG-E-25 — the four boards are detail crops, not screens.** Renames are
  compiled (`1704:8514`, `1705:8842`, `1705:8889`, `1717:17203`). Still to do:
  move them into a `details` sub-group so section `05 · Media` stops counting 60
  screens when four of them are annotations on one. Same adjudication path as
  SH-CO-01 — do not delete any of them.

---

## 5. New boards (clone-and-change)

Each is a clone of an existing board plus the stated change. All go in the
section named against the finding.

**Inspector / engine (`1776:8381`, `1776:8373`, `1776:8375`, `1779:5`)**

| new board | size | from | content | finding |
|---|---|---|---|---|
| `Inspector · profile · INPUT · element-properties open` | 300x812 | `807:8614` | the eight rows in order — Input Type (16 options), Name, Placeholder, Default Value, Required, Disabled, Read Only, Autocomplete — then the `Custom Data Attributes` sub-block with its add-row control; other twelve sections collapsed; footer `3 of 12 sections apply`. There is no pattern / min-length / error-message field anywhere in the code. | FIG-D-03 |
| `Animation editor · no-animation` (4th variant inside `429:2350`) | 320 wide | `429:2351` | header row `No Animation` (muted) + an `Enable` button on `--bk-border-medium`, then the amber tips block (`rgba(245,158,11,0.08)` on a `rgba(245,158,11,0.2)` border, `--bk-warning`) — and NOT the tabs, chip-grid, timing, preview or generated-css frames | FIG-D-08 |
| `Brand · typography · empty` | 280x812 | `153:57` | panel header + `‹ Typography` back row, then the single muted 12px line `No fonts set. Pick a font family under Tokens and it appears here.` (verbatim, `TypographySection.tsx:133-135`) | FIG-D-13 |
| `Layers · drop-rejected` | 280x812 | `143:60` | drag over: no `is-dragging` row, no `data-drop` insertion line, all rows at rest, and the `role="alert"` band per `layers-v2.css:483-493` carrying the copy from `index.tsx:135`. Caption: appears for 3s after the drop. | FIG-D-15 |
| `Review panel · not-entitled` | 280x812 | `157:221` | the comment list still loads (no gate on `comments.*`), and in place of the Send-for-review CTA a locked/upgrade affordance naming the entitlement. Caption: server-derived, the panel has no client-side flag. | FIG-D-31 |
| `Client sign-off · G · rate-limited · 1280` (+ a resolve-failed variant) | 1280x720 | `1339:7162` | identify card with submit disabled and a too-many-attempts message in the error slot (5 per 15 min; comments 20 per 15 min — `client-review.ts:81-82`). The resolve step has no failure surface at all. | FIG-D-33 |
| `Brand · token-detail · Beginner` | 280x812 | `152:83` | delete the id line `1700:6946`; disable `Delete token` `1700:6962`; add the notice `Delete blocked in Beginner mode.` / `Pro shows replace-with / cascade-clear when 34 elements bind.` **Note:** the finding also says to delete a CSS-var line — `152:83` has no such node. See §7. | FIG-F-08 |
| `Brand · token-detail · type or spacing` | 280x812 | `152:83` | `Rename ID` in the 0.55 disabled treatment with the inline reason `Rename isn’t available for type and spacing tokens yet` (`TokensSection.tsx:281-296`) | FIG-F-09 |
| `Brand · token-detail · lint fail` | 280x812 | `152:83` | replace `Lint / ✓ pass` with a two-line `--bk-warning-text` block `△ Contrast 3.1:1 against color-background — needs 4.5` and ONE ghost `Ignore`. **No Auto-fix button on this or any Brand board** — nothing sets `autoFixHint`. | FIG-F-10 |
| `Brand · colour-mode · all-set` | 280x812 | `153:92` | header count 0, one centred 12px `--bk-ink-muted` line `Every colour token has a dark value.` | FIG-F-21 |
| `Brand · toasts` | 1440x900 | shell toast region | four stacked: info + `Undo` action `N changes discarded`; warning `Design tokens changed from another window. Your edits may conflict.`; info `Canvas undo/redo — your unsaved design token edits were kept.`; error `Failed to apply tokens. Try again.` | FIG-F-36 |
| `Brand · tokens · spacing · reset` | 280x812 | `152:52` | spacing list with a `Reset to defaults` ghost in its header + the info toast `Spacing reset to defaults — review and Apply to save.` Note on the board that this exists for spacing only. | FIG-F-37 |
| `Brand · root · theme-locked` | 280x812 | `1333:7162` | lock glyph, `Brand managed by your workspace`, a captured-on timestamp, Tokens/Presets rows read-only. **Draw only alongside FIG-F-38's annotation** — `1333:7162` is already renamed to record that capture/push moves `projectStyles`, not `designTokens`. | FIG-F-39 |
| `Components · create (modal) · multi-selection` | 720x740 | `1170:4777` | a `--bk-warning-tint` 12px row above the Name field: `Only the first of 3 selected elements will be saved. Group them first to save the whole selection.` (`StudioModals.tsx:247-248` takes `selectionIds[0]`) | FIG-F-54 |
| `Components · sync-failed (toast)` | 720x120 | shell error toast | title `A component didn’t sync to the cloud`, body `It’s saved on this device but not yet shared across your sites. Retry now, or leave it — a reconnect replays the queue.`, one action `Retry now`, **no auto-dismiss timer bar** (`duration: Infinity`) | FIG-F-62 |
| `Components · stale-copy` | 280x812 | `641:2546` | one row with a warning dot + right-aligned 11px `--bk-warning-text` `older than the shared copy`, and a banner above the list `One component on this device is behind the version shared across your sites.` Draw only alongside a note that the pull must stop skipping known ids first (`componentSync.ts:91-93`). | FIG-F-63 |
| `Components · detail · instance out-of-date` | 280x812 | `641:2599` | the rebuilt INSTANCE ACTIONS block gains `This copy is on v1 — the component is on v3` plus `Update this copy` and `Reset to master`, with an 11px note under Reset: `Reset discards this copy’s own edits.` Annotate that `Update this copy` needs a per-instance sync caller first. **Depends on FIG-F-49 landing first.** | FIG-F-68 |
| `Components · update-from-selection (modal)` | 720x220 | the ConfirmDialog `1170:4792` uses | destructive tone, title `Update component`, body `Replace "Menu card" with the element selected on the canvas? 6 instance(s) will change to match. Any edits made on an instance are kept where they still fit, and lost where the new version no longer has that part.` + `Undo won't take the component back — it reverts the pages, not the component itself.`, Cancel · Update component | FIG-F-60 |
| `Components · update · outcomes` | — | toast region | success `"Menu card" updated — 6 instances followed.` and warning `"Menu card" updated — 6 instances followed. 2 overrides couldn’t be re-applied and were lost.` | FIG-F-60 |
| `Components · delete-confirm (modal)` | 720x180 | ConfirmDialog | use the **list view's** copy — title `Delete "Menu card"?`, body `Instances already placed keep their content; they stop following this component. This cannot be undone.`, confirm `Delete component`, destructive. Annotate that the detail screen ships a second, differently-worded confirm (`ComponentDetailScreen.tsx:396-409`) that should converge on it. | FIG-F-61 |

**Media (`1776:8372`)**

| new board | size | from | content | finding |
|---|---|---|---|---|
| `Media · local-only assets` | 280x812 | `144:2` | two of the four cards carry a 14h `⚠ device only` marker under the filename (the same 40x14 slot at (6,56) the STOCK badge uses, warning tint), and a 22h strip under the type-pill row: `2 files are only on this device — they will not publish.` Plus caption board `caption/Media · local-only` 280x54 beside `155:41`. | FIG-E-01 |
| `Media · drill-in · versions · restore-confirm` | 280x812 | `146:32` | the 32h band open. No board shows it open today. (The band's copy is compiled onto `146:65` — see §0 for the geometry it needs.) | FIG-E-03 |
| `Media · modal · replace-across · partial` | 520x300 | `1164:4738` | `Replaced on 7 of 9 places.` over a list of the two that failed with their page names, and a `Retry the 2 that failed` action. `REPLACE_PARTIAL` is emitted with `{oldSrc, newSrc, succeeded, failed}` and has **zero** listeners. The 948x80 strip `1174:4849` stays as the spec sheet it is (W-A-15). | FIG-E-05 |
| `Media · stock · not-configured` | 720x400 | `1716:8497` | `Stock search isn't set up for this workspace.` + muted `An admin needs to add the provider keys.` and **no** Try-again link. Caption must mark it blocked on a server capability endpoint — today an unset `UNSPLASH_ACCESS_KEY` returns `[]`, byte-identical to a genuinely empty result. | FIG-E-14 |
| `Media · quota-full · hit-during-upload` | 280x812 | `145:250` | the exhausted quota band ABOVE a failed-upload row whose reason reads `Not enough storage`. `QUOTA_EXCEEDED` has zero listeners; the error lands inside `Promise.allSettled` and surfaces as `N uploads failed`. | FIG-E-17 |
| `Media · fullpage · folders · rename (inline)` | 240x330 | `1205:4829` | same inline field pre-filled with the current name, committed on Enter. Note on the board: `The tree does not refresh today — FOLDER_UPDATED has no listener.` | FIG-E-18 |
| `Media · fullpage · folders · delete-confirm` | 240x~200 | `1205:4829` | name where the assets go — the server cascades folder assets to root (`shared/types/media.ts:236-238`) | FIG-E-18 |
| `Media · uploading · font` | 280x812 | `145:96` | completed row carries `Inter-Bold.woff2 added — select text on canvas, then Inspector → Font to use it.` The shipped toast cannot say this: `useUploadState.ts:126` reads `p.mimeType` and the payload's MIME lives at `p.asset.mimeType`. | FIG-E-22 |
| `caption/Media · fullpage · library` | 1440x54 | new caption, beside `1159:4593` | `The library lives in this browser's IndexedDB and in the workspace's server rows. It is NOT part of a project export or a version snapshot — ProjectData.assets is written empty (Composer.ts:616).` | FIG-E-23 |
| `Media · upload · saved-to-this-device-only` | 280x812 | `145:96` | the upload row resolves to an amber `pasta-2.jpg saved to this device only — it will not publish` with a `Retry upload` link, plus the ⚠ device-only marker on the new card. This is what the product actually produces when `BLOB_READ_WRITE_TOKEN` is missing — `AssetUploadService.ts:136-139` returns null for every failure and `MediaManager.ts:1039-1041` reads null as "offline". | FIG-E-24 |
| `caption/Media · stock (modal)` | 720x54 | new caption, above `1716:8391` | `Four orientation buttons + a 12-swatch colour row; explicit Load more, no infinite scroll. A different component from the 280 drill-in.` Keep `155:46`'s current text for the 280 drill-in — it is right about that component. | FIG-E-26 |

---

## 6. `create-board` rows carried whole (the coordinator builds these)

### FIG-D-09 — the Interactions authoring surface, three boards, section `1776:8381`

The biggest undrawn thing in the Inspector section: every profile board draws
INTERACTIONS as a collapsed `>` and no board anywhere opens it.

**(1) `Inspector · INTERACTIONS · list` — 300x812.** Profile board with
INTERACTIONS open: two interaction rows (trigger label + preset + enabled toggle
+ `▶` + `✕`) and a `+ Add interaction` light button beneath.

**(2) `Inspector · INTERACTIONS · add-trigger` — 300x812.** Four group headers,
fourteen rows, labels exactly as in `TRIGGER_GROUPS`
(`editor/inspector/sections/interactions/types.ts:69-90` — re-read today, the
line numbers in the finding point at `engine/interactions/types.ts`, which is a
different file):

- **element (5)** — 👆 On Hover · 🖱 On Click · 👇 While Pressed · 🎯 On Focus · 💨 On Blur
- **page (3)** — 📄 Page Load · 📜 Page Scroll · 👋 Page Leave
- **scroll (3)** — 👁 Scroll Into View · 🔄 While Scrolling · 👁‍🗨 Scroll Out
- **mouse (3)** — 🐭 Mouse Over · ➡️ Mouse Move · 🚪 Mouse Out

**(3) `Inspector · INTERACTIONS · edit` — 300x812.** One row expanded showing
Animation (select, 39 presets in 6 optgroups), Duration, Delay, Easing. The 39,
counted from `ANIMATION_PRESET_GROUPS` (`:93-146`) — 6+6+6+6+8+7:

- **fade (6)** Fade In · Fade Out · Fade In Up · Fade In Down · Fade In Left · Fade In Right
- **slide (6)** Slide Up · Slide Down · Slide Left · Slide Right · Slide In Up · Slide In Down
- **scale (6)** Scale Up · Scale Down · Scale In · Scale Out · Zoom In · Zoom Out
- **rotate (6)** Rotate · Rotate In · Rotate Out · Flip · Flip X · Flip Y
- **attention (8)** Shake · Bounce · Pulse · Wobble · Jello · Heartbeat · Flash · Rubber Band
- **special (7)** Blur · Glow · Swing · Tada · Hinge · Roll In · Roll Out

**The caption must state, and this is the load-bearing half:** all 14 triggers
really work on a published page (`interactionRuntime.ts:206`), but nothing
animates on the editor canvas — `Composer.setPreviewMode` has no caller anywhere
in the repo, so `InteractionRuntime` never starts — and the row's `▶` reads only
`interaction.animation`, never `interaction.trigger` (`registry/effects.tsx:105-116`),
so it plays the animation once on click regardless. **13 of the 14 triggers
cannot be exercised before publishing.**

### FIG-D-01 — `Inspector · profile · FORM`, 300x812, section `1776:8381`

Duplicate `32:2`, header chip `⬚ Form`. `elementProfiles.ts:245` maps
`form: CONTAINER_PROFILE`, so it draws the CONTAINER order — but with ELEMENT
PROPERTIES **open**, carrying exactly these five rows (verified against
`elementProperties/config.ts:210-240` today, values exact):

1. **Action URL** — text, placeholder `/submit`
2. **Method** — select: `POST`, `GET`
3. **Encoding** — select: `URL Encoded`, `Multipart (File Upload)`, `Plain Text`
4. **Disable Validation** — checkbox
5. **Autocomplete** — select: `On`, `Off`

…plus the `Custom Data Attributes` sub-block `index.tsx:339-342` always appends.
Footer count matches the sibling profile boards. That is the entire shipped form
capability: a plain HTML form POSTing to a URL the user typed — the attributes do
reach the published page (`ExportEngine.ts:1025-1036`, and `sanitization.ts:87-88`
validates `action` as a URL rather than stripping it). Note that this board
depends on FIG-D-02 landing first, since it clones `32:2`'s section list.

### FIG-D-16 — `Canvas · drop feedback — anatomy`, ~980x420, section `1779:5`

Section 09 · Canvas has ten boards and not one draws the canvas during a drag.
Five labelled specimens side by side:

1. **valid before/after** — a 3px insertion line with an 8px endcap dot at each end taking its colour from the line, plus the destination label
2. **valid inside** — dashed accent slot preview + breadcrumb trail + depth badge
3. **invalid** — 2px `--bk-error` outline on `--bk-error-tint` with the corner badge reading `Cannot nest interactive`
4. **snap guides mid-drag**
5. **drag ghost** — the cloned element in a card with an accent border and an uppercase element-type pill

Caption must record that **over empty canvas none of this is drawn** — the whole
visual block is gated on a resolved drop target (`DropFeedbackOverlay.tsx:119`).
The nine invalid-drop strings are at `:18-28`.

### FIG-E-18 / FIG-E-01 / FIG-E-05 / FIG-E-14 — folded into §5 above.

---

## 7. Prototype edge

**FIG-F-64.** Wire an edge from the topbar `⋯` site-menu row `Components` (on the
shell board) to `641:2546`, labelled `⇧A` (`SiteMenu.tsx:240`,
`useEditorShortcuts.ts:17`, `tabsConfig.ts:163`). Do **not** wire any edge from
the command-palette boards: `Toggle component view` emits `UI_TOGGLE_COMPONENT_VIEW`
and grep finds the declaration, the two emit sites and one test — **no listener**.
Removing or disabling that row on the `⌃⇧C` command-palette board in section 13
belongs to that section's owner; flagging, not editing.

---

## 8. Premises that turned out to be wrong when I read the node or the code

These are the reason to read before compiling. Each one changed what I wrote.

1. **FIG-D-23 has the token claim backwards.** It says "The token claim itself is
   true: the HTML is token-resolved against a computed-style snapshot before
   import." The shipped modal says the opposite, in a sentence written
   specifically to correct that belief: *"The template brings its own colours and
   type — your brand tokens are not applied to it."* The comment above it
   (`TemplatesTabModals.tsx:99-108`) records that `templatesData.ts` contains no
   `var()` reference to a single design token and over a hundred hardcoded hex
   values, several in families DESIGN.md bans — "someone who set a brand colour
   and applied a template got the template's palette, with no warning." I compiled
   the shipped sentence, not the finding's. The board's title also uses straight
   quotes where the code uses curly (`Replace this page with ‘${template.name}’?`)
   — I did **not** compile that; it is a one-character fix if you want it
   (`1169:4714`).
2. **FIG-F-35's EDIT contradicts its own TRUTH.** Its truth section says "The
   shipped copy is `Drop .json or .ts`" — and `ImportCard.tsx:272` renders exactly
   that. Its edit then asks for all four boards to read `Drop .json`, which would
   make them disagree with the product. `153:120` already reads `Drop .json or .ts`
   and I left it alone; I compiled the three export boards (`306:2261`, `306:2294`,
   `306:2327`) from `Drop .css or .json` **to the shipped string**. `.css` is
   right to remove — the accept-list is `application/json,.json,.ts,.js`.
3. **FIG-F-13 scoped the damage too narrowly — row 1 is wrong too, and I did not
   touch it.** The rule is real, but the message is not: `buildContrastIssues`
   (`contrastLint.ts:82-86`) produces `` `${t.name || t.id} fails WCAG AA against
   the page background` `` — **no ratio, no target**. Board row 1 reads
   `Contrast 3.1:1 — needs 4.5`, a number the linter never emits. Its sublabel
   `accent-on over accent` is also not the shipped shape: every row's second line
   is `{RULE_LABEL[rule]} · {tokenId}` (`LintSection.tsx:88-90`), which for this
   rule is `Fails WCAG AA on the page background · accent-on`. I left row 1 alone
   because F-13 explicitly says to keep it — **this needs a coordinator decision**,
   and it is the row I would most want changed.
4. **FIG-F-08 asks me to delete a node that is not there.** It describes `152:83`
   as drawing "name, id `color-primary`, CSS var, Light value, Dark value…".
   Full walk today: `1700:6945` name, `1700:6946` id, `1700:6948/6949` Light,
   `1700:6951/6952` Dark, `1700:6954/6955` Used by, `1700:6957/6958` Lint, three
   buttons. **There is no CSS-var line.** The Beginner clone therefore hides one
   thing, not two.
5. **FIG-E-12's target already carries a contradicting annotation.** `1738:8394`
   has two live text nodes: `1738:8411` — *"The grid behind still reads 'No photos
   found' — the product cannot tell the user the difference"* — and `1738:8412`,
   which says `setStockPhotos` is never called on failure so the modal falls
   through to the empty-result copy. That was true before `searchFailed` existed;
   `useDiscoveryState.ts:121` now sets it and `StockSourceModal.tsx:354-366`
   renders a real failure branch, so those two lines are **now false for the 280
   drawer and still true for the fullpage**, which is exactly FIG-E-12's point.
   I did not compile anything here, because the finding says "add a note" and the
   honest fix is to rewrite the two that are there. Proposed, for your call:
   `1738:8411` → `Reachable from the 280 drawer only — MediaTab passes searchFailed.`
   and `1738:8412` → `The fullpage library mounts the same modal without the prop (LibraryManager.tsx:467-486), so a failed request there still renders "No photos found" and the only signal is a toast that auto-dismisses. useDiscoveryState.ts:121 is the sole writer.`
6. **FIG-D-12 and FIG-D-13 collide on the same three nodes.** D-12 sets all three
   ACTIVE FONTS labels to `N weights in use`; D-13 wants one of them to read
   `not used yet` so the per-row empty is drawn somewhere. I compiled D-12 for all
   three (it is the shipped shape for a used family — `TypographySection.tsx:160-165`)
   and left D-13's overlay to you: flipping `153:82` to `not used yet` afterwards
   is one more text row and would satisfy both.
7. **FIG-F-19's quoted board name is stale, as the brief warned.** It says
   `306:2161` is "already renamed 'UNBUILDABLE today — …'". It is not; the
   coordinator's rename reads `[not-implemented] Brand · presets · draft — …
   (usePresetsForCategory.ts:67-88)`. My compiled rename extends the **current**
   string. Same shape: FIG-E-13 asked for a leading `NOT IMPLEMENTED —`, which is
   not this file's convention; I used the `[not-implemented] ` prefix that
   `306:2111/2136/2161` establish.
8. **FIG-D-06's caption target was a placeholder.** `429:2524`
   (`caption/B9.1 Animation editor`) contained the literal string `"ttt"`. Nothing
   was lost by rewriting it.
9. **FIG-F-45's rename landed but its dimming half did not.** The header now says
   `FROM BRAND · NOT IMPLEMENTED`; rows `641:2585` / `641:2590` are still
   `#111827` at full opacity. Listed in §2.

---

## 9. Coverage — what I opened, and what I did not

The brief flagged that FIG-E's author read the interiors of only 15 of 43 Media
boards. Every Media board I compiled a row against or wrote a deferral for was
walked today, full depth, with `INSTANCE` children included:

- **Full walk:** `144:2`, `145:2`, `145:148`, `145:300`, `145:359`, `146:2`,
  `146:32`, `147:2`(name), `1164:4713`, `1175:4827`, `1205:4829`, `1716:8497`,
  `1716:8557`, `1738:8394`.
- **Targeted text search across the interior** (`Stock` / `Icons` / `⊞`), which
  is what the footer and folder-row rows needed: `145:49`, `145:96`, `145:199`,
  `145:250`, `453:3931`, `777:4093`, `782:4353`.
- **Name + size only:** `1159:4593`, `1163:13695`, `1163:13948`, `1704:8514`,
  `1705:8842`, `1705:8889`, `1716:8391`, `1717:17203` — all of these are
  deferral targets where I needed the current name (for a rename) or only the
  frame identity.
- **Not opened:** the remaining ~20 boards in section `05 · Media` that no row in
  my three lanes targets. I make no claim about them.

Outside Media I walked `154:2`,
`152:83`, `152:112`, `152:137`, `153:29`, `153:57`, `153:92`, `153:120`,
`306:2049`, `306:2080`, `306:2111`, `306:2136`, `306:2161`, `306:2186`,
`306:2232/2265/2298`(targeted), `429:2350`, `641:2546`, `641:2599`, `642:3112`,
`778:4173`, `1169:4713`, `1169:4753`, `1169:4764`, `1172:4840`, `1176:4925`,
`1333:7162`, `1334:*`, `154:132`, `1170:4777`, and the fifteen `155:*` / `788:*`
caption nodes.

`32:2` itself (FIG-D-02's target) I confirmed only as a frame —
`Inspector · profile · CONTAINER (fallback)`, 300x812 — and did **not** walk its
interior; the deferral is a structural instruction that does not depend on its
current child ids. Same for `143:60`, `157:221` and `807:8614`, which are clone
sources for deferred new boards.

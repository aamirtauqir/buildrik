# Inspector — strict product audit and proposed architecture (APPROVAL GATE)

Status: **APPROVED ARCHITECTURE (owner, 2026-09-27) — DESIGNED, NOT IMPLEMENTED.** Owner decisions are in "Owner approvals" below and supersede the matching recommendations and prior DD rows. Build starts only on the owner's word: prerequisite defects P-1…P-13 and the type fix (Q2) first, then layout. Eng review recommended before build.
Date: 2026-09-27 · Build: main @ 8e9a3ccb2 · Method: code trace of `packages/editor/src/editor/inspector/**` and every
module it touches, plus live headless walks (1440×900, `/edit/scratchver0000000000000001`) by five parallel auditors.
Cross-checked against `2026-09-27-inspector-redesign.md` (DD-1 … DD-22) and `…-inventory.md`.

Principle applied throughout: **primary ownership ≠ contextual access.** A feature owned by CMS, Brand, Components,
Assets, AI, Pages or Forms stays in the Inspector when the user needs it *for the current selection*; the Inspector
exposes that slice and links to the owner for the rest.

Evidence tags: **LIVE** = observed in the running app; **CODE** = read from source. Paths are relative to
`packages/editor/src/editor/` unless they start with `engine/`. Screenshots: session scratchpad `insp/{types,int,dep,dup,ds}/`.

---

## 0. The five things this audit changes about the plan

1. **The Inspector is not really keyed per element type.** 21 of 54 Add-panel inserts arrive as a type with no profile of
   its own (checkbox, radio, switch, label, card, table, spacer, tabs, stack, social icons, lottie, video/map embed →
   `container`; CTA → `section`; navbar → `nav`). They all read "Container" and get Link, CMS and Typography. **Any
   "type block" (DD-3) depends on fixing selection-type identification first.** (LIVE, `shared/utils/html/typeMapping.ts:16-101`, `blocks/blockRegistry.ts:364-389`)
2. **The most harmful problems are defects, not layout.** Locked elements edit and delete; binding to CMS wipes text;
   gradients leak editor tokens into published sites; the colour/token popover is invisible; leaving to Brand/Assets drops
   the selection. These must be fixed before or with any redesign (§17.P).
3. **"Duplicate" is mostly the wrong diagnosis.** Most repeated entry points are valid contextual doors. The real
   problem is **one label, several implementations, different results** (Delete, Paste style, Duplicate, Replace media,
   Open-in). Keep the doors; converge the implementations on the shared command layer.
4. **Context is lost on every escalation.** Full-page surfaces clear the selection (`shell/StudioPanels.tsx:519`); the AI
   panel unmounts the Inspector (tab, scroll, `:hover` reset); scroll memory never works (`inspector/ProInspector.tsx:268`).
5. **Five prior decisions need revision** (DD-8, DD-9, DD-14, DD-17, DD-18) and one needs an explicit product decision
   (DD-1 tab structure) — see §17.C.

---

## 1. Current Inspector inventory (complete)

Full control-level inventory with file:line is in `2026-09-27-inspector-redesign-inventory.md` (Chrome, Style,
Settings, Effects, per-type Advanced fields, duplicates, scope/state machinery). Additions discovered in this pass:

| Area | Items added by this audit | Evidence |
|---|---|---|
| Popovers | ColorFillPopover (brand swatches, Edit token → Update everywhere / Only this element), TokenPickerPopover, FontPickerDropdown (search, categories, "Manage site fonts"), Icon picker modal, media picker (drawer pick mode), Save-as-component modal, Create-collection modal, confirm dialogs (Detach, Reset, multi Delete) | `shared/ColorFillPopover.tsx`, `TokenPickerPopover.tsx`, `sections/typography/FontPickerDropdown.tsx`, `sections/elementProperties/index.tsx:110`, `sidebar/tabs/media/data/assetPick.ts` |
| Doors into the Inspector | canvas "Bind to CMS field…", canvas "Add interaction", ⌘K "Jump to property" (tab + section + field focus) | `canvas/menus/actions/standaloneActions.ts:61-85`, `inspector/hooks/usePropertyJump.ts:88-131` |
| Doors out | token chip → Brand token; Whole site → Brand; Manage SVG → Asset library; Edit master → Components panel; ✦ AI → AI column; "Manage site fonts" → modal; empty-state "Set Brand Colors" | `ColorInput.tsx:136-139`, `ProInspector.tsx:526-577`, `MediaSourceRow.tsx:91-92`, `VariantSection.tsx:72-75` |
| Server-backed controls | Form "After submit" (writes `forms.updateBlock` immediately, outside Undo; notifyEmail needs ADMIN, enforced only server-side) | `sections/FormAfterSubmitSection.tsx:22-26,86-99` |
| Hidden behaviours | Style clipboard (`composer.styleClipboard`), per-type section open memory (localStorage), tier memory, scroll memory (broken), "Template applied" 30-min empty state | `InspectorElementMenu.tsx:177-199`, `useInspectorSections.ts`, `ProInspector.tsx:268` |
| Not present anywhere | comments/review per element, localization per element, accessibility checks beyond alt, embed/URL field for embeds, audio source, countdown/progress/accordion settings, ecommerce binding | CODE (grep) |

Measured load (LIVE, all sections open, Pro): Heading 142 controls, Button 152, Image 116, Flex container 165 (Style
scroll 1317px ≈ 2 screens), Page body 130. Effects tab is identical on every type (44 controls). First view of a heading in
the default Beginner tier: 52 controls.

## 2. Discovered selection types (summary; full matrix in §3)

~36 types + 12 special states. Selection mechanics: click = deepest element; Shift = add; ⌘-click = cycle stack;
double-click = first child / inline edit on text; locked = canvas refuses, Layers selects; repeater clones select the
template; no on-canvas component-master mode. Defect: clicking the primary element of a multi-selection keeps the
multi-selection (`engine/SelectionManager.ts:30-31`, LIVE).

## 3. Selection type → Inspector capability matrix

Common to all rows today (to be revised by §22): header (icon, rename, ✦ AI, ⋯), context row (Applies to, state pill),
Settings Visibility/Content(CMS)/Advanced/CSS classes, Effects 31–45 controls, token chips → Brand.

| Selection type | Relevant (should show) | Conditional | Cross-module integrations | Irrelevant today | Advanced | Escalation |
|---|---|---|---|---|---|---|
| Nothing selected | Page panel (DD-13) | Template-applied banner | Brand, Pages settings | — | — | Page settings (full page — must not drop context) |
| Page root | Page panel (same) | — | Brand tokens | Link, CMS, Visibility, Interactions; header says "Container" | page CSS classes | — |
| Heading / Text / Paragraph | Type (level for heading, text style), Typography, Size, Spacing, Fill, Border; Link only if wrapped | Flex-item when parent is flex | CMS text binding, Brand tokens, fonts, AI, Interactions | Gap | letter/word, white-space | inline edit |
| Link | Link (dest, target, rel), Typography, Size, Spacing, Fill, Border | anchor/page/email fields by type | Pages, CMS href | Advanced Open In/Rel duplicate | rel, title | page picker |
| Button / Submit / Modal trigger | Label (inline), type, disabled, Link | submit inside form | Link, CMS text, Interactions | Open In duplicate | — | — |
| Image | Source + alt + fit (+ loading/decoding advanced), Size, Spacing, Border | — | Assets picker, CMS src | alt buried | loading, decoding | Assets picker (drawer) |
| Video | Source, poster, autoplay (+muted warning), loop, controls, inline | autoplay ⇒ muted | Assets | CMS "content" | preload | Assets picker |
| Audio | **Source (missing today)**, controls/loop/autoplay | — | Assets | CMS | — | Assets picker |
| SVG inline / Icon | Glyph (icon picker) / source; size, stroke | — | Assets / Icon picker | misleading "No source yet" | — | picker |
| Embeds (video/map/lottie) | **URL / embed field (missing today)**, size | — | — | Link, CMS, Typography | — | — |
| Container / Section / Card / Stack / Tabs / Table | Layout, Size, Spacing, Fill, Border, Link (card/section/container) | Flexbox/Grid when display flex/grid | Link, (CMS only if bindable) | CMS on non-bindables | Text inside, position | — |
| Structural child (`<source>`, `<circle>`, `<option>`, `<li>`, `<td>`) | Minimal panel: size/spacing/fill only, or parent-first | — | — | full container panel incl. Link/CMS | — | select parent |
| Flex / Grid / Columns | Direction/align/wrap/gap or template/flow/gap | item controls on children | — | Spacing gap duplicate; Columns shows no Grid | item placement | — |
| Form | Fields, After submit, Layout | — | Forms backend (server) | CMS | action/method/encoding | — |
| Input (9 kinds) / Textarea / Select | Type, name, placeholder, required, disabled, default; Typography (not for color/range/file) | per input type | parent form Fields (no link today) | CMS; Typography on color/range | autocomplete, readonly | parent form |
| Checkbox / Radio / Switch | Inner input's props at the wrapper level | — | form | wrapper = container with Link/CMS | — | — |
| Slider / Carousel | Slides, Playback | interval when autoplay | — | CMS | — | — |
| Accordion / Progress / Countdown / Testimonials / Pricing | **Type settings missing** (open item, %, target date) | — | — | CMS | — | — |
| Collection list | Collection source + limit, Layout | child shows list-field binding | CMS | — | — | **Open collection** (missing), Create collection (only when zero) |
| Component instance (root) | Component row (variant, Edit master, Reset, Detach), per-field override marks | variants | Components | — | — | Components panel (needs return path) |
| Child inside instance | Same as its type + "inside {component}" mark | — | Components | not detected today | — | Edit master |
| CMS-bound element | Binding status + field + preview + unbind + **Open record** | disconnected state | CMS | raw id shown when source deleted | — | CMS workspace |
| Element with interactions | Interactions list | — | Interactions/Animation | — | — | inline drill-in |
| Locked | Read-only values + Unlock | — | Layers | controls editable (defect) | — | — |
| Hidden on current device | Visibility toggles | — | Breakpoints | — | — | — |
| :hover/:focus/:active/:disabled | State chip on style tabs | override dots | — | state banner on non-state tabs | — | — |
| Tablet / Mobile | Breakpoint chip + overrides | — | Breakpoints | banner on non-style tabs | — | — |
| Multi-select (same / mixed) | Same panel, shared sections, Mixed, align/distribute/group | Distribute ≥3 | AI | value-shaped placeholders | — | — |
| Inline text range | (rich-text toolbar owns it) | — | — | — | — | — |
| Viewer / read-only session | Today: no Inspector at all | — | — | — | — | — |

## 4. Inspector responsibility model (Phase 2)

**The Inspector is the contextual control surface for understanding and configuring the current selection.** In
Buildrik that means five jobs, in this order of priority:

| Job | What it covers | Inspector role |
|---|---|---|
| 1. **Identify** | What is selected (true type, name, parent path), what it is connected to (component, CMS, tokens), whether it can be edited (locked, role), where edits land (breakpoint, state) | Primary owner (status display) |
| 2. **Define** | The properties that make the element what it is (heading level, image source + alt, input type/name/required, link destination, embed URL, collection source, form fields, slides) | Primary owner |
| 3. **Present** | Layout, size, spacing, typography, fill, border, depth/effects | Primary owner |
| 4. **Behave** | Visibility per device, interactions/animation, form after-submit, slider playback | Primary owner (after-submit = contextual configuration of a server feature) |
| 5. **Connect** | CMS binding, brand tokens, component link, media source, fonts | Contextual integration: configure the slice for this element; deep-link to the owner for the rest, with a return path |
| 6. **Act** | Element actions (duplicate, copy/paste style, apply style to page, save as component, lock, delete) | Contextual shortcut to the shared command layer — never its own implementation |

Not the Inspector's job: managing libraries (Brand, Assets, Components, CMS), site/page settings beyond the Page panel,
editing other elements, workspace settings.

## 5. Feature ownership map

| Capability | Primary owner | Inspector role | Keep in Inspector? |
|---|---|---|---|
| Style properties (layout → effects) | Inspector | Primary | Yes |
| Element attributes (level, alt, input props, embed URL) | Inspector | Primary | Yes (type block) |
| Link destination | Inspector (Pages supplies targets) | Primary + contextual (page picker) | Yes |
| Visibility per device | Inspector (Breakpoints) | Primary | Yes — fix tablet write |
| Interactions / animation | Inspector | Primary | Yes |
| Form fields / after submit | Inspector + Forms backend | Contextual configuration | Yes; mark server-saved |
| Slider slides / playback | Inspector | Primary | Yes |
| CMS binding | CMS | Contextual integration + status | Yes; add Open record, disconnected state |
| Collection list source | CMS | Contextual integration | Yes; "+ New collection…" always |
| Brand tokens / colours / fonts | Brand | Contextual integration (pick, bind, "update everywhere") + deep link | Yes; fix popover; keep return |
| Component instance (variant, reset, detach, edit master) | Components | Contextual integration | Yes; add override marks + return |
| Media source | Assets | Contextual integration (picker) | Yes; one writer; drawer pick for SVG too |
| AI edit | AI panel | Contextual shortcut (✦) | Yes, one door in the panel; preserve state |
| Element actions | Shared command layer | Contextual shortcut | Yes; converge implementations |
| Rename, select parent | Layers / canvas | Contextual shortcut | Yes (name field, breadcrumb) |
| Site-wide style (Whole site) | Brand | Not relevant (writes nothing) | Remove |
| Hide inspector | Shell | Panel chrome | Yes, as header ✕ (not in ⋯) |
| Comments on element | Review | Candidate status display | Product decision |
| Ecommerce product binding | (none today) | Candidate | Product decision |

## 6. Cross-module integration map (Phase 5)

| Source capability | Owner | Inspector entry | Context passed | Destination / surface | Return behaviour today | Permission | Verdict |
|---|---|---|---|---|---|---|---|
| Media pick (image/video) | Assets | "Choose image" / "Manage video" | element label | Left drawer pick mode | selection, tab, scroll kept; cancel leaves drawer on Assets | none | Keep; restore previous drawer tab |
| SVG source | Assets | "Manage SVG" | asset | **Full-page library** | **selection lost** | none | Move to drawer pick mode |
| Brand token | Brand | token chip | tokenId | Full-page Brand | **selection lost**; chip may no-op if Brand already open (CODE) | none | Keep; preserve selection + return |
| Colour / token pick | Brand | colour swatch | tokenId | Popover | **invisible (clipped)** | Pro search | Keep; portal to overlay root |
| Whole site | Brand | scope dropdown | none | takeover → full page | selection lost | none | Remove (DD-6a) |
| Site fonts | Brand/fonts | "Manage site fonts" | none | Modal | kept | none | Keep |
| AI | AI panel | ✦ chip, ⋯, canvas, ⌘J/I/⌘K | selection | Right column (replaces Inspector) | **tab, scroll, :hover reset; Esc also deselects** | viewer toast | Keep; preserve state; stop Esc |
| Components | Components | Edit master / Variant / Reset / Detach / Save as component | componentId / selection | drawer detail / modal | no "back to instance" | none | Keep; add return crumb |
| CMS binding | CMS | Content section; canvas "Bind to CMS field…" | element, collection, field | inline | kept | none | Keep; limit to bindable types; add Open record + disconnected state |
| Create collection | CMS | "Create collection" | none | Modal | only when zero collections | none | "+ New collection…" always; return pre-selects |
| Collection list | CMS | Collection section | limit | inline | — | plan limit | Keep; add "Open collection ›" |
| Forms after submit | Forms (server) | After submit | siteId, blockId | inline, server-saved | outside Undo; notifyEmail role only server-side | ADMIN for email | Keep; label + gate up front |
| Links | Pages | Link section | pages list | inline | — | none | Keep; fix type-change leftovers; deleted-page warning |
| Interactions | Inspector | Interactions | element | inline drill-in | inline back | none | Keep; validate timing |
| ⌘K Jump to property | Command palette | palette rows | tab, section, field | Inspector | works (not while AI covers) | — | Keep |
| Canvas "Add interaction" | Canvas | right-click | section | Inspector › Effects | works | — | Keep |
| Style clipboard | Canvas/keyboard | ⋯ Copy/Paste | clipboard | inline | ⋯ replaces, ⌥⌘V merges | — | Keep door; one merge implementation |
| Lock | Layers/canvas | Locked banner Unlock | — | inline | — | — | Keep; enforce lock on writes |
| Breakpoints / states | Canvas shell | context row, override strip | bp, pseudo | inline | pseudo lost on AI return | — | Keep; chips |
| Viewer role | Permissions | whole Inspector hidden | — | — | — | VIEWER | Product decision (DD-18) |

## 7. Module-cohesion findings

| ID | Finding | Evidence | Decision | P | Conf |
|---|---|---|---|---|---|
| C-1 | Effects tab mixes visual depth (opacity, shadow, filters) with behaviour (Interactions); identical 44 controls on every type | LIVE counts; `registry/effects.tsx` | PRODUCT DECISION (tab structure, §24 Q1) | P1 | High |
| C-2 | Settings tab mixes definition (Advanced fields), behaviour (Link, Visibility), connection (CMS) and developer attributes (ID, classes) | registry/element.tsx | REORGANIZE: definition → type block (DD-3); rest stays as Behaviour | P1 | High |
| C-3 | ⋯ menu mixes AI, navigation, panel chrome and element actions | `InspectorElementMenu.tsx:236-297` | REORGANIZE (DD-8 revised) | P1 | High |
| C-4 | "Whole site" scope is a site-level signpost inside an element panel | ProInspector.tsx:526-577 | REMOVE | P1 | High |
| C-5 | After-submit writes to the server outside Undo while every other control is undoable | FormAfterSubmitSection.tsx:86-99 | KEEP + label "Saved to your site settings" | P2 | High |

## 8. Feature-relevance findings

| ID | Finding | Evidence | Decision | P | Conf |
|---|---|---|---|---|---|
| R-1 | 21/54 inserts identified as a type with no profile ("Container") | typeMapping.ts, LIVE | **Prerequisite: fix type identification** (use block id / `data-buildrik-type`) | **P0** | High |
| R-2 | CMS Content renders on every type (video, icon, divider, containers, page root) and binds "content" there; canvas action allows 6 types | ContentSection.tsx:48-52; standaloneActions.ts:18 | MAKE CONDITIONAL (bindable types; one list) | P1 | High |
| R-3 | Page root reads "Container" with Link, Visibility, CMS, Interactions | LIVE | MOVE to Page panel (DD-13) | P1 | High |
| R-4 | Structural children get the full container panel incl. Link/CMS | LIVE | MAKE CONDITIONAL (minimal panel) | P2 | High |
| R-5 | Embeds, audio have no source/URL control; countdown/progress/accordion no type settings | LIVE | ADD to type block (product decision on which) | P1 | High |
| R-6 | Typography shown on color/range/file inputs; missing on select | LIVE; typography.tsx:32-33 | MAKE CONDITIONAL | P2 | High |
| R-7 | Gap editable on non-flex elements; Size "Fill/Hug" enabled on inline elements | SpacingSection.tsx:175; layout/index.tsx:114 | MAKE CONDITIONAL | P2 | High |
| R-8 | Columns shows no Grid section; class-driven flex/grid shows none | LIVE; cssContext.ts:118-133 | Fix condition to computed display | P2 | Med |

## 9. Duplicate / redundancy findings (Phase 6, strict rule)

| ID | Capability | Classification | Decision | P | Conf |
|---|---|---|---|---|---|
| D-1 | AI: ✦ chip vs ⋯ "Improve with AI" | REDUNDANT ENTRY POINT (same surface, same result) | REMOVE ⋯ row; keep chip, canvas, keys | P2 | High |
| D-2 | Delete: ⋯ uses bare `removeElement` (deletes locked, no txn) vs shared command | DUPLICATE FUNCTIONALITY with safety defect | MERGE onto command | **P0** | High |
| D-3 | Paste style: ⋯ / canvas replace vs ⌥⌘V merge | DUPLICATE FUNCTIONALITY, different result | MERGE onto merge semantics | P1 | High |
| D-4 | Duplicate: 4 implementations | DUPLICATE FUNCTIONALITY (diverging) | MERGE onto command | P1 | High |
| D-5 | Multi-select Delete double confirm | Defect | MERGE (pass confirmed) | P1 | High |
| D-6 | Replace media: Inspector vs ⌘K write paths | DUPLICATE FUNCTIONALITY | MERGE onto one writer | P2 | Med |
| D-7 | Classes: ID&class string vs chips | DUPLICATE FUNCTIONALITY | MERGE into chips (+multi-class paste) | P2 | High |
| D-8 | Open-in ×3 (Link, Advanced Open In, Advanced Rel) — conflicting writers; Link `_self` wipes custom rel | DUPLICATE (conflicting) | MERGE into Link section (add Rel field) | P1 | High |
| D-9 | Text ×3: canvas inline (primary), "Edit text on canvas" (only keyboard route), Advanced textarea (plain text, conflicts with rich text) | textarea REDUNDANT; row VALID SECONDARY | REMOVE textarea; KEEP row until Enter/F2 edit key exists | P2 | High |
| D-10 | Width/height: Layout selects vs Size (same helpers) | DUPLICATE only once Beginner tier goes | MERGE with DD-5 | P2 | High |
| D-11 | Gap ×4 (Spacing, Flex, Grid, Columns — Columns ignores breakpoint) | DUPLICATE once tier goes | MERGE with DD-5; fix Columns writer | P2 | High |
| D-12 | Shadow ×3, filters ×2 | RELATED BUT DIFFERENT | MERGE homes, keep controls | P2 | High |
| D-13 | Visibility ×3 (CSS visibility, Display None, per-device) + Layers eye + CMS conditions | RELATED BUT DIFFERENT (5 mechanisms) | KEEP all; label each; fix per-device | P1 | High |
| D-14 | Select parent: ⋯ vs ← key vs breadcrumb | ⋯ REDUNDANT once breadcrumb exists | MOVE to breadcrumb | P2 | High |
| D-15 | Pick on canvas | REDUNDANT (Layers covers locked) | REMOVE row (keep event for CMS) | P2 | High |
| D-16 | CMS Unbind: banner vs Content Static | VALID CONTEXTUAL (saves a tab switch) | MERGE into header status chip (DD-17) | P2 | Med |
| D-17 | Whole site → Brand | UNNECESSARY CROSS-SURFACE DUPLICATION | REMOVE | P1 | High |
| D-18 | Save as component: ⋯/canvas vs Components "+ Create" (different event, no binding extraction) | RELATED BUT DIFFERENT | Converge on one helper | P2 | Med |

## 10. Discoverability findings

| ID | Finding | Decision | P |
|---|---|---|---|
| F-1 | Defining props (level, alt, input required, video playback, icon glyph) buried in closed "Advanced" | MOVE to type block (DD-3) | P1 |
| F-2 | Flex direction/align hidden by Beginner tier | REMOVE tier (DD-5) | P1 |
| F-3 | Brand-colour binding unreachable (popover clipped) | Fix surface | **P0** |
| F-4 | "Add tokens in Brand" is plain text; header Bound chip not clickable | LINK | P2 |
| F-5 | No door from a bound element to its record/collection; Create collection only when none exist | ADD contextual links | P1 |
| F-6 | Hide inspector reachable only via ⋯; no shortcut; comment claims a header ✕ that doesn't exist | MOVE to header ✕ + shortcut | P2 |
| F-7 | Jargon labels: A-Cont, J-Self, Row-R, sta/cen/bet/aro/eve, Will Change, Decoding, Preload | RENAME to plain words + icons with tooltips | P2 |
| F-8 | Transform segment shows "Aa" for both None and Capitalize | Fix glyphs | P2 |
| F-9 | Override dots only on Size/Z-index; pseudo overrides have none | Extend (DD-14) | P2 |

## 11. Cognitive-load findings

| ID | Finding | Decision | P |
|---|---|---|---|
| L-1 | 116–165 controls per element; flex container ≈ 2 screens | Progressive disclosure per §9 exposure table; empty sections as "+" rows (DD-11) | P1 |
| L-2 | Settings/Effects open everything by default | One open rule (DD-11) | P1 |
| L-3 | Three signals for one binding on a colour field (link icon, blue hex, green chip) in two colours | One binding indicator pattern | P2 |
| L-4 | State/breakpoint banners repeated on tabs where writes ignore them | Chips only on style tabs (DD-14) | P2 |
| L-5 | 9 button heights, 6 radii, 3 focus styles, 4 popover/menu implementations | Consolidate on chrome-ui (§15) | P2 |

## 12. Interaction-dependency findings (Phase 10)

| ID | Finding | Evidence | P |
|---|---|---|---|
| X-1 | Switching Background type doesn't clear the old fill; gradient still covers new colour; Fill reads only `background-color` | BackgroundSection.tsx:111,126 (LIVE) | P1 |
| X-2 | **Gradient writes `var(--bk-accent)` / `var(--bk-success)` (editor chrome tokens) into the customer site; export never defines them** | BackgroundSection.tsx:154,172,186 (LIVE) | **P0** |
| X-3 | Link type change leaves old href / target / rel | LinkSection.tsx:189-196 (LIVE) | P1 |
| X-4 | Resetting a field under `:hover` does nothing (rule writer merges) | engine/styles/StyleEngine.ts:84-87; useStyleHandlers.ts:220-239 (LIVE) | P1 |
| X-5 | Breakpoint Revert leaves stale `breakpointStyles` that the exporter reads | StyleEngine.ts:257-273; ReactExporter.ts:201 (LIVE) | P1 |
| X-6 | Emptying a numeric field shows blank while the old value stays applied | InputControls.tsx:203-210 (LIVE) | P2 |
| X-7 | Interaction duration accepts empty (NaN) and negative | InteractionEditor.tsx:84,93 (LIVE) | P2 |
| X-8 | Checkbox attrs stored as `""` read unchecked; captions show state not name ("Disabled ☐ Disabled") | PropertyField.tsx:95,98 (LIVE) | P1 |
| X-9 | Video autoplay without muted: no warning (browsers block it) | LIVE | P2 |
| X-10 | Collection change unbinds before a field is picked; banner Unbind untracked in history | ContentSection.tsx:129; BindingBanner.tsx:84 | P2 |
| X-11 | Leaving flex keeps flex props stored; returning to static keeps offsets; no feedback | CODE | P2 |
| X-12 | Advanced attributes, Link and Variant load once per selection and go stale after Undo | elementProperties/index.tsx:247; LinkSection.tsx:140 | P2 |
| X-13 | Per-device Visibility at Tablet writes a rule the canvas/export never read | useStyleHandlers.ts:243-248; Canvas.css:762-767 (LIVE) | P1 |

## 13. Surface / escalation findings (Phase 11)

| Feature | Today | Proposed surface | Return path |
|---|---|---|---|
| Colour / token pick | clipped popover | Popover portalled to overlay root | click-away; selection untouched |
| Open token in Brand | full page, clears selection | full page, **selection preserved** | "Back to canvas" → same element, tab, scroll |
| AI | replaces Inspector (unmount) | right column, Inspector kept mounted/hidden | "‹ Inspector" restores tab, scroll, state; Esc closes AI only |
| Manage SVG | full-page library, clears selection | drawer pick mode (like image) | cancel → previous drawer tab |
| Create collection | modal, only when zero | modal from "+ New collection…" in the select | back to Content, new collection pre-selected |
| Edit master | Components drawer | same + "‹ Back to instance" | re-select instance |
| CMS record | none | "Open record ›" → CMS workspace | Back to canvas → bound element |
| Page settings (SEO, from Page panel) | full page | full page, selection preserved | back |
| Interactions / Site fonts / Save as component | inline / modal / modal | unchanged | works |

## 14. State-model findings (Phase 14)

| State | Trigger | Today (LIVE) | Proposed feedback & actions | Data safety |
|---|---|---|---|---|
| Nothing selected | empty click | text only | Page panel | safe |
| Locked | element locked | banner; **controls editable; ⋯ Delete deletes** | read-only values + Unlock; enforce in write path and commands | **unsafe today** |
| CMS-bound | binding | chip + banner + raw id | status chip (clickable) + section; preview; Open record | **text wiped on bind with no published records** |
| Disconnected binding | collection/field deleted | raw id; empty section | "Source missing — reconnect or unbind" in chip + section | value preserved |
| Missing asset / page / token / font | deleted elsewhere | no indicator | warning chip on the affected field with fix action | — |
| Override (breakpoint / state / master) | edits | strip + dots on Size only; no master marks | chips + dots on every field; reset per field | stale export (X-5) |
| Mixed | multi-select | "000000" placeholders | "Mixed" text | — |
| Validation error | bad input | red + silent revert; hex silently rejected | inline message + aria-describedby; Esc restores | safe |
| Saving / conflict | save / 409 | not reflected; edits keep piling behind conflict modal | Inspector read-only while a conflict is unresolved (product decision) | risk |
| Processing (AI run, upload) | run | takeover; context row stays live | disable context row too | — |
| Server-saved field | after submit | silent | "Saved to your site" note; role gate before edit | outside Undo |
| Permission-limited (viewer) | role | no Inspector | PRODUCT DECISION: read-only Inspector (new) vs keep hidden | safe |
| Selection deleted / undo | delete | falls to empty; undo doesn't restore selection | restore selection on undo | safe |
| Error boundary | crash | stays until Retry, not reset on selection change | reset on selection change | — |

## 15. Consistency & design-system findings (Phase 15)

Rows are consistent (32px row, 28px control, 12px/400 label). Inconsistent: header popups hand-built with no keyboard
(⋯ `role=menu`, Scope `role=menu`, State `role=listbox`) vs chrome-ui Popover/Menu elsewhere; three focus styles (global
outline, flowbite 4px ring double-drawn, `--bk-shadow-focus`); 9 button heights and 6 radii; three icon-button families;
two "Mixed" components neither showing the word; binding shown as a blue chip, a green `DSBindingChip` (raw `<button>` via
dynamic tag, focus CSS that doesn't exist) and a blue banner; ~15 raw `rgba`/hex values in inspector CSS/TSX
(`BackgroundSection.tsx:200 #22c55e`, `LinkSection.tsx:341`), 133 inline style objects. DD-21's Breadcrumb, Chip usage and
"Mixed" word do not exist yet (expected — they are proposals).

## 16. Accessibility & usability findings (Phase 16)

Esc in ⋯ deselects the element; Esc in AI panel deselects; 106 unit selects named "unit"; colour button "Choose Color
color"; checkbox names are the state; alignment grid named only by `title`; override dot `aria-hidden`; invalid input
not announced; targets below 24px (unit select 13×28, Remove class 7×40, section header 16 tall, swatch 40×18); no
tabpanel role; segmented controls without arrow keys; ~45 Tab stops to cross two sections; contrast passes AA with
thin margin. DD-22's spec stands and gains these concrete fixes.

---

## 17. Consolidated proposal

### 17.P Prerequisite defects (fix before or with the redesign — none are layout decisions)

| # | Defect | Evidence | P |
|---|---|---|---|
| P-1 | Locked elements editable from the Inspector; ⋯ Delete deletes locked | useStyleHandlers.ts:185-274; StudioPanels.tsx:660-675 (LIVE) | P0 |
| P-2 | Binding to CMS wipes element text when no published record; unbind doesn't restore | LIVE | P0 |
| P-3 | Gradient writes editor chrome tokens into customer output | BackgroundSection.tsx:154,172,186 (LIVE) | P0 |
| P-4 | Colour/token popover clipped (invisible) | ColorInput.tsx:166; Popover.tsx:91 (LIVE) | P0 |
| P-5 | Full-page escalations clear the selection | StudioPanels.tsx:519 (LIVE) | P1 |
| P-6 | Esc in ⋯ menu and in AI panel also deselects | useClickOutside.ts:40-45; useColumnPanelEscape.ts:18-33 (LIVE) | P1 |
| P-7 | AI panel unmount resets Inspector tab/scroll/state; scroll memory broken | StudioPanels.tsx:878-892; ProInspector.tsx:268 (LIVE) | P1 |
| P-8 | Per-device Visibility broken at Tablet/Mobile | useStyleHandlers.ts:243-248 (LIVE) | P1 |
| P-9 | `:hover` reset no-op; breakpoint revert leaves stale export data | StyleEngine.ts:84-87, 257-273 (LIVE) | P1 |
| P-10 | Paste style replace vs merge; Duplicate ×4; multi Delete double confirm | §9 D-2…D-5 (LIVE) | P1 |
| P-11 | Link type change leftovers; checkbox state misread; interaction NaN; numeric empty | §12 (LIVE) | P1/P2 |
| P-12 | Multi-select primary click doesn't collapse | SelectionManager.ts:30-31 (LIVE) | P2 |
| P-13 | Selection type identification (21/54 inserts → Container) | typeMapping.ts (LIVE) | P0 for the redesign |
| — | Outside Inspector, found in passing: Carousel `toHTML()` returns a void `<input>` (would drop slides on export) | typeMapping.ts:164 (LIVE toHTML; export not run) | P0 (export) |

### 17.A Features to KEEP DIRECTLY
Style sections (Layout, Size, Spacing box, Typography, Fill, Border); Flexbox/Grid for flex/grid; Link section; Visibility
per device; Interactions; Form fields/after submit; Slides/Playback; Collection source; element name (rename); ✦ AI chip;
override strip; CSS classes chips; Attributes (ID, title, tab index, data-*).

### 17.B Features to KEEP CONTEXTUALLY (owner elsewhere)
CMS binding (bindable types) with status; token binding + "Update everywhere"; font picker + Manage site fonts; media
source pickers; component row (variant, edit master, reset, detach); Save as component; Locked Unlock; ⌘K jump; canvas
doors (Bind to CMS, Add interaction).

### 17.C Cross-check of prior decisions (DD-1 … DD-22)

| DD | Verdict | Change required |
|---|---|---|
| DD-1 keep 3 tabs | **PRODUCT DECISION** | Evidence (C-1): Effects is identical on every type and splits depth (visual) from behaviour (Interactions). Options in §24 Q1. |
| DD-2 whole Inspector + 14 lenses | Agree | — |
| DD-3 type block top of Style | Agree | **Depends on P-13** (type identification) and gains embed URL, audio source, countdown/progress/accordion settings (R-5). |
| DD-4 Behaviour name | Agree | — |
| DD-5 remove Beginner/Pro | Agree | Must ship together with DD-9 size/gap rows (D-10, D-11). |
| DD-6a remove Whole site | Agree | Token chip route must preserve selection (P-5). |
| DD-6b one-shot apply to page | Agree | Also fixes fan-out gap. |
| DD-7 one AI door | Agree | Add: preserve Inspector state across AI (P-7), Esc closes AI only (P-6). |
| DD-8 ⋯ = element actions | **Revise** | Keep "Hide inspector" as a header ✕ + shortcut (no visible route otherwise). Exclude registry items whose destination is the Inspector itself (Bind to CMS, Add interaction). Lock/Unlock: one Unlock in the panel (locked state), Lock in ⋯. Converge implementations (P-10). |
| DD-8b breadcrumb | Agree | Keep `inspector:pick-start` event (CMS panel uses it). |
| DD-9 one editor per property | **Revise** | Keep "Edit text on canvas" row until an Enter/F2 edit key exists (only keyboard route). Display "None" stays a Display value (different function, not a duplicate). Per-device Visibility must be fixed first (P-8). Link gains a Rel field. Size/gap rows only with DD-5. |
| DD-9b box diagram | Agree | — |
| DD-10 sections only where they work | Agree | Extend to structural children (R-4) and fix Columns/class-driven flex (R-8). |
| DD-11 one open rule | Agree | — |
| DD-12 same panel + Mixed | Agree | Placeholders must never look like values. |
| DD-13 Page panel | Agree | "SEO & social…" opens full page → must preserve context (P-5). |
| DD-14 context chips + dots | **Revise** | Fix `:hover` write/reset path first (P-9); dots must include pseudo and master overrides and be announced (not `aria-hidden`). |
| DD-15 order | Agree | — |
| DD-16 component row | Agree + extend | Surface per-instance overrides (engine has them); detect "child inside instance"; add return path from Edit master. |
| DD-17 CMS header chip | **Revise** | Chip must be clickable (new), carry a disconnected/missing state, and the section needs "Open record ›"; fix text-wipe on bind (P-2) first. |
| DD-18 read-only states | **Revise / PRODUCT DECISION** | Locked read-only needs write-path enforcement (P-1). Viewer: today there is **no** Inspector; read-only Inspector is new behaviour (§24 Q3). |
| DD-19 invalid input | Agree | Add aria-describedby + live region; hex rejection must show a message. |
| DD-20 tab on type change | Agree | — |
| DD-21 components/tokens | Agree | Add: move ⋯/Scope/State popups onto chrome-ui Menu/Popover (keyboard); one focus style; one binding indicator. |
| DD-22 accessibility | Agree | Add the concrete fixes in §16. |
| D23 Figma first | Still deferred | — |

### 17.D LINK TO OWNER MODULE (add)
"Open record ›" (CMS) on bound elements; "Open collection ›" on collection lists; "+ New collection…" in collection
selects; "Add tokens in Brand ›" as a real link; "‹ Back to instance" after Edit master.

### 17.E MOVE
Defining attributes → type block (DD-3); Pick/Select parent → breadcrumb; Hide inspector → header ✕; Rel → Link section;
SVG source → drawer pick; page-root controls → Page panel; Interactions → PRODUCT DECISION (Q1).

### 17.F MERGE
Delete, Duplicate, Paste style, Replace media onto shared commands (P-10); classes into chips; Open-in into Link; Shadow
presets/custom/inner into one Shadow section; blur + filters into Filters; width/height into Size and gap into Flex/Grid
(with DD-5); CMS unbind into the status chip; binding indicators into one pattern.

### 17.G MAKE CONDITIONAL
CMS Content (bindable types); Link (linkable types); Typography (text-bearing, not color/range/file inputs, yes for
select); Gap (flex/grid); Size Fill/Hug (non-inline); Flexbox/Grid on computed display; structural-child minimal panel;
state/breakpoint chips on style tabs only; component row only for instances; video "needs muted" warning when autoplay.

### 17.H MAKE ADVANCED (closed by default, one click away)
Attributes (ID, title, tab index, data-*); image loading/decoding; video preload; input autocomplete/readonly; form
action/method/encoding; Effects › cursor, blend, will-change, text-shadow; Typography › white-space, word-break,
text-indent, vertical-align; Layout › position offsets beyond top/left, float/clear, box-sizing.

### 17.I REMOVE
"Whole site" scope; ⋯ "Improve with AI"; ⋯ "Pick on canvas"; Beginner/Pro toggle; Advanced text/label/content
textareas; Advanced "Open In"; ID&class classes field; Spacing gap/row/column gap (with DD-5); Layout size selects (with
DD-5); BindingBanner (after chip covers it); separate BatchStylePanel (after DD-12).

## 18. Proposed Inspector hierarchy (pending Q1)

```
Header: [type icon] Name ✎        [◆ component] [⌁ CMS status] [🔒]   ✦ AI  ⋯  ✕
        Home › Hero section › Heading                                  (breadcrumb)
Tabs:   Style · Behaviour · Effects        (or per Q1: Style · Behaviour)
Context row (style tabs only, only when non-default): State: Base ▾   Tablet · 2 overrides · Revert
Style:     [Type block: defining props per true type]  → Typography → Size → Spacing (box) → Fill → Border
Behaviour: [type-specific: Fields / After submit / Slides / Playback / Collection] → Link → CMS binding
           → Visibility → CSS classes → Attributes (closed)
Effects:   Opacity → Shadow → Filters → Transform & motion → Interactions → Advanced (closed)
Nothing selected / page root: Page panel.  Multi-select: same panel, Mixed, align row.
```

## 19. Proposed contextual behaviour

- Panel content is driven by the **true selection type** (P-13), then by state (locked, bound, instance, breakpoint,
  pseudo, multi, role).
- Every connection shows status in the header and has a one-hop door to its owner with a preserved return.
- Every action runs the shared command; the Inspector never has its own implementation.
- Escalations never clear the selection; returning restores tab and scroll.
- Esc closes the innermost surface only.

## 20. Exposure levels (Phase 9, summary)

| Level | Examples |
|---|---|
| Always visible | header, breadcrumb, tabs, type block, status chips |
| Contextual | component row, CMS status, locked line, state/breakpoint chips, Flexbox/Grid, form/slider/collection sections |
| Frequent (open when valued) | Typography, Size, Spacing, Fill, Border, Link |
| Secondary ("+" row when empty) | Shadow, Filters, Transform & motion, Interactions, Visibility |
| Advanced (closed) | §17.H |
| Popover | colour/token, font, state menu, icon picker |
| More menu (⋯) | element actions (shared registry) |
| External workspace | Brand, CMS record, Components master, Asset library, Page settings |

## 21. What was NOT verified

Component instance children and override surfacing (no instance with children on the site); Form after-submit role gate;
Icon picker; Create collection; repeater clones; viewer role; saving/conflict behaviour beyond observing 409 dialogs
caused by concurrent auditors; Brand token chip when Brand is already open; the Carousel export path itself; Figma v3
boards (not opened).

## 22. Open product decisions (need owner answers before redesign)

| # | Question | Options | Recommendation |
|---|---|---|---|
| Q1 | Tab structure (revisits DD-1 with new evidence C-1) | A) Keep Style · Behaviour · Effects (DD-1). B) Style (incl. opacity/shadow/filters/transform) · Behaviour (incl. Interactions) — two tabs. C) Keep three, move Interactions to Behaviour so Effects = visual depth only. | C — keeps the owner's three tabs, fixes the cohesion split with one move |
| Q2 | Type identification (P-13) | A) Fix type mapping so blocks keep their real type. B) Keep engine types; drive the Inspector from block id metadata. | A — one source of truth for canvas, export and Inspector |
| Q3 | Viewer role | A) Keep Inspector hidden for viewers (today). B) Read-only Inspector (new, DD-18). | A for now; revisit with collaboration |
| Q4 | Save conflict | A) Inspector read-only until conflict resolved. B) Keep editable (edits queue behind the modal). | A — prevents silent pile-up |
| Q5 | Missing type settings | Which to add: embed URL, audio source, countdown target, progress %, accordion open item | All five (they exist in the product but can't be configured) |
| Q6 | Comments on element | A) Status count + "Open in Review" in header. B) Nothing in Inspector. | B until Review ownership (COL audit) settles |
| Q7 | Ecommerce product binding | A) Add. B) Out of scope. | B — no product feature behind it today |
| Q8 | Figma boards (D23) | before / after code | still deferred by owner |

## Owner approvals

| # | Question | Decision | Effect on plan |
|---|---|---|---|
| Q1 | Tab structure | **C — three tabs kept; Interactions moves to Behaviour.** Style · Behaviour (type-specific, Link, CMS binding, Visibility, Interactions, CSS classes, Attributes) · Effects (Opacity, Shadow, Filters, Transform & motion, Advanced). | Updates DD-1/DD-15 Effects order; §18 hierarchy final for tabs. |
| Q2 | Selection-type identification | **A — fix the engine type mapping** so inserted blocks keep their real type (checkbox, radio, switch, label, card, table, tabs, spacer, video-embed, map-embed, lottie, navbar, cta…); engine, canvas, export and Inspector read one type. Needs a migration check for saved projects whose elements are stored as `container`. | P-13 becomes the first build task; DD-3 type block depends on it. |
| Q3 | Viewer role | **A — keep the Inspector hidden for viewers** (today's notice). DD-18's viewer read-only Inspector is deferred to the collaboration arc. Locked-element read-only (DD-18 first half) stays in scope as a defect fix (P-1). | DD-18 revised: viewer half deferred. |
| Q4 | Save conflict | **A — Inspector read-only until the conflict is resolved**, one line under the header "This site changed elsewhere — resolve to keep editing · Resolve" (Resolve reopens the conflict dialog). | New state row in §14; shares the read-only mode built for locked elements. |
| Q5 | Missing type settings | **All five added to the type block** (after Q2): embed URL + preview for video-embed / map-embed / lottie; audio source picker + controls/loop/autoplay; countdown target date/time; progress value/max; accordion default-open item(s). | Extends DD-3 type block and the §3 matrix; build after P-13. |
| Q6 | Comments on element | **B — not now.** After Review ownership is fixed (collaboration audit COL-01…), add a header status "💬 N" + "Open in Review". | Deferred TODO; not in this redesign. |
| Q7 | Ecommerce product binding | **A — add to the plan as its own arc** (owner chose against the "out of scope" recommendation): product data model + product-card/grid/detail in the Add catalog with real types (via Q2) + an Inspector "Product" type block binding to a product source. Needs its own product/eng plan before build; not part of the Inspector layout build. | New arc "E-1 Ecommerce binding"; Inspector reserves a type block slot. |
| Q8 | Figma boards before/after code | **Figma boards FIRST, then code** (owner, 2026-09-27, after reviewing the HTML prototype). Boards must contain exactly the approved features and states — board spec: `2026-09-27-inspector-figma-board-spec.md`. | Build waits for boards; P0 defects + Q2 type fix may run in parallel. |
| R-DD-8 | ⋯ menu revision | **Approved:** header ✕ (Hide inspector) + a keyboard shortcut, removed from ⋯; ⋯ excludes registry items whose destination is the Inspector (Bind to CMS, Add interaction); Lock in ⋯, Unlock only in the locked-state line; every ⋯ action runs the shared command (Delete respects lock + one transaction, Paste style merges, one Duplicate). | Supersedes DD-8 in the redesign plan; P-1, P-10 fixed through it. |
| R-DD-9 | One-editor revision | **Approved:** (1) keep "Edit text on canvas" until an Enter/F2 edit-text key exists on the canvas; Advanced textareas still removed. (2) Display "None" stays a Display value (not a duplicate of per-device hide). (3) Fix per-device Visibility at Tablet/Mobile (P-8) before it becomes the user-facing hide. (4) Add a Rel field to the Link section, then remove Advanced Open In / Rel. Width/height and gap merges ship only together with DD-5. Rest of DD-9 unchanged. | Supersedes DD-9 rows for text, hiding, open-in/rel. |
| R-DD-14 | Override dots revision | **Approved:** first fix the state-rule reset (P-9, StyleEngine merge) and breakpoint Revert leaving stale `breakpointStyles`; then override dots on every field for all three override kinds (breakpoint, pseudo-state, component master), announced to screen readers ("Overridden on Tablet", "Overridden on :hover", "Overrides master"). | Supersedes DD-14 dots clause. |
| R-DD-17 | CMS-bound revision | **Approved:** fix P-2 (bind must never wipe text; unbind restores) first; header chip "⌁ Collection.field" becomes clickable (opens Behaviour › CMS binding); chip has a "Source missing" error state and the section offers Reconnect / Unbind; section gets "Open record ›" → CMS workspace with a return to this element. Banner removed after these land. | Supersedes DD-17. |
| R-DD-18 | Read-only revision | Covered by Q3: locked read-only in scope (with write-path enforcement, P-1); viewer read-only deferred. | Supersedes DD-18 viewer half. |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Design Review | `/plan-design-review` (strict product audit) | Inspector architecture vs real product | 2 | issues_open | 13 prerequisite defects (4 P0); 12 owner decisions made (Q1–Q7, 5 DD revisions); architecture approved; Figma deferred |

**VERDICT:** Architecture APPROVED by owner (DESIGNED, not implemented). Eng review required before build.

NO UNRESOLVED DECISIONS

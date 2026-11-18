# W — Webflow reference (how Webflow actually works)

Audit: "Does Buildrick's editor work like Webflow?" — 2026-10-20. This file is the
Webflow half only. It says nothing about Buildrick code.

**Method.** Primary source is the Webflow Help Center (help.webflow.com). The HTML
pages return 403 to fetchers, so articles were read through the public Zendesk API
(`help.webflow.com/api/v2/help_center/en-us/articles/<id>.json`). Each article's
`updated_at` date is shown as *(upd YYYY-MM-DD)*, and most are from 2026. Where the Help
Center was silent, webflow.com/updates, webflow.com/blog, developers.webflow.com and
wishlist.webflow.com were used, and the source is named in each case.

**Status tags.** `CONFIRMED`: every substantive claim has a source. `PARTIAL`: the core
behaviour has a source but at least one detail does not, and that detail is marked
*UNCONFIRMED* inline. No capability was left wholly without a source.

**Big 2025–2026 changes the code agents must know about** (they reverse older mental
models):

| Change | When | Source |
|---|---|---|
| **Box element** replaces Div block, Section, Container, Columns, Grid, V Flex, H Flex in the Add panel. You set the tag in Settings and the layout through `display`. | 2026 (article upd 2026-10-14) | help 56390650242195 |
| **Legacy Editor retired.** Unavailable from Aug 4 2026, fully deprecated Oct 5 2026 (`?edit` disabled). Content editing now happens inside Webflow itself, by seat and role ("Edit mode"). | 2026 | help 48412420902675 |
| **Real-time collaboration.** Live multiplayer replaces the old one-designer-at-a-time lock. | beta Jul 2025, now on all plans | help 43232037920275 |
| **Interactions with GSAP.** The new default interactions engine. "Classic Interactions" still exists. | summer 2025 | help 46300264646803 |
| **Style manager → "Style selectors panel"** (key G) | — | help 33961365722899 |
| **Swatches → color variables.** Variables gained Number/Percentage types, modes, collections and functions. | 2024–2025 | help 33961268146323 |
| **Component variants, slots, Component Canvas** | 2025–2026 | help 51307110086547, 33961195339923, 49505240420755 |
| **Expand canvas.** All breakpoints shown side by side and editable. | 2026 | help 54857752965139 |
| **Plans.** From May 13 2026 the CMS and Business plans merged into **Premium**, a new **Team** plan exists, and AI credits are added to Workspace plans. | 2026 | help 51059955082387 |
| Inheritance-indicator colours are **orange / blue / pink**, not "orange/yellow" | — | help 33961362040723 |

---

## Core Webflow mental model (invariants)

1. **Everything is real HTML + CSS.** Every element is an HTML element with a real tag. The Style panel edits real CSS properties (display, margin, position, transforms and so on), and the published site is that HTML/CSS. Code export ships the same files (help 33961386739347).
2. **Classes, not inline styles.** The first style edit automatically creates and applies a class. Styles live in the class and affect every element that carries it (help 33961311094419). The only per-element styles are the "pink" cases: grid-child placement and Quick Stack (help 33961362040723).
3. **Combo classes are compound selectors.** Every class after the first is a combo. It inherits from the base class and overrides only on that combination. Base-class edits go through the Inheritance menu (help 33961311094419).
4. **Tag styles are the global layer.** "Body (All Pages)", "All H1 Headings", "All Links" and so on set site defaults, shown as pink tags (help 33961346359699).
5. **Cascade is CSS inheritance, made visible.** Orange means inherited (from a tag, a base class, a larger breakpoint, or a parent's text style). Blue means set on this selector at this breakpoint. Pink means element-local (help 33961362040723).
6. **Breakpoints are media queries cascading out from Desktop (base).** Styles flow down (tablet ≤991, mobile landscape ≤767, mobile portrait ≤479) and up (1280/1440/1920 min-width). Only Style-panel changes cascade (help 33961300305811).
7. **Structure and content are breakpoint-agnostic.** Element order, settings, content and deletion apply to all breakpoints. To vary by breakpoint you hide the element (`display:none`) or reorder with flex/grid (help 33961300305811).
8. **The Navigator is the DOM tree.** It shows the page hierarchy one-to-one. You can drag to reorder or nest, rename, and select elements that are hidden or behind others (help 33961320786451).
9. **Placement follows the box model, not free positioning.** Dropping an element inserts it into a parent at an index, and where it renders depends on display/flow (help 33961319255059, 33961270096659).
10. **States are pseudo-classes on the selector**: hover, pressed, focused, focus-visible, visited, placeholder and so on. They are styled in the same Style panel (help 33961301727251).
11. **Variables are CSS custom properties** with typed inputs. Modes switch values per breakpoint or per class (help 33961268146323).
12. **Components = main + instances.** Structure and styles are edited only on the main component. Instances vary through props, slots and a variant (help 33961303934611).
13. **Separate Design / Build / Edit modes.** Who can change structure versus content is set by site role, not by separate apps (help 41015796747667, 33961251014931).
14. **CMS = typed Collections + template pages + bindings.** Elements bind to fields through the purple "dot". Collection lists query items with filter/sort/limit (help 33961277976467, 33961242538259).
15. **Publish is explicit and per domain.** You publish to the `*.webflow.io` staging subdomain and/or custom domains, with backups created automatically (help 33961419650067, 33961244069395).

---

## CANVAS

### C01 — Canvas viewport / zoom / pan — `CONFIRMED`
- In single-breakpoint view the canvas is one iframe frame at the breakpoint width. Canvas settings (click the breakpoint width in the canvas bar) offer **Width** (any pixel width) and **Scale** (zoom out to fit a smaller screen). You can also drag the canvas edge to test other widths.
- **Expand canvas** (canvas-bar icon) shows every breakpoint frame side by side, and you can edit the active frame directly.
  - **Pan:** Space+drag or middle-mouse drag.
  - **Zoom:** Cmd/Alt+scroll or Cmd/Alt + `+`/`-`.
  - **Reset view:** Shift+2.
  - **Fit to view:** fits all frames.
  - Frame height is fixed, custom code does not load in expanded frames, and there is no ruler.
  - Webflow switches automatically to Focus canvas for GSAP interactions, Analyze, preview and comment mode.
  - The expand/focus preference persists per site.
- Large breakpoints auto-scale the canvas down to fit a small screen.
- Sources: help.webflow.com/hc/en-us/articles/33961230930579 (Canvas settings, upd 2026-09-02); /54857752965139 (Expand canvas, upd 2026-09-08); /33961319255059 (Canvas overview).

### C02 — Breakpoint switching, custom breakpoints, canvas width — `CONFIRMED`
- Default breakpoints are Desktop (base, no media query), Tablet ≤991px, Mobile landscape ≤767px and Mobile portrait ≤479px. You can optionally add **1280, 1440 and 1920px** (min-width), but they **cannot be removed** once added. You can only clear their styles with Opt/Alt+click on the blue labels.
- To switch, click the icons in the canvas bar or press keys 1–4. The canvas bar can sit at the top or bottom.
- **No arbitrary custom breakpoints.** Only the 7 fixed ones exist. The base cannot be changed (wishlist WEBFLOW-I-2857 is still open). Arbitrary widths are a preview-only canvas width.
- Sources: help /33961300305811 (Breakpoints overview, upd 2026-09-08); /33961359609875 (Shortcuts); wishlist.webflow.com/ideas/WEBFLOW-I-3315 (merged into I-2857).

### C03 — Select / hover / multi-select — `PARTIAL`
- **Hover** draws a blue outline. **Click** selects and shows a top-left label with the name: custom name > class > tag > default name. A gear icon on the label opens element settings when relevant.
- Ways to reach the parent:
  - Click the label to see the parent and grandparent.
  - Use the breadcrumb bar at the bottom right.
  - Right-click → Select Parent Element.
  - Press ↑ for the parent, ↓ for a child, ←/→ for siblings.
- "Show element edges" adds an outline to every hovered element.
- Hovering in the Navigator highlights the element on the canvas, and the reverse.
- **Multi-select: not supported.** Selection is single-element. Long-standing wishlist requests (WEBFLOW-I-5071 shift-click; I-6348; I-5934 multi-select in the Navigator) are still open, and Webflow staff point users to shared classes instead. *UNCONFIRMED that nothing shipped after Dec 2025*: no Help Center article mentions multi-select. Bulk selection does exist for CMS items and in the Variables panel.
- Sources: help /33961319255059; /33961359609875; wishlist.webflow.com/ideas/WEBFLOW-I-5071, /WEBFLOW-I-6348.

### C04 — Drag-drop add from Add panel — `CONFIRMED`
- The **Add panel** (key A) has two tabs, **Elements** and **Layouts**. Sections:
  - Structure: Box, Quick Stack, Page Slot
  - Typography: Heading, Text Block, Paragraph, Block Quote, Rich Text
  - Links: Link Block, Text Link, Button
  - CMS: Collection List
  - Media: Image, Video, YouTube, Lottie, Spline, Rive, Background Video, Lightbox
  - Forms
  - Custom Code: Code Embed, Custom Element, plus prebuilt items such as a pricing calculator, shader, carousel and multistep form
  - Other: List, Search, Dropdown, Locales List, Navbar, Slider, Tabs, Map, Code Block, social
- **Three ways to add:**
  1. **Click to add in place.** With a parent selected, the new element goes inside it at the end. With a text, media or button element selected, it goes after that element. With nothing selected, it goes at the end of Body.
  2. **Drag onto the canvas.** An orange indicator marks the target parent and a blue line marks the index.
  3. **Drag into the Navigator.**
- Quick find (Cmd+E / Cmd+K) also adds elements.
- Most elements are Block. Link Block, Button, Image, Lightbox Link, Dropdown and Form Button are inline-block.
- Source: help /33961270096659 (The Add panel, upd 2026-10-14).

### C05 — Move / reorder on canvas — `CONFIRMED`
- Drag on the canvas: a blue line shows the insertion point and a blue outline/label shows the new parent. Webflow recommends the Navigator for precise moves. Where an element lands depends on display and flow.
- Keyboard moves:
  - `[` / `]` or Cmd+↓/↑ move before or after the previous element.
  - Cmd+`[` / `]` move among siblings within the parent.
  - Cmd+Shift+↑/↓ move before or after the parent.
- You cannot move elements out of dynamic elements such as a Collection list.
- Wrap in Box: Cmd+Opt+G. Unwrap: Cmd+Shift+G.
- Order changes apply to **all breakpoints**.
- Sources: help /33961319255059; /33961359609875; /33961300305811.

### C06 — Inline text editing + rich text — `CONFIRMED`
- To edit text, double-click it or press Enter on a selected element. Highlighting text shows a formatting bar with Bold, Italic, Superscript, Subscript, Link, **Wrap with span** and Clear formatting.
- Each format creates a **nested inline element** (b, i, span…) that you can select and give a class. Site-wide defaults come from tag styles (All Bolds, All Italics, All Superscripts…).
- The **Rich Text element** has its own toolbar and a "+" insert menu, plus:
  - **Markdown shortcuts:** `**bold**`, `#`–`######` + space, `>`, `-`, `1.`, `[text](url)`.
  - **Slash commands:** H1–H6, lists, paragraph, blockquote, image, video, rich content, HTML embed, code block.
  - Components can be placed inside rich text and CMS rich-text fields, but those instances cannot be unlinked.
- Sources: help /33961346125843 (Inline text formatting); /33961359609875 (Markdown/slash); /33961256808467 (Rich text); /55024205780627 (Components in rich text).

### C07 — Copy / paste / duplicate (incl. cross-site) — `CONFIRMED`
- Shortcuts: Cmd+C/X/V. Duplicate with Cmd+D or Opt+drag (the copy keeps the class). Paste goes **into the selected element**.
- **Cross-site paste:** copy in one site's Designer and paste into another, even in a different Workspace, as long as you are a member of both. Nested elements, styles, assets, settings and interactions travel with it, and the paste is undoable. You cannot copy from read-only mode.
- **Class conflicts:**
  - Same name with different styles: the pasted class is renamed with a number ("classname 2").
  - Same name (ignoring the numeric suffix) with identical styles: merged into the existing class.
  - Inherited parent styles can change how the pasted element looks.
- **GSAP interactions:** an interaction set that targets "This element" is duplicated on each paste. An interaction set that only uses class/attribute selectors is not duplicated.
- Sources: help /33961319728403 (Copy and paste between sites, upd 2026-10-14); /33961359609875.

### C08 — Context menu — `PARTIAL`
- Right-clicking an element on the canvas opens a contextual menu. Documented items:
  - **Select Parent Element** (submenu of ancestors)
  - **Add class**
  - **Rename class**
  - **Unlink instance** (on component elements)
  - grid row/column Duplicate/Delete in grid edit mode
- *UNCONFIRMED*: the full item list (copy/paste/duplicate/delete/wrap/convert/create component and so on) is not given in one Help article.
- Sources: help /33961319255059; /33961311094419; /33961303934611; /33961365794451.

### C09 — Keyboard shortcuts (main) — `CONFIRMED`
- Cheatsheet: Shift+/.
- Navigation and view:
  - Quick find: Cmd+E or Cmd+K.
  - Preview: Cmd+Shift+P.
  - Publish dialog: Shift+P. Code export: Shift+E.
  - Save snapshot (backup): Cmd+Shift+S.
  - Esc deselects or exits. Backspace/Delete deletes. Enter edits the element.
  - Undo Cmd+Z, redo Cmd+Shift+Z.
  - Breakpoints: 1–4.
- Left panels:
  - A Add, P Pages, Z Navigator, Shift+A Components, J Assets, K Properties (when editing the main component).
- Right panels:
  - S Style, D Settings, G Style selectors, H Interactions.
- Canvas overlays:
  - Guides Cmd+Shift+G (Shift+G also documented), edges Cmd+Shift+E, X-ray Cmd+Shift+X, spacing Cmd+Shift+D, rulers Shift+R.
  - Comment mode C. Show/hide comments Shift+C.
- Classes:
  - Add class Cmd+Enter. Rename last class Cmd+Shift+Enter. Duplicate last class Cmd+Opt+Enter. Remove last class Opt+Shift+Enter.
- Components:
  - Create component Cmd+Shift+A. Rename Opt+R / F2.
- Spacing drag modifiers: Shift+drag sets all sides, Opt+drag sets opposite sides.
- Also: Opt+A opens the AI Assistant. Cmd+Shift+L toggles content-editor editability on an element.
- Source: help /33961359609875 (Keyboard shortcuts, upd 2026-10-14); /33961230930579.

### C10 — Navigator tree — `CONFIRMED`
- Open with Z or the left toolbar. It also opens automatically while you drag. It can be **pinned** on browsers wider than 1440px and is resizable when pinned.
- Expand or collapse one node, or all with Opt+Z.
- **Rename:** double-click, or Opt+R. Hold Opt to see the original name. Clear the name to reset it. Body cannot be renamed, and slots can be renamed only on the main component.
- **Drag** to reorder. Hover until the row indents to nest. Children move with their parent.
- Selects elements that are hard to reach on the canvas (display:none, negative z-index).
- **Icons:**
  - green box = component, white box = open component
  - binding = CMS-bound or conditional visibility
  - hash = pinned grid child
  - **eye-slash = hidden on canvas**
  - lightning = has an interaction trigger
  - globe = localized
- Boxes are shown by tag name (Div, Section…).
- In expand canvas, breakpoint frames appear as nodes that you can show or hide.
- *UNCONFIRMED*: a Navigator-native "hide" toggle. Hiding is done with display:none, the Visibility setting or conditionals, and the Navigator only shows the eye-slash indicator.
- Sources: help /33961320786451 (Navigator, upd 2026-10-14); /42109560032531 (Rename elements).

### C11 — Undo / redo + history scope — `PARTIAL`
- Undo Cmd+Z, redo Cmd+Shift+Z. Cross-site paste is undoable.
- With real-time collaboration, **each user's undo/redo is independent**: it covers only your own actions.
- All edits autosave ("Changes saved" checkmark). For longer-term history: **backups**, restore points created on every 50th autosave and on manual snapshot (Cmd+Shift+S), and on Enterprise the **Site Activity log**.
- *UNCONFIRMED*: whether the undo stack is per page or per session, its depth, and whether it survives a reload.
- Sources: help /33961359609875; /43232037920275 (RTC); /33961244069395 (Backups); /46651707969043 (Site Activity log).

### C12 — Preview mode — `CONFIRMED`
- Open with the "play" icon or Cmd+Shift+P. Exit with Esc or the same toggle.
- Most of the UI is hidden. The top bar stays (it can be hidden) so you can switch breakpoints. Canvas settings are available bottom right.
- Interactions, sliders, dropdowns and in-site page links work, but you cannot select or edit elements.
- **Custom code is off by default.** The "Enable custom code" toggle renders the page on `{shortName}.canvas.webflow.com`, an isolated origin.
- Sources: help /40881969908627 (Preview mode, upd 2026-09-08); /33961319255059.

### C13 — Guides / spacing overlays / X-ray — `CONFIRMED`
- All of these live in Canvas settings:
  - **X-ray mode** (Cmd+Shift+X): the canvas turns grayscale and the hovered element's border, margin and padding are outlined.
  - **Show spacing on canvas** (Cmd+Shift+D): margin and padding are drawn on the selected element. Opt+Shift+click shows them once.
  - **Show element edges**.
  - **Show empty elements** (on by default).
  - **Rulers:** pinned, or pinned + crosshair (Shift+R).
  - **Guides:** line or filled column overlay (Shift+G).
  - **Vision preview** (colour-blindness simulation).
  - **Text zoom preview**.
- Sources: help /33961230930579 (Canvas settings, upd 2026-09-02).

### C14 — Quick Find / command palette — `CONFIRMED`
- Open with Cmd+E or Cmd+K.
- What it does:
  - Adds elements.
  - Adds or edits components.
  - Finds assets and opens their settings.
  - **Converts** elements to another type.
  - Selects on-page elements by class, component or custom name.
  - Creates or goes to pages and CMS item pages.
  - Opens a Collection in the Collection manager.
  - Switches locale and translates.
- Results are tabbed by type, limited to the top 50, and navigable with arrows/Tab. A settings cog chooses which action types appear.
- It searches class names, page names, element names and asset extensions (`.svg`). Searching a tag ("address") adds a Box with that tag.
- Sources: help /33961382093587 (Quick find, upd 2026-10-14); /56390650242195.

---

## STYLE

### S01 — Class-based styling (classes, combos, global/tag styles, body) — `CONFIRMED`
- **Auto-class:** the first style edit creates a class named after the element type ("Paragraph") and applies it. You can also type a name into the **Selector field**: click it, press Cmd+Enter, or right-click → Add class.
- Editing a class changes every element that uses it.
- Class names are case-insensitive and must start with a letter. Special characters become hyphens, so "a +" and "a $" collide.
- **Removing** a class from an element does not delete it from the site.
- **Duplicate class** creates an independent copy with no further inheritance.
- **Combo class:** any class after the first. It inherits from the base and its edits affect only that combination. A comma in the selector field chains another class.
  - Inherited values show **orange**, overrides show **blue**.
  - A base value hidden by a combo override shows a **red strikethrough**.
  - Webflow advises against chaining more than one combo level.
- **Global/utility classes:** a class whose name re-applies its styles wherever it is stacked.
- **Tag styles (pink):** Body (All Pages), All H1–H6, All Paragraphs, All Links, All Images, lists, All Bolds/Italics, blockquote, figure, code/pre, sup/sub, All Divs/Sections/Navigation/Headers/Footers/Mains/Articles/Asides/Addresses, All Forms/Inputs and more. Libraries can ship tag styles that you can switch Active or Inactive.
- Sources: help /33961311094419 (Classes, upd 2026-10-14); /33961346359699 (HTML tags); /33961362040723.

### S02 — Style panel sections — `CONFIRMED`
- Top of the panel: element type and name, the **Selector field** (tags, classes, combos), the **States** dropdown, the **Inheritance menu** (ancestors up to Body and the base class), and the **Affected elements** count (on this page and site-wide, with a toggle to outline them).
- Sections in order:
  1. **Layout:** display block/flex/grid/none, plus inline etc. in a dropdown. Flex and grid controls and an align box.
  2. **Spacing:** a margin/padding box model for 1, 2 or 4 sides.
  3. **Size:** width, height, min/max, aspect ratio, overflow, fit.
  4. **Position:** static/relative/absolute/fixed/sticky, float, clear.
  5. **Typography:** inherited by descendants.
  6. **Backgrounds:** image, gradient, color, clipping, size/position/tile.
  7. **Borders:** radius, style, width, color.
  8. **Effects:** blending, opacity, box shadows, 2D/3D transforms, **transitions**, filters, backdrop filters, cursor.
  9. **Custom properties:** raw CSS property/value pairs that the UI does not support natively.
- Opt+S expands or collapses all sections. Focus mode (Opt+Shift+S) keeps one section open and persists. A collapsed section shows coloured dots when it contains set styles.
- Sources: help /33961362040723 (Style panel overview, upd 2026-09-08); /33961265610259 (Custom CSS properties).

### S03 — Breakpoint cascade — `CONFIRMED`
- Desktop is the base. Styles set there apply everywhere unless overridden.
- **Cascade direction:**
  - **Down:** desktop → tablet → mobile landscape → mobile portrait.
  - **Up:** desktop → 1280 → 1440 → 1920.
- **Overrides:** a smaller breakpoint overrides the one above it, and a larger one overrides the one below. An override stops further inheritance in that direction.
- **Clearing** a style also clears it on the breakpoints it cascades to.
- **Only Style-panel changes cascade.** Element settings, order/hierarchy, content and deletion are global. To hide on one breakpoint, set display:none there; it cascades down and is still in the HTML.
- Variables can also vary by breakpoint through responsive modes (S07).
- Source: help /33961300305811 (Breakpoints overview, upd 2026-09-08).

### S04 — States / pseudo-classes — `CONFIRMED`
- Choose from the Selector field → States dropdown. A **green** state chip appears in the selector field.
- Available states:
  - **None** (default)
  - **Hover**
  - **Pressed** (`:active`, inherits from Hover)
  - **Focused** (`:focus`)
  - **Focused (keyboard)** (`:focus-visible`)
  - **Visited**: text, background and border colour only
  - **Placeholder** (form fields)
  - **Checked** (custom-styled checkbox/radio)
  - **Disabled** (form button)
  - **Current** (links/tabs pointing at the current page/section/tab)
  - **Current locale** (Localize)
- Esc returns to None. Reset a state style by clicking its blue label → Reset, or Opt+click.
- CMS lists also support first / last / odd / even item styling (help /33961406388243).
- **No `:focus-within` state** in the documented list (*UNCONFIRMED absence*: not mentioned in the States article). Arbitrary selectors need custom code.
- Source: help /33961301727251 (States, upd 2026-09-08).

### S05 — Style selector & inheritance indicators — `CONFIRMED`
- **Orange:** inherited from an ancestor source (a tag, base class, higher or larger breakpoint, or a parent's text style). Click it to jump to the source.
- **Blue:** set on the current class/tag/breakpoint, or an override of an orange value. Click → Reset.
- **Pink:** element-local and breakpoint-local (grid-child placement, Quick Stack), or an override on a smaller breakpoint.
- **Red strikethrough:** a base value hidden by a combo override.
- **Purple:** a value bound to a variable, or a CMS/prop binding.
- **Green:** a state chip.
- Opt/Alt+click any indicator to reset it.
- *Correction to the brief:* Webflow's colours are orange/blue/pink, not orange/yellow.
- Sources: help /33961362040723; /33961311094419; /33961268146323.

### S06 — Style manager / clean up unused — `CONFIRMED`
- Now called the **Style selectors panel** (left toolbar "three droplets", key G). It lists:
  - Tags in pink at the top, then classes in blue in creation order.
  - Combos nested with "+", and nested tags nested with an arrow.
- **List affected items** shows elements on this page, on other pages, and inside components.
- Other actions:
  - Rename via the wrench icon.
  - Search by name **and by property or value** (e.g. "44px"); base breakpoint only.
  - Hover to preview the CSS.
  - Delete one unused class (wrench → trash).
  - **Broom icon → remove all unused classes.**
- Sources: help /33961365722899 (Style selectors panel, upd 2026-10-14).

### S07 — Variables — `CONFIRMED`
- **Types:**
  - **Color:** swatches migrated here.
  - **Size:** a unit is required.
  - **Percentage**.
  - **Number:** unitless, e.g. font-weight 1–1000, integer z-index, opacity, flex grow/shrink.
  - **Font family**.
- **Using variables:**
  - Created in the Variables panel, or from the Style panel's purple dot → "+".
  - Bind with the **purple dot** on any compatible input. Bound values are shown in purple.
  - Editable inline (pencil icon).
  - Usable in Interactions, including "Animate variable" actions.
- **Organising:**
  - **Groups** come from a `Group/Name` naming convention.
  - **Aliases** reference another variable of the same type only.
  - Reorder by drag or keyboard. Bulk select, update and delete.
- **Functions:** clamp(), calc(), min(), max() and color-mix() are allowed as variable values. You cannot self-reference across breakpoints.
- **Modes:** extra value sets that apply in one of two ways.
  - *Automatically* at a breakpoint: tablet, mobile landscape or mobile portrait, with one mode per breakpoint per collection.
  - *Manually* to a class, for themes.
- **Collections** group variables and modes. Cross-collection references use the base value.
- Variables, collections, groups and modes can be shared through **Libraries**.
- Sources: help /33961268146323 (Variables, upd 2026-09-21); /41843932314259 (Functions in variables); webflow.com/updates/new-variable-types-number-percentage.

### S08 — Units & calc/var() inputs — `PARTIAL`
- **Units:** px, %, em, rem, vh, vw, "-" (unitless), dvh/dvw/svh/svw/lvh/lvw (type the s/l units by hand), ch and fr (grid). Some fields accept Auto and None.
- Type the unit after the value or pick it from the dropdown. Switching px → % auto-converts.
- **Input gestures:**
  - Arrow keys change the value by ±1, Shift+arrow by ±10.
  - Opt+drag scrubs the value. Opt shows increment arrows.
  - Preset values: Opt+click applies to opposite sides, Shift+click to all sides.
- **Basic math** (`+ - * /`) is evaluated in inputs.
- **CSS functions** (calc/clamp/min/max/color-mix, with `var()` inside) are supported through the "custom value" editor in the Connect (purple dot) menu, which offers autocomplete and MDN links.
- *UNCONFIRMED*: whether free-form `calc(...)` can be typed straight into an ordinary Style-panel field without the custom-value or variable route. The Help Center documents it only for variables, plus "create a variable from a style property's custom value".
- Sources: help /33961290465043 (Input values and units, upd 2026-09-08); /33961327404947 (Basic math); /41843932314259; webflow.com/updates/function-variables.

### S09 — Grid editor — `CONFIRMED`
- Set a Box to display Grid in Style → Layout.
- Columns and rows:
  - Change them with ± buttons or by typing a number.
  - **Grid edit mode** (wrench icon, or select the grid on the canvas) lets you add, delete, **duplicate** and **reorder** rows and columns, and drag headers to resize.
  - Sizes accept px, em, rem, **fr** and min/max (minmax).
  - Gaps are locked together by default and can be unlocked.
- Children auto-flow into cells. They can be **pinned** to cells or **named grid areas**, per breakpoint (pink, element-local).
- Align box shortcuts: double-click or Cmd+click = stretch/space-between; Opt+click = align stretch.
- Grid-child order and position can change per breakpoint.
- Sources: help /33961365794451 (Grid, upd 2026-10-14); /33961389959059 (Grid areas); /33961359609875.

### S10 — Custom code / embed & custom attributes — `CONFIRMED`
- **Code Embed element** (Add → Custom Code):
  - Maximum 50,000 characters.
  - No `<html>`, `<head>` or `<body>`.
  - Can sit in the design or inside rich text. Can use dynamic CMS fields.
  - Can be turned into a component.
  - Open the editor by double-click or Enter.
  - Requires a paid Workspace or Site plan.
- **Custom element:** any tag, attributes and text. It is CMS-bindable, and Webflow shows an on-canvas error for invalid children.
- **Custom attributes:** Element settings → Custom attributes → "+", either as name/value or a pasted `name=value`.
  - Validated, with reserved names blocked (e.g. `href`).
  - Values can bind to CMS fields (in lists or on template pages) or to component props.
- **Site/page custom code:** head and before-body code in Site settings and Page settings (P02).
- Sources: help /33961332238611 (Code embed); /33961250668691 (Custom element); /33961389460115 (Custom attributes); /33961357265299 (Custom code in head and body).

### S11 — Copy / paste styles — `PARTIAL`
- **No native "copy style / paste style" command is documented.** The Webflow way is to apply the **same class**, duplicate a class, or Opt+drag duplicate (the copy keeps the class).
- Cross-site paste carries classes, with the rename/merge rules in C07.
- Wishlist WEBFLOW-I-313 ("Copy/Paste Styles from one class to another") remains a request. *UNCONFIRMED that it has not shipped since*: no Help article.
- Sources: help /33961319728403; /33961311094419; wishlist.webflow.com/ideas/WEBFLOW-I-313.

---

## STRUCTURE

### E01 — Element catalogue — `CONFIRMED`
- **Structure:** **Box**, which replaced Div block, Section, Container, Columns, Grid, V Flex and H Flex. Its tag can be Div, Header, Footer, Nav, Main, Section, Article, Aside, Address or Figure. Plus **Quick Stack** and **Page Slot**.
  - Container = Box with a set width. Columns/Grid = Box with display:grid.
- **Typography:** Heading, Text Block, Paragraph, Block Quote, Rich Text.
- **Links:** Link Block, Text Link, Button.
- **CMS:** Collection List.
- **Media:** Image, Video, YouTube, Lottie, Spline, Rive, Background Video, **Lightbox**.
- **Forms:** Form Block, Label, Input, File Upload, Text Area, Checkbox, Radio, Select, reCAPTCHA, Form Button.
- **Custom Code:** Code Embed, Custom Element, plus prebuilt pricing calculator, shader, quotes carousel and multistep form.
- **Other:** List, List Item, Search, **Dropdown**, Locales List, **Navbar**, **Slider**, **Tabs**, **Map**, Code Block, Facebook, X.
- The **Layouts** tab holds prebuilt sections, and the Starter Library is pre-installed.
- Sources: help /33961270096659; /56390650242195 (Box element, upd 2026-10-14); /33961337084179 (Lightbox); /33961317173139 (Slider); /33961389315987 (Map).

### E02 — Element settings panel — `CONFIRMED`
- Open with **D**. Its changes apply on **all breakpoints**. It holds:
  - **ID** (CMS-bindable)
  - **Tag** (for Box and other elements)
  - Element-specific settings (image src/alt/loading, link, video, slider and so on)
  - **Visibility** (show/hide, conditional-capable)
  - **Custom attributes**
  - **Editing permissions** (whether content editors may edit this element; Cmd+Shift+L)
  - Collection list settings (source, filter, sort, limit, pagination)
  - Form settings
- **Link settings** types: URL, Page, Page section, Collection page, Email, Phone, File, Back button. Plus open in new tab and **preload** (Default / Prefetch / Prerender).
- **Conditionals** (purple dot → Create conditional) can drive Visibility, Switch, Variants, Text, Attributes, Images and Video from component props, CMS fields or current locale. **Hidden elements are not output in the published HTML.**
- Sources: help /33961408937747 (Link settings); /33961320868115 (Conditionals, upd 2026-07-02); /33961389460115; /33961251014931; /33961300305811.

### E03 — Semantic tags & accessibility — `CONFIRMED`
- **Semantic tags** are set on Box elements (header, nav, main, section, article, aside, address, figure, footer). Headings H1–H6 are separate elements.
- **Alt text** is set in Image settings, with a "decorative" option, and can bind to CMS.
- **ARIA and other attributes** go in custom attributes.
- **Audit panel** (left toolbar; Opt+U expands all) runs 4 accessibility checks: missing alt text, non-descriptive link content, skipped heading level, duplicate element IDs. It also runs SEO checks.
  - It does **not** check inside components, Lightbox alt text, CMS-bound images or colour contrast.
  - Contrast has its own checker in the text colour picker.
- Vision and Text-zoom previews are in Canvas settings.
- Sources: help /33961313088531 (Audit panel); /33961330170643 (Alt text); /56390650242195; /33961230930579.

---

## COMPONENTS

### K01 — Components create / edit / detach / instances — `CONFIRMED`
- The **main component** is the definition. **Instances** reference it. Structure and styles can be edited only on the main component.
- **Create** by converting a selection: Components panel "new" → Convert selection, or Cmd+Shift+A. Give it a name, optional group and description, and review **suggested props**. You can also create one from scratch on the **Component Canvas**.
- **Edit** in context (double-click an instance, Opt+double-click in the Navigator) or on the Component Canvas, which shows all variants side by side with pan and zoom.
- **Duplicate** a component from the panel.
- **Unlink instance** (right-click): props become static settings, variants become styles, slots become elements. Instances inside rich text cannot be unlinked.
- Components can be nested.
- Sources: help /33961303934611 (Components overview, upd 2026-10-14); /49505240420755 (Component Canvas); /33961263318675 (Nest components).

### K02 — Props — `CONFIRMED`
- **Content props:** Text, Rich text, Image, Link, Video, Number.
- **Switch props:** show or hide an element. Hidden elements are removed from the DOM.
- **Collection list props:** filters, sort, pagination, limits, curated items.
- **Variant prop:** created automatically with variants.
- **Attributes / custom-attribute binding** (developers docs mention an attributes prop that forwards `data-*` or `aria-*`).
- **Class custom attribute:** the documented route to **style per instance**.
- Props are managed in the **Properties panel** (K) and can be grouped. Conditionals can drive props.
- Sources: help /33961219350547 (Component properties, upd 2026-09-02); /33961320868115; developers.webflow.com/devlink/docs/component-export/design-guidelines/props-slots.

### K03 — Slots — `CONFIRMED`
- A **Slot element** dragged into a main component becomes a placeholder that instances fill with other components. Each slot creates a slot property and is renamed on the main component.
- Slots cannot go inside lists, Collection lists or links. A slot prop cannot bind to a parent slot prop.
- A **Page Slot** is a different thing: a page-level drop zone for marketers (T05).
- Sources: help /33961195339923 (Slots, upd 2026-10-14); /33961210206483 (Page building); university.webflow.com/lesson/slots.

### K04 — Variants — `CONFIRMED`
- Create them by editing the main component → Navigator "Variants +", the "+ Variant" button on the Component Canvas, or from the Style panel.
- **One variant property per component** (unlimited variants). For anything more complex Webflow points to the class custom attribute.
- **Styles edited in the base variant are shared by all variants. Styles edited in a non-base variant apply only to that variant.**
- The variant prop can be renamed, grouped and given a default. Conditionals can switch the variant from CMS data.
- Interactions can be scoped per variant.
- Sources: help /51307110086547 (Component variants, upd 2026-04-30); /42832349989395.

### K05 — Shared libraries — `CONFIRMED`
- **Library types:**
  - **Shared Library:** components, variables (with collections and modes), fonts, tag styles and assets, installed across sites in a Workspace.
  - **Starter Library:** Webflow layouts, pre-installed.
  - **Marketplace Library**.
  - **Code component libraries** (React, via DevLink).
- **Plan gating for Shared Libraries:** Starter 0, Freelancer/Core/Growth 1, Agency unlimited, Enterprise per contract. Requires a paid Workspace.
- Library installs and updates are tracked in Site Activity.
- Sources: help /33961343551763 (Libraries, upd 2026-10-09); /46651707969043.

---

## CMS

### M01 — Collections & field types — `CONFIRMED`
- **Field types:**
  - Plain text, Rich text
  - Image, Multi-image, Video (URL)
  - Link, Email, Phone
  - Number, Date/Time
  - Switch (boolean), Color, Option (enum), File
  - Reference, Multi-reference
- Name and Slug are built-in fields, each under 256 characters.
- Fields can be grouped and duplicated. You can delete a used field only after removing all of its connections ("View field connections").
- **Plan limits (from May/Jun 2026):** Premium (formerly CMS/Business) has **20,000 items and 40 Collections**. Basic has no CMS.
- Sources: help /33961390084499 (Collection fields, upd 2026-06-30); /51059955082387 (May 2026 plans); /33961290794771.

### M02 — Collection lists + filters / sort / limits — `CONFIRMED`
- A Collection List bound to a Collection shows **100 items by default**.
- Settings: **Filter** (rules per field type, combinable, bindable to component props), Sort, **Limit/Skip**, Pagination at 100 per page.
- Filters/sort/pagination work only on **dynamic** lists, not on curated ones.
- **Per-page limits:** 40 Collection lists, 10 nested lists, 3 nesting levels. No Collection lists nested inside components.
- To show more than 100 items, use pagination or a duplicated list with Skip 100.
- Sources: help /33961242538259 (Filter Collection lists); /33961370432275 (Dynamic content limits, upd 2026-10-06).

### M03 — Template pages & bindings — `CONFIRMED`
- Each Collection automatically gets a **Collection page** (template) under Pages → CMS Collection pages. Templates are purple in the Pages panel.
- Switch the previewed item from the top bar or with Shift+Opt+←/→.
- **Bind** an element through Settings → purple icon above a setting (Text, Image, Alt…). On the canvas, dynamic elements have purple outlines and static ones blue.
- Static elements on a template appear on every item page. Static pages can link to item pages only through a Collection list.
- Sources: help /33961277976467 (Collection pages).

### M04 — Conditional visibility — `CONFIRMED`
- **Conditionals** work on Visibility, Switch, Variant, Text, Attributes, Images and Video.
- Data sources: **component props** inside a main component, **CMS fields** in lists and templates, **current locale**.
- Rules depend on type: text (contains/starts with/ends with), switch (is on/off), reference (rules on referenced fields), multi-ref (contains any/does not contain any/is set/is not set). Each conditional has a fallback value.
- Hidden elements are left out of the published code.
- Source: help /33961320868115 (Conditionals, upd 2026-07-02).

### M05 — References / multi-ref — `CONFIRMED`
- **Reference** links to one item in the same or another Collection, including Ecommerce. **Multi-reference** links to many items, with drag or keyboard reorder.
- Edits to a referenced item propagate everywhere it is referenced.
- Multi-ref items appear on template pages through a nested Collection list (nesting limits are in M02).
- Sources: help /33961260360083 (Multi-reference, upd 2026-08-13); /33961317363091 (Reference); /33961268936851 (Nest Collection lists).

### M06 — CMS editing (Edit mode / Editor) — `CONFIRMED`
- The **legacy Editor (`?edit`) is retired**: unavailable from 2026-08-04, fully deprecated 2026-10-05. Editing now happens in Webflow itself, by role:
  - **Content editor:** edits text, links, images and CMS content, with the Pages, CMS, Assets and Settings panels. Open from the Dashboard or with `?update`.
  - **Marketer:** page building.
- Designers can lock elements against editing (Editing permissions).
- In the CMS panel / Collection manager you edit item fields directly. Items have draft / publish / schedule states (backups refer to "scheduled Collection items" and "Queue to publish").
- AI can generate sample items on CMS plans.
- Sources: help /48412420902675 (Legacy Editor deprecation FAQ, upd 2026-10-07); /33961251014931 (Content editor); /33961244069395; /34297897805715.

### M07 — CMS API / CSV import / limits — `CONFIRMED`
- **CSV import** maps columns to fields and offers a pre-import backup. Image URLs are allowed but get **no responsive variants**. Multi-image values are separated by `;`. Rich text accepts HTML, which gets cleaned.
- **CSV export** works per Collection.
- **APIs:** a REST Data API v2 with CMS CRUD, plus Sites, Pages, Assets, Ecommerce, Users, Forms and Custom Code APIs.
- Item limits depend on the plan (M01). Item IDs are stable across backup restores made after 2024-03-25.
- Sources: help /33961290794771 (CSV import, upd 2026-08-18); /33961356296723 (Intro to APIs); /33961244069395.

---

## PAGES / SITE

### P01 — Pages panel — `CONFIRMED`
- Open with P. It lists static pages, **folders** (nestable, slugs become path segments, can be password-protected), CMS Collection pages, Utility pages (404, password), User and Ecommerce pages.
- **Create page:** blank, from a static **page template** (up to 40), as a draft, or as a **branch**.
- Per page: duplicate, delete, rename, parent folder, slug, set as homepage.
- Static page limits depend on the plan (Basic/Premium 300 from 2026). Branches, templates, Collection, User, Ecommerce and Utility pages do not count.
- Sources: help /33961360067987 (Pages panel); /33961390398483 (Page folders); /33961210206483; /51059955082387.

### P02 — Page settings (SEO / OG / custom code / password) — `CONFIRMED`
- Gear icon on a page:
  - General: name, slug, parent folder, homepage.
  - **Password protection:** needs a Site plan. Can be set per page, per folder (overrides the pages inside) or on a Collection template.
  - **SEO:** title, description.
  - **Open Graph:** title, description, image.
  - **Site search** settings.
  - **RSS** (Collection pages).
  - **Custom code** (head / before `</body>`).
- On templates, SEO and OG fields can use CMS fields.
- Uploaded files are not protected by page passwords.
- Sources: help /33961360067987; /33961298873235 (Password protect, upd 2026-08-04); /33961357265299.

### P03 — Site settings (domains, fonts, favicon, redirects, sitemap, robots) — `CONFIRMED`
- **Publishing tab:** staging subdomain (editable `*.webflow.io`), custom domains (buy through IONOS or connect your own), **301 redirects** (old path → new URL, folder wildcards, CSV import/export, no hard cap but about 1,000 recommended, paid plan required).
- **SEO tab:**
  - **Auto-generated sitemap.xml** (lastmod, hreflang with Localize) or a custom sitemap.
  - **robots.txt rules** (Indexing).
  - Disable indexing of the staging subdomain.
- **Fonts tab:** Google, Adobe, custom.
- **Forms tab:** submissions, defaults.
- **Apps & Integrations:** reCAPTCHA, Turnstile bot blocking.
- **Custom code tab**.
- **Backups**.
- Favicon and webclip are site-level settings. *UNCONFIRMED*: exact tab placement for favicon, not fetched.
- Sources: help /33961294898835 (Redirects, upd 2026-09-08); /33961211526291 (Import/export redirects); /33961355371667 (Sitemap); /41954080897683 (robots.txt); /33961419650067; /33961334343827 (Connect domain).

### P04 — Assets panel — `CONFIRMED`
- Open with J.
- **File types:** PNG, JPEG, GIF, SVG, **WebP, AVIF**; PDF and Office documents; audio; Lottie JSON; ZIP.
- **Size limits:** images 4MB, documents and audio 10MB, ZIP 25MB. Documents and audio need a paid plan.
- **Folders** (nestable), including a special "well-known" folder.
- **Alt text** set per asset.
- **Responsive images:** Webflow automatically generates srcset/sizes variants for images uploaded in Webflow (Assets panel or CMS field), but not for CSV or URL imports. It keeps originals that are already well compressed. A per-image "Disable responsiveness" option exists, and variants can be regenerated across the site.
- **Image conversion tool:** converts existing JPEG/PNG to **AVIF or WebP** in Assets or CMS. It replaces the originals, at 100 assets per request and 10 requests per minute. Webflow advises WebP for Open Graph images.
- Asset files are public URLs (asset privacy is a separate article).
- Sources: help /33961269934227 (Assets panel, upd 2026-06-02); /33961378697107 (Responsive images); /33961311761939 (Image conversion tool).

### P05 — Fonts — `CONFIRMED`
- Style → Typography → Font → "Add fonts" opens Site settings → Fonts.
- Sources:
  - **Google Fonts:** choose variants, languages and scripts. They load from Google's API, which raises GDPR concerns, so Webflow suggests self-hosting.
  - **Adobe Fonts**.
  - **Custom upload:** check the licence. Rename a custom font that shares a name with a Google font. Variable fonts are supported.
- **No paid plan needed** for Google or custom fonts.
- Font **variables** and Libraries can share fonts.
- Sources: help /33961364593043 (Google Fonts, upd 2026-08-10); /33961287058451 (Custom fonts); /33961307448979 (Variable fonts).

---

## INTERACTIONS

### I01 — Interactions (triggers) — `CONFIRMED`
- **Interactions with GSAP** (default on new sites):
  - **Triggers:** Click, Hover, Mouse move (continuous, with smoothing and rest state), **Page load**, **Scroll**, Custom event.
  - **Targets:** element ID, class, attribute, or "this element".
  - **Scopes:** all matching, children, siblings, parent, next/previous sibling, descendants, and more. In components: main, variant or a single instance.
  - Conditions can gate a trigger.
  - Settings exist for prefers-reduced-motion and for **page scoping** (which pages load the interaction).
  - **No navbar/tabs/dropdown/slider-specific triggers** in GSAP. Those stay in Classic.
- **Classic Interactions:** element triggers (mouse click, hover, mouse move over element, scroll into view, while scrolling in view) and page triggers (page load, page scrolled, while page is scrolling, mouse move in viewport), plus navbar/dropdown/tab/slider triggers. Per-breakpoint enablement. Classic is **not compatible with real-time collaboration**. *Some Classic trigger names come from memory and were partly blanked in the fetched text.*
- The Interactions panel opens with H. A dropdown at the bottom switches between versions.
- Sources: help /42832349989395 (Triggers & targets, upd 2026-07-20); /46300264646803 (GSAP vs Classic, upd 2026-09-08); /33961357722643 (Classic triggers).

### I02 — Timeline / animation editor — `CONFIRMED`
- GSAP version: a **horizontal timeline**. Actions run in sequence or in parallel.
- **Action types:**
  - **Animation:** From / To / FromTo tweens.
  - **Set:** instant; add/remove/toggle class, non-interpolable properties such as display.
  - **Lottie**, **Spline**, **Rive**.
  - **Animate variable**.
- **Action settings:** duration, start time, **easing** (presets plus an **advanced easing editor**), **stagger**, **repeat** (count, infinite, yoyo).
- **Target properties:** transforms and style properties.
- **Split text** into words, lines or characters.
- **Saved presets**.
- Mouse move has X / Y / interval timelines, with velocity.
- **Timeline shortcuts:** H hand tool; Opt+=/- zoom; Opt+./, nudge 10ms; Shift+./, nudge 100ms; Cmd+A/C/V/D.
- Classic used a vertical action list with percentage keyframes for scroll and mouse. *UNCONFIRMED in fetched text; from memory.*
- Sources: help /42832337629075 (Actions, upd 2026-07-20); /42861689104531 (Timeline); /33961359609875.

### I03 — GSAP-based interactions (2025 redesign) — `CONFIRMED`
- Webflow acquired GSAP; **GSAP became free** (webflow.com/updates/gsap-becomes-free). **Interactions with GSAP launched summer 2025** for all plans at no extra cost and is the default on new sites.
- **Only in GSAP:** horizontal timeline, real-time collaboration, page branching, repeat/stagger/split-text actions, interactions on non-primary locales, reduced-motion settings, **DevLink component export with interactions**, granular scroll and click settings, advanced targeting, custom presets, instance-scoped interactions, Component Canvas support.
- **Only in Classic:** navbar/dropdown/tab/slider events.
- Running both on one site costs performance. GSAP is required for Marketplace templates.
- Sources: help /46300264646803; webflow.com/updates/introducing-webflow-interactions-powered-by-gsap; webflow.com/blog/webflow-interactions-with-gsap.

### I04 — Lottie / Spline (and Rive) — `CONFIRMED`
- **Lottie:** a native element (Add → Media). Upload JSON to Assets. Controlled by Lottie actions in GSAP, or embedded in Classic.
- **Spline:** a native element. Paste the `.splinecode` URL in Element settings. Objects and events are animated through GSAP Spline actions.
- **Rive:** a native element. GSAP Rive actions set ViewModel properties.
- Sources: help /33961236080787 (Spline); /47347661565203 (Lottie in GSAP); /42832337629075.

---

## PUBLISH

### X01 — Publish flow — `CONFIRMED`
- Open with the Publish button or Shift+P. Tick the targets: **Webflow staging subdomain** (`site.webflow.io`, editable, indexing can be disabled) and/or **custom domains**, then "Publish to selected domains". A **custom staging domain** is also supported.
- **Single-page publish:** "This page" / "This CMS template". Needs **Team or Enterprise** plans and one prior full publish. Staging first, then production. Also available through API v2.
- **Enterprise publishing workflow:** Designer → Staging → Production, with diff summaries.
- Publishing requires the **Can publish** permission (configurable on Growth/Agency/Enterprise).
- Sources: help /33961419650067 (Staging subdomain, upd 2026-08-02); /50064706725395 (Single page, upd 2026-08-10); /46651740529811 (Publishing workflow); /33961351954579; /46651756818323 (Custom staging domain).

### X02 — Backups / version history / restore — `CONFIRMED`
- **Automatic restore points** on every 50th autosave and on each restore. **Manual snapshot** with Cmd+Shift+S plus a description.
- **Paid Site plans:** unlimited backups that can be restored at any time. **Free Starter:** only the 2 most recent backups (unless the Workspace is paid).
- **A restore affects:** scheduled CMS items (set to "queue to publish"), reCAPTCHA keys, comments, locales and inventory (optional). Collection and item IDs are preserved for backups made after 2024-03-25.
- A restore locks the site for all users until it finishes.
- **Site Activity log** (Enterprise): class, component, variable, code, CMS, settings, backup, page, branch, publish and library events.
- Sources: help /33961244069395 (Backups, upd 2026-07-02); /46651707969043 (Site Activity log); /43232037920275.

### X03 — Code export — `CONFIRMED`
- **Workspace plans only**, not Site plans. Main menu → Code export, or Shift+E → Prepare ZIP. Cmd+O shows a **Minify HTML** option.
- Exports HTML, CSS, JS and assets with no attribution.
- **Excluded:** CMS, User Accounts and Ecommerce data, code components, localized content. Collection lists show their empty state.
- **DevLink** exports components to React and imports React **code components**.
- Sources: help /33961386739347 (Code export, upd 2025-10-31); /33961378995219 (DevLink).

### X04 — Hosting / CDN / SSL — `PARTIAL`
- Managed hosting with **automatic SSL/TLS** on every Site plan, a global CDN, DDoS and bot protection. Domains can be bought through IONOS. No email hosting. A self-managed reverse proxy is supported. Bandwidth is per plan (Premium 50GB, with add-ons up to 2.5TB).
- *UNCONFIRMED*: the CDN vendor. Webflow pages say "global CDN provider". An older staff forum post cites AWS CloudFront and Fastly.
- Sources: help /33961342422547 (Hosting overview); /33961362849811 (SSL hosting); webflow.com/feature/hosting; /51059955082387.

### X05 — Pre-publish audits — `PARTIAL`
- **Audit panel:** accessibility (alt, link text, heading order, duplicate IDs) and SEO issues before publishing. Critical issues are marked red.
- The **Enterprise publishing workflow** shows a pre-publish summary of unpublished changes.
- Webflow AI offers SEO/AEO auditing (help /45696502240147).
- *UNCONFIRMED*: a native **broken-link checker**. None found in the Help Center.
- Sources: help /33961313088531; /46651740529811.

---

## FORMS

### F01 — Form block, fields, submissions, notifications, spam, integrations — `CONFIRMED`
- **Form Block:** a wrapper holding fields, a Success message and an Error message. Default fields are Name and Email plus a submit button.
- **Fields:** Label, Input, Text Area, Checkbox, Radio, Select, **File upload** (Premium), reCAPTCHA, Form Button (with a Disabled state).
- **Form settings:** name, success/error messages, redirect, and **Send to**: Webflow storage, **email notifications** (recipients, sender, reply-to, subject, body; Starter limited to 5 Workspace-member recipients), **webhooks**, and other routes.
- **Submissions** are listed in Site settings → Forms. The Forms API exposes them.
- **Spam:** reCAPTCHA element, **Cloudflare Turnstile bot blocking** (site-level), spam filtering, honeypot technique.
- On exported sites, submissions need a separate setup.
- Sources: help /33961347548563 (Add forms); /33961344521235 (Submissions); /34277758554771 (Spam); /33961418101139 (reCAPTCHA); /45025662151827 (Honeypot).

---

## COLLAB

### T01 — Roles — `CONFIRMED`
- **Seats:** Full (Admin, Site admin, Designer), Limited (Marketer, Content editor), Client (per site, for freelancers and agencies), Free (Reviewer; 100 included), Guest (freelancer or agency).
- **Site roles:** **Site manager**, **Designer** (plus Limited designer and Designer-needs-approval on custom/Enterprise), **Marketer** (builds pages from components and templates), **Content editor** (edits content), **Reviewer** (view and comment).
- Site-role reassignment is available on Growth/Agency/Enterprise. "Can publish" can be toggled on Growth/Agency. Enterprise adds custom roles, page-specific and Collection-specific access, and "preview as role".
- Sources: help /33961273067411 (Seats, roles, upd 2026-10-05); /41015796747667 (Site roles); /41015530193811 (Workspace roles).

### T02 — Page branching / staging — `CONFIRMED`
- **Team and Enterprise Platform plans** only.
- Branch any page (static, utility, user, ecommerce, Collection template, draft, new) to get a working copy that does not affect main. Changes from main can be pulled into the branch (classes, components).
- **Merge** brings the branch into main. **Content edits made on the original page meanwhile are lost**; component, class and interaction changes are kept.
- Branches support real-time collaboration, Localize and comments. Comments are deleted on merge.
- **Inside a branch you cannot:** create or modify CMS Collections or items, Interactions, variables or swatches.
- Site managers and designers can merge. Content editors and marketers can create but not merge.
- A branch must be merged to publish. Branches do not count toward page limits and do not survive transfer or duplication.
- Source: help /46651751861139 (Page branching, upd 2026-09-18).

### T03 — Comments — `CONFIRMED`
- Comment mode (C or the top-bar icon): click an element to pin a comment. Comments are per breakpoint and threaded, can be resolved, shared by link, and support notification preferences.
- On templates, comments on static elements show on every item, while comments on CMS-bound elements are per item.
- All roles, including reviewers and guests, can comment. Share links let stakeholders comment without an account.
- **Comments are not compatible with real-time collaboration.**
- Accented characters are not supported.
- Sources: help /33961339882131 (Comments, upd 2026-09-02); /43232037920275.

### T04 — Simultaneous editing / locking — `CONFIRMED`
- **Real-time multiplayer, not page locking** (since the Jul 2025 beta; now a core feature on every plan). Teammates edit the same or different pages at once.
- **Presence:** avatars in the canvas toolbar and a **coloured outline around the element each person is working on**.
- **No live cursors.** **No keystroke sync**: text syncs when the user clicks out of the text block.
- **Conflict rule:** "the last change that hits our servers" wins. Your change may be reverted if someone else's lands later.
- **Undo/redo is per user.**
- Limit of **25 concurrent users**.
- Not compatible with **Classic interactions** or **comments**.
- Older material describing a request-control handover (one designer at a time with a 30-second response window) is **superseded**.
- Sources: help /43232037920275 (Real-time collaboration, upd 2026-07-17); webflow.com/blog/real-time-collaboration.

### T05 — Edit mode for clients — `CONFIRMED`
- Clients get **client seats** with the Content editor or Marketer role inside Webflow. The legacy Editor is gone (M06).
- **Content editor:** a simplified interface. Click an editable element, then its Edit icon, to change text, links or images, with autosave. Can edit component props locally and CMS content, use the Assets panel, comment, and publish if allowed.
- **Marketer / page building:** builds pages from designer-made **page templates** (max 40, static only) and components dropped into **Page Slots**. Without page slots, marketers can only edit content.
- Designers lock elements through Element settings → Editing permissions.
- Sources: help /33961251014931 (Content editor, upd 2026-09-02); /33961210206483 (Page building); /48412420902675.

---

## OTHER

### O01 — Ecommerce — `PARTIAL`
- Ecommerce is enabled per site and **cannot be disabled afterwards**.
- It creates Products and Categories Collections (plus SKUs). Products have options and variants, inventory, CSV import/export, and cart and checkout elements and pages, all designable.
- Separate Ecommerce Site plans exist and were unchanged in May 2026.
- **Not compatible with Localize.**
- *UNCONFIRMED*: payment providers and transaction fees were not fetched (commonly Stripe and PayPal).
- Sources: help /33961345384339 (Ecommerce overview, upd 2026-07-02); /51059955082387; /33961240752147.

### O02 — Localization (Webflow Localize) — `CONFIRMED`
- A primary locale plus secondary locales (language, or language + region). Secondary locales **inherit everything** until overridden.
- Per locale you can override text, assets, **visibility**, **styles** (Current locale state), page settings and SEO, and CMS items and fields. Any override can be reset.
- AI translation draws on a monthly word allowance, then AI credits. Exclusion rules control what is not translated.
- Locale routing and subdirectories, hreflang in the sitemap. Domain-level automatic routing on Advanced/Enterprise.
- It is a paid add-on and not compatible with Ecommerce.
- Sources: help /33961240752147 (Localize overview, upd 2026-09-29); /33961235760531; /33961252209171.

### O03 — Apps / marketplace / Designer API — `CONFIRMED`
- **Apps** install from the **Webflow Marketplace** or the in-Designer **Apps panel**, authorised per site or per Workspace (Workspace authorisation covers all future sites).
- **Data REST API v2:** Sites, Pages, Assets, CMS, Ecommerce, Users, Forms, Custom Code, single-page publish.
- **Designer API:** Designer Extensions that can read and write elements, styles, variables, modes, components, slots and variants in the open Designer.
- **DevLink:** React export and import, **code components**.
- **Webflow Cloud:** full-stack app hosting.
- **Webflow MCP server**.
- Sources: help /33961266872211 (Apps overview); /33961356296723 (APIs); /33961378995219 (DevLink); /40846212086035 (Webflow Cloud); /52536562285203 (MCP server); developers.webflow.com/designer/reference/variable-modes.

### O04 — Site analytics / Optimize — `CONFIRMED`
- **Analyze** (Insights tab):
  - Goals: click, page view, custom; conversion rate = conversions ÷ sessions.
  - Clickmaps.
  - Audiences.
  - Page-level **Analyze mode** inside the Designer.
- **Optimize:**
  - A/B tests and **personalization** optimizations, plus **AI-optimized** optimizations.
  - CRM integrations (HubSpot, Salesforce, 6sense, Demandbase).
  - An Optimize overview with an ROI simulator (Enterprise with a site goal).
  - Optimization wrappers appear in the Navigator.
- Sources: help /40217063229203 (Analyze goals, upd 2026-08-20); /40217030018835 (Analyze mode); /37968810279827 (Optimize overview); /34167339728531 (Personalization); /41431876977427 (Optimization wrappers).

### O05 — AI features (noted only; Buildrick: no AI this version) — `CONFIRMED`
- **Webflow AI** includes:
  - **AI site builder** (generates a whole site)
  - **AI Assistant** (Opt+A): contextual help and, in beta, generating or modifying page sections
  - **AI copy** generation and refinement (paid plan)
  - **AI CMS item** generation
  - **AI translation** (Localize)
  - **AI code components**
  - **Build full-stack apps with Webflow AI** (Webflow Cloud)
  - SEO/AEO audit with AI
  - AI-optimized Optimize
  - Connectors for ChatGPT, Codex, Cursor and Gemini through MCP
- Admins can switch it on or off per Workspace. **AI credits** have been included in all Workspace plans since May 2026.
- Sources: help /34297897805715 (Webflow AI overview, upd 2026-05-21); /34205154436243; /51059955082387.

---

## Tally

| Status | Count | IDs |
|---|---|---|
| CONFIRMED | 57 | all others |
| PARTIAL (core sourced, ≥1 detail UNCONFIRMED) | 8 | C03, C08, C11, S08, S11, X04, X05, O01 |
| UNCONFIRMED (no source at all) | 0 | — |

Inline UNCONFIRMED sub-claims to watch:
- Multi-select absence after Dec 2025 (C03).
- The full context-menu list (C08).
- Undo stack scope and depth (C11).
- Typing a raw `calc()` into a plain Style field (S08).
- Copy/paste-styles absence (S11).
- No `:focus-within` state (S04).
- A Navigator-native hide toggle (C10).
- The exact Classic trigger and keyframe UI (I01/I02).
- Favicon settings tab (P03).
- CDN vendor (X04).
- A broken-link checker (X05).
- Ecommerce payment providers (O01).

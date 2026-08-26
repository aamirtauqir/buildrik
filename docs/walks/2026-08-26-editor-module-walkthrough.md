# Editor module walkthrough — 2026-08-26

Every module of the editor, opened in the running app at 1440×900 against the
fixture site `cmrsur1fp000unh3rvmmiq25t`, with what it does and where it stops.

Harnesses, all committed and re-runnable:

| Script | Covers |
|---|---|
| `scripts/baseline/module-walk.mjs` | the 13 rail tabs, through their real doors |
| `scripts/baseline/inspector-walk.mjs` | the inspector, one element of every type |
| `scripts/baseline/canvas-walk.mjs` | canvas overlays, breakpoints, context menu |

Nothing below is read off a screenshot by eye. Where a number appears it was
measured in the page, and where a claim could not be settled it says so.

---

## The rail is six items; seven tabs live off it

`tabsConfig.ts` defines 13 tabs. `RAIL_FIGMA` renders six — Insert, Layers,
Pages, Media, Content, Brand — and the walk confirms exactly those six carry a
`data-tab` button. The other seven are reached elsewhere:

| Tab | Door | Verified |
|---|---|---|
| AI | bare `I`, or `ctrl+shift+a`, or ⌘K → "Open AI panel" | ✅ |
| Templates | `T` | ✅ |
| Components | `⇧A` | ✅ |
| Settings | Site menu → "Site settings", or `⌃,` | ✅ |
| History | Site menu → "Version history" | ✅ |
| Publish | topbar **Publish** | ✅ |
| Review | topbar **In review** pill | ✅ |

**Gap — documentation.** `tabsConfig.ts:358-373` lists the off-rail door for six
of these seven. `review` is absent from that list. Its door exists and works;
the comment that exists to stop a surface being stranded is the thing that is
incomplete. This matters because that comment is the only record of the routing.

---

## Module by module

### Insert (`add`, `A`) — 64 controls
53 elements across ELEMENTS, plus search (⌘F) and "Paste HTML…". Opens by
default; the shell restores it across a reload.

**Gap — intermittent.** Toggling the panel can raise
`[Recovery] Runtime fault (error): ResizeObserver loop completed with undelivered
notifications.` Re-measured over three fresh loads: **zero** errors on load in
all three, and the fault appeared on one of three close-then-reopen cycles. It
is caught by the recovery layer and nothing visibly breaks.

(This entry first said the error fires on every open of the editor's default
surface. That was one observation from the walk generalised into "every
session"; the count above is what three runs actually produced.)

### Layers (`L`) — 71 controls
Tree of the page with search, expand/collapse all, per-row "Dim in editor" and
"Lock element", and display settings. Worked throughout.

### Pages (`P`) — 6 controls + a page tree
Search, Listings, "Add new page", "More add options". The page rows themselves
are `div[role="treeitem"][tabindex="0"]` — reachable and correct for a tree.
(An earlier reading of this walk called them unreachable because it only counted
`<button>`s. They are fine.)

**Gap — a board for a surface that does not exist.** The census carries
`BL-0164 pages-add-page`, but both "Add new page" buttons
(`AddPageButton.tsx:39`, `PageTabBar.tsx:352`) create a blank page on click.
There is no add-page dialog. The state cannot be captured — the attempt leaves
a page behind in the fixture — and it is excluded from
`scripts/baseline/figma-refresh.mjs` with that reason written next to it.

### Media (`assets`, `M`) — 18 controls, **3 disabled**
Search, type pills (All / image 2 / video 1 / svg 0 / icon 0), the three fixture
assets, a drop zone, and Upload / Stock / Icons.

**Gap — the drawer's view controls are dead.** `Grid view`, `List view` and
`Sort` are rendered `disabled` with no handler at all:

```tsx
// SlimLauncher.tsx:279-286
<IconButton label="Grid view" size="sm" pressed disabled …>
<IconButton label="List view" size="sm" disabled …>
<IconButton label="Sort"      size="sm" disabled …>
```

The comment above them reads *"Still disabled controls, not decoration (T12
lights them up)"* — T12 never happened. The same controls work in the full-page media
library (`AssetGrid.tsx:312-333`, real `onClick` + `aria-pressed`): clicking
List view there flips `aria-pressed` to `true` and Grid view to `false`, so the
baseline state `BL-0162 media-list-view` IS reachable — through "Expand Media",
never from the drawer. Sort has no implementation on either surface.

A caution for anyone testing this: while the full-page library is open, the
drawer's three disabled buttons are still in the DOM behind it, and they come
FIRST in document order. A `querySelector('[aria-label="List view"]')` returns
the dead one and reports the working control as disabled — which is exactly the
reading this walk made before counting the matches (there are five).

**Working, and worth saying so:** the drawer's `Stock` and `Icons` buttons open
drill-in overlays inside the drawer. Stock gives "Stock photos" with
Orientation / Colour / Type filters and "Search to browse free photos" — this
with **neither** `PEXELS_API_KEY` nor `UNSPLASH_ACCESS_KEY` set in
`.env.local`, so the surface is reachable and it is only the results that
depend on the keys.

### Content (`D`) — 3 controls empty, walked populated on `scratch-smoke`
On the baseline fixture: the Collections explainer and "Create a collection" —
the empty state. `scratch-smoke` already carries a populated one, so the whole
module was walked there rather than by creating data:

| Surface | What is behind it |
|---|---|
| root | COLLECTIONS 1 · `Products 4 ›` · + New collection · DATA: Sources 0, Variables 0, Conditions 0 |
| Products | 4 records (Minimalist Watch, Premium Wireless Headphones, Organic Cotton T-Shirt, `Record dm5y`), + Add, `Fields 8 ›`, `Dynamic pages ›` |
| Sources | "No data source connected" · + Connect a source · *"A source feeds a collection. Edits sync one way — from the source in."* |
| Variables | "No variables yet" · + New variable |
| Conditions | "No conditions yet" · + New condition |

**Worth quoting, because the product says it before anyone has to find it:**
Variables reads *"A variable is a value you write once and reuse in this panel
— `{{site.name}}` is saved in this browser, and pages do not read it yet."*
That is a real limitation — variables are editor-local and never reach the
page — stated plainly in the surface that has it.

**Gap — the drill-in back button names the wrong destination.** Inside the
Products collection the back control reads `‹ Products` and carries
`aria-label="Back to Products"`. Pressing it lands on the Content root, not on
Products. The accessible name is the surface being LEFT, so a screen-reader
user is told the opposite of where the button goes.

`ContentViews.tsx:95` interpolates the current label:

```tsx
<Button onClick={onClick} aria-label={`Back to ${label}`}>
  ‹ {label}
</Button>
```

The same codebase gets this right three other places, which is what makes it a
slip rather than a convention: `StockBrowserOverlay.tsx:200` shows `‹ Stock
photos` with `aria-label="Back to media grid"`, `AssetDetailOverlay.tsx:297`
picks the destination per view, and `DrillInHeader.tsx:130` uses
`parentName`. Brand's drill-ins carry no `Back to…` label at all — their back
control is the bare `‹ Tokens` text.

### Brand (`design`, `B`) — 16 controls, 2 disabled
Friendly / Full-power mode switch, then drill-in rows: Tokens 4, Presets 18,
Starters 6, Classes, Components, Typography, Colour mode, Lint 2, Import/export.
`Discard` and `Apply Changes` are disabled with no pending edit — correct.

**All nine drill-ins walked** (`scripts/baseline/brand-walk.mjs`). Every one
opens, every one has a back door, none mutated the site (52 elements before and
after each), no console errors:

| Drill-in | What is behind it |
|---|---|
| Tokens | 15 token families — color 4, the rest 0 |
| Presets | 11 component presets, 18 variants (Button 3, Card 2, Link 2, Badge 2, Alert 2, Layout 2, and 5 with one each) |
| Starters | 6 themes — Buildrik Default, Stripe Blue, Notion Warm, Apple Minimal, Linear Dark, Vercel Mono, over the warning "Applying a starter overwrites your tokens" |
| Classes | `.btn` used 5×, `.buildrick-page-root` used 3×, `.container` used 2× |
| Components | 14 components, 34 controls |
| Typography | ACTIVE FONTS — Inter Display 2 weights, Inter Body 1 weight, Geist Mono not used yet |
| Colour mode | Light / Dark, and 17 tokens under "NO DARK VALUE", each offering Set |
| Lint | 2 failures |
| Import / export | dark strategy (media-query / data-attr / off), CSS + JSON + Tailwind + Figma exports |

Three of these have few *controls* (Classes, Typography and Lint have 5 each)
because they are read-only reports, not editors. That is not an empty panel.

**Gap — an engine-internal class is listed as one of the user's.** Brand →
Classes offers `.buildrick-page-root` beside `.btn` and `.container`. That class
is not the user's: the engine writes it onto every page root
(`PageManager.ts:74`, `HTMLParser.ts:75`, `RecoveryManager.ts:184`) and styles
it in `Canvas.css` and `site-content.css`. It reads as something the customer
authored and might edit or remove.

**Still true from 2026-08-19 — the shipped palette fails its own linter.** Lint
reports exactly two: `color-accent` and `color-success`, both "Fails WCAG AA on
the page background". The panel is straight about its limits: *"Auto-fix isn't
available yet — the linter reports what is wrong, not what to replace it with.
Edit the token in Tokens."*

**Not a gap, checked:** the 17 tokens with no dark value are simply unset on a
site nobody has themed, and the exporter handles that correctly —
`CSSBundler.ts:79` emits the dark block only `if (darkColorLines.length > 0)`,
so choosing a dark strategy with nothing set produces no empty `@media
(prefers-color-scheme: dark)` block.

### AI (`I`) — 7 controls, 1 disabled
Scope selector ("Whole page"), prompt box, Send (disabled while empty —
correct), three suggestion chips, and "✦ Draft a new section from a brief".

**Observation.** ⌘K lists this one surface twice under two different chords —
"GO TO · Open AI panel · `I`" and "ACTIONS · Open AI Assistant · `ctrl+shift+a`".
Both were pressed; both open the same panel. Two rows, one destination.

### Templates (`T`) — 14 controls
Ten page templates with section counts, search, and "Browse all templates".

### Components (`⇧A`) — 5 controls
"1 components found", the `U4 Override Probe` master with its 4 instances, and
two doors to create a component.

### Settings (`⌃,` / Site menu) — modal, 8 controls
Opens **Project settings** with General / Canvas / SEO tabs, project name,
author, Cancel / Save.

Two earlier passes of this walk reported this door dead. Both were wrong: the
modal's announcing element measures 0×0 (see *Cross-cutting* below) and every
probe filtered it out. It works.

### History (Site menu) — 44 controls
**Version History** with Saves / Named milestones / Published tabs, a
Milestones ⇄ All-changes switch, search, and per-save Compare / Restore /
Delete. Restore was exercised for real during this walk — it recovered a
deleted element and the count returned to its baseline — and it raised the
correct pruning notice: *"Older auto-saves were removed · Past 50. Named
versions and the approved one were kept."*

### Publish (topbar) — modal, 2 controls
Confirm modal: Target · your connected Vercel project / Pages · 4 pages /
Client approval · Round 5 is still open / Rollback · the last 20 versions stay
restorable, then Cancel and **Publish now**. `sites.prePublishChecks` returns
`ready: true` with 3 passes and 3 warnings. No publish was fired; all three job
tables were checked and stayed at zero rows.

**Gap — the confirm modal's rows have no horizontal inset.** Measured against
the modal panel itself (not the scrim — that mistake measures everything
against 1440), every one of the four rows sits flush on both sides:

| Row | label inset from left | value inset from right |
|---|---|---|
| Target | 0px | 0px |
| Pages | 0px | 0px |
| Client approval | 0px | 0px |
| Rollback | 0px | 0px |
| *footer* `Publish now` | — | **20px** |

The footer is inset by 20px, so the four information rows are the only band
that touches the border, and the longest value ("The last 20 versions stay
restorable") runs straight into it.

### Review (topbar "In review" pill) — 7 controls, 1 disabled
"0 of 0 · Sent 17h ago · reviewer-fixture@buildrik.local", reply box, Send
(disabled while empty), "Compare with approved", "Re-send for review",
"Revoke link".

---

## Inspector — driven by selection, no door of its own

One element of every type on the fixture page was selected and the panel read.
Container `aside.layout-shell__inspector`, box `[1140, 104, 300, 732]`.

| Selection | Controls |
|---|---|
| (nothing selected) | 1 — "Select something on the canvas to edit it. ✦ Ask AI ›" |
| container | 64 |
| paragraph | 60 |
| heading | 60 |
| grid | 53 |
| flex | 64 |
| input | 89 |
| button | 124 |

Every profile carries the same header cluster — Pick element on canvas, Select
parent, Ask AI about this element, Bind to collection field, Element actions,
"Edit reach: this item", "Breakpoint: Desktop", "State: Base" — then collapsible
sections.

**The sections were counted, then opened** (`inspector-sections.mjs`). Counting
controls covers whatever happens to be expanded by default, which is not the
same as knowing what the inspector offers. Expanding everything on a container
takes it from **31 controls to 114**; on a heading, from 71 to 102.

The header cluster is itself expandable, and what is behind it matters:

| Header control | Behind it |
|---|---|
| Element actions | Duplicate · Copy styles · Paste styles · Delete |
| Edit reach: this item | "Just this element" · "Every edit also goes to 29 others" · "Site-wide colors & fonts live…" |
| Breakpoint: Desktop | Desktop · Tablet ≤1023px · Mobile ≤767px |
| State: Base | Base · `:hover` · `:focus` · `:active` · `:disabled` |
| Bind to collection field | + Create Collection |

The sections differ by element type, which is the point of profiling them:

| Section | container | heading | what it holds |
|---|---|---|---|
| Typography | — | **default open** | family, size, weight, colour, transform, decoration, letter/word |
| Layout | default open | — | |
| Position, overflow & visibility | ✓ | — | |
| Size | ✓ | ✓ | Fixed / Fill / Hug content |
| Spacing | ✓ | default open | padding top-bottom & left-right, gap, margin |
| Background | ✓ | ✓ | color · gradient · image, fill |
| Border | ✓ | ✓ | width, None/Solid/Dashed/Dotted/Double, colour |
| Corner radius | ✓ | — | unlink corners, tl/tr/bl/br |
| Effects | ✓ | ✓ | opacity + shadow None/SM/MD/LG/XL/2XL — the biggest section, +34 controls |
| Interactions | ✓ | ✓ | + Add Interaction |
| Animation | ✓ | ✓ | Enable |
| Visibility | ✓ | ✓ | Visible on Desktop / Tablet / Mobile |
| Element Properties | ✓ | ✓ | element-id, Element title, `data-*` pairs — **and on a heading, the H1…H6 level** |
| CSS classes | ✓ | ✓ | Add class |

Worth knowing: **a heading's level is set in Element Properties, not
Typography.** Typography governs how it looks; the semantic level sits with the
element's attributes.

**All 53 element types are now swept.** `scripts/baseline/element-sweep.mjs`
inserts every item the Insert palette offers and reads the inspector for each.
It runs against `scratch-smoke`, never the baseline fixture, because it mutates
the site it walks.

Every one of the 53 creates an element — there is no dead palette entry. 39
arrive with their own engine type; 14 arrive as a plain `container`:

| Arrives as | Palette items |
|---|---|
| own type | Heading, Text→paragraph, Link, List, Button, Icon, Divider, Progress, Countdown, Section, Grid, Columns, Flex, Input, Textarea, Select, Form, Image, Video, Audio, Gallery, SVG, Navbar→nav, Footer, CTA→section, Accordion, Testimonials, Pricing, Carousel→slider |
| `input` | Slider→range, Upload→file, Submit→button, Email, Password, Number, Date, Time, Color |
| `container` | Spacer, Label, Container, Stack, Card, Table, Checkbox, Radio, Switch, Lottie, Embed, Map, Tabs, Social Icons |

Inspector control counts run from 23 (SVG) to 158 (Lottie); the header cluster
is identical across every profile.

**Read those counts as expansion state, not capability.** They are what the
inspector shows with whatever sections happened to be open. `Section` counts 31
against `Container`'s 60, which looks like a thinner inspector for a layout
element — it is not: opening it shows the same twenty disclosures (Layout,
Position, Size, Spacing, Background, Border, Corner radius, Effects,
Interactions, Animation, and the header cluster). The difference was which ones
were expanded. Capability lives in `inspector-sections.mjs`, not here.

**`container` is the wrapper, not the markup — three readings retracted here.**
Table arrives as 46 engine nodes typed container/text/button and renders a real
`<table>` with `thead`, 4 `tr`, 4 `th`, `tbody` and 12 `td`. Tabs renders
`role="tablist"` with three `tab` and three `tabpanel`. Checkbox, Radio and
Switch each render a `<label>` wrapping a real `<input type="checkbox">` or
`type="radio"` — implicit association, which is valid — and Email / Date /
Color / Slider / Upload render `<input type="email">`, `"date"`, `"color"`,
`"range"`, `"file"`. Counting ENGINE types and concluding "these are divs" was
wrong three times before the DOM was read.

**Gap — the Accordion ships with no accessibility state.** Its header buttons
carry no `aria-expanded`, no `aria-controls` and no `role`; every one reads
`null`. `src/blocks/Components/Accordion.tsx` contains no `aria` or `role` at
all, and the string `aria-expanded` does not appear anywhere in the exported
HTML. A screen-reader user cannot tell an open panel from a closed one, and
nothing ties a header to the panel it controls. This is on the customer's
published page, not just the editor.

**Gap — the canvas renders `aria-modal=""` where the export renders
`aria-modal="true"`.** `Modal.tsx:48` sets `"aria-modal": "true"`, the element's
stored attributes hold `"true"`, and the Export-code view emits
`role="dialog" aria-modal="true"`. Only the editor's own canvas drops the
value, and `aria-modal=""` is not a valid token — the accessibility API reads
it as not-modal. `role` and `class` on the same element keep their values, so
this is specific. Editor-only, and the direction is the unusual one: the
exported page is the correct half.

---

## Canvas — overlays, breakpoints, context menu

Six overlay toggles in the footer, all present and all toggling: **Snap Guides**
(on by default), Spacing, Grid, Rulers, Badges, X-Ray.

Breakpoints, measured with the drawer closed so the host is at its widest
(`.layout-shell__canvas` = 1079px):

| Segment | `data-device` | canvas width | expected |
|---|---|---|---|
| W · Wide | `wide` | **1031px** | 1920px |
| D · Desktop | `desktop` | 1031px | 100% ✅ |
| T · Tablet | `tablet` | 768px | 768px ✅ |
| M · Mobile | `mobile` | 375px | 375px ✅ |

**Gap — the Wide breakpoint has no visible effect.** `DEVICE_SIZES.wide` is
`1920px` and `getCanvasStyles` sets both `width` and `maxWidth` to it, but the
canvas is a flex item in a centered flex host (`canvasStyles.ts:20-27`:
`display:flex; align-items:center; justify-content:center`), so 1920px shrinks
to the host width. Tablet and Mobile are narrower than the host, so shrink never
bites them and only Wide is affected. Clicking `W` changes `data-device` and
nothing else the user can see.

(An earlier reading here said Tablet was broken too. That was measured with the
drawer open, where the host is 760px and both Desktop and Tablet clamp to 712.
With the drawer closed Tablet is correct.)

There are **three** context menus, and they are different menus — worth saying
because a test that expects one row on all three fails the two that are right:

| Right-click on | Rows |
|---|---|
| a canvas element | Edit ▸ · Insert ▸ · Layout ▸ · Quick Style ▸ · Save as component · Reveal in Layers · Select Parent ← · Lock |
| a Layers row | Cut · Copy · Paste · Duplicate · Delete · Rename · Group selection |
| a Pages row | Rename… · Duplicate · Copy link · Page settings… · Delete page |

All three open, and none of their rows is disabled.

---

## Topbar

Left to right: `‹ Exit`, `Next ›` (disabled), `Compare`, the **In review** pill,
Quick preview, Comments, the issues chip ("2 issues, 2 warnings"), Notifications
(5 unread), **Publish**, **Re-send**, **Site menu**.

The site menu carries 16 rows: Site settings `⌃,` · Version history `⌃H` ·
Publish panel · Publish history · Export code · Site health · Activity log ·
Templates · Components `⇧A` · Design system · Plugins · Enter view mode ·
Share preview link · Invite teammates · Account settings · Keyboard shortcuts
`⌘/`.

---

## The five modules with no rail tab

`src/editor/` carries five modules that no rail tab opens. Four of them are
live; one is not:

| Module | Status |
|---|---|
| `onboarding` | **live** — `AquibraStudio.tsx:702` renders `<OnboardingMount>`; it is the "Tip 1/4" strip and the "0 / 7 done" checklist visible in every capture. |
| `animation` | **live** — `inspector/sections/AnimationSection.tsx:150` renders `<AnimationEditor>` inside the inspector. |
| `export` | **live** — `StudioModals.tsx:165` renders `<ExportModal>`; its door is the site menu's "Export code". |
| `ecommerce` | **live** — `StudioModals.tsx:213` renders `<CollectionSetupModal>`, alongside the separate `CMSCollectionSetupModal` at `:267`. |
| `collaboration` | **the component is dead.** `<PresenceIndicators>` is rendered nowhere but its own test file. The shipped presence UI is `chrome-ui/Presence`, wired at `StudioHeader.tsx:635-641`. What survives from the old module is `toPresenceUsers`, a helper that happens to sit in the same file and is still imported. |

Two readings were retracted getting here. Searching for imports by path
(`from ".../editor/<module>"`) returned zero for all five, because four of them
are imported relatively (`../onboarding/OnboardingMount`) — the module looked
dead while its checklist was on screen in the screenshot beside it. And
`ecommerce/CollectionSetupModal` looked replaced by `CMSCollectionSetupModal`
until both turned out to be rendered, 54 lines apart, in the same file.

---

## Cross-cutting

**Modals announce themselves on a 0×0 element.** Both modals reached in this
walk — Project settings and the publish confirm — put `role="dialog"
aria-modal="true"` on an element whose bounding box measures `[0,0,0,0]`; the
painted panel is a descendant. This is why two separate probes reported both
doors dead, and it is worth knowing for anything that reasons about the dialog
box itself rather than its subtree.

---

## The site menu is not portaled, and it costs more than a screenshot

Opening the site menu and reading its DOM parentage:

```
div.tw:absolute      218 x 673     ← the menu
└ span.tw:relative    32 x 32      ← the Site menu button's wrapper
  └ header.tw:flex  1440 x 56      ← the topbar
```

A 673px-tall menu is a child of a 32px span inside a 56px header. It escapes
with `position: absolute`, so it looks right — but it is structurally inside a
box eleven times shorter than itself. Anything an ancestor gains later that
establishes clipping or a new containing block — `overflow: hidden`, a
`transform`, `filter`, `contain` — clips it or re-anchors it.

`packages/editor/CLAUDE.md` Gate 22 is exactly the rule this sidesteps: portals
must route through chrome-ui's overlay-root primitives. Gate 22 looks for
`createPortal` and `document.body.appendChild`, and this menu calls neither, so
nothing flags it. The publish confirm and Project settings modals DO portal —
they arrive in a capture as their own `OverlayMount` frame — and the menu does
not.

The visible consequence today is in the design file. html-to-design builds
Figma frames from the DOM box tree, so a capture of the editor with the menu
open renders without it, even though the capture script's own `PRE-CAPTURE`
line reports the menu open at the moment of capture. Frame `473:2` is named
`BL-0109 … site-menu-open … — CURRENT 2026-08-23` and shows no menu; `481:2` is
named `cmdk-open … CURRENT 2026-08-23 (first capture with the palette actually
open)`. The assertion lives in the frame NAME, which is worse than an empty
frame — it tells the next reader the surface was checked.

**This is specific to the topbar menu, not to overlays.** Every overlay that
lives inside the 732px drawer captures correctly, verified marker by marker:

| Frame | State | Marker found |
|---|---|---|
| `597:2` | media-stock-browser | "Stock photos" |
| `601:2` | media-icon-picker | "categories" |
| `602:2` | pages-more-add-options | "From template" |
| `606:2` | pages-context-menu | "Copy link" |
| `608:2` | layers-context-menu | "Group selection" |

An earlier draft of this section generalised the site-menu failure into
"popovers do not capture". They do. The one that does not is the one built
inside a box eleven times shorter than itself.
`scripts/baseline/figma-verify.mjs` checks frame CONTENT and renames the
failure to `CAPTURE INCOMPLETE` with its reason.

---

## Where the screens are

Every state walked above was re-captured from the running editor into the
baseline Figma file `Micuc1rmLcFhjxF1A08Kk2`, page `75:2`
("10.04 — ACTIVE — Editor"), on 2026-08-26. Before this, every editor frame in
that file dated from 2026-08-21 to 08-23 — 187 to 217 commits behind HEAD.

Frames are named `BL-#### / edit/:id / <state> / 1440 — CURRENT <date>`, and
the frame each one replaces is renamed `— SUPERSEDED <date> by <node>`. The
index is `scripts/baseline/inventory.json`, reconciled from the file itself by
`scripts/baseline/inventory-sync.mjs` — not maintained by hand here, so this
document cannot drift from the file.

Six states got a frame for the first time, because the census only ever covered
surfaces somebody had already drawn: **panel-ai**, **panel-components**,
**inspector-none**, and the three canvas breakpoints. The Wide board is worth
opening next to the Desktop one — they are identical, which is the gap above
made visible.

Three tools, all re-runnable:

| Script | Job |
|---|---|
| `figma-refresh.mjs` | capture a state, name it, supersede what it replaces |
| `figma-verify.mjs` | check what a frame CONTAINS; repair duplicate CURRENT claims |
| `inventory-sync.mjs` | reconcile the census against the file |

---

## The census counts surfaces it does not have

Going through the states the refresh did NOT re-capture turned up a different
problem: several BL ids describe one surface, so the count overstates coverage.
Each pair below was checked by reading both frames' text for a marker only that
surface carries.

| Surface | ids describing it | marker |
|---|---|---|
| Publish panel | **BL-0106, BL-0221, BL-0230** | "Since last deploy" — all three carry the same deploy summary; BL-0230's says "5 pages" because it was captured while a stray page existed |
| Site menu | BL-0109, BL-0122 | "Keyboard shortcuts" |
| Review panel | BL-0110, BL-0218 | "Compare with approved" |
| Templates panel | BL-0116, BL-0220 | "PAGE TEMPLATES" |
| Components panel | BL-0117, BL-0301 | the components list |

**And one frame claims a surface it does not show.** `BL-0219 publish-open`
(`359:2`) was marked `CURRENT 2026-08-22` and contains the **Insert** panel —
"Search elements ⌘F ▾ ELEMENTS 53 Text Link List Button". It is now renamed
`CAPTURE INCOMPLETE`. `figma-verify` did not catch this earlier only because no
expectation was registered for that id; it has one now, along with the other
three publish ids.

**Three rows were attributed to the wrong flow.** `BL-0222`, `BL-0223` and
`BL-0224` carried `flow: "editor"` and `route: "/edit/[siteId]"` while their
frames sit on the Dashboard page and their own names give the real routes —
`dashboard/agency/reviews`, `review/:token`. Anyone filtering `flow=editor` to
walk the editor got three surfaces that are not in it, and every editor-state
count was three too high. Corrected from the frame names: the editor now has
**67** rows, not 70.

`inventory-sync.mjs` now also reports rows pointing at a frame the file has
disowned — SUPERSEDED, CAPTURE INCOMPLETE, or absent from the editor page. It
cannot fix those (a state whose only recent frame is incomplete has no CURRENT
to point at), so it names them rather than leaving them silent. Two stand today:
`BL-0122` and `BL-0219`, both for that reason.

---

## The states the first refresh left behind

All of them are now captured, and two are worth their own note.

**`BL-0172 brand-ai-assist` had never had a frame, and the reason it "could
not" was wrong.** The surface looked gated behind `NEXT_PUBLIC_FEATURE_DS_AI`,
which is unset. The flag gates one thing — `useComposerInit.ts:126` builds a
`ComponentSchemaAIClient` or `null` — and does **not** gate the entry point.
The "✨ Generate with AI" CTA in Brand → Components renders and is *enabled*
with the flag off (`disabled: false`, measured), and clicking it opens
"Generate component with AI" with a prompt box, Cancel and Generate. Pressing
Generate is handled: `AIPromptModal.tsx:74` answers *"AI service not
configured"* rather than failing into the client. Captured; nothing submitted a
prompt.

**`BL-0169 brand-pro-mode` — a board this session broke and then fixed.** The
recipe clicked `button:has-text("Full power")`, from an earlier reading of the
panel that reported a "Friendly / Full power" pair. There is no such control:
the mode is a single **`Pro`** toggle carrying `aria-checked`, with no
aria-label, so the click matched nothing, the capture came out in **Basic**, and
it superseded `423:2` — the correct 2026-08-23 board — with a wrong one.

Caught by comparing the old and new frames for a marker Basic has and Pro does
not (`"Basic mode hides what you cannot edit yet"`): the 08-23 frame lacked it,
mine carried it. Re-captured against the real toggle — verified live that it
flips `aria-checked` to `true` and drops the notice — and `figma-verify` gained
a `notText` check so this specific board can never pass while it is still in
Basic. It reports `still shows "Basic mode hides"` when it is.

The other four were straightforward: `BL-0165 pages-listings-view` (a
PAGE / TITLE / DESC / SCORE table — all four pages score **45** with a missing
description), `BL-0173 brand-presets`, `BL-0170 brand-colour-mode`, and
`BL-0235 view-mode` via `?view=readonly`.

---

## What this walk did NOT cover

Saying so plainly, because the count of what was walked is not the count of
what exists:

- **Publish end to end.** Out of scope by founder decision. The confirm modal
  and the publish panel were opened and cancelled; nothing was ever confirmed,
  and all three job tables were checked and stayed at zero rows.
- **The site menu's own board.** `BL-0122` cannot be captured while the menu is
  built inside the topbar's 56px header — its text nodes land in the frame and
  are clipped. That is the product finding above, not a harness limit to work
  around; the frame says `CAPTURE INCOMPLETE` and the census row for it points
  at a superseded frame because there is no CURRENT one to point at. `BL-0219`
  is in the same position for the opposite reason: its only frame shows the
  wrong surface.
- **Applying anything in Brand.** Every drill-in was opened; `Apply Changes`,
  `Discard`, a starter theme and an import were never pressed — each writes.
- **Submitting an AI prompt.** The Generate-component modal was opened and its
  unconfigured path read from source; no generation was ever requested.
- **The dark half of the theme.** All 17 colour tokens are unset on this site,
  so `brand-colour-mode` is walked in its empty state. That is the honest state
  of a site nobody has themed, not a gap — the exporter omits the dark block
  entirely when there is nothing in it.

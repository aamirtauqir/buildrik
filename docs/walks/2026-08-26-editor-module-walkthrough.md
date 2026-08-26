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

### Content (`D`) — 3 controls
Empty state only: the Collections explainer and "Create a collection". Correct
for a site with no collections, but it means the module's whole populated state
is unwalked here.

### Brand (`design`, `B`) — 16 controls, 2 disabled
Friendly / Full-power mode switch, then drill-in rows: Tokens 4, Presets 18,
Starters 6, Classes, Components, Typography, Colour mode, Lint 2, Import/export.
`Discard` and `Apply Changes` are disabled with no pending edit — correct.

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
sections (TYPOGRAPHY, SPACING, SIZE, BACKGROUND, …).

**Gap — coverage, not code.** The fixture carries only 7 of the element types
the Insert panel can create (53 are offered). `image`, `video`, `link`, `list`,
`section`, `table`, `form` and the rest have no inspector profile walked here,
and the board recipes record the same hole from the other side: *"Inspector ·
profile · MEDIA — the fixture page carries no image or video element, so the
media profile cannot be reached on it."* Until the fixture grows those
elements, nobody — walk or board — is looking at those inspectors.

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

Right-click on an element gives 8 rows, none disabled: Edit ▸, Insert ▸,
Layout ▸, Quick Style ▸, Save as component, Reveal in Layers, Select Parent ←,
Lock.

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
open contains no menu, even though the capture script's own `PRE-CAPTURE` line
reports it open at the moment of capture. Frame `473:2` is named
`BL-0109 … site-menu-open … — CURRENT 2026-08-23` and holds no menu; `481:2` is
named `cmdk-open … CURRENT 2026-08-23 (first capture with the palette actually
open)` and holds no palette. The assertion lives in the frame NAME, which is
worse than an empty frame — it tells the next reader the surface was checked.
`scripts/baseline/figma-verify.mjs` now checks frame CONTENT and renames these
to `CAPTURE INCOMPLETE` with the reason.

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

## What this walk did NOT cover

Saying so plainly, because the count of what was walked is not the count of
what exists:

- **Populated Content.** The fixture has no collections, so only the empty
  state was seen.
- **46 of 53 insertable element types** have no inspector profile here — see the
  Inspector gap above.
- **Publish end to end.** Out of scope by founder decision; the confirm modal
  was opened and cancelled, never confirmed.
- **The drill-in depths of Brand.** Tokens / Presets / Starters / Classes /
  Components / Typography / Colour mode / Lint / Import-export are nine
  sub-surfaces behind one panel; the walk recorded the rows, not what is behind
  them.
- **The drill-in depths of Brand** (above) and the populated Content state.

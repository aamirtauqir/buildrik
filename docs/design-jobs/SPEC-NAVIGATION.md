# Navigation — redesign spec

The rail, the top bar, and how a user reaches twelve panels.

The audit's shell lane ends on one sentence: *"the shell's biggest problem is
not any single control — it is that the spine is only half-built"*
(`UX-F-37`). This spec takes that literally. Nothing below is about how the
rail looks. It is about which destinations exist, which have doors, and why
the doors behave differently from each other.

Everything asserted here was re-read at source. Where the audit was wrong, or
where the code's own comments are wrong, it is marked.

---

## 1. What is actually wrong

Measured, not impression. Every claim carries its finding id and was verified
at `file:line`.

| | |
|---|---|
| **The rail shows six of thirteen destinations.** `GROUPED_TABS_CONFIG` declares **13** tabs (`tabsConfig.ts:75-263`, ids counted). `TabRouter` renders **12** of them in the drawer (`TabRouter.tsx:125-244`, twelve `case` arms; `settings` is full-page). The rail renders **6** (`RAIL_FIGMA`, `tabsConfig.ts:349-351`). Templates, Components, AI, Publish, History, Review and Settings have no rail seat. | `UX-F-01` |
| **The rail is an allow-list, not a rule.** `RAIL_FIGMA = ["add","layers","pages","assets","content","design"]` — six ids, hand-written. | verified |
| **A user who has opened Templates once has no persistent handle to get back.** The doors are a bare letter, ⌘K, or a row in the ⋯ menu. | `UX-F-01` |
| **The three off-rail doors do not behave the same.** ⌘K and the ⋯ menu both route through `openLeftPanelToTab`, which calls `setIsLeftPanelOpen(true)` (`useStudioState.ts:317-319`) — they open the drawer. The **bare letter key does not**: `useSidebarKeyboard` calls `safeTabChange` (`LeftSidebar.tsx:407-416`), which calls `onTabChange` only, and `onTabChange` is `handleRailTabChange`, explicitly documented as a "Tab-only switcher" (`StudioPanels.tsx:354-362`). With the drawer shut, pressing `T` re-targets the rail and shows nothing. | `UX-F-02`, `UX-F-31` |
| **The rail arrow keys do the same silent thing.** `handleKeyDown` calls `safeTabChange` and never `onDrawerToggle` (`LeftSidebar.tsx:451-483`). A keyboard user reassigns what the next rail click will open, with zero visible change. | `UX-F-02` |
| **With the drawer shut, no rail button is marked selected.** `aria-selected={isVisibleActive}` where `isVisibleActive = isSelectedTab && drawerOpen` (`LeftSidebar.tsx:137-153`), and the 3px accent bar renders under the same condition (`:160`). A `role="tablist"` reports nothing chosen. | `UX-F-02` |
| **The bare-letter handler does not stand down for modals.** Its guard is tagName / contentEditable / modifier only (`useSidebarKeyboard.ts:19-29`) — no `isModalOpen()`, unlike `useEditorShortcuts.ts:85`. A keypress inside a dialog re-routes the panel behind it. | `UX-F-31` |
| **Two command palettes, two chords, two command sets.** ⌘K is the shell palette (`shell/modals/CommandPalette.tsx`); ⌘⇧P is a second, canvas-owned palette binding its own `window` listener (`useCanvasCommandPalette.ts:35-62`). `useEditorShortcuts.ts:28-31` states the split as intentional. | `UX-F-04` |
| **Two help surfaces, neither complete.** `?` opens the canvas cheat sheet, ⌘/ opens the app shortcuts panel. The split is narrated in three files as deliberate (`useEditorShortcuts.ts:33-41`, `SiteMenu.tsx:136-141`, `KeyboardShortcutsPanel.tsx:56-57`). | `UX-F-05` |
| **The ⌘K palette prints chords that do not exist.** `"Fit to view — Ctrl+0"` (`CommandPalette.tsx:132-136`) — but ⌘0 sets 100% and ⌘1 is fit (`CanvasFooterToolbar.tsx:241-262`). `"Redo — Ctrl+Y"` (`:83`). And Undo appears twice: `"Undo"` under Edit and `"Undo last action"` under History (`:68-88` vs `:139-148`), both calling `composer.history.undo()`. | `UX-F-06` |
| **Two Settings surfaces.** The ⋯ row "Site settings" and `Ctrl+,` open a 3-tab modal — General / Canvas / SEO (`ProjectSettingsModal.tsx:37-45`). A separate full-page Settings holds **13** screens including its own Site settings and SEO (`sidebar/tabs/settings/screens/`, 13 `.tsx` files), reachable only by bare `S`, ⌘K, or the menu's "Plugins" row deep-linking into a sub-screen (`AquibraStudio.tsx:511`). Domains, Redirects, Forms, Headers and Localization live only in the surface nobody can find. | `UX-F-12` |
| **Two AI homes with independent threads.** `ui:switch-tab {tab:'ai'}` is intercepted and renders AI **over the right inspector** (`StudioPanels.tsx:291-300`). Bare `I` and the ⌘K row "Open AI panel" set the **left** drawer tab to `ai` (`TabRouter.tsx:141`). Same feature, two columns, two ways back, in one session. | `UX-F-10`, `UX-G-02` |
| **The config claims a top-bar AI door that does not exist.** `RAIL_TOOL_META.assistant` declares `placement: "topbar"`, label `"Ask AI"` (`tabsConfig.ts:314`). `Topbar.tsx:12-13` enumerates its ten children — exit, name, save, review, spacer, tools, presence, notifications, publish, menu — and a case-insensitive grep for `ai` / `sparkle` / `assistant` in that file returns **nothing**. The ⋯ menu's "Ask AI" row is gated on `viewMode.fourToolRail` (`StudioHeader.tsx:832`), which is off by default. There is no persistent visible AI entry point. | `UX-F-11` |
| **The issues chip leads to a dead row.** The chip's own copy is *"…— review before publish"* (`IssueChip.tsx:57`). Every issue row's only handler is `onSelectElement`, bound to `() => setIssuesOpen(false)` with the comment *"v1 just closes"* (`AquibraStudio.tsx:625`). | `UX-F-07` |
| — **but the panel is not inert.** `IssuesPanel.tsx:252-261` renders a working `Fix ›` beside every fixable row, and `:200-202` an Open Brand in the fix-failed band. The defect is narrower than the audit filed it: **the issue text is not a navigation target.** | QA correction to `UX-F-07` |
| **"Quick preview" previews one page with everything off.** The overlay renders `composer.exportHTML().combined` — the **active page only** (`Composer.ts:707`) — first through `sanitizeHTMLForPreview`, which strips `script, iframe, object, embed, link, meta[http-equiv], base, form` (`ExportUtils.ts:35-43`), then into `<iframe sandbox="">` (`PreviewOverlay.tsx:106`) — the fully-restricted value. Links do nothing, interactions do nothing, and the engine's own interaction runtime (`Composer.ts:700`) is injected into a document forbidden from running it. The only control is a Done pill. | `UX-F-09`, `UX-E-17` |
| **"Unpublish site…" fires its request before the listener mounts.** `onUnpublish` calls `onOpenPublish?.()` then `composer?.emit(EVENTS.UI_UNPUBLISH_REQUEST)` in one synchronous arrow body (`StudioHeader.tsx:809-812`). `onOpenPublish` is a React state setter, applied after the handler returns; the sole listener is `PublishTab.tsx:190`, and `PublishTab` is `React.lazy` (`TabRouter.tsx:42`). `EventEmitter` has no replay. The user is moved to a panel they did not ask for and the confirm never appears. | `UX-F-30` |
| **Full-page mode swaps the whole work surface with nothing lit.** Entered from tabs with no rail seat; on close it hard-codes a jump to Insert (`StudioPanels.tsx:370`), not to where the user came from. | `UX-F-13` |
| **Below 1024px the shell silently degrades.** `LayoutShell.css:353-358` is an empty `@media (max-width: 1024px)` whose only content is `/* Show warning overlay - handled by component */`. No such component exists. | `UX-F-14` |

**A correction, because it will otherwise be repeated.** `tabsConfig.ts:233`
says *"No `zone` → the zone-driven rail render leaves it out."* **The shipping
rail is not zone-driven.** `zone` is read only by `getTabsByZone`
(`tabsConfig.ts:279-281`), which only the `legacy` rail uses; `editorViewMode`
returns `"figma"` for every non-dev build. The disproof is one line away in the
same file: `content` carries **no `zone`** (`tabsConfig.ts:250-263`) and **is
on the rail** (`RAIL_FIGMA` includes `"content"`). An audit lane reasoned from
that comment and filed four false clauses (`UX-I-17`, refuted). Do not design
against it, and do not restate it.

**The thesis:** this is not a rail that needs a seventh icon. It is a shell
with thirteen destinations, six seats, five kinds of door, and three different
behaviours behind doors that look identical. Every symptom above — the
unmarked selected state, the silent letter keys, the two palettes, the two
Settings, the two AI homes — is the same missing decision: *nobody named the
destination list, so every surface invented its own subset.*

---

## 2. The structural fix, before any pixels

**One destination list. Every destination has exactly one persistent door.
Every door behaves the same.**

### 2.1 Name the list

Thirteen registered tabs, sorted by what the user is doing — not by which
render source happened to include them:

| Group | Destinations | Today |
|---|---|---|
| **Build** | Insert, Layers, Pages, Templates, Components | 3 on rail, 2 off |
| **Content** | Media, Content (CMS) | both on rail |
| **Style** | Brand | on rail |
| **Ship** | Publish, Review, History | all off rail |
| **Configure** | Settings | off rail, full-page |
| **Assist** | AI | off rail, two homes |

That is 13. The rail seats 6. The gap is 7 — and six of the seven are the
destinations a user needs *late* in the job, which is exactly when they have
stopped exploring and started needing a handle.

### 2.2 The rail gets a second group, not a longer list

The Figma contract's six stay first and stay in their board order. A divider,
then a **`More` seat** that opens a list of every remaining destination with
its shortcut printed. That is one new rail item, not seven — the six-item
group the board draws is preserved, and the seventh seat is honest about
being an index rather than a destination.

This is the audit's own second option (`UX-F-01` fix), and it is the one that
survives the board: promoting seven icons breaks the 48px pitch and the
one-group reading the board commits to.

### 2.3 Selected is not the same signal as open

`isVisibleActive = isSelectedTab && drawerOpen` collapses two facts into one.
Split them:

- **selected** — this rail item is the current destination. Marked whether the
  drawer is open or shut. `aria-selected` binds to this.
- **open** — the drawer is showing it. Drawn as the accent bar.

A rail that reports nothing selected is a `tablist` lying about its own state,
and it is why the bare-letter keys read as broken rather than as half-wired.

### 2.4 One door, one behaviour

Every route to a destination must open it. Today ⌘K opens, the ⋯ menu opens,
and the printed keystroke does not. The keystroke is the *fastest* door and
the only one that fails — so the product teaches its own shortcut and then
punishes it.

Fix is one line of intent, not one line of code: **a door opens the drawer.**
`safeTabChange` needs the drawer toggle the rail click already has.

### 2.5 Collapse the duplicate surfaces before drawing any of them

Four pairs, four decisions. None of them is a visual problem.

| Pair | Decision |
|---|---|
| ⌘K palette · ⌘⇧P canvas palette | **One palette.** The canvas commands are already registry-backed; merge them into ⌘K and retire ⌘⇧P. Two palettes means a user who learns one never sees the other's rows. |
| `?` cheat sheet · ⌘/ shortcuts panel | **One shortcuts screen**, grouped by surface, opened by both chords. Print the bare-letter panel keys with an explicit *no modifier* note — they appear today only in a rail hover tooltip. |
| Site-settings modal · full-page Settings | **One Settings.** Point "Site settings" and `Ctrl+,` at the full-page surface and fold the modal's three tabs into it. A user hunting for Domains will look in the row named "Site settings". |
| AI over the inspector · AI in the left drawer | **One home.** The boards put AI in the inspector column with a "‹ Inspector" way back (`StudioPanels.tsx:291-300` cites 170:2 and 66:225). Route bare `I` and the ⌘K row there and delete the `ai` case from the left `TabRouter`. |

### 2.6 The shell must say where it is

There is no place in the product that states *site → page → panel* together
(`UX-F-36`). The site name is in the top bar, the page is a tab at the foot of
the canvas, the panel is implied by a highlight that disappears when the
drawer closes, and in full-page mode all three are absent or wrong at once.
One location line, in the top bar, surviving every mode including full-page
and preview. The canvas breadcrumb is a different question — it describes the
selected *element's* ancestry — and keeps its own place.

---

## 3. The rail

```
┌──── 60 ────┐
│    ▣       │  logo · 44
├────────────┤  divider
│  ▎ ⊕       │  Insert   A      ▎ = 3px accent bar, drawer OPEN
│    ▤       │  Layers   L
│    ▤       │  Pages    P        44px item, 48px pitch — board 52:6
│    ▦       │  Media    M
│    ▥       │  Content  D
│    ◈       │  Brand    B
├────────────┤  divider  ← NEW: the six above are the board's one group
│    ⋯       │  More            opens the index, does not open a panel
└────────────┘
```

Selected but closed is drawn as the tinted pill **without** the bar — the
`ls-btn--last` class already exists for exactly this (`LeftSidebar.css:189`)
and carries no accessible state today. `aria-selected` follows the pill.

**The More index** — a popover, not a panel, 240 wide (see §5):

```
┌─ More ─────────────────── 240 ─┐
│  BUILD                          │
│  ▤ Templates              T     │
│  ▤ Components            ⇧A     │
│  SHIP                           │
│  ▲ Publish                U     │
│  ◷ History                H     │
│  ✓ Review                 R     │
│  CONFIGURE                      │
│  ⚙ Settings               S     │
└─────────────────────────────────┘
```

Seven rows, three headings, every shortcut printed where the user is rather
than in a hover tooltip. AI is **not** in this list — it lives in the
inspector column (§2.5) and gets its own door there.

---

## 4. The top bar

The bar is 56 (`--bk-size-topbar`, and `Topbar.tsx:196` independently declares
`tw:h-14`; those must become one source). Three changes, all of them
correctness rather than layout:

**Exit names its destination.** Today the loudest control on the left is a
chevron and the word "Exit" (`Topbar.tsx:177`), and it navigates to
`${DASHBOARD_URL}/dashboard/projects` (`StudioHeader.tsx:490`). In a
standalone build `DASHBOARD_URL` falls back to `window.location.origin`
(`runtimeEnv.ts:68-77`), so on `localhost:5050` the button walks the user to a
route that does not exist on that origin. The control says where it goes, and
the confirm dialog repeats it. (`UX-F-03`)

**Publish keeps its slot.** The single filled button reads Publish / Publish
changes / Publish anyway / Send for review / Open feedback, and when the site
is live with nothing waiting the derivation returns `null` and it is **not
rendered at all** (`lifecycle.ts:246`, `StudioHeader.tsx:801`). A CTA that
leaves the bar teaches the user the bar moved. It says "Up to date" in the
settled state and stays put. And when publishing is refused it must look
refused: today the disabled branch keeps the full accent-blue treatment with
the reason in a tooltip (`Topbar.tsx:295-321`; `PUBLISH_BTN_CLASS` at `:38`
carries no colour or opacity change). (`UX-F-20`, `UX-F-21`)

**The ⋯ menu stops being three menus.** It carries ~18 rows across six groups
and does three unrelated jobs: it is the only persistent door to six in-editor
panels, it is the settings/export surface, and it launches six dashboard pages
in a new tab (`SiteMenu.tsx:189-308`). Nothing distinguishes a row that stays
from a row that leaves — Site health, Activity log, Share preview link, Invite
teammates, Account settings and View live site all `window.open` with no
external marker, and the Site health / Activity log group has no heading at
all. After §2.2 the in-editor destinations move to the More index; what is
left is *leave the editor* and *act on this site*, and the leaving rows get an
external marker and their own heading. (`UX-F-29`)

**Preview previews the site.** Every page, the page switcher kept in the
overlay, and scripts and same-frame navigation allowed so links and
interactions behave. This is blocked on two code facts, not on a drawing:
`combined` is one page (`Composer.ts:707`) and the frame is `sandbox=""`
(`PreviewOverlay.tsx:106`) behind a sanitizer that has already removed every
`<script>` and `<form>` (`ExportUtils.ts:39`). If a locked-down preview is the
decision, the overlay must say so on screen — *"links and scripts are disabled
in preview"* — rather than silently showing a page where nothing works.

---

## 5. The sizing rule

The audit's width table (`UX-F-25`, `UX-F-26`) is the justification. Restated
with the arithmetic shown, because the numbers are the argument.

### 5.1 What is there now

**15 distinct panel and overlay widths.** Counted:

| Value | Source | Token? |
|---|---|---|
| 140 | Settings sub-nav (`tabsConfig.ts:195-198`) | no |
| 160 | Page-tab context menu (`chrome.css:51`) | no |
| 196 | Zoom flyout `min-w` (`StudioFooter.tsx:243`) | no |
| 236 | Comment popover (`CommentLayer.tsx:470`) | no |
| 240 | `--bk-size-nav` | **token — zero consumers** |
| 280 | `--bk-size-drawer` | token |
| 300 | `--bk-size-inspector` | token (1 consumer) |
| 360 | `--bk-size-panel-right` | token (1 consumer: `header.css:39`) |
| 360 | Issues panel (`AquibraStudio.tsx:611`) | **literal, same number, no token** |
| 380 | Block picker (`BlockPickerModal.tsx:199`) | no |
| 400 | Structure popover (`StructurePopover.tsx:63`) | no |
| 440 | Conflict modal `max-width` (`ConflictModal.tsx:50`) | no |
| 520 | Canvas command palette (`controls/CommandPalette.tsx:276`) | no |
| 560 | Media detail drawer (`LeftSidebar.tsx:580-588`) | no — TS literal |
| 700 | Templates gallery + generic expand (same) | no — TS literal |
| 1100 | Preview page frame `max-w` (`PreviewOverlay.tsx:56`) | no |

Four of the fifteen read a token. **Ten are hard-coded at the ten sites above,
referencing no token**, and the remaining two (560, 700) are TypeScript
literals in `LeftSidebar.tsx`.

Two facts fall straight out of the table:

- **`--bk-size-nav` (240px) has zero consumers.** Grepped per-token across
  `.ts` / `.tsx` / `.css` in the package: no hits outside its own definition.
- **Three right-hand surfaces sit at 300, 360 and 400** — inspector,
  issues/notifications, structure — and only one of them reads a token. Three
  answers to one question.

And the drawer has exactly **two** widths, 280 or 700, a 2.5× jump with
nothing between and no drag handle anywhere in the sidebar (grepped
`resize` / `onMouseDown` / `drag` in `LeftSidebar.tsx` and `.css`: no
affordance). At 1440, expanded: rail 60 + drawer 700 + inspector 300 = 1060,
leaving ~380px of canvas lane — against a desktop frame floored at
`BREAKPOINTS.desktop.minWidth` = 1024 (`canvasStyles.ts:57`) with
`flexShrink: 0`. Expanding a panel to read it pushes the page under edit into
heavy horizontal scroll, and the only way back is the same toggle.
(`UX-F-15`)

### 5.2 The rule

> **A width is a property of a surface CLASS, not of a component.**
> Six classes. Every surface reads its class token. A new number is a new
> class, argued in the spec — never a literal at a call site.

| Class | Token | Value | Who |
|---|---|---|---|
| Rail | `--bk-size-rail` | 60 | the rail |
| Drawer | `--bk-size-drawer` | 280 | every left panel at rest |
| Drawer · wide | `--bk-size-drawer-wide` | 560 | media detail, templates gallery, panel expand |
| Right column | `--bk-size-inspector` | 300 | inspector and anything that replaces it |
| Overlay panel | `--bk-size-panel-right` | 360 | notifications, **issues**, **structure** |
| Popover | `--bk-size-popover` | 240 | the More index, zoom flyout, comment popover |
| Menu | `--bk-size-menu` | 160 | context menus |
| Modal | `--bk-size-modal-{sm,md,lg}` | 440 / 520 / 700 | conflict, palette, settings |

Consequences, stated so they can be checked:

1. **`--bk-size-nav` is renamed to `--bk-size-popover`, not deleted.** Its
   value (240) is the right popover width and it already exists; a dead token
   with a correct value is cheaper to adopt than a new one. If the rename is
   refused, delete it — what it must not stay is defined-and-unconsumed.
2. **700 leaves the drawer.** The wide drawer caps at 560, which at 1440
   leaves 60 + 560 + 300 = 920, and a canvas lane of ~520 — still under the
   1024 floor, so the drawer additionally **collapses the inspector** while
   wide rather than squeezing the canvas twice. Templates' 700 gallery becomes
   a modal (`--bk-size-modal-lg`), which is what a full-bleed gallery is.
3. **Issues joins the grid.** It is a 360 slab at `position: absolute; top: 56;
   z-index: 45` today (`AquibraStudio.tsx:604-616`) — the only right-hand
   surface outside the layout grid, so nothing pushes over for it and the
   hand-computed `top: 56` is wrong whenever the recovery banner, load-error
   banner or the 48px review bar (`ReviewBar.tsx:36`) is above it. It shares
   the inspector slot with a back affordance, so the element an issue is
   about stays visible. (`UX-F-08`)
4. **Below 1024, say so.** Build the state `LayoutShell.css:353-358` promises
   or delete the promise. Rail 60 + drawer 280 + inspector 300 = 640 leaves
   under 400px of canvas against a 1024 floor — the product is desktop-only
   and currently never says it.

---

## 6. Interaction detail

**Keyboard.** The bare letters stay — they are fast and the product already
teaches them — but three things change. They open the drawer (§2.4). The
handler stands down while a modal is open, the guard `useEditorShortcuts.ts:85`
already has and `useSidebarKeyboard.ts:19-29` does not. And they are printed
where the user is: in the More index, and in the one shortcuts screen, with an
explicit *no modifier* note. A chord that appears only in a hover tooltip is
not documented.

**⌘R is not ours.** Six canvas overlay chords bind globally and one of them
takes the browser's reload — plain ⌘R toggles Rulers
(`CanvasFooterToolbar.tsx:271`, with the reasoning at `:219-223`). The chords
are printed only inside hover tooltips on a floating bar, so everyone pays the
cost and only hoverers get the benefit. Move the overlay chords off keys the
browser owns and print them in the shortcuts screen. (`UX-F-32`)

**Two tab strips, two names.** The rail is `role="tablist"
aria-label="Editor navigation"` (`LeftSidebar.tsx:606-610`) and the page bar at
the canvas foot is `role="tablist" aria-label="Site pages"`
(`PageTabBar.tsx:220-223`) — identical markup for completely different things.
A live accessibility snapshot read them as one list: *Insert, Layers, Pages,
Media, Content, Brand, Home* — so the homepage appears to be a seventh rail
destination. There is no rail item named Home. Distinct roles and names:
**Editor sections** vs **Site pages**. (`UX-F-16`)

**One zoom owner.** Zoom has three implementations that step differently. The
footer flyout emits `ZOOM_IN`/`ZOOM_OUT`, handled by adding
`THRESHOLDS.ZOOM_STEP` = 10 (`Canvas.tsx:408-414`, `config.ts:90`); the
floating canvas bar walks `ZOOM_PRESETS` `[10,25,50,75,100,150,200,400]`
(`CanvasFooterToolbar.tsx:258-264`); the command registry has its own again.
From 100%, one control labelled "Zoom in" gives 110% and the other gives 150%.
The clamp disagrees too — presets and `ZOOM_LIMITS` stop at 400
(`canvas.ts:360-362`), `THRESHOLDS.ZOOM_MAX` is 500 (`config.ts:88`). One
owner, one stepping rule, one clamp. (`UX-F-22`)

**Device change fits.** Choosing Wide (1920) or Tablet (768) in a ~750px lane
leaves the frame overflowing and horizontally scrolled, because
`onDeviceChange` sets the device and never touches zoom
(`AquibraStudio.tsx:545-548`) and the frame is `flexShrink: 0`. Fit on device
change, so choosing a breakpoint shows that breakpoint. (`UX-F-24`)

**Destructive actions own their confirmation.** "Unpublish site…" must confirm
in the menu's own flow. It cannot ship the user to another panel and hope that
panel is listening — the panel is `React.lazy` and the emitter has no replay,
so it never is. This is the same race the codebase already diagnosed and fixed
for the Pages "From template" flow (`LeftSidebar.tsx:393-401`). (`UX-F-30`)

**The status footer becomes a door.** It is the shell's only always-on
statement of what is selected and none of it is a control (`StudioFooter.tsx:210-224`).
Clicking the selection readout reveals the element and opens Layers. And when
the node is not rendered, `elementDims` returns `null` (`:79-87`) and the size
silently vanishes — it says **"not visible"** instead. (`UX-F-34`)

---

## 7. What this does NOT do

- **No new rail icons beyond one.** The board's six-item group is preserved in
  its board order at its 48px pitch. `More` is the seventh seat and it is an
  index, not a destination.
- **No new panels.** All thirteen destinations exist and render today. This
  spec moves doors; it builds no surface. The one exception is the
  small-viewport state, which `LayoutShell.css` already promises.
- **No new tokens invented from nothing.** Of the eight class tokens in §5.2,
  five exist (`rail`, `drawer`, `inspector`, `panel-right`, and `nav` renamed
  to `popover`). Three are new (`drawer-wide`, `menu`, `modal-*`) and each one
  replaces at least two literals already in the tree.
- **No new command surface.** Merging ⌘⇧P into ⌘K removes a palette; it does
  not add one. The canvas commands are already registry-backed.
- **No new help content.** Both help screens' groups exist. Merging them is
  layout, not writing.
- **No AI affordance in the rail.** AI lives in the inspector column per the
  boards `StudioPanels.tsx` already cites. The top bar gets the persistent
  door the config has claimed since `tabsConfig.ts:314` and never had.
- **No redesign of the page tab bar or the Pages panel.** The duplicate is
  real (`UX-F-17`, `UX-B-15`) and it is the Pages spec's decision, not this
  one. This spec only asks that the two strips stop reading as one list.

---

## 8. Acceptance

Not "the rail looks better". Each is observable at 1440×900 in the running
app — a code reading is not acceptance, per the repo's own rule.

1. **Every one of the thirteen destinations is reachable from a control that
   is visible on screen**, without a memorised key and without opening a menu
   that also contains dashboard links. Verified by counting doors, destination
   by destination.
2. **The rail reports its selected item with the drawer shut.** Read
   `aria-selected` in the accessibility tree with the drawer closed; exactly
   one rail tab is selected.
3. **Every door opens the panel.** Press each of the twelve bare letters (Components is ⇧A — the thirteenth shortcut is not a bare letter)
   with the drawer shut, then arrow through the rail with the drawer shut. In
   every case a panel is on screen afterwards. (Today the ⌘K and ⋯ routes pass
   this and the keystrokes do not.)
4. **A keypress inside an open modal does not change the panel behind it.**
5. **One palette answers ⌘K and ⌘⇧P; one shortcuts screen answers `?` and
   ⌘/.** Every chord printed in either is pressed and does what the row says —
   including "Fit to view", which today prints `Ctrl+0` and is bound to ⌘1.
6. **"Site settings" reaches Domains.** From the ⋯ menu, in one click, without
   knowing that a full-page Settings exists.
7. **AI opens in one column.** Reach it from the inspector chip, from bare `I`,
   and from ⌘K; all three land in the same place with the same thread.
8. **Clicking an issue reveals its element.** Selection changes and the canvas
   scrolls to it. If an issue genuinely has no location, its row does not
   look clickable.
9. **Preview shows page two.** Open Quick preview on a five-page site and
   reach the second page without closing the overlay — or the overlay states
   on screen what it does not do.
10. **"Unpublish site…" shows a confirmation**, verified by clicking it, not
    by reading the handler.
11. **Every width in the shell resolves to a class token.** Grep for numeric
    `width:` / `w-[` literals across `editor/`; the ten sites in §5.1 return
    zero.
12. **At 1439px the editor says it is desktop-only** instead of squeezing.

### The code fixes this design cannot paper over

Four of the twelve depend on changes no drawing can make. Naming them here so
the spec is not drawn as though they have landed:

| # | Fix | Where |
|---|---|---|
| 3 | `safeTabChange` must open the drawer, as `handleBtnClick` does | `LeftSidebar.tsx:407-416` + `StudioPanels.tsx:354-362` |
| 4 | `useSidebarKeyboard` needs the `isModalOpen()` guard `useEditorShortcuts` has | `useSidebarKeyboard.ts:19-29` |
| 8 | Issues must carry a target `elementId`; the panel's own comment says this is why the row only closes | `AquibraStudio.tsx:625` |
| 9 | `exportHTML().combined` is one page, and the preview frame is `sandbox=""` behind a sanitizer that strips every script | `Composer.ts:707`, `PreviewOverlay.tsx:106`, `ExportUtils.ts:39` |
| 10 | The unpublish confirm must not depend on a `React.lazy` panel mounting before a synchronous `emit` | `StudioHeader.tsx:809-812`, `TabRouter.tsx:42` |

Until those land the shell cannot honour its own affordances, and drawing a
rail that implies it can is how the last three of these got filed as design
findings in the first place.

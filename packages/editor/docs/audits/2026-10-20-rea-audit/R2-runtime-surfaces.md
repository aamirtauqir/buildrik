# R2 — Runtime walk of the editor surfaces (REA)

Date: 2026-10-20 · App: `http://localhost:3330` (worktree `phase1-integration`, branch `feat/phase1-integration`, AI removed) · Site: `audit1020-webflow` (`cmvfrjygj000e135czkn8rzm8`) · User `qa@buildrik.local` · Viewport 1440×900, Chromium 149 headless, UTC, reduced motion.

## Code revision

- **PRE** = runs that finished before merge `dc72314c2` (17:46:46 local) landed and hot-reloaded: scenarios s00–s11 (17:00–17:44).
- **POST** = runs on `dc72314c2` (BD-32..BD-37): scenarios s12–s29 (17:47–18:08). s12 started 49 s after the merge commit. Treat it as POST, but HMR timing is not proven.
- Each finding below carries its tag. The BD-32..37 areas were re-checked POST where reachable. That covers Preview (BD-34) and New page defaults (BD-32). The other four are listed under NOT TESTED.

## Method

- **Tool.** Every observation was made with REA `capture_browser_scenario` in launch mode. REA performed the declared actions: goto, click (left/right/double), fill and press.
- **Login.** One magic-link login (`/auth/callback?token=…`). The resulting `next-auth.session-token` was then injected as a cookie into each launch. The magic-link endpoint is rate-limited to 5 per 15 min per IP, and that limit is shared with the sibling agents. One run hit HTTP 429 (s02).
- **Captures.** Accessibility snapshots were taken after each step, with a screenshot at the end, plus console and page-error events. Some runs took screenshots after every step.
  - Results were extracted with `scratchpad/ex.py` and the a11y trees were diffed with `scratchpad/axdiff.py`.
  - Screenshots are in `/private/tmp/claude-501/-Users-shahg-Desktop-pencil-buildrik-packages-editor/56bb4919-4be8-4b4f-9e42-32587e7a3d44/scratchpad/rea/` as `sNN-<step>-<id>.png`, 83 files in total. The a11y text files sit next to them.
- **Harness conditions. Read these before trusting any null result:**
  1. **Host load.** Load average was 586–675, because sibling agents and several dev servers were running. About 40% of REA runs failed with `cleanup_incomplete` (browser close took more than 30 s). Their partial data came back inline but truncated, so those runs are **not** retained as Evidence. One fact was used from a non-retained partial (the Publish dialog text) and is marked so.
  2. **REA click has no modifier keys.** ⌘-click and Shift-click multi-select could not be performed. REA also has no hover or drag action.
  3. **My own a11y diff had a bug early on.** It cut everything after the dev-only Agentation toolbar node, which hid menus that render after it. I fixed it and re-ran every diff. Two "menus not in a11y tree" and one "Brand page empty for AT" conclusions were caused by that bug, and both are **withdrawn**.
  4. **Shared site.** Sibling agents edit `audit1020-webflow` at the same time. For example, SAVED COMPONENTS went from 1 to 2 mid-walk, and that was not me.
  5. **Dev-only overlays exist on every page.** The Next.js dev indicator ("N" / "Compiling…" / "1 Issue") sits on top of the rail's **Help** button. The Agentation v3.0.2 toolbar is the black button at bottom-right.

## Evidence IDs

| Run | Evidence ID | Rev | What |
|---|---|---|---|
| s00 | ev_ab4a7e3433411c5c6e1204111c7e238729c61656b0699423b65bdd2c5d01bf08 | PRE | cold load, DOM + a11y |
| s01 | ev_319c8308c88f1b1a03d5ae6109536e4855dbc288026032decd03353e6be50ada | PRE | topbar walk (24 steps, screenshot each) |
| s05 | ev_22f2dc3f88e1c5a68cfa8cd70c6c63744d78c0f48201368655d21c6b4473409e | PRE | Add panel sections + options |
| s06 | ev_6ec007b1ee286ba95835a53a00a466e3da5038a2cc0d8388b24f89526bff4e56 | PRE | rail panels Layers/Pages/Assets/CMS/Brand |
| s07 | ev_3401e8d30f5e94c8d741a557757d61a470ae9ce6591ae72ffa42a204a48bf043 | PRE | select heading, button; inspector |
| s08 | ev_695c276beac5c5d65570a3642e1b7e6321be02486e1d228e1453339acb3b4dd5 | PRE | Style/Behaviour/Effects, State, Element actions, right-click |
| s09 | ev_2eb02ba7c5f3a05a73d64ad9ae883c9e0fabfe3e9e3faddeb5e3f4e2b9e529d9 | PRE | menus with screenshots (State, actions, context, Arrange) |
| s10 | ev_1c3b92c957652ccb2fc86b625c35a47afd54d712b3523040f0a7a39f62246ee0 | PRE | comments mode: capture layer intercepts |
| s11 | ev_7e4004955073ac37e75de027b2971aa0495062f22c3a5421687c7a5e1d31424d | PRE | comment composer, View menu |
| s12 | ev_f2f8309ed2b5f074d217f4e4bfb915cdc08e9d3ae75e6d3851dcf3c85a692d75 | POST | Rulers + X-Ray |
| s13 | ev_fb819dcf6730fb7ed0fd5a881182ff41aa5f794bdcd15da6618c8c1f89cbc69b | POST | Breakpoint and Zoom menus |
| s14 | ev_34cb593b57a0387e4b004635c2eb7673c69275406b7defeddff854f065f69a35 | POST | Tablet breakpoint |
| s15 | ev_238e57e649b6e53ad01d197bb18a6bec8596bc9d61c7b6b4f712d45485ef9800 | POST | Preview (BD-34) |
| s16 | ev_381ec1eccd1bc587a49d1f85093641462b3bf72cb67399c7bb95e2e914f93abe | POST | Publish now (simulation) |
| — | ev_c496c28065665fc12515187e38355df58f7902580fab6bf7d8f54a8e9c2d56de | POST | reload after publish: no Publish button |
| s17 | ev_58ec1112ecdb5731c4294127e1b8d7a1eae679d1591b81eb45a5fd51735846f6 | POST | History tabs, Notifications |
| s18 | ev_74b9ff58c4e9b7cfc382e46e84e5adb3b6c9889dcc2075692f0604de3fe83745 | POST | shortcuts sheet, command palette, Issues |
| s19 | ev_6b0bda53e988a8b01664899c831020258c03cc6ec2ff0dc084f00196c705c759 | POST | Activity, Export, Site settings |
| — | ev_22848e6acba8d76e61d2d827427b09ef1e306d5b7bd98a9b586638585aaf83e8 | POST | dashboard (hydration error) |
| — | ev_454d2e627ec15273db23b6fc227e685668245c1731d806319948ba534794a15f | POST | Create site → limit 3/3 |
| s20 | ev_e977a335352c871e30aed45d9a36a4c68000d48a127e5568ba31e0d446b2e126 | POST | click-add 5 elements on About |
| s21 | ev_79dadfb99cae3da4ec1caa1d5a222c92d439536370e7510a6a943815bc46e479 | POST | inline text edit toolbar |
| s22 | ev_dec71b9faa5e25503382b4c5c250039fb1de8a1a1daa9570fcde148221568756 | POST | section / instance / collection-list inspector |
| s23 | ev_9924db569eabe74d923e2019e55e4c0af8f2c7e940c18db0f46545d375e3783d | POST | canvas "+", Review → Send for review |
| s24 | ev_5e7030de41635a3e70c2bddb97490a9ec464916fc2febf425c76d990a1853498 | POST | New page dialog (BD-32) |
| s25 | ev_a2b8659b787c03756d15fe654338bd5e49a4cccdcd88048fe588e36e96b279e9 | POST | Delete key; edit lost on fast close |
| s26 | ev_9d85d032ef0235a542dd1333567d0743fc9d40c62d9a5022060a6cd00c10be3e | POST | ⌘D, Undo/Redo buttons, ⌘Z |
| s27 | ev_55b9be7b5d2ebd7422567aad4d42fca1fe116c445885a37269b085089f442098 | POST | autosave timing |
| s28 | ev_073bbfee89832de7c1eee41d2274facbbee0b5fb474d97604ade448bbaf90428 | POST | Page actions, Assets "Add from", CMS records |
| s29 | ev_e2c16e341ad490711bfb5bf97160df5d28b64cadb0cae7529e8bbc859c49638b | POST | Add search, checklist, Help |

## 1. Shell / topbar

| Control | Observed behaviour | Verdict | Evidence |
|---|---|---|---|
| ‹ Exit | Present. Not clicked: it would leave the editor and end the session's state. | NOT REACHED | s01 a11y |
| Site name `audit1020-webflow` | Opens the **Pages** panel in the left sidebar. A site-name button acting as a Pages shortcut is not obvious. | CONFUSING | s01-06 png |
| Breadcrumb `Home` | Closes the open left panel. The Pages rail icon stays visually highlighted even though no tab is selected in a11y. | CONFUSING | s01-08 png/a11y |
| Site name while loading | Reads **"Untitled Project"** until the project loads. | CONFUSING (flash) | ev_c496…, s14 partial |
| History › | Replaces the inspector with History (Session / Saves / Published). Esc closes it. | WORKS | s01-11 png, s17 |
| History · Saves | "No saved versions yet. Versions are created whenever you name one…". The footer reads "50 versions kept. Auto-saves prune oldest first", which mentions auto-saves while the list shows none. | CONFUSING | s17-03 |
| History · Published | Briefly shows "Loading versions…", then LIVE v2 (2m ago) and v1, each with an actions button. | WORKS | s17-05/06 |
| + Save a version | Present. Not clicked. | NOT TESTED | s01 |
| Review | Right panel: "No review yet… Send for review". | WORKS | s01-13, s23 |
| Review → Send for review | Dialog with Client email, What changed?, Note, Cancel and Send. Esc closes it. Not sent. | WORKS (open/close) | s23-06/08 |
| Comments | Toggles pressed state. An **invisible** `comment-capture-layer` then covers the canvas: no banner, no cursor hint, no visual change (s10-04 png). A click on it opens the "New comment" composer (textarea, Cancel, Post disabled until text). | WORKS, CONFUSING affordance | s10 (Playwright log: capture layer intercepts), s11-05 png |
| Notifications (badge) | Dialog with Mark all read, Close, items, "View all activity ›". Both items say "Site … is live at https://…dev-simulated.invalid", so a simulated publish is announced as live. | WORKS, CONFUSING copy | s01-19, s17-07 |
| Topbar status text | Reads "Published — site is live" even while the button next to it says "Unsaved changes". It switches to "Saved" ~1 s after an edit. | CONFUSING | s27-03/04/05 |
| Preview | Full-screen "Site preview" with Back to canvas, Desktop 1320 / Tablet 768 / Mobile 375, page select and Share preview. See §8. | WORKS with fidelity gaps | s15 |
| Publish changes | Opens the "Publish to production?" dialog (target, pages, approval, rollback, "⚠ 7 warnings — none block", Cancel, Publish now). The text comes from a non-retained partial run. | WORKS | partial (17:56), s16 |
| Publish changes (no pending changes) | After the simulated publish completed, a reload showed **no Publish button at all** in the topbar. | CONFUSING | ev_c496c280 |
| ⋯ Site menu | 16 items in 3 groups. "Start collaboration · Planned" is disabled. | WORKS | s01-22 |
| Site menu → Keyboard shortcuts | Dialog with search and grouped shortcut list. | WORKS | s18-03 |
| Site menu → Command palette | Dialog with scoped search and grouped commands (Pages / Navigate / Edit / View / Add / Tools). Unavailable commands are disabled with a reason. | WORKS | s18-06 |
| Site menu → Issues | Panel replaces the inspector. Scope This page / Whole site, "Open issues: 10", each with Open element / Dismiss. | WORKS | s18-09 |
| Site menu → Activity log | Activity panel with filters All / Edits / Comments / Publish. | WORKS | s19-04 |
| Site menu → Export site… | "Export site as HTML" modal: HTML / ZIP / React (Vue, Next.js "Soon"), tabs Preview / Code / Options, device widths. The preview iframe logs **2 console errors**: "Blocked script execution … sandboxed and 'allow-scripts' not set". | WORKS, P2 console errors | s19-06 |
| Site menu → Site settings | Full-page Settings: Overview, General, Languages, Brand↗, SEO, Domains, Redirects, Access (Pro), Analytics, Form submissions, Custom code (Pro), Security headers, Danger zone, workspace links, "Your role: Owner". | WORKS (only Overview opened) | s19-11 |
| Site menu → Duplicate site / Unpublish / Share preview link / Copy live URL / Getting started / Enter view mode / external ↗ items | Present. Not clicked. | NOT TESTED | s01-22 |

## 2. Left rail and panels

| Control | Observed behaviour | Verdict | Evidence |
|---|---|---|---|
| Add tab | Default open. Search, ⋯ menu, ✕, and sections ELEMENTS 53, BLOCKS 8, BUILT-IN COMPONENTS 14, SAVED COMPONENTS, Page templates ›. | WORKS | s00, s05 |
| Add ⋯ | Only one item: "Paste HTML… ⌘⇧V" (not executed). | WORKS | s05-07 |
| Add search | "form" returns 18 results labelled Element / Block / Component. It includes **Social Icons**, which is unexpected. "zzqq" shows "Nothing matches ‘zzqq’." with Clear. | WORKS (minor) | s29-03/04 |
| ELEMENTS rows (53) | All 53 rows were listed (names in s00 a11y). Only 5 were clicked: Heading, Text, Link, Button, Image. Each added an element. Click-to-add inserts **into the selected element**: Image went **inside the Button** ("Image added to About › Button" toast), giving `<button>` › `<img>` and overlapping layout. | Heading/Text/Link/Button WORKS; Image-into-Button **BROKEN**. The other 48 rows were not clicked. | s20 a11y + s20-09 png |
| Adding Image | Left sidebar **switches from Add to Assets** on its own. | CONFUSING | s20-09 png |
| ☆ favourites | Present on every row. Not toggled. | NOT TESTED | s00 |
| BLOCKS (8) | Hero, Features, Menu grid, Testimonials, CTA, Contact, Footer, Navbar, with thumbnails. Not inserted. | WORKS (list) | s05-04 |
| BUILT-IN COMPONENTS (14) | Card … Table. Every row uses the same generic dark-square icon. Several names duplicate ELEMENTS and BLOCKS (Testimonials, CTA, Footer, Navbar, Card, Tabs, Modal, Table, Carousel…), so there are **three overlapping catalogues**. | CONFUSING | s05-05, s05-08 png |
| SAVED COMPONENTS | Hero Section and "Manage components ›". | WORKS (list) | s05-06 |
| Page templates › | Full-page template browser with 10 templates (3 marked Pro), "‹ Back to canvas" and "⟳ Reload catalogue". Opening it made REA cleanup hang twice (10 sandboxed srcdoc iframes); that is attributed to the harness, not shown to be product. | WORKS (a11y, partial) | partial runs 17:17, 17:24 |
| Layers | Tree with expand/collapse, search, "20 layers", Select, "About dimmed layers". ⋯ = Expand all, Collapse all, Display settings…, Widen panel. Clicking a tree item selects the element. | WORKS | s06-04, s22 |
| Pages | Search, tree (Home ⌂, About), legend line, + Add page, From template, More add options. ⋯ = Select pages…, Listings, Show structure, Reload, Widen panel. | WORKS | s06-07 |
| Pages tree status | About still reads **"About, Live"** after About was edited and the topbar showed "Publish changes". The legend promises "● unpublished changes". | CONFUSING (a11y evidence) | s23-03, s24-03 |
| + Add page (panel) | Opens the "New page" dialog: name "Page 3", Start from **Blank (default)** / From template, "Add to site navigation" switch. Not created. | WORKS — BD-32 verified POST | s24-03 |
| "+" next to canvas page tabs | Opens the Pages panel; it does not create a page. | CONFUSING | s23-02/03 |
| Assets | "Assets · 1", search, Manage assets, Filter, Upload, Add from (Stock photos / Icons / Aa Fonts). Upload not executed. | WORKS (open) | s06-10, s28-05 |
| CMS | Full-page view. Collections (Team 2), New collection, Data: Sources / Variables / Conditions. Opening Team shows records (Grace Hopper, Ada Lovelace, both **Draft**) with Records / Fields tabs, search and + Add record. Opening Team logs a **React "unique key" error from `RecordsTable`**. | WORKS, P2 console error | s06-12, s28-09 png |
| Brand | Full-page view with 11 sub-pages. Colours table: 58 tokens, light / dark, usage counts, live preview. A "**No brand set**" banner shows although 58 tokens exist. Several tokens share one value: color-action, color-primary and color-brand-500 are all #1A56DB. | WORKS, CONFUSING | s06-14 png/a11y |
| Help (rail) | Clicking it timed out twice. The Next.js dev indicator sits on top of the button (dev-only). | NOT REACHED (harness) | s23, s29 |
| Get started 4/7 | Expands a checklist with 7 steps. **Esc does not close it**; minimize and close buttons exist. | WORKS, minor | s29-06/08 |
| Tip 1/4 coachmark | Appears on first load over the canvas; "Got it" dismisses it. | WORKS | s01-05 |

## 3. Canvas

| Control | Observed behaviour | Verdict | Evidence |
|---|---|---|---|
| Click select | Selection box, type label, 8 resize handles, rotation handle, floating Duplicate / Delete / More toolbar, footer readout "Heading · Build faster sites · 314 × 115". | WORKS | s07-04 |
| Floating toolbar placement | On the hero heading, the toolbar and its hint text ("Duplicate ⌘D · Delete ⌫ · More") are drawn **over the heading's own text**. | CONFUSING | s09-04 png |
| Selected button colour | The selected "Click Me" renders **green** while the inspector Fill says Primary (blue). Likely the :hover state with the pointer still over it; not proven. | UNKNOWN | s07-10 png |
| Right-click | "Element context menu": Duplicate, Delete, Arrange ›, Style ›, Structure ›, Lock, Bind to CMS field…, Add interaction. Arrange › Bring to front / forward / Send backward / back. Style › and Structure › were not opened. | WORKS | s08-13, s09-07 png |
| Double-click text | Enters inline edit and shows a rich-text toolbar (Text style, Font size, B / I / U / S, lists, align ×4, indent, colour, highlight, link, clear). Issues listed in the next row. | **BROKEN** | s21-04 png |
| Inline toolbar issues | (a) The toolbar **covers the text being edited**. (b) It shows "Paragraph" / "**10px**" for an H2 that is 36 px in the inspector. (c) It overruns the canvas and the last buttons are clipped. | (see row above) | s21-04 png |
| Delete key | Deletes the selection and selects the parent. | WORKS | s25-04 |
| ⌘D | Duplicates. | WORKS | s26-04 |
| Undo / Redo buttons, ⌘Z | Work, with correct enabled/disabled states. | WORKS | s26 |
| Toast "Undo" | A second "Undo" button inside the toast has the same accessible name as the footer Undo. | CONFUSING (a11y) | s25 strict-mode log |
| Autosave | Topbar shows "Unsaved changes", then "Saved" within ~1 s. A Delete followed by tab close within <1 s was **lost** on reload (s25 → s26). Whether a beforeunload guard exists could not be tested in headless. | P2 (risk) | s25, s26-03, s27 |
| Canvas width vs left panel | With a left panel open, the "desktop" frame narrows to ~752 px and page content is **clipped** at the right edge (Click Me buttons cut off). There is no horizontal scroll. | CONFUSING / P1 | s00 png vs s01-08 png |
| Collection list on load | Cards briefly render raw tokens **`{{item.title}}` / `{{item.role}}`** before the data arrives. | P2 BROKEN (flash) | s17-02 a11y |
| Footer View menu | Snap guides, Spacing, Grid 10 px ›, Rulers, Badges, X-Ray, Breakpoint ›, Zoom ›. The button label "View · 1/3" is a toggle count with no legend. | WORKS, CONFUSING label | s11-08, s12 |
| Rulers, X-Ray | Both rendered: rulers at the top and left, element outlines with fills removed. | WORKS | s12-07 png |
| Spacing, Grid, Badges, Snap | Present. Not toggled (that run was lost to a cleanup timeout). | NOT TESTED | — |
| Breakpoint › | Desktop / Tablet 768px / Mobile 375px / Custom width…. Tablet narrows the frame and shows "768px" plus a tablet icon in the footer. The canvas scroll position jumped and the top heading was cut off. Breakpoint switching **exists only inside View ›**. | WORKS, CONFUSING discoverability | s13-04, s14 png |
| Zoom | Fit, 50, 75, 100, 150, 200%. Not applied. | WORKS (menu) | s13-05 |
| Select after Tablet switch | Clicking the heading after switching to Tablet hit the REA 20 s watchdog. | NOT REACHED (harness) | 18:51 partial |
| Drag-add, drag-move, resize, rotate, hover, ⌘/Shift multi-select, marquee, arrow nudge | REA has no drag, hover or modifier-click actions. | NOT TESTED | — |

## 4. Inspector

| Family / surface | Observed sections and controls | Verdict | Evidence |
|---|---|---|---|
| No selection (Page) | Breadcrumb, "Home · Page", Page actions (one item: "Page settings…"), Hide inspector. Sections: Fill (Background → token), Size (Max width), Typography (Font, Text colour token), Spacing box, SEO & social ↗. | WORKS | s00, s28-02 |
| Heading — Style | Heading (Level H1–H6, Text style preset, Edit text on canvas), Typography (font, size, line-height, weight, colour hex `c81e1e`, align, More settings 9), Size (Width · Fill **with a fixed "314 px" value shown**, Height Hug, Column / Row span, More settings), Spacing (token-linked margin), Fill (collapsed, Add), Border (collapsed, Add). | WORKS, CONFUSING ("Fill" plus px value) | s07-04, s08-07 |
| Heading on About | Text style "Heading 1" while Level is H2. | CONFUSING | s21-04 png |
| Heading — Behaviour | CMS binding (Static / From CMS), Visibility (Desktop / Tablet / Mobile), Interactions ("On scroll into view Fade In Up", + Add interaction), CSS classes (`hero-title`, Add class), Attributes (collapsed). | WORKS (displayed) | s08-05 |
| Heading — Effects | Opacity, Shadow, Filters, Transform & motion, Advanced ("Cursor: auto · Blend: normal"), each collapsed with Add. | WORKS (displayed) | s08-06 |
| State row | "State: Base" › Base, :hover, :focus, :active, :disabled. | WORKS (menu) | s08-08, s09-04 png |
| Element actions ⋯ | Duplicate, Copy style, Paste style (disabled: "Copy a style first"), Apply style to all H2 (disabled, 0), Reset style, Save as component…, Lock, Delete. | WORKS | s08-10, s09-05 png |
| Text (paragraph) | Text section (Text style "Body text", Edit text on canvas), Typography (16 px, 1.6, 400, colour hex `333333`), Size, Spacing (space-3 token). | WORKS | s08-12, s09-07 png |
| Button | Button (Type Button / Submit / Reset, Disabled), Size (Height Fixed 40 linked to a token), Spacing (btn-padding-x token), Fill (Primary token), Border (radius 8…), Text inside. | WORKS | s07-10 |
| Image | Image (No file yet, Choose image, Alt text, Fit, Loading), Size (incl. min/max), Spacing, Fill, Border. | WORKS | s20-09 png |
| Section (component instance) | "Component: Hero Section", Component section (Variant, **Push to master**, Instance actions), Size, Spacing, Fill, Border. **No Layout section.** Both page sections report as instances of Hero Section. | WORKS (displayed); Push to master not clicked | s22-03/04 |
| Collection list | Layout (Display Block / Flex / Grid / None, Columns 3, Gap 16, Position), Size, Spacing, Fill, Border, Text inside. Behaviour tab not opened. | WORKS (Style) | s22-05 |
| Breakpoint indication | Inspector header shows no breakpoint. The only indicator is a small icon in the canvas footer. | CONFUSING | s14 png |
| Container / flex / grid, link, video, form + inputs, locked element, multi-select | Not selected. | NOT TESTED | — |
| Individual control edits (colour picker, font picker, numeric steppers, token jump) | Not exercised. | NOT TESTED | — |

## 5. Preview (BD-34, POST)

| Control | Observed behaviour | Verdict | Evidence |
|---|---|---|---|
| Open | Region "Site preview" with an iframe. No page errors logged. | WORKS | s15 |
| Fidelity vs canvas | (1) Images render as **broken-image alt text "Image"** where the canvas shows placeholders. (2) Headings use a different typeface and colour (e.g. "Master edit" black vs slate on canvas). (3) The **collection list (Grace Hopper / Ada Lovelace) is absent**. Its records are Draft (s28), so preview probably shows published rows only; that is inferred, and nothing tells the user. (4) The "site" link is default blue and underlined. | **BROKEN / CONFUSING** (WYSIWYG gap) | s15-04 png vs s00 png |
| Page select | The "Home" label collides with its chevron. | P2 visual | s15-04 png |
| Breakpoint buttons / Share preview | Present. Not clicked. | NOT TESTED | s15 |

## 6. Publish (simulation)

| Control | Observed behaviour | Verdict | Evidence |
|---|---|---|---|
| Publish now | Panel "Publishing to production…" with a progress bar and Cancel, Environment (Production …dev-simulated.invalid, Preview None), disabled "Publishing…". Finished as v2 (History · Published, Notifications, Activity). | WORKS | s16, s17-06 |
| Progress | Still "Starting · started 9s ago" with an empty bar after a 15 s wait. | P2 (stale progress) | s16-05 png |
| Copy | Says "your site is deployed to your connected Vercel account" in simulation mode. The Issues panel correctly says "PUBLISH_ALLOW_SIMULATION is on… nothing is deployed". | CONFUSING | s16-05, s18-09 |

## 7. Dashboard touchpoints

| Surface | Observed behaviour | Verdict | Evidence |
|---|---|---|---|
| /dashboard | React **hydration error** on the greeting: server "Good evening" vs client (UTC) "Good afternoon". | P2 BROKEN | ev_22848e6a |
| Create a site (BD-33) | "Site limit reached (3/3)" with no Create button, so the flow can't be completed. The dialog still shows the name as "Available". | NOT REACHED | ev_454d2e62 |
| About empty state | "Start with a template, drop a block, **or describe your site**". This is AI-era copy and AI has been removed. | CONFUSING (stale copy) | s20-02 |

## Issues ranked

**P0** — none observed. No crashes, page-errors or data-loss paths were found in normal-speed use.

**P1**

1. **Click-to-add inserts into the selected leaf element.** Image went inside a Button, producing `<button><img>` and overlapping layout (POST, s20).
2. **The inline text-edit toolbar is unusable as drawn.** It covers the text being edited, shows wrong values ("Paragraph" / 10px on a 36 px H2) and is clipped past the canvas edge (POST, s21-04).
3. **Preview does not match the canvas.** Broken images instead of placeholders, a different typeface and colours, and the collection list missing with no explanation (POST, BD-34, s15).
4. **The "desktop" canvas width depends on the panel.** Opening any left panel narrows the frame and clips content with no horizontal scroll (PRE, s00 vs s01).

**P2**

5. Raw `{{item.title}}` / `{{item.role}}` flash in collection cards on load (POST, s17-02).
6. Comments mode gives no visible affordance: an invisible capture layer, no banner or cursor hint (PRE, s10, s11).
7. Status messaging contradicts itself:
   - "Published — site is live" while "Unsaved changes" is showing (s27).
   - Notifications call a simulated publish "live".
   - The Publish panel claims a Vercel deploy.
   - The Publish button disappears entirely when nothing is pending (POST).
8. An edit is lost if the tab closes within ~1 s (s25 → s26). No beforeunload behaviour could be observed.
9. Three overlapping add catalogues (Elements / Blocks / Built-in components) share names and the built-ins use a generic icon (PRE, s05).
10. Brand: "No brand set" banner despite 58 tokens, and triplicate tokens with identical values (PRE, s06).
11. Breakpoint switching is only reachable inside View ›. The "View · N" label is cryptic, the inspector has no breakpoint indicator, and the canvas jumps scroll on switch (POST, s13, s14).
12. Pages tree shows About as "Live" after edits, so the unpublished marker is missing (POST, s23, s24).
13. Console errors:
    - React duplicate-key error in CMS `RecordsTable` (s28).
    - Export preview iframe tries to run scripts without `allow-scripts` (s19).
    - Dashboard hydration mismatch.
    - `/favicon.ico` 404 on every load.
14. Smaller items:
    - Floating element toolbar overlaps the selected heading's text.
    - Image add auto-switches the sidebar to Assets.
    - Site-name click opens Pages.
    - Canvas "+" opens Pages instead of creating a page.
    - "Untitled Project" flash on load.
    - Checklist ignores Esc.
    - Stale "describe your site" AI copy.
    - Publish progress label stuck.
    - Width "Fill" shown alongside a px value.
    - Heading Text style "Heading 1" on an H2.

## NOT TESTED (with reason)

- **Needs drag, hover or modifier keys (REA has none):**
  - drag-add, drag-move, resize, rotation
  - hover states and the hover outline
  - ⌘-click / Shift-click multi-select, marquee
  - the multi-select inspector
- **Lost to REA cleanup timeouts or the 20–30 s watchdog under host load ~600:**
  - Spacing / Grid / Badges / Snap overlays
  - selecting an element after the Tablet switch
  - Help rail button (also covered by the Next.js dev indicator)
  - the Page templates screenshot
- **BD-33 create-site → editor:** the workspace site limit is 3/3.
- **BD-35 Push to master** (button seen, not clicked), **BD-36 paste styles by breakpoint/state**, **BD-37 conflict dialog:** time and setup. BD-37 needs two concurrent editors.
- **The other 48 ELEMENTS rows, every BLOCK, every BUILT-IN component, saved-component insert, template apply:** only 5 rows were exercised, to limit pollution of a shared site.
- **Inspector families not selected:** container / flex / grid, link, video, form and inputs, locked element. Also not done: editing any individual control value, the colour / font pickers, the Behaviour tab of the collection list.
- **Context-menu Style › and Structure ›** submenus, Lock / Bind / Add interaction actions.
- **Not opened:** Brand sub-pages other than Colours; Settings sub-pages other than Overview; Assets Upload / Manage assets / Filter; CMS Fields, Add record, Sources / Variables / Conditions; Layers Display settings; per-page ⋯ menu.
- **Site menu items not clicked:** Duplicate site, Unpublish, Share preview link, Copy live URL, Getting started, Enter view mode, external ↗ links. Also: Exit, Save a version, posting a comment, sending a review, Preview breakpoint buttons and Share preview, Zoom levels applied, Mobile and Custom width breakpoints.
- **Keyboard:** the full shortcut sheet beyond ⌘D / ⌘Z / Delete / Esc.

## Side effects left on the test site

- **About page.** Five elements were added in s20: Heading, Text, Link, Button and an Image nested inside the Button.
  - The nested Image was deleted again and confirmed Saved (s27).
  - One duplicated heading was undone (s26).
- **Two simulated publishes in total.** One of them is mine: v2 at ~17:56.

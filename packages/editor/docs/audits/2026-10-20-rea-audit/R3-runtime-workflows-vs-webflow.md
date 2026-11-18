# R3: Runtime workflows compared with Webflow (REA, 2026-10-20)

Part 3 of the REA audit. It walks 21 workflows (W1–W21) in the running editor and maps the results onto
the 65 Webflow capability IDs in
`docs/audits/2026-10-20-webflow-reverse-audit/evidence/W-webflow-reference.md`. It re-checks the earlier
non-REA walk (`evidence/L-live-walk.md`, which ran on `main`) instead of copying it.

**Claim tags.** **OBSERVED** means a measured DOM, computed-style, network or DB fact, with its evidence
named. **INFERRED** means reasoned from named observations. **UNKNOWN** means not established.

---

## 1. Method

### Target and code revision

- App: `http://localhost:3330`, a Next 16 dev server (Turbopack) in
  `~/Desktop/buildrik-worktrees/phase1-integration`, branch `feat/phase1-integration`.
- **The code under test changed during the walk.** At 17:46 PKT the coordinator merged `dc72314c2`
  (BD-32 to BD-37) and the server hot-reloaded. I reloaded the editor before continuing.
  - **[A] = revision `6dbe51b25`**: findings observed before 17:46.
  - **[B] = revision `dc72314c2`**: findings observed after 17:46.
  - Every workflow below carries its tag. I re-checked the workflows the merge touched: W5 Preview,
    W9 paste styles, W11 push to master, W12 New page default, W15 and W16 Preview. **W1 (BD-37) could
    not be re-checked** (see §5).
- Test site: **`audit1020-rea-flows`**, id `cmvgmyjp8001rij7bvn63ta7f`, owner `qa@buildrik.local`,
  created in W1. I did not touch `audit1020-webflow`.
- Login: a magic link minted with `scripts/baseline/.mint-magic.ts cmv8utrgt0000mo387bu4jgqa`.
  Viewport 1440×900.

### Harness

- A headless Chrome for Testing 149 (`chromium-1228`) was launched by a Playwright persistent context
  with `--remote-debugging-port=9333`.
  - **REA** tools attached to that same browser over CDP: `list_browser_targets`, `inspect_web_page`,
    and `capture_browser_scenario` in both connect and launch modes.
  - A Playwright driver on the same page did the computed-style, `cssRules` and DOM reads that REA's
    scenario actions cannot express. REA has no evaluate action.
- I read the published output from the local DB.
  - `publish_build_jobs.log.pages` is the HTML before the final transforms.
  - `publish_build_jobs.bundle.files` is the final shipped bytes.
  - Both were saved under the scratchpad (`r3/pub/`, `r3/bundle2/`) and rendered from `file://`.
- Screenshots referenced below as `shots/<name>.png` live in
  `/private/tmp/claude-501/-Users-shahg-Desktop-pencil-buildrik-packages-editor/56bb4919-4be8-4b4f-9e42-32587e7a3d44/scratchpad/r3/shots/`
  (128 files).

### REA Evidence IDs

| ID | Evidence | What it holds |
|---|---|---|
| E1 | `ev_8269aaf72bb861e5d536a6aa7e73acc5b278a4e91896927c00c0b4a8ed335440` | `list_browser_targets` (first browser) |
| E2 | `ev_37efe4c5e68d0d1a775de062e4a4787d5d1fa9e5a335366ea38bd3639065eaed` | **W1** scenario [A]: New site → fill name → Start from Scratch. `sites.create` 200, then `sites.list`. The URL is still `/dashboard/projects` 15 s later. |
| E3 | `ev_21bd5ec58c8e9b42849fb375fafbb3f1bb2a7be251b7a20eed94eacf8dddb93c` | `inspect_web_page` of the editor's first load [A]: 1,485 DOM nodes, **1** `data-buildrick-id` node (empty root), 94 scripts, IndexedDB `aquibra-cms/-components/-media/-versions` |
| E4 | `ev_3ab67f5568d124a1dba154bd3793d857ee374bf1d00d8417d9f2a37ab22c6fcb` | `list_browser_targets` (second browser, target `DCF1B6C4…`) |
| E5 | `ev_8db8a7d595f4f6e09c7df6857e390ac85251bc4bc6ee5d161b859a7bca8c8869` | **W17** reload in the same profile [B]: DOM capture of 268 KB |
| E6 | `ev_ac0c494eebc1864ddac6118e89f625d3b27927af95d27c3a1c236c58dbdbe298` | **W17** fresh browser (launch mode, empty profile, new login) [B]: DOM capture of 360 KB |
| E7 | `ev_4ceb02e34e2c78aad78c096b753bab4e61d215fdefea3a9075584becdc29b6de` | **W18** keyboard scenario [B]: select text, then ⌘E, ⇧/, Esc, S, Esc, ⌘⇧P, with a screenshot after each step |

The Playwright driver produced every measurement not covered by E1–E7. Those cite a screenshot name or a
quoted measurement.

### Harness errors (rule 3: a null result is the harness until proven otherwise)

I caught these and redid the step each time:

1. **Drag hang.** `connectOverCDP` made the HTML5 drag hang. I switched to a Playwright-launched
   browser that exposes CDP.
2. **Off-screen drag source.** My first Image drag picked up an Add-panel row that was off-screen.
   I scrolled the row into view and the drag worked.
3. **Elements outside the canvas viewport.** Elements outside the viewport were unclickable. The canvas
   pans with the wheel, not with `scrollTop`, so I clicked after wheel-panning instead.
4. **Collapsed side panel.** A collapsed side panel still reported its rows as visible (width 44 px).
   I switched to checking the row width.
5. **`End` key.** `End` does not move the caret on macOS. So my "text edit" undo test replaced the word
   "Heading" with " undo". The undo and redo results stand.
6. **Stray keystrokes.** In W11, keystrokes typed when edit mode had not started acted as shortcuts.
   They turned Snap guides off and Grid and X-ray on. I restored them from the View menu.
7. **REA viewport override.** A connect-mode REA scenario left a 500×713 device-metrics override on the
   page. I cleared it with `Emulation.setDeviceMetricsOverride`.
8. **REA hang.** One REA scenario waited 30 min on a button that did not exist (the site-limit dialog,
   see W1). That cost time but produced no data.

---

## 2. Workflow results

| # | Workflow | Rev | Verdict vs Webflow | W IDs |
|---|---|---|---|---|
| W1 | Create site → editor | A | **DIFFERENT** | — (Designer opens on create) |
| W2 | Drag-add section/container/heading/text/button/image; Navigator = DOM | A | **MATCHES** (one Navigator gap, W11) | C04, C10 |
| W3 | Classes | A | **MISSING** | S01, S05, S06 |
| W4 | Desktop→Tablet→Mobile cascade, tablet-only override | A | **MATCHES** (cascade); **BROKEN** (Esc revert, tablet clipping) | C02, S03 |
| W5 | States on canvas / Preview / published | A + B | **PARTIAL** (5 states, works everywhere; heading colour differs) | S04, C12 |
| W6 | Flex + grid controls | A | **PARTIAL** | S02, S09 |
| W7 | Spacing box, rem / % / calc | A | **PARTIAL** | S08 |
| W8 | Inline text: Esc, link, B/I, Clear formatting, Enter | A | **PARTIAL** | C06 |
| W9 | Copy/paste/duplicate keep responsive + hover; paste styles on Tablet | A + B | **MATCHES**; paste-styles is **DIFFERENT** (Webflow has none) | C07, S11 |
| W10 | Reorder on canvas + Layers | A + B | **MATCHES** | C05, C10 |
| W11 | Components: create, instances, master edit, overrides | B | **DIFFERENT** | K01–K04 |
| W12 | Pages + SEO + head code with `<meta>` | B | **MATCHES** | P01, P02 |
| W13 | Asset upload + alt | B | **PARTIAL** | P04, E03 |
| W14 | CMS collection, items, bind, list, template, published items | B | **PARTIAL** | M01–M03, M05, M06 |
| W15 | Interactions on canvas / Preview / published | B | **PARTIAL** (runs everywhere, presets only) | I01–I03 |
| W16 | Preview vs published fidelity; published CSS shape | B | **PARTIAL** | C12, X01 |
| W17 | Reload persistence | B | **MATCHES** | C11 |
| W18 | Keyboard shortcuts | B | **DIFFERENT** | C09, C14 |
| W19 | Undo / redo | B | **MATCHES** (session only) | C11 |
| W20 | Version history save / restore | B | **MATCHES** | X02 |
| W21 | Forms submit | B | **PARTIAL** (published works; Preview drops the form) | F01 |

### W1: Create site → editor [A] (E2)

**Steps.** Sites → New site → name `audit1020-rea-flows` → Start from Scratch.

**OBSERVED.**
- `POST sites.create` returned 200, followed by `sites.list`.
- 15 s later the URL was still `/dashboard/projects`, and a new Draft card was visible (`shots/w1-settle.png`).
- After I opened the editor with the card's Edit link (E3):
  - `.bd-studio` mounted 4.5 s after `goto`.
  - The canvas showed an empty-state CTA. Its copy still says "…or describe your site" although AI is
    gone from the editor.
  - The Add panel listed 53 elements, under **SAVED COMPONENTS 1** (see W11).
  - Console: one 404 (resource URL not captured) and `[StyleEngine.importStyles] dropped 19 malformed rule(s)`
    on a brand-new site. The L walk saw the same warning.
- The dashboard New-site dialog still offers "Generate with AI · 0/3 cr" (`shots/w1-00-newsite-dialog.png`).

**[B] re-check: NOT POSSIBLE.** The workspace is at its plan limit. The dialog shows **"Site limit reached
(3/3)"** and Start from Scratch is absent (`shots/w1b-state.png`). Making room would mean deleting
another agent's site.
- BD-37 (`30684e137`, "every create-site path opens the editor") is **INFERRED** from the commit only.

**Verdict: DIFFERENT** at [A]. [B] is UNKNOWN.

### W2: Build by drag-add; Navigator vs DOM [A]

**OBSERVED.**
- Section drag → `section.section > div.container`. A Section always brings its own Container.
- Image drag into the Container's centre → `img` inside the Container.
- Drops 12 px above the Container's bottom edge landed in the **Section**, after the Container. This is
  drop-zone geometry, the same as the L walk (`shots/w2-02-elements-added.png`).
- I nested Heading, Text and Button into the Container by dragging Layers rows. The Layers rows matched
  the DOM exactly: `1 Section / 2 Container / 3 Heading / 3 Image / 3 Lorem… / 3 Click Me`
  (`shots/w10-01-layers-after.png`).
- Click-to-add also works.
  - With an H2 selected, Divider and Form were inserted after the selection.
  - With the Section selected, a Collection list went **into its Container**
    (toast "added to Home › Section › Container").
  - Webflow puts a click-added element at the end of the selected parent.

**Verdict: MATCHES.** The one exception is component instances (W11): their children are absent from Layers.

### W3: Classes [A]

**Steps.** Heading → Behaviour → "Add a class…" → `hero-title`. Style: font-size 48. Second H2 → `hero-title`, `is-alt`.

**OBSERVED.**
- The Style tab has **no selector field**. Its only scope control is "State: Base / :hover / :focus / :active / :disabled".
- **Changed since L:** a style edit is no longer an inline `style`. It is a stylesheet rule keyed by the element id:
  `[data-buildrick-id="el-…tc1j6b"] { font-size: 48px; … }`. The element's `style` attribute holds only `cursor: grab`.
- `cssRules` contain **no** rule that mentions `hero-title` (scan returned `[]`).
- The second `hero-title` heading computed **36px** while the first computed 48px.
- Typing "hero" in the class field showed no suggestions: no `[role=option]`, no `datalist`.
- The field accepts **`9 Bad Name!`** and splits it into the classes `9`, `Bad`, `Name!`. All three ship
  in the published HTML: `class="buildrick-el-… hero-title is-alt 9 Bad Name!"` (`pub/index.html`).
- **Published:** every element gets a generated class `buildrick-el-<id>` with its own rule.
  - User classes are emitted with no rules.
  - Hover and media rules use `[data-buildrick-id=…]`.

**Verdict: MISSING.** Classes are still labels with no styles. Styling is still per-element, now through
per-id sheet rules. The class field validates nothing.

### W4: Breakpoints and cascade [A]

**OBSERVED.**
- **Where the switcher is.** Bottom bar → View → Breakpoint → Desktop / Tablet 768px / Mobile 375px /
  Custom width. Keys 1–4 do nothing (W18).
- **Measured cascade** (element `ia1gks`):

  | Step | Computed font-size |
  |---|---|
  | Desktop set to 30 | 30px |
  | Tablet, before any edit | inherits |
  | Tablet set to 22 | 22px; inspector shows "Tablet · 1 override" |
  | **Mobile** | **22px** (inherits Tablet: commit `c03a73e39` works) |
  | Tablet again | 22px |
  | Desktop again | 30px |

  (`shots/w4-05-tablet-22.png`, `w4-06-mobile.png`)
- **Published.** A single block, `@media (max-width:1023px){… [data-buildrick-id="…ia1gks"]{font-size:22px} …}`.
  Rendered at 900px and 375px it computes 22px; at 1440px it computes 30px.
  - Webflow's tablet range ends at 991px. Here it ends at **1023px**.
- **BROKEN: Esc after Enter reverts a committed value**, and the revert persists.
  - Set font-size 27, press Enter: computed 27, topbar shows "Saved".
  - 3 s later, press Esc with focus still in the field: the value goes **back to 44px**.
  - After a reload it is **still 44**. Reproduced 3 times.
  - On a non-base breakpoint the revert writes the **old value as a new override.**
    - On Tablet, `tc1j6b` ended up with a tablet-layer `font-size: 48px` that I never set.
    - That rule ships: `@media (max-width:1023px){[data-buildrick-id="…tc1j6b"]{font-size:48px}}`.
    - Any later desktop change to that heading will no longer reach Tablet or Mobile.
- **BROKEN: on Tablet, the top of the page cannot be reached at 1440×900.**
  - The canvas column is `display:flex; align-items:center` (not `safe center`), and the frame is 1,048px
    tall inside a 715px scroll box.
  - So the top ~166px sits at negative y. The scroll box reports `scrollTop 0`, `scrollHeight 882`,
    `clientHeight 715`.
  - Ten wheel-ups left the first heading at y = −30.5 (`shots/w4-02b-tablet-top-clipped.png`).
  - The element can be selected only through Layers.

**Verdict:** the cascade **MATCHES** Webflow (desktop-first, cascades down). The two defects above are BROKEN.

### W5: States [A canvas + Preview; B Preview re-check]

**OBSERVED.**
- **States offered:** Base, `:hover`, `:focus`, `:active`, `:disabled`.
- **Rules created** for the Button:
  - `:hover` → Accent
  - `:focus` → Secondary
  - `:active` → Background
- **Canvas.** All three measured correctly:

  | State | Computed `background-color` | Check |
  |---|---|---|
  | Hover | rgb(21,128,61) | `matches(':hover')` true |
  | Focus | rgb(100,116,139) | |
  | Pressed | rgb(248,250,252) | |

- **Preview [A]:** hover gave rgb(21,128,61) and `:active` gave rgb(248,250,252).
  - The button in the preview document has no `style` attribute. The L walk's defect, an inline base
    beating hover, is gone.
- **Preview [B]** (after BD-34): hover still rgb(21,128,61) (`shots/w5-06-preview-hover-postBD34.png`).
- **Published:** the hover computes rgb(21,128,61) (`pub/index.html` rendered).
- **Fidelity defect.** The same H2s compute different colours:
  - Canvas: `rgb(51,65,85)`.
  - Preview and published: `rgb(0,0,0)`.
  - The inspector's Colour field shows `1a1a1a`.

**Verdict: PARTIAL.** States work on canvas, in Preview and in published output. Webflow's Focused (keyboard),
Visited, Placeholder, Checked and Current are missing, and text colour differs between canvas and output.

### W6: Flex and grid [A]

**OBSERVED.**
- **Flex:** Display Flex, Row, 3×3 align "center center", gap 24 →
  `display:flex; flex-direction:row; gap:24px; align-items:center; justify-content:center`.
- **Grid:** Columns 3 → `312px 312px 312px`.
- **New since L:** Layout → **More settings** exposes Column tracks, Rows, Flow (row / column / dense),
  Justify, Align rows, and inline display types.
  - Column tracks `1fr 2fr minmax(100px, 1fr)` → computed `234px 468px 234px`.
  - Rows `auto 100px` → computed `80px 100px`.
- **Children:** Column span and Row span (Auto / 1–4 / Full row), Align self, Justify self.
- **Not present:** a visual grid editor, named areas, pinning a child to a cell.

**Verdict: PARTIAL.** The track model is close to Webflow's; the visual grid editor is not there.

### W7: Spacing [A]

**OBSERVED** (element `ia1gks`):

| Typed | Computed | Field shows afterwards |
|---|---|---|
| margin-top `2rem` | **32px** | "2" (unit only in the hidden aria text "in rem") |
| padding-top `10%` | 46.8px | "10" |
| padding-right `2vw` | 28.8px | — |
| margin-left `auto` | stored as `margin-left:auto` | "auto" |
| padding-left `calc(1rem + 4px)` | **0px** | field cleared, no rule (silently dropped) |

- ↑, ↑, ⇧↑ → 12 (correct).
- No drag-scrub: plain or ⌥ drag left 12 unchanged, and the cursor is `text`.

The unit fix (`653ae226a`) is confirmed against the L walk, where 2rem computed 2px.

**Verdict: PARTIAL.** calc() is silently dropped, there is no visible unit, and there is no scrub.

### W8: Inline text [A]

**OBSERVED.**
- **Esc commits** (fix `1d28d3d8f`): ⌘A, type, Esc → `Esc commit test` with `contentEditable=false`.
- On a selected "ipsum":
  - ⌘B → `<b>ipsum</b>`.
  - ⌘I → `<b><i>ipsum</i></b>`.
  - **Insert link** → `<b><i><a href="https://example.com" target="_blank" rel="noopener noreferrer">ipsum</a></i></b>`.
    This fixes the L walk's "URL replaced the text".
  - The default is **`target="_blank"`**, unlike Webflow.
- **Clear formatting** over the whole paragraph removed `<b><i>` and kept the `<a>`. ⌘Z restored them.
- **Enter and Shift+Enter in edit mode both commit and exit.** I found no way to insert a line break by keyboard.
- **Enter on a selected element does not start editing.**
  - Focus after a canvas click stays on the last rail button (`activeElement` = "Add elements…" BUTTON).
  - **INFERRED:** this is why Enter does nothing.
- The floating toolbar offers Bold, Italic, Underline, Strikethrough, lists, align, indent, colour,
  highlight, Insert link and Clear formatting. It has no sup/sub and no "wrap with span".

**Verdict: PARTIAL.** Webflow's Enter-to-edit and Shift+Enter behaviour are not sourced in W, so that
comparison is **UNKNOWN**.

### W9: Copy / paste / duplicate [A dup + paste; B paste styles]

**OBSERVED.**
- **⌘D on a Button** that has hover, focus and active: the copy carried all three state rules. Hover on
  the copy computes rgb(21,128,61) (Phase-1 BK-06 holds).
- **⌘C / ⌘V of an H2** with a tablet override: the copy computes 22px on Tablet and 30px on Desktop.
  - It was pasted **as the 2nd child** of the selected Container, not at the end.
- **⌘X → paste:** "Element cut", element count 33 → 32, then "Element pasted" (new id).
- **Paste styles on Tablet [B]:**
  - ⌘⌥C on H2 → "9 styles copied". On Tablet, ⌘⌥V on the paragraph → "9 styles applied".
  - The Tablet rule got the 9 properties, and the Desktop rule was unchanged.
  - Published Tablet block: `[data-buildrick-id="…1tsd6q"]{font-size:30px;…}`.
  - ⌘Z restored the previous rules exactly.

**Verdict: MATCHES** for copy, paste and duplicate. Cross-site paste was not tested. Paste-styles has no
Webflow equivalent (S11): **DIFFERENT, superset**.

### W10: Reorder [A Layers; B canvas]

**OBSERVED.**
- **Layers row drags** nested three elements (W2).
- **Canvas drag** of the Button onto the start of the paragraph: order `…1tsd6q,jj1jqc,7x1doa,t21yes…`
  became `…t21yes,1tsd6q…`. ⌘Z restored it exactly.
- **⌥↑** reorders and is undoable (W19).
- `[` and `]` do nothing (W18).

**Verdict: MATCHES.**

### W11: Components [B]

**OBSERVED.**
- **Create.** Element actions → "Save as component…" → "Audit Card", scope This site → "Audit Card created as a component".
- **Instances.**
  - Clicking the Add-panel row inserted an instance ("Component added to canvas").
  - **Two drag attempts** of the same row onto the canvas inserted nothing. I did not isolate this
    (UNCONFIRMED: possibly drop geometry).
- **Inspector:** "Component: Audit Card · Variant Default · Push to master". No props UI was observed.
- **Layers:** instances show as **"Card ◇" with an expanded caret but no child rows**, although the DOM
  has `img`, `div`, `h3`, `p` under each one. The Navigator does not equal the DOM for instances.
- **Push to master** (BD-32):
  - Confirm text: "Replace the 'Audit Card' master with the selected instance? 2 instance(s) will change…".
  - Result: "2 linked instances updated".
  - Instance 2's title became "Master edit A".
  - With a child selected, the panel's "Push to master…" is `disabled`, titled "Select an instance of
    Audit Card on the canvas (its outer element)". BD-32 holds.
- **Overrides:** instance 2's description was edited to "Override B". A second push from instance 1 gave
  `["Master v2 | Card description goes here.", "Master v2 | Override B"]`, so the override was kept.
- **Cross-site library:** a new site's Add panel lists "Hero Section", which the other agent created on
  `audit1020-webflow` (`insert-library-comp-…`).
  - **INFERRED** scope leak. The L walk says it was saved with scope "This site". UNCONFIRMED.
- **Visual:** the Components panel's master preview renders overlapping text ("CardTitle/Carddescriptionhere";
  `shots/w11-05-push-dialog.png`).

**Verdict: DIFFERENT.** The model is push-from-instance with no isolated master canvas, no props and no slots.

### W12: Pages, SEO, head code [B]

**OBSERVED.**
- **New page** dialog defaults to **Blank** (BD-33).
- **Page menu:** Rename F2, Duplicate, Set as homepage, Replace layout with template, Copy link,
  Page settings, Delete.
- **Settings:**
  - SEO: slug, meta title, description, indexing, Google preview, score.
  - Social.
  - Advanced: Visibility Live/Hidden, Follow links, **Custom `<head>` code**.
- **Head code:** `<meta name="rea-audit" content="r3">` plus a `<link rel=preconnect>` was accepted and saved
  (fix `a338b9a0f`), and it re-read identically.
- **Published `about-us.html`:** `<title>About REA audit — our story</title>`, meta description, OG and
  Twitter tags, and `<meta name="rea-audit" content="r3">`.
- **Not observed:** page folders, and per-page password (Settings lists "Access · Pro").

**Verdict: MATCHES.** URLs are `.html` files (`about-us.html`).

### W13: Assets + alt [B]

One real side effect: a 112-byte PNG was uploaded to the configured Vercel Blob store. It is the only
upload path.

**OBSERVED.**
- **Request chain:** `media.checkStorageQuota` → `media.uploadPrefix` → `POST /api/asset-upload` →
  `PUT vercel.com/api/blob` → `media.createAsset`.
  - **No `media.generateAltText`** (the L walk had one). The AI removal is confirmed.
- **Listing:** shown as `r3-blue.webp`, 566 B (converted and bigger than the 112 B original).
- **Assigning:** with an Image selected, clicking the asset **assigned it to that Image** ("r3-blue applied ✓"),
  as in Webflow.
- **Alt text:** set to "Blue REA swatch" and shipped.
- **Asset library:** has its own "ALT TEXT / Add a description" field, which stayed empty. Asset alt and
  element alt are independent (`shots/w13-06-asset-details.png`).
- **Published `src`:** the original `.png` blob URL.

**Verdict: PARTIAL.** Responsive srcset was not checked.

### W14: CMS [B]

**OBSERVED.**
- **Field types:** Text, Number, Rich text, Image, Boolean, Slug, Long text, Date, Multi-select.
  **No Reference / Multi-reference**, and no Link, Email, Phone, Color, File or Option.
- **Records:** "Team" was created with `name` and `role`. Ada Lovelace was saved as **Published** and
  Grace Hopper as **Draft** (`shots/w14-07-rec2.png`).
  - The dev overlay then showed **"1 Issue"**: a React key warning in `RecordsTable`.
- **Dynamic pages** (record → tab):
  - The template page is chosen from **existing static pages** (About / Member); Home is excluded.
  - URL pattern `/team/{slug}`. SEO title pattern `{name} — REA team`.
  - "1 complete record will get a page · 1 unpublished draft is skipped".
- **Binding:** an H2 on the Member page → Behaviour → From CMS → Team → `name`. It shows "Ada Lovelace"
  on canvas and carries `data-cms-bound=true`.
- **Collection list on Home:** Collection = Team.
  - The canvas shows both records, including the Draft.
  - The settings have **no filter, sort or limit**: only "Show items" and "Open collection".
- **Published:**
  - `team/ada-lovelace/index.html` exists, with `<title>Ada Lovelace — REA team</title>` and
    `<h2>Ada Lovelace</h2>`.
  - The Home list contains **only Ada**; the Draft is excluded.
  - No page was generated for Grace.

**Verdict: PARTIAL.** It closes the L walk's "published records not verified" gap. References and
list filter/sort/limit are missing.

### W15: Interactions [B]

**OBSERVED.**
- **Trigger catalogue:**
  - Element: hover, click, while pressed, focus, blur.
  - Page: load, scroll, leave.
  - Scroll: into view, while scrolling, out.
  - Mouse: over, move, out.
  - CSS entrance.
- **Animations:** 40 presets with Duration, Delay and Easing. **No timeline.**
- **Stored on the element** as `data-buildrick-interactions='[{"trigger":"scroll-into-view","animation":{"preset":"fadeInUp","duration":300,…}}]'`.
- **In-panel Preview now plays** (the L walk said it did not): opacity 0 → 0.62 → 0.91 → 1, transform
  `translateY(20)` → 0, `getAnimations()` 1 → 0.
- **Canvas:** hovering the image ran no animation (0 animations). That is expected for a design canvas.
- **Preview mode [B]:**
  - The iframe is `sandbox="allow-scripts"` with 2 scripts (BD-34).
  - Scroll-into-view played: opacity 0 → 1 over about 300 ms.
  - Image hover ran pulse: scale 1.02 → 1.
  - Button click ran shake: translateX −2.3 → 7.4 → 2.6.
- **Published:**
  - An inline runtime script is present.
  - Hover and click: `getAnimations()` is 1 after the click.
  - Scroll-in was not separately re-sampled on `file://`: opacity was already 1 at first sample.

**Verdict: PARTIAL.** It runs in Preview and in published output. There is no GSAP-style timeline,
targeting or stagger.

### W16: Preview vs published; CSS shape [B]

**OBSERVED.**
- **Publish was simulated.** I checked before clicking:
  - DB: 0 active `vercel` integrations for workspace `cmv8utrl40001mo38rolxbeor`.
  - The server process environment has `PUBLISH_ALLOW_SIMULATION=true`.
- **Result panel:** "Simulated publish — nothing was deployed".
- **Misleading copy.** The dialog said "Target: your connected Vercel project" on the first publish. The
  footer says "your site is deployed to your connected Vercel account". The topbar says "Published —
  site is live".
- **Published CSS** (`bundle2/index.html`): `style=` appears only twice (the form honeypot).
  - Per-element `.buildrick-el-<id>{…}` rules.
  - State and media rules on `[data-buildrick-id]`.
  - One `@media (max-width:1023px)` block.
  - `data-buildrick-*` attributes (51) and the interaction JSON ship to production.
- **Fidelity:**
  - Heading colour: canvas rgb(51,65,85) vs Preview and published rgb(0,0,0).
  - **Preview drops the Form entirely.** The `form` and its 2 inputs and button are missing from the
    Preview srcdoc, while canvas and published HTML both have them.
  - Preview shows only the published CMS record, while the canvas shows both.
- **Bundle extras:**
  - `robots.txt` and `sitemap.xml`, with URLs on `buildrik-site-audit1020-rea-flows.vercel.app` and
    `.html` paths.
  - The simulated deploy URL is `audit1020-rea-flows.dev-simulated.invalid`.

**Verdict: PARTIAL.**

### W17: Reload persistence [B] (E5, E6)

**OBSERVED.**
- **Same profile, reload (E5).** The DOM contains every earlier change:
  - Texts: `Esc commit test`, `Master v2` ×2, `Override B`.
  - Classes: `hero-title is-alt` ×2.
  - Alt text `Blue REA swatch`; link `href="https://example.com"` and `<b><i>`.
  - The `scroll-into-view` interaction.
  - Records Ada and Grace.
  - Styles: grid tracks `1fr 2fr`, `margin-top: 2rem` ×2, the hover rule.
- **Fresh launched browser, empty profile, new login (E6).** The same counts again, plus the accent hover
  rule ×2. Persistence is server-side, not IndexedDB.
- **Exception:** a value reverted by Esc (W4) persists as reverted.

**Verdict: MATCHES.**

### W18: Keyboard shortcuts [B] (E7)

**OBSERVED.** Each key was pressed with the paragraph selected, and the state diff was measured.

| Key (Webflow meaning) | Buildrick result |
|---|---|
| ⌘E (Quick find) | nothing (E7 step key-cmd-e) |
| ⌘K | command palette ✔ |
| ⌘⇧P (Preview) | **command palette** |
| ⇧P (Publish) | nothing |
| ⇧E (Export) | nothing |
| ⌘⇧S (snapshot) | nothing |
| Esc | deselect ✔ |
| Enter (edit) | nothing |
| 1–4 (breakpoints) | nothing |
| A | Add ✔ |
| P | Pages ✔ |
| Z (Navigator) | nothing |
| L | Layers |
| ⇧A (Components) | Add sub-view "‹ Add" |
| J (Assets) | nothing |
| **S (Style)** | **opens full-page Site Settings** (E7 `w18rea-w3.png`) |
| **D (Settings)** | **opens CMS** |
| G (Style selectors) | nothing |
| **H (Interactions)** | **History panel** |
| ⌘Enter (add class) | nothing |
| ⌘⇧A (create component) | selects the Section |
| ⇧/ and ⌘/ | shortcut sheet ✔ (⇧/ is new since L) |
| ⌘⇧X | X-ray ✔ |
| ⌘⇧D, ⇧R, ⇧G, C, ⇧C | nothing measurable |
| **↑ (parent)** | **previous sibling** |
| ↓ | next sibling |
| ← | parent |
| `[` (move) | nothing |
| ⌘⌥G (wrap) | nothing |
| ⌘⇧L | nothing |
| ⌘P | Preview ✔ |
| ⌘H | History |
| F2 (on element) | nothing |

- The palette lists a layer as **"&nbsp;undo"**, a raw HTML entity (`shots/w18-02-palette.png`). It
  also offers "Add heading".

**Verdict: DIFFERENT.** S, D and H do something different from what they do in Webflow, and S navigates
away from the canvas.

### W19: Undo / redo [B]

**OBSERVED** (snapshot of root HTML plus all style text, compared exactly):

| Action | Undo restores | Redo reapplies |
|---|---|---|
| Style font-size | ✔ | ✔ |
| Text edit | ✔ | ✔ |
| ⌥↑ move | ✔ | ✔ |
| Click-add Divider | ✔ | ✔ |
| Duplicate | ✔ | ✔ (same id `6f1oww` on redo, re-run) |
| Delete | ✔ | ✔ (re-run) |
| Paste styles | ✔ | — |
| Tablet-only radius edit | ✔ | — |
| Canvas drag reorder | ✔ | — |

- The first-pass redo mismatches for Duplicate and Delete came from snapshot noise. On the re-run with
  id checks, both were exact.
- History → Session reads "This session only — the last 100 steps, cleared when you reload" and showed
  "No undo history" after a reload.
- **Not undoable:** the Esc revert (W4) and form "Send to" changes (the inspector says so).

**Verdict: MATCHES** (Webflow's undo scope is UNCONFIRMED in W).

### W20: Version history [B]

**OBSERVED.**
- "+ Save a version" → "R3 checkpoint" → "Version saved".
- I then edited the heading to "After checkpoint".
- **Compare with current** showed a semantic diff, "1 text: Heading · text ~~After check…~~ Esc commit…"
  (`shots/w20-06-compare.png`).
- **Restore draft:**
  - The confirm reads "Your current work is saved first".
  - The heading went back to `Esc commit test`.
  - An auto-save "Before restoring 'R3 checkpoint'" appeared, with "Undo restore".
  - The heading was still `Esc commit test` after a reload.

**Verdict: MATCHES** (with a richer compare than Webflow).

### W21: Forms [B]

**OBSERVED.**
- **Click-added Form:** `form > input[name=fullname] + input[type=email] + button[type=submit]`.
  - **No `<label>` elements.**
- **Inspector:** Fields, After submit (Show message / Redirect), Send to, Spam protection.
- **Preview: the form is absent** (W16).
- **Published bundle:**
  - `<form action="http://localhost:3330/api/public/forms/<site>/<form>" method="POST" enctype="application/x-www-form-urlencoded">`
    plus a hidden `_return` and an off-screen `_honeypot`.
- **Submitting** the rendered bundle page from `file://` → **303** from `/api/public/forms/…`.
  - `form_submissions` gained 1 row for the site.
  - The redirect went to `…dev-simulated.invalid` (NXDOMAIN, expected for a simulation).

**Verdict: PARTIAL.** Published submit works; Preview and labels do not.

---

## 3. Capability match: all 65 W IDs

| ID | Capability | Verdict | Evidence / note |
|---|---|---|---|
| C01 | Canvas viewport / zoom / pan | PARTIAL | Wheel pans. Zoom changes on its own (100 / 88 / 61 %) as panels open. **Tablet frame top unreachable** (W4). |
| C02 | Breakpoint switching | PARTIAL | 3 fixed + custom width, in the bottom View menu. Keys 1–4 dead. Tablet ≤1023 (Webflow ≤991). |
| C03 | Select / hover / multi-select | PARTIAL | Click, breadcrumbs and ←-parent work. ↑ = previous sibling. Multi-select exists ("19 selected"), beyond Webflow. |
| C04 | Drag-drop add | MATCHES | W2. Section auto-wraps a Container. |
| C05 | Move / reorder | MATCHES | W10. `[` `]` keys missing (counted under C09). |
| C06 | Inline text + rich text | PARTIAL | W8: Esc, link, B/I and clear work. No Enter-to-edit, no line break, no sup/sub/span. |
| C07 | Copy / paste / duplicate | MATCHES | W9 keeps breakpoint and state rules. Cross-site NOT TESTED. |
| C08 | Context menu | NOT TESTED | Right-click not exercised. The Element actions menu was observed (W11). |
| C09 | Keyboard shortcuts | DIFFERENT | W18, E7 |
| C10 | Navigator tree | PARTIAL | Matches the DOM except component instances (children hidden; label "Card ◇"). |
| C11 | Undo / redo | MATCHES | W19 (session only, 100 steps) |
| C12 | Preview mode | PARTIAL | States and interactions run [B]. **Form missing**, heading colour differs. |
| C13 | Guides / X-ray / spacing | PARTIAL | View menu lists Snap guides, Spacing, Grid, Rulers, Badges, X-ray. Only the X-ray and grid toggles were measured. |
| C14 | Quick find | PARTIAL | ⌘K searches layers, pages and actions ("Add heading"). ⌘E unbound. Raw `&nbsp;` in a result. |
| S01 | Class-based styling | MISSING | W3 |
| S02 | Style panel sections | PARTIAL | Layout / Size / Spacing / Fill / Border / Typography, plus an Effects tab. No selector field. Custom properties NOT TESTED. |
| S03 | Breakpoint cascade | MATCHES | W4 cascade. The Esc revert can plant phantom overrides (P0-1). |
| S04 | States | PARTIAL | 5 states, working on canvas, Preview and published. focus-visible, visited, placeholder, checked and current are missing. |
| S05 | Inheritance indicators | PARTIAL | "Tablet · 1 override" and inherited values in fields. No per-field origin colours. Colour field shows 1a1a1a against computed #334155. |
| S06 | Style manager / unused classes | MISSING | INFERRED: classes carry no styles (W3). |
| S07 | Variables | PARTIAL | Brand tokens bindable (Primary / Secondary / Accent / Background). Creating variables and modes NOT TESTED. |
| S08 | Units & calc / var | PARTIAL | W7: rem / % / vw / auto work; calc dropped; no visible unit; no scrub. |
| S09 | Grid editor | PARTIAL | W6: tracks, rows, spans; no visual editor or areas. |
| S10 | Custom code / attributes | PARTIAL | Page head code works (W12). Attributes section and Embed element NOT TESTED. |
| S11 | Copy / paste styles | DIFFERENT | Buildrick has ⌘⌥C/V that respects the breakpoint (superset). |
| E01 | Element catalogue | PARTIAL | 53 elements, 8 blocks, 14 built-ins. No Box with a tag setting. Individual elements NOT TESTED. |
| E02 | Element settings | PARTIAL | Behaviour tab: CMS binding, per-breakpoint visibility, interactions, classes, attributes. ID / tag fields not checked. |
| E03 | Semantic tags & a11y | PARTIAL | H1–H6 level and alt text work. Form inputs ship without labels. Pre-publish "Image alt text" check. |
| K01 | Components create / instances | DIFFERENT | W11: push-from-instance, no master canvas |
| K02 | Props | MISSING | No props UI in the instance inspector (W11) |
| K03 | Slots | NOT TESTED | No slot UI seen; not searched for |
| K04 | Variants | NOT TESTED | A "Variant: Default" dropdown exists; nothing was created |
| K05 | Shared libraries | PARTIAL | Another site's component appears in a new site (scope UNCONFIRMED) |
| M01 | Collections & fields | PARTIAL | 9 field types; no reference, link, email, colour or file |
| M02 | Collection lists | PARTIAL | Binding works; published shows published items only; no filter, sort or limit |
| M03 | Template pages & bindings | MATCHES | The template is an existing page; the field binding works; the published item page carries the SEO pattern |
| M04 | Conditional visibility | NOT TESTED | A CMS "Conditions" section exists |
| M05 | References / multi-ref | MISSING | No reference field type |
| M06 | CMS editing | MATCHES | Record editor with Draft / Published; drafts are excluded from publish |
| M07 | CSV import / API | NOT TESTED | "Import CSV… / Import JSON…" menu present |
| P01 | Pages panel | PARTIAL | Add (Blank default [B]) and the page menu work; no folders |
| P02 | Page settings | MATCHES | W12 |
| P03 | Site settings | PARTIAL | The full-page Settings lists Domains, Redirects, Access (Pro), SEO, Custom code (Pro), Analytics, Form submissions. The bundle has `sitemap.xml` and `robots.txt`. The rest is NOT TESTED. |
| P04 | Assets panel | PARTIAL | W13 |
| P05 | Fonts | NOT TESTED | — |
| I01 | Interaction triggers | PARTIAL | W15: broad triggers; target "self" only observed |
| I02 | Timeline editor | MISSING | Presets with duration, delay and easing only |
| I03 | GSAP interactions | DIFFERENT | Own inline runtime; no timeline, stagger or split text |
| I04 | Lottie / Spline / Rive | NOT TESTED | Lottie appears in the catalogue |
| X01 | Publish flow | PARTIAL | Simulated only. Dialog, checks, progress and history work. The copy claims a connected Vercel account while simulating. |
| X02 | Backups / versions | MATCHES | W20 |
| X03 | Code export | NOT TESTED | (L walk: ⌘⇧E "Export site") |
| X04 | Hosting / CDN / SSL | NOT TESTED | Simulation only, by rule |
| X05 | Pre-publish audits | MATCHES | 12 checks (Vercel, pages, SEO, domain, empty pages, favicon, images, alt text, links, CMS templates, template pages, CMS bindings) |
| F01 | Forms | PARTIAL | W21 |
| T01 | Roles | NOT TESTED | "Your role: Owner · Permissions" seen in Settings |
| T02 | Page branching | NOT TESTED | No UI seen; not searched for |
| T03 | Comments | NOT TESTED | A topbar comment icon exists |
| T04 | Simultaneous editing | NOT TESTED | Collab flag not exercised |
| T05 | Edit mode for clients | NOT TESTED | "Review ›" exists |
| O01 | Ecommerce | NOT TESTED | — |
| O02 | Localization | NOT TESTED | Settings lists "Languages" |
| O03 | Apps / API | NOT TESTED | — |
| O04 | Analytics | NOT TESTED | Settings lists "Analytics" |
| O05 | AI features | DIFFERENT (by decision) | No AI calls observed in the editor (no `generateAltText`). The dashboard still offers "Generate with AI"; the empty-canvas copy says "describe your site". |

**Tally (65 IDs, counted from the rows above):**

| Verdict | Count | IDs |
|---|---|---|
| MATCHES | **10** | C04, C05, C07, C11, S03, M03, M06, P02, X02, X05 |
| PARTIAL | **27** | C01, C02, C03, C06, C10, C12, C13, C14, S02, S04, S05, S07, S08, S09, S10, E01, E02, E03, K05, M01, M02, P01, P03, P04, I01, X01, F01 |
| DIFFERENT | **5** | C09, S11, K01, I03, O05 |
| MISSING | **5** | S01, S06, K02, M05, I02 |
| BROKEN | **0** | No capability is broken as a whole. Broken sub-behaviours sit inside S03 / C02 (Esc revert), C01 (Tablet clipping) and C12 (Preview drops forms). |
| NOT TESTED | **18** | C08, K03, K04, M04, M07, P05, I04, X03, X04, T01–T05, O01–O04 |

---

## 4. Issues, ranked

**P0**

1. **Esc after Enter in an inspector field silently reverts a committed, saved edit, and the revert
   persists.** On a non-base breakpoint it also writes the old value as an explicit override, which
   stops the desktop cascade for that property and ships in the published `@media` block.
   - Repro: font-size 27 → Enter ("Saved") → wait 3 s → Esc → 44 → reload → 44.
   - Phantom rule: `@media (max-width:1023px){…tc1j6b{font-size:48px}}`.
   - Not undoable, no feedback. [A, re-confirmed B]

**P1**

2. **Classes carry no styles** (S01, S06): Webflow's core loop is absent. Styling is per-element through
   `[data-buildrick-id]` and `.buildrick-el-<id>` rules. [A]
3. **The Tablet canvas clips the top of the page, and it cannot be scrolled to** (`align-items:center` on
   a 1,048 px frame inside a 715 px box; first heading at y −30.5 at 1440×900). [A]
4. **Canvas and output disagree on text colour:** H2 is `rgb(51,65,85)` on canvas and `rgb(0,0,0)` in
   Preview and published; the inspector says `1a1a1a`. [A + B]
5. **Preview drops Forms entirely** (form, inputs and button absent from the srcdoc; present on canvas
   and in published HTML). [B]
6. **The Navigator hides component instance children** and labels instances "Card ◇" (C10). [B]
7. **Single-key shortcuts collide with Webflow's.**
   - S opens full-page Site Settings, D opens CMS, H opens History.
   - ↑ selects the previous sibling.
   - Enter does not edit, and 1–4 do nothing.
   - ⌘⇧P opens the palette instead of Preview.
   [B, E7]
8. **The CMS has no Reference / Multi-reference fields and no list filter, sort or limit** (M01, M02,
   M05). [B]
9. **`calc()` in spacing is silently discarded**, and spacing fields show no unit ("2" means 2rem). [A]

**P2**

10. **The class field accepts invalid names** (`9 Bad Name!` → three classes) and ships them; it has no
    autocomplete. [A]
11. **Enter and Shift+Enter always commit and exit text editing**: no line break possible. Insert link
    defaults to `target="_blank"`. [A]
12. **Simulated publish shows "connected Vercel project/account" and "Published — site is live".** The
    sitemap uses `buildrik-site-…vercel.app` with `.html` URLs. [B]
13. **A component created on another site appears in a fresh site's Saved components.** INFERRED scope
    leak, UNCONFIRMED. [A]
14. **Dragging a saved component from the Add panel inserted nothing** (2 tries; click works).
    UNCONFIRMED harness. [B]
15. **Interactions are preset-only** (no timeline, targets or stagger) (I02, I03). [B]
16. **Form inputs ship without `<label>`.** [B]
17. **Asset-level alt and element alt are independent.** A tiny PNG is converted to a larger WebP. [B]
18. **The command palette shows a raw `&nbsp;`** in a layer name. [B]
19. **Console noise:**
    - `StyleEngine.importStyles dropped 19 malformed rule(s)` on a brand-new site.
    - A React key warning in `RecordsTable`, which raises the dev "1 Issue" overlay.
    - An unexplained 404 on load.
    [A + B]
20. **No drag-scrub on numeric fields; no visual grid editor or areas** (S08, S09). [A]
21. **Paste goes in as the 2nd child of the selected container, not the last.** Click-add with a Section
    selected goes into its Container. [A / B]
22. **AI leftovers outside the editor:** the dashboard "Generate with AI" option, and the empty-state copy
    "or describe your site". [A]
23. **Visual glitches:**
    - The Components-panel master preview renders overlapping text.
    - Collection-list template items show "Drop a block here" text overflowing their image boxes on canvas.
    [B]

### Changed since the L walk (main → this branch)

- **Fixed, now matching Webflow:**
  - Units in spacing (W7).
  - Esc commits text (W8).
  - Insert link wraps the selection (W8).
  - Clear formatting (W8).
  - Preview hover state (W5; the base is no longer inline).
  - Preview plays interactions (W15 [B]).
  - The in-panel interaction Preview plays.
  - ⇧/ opens the shortcut sheet.
  - New page defaults to Blank (W12 [B]).
  - Push to master is restricted to the instance root (W11 [B]).
  - Paste styles writes the active breakpoint (W9 [B]).
  - Mobile inherits Tablet (W4).
- **Changed:**
  - Canvas base styles are now sheet rules, not inline.
  - No AI alt text on upload.
  - Asset click assigns to the selected image.
  - Grid has track, row and flow controls under More settings. The L walk saw columns only.
- **Unchanged:**
  - Create site stays on the list ([A]; [B] not verifiable).
  - Classes are inert.
  - Text colour differs between canvas and output.
  - The StyleEngine warning.

---

## 5. NOT TESTED / NOT VERIFIED, with reasons

- **W1 after BD-37:** the workspace is at its 3/3 site limit, and freeing a slot would mean deleting
  another agent's site.
- **Real Vercel publish, hosting, CDN, domains:** forbidden by rule. Every publish was a verified
  simulation (0 integrations, `PUBLISH_ALLOW_SIMULATION=true`).
- **Not exercised:** cross-site paste, right-click context menu, Embed / Custom element, custom
  attributes, fonts, Lottie, CSV import, conditions, variables creation and modes, props, slots,
  variants, page folders, password protection, code export, comments, roles, branching, collaboration,
  localization, ecommerce, apps, analytics.
- **Scroll-into-view on the published page from `file://`:** the animation had finished before the first
  sample. It was measured in Preview instead.
- **Responsive images / srcset** on uploaded assets.
- **Webflow side:** Enter, Shift+Enter and Esc-in-field semantics, and the undo depth, are not sourced in
  W-webflow-reference.md. Those comparisons are UNKNOWN, not "matches".
- **The canvas zoom auto-change** (100 → 88 → 61 %) was observed but not characterised.

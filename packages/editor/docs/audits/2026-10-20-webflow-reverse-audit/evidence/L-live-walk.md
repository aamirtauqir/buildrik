# L — Live runtime walk: "does it work like Webflow?" (2026-10-20)

**Harness.** Dashboard dev server, main checkout, `http://localhost:3310` (unified editor `/edit/<siteId>`).
Headless Chromium via the repo's `@playwright/test` (persistent profile, 1440×900), driven from a
scratchpad driver. Login: magic link minted with `scripts/baseline/.mint-magic.ts` for
`qa@buildrik.local` (userId `cmv8utrgt0000mo387bu4jgqa`), after clearing the `verifyMagicLink` rate-limit bucket.
Test site: **`audit1020-webflow`** (`cmvfrjygj000e135czkn8rzm8`), created in this walk. Measurements are DOM
reads (`getComputedStyle`, `cssRules`, `data-buildrick-id` tree). Prisma reads were used only to confirm
persistence and to pull the published HTML.

Screenshot dir (all paths below are relative to it):
`/private/tmp/claude-501/-Users-shahg-Desktop-pencil-buildrik-packages-editor/56bb4919-4be8-4b4f-9e42-32587e7a3d44/scratchpad/live/`

**Side effects outside the local DB (stating them up front):** W13 uploaded one 566 B PNG
(`u/cmv8utrgt0000mo387bu4jgqa/audit1020-red.png`) to the **real Vercel Blob store** configured by
`BLOB_READ_WRITE_TOKEN` in `.env.local`. That is the product's only upload path. The publish in W16 was a
simulation: before clicking I checked `workspaceIntegration` and found 0 active Vercel connections for the
workspace, and `PUBLISH_ALLOW_SIMULATION=true` is set. Nothing was deployed.

**Harness errors, caught and redone (rule 3):** (a) the Playwright MCP browser timed out on every
screenshot, so I swapped it for a headless driver; (b) `g.rail('Layers')` *closed* an already-open Layers
panel, so the first Layers drag actually landed on the canvas — I redid it with an "open only if closed"
helper; (c) the first heading click under Mobile fell under the tab bar ("Nothing selected"), so I redid
it with a viewport-clamped click; (d) in the New page dialog my first "Add page" click hit the tab-bar `+`.

---

## Verdict table

| # | Workflow | Verdict |
|---|---|---|
| W1 | Create site → editor | WORKS DIFFERENTLY |
| W2 | Add elements by drag-drop, Layers tree | WORKS LIKE WEBFLOW |
| W3 | Style via class / combo class | **BROKEN** (vs Webflow: classes do not carry styles) |
| W4 | Breakpoints and cascade | WORKS LIKE WEBFLOW |
| W5 | Hover state | WORKS DIFFERENTLY (canvas + published OK, **Preview mode BROKEN**) |
| W6 | Flex / grid layout | WORKS DIFFERENTLY (flex like Webflow; grid is column count only) |
| W7 | Box-model spacing | **BROKEN** (units are ignored; no drag-scrub) |
| W8 | Inline text edit, bold/italic/link | **BROKEN** (link); Esc throws away edits |
| W9 | Copy/paste/duplicate/delete/undo/redo | WORKS LIKE WEBFLOW |
| W10 | Reorder in canvas and Layers | WORKS LIKE WEBFLOW |
| W11 | Components, master edit, overrides | WORKS DIFFERENTLY |
| W12 | Pages, SEO, slug, switching | WORKS LIKE WEBFLOW (minor diffs) |
| W13 | Asset upload + alt | WORKS DIFFERENTLY |
| W14 | CMS collection, items, collection list | WORKS LIKE WEBFLOW in editor; published list empty (records were Draft, see below) |
| W15 | Interactions / animation | WORKS DIFFERENTLY (runs only in published output; **no preview path works**) |
| W16 | Preview + simulated publish, exported HTML | WORKS DIFFERENTLY (class-based CSS, but per-element generated classes) |
| W17 | Reload / autosave | WORKS LIKE WEBFLOW |
| W18 | Keyboard shortcuts | WORKS DIFFERENTLY (rich set, not Webflow's bindings) |

---

## W1 — Create site → open editor

- **Steps:** Sites → New site → name `audit1020-webflow` → "Start from Scratch".
- **What happened:** the dialog closed and a Draft card appeared, but the browser **stayed on `/dashboard/projects`**.
  My `waitForURL(/edit/)` ran out after 60 s. Opening the editor took a second click on the card's "Edit" link.
  `.bd-studio` mounted 25.9 s after `goto` (dev server, first compile, so not representative of production).
- **First load:** an empty-page CTA ("This page is empty" with SaaS / Portfolio / Agency cards, Browse all
  templates, Add a block, ✦ Describe your site, Start blank), a "Tip 1/4: Drag ⠿ to place an element" coach mark,
  the Add panel open with 53 elements, the inspector showing Page properties, and a "3/7" onboarding pill.
  Console: one warning, `[StyleEngine.importStyles] dropped 19 malformed rule(s)`, on a brand-new site.
- **Evidence:** `w1-01-new-site.png`, `w1-02-editor-first-load.png`.
- **Verdict: WORKS DIFFERENTLY.** Webflow opens the Designer straight after creation. Here "Start from Scratch"
  creates the site but drops you back on the list. The empty-state CTA is richer than Webflow's blank body.

## W2 — Add elements via drag-drop; Layers tree

- **Steps:** HTML5-drag (real mouse) Section → canvas, then Heading, Text, Button and Image into the section's Container.
- **What happened:** a Section drops **with a Container already inside it**
  (`section#…ff16qb > div#…9346rg`). Heading, Text and Button landed in the Container. The Image, dropped
  about 6 px above the container's bottom edge, landed in the **Section** instead (drop-zone precision, not a
  defect in itself). The Layers tree matched the DOM exactly:
  `1 Section / 2 Container / 3 Heading / 3 Lorem… / 3 Click Me / 2 Image`.
  Each drop raised a toast ("Section added · Undo"). Delete of the stray duplicate section worked.
- **Evidence:** `w2-00-dragging.png`, `w2-01-section-drop.png`, `w2-02-elements-added.png`, `w2-03-layers.png`.
- **Verdict: WORKS LIKE WEBFLOW** (Navigator equivalent). Difference: Section auto-wraps a Container.

## W3 — Style via class; second element with the same class; combo class

- **Steps:** select the heading → Behaviour tab → "CSS classes / Add class" → `hero-title`. Back on Style:
  font size 48, colour `#c81e1e`. Add a second H2 and give it `hero-title`, then `is-alt`.
- **Measured:**
  - The inspector has **no selector field**. Its only scope control is "State: Base / :hover / :focus / :active / :disabled".
  - Styles land as **element-level inline style** on the canvas: `style="font-size: 48px; … color: rgb(200,30,30)"`.
    No stylesheet rule mentioning `hero-title` exists (`cssRules` scan returned `[]`).
  - Second heading with `class="hero-title"`: **36px, rgb(51,65,85)**, so it **inherited nothing** from the
    48px red first heading.
  - "Add class" offered no autocomplete of the existing class (`[]` options after typing "hero").
  - Combo: `class="hero-title is-alt"` is accepted, but as a plain attribute with no styling semantics.
  - Published HTML: `hero-title` appears on the elements, and there is **no `.hero-title` rule** anywhere.
- **What the product offers instead:** "Text style" presets (Heading 1/2/3, Body…) tied to Brand tokens, "Copy
  style / Paste style (⌘⌥C/⌘⌥V)", and "Apply style to all H2 headings on this page" (a one-off bulk copy) in Element actions.
- **Side finding:** a fresh heading's inspector showed Colour `1a1a1a` while the computed colour was `rgb(51,65,85)` (#334155).
- **Evidence:** `w3-01-heading-selected.png`, `w3-03-behaviour.png`, `w3-04-class-added.png`, `w3-06-state-menu.png`,
  `w3-07-class-autocomplete.png`, `w3-08-two-classes.png`.
- **Verdict: BROKEN vs Webflow.** Webflow's core loop (style a class, every element with that class follows, combo
  classes for variants) does not exist. Classes are inert labels. Every element is styled on its own.

## W4 — Breakpoints and cascade

- **Steps:** View ▾ (bottom bar) → Breakpoint → Tablet (768) / Mobile (375) / Custom width. On Mobile, set heading font size 28, then go back.
- **Measured:** the canvas width was 768 on Tablet and 375 on Mobile. On Mobile the field showed **48 first** (inherited from desktop).
  After setting 28: computed 28px, and the inspector says "Mobile · 1 override". Tablet: field 48 / computed **48px**.
  Desktop: field 48 / computed **48px**, inline style still `font-size: 48px`. Stored as
  `@media (max-width: 767px) { [data-buildrick-id="…8f1ju6"] { font-size: 28px; } }` and persisted in
  `site.projectStyles` with `mediaQuery`. The published HTML at 375px wide computes 28px.
- **Evidence:** `w4-01-view-menu.png`, `w4-02-breakpoint-sub.png`, `w4-03-tablet.png`, `w4-04-mobile-28.png`, `w4-05-desktop-back.png`.
- **Verdict: WORKS LIKE WEBFLOW** (desktop-first cascade, overrides flow downward). Differences: the breakpoint
  switcher is buried in the bottom-bar View menu, not a top-bar device row, and there are only 3 fixed breakpoints plus custom width.

## W5 — Hover state

- **Steps:** select the button → State: :hover → Fill colour → Brand colour "Accent" (#15803D).
- **Measured:**
  - Rules created: `[data-buildrick-id="…641gps"]:hover { background-color: var(--…accent) }` plus a second
    `!important` copy (canvas only). Base stays Primary.
  - **Canvas:** hovering the button computes `rgb(21,128,61)`. Works.
  - **Preview mode (topbar Preview, iframe):** `:hover` matches = true, but background stays **`rgb(26,86,219)`**.
    The base `background-color` is an **inline style** on the button in the preview document, and the
    non-`!important` hover rule loses to it.
  - **Published HTML** (rendered from the job payload): base is in `.buildrick-el-…641gps{}` and hover computes
    `rgb(21,128,61)`. Works.
- **Evidence:** `w5-01-hover-state.png`, `w5-02-picker.png`, `w5-03-hover-set.png`, `w5-04-preview.png`, `w5-05-preview-hover.png`.
- **Verdict: WORKS DIFFERENTLY.** The state model is like Webflow, but **Preview mode does not show hover
  states** (defect: inline base style beats the hover rule). Preview is where Webflow users check hover.

## W6 — Layout: flex then grid

- **Steps:** Container → Display Flex → Direction Row → gap 24 → 3×3 align matrix centre. Then Display Grid → Columns 3.
- **Measured:** `display:flex; flex-direction:row; gap:24px; align-items:center; justify-content:center`. Grid:
  `display:grid; grid-template-columns: 312px 312px 312px; gap:24px`. Children gain "Column span / Row span" rows.
- **Evidence:** `w6-01-flex.png`, `w6-02-flex-gap-align.png`, `w6-03-grid.png`, `w6-04-grid-3col.png`.
- **Verdict: WORKS DIFFERENTLY.** The flex controls match Webflow, including the 3×3 alignment grid. Grid only
  offers a **column count**: no row definitions, track sizing UI, or visual grid editor/areas.

## W7 — Spacing box model

- **Steps:** second heading → type values into the margin/padding widget, then arrow keys, then try to drag-scrub.
- **Measured:**
  - Margin-top typed **`2rem` → computed `2px`**. The field kept showing "2rem" until reselect, then showed "2".
  - Padding-top typed **`10%` → computed `10px`**.
  - Padding-left `16` → 16px (correct).
  - Margin-left ↑ ↑ ⇧↑ → **12** (1+1+10). Arrow stepping works.
  - **Drag-scrub:** horizontal 40 px and vertical 40 px drags on margin-right left the value empty. Cursor is
    `text`, so no scrub affordance.
  - The widget has no per-side unit selector. Margin-bottom showed a token marker (◆ 20 = `--…space-5`).
- **Evidence:** `w7-01-spacing.png`.
- **Verdict: BROKEN.** Typed units are silently turned into px, and the field shows the unit that was not
  applied. Webflow accepts rem/%/vw/auto inline and supports drag-scrub.

## W8 — Inline text editing

- **Steps:** double-click heading → ⌘A → type → leave; double-click paragraph → select word → ⌘B, ⌘I → "Insert link".
- **Measured:**
  - Double-click enters `contentEditable` with the text selected. A typed edit **commits on click-outside**
    ("Build faster sites" persisted).
  - **Escape discards the edit**, twice reproduced: "Heading two" → Esc → "Heading".
  - A floating rich-text toolbar appears (Text style, Font size, B, I, U, S, lists, align, indent, text colour,
    highlight, Insert link, Clear formatting).
  - ⌘B → `<b>Lorem</b>`. ⌘I → `<b><i>Lorem</i></b>`. Both persisted through reload.
  - ⌘K inside text opens the **command palette**, not a link prompt.
  - **Insert link: three attempts with three selection methods** (JS range, double-click, ⇧→ ×5 with the
    selection confirmed as `"ipsum"`). Each time the selected text was **replaced by the literal URL as plain text**
    and **no `<a>` element was created** (`… https://example.com dolor …`). Undo restored the text each time.
- **Evidence:** `w8-01-heading-editing.png`, `w8-02-heading-committed.png`, `w8-03-para-selection.png`,
  `w8-05-link-ui.png`, `w8-06-link-applied.png`, `w8-07-link-attempt3.png`.
- **Verdict: BROKEN** (inline link). Webflow commits on Esc. Here Esc silently loses typed text.

## W9 — Copy/paste/duplicate/delete/undo/redo

- **Measured (element counts / ids):** ⌘D 8→9; ⌘C+⌘V 9→10; ⌘Z 10→9; ⌘Z 9→8; ⇧⌘Z 8→9; ⌘Z 9→8.
  - Style change undo: font size 60 → ⌘Z gives a snapshot identical to before (`styleUndoExact: true`, same class, style, parent, index).
  - Delete undo: Backspace then ⌘Z gives an **identical** snapshot (class `hero-title is-alt`, inline style, parent, index 1).
  - Deleting the button and the heading, then 2×⌘Z, restores both. The hover and media rules are still present
    (they also stay in `cssRules` while the element is deleted, as orphans).
  - Move undo: see W10 (canvas drag, ⌥↑).
- **Verdict: WORKS LIKE WEBFLOW.**

## W10 — Reorder by drag

- **Canvas:** dragging the button onto the heading's left side changed the order `8f1ju6,4vxk7v,641gps` → `641gps,8f1ju6,4vxk7v`, and ⌘Z restored it exactly.
- **Layers:** dragging the "Image" row to the bottom edge of "Click Me" moved `img#…4u10gh` from Section into Container (last child). The Layers levels updated.
- **Keyboard:** ⌥↑ moved the paragraph above the heading, and ⌘Z restored it.
- **Evidence:** `w10-01-canvas-dragging.png`, `w10-02-layers-dragging.png`, `w10-03-layers-after.png`.
- **Verdict: WORKS LIKE WEBFLOW.**

## W11 — Components

- **Steps:** select Section → Element actions → "Save as component…" → name "Hero Section", scope "This site" →
  Create. Add panel → Saved components → drag "Hero Section" onto the page. Then "Edit master".
- **Measured:**
  - The toast reads "Hero Section created as a component". The original section becomes the first instance, and the second instance renders a full copy.
  - The inspector shows "Component: Hero Section / Variant Default / Edit master". Layers labels instances "Section ◇", not by component name.
  - **"Edit master" does not open an isolated master canvas.** It opens a Components panel ("Master component ·
    Hero Section · 2 linked instances") with **"Update from selection…", Detach all, Duplicate master, Delete**.
    The workflow is: edit an instance on the page, select the instance root, then "Update from selection".
  - After editing instance 1's second heading to "Master edit" and pushing, **instance 2 updated** (`rcyblq = "Master edit"`, toast "2 linked instances updated · Undo").
  - Overrides: instance 2 then got its own edits ("Override B", "Master v2 title"). Pushing instance 1 again **kept both instance-2 edits**.
  - **Trap:** "Update from selection" uses whatever is selected. With a child heading selected, the dialog offered
    to replace the whole master with that heading ("2 instance(s) will change to match"). I cancelled.
- **Evidence:** `w11-01-save-component.png`, `w11-02-component-created.png`, `w11-04-instance-placed.png`,
  `w11-05-edit-master.png`, `w11-06-update-from-selection.png`, `w11-07-after-update.png`, `w11-08-override.png`.
- **Verdict: WORKS DIFFERENTLY.** Propagation and overrides work, but the master is changed by pushing from an
  instance, not by editing in place (Webflow). Two safety gaps: Update-from-selection accepts a non-root
  selection, and instance text edits do not propagate until pushed.

## W12 — Pages

- **Measured:**
  - The New page dialog **defaults to "From template"** (`aria-checked=true`). My first Create opened the Page templates gallery and **created no page**.
    With "Blank" selected explicitly, "About" was created and opened.
  - Page menu: Rename, Duplicate, Set as homepage, Replace layout with template, Copy link, **Page settings…**, Delete.
  - Page settings (SEO / Social / Advanced): slug `about-us`, meta title, description, indexing toggle, Google
    preview, and a 0–100 SEO score (40 → 90 after filling). Reopening showed all three values persisted.
  - Switching pages: About has 1 node (empty root) and Home has 15.
  - Published: `<title>About Buildrick audit — our story</title>` and `<meta name="description" …>`, file **`about-us.html`** (Webflow serves `/about-us`).
- **Evidence:** `w12-02-add-page.png`, `w12-03-about-created.png` (template gallery), `w12-05-dialog-blank.png`,
  `w12-07-page-menu.png`, `w12-08-page-settings.png`, `w12-09-seo-filled.png`, `w12-10-about-page.png`.
- **Verdict: WORKS LIKE WEBFLOW**, with friction from the template-first default and `.html` slugs.

## W13 — Assets

- **Steps:** Assets panel → file input → generated 64×48 red PNG.
- **Measured:** request chain: `media.uploadPrefix` → `POST /api/asset-upload` → `PUT vercel.com/api/blob` (200) →
  `media.createAsset` → **`media.generateAltText`** → `media.updateAsset`. The asset was listed as **`audit1020-red.webp`**
  (converted, 566 B). **Clicking the asset inserted a new Image element** (`img#…1jh2ai` at page root) with an
  **AI-written alt "A solid red background."**. I set alt to "Red audit swatch" in the inspector (`alt` read back), and the published HTML carries it.
- **Evidence:** `w13-01-assets.png`, `w13-02-uploaded.png`, `w13-03-asset-click.png`, `w13-04-alt-set.png`.
- **Verdict: WORKS DIFFERENTLY.** Upload and alt editing work. Differences: click-to-insert (Webflow drags from
  Assets or assigns to the selected image), and alt text is AI-generated automatically. That conflicts with the
  "no AI this version" owner decision for UI, though here it is a backend call.

## W14 — CMS

- **Steps:** CMS → Create a collection → name "Team", fields `title` (text) + `role` (text), "Generate a page per entry" on → Create.
  Add 2 records. Add panel → Collection list → drop on page → Behaviour → Collection = Team.
- **Measured:** the collection was created with 0 records. "+ Add record" opens a record form (title, role, slug "auto from name").
  Ada Lovelace / Engineer and Grace Hopper / Admiral were saved as **Draft**. The Collection list dropped with a template
  (`{{item.name}}`, `{{item.description}}`). After binding, the canvas list rendered **"Grace Hopper / Admiral / Ada Lovelace /
  Engineer"**: fields were auto-mapped by position (name→title, description→role) without a field-binding step.
  It persisted through reload.
- **Published:** the collection-list `div` is **empty** in `index.html`. The records were Draft, so this is probably correct
  (Webflow also omits drafts), but I did not verify that a *published* record renders.
- **Evidence:** `w14-01-cms.png` … `w14-11-list-bound.png`.
- **Verdict: WORKS LIKE WEBFLOW in the editor.** Published rendering is NOT VERIFIED (see the list at the end).

## W15 — Interactions

- **Steps:** heading → Behaviour → "+ Add interaction" → trigger "On scroll into view" → animation "Fade In Up" (0.3 s, delay 0) → "Preview".
- **Measured:**
  - The trigger catalogue is broad (hover, click, press, focus, page load/scroll/leave, scroll into view/while
    scrolling/out, mouse over/move/out, CSS entrance). There are 40+ animation presets.
  - Stored as `data-buildrick-interactions='[{"trigger":"scroll-into-view","animation":{"preset":"fadeInUp","duration":300,…}}]'`.
  - **In-panel "Preview" button:** rAF sampling over 1.5 s showed opacity `1` and transform `none` throughout, no
    attribute mutations, and no new animations. **Nothing plays.**
  - **Preview mode:** the iframe document has **zero `<script>`s**. Opacity stays 1 and `getAnimations()` returns 0. **Nothing plays.**
  - **Published HTML:** an inline runtime script is present. Rendered locally, opacity went 0 → 0.19 → 0.54 → 0.80 → 0.97 over 300 ms. **Works.**
- **Evidence:** `w15-01-add-interaction.png`, `w15-02-scroll-into-view.png`, `w15-03-after-preview.png`, `w15-04-preview-mode.png`.
- **Verdict: WORKS DIFFERENTLY.** Authoring works and the output runs, but **there is no way to see an interaction
  before publishing** (both preview paths are dead). Webflow previews interactions in-Designer and in Preview.

## W16 — Preview and simulated publish; exported HTML

- **Preview mode:** a full-screen overlay with an iframe, Desktop (≥1024) / Tablet (768–1023) / Mobile (≤767) switch, "Preview page", "Share preview".
  Escape closed it the first time. The second time (focus inside the iframe) it did not, and "‹ Back to canvas" was needed.
  Hover and interactions do not render in it (see W5 and W15).
- **Publish:** the dialog showed "Publish to production? Target: your connected Vercel project · 2 pages · ⚠ 7 warnings — none block".
  The copy says "connected" although the workspace has **no** Vercel connection (simulation). Publish now →
  `cms.publishSnapshot` → `sites.publish` → `publishStatus` → job COMPLETED. The steps were "Deploying to CDN: done" and "Verifying SSL: done"
  for a simulated deploy.
- **Exported HTML** (`PublishBuildJob.log.pages`, saved as `w16-published-index_html.html` / `w16-published-about_us_html.html`):
  - **0 `style=` attributes.** Every element gets a **generated per-element class** `buildrick-el-<id>` with a rule
    (e.g. `.buildrick-el-…8f1ju6{font-size:48px;…;color:#c81e1e}`).
  - User classes (`hero-title`, `is-alt`) are emitted with no rules. Hover and media rules use `[data-buildrick-id=…]` attribute selectors.
  - The `data-buildrick-*` attributes and the interactions JSON ship to production.
  - **Fidelity mismatch:** the second heading is `rgb(51,65,85)` on canvas but **`rgb(0,0,0)`** in Preview and in published output.
  - Also offered: Site menu → "Export site…" / ⌘⇧E ("Export site as HTML").
- **Evidence:** `w16-01-site-menu.png`, `w16-02-publish-ui.png`, `w16-03-after-publish.png`, `w16-04-published-render.png`, `w16-publish-payload.json`.
- **Verdict: WORKS DIFFERENTLY.** The output is real CSS in a stylesheet, not inline styles. But it is
  per-element atomic classes, not Webflow's author-named reusable classes, and the preview does not match the published output.

## W17 — Reload / autosave

- A full DOM, class, rule, computed-style and collection-list snapshot before and after `page.reload()` was **byte-identical** (`same: true`).
  Because the browser profile persists IndexedDB, I also checked the server. The `page` rows contain "Override B", "Master v2 title",
  `<b><i>Lorem`, `about-us` and `hero-title`, and `site.projectStyles` holds the media and hover rules. The topbar showed "Saved" throughout.
- **Evidence:** `w17-01-after-reload.png`.
- **Verdict: WORKS LIKE WEBFLOW.**

## W18 — Keyboard

The in-app sheet (⌘/) lists about 80 bindings (`w18-01-shortcuts.png`). Measured effects:

| Key | Result |
|---|---|
| ⌘K, ⌘⇧P | Command palette ✔ |
| ⌘/ | Shortcut sheet ✔. `?` (⇧/) did nothing, although the sheet lists it |
| ⌘E | nothing (Webflow: quick find / command) |
| ⌘⇧L | nothing |
| Esc | deselect ("Nothing selected"). In text edit it **discards** the edit |
| ← | select parent ✔ (paragraph → Container) |
| ↓ | next sibling ✔ (paragraph → button) |
| ⌥↑ | reorder up ✔, undoable |
| ⌘D / ⌘C / ⌘V / ⌘Z / ⇧⌘Z / ⌫ | ✔ (W9) |
| ⌘B / ⌘I in text | ✔ (W8) |
| ⌘= / ⌘- / ⌘1 / ⌘0 | zoom 150 / 100 / fit 82 / 100 ✔ |
| ⌘P | Preview ✔ |
| ⌘⇧E | Export site dialog ✔ |
| ⌘\ | toggle inspector ✔ |
| A / P / L / D | Add / Pages / Layers / CMS panels ✔ |
| ⌘H | opened a "Session" rail state (History), with no dialog |
| ⌘S, ⌘R, ⌘⇧X, ⌘; | no visible change measured (overlay toggles may be invisible in my state read; not confirmed) |

- **Verdict: WORKS DIFFERENTLY.** The set is broad and largely Figma-style. Webflow's ⌘E is unbound, and `?` does not work despite being documented.

---

## NOT TESTED / NOT VERIFIED

- **Tablet-only override** (only checked that Tablet inherits desktop and is unaffected by the Mobile override). Custom width not exercised.
- **Combo-class styling.** There is nothing to test because classes carry no styles.
- **Grid** row/track sizing and areas: no UI found beyond Columns and spans.
- **Drag-scrub** on fields other than the box widget.
- **CMS:** publishing a record (Draft → Published) and seeing it in published HTML. Dynamic per-entry pages
  ("Generate a page per entry" was on; I did not check whether a template page or URL was created). Field binding beyond the auto-map.
- **Interactions:** only scroll-into-view. Hover/click triggers and "Entrance animation" not run.
- **Real Vercel publish:** deliberately not done (simulation only, no connection exists). Share-preview links not opened.
- **Reload in a fresh browser context** (no IndexedDB). Persistence was confirmed server-side through Prisma instead.
- **⌘X cut, ⌘⇧V paste HTML, multi-select (⇧-click), ⌘G group, ⌘]/[ z-order**: not exercised.
- **Collaboration, comments (C), Review (R), History panel contents, Brand panel edits.**
- **Production-like performance.** The 25.9 s first load is a dev-server compile.

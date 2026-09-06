# Pages panel — redesign spec

The audit's summary names the gap precisely: *"this module manages pages as
records and not as a site — it can create a page but not make it reachable, it
labels a page Draft that the deploy ships, and the homepage is decided by list
position when nobody has chosen one"* (`UX-B-34`).

That is a taxonomy problem and a relationship problem. Rearranging the rows
would produce a tidier list of the same records.

**Three corrections to the audit before anything is drawn on them.** All three
matter for what gets drawn.

- `UX-B-01` says every page "wears a 'Draft' badge". **Nothing renders it.**
  `getStatusLabel(page.status ?? "live")` has one consumer, `PageRow.tsx:139`,
  and its output goes only into `ariaLabel` (`:141-149`). `.bd-pg-chip` exists in
  CSS (`PagesTab.css:282-302`) and in **no** `.tsx` file; two tests assert it is
  null (`PageRow.test.tsx:70`, `PagesTab.test.tsx:197`). Sighted users get *no*
  publication signal; screen-reader users get a wrong one. Worse than filed.
- `UX-B-05` says dragging a page to the top changes the site root. **It cannot.**
  `PageList.tsx:313-315` always passes a target id, and `reorderPage` reaches
  index 0 only with `afterId === null` (`PageManager.ts:342`). `UX-B-07`, in the
  same lane, says exactly this and is the row of record. The *delete* half of
  B-05 stands.
- `UX-B-32` says "the page list has no consumer that produces links at all."
  `LinkSection.tsx:85` reads `getAllPages()` and `:191` writes `#page:<id>` —
  that is a link producer, one element at a time. The true absence is that **no
  surface maps the page list to a link *set***, verified across 12 spellings and
  all 13 non-test `getAllPages()` call sites.

The panel is 280 wide (`--bk-size-drawer`, `tokens.generated.css:129`), 700 when
expanded, and its rows are a uniform **32px** (`PagesTab.css:13-14`, board 140:2,
pinned by `PagesTab.rowHeight.test.ts`). Everything below fits that or says it
does not.

---

## 1. What is actually wrong

| | |
|---|---|
| **A page with unset visibility is "Draft" to a screen reader and live to the deploy.** `usePages.ts:120` maps unset → `"draft"`; `isPageLive` returns true for `undefined` (`ExportEngine.ts:120-122`); the Publish panel counts by the same predicate (`usePublishSnapshot.ts:172`). Every page nobody has opened Advanced on — which is all of them — is announced wrong and shipped. | `UX-B-01` |
| **There is no control that sets Draft.** `AdvancedTab.tsx:24` renders exactly `["live","hidden","password"]`. `PageStatus` declares seven (`types.ts:9`) and `statusLabel.ts:13-21` has copy for all seven. So the state the panel names is one the user can neither reach nor leave, and "keep this out of the next publish" has to be spelled "Hidden". | `UX-B-02` |
| **The visibility control contradicts itself one line apart.** `AdvancedTab.tsx:49-56` says "Not published… left out of the deploy"; `:57-61` says "not linked in menus but reachable via direct URL" / "Visitors must enter a password". The exporter drops both kinds (`ExportEngine.ts:658`). A user reading the nearer sentence has shipped nothing. | `UX-B-24` |
| **Opening page settings and changing anything publishes the page.** `getPersistedState` seeds `visibility` as `password ? "password" : hidden ? "hidden" : "live"` (`usePageSettings.ts:103-104`) and `save()` writes it unconditionally (`:271`). The drawer autosaves 500ms after any change (`PageSettingsDrawer.tsx:40-45`). | `UX-B-03` |
| **The homepage is whichever row is first, and no row says so.** `resolveHomePageId = (pages.find(p => p.isHome) ?? pages[0])?.id` (`ExportEngine.ts:145-146`); `PageManager.ts:243` is the only writer of `isHome` and `createPage` (`:61-93`) never sets it; the roof glyph draws only on `page.isHome` (`PageRow.tsx:231`). So a site with no explicit home looks like a site with no homepage — and deleting the first page silently moves the root. | `UX-B-05` |
| **The one drag that would change the homepage is impossible.** Every drop is insert-after (`PageList.tsx:313-315`); the engine's prepend (`PageManager.ts:342`) has no caller. The top slot is unreachable. | `UX-B-07` |
| **Dragging shows nothing.** `.bd-pg-drop-indicator` renders on every list (`PageList.tsx:155`, `:351`) and `.show` — the class that makes it visible (`PagesTab.css:319`) — is added by nothing. No insertion line, no target highlight; the row just jumps. | `UX-B-06` |
| **Delete never counts what points at the page.** Links are `#page:<id>` (`LinkSection.tsx:191`); `resolveHref` falls back to `"index.html"` for an unresolvable id (`ExportEngine.ts:801-802`); the dialog says only "This page and everything on it is removed" (`PagesTab.tsx:329`). Sharper than filed: `pageHrefs` is built from the **live-filtered** set (`:705`, `:788`), so a link to a *hidden* page becomes a link to Home too. | `UX-B-04` |
| **Adding a page does not make it reachable.** The navbar block is a fixed HTML string of four `href="#"` links (`Navbar.tsx:17`). `propertiesRegistry.ts:1037` declares `"navbar.menuItems": { type: "menuEditor" }` and no component renders that type. The "Set as homepage" toast — *"Your navigation menu may need updating manually"* (`usePages.ts:308-312`) — tells the truth about work that has no tool. | `UX-B-32` |
| **"+ Add page" can create a duplicate name at a duplicate URL.** Default name is `Page {count+1}` (`pageUtils.ts:16-20`); `addPage` passes it straight through (`usePages.ts:176-198`); `createPage` performs no uniqueness check (`PageManager.ts:61-93`). The only duplicate check is on **rename** (`PagesTab.tsx:99-105`). And the exporter silently dedupes the collision to `page-3-2.html` (`ExportEngine.ts:789-795`) — a URL the user never chose and never sees. | `UX-B-13` |
| **Rename never changes the URL, and one screen says it will.** `commitRename` writes `{ name }` only (`usePages.ts:213-222`); the tab-bar popover computes and displays `/{slug}` (`PageTabBar.tsx:328-332`) and submits the name alone (`:139-145`); `seoScore.ts:24` then penalises the page for its `page-\d+` slug. | `UX-B-08`, `UX-B-09` |
| **A duplicate slug starts a toast that will not stop.** The autosave effect's dependency array is `[s.isDirty, s]` and `usePageSettings` returns a fresh literal every render (`:363`), so the refusal toast re-renders the form and restarts the 500ms timer. Roughly twice a second, forever. | `UX-B-10` |
| **The settings modal has no visible exit.** 580×520 centred card (`PagesTab.css:562-576`), autosaving, so no Save either; its own docstring says *"There is no ✕"* (`PageSettingsDrawer.tsx:8-10`). Escape and the scrim are the only ways out and neither is labelled. | `UX-B-14` |
| **Saving page settings deletes SEO fields the form does not draw.** `save()` writes a fresh `seo` object of seven fields (`usePageSettings.ts:274-282`); `PageManager.ts:156` merges one level above, so `settings.seo` is replaced whole. `canonicalUrl`, `structuredData` and the four `twitter*` fields (`project.ts:233-248`) are gone, and none has an input anywhere. | `UX-B-23` |
| **The SEO Title field is a default presented as a value.** Pre-filled from `page.name` (`usePageSettings.ts:107`) and written by the first save (`:275`). After that, renaming the page no longer changes the search title. | `UX-B-22` |
| **Folders are a private browser view drawn as site structure.** `localStorage` key `pg-folders-v1-<siteId>` (`useFolders.ts:24-30`), never in the project; delete is one unconfirmed click and is outside undo — under a panel whose delete copy promises ⌘Z brings things back. | `UX-B-17` |
| **The collection's generated pages are invisible here.** `usePages.ts:103` lists only `getAllPages()`. A site can publish forty URLs this panel has never heard of, and their template is a free-text path typed in a modal (`CMSCollectionSetupModal.tsx:440`). | `UX-B-25`, `UX-C-19` |
| **Two page managers with different safety on the same verbs.** The canvas tab bar hides Delete at one page (`PageTabBar.tsx:406`); the panel disables it with a reason (`PageContextMenu.tsx:99-106`). "Set as home" from the bar skips the external-page guard and the navigation warning the panel raises (`PageTabBar.tsx:207-210` vs `usePages.ts:294-324`). The two delete confirmations word the same consequence differently. | `UX-B-15` |
| **Bulk actions report the wrong thing, or nothing.** Five deletes raise five toasts each carrying its own Undo, all of which undo all five (`PagesTab.tsx:188-192`, `usePages.ts:279-289`) — while the dialog correctly promises one undo (`:345-347`). Bulk duplicate reports nothing at all (`PagesTab.tsx:151-154`). | `UX-B-11`, `UX-B-12` |
| **The slug change knows both URLs and sends the user out of the product.** `SeoTab.tsx:298` says "Consider setting up a redirect in your hosting settings" — while `SettingsTab.tsx:87` ships a Redirects screen and `PageManager.ts:133-141` already records `slugHistory`, which nothing reads. | `UX-B-16` |
| **Switching pages leaves the inspector editing the page you left.** Nothing clears the selection on `PAGE_CHANGED` (`PageManager.ts:222-236`); `SelectionManager.clear()` (`:103`) is called by nothing on a page switch. | `UX-B-28` |

**The thesis:** a page in this panel has a name and a position, and nothing else
that is both true and visible. Its publication state is announced to screen
readers and contradicted by the deploy. Its address is decided by a field the
rename flow refuses to touch. Its role as homepage is decided by list order.
Its inbound links are counted nowhere and silently rewritten at export.

This is not a list that needs richer rows. It is a **page manager that does not
model the two things a page has — a publication state and a set of
relationships — so every screen downstream has to guess.**

---

## 2. The structural fix, before any pixels

### 2.1 One publication state, and it is the deploy's

Today there are three vocabularies for one fact:

| Vocabulary | Values | Who writes | Who reads |
|---|---|---|---|
| `PageStatus` (display) | 7 — live, draft, scheduled, hidden, password, external, error | nothing (derived at `usePages.ts:120`) | an aria-label |
| `settings.visibility` (stored) | 3 — live, hidden, password | `AdvancedTab.tsx:24` only | the exporter |
| `isPageLive` (truth) | 2 — ships / does not | — | export, publish count, `pageHrefs` |

**Collapse to what the deploy does, with four states and one writer:**

| State | Stored | Row says | Deploy |
|---|---|---|---|
| **Will publish** | `visibility: "live"` or unset | nothing — the default is silent | ships |
| **Draft** | `visibility: "draft"` *(new)* | `Draft` | dropped |
| **Hidden** | `visibility: "hidden"` | `Won't publish` | dropped |
| **Password** | `visibility: "password"` | `Won't publish` | dropped |

`scheduled` and `error` are deleted — nothing writes them and no schedule exists.
`external` is not a publication state at all; it is a different kind of row (a
link, not a page) and keeps its own glyph, which `PageRow.tsx:242-245` already
draws.

Two consequences that are not cosmetic:

- **Draft becomes reachable**, so "keep this out of the next publish" stops being
  spelled "Hidden" — which the same screen says means something else
  (`UX-B-02`, `UX-B-24`).
- **`visibility` is written only when the Advanced control is used.** Seeding it
  as `"live"` and saving it on every autosave is what publishes a page during a
  typo fix (`UX-B-03`).

### 2.2 One homepage, chosen or declared

`isHome` is flagged at creation for the first page, so `resolveHomePageId`'s
`pages[0]` fallback stops being the product's actual behaviour. Until it is, the
row that is *acting* as home carries the glyph with an explicit qualifier —
because a site whose root is decided by list order must say so before delete or
reorder changes it (`UX-B-05`).

### 2.3 A page's relationships, shown where they are changed

Three relationships exist in the data and appear on no screen:

| Relationship | Lives in | Shown |
|---|---|---|
| pages that link **here** | `#page:<id>` hrefs across all pages | nowhere — and the exporter silently re-points them at Home (`UX-B-04`) |
| this page's **previous URLs** | `page.slugHistory` (`PageManager.ts:133-141`) | nowhere — and the SEO tab sends the user to their host instead (`UX-B-16`) |
| pages **generated** from a collection | server-side, at publish (`cms.service.ts:229-247`) | nowhere in Pages (`UX-B-25`) |

Each is surfaced at the moment it becomes load-bearing: inbound links in the
delete confirm, previous URLs at the slug change, generated pages as a read-only
group in the tree.

---

## 3. The panel

Drawn at 280, with the board's 32px rows intact. Nothing below adds a second
line to a row.

```
┌─ Pages ──────────────────────────── 280 ─┐
│ Pages                       ⌘K  ⤢   ✕    │
├──────────────────────────────────────────┤
│ [ Search                    ]  Listings ›│
├──────────────────────────────────────────┤
│ ⌂ Home                              ⋯    │  32h · glyph = serves /
│   About                             ⋯    │  32h · silent = will publish
│   Pricing                Draft      ⋯    │  32h · right slot, muted text
│   Careers          Won't publish    ⋯    │  32h · hidden or password
│   Page 3                  ● ⋯            │  ● = unsaved (exists today)
├──────────────────────────────────────────┤
│ ▾ FROM BLOG                    12  ⓘ     │  read-only group (new)
│   /blog/{slug} · template: Blog post     │
├──────────────────────────────────────────┤
│ ▾ MARKETING                      4  ⋯    │  folder — labelled below
│   Landing A                         ⋯    │
├──────────────────────────────────────────┤
│ + Add page      From template       ⋯    │
└──────────────────────────────────────────┘
```

**The right-hand slot already exists.** `PageRow.tsx:290-300` reserves it for the
search-context tag and the dirty dot, after a `flex: 1` spacer. The publication
word lands there, as muted text, **only on the exception** — a page that will
publish says nothing, because that is the answer for almost every row and a
label on every row is noise that stops being read.

**This is a visual addition and the board does not have it.** Board 140:2 draws
rows with no chips, and two tests pin that (`PageRow.test.tsx:70`,
`PagesTab.test.tsx:197`). Per the founder's precedence rule — behaviour to the
code, everything visual to the board — **this needs 140:2 redrawn before it is
built.** What must not happen is the current compromise, where the fact is
carried by an aria-label alone; that is not a board-compliant row, it is an
invisible one. The `.bd-pg-chip` CSS stays dead either way: the proposal is one
muted word in an existing slot, not the seven-colour chip set.

**Folders say what they are.** One line under the group header, once: *"Folders
are yours only, on this browser."* They are `localStorage`, per site, invisible
to a teammate (`UX-B-17`) — and a group drawn like site structure that is not
site structure is the more expensive lie than an ugly caption.

**FROM BLOG is read-only and marked so.** It is the first place in the product
where a user can see that publishing this site emits twelve URLs the page
manager does not own (`UX-B-25`). The `ⓘ` states the template page by name —
which is also the argument for making `pageTemplatePath` a picker rather than
free text (`UX-E-22`).

### Delete, with the relationship it breaks

```
┌─ Delete "Pricing"? ──────────────────── 420 ─┐
│  This page and everything on it is removed.  │
│                                              │
│  ⚠ 3 links on 2 pages point here.            │
│    They will be left broken, not             │
│    redirected to Home.        See them ›     │
│                                              │
│  Undo (⌘Z) brings it back.                   │
│                    Cancel   [ Delete page ]  │
└──────────────────────────────────────────────┘
```

The count is computable from the same `#page:<id>` hrefs the exporter resolves
(`ExportEngine.ts:801`). "Left broken, not redirected" is the second half of the
fix and belongs to the exporter: silently re-pointing an orphaned link at
`index.html` is what makes this invisible until the site is live.

---

## 4. Interaction detail, where the audit found a specific failure

- **Drag draws where the drop will land.** The indicator element and its `.show`
  rule already exist (`PagesTab.css:319`, `PageList.tsx:155`); dragover adds the
  class at the computed position. And the position depends on where in the row
  the pointer is — above the midpoint inserts *before*, which is the only way the
  first slot becomes reachable (`PageManager.ts:342` already accepts
  `afterId === null`).
- **Rename offers the URL it implies.** For any page whose slug was never
  hand-edited — the engine already tracks `slugManuallySet`
  (`PageManager.ts:145`) — the rename commit offers "also change the URL to
  /pricing?" inline. The tab-bar popover must either write the `/{slug}` it
  displays or stop displaying it (`UX-B-09`).
- **A slug change on a published page offers the redirect, not an errand.**
  "Add a 301 from /old-url to /pricing", pre-filled, writing through the
  Redirects screen that already ships (`RedirectsScreen.tsx:62-75` collects
  exactly from / to / 301|302). The source is `slugHistory`, which is recorded
  and read by nobody.
- **Nothing autosaves into a state the save will refuse.** The slug error already
  renders beside the field; the save waits for it to clear and says nothing. The
  toast is what turns one bad keystroke into a loop (`UX-B-10`).
- **One toast per user action.** Five deletes → "5 pages deleted · Undo", which
  is what the confirm dialog already promises. Bulk duplicate toasts its count,
  selects the copies and scrolls the first into view (`UX-B-11`, `UX-B-12`).
- **The settings modal gets a labelled exit.** An autosaving form still needs a
  "Done" the user can aim at; Escape and a scrim are not affordances
  (`UX-B-14`).
- **One page-actions menu, used by both surfaces.** The panel's context menu is
  the implementation; the canvas tab bar composes the same one, so the
  external-page guard, the navigation warning and the delete copy cannot drift
  (`UX-B-15`).

---

## 5. What this does NOT do

- **No new status chip system.** `.bd-pg-chip` and its seven colours stay dead.
  The proposal is one muted word in the row's existing right-hand slot.
- **No new Listings table.** Board 141:207's four columns (`PAGE / TITLE / DESC /
  SCORE`) stay as they are; this spec does not add a publication column there.
  It does ask for **one** SEO score (`UX-B-19`) — the table's penalty model and
  the drawer's additive model are two definitions of one number, and the fix is
  to delete one, not to design a third.
- **No new redirects screen.** `RedirectsScreen` ships and collects the right
  three fields; this spec adds a caller, not a surface.
- **No navigation builder in this panel.** `UX-B-32` is real and is a *canvas and
  inspector* problem — the `menuEditor` control type is declared with no renderer
  (`propertiesRegistry.ts:1037`). What Pages owns is the per-page fact ("show in
  nav") and the visibility of which pages nothing links to. Building the editor
  itself belongs to whoever owns the navbar element.
- **No trash / recently-deleted.** `UX-B-31` is a real gap and a history-model
  decision (one editor-wide stack, `HistoryManager.ts:129`), not a Pages layout
  one. Naming inbound links at the confirm is the part this panel can honestly
  do.
- **No new folder persistence.** Either folders move into the project or they are
  labelled as a private view. This spec picks the label, because moving them into
  `ProjectData` changes the save schema and is a separate change.

---

## 6. Acceptance

Each is observable, and the ones about what a user sees must be observed at
1440×900, not read off the component.

1. Create a page and publish. What the row says about the page and what the
   deploy does with it **agree** — for a page nobody has opened Advanced on.
2. There is a control that puts a page into Draft, and a page in Draft is not in
   the published output.
3. Open page settings on a Draft page, change the meta description, close.
   The page is **still Draft**.
4. Every page whose visibility is not `live` reads the same way in the Advanced
   helper text as it behaves in the deploy — one sentence, not two opposite ones.
5. On a site where nobody chose a homepage, the row that serves `/` is marked as
   such, and deleting it warns before the root moves.
6. A page can be dragged into first position, and during the drag an insertion
   line shows where it will land.
7. Delete a page that three links point at: the dialog names the count before the
   button, and after deleting, those links are broken rather than silently
   pointing at Home.
8. "+ Add page" twice on a site with a deleted page produces two rows with
   different names and different URLs.
9. Rename a page whose slug was never hand-edited: the URL is offered, and
   whichever screen displays a URL writes the one it displayed.
10. Type a duplicate slug: the error appears beside the field and **no toast
    fires** — verified by watching for 10 seconds, which is 20 toasts today.
11. Save page settings on a page carrying an imported `canonicalUrl`: the value
    survives.
12. A site with a page-generating collection shows its generated routes in the
    Pages tree, named, with the template page identified.
13. Switch pages: the inspector is empty, not editing something off-screen.

### The code fixes this design cannot honestly paper over

Items 1–4 depend on **the visibility model**, in three places at once:
`usePages.ts:120` (display default), `AdvancedTab.tsx:24` (the three-value
control), and `usePageSettings.ts:103-104,271` (seeded and written
unconditionally). Until those agree with `ExportEngine.ts:120-122`, no row
treatment can be truthful, and this spec should not be drawn as though it can.

| # | Fix | Where |
|---|---|---|
| 1–2 | Add `draft` as a real visibility; delete `scheduled`/`error` from `PageStatus`; derive the row's word from `isPageLive`, not from a display default | `types.ts:9`, `usePages.ts:120`, `AdvancedTab.tsx:24`, `statusLabel.ts:13-21` |
| 3 | Seed `visibility` as unset and persist it only when the Advanced control is used | `usePageSettings.ts:103-104`, `:271` |
| 4 | Delete the contradicting per-option helper | `AdvancedTab.tsx:57-61` |
| 5 | Flag `isHome` at creation, or mark the positional home | `PageManager.ts:61-93`, `ExportEngine.ts:145-146` |
| 6 | Pass `afterId: null` on an above-midpoint drop; add `.show` on dragover | `PageList.tsx:313-315`, `PagesTab.css:319` |
| 7 | Count inbound `#page:` hrefs before the dialog; stop rewriting orphaned links to `index.html` | `ExportEngine.ts:801-802` (and `:788`, which does this to hidden pages too) |
| 8 | Route `addPage` through the uniqueness helpers `duplicatePage` already uses | `usePages.ts:176-198`, `PageManager.ts:460-475` |
| 9 | Write the slug the rename implies, or stop displaying it | `usePages.ts:213-222`, `PageTabBar.tsx:139-145,328-332` |
| 10 | Hold the autosave while the form is invalid; drop the refusal toasts | `PageSettingsDrawer.tsx:40-45`, `usePageSettings.ts:248-261` |
| 11 | Merge the `seo` object instead of replacing it | `usePageSettings.ts:274-282`, `PageManager.ts:156` |
| 12 | List generated routes; make `pageTemplatePath` a picker over real pages | `usePages.ts:103`, `CMSCollectionSetupModal.tsx:440`, `cms.service.ts:229-247` |
| 13 | Clear the selection on `PAGE_CHANGED` and on delete of the owning page | `PageManager.ts:222-278`, `SelectionManager.ts:103` |
| — | One SEO score, one definition | `SearchListingsTable.tsx:39-61` vs `seoScore.ts:28-39` |

Two things this spec explicitly leaves open rather than drawing over:

- **Board 140:2 has no publication signal on the row.** The proposal above needs
  the board redrawn. Building it without that amendment breaks the precedence
  rule and the two tests that enforce it.
- **`SlugChange` drifts from its own schema.** `PageManager.ts:135` writes
  `{ slug, changedAt }` and `shared/types/project.ts:197-202` declares the same,
  but `shared/schemas/project.ts:30` declares `{ slug, timestamp }`. That schema
  is used only by `CollaborationManager.ts:746` today, so nothing is broken now —
  but the redirect proposal in §4 makes `slugHistory` load-bearing, and the two
  shapes must be reconciled before it is.

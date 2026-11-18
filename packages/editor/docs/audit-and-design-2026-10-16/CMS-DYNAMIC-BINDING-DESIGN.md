# Design: CMS dynamic binding — full dynamic system (BD-20 / FD-DYN-01)

Origin: /office-hours 2026-10-16 · Detailed design 2026-10-17 · Branch: main @ `19f964d5e`
Status: **SPEC COMPLETE (written scope below) · not VERIFIED** (independent review §19.1: first pass PROPOSAL with B1–B6, all resolved; second pass G1–G7/G9 PASS, G4 specification-only, G8 NOT RUN). Direction approved (D1 = C); D2–D6 and D9 user-decided; D7 deferred / D8 browser script (user 2026-10-17). **Nothing implemented. No runtime check run.** Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).

**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): P10, P11, P1 (non-goal wording), plus SC-23 precedence; gap rows D1-5, D1-15, CS-15. Round 2: Q12 (CMS › Data › Sources ship this version, persisted — spec in Panel 07 §10.1; consumed by Conditions here) *(R-1018b)*. Panel 00 **SC-20/21/22 and SC-23 (2026-10-18)** also override this doc where they differ *(R-1018)*.

**SC-11 naming (2026-10-17):** in UI copy, "template page" / "Create collection page" / "Edit template" read **"collection page" / "Create collection page" / "Edit collection page"** (Panel 00 SC-11). This doc keeps its original wording for traceability; Panels 06/07 carry the renamed copy.

Mode: DESIGN ONLY (documentation; no app code, data, Figma or deploy). Change class: **C3** (Inspector Content, Add, CMS workspace, canvas toolbar, Layers, export/publish output).
Parent records: [PRODUCT-DESIGN-BRIEF.md](PRODUCT-DESIGN-BRIEF.md) BD-20, FD-INS-02 (Content tab), INS-D06, INS-F11 · [REMAINING-IA-HANDOFF.md](REMAINING-IA-HANDOFF.md) §3.1 BD20-IA01–06 (destinations are fixed there; this doc fills their interiors) and GEO-01 (geometry).

---

## 1. Problem and users

**Primary user:** designer/freelancer building client sites (office-hours D, 2026-10-15) — the same primary user as [panels/00-STRATEGY.md](panels/00-STRATEGY.md) §1, which governs; roles are access levels, not personas *(R-1018, D1-5)*. **Jobs:** a blog, team/profile pages, a restaurant menu, a portfolio — any site where the same layout repeats over many items.

**Job statement:** "I keep my content in a sheet (collection). I design one page or one card. Buildrick fills it from every row, lists rows where I want, filtered and sorted, links each card to its page, and shows or hides parts by the row's data — identically on canvas, preview and the live site."

**Non-goals in this design:** visitor login/member-only pages (D7), server-rendered personalisation (D8 option B), live CMS data without republish, binding colours/typography from records (Brand owns those), form recipients/submissions, e-commerce storefront (deferred — owner P1, 2026-10-18 *(R-1018)*), multi-reference fields (P11), per-record history (P10).

Frequency/benefit statements below are **hypotheses**; no user research was run.

## 2. Evidence baseline (source-read 2026-10-16/17; runtime NOT RUN)

| Area | What exists | Evidence | Gap for this feature |
|---|---|---|---|
| Single binding UI | Inspector **Behaviour › CMS binding**: Source Static/From CMS → Collection → Field (filtered by type) → Record (only outside list/template) → preview "value (record i of n)", Open record, Unbind (keeps visible text) | `editor/inspector/sections/CmsBindingSection.tsx:47-311` | One fixed property per element (`image→src`, `link→href`, else `content`); 6 types; reference field not bindable (`:57-61`) |
| Engine allowlist | `content, src, href, alt, title` | `packages/shared/schemas/sites.ts:179`, `RepeaterRenderer.writeBoundValue` | alt/title unreachable from UI |
| Record context | inside list → each copy's record; on template page → page record; else pinned record | `CmsBindingSection.tsx:153-167` | Kept as-is (it is correct) |
| Collection list | Add catalog block "Collection list" (3-col grid, one card with `{{item.name}}`); Inspector Collection + Show items limit + Open collection; stored `status published|draft|all`, `repeat self|children` | `sidebar/tabs/build/catalog/catalog.ts:35-41`, `CollectionListSection.tsx:64-96`, `CMSBindingManager.ts:55-72` | No filter/sort (a `CMSQueryOptions` type exists unused, `shared/types/cms.ts:82-89`); no pagination; empty list leaves empty container |
| References | `reference` field (single), record picker, `{{item.ref.field}}` in lists, publish includes target collection | `ReferenceField.tsx`, `RepeaterRenderer.ts:337-379` | No multi-reference; not bindable in Inspector |
| Dynamic pages | CMS ⋯ → Dynamic pages: pick existing page as template (home refused), URL pattern `/menu/{slug}` with validation, SEO title/description patterns, "Generate N pages" (applies on next publish) | `editor/cms/DynamicPagesPane.tsx:43-233`, `server/services/cms.service.ts:237-242, 891-933, 1033-1074` | No "create template page"; one template per collection; no og:image |
| Canvas preview | `useCMSPreview` resolves bindings; single bindings show published only, first published record; lists show drafts | `editor/canvas/hooks/useCMSPreview.ts:59-145` | No canvas record switcher; inconsistent draft rule |
| Markers | Selection badge "Element has CMS binding"; Inspector header chip `Collection.field` (red "· missing"); Layers "CMS" tag only with display setting; context menu "Bind to CMS field…" | `SelectionBoxOverlay.tsx:405-423`, `StatusMarks.tsx:59-79`, `LayerTreeItem.tsx:132-149`, `elementActions.ts:201-212` | Kept; extended |
| Conditions | CMS → Data › Conditions (rail CMS drawer; code tab id `content`): pick element, one `path op value` expression; UI ops `== != > < >= <= contains exists empty` (engine also evaluates startsWith/endsWith, `DataManager.ts:244-247`); sets `data-condition-hidden` | `ContentViews.tsx:649-771`, `DataManager.ts:450-520` | **No consumer of the attribute → never hides.** CMS fields not offered; AND/OR type without UI |
| CMS → Data | Sources (pasted JSON, one source per top-level key, **in memory only — lost on reload**, INV B31), Variables `{{site.key}}` (project settings) | `ContentTab.tsx:103-137`, `engine/data/DataManager.ts:47, 315`, `useContentPanel.ts:156-163`, `rail/tabsConfig.ts:231-236` (labelled CMS) | Kept in place (D13); Sources become persisted and ship this version (owner Q12) — Panel 07 §10.1 *(R-1018b)* |
| Pre-publish | warnings: missing template, template pages not published, empty bindings; **fail**: list without collection | `server/services/publish.service.ts:158-225` | Extend |
| Permissions | CMS reads: site access; writes: EDITOR+. Element writes: `canWrite` lock gate | `server/trpc/routers/cms.ts:36-50`, `commandOperations.ts:213` | No CMS role gating in UI |
| Geometry tokens | rail 60, drawer 280, inspector 300, topbar 56, footer 32, row 32/28/40 | `themes/tokens.generated.css:127-152` | GEO-01 selected values (rail 56, Add/Layers 284, canvas toolbar 44) govern the redesign |

## 3. Decisions

| ID | Decision | Authority |
|---|---|---|
| D1 | Full dynamic system (option C), phased | User 2026-10-16 |
| D2 | Elementor-level sources: CMS + site + page + date + URL parameter + cookie; visitor/member data waits for D7 | User 2026-10-17 |
| D3 | Condition false → element **rendered hidden** (stays in HTML) | User 2026-10-17 |
| D4 | Record-page link with no dynamic page → disabled with reason + **Create collection page** | User 2026-10-17 |
| D5 | Canvas shows published by default; **Show drafts** toggle; drafts never in output | User 2026-10-17 |
| D6 | Rich text into a heading/inline target → plain text + "Formatting removed" chip | User 2026-10-17 |
| D9 | **All three creation ways** ship: (1) bind icon on existing elements, (2) drag/insert a field from Add, (3) generate template page / list card automatically | User 2026-10-17 ("3no tareeqa rakhoo") |
| D13 | CMS → Data (the former sidebar "Content" view, same place, unchanged) keeps Sources/Site variables and becomes the read-only Conditions index; element bindings live on their property rows and conditions in Inspector Content | User 2026-10-17 |
| D7 | **Visitor login / member tags: DEFERRED.** Member group in the source picker stays hidden; revisit as a separate members feature | User 2026-10-17 ("jo tumhari recommendations hein un per hi kam karna hai") |
| D8 | **Live sources (URL parameter, cookie, current date) run in a small published browser script**; static hosting unchanged; no server rendering | User 2026-10-17 (same instruction) |
| D10–D12 | Designer-selected below (pagination, nesting depth, multi-reference); reversible, flagged in §16 | Designer-selected, confirmed under the owner's 2026-10-17 instruction |

## 4. Mental model and vocabulary (shown in UI copy)

| Term (UI) | Meaning | Lives in |
|---|---|---|
| **Collection** | A sheet of content (Blog, Team, Menu) | CMS |
| **Field** | A column (title, photo, category) | CMS → Fields |
| **Record** | A row (one post) | CMS → Records |
| **Collection page** | One designed page; publish makes one page per published record | Pages + CMS → Dynamic pages |
| **Collection list** | A container that repeats its card once per record | Canvas element; Inspector Content |
| **Binding** | "This property shows that field" | The property's own row in its owning Inspector tab; Content holds the read-only Dynamic bindings summary |
| **Condition** | "Show this element when …" | Inspector Content → Conditions |
| **Dynamic source** | Where a value comes from: this page's record, list item, a chosen record, Site, Page, Date, URL, Cookie | Source picker |

One-sentence rule printed in the empty state of the bind picker: **"Binding needs no special block. Repeating needs a Collection list. One page per record needs a Collection page."**

## 5. Ownership contract

| Value / action | Value owner | Canonical UI | Secondary entries | Permission | Reset / undo | Commit boundary |
|---|---|---|---|---|---|---|
| Schema, records, draft/published | Site CMS (server) | CMS workspace | Open record › from Inspector, canvas | Read: site access; write: EDITOR+ | **No per-record history this version** (P10): record recovery = Undo toast, CMS › Recently deleted (SC-15) and the conflict field diff (S6); **not** document Undo *(R-1018, D1-15)* | Server mutation receipt |
| Template link, URL pattern, SEO patterns, og:image | Collection (server) | CMS → collection → Dynamic pages | Pages row "Template · N pages", Inspector page context link, Create collection page (D4) | EDITOR+ | Field-level revert in pane; not document Undo | Owner Save in pane |
| Property binding | Element in document | The property's existing row (Content; Behaviour › Link for URL/new tab/Link to; Style for background) + read-only Content summary | Context menu "Bind to CMS field…", Add → CMS fields (creates element+binding), template generator | Document edit (`canWrite`) | Unbind (keeps shown value); 1 Undo step | Document history + save |
| Collection list source/filter/sort/limit/pagination/empty | List element in document | Inspector Content → Collection list | Add → "List of {collection}" | Document edit | Each change 1 Undo step | Document |
| Condition / class toggle | Element in document | Inspector Content → Conditions | CMS → Data → Conditions (read-only index + Locate, BD20-IA02); Layers marker | Document edit | Remove condition; 1 Undo step | Document |
| Device visibility (static) | Element | Inspector **Behaviour → Visibility** (unchanged) | — | Document edit | Existing | Document |
| Sources, Site variables | Sources: **site (server)**, ⛔ Source persistence (Q12) *(R-1018b)* / Site variables: project settings | CMS → Data (Sources spec: Panel 07 §10.1) | Source picker lists Site variables; **Conditions** rule field lists Sources (§7.1) *(R-1018b)* | Sources: EDITOR+ (server) / Variables: existing | Sources: Undo toast + CMS › Recently deleted (SC-15, Panel 07 §10.1) / Variables: existing | Sources: explicit Save, server receipt / Variables: existing |
| Canvas record switcher, Show drafts | **Editor view preference** (not authored) | Canvas toolbar → View group | — | Any viewer | n/a — never dirties document | Session |

Rule: **one writer per value**. The template generator and Add → CMS fields only *create* ordinary elements + bindings through the same binding command; they are not second editors.

## 6. Integration decision

| Approach | Task fit | Density/canvas | Navigation cost | Decision |
|---|---|---|---|---|
| Current: one Behaviour section, one fixed property | Cannot bind alt, button href, card link; conditions elsewhere and broken | Small | Binding far from the property it changes | **Replace** |
| A: dedicated "Dynamic" Inspector tab | All dynamic settings together | 5th tab breaks FD-INS-02 4-tab closure; separates value from its property | Switch tab to see what a field does | Reject |
| B: bind only from CMS workspace ("drag field to element") | Data-first | No Inspector cost | Leaves canvas for every bind; weak for existing designs | Reject as sole path |
| **C: property-level bind on the property's own row (Way 1) + Add → CMS fields (Way 2) + generators in CMS/Add (Way 3)** | Binding beside the property it changes; insertion in Add; whole-page creation in its owner | Inspector width unchanged (300); Add gains a contextual group only when context exists | Exact return to origin row everywhere | **Choose** |

Panel changes:
- **Inspector Behaviour › CMS binding section is retired as a section**; its capabilities move to the owning property rows (§8.1) plus Content's summary/groups (map §15). Behaviour keeps static link, playback, device visibility.
- **Inspector Behaviour › Link** and **Style › Fill (background image)** gain the same bind icon / bound-row / subview on their existing rows (no static control moves).
- **Inspector Content** gains: bind icon on its eligible rows, bound-row variant, Binding subview, Dynamic bindings summary, **Collection list** group (for list elements), **Conditions** group (all elements, last before Advanced).
- **Add panel** gains contextual **CMS fields** group (top, only with context) and "List of {collection}" entries under the existing Collection list block.
- **CMS → Dynamic pages** gains **Create collection page**, og:image pattern, "Pages generated" summary.
- **Canvas toolbar View group** gains **Record** switcher + Show drafts (only on template pages / when lists exist).
- **Pages (bottom bar manager)** shows template rows as "Template · N pages".
- **Layers** always shows small bound and condition markers (no longer gated behind a display setting — markers are 12px glyphs, not row tint; the tint stays optional).

## 7. Dynamic sources

### 7.1 Source picker (shared by bind, condition, filter)

Popover anchored to the bind icon or rule field. **280w, max-height min(420, viewport−96), search sticky, one scroll.** Groups appear only when available, in this order:

```
[ Search fields…                ]
THIS PAGE'S RECORD · Blog          ← only on Blog template page
  T title   🖼 photo   📅 date   ↗ author › (name, photo, bio)
LIST ITEM · Blog                   ← only inside a Blog Collection list
  …same field rows…
A SPECIFIC RECORD                  ← elsewhere; next step picks collection → record
SITE        Site name · Site URL · Site variables › 
DATA SOURCES  opening_hours › · price_table ›        ← Conditions rule field only (R-1018b, Q12)
PAGE        Page title · Page URL · Page description
DATE        Current year · Today (formatted)        [Live in browser]
URL         URL parameter…                           [Live in browser]
COOKIE      Cookie…                                  [Live in browser]
MEMBER      (reserved — shown only after D7)
```

- Each row: type glyph + field name + type label ("Text", "Image"). Incompatible fields for this property are **listed disabled with reason** ("Image can't fill text") at the end of their group, not hidden, so users learn why.
- Reference fields expand one level (`author › name`) — **D11: one level deep** in v1, matching `{{item.ref.field}}`.
- Placement: opens **to the left of the Inspector, over the canvas**, top-aligned to the anchor row; flips upward at the viewport bottom; never covers the Inspector's own tab strip. Non-modal; outside click/Escape closes.
- Keyboard: arrows move, Enter selects, Right/Left open/close a reference, Escape closes and returns focus to the bind icon.
- Empty state (no collections): rule sentence (§4) + **Create collection** (opens CMS create, returns here).
- **Data sources group** *(R-1018b, owner Q12)*: persisted Sources (Panel 07 §10.1) are listed **only in the Conditions rule field** — the one consumer that exists today (legacy `sourceId.path` rules). Objects expand one level per step (`opening_hours › sunday`); a list source shows as one row usable with **is set / is empty**. The group is not offered in property bind or list source/filter: binding properties to Source paths has no UI today (`DataManager.bindVariable` uncalled) and needs an owner decision (§18).

### 7.2 Static vs live sources

| Group | Resolved when | Canvas shows | Output |
|---|---|---|---|
| Page record, list item, specific record, Site, Page, Site variables, **Data sources** (pasted JSON, server copy — Panel 07 §10.1 *(R-1018b)*) | **Publish time** (baked, as today: `cms.publishSnapshot` server-first) | Real value from previewed record | Static HTML |
| Date (current), URL parameter, Cookie | **In the visitor's browser** (D8) | Editable sample value with "Sample" tag; settable in the bind subview | `data-*` instruction + published runtime script |

### 7.3 D8 dependency
**D8 decided (2026-10-17): browser script** (kept). D8 covers only Date / URL parameter / Cookie; CMS › Data › Sources are static pasted JSON resolved at publish and never fetched at runtime, so they are not "Planned" and do not wait for P4b *(R-1018b, Q12)*. Live sources ship in phase P4b with the published runtime script; until P4b is implemented the group shows disabled rows labelled **"Planned"** (no fake behaviour; one "not built yet" label, CS-15 *(R-1018)*). **Security copy, shown in the Conditions group when a live source is used:** "Hidden content is still in the page source. Don't use conditions to protect private information."

## 8. Way 1 — bind an existing element (Inspector Content)

### 8.1 Eligible properties (bind icon appears on these rows)

| Element family | Bindable properties | Accepted field types | Phase |
|---|---|---|---|
| Heading, Text, Paragraph, Label, Rich text | Text | text, long text, number*, date*, datetime*, option(s), email, url, slug, reference›text; rich text (full into Rich text/Paragraph; **stripped per D6** into Heading/Label/inline) | P1 |
| Link, Button | Text (Content row); Link URL, Open in new tab (**Behaviour › Link row**, per BD20-IA01); Title (Content) | URL: url, email (→`mailto:`), file, **text (accepted today — kept; URL-validated, warning chip "Not a valid URL" when a record's value fails)**, slug→**This record's page**; new tab: boolean | P1 |
| Container, Section, Card, Div (link-capable) | **Link to** (Behaviour › Link row: record page / URL field); Title (Content) | slug/record → record page; url; text (as above) | P1 |
| Image | Source; Alt text; Title | src: image, file, url · alt/title: text-like | P1 |
| Video, Audio | Source; Poster (video) | file, url · poster: image | P4 |
| Video/Map embed | URL | url | P4 |
| Any container | Background image (bound row and Binding subview in **Style › Fill**, back "‹ Back to Style"; the Content summary only lists and links it — Panel 06 C10) | image, file, url | P4 |
| Any element | CSS class toggle (in Conditions group) · `data-*` attribute (Advanced attributes) | condition grammar · text-like | P4 |
| Input, Select | Default value · Options from collection | text-like · collection | P5 (only if requested) |
| Template page (page context) | SEO title/description/og:image → **link to CMS Dynamic pages** (no second writer) | — | P4 |

\* number/date fields show a **Format** control (§8.3).

**Where the bind icon lives (BD20-IA01):** on the property's *existing* row, in whichever tab already owns it — Content for text/source/alt/title/semantic fields, **Behaviour › Link** for URL/new tab/Link to, Style for background image, Advanced attributes for `data-*`. Static editing of those properties does not move. Content additionally shows a read-only **Dynamic bindings** summary at its top when the element has any binding: one line per binding ("Link URL · Blog › This record's page  ›"); clicking a line opens that row in its owning tab. Conditions and Collection list are Content-owned groups (§11–12).

### 8.2 Row anatomy (Inspector 300w fixed)

Unbound row: `Label | input …… [🗄][↺]` — bind icon gets **its own 24×24 target (inside the 32px-high row, GEO-01 control minimum unchanged) in a trailing slot, left of the existing reset/source control, which stays exactly where FD-INS-02/GEO-01 put it** (no reset relocation). The input shrinks by 28px (24 + 4 gap); rows whose input would fall below its control minimum wrap the input to a second line rather than clipping. Accessible name "Bind {property} to dynamic data". Tooltip same. Visible only if any source is available (collections exist or page/list context exists); otherwise hidden, and Content shows nothing new.

Bound row (replaces the input; row height grows 32→48):
```
Title text
┌────────────────────────────────┐
│ 🗄 Blog · title            ⋯ │   ← chip, click opens Binding subview
│   "Biryani recipe" · Post 3/20 │   ← resolved value + record being previewed
└────────────────────────────────┘
```
Chip menu ⋯: Change field · Open record › · Unbind. Chip colour = existing accent-tint token; error variant = existing danger token + text, never colour only.

### 8.3 Binding subview
Opens inside the tab that owns the row (subview whose back label names that origin: `‹ Back to Content`, `‹ Back to Behaviour`, `‹ Back to Style`), keeps the 4-tab strip and target header visible; one body scroll.
```
‹ Back to Content  Heading · Title text
Source     [ 🗄 Blog · title      ▾ ]   (opens picker)
Record     This page's record · each page shows its own   (or picker when pinned)
Format     [ As written ▾ ]   (date: 17 Oct 2026 / 2026-10-17 / Oct 17 · number: 1,234 / 1234 / 1.2k · option(s): comma list)
If empty   [ show text…             ]  (fallback; for URL/src: "remove link/image")
Preview    "Biryani recipe"   ⚠ Formatting removed (D6, when applicable)
[ Unbind — keep "Biryani recipe" ]
```
- Commit: picking a source = 1 Undo step ("Bind title"). Format/fallback commit on change/blur, 1 step each (coalesced while typing).
- Unbind writes the currently shown value as static content (existing P-2 behaviour) and says so; if shown value is empty, button reads "Unbind — leave empty".
- Back restores the origin row focus and scroll.

### 8.4 Element header and Content summary
When an element has ≥1 binding, the Inspector header chip (existing `StatusMarks`) reads `🗄 2 bindings` (or `Blog.title` for one); click → opens the **Content › Dynamic bindings summary** (the index), whose lines open each row in its owning tab (Panel 06 A5). Content tab label gets no badge (avoid duplicate counts — brief: override info already shown 5×).

## 9. Way 2 — insert a field from Add (Add panel)

**Group "CMS fields"** at the top of Add (284w panel), shown only when an insertion context has a record source:
- active page is a template page → "Blog fields · this page's record";
- selection/insertion target is inside a Collection list → "{Collection} fields · list item".
Otherwise the group is absent (Add unchanged).

```
CMS FIELDS · Blog (this page's record)
  T  title          → Heading
  ¶  excerpt        → Paragraph
  ≡  body           → Rich text
  🖼  photo          → Image
  📅  date           → Text (formatted)
  ↗  author › name  → Text
  🔗  This record's page → Link button   (lists only)
```
- **Drag** onto canvas, or **click/Enter = insert** into current insertion target (non-drag alternative, WCAG 2.5.7). Insertion uses the existing insertion-target rules and nesting validation.
- Field type → element map (designer-selected): text → Text, except the collection's **title/name field → Heading (H2 in lists, H1 on template)**; long text → Paragraph; rich text → Rich text; image → Image (alt auto-bound to the title field if present — both bindings are created by the same insert, removed by its single Undo step, and counted in the header chip "2 bindings"); date/datetime/number → Text with default Format; url/email/file → Link; reference → Text bound to the referenced record's name field; option(s) → Text; **boolean and color are not inserted** — boolean rows read "Use in a condition" and open Conditions for the selection.
- Result: element inserted, selected, Inspector opens **Content** with the new bound row **highlighted**; keyboard focus stays in Add for repeated inserts (Panel 06 A7). One Undo step removes element + binding.
- Styling comes from Brand text styles (no inline styling invented).

## 10. Way 3 — generate automatically

### 10.1 Create collection page (CMS → collection → Dynamic pages; also offered by D4 and at collection creation)
Dialog (720w / 480 / 960 per GEO-01 import/export dialog rules):
```
Create collection page for Blog
URL            /blog/{slug}          (validated by existing pattern rules)
Include        ☑ photo (Image) ☑ title (Heading H1) ☑ date ☑ author › name ☑ body (Rich text) ☐ featured (boolean — condition only)
Layout         ( • ) Article   (  ) Profile   (  ) Simple
               preview thumbnail of the generated structure
[Cancel]                                   [Create page]
```
- Creates: a new page "Blog template" (document operation: page + bound elements) **then** saves the collection's template link and pattern (server). Order and failure: if the server save fails, the page remains, the pane shows "Page created, link not saved — Retry"; Retry re-sends only the link. No silent half-state; no duplicate page on retry.
- On success (entry from CMS): opens the new page in Editor with a `Back to CMS · Dynamic pages` return frame (NAV-01), canvas toolbar shows **Record: Post 1 ▾**, selection none, Pages shows "Blog template · Template · 20 pages".
- Layout presets (designer-selected): Article (image, H1, meta row, rich body), Profile (round image, name H1, role, bio, nested list slot), Simple (fields as label/value rows). Built from existing blocks and Brand styles.
- Home page is never offered (server refusal kept).
- **Entry from D4** (card's Link to row): the same dialog opens **modally over the Editor**; on success the user **stays on the origin page with the origin Link to row focused**, the row now offers "This record's page", and a toast offers **Open collection page**. Cancel returns focus to the row unchanged. (Entry from CMS → Dynamic pages opens the new page, as above.)
- **Undo boundary:** document Undo removes the generated page only; the collection's template link is server-owned and survives. The CMS pane and the pre-publish check then show **"Collection page missing — Choose page / Create collection page"** (extends the existing missing-template warning). No silent dangling link.

### 10.2 List of {collection} (Add)
Under the existing **Collection list** catalog block, Add shows one entry per collection: "List of Blog", "List of Team". Insert → list bound to that collection, card generated: image (if image field), title (Heading H3), first long-text/excerpt, date meta; **card links to "This record's page"** if the collection has a dynamic page, otherwise no link and the card's Link to row shows D4 state. Default: limit 6, sort newest, 3 columns (existing grid block). The generic "Collection list" block stays for blank lists (preserved).

### 10.3 Conversions are ordinary content
Everything generated is ordinary elements + ordinary bindings — editable, deletable, re-bindable with Way 1. There is no "generated" lock or regeneration that overwrites user edits.

## 11. Collection list (Inspector Content → Collection list group)

Shown when the selected element is a Collection list (or its card template child: header shows "Inside list of Blog · Edit list ›").

```
COLLECTION LIST
Source      [ Blog ▾ ]              Open collection ›
Filter      ┌ featured ▾ ┐
            │ is       ▾ │  ✕       (rules stack vertically, same builder as §12.1)
            │ Yes      ▾ │
            └────────────┘
            + Add filter            Match [All ▾]
Sort        [ date ▾ ]                 (field and direction stack at 300w)
            [ Newest first ▾ ]   + then by
Show        [ 6 ] items   Skip [ 0 ]
Pages       ( • ) Show first N only  (  ) Split into pages: /blog/page/2 …   (D10)
When empty  ( • ) Show "No items" block   (  ) Hide list
Status      Published (drafts follow Show drafts on canvas only)
```
- **Filter rules** share the condition grammar (§12.2). Value may be a literal or **"This page's record"** (e.g. `author = this page's record`, `category = this page's category`) — enables author pages, category pages, related posts. "Exclude this page's record" toggle for related lists.
- **Sort**: any sortable field (text A→Z, number, date, boolean); up to 3 keys; ties by updatedAt desc (matches server default `orderBy updatedAt desc`, `cms.service.ts`).
- **Skip (offset)**: for "latest post big, rest small" layouts.
- **D10 pagination (designer-selected):** static pages `/listing-page/page/N` generated at publish, with Previous/Next link elements the user can bind (`Next page URL`, `Previous page URL`, `Page N of M`). Default off. Load-more (needs runtime) is excluded.
- **Empty block**: a real child slot "No items" (editable, styled) instead of today's empty container; canvas shows it when the filter returns nothing, with a canvas notice "0 of 20 records match this filter".
- Canvas: first copy is editable template (existing), other copies are inert clones (existing). Status line under the list on canvas (editor only): "Showing 6 of 14 · filter: featured".
- Each change = 1 Undo step. Output: identical filter/sort/skip/limit applied server-side at publish (snapshot) — acceptance T-DYN-07.
- **Status alignment (D5):** the stored list `status` (`published|draft|all`, honoured today by local export, `RepeaterRenderer.ts:155-159`) no longer decides drafts: canvas follows Show drafts; every export/preview/publish path outputs published only. Old `draft|all` values are read and ignored for output, with a one-line note in the list group ("Drafts now show only on canvas").
- **D10 pagination validation:** allowed only on non-template pages (a list on a template page cannot paginate — option disabled with reason); generated `/…/page/N` paths are checked against existing page paths and dynamic-page patterns before publish; collisions are a pre-publish **fail**.

## 12. Conditions (Inspector Content → Conditions group)

### 12.1 Layout (300w; rules stack, never 3-in-a-row)
```
CONDITIONS
Show this element when  [ All ▾ ] of:
┌ featured        ▾ ┐
│ is              ▾ │
│ Yes             ▾ │  ✕
└───────────────────┘
+ Add rule
──────────
Add class [ is-sold-out ] when  …same builder…   (P4)
Editor: ◻ Hidden on this record — showing as ghost
```
- Default when added: one rule, `All`. One level of All/Any (**no nested groups in v1**, the stored `LogicGroup` type can carry more later).
- Field input = same source picker (§7.1), so CMS, Site, Page, live sources all work.
- Operators by type (value control in brackets):

| Field type | Operators |
|---|---|
| text, long text, rich text, email, url, slug | is set · is empty · is · is not · contains · doesn't contain · starts with · ends with [text] |
| number | is set · is empty · = · ≠ · > · ≥ · < · ≤ [number] |
| date/datetime | is set · is empty · is before · is after · is on [date or "today"] · is within last/next [N days] |
| boolean | is Yes · is No |
| option | is · is not · is one of [option chips] |
| options (multi) | contains · doesn't contain *("contains any of" hidden this version — P11, R-1018)* |
| reference | is · is not [record picker or "this page's record"] · is set · is empty |
| image/file | is set · is empty |
| URL parameter / cookie | is set · is empty · is · contains [text] |

### 12.2 Editor behaviour
- Element whose condition is false on the previewed record renders as a **ghost**: 40% opacity + dashed outline + corner tag "Hidden by condition" (editor-only overlay; tokens: existing border/subtle text — no new hex). It stays selectable and editable. Never removed.
- Canvas View → **Show hidden elements** (default on) toggles ghosts off to see the true result.
- Layers row shows a condition glyph ◐ (accessible name "Has visibility condition"); dimmed text when hidden on the previewed record.
- Device visibility (Behaviour → Visibility) is a separate, static rule; both must pass. Content's Conditions group shows a one-line cross-reference when device visibility is also set.

### 12.3 Output (D3)
- Conditions resolvable at publish (CMS/Site/Page) → element written with the `hidden` attribute where false (stays in HTML per D3). Inside lists, evaluated per copy.
- Live-source conditions → element written with a `data-` rule and `hidden` default per rule's initial state; runtime script (D8) evaluates on load. No flash of hidden content: initial state = hidden until evaluated, when rule depends on live sources.
- Class toggles: class added at publish (static sources) or by runtime (live sources).

### 12.4 Legacy conditions — preserved, never auto-activated
Existing CMS → Data conditions are persisted element data bindings (`DataManager.bindCondition`, `data-condition-hidden`). Opening a project **never rewrites them and never changes published output**:
- An adapter **reads** each legacy entry and shows it in Inspector Conditions as a rule in state **"Not active — from old Conditions"**, with path mapped for display (Site variable `site.x`, data-source path, or "Custom path" verbatim). The raw legacy binding is kept untouched until the user acts.
- **Activate** (per rule) writes the new condition and removes the legacy one in one Undo step; **Keep inactive** leaves it as-is. Publish output for an inactive legacy rule is unchanged (element shown), exactly as today.
- CMS → Data → Conditions becomes the read-only **index** (BD20-IA02): every condition by page/element with state (Active / Not active — review), **Locate** opens the exact Inspector rule with origin return. No second writer.
- A site-level **pre-publish warning** lists "N old conditions not active — Review", so the user learns this without selecting each element.
- Persisted Sources (Panel 07 §10.1, owner Q12) **are** evaluable at publish from the server copy; a legacy `sourceId.path` rule maps to the Data sources group and activates normally *(R-1018b)*.
- Rules whose source cannot be evaluated at publish (Custom path; a Source that is deleted or whose path no longer exists) are allowed to be activated only with the warning **"Can't be checked on the live site — element will always show"**; their output is shown (no `hidden`).

## 13. Record previewing (canvas toolbar)

On a template page or a page with lists, the canvas toolbar **View** group adds:
```
Record [ Biryani recipe ▾ ]  ◂ ▸     ☐ Show drafts
```
- Template page: switches which record the page previews (search, list of published records; drafts appear when Show drafts is on, marked "Draft").
- Non-template page with lists: only **Show drafts** appears.
- **Show hidden elements** appears whenever the current page has ≥1 condition (any source), independent of template/list context.
- View preference only: does not dirty the document, no Undo entry, remembered per page for the session.
- At canvas column <720 (GEO-01 two-row toolbar) the record control moves into the View menu as "Previewing: Biryani recipe".
- Inspector bound rows and the record line in chips follow the switcher (single source of truth for "previewed record"), replacing today's separate "first published" rule. A **pinned specific record** binding (outside template/list) is unaffected by the switcher.
- D5 applied to single bindings too: canvas shows the draft record only when Show drafts is on (fixes today's list/single inconsistency).

## 14. States, permissions, recovery

| State | Where shown | Message / action |
|---|---|---|
| Loading records | chip value line skeleton | — (never blank as "empty") |
| Load failed | chip error variant | "Couldn't load Blog — Retry" (binding kept) |
| Collection deleted | chip error | "Blog was deleted — Choose source" (existing Reconnect) |
| Data source deleted *(R-1018b)* | condition rule chip error | "{Source} was deleted — Choose source" (Restore in CMS › Recently deleted clears it); element publishes shown |
| Data source path missing / changed type *(R-1018b)* | condition rule chip error | "{path} no longer exists — Choose field" / "{path} is now {Type} — Choose field" |
| Field deleted / type changed incompatibly | chip error | "title no longer exists / is now Image — Choose field" |
| Record missing or unpublished (pinned) | chip warning | "Post 'X' isn't published — nothing shows live" + Open record › |
| Legitimately empty | chip info | "Empty — showing fallback" |
| Rich text stripped | chip info | "Formatting removed" (D6) |
| Live source | chip tag | "Live in browser · sample: …" |
| No dynamic page for record link (D4) | Link to row disabled | "Blog has no page per record." [Create collection page] |
| Multi-select | bind icons disabled | "Bind one element at a time" (no primary-only writes) |
| Locked element | bind icons disabled | existing lock reason |
| Viewer role | Existing viewer Inspector body applies (INS-D03 "Role denied"); chips appear read-only only where that body already shows the property; no binding editor exposed (Panel 06 C4) | — |
| CMS-only error (EDITOR missing for create template) | dialog | "You need Editor access to create pages for this collection" |
| Async result after selection change | discarded | results pinned to origin element+property (INS-F11) |
| Template / list with 0 records (or 0 published, Show drafts off) | canvas toolbar switcher; chips; Pages row | Switcher: "No published records — Add record › · Show drafts"; chips show `{title}` field-name placeholder in muted style; Pages row "Template · 0 pages"; list shows its empty block |
| Previewed record deleted / unpublished mid-session | switcher | Falls back to first available record + inline notice "Post 'X' is no longer available — showing 'Y'"; no document change |
| Template link points to deleted page | CMS Dynamic pages, pre-publish | "Collection page missing — Choose page / Create collection page" (§10.1) |
| URL-validated text field fails for a record | chip warning | "Not a valid URL on 2 records — those links are removed live" (Open records ›) |

Failure never clears a stored binding; repair = choose a compatible source.

## 15. Preservation map (old → new)

| Existing capability | Old entry | New entry | Disposition |
|---|---|---|---|
| Static/From CMS source toggle | Behaviour › CMS binding | Bind icon / Unbind on the property's own row (Content, Behaviour › Link, Style) | Redesign (same data) |
| Existing text-field → `href` bindings | field list accepts text for href | Still accepted; URL-validated with warning chip | Keep |
| Collection + field pick (type-filtered) | same | Source picker, incompatible listed disabled | Redesign |
| Record pick outside list/template | same | Binding subview "Record" | Move |
| Context record rules (list / template / pinned) | engine + section | Unchanged rules; shown in subview "Record" line | Keep |
| Preview value "record i of n" | section | Chip value line + canvas Record switcher | Redesign |
| Open record › | section | Chip menu + subview | Move |
| Unbind keeps visible value | section | Chip menu + subview button | Keep |
| Source missing + Reconnect | section | Chip error + Choose source | Keep |
| "+ New collection…" in binding | section | Picker empty state → Create collection | Move |
| Header chip `Collection.field` / missing | StatusMarks | Same chip, count when >1 | Keep |
| Context menu "Bind to CMS field…" | element actions | Opens Content → first eligible row's picker | Keep (retarget) |
| Selection badge on canvas | overlay | Keep | Keep |
| Layers CMS tag (display setting) | Layers | Glyph always; tint stays optional setting | Redesign |
| Collection list block | Add catalog | Kept + "List of {collection}" entries | Keep + extend |
| List Collection / Show items / Open collection | Inspector section | Content → Collection list group | Move |
| List status published/draft/all (stored) | engine only | Status line; canvas drafts via Show drafts | Keep data; Redesign UI; **Fix:** local export now published-only for old `draft|all` lists (§11) |
| `{{item.x}}`, `{{item.ref.field}}`, index/isFirst/isLast/total/url tokens | text placeholders | Kept for compatibility; new elements use bindings | Keep |
| Dynamic pages pane (template, pattern, SEO, Generate N) | CMS ⋯ menu | CMS → Dynamic pages tab (visible per REMAINING-IA-HANDOFF §1 item 1 and module record IAF-07) + Create collection page, og:image | Keep + extend |
| Preview saved record (read-only template preview) | Record sheet | Keep | Keep |
| Conditions authoring | CMS → Data › Conditions | Inspector Conditions; CMS → Data › Conditions = read-only index + Locate; legacy rules shown "Not active — review" until Activate | Move + Fix (new rules work; legacy output unchanged until user activates) |
| Sources, Site variables | CMS → Data | Site variables unchanged and in picker; **Sources persisted and specified in Panel 07 §10.1** (owner Q12), listed in the Conditions rule field | Keep + Fix *(R-1018b)* |
| Pre-publish CMS checks (4) | server | Kept + new (§16 T-DYN-10) | Keep + extend |
| Server publish snapshot, home-template refusal, template page dropped from publish | server | Unchanged | Keep |

No capability removed. Old saved bindings load unchanged (same `cmsBindings.field` / `.collection` records); new properties are additive.

## 16. Acceptance (specified, NOT RUN)

| ID | Scenario | Pass condition |
|---|---|---|
| T-DYN-01 | Way 3: create Blog template (Article) | Page created with bound elements; link saved; Pages row "Template · N pages"; publish yields N pages with each record's values; template page itself not published |
| T-DYN-02 | Way 2: drag `photo` and click-insert `date` on template | Image + Text created, bound, selected; Inspector Content shows the bound rows highlighted while focus stays in Add (Panel 06 A7); one Undo each removes element+binding |
| T-DYN-03 | Way 1: bind existing heading, image alt, button href (email) | Chip shows field + previewed value; published HTML has text, `alt`, `mailto:` |
| T-DYN-04 | Card link → This record's page | Each list card links to its record's URL in canvas preview, Preview and published output |
| T-DYN-05 | D4 | Collection without dynamic page: Link to disabled with reason; Create collection page completes and returns to the same card row |
| T-DYN-06 | Condition `featured is No` on badge | Ghost in editor on non-featured record; published HTML element has `hidden`; featured record shows badge |
| T-DYN-07 | List filter featured=Yes, sort date desc, skip 1, limit 3 | Same records/order in canvas and published HTML; empty block appears when 0 match |
| T-DYN-08 | Author template with nested list `author = this page's record` | Each author page lists only their posts in output |
| T-DYN-09 | Record switcher + Show drafts | Switching never dirties document/Undo; drafts visible only with toggle; never in output |
| T-DYN-10 | Pre-publish | New warnings: binding to deleted field; filter on deleted field; record link without dynamic page; live source while D8 unshipped |
| T-DYN-11 | Failure states (§14) | Each state shows its own message/action; load failure keeps binding; reload round-trips every binding |
| T-DYN-12 | Multi-select, locked, Viewer | No writes; reasons shown; read-only chips for Viewer |
| T-DYN-13 | Legacy project with CMS → Data conditions and `{{item.x}}` lists | Opens without loss; conditions migrated and indexed; placeholders still render |
| T-DYN-14 | D6 | Rich text into Heading outputs plain text; chip shows Formatting removed |
| T-DYN-15 | Keyboard | Picker, condition builder, Add field insert, record switcher fully operable without pointer; focus returns to origin row; F6 order per SC-5 / amended NAV-04 (topbar → global banner slot while a banner shows → rail → left panel → canvas toolbar + canvas → Inspector/task → bottom); from a ghost element, Enter on its Layers row selects it and the Inspector Conditions rule is one Tab-path away |
| T-DYN-19 | Picker beside overlay Inspector | At 1280×720 and 1024×768 (Inspector overlay, 312 obscured incl. 12px inset) the 280w picker opens left of the overlay within the canvas region, flips/clamps inside the viewport and never covers the anchor row |
| T-DYN-17 | Legacy safety (§12.4) | Old project opens with identical published output; legacy rules listed "Not active"; Activate changes output only for that rule |
| T-DYN-18 | Zero records / dangling template (§14) | First-run template shows placeholder chips + "0 pages"; Undo of generated page yields "Collection page missing" state, not a broken publish |
| T-DYN-20 *(R-1018b, Q12)* | Data source in a condition | Conditions rule field lists Data sources; rule `opening_hours.sunday is empty` shows the element as a ghost in the editor when the rule is false, survives reload, publishes `hidden` per the server copy; property bind picker does **not** list Data sources; deleting the source shows "{Source} was deleted — Choose source" |
| T-DYN-16 | Geometry | At 1440×900 and 1280×720: Inspector 300 shows bound row, subview and 3 stacked rules without horizontal scroll; picker within viewport; toolbar record control moves into View menu below 720 canvas width |

## 17. Phasing (inside D1 = C)

1. **P1 — Bind anything visible:** Way 1 rows + picker (static sources), alt/title, button/container href + record-page link, D4, Way 2 (Add → CMS fields), Way 3 (template generator, List of {collection}), record switcher + Show drafts (D5), all §14 states, D6.
2. **P2 — Conditions that work:** builder, ghosts, Layers glyph, publish `hidden` output (D3), legacy migration + index, **Data sources group** (needs ⛔ Source persistence, Panel 07 §10.1 — ships this version, owner Q12) *(R-1018b)*.
3. **P3 — Lists:** filter (incl. this page's record), sort, skip, empty block, D10 pagination.
4. **P4 — Media & style:** video/audio/embed, background image, og:image, class toggle, `data-*`.
5. **P4b — Live sources** (after D8): date/URL/cookie + runtime script.
6. **P5 — Forms** (only if requested). **Members** only after D7.

## 18. Open items and risks

- **D7, D8** — D7 deferred, D8 browser script — decided (§3).
- **Sources** *(R-1018b, Q12)*: ship this version, persisted (Panel 07 §10.1, ⛔ Source persistence). Not resolved, needs an owner decision: binding element properties to Source paths; fetched (URL/API) sources (the `api` type exists only in `shared/types/data.ts`).
- **D10 pagination**, **D11 one-level reference**, **D12 no nested condition groups** — designer-selected, confirmed under the owner's 2026-10-17 instruction.
- Multi-reference fields are NOT FOUND in the model and are **deferred** (owner P11, 2026-10-18); single reference only, and the "contains any of" operator is **hidden** this version *(R-1018)*.
- Server must apply filter/sort/skip/pagination identically at publish (new engine + server work).
- Hidden-render (D3) exposes content in source: copy warns; not access control.
- Geometry checks T-DYN-16 are specified, not measured. No Figma boards; no runtime check; no user testing.

## 19. Review record

### 19.1 Independent read-only review (2026-10-17)
Reviewer: `design-qa-critic` subagent (the project's `design-guard-reviewer` agent was not available in this session). Read the spec, the locked IA/brief and gate definitions; spot-checked source.
- **Pass 1 — PROPOSAL.** Blocking: B1 link bindings placed in Content against BD20-IA01; B2 D4 return contradicted §10.1, undefined Undo of page+server link; B3 reset relocation against GEO-01; B4 legacy conditions auto-activated (output change); B5 no zero-record state; B6 text→href bindings would break.
- **Pass 2 — passed for written scope.** B1–B6 resolved (§8.1–8.3, §10.1, §12.4, §14, §15, T-DYN-17/18). Two wording leftovers fixed afterwards (§6, §15).
- Not verified: runtime (G8), measured geometry, Figma boards (deferred by user), user testing. D7 deferred and D8 browser script decided by the user 2026-10-17; D10–D12 designer-selected, confirmed under the owner's 2026-10-17 instruction.

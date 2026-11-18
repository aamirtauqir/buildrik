# C4 — Elements, components, CMS, pages, settings, assets, fonts, forms

Reverse-engineering audit, 2026-10-20, branch `main`, read-only. Every claim
below cites source as `file:line`. Paths are repo-relative to
`/Users/shahg/Desktop/pencil/buildrik`. "Webflow" claims come from general
product knowledge, not from Webflow source. Claims marked **(verify)** are ones
I am unsure of.

**Tests run (existing, non-DB):** `cd packages/editor && npx vitest run src/engine/components src/engine/cms src/blocks/__tests__/blockRegistry.everyBlockInserts.test.ts`
→ 35 files, 306 passed, 2 todo. These tests passing does NOT disprove the
suspected bugs below. None of the suspected bugs has a test covering it.

**Not verified:** none of this was walked in the running app. All of it comes
from reading source. I did not check the published output of Tabs or Modal on a
live deploy, and I did not test Vercel password protection on a Hobby account.

---

## E01 — Element catalogue — VERDICT: PARTIAL (P1)

**What exists**
- Registry: 66 block configs, `packages/editor/src/blocks/blockRegistry.ts:104-180`. `ElementType` union, `packages/editor/src/shared/types/element.ts:81-136`.
- The Insert panel is grouped by source: ELEMENTS · BLOCKS (Sections only) · BUILT-IN COMPONENTS · SAVED COMPONENTS (`packages/editor/src/editor/sidebar/tabs/build/catalog/groups.ts:44-66`).
- The ELEMENTS catalogue (`packages/editor/src/editor/sidebar/tabs/build/catalog/catalog.ts:10-385`) has these groups:
  - basic: heading, paragraph, link, collection-list, list, button, icon, divider, spacer, label, progress, countdown
  - layout: container, section, grid, columns, flex, stack, card, table
  - forms: input, textarea, select, checkbox, radio, switch, range, submit, email, password, number, date, time, color, form. File upload was deliberately dropped (`catalog.ts:196`).
  - media: image, video, audio, gallery, svg, lottie, video-embed, map-embed
  - navigation: navbar, footer, cta
  - interactive: theme-toggle, accordion, tabs, modal, testimonials, pricing, social-icons, slider
- Paste HTML dialog (`packages/editor/src/editor/sidebar/tabs/build/PasteHtmlModal.tsx:20-27`). Scripts and event handlers are stripped.

**How it compares to Webflow's list**

| Webflow | Buildrik |
|---|---|
| Section, Container, Div, Grid | Yes (section, container, grid, flex, columns, stack) |
| Link block | Partial. `link` exists. Whether it accepts children was not confirmed (nesting rules are in `shared/utils/nesting/typeChecks.ts:157`). |
| Button, Heading, Paragraph, Text, List | Yes |
| **Rich Text** (RTE block with H1-H6, lists, figures) | **MISSING.** No `richtext` element type (`element.ts:81-136`). Rich text exists only as a CMS field type. |
| Image, Video (YouTube/Vimeo), Background video | Image, video, video-embed: yes. A background-video element was not found. |
| **Lightbox** | **MISSING** (no type, no block) |
| Slider, Tabs, Navbar, **Dropdown** | Slider: yes, with runtime (`lib/publish-sliders.ts`). Tabs: block exists, but see the bug below. Navbar: static flex, with no mobile menu or hamburger (`blocks/Sections/Navbar.tsx:19`). **Dropdown: MISSING.** |
| Form + fields | Yes, 15 field blocks |
| **Embed (custom code with scripts)** | **MISSING.** Paste HTML is sanitized and loses scripts (`PasteHtmlModal.tsx:20-27`). |
| Map, Icon, Lottie | Yes |
| E-commerce elements | Product card, grid, detail and cart blocks are registered (`blockRegistry.ts:175-179`) but are **not in the catalogue**, so the Insert panel cannot reach them. |
| Navigation helpers (breadcrumbs, nav link) | `blocks/Navigation/index.ts` is an empty stub ("No exports yet") |

**Suspected bugs**
- **Tabs and Modal have no published runtime (suspected, P1).**
  - The Tabs block builds `.tab-button` / `.tabs-nav` markup, and every panel after the first gets `display:none` (`blocks/Components/Tabs.tsx:84`).
  - The Modal overlay starts as `display:"none"` (`blocks/Components/Modal.tsx:57`) and opens from a `.modal-trigger` button (`:18`).
  - I searched for `modal-trigger|modal-overlay|tab-button|tab-panel` across `packages/editor/src` (excluding the block files), `lib/` and `packages/dashboard`. Nothing matched.
  - The export runtimes that do exist are accordion, countdown, slider, theme toggle and interactions (`packages/editor/src/engine/export/*Runtime.ts`; `lib/publish-widgets.ts:1-15`).
  - Likely result: tabs never switch and a modal never opens on a published site unless the user wires a custom interaction.
- Navbar has no responsive collapse (P1 for a Webflow switcher, since Webflow's Navbar ships a menu button).

---

## K01 — Components / symbols — VERDICT: DIFFERENT MODEL (P1)

**What exists**
- Engine: `packages/editor/src/engine/components/ComponentManager.ts`.
  - Create from a selection: `createComponent`, `:211`. Make existing groups into instances: `adoptInstances`, `:263`.
  - Detach, reset, reset one override, swap variant: `:617-636`.
  - Duplicate, delete, and restore a deleted master (undo): `:485-554`.
- Data model: `ComponentDefinition` with `masterTree`, `version`, variants, and `pageId` scope (`packages/editor/src/shared/types/components.ts:19-54`). An instance is stored on the element as `data.componentInstance` and holds overrides as JSON patches (`components.ts:117-130`).
- Server: the `site_components` table exists (`prisma/schema.prisma:1191-1215`). It is unique on `(siteId, componentId)` and `payload` is the full definition. The CRUD and library procedures are in `server/trpc/routers/site-component.ts:53-135`, and the payload is sanitized on write (`server/services/site-component.service.ts:25`). IndexedDB stays as a local cache.
- Editing a master is **not** an isolated master canvas as in Webflow. The user edits something on the canvas, then picks "Update from selection…", which promotes it to master and fans it out (`packages/editor/src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:163-200` → `updateComponentMaster` `ComponentManager.ts:365` → `applyMaster` `:393` → `syncAllInstances`). Undo works through `revertComponentMaster` (`ComponentDetailScreen.tsx:196`).
- Inspector instance row: variant select, Edit master, Reset, Detach (`packages/editor/src/editor/inspector/sections/ComponentRow.tsx:6,82-131`).

**Gaps compared with Webflow:** there is no "edit in place, everything else dims" master mode. Syncing an instance deletes its subtree and re-pastes it (`packages/editor/src/engine/components/ComponentInstances.ts:328-400`).

**Suspected bugs / risks**
- Overrides are keyed by **position path** (`ComponentInstances.ts:362-366`). If the master's structure changes (an element inserted or reordered), an override can land on the wrong element or be dropped. Dropped overrides are counted and reported (`overridesDropped`); overrides that land on the wrong element are not.
- `rehydrateInstances` (`ComponentManager.ts:190-207`) rebuilds the instance map on load but never re-syncs an instance whose `syncedVersion` is older than `component.version`. An instance that was not in memory when its master changed stays stale until someone triggers a sync (suspected; depends on whether every page is always loaded into `ElementManager`).

## K02 — Component props — VERDICT: MISSING (P1)
- `ComponentDefinition` has no prop schema (`components.ts:19-54`). The only per-instance customization is a free-form override patch: content, style, attribute or trait (`components.ts:139-143`).
- A `PropDefinition` type and a `{type:"slot"}` schema node do exist in `packages/editor/src/editor/components-catalog/types.ts:27-45`. But nothing outside that folder imports `components-catalog/` (grep finds no importers). It is **dead code**, which breaks the repo's own no-dead-code rule.
- Webflow has typed component properties (text, rich text, image, link, visibility, and so on) that are bound to elements inside the component.

## K03 — Slots — VERDICT: MISSING (P2)
- No slot concept in the live model. The only appearance is the orphaned `components-catalog/types.ts:29`. Webflow added component slots in its newer component system **(verify the date and plan availability)**.

## K04 — Variants — VERDICT: PARTIAL (P2)
- Engine support exists: `VariantProperty` axes, `ComponentVariant` with per-path style and attribute overrides (`components.ts:63-89`), resolved by `packages/editor/src/engine/components/ComponentVariantResolver.ts`, and instance selection (`ComponentRow.tsx:82`).
- **No authoring UI.** `addVariant`, `setVariantProperties` and `removeVariant` (`ComponentManager.ts:440-484`) have no callers outside the engine (grep over `packages/editor/src`). The inspector select therefore shows only the single "no variants" choice for every master the user creates (`ComponentRow.tsx:47,120`).
- Webflow variants are newer **(verify)**; Webflow's main mechanism is properties plus combo classes.

## K05 — Shared libraries across sites — VERDICT: DIFFERENT MODEL (P1)
- A "library" is defined as every site-scoped master that also exists on another site in the same workspace (`server/services/site-component.service.ts:182-216`). "Insert from library" copies the newest payload onto this site (`:218-227`; client side `packages/editor/src/services/componentSync.ts:183-205`).
- Each site keeps its own independent row. Editing a master on site A **does not reach** site B. There is no "update available / accept update" flow (grep finds no propagation code).
- Rename and delete across the workspace are ADMIN-gated (`server/trpc/routers/site-component.ts:37-50,121-135`).
- Webflow Libraries share a component and push updates that receiving sites accept **(verify plan gating)**.

---

## M01 — CMS collections and field types — VERDICT: PARTIAL (P1)
- Server tables `cms_collections` and `cms_entries` (`prisma/schema.prisma:447-496`). Entries have soft delete and DRAFT/PUBLISHED status. Field definitions are Json.
- Field types (`packages/shared/schemas/cms.ts:19-36`): text, textarea, richtext, number, date, datetime, boolean, select, multiselect, image, file, reference, color, url, email, slug. Validation is shared between client and server (`cms.ts:150-195`).
- Gaps compared with Webflow:
  - **multi-reference** (missing)
  - multi-image / gallery field (missing)
  - video-link field (only generic `url`)
  - phone (missing)
  - per-item scheduled publish (not found)
  - entries have no draft-vs-published *versions*: one `data` row with a `status`.
- Persistence: local IndexedDB first, then sync through an outbox (`packages/editor/src/services/cmsSync.ts`).

## M02 — Collection lists — VERDICT: PARTIAL (P0 for CMS-driven sites)
- The binding offers only `limit` and `status` (`packages/editor/src/engine/cms/CMSBindingManager.ts:55-72`).
- The renderer passes only `collectionId`, `status` and `limit` (`packages/editor/src/engine/cms/RepeaterRenderer.ts:157-163,250-256`).
- `CollectionManager.queryContent` *supports* `filter`, `sort` and `offset` (`packages/editor/src/engine/cms/CollectionManager.ts:480-509`), but no binding field reaches them.
- Result: **no filter, sort, offset or pagination** on a list, and no "current item's references" filter. Webflow lists filter on fields, sort, limit, offset and paginate. Order falls to the store default (newest first per `server/services/cms.service.ts` comments).

## M03 — Template pages and field bindings — VERDICT: PARTIAL (P1)
- How the template works:
  - A collection carries `pageSlugPattern`, `pageSeoTitle`, `pageSeoDescription` and `pageTemplatePath` (`prisma/schema.prisma:456-464`).
  - At publish, `appendDynamicPagesToPublish` drops the template page and emits one `/<slug>/index.html` per PUBLISHED entry (`server/services/cms.service.ts:1033-1071`).
  - The record is substituted into the template's `{{bk:field}}` tokens (`cms.service.ts:854-878,891-934`), and the per-record title, description and og tags are rewritten (`:899-905`).
  - The home page cannot be a template (`:1047-1049`).
- Bindable properties: only `content`, `src`, `href`, `alt`, `title` (`packages/shared/schemas/sites.ts:179`). No style or background-image binding, and no binding of a link to "this item's page".
- Pre-publish checks: stale template, empty bindings, unbound lists (`cms.service.ts:623-795`).
- **Suspected bugs**
  - A reference field bound on a template page prints the referenced record's **id**. Server substitution uses `cmsTextOf(data[key])`, i.e. `String(value)` (`packages/shared/schemas/cms.ts:202-206`; `cms.service.ts:866-867`). Reference resolution exists only in the client repeater (`RepeaterRenderer.ts:337-345`).
  - Two entries whose `pageSlugPattern` resolves to the same slug both push `<slug>/index.html` (`cms.service.ts:915,931-932`), with no de-duplication or warning. Same risk for a generated path that shadows a static `<slug>.html`.
  - No canonical or `og:url` per record (stated in the `:883-888` comment).

## M04 — Conditional visibility — VERDICT: MISSING (P1)
- No conditional-visibility binding (CMS bindable list `sites.ts:179`). grep for `conditionalVis|showIf|visibleWhen` finds only the dead `components-catalog/types.ts`. The renderer has only an empty-list hide (`RepeaterRenderer.ts:261-265`).

## M05 — References / multi-reference — VERDICT: PARTIAL (P1)
- Single `reference` (`cms.ts:31`, validated as a string id at `:170`) resolves inside collection lists (`RepeaterRenderer.ts:337-345`). Multi-reference is missing, so there are no many-to-many lists (tags, categories, authors).

## M06 — Content editing for clients — VERDICT: MISSING as a Webflow-Editor equivalent (P1)
- No content-only role. Every CMS write requires the site role `EDITOR` (`server/trpc/routers/cms.ts:46-53`). `ROLE_RANK` gives EDITOR and DESIGNER the same rank, and the label "Content editor" was removed because nothing enforced it (`lib/constants/enums.ts:19-32`).
- Client participation is comment and review only (`/review/<token>`, `prisma/schema.prisma` Comment/ReviewRequest). There is no on-page "Editor mode" where a client edits text, images or CMS items without design access.

## M07 — Import / export / API, publish snapshot — VERDICT: PARTIAL (P2; API P1)
- **CSV import exists**: preview, column mapping, row and size caps, per-row errors; imports land as DRAFT (`server/services/cms.service.ts:474-617`; `packages/editor/src/editor/cms/CsvImportDialog.tsx:57`).
- **No CSV export of CMS items** (grep finds none in `editor/cms` or `tabs/content`).
- **API: none usable.**
  - API tokens can be created, and the scopes include sites, redirects, forms and domains, but no CMS scope (`server/services/api-token.service.ts:24-42`).
  - `protectedProcedure` rejects bearer tokens (`server/trpc/trpc.ts:133-146`), and **no router uses `scopedProcedure`** (grep: only the definition at `trpc.ts:157`). `server/trpc/routers/api-tokens.ts:34` itself says "Tokens are deny-all today". Tokens are therefore minted but cannot call anything.
- Publish snapshot: `cms.publishSnapshot` returns the server's live PUBLISHED rows plus fonts, EDITOR-gated (`server/trpc/routers/cms.ts:138-146`). This is correct server-first behaviour.

---

## P01 — Pages panel — VERDICT: PARTIAL (P1)
- Present: duplicate (⌘D), set homepage, delete guard on the home page, "Replace layout with template…", copy link (`packages/editor/src/editor/sidebar/tabs/pages/components/PageContextMenu.tsx:85-97`). Also bulk select/move, search listings, and a dynamic-pages summary for CMS templates.
- **Folders are personal:** `PageFolder` is keyed by `userId × siteId` (`prisma/schema.prisma:1619-1634`; `packages/editor/src/editor/sidebar/tabs/pages/useFolders.ts:1-12`, "this user's own grouping").
  - They do **not** change URLs and are not shared with teammates.
  - In Webflow, folders are shared and nest the URL path (`/blog/post`).
- No CMS template pages *inside* the Pages list the way Webflow lists "CMS Collection pages". Templates are normal pages bound by `pageTemplatePath`.

## P02 — Page settings — VERDICT: PARTIAL (P1)
- Present:
  - SEO tab: slug, meta title, description, indexing (`packages/editor/src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx:196-377`)
  - Social tab: og title, description, image (`SocialTab.tsx:41-71`)
  - Advanced tab: live/hidden visibility, index/follow, custom `<head>` (`AdvancedTab.tsx:21-99`)
- Missing:
  - **per-page body-end custom code**
  - **per-page password**. The legacy password page is mapped to "hidden" (`usePageSettings.ts:111`). Only a site-wide password remains (P03).
- **Bug (confirmed by running the same regex in node): valid void tags block save.**
  - `validateHeadCode` (`page-settings/usePageSettings.ts:85-94`) counts `<[a-z][^/]*>` as open tags with no matching close.
  - `<meta name="google-site-verification" content="abc123">` returns "Unclosed HTML tag detected" and the save is refused. Any plain `<meta>`, or a `<link>` with no `/` in it, trips the same check.
- **Inline scripts are stripped** from page head code (`packages/editor/src/engine/export/sanitizeHeadCode.ts:9-16,54-61`, used at `SEOInjector.ts:234`).
  - Only `<script src>` survives, so inline GA/GTM/pixel snippets cannot be installed.
  - Webflow allows arbitrary custom code (paid plans).

## P03 — Site settings — VERDICT: PARTIAL (P1)
- Present:
  - General: name, author, favicon, touch icon, slug (`packages/editor/src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx`)
  - SEO defaults, robots.txt, indexing (`SeoScreen.tsx`)
  - Domains: Vercel connect, primary, DNS (`DomainsScreen.tsx`)
  - Redirects with notes and match-query (`prisma/schema.prisma:1469-1486`)
  - Security headers (`HeadersScreen.tsx`)
  - Languages (`LocalizationScreen.tsx`)
  - Custom code head, body and global CSS, Pro+ (`AdvancedScreen.tsx:1-15`)
  - robots.txt and sitemap.xml generated at publish, sitemap only when indexing is on (`lib/publish-files.ts:203-217`)
- Site head and body code go through the same `sanitizeHeadCode` (`packages/editor/src/engine/export/ExportEngine.ts:636,667`). Inline `<script>` in the **body** field is also removed, and so is any non-allowlisted element (a widget `<div>`).
- **Suspected P0 privacy bug: the site password can silently not apply.**
  - It is enforced through Vercel deployment protection on the customer's own Vercel account.
  - A 402, 403 or 404 response is swallowed with only `console.warn` (`server/services/publish.service.ts:995-1020`).
  - On a Vercel Hobby account the user turns on "Password protection" and publishes a **public** site with no UI signal.

## P04 — Assets / media library — VERDICT: PARTIAL (P1)
- Present:
  - server `MediaAsset` with alt text, width/height, folders (tree), and versions from the image editor (`prisma/schema.prisma:1062-1140`)
  - upload through Vercel Blob; image/webp/avif and video mp4/webm/quicktime accepted (`packages/dashboard/app/api/asset-upload/route.ts:36-37`)
  - search by filename and alt text, cursor paging (`server/services/media.service.ts:153-201`)
  - storage quota
- **Library is per-user, not per-site:** `listAssets` always filters `where: { userId, ... }` (`media.service.ts:154-156`), and uniqueness is `(userId, url)` (`schema.prisma:1093`). A teammate on the same site does not see your uploads (suspected collaboration gap, P1).
- **No image optimisation or responsive images:** no resize, WebP conversion or `srcset` generation (grep for `sharp|resize|srcset` in the export, upload and media services finds only sanitizer code). No `loading="lazy"` emission found in `engine/export`. Webflow generates responsive variants and lazy-loads by default.

## P05 — Fonts — VERDICT: PARTIAL (P2)
- Custom font upload: a font file goes into the media library, then "Add font" marks it as a site font (`userMetadata.siteFont`) (`packages/editor/src/editor/media/components/SiteFontsModal.tsx:5-12`; `server/services/media.service.ts:39-45`).
- Google fonts: a **fixed list of 27 families** (`packages/editor/src/shared/constants/googleFonts.ts:27`). It is also the export allowlist, which fixed "picked Poppins, published generic sans".
- `FontManager.fetchGoogleFonts` (`packages/editor/src/engine/fonts/FontManager.ts:172-215`) would load the full catalogue, but it has no caller and no API key is configured (`:70-74`). Dead code.
- Webflow offers the full Google catalogue plus Adobe Fonts. Gap: P2.

---

## F01 — Forms — VERDICT: MATCHES WEBFLOW in core, PARTIAL at the edges (P2)
- Flow:
  - The form element plus 15 field blocks.
  - A `FormBlock` row is created at publish, keyed `(siteId, blockId)` (`prisma/schema.prisma:980-1006`).
  - Public endpoint `packages/dashboard/app/api/public/forms/[siteId]/[formBlockId]/route.ts`: rate-limited (`:40-46`), body size capped, URL-encoded/JSON parsing, checkbox groups joined (`:57-79`).
  - Storage in `FormSubmission` (`schema.prisma:1008-1027`) with read, spam and archive flags.
  - Monthly plan cap (`server/services/form-submission.service.ts:114-122`).
  - Notification email to `notifyEmail` plus the owner (`:139-170`), workspace webhook (`:171`), redirect or message on success with open-redirect guards (`:193-207`; `route.ts:100-141`).
- Spam: a honeypot only (`lib/publish-forms.ts:74-75`; `form-submission.service.ts:85-90`). The `spamProtection` toggle only controls whether the honeypot is emitted (`lib/publish-forms.ts:134`). There is no reCAPTCHA or Turnstile on forms, and `isSpam` is never set automatically (Webflow has reCAPTCHA).
- Viewing: the editor's Settings › Form submissions inbox with CSV export (`packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:1-15`).
- No file-upload field: removed from the catalogue (`catalog.ts:196`). The endpoint parses only URL-encoded bodies, not multipart (`route.ts:57-79`). Webflow supports file upload on paid plans.

---

## Severity roll-up for a Webflow switcher

**P0**
- M02 collection lists have no filter or sort
- P03 site password silently skipped on Vercel Hobby (suspected)

**P1**
- E01 missing elements: Rich Text, Embed, Lightbox, Dropdown; Navbar has no mobile menu; Tabs and Modal have no runtime (suspected)
- K01 position-keyed overrides
- K02 no props
- K05 copy-only library
- M01 / M05 no multi-reference
- M03 template-page reference prints an id (suspected)
- M04 no conditional visibility
- M06 no client editor role
- M07 API tokens are deny-all
- P01 personal folders that don't affect URLs
- P02 head-code validator rejects `<meta>`; inline scripts stripped
- P04 per-user media, no responsive images

**P2**
- K03 slots
- K04 variant authoring UI
- P05 27-font Google list
- F01 captcha and file upload
- Dead code: `editor/components-catalog/`, `FontManager.fetchGoogleFonts`, `blocks/Navigation/`

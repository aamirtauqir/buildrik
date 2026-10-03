# SEO "like Yoast" — implementation plan

**Date:** 2026-10-04 · **Owner decision:** 2026-10-04, all four scopes (a)–(d) · **Base:** main `f42f887d1`
**Status:** plan only, no product code. Visual work is gated on the Figma boards in §6.

---

## 1. Scope and non-goals

The owner chose all four scopes. Each one is listed below with its concrete deliverable.

| Scope | Deliverable |
|---|---|
| **(a) Previews** | A SERP preview (desktop and mobile) and social card previews (Facebook and X) for **every page** in the Page settings drawer, and for the **site defaults** in Settings › SEO. |
| **(b) SEO analysis** | A per-page **focus keyphrase**, plus an SEO analysis list of red/amber/green checks and an overall traffic light. The checks cover title, description, slug, headings, image alt text, keyphrase placement and density, text length, and links. |
| **(c) Readability** | A per-page readability analysis covering sentence length, paragraph length, passive voice, transition words, subheading distribution, consecutive sentence starts, and Flesch Reading Ease where the language allows. |
| **(d) Technical SEO** | JSON-LD for Organization (or Person), WebSite, BreadcrumbList and WebPage on every page, with Article and LocalBusiness where the owner opts in. Sitemap controls: on/off and per-page exclusion. A per-page noindex/nofollow (already exists) and a per-page **canonical**. |

**Non-goals**
- Keyword research, search volume, rank tracking, and Search Console integration.
- AI rewriting of copy. The existing "Suggest SEO title" button stays as it is and is not extended.
- Premium Yoast features: synonyms and related keyphrases, internal-linking suggestions, redirect manager (Redirects already exists), and the "cornerstone content" workflow.
- Readability beyond English at launch. Language-neutral checks run for every locale. Language-specific checks report "not available for <language>" (§9 Q2).
- **Blocking publish on SEO.** Analysis is advisory and never gates a publish (§9 Q8).
- A per-locale focus keyphrase. Launch covers the default locale only (§9 Q9).
- FAQ, Product, Event and Recipe schema. Only the five types named in (d) are in scope. The free-form `structuredData` passthrough that exists today stays as the escape hatch.

---

## 2. Current state (verified on main `f42f887d1`)

### Site-level settings
- **`packages/editor/src/editor/sidebar/tabs/settings/screens/SeoScreen.tsx`** (476 lines) is built from boards 8135:214533, :214820 and :215066. It has three disclosure cards:
  - **Defaults:** title, description, OG image URL.
  - **Social profiles:** six networks, in `components/SocialProfilesCard.tsx`.
  - **Indexing:** allow indexing, canonical URL, and a robots.txt editor.
  - All of these are **Site columns** written by `siteDetail.settings.update`. The save model is the **footer Save**.
  - It already computes `sitemapOrigin()` from domains and `publishedUrl`.
  - It has **no previews**.
- **`packages/dashboard/components/site-detail/seo-tab.tsx`** is a **read-only** summary with search and social previews. It links to `?settings=seo`.
- **Site SEO columns** (`prisma/schema.prisma` `Site`): `metaTitle`, `metaDescription`, `metaTitleTemplate`, `ogImage`, `canonicalUrl`, `allowIndexing`, `robotsTxt`, `socialLinks`, `favicon` and `touchIcon` (migration `20260619143000_add_technical_seo`).
- **`packages/shared/schemas/project-settings.ts`**: the only JSON-only `seo.*` key is `seo.author`. `seoSettingsSchema` is `.strict()` and is *merged* into the stored `seo`. Every other SEO value is a column.

### Page-level settings
- **`packages/editor/src/editor/sidebar/tabs/pages/page-settings/`** is a drawer with three tabs (`DrawerTab = "seo" | "social" | "advanced"`).
  - All three tabs are one form, saved on **Done**. Cancel discards the edits.
  - `usePageSettings.ts` owns all state. `save()` calls `composer.elements.updatePage(id, { slug, settings: { visibility, head, seo: {...} } })`.
- **`SeoTab.tsx`** (429 lines) contains a Google preview (desktop only), a 0–100 score from `pages/utils/seoScore.ts` (`calculateSeoScore`: title, description, slug and indexing only), meta title and description, a slug field, an index/noindex select, and "Suggest SEO title".
- **`SocialTab.tsx`** has one generic OG card preview plus OG title, description and image fields. It has **no X-specific preview or overrides**, although `PageSEO` already types `twitterTitle`, `twitterDescription`, `twitterImage` and `twitterCard`.
- **`AdvancedTab.tsx`** has visibility, allow indexing, follow links, and custom head code. Its header says "canonical URL comes later". **There is no canonical UI today**, although `PageSEO.canonicalUrl` exists in the type and in the schema.

### Page settings storage
- Page settings persist in `Page.settings` (Json).
- They are validated by `pageSettingsSchema` / `pageSeoSchema` in `packages/shared/schemas/sites.ts:105-145`. Both schemas are **`.passthrough()`**, so new keys round-trip **without a migration**.

### Export and publish
- **`packages/editor/src/engine/export/SEOInjector.ts`** emits the following:
  - title (with `metaTitleTemplate`) and description;
  - canonical, but only when `baseUrl` or `pageSEO.canonicalUrl` is set;
  - og:* and twitter:* tags, and robots noindex/nofollow;
  - `pageSEO.structuredData` verbatim;
  - an Organization `sameAs` block built from social links;
  - sanitized custom head code.
- **Gap found:** `getDescription()` and `resolvePageTitle()` **never fall back to the site default `metaDescription` / `metaTitle`**. A page without its own description therefore ships with none, even though Settings › SEO › Defaults has a description (`SEOInjector.ts:240-249`).
- The publish export uses `new SEOInjector()` with **no `baseUrl`**. Canonical tags on published pages therefore come from the server.
- **`packages/editor/src/engine/export/SitemapGenerator.ts`** is used only for ZIP export. It duplicates `lib/publish-urls.ts` `buildSitemapXml`, which is semantic duplication.
- **`lib/publish-files.ts` `buildDeployFiles`** runs server-side in the publish worker (`packages/dashboard/app/api/workers/publish/[jobId]/route.ts:363`). It does the following:
  - injects canonical, og:url and robots tags through `lib/publish-html.ts` `injectSeoTags`;
  - writes `robots.txt`, which is custom or default, plus a `Sitemap:` line;
  - writes `sitemap.xml`, but only when indexing is on and an origin is known. Pages are excluded by **regex-matching a noindex robots meta in the HTML**;
  - writes `vercel.json`, which carries redirects and headers and **no `cleanUrls`**.
- **`lib/publish-urls.ts`**:
  - `pageCanonicalUrl(domain, path)` builds the URL from the uploaded **file path** (`/about.html`), because the deploy serves `.html`.
  - `resolveSiteOrigin` resolves in this order: canonical, then verified domain, then `<project>.vercel.app`.
  - **Gap:** page canonicals use `input.canonicalUrl` only. A site with a verified primary domain but no typed canonical URL ships **no canonical**.
- **Publish payload:** `publishPageSchema` is `{ path, html }` with **no page id** (`packages/shared/schemas/publish.ts:20`). The worker cannot map a deployed file back to its `Page` row, and per-page JSON-LD and sitemap exclusion need that mapping (§4.4).
- **SERP URL mismatch:** the editor's `SeoTab` `publicPath()` shows `/${slug}`, but the deploy serves `/${slug}.html`. Until `cleanUrls` lands, the preview shows a URL the deploy does not serve (§7).

### Rules that bind this plan
- Root `CLAUDE.md` data flow: Page → tRPC → Router → Service → Prisma.
- Shared schemas live in `packages/shared/schemas/`.
- No duplicate logic, and no `../../` imports.
- `server/AGENTS.md` adds the domain-error rule: services throw domain errors and routers translate them.
- `packages/editor/CLAUDE.md`: every visual change is built from a Figma board on `4418:45431` (Editor v3 · IA) and verified side by side at 1440×900. The engine imports only `shared/`. UI is built with chrome-ui, `tw:` classes and `--bk-*` tokens.

---

## 3. Data model and schema changes

### 3.1 Prisma — **one migration (S1), additive only**

`prisma/migrations/2026100Xhhmmss_seo_sitemap_schema/migration.sql`:

```prisma
model Site {
  // …
  sitemapEnabled Boolean @default(true)   // Settings › SEO › Sitemap on/off
  seoSchema      Json?                    // site structured data (see seoSiteSchemaSchema)
}
```

**Why these are columns rather than `projectSettings.seo.*`:**
- The publish worker reads Site columns (`route.ts:280-297`) and must not read the editor's project JSON.
- `seoSettingsSchema` is deliberately a one-member strict merge. The comment at `project-settings.ts:63-70` explains why widening it is a trap.
- This follows the Settings Phase B precedent that "everything else a Settings screen edits is a column".

**No Page migration.** Per-page fields go into `Page.settings.seo`, whose `pageSeoSchema` is passthrough.

**Migration process.** The owner runs `prisma migrate deploy` locally and on prod. Memory records that the auto-mode classifier refuses to deploy migrations. The migration must be applied **before** the deploy that reads the columns: `cms-unblocker` precedent; otherwise `siteDetail.settings.get` returns 500.

### 3.2 Shared Zod (`packages/shared/schemas/`)

| File | Change |
|---|---|
| `sites.ts` `pageSeoSchema` | Add `focusKeyphrase: z.string().trim().max(100).optional()`, `sitemapExclude: z.boolean().optional()`, `schemaType: z.enum(["WebPage","Article"]).optional()` and `article: z.object({ authorName: z.string().max(100).optional(), datePublished: z.string().datetime().optional(), dateModified: z.string().datetime().optional() }).optional()`. Tighten `canonicalUrl` to an absolute http(s) URL, max 2048 (reuse the `nullableSiteAssetUrl` rule's URL check). |
| **new** `seo-schema.ts` | `seoSiteSchemaSchema`: `{ entity: "Organization" \| "Person", name, logoUrl?, localBusiness?: { enabled, businessType (LocalBusiness subtype enum, e.g. Restaurant, Store, ProfessionalService… ~15), streetAddress, locality, region, postalCode, country (ISO-3166 alpha-2), telephone, priceRange?, openingHours?: Array<{ days: ("Mo"…"Su")[], opens: "HH:MM", closes: "HH:MM" }> } }`. One file because it is one domain: structured data. |
| `site-detail.ts` `updateSiteSettingsSchema` | Add `sitemapEnabled: z.boolean().optional()` and `seoSchema: seoSiteSchemaSchema.nullable().optional()`. |
| `site-column-fields.ts` | Register `seo.sitemapEnabled` and `seo.schema` as Site-column fields, so `SiteColumnGate` and the flush treat them like the other columns. |
| `publish.ts` `publishPageSchema` | Add `pageId: z.string().optional()`. It is optional so that an older editor tab still publishes (§4.4). |

**Editor mirror types.** Update `packages/editor/src/shared/types/project.ts`:
- `PageSEO` gets the same four keys.
- `SiteSEO` gets `sitemapEnabled` and `schema`.
- The **Zod-inferred type is the SSOT**: import `z.infer` types from `@buildrik/shared` instead of hand-duplicating them where the editor can.

---

## 4. Backend

### 4.1 The analyzer: port `yoastseo` or build in-house? → **Build in-house (recommended)**

| | `yoastseo` (npm) | In-house focused checks |
|---|---|---|
| Licence | **GPL-3.0**: [package.json](https://github.com/Yoast/wordpress-seo/blob/trunk/packages/yoastseo/package.json). The analysis must run **in the browser** for live feedback, so it would ship inside the editor bundle we send to customers. That is distribution, which triggers GPL copyleft on the combined bundle. Our sources are headed `@license BSD-3-Clause` / proprietary. Running it only server-side would avoid distribution, because it is GPL and not AGPL, but it would cost live feedback and add a round trip per keystroke. | Ours. Readability helpers can use MIT-licensed `syllable`/`flesch` ([words/flesch](https://github.com/words/flesch), [words/syllable](https://github.com/words/syllable)) or a 30-line syllable heuristic. |
| Fit | Built for WordPress post HTML plus the `@wordpress/i18n` runtime. Its deps are lodash, htmlparser2, parse5 and tokenizers, so the bundle cost is heavy. It expects a `Paper` of HTML, while we would pass the element tree. | Reads our element tree directly: it knows which node is an H2, an image's alt, a CMS-bound field. "Fix" can select the offending element on the canvas, which Yoast can only point at as a text range. |
| Languages | Readability in about 24 languages ([features per language](https://yoast.com/help/features-per-language)). This is its real advantage. | English at launch; neutral checks for all. Each extra language costs a transition-word list, a passive-voice rule and a Flesch variant. |
| Maintenance | Tracks Yoast's monorepo releases (3.6.0 at time of writing), and a WordPress-oriented API churns. | About 20 checks with fixtures. Small and stable. |

**Recommendation: in-house.** The GPL issue alone is disqualifying for a client-side bundle unless the owner wants a licence review. The checks Yoast's free tier runs are well documented and simple. Our element-tree advantage, the click-to-fix behaviour, only exists in-house. Multilingual readability is the cost, and §9 Q2 asks the owner to accept English-first.

### 4.2 Analyzer architecture (pure, shared)

```
packages/shared/seo/
  analysis.ts      → analyzeSeo(doc: SeoDocument, ctx): Assessment[]          (b)
  readability.ts   → analyzeReadability(doc, locale): Assessment[]            (c)
  text.ts          → sentence/word/syllable splitting, keyphrase matching (en stemming-lite)
  lang/en.ts       → transition words, passive-voice auxiliaries + participle rule
  jsonLd.ts        → buildJsonLd(input): object[]                             (d)
  score.ts         → rating(assessments): "good" | "ok" | "bad"
```

The analyzer lives in `packages/shared`, not in the editor engine, so that the server can run the same rules later, for example as a pre-publish warning row (§9 Q8). The precedent is `packages/shared/content/elementIds.ts`. `packages/shared/seo/` is pure TypeScript with no DOM.

**`SeoDocument`** is a flat, typed view of one page:

```ts
{ title, description, slug, publicUrl, keyphrase?, locale,
  blocks: Array<{ elementId, kind: "heading"|"paragraph"|"list"|"image"|"link"|"button",
                  level?, text?, alt?, href?, internal?, cmsBound? }> }
```

**Extractor.** It is built by the editor-side `packages/editor/src/engine/seo/extractSeoDocument.ts`, which is pure and imports only `shared`:
- It walks the Composer page tree.
- It resolves `{{site.var}}` text.
- It marks CMS-bound nodes as `cmsBound`, which are skipped for density and readability, with a note "template page — analysed on placeholder text".

**`Assessment`:** `{ id, rating: "good"|"ok"|"bad"|"na", text, elementId?, fixTarget?: "title"|"description"|"slug"|"keyphrase"|"canvas" }`.

**SEO checks (b).** The thresholds are our own and are listed here so tests can pin them.

| id | Rule (good / ok / bad) |
|---|---|
| `keyphrase-length` | 1–4 content words / 5–8 / >8 or empty (empty is `bad`: "Set a focus keyphrase") |
| `keyphrase-in-title` | at the start / anywhere / absent |
| `keyphrase-in-description` | present / — / absent |
| `keyphrase-in-slug` | all content words in slug / some / none |
| `keyphrase-in-intro` | in first paragraph / in first sentence of second / absent |
| `keyphrase-in-subheadings` | 30–75 % of H2/H3 contain it / 1+ / 0 (only when there are H2/H3s) |
| `keyphrase-density` | 0.5–3 % / 0.3–0.5 or 3–4 % / outside |
| `keyphrase-in-alt` | ≥1 image alt contains it / — / images exist but none do |
| `keyphrase-unique` | not used as another page's keyphrase / — / used on page X (site-wide, from the Pages list) |
| `title-length` | 30–60 chars / 1–29 or 61–70 / empty or >70 (character approximation, see §9 risk R4) |
| `title-unique` | unique across pages / — / duplicate of page X |
| `description-length` | 120–156 / 50–119 or 157–160 / empty or <50 |
| `slug` | clean, not placeholder (`isPlaceholderSlug`) / long (>75) / placeholder |
| `single-h1` | exactly one H1 / — / zero or 2+ |
| `heading-order` | no skipped levels / — / H2→H4 skip (names the element) |
| `image-alt` | all images have alt / ≤ 20 % missing / more (names elements) |
| `text-length` | ≥300 words / 200–299 / <200 |
| `internal-links` | ≥1 / — / 0 |
| `outbound-links` | ≥1 / — / 0 (`ok`, never `bad`, matching Yoast's tone) |
| `noindex` | — / — / page is noindex → whole analysis shows a banner, score `na` |

**Readability checks (c).**

| id | Rule | Languages |
|---|---|---|
| `sentence-length` | ≤25 % of sentences >20 words / ≤30 % / more | all (word split) |
| `paragraph-length` | no paragraph >150 words / ≤200 / more | all |
| `subheading-distribution` | no run >300 words without H2/H3 / ≤350 / more | all |
| `consecutive-starts` | no 3+ consecutive sentences starting with the same word | all |
| `passive-voice` | ≤10 % / ≤15 % / more | **en** at launch |
| `transition-words` | ≥30 % of sentences / ≥20 % / less | **en** at launch |
| `flesch` | ≥60 / 50–59 / <50 (Flesch Reading Ease) | **en** at launch; de (Amstad), es (Fernández Huerta), fr (Kandel–Moles), nl (Douma), it (Flesch–Vacca) are formula swaps for a follow-up |

The **traffic light** is good when no `bad` and at most two `ok`, ok when there is at most one `bad`, and bad otherwise. It is computed per analysis (SEO and readability separately), as Yoast does. The existing `calculateSeoScore` (`pages/utils/seoScore.ts`) is **deleted** and its tests rewritten in the same commit, so there is one score and one place. `isPlaceholderSlug` moves into `packages/shared/seo/analysis.ts`.

### 4.3 tRPC and services

Analysis is **client-side and live**, so there are **no new endpoints for (a)–(c)**. Inputs persist through the existing page save (`composer.elements.updatePage` → `sites.saveProject`).

For (d):

| Endpoint | Change | Service |
|---|---|---|
| `siteDetail.settings.get` | Returns `sitemapEnabled` and `seoSchema` | `site-settings.service.ts` select list |
| `siteDetail.settings.update` | Accepts both new fields (validated by `updateSiteSettingsSchema`) | same service. `seoSchema` is stored as JSON after `seoSiteSchemaSchema.parse`. `logoUrl` passes the same asset-URL rule as `ogImage`. |

**Error mapping** is unchanged. Zod failures become `BAD_REQUEST` with field messages, which the screen already renders under the field (`SCREEN_FIELD_ERROR`).

There is **no external API** in this plan, so it has no rate limits and no lazy clients.

### 4.4 Publish pipeline changes (server)

1. **Page identity.** `exportPublishPages.ts` sends `pageId` with each `{ path, html }`. The worker loads `prisma.page.findMany({ where: { siteId, id: { in } }, select: { id, name, slug, isHomePage, settings, updatedAt } })`. This read belongs in the service the worker already calls, not as a new direct Prisma read in the route (§9 R6). Pages without `pageId` from an old tab get no per-page JSON-LD and use the regex noindex fallback, so the change degrades and never breaks.
2. **JSON-LD** is built by `packages/shared/seo/jsonLd.ts` and injected by a new `injectJsonLd()` in `lib/publish-html.ts`, inside `buildDeployFiles`. Per page:
   - **Organization or Person** (site-wide): name, url = origin, logo, and `sameAs` from social links. If LocalBusiness is enabled, `@type` is the chosen LocalBusiness subtype, with `address` (PostalAddress), `telephone`, `priceRange` and `openingHoursSpecification`.
   - **WebSite** (home page only): `name` and `url`. There is no `SearchAction` because published sites have no search.
   - **WebPage** or **Article** per page: `url` from `pageCanonicalUrl` and `name`. Article adds `headline` (title, max 110 chars), `author`, `datePublished`/`dateModified` (defaulting to `Page.updatedAt`), `image` (OG image), and `publisher` → the Organization `@id`.
   - **BreadcrumbList** on non-home pages: Home › folder pages › this page. Every `item` URL comes from `pageCanonicalUrl`.
   - All nodes go into one `@graph` with `@id`s (`${origin}/#organization`, `#website`, `${url}#webpage`), so they reference each other instead of repeating.
   - **The existing Organization block in `SEOInjector` is removed** from the publish path, to avoid two Organization nodes. `SEOInjector` calls the same `buildJsonLd` for ZIP export when it has a `baseUrl`. That gives one builder and both paths.
   - The user's free-form `structuredData` stays as a separate `<script>`, as it is today.
   - The `</script` escaping rule moves into `injectJsonLd`.
3. **Sitemap controls:**
   - `buildSitemapXml(origin, pages, { exclude: Set<pageId> })` excludes pages with `settings.seo.sitemapExclude`, pages that are noindex (from settings, with the regex as fallback for id-less pages), and pages whose **canonical points elsewhere**.
   - `lastmod` = `Page.updatedAt` per page, instead of "today" for all pages.
   - When `site.sitemapEnabled === false` there is no `sitemap.xml` and **no `Sitemap:` line** in robots.txt.
   - `SitemapGenerator.ts` (editor, ZIP export) is deleted, and ZIP export calls a shared pure `buildSitemapXml` moved to `packages/shared/seo/sitemap.ts`. That removes the semantic duplicate.
4. **Canonical:**
   - A per-page `canonicalUrl` is emitted by `SEOInjector`. The server's `injectSeoTags` already skips when a canonical exists (`publish-html.ts:105`), so the per-page value wins.
   - **Fix:** the server default canonical uses the resolved origin when `canonicalUrl` is empty **but a verified custom domain exists**. It never uses `*.vercel.app`, because canonicalising to a preview host would hand ranking to it (§9 Q10).
5. **Defaults fallback.** In `SEOInjector`, the description falls back to the site `metaDescription`, and the title falls back to the site `metaTitle` before `page.name` (§9 Q4). It runs on both export paths because both call `inject`.
6. **robots.txt:** behaviour is unchanged except for item 3.

---

## 5. Editor / UI

### Where things live

| Surface | Contents | Save model |
|---|---|---|
| **Page settings drawer** (Pages panel › page › Settings) | Tabs: **SEO** · **Readability** (new) · **Social** · **Advanced** | Existing: one form, **Done** saves, Cancel discards (decision #20). Analysis recomputes live on every field edit. |
| **Settings › SEO** (site) | Defaults (+ SERP and social previews of the home page using the defaults) · Social profiles · **Structured data** (new card) · **Sitemap** (new card) · Indexing · **Pages overview** (new, read-only table) | Existing **footer Save**: "applies on next publish". |
| **Pages panel rows** | A small SEO dot per page (traffic light), reading the stored keyphrase and running the analyzer lazily | None |
| **Canvas / Inspector** | No new Inspector UI. A "Fix" on an element-level assessment (missing alt, skipped heading, second H1) closes the drawer, **with an unsaved-edits guard** (existing `UnsavedWarningModal`), selects the element and opens the Inspector section that edits it, for example the Image alt field. | — |
| **Dashboard site-detail SEO tab** | Stays read-only. It adds the sitemap on/off and schema entity rows to the summary. | — |

### Drawer states

**SEO tab:**
- Focus keyphrase field (empty prompt).
- SERP preview with a **Desktop / Mobile** toggle. The URL line uses the **deployed URL form** (§7), with a title truncation marker.
- SEO analysis grouped as **Problems · Improvements · Good results** (collapsible). Each row has a coloured dot, a sentence and an optional "Fix".
- The traffic light pill sits in the tab label.
- The existing title, description and slug fields stay. The "reach 80+" banner is replaced by the grouped list.
- Noindex page: a banner "This page is hidden from search; analysis is paused", with the list dimmed.

**Readability tab:**
- Traffic light, then the grouped list.
- Unsupported-language state: "Passive voice, transition words and Flesch aren't available for French yet", with neutral checks still shown.
- Empty page: "Add some text to analyse readability".
- CMS template page: a note.

**Social tab:**
- **Facebook card preview** and **X card preview**, with the X preview switching between summary and large image from `twitterCard`.
- An "X uses Facebook values" toggle. When it is off, three X override fields appear (`twitterTitle`, `twitterDescription`, `twitterImage`).
- An image-missing state uses the site default OG image and labels it "Site default".

**Advanced tab:**
- New fields: **Canonical URL** (empty = this page; validation error for a non-absolute URL), **Include in sitemap** (disabled with the reason "Hidden from search" while noindex is on), and **Schema type** (Web page · Article). Article reveals **Author** (defaults to `seo.author`) and **Published date**.

### Settings › SEO states

- **Structured data card:**
  - Organization / Person segmented control, name, logo (media picker).
  - "This is a local business" toggle, which reveals the LocalBusiness subtype select, address fields, phone, price range, and an opening-hours editor (day chips + opens/closes).
  - Error states per field.
- **Sitemap card:**
  - On/off switch.
  - The live sitemap URL (`${sitemapOrigin}/sitemap.xml`) as a link when published. Before publishing: "Available after you publish".
  - Excluded pages: a count, plus "Manage" opening a multi-select of pages. This writes each page's `sitemapExclude`, which is **page data**, so it saves through the project save and not the Site columns. See §9 Q11 for whether this belongs here or only in the drawer.
  - The line "Hidden (noindex) pages are left out automatically".
  - Indexing-off state: "No sitemap while search indexing is off".
- **Pages overview:** page name · keyphrase · SEO dot · readability dot · "Open" (opens that page's drawer). Loading and empty states.
- **Defaults previews:** SERP and Facebook/X cards rendered from the defaults plus the home page, so the owner sees what an override-less page looks like.

### Implementation notes
- The analyzer runs in a `useSeoAnalysis(page, fields)` hook. It is memoized on field values plus a debounced (400 ms) subscription to the composer's element-change events for the open page, and does no polling (CLAUDE.md: "UI subscribes to Composer events").
- Previews are pure components in `packages/editor/src/editor/sidebar/tabs/pages/page-settings/previews/` (`SerpPreview`, `FacebookCardPreview`, `XCardPreview`), reused by `SeoScreen`. The import direction (settings → pages/previews) is a sibling import inside `editor/sidebar/tabs`, which is allowed. If both directions appear, move them to `editor/seo/`.
- Every new control comes from `@/editor/chrome-ui`. Gate 24 forbids raw `<button>` and `<input>`.
- **Previews render Google, Facebook and X look-alikes.** They are illustrative, not pixel copies of those products. They must still use our tokens and Inter, and must not name a fallback font stack (DESIGN.md anti-slop rule 8). Google's own typeface is not reproduced.

---

## 6. Missing Figma boards (designer brief)

These numbers are prefixed **SEO-M** so they do not collide with the Settings Phase B M1–M19 brief (`docs/plans/2026-10-02-settings-phase-b-plan.md`). Boards go on page `4418:45431` next to the existing page-settings SEO board (`s3-flows-page-settings-seo`) and Settings › SEO (8135:214533). All boards are 1440×900 with the editor shell and the drawer or screen open. They show the **shape**, not literal sample data.

| # | Board | Must show |
|---|---|---|
| SEO-M1 | Page drawer · SEO tab · default | Tab row SEO (traffic-light pill) · Readability · Social · Advanced. Focus keyphrase field (filled). SERP preview with Desktop/Mobile toggle, desktop selected, URL line `example.com › about.html` (or the clean form, §7). Grouped analysis: Problems (2) · Improvements (3) · Good results (collapsed, 9). Every row has a dot plus a sentence, and at least one row has "Fix". Title / description (char counter) / slug fields below. |
| SEO-M2 | Page drawer · SEO tab · states | (a) No keyphrase: prompt row "Set a focus keyphrase to see keyphrase checks" with keyphrase rows absent. (b) Mobile SERP. (c) Noindex page: paused banner and dimmed list. (d) Title too long: the truncated SERP title with ellipsis and a red row. |
| SEO-M3 | Page drawer · Readability tab | Traffic light, then the grouped list (sentence length, paragraphs, subheadings, passive voice, transition words, Flesch "62 · fairly easy"). Variant: unsupported language (note plus neutral checks only). Variant: empty page. Variant: CMS template page note. |
| SEO-M4 | Page drawer · Social tab | Facebook card preview, X card preview (large image), toggle "X uses Facebook values" on. Variant: toggle off with three X fields, and the X preview in `summary` (small image) form. Variant: no image, falling back to the site default with a "Site default" tag. |
| SEO-M5 | Page drawer · Advanced tab | Existing visibility / indexing / follow / head code, plus Canonical URL (empty placeholder "This page's own URL"), Include in sitemap (switch), and Schema type (Web page · Article). Article expanded: Author and Published date. Error: invalid canonical. Disabled sitemap switch with the "Hidden from search" reason. |
| SEO-M6 | "Fix" hand-off | The canvas with an image selected and the Inspector open on the alt field, highlighted. Before it, the unsaved-edits modal variant when the drawer is dirty. |
| SEO-M7 | Settings › SEO · Defaults with previews | The Defaults card with a SERP preview and a Facebook/X preview under the fields. The scope line stays "applies on next publish". |
| SEO-M8 | Settings › SEO · Structured data card | Organization/Person segmented control, name, logo picker. "Local business" toggle on: subtype select, address (street, city, region, postal code, country), phone, price range, opening hours editor (day chips + times, add row). Variant: Person (no logo, no local business). Field-error variant. |
| SEO-M9 | Settings › SEO · Sitemap card | Switch on, the sitemap URL link, "3 pages excluded · Manage", and the noindex note. Variants: not yet published ("Available after you publish"); indexing off (card disabled with the reason). Manage modal: the page list with checkboxes and Cancel / Save. |
| SEO-M10 | Settings › SEO · Pages overview | Table: page · keyphrase · SEO dot · readability dot · Open. Loading row, empty ("No pages yet"). Sort by worst first. |
| SEO-M11 | Pages panel row · SEO dot | A page row with the small traffic-light dot and its tooltip ("SEO: needs improvement · Readability: good"). |
| SEO-M12 | Settings › SEO · Indexing card update | Existing card plus a note that the canonical default now follows the verified primary domain. No new controls. The designer should confirm the copy only. |

---

## 7. Publish / export impact and verification

| Output | Change | Where |
|---|---|---|
| `<title>`, meta description | Fall back to the site defaults when the page has none | `SEOInjector` (both paths) |
| og:* / twitter:* | X-specific overrides honoured (`twitterTitle`, `twitterDescription`, `twitterImage` already typed; the injector currently writes twitter:title from `ogTitle`) | `SEOInjector` |
| `<link rel=canonical>`, og:url | Per-page override wins; the default uses the verified domain when no canonical is typed | `SEOInjector`, `lib/publish-html.ts`, `lib/publish-urls.ts` |
| robots meta | Unchanged (noindex/nofollow per page; site-wide noindex when indexing is off) | — |
| JSON-LD | One `@graph`: Organization/Person (or LocalBusiness), WebSite (home), WebPage/Article, BreadcrumbList | `packages/shared/seo/jsonLd.ts` → `lib/publish-files.ts` |
| sitemap.xml | On/off; per-page exclude; canonical-elsewhere excluded; real `lastmod` | `packages/shared/seo/sitemap.ts` (moved), `lib/publish-files.ts` |
| robots.txt | `Sitemap:` line only when the sitemap is on | `lib/publish-files.ts` |

**`cleanUrls` interaction (the open ticket).** Today every absolute URL is the uploaded file path: `/about.html`, through `pageCanonicalUrl`. If the `cleanUrls` ticket ships `"cleanUrls": true` in our generated `vercel.json`, Vercel serves `/about` and **308-redirects `/about.html` → `/about`**. Every canonical, og:url, sitemap `<loc>` and BreadcrumbList `item` would then point at a redirect, which search engines treat as a soft signal against the URL. The rules this plan follows:
- **Every absolute URL goes through `pageCanonicalUrl`**: JSON-LD, sitemap, canonical, og:url, and the editor SERP preview, which gets a shared `publicPageUrl(origin, path)` exported from `packages/shared/seo/` and used by both `lib/publish-urls.ts` and the editor. When cleanUrls lands, one function changes and every output moves with it.
- The SERP preview must show what the deploy serves **today**. The current `SeoTab` `publicPath()` (`/${slug}`) is wrong until cleanUrls lands, and gets fixed in lane S-C.
- §9 Q3 asks the owner to sequence the cleanUrls ticket **before** lane S-E merges, which is the recommendation, so the new outputs ship with clean URLs from day one.

**Verifying against what the deploy serves.** This is the done-condition for lane S-E, and is not unit tests. Publish a 4-page fixture site (home, about, blog folder with one Article, one noindex page, one sitemap-excluded page) from the QA workspace. Per memory, `qa@buildrik.local` has a **real Vercel connection**, so its publish deploys for real. Then run these checks against the live URL:
1. `curl -s $ORIGIN/sitemap.xml` lists exactly home, about and the article, with no noindex or excluded page. **`curl -o /dev/null -w '%{http_code}'` every `<loc>` returns 200, with no 3xx and no 404.**
2. For each page, the `<link rel=canonical>` href returns 200 when curled, and equals the page's own URL unless it is overridden.
3. `curl $ORIGIN/robots.txt` has the `Sitemap:` line. Turn the sitemap off, republish, and confirm the line is gone and `/sitemap.xml` returns 404.
4. Each page's JSON-LD is extracted and passed through the Schema.org validator (validator.schema.org) with zero errors. The Article page is also checked in Google's Rich Results Test, which needs a human. Record the screenshot.
5. A page without its own description ships the site default description (grep the deployed HTML).
6. The ZIP export of the same site contains the same JSON-LD graph, given a base URL.

---

## 8. Lanes

**Order:** S-A → (S-B ∥ S-E) → (S-C ∥ S-D) → S-F. S-C and S-D also wait on their boards (SEO-M1–M12). S-B, S-E and S-A are not board-gated.

| Lane | Owns (files) | Depends on | Observable done-condition |
|---|---|---|---|
| **S-A Contracts + migration** | `prisma/schema.prisma` + S1 migration; `packages/shared/schemas/{sites.ts (pageSeoSchema), seo-schema.ts (new), site-detail.ts, site-column-fields.ts, publish.ts}`; `server/services/site-settings.service.ts`; `server/trpc/routers/site-detail.ts` (settings get/update only); `packages/editor/src/shared/types/project.ts` | — | `prisma migrate status` is clean on the local DB. A `tsx` smoke saves and reads back `sitemapEnabled=false` and a LocalBusiness `seoSchema` through `siteDetail.settings.update/get`. A page save with `focusKeyphrase` round-trips through `sites.saveProject` (reload the editor and the value is there). |
| **S-B Analyzer** | `packages/shared/seo/{analysis,readability,text,score}.ts`, `lang/en.ts` + tests; `packages/editor/src/engine/seo/extractSeoDocument.ts` + tests; deletes `pages/utils/seoScore.ts` (+ test rewrite) | S-A (types) | A fixture suite of 12 pages pins every check id's good/ok/bad boundary. A real page from the QA site, extracted from a live Composer in a vitest-dom test, produces the expected assessments, including the `elementId` of a missing-alt image. |
| **S-E Publish/export** | `packages/shared/seo/{jsonLd,sitemap}.ts` + tests; `lib/publish-files.ts`, `lib/publish-html.ts`, `lib/publish-urls.ts`; the worker route's page-row read (via service); `packages/editor/src/engine/export/{SEOInjector.ts, ExportEngine.ts}`; deletes `SitemapGenerator.ts`; `packages/editor/src/editor/shell/exportPublishPages.ts` (send `pageId`) | S-A; cleanUrls decision (§9 Q3) | The §7 live-deploy checks 1–6 pass on a real QA deploy, with curl output pasted in the lane report. |
| **S-C Page drawer UI** | `pages/page-settings/*` (SeoTab, new ReadabilityTab, SocialTab, AdvancedTab, PageSettingsDrawer tabs, usePageSettings), `page-settings/previews/*`, `useSeoAnalysis`; Pages panel row dot; tests protecting the old score rewritten | S-B, boards SEO-M1–M6, M11 | Side-by-side board-vs-live screenshots at 1440×900 for each of SEO-M1–M6 and M11, matched by eye. Plus: type a keyphrase and the density row changes within 0.5 s; remove an image's alt on the canvas and the alt row turns red; "Fix" selects that image and opens its alt field; Done, then reload, keeps keyphrase, canonical, sitemap exclude and schema type. |
| **S-D Site settings UI** | `settings/screens/SeoScreen.tsx`, new `settings/components/{StructuredDataCard,SitemapCard,SeoPagesOverview}.tsx`; dashboard `components/site-detail/seo-tab.tsx` (summary rows) | S-A, S-B (overview), boards SEO-M7–M10, M12 | Side-by-side for SEO-M7–M10. Plus: save LocalBusiness, reload, and the values persist; toggle the sitemap off and the footer Save writes `sitemapEnabled=false` (read back via `settings.get`); the Pages overview dots match each page's drawer. |
| **S-F QA walk** | No product files (report only) | all | A `/qa` walk of the whole flow on the running app, plus a repeat of the §7 live checks after the UI lanes merge. The report states what was **not** verified, such as non-English readability. |

---

## 9. Risks and open questions

### Open questions for the owner (each with a recommendation)

| # | Question | Recommendation |
|---|---|---|
| Q1 | Port `yoastseo` (GPL-3.0) or build in-house? | **In-house** (§4.1). Bundling GPL code into the client editor is distribution, and pulls the bundle under GPL. |
| Q2 | Which languages get the full readability analysis at launch? | **English only.** Neutral checks (sentence and paragraph length, subheadings, consecutive starts) run for every locale. Add de/es/fr/nl as a follow-up, priced at about 4 h per language. |
| Q3 | Sequence the `cleanUrls` ticket before the SEO publish lane? | **Yes, land cleanUrls first.** Otherwise every new canonical, sitemap and breadcrumb URL has to be moved again, and the SERP preview shows `.html` for a release. |
| Q4 | Should pages without their own title or description inherit the site defaults? | **Yes**, which is what the Defaults card already implies. The analysis flags "uses the site default description" as `ok` (not unique) rather than `good`. |
| Q5 | How deep should LocalBusiness go? | Address, phone, opening hours and price range. **No geo coordinates** (needs a map picker), and no multiple locations. |
| Q6 | Which pages are Articles? | **An explicit per-page Schema type** select, defaulting to Web page. Auto-Article for CMS collection item pages is a follow-up. |
| Q7 | Show an SEO dot in the Pages panel? | **Yes.** It is small, and it is the only way to see which pages need work without opening each one. |
| Q8 | Should a red SEO result warn or block at publish? | **Neither at launch.** If wanted later, add a warn-only pre-publish row (non-blocking), reusing the shared analyzer server-side. |
| Q9 | Focus keyphrase per locale? | **Default locale only** at launch. Translations reuse it for analysis. |
| Q10 | Canonical default when no canonical URL is typed? | **Use the verified primary custom domain**, and never `*.vercel.app`. |
| Q11 | Where is sitemap exclusion edited? | **In both places, one value**: the page's Advanced tab and the Sitemap card's Manage modal both write `Page.settings.seo.sitemapExclude`. If the owner wants only one surface, keep the Advanced tab. |

### Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Analysis cost on large pages.** Re-walking the tree on every canvas change. | Debounce at 400 ms. The extractor is O(n) over nodes. Analysis runs only while the drawer is open, plus a lazy run for the Pages dots (idle callback). |
| R2 | CMS template pages are analysed on placeholder text. | Mark `cmsBound`, skip those nodes for density and readability, and show the note. |
| R3 | Duplicate JSON-LD Organization (the old SEOInjector block plus the new graph). | S-E removes the old block in the same commit. A test asserts exactly one Organization node per page. |
| R4 | Google truncates titles by pixel width (~580 px), not by characters. | Use a character approximation (30–60 and 70 cap) and state it in the row tooltip. Do not measure with a named system font (DESIGN.md bans naming fallback stacks). |
| R5 | Migration S1 not applied before deploy, so `settings.get` returns 500. | The S-A done-condition includes `migrate status`. The deploy checklist note goes in the lane report. The owner runs `prisma migrate deploy` (memory: the classifier blocks agents from doing it). |
| R6 | The publish worker route already reads Prisma directly (`route.ts:280`), against the data-flow rule. | The new Page-row read goes through a service function (`publish.service.ts` or `page.service.ts`) and is not added to the route. Do not widen the violation. |
| R7 | Old editor tabs publishing without `pageId`. | `pageId` is optional, and the server falls back to the regex noindex exclusion and skips per-page JSON-LD. |
| R8 | Element-level "Fix" while the drawer is dirty loses edits. | Route through the existing `UnsavedWarningModal` (board SEO-M6). |

---

## 10. Estimate (agent-hours)

| Lane | Hours |
|---|---|
| S-A Contracts + migration | 5 |
| S-B Analyzer (shared + extractor + fixtures) | 14 |
| S-E Publish/export + live verification | 14 |
| S-C Page drawer UI (4 tabs, previews, Fix hand-off, Pages dot) | 18 |
| S-D Settings › SEO cards + overview + dashboard summary | 12 |
| S-F QA walk | 5 |
| **Total** | **≈ 68 agent-hours** (plus design time for SEO-M1–M12, not counted) |

With S-B ∥ S-E and S-C ∥ S-D, the critical path is S-A → S-B → S-C → S-F, about 42 h of wall-clock agent time once the boards exist.

---

## Owner decisions (2026-10-04)

All eleven recommendations above are accepted (Q1 build the analyzer in-house — `yoastseo` is GPL-3.0; Q2 English readability first, language-neutral checks for every language; Q3 land `cleanUrls` before the SEO publish lane; Q4 pages inherit the site's default title/description; Q5 LocalBusiness without map coordinates; Q6 explicit per-page schema type; Q7 SEO dot per page in Pages; Q8 SEO never blocks publish; Q9 focus keyphrase in the default language only; Q10 canonical defaults to the verified primary domain, never `*.vercel.app`; Q11 sitemap exclusion editable from the page and the Sitemap card, one value).

The current-state bugs this plan found (default title/description fallback, missing canonical with a verified domain, editor preview URL vs the served `.html`) are fixed now, ahead of the lanes, without boards. The lanes themselves wait for the SEO-M1…M12 boards.

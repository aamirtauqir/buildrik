# P4 · Page SEO + Site SEO Milestone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Page SEO and Site SEO as one milestone. The Page settings surface becomes a right-docked drawer with staged Cancel / Save. It gains an optional focus keyphrase, a findings checklist instead of a score, Readability ("Not evaluated" outside supported languages), linked-or-custom X metadata, a validated canonical, schema type, and a Fix hand-off to the element. Site SEO gains a title template, approximate previews, structured data, a sitemap card and a pages overview. Every emitted URL comes from one resolver with extensionless (cleanUrls) paths on Vercel, and every emitted title comes from one resolver that the pre-publish check inspects page by page.

**Architecture:** Pure rules live in `packages/shared/seo/`, which already holds `urls.ts` and `sitemap.ts`. This plan adds `titles.ts`, `analysis.ts`, `readability.ts`, `status.ts` and `jsonLd.ts`. The editor engine, the publish worker (`lib/publish-files.ts`) and the server pre-publish check (`publish.service.ts`) all call the same functions. Editor UI is built from the SEO-M boards with chrome-ui, `tw:` utilities and `--bk-*` tokens. The Site SEO values go into two new Site columns through the existing `siteDetail.settings` path (Page → tRPC → Router → Service → Prisma). Page values ride `Page.settings.seo`, which is passthrough, so pages need no migration.

**Tech Stack:** TypeScript 5 strict, Zod, Vitest + React Testing Library, tRPC 11, Prisma 5 / PostgreSQL (**one additive migration, owner-applied**), React 18 editor chrome (chrome-ui + flowbite-react, `tw:` prefix).

**Spec:**
- `docs/audits/2026-10-08-editor-full-audit/OWNER-ANSWERS-2026-10-10.md`: FG-007, FG-008, FG-009, FG-010, FG-011, FG-012, L3-010, L3-011, L3-036. These answers win where they differ from the older documents below.
- `docs/plans/2026-10-04-seo-yoast-plan.md`, with the owner decisions of 2026-10-04 Q1–Q11 at its foot. This plan is its execution form. Thresholds and check ids come from its §4.2.
- Audit detail: `docs/audits/2026-10-08-editor-full-audit/phase2-live/FG.md` §FG-007…FG-012 and `phase2-live/L3.md` §L3-010, §L3-011, §L3-036.
- Board ledger: `packages/editor/docs/design-blockers-2026-10-04-handoff.md`. It is untracked in the founder tree at `/Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/`, so copy it into the branch in Task 0.

## Global Constraints

- Data flow: Page → tRPC → Router → Service → Prisma. Routers never touch Prisma. Services throw domain errors and routers translate them (root `CLAUDE.md`, `server/AGENTS.md`).
- Shared Zod lives in `packages/shared/schemas/`. Pure SEO rules live in `packages/shared/seo/`. Nothing in `packages/shared` touches the DOM.
- `engine/` imports only `shared/`. Chrome imports flowbite-sourced components from `@/editor/chrome-ui` only. No raw `<button>`, `<input>`, `<select>` or `<textarea>` in chrome (Gate 24). No `../../` imports.
- Accent `#1A56DB`. Body and UI text in Inter, with no system fallback stack named anywhere, previews included. 4px grid.
- Every visual task follows the FIGMA loop in `packages/editor/CLAUDE.md`:
  1. Load `figma:figma-design-to-code`, then call `get_design_context(<node>)`. If the Figma tools are absent, use `node scripts/baseline/figma-mcp.mjs`.
  2. Build the screen.
  3. Compare the board screenshot with a live screenshot at 1440×900, side by side, by eye.
  4. Rewrite any test that protects the old design in the same commit.
- Board sample data ("Bella Cucina", "example.com") is never copied literally. The shape is the contract.
- Copy rules:
  - Previews carry the visible label "Approximate preview".
  - Structured data is described as "structured data", never "rich results".
  - No SEO percentage or score number appears anywhere.
  - Status words are exactly "Not checked", "Needs attention" and "No issues detected".
- SEO never blocks publish (2026-10-04 Q8). The per-title check is a **warning**.
- **Migrations are owner-applied.** Agents write the migration file and never run `prisma migrate deploy` or `migrate dev` against any database. The owner applies it locally and on prod before the deploy that reads the columns.
- **Live steps never publish from the QA workspace (`qa@buildrik.local`).** It has a real Vercel connection. Deploy-output checks use the ZIP export and a `buildDeployFiles` fixture. A real-deploy check is an owner step in a workspace the owner names (Q4 below).

## Review Focus

1. **A page with no SEO title, a site template and a site default title.** Expected: the emitted `<title>` follows the owner order (page SEO title → template applied to the page title → page title). The editor preview, the ZIP export, the publish payload and the pre-publish check must all show the **same** string. Pinned in Task 3 (`titles.test.ts` "same title on every path") and Task 4.
2. **Deleting or renaming the element a finding points at while the drawer is open, then pressing Fix.** Expected: the finding re-runs, Fix is not executed against a missing id, and the row disappears or updates (FG-010). Pinned in Task 13.
3. **Clicking Fix, switching page, or pressing Esc with unsaved drawer edits, then a failing Save.** Expected: edits are kept and the user stays in the drawer with an inline error. Nothing navigates (FG-010, FG-012). Pinned in Task 8 and Task 13.
4. **A site published before cleanUrls whose pages are linked as `/about.html` elsewhere.** Expected: Vercel's cleanUrls 308s `.html` to the clean path. Canonical, og:url, sitemap `<loc>` and JSON-LD `url` all use the clean form. The ZIP export keeps `.html`. Pinned in Task 2.
5. **A noindex page.** Expected: it is absent from `sitemap.xml` **based on the stored setting, not only on regex-matching its HTML**. Its findings show "Hidden from search", and its Pages dot says so instead of "Needs attention". Pinned in Task 6 and Task 15.

---

## Reality check (code is truth; read on `origin/main` @ `503bc62cd`)

The 10-04 plan's §2 "current state" is stale in several places, and the owner's 10-10 answers change part of its design. The tasks below are written against what the code does now.

1. **Some of the 10-04 plan has already landed.** `packages/shared/seo/` exists with `urls.ts` (`normalizeCanonicalOrigin`, `siteOrigin`, `pageCanonicalUrl`) and `sitemap.ts` (`buildSitemapXml`), both tested (commits `aa800acc3`, `cbc9a90cf`, `4af5d1106`). `SitemapGenerator.ts` is deleted, and the ZIP export calls the shared builder (`ExportEngine.ts:853-863`). The description already falls back to the site default (`SEOInjector.ts:46-52`), and the title template is applied (`:63-70`, commit `a9dbd40e7`).
2. **The "drawer" is a centred modal.** `PageSettingsDrawer.tsx` (220 lines) is hand-rolled `Portal` + `useFocusTrap`, positioned by `PagesTab.css:467-481` (`left/top 50%`, translate, 520px tall) over a scrim. The header comment says "580px slide-over", which is stale. The footer is **Cancel / Done** (decision #20, `:7-10`), and ⌘S saves without closing.
   - **Owner FG-012 overrides decision #20:** staged edits with **Cancel / Save**. Board SEO-M1 draws "Discard / Save". The owner's words are used, and the board label is updated by the designer (Q1).
3. **There is no chrome-ui overlay drawer.** chrome-ui `Drawer` is the left-rail `<aside>`. `RightPanel` and `OverlayMount` exist. Task 8 builds the docked drawer on `OverlayMount` + `useFocusTrap` (Gate 22 compliant) and does not invent a new primitive.
4. **A score exists, but the owner wants a checklist.** `pages/utils/seoScore.ts` `calculateSeoScore` feeds the "SEO (40)" tab chip (`PageSettingsDrawer.tsx:150-152`). The owner says: "Checklist/status, not an unexplained SEO %". The score is **deleted** (Task 6), not restyled.
5. **Indexing is edited in two places** (L3-011). They are the SEO tab's "Search indexing" select (`SeoTab.tsx:374-386`) and the Advanced tab's "Allow indexing" toggle (`AdvancedTab.tsx:59-76`). Both write `settings.seo.noIndex`.
   - The owner wants it in SEO only, with one stored value labelled "Allow search engines to index this page". Off means noindex **and** left out of the sitemap.
   - Board SEO-M5d draws "hidden-from-search" under Advanced. The owner wins: Advanced shows a link row ("Search indexing is set in SEO ›") instead.
   - The 10-04 plan's separate `sitemapExclude` flag is **not built**. One value is the whole contract (Q2).
6. **Sitemap exclusion is a regex over HTML.** `shared/seo/sitemap.ts:35` drops a page only if its rendered HTML contains a noindex robots meta. `publishPageSchema` (`shared/schemas/publish.ts:48-66`) has **no `pageId`**, so the worker cannot read page settings. Task 15 adds an optional `pageId`. The regex stays as the fallback for an old tab.
7. **URLs are `.html` everywhere** (L3-010).
   - `pageCanonicalUrl` returns `…/about.html`.
   - `buildVercelConfig` (`lib/publish-files.ts:135-170`) emits no `cleanUrls`.
   - Other `.html` builders: `engine/export/pageFiles.ts:57-58` (file names, correct as files), `SeoTab.tsx:126-134` (preview), `usePages.ts:395` (Copy link), and `server/services/cms.service.ts:632,712,932` (dynamic pages).
   - `SeoTab.tsx:37-39` `publicPath()` shows `/${slug}` without `.html`, so the drawer already shows two forms.
   - The host falls back to `"yoursite.com"` (`SeoTab.tsx:116`, `SocialTab.tsx:19`) only when no origin is known.
8. **The title order differs from the owner's.** `resolvePageTitle` (`SEOInjector.ts:24-39`) does this:
   1. own title → **wrapped in the template**;
   2. else the site default `metaTitle` (untemplated);
   3. else template(page name).

   Owner L3-036: page SEO title → site template → page title. Task 3 makes the page SEO title verbatim and keeps the site default title as the **home page's** fallback only (Q3).
9. **The pre-publish "SEO configured" check only looks at whether a template exists.** `publish.service.ts:97-102` warns if `metaTitleTemplate` is empty and passes otherwise. There is **no template input** in `SeoScreen.tsx` (454 lines), so the warning can never clear (L3-036). The owner wants each emitted title inspected, and says a template alone does not satisfy the check.
10. **Social has no X fields.** `SocialTab.tsx` (86 lines) has OG title, description and image only, plus one card preview. `pageSeoSchema` already types `twitterTitle/Description/Image/Card` (`shared/schemas/sites.ts:111-127`, passthrough).
11. **There is no canonical, schema type, keyphrase or Readability UI.** `AdvancedTab.tsx` (102 lines) has visibility, indexing, follow and head code. The `PageSEO.canonicalUrl` type exists.
12. **Language lives at site level only.** `projectSettings.seo.language`, filled from `Site.defaultLocale` (`BuildrikSyncProvider.ts:372,564`). There is no per-page language, so Readability evaluates against the site language.
13. **Fix plumbing exists but not for the drawer.** `UI_INSPECTOR_FOCUS_SECTION` (`events.ts:367`, handled by `inspector/hooks/usePropertyJump.ts`) focuses a section or property. `locateComment` (`sidebar/tabs/review/locate.ts:55`) switches page, selects and scrolls. `UI_PAGES_OPEN_SETTINGS {pageId, tab?}` (`events.ts:621`) opens the drawer. Nothing chains them behind a dirty guard yet.
14. **The JSON-LD Organization block** (`SEOInjector.ts:210-228`) is emitted only when social profiles exist. A page's `structuredData` passes through raw. The Site model has no `seoSchema` or `sitemapEnabled` (`prisma/schema.prisma:320-378`).
15. **Pages rows** (`PageRow.tsx`, 415 lines) show "● Unpublished" and a status chip, with nothing SEO-related.

## File Structure

| File | Responsibility | New / Modify |
|---|---|---|
| `prisma/schema.prisma`, `prisma/migrations/20261012100000_site_seo_sitemap_schema/migration.sql` | `Site.sitemapEnabled`, `Site.seoSchema` | Modify / Create |
| `packages/shared/schemas/sites.ts` | `pageSeoSchema` + `focusKeyphrase`, `schemaType`, `article`, `xCustomized`; canonical tightened | Modify |
| `packages/shared/schemas/seo-schema.ts` | `seoSiteSchemaSchema` (Organization / Person / LocalBusiness) | Create |
| `packages/shared/schemas/site-detail.ts`, `site-column-fields.ts` | settings update accepts the two columns | Modify |
| `packages/shared/schemas/publish.ts` | `publishPageSchema.pageId?` | Modify |
| `packages/shared/seo/urls.ts` | one resolver: `pageCanonicalUrl(origin, file, { clean })`, `publicPagePath` | Modify |
| `packages/shared/seo/titles.ts` | `resolveEmittedTitle`, `applyTitleTemplate`, `titleFindings` | Create |
| `packages/shared/seo/analysis.ts`, `readability.ts`, `text.ts`, `lang/en.ts`, `status.ts` | findings + FG-008 status | Create |
| `packages/shared/seo/jsonLd.ts` | `buildJsonLdGraph` (supported types only) | Create |
| `packages/shared/seo/sitemap.ts` | exclusion from settings + regex fallback, real lastmod | Modify |
| `packages/editor/src/engine/seo/extractSeoDocument.ts` | Composer page → `SeoDocument` | Create |
| `packages/editor/src/engine/export/SEOInjector.ts`, `ExportEngine.ts` | use `titles.ts`, X overrides, JSON-LD builder | Modify |
| `packages/editor/src/editor/shell/exportPublishPages.ts` | send `pageId` | Modify |
| `packages/editor/src/editor/sidebar/tabs/pages/page-settings/*` | drawer, tabs, guard, previews | Modify / Create |
| `packages/editor/src/editor/sidebar/tabs/pages/page-settings/previews/{SerpPreview,SocialCardPreview}.tsx` | approximate previews (reused by SeoScreen) | Create |
| `packages/editor/src/editor/sidebar/tabs/pages/page-settings/useSeoFindings.ts` | debounced live findings | Create |
| `packages/editor/src/editor/sidebar/tabs/pages/page-settings/seoFixHandoff.ts` | Fix → guard → locate → inspector focus | Create |
| `packages/editor/src/editor/sidebar/tabs/pages/components/PageRow.tsx` + `SeoStatusDot.tsx` | FG-008 dot | Modify / Create |
| `packages/editor/src/editor/sidebar/tabs/pages/utils/seoScore.ts` | **deleted** | Delete |
| `packages/editor/src/editor/sidebar/tabs/settings/screens/SeoScreen.tsx` + `settings/components/{TitleTemplateField,StructuredDataCard,SitemapCard,SeoPagesOverview}.tsx` | Site SEO | Modify / Create |
| `lib/publish-files.ts`, `lib/publish-html.ts` | cleanUrls, JSON-LD, sitemap from settings | Modify |
| `server/services/publish.service.ts` | per-emitted-title check; page rows read for the worker | Modify |
| `server/services/site-settings.service.ts`, `server/trpc/routers/site-detail.ts` | two new columns get/update | Modify |
| `server/services/cms.service.ts` | dynamic-page URLs via the resolver | Modify |

---

### Task 0: Bring the board ledger into the branch and confirm the boards resolve

**Files:**
- Create: `docs/design-jobs/SEO-M/LEDGER.md` (copy of `packages/editor/docs/design-blockers-2026-10-04-handoff.md` from the founder tree, read-only source)

- [ ] **Step 1:** Copy the file. `cp /Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/design-blockers-2026-10-04-handoff.md docs/design-jobs/SEO-M/LEDGER.md` (reading the founder tree is fine; never write there).
- [ ] **Step 2:** For each node below, run `node scripts/baseline/figma-mcp.mjs get_metadata '{"nodeId":"<id>"}'` (one call per node, mind the 200/day budget). Record "resolves / missing" in the ledger.

  | Board | Node |
  |---|---|
  | SEO-M1 | `8197:224150` |
  | SEO-M2a…d | `8197:224590`, `8197:225020`, `8197:225454`, `8197:225890` |
  | SEO-M3…d | `8198:225605`, `8198:226013`, `8198:226393`, `8198:226773` |
  | SEO-M4…c | `8198:227181`, `8198:227594`, `8198:228023` |
  | SEO-M5…d | `8198:228438`, `8198:228843`, `8198:229255`, `8198:229662` |
  | SEO-M6 / M6b | `8200:228777`, `8200:229123` |
  | SEO-M7 | `8200:229488` |
  | SEO-M8…d | `8200:229750`, `8200:230008`, `8200:230310`, `8200:230560` |
  | SEO-M9…d | `8200:230866`, `8200:231111`, `8200:231357`, `8200:231612` |
  | SEO-M10…d | `8200:231914`, `8200:232199`, `8200:232445`, `8200:232687` |
  | SEO-M11 | `8202:231195` |
  | SEO-M12 | `8202:231596` |
  | SEO check components | `8205:231793` |

- [ ] **Step 3:** Add a "Board vs owner 10-10" table to the ledger listing the four board edits the designer owes, so the visual loop compares against the corrected board:
  1. M1 footer reads "Cancel · Save" (FG-012).
  2. M5d has no indexing control under Advanced, only a link row (L3-011).
  3. Every preview URL is extensionless and the preview carries "Approximate preview" (L3-010, FG-009).
  4. A title-template field and live preview in M7 (L3-036; no board draws it).
- [ ] **Step 4:** Commit: `git add docs/design-jobs/SEO-M && git commit -m "docs(seo): SEO-M board ledger + owner 10-10 deltas"`

### Task 1: Contracts and the one migration (owner-applied)

**Files:**
- Modify: `prisma/schema.prisma` (model `Site`, after `robotsTxt` ~L352)
- Create: `prisma/migrations/20261012100000_site_seo_sitemap_schema/migration.sql`
- Create: `packages/shared/schemas/seo-schema.ts`
- Modify: `packages/shared/schemas/sites.ts:111-127`, `packages/shared/schemas/site-detail.ts`, `packages/shared/schemas/site-column-fields.ts`, `packages/shared/schemas/publish.ts:48-66`
- Modify: `server/services/site-settings.service.ts` (select + update), `packages/editor/src/shared/types/project.ts` (`PageSEO`, `SiteSEO`)
- Test: `packages/shared/schemas/__tests__/seo-schema.test.ts`, `__tests__/site-settings-seo-columns.test.ts`

**Interfaces:**
- Produces: `seoSiteSchemaSchema`, `type SeoSiteSchema`; `pageSeoSchema` keys `focusKeyphrase?: string`, `schemaType?: "WebPage" | "Article"`, `article?: { authorName?: string; datePublished?: string }`, `xCustomized?: boolean`; `canonicalUrl` absolute http(s) ≤2048; `publishPageSchema.pageId?: string`; `Site.sitemapEnabled: boolean` (default true), `Site.seoSchema: Json?`.

- [ ] **Step 1: Write the failing schema test**

```ts
// packages/shared/schemas/__tests__/seo-schema.test.ts
import { describe, it, expect } from "vitest";
import { seoSiteSchemaSchema } from "../seo-schema";
import { pageSeoSchema } from "../sites";
import { publishPageSchema } from "../publish";

describe("seoSiteSchemaSchema", () => {
  it("accepts an Organization with a logo", () => {
    expect(seoSiteSchemaSchema.parse({ entity: "Organization", name: "Acme", logoUrl: "https://cdn.x/logo.png" }).entity).toBe("Organization");
  });
  it("accepts a LocalBusiness subtype with address + hours", () => {
    const v = seoSiteSchemaSchema.parse({
      entity: "Organization", name: "Cafe",
      localBusiness: { enabled: true, businessType: "Restaurant", streetAddress: "1 Main", locality: "Town",
        postalCode: "123", country: "PK", telephone: "+92 300 0000000",
        openingHours: [{ days: ["Mo", "Tu"], opens: "09:00", closes: "17:00" }] },
    });
    expect(v.localBusiness?.businessType).toBe("Restaurant");
  });
  it("rejects a Person with a localBusiness block", () => {
    expect(() => seoSiteSchemaSchema.parse({ entity: "Person", name: "Ann", localBusiness: { enabled: true, businessType: "Store" } })).toThrow();
  });
  it("rejects opening hours that close before they open", () => {
    expect(() => seoSiteSchemaSchema.parse({ entity: "Organization", name: "X",
      localBusiness: { enabled: true, businessType: "Store", openingHours: [{ days: ["Mo"], opens: "18:00", closes: "09:00" }] } })).toThrow(/closes/);
  });
});

describe("pageSeoSchema additions", () => {
  it("round-trips keyphrase, schemaType, article, xCustomized", () => {
    const v = pageSeoSchema.parse({ focusKeyphrase: " wood fired pizza ", schemaType: "Article",
      article: { authorName: "Sam", datePublished: "2026-10-01T00:00:00.000Z" }, xCustomized: true });
    expect(v.focusKeyphrase).toBe("wood fired pizza");
    expect(v.schemaType).toBe("Article");
  });
  it("rejects a relative canonical", () => {
    expect(() => pageSeoSchema.parse({ canonicalUrl: "/about" })).toThrow();
  });
  it("accepts an empty canonical as 'this page'", () => {
    expect(pageSeoSchema.parse({ canonicalUrl: "" }).canonicalUrl).toBe("");
  });
});

describe("publishPageSchema", () => {
  it("accepts an optional pageId", () => {
    expect(publishPageSchema.parse({ path: "about.html", html: "<html></html>", pageId: "p1" }).pageId).toBe("p1");
    expect(publishPageSchema.parse({ path: "about.html", html: "<html></html>" }).pageId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails.** `pnpm vitest run packages/shared/schemas/__tests__/seo-schema.test.ts`. Expected: FAIL, "Cannot find module '../seo-schema'".
- [ ] **Step 3: Implement the schemas**

```ts
// packages/shared/schemas/seo-schema.ts
import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const DAY = z.enum(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
export const LOCAL_BUSINESS_TYPES = [
  "LocalBusiness", "Restaurant", "CafeOrCoffeeShop", "Bakery", "Store", "ClothingStore",
  "ProfessionalService", "LegalService", "AccountingService", "Dentist", "MedicalClinic",
  "BeautySalon", "HairSalon", "HealthClub", "HomeAndConstructionBusiness", "AutoRepair",
] as const;

const localBusinessSchema = z.object({
  enabled: z.boolean(),
  businessType: z.enum(LOCAL_BUSINESS_TYPES),
  streetAddress: z.string().trim().max(200).optional(),
  locality: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().regex(/^[A-Z]{2}$/).optional(),
  telephone: z.string().trim().max(40).optional(),
  priceRange: z.string().trim().max(20).optional(),
  openingHours: z.array(z.object({ days: z.array(DAY).min(1), opens: hhmm, closes: hhmm })
    .refine((h) => h.closes > h.opens, { message: "closes must be after opens", path: ["closes"] })).max(14).optional(),
});

export const seoSiteSchemaSchema = z.discriminatedUnion("entity", [
  z.object({ entity: z.literal("Organization"), name: z.string().trim().min(1).max(120),
    logoUrl: z.string().url().max(2048).optional(), localBusiness: localBusinessSchema.optional() }),
  z.object({ entity: z.literal("Person"), name: z.string().trim().min(1).max(120) }).strict(),
]);
export type SeoSiteSchema = z.infer<typeof seoSiteSchemaSchema>;
```

  In `sites.ts`, add these to `pageSeoSchema` (keep `.passthrough()`):

```ts
  focusKeyphrase: z.string().trim().max(100).optional(),
  schemaType: z.enum(["WebPage", "Article"]).optional(),
  article: z.object({ authorName: z.string().trim().max(100).optional(), datePublished: z.string().datetime().optional() }).optional(),
  xCustomized: z.boolean().optional(),
  canonicalUrl: z.union([z.literal(""), z.string().url().max(2048).refine((u) => /^https?:\/\//i.test(u), "Use a full https:// address")]).optional(),
```

  In `publish.ts`, add `pageId: z.string().min(1).max(64).optional(),` to `publishPageSchema`. In `site-detail.ts` `updateSiteSettingsSchema`, add `sitemapEnabled: z.boolean().optional(), seoSchema: seoSiteSchemaSchema.nullable().optional(),`. Register `seo.sitemapEnabled` and `seo.schema` in `site-column-fields.ts` the same way `seo.language` is registered.
- [ ] **Step 4: Run it and confirm it passes.** Same command. Expected: PASS.
- [ ] **Step 5: Prisma + migration.** Add these two lines to `model Site`:

```prisma
  sitemapEnabled Boolean @default(true)
  seoSchema      Json?
```

```sql
-- prisma/migrations/20261012100000_site_seo_sitemap_schema/migration.sql
-- Additive only. OWNER-APPLIED: `pnpm prisma migrate deploy` locally and on prod
-- BEFORE the deploy that reads these columns (siteDetail.settings.get selects them).
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "sitemapEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "seoSchema" JSONB;
```

  Run only `pnpm prisma generate`. Do **not** run migrate.
- [ ] **Step 6: Service test (mocked Prisma, same style as `__tests__/site-settings*.test.ts`).** Assert that `getSiteSettings` selects `sitemapEnabled` and `seoSchema`, and that `updateSiteSettings({ seoSchema })` stores the parsed object and `{ sitemapEnabled: false }` writes false. Then extend the service's `select` list and update map. `pnpm vitest run __tests__/site-settings-seo-columns.test.ts` → PASS.
- [ ] **Step 7: Mirror types.** In `packages/editor/src/shared/types/project.ts`, set `PageSEO` and `SiteSEO` from `z.infer` of the shared schemas where they line up, and add the new keys. `cd packages/editor && npx tsc --noEmit` → no new errors.
- [ ] **Step 8: Commit.** `git commit -m "feat(seo): contracts for keyphrase/schema/X/sitemap + additive Site migration (owner-applied)"`

### Task 2: One URL resolver with cleanUrls (L3-010)

**Files:**
- Modify: `packages/shared/seo/urls.ts`, `packages/shared/seo/__tests__/urls.test.ts`
- Modify: `lib/publish-files.ts:135-196` (`buildVercelConfig`, canonical call), `packages/editor/src/engine/export/ExportEngine.ts:853-863` (ZIP keeps `.html`)
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx:37-39,116,126-134`, `SocialTab.tsx:19`, `packages/editor/src/editor/sidebar/tabs/pages/hooks/usePages.ts:395`, `server/services/cms.service.ts:632,712,932`
- Test: `__tests__/publish-files-clean-urls.test.ts`

**Interfaces:**
- Produces: `pageCanonicalUrl(origin: string | null, file: string, opts?: { clean?: boolean }): string | null`. `clean` defaults to **true**, the Vercel publish form. The ZIP export passes `{ clean: false }`. Also `publicPagePath(file: string, opts?: { clean?: boolean }): string`, which returns the path part only, for UI that has no host.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/shared/seo/__tests__/urls.test.ts (append)
import { pageCanonicalUrl, publicPagePath } from "../urls";
describe("one URL resolver (L3-010)", () => {
  it.each([
    ["index.html", "https://a.com/"],
    ["about.html", "https://a.com/about"],
    ["blog/post.html", "https://a.com/blog/post"],
    ["blog/index.html", "https://a.com/blog"],
  ])("clean %s → %s", (file, url) => expect(pageCanonicalUrl("a.com", file)).toBe(url));
  it("ZIP/other hosts keep the file form", () => {
    expect(pageCanonicalUrl("a.com", "about.html", { clean: false })).toBe("https://a.com/about.html");
  });
  it("publicPagePath matches the canonical path", () => {
    expect(publicPagePath("about.html")).toBe("/about");
    expect(publicPagePath("index.html")).toBe("/");
  });
  it("still null without a host", () => expect(pageCanonicalUrl(null, "about.html")).toBeNull());
});
```

```ts
// __tests__/publish-files-clean-urls.test.ts
import { describe, it, expect } from "vitest";
import { buildDeployFiles } from "@lib/publish-files";
import { deployInputsFixture } from "./fixtures/deploy-inputs"; // create: minimal DeployInputs with 2 pages, verified domain a.com

describe("Vercel deploy uses clean URLs", () => {
  const files = buildDeployFiles(deployInputsFixture());
  it("vercel.json always carries cleanUrls: true", () => {
    const cfg = JSON.parse(files.find((f) => f.file === "vercel.json")!.data);
    expect(cfg.cleanUrls).toBe(true);
  });
  it("canonical and sitemap use the extensionless form", () => {
    const about = files.find((f) => f.file === "about.html")!.data;
    expect(about).toContain('<link rel="canonical" href="https://a.com/about"');
    expect(files.find((f) => f.file === "sitemap.xml")!.data).toContain("<loc>https://a.com/about</loc>");
  });
});
```

- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run packages/shared/seo/__tests__/urls.test.ts __tests__/publish-files-clean-urls.test.ts`. Expected: FAIL, because the URLs still end in `.html` and `cleanUrls` is undefined.
- [ ] **Step 3: Implement.** In `urls.ts`:

```ts
export function publicPagePath(file: string, opts: { clean?: boolean } = {}): string {
  const clean = file.replace(/^\/+/, "");
  if (clean === "" || clean === "index.html") return "/";
  if (opts.clean === false) return `/${clean}`;
  return `/${clean.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "")}`.replace(/\/+$/, "") || "/";
}

export function pageCanonicalUrl(domain: string | null, path: string, opts: { clean?: boolean } = {}): string | null {
  if (!domain) return null;
  const base = normalizeCanonicalOrigin(domain);
  if (!base) return null;
  const p = publicPagePath(path, opts);
  return p === "/" ? `${base}/` : `${base}${p}`;
}
```

  Update the file-header comment to "Vercel publishes with cleanUrls; ZIP export passes `{ clean: false }`". In `buildVercelConfig`, always return a config that includes `cleanUrls: true`, so drop the `return null` branch. `ExportEngine.ts`'s ZIP sitemap passes `{ clean: false }` through `buildSitemapXml(origin, pages, { clean: false })` (add the option to `sitemap.ts`). In `SeoTab.tsx`, delete `publicPath()` and use `publicPagePath(servedFile)` for the slug-change text, so the drawer shows one form. `usePages.ts:395` (Copy link) and `cms.service.ts` dynamic-page URLs call `pageCanonicalUrl` / `publicPagePath` instead of string-building `.html`.
- [ ] **Step 4: Run them and confirm they pass,** plus the existing suites: `pnpm vitest run packages/shared/seo __tests__/publish-files __tests__/publish-service.test.ts packages/editor/src/editor/sidebar/tabs/pages`. Update any old assertion that expected `.html` in a **URL** (not a file name) in this commit.
- [ ] **Step 5: Live check (dev, no publish).** Open `/edit/<id>` for a site with a verified domain. Page settings → the preview URL shows `https://<domain>/about`. Pages ⋯ → Copy link pastes the same string. Note the measured strings in the commit body.
- [ ] **Step 6: Commit.** `git commit -m "feat(seo): one URL resolver; Vercel publishes cleanUrls (L3-010)"`

### Task 3: One title resolver in shared (L3-036 order)

**Files:**
- Create: `packages/shared/seo/titles.ts`, `packages/shared/seo/__tests__/titles.test.ts`
- Modify: `packages/editor/src/engine/export/SEOInjector.ts:24-70` (delegate), `packages/editor/src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts:67-75` (inherited title)

**Interfaces:**
- Produces:
  - `resolveEmittedTitle(input: { pageName: string; isHome: boolean; seoTitle?: string; settingsTitle?: string; site: { metaTitle?: string | null; metaTitleTemplate?: string | null; siteName?: string | null } }): { title: string; source: "page-seo" | "home-default" | "template" | "page-name" }`
  - `applyTitleTemplate(title: string, template?: string | null, siteName?: string | null): string`

- [ ] **Step 1: Write the failing test**

```ts
// packages/shared/seo/__tests__/titles.test.ts
import { describe, it, expect } from "vitest";
import { resolveEmittedTitle } from "../titles";
const site = { metaTitle: "Acme — Home of good things", metaTitleTemplate: "{page_title} · Acme", siteName: "Acme" };

describe("resolveEmittedTitle — owner order L3-036", () => {
  it("page SEO title wins verbatim (not templated)", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, seoTitle: "About our bakery", site }))
      .toEqual({ title: "About our bakery", source: "page-seo" });
  });
  it("then the site template applied to the page title", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, site }).title).toBe("About · Acme");
  });
  it("then the bare page title when no usable template", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, site: { metaTitleTemplate: "Acme" } }))
      .toEqual({ title: "About", source: "page-name" });
  });
  it("home page with no SEO title uses the site default title", () => {
    expect(resolveEmittedTitle({ pageName: "Home", isHome: true, site }).source).toBe("home-default");
  });
  it("legacy settings.title counts as the page's own title", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, settingsTitle: "Legacy", site }).title).toBe("Legacy");
  });
  it("never returns empty", () => {
    expect(resolveEmittedTitle({ pageName: "", isHome: false, site: {} }).title).toBe("Untitled");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails** (module missing). `pnpm vitest run packages/shared/seo/__tests__/titles.test.ts`
- [ ] **Step 3: Implement**

```ts
// packages/shared/seo/titles.ts
export type TitleSource = "page-seo" | "home-default" | "template" | "page-name";
export interface TitleInput {
  pageName: string; isHome: boolean; seoTitle?: string; settingsTitle?: string;
  site: { metaTitle?: string | null; metaTitleTemplate?: string | null; siteName?: string | null };
}
export function applyTitleTemplate(title: string, template?: string | null, siteName?: string | null): string {
  const t = template?.trim();
  if (!t || !t.includes("{page_title}")) return title;
  return t.replace(/\{page_title\}/g, title).replace(/\{site_name\}/g, siteName ?? "").trim();
}
export function resolveEmittedTitle(i: TitleInput): { title: string; source: TitleSource } {
  const own = i.seoTitle?.trim() || i.settingsTitle?.trim();
  if (own) return { title: own, source: "page-seo" };
  const homeDefault = i.isHome ? i.site.metaTitle?.trim() : "";
  if (homeDefault) return { title: homeDefault, source: "home-default" };
  const name = i.pageName.trim() || "Untitled";
  const templated = applyTitleTemplate(name, i.site.metaTitleTemplate, i.site.siteName);
  return templated !== name ? { title: templated, source: "template" } : { title: name, source: "page-name" };
}
```

  `SEOInjector.resolvePageTitle` becomes a call to `resolveEmittedTitle(...).title`. It keeps its exported name because ExportEngine and the drawer import it. Delete the local `applyTitleTemplate`. `usePageSettings` shows the inherited title from the same function, and the drawer's title field placeholder reads "Uses: <resolved title>".
- [ ] **Step 4: Run it and confirm it passes,** plus `npx vitest run src/engine/export` in `packages/editor`. Rewrite any SEOInjector test that asserted "own title wrapped in template" in the same commit, and say why in the commit body (owner order).
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): one title resolver — page SEO title → template → page title (L3-036)"`

### Task 4: Pre-publish check inspects each emitted title (L3-036)

**Files:**
- Modify: `server/services/publish.service.ts:25-105` (`runPrePublishChecks`)
- Create: `packages/shared/seo/__tests__/titleFindings.test.ts`
- Modify: `packages/shared/seo/titles.ts` (add `titleFindings`)
- Test: `__tests__/publish-prechecks-titles.test.ts`

**Interfaces:**
- Produces: `titleFindings(pages: Array<{ id: string; name: string; title: string; noIndex: boolean }>): Array<{ pageId: string; kind: "empty" | "too-long" | "duplicate" | "untitled"; message: string }>`.
- The check row is still labelled `"SEO configured"`. It is `status: "warning"` with the per-page detail when there are findings, and `"pass"` with "Every page has a usable search title." otherwise. **A template's presence no longer matters.**

- [ ] **Step 1: Write the failing tests.** `titleFindings` must flag: an empty title, `"Untitled"`, more than 60 characters (`too-long`; the copy says "may be cut off in search results", an approximation), and the same title on two indexable pages (`duplicate`, named on both). Noindex pages are skipped. In `publish-prechecks-titles.test.ts`, use mocked Prisma returning a site with `metaTitleTemplate: "{page_title} · Acme"` and two pages named "Home" + "Home". Assert that the row is `warning` with "2 pages share the title …" and that the old string "No meta title template set" never appears.
- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run packages/shared/seo/__tests__/titleFindings.test.ts __tests__/publish-prechecks-titles.test.ts`
- [ ] **Step 3: Implement `titleFindings`.** Normalise case and whitespace for the duplicate check. In `runPrePublishChecks`, select `pages: { select: { id, name, isHomePage, settings } }` alongside the existing fields. Inside the service, build each title with `resolveEmittedTitle` from `settings.seo.metaTitle`, `settings.title` and the site columns. Map the findings to the row detail, at most 3 named pages then "and N more". Keep the label string `"SEO configured"` because `PublishTab.tsx:92-98` `FIX_TARGETS` keys on it. Its Fix still opens Settings › SEO, where Task 5 adds the template field.
- [ ] **Step 4: Run them and confirm they pass,** plus `pnpm vitest run __tests__/publish-service.test.ts server/services/__tests__/publish-prechecks-visibility.test.ts`. Update assertions on the old template-presence copy in this commit.
- [ ] **Step 5: Commit.** `git commit -m "feat(publish): SEO check inspects every emitted title; template alone no longer passes (L3-036)"`

### Task 5: Site title template field with preview (L3-036)

**Figma:** SEO-M7 `8200:229488` (Defaults card layout). No board draws the template field. Ledger item 4 asks the designer to add it. Until it lands, build the field in the Defaults card's field pattern and mark the Figma loop **pending board** in the PR. Do not invent a new layout.

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/settings/components/TitleTemplateField.tsx`, `__tests__/TitleTemplateField.test.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/screens/SeoScreen.tsx:286-331` (Defaults card), its flush handler (`:221-252`)

**Interfaces:**
- Consumes: `applyTitleTemplate` (Task 3).
- Produces: `<TitleTemplateField value onChange siteName samplePageTitle />`. The empty value means "no template".

- [ ] **Step 1: Write the failing test.**
  - Type `{page_title} | {site_name}` and the preview line reads `About | Acme`.
  - Type `Acme` (no token) and the helper error reads "Include {page_title} so each page keeps its own title", while the preview shows the bare page title.
  - The "Insert {page_title}" and "Insert {site_name}" chips (chrome-ui `Button size="xs"`) append the token at the caret.
- [ ] **Step 2: Run it and confirm it fails.** `cd packages/editor && npx vitest run src/editor/sidebar/tabs/settings/components/__tests__/TitleTemplateField.test.tsx`
- [ ] **Step 3: Implement it** with chrome-ui `TextInput`, `Label`, `HelperText` and `Button`, plus `tw:` utilities and `--bk-*` tokens. Wire it into SeoScreen's Defaults card under "Title". The flush writes `metaTitleTemplate` through the existing `siteDetail.settings.update` (the column already exists). Dirty state joins the screen's existing footer Discard/Save.
- [ ] **Step 4: Run it and confirm it passes,** plus `npx vitest run src/editor/sidebar/tabs/settings`.
- [ ] **Step 5: Live check.** Settings › SEO, then type a template, then Save. Reload and the value persists. Open the Publish panel and the "SEO configured" row reflects the per-title findings: it does not turn green just because a template exists.
- [ ] **Step 6: Commit.** `git commit -m "feat(settings): site title template with live preview (L3-036)"`

### Task 6: Findings analyzer, FG-008 status, and deletion of the score

**Files:**
- Create: `packages/shared/seo/{text.ts,analysis.ts,status.ts}` + `__tests__/{analysis,status}.test.ts`
- Create: `packages/editor/src/engine/seo/extractSeoDocument.ts` + `__tests__/extractSeoDocument.test.ts`
- Delete: `packages/editor/src/editor/sidebar/tabs/pages/utils/seoScore.ts` (+ its test). Move `isPlaceholderSlug` into `analysis.ts`.
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts:17,77-80`, `PageSettingsDrawer.tsx:150-152` (score chip removed)

**Interfaces:**
- Produces:

```ts
export interface SeoBlock { elementId: string; kind: "heading" | "paragraph" | "image" | "link" | "button"; level?: number; text?: string; alt?: string; href?: string; internal?: boolean; cmsBound?: boolean; uncheckedHtml?: boolean }
export interface SeoDocument { title: string; titleSource: TitleSource; description: string; slugFile: string; keyphrase?: string; locale: string; noIndex: boolean; blocks: SeoBlock[] }
export type FindingRating = "problem" | "improvement" | "good";
export interface Finding { id: string; rating: FindingRating; text: string; elementId?: string; fix?: { kind: "field"; field: "title" | "description" | "slug" | "keyphrase" } | { kind: "element"; elementId: string; section: string; property?: string } }
export function analyzeSeo(doc: SeoDocument, ctx: { otherPages: Array<{ id: string; title: string; keyphrase?: string }> }): Finding[];
export type SeoStatus = "not-checked" | "needs-attention" | "no-issues" | "hidden";
export function seoStatus(findings: Finding[] | null, opts: { noIndex: boolean }): SeoStatus;
export const SEO_STATUS_LABEL: Record<SeoStatus, string>; // "Not checked" | "Needs attention" | "No issues detected" | "Hidden from search"
export function extractSeoDocument(composer: Composer, pageId: string, site: SiteSeoInput): SeoDocument; // editor engine
```

- [ ] **Step 1: Write the failing tests.** Use the check ids and thresholds from `docs/plans/2026-10-04-seo-yoast-plan.md` §4.2, mapped bad → `problem`, ok → `improvement`, good → `good`.
  - Without a keyphrase there are **no** keyphrase findings, only one `improvement` "Add a focus keyphrase to see keyphrase checks (optional)". The keyphrase is optional per the owner.
  - `single-h1` with two H1s is a `problem` whose `elementId` is the second H1, with `fix.kind === "element"`, `section: "typography"`.
  - `image-alt` points at the first image without alt and has `fix: { kind: "element", section: "media", property: "alt" }`. Decorative images (`data.decorative` or `alt=""`) are not flagged, which matches `contentIssues.ts:104-129`.
  - `title-length` reads `doc.title` (the **emitted** title from Task 3), not the raw field.
  - `seoStatus(null)` is `"not-checked"`; any `problem` or `improvement` gives `"needs-attention"`; all good gives `"no-issues"`; `noIndex` gives `"hidden"` regardless.
  - `extractSeoDocument` on a fixture composer (heading h1, two images with one alt missing, a `contentFormat:"html"` block) yields blocks in document order. The html block becomes `{ uncheckedHtml: true }`, so the analyzer adds a single `improvement` "Some custom HTML wasn't checked". It never claims "no issues" for unseen content.
- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run packages/shared/seo` and `cd packages/editor && npx vitest run src/engine/seo`
- [ ] **Step 3: Implement.**
  - `text.ts`: word and sentence split, English stem-lite keyphrase match. `analysis.ts`: one function per check id, collected in a table so tests can iterate it.
  - `extractSeoDocument` walks `composer.elements.getPage(pageId)` with the type mapping in `shared/utils/html/typeMapping.ts`. It resolves `{{site.var}}`, marks CMS-bound nodes (`data-cms-bound`) as `cmsBound`, and takes `title` from `resolveEmittedTitle`.
  - Delete `seoScore.ts` and the score chip. Rewrite `usePageSettings.test.ts`'s score assertions as findings assertions in this commit.
- [ ] **Step 4: Run them and confirm they pass,** plus the whole pages folder suite.
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): shared findings analyzer + FG-008 status; delete unexplained score"`

### Task 7: Readability with "Not evaluated" outside supported languages

**Files:**
- Create: `packages/shared/seo/readability.ts`, `packages/shared/seo/lang/en.ts`, `__tests__/readability.test.ts`

**Interfaces:**
- Produces: `analyzeReadability(doc: SeoDocument): { evaluated: boolean; reason?: "language" | "empty" | "cms-template"; findings: Finding[] }` and `READABILITY_LANGUAGES = ["en"] as const`.

- [ ] **Step 1: Write the failing tests.**
  - `locale: "fr"` returns `evaluated: false, reason: "language"`, and the **language-neutral** findings (sentence length, paragraph length, subheading distribution, consecutive starts) are still present. The drawer shows "Not evaluated for French" above them.
  - Fewer than 50 words returns `evaluated: false, reason: "empty"`.
  - All blocks `cmsBound` returns `reason: "cms-template"`.
  - For an English fixture paragraph with known values: Flesch is computed, and passive voice is ≥10% → `improvement`.
- [ ] **Step 2: Run it and confirm it fails.** `pnpm vitest run packages/shared/seo/__tests__/readability.test.ts`
- [ ] **Step 3: Implement it** with the §4.2 readability thresholds of the 10-04 plan and a 30-line syllable heuristic (no GPL dependency, per owner Q1).
- [ ] **Step 4: Run it and confirm it passes.**
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): readability — English + language-neutral checks, Not evaluated otherwise"`

### Task 8: Right-docked drawer with staged Cancel / Save and one unsaved guard (FG-012)

**Figma:** SEO-M1 `8197:224150` (container, header, tab row, footer), SEO-M6b `8200:229123` (guard).

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/page-settings/PageSettingsDrawer.tsx`, `UnsavedWarningModal.tsx`, `usePageSettings.ts:184-267`, `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:461-481`
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/types.ts:15` (`DrawerTab` gets `"readability"`)
- Test: rewrite `__tests__/PageSettingsDrawer.done.test.tsx` → `PageSettingsDrawer.save.test.tsx`; extend `UnsavedWarning.exits.test.tsx`

**Interfaces:**
- Produces:
  - `type GuardChoice = "save" | "discard" | "stay"`.
  - `usePageSettings` gains `requestExit(next: () => void): void`. This one guard entry point runs `next` immediately when clean. When dirty it opens the guard with three actions: "Save and continue", "Discard and continue", "Stay".
  - Every exit uses it: header ✕, Esc, **Cancel** (dirty → guard), the page switch (`UI_PAGES_OPEN_SETTINGS` for another page while open), the "Site SEO defaults ›" link, and Fix (Task 13).
  - `save(): Promise<{ ok: true } | { ok: false; error: string }>` never closes on failure.

- [ ] **Step 1: Write the failing tests.**
  - The drawer root has `role="dialog"`, `aria-modal="false"` and is docked right. Assert the class `bd-pg-drawer--docked` and that **no scrim element** is rendered.
  - The footer buttons are exactly `["Cancel", "Save"]` and "Done" is absent.
  - Save while clean is disabled. Save while dirty calls `composer.elements.updatePage` once and keeps the drawer open with "Saved". The board's footer status line reads "Unsaved changes" when dirty.
  - Opening settings for page B while A is dirty shows the guard. "Stay" keeps A. "Discard and continue" opens B with A's values reverted.
  - With `updatePage` mocked to throw, "Save and continue" keeps the drawer on A, shows the inline error "Couldn't save. Your changes are still here." and does **not** run `next`.
- [ ] **Step 2: Run them and confirm they fail.** `cd packages/editor && npx vitest run src/editor/sidebar/tabs/pages/page-settings`
- [ ] **Step 3: Implement.**
  - Mount through `OverlayMount` (Gate 22). Use `useFocusTrap` only while the guard is open. The drawer itself is non-modal so the canvas stays usable (M6 needs it).
  - CSS: `position: fixed; top: var(--bk-size-topbar); right: 0; bottom: 0; width: <M1 width>`, covering the inspector column. Measure the width from the board in the Figma loop; do not guess.
  - Remove the scrim rules.
  - ⌘S stays as save without closing. Delete the decision #20 comment and replace it with "FG-012 (owner 2026-10-10): staged Cancel/Save supersedes #20".
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop.** Board `8197:224150` vs live at 1440×900 with the drawer open on Home. Iterate until they match by eye. Check the footer label against the ledger delta (Cancel · Save). Then `8200:229123` for the guard.
- [ ] **Step 6: Live done-condition.**
  - The canvas stays clickable to the left of the drawer.
  - Edit the title, press Cancel, choose "Stay", then Save. Reload and the title persists.
  - Edit, open another page's settings from Pages ⋯, choose "Discard and continue", and the first page is unchanged after reload.
  - Measure the drawer's `getBoundingClientRect()` and record right edge = 1440.
- [ ] **Step 7: Commit.** `git commit -m "feat(pages): docked Page settings drawer, staged Cancel/Save, one unsaved guard (FG-012)"`

### Task 9: SEO tab (keyphrase, approximate SERP, findings, single indexing home)

**Figma:** M1 `8197:224150`, M2a `8197:224590` (no keyphrase), M2b `8197:225020` (mobile), M2c `8197:225454` (noindex), M2d `8197:225890` (title too long). Check row components are in `8205:231793`.

**Files:**
- Create: `page-settings/previews/SerpPreview.tsx`, `page-settings/FindingsList.tsx`, `page-settings/useSeoFindings.ts` + tests
- Modify: `page-settings/SeoTab.tsx` (505 lines; split so the file keeps one job: fields + composition)

**Interfaces:**
- Consumes: `extractSeoDocument`, `analyzeSeo`, `seoStatus` (Task 6), `resolveEmittedTitle` (Task 3), `pageCanonicalUrl` (Task 2).
- Produces:
  - `useSeoFindings(pageId, draft): { findings: Finding[] | null; status: SeoStatus; stale: boolean }`. Debounced 400 ms on `ELEMENT_UPDATED` / `PROJECT_CHANGED` for that page. `stale` is true between a change and the recompute.
  - `<SerpPreview title url description device="desktop" | "mobile" />` always renders the caption "Approximate preview".
  - `<FindingsList findings onFix />` groups Problems · Improvements · Good results, with Good collapsed by default.

- [ ] **Step 1: Write the failing tests.**
  - Typing a keyphrase makes the keyphrase rows appear within one debounce tick (fake timers).
  - The Desktop/Mobile toggle changes the preview's `data-device`.
  - The preview URL equals `pageCanonicalUrl(origin, file)` (no `.html`). With no origin the host text is "your-site" in muted style and an inline "Connect a domain to see your real address" appears. The placeholder "yoursite.com" is removed.
  - The tab shows **one** indexing control, a chrome-ui `ToggleSwitch` labelled "Allow search engines to index this page". Turning it off shows the M2c banner "Hidden from search · left out of the sitemap" and dims the findings.
  - A title over 60 characters truncates in the preview with an ellipsis, and the `title-length` row is a problem (M2d).
  - The tab label shows the FG-008 status text, never a number.
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run src/editor/sidebar/tabs/pages/page-settings`
- [ ] **Step 3: Implement** with chrome-ui `TextInput`, `Textarea`, `ToggleSwitch`, `Badge` and `Button`. The preview uses Inter and tokens only and does not imitate Google's font. Remove the "reach 80+" banner.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** for M1, M2a, M2b, M2c and M2d, one by one at 1440×900. Rewrite `SeoTab.test.tsx` assertions on the score or select in this commit.
- [ ] **Step 6: Live done-condition.**
  - In the running editor, type the keyphrase "pizza" on a page whose H1 contains it. "Keyphrase in title" changes rating within 0.5 s, measured with `performance.now()` around the input event.
  - Turn indexing off, Save, reload. The toggle is still off and the Pages dot reads "Hidden from search" (after Task 14).
- [ ] **Step 7: Commit.** `git commit -m "feat(seo): SEO tab — keyphrase, approximate SERP, findings checklist, one indexing control (FG-007, L3-011)"`

### Task 10: Readability tab

**Figma:** M3 `8198:225605`, M3b `8198:226013` (unsupported language), M3c `8198:226393` (empty), M3d `8198:226773` (CMS template).

**Files:**
- Create: `page-settings/ReadabilityTab.tsx` + `__tests__/ReadabilityTab.test.tsx`
- Modify: `PageSettingsDrawer.tsx` (tab row: SEO · Readability · Social · Advanced)

- [ ] **Step 1: Write the failing tests.** There are four states, mapped one to one from `analyzeReadability`:
  - default list;
  - "Not evaluated for <Language name>" note with neutral findings below;
  - "Add some text to this page to check readability";
  - "Template page — checked on sample text".

  Language names come from `Intl.DisplayNames(["en"], { type: "language" })`. The tab label shows the status word, or "Not evaluated".
- [ ] **Step 2: Run it and confirm it fails.**
- [ ] **Step 3: Implement it** with `FindingsList` from Task 9.
- [ ] **Step 4: Run it and confirm it passes.**
- [ ] **Step 5: Figma loop** for M3, M3b, M3c and M3d. For M3b, switch the site language to French in Settings › Languages and verify live.
- [ ] **Step 6: Commit.** `git commit -m "feat(seo): Readability tab with Not evaluated states (FG-007)"`

### Task 11: Social tab — shared values with "Customize for X" (FG-011)

**Figma:** M4 `8198:227181` (linked), M4b `8198:227594` (independent X), M4c `8198:228023` (site-default image).

**Files:**
- Create: `page-settings/previews/SocialCardPreview.tsx` + test
- Modify: `page-settings/SocialTab.tsx`, `usePageSettings.ts` (track `xCustomized`, `twitterTitle/Description/Image`), `packages/editor/src/engine/export/SEOInjector.ts` (twitter:* from overrides when `xCustomized`)
- Test: `__tests__/SocialTab.test.tsx` (rewrite), `src/engine/export/__tests__/SEOInjector.x.test.ts`

**Interfaces:**
- Behaviour contract (owner FG-011):
  - X defaults to the shared values.
  - "Customize for X" initialises the X fields **from** the current shared values.
  - Toggling back off **keeps** the custom values in storage (they are only ignored on export).
  - Every field shows a label "Inherited" or "Customized".

- [ ] **Step 1: Write the failing tests.**
  - Toggle on and the X title field equals the OG title.
  - Edit X title to "X only", toggle off, toggle on, and "X only" is back.
  - Export with `xCustomized:false` and `twitterTitle:"X only"` emits `twitter:title` = OG title.
  - Export with `xCustomized:true` emits "X only".
  - With no page image the preview shows the site default OG image with a "Site default" tag (M4c).
  - Both previews carry "Approximate preview".
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run src/editor/sidebar/tabs/pages/page-settings src/engine/export`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** for M4, M4b and M4c.
- [ ] **Step 6: Commit.** `git commit -m "feat(seo): Social tab — Customize for X, inherited/customized labels (FG-011)"`

### Task 12: Advanced tab — canonical validation, schema type, indexing link

**Figma:** M5 `8198:228438`, M5b `8198:228843` (article), M5c `8198:229255` (invalid canonical), M5d `8198:229662`. Use M5d **with the ledger delta**: a link row instead of a control.

**Files:**
- Modify: `page-settings/AdvancedTab.tsx` (102 lines), `usePageSettings.ts`
- Test: `__tests__/AdvancedTab.test.tsx` (rewrite indexing assertions)

- [ ] **Step 1: Write the failing tests.**
  - The "Allow indexing" toggle is gone. A row "Search indexing is set in SEO ›" switches to the SEO tab and focuses the toggle. "Follow links" stays here.
  - Canonical: empty shows the placeholder "This page's own address". `"/about"` shows the inline error from `pageSeoSchema` ("Use a full https:// address") and disables Save. A cross-site canonical shows the note "Search engines will treat <host> as the original".
  - Schema type: chrome-ui `Select` with Web page / Article. Article reveals Author (placeholder from site `seo.author`) and Published date. The helper says "Adds structured data describing this page. It doesn't guarantee how search results look."
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it** and delete the stale header line "canonical URL comes later".
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** for M5, M5b, M5c and M5d.
- [ ] **Step 6: Commit.** `git commit -m "feat(seo): Advanced — validated canonical, schema type; indexing lives in SEO (FG-007, L3-011)"`

### Task 13: Fix hand-off to the element and Inspector control (FG-010)

**Figma:** M6 `8200:228777` (image alt highlighted), M6b `8200:229123` (dirty guard).

**Files:**
- Create: `page-settings/seoFixHandoff.ts` + `__tests__/seoFixHandoff.test.ts`
- Modify: `page-settings/FindingsList.tsx` (Fix buttons), `usePageSettings.ts` (`requestExit`)

**Interfaces:**
- Consumes: `requestExit` (Task 8), `locateComment(composer, { pageId, targetSelector })` (`review/locate.ts:55`), `EVENTS.UI_INSPECTOR_FOCUS_SECTION { section, property? }`.
- Produces: `runSeoFix(composer, finding, ctx: { pageId; requestExit; recompute: () => Finding[] }): "done" | "stale" | "cancelled"`.

- [ ] **Step 1: Write the failing tests.**
  - Clean drawer: Fix on `image-alt` closes the drawer, then `locateComment`, then emits `UI_INSPECTOR_FOCUS_SECTION { section: "media", property: "alt" }` **after** selection (assert the event order).
  - Field fix (`fix.kind === "field"`) stays in the drawer and focuses the field.
  - Dirty plus "Stay" means nothing happens.
  - Dirty plus "Save and continue" with a failing save keeps the user in the drawer with the error.
  - The target element was deleted after analysis: `runSeoFix` returns `"stale"`, calls `recompute`, and the list re-renders without that row. No locate call is made.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it.** Before acting, re-check the element with `composer.elements.getById(finding.elementId)`.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** for M6 and M6b.
- [ ] **Step 6: Live done-condition.**
  - Remove an image's alt on the canvas and open Page settings. "Add alt text …" is a problem.
  - Click Fix. The drawer closes, the image is selected, and `document.activeElement` is the Inspector alt input (assert via `getAttribute("data-property")` or the field's label).
  - Repeat with an unsaved title edit, choose "Save and continue", and the title persists after reload.
- [ ] **Step 7: Commit.** `git commit -m "feat(seo): Fix hand-off to element + Inspector control behind unsaved guard (FG-010)"`

### Task 14: Pages panel SEO status dot (FG-008)

**Figma:** M11 `8202:231195`.

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/pages/components/SeoStatusDot.tsx`, `pages/hooks/useSiteSeoStatuses.ts` + tests
- Modify: `pages/components/PageRow.tsx:363-372`

**Interfaces:**
- Produces: `useSiteSeoStatuses(): Map<pageId, { status: SeoStatus; stale: boolean; findings: Finding[] | null }>`. It is computed lazily in `requestIdleCallback` per page, from the **same** `extractSeoDocument` + `analyzeSeo` as the drawer. When the drawer is open it reads that page's live entry. The Settings overview (Task 16) consumes the same hook.

- [ ] **Step 1: Write the failing tests.**
  - Before the first idle run the dot's accessible name is "SEO: Not checked".
  - After it, the name is "SEO: Needs attention · 2 problems" or "SEO: No issues detected".
  - Editing the page marks `stale` and renders the board's stale marker (hollow dot) plus "· out of date" in the accessible name until recompute.
  - Clicking the dot opens the drawer on the SEO tab (`UI_PAGES_OPEN_SETTINGS { pageId, tab: "seo" }`).
  - Colour is never the only signal: an `aria-label` is always set and the tooltip text equals it.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** for M11.
- [ ] **Step 6: Live done-condition.** On a 3-page site, each dot's `aria-label` matches the status word shown in that page's drawer tab. Read both in the same session and record them.
- [ ] **Step 7: Commit.** `git commit -m "feat(pages): SEO status dot sharing drawer findings (FG-008)"`

### Task 15: Publish — pageId, supported-type JSON-LD, sitemap from settings

**Files:**
- Create: `packages/shared/seo/jsonLd.ts` + `__tests__/jsonLd.test.ts`
- Modify: `packages/shared/seo/sitemap.ts` (+ test), `packages/editor/src/editor/shell/exportPublishPages.ts` (send `pageId`), `lib/publish-files.ts` (`DeployInputs.pageMeta`, `sitemapEnabled`, `seoSchema`), `lib/publish-html.ts` (`injectJsonLd`), `server/services/publish.service.ts` (a `loadPublishPageMeta(siteId, ids)` read for the worker; **not** a new Prisma read in the route), `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:365-386` (pass the service result through), `packages/editor/src/engine/export/SEOInjector.ts:207-228` (drop its Organization block; ZIP calls `buildJsonLdGraph` when it has an origin)
- Test: `__tests__/publish-files-jsonld-sitemap.test.ts`

**Interfaces:**
- Produces: `buildJsonLdGraph(input: { origin: string; siteName: string; schema: SeoSiteSchema | null; socialLinks: string[]; page: { url: string; title: string; isHome: boolean; schemaType?: "WebPage" | "Article"; article?: {...}; description?: string; image?: string; updatedAt?: string }; breadcrumb?: Array<{ name: string; url: string }> }): object | null`.
- **Supported types only** (owner FG-009):
  - Organization or Person when `schema` is set. LocalBusiness subtype when `localBusiness.enabled` **and** street, locality and country are present. Otherwise the business block is omitted rather than emitted half-empty.
  - WebSite on home.
  - WebPage, or Article only when `schemaType === "Article"`.
  - BreadcrumbList only for pages inside a folder.
  - Nothing is emitted when there is no origin. Without `schema`, no Organization is emitted, even with social links. That is a behaviour change from `SEOInjector.ts:210-228`; see Q5.
- `buildSitemapXml(origin, pages: Array<{ path; html?; noIndex?: boolean; updatedAt?: string }>, opts?: { clean?: boolean })`. It excludes `noIndex === true` and, when `noIndex` is undefined (an old tab with no `pageId`), falls back to the regex. `lastmod` is per page.

- [ ] **Step 1: Write the failing tests.**
  - Exactly one Organization node per page graph.
  - A LocalBusiness without an address emits Organization only.
  - Article `headline` is ≤110 characters.
  - Every `url`/`@id` equals `pageCanonicalUrl(origin, file)` (clean).
  - `</script` in a name is escaped.
  - Sitemap: a page with `noIndex: true` and **no** robots meta in its HTML is excluded. Without `noIndex` the regex still works. `sitemapEnabled:false` writes no `sitemap.xml` and no `Sitemap:` line.
  - `publishPagesFromComposer` output includes `pageId` for every page.
- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run packages/shared/seo __tests__/publish-files-jsonld-sitemap.test.ts` and `cd packages/editor && npx vitest run src/editor/shell src/engine/export`
- [ ] **Step 3: Implement.** `injectJsonLd(html, graph)` inserts one `<script type="application/ld+json">` before `</head>`. A user's raw `structuredData` stays as its own script.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Deploy-output check without publishing.**
  - ZIP-export a 4-page fixture site (home, about, one folder page with Article, one noindex page) from a **local dev site**. Unzip it and check that `sitemap.xml` lists 3 pages with `.html` locs (ZIP form). The noindex page is absent. Each page has one `ld+json` graph.
  - Run `pnpm tsx scripts/seo/dry-deploy.ts <siteId>`, a **new dev-only script** that calls `buildDeployFiles` from DB rows and writes `./tmp/deploy/` without uploading. Confirm the same with clean URLs and `vercel.json` `cleanUrls: true`. Paste outputs in the PR.
  - **No publish from the QA workspace.**
- [ ] **Step 6: Commit.** `git commit -m "feat(publish): pageId, supported-type JSON-LD graph, sitemap from page settings (FG-009, L3-011)"`

### Task 16: Settings › SEO — previews, structured data, sitemap, pages overview, canonical copy

**Figma:**
- M7 `8200:229488` (defaults with previews)
- M8 `8200:229750`, M8b `8200:230008`, M8c `8200:230310`, M8d `8200:230560` (structured data)
- M9 `8200:230866`, M9b `8200:231111`, M9c `8200:231357`, M9d `8200:231612` (sitemap)
- M10 `8200:231914`, M10b `8200:232199`, M10c `8200:232445`, M10d `8200:232687` (overview)
- M12 `8202:231596` (canonical copy)

**Files:**
- Create: `settings/components/StructuredDataCard.tsx`, `SitemapCard.tsx`, `SeoPagesOverview.tsx` + tests
- Modify: `settings/screens/SeoScreen.tsx` (compose cards; flush adds `sitemapEnabled`, `seoSchema`), `packages/dashboard/components/site-detail/seo-tab.tsx` (read-only summary rows: sitemap on/off, structured-data entity)

**Interfaces:**
- Consumes: `SerpPreview`, `SocialCardPreview` (Tasks 9 and 11), `useSiteSeoStatuses` (Task 14), `seoSiteSchemaSchema` (Task 1), `siteOrigin` (existing).

- [ ] **Step 1: Write the failing tests** (one file per card).
  - Defaults previews render from the defaults plus the home page and say "Approximate preview".
  - Structured data:
    - The Organization/Person segmented control hides the logo and local business for Person.
    - LocalBusiness requires street, locality and country before Save. A field error shows under the field (M8d), using zod messages mapped through the screen's existing `SCREEN_FIELD_ERROR`.
    - The helper copy says "Describes your business to search engines. It doesn't guarantee how results look."
  - Sitemap:
    - Published shows the link `${origin}/sitemap.xml`. Unpublished shows "Available after you publish". Site indexing off disables the switch with "No sitemap while search indexing is off".
    - **Manage (M9d)** lists the pages hidden from search, each with "Open SEO ›". It is read-only, because the one stored value lives on the page (Q2). Board M9d draws checkboxes; that delta is in the ledger.
  - Overview: rows page · keyphrase · SEO status · readability status · Open. A loading row, then "No pages yet". Sorted worst first by default (M10d). Statuses equal the Pages dots.
  - M12 copy under Canonical: "Leave empty to use your verified primary domain."
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run src/editor/sidebar/tabs/settings`
- [ ] **Step 3: Implement.** Everything saves through the footer Save, which keeps the "applies on next publish" scope line.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** for each listed node, in order M7 → M12.
- [ ] **Step 6: Live done-condition.**
  - Save a LocalBusiness and turn the sitemap off. Reload. `siteDetail.settings.get` in DevTools shows `sitemapEnabled:false` and the business. The dry-deploy script then shows no `sitemap.xml`.
  - The overview statuses equal the three Pages dots.
- [ ] **Step 7: Commit.** `git commit -m "feat(settings): Site SEO — previews, structured data, sitemap, pages overview (FG-009)"`

### Task 17: QA walk and not-verified list

**Files:**
- Create: `docs/audits/2026-10-08-editor-full-audit/status-p4-seo.md` (report only; no product files)

- [ ] **Step 1:** Run `/qa` over the whole flow on the running dev app (a local workspace, **not** a publish from QA). Walk: Pages dot → drawer → each tab → Fix → guard → Settings › SEO → each card → ZIP export → dry-deploy script.
- [ ] **Step 2:** Mark each of FG-007, FG-008, FG-009, FG-010, FG-011, FG-012, L3-010, L3-011 and L3-036 as LIVE-VERIFIED with the measurement, or as NOT VERIFIED with the reason. Always list as not verified: a real Vercel deploy of cleanUrls (owner step), non-English readability beyond the "Not evaluated" state, and the Google Rich Results Test.
- [ ] **Step 3:** Commit: `git commit -m "docs(audits): P4 SEO milestone live verification"`

---

## Owner questions (recommended defaults in bold)

| # | Question | Recommendation |
|---|---|---|
| Q1 | The footer verbs: the owner said "Cancel / Save" while board M1 says "Discard / Save". | **Cancel / Save** (owner words). The designer updates M1. |
| Q2 | L3-011's "one stored value" vs the 10-04 per-page `sitemapExclude` (Q11 then). | **Drop `sitemapExclude`.** Indexing off means noindex and out of the sitemap. Sitemap › Manage becomes a read-only list of hidden pages. |
| Q3 | Where does the site default title go in the owner order? | **Home page fallback only**, after its own SEO title and before the template. |
| Q4 | Who runs the real-deploy cleanUrls check, given QA must not publish? | **The owner**, in a named non-QA test workspace, after the migration is applied. Agents stop at the dry-deploy. |
| Q5 | Stop emitting Organization JSON-LD from social links alone? | **Yes.** Emit it only when Structured data is filled in (a supported type backed by real content). |

## Migrations

`20261012100000_site_seo_sitemap_schema`: additive, two Site columns. **Owner-applied** with `pnpm prisma migrate deploy`, locally and on prod, before the deploy that ships Task 1's service select.

# Template↔Site Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix + complete the template↔site flow. Root cause (confirmed via `/investigate` 2026-07-22): template & AI page content stores raw HTML in `element.content` without `contentFormat:"html"`, so `ExportEngine.ts:682` `escapeHTML()`s it → the published/previewed site shows escaped tags, not the design. Plus two missing pieces: no "apply template to an existing site", and a site never records which template it came from.

**Architecture:** Three parts, buildable in order. ① is a bug fix (editor export sink + generators). ② is a schema/data relation. ③ is a new feature (mutation + service + UI). Data flow stays Page → tRPC → Router → Service → Prisma.

**Tech Stack:** Next.js 16, tRPC 11, Prisma 5, React 19, editor engine (`packages/editor`).

## Global Constraints

- Single accent `#406ED6`; DESIGN.md tokens only for any UI.
- Data flow Page → Router → Service → Prisma; no layer skips.
- Prisma schema is SSOT; migrations via `prisma migrate`.
- `applyTemplateToSite` REPLACES a site's pages — it is destructive; it MUST go through a typed/confirmed dialog.
- Commit after each task. Solo → `main`.
- The editor engine has its own DS gates (`packages/editor`) — run `npm run verify:ds` there if touching chrome (Part ① touches the engine export, not chrome, but re-run tsc for the editor package).

---

## Part ① — Publish/preview no longer escapes raw-HTML content (the bug)

### Task 1: ExportEngine renders raw-HTML content instead of escaping it

**Files:**
- Modify: `packages/editor/src/engine/export/ExportEngine.ts:680-683` (the content-format branch)
- Test: `packages/editor/src/engine/export/__tests__/ExportEngine.formats.test.ts` (add a raw-HTML-without-contentFormat case)

**Interfaces:** the export content sink now treats content as HTML when `contentFormat === "html"` OR the content contains a real HTML tag and no explicit `contentFormat` was set.

- [ ] **Step 1: Read `ExportEngine.ts:670-700`** to see the exact function (the `contentFormat`/`content` handling around lines 680-692) and how `sanitizeHTML` / `escapeHTML` are imported.

- [ ] **Step 2: Write the failing test.** In `ExportEngine.formats.test.ts`, add: a page whose element has `content: "<h1>Hi</h1>"` and NO `contentFormat`. Assert the exported HTML contains `<h1>Hi</h1>` (rendered), NOT `&lt;h1&gt;`.

```ts
it("renders raw-HTML content that omits contentFormat (template/AI seed shape)", async () => {
  // element: { id, type:"container", tagName:"section", content:"<h1>Hi</h1>", children:[] } with NO contentFormat
  // ...build the minimal doc the other tests in this file use...
  const html = result.files.find((f) => f.name === "index.html")!.content;
  expect(html).toContain("<h1>Hi</h1>");
  expect(html).not.toContain("&lt;h1&gt;");
});
```

- [ ] **Step 3: Run it — must FAIL** (`escapeHTML` turns it into `&lt;h1&gt;`).

`cd packages/editor && npx vitest run src/engine/export/__tests__/ExportEngine.formats.test.ts`

- [ ] **Step 4: Fix the branch.** Change the content sink (around line 682) so unset `contentFormat` with tag-shaped content is sanitized, not escaped:

```ts
// Was: if (contentFormat !== "html") return escapeHTML(content);
//      return sanitizeHTML(content);
const looksLikeHtml = /<[a-z][\s\S]*>/i.test(content);   // a real tag, not "a < b"
if (contentFormat === "html" || (contentFormat == null && looksLikeHtml)) {
  return sanitizeHTML(content);   // preserves the markup, strips dangerous nodes
}
return escapeHTML(content);
```

Apply the SAME change to the mirror branch at `ExportEngine.ts:249` if it has the identical escape logic (read it first; only change it if it is the same content sink). Do NOT change `ReactExporter.ts` in this task (separate export target; note it for a follow-up).

- [ ] **Step 5: Run the test — PASS.** Then run the full ExportEngine suite to check no regression (existing tests asserting escaping of *plain text* must still pass — the heuristic only fires on tag-shaped content):

`cd packages/editor && npx vitest run src/engine/export/__tests__/`

- [ ] **Step 6: Commit** `fix(editor): export renders raw-HTML element content instead of escaping it (template/AI publish)`

### Task 2: Generators stamp `contentFormat:"html"` going forward

**Files:**
- Modify: `server/services/ai-generation.service.ts` (wherever it builds page blocks with raw-HTML `content`)
- Modify: the template seed source (find it: `grep -rln "seed-hero\|buildrick-page-root" server prisma scripts packages`) — the seed that writes template `pages[].blocks`

- [ ] **Step 1: Find where each generator writes an element with raw-HTML `content`.** For AI generation, that's where it converts model output → blocks. For templates, the seed script.

- [ ] **Step 2: Set `contentFormat: "html"` on every element whose `content` is raw HTML** at write time (belt-and-suspenders with Task 1's sink fix). If the seed is a static JSON/TS fixture, add `contentFormat: "html"` to each content-bearing element.

- [ ] **Step 3: tsc + commit** `fix(content): generators mark raw-HTML element content with contentFormat:html`

> Note: no data backfill migration — Task 1's sink fix renders existing sites correctly at export time, so already-seeded templates and already-published AI sites are fixed without touching their stored JSON.

---

## Part ② — Site records its source template

### Task 3: `Site.templateId` relation

**Files:**
- Modify: `prisma/schema.prisma` (Site + Template)
- Create: migration `prisma/migrations/<ts>_site_template_id`
- Modify: `server/services/template.service.ts` `useTemplate` (set `templateId`)

- [ ] **Step 1: Add the relation.** On `Site`: `templateId String?` + `template_ Template? @relation(fields:[templateId], references:[id], onDelete: SetNull)` (name the relation field so it doesn't collide with the existing `template String?` SEO-ish field — check that field's real use first with `grep -rn "site.template\b" server`). On `Template`: `sites Site[]`. (If the existing `Site.template String?` is dead, a follow-up can drop it — do NOT drop it in this task.)

- [ ] **Step 2: Generate + apply the migration** (dev DB): `npx prisma migrate dev --name site_template_id --schema prisma/schema.prisma`. Additive nullable column — safe.

- [ ] **Step 3: Set it in `useTemplate`** — add `templateId: template.id` to the `prisma.site.create({ data })`.

- [ ] **Step 4: tsc + commit** `feat(sites): track a site's source template (Site.templateId)`

---

## Part ③ — Apply a template to an existing site

### Task 4: `applyTemplateToSite` service + router

**Files:**
- Modify: `server/services/template.service.ts` (new `applyTemplateToSite`)
- Modify: `server/trpc/routers/templates.ts` (new `applyToSite` mutation)
- Modify: `packages/shared/schemas/templates.ts` (input schema)
- Test: `server/services/__tests__/template-clone.test.ts` (add applyTemplateToSite cases)

**Interfaces:**
- `applyTemplateToSite(workspaceId, userId, siteId, templateId): Promise<Site>` — REPLACES the site's pages with the template's (delete existing pages, create from template pages), sets `Site.templateId`, `creationMethod` stays, bumps `lastEditedAt`, updates `pages` count. Workspace-scoped auth (the site + template must belong to / be visible to the workspace). Wrapped in a `prisma.$transaction`.
- Router `templates.applyToSite` (protectedProcedure): input `{ siteId, templateId }`, resolves workspaceId, calls the service, maps errors (SITE_NOT_FOUND → NOT_FOUND, TEMPLATE_NOT_FOUND → NOT_FOUND).

- [ ] **Step 1: Write the failing service test** — applyTemplateToSite replaces pages: given a site with 2 pages and a template with 3 pages, after apply the site has exactly the template's 3 pages (old pages gone), and `site.templateId === template.id`. Mirror the prisma-mock pattern already in `template-clone.test.ts`.

- [ ] **Step 2: Implement `applyTemplateToSite`** in `template.service.ts` — reuse the page-cloning logic from `useTemplate` (extract a shared `pagesFromTemplate(template, siteId)` helper so the two paths don't duplicate — DRY). In a transaction: verify site belongs to workspace + template is visible; `prisma.page.deleteMany({ where: { siteId } })`; `prisma.page.createMany` from template pages; `prisma.site.update` set `templateId`, `pages` count, `lastEditedAt`.

- [ ] **Step 3: Add the `applyToSite` mutation** to `templates.ts` router + the `applyTemplateToSiteSchema` (`{ siteId: z.string(), templateId: z.string() }`) to `packages/shared/schemas/templates.ts`.

- [ ] **Step 4: Run the service test — PASS.** tsc.

- [ ] **Step 5: Commit** `feat(templates): applyTemplateToSite — replace an existing site's pages with a template`

### Task 5: Apply-template UI on site-detail

**Files:**
- Modify: `packages/dashboard/components/site-detail/site-header.tsx` (or the site-detail actions) — add an "Apply template" action
- Create: `packages/dashboard/components/site-detail/apply-template-modal.tsx` — template picker + destructive confirm
- Modify: the site-detail page to host the modal

- [ ] **Step 1: Add an "Apply template" entry** in the site-detail action cluster (the "More" menu or a button). It opens the apply-template modal for the current `siteId`.

- [ ] **Step 2: Build `ApplyTemplateModal`** — lists templates (`trpc.templates.list`), lets the user pick one, then a **destructive confirm** step ("This replaces all pages of <site> with <template>. This can't be undone." + a confirm button). On confirm → `trpc.templates.applyToSite.mutate({ siteId, templateId })` → on success toast + refresh the site (invalidate the site/pages queries) and/or route to the editor. Reuse the `Modal` + `Button` primitives and the states components; DESIGN.md tokens only.

- [ ] **Step 3: tsc + live-verify (authed browser)** — on a site's detail page, "Apply template" → pick a template → confirm → the site's pages are replaced; opening the editor shows the template's content; publishing/preview renders it (Part ① fix) not escaped.

- [ ] **Step 4: Commit** `feat(site-detail): apply a template to an existing site (destructive, confirmed)`

---

## Task 6: Final gate + end-to-end verify

- [ ] **Step 1:** `npx tsc --noEmit -p packages/dashboard/tsconfig.json` (dashboard) + `cd packages/editor && npx tsc --noEmit` (editor) — both clean.
- [ ] **Step 2:** affected vitest: editor export suite + `server/services/__tests__/template-clone.test.ts`.
- [ ] **Step 3: Live end-to-end (authed browser):**
  - New site from template → editor shows content → **publish/preview renders the design (not escaped tags)** [Part ① — the original bug].
  - Site-detail → Apply template → confirm → existing site's pages replaced [Part ③].
  - The site shows it's linked to its template (templateId set) [Part ②].
- [ ] **Step 4:** commit any verification fixes.

---

## Self-Review

**Coverage:** ① Task 1 (sink) + Task 2 (generators); ② Task 3 (relation); ③ Task 4 (service/router) + Task 5 (UI); gate Task 6. ✓
**Blast radius honesty:** ~12 files across editor engine + server + dashboard + prisma migration. Confirmed >5 — this is why it's a plan, not an ad-hoc fix.
**Risk notes:** Task 1's HTML heuristic (`/<[a-z][\s\S]*>/i`) must not fire on plain text like "a < b" (space) — the existing plain-text export tests guard this; if any break, tighten the regex. Task 4 is destructive (deleteMany pages) — transaction + the confirm dialog (Task 5) are mandatory. Task 3's relation field must not collide with the pre-existing `Site.template String?`.

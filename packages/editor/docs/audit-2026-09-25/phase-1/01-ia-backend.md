# Audit 1 — backend ownership closure evidence

Date: 2026-09-25. Scope: information architecture ownership only. This appendix resolves two questions deferred by `INVENTORY.md`: the separate root `src` files and CMS-generated page ownership. No production changes, tests, browser sessions or deployments were performed for this appendix. **NOT RUNTIME VERIFIED.**

## Root `src` reachability

**Classification: detached source artifacts outside the established application import chain. Status: VERIFIED by static import analysis; runtime bundle verification not performed.**

| Root file | Incoming import evidence | Classification |
| --- | --- | --- |
| `src/editor/sidebar/tabs/settings/screens/ExportScreen.tsx` | No resolved incoming import found | Detached export-screen source; not the active editor Settings ownership location |
| `src/editor/wizard/PageWizard.tsx` | No resolved incoming import found | Detached wizard source; not an active editor entrypoint |
| `src/editor/wizard/sectionData.ts` | Sole incoming import: `src/editor/wizard/PageWizard.tsx:90` uses `import("./sectionData")` | Dependency of the detached wizard |

Evidence method:

1. Listed source files with `rg --files --hidden`, retaining `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs` and excluding `.git`, `node_modules`, `.next`, `dist`, `coverage`, `playwright-report` and `test-results`. This discovered **3,290** source files at this time, including nonignored support files.
2. Parsed all 3,290 files using the installed TypeScript parser. Collected string-literal module specifiers from import declarations, export declarations, `import(...)` and `require(...)` calls. Resolved them using `ts.resolveModuleName`, with editor/dashboard/root `tsconfig.json` options chosen by importer location. Filtered resolved paths to the three exact root targets.
3. Result: one inbound edge total, `PageWizard.tsx:90 → sectionData.ts`. No inbound edges to either component.
4. Supplementary repository source search for `PageWizard`, `sectionData`, `ExportScreen`, `import.meta.glob`, and `require.context` found definitions/internal wizard import and tooling string references. It did not identify an application loader importing these files. Tool references such as `packages/editor/eslint.config.mjs:52` are configuration strings relative to the editor package, not imports of the root copy.

The files also reference missing relative dependencies at their root locations: `src/editor/wizard/PageWizard.tsx:9` points to root `src/engine`; `src/editor/wizard/sectionData.ts:8` points to root `src/templates/SectionTemplates`; `src/editor/sidebar/tabs/settings/screens/ExportScreen.tsx:7` points to root `src/engine/export/ExportEngine`. TypeScript module resolution returned no target for these. They must not be used as implementation proof for live features.

The root `tsconfig.json:31` still includes broad `**/*.ts` and `**/*.tsx`, so detached from the application graph does **not** mean excluded from every possible root tooling invocation. Static string import discovery also does not prove absence of arbitrary computed runtime loading; none was established in the reviewed entry/configuration paths.

Established entrypoints remain `packages/dashboard/components/editor-route/EditorClient.tsx:8 → @buildrik/editor`, `packages/editor/package.json:7 → src/index.ts`, `packages/editor/src/index.ts:39 → AquibraStudio`, and the separate demo at `packages/editor/demo/main.tsx:9`. Root `src` does not substitute for any of these package-local paths.

## CMS versus Pages ownership

**Classification: CMS collections own the dynamic-page configuration and record source; the server publish pipeline derives generated HTML routes. Generated routes are not authored Page records in the traced generation path. Status: VERIFIED by source trace; generation/deployment behavior not runtime verified.**

### Configuration and persistence chain

```text
CMS / Content dynamic-pages view
  → composer.cms.collections.updateCollection
  → local collection storage + CMS_COLLECTION_UPDATED
  → useCmsSync subscription
  → cmsSync client.cms.collections.upsert
  → tRPC cms.collections.upsert
  → cms.service upsertCollection
  → Prisma CmsCollection

CMS record create/update/publish
  → collection manager event
  → useCmsSync / cmsSync entry upsert
  → tRPC cms.entries.upsert
  → cms.service upsertEntry
  → Prisma CmsEntry
```

| Ownership seam | Source evidence |
| --- | --- |
| Content panel edits URL pattern | `packages/editor/src/editor/sidebar/tabs/content/ContentTab.tsx:308` selects DynamicPagesView; `:320` updates `pageSlugPattern` on the collection |
| Setup modal can also set template/SEO binding | `packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:226` writes `pageSlugPattern`, `pageTemplatePath`, `pageSeoTitle`, `pageSeoDescription` |
| Local CMS state and event ownership | `packages/editor/src/engine/cms/CollectionManager.ts:132` updates the collection; `:147` saves collection storage; `:149` emits the update event |
| Shell attaches server mirroring | `packages/editor/src/editor/shell/AquibraStudio.tsx:219` invokes `useCmsSync`; `packages/editor/src/editor/shell/hooks/useCmsSync.ts:86` forwards collection/record events; `:91` subscribes |
| Client transport owns mirrored binding | `packages/editor/src/services/cmsSync.ts:164` starts collection upsert; `:179` sends slug pattern and `:182` template path |
| Shared contract | `packages/shared/schemas/cms.ts:19` defines collection upsert; dynamic binding fields begin at `:30`; record payload/status starts at `:49` |
| Server router | `server/trpc/routers/cms.ts:61` handles collection upsert; `:109` handles record upsert; each delegates to the CMS service |
| Server persistence | `server/services/cms.service.ts:34` maps collection fields; `:53` performs Prisma collection upsert; `:83` begins entry upsert |
| Physical persistence ownership | `prisma/schema.prisma:427` defines CmsCollection with bindings at `:439`; `:456` defines CmsEntry. Physical mappings are `cms_collections` and `cms_entries` |

Content's dynamic view uses collection state and records (`packages/editor/src/editor/sidebar/tabs/content/ContentTab.tsx:311`); it does not create editor pages. The ordinary Pages list reads `composer.elements.getAllPages()` at `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:103`.

### Generation and published output chain

```text
Editor exports authored pages to {path, html}
  → PublishService sites.publish
  → sites router startPublish
  → appendDynamicPagesToPublish
      select collections with slug pattern + template path
      match template path against supplied exported pages
      generate HTML file per PUBLISHED CMS record
      append derived {path, html} to publish payload
  → persist expanded payload in PublishBuildJob.log.pages
  → Next publish worker reads job payload
  → buildDeployFiles → runVercelDeploy
```

- `packages/editor/src/editor/shell/exportPublishPages.ts:38` exports authored pages through ExportEngine and returns path/HTML data. `packages/editor/src/services/PublishService.ts:59` defines publishSite and `:68` sends `sites.publish`.
- `server/trpc/routers/sites.ts:319` owns the publish API. It passes `input.pages` to `startPublish` at `:337`.
- `server/services/publish.service.ts:329` calls `appendDynamicPagesToPublish(siteId, pages)` when a payload exists.
- `server/services/cms.service.ts:229` implements appendDynamicPagesToPublish. It selects collections with non-null slug pattern and template path at `:233`, finds the matching template among the supplied pages at `:240`, and calls generation at `:242`. Missing template matches are skipped by this implementation; assessing UX or functional consequences belongs to the relevant later audit.
- `server/services/cms.service.ts:187` implements generateDynamicPages. It reads collection metadata, reads only `PUBLISHED` CmsEntry rows at `:198`, substitutes record values into the supplied HTML, and returns `{path, content}` at `:217`. The caller appends `{path, html}` to its result at `:243`.
- Neither generation function writes `prisma.page` or calls an editor PageManager. Their generated route representation is an array of output files.
- `server/services/publish.service.ts:333` creates the publish job; `:340` stores the expanded pages in `PublishBuildJob.log`. Thus output is retained as publish-job payload, not generated Page rows by this path.
- `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:62` loads the job, `:68` reads its pages payload, `:390` calls `buildDeployFiles`, and `:426` calls `runVercelDeploy`. Dashboard hosts the backend route even though authoring occurs in the editor package.
- CMS also exposes `cms.dynamicPages` and `cms.generateDynamicPages` at `server/trpc/routers/cms.ts:81` and `:92`. The former resolves slug/SEO metadata; the latter returns rendered files. Their presence is not evidence of a separate dashboard CMS authoring screen. Searches of dashboard app/components found no direct `trpc.cms` UI consumer in this snapshot.

### IA closure implication

For the ownership map, list authored page hierarchy under **Pages**, CMS collections/records and generated-route configuration under **CMS / Content**, and generated route emission under **Publish → server CMS expansion**. Do not count each CMS-generated URL as a second authored editor page or assign root `src` artifacts live feature ownership. This conclusion classifies responsibilities only; discoverability, state accuracy, generation correctness, permissions and deployment success still require their assigned audit categories.

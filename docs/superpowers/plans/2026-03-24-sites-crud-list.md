# Sub-Project 3: Sites CRUD + List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full sites management system — list page (SITE-1/2) with grid/list views, folders, filtering, sorting, bulk operations; site CRUD (create, rename, duplicate, archive, delete); context menu (SITE-5); create new site modal (SITE-3).

**Architecture:** Backend uses tRPC `sitesRouter` calling `sites.service.ts` + `folder.service.ts`. Frontend pages at `app/dashboard/sites/`. Each visual section is its own component in `components/sites/`. Data flow: Page → tRPC query/mutation → Router → Service → Prisma.

**Tech Stack:** tRPC 11, Prisma 5, React 19, Tailwind CSS 4, Lucide React, Zod, Vitest

**PRD Reference:** Sections 5.8 (SITE-3), 5.9-5.12 (Sites List), 9.3 (Sites API), 9.6 (Bulk/Slug)

---

## File Structure

### Files to Create

| File | Responsibility |
|------|---------------|
| `lib/validations/sites.ts` | Zod schemas for site inputs/outputs |
| `server/services/sites.service.ts` | Site CRUD business logic |
| `server/services/folder.service.ts` | Folder CRUD business logic |
| `server/trpc/routers/sites.ts` | tRPC router for sites + folders |
| `components/sites/site-grid.tsx` | Grid view of site cards |
| `components/sites/site-list-view.tsx` | Table/list view of sites |
| `components/sites/site-card-full.tsx` | Full site card for grid (hover overlay) |
| `components/sites/site-filters.tsx` | Filter bar with status chips, sort dropdown |
| `components/sites/folder-tabs.tsx` | Folder tab bar |
| `components/sites/bulk-action-bar.tsx` | Floating bulk action bar |
| `components/sites/context-menu.tsx` | SITE-5 right-click/dropdown menu |
| `components/sites/create-site-modal.tsx` | SITE-3 new site modal |
| `components/sites/rename-modal.tsx` | Inline rename modal |
| `components/sites/delete-confirm-modal.tsx` | Type-to-confirm delete |
| `components/sites/view-toggle.tsx` | Grid/List view toggle |
| `app/dashboard/sites/page.tsx` | Full sites list page (replace placeholder) |
| `__tests__/sites-service.test.ts` | Service tests |
| `__tests__/sites-components.test.ts` | Component tests |

### Files to Modify

| File | Change |
|------|--------|
| `server/trpc/router.ts` | Add sitesRouter to appRouter |

---

## Task 1: Sites Zod Schemas

**Files:**
- Create: `lib/validations/sites.ts`

Schemas needed:
- `createSiteSchema`: name (2-100), method (blank|template|ai), templateId?
- `renameSiteSchema`: name (2-100)
- `deleteSiteSchema`: confirmName (must match site name)
- `listSitesSchema`: page?, perPage?(default 12), status?(DRAFT|PUBLISHED|ARCHIVED), sort?(lastEdited|name|created|traffic|pages|published), search?, folderId?
- `createFolderSchema`: name (1-50)
- `bulkActionSchema`: action (archive|delete|unarchive|publish|unpublish), siteIds (string array, max 25)
- Type exports for all

Commit: `feat: add sites Zod validation schemas`

---

## Task 2: Sites Service (TDD)

**Files:**
- Create: `server/services/sites.service.ts`
- Test: `__tests__/sites-service.test.ts`

Test cases:
- `listSites(workspaceId, filters)` — returns paginated sites with total count
- `createSite(workspaceId, userId, {name, method})` — creates site with auto-generated slug, checks plan limit (402 SITE_LIMIT)
- `getSite(siteId)` — returns full site
- `renameSite(siteId, name)` — updates site name
- `duplicateSite(siteId, workspaceId, userId)` — clones site as draft, checks plan limit
- `archiveSite(siteId)` — sets status ARCHIVED
- `unarchiveSite(siteId)` — sets status DRAFT
- `deleteSite(siteId, confirmName)` — verifies name match, soft-deletes
- `bulkAction(workspaceId, {action, siteIds})` — executes bulk operation, returns succeeded/failed arrays

Service implementation uses:
- `prisma` for DB access
- `PLAN_LIMITS` for limit checks
- `slugify()` helper for slug generation (lowercase, hyphens, strip special chars)
- Plan limit check: count workspace sites, compare to plan limit

Commit: `feat: add sites service with CRUD, duplicate, bulk operations (TDD)`

---

## Task 3: Folder Service (TDD)

**Files:**
- Create: `server/services/folder.service.ts`
- Test (append to): `__tests__/sites-service.test.ts`

Test cases:
- `listFolders(workspaceId)` — returns folders with site counts
- `createFolder(workspaceId, name)` — creates folder, validates unique name per workspace
- `deleteFolder(folderId)` — deletes folder, sites move to ungrouped (folderId=null)
- `moveSiteToFolder(siteId, folderId)` — updates site.folderId

Commit: `feat: add folder service with CRUD and move operations (TDD)`

---

## Task 4: Sites tRPC Router

**Files:**
- Create: `server/trpc/routers/sites.ts`
- Modify: `server/trpc/router.ts`

Router procedures:
- `list` (query): protectedProcedure, input listSitesSchema, calls listSites
- `get` (query): protectedProcedure, input z.object({id: z.string()}), calls getSite
- `create` (mutation): protectedProcedure, input createSiteSchema, calls createSite
- `rename` (mutation): protectedProcedure, input z.object({id, name}), calls renameSite
- `duplicate` (mutation): protectedProcedure, input z.object({id}), calls duplicateSite
- `archive` (mutation): protectedProcedure, input z.object({id}), calls archiveSite
- `unarchive` (mutation): protectedProcedure, input z.object({id}), calls unarchiveSite
- `delete` (mutation): protectedProcedure, input z.object({id, confirmName}), calls deleteSite
- `bulk` (mutation): protectedProcedure, input bulkActionSchema, calls bulkAction
- `folders.list` (query): list workspace folders
- `folders.create` (mutation): create folder
- `folders.delete` (mutation): delete folder
- `folders.moveSite` (mutation): move site to folder

Register as `sites` in appRouter.

Commit: `feat: add sites tRPC router with CRUD, bulk, folder operations`

---

## Task 5: Sites UI Components (TDD)

**Files:**
- Create all components/sites/ files
- Test: `__tests__/sites-components.test.ts`

Test cases:
- `VIEW_MODES` exports grid and list
- `SORT_OPTIONS` has 6 sort options matching PRD
- `BULK_ACTIONS` has 6 actions matching PRD
- `CONTEXT_MENU_ITEMS` has 11 items matching SITE-5
- `STATUS_FILTER_OPTIONS` has 3 statuses

Components to create:

### view-toggle.tsx
Toggle between grid/list. Export VIEW_MODES = [{value:"grid", icon:"LayoutGrid"}, {value:"list", icon:"List"}].

### site-filters.tsx
Export SORT_OPTIONS array (6 options per PRD). Export STATUS_FILTER_OPTIONS. Component renders status chip filters + sort dropdown + search input.

### site-card-full.tsx
Full site card for grid: thumbnail placeholder, name, status badge, slug URL, page count, visitor count, edit time, hover overlay with [Edit] + [Manage] buttons + [...] context menu trigger.

### site-grid.tsx
Renders grid of SiteCardFull components. Handles selection (checkbox on each card).

### site-list-view.tsx
Table view: columns for Name, Status, Pages, Visitors, Domain, Folder, Last Edited, Actions. Sortable column headers. Row selection checkboxes.

### folder-tabs.tsx
Tab bar: All Sites (N) | {Folder} (N) | Archived (N). Active tab styling. Create folder button (+ icon).

### bulk-action-bar.tsx
Export BULK_ACTIONS array (6 per PRD). Floating bar when >= 1 selected. Shows selection count + action buttons. Renders at bottom center.

### context-menu.tsx
Export CONTEXT_MENU_ITEMS array (11 per SITE-5). Dropdown menu positioned relative to trigger. Each item has icon + label. Destructive items (Archive, Delete) in red.

### create-site-modal.tsx
SITE-3 modal: site name input with slug preview (auto-generated, live availability check placeholder), 3 creation method cards (Template, AI, Blank). 480px wide. Close on X/Cancel/Escape.

### rename-modal.tsx
Simple modal: current name pre-filled input, Save/Cancel buttons.

### delete-confirm-modal.tsx
Destructive modal: warning icon, type site name to confirm, Delete/Cancel buttons.

Commit: `feat: add sites UI components — grid, list, filters, folders, bulk actions, modals`

---

## Task 6: Wire Up Sites List Page

**Files:**
- Modify: `app/dashboard/sites/page.tsx`

Replace placeholder with full page that:
1. Uses `trpc.sites.list.useQuery()` with filter/sort state
2. Uses `trpc.sites.folders.list.useQuery()` for folder tabs
3. Renders: header with "My Sites" + "+ New Site" button + view toggle
4. Folder tabs below header
5. Filter bar (status chips + sort + search)
6. Grid or List view based on toggle state
7. Bulk action bar when sites selected
8. Create site modal triggered by "+ New Site"
9. Loading skeleton state
10. Empty state when no sites

Commit: `feat: wire up sites list page with grid/list, folders, filters, bulk ops (SITE-1/2/3/5)`

---

## Task 7: Final Integration Verification

Run all tests: `npx vitest run`
Expected: All pass

Commit: `feat: complete Sub-Project 3 — sites CRUD + list`

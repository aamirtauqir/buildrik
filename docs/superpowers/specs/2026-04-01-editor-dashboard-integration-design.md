# Editor–Dashboard Integration Design (Revised after CEO Review)

**Date:** 2026-04-01
**Scope:** Phased monorepo integration — persistence contract first, then structure
**Review:** CEO Review (EXPANSION mode) + Codex outside voice

---

## Goal

Integrate the editor module with the dashboard so sites created in the dashboard can be edited in the editor. Both share the same backend APIs and auth session. No code rewrite on either side.

---

## Key Findings from Review

1. **Editor saves whole ProjectData snapshots** (not page deltas). The editor's Composer exports entire project state via `exportProject()`. This means the persistence contract is project-level, not page-level.
2. **Editor already has sync infrastructure**: CloudSyncService, SyncManager, OfflineQueue. Use these instead of building new retry/offline logic.
3. **React version mismatch**: Dashboard = React 19, Editor = React 18. Must resolve before workspace sharing.
4. **Two separate package-lock.json files** with same package name. Must fix before pnpm workspace migration.
5. **server/ is tangled with Next.js runtime** — not a clean package extraction yet.
6. **Design tokens are two unrelated systems** (Tailwind `@theme` vs editor `--aqb-*`). Cannot just package them together.

---

## Revised Phasing

### Phase 0: Foundation Decisions (Week 1)
Before any restructuring, resolve:
1. **Persistence contract**: Editor saves ProjectData snapshots. Define how this maps to dashboard's Page model (one tRPC endpoint: `sites.saveProject(siteId, ProjectData)` that upserts pages from the snapshot)
2. **Deployment topology**: Decide Option A (editor served under same Vercel domain via rewrites) vs Option B (separate subdomain). This determines auth strategy.
3. **React version alignment**: Upgrade editor to React 19 or pin both apps to compatible versions
4. **Package naming**: Fix duplicate `"name": "buildrik"` in both package.json files
5. **Dev proxy**: Configure Vite dev server to proxy `/api/*` to Next.js dev server (solves cross-origin cookie issue during development)

### Phase 1: Wiring Without Restructure (Week 1-2)
Connect editor to dashboard backend WITHOUT moving any folders:
- Configure editor's existing CloudSyncService with a custom provider that calls dashboard tRPC endpoints
- Editor reads `siteId` from URL query params on mount
- `load()` handler: calls `sites.get(siteId)` + `pages.list(siteId)`, assembles into ProjectData
- `save()` handler: receives ProjectData snapshot, calls new `sites.saveProject(siteId, data)` endpoint
- Auth: dev proxy for localhost, same domain for production
- **Milestone:** Editor can load and save a real site. No folder changes.

### Phase 2: Monorepo Structure (Week 2-3)
Now that wiring works, restructure:
- Create `pnpm-workspace.yaml` at root
- Move `editor/` → `packages/editor/`
- Move `components/`, `emails/` → `packages/dashboard/components/`, `packages/dashboard/emails/`
- Move `app/`, `middleware.ts`, `next.config.mjs` → `packages/dashboard/`
- Extract transport-safe types into `packages/shared/` (API client + Zod schemas ONLY — no Prisma types, no design tokens)
- Keep `server/` at root for now (tangled with Next.js, not ready for extraction)
- Update all imports
- **Milestone:** pnpm workspace works, both apps build independently

### Phase 3: Shared Types + Tooling (Week 3-4)
- Set up tRPC vanilla client in `packages/shared/` for type-safe editor API calls
- Turborepo pipeline: `pnpm dev`, `pnpm test`, `pnpm build`
- Cross-app navigation: "Back to Dashboard" / "Open in Editor" links
- Unified GitHub Actions CI/CD
- **Milestone:** Full monorepo with typed contracts, unified dev/build/CI

### Phase 4: Polish (Future)
- Extract `server/` into `@buildrik/server` workspace package (after untangling Next.js dependencies)
- Shared design tokens (after reconciling Tailwind `@theme` and editor `--aqb-*` systems)
- Real-time collaboration, version history, asset CDN

---

## Architecture (Target after Phase 2)

```
buildrik/                          (pnpm workspace root)
├── packages/
│   ├── dashboard/                 (Next.js 16 app)
│   │   ├── app/                   ← Routes (auth, dashboard, api/trpc)
│   │   ├── components/            ← Dashboard UI
│   │   ├── emails/                ← React Email templates
│   │   ├── middleware.ts
│   │   ├── next.config.mjs
│   │   └── package.json           ← "@buildrik/dashboard"
│   │
│   ├── editor/                    (Vite + React app — moved, not rewritten)
│   │   ├── src/                   ← 371+ components, 25+ managers
│   │   ├── demo/                  ← Dev entry point
│   │   ├── vite.config.ts
│   │   └── package.json           ← "@buildrik/editor"
│   │
│   └── shared/                    (Transport-safe contracts ONLY)
│       ├── api-client.ts          ← tRPC vanilla client (no React Query)
│       ├── schemas/               ← Zod schemas for API contracts
│       └── package.json           ← "@buildrik/shared"
│
├── server/                        (Stays at root — NOT a workspace package yet)
│   ├── trpc/routers/
│   ├── services/
│   ├── auth.ts
│   └── auth.config.ts
│
├── prisma/                        (Shared DB)
├── lib/                           (Dashboard + server utilities)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### Data Flow

```
Editor (Vite SPA)                   Dashboard (Next.js)
       │                                   │
       │  CloudSyncService                 │  tRPC React hooks
       │  → custom buildrik provider       │
       │  → tRPC vanilla client            │
       │                                   │
       └──────────┐          ┌─────────────┘
                  ▼          ▼
         /api/trpc (Next.js API route)
                    │
                    ▼
            server/trpc/routers/
                    │
                    ▼
            server/services/
                    │
                    ▼
              Prisma → PostgreSQL
```

### Editor Persistence Contract

```
LOAD:
  Editor mount → read siteId from URL (?siteId=xxx)
  → CloudSyncService.pull(siteId)
  → custom provider calls: sites.get(siteId) + pages.list(siteId)
  → assembles response into ProjectData format
  → Composer.importProject(projectData)

SAVE:
  Composer auto-save (every 5s if dirty) or manual save
  → Composer.exportProject() → full ProjectData snapshot
  → CloudSyncService.push(siteId, projectData)
  → custom provider calls: sites.saveProject(siteId, projectData)
  → Server: diff ProjectData.pages vs DB pages, upsert changed, delete removed

ERROR HANDLING (via existing CloudSyncService):
  → 401: CloudSyncService emits 'auth-error' → editor redirects to /auth/login
  → Network fail: OfflineQueue buffers saves, replays on reconnect
  → Conflict: SyncManager handles merge (already implemented)
```

### New tRPC Endpoint

```
sites.saveProject (mutation)
  Input: { siteId: string, projectData: ProjectData }
  Logic:
    1. Verify user owns site
    2. Diff projectData.pages vs existing DB pages
    3. Upsert changed pages (bulk Prisma transaction)
    4. Delete removed pages
    5. Update site.lastEditedAt
  Output: { success: boolean, savedAt: Date }
```

---

## Auth Strategy

**Production:** Same domain (`buildrik.com/dashboard` + `buildrik.com/editor`). NextAuth session cookie sent automatically.

**Development:** Vite dev proxy in `editor/vite.config.ts`:
```ts
server: {
  proxy: { '/api': 'http://localhost:3000' }
}
```
This routes editor's API calls to the Next.js dev server, solving cross-origin cookie issues.

---

## What Does NOT Change
- Editor source code structure (371+ components, 25+ engine managers)
- Dashboard page logic
- Existing tRPC router/service implementation
- Prisma schema (no migrations)
- Auth flow (NextAuth stays as-is)

## What Changes

### Phase 0 (decisions only, no code):
- Persistence contract defined
- Deployment topology decided
- React version alignment plan

### Phase 1 (minimal code):
- New tRPC endpoint: `sites.saveProject` (~30 lines in router + service)
- Editor CloudSyncService: new buildrik provider (~50 lines)
- Editor vite.config.ts: dev proxy config (~5 lines)

### Phase 2 (folder restructure):
- git mv operations + import updates
- `pnpm-workspace.yaml` + `turbo.json`
- `packages/shared/api-client.ts` (tRPC vanilla client)
- CLAUDE.md update for new paths

### Phase 3 (tooling):
- Turborepo pipeline config
- GitHub Actions workflow
- Cross-app navigation links

---

## NOT in scope
- server/ extraction to workspace package (tangled with Next.js, deferred to Phase 4)
- Shared design tokens (two unrelated token systems, deferred to Phase 4)
- Real-time collaboration
- Version history
- Asset CDN pipeline

## What already exists
- Editor CloudSyncService with custom provider support
- Editor SyncManager with conflict resolution
- Editor OfflineQueue for buffered saves
- All tRPC endpoints for sites, pages, uploads, settings
- NextAuth session with cookie-based auth
- Editor StorageAdapter with remote mode

## Dream state delta
This plan gets us from "two disconnected apps" to "editor loads and saves real site data with typed contracts and unified dev/CI." The 12-month ideal (real-time collab, version history, asset CDN) becomes a natural extension once Phase 2's monorepo structure is in place.

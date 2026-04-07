# Editor–Dashboard Integration Design (Revised after CEO Review)

**Date:** 2026-04-01
**Scope:** Phased monorepo integration — persistence contract first, then structure
**Review:** CEO Review (EXPANSION mode) + Codex outside voice

---

## Goal

Integrate the editor module with the dashboard so sites created in the dashboard can be edited in the editor. Both share the same backend APIs and auth session. No code rewrite on either side.

---

## Key Findings from Review (all resolved)

1. **Editor saves whole ProjectData snapshots** (not page deltas). The editor's Composer exports entire project state via `exportProject()`. This means the persistence contract is project-level, not page-level.
   - **Resolution:** New `sites.saveProject` endpoint accepts full ProjectData, diffs against DB, upserts changed pages in a Prisma transaction.
2. **Editor already has sync infrastructure**: CloudSyncService, SyncManager, OfflineQueue. Use these instead of building new retry/offline logic.
   - **Resolution:** CloudSyncService gets a new "buildrik" provider that calls tRPC endpoints. Existing OfflineQueue handles network failures. Existing SyncManager handles conflicts. No new sync code.
3. **React version mismatch**: Dashboard = React 19, Editor = React 18. Must resolve before workspace sharing.
   - **Resolution:** Phase 0 task. Upgrade editor to React 19 before workspace migration. Editor's React usage is standard (no React 18-specific APIs like useId polyfills). Upgrade is mechanical: bump `react` and `react-dom` in `editor/package.json`, fix any type errors.
4. **Two separate package-lock.json files** with same package name (`"name": "buildrik"`).
   - **Resolution:** Phase 0 task. Rename editor's package to `@buildrik/editor`. Delete both `package-lock.json` files. Switch to pnpm (`pnpm-lock.yaml` at root). Run `pnpm install` once to generate unified lockfile.
5. **server/ is tangled with Next.js runtime** — `server/trpc/trpc.ts` calls `auth()` directly, services import `@/lib/*`.
   - **Resolution:** server/ stays at root as a raw directory in Phase 2. Dashboard imports it via tsconfig path aliases. Editor NEVER imports server/ — communicates only via HTTP. server/ extraction to `@buildrik/server` deferred to Phase 4 after untangling.
6. **Design tokens are two unrelated systems** — Tailwind `@theme` directives (dashboard) vs `--aqb-*` CSS custom properties (editor).
   - **Resolution:** Deferred to Phase 4. These need a reconciliation strategy first (shared CSS variables as base → both systems derive from them). Not blocking integration.
7. **Deployment topology** (was unresolved).
   - **Resolution: Option B — `editor.buildrik.com`** (separate Vercel project / Cloudflare Pages). Cleaner separation, independent deploys. Cookie domain set to `.buildrik.com` in NextAuth config for cross-subdomain auth.
8. **`@buildrik/shared` mixed too many concerns** — API client + Prisma types + design tokens in one package.
   - **Resolution:** `packages/shared/` scoped to transport-safe contracts ONLY: tRPC vanilla client (`api-client.ts`) + Zod schemas (`schemas/`). No Prisma types (stay in server/), no design tokens (deferred).
9. **Dev cross-origin cookie issue** — editor on port 5050, dashboard on port 3000, cookies don't cross origins.
   - **Resolution:** Vite dev proxy: `server.proxy: { '/api': 'http://localhost:3000' }`. Editor's API calls route through proxy to Next.js dev server. Cookie works because browser sees same origin.
10. **`app/api/auth/create-session/route.ts` rejects cross-origin requests** against `NEXT_PUBLIC_APP_URL`.
    - **Resolution:** In production, editor calls `editor.buildrik.com/api/...` which proxies to dashboard API, OR editor calls `buildrik.com/api/trpc` directly (CORS allowed for `editor.buildrik.com` origin). Add `editor.buildrik.com` to allowed CORS origins in Next.js API config.
11. **lib/validations/ move to packages/shared/schemas/** — migration step was missing from checklist.
    - **Resolution:** Added to Phase 2 migration: move `lib/validations/*.ts` → `packages/shared/schemas/`. Update all imports in `server/trpc/routers/`. Update CLAUDE.md SSOT reference.
12. **Editor bundle size** — importing Zod from `@buildrik/shared/schemas/` adds ~45KB.
    - **Resolution:** Editor imports only TypeScript types from shared schemas (type-only imports: `import type { ... }`). Zod runtime validation stays server-side only. Zero bundle impact on editor.

---

## Revised Phasing

### Phase 0: Foundation Setup (Week 1)
All decisions resolved. Execute:
1. **Persistence contract**: ✅ Decided — `sites.saveProject(siteId, ProjectData)` endpoint, project-level save with page diff
2. **Deployment topology**: ✅ Decided — Option B: `editor.buildrik.com` (separate deploy, cookie domain `.buildrik.com`)
3. **React version alignment**: Upgrade editor from React 18 → React 19. Mechanical upgrade (bump deps, fix type errors)
4. **Package naming**: Rename editor's `package.json` name to `@buildrik/editor`. Delete both `package-lock.json`. Switch to pnpm
5. **Dev proxy**: Configure Vite dev server to proxy `/api/*` to Next.js dev server
6. **CORS**: Add `editor.buildrik.com` to allowed origins in Next.js API config

### Phase 1: Wiring Without Restructure (Week 1-2)
Connect editor to dashboard backend WITHOUT moving any folders:
- Configure editor's existing CloudSyncService with a custom provider that calls dashboard tRPC endpoints
- Editor reads `siteId` from URL query params on mount
- `load()` handler: calls `sites.get(siteId)` + `pages.list(siteId)`, assembles into ProjectData
- `save()` handler: receives ProjectData snapshot, calls new `sites.saveProject(siteId, data)` endpoint
- Auth: dev proxy for localhost, cross-subdomain cookie (`.buildrik.com`) for production
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

**Production (cross-subdomain):**
- Dashboard: `buildrik.com` (Vercel)
- Editor: `editor.buildrik.com` (separate Vercel project or Cloudflare Pages)
- API: `buildrik.com/api/trpc`
- NextAuth cookie domain: `.buildrik.com` (one line in `server/auth.ts`: `cookies.sessionToken.options.domain = ".buildrik.com"`)
- CORS: `editor.buildrik.com` added to allowed origins
- Cookie flows: login on `buildrik.com` → cookie set on `.buildrik.com` → editor reads it automatically

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

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 2 | RESOLVED | 5 proposals accepted. All 12 findings resolved. Deploy: Option B |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | RESOLVED | 12 findings — all incorporated into spec. See Key Findings section |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 0 issues, 0 critical gaps. 14 test paths for implementation |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

- **CODEX:** 12 findings all resolved: React 18→19 upgrade, ProjectData persistence, existing sync infra reused, @buildrik/shared scoped, server/ stays at root, design tokens deferred, deploy topology decided (Option B), CORS config added, type-only imports for Zod, package naming fixed.
- **CROSS-MODEL:** CEO review and Codex agreed on scaling back Phase 1. Both aligned on using existing CloudSyncService.
- **UNRESOLVED:** 0
- **VERDICT:** ALL REVIEWS CLEAR. Ready to implement.

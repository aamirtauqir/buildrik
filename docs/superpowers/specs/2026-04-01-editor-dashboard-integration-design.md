# Editor–Dashboard Integration Design

**Date:** 2026-04-01
**Scope:** Folder restructure + API wiring + auth sharing — no rewrite

---

## Goal

Integrate the editor module with the dashboard so that sites created in the dashboard can be edited in the editor, both sharing the same backend APIs and auth session. No code rewrite on either side.

---

## Part 1 — Folder Restructure

### Current Structure
```
buildrik/
  app/              ← Next.js pages (auth + dashboard)
  components/       ← Dashboard UI components (loose at root)
  emails/           ← Email templates (loose at root)
  editor/           ← Editor module (Vite app)
  server/           ← tRPC routers + services
  lib/              ← Shared utilities
  prisma/           ← DB schema
  types/            ← Shared types
```

### Target Structure
```
buildrik/
  app/                    ← Next.js routes (must stay at root)
    auth/
    dashboard/
    api/
  dashboard/              ← Dashboard module
    components/           ← Moved from /components
    emails/               ← Moved from /emails
  editor/                 ← Editor module (UNTOUCHED)
    src/
    demo/
    vite.config.ts
  server/                 ← Shared backend (both modules use)
    trpc/routers/
    services/
    auth.ts
    auth.config.ts
  lib/                    ← Shared utilities
    prisma.ts
    utils.ts
    trpc/client.tsx
    validations/
  prisma/                 ← Shared DB schema
  types/                  ← Shared types
  middleware.ts
  next.config.mjs
  package.json
  tsconfig.json
```

### Moves
| From | To |
|---|---|
| `/components/` | `/dashboard/components/` |
| `/emails/` | `/dashboard/emails/` |

### Deletes
| File/Folder | Reason |
|---|---|
| `/demo/` | Editor demo lives at `/editor/demo/` |
| `/vite.config.ts` (root) | Editor config lives at `/editor/vite.config.ts` |

### Import Updates
- All `@/components/...` imports → `@/dashboard/components/...`
- All `@/emails/...` imports → `@/dashboard/emails/...`
- `tsconfig.json` paths remain `@/*: ["./*"]` — no change needed since paths are relative to root

### Untouched
- `app/`, `server/`, `lib/`, `prisma/`, `types/`, `editor/`, `__tests__/`
- `middleware.ts`, `next.config.mjs`, `vitest.config.ts`

---

## Part 2 — API Wiring

### Principle
Editor already has backend integration infrastructure. Dashboard already has all needed tRPC endpoints. No new files — just connect the two.

### Editor's Existing Infrastructure
| File | What it does |
|---|---|
| `engine/storage/StorageAdapter.ts` | Multi-mode storage — supports `remote` with custom handlers |
| `services/CloudSyncService.ts` | Cloud sync with auth headers |
| `services/ai/AIServiceClient.ts` | AI endpoint calls (`/api/ai/*`) |
| `services/EmailService.ts` | Backend proxy (`/api/email/send`) |
| `services/FormSubmissionService.ts` | Webhooks + form data |
| `shared/constants/config.ts` | Centralized API endpoints: `/api`, `/api/ai`, `/api/assets`, `/api/templates`, `/api/export` |

### Dashboard's Existing tRPC Endpoints (Editor Will Use)
| Editor needs | tRPC endpoint | Purpose |
|---|---|---|
| Load site | `sites.get` | Site metadata |
| List pages | `pages.list` | All pages for a site |
| Get page content | `pages.get` | Single page blocks/content |
| Save page | `pages.update` | Save edited page |
| Create page | `pages.create` | Add new page |
| Delete page | `pages.delete` | Remove page |
| Upload file | `upload.presign` + `upload.confirm` | Image/asset uploads |
| Site settings | `siteDetail.settings.get` | Load site config |
| Save settings | `siteDetail.settings.update` | Save site config |
| AI credits | `account.aiCredits` | Check available AI credits |
| Templates | `templates.list` + `templates.get` | Load templates |

### How It Connects
1. Editor opens with URL: `/editor?siteId=xxx`
2. Editor's `config.ts` base URL points to dashboard API (`/api/trpc`)
3. `StorageAdapter` remote handlers call existing tRPC endpoints via fetch
4. Auth cookie sent automatically (same domain)

### Changes Required
- `editor/src/shared/constants/config.ts` — set `BASE_URL` to dashboard API origin
- `StorageAdapter` init — configure remote handlers to call `pages.*` and `sites.*` endpoints
- No new service files, no new wrapper functions

---

## Part 3 — Auth Sharing

### Same Domain Deployment
Both apps deployed on same domain:
- Dashboard: `buildrik.com/dashboard`
- Editor: `buildrik.com/editor`
- API: `buildrik.com/api/trpc`

NextAuth session cookie is automatically available to both. No extra auth code needed.

### Cross-Subdomain (if needed later)
If deployed on separate subdomains (`app.buildrik.com` / `editor.buildrik.com`):
- Set cookie domain to `.buildrik.com` in NextAuth config
- One line change: `cookies.sessionToken.options.domain: ".buildrik.com"`

### No New Auth Flow
- No token exchange
- No separate login screen in editor
- No auth wrapper/middleware in editor
- Editor's existing services already send auth headers with requests

---

## Data Flow

```
Dashboard (Next.js)              Editor (Vite)
       │                              │
       │  tRPC React hooks            │  fetch via StorageAdapter
       │                              │
       └──────────┐      ┌────────────┘
                  ▼      ▼
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

---

## User Flow

1. User logs into dashboard (`/auth/login`)
2. Goes to sites list (`/dashboard/sites`)
3. Creates new site → `sites.create` mutation
4. Clicks "Edit" → navigates to `/editor?siteId=xxx`
5. Editor loads → `StorageAdapter` calls `sites.get` + `pages.list`
6. User edits content
7. Save → `StorageAdapter` calls `pages.update`
8. User goes back to dashboard → changes reflected

---

## What Does NOT Change
- Editor source code structure (371+ components, 25+ engine managers)
- Dashboard page logic
- tRPC router/service implementation
- Prisma schema
- Auth flow
- Build pipeline (Next.js + Vite remain separate)

## What Changes (Minimal)
- Folder moves: `components/` and `emails/` into `dashboard/`
- Import path updates (bulk find-replace)
- Delete: root `demo/`, root `vite.config.ts`
- Editor `config.ts`: base URL update
- Editor `StorageAdapter` init: remote handlers configured

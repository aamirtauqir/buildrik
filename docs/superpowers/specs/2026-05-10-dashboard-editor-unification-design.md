# Dashboard + Editor Unification Design

**Date:** 2026-05-10
**Scope:** Collapse `app.buildrik.com` (Next.js dashboard) + `editor.buildrik.com` (Vite editor) into a single Next.js app. Both designs preserved. Behind feature flag.
**Predecessor:** [2026-04-01-editor-dashboard-integration-design.md](./2026-04-01-editor-dashboard-integration-design.md) — shipped two-domain topology with shared auth + persistence contract. This spec collapses the two-domain seam.

---

## Goal

Make dashboard and editor feel like one product. Today they share backend (tRPC, auth cookie, Prisma) but live on two domains with two builds and a full-page reload between them. After this work: one Next.js app, one Vercel deploy, one URL tree. Neither design changes.

## Non-goals

- No design refresh of either app
- No tRPC procedure changes
- No Prisma schema changes
- No editor source rewrite (stays in `packages/editor/`)
- Vite dev harness retained for editor-only iteration

## Decisions locked during brainstorm

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Single Next.js app, editor mounted as React module | True product unity, single deploy, simplest auth |
| D2 | Both designs preserved as-is | Dashboard chrome on `/dashboard/*`, editor chrome on `/edit/*`, never overlap |
| D3 | URL: `/edit/[siteId]` | Top-level, mirrors industry pattern (Webflow/Framer) |
| D4 | Editor source stays in `packages/editor/` workspace pkg | Smallest blast radius, preserves 14 DS gates + active churn |
| D5 | Behind `NEXT_PUBLIC_UNIFIED_EDITOR` flag | One-line env-var rollback (no git revert) |
| D6 | Vite dev harness kept post-cutover | Preserve dev velocity for editor-only work |

---

## Architecture

### Topology after merge

```
packages/
  dashboard/                       ← Next.js 16 (sole runtime entry)
    app/
      layout.tsx                   ← root: <html>, <body>, TRPCProvider, font links
      dashboard/
        layout.tsx                 ← Sidebar + Topbar (UNCHANGED — wraps /dashboard/*)
        sites/, settings/, ...     ← UNCHANGED
      edit/
        [siteId]/
          page.tsx                 ← NEW. Server component: auth() + userCanEditSite() + <EditorClient/>
          layout.tsx               ← NEW. Bare pass-through (no chrome)
      auth/, onboarding/, share/   ← UNCHANGED
    components/
      editor-route/
        EditorClient.tsx           ← NEW. 'use client'. Dynamic-imports AquibraStudio with ssr:false
        editor-link.ts             ← NEW. getEditorHref(siteId) helper, flag-aware
        EditorSkeleton.tsx         ← NEW. Loading fallback
    package.json                   ← +@buildrik/editor workspace dep, +emotion compiler config
    next.config.mjs                ← +compiler.emotion=true; CORS block deleted at Phase 4
    middleware.ts                  ← CORS preflight branch deleted at Phase 4

  editor/                          ← workspace lib (no production runtime entry)
    src/
      index.ts                     ← +export { AquibraStudio }
      ...                          ← UNCHANGED
    package.json                   ← +exports field, vite/@vitejs/plugin-react stay (dev harness)
    demo/, vite.config.ts, index.html  ← KEPT (dev-only via `pnpm --filter @buildrik/editor dev`)
    scripts/, eslint-rules/        ← UNCHANGED (DS gates run unchanged)

  shared/                          ← UNCHANGED
```

### Two layouts, no nesting

Next.js App Router applies **only** layouts on the URL path. Visit `/dashboard/sites` → `app/layout.tsx` wraps `app/dashboard/layout.tsx` wraps the page. Visit `/edit/abc` → `app/layout.tsx` wraps `app/edit/[siteId]/layout.tsx` wraps the page. The dashboard sidebar/topbar **never wraps the editor** because they live on different folders.

### Route-level code split

```tsx
// components/editor-route/EditorClient.tsx
'use client';
import dynamic from 'next/dynamic';
import { EditorSkeleton } from './EditorSkeleton';

const AquibraStudio = dynamic(
  () => import('@buildrik/editor').then((m) => ({ default: m.AquibraStudio })),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

export function EditorClient({ siteId }: { siteId: string }) {
  return <AquibraStudio style={{ height: '100vh' }} />;
}
```

Editor bundle (~2MB, 15 deps: emotion, gsap, cmdk, react-colorful, react-window, dompurify, jszip, html2canvas, etc.) downloaded only when `/edit/[siteId]` opens. Dashboard pages bundle unaffected.

`ssr: false` is mandatory — AquibraStudio uses `window`, `document`, canvas DOM mutations. SSR would crash.

### Server gate before bundle download

```tsx
// app/edit/[siteId]/page.tsx
import { auth } from '@server/auth';
import { redirect, notFound } from 'next/navigation';
import { userCanEditSite } from '@server/services/sites.service';
import { EditorClient } from '@/components/editor-route/EditorClient';

export default async function EditPage({
  params,
}: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/login?next=/edit/${siteId}`);

  const ok = await userCanEditSite(session.user.id, siteId);
  if (!ok) notFound();

  return <EditorClient siteId={siteId} />;
}
```

This is a new capability the Vite app didn't have: unauthenticated users redirected before any editor JS ships. URL-guessing attacks return 404 at HTML response time.

### Auth + data — same-origin simplifies

After merge, editor and dashboard tRPC are on the same origin:
- NextAuth cookie sent automatically (no `credentials: 'include'` needed)
- No CORS preflight `OPTIONS` (1 fewer RTT per mutation, ~50 saved per edit session)
- `EDITOR_ORIGIN` env var unused; CORS plumbing in `middleware.ts` + `next.config.mjs` becomes dead code at Phase 4

Service layer (`server/services/*`) and tRPC routers untouched. Integration is at transport + page-mount only.

### Flag behavior

```ts
// components/editor-route/editor-link.ts
export function getEditorHref(siteId: string): string {
  if (process.env.NEXT_PUBLIC_UNIFIED_EDITOR === 'true') return `/edit/${siteId}`;
  const legacy = process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5050';
  return `${legacy}/?siteId=${siteId}`;
}
```

Three deployment phases:

| Phase | Flag | What user sees | What's running |
|---|---|---|---|
| 1. Ship Next route | `false` | Click Edit → still goes to `editor.buildrik.com` (Vite) | Both Vite + Next route exist; Next route reachable for QA |
| 2. Smoke / canary | manually flip `true` on Vercel preview | Click Edit → `/edit/[id]` (Next) | Both still running |
| 3. Cutover green | `true` for everyone | Click Edit → `/edit/[id]` only | Vite shut down (or 301 redirect); CORS deleted |

---

## Components + integration contract

### Editor package export surface

```ts
// packages/editor/src/index.ts
export { AquibraStudio } from './editor/shell/AquibraStudio';
export type { ComposerConfig, ProjectData, BlockData } from './shared/types';
```

```json
// packages/editor/package.json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### `getSiteIdFromUrl()` — backward compatible

```ts
// packages/editor/src/.../getSiteIdFromUrl.ts
export function getSiteIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  // Path-style: /edit/abc123 (new)
  const pathMatch = window.location.pathname.match(/^\/edit\/([^/?#]+)/);
  if (pathMatch) return pathMatch[1];
  // Query-style: ?siteId=abc123 (Vite legacy)
  return new URLSearchParams(window.location.search).get('siteId');
}
```

Editor source stays agnostic to host. No prop drilling through 8 hooks.

### Dashboard call sites — 10 mechanical replacements

| File | Today | After |
|---|---|---|
| `app/dashboard/sites/page.tsx:230` | `${editorUrl}/?siteId=${id}` | `getEditorHref(id)` |
| `app/dashboard/sites/new/page.tsx:65,73,250` | same | same |
| `app/onboarding/setup/page.tsx:12` | same | same |
| `components/site-detail/site-header.tsx:56` | same | same |
| `components/ai-wizard/generation-progress.tsx:87` | same | same |
| `components/search/command-palette.tsx:210` | same | same |
| `components/dashboard/site-card.tsx:64` | same | same |
| `components/sites/site-card-full.tsx:64` | same | same |

Module-level `editorUrl` const deleted from each file.

### New `userCanEditSite` helper

```ts
// server/services/sites.service.ts
export async function userCanEditSite(
  userId: string,
  siteId: string
): Promise<boolean> {
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspace: { members: { some: { userId } } } },
    select: { id: true },
  });
  return !!site;
}
```

Uses existing `workspaceMember` authz pattern (consistent with `sites.service.ts:145-150`).

### CSS + emotion handling

```js
// next.config.mjs (added)
compiler: { emotion: true }
```

Next's SWC plugin handles `<div css={...}>` JSX globally. Editor source untouched.

```tsx
// EditorClient.tsx — single import
import '@buildrik/editor/dist/themes/default.css';
```

Editor's `@layer reset, tokens, components, overrides` cascade chain preserved. Smoke test (see Testing) verifies `--buildrick-*` tokens resolve.

### Files deleted at Phase 4 (post-cutover)

- `EDITOR_ORIGIN` env var
- CORS preflight branch in `packages/dashboard/middleware.ts`
- `/api/:path*` headers block in `packages/dashboard/next.config.mjs`
- `editor.buildrik.com` DNS (after 30-day redirect window)
- Separate Vercel project for editor (if exists)

**Kept** (not deleted): `packages/editor/vite.config.ts`, `demo/`, `index.html` — dev-only harness for editor devs (`pnpm --filter @buildrik/editor dev`).

---

## Data flow

### Flow 1: Create site → enter editor

```
USER clicks "+ New Site"
  → trpc.sites.create.mutate() → sitesService.create() → DB row {id}
  → window.location.href = getEditorHref(id) = "/edit/abc123"
  → GET /edit/abc123 (same-origin)
    → EditPage (server): auth() + userCanEditSite() → render <EditorClient/>
  → Browser downloads editor chunk (~2MB, lazy)
  → AquibraStudio mounts → getSiteIdFromUrl() = "abc123"
  → trpc.sites.load("abc123") → Composer.loadProject() → canvas paints
```

**Diff vs today:** server-gated auth before bundle ships; same-origin nav; no CORS preflight.

### Flow 2: Editor edits + autosave

```
USER edits canvas
  → useComposerInit autosave effect fires
  → siteId = getSiteIdFromUrl() = "abc123"
  → trpc.sites.save (POST /api/trpc/...) — same-origin, cookie auto-sent
  → sitesService.save() → Prisma update
```

**Diff vs today:** identical procedure; saves 1 RTT (no preflight).

### Flow 3: Publish

```
USER clicks Publish
  → useExportHandlers.handleVercelPublish
  → trpc.sites.publish.mutate({ siteId, pages })
  → publishService.enqueue() → /api/workers/publish → Vercel deploy API
  → publishService updates DB row → poll → StudioFooter shows URL
```

**Diff vs today:** unchanged. Phase 1c arc already wired this through tRPC.

**Invariant:** service layer + tRPC routers do NOT change. Integration is purely transport + page-mount.

---

## Edge cases + risks

| # | Risk | Mitigation |
|---|------|-----------|
| R1 | Emotion JSX needs Vite's `jsxImportSource` plugin | Add `compiler: { emotion: true }` to `next.config.mjs` (one line). SSR cache moot under `ssr:false` |
| R2 | CSS layer cascade breakage (memory: vibcoder bundle loading gap) | Single CSS import in EditorClient before dynamic component. Smoke test: `--buildrick-*` tokens resolved on Topbar |
| R3 | tRPC double-provider | Editor must consume dashboard's tRPC client via `@buildrik/shared`. Audit `grep -rn 'createTRPCReact' packages/editor/src` |
| R4 | Sentry double-init | Audit `Sentry.init(` in editor; gate behind `window.__SENTRY_INITED__` or move to root |
| R5 | Asset paths — fonts | Move `<link rel="preconnect" href="https://fonts.bunny.net">` from editor `index.html` → dashboard `app/layout.tsx`. Or migrate to `next/font` (optional) |
| R6 | Strict-mode double-mount | Add `useRef` idempotence guard in `useComposerInit` if absent |
| R7 | Browser back + dirty-state guard | Editor autosave covers most cases. Add `usePathname`-based flush on path change |
| R8 | localStorage namespace post-domain-merge | Editor reads from server on mount; localStorage holds only ephemeral state. Verify with `grep localStorage packages/editor/src` |
| R9 | Multi-package inventory drift (memory: inventory must cross packages) | Phase 0 audit across `packages/dashboard`, `packages/editor`, `server/`, `prisma/`, `scripts/` for hardcoded URLs |
| R10 | CSP `'unsafe-eval'` | No change. Already permissive |
| R11 | Vercel domain config | 301 redirect `editor.buildrik.com/?siteId=X` → `app.buildrik.com/edit/X` for 30 days, then DNS removal |
| R12 | Codex review trips on inventory gaps | Explicit Codex review checkpoints at end of each Phase, not just at end |

### Performance trade-offs

**Wins:**
- ~50 RTTs saved per edit session (no preflight)
- Single TLS handshake / DNS / connection pool (~100-200ms cold load)
- React/zod/lucide-react deduped across dashboard + editor chunks

**Costs:**
- `auth() + userCanEditSite` adds ~50-100ms server time on `/edit/[id]` cold load (acceptable)
- Build time estimated to grow as Turbopack pulls editor source into dashboard build (Vercel build minutes ↑). Measure during Phase 1; record delta in project memory
- Dev HMR slower for editor work under Turbopack vs dedicated Vite — **mitigated** by D6 (keep Vite dev harness)

### Security verdict

Strict improvement: server-side auth before bundle download, CORS attack surface removed, no new attack surface introduced. Only new work: `userCanEditSite` helper.

---

## Migration sequence

### Phase 0 — Prereqs (no user-visible change)

- [ ] Add `userCanEditSite()` to `sites.service.ts`
- [ ] Add `exports` field to `packages/editor/package.json`
- [ ] Add `AquibraStudio` named export to `packages/editor/src/index.ts`
- [ ] Update `getSiteIdFromUrl()` regex (path + query fallback)
- [ ] Add `compiler: { emotion: true }` to `next.config.mjs`
- [ ] Audit `Sentry.init` — add idempotence guard if needed
- [ ] Audit `useComposerInit` — verify strict-mode idempotence
- [ ] Inventory pass across all 3 packages for hardcoded URLs (R9)
- [ ] Codex review checkpoint #1

### Phase 1 — Next route lands (flag OFF)

- [ ] Create `app/edit/[siteId]/layout.tsx` (bare)
- [ ] Create `app/edit/[siteId]/page.tsx` (auth + permission gate)
- [ ] Create `components/editor-route/EditorClient.tsx`
- [ ] Create `components/editor-route/editor-link.ts`
- [ ] Create `components/editor-route/EditorSkeleton.tsx`
- [ ] Move font `<link>` from editor `index.html` → dashboard `app/layout.tsx`
- [ ] Add `@buildrik/editor` workspace dep to `packages/dashboard/package.json`
- [ ] Smoke test `/edit/<known-id>` directly (flag false; not yet user-visible)
- [ ] Codex review checkpoint #2

### Phase 2 — Call site migration (flag still OFF)

- [ ] Replace 10 `${editorUrl}/?siteId=${id}` sites with `getEditorHref(id)`
- [ ] Verify all 10 still emit Vite URL (flag false)
- [ ] Codex review checkpoint #3

### Phase 3 — Flag flip (canary)

- [ ] Set `NEXT_PUBLIC_UNIFIED_EDITOR=true` on Vercel preview deploy
- [ ] 24-hour internal smoke
- [ ] Production prod-flip via Vercel env update (no code deploy)
- [ ] Watch error rate, autosave success, publish success
- [ ] **Rollback = flip env false, redeploy 60s**

### Phase 4 — Cleanup

- [ ] Add 301 redirect on `editor.buildrik.com` → `app.buildrik.com/edit/$1`
- [ ] 30-day stragglers window
- [ ] Delete `EDITOR_ORIGIN` env, CORS preflight branch, `/api/:path*` headers, DNS for `editor.buildrik.com`
- [ ] Delete separate Vercel project (if exists)
- [ ] **Keep** `packages/editor/vite.config.ts` + `demo/` (dev-only harness)
- [ ] Codex review checkpoint #4

---

## Testing strategy

### Unit tests (vitest)

| Test | Asserts |
|---|---|
| `editor-link.test.ts` | flag true → `/edit/X`; flag false → `${legacy}/?siteId=X` |
| `getSiteIdFromUrl.test.ts` | `/edit/abc` → `abc`; `?siteId=abc` → `abc`; `/edit/abc?foo=bar` → `abc`; root → null |
| `userCanEditSite.test.ts` | member → true; non-member → false; missing site → false |
| `EditorClient.test.tsx` | renders skeleton on load; renders AquibraStudio after mount |

### Integration tests

| Test | Asserts |
|---|---|
| `app/edit/[siteId]/page.test.tsx` | unauthed → redirects to login; non-member → 404; member → renders EditorClient |
| `editor-mount-smoke.test.tsx` | full mount in jsdom: AquibraStudio reaches `composer ready` |
| `tRPC sameOrigin.test.ts` | mock fetch from editor route hits `/api/trpc/...` without `Origin`, no preflight |

### Manual QA (Phase 1 smoke)

1. `/edit/<valid-id>` while logged in → editor loads, canvas paints
2. Network tab: editor JS chunk ~2MB
3. Network tab: tRPC calls same-origin, no `OPTIONS`
4. Canvas edit → autosave → DB row updates
5. Publish → `publishedUrl` appears
6. Inspect Topbar → `--buildrick-*` tokens resolved
7. Computed style: `font-family: 'Inter Tight'` (not system fallback)
8. `/edit/<id>` logged out → 302 to `/auth/login?next=/edit/<id>`
9. `/edit/<id>` foreign workspace → 404
10. Browser back from editor → dashboard renders without full reload
11. Edit canvas → click dashboard nav → editor unmounts cleanly (no console errors)
12. AI wizard end-to-end: create → edit → publish

### Manual QA (Phase 3 prod-flip)

13. All 10 dashboard call sites verified emit `/edit/<id>`
14. AI wizard end-to-end
15. Onboarding flow end-to-end
16. Cross-browser: Chrome, Safari, Firefox

### Performance regression checks

- Lighthouse `/edit/<id>` cold load before/after Phase 3 — TTI delta < +200ms
- CI build time before/after Phase 1 — log to project memory
- Bundle analyzer — confirm dashboard core chunk size unchanged

### DS gates (must stay green throughout)

- All 14 editor DS gates (`pnpm gate:ds-*`) pass at each phase
- New gate (optional): `gate:no-cross-origin-editor-ref` — fails if `${editorUrl}` literal appears outside `editor-link.ts`

---

## Rollback matrix

| Phase | Failure mode | Rollback |
|---|---|---|
| 0 | Service helper bug | Revert single commit |
| 1 | Editor doesn't mount under Next | Revert PR; `/edit/[id]` page disappears, no users affected (flag OFF) |
| 2 | Wrong helper output | Revert PR; URLs revert to inline literal |
| 3 | Editor breaks for users | Flip `NEXT_PUBLIC_UNIFIED_EDITOR=false` in Vercel (~60s) |
| 4 | Stale link still hitting `editor.buildrik.com` | Keep redirect, extend 30-day window |

---

## Open questions deferred

None at design time. Surfaced during planning if any.

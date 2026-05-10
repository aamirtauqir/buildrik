# Dashboard + Editor Unification Design

**Date:** 2026-05-10
**Scope:** Collapse `app.buildrik.com` (Next.js dashboard) + `editor.buildrik.com` (Vite editor) into a single Next.js app. Both designs preserved. Behind feature flag.
**Predecessor:** [2026-04-01-editor-dashboard-integration-design.md](./2026-04-01-editor-dashboard-integration-design.md) — shipped two-domain topology with shared auth + persistence contract. This spec collapses the two-domain seam.
**CEO review:** 2026-05-10. Mode: SELECTIVE EXPANSION. 4 cherry-picks accepted (hover prefetch, SSR skeleton, soft routing, unified Cmd+K). 9 defects folded into Phase 0. Token reconciliation deferred to TODOS. See `~/.gstack/projects/aamirtauqir-buildrik/ceo-plans/2026-05-10-dashboard-editor-unification.md` for full record.

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
import { EditorErrorBoundary, EditorErrorScreen } from './EditorErrorBoundary';

const AquibraStudio = dynamic(
  () => import('@buildrik/editor').then((m) => ({ default: m.AquibraStudio })),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

export function EditorClient({ siteId }: { siteId: string }) {
  return (
    <EditorErrorBoundary
      fallback={({ error, retry }) => (
        <EditorErrorScreen
          message={
            error.name === 'ChunkLoadError'
              ? 'Editor was updated. Reload to continue.'
              : 'Editor crashed unexpectedly.'
          }
          // ChunkLoadError after deploy: same chunk URL is now 404. Retry must hard-reload, not local-remount.
          onRetry={() => {
            if (error.name === 'ChunkLoadError') window.location.reload();
            else retry();
          }}
        />
      )}
    >
      {/* key={siteId} forces full remount when soft-routing /edit/a → /edit/b.
          Without this, Composer state from previous site can autosave into wrong site. */}
      <AquibraStudio key={siteId} style={{ height: '100vh' }} />
    </EditorErrorBoundary>
  );
}
```

`ChunkLoadError` is the most common dynamic-import failure (network drop mid-fetch, stale chunk after deploy). User sees a Reload button, not a blank screen.

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

### Flag behavior — server-driven via Vercel Edge Config

**Why not `NEXT_PUBLIC_*` env:** `NEXT_PUBLIC_*` values are baked into the JS bundle at build time. Flipping the env requires a full rebuild + redeploy (~3-5 min on Vercel). The "60-second rollback" needs a runtime flag that doesn't trigger a rebuild.

**Mechanism:** `@vercel/edge-config`. Edge Config values propagate to all edge functions in <10s without rebuild. Read server-side in `app/edit/[siteId]/page.tsx` and in `editor-link.ts` (which becomes a server-or-client-aware module).

```ts
// components/editor-route/editor-link.ts
import { get } from '@vercel/edge-config';

// Server-side: source of truth (called from app/layout.tsx server component)
export async function readUnifiedEditorFlag(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return process.env.NEXT_PUBLIC_UNIFIED_EDITOR === 'true';
  return (await get<boolean>('unifiedEditor')) ?? false;
}

// Sync client-side helper. Takes flag from context. Eng review D3 — avoids async ripple in 10 call sites.
export function getEditorHref(siteId: string, unified: boolean): string {
  if (unified) return `/edit/${siteId}`;
  const legacy = process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5050';
  return `${legacy}/?siteId=${siteId}`;
}

// React Context — wraps app at root layout. Sync hook for client code.
export const UnifiedEditorFlagContext = createContext(false);
export function useUnifiedEditorFlag(): boolean {
  return useContext(UnifiedEditorFlagContext);
}
```

```tsx
// app/layout.tsx (server component)
import { readUnifiedEditorFlag } from '@/components/editor-route/editor-link';

export default async function RootLayout({ children }) {
  const unified = await readUnifiedEditorFlag();
  return (
    <html lang="en">
      <body>
        <UnifiedEditorFlagContext.Provider value={unified}>
          <TRPCProvider>{children}</TRPCProvider>
        </UnifiedEditorFlagContext.Provider>
      </body>
    </html>
  );
}
```

```tsx
// usage in any client component
'use client';
import { useUnifiedEditorFlag, getEditorHref } from '@/components/editor-route/editor-link';

function SiteCard({ site }) {
  const unified = useUnifiedEditorFlag();
  return <a href={getEditorHref(site.id, unified)}>Edit</a>;
}
```

Server reads Edge Config once per request. Client code reads sync from context — no async ripple, no stale-closure traps. Flipping the flag in Edge Config takes effect on next page nav (cached value lives for the session). Mitigation aligns with `feedback_setter_closure_stale_state.md` (3 setter-closure bugs this week — sync access pattern avoids the trap).

**Three deployment phases:**

| Phase | Flag | What user sees | What's running |
|---|---|---|---|
| 1. Ship Next route | `false` in Edge Config | Click Edit → still `editor.buildrik.com` (Vite) | Both exist; Next route reachable for QA |
| 2. Smoke / canary | flip `true` on Vercel preview branch's Edge Config | Click Edit → `/edit/[id]` (Next) | Both still running |
| 3. Cutover green | `true` in production Edge Config | Click Edit → `/edit/[id]` only | Vite shut down or 301 redirect |

**Real rollback timing:** ~10s (Edge Config propagation) for users on next nav. Active sessions keep their cached flag value until next page load. No rebuild required.

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
| R7 | Browser back + dirty-state guard | Editor autosave covers most cases. Add `usePathname`-based flush on path change. With cherry-pick #3 soft routing this becomes mandatory: in-flight `fetch` to `sites.save` aborts on unmount → unsaved canvas state lost. `useComposerInit` cleanup must await pending save (or trigger sync save) before unmount resolves |
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
- **Fault isolation lost (codex finding):** today, broken editor PR cannot block dashboard deploy. After unification, an editor compile error or dependency break blocks the dashboard build, even with the unified flag OFF. Given editor's heavy active churn (DS Tier-2 mid-flight, vibcoder phases ongoing), this is a real ops cost. User accepted in CEO review tension #3.
  - **Mitigation:** add a CI gate that runs `pnpm --filter @buildrik/dashboard build` on every editor-source PR. Catches dashboard-breaking changes at PR time, not at Vercel deploy time.

### Security verdict (revised post codex review)

**Wins:** server-side auth before bundle download, CORS removal, simpler cookie story.

**Losses:** the second origin was a blast-radius boundary. Today, an XSS or supply-chain compromise in editor code is contained to `editor.buildrik.com`; cookies for `app.buildrik.com` are unreachable. After unification, both apps share an origin — an editor-side compromise can read dashboard session cookies.

**Mitigations:**
- Editor needs `'unsafe-eval'` for emotion runtime + dompurify polyfills — that CSP relaxation now applies to dashboard pages too. Tighten where possible: per-route CSP via Next middleware, dashboard routes get strict CSP, only `/edit/*` gets the `'unsafe-eval'` relaxation
- Dependency review pass on editor's 15+ deps (memory: gsap, html2canvas, jszip, dompurify, react-colorful, react-window, cmdk) — supply chain audit before unification
- Sentry tag captures origin-merged errors specifically (R-tag ` origin_merge=true` on /edit/* errors for first 30 days)

**Net:** still a net win for the average user (auth gate, less CORS misconfig risk) but NOT "strict improvement, no new attack surface" — there's a real blast-radius trade.

---

## Migration sequence

### Phase 0 — Prereqs (no user-visible change)

CEO review on 2026-05-10 surfaced 9 defects in the original Phase 0 list. All 9 are now mandatory before Phase 1.

**Original tasks (kept):**
- [ ] Add `userCanEditSite()` to `sites.service.ts`
- [ ] Add `AquibraStudio` named export to `packages/editor/src/index.ts`
- [ ] Update `getSiteIdFromUrl()` regex (path + query fallback)
- [ ] Add `compiler: { emotion: true }` to `next.config.mjs`

**Defects added by CEO review:**
- [ ] **D1: CSS path** — Decide CSS delivery strategy. Editor's Vite build bundles CSS into JS (`dist/themes/default.css` does NOT exist). Options: (a) import from source `@buildrik/editor/src/themes/default.css` and let Next bundle it; (b) add a CSS-only build step to editor's package; (c) emit a separate `dist/styles.css`. Pick (a) for smallest delta — Next/Turbopack handles raw CSS imports fine
- [ ] **D2: `exports` field** — Use a wildcard exports map, not just `.`. Editor's own vitest, eslint, DS gates rely on internal `@/`, `@shared/` paths. Required shape:
  ```json
  "exports": {
    ".": "./src/index.ts",
    "./src/*": "./src/*",
    "./themes/*": "./src/themes/*"
  }
  ```
- [ ] **D3: Emotion JSX type-checking** — Set `"jsxImportSource": "@emotion/react"` in dashboard's `tsconfig.json` (or in a per-folder tsconfig that covers `app/edit/**` + `components/editor-route/**`). `compiler.emotion` only handles SWC build-time JSX rewrite, NOT `tsc --noEmit` type-checks. Verify with: `cd packages/dashboard && pnpm tsc --noEmit`
- [ ] **D4: SSE/streaming** — Audit AI tab's `streamPrompt` path. Today: cross-origin fetch + ReadableStream. After unification, same-origin allows `EventSource` for simpler reconnect/retry. Decide: keep fetch+ReadableStream (least change) or migrate to EventSource (cleaner). Recommend keep (touch only if it breaks)
- [ ] **D5: Strict-mode idempotence** — Read `useComposerInit.ts` end to end. Add `useRef` guard pattern if absent:
  ```ts
  const initedRef = useRef(false);
  useEffect(() => { if (initedRef.current) return; initedRef.current = true; /* init */ }, []);
  ```
  Memory hits 3 setter-stale-state bugs this week — high odds this trips
- [ ] **D6: Multi-package inventory** — Grep for hardcoded URLs across `server/`, `prisma/`, `scripts/`, AND `packages/editor/src/` (reverse direction). Commands:
  ```bash
  grep -rn 'editor\.buildrik\.com\|NEXT_PUBLIC_EDITOR_URL\|EDITOR_ORIGIN' server/ prisma/ scripts/ packages/editor/src/
  ```
  Add any sites found to Phase 2 replacement list
- [ ] **D7: Vercel project topology confirmed** — Check Vercel dashboard. If `editor.buildrik.com` is a separate project, document its asset URL pattern. Phase 4 cleanup must explicitly delete the project, not just DNS
- [ ] **D8: Stale stash cleared** — `git stash list` shows `stash@{0}: wip before media tab lane A` on main. Either pop+commit, drop, or note as out-of-scope before Phase 1 starts. Avoids mid-Phase-1 conflict
- [ ] **D9: Audit `Sentry.init` for double-fire** — `grep -rn 'Sentry.init(' packages/editor/src/`. Gate behind `window.__SENTRY_INITED__` if present and dashboard also inits Sentry

**Defects added by codex outside-voice review:**
- [ ] **D10: `transpilePackages` config** — Add `transpilePackages: ['@buildrik/editor']` to `next.config.mjs`. Without it, Next won't compile editor's source TS through SWC; workspace package resolution silently fails or pulls untranspiled JS
- [ ] **D11: Vite-isms audit** — Editor was authored under Vite. `grep -rn 'import\.meta\.env' packages/editor/src/` to find Vite-specific globals. Each hit needs a Next-compatible replacement (`process.env.NEXT_PUBLIC_*` or a runtime config object). Also check: web workers (Vite handles `new Worker(new URL('./foo.ts', import.meta.url))` differently), asset URLs (`new URL('./asset.png', import.meta.url)`), `?raw`/`?url` import suffixes (Vite-only)
- [ ] **D12: Editor shell contract audit** — Read `packages/editor/demo/main.tsx` end to end. List every wrapper, provider, body class, hotkey, analytics init, error boundary, feature-flag check that the Vite entry sets up. Confirm `<AquibraStudio>` itself sets them, OR move them into `EditorClient.tsx`. Memory: `Agentation` dev-tool wrapper is one such — list everything else
- [ ] **D13: CSS isolation strategy** — Decide between (a) **scope-prefixed editor CSS** — wrap editor's `default.css` rules under `:where(.bd-studio)` selector so tokens only apply inside editor mount; (b) **CSS layers + scoped layers** — `@layer editor { ... }` only in EditorClient, dashboard pages don't import; (c) **CSS Modules build step** for editor. Pick (a) for smallest delta. Required because spec's "load CSS in EditorClient" leaves SSR skeleton without tokens; "load at root" leaks editor styles onto dashboard
- [ ] **D14: Editor cross-origin assumption inventory** — Beyond the 10 dashboard call sites, audit editor source for hardcoded cross-origin behavior: `fetch()` with absolute URL, `EventSource`/WebSocket creation, asset URL builders, `credentials: 'include'`. Each must be reviewed for same-origin compatibility. Commands:
  ```bash
  grep -rn 'fetch(\|new EventSource\|new WebSocket\|credentials.*include' packages/editor/src/
  grep -rn 'NEXT_PUBLIC_APP_URL\|app\.buildrik\.com\|http://localhost:3000' packages/editor/src/
  ```

- [ ] Codex review checkpoint #1 (Phase 0 complete)

### Phase 0.5 — Build proof spike (NEW, added by codex review)

Before any actual integration, prove the Vite-built editor compiles inside Next/Turbopack. ~2-3 hours.

- [ ] Add `transpilePackages: ['@buildrik/editor']` to `next.config.mjs` (D10)
- [ ] Run all D11 grep audits on editor source. Inventory every Vite-ism. Replace each:
  - `import.meta.env.X` → server-injected `process.env.NEXT_PUBLIC_X` or runtime config object
  - `new URL('./asset', import.meta.url)` → static `/public` import or Next-compatible path
  - `new Worker(new URL(...))` → `Worker` factory with bundled URL (Next supports via webpack plugin OR move worker to dashboard's `/workers/`)
  - `?raw` / `?url` import suffixes → replace with explicit fetch or copy file to `/public/`
- [ ] Create temporary `app/edit/_spike/page.tsx` that dynamic-imports AquibraStudio
- [ ] Run `pnpm --filter @buildrik/dashboard build`. Catalog every build error
- [ ] Categorize errors: (a) fixable in Phase 0.5 itself; (b) requires editor-source changes; (c) blocker (no Next path)
- [ ] If category (c) errors exist: STOP. Write a status report; either fix in editor or revisit Approach C (cross-model tension #3 alternative)
- [ ] If only (a) and (b): fix all (a) here, log all (b) as Phase 1 prerequisites
- [ ] Delete `app/edit/_spike/` (it's a throwaway)
- [ ] Codex review checkpoint #1.5 — spike result

### Phase 1 — Next route lands (flag OFF)

- [ ] Create `app/edit/[siteId]/layout.tsx` — **SSR skeleton** (cherry-pick #2): server-renders chrome shape (topbar bar, sidebar rail, canvas placeholder, footer line) using static CSS reading editor's existing CSS variables. AquibraStudio dynamically swaps it once JS loads. Reuses `--buildrick-*` token vars
- [ ] Create `app/edit/[siteId]/page.tsx` (auth + permission gate)
- [ ] Create `components/editor-route/EditorClient.tsx`
- [ ] Create `components/editor-route/editor-link.ts` — exports `getEditorHref(siteId)` (string) AND `EditorLink` component (Next `Link` with `prefetch={true}`, plus `onMouseEnter` triggers `userCanEditSite` query — **cherry-pick #1 hover prefetch**)
- [ ] Create `components/editor-route/EditorSkeleton.tsx` — client-side fallback for the dynamic-import loading state. Mirrors the SSR skeleton from layout.tsx so the swap is invisible
- [ ] Move font `<link>` from editor `index.html` → dashboard `app/layout.tsx`
- [ ] Add `@buildrik/editor` workspace dep to `packages/dashboard/package.json`
- [ ] Smoke test `/edit/<known-id>` directly (flag false; not yet user-visible). Verify: SSR skeleton paints in <50ms; chunk download starts; AquibraStudio replaces skeleton without flash
- [ ] **CI gate (eng review D1):** add GitHub Actions workflow `.github/workflows/editor-dashboard-build.yml`. Trigger: PR touching `packages/editor/**`. Step: `pnpm --filter @buildrik/dashboard build`. Required check before merge. Catches editor changes that break dashboard build at PR time, not at Vercel deploy time. Mitigates fault-isolation loss accepted in CEO review tension #3
- [ ] Codex review checkpoint #2

### Phase 2 — Call site migration (flag still OFF)

- [ ] Replace 10 `${editorUrl}/?siteId=${id}` sites with appropriate primitive (**cherry-pick #3 soft routing**):
  - In React-component contexts (cards, links, buttons): use `<EditorLink siteId={id}>` (Next `<Link>` with prefetch + hover prefetch wired)
  - In imperative handlers where soft nav makes sense (sites list create-then-open): use `router.push(getEditorHref(id))`
  - In handlers where state-reset is intentional (AI wizard `generation-progress.tsx` redirect): keep `window.location.href = getEditorHref(id)` and add inline comment explaining why
- [ ] Per-site classification matrix:
  | File | Method | Reason |
  |---|---|---|
  | `app/dashboard/sites/page.tsx:230` | `router.push` | imperative handler |
  | `app/dashboard/sites/new/page.tsx:65,73,250` | `router.push` | post-mutation nav |
  | `app/onboarding/setup/page.tsx:12` | `window.location.href` | onboarding state reset |
  | `components/site-detail/site-header.tsx:56` | `<EditorLink>` | anchor in JSX |
  | `components/ai-wizard/generation-progress.tsx:87` | `window.location.href` | wizard state reset |
  | `components/search/command-palette.tsx:210` | `router.push` | command action |
  | `components/dashboard/site-card.tsx:64` | `<EditorLink>` | anchor in JSX |
  | `components/sites/site-card-full.tsx:64` | `<EditorLink>` | anchor in JSX |
- [ ] Plus any new sites discovered in D6 multi-package inventory
- [ ] Verify all sites still emit Vite URL when flag false
- [ ] Codex review checkpoint #3

### Phase 3 — Flag flip (canary)

**Pre-flip observability (must ship before flag turns on):**
- [ ] Confirm Vercel Web Vitals enabled for `/edit/[siteId]` route (check Vercel project Analytics tab)
- [ ] Tag Sentry events from `/edit/[id]` with `route_unified=true` — set in `EditorErrorBoundary` and root error handler
- [ ] Emit custom `editor.cold_load_ms` metric — measure from page nav start (`performance.timing.navigationStart`) to first canvas paint (`composer.on('canvas:first-paint', ...)`) via Web Vitals beacon
- [ ] Sentry alert: `ChunkLoadError` rate > 0.5% over 5 min → page on-call

**Flip sequence:**
- [ ] Set `NEXT_PUBLIC_UNIFIED_EDITOR=true` on Vercel preview deploy
- [ ] 24-hour internal smoke (you + 1 user) on preview URL
- [ ] Verify metrics flowing: `editor.cold_load_ms` p99, `route_unified=true` Sentry tag visible
- [ ] Production prod-flip via Vercel env update (no code deploy)
- [ ] Watch first hour: error rate, autosave success, publish success, `editor.cold_load_ms` delta vs Vite baseline
- [ ] **Rollback = flip env false, redeploy 60s**

### Phase 4 — Cleanup

- [ ] Add 301 redirect on `editor.buildrik.com` → `app.buildrik.com/edit/$1`
- [ ] **Metric-gated DNS removal:** wait for the LATER of (a) 30 calendar days OR (b) `editor.buildrik.com` traffic <1% of `app.buildrik.com/edit/*` traffic. Calendar-only triggers risk 404'ing live bookmarks
- [ ] Delete `EDITOR_ORIGIN` env, CORS preflight branch, `/api/:path*` headers
- [ ] Delete DNS for `editor.buildrik.com` AFTER metric gate
- [ ] Delete separate Vercel project (D7 confirmed pre-Phase 1 whether one exists)
- [ ] **Keep** `packages/editor/vite.config.ts` + `demo/` (dev-only harness)
- [ ] Codex review checkpoint #4

---

## Testing strategy

### Unit tests (vitest)

| Test | Asserts |
|---|---|
| `editor-link.test.ts` | flag true → `/edit/X`; flag false → `${legacy}/?siteId=X`; mock @vercel/edge-config for prod path; verify dev fallback to `process.env.NEXT_PUBLIC_UNIFIED_EDITOR` returns identical shape (eng review D2) |
| `editor-link-encoding.test.ts` | siteId with URL-special chars (`abc def`, `abc%20def`) returns properly-encoded href (eng review D4) |
| `editor-link-context.test.tsx` | `useUnifiedEditorFlag()` returns context value when wrapped; returns false when called outside provider (no throw) (eng review D4) |
| `readUnifiedEditorFlag.test.ts` | dev mode reads `NEXT_PUBLIC_*`; prod reads `@vercel/edge-config`; both return false on read error (no throw) (eng review D4) |
| `getSiteIdFromUrl.test.ts` | `/edit/abc` → `abc`; `?siteId=abc` → `abc`; `/edit/abc?foo=bar` → `abc`; root → null; `/edit/abc%20def` → decoded `abc def` (eng review D4) |
| `userCanEditSite.test.ts` | member → true; non-member → false; missing site → false; Prisma init error → throws (caught by page.tsx) (eng review D4) |
| `EditorClient.test.tsx` | renders skeleton on load; renders AquibraStudio after mount |
| `EditorErrorBoundary.test.tsx` | ChunkLoadError → onRetry calls window.location.reload; generic error → onRetry calls retry callback; renders fallback prop (eng review D4) |
| `EditorClient-key-remount.test.tsx` | changing siteId prop forces full remount of AquibraStudio (no state leak between sites) (eng review D4 — cherry-pick #3 race) |
| `editor-skeleton-hydration.test.tsx` | SSR skeleton dimensions match AquibraStudio first paint within ±2px (cherry-pick #2 drift guard) |
| `EditorSkeleton-tokens.test.tsx` | rendered skeleton uses `--buildrick-*` CSS vars (eng review D4 — D13 CSS isolation guard) |
| `command-registry.test.ts` | `registerCommand` returns working `unregister`; `getActiveCommands('/edit/X')` returns dashboard + editor; `getActiveCommands('/dashboard/sites')` returns dashboard only; no leaks between mounts; `visibleWhen` returns false → command excluded (cherry-pick #4) |
| `CommandPaletteRoot.test.tsx` | Cmd+K opens palette; Esc closes; click action calls then closes; binding suppressed when input focused (eng review D4) |
| `editor-link-prefetch.test.tsx` | `<EditorLink>` triggers `userCanEditSite` query on `mouseenter`; debounced; cancelled on `mouseleave` (cherry-pick #1) |
| `editor-link-prefetch-click.test.tsx` | hover then click within debounce window does NOT double-fire userCanEditSite (eng review D4) |
| `unified-flag-context.test.tsx` | flipping flag value mid-session — cached context value persists; next-page nav reads new value (eng review D4) |
| `EditPage-auth-throw.test.tsx` | auth() throws → page returns error page (not 500); user redirected to login with error toast (eng review D4) |

### Integration tests

| Test | Asserts |
|---|---|
| `app/edit/[siteId]/page.test.tsx` | unauthed → redirects to login; non-member → 404; member → renders EditorClient |
| `editor-mount-smoke.test.tsx` | full mount in jsdom: AquibraStudio reaches `composer ready` |
| `tRPC sameOrigin.test.ts` | mock fetch from editor route hits `/api/trpc/...` without `Origin`, no preflight |
| `css-isolation.test.tsx` | render `<DashboardLayout>` in isolation: no `--buildrick-*` vars on root; render `<EditorClient>`: vars resolve only inside `.bd-studio` scope (eng review D4 — D13 verification) |
| `cross-origin-inventory.test.ts` | static assertion: grep `packages/editor/src/` for `editor.buildrik.com`/`localhost:3000`/`credentials: 'include'` literals → expect zero hits after Phase 0 D14 cleanup |

### E2E tests (Playwright)

| Test | Asserts |
|---|---|
| `e2e/edit-flag-on.spec.ts` | flag ON → click Edit → /edit/[id] mounts; SSR skeleton paints first; canvas paints; autosave fires (eng review D4 cherry-pick #2/#3) |
| `e2e/edit-flag-off.spec.ts` | flag OFF → click Edit → editor.buildrik.com (Vite legacy); flag flip mid-session, next nav goes to /edit/[id] (eng review D4) |
| `e2e/soft-route-siteid-swap.spec.ts` | open /edit/A, edit canvas, soft-route to /edit/B, autosave for A flushes before unmount, B mounts fresh (eng review D4 — cherry-pick #3 race) |
| `e2e/cmdk-context.spec.ts` | Cmd+K from /dashboard/sites shows dashboard cmds only; Cmd+K from /edit/[id] shows dash+editor; running editor cmd from dashboard not possible (eng review D4 — cherry-pick #4) |
| `e2e/cmdk-action-soft-nav.spec.ts` | command running router.push transitions soft-routed; React tree persists; back-button returns instantly (eng review D4 — cherry-picks #3+#4) |
| `e2e/auth-gate-edit.spec.ts` | logged-out → /edit/X → /auth/login?next=/edit/X redirect; non-member → /edit/X → 404; member → loads (eng review D4) |
| `e2e/chunk-load-error.spec.ts` | Phase 1 deploy + force chunk URL miss → ChunkLoadError boundary fires + Reload button shown + reload recovers (eng review D4) |
| `e2e/hover-prefetch.spec.ts` | hover Edit on site card → network panel shows userCanEditSite query fired; hover off mid-fetch → query cancelled; hover then click → instant nav (cached) (eng review D4 — cherry-pick #1) |
| `e2e/observability.spec.ts` | flag flip on → editor.cold_load_ms beacon emitted; route_unified=true Sentry tag set; ChunkLoadError triggers alert (eng review D4 — Phase 3 obs) |
| `e2e/strict-mode-double-mount.spec.ts` | dev-mode strict-mode wrap of EditorClient: composer init fires once, no orphan EventEmitter listeners (eng review D4 — D5 verification) |
| `e2e/dashboard-no-editor-bleed.spec.ts` | navigate /dashboard/sites → /edit/[id] → back → no editor styles persist on dashboard (eng review D4 — D13) |
| `e2e/multi-site-autosave.spec.ts` | open /edit/A, type, soft-route /edit/B before autosave debounce fires → A's pending save still flushes to A (not B) (eng review D4 — critical race) |

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
| 3 | Editor breaks for users | Flip `unifiedEditor=false` in Vercel Edge Config (~10s server-side propagation; users on next nav) |
| 4 | Stale link still hitting `editor.buildrik.com` | Keep redirect, extend 30-day window |

---

## CEO review additions (cherry-pick #4 — unified Cmd+K)

Cherry-pick #4 from the 2026-05-10 CEO review. Architectural enough to warrant its own section.

### Today

- Dashboard owns command palette at `components/search/command-palette.tsx`. Bound to `Cmd+K`. Surfaces dashboard actions only (jump to sites, settings, team, billing).
- Editor likely has its own internal command surface (probably `cmdk`-based given vibcoder Phase 3 organisms shipped a Radix.Dialog + cmdk overlay). Bound to `Cmd+K` within the editor's React tree.
- Two `Cmd+K` bindings co-exist today only because they live on different domains. After unification, both bindings register on the same window — last-mounted wins, or both fire and conflict.

### After unification

- Lift command palette **definition** to root layout (`app/layout.tsx`).
- Commands published via a registry pattern, not owned by any single component.
- Dashboard registers its commands always (open site, jump to billing, etc).
- Editor registers its commands when `/edit/[id]` route is active and `AquibraStudio` has mounted.
- One global `Cmd+K` binding lives in the root layout's command palette host. It opens the palette which surfaces ALL currently-registered commands.

### Contract

**Dependency direction:** type definition lives in `@buildrik/shared`. Singleton implementation lives in dashboard. Editor consumes via React context — never imports dashboard directly. Preserves existing `editor → shared → dashboard` direction (never `editor → dashboard`).

```ts
// packages/shared/command-registry.ts (NEW)
export type Command = {
  id: string;
  label: string;
  group: 'navigation' | 'site' | 'editor' | 'ai' | 'settings';
  icon?: ReactNode;
  shortcut?: string;
  action: (router: AppRouterInstance) => void | Promise<void>;
  visibleWhen?: (route: string) => boolean;
};

// packages/dashboard/components/command-palette/registry.ts (singleton, dashboard-only)
export function registerCommand(cmd: Command): () => void;  // returns unregister
export function getActiveCommands(currentRoute: string): Command[];

// Editor receives registerCommand via React context provider mounted at /edit/[id] route
// Editor never imports from packages/dashboard/* directly
```

### Migration steps (folded into Phase 1)

- [ ] Create `components/command-palette/registry.ts` (registry singleton)
- [ ] Create `components/command-palette/CommandPaletteRoot.tsx` — `'use client'`, mounted in `app/layout.tsx`. Owns `Cmd+K` binding via `useHotkey`. Renders the palette from active registered commands
- [ ] Migrate dashboard's existing `components/search/command-palette.tsx` actions to `registerCommand` calls in a single `dashboard-commands.ts` module that runs at app boot
- [ ] In editor: locate the existing internal command surface. Refactor it to register editor commands into the registry instead of owning its own keypress
- [ ] Editor commands gated `visibleWhen: (route) => route.startsWith('/edit/')`
- [ ] Old `Cmd+K` keypress handlers in editor source — REMOVE (registry now owns it)
- [ ] Test matrix: `Cmd+K` from `/dashboard/sites` shows dashboard commands only. From `/edit/[id]` shows dashboard + editor commands grouped
- [ ] Codex review checkpoint inside Phase 1 — registry-pattern adoption is the highest-risk piece

### Risks specific to this cherry-pick

- Editor has heavy keyboard-shortcut wiring (memory: `useEditorShortcuts.ts`). `Cmd+K` may already be claimed for something other than command palette inside the editor — verify before lifting
- Re-rendering the registry's hot path on every editor state change could cause palette lag; memoize the `getActiveCommands` selector
- Agent-native parity: every registered command becomes addressable by an agent. Care needed that no command performs irreversible action without confirmation step

## Open questions deferred

None at design time. Surfaced during planning if any.

## TODOS.md candidates (deferred from 2026-05-10 CEO review)

- **Token system foundation layer** — single `:root` token block in `app/layout.tsx` that both Tailwind `@theme` and editor's `--buildrick-*` derive from. Blast radius too large during active DS Tier-2 arc. Effort CC ~4 hr. Priority P2. Revisit after DS Tier-2 lands.
- **Editor-as-embed contract** — public-facing iframe API for third-party white-label. Long-term leverage. Effort CC ~1 day. Priority P3.

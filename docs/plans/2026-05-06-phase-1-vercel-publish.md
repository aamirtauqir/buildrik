# Phase 1 — Vercel Publish MVP

**Status:** Spec
**Date:** 2026-05-06
**Predecessor:** `packages/editor/EDITOR_AUDIT_PLAN.md` (Phase 0 shipped at `a7a5dbe9`)
**Issues addressed:** E-001 (Publish backend wiring) from editor audit
**Scope:** Backend wiring only. Editor-side UI changes deferred to Phase 1c.

---

## 1. Problem statement

Today the publish flow looks complete from the user's perspective: Topbar → `Publish` → success → "View Live Site" link. In reality:

- `app/api/workers/publish/[jobId]/route.ts:75-83` runs a 10-second **simulation**: 5 steps × 2-second `delay()` calls.
- `app/api/workers/publish/[jobId]/route.ts:96-98` computes a fake URL: `https://{slug}.buildrik.app` — domain doesn't host anything.
- No actual deployment occurs. No HTML is uploaded anywhere.

Phase 0 (shipped) gated the misleading UI behind `VITE_FEATURE_PUBLISH=false`. Phase 1 makes the underlying pipeline real, then flips the flag.

---

## 2. Inventory — what already exists

### Database (Prisma schema)
| Field/Model | Purpose | Status |
|---|---|---|
| `Site.publishedUrl` | Live site URL after publish | ✓ exists |
| `Site.lastPublishedAt` | Timestamp | ✓ exists |
| `Site.lastPublishError` | Error message if publish failed | ✓ exists |
| `Site.status` | DRAFT/PUBLISHING/PUBLISHED | ✓ exists |
| `PublishBuildJob` | Queued/Building/Completed jobs with `deploymentId`, `progress`, `steps`, `log` | ✓ exists |

### Backend tRPC endpoints (`server/trpc/routers/sites.ts`)
| Endpoint | Purpose | Status |
|---|---|---|
| `sites.saveProject` | Editor autosaves project JSON to DB | ✓ wired |
| `sites.getProjectData` | Editor loads project JSON from DB | ✓ wired |
| `sites.prePublishChecks` | Pages-ready / SEO / Domain / Empty pages / Favicon | ✓ wired |
| `sites.publish` | Creates PublishBuildJob, fires `/api/workers/publish/{jobId}` | ✓ wired |
| `sites.publishStatus` | Returns job status for polling | ✓ wired |
| `sites.cancelPublish` | Cancels in-progress job | ✓ wired |
| `sites.unpublish` | Sets status=DRAFT, clears publishedUrl | ✓ wired |

### Backend service (`server/services/publish.service.ts`)
- `runPrePublishChecks(siteId)` — real, queries Prisma
- `startPublish(siteId, workspaceId, userId)` — real, creates job, fires worker
- `getPublishStatus(jobId)` — real
- `cancelPublish(jobId)` — real
- `completePublish(jobId, publicUrl)` — real
- `unpublishSite(siteId)` — real

### Editor → backend wiring (`packages/editor/src/services/BuildrikSyncProvider.ts`)
- `loadProject(siteId)` — calls `sites.get` + `pages.list`, normalizes to ProjectData
- `saveProject(siteId, projectData)` — calls `sites.saveProject.mutate`
- `getSiteIdFromUrl()` — reads `?siteId=` from URL
- `initBuildrikSync(composer, siteId)` — wires autosave on `project:changed`
- `useComposerInit.ts:15,85` — already uses BuildrikSyncProvider in editor mount path

### Worker route (`app/api/workers/publish/[jobId]/route.ts`)
- Authenticates via `x-worker-secret`
- Updates job progress through 5 steps
- Computes public URL
- Marks site PUBLISHED + sets publishedUrl

**Status:** complete pipeline scaffolding. **Only the actual deployment is missing.**

---

## 3. The actual gap

### Three fake parts that need replacing

1. **Worker simulation** (`route.ts:75-85`) — `await delay(2000)` × 5 → replace with real Vercel API calls:
   - Step 1 "Generating pages" → render HTML for each page
   - Step 2 "Optimizing images" → optionally compress (skip in MVP)
   - Step 3 "Deploying to CDN" → `POST /v13/deployments` to Vercel
   - Step 4 "Verifying SSL" → poll Vercel deployment readiness
   - Step 5 "Performance check" → optionally Lighthouse (skip in MVP)

2. **Public URL computation** (`route.ts:87-98`) — `https://{slug}.buildrik.app` → replace with real Vercel URL returned by API (`https://<slug>-<hash>.vercel.app`).

3. **HTML rendering source** — worker has access to project JSON but no HTML renderer. Two options below.

---

## 4. Architecture choices

### Option A — Server-side HTML renderer
Worker reads `Site` + `Page[]` from Prisma, renders HTML server-side, sends to Vercel.
- ✓ Editor can be closed during publish.
- ✓ Cron-able (auto-republish on schedule).
- ✗ Requires writing/porting an HTML renderer in dashboard (`engine/elements/HTMLParser` is editor-side).

### Option B — Client-side HTML renderer (recommended for MVP)
Editor renders HTML via `composer.exportHTML()`, sends HTML payload as part of `sites.publish` mutation. Server forwards to Vercel.
- ✓ Editor's HTML exporter already exists and is battle-tested.
- ✓ Server stays thin (proxy + Vercel call).
- ✗ Editor must be open + submit-and-wait flow.
- ✗ Cron republish needs Option A later.

**Recommendation: Option B for MVP.** Solves user-visible gap fastest. Option A becomes Phase 7 (when full 4-state machine + cron republish ships).

---

## 5. MVP scope

### What ships
- Real Vercel deployment from editor publish click.
- Real `Site.publishedUrl` written to DB (Vercel-provided URL).
- "View Live Site" + "Copy Published URL" use real URL.
- "Publishing…" loading state with real progress (job polling).
- Error states when Vercel returns failure.

### What is deferred
- Pre-publish checks UI in editor (backend exists, editor can call later)
- Custom domain mapping (Vercel supports it; Phase 1 = Vercel preview URL only)
- Submit-for-Review / Approve / In-Review flow (needs RBAC, Phase 7)
- Unpublish UI (backend exists, edge case)
- Image optimization step
- Lighthouse step
- Server-side HTML renderer (Option A)
- Multi-page publish (Phase 1a covers single-page; multi-page in Phase 1b if simple, else 1d)

---

## 6. Implementation plan — Phase 1 split

### Phase 1a — backend skeleton (this session)
| Item | File | Action |
|---|---|---|
| Vercel API helper | `server/lib/vercel-api.ts` (new) | Pure function `createVercelDeployment(projectName, files): Promise<{ url, deploymentId }>`. No callers yet. |
| Env vars | `.env.example` | Add `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_PREFIX` |
| Spec doc | `docs/plans/2026-05-06-phase-1-vercel-publish.md` (this file) | Approval gate before Phase 1b |

**Why isolate Phase 1a:** keeps changes additive. New file, no edits to existing code paths. Reviewable independently. No risk of breaking the dev simulation.

### Phase 1b — wire worker to Vercel (next session)
| Item | File | Action |
|---|---|---|
| Replace simulation | `app/api/workers/publish/[jobId]/route.ts` | If `VERCEL_TOKEN` present → real deployment; else → keep simulation as dev fallback. |
| Accept HTML payload | `server/trpc/routers/sites.ts` (`publish` mutation) | Add optional `pages: Array<{path, html}>` input. Pass to job context. |
| Pass HTML to worker | `server/services/publish.service.ts` (`startPublish`) | Persist HTML payload in `PublishBuildJob.log` field (existing JSON column). |

### Phase 1c — wire editor PublishDropdown (next session after 1b)
| Item | File | Action |
|---|---|---|
| Render HTML on publish click | `editor/shell/AquibraStudio.tsx` (`onPublish`) | Call `composer.exportHTML()`, gather pages, call `client.sites.publish.mutate({ siteId, pages })` |
| Poll status | new hook `usePublishJob.ts` | `setInterval` calling `sites.publishStatus`, surface progress to PublishDropdown |
| Show real URL | `editor/shell/PublishDropdown.tsx` | "View Live Site" + "Copy Published URL" use `site.publishedUrl` from polled state |
| Flip feature flag | `.env.local` (dev) → docs (prod) | `VITE_FEATURE_PUBLISH=true` |

---

## 7. Vercel API integration details

### Endpoint
`POST https://api.vercel.com/v13/deployments`

### Request shape (minimal)
```jsonc
{
  "name": "buildrik-site-<slug>",
  "target": "production",
  "files": [
    { "file": "index.html", "data": "<base64-or-string>", "encoding": "utf-8" },
    { "file": "about.html", "data": "...", "encoding": "utf-8" }
  ],
  "projectSettings": { "framework": null }
}
```

### Auth
Header: `Authorization: Bearer ${VERCEL_TOKEN}`
Optional team scope: `?teamId=${VERCEL_TEAM_ID}`

### Response (success)
```jsonc
{
  "id": "dpl_abc123",
  "url": "buildrik-site-myslug-abc123.vercel.app",
  "readyState": "QUEUED",
  ...
}
```

### Polling for ready
`GET https://api.vercel.com/v13/deployments/${id}`
- `readyState`: QUEUED → BUILDING → READY (or ERROR)
- Poll every 2s, max 60s timeout.

### Error handling
- 401 → invalid token. Surface as `lastPublishError` on Site.
- 402 → quota exceeded. Same.
- 429 → rate limited. Backoff + retry once.
- 500 → Vercel down. Mark FAILED, allow retry.

### Project model
**One Vercel project per Buildrik Site** is the simplest path:
- Project name pattern: `buildrik-site-<slug>` (must be DNS-safe: lowercase, dashes only).
- First deploy creates the project implicitly.
- Subsequent deploys reuse same project name → URL stable: `buildrik-site-<slug>.vercel.app`.

Alternative considered: shared Vercel project + path routing. Harder; URLs uglier; reject.

---

## 8. Test plan

### Phase 1a (this session)
- [x] `vercel-api.ts` exports types correctly (no fetch call yet — testable later)
- [x] Spec doc complete, reviewable

### Phase 1b (next session)
- [ ] Local dev without `VERCEL_TOKEN`: worker still simulates, current behavior preserved
- [ ] Local dev with `VERCEL_TOKEN`: real deployment, real URL in DB
- [ ] Vercel auth failure: `Site.lastPublishError` populated, UI shows error
- [ ] Cancel mid-flight: job CANCELLED, no orphan deployment

### Phase 1c (next session after 1b)
- [ ] Editor → Publish click → loading state → success → "View Live Site" → opens real URL
- [ ] Subsequent publish: same URL, new content
- [ ] Multi-page site: all pages live at correct paths
- [ ] Editor offline: error surfaced before mutation fires

---

## 9. Rollout

### Production env vars to add
```
VERCEL_TOKEN=<team token from vercel.com/account/tokens>
VERCEL_TEAM_ID=<team id from vercel.com/teams settings>
VERCEL_PROJECT_PREFIX=buildrik-site-     # default if unset
```

### Dev env vars to add (optional)
Same in `.env.local` to test against real Vercel without prod credentials. Use a personal Vercel account with separate token.

### Feature flag flip
After Phase 1c lands and Phase 1b is verified in prod:
- Editor `.env.production`: `VITE_FEATURE_PUBLISH=true`
- Phase 0 honesty fallback (Export HTML button) deactivates automatically when flag flips.

---

## 10. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Vercel rate limits on free/personal token | Phase 1 requires team token. Document in setup. |
| HTML payload exceeds Next.js POST body limit (default 1 MB) | Set `bodySizeLimit: "5mb"` in route config. Multi-page sites with images will need this. |
| Vercel deployment names must be DNS-safe | Add slug validation in `vercel-api.ts`. Reject existing slugs with non-DNS chars. |
| Concurrent publishes on same site | `startPublish` already guards via `ALREADY_PUBLISHING` error. |
| Vercel project quota (100/team free, 1000+ paid) | Document. Failure mode: real-error UI. |
| HTML escapes in Vercel `files[].data` | Encode as base64 to be safe. |
| Editor stuck "Publishing…" if browser closes | Job continues in worker. Next page load polls status, resumes UI state. |
| Cancel race (worker mid-deployment) | Worker checks `status === CANCELLED` between steps; on Vercel side, deployment continues but URL not saved to DB. Acceptable for MVP. |

---

## 11. Out of scope for Phase 1

- Custom domain mapping
- Cron republish
- Server-side HTML renderer
- Image optimization
- Lighthouse score
- Submit-for-Review approval flow (needs Phase 3 RBAC)
- Multi-environment deploys (preview/staging/prod)

---

## 12. Approval gate

Phase 1a (this doc + `vercel-api.ts` skeleton) is preparatory.
**Phase 1b ships only after this spec is approved by the user** because it touches the live worker route.

After approval:
1. Phase 1b: backend wiring (1 session, ~2-4 hours)
2. Phase 1c: editor wiring (1 session, ~2-4 hours)
3. Manual end-to-end test against staging Vercel project
4. Flip `VITE_FEATURE_PUBLISH=true` in prod

Total realistic timeline: **2 short sessions + verification**, not the 1-2 sprints estimated pre-inventory.

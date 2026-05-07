# Phase B — Asset Upload-to-Server

**Date:** 2026-05-07
**Status:** Spec only — no implementation
**Unblocks:** Phase A (folder mirror, deferred 2026-05-07), Phase C usedBytes re-wire (codex P1A fix in `b43a0237` documented as Phase-B-prereq)
**Source:** Today-execution-plan stop-loss + codex review of `3bdafc6f`

---

## Why this spec exists

Two arcs hit the same architectural prereq this session:

1. **Phase A** (`useMediaState` folder ops → tRPC) — deferred because engine generates client-side IDs; server returns CUIDs; without ID reconciliation OR asset upload-to-server, mirroring folder ops creates orphan server records the UI can't reference back.

2. **Phase C** (server quota wiring) — shipped, then codex caught [P1A]: `useUploadState` was preferring `serverQuota.usedBytes` while `MediaManager.uploadFile()` writes only to local IndexedDB. Server bytes lag local reality. Fix in `b43a0237` reverted `usedBytes` to local-as-source-of-truth; `storageTotal` (tier cap) still server-driven because that's accurate even pre-Phase-B. Comment in `useUploadState.ts:99` flags re-wire.

Both unblock when assets persist server-side. This spec scopes the work into 4 sub-phases.

---

## Inventory — what already ships

**Server-side foundation already shipped (commit `1733564c` per memory):**
- `packages/shared/schemas/media.ts` — `createAssetSchema` requires `url: z.string().url()`, `bytes`, `type`, `mimeType`, `filename`, optional `folderId`, `siteId`, `userMetadata`.
- `server/services/media.service.ts` — `createAsset()` enforces quota, returns full asset row.
- `server/services/media-folder.service.ts` — folder CRUD with cycle detection.
- `server/trpc/routers/media.ts` — 13 endpoints wired into `appRouter` at `media.*`.
- `prisma/schema.prisma` — `MediaAsset` table with userId, url, bytes, type, folderId, siteId.

**Editor engine already ships:**
- `MediaManager.uploadFile(file)` validates, sniffs MIME, sanitizes SVG via DOMPurify, calls `readFileAsDataURL` → `this.storage.saveAsset(asset, blob)` (local IndexedDB).
- Emits `UPLOAD_START / UPLOAD_PROGRESS / UPLOAD_COMPLETE / MEDIA_ADDED`.

**The single missing piece:** blob → remote storage → write `media.createAsset` with the resulting URL. No piece of that chain exists today.

---

## Phase B sub-phases

### B1 — Storage backend choice + signed-URL upload primitive

**Goal:** Editor can POST a blob to remote storage and get back a public URL.

**Decision needed:** storage provider.

| Option | Cost | DX | Why |
|---|---|---|---|
| **Vercel Blob** | $0.15/GB/month + bandwidth | `@vercel/blob` SDK, `put()` returns `{url}`. Already wired to Vercel for publish path. | Lowest integration cost — already authed via Vercel deploys. Recommended. |
| Cloudflare R2 | $0.015/GB/month, no egress | S3-compatible, signed URLs via presign | Cheaper at scale but adds AWS SDK dependency + bucket config. |
| Supabase Storage | $0.021/GB/month + bandwidth | Postgres-attached, RLS-aware | Adds Supabase to the stack. Overkill for media-only. |
| Self-hosted (S3 + nginx) | infra ops cost | Full control | Operational burden too high for one-builder team. |

**Recommend Vercel Blob.** Same vendor as publish path means one auth surface, one bill. Switch later if cost becomes a concern.

**Implementation steps:**

B1.1 — Add `@vercel/blob` to `packages/dashboard/package.json`. (~5 min CC)
B1.2 — Add tRPC mutation `media.signUploadUrl` in `server/trpc/routers/media.ts`. Inputs: `{filename, mimeType, bytes}`. Output: `{uploadUrl, publicUrl, fields}`. Returns Vercel Blob's client-token-based signed URL. (~30 min CC)
B1.3 — Add `clientUploadHandler` callback in dashboard route per Vercel docs. Validates user session + plan-tier byte cap before issuing token. (~20 min CC)
B1.4 — Add `services/AssetUploadService.ts` in editor (mirrors PublishService pattern). Method: `uploadBlob(file: File): Promise<{url: string, bytes: number}>`. Wraps the tRPC call + actual blob PUT. (~30 min CC)

**Risk:** Vercel Blob has a 4.5MB request body limit for server-side uploads but the client-token flow handles up to 5GB. Must use client-token, not server-side `put()`.

**Test:** Manual upload of 50MB file end-to-end. Quota error from `media.signUploadUrl` when over plan cap.

### B2 — Wire `MediaManager.uploadFile()` to `media.createAsset`

**Goal:** Local save AND server persistence on every upload. Server CUID becomes the engine's asset ID.

**Implementation steps:**

B2.1 — `MediaManager.uploadFile()` after-local-save (line ~405 of `MediaManager.ts`):
- Call `AssetUploadService.uploadBlob(file)` → get `{url, bytes}`.
- Call `media.createAsset.mutate({url, bytes, type, mimeType, filename, folderId, siteId})` → get server `{id}`.
- Store mapping: replace local `asset.id` with server CUID before emitting `MEDIA_ADDED`. Update IndexedDB key in same transaction.
- (~45 min CC)

B2.2 — Failure handling. If server upload fails (offline, quota, server 500):
- Local asset retained with `localOnly: true` flag.
- Add retry queue at `MediaManager.retryLocalOnlyAssets()` — fires on `online` event + on next upload attempt.
- UI surfaces "Pending sync" badge in MediaTab for `localOnly` assets.
- (~60 min CC)

B2.3 — `composer.media.deleteAsset()` calls `media.deleteAsset.mutate` after local delete. Same retry queue if offline.
- (~20 min CC)

**Risk:** Race between two tabs uploading the same filename. Server-side `createAsset` enforces unique filename per folder per user; second upload gets a `UNIQUE_VIOLATION` and the editor must surface "duplicate" (not crash). Test with two tabs.

**Codex P1A fix re-wire:** After B2 ships, `useUploadState.ts:99` revert: `storageUsed = serverQuota?.usedBytes ?? localStorageUsed`. Also delete the now-stale comment in same file.

### B3 — Asset list reconciliation on project load

**Goal:** Opening a project pulls server's asset list into the engine, not just blocks.

**Implementation steps:**

B3.1 — `BuildrikSyncProvider.loadProject(siteId)` adds:
- `const assets = await client.media.listAssets.query({siteId, limit: 200})`.
- Pass into `composer.media.import(assets)` (new method).
- (~25 min CC)

B3.2 — `MediaManager.import(serverAssets)`:
- For each server asset: if engine has matching CUID, no-op. Else add it to IndexedDB pointing at the server URL (lazy-fetch on render).
- For each engine `localOnly` asset: keep + retry on next online event.
- (~45 min CC)

B3.3 — Folder list parallel: `media.listFolders` query, merge into `MediaManager.folders`.
- (~15 min CC)

**Risk:** Cross-device divergence. User uploads on laptop, deletes on phone, opens laptop — laptop has stale local copy. Phase B treats SERVER as authoritative — local copies that don't match server get dropped on import. Document this in the load path so it's not surprising.

### B4 — Phase A + C unblocked

**Goal:** Re-wire deferred Phase A folder mirror + Phase C usedBytes to use server now that ID reconciliation exists.

**Implementation steps:**

B4.1 — Phase A folder mirror in `useMediaState`:
- `createFolder` calls engine + server in same flow; engine accepts server's CUID as the folder ID.
- `deleteFolder`, `moveFolder` mirror to server.
- `moveAsset` already works because B2 unified IDs.
- (~45 min CC)

B4.2 — Phase C usedBytes re-wire in `useUploadState.ts`:
- Revert local-only `storageUsed = localStorageUsed` to `storageUsed = serverQuota?.usedBytes ?? localStorageUsed`.
- Delete codex-P1A comment block.
- (~5 min CC)

B4.3 — Update `today-execution-plan-20260507.md` items 7 + Phase A defer note to "RESOLVED via Phase B".

---

## Effort + risk summary

| Sub-phase | CC time | Risk | Blocker if skipped |
|---|---|---|---|
| B1 storage primitive | ~85 min | Vercel Blob client-token flow new to project | All asset persistence |
| B2 upload wiring | ~125 min | Race, retry queue, UI surface | Phase A + C re-wire |
| B3 list reconciliation | ~85 min | Cross-device authority rules | Reload-then-edit lose changes |
| B4 unblock Phase A + C | ~50 min | Trivial after B1-B3 | Just bookkeeping |
| **Total** | **~5.75 hr CC** | | |

Single-session realistic if all 4 phases run sequentially. More likely: B1 + B2 one session, B3 + B4 next. Recommend committing per sub-phase, not per-step.

---

## NOT in Phase B scope

- Image transcoding to WebP/AVIF on upload (current UI does it client-side via `ImageEditorModal` — fine)
- CDN purge on delete (Vercel Blob handles automatically)
- Per-user storage migration from local-only to server-side for existing accounts (separate one-shot script)
- Asset version pinning UI (Phase 2 P9, separate plan)
- Cross-site asset sharing (asset cloning) — Phase 4 work

## Acceptance criteria

After B1-B3 ship:
1. Open editor with `?siteId=X`, upload a 5MB image. After upload, refresh page → image still in MediaTab without re-upload.
2. Delete an asset, refresh → still gone.
3. Quota cap enforced server-side: try uploading past tier cap → 403 surfaced as toast.
4. Two tabs uploading same filename → second gets duplicate-handling UX, no crash.
5. Take laptop offline mid-upload → upload retries when online (B2.2).

After B4 ships:
6. Create folder in MediaTab → folder visible in same site from another browser.
7. Codex re-review of B4 commit shows the P1A and P2A findings as resolved.

---

## Open decisions (defer until B1)

- **D1 — Storage region.** Vercel Blob is global by default. If users skew to a region (per analytics), pin it.
- **D2 — Asset URL signing.** Public-read vs signed-URL-per-render. Public-read is simpler; signed-URL adds auth check on each load. Recommend public-read for v1; revisit if hotlinking becomes a concern.
- **D3 — Migration strategy for existing local-only IndexedDB assets.** Two paths: (a) one-shot upload-on-next-load migration, (b) opt-in sync prompt. Defer to a B5 follow-up.

# Lane L1a-2 report — S-3, S-4

Worktree `/Users/shahg/Desktop/buildrik-af-L1a-2`, branch `fix/audit-L1a-2`, base `e143ffbaf`.
Commits: `f475806ed` (S-3), `ecda7fd07` (S-4). Range `e143ffbaf..ecda7fd07`.

## S-3 — fixed `f475806ed`

What changed:
- `server/services/upload.service.ts`: `assertUploadRole` is exported, and the PUT route re-runs it against the pending row. `createPresignedUrl` throws `SITE_NOT_ALLOWED` when a siteId comes with `avatar`, `workspace_icon` or `ticket`. The router maps that to BAD_REQUEST.
- `packages/dashboard/app/api/upload/[fileId]/route.ts`: runs the role re-check before `put()`. PermissionError returns 403 and SITE_REQUIRED returns 400. The route now uses `addRandomSuffix: true` and no longer sets `allowOverwrite`. `fileName` goes through `safeBlobName` in the keys and in the extension fallback.
- `packages/shared/schemas/upload.ts`: new `safeBlobName` (basename only, `[A-Za-z0-9._-]`, no leading dots, 100-char cap, never empty). The S-4 clients use it too.

Tests:
- `__tests__/db/upload-put-authz.db.test.ts` (new, DB tier, `@vercel/blob` and `@server/auth` mocked), 6 tests:
  - An ADMIN presigns a favicon and is demoted to EDITOR in Postgres. The PUT returns 403 and `put` is not called.
  - `put` receives `sites/<id>/favicon.png` with `addRandomSuffix: true` and `allowOverwrite` undefined.
  - A `../../sites/victim/favicon.png` site_media fileName is stored at `media/<ws>/favicon.png`.
  - A siteId on avatar, workspace_icon or ticket is rejected, and no pending row is written.
- `packages/shared/schemas/__tests__/upload.test.ts` (new), 4 tests for `safeBlobName`.
- `__tests__/db/helpers.ts`: added `pendingUpload`, `mediaAsset` and `mediaAssetVersion` to the truncation map. This is a shared helper; the edit only adds entries.

NOT verified:
- Live Blob behaviour. There is no `BLOB_READ_WRITE_TOKEN` locally, so these ledger runtime steps still need to be run on :3000 with a real token:
  - Uploading a favicon twice gives two different cdnUrls that cannot be guessed.
  - A real PUT after demoting the user returns 403.
- Existing favicon/OG blobs at the old fixed keys are left in place as orphans. No cleanup job was added; the ledger marks it optional.

## S-4 — fixed `ecda7fd07`

What changed:
- `server/services/media.service.ts`:
  - New `ownedBlobPrefix(userId)` returns `u/<userId>/`.
  - New `isOwnedBlobUrl(url, userId)` requires https, a `*.public.blob.vercel-storage.com` host, and a path under the prefix after WHATWG normalisation, so `..` and `%2e%2e` are resolved first.
  - `createAsset`, `createAssetVersion` and `restoreAssetVersion` throw `URL_NOT_OWNED`. The existing `assertUrlNotOwnedByOther` stays as defence in depth.
  - `deleteAsset` still deletes the row, but calls `del()` only when `isOwnedBlobUrl` passes.
- `server/trpc/routers/media.ts`:
  - `rethrowPermission` maps `URL_NOT_OWNED` to FORBIDDEN.
  - New `media.uploadPrefix` query returns `{ prefix }`. Clients call it because the editor has no userId of its own.
- `packages/dashboard/app/api/asset-upload/route.ts`: `onBeforeGenerateToken` rejects a pathname outside the prefix, or one with a `..` segment, with `PermissionError`, which returns 403.
- Clients:
  - `packages/editor/src/services/AssetUploadService.ts` and `packages/dashboard/components/media/media-library.tsx` upload to `${prefix}${safeBlobName(name)}`.
  - The clientPayload and the row keep the original filename.

Tests:
- `__tests__/db/media-blob-ownership.db.test.ts` (new, DB tier, `@vercel/blob`, `@vercel/blob/client` handleUpload and `@server/auth` mocked), 10 tests.
- Before the fix, the legacy-row delete test showed `del()` being called on `sites/victim/favicon.png`. That is the exploit, reproduced.
- After the fix, the tests cover:
  - The `isOwnedBlobUrl` matrix.
  - `createAsset` with a foreign favicon URL, or a URL in another user's prefix, throws URL_NOT_OWNED.
  - `createAsset` with an owned URL succeeds.
  - A legacy row is deleted without calling `del`; an owned row calls `del(url)`.
  - `createAssetVersion` and `restoreAssetVersion` refuse foreign URLs, and the asset URL is unchanged.
  - The token route returns 403 for `p.png`, `sites/…`, `u/other/…` and `u/<me>/../other/…`, and 200 for `u/<me>/p.png`.
- `packages/editor/src/services/__tests__/AssetUploadService.test.ts`: the pathname assertion changed to `u/U1/x.png`, and a test was added showing a `../../` filename stays under the prefix.

Behaviour changes to flag:
- **Legacy restore.** Restoring a legacy MediaAssetVersion whose URL sits at the blob root is now refused. This is the ledger's own fix. Such versions still read, and deleting one orphans its blob.
- **Legacy re-create.** Re-creating a row for a legacy root URL is refused. The ledger's risk note covers this.
- **Stock photos.** If stock imports ever go through `createAsset` with Pexels URLs, they would be refused. A grep found none today.

NOT verified:
- A real Vercel Blob upload and delete. The ledger runtime steps still need to be run on :3000 with a real token:
  - Upload in the media library and check that the stored URL contains `/u/<userId>/`.
  - Call `media.createAsset` from devtools with another site's favicon URL and expect FORBIDDEN.
  - The editor upload path (`uploadPrefix` → `upload`) was not run in a browser.
- Whether `@vercel/blob`'s client token is actually bound to the requested pathname. I relied on the SDK contract that it is; our gate runs on the pathname the SDK passes to `onBeforeGenerateToken`.

## Lane gate

- `pnpm test:db`: 3 files, 16 passed and 1 expected fail (the pre-existing `save-race`).
- Root vitest on `__tests__/{media-write-role-gate,media-service-paging,upload-service,router-validation-ssot}.test.ts` and `packages/shared/schemas/__tests__`: 69 passed.
- Editor vitest on `src/services` and `src/engine/media`: 42 files, 568 passed and 2 todo.
- `tsc --noEmit -p packages/dashboard` (which covers server/ and lib/): 0 errors. `tsc --noEmit -p packages/editor`: 0 errors.
- `verify:ds` (run from `packages/editor`; the root package has no such script): exit 0, all gates PASS.

## Cross-lane edits
- `__tests__/db/helpers.ts`: three entries added to `MODEL_TO_TABLE`. Nothing else in the file changed.

## Out-of-scope observations
- The `/api/upload/[fileId]` route still has a `siteId ?? "global"` fallback in `buildBlobPath`. SITE_REQUIRED at presign and at PUT now makes it unreachable. I left it alone.

## Fix round 1 — `7171ca1fd` fix(server): S-4 — refuse encoded separators in owned-blob checks

Changes:
- `server/services/media.service.ts` `isOwnedBlobUrl`: returns false when the raw URL contains `\` or the parsed pathname contains `%`. Our own keys (`u/<cuid>/` + `safeBlobName`) never hold either character, so `..%2F`, `..%5C` and `%2e%2e%2F` can no longer pass.
- `packages/dashboard/app/api/asset-upload/route.ts`: token issue also refuses any `%` or `\` in the requested pathname (403), matching the service check.

Tests, in `__tests__/db/media-blob-ownership.db.test.ts`. All were red on `ecda7fd07` (3 failed / 8 passed):
- `isOwnedBlobUrl` matrix: new rows for `..%2F..%2Fsites%2Fvictim%2Ffavicon.png`, `..%2f`, `..%5C`, `%2e%2e%2F` and a backslash path.
- New test: `createAsset` with an encoded-separator URL throws URL_NOT_OWNED, and `deleteAsset` of a legacy row carrying that URL never calls `del`.
- Token-route loop: new cases for `u/<me>/..%2F..%2F…`, `u/<me>/..%5C…` and `u/<me>/..\..\p.png`, each expecting 403.

Command:
- `npx vitest run --config vitest.db.config.ts __tests__/db/media-blob-ownership.db.test.ts` → Tests 11 passed (11)
- `pnpm test:db` → Test Files 3 passed, Tests 17 passed | 1 expected fail (18)

Deferred per the controller (not done): pinning the blob host to our store, site-thumbnail `allowOverwrite`, the unreachable `"global"` fallback.
Still NOT verified: live Vercel Blob behaviour (no token locally).

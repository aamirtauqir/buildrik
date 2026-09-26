# Lane Lship: fixes from the final whole-branch review

- Worktree: `buildrik-af-Lship`
- Branch: `fix/audit-Lship`, based on `fix/audit-2026-09-25` at `3e298797b`
- Range: `3e298797b..19539d45f` (10 commits, one per item)

## Items

### I-1a: CMS record preview "Open in new tab" (`f2eef3553`, fixed)

- **Root cause:** the button did `window.open(URL.createObjectURL(new Blob([html])))`. A `blob:` page inherits the app origin and its CSP, which allows `'unsafe-inline'`. The preview also keeps the exported `<head>` unsanitized.
- **Fix:** kept the button (option a).
  - It now opens `about:blank` and sets `opener = null`.
  - It then builds a minimal shell through the DOM API: a style tag and a single `iframe` with `sandbox=""` and `srcdoc` set to the page. This is the same isolation the dialog's own frame has.
  - `noopener` is not passed, because with it `window.open` returns null and there would be nothing to write into.
- **Test:** `RecordTemplatePreviewDialog.test.tsx` adds a case with a `<script>` in the head.
  - It asserts `open("about:blank", "_blank")`, that no blob URL is created, and that the opener is null.
  - It asserts there is exactly one iframe, with `sandbox=""` and srcdoc equal to the page.
  - It asserts no script or `h1` lands in the tab's own document.
- **Red→green:** red on the blob URL call, then 6/6 green.

### I-1b: `AnalyticsInjector` raw interpolation (`1592f4a5b`, fixed)

- **Fix:**
  - Ids in script positions are now `JSON.stringify(id)` with `<` escaped as `<`. This covers GA config, Pixel init, Ads config, Clarity and GTM.
  - Ids in URL positions are now `encodeURIComponent`. This covers the gtag loader `src` and the Pixel noscript `img`.
- **Tests:** `AnalyticsInjector.test.ts` adds 3 cases using the payload `x');alert(1);//</script><script>alert(2)</script>"`.
  - Every output has balanced `<script`/`</script` counts and exactly 5 script tags.
  - The escaped literal is present and the old breakout `'x');alert(1)` is gone.
  - URL positions are percent-encoded.
  - 4 existing assertions changed from `'id'` to `"id"` quoting.
- **Red→green:** 7 red, then 35/35 green (including `ExportEngine.siteAnalytics`).

### I-1c: server-side validation of analytics ids (`60dc07b16`, fixed)

- **Shared patterns:** new `packages/shared/schemas/analytics-ids.ts` holds `ANALYTICS_ID_PATTERNS` and `ANALYTICS_ID_FIELDS`, and is exported from the barrel.
  - The editor's `analyticsIds.ts` (`validateProviderId`, used by `AnalyticsScreen.tsx:211`) now reads its patterns from there. Its messages are unchanged.
- **Server:** `saveProjectData` runs `withValidAnalyticsIds(input.settings)`.
  - A malformed or non-string id is emptied and that provider's `verifiedAt` is dropped.
  - Everything else is kept and the save still lands.
- **Test:** new `__tests__/save-project-analytics-ids.test.ts` with 3 cases: valid ids kept, breakout ids emptied with `seo` kept, non-string id emptied.
- **Red→green:** 2 red, then green.
- **Not validated:** `googleAds.conversionId` has no client rule, so no format was invented for it. It is escaped at output by I-1b.

### I-2: cross-site page write in `saveProjectData` (`2680937be`, fixed)

- **Fix:** inside the CAS transaction, right after the claim and before any delete or write, one `tx.page.findFirst({ id in incoming, siteId != input.siteId })` runs.
  - A hit throws `PermissionError("FORBIDDEN")`, which is the existing domain error, and the whole save rolls back.
  - `sites.saveProject` now maps `PermissionError` to a TRPCError with `e.code`.
  - New ids (no row anywhere) are still created under the saving site.
- **DB test:** new `__tests__/db/save-cross-site-page.db.test.ts`, where an EDITOR of site A sends site B's page id.
  - Upsert path: rejects FORBIDDEN, B is unchanged, and A's page and `lastEditedAt` are unchanged.
  - Update path: rejects, B is unchanged.
  - A new id is still created under A.
- **Router test:** `sites-s10-authz.test.ts` gains a `saveProject` case where `PermissionError` maps to FORBIDDEN.
- **Mocks:** 5 unit mocks gained `tx.page.findFirst`.
- **Red→green:** 2 red ("promise resolved"), then green.

### I-3: deploy notes (`a88964c18`, docs)

- `CHANGELOG.md` Deploy section gains a 6-step ordered procedure.
- `docs/cpanel-deploy.md` gains a new section, "Ordered deploy — audit-fix release", with the full commands:
  1. `env:check:prod`.
  2. `pg_dump` snapshot, then an editors-quiet window. The note says why: `20261003100000` is not atomic with an old-code publish, and the reid script bypasses CAS.
  3. `migrate status` then `migrate deploy` over the SSH tunnel.
     - Lists the 5 branch migrations in order: `20261001100000`, `20261001120000`, `20261002100000`, `20261003100000`, `20261003110000`.
     - Notes that earlier main migrations may still be pending (`20260909*`, `20260914*`, `20260924*`).
     - Notes that the new code 500s before `20261001120000` and later are applied.
  4. `reid-duplicate-elements.mjs`: dry run, check the counts, then `--apply`. The note explains that form settings revert to defaults otherwise, and that the tunnel is `127.0.0.1`, so the script's host guard cannot tell production from local.
  5. Code deploy: `prisma generate` before `next build` (the build does not run it), `NEXT_PUBLIC_*` at build time, `rsync --delete`, restart, `BUILD_ID` check, smoke.
  6. `sanitize-dry-run.mjs` on a local restore of the snapshot.

### M-4: local `escapeHtml` in the public form route (`4a73b0cd6`, refactor)

- The local copy is deleted and the route uses the shared `escapeHtmlText`.
- A new route test pins the escaped message page.

### M-5: two `writeClipboardText` copies (`cbd891bac`, refactor)

- The helper now lives in `packages/shared/browser/clipboard.ts` (`git mv` from the editor copy), and `lib/clipboard.ts` is deleted.
- 18 imports and the `api-tokens-tab-copy` mock are repointed.
- The gate-22 overlay-allowlist entry and its header are removed.
- The two guard tests merge into `packages/shared/browser/__tests__/clipboard.test.ts`:
  - It keeps the behaviour cases.
  - It keeps the no-direct-`navigator.clipboard` scan, now over lib, dashboard, editor/src and shared.
  - It adds a scan that fails if any other file defines `writeClipboardText`.
- **Red→green:** red (module missing), then 7/7 green. The editor consumer tests (43) also pass.

### M-6: `duplicateSite` page blocks unsanitized (`89d14042f`, fixed)

- Copied blocks now go through `sanitizeBlocks`.
- **DB test:** a case added to `duplicate-site-forms.db.test.ts`. The copy loses `onerror` and the `javascript:` href, and keeps `src`.
- **Red→green:** red (`onerror` present), then green.

### M-7: AI worker stores model HTML unsanitized (`489b2df00`, fixed)

- `sanitizeBlocks(sectionsToBlocks(...))` now runs before `createMany`.
- **Test:** a case added to `__tests__/ai-generate-worker.test.ts`. `<script>`, `onclick` and `onerror` are stripped and the text is kept.
- **Red→green:** red, then 10/10 green.

### M-8: approval and share-link gates read the raw workspace role (`19539d45f`, fixed)

- **Publish approval:** `startPublish`'s gate uses `getEffectiveSiteRole`, resolved only when the gate is on.
  - A `PermissionError` (no membership any more, e.g. a scheduled publish whose creator left) falls back to `"EDITOR"`. That was the previous `member?.role ?? "EDITOR"` behaviour.
- **Share links:** `createShareLink` uses `getEffectiveSiteRole` for the `allowEditors` check. The member read stays, for plan, settings and `NOT_WORKSPACE_MEMBER`.
- **Tests:**
  - `publish.service.approval.test.ts` adds a case: an OWNER capped to EDITOR gets `APPROVAL_NONE`. Its role mocks moved to a mocked `getEffectiveSiteRole`.
  - `plan-gating.test.ts` adds a case: an ADMIN capped to EDITOR gets `EDITORS_CANNOT_CREATE_LINKS`. It uses the same mock seam.
- **Red→green:** red, then green (92 publish-related and 41 share-related tests).

## Gates

- `npx tsc --noEmit -p packages/dashboard`: exit 0.
- `npx tsc --noEmit -p packages/editor`: exit 0.
- vitest (`--maxWorkers=2`, touched files only):
  - Root: 12 files, 81 tests passed.
  - Editor: 2 files, 36 tests passed, plus `analyticsIds` (5) and the clipboard consumers (43).
  - Publish, share and router neighbours: all green.
- `pnpm test:db` (idle check returned 0 first; `DATABASE_URL_TEST=postgresql://$USER@localhost:5432/buildrik_test`): 17 files, 70 tests passed.
- `pnpm run verify:ds` (packages/editor, foreground): exit 0.

## Not verified

- **I-1a:** the new tab was not checked in a real browser. I did not confirm the CSP/`about:blank` inheritance, that the sandboxed frame renders the page's CSS, or popup-blocker behaviour. Phase 2 should click "Open in new tab" on a CMS record and confirm that `document.origin` inside the frame is `null`.
- **I-1c:** the server empties ids that the old, looser client rules may have saved, for example an 8-character GA id. On the next save such a user loses the id silently. This matches the "drop leniently" brief, but it is visible to users.
- **I-3:** the procedure is documentation only; none of it was executed against production.
- **Cross-lane edits:**
  - `packages/editor/scripts/gates/overlay-allowlist.txt` (M-5).
  - `server/trpc/routers/sites.ts` (I-2 mapping).
  - `lib/` (deleted `clipboard.ts`).
- **Out-of-scope observation:** the AI worker route (`app/api/workers/ai-generate/[jobId]/route.ts`) calls Prisma directly from a route, which skips the service layer. This is pre-existing and was left alone.

## Fix round 1

### I-1c: data loss (`ad227554b`)

- **Change:**
  - The server now checks every provider with one rule, `ANALYTICS_ID_SAFE = /^[A-Za-z0-9_-]{1,128}$/`, after trimming. A safe id is stored trimmed.
  - An injection-shaped or non-string id is still emptied, and its `verifiedAt` dropped.
  - The strict per-provider `ANALYTICS_ID_PATTERNS` are now only the editor's Save-time hint.
  - The header comments in the shared file and in `analyticsIds.ts` were corrected to match.
- **Tests:** `GTM-ABCD`, `GTM-ABCDEFGHIJ`, the 6-character lowercase Clarity id `abc123` and the 8-character GA id `G-ABCD1234` all survive with `verifiedAt`. `x');alert(1)//` is emptied.
- **Red→green:** red (the loose ids were emptied), then 5/5 green.

### I-2: cross-site refusal read as a revoked role (`f17dc8d7e`)

- **Server:** the service now throws `Error("PAGE_NOT_IN_SITE")` instead of `PermissionError`, still inside the CAS transaction with the same rollback. `sites.saveProject` maps it to `BAD_REQUEST` with the message "This save includes a page that belongs to another site, so it was not applied. Reload the site before editing."
- **Editor:** `explainSaveError` recognises "belongs to another site". Manual save now shows "Save failed", a line saying a page from another site was refused and to reload, and the Retry action. Autosave shows its generic "Save failed / Could not save to dashboard", which I checked by code. Neither path goes to view mode or clears the cached role.
- **Tests:**
  - The DB test now expects `PAGE_NOT_IN_SITE` and checks it is not a `PermissionError`.
  - The router test expects `BAD_REQUEST` and the sentence.
  - A `useSaveCallback` test sends a real `TRPCClientError` BAD_REQUEST and asserts the "Save failed" toast mentioning another site and reload, with no role invalidation.
- **Red→green:** all three were red first, then green.

### Gates (round 1)

- tsc: dashboard 0, editor 0.
- Touched vitest: 26 root + 32 editor, all passed.
- `test:db` (idle check 0): 17 files, 70 tests passed.
- `verify:ds`: exit 0.

### Not verified (round 1)

- The editor toast was checked in unit tests only, not in a live tab.

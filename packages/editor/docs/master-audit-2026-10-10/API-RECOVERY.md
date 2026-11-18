# Local API recovery — 10 October 2026

Status: the observed local API blocker is resolved. This is environment recovery and browser verification, not completion of Phase 2 or approval/completion of the wider redesign.

## Authorization and scope

The user requested fixing the problems after the local API 404 blocker was reported. Work was scoped to restoring the development runtime and verifying project/CMS persistence. No production source, API contract, schema, dependency or Figma changes were necessary. Earlier canvas resize/undo findings remain open.

## Evidence and recovery

1. The original resumed runtime returned HTML 404 responses for `/api/auth/session` and tRPC requests although their route source files existed. Project load failed and the editor refused saving with `PROJECT_NOT_LOADED`.
2. The diagnostic webpack runtime returned auth API HTTP 200 but encountered an editor chunk load error. The generated 35 MB chunk passed `node --check`; this alone did not prove successful delivery or browser execution.
3. Stopped the diagnostic server. Moved only `packages/dashboard/.next/dev` to `/private/tmp/buildrick-next-dev-backup-20261010-recovery`, preserving it rather than deleting it. Restarted the existing `npm run dev -- --port 3000` command from the dashboard package.
4. Restored the previously authorized localhost browser session through the scoped Chrome cookie import. No cookie values were exposed or recorded.
5. Fresh Turbopack compilation completed. Auth API, dashboard page, authenticated dashboard tRPC queries and editor page returned HTTP 200. Subsequent project/CMS operations below succeeded.

The successful fresh build supports a generated-development-state explanation. The exact trigger of the earlier invalid state was not isolated; no claim of a permanently fixed Next.js defect or proven cache-corruption mechanism is made. Cold compilation caused browser command timeouts; completed route responses were checked before drawing conclusions.

## Verified browser workflows

Fixture: `Master audit 1010 disposable`, site `cmv1z8k860002yulrh29dr5fw`, previously created for this audit. Other sites were not edited. Nothing was published.

| Check | Result |
|---|---|
| Prior project content loads | Original heading `el-mv1za85t-1mf6w4zthru`, Home and Audit persisted page present |
| New content → save → reload | Inserted Text through Add, Meta+S, observed Saved; paragraph `el-mv23xqsq-1wnqefky6d6` retained exact default text after reload |
| Project save transport | Two `sites.saveProject` POSTs returned HTTP 200; reload `sites.get`/`pages.list`/settings batch returned HTTP 200 |
| CMS collection creation | UI created `API recovery audit 1010`; `cms.collections.upsert` HTTP 200 |
| CMS draft creation | UI saved `Recovered CMS record`, slug `recovered-cms-record`; `cms.entries.upsert` HTTP 200 |
| CMS reload | Opened the persisted collection after reload; record and Draft state visible; no alert shown |
| Independent server read | Read-only `cms.collections.list` returned collection `mv23zaa9-ltneeal` and entryCount 1; `cms.entries.list` returned entry `mv23zuxd-ei1jg8p`, matching title/slug and `DRAFT`, both HTTP 200 |

One diagnostic entries query mistakenly used a DOM test-ID prefix as part of the collection ID and returned the expected domain error `Collection not found`. Reading the actual ID from the collections API and querying it succeeded. This was a probe-input mistake, not recurrence of the missing-route HTML 404.

Screenshot: [CMS after reload](evidence/api-recovery-cms.png). Observations are recorded from live browser/tool results; they are not a raw HAR export.

## Limits

No new application code needed testing because none changed. Verification was the previously failing live HTTP path plus authenticated UI/server persistence. Offline recovery, simultaneous editors, role changes, CMS bindings, media and publish workflows still require their separate Phase 2 checks. The five pre-existing modified source/test files retain their stored baseline hashes.

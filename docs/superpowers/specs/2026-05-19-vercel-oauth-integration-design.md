# Vercel OAuth Integration — Design

**Status:** Spec approved 2026-05-19. Pending plan + implementation.

**Replaces:** the single-shared-token model where `process.env.VERCEL_TOKEN` in `.env.local` deployed all user sites to the dev's personal Vercel account. That model can never ship — billing pool risk, quota mixing, blast radius if leaked.

**Out of scope:** Netlify, Cloudflare Pages, GitHub Pages, self-hosted publish targets. Stay Vercel-only for V1.1.

---

## Goal

Each Buildrik workspace OAuths into a Vercel account once. Subsequent publishes from any editor in that workspace deploy to the workspace's chosen Vercel team. Tokens are encrypted at rest and never exposed to the editor bundle. Revoke and re-connect are first-class.

## Locked decisions (from brainstorm)

| Decision | Choice | Rationale |
|---|---|---|
| Scope | **Per-workspace** | Matches existing schema (`WorkspaceIntegration` model) + Buildrik's workspace-owned-site model + Vercel billing alignment |
| Who can connect/disconnect | **OWNER + ADMIN only** | Symmetric with other workspace-settings mutations. Editors shouldn't touch shared infra |
| Team picking | **Pick at connect time** | One pick covers all sites in workspace. Disconnect-and-reconnect is fine for the rare team-switch case |
| Token storage | **AES-256-GCM, app-level key** | Defense-in-depth without KMS ops overhead. Single `ENCRYPTION_KEY` env var |
| Publish without connection (prod) | **Hard error + toast + deep link** | Discoverable failure. Toast: "Connect Vercel in workspace settings" |
| Publish without connection (dev) | **Fall through to existing simulation path** | Preserves `process.env.NODE_ENV === "development"` escape hatch for local work |
| On Vercel 401 mid-publish | **Mark integration inactive + toast** | Single source of truth (`isActive` flag) drives gate, badge, deep-link |
| OAuth handshake hosting | **Next.js Route Handlers** | Standard OAuth-in-Next.js shape. `authorize` redirects out; `callback` receives `code`+`state` back |

## Architecture

```
┌─────────────────────┐                ┌──────────────────────┐
│  Dashboard          │                │  vercel.com          │
│  app/dashboard/     │                │                      │
│    settings/        │  1. click      │                      │
│    integrations/    ├───Connect─────►│  /oauth/authorize    │
│                     │                │   (user picks team)  │
│                     │                │                      │
│                     │◄──redirect─────┤  → callback w/ code  │
│  app/api/           │                │                      │
│   integrations/     │                │                      │
│    vercel/          │  2. exchange   │                      │
│     authorize ──────┼───code────────►│  /v2/oauth/access_   │
│     callback ◄──────┼───token────────│   token              │
│                     │                │                      │
│                     │  3. list teams │                      │
│                     ├───token───────►│  /v2/teams           │
│                     │◄──teams list───┤                      │
│                     │                │                      │
│  team-picker        │                │                      │
│   page              │  4. user picks │                      │
│                     │   team         │                      │
│                     ├──tRPC─────────►│                      │
│  server/services/   │                │                      │
│   vercel-oauth.svc  │  5. encrypt    │                      │
│   integrations.svc  ├──save row─────►│  WorkspaceIntegration│
│                     │                │   provider="vercel"  │
│                     │                │   config={encrypted} │
│                     │                │                      │
│  Editor publish     │  6. read token │                      │
│   /api/workers/     ├──decrypt──────►│  /v13/deployments    │
│    publish/[jobId]  │                │   (user's account)   │
└─────────────────────┘                └──────────────────────┘
```

### Trust boundaries

- Frontend never sees the access token. Settings page shows only "Connected: <team-name>" + Disconnect.
- `ENCRYPTION_KEY` lives in dashboard env only. Editor (Vite) bundle never touches it.
- OAuth `state` token is HMAC-signed `{workspaceId, userId, nonce, exp}` to prevent CSRF on callback.

## Components

### New files

```
lib/
  encryption.ts                    ~40 LOC. AES-256-GCM helpers.
                                   exports: encrypt(plain: string): string
                                            decrypt(cipher: string): string
                                   Cipher format: "v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>"
                                   v1 prefix lets future key rotation differentiate.

server/services/
  vercel-oauth.service.ts          ~120 LOC. OAuth state machine.
                                   exports:
                                     buildAuthUrl(workspaceId, userId): string
                                     exchangeCodeForToken(code): VercelToken
                                     listTeams(token): VercelTeam[]
                                     saveConnection(workspaceId, token, teamId, vercelUserId)
                                     verifyState(stateToken): {workspaceId, userId} | null

app/api/integrations/vercel/
  authorize/route.ts               ~30 LOC. GET handler. Builds Vercel /oauth/authorize URL
                                   with state token + redirect URI, returns 302.
  callback/route.ts                ~60 LOC. GET handler. Receives ?code + ?state from Vercel.
                                   Verifies state, exchanges code, lists teams, stores temp
                                   state in signed cookie, redirects to team-picker page.

app/dashboard/settings/integrations/
  page.tsx                         ~80 LOC. List existing integrations + Connect Vercel button +
                                   per-integration status badge + Disconnect.
  vercel-team-picker/page.tsx      ~60 LOC. Post-callback page. Reads temp signed-cookie state,
                                   shows team-selector radio list, on submit calls
                                   integrations.vercel.finishConnect tRPC mutation.

prisma/migrations/<ts>_add_vercel_index/
  migration.sql                    Add composite index on (workspaceId, provider) for fast
                                   getActiveVercelConnection lookup.
```

### Modified files

```
lib/vercel.ts                      Drop env reads. authHeaders / teamQueryString become
                                   param-driven.
                                   New signature:
                                     createVercelDeployment({token, teamId, projectName, files})
                                     getDeploymentStatus({token, teamId, deploymentId})
                                     waitForDeploymentReady({token, teamId, deploymentId, signal})
                                   isVercelConfigured() stays as legacy dev-mode probe of
                                   process.env.VERCEL_TOKEN (kept for sim path).

server/services/integrations.service.ts
                                   Extend with helpers:
                                     getActiveVercelConnection(workspaceId): {token, teamId, id} | null
                                     markInactive(id): void
                                   First decrypts via lib/encryption.

server/services/publish.service.ts
                                   Looks up integration → decrypts token → passes to lib/vercel.
                                   On 401 → markInactive + throw VERCEL_TOKEN_INVALID.
                                   On no connection in prod → throw VERCEL_NOT_CONNECTED.

server/trpc/routers/integrations.ts
                                   Add subrouter "vercel" with:
                                     getConnection(workspaceId)     query — returns
                                       {connected: bool, team: string, vercelUserId}.
                                       Never returns token.
                                     finishConnect(workspaceId, teamId?)
                                       mutation — reads pending OAuth state from signed cookie,
                                       resolves token + chosen teamId, encrypts, persists row.
                                     disconnect(workspaceId)
                                       mutation — revokes token via Vercel API DELETE
                                       /v1/integrations/configuration/{configId}, then deletes
                                       WorkspaceIntegration row.

packages/editor/src/editor/shell/Topbar.tsx
                                   Publish button click handler: on VERCEL_NOT_CONNECTED error,
                                   show toast with "Open settings" deep link. Editor calls
                                   dashboard URL via window.open.

.env.local                         Add 4 vars (locked at Phase 0):
                                     VERCEL_INTEGRATION_ID=
                                     VERCEL_CLIENT_ID=
                                     VERCEL_CLIENT_SECRET=
                                     ENCRYPTION_KEY=<openssl rand -hex 32>
```

### File responsibility map

| Concern | Owner |
|---|---|
| Crypto primitives | `lib/encryption.ts` |
| Vercel API HTTP | `lib/vercel.ts` |
| OAuth state machine | `server/services/vercel-oauth.service.ts` |
| Integration row CRUD + plan limits | `server/services/integrations.service.ts` |
| Publish flow gating | `server/services/publish.service.ts` |
| Browser redirects | `app/api/integrations/vercel/{authorize,callback}/route.ts` |
| UI surfaces | `app/dashboard/settings/integrations/page.tsx` + `vercel-team-picker/page.tsx` |
| RPC calls from UI | `server/trpc/routers/integrations.ts` (vercel subrouter) |
| Editor publish gating | `packages/editor/.../Topbar.tsx` |

No file does two unrelated jobs. Each ~30-120 LOC. Modify-list is short (4 files).

## Data flow

### Flow A — First-time Connect (Owner clicks "Connect Vercel")

```
1. Dashboard settings/integrations page
   └ "Connect Vercel" button
     └ Owner clicks → window.location = "/api/integrations/vercel/authorize?workspaceId=ws_xxx"

2. authorize/route.ts (GET)
   ├ Auth: read session, verify user is OWNER or ADMIN of workspaceId
   │ Reject 403 if not.
   ├ Build state token:
   │   stateRaw = base64({workspaceId, userId, nonce: randomUUID(), exp: now+10min})
   │   state    = `${stateRaw}.${hmac-sha256(stateRaw, ENCRYPTION_KEY)}`
   ├ Build Vercel URL:
   │   https://vercel.com/integrations/<VERCEL_INTEGRATION_ID>/new
   │   ?state=<state>
   └ Response.redirect(url, 302)

3. User on vercel.com
   ├ Authenticates if not logged in
   ├ Picks team (personal or work team) — Vercel's own UI
   └ Vercel calls our callback:
     GET <APP_URL>/api/integrations/vercel/callback?code=<code>&state=<state>

4. callback/route.ts (GET)
   ├ Verify state HMAC + exp; reject 400 if tampered/expired
   ├ Extract {workspaceId, userId} from state
   ├ POST https://api.vercel.com/v2/oauth/access_token
   │   body: { code, client_id, client_secret, redirect_uri }
   │   → { access_token, token_type, user_id, team_id }
   │   (team_id present if user picked team during Vercel OAuth)
   ├ If team_id present → skip team-picker, go to step 6 directly
   ├ Else → GET https://api.vercel.com/v2/teams?token=<access_token>
   │   → list user's teams
   ├ Stash transient state in cookie buildrik_vercel_pending (httpOnly,
   │ secure, samesite=Strict, encrypted via lib/encryption.encrypt() of JSON
   │ payload — same AES-256-GCM helper used for stored tokens):
   │   { workspaceId, userId, accessToken, vercelUserId, candidateTeams, exp: now+10min }
   └ Response.redirect("/dashboard/settings/integrations/vercel-team-picker")

5. vercel-team-picker/page.tsx
   ├ Server-component reads buildrik_vercel_pending cookie, decodes, validates exp
   ├ Renders radio list: "Personal account" + each team
   └ User submits → tRPC integrations.vercel.finishConnect({ workspaceId, teamId? })

6. finishConnect mutation
   ├ Auth: verify caller is OWNER/ADMIN of workspaceId AND matches pending.userId
   ├ Read pending cookie, validate match against workspaceId arg
   ├ Encrypt accessToken via lib/encryption.encrypt()
   ├ Upsert WorkspaceIntegration row:
   │   { workspaceId, provider: "vercel", isActive: true,
   │     config: { encryptedToken, teamId, vercelUserId,
   │              configurationId?: string (from Vercel /access_token response
   │              when integration flow used vs raw OAuth — used by Flow D),
   │              connectedAt, connectedBy: userId } }
   ├ Clear buildrik_vercel_pending cookie
   └ Return { success: true }

7. Settings page refetches getConnection → shows "Connected: <team name>" + Disconnect button
```

### Flow B — Publish with valid Vercel connection

```
1. Editor: user clicks Publish
   └ trpc.sites.publish.mutate({ siteId, projectData })

2. server/services/publish.service.ts
   ├ getActiveVercelConnection(workspace.id)
   │  ├ findFirst WorkspaceIntegration { workspaceId, provider:"vercel", isActive:true }
   │  ├ if null → check NODE_ENV
   │  │  ├ "development" → continue with sim path (legacy)
   │  │  └ "production"  → throw VERCEL_NOT_CONNECTED → tRPC error code BAD_REQUEST
   │  └ if row → decrypt config.encryptedToken via lib/encryption.decrypt()
   │     return { token, teamId, id }
   └ enqueue publish job with {token, teamId} attached to job payload
     (in-memory snapshot, never serialized to job table)

3. /api/workers/publish/[jobId]/route.ts (existing worker)
   ├ For each page → build VercelFile array
   ├ createVercelDeployment({ token, teamId, projectName, files })
   ├ waitForDeploymentReady({ token, teamId, deploymentId })
   └ On READY → update Site.publishedUrl, status="PUBLISHED", lastPublishedAt=now

4. Editor polls /api/jobs/<jobId> for status
   └ On done → toast with deployment URL
```

### Flow C — Token failure mid-publish

```
1-2. Same as Flow B steps 1-2 → token retrieved.

3. Worker calls createVercelDeployment
   └ Vercel returns 401 Unauthorized (token revoked, scope changed, etc.)
   └ VercelApiError thrown with status=401

4. publish.service.ts catches VercelApiError
   ├ If status === 401:
   │  ├ integrations.markInactive(integrationId) — flip isActive=false
   │  ├ Update publish job → status="ERROR", error="VERCEL_TOKEN_INVALID"
   │  └ Throw to caller
   └ Else: standard error path (job ERROR, generic message)

5. Editor polling sees ERROR + reason
   └ Toast: "Vercel connection lost. Reconnect in workspace settings." + deep link

6. Owner reopens settings → sees "Connection lost" badge + Reconnect button
   └ Clicks Reconnect → Flow A from step 1
```

### Flow D — Disconnect

```
1. Settings page: Disconnect button click
   └ tRPC integrations.vercel.disconnect.mutate({ workspaceId })

2. disconnect mutation
   ├ Auth: OWNER/ADMIN check
   ├ Read row, decrypt token, extract Vercel integration config id from
   │ config.configurationId (returned by Vercel during install) if present
   ├ Best-effort revoke server-side IF configurationId present:
   │   DELETE https://api.vercel.com/v1/integrations/configuration/<configurationId>
   │   (404/410 are fine — already revoked Vercel-side)
   │   Net errors / 5xx → log warn + proceed (don't block disconnect)
   │   If no configurationId (OAuth-only flow without install) → skip revoke
   │   and surface UI note: "Revoke from vercel.com/account/integrations
   │   if you want to invalidate the token immediately."
   ├ Delete WorkspaceIntegration row (single source of truth)
   └ Return success

3. Settings refetch → Connect Vercel button reappears
```

### Connection lifecycle state diagram

```
                          ┌─────────────────┐
                          │ NOT CONNECTED   │
                          │ (no row exists) │
                          └────────┬────────┘
                                   │ Owner clicks Connect → OAuth → picks team
                                   ▼
                          ┌─────────────────┐
                          │ CONNECTED       │
                          │ isActive=true   │◄─┐
                          └────────┬────────┘  │
                                   │            │ Reconnect → re-OAuth
                Vercel 401 ───────►│            │
                                   ▼            │
                          ┌─────────────────┐  │
                          │ INVALID         │  │
                          │ isActive=false  ├──┘
                          └────────┬────────┘
                                   │ Owner clicks Disconnect
                                   ▼
                          ┌─────────────────┐
                          │ NOT CONNECTED   │
                          └─────────────────┘
```

## Error handling

### Error taxonomy

```
┌──────────────────────────┬────────────────┬─────────────────────────────────────┐
│ Error                    │ Recovery       │ Surface                             │
├──────────────────────────┼────────────────┼─────────────────────────────────────┤
│ Config / setup           │ Dev action     │ Server log, 500 to user             │
│   ENCRYPTION_KEY missing │                │                                     │
│   VERCEL_CLIENT_ID missing                │                                     │
│                                                                                  │
│ User permission          │ User self-fix  │ 403 to user, toast                  │
│   Non-OWNER tries Connect│                │                                     │
│   Cross-workspace state  │                │                                     │
│                                                                                  │
│ OAuth flow               │ Retry flow     │ 400 to user, settings page error    │
│   State HMAC fails       │                │                                     │
│   State expired          │                │                                     │
│   Vercel returns code error                                                     │
│   Vercel /access_token 4xx                                                      │
│                                                                                  │
│ Runtime / token          │ Reconnect      │ markInactive + toast + deep link    │
│   Vercel 401 on publish  │                │                                     │
│   Vercel 403 on deploy   │                │                                     │
│   Token decrypt fails    │                │ (treat as invalid, markInactive)    │
└──────────────────────────┴────────────────┴─────────────────────────────────────┘
```

### Specific failure cases + behavior

**Config missing on server start**
`lib/encryption.ts` throws on first encrypt/decrypt call if `ENCRYPTION_KEY` not set or not 64 hex chars (32 bytes). `vercel-oauth.service.ts` throws on first `buildAuthUrl` call if `VERCEL_CLIENT_ID`/`VERCEL_CLIENT_SECRET`/`VERCEL_INTEGRATION_ID` missing. Both throw clear error messages naming the missing env var. Caller (route handler) catches → 500 JSON `{ error: "INTEGRATION_NOT_CONFIGURED", detail: "ENCRYPTION_KEY missing" }`. No silent fallback — better to break loudly than store unencrypted tokens.

**State token tampering / expiry on callback**
`verifyState` returns `null` if HMAC mismatch OR exp < now. Callback route on null → redirect to `/dashboard/settings/integrations?error=oauth_state_invalid`. Settings page renders banner: "OAuth session expired. Click Connect to retry." Never log the raw state token.

**Vercel /access_token exchange fails**
4xx response means user denied consent OR Vercel-side problem. Callback redirects to `/dashboard/settings/integrations?error=oauth_denied`. Banner: "Vercel didn't authorize the connection. Try again or check your Vercel account."

**Team list fetch fails after token acquired**
Rare — token is valid but `/v2/teams` returns 5xx. Callback proceeds without teams list, redirects to team-picker. Team-picker shows only "Personal account" option + warning: "Couldn't load Vercel teams. You can connect to your personal account or retry."

**finishConnect with mismatched pending cookie**
Pending cookie's workspaceId/userId must match the mutation's args + session. Mismatch → throw `BAD_REQUEST` tRPC error, clear cookie, toast: "Session mismatch. Start over."

**Vercel 401 on publish (Flow C)**
`publish.service.ts` catches `VercelApiError` with `status === 401`. Wraps in transaction: `markInactive(id)` + update publish job → `ERROR` with reason `VERCEL_TOKEN_INVALID`. Editor toast: "Vercel connection lost. Reconnect in workspace settings." + Open-settings link. Editor disables publish button until next page reload (settings refetch will surface "Connection lost" badge).

**Token decrypt fails on read**
`lib/encryption.decrypt()` throws on cipher tampering / wrong key. Treated identically to 401 — `markInactive` + toast + reconnect path. Console-warn at error level so QA notices (could indicate key rotation incident).

**Disconnect with already-revoked token**
DELETE `/v1/integrations/configuration/<id>` returns 404 or 410. Treat as success — row still gets deleted locally. Single source of truth = our DB. Other Vercel-side errors (5xx, network) → log warn, still delete row. Don't block disconnect on best-effort cleanup.

**Race: publish in flight, user disconnects**
Worker already has `{token, teamId}` snapshot in job payload (read once at job creation). Disconnect deletes DB row; in-flight publish completes using snapshotted token. Next publish after disconnect → no row found → VERCEL_NOT_CONNECTED. Acceptable: in-flight job is fire-and-forget; user understanding is "Disconnect stops future publishes."

**Plan limit hit on Connect**
`addIntegration` already throws `INTEGRATION_LIMIT` per existing code. finishConnect catches, returns tRPC `FORBIDDEN` with message "Workspace plan limits reached. Upgrade to add more integrations."

### Logging policy

- Log: error class, HTTP status, route path, workspaceId (not userId).
- Never log: access tokens (raw or encrypted), Vercel team IDs alone, state tokens, OAuth codes.
- Tokens that DO appear in error contexts (e.g., decrypt fail) get redacted to `***` before any console.error.

### Audit trail

Existing `AuditLog` model used for:
- `vercel.integration.connected` — actor = userId, target = workspaceId, metadata = `{teamName}`.
- `vercel.integration.disconnected` — same shape.
- `vercel.integration.invalidated` — system-emitted on 401, no actor.

## Testing

### Test layers + what each catches

```
┌─────────────────────┬──────────────────────────────────────────────────────────┐
│ Layer               │ Catches                                                  │
├─────────────────────┼──────────────────────────────────────────────────────────┤
│ Unit                │ Crypto roundtrip, state HMAC, error classifier            │
│ Service             │ Business logic + plan gates + auth checks                │
│ Route handler       │ Auth + redirect URLs + cookie shape                       │
│ tRPC                │ Mutation guards + caller permissions                      │
│ Integration         │ End-to-end OAuth + publish with mocked Vercel HTTP        │
│ Manual walk         │ Real Vercel OAuth via your account (Phase 3 walk-fix)     │
└─────────────────────┴──────────────────────────────────────────────────────────┘
```

### Unit tests

**`lib/encryption.test.ts`** (~6 cases)
- encrypt → decrypt roundtrip returns original
- encrypt of same plaintext gives different ciphertexts (IV randomness)
- decrypt with wrong key throws
- decrypt of tampered ciphertext throws (authTag check)
- encrypt throws if ENCRYPTION_KEY missing
- encrypt throws if ENCRYPTION_KEY wrong length (< 32 bytes)

**`server/services/vercel-oauth.service.test.ts`** (~8 cases)
- `buildAuthUrl` includes state, redirect_uri, integration_id
- `buildAuthUrl` throws if VERCEL_CLIENT_ID missing
- state token round-trips: build → verify returns same {workspaceId, userId}
- verifyState rejects expired token
- verifyState rejects HMAC-tampered token
- verifyState rejects malformed payload
- exchangeCodeForToken posts correct body shape, returns parsed token (mocked fetch)
- exchangeCodeForToken throws on 4xx

### Service tests

**`server/services/integrations.service.test.ts`** (extend existing file):
- `getActiveVercelConnection(workspaceId)` returns null when no row
- Returns null when row exists but `isActive: false`
- Returns decrypted token + teamId when active row exists
- Decrypt failure → throws + does NOT crash caller
- `markInactive(id)` flips flag, writes AuditLog row

**`server/services/publish.service.test.ts`** (add cases):
- Publish with no Vercel connection in production → throws VERCEL_NOT_CONNECTED
- Publish with no Vercel connection in development → continues to sim path
- Publish with valid connection passes {token, teamId} to vercel client
- Publish job error path on 401 → calls markInactive + reports VERCEL_TOKEN_INVALID

### Route handler tests

**`app/api/integrations/vercel/authorize/route.test.ts`** (~4 cases)
- GET without session → 401
- GET as EDITOR of workspace → 403
- GET as OWNER → 302 redirect, Location header points to vercel.com with state
- Missing workspaceId param → 400

**`app/api/integrations/vercel/callback/route.test.ts`** (~6 cases)
- GET without code → 400
- GET with bad state → redirect to settings?error=oauth_state_invalid
- GET with expired state → same error redirect
- GET with valid state + Vercel exchange success (mocked) → sets pending cookie + redirects to team-picker
- GET with Vercel exchange 4xx → error redirect with oauth_denied
- GET with team_id in token response → skips team-picker, sets connection directly

### tRPC mutation tests

**`server/trpc/routers/integrations.test.ts`** (~5 cases for vercel subrouter)
- `getConnection` returns `{connected: false}` when no row
- `getConnection` returns `{connected: true, team, vercelUserId}` (never token)
- `finishConnect` as non-OWNER throws FORBIDDEN
- `finishConnect` without pending cookie throws BAD_REQUEST
- `finishConnect` with mismatched workspaceId in cookie vs args throws BAD_REQUEST
- `disconnect` deletes row + emits AuditLog + calls Vercel DELETE (mocked, 200 + 410 both fine)

### Integration / mocked-Vercel test

**`server/__tests__/vercel-oauth-flow.integration.test.ts`** (~1 long-form case)
- Mock Vercel API via fetch stub
- Start with empty DB
- Step through: authorize → callback → finishConnect → row exists with encrypted token
- Then: publish flow reads back, decrypts, "deploys" (mocked 200 from Vercel)
- Then: simulate 401 on next deploy → row goes inactive → next publish throws

### Manual walk test (Phase 3)

User-driven, single happy-path + 2 failure paths:
1. **Happy path:** Register Vercel app → paste 3 env vars → Connect from settings → pick team → publish a real site → verify lands in Vercel account → reload editor → publish again still works.
2. **Reconnect:** Revoke token in vercel.com UI → publish in editor → expect 401 → see toast → click Reconnect → re-OAuth → publish succeeds.
3. **Disconnect:** Click Disconnect → confirm dialog → row gone → publish button shows "Connect Vercel first" toast.

### Test naming + location

All tests go alongside source:
- `lib/encryption.test.ts` next to `lib/encryption.ts`
- `server/services/__tests__/X.test.ts` per existing convention
- `app/api/.../route.test.ts` next to route handlers

Total new test count: ~35 unit/service/route cases + 1 integration. Roughly 6-8 new test files.

### What is NOT tested

- Vercel API contract itself (their problem, not ours)
- Encryption library internals (Node crypto is trusted)
- React UI components (existing pattern minimal — integrate with happy-path manual walk)
- Concurrency stress (single-user OAuth flow has no race surface beyond the in-flight publish race already documented in §4)

## Phase plan

Three phases. Each phase ends with green CI + reviewable commits.

### Phase 1 — Backend scaffold (no Vercel registration needed yet)

1. `lib/encryption.ts` + unit tests (no env var needed for tests; pass key as param to internal `_encrypt`/`_decrypt` core functions, wrap with env-read in public API).
2. Add `ENCRYPTION_KEY` slot to `.env.local` template + CLAUDE.md env vars section.
3. Prisma migration: composite index `(workspaceId, provider)` on `workspace_integrations`.
4. Extend `integrations.service.ts` with `getActiveVercelConnection` + `markInactive` + unit tests.
5. Refactor `lib/vercel.ts` to param-driven (no env reads in HTTP helpers). All existing callers updated.
6. Modify `publish.service.ts` to look up connection + handle 401. Tests added.
7. Verify `pnpm verify:ds` green → commit + push.

### Phase 2 — OAuth flow + UI (after Vercel registration)

User must complete Vercel-side registration first (Phase 0):
1. Register app on vercel.com/integrations/console
2. Set Redirect URIs (dev + prod)
3. Set Scopes (`deployments:write`, `projects:write`, `user:read`, `team:read`)
4. Paste Client ID + Secret + Integration ID into `.env.local`

Then ship:
1. `vercel-oauth.service.ts` + unit tests.
2. `app/api/integrations/vercel/authorize/route.ts` + route tests.
3. `app/api/integrations/vercel/callback/route.ts` + route tests.
4. `app/dashboard/settings/integrations/page.tsx` (extend existing if present, else create).
5. `app/dashboard/settings/integrations/vercel-team-picker/page.tsx`.
6. tRPC `integrations.vercel.{getConnection, finishConnect, disconnect}` subrouter + tests.
7. Wire editor Topbar toast for VERCEL_NOT_CONNECTED + deep link.
8. Verify `pnpm verify:ds` green → commit + push.

### Phase 3 — Manual walk-fix (user-assisted)

1. Happy-path walk (Connect → publish → land in your real Vercel).
2. Reconnect walk (revoke from vercel.com → publish errors → reconnect → publish succeeds).
3. Disconnect walk.
4. Document any P0/P1 found in `V1_WALK_AND_FIX.md` (or a fresh `V1_1_WALK.md` for the V1.1 arc).
5. Lift V1 freeze policy if all green.

## What this spec deliberately does NOT cover

- **Custom domains** — Vercel API has `/v9/projects/<id>/domains`. Future arc.
- **Environment variables** — site-specific env vars passed to Vercel build. Future arc.
- **Per-site team override** — Q3 Option C deferred. Workspace-wide team only.
- **Multi-environment publish** (staging / preview) — V1.1 ships production target only.
- **OAuth refresh tokens** — Vercel access tokens are long-lived; no refresh flow exists. Re-OAuth is the only renewal.
- **Webhook subscriptions** — Vercel can push deployment status to a Buildrik webhook. Polling works for V1.1; webhook is an optimization.

## Open questions (none blocking)

- Plan-limit number for "integrations" — current `PLAN_LIMITS[plan].integrations` value not inspected. Worst case: tune the number, no code change.
- Audit-log retention for `vercel.integration.invalidated` — uses existing AuditLog table, no new policy needed.

## References

- Existing publish design: `docs/plans/2026-05-06-phase-1-vercel-publish.md`
- Existing schema: `WorkspaceIntegration` in `prisma/schema.prisma`
- Existing service: `server/services/integrations.service.ts`
- Existing API client: `lib/vercel.ts`
- Vercel OAuth docs: https://vercel.com/docs/integrations/build-your-own
- Vercel API: https://vercel.com/docs/rest-api

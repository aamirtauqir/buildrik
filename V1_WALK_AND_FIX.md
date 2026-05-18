# V1 Walk-and-Fix — Iteration Log

**Spec:** `docs/v1-walk-and-fix-design.md`
**Status:** Loop active. Day 0 setup complete.

## Locked walk script

```
1. dashboard login: qa@buildrik.local / qa-test-1234 (seeded via prisma/seed.ts)
2. dashboard → create site "test-site-N" (N = iteration number)
3. click "Open in editor"
4. editor: add Section → add Heading → add Image (from media tab) → add Button → save
5. editor: Publish dropdown → publish to Vercel
6. wait for live URL → open in new tab → verify 4 elements visible
7. close editor → reopen → verify 4 elements still present
```

## Triage rules

| Severity | Definition | Loop action |
|---|---|---|
| P0 — crash | console.error or uncaught exception breaks flow | Stop. Fix this iteration. |
| P0 — data loss | User edit doesn't persist after save | Stop. Fix this iteration. |
| P1 — flow break | Step fails but workaround exists | Fix after all P0 drained. |
| P2 — cosmetic / slow | Looks bad, works | Log to V1_POST_DEFERRED.md. Out of v1 scope. |

## Iterations

(Iteration entries appended below, newest at bottom.)

## Iteration 1 — 2026-05-18

- Walk: **1/7 steps attempted, 0 passed.** Blocked at Step 1.
- Environment caveat: claude-in-chrome extension UI bleeds into snapshots (MCP/Webhooks panel injected as `@e31+` refs). Did not affect 403 finding below — pure environment noise. Future walks should run in extension-free profile.

### P0 blockers

**P0-1: Login flow blocked at Step 1 — Continue button doesn't progress past email**

- Repro: navigate to `http://localhost:3000/auth`, fill email field with `qa@buildrik.local` (seeded account from `prisma/seed.ts`), click `Continue` button.
- Observed:
  1. First click via @ref returned: `Selector matched multiple elements. Be more specific or use @refs from 'snapshot'.` (browse-binary side effect — but click did register, page state changed)
  2. Pressed Enter on email field as fallback. Page advanced enough to disable Continue button (`@e9 [button] "Continue" [disabled]`).
  3. Console emitted: `[error] Failed to load resource: the server responded with a status of 403 (Forbidden)` at exactly the time of submit.
  4. URL stayed at `http://localhost:3000/auth` — no navigation to password step, magic-link sent state, or dashboard home.
  5. Network log shows no successful auth POST — server rejected the submission.
- Impact: User cannot login. Walk steps 2-7 (site create, editor open, edits, publish, persistence) all gated on login and unreachable.
- Severity rationale: console.error + flow continuation blocked = P0 per triage rules.

Screenshot: `packages/editor/src/.gstack/qa-reports/screenshots/01-auth-after-continue.png` (shows form still on email step after submit attempt).

### Other findings (not blocking Iteration 1)

- **P2 cosmetic**: Continue button is red, but DESIGN.md says single accent = cobalt `#2D6DFF`. Off-brand. Defer to `V1_POST_DEFERRED.md` post-v1.
- **P2 a11y**: Console warning `Missing 'Description' or 'aria-describedby={undefined}' for {DialogContent}`. Radix UI complaint. Defer.
- **P2 cosmetic**: Cookie consent banner (`Accept All` / `Essential Only` / `Manage Preferences`) overlays bottom of page on first visit. Could block clicks on full-width footer elements. Defer.

### Commit

Fix landed via `.env.local` (gitignored) — no source change. See "Fix details" below.

### Re-walk

PASS. Login flow end-to-end:

```
POST /api/trpc/auth.checkEmail      → 200 (80B)
POST /api/trpc/auth.login           → 200 (182B)
POST /api/auth/create-session       → 200 (16B)
GET  /auth/redirect                 → 200
GET  /dashboard                     → 200 (11781B)
GET  /api/trpc/dashboard.[10 batch] → 200 (2624B)
```

URL landed: `http://localhost:3000/dashboard`. Sidebar visible (Dashboard, My Sites, "Free Sites 0/3" quota). "Welcome to Buildrik!" heading present.

Console post-fix: only WebSocket HMR connection errors (dev-only Next.js HMR noise; not user-facing). Pre-existing Radix DialogContent a11y warning unchanged.

### Fix details

- **Root cause:** `.env.local` (gitignored, local-only) had `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` all set to `http://localhost:3100`. Dashboard dev server runs on `:3000` (Next.js default — `dev` script is `next dev --turbopack` with no `-p` flag).
- The CSRF Origin pin at `packages/dashboard/app/api/trpc/[trpc]/route.ts:21-26` allowlist = `[EDITOR_ORIGIN || localhost:5050, NEXT_PUBLIC_APP_URL || localhost:3000]`. With `NEXT_PUBLIC_APP_URL=:3100`, allowlist became `[:5050, :3100]`. Browser POST from `:3000` page → Origin: `:3000` → not in allowlist → 403.
- **Fix:** Changed all 3 env vars to `http://localhost:3000` in `.env.local`. Restarted dashboard. All 3 consumers (`email.service.ts:39`, `create-session/route.ts:25`, `trpc/[trpc]/route.ts:24`) now align.
- **No source change.** `.env.local` is gitignored — commit logs change but cannot ship the file.

### Next blocker

See Iteration 2.

## Iteration 2 — 2026-05-18

- Walk: **Step 1 PASS** (regression check — login still works post-config fix). **Step 2 FAIL.**
- Continued from Iteration 1's live browser session — no fresh login required.

### P0 blockers

**P0-2: `sites.create` returns 500 on click "Start from Scratch"**

- Repro: from `/dashboard`, click "New Site" link → page `/dashboard/sites/new` shows 3 creation modes (Template / AI / Scratch). Fill site name field with `test-site-1`, click `📄 Start from Scratch`.
- Observed:
  - `POST /api/trpc/sites.create?batch=1 → 500 (72ms, 7907B)`
  - Console error: `Failed to load resource: 500 (Internal Server Error)`
  - URL stays at `/dashboard/sites/new`, no redirect to editor
  - Page remains on creation chooser, no error message visible to user
- Dashboard log: `POST /api/trpc/sites.create?batch=1 500 in 72ms (application-code: 54ms)`. 54ms in application code means the handler did run — this is a thrown error, not auth/middleware rejection.
- Cross-check: direct curl WITHOUT session cookie returned `UNAUTHORIZED 401` (correct). So the 500 from browser is NOT auth-related — it's an actual server-side error in the handler when called WITH valid session.
- Impact: Cannot create a site. Walk steps 3-7 (open editor, edit, publish, persistence) all gated on site existence and unreachable.
- Severity rationale: console.error + flow continuation blocked = P0.

### Commit

Fix landed via `npx prisma migrate deploy` (DB-only). No source change.

### Re-walk

PASS. Direct API call returned full site row:

```
POST /api/trpc/sites.create → 200
  → id: cmpbav1xe0007xoe9l6su00kr
  → name: test-site-iter2
  → slug: test-site-iter2
  → status: DRAFT
  → creationMethod: BLANK
  → cspPolicy: null (column now exists)
```

### Fix details

- **Root cause:** Database 3 migrations behind schema. Unapplied:
  - `20260508040253_add_site_security_headers` (adds `cspPolicy`, `hstsMaxAge`, `xFrameOptions`, `referrerPolicy`, `permissionsPolicy`)
  - `20260508041500_add_api_tokens`
  - `20260508050000_add_localization`
- Site model in `prisma/schema.prisma` lists these columns. `prisma migrate status` confirmed unapplied.
- During `sites.create` → `generateUniqueSlug` → `prisma.site.findFirst()`, Prisma generates query against current schema and hits missing column → throws `PrismaClientKnownRequestError: column "sites.cspPolicy" does not exist`.
- **Fix:** `npx prisma migrate deploy` applied all 3 pending migrations. Verified via direct in-browser fetch returning 200 with row data.
- **No source change.** Migration files already existed in `prisma/migrations/`.

### Next blocker

See Iteration 3.

## Iteration 3 — 2026-05-18

- Walk: **Steps 1-2 PASS regression. Step 3 FAIL.**
- Site `test-site-iter2` (created in Iter 2) used as target.

### P0 blockers

**P0-3: Editor crashes on load for blank-method site — "Cannot convert undefined or null to object"**

- Repro: from `/dashboard/sites`, click Edit on `test-site-iter2`. Editor navigates to `http://localhost:5050/?siteId=cmpbav1xe0007xoe9l6su00kr`.
- Observed:
  - Editor shell loads. Dashboard data fetch succeeds (toast: "Project loaded — Loaded from dashboard").
  - Recovery system trips: `[Recovery] Runtime fault (error): Cannot convert undefined or null to object`, followed by `[Recovery] Active page missing, recovering...`
  - User-visible: "Something went wrong" error screen with Reload button. No canvas, no sidebar interactivity.
- Cross-check `sites.create` blank-method response (Iter 2): site row has `pages: 0`. No Page record created for blank sites.
- Hypothesis: editor expects at least 1 active page; blank-method `createSite` skips page creation (template-method does create pages, see `sites.service.ts:184-204`); editor renderer hits undefined when computing active page.
- Impact: Walk steps 4-7 (edit, publish, persistence) unreachable. Editor open for any blank site = crash.
- Severity rationale: console.error + flow continuation blocked = P0.

### Commit

Single-line defensive fix at `packages/editor/src/engine/styles/StyleEngine.ts:490`:
- Before: `Object.entries(style.properties)`
- After:  `Object.entries(style.properties ?? {})`

### Re-walk

PASS. Editor loads. Canvas visible (`@e1 [main] "Design canvas"`). Starter Gallery Modal renders cleanly (Cobalt Default radio checked + 5 other starter options). No "Something went wrong" screen.

### Fix details

- **Root cause:** Wrong hypothesis initially. Investigated:
  1. First guess: 0 pages → editor crash on missing active page. Server-side fix added (auto-create Home page for blank-method sites). Did NOT unblock editor.
  2. Second guess: `root: p.blocks ?? DEFAULT_ROOT` returns `[]` when blocks is empty-array (non-nullish). Did NOT match real stack trace.
  3. Actual: console stack trace pointed to `StyleEngine.generateStyleRule:490` called from `Composer.exportHTML` called from `StudioModals.tsx:119`. `Object.entries(style.properties)` throws on undefined/null properties.
- **Fix:** Default `style.properties` to empty object via nullish-coalescing. Skips empty styles instead of crashing.
- **Reverted** the server-side createSite change + the BuildrikSyncProvider DEFAULT_ROOT shape check (both wrong guesses, no longer needed).
- **Memory cross-ref:** `feedback_phantom_bugs_static_analysis.md` — first 2 hypotheses were phantom-debug pattern. Stack trace beats source-reading speculation.

### Next blocker

Iteration 4 walk: Steps 4-7 (edit, publish, persistence). In progress.

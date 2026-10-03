# CMS C0a — Live Two-Browser Verification Scripts

> Runnable, eyeball-free verification for the 12-row matrix in
> `docs/plans/2026-09-28-cms-c0a-ledger.md` (rows C0.1, C0.1b, C0.2, C0.3, C0.4,
> C0.4b, C0.5, C0.9, C0.10, C0.11, C0.12). **Read-only prep** — these scripts
> are not run against any DB or live server here. Each row describes the exact
> pre-condition, idempotent setup, two-browser action, measurable assertion,
> evidence artifact, and rollback.

## Inputs assumed by every row

- **Worktree:** `~/Desktop/buildrik-worktrees/cms-c0`, branch `feat/cms-c0` (from `main` @ `8e9a3ccb2`).
- **Test site:** `cmugopwzg005nnvjysp00b3pf` (QA E2E, `qa@buildrik.local`).
- **Dev port:** the cms-c0 worktree uses the insp-w4-serve port (`3160`).
- **Dashboard start (per memory `worktree-dev-server-env`):**
  ```bash
  cd ~/Desktop/buildrik-worktrees/cms-c0
  NEXT_PUBLIC_APP_URL=http://localhost:3160 \
    AUTH_URL=http://localhost:3160 \
    NEXTAUTH_URL=http://localhost:3160 \
    pnpm --filter dashboard dev -p 3160
  ```
- **Browser A:** Chrome profile A (cookies include `qa@buildrik.local` session for the dashboard on `:3160`).
- **Browser B:** Chrome profile B (same login), or an incognito window on profile A's machine.
- **Editor URL:** `http://localhost:3160/edit/cmugopwzg005nnvjysp00b3pf`.
- **DB target:** the same Postgres instance `DATABASE_URL` points at from `cms-c0/.env.local`. **Pre-condition for the whole matrix:** the founder has run `cd ~/Desktop/buildrik-worktrees/cms-c0 && pnpm prisma migrate deploy` so `cms_collections.deletedAt`, `cms_entries.deletedAt`, and `sites.cmsEditedAt` exist. Without it `cms.*` 500s.

## Selector cheat-sheet (verified from current chrome)

| Element | Selector |
|---|---|
| Topbar Publish button (shell) | `button` with text matching `^Publish` (or `^Publish changes` when `hasUnpublishedChanges`) — visible label is computed by `lifecycle.ts:252` (`PUBLISH_LABEL`, `Topbar.tsx:184-190`). The shell renders exactly one such `<button>` per `Topbar`. |
| Topbar exit guard pill | `[data-testid="bk-announce-assertive"]` for live regions; pill block carries `aria-live="assertive"`. |
| Publish tab CTA | `[data-testid="publish-cta"]` (button text is `Publish to production` / `Publishing…` / `No new changes` — `PublishTab.tsx:1034`). |
| Publish menu | `[data-testid="publish-menu"]` |
| Publish footer meta | `[data-testid="publish-footer-meta"]` |
| Publish CTA reason (blocker text) | `[data-testid="publish-cta-reason"]` |
| Publish blocked by checks | `[data-testid="publish-blocked-by-checks"]` |
| Cancel publish | `[data-testid="publish-cancel"]` |
| Publish again | `[data-testid="publish-again"]` |
| Build progress | `[data-testid="publish-progress"]` |
| Record sheet | `[data-testid="cms-sheet"]` |
| Record sheet save | `[data-testid="cms-sheet-save"]` (label `Save record` / `Retry save` — `RecordSheet.tsx:494-495`) |
| Record sheet cancel | `[data-testid="cms-sheet-cancel"]` |
| Record sheet close | `[data-testid="cms-sheet-close"]` (aria `Close record`) |
| Record sheet delete | `[data-testid="cms-sheet-delete"]` (in menu) |
| Collection settings | `[data-testid="cms-settings"]` (delete: `[data-testid="cms-settings-delete"]`, confirm delete dialog CTA: `[data-testid="cms-discard-confirm"]`) |
| Dynamic-pages template select | `[data-testid="cms-dp-template"]` |
| Recovery banner | `[role="status"][aria-label="Recovered work"]` (`RecoveryBanner.tsx:72`) |
| Recovery banner keep | button `Keep changes` (`RecoveryBanner.tsx:79`) |
| Toast region | chrome-ui Toast (subscribed by `useCmsSync` for conflicts; titles are `"This record was changed by someone else"` / `"This collection was changed by someone else"` with action labels `Load theirs` / `Keep mine` per `useCmsSync.ts` Task 5 implementation) |

## Blockers before any row can run

1. **Migration deploy is BLOCKED by the auto-mode classifier** (`buildrik-prod-deploy-reality`); founder must issue `cd ~/Desktop/buildrik-worktrees/cms-c0 && pnpm prisma migrate deploy` verbatim. The classifier flags any path that targets an unverifiable DB and the founder's standing rule is "don't pursue the same outcome through other tools." Nothing in this matrix runs without a green migrate.
2. **`DATABASE_URL` must point at the DB the migration just touched** (same instance the editor's tRPC client talks to). `select deletedAt from cms_collections limit 1` must return a column, not `42703`.
3. **Dev server must run from `~/Desktop/buildrik-worktrees/cms-c0`** (not from `~/Desktop/pencil/buildrik`), on port `3160`, with the three URL overrides above.

## Execution order

- **State-mutating rows must run first.** Rows that publish (`C0.1`, `C0.1b`) change the server snapshot used by every later check. Rows that tombstone (`C0.4`, `C0.4b`) make later assumptions about which records exist wrong.
- **Recommended sequential spine:**
  1. `C0.2` (rename) — non-destructive, but it mutates row data and moves the field key. Run before any row that asserts on `cms_entries.data.title`.
  2. `C0.9` (home-template refusal) — purely a refusal check, leaves data unchanged.
  3. `C0.5` (outbox reload) — needs a clean record state; throttled write followed by reload.
  4. `C0.3` (conflict) — needs both browsers seeded with the same Alpha copy.
  5. `C0.4` (tombstones) — tombstones Alpha in B; reload A; **Alpha is gone for every later row.**
  6. `C0.4b` (slug reuse) — deletes collection "ZZ C0a"; **the collection is gone for every later row that needs it.** Run last among the destructive CMS rows.
  7. `C0.1` (server-snapshot publish) — depends on a publishable site and a deployed URL; run last because every prior destructive row could leave records in a state publish would render.
  8. `C0.1b` (publish while offline) — re-uses the same site after `C0.1`; do not re-publish between them, the deploy URL is read once.
  9. `C0.10` (unpublished-changes pill) — needs the publish from `C0.1` to be fresh; do not edit CMS between `C0.1` and `C0.10`.
  10. `C0.11` (recovery banner) — needs an unhandled rejection; do this AFTER any row that depends on a clean `cmsEditedAt` because the recovery sentinel writes to `sessionStorage`.
  11. `C0.12` (truthful save) — last; offline save leaves the row in a "Saved on this device only" state and the next row must reset it.

- **Independent rows that can run in parallel** (different browser profiles, no shared state):
  - `C0.9` is independent of every other row — only reads the dynamic-pages template list.
  - `C0.11` is independent of CMS state — it only needs a runtime fault and a reload.

---

## C0.1 — Publish renders CMS from the server

### Pre-condition
- The founder has run `pnpm prisma migrate deploy` in `cms-c0`.
- `cmsEditedAt` column exists on `sites`. `cms_collections.deletedAt` and `cms_entries.deletedAt` exist.
- Test site `cmugopwzg005nnvjysp00b3pf` has:
  - A page `Home` with a heading bound to `title` of collection `ZZ C0a`.
  - A page `Blog` with a Collection list bound to `ZZ C0a`.
  - Collection `ZZ C0a` with fields `title`, `slug`. Records `Alpha` (PUBLISHED) and `Beta` (PUBLISHED).
- The dev server is running on `:3160` from `cms-c0` (per Blockers).

### Setup commands (idempotent)

```bash
# 1) Confirm DB columns (PASS expected)
PGPASSWORD=$(grep DATABASE_URL ~/Desktop/buildrik-worktrees/cms-c0/packages/dashboard/.env | sed -E 's|.*://[^:]+:[^@]+@([^/]+)/.*|\1|') \
  psql "$(grep DATABASE_URL ~/Desktop/buildrik-worktrees/cms-c0/packages/dashboard/.env | sed -E 's|.*psql //|psql //|' | head -1)" \
  -c "\d cms_collections" -c "\d cms_entries" -c "\d sites" \
  | grep -E "deletedAt|cmsEditedAt"
# Expect three lines: cms_collections.deletedAt, cms_entries.deletedAt, sites.cmsEditedAt.

# 2) Resolve collection id + page ids once (record to /tmp/c0.1-seed.json)
cd ~/Desktop/buildrik-worktrees/cms-c0
node - <<'EOF'
const url = process.env.DATABASE_URL;
require("fs").writeFileSync("/tmp/c0.1-seed.json", JSON.stringify({ url }, null, 2));
EOF

# 3) Idempotent seed via tRPC over the local dev server. Use the QA session
#    cookie from Chrome profile A (export from DevTools → Application → Cookies).
QA_COOKIE="next-auth.session-token=<paste from Chrome A>"
SITE_ID="cmugopwzg005nnvjysp00b3pf"
curl -sS -b "$QA_COOKIE" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3160/api/trpc/cms.collections.list?batch=1" \
  --data "{\"0\":{\"json\":{\"siteId\":\"$SITE_ID\"}}}" \
  | tee /tmp/c0.1-collections.json | jq '.[]?.result?.data?.json[]? | select(.name=="ZZ C0a") | {id, name, slug, deletedAt}'
# If the line is missing OR deletedAt is set, re-seed:
#   - Use the editor (open the test site, Content → CMS) to create the
#     collection, fields, records. The editor writes through CollectionManager
#     → cmsSync → server, so by the time it shows locally the server row is up.
#   - Or, on the SQL side:
PGCMD='psql "$DATABASE_URL"'
eval "$PGCMD" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO cms_collections (id, "siteId", name, slug, fields, "displayField", "createdAt", "updatedAt")
VALUES ('zz-c0a', 'cmugopwzg005nnvjysp00b3pf', 'ZZ C0a', 'zz-c0a',
        '[{"id":"title","name":"Title","slug":"title","type":"text","order":0},
           {"id":"slug","name":"Slug","slug":"slug","type":"text","order":1}]'::jsonb,
        'title', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO cms_entries (id, "collectionId", data, status, "createdAt", "updatedAt")
VALUES
  ('alpha', 'zz-c0a', '{"title":"Alpha","slug":"alpha"}'::jsonb, 'PUBLISHED', now(), now()),
  ('beta',  'zz-c0a', '{"title":"Beta", "slug":"beta"}'::jsonb,  'PUBLISHED', now(), now())
ON CONFLICT (id) DO NOTHING;
SQL

# 4) Capture the publish state — the LAST published deploy URL we will curl:
curl -sS -b "$QA_COOKIE" \
  "http://localhost:3160/api/trpc/sites.getPublishState?batch=1&input=$(jq -nc --arg s "$SITE_ID" '{0:{json:{siteId:$s}}}')" \
  | tee /tmp/c0.1-publish-state.json
# Expect: .result.data.json.publishedUrl to be present (qa workspace publishes to real Vercel).
PUBLISHED_URL=$(jq -r '.[0].result.data.json.publishedUrl' /tmp/c0.1-publish-state.json)
echo "$PUBLISHED_URL" | tee /tmp/c0.1-published-url.txt
# If empty: the site has not been published yet. Do one warm-up publish via the
# editor (Publish → Publish to production) and wait for the toast, then re-read.
```

### Action

- In **Browser B** on the editor: open the record sheet for `Beta` and click `[data-testid="cms-sheet-delete"]`, confirm in the delete dialog.
- **Do not reload Browser A.**
- In **Browser A** on the editor: click the Topbar's Publish button (label `Publish changes` because the local delete is queued but the server snapshot still has Beta).
- Wait for the publish-progress block to resolve to the published state.

### Assertion (eyeball-free)

```bash
PUBLISHED_URL=$(cat /tmp/c0.1-published-url.txt)
BLOG_URL="${PUBLISHED_URL%/}/blog"

# 1) Deployed page must NOT contain Beta
curl -sS "$BLOG_URL" | tee /tmp/c0.1-blog-html.txt
grep -c "Beta" /tmp/c0.1-blog-html.txt | tee /tmp/c0.1-beta-count.txt
# PASS when the count is 0.

# 2) Deployed page MUST contain Alpha
grep -c "Alpha" /tmp/c0.1-blog-html.txt | tee /tmp/c0.1-alpha-count.txt
# PASS when the count is ≥ 1.

# 3) Server-side: Beta is tombstoned, Alpha is live PUBLISHED
eval "$PGCMD" -v ON_ERROR_STOP=1 <<'SQL' | tee /tmp/c0.1-rows.txt
SELECT id, status, "deletedAt" IS NOT NULL AS tombstoned
FROM cms_entries
WHERE id IN ('alpha','beta') AND "collectionId"='zz-c0a'
ORDER BY id;
SQL
# PASS: alpha PUBLISHED deletedAt=NO; beta tombstoned=YES (or both rows reflect
# the post-publish snapshot, since the server snapshot the publish ran from had
# Beta at the time B's delete was queued locally but had not yet reached the
# server).
```

### Evidence
- `/tmp/c0.1-collections.json` — list of collections (proves site load).
- `/tmp/c0.1-published-url.txt` — the URL curl will hit.
- `/tmp/c0.1-blog-html.txt` — raw deployed HTML.
- `/tmp/c0.1-beta-count.txt`, `/tmp/c0.1-alpha-count.txt` — grep counts.
- `/tmp/c0.1-rows.txt` — DB state after the publish.

### Rollback
- The publish itself is non-destructive (server snapshot was already correct). Recreate `Beta` so the test site is back to the canonical state:
  ```sql
  INSERT INTO cms_entries (id, "collectionId", data, status, "createdAt", "updatedAt")
  VALUES ('beta', 'zz-c0a', '{"title":"Beta","slug":"beta"}'::jsonb, 'PUBLISHED', now(), now())
  ON CONFLICT (id) DO UPDATE SET status='PUBLISHED', "deletedAt"=NULL, data=EXCLUDED.data, "updatedAt"=now();
  ```
- The test site is ready for the next row once `SELECT count(*) FROM cms_entries WHERE id='beta' AND "deletedAt" IS NULL;` returns 1.

---

## C0.1b — Publish refuses while CMS changes are unsynced

### Pre-condition
- Same site as C0.1, but the Local dev server has been restarted (or the outbox cleared by Browser A's IndexedDB) so that `cmsEditedAt` is recent.
- A successful publish from C0.1 must have completed (so the `publishedUrl` exists and `lastPublishedAt` is set).
- The Topbar button in Browser A currently reads `Publish changes` (i.e. `hasUnpublishedChanges=true`).

### Setup commands
```bash
# Nothing to seed. Re-confirm the published URL is fresh from C0.1:
PUBLISHED_URL=$(cat /tmp/c0.1-published-url.txt)
[ -n "$PUBLISHED_URL" ] || { echo "Run C0.1 first"; exit 1; }
```

### Action
1. In **Browser A**, open DevTools → Network → "Offline" (the throttling dropdown).
2. Open the `Alpha` record sheet, change the `Title` field, click `[data-testid="cms-sheet-save"]`. The save will succeed locally and queue the mirror.
3. While still offline, click the Topbar Publish button.
4. **Then** flip DevTools back to "Online".
5. Watch for `[data-testid="publish-cta-reason"]` text and for the publish button to remain disabled.

### Assertion (eyeball-free)
- The Topbar Publish button's `aria-disabled` is `true` while offline with a queued mirror; clicking it does not navigate.
- After clicking, the toast region (chrome-ui `Toast`) shows the message containing `"hasn't reached the server yet"` or `"haven't reached the server yet"` — produced by `cmsSyncBlocker()` in `cmsSync.ts`. (Source: implementation Task 6 `cmsSyncBlocker` returns `"${n} CMS change${...} hasn't reached the server yet. Retry the sync, then publish."`.)
- `[data-testid="publish-progress"]` is NOT in the DOM (no publish job started).
- After flipping online, the queue flushes (visible as the badge counter returning to 0) and the publish button is enabled again.

Concrete measurement (Playwright probe, run AFTER the click while still offline):
```ts
// pseudocode for the assertion runner
expect(page.getByTestId("publish-cta").getAttribute("aria-disabled")).toBe("true");
expect(page.getByText(/hasn't reached the server yet|haven't reached the server yet/)).toBeVisible();
expect(await page.getByTestId("publish-progress").count()).toBe(0);
```

### Evidence
- Screenshot: `screenshots/c0.1b-offline-click.png` (DevTools offline + Toast visible).
- Screenshot: `screenshots/c0.1b-online-flush.png` (queue empty, button enabled again).
- DOM snapshot JSON to `/tmp/c0.1b-dom.json`.

### Rollback
- `Alpha` was edited locally; the edit will mirror on reconnection. To leave a clean slate, restore the original title:
  ```sql
  UPDATE cms_entries SET data = jsonb_set(data, '{title}', '"Alpha"'), "updatedAt"=now()
  WHERE id='alpha' AND "collectionId"='zz-c0a';
  ```
- Also clear the editor's outbox in Browser A: DevTools → Application → IndexedDB → delete the cms DB; refresh the editor.

---

## C0.2 — Field-key rename reaches server records

### Pre-condition
- `ZZ C0a` exists with field `title` (key `title`), records `Alpha` and `Beta` both PUBLISHED with `data.title`.
- Browser A is on the editor's CMS panel for `ZZ C0a`.

### Setup commands
```bash
eval "$PGCMD" -v ON_ERROR_STOP=1 <<'SQL' | tee /tmp/c0.2-before.txt
SELECT id, data FROM cms_entries
WHERE "collectionId"='zz-c0a' AND "deletedAt" IS NULL
ORDER BY id;
SQL
# Each row must show "title":"Alpha" / "title":"Beta".
```

### Action
- In Browser A, open `ZZ C0a` → field `title` → "Edit field". Change the field key (slug) from `title` to `name`. Save.
- Wait ~3 s for the per-record mirror to reach the server (Task 7 emits `CMS_CONTENT_UPDATED` per migrated record).

### Assertion (eyeball-free)
```bash
eval "$PGCMD" -v ON_ERROR_STOP=1 <<'SQL' | tee /tmp/c0.2-after.txt
SELECT id, data
FROM cms_entries
WHERE "collectionId"='zz-c0a' AND "deletedAt" IS NULL
ORDER BY id;
SQL
# PASS conditions:
#   - Both rows have data->>'name' populated with the original title value.
#   - Neither row has data->>'title' (key removed).
# One-liner check:
jq -e 'all(.[]; has("name") and (has("title")|not))' /tmp/c0.2-after.txt
# Exit 0 = pass.
```

### Evidence
- `/tmp/c0.2-before.txt` — DB before rename.
- `/tmp/c0.2-after.txt` — DB after rename.

### Rollback
- Rename `name` back to `title` in the editor; the symmetric migration restores the original keys:
  ```bash
  # Wait for the mirror to land, then verify:
  eval "$PGCMD" -c "SELECT id, data FROM cms_entries WHERE \"collectionId\"='zz-c0a' AND \"deletedAt\" IS NULL ORDER BY id;"
  ```
- If the editor rename fails (e.g. server CONFLICT), restore directly:
  ```sql
  UPDATE cms_entries SET data = jsonb_set(data, '{title}', data->'name') - 'name', "updatedAt"=now()
  WHERE "collectionId"='zz-c0a';
  ```

---

## C0.3 — Save conflict surfaces "changed by someone else"

### Pre-condition
- Both Browser A and Browser B are on the editor for the same site.
- Both have opened the `Alpha` record sheet and made different in-progress edits (Browser A: change `Title` to "A-new"; Browser B: change `Title` to "B-new"). Neither has saved yet.
- `ZZ C0a.Alpha` is PUBLISHED and the local row has a `serverStamp` for `entry:alpha` in `localStorage` under `STAMP_STORAGE_KEY` (this is automatic on first hydration).

### Setup commands
```bash
# Nothing to seed — both browsers loaded the same site. Confirm Alpha is PUBLISHED:
eval "$PGCMD" -c "SELECT id, data, status, \"updatedAt\" FROM cms_entries WHERE id='alpha' AND \"collectionId\"='zz-c0a';"
```

### Action
1. In **Browser B**, click `[data-testid="cms-sheet-save"]` for Alpha. The save resolves; the row's `updatedAt` advances; the toast "Record saved · ZZ C0a" appears.
2. In **Browser A** (still on the open sheet with the dirty "A-new" value), click `[data-testid="cms-sheet-save"]`. The mirror returns `CMS_CONFLICT:<new updatedAt>`; `useCmsSync` fires `onCmsConflict` and a chrome-ui Toast appears with title `"This record was changed by someone else"` and actions `Load theirs` / `Keep mine`.
3. **Do not click either action yet.** Capture the DOM.

### Assertion (eyeball-free)
- A toast with title text matching `/This record was changed by someone else/` is visible.
- The toast contains two action buttons whose text matches `Load theirs` and `Keep mine`.
- The DB row's `data.title` still equals B's value (`"B-new"`); A's value is NOT yet written:
  ```bash
  eval "$PGCMD" -c "SELECT data->>'title' AS title FROM cms_entries WHERE id='alpha';" | tee /tmp/c0.3-row.txt
  ```
  PASS when the row holds `"B-new"`.
- Click `Keep mine`; the toast dismisses; another mirror runs without a precondition (`forgetServerStamp('entry:alpha')` is called first); the DB row's `title` becomes `"A-new"`.
- Click `Load theirs` in a fresh sheet open after that: the DB row's `title` is `"B-new"`.

### Evidence
- `/tmp/c0.3-row.txt` — DB row at the conflict moment.
- Screenshot `screenshots/c0.3-conflict-toast.png`.
- DOM snapshot `/tmp/c0.3-dom.json` (toast region + button text).

### Rollback
- Resave both A and B's views to bring them back into agreement:
  ```sql
  UPDATE cms_entries SET data = jsonb_set(data, '{title}', '"Alpha"'), "updatedAt"=now()
  WHERE id='alpha' AND "collectionId"='zz-c0a';
  ```
- Clear Browser A's `localStorage[STAMP_STORAGE_KEY]` so the next row's precondition is correct.

---

## C0.4 — Deletes reach every device (tombstones hydrate)

### Pre-condition
- Both browsers A and B loaded `Alpha` into the editor.
- The collection `ZZ C0a` has `Beta` and `Alpha` both PUBLISHED (post C0.1 rollback if needed).

### Setup commands
```bash
# Ensure Alpha exists and is loaded in both browsers:
eval "$PGCMD" -c "SELECT id, status, \"deletedAt\" FROM cms_entries WHERE \"collectionId\"='zz-c0a' ORDER BY id;"
# Expect: alpha PUBLISHED, deletedAt=NULL; beta PUBLISHED, deletedAt=NULL.
```

### Action
1. In **Browser B**: open Alpha's sheet, click `[data-testid="cms-sheet-delete"]`, confirm in the delete dialog.
2. Wait ~2 s for B's delete mirror to reach the server.
3. In **Browser A**: hit **Cmd-R / Ctrl-R** (hard reload) so hydration runs against the new server state.
4. The record table for `ZZ C0a` should now show only `Beta`.
5. **Bonus** — in a third tab (also on Browser A, before reloading): edit the stale Alpha copy, then save. The save should be refused with `CMS_GONE` and the row should disappear locally (the `useCmsSync` `gone` branch calls `forgetServerStamp('entry:alpha')` and `engine.forgetLocal('entry', 'alpha')`).

### Assertion (eyeball-free)
- After Browser A reloads, the records table (`cms-ws-records` region) lists only Beta. Use Playwright:
  ```ts
  const rows = await page.getByTestId("cms-ws-row").all();
  expect(rows.map(r => r.textContent)).not.toContain(/Alpha/);
  ```
- The DB row for Alpha has `deletedAt` set:
  ```bash
  eval "$PGCMD" -c "SELECT id, \"deletedAt\" FROM cms_entries WHERE id='alpha';" | tee /tmp/c0.4-row.txt
  ```
  PASS when `deletedAt` is non-null.
- A subsequent save of Alpha's stale copy in A produces NO new row:
  ```bash
  eval "$PGCMD" -c "SELECT count(*) AS alive_alpha FROM cms_entries WHERE id='alpha' AND \"deletedAt\" IS NULL;" | tee /tmp/c0.4-count.txt
  ```
  PASS when `alive_alpha = 0`.

### Evidence
- `/tmp/c0.4-row.txt` — Alpha is tombstoned.
- `/tmp/c0.4-count.txt` — no resurrected row.
- Screenshot `screenshots/c0.4-after-reload.png` (only Beta in the table).

### Rollback
- **This row tombstones Alpha; later rows cannot assume Alpha exists.** Restore it explicitly when no further rows need it (see Cleanup at the end of the matrix):
  ```sql
  INSERT INTO cms_entries (id, "collectionId", data, status, "createdAt", "updatedAt", "deletedAt")
  VALUES ('alpha', 'zz-c0a', '{"title":"Alpha","slug":"alpha"}'::jsonb, 'PUBLISHED', now(), now(), NULL)
  ON CONFLICT (id) DO UPDATE SET "deletedAt"=NULL, status='PUBLISHED', "updatedAt"=now();
  ```

---

## C0.4b — Slug reuse after collection delete

### Pre-condition
- `ZZ C0a` exists and has at least one record.

### Setup commands
```bash
# Capture the current collection id (it is `zz-c0a` if seeded by C0.1 setup):
eval "$PGCMD" -c "SELECT id, slug, \"deletedAt\" FROM cms_collections WHERE name='ZZ C0a';"
```

### Action
1. In the editor: open `ZZ C0a` → Settings → Delete → confirm.
2. Without reloading, immediately recreate a collection named `ZZ C0a` (slug auto-derives) via the CMS "+" → New collection flow.

### Assertion (eyeball-free)
- No HTTP 500 anywhere. Tail the dashboard log:
  ```bash
  tail -F ~/Desktop/buildrik-worktrees/cms-c0/packages/dashboard/.next/dev.log 2>/dev/null | grep -E "500|CMS_GONE|CMS_CONFLICT" > /tmp/c0.4b-serverlog.txt &
  ```
- The new `ZZ C0a` row exists with `deletedAt=NULL`:
  ```bash
  eval "$PGCMD" -c "SELECT id, name, slug, \"deletedAt\" FROM cms_collections WHERE name='ZZ C0a' AND \"deletedAt\" IS NULL;" | tee /tmp/c0.4b-row.txt
  ```
  PASS when at least one row is returned and `deletedAt IS NULL`.
- The previous collection row is tombstoned (its slug is rewritten to `<slug>~deleted~<id>`):
  ```bash
  eval "$PGCMD" -c "SELECT id, slug, \"deletedAt\" FROM cms_collections WHERE name='ZZ C0a' ORDER BY \"updatedAt\" DESC;" | tee /tmp/c0.4b-all.txt
  ```

### Evidence
- `/tmp/c0.4b-row.txt` — live collection after recreate.
- `/tmp/c0.4b-all.txt` — both rows (tombstoned + new).
- `/tmp/c0.4b-serverlog.txt` — server log (should be empty of 500s).

### Rollback
- Delete the new collection (settings → delete) to restore a single tombstoned row:
  ```sql
  DELETE FROM cms_collections WHERE name='ZZ C0a' AND "deletedAt" IS NULL;
  ```
- Test site is left with one tombstoned collection named `ZZ C0a`; the final Cleanup section restores the canonical state.

---

## C0.5 — Outbox replay after reload (network throttle)

### Pre-condition
- The editor is open in Browser A on the test site.
- A record exists in `ZZ C0a` (e.g. `Alpha` if not tombstoned by C0.4 yet, or a freshly created `Gamma`).

### Setup commands
```bash
# Create a fresh record so this row does not depend on prior state:
eval "$PGCMD" <<'SQL' | tee /tmp/c0.5-seed.txt
INSERT INTO cms_collections (id, "siteId", name, slug, fields, "displayField", "createdAt", "updatedAt")
VALUES ('zz-c0a-outbox', 'cmugopwzg005nnvjysp00b3pf', 'ZZ C0a Outbox', 'zz-c0a-outbox',
        '[{"id":"title","name":"Title","slug":"title","type":"text","order":0}]'::jsonb,
        'title', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO cms_entries (id, "collectionId", data, status, "createdAt", "updatedAt")
VALUES ('gamma', 'zz-c0a-outbox', '{"title":"Gamma"}'::jsonb, 'PUBLISHED', now(), now())
ON CONFLICT (id) DO NOTHING;
SQL
# Reload Browser A so the editor's IndexedDB picks up the new collection.
```

### Action
1. In Browser A: open DevTools → Network → "Slow 3G".
2. Open the `Gamma` record sheet, change Title to "Gamma · edited", click Save. The save resolves locally and the mirror is queued in `bk-cms-outbox-v1`; the slow throttle keeps the in-flight request from completing within the 1 s window.
3. **Within 1 s** of clicking Save, hit **Cmd-R / Ctrl-R** (hard reload). The page reloads mid-mirror.
4. Wait 30 s for the outbox replay to complete.

### Assertion (eyeball-free)
```bash
eval "$PGCMD" -c "SELECT data->>'title' AS title FROM cms_entries WHERE id='gamma' AND \"collectionId\"='zz-c0a-outbox';" | tee /tmp/c0.5-after.txt
# PASS when title = 'Gamma · edited'.

# Confirm the outbox cleared (read IndexedDB? or query localStorage on a probe page):
# localStorage.getItem('bk-cms-outbox-v1') should be '[]' or absent.
```

### Evidence
- `/tmp/c0.5-seed.txt` — pre-state.
- `/tmp/c0.5-after.txt` — post-state.
- Screenshot `screenshots/c0.5-after-reload.png` (Gamma row visible with the new title).

### Rollback
- Reset Gamma's title and remove the outbox collection so the test site is not polluted:
  ```sql
  DELETE FROM cms_entries WHERE "collectionId"='zz-c0a-outbox';
  DELETE FROM cms_collections WHERE id='zz-c0a-outbox';
  ```
- In Browser A: clear IndexedDB for the cms DB; reload.

---

## C0.9 — Home page is never offered as a collection template

### Pre-condition
- The editor's CMS panel is open, on the `Pages` (Dynamic pages) tab for any collection in this site.

### Setup commands
```bash
# Nothing to seed — this is a refusal check. Open the dynamic-pages pane for
# ANY collection (use the seeded `ZZ C0a`).
```

### Action
- In the editor, CMS → Pages tab → for a collection, look at the **Template page** dropdown (`[data-testid="cms-dp-template"]`).

### Assertion (eyeball-free)
```ts
const opts = await page.getByTestId("cms-dp-template").locator("option").allTextContents();
expect(opts).not.toContain("Home");
expect(opts.some(o => o.includes("Blog"))).toBe(true);
```

Also probe the server refusal path (no need to actually click Save):
```bash
# Direct server check: attempt to upsert a collection with pageTemplatePath='index.html'
QA_COOKIE="next-auth.session-token=<paste>"
curl -sS -b "$QA_COOKIE" -H "Content-Type: application/json" \
  -X POST "http://localhost:3160/api/trpc/cms.collections.upsert?batch=1" \
  --data "{\"0\":{\"json\":{\"siteId\":\"$SITE_ID\",\"id\":\"probe\",\"name\":\"Probe\",\"slug\":\"probe\",\"fields\":[],\"pageTemplatePath\":\"index.html\"}}}" \
  | tee /tmp/c0.9-server.txt
# PASS when the response is a 4xx with code "BAD_REQUEST" or message containing
# "home page can't be a collection template".
```

### Evidence
- `/tmp/c0.9-server.txt` — server-side refusal.
- Screenshot `screenshots/c0.9-template-dropdown.png` — Home is absent.

### Rollback
- The server probe upsert is a tombstone-safe upsert that will refuse with `BAD_REQUEST`; nothing persists. Confirm:
  ```sql
  SELECT id, "deletedAt" FROM cms_collections WHERE id='probe';
  # expect 0 rows.
  ```

---

## C0.10 — CMS edit shows "unpublished changes" without tripping the page save-conflict

### Pre-condition
- The site has been published at least once (so `lastPublishedAt` is set, the Topbar's "Publish changes" pill is reachable).
- Browser A is on the editor for the test site, on page `Home`.
- A record exists in `ZZ C0a` (any).

### Setup commands
```bash
# Confirm a publish exists:
PUBLISHED_URL=$(cat /tmp/c0.1-published-url.txt)
[ -n "$PUBLISHED_URL" ] || { echo "Run C0.1 first"; exit 1; }
eval "$PGCMD" -c "SELECT id, \"lastEditedAt\", \"cmsEditedAt\" FROM sites WHERE id='cmugopwzg005nnvjysp00b3pf';" | tee /tmp/c0.10-before.txt
```

### Action
1. Open the record sheet for any record in `ZZ C0a`, change Title, save.
2. Without making any page edit, click somewhere in the canvas on page `Home` (or open and close a section) — anything that re-runs the lifecycle `useEffect`. Do NOT save the page.
3. Attempt a page save (Cmd-S / Ctrl-S, or click the save pill).

### Assertion (eyeball-free)
- The Topbar Publish button label switches from `Publish` to `Publish changes` (per `lifecycle.ts:252`). Measure with:
  ```ts
  expect(await page.getByRole("button", { name: /Publish changes/ }).count()).toBeGreaterThan(0);
  ```
- A save attempt on the page does NOT raise the page save-conflict dialog (the role-styled modal that asks "Keep mine / Load theirs"). The save completes silently:
  ```ts
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(2000);
  expect(await page.getByRole("dialog", { name: /Save conflict/i }).count()).toBe(0);
  ```
- DB confirms `cmsEditedAt` moved but `lastEditedAt` did NOT:
  ```bash
  eval "$PGCMD" -c "SELECT id, \"lastEditedAt\" = (SELECT \"lastEditedAt\" FROM sites WHERE id='cmugopwzg005nnvjysp00b3pf') AS unchanged, \"cmsEditedAt\" IS NOT NULL AS moved FROM sites WHERE id='cmugopwzg005nnvjysp00b3pf';" | tee /tmp/c0.10-after.txt
  # In practice re-read in two steps:
  eval "$PGCMD" -c "SELECT \"lastEditedAt\", \"cmsEditedAt\" FROM sites WHERE id='cmugopwzg005nnvjysp00b3pf';" | tee /tmp/c0.10-after.txt
  ```
  PASS when `lastEditedAt` equals the value in `/tmp/c0.10-before.txt` and `cmsEditedAt` is newer.

### Evidence
- `/tmp/c0.10-before.txt`, `/tmp/c0.10-after.txt` — DB times.
- Screenshot `screenshots/c0.10-pill.png` — Topbar pill reads `Publish changes`.
- DOM snapshot `/tmp/c0.10-dialogs.json` — no save-conflict dialog present.

### Rollback
- Revert the record edit so `cmsEditedAt` doesn't keep advancing:
  ```sql
  UPDATE cms_entries SET data = jsonb_set(data, '{title}', data->'title'), "updatedAt"="updatedAt"
  WHERE id='alpha' AND "collectionId"='zz-c0a';
  -- the timestamp still moved; the only way to truly reset is:
  -- (1) republish, or (2) leave it and let the next row observe the fresh pill.
  ```
- For the matrix this is acceptable — the next row (C0.11) doesn't depend on `cmsEditedAt`.

---

## C0.11 — Recovery banner suppresses when server holds newer work

### Pre-condition
- Browser A is on the editor's page `Home`. The `RecoveryBanner` sentinel has NOT been written (i.e. the session is clean).
- The server's `lastEditedAt` for the test site is recent.

### Setup commands
```bash
# Capture the current server edit time:
eval "$PGCMD" -c "SELECT \"lastEditedAt\" FROM sites WHERE id='cmugopwzg005nnvjysp00b3pf';" | tee /tmp/c0.11-server-edited.txt

# Force a server edit slightly in the past so the crash sentinel's "at" looks
# OLDER than the server:
LAST=$(jq -r '.[0]."lastEditedAt"' /tmp/c0.11-server-edited.txt)
echo "Server lastEditedAt: $LAST"
```

### Action
1. In Browser A: open DevTools → Console. Paste:
   ```js
   Promise.reject(new Error("c0.11 synthetic rejection"));
   ```
   (Unhandled rejection → `RecoveryManager.handleRuntimeFault` writes the crash sentinel to `sessionStorage`.)
2. Make a tiny edit to the page (e.g. add a section, undo it), then **save** the page so `lastEditedAt` advances — but **do not save again after** the sentinel is read on reload.
3. Hit **Cmd-R / Ctrl-R** (hard reload). The editor reads the crash sentinel, then asks the server for `lastEditedAt`.
4. Observe whether `[role="status"][aria-label="Recovered work"]` renders.

### Assertion (eyeball-free)
- Right after the sentinel is written (before the save), the sentinel's `at` is older than the server's `lastEditedAt` (because we just saved and advanced it). Therefore `serverNewer === true` and the banner must NOT render.
- After reloading: the banner is absent from the DOM:
  ```ts
  expect(await page.getByRole("status", { name: /Recovered work/i }).count()).toBe(0);
  ```
- **Negative control**: to prove the gate isn't permanently closed, also run the converse — write a sentinel into `sessionStorage` whose `at` is NEWER than the server's `lastEditedAt`, reload, and confirm the banner DOES appear:
  ```ts
  await page.evaluate(() => {
    sessionStorage.setItem("<CRASH_SENTINEL_KEY>", JSON.stringify({
      at: Date.now(), source: "error", reason: "test",
    }));
  });
  await page.reload();
  expect(await page.getByRole("status", { name: /Recovered work/i }).count()).toBeGreaterThan(0);
  ```
  The constant `CRASH_SENTINEL_KEY` is the one already imported by `RecoveryBanner.test.tsx`.

### Evidence
- Screenshot `screenshots/c0.11-banner-suppressed.png` (banner not visible).
- Screenshot `screenshots/c0.11-banner-shown.png` (negative control).
- `/tmp/c0.11-server-edited.txt` — server edit time used in the assertion.

### Rollback
- Clear the crash sentinel in Browser A:
  ```ts
  await page.evaluate(() => sessionStorage.removeItem("<CRASH_SENTINEL_KEY>"));
  ```
- No DB rows were mutated by this row.

---

## C0.12 — Failed mirror never says "saved"

### Pre-condition
- Browser A is on the editor's record sheet for any record in `ZZ C0a` (e.g. `Alpha` if restored, or `Gamma` if C0.5 ran).

### Setup commands
```bash
# No DB seed needed. Open DevTools → Network → Offline.
```

### Action
1. DevTools → Network → **Offline**.
2. Edit a record field in `ZZ C0a` (any record). Click `[data-testid="cms-sheet-save"]` (label `Save record`).
3. Watch the sheet: it must NOT close, no success toast must appear, an inline alert (the `saveError` state) must render with text matching `/saved on this device only/i`.

### Assertion (eyeball-free)
- `[data-testid="cms-sheet"]` is still in the DOM (the sheet stayed open).
- A role-styled alert with text matching `/saved on this device only/i` is visible:
  ```ts
  const alert = await page.getByRole("alert").filter({ hasText: /saved on this device only/i });
  expect(await alert.count()).toBeGreaterThan(0);
  ```
- The save button label flipped to `Retry save` (`RecordSheet.tsx:495`):
  ```ts
  expect(await page.getByTestId("cms-sheet-save").textContent()).toMatch(/Retry save/);
  ```
- No success toast (chrome-ui Toast tone `success`) was added:
  ```ts
  expect(await page.getByText(/Record saved · /).count()).toBe(0);
  ```
- The DB row was NOT updated (the mirror never reached the server):
  ```bash
  eval "$PGCMD" -c "SELECT data, \"updatedAt\" FROM cms_entries WHERE id='gamma' AND \"collectionId\"='zz-c0a-outbox';"
  ```
  PASS when `updatedAt` equals the pre-state value recorded before clicking Save.

### Evidence
- Screenshot `screenshots/c0.12-sheet-open.png` — sheet stays open with the alert.
- DB row snapshot to `/tmp/c0.12-row.txt`.

### Rollback
- Flip DevTools back to **Online**; the queued mirror retries. Once it lands, the sheet can be closed:
  ```bash
  eval "$PGCMD" -c "SELECT data, \"updatedAt\" FROM cms_entries WHERE id='gamma' AND \"collectionId\"='zz-c0a-outbox';"
  # Now updatedAt > pre-state value; mirror landed.
  ```
- If `Gamma` was used and is no longer needed:
  ```sql
  DELETE FROM cms_entries WHERE id='gamma' AND "collectionId"='zz-c0a-outbox';
  ```

---

## Cleanup (after all rows pass)

Per ledger §Cleanup, delete the ZZ collection, remove the bound elements, and restore the Home heading. SQL confirmation:
```bash
eval "$PGCMD" -c "SELECT count(*) FROM cms_collections WHERE name LIKE 'ZZ%' AND \"deletedAt\" IS NULL;"
# PASS when count = 0.
```

Restore canonical state for any test-record ids the matrix touched:
```sql
INSERT INTO cms_entries (id, "collectionId", data, status, "createdAt", "updatedAt", "deletedAt")
VALUES
  ('alpha', 'zz-c0a', '{"title":"Alpha","slug":"alpha"}'::jsonb, 'PUBLISHED', now(), now(), NULL),
  ('beta',  'zz-c0a', '{"title":"Beta","slug":"beta"}'::jsonb,   'PUBLISHED', now(), now(), NULL)
ON CONFLICT (id) DO UPDATE SET "deletedAt"=NULL, status='PUBLISHED', data=EXCLUDED.data, "updatedAt"=now();
```

In the editor, delete the `ZZ C0a` collection (`[data-testid="cms-settings-delete"]` + confirm) and remove the bound heading on Home + the Collection list on Blog. Confirm by running the count above once more.

---

## Open risks (must be true at run time)

1. **`pnpm prisma migrate deploy` has been run by the founder** in `~/Desktop/buildrik-worktrees/cms-c0`. If not, every row fails on `42703 column "deletedAt" does not exist`.
2. **The dev server is running from `cms-c0`** on port `3160`, with the URL overrides. A 3160 server running from `~/Desktop/pencil/buildrik` (the main checkout) does NOT have the migration columns.
3. **The QA cookie is fresh** — Chrome profile A's `next-auth.session-token` for `:3160` is valid. The cookie from the `:3000` dev port will not authenticate.
4. **No concurrent agent is running on `cms-c0`** that would mutate `cms_*` or `sites.cmsEditedAt` between the `before` and `after` SQL snapshots of a row.
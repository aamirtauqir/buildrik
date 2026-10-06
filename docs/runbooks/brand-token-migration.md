# Runbook: brand token migration (v5 to v6)

The editor upgrades a site's brand tokens to schema v6 the first time the site
is opened (`loadTokensSafely`, `useComposerInit.ts`). Two operator controls stop
it: the global switch `BRAND_TOKENS_V2` and the per-site hold
(`Site.tokensMigrationHold`). Neither one undoes a migration that already
happened; step 4 does.

Semantics: switch off = no NEW migrations. A site already at v6 keeps working.
A site still on v5 stays on v5 and Brand shows a read-only notice. A held site
is never migrated and Brand is read-only for it.

## 1. Symptoms

- Sentry: `token migration failed` (the editor opened the site on its old
  tokens and Brand went read-only: "We couldn't upgrade this site's brand").
- Console / Sentry breadcrumb `[tokens] save refused`: the server rejected a
  token save (invalid payload, stale client, or the site is held).
- A user reports their colours changed after opening a site.

## 2. Stop the spread

Set `BRAND_TOKENS_V2=off` (the server enables the migration only on the exact
value `on`) with `scripts/set-prod-env.mjs` (`pnpm env:set:prod`). It reads the
live cPanel env map, merges on top of it, refuses to write if the merge would
drop a key, and verifies after writing. Never call
`cloudlinux-selector set --env-vars` by hand: it REPLACES the whole map.

```bash
echo "BRAND_TOKENS_V2=off" > /tmp/brand-off.env
pnpm env:set:prod --file /tmp/brand-off.env                     # dry run: prints the plan, writes nothing
pnpm env:set:prod --file /tmp/brand-off.env --apply --restart   # writes, verifies, restarts
```

`--restart` kills this app's node workers by `/proc/<pid>/cwd` and lets
lsnode respawn them. If you restart by hand instead, identify the Buildrik
process by its cwd (`~/apps/dashboard`) and never `pkill -f next-server`
(another app on the host runs `next-server`).

Effect: no new migrations. The editor opens an unmigrated site on v5 with Brand
read-only ("Brand editing is paused while we upgrade brand tokens."), and the
server refuses a first v6 save from a stale tab ("Brand upgrade is paused").
Sites already at v6 keep working normally. The editor treats a missing flag as
off, so a failed settings read never migrates anything.

Status of the commands here: the `set-prod-env.mjs` flags are read from the
script; this exact sequence has not been run against the host for
`BRAND_TOKENS_V2` (unverified).

## 3. Find affected sites

Sentry: search `token migration failed`.

SQL, over the SSH tunnel:

```bash
ssh -f -N -L 127.0.0.1:15432:127.0.0.1:5432 vortyoyz
psql "postgresql://<user>@127.0.0.1:15432/<db>" -c \
  "select \"siteId\", \"createdAt\" from site_theme_snapshots where reason='migration' order by \"createdAt\" desc;"
```

(The tunnel and `psql` lines are unverified; adjust user/db to the real ones.)
Each row is a site that was migrated; its snapshot holds the pre-migration tokens.

## 4. Roll back one site

Run with `DATABASE_URL` pointing at the tunnel (`127.0.0.1:15432`). Look first:

```bash
npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId> --dry-run   # prints snapshot id, createdAt, version, token count; writes nothing
npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId>             # restore the tokens and set the hold
```

The script refuses to run without a siteId. It has only been exercised with the service mocked (unverified against a real DB). Rollback is compare-and-swap on
`lastEditedAt`: if someone saved the site meanwhile it fails, re-run it. It
bumps `dsSchemaVersion`, so a stale open tab gets a save conflict instead of
overwriting the rollback.

Verify: open the site's export CSS and compare it with the pre-migration
export; Brand shows the read-only "rolled back" notice.

## 5. After the fix ships

```bash
npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId> --clear      # per held site
```

Set `BRAND_TOKENS_V2=on` the same way (`echo BRAND_TOKENS_V2=on > /tmp/brand-on.env`,
then `pnpm env:set:prod --file /tmp/brand-on.env --apply --restart`; unverified on
the host), open the site and confirm it migrates (Brand editable,
`[tokens] migrated` in the console).

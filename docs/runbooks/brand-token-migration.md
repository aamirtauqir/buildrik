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

Unset `BRAND_TOKENS_V2` in the cPanel Node app environment, then restart the
app.

**Warning:** `cloudlinux-selector set --env-vars` REPLACES the whole map. Read
the existing env first and write back every key except `BRAND_TOKENS_V2`, or
you delete `DATABASE_URL` and take the site down.

```bash
ssh vortyoyz
cloudlinux-selector get --json --interpreter nodejs --app-root apps/dashboard   # note every existing var
# Same call as the one that set it, with the full map minus BRAND_TOKENS_V2:
cloudlinux-selector set --json --interpreter nodejs --app-root apps/dashboard --env-vars '{"KEY":"value", ...}'
```

Restart. Identify the Buildrik process by its working directory; **never**
`pkill -f next-server` (another app on the host also runs `next-server`):

```bash
for p in $(pgrep -f next-server); do echo "$p $(readlink /proc/$p/cwd)"; done
# kill only the pid whose cwd ends in /apps/dashboard, then let Passenger respawn it
kill <pid>
```

The flag is read per request on the server; the next editor load sees it.

## 3. Find affected sites

Sentry: search `token migration failed`.

SQL, over the SSH tunnel:

```bash
ssh -f -N -L 127.0.0.1:15432:127.0.0.1:5432 vortyoyz
psql "postgresql://<user>@127.0.0.1:15432/<db>" -c \
  "select \"siteId\", \"createdAt\" from site_theme_snapshots where reason='migration' order by \"createdAt\" desc;"
```

Each row is a site that was migrated; its snapshot holds the pre-migration tokens.

## 4. Roll back one site

Run with `DATABASE_URL` pointing at the tunnel (`127.0.0.1:15432`). Look first:

```bash
npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId> --dry-run   # prints snapshot id, createdAt, version, token count; writes nothing
npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId>             # restore the tokens and set the hold
```

The script refuses to run without a siteId. Rollback is compare-and-swap on
`lastEditedAt`: if someone saved the site meanwhile it fails, re-run it. It
bumps `dsSchemaVersion`, so a stale open tab gets a save conflict instead of
overwriting the rollback.

Verify: open the site's export CSS and compare it with the pre-migration
export; Brand shows the read-only "rolled back" notice.

## 5. After the fix ships

```bash
npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/brand/rollback-migration.mjs <siteId> --clear      # per held site
```

Set `BRAND_TOKENS_V2=on` (merge into the existing env map, see the warning in
step 2), restart, open the site and confirm it migrates (Brand editable,
`[tokens] migrated` in the console).

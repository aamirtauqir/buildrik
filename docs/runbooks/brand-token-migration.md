# Runbook: brand token migration (v5 to v6)

> **NEVER revert the code once any site has migrated.** A migrated site stores
> v6 tokens (`designTokensSchemaVersion: 6`); a build without the v6 reader
> cannot open them correctly. Use the switch (section 2) and the per-site
> rollback (section 4) instead. A rollback restores the pre-migration snapshot,
> so it **discards every brand edit made after the migration** on that site —
> say so to the site's owner before running it.

The editor upgrades a site's brand tokens to schema v6 the first time the site
is opened (`loadTokensSafely`, `useComposerInit.ts`). Two operator controls stop
it: the switch (`BRAND_TOKENS_V2=on` for every workspace, or
`BRAND_TOKENS_V2_WORKSPACES=<id,id>` for listed workspaces only) and the
per-site hold (`Site.tokensMigrationHold`). Neither one undoes a migration that already
happened; step 4 does.

Semantics: switch off = no NEW migrations. A site already at v6 keeps working.
A site still on v5 stays on v5 and Brand shows a read-only notice. A held site
is never migrated and Brand is read-only for it.

## 0. Roll out (QA workspace first)

1. Pick a low-traffic window. Every open editor tab of a site that changes
   format (or whose switch flips) gets the save-conflict dialog once; Reload
   resolves it. Nothing is lost — the dialog keeps the tab's copy until the
   user chooses.
2. Enable the QA workspace only:

   ```bash
   echo "BRAND_TOKENS_V2_WORKSPACES=<qa workspace id>" > /tmp/brand-qa.env
   pnpm env:set:prod --file /tmp/brand-qa.env                     # dry run
   pnpm env:set:prod --file /tmp/brand-qa.env --apply --restart
   ```

   Replace the placeholder with the real id — `set-prod-env.mjs` skips any
   value starting with `<`, so the literal line writes nothing.
   Open a QA-workspace site: it migrates (`[tokens] migrated` in the console,
   Brand editable). Open a site in any other workspace: Brand shows "Brand
   editing is paused" and nothing migrates.
3. When QA is clean, set `BRAND_TOKENS_V2=on` the same way (it covers every
   workspace; the list is then ignored and can be removed).

## 1. Symptoms

- Sentry: `token migration failed` (the editor opened the site on its old
  tokens and Brand went read-only: "We couldn't upgrade this site's brand").
- Server log `[tokens] save refused`: the server rejected a token save. A
  stale tab (older brand format, switch off, or the site is held) gets the
  ordinary save conflict — the editor shows its conflict dialog, and Reload
  brings the stored brand. An invalid payload (`TOKENS_INVALID`) shows the
  persistent save-failed banner and the edit is kept in local recovery.
- A user reports their colours changed after opening a site.

## 2. Stop the spread

Set `BRAND_TOKENS_V2=off` (the server enables every workspace only on the
exact value `on`) and `BRAND_TOKENS_V2_WORKSPACES=none`, or drop just the
affected workspace from the list. `set-prod-env.mjs` skips empty values and
cannot delete a key, so `none` (no workspace has that id) is how the list is
emptied. Use `scripts/set-prod-env.mjs` (`pnpm env:set:prod`). It reads the
live cPanel env map, merges on top of it, refuses to write if the merge would
drop a key, and verifies after writing. Never call
`cloudlinux-selector set --env-vars` by hand: it REPLACES the whole map.

```bash
printf 'BRAND_TOKENS_V2=off\nBRAND_TOKENS_V2_WORKSPACES=none\n' > /tmp/brand-off.env
pnpm env:set:prod --file /tmp/brand-off.env                     # dry run: prints the plan, writes nothing
pnpm env:set:prod --file /tmp/brand-off.env --apply --restart   # writes, verifies, restarts
```

`--restart` kills this app's node workers by `/proc/<pid>/cwd` and lets
lsnode respawn them. If you restart by hand instead, identify the Buildrik
process by its cwd (`~/apps/dashboard`) and never `pkill -f next-server`
(another app on the host runs `next-server`).

Effect: no new migrations. The editor opens an unmigrated site on v5 with Brand
read-only ("Brand editing is paused while we upgrade brand tokens."), and the
server answers a first v6 save from a stale tab with a save conflict (the tab
shows the conflict dialog once; Reload opens the site read-only on v5). A site
with no stored tokens is not a migration and saves normally either way. A
theme push skips v5 sites with tokens ("Brand upgrade is paused for this
site.").
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

## 6. Part 1b rollout (binding)

- No Prisma migration, no new env var. `BRAND_TOKENS_V2` still governs the
  migration only; on an un-migrated or held site Brand is read-only, so delete
  and Connect are refused there (`readOnly`).
- Inserted blocks bind to seed vars that every emit path declares (seed merge +
  `LEGACY_SEED` backstop), on v5 and v6 sites alike. **Never remove a seed
  token once shipped**: elements bind to it.
- The removal guard in `setTokens` refuses a write that drops a token an
  element still reaches — counted through the pending set's own aliases, so a
  Review changes revert that drops its own `custom-*` primitive goes through
  (fixed 2026-10-09). Usage "unknown" (saved components not read) still refuses.
- Theme push now refuses a site (`failed`, nothing written) when its own tokens
  cannot be read or clash with the theme; the message names the reason. It
  keeps a site's in-use site-only tokens (`keepInUseSiteTokens`).
- Rollback: revert the 1b commits and redeploy. Elements inserted while 1b was
  live keep resolving (their vars are seed + backstop vars, which the revert
  does not remove — check this before reverting the seed-gap commit). Theme
  push returns to wholesale replace.
- **Before deploying**, the owner runs this read-only query against prod (1b
  tightened `replacedBy`: same kind, no cycles — a stored set that breaks it
  would open read-only):

  ```sql
  SELECT id, name
  FROM sites
  WHERE "deletedAt" IS NULL
    AND "projectSettings"::text LIKE '%"replacedBy"%';
  ```

  For each row, open the site locally against a copy and confirm
  `validateTokens` passes. Not run against prod by any agent.

## 7. Part 1c rollout (generators)

- No Prisma migration, no new env var. `NEXT_PUBLIC_FEATURE_DS_AI` now also
  gates the server's `theme.extractBrandFromUrl` (404 unless exactly `"true"`;
  baked at build like every `NEXT_PUBLIC_*`).
- New outbound traffic: the URL import fetches user-supplied public pages
  (http/https, ports 80/443, ≤ 3 redirects each re-vetted, 2 MB page + 4 × 1 MB
  CSS, one 10 s budget), pinned to the vetted IP (`lib/url-guard.ts`). Rate
  limits 10 / 10 min per user and 30 / 10 min per workspace
  (`rate_limit_buckets` keys `brand-extract:*`). Failures log
  `[brand-extract] failed { kind, siteId }`, never page content.
- Restore points: `generator | dark-auto | logo` rows in
  `site_theme_snapshots`, kept to the newest 10 per site together with
  `theme-push` rows (`pruneThemeSnapshots`; `migration` rows exempt). Admin
  theme-push rollback still only takes `theme-push` rows.
- Dark mode: nothing changes on deploy — every existing site stays Off until
  its owner switches (new sites too; Task 15 did not ship). Turning Auto on
  saves the full token set with the filled dark values and a restore point, in
  one ⌘Z. Rollback = revert the 1c commits; a site already switched to Auto
  keeps publishing its dark blocks (that path is 1a's) until its owner turns
  Auto off.
- Theme toggles placed while 1c is live are plain buttons after a revert (no
  runtime, no hide rule). Count them first (read-only, owner runs against prod):

  ```sql
  SELECT count(*) FROM pages WHERE blocks::text LIKE '%data-bk-theme-toggle%';
  ```

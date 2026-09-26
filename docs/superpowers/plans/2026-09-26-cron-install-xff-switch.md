# Follow-up plan: C-2 (prod crontab install runbook) + S-11 (XFF hop switch)

Ledger IDs: C-2, S-11 (XFF half only — the peek-rate-limit half of S-11 is
decision-free and should land separately, see below). Both need founder
access to production infrastructure (cPanel host, LiteSpeed proxy config)
that this session cannot reach.

## Goal

1. (C-2) Every cron route that exists in code (`vercel.json`'s 18 entries,
   18 directories under `packages/dashboard/app/api/cron/`) is actually
   installed and running on the production cPanel crontab, with tests
   covering the ones that currently have none.
2. (S-11) `clientIp(headers)` reads the correct hop of `X-Forwarded-For`
   for the cPanel/LiteSpeed proxy topology in front of production, instead
   of unconditionally trusting the leftmost (client-supplied, spoofable)
   entry.

**Done condition (C-2):** `crontab -l` on the production host lists all 18
`/api/cron/*` routes with `curl -fsS -H "Authorization: Bearer
$CRON_SECRET" https://app.buildrick.io/api/cron/<name>` schedules matching
`vercel.json`; `docs/cpanel-deploy.md` Step C lists all 18, not 15; each of
the 5 currently-untested routes (billing-downgrade, billing-dunning,
scheduled-publish, ssl-check, ai-job-cleanup) has a route test following
the `__tests__/cron-account-deletion.test.ts` pattern.
**Done condition (S-11):** a request through the real production proxy
with a spoofed leftmost XFF entry resolves to the proxy-verified client
IP, not the attacker-supplied one — confirmed against actual LiteSpeed
behavior, not assumed.

## What can land now, separately (decision-free, not blocked by this plan)

- **S-11 peek-rate-limit fix:** `peekRateLimit` in
  `server/services/rate-limiter.ts:57-69` compares `resetAt` in JS against
  `now`, but `resetAt` is a `timestamp WITHOUT time zone` column — on a
  negative-UTC-offset session this reads as already-past, so peek always
  allows (a real rate-limit bypass). Fix: compute the comparison in SQL
  with the same bound-parameter shift the writer (`checkRateLimit`, already
  fixed) uses: `SELECT "count", ("resetAt" < ${now}) AS "expired" FROM
  "rate_limit_buckets" WHERE "key" = ${key}`, return allowed when `!row ||
  row.expired`. TZ-independent, no decision needed, no founder access
  required — should not wait for this plan.
- **S-11 `clientIp` helper extraction:** add one shared `clientIp(headers)`
  helper (e.g. `lib/clientIp.ts`) and replace the seven duplicated
  leftmost-XFF-entry reads (`server/trpc/trpc.ts:146-147`,
  `server/trpc/routers/auth.ts:32`, `create-session/route.ts:86,126`,
  `verify-password/route.ts:17`, `public/forms/.../route.ts:17`,
  `public/track/.../route.ts:27`). This is SSOT deduplication and is safe
  regardless of which hop is eventually read — land it now, keep the body
  leftmost-entry (current behavior) until the proxy check below answers
  which hop is correct.

## Why the rest is deferred

- **C-2's actual crontab install** requires `crontab -l`/`-e` on the
  production cPanel host — this session has no access to that
  infrastructure, and installing/modifying a production crontab is
  exactly the kind of operation root CLAUDE.md's git-safety posture
  extends to ops actions: it should be done deliberately, by the founder
  or with founder sign-off, not by an agent with write access it doesn't
  have anyway.
- **C-2's backlog risk** is real: the first run of `account-deletion`,
  `billing-downgrade`, and the purge crons will process whatever backlog
  built up since launch (these crons may never have run in production).
  That backlog needs to be sized before enabling the cron, not discovered
  by running it.
- **S-11's XFF hop** needs a human check of what the cPanel/LiteSpeed
  proxy actually forwards — whether it appends to or replaces
  `X-Forwarded-For`, and whether it sets a trustworthy `X-Real-IP` header
  instead. Guessing wrong here is worse than the current bug: "if the
  proxy hop count is wrong, a rightmost-hop helper keys every user on the
  proxy IP and blocks everyone" (this is the ledger's own risk note, and
  it is correct — reversing this without verification could take down
  rate limiting entirely, the opposite of the fix's intent).

## Decisions needed / information needed (founder or ops access)

1. **C-2:** SSH/cPanel access to run `crontab -l`, diff against the
   18-route list, and add the missing entries. Not a product decision —
   an ops action.
2. **C-2:** how big is the account-deletion / billing-downgrade / purge
   backlog right now? (`SELECT count(*) FROM ... WHERE <cron's selection
   criteria>` for each, run against production data before first-enabling
   each cron.)
3. **S-11:** confirm with whoever configured the cPanel/LiteSpeed proxy
   (or by testing directly against it) whether `X-Forwarded-For` is
   append-only (client IP is the LEFTMOST of possibly many entries) or
   replace (client IP is the ONLY entry, so leftmost=rightmost=correct
   already), and whether `X-Real-IP` or another LiteSpeed-set header is
   more trustworthy than parsing XFF at all.

## Proposed tasks

### C-2
1. Regenerate `docs/cpanel-deploy.md` Step C from `vercel.json`: same 18
   schedules, `curl -fsS -H "Authorization: Bearer $CRON_SECRET"
   https://app.buildrick.io/api/cron/<name>` per line. Fix the "(15
   routes)" heading to 18 and remove the founder-machine-specific path
   reference.
2. Add route tests for the 5 untested crons (billing-downgrade,
   billing-dunning, scheduled-publish, ssl-check, ai-job-cleanup),
   mirroring `__tests__/cron-account-deletion.test.ts`: 401 without the
   bearer token, and the selection query + effect verified with Prisma
   mocked.
3. Optionally: extend `scripts/check-prod-env.mjs` to fail when the live
   crontab (read via SSH from a founder-run script, not from this repo)
   lacks a route that exists in `vercel.json` — a drift detector for the
   thing that caused this finding in the first place.
4. Ops step (founder): `crontab -l`, diff, add missing entries; size and
   review the backlog for account-deletion/billing-downgrade/purge crons
   before letting them run unattended; hand-trigger each once to see the
   backlog clear rather than letting a cold cron process an unknown
   backlog silently.

### S-11 (XFF hop switch, after the proxy check)
5. Once the proxy behavior is confirmed, update `clientIp()`'s body (the
   one helper from the decision-free extraction above) to read the
   correct hop or header. One-line change in one place — this is exactly
   why the extraction was worth doing now instead of waiting.
6. Re-verify rate limiting still keys correctly per-user after the switch
   (a smoke test: trigger a few requests from one real client, confirm
   they share one bucket; from a different client, confirm a different
   bucket).

## Risks

- C-2's backlog-processing risk is the highest-severity item in this
  entire plan — an account-deletion cron that has never run and suddenly
  processes months of queued deletions is a real-data-loss risk if not
  sized and reviewed first.
- S-11's XFF switch, if the proxy hop assumption is wrong, breaks rate
  limiting for every user simultaneously (collapses everyone onto one
  bucket) — this must be verified against the real proxy, not inferred
  from documentation or memory of how LiteSpeed "usually" behaves.

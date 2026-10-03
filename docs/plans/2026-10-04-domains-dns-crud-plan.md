# Domains: DNS records CRUD through Vercel DNS — implementation plan

**Date:** 2026-10-04 · **Owner decision:** 2026-10-04 · **Base:** main `f42f887d1`
**Status:** this is a plan only; no product code is included. Visual work waits on the Figma boards in §6. Backend work waits on the D0 spike, which needs a live test domain (§9 Q2).

Owner, verbatim: the current Domains screen is "only read-only, where is the flow".

---

## 1. Scope and non-goals

**In scope**
1. **Domains on Vercel nameservers:** list, add, edit and delete DNS records from the editor through the Vercel DNS API, on the workspace's own Vercel account (per-workspace OAuth already exists).
   - Editable types are **A, AAAA, CNAME, MX, TXT, CAA and SRV**. Vercel supports all seven; it also supports ALIAS, HTTPS and NS ([create a DNS record](https://vercel.com/docs/rest-api/reference/endpoints/dns/create-a-dns-record)).
   - ALIAS, HTTPS, NS and Vercel's system records are **shown read-only** (§9 Q5).
2. **Domains on other nameservers:** a guide with two paths:
   - **(a) Switch to Vercel nameservers.** We show the exact pair, the current nameservers we detect, per-registrar steps, and detection of the switch. Before the switch we offer to copy existing records so email does not break.
   - **(b) Keep your DNS provider.** We show the exact records to add, taken from Vercel's own recommendation for this domain rather than a hard-coded value, plus per-provider steps and live verification.
3. **Make "connected" and "SSL active" true statements.** Today neither is (§2). Status comes from Vercel's view of the domain.

**Non-goals**
- Registrar features: buying, transferring, renewing, WHOIS or payments. We also cannot change nameservers at a third-party registrar. The user does that, and we detect it.
- DNSSEC, zone-file import/export, bulk CSV of records, and NS delegation of subdomains.
- DNS hosting anywhere other than Vercel, such as Cloudflare API integration.
- Domains on workspaces **without** a Vercel connection. They keep today's instructions-only flow, with a door to "Connect Vercel" (§5).

---

## 2. Current state (verified on main `f42f887d1`)

### Data and services
- **Prisma.** `Domain` (`prisma/schema.prisma`) has `domain` (unique), `status` (PENDING/VERIFIED/FAILED), `sslStatus`, `sslExpiresAt`, `lastCheckedAt`, `isPrimary`, `kind` (PRIMARY/REDIRECT/SUBDOMAIN), `forceHttps` and `dnsProvider`. `DnsRecord` has `type`, `host`, `value` and `verified`. **`DnsRecord` holds the records we expect the user to create, for verification only.** It is not a zone.
- **`server/services/domain.service.ts`** (293 lines):
  - `connectDomain` attaches the domain via `addDomainToVercelProject` (`lib/vercel.ts:292`, `POST /v10/projects/{name}/domains`) when the workspace has an active connection. It then writes DnsRecord rows, either Vercel's `verification[]` or a fallback set: apex `A 76.76.21.21`, `www CNAME cname.vercel-dns.com`, and our own `TXT _buildrick brk-verify-…`.
  - `checkDomainDns` resolves each expected record with `node:dns` and flips `Domain.status`.
  - `removeDomain` detaches via `DELETE /v9/projects/{name}/domains/{domain}`.
  - It also has `setPrimaryDomain`, `updateDomain` (Force HTTPS), `listDomains`, `listWorkspaceDomains` and `checkDomainAvailability` (DB-only).
- **Routers.** `server/trpc/routers/site-detail.ts:333-470` exposes `siteDetail.domains.{list,listForWorkspace,checkAvailability,check,connect,update,remove,setPrimary}`. Mutations need ADMIN, except `check`, which needs EDITOR. `update` and `remove` read `ctx.prisma` directly, which violates the root CLAUDE.md data-flow rule. Lane D-B moves that read into the service.
- **Cron.** `packages/dashboard/app/api/cron/dns-verify/route.ts` runs every 5 minutes (`vercel.json`). It **re-implements the same `node:dns` matching as `checkDomainDns`** (semantic duplication) and reads and writes Prisma from the route.
- **Vercel client.** `lib/vercel.ts` has a `VercelApiError(status, code, message)` and `teamQueryString`. Tokens come from `getActiveVercelConnection(workspaceId)` (`server/services/integrations.service.ts:159`), stored AES-256-GCM encrypted in `WorkspaceIntegration.config.encryptedToken` with `ENCRYPTION_KEY`. OAuth is handled by `server/services/vercel-oauth.service.ts`, using `VERCEL_INTEGRATION_ID`, `VERCEL_CLIENT_ID` and `VERCEL_CLIENT_SECRET`. **There is no Vercel webhook endpoint**; only `app/api/webhooks/stripe` exists.
- **Integration scopes are not in code.** They are set in the Vercel integrations console, so the current grant cannot be read from the repo. Publish works, so `project` and `deployment` write are granted. Whether `domain` Read/Write is granted is **unknown**, and D0 checks it (§4.1).

### Editor
- **`packages/editor/src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx`** (548 lines; boards 8136:214348, 8136:214574 and states 4418:127680 / 129084 / 129186 / 129290 / 129393).
  - The list shows primary first, with Set as primary and Manage DNS.
  - **Manage DNS** opens a per-domain view with a Custom domain card (status, Force HTTPS, Remove) and a **read-only DNS records table** (type / host / value / state), plus **Check DNS**.
  - There is no way to add, edit or delete a record. This is the "read-only" the owner means.
  - Save model: **immediate**. The footer is never dirty, and the scope line reads "Live immediately".
- **`components/AddDomainDialog.tsx`** (Clone 3737:43669) takes a name with availability, a kind, a DNS provider select, **read-only** nameservers (from `DNS_PROVIDERS`), a **read-only** preview of the record shape, and Force HTTPS.
- **The dashboard `components/site-detail/domains-tab.tsx`** is a read-only summary that links to the editor.

### Defects found while verifying, which the plan fixes
1. **A 409 from Vercel is treated as "verified".** `addDomainToVercelProject` maps `409 domain_already_in_use` to `{ verified: true }` (`lib/vercel.ts:318-321`), and `connectDomain` then sets `status: VERIFIED`. Per [add a domain to a project](https://vercel.com/docs/rest-api/reference/endpoints/projects/add-a-domain-to-a-project), 409 means the domain is assigned to **another** project or is not allowed. A domain used elsewhere is therefore marked Connected with no DNS at all.
2. **Subdomains get apex instructions.** For `shop.example.com`, the fallback tells the user to add `A @` and `CNAME www`, which resolves to `www.shop.example.com`. Vercel's recommendation for a subdomain is a CNAME on the subdomain itself ([domain config](https://vercel.com/docs/rest-api/reference/endpoints/domains/get-a-domain-s-configuration), `recommendedCNAME`).
3. **Our own `_buildrick` TXT is a hard requirement for VERIFIED.** Vercel does not need it, so a correctly pointed domain stays "Waiting for DNS" until the user also adds a token nobody else reads.
4. **Nothing ever sets `sslStatus = "ACTIVE"`.** Only `ssl-check` reads it, and it filters on ACTIVE. The SSL half of "Connected · SSL active" can never be true.
5. Status is decided by our resolver (`node:dns` from the cPanel host) rather than by Vercel, which is what actually serves the domain and issues the certificate.

---

## 2b. Vercel API facts this plan relies on

All of these use `https://api.vercel.com`, with the optional `?teamId=` that `teamQueryString` already appends and a bearer token. The docs were fetched on 2026-10-04.

| Purpose | Endpoint | Notes | Source |
|---|---|---|---|
| List zone records | `GET /v5/domains/{domain}/records?limit=&since=&until=` | `{records[{id,name,type,value,ttl?,mxPriority?,priority?,creator,created,updated,comment?}], pagination{count,next,prev}}`. The default limit is 20, so **we must paginate**. | [list records](https://vercel.com/docs/rest-api/reference/endpoints/dns/list-existing-dns-records) |
| Create a record | `POST /v2/domains/{domain}/records` | Body: `{name ("" = apex), type, value, ttl (60–2147483647, default 60), comment (≤500)}`, plus `mxPriority` for MX, `srv{priority,weight,port,target}` for SRV and `https{…}` for HTTPS. Returns `{uid}`. The MX/SRV create field names are taken from the PATCH schema and the [OpenAPI spec](https://vercel.com/openapi.json), and are **re-checked in D0**. | [create](https://vercel.com/docs/rest-api/reference/endpoints/dns/create-a-dns-record) |
| Update a record | `PATCH /v1/domains/records/{recordId}` | **No domain in the path.** Fields: `name, value, type, ttl, mxPriority, srv{target,weight,port,priority}, https{…}, comment`. | [update](https://vercel.com/docs/rest-api/reference/endpoints/dns/update-an-existing-dns-record) |
| Delete a record | `DELETE /v2/domains/{domain}/records/{recordId}` | | [delete](https://vercel.com/docs/rest-api/reference/endpoints/dns/delete-a-dns-record) |
| Detect nameservers | `GET /v5/domains/{domain}` | `serviceType`: `zeit.world` means Vercel serves DNS, `external` means DNS is elsewhere, and `na`. Also returns `nameservers` (current), `intendedNameservers`, `verified` and `apexName`. **Rule:** treat a domain as Vercel DNS when `serviceType === "zeit.world"`, and cross-check `nameservers` against `intendedNameservers`. | [get domain](https://vercel.com/docs/rest-api/reference/endpoints/domains/get-information-for-a-single-domain) |
| What to point where | `GET /v6/domains/{domain}/config?projectIdOrName=` | `misconfigured` (true means not configured **and** no certificate can be issued), `configuredBy` (A / CNAME / dns-01 / http / null), `recommendedIPv4[{rank,value[]}]`, `recommendedCNAME[{rank,value}]` (rank 1 is preferred) and `acceptedChallenges`. | [domain config](https://vercel.com/docs/rest-api/reference/endpoints/domains/get-a-domain-s-configuration) |
| Project-domain status | `GET /v9/projects/{id}/domains/{domain}`; `POST /v9/projects/{id}/domains/{domain}/verify` | `verified` and `verification[{type,domain,value,reason}]`, which is the TXT ownership challenge when the domain is claimed by another account. Verify returns 400 when the TXT is missing or wrong, or already used by another project. | [get project domain](https://vercel.com/docs/rest-api/reference/endpoints/projects/get-a-project-domain), [verify](https://vercel.com/docs/rest-api/reference/endpoints/projects/verify-project-domain) |
| Vercel nameservers | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` | Use the per-domain `intendedNameservers` from the API, and fall back to this pair. | [working with nameservers](https://vercel.com/docs/domains/working-with-nameservers) |
| Records only apply on Vercel NS | — | "your domain needs to use Vercel's nameservers" for records to apply. Records created while the domain is `external` are **not served**, and whether the API accepts them at all is unconfirmed (checked in D0). | [managing DNS records](https://vercel.com/docs/domains/managing-dns-records) |
| System records | `type: "record-sys"` in the PATCH response | Default records cannot be removed, but a user record can override them. | [managing DNS records](https://vercel.com/docs/domains/managing-dns-records) |

**Scopes** ([Vercel API integrations](https://vercel.com/docs/integrations/create-integration/vercel-api-integrations)):
- DNS list, `GET /v5/domains/{d}` and `/v6/.../config` need the **`domain` scope at Read**.
- Record create, update and delete need **`domain` Read/Write**.
- Adding a domain to a project needs **write on both `project` and `domain`**. The `connectDomain` attach that runs today therefore already implies domain write if it succeeds. D0 confirms this against prod.
- **Adding or upgrading a scope requires every installed user or team owner to confirm.** Vercel emails them. Until they confirm, existing installs keep the old scopes, and we should expect 403 `forbidden` on the new calls. Removing a scope applies immediately.

**Errors** ([errors](https://vercel.com/docs/rest-api/errors)):
- The envelope is `{error:{code,message,…}}`.
- Codes include `forbidden`, `rate_limited` (with `limit{remaining,reset,resetMs,total}`), `bad_request`, `not_found`, `invalid_name`, `missing_name`, `missing_type` and `invalid_domain`.
- A 403 can also mean that `teamId` is missing, or `integration_configuration_disabled`.
- There is **no documented `record_already_exists` code**, so expect a 409 or 400 on duplicates and map by HTTP status.

**Rate limits.** Vercel publishes per-endpoint limits but **does not document numbers for the DNS record endpoints**. A secondary summary ([multi-tenant limits](https://vercel.com/docs/multi-tenant/limits)) gives domain add at 100/h/team, verify at 50/h/team and remove at 100/h/team. The plan therefore does the following:
- It never polls the Vercel API from a loop.
- It lists records on screen open and after each mutation.
- It refreshes nameserver mode on open and on "Check", plus a cron capped at 20 PENDING domains per run.
- It honours `X-RateLimit-Reset` / `limit.reset` when a 429 comes back.

---

## 3. Data model and schema changes

### Prisma: **one migration (D1), additive only**

`prisma/migrations/2026100Xhhmmss_domain_nameserver_mode/migration.sql`:

```prisma
model Domain {
  // …
  nameserverMode      String    @default("UNKNOWN")  // VERCEL | EXTERNAL | UNKNOWN
  apexName            String?                        // zone that holds this domain's records
  nameservers         String[]  @default([])         // as Vercel last saw them
  intendedNameservers String[]  @default([])
  @@index([apexName])
}
model DnsRecord {
  // …
  purpose  String  @default("ROUTING")   // ROUTING | OWNERSHIP — which required record this is
}
```

- **Zone records are not mirrored in our DB.** Vercel is the source of truth, and a mirror would drift the moment someone edits in Vercel's dashboard. `DnsRecord` keeps its existing meaning, "records we need to exist", now with `purpose`, so the UI can label "points the domain at your site" vs "proves you own it".
- `lastCheckedAt` already exists and is reused.
- **No backfill is needed.** `UNKNOWN` resolves on first open or cron.
- The owner runs `prisma migrate deploy`. Memory notes that the classifier blocks agents from doing this. It must run before the deploy that selects the new columns.

### Shared Zod: `packages/shared/schemas/dns.ts` (new)

- `dnsRecordTypeSchema = z.enum(["A","AAAA","CNAME","MX","TXT","CAA","SRV"])` for editable types. `DNS_READONLY_TYPES = ["ALIAS","HTTPS","NS"]`.
- `dnsRecordNameSchema` is relative to the apex: `""` (apex), `*` / `*.x` wildcard, or labels `[a-z0-9_-]{1,63}`, total ≤ 253, lowercase.
- `dnsTtlSchema = z.number().int().min(60).max(2147483647)`. The UI offers presets: Auto (60) · 5 min · 1 h · 1 day · custom.
- `createDnsRecordSchema` is a **discriminated union on `type`**:
  - A: `value` IPv4.
  - AAAA: `value` IPv6.
  - CNAME: `value` hostname, refined `name !== ""`.
  - MX: `value` hostname, `mxPriority 0–65535`.
  - TXT: `value` string ≤ 2048. Long values are split into ≤255-byte strings by Vercel; D0 confirms.
  - CAA: `{ flags 0|128, tag issue|issuewild|iodef, value }`, serialised to Vercel's `0 issue "letsencrypt.org"` string.
  - SRV: `{ priority, weight, port 0–65535, target hostname }`. `name` must match `_service._proto[.label]`.
  - Common fields: `domainId`, `siteId`, `name`, `ttl`, and `comment ≤ 500`.
- `updateDnsRecordSchema = createDnsRecordSchema` plus `recordId` and `confirmProtected?`.
- `nameserverModeSchema = z.enum(["VERCEL","EXTERNAL","UNKNOWN"])`.
- `DNS_PROVIDERS` (in `site-detail.ts`) gains a `steps` field per provider: Namecheap, GoDaddy, Cloudflare and Other. It holds both the "change nameservers" and the "add records" step copy. Cloudflare's entry carries the "set the record to DNS only (grey cloud)" note. It stays in shared because both the dialog and the guide render it.

---

## 4. Backend

### 4.1 D0 spike: facts to confirm before building (≈2 h, needs §9 Q2's test domain)

1. In the Vercel integrations console, record the current scope grant. If `domain` is not Read/Write, add it, and record what the confirmation email and the pending state look like. Note the `teamId` vs personal-account behaviour.
2. For a domain on Vercel NS: create, patch and delete one record of each of the seven types via curl with a workspace token. **Capture the exact MX/SRV/CAA create body that succeeds.** Check whether a duplicate create returns 400 or 409, and with which code.
3. For a domain on external NS: does `POST /v2/domains/{d}/records` succeed? Answer yes or no. This decides whether "import before switch" (§5) can pre-load the zone.
4. Record the `X-RateLimit-*` headers on the records endpoints.
5. Append the findings to §2b of this plan. Lanes D-A and D-B cite them.

### 4.2 Vercel client: `lib/vercel-dns.ts` (new; one file, one job: Vercel DNS and domain-state REST)

It reuses `VercelApiError`, `authHeaders` and `teamQueryString` from `lib/vercel.ts`. Those two helpers become exports, with no copies. It has no module-level client; the token is passed per call, as today.

```ts
getVercelDomain({ token, teamId, domain })            → { apexName, serviceType, nameservers, intendedNameservers, verified }
getVercelDomainConfig({ token, teamId, domain, projectName }) → { misconfigured, configuredBy, recommendedIPv4: string[], recommendedCNAME: string | null }
getProjectDomain({ token, teamId, projectName, domain }) → { verified, verification[] }
listDnsRecords({ token, teamId, apex })               → VercelDnsRecord[]   // follows pagination.next
createDnsRecord({ token, teamId, apex, record })      → { id }
updateDnsRecord({ token, teamId, recordId, patch })   → VercelDnsRecord
deleteDnsRecord({ token, teamId, apex, recordId })    → void   // 404 = idempotent success
```

`VercelApiError` gains `retryAfterMs?`, parsed from `limit.resetMs` or the reset header.

**Fix in `lib/vercel.ts`:** `addDomainToVercelProject` must not return `verified: true` on 409. A 409 becomes a `VercelApiError(409, code)`. The service turns it into `DOMAIN_ATTACHED_ELSEWHERE`, and the user sees "This domain is connected to another Vercel project. Remove it there first." A 400 whose message says the domain already exists on **this** project stays idempotent; D0 confirms the code.

### 4.3 Service: `server/services/dns.service.ts` (new)

`domain.service.ts` keeps domain rows: connect, remove, primary and Force HTTPS. `dns.service.ts` owns the zone and verification. These are different jobs, and splitting them keeps each file under ~350 lines.

`dns.service.ts` throws `DnsError(code)`, where code is `NOT_CONNECTED | SCOPE_MISSING | NOT_VERCEL_NAMESERVERS | RECORD_PROTECTED | INVALID | CONFLICT | NOT_FOUND | RATE_LIMITED | UPSTREAM`. This follows the `CmsError` pattern from memory.

| Function | Does |
|---|---|
| `refreshDomainState(domainId, siteId)` | Calls `getVercelDomain`, `getVercelDomainConfig` and `getProjectDomain`. It writes `nameserverMode`, `apexName`, `nameservers`, `intendedNameservers`, `status` and `sslStatus`. VERIFIED means project domain `verified && !misconfigured`. `sslStatus` becomes ACTIVE when `!misconfigured`, because Vercel issues the certificate once it is configured. It also rewrites the domain's **required** `DnsRecord` rows from `recommendedIPv4` and `recommendedCNAME` for the apex-vs-subdomain case (fixing defects 2 and 3), plus any ownership TXT from `verification[]`. **This replaces `checkDomainDns`'s `node:dns` logic.** `node:dns` stays only as the fallback for workspaces with no Vercel connection, in one function used by both the router and the cron (fixing the duplication). |
| `listZoneRecords(domainId, siteId)` | Requires `nameserverMode === "VERCEL"`, otherwise `NOT_VERCEL_NAMESERVERS`. Lists on `apexName`. Annotates each record: `system` (record-sys), and `protected` when it **serves a Buildrick domain**, meaning its name equals a connected domain on this apex and it is A, AAAA, ALIAS or CNAME pointing at Vercel. It returns records, plus `{ apex, otherSitesOnApex[] }` for the shared-apex notice (§9 Q3). |
| `createZoneRecord(domainId, siteId, input)` | Validates with the shared schema. `name` is relative to the apex. Refuses a CNAME on the apex (`""`), and refuses a CNAME alongside other records on the same name, because RFC 1034 does not allow a CNAME to share a name with other data. Then it calls Vercel and re-lists. |
| `updateZoneRecord(...)` / `deleteZoneRecord(...)` | Check that the `recordId` belongs to this apex: re-list and match, so a crafted id cannot touch another zone. Refuse `system` records with `RECORD_PROTECTED`. A `protected` record needs `confirmProtected: true` in the input, which the UI sends only after the stronger confirm (board DNS-M5). |
| `readExistingRecords(domainId, siteId)` | Path (a) pre-switch helper. Resolves public DNS via `node:dns` for the apex and common names (`@`, `www`, `mail`, `_dmarc`, `default._domainkey`, `autodiscover`) and types A, AAAA, CNAME, MX, TXT and CAA. Returns a list. **It cannot read a whole zone**, because public DNS offers no AXFR, so the UI says "We found these. Check your provider for any others." |
| `importRecords(domainId, siteId, records[])` | Creates the chosen records in Vercel. Only possible if D0 step 3 says the API accepts records while the domain is external. If not, the import runs **after** the switch is detected, and the guide says "Email may be interrupted until you import". §9 Q4 asks the owner to weigh this. |

**Audit trail.** Every create, update and delete calls the existing `recordForSite` with `site.dns.record.created|updated|deleted` and metadata `{ domain, type, name }`. It never includes the value of a TXT, which may be a DKIM key or a secret-ish token.

**Cron.** `app/api/cron/dns-verify/route.ts` becomes a thin caller of a service function, `verifyPendingDomains(limit = 20)`, which runs `refreshDomainState` for Vercel-connected workspaces and the `node:dns` fallback otherwise. The route stops touching Prisma.

### 4.4 tRPC (`server/trpc/routers/site-detail.ts`, the `domains` sub-router)

| Procedure | Role | Input (shared Zod) | Output |
|---|---|---|---|
| `domains.refresh` (replaces `domains.check`; the old name is kept as an alias for one release because the editor calls it) | EDITOR | `{ id, siteId }` | Domain with the new fields and the required records |
| `domains.records.list` | EDITOR (read) | `{ domainId, siteId }` | `{ apex, records[], otherSitesOnApex[] }` |
| `domains.records.create` | **ADMIN** | `createDnsRecordSchema` | Re-listed records |
| `domains.records.update` | **ADMIN** | `updateDnsRecordSchema` | Re-listed records |
| `domains.records.delete` | **ADMIN** | `{ domainId, siteId, recordId, confirmProtected? }` | Re-listed records |
| `domains.existingRecords` | ADMIN | `{ domainId, siteId }` | Found records |
| `domains.importRecords` | ADMIN | `{ domainId, siteId, records[] }` | `{ created, failed[] }` |

**Error mapping**, in the router and following `server/AGENTS.md`:

| DnsError / Vercel | tRPC code | User-facing message |
|---|---|---|
| `NOT_CONNECTED` (no active Vercel connection) | `PRECONDITION_FAILED` | "Connect Vercel to manage DNS." (door to Integrations) |
| `SCOPE_MISSING` (403 `forbidden` on a domain endpoint) | `FORBIDDEN` | "Buildrick doesn't have DNS access in Vercel yet. Approve the permission request Vercel emailed to the account owner, or reconnect Vercel." |
| 403 `integration_configuration_disabled` | `PRECONDITION_FAILED` | "Your Vercel connection is disabled. Reconnect Vercel." Also calls `markInactive`. |
| `NOT_VERCEL_NAMESERVERS` | `PRECONDITION_FAILED` | "This domain's DNS is managed elsewhere." (the UI shows the guide instead) |
| `RECORD_PROTECTED` | `FORBIDDEN` | "This record is managed by Vercel." / "This record serves your site. Confirm to change it." |
| 400 `invalid_name` / `bad_request` / Zod | `BAD_REQUEST` | Vercel's message, attached to the field when we can map it |
| 409 / duplicate | `CONFLICT` | "A record like this already exists." |
| 404 | `NOT_FOUND` | "That record no longer exists. The list has been refreshed." |
| 402 | `PRECONDITION_FAILED` | "Vercel needs a plan upgrade for this." |
| 429 `rate_limited` | `TOO_MANY_REQUESTS` | "Vercel is limiting requests. Try again in N s." (from `retryAfterMs`) |
| 5xx / network | `INTERNAL_SERVER_ERROR` | "Vercel didn't answer. Try again." Also reported to Sentry. |

**Security notes**
- Every procedure binds `domainId` to `siteId` before any call. This is the same pattern as the 2026-09-24 audit fix in `checkDomainDns`.
- `recordId` is matched against the apex's own list before an update or delete.
- Record values pass through Zod and are never interpolated into anything except a JSON body.

### 4.5 Env and config

- **No new env vars.** `VERCEL_INTEGRATION_ID`, `VERCEL_CLIENT_ID`, `VERCEL_CLIENT_SECRET` and `ENCRYPTION_KEY` already exist, so the root CLAUDE.md env table needs no new row.
- The **scope change is a deploy step**. It goes in the root CLAUDE.md "Publishing (Vercel)" section as a sentence in the same commit: "the integration needs `domain: Read/Write`; existing installs must approve the upgrade".

---

## 5. Editor / UI

**Where it lives.** Everything stays in **Settings › Domains** (`DomainsScreen.tsx`), under PUBLISHING. It is not in the Inspector or a page drawer. **Save model: immediate.** Every action is server-side on confirm, the screen is never dirty, and the scope line keeps "Live immediately · no publish needed" (Phase B M1 variant). Record dialogs save on their primary button and show inline errors. The list re-renders from the server's answer.

**Screen split.** `DomainsScreen.tsx` is already 548 lines, so the domain detail moves out:
- `settings/components/domains/DomainDetail.tsx` holds the header, status, Force HTTPS and Remove, which already exist.
- `DnsRecordsManager.tsx` covers Vercel DNS.
- `DnsRecordDialog.tsx` handles add and edit, with per-type fields.
- `DeleteDnsRecordDialog.tsx`.
- `ExternalDnsGuide.tsx` covers the two paths.
- `ImportRecordsDialog.tsx`.

The new screen code calls tRPC through `getBuildrikClient()`, as today. The dialogs stay pure and receive calls as props, following the `AddDomainDialog` pattern.

### Flow
1. **Add a domain** (AddDomainDialog, updated):
   - Remove the read-only nameserver and record previews, which promise values the server later replaces.
   - After `connect` succeeds, the dialog closes and the screen opens that domain's detail.
   - The detail then shows the right path, because by then the server knows the nameserver mode.
2. **Domain detail: Vercel DNS** (`nameserverMode === "VERCEL"`):
   - A status strip ("Connected · SSL active", "Configuring…", or "Misconfigured: [reason]").
   - The **records table**: type · name (relative, apex shown as `@`) · value (truncated, copy) · TTL · priority · actions (edit / delete).
   - Badges: "Vercel" for system records, which have no actions, and "Serves this site" for protected records.
   - A type filter, an **Add record** button, an empty state, a loading state, and an error banner.
   - Shared-apex notice: "Records here also affect blog.example.com (Site 'Blog')."
3. **Domain detail: external DNS** (`EXTERNAL`): the guide, with two tabs or cards.
   - **"Use Vercel DNS (recommended: manage records here)"**:
     - The two nameservers to set, with copy buttons.
     - "Currently: ns1.registrar.com, ns2…" (from Vercel's `nameservers`).
     - Registrar steps for the chosen provider.
     - **"Copy existing records first"**, which opens ImportRecordsDialog.
     - **Check now**, which runs `domains.refresh`.
     - A note that propagation takes up to 48 h.
     - When the mode flips to VERCEL, a success state "Now on Vercel DNS · manage records below".
   - **"Keep your current DNS provider"**:
     - The required records table (from `refreshDomainState`), with a purpose label and copy buttons per cell.
     - Provider steps.
     - **Check now** with per-record state (Found / Not found yet).
     - The Cloudflare proxy note.
4. **Unknown or not connected:**
   - Without a Vercel connection: today's instructions view, plus a card "Connect Vercel to manage DNS here" with a door to the workspace Integrations page.
   - Scope missing: a banner "Approve DNS access in Vercel" with a "Reconnect Vercel" action and a short explanation.
5. **Permissions.** EDITOR sees the records read-only. Add, edit and delete are **disabled with the reason**, never hidden, matching the existing Domains rule. ADMIN can do everything.
6. **Toasts.** "Record added · changes can take a few minutes to appear". Deleting a protected record shows a warning-tone toast.
7. **Dashboard** `domains-tab.tsx` adds a "Vercel DNS / External DNS" pill per domain. It stays read-only.

---

## 6. Missing Figma boards (designer brief)

These are prefixed **DNS-M** so they do not collide with Phase B's M1–M19 or the SEO plan's SEO-M. They go on `4418:45431` next to Domains 8136:214348 and Add a domain 3737:43669. All are 1440×900 with Settings › Domains open. They show shape, not literal data.

| # | Board | Must show |
|---|---|---|
| DNS-M1 | Domains list · mode pills | The existing list (8136:214348) plus a pill per card: "Vercel DNS" / "External DNS" / "Checking…". The connection line now reads Connected · SSL active / Configuring / Misconfigured. |
| DNS-M2 | Domain detail · Vercel DNS · records | Header `Domains / example.com`. Status strip. Records table with columns type · name · value · TTL · priority · actions, and about 8 rows mixing A @, CNAME www, MX ×2 (priority), TXT (long SPF, truncated with copy), CAA, a "Vercel" system row (no actions) and a "Serves this site" row (lock icon). Type filter chips. "Add record". Shared-apex notice variant. |
| DNS-M3 | Domain detail · records states | Loading skeleton rows · empty ("No records yet. Add one.") · load error (Try again) · EDITOR read-only (actions disabled + reason tooltip) · rate-limited banner ("Try again in 30 s"). |
| DNS-M4 | Add/Edit record dialog | Type select first. Then one variant per field set: A/AAAA (name, IPv4/IPv6), CNAME (name, target; apex refused inline), MX (name, mail server, priority), TXT (name, multi-line value + char count), CAA (flags, tag select, value), SRV (service, protocol, priority, weight, port, target). Common: TTL select (Auto · 5 min · 1 h · 1 day · Custom) and comment. Inline field error, server refusal line under the form, and Saving… state. The edit variant has a prefilled title "Edit record". |
| DNS-M5 | Delete record confirm | Plain variant "Delete TXT record `_dmarc`?". **Strong variant** for a "Serves this site" record: "Deleting this takes example.com offline", with a typed-confirm or checkbox and a destructive button. |
| DNS-M6 | External DNS guide · Use Vercel DNS | Two-path chooser (cards or tabs), with this path selected. Nameserver pair with copy. "Currently set to …" row. Provider select and numbered steps (Namecheap shown). "Copy existing records first" call-out. Check now, last-checked time, and the 48 h note. |
| DNS-M7 | External DNS guide · Keep your provider | Required-records table (purpose label "Points to your site" / "Proves ownership", type, name, value, copy, state Found / Not found yet). Provider steps (Cloudflare shown, with the DNS-only note). Check now. |
| DNS-M8 | Import existing records dialog | "We found 7 records on example.com" with checkbox rows (type, name, value), "Check your provider for others" note, Cancel / Import 7, and a partial-failure result ("6 imported · 1 failed: reason"). |
| DNS-M9 | Switch detected | The success state when the mode flips to Vercel DNS: banner plus records table, and a prompt to import if not done. |
| DNS-M10 | Connection problems | Three banners/cards: Vercel not connected (door "Connect Vercel ↗"), DNS permission not approved ("Approve in Vercel / Reconnect"), and connection disabled. Each over a dimmed records area. |
| DNS-M11 | Add a domain dialog · trimmed | 3737:43669 without the read-only nameserver and record previews. Name + availability, type, Force HTTPS, and a one-line "Next you'll choose how to point it" note. |
| DNS-M12 | Toasts | Record added / updated / deleted (with propagation note), and protected-record deleted (warning tone). |

---

## 7. Publish / export impact

- **The deploy itself is unchanged.** DNS records are not part of a publish.
- `vercel.json` REDIRECT-kind host rules (`lib/publish-files.ts` `buildVercelConfig`) still depend on `isPrimary` and `kind`. VERIFIED now means Vercel verified the domain, so `setPrimaryDomain` (VERIFIED-only) becomes stricter in a way that is correct.
- **SEO interaction:** canonical and sitemap origins (`resolveSiteOrigin`) use the *verified* domain. Fixing defect 1 means a domain attached elsewhere no longer becomes the canonical origin by accident. This matters for the SEO plan's Q10 (canonical defaults to the verified primary).
- **`cleanUrls`** has no interaction with DNS.
- **Verify against what is served.** After a record change, `dig @ns1.vercel-dns.com <name> <type> +short` returns the new value (that is Vercel's authoritative answer, independent of propagation). After the nameserver switch, `curl -I https://<domain>` returns 200 from Vercel (`server: Vercel`) with a valid certificate. This is checked in D-E.

---

## 8. Lanes

**Order:** D0 → D-A → D-B → D-C → D-E. D-C also waits on DNS-M1–M12. D-D can run any time after D-A.

| Lane | Owns (files) | Depends on | Observable done-condition |
|---|---|---|---|
| **D0 Spike** | This plan's §2b (append only) | Test domain on Vercel NS (§9 Q2), access to the integrations console | §2b has the confirmed scope grant, the working MX/SRV/CAA create bodies, the duplicate-error code, the external-NS create behaviour (yes/no) and the rate-limit headers, each with the curl transcript. |
| **D-A Contracts + client + migration** | `prisma/schema.prisma` + D1 migration; `packages/shared/schemas/dns.ts` (new), `site-detail.ts` (`DNS_PROVIDERS.steps`); `lib/vercel-dns.ts` (new); `lib/vercel.ts` (export helpers, 409 fix) + tests | D0 | `prisma migrate status` is clean. A `tsx` smoke with the QA workspace token lists real records for the test domain via `listDnsRecords`, creates then deletes a TXT, and `getVercelDomain` returns `serviceType: "zeit.world"`. A unit test confirms a 409 attach is an error, not success. |
| **D-B Service + router + cron** | `server/services/dns.service.ts` (new); `server/services/domain.service.ts` (connect/remove adjustments, move router's `ctx.prisma` reads in); `server/trpc/routers/site-detail.ts` (`domains.*`); `app/api/cron/dns-verify/route.ts` (thin); `__tests__` for error mapping, site-binding and recordId-ownership | D-A | Via `tsx` against the dev server with the QA workspace: `records.create` for each of the seven types, then `dig @ns1.vercel-dns.com` returns each value. `records.update` changes the value and dig shows it. `records.delete` makes dig answer NXDOMAIN or empty. Deleting a system record is refused (FORBIDDEN). A recordId from another apex returns NOT_FOUND. With the scope revoked in a sandbox install, the call returns FORBIDDEN with the scope message. `refresh` on a correctly pointed domain sets VERIFIED + `sslStatus` ACTIVE. |
| **D-C Editor UI** | `settings/screens/DomainsScreen.tsx`, `settings/components/domains/*` (new), `settings/components/AddDomainDialog.tsx`; tests protecting the old read-only table rewritten in the same commit | D-B, boards DNS-M1–M12 | Side-by-side board vs live at 1440×900 for each of DNS-M1–M12. In the running editor: add an MX record, and dig shows it within 60 s. Edit its priority, and dig shows it. Delete it, with the confirm, and dig shows it gone. An external test domain shows the guide with the real current nameservers. An EDITOR login sees disabled actions with reasons. |
| **D-D Dashboard + docs** | `packages/dashboard/components/site-detail/domains-tab.tsx` (mode pill); root `CLAUDE.md` Vercel section (scope sentence); `server/AGENTS.md` (note `dns.service.ts`) | D-A | The dashboard site page shows the pill for both test domains. `pnpm run audit:rules` reports no new stale paths. |
| **D-E QA walk** | Report only | all | A `/qa` walk of add domain → guide → nameserver switch detected → import → record CRUD → remove domain on the real test domain. Includes `curl -I https://<domain>` = 200 from Vercel with a valid certificate. The report states what was not verified (for example, GoDaddy steps not walked live). |

---

## 9. Risks and open questions

### Open questions for the owner (each with a recommendation)

| # | Question | Recommendation |
|---|---|---|
| Q1 | Accept that adding the `domain: Read/Write` scope makes **every existing workspace owner approve it in Vercel** (Vercel emails them), and that DNS editing stays off for them until they do? | **Yes.** It is the only way. Ship the "Approve DNS access" state (DNS-M10), so the screen explains itself instead of failing. |
| Q2 | Can we have a **test domain on Vercel nameservers** in the QA Vercel account, plus a second one on external DNS? | **Yes, it is required.** D0, D-B and D-E cannot be verified without one. A spare domain (about $10/yr) pointed at ns1/ns2.vercel-dns.com. Lanes that need it are blocked until it exists. |
| Q3 | **Shared apex across sites:** `example.com` on site A and `blog.example.com` on site B share one zone. Which site's screen edits it? | **Either site's ADMIN can edit the zone.** Records serving the *other* site are marked "Serves Blog" and get the strong confirm. A notice names the other sites. A per-zone owner model is overkill for v1. |
| Q4 | Offer **"copy existing records before switching nameservers"**? | **Yes.** Switching nameservers without copying MX silently breaks the customer's email, which is the worst support ticket this feature can generate. If D0 shows the API refuses records for external domains, run the import right after the switch is detected, with an explicit "email may pause until you import" warning. |
| Q5 | Which types are editable? | **A, AAAA, CNAME, MX, TXT, CAA and SRV** are editable. **ALIAS, HTTPS and NS are read-only.** NS delegation can hand a subdomain away, and ALIAS/HTTPS are rarely needed by our users. |
| Q6 | Drop our `_buildrick` TXT requirement? | **Yes, for Vercel-connected workspaces.** Vercel's own verification is the truth, and our token blocks VERIFIED for no reason. Keep it only for the no-Vercel fallback, where it is the only ownership proof we have. |
| Q7 | What is the source of truth for "Connected" and "SSL active"? | **Vercel** (project-domain `verified` + config `misconfigured`). `node:dns` only when there is no Vercel connection. |
| Q8 | Plan gating? | **No extra gate.** FREE already has `customDomains: 0` (`lib/constants/plan-limits.ts`), so DNS management is effectively paid-only. |

### Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **The user takes their own site offline** by deleting or editing the apex A/ALIAS or `www` CNAME. | "Serves this site" protection with a strong confirm (DNS-M5), and the server requires `confirmProtected`. |
| R2 | **Email breaks on the nameserver switch.** | Import step (Q4), plus a guide warning that names MX explicitly. |
| R3 | Unknown DNS endpoint rate limits. | No polling. Cron capped at 20 domains per run. 429 is surfaced with retry time. Re-list only after a mutation. |
| R4 | Vercel API version drift (the docs already disagree on records list v4 vs v5). | All endpoint paths live in `lib/vercel-dns.ts` only, with response parsing tolerant of extra fields and contract tests on recorded fixtures from D0. |
| R5 | Records edited in Vercel's own dashboard. | No DB mirror, so the list is always live and there is nothing to drift. |
| R6 | Token leak via logs. | Never log tokens or TXT values. `recordForSite` metadata excludes values. |
| R7 | Defect 1 fix changes behaviour for existing rows already marked VERIFIED via a 409. | The first `refresh` (screen open or cron) recomputes status from Vercel. Expect some domains to drop to PENDING, which is correct, and flag it in the release note. |
| R8 | `dnsProvider` steps copy goes stale as registrars change their UI. | Keep the steps short and generic ("Find Nameservers → Custom DNS"), and link to the registrar's own help page per provider. |

---

## 10. Estimate (agent-hours)

| Lane | Hours |
|---|---|
| D0 Spike (needs test domain) | 2 |
| D-A Contracts + Vercel client + migration | 6 |
| D-B Service + router + cron + defect fixes | 12 |
| D-C Editor UI (detail split, records manager, dialogs, guide, import) | 18 |
| D-D Dashboard pill + docs | 2 |
| D-E QA walk on a real domain | 5 |
| **Total** | **≈ 45 agent-hours** (plus design time for DNS-M1–M12, not counted) |

The path is strictly sequential, D0 → D-A → D-B → D-C → D-E, so the critical path is about 43 h. D-C can start on the dialogs against mocked props once the boards land, while D-B finishes.

---

## Owner decisions (2026-10-04)

All eight recommendations above are accepted. **The DNS CRUD lanes are paused** until the owner provides the two QA test domains (one on Vercel nameservers, one on external DNS) and approves the integration's `domain` Read/Write permission upgrade; the D0 spike needs both.

The current-state bugs this plan found (Vercel 409 treated as verified, apex instructions for subdomains, the `_buildrick` TXT required although Vercel does not need it, SSL never set active, the cron duplicating the service's DNS checks) are fixed now, ahead of the lanes.

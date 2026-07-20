# Security audit — auth · onboarding · dashboard (2026-07-20)

`/cso` daily mode, 8/10 confidence gate. Read-only; no code changed by this audit.
Scoped to the three domains named. Machine-readable copy in
`packages/dashboard/.gstack/security-reports/` (gitignored, stays local).

## Result

**Zero findings at or above the reporting bar.** Seven candidates were examined;
all seven were disproved or excluded. That is a real result, not an empty scan —
each one is written up below with what made it a non-issue, so the next audit
does not re-litigate them.

## Attack surface

| | |
|---|---|
| tRPC procedures | 282 total — **262 protected**, 17 public, 3 rate-limited |
| Public procedures in scope | 3 (`auth.login`, `auth.getInviteDetails`, `auth.declineInvite`) |
| Auth screens | 23 · Onboarding screens | 8 |
| Secret management | cPanel `node-selector.json` env vars |

## What holds up

Checked, not assumed:

- **Passwords** — bcrypt (`auth.service.ts:184`). Lockout is checked *before*
  bcrypt runs, and bcrypt runs even for unknown emails, so neither timing nor
  cost leaks account existence (`auth.service.ts:99,114`).
- **Rate limiting** — `strictRateLimit` 5 per 15 min, `normalRateLimit` 10 per
  15 min on auth (`routers/auth.ts:21-23`).
- **Tokens at rest** — sha256-hashed, never stored raw (`token.service.ts:6`).
- **`protectedProcedure`** — deny-by-default, and **fail-closed on a bad bearer
  token**: an invalid `Authorization` header rejects the request instead of
  falling through to the cookie session, so a stale token plus a hijacked cookie
  cannot reach a protected endpoint (`trpc.ts:24-48`).
- **Workspace scoping** — defended twice. The switch validates ACTIVE membership
  before writing `token.workspaceId` (`auth.config.ts:139-153`), and every read
  re-verifies membership rather than trusting the claim
  (`routers/dashboard.ts:29-31`).
- **Onboarding has no IDOR surface at all** — every procedure derives the subject
  from `ctx.session.user.id`. There is no user-supplied id to tamper with.
- **Input-supplied ids elsewhere** are consistently gated first —
  `assertWorkspaceMember`, `checkSiteRole`, `requireRead`/`requireWrite`,
  `guardSite`.
- **Session cookies** — `httpOnly`, `secure` in production, `sameSite: lax`.
- **Middleware** — matcher covers `/dashboard/:path*` and `/onboarding/:path*`;
  unauthenticated requests redirect to login. Defense in depth over the tRPC gate,
  not a substitute for it.
- **Git history** — no `.env` tracked, `.env*` gitignored, and no real credential
  format (`AKIA`, `sk_live_`, `ghp_`, `xoxb-`, private-key blocks) anywhere in
  history. The five commits that matched a `-G` search matched the *words*, not
  secrets; each was opened and confirmed.

## The seven candidates, and why none is a finding

| # | Candidate | Verdict |
|---|---|---|
| 1 | Raw SQL in 4 services | **FP.** All Prisma tagged templates / `Prisma.sql` — parameterized, not concatenated |
| 2 | SSRF in `stock.service.ts:39` | **FP.** Hosts hardcoded (`api.unsplash.com`, `api.pexels.com`); only query params vary. FP rule 12 |
| 3 | User input in AI system prompt (`ai.service.ts:203`) | **FP.** `sectionType` is a server-side lookup; `pageType` and `style` are `z.enum`. The free-form `description` goes to the user-message position. Precedent 13 |
| 4 | CORS falls back to `http://localhost:5050` | **FP.** `EDITOR_ORIGIN` verified set in production to `https://app.buildrick.io`; the fallback cannot fire there |
| 5 | CSP allows `'unsafe-inline' 'unsafe-eval'` | **Below gate.** See note |
| 6 | No auth audit logging | Excluded — hard exclusion 16 |
| 7 | 30-day session `maxAge` | Excluded — missing hardening, not a vulnerability |

### Note on #5, the one worth a second look

`next.config.mjs:54` ships `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
which removes most of what CSP would buy against XSS.

It is not reported as a finding because a CSP is a mitigation, and mitigations
only matter once there is something to mitigate: no XSS sink was found in scope.
`dangerouslySetInnerHTML` appears nowhere in `app/onboarding` or `components`,
and React escapes by default.

Two honest caveats:

1. That conclusion is scoped to auth, onboarding and dashboard. It says nothing
   about the editor, which is **known** to mount raw un-escaped HTML on the canvas
   for AI-generated sites. If any of that ever renders on a dashboard route, this
   CSP stops being academic.
2. Tightening it is cheap and the blast radius of being wrong is large. Worth
   doing on its own merits, just not as an incident.

## Also relevant: one real hole was found and closed today

Outside this scope but inside the same session, `listClientComments` in
`client-review.service.ts` let anyone holding a live review share link read
**every** comment on a site, internal workspace-member notes included, before
identifying themselves. Prisma drops an `undefined` filter rather than matching
NULL, so `reviewerId: review.reviewerId ?? undefined` collapsed the query to
`{ siteId }`. Confirmed by inserting an internal comment and running the real
expression against it. Fixed in `29670bf4` with two regression tests, verified by
reverting the fix and watching them fail.

Worth stating next to a clean report: the surface that failed was the
**token-authenticated** one, not the session-authenticated one this audit covers.
That is where the next look should go.

## What this audit did NOT cover

- The editor package (`packages/editor`) — not in scope, and it holds the known
  raw-HTML mount path.
- Billing and Stripe — verified separately end-to-end in test mode today.
- Dependency CVEs, CI/CD pipeline, container and IaC config (Phases 3, 4, 5) —
  out of a `--scope` run. `/cso --infra` covers those.
- Anything on production. This is source-level plus two read-only prod env checks.

---

**This is not a substitute for a professional security audit.** `/cso` is an
AI-assisted scan that catches common vulnerability patterns. It is not
comprehensive and not guaranteed. LLMs miss subtle vulnerabilities and
misunderstand complex auth flows. For a product handling payments and PII, engage
a qualified penetration testing firm; use this as a first pass between real
audits, not as the only line of defense.

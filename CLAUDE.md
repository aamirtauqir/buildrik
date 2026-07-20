# Buildrik — Code Rules

## Stack

Next.js 16 (App Router, Turbopack) | React 19 | Tailwind CSS 4 | tRPC 11 | NextAuth 5 | Prisma 5 | PostgreSQL | Nodemailer (SMTP) | Zod

## Architecture

```
packages/
  dashboard/          → Next.js app (pages, components, emails)
  editor/             → Vite editor app (untouched source)
  shared/             → Transport-safe contracts (API client, Zod schemas)
server/
  auth.ts             → NextAuth init
  auth.config.ts      → NextAuth providers config
  trpc/
    trpc.ts           → tRPC context & base procedures
    router.ts         → Router aggregation (single export)
    routers/          → One file per domain (auth.ts, etc.)
  services/           → Business logic. One file per domain.
lib/
  prisma.ts           → Prisma singleton
  utils.ts            → Shared pure utilities (cn, etc.)
  trpc/client.tsx     → tRPC client + React Query provider
prisma/               → Schema & migrations
```

## Data Flow (one direction, no shortcuts)

```
Page → tRPC mutation → Router → Service → Prisma/External API
```

- Pages call tRPC mutations. Never import services directly.
- Routers call services. Never touch Prisma directly.
- Services own all business logic + DB access.
- This chain is not optional. No skipping layers.

## Intent Layer

**Before modifying code in a subdirectory, read its AGENTS.md (or CLAUDE.md) first** to understand local patterns, invariants, and known pitfalls.

- **Server (tRPC + services)**: `server/AGENTS.md` — data-flow chain, domain errors, raw-SQL and external-client rules
- **Dashboard (Next.js app)**: `packages/dashboard/AGENTS.md` — routing, tRPC-only data access, embedded-editor traps
- **Editor package root**: `packages/editor/CLAUDE.md` — stack, path aliases, architecture rules (pre-existing node)
- **Editor engine (headless)**: `packages/editor/src/engine/AGENTS.md` — Composer, history/undo invariants, sanitize boundary
- **Editor chrome (React UI)**: `packages/editor/src/editor/AGENTS.md` — canvas mount model, DS gates, orphan-CSS traps
- **Vibcoder (component library)**: `packages/editor/src/editor/shared/vibcoder/AGENTS.md` — primitive contracts, CSS bundle rules

### Global Invariants

- Validation schemas live only in `packages/shared/schemas/` (SSOT).
- One accent color: cobalt `#2D6DFF`. Purple/violet/indigo banned (DESIGN.md).
- Never instantiate external clients at module level — lazy-init.
- `../../` relative imports banned; use path aliases.

## Code Quality Rules

### No pass-through wrappers
Every function must add logic, transform data, or enforce a constraint. If it just calls another function with the same args, delete it and call the target directly.

### No middle-man files
No file should exist only to re-export from another file. If `router.ts` just re-exports from `routers/auth.ts`, it must aggregate multiple routers — otherwise delete it.

### No duplicate logic (semantic duplication)
If two places do the same thing with different variable names, extract to one source. But don't extract things that merely look similar — only extract when the duplication is semantic (same intent, same rules).

### Single Source of Truth (SSOT)
- Zod schemas live in `packages/shared/schemas/`. Don't recreate validation logic in services or routers.
- DB schema is Prisma. Don't maintain parallel type definitions.
- Auth config lives in `server/auth.config.ts`. Don't scatter provider logic.
- Email templates live in `packages/dashboard/emails/`. Don't inline HTML in services.

### One file = one job
- A service file handles one domain (auth, email, token, rate-limit).
- A component file renders one visual element.
- A router file exposes endpoints for one domain.
- If a file does two unrelated things, split it.

### No dead code
Don't commit unused functions, unused imports, unused exports, or commented-out code. Delete it. Git has history.

### No over-fragmentation
Don't split a 20-line function into 4 files. A file should contain enough context to understand what it does without jumping elsewhere. If understanding a flow requires opening 6+ files, the flow is too fragmented.

### No hidden side effects
- Functions should do what their name says. `getUser()` should not send an email.
- Module-level code must not throw or trigger I/O. Use lazy initialization for external clients (the SMTP transport, etc.).
- Constructors and top-level `const` must be side-effect-free.

### Low coupling, high cohesion
- Import from the layer directly below, not two layers down.
- A component should not import from `server/`. A service should not import from `components/`.
- Shared types go in `lib/`. Domain types stay in their domain file.

## Folder Structure Rules

### Clear ownership
Every folder has one owner domain. Don't put auth components in a generic `components/ui/` folder — put them in `components/auth/`. When a new domain arrives (e.g., dashboard, billing), it gets its own subfolder in each layer.

### No accidental architecture
When adding a new feature:
1. Does it belong to an existing domain? → Add to that domain's files.
2. Is it a new domain? → Create the full vertical: `app/[domain]/`, `server/services/[domain].service.ts`, `server/trpc/routers/[domain].ts`, `components/[domain]/`, `lib/validations/[domain].ts`.
3. Never dump files in root folders "temporarily."

### No spaghetti execution
A request should flow through at most: Page → Router → Service → DB. If you need to trace through more than 4 files to understand a single operation, refactor.

### Flat over nested
Prefer `app/auth/login/page.tsx` over `app/auth/flows/credential/login/page.tsx`. Don't nest beyond 3 levels unless the domain genuinely requires it.

## Conventions

- **Naming:** Files are `kebab-case`. Components are `PascalCase`. Functions/variables are `camelCase`.
- **Env vars:** Never instantiate external clients at module level. Always lazy-init: `let _client; function getClient() { if (!_client) _client = new Client(key); return _client; }`
- **Error handling:** Services throw domain errors (`AuthError`). Routers catch and translate to tRPC errors. Pages show user-friendly messages. Don't swallow errors silently.
- **Imports:** Dashboard uses `@server/` and `@lib/` path aliases for root-level shared code. Editor uses `@/` alias pointing to `packages/editor/src/`. No relative imports that go up more than one level (`../../` is banned).

## Don'ts

- Don't add features, refactoring, or "improvements" beyond what was asked.
- Don't add comments to code you didn't write.
- Don't create wrapper functions "for consistency."
- Don't create utility files with one function.
- Don't add error handling for scenarios that can't happen.
- Don't use `any`. Don't use `as` unless truly necessary.
- Don't `git stash` mid-execution to verify baselines. Read baseline state BEFORE making changes, OR use `git worktree add` for a sibling tree. (5 cumulative recovery incidents — see memory `feedback_no_stash_mid_execution`.)

## Design System

Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, aesthetic direction, and anti-slop rules are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md — especially: purple/violet/indigo accents (banned), default font stacks (banned), decorative AI-slop patterns (banned list in DESIGN.md).

Key constraints:
- Editor chrome uses the canonical light theme per DESIGN.md (see Color / Token Namespace Contract sections). Desktop-only. Dark-only direction was flipped 2026-04-18 in the theme unification.
- Single accent color: cobalt `#2D6DFF` (legacy indigo/violet tokens fully drained as of 2026-06-12).
- Typography: General Sans (display), Inter Tight or Geist (body/UI), Geist Mono (data). No Arial/Helvetica/Roboto fallbacks.
- 4px base spacing, compact density.
- Minimal motion. No spring physics, no scroll choreography.

## V1 freeze policy — CLOSED 2026-05-28

V1 shipped 2026-05-18 (see `V1_WALK_AND_FIX.md`, 19 iterations, 30 commits).
Freeze formally lifted 2026-05-28. New scope (collab arc next) now permitted.
Historical record kept in `V1_WALK_AND_FIX.md` (closed log).

## Server env vars

Dashboard package (Next.js — `process.env.X`). Vite editor env lives in `packages/editor/CLAUDE.md`.

**This table is the deploy checklist.** It was incomplete for months, and that is not a documentation nit: `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID` and `OPENAI_API_KEY` were absent from it, were therefore never set in production, and **social login and AI drafting were silently dead in prod while working fine in dev** (2026-07-14). If you add a `process.env.X` read, add the row here in the same commit.

### Core

| Var | Purpose | Required? |
|-----|---------|-----------|
| `DATABASE_URL` | Postgres connection string. Also needed in `packages/dashboard/.env` (not `.env.local`) — Prisma CLI reads only `.env`. | Yes |
| `NEXTAUTH_SECRET` | NextAuth session signing key. Also the source of the AES key for encrypted 2FA secrets (`auth.service.ts`), so rotating it invalidates those. | Yes |
| `NEXTAUTH_URL` | Canonical origin NextAuth builds callback URLs against. | Yes in production |
| `NEXT_PUBLIC_APP_URL` | The dashboard's own origin (`https://app.buildrick.io`). Used for draft share links (`/share/<token>`) and absolute links in email. **Baked at build time** — see the build-time note below. | Yes |
| `AUTH_TRUST_HOST` | `true`. NextAuth v5 reads this **itself** — you will not find it via `grep process.env` in this repo. Behind cPanel/LiteSpeed the app sits behind a proxy, and without it NextAuth rejects the forwarded host (`UntrustedHost`) and every sign-in fails. | Yes on cPanel |
| `AUTH_SECRET` / `AUTH_URL` | NextAuth v5's own names for `NEXTAUTH_SECRET` / `NEXTAUTH_URL`. Also read internally, not through our source. Production sets both pairs. | Yes in production |
| `COOKIE_DOMAIN` | Optional cookie domain override when the app and editor sit on different subdomains. | No |
| `CRON_SECRET` | Bearer token the cron routes (`/api/cron/*`) check before running. | Yes in production |

### Auth providers

Social login is broken — not degraded, **broken** — without these: NextAuth still redirects to the provider, but with `client_id=undefined`, and Google/GitHub show an error page.

| Var | Purpose | Required? |
|-----|---------|-----------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app (Google Cloud Console). The prod callback `https://app.buildrick.io/api/auth/callback/google` must be listed under **Authorized redirect URIs**, or Google returns `Error 400: redirect_uri_mismatch`. | Yes — "Continue with Google" is dead without them |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth app. Same rule for its callback URL. | Yes — "Continue with GitHub" is dead without them |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile. Only reached after repeated failed logins trip the captcha gate. | Only if captcha is enabled |

### Email (SMTP)

| Var | Purpose | Required? |
|-----|---------|-----------|
| `SMTP_HOST` | Transactional email host (e.g. `buildrick.io`) | Yes in production |
| `SMTP_PORT` | `465` for implicit TLS (SMTPS), `587` for STARTTLS. The transport sets `secure: true` only on 465. | Yes in production |
| `SMTP_USER` | Mailbox login (e.g. `info@buildrick.io`) | Yes in production |
| `SMTP_PASS` | Mailbox password (plain). Never commit — `.env.local` in dev. | Dev; prod only if the host doesn't mangle it |
| `SMTP_PASS_B64` | Base64 of the password. **Required on cPanel/Passenger**, which pipes env vars through a shell: a `$` in the password is read as a variable and silently eaten (`^+qH$gt@…` lost `$gt` → 535 auth failure in prod while dev worked). Base64 has no shell metacharacters. Takes precedence over `SMTP_PASS`. | Yes on cPanel |
| `EMAIL_FROM` | Sender, e.g. `Buildrick <info@buildrick.io>`. Most SMTP hosts require this to match `SMTP_USER`'s domain. | Yes in production |

### Publishing (Vercel)

Sites deploy into **the workspace's own Vercel account** via per-workspace OAuth — Buildrick hosts nothing. Publishing is impossible without a connection, and `runPrePublishChecks` hard-fails on it.

| Var | Purpose | Required? |
|-----|---------|-----------|
| `VERCEL_INTEGRATION_ID` | Integration slug from vercel.com/integrations/console. `buildAuthUrl` throws without it, so nobody can connect Vercel at all. | Yes for publishing |
| `VERCEL_CLIENT_ID` / `VERCEL_CLIENT_SECRET` | OAuth credentials used by `exchangeCodeForToken`. **Note the names** — an earlier version of this table called them `VERCEL_OAUTH_CLIENT_ID`/`_SECRET`, which the code has never read. | Yes for publishing |
| `ENCRYPTION_KEY` | 32-byte hex (`openssl rand -hex 32`) for AES-256-GCM token-at-rest. Rotate by re-encrypting all rows. | Yes for publishing |
| `VERCEL_PROJECT_PREFIX` | Optional prefix on generated Vercel project names. | No |
| `VERCEL_TOKEN` | Shared Vercel API token from the retired "Buildrick hosts everything" model. Nothing in the publish path reads it now. | No — legacy |

**There is no `VERCEL_OAUTH_REDIRECT_URI`.** The callback is registered with Vercel at integration-registration time, and the callback route derives its own `redirect_uri` from the request (`${url.protocol}//${url.host}/api/integrations/vercel/callback`). Setting this var does nothing.

### Payments (Stripe)

Subscriptions are hosted Stripe Checkout + Customer Portal — we never touch a card
number. `billing.createCheckoutSession` resolves/creates a Stripe customer and
returns a Checkout URL; the plan is flipped to ACTIVE **only** by the verified
`checkout.session.completed` webhook (`handleCheckoutCompleted` in
`stripe-webhook.service.ts`), never by the session-creation call itself — see the
security invariant documented at `billing.service.ts:158` (now `createCheckoutSession`).

| Var | Purpose | Required? |
|-----|---------|-----------|
| `STRIPE_SECRET_KEY` | Server-side Stripe API key. Without it, `getStripe()` throws `PAYMENTS_NOT_CONFIGURED` — Checkout/Portal session creation fails cleanly (tRPC `PRECONDITION_FAILED`), it does not crash. | Yes for billing |
| `STRIPE_WEBHOOK_SECRET` | HMAC secret for the raw-signature verification in `app/api/webhooks/stripe/route.ts` (no Stripe SDK involved in verification — see the 5-min replay-window check there). Now load-bearing: without it every webhook 500s (`route.ts:47-51`) and no plan ever reaches ACTIVE, no matter how many customers pay. | Yes for billing |
| `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_YEARLY` | Stripe Price ids for the Pro plan (created in the Stripe dashboard from `lib/constants/plan-limits.ts`'s PRO pricing — $29/mo, $23/mo billed yearly). Also used in reverse by the webhook to map an incoming Stripe price id back to `plan: "PRO"`. | Yes for billing |
| `STRIPE_PRICE_BUSINESS_MONTHLY` / `STRIPE_PRICE_BUSINESS_YEARLY` | Same, for Business ($79/mo, $63/mo billed yearly). | Yes for billing |

**Test-mode Products/Prices exist** (created 2026-07-19; the four test Price ids
are in `.env.local`). Live mode is still empty — creating the live Products and
copying those Price ids into the four vars above is a founder step in the Stripe
dashboard.

**The webhook endpoint must subscribe to exactly these four events:**
`checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
Note the last one — dunning used to hang off `charge.failed`, which cannot work:
the Charge object carries no subscription link at all (its only reference is
`payment_intent`), so the handler was never reached and no failed payment ever
reached PAST_DUE. An endpoint still subscribed to `charge.failed` gets deliveries
this app ignores.

**Stripe payload shapes drifted and the old fields are gone** (this account is on
API `2026-01-28.clover`). Two fields the handlers used to read no longer exist:

| Was | Is now |
|-----|--------|
| `invoice.subscription` | `invoice.parent.subscription_details.subscription` |
| `subscription.current_period_start` / `_end` | `subscription.items.data[N].current_period_start` / `_end` |

Both shipped broken because the unit tests hand-build payloads. A test that
invents its own Stripe payload proves nothing about Stripe — build them through
the `invoiceParent()` / `subItem()` helpers in
`__tests__/stripe-webhook-service.test.ts`, which mirror verified live payloads,
and re-verify against a real webhook delivery (`stripe listen`) before believing
a green suite.

### AI

| Var | Purpose | Required? |
|-----|---------|-----------|
| `OPENAI_API_KEY` | AI site generation. Without it every `ai-generate-worker` job fails on "Missing credentials" and the AI onboarding path dies (the UI degrades to "AI drafting isn't configured yet"). | Yes if the AI path is offered |
| `ANTHROPIC_API_KEY` | Claude models, where selected. | Only for Claude models |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` / `OLLAMA_TIMEOUT_MS` | Local model provider. | Only for local AI |

### Editor

| Var | Purpose | Required? |
|-----|---------|-----------|
| `NEXT_PUBLIC_UNIFIED_EDITOR` | Graduates the in-Next editor at `/edit/:id`. When unset/`false`, the dashboard "Edit" link falls back to the legacy `NEXT_PUBLIC_EDITOR_URL` (`localhost:5050/?siteId=`) standalone demo, which is dev-only and doesn't load real projects. Set `true` in dev (`.env.local`) and in prod. | Yes — without it, "Edit site" points at the dead demo |
| `EDITOR_ORIGIN` | Origin allowed to call the tRPC endpoint cross-origin. | Yes in production |
| `NEXT_PUBLIC_EDITOR_URL` | Legacy standalone-editor URL. Only read when `NEXT_PUBLIC_UNIFIED_EDITOR` is off. | No |

### Optional / partially built

| Var | Purpose | Required? |
|-----|---------|-----------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob. Only `del()` is used — uploads do not go through it. Without it, deleted assets leave orphan blobs behind; nothing user-facing breaks. | No |
| `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY` | Stock-photo search in the media library. | Only for stock search |

### Before you deploy

```bash
npm run env:check:prod     # pulls the LIVE cPanel env and checks it
```

`scripts/check-prod-env.mjs` already required `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`,
`VERCEL_CLIENT_ID` and `VERCEL_INTEGRATION_ID` — the exact vars production was
missing for months. The guard existed; nobody ever pointed it at the server. Run it.

### Where the values live

- **Dev:** `.env.local` at the repo root (gitignored). Never commit secrets.
- **Production:** the **cPanel Node.js app** environment, not Vercel. Read/write it with `cloudlinux-selector` (or the cPanel UI); the stored config is `~/.cl.selector/node-selector.json`. `cloudlinux-selector set --env-vars` **replaces the entire map** — merge with the existing keys first or you will delete `DATABASE_URL` and take the site down.
- **`NEXT_PUBLIC_*` are baked into the bundle at build time.** Setting one in the server's runtime env has no effect on the client — it must be present when `next build` runs. `.env.production.local` exists for exactly this.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review

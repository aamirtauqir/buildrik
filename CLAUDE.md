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

| Var | Purpose | Required? |
|-----|---------|-----------|
| `DATABASE_URL` | Postgres connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth session signing key | Yes |
| `SMTP_HOST` | Transactional email host (e.g. `buildrick.io`) | Yes for production |
| `SMTP_PORT` | `465` for implicit TLS (SMTPS), `587` for STARTTLS. The transport sets `secure: true` only on 465. | Yes for production |
| `SMTP_USER` | Mailbox login (e.g. `info@buildrick.io`) | Yes for production |
| `SMTP_PASS` | Mailbox password (plain). Never commit — `.env.local` in dev. | Dev; prod only if the host doesn't mangle it |
| `SMTP_PASS_B64` | Base64 of the password. **Required on cPanel/Passenger**, which pipes env vars through a shell: a `$` in the password is read as a variable and silently eaten (`^+qH$gt@…` lost `$gt` → 535 auth failure in prod while dev worked). Base64 has no shell metacharacters. Takes precedence over `SMTP_PASS`. | Yes on cPanel |
| `EMAIL_FROM` | Sender, e.g. `Buildrick <info@buildrick.io>`. Most SMTP hosts require this to match `SMTP_USER`'s domain. | Yes for production |
| `VERCEL_TOKEN` | Shared Vercel API token (legacy — being replaced by per-workspace OAuth) | Optional during OAuth rollout |
| `ENCRYPTION_KEY` | 32-byte hex (`openssl rand -hex 32`) for AES-256-GCM token-at-rest (Vercel OAuth + future integrations). Rotate by re-encrypting all rows. | Yes for Vercel OAuth flow |
| `VERCEL_OAUTH_CLIENT_ID` | OAuth integration public client id (from vercel.com/integrations/console) | Yes for Vercel OAuth flow |
| `VERCEL_OAUTH_CLIENT_SECRET` | OAuth integration secret | Yes for Vercel OAuth flow |
| `VERCEL_OAUTH_REDIRECT_URI` | Callback URL registered with Vercel (e.g. `https://app.buildrik.com/api/integrations/vercel/callback` in prod, `http://localhost:3000/api/integrations/vercel/callback` in dev) | Yes for Vercel OAuth flow |
| `NEXT_PUBLIC_UNIFIED_EDITOR` | Graduates the in-Next editor at `/edit/:id`. When unset/`false`, the dashboard "Edit" link falls back to the legacy `NEXT_PUBLIC_EDITOR_URL` (`localhost:5050/?siteId=`) standalone demo, which is dev-only and doesn't load real projects. Set `true` in dev (`.env.local`) and in prod (Vercel env) so editing actually opens the working editor. | Yes — without it, "Edit site" points at the dead demo |

`.env.local` (gitignored, repo root) holds dev values. Production values live in Vercel project env settings. Never commit secrets.

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

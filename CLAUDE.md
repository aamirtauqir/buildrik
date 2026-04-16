# Buildrik — Code Rules

## Stack

Next.js 16 (App Router, Turbopack) | React 19 | Tailwind CSS 4 | tRPC 11 | NextAuth 5 | Prisma 5 | PostgreSQL | Resend | Zod

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
- Module-level code must not throw or trigger I/O. Use lazy initialization for external clients (Resend, etc.).
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

## Design System

Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, aesthetic direction, and anti-slop rules are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md — especially: purple/violet/indigo accents (banned), default font stacks (banned), decorative AI-slop patterns (banned list in DESIGN.md).

Key constraints:
- Editor chrome is dark-only, desktop-only.
- Single accent color: cobalt `#2D6DFF` (legacy indigo/violet tokens in `themes/default.css` are being migrated out).
- Typography: General Sans (display), Inter Tight or Geist (body/UI), Geist Mono (data). No Arial/Helvetica/Roboto fallbacks.
- 4px base spacing, compact density.
- Minimal motion. No spring physics, no scroll choreography.

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

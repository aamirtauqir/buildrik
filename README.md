# Buildrik

Visual website builder. A Next.js dashboard (sites, workspaces, billing,
publishing) with the editor bundled into it at `/edit/:id`.

- **Rules and architecture:** [`CLAUDE.md`](CLAUDE.md) (stack, data flow, env
  table = deploy checklist), plus the per-directory `AGENTS.md` /
  `CLAUDE.md` files it lists.
- **Design system:** [`DESIGN.md`](DESIGN.md).
- **Specs:** [`docs/specs/`](docs/specs/) — start from
  [`docs/specs/_template.md`](docs/specs/_template.md).

## Layout

```
packages/dashboard/   Next.js 16 app (App Router) — pages, components, emails
packages/editor/      Editor (Vite for the standalone demo; bundled into Next)
packages/shared/      Transport-safe contracts (Zod schemas, API client)
server/               tRPC routers + services (business logic, Prisma access)
lib/                  Shared utilities, Prisma singleton, tRPC client
prisma/               Schema, migrations, seed
```

Runtime dependencies live in the **root** `package.json`.

## Run it from a clean checkout

Needs Node 22+, pnpm 10+, and PostgreSQL 16.

```bash
pnpm install

# 1. Database — either docker, or any local Postgres
docker compose up -d db

# 2. Env — repo root, and the Prisma CLI's copy
cp .env.local.example .env.local
#    set NEXTAUTH_SECRET:  openssl rand -base64 32
#    set DATABASE_URL if you are not using the compose database
grep '^DATABASE_URL=' .env.local > packages/dashboard/.env

# 3. Schema + seed (same commands CI runs)
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm db:seed                # QA users: qa@buildrik.local, qa-onboarding@buildrik.local

# 4. Dashboard on :3000 (the editor is inside it at /edit/:id)
(cd packages/dashboard && pnpm dev)
#    Not `pnpm --filter @buildrik/dashboard dev`: the ROOT package.json carries
#    the same name, so the filter starts a second `next dev` at the root, which
#    fails ("Couldn't find any `pages` or `app` directory") and takes both down.

# 5. Git hooks, once per clone (pre-commit fast tier + pre-push gates)
pnpm hooks:install
```

Use `prisma migrate deploy`, not `pnpm db:push` — `db push` skips the
migrations and can drop columns.

**Signing in locally.** Email login needs SMTP, which dev usually lacks. With
the dev server running:

```bash
cd packages/dashboard && pnpm exec playwright test --project=setup
```

mints a magic-link token for the seeded QA user and saves the session to
`packages/dashboard/e2e/.auth/user.json` (gitignored). Load that file as a
Playwright `storageState`, or follow the `run-dev` skill
(`.claude/skills/run-dev/SKILL.md`).

`pnpm --filter @buildrik/editor dev` serves a standalone editor demo on :5050.
It does not load real projects.

## Checks

| What | Command | Time |
|---|---|---|
| Lint, dashboard/server/lib | `pnpm lint` | ~3 min |
| Lint, editor | `pnpm --filter @buildrik/editor lint` | ~1 min |
| Typecheck (ratchet, both packages) | `node packages/editor/scripts/check-tsc-baseline.mjs` | 1–6 min |
| Unit tests, whole repo | `pnpm test` | ~14 min |
| Tests for given source files | `pnpm test:related <files>` | 2–5 min |
| DB tier (local Postgres) | `pnpm test:db` | ~1 min |
| DS + conformance gates | `pnpm --filter @buildrik/editor verify:ds` | ~3 min |
| Dashboard e2e smoke | `cd packages/dashboard && pnpm exec playwright test --project=chromium e2e/dashboard.spec.ts` | ~1 min |
| Editor style parity | `pnpm --filter @buildrik/editor test:parity` | ~3 min |

The **pre-commit** hook blocks staged secrets files, ESLints staged files and
runs their tests. The **pre-push** hook runs the DS/tsc/conformance gates. CI
(`.github/workflows/`) runs everything above. `main` is protected: CI checks
are required for pull requests, and force-push and deletion are blocked.

`pnpm lint` baselines pre-existing errors in `eslint-suppressions.json`: a new
violation fails, and `pnpm lint:prune` removes entries you have fixed.

## Deploy

Production is a cPanel Node app at `app.buildrick.io`, deployed by hand — see
`docs/cpanel-deploy.md` and `CLAUDE.md` §Server env vars. Check the live env
before deploying: `pnpm run env:check:prod`.

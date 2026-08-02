# Server Layer (tRPC + Services)

Owns all business logic and DB access for the dashboard app. Does NOT own: UI (packages/dashboard), editor engine (packages/editor), validation schema definitions (packages/shared/schemas).

## Entry Points

- `trpc/router.ts` — single router aggregation (only export consumed by the app)
- `trpc/routers/` — one router file per domain (sites, pages, media, team, billing, …)
- `trpc/trpc.ts` — context + base procedures (public/protected)
- `services/` — one service file per domain; the ONLY layer that touches Prisma or external APIs
- `auth.ts` / `auth.config.ts` — NextAuth init and providers

## Contracts & Invariants

- Flow: Page → tRPC mutation → Router → Service → Prisma/External API. Routers never touch Prisma. Services never import from routers or components.
- Services throw domain errors (`AuthError` etc.); routers catch and translate to `TRPCError`. Never swallow errors.
- Input validation: import Zod schemas from `packages/shared/schemas/` — never redefine inline.
- External clients (Nodemailer/SMTP, Stripe, OpenAI, Anthropic, Vercel) are lazy-initialized inside a getter; module-level instantiation is banned. (This line said "Resend" until 2026-08-03 — email has been Nodemailer over SMTP; `resend` is not a dependency and nothing reads `RESEND_API_KEY`.)
- Tokens at rest (Vercel OAuth, future integrations) are AES-256-GCM encrypted via `ENCRYPTION_KEY` — see `vercel-oauth.service.ts` for the canonical pattern.
- Outbound webhook URLs must pass the SSRF guard (see integrations service) before any fetch.
- Raw SQL (`$queryRaw`) must use the **physical** table name from `@@map` in the Prisma schema, not the model name.
- Non-OAuth JWTs must carry `workspaceId` — editor auth 401s without it.

## Pitfalls

- Next.js Turbopack dev server serves stale service-layer code after edits. `rm -rf .next`, restart, and verify with a `tsx` smoke script before trusting behavior.
- Run `prisma migrate status` before any DB smoke test — repo migration files ≠ applied migrations; error `42P10` means migration drift, not an app bug.
- Two Node apps share the production cPanel user — never blanket `pkill node`; filter by `/proc/PID/cwd`.

## Related Context

- Schemas: `packages/shared/schemas/`
- Consumer app: `packages/dashboard/AGENTS.md`

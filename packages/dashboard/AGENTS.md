# Dashboard (Next.js App)

Next.js 16 App Router app: marketing-free product dashboard, auth flows, settings, publish UI, and the `/edit` route that mounts the editor package. Does NOT own business logic (see `server/AGENTS.md`) or editor internals (see `packages/editor/CLAUDE.md`).

## Entry Points

- `app/` — routes: `auth/`, `dashboard/`, `edit/`, `onboarding/`, `share/`, `api/` (REST callbacks only, e.g. Vercel OAuth)
- `components/` — one folder per domain (auth, sites, billing, team, settings, publish, …); no generic dumping ground
- `emails/` — all transactional email templates (never inline HTML in services)

## Contracts & Invariants

- Data access is tRPC mutations/queries ONLY (`lib/trpc/client.tsx`). Never import `server/services/*` from a page or component.
- Components never import from `server/`. Shared types live in `lib/`.
- Path aliases: `@server/`, `@lib/`. Relative imports beyond `../` are banned.
- New domain = full vertical: `app/[domain]/`, `components/[domain]/`, router + service in `server/`, schema in `packages/shared`.
- All visual decisions go through `DESIGN.md` first. Single accent cobalt `#2D6DFF`; dashboard error/destructive red is intentional, not a violation.

## Pitfalls

- The editor is bundled into this app via `transpilePackages` — `import.meta.env` throws inside editor source when loaded here. Use the editor's `runtimeEnv.ts` helper instead.
- `NEXT_PUBLIC_*` vars are baked at build time into client AND server bundles; runtime env cannot override. Use `.env.production.local` for prod builds.
- Dev has no Resend: log in by minting a `magic_link` token with the USER ID (not email) and hitting `/auth/callback`.

## Related Context

- Server layer: `server/AGENTS.md`
- Editor package: `packages/editor/CLAUDE.md`

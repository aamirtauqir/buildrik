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
- All visual decisions go through `DESIGN.md` first. Single accent `#1A56DB` (Flowbite blue-700, hover `#1E429F`); dashboard error/destructive red is intentional, not a violation. (This line said cobalt `#2D6DFF` until 2026-08-03 — two accents out of date: `#2D6DFF` → `#406ED6` 2026-07-18 → `#1A56DB` 2026-07-30. `globals.css` has been on `#1A56DB` throughout.)

## UI system — Flowbite first

Flowbite is the dashboard's UI component system. Buttons, inputs, dropdowns,
tables, cards, modals, navigation, alerts, tabs, badges and form controls come
from `flowbite-react`. Do not hand-roll a raw-HTML control when a Flowbite
component or primitive exists for it.

Custom code is for **structure**: layout shells, page grids, responsive
wrappers, and composition. When Flowbite has no complete component for
something, build it out of smaller Flowbite primitives rather than from
scratch. Tailwind utilities handle spacing, sizing, alignment, responsiveness
and typography on top; colour, state, variant, border, shadow and interaction
values stay on the `DESIGN.md` token contract so every surface stays
consistent.

**Reach for things in this order:**

1. `components/dashboard/primitives/` — `PageHeader`, `SectionCard`, `StatCard`,
   `DataTable`, `Pill`, `ProgressBar`, `MetricValue`, `Button`, `Modal`,
   `InputField`, `FilterTabs`, `FilterChip`, `IconChip`. Screens compose these;
   they do not style surfaces directly (DESIGN.md §Dashboard).
2. `flowbite-react` directly, when no primitive covers it.
3. A new primitive **composed from flowbite-react**, when the same shape is
   needed twice. **Four** of the thirteen primitives do this — button,
   data-table, pill, progress-bar. This said "six" and listed `modal` until
   2026-08-27; `modal.tsx` names flowbite-react only in a comment explaining why
   it REJECTS it (flowbite's Modal quantises width to size steps, and the focus
   trap here is live-tested across 26 consumers). A grep for the string counts
   that comment — check the import, not the mention.

   The other nine are not a drain target. Seven have no flowbite counterpart at
   all: `page-header` and `section-card` are layout structure (which AGENTS.md
   says stays custom), `stat-card` paints entirely through an inline style
   object, `filter-chip` is a `<button aria-pressed>` where Badge is a `<span>`,
   `filter-tabs` is a controlled track where flowbite Tabs owns its panels,
   `icon-chip` computes a `color-mix` tint, `metric-value` is a span with
   `tabular-nums`. Only `input-field` has a real counterpart, and converting it
   would drop the inset-shadow hairline, the wrapper-level disabled dim, and the
   hairline-only invalid/valid states (decision log 2026-07-29).

Never a fourth option. A raw `<button>`/`<input>`/`<select>`/`<table>` in a
screen means one of the three above was skipped.

### Four things that will bite

- **Prefix depends on the package.** Dashboard app code writes UNPREFIXED
  Tailwind (`className="flex items-center gap-3"`) — that is what
  `globals.css` compiles. The `tw:` prefix exists only so flowbite-react's own
  internal theme classes compile, in a separate entry (`app/tw-flowbite.css`),
  and that entry `@source`s `.flowbite-react/class-list.json`. **That `@source`
  is ADDITIVE, not exclusive** — Tailwind v4 keeps automatic content detection
  unless you write `source(none)`, so a `tw:`-prefixed class written in a
  dashboard `.tsx` DOES compile. This bullet claimed the opposite ("writing
  `tw:flex` compiles to nothing") until 2026-08-27, and that sentence is the
  best available explanation for why 237 screens hand-rolled a `<button>`: it
  told everyone the only working override mechanism did not exist. Verified two
  ways — compiling `tw-flowbite.css` through `@tailwindcss/postcss` with a probe
  class, and measuring `tw:justify-start` winning in a live browser. The class
  list exists because flowbite's own theme strings live in `node_modules`,
  which automatic detection skips. The editor is the opposite — see below.
- **Import a new flowbite component → regenerate the class list.** Run
  `npx flowbite-react build` from `packages/dashboard`, then `rm -rf .next`.
  Flowbite's theme classes live in `node_modules`, which Tailwind never scans;
  without the regenerated `class-list.json` the component renders unstyled
  while everything still compiles green.
  **`git diff` after running it — it rewrites more than the class list.** On
  2026-08-27 it injected `@import 'flowbite-react/plugin/tailwindcss';` INSIDE
  the block comment at the top of `app/tw-flowbite.css` (inert there), DELETED
  the real `@plugin` directive that compiles the prefixed theme, and added an
  unprefixed `@import` + `@source` pair to `globals.css` — which compiles
  flowbite's classes unprefixed and masks a broken prefix. Everything still
  builds. `flowbiteStore.prefix.test.tsx` now asserts the shape of both files,
  so a red test is how you find out.
- **The prefix must be set on the CLIENT, not just the server.** flowbite reads
  it from a module singleton at render time. `components/global/flowbiteStore.ts`
  has no `"use client"` and is imported by a Server Component, so on its own it
  left every browser-rendered flowbite component emitting UNPREFIXED classes
  that this package never compiles — 23 primary buttons at contrast 1.0,
  including "New site" and the cookie banner's "Accept All". `<ThemeInit />`
  from `.flowbite-react/init.tsx` (rendered in `app/layout.tsx`) is the half
  that reaches the browser; it is CLI-generated and **must stay committed**.
- **To override a flowbite base utility, the override must be `tw:`-prefixed.**
  Dashboard app code writes UNPREFIXED Tailwind, but flowbite's own base classes
  are `tw:`-prefixed — so `<Button className="justify-start">` lands on an
  element that already carries `tw:justify-center`, twMerge cannot dedupe across
  the prefix boundary, and the computed value stays `center`. The unprefixed
  class is an orphan: present in the DOM, backed by nothing that wins. Write
  `tw:justify-start` when overriding a flowbite base, plain `gap-3` when adding
  something flowbite does not set. This is the likely reason so many screens
  hand-rolled a `<button>` instead of using the primitive — the primitive looked
  un-overridable. Measured 2026-08-27: 24 distinct button variants across 8
  screens, with the same primary action rendering at 36/40/42px tall.
- **Flowbite's default purple is not ours.** DESIGN.md bans purple/violet/
  indigo as accents. The Flowbite purple ramp is allowed for exactly two data
  uses — avatar identity tones and the PRO badge. Pass `color="blue"` (or the
  DS token) rather than accepting a flowbite default that lands on purple.
- **The editor package has the OPPOSITE import rule.** In `packages/editor`,
  importing `flowbite-react` directly is a build failure
  (`gate:chrome-ui-surface`, ERROR at 0) — editor chrome imports everything
  from `@/editor/chrome-ui` and writes `tw:`-prefixed utilities. Both packages
  resolve the same physical `flowbite-react` install and the prefix is a
  module-level singleton, which is why each app sets it explicitly at load.

## Pitfalls

- The editor is bundled into this app via `transpilePackages` — `import.meta.env` throws inside editor source when loaded here. Use the editor's `runtimeEnv.ts` helper instead.
- `NEXT_PUBLIC_*` vars are baked at build time into client AND server bundles; runtime env cannot override. Use `.env.production.local` for prod builds.
- Dev usually can't send mail (SMTP creds are prod-only; email goes through Nodemailer, not Resend — that name was wrong here until 2026-08-03). Log in by minting a `magic_link` token with the USER ID (not the email) and hitting `/auth/callback`.

## Related Context

- Server layer: `server/AGENTS.md`
- Editor package: `packages/editor/CLAUDE.md`

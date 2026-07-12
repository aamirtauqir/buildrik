# PROMPT — Complete Feature → Backend-Function Audit (single file)

Copy everything inside the fence below and run it (Claude Code / Codex / any
agent with repo access). It produces ONE markdown file mapping every existing
feature to the backend functions that power it + how each currently works.
Backend-focused (services / routers / API routes / engine), not the frontend UI.

---

```
ROLE
You are a senior engineer doing a backend audit of the Buildrik app (a visual
web-builder: Next.js dashboard + Vite editor + tRPC + Prisma/Postgres). Read the
ACTUAL code — never guess. Cite file:line for every claim.

GOAL
Produce ONE markdown file at docs/reviews/feature-backend-map.md that lists every
feature of the EXISTING app and, for each, the backend function(s) that implement
it and exactly how it currently works. This is a backend map for wireframing +
gap-finding — I want to see what runs under each feature, not the UI.

WHERE TO LOOK (read these, in this order)
- Feature inventory (the feature list): docs/reviews/feature-inventory.md
- Prior audits (do not repeat, build on): docs/reviews/2026-06-17-product-ux-audit.md,
  docs/reviews/2026-06-18-product-design-audit.md,
  packages/editor/docs/plans/2026-06-10-prd-gap-implementation.md, docs/audits/
- Server business logic: server/services/*.service.ts  (one file per domain)
- tRPC endpoints: server/trpc/routers/*.ts
- API routes / workers / SSE: packages/dashboard/app/api/**/route.ts
- DB schema: prisma/schema.prisma
- Editor engine (client-side "backend"): packages/editor/src/engine/ (Composer.ts
  + managers) and packages/editor/src/services/

THE DATA-FLOW CHAIN (how a feature is wired — trace it for each)
Page/UI → tRPC mutation/query → router (server/trpc/routers/X.ts) → service
(server/services/X.service.ts) → Prisma / external API.
For editor features the chain is: UI → Composer method → engine manager → state.
For async work: router/service → POST /api/workers/... or /api/sse/... route.

OUTPUT FORMAT
- One file: docs/reviews/feature-backend-map.md
- Group by the 17 areas in feature-inventory.md (Auth, Workspace/Team, Dashboard,
  Core Editor, Inspector, Components/DS, Content, CMS, Media, AI, Templates,
  Publishing/Domains, History/Versioning, Collaboration, Analytics/Forms,
  Settings, Billing).
- Under each area, a table with these columns:

  | Feature | Backend function(s) | How it works (data flow) | Status |
  |---------|---------------------|--------------------------|--------|

  - Feature: the user-facing capability (e.g. "Connect custom domain").
  - Backend function(s): the real symbols, as file:line — e.g.
    `domain.service.ts:connectDomain` + `site-detail.ts:domains.connect` (router)
    + `lib/vercel.ts:addDomainToVercelProject`.
  - How it works: 1–3 sentences tracing the chain — what it reads/writes, which
    table, which external API, any worker/SSE, any cache.
  - Status: one of
      WORKING   — full path exists + wired + (ideally) tested.
      PARTIAL   — works but incomplete/edge-cases missing (say what).
      STUB      — UI/route exists but the logic is fake / no-op / "coming soon".
      BROKEN    — wired but a real bug makes it fail (say how).
      NO-BACKEND — frontend-only, no server function (say what's missing).

RULES
- Read the code. Every Backend-function cell must be a real file:line. If you
  can't find a backend function for a listed feature, mark NO-BACKEND and say so.
- Be honest about STUB/BROKEN — that's the whole point. Quote the give-away line
  (e.g. a `return []`, a "Not yet available" toast, an unfilled handler).
- Note external dependencies + their env gating (Vercel token, AI key, ENCRYPTION_KEY,
  Upstash, SMTP) — mark features that silently no-op without them.
- Note async seams: workers (/api/workers/*), SSE (/api/sse/*), cron (/api/cron/*).
- End the file with a SUMMARY: counts per status + the top 10 STUB/BROKEN/NO-BACKEND
  features ranked by user impact.

START
Read feature-inventory.md first, then walk server/services/ + server/trpc/routers/
+ packages/dashboard/app/api/ + packages/editor/src/engine/. Write the file. Cite
file:line throughout. Do not write any frontend/UI detail except to name the
trigger.
```

---

## Notes
- The prompt is grounded in this repo's real layout (~30 services, 25 routers,
  engine managers) so the agent doesn't wander.
- Run target: `docs/reviews/feature-backend-map.md` (the output) sits next to
  `feature-inventory.md` (the input).
- For a lighter pass, tell the agent to cover only a few areas; for a full pass,
  let it do all 17 (it's large — expect a long run).

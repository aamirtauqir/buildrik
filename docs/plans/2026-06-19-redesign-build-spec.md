# Build Spec — Land the validated redesign into the real Buildrik app

> Status: BACKLOG (program-level epic). Authored 2026-06-19 via /spec, adapted to a
> program build-spec (not a single GitHub issue) given scale + solo-to-main workflow.
> Source of truth for target UI/IA/flows = `docs/reviews/prototype/` (108 hi-fi screens,
> codex-verified: flow/IA/friendliness 10/10, real-app-scope 10/10, app↔prototype parity
> 9.5→closed). Visual target = `docs/reviews/prototype/pt.css`. Coverage map =
> `docs/reviews/wireframes/COVERAGE.md`.

## Context

Buildrik shipped V1 (real Next.js dashboard + Vite editor + tRPC, 19 routers/~203 procs,
~55 Prisma models). The product then went through a full redesign exploration (wireframes →
hi-fi prototype) that fixed the agency wedge, the editor overcrowding, the editor↔dashboard
boundary, and added per-surface state coverage. The redesign is validated but lives only as
a prototype. This spec maps every redesign delta to the real code so it can be built
vertical-by-vertical without re-deciding anything.

**Why now:** the redesign is locked and parity-checked; the longer the real app diverges
from it, the more rework. **Done =** every prototype screen has a real, themed, wired
implementation; the 7 epics below ship and their acceptance criteria pass.

## Scope

- **In:** the IA/flow/visual deltas the prototype defines, mapped to `packages/dashboard`,
  `packages/editor`, `server/`, `prisma/`.
- **Out of scope (no build):** cron/webhooks/workers/SSE/internal-API plumbing (already
  shipped, no UI delta); `e6-cms` and `m-comments` are NET-NEW features gated behind E7
  (build last, optional); ecommerce storefront (minimal, deferred); Stripe checkout
  internals (off-screen by design).
- **MVP cut:** E0+E1+E3 ship a re-skinned, role-correct, 4-tool editor — the visible 80%
  of the redesign — without the agency Client model. E2/E4 add the agency wedge. E7 is
  net-new and can slip.

## Verified current state (audit, 2026-06-19)

| Area | Current (verified) | File / evidence | Delta class |
|------|--------------------|-----------------|-------------|
| Editor accent | cobalt `#2D6DFF` already a token | `packages/editor/src/themes/design-system/color.css:33` `--buildrick-accent` | RE-SKIN (partial done) |
| Dashboard accent | not tokenized to red `#E42313` (per DESIGN.md dashboard chrome) | `packages/dashboard/components/*`, `app/layout.tsx` | RE-SKIN |
| Editor rail | multi-tab sidebar (ai/build/component-library/elements/history/layers/media/pages/publish/settings/templates/components) | `packages/editor/src/editor/sidebar/LeftSidebar.tsx`, `editor/rail/`, `editor/shell/Topbar.tsx` | RE-IA |
| Roles | `String @default("EDITOR")` (not enum) on both member + site perm | `prisma/schema.prisma:104` (WorkspaceMember.role), `:301`/`:334` (SitePermission) | RE-IA + data |
| Agency Client node | **does not exist** — Workspace › Site direct | `prisma/schema.prisma:119` Workspace, `:166` Site (no `model Client`, no `Site.clientId`) | NET-NEW + migration |
| Invite flow | exists (auth/invite) but not branded/white-label client landing | `packages/dashboard/app/auth/invite/`, `server/trpc/routers/team.ts` | RE-IA |
| Forms config | form blocks exist; "where responses go" UI thin | `server/trpc/routers/forms.ts`, editor form block | RE-IA |
| CMS / collections | **not built** | (no collections model/router) | NET-NEW |
| Comment review | **not built** | (CollabOperation model exists for collab, not comments) | NET-NEW |

## Delta → Epic map (RE-SKIN vs RE-IA vs NET-NEW)

```
E0 Design foundation (RE-SKIN)  ─┬─> E1 Role rename (RE-IA/data)
   tokens · two-accent · fonts   │
   · state primitives            ├─> E3 Editor IA (RE-IA) ─┬─> E4 Invited-client flow
                                  │      4-tool rail        │      (RE-IA + new)
                                  │                         └─> E5 Boundary one-home (RE-IA)
                                  ├─> E2 Agency layer (NET-NEW + migration)
                                  │      Client model · m-agency · white-label · push
                                  └─> E6 State coverage (RE-SKIN, anytime)

E7 NET-NEW features (CMS collections, comment review) ── build last, optional
```

**Sequencing rationale:** E0 first — everything re-skins on the token layer, so building it
once avoids re-theming each vertical. E1 (role rename) is small but cross-cutting (touches
every permission check + label); do it early so later epics use the final role names. E2's
Client model is a data-migration foundation the agency screens depend on. E3 (editor IA) is
independent of E2 and can run in parallel. E4 depends on E1 (Content-editor role) + E2
(white-label) + E3 (client-mode chrome). E5 depends on E3 (rail). E6 anytime. E7 last.

---

## E0 — Design foundation: two-accent tokens, fonts, state primitives  [RE-SKIN]

**Goal:** make `pt.css` real in both packages. Editor already cobalt; add dashboard red +
slate light theme + Inter Tight/General Sans/Geist Mono + reusable state primitives
(Empty/Loading/Error/Denied) so every later vertical composes them.

| File | Change |
|------|--------|
| `packages/editor/src/themes/design-system/color.css` | confirm cobalt accent + slate surfaces match DESIGN.md (verify, mostly done) |
| `packages/dashboard/app/globals.css` (or theme entry) | add `--accent:#E42313` (dashboard) + slate surface/border/text tokens, Inter Tight |
| `packages/dashboard/` font loader | load Inter Tight + Geist Mono (Bunny/Google), General Sans (Fontshare) per DESIGN.md |
| `packages/*/shared/ui/` | new `EmptyState`, `LoadingSkeleton`, `ErrorState`, `DeniedState` primitives (from prototype `80-states` / `s-*-states`) |

**Acceptance:** (1) dashboard primary CTAs render red `#E42313`, editor render cobalt
`#2D6DFF`; (2) no `system-ui`/Arial/Roboto in either package (grep clean); (3) the 4 state
primitives exist and render the prototype's empty/loading/error/denied. **Effort:** ~3h
dashboard tokens + 2h fonts + 4h primitives. **Risk:** existing dashboard components may
hardcode colors — grep + sweep. **Rollback:** revert token file.

## E1 — Role rename to "Content editor"  [RE-IA + data]

**Goal:** the role a client gets is named **Content editor** (capability-named), not
"Client"/"Editor"; "Client" only means the company/account node.

| File | Change |
|------|--------|
| `prisma/schema.prisma:104,301` | role default/value: `EDITOR` → `CONTENT_EDITOR` (string); migration to update existing rows |
| `prisma/migrations/` | data migration: `UPDATE "WorkspaceMember"/"SitePermission" SET role='CONTENT_EDITOR' WHERE role='EDITOR'` |
| `server/trpc/routers/team.ts`, `server/services/*` | role constants/enums, permission checks |
| `packages/shared/schemas/` | role Zod enum (SSOT) |
| `packages/dashboard/components/team/*`, settings, invite UI | role labels → "Content editor" |
| `packages/editor/` role-gated UI | labels + `?view=client` seed |

**Acceptance:** (1) role enum is `Viewer | Content editor | Designer | Admin` end-to-end
(schema → tRPC → UI); (2) no UI string shows "Client" as a *role* (only as account node);
(3) existing members migrated, no orphaned `EDITOR` rows. **Effort:** ~2h schema+migration +
3h sweep. **Risk:** role string compared in many places — grep `'EDITOR'` exhaustively;
**data migration is one-way** (add rollback SQL). **Dep:** none (do early).

## E2 — Agency layer: Client node, m-agency, white-label, shared-theme push  [NET-NEW + migration]

**Goal:** introduce `Workspace › Client › Site`, the m-agency dashboard, client grouping,
white-label branding, shared-theme push, duplicate-as-template.

| File | Change |
|------|--------|
| `prisma/schema.prisma` | NEW `model Client` (workspaceId, name, branding); add `Site.clientId` (nullable for solo) |
| `prisma/migrations/` | create Client table + backfill (solo sites → null clientId; no data loss) |
| `server/trpc/routers/` | NEW `clients.ts` (list/create/duplicate); extend `sites.ts` (group by client), `team.ts` (per-client invite) |
| `packages/dashboard/app/dashboard/` | m-agency Clients view; sites list grouped by client; `18-workspace` branding + share-defaults |
| `server/services/workspace-settings.service.ts` | white-label branding (logo/domain/hide-Buildrik) + `WSSharingSettings` |
| `packages/editor/.../design-system/` | shared-theme "push to workspace/sites" + per-site override (maps `m-ds-push`) |

**Acceptance:** (1) a workspace with clients shows the Clients layer; a solo workspace
collapses to a flat Sites list (no empty agency chrome); (2) duplicate-as-template stands up
client N+1 (pages+theme copied, content cleared); (3) white-label: an invited client sees
agency brand, never "Buildrik". **Effort:** ~6h schema+migration + ~12h UI + ~6h push.
**Risk:** `Site.clientId` nullable + every site query must handle null (solo); shared-theme
push partial-fail must be per-site (see prototype `m-ds-push`/`s-account-states`).
**Dep:** E0, E1.

## E3 — Editor IA: 4-tool rail, AI assistant, structure popover, density setting  [RE-IA]

**Goal:** collapse the 11-tab rail to **4 structural tools** (Insert · Pages · Styles · Site);
AI becomes a separate ✨ assistant panel (not a rail tab); page structure moves to a footer
⌗ popover; density (fewer/full controls) becomes a per-user setting seeded by role, not an
editor toggle.

| File | Change |
|------|--------|
| `packages/editor/src/editor/sidebar/LeftSidebar.tsx`, `useSidebarState.ts` | rail = 4 tools; fold ai/build/templates/components/layers/history into Insert/Pages/Styles/Site or the assistant |
| `packages/editor/src/editor/rail/` | 4-button rail; remove tab buttons for folded tabs |
| `packages/editor/src/editor/shell/Topbar.tsx` | add ✨ Ask AI button + `👁 Client view`; Publish↔"Send for review" by role; structure → footer status bar |
| NEW `packages/editor/.../AiAssistant*` | separate assistant panel (edits whole design + insert) |
| NEW footer status bar + `StructurePopover` | ⌗ floating page-outline (z-index), not a fixed left panel |
| `UserPreference` model + account settings | density per-user (fewer/full), seeded by role; `?view=client` reads it |

**Sequence (prior learning `media-command-layer-before-ui`, 10/10):** engine currently mutates
elements directly in hooks/canvas — **stabilize the mutation/command contract FIRST**, then
re-IA the rail on top of it (folding 11 tabs onto ad-hoc mutations risks inconsistent undo).
**Density (prior learning `density-minimums-for-inspector`, 10/10):** inspector rows = 32px /
comfortable (Saqib flagged 24-26px as too congested); comfortable wins over DESIGN.md compact.
Add (6) to acceptance: undo unchanged through the command layer; (5) becomes a per-folded-tab
integration parity test.

**Acceptance:** (1) rail shows exactly 4 tools; (2) AI is a top-right assistant, not a rail
tab; (3) structure opens from the footer ⌗ as a floating panel; (4) density is set in
account settings, not toggled in the editor chrome; (5) all folded tabs' functions still
reachable (no feature loss). **Effort:** ~16h (the biggest RE-IA). **Risk:** folding 11 tabs
without dropping capability — map every current tab action to its new home first; **do not
delete** engine features, only re-route UI. **Dep:** E0.

## E4 — Invited-client flow: branded accept + client-mode editor + approval  [RE-IA + new]

**Goal:** the missing client first-run — branded landing (a9) → accept (new/existing) →
client-mode editor (`?view=client`, fewer controls, "Send for review") → approval gate.

| File | Change |
|------|--------|
| `packages/dashboard/app/auth/invite/` | branded (white-label) invite-accept landing + new/existing-account paths (a9) |
| `packages/editor/.../shell` | `?view=client` → simple mode, hide agency escape-hatches, Publish→"Send for review" |
| `server/trpc/routers/` | approval gate: client edits → review → publish (extend publish/team) |
| `packages/dashboard/.../approval` | agency review-diff → approve/reject UI (m-approval) |

**Acceptance:** (1) invited client lands on agency-branded sign-in (never Buildrik); (2)
existing email joins, no duplicate account; (3) client lands in client-mode editor with no
agency chrome; (4) "Send for review" routes to the approval queue; approve→publish;
(5) **SERVER-SIDE GATE** — a Content-editor role POSTing `publish` (or any Designer-only
mutation) directly gets 403 from tRPC, regardless of UI. `?view=client` hiding chrome is
cosmetic only; SitePermission must enforce. **Effort:** ~10h. **Risk:** **UI-hiding is NOT a
security gate** (prior learning `ui_disable_not_security_gate`, 10/10 — billing.upgrade stayed
callable via direct POST) — every client-mode restriction needs a matching server precondition,
exploit-tested directly, not just the button. White-label auth domain handling; approval state
machine. **Dep:** E1, E2 (white-label), E3 (client-mode chrome).

## E5 — Editor↔dashboard boundary: one home per concept  [RE-IA]

**Goal:** each feature has one home (SEO content→editor, technical SEO→dashboard; analytics
view→dashboard, assign→editor; forms config→editor, inbox→dashboard; assets→dashboard,
picker→editor). Add the real forms-config surface.

| File | Change |
|------|--------|
| `packages/editor/.../settings` (Site tab) | SEO content, forms config, tracking-assign live here |
| `packages/dashboard/.../site-detail` | technical SEO, analytics reports, forms inbox, domains here |
| NEW forms-config surface | fields · recipient · integration · after-submit · spam (maps prototype `forms-config`) |

**Acceptance:** (1) no concept has two edit homes; (2) mirrors deep-link (never 404); (3)
forms "where responses go" is a real surface, not the generic block picker. **Effort:** ~8h.
**Risk:** moving surfaces without breaking deep links — add redirects. **Dep:** E3.

## E6 — Per-surface state coverage  [RE-SKIN / completeness]

**Goal:** every list/page renders empty/loading/error/denied (compose E0 primitives) — the
prototype's `s-*-states` boards become real on `12/14/19/53`, editor, media, forms, ship.

**Acceptance:** every primary surface has all four states; no silent failure, no white
screen, no fake data on disconnect. **Effort:** ~8h. **Risk:** low. **Dep:** E0. (Anytime.)

## E7 — NET-NEW features (build last, optional)  [NET-NEW]

- **CMS / Collections** (prototype `e6-cms`): new `Collection`/`CollectionEntry` models,
  dynamic-page template binding, pattern SEO. Large; its own arc. **Effort:** ~3-5 days.
- **Client comment review** (prototype `m-comments`): Viewer pins change-requests on the
  preview without canvas access; agency resolves. New `Comment` model + preview overlay.
  **Effort:** ~2-3 days.

**Gate:** do not start until E0-E5 ship; these are net-new product scope, not redesign parity.

## Do NOT touch (verified-correct, regression risk)

- Engine: Composer/history/undo invariants, sanitize boundary (`packages/editor/src/engine`).
- tRPC data-flow chain (Page→Router→Service→Prisma); collab OT (demo-blocked, leave).
- Vercel OAuth + publish worker pipeline (shipped, working).
- Existing auth/2FA/magic-link backend.

## Feature flags & rollback (eng-review decision 2026-06-19)

**No runtime flag infra exists today.** NEXT_PUBLIC env vars are build-time baked (no 60s
rollback — prior learning `flag_mechanism_next_public_is_buildtime`). Decision: build a small
**DB-backed flag** for the two riskiest epics.

- NEW `model WorkspaceFeature { workspaceId, key, enabled }` (E0). Keys: `agency_layer` (E2),
  `client_mode` (E4). Server reads it per request; kill-switch = `UPDATE` one row (instant,
  runtime). Ship E2/E4 dark; enable for one test workspace first, then roll forward.
- E1 (role) + E2 (Client model) are the only **data migrations**. Each ships with: forward
  migration, verified backfill (no row loss), and a documented reverse SQL. Run
  `prisma migrate status` before/after; psql smoke per the migration-status learning.
- All UI-only epics are revert-by-commit on solo-to-main (rollback = redeploy, minutes — fine
  for UI; the DB flag covers the data/behavior-risky E2/E4).

## Definition of done (program)

1. Every prototype screen has a real implementation, themed per DESIGN.md two-accent.
2. Role enum = Viewer/Content editor/Designer/Admin end-to-end; no "Client" as a role.
3. Agency Client layer works; solo collapses cleanly; white-label verified.
4. Editor rail = 4 tools; no capability lost vs the 11-tab version.
5. Invited-client flow works end-to-end (branded → client-mode → approval).
6. Boundary: one home per concept, mirrors never 404.
7. Every surface has empty/loading/error/denied.
8. Migrations applied + verified; do-not-touch areas unchanged; suites green.

## Test plan (vitest — added by eng-review)

| Epic | Critical test | Kind |
|------|---------------|------|
| E1 role | migration backfill leaves 0 orphan `EDITOR` rows; role enum end-to-end | unit + migration |
| E2 client | solo site queries return correctly with `clientId=null` (audit every site query in `dashboard.ts`/`site-detail.service.ts`/`page.service.ts`/`share-link.service.ts`) | unit |
| E2 flag | `WorkspaceFeature` toggle flips agency layer on/off per workspace at runtime | integration |
| E4 client-mode | **CRITICAL [→E2E]** — Content-editor role POSTing `publish`/Designer-only mutation directly → 403 from tRPC, UI bypassed (exploit-test, not button) | E2E |
| E3 rail | per-folded-tab integration parity: every old tab action still reachable; undo unchanged | integration |
| E0 | dashboard CTAs red `#E42313`, editor cobalt `#2D6DFF`; no banned fonts; 4 state primitives render | unit/snapshot |

Run `npm test` (vitest, root + `packages/editor`). Regressions (E1 role checks, E3 undo) are
CRITICAL — write before the change.

## Next

Build order E0 → E1 → (E2 ∥ E3) → E4/E5 → E6 → E7. Recommend starting with **E0+E1** (fast,
unblock everything) then **E3** (the visible editor win). E0 now includes the `WorkspaceFeature`
DB flag (per eng-review). Codex/ChatGPT-Plus daily cap currently hit — the optional codex
quality-gate on this spec is deferred.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | (redesign already CEO-reviewed upstream) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open→folded | 6 findings (3 P1 from prior learnings), all folded into spec |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | (prototype already 10/10 IA/friendliness) |

- **OUTSIDE VOICE:** codex/ChatGPT-Plus daily cap hit → skipped; self-adversarial pass run inline (surfaced the 3 prior-learning landmines: NEXT_PUBLIC build-time flags, UI-only security gate, command-layer-before-UI).
- **Findings folded:** (1) flag/rollback → DB `WorkspaceFeature` (user decision); (2) E4 client-mode server-side gate; (3) E3 command-layer-before-rail + 32px density; (4) E2 `clientId` null-audit; (5) test plan added; (6) E0 DRY shared-token layer.
- **VERDICT:** ENG CLEARED — spec hardened, ready to implement starting E0+E1. Run /plan-design-review only if E3 editor visuals drift from the prototype.

NO UNRESOLVED DECISIONS

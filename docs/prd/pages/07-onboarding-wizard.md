# Onboarding Wizard (M2)

> **Routes:** `/onboarding` (dispatcher) · `/onboarding/role` · `/onboarding/setup` · site-creation branch via `/dashboard/sites/new`
> **Source:** `app/onboarding/*` · `server/trpc/routers/onboarding.ts` · `server/services/onboarding.service.ts` · schemas `packages/shared/schemas/onboarding.ts`

## Overview
Post-signup wizard that captures how the user wants to work and gets them to a first site. State machine per user (`OnboardingState`, created at signup):

`ROLE_SELECT → PROJECT_SETUP → SITE_CREATION → (EDITOR_TOUR: dead) → CHECKLIST → COMPLETED`

Entry: `/auth/redirect` and `/onboarding` both resolve the current step and navigate there. Middleware only enforces authentication — an incomplete user isn't force-marched into the wizard; routing is client-side.

## Step 1 — Density (`/onboarding/role`)

| Field | Type | Options | Rule |
|---|---|---|---|
| Experience density | radio cards | **Simple** (`fewer`) / **Advanced** (`full`) | Must pick to continue; "Skip — start Simple" picks `fewer` |

- **API:** `onboarding.selectRole {density}` → writes `UserPreference.editorDensity` (the editor actually consumes this) + advances step.
- Naming wart: the DB field is `role` but stores density — not a persona (gaps register).

## Step 2 — Project setup (`/onboarding/setup`)

| Field | Type | Options / rule |
|---|---|---|
| Workspace type | toggle | `solo` (default) / `agency` — agency only flips the `agency_layer` feature flag; **it does not create a workspace** |
| Project name | text | 2–100 chars (client + server) |
| Build method | cards | `ai` (marked Recommended) / `template` / `blank` |

- **API:** `onboarding.setupProject {projectName, method}` → advances to SITE_CREATION.
- Back → step 1. No skip.

## Step 3 — Site creation (branch, no dedicated route)
- **blank** → `sites.create {method:"blank"}` → straight into the editor.
- **template** → `/dashboard/sites/new?method=template` → gallery (categories: ALL/PORTFOLIO/BUSINESS/BLOG/AGENCY/ECOMMERCE/RESTAURANT · sort popular/newest/alphabetical · 6 per page) → preview → `templates.use {templateId, siteName}`.
- **ai** → `/dashboard/sites/new?method=ai` → 3-step wizard: business type (6 chips) → pages (1–8, Home locked) + tone (6) / content (3) / images (3) / description ≤500 → generate (`templates.generate.create`), 2 s status polling → editor.
- Guards: site limit (FREE 3 / PRO 15 / BUSINESS 50) · AI monthly (FREE 3 / PRO 20 / BUSINESS unlimited) → credits modal · AI hourly anti-abuse 3/workspace/hour.
- **None of the three paths advances the step.** Progression relies on read-repair: next `getState` sees a live site and jumps to CHECKLIST. Works, but fragile (create-then-delete strands the user in SITE_CREATION `[TBC]`).

## Known defects (gaps register)
- Sidebar shows 3 dots (Role · Setup · Create) but the Create dot points to `/onboarding/create` — a route that **does not exist**; the third dot can never complete.
- `EDITOR_TOUR` state is unreachable (read-repair skips it); `tourStep/tourCompleted/editorTasks` columns are dead.
- `onboarding.completeStep` mutation has zero UI callers — live dead endpoint.
- Wizard uses Space Grotesk against the repo's stated type system — token drift.
- v3 spec (2026-07-04) describes client quick-add, path-chooser thumbnails, AI style-token pick, result-choice, member-first-run — **all spec-only, none built**. Treat the spec as the design target, this doc as ground truth of what exists.

## Page relationships
- **In:** `/auth/redirect`, `/auth/workspace-select` ("create new" — mislabeled).
- **Out:** editor (all three creation paths), `/dashboard` (completed/dismissed).

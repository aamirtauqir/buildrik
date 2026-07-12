# Reverse-wireframe inventory — Buildrik backend vs frontend

**Date:** 2026-06-22
**Method:** [L12 reverse-wireframe](../learning/product-design/lessons/0012-reverse-wireframe-the-backend.html) — read every backend router, find which frontend file consumes it, mark the gap.
**Evidence:** static (grep of `trpc.<router>.` in `packages/dashboard` + editor `client.<router>.` services). No live browse yet.

---

## Headline finding

**Zero router-level Ghosts.** Every one of the 25 backend routers has at least one real frontend consumer. The half-wiring users complained about ("backend exists but not integrated," "no success/error feedback") is **not missing screens** — it's missing **states + feedback inside surfaces that already exist.**

That reframes the worklist: not *"build 10 ghost screens"* but *"complete the states + feedback on the surfaces already wired."* This is exactly what recovery **Phase 1 (feedback layer)** and **Phase 3/4** target — confirmed, not assumed.

**Honesty limit:** static evidence proves a surface *exists*. It cannot prove all states are present or wired to real data. So the Ghost / Half / Wired split below resolves Ghost confidently; the **Half-vs-Wired call needs a live state-audit** (recovery Phase 4). See [`audit-by-file-presence unreliable`] lesson — file presence ≠ working UI.

---

## The inventory (25 routers)

| # | Capability (router) | Backend can do | Frontend consumer (evidence) | Surface verdict |
|---|---------------------|----------------|------------------------------|-----------------|
| 1 | `sites` | create / list / manage | dashboard list (22 files) | **Wired** |
| 2 | `siteDetail` | per-site settings + status | site detail (11) + editor | **Wired** |
| 3 | `account` | profile / workspace / danger-zone | account UI (26) | **Wired** |
| 4 | `auth` | login / 2FA / magic-link | auth pages (15) | **Wired** |
| 5 | `team` | members / invites / roles | team settings (11) | **Wired** |
| 6 | `dashboard` | activity / health feed | dashboard home (10) | **Wired** |
| 7 | `onboarding` | first-run state machine | onboarding flow (8) | **Wired** |
| 8 | `features` | workspace feature flags | gating (8, internal) | **Wired** |
| 9 | `billing` | subscription / invoices | billing screen (7) | **Wired** |
| 10 | `upload` | signed upload + pending | upload flow (7) | **Wired** |
| 11 | `templates` | templates + versions | template picker (6) | **Wired** |
| 12 | `help` | articles + tickets | help surface (6) | **Wired** |
| 13 | `forms` | form blocks + **submissions** | `overview-tab.tsx` → `SubmissionDrawer` + `listSubmissions` + pagination | **Wired** ← *corrected from a "Ghost" guess* |
| 14 | `notifications` | notifications + prefs | `notification-dropdown.tsx` + `notification-page.tsx` | **Wired** |
| 15 | `cms` | collections + entries + sync | editor `cmsSync.ts` (full CRUD) + `BindingPopover.tsx` | **Wired** |
| 16 | `ai` | generate / set-token / set-image | editor Ask-AI `streamPrompt` | **Wired** |
| 17 | `pages` | create / order / dynamic | editor `client.pages.list` + page panel | **Wired** |
| 18 | `actions` | AI privileged propose→confirm | editor `useAiActionGate.ts` | **Wired** |
| 19 | `media` | assets / folders / versions | editor `client.media.*` + dashboard (3) | **Wired** |
| 20 | `reviews` | send site for client review | `review-queue.tsx` (1 surface) | **Half — verify** |
| 21 | `comments` | threaded comments | `comment-queue.tsx` + `comment-preview.tsx` | **Half — verify** |
| 22 | `clients` | agency → client records | 4 consumers | **Half — verify** |
| 23 | `theme` | capture + push shared theme | `/dashboard/theme` (3) | **Half — verify** |
| 24 | `integrations` | Vercel OAuth + integrations | settings (2) | **Half — verify** |
| 25 | `apiTokens` | create / revoke tokens | settings (1) | **Half — verify** |

---

## The worklist (what to wireframe)

No Ghosts → no net-new screens needed. The work is **state + integration completion** on the 6 "Half — verify" rows, plus a live state-audit of the 19 "Wired" rows to catch missing empty/loading/error states.

**Order (by user pain, refine after live walk):**

1. **`reviews` + `comments`** — the agency↔client review loop is the core differentiator and thinnest (1–2 surfaces each). Highest leverage. Wireframe: request → notify → client view → comment → approve/changes, all states.
2. **`clients`** — the agency "Client" layer (long-flagged as under-built). Confirm it's a real object in the UI, not just records.
3. **`theme` / `integrations` / `apiTokens`** — settings-tier; confirm states (empty / connecting / error / success).
4. **Live state-audit of the 19 Wired rows** — recovery Phase 4: walk each, mark which lack empty/loading/error (the real "no feedback" complaint).

---

## Sequence from here (per L12)

1. ✅ Inventory the backend → **done (this doc)**
2. ⬜ Wireframe each Half gap — [handoff](../learning/product-design/lessons/0004-design-to-build-handoff.html) + [all states](../learning/product-design/reference/states-checklist.html)
3. ⬜ Draft the redesign plan from those wireframes
4. ⬜ **Then** pressure-test it — `plan-design-review` + `plan-ceo-review`
5. ⬜ Build via the [5-rung ladder](../learning/product-design/reference/definition-of-done.html); re-test the job

Template: [`reverse-wireframe-inventory.html`](../learning/product-design/reference/reverse-wireframe-inventory.html).
Feeds: [recovery roadmap](buildrik-recovery-roadmap-20260621.md) Phase 3–4.

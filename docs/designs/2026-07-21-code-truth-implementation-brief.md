# Code-truth implementation brief — build from this, not the stale specs

> **Written 2026-07-21.** The design is done (308 Figma frames, 56-screen spec,
> J5 wireframes, S5.5 prototype). It is **not** the blocker. The blocker is that
> the screen specs describe a product state that no longer matches the code —
> in both directions. Some things the specs call "missing" already exist; some
> things the specs draw as working are stubs. Engineering built from the specs
> alone will chase the wrong work.
>
> This file is the reconciliation: **spec vs what the code actually does today**,
> journey by journey, cited. It supersedes the "Features (verified)" and
> "architecture reality" claims in `docs/prd/editor/14-screen-specs.md` wherever
> they disagree. Every claim here was checked against the repo on the day it was
> written (codex read the files; the four load-bearing ones were re-grepped).

---

## 0. What is already shipped (this session, on `main`, not deployed)

Do **not** re-build these — they exist and are verified:

| Thing | Commit | Evidence |
|---|---|---|
| `agency_layer` flag has a UI toggle (workspace settings) | `bcded8e1`,`e0963448` | `packages/dashboard/components/settings/agency-layer-toggle.tsx` |
| Review-loop gate + token + identify + approve, end-to-end | (existing) | verified live 5/5 vs dev DB |
| `clientEmail` wired through send-for-review | `d147664d` | `ReviewService.ts`, `Topbar.tsx` |
| **M2** review page shows the site frozen at send (sandboxed iframe) | `c6897bd7` | `review-client.tsx:115` `SitePreview`, `ReviewRequest.snapshotPages` JSONB |
| **M3** a DESIGNER may publish (both surfaces), gated by approval not role | `688bf2b9` | `sites.ts:272→EDITOR`, `ai-actions.service.ts`, `APPROVAL_EXEMPT_ROLES={OWNER}` |
| **M4** editor chrome accent → `#406ED6` | `dcc7b165` | `color.css --buildrick-accent` |
| Concurrency guard: one PENDING review per site | `dd66a51d` | partial unique index `review_requests_pending_unique` |

Prod caveat: **none of the review schema is deployed to prod** (prod ledger stops at
`workspace_apps`, `review_requests` is the old shape, `reviewers` table absent,
`workspace_features` empty). Prod runs an old build. All the above is local-only.

---

## 1. Journey-by-journey code truth

Legend: **EXISTS** (ship it) · **PARTIAL** (backend or half the UI exists) ·
**MISSING** (nothing) · **STUB** (drawn/typed but faked in code) ·
**CONTRADICTS** (spec assumes something the code cannot do).

### J1 · Discover & onboard — PARTIAL
- Onboarding checklist + orchestrator: **EXISTS** (`onboarding/OnboardingMount.tsx`, `useOnboardingOrchestrator.ts`).
- RecoveryManager (crash/unsaved restore): **EXISTS** in engine (`engine/recovery/RecoveryManager.ts`); the shell **recovery banner** UI (C6) is not surfaced — BUILD.
- New-page choice (S1.3) routing to a real AI branch: **CONTRADICTS** — the `PageWizard` is `@deprecated DEAD/SIMULATED` (`wizard/PageWizard.tsx:1` — no model called, static templates, setTimeout steps). Cut it or wire it to real generation (see J2).
- S1.5 shell-level load-error screen: **MISSING** — build.

### J2 · AI-draft — PARTIAL / CONTRADICTS-CODE  ⚠ biggest design-vs-reality gap
- Edit-AI (`AITab`, per-element + page-scope, agent plan/approve, diff accept/reject): **EXISTS + hardened** (`sidebar/tabs/ai/AITab.tsx`).
- **Whole-site AI draft (S2.1 brief → S2.2 generating → S2.3 result): STUB.** `ai/index.ts:8` — "AIPageGenerator, AIContentPanel, AICodeEditor are L0 stubs (not yet implemented)." There is **no** whole-site generation.
- **Decision required before drawing/coding S2.1–S2.3 as real:** build whole-site generation (a real server AI job → ProjectData) or cut the journey to edit-AI only. Building the screens against the stub is a dead end.

### J3 · Build the page (canvas) — EXISTS, secondary holes
- Core: Composer + ~25 managers, canvas drag/select/resize, 48 element types, inspector, layers, pages, media, Insert/blocks: **EXISTS** (`engine/Composer.ts`). The spec's J3 is well-grounded here.
- Command palette (S3.14): **PARTIAL** — two hardcoded palettes bypass the `CommandCenter` registry (39 registered commands unread). Unify → registry-backed.
- Data/CMS (S3.12/S3.12b): **PARTIAL** — engine exists (`DataManager`, `CMSBindingManager`, `BindingPopover`) but no discoverable front-door UI. Give it a rail entry.
- FIXes the spec already names (real, low-risk): zoom implemented 3×, InteractionRuntime preview≠published, reset-to-master path scheme.

### J4 · On-brand — PARTIAL
- Single-site design system (14 token kinds, 94 tokens, presets, starters, lint, dark preview): **EXISTS** (`editor/design-system/`).
- **Cross-site brand push (S4.7): backend-capable, NO editor UI.** `theme.service.ts` supports it; nothing surfaces it. This is the "2nd wedge" — it's a real build, not a wire-up.
- Figma export (S4.5): **STUB** — `ExportSection.tsx:178` is an envelope, no real export. Build or cut; don't ship as "works."

### J5 · Client sign-off (the wedge) — PARTIAL, and the specs are STALE here
The `14-screen-specs.md:341` "architecture reality" block says the external review
surface is **missing**. **That is now false.** What exists:
- `ReviewRequest` + `Reviewer` + token + `invitedEmail` + **frozen `snapshotPages`**: **EXISTS** (`prisma/schema.prisma`).
- Public token API (`getReviewByToken`/`identify`/`approve`/`requestChanges`): **EXISTS** (`client-review.service.ts`, `client-review.ts:62`).
- `/review/<token>` page that renders the frozen site, identifies, comments, approves: **EXISTS** (`review-client.tsx`).

The **real** J5 gaps (what to actually build):
1. **[P1] Stale-approval / post-approval-edit tracking (S5.6): MISSING.** `isPublishBlockedByApproval` only checks `latestReviewStatus !== "APPROVED"` (`publish-approval.ts:45`) — it does **not** detect edits after approval. So "approved" silently covers later changes. This is the wedge's core trust promise (contracts §1.5) and it is unbuilt.
2. **[P1] Public client commenting is plain-note, not pinned/threaded.** `review-client.tsx:311` posts `{token, body}` only — no pin coords/`targetSelector`, though the backend + `Comment` model support pins (`client-review.service.ts:213`). Decide: v1 = plain notes (ship now) or pins (build the pin UI).
3. **[P1] Editor review-status pill/bar (S5.2, 6 states): MISSING.** `Topbar` only has `reviewState: idle|sending|sent|error` (`Topbar.tsx:192`) — the send flow, not the status (pending / opened-not-acted / changes-requested / approved / approved-edited-since). Build the pill.
4. Editor-side comment mode + thread list (S5.3): drawn, not built in editor.
5. Whole surface still gated by `agency_layer` (default-off) — turn on for pilot (toggle now exists).

### J6 · Ship & run — PARTIAL
- Publish (BYO-Vercel, 7-check prechecks, worker): **EXISTS**. DESIGNER-publish now aligned (M3).
- **Stale-approval ignored at publish** — same [P1] as J5.1.
- Settings that **over-promise live behavior**: Redirects / Headers / Localization **persist but are not enforced** — the deploy worker only consumes rendered pages (`workers/publish/[jobId]/route.ts:63`), it does not apply these. The design must label them "saved, not live" (some frames already do). Same for custom-code plan-gate (N1 id mismatch).

---

## 2. The stub / storage-only honesty list (don't ship as "works")

| Feature | State | Where |
|---|---|---|
| Whole-site AI draft | STUB (L0) | `ai/index.ts:8`, `PageWizard.tsx:1` |
| Figma token export | STUB (envelope) | `ExportSection.tsx:178` |
| Redirects / Headers / Localization | saved, NOT enforced live | `site-settings.service.ts`, worker `route.ts:63` |
| Cross-site brand push | backend only, no UI | `theme.service.ts` |
| Post-approval stale tracking | MISSING | `publish-approval.ts:45` |
| Client pinned comments | backend yes, UI no | `client-review.service.ts:213` vs `review-client.tsx:311` |

---

## 3. Build order (settle these first, then code)

1. **Refresh the J5 + J2 spec claims** — this doc is that refresh; propagate the two
   corrections into `14-screen-specs.md` so nobody chases already-built J5 work or
   builds S2.x against the AI stub.
2. **J5 first (the wedge):** stale-approval tracking (§1.J5.1) → review-status pill
   (§1.J5.3) → decide pins-vs-notes (§1.J5.2). Then flip `agency_layer` for the pilot.
3. **J2 decision:** build whole-site generation, or cut the journey to edit-AI. Do not
   draw/code S2.1–S2.3 until this is decided.
4. **J6 honesty:** label saved-not-live settings; don't enforce-fake.
5. Everything else (J3 secondary FIXes, J4 brand-push UI, Figma export) is post-wedge.

**Bottom line:** the design is safe to implement *once the specs are reconciled to code
and the J2/J5 decisions are made.* The wireframes/prototypes/UI are not the gap — the
code-truth is. Build J5's real gaps (stale-approval, status pill), decide J2, and the
rest is assembly.

---

## 4. Addendum — 2026-07-22 three-way audit (PRD ↔ Figma ↔ code)

Full-file audit + fix pass run 2026-07-22 (Figma `g4GzQFqzNYz5sosz1QtZXC`). Figma-side
defects were fixed in the file (Badge contrast at component source, ~68 semantic
prototype rewires, publish/gate backdrop, S6.4 dirty state, hidden `Integrations · some`
board, S2.2 streaming/cancel, VIEWER permissions board, dashboard-spine page). The
following are the **code-side** findings — engineering items, cited and re-checkable:

1. **Bulk publish still gates ADMIN** (`sites.ts:177` `minRole` map) while single
   `sites.publish` is EDITOR (`sites.ts:282`, M3). Contract §2 says a DESIGNER may
   publish; the bulk path contradicts it. Also the comment at `publish-approval.ts:6-9`
   still assumes "sites.publish already requires ADMIN+" — stale since M3.
2. **`templates.applyToSite` has no role gate** (`templates.ts:52-56` —
   protectedProcedure + workspace-scoping only). It replaces every page on a site;
   contract §2 puts destructive actions at ADMIN+. The Figma permissions boards now
   document the intended admin-only rule.
3. **VIEWER role exists in code** (`lib/constants/enums.ts:7`, rank 0 in
   `permission.service.ts:4`) but is absent from contracts §2's 4-role model. Figma now
   carries a "Permissions — signed in as a VIEWER" board; contracts §2 should either
   adopt VIEWER (read-only, never a gate target) or code should stop offering it.
4. **§1.J5.3 "review-status pill MISSING" is now PARTLY STALE:** `Topbar.tsx` has a
   `reviewStatus`/`REVIEW_PILL` pill (L43/L215) beyond the send-state — but it renders
   only in `viewMode.clientView` (L430-451). Remaining real gap: the designer-facing
   6-state pill (S5.2). Narrower than §1.J5.3 claims.
5. **§1.J5.2 partly stale too:** `addComment` accepts and stores pin fields
   (`{ body, pageId?, x?, y?, targetSelector? }`, `client-review.service.ts:222-240`)
   and the UI wires `clientReview.comment` (`review-client.tsx:318`). The
   pins-vs-plain-notes decision is still the founder's, but the backend/UI seam is
   closer to pins than this brief said.

### §4.1 Decisions closed 2026-07-22 (audit sign-off — every §4 item terminal)

- **Pins vs plain notes → v1 SHIPS PLAIN NOTES; pins are a fast-follow.** Gate C
  tests client comprehension, and plain notes already work end-to-end. The backend
  stores pin coords today, so adding the pin UI later is additive and non-breaking.
  Figma S5.5 · commenting stays as the pin-target reference; its caption marks the
  v1 scope. No code change required for v1.
- **J2 build-or-cut → CUT editor-side; J2 = edit-AI (S2.5) only.** Whole-site
  drafting is the dashboard onboarding AI path (real, live-verified 2026-07-11).
  `PageWizard.tsx` stub is delete-on-sight in the next cleanup arc. Banner in
  `14-screen-specs.md` updated to DECIDED.
- **VIEWER role → adopted into contracts §2 as the fifth role** (read-only, never
  a gate target, disabled-never-hidden). Contract amended; Figma board exists.
- **Item #1 (bulk publish) → WITHDRAWN:** re-verified 2026-07-22 — no bulk publish
  action exists (`bulkActionSchema` = archive/delete/unarchive); the finding was a
  misread. Item #2 (applyToSite gate) and item #4's pill (designer-facing,
  `e09fa3af`) are fixed in code; the stale comment (`47ba46e0`) too.

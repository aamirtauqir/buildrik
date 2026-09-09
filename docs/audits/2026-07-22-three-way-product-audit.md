# Three-Way Product Audit — PRD ↔ Figma ↔ Code

**Date:** 2026-07-22 · **Scope:** whole product (IA, flows, roles, states, Figma structure)
**Sources:** PRDs (`docs/prd/**`, `docs/designs/2026-07-19-system-contracts.md`, code-truth brief), live Figma file `g4GzQFqzNYz5sosz1QtZXC` (8 pages, ~370 top-level boards), codebase (read-only; roles/gates/nav/routes verified per file:line).
**Mandate:** audit everything; corrections applied **in Figma only**. Code findings are report-only follow-ups.
**Builds on:** the 2026-07-22 morning fix pass (Badge contrast, ~68 semantic prototype edges, S6.1/S5.4 backdrops, S6.4 dirty state) — none of that is re-flagged here.

---

## 0. Executive summary

The product is far healthier than "a collection of disconnected screens" — 300+ real frames, a real token/component system (22 component sets, 2 collections), 56 PRD screen specs with near-complete Figma coverage, and a code-verified client-review loop. The real problems are **connective tissue**, not coverage:

1. **The editor's main shell is a prototype sink** — 7 flows land on it, zero leave it. The file demos features as islands; it cannot be walked as one product.
2. **The Dashboard spine page (new) is dead weight** — 10 frames, zero wiring, zero captions, no flow start, and no Templates surface even though Templates is a topbar-level destination in the shipped dashboard.
3. **Site settings prototype is two disconnected cycles** and Publish history has zero connections.
4. **Role model has three genuine conflicts in code** (ungated destructive template-apply, ungated billing, bulk-publish ADMIN vs single-publish EDITOR) plus a naming split (editor "DESIGNER" vs dashboard "EDITOR") no doc reconciles.
5. **Templates live in six places**; PRD says "dissolved," code kept three editor surfaces plus three dashboard entry points. The intended model is actually sound — it needs to be *stated* and drawn, not rebuilt.

Everything Critical/Major listed below is either **fixed in Figma in this pass** (marked ✅FIGMA) or **recorded as a code follow-up** (marked →CODE, since code is read-only for this audit).

---

## 1. Findings — prioritized

### CRITICAL

| # | Finding | Root cause | Action |
|---|---------|-----------|--------|
| C1 | `templates.applyToSite` destructively wipes all site pages with **no role gate** — any ACTIVE member incl. VIEWER (`templates.ts:51`, `template.service.ts:192-216`). Contradicts contracts §2 rule 2 (destructive → ADMIN). | Router added ad-hoc during template arc; never got `checkSiteRole`. | →CODE: add `checkSiteRole(ADMIN)` (or EDITOR + confirm). |
| C2 | All `billing.*` procedures ungated by role — any member can create checkout, cancel subscription, open portal (`billing.ts:14-68`). Contracts §2: members/billing = OWNER. | Billing router built pre-contracts. | →CODE: gate mutations OWNER (reads ADMIN+). |
| C3 | Bulk publish requires ADMIN (`sites.ts:176-178`) while single publish is EDITOR + approval gate (`sites.ts:282`). Same action, two answers; contradicts M3 decision (DESIGNER may publish). | Bulk path predates M3 flip; only single path updated. | →CODE: align `bulk` publish/unpublish to EDITOR + per-site approval gate. |
| C4 | Editor shell = prototype sink: 7 inbound edges, **0 outbound**. No path from the hub to Send-for-review, Publish, panels, ⌘K, Versions, Notifications. | Prior rewire fixed flow *interiors*, never wired the hub. | ✅FIGMA: rail/topbar hub wiring from `S1 · ASSEMBLED`. |
| C5 | Dashboard spine page: 0 edges, 0 flow starts, 0 captions; no Templates surface despite Templates being a topbar destination in the shipped dashboard (`nav.ts:59`). | Page added as orientation stub; never finished. | ✅FIGMA: wire auth→dashboard→site/workspace, captions, flow start, new Templates browser frame. |

### MAJOR

| # | Finding | Root cause | Action |
|---|---------|-----------|--------|
| M1 | Site settings = two disconnected nav cycles (SEO→Analytics→Custom-code vs Redirects→Headers→Localization); **Publish history has zero edges**; Site shell links only to General·editing. | Settings frames built in two batches; each batch wired internally only. | ✅FIGMA: hub edges Site shell → every section root; bridge the two chains. |
| M2 | S5.4 approval-gate (the wedge's core state) unreachable from the Publish flow — S6.1 goes straight ready→publishing. A viewer of the prototype never sees the gate. | Gate frames wired outbound only. | ✅FIGMA: S6.1 · ready → S5.4 · gate · pending (blocked branch). |
| M3 | AI flow: S2.4 generic-error unreachable; S2.5 chat·reject fully isolated (0 in/0 out) even though PRD marks S2.5 as *the only real AI path*. | Error/reject paths skipped in rewire. | ✅FIGMA: S2.2·slow → S2.4; AI·done → S2.5·reject → AI·idle. |
| M4 | S5.2 · changes-requested unreachable (status pill can never show the client pushing back). | Missing branch edge. | ✅FIGMA: opened-not-acted → changes-requested. |
| M5 | Domains · failed unreachable (only failure recovery drawn, not failure). | Missing branch edge. | ✅FIGMA: pending-dns → failed. |
| M6 | Client review: post-approval-edited-since orphaned; expired-token orphaned with no flow start. | Entry states never given entries. | ✅FIGMA: unchanged → edited-since; expired-token flow start. |
| M7 | Boot flow can't reach First-run — Loading → Returning only; new-user branch missing. | Single-path wiring. | ✅FIGMA: Shell 12 · Loading → Shell 1 · First run. |
| M8 | Portfolio shell frame sits on the **Site** page while all Portfolio flows live on the Portfolio page (cross-page prototype links are impossible in Figma), so Portfolio has no hub. | Frame placed with its sibling Site shell during shell batch. | ✅FIGMA: move shell to Portfolio page; wire hub → Sites grid / BrandPush / Handover / SharedLibrary. |
| M9 | Role naming split: editor contracts use OWNER/ADMIN/DESIGNER/CLIENT; dashboard + code use OWNER/ADMIN/EDITOR/DESIGNER/VIEWER; DESIGNER and EDITOR share rank 1 (`permission.service.ts:4-11`) with zero capability difference; VIEWER absent from contracts §2; CLIENT is not a role (it's `Reviewer`, token-scoped). | Two doc lineages never merged. | →CODE/DOCS: one matrix (see §4); either give DESIGNER a real capability delta or collapse the label. Figma already carries both permission boards (DESIGNER 59:2, VIEWER 396:3777). |
| M10 | Dashboard PRD §13 defects still open in code: `/sharing` 404 CTA, `Security "Revoke all"` dead, DECLINED/INCOMPLETE dead states, `bandwidthMB` unenforced, two divergent publish paths (bulk direct-flip vs job pipeline). | Recorded pre-freeze, not yet scheduled. | →CODE backlog (list preserved in DASHBOARD-PRD §13). |

### MINOR

| # | Finding | Action |
|---|---------|--------|
| N1 | Spine frame "Site · Bella Cucina" breaks naming convention (`Surface · state`). | ✅FIGMA rename `Dashboard · Site detail`. |
| N2 | `/dev/states` StateEmpty secondary action targets legacy `/dashboard/sites/new?method=template` redirect (`app/dev/states/page.tsx:37`). | →CODE one-liner. |
| N3 | Stale docstring `publish-approval.ts:5-9` claims publish is ADMIN+ (it's EDITOR). | →CODE comment fix. |
| N4 | ~300 functional glyph-emoji (✕ ⛓ 👁 🔒) across editor boards vs Icon component. Established convention; migration deferred (unchanged from morning pass). | Deferred, documented. |
| N5 | Shell async states (Offline, AI-run, Saving-conflict) have exits but no entries — acceptable as gallery boards; captioned as such. | No change. |

---

## 2. Where templates should live (the asked question)

**Answer: three homes, one per job — and no more.**

| Job | Home | Status |
|-----|------|--------|
| **Discover/browse** (shopping mindset) | Dashboard → topbar **Templates** tab → `/dashboard/templates` (+ `[id]` detail) | Shipped in code; **was missing from Figma** — added this pass |
| **Start a site** (creation mindset) | Onboarding path chooser + `sites/new` → both route INTO the same browser (`initial-view.ts:22` redirect) | Shipped; correct — creation borrows the browser, doesn't fork it |
| **While editing** (build mindset) | Editor: full-page templates → **New-Page flow (S1.3)**; section templates → **Insert** panel | PRD's "S3.4 dissolved" decision — correct |
| Apply to existing site | Site detail → "Apply template" (destructive, confirmed) | Shipped; keep behind confirm — **needs the C1 role gate** |

**What violates this model today (code):** three parallel editor surfaces still alive (sidebar TemplatesTab + TemplateLibrary modal + SectionTemplates quick-inserts — `CAT:169,175`). The PRD already marks the collapse "open." Recommendation: keep **Insert (sections)** and **New-Page (full pages)**; retire the standalone TemplatesTab drawer as a separate browsing surface. This is the single remaining "duplicate path" with user-facing cost.

---

## 3. Proposed sitemap + navigation model

```
Buildrick
├─ Auth (33 routes, code-canonical) → /auth/redirect → Dashboard
├─ Onboarding  path → {blank | template gallery | AI wizard} → editor/dashboard
├─ Dashboard (sidebar: Home · Getting started · Sites · [Agency] · Media · Settings)
│  ├─ Topbar ecosystem: Marketplace · Learn · Resources · Templates   ← discovery layer
│  ├─ Sites list → Site detail (Overview·Traffic·Domains·SEO·Submissions·Redirects·Sharing·Settings·Publish)
│  ├─ Agency (flag-gated): Clients · Reviews · Shared theme · Partner
│  └─ Settings ×14 (workspace/account/billing/team/…)
├─ Editor /edit/:id  (rail: Add · Assets · Components | Layers · Pages  — code)
│  │                 (target rail per SPEC §4.3: Insert · Layers · Pages · Media · Content · Brand)
│  ├─ Topbar: exit · save pill · review pill → review bar · Send-for-review/Publish · bell · ⋯
│  ├─ Site full-page: Settings ×11 · Domains · Export · Publish history
│  └─ Portfolio (agency): Sites grid · Brand push · Handover · Shared library
└─ /review/:token  (client, no account: identify → view frozen snapshot → comment/approve/request-changes)
```

Rules the model enforces: navigation depth ≤3; every feature has exactly one *owning* home plus job-scoped entry points that route into it (never fork it); dashboard = manage/discover, editor = build, portfolio = agency operations across sites, review = external sign-off.

**Known open divergence:** shipped rail (Add·Assets·Components·Layers·Pages) ≠ target rail (Insert·Layers·Pages·Media·Content·Brand). The Figma file draws the *target* — that is correct for a design SSOT; ship-plan M5 owns the convergence.

---

## 4. Role-to-surface matrix (reconciled — recommend adopting as the one SSOT)

Ranks (code): VIEWER 0 · EDITOR/DESIGNER 1 · ADMIN 2 · OWNER 3. CLIENT = token-scoped `Reviewer`, not a workspace role.

| Surface / action | VIEWER | EDITOR=DESIGNER | ADMIN | OWNER | CLIENT (token) |
|---|---|---|---|---|---|
| View dashboard, sites, media | ✅ | ✅ | ✅ | ✅ | — |
| Edit canvas/pages/media/CMS | ❌ | ✅ | ✅ | ✅ | ❌ |
| Send for review | ❌ | ✅ | ✅ | ✅ | ❌ |
| Comment / resolve comment | ❌/❌ | ✅/✅ | ✅/✅ | ✅/✅ | ✅/❌ |
| Approve a review | ❌ | ❌ (never own work) | ✅ | ✅ | ✅ |
| Publish (single) | ❌ | ✅ *if approved* | ✅ | ✅ (gate-exempt) | ❌ |
| Publish (bulk) | ❌ | ⚠ code says ADMIN — align to EDITOR (C3) | ✅ | ✅ | ❌ |
| Rollback / unpublish / archive | ❌ | ❌ | ✅ | ✅ | ❌ |
| Apply template to existing site | ⚠ ungated today (C1) → ❌ | → ❌ (proposed ADMIN) | ✅ | ✅ | ❌ |
| Domains, integrations, theme push, marketplace | ❌ | ❌ | ✅ | ✅ | ❌ |
| Shared library create / edit-delete | ❌ | ✅ / ❌ | ✅/✅ | ✅/✅ | ❌ |
| Team invite/roles, workspace settings | ❌ | ❌ | ✅ | ✅ | ❌ |
| Billing | ⚠ ungated today (C2) → ❌ | → ❌ | read | ✅ | ❌ |
| Delete site / workspace / transfer | ❌ | ❌ | ❌ | ✅ | ❌ |

Figma carries this as two boards (DESIGNER 59:2, VIEWER 396:3777) + client-page rule "no editing affordance, even disabled" (contracts §2).

---

## 5. Screen inventory (live file, post-fix)

| Figma page | Boards | Flow starts | Coverage vs PRD |
|---|---|---|---|
| 🖥️ Editor | 239 (166 spec screens/states + galleries) | 9 (was 8; hub-driven now) | All J1–J6 + C1–C7 S-codes present; S3.4/S3.5 intentionally absent (dissolved) |
| 🗔 Site | 92 (Domains 6 · Export 8 · Integrations 5 · Webhooks 12 · Settings 11 · Forms 5 · Publish history 1 · shells) | 3 | J6 complete incl. S6.4 dirty |
| 🏢 Portfolio | 52 + shell (moved in) | 5 | S4.7 brand push 10 states · Handover 4 · Shared library 5 · Sites 7 |
| 👤 Client review | 32 | 3 (added expired-token entry) | S5.5 all 13+ states |
| 🏠 Dashboard spine | 11 (+ Templates browser, this pass) | 1 (added) | Orientation layer only — dashboard remains code-canonical by decision |
| 🧩 Components | 22 sets (~1,169 instances) | — | — |
| 📕 Foundations | tokens: Primitives 46 · Package 7 (Editor/Dashboard modes) | — | — |
| 🗃️ Archive | 25 superseded boards, prefixed | — | — |

Deliberate scope decision (kept): auth's 33 routes, onboarding's 14 screens, billing UI live in code with tested loading/empty/error/denied states (`components/states/*`, `/dev/states` gallery). Duplicating them in Figma would create a second source of truth that drifts. The spine page exists to orient a designer, not to respecify the dashboard.

---

## 6. End-to-end flows (target, as now wired in Figma)

1. **Boot:** Loading → Returning ⟷ shell states; Loading → First-run (new user) → coach → assembled.
2. **Create:** New-page S1.3 → {Blank → canvas · Template → (dissolved into S1.3/Insert) · AI → S2.1}; AI: brief → generating (streaming → cancel-confirm; slow → **generic-error S2.4**) → result → accept → assembled.
3. **Build:** assembled → rail → Insert/Pages/Layers/Media/Content/Brand panel tours → back via panel headers (gallery convention).
4. **Review (wedge):** assembled → Send-for-review S5.1 compose → sending → sent → S5.2 pending → opened → {approved → edited-since → re-send · **changes-requested** → S5.3 threads}; client side: identify (email-match, wrong-email blocked) → landing → comment/request-changes/approve → post-approval unchanged → **edited-since**; expired-token = own entry.
5. **Publish:** assembled → S6.1 ready → {publishing → live · failed → ready · **blocked → S5.4 gate** → re-send/ack}; rollback = pick → confirm → publishing → done (new version, never mutate history).
6. **Site ops:** Site shell → General(saved ⟷ dirty) → SEO → Analytics → Custom-code → Redirects → Headers → Localization → Forms → Publish history; Domains lifecycle incl. failed; Export; Integrations.
7. **Agency:** Portfolio shell → Sites grid · Brand push (pick→diff→blast-radius→confirm→pushing→done→undo) · Handover · Shared library.
8. **Dashboard:** sign-in → dashboard Sites → site detail → (editor link-out); sign-in ⟷ sign-up/forgot; session-expired → sign-in; sign-up → onboarding path → dashboard; dashboard → Templates browser → detail; dashboard → Workspace settings/members/billing.

---

## 7. What was changed in Figma (this pass) vs deferred

**Changed (see commit-of-record in this doc's session):** hub wiring (Editor, Site, Portfolio, Dashboard), 8 missing branch edges, Portfolio shell relocation, Dashboard spine completion (captions, naming, flow start, Templates browser frame + detail wiring), 2 new flow starts, UI treatment on spine/new frames (DS components + tokens).
**Deferred (documented, deliberate):** glyph-emoji → Icon migration (~300 sites); full dashboard state replication in Figma (code-canonical); S2.1–S2.3 removal pending founder build-or-cut on whole-site AI; rail convergence (M5).

**Code follow-up list (ordered):** C1 role-gate applyToSite → C2 billing gates → C3 bulk-publish alignment → M10 PRD §13 defects → N2/N3 nits.

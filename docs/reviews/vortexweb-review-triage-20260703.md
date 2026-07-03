# Vortexweb outside review (40 points) — triage vs current design state · 2026-07-03

Reviewer ne LIVE product dekha (code), hum 2 mahine se design-side fix kar rahe hain. Verdict pehle:
**Reviewer ki prescribed fix-sequence ("inventory → duplicate audit → jobs → happy path → IA map → shell → panel roles → states → wireframes → PHIR code") = exactly wahi 10 steps jo COMPLETE ho chuke hain (design mein).** Ye independent convergence hai — teesri baar (autoplan, codex, ab human/AI outside voice) same diagnosis. Design sahi raste pe hai; gap = BUILD (jo validation ke baad gated hai).

## Scorecard (40 points → 10 clusters)

| # | Cluster | Status | Evidence |
|---|---|---|---|
| 1,20,21,35 | Clustering / IA / duplication / scope-mix | ✅ DESIGNED | ia-home-map 6 jobs · locked nav (dash 5: Home·Sites·Clients·Team·Settings · rail 4: Insert·Pages·Styles·Site, dock-inside #15) · dedup verdicts (media×2, settings×3, SEO×2 merged) · 16 sidebars IA-5 pe converted |
| 2,36 | Job-based screens / mental model | ✅ DESIGNED | 6-job spine, wireflows 16 journeys, "Wireframe v2 — Happy Path" page (8 rows, done-states) |
| 3,37 | Happy path / first-5-minutes | ✅ DESIGNED | W1→W13 clickable prototype (zero dead-ends) · onboarding continuation 4 screens (checklist 1→4 of 4) · empty-canvas CTA ("Add Section · Template · ✨AI" — reviewer ka exact correct-empty-state hamara wedge-w4 hai) |
| 7,23,24,25 | Inspector / hierarchy / selection / inline-edit | 🔶 PARTIAL | Inspector 3-tab (Look/Layout/Effects) + reach model designed; inline-edit ✓ code+design; **selection breadcrumb (Section>Container>Button) + canvas=layers=inspector sync spec = UNDER-DESIGNED → absorb** |
| 4,5,6 | Builder vibe / canvas feel / drag-drop feedback | 🔴 OPEN (design) | Canvas-controls §32 basic; **ghost preview, drop-zone highlight, alignment guides, resize handles, drag micro-feedback ka spec nahi bana → absorb (top gem)** |
| 8,9,10,12,13,14,15,18,19,31 | Layers/pages/templates/dash→editor/save/publish/responsive/states/onboarding/undo | ✅ DESIGNED | Sab wireframed + flow-audited (layers rename/reorder · page settings/SEO/slug · template gallery+preview · site-card→editor · save/conflict/offline pill · publish validation→live · breakpoint modes · 30+ edge-states · undo/history cloud-backed) |
| 11 | AI flow fit | ✅ DESIGNED | JX flows: assistant drawer front-door · propose→confirm→execute · inline TARGET · reviewer ka "AI asks 2-3 questions" = onboarding-ai-prompt |
| 16,17 | Components/symbols + **nav-menu sync** | 🔶/🔴 | Components masters+overrides designed+code-verified; global navbar/footer symbol flow thin; **#17 nav-menu ↔ pages auto-sync = TRUTH TABLE MEIN HI NAHI — genuinely missing feature → absorb** |
| 26,27,33 | Microcopy / error-prevention / SEO checklist | 🔶 PARTIAL | Confirmations + publish validation designed; **microcopy pass ("Add your first section" tone) + pre-publish SEO checklist as gate → absorb (cheap)** |
| 28,29,30 | Performance / code architecture / data model | ⏸ BUILD-ARC | Design se fix nahi hota. Engine SSOT/undo-coalesce/versioning already better than reviewer assumes (Composer, op-log, SiteVersion) — build-arc backlog mein perf pass |
| 34 | Collab/workspace roles | ✅ honest | Roles designed, collab GATED (6 P1) — deliberate |
| 39 | Positioning | ✅ DECIDED | Agency-first (wedge) — reviewer ka "sab ko serve = cluttered" wahi hai jo CEO-review ne kaata tha |

## ⚖️ Divergences — locked decisions, reviewer se ALAG (silently accept NAHI)
1. **Left panel:** reviewer 6-item (Add·Templates·Pages·Layers·Components·Media) vs LOCKED 4-slot rail + dock-inside (Templates/Media/Components = Insert ke andar, Layers = footer ⌗). CEO-review + founder-confirmed ×2. Reviewer ki cheezein hamari slots ke ANDAR map hoti hain — structure change nahi.
2. **Dashboard top-level:** reviewer Workspaces/Billing top pe vs locked-5 (Settings ke andar). Locked stays.
3. Inspector tabs: reviewer Content/Layout/Style/Effects/Advanced vs hamara Look/Layout/Effects (+Advanced disclosure) — vocabulary diff, structure same; no change.

## ABSORB — 5 naye kaam (design backlog, priority order)
1. **Canvas interaction spec** (P1): drag ghost + drop-zone highlight + alignment guides + resize handles + selection outline states — 1 spec frame + 3-4 wireframe states (reviewer ke #5/6 correct-behavior text ko as-is spec banao)
2. **Nav-menu ↔ pages sync** (P1, missing FEATURE): pages create → menu suggest/reorder/show-hide — truth table + 1 wireframe + build backlog
3. **Selection model spec** (P2): breadcrumb Section>Container>Button + canvas=layers=inspector sync contract — 1 frame
4. **Microcopy pass** (P2, cheap): key CTAs/states ki copy table — "Publish site", "Your site is live", "This page needs a title before publishing"
5. **Pre-publish SEO/validation checklist** (P2): publish-checklist screen mein SEO items explicit (title/meta/alt warnings)

## Honest note
Review LIVE app ke liye ~sahi hai — kyunki BUILD abhi hua hi nahi. Ye design arc ki taeed hai, tardeed nahi. Aur ye validation ka data NAHI hai (reviewer = apni team/AI, paying agency nahi) — 5 calls ka gate wahin khara hai.

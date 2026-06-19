# Wireframe reconciliation — bring all 91 screens to the locked solutions (2026-06-18)

Source of truth (locked): `m-ownership` · `m-roles` · `m-seo` · `m0-spine`/`m0b-spec` ·
`2026-06-17-product-ux-audit.md`. Codex produced this per-screen work order. Status tracked here.

## Definition of done (codex)
Every concept has ONE writable home; every other occurrence is a labeled mirror/deep-link;
dashboard/editor boundary consistent across all screens; **role and density visibly separate
everywhere**; editor rail always `Insert · Pages · Styles · Site`; AI = one in-context assistant;
media = one store/two doors; SEO/analytics/redirects follow the locked split; agency wedge real
(clients · shared theme · white-label · duplicate-from-template · **safe reviewed shared-DS push**).
User can go start→edit→publish→operate with zero contradiction.

## Priority fix order (the 12 that break the product if left)
1. `62-permissions` → REPLACE by `m-roles` ✅ banner
2. `53-settings` → FIX: rename "Site", keep only content-SEO/tracking/forms-config/code
3. `14-site-settings` → FIX: rename "Delivery" — redirects/technical-SEO/sharing/traffic/history only
4. `d5-seo` → FIX: Technical SEO only (canonical/robots/sitemap/cross-site health)
5. `19-analytics` → FIX: Traffic/diagnostics only; no connect buttons, "Fix setup ↗"
6. `c4-integrations` → FIX: workspace provider connections only
7. `50-pages` → FIX: add SEO overview table + effective tags + page override
8. `m-agency` → FIX: add the shared-DS push contract ⇒ built as **`m-ds-push`** (flagship)
9. `m-editor` → FIX: tracking assignment + role-vs-density why-states + slug-redirect outcome
10. `12-site-detail` → FIX: retab Overview·Domains·Traffic·Forms·Sharing·Delivery·History
11. `54-ai` → REPLACE by `m-editor`+`m3` entry points ✅ banner
12. `m0b-spec` → FIX: technical-SEO split, analytics 3-layer, dashboard redirects, cut locales

## CUT (badge ⊘, not in solution set)
`c5-api-tokens` · `e1-interactions` · `e2-locales` · `e4-export` · `fix-styling-model`

## REPLACE (badge ↗ superseded → canonical)
`13`→m3 · `10`→m3 · `55`→m-editor · `57`→m-editor · `editor-spine`→m-editor ·
`62`→m-roles · `54`→m-editor · `fix-boundary`→m-ownership · `fix-editor-4mode`→m-editor ·
`fix-editor-declutter`→m-editor · `fix-settings-map`→m-ownership

> NOTE (2026-06-18, design pass): `58-history` was **repurposed**, not superseded — it is now the
> active **Site detail › Versions** screen (dashboard publish-history + restore). The editor's
> in-canvas **Undo history** lives in the m-editor topbar; the two are distinct homes, both active.

## FIX (edit to match solutions — the bulk)
On-ramp: `01`(merge Start) · `02`(goal+DS handoff) · `03`/`03b`(house templates) · `04`(density not role) · `04b`(solo/agency branch) · `a5`(new roles) · `a7`(admin transfer)
Dashboard: `11`(Clients/Sites mgmt) · `12`(retab) · `16`(workspace-owned) · `18`(workspace shell) · `d1`(fold into Clients)
Editor: `20`(topbar publish) · `21`(topbar state) · `40`/`41`(3 reaches) · `50`(SEO overview) · `50b`(slug-redirect outcome) · `51`(Pages→Layers Pro) · `52`(Insert) · `53`(Site) · `59`/`59b`(role/density states) · `71`(new aliases) · `e3`(agency/client branch)
Settings: `14`(Delivery) · `b0`(4-scope directory) · `b1`(read-only mirrors) · `c1`(new roles+approval) · `c2`(DS-push/approval/setup notifs) · `c4`(workspace providers) · `d4`(Sharing)
SEO/Analytics/Redirects: `19`(Traffic only) · `d2`(submissions inbox only) · `d3`(+auto slug redirects, role-gated) · `d5`(technical SEO)
Media: `17`(Asset library) · `56`(contextual picker) · `56b`(picker subtab) · `56c`(in-place subtool)
Agency/DS: `ds1`(workspace source + site mirror) · `ds2`(fold into Styles+shared theme) · `ds3`(keep starter/AI/review-apply, cut lint/migrate/export) · `e5`(presence/review only)
System: `70`(destructive only; DS-push gets own contract) · `80`(role/density + zero-clients + no-data + DS-push-fail states) · `f2`(white-label client shells) · `fix-styling-3reach`(exclude DS-push) · `index`(rebuild around M-canon)
M-series self-fix: `m-agency`/`m-editor`/`m-seo`/`m0-spine`/`m0b-spec`/`m3`/`m4` per priority list

## ALIGNED (leave)
`00` `30` `a1` `a2` `a3` `a4` `a6` `a8` `15` `22` `60` `61` `90` `91` `m-ownership` `m-roles`

## Missing screens to draw (7)
1. **Shared-DS push review/apply** — affected sites · visual diff · override resolution · per-site success/fail ⇒ `m-ds-push` (flagship, built turn 1)
2. Editor › Site › **Tracking** — property/measurement ID + consent + "Fix provider ↗"
3. **Slug-rename redirect outcome** state (in Pages/page settings)
4. **Zero-clients agency first-run** — create first client · house template · invite later
5. **Inspector empty state** (nothing selected)
6. **Solo-vs-agency nav variants**
7. **Client approval flow** (if Client-Editor publish needs review)

## Execution log
- Batch 1 (2026-06-18): plan saved · **CUT (5) + REPLACE (12) badged** with grayscale banners → stop competing with canon · flagship **`m-ds-push`** built (marker→diff→override-resolution→per-site result), wired into m-agency + index, render-verified.
- Batch 2 (2026-06-18): **49 FIX screens badged** with corrected-role banners → whole 91-screen set now reconciled at IA/role level (66/91 badged; 16 ALIGNED untouched; 9 = M-series canon needing real edits).
- Batch 3 (2026-06-18): 6 missing screens drawn — `m-states` (inspector-empty · slug-redirect · zero-clients · solo/agency nav · why-disabled) · `m-tracking` (analytics 3-layer) · `m-approval` (client publish gate). Canon edits: nav Design-system→Shared-theme (m3/m-agency) · m-seo technical-SEO split · m0-spine SEO content/technical example. New screens wired into index, zero dead links.
- Batch 4 (2026-06-18): final codex gate → FAIL 7/10, P1 = canon `m-editor`+`m0b-spec` still encoded old model (editor redirects/locales, pre-3-layer analytics, missing Tracking). FIXED: m-editor Site panel → content-SEO + Tracking + custom-code, redirects/locales/interactions removed; m0b-spec → content/technical SEO split, analytics 3-layer, tracking, no editor redirects/locales. **Codex re-verify 4/4 PASS → "CANON CLEAN".**

## STATUS: reconciled + canon-clean (2026-06-18)
- 91 screens: 16 ALIGNED · 66 bannered (5 CUT · 12 SUPERSEDED · 49 RECONCILED-role) · 13 M-series canon (clean) + 4 new (m-states/m-tracking/m-approval/m-ds-push) + the ownership/roles/seo set.
- Def-of-done: criteria 1-3,5-9 PASS; #4 = old screens carry RECONCILED banners (accepted "labeled mirror/history" end state). Canon internally contradiction-free (codex). Zero dead links.
- Remaining polish (non-blocking): deep visual rebuild of individual bannered legacy screens (53→Site, 14→Delivery, etc.) when each is taken into hi-fi build — the banner states the target; the canon defines it.

## BODY REBUILD COMPLETE (2026-06-18) — founder caught "banner ≠ update"
Codex found ~34/49 FIX screens had STALE bodies (banner on top of old UI). **All 34 rebuilt** with real solution UI (banner removed, body replaced):
- Settings/SEO/analytics split: 53→Editor Site · 14→Delivery · d5→Technical SEO · 19→Traffic(no connect) · c4→Workspace connect · 50→SEO overview table · 12→ops tabs · 11→Clients-grouped · ds1→shared-theme source · 41→3-reach.
- Editor: 52→Insert · 40→reach guard · 51→Layers(Pages·Pro) · 56→asset picker · 59→3-reach inspector · 59b→hidden-vs-blocked · 71→new ⌘K aliases · 80→reconciled states · ds2→folded styles · ds3→trimmed(cut lint/migrate/export) · 50b→slug-redirect outcome.
- On-ramp/business: 01→one Start · 02→goal-first AI · 03/03b→house templates · 04b→solo/agency branch · 18→workspace shell · c1→4 roles · a5→role invite · c2→reconciled notifs · d1→folded into Clients · d2→submissions inbox · e3→branched onboarding · f2→white-label shells.
Codex re-verify: 10/10 sampled rebuilds PASS, "genuinely rebuilt not re-bannered", 9/10 quality. Zero dead links. 15 FIX screens codex judged already-OK keep their RECONCILED banner; 17 SUPERSEDED/CUT keep theirs (correct).

## (was) batch-3 plan: real edits to M-series canon — `m-editor` (tracking + role/density why-states + slug-redirect outcome), `m-seo` (strip technical SEO), `m0-spine`/`m0b-spec` (SEO content/technical split, analytics 3-layer, dashboard redirects), `m3` (Shared theme + Asset library + Personal nav), `m4` (post-publish + solo/agency). Then 6 missing screens (tracking · slug-redirect · zero-clients · inspector-empty · solo/agency nav · client-approval) · index rebuild · final codex full-set verify.

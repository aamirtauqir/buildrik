# Dashboard Design + UX Audit — 2026-07-24

**Scope:** the dashboard chrome as it ships today (`app/dashboard/**`), excluding the editor, auth, and onboarding. Live walk of Home, Sites list, Site detail, Settings, Agency, Media, and Templates while signed in to the *Northwind Studio* workspace (agency layer on).

**Method:** each surface rated against `DESIGN.md` (single accent `#406ED6`, Inter, two-level shell, primitive layer, compact density, "Webflow meets Linear, daylight edition") plus Krug/Norman/Nielsen usability heuristics and the trust-at-the-pixel-level bar.

**Not in scope:** functional bugs / dead links (covered in `docs/audits/2026-07-22-app-audit-excluding-editor.md`). This is a *design + UX* audit — hierarchy, states, consistency, trust, recognition.

---

## 1. Scorecard (0–10)

| Dimension | Score | One-line reason |
|---|---|---|
| Information architecture | **8** | IA v2 landed — top-nav ecosystem vs sidebar workspace split is clean; nav never repeats itself. |
| Visual hierarchy | **7** | Page → section → card rhythm is consistent; a few screens bury the primary action. |
| Primitive consistency | **6** | Same `StatCard` renders two different ways; draft vs published cards afford differently. |
| Empty states | **7** | Media's is textbook; others are adequate but generic. |
| **Data honesty / trust** | **4** | Fake upward sparklines drawn on top of *zero* data. The one real red flag. |
| **Content recognition (previews)** | **3** | A visual website builder that shows no visuals — every site and every template is the same gray globe. |
| Layout precision / polish | **6** | A floating button clips the storage label on every page; template card metadata wraps unpredictably. |
| Accessibility | **n/a** | Not deep-tested this pass — flagged as a required follow-up (contrast, focus order, keyboard). |

**Overall design completeness: ~6/10.** The bones are good (real design system, real primitives, clean IA). Two systemic gaps hold it back: **it doesn't show the user their own work**, and **it fakes data it doesn't have**. Fix those two and this jumps to an 8.

---

## 2. Systemic issues (fix once, every screen improves)

These are the highest-leverage items. They are not per-screen — they ride the shell or a shared primitive, so one fix propagates everywhere.

### G1 — Fake sparklines on zero data · CRITICAL (trust)
Home's four stat cards (`Sites`, `Published`, `Visitors`, `Team`) each draw a green upward-trending sparkline. `Visitors` reads **0 · ↑0% · 30d** and *still* shows a growth curve. A rising line on top of zero is a lie the user can catch, and once they catch one dishonest pixel they distrust every number on the page.
- **Fix:** drive sparklines from the real series. If a metric has no history or is zero across the window, render a flat baseline or omit the spark entirely. Never synthesize an uptrend. Applies wherever `StatCard visual="spark"` is used.
- **Principle:** trust is earned at the pixel level (Gebbia); every element either builds or erodes it.

### G2 — Floating "N" button clips the storage label · MAJOR (polish)
On every dashboard page the bottom-left circular "N" element overlaps the sidebar's Storage/Usage row — the label renders as "…ge 0 / 50 GB", the word *Storage* eaten. There are also **two** floating controls at once (bottom-left "N", bottom-right feedback FAB with a "1" badge), which reads as clutter in an otherwise calm chrome.
- **Fix:** resolve the z-index/layout collision so the storage row is never occluded; reconsider whether two persistent FABs are needed, or consolidate.

### G3 — `StatCard` has two personalities · MAJOR (consistency)
Home's stat cards carry sparklines; Agency's stat cards (`Active clients`, `Client sites`, `Without sites`) are bare number + label. Same primitive, two visual contracts. Users read inconsistency as "unfinished."
- **Fix:** pick one contract. Either sparkline is a real opt-in prop used consistently for time-series metrics only (client counts aren't time-series → no spark, correctly), *or* document that rule so it looks intentional rather than accidental. Right now it looks accidental.

### G4 — Storage shown twice on one screen · MAJOR (subtraction)
Media renders a storage meter in its own left rail (`0 B / 50.0 GB`) *and* the shell already shows storage at the sidebar bottom. Two meters, same number, same viewport.
- **Fix:** drop the in-page one; the shell meter is the single source. Omit, then omit again (Krug).

### G5 — "EXPLORE" top-nav label reads as a dead nav item · MINOR
The faded `EXPLORE` between the brand and `Marketplace` looks like a disabled link, not a section divider. Users try to click it. It's a group label.
- **Fix:** style it unmistakably as a divider/eyebrow (smaller, tracked, with a separator rule) or remove it — the grouping is already implied by position.

---

## 3. The two big UX bottlenecks

### B1 — No content previews anywhere · the #1 bottleneck
This is a **visual website builder**, yet nowhere in the dashboard can a user *see* a site or a template:
- **Sites list:** every card is the same gray globe placeholder.
- **Templates browser:** all four cards are identical gray globes — the gallery whose entire job is "pick a design you like" shows no designs.
- **Site detail / template detail:** falls back to a page-list when there's no `previewUrl`, which is most of the time.

Consequences: the user can't recognize their own site among four ("which one was the pricing page?"), can't compare templates, and never gets the visceral "ooh, that one" moment a template gallery lives or dies on. Krug's billboard test fails — nothing is scannable because everything looks identical.
- **Fix (staged):**
  1. Generate a thumbnail on publish (and on save for drafts) — a real screenshot of the rendered site. This is the single highest-impact visual change in the whole dashboard.
  2. Until screenshots exist, differentiate cards with a generated cover: template/site name set in the brand type over a tinted panel keyed off the category, so at minimum no two cards look the same.
  3. Template detail should lead with the preview, not the page-list fallback.

### B2 — 0→1 activation is soft
A near-empty workspace lands on Home with the primary "Create a site" living as one of three equal-weight Quick Actions in a bottom-right card. For a user with 2 drafts and 0 published, the single most important next action isn't the loudest thing on screen.
- **Fix:** when the workspace has no published site, promote a single focused activation card (create / continue a draft / publish) above the stat grid. Hierarchy is service — decide what they should do first and make it first.

---

## 4. Per-surface findings

### Home — 7/10
- **H1 · Recent activity is vague.** "Taiba Ahmed Updated 2 settings ×4" tells the user nothing about *what* changed. Activity rows should name the object ("Updated *Pulse — Pricing* SEO title"). Scannability fails.
- **H2 · "Needs attention" banner is heavy for one item.** A full-width tinted banner hosting a single "1 domain verifying" chip. Fine, but it'll look right only once there are 2–3 items; consider a denser inline treatment for the single-item case.
- Strong overall: greeting, clear stat grid, activity + actions split. Fix G1 (sparklines) and it's an 8.

### Sites list — 6/10
- **S1 · No thumbnails** (see B1).
- **S2 · Draft vs published cards afford differently.** The draft card surfaces `Edit` + `Manage` buttons; published cards show a metadata line (pages · visitors · edited) with actions hidden. Two card grammars in one grid. Pick one — ideally metadata always visible, actions on hover-reveal for both.
- **S3 · "Manage" opened two things.** Clicking Manage on a site opened both the site-detail tab *and* an `/edit` tab. Manage should open detail only; Edit opens the editor. (Borderline functional, but it's a design-of-the-action problem.)
- Select mode + grid/list toggle + status filter chips are good.

### Site detail — 6/10
- **SD1 · Nine tabs is a lot** (Overview · Traffic · Domains · SEO · Submissions · Redirects · Sharing · Settings). For a *draft* site most are empty. Consider grouping (e.g. Settings absorbing Domains/Redirects/SEO under sub-nav, which the settings full-page already does) so the top rail carries fewer, fatter tabs.
- **SD2 · Health score has no inline "why."** "Site health 30/100" is prominent but the drags on the score aren't visible without scrolling to the Health Score section. Put the top-2 issues right under the number.
- Overview stat grid, breadcrumb, and action cluster (View site / Send for review / Publish / More) are clean and correctly prioritized (one primary blue CTA).

### Settings — 8/10 (strongest surface)
- Grouped cards (WORKSPACE / PLAN & BILLING / SITES & CLIENTS) with icon tile + title + subtitle + chevron. Clear, scannable, conventional. This is the model the rest of the dashboard should feel as finished as.
- Only nit: the light-blue icon tiles are uniform — fine, but they don't aid recognition (every icon tile is the same tint). Low priority.

### Agency (Clients) — 7/10
- **A1 · Contact column is all "—".** Empty is honest, but an all-dash column reads as broken. Either populate it, collapse it until there's data, or show a subtle "Add contact" affordance in the cell.
- **A2 · Stat cards lack sparklines** — the G3 inconsistency, seen from the other side.
- **A3 · "Add client" floats with dead space.** The primary action sits top-right with a large empty gutter to its left; it belongs in the `PageHeader` action slot aligned to the title, not orphaned above the stat grid.
- Client DataTable (avatar · sites · contact · status · overflow) is clean and correct.

### Media — 8/10
- Textbook empty state: icon, "No assets yet", one-line context, primary Upload CTA, plus a second Upload in the header. This is exactly what an empty state should be.
- Only issue: G4 (duplicate storage meter).

### Templates browser — 5/10
- **T1 · No preview images** (see B1) — the single most damaging gap on this surface. A template picker with no visible templates.
- **T2 · Metadata row wraps unpredictably.** The usage count ("3 sites") jumps to a second line on the *Agency* card because its "Intermediate" pill is wider than "Beginner", shoving the count down. Cards in the same row end up different heights / misaligned. Reserve the count's position or cap the pill row so the layout doesn't jitter.
- Left filter rail (Category / Difficulty / Sort by) is good and conventional.

---

## 5. Prioritized fix list

### Critical (do first — trust + core job)
1. **G1** — kill fake sparklines; drive from real data, flat/omit on zero.
2. **B1** — site + template thumbnails (screenshot-on-publish; generated cover as interim).

### Major (consistency + polish that reads as "finished")
3. **G2** — stop the floating "N" from clipping the storage label; reconsider dual FABs.
4. **G3** — one `StatCard` contract (sparkline = time-series only, documented).
5. **G4** — remove Media's duplicate storage meter.
6. **S2** — unify draft vs published card affordance.
7. **A3** — move "Add client" into the PageHeader action slot.
8. **B2** — promote a single 0→1 activation card on empty workspaces.

### Minor (quick wins)
9. **G5** — style/removes the "EXPLORE" divider label so it's not mistaken for a dead link.
10. **H1** — name the object in activity rows.
11. **T2** — stabilize template card metadata layout (no wrap jitter).
12. **A1** — collapse/soften the all-dash Contact column.
13. **SD2** — surface top health-score drags inline under the number.

---

## 6. What "10/10" looks like

- Every site card and template card shows a **real screenshot** of the rendered page. The user recognizes their pricing site in half a second without reading the label.
- Every number on the page is **true** — sparklines reflect real series, zero looks like zero, and the user never catches a synthesized trend.
- One primitive, **one behavior** — a `StatCard` looks the same everywhere it appears, and its optional spark follows a documented rule.
- The chrome is **quiet and precise** — no floating button clips a label, no meter is drawn twice, no metadata row jitters between cards.
- An empty workspace has **one obvious next move**, promoted above everything else, so a first-time user is never left scanning three equal-weight actions.

---

*Report only. No code changed. Companion to the 2026-07-22 functional audit; this one covers design + UX.*

# New design → implementation map

**Design source (single source of truth):** artifact `50a51e54-14d6-4ae7-859f-665602485cf6`
("Figma wireframing analysis" — misleading name; it is a Buildrik dashboard prototype).
Rendered locally for measurement at `http://127.0.0.1:8899/design.html`
(served from the saved bundle; re-serve with `python3 -m http.server 8899` in the scratchpad `artifact-srv/`).

Target viewport: **1440×730**. Interactive prototype — clicking top-nav/sidebar swaps the screen in place.

## Measured design tokens — ALREADY MATCH the shipped app ✅

| Token | Design (measured) | App (`globals.css`) | Status |
|---|---|---|---|
| Font | `Inter` | `Inter` (scoped to dashboard) | ✅ |
| Page bg | `rgb(249,250,252)` `#F9FAFC` | `--color-bg-page` | ✅ |
| Text primary | `rgb(28,33,44)` `#1C212C` | `--color-text-primary` | ✅ |
| Border | `rgb(232,234,239)` `#E8EAEF` | `--color-border-default` | ✅ |
| Accent | `rgb(64,110,214)` **`#406ED6`** | `--color-primary` | ✅ |
| Active-nav bg | `rgb(235,241,255)` `#EBF1FF` | `--color-primary-subtle` | ✅ |
| Primary CTA | `#406ED6`, radius 10px, 13.5px/600, h40 | `Button` primitive (h38) | ✅ (h 38 vs 40) |
| Page H1 | 24px / 700 / -0.24px | `PageHeader` 24px/700/-0.01em | ✅ |
| Top bar | 61px | `--topnav-h: 60px` | ✅ |

The UI kit adopted earlier was evidently derived from this artifact — the foundation is correct.

## Verified deltas (shell — affects every screen)

| # | Delta | Design | App | Notes |
|---|---|---|---|---|
| S1 | Sidebar width | **293px** | 272px | content starts x=333 (=293+40 padding) |
| S2 | Sidebar nav item height | **30px**, radius 8px | 36px, radius 10px | denser |
| S3 | Content column | fluid, 40px gutters | `mx-auto max-w-[1120px] px-10` | at 1440 they differ ~3px; diverges on wider screens |

## Screens in the design (11)

| # | Design screen (h1) | Reached via | App route | Status |
|---|---|---|---|---|
| 1 | Good morning, {name} | Home / Dashboard | `/dashboard` | exists |
| 2 | All projects | Projects | `/dashboard/projects` | exists |
| 3 | Client management | Clients | `/dashboard/agency` (Clients tab) | ⚠️ IA conflict C1 |
| 4 | Media library | Media | `/dashboard/media` | exists |
| 5 | Libraries & Templates | Templates | `/dashboard/templates` | exists |
| 6 | General settings | Settings | `/dashboard/settings` | exists |
| 7 | Getting started | Getting started | `/dashboard/getting-started` | exists |
| 8 | How can we help? | Help center | `/dashboard/help` | exists |
| 9 | Marketplace | top nav | `/dashboard/marketplace` | exists |
| 10 | Learn | top nav | `/dashboard/learn` | exists |
| 11 | Resources | top nav | `/dashboard/resources` | exists |

## CONFLICTS / GAPS — reported, not assumed (goal rules 10 & 12)

- **C1 — Clients vs Agency.** Design puts **Clients (3)** as a flat sidebar item. The app has **Agency** (feature-gated by `agency_layer`) containing Clients / Reviews / Shared theme / Partner tabs. The design has no Agency concept and no Reviews/Shared-theme/Partner screens. Per rule 12, functionality is preserved — Agency stays; its Clients screen adopts the design's "Client management" layout.
- **C2 — ~29 app screens have no design.** The design covers 11 of ~40 routes. Undesigned: all site-detail tabs (overview/traffic/SEO/forms/redirects/sharing/settings/domains), billing, plans, usage, team, domains, integrations, API tokens, security, profile, notifications, danger zone, reviews, comments, shared theme, partner, AI wizard, onboarding (14 frames), auth (12+), editor. "No old-design elements remain" is not achievable for these — they stay on the current kit-aligned styling, which shares the design's tokens.
- **C3 — No states in the design.** The prototype shows a single populated state per screen. No hover / focus / disabled / loading / empty / error / success variants, and no tablet/mobile breakpoints. The goal requires these pixel-perfect; the design does not define them. They will follow the existing kit rules (documented in `docs/design/dashboard-ui-kit.md` §6) rather than being invented.
- **C4 — Design uses mock data** (Taiba's Workspace, 6 projects, 24.8k visitors, named activity rows). App renders real data; layouts must tolerate empty/long values. Real data wins (goal rule 8).

## Order of work

1. Shell deltas S1–S3 (touches every screen — verify no regressions first, goal rule 11)
2. Screen 1 Home → 2 Projects → 9 Marketplace → 4 Media → 5 Templates → 6 Settings → 7 Getting started → 8 Help → 3 Clients → 10 Learn → 11 Resources
3. Per screen: match layout at 1440, keep all existing handlers/queries, tsc + tests + live-verify, commit.

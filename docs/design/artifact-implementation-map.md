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
| Primary CTA | `#406ED6`, radius 10px, 14px/600, h40, padX 15 | `Button` md | ✅ exact (`bc8f9863`) |
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
- **C3 — CORRECTED 2026-07-19.** This originally read "no states in the design",
  which was wrong: it was written after exploring the nav only. A programmatic
  crawl (click every control, watch for `h1` change / fixed overlay) confirms
  **exactly 11 screens** and finds **3 modals**: *Create a new site* (Home),
  *Install <app>* (Marketplace), and an article reader (Learn). The first two are
  implemented in `fc3f576c`. The third is a conflict — see C7. What the design
  still does not define is hover / focus / disabled / loading / empty / error
  variants, and no tablet or mobile breakpoints; those follow the kit rules and
  are covered by `e2e/responsive-audit.spec.ts`.
- **C7 — Learn's article reader has no data source.** The design opens a reading
  modal ("Connecting a custom domain · 4 min read"). Learn's course list is
  hardcoded placeholder content — there is no course or lesson model in Prisma and
  no article body to render. Building the reader would mean inventing article copy,
  which the brief forbids. Help centre *does* have real seeded articles; if Learn
  should read from it, that is a product decision.
- **C3 (original text, superseded) — No states in the design.** The prototype shows a single populated state per screen. No hover / focus / disabled / loading / empty / error / success variants, and no tablet/mobile breakpoints. The goal requires these pixel-perfect; the design does not define them. They will follow the existing kit rules (documented in `docs/design/dashboard-ui-kit.md` §6) rather than being invented.
- **C4 — Design uses mock data** (Taiba's Workspace, 6 projects, 24.8k visitors, named activity rows). App renders real data; layouts must tolerate empty/long values. Real data wins (goal rule 8).

- **C5 — "All projects" is a different feature in the design.** The design's Projects screen is a **folder/project-group grid** (4 cards: Marketing Sites / Client Work / Product & App / Experiments, each an icon tile + ⋯ menu + name + sites/live/views stat row) above a non-clickable "All sites / Apps" pill toggle. The app's `/dashboard/projects` is a **flat site list** with real search, sort, filter, bulk actions and grid/list views — and the design defines no drill-down target for its folder cards. Restyling the list into the folder grid would delete working functionality to match a mockup. Per rule 12 the site list is preserved; only the comparable header/button row was matched. **Folder grouping already exists in the app** (`folder-tabs.tsx`) — if the founder wants the design's folder-grid landing, that is a product decision needing its own spec, not a restyle.

- **C6 — Settings is a directory in the design, a live form in the app.** The design's
  Settings screen is a card-grid of ~13 links across 5 groups (Workspace, Plan &
  billing, Sites & clients, Developer, Danger zone) — and three of them (Add-ons,
  Review & comments, Partner program) point at routes that do not exist. The app's
  `/dashboard/settings` is the real Workspace form (name, slug, language, timezone,
  branding, collaboration, sharing, transfer-ownership), with navigation to the other
  settings destinations already handled by `SettingsRail` — the IA `DESIGN.md` calls
  canonical. Building the card grid would bury a working form behind an extra click and
  link to dead routes, so per rule 12 the form was restyled in place. **Founder decision
  needed** if the directory landing is actually wanted; it is a product change, not a restyle.

## Progress

| Step | Commit | Status |
|---|---|---|
| Design inventory + mapping + conflicts | `b37317d7` | ✅ |
| Shell geometry pixel-match (S1–S3) | `2d102c5e` | ✅ sidebar 293=293, h1 x=333=333, nav 30=30 |
| Screen 1 — Home | `17414b37` | ✅ stat cards, LIVE pill, activity rows |
| Screen 2 — Projects | `b323d82a` | ✅ header matched; grid preserved (C5) |
| Screen 9 — Marketplace | `64bdf06d` | ✅ hero + cards matched; install flow live-verified |
| Screen 4 — Media library | `6f80d2c3` | ✅ real folders kept over the mock's fixed rail |
| Screen 5 — Templates | `92c5e3d6` | ✅ `FilterTabs` extracted as a shared primitive |
| Screen 6 — General settings | `dba60ba0` | ✅ form restyled in place — see C6 |
| Screen 7 — Getting started | `3c2d3e4b` | ✅ real completion signals kept live |
| Screen 8 — Help centre | `47cbc199` | ✅ tests 16/16; no support channel invented |
| Screen 10 — Learn | `36e77670` | ✅ design's blue→purple banner re-done single-hue |
| Screen 11 — Resources | `12cb164b` | ✅ all 6 links verified; 3 mislabelled (pre-existing) |
| Screen 3 — Client management | — | ✅ already matched by `5f8a14f1`/`7ef0531f`; no change needed |
| Responsive audit (1440/820/390) | `06bb5064` | ✅ 34/34; fixed 2 real mobile overflow bugs |

| Pixel gaps closed (Button/ProgressBar/PageHeader) | `bc8f9863` | ✅ measured equal to design |

**Verification at close:** `tsc` 0 errors · vitest 853 files / 8895 tests green ·
responsive audit 34/34 (twice, after de-flaking) · all 11 routes 200, no error page.

### What "pixel-perfect" does and does not cover here

Every element the design actually draws on these 11 screens is matched to measured
values. Three gaps that were previously excused as "keep the app's primitive" are
now closed (`bc8f9863`). What remains unmatched is not a rendering choice:

- **~29 routes have no design at all** (C2). The artifact contains 11 screens. The
  rest cannot be matched to something that does not exist, and inventing screens for
  them would violate the same instruction that forbids inventing features. Those
  routes stay on the shared token kit, which is the design's own token set.
- **C5 / C6 are functionality conflicts, not styling gaps.** The design's Projects is
  a folder grid over a real site list, and its Settings is a link directory over a
  live form whose three of ~13 links point at routes that do not exist. The brief's
  own rule — "If the design conflicts with existing functionality, preserve the
  functionality and report the conflict" — governs here, so the functionality stands
  and the conflict is reported rather than silently resolved either way.

### Dev-environment note (cost me a full debugging cycle)

After the Marketplace edits the whole app 404'd — every page **and** `/api/auth/session`
— with no compile error. Route files were on disk, cwd correct, no competing
`src/app`. Cause: Turbopack's persistent filesystem cache held a module graph with
no route entries (log ended `✓ Finished filesystem cache database compaction`).
Fix: stop dev, `rm -rf .next`, restart. It is not a code bug — do not go looking
for one in the page you just edited.

## Order of work

1. Shell deltas S1–S3 (touches every screen — verify no regressions first, goal rule 11)
2. Screen 1 Home → 2 Projects → 9 Marketplace → 4 Media → 5 Templates → 6 Settings → 7 Getting started → 8 Help → 3 Clients → 10 Learn → 11 Resources
3. Per screen: match layout at 1440, keep all existing handlers/queries, tsc + tests + live-verify, commit.

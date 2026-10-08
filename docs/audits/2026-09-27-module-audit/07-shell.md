# 07 · Shell & global surfaces — topbar · rail · ⌘K · canvas bars · menus · onboarding · AI (2026-09-27)

Build `8e9a3ccb2`. Paths relative to `packages/editor/src/editor/`. 26 findings, 7 P1.
Harness notes: Next.js dev overlay and the Agentation dev puck were removed after load (not product); shared server
(checklist moved 5/7 → 6/7 mid-run); clicking an open rail item closes it; on Mac Control+A doesn't select ⌘K text.

## 1. Global navigation map

| Module / action | Rail | Topbar | ⋯ menu | ⌘K | Keys | Other doors | Visible at rest? |
|---|---|---|---|---|---|---|---|
| Add | ✓ | — | — | Open Add | A | empty-canvas "Add a block"; context › Structure › Replace with block | ✓ |
| Layers | ✓ | — | — | Open Layers; layer rows | L | — | ✓ |
| Pages | ✓ | site name in breadcrumb | — | Open Pages; Go to <page> | P | page tab strip (switch only) | ✓ |
| Assets / Asset library | ✓ | — | — | Open Assets / Asset library; stock | M | "Manage assets ›" | ✓ |
| CMS | ✓ | — | — | Open CMS; Manage CMS records | D | — | ✓ |
| Brand (full screen) | ✓ | — | — | Open Brand | B | checklist step 1 | ✓ |
| Components | ✗ | — | ✗ | Open Components | ⇧A | Add › "Manage components ›" | ✗ |
| Templates (full screen) | ✗ | — | ✗ | Browse Templates; Replace layout…; names | T | Add "Page templates ›"; Pages "From template"; empty-canvas | ✗ |
| Site settings | ✗ | — | ✓ ⌃, | Open Site settings | S, ⌃, | — | only inside ⋯ |
| Publish (act) | — | main button "Publish anyway" | — | — | — | checklist | ✓ |
| Publish panel | ✗ | opens behind confirm dialog | "Unpublish…" (once published) | Open Publish | U | — | ✗ |
| History | ✗ | save pill "● History ›" | ✗ | Open History (Tools) | H, ⌃H | — | disguised as save status |
| Activity | ✗ | — | Activity log | Open Activity | — | bell "View all activity ›" | ✗ |
| Review | ✗ | chip when enabled | ✗ | Open Review when enabled | R when enabled | checklist steps 4–5 (not gated) | chip only |
| Issues | ✗ | — (chip removed) | Issues (count in tooltip) | Open Issues | — | publish gate | ✗ |
| AI – edit | ✗ | — | — | Open AI assistant; "Ask AI instead ›" | I, ⌘J, ⌃⇧A | Inspector ✦ AI; Inspector ⋯; canvas More; right-click | ✓ (✦ chip) |
| AI – create | ✗ | — | — | Generate a block with AI… | — | Add row (y≈1644, below 54 rows); AI panel link; empty-canvas "Describe your site" | ✗ |
| Command palette | — | search field, only while no search-owning drawer open | ✓ | — | ⌘K, ⌘⇧P | — | not on first load |
| Keyboard help | Help | — | ✓ ⌘/ | ✓ | ?, ⌘/ | — | ✓ |
| Preview | — | ✓ | — | "Preview Home page" + separate "Preview" (differ) | ⌘P | checklist | ✓ |
| Share preview link | — | — | ✓ | ✗ | — | Preview overlay "Share preview" | ✗ |
| View mode, Duplicate site, Invite, Account, Site health | — | — | ✓ only | ✗ | — | — | ✗ |
| Export | — | — | Export site… | 4 rows (2 dead) | ⌘⇧E | Settings › Export | ✗ |
| Permissions / Delete site | ✗ | ✗ | ✗ | typed "Permissions" only | — | viewer notice | ✗ |
| Breakpoint | — | — | — | typed only | — | View ▾ › Breakpoint ▸; Preview overlay | ✗ |
| Zoom | — | — | — | ✓ | ⌘±, ⌘1 | "100% ▾" + View ▾ › Zoom ▸ | ✓ |
| Inspector restore | — | — | — | typed "Toggle inspector" | — | temporary "Show" toast | ✗ |
| Onboarding | checklist pill "6/7" | — | Getting started | ✗ | — | — | ✓ |

Rail = the 6 build modules only; every lifecycle/admin module is off-rail.

## 2. Entry-point duplication matrix

| Action | Entry points | Same behaviour? | Notes |
|---|---|---|---|
| **AI edit** | 9: ✦ chip, Inspector ⋯, canvas More, right-click, I, ⌘J, ⌃⇧A, ⌘K row, "Ask AI instead" | **Y** for first 7 (same panel, "Scope: Heading text") | "Ask AI instead" drops the query (`shell/modals/CommandPalette.tsx:514-517`); 3 doors together for one selection |
| AI create | Add row, ⌘K, AI panel link, empty-canvas | Y (code: all `requestGenerateBlock`) | Add row below fold |
| **Element menu** | toolbar More, right-click, Inspector ⋯ | **N** | More + right-click = same 9 rows; Inspector ⋯ = different 12 rows |
| Duplicate / Delete | toolbar buttons, More rows 2–3, Inspector ⋯, ⌘D/⌫, ⌘K, toolbar caption | Y | five visible copies of two verbs |
| **Preview** | topbar, ⌘P, ⌘K "Preview Home page", ⌘K "Preview" | **N** | last opens blank `about:blank` (`defaultCommands.ts:436-449`) |
| **Export** | ⋯ Export site, ⌘K Open exporter, Open export settings, Export HTML, Export JSON | **N** | HTML/JSON produce nothing (`p11` downloads = 0; `defaultCommands.ts:450-461`) |
| Zoom | "100% ▾" + View › Zoom ▸ | Y | two menus side by side |
| Keyboard reference | Help legend, ⋯, ⌘K, ? | **N (content)** | legend contradicts code (SHL-07) |
| Collab start | ⋯ (Planned), ⌘K | **N** (code) | ⌘K hard-codes "Editor", swallows errors; flag off |
| Page breadcrumb "Home" | — | **N** | closes the drawer |
| History / Settings / Issues / Share | 2–4 doors each | Y | — |

## 3. Scorecard (1 = poor, 5 = good)

| Surface | Controls at rest | Duplication | Discoverability | Scent | Correctness | Cognitive load |
|---|---|---|---|---|---|---|
| Topbar | 11 | 3 | 3 | **2** | 4 | 3 |
| Rail | 6 + Help + pill | 4 | **2** | 3 | 4 | 5 |
| ⋯ menu | 14 (17 when published) | 3 | 3 | 4 | 4 | 3 |
| ⌘K | 33 opening rows | **2** | 4 | 3 | **2** | 3 |
| Canvas foot bar | 4 + readout | 3 | **2** | 3 | 4 | 5 |
| Selection toolbar | 3 + caption | **2** | 4 | 3 | 4 | 4 |
| Canvas More / right-click | 9 | 3 | 3 | 4 | **1** | 4 |
| Inspector ⋯ | 12 | **2** | 3 | 3 | 4 | 3 |
| Onboarding | pill + 7 steps + tips | 3 | 4 | 3 | 3 | 3 |
| AI (all doors) | 9 edit + 4 create | **2** | 3 | 3 | 4 | 3 |

## 4. Findings

| ID | Lens | Sev | Finding | Impact | Evidence | Prior |
|---|---|---|---|---|---|---|
| SHL-01 | Surface | **P1** | More menu anchored x=1088–1288 runs under the Inspector (starts x=1140): "Imp", "Duplic". Right-click renders fully. | Menu clipped for wide elements; submenus further under | 31 vs 32; `canvas/controls/UnifiedSelectionToolbar.tsx:176` | NEW |
| SHL-02 | Duplicate / cohesion | **P1** | Two element menus: Lock, Arrange, Bind to CMS only on canvas; Select parent, Reset styles only in Inspector. | Unpredictable action location | `canvas/menus/contextMenuRegistry.ts:57-81`; `inspector/components/InspectorElementMenu.tsx:237` | NEW |
| SHL-03 | Duplicate | P2 | 9 AI-edit doors, identical; 3 visible together. | Noise; top row of both element menus | `inspector/ProInspector.tsx:374`; `useEditorShortcuts.ts:200`; `useComposerInit.ts:446` | CHANGED (A09-4, A03-3) |
| SHL-04 | Correctness / duplicate | **P1** | ⌘K Export HTML/JSON do nothing; second "Preview" opens raw blank tab; Export has 5 doors. | Dead rows; look-alikes that differ | `p11`; `engine/commands/defaultCommands.ts:436-461` | NEW |
| SHL-05 | Discoverability / hierarchy | **P1** | Breakpoint only at View ▾ › Breakpoint ▸ or typed ⌘K; bar shows "View · 1" (overlay count), not device; Wide is ⌘K-only. | Responsive editing has no visible control | 14; `canvas/CanvasFooterToolbar.tsx:6-13`; `defaultCommands.ts:530-558` | CHANGED (A09-2) |
| SHL-06 | Discoverability | **P1** | Permissions + Delete site reachable only by typing into ⌘K. | Owners can't find role management / deletion | `CommandPalette.tsx:160-169`; `shell/PermissionsHost.tsx:37` | NEW |
| SHL-07 | Scent | P2 | Help legend wrong ×4: ⌘J ("jump to page" → AI), ⇧A ("adds a section" → Components), ⌘K scope rule, R condition. | Wrong instructions | `canvas/controls/KeyboardLegend.tsx:22,24,27,91`; `keyboardSheetRows.ts:140` | NEW (extends A05-10) |
| SHL-08 | Scent / scope | P2 | Save pill reads "● History ›"; "Saved" = dot + tooltip; only visible History door. | Save confirmation lost; History hard to find | `chrome-ui/SaveStatus.tsx:115-118` | NEW |
| SHL-09 | Scent | P2 | Topbar field = panel filter (⌘F) while Add/Layers/Pages open, ⌘K launcher otherwise; Assets + CMS have no search; first load (Add open) → no visible ⌘K door. | Same field, different searches; palette hidden by default | `p9`; `shell/StudioHeader.tsx:119-127,682-697` | NEW |
| SHL-10 | Scent (collab) | P2 | Review chip "Waiting · Sent to your client" vs panel "Not sent yet". | Contradiction one click apart | `ReviewTab.tsx:138-152` | NEW (= COL-01) |
| SHL-11 | Misfit / discoverability | **P1** | Checklist "Connect first client" + "Send for review" open Review without the reviews gate every other door has. | Non-agency users: dead steps, checklist can't reach 7/7 | `shared/constants/onboardingSteps.ts:68-85`; `onboarding/OnboardingMount.tsx:224`; `rail/tabsConfig.ts:361-373` (code) | STILL (A03-1) |
| SHL-12 | Scent | P2 | Main button "Publish anyway" at rest; issue count only in ⋯ Issues tooltip. | Warning unreadable | `shell/lifecycle.ts:251-258` | CHANGED (C3) |
| SHL-13 | Duplicate | P2 | "Ask AI instead ›" doesn't carry the query. | Retype | 47 | NEW |
| SHL-14 | Discoverability | P2 | ⌘K finds nothing for "version", "share", "help", "invite", "view mode", "duplicate site"; History in Tools; "ai" matches every Container layer; letter keys not shown. | Site-level actions missing from the universal door | `p10`, 12 | CHANGED (A05-2) |
| SHL-15 | Hierarchy / discoverability | P2 | All lifecycle/admin modules off-rail with no persistent labelled door; a comment still claims a ⋯ "Version history" row that no longer exists. | New users can't find Settings, History, Issues | `rail/tabsConfig.ts:276-296`; `shell/SiteMenu.tsx:5-16` | CHANGED (A03-13, A09-6) |
| SHL-16 | Hierarchy | P2 | Opening a right-column panel closes the left drawer; closing it doesn't restore it. | Reopen build panel after every glance | 24–26 | STILL (FA-1) |
| SHL-17 | Bloat | P3 | Permanent toolbar caption repeating tooltips (emoji glyphs); More repeats Duplicate/Delete. | Noise on every selection | `UnifiedSelectionToolbar.tsx:188-189` | NEW |
| SHL-18 | Cognitive | P3 | Foot readout "Heading · Heading · 984 × 36"; identity in 3 places. | Looks like a bug | 31 | CHANGED (A09-3) |
| SHL-19 | Duplicate | P3 | Two zoom menus; ⌘K spends an opening slot on "Zoom to 50%". | Minor noise | 14, 15 | NEW |
| SHL-20 | Cohesion | P3 | ⋯ "This site" group (10 rows) mixes site ops with help/meta. | Label inaccurate | 10 | CHANGED (A09-6) |
| SHL-21 | Scent | P3 | Breadcrumb page name "Home" closes the drawer. | Surprising | 72 | NEW |
| SHL-22 | Discoverability | P2 | Add "Generate a block with AI…" after 54 rows (y≈1644). | Main AI-create door below fold | `p7`; `sidebar/tabs/build/BuildTab.tsx:297-311` | NEW |
| SHL-23 | Scent | P3 | Empty-canvas cards "Start from the X template" all open the catalogue. | Label ≠ action | `canvas/CanvasEmptyCTA.tsx:92-112` (code) | NEW |
| SHL-24 | Discoverability | P3 | Hidden Inspector returns only via temporary toast or typed ⌘K. | No way back after toast | `shell/StudioPanels.tsx:300-331` | CHANGED |
| SHL-25 | Duplicate | P3 | ⌘K collab start hard-codes "Editor", swallows errors (flag off). | Matters when collab ships | `CommandPalette.tsx:293-303` | STILL (A09-12) |
| SHL-26 | Doc drift | P3 | Stale comments `tabsConfig.ts:286-288`, `CommandPalette.tsx:133-136`. | Misleads future edits | as cited | NEW |

## 5. Prior-audit reconciliation

| Prior | Now |
|---|---|
| A03-1, FB-3 review doors ungated | Mostly fixed; onboarding steps still ungated (SHL-11) |
| A03-2, A04-12/13/14 sticky sub-tabs, Settings close | Fixed per fix report (A-7); not re-walked |
| A03-3, A04-4, A09-4 two AI homes | Fixed (one home); changed into door sprawl (SHL-03) |
| A03-4, FB-4 letter keys | Fixed (code) |
| A03-6, A04-11 ⌘⇧P-only doors | Fixed (⌘K Tools band) |
| A03-12, A01-14, A02-12 palette dupes / two palettes | Fixed (one palette); new dupes SHL-04 |
| A03-13 no rail active state for off-rail panels | Still true, wider (SHL-15) |
| A05-2 no jump-to | Fixed; gaps SHL-14 |
| A05-10 two shortcut references | Still two, now contradictory (SHL-07) |
| A09-2 four foot bars | Fixed; breakpoint moved out of sight (SHL-05) |
| A09-3 identity 3–4× | Changed: 3 places |
| A09-6 21-row ⋯ | Changed: 14 rows; discoverability cost SHL-15 |
| A09-7 review signalled 3× | Changed: chip + button; changes-requested not walked |
| A09-10 context-menu nesting | Changed: Copy/Cut/Paste deeper under Structure › |
| A09-12 collab doors differ | Still true |
| A09-13 page tabs duplicate Pages CRUD | Fixed: tabs only switch |
| A09-14 "Preview" means four things | Still overloaded (SHL-04) |
| FB-2 Activity no backend | Fixed (code) |
| FB-5 "Bind to CMS field" opens CMS | Fixed |
| FB-6 Publish panel no door | Fixed (code), not clicked |
| FC-3 "Describe your site" opens editing AI | Fixed (code) |
| FA-1 right-column stacking | Partial: drawer still closes (SHL-16) |
| FB-1 three "Settings" | Still true |

## 6. Not verified
Non-agency workspace (reviews off) for SHL-11; viewer role / view-mode chrome; Publish click + confirm; changes-requested
state; empty-canvas prompt (no empty page); AI generation output; Brand AI + collab (flags off); widths < 1280;
keyboard-only / screen readers; "Back to canvas" landing from Settings/Brand (from fix report); Activity data.

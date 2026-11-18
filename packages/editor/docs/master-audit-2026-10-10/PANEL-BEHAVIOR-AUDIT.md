# Phase 2 — Existing panel system

This records current implementation and known observations. Dimensions are existing source values; final redesigned dimensions are deliberately deferred. The [131 surface candidates](evidence/surface-candidates.csv) enumerate filename-matched panels/dialogs/workspaces and their static incoming references. They are not131 verified user-visible panels, and zero static incoming references are not an unused-code verdict.

| Surface family | Responsibility / current host | Width, scroll and canvas behavior | Keyboard / state evidence | Audit status |
|---|---|---|---|---|
| Rail | Primary destinations; `rail/tabsConfig.ts` | `--bk-size-rail`, fallback60px; selected drawer beside it | Role/read-only availability centralized in config helpers | Source traced; local navigation observed |
| Add / Layers / Pages | Insertion, hierarchy, pages; LeftSidebar | Drawer fallback280px; `LeftSidebar.tsx` expands280↔700. This is an expansion toggle, not proof of continuous resizing | Closed drawer uses inert + aria-hidden; active tab remounts when switched | Local entry/selection/menu checks; long-tree/search/scroll restoration open |
| Components | Add drill-in / component management | PanelFrame + detail screen; back row to Add | Storage availability/error states exist; callback-dependent creation entry | Source traced; master/instance workflow pending |
| Assets chooser | Insert/select/replace an asset | Slim launcher/pick mode; library expansion is a separate state | Caller/result callbacks matter; do not conflate with manager close | Earlier local empty-state observation; successful media task pending |
| Inspector | Selected object/type/Style/Behaviour/Effects | Fallback300px; own scroll. At<=1366px CSS overlays it rather than reserving a grid column | Sections filtered by capabilities; source and effective state can differ (UX-10/25) | Runtime typography issues; full type matrix pending |
| Right task modes | Publish/Review/History/Activity in inspector column | RightColumnPanel owns Suspense/error isolation; no left drawer700px expansion callback | Column Escape helper and return-to-inspector logic | Source traced; role/error/task persistence tests pending |
| AI | Selected-element or broader assistance | Right-side task surface with scoped entry | Prior local service failure showed recovery; successful apply/undo unverified | Partial |
| Issues | Document checks/jump/autofix | Right-column alternative | Must preserve selection and mutation history; do not assume every autofix is reversible | Source inventoried; live task pending |
| Templates | Browse/preview/use layouts | Full-screen portal, own navigation and close/return | Own Escape/dialogs; creation previously stacked unrelated surfaces | Earlier runtime UX-03/04/24 |
| Full media manager | Folders, grid/list, details, versions/bulk tools | Full-screen portal; distinct quick chooser mode | Own nested dialogs/Escape; asset menu uses capture Escape | Earlier runtime empty/library controls; authenticated operations pending |
| Brand | Global site tokens/presets/usage | Full-screen portal; own nav and preview column | Current host lacks sibling fullpage marker; local token discovery issues | Earlier runtime UX-18/19; propagation pending |
| Settings | Site settings + explicit workspace destinations | Full-screen portal, own navigation/content scroll | Own unsaved guard; covered chrome remains in keyboard navigation (UX-22) | Earlier local reproduction; remote save states pending |
| CMS | Collections/records/fields | Replaces canvas+inspector in-place; rail/collection drawer stay. Empty states retain inspector-width HintColumn | Record sheet/field inspector/import dialogs; caller-return path exists | Earlier empty/create observations; populated workflows pending |
| Compare | Review/history/deployment comparison | OverlayMount broad transient surface; not a normal tab | Must return to originating task; separate from session undo | Source inventoried; runtime pending |
| Preview | View generated page at chosen device size | Full overlay, iframe with allow-same-origin and scripts blocked | Local device starts Desktop; parent handles links | Earlier responsive mismatch; interactive output limitations |
| Context menus | Target-specific actions | Canvas raw pointer coords; Layers/Page/Media use different estimated clamps | Layers arrow navigation failed; Pages worked; canvas prior patch documented separately | Type matrix55 types/110 states; edge/selection coverage incomplete |
| Command palette | Search/execute global and contextual commands | Modal-like searchable catalogue | Keyboard/target relevance require common action contract | Earlier UX-23; exhaustive command execution pending |
| Popovers / property pickers | Small property choices | Color, token, type, unit and state controls | Need nested Escape/focus/viewport tests; cannot assume shared primitive covers custom consumers | Candidates inventoried; per-control behavior pending |
| Dialogs / sheets | Creation, deletion, record/detail editing, conflicts | Multiple owners and overlay roots | Loading/validation/cancel/unsaved ownership must be exercised per flow | Candidate inventory provided; exhaustive states pending |

## Existing narrow-screen rule

`LayoutShell.css` switches the inspector to absolute positioning at1366px; an open drawer can still consume280px (or expanded width through layout state). This must be measured with both panels open, rather than assuming “responsive CSS exists” means usable working space. UX-01 already records clipped empty-state content at1280×720. The exact below-minimum authoring support policy is not established by this audit.

## Cross-surface consistency questions for Phase 3

- Which task owns selection while a full workspace is open?
- Which state survives tab remount versus workspace return?
- Does Escape close the innermost surface exactly once?
- Does a visible “Saved” refer to document state, a local draft, a remote record, or a published deployment?
- Do screen readers and keyboard users encounter covered chrome?
- Do estimated menu heights still work with optional rows, explanations, localization and zoom?

These questions are audit gaps and inputs to the next phase, not silently adopted redesign decisions.

## Authenticated Pages / History continuation

At 1440×900, measured Pages drawer 280px and right column 300px. Opening History closes Pages; Escape returns to the inspector and focuses the History trigger without reopening Pages. Named save and restore confirmations, persistent Undo restore feedback, and compare behavior were exercised. See [Pages / History runtime audit](PAGES-HISTORY-AUDIT.md). Full workspace comparison remains distinct from the tested inline Saves comparison.

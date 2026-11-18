# PRODUCT_INFORMATION_ARCHITECTURE

Date 2026-10-18 · Status: **records the approved IA** (BD-*, IA-01…08, NAV-01…04, GEO-01, SC-1…22) and audits it against professional builder architecture. It does not reopen approved placements (AGENTS.md). Proposed changes are marked PROPOSAL.

## 1. Object model and scope ladder

| Scope | Objects | Canonical home |
|---|---|---|
| Workspace (organisation) | members, billing, plan, integrations, component library, Vercel connection | Dashboard (external); library via Components area |
| Site | pages, folders, Brand tokens, styles, assets, CMS collections, settings, releases (publish), review rounds | Areas + Site settings + Publish task |
| Page | element tree, page settings, SEO, dynamic-page binding | Editor (canvas, Layers, Inspector) + Pages manager |
| Element | styles per breakpoint/state, content, bindings, interactions, component instance overrides | Inspector (Content · Style · Behaviour · Effects) |
| Editor view (per user) | zoom, breakpoint view, overlays, panel sizes, coach state | Canvas toolbar / View menu |

Primary user: solo professional designer building client sites (WORKING HYPOTHESIS, 00-STRATEGY §1). Jobs: J1 Build · J2 Get approval · J3 Publish and maintain. Core loop: Build → Preview → Client review → Publish → Change.

## 2. Shell and hosts (approved)

| Host | Defined content (doc) | Geometry (GEO-01 / doc) | Enter / exit / return rules |
|---|---|---|---|
| Global topbar | Exit, site identity + live dot, **Site settings** (gear+label), Review chip / Comments, presence (PLANNED), bell, Preview, CTA Publish, ⋯ site menu (Activity, Export, org links, "Search ⌘K" header) | 56h | BD-07/14; 00:82 viewer variant; Site settings = direct nav, returns to invoking area (00:15, PDB:344) |
| Global banner slot | Persistent conditions (Panel 22) | under topbar | joins F6 (00:75, :182) |
| Left rail | Add, Layers │ Assets, CMS, Brand │ Help (utility) | 56w, labels under icons | IA-04 (PDB:857–866); stable order; active marker only on real destination (PDB:275) |
| Left panel (Editor) | Add catalog / Layers tree / temporary Asset picker | 284 (260–360) | picker Cancel restores previous panel (HANDOFF:104) |
| Canvas toolbar | Editing: return chip, Undo/Redo, breadcrumbs · View: Desktop/Tablet/Mobile, width, zoom, Fit, options, Record switcher, Show drafts, Show hidden elements | 44h; 88h two rows if canvas <720 | BD-10; DYN §13; SC-7 return chip |
| Canvas | Selection, inline text, drag, resize, comments | 800 @1440 docked | Esc ladder → parent (00:26) |
| Inspector | Header + Content / Style / Behaviour / Effects; Page appearance at no selection; special contexts | 300 fixed; overlay ≤1366 (312 obscured) | INS-D01/D03/D07; subviews "‹ Back to {tab}" (DYN §8.3) |
| Right task host | Publish, Review, History, Activity, Issues, (AI — hidden by SC-21) | 360 (320–420); overlay 1281–1366; sheet ≤1280 | NAV-02 (HANDOFF:78–87): replaces Inspector in Editor, tray over resource body; Close restores prior Inspector state |
| Bottom bar | Pages entry, page strip, Add page, status (+ "Versions ›") | 32h | BD-02, IA-05, SC-4/6 |
| Pages manager | Temporary sheet: list, folders, search, bulk, page settings, Recently deleted | 560 / 720, viewport−48 | opening/closing never changes active page (PDB:876); row = "Open {page} in Editor" |
| Area: Assets | Library workspace, detail 320, folders, Fonts, Recently deleted | nav 240 / detail 320 | Back to Editor · {page}; picker vs manage distinct (CTRL-03) |
| Area: CMS | Collections → Records / Fields / Dynamic pages / Collection settings; **CMS → Data** (Sources, Site variables, Conditions index) | nav 240; record 720–960 | IA-07 frames; Locate → Inspector Content (SC-7) |
| Area: Brand | Token workspace + local Undo/Redo | nav 240, header 56 | IA-02 |
| Area: Site settings | 11 screens + Danger + workspace doors | header 56, footer 48 | IA-08; topbar door; returns to invoker |
| Area: Templates | Page templates (Panel 15) | work area | entry Pages → New page → From template; Add → Blocks "Page templates…" (PDB:913) |
| Area: Components | This page / This site / Component library; detail; import/export | work area | "Edit main component" → area with "‹ Back to {instance}" (P/13:103) |
| Dedicated: Compare / Time Travel | Read-only comparison / snapshot | full working area; rail+topbar visible | exit to exact origin; own Esc (00:37) |
| Preview (full screen) | Preview bar | — | last Editor page, current bp + frame width (SC-8); Back per SC-1 |
| Dialogs | Review-and-publish (P14), import/export 720/480/960, Create collection page, shortcuts dialog, ⌘K palette, conflict, session re-sign-in, Upgrade | viewport−48 | modal focus trap; Esc innermost |
| External | `/review/<token>` (client), `/share/<token>`, dashboard (Members/Billing/Integrations, `/dashboard/agency/library`), `/edit/[siteId]` | — | org links show org scope (PDB:335); bell other-site rows open new tab (00:183) |

Return rules: IA-04 (rail Add/Layers → Editor last snapshot; resource → last local location), IA-05 (explicit page open supersedes Back), IA-07 (frames only for contextual tasks; per site; invalid → nearest list), SC-1 (one label "‹ Back to {origin}"), NAV-01 (direct nav replaces, no stack).

### Navigation diagram

```mermaid
flowchart LR
  subgraph Shell[Persistent shell]
    TB[Topbar: site · Site settings · Review · Preview · Publish · ⋯]
    RAIL[Rail: Add · Layers | Assets · CMS · Brand | Help]
    BB[Bottom: Pages · strip · status/Versions]
  end
  ED[Editor: left panel 284 + canvas toolbar + canvas + Inspector 300]
  RT[Right task host 360: Publish · Review · History · Activity · Issues · AI hidden SC-21]
  AS[Area Assets] ; CM[Area CMS + CMS→Data] ; BR[Area Brand]
  SS[Area Site settings] ; TP[Area Templates] ; CP[Area Components]
  PM[Pages manager sheet]
  PV[Preview full-screen] ; CT[Compare / Time Travel]
  EXT["/review/token · /share/token · dashboard"]
  RAIL -- Add/Layers IA-04 --> ED
  RAIL -- IA-04 last local view --> AS & CM & BR
  AS & CM & BR -- "‹ Back to Editor · page" --> ED
  TB -- direct nav --> SS
  SS -- "‹ Back to invoker (SC-1)" --> ED & CM & BR & AS
  TB --> PV
  PV -- SC-1 --> ED
  TB -- Review/Publish --> RT
  RT -- Close restores Inspector / Locate+Fix --> ED
  BB --> PM
  PM -- "Open page in Editor (IA-05)" --> ED
  PM -- From template --> TP
  ED -- Edit main component --> CP
  CP -- "‹ Back to instance" --> ED
  CM -- "Edit collection page (SC-7 chip)" --> ED
  CM -- Locate condition --> ED
  RT -- History → Compare --> CT
  CT -- exit to origin --> RT
  TB -- org links / review link --> EXT
```

## 3. Builder-architecture evaluation (Webflow/Framer-class categories)

Benchmarks are used for organisation quality only — no proprietary UI or branding copied. "Documented need" = the docs/INV require the surface; nothing below adds a capability.

| Category | Documented need | Where it lives | Assessment | Action |
|---|---|---|---|---|
| Global top toolbar | Yes | Topbar 56: Exit · site + live dot · Site settings · Review · presence · bell · Preview · Publish · ⋯ | Sound split of global actions; Publish is the single CTA | Topbar targets below 32 (P03); ⋯ menu regroup (Unpublish) |
| Main canvas | Yes | Centre; page frame on grey, Desktop 1440 | Canvas-centred ✓; **1440 fixed frame → ~52% Fit on laptops** | Decide frame-follows-column or legibility floor (P13) |
| Navigator / hierarchy | Yes | Layers (rail), 284 drawer, tree | Strong spec (markers, keyboard, 2.5.7) | Bind to `TreeRow`; inherited-lock marker missing (D2-11) |
| Inspector | Yes | Right column 300, 4 tabs Content/Style/Behaviour/Effects | Purpose-first order defined; source/override/reset defined | Row anatomy + Mixed visual + SC-13 wording conflict (T6-4/5/9) |
| Elements / components panel | Yes | Add (rail) + Components area | Add de-duplicated; Components has **no persistent door** | PROPOSAL: "Components ›" entry in Add header + instance link in Layers (P26) |
| Assets panel | Yes | Assets area + temporary left picker | Picker vs manage separated ✓ | Fix false progress, quota threshold, audio filter |
| Pages panel | Yes | Bottom bar entry + Pages manager sheet | Page switching where the eye is (bottom strip) — deliberate departure from Webflow's left Pages | Keyboard reorder; 40 rows |
| Style controls | Yes | Inspector Style tab + Brand area (tokens/classes/presets) | Manage (Brand) vs apply (Inspector) split ✓ | One noun for font-size token (T6-2) |
| Interactions | Yes | Inspector Behaviour → Interactions section (P19) | Presets first ✓ | Reverse toggle not in runtime (T2-18); loading/offline state |
| Breakpoint selector | Yes | Canvas toolbar segments + width field | Visible ✓, cascade SC-13 | Active breakpoint label always visible (P05) |
| Preview / publish | Yes | Topbar Preview + Publish task (right host) + one review-and-publish dialog | 4 dialogs → 1 ✓ | P0 recovery overwrite (T5-01); legal line |
| Contextual toolbar | Yes | Selection toolbar on canvas; multi toolbar (SC-17) | P05 contradicts SC-17 | Amend P05 (T2-1) |
| Right-click menus | Yes | SC-3 registry across canvas, Layers, Inspector ⋯ | **One generic menu**, no order | Fixed group order + type-context group (T2-3/4) |
| Layer & component navigation | Yes | Layers ↔ canvas bidirectional; "Edit main component" → Components area with "‹ Back to {instance}" | ✓ | — |
| Command palette | Yes | ⌘K modal; door in ⋯ header/sheet/footer | No topbar button (owner decision OD-18-3) | ⋯ header has two occupants (trial chip) |
| CMS / data | Yes | CMS area + CMS → Data; binding via Inspector Content | Exhaustive binding states ✓ | Recently deleted at nav level (D2-31); conflict diff (T4-17) |
| Forms | Yes (23 INV rows) | **No owner** — split over P06, P10, IAF-13, FORM-01, REPORT | Gap | PROPOSAL: Forms section in P06 (build) + P10 (inbox/settings) |
| Export | Yes (7 rows) | ⋯ site menu row + IAF-15 | No panel spec | PROPOSAL: Export annex in P01 |
| E-commerce | INV rows exist | none — P1-D15 "proposed" Defer | Scope undecided | Owner decision |
| AI | Deferred (SC-21) | Future Build tab | Leaks: P12 T-RT-09, P23 benefit rows, PDB/HANDOFF IA tree | Annotate inactive |

## 4. Navigation rules (approved, summarised)

| Rule | Content | Status of conformance |
|---|---|---|
| NAV-01 | Direct navigation replaces; no history stack | ✓ |
| IA-04 | Rail Add/Layers → Editor last snapshot; resource rail → last local location | ✓ |
| IA-05 | Explicit page open supersedes Back | ✓ |
| IA-07 | Context frames only for contextual tasks; invalid target → nearest list | ✓ |
| SC-1 | One label "‹ Back to {origin}" | ✓ except legacy "‹ Activity" (P12 RT-13) |
| SC-7 | Fix in Editor keeps task open; Fix elsewhere uses tray + Back | ✓ |
| — | **URL state** for area/record/task | **Missing** — reload/deep link lands on Editor (REVIEW:62, BK-156 P3). PROPOSAL: SC row defining `?area=&record=&task=` restoration with IA-07 fallback |

## 5. Width budget at supported viewports (from GEO-01, not measured)

| Viewport | Rail | Left | Canvas | Right | Rule |
|---|---|---|---|---|---|
| 1440 | 56 | 284 | ≈800 | 300 (Inspector) / 360 (task replaces Inspector) | docked |
| 1366 | 56 | 284 | ≈1026 | Inspector overlay 300 + 12 | overlay |
| 1280 | 56 | 284 | ≈940 | task as sheet (min 560) | sheet |
| 1024 | 56 | collapsible | ≥ 720 target | sheet | narrow banner, never blocks |

Not measured in any doc (G4 NOT RUN). First Figma pass must measure 1440/1366/1280/1024 × 900/720.

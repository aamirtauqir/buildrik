# Wireframe rebuild plan v2 — agency-first spine + task backbone (2026-06-17)

> v2 supersedes v1 after a codex + CEO-lens pressure-test. Both reviews converged on
> two corrections v1 got wrong: (1) the backbone is **the task flow + the agency
> structure**, not the Simple↔Pro switch (that's only a depth control); (2) v1 was
> Simple-first wearing Pro-first language, and **the agency layer was entirely missing**.

## Why this exists

Founder rejected the 44-screen set as "hard to use, flow not clean, IA muddy — features
good but not connected, overcrowded," and rejected a 4-mode editor guess. Root cause: the
wireframes were built for *feature parity* (a screen per procedure); the reviews graded
*coverage*, never *"is this simple + does it serve the agency."* Coverage-maximizing is
what produces overcrowding.

## The two outside voices (2026-06-17)

- **Codex:** Simple↔Pro is a visibility control, not the spine. The real backbone is
  **one object model + one task flow: Start → Edit → Publish**, context decides what
  appears. M0 is an internal spec, not a founder artifact — cut to one rule + one
  boundary + one example. Simple rail of 6 still too busy → **Insert · Pages · Styles ·
  Site** (Publish→topbar, Media contextual). The plan never committed to ONE canonical
  way to make a page, and contradicts itself on AI (primary in M4, hidden in Pro in D5).
- **CEO/product lens:** v1 optimizes Simple-first and *calls* it Pro/agency-first —
  polarity inverted. For a Pro/agency-first product, **the Pro surface IS the product;
  Simple is the derivative** an agency hands its client. And the agency lever the founder
  named — **shared-DS / multi-client / white-label / speed** (memory
  `project_redesign_why_20260615`) — is absent. The object spine stops at `Workspace ›
  Site`; the agency pays to dedup *across clients*, which has no home. Predicted founder
  rejection: *"this is the same product organized better — where is the agency?"*

## The backbone (corrected) — three layers, not one switch

1. **Structure (who/what):** the object tree, now WITH the agency layer —
   `Workspace › Client › Site › Page › Section › Element`. `Client` is the agency
   grouping (optional/collapsed for a solo builder, who is just `Workspace › Site`).
2. **Journey (the one task):** `Start → Edit → Publish`. Every screen sits on this
   line and shows where you are + the single next step. This is the user-facing
   backbone, not "modes."
3. **Depth (how much surface):** Simple↔Pro, a per-user density control *inside Edit*,
   seeded by onboarding role. NOT the spine — just how much of Edit is revealed.

## Decisions (locked, v2)

- **D0 — Agency is a first-class node.** Object tree gains `Client` between Workspace
  and Site. The four agency gaps each get ONE home:
  - **Shared design system** → Workspace-level DS, pushed to all clients/sites
    (Dashboard › Workspace › Design system; Editor Theme can "publish to workspace").
  - **Multi-client management** → Dashboard › Workspace › Clients list (and sites under
    each).
  - **White-label** → Dashboard › Workspace › Branding (what client-invited collaborators
    see — agency brand, not Buildrik).
  - **Speed** → "Duplicate as template" / start client N+1 from client N (Clients/Sites
    list action + template-from-site).
  - Solo builders never see the Client layer; it collapses to today's `Workspace › Site`.
- **D1 — Pro/agency is the canonical product; Simple is the derived client view.**
  Stop calling Simple "the calm default." Build and pressure-test **Pro (M2) first**;
  Simple (M1) is the constrained surface an agency hands a non-technical client. Default
  mode still seeded by role (Designer/Agency → Pro, client/solo-beginner → Simple), but
  the design center of gravity is Pro.
- **D2 — Editor↔Dashboard boundary.** Editor owns *this site's design + content config*
  (SEO, forms config, custom code, analytics IDs). Dashboard owns *the business* (account,
  workspace, **clients**, team, billing, domains, analytics *view*, form *submissions*).
  Duplicate homes deleted or become read-only mirrors with "Edit in editor ↗."
- **D3 — Orientation is a system.** Breadcrumb `Workspace › Client › Site › Page`;
  inspector "You are editing X" + 3-reach; ⌘K universal finder. The user can always
  answer where-am-I / what-will-this-change / where-did-X-go.
- **D4 — One canonical way to make a page = Insert.** Resolve the AI contradiction:
  `Add blocks + Templates + AI generate` are ONE entry point ("Insert"), and **AI is
  available in Simple too** — it's the beginner's strongest wedge, never Pro-only.
  No more "Add vs Templates vs AI" three-door choice.
- **D5 — Editor rail = 4 items, gated by mode. No invented modes.**
  - Simple rail: **Insert · Pages · Styles · Site** (4). Publish lives in the topbar.
    Media is contextual (opens from Insert / when replacing an asset), not a rail item.
  - Pro rail adds: **AI surfaces** (Components, Layers, Interactions, History, full
    Design tokens, full Settings) — but reached by expanding Insert/Styles/Site into
    their Pro depth, plus a couple of Pro-only rail items. Net: Simple ≤4 visible; Pro
    reveals depth, doesn't multiply destinations.
  - Inspector: Simple = 6 visual sections (Quick actions, Text, Spacing, Background,
    Border/Corners, Visibility), no CSS/tokens/jargon. Pro = full 14 + All CSS +
    classes + breakpoints. **Hide, never delete** — same engine.
- **D6 — Styling reach = 3 user words** (This item / Reusable block / Site theme),
  mapping silently to element/class/component/preset/token. `fix-styling-3reach` keeps it.

## What "right" means (acceptance bar v2 — now 5 criteria)

1. **Easy to use** — first-timer in Simple: ≤4 rail items, ≤6 inspector sections, one
   obvious next action. No CSS, tokens, or jargon by default.
2. **Clean flow** — `Start → Edit → Publish` reads as one line; each step shows where
   you are + the single next step.
3. **Oriented** — breadcrumb + "you are editing" + ⌘K answer where-am-I / what-changes /
   where-did-X-go at all times.
4. **Connected, not overcrowded** — every feature has one home on the object tree; a
   single map proves no orphan/duplicate homes.
5. **Serves the agency (NEW)** — the four named gaps (shared DS, multi-client, white-label,
   speed) each have exactly one home on the spine, OR are explicitly deferred with a
   reason. An acceptance bar for a Pro/agency-first product must name the agency.

## The master set to draw (v2 order — Pro/agency-first)

- **M0 — Founder artifact (rewrite, scannable in 30s):** the rule + the agency-inclusive
  object tree + the editor↔dashboard boundary + the `Start→Edit→Publish` line + ONE
  before/after dedup example. Nothing else. (The dense inventory/dedup/dual-rail moves to
  M0-spec, an engineer appendix, so nothing is lost but M0 stays calm.)
- **M-agency — The agency layer:** Workspace › Clients › Sites, shared-DS push, white-label,
  duplicate-as-template. The artifact that answers "where is the agency."
- **M2 — Editor, Pro mode (CANONICAL, drawn first):** full surface, the agency/designer's
  product. 4-item rail expanded to Pro depth, full inspector, breadcrumb, 3-reach.
- **M1 — Editor, Simple mode (the client view):** same screen, switch flipped — ≤4 rail,
  6 inspector sections, the constrained surface an agency hands a client.
- **M3 — Dashboard home:** the business side with the Clients layer, boundary respected,
  bridge to editor.
- **M4 — The one flow:** `Start (template/AI) → Edit → Publish`, orientation visible at
  every step.

## Process

M0 + M-agency first (cheap, decide everything) → re-run codex + CEO lens → lock →
M2 → M1 → M3 → M4, codex-reviewing each until no P1 "still overcrowded / disconnected /
where's the agency / user lost" findings remain. Iterate until the founder's 5-criteria
bar passes.

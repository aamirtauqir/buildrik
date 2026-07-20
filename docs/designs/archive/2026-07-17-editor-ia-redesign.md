# ⛔ SUPERSEDED — do not build from this file

> This was the first IA slice (4 job-GROUP icons: Create/Structure/Brand/History, accordion, AI inside CREATE).
> **Every one of those decisions has since been reversed.** The live IA is
> `2026-07-17-editor-product-redesign-complete.md` **§4.3** — a 6-icon, tool-based,
> frequency-ordered rail (Insert · Layers · Pages · Media · Content · Brand), swap-not-accordion,
> AI on ⌘K, settings on a separate Site page.
> Kept only as decision history — it is the source of the stale "4 rail groups" phrasing found in other docs.

---

# Editor IA Redesign — foundation (office-hours, 2026-07-17)

> Method: office-hours interview, foundation-first. 7 fundamentals locked WITH the founder before any screen work. This doc captures the locked foundation; screen design hands off to figma-product-design. Design doc, not code.

## The problem (founder's words, not the audit's)

Founder: "editor sahi se design nahi hua." Pushed for specifics → the felt problem is **clutter / "samajh nahi aata kahan jaaun"** — an **information-architecture** problem, NOT incomplete flows. The editor scatters navigation across 3+ surfaces (left rail + topbar + footer + command palettes); the user can't find things.

**Important tension (flagged, not resolved here):** the code audit (`docs/audits/2026-07-08-editor-deep-audit.md` §0.5) says the deeper truth is *flow-gaps* — only J3 (build) is a complete end-to-end job; J2 AI-draft is fake, J5 sign-off has no client UI. **Decluttering the IA will NOT make sign-off work.** These are two tracks: (1) this doc = fix the IA/clutter (what the founder feels + asked for); (2) separate track = complete the broken jobs (eng/product). Both real. Don't let the IA redesign masquerade as fixing the flows.

## Locked foundation (7 decisions, founder-confirmed)

| # | Fundamental | Decision |
|---|---|---|
| 1 | **WHO** | Agency designer (OWNER/ADMIN/DESIGNER) who builds CLIENT sites then ships after client approval. Not solo-freelancer, not end-client. |
| 2 | **WEDGE** | **Client sign-off loop** — the one job Webflow does badly (agencies duct-tape email + Figma-comments + Loom). This is the differentiator. |
| 3 | **Felt problem** | **Clutter / confusing IA** — navigation scattered, no clear "where do I go." NOT incomplete flows (that's the separate eng track). |
| 4 | **IA principle** | **All editor-concern surfaces live on the LEFT** — one predictable navigation spine, not spread across topbar/footer/modals. |
| 5 | **Rail contents** | LEFT = Create · Structure · Brand · History (the editing surfaces). Publish, Site-settings, Review, device/zoom/preview = **chrome** (actions/meta), stay in topbar/footer. |
| 6 | **Inspector** | **Stays RIGHT.** Add/navigate on the left, edit-selected-element on the right, canvas between — industry-standard (Webflow/Framer/Figma), because "add" and "edit-selected" are two distinct mental modes and cramming both left overloads the rail. "Important on the left" = all NAVIGATION left; inspector = contextual edit right. |
| 7 | **Entry point** | On open: **rail collapsed to 4 job-GROUP icons** (Create/Structure/Brand/History), canvas maximized. Click a group → its tools expand. Progressive disclosure — user sees the site first, navigation is calm (4 groups, not 9-11 loose tools). This is the direct fix for "kahan jaaun." |

## The resulting IA

```
CURRENT (the clutter): navigation lives in 3 places —
  left rail (4 tools OR 11 tabs) + topbar (undo/device/preview/publish/AI✨/⋯/⌘K) + footer (⌗/zoom/sync)
  → "samajh nahi aata kahan jaaun"

NEW:
┌───────────────────────────────────────────────────────────┐
│ TOPBAR (chrome/actions):  undo · device · preview · publish · ⋯ │
├──────┬──────────────────────────────────────┬─────────────┤
│ LEFT │                                      │  INSPECTOR  │
│ RAIL │              CANVAS                   │  (right —   │
│ (4   │           (maximized)                │  selected   │
│ job  │                                      │  element    │
│ grps)│                                      │  edit)      │
├──────┴──────────────────────────────────────┴─────────────┤
│ FOOTER (chrome):  structure ⌗ · zoom · sync · breadcrumb   │
└───────────────────────────────────────────────────────────┘

LEFT RAIL — all editor-concern, job-grouped, collapsed by default:
  ▸ CREATE     Insert · Templates · Components · Media · AI
  ▸ STRUCTURE  Pages · Layers
  ▸ BRAND      Design / Styles (tokens, colors, fonts, spacing)
  ▸ HISTORY    Versions
  (click a group → tools expand in the drawer; one group open at a time)
```

## What changes from today

- **AI moves** from the topbar ✨ into the rail's CREATE group (it's a create tool). (Already consolidated to one AI surface — AITab — this pass; a floating ⌘K launcher was deferred as a design task, see audit §5h D2 + design-review D-T3.)
- **Rail collapses to 4 groups** — the current 4-tool rail (Insert/Pages/Styles/Site) and legacy 11-tab rail both become 4 job-groups with progressive disclosure.
- **Topbar/footer stay as chrome** — but audited for clutter (only true actions remain).
- **Inspector unchanged** (right) — confirms the prior 2026-06-29 object-rail decision is NOT reversed; the rail stays navigation, inspector stays contextual-edit.

## NOT in scope (deferred, one line each)

- **Completing the broken jobs** (J2 AI-draft, J5 client sign-off UI, J4 brand-push) — separate eng/product track; decluttering doesn't fix them.
- **The sign-off wedge screens** — the wedge is locked as the priority, but its actual client-facing surface design is the NEXT design doc (this doc is the editor-shell IA only).
- **Visual/craft polish** (fonts, color, premium feel) — the founder's problem was IA/clutter, not "looks amateur"; craft is a later pass.
- **Floating ⌘K AI launcher** — deferred design task from the AI consolidation.

## The assignment (do this next — concrete)

1. **Design the two rail states in Figma** (hand to `figma-product-design`): (a) the collapsed 4-job-group default + maximized canvas, (b) one group expanded (start with CREATE). Use the locked IA above as the spec.
2. **Then watch one real agency designer** open it and try, without help, to: "add an element" and "send this to the client for review." Bite your tongue. Note where they hesitate — that's whether the declutter actually worked. (Watch, don't demo.)

If they find both in under 5 seconds each, the IA is right. If they hunt, the grouping is wrong — iterate the grouping, not the pixels.

## Handoff

- **Screens** → `figma-product-design` with this doc as the spec (locked IA + the 4 job-groups + collapsed/expanded states).
- **The separate flow-completion track** (J5 sign-off, J2 AI) → its own office-hours/spec — do NOT bundle into the IA redesign.

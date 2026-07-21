# Dashboard Design-Audit Fixes — Design

**Date:** 2026-07-22
**Status:** Approved (design), pending implementation plan
**Scope:** Visual + interaction fixes from the 2026-07-22 dashboard design audit. Tokens only (DESIGN.md); one interaction change (Sites filter merge). No new features.

## Goal

Close the real defects the audit surfaced. The dashboard is otherwise coherent (one `#406ED6` accent, primitive-driven, consistent type) — these are targeted fixes, not a redesign.

## Non-goals (explicitly out)

- **Workspace URL `buildrik.io/slug` (audit 2.1)** — misspelled brand AND a likely-stale domain (BYO-Vercel: published sites go to the workspace's own Vercel, not `buildrik.io/slug`). Fixing it right needs a product decision on the published-site URL model. **Flagged for product, not touched here.**
- **Section-nav consistency (audit 3.3)** — Media (left sub-nav) vs Settings (card directory) vs Agency (tabs) are different but not defective; unifying them is its own design. Deferred.
- No functional/data changes beyond the Sites filter interaction merge.

## Fixes

### F1 — Ecosystem pages stop sprawling / Resources void (audit 1.1)

The four full-width ecosystem pages render content edge-to-edge; Resources (2 cards) floats in ~90% empty space and reads as broken.

- Constrain content to a centered `mx-auto max-w-[1200px]` on **Marketplace, Learn, Resources**. (Templates already uses `mx-auto max-w-[1180px]` — bump it to `1200` so all four match one value.)
- Resources stays 2 cards (kept thin by prior decision); centered inside the constrained width it no longer floats. The 2-col card grid keeps its existing sizing; at `max-w-[1200px]` the two cards sit left-aligned in a readable column rather than in a full-bleed void.
- Files: `app/dashboard/marketplace/page.tsx`, `learn/page.tsx`, `resources/page.tsx`, `templates/page.tsx` (root wrapper only).

### F2 — Sites list: one filter bar (audit 1.2)

`projects/page.tsx` has two filter systems: a `showArchived` "All sites / Archived" tab row AND a status filter (`SiteFilters`) whose options already include Archived — plus a redundant dashed "New folder" tile duplicating the top-right "New folder" button.

- **Drop the `showArchived` tab row.** Fold Archived into the single status filter as one option: `All · Published · Draft · Archived`. The page's existing `status` state already holds the uppercase enum; remove the separate `showArchived` state and route "Archived" through `status = "ARCHIVED"`.
- **Remove the dashed "New folder" tile** from the grid; keep the top-right "New folder" button as the single folder affordance.
- The archived-count badge (currently on the Archived tab) moves onto the Archived status chip.
- Files: `app/dashboard/projects/page.tsx`, `components/sites/site-filters.tsx` (read both at implementation; the merge touches the filter row + the `showArchived`/`status` wiring). **This is the one interaction change — verify deep-links (`?status=published`) and the folder view still work.**

### F3 — Marketplace app-card CTA weight (audit 1.3)

Grid cards mix a filled blue "Install" (Commerce) with ghost "Set up in Integrations" (others); the lone filled button randomly pulls focus.

- All app-card grid CTAs use the **ghost/secondary** weight. The featured (ink) card keeps the single filled primary CTA — one primary per screen (DESIGN.md accent rule).
- File: `app/dashboard/marketplace/page.tsx` (the `Button` in the non-Connect branch → `variant="ghost"` / secondary, matching the Connect branch's `ButtonLink` weight).

### F4 — Marketplace featured tile: flatten gradient (audit 2.2)

`marketplace/page.tsx:115` — the illustration tile is `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)`. DESIGN.md bans gradients.

- Replace with a solid fill `var(--color-primary)` (flat accent tile). Icon stays.

### F5 — "FEATURED" eyebrow off amber (audit 2.3)

`marketplace/page.tsx:102` — eyebrow uses `var(--color-amber)`; amber is DESIGN.md's semantic *warning* colour, not decoration, on an ink card.

- Change to an on-ink neutral: `rgba(255,255,255,0.6)` (matches the card's muted body) or `var(--color-primary)` tint. Recommend the white-muted to keep the card monochromatic-on-ink. Keep amber for warnings only.

### F6 — Learn "Continue learning" surface: confirm flat tint (audit 2.4)

Verify the card background is a flat `var(--color-primary-subtle)` (`#EBF1FF`) and not a gradient. If a gradient, flatten. File: `app/dashboard/learn/page.tsx`.

### F7 — Media empty state gets a primary action (audit 3.1)

`media/page.tsx` empty state ("No assets yet" + text) has no CTA; Upload is only top-right. DESIGN.md empty-state rule = one primary action.

- Add an **Upload** primary button inside the empty state that triggers the same upload flow as the top-right button.
- File: `components/media/media-library.tsx` (the empty state lives in the library component, not the page).

### F8 — Sites card thumbnail placeholder (audit 3.2)

The site card thumbnail is a flat light-blue rectangle when there's no preview.

- Replace the bare fill with a typographic placeholder (site initial or a muted "No preview" on `var(--color-bg-subtle)`), matching the template-card placeholder pattern (centered muted icon). File: the site-card component under `components/sites/`.

### F9 — DESIGN.md doc-drift (flag → update)

DESIGN.md §"Dashboard Shell + Design System" still describes the OLD IA: sidebar "Home · **Projects** · Agency · Media · **Templates** · Settings" + a "Support group (Getting started · Help center)", and top nav "Dashboard · Marketplace · Learn · Resources". Shipped IA (this session): Templates moved to the **topbar ecosystem**, Help moved into **Resources** (no Support group), Projects label → **Sites**.

- Update that section + the top-nav line to match shipped IA. Doc-only; no code.

## Constraints

- All values reference DESIGN.md tokens (`--color-primary`, `--color-primary-subtle`, `--color-bg-subtle`, text tokens, radius scale). No hardcoded hex except where a token doesn't exist (none needed here).
- `max-w-[1200px]` is a layout literal used consistently across the four ecosystem pages (Templates already uses a near value); acceptable per DESIGN.md's "artifact-matched pixel values allowed."
- Preserve all functionality; F2 is the only behaviour change and must keep deep-links + folder view working.

## Testing

- **Unit:** F2 — if the status-filter merge has a pure mapping (param ⇄ status), unit-test it; else rely on live-verify. No other fix has testable logic.
- **Live-verify (authed browser), before/after per screen:**
  - F1: Marketplace/Learn/Resources/Templates content centered at ≤1200px, Resources no longer a void.
  - F2: Sites shows one filter bar (All/Published/Draft/Archived), no separate Archived tab, no dashed folder tile; Archived filter returns archived sites; `?status=published` deep-link still selects Published; folder open/close still works.
  - F3: all marketplace app-card CTAs one weight; only the featured card is filled.
  - F4/F5: featured tile is flat accent, eyebrow not amber.
  - F7: media empty state shows a working Upload CTA.
  - F8: sites thumbnail shows a typographic placeholder.
- **Gate:** `tsc --noEmit` clean + affected vitest green.

## Rollout

Local `main` (solo workflow). Not tied to a deploy. F1–F8 are dashboard-package edits; F9 is a doc edit.

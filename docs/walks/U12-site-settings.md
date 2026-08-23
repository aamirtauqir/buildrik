# U12 · Site settings — walk record

Walked 2026-08-24 · localhost:3000, 1440×900, real session.

## How it opens

**Not from the rail.** The rail has six tabs — Insert, Layers, Pages, Media,
Content, Brand — and none is Site. The PRD's *"Rail Site (S)"* is stale. The
doors that work: ⌘K → **"Open Settings panel · S"**, and the site menu's
**Site settings**.

It opens **full-screen**, not in the sidebar drawer. That matters for probing:
`[data-testid="sidebar-panel"]` measures **1 px wide** while settings are up,
which reads exactly like the "Settings never painted" bug this repo fixed in
August. It is not that — the surface is simply somewhere else. Confirmed by
screenshot, after the measurement said the opposite.

## What is actually there — and the count is wrong in the PRD

| group | sections |
|---|---|
| **SITE** | General · Branding · SEO |
| **DISTRIBUTION** | Export · Domains · Analytics · Localization |
| **PLUMBING** | Custom code · Redirects · Headers · Forms · Integrations `Pro` · Webhooks |
| **WORKSPACE** — *"opens dashboard ↗"* | Members · Billing |

**13 in-editor sections across 3 groups, plus 2 workspace deep-links.** The PRD
says *"10 sections in 3 groups + 3 workspace deep-links (Domains/Members/Billing
→ dashboard)"*. Both numbers are stale, and the reason is a real product change:
**Domains moved out of the workspace deep-links and into the editor's own
DISTRIBUTION group.** It is a section now, not a link away.

Good details worth keeping: the WORKSPACE group is labelled *"opens dashboard ↗"*
so the boundary is stated rather than discovered, and `Integrations` carries a
`Pro` badge in the row rather than behind a click.

## The seventh wrong reading today

My probe reported the Settings panel as empty, and it was one step from being
filed as a regression of a real, previously-fixed bug. The panel *was* empty —
because settings do not render in it. Looking at the screenshot took ten seconds
and settled what three timed measurements could not.

Six of the other seven came from truncated or partial views; this one came from
measuring the right property on the wrong element.

## Not covered

The drill-in mechanics (root ⇄ section, the 180 ms lock, the dirty guard), the
central dirty counter and its sticky savebar, and what each of the 13 sections
actually does.

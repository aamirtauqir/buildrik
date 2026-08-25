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

---

## Addendum, 2026-08-25 — two settings surfaces, and the menu row names the wrong one

Lane of `docs/plans/2026-08-25-editor-flow-walk-arc.md`.

### The door works — my probe was breaking it

Site menu → **Site settings**, printed with the chord `⌃,`. Both the row and the
chord route to the same handler (`AquibraStudio.tsx:347` —
*"T9: same handler the site menu's 'Site settings' row uses"* →
`modals.openProjectSettings`).

Both looked dead for three probe runs. They are not. **My own
`stripDevOverlays` helper was deleting the modal**: it swept every `body > *`
with `z-index >= 9000`, and a portaled product modal matches that. The chord
opened the dialog and the helper removed it before the read. Fixed in the same
commit — the sweep now skips anything carrying or containing
`[role="dialog"] / [aria-modal="true"]`, negative-tested (modal present before
strip → still present after, dev overlay gone).

Recording it because it is the sixth false "this is missing" reading this arc
has caught before filing, and the second one caused by my own tooling.

### What actually opens — and it is not "Site settings"

`⌃,` opens a `role="dialog"` reading:

```
Project settings
General · Canvas · SEO
PROJECT NAME
AUTHOR / DESCRIPTION
Cancel · Save
```

That is `ProjectSettingsModal.tsx` — **three** tabs, project name, canvas
defaults, SEO.

There is a **second, larger** settings surface: `SettingsTab`, rendered through
`FullPageRouter.tsx:87`, carrying **13 in-editor sections** (General · Branding ·
SEO · Export · Domains · Analytics · Localization · Custom code · Redirects ·
Headers · Forms · Integrations · Webhooks) plus **2 workspace deep-links**
(Members · Billing).

**Finding — the menu row and the surface disagree on their own name, and the
better-matching surface is a different one.** The row says *Site settings*; the
dialog it opens is titled *Project settings* and holds three tabs; the thing
that actually looks like site settings has thirteen sections and lives
somewhere else. A user following the row's label does not arrive at the
thirteen sections.

Low severity, and possibly deliberate — a quick project-level dialog next to a
full settings area is a normal split. But the two are not distinguishable from
the menu, and Ch.11:226's "13 sections + 2 workspace deep-links" describes only
the second one without saying which door reaches it.

### Still not covered

The drill-in mechanics (root ⇄ section, the 180 ms lock, the dirty guard), the
central dirty counter and its sticky savebar, and what each of the 13 sections
actually does. This pass reached the modal, not the full-page surface.

### What this walk did NOT assess

Visual and IA beyond the naming mismatch above. Behaviour, state and data only.

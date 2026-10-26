# Priority order (owner, 2026-10-27)

Owner approved working the every-day surfaces first ("kar lo"). Every manifest row
carries a `tier` (rules and reasons in `scripts/design-2l9/assign-tiers.mjs`):

- **P1** — every-day editing: shell, canvas, Layers, Pages, Add, Inspector, CMS
  records and binding, the publish tray, Play journeys F1–F4.
- **P2** — the rest of the product surface: Brand, Assets, Components, Templates,
  resources, recovery, Site settings screens, site menu and ⌘K, the other CMS
  screens, Play F5 outside the approval code.
- **P3** — later: ruler guides, trash/restore, form-submission and settings state
  grids, client review page, permissions matrix, analytics, plans/trial,
  collaboration, visitor form runtime, class-first, client approval code.

Lanes finish their P1 rows (drift lists first) before P2, and P2 before P3.
`node scripts/conformance/census-2l9.mjs --tier P1` shows what is open in a tier.
P1 is the first shippable milestone: when P1 is done the work is reviewed, PR'd
and offered to the owner for deploy, without waiting for P2/P3.

Status at adoption: P1 104/707, P2 179/676, P3 138/891 done.

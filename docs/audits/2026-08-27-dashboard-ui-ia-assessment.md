# Dashboard UI + IA — what is actually wrong, measured

2026-08-27. Founder's ask: make the dashboard UI better, say what doesn't look
good about the IA, and check whether the design really runs on Flowbite +
Tailwind. Reference shared: a sparkpixel.studio-style dashboard — icon rail +
grouped sidebar, breadcrumb, one row of pill filters, rounded cards with tiny
uppercase titles.

Everything below is measured in a real browser at 1440×900, not eyeballed.

## The headline: it isn't the palette, it's the furniture

Buildrick's colours, type and spacing already match the reference's restraint —
neutral grays, one accent, hairline borders, small uppercase eyebrows. Two other
things make it read less finished.

**1. Too much chrome before content.** Sites had FOUR stacked control bands
between the page title and the first site: header actions, a folder band, a
search row, a filter row. The search box was its own row at an arbitrary 620px,
aligned to nothing on either side.

**2. One control, many shapes.** 24 distinct button variants across 8 screens.
The same primary action renders three different ways:

| Button | height | size / weight | left pad |
|---|---|---|---|
| "Create a site" (Home) | 42px | 13.5px / 600 | 14px |
| "New site" (Sites) | 40px | 14px / 500 | 20px |
| "Invite" (Team) | 36px | 14px / 500 | 16px |

Secondary buttons are worse: 40px, 38px, 36px and 30px all appear as
"an outlined button", and the Sites filter row alone had a 26px pill next to a
30px rounded-md next to a 40px header button.

### Why it happened — an override that silently does nothing

Dashboard app code writes UNPREFIXED Tailwind; flowbite's own base classes are
`tw:`-prefixed. So `<Button className="justify-start">` produces an element
carrying both `tw:justify-center` and `justify-start`, twMerge cannot dedupe
across the prefix boundary, and the computed value stays `center`. The override
is an orphan class — in the DOM, backed by nothing that wins.

That is very likely why 237 screens reached for a raw `<button>`: **the
primitive looked un-overridable.** `tw:justify-start` works. Now in AGENTS.md.

## Fixed in this pass

- **Sites: four control rows → one.** Search joins the status chips and
  sort/filters on a single strip; sort and filters take the same pill shape as
  the chips. First site card moved up **~190px** — above the fold, not below.
- **Folder card: 220px poster → row.** It was ~70% empty (icon pinned top,
  label pushed down by `mt-auto`). A folder is a filter, not a site.
- **Card checkboxes appear on hover / while selecting**, not permanently on
  every tile. The members table already behaved this way.
- **Home Quick actions use the Button primitive**, so "Create a site" and
  "New site" are finally the same button.

## IA — what still doesn't sit right

**1. The top nav mixes two kinds of thing.** `Dashboard` is underlined as a peer
of `Marketplace · Learn · Resources · Templates`. But Dashboard is *the app* and
those four are catalogs you visit occasionally. Same visual weight, very
different frequency. The reference solves this with a vertical icon rail for
app-level areas and never puts them in a row with the workspace.

**2. Home's H1 is a greeting.** "Good evening, Taiba" carries no information on
a screen opened twenty times a day, and there is no breadcrumb or context row
under it — the reference has `Dashboard › Company` plus a filter strip. Site
detail already has a breadcrumb; the top-level screens don't.

**3. The stat row is four different cards.** Sites has a donut, Published has a
LIVE pill, Visitors has a flat grey line, Team has an empty right half. One row,
four right-hand treatments, and the flat line reads as a broken chart rather
than "no traffic". *(That flat baseline is a deliberate, documented call —
design audit G1/G3, 2026-07-24, "honest empty, not a fabricated series". Left
alone. Worth revisiting as a taste call, not a bug.)*

**4. ~40% of Home's viewport is empty.** Content stops around y=855 of 1250.
The two bottom cards are padded to match each other rather than sized to
content, so Recent activity carries ~120px of nothing under its two rows.

**5. The site card is mostly decoration.** A 300px pastel block with one ~90px
letter, and the actual information — name, domain, pages, visitors, status —
compressed into the bottom quarter. The reference's cards lead with data.
DESIGN.md's own anti-slop direction argues against decorative fills this large.

**6. The sidebar's storage widget is orphaned** — pinned to the very bottom with
~700px of empty column above it.

**Not a problem, despite the reference:** the sidebar's six flat items. The
reference groups fourteen items under four labels; Buildrick deliberately
trimmed 19 → 6 (IA v2, 2026-07-17) and settled on a single group 2026-07-21. You
don't label groups of two. **Copying the reference here would be a regression.**

**The best screen is Settings** — grouped eyebrow labels, icon tiles, a 2-col
grid, chevrons. It is already at the reference's quality bar, and the language
is sitting in the codebase unused by the screens that need it most.

## Flowbite + Tailwind — the honest answer

**Tailwind: yes, everywhere.** Unprefixed in app code, `tw:`-prefixed for
flowbite internals, one token contract in `globals.css`.

**Flowbite: about a third adopted.**

| | |
|---|---|
| Primitives composing flowbite | **5 of 13** (button, data-table, modal, pill, progress-bar) |
| Primitives still raw markup | 8 (section-card, stat-card, input-field, filter-chip, filter-tabs, icon-chip, page-header, metric-value) |
| Raw HTML controls in screens | **310** — 237 `<button>`, 33 `<input>`, 15 `<select>`, 14 `<textarea>`, 11 `<table>` |
| Files importing flowbite-react directly | 15 |

AGENTS.md says a raw control in a screen "means one of the three above was
skipped". It is skipped 310 times. That — not the layout — is what produces 24
button variants, and it is the single biggest lever on how finished the product
looks.

## What I'd do next, in order

1. **Convert the 8 raw primitives to compose flowbite**, starting with
   `input-field` and `filter-chip` (highest screen count). Every screen inherits
   consistency without being touched.
2. **Sweep the 237 raw `<button>`s onto the Button primitive** — now that
   overriding it actually works.
3. **Give the top-level screens a context row** (breadcrumb + filters) the way
   site detail already has, and demote the greeting.
4. **Rebalance the site card** toward data over the pastel block.

1 and 2 are mechanical and safe. 3 and 4 are design decisions and should go
through Figma first.

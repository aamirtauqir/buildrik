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

**2. One control, many shapes.** *(Corrected 2026-08-27, same day: the true
product count is **9**, not 24. The original probe counted every `<button>` on
the page, which included Claude's devtools and agentation overlays rendering
their own buttons into the document. Stripping the overlays and scoping to
`<main>` gives 9, and 6 of those are legitimately distinct roles — chip,
segmented tab, ghost, primary, sm-primary, upload target. The genuine
divergence was two buttons on the Team screen. The lesson is the one already in
this repo's memory: the dev overlay impersonates the product.)*

The same primary action did render three different ways:

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

**5. The site card leads with decoration.** *(Numbers corrected: the source is
`aspect-[16/10]` with a `text-[38px]` initial — not "a 300px block with a ~90px
letter", which was eyeballed off a 2x screenshot without dividing by the device
pixel ratio. At `lg:grid-cols-3` on 1440 the cover is roughly 219px of a ~320px
card, so about 68% cover to 32% information — the direction of the point holds,
the magnitude was overstated by 2.4x.)* The reference's cards lead with data.

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
| Primitives composing flowbite | **4 of 13** (button, data-table, pill, progress-bar) — this table said 5 and included `modal`; `modal.tsx` names flowbite only in a comment explaining why it rejects it |
| Primitives still raw markup | 8 (section-card, stat-card, input-field, filter-chip, filter-tabs, icon-chip, page-header, metric-value) |
| Raw HTML controls in screens | **310** — 237 `<button>`, 33 `<input>`, 15 `<select>`, 14 `<textarea>`, 11 `<table>` |
| Files importing flowbite-react directly | 15 |

AGENTS.md says a raw control in a screen "means one of the three above was
skipped". It is skipped 310 times. That — not the layout — is what produces 24
button variants, and it is the single biggest lever on how finished the product
looks.

## What I'd do next, in order

*(Superseded by the autoplan review — see
`docs/plans/2026-08-27-dashboard-flowbite-sweep.md`. Items 1 and 2 as written
here did not survive it. Seven of the eight primitives have no flowbite
counterpart, and `input-field` would LOSE documented behaviour by converting;
`filter-chip` has 3 consumers, not "the highest screen count". The 237 is a
count of `<button>` tags, including menu rows, nav-rail items and icon
triggers — the standalone-button population is about 15. What the review found
instead was a set of live defects the sweep would have papered over: two radius
scales compiled side by side, a second blue in every progress bar, a focus ring
at 1.1:1, and status pills rendering as 4px boxes. Those were fixed.)*

---

# Density pass — 2026-08-28

Founder: *"text kabi bara hai cards kafi barey hein or is ko tora sa is trah ka
batnoo"* — the type ran large and the cards ran tall. A tightening pass across
every screen, measured live at 1440×900 before and after.

## The type ramp moved, so it moved for everyone

| Token / value | was | now |
|---|---|---|
| `--text-page-title` | 24px | **20px** |
| `--text-section-title` | 15px | **14px** |
| StatCard hero metric | 27px / 730 | **22px / 700** |

The H1 was optically outweighed by the four 27px stat metrics beside it — the
numbers read as the page title and the title as a caption. `730` was not a token
either. `PageHeader` was hardcoded to `text-[24px]` while eight screens used the
`text-page-title` token, so the ramp could have moved without it; it is on the
token now.

## Spacing

| Surface | was | now |
|---|---|---|
| PageHeader bottom margin | 24px | 20px |
| SectionCard header / body | `px-5 py-3.5` / `p-5` | `px-4 py-3` / `p-4` |
| StatCard padding | 16/18 | 13/15 |
| Table + row rhythm (5 files, 25 sites) | `px-[18px]` | `px-4` |
| Table cell height | `py-3.5` | `py-3` |
| Activity row | `py-[13px]` | `py-2.5` |
| Settings tile / group gap | `py-4` / 32px | `py-3` / 24px |
| Workspace switcher | 48px | 40px |
| Media empty state | `p-12` | `p-8` |

**The row rhythm was not cosmetic.** Once `SectionCard`'s header went to 16px,
every full-bleed row inside a `padding="none"` card still sat at 18px — the
header title and the first row's content were misaligned by 2px on every table
in the dashboard. Unifying to 16px is what keeps them on one edge.

## Site card — the decoration/information split

`aspect-[16/10]` → **`aspect-[16/7]`**, initial `38px` → `26px`, body `p-4` →
`px-4 py-3`. Card height **320px → 205px**. The grid gains `xl:grid-cols-4`, so
all four sites land in one row above the fold instead of one row filling the
whole viewport. The narrower column made the meta row wrap onto two lines, fixed
with `whitespace-nowrap` and `gap-2.5` — measured `scrollWidth === clientWidth`,
so it fits rather than clipping.

## Two real defects the walk turned up

1. **A CTA that `text-center` could not centre.** The media empty state and the
   publish error screen both put a `Button` inside a `text-center` block. The
   `Button` primitive renders a flowbite **flex** button, which that rule does
   not touch — it sat left of a centred icon and heading. Both now wrap it in
   `flex justify-center`.
2. **Recent activity carried ~50px of nothing.** The home bottom row stretched
   both cards to the taller one's height (audit item #4 above). `items-start`
   lets each size to its content.

Also tightened: the Team / Plans / Usage action bands, which sat a full 24px
band below the settings layout's own header and read as a gap with nothing in
it (`-mt-1 mb-4`).

## Verified

- 12 screens walked live at 1440×900: `text-page-title` computes to 20px on
  every one, no horizontal overflow on any.
- `gate:ds` 7 passed · `gate:figma` pass · `gate:trpc-orphans` pass ·
  `gate:button-variants` pass (8/8 routes, 6 shapes, all declared — the density
  change did not move a button off its declared shape).
- Full suite green.

**Not done, and deliberately:** the Team/Plans/Usage actions still live in a
band under the header rather than on the title row, because the settings layout
owns the `PageHeader` and hoisting them needs a slot on that layout — an IA
change, not a density one.

> **Reopened the same day.** The founder's next instruction was "fixed all of
> these", which put this item back in scope; it ships below via a portal. Noting
> it here because a later review read the two sections as the boundary quietly
> collapsing on its own, which is the failure mode this line was written to
> avoid. It moved because the founder moved it.

## Selects — the same defect the audit named for buttons, still live

The walk of the Workspace screen turned up a native OS dropdown sitting beside
DS-styled inputs. Measured across the fifteen `<select>` elements in the
dashboard: **six different shapes.**

| Where | shape |
|---|---|
| `workspace-form` | local `SELECT_FIELD_CLASS`, 42px / `rounded-lg` / `--shadow-ring` |
| `profile-form` | `px-3 py-2 rounded-md border focus:ring-2` |
| `redirects-tab` | `px-2 py-1.5 rounded-md border` |
| `theme-manager` | `px-3 py-1.5 rounded-lg border` |
| `submissions-panel` | `px-3 py-1.5 rounded-lg border` (`text-body-sm`) |
| `media-library`, `ticket-form` | `px-3 py-2 rounded-lg border` |

Two radii, three paddings, two focus treatments — and every one of them kept
`appearance: auto`, so the arrow was the operating system's and matched none of
the DS chevrons beside it. `workspace-form`'s comment claimed its class was
"matched to InputField", but it used `--shadow-ring` where InputField uses a
`--color-border-input` hairline, so it did not match either.

**`components/dashboard/primitives/select-field.tsx`** is the fix — the same
42px / radius-lg / inset-ring contract as `InputField`, `appearance-none` plus a
lucide chevron, and a `size="sm"` (32px) for the dense rows where 42px would
break the rhythm. Twelve of the fifteen are converted. Three exceptions, each
declared in the guard with its reason:

- the primitive itself;
- `onb-select` — onboarding runs its own token namespace until its reskin;
- `tab-nav` — the narrow-viewport tab switcher, a nav control that happens to be
  a `<select>`.

**Measured after:** 2 product shapes, `42|8px|13.5px|none|chev` and
`32|8px|12px|none|chev`. Down from 6, and no OS arrow left.

`select-field.test.tsx` is the guard — 4 tests, including an inventory test that
fails on any new raw `<select>` outside the declared list. **Watched to fail:**
reverting one converted select produced
`expected [ 'components/help/ticket-form.tsx' ] to deeply equal []`.

Also on that screen: **the accent-colour row had two identical blue squares** —
an `<input type="color">` and a preview `<div>` painted with the same value,
flanking the hex field. The picker already shows the live colour, so the preview
was duplication that made the row read as two controls for one value. Removed;
the picker moved from 36px/`rounded-md` (the only two such values on the page)
to 42px/`rounded-lg` so it lines up with the hex field beside it.

## Alignment — a class of bug, found by measuring instead of looking

Screenshots did not surface this; a probe that read `h1.getBoundingClientRect().left`
on all twelve screens did. Nine sidebar screens put the H1 at **x=333**. Two did
not:

| Screen | h1.x | cause |
|---|---|---|
| `/dashboard/activity` | **483** | `mx-auto max-w-3xl … py-8` |
| `/dashboard/getting-started` | **483** | `mx-auto max-w-[760px]` |
| `/dashboard/sites/[id]` | 389 | the 44px site avatar sits left of the H1 — by design, the block still starts at 333 |

Both offenders centred their column inside a shell that is already offset by the
sidebar, so the title slid ~150px sideways on the way in from Home. `max-w` kept
(the checklist should not stretch to 1400px), `mx-auto` dropped. Activity also
lost a `py-8` that started its header lower than every other screen's.

Re-measured after: **all ten sidebar screens at x=333.**

The catalog pages (`learn`, `marketplace`, `resources`, `templates`) keep their
`mx-auto max-w-[1200px]` — they render without the sidebar, so centring there is
correct, not the same bug.

Two more things this pass turned up on the site-detail screen:

- **Two controls, one destination.** A breadcrumb `Dashboard › Sites › <site>`
  and a `← Back to sites` link stacked under it, both pointing at
  `/dashboard/projects`. `sites/[id]/layout.tsx` is `SiteHeader`'s only render
  site and always draws the breadcrumb, so the back link was removable with no
  reachability loss.

## Second pass — the four screens the gate could not see

The button gate ran eight routes. Billing and Plans were not among them, and
both carried exactly the defect the gate exists to catch. Adding them turned up
three undeclared shapes:

| shape | where | what it was |
|---|---|---|
| `30\|8px\|12px\|500\|border` ×15 | Team → Pending invitations | "Revoke", hand-rolled at 30px **beside a 36px "Resend" in the same table cell** — and painted with `--color-primary`, the accent, while hovering to red. The accent colour on a destructive action. |
| `40\|8px\|14px\|600\|fill` ×2 | Plans | the plan-card CTAs at weight 600 |
| `42\|8px\|14px\|600\|border` ×1 | Plans | a fourth button height |

All three are gone — moved onto the `Button` primitive, not declared away. The
gate now runs **10 routes, 8 shapes, all declared.**

### The settings sub-pages had their actions in the wrong place

Team, Plans, Usage and Billing each drew a right-aligned band *under* the
layout's header, because `settings/layout.tsx` owns the `PageHeader` (D10.4) and
a page had no way to reach its `actions` prop. Every other screen in the
dashboard puts its actions on the title row.

`components/dashboard/shell/page-actions.tsx` closes it: the layout renders a
slot inside `PageHeader actions`, and a page portals into it. A portal rather
than context on purpose — the actions are a `ReactNode`, and a node held in
context state changes identity every render, so the provider re-renders its own
subtree in a loop. A DOM node is stable.

Plans' billing-cycle toggle moved onto `FilterTabs` in the same edit; it was a
hand-rolled track with a blue-fill active segment, a second track shape doing
Media's job. `FilterTabs`' `label` widened from `string` to `ReactNode` for the
"−20%" badge.

### Three more defects on those screens

1. **A button that was not a button.** Billing's current-plan card ended in a
   full-width blue block reading "Active" — a `div`, the largest and most
   button-shaped thing on the screen, and it did nothing. The card already said
   it twice above, in the accent "Current Plan" pill. Removed.
2. **The usage bars coloured by identity, not by headroom.** A hardcoded
   `TILE_TONE` from the design mockup meant "Form submissions" drew amber at
   **0/100**, while amber means "approaching the limit" on every other bar in
   the product — and "Team members 2 / 1", *over* the limit, drew in accent blue
   while the Billing screen drew the same fact in red. Two screens, one fact,
   two answers. Now `tone="auto"`, the ProgressBar behaviour that already
   existed. This deviates from the mockup deliberately: colour cannot mean
   "which metric" and "how close to the limit" in the same product.
3. **The Usage header said the header's job twice.** Its loading fallback read
   "Track your workspace usage against plan limits." while the layout's own
   description reads "Bandwidth, storage & credits". It shows the billing period
   or nothing now.

### A premise that was never checked

The plan doc carried an open defect: "`disabled: pointer-events-none` suppresses
native `title` tooltips". **Measured: false.** A disabled `Button` computes
`pointer-events: auto` here. flowbite does ship a `tw:pointer-events-none`
class, but not on this component's disabled state. The five gated controls do
now carry their `title` on a `<span>` wrapper — browsers genuinely disagree
about showing a *disabled* control's own tooltip — but the mechanism written
down for a day was the wrong one.

## The rest of the dashboard — 50 routes walked

The first pass covered 12 screens. This one covered the other 38: every agency
tab, every settings sub-page, all nine site-detail tabs, and the four
sidebar-less catalogs. Measured the same way — `text-page-title` computed on the
H1, plus a horizontal-overflow check.

**Clean on 47.** Three were not:

| Screen | H1 | what it was |
|---|---|---|
| `/dashboard/templates` | **19px / 680** | a hardcode nothing else in the app used |
| `/dashboard/help` | **30px / extrabold** | the only 30px in the dashboard |
| `/dashboard/sites/new` | 20px | on the ramp, but titled **"Create New Site"** — Title Case, where every other screen is sentence case |

Templates went onto `text-page-title`. Help's centred hero went onto
**`--text-display`** (28/700) — a token that had existed since the reskin with
**zero consumers**, which is exactly the surface it describes. "Create New Site"
became "Create a site"; "Submit a Support Ticket" and "Search Results" got the
same treatment.

### And one card named for half of what it opens

The settings directory listed **"Delete workspace"** under the Danger zone
group. That card opens a page that also deletes *your account* and exports your
data — and because the layout titles a sub-page with the card's own label, the
destination said "Delete workspace" three times: the H1, the card title inside
it, and the button. Renamed to **"Delete workspace or account"**.

### 16px headings, on a ramp with no 16px

`text-base` — raw Tailwind, 16px — appeared 21 times. The DS ramp goes 28 / 20 /
14 / 14 / 12 / 11; there is no 16px step, so every one of those was a section
heading sitting *above* the section-title size and only 4px under the page H1.
After the ramp tightened, that gap closed further and they started reading as
competing titles. **13 converted** to `text-section-title`. The three left are
not headings — an avatar tile's initials and two metric numerals, where 16px is
a deliberate glyph size.

### Two harness lies caught before they became findings

- `/dashboard/settings/plans` reported **41 characters of text**. Re-probed: 300+
  characters, zero console errors. The first read happened while Turbopack was
  still compiling the route.
- Seven site-detail tabs reported **no H1 and 72 characters**. The site id in the
  route list belonged to a workspace the current session cannot see, so all
  seven were rendering "site not found" correctly. Re-walked with an id from the
  session's own workspace: **nine tabs, all at 20px, no overflow.**

---

# Review pass — 2026-08-28 (autoplan: Codex + two independent agents)

Three reviewers read the arc cold: Codex as CEO, a Claude agent as CEO, a Claude
agent as senior engineer. Between them they found **fourteen real defects in
work that had already passed four gates and a full suite**, plus two places
where the written record had drifted away from the code.

## What the reviewers found that the gates could not

**A break I introduced and proved with a one-viewport measurement.** The site
grid's `xl:grid-cols-4` fires at 1280px. At 1280 the card is 215px and the meta
row needs 238px, so `whitespace-nowrap` clipped it — on every card. At 1366, one
card. The "measured `scrollWidth === clientWidth`" proof recorded above had been
taken at **1440 only**. Re-measured at 1280 / 1366 / 1440 / 1920 / 2560 and moved
the 4-up to `2xl:`: **0 clipped at all five widths.**

**A ramp step of zero.** `--text-section-title` went 15→14 in the density pass
while `--text-body` is also 14 — section headings and body copy became the same
size, separated by weight alone, and thirteen former 16px headings were
converted *down into* that collapse. The founder asked for the page title and
the cards to come down, not for a level of hierarchy to be deleted.
**`--text-section-title` is back to 15px.**

**The primitive built to end "one control, many shapes" shipped a new one.**
`SelectField size="sm"` was 32px; `Button size="sm"` is 36px. On the site
redirects row they sat side by side — measured, `delta=-4`. `sm` is 36px now
(`delta=0`); `md` stays 42px to match `InputField`, because a select in a form
column belongs to the field rhythm and a select in a control bar belongs to the
button rhythm. `theme-manager` had the same defect the other way (a 42px select
beside a ~30px hand-rolled button); both are `sm` now and the neighbour is on the
primitive.

**The centring bug, reintroduced two files from where it was fixed.** The
plan-comparison Upgrade CTAs sit in a `text-center` `<td>`. Converting them to
`Button` made them block-level flex boxes, which `text-align` cannot position —
the exact defect this same arc fixed in the media empty state and the publish
error screen. Fixed with `inline-flex` on the wrapper.

**A class that could never match.** `wrapperClassName="… disabled:cursor-not-allowed"`
put a `:disabled` variant on a `<div>`. `:disabled` only matches form controls,
so the locked Security notification row lost its cursor. The orphan-class
pattern, in a file edited to remove orphan classes.

**A `title` that reached nobody.** Five disabled controls carried their reason in
a `title` on a `<span>` — hover-only, invisible to keyboard and screen-reader
users. Three of them were repeating copy already visible in the same row
("Resent 2/2 times", "Only the workspace owner can delete this workspace.", a
button labelled "Coming soon"), so the tooltip added nothing and is gone. The
billing one was **the only carrier of its reason anywhere on the page** — that
one is visible text now.

**ARIA deleted by a consolidation.** The Plans billing-cycle toggle carried
`role="tablist"`, `aria-label` and `aria-selected`. `FilterTabs` emitted none, so
moving onto it would have been a net accessibility loss — and Media and Activity
had been shipping without it all along. `FilterTabs` now takes a required
`label`, renders `role="group"`, and marks `aria-pressed` per segment. Verified
live: the toggle reports `aria-pressed=false,true` and reprices $29→$23.

**A CTA with no hover.** An inline `backgroundColor: "transparent"` on the
BUSINESS plan's ghost button beat the hover *class* in every state. Moved to
classes.

**Dead code holding a live import.** `PlanCard`'s `{!isCurrent && onChangePlan}`
CTA: one call site, and it passes `isCurrent` unconditionally. The branch could
never render. Removed, with the prop and the `Button` import.

**A gate blind to half its population.** `check-button-variants.mjs` scanned
`button`. `ButtonLink` renders an `<a>`, so **every navigation CTA in the
dashboard was outside the gate whose whole job is one button shape.** Widened to
`button, a` (multi-line labels excluded — those are cards). It immediately found
five more divergences: the site card's hover overlay ran a 28px fill beside a
30px border at the off-contract 6px radius; the marketplace hero was 38px; and
the section-tab constant was `rounded-sm` (6px) under a doc line claiming parity
with the sidebar's `rounded-md` (8px). All fixed on the contract, two genuine
nav/hero roles declared.

**A gate wired into nothing.** `gate:button-variants` was written on 08-27 and
was in no chain — the same shape as `gate:figma`, which this repo watched sit red
for five days. Now in `pre-push`, with the flat 9s-per-route settle cut to 3s
(90s → 58s, same ten shapes). It **skips loudly** without a dev server or
`BK_STATE` rather than blocking a push on a missing prerequisite. Watched both
ways: skip branches print, and a planted undeclared shape returns exit 1.

## Two documentation defects — the record had drifted from the code

- The plan doc still listed **W0 (`@theme` in `tw-flowbite.css`) as "not done"**
  a day after it shipped. Codex read that line and concluded the arc had dodged
  the systemic fix and paid the tax manually across dozens of files. The code was
  right; the doc was wrong; **the doc is what got reviewed.**
- This audit said the settings action hoist was "not done, and deliberately",
  and then recorded it as done further down with no bridge. A reviewer read that
  as a scope boundary quietly collapsing. It moved because the founder's next
  instruction moved it, and it says so now.
- `DESIGN.md` was edited to match the new ramp. That is backfilling a spec to
  ratify a change, so the authorization is now recorded in the file itself,
  along with the `--text-metric` token (which the block's own comment had named
  since the reskin while three files hand-rolled `text-[22px]`).

## Flows executed, not inspected

Everything above this section verified *rendering*. The founder's instruction was
"make sure every flow is wired and nothing is broken", so six flows were run
end to end against the live app:

| Flow | Result |
|---|---|
| Plans — billing cycle toggle | monthly `$0,$29,$79` → yearly `$0,$23,$63`, `aria-pressed=false,true` |
| Sites — search filters the grid | 4 cards → empty state ("No sites found") → 4 cards |
| Sites — grid ⇄ list | grid renders, table renders |
| Team — Select mode | 0 → 2 row checkboxes |
| Workspace — a converted `SelectField` | `en` → `es` committed, restored |
| Media — New folder | dialog opens |

**Zero console errors across all six.** Plus a separate sweep of **37 routes**:
0 console errors, 0 5xx, 0 error states, 0 blank pages. And the settings-actions
portal across seven client-side navigations: exactly one slot on every sub-page,
actions repopulating on each hop including the return to Team, zero errors.

One flow flagged as "UNEXPECTED" and was **my harness, not the product** — the
search test counted the empty state's `<h3>` as a site card.

## What the reviewers raised that is the founder's call, not mine

- **The site card cover, 16:10 → 16:7.** Both CEO voices independently called
  this a product opinion, not density: for a website builder the thumbnail of
  the site you built is the demo, and the population here is four sites, not
  fifty. Left as shipped; flagged for the founder.
- **Whether this arc was the right work at all.** Both CEO voices said the
  highest-leverage hour is live Stripe Prices and a first analytics event, not
  dashboard furniture. Recorded against a standing founder decision from 08-25
  that put Vercel and Stripe out of scope — noted so the disagreement is on the
  record rather than silently overruled.

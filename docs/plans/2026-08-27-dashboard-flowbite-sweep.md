# Dashboard consistency sweep — Flowbite adoption at the primitive layer

Source: `docs/audits/2026-08-27-dashboard-ui-ia-assessment.md`.
Branch: `main` (solo, direct-to-main per repo convention).

## Premises

These are the claims the plan rests on. Each was measured, not assumed.

**P-A. The dashboard's inconsistency is a control-layer problem, not a layout problem.**
Measured: 24 distinct button variants across 8 screens; the same primary action
renders at 36px, 40px and 42px tall, at 13.5px/600 and 14px/500. Colours, type
scale and spacing already match the reference the founder shared.

**P-B. Screens bypass the primitives because overriding them silently failed.**
Measured: `<Button className="justify-start">` produces an element carrying both
`tw:justify-center` and `justify-start`; computed `justifyContent` stays
`center`. twMerge cannot dedupe across the prefix boundary. `tw:justify-start`
works. 310 raw HTML controls exist in screens against AGENTS.md's rule that a
raw control means a primitive was skipped.

**P-C. Fixing the primitive layer propagates without touching screens.**
8 of 13 primitives are raw markup. A screen composing `SectionCard` inherits any
fix to it. This is why the primitive layer is sequenced before the button sweep.

**P-D. Items 3 and 4 are design decisions, not consistency fixes.**
A breadcrumb/context row and a rebalanced site card change what the product says,
not just how uniformly it says it. DESIGN.md is the authority and the founder's
lane is Figma. These do not belong in a mechanical sweep.

## Scope

**IN**

- **W1 — Primitive layer.** Convert the 8 raw primitives to compose flowbite-react
  where flowbite has the control: `input-field`, `filter-chip`, `filter-tabs`,
  `icon-chip`, `section-card`, `stat-card`, `page-header`, `metric-value`.
  Where flowbite has no equivalent (`metric-value` is a `<span>` with
  `tabular-nums`), state that and leave it — a wrapper for its own sake is a
  pass-through, banned by CLAUDE.md.
- **W2 — Button sweep.** Move raw `<button>` in screens onto the `Button`
  primitive, highest-traffic screens first. Not all 237 — the count includes
  menu items, icon triggers and table-row affordances that are legitimately not
  the `Button` shape. Target: the ones that render as a *button* and diverge.
- **W3 — Regression guard.** A test that fails when a screen's primary action
  diverges from the primitive's shape, so variant creep cannot return silently.

**NOT IN SCOPE** (deferred to TODOS.md)

- Breadcrumb / context row on top-level screens (design decision → Figma).
- Site card rebalance away from the pastel block (design decision → Figma).
- The `VISITORS` flat sparkline (documented decision, design audit G1/G3).
- Editor package primitives — different lane, actively edited by another session.

## What already exists

| Need | Exists | Action |
|---|---|---|
| Button shape | `primitives/button.tsx` composes flowbite `Button` | reuse |
| Modal | `primitives/modal.tsx` composes flowbite `Modal` | reuse |
| Pill | `primitives/pill.tsx` composes flowbite `Badge` | reuse |
| Table | `primitives/data-table.tsx` composes flowbite `Table` | reuse |
| Progress | `primitives/progress-bar.tsx` composes flowbite | reuse |
| Text input | flowbite `TextInput` | adopt in `input-field` |
| Toggle group | flowbite has no segmented control | keep raw, document |
| Tabular number | flowbite has no equivalent | keep raw, document |

## Risk

The prefix trap (P-B) is the live hazard: adopting a flowbite component means
its base classes arrive `tw:`-prefixed, and any existing unprefixed override in
a consuming screen silently stops applying. Every conversion must be measured in
a browser (`getComputedStyle`), not read.

Second hazard: `npx flowbite-react build` must run when a new flowbite component
is imported, and it corrupts `tw-flowbite.css` (injects an `@import` inside a
block comment, deletes the `@plugin` directive). Guarded by
`flowbiteStore.prefix.test.tsx`; the diff must still be read.

## Verification

- `getComputedStyle` before/after on every converted control, in a real browser.
- Distinct-variant count across 8 screens must go DOWN from 24; measured by the
  same probe that produced that number.
- Full suite green (104 files / 689 tests at plan time).
- `gate:trpc-orphans`, `gate:ds`, `gate:figma` green.
- Visual check of each touched screen at 1440x900.

---

# GSTACK REVIEW REPORT

Dual voices: Codex (eng) + two independent Claude subagents (eng, design).
Consensus was unusually strong, and it **invalidated the plan's two headline
items**. Recorded rather than quietly rewritten, because the failure mode is the
interesting part.

## Consensus

| Dimension | Codex | Claude eng | Claude design | Consensus |
|---|---|---|---|---|
| W1 "convert 8 primitives" sound? | no | no | no | **CONFIRMED — reject** |
| Sequencing primitives-before-screens? | no | no | n/a | **CONFIRMED — invert** |
| `tw:` override claim correct? | partly | yes, measured | yes | **CONFIRMED** |
| jsdom can test this? | no | no | n/a | **CONFIRMED — Playwright** |
| "24 variants" a sound metric? | n/a | no | no | **CONFIRMED — reject** |
| Is the primitive layer the real defect? | no | no | **yes, but a different one** | DISAGREE → investigated |

## What the review killed

**W1 is void.** Seven of the eight primitives have no flowbite counterpart:
`page-header` and `section-card` are layout structure, `stat-card` paints via an
inline style object (so a wrapper changes nothing rendered — a pass-through,
banned by CLAUDE.md), `filter-chip` is a `<button aria-pressed>` where Badge is a
`<span>`, `filter-tabs` is a controlled track where flowbite Tabs owns its
panels, `icon-chip` computes a `color-mix` tint, `metric-value` is 8 lines.
Only `input-field` has a counterpart, and converting it would drop the
inset-shadow hairline, the wrapper-level disabled dim, and the hairline-only
invalid/valid states — all decision-log 2026-07-29 behaviour.

**W2 is void as framed.** "237 raw buttons" counts `<button>` tags: menu rows,
nav-rail items, icon triggers. The standalone-button population is ~15, and the
genuine divergence was **two buttons on the Team screen**.

**The success metric was a Goodhart trap.** "Variant count must go DOWN from 24"
is satisfiable by sweeping every button onto one shape — including a shape with
an invisible focus ring and an off-contract radius. The metric would go green on
a worse dashboard.

**And the 24 was wrong anyway.** Re-measured with dev overlays stripped and
scoped to `<main>`: **9**, of which 6 are legitimately distinct roles. The
original probe counted Claude's devtools buttons as product UI.

## What the review found instead — four live defects, all verified in a browser

1. **Two radius scales compiled side by side.** `rounded-md` = 8px unprefixed,
   `tw:rounded-md` = 6px. `tw-flowbite.css` compiles flowbite against the STOCK
   Tailwind theme; the DS `@theme` block lives in `globals.css` and is invisible
   to it. Every flowbite internal reaching for `rounded-md`/`rounded-sm` is
   off the DESIGN.md contract. **Open — see below.**
2. **A second blue in every progress bar.** `progressTheme.color.blue` is
   `bg-blue-600` = `#1C64F2`. DESIGN.md's accent section is titled "the guard
   against a second blue" and names `#1A56DB`. **Fixed.**
3. **The focus ring on every secondary button was invisible.** flowbite ships
   `focus:ring-4 ring-gray-100` for `light`, which `ghost` maps to — `#F3F4F6`
   at 4px, about 1.1:1 on white. WCAG 1.4.11 wants 3:1. **Fixed**, and moved to
   `focus-visible` so a mouse click no longer flashes a halo.
4. **Status pills were not pills.** `Pill` passed unprefixed overrides that lost
   to flowbite's prefixed base: rendered `display:flex`, 12px text, 4px radius,
   8/2 padding. The `text-eyebrow` token never applied. **Fixed.**

Defects 2–4 are the same mechanism the plan named as a future hazard (P-B) —
already live, inside the primitives that had *already* been converted.

## Corrected in the source documents

- **AGENTS.md said `tw:` classes "compile to nothing".** False: `@source` is
  additive, not exclusive. Verified twice — by compiling `tw-flowbite.css` with
  a probe class, and by measuring `tw:justify-start` win in a browser. That
  sentence is the best available explanation for the hand-rolling.
- **AGENTS.md, DESIGN.md and the audit all said "six/5 of thirteen" compose
  flowbite and listed `modal`.** It is **four**; `modal.tsx` names flowbite only
  in a comment explaining why it rejects it. A grep for the string counts the
  comment.
- **The audit's site-card measurement** ("300px block, ~90px letter") was
  eyeballed off a 2x screenshot without dividing by the pixel ratio. Source is
  `aspect-[16/10]` / `text-[38px]`.

## Still open — founder calls, not sweeps

- **W0: give `tw-flowbite.css` a `@theme` block** so flowbite compiles against
  the DS radius/colour/text scale. One file, every flowbite component on
  contract, zero screens touched. This is what P-C promised and W1 could not
  deliver. Not done here: it changes the rendered radius of every flowbite
  component at once and wants its own before/after pass.
- **`ghost` maps to flowbite `light`, a bordered white button** — there is no
  transparent variant, which is why screens hand-rolled one. Decide whether the
  DS has two or three neutral button variants.
- **Breadcrumb on Sites/Media/Settings.** `components/dashboard/breadcrumb.tsx`
  already exists and already ships on site detail, so this is primitive
  application, not new design. Home cannot take one (it returns null at ≤1
  level). Deferred with the greeting question, which IS a design call.
- **`disabled: pointer-events-none` suppresses native `title` tooltips**, so a
  disabled control's reason is unreachable. Affects the admin-gating shipped
  earlier today. Needs a tooltip that is not `title`.

## Verification run

- 4 defects fixed, each measured in a browser before and after.
- `gate:ds` 7 passed, `gate:figma` pass, `gate:trpc-orphans` pass.
- `gate:button-variants` added — declares a role per button shape, fails on an
  undeclared one.

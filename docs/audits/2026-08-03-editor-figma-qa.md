# QA — "the UI is entirely different than Figma"

**Date:** 2026-08-03 · **Branch:** main · **Target:** editor shell, `localhost:5050` @1440×900
**Tier:** Standard (fix critical + high + medium) · **Mode:** design-conformance
**Reference:** Figma `g4GzQFqzNYz5sosz1QtZXC` — Buildrick — Product

---

## The finding that reframes the complaint

**Figma has no full-editor frame.** The file is a component library: atoms
(Button, Input, Badge), molecules (Panel header, Nav item), and a handful of
per-surface frames (`19:46` Drawer, `19:47` Right panel, `681:122` Topbar,
`20:6` GATE A). There is no composed screen to diff a screenshot against.

So "entirely different" cannot be answered as one comparison. It has to be
answered surface by surface, property by property — which is what this run did.

And when you do that, the divergence splits into three piles, and only one of
them is bugs:

| Pile | Count | What it means |
|---|---|---|
| **Real defects** | 2 | Nobody decided this. Fixed. |
| **Deliberate divergence** | 3 | The code is *newer* than the board. Board is stale. |
| **Fidelity gaps, need a call** | 3 | Real differences, but with a tradeoff or a blast radius. Deferred to you. |

The single most useful correction to the premise: **on the topbar, the board is
behind the code more often than the code is behind the board.**

---

## Health score

| Category | Before | After |
|---|---:|---:|
| Console | 100 | 100 |
| Visual | 62 | 92 |
| Functional | 100 | 100 |
| Accessibility | 85 | 85 |
| **Weighted** | **86** | **95** |

Console: 1 error, a 401 on an unauthenticated API call in the standalone demo —
expected without a session, not a defect.

---

## Fixed

### QA-001 · high · Publish CTA shipped with a 2px black ring
`7683eabc`

The primary call-to-action had a black outset border around the blue. Visible at
1× in the default state.

**Root cause.** `chrome-reset.css` calls itself a "minimal reset … replaces
preflight" but replaced only half. Tailwind's preflight zeroes borders
(`border: 0 solid`) precisely because the UA stylesheet puts `border: 2px outset
ButtonBorder` on form controls. That half was missing, so any chrome control not
setting its own border kept the UA one. flowbite's `<Button>` doesn't set one.

**Why it hid.** Nearly every other control carries `tw:border-0` or
`tw:border-transparent` at its call site. Those read as styling choices; they are
workarounds for this missing reset.

**Measured twice — the first number was too small.** A sweep of the default shell
found 1 leak in 42 controls. That was scoped to one surface. The parity baselines
then showed `content-field-rows>9` and `>15` carrying the same `2px outset` on a
surface the shell never renders. **The baselines had recorded the defect as
expected output.**

**Fix:** one line in the reset, scoped to `button/input/select/textarea` (the only
elements the UA borders), `solid` not `none` so a later `border-width` still
paints, in the `reset` layer so `tw:border-*` utilities still win.

**Baselines regenerated and audited, not trusted:** all 32 changed values across 5
surfaces are `border-*` or width/height. Zero other properties changed. Zero keys
added or removed. Every size delta is exactly **±4.00px** — 2px of border on two
sides; controls shrank by it, containers grew by it.

`screenshots-2026-08-03-qa/qa-001-publish-before.png` → `qa-001-publish-after.png` (4×)

### QA-002 · medium · Publish rendered 8px taller than the design
`af315d82`

Board `681:26 btn/publish` is 32px tall with 13px medium text. It rendered 40px
with 14px text.

**Cause.** Both Publish branches (`Topbar.tsx:209` blocked, `:219` ready) rendered
a bare `<Button>` with no `size`, taking flowbite's default md. Every other Button
in the same bar declares `size="xs"`. The asymmetry is the bug — the one call site
where the prop was never passed, on the most prominent control in the editor.

**After, against the board:** height 32 · font-size 13px · weight 500 · padding
0 20px · radius 8px · background `#1a56db` · colour white. Every value exact.
Width lands 85.6 vs the symbol's 82 — text metrics, not geometry.

`screenshots-2026-08-03-qa/qa-002-topbar-before.png` → `qa-002-topbar-after.png` vs
`figma-681-26-topbar.png`

---

## Not defects — the code is newer than the board

Do not "fix" these to match Figma. Each carries its rationale in-source.

| What the board shows | What renders | Why |
|---|---|---|
| Save status as a green tinted pill (`#def7ec` / `#057a55`) | plain muted grey text | `SaveStatus.tsx:53` — **T8/D7 rule 4, text-first**: saved/saving/unsaved are plain; only offline/error/conflict get tint |
| Review pill amber (`#fdfdea`) "In review · 3 open" | neutral grey pill | `Topbar.tsx:236` — **T8/D7 rule 3, neutral-unless-blocking**: only "Changes requested" blocks a publish, so only it keeps amber. The bar's colour budget goes to signals that gate publishing |
| No eye / comment / shield icons | three tool icons render | `Topbar.tsx:275` — "Eye/Comment/Spinner: Figma nodes **pending**". The board hasn't caught up |

I flagged "review pill missing" mid-run and was wrong: `ReviewBadge`
(`Topbar.tsx:253`) and the bell's unread dot (`:182`) both exist and are
state-dependent. With no review open and no unread notifications, absent is
correct.

---

## Deferred at the time — ALL THREE SUBSEQUENTLY FIXED

Kept as written so the reasoning is legible, with outcomes appended. D1
`8b65eef8` · D3 `d8f82204` · D2 `e1782ef9`. D3 turned out to be five controls,
not one, and now has a gate locked at zero (`e2e/target-size.spec.ts`).

### D1 · IconButton is 28×28, the board says 32×32
`Icon.tsx:51` — `tw:h-7 tw:w-7`. Figma's Icon button component is 32×32 and its
doc states the reason: *"32×32 so it clears the 24px touch minimum."*

**Not an a11y violation** — 28 already clears WCAG 2.5.8's 24×24 minimum. It is a
fidelity gap with a **13-instance, 10-file blast radius** that visibly changes the
whole chrome. No decision record exists for 28. Worth doing, but it's a look
change across the editor, not a bug fix.

### D2 · Exit button off on four properties
Board `btn/exit`: h28 · px10 · 12px **regular** · `#111827`.
Renders: h32 · px12 · 12px **medium** · `#4b5563`.

Geometry is unambiguous. **The colour is not:** `GHOST_BTN_CLASS` sets grey-600
resting → grey-900 on hover. Matching the board's grey-900 at rest would delete
that hover affordance. The board only draws a rest state, so it can't settle it.
Cosmetic; deferred per Standard tier.

### D3 · Controls below the 24×24 target minimum
Exposed by measurement, pre-existing, not caused by either fix.
`content-field-rows` entries 9/14/15 measure **21.92 × 18** — under WCAG 2.5.8's
24×24. They were 25.92 × 22 before, but 4px of that was the QA-001 black border,
which was never real spacing. Both readings are under the minimum.

---

## Also noticed

**`GHOST_BTN_CLASS` duplication — the figure below was WRONG, corrected
2026-08-03.** This section originally read "duplicated verbatim in 4 files".
That grep matched only the constant NAME. The literal string is inlined about
**130 times**, behind **16 separate `const GHOST*` definitions**. The repo's own
CLAUDE.md bans exactly this, but at that size it is not a QA-sized refactor — it
belongs to the open one-component-system inline drain, and is left there.

**Untracked directories appeared mid-session** and are not mine:
`packages/editor/{MISSION,NOTES,RESOURCES}.md`, `assets/`, `learning-records/`,
`lessons/`, `reference/`. None sit under `src/`, so the CI reference-snapshot
guard is unaffected. Flagged because the repo is in collaborative mode.

---

## Verification

- Leaked-border sweep: **1 → 0** of 42 controls
- Style parity: **6/6** (baselines regenerated, every delta audited)
- chrome-ui + StudioHeader: **34 files, 269 tests, 0 failed**
- `verify:ds`: **13 gates PASS**, every ratchet unchanged
- Insert drawer pixel-identical after the reset change — nothing lost a border

**PR summary:** QA found 8 differences from Figma; 2 were defects and are fixed,
3 were deliberate divergences where the board is stale, 3 need a product call.
Health 86 → 95.

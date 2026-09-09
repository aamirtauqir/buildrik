# `--bk-ink-muted` is only accessible on white

**Status:** founder decision required. The fix is a Figma edit, not a code edit.
**Found:** 2026-09-08, by the conformance contrast sweep across 37 measured surfaces.

## The measurement

Re-measured 2026-09-08 across **105 conformed surfaces** (up from 37):
**71 failing text/icon nodes on 25 surfaces**, 11 distinct colour pairs.

**49 of the 71 — 69% — are one token on one class of background:**

| foreground | background | ratio | floor | count |
|---|---|---|---|---|
| `--bk-ink-muted` `#6B7280` | white `#FFFFFF` | **4.83** | 4.5 | passes |
| `--bk-ink-muted` `#6B7280` | `--bk-bg-subtle` gray-100 `#F3F4F6` | **4.39** | 4.5 | **39** |
| `--bk-ink-muted` `#6B7280` | blue-50 `#EBF5FF` | **4.38** | 4.5 | **9** |
| `--bk-ink-muted` `#6B7280` | green-50 `#DEF7EC` | **4.29** | 4.5 | **1** |

Stated as one sentence: **the design system's muted text colour passes on
exactly one background — pure white — and fails on every tint the system
itself ships.** It is used 699 times in `src/`.

The remaining 22 are listed at the end; none is systemic in the same way.

> **A caution about this number, since the instrument was wrong twice.**
> An earlier run reported 94 nodes. 23 of those were an artifact of teaching
> `measure.mjs` to fold ancestor opacity: the Insert drawer sits under the coach
> mark at effective opacity 0, the foreground blended entirely into the
> background, and 18 nodes came back at a ratio of exactly **1:1** — gray-500 on
> white, which is 4.83, i.e. arithmetically impossible. Invisible text is now
> skipped rather than failed. **Zero impossible ratios remain**, which is the
> check that says the count above is real.

## Why this is not an implementation bug

The boards specify this pairing. An agent conforming the compare-mode strip to
its board *introduced* two fresh 4.39 instances, correctly — the board draws
ink-muted on a gray-100 chip. Every implementer who follows the board will keep
reproducing it. This is a token-level defect being faithfully transcribed.

That is also why it must not be fixed per-site: 699 call sites, each of which
would be deviating from its board to do it.

## The minimal fix

`--bk-ink-muted` darkened `#6B7280` → `#646C79` clears AA on all four surfaces
with the smallest perceptible change:

| candidate | white | gray-100 | blue-50 | green-50 | worst |
|---|---|---|---|---|---|
| `#6B7280` today | 4.83 | 4.39 | 4.38 | 4.29 | 4.29 |
| `#68707D` | 5.00 | 4.54 | 4.53 | 4.43 | 4.43 (still fails green-50) |
| **`#646C79`** | 5.30 | 4.82 | 4.80 | 4.70 | **4.70 — clears** |
| `#4B5563` (= `ink-soft`) | 7.56 | 6.87 | 6.85 | 6.70 | 6.70 (collapses the two tiers) |

`#646C79` is preferred over reusing `ink-soft`: `ink-soft` is 6.87 on gray-100,
which erases the muted/soft distinction the scale exists to draw.

## Why an agent cannot just do this

`--bk-ink-muted` lives in `src/themes/tokens.generated.css`, which is generated
from `scripts/tokens/figma-tokens.json` and checksum-locked by
`gate:tokens-generated` (wired into `verify:ds` and the pre-push hook).
Hand-editing it fails the build by design.

The supported path is: **change the value in Figma → re-export
`figma-tokens.json` → `node scripts/tokens/generate.mjs`.** That restyles muted
text everywhere at once, which is the point, and is a founder call rather than
an agent's.

## The second systemic defect: `--bk-success` is a FILL token used as text

Same shape, different token, found while chasing the first.

`--bk-success` `#0E9F6E` is the fill for success surfaces. It is **3.39:1 on
white** and **3.00:1 on its own `--bk-success-tint` `#DEF7EC`** — the worst pair
measured anywhere in this arc. `--bk-success-text` `#057A55` exists precisely
for text and clears both (5.36 and 4.75).

**30 text-position uses of the fill token** are in `src/` (2 of those 30 are
`border-color` / `background-color` my grep over-caught, so ~28 are real):

| area | count | note |
|---|---|---|
| `editor/design-system/ui/**` | 8 | DraftChip, PresetBindingRow, ReviewModal, TokenDetailView, ColorTokenList ×2, MigrationProgressModal ×2 |
| `editor/sidebar/tabs/history/styles/history.css` | 4 | |
| `editor/sidebar/tabs/pages/page-settings/SeoTab.tsx` | 3 | |
| `editor/ecommerce/CollectionSetupModal.tsx` | 3 | three `<Check>` glyphs |
| `editor/sidebar/tabs/settings/**` | 3 | |
| everything else | ~7 | UpgradeModal, CatalogCard, ContentViews, ApprovedCompareView, OptimizationPanel, FolderTree, CMSCollectionSetupModal |

Three of them are the 3.00 case — `--bk-success` on `--bk-success-tint`:
`CatalogCard.tsx:41` (PILL), `ColorTokenList.tsx:140` (FIX_BTN),
`ContentViews.tsx:780`.

**This is NOT simply fixable in code, and the attempt proved it.** Swapping
`AgentPlan.tsx`'s applied-step glyph to `--bk-success-text` fixed the contrast
and immediately failed conformance three ways:

```
step-1-glyph  color  #0e9f6e  #057a55  FAIL  --color/success -> --bk-success
step-2-glyph  color  #0e9f6e  #057a55  FAIL  --color/success -> --bk-success
step-3-glyph  color  #0e9f6e  #057a55  FAIL  --color/success -> --bk-success
```

Board 171:67 **names `--color/success` for those glyphs**. Under the founder's
precedence rule — everything visual is the board's — the code does not get to
pick a different colour, so the swap was reverted and the surface is back to
30/30 PASS with the contrast failure baselined where it already was.

That makes the real fix a FIGMA change, and specifically **not** a change to
`--color/success`'s value: it is a fill, used behind success badges and dots,
and darkening it to clear text contrast would darken every one of those fills
for a problem they do not have.

The correct change is to **re-point the boards' text layers from
`--color/success` to `--color/success-text`**, then re-capture and re-conform.
That is a design job of the same shape as the Goal-2 arc (`apply-queue.mjs`,
`set-prop` / `fill` ops), not an implementation one.

Three instances WERE fixed in code during this arc by three different agents
(the modal success disc, the templates create-page tick, `AgentPlan.tsx`'s step
glyph — the last now reverted). Two of those survive only because their boards
do not name the token for that layer. **None of the three agents saw it was
systemic**, which is the argument for a lint rule rather than a sweep:
`--bk-success` in a text position should be banned outright, the same way
`--bd-*` and raw hex already are — and the ban should land in the same change
as the board re-point, or it will fail conformance on arrival.

`--bk-error` `#E02424` is 4.72 on white and passes, so its 76 text uses are not
a defect today — but they are the same latent mistake, and a darkening of the
error fill would break all 76 silently.

## The remaining 22, in full

| pair | ratio | count | where | status |
|---|---|---|---|---|
| gray-400 `#9CA3AF` on a composited `#888C93` | **1.34** | 8 | `s3-1-dragging`, `s3-1-pick-mode` — the floating align toolbar inside `.bd-selection-box`; that foreground is no token and looks inherited from the canvas subtree | real, canvas-overlay family |
| `--bk-error` `#E02424` on gray-100 | 4.29 | 4 | `s3-11` snap-guide labels | board-drawn pair |
| `--bk-success` `#0E9F6E` on white | 3.39 | 3 | `ai-done` ticks | see §2 — board names the token |
| white on `--bk-warning` `#C27803` | 3.51 | 2 | rollback + stale-approval confirms | board draws it; a primary confirm below the floor |
| ink-muted / accent on `.tt-drawer` `rgba(20,20,31,.97)` | 3.53 / 2.76 | 3 | `history-saves-time-travel` | dark-theme residue predating the 2026-04-18 light unification; no board covers the drawer |
| gray-300 `#D1D5DB` on gray-100 | **1.34** | 1 | a `/` separator | decorative, effectively invisible |
| ink-soft `#4B5563` on gray-100 | 3.40 | 1 | `history-saves-time-travel` | inside the same dark-drawer residue |

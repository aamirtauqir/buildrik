# Brand bug-fix batch — adversarial live QA (2026-10-05)

**Batch under test:** `fix/brand-brd23-brd24`, on main at `eaa257629`.
- BRD-23 `5eb924357`: exports declare every token they read.
- BRD-24 `45b8b01d8`: ⌘Z/⇧⌘Z/⌘Y never reach canvas history while Brand is open.

**Setup.** Worktree `buildrik-worktrees/qa-brand-bugs`, branch `qa/brand-bugs-2026-10-05`. Dashboard dev server on :3420, headless Chromium (Playwright 1.61.1) at 1440×900, account `qa@buildrik.local`.
- `sites.publish` was blocked at the route layer. Nothing was published.
- Scratch site `cmutd20ny00086frk2nape8gx`. It was snapshotted from the DB before the walk and restored after it. Its `projectSettings` is byte-identical to the snapshot, and the Home page `blocks` are back to the original 13 elements.
- Screenshots and harness are in the session scratchpad, `…/scratchpad/brandqa/`. File names are cited below.

## Verdict: CLEAN for this batch (0 defects)

There are 0 new defects in BRD-23 or BRD-24, and no code was changed. The known gap was reproduced and recorded. The pre-existing observations below are outside this batch.

## Defects table

| # | Finding | Status |
|---|---|---|
| — | No BRD-23 or BRD-24 defect found | — |
| K1 | **Known gap, reproduced.** Brand open with a staged Primary `#C2410C` → ⌘K → "Undo" → Enter. The staged draft is dropped: the save bar is gone and Primary is back to `#1A56DB`. A canvas element is deleted out of sight (21 → 20). Screenshots: `known-cmdk-*.png`. | Recorded (out of scope per brief) |
| K2 | **Known gap, not reproduced.** The toast Undo button over Brand. No toast with Undo was raised while Brand was open in this walk. | Recorded, not verified |
| K3 | **Known gap, not re-checked.** Legacy `--buildrick-design-color-blue-500` refs. None of the 757 inserted elements reference it: the 37 var names in the export do not include it. | Recorded |
| O1 | **Pre-existing, not Brand.** Autosave of a large page (~700 elements) fails: `sites.saveProject` returns 500 with a Prisma interactive transaction timeout (5000 ms exceeded in `tx.page.upsert`), followed by a 409. The toast reads "Could not save to dashboard". | Recorded |
| O2 | **Pre-existing, not tokens.** 2,435 computed-style diffs between canvas and export, none on a token-bound property (see below). They come from canvas-only affordances: empty-container placeholder bg `#F3F4F6` / 8px radius / dashed border / 16px padding, the canvas's own line-height 1.5 vs the export's 1.6, and inherited text colour. Class-styled built-ins (`.pb-progress` 16→14px) also differ. | Recorded for a separate canvas↔export fidelity audit |
| O3 | **Harness artifact, not a product defect.** While autosave was stubbed to 503, ⇧⌘Z redo intermittently did nothing, with or without Brand. With real autosave it was 6/6 green, and the ⌘K-door redo check passed on rerun. | Discarded |

## BRD-23 — exports

**What was placed (all through the live UI, plus one synthetic drop):**
- all 54 Add-panel elements;
- 8 Blocks;
- 13 of 14 Built-in Components (Accordion's row was not clickable in the harness; the Accordion element was inserted instead);
- all 27 Components-catalog components (button … feature-grid). These were placed by dispatching the real `application/x-buildrik-catalog-component` drop on the canvas, the same payload `CatalogRow` sets.

That gives 757 canvas elements, and 751 of them are present in the export by `data-buildrick-id`.

**What was exported:** single-file HTML and ZIP (`index.html` + `styles.css`), each through the Export modal and its real download.

**How it was compared:** the exported page was opened from disk at canvas width. For each element I measured computed height, padding, radius, border, colour, background, font family, size and weight, and line-height. I also scanned every `var(--x)` in every stylesheet and inline style for an empty computed value.

| Run | Undeclared `var()` | Unresolved inline `var()` | Token-bound property diffs |
|---|---|---|---|
| Defaults, single-file | 0 / 37 names | 0 | 0 |
| Defaults, ZIP | 0 / 37 names | 0 | 0 |
| Saved brand, single-file | 0 / 37 names | 0 | 0 |
| Saved brand, ZIP | 0 / 37 names | 0 | 0 |

- The canvas side also had 0 unresolved inline `var()`s.
- **Token-bound property diffs** means diffs where the element's export rule declares that property via `var(`. Every button and input seed (`btn-height-md`, `btn-padding-x`, `btn-radius`, `input-*`, `label-font-size`) resolves identically to the canvas. So do the catalog `--bd-border-default`, `--bd-sizing-container`, `--bd-zindex-*` and `--bd-motion-*`. Before `5eb924357` those were the 24px/no-padding buttons.

**Saved brand.** Primary was set to `#C2410C`, the Heading font to Geist Mono, `radius-sm` to 12px and `radius-md` to 14px, then applied through the review dialog ("Apply 4 changes"). The canvas picked these up live and after reload (`--buildrick-design-color-primary: #C2410C`, h2 `"Geist Mono"`).

The export token block carries the saved values, and each saved value also reaches its legacy alias:
- `--buildrick-design-color-primary:#C2410C`
- `--buildrick-design-font-heading:Geist Mono`
- `--bd-radius-sm:12px`, `--buildrick-design-radius-sm:12px`
- `--bd-radius-md:14px`, `--buildrick-design-radius-md:14px`

**Size.** The `:root` token block is **3,564 B** with 96 declarations (defaults), and **3,573 B** with the saved brand. That is about 1.9% of the 191,914 B single-file export of the 757-element page. In the ZIP the block sits in `styles.css` (59,367 B); `index.html` is 134,750 B and the archive is 28,563 B. That is not bloat.

## BRD-24 — undo chords

**Chords:** ⌘Z, ⇧⌘Z, ⌘Y, Ctrl+Z, Ctrl+⇧Z, Ctrl+Y.

**Doors:** rail, the `B` key, ⌘K "Open Brand", Site settings → "Brand ↗", and the Inspector's "Jump to token … in Brand".

**Steps run for each door:**
1. Add a canvas element.
2. Open Brand.
3. Press all 6 chords with no staged edit.
4. Stage Primary `#C2410C` and press all 6 chords again.
5. In the hex field, type and then press ⌘Z.
6. In a spacing value field, type, then press ⌘Z and ⇧⌘Z.
7. Discard and close Brand.
8. Press ⌘Z on the canvas, then ⇧⌘Z.

| Check (each of 5 doors) | Result |
|---|---|
| Chords without staged edit: canvas element count unchanged, Brand stays open | 5/5 PASS |
| Chords with staged edit: draft kept (save bar shown, Primary still `#C2410C`), canvas unchanged | 5/5 PASS |
| Hex field: ⌘Z is native text undo (`#64748BXY` → `#64748B`), canvas unchanged | 5/5 PASS |
| Value field: ⌘Z / ⇧⌘Z are native (`16px99` → `16px` → `16px99`), canvas unchanged | 5/5 PASS |
| Draft still staged after field undo | 5/5 PASS |
| Brand closed → ⌘Z undoes the canvas | 5/5 PASS |
| Brand closed → ⇧⌘Z redoes the canvas | 5/5 PASS (⌘K door on rerun with real autosave; see O3) |

Results are in `undo-results*.json`; screenshots are `undo-<door>-*.png`.

## Regression

- The Brand panel saves and applies through the review dialog, and the values persist after reload and in the DB.
- The canvas renders tokens: before the change it showed button `rgb(26,86,219)` / radius 8px, and after it showed `rgb(194,65,12)`.
- **Console:** no new errors from Brand or export. Remaining noise:
  - the pre-existing `[Recovery] Runtime fault: ResizeObserver loop…`;
  - the autosave failures in O1 and O3.

## Gates

No product code changed, so tsc, the editor suite and `verify:ds` were not run.

## NOT verified

- Toast Undo while Brand is open (K2): no such toast was raised.
- The Accordion row in Built-in Components: the click was intercepted in the harness. The Accordion element itself was covered.
- Publish output: publish was blocked by rule. Only Export single-file and ZIP were checked, and the shared `siteTokensCSS` is the same path publish uses.
- Dark mode and the `darkValue` export, tablet/mobile breakpoints, multi-page ZIP (the site has 1 page), React export, and headed real-keyboard (non-Playwright) chords.
- Ctrl variants inside the text fields: only the ⌘ variants were pressed there. All 6 chords were pressed outside fields.

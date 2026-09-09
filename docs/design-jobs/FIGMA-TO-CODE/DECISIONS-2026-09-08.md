# Founder decisions — 2026-09-08

Twelve calls, taken in one sitting against measured evidence. Each row says what
was decided, what it costs, and what has to change. Supersedes the open items in
`OPEN-DECISIONS.md` (written 04:23, stale) and closes several `BLOCKERS.md` rows.

Ordered by blast radius, largest first, because that is the order they will hurt
in — not the order they were asked in.

---

## 1. Inputs go to 32 tall / radius 6 · **the most invasive of the twelve**

**Decided:** follow board 149:108. `BK_TEXT_INPUT_THEME` becomes 32 tall,
radius 6, `--color/border-input`.

**Stop and read the cost before starting.** This is a **10px height change on
every text input in the product**, not a Content-panel fix. `authority=open:input-fill`
was opened because three sources give three answers:

| source | height | radius |
|---|---|---|
| board 149:108 (Content) | **32** | 6 |
| board 1170:4713 (records modal) | 42 | 4 |
| shipped `BK_TEXT_INPUT_THEME` | 42 | 8 |

Two of the three say 42, and the chosen answer is the minority. That is a
legitimate call — 149:108 is the board that draws inputs in their densest real
context — but it means:

- every input in Content, Media, Settings, Brand and the modals moves,
- **1170:4713 becomes wrong** and needs redrawing, or the hold reopens the first
  time someone measures the records modal,
- the textarea moves with it (56, not 64).

**Do this one on its own branch and re-sweep all 208 surfaces before merging.**
It is the single change in this list most likely to move something nobody
expected. The targets currently skipped under `open:input-fill` should be
un-skipped in the same commit, so the new value is actually measured rather than
still held.

## 2. Build E7 → E1 → E2, cheapest first

**Decided:** build all three ghost-board features, in cost order.

- **E7 · media dimensions + author.** `MediaAsset` has no `width`/`height`;
  `MediaAssetVersion` has no `createdBy`. Two Prisma columns and a writer at
  upload time. Days. Makes 146:2 (`2400×1600`) and 146:32 (author line) honest
  immediately. Note the escape hatch was already checked and closed: dimensions
  are **not** hiding in `generatedMetadata`, whose only writer is
  `alt-text.service.ts:159-171`.
- **E1 · perf audit.** Nothing ever writes `DEPLOYING` — it appears only in
  schema comments and *read* filters (`publish.service.ts:206`). The worker's
  own comment says `lighthouseScore stays null`. Needs the worker to write the
  state and run a real Lighthouse step. Four boards.
- **E2 · scheduled publish.** No `scheduledFor`, `schedulePublish` or
  `scheduled_publish` anywhere in `server/`, `prisma/` or the editor. Model,
  router, service and a job runner. Four boards. A whole feature — treat it as
  its own arc, not a tail.

## 3. Compare mounts at 1080 through `OverlayMount`

**Decided:** side-by-side and overlay open at 1080 via chrome-ui's
`OverlayMount` (Gate 22-compliant); **list mode stays in the 280 drawer.**

Closes `BLOCKERS.md` B1 and unholds boards 168:2, 168:26, 168:48. At 280 each
pane was ~140px, so "side by side" was only ever real on the board's own
surface. Existing recipes for the three Compare surfaces will need re-measuring
at the new width.

## 4. `--bk-ink-muted` darkens to `#646C79` · Figma edit

**Decided:** you change it in Figma; I re-export, run
`node scripts/tokens/generate.mjs`, re-capture the affected boards and re-sweep.

One token, **699 uses**, fixes **49 of 71** measured contrast failures at once.
Today it passes on exactly one background — pure white (4.83) — and fails on
every tint the system ships: gray-100 4.39, blue-50 4.38, green-50 4.29.
`#646C79` clears all four (worst case 4.70) and preserves the muted/soft tier
that reusing `ink-soft` (6.87) would collapse. Hand-editing
`tokens.generated.css` is a build failure by design (`gate:tokens-generated`),
which is why this has to start in Figma.

## 5. `--bk-success` stops being used as text · Figma edit

**Decided:** re-point the boards' text layers from `--color/success` to
`--color/success-text`; you do the Figma side.

`#0E9F6E` is 3.39:1 on white and **3.00:1 on its own tint** — the worst pair
measured anywhere in the arc — in ~28 text positions. The obvious code fix was
tried and **disproved itself**: board 171:67 *names* `--color/success` for those
glyphs, so swapping failed conformance three ways and was reverted. Pair the
board re-point with a lint ban on `--bk-success` in a text position, in the same
change, or the ban fails on arrival.

## 6. Save indicator gets accessible per-state colour

**Decided:** adopt `--bk-warning-text` / `--bk-success-text` / `--bk-error-text`
(8.93 / 5.36 / 5.74) and **redraw board 813:4836** to those tokens.

The board was right about the problem and wrong about the fix. Today saving,
saved and unsaved all paint the same grey, so the one control whose job is to
tell you your save state says nothing by colour. The board's own four hues exist
as **no token** and three **fail AA on white** (3.84 / 4.28 / 4.37). The recipe
currently refuses all four colours with the arithmetic recorded in `skipProps`;
un-skip them when the board is redrawn.

## 7. `--bk-ink-disabled` is the wrong token for real text

**Decided:** move the call sites to ink-muted/ink-soft; leave the token alone.

`#D1D5DB` is **1.47:1** on white and is used for the word **"required"** on a
mandatory field (`content-fields`) and **"in Marketing"** on page rows
(`pages-searching`). Board and code *agree* on the value, so nothing failed —
this is the one case where agreement is not evidence. `ink-disabled` is correct
for genuinely disabled controls, which WCAG exempts; it is not a text colour.

## 8. Template apply gets real per-section progress

**Decided:** derive labels from the landmark tags already in the markup, and
report **inside** the existing transaction.

`getSectionCount` already matches `<section|nav|header|footer|main|article`, so
the labels come from the template's own HTML and cannot drift from it — no
invented names. Two hard constraints:

- `importHTMLToActivePage` runs inside one `beginTransaction`, and the engine
  invariant is that a template apply is **a single undo step**. Emit progress
  events inside the transaction; do not split it.
- The parse is synchronous and likely tens of milliseconds. **Measure it on the
  largest template first.** If it is 40ms, show the modal past a threshold
  rather than padding it — the artificial `500ms` in the current code is exactly
  what this decision is replacing.

## 9. Layers excludes the root row

**Decided:** exclude it. An empty page reads **"0 layers"**, matching PRD 04:7
("Root excluded everywhere") over the contradicting 05:12.

Closes `BLOCKERS.md` B6 *and* makes board 143:355 reachable, so the Layers empty
state can finally be conformed. The root is a container the user never selects
or names; counting it leaked an implementation detail into a user-facing number.

## 10. "Bound" means element → preset

**Decided:** the boards' meaning wins. The PRD line (06:17) gets amended.

Closes B4 and unholds J-306:2111 / J-306:2136. It also gives the no-op picker at
14:310 a target for the first time: it picks a preset for the selected element.

---

## Already closed, and `BLOCKERS.md` does not know

- **B13** — the Media full-page folder column. Boards 1160:16/27/43 draw three
  named groups (SMART / FOLDERS / TAGS) with Trash at the foot; `FolderTree.tsx`
  now ships exactly that (`mgr-section-folders`, tags as chips, smart rows).
  Built during the 2026-09-08 conformance arc. Row should move to Cleared.

## Still open, and NOT asked about here

Small, but they will keep surfacing until someone rules:

- **`ModalTitle` has no `size` prop**, so a caller's font size silently never
  applies — a second arbitrary utility on a plain `<h2>`, resolved by stylesheet
  order. Hit independently by three callers, each working around it with a span.
  It already has `inset` for the identical collision on padding.
- **`chrome-ui MenuItem` inset** — the board says 12, the component ships
  `px-2`, and it is the same question on every chrome menu. Wants an
  `authority=open:menu-item-inset` row rather than a per-screen answer.
- **H10's door question** — its code half (both media modals mounted twice) does
  **not** depend on the decision and should be lifted to one host regardless.

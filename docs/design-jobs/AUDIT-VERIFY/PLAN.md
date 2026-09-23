# Fix plan — what the audit actually found, grouped by cause

The audit lists 48 findings. They are not 48 problems. Fixing them one board at a
time would repeat the same edit dozens of times and miss the boards the audit did
not sample. Every confirmed finding below traces to one of **eight mechanisms**,
and each mechanism has a single repair that closes its whole class.

Ordering is by blast radius, not by the audit's P1/P2 labels.

---

## C1 · A state board was cloned and renamed, but its content was never changed

The board's NAME says one state; its TEXT is still the state it was cloned from.
This is the audit's strongest and most repeatable finding, and one board admits it
in its own name: `2898:22178` is called *"Pages · delete-page · confirm · inbound
links **(of 1171:4820)**"* and carries `1171:4820`'s unsaved-SEO copy verbatim.

| finding | board | says | actually contains |
|---|---|---|---|
| M01 | `2850:22371` single file | one asset | "Delete 34 files?", 5-files warning, type-DELETE |
| M02 | `2881:12608` all-failed (rollback) | nothing applied | "Replaced 3 uses ✓" and "2 replaced, 1 failed." |
| M03 | `2850:21560` refused | refusal | the default Add-Child picker, verbatim |
| M04 | `2898:22178` delete-page · inbound links | deletion impact | "Discard unsaved SEO changes?" |
| M08 | `1164:4713` choose an image for Hero | one image | "2 selected" + "Use Selected" |

**Repair:** write the state's own content, then add a cheap guard. A clone that
keeps its source's text is detectable — the name says `single`/`refused`/
`all-failed`/`delete-page` while the strings say otherwise. A census script that
greps state boards for their source's signature strings would have caught all
five before an outside reviewer did.

## C2 · Text grew; its clipping parent did not

The most damaging class, because the node exists, the write succeeded, a
read-back matches — and the user sees nothing. Measured, not eyeballed:

- `171:105` AI · error-quota — clip parent `171:132` ends at y67339; "Continue by
  hand in the inspector" (`2846:21651`) runs 67335–67371 and its explanation
  (`2846:21652`) 67379–67459. **Both outside. The recovery route does not render.**
- `171:136` AI · not-configured — clip parent `171:163` ends at y65815;
  `2846:21649` and `2846:21650` fall outside it, and the body text overprints
  "Contact your workspace owner" by **178×18px**, a full line.
- `2854:21814` and 3 sibling History boards — the retention sentence
  (`2854:21848`, 248×**48**) sits inside "Prune note" (`2854:21847`, 280×**40**),
  so it is cut at *"Save a version to keep a"*, and collides with the footer by
  106×2px.
- `138:53` Insert — the wrapped category "COMPONENTS" is 66×**32** in a **32px**
  row whose siblings are 16px.

**Repair:** these are the same bug four times — a caption/body was rewritten
longer and the fixed-height parent was not regrown. Regrow the parent (or set it
to hug), then run a page-wide check for *text box not contained by its nearest
clipping ancestor*. That check is cheap and it is what `RENDER-DEFECTS-*` already
does; it must be re-run after every caption rewrite, because a caption rewrite is
exactly what creates this.

## C3 · Two numbers for one set

- M07 — `1172:4840` says "Review 3 staged changes" and "Apply 3 changes" over
  **four** rows. The button's own frame is named `btn/Apply **4** changes`: the
  row was added, the label was not.
- F22 — section titles carry counts that the arc then invalidated by adding
  boards. Fresh read: Shell `1776:8385` titled **34**, holds **56**; Inspector
  `1776:8381` titled **51**, holds **56**; History `1776:8374` titled **43**,
  holds **49**. Our own `BOARD-BASELINE.json` shows **11 of 29** sections drifted,
  not 3.

**Repair:** stop hand-writing counts into names. Generate section titles from
child counts, and derive a modal's count label from its row set.

## C4 · Engineering annotation renders inside the product frame

`140:2` "Pages · tree" carries, as visible children of the product panel, two
248×117px paragraphs — `2838:12105` *"UX-B-32 — Pages owns the per-page fact…"*
and `2838:12104` *"UX-B-13 — '+ Add page' routes through the uniqueness
helpers…"* — plus 13 hotspot frames with `visible=true` stacked across the lower
third. `2429:12111` does the same with a red `ContentViews.tsx:630` paragraph;
`170:2` and `144:2` show gray hotspot labels inside the render.

**Repair:** annotations belong beside the board, not inside it, and hotspots
belong at 0 opacity or on a separate layer. This is F23's correction and it is
already written verbatim into F03, F06 and F12 — one fix, four findings.

## C5 · Absolutely-positioned footers instead of auto-layout

- M05 — `1170:4777` Create Component: "Cancel" (`1712:8430`) occupies rel
  520–563 × 698–714; the primary button (`1712:8431`) occupies 548–700 × 690–724.
  They intersect by exactly **15×16px** — the audit's numbers, confirmed.
- M20 — the same dialog is 720×**740**, so at a 720px-tall window its actions are
  already below the fold.
- F10 — "Re-send for review" overruns both rounded edges of its button.

**Repair:** one horizontal auto-layout footer with an explicit gap, content-based
button widths, a shared button instance. Then M05, M20 and F10 close together.

## C6 · The board draws a capability the code does not have

Checked against the code, not assumed:

- **F18** — `641:2546` still renders the group `FROM BRAND · NOT IMPLEMENTED`
  with "Button / primary — linked ›" and "Price row — linked ›". The code ships
  one group, `YOUR COMPONENTS`; `ComponentsTab.tsx:231-235` says in-source that a
  FROM BRAND section *"would always be empty chrome"*. There is no brand→component
  link in the engine. **Delete the group** — do not draw a disabled state for a
  feature that does not exist.
- **M12** — the AI success modal's Accept button was removed in code on purpose
  (`AIPromptModal.tsx:211-225`, pinned by a test): the artifact is a preset
  *binding* schema with no destination. The board should label the result
  unsupported, not grow an Apply button.
- **F12** — `pageTemplatePath` is settable once, as free text, at collection
  creation; nothing in the panel binds it. A template picker cannot be drawn as
  shipping UI. (The published-record count the audit asks for **already exists** —
  `ContentViews.tsx:623`.)
- **F19** — there is no MOTION section in code; `SectionId` has 17 ids and Motion
  is not one. The board's "newer MOTION specimen" is a proposal, not a target.

**Repair:** each of these is a board that promises something the product cannot
do. Remove or mark, per the founder's precedence rule — the code decides
behaviour.

## C7 · The board contradicts code that already ships correctly

The inverse of C6, and the cheapest fixes on the list:

- **M17** — the board has no "Template name" label. The code renders a real
  `<label htmlFor>` (`SaveTemplate.tsx:56-62` → `FormField.tsx:46`). **Fix the
  board.** (The live sub-defect worth keeping: that label is 12px
  `--bk-ink-soft`, low contrast.)
- **M13** — the board offers Retry for a server-side configuration failure.
  `AITab.tsx:266-281` already ships the correct treatment: named state,
  explanation, "Open workspace settings", no Retry. **Copy the shipped pattern.**
- **F26** — the V2 rail labels ("Inse", "Laye"…) are a V2-board defect; the code's
  labels are full words and test-pinned (`tabsConfig.figma.test.ts:30`).

## C8 · Corrections drawn on new boards were never assembled into the screens

F14, F15, F16, F01, F02 all reduce to this. The assembled editor `52:2` still
shows the six-item rail, a Layers highlight ("heading-that-is-long") that
disagrees with the canvas badge, inspector header and footer ("Section · Hero"),
and an Inspector fill of `#1A56DB` over a gray section. Full-page Settings
`638:2378` still prints "Section · Hero 680 × 250" and "Desktop · 100%" with no
canvas — and the code says why: `AquibraStudio.tsx:710-729` renders the footer as
an unconditional flex sibling outside the grid, so every `--fullpage` CSS rule
misses it, and `LayoutShell`'s own Footer slot (`LayoutShell.tsx:332`) has zero
consumers.

**Repair:** F15 is a real code bug with a design symptom — fix the footer's
ownership in `AquibraStudio.tsx`, then restate the assembled boards from the
corrected chrome. Until that happens, a correction board is not a corrected
editor, which is exactly what F14 says.

---

## Sequence

1. **C2** first — invisible-by-clipping is the only class where the file lies to
   its own read-back. Regrow parents, then re-run the containment census.
2. **C4** — strip annotation out of product frames; it contaminates every
   screenshot anyone takes for review, including this audit's.
3. **C1** — write the five cloned states properly.
4. **C6 / C7** — settle board-vs-code in both directions. Cheap, and it stops the
   design promising or denying the wrong things.
5. **C5** — one footer component, three findings.
6. **C3** — generate counts instead of typing them.
7. **C8** — last, because it depends on 1–6 being settled, plus one real code fix
   (`AquibraStudio.tsx` footer).

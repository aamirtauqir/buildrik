# Designer brief — audit and repair, 2026-07-19

**What happened:** `DESIGNER-BRIEF.md` was written as the single handoff doc for the UI-UX designer. A Codex review was run against it with three questions: is it actionable, is it true, what is missing. It returned 7 findings. Every one was verified against the source docs and **every one held.** Verifying them surfaced an eighth that Codex did not catch, and three places where our own documents contradicted each other.

All 8 findings and all 3 conflicts are now fixed. This page is the record so the fixes can be checked rather than trusted.

---

## Part 1 — findings against the brief

### F1 · The nine regions were wrong · P1

The architecture table dropped **Canvas** and listed **Review** as a region. Review is a conditional seventh rail icon that appears while a review is live — not a region. A designer reading this brief and `PART-1` would get two different structures for the product.

| | |
|---|---|
| **Was** | 9 rows: rail · topbar · canvas toolbar · inspector · footer · Site · Client · Portfolio · **Review**. No Canvas. |
| **Now** | Canvas and Drawer restored. Review named separately as the conditional rail item, with what it answers. |
| **Verified against** | `PART-1-information-architecture.md` §2 |

### F2 · Canvas width was the pinned case, printed as the default · P2

The brief hardcoded `CANVAS = 760`. That is only true when the drawer is **pinned**. The drawer is **transient by default**, which gives **1080** at 1440. Draw the shell from the wrong number and the base frame is 320px off — and every screen drawn inside it goes with it.

| | |
|---|---|
| **Was** | `horizontal 60 + 320 + CANVAS + 300 = 1440 → CANVAS = 760` |
| **Now** | Both modes in a table, transient marked as the one to draw, plus both arithmetic lines. |
| **Verified against** | `2026-07-18-editor-shell-wireframes.md` §2 — worked cases table gives 1440 → 1080 transient, 760 pinned |

### F3 · "Do not start these" forbade fifteen screens that have briefs · P2

The brief listed the AI screens, Brand's sub-screens and the chrome modals as "not ready — only named." They are not. Ch.14 gives each of them purpose, entry→exit, features, states, roles and data. What they lack is a **drawn layout**, which is the designer's job to supply.

The root error: **"no drawn layout" was treated as "no spec."** Those are different, and collapsing them idles a designer on work that is ready.

| | |
|---|---|
| **Was** | Two tiers — ready / not ready. AI `S2.1–S2.5`, Brand `S4.2–S4.5`, Chrome `C4–C7` all in "do not start." |
| **Now** | Three tiers — layout drawn · behaviour specified (draw these) · genuinely blocked. |
| **Verified against** | `docs/prd/editor/14-screen-specs.md` — S2.1–S2.5 at :73, S4.2–S4.5 at :294, C4–C7 at :517 |

### F4 · "31 of 56 screens" was not supported · P2

The number came from an earlier count and was repeated without re-deriving it. Ch.14's own total is **56 specs** (49 `S*` + 7 `C*`), but the readiness split behind "31" rested on the same tier confusion as F3, so the figure did not mean what it claimed.

| | |
|---|---|
| **Was** | "An independent review counted 31 of 56 screens specified well enough to draw." |
| **Now** | Number removed. Replaced with the three tiers, which say what is actually true of each screen. |

### F5 · Every file path in the doc map was wrong · P1

Section 11 listed bare filenames. Those files do not exist at the repository root — they live under `docs/designs/`. A designer following the map finds nothing.

| | |
|---|---|
| **Was** | `PART-1-information-architecture.md`, `GENERATED-inventory.md`, … |
| **Now** | Full repo-root paths, with a line saying so. |

### F6 · Rail order contradicted eight other documents · P2

The brief said `Insert · Layers · Pages`. `DESIGN.md`, Ch.14, the redesign doc (×4), the IA-redesign doc and a teaching lesson all said `Insert · Pages · Layers`. `PART-1`'s own table was internally broken — rows numbered 1, 3, 2 with Pages sitting above Layers.

Resolved by founder decision on 2026-07-19: **`Insert · Layers · Pages`**, on the adjacency argument — Insert and Layers are the pair you ping-pong between (drop a thing, then go find it). The eight documents were copies of one older line, not eight independent judgements. All nine places are now consistent.

⚠ `PART-1` itself flags the frequency ordering as *"a hypothesis, not a measurement."* Worth instrumenting panel-open counts per project week before the order sets as muscle memory.

### F7 · Media grid cell was wrong · P3

| | |
|---|---|
| **Was** | 136 × 104 |
| **Now** | 140 × 96, 2 columns, 16 gutter, 16 padding |
| **Verified against** | `2026-07-18-editor-shell-wireframes.md` §3 Layout B |

### F8 · The accent rule was wrong for everything outside the editor · P1

**Codex did not find this one.** It surfaced while verifying the client-page accent conflict below.

The brief's craft rules opened with *"One accent: cobalt `#2D6DFF`"* as non-negotiable. That is true of **editor chrome only**. `DESIGN.md`:11 records that **`#406ED6` is the product accent** across dashboard, auth and onboarding — adopted 2026-07-18 from the founder-supplied UI kit, superseding the cobalt unification of 2026-07-12. Editor chrome is the one surface still on cobalt, because it carries its own `--buildrick-*` token system and has not been migrated.

A designer following the old rule would have drawn the client review page — which ships in the dashboard — in the wrong blue.

| | |
|---|---|
| **Was** | "One accent: cobalt `#2D6DFF`. Purple, violet and indigo are banned." |
| **Now** | A per-surface table: editor chrome cobalt · client review page `Client.brandColor` else `#406ED6` · everything else `#406ED6`. Bans kept. |

---

## Part 2 — conflicts between our own documents

These were not brief bugs. Two of our documents gave two different answers, so the brief could not be right by copying either one. All three are fixed at source.

### C1 · Comment mode — does the rail stay usable?

| Document | Said |
|---|---|
| `2026-07-18-editor-shell-wireframes.md` state 6 | rail + inspector dim to 60% and go **non-interactive** |
| `PART-1-information-architecture.md` §3 | comment mode **must not** disable the rail or inspector |

**Resolved: the IA.** Reading "hero too dark" and being unable to fix it without leaving the mode breaks the exact loop the product exists for. Pins stay visible while you edit. Shell state 6 rewritten.

### C2 · Client review page accent

| Document | Said |
|---|---|
| `2026-07-18-j5-signoff-wireframes.md` §0 | `Client.brandColor`, else the dashboard accent **`#406ED6`** |
| `2026-07-18-editor-shell-wireframes.md` A8 | `Client.brandColor`, else **cobalt** |

**Resolved: J5.** That page ships in the **dashboard** package, which runs the product accent; and white-labelling means the agency's colour outranks ours on a client-facing page. Shell A8 rewritten.

This is the one I called backwards before checking the code — my first instinct was that A8 won, because A8 explicitly said "the J5 wireframes need this change applied." Reading `DESIGN.md` showed A8 predated the `#406ED6` adoption. **Worth remembering: a document asserting it supersedes another is not evidence that it does.**

### C3 · Rail order

See F6. Settled to `Insert · Layers · Pages · Media · Content · Brand`, corrected in all nine places.

---

## Part 3 — what this changes about how the docs work

Three of the eight findings (F2, F4, F7) are the same failure: **a number copied out of a source doc, which then rotted.** That is the failure `GENERATED-inventory.md` already exists to prevent for code counts — it generates them from source and treats a zero as a broken pattern rather than an answer.

Design *dimensions* have no equivalent guard. They live in prose in the wireframe docs and get copied by hand into every other doc. Nothing catches the drift.

A trap has been added to the brief telling the designer not to trust its numbers over the source doc's. That is a mitigation, not a fix. **The real fix is to generate the dimension table the way the code counts are generated** — worth doing before the next doc copies them again.

---

## Files changed

| File | Change |
|---|---|
| `docs/designs/DESIGNER-BRIEF.md` | F1–F8 — regions, canvas widths, three tiers, paths, rail order, media cell, accent table, new §6a |
| `docs/designs/2026-07-18-editor-shell-wireframes.md` | C1 state 6 · C2 row A8 |
| `docs/designs/PART-1-information-architecture.md` | F6 — rail table rows reordered to match their own numbering |
| `DESIGN.md` · `docs/prd/editor/14-screen-specs.md` · `docs/designs/2026-07-17-editor-ia-redesign.md` · `docs/designs/2026-07-17-editor-product-redesign-complete.md` (×4) · `docs/teach/lessons/0001-...html` | F6 — rail order |
| `.render/build-book.mjs` | brief added as Part I; designer reading path points at it first |

Verification run: `node .render/inventory.mjs --check` → up to date, 0 broken patterns.

# Gap-B — the 24 findings that had no queue row at all

**Run 2026-09-07 · 10 Figma calls of the 15 allowed** (1 recon · 4 apply · 1 resize
re-read · 1 board read · 1 correction · 2 verify). Page `1:3` only.

These 24 sat `PENDING` with *nothing behind them* — their module agents ran out of
quota before writing a row, so a deliberate no-op and an oversight looked identical.
Every one now ends as a row in a plan file, and 20 of them also end as something
drawn on the page.

**Plans written** (all under `docs/design-jobs/V2-TO-V1/plans/`):
`gap-b-advisories.json` (24 verdict rows, one per finding) ·
`gap-b-notes.json` (8 section notes) · `gap-b-copy.json` (1 copy fix) ·
`gap-b-sections.json` (4 section resizes) · `gap-b-fixups.json` (2 corrections).

**One new script**, because nothing here did it: `scripts/figma/dump-section-freespace.mjs`
— every section's box, how far its content actually reaches, what occupies that last
band, plus named-node geometry and board TEXT interiors, for any number of sections
**in one call**. `dump-board-interiors.mjs` answers this for one section; eight
sections would have been eight calls. Preflighted (`preflight-sandbox.mjs`,
`lint-sandbox-scripts.mjs`) before it was ever sent.

---

## The rule this run followed for placement

Every note sits in the strip **between a section's `maxBottom` and its bottom edge**,
which is free *by definition* — `maxBottom` is the maximum `y+height` over **all**
that section's children. No note was placed by eye, none was placed beside a board,
and that is why `board overlaps` is still 0. Four sections had no such strip, so they
were grown first, each checked against the next section's top from the same read.

---

## One row per finding

| id | verdict | board / node touched | read-back |
|---|---|---|---|
| `UX-C-10` | **IMPLEMENTED** | `1707:8424` (in `1707:8427` *Popover · Inspector · binding · no-records*) | `OK` — node now reads **“No records yet. Open Content › this collection to add the first one.”** The `expect` guard `No records yet. Add records via the command palette` matched before the write, so the stale copy is what was replaced. The inline-add half of the fix was **not** written: nothing in the code adds a record from this popover, and a board may not promise a control that does not exist. |
| `UX-C-13` | **IMPLEMENTED as specification** | `2876:12479` note/Inspector | `OK 2876:12479 2800x144 @100,5953` — carries the property-picker contract (ask WHICH property, defaulted from element type × field type; offer only fields that can drive the selection; keep original content as the unbind fallback). Not drawn as boards: three states is a board family, not an annotation. |
| `UX-C-21` | **IMPLEMENTED** | `2876:12484` note/Ecommerce, anchored to `1719:8391` | `OK 2876:12484 1000x72 @100,1992`. The content lane called this NOT-APPLICABLE because the dialog is not in `1776:8376`; this pass owns `1779:6` and placed it rather than handing it on again. |
| `UX-C-26` | **IMPLEMENTED as specification** | `2876:12479` note/Inspector | as above — return the created collection to its caller, reopen the popover on it, create the first record in the same flow, and never auto-dismiss a success the user has to act on. |
| `UX-C-27` | **IMPLEMENTED** | `2876:12478` note/History | `OK 2876:12478 3600x126 @100,4583`, later rewritten `OK`. Restoring persisted state is not a user action. |
| `UX-C-30` | **IMPLEMENTED** | `2876:12477` note/Content | `OK 2876:12477 3200x90 @100,5837` — the spine (collection → fields → records → repeater on canvas → publish) plus the missing collection settings screen. |
| `UX-I-03` | **NOT-APPLICABLE (board), ALREADY-CORRECT (code)** | `163:113` read; recorded on `2876:12478` | **The claim it was reported on has now been checked.** All **31 of 31** TEXT nodes of `163:113` read: no Enter, no Esc, no arrows, no shortcut line anywhere. The only safety sentence is `163:166` *“Nothing is written until Restore.”* Nothing drawn contradicts the finding, so there is nothing on this board to fix. (The first pass of this note asserted the same thing on 20 of 31 nodes; that was corrected to a complete read — see `gap-b-fixups.json`.) |
| `UX-I-04` | **IMPLEMENTED (panel half)** · canvas half NOT-APPLICABLE | `2876:12478` note/History | `OK` — the drawer states the mode: *“Time-travel is on. The canvas is read-only; ← → step the timeline.”* Canvas half not applied anywhere: no History board draws the canvas under an open drawer; owner is `1779:5` / `1776:8385`. |
| `UX-I-11` | **NOT-APPLICABLE — confirmed, not inherited** | `2876:12478` note/History | The history lane's verdict holds and is now published on the page: `163:113` is 360 wide and draws no canvas-relative geometry, so a hardcoded left/right inset cannot be wrong on it. The only board that could carry the defect is a full-screen History board that does not exist and would duplicate `1776:8385`. |
| `UX-I-13` | **BLOCKED**, specified | `2876:12478` note/History | The label half is now resolved — `163:160` *“Previewing v3”* is the node that must name the newest entry. The thumb is not: no lane ever recorded an id for it, so the move needs a shape resolution read inside `163:113` (smallest ellipse/rect centred on the track), which did not fit this pass alongside 23 other findings. |
| `UX-I-14` | **IMPLEMENTED (session-row half)** · topbar half out of section | `2876:12478` note/History | `OK` — the single existing door is `163:158` *“+  Save a version”*, read back on this pass; the note puts the same action on every session row. Topbar half belongs to `1776:8385`. |
| `UX-D-17` | **IMPLEMENTED as specification** | `2876:12479` note/Inspector | `OK 2876:12479 2800x144 @100,5953` — six sections in a profile declare no CSS keys and can never count, so the line understates every element. Remove it, or let a section report its own has-content. |
| `UX-D-18` | **IMPLEMENTED as specification** | `2876:12479` note/Inspector | as above — declare `--hide-desktop/tablet/mobile`. Carried with the finding's own qualifier: the write is honoured end to end, so this is labelling, not a dead control. |
| `UX-D-22` | **IMPLEMENTED as specification** | `2876:12479` note/Inspector | as above — CUSTOM CSS ships as an ordinary collapsed section for everyone; the two Border implementations resolve to one. Not drawn into the seven profile boards: `2865:22079` already renames the row, and seven interiors was not affordable. |
| `UX-D-23` | **IMPLEMENTED as specification** | `2876:12479` note/Inspector | as above — ID / Title / Tab Index is ADVANCED HTML; hide it when it has nothing type-specific to say. Consistent with `2865:22079`. |
| `UX-D-29` | **IMPLEMENTED** | `2876:12479` note/Inspector | as above — the module summary published as the build order. The ten boards built earlier today *are* that sequence and it was nowhere stated on the page. |
| `UX-E-15` | **ALREADY-CORRECT** | `1172:4825` read | Read back on **this** pass, not taken from the publish lane: the modal's buttons are `1172:4835` **“Cancel”** and `1172:4837` **“Export as HTML”**, and there is no *Download All* and no *Download CSS* anywhere in it. The board is already the corrected design; the defect is code-only. Recorded on `2876:12480`. |
| `UX-E-28` | **OPEN DECISION — recorded, not resolved** | `2876:12480` note/Publish | `OK 2876:12480 2600x108 @100,4353`. The fix offers *drop the row* or *replace it with the draft-share link*; `SPEC-PUBLISH-PANEL` §3 deletes ENVIRONMENT as a section and the share link is owned by the dashboard. No IA edge invented. The *Preview — None* row stands on `641:2652`, `784:4250`, `784:4326`, `784:4403` until it is settled. |
| `UX-E-31` | **IMPLEMENTED** | `2876:12480` note/Publish | `OK`. One state machine, one progress vocabulary shared with the worker, one merged gate, a named way out of every terminal state. **The copy rule is honoured**: the cancelled wording drawn is *“If the deploy had already started it may still finish. We will tell you which.”* **The refuted half is not drawn** — the note states that the server *does* inject a correct per-path canonical and og:url on CMS detail pages, and that what is the template's is the first title, og:title, og:description and twitter:* (`UX-E-05`). |
| `UX-I-23` | **NOT TOUCHED — deliberately** | `2876:12481` note/Compare · `2876:12482` note/Review | `OK 2876:12481 3600x72 @100,2132` · `OK 2876:12482 3600x18 @100,5538`. It asks to drop a distinction `DECISIONS-OPEN` §17 already settled as real; a settled decision is not re-opened here. Its pill and bar boards are in `1776:8388`, which this pass does not own. What survives and is stated on both notes: one vocabulary, defined once, consumed by pill, bar and panel. |
| `UX-I-24` | **IMPLEMENTED as specification** | `2876:12481` note/Compare | `OK`. Not drawn as a live label + hotspot: `1168:4713` measures 520×262 with content already reaching 246, so a new row does not fit without restacking the modal, and a hotspot needs the id of a label that does not exist yet. |
| `UX-I-29` | **IMPLEMENTED as a *corrected* specification** | `168:2` read · `2876:12481` note/Compare | **The review lane's instruction was written against a control that does not exist.** Read back 2026-09-07: `168:2`'s bar is `168:4` Compare, `168:12` Home ▾, `168:13` the change count and `168:14` ✕ — there is **no** `‹` to relabel. The note was rewritten (`gap-b-fixups#1`, `OK`) to say what is actually drawn and what is actually owed: a named `‹ Review` exit added to that bar, plus a conditional `‹ History › Saves` shown only when Compare was entered from History. Not drawn, because `168:2` is `layout=VERTICAL` and its bar `168:3` is an auto-layout child — a new exit is a flow-index insert into a bar this pass had not measured. |
| `UX-H-27` | **IMPLEMENTED as specification** | `2876:12483` note/Brand, anchored to `153:120` | `OK 2876:12483 3200x54 @100,7551` — collisions become rows (token / your value / their value) with per-row keep-take and a `+ N more` overflow; the strategy chips become bulk shortcuts *over* that list. Not drawn as a new board: the brand lane already specifies board **N1** for it, and a second home for one screen forks it. |
| `UX-H-35` | **IMPLEMENTED** | `2876:12483` note/Brand | `OK` — one rule: a what-will-change step in front of every whole-brand write (starter, import, AI), recording that the AI door already has the right shape and only starters and import owe it. |

---

## Section resizes — the four that had no room, each read back

| section | before | after | clearance to the next section |
|---|---|---|---|
| `1776:8378` 15 · Publish | 2960×4293 | **2960×4620** | 76 789 vs History at 77 134 — 345 |
| `1776:8374` 16 · History | 8280×4703 | **8280×4900** | 82 034 vs Compare at 82 702 — 668 |
| `1776:8382` 17 · Compare | 7280×2180 | **7280×2320** | 85 022 vs Review at 85 764 — 742 |
| `1776:8381` 08 · Inspector | 3420×6073 | **3420×6220** | 52 369 vs Canvas at 53 156 — 787 |

Read-backs `2960x4620` · `8280x4900` · `7280x2320` · `3420x6220`, taken by a **second,
independent call** — the first apply landed them but its outcomes did not persist, and
the re-run returned `SAME 4`, which is the node's own current size, not the fact that a
call returned. Publish is also a repair: caption `788:4321` ended at 4333 inside a
4293-tall frame, so it hung 40px out of its own section before this ran.

---

## Invariants

| | brief's baseline | after |
|---|---|---|
| loose nodes | 77 | **77** |
| section overlaps | 2 | **2** — the same two (`Brand × Content`, `AI × Command palette`) |
| board overlaps | 0 | **0** |
| out-of-bounds children | 2 | **2** — the same two (`147:55` Media, `1719:8421` Ecommerce); neither in a section this pass touched |
| dangling edges | 0 | **0** |
| boards | 1002 | 1016 |

`boards` grew by 14. **Eight are mine** — the eight `note/…` TEXT nodes, which are
section children and so are counted. The other six are not: three other agents were
writing to this file during the run, and `prototype edges` moved 3453 → 3518 between
my two verify calls without this pass creating a single edge.

---

## What this pass did NOT cover — stated plainly

1. **`UX-I-13`'s thumb was not moved.** The label node is resolved (`163:160`); the
   thumb is not, and finding it is a shape read inside `163:113`.
2. **`UX-I-29`'s exit was not added to `168:2`**, and `UX-I-24`'s *See what changed ›*
   was not added to `1168:4713`. Both are inserts into auto-layout bars whose flow
   indices were never measured; both are specified on the note instead.
3. **Twelve of the twenty-four are specifications on a note, not new screens.**
   `UX-C-13`, `UX-C-26`, `UX-D-17`, `UX-D-18`, `UX-D-22`, `UX-D-23`, `UX-H-27`,
   `UX-I-24` and `UX-I-29` each want a board or a board family. A note that states
   the contract is not the same as a drawn screen and is not claimed to be.
4. **`UX-I-23` was not applied at all** and neither was the canvas half of `UX-I-04`,
   the topbar half of `UX-I-14`, or `UX-E-28`. Each is a recorded refusal with its
   reason, not a gap.
5. **No hotspot, no prototype edge, and no board was created by this pass.** The eight
   notes have no inbound edge; if they should be reachable that is a follow-up and it
   wants `add-hotspots.mjs`.
6. **The twelve boards named in the notes were not all opened.** Four were read this
   pass (`163:113`, `168:2`, `1172:4825`, `1707:8427`); the rest are named from the
   free sources (`BOARD-BASELINE.json`, the pre-reorg TSV, the lanes). Four read is
   four.

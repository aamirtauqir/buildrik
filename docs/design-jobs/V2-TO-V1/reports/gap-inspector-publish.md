# gap-d — the last 16 findings: inspector · publish · shell · ai · content

**Run 2026-09-07 · slug `gap-d` · 6 Figma calls of the 12 allowed.**
Sections: `1776:8381` 08 · Inspector · `1776:8378` 15 · Publish · `1779:4` 14 · Preview ·
`1776:8385` 01 · Shell · `1779:5` 09 · Canvas · `1779:3` 13 · Command palette ·
`1779:2` 20 · Notifications · `1776:8380` 12 · AI · `1776:8376` 06 · Content.

## The finding this pass is actually about

Ten of the sixteen were already answered on the page and read `PENDING` anyway.
Not one of them needed drawing; they needed **reading**. The brief said so —
*"a second board restating a drawn decision is worse than none"* — and the
measurement bore it out: **two read calls closed ten findings**, and the two
write calls that followed were for the four that genuinely had a gap.

The reason ten looked unexamined is the bookkeeping hole this arc has now hit
three times: `add-board` rows never reach `queue-state.json`, `register-status`
credits a finding only from a landed row, and a caption that carries the finding
id is invisible to both. `2844:12091` has said *"(UX-F-20, **UX-F-21**, SH-A-01)"*
since this morning. The register said `PENDING`.

**One claim in the source reports was wrong and is corrected here.**
`reports/publish.md` records `publish-text-4-preview#2/#3` as unapplied and
`queue-state.json` has them as `NOTTEXT FRAME`. **The content is on the board.**
`2429:11934` and `2429:11935` hold the corrected strings — the applier matched a
FRAME, the text landed by another route, and the failure row read like a gap that
was not there. A row's recorded outcome is not the node's state.

---

## One row per finding

`board · node` is the node the read came from. Every id below was returned by
Figma this session, not copied from a plan.

| id | verdict | board · node | read-back evidence |
|---|---|---|---|
| **UX-D-04** | **OPEN-DECISION** — already drawn, not re-drawn | `2866:21879` *Inspector · OPEN DECISIONS* · body `2866:21881` | `A NODE 2866:21881 TEXT 672x533 @24,56 len=3650 parents=2866:21879:FRAME>1776:8381:SECTION>1:3:PAGE` · `A HIT UX-D-04 "…OPEN (UX-D-04). Either way the reach is a working MODE: it survives a selection change to another element of the same type and ends explicitly, rather than…"`. Both admissible answers are stated with the code: `getAllElements()` is every element across all loaded pages (`ElementManager.ts:151-158`, cleared only at `:530-533`) while `ScopeDropdown.tsx:153,159` says "on this page". |
| **UX-D-05** | **OPEN-DECISION** — same board | `2866:21881` | `A HIT UX-D-05 "0-114) (UX-D-05).\n\n5. “WHOLE SITE” — leaves the reach dropdown…"` — decision 4 closes with the rule that the reach is a working MODE, not a property of one element, rather than being reset by `useEffect([selectedElement?.id])` (`ProInspector.tsx:110-114`). |
| **UX-D-07** | **OPEN-DECISION** — same board | `2866:21881` | `A HIT UX-D-07 "audits (UX-D-07). OPEN.\n\n7. LAYERS BREAKPOINT BADGE — NOT drawn as working…"` — 185 definitions across 31 families, exported at `config/index.ts:19-22`, imported by nothing; two acceptable outcomes on the board and no third. |
| **UX-D-19** | **IMPLEMENTED-AS-RULE** — drawn as **not working**, which is the correct drawing | `2866:21881` decision 7 | `A HIT UX-D-19 "…UX-D-19 and UX-H-16 are ONE defect: useLayerTree.ts:88-95 never populates breakpointOverrides, so the T/M badges at LayerTreeItem.tsx:276-281 can neve…"`. No board in `1776:8381` draws the badge as functional. The Layers half is named on the board as another lane's. |
| **UX-C-13** | **IMPLEMENTED-AS-RULE** — and it is in the right section | `2876:12479` note/Inspector | `B NODE 2876:12479 TEXT 2800x144 @100,5953 len=2014 parents=1776:8381:SECTION>1:3:PAGE` — **parented into 08 · Inspector**, which is where the binding popover lives. `B HIT UX-C-13 "…the popover must ask WHICH property to bind, defaulted from element type and field type, and offer only fields that can drive the selected el…"` |
| **UX-C-26** | **IMPLEMENTED-AS-RULE** — same node, same section | `2876:12479` | `B HIT UX-C-26 "…+ Create Collection must return the created collection to whoever asked, reopen the popover on it and let the first record be created in the…"` |
| **UX-E-05** *Crit* | **IMPLEMENTED-AS-RULE** — the note carried the correction; this pass added the **fix** | `2876:12480` note/Publish (`1776:8378`) | `OK 2876:12480 108 -> 144px …r.ts:110-128); owners 1776:8377 and 21 . Settings 1776:8387.` Added: replace the head identity, don't append — one `<title>`, one description, one og/twitter pair from the entry, template head removed first (`cms.service.ts:206-215`); settings show one real entry's rendered head. **The refuted half is marked not-to-be-drawn on the note** (`publish-html.ts:88-97` already injects a correct per-path canonical/og:url). |
| **UX-E-18** | **IMPLEMENTED** — in two halves, and the queue was wrong about the first | `2429:11934` · `2429:11935` · `204:4` | Half one was already on the page despite `NOTTEXT/FRAME`: `H N 2429:11934 TEXT 484x17 @564,478 "One external stylesheet — and no url() in CSS"` and `H N 2429:11935 TEXT 484x34 @564,497 "fonts.googleapis.com is the only sheet kept; any <style> containing url( or expression is dropped WH…"`. Half two was genuinely missing: `OK 204:4 18 -> 54px …ter declarations, not whole attributes and sheets (UX-E-18).` |
| **UX-E-19** | **NOT-APPLICABLE** for this pass — owned elsewhere, recorded on the page rather than handed on | recorded on `2876:12480`; owner `1776:8377` 04 · Pages | `OK 2876:12480 108 -> 144px`. The Google-preview card must render from the resolver the export uses and print the URL the deploy serves, not `domain › slug` (`SeoTab.tsx:78`, `:81` prints `s.seoTitle \|\| page.name` raw). Drawing a Pages screen from the Publish lane would pre-empt that section. |
| **UX-E-20** | **NOT-APPLICABLE** for this pass — owned elsewhere, recorded | recorded on `2876:12480`; owners `1776:8377` + `1776:8387` | same read-back. One SEO destination per page with site defaults inline as the greyed fallback, or a link and a sentence naming which wins; the precedence it must state is at `SEOInjector.ts:110-128`. Choosing the destination is an IA decision across two sections this pass does not own. |
| **UX-F-02** | **IMPLEMENTED** — the board existed and carried no finding id | `2844:12046` *Rail · selected vs open (two signals)* | `gap-d-marks#0 OK Rail · selected vs open (two signals) — UX-F-02: selected and open are two signals, not one. aria-selected and the accen…` (applier re-read in the same call). **Half not applied:** `199:409` *Shell state 5 · Drawer closed* (`I NODE 199:409 FRAME 1440x900 @6340,220 kids=3`) still draws a neutral rail — its rail instance id was not reached and an override against an unread instance is a guess. |
| **UX-F-06** | **NOT-APPLICABLE as a board edit** — and the four queued rows against it **must not be run** | all six shell CmdK boards in `1779:3` | `P BOARD 166:2 …texts=9` · `166:18 texts=5` · `166:27 texts=10` · `166:45 texts=3` · `166:51 texts=4` · `166:58 texts=9`. **None prints `Ctrl+0`, `Ctrl+Y`, `Fit to view` or `Undo last action`** — the only chord-pattern hit across all six was `166:56`, prose about AI diffs. Where the chords ARE drawn they are already right: `P CHORD 1177:4804 1177:4827 "Zoom to fit"` beside `1177:4829 "⌘1"`, and `2875:12463 "⌘0 ⌘1 ⌘2\n⌘= / ⌘-\n⌘; / …"`. The defect is code-only (`CommandPalette.tsx:68-88, :83, :139-148`). |
| **UX-F-12** | **IMPLEMENTED** — already answered *and* already credited | caption `2844:12120` · board `2844:12104` | `S CAP 2844:12120 caption/Site menu (⋯) · regrouped 280x72 @2820,6536 "…“Site settings” points at the full-page Settings (UX-F-29, F-12)"` · `F T 2844:12104 2844:12107 @12,32 "Site settings"` · `2844:12117 "Account settings ↗"`. Nothing added. |
| **UX-F-21** | **IMPLEMENTED** — drawn and credited before this pass | board `2844:12066` · caption `2844:12091` | `F T 2844:12066 2844:12085 @16,256 "Up to date"` — the settled-state label the finding asks for — and `S CAP 2844:12091 1000x18 @1140,6536 "…the settled state stays put; a refused CTA looks refused (UX-F-20, UX-F-21, SH-A-01)"`. Nothing added. |
| **UX-G-03** | **IMPLEMENTED** — board exists **and** its interior carries the fix | `2846:21654` *AI · scoped-multi* | `Q BOARD 2846:21654 AI · scoped-multi 280x812 texts=5 rx=1` · `2846:21660 "Scope: 3 selected"` · `2846:21665 "AI edits ONE element at a time in v1. The composer is disabled while more than one element is select…"` · `2846:21663 "Select one element to use AI here"`. That is the preferred fix exactly — refusal stated **before** the prompt, not after (`useStreamPrompt.ts:47-51`, `AITab.tsx:82-93`). |
| **UX-G-23** | **IMPLEMENTED** — read back on all three blocked states | `171:105` · `171:136` · `2846:21667` | `E T 171:105 2846:21651 @16,104 "Continue by hand in the inspector"` beside `171:135 "See plans"` · `E T 171:136 2846:21649 @16,138 "Continue by hand in the inspector"` · `Q T 2846:21667 2846:21681 @16,104` beside `2846:21680 "Try again"`. The other half is stated at `2846:21682 "The thread and the prompt you typed stay on screen behind this state. Losing the user's words is a s…"`. |

**Verdict count: 8 IMPLEMENTED · 4 IMPLEMENTED-AS-RULE · 3 OPEN-DECISION · 3 NOT-APPLICABLE**
(UX-D-19 and UX-E-05 are counted once each under IMPLEMENTED-AS-RULE).
`REGISTER.md` shows a status with evidence for all sixteen; **none reads `PENDING`.**

---

## What changed in the file — three writes, each read back

| # | node | change | read-back |
|---|---|---|---|
| 1 | `2876:12480` note/Publish | UX-E-05's fix, plus UX-E-19 / UX-E-20 ownership | `OK 108 -> 144px`. Bottom `4353+144 = 4497` inside a 4620-tall section — **123px clear**, measured before the write and confirmed after. |
| 2 | `204:4` caption/Shell state 7 · Preview | UX-E-18's drop-report requirement | `OK 18 -> 54px`, guarded at `maxHeight:90` and refused above it. |
| 3 | `2844:12046` board name | UX-F-02's claim + code citation | `gap-d-marks#0 OK` with the new name re-read in the same call. |

No board was created, none removed, no prototype edge added.

## The measurement that stopped a fourth write

`publish-crosssection#10` (UX-E-05) carried this arc's last **unresolved
selector** — `board_name_matches: "Content · collection · dynamic pages"` — so
nobody knew whether the board it wants exists. One read settled it, and the
answer was to stop:

```
SEC  1776:8376  06 · Content · 46  3440x5957  kids=47
SEC  maxBottom=5927   freeStrip=30
BOARD 2429:12111  Content · dynamic-pages  280x812  layout=VERTICAL  extent=812  texts=12
```

The board is **full** — content extent 812 of 812 — so a head-preview section
can only be added by hiding rows carrying other findings' content. Its five
sibling states (`2429:21243`, `2429:21262`, `2429:21281`, `2850:12042`,
`2850:21351`) are all 280×812 and equally full. A new board is no cheaper: the
section has a **thirty-pixel** free strip and already computes as a pre-existing
overlap against `07 · Brand`, so growing it makes that overlap worse.

That is a section re-space (`order-sections.mjs`), which is the arrangement
lane's job and not something to start while other passes are writing into the
same file. **Recorded, not attempted** — the contract is on `2876:12480` so
nothing is lost, and the next pass inherits the geometry rather than the symptom.

---

## Invariants

`node scripts/figma/verify-invariants.mjs`, run after every write:

| class | required | measured | verdict |
|---|---|---|---|
| loose nodes on page | 77 | **77** | unchanged |
| section overlaps | 2 | **2** | unchanged — `07 · Brand`×`06 · Content`, `12 · AI`×`13 · Command palette`, both pre-existing |
| board overlaps | 0 | **0** | held |
| out-of-bounds children | 2 | **2** | unchanged — `147:55` Media, `1719:8421` Ecommerce, neither in a section this pass wrote to |
| dangling prototype edges | 0 | **0** | held (edges 3519) |
| sections / boards | 29 / — | **29 / 1017** | growth only |

**Nothing on this list moved.** `FAIL` is the pre-existing state in
`INVARIANTS-PRE.md`.

`boards` reads 1017 against gap-b's 1016. **None of that is mine and I will not
claim it**: this pass's three writes are two appends to existing TEXT nodes and
one board rename, and `verify-invariants` counts section children, of which this
pass created zero. Another session was writing to the file during the window —
`queue-state`'s day counter moved 109 → 110 for my one queued call while prototype
edges moved 3453 → 3519 without this pass creating an edge.

---

## What I did NOT do — plainly

1. **UX-E-05's head-preview card is not drawn.** Measured, not skipped — see
   above. It needs a section re-space first.
2. **UX-F-02's instance override on `199:409` is not applied.** The board's rail
   is still neutral. Its interior walk hit its node cap inside the inspector
   column and never reached the rail instance; an override written against an
   unread instance id is a guess, and this arc has paid for those.
3. **UX-G-23's "open billing in-place with a return" is not drawn.** `171:135`
   "See plans" carries no in-place statement. Adding one re-layouts a 280×812
   board whose child ids were never read.
4. **UX-E-19 and UX-E-20 are recorded, not drawn.** Their boards are in `1776:8377`
   and `1776:8387`, which this pass does not own.
5. **No prototype wiring, no screenshots, no board created.** Nothing here was
   verified by eye. Every claim above is a property read, and a property read is
   a thermometer — it answers what it was asked and nothing else.
6. **I opened what I opened.** Fully read: `2866:21881`, `2876:12479`,
   `2876:12480`, section `1776:8380` (30 children), `171:105`, `171:136`,
   `2846:21654`, `2846:21667`, `2844:12066`, `2844:12104`, `166:27`, section
   `1779:3` (15 children, six boards' TEXT), `2429:11904`, section `1776:8376`
   (47 children) and its six dynamic-pages boards, plus name-level reads of
   `199:409` and `65:211`. **`199:409`'s rail subtree was not reached.** Nothing
   else on the page was opened.

## Files

| file | what |
|---|---|
| `plans/gap-d-notes.json` | 2 idempotent `append-caption-text` rows, both landed `OK` with their measured height guard |
| `plans/gap-d-marks.json` | 1 `rename` (landed `OK`) + **16 advisory verdict rows**, one per finding, each carrying its verdict and its read-back node ids |
| `scripts/figma/gap-d-recon.mjs` | read 1 — the nodes that may already answer the sixteen. Closed ten findings in one call |
| `scripts/figma/gap-d-recon2.mjs` | read 2 — palette chords across all of `1779:3`, the AI scoped-multi interior, the shell captions |
| `scripts/figma/gap-d-recon3.mjs` | read 3 — resolved the arc's last unresolved selector, and refused a write on the result |

All three scripts pass `node scripts/figma/preflight-sandbox.mjs`, which builds
the real payload and parses **that**.

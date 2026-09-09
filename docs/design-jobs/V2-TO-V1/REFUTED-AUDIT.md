# Did any refuted V2 finding get drawn into V1?

V2's own QA lane refuted a set of its findings, and `V2-CORPUS.md` §A2 left an
explicit warning for this arc:

> *"`REGISTER.md` nevertheless carries `UX-C-04` as a row under its `## Critical`
> heading. The register disagrees with the V2 page on this id, and the V2 page is
> the source. … flagged here because a V2 → V1 pass driven off the register would
> carry a refuted finding into V1."*

That is the single worst outcome available to this arc — drawing, onto a board, a
claim the source already overturned. So it was checked rather than assumed.

## How many were refuted: V2 says 11 and names 10

| where | says |
|---|---|
| `2797:16` + `2797:17` | **11** — "refuted by QA" |
| `2797:5` (header prose) | "…re-verified 48 of them and refuted **11**" |
| `2797:18` | "all **11** refuted claims sit in that group" |
| `2797:95` (the exclusion list) | "**Ten** findings a QA pass refuted or overstated are excluded — UX-B-01, B-05, C-04, C-25, E-01, E-04, E-13, F-07, I-17, I-30" |

Three places say eleven; the only place that enumerates names ten. **The eleventh
is unnamed anywhere on the page.** Already recorded in `CONTRADICTIONS.md`; noted
again here because it caps what this audit can prove — it covers the ten that can
be identified.

## Disposition of the ten: all correct

Every one is `DO-NOT-IMPLEMENT` / *"N/A — refuted, must not be drawn"* in
`CHECKLIST.md`, `UX-C-04` included. The A2 warning was heeded.

## But "not implemented as a finding" is not "never written to a board"

24 landed queue rows *cite* one of the ten in their `why`. A citation is not a
drawing, so each was checked against the string it actually wrote:

| | rows |
|---|---|
| wrote a string naming a `file:line` — drawing the CODE, not the refuted claim | 9 |
| wrote a short UI label (`Draft`, `Won't publish`, `Will publish`, a hotspot name) whose justification cites code | 14 |
| **wrote the refuted finding's id as its authority** | **1** |

### The one

Board `1172:4867` was renamed to:

> `RETIRED — Project settings modal (⌃,) · superseded by the full-page Settings`
> **`per UX-I-30`**`. …`

`UX-I-30` is on the refuted list. The board cites it as the reason.

**The substance survives; only the citation is wrong.** The same fact is rendered
on the V2 page independently of that finding, in section 6 · Navigation
Structure, `2797:404-406`:

```
2797:404  "2"
2797:405  "Settings surfaces"
2797:406  "a 3-tab modal and a 13-screen full page, no link between them"
```

So the retirement is well-founded and its footnote points at an overturned claim.
`fix-refuted-citation.mjs` repoints it at `2797:404-406` and says in the same
breath that `UX-I-30` was refuted. Queued.

### A second trap in the same row

That queue row justified its census quote by citing
`build-proposal-page.mjs:72` — the **builder's input**. `V2-CORPUS.md` opens by
warning that the builder script is not what the page renders. Here the two happen
to agree, checked against `2797:406`. The habit is still wrong: it is how a
script's intent gets recorded as the file's contents.

## What this establishes

Of the ten identifiable refuted findings, **none was implemented**, and of 24
landed rows that mention one, **23 draw code or an independently corroborated
fact**. One cited a refuted id as authority and is queued for repair.

It does not cover the unnamed eleventh, and it does not cover any board written
by a bespoke script rather than the queue — those leave no `why` to audit.

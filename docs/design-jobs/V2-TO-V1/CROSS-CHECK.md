# Cross-check — do any boards still contradict what this arc corrected?

The founder's process puts a CROSS-CHECK between applying and verifying. The
risk it guards against is specific and real on this page: a correction lands on
the board a finding names, and another board somewhere else keeps drawing the
old claim. Two boards saying opposite things is worse than either alone.

## Pass 1 — TEXT nodes. Clean, and not sufficient.

Every claim this arc corrected was reduced to the **exact strings** the old
version would contain, then searched across every TEXT node of every section
whose interiors have been read. Exact strings, not patterns — a first attempt
with loose regexes returned five "hits" that were the words *Gap*, *Fill*, and a
62-character heading containing "320". Zero Figma calls: the search runs against
`DISCOVERY.md`, the corpus captured by `discovery-pass.mjs`.

| section | TEXT nodes searched | hits |
|---|---|---|
| 23 · Journeys | 3,377 | 0 |
| 07 · Brand | 612 | 0 |
| 18 · Review | 278 | 0 |
| 20 · Notifications | 40 | 0 |
| **total** | **4,307** | **0** |

## Pass 2 — board NAMES. This is where the defect was.

**A board's name is not a TEXT node.** Pass 1 searched the strings drawn *inside*
boards and never looked at the 138 names above them — and on this page the name
is where most of the arc's findings were written. A whole evidence class was
declared clean without being read.

Searching the names found it immediately: **five of the six Notifications boards
asserted, in their own names, "drawn 280 … the 280→360 re-lay is NOT taken
here."** All six measure **360×812** live, interiors re-seated, right edge
exactly 360. The boards had been contradicting themselves since the re-lay
landed.

Worse, a script written to fix exactly this — `fix-notifications-relay-claim.mjs`
— already existed and had **reported success**. It carried two match strings; the
boards use **three** wordings. It corrected the boards it could match and left
the rest asserting 280, with a clean exit code. The third wording
(`"drawn 280; ships 360"`) is now in the pair list, and the five boards are
corrected and read back.

The lesson is the one this arc keeps re-learning in new costume: **match strings
have to come from the nodes, not from the sentence somebody meant to write.**

### After pass 2

| claim class | name hits | verdict |
|---|---|---|
| `re-lay is NOT taken` / `drawn 280` | 17 | **was real** — corrected live; the hits remaining in `DISCOVERY.md` are a stale capture, see below |
| `[not-implemented]` | 18 | not stale — 16 are live markers; the 2 on boards that also say SHIPS say so explicitly ("the marker on this board was wrong") |
| unbuilt / no-code-subject | 1 | not stale — accurate |
| instruction-as-value (`APPEND to`, `TBD`, `placeholder for`) | 0 | clean |
| `Drawer slot · 320`, `560 wide` | 0 | clean |

## `DISCOVERY.md` section `1779:2` is a stale capture

It records the Notifications boards at 280×812 with the pre-fix names. Live they
are 360×812. The corpus was captured before the re-lay; it has not been re-read
because re-reading costs calls the day has not returned. **Do not plan against
that section's geometry.** The other three sections were captured after their
respective work.

## What this establishes, and what it does not

**Does:** the mirror problem is now searched in both classes for the four
sections that have been read, and the one real instance is fixed.

**Does not:** four sections is 138 boards of ~1,043. `11 · Templates`,
`10 · Components`, `19 · Client sign-off` and `09 · Canvas` have never been read,
so nothing here covers them.

And both passes are **text searches**. A board can contradict a correction
*visually* — wrong width, wrong state, a control drawn that cannot exist —
without using any of these words. That is what reading boards at 1440×900 is
for. It is queued and, as of this writing, still blocked on the cap.

---

## Pass 3 — the four sections that had never been read

`11 · Templates` (1084:4527), `10 · Components` (1938:8372),
`19 · Client sign-off` (1776:8384) and `09 · Canvas` (1779:5) were captured in
full on 2026-09-07 — 49 boards, 970 TEXT nodes — and cross-checked in both
classes at once, names and text, with the claim set widened beyond what passes 1
and 2 used.

| claim class | what it looks for | hits |
|---|---|---|
| stale width | `Drawer slot · 320`, `560 wide`, `drawn 280`, `280 wide` | **0** |
| re-lay not taken | `re-lay is NOT taken`, `NOT taken here` | **0** |
| instruction-as-value | `APPEND to`, `PREPEND to`, `REPLACE with`, `TODO`, `TBD`, `placeholder for` | **0** |
| already-corrected copy | `Milestones`, `All changes`, `TEMPLATE PAGE`, `Choose a page`, `RECENT` | **0** |
| legacy accent | `#406ED6`, `#3F83F8`, `#1C64F2` | **0** |
| banned hue | `indigo`, `violet`, `purple` | **0** |
| system font stack | `system-ui`, `-apple-system`, `Helvetica`, `Segoe UI`, `Roboto` | **0** |

**Zero in every class.** These four sections carry no stale claim, no
instruction written into a value, no banned hue named in copy, and no legacy
accent hex.

The last three classes are new here — passes 1 and 2 never checked for banned
hues, system fonts or legacy accent hexes at all, because those passes were
built around the specific corrections this arc had made rather than around
DESIGN.md. Worth re-running over the other four sections for the same reason the
board-names class was worth adding: **a check finds only what it was asked
for.**

## Cross-check coverage now

| sections | boards | TEXT | names searched | text searched | hits |
|---|---|---|---|---|---|
| 4 (pass 1 + 2) | 138 | 4,307 | yes (pass 2) | yes (pass 1) | 1 real, fixed |
| 4 (pass 3) | 49 | 970 | yes | yes | 0 |
| **8 of 29** | **187** | **5,277** | | | **1 total** |

Still 8 of 29 sections. The other 21 have never been read at board level, and
nothing here says anything about them.

# Sibling sweep C — Review · Compare · Client sign-off · Notifications

**Date:** 2026-09-07 · **Figma calls spent: 10** of the 15 allowed
**Sections:** `1776:8383` 18 · Review · `1776:8382` 17 · Compare ·
`1776:8384` 19 · Client sign-off · `1779:2` 20 · Notifications — all on page
**`1:3`** — plus **two boards on page `1:6`**, where the client-review family is
canonical.

**13 boards changed. Every one is a `name` write, read back from the file in the
same call. Zero nodes created, zero moved, zero resized, zero deleted.**

---

## The headline, stated before the table

Two of the four sections had **no sibling defect to sweep**, and finding that out
is the result, not a failure to do the work:

- **18 · Review stays at 3 of 23.** Both corrections applied there have exactly
  zero siblings, and the other 20 boards were read in full and cleared — one
  class against the file, one class against the code at HEAD.
- **19 · Client sign-off's canonical-naming sweep was refuted by its own dry
  run.** Five boards I had planned to edit already named their `1:6` canonical;
  the 74-character section listing had hidden the clause. Those five rows were
  deleted before any write. One genuine sibling remained and was applied.

A sweep that edits a board which does not show the defect is worse than one that
edits nothing. Nine of the twenty rows I first drafted were dropped on evidence.

---

## Per defect

### D1 · Notifications drawn 280 while the shipped panel is 360 (`UX-F-25` / `UX-F-26`) — page `1:3`

The correction already applied: a marker on `165:2` recording that the board is
drawn 280 wide and the shipping dropdown is 360.

Re-verified at HEAD before sweeping, not taken on trust:
`.bk-notifications { width: var(--bk-size-panel-right) }` (`header.css:39`) and
`--bk-size-panel-right: 360px` (`tokens.generated.css:130`). It is the token's
only consumer; `--bk-size-nav` (240) has none.

**Every board in the section was measured this session and every one is
`280x812`.** Six of six show the defect; one carried it.

| board | name | measured | action | read-back |
|---|---|---|---|---|
| `165:2` | Notifications · unread | 280x812 | **already carried** it | — |
| `165:24` | Notifications · all-read | 280x812 | **APPLIED** | `OK Notifications · all-read — NO CODE SUBJECT … — UX-F-25/26: drawn 280; ships 360 (.bk-notifications → …` |
| `165:44` | Notifications · empty | 280x812 | **APPLIED** | `OK Notifications · empty — UX-F-25/26: drawn 280; ships 360 …` |
| `165:51` | Notifications · loading | 280x812 | **APPLIED** | `OK Notifications · loading — UX-F-25/26: drawn 280; ships 360 …` |
| `165:71` | Notifications · no-jump-target | 280x812 | **APPLIED** | `OK Notifications · no-jump-target — a notification CREATED without one … — UX-F-25/26: drawn 280; ships 360 …` |
| `453:4051` | Notifications · load-error | 280x812 | **APPLIED** | `OK Notifications · load-error — UX-F-25/26: drawn 280; ships 360 …` |

**Cleared: none. All six show it.** That is not a copy-paste — it is a
measurement of six boards that returned the same number six times.

**The 280 → 360 re-lay is NOT taken, and each marker says so on the board.** The
shell pass filed rather than applied it because resizing the frame alone leaves a
280 interior in a 360 box, which is a worse drawing than what ships. I agree and
did not overrule it: re-laying six interiors requires reading six interiors, and
I have read none of them. What the sweep changes is that the debt is now recorded
on all six boards instead of one, so the next pass with a cursor cannot fix
`165:2` and think the section is done.

### D2 · Two independent "what changed since approval" engines (`UX-I-24`) — page `1:3`

Re-verified at HEAD: `shared/utils/html/approvedCompare.ts:220`
`compareApprovedToCurrent` (typed, itemised) versus
`StaleApprovalModal.tsx:38` `diffPages` (page names only). Two implementations,
and the gate — the moment the decision is actually made — draws the weaker one
and offers no door to the other.

Swept to the boards that **draw a diff result**:

| board | action | read-back |
|---|---|---|
| `168:26` Compare · overlay | **APPLIED** | `OK Compare · overlay — UX-I-24: this diff is compareApprovedToCurrent (…:220), a DIFFERENT engine from the publish gate's own diffPages (StaleApprovalModal.tsx:38)…` |
| `168:48` Compare · list | **APPLIED** | `OK Compare · list — UX-I-24: …` |
| `168:82` Compare · no-changes | **APPLIED** | `OK Compare · no-changes — UX-I-24: …` (the empty diff is still a result of the same engine) |
| `169:2` Compare · single-page | **APPLIED** | `OK Compare · single-page — UX-I-24: …` |
| `168:2` Compare · side-by-side | **APPLIED — as a correction to this sweep**, see below | `OK Compare · side-by-side — approved vs current; a DIFFERENT engine from the Saves version-vs-version compare (FIG-G-12) and the published-version diff (W-N-23) — UX-I-24: and a further pairing…` |

**EXAMINED AND CLEARED — 3 boards:**

- `169:28` **Compare · loading-render** — the render has not resolved; the board
  draws a spinner, not a diff result. Name read in full: no marker of any kind,
  and none owed.
- `169:60` **Compare · restore-confirm — RETIRED 2026-09-02 (no producer)** — a
  restore dialog. Draws no diff.
- `169:92` **Compare · resend-confirm — SUPERSEDED 2026-09-02 by 158:2** — a
  confirm dialog. Draws no diff.

**The correction I had to make to my own sweep.** The four siblings were appended
with a clause ending *"Same claim as 168:2."* — written from a 74-character
listing. The full-name read afterwards showed `168:2`'s existing note names
**different** engines: the Saves version-vs-version compare (`FIG-G-12`) and the
published-version diff (`W-N-23`), a prior pass's claim I did not re-verify. Four
boards were therefore pointing at a claim their source did not make. Rather than
rewrite four tails, `168:2` was given the `UX-I-24` clause as well — which is
correct on its own merits, since it draws the same engine — and the
back-reference is now true. Read back above.

### D3 · `UX-I-18` produces two dead-link states, and only one was marked — pages `1:3` and `1:6`

The correction already applied: `1339:7214` (`F · dead-link · not-found`) carries
`UX-I-18` — the ReviewBar's argument-less Re-send ships `token: null`, so the new
link resolves to nothing.

The finding's own evidence says the same call **also revokes the old token**
(`ReviewBar.tsx:104-113` → `AquibraStudio.tsx:401-421`). The link the client is
already holding therefore resolves to **revoked**, not to not-found. One defect,
two screens; one was silent.

| board | page | action | read-back |
|---|---|---|---|
| `1339:7207` Client sign-off · F · dead-link · revoked | `1:3` | **APPLIED** | `OK Client sign-off · F · dead-link · revoked · 1280 — echo of 1:6 canonical 1736:8389 … — UX-I-18 also lands here: the ReviewBar Re-send calls the shell with no client email (ReviewBar.tsx…` |
| `1736:8389` S5.5 · dead-link · revoked | **`1:6`** | **APPLIED** | `OK S5.5 · dead-link · revoked — UX-I-18 also lands here: … Not-found (1736:8397) is its twin — one defect, two dead-link states.` |

Editing only the `1:3` echo would have left the canonical silent — the same
asymmetry `review-marks-page1-6` was written to close.

### D4 · REPAIR — a destroyed board name on page `1:6`

Not a sweep. Found while reading `1:6` to check D3, and fixed because it is a
corruption inside this family.

`review-marks-page1-6#0` carried, in its `name` field, the sentence
*`APPEND to whatever the current name is: " UX-I-18: … "`* — **together with its
own note that `apply-truth-marks` sets the FULL name and does not append**. It
was applied anyway. The board's real name was overwritten with the instruction,
and `queue-state.json` logged the row `OK`, because the read-back matched the
string it was asked for. This is the arc's own documented failure shape with the
last step missing: a write verified against what was *sent*, never against what
was *meant*.

- **Before** (read this session): `APPEND to whatever the current name is: " UX-I-18: this is also the screen a ReviewBar Re-send produces — it calls the shell with no client email, so the new round ships token: null, the old link is already revoked, and the editor reports success while the client's link resolves to nothing."`
- **After** (read back): `S5.5 · dead-link · not-found — UX-I-18: this is also the screen a ReviewBar Re-send produces — it calls the shell with no client email, so the new round ships token: null, the old link is already revoked, and the editor reports success while the client's link resolves to nothing.`

The restored name is not a guess. The board sits at `7600,0`, `1280x720`, between
`1736:8389` *S5.5 · dead-link · revoked* (`6200,0`) and `1736:8405`
*[unreachable] S5.5 · dead-link · conflict* (`9000,0`); `1339:7214` on `1:3` names
`1736:8397` as its canonical for the not-found state; and `121:25`'s own name
calls this state the not-found dead link.

### D5 · `UX-I-21` Compare-surface note — page `1:3`, section 18 — **ZERO SIBLINGS**

Applied to `1717:17235` and `1717:17246`, the two boards in `18 · Review` that
draw Compare inside the 280 drawer.

**EXAMINED AND CLEARED — all 21 other boards in the section**, by full-name read
(`--full`, 360 chars, so no clause could hide as it did in section 19):
`156:2` · `157:2` · `157:58` · `157:109` · `157:169` · `157:221` · `158:2` ·
`158:57` · `158:105` · `158:162` · `158:213` · `453:3974` · `1138:4527` ·
`1705:8494` · `1705:8566` · `1705:8636` · `1705:8773` · `1705:8704` · `184:56` ·
`184:70` · `184:87`. **Not one of them draws Compare.** Eighteen are the Review
panel at 280x812, three are the Orphan-comments screens at 1440x900.

### D6 · `UX-I-26` `[not-implemented]` marker — page `1:3`, section 18 — **ZERO SIBLINGS**

Applied to `1705:8704` (the reply-composer band), whose claim is that the code
has **no producer** for what the board draws.

The candidate siblings are the five error/failure boards beside it. Each was
checked against `ReviewTab.tsx` at HEAD — not against its name — and **every one
has a real producer**, so none may carry `[not-implemented]`:

| board | producer at HEAD | verdict |
|---|---|---|
| `1705:8494` Review · comment-update-failed | `onResolve` catch → `setNotice("Couldn't update that comment. Try again.")` — `:260-266` | **CLEARED** |
| `1705:8566` Review · reply-failed | `setReplyError(true)` `:253-254`, rendered `:824` | **CLEARED** |
| `1705:8636` Review · round-history · load-error | `setRoundsError(true)` `:174-175`, rendered `:780` | **CLEARED** |
| `453:3974` Review panel · load-error | `setState("error")` `:193-194`, branch at `:423-436` | **CLEARED** |
| `1138:4527` Review panel · loading | `LoadState = "loading" \| "ready" \| "error"` `:86` | **CLEARED** |

`158:213` already carries `[unreachable]` and `184:87` already carries
`[not-implemented]`, both from earlier passes. Neither is a gap.

### D7 · `19 · Client sign-off` canonical naming — **REFUTED BY THE DRY RUN, 5 rows deleted before any write**

I had planned to append *"canonical on 1:6 is …"* to six boards whose 74-char
names read only *"echo of 1:6 at the 1280×720 minimum…"*. The dry run printed the
full current names and **five of them already carry the clause**, and my derived
mapping matched theirs exactly in all five cases:

| board | already says | my derivation | verdict |
|---|---|---|---|
| `1339:7171` A · viewing | `canonical 23:21 is 1280×900` | `23:21` | **ALREADY-CORRECT** |
| `1340:7162` B · commenting | `canonical 114:2 is 1280×900` | `114:2` | **ALREADY-CORRECT** |
| `1339:7193` C · changes-requested | `canonical 122:3 is 1280×900` | `122:3` | **ALREADY-CORRECT** |
| `1339:7186` D · approved | `canonical 117:58 is 1280×900` | `117:58` | **ALREADY-CORRECT** |
| `1339:7200` F · dead-link · expired | `canonical 121:2 is 1280×900` | `121:2` | **ALREADY-CORRECT** |

Also cleared on the later full-name read: `1339:7162` **A0 · identify** names the
whole canonical family (`23:2 / 112:2 / 112:21 / 113:3`) — correctly, because the
`1:6` side has four A0 states and naming one would have been a guess; `1339:7221`
**conflict** carries `[unreachable]` plus its echo clause; `1340:7174`
**E · post-approval-edited** carries its own `lastEditedAt` provenance.

**Had I written from the truncated listing I would have appended a duplicate
clause to five correct boards.** The dry run is what stopped it, and it cost one
call.

---

## Coverage

Measured as boards in the section that carry a mark from this arc. I did **not**
re-run whatever produced `COVERAGE.md`; the "after" column counts the boards this
sweep wrote, added to its "before".

| section | before | after | note |
|---|---|---|---|
| `1779:2` 20 · Notifications | 1 / 6 | **6 / 6** | all six measured at 280; all six now record it |
| `1776:8382` 17 · Compare | 1 / 8 | **5 / 8** | 4 siblings + the source board; 3 cleared. If COVERAGE's 1 was a board other than `168:2`, this reads 6 / 8 — I did not verify which board it counted |
| `1776:8384` 19 · Client sign-off | 1 / 10 | **2 / 10** | the canonical-naming sweep was refuted; one real sibling applied |
| `1776:8383` 18 · Review | 3 / 23 | **3 / 23** | unchanged, deliberately — 20 boards examined and cleared, see D5 and D6 |
| page `1:6` | — | **2 boards** | `1736:8389` swept, `1736:8397` repaired |

## Invariants

`node scripts/figma/verify-invariants.mjs`, run after the last write.

| class | before (given in the brief) | after | mine? |
|---|---|---|---|
| loose nodes | 77 | **77** | no change |
| section overlaps | 2 | **2** | no change |
| board overlaps | 0 | **1** | **not mine** — `161:15 caption/Inspector · multi-select` × `1176:4804 Inspector · token-picker popover`, in `08 · Inspector` (`1776:8381`), a section I did not open |
| out-of-bounds children | 1 | **1** | no change (`1719:8421` Ecommerce, pre-existing) |
| dangling edges | 0 | **0** | no change (3579 edges) |
| boards | 1031 | **1041** | **not mine** — I created no board |

**Why the two deltas cannot be mine:** all 13 writes were assignments to
`node.name`. A name write changes no `x`, `y`, `width` or `height`, so it cannot
create a board overlap, and it cannot create a board. Another agent was writing
into the file in the same window. Stated rather than assumed: I did not
investigate the Inspector overlap and it should not be counted as repaired.

---

## What I did NOT do — plainly

1. **The Notifications 280 → 360 re-lay is not done.** Six frames still draw a
   280 interior. I took the shell pass's reasoning rather than overruling it, and
   I have not read a single Notifications interior. It is now recorded on all six
   boards instead of one; it is not fixed.
2. **`add-compare-decision-footer.mjs` was not run.** `UX-I-20`'s decision footer
   is still an unapplied, mock-verified plan (`review-compare-decision-footer.json`,
   4 boards). It draws new geometry into 776-tall boards, and the founder's rule
   is that a visual change is accepted by eye against the board. **I have not
   seen a single board in any of these four sections** — no screenshot, by budget.
   Drawing a footer blind is not something a sweep should do.
3. **`fix-review-closed-toast.mjs`, `fix-compare-conflict-board.mjs`,
   `fix-signoff-boards.mjs`, `swap-client-chrome.mjs`,
   `restore-client-footer-edges.mjs` — read, none run.** They are module repairs,
   not sibling sweeps, and each is a one-command job for whoever has quota.
4. **`UX-I-23` left alone** (`DECISIONS-OPEN.md` §17 settled `Opened · no reply`
   as real), **`UX-I-20`'s conflict half not duplicated** (`807:6965` already
   draws it, `[not-implemented]`), **`UX-I-29` not re-filed**, **`UX-I-17`'s
   refuted three-quarters not written onto any board.** As instructed.
5. **No caption was touched.** Eight captions in §18 and three in §17 were never
   rewritten by the module pass. Their states carry no UX finding, so there is no
   sibling correction to sweep — and a caption rewrite is the edit that grew
   twelve captions into the row below them on 2026-09-07. Not started at this
   budget.
6. **`23 · Journeys · S-flows` (`1776:8388`) is untouched.** It redraws the pill
   and bar states this family owns (`S5.1 · sent`, `S5.2 · opened-not-acted`,
   `S5.6 · re-sent`, `S1.6 · view-mode`) and it is at 4/74. The `UX-I-23`
   vocabulary question lives there, not here. Out of my sections and not swept.
7. **No prototype edge was added or changed.** `review-hotspots.json` is still
   three unresolved rows.

## Tooling changed

- **`scripts/figma/sweep-append-marks.mjs` — new.** Appends a suffix to a board
  name *inside the sandbox*, against whatever the node actually holds, so a plan
  never has to know the tail it is extending. `apply-truth-marks.mjs` sets the
  full name and is the right tool for authoring one; it is the wrong tool for a
  sweep, and D4 above is what that costs. Idempotent via
  `skip_if_name_contains`, refuses straight double quotes and backticks before
  spending a call, groups rows by page, and prints the raw reply when a batch
  parses zero rows.
- **`scripts/figma/dump-section-children.mjs` — extended.** `--text` returns the
  leading characters of TEXT children (a caption is a child of the section, not
  of a board, so a name-only listing cannot see its content); `--full` widens
  names from 74 to 360 characters, which is the check that refuted D7; `--sections=*`
  lists every top-level child of a page, because page `1:6`'s boards are loose and
  a section-only listing reports them as absent; and the reader now emits an
  explicit `!! TRUNCATED` sentinel instead of a silent `slice(0,19000)`.
- **`plans/sweep-c-appends.json` is deliberately an object with its rows under
  `sweep`.** As a bare array with `add`/`key` fields, `normalize-plans.mjs`
  classified all 15 rows as `append-text` — the TEXT-node appender — and would
  have handed FRAME ids to it. With the fields renamed it dropped them into
  *neither* the queue *nor* `queue-needs-review.json`. Under `sweep` they are
  reported as `unclassified`, which is a skip rather than a silent drop.

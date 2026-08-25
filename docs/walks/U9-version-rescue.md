# U9 · Version rescue — walk record

Walked 2026-08-25 · localhost:3000, 1440×900, real session, site `scratch-smoke`
(12 server-backed version rows, all auto-checkpoints).

Picks up the four legs `F-A6-versions.md` closed by naming them **"Not covered"**:
the Compare diptych / semantic list, the time-travel scrubber, the 300 ms hover
preview banner, and the server mirror's own 50-per-site cap.

## Legs

| # | leg | result |
|---|---|---|
| 1 | server mirror's 50-per-site cap | **PASS (code)** — see below |
| 2 | hover preview after 300 ms | **PASS, precondition unmet** — see below |
| 3 | Compare — semantic list | **FAILED, fixed here** — printed the engine's event id |
| 4 | Compare — Visual/Semantic toggle | **FAILED, fixed here** — the group had no ground |
| 5 | time-travel scrubber | **NOT COVERED** — still open, see the bottom |

## Leg 1 — the cap, and it is a matched pair

Two implementations, both `50`, both evicting **auto-saves only**:

- `server/services/site-version.service.ts:71` `pruneSiteVersions`
- `packages/editor/src/engine/storage/VersionHistoryStorage.ts:223` `pruneVersions`

Each computes `excess = all.length - 50` and takes `excess` rows from the OLDEST
end of the auto-saves alone, returning early when there are none. A site whose
named versions exceed the cap keeps them all — the panel's own printed rule,
*"50 versions kept. Auto-saves prune oldest first; named ones never prune."*

Verified by reading both, not by producing 51 versions. Stated plainly: **the
eviction was not exercised live.**

## Leg 2 — the hover preview is fine; my list could not trigger it

Nothing appeared after 1000 ms of hover. That is not a defect:
`VersionList.tsx:134` returns early when `!version.visualSnapshot`, and
`VersionTimelineManager.ts:237` sets `visualSnapshot: null` for auto-checkpoints
with the comment *"Skip visual snapshot for auto-checkpoints to save storage"*.
All twelve rows on this site are auto-checkpoints, so there was nothing to
preview. The same fact disables the Visual compare tab, which says so in its own
`title`.

**Not verified:** the preview on a NAMED version, which is the case that can
actually render.

## Leg 3 — the fifth place the engine's event id reached a user

Expanding Compare on an auto-save printed, in plain sight:

```
Nothing changed since “Auto: project:loaded”.
```

`versionDisplayName` is the SSOT that turns that into "Auto-save". The 2026-08-24
sweep fixed four callers that skipped it — three `aria-label`s and the delete
toast — and stopped there. Three more raw `version.name` uses sat beside this one
(`CompareView.tsx:140,141`, `VersionList.tsx:233`); those only render for a
version that HAS a visual snapshot, and today only named versions do, so they
could not leak *yet*. All four now route through the SSOT.

Measured after the fix: **`Nothing changed since “Auto-save”.`**

The new test is written against the FILE rather than four string literals, so the
next one is caught by construction.

## Leg 4 — and a whole class of light-theme residue behind it

The Visual/Semantic toggle group was `rgba(255,255,255,0.04)`. Measured, its
parent was `rgb(255,255,255)`: white at 4% on white. Only its border rendered, so
the two pills floated with nothing holding them together.

It is a dark-theme value that outlived the 2026-04-18 theme unification, and it
is silent — nothing throws, and **Gate 16 ratchets HEX, so `rgba()` is invisible
to it**. Grepping the class found two more of exactly the same shape:

| where | was | over | now |
|---|---|---|---|
| `CompareView` toggle group | `rgba(255,255,255,0.04)` | `#FFFFFF` | `var(--bk-bg-subtle)` |
| `StudioPanels.canvasPattern` dot grid | `rgba(255,255,255,0.03)` | `--bk-bg-panel` = `#FFFFFF` | `var(--bk-border)` |
| `CanvasButton` default variant | `rgba(255,255,255,0.06)` | a light card | `CANVAS_COLORS.bgPanelSecondary` |

The canvas backdrop grid had therefore **drawn nothing at all** since the flip.
Measured after: dots `rgb(229,231,235)` on `rgb(243,244,246)`.

`CANVAS_COLORS` carries a note saying its dark values were repointed at the light
tokens, *"one edit for twenty-six call sites"*. `CanvasButton`'s own literal was
not one of the twenty-six.

**Not verified live:** the `CanvasButton` default variant — it did not render in
this walk's states. Its value is `bgPanelSecondary` → `var(--bk-bg-subtle)` →
`#F3F4F6`, which is arithmetic, not a measurement.

A guard now scans chrome for a below-0.5-alpha white literal, with three
allowlisted files that each carry their reason (a dark device bezel, a white spot
on the accent-coloured multi-select chip, and the customer-facing dark template
HTML, which is not chrome).

**That guard lied on its first draft** and was rewritten. It anchored on
`background…rgba(…)` within one line; two mutations failed it and the third — the
canvas dot grid, the exact bug it was written for — passed, because the value
lives inside a multi-line template literal and the property name sits on the line
above. It now matches the literal itself, wherever it is assigned.

## Not covered

The **time-travel scrubber** (`sidebar/tabs/history/components/TimeTravelScrubber.tsx`,
378 lines) was never reached: it renders in the History tab's other view and this
walk stayed in Saves. Its own header documents a real tradeoff — it previews from
the nearest NamedVersion's `visualSnapshot` rather than rendering each frame — so
on a site of pure auto-checkpoints it has no frames to show, the same precondition
that made leg 2 a no-op. That is the next thing to walk.

Also not covered: the AI summary button, and the Published / What's live tab.

## Harness note, cost me two runs

Serving the dashboard on **:3001** makes every tRPC call fail with
`Failed to fetch` — the client still calls **:3000** — and the panel then renders
its honest empty state, *"No saved versions yet"*. It looks exactly like a site
with no history. Run the dashboard on 3000.

And the first reading of "a `<div>` intercepts the Compare button" was also the
harness: `history.css:498-522` reveals `.version-actions` on `:hover` /
`:focus-within`, and the probe had parked the mouse in the corner.

## ~~The board says three modes. The app ships two.~~ — WRONG, see the correction below

Read from Figma during this walk (`get_design_context`, board `168:82`
*Compare · no-changes*, the one the code's own comment quotes):

```
mode strip:  seg/Side by side   seg/Overlay   seg/List
copy:        "Nothing changed since v3."
             "No panes render — an empty diff view reads as broken."
palette:     #e5e7eb  #f3f4f6  #111827  #6b7280   (light; no white-alpha anywhere)
frame:       1080 × 776, a card with its own "Compare bar" header
```

Two facts fall out of that.

**The colours are settled and the board needed no change.** Its palette names
`#f3f4f6` and `#e5e7eb` — exactly `--bk-bg-subtle` and `--bk-border`, the two
tokens leg 4 moved the code onto. The board was already light; the code was the
stale side. Nothing to update in Figma for that fix.

**The shape is not settled.** The board draws a **three**-segment mode strip —
*Side by side* / *Overlay* / *List* — inside a 1080×776 card with its own header.
The app renders a **two**-pill toggle — *Visual* / *Semantic* — inline beneath a
version row in a ~330px sidebar. Mapping the two: the board's *Side by side* and
*Overlay* are two distinct visual comparisons and the app has only one, so
**Overlay does not exist in the product**; *List* is the app's *Semantic*.

This is not one board drifting. All eight `Compare · *` boards are
`status: "active"` in `scripts/conformance/boards.json` — none is design-ahead —
and two of them (`168:82`, `168:2`) carry `authority: "code:cites-board"`, so the
code claims to follow boards it does not match in shape.

Per the founder's precedence — behaviour follows the code contract, **everything
visual follows the board** — the Compare surface is owed a rebuild against its
family, not a patch. Recorded here rather than started: it is eight boards and a
change of container, which is a unit of work, not a leg of this walk.


## Codex, second pass — the guard was not scanning what it claimed

Two findings, both real, both about the guard rather than the fixes.

**It skipped `editor/design-system/` entirely.** The first draft excluded that
subtree on the reading that the folder is the site-builder token domain and so
not chrome. Half right, and the wrong half mattered: its SUBJECT is the
customer's tokens, but its SURFACE is the editor's own Brand panel and modals,
styled out of the `--bk-*` chrome namespace. Five more of the same bug were
sitting in there:

| where | was | what it is | live? |
|---|---|---|---|
| `design-tokens.css:29` `.buildrick-token-row` | 0.02 white | a token row's plate | **dead rule** |
| `design-tokens.css:181` `__swatch-preview` | `1px solid` 0.1 white | the swatch's outline | live — `ColorPicker.tsx:282` |
| `design-tokens.css:191` `__hex-input-wrap` | 0.05 white | the hex field's ground | live — `ColorPicker.tsx:286` |
| `AddTokenModal.tsx:97` | 0.05 white | the **name input** | live (inline style) |
| `AddTokenModal.tsx:141` | 0.05 white | the **hex input** | live (inline style) |

`.buildrick-token-row` is one of **12 selectors in that 285-line file with no
`.tsx` consumer at all** — `buildrick-token-grid`, `-color-swatch`, `-token-row`,
`-token-name`, `-token-value`, `-copy-btn`, `-radius-preview`, `-usage-hint{,-title,-text}`,
`__cancel-btn`, `__save-btn`. Twenty of the thirty-two ARE live, so the file is
not dead, just half of it. Recorded, not deleted — that is its own commit.

Two of the five are input fields on a white modal, which therefore had no fill at
all. And this was not the first attempt at the class: `TypeTokenList.tsx:64` and
`ReviewModal.tsx:32` already carry comments recording an earlier drain of five
and four values in those files. The drain stopped one folder short, which is what
a guard is for — and the guard had been told to look away.

So the claim "scans chrome" was an overstatement when it was written here. It is
true now.

**The matcher read one spelling of the colour.** `rgba(255,255,255,0.04)` was
caught; `rgb(255 255 255 / 4%)`, `hsla(0,0%,100%,0.04)` and `hsl(0 0% 100% /
0.04)` were not — the same colour, evaded by preference rather than intent. All
four forms now match, and all four were planted and confirmed to fail the guard.
Re-including `design-system` was negative-tested the same way: restoring one CSS
value made the guard fail naming that file and line.

**What was NOT measured on a rendered element.** The ColorPicker mounts only
after drilling Brand → Tokens → color → a token, and five attempts did not get a
token row to open it — the rows are class-less `<div>`s (`Action #1A56DB unused`,
`Surface #F8FAFC unused`, …). Instead the running app's own stylesheet was read
back through `document.styleSheets`:

```
.buildrick-token-row                     background: var(--bk-bg-subtle)
.buildrick-design-picker__swatch-preview border: 1px solid var(--bk-border)
.buildrick-design-picker__hex-input-wrap background: var(--bk-bg-card)
                                         border: 1px solid var(--bk-border)
--bk-bg-card #fff · --bk-bg-subtle #f3f4f6 · --bk-border #e5e7eb
```

That proves the served CSS carries the tokens and that they resolve on that page.
It is not the same as measuring the painted element, and the two `AddTokenModal`
inputs were not reached at all.


## Correction — the Compare family is built, and I matched it to the wrong surface

Written 2026-08-25, same session, before any of the rebuild happened.

The section above compared the eight `Compare · *` boards against
`panels/version-history/CompareView.tsx` and reported the product missing a mode,
a stepper and a page selector. That comparison was invalid: **those boards do not
belong to that component.**

`panels/version-history/ApprovedCompareView.tsx` renders
`"Side by side" : "Overlay" : "List"` verbatim at line 149, off
`type Mode = "split" | "overlay" | "list"` (line 47). It prints
`{n} change{s} · {m} of {n}` — the board's stepper — at lines 158-159, and filters
by page through `changesForPage` (line 134) — the board's `Home ▾`. It carries a
comment at line 155 recording that the counter used to print only in List and now
prints in all three, which is someone conforming it to this very board. It is
reached from `ReviewTab.tsx:465`.

Three things I had already read and did not join up:

- the board's left pane is labelled **`v3 · approved`**, in success green. "Approved"
  is the review contract's word, not version history's.
- board `168:2` hotspots to **`Compare · resend-confirm`** — resending a review
  request. Version history has nothing to resend.
- its data shape is `CompareChange { kind, page, key, label, detail }`
  (`shared/utils/html/approvedCompare.ts:30`) — it already carries the page and a
  human label, which is exactly the "engine gap" I wrote up as blocking List.

So the Compare family is **implemented, and to its boards**. The engine gap I
described is real for `VersionTimelineManager.compareVersions`, and irrelevant,
because nothing renders the board from that data.

**What is actually true about version-history's Compare:** it has no board at all.
The `History` family's 23 boards cover Saves, Published, Backups, the milestone
banner, time-travel, restore, prune, load-error and empty — there is no
`History · Saves · compare`. `CompareView`'s two-pill Visual/Semantic toggle and
its screenshot diptych are unboarded surface.

That is a question for the founder, not a defect to fix: an unboarded surface in a
full-board rebuild is either out of scope, or should become the same three-mode
view, or should not exist.

**The failure mode, for the record.** I read `CompareView`, read the boards,
matched them, and never asked whether anything ELSE renders those boards — with a
`grep -rn "Side by side"` one command away. The same shape as
`checked-half-the-source-called-it-unbuildable`: a conclusion drawn across a
boundary I never checked. The board census was on screen the whole time and lists
`Compare` as its own family, separate from `History` — which is the tell I walked
past.

## Leg 5 — the scrubber, and what the Saves boards actually still want

Read boards `163:113` (`History · Saves · time-travel`) and `163:2`
(`History · Saves · changes`) on 2026-08-25, then — applying the lesson above —
grepped every string on them across `src/` before calling anything drift.

**Built, and to the board:** the time-travel bar. `HistoryTab.tsx` carries
`Previewing`, `Restore this version` and `Nothing is written until Restore.`
verbatim. The approved anchor and Now row are `SavesChrome.tsx`, which renders an
`⚑ APPROVED` band with reviewer and stamp, and `Now — N changes since approval`
at line 98. The prune note reads its cap off `VersionTimelineManager` rather than
hardcoding 50.

**Genuinely missing, each verified by grep rather than by eye:**

| # | board | app | evidence |
|---|---|---|---|
| 1 | version row shows `3 changes` | shows `N el`, and **never renders it** | `VersionList.tsx:335` hardcodes `elementCount={0}`; no other caller passes it |
| 2 | approved anchor offers `Compare with current` | no action at all | `"Compare with current"` has **0** consumers in `src/`, while `ApprovedCompareView` — which renders exactly that comparison — is mounted only from `ReviewTab.tsx:465` |
| 3 | rows are attributed (`Ali · 8 changes`) | no author anywhere | see below |
| 4 | Now row has a second line naming what changed (`hero copy · 2 images · menu`) | count only | `SavesChrome.tsx:98` |

**Authorship is unread, not unrecorded** (corrected after measuring — the first
version of this paragraph said "dead end to end", which was too strong). `VersionTimelineManager.setCurrentUserId` and
`HistoryManager.setCurrentUserId` have **zero callers** — checked for both the
method and the field, in every syntactic form. So `currentUserId` is permanently
`null` and **six write sites** stamp it into stored rows: versions at
`VersionTimelineManager.ts:172,238`, history entries at `HistoryManager.ts:203,213,302`.
Nothing reads it back for display either. The source exists and is one prop away —
`app/edit/[siteId]/page.tsx` already has `session.user.id` in hand and passes only
`siteId` to `EditorClient`.

**And a fifth, found on the way:** `useAutoMilestone.ts:177` posts
`pageStructure: { pageCount, elementCount: 0 }` to `ai.milestoneSuggest`, with
`pageCount` computed one line above and the element count pinned. It is not
cosmetic — `ai.service.ts:418` puts it straight in the prompt:
*"Current page structure: N pages, approximately 0 elements."* Every milestone
name is suggested by a model told the site is empty.

Three pinned zeros and a dead setter, in one feature. None of them throws.


## Leg 5 fixes — and one correction, and one incident

Five things shipped. Each was verified in the running editor except where said.

**1 · The row's change count.** `versionChangeCounts` derives it from the undo
stack: a version's window opens when the previous one was taken and closes when
this one was. Measured live after two edits and a named save:

```
attr-check | 03:46 AM | Just now | 2 changes | Compare | Restore | ×
Auto-save  | 03:45 AM | Just now | Auto      | Compare | Restore | ×
```

The older auto-saves carry NO badge, which is the rule working: the undo stack
does not reach back to them, and a row announcing "0 changes" over a version that
reshaped the site would be a lie the board never asked for. Ids absent from the
map mean "not known", never "zero".

**2 · `Compare with current`.** Routed, not rebuilt. `UI_PANEL_OPEN` already
carries a `screen`, `TabRouter` maps `activeSubTab === "compare"` to ReviewTab's
existing `initialCompare`, and ReviewTab opens straight into
`ApprovedCompareView`. A second copy here would have needed its own snapshot and
live-export plumbing and would have drifted from the boards.

**3 · Attribution — and the correction.** The claim above was too strong. The
server has been recording it correctly all along: `site-version.ts:30` stamps
`createdBy` from the session and refuses a client-supplied one ("attribution
spoofing in version history"). Confirmed in the database — every row on the
scratch site carries a `createdBy`.

What was actually broken is narrower and still real:

- the editor's own `setCurrentUserId` had zero callers on BOTH managers, so
  locally-created versions and **all history entries** (which are never mirrored)
  were written with `userId: null`;
- and the editor had **no reference to `createdBy` anywhere** — the server's
  authoritative author was never read back, so no row could ever show one.

Both are fixed: `useComposerInit` now looks the user up and tells both managers,
and `hydrateVersionsFromServer` takes `userId` off the LIST ROW rather than the
payload, because the payload is whatever some client sent and the list row is
what the server stamped. Measured live — both managers came back holding
`cmpa9ohx10000wrjux4ecumzo` where they had held `null`.

**4 · The Now row's second line.** Distinct labels, newest first, capped at three
because the board draws three. Unit-tested; **not** live-verified — it needs an
APPROVED review on the site, which is server state this walk did not seed.

**5 · The AI's element count.** `useAutoMilestone` sent `elementCount: 0` beside a
computed `pageCount`, and `ai.service.ts:418` puts the pair in the prompt.
Verified by reading the chain end to end; **not** live-verified, because doing so
means firing a paid generation call.

### Incident — I deleted 22 elements from a populated site

Cleaning up after the probes, I removed every non-container element from the E2E
scratch site, on the belief that it had held one root container before I started.
It had held **fifty**, unchanged since 21:56, and the version payloads say so.

The "1 element" reading came from the **:3001 session** — the one where every
tRPC call failed with `Failed to fetch` because the client still calls :3000. The
project never loaded; the composer held an empty default; `getAllElements()`
returned the root. I had already diagnosed that port problem and written it up in
this very file, and then used a number produced by it as a baseline an hour later.

Repaired by restoring `v-1787611556038-15ttlylni` (22:45:59, the auto-save from
before tonight's inserts): 6 → 50, verified after a full reload, composition
intact — 30 containers, 5 headings, 4 grids, 4 flex, 4 inputs, 2 paragraphs, 1
button. Which incidentally re-verified Restore end to end.

---

## Addendum, 2026-08-25 (later) — the scrubber's precondition, and the approval band

Lane of `docs/plans/2026-08-25-editor-flow-walk-arc.md`. This record's "Not
covered" named the **time-travel scrubber** as *"the next thing to walk"*, and
noted the blocker: every row on this site was an auto-checkpoint with
`visualSnapshot: null`.

**That blocker is gone** — the `F-A2` lane earlier today created named versions
through `+ Save a version`, so the fixture now carries **3 non-auto rows**.

### The scrubber is fed by undo history, not by saved versions

`Version History → All changes`, on a **fresh load**:

```
UNDO HISTORY   Clear   Time-Travel
No undo history
Use Ctrl+Z to undo changes
j k navigate · Enter expand · g G start/end
```

After **one** real edit in the same session (an AI apply):

```
UNDO HISTORY   Clear   Time-Travel
TODAY
Ai Edit   12:02 PM   Just now
```

So the empty state on a fresh load is **correct, not a defect**: the scrubber
and the change list read the **in-session undo stack**, which Ch.12 already
records as `✅⚪ RAM-only`. It can never show anything immediately after opening
the editor. The record's leg-2 finding — that hover preview had nothing to show
— was the same precondition seen from the other side.

Worth noting for whoever designs this panel: `j` / `k` / `Enter` / `g` / `G`
keyboard navigation is advertised in the panel itself and no walk record has
mentioned it before.

### Bonus — the approval band tracks drift, and names it

The `U6` approval taken earlier today surfaces here as a band above the list:

| state | band |
|---|---|
| immediately after approval | `⚑ APPROVED · Fixture Reviewer · Aug 25, 11:41 · Compare with current · **Now — 0 changes since approval**` |
| after one AI edit | `… · **Now — 1 change since approval** · Ai Edit` |

It counts post-approval drift and **names the change**. That is the
`S5.2 · approved-but-edited-since` board state, working live — and it means the
review loop reaches **three** editor surfaces, not one: the topbar
("Approved by …"), the review bar, and this band.

### Still not covered

The AI summary button, and the `Published / What's live` tab — its label is a
two-line tab and this pass's click did not land on it.

### What this walk did NOT assess

Visual and IA. Behaviour, state and data only.

<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260825-183229.md -->
# Editor defect fix pass — 2026-08-25

Status: DRAFT (input to /autoplan)

The 2026-08-25 flow-walk arc closed with 39 commits and **zero** product-code
changes. Every defect below was measured in the running app and recorded in
`docs/walks/`. This plan is the fix pass, and it deliberately ends the
zero-product-code streak.

## Binding constraints

- **Done = observed in the running app.** Not a green suite — three separate
  suites in this repo have passed over broken features. Every fix re-runs the
  exact live measurement that found the defect.
- Dev server already up on :3000 with `OLLAMA_BASE_URL` cleared (its mere
  presence routes ALL AI to a dead local provider).
- Reuse `scripts/baseline/editor-rig.mjs` (8 documented traps). Fixture site
  `cmrsur1fp000unh3rvmmiq25t`.
- Never edit the founder's `.env.local` — override env at process launch.
- **`AquibraStudio.tsx` may be mid-edit in the founder's tree and must never be
  staged from an agent session** (root `CLAUDE.md`). Defect 1 nominally lives
  there; §D1 below proposes a fix that avoids the file entirely.
- chrome-ui is the single import surface. Gate 24 bans raw
  `<button>/<input>/<select>/<textarea>` in chrome. `--bk-*` tokens only.
  The pre-push hook runs the full gate suite and BLOCKS.

Out of scope (founder, 2026-08-25): payments/Stripe; deploy (F-A3 real Vercel
leg, S6 custom-domain DNS); drawing the three uncovered client-review Figma
boards (handed to `docs/plans/2026-08-25-editor-ui-redesign.md`).

---

## The ledger

Seventeen defects plus one board-binding copy fix. Severity as measured.

| # | Sev | Surface | One line |
|---|-----|---------|----------|
| D1 | ⛔ | review | a client can be invited to exactly one round per site, ever |
| D2 | ⛔ | review | panel tells the designer to keep waiting on a closed round |
| D3 | ⛔ | publish gate | calls a resolved round "still open" |
| D4 | ⛔ | settings | header ✕ bypasses the dirty guard — silent data loss |
| D5 | ⚠ | settings | ✕ named "Close General", closes the whole surface |
| D6 | ⚠ | settings | Save identical at 0 unsaved and 1 unsaved |
| D7 | ⛔ | media | "This device only" is a hardcoded pill with no state |
| D8 | ⚠ | media | local-only warning toast fires twice per asset |
| D9 | ⚠ | media | folder rail is keyboard-unreachable |
| D10 | ⚠ | media | `New folder` icon-only, no accessible name |
| D11 | ⚠ | media | image optimizer's only door is the picker modal |
| D12 | ⛔ | brand | import Apply wedges the panel on Import/export |
| D13 | ⚠ | brand | Tailwind export is colors-only under a generic label |
| D14 | ⚠ | brand | exported CSS carries two token prefixes |
| D15 | ⚠ | brand | `Replace` and `Merge · keep theirs` are one branch |
| D16 | ⚠ | brand | parse-valid ≠ apply-routable; skipped ids never named |
| D17 | ⛔ | components | instances unselectable; the fix message cannot work |
| D18 | — | review | code says "Ask for changes", board says "Request changes" |

---

## D1 — a client can be invited to exactly one round, ever

Two independent halves, both measured.

**Half A, no token.** `AquibraStudio.tsx:392`:
```js
await submitForReview(undefined, undefined, undefined, snapshotPages);
//                    note       summary    clientEmail
```
`review.service.ts:85` mints a token only `if (clientEmail)`, so every round
after the first carries `token: null`.

**Half B, no door.** `ReviewTab.tsx:405` renders `SendForReview` — the only
form in the product with a "Client email" field — under `if (!round)`. Once any
round exists it is gone for good.

Measured: panel `Re-send for review` on the approved fixture produced a PENDING
round with `token: null`, and the client's old link still showed round 1's
*"You approved this."* The client's terminal screen promises *"They'll send a
new link"* — nothing in the product can send it.

### Proposed fix — server-side carry-forward (avoids AquibraStudio entirely)

`review.service.ts`: when no `clientEmail` is supplied but the site's open round
already has an `invitedEmail`, carry it forward:

```ts
const email = clientEmail ?? existing?.invitedEmail ?? null;
if (email) ({ token } = await issueReviewToken(request.id, email));
```

This is the semantic a button labelled "Re-send" already implies: re-send to
whoever it was sent to. It fixes Half A in one file, on the server, with no
editor change and no `AquibraStudio.tsx` edit.

**The hazard this must not reintroduce**, recorded in the code's own comment at
`review.service.ts:78-83`: rotating on an internal submit once "silently killed
the client's live link and the new token went nowhere", because the dashboard's
"Send for review" carries no email and no invite mail was sent. Carrying the
email forward removes that hazard — the new token now goes somewhere — but it
also means a dashboard internal submit will email the client. **That is a
behaviour change to the dashboard path and needs an explicit call.**

Alternative considered: widen `onResend` to take an email and thread it from the
panel. Rejected for now — it requires editing `AquibraStudio.tsx`, which this
session may not stage.

**Half B fix (ReviewTab only):** when `round && !round.invitedEmail`, render an
"Invite a client" affordance that collects an email and submits it. Same file
the gate lives in; no shell change.

## D2 / D3 — three statuses in the schema, two in the UI

One shape, two sites.

`ReviewTab.tsx:601-607` chooses its body from `round.revoked` → `total` →
`openComments.length` and never reads status, so a `CHANGES_REQUESTED` round
with no note renders `emptyBody` — *"has not commented yet. You will be
notified."* — beside a pill reading "Changes requested".

`PublishConfirmFacts.tsx:41` handles `approved`, `revoked` and
`openCommentCount > 0`, then falls through to `Round N is still open.`
`CHANGES_REQUESTED` takes the fallthrough: right decision (publish blocked),
wrong reason.

**Fix:** add an explicit `CHANGES_REQUESTED` branch to both. Copy should name
what happened and whose move it is.

## D4 / D5 / D6 — the Settings savebar and its exits

`SettingsTab.tsx:802` hands `PanelFrame.Header` the parent's `onClose`
untouched. The dirty check at `:551` guards Escape; `LeftSidebar.tsx:391`
guards rail switches; nothing guards the ✕. Measured: typed a value, counter
read `1 unsaved`, clicked ✕ → no dialog, **zero POSTs during close**, field
empty on reopen.

**Fix D4:** generalise the existing guard to hold a *pending action* rather than
implying "navigate to root", and route the ✕ through it.
**Fix D5:** the ✕'s accessible name is derived from the drilled-in section
title, so it reads "Close General" while closing the whole surface. Name it for
what it closes.
**Fix D6:** `Save` is `disabled:false`, opacity 1, cursor pointer at `0 unsaved`
— byte-identical to its dirty state. Disable it when the counter is zero.

## D7 / D8 — media tells the truth per asset and lies in the status bar

`LibraryManager.tsx:428-431` renders the sync pill unconditionally — no prop, no
state, no condition. It is the only persistent indicator of whether the library
reached the server, and it cannot distinguish the two cases it exists for. In
production, where `check-prod-env.mjs` requires `BLOB_READ_WRITE_TOKEN`, assets
**do** reach the server and the pill still says they did not.

The per-asset path is already right: on failure `AssetUploadService.ts:137`
falls back to local-only by design and the user is told precisely — *"…saved on
this device — it didn't reach the server, so it won't publish yet."* **That
warning fires twice per asset** (measured: two identical entries in one host).

**Fix D7:** drive the pill from real per-asset sync state — nothing local-only
→ no warning; N local-only → say N and what it means for publishing.
**Fix D8:** find and remove the duplicate emit.

## D9 / D10 / D11 — media reachability

`FolderTree.tsx:108-113`: every rail row — `Recent`, `In use`, `Unused`,
`All assets`, `Trash`, and each user folder — is a bare
`<div class="mgr-node">` carrying an `onClick`, with no `role`, no `tabindex`
and no button semantics. `New folder` is icon-only with `title` and no
`aria-label`.

`Optimize` is a tab on `MediaLibraryPanel:184`, which `StudioModals.tsx:171`
mounts as the **picker** (`openMediaLibrary(allowedTypes, onSelect)`), so the
only way to reach the optimizer is to be mid-way through choosing an image for
an element. The fullpage manager has no optimize control.

**Fix D9:** give the rows button semantics without adding native elements —
Gate 24 owns that surface. `role="button"`, `tabIndex={0}`, Enter/Space.
**Fix D10:** add an accessible name.
**Fix D11:** add an optimize door to the manager (asset detail rail is the
natural home, beside `Edit`).

## D12 — the import Apply wedge  ⚠ root cause unknown

Control group, same button, same click, same session:

    before Apply:  ‹ Import / export  →  back at root: TRUE
    after  Apply:  ‹ Import / export  →  back at root: FALSE

The control stays rendered and does nothing; `✕` and reopening Brand returns to
the same screen. Reproduced 4×. This also blocks the only route to a planted
lint violation, so `banned-hue` and `pure-black` have never been observed
firing.

**This is the one defect with no diagnosed cause.** Suspects: `handleApply`'s
`handleCancel()`, the registry re-render that follows `apply()`, or drill-state
held above the panel. Per the founder's standing instruction, **if this stalls,
take a codex review on it specifically.** Fixing it also unblocks the negative
test for the remaining six lint rules, which should then run.

## D13 / D14 / D15 / D16 — export and import correctness

**D13** `exportUtils.ts:121-123` filters `t.type === "color"`, so the Tailwind
export carries colors only while its label says "theme.extend config".
Completeness says emit every kind Tailwind can express (spacing, radius,
fontFamily, boxShadow, zIndex, screens, opacity).

**D14** The exported CSS carries two prefixes — `--buildrick-design-*` for
colors and typography, `--bd-*` for the other eleven kinds — because `toVar`
writes each token's stored `cssVar` verbatim (`exportUtils.ts:95`). This is
seed-data drift, not a Gate 15 matter (that gate covers chrome tokens).
**Renaming a customer's CSS vars is a breaking change to published sites.**
`generateCompatibilityShim(schemaVersion)` already exists for exactly this and
is empty at the V1 baseline. Any fix must go through it.

**D15** `handleApply` filters on `strategy === "keep-mine"` and sends
`parsed.tokens` otherwise, so `Replace` and `Merge · keep theirs` are the same
branch — the file header says so: *"same as replace for v1"*. Three buttons,
two outcomes, nothing on screen saying so. Either give `Replace` its real
meaning (replace the whole set, dropping tokens absent from the import) or drop
to two buttons.

**D16** `importUtils.ts:33` `REQUIRED_FIELDS` omits `kind`, and
`useImportTokens.ts:42-49` `inferKind` maps only `colors`/`typography`/
`spacing` of **14** registries. A `kind`-less token in the other eleven
categories is counted in "Valid tokens N" and in "Apply N valid only", then
silently skipped; the toast reports a count while `ImportStats.skipped` already
holds the ids. Fix all three: infer all 14, count unroutable tokens as invalid
at parse time, and name the skipped ids.

## D17 — component instances cannot be selected  ⚠ engine, highest risk

`ElementSerialization.ts:118-127`:
```ts
isLocked(): boolean {
  return this.getData().locked === true || this.isComponentInstance();
}
```
Every instance is permanently locked, so instances cannot be selected on canvas
— and the toast that tells the user to "Unlock it in the Layers panel" cannot
succeed, because clearing `data.locked` leaves the second disjunct true.
Verified live: found the Layers lock control, clicked it, selection still
failed.

This is engine code with the widest blast radius in the plan. The fix must
answer *why* instance-ness was folded into `isLocked` before removing it —
selection, drag, delete and the override system may all read it.

## D18 — board-binding copy

Figma `S5.5 · reviewer-view` (`807:8723`) bottom bar reads **"Request
changes"**; the shipped client surface reads **"Ask for changes"**. Button copy
is UI copy, not board sample data, so the precedence rule makes the board
binding and the code the side that moves.

---

## Proposed sequencing

1. **Cheap and isolated first** — D3, D5, D6, D10, D18. Each one file, each with
   a live re-check.
2. **Contained UI fixes** — D2, D9, D8, D13, D16.
3. **Needs a design call** — D1 (dashboard-path behaviour change), D15
   (what `Replace` means), D14 (customer CSS var rename + shim), D11 (where the
   optimize door lives).
4. **Needs investigation before a fix exists** — D12 (wedge), D17 (engine
   lock), D7 (per-asset sync state source of truth).
5. **Re-run the blocked negative test** once D12 is fixed: plant a black and a
   violet token and confirm `pure-black` and `banned-hue` fire.

## Verification contract

Every fix re-runs the measurement that found it, live, against the fixture:

| # | The measurement that must flip |
|---|---|
| D1 | panel re-send on a client-linked round mints a token; that token opens round 2 with no session |
| D2 | a `CHANGES_REQUESTED` round with zero comments does not say "has not commented yet" |
| D3 | the publish gate names the change request, not "still open" |
| D4 | dirty + ✕ raises the guard; zero silent POST-less closes |
| D5 | accessible name matches what the control closes |
| D6 | Save is disabled at `0 unsaved` |
| D7 | pill reflects real sync state on a synced library and on a local-only one |
| D8 | one toast per asset, not two |
| D9 | every rail row reachable by Tab and actionable by Enter/Space |
| D10 | `New folder` has an accessible name |
| D11 | optimize reachable from the manager without opening the picker |
| D12 | back at root TRUE after an import Apply |
| D13 | Tailwind export carries non-color kinds |
| D14 | one prefix, or a shim that keeps old names resolving |
| D15 | three buttons produce three outcomes, or two buttons |
| D16 | an unroutable token is counted invalid, and skipped ids are named |
| D17 | an instance is selectable on canvas |
| D18 | the client surface reads "Request changes" |

## Open questions for review

1. D1: is emailing the client on a dashboard internal submit correct, or does
   the carry-forward need to be scoped to the editor's re-send only?
2. D14: rename the eleven `--bd-*` kinds and shim, or leave the split and fix
   the documentation instead? Customers' published CSS depends on these names.
3. D15: should `Replace` mean "replace the whole token set"? That deletes
   tokens absent from the import — a destructive read of a button that does not
   currently warn.
4. D17: what else reads `isLocked()`? Selection, drag, delete, overrides — the
   fix is only safe once that list is known.
5. D11: is the asset detail rail the right home for optimize, or does the
   manager need its own toolbar entry?

---

# Review addenda — 2026-08-25

## CODEX SAYS (CEO — strategy challenge)

Ten findings. The load-bearing ones:

1. **D1 is a thesis failure, not a defect row.** "A product whose only wedge is
   'agency/client approval loop' cannot tolerate 'one review round ever' as just
   another red row in a ledger. It should be the entire release."
2. **The D1 fix is patch-thinking.** Carrying the email forward repairs one path
   but dodges the round model.
3. **D17 threatens whether the component system exists as a primitive at all**,
   not just whether one flag is wrong. Deserves a subsystem review.
4. **Avoiding `AquibraStudio.tsx` for staging convenience is local
   optimization.** "If the correct product fix requires touching the editor
   flow, the right answer is to create a safe path to change it, not to reshape
   product behavior around a staging constraint."
5. **D14 should be out of this pass entirely.** "Pre-revenue is exactly when you
   cannot afford to break the few people willing to publish on your platform.
   Unless customers are actively blocked by the split prefix, leave it alone."
6. **The verification contract is defect-local, not business-end-to-end.** The
   only acceptance test that matters for the wedge: agency sends round 1 →
   client requests changes → agency edits → agency sends round 2 → client
   approves → publish gate reflects truth, with no stale links.
7. Fixing all 18 in one pass mixes thesis repair, table stakes, trust and
   hygiene, maximising cycle time and hiding whether the core got better.
8. Proposed cut — Pass 1: D1, D2, D3, D17, D4 + the end-to-end scenario as the
   release gate. Pass 2: everything else except D14. D14: its own migration
   decision doc.
9. D12 being root-cause-unknown is a planning smell.
10. The plan is organised around "close 18 defects", not around "remove the
    reasons an agency churns after one trial project".

## My correction to Codex #2 — the round model exists

Codex says there is "no explicit review-round model". That is not what the code
says. `review.service.ts:203-208` documents it precisely:

> Round count is the number of `ReviewRequest` rows for the site (a re-send
> reuses the open PENDING row; a new submit after a resolved round adds one), so
> the current round is always the latest, i.e. `roundNumber === totalRounds`.

`roundNumber` is derived at read time (`:239`), not stored, and `getCurrentRound`
already returns `invitedEmail` — so the panel has everything the fix needs.

The sharper statement is that **the token lifecycle does not honour the model
the service defines**, in two ways:

- the invited email does not follow the round across rows (D1);
- the schema's own contract at `prisma/schema.prisma:534` — *"Set when a re-send
  supersedes this link"* — is **not implemented across rounds**.
  `issueReviewToken` sets `revokedAt: null` on the row it updates, and a new
  round is a new row, so round 1's token stays live forever. Measured: round 1's
  link still opened its "You approved this" terminal after round 2 existed.

That is a third half to D1, and it is a security-adjacent one: a bookmarked link
from a superseded round never dies.

## D7 — the source of truth exists

`asset.localOnly` is a real per-asset flag, persisted to IndexedDB, and
`MediaManager.ts:226-235` already rebuilds the retry queue by scanning for it.
The pill has state available to it and simply does not read it. No new plumbing
needed — count `localOnly` assets and say the number.

## D8 — root cause found

`useMediaState(composer)` is called in **two** places:
`MediaTab.tsx:71` (the 320 rail panel) and `LibraryManager.tsx:65` (the fullpage
manager). Each instantiates `useUploadState`, and each subscribes its own
`onComplete` to the composer's upload-complete event. When both are mounted —
exactly the state `Expand Media` produces — one event raises **two** toasts.

Broader than measured: this doubles **every** upload toast, including
`"<file> uploaded ✓"`, not only the local-only warning. The fix is single
ownership of the upload-toast subscription, not a dedupe at the toast layer.

---

# OUTCOME — fix pass closed 2026-08-25

**17 of 18 fixed and verified live. D14 cut on the founder's call.**
All gates PASS: 14 DS gates + 4 chrome-axiom ratchets, Gate 24 at 0, portal
discipline, chrome-ui surface, `tsc` 0 errors in both packages, boards, hex-drift,
copy, tokens-generated. The styling ratchet **drained** 8 inline literals.

| # | Verdict | The measurement that flipped |
|---|---|---|
| D1 | fixed | re-send mints a token; that token opens the next round with no session |
| D2 | fixed | "Fixture Reviewer asked for changes. They left no notes — the round is closed and it is your move." |
| D3 | fixed | gate reads "Fixture Reviewer asked for changes on round 4." |
| D4 | fixed | ✕ while dirty raises the guard; Discard closes and drops, Keep editing keeps |
| D5 | fixed | close button is "Close settings" at root and drilled in |
| D6 | fixed | Save `disabled: true` at 0 unsaved, `false` at 1 |
| D7 | fixed | no pill on a synced library, "1 not on the server" after a local-only import |
| D8 | fixed | one warning toast per asset, was two |
| D9 | fixed | six rail rows expose `role=button` + `tabindex=0`; Enter activates |
| D10 | fixed | `New folder` has an accessible name |
| D11 | fixed | detail rail reads Generate · Insert · Edit · **Optimize** · Delete |
| D12 | fixed | back reaches the Brand root after an import Apply |
| D13 | fixed | Tailwind export carries ten sections, was one |
| D14 | **CUT** | founder call — see below |
| D15 | fixed | two strategy buttons, two outcomes |
| D16 | fixed | an unroutable token is an error that names itself |
| D17 | fixed | an instance is selectable on canvas; no toast |
| D18 | fixed | client surface reads "Request changes" |

## Three things the fix pass turned up that the walk had not

- **A superseded review link never died.** `schema.prisma:534` documents
  `revokedAt` as "set when a re-send supersedes this link"; nothing implemented
  it across rows, so round 1's token stayed live forever. The product already had
  the right screen — "There's a newer version" — and it was unreachable. Fixed
  and verified: after round 4 opens, rounds 1-3 all show it.
- **Every upload toast fired twice**, not just the local-only warning:
  `useMediaState` is instantiated in both the rail panel and the fullpage
  manager, and both subscribed to the same composer event.
- **The Brand panel's guard had a false premise.** `TokenRegistryProvider` sits
  above the whole sidebar, so navigating away from a dirty section never lost an
  edit. The guard protected nothing and wedged the panel; it is gone, with its
  modal and its tests rewritten.

## The negative test the walk arc could not run

D12 was blocking it. With the wedge gone it runs and passes: plant a black and a
violet token, and the linter names both —

> Pure black · `walk-black` — "Token "walk-black" is pure black. DESIGN.md NO
> BLACK rule…"
> Banned hue — purple, violet or indigo · `walk-violet` — "…uses a
> purple/violet/indigo hue ("#8B5CF6"). DESIGN.md bans these…"

Lint count 2 → 4. Six of the eight rules had never been observed firing.

## D14 — CUT (founder, 2026-08-25)

The exported CSS carries two prefixes: `--buildrick-design-*` for colors and
typography, `--bd-*` for the other eleven kinds. `tokenToCssVar`
(`types.ts:128`) is the canonical derivation and returns the first form, so the
eleven are the divergent ones.

**It stays.** Renaming them changes the CSS custom-property names in customers'
**published** sites, and the safety net does not reach there:
`generateCompatibilityShim` is applied only inside `buildExport`
(`exportUtils.ts:114`), whose output is a browser download. Published sites take
their token block from `siteTokensCSS` (`ExportHelpers.ts:83`), which writes each
token's stored `cssVar` verbatim with no shim anywhere near it. "Route the rename
through the shim" would have protected downloads and nothing else.

Both review voices reached this independently. It is the highest-risk,
lowest-value item in the ledger — a cosmetic inconsistency nobody has reported,
against a change that can break live customer sites.

If it is ever taken on, it is a migration program, not a defect fix: seed-data
migration, a shim in the **publish** path, and a republish of every live site.

## Surfaced, not changed: the optimizer cannot fetch a remote asset

Now that `Optimize` has a door from the manager, it is visible that it cannot
work on a stock-hosted image. CSP `connect-src` is
`'self' data: blob: https://fonts.bunny.net`, so the fetch is blocked and the
panel reads "0 Bytes". Pre-existing — the optimizer always had this, the door
just never existed. Widening a CSP is a security decision; the founder has it.
The clean answer is probably a same-origin proxy with an SSRF guard, which is
its own piece of work.

## What this pass did not do

The two CEO voices both argued this should have been two passes, and that the
plan was organised around "close 18 defects" rather than "remove the reasons an
agency churns". Two of their structural points stand unaddressed here and are
worth carrying:

- **`agency_layer` defaults to `false`** (`feature-flag.service.ts:26`), so a new
  workspace never sees the review loop unless someone walks them into Settings.
  The differentiator is fixed and still off by default.
- **There is no analytics wiring** — `grep` for posthog/mixpanel/amplitude/
  `signup_completed` across server, lib and dashboard returns nothing. The next
  defect pass will be ranked the same way this one was: by what a walk happened
  to bump into.

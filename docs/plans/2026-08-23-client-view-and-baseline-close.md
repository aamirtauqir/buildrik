# Client view as a real view, and closing the editor baseline

**Written** 2026-08-23 · branch `main` · HEAD `509a3ad1`
**Follows** `2026-08-22-money-path-walk.md` §9 (the Figma baseline pass).
**Founder call, 2026-08-23:** *"nahi dikhna chahiye client ko editing rail or baqi
sari cheez, aise hi hona chahiye jaise Figma ke product mein hota hai."*

---

## 1. What changed, and why it needed changing

`?view=client` was built as "the invited content-editor experience" — a *trimmed
editor*, not a view. `getEditorViewMode()` says so in its own comment. In practice
that meant the switch changed four header tools and nothing else: measured before
the work, 700 DOM nodes became 696, and the rail was still there. An owner opening
"what my client sees" was shown the full editor.

Two commits changed it:

- `6e485518` — the rail, drawer, inspector and canvas footer toolbar stop
  rendering; the grid collapses to `0px 0px 1fr 0px`; the empty-container
  placeholder and the "Nothing selected" status are suppressed.
- `509a3ad1` — no owner controls at all: Publish hidden, Send for review removed,
  the site menu reduced to `Exit client view`. Send for review **moved** to the
  Review panel rather than disappearing.

## 2. Measured, editor against client

| | editor | client |
|---|---|---|
| grid columns | `380px 0px 760px 300px` | `0px 0px 1440px 0px` |
| rail | 60x732 | absent |
| inspector | present | absent |
| canvas | 712px | 1392px |
| canvas footer toolbar | present | absent |
| header controls | `["Publish"]` | `[]` |
| site menu rows | 16 | 1 (`Exit client view`) |

## 3. The one thing that nearly broke

Removing Send for review would have left the **first client invite with no door**.
Its only render site was client view, and `ReviewTab`'s own empty state told users
to go there. It now lives in the Review panel, reachable by `r` independently of
the review pill (the pill only exists once a round does). Verified on a site with
no round: *"No review yet → Send this site to a client and they get a link to
comment on it → [Send for review]"*.

## 4. Still open, from the baseline pass

| Item | State |
|---|---|
| 9 frames held UNVERIFIED on the editor page | captured; judged against markers I invented, and the Brand ones predate their recipes setting Beginner/Pro |
| BL-0164 pages-add-page | the click works and appends a page — it MUTATES the fixture, and its state is near-identical to the panel at rest |
| BL-0231/0232/0234 | doors that open a new tab; editor frames are the wrong surface |
| Figma baseline | carries the 08-22/23 pass; does NOT yet carry the client-view rebuild |

## 5. Done-condition

1. Every claim in §2 re-measured against the running app after this plan's changes.
2. The nine UNVERIFIED frames either named against a real marker or re-captured.
3. Client view captured into the Figma baseline as its own frame.
4. Tests green, and any test that protected the old client view rewritten, not deleted.

---

## 6. What the autoplan review found (2026-08-23)

Two independent voices per phase — a Claude subagent and Codex — plus my own
probes. Everything below was confirmed by running it, not by accepting a finding.

### The change did not do what §2 measured

§2's table is all geometry, and geometry was the wrong quantity. With the rail,
the drawer, the inspector, inline edit, drop, the context menu and the canvas
keydown all withheld, **the document was still mutable**:

- double-click a heading → `contenteditable="true"`, and typing replaced it
- click an element, press Delete → 203 elements became 202, and autosave writes it

`KeybindingManager` binds `keydown` on **window, capture phase**. No number of
React gates sits between the window and the command. The gate is
`Composer.readOnly`, consulted by `CommandCenter.shouldHandleShortcut` against a
named `MUTATING_COMMANDS` set — the gateway CLAUDE.md already names.

### Every other write path, and how each was missed

| Path | Why the first pass missed it |
|---|---|
| ⌘K command palette | registered on `document` in StudioHeader, nowhere near the canvas |
| F2 rename / ⇧F10 menu on page tabs | `onContextMenu` was guarded and `onKeyDown` beside it was not — a mouse-only guard |
| selection box + unified toolbar (Duplicate, Delete, Copy, Wrap, Move) | click-to-select was deliberately kept, and selection *draws* the edit chrome |
| SaveStatus | renders as a `<button>` firing onSave when the state is unsaved |
| empty-page "Browse templates / Start blank" | the *container* placeholder was suppressed in CSS and the larger CTA beside it was not |
| review bar, onboarding checklist, selection dims | rendered by `AquibraStudio`, outside the shell this work could reach by prop |

### Three regressions I introduced, in one line

Moving Send for review to the Review panel dropped every prop the topbar had
been passing: `disabledReason` (a VIEWER got a live button and a silent
failure), `onSent` (the pill never refreshed; the panel said "No review yet"
under a button reading "Sent ✓"), and `reviewStatus` pinned to `null` (which
wedges the button forever, since it unlocks only when the round's `at` moves).

### "Pass undefined" was not enough, three times

`publish={undefined}` fell back to its `"ready"` default. Emptying the `action`
slot made Publish *appear*, because SendForReview had been the thing hiding it.
`save={undefined}` did not compile, since the prop was required. Each time the
component had to be told the control **does not exist** — `publish="hidden"`,
`save?:`, an explicit `null` branch.

### Declined

Dropping `clientView ||` from `density`. It is unobservable — the inspector is
density's only consumer and does not render here — but removing it breaks three
tests and buys nothing. Kept, with a comment saying why.

## 7. Two questions for the founder, not for me

1. **What is `?view=client` a preview OF?** Nothing in the codebase routes
   anyone to it; the only door is the owner's own site menu. A client receives
   `/review/<token>` — frozen snapshot, agency header, Approve / Request
   changes. This mode shows the live draft with none of that. Both voices
   reached it independently.
2. **The `Content editor` role exists and is invitable** (`invite-modal.tsx`,
   `permission.service.ts`, the client screens that say "invite the client to
   edit content"). What never existed is a shell wired to it. Client view was
   the closest thing and is now a viewer.

## 8. Both answered — founder, 2026-08-23

### Q1 → rename it. It is view mode, and it always was.

`?view=client` → `?view=readonly`; symbol `clientView` → `readOnlyView`; the
menu row "Open client view" → "Enter view mode"; CSS `bk-client-view` →
`bk-read-only-view`. The capability did not change — only the claim did. The
mode is the owner looking at their own draft with the editor out of the way,
which is what Figma calls view mode. The audiences it pretended to serve are
served by two links that already exist: `/share/<token>` (the site menu's
"Share preview link" row, right below this one) and `/review/<token>`.

The row has now been named three times — "Preview as client" → "Open client
view" (D9) → "Enter view mode". Board 642:3664 still carries the D9 copy and is
updated in this arc.

**Dropped from the plan: a site-menu row that opens the client's review link.**
I costed it as cheap and it is not. `getCurrentRound` deliberately does not
return the token (`review.service.ts:210-243`) — it is a bearer credential that
reaches the client by email. Adding the row means widening that credential's
exposure to satisfy a convenience. Not doing it silently: the owner already has
the round's state in the Review panel, and Compare for the approved snapshot.

### Q2 → the role does not need a shell. It needs to stop lying.

Verified while answering, and this is the finding of the thread:

| Claim on screen | What the server does |
|---|---|
| "Content editor — Can edit content on sites they have access to" | `EDITOR` and `DESIGNER` are the **same** `ROLE_RANK` (`permission.service.ts:4-11`) |
| team empty state: "**Cannot publish** or manage team" | `sites.publish` requires exactly `EDITOR` (`sites.ts:316`), by design — the comment there says a designer may publish |
| "…send changes for review instead of publishing directly" | `Workspace.editsRequireApproval` **defaults to `false`** (`schema.prisma:198`), so on a default workspace that editor publishes straight to the live site |

So an invited "Content editor" — including a client invited through
`client-detail-view.tsx` — can publish the site to the internet, on a screen
that told the inviter they cannot.

Fixed by making the label and the description tell the truth, and by giving
them one home. `RoleLabel` in `lib/constants/enums.ts` already declared itself
"SSOT for every role-label render site" and had **zero consumers** outside its
own test; the two render sites each kept a hand-written copy, which is how they
drifted. `RoleDescription` is new and sits beside it. Both render sites now read
from it, `EDITOR` reads "Editor", and the empty-state cards gained the Designer
row they had been missing.

This overrides redesign build-spec E1 ("the role a client gets is named Content
editor"). E1's other half stands: "Client" names the account node, never a role.
`enums.test.ts` locked the old label and locked *against* the bare word
"Editor"; it is rewritten in the same commit, and gained two locks the old copy
would have failed — that EDITOR and DESIGNER are not described as different
capabilities, and that the editor role is never described as unable to publish.

**Not done, and it is a product decision, not a copy one:** a client invited to
review a site is given publish rights. Truthful copy is not the same as a
correct permission model.

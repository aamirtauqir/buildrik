# Floating Panels — ⌘K · Versions + Compare · Issues · AI

> The four surfaces the shell doc listed as missing (§6 items 1-4). They share one frame and one z-order, so they are specified together.
>
> **Versions + Compare is the most important screen in this file.** The redesign doc calls it "the actual wedge", and the Codex review put it plainly: *"Sending for review is not the wedge. Resolving review safely is the wedge."* Compare is the middle of that loop — feedback arrives, you change things, and you must be able to see what changed against the version the client approved before you re-send.
>
> Z-order from shell §5.9: ⌘K **90** · Issues/Versions panel **70** (peer of the overlaying drawer) · AI panel takes the inspector column **—** · Compare overlay **20** (docks, does not float).

---

## 1. Shared frame — the right-side panel

Versions, Issues and Notifications use one frame. It docks on the **right, over the inspector**, because both are "about the document", not about the selection.

```
┌─ 360 ──────────────────────────┐
│ Versions                    ✕ │  48   title · close (Esc)
├────────────────────────────────┤
│ (optional filter row)          │  36
├────────────────────────────────┤
│                                │
│   body — scrolls               │
│                                │
├────────────────────────────────┤
│ (optional footer action)       │  44
└────────────────────────────────┘
```
- **360w** — wider than the inspector's 300 because these list entries with two lines of metadata.
- Pushes nothing. Overlays the inspector; the inspector is restored on close.
- Opening one closes the others. Never two right panels.
- At <1440 it overlays the canvas edge as well — same transient rule as the drawer.

---

## 2. Versions — opened from the save pill

The save pill (`● Saved 2m`) is the entry. Document state → document history.

```
┌─ 360 ──────────────────────────┐
│ Versions                    ✕ │  48
│ ⟳ Changes   ▣ Saves            │  36   two views
├────────────────────────────────┤
│ ⚑ APPROVED · v3                │  56   ← the anchor. Always pinned to the top.
│   Sara Khan · 18 Jul, 15:42    │       green rail, 3px
│   [ Compare with current ]     │
├────────────────────────────────┤
│ ● Now — 12 changes since v3    │  40
│   hero copy · 2 images · menu  │
│                                │
│ ○ Auto-save    16:20           │  48
│   3 changes                 ⋯  │
│ ○ Auto-save    16:05           │  48
│   1 change                  ⋯  │
│ ⚑ v3 · "Client draft"  15:42   │  48   named version
│   Ali · 8 changes           ⋯  │
│ ○ Auto-save    15:10           │  48
├────────────────────────────────┤
│ + Save a version               │  44
└────────────────────────────────┘
```

- **The approved version is pinned at the top with a green rail** and its own Compare button. This is the whole point: the thing you are being judged against never scrolls away.
- **"Now" row** counts changes since the approved version and names the top three areas — the same `changeSummary` the `ReviewRequest` model already stores.
- Entry row 48h: dot · label · time · change count · ⋯ (Restore · Rename · Compare · Delete). Named versions carry ⚑ and a title; auto-saves carry ○.
- **Changes view** = a flat activity feed (what changed, when, by whom). **Saves view** = the version list above. Persisted per user.
- **Time-travel** — `Ctrl+Shift+T` turns the list into a scrubber: canvas previews the hovered entry, a 44h bar over the canvas reads `Previewing v3 · ( Exit ) [ Restore this version ]`. Nothing is written until Restore.
- Cap 50 versions; beyond that auto-saves prune oldest-first and named versions never prune. Say so in a 32h footnote, or people will assume they lost work.
- **Restore** always confirms, and always creates a new version first: "Restoring v3. Your current work is saved as v4 — nothing is lost."
- **Empty:** shell §5.7 copy.

**States:** changes · saves · empty · time-travel · restoring · restore-confirm · pruned-notice.

---

## 3. Compare — the wedge's core screen

Opened from the approved row, from the review bar's `Compare`, or from any entry's ⋯. It is **not** a floating panel — it takes the canvas area, because you are reading the site, not a list.

```
◄──────────────────── canvas area ────────────────────►
┌──────────────────────────────────────────────────────┐
│ Comparing  ⚑ v3 (approved)  ⇄  ● Current    ✕ Close │  48
│ ◨ Side by side   ▣ Overlay   ☰ List        Home ▾   │  36   3 modes + page picker
├────────────────────────┬─────────────────────────────┤
│  v3 · APPROVED         │  CURRENT                    │
│  ┌──────────────────┐  │  ┌──────────────────┐       │
│  │                  │  │  │                  │       │
│  │   page render    │  │  │   page render    │       │  synced scroll
│  │                  │  │  │   ▨ changed      │       │  changed regions
│  │                  │  │  │                  │       │  tinted cobalt 8%
│  └──────────────────┘  │  └──────────────────┘       │
├────────────────────────┴─────────────────────────────┤
│ 12 changes   ‹ 3 of 12 ›     ( Restore v3 )  [ Re-send ] │ 56
└──────────────────────────────────────────────────────┘
```

**Three modes** — because "what changed" has three honest answers:

| Mode | Shows | Use |
|---|---|---|
| **Side by side** | both renders, synced scroll, changed regions tinted | "show me the difference" — the default |
| **Overlay** | current on top, approved beneath, a slider wipe | pixel-level shifts — spacing, size, position |
| **List** | a change feed: *hero heading copy · button colour · image replaced · section removed* grouped by page, each jumping to the spot | "just tell me what changed" — fastest, and the one a client would understand |

- **Change navigation** — `‹ 3 of 12 ›` steps through changes, scrolling both panes to the same anchor. Keyboard `n` / `p`.
- **Page picker** — compare is per-page; the picker shows a change count per page so you don't hunt.
- **Two exits, both honest:** `Restore v3` (throw away the changes) and `Re-send` (keep them and ask for a fresh approval). There is deliberately no "approve on the client's behalf".
- **Structural changes** (a section deleted, a page removed) render as a full-width strip in both panes rather than a tint, because a deletion has no "after" to tint.
- **No changes:** "Nothing has changed since v3 was approved. You can publish."

**States:** side-by-side · overlay · list · no-changes · single-page · loading-render · restore-confirm · resend-confirm.

**Resolved 2026-07-19** (contracts §3.3). `VersionTimelineManager` already captures a full `ProjectData` snapshot per version and the server already persists it (`SiteVersion.payload`). Side-by-side and Overlay render both panes through the canvas's own renderer with two different `ProjectData` inputs — no stored images, no second pipeline. The approved pane is instant (frozen data); the current pane can spin. **Draw all three modes.**

---

## 4. ⌘K — the command palette

One palette, registry-backed. Today two palettes exist, both hardcoded, both ignoring the 39 registered commands (defect B8).

```
                    ┌─ 640 ────────────────────────────┐
                    │ 🔍 Type a command or search…     │  56
                    ├──────────────────────────────────┤
                    │ RECENT                           │  28
                    │  ▸ Insert a section          ⏎   │  40
                    │  ▸ Go to Menu page               │  40
                    │ ACTIONS                          │  28
                    │  ▸ Publish                   ⌘⏎  │  40
                    │  ▸ Send for review               │  40
                    │ ✨ ASK AI                         │  28
                    │  ▸ "make this hero darker"       │  40
                    └──────────────────────────────────┘
```
- **640w**, centred, top at 20% of viewport height. Max body 400h then scrolls.
- Row 40h: icon 16 · label · shortcut right-aligned in `--ink-soft`. Group headers 28h.
- **Reads `CommandCenter`** — all 39 commands, including `export-html` / `export-json`, which are currently registered and unreachable from any affordance.
- **AI is a result type, not a separate surface.** Free text that matches no command offers `✨ Ask AI: "{query}"`. Selecting it runs the quick prompt inline; an agent *run* promotes to the AI panel (§5).
- Fuzzy match on label + aliases. Commands requiring a selection are shown disabled with the reason (`needs a selection`), never hidden — hiding teaches nothing.
- Esc closes; ⌘K toggles. The canvas ⌘⇧P palette is deleted.

**States:** empty (recent + suggested) · typing · results · no-results · ai-offer · disabled-command.

---

## 5. Issues panel — opened from the footer pill

```
┌─ 360 ──────────────────────────┐
│ Issues                      ✕ │  48
│ ⚠ 2   ⓘ 5   ♿ 3               │  36   severity filters with counts
├────────────────────────────────┤
│ ⚠ ERRORS                       │  28
│  Image has no alt text         │  56
│  Home › hero image        Fix ›│
│  Link points nowhere           │  56
│  Menu › "Book now"        Fix ›│
│ ⓘ WARNINGS                     │  28
│  Heading levels skip H2→H4     │  56
│ ♿ ACCESSIBILITY                │  28
│  Contrast 3.1:1 (needs 4.5)    │  56
│  Home › CTA button        Fix ›│
└────────────────────────────────┘
```
- Row 56h: message · location breadcrumb · `Fix ›`. Clicking the row selects the element on canvas and scrolls to it; `Fix ›` applies the automatic fix where one exists (alt-text via AI, contrast via `contrastFix`).
- Three severities, filterable, counts in the filter row and mirrored on the footer pill.
- **This is where the orphaned AccessibilityChecker lands** — it is real code with no surface today.
- **Empty:** shell §5.7 — "No issues. This page is ready to publish."
- Publishing with errors is allowed but the pre-publish checklist surfaces the count.

**States:** all · filtered · empty · fixing · fix-failed.

---

## 6. AI panel — the inspector column, borrowed

Chat is inline in ⌘K. A **run** promotes here, because you watch a multi-step agent while the canvas stays visible.

```
┌─ 300 ──────────────────────────┐
│ ‹ Inspector      ✨ AI      ✕ │  48   back restores the selection
├────────────────────────────────┤
│ Scope: this section        ▾   │  32   this element · this page · site
├────────────────────────────────┤
│ "make the hero darker and      │  auto
│  shorten the heading"          │
├────────────────────────────────┤
│ PLAN                           │  28
│ ✓ 1 Darken hero background     │  40   done
│ ● 2 Shorten heading copy       │  40   running · spinner
│ ○ 3 Adjust text contrast       │  40   queued
├────────────────────────────────┤
│ ⚠ Step 3 changes a design      │  auto
│   token used on 4 other pages  │
│   ( Skip )        [ Approve ]  │       privileged-action gate
├────────────────────────────────┤
│ ( Stop )      ☑ Auto-apply     │  44
└────────────────────────────────┘
```
- Step row 40h: state dot · number · description. States: queued ○ · running ● · done ✓ · skipped ⊘ · failed ✕.
- **Privileged-action gate** — any step touching shared state (a token, another page, publish) blocks and asks. This already exists in code and had no drawn surface.
- **Auto-apply off by default.** With it off, each completed step offers accept/reject with a diff of what changed.
- Stop halts after the current step; completed steps stay applied and are undoable as one transaction.
- Back arrow returns to the inspector with the original selection intact (shell §4 state 9).

**States:** idle · scoped · thinking · planning · running · step-gate · step-failed · stopped · done · error/quota · not-configured.

---

## 6. Notifications — opened from the topbar bell

The third occupant of the §1 frame. **The bell sits in the topbar, right of the save pill, left of the CTA** — 32 × 32 in the 56h band, unread shown as an 8px accent dot (top-right, no number under 10, `9+` above).

Backend already exists: `Notification` + `NotificationPref` models and a router with `list`, `unreadCount`, `markRead`. `unreadCount` has no consumer today, which says a bell was always intended.

```
┌─ 360 ──────────────────────────┐
│ Notifications               ✕ │  48
├────────────────────────────────┤
│ TODAY                          │  28
│▌✓ Sara approved Bella Cucina   │  56   unread — 2px accent bar
│▌  2h ago                    ›  │
│▌💬 Sara left 3 comments        │  56
│▌  Trattoria · 4h ago        ›  │
│ ⚠ Publish failed — Osteria     │  56
│   6h ago                    ›  │
│ YESTERDAY                      │  28
│ 👁 Sara opened the review      │  56
│   1d ago                    ›  │
└────────────────────────────────┘
```

- **Row 56h** — icon · one-line event · relative time · `›`. Unread rows carry a 2px accent left bar and a tinted background.
- **Grouped by day**, 28h headers (`Today` · `Yesterday` · then dates).
- **Opening marks all read after 2 seconds** — long enough that an accidental click does not erase the unread state you were about to read.
- **Every row is a jump, never a dead notice.** A comment opens that comment in the Review panel; a failed publish opens Publish history at that row; an approval opens Versions at the anchor.
- **Which events fire is contract 4**, not this file. This file owns the surface only.
- **Empty:** "Nothing new. You will hear when a client responds."

**States:** empty · unread · all-read · loading · jump-target-deleted (the row survives, marked *"this page was deleted"* — a notification that silently does nothing when clicked is worse than one that explains).

---

## 7. The modal kit — one frame, eight instances

Modals were the last surface drawn independently eight times. One frame, three widths, one set of rules.

```
┌─ W ─────────────────────────────────┐
│ Title                            ✕ │  56   title 16/600 · close
├─────────────────────────────────────┤
│                                     │
│   body — scrolls if it must         │  min 120, max (viewport − 200)
│                                     │
├─────────────────────────────────────┤
│              ( Cancel )  [ Confirm ]│  64   right-aligned, 12 gap
└─────────────────────────────────────┘
```

**Three widths, and nothing else.** A fourth width is a new decision every time; three cover every case:

| Width | For | Instances |
|---|---|---|
| **440** | a question | confirm · delete · conflict · recovery · new page · template apply |
| **560** | a short flow | brand push (5 steps) · collection setup · publish progress |
| **580** | a form | page settings · record editor |
| *full-bleed* | direct manipulation | image editor · replace-across — these are **not modals**, they are takeovers with their own chrome |

**Rules that apply to every instance:**

- **Scrim** `rgba(15,23,42,.32)`, click-to-close **only when nothing is unsaved**. A dirty form ignores the scrim click and pulses the frame once — losing a filled form to a stray click is the cheapest possible way to lose trust.
- **Esc closes**, with the same dirty rule. Enter confirms only when the primary is non-destructive.
- **Focus traps inside**, first focusable on open, returns to the trigger on close.
- **Radius 12** (`lg`), shadow `0 12px 32px rgba(15,23,42,.16)`, **z-index 100** — the top of the stack, above ⌘K (90) and toasts (80). Scrim `rgba(15,23,42,.4)` per `editor-shell-wireframes.md` §5.9. *(Corrected 2026-07-19: this said 80, which is the toast layer — a modal would have opened underneath its own toasts.)*
- **Vertically centred**, and **never resizes between steps** — a multi-step modal fixes its body height to its tallest step. A frame that jumps as you advance reads as a bug.
- **Destructive primaries are red and named**: `Delete 3 pages`, not `Confirm`. Typed confirmation only for brand push (contracts §5) — everywhere else a named button is enough friction.
- **One modal at a time.** A modal that opens a modal is a flow that wanted to be a drill-in.

**States (every instance):** open · dirty · submitting · error (inline above the footer, never a second modal) · success-then-close.

---

## 8. Keyboard traversal — how the six regions connect

Unwritten anywhere until now, and the thing power users judge a builder on.

| Key | Does |
|---|---|
| `Tab` | moves **within** the focused region, never between — otherwise reaching the inspector means 40 tabs through the drawer |
| `F6` / `⇧F6` | cycles **between** regions: topbar → page tabs (when shown) → rail → drawer → canvas → inspector → footer → back. *(Corrected 2026-07-19: the topbar and page tabs were omitted. With `Tab` confined inside a region, that left the notification bell, the Publish CTA, the `⋯` menu and every page tab unreachable from the keyboard.)* |
| `Esc` | steps out one level: drill-in → panel root → close panel → deselect on canvas |
| `⌘K` | palette, from anywhere |
| `A · L · P · M · D · B` | rail panels (`PART-1` §2) |
| `R` | Review panel, only while a review is live |
| `C` | comment mode |
| `n` / `p` | next / previous — open comment in Review, change in Compare, issue in Issues. **Same pair, three surfaces**, because it is the same job. |
| `⌘P` | preview · `⌘⏎` publish (when enabled) |
| `⌘Z` / `⌘⇧Z` | undo / redo, canvas-scoped |

- **Conditional regions drop out of the cycle when hidden** — page tabs on a single-page site, the drawer when closed. Cycling into an empty region is how a keyboard user concludes the app is broken.
- **The focused region shows a 2px accent outline** — with `F6` cycling and no visible focus, a keyboard user is lost immediately.
- **Focus survives a panel swap.** Switching rail panels puts focus on the new panel's first row, not back at the rail.
- Every shortcut appears in `⌘K` next to its command, so the palette teaches the keyboard.

---

## 9. Still open after this file

1. ~~Compare's diff source~~ — **closed 2026-07-19** from the code (`2026-07-19-system-contracts.md` §3.3). Snapshots already exist and are already persisted. All three modes buildable.
2. ~~Modal kit~~ — **specced**, §7 above.
3. ~~Keyboard traversal~~ — **specced**, §8 above.
4. **Content stress** — 200-entry version lists, 50-issue pages, 20-step agent plans. Not a gap in the spec; a pass the designer makes over every screen (brief §7 row 7).

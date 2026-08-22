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

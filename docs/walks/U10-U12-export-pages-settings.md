# U10 · Export · U11 · Pages · U12 · Site settings — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, real session.
U9 (version rescue) is F-A6 plus an auto-milestone banner; F-A6 is already
walked in its own record, and the banner was not exercised.

## U10 · Export — PASS

The modal reads *"Export site as HTML — One HTML file with styles inlined —
open it anywhere."* and offers, each with its own one-line description:

| format | state |
|---|---|
| HTML | *Static HTML file with embedded or linked CSS* |
| ZIP | *All files bundled in a ZIP archive* |
| React | *React component output* |
| Vue | *Vue single-file component* — **Soon** |
| Next.js | *Next.js page component* — **Soon** |

Plus Preview / Code / Options tabs and a `Desktop (1440px)` preview width. The
PRD's ⛔ for Vue/Next is accurate, and the handling is right: they are **labelled
"Soon"**, not presented as working and then failing.

## U11 · Pages — the protection leg PASSES

The home page (marked ⌂) is "Renamed Page". Right-click → **Delete** is present
and enabled, and clicking it **does not delete**. The page list is unchanged and
a toast says:

> **"Set another page as Homepage before deleting this one."**

The guard is at execution, and the message says what to do instead. **The
enabled Delete is the better choice here**, not a defect: a disabled control
with no explanation would leave the user guessing, and this one answers the
question it raises. That is §4 rule 4 satisfied in the more useful direction.

Recorded because I nearly filed the opposite. "Delete is enabled on the home
page" looked like a finding right up until the outcome was measured — the sixth
time today a partial reading pointed at a non-defect, and the sixth time
measuring the RESULT rather than the affordance settled it.

Also seen: the tab context menu is Rename / Duplicate / Set as home / Delete.

## U12 · Site settings — NOT WALKED

Opening it from the site menu left the Insert panel on screen, so the probe
never reached the settings surface. The drill-in (root ⇄ section, 180 ms lock,
dirty guard), the 10 sections across SITE / DISTRIBUTION / PLUMBING, the three
workspace deep-links, and the central dirty counter with its sticky savebar are
all **unverified**.

## Not covered in U11 either

Rename with its live slug preview (F2), duplicate ("X Copy"), the 8-second undo
toast on a normal page delete, the last-page protection (only home was tested),
localStorage-only folders, bulk multi-select, drag reorder, and the SEO table
view.

---

## Addendum, 2026-08-25 — U11 last-page / home protection, walked

Lane of `docs/plans/2026-08-25-editor-flow-walk-arc.md`. This record's "Not
covered in U11 either" list opens with **last-page protection (only home was
tested)** — the P1 entry in `docs/walks/_uncovered-backlog.md`.

Pages panel on the fixture: `Home · About · Page 3 · Page 4`, `+ Add page`,
`⊞ Listings`. Right-click a page → `Rename… · Duplicate · Copy link ·
Page settings… · Delete page`.

### Home protection — PASS, and visible

On **Home**, `Delete page` is rendered **disabled**. The guard is real and it is
shown, not hidden: the item stays in the menu greyed rather than disappearing,
which keeps the menu's shape stable between pages.

**Finding — disabled with no reason.** Nothing explains *why* it is disabled.
The user has to infer "because this is the home page". `docs/designs/
2026-07-18-editor-shell-wireframes.md` §5.8 states the rule this breaks: *"a
disabled control without a reason tooltip is a bug, not a state."* Low
severity, one tooltip.

### Last-page protection — UI guard present, engine has none

`usePages.ts` (`deletePage`):

```js
// Guard: last page
if (pages.length <= 1) {
  addToast({ description: "Can't delete — your site needs at least 1 page", tone: "warning" });
  return;
}
```

Good copy — it says what happened and why, in one line, without blaming the
user.

The engine does **not** carry the same guard. `PageManager.deletePage(id)`
("Returns false if the page didn't exist") checks existence only and will
delete the last page. **Ch.12 §12.8 item 9 recorded this on a previous pass and
is still accurate at HEAD** — re-verified rather than assumed. It is a defence
gap only for an API-driven caller; every UI path goes through `usePages`.

**Not walked live:** the true one-page case. The fixture has four pages and
deleting three to reach it is a destructive mutation of shared test data — the
kind of thing `feedback_harness_empty_became_the_baseline` was written about.
It needs a scratch one-page site, and is handed on with that note rather than
guessed at or forced.

### Still not covered in U11

Rename with its live slug preview (F2), duplicate ("X Copy"), the 8-second undo
toast on a normal page delete, localStorage-only folders, bulk multi-select,
drag reorder, and the SEO table view.

### What this walk did NOT assess

Visual and IA. Behaviour, state and data only.

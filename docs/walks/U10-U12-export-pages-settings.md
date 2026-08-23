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

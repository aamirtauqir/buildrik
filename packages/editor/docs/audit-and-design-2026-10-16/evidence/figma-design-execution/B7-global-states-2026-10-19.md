# B7 global states — 2026-10-19

DESIGN ONLY · Figma file `2L9OTGzBrL6kYmU18yA1c7`, page `07 · Recovery and access` (`3:8`). No application code, data or deployment changed.

Spec: Panel 22 §§4–7 (state ladder, banner slot, full-screen card, flows 5.1–5.13), SC-4, SC-15, SC-18, SC-20, Panel 23 §5.5.

| Frames | What they show | Script / ledger |
|---|---|---|
| G01–G02 | One boot skeleton with the site name; load failure as a banner with the canvas view-only and a local copy | `b7-global-states-1.js` |
| G03–G06 | Session expired dialog (Sign in in a new tab), banner after Keep editing, resend after same-user sign-in (G-2), different account sends nothing | same |
| G07–G10 | Kept copy checks the server first (S1/G-13): older → Restore, newer or unknown → Download/Compare only, discard confirm | same |
| G11–G13 | Offline sentence, can’t reach Buildrick, reconnecting | same |
| G14–G17 | Conflict dialog 720, Reload confirm (class b), Overwrite keeps “Before overwrite” first, nothing overwritten when that fails (G-14) | same |
| G18–G25 | Role lowered/raised, workspace deletion (owner/others), site deleted, new version (save first, never reload with unsaved work) | `b7-global-states-2.js` |
| G26–G27 | Full-screen crash card (Download a copy first when unsaved), one panel updated | same |
| G28–G30 | Same site in two tabs, Edit here, refusal when the other tab can’t save | same |
| G31–G37 | One banner plus “N more”, narrow window never blocks, phone read-only card, toast stack limits, bell grouped This site / Other sites, locked on Free (4b), trial ended (9a) | same |

Handoff board: `227:18042`.

## Second pass — History, Plans, Collaboration, recovery journey

| Frames | What they show | Script / ledger |
|---|---|---|
| H01–H16 `230:12999`… | History task (360): Session rows verb · target · place, Restore to here (class b), restore saves; Saves filter, inline Visual/Semantic compare, Restore to draft with “Before restoring” + Undo restore, delete interim confirm (until RT-D1) and Undo + Recently deleted after; Published + Republish (class b); shared Compare and Time Travel areas; Activity with “‹ Back to Activity”; offline Saves; Activity error | `b7-history-activity.js` |
| P01–P12 `231:16144`… | Plan chip as first ⋯ row (trial, warning, non-owner, payment failed); limit line and disabled New page; Upgrade dialog (owner / others); page locked over Free limit; trial reminder in bell; dashboard Billing “Choose what stays active” 640 with class-b confirm and 30-day limit | `b7-plans.js` |
| CL01–CL09 `232:18928`… | Phase A presence + People 360, Phase B live selection/name tag, typing advisory (Wait default), Follow, teammate delete and skipped undo, Get latest (MP-12), flag off Planned row, viewer redaction | `b7-collab-recovery.js` (+ `-fixes`) |
| RJ01–RJ04 | Area-aware recovery: Editor edit → CMS delete toast Undo → ⌘Z in CMS says “Nothing to undo here · Open Editor to undo” → Editor names the undo step | same |

Boards: `231:21190` (History, Activity, Plans), `232:25361` (Collaboration and recovery).

Known limits in this pass:
- The History canvas is narrowed to 740 and clips the page instead of zooming to fit.
- P08 reuses the Home canvas content under the Careers tab.
- The CMS screens in RJ02/RJ03 are a resource-shell stand-in, not the B5 CMS frames.
- Recently deleted is drawn per owner for Components (K19), Templates (T16) and History (H08); Pages uses B3.

No independent review of B7 has run yet; it runs first in the next session. Keyboard, focus, live-region announcements, playback and runtime are not verified.

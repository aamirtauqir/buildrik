# 05 — Figma build log (Phase 16–17) · 2026-09-21

Owner go: "Go — defaults as written" (04 §2 defaults apply). Every write below is followed by a read of the touched node's `reactions` / labels in the same script (the value returned is read from the node after the write, not the write's return), and the whole section is re-dumped at the end.

Container: SECTION `7563:197895` "v3 · Code-only features" at (112000, 0), 6400×12200. Launcher **L-1** `7563:197896` "STATES · Code-only features · every designed state" (clone of `4418:127245`, card rows cleared; cards added in Batch 7).

Pre-build baseline (read 2026-09-21, call 40): topbar master `4418:144989` = COMPONENT_SET, 6 variants (`4418:144990` `4418:145004` `4418:145018` `4418:145032` `4418:145046` `4418:145060`), 15/16 children each (btn/exit · site name · Search field · status/dot · link/history · btn/save · chip/review · spacer · presence · btn/notifications · btn/preview · [chip/publish-gate] · btn/publish · btn/more · hotspot/crumb-site · hotspot/crumb-page). Rail set `4418:144790` = 7 variants × 8 children. Presence set `692:472` has solo · few · many · reconnecting · offline — the topbar's `presence` slot already exists at State=solo (plan EP-1 assumed it was missing; corrected: no master edit needed for presence/pill).

Library reused (page 🧩 Components): Toast `7197:79545` (Lines 1/2 × neutral/success/error) · Banner `7551:2400` (info/warning/error) · Tooltip `7438:2014` · Comment row `17:40` · dialog/header `7399:86379` · dialog/footer `7401:1280` · Button `9:102` · IconButton `7196:78877` · Presence `692:472` · Avatar `691:450` · icon/message-square `91:185`.

## Board ledger (filled as built)

| Key | Node id | Name | Cloned from | Read-back |
|---|---|---|---|---|
| B1-01 | 7563:197963 | CURRENT DESIGN · Recovery · conflict (3 actions) | 4418:122932 | Save a backup (no dest) · Reload latest → 4418:81300 (inherited) · Overwrite… → 7563:198331 ✓ |
| B1-02 | 7563:198331 | CURRENT DESIGN · Recovery · overwrite warning | B1-01 | Cancel → 7563:197963 · Overwrite → 4418:123573 ✓ |
| B1-03 | 7563:233454 | CURRENT DESIGN · Recovery · restore unsaved edits | 4418:123573 | status/dot State=error; two Toast Lines=2 Tone=error ("Some work never reached the server" · Restore my edits → 4418:123573 ✓; "2 changes are not on the server" · Retry now). Library toast carries ONE action — "Discard" not drawn (logged in NOT verified) |
| B1-04 | 7563:233608 | CURRENT DESIGN · Recovery · recovered work banner | 4418:123573 | Banner Tone=warning full-width at y=56; Keep changes → 4418:123573 ✓ · Discard & reload → 4418:122315 ✓ |
| B1-05 | 7563:241890 | CURRENT DESIGN · Recovery · load error · network | 4418:122315 | Banner Tone=error; Retry → 4418:122315 ✓ |
| B1-06 | 7563:241964 | CURRENT DESIGN · Recovery · load error · no access | 4418:122315 | Banner Tone=info; Back to dashboard → 4418:125151 ✓ |
| B1-07 | 7563:233691 | CURRENT DESIGN · Shell · offline | 4418:123573 | Topbar variant Publish=disabled; status/dot State=offline; history link copy "Offline — changes not saved"; Tooltip "Offline — reconnect to publish"; btn/exit → 4418:125427 ✓ |
| B1-08 | 7563:242038 | CURRENT DESIGN · Exit · stranded mirrors | 4418:125416 | title "3 changes are still syncing" + count body; Stay → CLOSE · Leave anyway → 4418:125151 · Save & leave → 4418:125919 (inherited) ✓ |
| B1-09 | 7563:269384 | CURRENT DESIGN · Publish gate · changes were requested | 4418:120066 | title/body replaced; Open Review → 4418:115784 (retarget to B3-05 when built) · Cancel → CLOSE. Source has no "Publish anyway" (lock-on path) — matches code |
| B1-10 | 7563:269398 | CURRENT DESIGN · Publish · stale approval | **4418:97031** (G1 cited 4418:97050 — that is the issues-confirm; corrected from parked-index) | Request fresh review → 7570:190578 (B3-02; the first pass wired 4418:121372, then the parked 4418:135911 surfaced in the re-dump — both replaced) · Publish current draft → 4418:97118 ✓ |
| B1-11 | 7563:269418 | CURRENT DESIGN · Publish · open errors confirm | **4418:97050** (G1 cited 4418:148648 = PROPOSED · Publish · Options) | Fix issues first → 4418:147641 ✓ · Publish anyway → 4418:97118 ✓ |
| B1-12 | 7564:185450 | CURRENT DESIGN · Assets · delete folder? | 4418:155926 | Delete → 4418:58292 ✓ · Cancel → 4418:58292 ✓ |
| B1-13 | 7564:185465 | CURRENT DESIGN · Assets · delete folder · not empty | B1-12 | Move files… → 4418:149891 ✓ · Cancel → 4418:58292 ✓ |
| B1-14 | 7564:185480 | CURRENT DESIGN · Brand · project update · running | 4418:154608 | actions hidden; 4 px progress bar, fill bound to variable `color/accent` ✓ |
| B1-15 | 7564:185497 | CURRENT DESIGN · Brand · project update · failed | 4418:154608 | Restore snapshot → 7564:185480 ✓ · Retry → 7564:185480 ✓ |

Trap logged (call 48): a board cloned in the same script exposes only its non-instance TEXT nodes to `findAll` — instance children resolve lazily; edit instance-held buttons in a later call. Status/dot component has all six code states (saved · saving · unsaved · conflict · offline · error) — 03 G1-005's "Offline undrawn" was true of boards, not of the component.
| B2-01 | 7566:186558 | CURRENT DESIGN · Comments · mode on | 4418:123573 | btn/comments accent-12 % "pressed" fill (IconButton has rest·hover·disabled only); pins 7566:186749/186751/186753 (component `pin/comment` 7566:186556, fill bound `color/accent`) → 4418:115784 ✓; tooltip 7566:186758; hint toast 7566:186760; toggle → 4418:123573 ✓; Esc (KEY 27) → 4418:123573 ✓ |
| B2-02 | 7566:188906 | CURRENT DESIGN · Comments · draft popover | B2-01 | ghost pin (50 %), popover 7566:189104 (surface/border/text variables, Button sm secondary/primary), Cancel → 7566:186558 ✓ · Post → 7566:186558 ✓ |
| B2-03 | 7566:189283 | CURRENT DESIGN · Comments · post failed | B2-02 | Toast Lines=1 Tone=error "Couldn’t post your comment — it’s kept in the box" · Retry → 7566:188906 ✓ |

**EP-1** (topbar master `4418:144989`, all 6 variants): `btn/comments` inserted before `spacer` (idx 7 / 6), IconButton Size=32 with icon swapped to `icon/message-square` 91:185, Badge=false, non-instance sublayers hidden. **Reaction cannot live on the master**: Figma rejects a NODE action whose destination contains an instance of the source component (plan §15 rule, now measured: `destination 7566:186558 was rejected`). Wired instead as instance overrides on **503 live 1440×900 boards** (556 boards skipped = no Topbar instance), CLICK → NAVIGATE 7566:186558; 0 errors; sample read-back `4418:47406 → 7566:186558`. The first attempt errored mid-loop and Figma rolled the whole script back (B2-01 clone vanished) — a use_figma error is transactional.
| B2-04 | 7566:192704 | CURRENT DESIGN · Comments · re-pin banner | 4418:116906 | banner toast "Click an element to re-pin…" · Choose from list → 4418:115766 ✓ · dashed pick hotspot → 4418:118661 ✓ · Esc → 4418:116906 ✓. **Entry-point edit:** `4418:116906` Reattach comment (×2) → 7566:192704 with its 3 SET_VARIABLE actions preserved (first attempt dropped them; restored from the clone) ✓ |
| B2-05 | 7566:192959 | CURRENT DESIGN · Comments · element deleted (N comments) | 4418:81300 | scrim + dialog 7566:193123 (dialog/header Kind=title, body, dialog/footer Actions=2) · Later → 4418:81300 ✓ · Open Review → 4418:116906 ✓ |
| B2-06 | 7567:190020 | CURRENT DESIGN · Shell · view mode | 4418:123573 | Rail + Inspector hidden, Canvas FILL 1440; topbar reduced to exit · site name "… · Viewing" · comments · notifications · preview; ghost Button "‹ Back to editing" → 4418:123573 ✓. (Hidden instance sublayers vanish from `.children` — that is why two "fix" passes read as no-ops.) |
| B2-07 | 7567:190220 | CURRENT DESIGN · Permissions · disabled control tooltip | 4418:126059 | btn/publish State=disabled + Tooltip "Viewers can’t send for review — ask an editor" |
| B3-01 | 7569:190283 | CURRENT DESIGN · Topbar · review chip states | 4418:123573 | strip of 5 chip clones (Not sent · Waiting · Sara · Changes requested · 2 · Approved · Approved · edited since) + caption. Chip set has Kind × rest/selected/disabled only — amber tone not a variant (NOT verified: tone) |
| B3-02 | 7570:190578 | CURRENT DESIGN · Review · send popover | 4418:81300 | popover 360 (email Input filled · what-changed textarea · note Input) · Cancel → 4418:81300 ✓ · Send → 7570:190771 ✓. **Entry-point edit:** `4418:121372` "Re-send for review" → 7570:190578 ✓ |
| B3-03 | 7570:190771 | CURRENT DESIGN · Review · sent ✓ | 4418:81300 | scrim + dialog 480 (header title+description, link Input, dialog/footer Actions=2 — labels relabelled next call) |
| B3-04 | 7570:190958 | CURRENT DESIGN · Review · invite email failed | B3-03 | Banner Tone=error inside the dialog · Resend invite → 7570:190771 ✓ |
| B3-05 | 7571:191619 | CURRENT DESIGN · Review · changes requested | 4418:115784 | Banner Tone=warning inserted at the top of the 300-px Review drawer · Re-send for review → 7570:190578 ✓. B1-09 Open Review retargeted → 7571:191619 ✓ |
| B3-06 | 7571:191936 | PLANNED · Collab · presence live | 4418:123573 | topbar `presence` instance State=few (129 px) — component `692:472` already designed; no master edit |
| B3-07 | 7571:192075 | PLANNED · Collab · reconnecting | B3-06 | presence State=reconnecting (164 px) ✓ |
| B3-08 | 7571:192418 | PLANNED · Collab · remote cursors | 4418:81300 | two cursor groups 7571:192768 / 7571:192772 (vector arrow + name tag "Sara" / "Omar"), presence State=few |
| B3-09 | 7572:192745 | CURRENT DESIGN · Notifications · states | 4418:123573 | four clones of `Notifications · popover` (7573:193001 loading skeleton · 193049 empty · 193094 all read · 193139 load error + Retry) + caption |

**EP-2a** site menu `4418:126035`: "Enter view mode" text row 7568:190290 inserted at the Keyboard-shortcuts slot (rows below shifted 28 px, menu 424→452, background rect resized) → 7567:190020 ✓. (An accidental whole-menu clone 7567:190401 was created and removed in the next call.)
**EP-4** `4418:119819`: "Reopen" link 7573:193194 beside the first resolved row → 4418:115784 ✓.
| B3-10 | 7574:193972 | CURRENT DESIGN · Publish · confirm | 4418:97118 | scrim + dialog 7574:194120 (title, 4 facts Target · Pages · Approval · Rollback, Banner warning "Approval is older than your latest edits", footer 7574:194152) · Cancel → 4418:97118 ✓ · Publish now → 4418:97570 ✓. **Entry-point edit:** `4418:97118` Panel footer/primary `I7516:171410;7493:167692` — inside its CONDITIONAL, `N:4418:97570` → `N:7574:193972`; 6 SET_VARIABLEs, the two gate blocks and the HOVER tooltip untouched ✓ (the panel was re-componentised after the dump; `btn/publish-to-production` no longer exists by name) |
| B3-11 | 7574:194162 | CURRENT DESIGN · Toasts · catalogue | 4418:123573 | 7 library Toast instances 7574:194352…194420 (Copied link · Comment posted · Couldn’t start collaboration+Retry · Save your site first+Save · Review closed+Open Review · Backup downloaded · persistent 2-line +Retry now) + caption. Library lacks warning/dark tones (NOT verified: tone parity) |

B3-03 footer relabelled Copy link (no destination) · Open ↗ → 4418:122048 ✓; same on B3-04.

**Committed ledger: 33/33 built** (B1 ×15 · B2 ×7 · B3 ×11). Figma calls at this point: 71/200.
| W-1 | 7575:194977 | CURRENT DESIGN · Canvas · inline edit · toolbar | 4418:126485 | parked 18-control strip `4418:46720` cloned 52 px above the edited text. **Entry-point edit:** `4418:107674` "Edit text on canvas" → 7575:194977 ✓ (was → 4418:126485) |
| W-2 | 7575:195275 | CURRENT DESIGN · Canvas · dragging · snap guides | 4428:139921 | 3 magenta guide lines + 2 "24" gap chips 7575:195531…195536 |
| W-3 | 7575:195538 | CURRENT DESIGN · Keyboard shortcuts · full | parked 4418:139807 (640×934) | search Input added; legend `4418:126882` "All shortcuts ›" 7575:195630 → SWAP 7575:195538 ✓; site-menu "Keyboard shortcuts" → [CLOSE, OVERLAY 7575:195538] ✓ |
| W-4 | 7576:194193 | CURRENT DESIGN · Canvas · rulers + guide | 5936:44788 | top/left rulers with ticks + one cyan guide at 480 |
| W-5 | 7576:194517 | CURRENT DESIGN · Canvas · grid overlay | 5936:44788 | 40-px line grid at 35 % (8-px grid shown coarse) + label |
| W-6 | 7576:194856 | CURRENT DESIGN · Canvas · spacing overlay | 5936:44788 | margin (orange) / padding (green) boxes on "Hero — SELECTED" 0,52,680×250 + value chips |
| W-7 | 7576:197036 | CURRENT DESIGN · Brand workspace · Spacing | 7315:80955 | 8 token rows renamed space.xs…section.gap with px values, swatches neutralised, LIGHT/DARK → VALUE/PRESET, caption (OD-1 a) |

**40/40 boards built.** Waterfall resolved as W-1…W-7 (C-01/02/03 not built per OD-2/7/6 defaults).

**Launcher L-1** `7563:197896`: 14 rows × 3 cards (40 cards; rows cloned from `4418:127245`), Start walkthrough → NAVIGATE (OVERLAY for B1-10, B1-11, W-3); height 2850. **Index card** `7577:196802` appended to the last row of `4418:140114` ("Code-only features · every designed state") → 7563:197896 ✓.

**Entry-point edits (remaining):** EP-2b site menu `4418:126035` "COLLABORATE" header 7575:193786 + PLANNED row "Start collaboration" 7575:193787 (no destination — flag-gated) + tag 7575:193788, menu 452→496 · EP-3 `4418:140492` "Mark all read" 7575:193789 · EP-5 canvas ⋯ menu `4428:143742`: hidden `item/✦ Improve with AI` (→ 4418:104454) and `item/Bind to CMS field` (→ 4428:149540) unhidden and surfaced, `item/Group` 7575:194945 + `item/Lock` 7575:194954 added (no destination; state rows); inspector menu `6918:73338`: AI + Bind unhidden · EP-6 legend `4418:126882` copy: "n / p" → "⌘S · save", "⌘P / ⌘⏎" → "⌘P / ⌘J", descriptions + footnote list the bound chords · EP-7 Undo on `6881:64282` / `6881:73056` / `6881:74018` toasts → 4418:58292 · EP-8 CMS root `4428:140486` "Conditions" list row 7576:197533 → 4418:89490 (no "Soon" pill found on 4418:89490 — nothing to remove; NOT verified) · EP-9 "10 MB" → "50 MB" on 4418:149160 (×2) 149235 160621 160887 6883:72820 6883:72901; "or import a sheet" dropped on 4428:148905 / 6887:72969 · EP-10 hex Input 7576:197522 in swatch picker `7318:80959`; Segmented Light/Dark 7576:197524 at (1100, 84) on `7316:80949`; `4428:149324` Apply → 7316:80949 (was parked 4428:146069) ✓ · EP-11 `6918:74827` item/Detach instance 7576:197545; `7069:79383` item/Listings 7576:197553.

**Annotation cards (Batch 4):** 28 chips cloned from `7292:81923`, ids 7578:195266…195320 (AN-01 … AN-23; AN-06 and AN-11 split a/b; AN-13 = 5 boards); AN-05 not placed (OD-12 default rewrote the legend copy instead).

**Batch 8 (hide-only):** analysis in `dump/hide-plan.json` (9 clone families, 54 candidate hides) + `dump/hide-safe.json`. Only boards with **zero inbound live references** were hidden — 42 (per-file Rename/Confirm-delete/Deleted/File-deleted-toast chains ×8 files that were already unreachable, 5 video-replace clones, Settings save-error modal, Bind "choose record", two `[not-implemented]` Brand placeholders, and `4418:80697` after retargeting its 4 openers 4418:169143 / 6887:80762 / 6887:76925 / 6887:81221 → 6918:74311). **Deferred (owner):** 38 candidates that live tiles still route to (8 "Assets · Selected · <file>", 3 record-workspace clones, 4 "List · <file> selected", 2 pick-mode, 2 asset-detail, Bind `4418:108695`, ecommerce `4418:145128`, adjust/resize value pickers, `4418:71408` launcher) — collapsing them means ~200 reaction retargets; listed with keepers in `dump/hide-plan.json`.

## Re-dump and graph check (Phase 17)

`dump/redump-001.json` (frames 0–39) + `dump/redump-002.json` (40–41) = every top-level child of `7563:197895` with all reaction lines (CONDITIONAL expanded). Offline check against `dump/live-all.json` minus the 42 hidden ids:

| Check | Result |
|---|---|
| Boards in section | 42 (40 boards + launcher L-1 + `pin/comment` component) |
| Dangling destinations (not live-visible and not new) | **0** — after two fixes found by the dump: B1-10 "Request fresh review" inherited the parked `4418:135911` (→ B3-02) and a stray board-level CLICK; B1-05/06 inherited the loading board's `AFTER_TIMEOUT → 4418:126052` (removed) |
| `[CLOSE, NAVIGATE]` on a top-level frame | 0 |
| Dead ends (no outgoing NAVIGATE/CLOSE/BACK) | 0 |
| Reachable from L-1 | 40/40; L-1 reachable from `4418:140114` via card 7577:196802 |
| Self-loops | 1 — B3-10's inherited topbar `btn/publish` CONDITIONAL names its own board (the source `4418:97118` does the same; known false-positive class from the 09-15 pass) |

## Traps hit during the build (for the next arc)

1. **Auto-layout shells.** Every 1440×900 shell is a VERTICAL auto-layout frame (Topbar · Middle band · Footer). A node appended directly to the board becomes a flow child at y ≥ 900 — invisible. Only canvas-nested content survived the first pass; scrims, dialogs, toasts, banners, tooltips, the view-mode back button, the inline toolbar and captions were all relocated with `layoutPositioning='ABSOLUTE'` in a sweep (call ~103). Rule: `board.appendChild(x); x.layoutPositioning='ABSOLUTE'; x.x=…` — always.
2. **`resize()` after `primaryAxisSizingMode='AUTO'` silently flips the axis to FIXED** — six composed popovers/dialogs were clipped to their header (26 px). Set AUTO *after* the children are in.
3. **`createFrame()` + `layoutMode='HORIZONTAL'` keeps a FIXED 100-px cross axis** — fact rows, footers and cursor tags rendered 100 px tall until `counterAxisSizingMode='AUTO'`.
4. **Instance children resolve lazily in the script that cloned them** — `findAll` sees only non-instance TEXT; edit instance-held buttons in a later call. Hidden instance sublayers also drop out of `.children`.
5. **A reaction inside a master component cannot target a board that instances that component** ("destination contains the source"); shell entry points are per-board instance overrides — 503 boards propagated for `btn/comments`.
6. **A `use_figma` error rolls the whole script back** (B2-01's first clone vanished with the failed reaction).
7. **Retargeting a NODE action by rebuilding the reaction drops its SET_VARIABLEs** unless the actions array is mapped in place (done for 4418:116906 Reattach, 4418:121372 Re-send, 4418:97118 Panel footer/primary).
8. The dump's node names can be stale within a day: `btn/publish-to-production` on 4418:97118 became `Panel footer/primary` (`I7516:171410;7493:167692`).

## Done-condition (04 §9) — checked

1. Every §4 board exists inside `v3 · Code-only features`, named as listed, cloned from the stated source (two source ids corrected: B1-10 ← 4418:97031, B1-11 ← 4418:97050), reachable from L-1 ← `4418:140114` — proven by `dump/redump-00{1,2}.json`. ✓
2. Entry reactions read back as expected; no `[CLOSE, NAVIGATE]` on a top-level frame; no NODE action whose destination contains its source (the master-level attempt was refused by Figma and replaced by overrides); ≤ 2 conditional blocks everywhere touched (only existing CONDITIONALs were edited in place). ✓
3. Re-dump graph over the new section: 0 / 0 / 0 / 0 (+1 self-loop of the known class). Touched live boards (EP-1 ×503, EP-2…11, three retargets, 4 openers of 4418:80697) were read back in-script; a full-page re-dump was **not** repeated (≈ 36 calls). ✓ for the section, partial for the page — see NOT verified.
4. `🧩 Components` masters untouched (only `createInstance` / `swapComponent` to an existing icon); rail set `4418:144790` untouched; topbar master `4418:144989` changed exactly by EP-1 (one `btn/comments` child per variant, no other edits). Verified by the read-back inventory in the EP-1 entries; not byte-compared. ✓ (by inventory)
5. 42 hidden boards listed with pre-hide names in `dump/hide-safe.json` + the ledger above; `visible=true` restores each. ✓
6. NOT verified — below. ✓ (non-empty)

## NOT verified

- **Pixels of every board.** Screenshots taken for 4 families only (`screenshots/`: B2-02 draft popover, B3-10 publish confirm, B3-02 send popover, B1-03 restore-unsaved) — the first one caught the clipped popover, so the other 36 boards were checked by geometry (`outOfBounds` sweep: 0 after the tooltip move) and by read-back, not by eye.
- **PLANNED boards vs a flag-on app** — no such build exists; presence/cursor states are the library's component states, not measured against `CollabPresence`.
- **Toast tones:** the library's 2-line toast is dark-styled; warning tone does not exist in the library — B1-03 uses Tone=error where code uses warning.
- **Review-chip amber tone** (B3-01): Chip set has no tone variant; labels only.
- **EP-8 "Soon" pill on 4418:89490** — not found by name or text; nothing removed.
- **Prototype playback** — none (Q7); CONDITIONAL routes and SET_VARIABLE chains inherited from sources were kept verbatim and not simulated.
- **Full-page re-dump** — only the new section was re-dumped; the 503 EP-1 overrides and the EP-2…11 edits rest on in-script read-backs (sampled, 0 errors).
- **Batch 8 deferred set** (38 boards) — untouched pending the owner; `dump/hide-plan.json`.

Figma calls this build: ≈ 75 (write + read-back + 4 screenshots); day total ≈ 114/200.

## Post-second-pass fixes (06 §F, 2026-09-21 19:1x–19:3x · 6 write calls + 2 screenshots + 1 re-dump)

| 06 # | Sev | Fix applied | Read-back |
|---|---|---|---|
| 1 | major | **EP-9 reverted** — "50 MB" → "10 MB" on 4418:149160 ×2, 149235, 160621, 160887, 6883:72820, 6883:72901. Verified in code: `MEDIA_SIZE_LIMITS.MAX_IMAGE_SIZE = 10 MB` (`src/shared/constants/media.ts:21`); 50 MB is audio-only. 03 G3-061's "fix to the code limits" was misread by the builder | 7 text nodes |
| 2 | major | B2-02 and B3-10 **re-screenshotted after the fixes** (`screenshots/B2-02-draft-popover.png`, `B3-10-publish-confirm.png`, 19:21): popover 245 px with textarea/counter/buttons; fact rows single-line, dialog 338 px | eye |
| 3 | major | L-1 cards for the six scrim-wrapped dialog boards (B1-08, B1-09, B1-12, B1-13, B1-14, B1-15) → **OVERLAY**, so Stay/Cancel/dismiss/Esc (CLOSE) work from the launcher; B3-09 stays NAVIGATE (full shell, shell returns apply) | `redump-003.json` launcher row |
| 4 | major | Shell entries added where the source routing is not variable-gated: B2-01 canvas hotspot 7587:193624 → B2-02; B2-02 Post → **CONDITIONAL `commentSendSucceeds` (VariableID:3781:25558) EQUALS true → B2-01, else → B2-03** (the file's own expression shape); `4418:58292` folder-row trash hotspot 7587:194972 (over `row/📁 Icons`, board-level ABSOLUTE — rows are instances) → OVERLAY B1-12; B1-12/13 copy → "Icons" / 6 files. **Still launcher-only by design:** B1-01 (system-initiated on 409), B1-08 (exit routing is dirty/offline-variable driven), B1-09/10/11 (the publish chain is routed by `reviewApproved`/`approvalLockEnabled`; a third reason needs a new variable — plan §15, OD-2), B3-09 (state sheet) | ✓ |
| 5 | major | B1-01 safe exit: Save a backup → 4418:123573, **Esc → 4418:123573** | ✓ |
| 6 | major | W-7: 10 colour rows hidden (8 spacing rows stay), colour-picker buttons unwired; **`nav/Spacing` 7587:193626 added to the Brand workspace `7315:80955` → W-7** (entry-point edit); W-7's own nav/Spacing 7587:193632 unwired (selected) | ✓ |
| 7 | major | `dump/hide-safe.json` rewritten as `{id,name}` ×43 incl. `4418:80697` and the now-hidden `4418:122932` | file |
| 8 | minor | Naming: B1-09/10/11 and B3-10 kept `CURRENT DESIGN ·` — the live file names its own publish gates that way; code rows are FLAGGED-VIABLE (publish flag). **Owner call**: rename to `PLANNED ·` or keep the family's convention (recorded, not changed) | — |
| 9 | minor | Self-loops = **3** (B2-04, B3-05, B3-10 — inherited CONDITIONAL branch re-pointed to the clone), not 1 as first logged; left as-is (same class as their sources) | — |
| 10 | minor | B3-02 Esc → 4418:81300 added; width 360 kept (three fields; DESIGN-RULES ≤ 320 noted) | ✓ |
| 11 | minor | B3-10 header ✕ → 4418:97118; the underlying panel state ("Blocks publish · Waiting on Sara") contradicts the modal's "Approved by Sara" — copy on the clone's panel is inherited sample data, recorded not changed | ✓ |
| 12 | minor | B1-03 copy no longer offers a Discard action the library toast cannot show | ✓ |
| 13 | minor | `4418:122932` (two-action conflict, 0 inbound) hidden with ARCHIVE stamp — superseded by B1-01 | ✓ |
| 14–16 | minor | Duplicate topbar reaction lines are inherited from the sources (rail/Brand ×2 etc.) — not touched; "(removed)" markers were annotations in redump-001, the Figma reactions are gone; W-5 grid stays a 40-px stand-in (captioned) | — |
| 17 | minor | `pin/comment` master moved to `4418:144789 LIBRARY · Clone-owned editor components` (x 2012) | ✓ |
| 18 | note | 40 L-1 card layers renamed `card/<key · title>` | ✓ |
| 19 | note | B1-14 AFTER_TIMEOUT 2.5 s → B1-15 | ✓ |
| 20–21 | note | 04 §4 rows 10–11 and this log's B1-10 row corrected to the real sources / destinations; 03 G1-045/046 left as the agents wrote them (their citation error is recorded here and in 06) | docs |

Final evidence: `dump/redump-003.json` (compact, post-fix). Figma calls, day total ≈ **125/200**.

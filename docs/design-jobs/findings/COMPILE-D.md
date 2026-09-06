# COMPILE-D — everything in FIG-K / L / M / N / O that the two appliers cannot execute

Lanes: `FIG-K` (AI, 26) · `FIG-L` (Command palette + Notifications, 32) ·
`FIG-M` (Settings + Ecommerce, 29) · `FIG-N` (Review + Client sign-off, 43) ·
`FIG-O` (Canvas + Templates, 36). **166 rows read; 97 were `fix-board` or
`add-state`.**

## What shipped to the appliers

| File | Rows | Dry run |
|---|---|---|
| `scratchpad_audit/mod/plan-text-D.json` | **100** TEXT rewrites | `would rewrite 100 · refused 0 · missing 0 · MISMATCH 0` |
| `scratchpad_audit/mod/plan-marks-D.json` | **37** renames | `would rename 37 · already-correct 0 · missing 0 · MISMATCH 0` |

```
node scripts/figma/apply-text-fixes.mjs   packages/editor/scratchpad_audit/mod/plan-text-D.json  --apply
node scripts/figma/apply-truth-marks.mjs  packages/editor/scratchpad_audit/mod/plan-marks-D.json --apply
```

Every row carries a `"page"` field. **All of mine are `1:3` except two marks
rows — `122:3` and `1736:8405`, which are on `1:6`.** Both resolved and dry-ran
green under the default `--page=1:3`: `getNodeByIdAsync` reaches across pages in
this runtime once any page is set current. No second run is needed; the field is
there so the coordinator can split if a future applier tightens that.

Findings fully closed by those two files: **FIG-K-06, K-10 · FIG-L-02, L-05,
L-08, L-09, L-11, L-20, L-21, L-22, L-24, L-25, L-26, L-32 · FIG-M-01, M-10,
M-25 · FIG-N-04(text half), N-05, N-08, N-12, N-13, N-16, N-18, N-24, N-34,
N-38, N-43 · FIG-O-01(title), O-05(text half), O-06(two bullets), O-07(three
cells), O-11(chords)**.

**Already done before I started** — read back from the file, no row emitted:
FIG-K-01 (`170:28`), FIG-K-02 (`171:133`, `171:134`, `172:42`), FIG-K-05
(`170:16`). Their *geometry* halves are still open (§C).

---

## A. Node deletions — exact ids

The appliers rewrite and rename; they never delete. These are the rows whose fix
is "this node must go", with the id already resolved.

### A1 · Shell palette — rows for commands that do not exist (FIG-L-03, L-04)

The text plan rewrites the FIRST row of each board to the real command. What is
left over must be deleted, or the board shows a duplicate.

| Board | Delete | Why |
|---|---|---|
| `166:18` | row frame `166:24` (children `166:25` "Review panel", `166:26` "R") | after the plan, `166:21` already carries **Open Review panel / R**; `166:24` becomes its duplicate |
| `166:27` | row `166:35` ("Re-send for review") · band header instance `220:939` ("GO TO") · row `166:39` · row `166:42` ("Versions" `166:43` / "⌘⌥V" `166:44`) | the query `review` returns **exactly one** command. After the plan, `166:32` is it and the first band header already reads GO TO |
| `166:58` | nothing — all three rows were rewritten to real disabled rows (see §F1) | |

**`⌘⌥V` (FIG-L-04) survives until `166:42` is deleted.** It is the one chord in
the coordinator's list of six that I could not kill by rewrite: the query
`review` has no second Go-to row to put in its place, and inventing one would be
a new lie.

### A2 · Review round strip — the two chevrons (FIG-N-04)

The `‹ ›` pager does not exist and is deliberately not built (no endpoint returns
an older round's comments). The strip renders **one** toggle with `▾`/`▸`. Delete
both chevron TEXT nodes on each board; each pair is `roundNodeId − 1` and
`roundNodeId + 1`:

`156:45`+`156:47` · `157:45`+`157:47` · `157:97`+`157:99` · `157:148`+`157:150` ·
`157:208`+`157:210` · `157:260`+`157:262` · `158:41`+`158:43` · `158:96`+`158:98` ·
`158:144`+`158:146` · `158:201`+`158:203` · `453:3987`+`453:3989`

Do **not** touch `157:94`, `158:38`, `158:93`, `158:141`, `158:198` — those `›`
belong to other rows on the same boards. `1705:8636` already draws `▾` correctly
and needs no deletion (its text is in the plan).

### A3 · Other deletions

| Finding | Board | Delete |
|---|---|---|
| FIG-N-01 | `158:213` | the whole "absence" content: frame `158:214` (texts `158:215`, `158:216`), spacer `158:217`, toast `158:218`/`158:219` (texts `158:220`, `158:221`). See §D1 for the redraw. |
| FIG-N-06 | `184:70` | the entire modal — title, ✕, quote card, "Pick the element…" label, the three candidate rows, Cancel, Re-attach. There is no picker. See §D1. |
| FIG-N-10 | `1705:8773` | the "Invite a client…" node. `Invite a client…` and `Revoke link` are the two arms of one boolean and can never co-exist. |
| FIG-M-02 | `2209:11816` | the "Enable HSTS" toggle row (`2209:11871` and its row frame). HSTS is one Select whose first option **Disabled** IS the off state. |
| FIG-M-21 | `2209:11816` | the header Save control (`I2209:11850;9:7` and its button frame). There is no header Save. **Note: `638:2378` carries the identical `I638:2687;9:7` "Save changes" control** — FIG-M-21 named only the new board, but the same control is wrong on the older one. |
| FIG-O-27 | `642:2832` | step rows 5 and 6 (`642:3106` "Testimonials — queued", `642:3107` "Footer — queued") and the Cancel button (`I642:3110;9:31` + its frame) — see §F4. |
| FIG-O-01 | `817:4649` | the whole "Comments / C" row (`817:4713`, `817:4715`, `817:4718`, `817:4720`, `817:4721` + row frame). Comment mode is a **topbar** toggle (`StudioHeader.tsx:693`) and its bare `C` is owned by `useEditorShortcuts.ts:106`. Move it to board `200:2`. |

---

## B. Node insertions — new nodes inside existing boards

### B1 · Shell palette footer (FIG-L-10) — six boards
Add a 36px footer band to `166:2`, `166:18`, `166:27`, `166:45`, `166:51`,
`166:58`: top border, 11px `--bk-ink-soft`, **centred**, three spans
`↑↓ navigate` · `↵ run` · `Esc close` (`CommandPalette.tsx:539-546`).

> **Do not add FIG-L-10's second half.** It asks for a right-aligned
> "55 commands · distinct from canvas ⌘⇧P" marker to mirror the canvas board.
> The shell palette has **no such counter in the code** — the footer is exactly
> the three centred spans. The canvas palette's counter is real
> (`canvas/controls/CommandPalette.tsx:459`). Drawing one on the shell boards
> would invent a control.

### B2 · Other insertions

| Finding | Board | Insert |
|---|---|---|
| FIG-L-19 | `166:18` | a 28px `GO TO` band header above the row. The palette **always** bands a filtered list; an unbanded result is unrenderable. |
| FIG-L-06/07 | `166:58` | badges `⌘G` on the Group row and `⌘⇧G` on the Ungroup row (both real shortcuts), and a "nothing selected" reason on the Duplicate row. A disabled row renders label + reason + badge; the board's rows carry only one of the two. |
| FIG-L-23 | `165:2`, `165:24` | "Mark all read" as a right-aligned xs ghost button in the 48px header (`NotificationPanel.tsx`, rendered above the empty state), and a bottom footer band (border-top, px-12 py-8) with a left-aligned accent "See all notifications". **Not** on `165:44` (empty) or `165:51` (loading) — the code gates both on a non-empty ready list. The footer is load-bearing: the panel shows five, the bell counts all. |
| FIG-K-07 | `170:121` | a Diff frame between `170:123` and `170:124`: 248 wide, 3 rows × 20h, field label (`--bk-ink-muted`, 11px mono) + proposed value (`--bk-ink`, 12px). **No "from" column** — the server never sends one. |
| FIG-K-08 | 11 AI boards | a 28×28 composer button flush right, 8px below the input, inside the existing 280×72 Prompt frame. Disabled ↑ on `170:2`/`170:17`/`171:136`; enabled ↑ on `171:105`; ■ (Stop) on `170:29`/`170:41`/`170:70`; ↑ on `170:97`/`171:2`/`171:36`/`171:67`. |
| FIG-K-09 | `170:34` + the scope frames on `170:41`/`170:70`/`170:97` | a 🔒 glyph, right-aligned x=248, 16×16, `--bk-ink-muted`. Scope locks on submit and unlocks on completion, so only the four mid-run boards get it. |
| FIG-M-09 | `1688:7195` | a "Pro" badge chip on the Custom code row and the Integrations row (free-tier variant). |
| FIG-M-11 | `1688:7195` | the WORKSPACE group (Members / Billing, per W-B-06) and, below it, a separated "Tour" row. Add the Tour row to the twelve section boards that already draw WORKSPACE. |
| FIG-M-12 | `638:2378` | a caption under Favicon URL: "NOT PERSISTED TO THE SITE — stored in the project JSON only; `Site.favicon`, which the health score reads, is never written from the editor." Do not redraw the field. |
| FIG-M-13 | `638:2378` | a caption under the (now relabelled) Site name field: "Does not rename the site — the project name lives in the dashboard." |
| FIG-M-14 | `639:3443`, `1703:10515` | the not-live banner as the first element of the pane body: "Saved, but not live yet — analytics settings are written into the site when you publish." |
| FIG-M-22 | `2209:11816` | the amber not-enforced banner as the first element of the pane body, plus the PERMISSIONS-POLICY card after HSTS, plus a "Save headers" button at the foot of the last card. |
| FIG-N-37 | `1339:7186`, `1339:7193` | a "Signed as {Name} · {email}" line below the thanks paragraph — 12px, `#6B7280`, 16px top margin. Verified by walk: `1340:7174` has it (`1340:7181`); D and C do not. The branch renders it unconditionally for every non-PENDING status (`review-client.tsx:269-271`). |
| FIG-O-05 | `817:4723` | a "10%" preset row above 25%. The list ships **eight** values; the flyout draws seven and omits the one the board's own state-card series uses as its "Min zoom" example. |
| FIG-O-06 | `96:6` | *(folded)* — I appended the zoom-to-selection sentence to bullet `96:52` rather than adding a fifth text node. If a separate bullet is wanted, split it out. |
| FIG-O-07 | `96:6` | a fifth muted table row: "Watch · 196 · not offered in the picker" (`Canvas.types.ts:73`, `breakpoints.ts:119-123` — a valid `DeviceType` and `DEVICE_SIZES` entry the switcher never offers). |
| FIG-O-11 | `1176:4866` | an "Ungroup ⌘⇧G" row after Group, and Unlock drawn as an alternate-state annotation on the Lock row (they are mutually exclusive). Caption: "Rows hide rather than grey out — only Unwrap and Paste styles ever render disabled (2 of 35 leaf actions)." |
| FIG-O-25 | `1169:4725` | a third button "Delete the empty page" beside Cancel and Try again. |
| FIG-O-26 | `1169:4764` | a three-tab row above the list — Preview \| **Used in** \| Versions — and a footer row. Draw the Preview tab's empty case: user-saved templates write `thumbnail: ""`, and built-in card art is a CSS gradient, not a file. |
| FIG-O-27 | `642:2832` | a caption: "No percentage — the overlay reports steps, not progress. A 15s stall becomes 'Template apply timed out. Please retry.'" |
| FIG-O-22 | `1343:7162` | a caption: "No footer bar in read-only — which also removes ⌘0 / ⌘1 / ⌘2 / ⌘+ / ⌘−, since those chords live in the footer component." Confirm the footer bar is absent on that board; delete it if drawn. |
| FIG-O-01 | `817:4649` | an "Inspector" toggle row (no chord), description "Shows/hides the right inspector panel", ON/OFF chips cloned from the Badges row. `CanvasFooterToolbar.tsx:380-381`. |

---

## C. Geometry, fill and opacity

| Finding | Change |
|---|---|
| FIG-K-01 | `170:27` 280×44 → 280×60 and push everything below by 16. **The text is already applied**, so this frame is currently overflowing. |
| FIG-K-05 | `170:15` 280×60 → 280×76. **Text already applied** — same overflow. |
| FIG-K-03 | new error board tinted `--bk-error-tint` (`171:105` uses `--bk-warning-tint`). |
| FIG-K-22 | resize all 11 AI boards 280 → 300 wide and reflow 280-wide children to 300, 248-wide text to 268, matching `32:2`. Author flagged this as **not verified against the running app**; the live inspector width was never measured. One number, one column — worth measuring before moving 11 boards. |
| FIG-L-11 | *(alternative I did not take)* resize the six `166:*` boards 640 → 560 wide. I compiled the **name annotation** instead, because 640×420 is the size of `chrome-ui/CommandPalette.tsx` — verified to have **zero importers** (only the `chrome-ui/index.ts:143` re-export and its own test), while the shipping palette is `tw:w-140` = 560px at `shell/modals/CommandPalette.tsx:388`. Founder call; do not delete the design either way. |
| FIG-L-12 | clip `166:2`'s list at the panel edge so it reads as scrollable. The palette opens on **55 rows**; the board draws three and reads as complete. |
| FIG-N-02 | caption frame `161:11` 280×72 → 280×54. |
| FIG-N-13 | caption frame `161:8` → 280×90 (the compiled text is longer). |
| FIG-N-29 | *(alternative I did not take)* resize the seven 900-canonical echoes 1280×720 → 1280×900. I compiled the **name suffix** instead — see §F2 for why 720 is defensible. |
| FIG-N-15 | boards `168:2`, `168:26`, `168:48`, `168:82`, `169:2`, `169:28` in **section 17** are drawn at 1080×776 for a surface that cannot exceed 700px. `ApprovedCompareView` renders in exactly one place — inside `ReviewTab`, bounded by the drawer (280 collapsed / 700 expanded). Not my section; flagged to its owner. |
| FIG-O-07 | restyle `96:36` (Wide's breakpoint cell, now "none — uses Desktop styles") as muted, not as a query. |

### C1 · Strings I lengthened — check for overflow after applying

`172:22` (+117 chars) · `161:8` (+289) · `161:11` (+37) · `161:12` (+3) ·
`817:4661` (+52) · `817:4681` (+22) · `96:51` (−58, safe) · `96:52` (+90) ·
`638:2693` (+22) · `96:39` (+19) · `96:36` (+21) · `1169:4746` (+37) ·
`165:11`/`165:32` (+27) · `1719:8442` (+16). The notification rows
(`165:11`, `165:16`, `165:22` and their `165:3x` twins) sit in 280-wide 44h rows
— the real panel truncates; the boards may need a `…` or a second line.

---

## D. New boards

### D1 · Redraws of an existing board (delete-then-draw, same id)

- **FIG-N-01 · `158:213`** — after §A3, redraw as the APPROVED-round panel:
  clone `157:58` (all-resolved) at 280×812; header "Review", sent line
  "Sent 2d ago · Sara", RESOLVED band, round strip, "Compare with approved",
  primary "Re-send for review". Then rename off the interim `[unreachable]`
  marker my plan applies to `Review panel · approved`. *(FIG-N-03 asks for a
  separate "Review panel · approved" board — it is the same board. Build one.)*
- **FIG-N-06 · `184:70`** — after §A3, draw the ordinary 1440×900 canvas with
  the Review panel open on the left showing the DETACHED group, and one pill
  centred at the top of the canvas area: `--bk-accent` background, white text,
  12px/600, fully rounded, "Click an element to re-pin the comment · Esc
  cancels". Canvas cursor crosshair. Re-attach is a click-the-element mode; there
  is no Cancel button (Esc cancels) and no confirm.

### D2 · New sibling boards

| Finding | Board | Size / section |
|---|---|---|
| FIG-K-03 | `AI · error-provider` — clone `171:105`, replace the Error frame (`171:132`) with title "The AI service didn't respond.", body "Nothing was changed. This is usually the model provider, not your site — try again in a moment.", a second line for the server's own message, accent link "Try again" | 280×812 · `1776:8380` |
| FIG-K-04 | `NOT DRAWN — AI · run-stalled (provider silent, no timeout)` — clone `170:70`, band "RUNNING · 2 OF 3", add a 280×60 note under the Stop row: "The provider stopped answering. Nothing has failed and nothing will finish — Stop is the only way out." | 280×812 · `1776:8380` |
| FIG-K-16 | `AI · planning-failed` — clone `170:41` minus step rows and Actions, amber card "Daily limit reached (10). Resets at 2026-09-07T00:00:00.000Z." + Retry. Caption it as a **defect to close in code** (the agent path should route `errorKind` the way `useStreamPrompt` does), not a design to keep. | 280×812 · `1776:8380` |
| FIG-K-18 | `AI · scoped-multi` — clone `170:17`, scope band → "Scope: 3 selected", note `170:27` replaced by an assistant bubble "AI editing supports one element at a time in v1 — select a single element." Wire from the multi-select toolbar board (`159:123` region). | 280×812 · `1776:8380` |
| FIG-L-13 | `Canvas · command palette · no-results` (query `qqzz`, bare centred "No commands found" 12px ink-muted, footer "0 commands · distinct from shell ⌘K") and `Canvas · command palette · nothing-selected` (the three `requiresSelection` rows at 0.45 opacity each carrying "(Select an element first)") | 520×426 ×2 · `1779:5` |
| FIG-L-28 | `Notifications · mixed (unread first, then newest)` — two unread rows with tint + dot under TODAY, then two read rows with the spacer and no tint, and a day band appearing a **second** time below the read boundary. Caption the sort. | 280×812 · `1779:2` |
| FIG-L-29 | `Notifications · mark-all-read failed` — clone `165:2` **with §B2's button applied**; all rows still unread, error-tone toast bottom-right "Couldn't mark read" / "Try again in a moment." | 280×812 · `1779:2` |
| FIG-M-03 | `S7 · Settings · Headers · forbidden (not an admin)` — clone `1703:7914`, keep the full four-card form, every input and Save disabled, reason under the pane header "Only an admin can change security headers" (the convention `DomainsScreen.tsx:47,222-228` already ships) | 1440×900 · `1776:8387` |
| FIG-M-04 | `S7 · Settings · Localization · forbidden (not an admin)` — clone `1703:7445`, locale list read-only, Remove disabled, reason "Only an admin can change locales". Also add the `DEFAULT_LOCALE_NOT_ENABLED` copy as the error string on `1703:7445`. | 1440×900 · `1776:8387` |
| FIG-M-05 | `S7 · Settings · Redirects · read-only (viewer)` — clone `1703:8394`, table readable, Add-redirect card and every row Delete disabled, reason "Viewers can see redirects but not change them" | 1440×900 · `1776:8387` |
| FIG-M-06 | `S7 · Settings · Forms · read-only (viewer)` — row actions disabled, **Export CSV still enabled** (it is a query; VIEWER passes, `forms.ts:60`). Also set `1703:9208`'s error string to the server's own permission message and caption the cause. | 1440×900 · `1776:8387` |
| FIG-M-07 | `S7 · Settings · Domains · empty · not an admin` — clone `1702:7095`, "Add domain" disabled + "Only an admin can change the domain." beneath (`DomainsScreen.tsx:219-228`) | 1440×900 · `1776:8387` |
| FIG-M-15 | `S7 · Settings · Analytics · valid (tracking armed)` — clone `1703:10515` keeping all four provider cards, GA enabled with `G-4XQ2P7B1KD`, green "✓ Tracking will be added to your published site automatically". **The module draws failure five times and success zero.** | 1440×900 · `1776:8387` |
| FIG-M-26 | `Ecommerce · bind · popover · records` — clone `1719:8450`: back row "← Name", MenuLabel "Record", three rows from the sample products (`shared/types/ecommerce.ts:156,166,176`) each with a status chip. Plus an empty variant. Binding is **three** steps, not two. | 240×300 · `1779:6` |
| FIG-N-09 | `Review panel · never-sent` — PanelHeader "Review", centred EmptyState (check-circle 24px, "No review yet", "Send this site to a client and they get a link to comment on it."), SendForReview idle at the bottom inset 16px. **NO** progress row, sent line, round strip, composer, Compare or Re-send. This is the first thing every user sees. | 280×812 · `1776:8383`, before `157:221` |
| FIG-N-11 | `Review panel · viewer` — clone `156:2`: Resolve, Reattach, Revoke link, Re-send disabled with reasons; reply composer **enabled** (a viewer genuinely can post). Caption: today all five render live and four fail server-side. | 280×812 · `1776:8383` |
| FIG-N-14 | `Review panel · expanded` — clone `156:2` at the wider measure, with the Compare sub-view laid out. This is the state the extra width exists for. | **700**×812 · `1776:8383` |
| FIG-N-17 | `Review · round-history · loading` — clone `1705:8636`, replace the two error nodes with one muted 12px "Loading…" inside the open strip; keep the expanded "Round 3 of 3 ▾" toggle. The list is lazy-fetched, so this is routinely seen. | 280×812 · `1776:8383` |
| FIG-N-19 | `Review panel · internal authors` — clone `156:2`: a client row + two internal rows by different people. Caption the current truth: every internal row renders as **"You"** (`ReviewTab.tsx:567`); `authorId` is never resolved to a name, and a comment whose reviewer row was deleted also becomes internal and reads "You" (`schema.prisma:492`, `onDelete: SetNull`). | 280×812 · `1776:8383` |
| FIG-N-10 | `Review · foot · no client link` — "Send for review again" + "Invite a client…" + "Withdraw request". `1705:8773` becomes the with-link foot ("Re-send for review" + "Revoke link" only) after §A3. Verified: `hasClientLink ? "Revoke link" : "Withdraw request"` (`ReviewTab.tsx:910`). | 280×812 · `1776:8383` |
| FIG-N-30 | `Client sign-off · loading · 1280` — echo canonical `121:48`. Draw the header **honestly as it renders**: `Loading is asking for your feedback` (the agency name is literally the string "Loading" while the query is in flight, `review-client.tsx:148`). Put that in the board name too. | 1280×720 · `1776:8384` |
| FIG-N-31 | `Client sign-off · A0 · validation-error · 1280` (email filled with the wrong address, red 12px "That is not the address this link was sent to." under the fields, above submit) and `Client sign-off · A0 · empty · 1280`. Echo `112:21` and `112:2`. | 1280×720 ×2 · `1776:8384` |
| FIG-N-32 | Three confirm boards over a scrim, 440-wide centred dialog: `confirm · approve`, `confirm · request-changes (note written)`, `confirm · request-changes (no note)`. Exact copy from `review-client.tsx:384-388`; the no-note body is "Your designer will not be told what to change, because you have not written a note. This closes the round and you cannot reopen it." | 1280×720 ×3 · `1776:8384` |
| FIG-N-35 | `Client sign-off · confirm · approve failed` — the approve confirm plus a red 12px "We couldn't record your approval. Try again in a few minutes." Caption: **not built today** — `resolve.error` is never rendered; the dialog just stays open. Rate limit is 5 per 15 min per IP, and `ALREADY_RESOLVED` lands here too. | 1280×720 · `1776:8384` |
| FIG-N-36 | `Client sign-off · A · preview-unavailable` (420-high dashed box, "Preview unavailable for this version.") and `Client sign-off · A · multi-page` (three page tabs above the iframe, first active). Also replace `1339:7171`'s placeholder "(the site, page tabs, and Your notes)". `snapshotPages` is null on every internally-submitted round and is actively nulled by the retention prune. | 1280×720 ×2 · `1776:8384` |
| FIG-K-11 | `AI · in-canvas popover` — a 4-state row (~320×220 each) below the `171:*` row: idle (textarea + Generate), thinking ("Thinking…"), diff (DiffRows + Discard/Apply), error (raw server line — draw it as the defect it is). Add the ✦ Sparkles "Edit with AI" button to the selection-toolbar board and wire it here. **Ships on every single-element selection with no feature flag.** | `1776:8380` |
| FIG-K-12 | `AI · left-panel variant` — from `170:2`, delete the Back row (`170:3`) and replace the 44px title row with the standard left-tab panel header (title "AI" + ? + ×). One component, two chromes; the left route is reachable by ⌘K "Open AI panel" and by key `I`. | 280×812 · `1776:8380` |
| FIG-K-13 | `NOT IMPLEMENTED — Brand · generate component with AI (schema has nowhere to go)` — four states (idle / generating / success / error); title "Generate component with AI"; footer pairs Cancel+Generate / Cancel-generation / **Discard+Retry (no Accept)** / Cancel+Retry. The flag is unset everywhere, so the error state is the only reachable one. | 640×480 · `1776:8380` |
| FIG-K-14 | `AI · publish confirm` — match the Publish family's `914:4507` confirm shell: title "Publish site", body "Deploys the live site to production. This is a remote job and cannot be undone with Cmd+Z.", Cancel + Publish, plus a busy variant reading "Publishing…". | 520×300 · `1776:8380` |

### D3 · FIG-O's undrawn canvas states — **create-board, not compiled** (carried verbatim)

Fourteen distinct states across seven rows, all in section `1779:5`:

1. **FIG-O-13 (Critical)** `Canvas · element manipulated — resize · rotate`,
   1440×900, clone `199:205`. Eight resize handles (8×8 accent squares, corners
   **plus edges**), a **12px white circular rotation handle on a 1px stem 24px
   above the top edge** (`role="slider"`, `aria-valuemin=0`, `aria-valuemax=360`,
   `title="Drag to rotate (Shift for 15° snap)"`), and the live `W × H` pill
   following the pointer. **Second variant:** an element narrower than 50px with
   **only the four corner handles**. Caption: edge handles appear only above 50px
   on that axis; Shift snaps to 15°; both hidden when locked or multi-selected.
   *Rotation is fully shipped and is the single largest undrawn canvas capability.*
2. **FIG-O-14** `Canvas · invalid drop target`, 1440×900. Clone the canvas region
   of `301:1979` (S3.1 · dragging) and recolour: 2px **solid** error border on
   error tint (valid is 2px dashed accent on accent tint), red reason badge above
   the target ("Text cannot contain elements"), error-coloured insertion line,
   **no** destination label / slot preview / breadcrumb / depth badge, cursor
   `not-allowed`. Caption must list all **nine** reason strings verbatim.
3. **FIG-O-15** `Canvas · element locked · element hidden`, 1440×900, two
   variants. Locked: dotted **pink** outline, `not-allowed` cursor,
   `user-select:none`, amber lock badge above the box titled "Element is locked.
   Unlock in Layers panel.", **no resize and no rotation handles**, plus the toast
   "This element is locked. Unlock it in the Layers panel." Hidden: the element at
   25% opacity with no hover or selection affordance. Caption: hidden is a
   Layers-panel attribute, not an engine flag, and hiding is not undoable.
4. **FIG-O-16** `Canvas · empty page — first run · after Start blank`, 1440×900,
   clone `199:2`, two frames on one board. A: "Start with a template, or drop your
   first section." + [Browse templates] [Start blank]. B (after Start blank): the
   copy **changes** to "Drop an element from the Insert panel, or drag a section."
   with no buttons. `role="status"`, `aria-label="Canvas is empty"`. Suppressed
   while loading, when the project is unavailable, and entirely in read-only.
5. **FIG-O-17** `Canvas · overlay states — grid · rulers · x-ray · marquee`,
   980×260, four-panel strip in the style of `1176:4925`. Grid: 10px **square
   mesh** of 1px accent-alpha gradient lines (not a 12-column overlay). Rulers:
   canvas-2D rulers 20px thick, major ticks every 100 units and minor every 10,
   unitless numeric labels in 10px Inter, drawn **inside** the canvas content box
   at top-left, plus a corner box. X-Ray: the same element as a wireframe.
   Marquee: accent-tinted rectangle with a 1px accent border over three elements,
   two intersecting and highlighted — ignored below a 5px drag and a 5×5 result.
6. **FIG-O-18** `Canvas · section reorder · inspector pick mode`, 980×260 (or two
   more panels on the O-17 strip). A: three stacked sections, a 24×24 six-dot grab
   handle at the boundary between 1 and 2 (40px invisible hit area, opacity 0
   until hover, cursor grab/grabbing) and a drop-indicator line between 2 and 3.
   Caption: "Mouse only — no keyboard path. Never above the first section, or when
   the page has fewer than two." (`aria-hidden` container, every handle
   `tabIndex -1` despite `role="button"`.) B: canvas in pick mode, crosshair
   cursor, a hovered element highlighted; a click emits `inspector:pick-result`
   instead of selecting, and the CSS overrides the locked-element `not-allowed`
   cursor so a locked element can still be picked.
7. **FIG-O-19 (prefer the cheap option)** confirm the canvas region of `65:412`
   (Shell state 12 · Loading) already draws four skeleton blocks at
   **56 / 104 / 104 / 104** with 12px gaps and add a caption naming the heights
   (`role="status"`, `aria-live="polite"`, `aria-label="Loading your site"`; shown
   only while the page is empty **and** the project is loading). Only if it does
   not, add `Canvas · loading skeleton` at 900×480.

### D4 · FIG-D-09's Interactions boards — **not my lane, carried for the batch**

Three boards in the Inspector section, 300×812, sized like `429:2351`:

1. `Inspector · INTERACTIONS · list` — INTERACTIONS open, two interaction rows
   (trigger label + preset + enabled toggle + ▶ + ✕) and a `+ Add interaction`
   light button beneath.
2. `Inspector · INTERACTIONS · add-trigger` — the picker: **4 group headers, 14
   trigger rows**, labels exactly as `TRIGGER_GROUPS` (`interactions/types.ts:68-89`)
   — element 5 (On Hover / On Click / While Pressed / On Focus / On Blur), page 3
   (Page Load / Page Scroll / Page Leave), scroll 3 (Scroll Into View / While
   Scrolling / Scroll Out), mouse 3 (Mouse Over / Mouse Move / Mouse Out).
3. `Inspector · INTERACTIONS · edit` — one row expanded: Animation select with
   **39 presets in 6 groups** (fade 6 / slide 6 / scale 6 / rotate 6 / attention 8
   / special 7, `types.ts:93-147`), Duration, Delay, Easing.

**Two things these boards must NOT promise:** the animation never plays on the
editor canvas (`Composer.setPreviewMode` has no caller in the repo, so
`InteractionRuntime` never starts), and the row's ▶ Preview **ignores the
configured trigger** and just plays the animation once on click
(`registry/effects.tsx:105-116` reads only `interaction.animation`). All 14
triggers do work on the published page (`engine/export/interactionRuntime.ts:206`).

---

## E. Prototype edges

| Finding | Edge |
|---|---|
| FIG-K-17 | Build `AI · proposal` (per W-K-01, from `171:67`'s Diff frame `171:94`, no band, no step rows) and **repoint `170:29`'s ON_CLICK from `170:41` to it.** Keep `170:2`'s `1671:7241` → `170:41` as the agent branch. Today the chat job and the agent job share one edge, so walking from "Thinking…" drops the user into a plan they never asked for. |
| FIG-L-14 | Wire `166:45`'s "Ask AI instead ›" and `166:51`'s "Ask AI ›" hotspots to **`170:2`** (the AI panel in the *inspector* column, not the left sidebar). Remove `166:45`'s frame-level exit to `166:51` — one query does not become another. Both buttons run the same handler and **discard the typed phrase**. |
| FIG-L-27 | Create one 280×72 stub in `1779:2` named `EXIT → dashboard (outside this file) — /dashboard/sites/:id \| /dashboard/settings/team \| /dashboard/notifications` and wire the jumpable row hotspots on `165:2` plus the "See all notifications" footer (§B2) to it. Add a caption to `165:2`: a row click is a **full-page navigation out of the editor**, guarded by the unsaved-work prompt (`StudioHeader.tsx:505`). This is the honest answer to the 107/5 edge count, not a defect to wire away. |
| FIG-K-04 | Wire `170:41` and `170:70` to the new run-stalled board as a second outcome, and wire it to `171:36` (stopped) via Stop. |
| FIG-K-18 | Wire the new `AI · scoped-multi` from the multi-select toolbar board (`159:123` region). |
| FIG-M-26 | Wire `1719:8450`'s field rows to the new records board, and it back to `1719:8421`. |
| FIG-O-22 | Add a cross-reference from `817:4723` to `1343:7162` so the zoom board records where zoom disappears. |

---

## F. Premises that did not survive the read — coordinator decisions

### F1 · FIG-L-07 / L-06 — I changed the sample query on `166:58`. Please veto or keep.

`pub` matches **exactly one** command (`Open Publish panel`, chord `U`, band
GO TO) and it is not disabled, so the board's whole subject is unrenderable at
that query. FIG-L-07 itself proposes moving the demonstration to a query that
really produces disabled rows. I used **`up`**, which returns, in build order:

| row | label | reason | shortcut |
|---|---|---|---|
| 1 | Group | select two or more | ⌘G |
| 2 | Ungroup | select a group | ⌘⇧G |
| 3 | Duplicate | nothing selected | ⌘D |

…and continues (Nudge up, Nudge up (10px)), so a 3-row board reads as clipped
rather than complete. It satisfies FIG-L-06's "nothing selected" and "select two
or more" *and* adds the third real reason, and it kills the printed `⌘,` by
rewrite instead of by deletion. FIG-L-07's own suggestion (`nudge`) yields eight
rows with one identical reason and **no** shortcuts, which fits the board's node
shapes worse. Badges and the third reason still need adding (§B2).

### F2 · FIG-N-29 — its second half is **wrong**, and its first half is half-wrong

The row says three echoes have no canonical on `1:6`: `1339:7207` (revoked),
`1339:7214` (not-found), `1339:7221` (conflict). **All three have canonicals.** I
listed page `1:6` and found nineteen S5.5 frames, not sixteen — the row counted
only the `1280×900` ones and missed:

- `1736:8389` `S5.5 · dead-link · revoked` — 1280×**720**
- `1736:8397` `S5.5 · dead-link · not-found` — 1280×**720**
- `1736:8405` `S5.5 · dead-link · conflict` — 1280×**720**

So the "no canonical — authored here" rename must **not** be applied. My marks
plan names each canonical instead, and records that those three echoes match
their canonical's height exactly.

The size claim therefore applies to **seven** boards, not ten. For those I took
the row's own alternative — a name suffix rather than a resize — because
`1280×720` is the documented minimum fold: `review-client.tsx:94-102` says the
sticky footer exists precisely because "at 1280x720 the two buttons this page
exists for sat at y=733 — past the fold, on the one screen size we call the
minimum." Resizing the echoes to 900 would hide the fold the footer was built
for. **Founder call.**

The nine canonicals with no echo (`112:2`, `112:21`, `113:3`, `117:2`, `120:2`,
`121:25`, `121:48`, `125:2`, `125:49`) — that half of the row is correct, and
FIG-N-30/31/32 already ask for four of them.

One id I would not assert: `1339:7162` (`A0 · identify`) has no 1:1 canonical —
`1:6` splits A0 into `23:2` typing, `112:2` empty, `112:21` validation-error,
`113:3` returning-visitor. My rename names all four rather than picking one.

### F3 · FIG-N-34 — already normalised by the coordinator

The row quotes an inline `UNBUILDABLE` suffix on `1339:7221`. That is gone: the
board already reads `[unreachable] …`. Only the precision half survives
(`resolveReviewByToken`, and "`review-client.tsx` has no `resolve.error` branch"),
which my rename applies. **The canonical `1736:8405` on page `1:6` still carries
the old `UNBUILDABLE` wording** — my plan normalises it to match its echo.

### F4 · FIG-O-27 — its stated trigger is not met; a different defect is

The row says "if it draws a percentage or a partial bar, replace that region".
I read `642:2832`: **there is no percentage and no bar.** What it draws is a
six-row checklist named by *page section* — "Hero — done", "Menu grid — done",
"Reservations — applying…", "Gallery — queued", "Testimonials — queued",
"Footer — queued". The code ticks **four** steps named by *phase*
(`TemplatesTab.tsx:203-208`). I compiled the four rewrites onto rows 1-4,
preserving each row's existing done/active/queued styling:

```
Resolving brand tokens — done   Importing template HTML — done
Rendering on canvas — applying…  Saving applied state — queued
```

Two consequences the coordinator must settle:
- rows 5 and 6 (`642:3106`, `642:3107`) must be deleted (§A3);
- with the import already done, **Cancel must not be drawn** — "Cancel is only
  honest before the import has landed" (`TemplatesTab.tsx:212`). Either delete
  the Cancel button or shift the active row to step 2 (which also needs the row
  styles swapped, so it is a geometry job, not a text one).

### F5 · FIG-M-13 — half its target does not exist

The row asks for the same relabel on `1172:4867`'s "Site title". I walked
`1172:4867` (11 text nodes): there is **no "Site title" field on it.** It draws
`PROJECT NAME`, `AUTHOR / DESCRIPTION`, and a note reading "Canvas tab: grid size
+ snap-to-grid. SEO tab: default site title. Full settings live in S7." The field
lives on the modal's undrawn SEO tab. I compiled only the `638:2378` half
(`638:2693`). The `1172:4867` half is a **create-board** for the modal's SEO tab,
not a relabel.

### F6 · FIG-O-28 — its parenthetical is wrong, by the trap FIG-L-17 documents

FIG-O-28 says the engine registry's `ui-open-templates` "emits
`EVENTS.UI_TOGGLE_TEMPLATES`, which has zero listeners anywhere (searched by
constant)". The listener is registered **by raw string**:
`useComposerInit.ts:452 instance.on("ui:toggle:templates", toggleTemplatesHandler)`,
torn down at `:477`. `EVENTS.UI_TOGGLE_TEMPLATES = "ui:toggle:templates"`
(`events.ts:348`). Searching by the constant finds the emitter and misses the
handler — exactly the trap FIG-L-17 (my own lane) filed against MOD-F-28 and four
`EVENT-GRAPH.json` rows. **Both "Open templates" palette commands work.** The
rest of FIG-O-28 (a six-item rail with no active bar; Templates is off-rail;
`T` collides with `COMMANDS.TOOL_TEXT`) stands and is a §B/§C job on four
1440×900 boards.

### F7 · Rows where the board must lead a code change

In three places the board currently **matches the shipped string** and the
finding asks the board to state the truth instead. Per the founder precedence
rule (visible copy → the board), I compiled them — but each now needs a code fix
to follow, or the two diverge:

| Finding | Node | Shipped string that is itself wrong |
|---|---|---|
| FIG-M-10 | `1688:7354`, `1688:7370` | `SettingsTab.tsx:83,87` really do say "GA4, Plausible, PostHog, Pixel" and "301 / 302 + 404 suggester". Plausible and PostHog do not exist; the four providers are GA4, GTM, Meta Pixel, Microsoft Clarity. There is no 404 suggester anywhere. |
| FIG-N-12 | `157:271` | `ReviewTab.tsx:634` really does render "You will be notified." **Nobody is notified** — no Notification row, no email, on any review or comment event. |
| FIG-N-18 | `1753:8434`, `1705:8632`, `1705:8769` | `ReviewTab.tsx:826` really does say "Replies are internal notes on the thread." There is no thread: `postReply` calls `comments.create` with `{siteId, body, pageId}` only and `Comment` has no `parentId`. |

### F8 · Smaller reads worth recording

- **FIG-L-01** (section title, `1779:3`) is a `fix-board` whose whole edit is a
  section rename. It is not in my marks plan because renaming a **SECTION**
  changes the checklist name in `scripts/conformance/boards.json` territory and
  the row also carries an OPEN DECISION ("which owns ⌘K"). Verified true: three
  key-bound palettes — `StudioHeader.tsx:257-273` (document keydown),
  `useCanvasCommandPalette.ts:43-62` (window keydown),
  `PagesTab.tsx:125-138` (window keydown); neither ⌘K owner calls
  `stopPropagation` and they listen on different targets, so with the Pages panel
  mounted one press opens both. **Coordinator's call; I did not rename it.**
- **FIG-K-15** is an explicit either/or for the founder and I compiled neither.
  (a) add an inline error row to the SEO and alt-text entry points in Pages and
  Media, or (b) rewrite caption `172:43` to say "This state is panel-only. The
  SEO and alt-text ✨ buttons fail without a message." Both SEO title suggestion
  and alt-text ✨ Generate swallow every exception in an empty catch — the
  spinner stops, the field stays blank.
- **FIG-N-40** repeats FIG-N-29's wrong claim ("none of these three has a
  canonical on 1:6"). Its own subject — the three dead-link echoes drawing
  distinct titles per reason — is correct and needs no change.
- **FIG-N-42** confirms `1339:7193` renders "text + Signed as". It does not: the
  "Signed as" line is missing from that board (§B2, FIG-N-37).
- **`1340:7174` is missing the header sub-line** "is asking for your feedback"
  that `1339:7186` and `1339:7193` both draw. Not in any finding; one text node.
- **FIG-N-05 covers 11 nodes, not 8.** The row lists eight boards; "Compare with
  v3" also appears on `158:57` (re-sending), `158:105` (revoke-confirm) and
  `453:3974` (load-error). All eleven are in the plan.
- **FIG-N-04's board list is short by one**: `158:105` also reads "Round 2 of 3"
  (`158:145`). In the plan.
- **`166:27`'s band ORDER is unrenderable** and no finding says so. The board
  draws ACTIONS above GO TO. `grouped` is built by iterating `displayCommands` in
  build order, and all 13 Navigation rows precede every other command — so
  whenever both bands are present, **Go to renders first**. My plan relabels the
  first header to GO TO; if the coordinator instead keeps an ACTIONS band, the
  two frames must be swapped in z/position order.
- **FIG-L-12's SUGGESTED band**: I put rows 2 and 3 of the real five
  (`Open AI panel I`, `Open Templates panel T`) into the two existing SUGGESTED
  rows, with `Open Insert panel A` in RECENT per FIG-L-02. Strictly the code's
  SUGGESTED band *begins* with `Open Insert panel` — a recent is a clone
  prepended to the full list, so the real palette shows that row twice. I chose
  not to draw the duplicate on a 3-row board. If the coordinator wants strict
  fidelity, set `166:13`/`166:14` to `Open Insert panel`/`A` instead.
- **Straight vs curly apostrophes**: the code renders `You're all caught up` and
  `didn't publish` with **U+0027**; `there’s nothing to jump to` with U+2019
  (`&rsquo;`). I used U+2019 everywhere to match the file's typographic
  convention, as the findings themselves quote them. Flagging in case a future
  probe diffs board text against code strings byte-for-byte.

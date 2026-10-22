# 09-play — Play journeys (page 09) + Improved-page shell components

Sources: `dump/page-3-10.json` (236 frames, 223 active + 13 out-of-scope) and
`dump/page-497-99417.json` (18 frames, 14 active). Manifest: `scripts/conformance/boards-2l9.json`.
Code read at `c7920dd91` (`feat/design-2l9`). Paths below are relative to `packages/editor/src/editor/`
unless prefixed `dashboard:` (= `packages/dashboard/`).

## How to read this file

Play frames are **acceptance scripts, not new surfaces**. Each one is a step in a journey. The
grey "Prototype controller · outside product" bar (top 96 px of every frame) is not product UI: it
holds the step title, the instruction, the `Fixture: …` buttons that simulate server outcomes, and
`Exit`/`All journeys`.

Status per step row:
- `match`: the code surface the step exercises exists, and the step's action can be performed today.
  Copy and visual deltas on that surface belong to the surface's own board and lane. They are noted
  here, not re-scored.
- `drift`: the step cannot be performed as scripted, because the control, state or return path is
  missing. The note names what fails.

Journey status is `match` only when every step is `match`. Otherwise it is `drift @ <first failing step>`.

There is **no F6 frame**. The "Start here" index lists five journeys (F1–F5). The extra walkthroughs
on the page are `C01` (Hero child selection) and `C02` (missing alt text), and they fill the sixth
slot below.

| Journey | Steps (frames) | Status |
|---|---|---|
| F1 · Edit a page | 12 | **drift @ F1.03**, no inspector Content tab / Text content field |
| F2 · Bind content and edit a record | 17 | **drift @ F2.01**, binding is in Behaviour, with no "Choose source" picker |
| F3 · Replace an image | 14 | **drift @ F3.03**, the pick applies at once and no target is captured |
| F4 · Fix issues and publish | 31 frames (incl. F4.19.0–2, F4.26.×4) | **drift @ F4.01**, no "list has no source" issue and no blocker/tip split |
| F5 · Send a review and respond | 46 + 96 variant frames | **drift @ F5.04** (designer) / **F5.08** (client), with the approval code flow absent (F5.20+) |
| C01/C02 (slot 6) | 3 + 3 | **drift @ C01.1 / C02.1** |

Counts over all 237 active rows (`09-play.json`): **match 114 · drift 122 · blocked:first-run 1**. No
row is `missing` or `code-ahead`. Under the step rule a missing control makes its step `drift`.

---

## Journey scripts

Format: `n. Frame (nodeId) — action that advances to this step → code surface — status`.

### F1 · Edit a page — "Add text → edit → Tablet override → Undo / Redo → Preview → exact return"

Fixture: Fieldwork Studio, Home, Hero selected.

1. F1.01 Open Home (`302:3396`): open the existing Home. The controller says "Select a Hero child on the canvas or in Layers. Use Add for the text-editing walkthrough." → shell + `sidebar/tabs/layers/LayersTab.tsx:71`, inspector shows Hero ("Container content · 3 child elements", Tag Section, ID hero) — **match**
2. F1.02 Add text to Hero (`302:3965`): click rail **Add**. The panel reads "Search elements · Elements/Blocks/Components · Insert into Hero · Home / Hero · At end · Basic elements: Text, Heading, Container, Image, Button, Link · Layout: Section, Columns, Grid, Spacer" → `sidebar/tabs/build/BuildTab.tsx:274`, `shell/hooks/useBlockInsertion.ts:77` (inserts into the selected container). The target line is absent in code — **match**
3. F1.03 Text inserted (`302:4542`): click **Text**. The receipt reads "Text added to Hero · Selected on canvas · Focus stays here", and the inspector shows "Hero / Text · Text content · B I U · Changes save automatically." with Tag Paragraph and ID hero-intro → the inspector has **no Content tab** (`inspector/sections/registry/_shared.tsx:44` = Style · Behaviour · Effects) and there is no insert receipt — **drift (FAILING STEP)**
4. F1.04 Select text (`302:5185`): select **Text** in Layers. The footer reads "8 elements · Home" → LayersTab selection, footer `LayersTab.tsx:308` ("N layers") — **match**
5. F1.05 Edit content (`302:5844`): type "Good design makes room for what matters." into Text content → inline canvas editing only, with no inspector field — **drift**
6. F1.06 Style on Desktop (`302:6503`): open **Style**. Typography shows "Font-size token Custom · Font Inter · Font size 24 px · Weight Regular · **Font size · Local value · Desktop** · Line height 36 · Letter spacing 0 · Align · Color #4B5563", then Size, Spacing "2 set", Background, Border → the inspector Style tab typography section — **match**
7. F1.07 Inherited Tablet size (`302:7348`): choose **Tablet** in the breakpoint switcher. The canvas is "768 px", the header reads "Tablet · Default state", and the field note reads "**Font size · 24px · inherited from Desktop**" → `chrome-ui/BreakpointSwitcher.tsx`, `inspector/hooks/useFieldOverrides.ts:1` — **match**
8. F1.08 Tablet override (`302:8193`): set Font size to **20**. The section reads "1 override" and the field reads "**Remove Tablet override** · Font size · Falls back to Desktop: 24px" → `inspector/components/ContextRow.tsx:5` ("Tablet · N overrides") — **match** (per-field copy differs)
9. F1.09 Override removed (`302:9044`): click **Remove Tablet override**. The field goes back to 24, inherited → per-field reset in `useFieldOverrides.ts` (one undo step) — **match**
10. F1.10 Undo removal (`302:9889`): **Undo** (⌘Z / topbar). The 20 px override returns → `composer.history.undo()`. The topbar Undo control is phase1 Task 1.2 (today it sits in the canvas footer) — **match**
11. F1.11 Preview Tablet (`302:10740`): click **Preview**. The bar reads "Back to editor · Home · Draft preview · Tablet · 768px · Fonts and colors may differ slightly until published" → `shell/PreviewOverlay.tsx:171`, whose exit reads "‹ Back to canvas" (`:177`) — **match**
12. F1.12 Exact editor return (`302:10791`): click **Back to editor**. Selection Hero / Text, Tablet and the inspector are unchanged → the overlay does not touch editor state — **match**

### F2 · Bind content and edit a record — "Heading property → compatible source → record draft → save / discard / failure → same binding"

Fixture: the Blog post template page, Article › Heading, and the "Record ‹ › Show drafts" canvas bar.

1. F2.01 Heading property (`302:11636`): select the Heading on the template. The inspector reads "Blog post › Article › Heading · Content · All breakpoints · ‹ CMS · Dynamic pages · Tag H1 · **Title text** Article title · Conditions None · Advanced attributes" → the binding is set in **Behaviour › CMS binding** with selects (`inspector/sections/CmsBindingSection.tsx:239`), and there is no Content › Title text row — **drift (FAILING STEP)**
2. F2.02 Choose source (`302:12190`): click the bind control on Title text. The popover reads "Choose source · Search sources or fields… · RECORD DATA: This page's record · Blog (Each generated page shows its own record) · List item · Specific record · SITE & PAGE: Site, Page · LIVE SOURCES: Date / URL parameter / Cookie (Planned)" → none. Code has "Source [Static | From CMS] · Collection · Field" — **drift**
3. F2.03 Compatible fields (`302:12784`): choose **This page's record**. The list reads "Blog fields · ‹ Sources · Title (Text · title) · Excerpt · Rich text · formatting will be removed · Image cannot supply title text · Author › · Category · Published on (Date & time · choose a format)" → the Field select lists only fields that fit (`CmsBindingSection.tsx:250`). Code hides incompatible fields where the board explains them — **match**
4. F2.04 Title bound (`302:13375`): pick **Title**. The row reads "Title text · Blog.title ›", with "This page's record · 1 of 980" and the toast "Title bound to Blog.title · Undo" → one undo step + history toast `shell/hooks/useHistoryFeedback.ts:198` — **match**
5. F2.05 Binding details (`302:13946`): click **Title text · Blog.title ›**. The subview reads "‹ Back to Content · Title text binding · Source · Format As written · If empty · Open record › · Unbind — keep shown text · Keeps "…" as static text." → Open record / Unbind exist (`CmsBindingSection.tsx:314`), but Format and If empty are missing — **drift**
6. F2.06 Open exact record (`302:14521`): click **Open record ›**. The CMS record opens with the crumb "‹ Heading · Title binding", "Changed since publish", the form, the preview and "Editor keeps Home open — return with ‹ Back to Editor" → `UI_CMS_OPEN` (`CmsBindingSection.tsx:220`) → `cms/RecordSheet.tsx` — **match**
7. F2.07 Edit record draft (`302:14879`): edit Excerpt. The page shows "Preview (unsaved) · Unsaved changes" → RecordSheet dirty + Preview (`RecordSheet.tsx:187`, `:606`) — **match**
8. F2.08 Leave draft guard (`302:15235`): click **‹ Heading · Title binding** while dirty. The dialog reads "Leave without saving? · Your destination is Blog post › Heading › Content › Title text binding. · Keep editing · Discard changes · **Save and leave**" → `RecordSheet.tsx:722` "Discard record changes?" offers Discard and leave / Keep editing only — **drift**
9. F2.09 Save and return pending (`302:15605`): click **Save and leave**. The page shows "Saving record… · Stay here" (Fixture: save acknowledged / rejected) → there is no save-and-return. The back target is "‹ Back to canvas" (`RecordSheet.tsx:521`) — **drift**
10. F2.10 Save in record pending (`302:15961`): **Save record** in place → saving state `RecordSheet.tsx:299` — **match**
11. F2.11 Record acknowledged (`302:16317`): fixture ack. The page reads "Record saved. Return to Heading when you're ready." → toast `RecordSheet.tsx:268` ("Record saved · {collection}") — **match**
12. F2.12 Return to same binding (`302:16675`): click **‹ Heading · Title binding**. The editor reopens on the Title text binding subview → missing, because the return lands on the canvas — **drift**
13. F2.13 Content with refreshed preview (`302:17250`): **‹ Back to Content**. The canvas shows the new excerpt → the binding preview re-resolves — **match**
14. F2.14 Save rejected, draft kept (`302:17816`): fixture reject on save-and-return. The page reads "Your edits are still here. Return to Heading is paused. · Couldn't save · return paused · Cancel · Retry and return" → the failure keeps the draft (`RecordSheet.tsx:326`), but the return half is missing — **drift**
15. F2.15 Return cancelled, save pending (`302:18174`): Cancel during a retry. The page reads "Return cancelled. Your record save is still in progress." → missing — **drift**
16. F2.16 Binding summary retained (`302:18532`): back in the editor. The summary reads "Dynamic bindings · 1 binding · Title text · Blog.title › · Text bindings are edited in Content." → missing — **drift**
17. F2.17 Record save failed · stay here (`308:18475`): plain Save rejected. The page reads "Couldn't save · your draft is kept · Retry save" → `RecordSheet.tsx:326` — **match**

### F3 · Replace an image — "Captured image → choose asset → apply / cancel → Undo; locked or deleted target recovery"

1. F3.01 Selected image (`302:19069`): select Selected work › Work image. The inspector shows "Image · Replace… · Alt text" → `inspector/sections/typeBlock/SourceRow.tsx:44`, `bodies/mediaBodies.tsx:71` — **match**
2. F3.02 Asset picker (`302:19519`): click **Replace…**. The picker reads "Replace image · Work image › Source · Home › Selected work · Cancel · Search assets… · Recent · All images · Upload · Replace · Choose an image to replace this source." → the Assets drawer opens in pick mode (`SourceRow.tsx:121`) — **match**
3. F3.03 Choice before apply (`302:19891`): click an asset. The picker shows "Concrete forms.webp selected" with no mutation yet (Fixtures: target becomes locked / is deleted) → in code the pick **applies immediately** to the current selection (`SourceRow.tsx:9`). There is no staged choice and no captured target — **drift (FAILING STEP)**
4. F3.04 Replacement with Undo (`302:20263`): click **Replace**. The toast reads "Replaced Work image. Alt text kept. · Undo" → one transaction + `useHistoryFeedback.ts:198` — **match**
5. F3.05 Captured target locked (`302:20714`): fixture locked. The picker reads "Work image is now locked. Unlock it or choose a new target; your selected asset is kept. · Choose new target" → missing. The lock gate silently skips the target — **drift**
6. F3.06 Choose another target (`302:21088`): **Choose new target**. The mode reads "Choose a replacement target · Select an unlocked image. Your original Work image remains locked." → missing — **drift**
7. F3.07 Captured image deleted · asset retained (`308:26976`): fixture deleted. The picker reads "Work image was deleted. Your chosen asset is kept; it was not applied." and the inspector reads "Home · Nothing selected" → missing — **drift**
8. F3.08 Return after target deletion (`308:27350`): Cancel. Layers reads "4 layers · 0 selected" → depends on F3.07 — **drift**
9. F3.09 Choose target after original deletion (`311:22921`) → missing — **drift**
10. F3.10 Studio · Gallery image selected (`311:23145`): pick Studio › Gallery image → `SourceRow.tsx:160` — **match**
11. F3.11 Replace Gallery image · chosen asset retained (`311:23595`): the picker opens with "Concrete forms.webp selected" carried over → missing — **drift**
12. F3.12 Gallery image replaced · Undo (`311:23967`) → **match**
13. F3.13 Cancel replacement · Work image stays locked (`376:25146`): Layers reads "Work image · Locked" and the inspector reads "Content · Read-only · Locked · Work image is locked. Use its lock button in Layers to unlock it." → `inspector/components/StatusLine.tsx:46` ("Locked — unlock to edit · Unlock") — **match**
14. F3.14 Work image unlocked · Undo (`376:25424`): unlock from the Layers lock button → Layers lock toggle — **match**

### F4 · Fix issues and publish — "Exact target → fix → updated checks → review changes → explicit publish outcome"

1. F4.01 Issues · one blocker (`303:32296`): open Issues. The panel reads "Issues · 1 issue blocks publishing · 3 tips · ✕ Collection list "Latest posts" has no source · Home › Journal section · Fix › · ! 2 images have no alt text · ! No favicon · ! SEO description missing on 1 page" → `shell/IssuesPanel.tsx:217` exists, but no detector produces "list has no source" (`packages/shared/content/contentIssues.ts:123` covers missing-alt / missing-image / broken-link only) and there is no blocker/tips summary — **drift (FAILING STEP)**
2. F4.02 Exact collection list · no source (`303:32650`): click **Fix ›**. The inspector opens with "‹ Back to Issues · Home › Journal section › Latest posts · Collection list · Source Choose collection… · No source selected. This list cannot publish yet." → the row selects the element (`IssuesPanel.tsx:337`), but there is no "‹ Back to Issues" (only "Back to Inspector", `:200`) — **drift**
3. F4.03 Choose collection source (`303:33184`): the picker reads "Choose a collection · Source for … Only this list is affected. · Blog · 980 published" → `inspector/sections/CollectionListSection.tsx:65` — **match**
4. F4.04 Blog source applied (`303:33718`): the canvas fills with "6 of 980 records" → one undo step ("Bound the collection list", `useHistoryFeedback.ts:117`) — **match**
5. F4.05 Issues updated · no blockers (`303:34252`): **‹ Back to Issues**. The panel reads "No blocking issues · 3 tips · **Review and publish**" → there is no Review and publish CTA in Issues — **drift**
6. F4.06 Publish checks and approval (`303:34601`): **Review and publish** opens the tray: "Publish changes · Fieldwork Studio · whole site · ● Live · fieldwork.studio · Published 2 days ago · v12 · View live ↗ · Copy link ⧉ · WHAT WILL CHANGE See all › · CHECKS 3 tips · Red blocks publishing · amber is advisory · APPROVAL Lena approved Round 2 · edited since · Open Review › · GOES TO fieldwork.studio Manage domains › · Publish changes" → `sidebar/tabs/publish/PublishTab.tsx:1` (sections PRE-PUBLISH CHECKS / RELEASE TO / CHANGES IN THIS SESSION / LAST DEPLOY), phase1 Task 1.7 — **match**
7. F4.07 Review changes (`303:34999`): **See all ›**. The subview reads "‹ Back to Publish · What will change since v12 · per-page Compare ›" → `shell/PublishDiffView.tsx:2`, `CompareHost.tsx` — **match**
8. F4.08 Publish confirmation (`303:35374`): **Publish changes**. The dialog reads "Publish to fieldwork.studio · 1 Changes · 2 Tips ☐ I've seen these · 4 Approval ☐ Publish without a fresh review · 5 Release · Saved 10:42 · the current live release stays available to republish · Cancel" → `shell/modals/PublishConfirmModal.tsx:85` "Publish to production?" has no numbered acknowledgement checklist — **drift**
9. F4.09 Tips acknowledged (`303:35797`): tick ☑ I've seen these → missing — **drift**
10. F4.10 Admin override acknowledged (`303:36220`): tick ☑ Publish without a fresh review → code uses `StaleApprovalModal.tsx` "Publish anyway" — **drift**
11. F4.11 Publish job in progress (`303:36642`): the tray reads "Publishing 2/3… · ✓ Generating pages · ● Deploying to CDN · step 2 of 3 · ○ Verifying SSL · Elapsed 0:42 · Publishing can't be stopped once deploying." → `shell/hooks/usePublishJob.ts:286` — **match**
12. F4.12 Publish acknowledged · v13 (`303:37001`): the tray reads "Published just now · v13 · Your changes are live… · Copy link · See what changed" → PublishTab outcome + `useExportHandlers.ts:115` — **match**
13. F4.13 Publish failed · v12 retained (`303:37365`): the tray reads "Publish failed — Vercel couldn't finish the deployment (timeout). The live site still shows v12. · Try again · View log" → `PublishTab.tsx:538` — **match**
14. F4.14 Connection lost · same publish job (`303:37723`): the tray reads "Publish · checking · We lost track of this publish… · Check status" → `PublishTab.tsx:555` — **match**
15. F4.15 Resume the same publish job (`303:38079`) → same jobId (`usePublishJob.ts`) — **match**
16. F4.16 Queued job · cancel available (`303:38438`): the tray reads "Publishing 0/3… · ● Queued — waiting to start · Cancel (not started)" → `usePublishJob.ts:262,292` — **match**
17. F4.17 Cancelling queued publish (`303:38956`): the tray reads "Cancelling queued publish… · If deployment has already started, it cannot be cancelled." → `PublishTab.tsx:338` — **match**
18. F4.18 Queued publish cancelled · live v12 kept (`303:39317`) → the cancelled outcome block — **match**
19. F4.19.0/.1/.2 Keep editing · publish job retained (`303:39740`, `303:40202`, `303:40664`): close the tray, and the topbar shows "Publishing…" / "Publish · checking" → one state machine shared by the topbar and the panel (`PublishTab.tsx:18`) — **match**
20. F4.20 Change source · Blog origin retained (`308:18838`) → `CollectionListSection.tsx:65` — **match**
21. F4.21 Issues after v13 publish (`308:24633`) → the Issues re-scan (`shell/hooks/useContentIssueScanner.ts`) — **match**
22. F4.22 Publish after v13 · no new changes (`308:25079`): the tray reads "No unpublished changes · All saved changes included in v13 · Up to date" → `PublishTab.tsx:899` changes-in-session (different copy) — **match**
23. F4.23 Changes included in v13 (`308:25573`) → PublishDiffView — **match**
24. F4.24 Editor after v13 publish (`308:26044`) / F4.25 Editor · queued publish retained (`308:26515`) → **match**
25. F4.26.deploying / .resumed / .unknown / .queued (`311:21107`, `311:21559`, `311:22011`, `311:22463`): Issues open while a publish is retained → **match**

### F5 · Send a review and respond — "Send round → client comment → locate / edit / resolve → approval → stale snapshot"

Designer side: `sidebar/tabs/review/ReviewTab.tsx`, `shell/SendForReview.tsx`. Client side:
`dashboard:app/review/[token]/review-client.tsx` (a server route; see the editor CLAUDE.md note on client sign-off).

1. F5.01 Designer · send next review round (`307:14695`): the Review panel reads "Atelier Nord · Round 2 · Changes requested · ready for next round · Frozen snapshot · Logo 24px… · 0 open · 1 resolved · **Send Round 3 to Lena**" → `ReviewTab.tsx:447` ("Send for review again") — **match**
2. F5.02 Send Round 3 (`307:15315`): the dialog reads "Send Round 3 for review · … This replaces the previous review link. · Client email · What changed? · Note to Lena · Cancel · Send for review" → `SendForReview.tsx:223,234` — **match**
3. F5.03 Preparing frozen preview (`307:15711`): "Preparing the review preview… Nothing has been sent yet." → the sending state (`SendForReview.tsx:60`) — **match**
4. F5.04 Preview failed · nothing sent (`307:16107`): "We couldn't render a preview · … Nothing was sent. · Cancel · Try again · Send without preview" → code **auto-sends without a preview** (`SendForReview.tsx:110`) and offers no choice — **drift (FAILING STEP, designer)**
5. F5.05 Sending review (`307:16503`) → **match**. 6. F5.06 Round 3 sent (`307:16899`): "Round 3 sent · … Approval is still pending. · Done" → `shell/modals/ReviewSentModal.tsx` — **match**
7. F5.07 Client · frozen Round 3 (`307:17295`): the client page reads "Fieldwork Studio is asking for your feedback · Atelier Nord · Home ▾ · Round 3 · Desktop Tablet Mobile · ＋ Add comment C · Comments (0) · Request changes · Approve Round 3" → `review-client.tsx:497`, which has no device switch — **match**
8. F5.08 Client comment draft (`307:17363`): press **C** / Add comment and place a pin on the Logo: "Make the logo larger · Cancel · Send ⌘↵ · Keyboard: arrows move 8 px, Shift 40 px, Enter places, Esc cancels" → code has only page-level notes ("Add note", `review-client.tsx:366`). There is no pin or anchored composer — **drift (FAILING STEP, client)**
9. F5.09 Sending client comment (`307:17442`) → `:367` — **match**. 10. F5.10 Comment failed · draft retained (`307:17507`) → `:369` — **match**. 11. F5.11 Client comment acknowledged (`307:17572`) → `:349` — **match**
12. F5.12 Designer · comment on Logo (`307:17630`) → ReviewTab — **match**
13. F5.13 Logo located · 24px (`307:18245`): **Locate ›**. The page reads "① "Make the logo larger" · Logo on Home · ‹ Back to Review · Style · Desktop · Default · Font size (px) 24" → `ReviewTab.tsx:114,1014` — **match**
14. F5.14 Logo enlarged · 28px (`307:19091`) → the inspector Typography field — **match**
15. F5.15 Return to the same comment (`307:19623`) → `ReviewTab.tsx:205` — **match**
16. F5.16 Resolving comment (`307:20015`) → `ReviewTab.tsx:662` — **match**. 17. F5.17 Resolve failed (`307:20407`) → `:184` — **match**. 18. F5.18 Resolved · approval unchanged, "Undo resolve" (`307:20799`) → "Reopen" `:662` — **match**
19. F5.19 Client · resolved note on frozen snapshot (`307:21191`) → `review-client.tsx:349` — **match**
20. F5.20 Approval code entry (`307:21249`): **Approve Round 3** → "Approve Round 3? · … Enter the 6-digit code sent to l•••@atelier.example. · Cancel · Send a new code" → **no code step**. Approval is a confirm dialog (`review-client.tsx:516`) — **drift**
21. F5.21 code entered / 22. F5.22 approval pending "Check status" (`307:21337`, `307:21422`) — **drift**
23. F5.23 Approval receipt / 24. F5.24 Round 3 approved (`307:21499`, `307:21571`) → the approved state (`review-client.tsx:438,448`) — **match**
25–30. F5.25 Incorrect code, F5.26 Expired code, F5.27 Sending new code, F5.28 New code sent, F5.29 Code email failed, F5.30 Code rate limited (`307:21634`…`307:22030`) — **drift** (the code flow is absent)
31. F5.31 Already answered (`307:22109`) → "You've already answered this" (`review-client.tsx:38`) — **match**
32. F5.32 Approval failed · code kept (`307:22185`), 33. F5.33 Approval offline (`307:22265`) — **drift**
34. F5.34 Approved · edited since sent snapshot (`307:22345`) → `shell/StudioHeader.tsx:188` "Approved · edited since" — **match**
35–37. F5.35 Request fresh Round 4, F5.36 Sending, F5.37 Round 4 sent (`307:22737`, `307:23133`, `307:23529`) → SendForReview / ReviewTab status line `:141` — **match**
38–41. F5.38 sent · awaiting, F5.39 resolve without editing, F5.40 resolved without change, F5.41 undo resolve pending (`310:21940`…`310:22798`) → ReviewTab — **match**
42. F5.42 Sending without a preview (`310:23087`) → `SendForReview.tsx:110` — **match**
43. F5.43 Client · preview unavailable (`310:23367`) → "Preview unavailable for this version." (`dashboard:components/reviews/signoff-snapshot.tsx:111`) — **match**
44–46. F5.44 General note · no preview, F5.45 sending, F5.46 acknowledged (`310:23418`, `310:23486`, `310:23531`) → page notes `review-client.tsx:366` — **match**

Variants (96 frames). Each one replays the approval steps .20–.34 under a different prior state, so
each inherits the status of the same-numbered F5 step (`inheritsFrom` in the JSON):
`F5-EARLY` (no comment yet), `F5-OPEN` (open comment, no edit), `F5-NOPREVIEW`, `F5-NOTE` (general
note), `F5-SECOND-OPEN` / `F5-SECOND-RESOLVED` (.20–.33 "Approval with two comments"). The
`F5-SECOND-*.1–.4` second-comment frames map to F5.08–F5.11. Step .1 (pinned second-comment draft)
is drift; .2–.4 match.

### Slot 6 · C01 Hero child selection / C02 Missing alt text

C01 controller: "Selection walkthrough · select a Hero child or return to Hero. Content fields are static in this branch. · Back to Hero".
1. C01.1 Select Eyebrow (`350:25304`): the inspector reads "Home / Hero / Eyebrow · Text content · Text · B I U · Semantics Tag Paragraph · ID Optional ID for in-page links." → selection works, but there is no Content tab (`_shared.tsx:44`) — **drift (FAILING STEP)**
2. C01.2 Select Headline (`350:25767`): "Heading 1" → Level exists (`typeBlock/bodies/textBodies.tsx:57`), but the text field is missing — **drift**
3. C01.3 Select Explore our work (`350:26230`): "Button label · Link target · Link" → the label field is missing, and the link sits in Behaviour › Link — **drift**

C02 controller: "Navigation walkthrough · locate either image and return to Issues. Alt-text entry and saving are not simulated."
1. C02.1 Images missing alt text (`353:24569`): the panel reads "Images missing alt text · 2 images · choose one to inspect · Home › Hero › Hero image · Missing alt text · image content · Open image › · About › Team › Team image · ‹ Back to Issues" → there is no grouped subview; Issues rows are per element (`IssuesPanel.tsx:337`) — **drift (FAILING STEP)**
2. C02.2 Home › Hero › Hero image (`353:24957`): the inspector reads "‹ Back to affected images · Image · Replace… · Alt text · Missing alt text for this image." → `mediaBodies.tsx:71-72` ("Add alt text so everyone can understand this image."), but the back-link is missing — **match**
3. C02.3 About › Team › Team image (`353:25243`): selection crosses pages → **match**

### Out of scope on page 09 (manifest `out-of-scope`, not in JSON)

R01–R06 viewport rows (`11:2`, `11:311`, `11:870`, `11:1297`, `11:1866`, `11:2299`), T01–T04 Review
dock/overlay/sheet rows (`15:2450`, `15:3054`, `15:8208`, `15:8645`), B2 geometry (`17:2170`), BD25
Compact Pages (`78:19785`, `78:20392`). Note for Task 1.2: the plan's narrow-width rule (min 1024)
already covers R01's 1024×768 case. R01's "two-row toolbar" is not the plan's answer.

---

## Improved page (`497:99417`): Phase-1 shell specs, exact copy and structure

All of these are **phase1**. Board sample data ("Fieldwork Studio", "In review · 2", "5 pages") is the
shape, not literal copy.

### Shell/Topbar (`497:99433`), 1440×56

Children left→right (x, w; all h 32 at y 12):
`Exit` (13, 48, Ghost) · `Site identity / not navigation` "Fieldwork Studio" (69, 176, plain text, **not a crumb or button**) ·
`Site settings / visible labeled entry` "Site settings" + Icon/settings (253, 140, Secondary) ·
`History / one undo for the whole editor` (401, 68: Undo + Redo icon pair, no text) · flexible space ·
`In review · 2` "In review · 2 open" (977, 110) · `message-square` (1095, 32) · `users` (1135, 32) · `bell` (1175, 32) ·
`Preview` (1215, 82, Secondary) · `Publish` (1305, 82, Primary) · `ellipsis` ⋯ (1395, 32).
On the Publish-tray board (`499:2656`) the topbar **drops Publish** (texts end at "Preview").
Code: `chrome-ui/Topbar.tsx` renders exit · site›page crumb (`:225`) · SaveStatus (`:274`) · review · comments · spacer · presence · bell · Preview · Publish · menu. There is no labeled Site settings or History group, and the save status belongs in the bottom bar. **drift**, Task 1.2.

### Shell/Rail (`497:99445`), 56×812

Items 48×52 at x 5: **Add · Layers · Pages** · 16 px group gap · **Assets · CMS · Brand** · flexible space · **Help** (bottom, y 759).
States: Default / Active. Code: `rail/tabsConfig.ts:62` defines Add, Templates, Assets, Layers, Pages,
Components, Brand, Settings, Publish, History, Activity, Review and CMS. Which are visible is
flag-dependent and was not measured. **drift**. The Rail is not in the Phase-1 task list, so it is flagged for the lead.

### Shell/BottomBar (`497:99485`), 1440×112 (two `Context` variants, each 32 tall)

- `Context=Editor` (y 16): Icon/file **"Home"** · **"/"** (slug, muted) · Icon/chevron-down (page switcher) · count **"5 pages · ⌘P to switch"** · right: SaveStatus `State=Saved` **"Saved just now"** · Ghost **"Details"**.
- `Context=Resource area` (y 64): **"Editor keeps Home open — return with ‹ Back to Editor"** · "Saved just now" · "Details".
- Variants on other boards: `5 pages · 1 template · ⌘P to switch` (PLAY frames), `100 pages · ⌘P to switch` (`498:634`), and load-failed **"Not loaded · nothing saved yet"** (`500:342702`).
- Shortcut conflict: the board says **⌘P**, but ⌘P is Preview in code. Plan Task 1.3 picks **⇧⌘O / Ctrl+Alt+O** → manifest `authority: code:⌘P-is-preview`.
Code: `shell/PageTabBar.tsx:85` (tablist "Site pages", per-page tabs, "+" Add page `:125`, home and unsaved aria `:104`). Save status sits in the topbar. **drift**, Task 1.3.

### Shell/PageSwitcherMenu (`558:4419`), 260×306

Header (246×26): **"Pages · 5 + 1 template"**. Rows 246×32, each Icon/file + name + slug: Home "/" · About "/about" · Work "/work" · Contact "/contact" · Legal "/legal". Then a divider, a group label **"Templates"** (20 tall), and the row **"Blog post" "/blog/…"**. Then a divider and the row **"Manage pages ›"**.
The board has no search field, no check glyph on the active page and no "+ Add page" row. Plan Task 1.3 adds all three and switches the template slug form to "Blog post · /blog/:slug". The plan wins on behaviour; the visual comes from this node. Code: none (`chrome-ui/PageSwitcherMenu.tsx` does not exist). **drift**. Hex surface: see the Task 1.1 verifiedNote.

### Shell/InspectorHeader (`497:339496`), 300×84

`Target` row (12,12, 276×24): Icon/type + **"Text"** (element name). `Authored element state` row (12,40, 276×32): **"Editing"** (state control) + **"Desktop · Default state"**. Variants on PLAY boards: "Tablet · Default state", "Content · Read-only · Locked", "Content · All breakpoints" (CMS/image), and load-failed adds **"View only — properties unlock when the site loads."**
Code: `inspector/components/InspectorHeader.tsx:87` breadcrumb "Home › Hero › Heading" + **"Ask AI about this element"** (`:108`, removed by PR #33) + "Hide inspector (⌘\)" (`:117`). The state/breakpoint context is `ContextRow.tsx` ("State: Base ▾", "Tablet · N overrides"). **drift**, Task 1.4. The inspector tabs on every board are **Content · Style · Behavior · Effects**, while code has Style · Behaviour · Effects (`_shared.tsx:44`). Content is the failing step of F1/C01/F2.

### StatusBadge (`500:342149`), 303×32

Three tones, 20 tall: `Tone=Neutral` **"Draft"** (43 w) · `Tone=Success` **"Published"** (68 w) · `Tone=Warning` **"Changed since publish"** (136 w). Code: no StatusBadge. `cms/RecordsTable.tsx:187` renders "· Draft" text, and "Changed since publish" appears nowhere. **drift**, phase1. Hex surface: Task 1.1 verifiedNote.

### V2 screens using the shell

| Board | Copy / structure it fixes | Code | Status |
|---|---|---|---|
| `497:339497` Pages / one page switcher | Bottom bar switcher. Pages manager 284 w: "Pages · 5 · Search pages… · Pages / Listings / Structure · Home / Current · Hidden from publish · ● marks a page with unsaved changes · My folders · Only visible to you · Collection pages · Blog post /blog/{slug} 20 pages · Open page · Manage in CMS · + Add page · From template · New folder" | `sidebar/tabs/pages/PagesTab.tsx:426`, `components/AddPageButton.tsx:60,92`, `utils/statusLabel.ts:17` | drift (phase1 T1.3) |
| `498:634` 100 pages / switcher scales | "100 pages · ⌘P to switch", long-slug rows | PageTabBar tabs | drift (T1.3) |
| `498:1311` Layers / honest tree states | "Search layers · 8 elements · Home", Hero inspector | `LayersTab.tsx:71,308` ("N layers") | drift |
| `499:2656` Publish / one CTA | Tray "Publish · Fieldwork Studio · whole site · ⋯ ✕ · CHECKS 1 blocking · 3 tips · APPROVAL ✓ Approved by Lena (client) · 15 Oct · GOES TO · Publish changes (disabled) · **Fix 1 blocking issue to publish**", canvas 46%, no topbar Publish | `PublishTab.tsx` | drift (T1.7) |
| `499:3065` Site settings / one home per area | Nav "Overview · SITE General Languages · SEARCH & SHARING SEO · PUBLISHING Domains Redirects Access · VISITORS Analytics Form submissions · ADVANCED Custom code Security headers Danger zone · ORGANIZATION WORKSPACE ↗ Members Billing Integrations · Your role: Admin Permissions ›", "‹ Back to Editor · Home", trial card "⏱ Pro trial · 12 days left", bottom bar resource variant | `sidebar/tabs/settings/SettingsTab.tsx:7` ("‹ Back to canvas") | drift |
| `500:342150` CMS / status badges, no page tabs | "‹ Back to Editor · Home · Blog · 1,000 records · + Add record · Records / Fields / Dynamic pages / Collection settings · Search Blog… · All statuses · Updated · Newest · Columns", StatusBadge column | `cms/CmsWorkspace.tsx:172`, `RecordsTable.tsx:187` | drift (StatusBadge) |
| `500:342702` Site didn't load / truly view-only | Global banner 40 tall: "✕ · **Couldn't load this site. You can look around; editing waits until it loads.** · Download local copy · Retry"; inspector "View only — properties unlock when the site loads."; bottom "Not loaded · nothing saved yet" | `shell/LoadErrorBanner.tsx:99` ("Couldn't load this site. Retry — anything done here is not saved until it loads."), with no Download local copy | drift (T1.6) |
| `502:3556` FirstRun/Checklist | "Get your site live · 0 of 3 · Edit your headline · Set your brand colour · Publish · Hide checklist" | — | blocked:first-run (out of scope) |

---

## Archetype tables (per family)

### play (223 rows)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| PLAY index | 302:3370 | 1 | — | match | No product surface |
| F1 · Edit a page | 302:3396, 302:4542, 302:8193 | 12 | `inspector/sections/registry/_shared.tsx:44`, `ContextRow.tsx:5`, `PreviewOverlay.tsx:177` | drift @ F1.03 (2 drift / 10 match) | Content tab missing |
| F2 · Bind + record | 302:11636, 302:15235, 302:16675 | 17 | `CmsBindingSection.tsx:239`, `cms/RecordSheet.tsx:521,722` | drift @ F2.01 (9 drift / 8 match) | no source picker; no save-and-return to binding |
| F3 · Replace image | 302:19891, 302:20714, 376:25146 | 14 | `typeBlock/SourceRow.tsx:9,121`, `StatusLine.tsx:46` | drift @ F3.03 (7 drift / 7 match) | no captured target / staged choice |
| F4 · Fix + publish | 303:32296, 303:35374, 303:36642 | 31 | `IssuesPanel.tsx:217`, `PublishTab.tsx:538,555`, `PublishConfirmModal.tsx:85` | drift @ F4.01 (6 drift / 25 match) | publish lifecycle matches; issue + ack-checklist gaps |
| F5 · Review | 307:16107, 307:17363, 307:21249 | 46 | `SendForReview.tsx:110`, `ReviewTab.tsx:662`, `dashboard:review-client.tsx:366,516` | drift @ F5.04/F5.08 (13 drift / 33 match) | approval code flow + pinned comments absent |
| F5 variants (EARLY/OPEN/NOPREVIEW/NOTE/SECOND-*) | 312:22661, 377:25498, 397:25684 | 96 | as F5 | inherit (68 drift / 28 match) | `inheritsFrom` → same-numbered F5 step |
| C01 selection | 350:25304 | 3 | `_shared.tsx:44`, `textBodies.tsx:57` | drift | Content tab |
| C02 missing alt | 353:24569, 353:24957 | 3 | `IssuesPanel.tsx:337`, `mediaBodies.tsx:71` | drift @ C02.1 (1 drift / 2 match) | grouped subview + back-link |

### shell-components (14 active rows)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| Shell/Topbar | 497:99433 | 1 | `chrome-ui/Topbar.tsx:225,274` | drift | phase1 T1.2 |
| Shell/Rail | 497:99445 | 1 | `rail/tabsConfig.ts:62` | drift | not in Phase-1 list; lead to place |
| Shell/BottomBar | 497:99485 | 1 | `shell/PageTabBar.tsx:85` | drift | phase1 T1.3; ⌘P → code authority |
| Shell/PageSwitcherMenu | 558:4419 | 1 | — (to create) | drift | phase1 T1.3 |
| Shell/InspectorHeader | 497:339496 | 1 | `inspector/components/InspectorHeader.tsx:87` | drift | phase1 T1.4 |
| StatusBadge | 500:342149 | 1 | `cms/RecordsTable.tsx:187` | drift | phase1 |
| V2 shell screens | 497:339497, 499:2656, 500:342702 | 7 | see table above | drift | T1.3/T1.6/T1.7 |
| FirstRun/Checklist | 502:3556 | 1 | — | blocked:first-run | out of scope |

## Top drifts

1. **The inspector has no Content tab** (`_shared.tsx:44`). This breaks F1.03/F1.05, F2.01, C01.×3 and every PLAY inspector header ("Content · Style · Behavior · Effects"). It is the largest structural gap and belongs to the Inspector lane.
2. **The approval code flow is absent** on the client page (`review-client.tsx:516` confirm only). This covers F5.20–F5.22, F5.25–F5.30, F5.32–F5.33 and 68 variant rows. It needs a server contract (code issue / verify / rate limit) through tRPC → service, and probably an owner decision.
3. **There is no "Choose source" picker or binding subview** (Format, If empty, Binding summary). See F2.02/F2.05/F2.16 and `CmsBindingSection.tsx:239`.
4. **The record → binding round trip does not exist**: no "Save and leave", no "Retry and return", and back goes to the canvas, not the binding (`RecordSheet.tsx:521,722`). See F2.08/09/12/14/15.
5. **Image replace has no captured target**: the pick applies at once, and locked or deleted targets get no recovery (`SourceRow.tsx:9`). See F3.03/05–09/11.
6. **Issues gaps**: there is no detector for "collection list has no source", no blocker/tips split, no "‹ Back to Issues" and no "Review and publish" CTA (`IssuesPanel.tsx:200,217`). See F4.01/02/05 and C02.1.
7. **The publish confirm has no acknowledgement checklist** ("I've seen these", "Publish without a fresh review"), where code has `PublishConfirmModal.tsx:85` + `StaleApprovalModal`. See F4.08–F4.10.
8. **Client comments are page notes, not pins** (`review-client.tsx:366`). See F5.08 and SECOND-*.1.
9. **A failed review preview auto-sends** where the designer should get a choice (`SendForReview.tsx:110`). See F5.04.
10. **The shell chrome differs from the Improved specs**: topbar, bottom bar/page switcher, inspector header, StatusBadge and load-failed copy (phase1 T1.2–T1.7).

## code-ahead dispositions

None scored `code-ahead`. Capabilities in code that the boards do not draw, recorded for the lanes:
- Inspector "Ask AI about this element" (`InspectorHeader.tsx:108`): **blocked:pr33-ai-removal**. Drop it, do not design it.
- Breakpoint-wide "Tablet · Revert" and pseudo-state "State: Base ▾ / N :hover overrides · Reset" (`ContextRow.tsx:3-6`): keep both. They live in the InspectorHeader "Editing" state control (Task 1.4).
- Topbar SaveStatus "History ›" door (`chrome-ui/SaveStatus.tsx:118`): this moves to the bottom bar "Saved just now · Details" (Task 1.3).
- Unpublish typed-confirm and publish cancel for a running job (`PublishTab.tsx` header): keep both in the tray ⋯ menu (Task 1.7).
- Client "Request changes" note path and identity step (`review-client.tsx:260`): keep it. The PLAY boards assume the identity step is already done.

## Not mapped / not verified

- Visible rail items were not measured (flags). The R/T/B2/BD25 rows are out of scope.
- The "match" calls on F4.11–F4.26 and F5 designer steps rest on code reading, not a live walk.
- No live-app or screenshot verification was done. This inventory is read-only and used no Figma calls.

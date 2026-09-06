# COMPILE-A — Content/CMS (FIG-A), Pages (FIG-B), Publish/Export/Preview (FIG-C)

Compiled from `findings/FIG-A.jsonl` (26 rows), `FIG-B.jsonl` (24), `FIG-C.jsonl` (31).
In scope for this pass: **40 `fix-board` + `add-state` rows** (A: 10+1, B: 11+2, C: 13+3).
Skipped by the brief: 29 `none`, 4 `mark-unimplemented` (already executed).
`create-board` (3) and `wire-edge` (5) are here in §N and §W — neither applier can make them.

**Produced:**
- `scratchpad_audit/mod/plan-text-A.json` — **36 TEXT rewrites**
- `scratchpad_audit/mod/plan-marks-A.json` — **6 renames**

Both plans **dry-run clean against the live file**, every node re-read first:
`would rewrite 36 · refused 0 · missing/not-text 0` and `would rename 6 · missing 0`.
Every node in both plans is on page **`1:3`** (verified by walking each to its PAGE
parent), so both appliers run at their default `--page=1:3`.

**13 findings compiled with nothing left over:** A-08, A-09, A-19, A-20, B-03, B-07,
B-09, C-04, C-05, C-06, C-07, C-17, C-28. Everything else has a remainder below.

---

## §Q — premises that were wrong or already executed when I read the node

Read before applying anything else in this file.

**Q1 · FIG-A-05 — the rewrite it asks for is already in the file.**
`1706:8397` now reads, verbatim: *"No records published yet. Dynamic pages generate
only from published records — and only once a template page is bound."* — which is
exactly the string the finding proposes. The coordinator's session rewrite landed.
**Not compiled** (a re-write would be a no-op the applier reports as `SAME`).
What is still outstanding is the finding's *second* half: the warning-toned line
*"No template page is bound, so publishing emits none of these yet."* beneath it.
That is a new node, and `1706:8437` is `layoutMode=NONE` at 720×162 with four
children, so it needs an absolute position and probably +18px of frame height. → §A2.

**Q2 · FIG-A-15 — already satisfied, and by a shorter sentence.**
`161:17` now ends: *"Two things this state does not say: a binding to a DRAFT record
publishes that draft's text, and publishing a record does not refresh the canvas."*
Both facts the finding wanted are there. The finding's proposed text adds only the
parenthetical mechanism (*no status filter in resolveBinding; the publish transition
emits its own event*) at the cost of ~90 more characters on a caption already 308
chars / 108px tall. **Not compiled.** Coordinator call: leave it, or ask for the
mechanism clause and accept 161:17 growing to ~144px.

**Q3 · FIG-C-16 — the correction is right, but its own replacement rows are still
half-invented.** The finding is correct that the sole producer is the DS token
linter and that every location is `Brand › <tokenId>`. But two of the three rows it
proposes are not shapes that producer emits either:
- *"Value is not on the 4px scale"* — there is no spacing-scale rule. `DSLinter.lint`
  ships exactly eight rules: `contrast`, `banned-hue`, `pure-black`, `empty-value`,
  `missing-dark`, `unresolved-binding`, `alias-depth-exceeded`, `semantic-needs-alias`
  (`engine/designSystem/linter/DSLinter.ts:12-23`).
- *"Family is not in the site's font set"* — no font rule exists at all.

So I compiled the **real message templates**, matched to the board's existing
severity glyphs (2 × ● error, 1 × ▲ warning, which the title "Publish with 2 open
errors?" depends on):

| node | glyph | rule | text compiled |
|---|---|---|---|
| `1168:4737` | ● | `empty-value` (error, non-color) | `Brand › radius.md · Token "radius.md" has empty value.` |
| `1168:4740` | ● | `banned-hue` (error) | `Brand › color.brand · Token "color.brand" uses a purple/violet/indigo hue ("#7C3AED").` |
| `1168:4743` | ▲ | `contrast` (warning) | `Brand › color.accent · Accent fails WCAG AA against the page background` |

**One truncation, flagged:** the real `banned-hue` message continues
*"… DESIGN.md bans these — use the accent #1A56DB or a gray neutral."*
(`DSLinter.ts:115`). Full, the row is ~150 chars ≈ 720px inside a 464px row frame
whose text node is `WIDTH_AND_HEIGHT` — it would burst the modal. I compiled the
first sentence only. If the coordinator wants the whole message, the row's text node
needs `textAutoResize: HEIGHT` at a fixed ~446px width first.

**Q4 · FIG-C-01 — the board is not wrong on its own; the code ships the same words.**
`PublishTab.tsx:421-429` renders *"Connect Vercel to publish."* / *"Buildrick deploys
into your own Vercel account — we host nothing."* and `:681-690` renders the
`Connect Vercel` CTA (which opens `${DASHBOARD_URL}/dashboard/settings/integrations`).
The board is a faithful drawing of shipped code; the finding's point is that **both**
are wrong for the state this branch actually renders in. Compiling it therefore makes
board and code **diverge until a companion code change lands**. That code change is
out of scope for this read-only pass — flagging it so the divergence is deliberate,
not an accident. See §A1 for the CTA sub-decision.

**Q5 · FIG-B-06's row-count clause is wrong — the board already agrees with the code.**
The finding says *"PagesStateBlocks.tsx:20-23 says the board draws 'seven 32h rows'
and the ROWS array has SIX … make code and board agree at six."*
I walked `774:4044`: it draws **six** skeleton rows (`774:4089`, `4092`, `4095`,
`4098`, `4101`, `4104`), 32h each, indents `36/56/36/36/56/36` px — which maps
exactly onto the code's `pl-4 / pl-9 / pl-4 / pl-4 / pl-9 / pl-4`.
**No board change is needed.** The only thing saying "seven" is the code *comment* at
`PagesStateBlocks.tsx:20`. That is a one-word source edit, not a Figma edit, and this
pass is read-only on both trees. The rename half of B-06 **is** compiled (2 marks).

**Q6 · FIG-B-08 — I did not change `141:120` ("3 selected").**
The finding offers two options: retitle the count to "1 selected", or note that the
bar arms at one. `141:78` draws a **three-page selection** (Home / Menu / Contact
rows plus About), so retitling the count alone would leave the board internally
contradictory — a "1 selected" bar over three selected rows. I took the finding's
second option and folded *"and it arms at ONE selection, not three"* into the caption
`155:21` (compiled, merged with B-09). The ✕, the Select-all band and the Move-to
menu are new nodes → §A6.

---

## §A — new nodes on an existing board (batch: draw)

| # | finding | board | what to add |
|---|---|---|---|
| A1 | **FIG-C-01** | `784:4480` | **Decision needed.** I compiled the CTA text `I784:4517;9:7` → `Learn more`. The finding's words were *"a non-action or a 'Learn more' link"*. If the coordinator prefers the non-action, **delete** the button instance `I784:4517` rather than applying that one text row — the panel would then be heading + body only, which is what the code's `noPublishPath` body renders before the footer. The button hugs its label, so `Learn more` shrinks it; check the footer's full-width `tw:w-full` styling still reads. |
| A2 | **FIG-A-05** (remainder) | `1706:8437` (720×162, `lm=NONE`) | Second line under `1706:8397`, warning tone: *"No template page is bound, so publishing emits none of these yet."* (verbatim from `ContentViews.tsx:684`). Absolute placement + ~18px frame height. |
| A3 | **FIG-A-04** (remainder) | `1170:4713` → `1173:4825` | Replace caption `1173:4830` with **four** stacked TextInput rows (8px gap, reuse the `TextInput · name` frame style from `1753:8392`), placeholders verbatim and in this order: `Slug pattern — /blog/{slug}` · `Template page path — blog/_template/index.html` · `SEO title — {title} — Blog` · `SEO description — Read about {title}`. (The `✓` strip on the switch label `1173:4829` **is** compiled.) |
| A4 | **FIG-A-10** | `149:84` and `149:108` | Link-style row `Delete record` in `var(--bk-error)`, 12px from the panel edge, between `149:107` (spacer) and the frame bottom. **Not** on `1705:8408` — that board draws a NEW record and the code hides delete when `recordId` is null. |
| A5 | **FIG-B-02** (remainder) | `140:2` rows `140:20 / 140:24 / 140:27 / 140:36`, mirrored to `141:2 / 141:78 / 1171:4713 / 1171:4767` | The 6-dot drag grip and the trailing `⋯` overflow button. (The caption half **is** compiled.) |
| A6 | **FIG-B-08** (remainder) | `141:78` | ✕ "Clear selection" at the right end of the bulk bar; a `Select all (5 pages)` band with its own checkbox directly under the search band; a second frame or inline callout showing the `Move to…` menu open with the folder list plus a separated `Remove from folder`. |
| A7 | **FIG-B-04** (remainder) | folder rows `140:13-140:16` on `140:2`, `141:13-141:16` on `141:2` | Two 12px hover icon buttons at the right edge of the folder header — pencil `Rename folder`, trash `Delete folder (pages kept)` in `--bk-error`. Count keeps its `margin-left:auto` slot at x290. (The caption half **is** compiled into `155:18`.) |
| A8 | **FIG-B-11** | `140:2` + `141:2 / 141:40 / 141:78 / 141:124 / 141:165 / 141:207 / 782:4212 / 1171:4713 / 1171:4767` | 26×22 ghost button holding a mono 11px `⌘K` keycap, right of the "Pages" title in the panel header. Draw it pressed/active on `1171:4767`. Nine boards. |
| A9 | **FIG-B-12** | `141:207` | `‹ Pages` text button top-left of the body, above the PAGE/TITLE/DESC/SCORE band, `--bk-ink-soft` 13px. Also move the frame-level ON_CLICK → `140:2` onto that button (§W5). |
| A10 | **FIG-C-15** (remainder) | `1168:4713` (`lm=VERTICAL`, appends cleanly) | Closing line above the footer, 12px muted: *"Sara's approval still stands — publishing now just ships these changes on top of it."* (`StaleApprovalModal.tsx:193-194`; note the code uses a curly `’`, the board's existing copy uses straight `'` — I kept the board's convention in the compiled rows). |
| A11 | **FIG-C-16** (remainder) | new caption under `1168:4732` | *"Issues come only from the design-system token linter (AquibraStudio.tsx:307-328); every location is Brand › <tokenId>. No page-scoped or accessibility linter exists."* |
| A12 | **FIG-C-08** (remainder) | new caption under `641:2652` | *"Preview is a placeholder row — no preview deployment is ever created; every deploy targets production (lib/vercel.ts:140)."* The finding offered "add a note to 788:4319", but that caption is already growing 54→~90px from C-07; a fifth clause would take it past 130px. A new caption is cleaner. |
| A13 | **FIG-C-09** (remainder) | new caption under `641:2652` (or fold into A12) | *"Author is not produced — the undo stack carries userId and the panel reads author (usePublishSnapshot.ts:164), so the column is always empty."* Worth adding a second clause the finding raises but does not compile: the row LABEL is an undo-action label (`Move element`, `Checkpoint` — `HistoryFormatter.ts:22-25`), not the page-scoped summary the board's `Menu — price updates` shape implies. The three labels `641:2686 / 641:2690 / 641:2694` are therefore *also* wrong; I did not rewrite them because the finding did not name replacements and inventing them is judgement, not compilation. |
| A14 | **FIG-C-19** (remainder) | new caption under `1172:4825` | Recommend option (b): keep the two-button footer and record *"the shipping modal has two more secondaries — Download All and Download CSS — whose behaviour is known-broken (MOD-C-15); the design drops them deliberately."* (The `…5 pages · 24 assets` line **is** compiled → `  </head>`.) |
| A15 | **FIG-B-18** (remainder) | `435:2379` — **do not text-fix this node** | The finding wants a sentence appended to the spec-sheet header `RENAMING (F2) · EMPTY · TOO SHORT · VALID`. That node is `textAutoResize: WIDTH_AND_HEIGHT`, 282×13 at 11px, inside `435:2348` which is `lm=VERTICAL` with `counterAxisSizingMode=AUTO` and 1080 wide. Appending ~180 chars makes the node ~1400px wide and **resizes the whole board**. Its four sibling headers are all one-line uppercase labels — the convention forbids prose here. Needs a new wrapped text node under `435:2380` (fixed width 1000, `HEIGHT`): *"These are the tab bar's rules. The sidebar rename (1717:17217) refuses duplicates and has no length rule; the tab bar warns on length and accepts duplicates. Same verb, two rulebooks."* The **mirror** half of B-18 (on `1717:17234`) is also deferred — see §G1, there is no room. |

---

## §D — deletions and visibility (batch: remove)

| # | finding | node(s) | what |
|---|---|---|---|
| D1 | **FIG-C-08** | `641:2676`, `784:4324`, `784:4401`, `784:4478` | Delete the `›` chevron beside each Preview row. The four *values* are compiled to `None`; these four chevrons are all that is left. (Setting `characters` to `""` would leave four empty nodes still holding layout — delete is right.) |
| D2 | **FIG-A-12** | `776:4097` | Delete the `2` beside the COLLECTIONS header on `775:4241` — the loading panel cannot know the count. Alternative the finding offers: replace it with an 8px skeleton pill matching `sk 775:4289`. The DATA band (`776:4098`) is already correct; match it. |
| D3 | **FIG-A-18** | `1744:8394` | Set the `Actions` table header hidden (`visible=false`), or restyle it to the file's visually-hidden convention — the code renders it `sr-only` (`CMSRecordsModal.tsx:357-359`). Leave the three row buttons; they are real. |

---

## §G — geometry that must land WITH a compiled text row

| # | finding | node | why |
|---|---|---|---|
| G1 | **FIG-B-10** | `1717:17234` inside frame `1717:17217` | The amended annotation **is** in `plan-text-A.json`, but it grows the node from 118 → 253 chars, i.e. **39px → ~98px**. The node sits at `y=268` in a **320px-tall** frame, leaving only 52px. **Apply the text and grow `1717:17217` to ~380px in the same batch**, or the note overflows the board. This is also why FIG-B-18's mirror sentence is not compiled at all — even after the frame grows there is no room for another ~155 chars. |

Everything else in `plan-text-A.json` was checked for room and is safe:
captions in `1776:8377` sit at `y=1052` with the next board row at `y=1280` (228px of
clearance; `155:18` grows 36 → ~144px, `155:21` 54 → ~108px). Captions in `1776:8378`
sit at `y=2465`/`y=3871` with 192px/194px of clearance (largest growth: `788:4318`
72 → ~108px). Captions in `1776:8376` sit at `y=2058` with the next row at `y=2232`
(174px; `155:52` 54 → ~90px, `155:50` 36 → ~72px). `1168:4732` and `1168:4713` are
`lm=VERTICAL` and reflow on their own.

---

## §N — new boards (batch: create)

| # | finding | action | what |
|---|---|---|---|
| N1 | **FIG-A-06** | create-board (**Critical**) | The Dynamic-pages screen — built, reachable, drawn nowhere. Base board `Content · dynamic-pages` (280×812) cloned from `1705:8286`, placed after `151:2` in `1776:8376`, **plus four state siblings** `· no-pattern`, `· none-published`, `· unknown-key`, `· no-template`, each with a 280×54 caption. Literal copy, all from `ContentViews.tsx:600-726`: crumb `‹ Menu items · dynamic pages` (:638); FIELD_LABEL `URL pattern`; mono TextInput placeholder `/menu/{slug}` (:645-651, `aria-label="URL pattern"`); hint 11px muted `One page per record. Use a field slug in braces — {slug} — to build the URL.`; state lines — `No pattern set — this collection generates no pages.` (:672) · `No records yet — nothing to generate.` (:663) · `{n} records, none published. Dynamic pages only generate from published records.` (:665) · `Generates {n} pages from published records.` (:668) · `This collection has no field called "{key}", so every record resolves to the same URL.` (:679-681) · `No template page is bound, so publishing emits none of these yet.` (:684). Warning tone (`var(--bk-warning)`) on the three warning variants, muted on `Generates 4 pages…`. Dirty variant gets the savebar from `149:132`: `Unsaved changes · Discard · Save` (:707-724). Discard confirm (:697-704): title `Discard changes?`, body `The page pattern has unsaved changes. Going back throws them away.` Base caption must record that the `Generates N pages` count is computed from **local IndexedDB** records while generation reads **server** entries (`ContentViews.tsx:623` vs `cms.service.ts:198-202`; MOD-A-24), so a queued sync makes it overstate. **N1 is a prerequisite for §W1.** |
| N2 | **FIG-A-13** | add-state | `Content · sync-failed (toast)`, cloned from the toast catalog `1177:4859`, placed after `453:4010`, 360w (Toast.tsx bottom-right). Title `Some content changes didn't sync`; body `2 CMS changes are saved on this device but not yet on the server. Retry now, or leave it — a reconnect replays the queue.`; one action `Retry now`; sticky, no dismiss timer. 280×54 caption noting it retracts itself when the queue drains. |
| N3 | **FIG-B-15** | add-state | Clone `1171:4767` as `Pages · command-palette · no-match` in `1776:8377`. Query `checkout` in the input (consistent with `782:4212`); the four rows replaced by ONE 12px `--bk-ink-muted` line reading exactly `No pages match “checkout”` (curly quotes — `PageCommandPalette.tsx:124-126`), no action beneath. Caption: *"Unlike the tree, the palette offers no clear — Escape closes it."* Wire from `1171:4767`'s input and back. |
| N4 | **FIG-B-16** | add-state | Clone `1171:4713` **twice**. (a) `Pages · context-menu · delete-blocked (home)` — move menu frame `1171:4753` from y=180 to y=116 to anchor on `Row · Home` (`1171:4725`, y=112), delete `Set as homepage` (`1171:4759`), shrink the frame one row, render `Delete page` (`1171:4766`) at 40% with tooltip `Set another page as Homepage before deleting this one`. (b) `Pages · context-menu · delete-blocked (last page)` — one-page tree, `Set as homepage` absent, `Delete page` disabled with tooltip `A site needs at least 1 page. Add another page first.` Draw the warning toast in both, bottom-centre — **the toast strings differ from the tooltips** and both must be in the file: `Can't delete — your site needs at least 1 page` and `Set another page as Homepage before deleting this one` (`usePages.ts:264-275`). |
| N5 | **FIG-B-17** | create-board | `Pages · structure` (280×812) in `1776:8377`, cloned from `141:207`. `‹ Pages` back link; `5 pages, by route.` in 12px `--bk-ink-soft`; a `role=tree` list, 14px indent per level, each row `▾`/`·` + name (active in `--bk-accent`) + mono 11px `--bk-ink-muted` path. **Include one `<segment>/ (no page)` row** — the state only this view can show. Caption: *"The only view with hierarchy. It is derived from slug segments, not stored — PageData has no parent."* Wire from the `⚂ Structure` link that W-F-16 adds; its `‹ Pages` back to `140:2`. |
| N6 | **FIG-C-03** | fix-board that is really 3 clones | Clone `833:4518` three times at 520w into `1776:8378`. (a) `Publish · pre-checks · loading` — six rows → spinner + `Checking readiness…`, no warning band, primary drawn **disabled**, and a caption recording the defect: *"Continue is enabled here in the shipping build — the gate can be walked past before it answers (PublishWizard.tsx:227)."* (b) `Publish · pre-checks · load-error` — one row `Couldn't load the readiness checks.` + Retry on the right, no band, primary disabled. (c) `Publish · pre-checks · no-site` — one line `Open this site from the dashboard to see readiness checks.` |
| N7 | **FIG-C-10** | add-state | Clone `641:2652` as `Publish · panel · changes-unknown` (280×812). Same three sections; SINCE LAST DEPLOY shows no count pair and no rows, one muted line `Edited since the last deploy — this session has no change list.` LAST DEPLOY unchanged. Caption: *"A reopened editor has an empty undo stack, so the count is 0 and the panel currently claims nothing has changed. The server already answers this (hasUnpublishedChanges, PublishService.ts:172)."* |
| N8 | **FIG-C-11** | add-state | Clone `784:4403` as `Publish · already-publishing` (280×812). Heading in ink, **not** error red: `A publish is already running.` Meta: `Started elsewhere or in another tab. Nothing new was sent.` One action only — `Watch it`; **no** `Try again`, which cannot succeed. Caption names the source: `server/trpc/routers/sites.ts:339-343` CONFLICT. |
| N9 | **FIG-C-12** | add-state | Clone `784:4403` as `Publish · too-large` (280×812). Heading `This page is too big to publish.` Meta: `index.html is 2.4 MB; the limit is 2 MB per page. Optimised images are stored inside the page instead of being uploaded.` Actions `Open Media` (primary text link) + `Try again`. Caption: *"The shipping build prints the raw Zod sentence 'Page HTML exceeds 2097152 bytes' (packages/shared/schemas/publish.ts:30) — this board is what it should say."* |
| N10 | **FIG-C-29** | create-board | One 1080×540 reference board, **first** in section `1779:4`, named `Preview · what the sandbox drops (reference)`. LEFT: annotated copy of the shipping overlay (topbar retained, 40-tall device bar with breakpoint switcher, page on the app ground, dark `Done` pill bottom-centre) pointing at `65:211` and `807:8663` as canonical. RIGHT: what the preview is NOT, each line with its file:line — `active page only, no navigation` (HTMLParser.ts:39-49) · `no scripts: interactions never run` · `no forms` · `no iframes or embeds` (ExportUtils.ts:36-42) · `no CMS resolution: bindings show placeholders` (Composer.ts:655-720) · `fonts.googleapis.com is the only external stylesheet kept` (ExportUtils.ts:94-95) · `iframe sandbox=""` (PreviewOverlay.tsx:106). Reference board, not a UI to build. |

---

## §W — prototype edges (neither applier can do these)

| # | finding | source hotspot | destination | note |
|---|---|---|---|---|
| W1 | **FIG-B-01** (**Critical**) | three ON_CLICK reactions, one on each of: `140:17` (`Row · Home`, on board `140:2`), `1171:4725` (`Row · Home`, on `1171:4713`), `1171:4779` (`Row · Home`, on `1171:4767`) | **repoint from `302:1978`** (`S3.7 · page-settings · SEO`) **to `52:2`** (`S1 · Editor — ASSEMBLED`) | A row click **activates** the page on canvas (`PageList.tsx:318` → `usePages.ts:200-206` → `PageManager.ts:222-236`); it never opens settings. **Leave the four `hotspot/state · S3.7 · page-settings · SEO` rectangles alone** — those are deliberate walk hotspots, not the row. If a page-settings door on the tree is wanted, it belongs on the context menu's `Page settings…` item `1171:4763`, which carries no reaction today (W-F-06). |
| W2 | **FIG-A-07** | list-row instance `I233:1309` (`Dynamic pages ›`) on `149:50` | new `Content · dynamic-pages` board — **blocked on §N1** | On-click → Navigate-to. The row carries **no count** in either tree (the `Fields` row above it shows 8 from `collection.fields.length`) — do not add one. |
| W3 | **FIG-A-25** | a new `Manage CMS records` result row on `1177:4804` (Tools category, 🗃 glyph) — the row itself is a §A-class draw | `1170:4749` (`Content · records (modal)`) | The canvas command palette (⌘⇧P, `useCanvasCommandPalette.ts:165-172`) is the modal's **only** door in the product. This is the canvas palette, **not** the shell ⌘K family at `166:*`. Do **not** wire a door from the Content rail — none exists in code. |
| W4 | **FIG-B-06** (remainder) | hotspot `1171:4749` on `1171:4713` — the only child with a state name and **no** reaction | `774:4044` | Give it an ON_CLICK. Both renames (`774:4044`, `1171:4749`) are compiled in `plan-marks-A.json`; the edge is not. |
| W5 | **FIG-B-13** | row frames `141:251` (Home), `141:256` (Menu), `141:261` (Contact) on `141:207` | `302:1978` (`S3.7 · page-settings · SEO`) | A listings row opens the page-settings drawer (`PagesTab.tsx:260` → `SearchListingsTable.tsx:96` → `usePages.ts:390-394`). Separately: `141:266` (`Open full listings ›`) should get **no** navigate — it calls the panel's expand toggle (`onOpenFull`), a width change, not a screen change. A caption note is the honest answer unless an expanded-panel board exists. |
| W6 | **FIG-B-14** | `1171:4827` (`Discard changes`) on `1171:4820` | **repoint from `140:2` to `302:2004`** (`S3.7 · page-settings · Social`), or `302:2026` (Advanced) | `confirmTabChange` applies the pending tab and **does not close the drawer** (`usePageSettings.ts:236-241`). The board's title is tab-flavoured (`Discard unsaved SEO changes?`), so it is drawing the tab-change path. **Keep `1171:4825` (`Keep editing`) pointing at `302:1978`** — that one is right. The close path is a second variant board, not this edge. |

---

## Counts

| | compiled | deferred here |
|---|---|---|
| FIG-A `fix-board`+`add-state` (11) | **4 fully** (A-08, A-09, A-19, A-20), **1 partly** (A-04) | 6 — A-05, A-10, A-12, A-13, A-18, and A-15 (§Q2: no work needed) |
| FIG-B `fix-board`+`add-state` (13) | **3 fully** (B-03, B-07, B-09), **5 partly** (B-02, B-04, B-06, B-08, B-10) | 5 — B-11, B-12, B-15, B-16, B-18 |
| FIG-C `fix-board`+`add-state` (16) | **6 fully** (C-04, C-05, C-06, C-07, C-17, C-28), **6 partly** (C-01, C-08, C-09, C-15, C-16, C-19) | 4 — C-03, C-10, C-11, C-12 |
| `create-board` (3) | — | 3 (A-06, B-17, C-29) → §N |
| `wire-edge` (5) | — | 5 (A-07, A-25, B-01, B-13, B-14) → §W |

**36 text rows + 6 renames compiled**, all dry-run clean.
**13 findings are finished** by those two plans and need nothing further.
**12 are partly compiled** — the text half is in the plans, the remainder is in
§A/§D/§G. **15 are wholly deferred** to §A/§D/§N/§W.
**6 carry a §Q entry** where the finding's premise had moved or was wrong:
A-05, A-15, B-06, B-08, C-01, C-16.

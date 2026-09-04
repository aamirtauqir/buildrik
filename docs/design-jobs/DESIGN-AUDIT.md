# Editor design audit — does every screen earn its place?

Goal (founder, 2026-09-04): deep audit of the Figma file for workflow, user
flow, UI and UX. Each screen is first tested against the **user's mental
model** — is this screen needed, and why — before any craft critique. Missing
jobs are in scope and must be added. Frames get rearranged. Findings go through
a codex review. Multiple agents; nothing counted done until verified.

Contract for every agent: `BRIEF-DESIGN-AUDIT.md`. Findings land in
`findings/<letter>.jsonl`.

## Ground truth — 27 sections, read live 2026-09-04

| Module | node | frames | wave |
|---|---|---|---|
| Media | 1776:8372 | 40 | A |
| Insert | 1776:8379 | 15 | A |
| Brand | 1776:8373 | 34 | B |
| Inspector | 1776:8381 | 10 | B |
| Canvas | 1779:5 | 3 | B |
| Ecommerce | 1779:6 | 2 | B |
| Settings/S7 | 1776:8387 | 45 | C |
| Shell | 1776:8385 | 17 | C |
| Review | 1776:8383 | 23 | D |
| Client sign-off | 1776:8384 | 10 | D |
| Compare | 1776:8382 | 8 | D |
| Notifications | 1779:2 | 6 | D |
| History | 1776:8374 | 21 | E |
| Publish | 1776:8378 | 14 | E |
| Preview | 1779:4 | 6 | E |
| Command palette | 1779:3 | 7 | E |
| Content | 1776:8376 | 18 | F |
| Pages | 1776:8377 | 13 | F |
| Layers | 1776:8375 | 18 | F |
| AI | 1776:8380 | 11 | F |
| Journeys · S-flows | 1776:8388 | 74 | G |
| Notes | 1776:8389 | 40 | meta |
| 📄 Reference | 862:6859 / 862:6860 | 47 | meta |
| 🗃️ Archive | 957:4474 | 20 | meta |
| 🔍 REVIEW ×2 | 1084:4527 / 1090:4527 | 17 | meta |

341 product screens + 74 journey screens + 124 meta.

## Coverage log

Each agent appends its own section. A module with no coverage line has not been
audited, regardless of how many findings mention it.

## History — coverage

Agent E. Section `1776:8374`, **21 frames in module, 21 fetched** (name, size,
position, full text content, and reactions on the frame *and every descendant*).
**3 screenshotted** in the second pass: 162:2, 949:4474, 1704:8309.

Fetched: 162:2, 163:2, 163:64, 163:113, 163:167, 163:220, 163:269, 184:2,
184:24, 184:37, 184:45, 433:2348, 453:4031, 453:4064, 949:4474, 950:4474,
1138:4573, 1156:4620, 1704:8205, 1704:8256, 1704:8309.

Not checked: nothing in the module. What I did *not* verify is the running app —
no History panel was opened in a browser, so every claim here is board text +
source, never observed behaviour. Code read for ground truth:
`editor/sidebar/tabs/history/HistoryTab.tsx`, `editor/shell/PublishHistory.tsx`,
`server/services/site-version.service.ts`, `server/services/publish.service.ts`,
`server/trpc/routers/site-version.ts`.

Q1 verdicts: 16 KEEP · 3 MERGE-INTO (163:2, 163:113, 1138:4573 → 162:2's chrome;
184:2 → 949:4474) · 1 UNSURE (950:4474 Backups) · 0 CUT.

Second pass (craft) added D-E-30, D-E-31, D-E-32, D-E-35, D-E-40 — a struck-out
tab helper line, a footer clipped 64px outside a 280px panel, four row menus
positioned off-canvas, an empty state with no CTA, and a named milestone that
renders no name. All measured, not eyeballed. The 18 History boards **not**
screenshotted are unaudited for craft; D-E-30 and D-E-31 were measured on 2 of
the 7 boards sharing that header and footer, and asserted for those 2 only.

## Publish — coverage

Agent E. Section `1776:8378`, **14 frames in module, 14 fetched** (same depth).
**2 screenshotted** in the second pass: 641:2652, 778:4238.

Fetched: 641:2652, 778:4238, 781:4489, 784:4250, 784:4326, 784:4403, 784:4480,
833:4518, 893:4518, 912:4520, 914:4507, 1168:4713, 1168:4732, 1172:4825.

Not checked: nothing in the module. **No publish was run and no confirm was
submitted** — the standing rule holds; the confirm boards were read in Figma
only. Code read: `editor/sidebar/tabs/publish/{PublishTab,PublishWizard,
usePublishSnapshot}.tsx`, `editor/shell/hooks/usePublishJob.ts`,
`services/PublishService.ts`, `server/trpc/routers/sites.ts`,
`server/services/publish.service.ts`.

Q1 verdicts: 13 KEEP · 1 MERGE/re-file (1172:4825 is an Export screen filed
here) · 0 CUT. Two Q5 gaps carry no frame at all: unpublish and cancel-publish.

Second pass: **D-E-17 is WITHDRAWN** (recorded as D-E-33). I had reported that
778:4238 draws headings over empty space with no skeleton; the screenshot shows
skeleton bars under all three headings. The text-node dump I filed it from
returns only TEXT nodes and could not see rectangles — the finding was an
artifact of the instrument. The surviving half is re-filed as D-E-34 (the
publish CTA renders fully enabled while the panel loads). 12 Publish boards were
not screenshotted and are unaudited for craft.

## Preview — coverage

Agent E. Section `1779:4`, **6 frames in module, 6 fetched. 1 screenshotted** (817:4950),
plus 2 boards from outside the section (65:211, 807:8663).

Fetched: 817:4774, 817:4856, 817:4899, 817:4950, 879:6901, 1157:4593.

All six self-declare `[not-implemented]` or `[design-ahead]` in their names.
817:4774 is additionally named `superseded by 988:2` and was read, not re-filed,
per the brief. Code read: `editor/shell/PreviewOverlay.tsx`,
`editor/canvas/DeviceFramePreview.tsx`, `editor/shell/hooks/useEditorShortcuts.ts`.

`65:211` and `807:8663` — the boards `PreviewOverlay.tsx` names as the shipping
preview's real boards — were fetched and screenshotted in the second pass at the
coordinator's invitation. They sit **outside this section**, so they are reported
here but remain another module's to own. 65:211 (desktop preview) renders
cleanly. 807:8663 does not — see D-E-38.

Q1 verdicts: 2 KEEP · 3 MERGE-INTO(817:4950) · 1 CUT-and-re-file (817:4856 is a
prose spec, not a screen).

Second pass added the module's worst craft defect, D-E-29: on 817:4950 all four
score numbers are painted in the exact hex of the disc behind them (1.00:1) and
the four savings badges are 1.06:1 green-on-green — eight invisible values on an
audit report, one of which is the accessibility score. 1157:4593 draws the same
tiles and was **not** measured. 4 of 6 Preview boards were not screenshotted.

## Command palette — coverage

Agent E. Section `1779:3`, **7 frames in module, 7 fetched. 3 screenshotted**: 166:2,
166:27, 1177:4804.

Fetched: 166:2, 166:18, 166:27, 166:45, 166:51, 166:58, 1177:4804.

**First pass: screenshots failed for the whole wave.** `node.exportAsync` +
`figma.base64Encode` returned base64 the ~20KB transport truncated — valid PNG
headers over incomplete pixels. **Second pass: fixed.** The committed
`scripts/baseline/figma-shot.mjs` pulls the hosted `image_url` from
`get_screenshot` and verifies header + IEND; **11 boards downloaded, 11 complete,
11 looked at.** Findings D-E-29 through D-E-41 rest on those renders plus
follow-up measurement of fills and bounding boxes.

The pre-assigned premise for this module was checked against source and does not
hold — see `D-E-22`. `shell/modals/CommandPalette.tsx` opens on **⌘K**
(StudioHeader.tsx:250), not ⌘⇧P, and is built to the CmdK boards; ⌘⇧P opens
`canvas/controls/CommandPalette` (useCanvasCommandPalette.ts:50). Code read:
all four palette components, `StudioHeader.tsx`, `PagesTab.tsx`,
`useEditorShortcuts.ts`, `Canvas.tsx`.

Q1 verdicts: 6 KEEP · 1 MERGE-INTO(166:27) · 0 CUT. The merge recommendation
across the two palettes is `D-E-24`; no Figma node was changed.

Second pass: seeing both palettes side by side confirmed D-E-24's direction and
added D-E-36 (the CmdK band headers outweigh their own rows; both frames hold a
fixed height with ~180px of dead space) and D-E-39 (a spec note in the shipped
palette's footer, styled as product copy). **D-E-37 corrects one clause of
D-E-24**: 1177:4804 does have a disabled-row-with-reason pattern — what it lacks
is the permission dimension. The recommendation itself is unchanged. 4 of 7
palette boards were not screenshotted.

---

**Wave E total: 48 of 48 frames fetched · 9 of 48 screenshotted (plus 2 boards
from outside the wave) · 41 findings · 1 withdrawn (D-E-17) · 1 corrected
(D-E-24, by D-E-37) · 4 confirmed (D-E-41).** Craft coverage is the honest gap:
39 of 48 boards have never been looked at, only read.

## Review — coverage

Agent D. Section `1776:8383`, **23 frames in module, 23 fetched** (name, type,
size, position, full text content, and reactions on the frame *and every
descendant*). **2 screenshotted and viewed** (156:2, and 1717:17246 exported but
not viewed — see the screenshot note under Notifications).

Fetched: 156:2, 157:2, 157:58, 157:109, 157:169, 157:221, 158:2, 158:57,
158:105, 158:162, 158:213, 453:3974, 1138:4527, 1705:8494, 1705:8566, 1705:8636,
1705:8704, 1705:8773, 1717:17235, 1717:17246, 184:56, 184:70, 184:87.

Not checked: nothing in the module. **What I did not verify is the running app** —
no Review panel was opened in a browser and no review was sent, so every claim is
board text + geometry + source, never observed behaviour. Code read for ground
truth: `packages/editor/src/editor/sidebar/tabs/review/ReviewTab.tsx`,
`editor/shell/ReviewBar.tsx`, `editor/panels/version-history/ApprovedCompareView.tsx`,
`server/services/review.service.ts`, `server/trpc/routers/reviews.ts`,
`packages/shared/schemas/reviews.ts`, `prisma/schema.prisma`.

Q1 verdicts (23): **20 KEEP** · **3 MERGE-INTO** — 158:213 → Notes section
`1776:8389` (it documents an absence), 1705:8704 and 1705:8773 → 156:2 (component
anatomy, not screens) · **0 CUT**. No Figma node was changed.

## Client sign-off — coverage

Agent D. Section `1776:8384`, **10 frames in module, 10 fetched** (same depth).
**2 screenshotted and viewed** (1339:7171, 1340:7162).

Fetched: 1339:7162, 1339:7171, 1339:7186, 1339:7193, 1339:7200, 1339:7207,
1339:7214, 1339:7221, 1340:7162, 1340:7174.

`1339:7221` is named UNBUILDABLE and `1339:7193` TERMINAL by design; both were
read and neither was re-filed as a defect, per the brief.

Not checked: the running `/review/<token>` page. No review token was minted and no
approval was submitted, so the post-submit transition is asserted from source
(`review-client.tsx:405-445` and the `data.status !== "PENDING"` branch at :250),
not observed. Code read: `packages/dashboard/app/review/[token]/{page,review-client}.tsx`,
`server/services/client-review.service.ts`, `server/trpc/routers/client-review.ts`,
`packages/dashboard/components/global/{global-providers,cookie-consent}.tsx`.

**Answer to the coordinator's question (refines D-X-02):** the client should land
nowhere. The code makes both resolved branches terminal on purpose
(`review-client.tsx:246-249`: *"Both are terminal for the client"*), rendering a
heading, one paragraph and "Signed as", with the preview iframe gone. So eight of
the ten screens having no outbound edge is **correct**, not design lagging code —
`1339:7186` simply lacks the `TERMINAL by design` label that `1339:7193` carries.
The genuine gap is the *other* user: no review event ever reaches the notification
system, so the agency is told only by email, and `notifyReviewSubmitted` filters
the requester out of the recipient list — a one-seat agency is told nothing at all.
Filed as D-D-04, D-D-18, D-D-19.

Q1 verdicts (10): **9 KEEP** · **1 MERGE-INTO** (1340:7162 → 1339:7171) ·
**0 CUT**.

## Compare — coverage

Agent D. Section `1776:8382`, **8 frames in module, 8 fetched** (same depth).
**1 screenshotted and viewed** (168:2).

Fetched: 168:2, 168:26, 168:48, 168:82, 169:2, 169:28, 169:60, 169:92.

`169:60` is named RETIRED and `169:92` SUPERSEDED; both were read and neither was
re-filed as a defect. `169:60` is nonetheless flagged (D-D-26) because retiring it
left the module's only destructive action with no design.

Not checked: the running Compare surface at either width. Code read:
`editor/panels/version-history/{ApprovedCompareView,CompareView}.tsx`,
`shared/utils/html/approvedCompare.ts`, `shared/types/versions.ts`,
`editor/sidebar/tabs/history/components/SavesChrome.tsx`.

**Correction to a premise I started with:** Compare is *not* an orphan module.
Three inbound cross-module edges exist — History `162:2` → 168:2, Shell
`963:4474` → 168:2, Reference `807:6965` → 168:2/168:26/168:82/169:28. What is
missing is the edge from **Review**, whose Compare button reaches only a loading
and an error fragment (D-D-10).

Q1 verdicts (8): **6 KEEP** · **0 MERGE-INTO** · **0 CUT** · **2 pre-labelled**
(169:60 RETIRED — flagged UNSURE pending a product decision; 169:92 SUPERSEDED).

## Notifications — coverage

Agent D. Section `1779:2`, **6 frames in module, 6 fetched** (same depth).
**1 screenshotted and viewed** (165:2).

Fetched: 165:2, 165:24, 165:44, 165:51, 165:71, 453:4051.

`165:24` carries a `NO CODE SUBJECT` annotation; it is not one of the five names
the brief protects, so it received a Q1 verdict of its own (MERGE-INTO(165:2)),
which is what its annotation implies but nobody has acted on.

**Screenshot note:** `node.screenshot()` via `scripts/baseline/figma-mcp.mjs`
worked for this wave — six PNGs were exported and five were viewed. The sixth
(`1717:17246`) was written but never opened, and one attempt (`1339:7186`) failed
with a transport error and was not retried; both are counted as *not*
screenshotted above.

Not checked: the running notification panel, and the dashboard routes
`/dashboard/notifications` and `/dashboard/settings/notifications`. Code read:
`server/services/{notification.service,notification.trigger}.ts`,
`server/trpc/routers/notifications.ts`, `lib/constants/enums.ts:161-183`,
`packages/shared/schemas/notifications.ts`, `prisma/schema.prisma:779-794,853-862`.

Q1 verdicts (6): **5 KEEP** · **1 MERGE-INTO** (165:24 → 165:2) · **0 CUT**.

**Wave D total: 47 of 47 frames fetched, 5 screenshotted and viewed, 28 findings
(5 Critical · 12 Major · 8 Minor · 3 Polish). 40 KEEP · 5 MERGE-INTO · 0 CUT ·
2 pre-labelled. No Figma node was created, renamed, moved or deleted.**

## Media — coverage

Agent A. Section `1776:8372`, **40 frames in module, 40 fetched** (name, type,
x/y/size, every TEXT node with its frame-relative position, and `reactions` on
the frame **and every descendant**). **20 screenshotted** as real PNGs via
`scripts/baseline/figma-shot.mjs` (every one verified `png=true complete=true`).

Fetched (40): 144:2, 145:2, 145:49, 145:96, 145:148, 145:199, 145:250, 145:300,
145:359, 146:2, 146:32, 146:68, 147:2, 147:55, 453:3931, 777:4093, 782:4353,
1159:4593, 1162:4617, 1163:4641, 1163:13695, 1163:13948, 1164:4713, 1164:4738,
1175:4827, 1205:4816, 1704:8361, 1704:8396, 1704:8448, 1704:8514, 1705:8842,
1705:8889, 1716:8391, 1716:8453, 1716:8497, 1716:8541, 1716:8557, 1717:17203,
1738:8394, 75:2.

Screenshotted (20): 75:2, 144:2, 145:2, 145:49, 145:250, 145:300, 145:359,
146:2, 147:2, 147:55, 453:3931, 777:4093, 782:4353, 1159:4593, 1162:4617,
1163:4641, 1163:13695, 1164:4713, 1704:8514, 1717:17203. Every Media craft (Q4)
finding about *layout, overlap, clipping or hierarchy* rests on one of those
PNGs. Three Q4 rows also quote label or copy strings from boards I did not
capture (D-A-38 cites 1716:8391's tab and filter labels; D-A-49 cites 1164:4738;
D-A-50 cites 145:199) — those sub-claims are text-tree facts, not looks.

**Not screenshotted (20)** — read as metadata + text + reactions only:
145:96, 145:148, 145:199, 146:32, 146:68, 1163:13948, 1164:4738, 1175:4827,
1205:4816, 1704:8361, 1704:8396, 1704:8448, 1705:8842, 1705:8889, 1716:8391,
1716:8453, 1716:8497, 1716:8541, 1716:8557, 1738:8394. **No Q4 craft finding is
filed against any of these** — findings on them are Q1/Q3/Q5 only, resting on
fetched reactions, fetched text, or source.

This distinction is load-bearing: on `453:3931` and `777:4093` the type-pill
count TEXT nodes are present in the layer tree (`128 / 6 / 24 / 370`) but do
**not** render. A finding written from coordinates alone would have said those
boards contradict themselves. They do not. Anything below derived from text
positions without a capture is stated as a text-tree fact, never as a look.

Code read for ground truth (not inferred):
`editor/sidebar/tabs/media/{MediaTab.tsx,components/*}`,
`editor/media/{LibraryManager,MediaLibraryPanel,components/{FolderTree,AssetDetailsPanel,AssetGrid}}.tsx`,
`editor/rail/tabsConfig.ts`.

Q1 verdicts (40 frames): 36 KEEP · 3 MERGE-INTO(144:2) — 1704:8514, 1705:8842,
1705:8889, filed as two rows · 1 UNSURE (1163:13948 — designs archive extraction
with no code path) · 0 CUT. Four Q5 gaps carry no frame at all: Trash, folder
rename/delete, non-image asset detail, and the drawer stock surface's
empty/loading/failed/quota states.

**Not verified at all:** the running editor. No Media panel was opened in a
browser; every behavioural claim is board text plus source, never observed.
`PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY` were not checked, so whether the stock
boards describe a reachable feature in this deployment is unknown.

## Insert — coverage

Agent A. Section `1776:8379`, **15 frames in module, 15 fetched** (same depth as
Media). **6 screenshotted** as verified PNGs: 137:2, 138:53, 1069:4529,
1069:4707, 1706:8501, 1170:4777.

Fetched (15): 137:2, 138:2, 138:53, 138:106, 138:153, 138:198, 138:244,
775:4053, 781:4154, 1069:4529, 1069:4707, 1138:13394, 1138:13413, 1170:4777,
1706:8501.

**Not screenshotted (9):** 138:2, 138:106, 138:153, 138:198, 138:244, 775:4053,
781:4154, 1138:13394, 1138:13413. No Q4 finding is filed against any of them.

Three boards name themselves `RETIRED 2026-09-02 (no producer)` — 138:198,
775:4053, 781:4154 — and one names itself `CONDITION-ONLY … no control` —
138:153, which is also the module's only frame with zero reactions. Per the
brief these carry their own explanation and are **not** re-filed as defects.

The pre-assigned premise held: the live panel is
`editor/sidebar/tabs/build/BuildTab.tsx`, four groups, click-to-insert with
smart placement. `ElementsTab.tsx` was not read and is not cited anywhere here.
Also read: `catalog/{groups,catalog,tips}.ts`, `components/{GroupSection,
TipsFooter,SearchResults,TransitionCallout}.tsx`,
`canvas/controls/{BlockPickerModal,UnifiedSelectionToolbar}.tsx`,
`shell/modals/CreateComponentModal.tsx`, `rail/tabsConfig.ts`.

Q1 verdicts (15 frames): 8 KEEP · 0 MERGE-INTO · 0 CUT · 3 UNSURE (1706:8501 —
a second element picker with a different taxonomy; 1138:13394 and 1138:13413 —
other panels' screens filed here, defensible because `tabsConfig.ts` maps both
to `tool: "insert"`) · 4 **not judged**, being the three self-named RETIRED
boards plus 138:153 CONDITION-ONLY. Four Q5 gaps have no frame: the transition
callout, the Paste-HTML failure states, the Add-Child modal's search/no-results
states, and the tips re-enable path.

**Not verified at all:** the running editor, and the two group-expanded boards
`1069:4790` / `1069:4970`. Those two are cited by `GroupSection.tsx` as the
contract for COMPONENTS and MINE, and 137:2 navigates to them, but they sit in
`🔍 REVIEW · Insert — inline expanded (3 boards)` — outside my section. I
resolved their names and parents; I did not fetch their contents.

**Wave A total: 55 of 55 frames fetched, 26 screenshotted as verified PNGs
(20 Media + 6 Insert), 58 findings (4 Critical · 33 Major · 19 Minor ·
2 Polish).**

## Content — coverage

Agent F. Section `1776:8376`, **18 frames in module, 18 fetched** (name, type,
size, x/y, full text content with per-node y/x/size/weight, non-text node
inventory on the archetype, and reactions on the frame *and every descendant*).
**5 screenshotted and viewed:** 148:2, 149:7, 149:50, 775:4241, 1170:4749.

Fetched: 148:2, 149:7, 149:50, 149:84, 149:108, 151:2, 151:46, 151:62, 151:87,
453:4010, 775:4241, 1170:4713, 1170:4749, 1705:8286, 1705:8339, 1705:8378,
1705:8408, 1705:8454.

Not checked: nothing in the module. **Not verified:** no Content panel was
opened in a running browser — every product claim here is source, not observed
behaviour. I also did not verify whether a CMS record delete is undoable
(D-F-10 says so). Code read: `editor/sidebar/tabs/content/{ContentTab,
ContentViews,useContentPanel}.tsx`, `editor/shell/modals/CMSRecordsModal.tsx`,
`editor/rail/tabsConfig.ts`, `server/trpc/routers/cms.ts`,
`engine/cms/{CollectionManager,CollectionStorage}.ts`, `services/cmsSync.ts`.

Q1 verdicts: 17 KEEP · 1 MERGE-INTO(1776:8381 Inspector — `151:87` conditions)
· 0 CUT.

## Pages — coverage

Agent F. Section `1776:8377`, **13 frames in module, 13 fetched** (same depth).
**5 screenshotted and viewed:** 140:2, 141:78, 141:165, 141:207, 1717:17217.

Fetched: 140:2, 141:2, 141:40, 141:78, 141:124, 141:165, 141:207, 435:2348,
774:4044, 782:4212, 1171:4713, 1171:4767, 1717:17217.

`774:4044` is self-labelled `RETIRED 2026-09-02 (no producer)` and was read, not
re-filed, per the brief. **Not verified:** no Pages panel was opened in a
browser; the ⌘K collision is taken from the coordinator's cross-module finding
and cited, not independently reproduced. Code read:
`editor/sidebar/tabs/pages/PagesTab.tsx` and its `components/`
(PageRow, PageList, PageFolder, PageCommandPalette, SearchListingsTable,
PagesStateBlocks), `server/trpc/routers/pages.ts`.

Q1 verdicts: 11 KEEP · 1 KEEP-and-re-file (`435:2348` is Shell chrome) ·
1 self-labelled RETIRED · 0 CUT.

## Layers — coverage

Agent F. Section `1776:8375`, **18 frames in module, 18 fetched** (same depth).
**8 screenshotted and viewed:** 142:2, 143:60, 143:119, 143:355, 775:4130, 1082:4527,
1082:4640, 1171:4829.

Fetched: 142:2, 143:2, 143:60, 143:119, 143:179, 143:237, 143:295, 143:355,
775:4130, 781:4217, 782:4260, 1082:4527, 1082:4589, 1082:4640, 1082:4739,
1082:4835, 1082:5004, 1171:4829.

Four frames carry their own explanation in the name and were read, not re-filed:
`143:355` (UNBUILDABLE), `1082:4739` (NOT A STATE), `1082:4835` (NOT A STATE),
`1082:5004` (UNBUILDABLE). `143:355` is nonetheless filed as **D-F-22** — not as
a defect in the board, but because the product shipped its copy verbatim while
the label's premise still holds, so the shipped copy now fires in the wrong
state. **Not verified:** no Layers panel was opened in a browser; the drag
behaviour, the root-row render and the display-settings popover are read from
source only. Code read: `editor/panels/layers/index.tsx`,
`hooks/useLayerTree.ts`, `types.ts`, `components/{LayersEmptyState,
LayerContextMenu,LayerDisplaySettings,LayersStateBlocks}.tsx`,
`editor/sidebar/tabs/layers/LayersTab.tsx`.

Q1 verdicts: 13 KEEP · 1 MERGE-INTO(142:2) (`143:237` locked) · 4 self-labelled
· 0 CUT.

## AI — coverage

Agent F. Section `1776:8380`, **11 frames in module, 11 fetched** (same depth).
**5 screenshotted and viewed:** 170:2, 170:29, 171:2, 171:36, 171:67.

Fetched: 170:2, 170:17, 170:29, 170:41, 170:70, 170:97, 171:2, 171:36, 171:67,
171:105, 171:136.

The pre-assigned premise for this module — "AI is contextual in the shipping
product, not a panel… a board for a panel that does not exist is a finding" —
**does not hold and was not filed.** `AITab.tsx` is a real panel, and
`StudioPanels.tsx:293-299` routes `ui:switch-tab {tab:"ai"}` into the
**inspector column** citing these very boards ("Boards 170:2 and 66:225 put AI
in the INSPECTOR column with a '‹ Inspector' way back"). The boards describe a
surface that exists; what is wrong is its width (D-F-34), not its existence.
AI is off the six-item rail (`tabsConfig.ts:349-351` RAIL_FIGMA =
add · layers · pages · assets · content · design) and opens from ⌘K, shortcut I
and the canvas ✨ — which is what the premise was reaching for.

**Not verified:** no AI run was started, no prompt submitted, and no quota or
missing-key state was reproduced. The undo claim in **D-F-31** rests on two
source comments (`EmptyThread.tsx:53` vs `AgentPlan.tsx:30-33`), not on a
measured undo stack — that is the one row in this file most worth re-checking in
the running app. Code read: `editor/sidebar/tabs/ai/{AITab,ChatThread,Composer,
EmptyThread,AgentPlan,ScopeChip}.tsx`, `AITab.css`,
`editor/shell/StudioPanels.tsx`, `server/trpc/routers/ai.ts`.

Q1 verdicts: 10 KEEP · 1 MERGE-INTO(170:2) (`170:17` scoped) · 0 CUT.

**Wave F total: 60 of 60 frames fetched, 23 screenshotted AND viewed, 38 findings
(2 Critical · 25 Major · 10 Minor · 1 Polish).** Screenshots were taken two
ways and both produced complete PNGs: `node.screenshot()` via the committed
JSON-RPC client returns an inline *image* content block (13 boards, all
IEND-verified), and `scripts/baseline/figma-shot.mjs` downloads the hosted URL
(10 boards, `complete=true`). The failure mode that cost wave E its screenshots —
`exportAsync` + `base64Encode`, which returns *text* and is truncated at ~20KB —
was hit once here and abandoned; it is the encoding, not the export, that fails.

---

## Brand — coverage

**Screens in module: 34** (section `1776:8373`).
**Fetched: 34 of 34** — reactions on the frame *and every descendant*, plus a
full text dump, for all 34.
**Screenshotted: 34 of 34**, downloaded as verified-complete PNGs via
`scripts/baseline/figma-shot.mjs` (PNG header + IEND checked on each).
**Rendered and looked at: 12 of 34** — `152:52`, `152:112`, `153:120`,
`154:26`, `154:78`, `154:132`, `306:2217`, `775:4305`, `1333:7162`,
`1704:8575`, `1704:8607`, `1706:8483`. Looking, not measuring, is what caught
D-B-37 (a toast parked over the type specimen) and D-B-35 (a board named for a
state it does not draw).
**Captured but not rendered: 22** — findings on those rest on text + node
structure + reactions only, and say so in their `evidence`.

Q1 verdicts, all 34:

| Verdict | Count | Screens |
|---|---|---|
| KEEP | 28 | 152:52, 152:83, 152:112, 152:137, 153:2, 153:29, 153:57, 153:92, 153:120, 154:2, 154:78, 154:132, 306:2049, 306:2080, 306:2186, 306:2217, 306:2232, 306:2265, 306:2298, 775:4305, 781:4311, 1172:4840, 1333:7162, 1704:8575, 1704:8607, 1706:8467, 1706:8476, 1706:8483 |
| MERGE-INTO | 1 | 154:26 → 1333:7162 (D-B-35 — draws no state) |
| CUT | 0 | — |
| UNSURE | 1 | 433:2391 — a project **schema** migration modal (v0→v3, "Split styles per breakpoint", "Normalise element ids") filed under Brand and reachable only from Import / export. The subject is the project, not the brand; `design-system/migrations/` holds only `index.ts` + tests, so I could not confirm a DS-token migration is what this draws. Flagged, not filed. |
| Pre-labelled, not re-filed | 4 | 306:2111, 306:2136, 306:2161 (UNBUILDABLE), 1138:13376 (RETIRED) |

*(28 + 1 + 1 + 4 = 34.) The modal family's fourth state, `1706:8492`
"AI prompt · error", is **not** in this count — it is a child of the Notes
section, which is the finding (D-B-07).*

**Not checked:** contrast ratios, type scale and token conformance on any Brand
board; the live app (this was a Figma-only pass per the brief).

## Inspector — coverage

**Screens in module: 10** (section `1776:8381`).
**Fetched: 10 of 10** — reactions (frame + descendants) and text for all 10.
**Screenshotted: 10 of 10** (verified-complete PNGs).
**Rendered and looked at: 5 of 10** — `32:2`, `807:8342`, `807:8614`,
`824:5095`, `1707:8456`.
**Captured but not rendered: 5** — `807:8412`, `807:8475`, `807:8521`,
`807:8567`, `429:2350`.

Q1 verdicts, all 10:

| Verdict | Count | Screens |
|---|---|---|
| KEEP | 4 | 32:2, 807:8342, 1707:8456, 429:2350 |
| CUT (→ Archive, rename SUPERSEDED) | 1 | 824:5095 (D-B-15) |
| UNSURE | 5 | 807:8412, 807:8475, 807:8521, 807:8567, 807:8614 — five 812px boards whose whole delta is which 2–4 of 12–13 sections are open (D-B-17) |

**The module's real size is ~25 screens, not 10** (D-B-14). Ten full 300×812
Inspector screens sit in `📄 Reference`: `159:99` no-selection, `159:102`
loading, `159:123` multi-select, `160:2` instance-selected, `160:105`
bound-to-CMS, `160:208` breakpoint-override, `160:313` pseudo-state, `160:412`
reach-all-like-this, `160:512` ai-agent-run, `189:2` reach-whole-site. Five
popovers/modals sit in `Notes`: `1176:4804`, `1706:8458`, `1707:8406`,
`1707:8417`, `1707:8427`.

**Not checked:** I read the *names, sizes and text* of those 15 out-of-section
boards and screenshotted two of them (`159:99`, `160:105`) — I did **not** read
their reactions, so I cannot say what they are wired to or whether moving them
would break a prototype path.

## Canvas — coverage

**Screens in module: 3** (section `1779:5`).
**Fetched: 3 of 3** — reactions and text for all 3.
**Screenshotted: 3 of 3.** **Rendered and looked at: 3 of 3** — `817:4649`,
`817:4723`, `1176:4866`. Full coverage.

Q1 verdicts, all 3:

| Verdict | Screens |
|---|---|
| MERGE-INTO(862:6859 · 📄 Reference) | 817:4649, 817:4723 — both are spec sheets, not screens (D-B-19) |
| MERGE-INTO(1776:8388 · Journeys, beside 807:7775) | 1176:4866 — a submenu detail of the S3.3 context-menu board |
| KEEP | 0 |

**The decision, with evidence, not hedged: the Canvas section contains zero
canvas screens, and this is a filing failure, not an absence.** The canvas is
boarded — ten S3.x screens in Journeys (`301:1979`, `301:2186`, `301:2393`,
`807:7301`, `807:7775`, `807:8069`, `807:8663`, `814:7027`, `815:4518`,
`815:4608`), seven fragments in Notes (`1175:4849`, `1176:4824`, `1176:4925`,
`1707:8433/8436/8452/8455`) and `1177:4804` in Command palette.

**Not checked:** I did not fetch or screenshot any of those 18 out-of-section
canvas boards — I have their names and sizes from a sweep of all 898 frame
names on page `1:3`, nothing more. Whether they are individually good is
unaudited.

## Ecommerce — coverage

**Screens in module: 2** (section `1779:6`).
**Fetched: 2 of 2.** **Screenshotted: 2 of 2.** **Rendered and looked at: 2 of
2** — `1719:8391`, `1719:8421`. Full coverage.

Q1 verdicts, both:

| Verdict | Screen |
|---|---|
| MERGE-INTO(1776:8376 · Content) | 1719:8391 collection-setup — the object is a CMS collection |
| MERGE-INTO(160:105 · Inspector · bound-to-CMS) | 1719:8421 bound · inspector — a duplicate of an existing board (D-B-24) |

**The Q1 answer, applied hard:** a Buildrik user's mental model has no
ecommerce object, and neither does the code — `editor/ecommerce/` contains
exactly one file, `CollectionSetupModal.tsx`; the rest of the family is CMS
binding in `inspector/components/BindingBanner.tsx` + `BindingPopover.tsx`. The
boards agree with the code: `1719:8391` says "…a Products collection in **your
CMS**", `1719:8421` says "Edit the record in **Content**", and the file's own
caption `304:2107` says "**generic CMS binding**, inspector 300". The module is
an orphan named after its trigger. It is also a 5-screen family filed as 2 —
`1719:8414`, `1719:8443` and `1719:8450` are children of **Notes** (D-B-25).

`1719:8421` is marked ENTRY in neither its name nor its reactions; I read the
name first, per the brief, and it carries no `ENTRY POINT` / `RETIRED` /
`UNBUILDABLE` marker — its in-edge comes from `1719:8450` in Notes.

**Not checked:** the Content module (`1776:8376`, 18 screens) is wave F's — I
did not verify that it has a home for `1719:8391`, only that the noun belongs
there.

**Wave B total: 49 of 49 frames fetched (reactions on frame + every
descendant, plus full text), 49 of 49 screenshotted as verified-complete PNGs
via `scripts/baseline/figma-shot.mjs`, 22 of 49 rendered and looked at,
37 findings (2 Critical · 25 Major · 10 Minor · 0 Polish). Q1, all 49:
32 KEEP · 6 MERGE-INTO · 1 CUT · 6 UNSURE · 4 pre-labelled and not re-filed.
No Figma node was created, renamed, moved or deleted.**

## Settings — coverage

Agent C. Section `1776:8387`, **45 frames**.

| | count | which |
|---|---|---|
| Screens in module | 45 | 12 detail + 26 async-state variants + root + Pro-lock + Branding pointer + retired model note + 2 site-health + 1 project-settings modal |
| Fetched (name, size, out-edges w/ descendants, in-degree) | **45 / 45** | whole-page reaction walk over all 898 frames in 28 sections |
| Text-read | **45 / 45** | full text for the 19 non-state frames; Settings-pane text for all 26 state frames |
| Screenshotted (verified PNG via `scripts/baseline/figma-shot.mjs`) | **26 / 45** | 1688:7195 · 638:2378 · 638:3070 · 639:2754 · 639:3092 · 639:3443 · 639:3795 · 639:4144 · 640:2440 · 640:2789 · 640:3135 · 640:3488 · 640:3849 · 1138:13436 · 1702:7095 · 1702:7261 · 1703:7606 · 1703:7914 · 1703:8882 · 1703:10352 · 1703:10515 · 1344:7162 · 1344:7165 · 817:5289 · 1157:4649 · 1172:4867 |
| Geometry measured (child x/y/w/h) | 2 | 638:2378, 1688:7195 — this is what settled the two-navigation-models finding |

**Not screenshotted — 19 frames.** All were text-read and edge-walked, so their Q1–Q3 verdicts stand. No claim about *visual* craft (layout, hierarchy, colour, control state) is made about any of them; the Q4 rows that cite them — D-C-13, D-C-17, D-C-23 — rest on fetched copy, state names and frame geometry, not on looking:
1702:6931 · 1702:7425 · 1703:7127 · 1703:7286 · 1703:7445 · 1703:7760 · 1703:8070 · 1703:8232 · 1703:8394 · 1703:8556 · 1703:8720 · 1703:9046 · 1703:9208 · 1703:9370 · 1703:9532 · 1703:9694 · 1703:9857 · 1703:10022 · 1703:10185.

**Rail check (asked for by the coordinator).** All 39 rail-bearing Settings boards draw exactly the six shipping tools — Insert, Layers, Pages, Media, Content, Brand — at w=60. No legacy 11-button rail, no 4-tool E3 rail anywhere in this section. The prototyping of the rail on these boards is already filed as D-X-01 and is not re-filed here; what it exposed is D-C-49 (the settings dirty-dot is wired to a rail id the shipping rail never renders).

**Findings:** D-C-01 … D-C-30, D-C-48, D-C-49 (32 rows) — 2 Critical, 20 Major, 10 Minor.

## Shell — coverage

Agent C. Section `1776:8385`, **17 frames**.

| | count | which |
|---|---|---|
| Screens in module | 17 | 12 full-shell states + 1 retired 1280 board + 1 slot-proof + 2 modals + the presence board |
| Fetched (name, size, out-edges w/ descendants, in-degree) | **17 / 17** | same whole-page walk |
| Text-read (topbar + rail + body) | **16 / 17** | all but 963:4474, which was read by screenshot and by a full reaction-carrier walk instead |
| Screenshotted (verified PNG) | **17 / 17** | 65:2 · 65:211 · 65:412 · 66:4 · 66:225 · 66:441 · 66:640 · 199:2 · 199:205 · 199:409 · 200:2 · 200:213 · 202:2 · 642:3696 · 963:4474 · 927:4474 · 1175:4804 |
| Geometry measured (Middle band children) | 7 | 199:2 · 199:205 · 199:409 · 200:2 · 66:4 · 66:441 · 65:412 — this settled the transient-vs-pinned drawer finding |
| Fill/opacity measured | 1 | 66:640 scrim |
| Reaction carriers walked child-by-child | 17 / 17 | which is how the ‹ Exit wiring gap was found |

**Not checked in Shell:** nothing was skipped, but two things inside boards were not opened — the `Batch style rows` (300×205) group on 66:4, and the Review bar contents on 200:213 beyond its text.

`65:2` is annotated `ENTRY POINT` and was not filed as an orphan. `202:2` and `1344:7162` are annotated `RETIRED` and were not filed as defects — `1344:7162` is cited only because 39 live boards contradict it.

**Findings:** D-C-31 … D-C-47 (17 rows) — 2 Critical, 9 Major, 6 Minor.

**Read but not audited** (cited as evidence for placement only, they belong to other agents): 297:2139, 297:2027, 294:1976, 1347:7162, 815:4518 (Journeys `1776:8388`); 1172:4804, 1175:4849, 1176:4925 (Notes `1776:8389`); 307:2223, 876:4532 (Reference `862:6859`).

**Limit on every row in `C.jsonl`:** nothing was verified in a running editor. Figma claims are fetched values; code claims are static reads of `SettingsTab.tsx`, `settings.css`, `LeftSidebar.tsx`, `tabsConfig.ts` and a cited file:line map produced by two research passes over `packages/editor/src`, `server/trpc/routers/` and `packages/dashboard/app/`.

---

## Journeys — coverage

Agent G. Section `1776:8388`, **74 frames in module, 74 fetched** — name, type,
x/y/size, and `reactions` on the frame **and every descendant** (carrier counts
ran 4–321 per frame; 210 outbound edges recorded). **In-edges were resolved by a
full-page scan** of every frame under all 27 sections on page `1:3`, so the
orphan/in-degree numbers below are file-wide facts, not section-local ones.
**27 screenshotted** as verified-complete PNGs via `scripts/baseline/figma-shot.mjs`
(`png=true complete=true` on all 27); **7 opened and looked at**.

Fetched (74): 52:2, 55:2, 58:2, 128:2, 129:2, 129:223, 129:451, 130:2, 130:201,
130:400, 130:599, 130:798, 130:997, 131:2, 131:201, 131:415, 132:2, 133:2,
133:212, 133:422, 133:630, 294:1976, 294:1984, 294:1992, 295:1972, 295:1989,
295:1994, 296:1972, 296:1999, 296:2030, 297:1972, 297:2027, 297:2139, 301:1979,
301:2186, 301:2393, 302:1978, 302:2004, 302:2026, 303:1997, 303:2032, 307:2193,
307:2203, 307:2213, 430:2348, 430:2375, 807:6558, 807:7000, 807:7301, 807:7775,
807:8069, 807:8663, 807:8723, 807:8756, 807:8787, 813:4836, 813:4888, 814:7027,
815:4518, 815:4608, 817:5006, 817:5114, 817:5195, 817:5220, 817:5262, 878:4518,
1124:4527, 1124:4562, 1156:4593, 1306:2, 1342:7162, 1343:7162, 1345:7162,
1347:7162.

**Screenshotted (26):** 52:2, 128:2, 130:201, 130:400, 130:798, 130:997, 131:2,
131:201, 131:415, 294:1976, 296:1972, 296:2030, 302:1978, 303:1997, 307:2193,
807:6558, 807:8663, 807:8723, 807:8756, 814:7027, 815:4518, 815:4608, 817:5114,
1342:7162, 1343:7162, 1345:7162, 1347:7162. **Rendered and looked at (7):**
52:2, 130:201, 130:400, 131:201, 296:1972, 307:2193, 807:8723. The other 20
captures were downloaded and verified complete but never opened; findings on those boards rest on fetched text,
fetched fills/geometry and reactions, never on a look, and say so in `evidence`.

**Not screenshotted (47):** 55:2, 58:2, 129:2, 129:223, 129:451, 130:2, 130:599,
132:2, 133:2, 133:212, 133:422, 133:630, 294:1984, 294:1992, 295:1972, 295:1989,
295:1994, 296:1999, 297:1972, 297:2027, 297:2139, 301:1979, 301:2186, 301:2393,
302:2004, 302:2026, 303:2032, 307:2203, 307:2213, 430:2348, 430:2375, 807:7000,
807:7301, 807:7775, 807:8069, 807:8787, 813:4836, 813:4888, 817:5006, 817:5195,
817:5220, 817:5262, 878:4518, 1124:4527, 1124:4562, 1156:4593, 1306:2. **No Q4
craft finding is filed against any of them** — their rows are Q1/Q2/Q3/Q5 only.

Boards carrying their own explanation were read, not re-filed as defects:
`130:2` (ENTRY POINT), `807:8723` (ENTRY POINT — but see D-G-10, which is about
its *content* contradicting the canonical board, not about its entry status),
`132:2` / `133:2` / `133:212` / `133:422` / `133:630` (SUPERSEDED — D-G-27 files
the live *edges into* them, not the boards), `295:1989` / `295:1994` / `1306:2` /
`1345:7162` (RETIRED — D-G-02 treats 1345:7162 as the S2 *flow* question, which
its label does not answer), `807:8787` / `817:5220` ([not-implemented]),
`817:5006` / `817:5195` / `817:5262` / `878:4518` / `1156:4593` ([design-ahead]).

**Orphans: none unexplained.** Six of the 74 have zero in-edges file-wide and
every one carries its own label: 130:2 (ENTRY POINT), 807:8723 (ENTRY POINT),
295:1989, 295:1994, 1306:2, 1345:7162 (all RETIRED). **Dead ends: two**, both
RETIRED (1306:2, 1345:7162).

### Per-flow verdict — is each S-flow a real flow?

| Flow | Boards | Real flow? | Why |
|---|---|---|---|
| **S1** open / return | 24 | **No — hub-and-spoke** | 52:2 has 84 in-edges (file's highest) and 52 out; almost every other S1 board's only exit is back to it. No start: the one first-run board (807:6558) has 1 in-edge and leaves to Shell. D-G-06, D-G-08. |
| **S2** AI | 1 | **No — it is a decision note** | 1345:7162, RETIRED, 0 edges in, 0 out; its content is a founder ruling. The 11 boards it superseded are in Archive. D-G-02. |
| **S3** canvas editing | 18 | **Partly — one ring + two orphaned pairs** | S3.1/3.2/3.11 is a closed 5-cycle of whole-frame hotspots (D-G-22); S3.6's 303 pair is a closed 2-cycle duplicating boards the code already cites (D-G-11/12/23); S3.7 is a Pages-module surface (D-G-14). What survives as a flow is one chain that dead-ends on a [not-implemented] board (D-G-26). |
| **S5** review & sign-off | 26 | **Yes — the only one, and it is wrong in three places** | It has a start (128:2 compose), a middle and a branch structure. But two edges assert transitions the server cannot make (D-G-24), two boards are textually identical (D-G-18), the bar prints a string the code documents as a defect (D-G-17), and it ends at Publish · pre-checks rather than live (D-G-04). |
| **S6** publish | 6 | **No — one live board, and it is about DNS** | Five are [not-implemented] or [design-ahead]. The sixth (807:8756) is Step 2 of 3 of a wizard that does not exist, its 10 in-edges and 3 out-edges are all Settings·Domains. D-G-03, D-G-21. |
| **S7** settings | 0 | **No — a feature module** | Zero S7 frames in this section; all 45 are in `1776:8387`. D-G-07. |

**S4 has no frame in this section at all** — its subjects live in Preview and
Brand, under two *different* S4 series that collide number-for-number (D-G-37).

Q1 verdicts, all 74: **44 KEEP** · **10 MERGE-INTO / re-file** (131:2→130:798;
302:1978 / 302:2004 / 302:2026→Pages; 807:8756→Settings; 55:2 / 58:2→Reference;
1345:7162→Notes; 131:201→beside the S5.4 gate; 130:400→130:201 unless redrawn)
· **4 CUT-and-rename-SUPERSEDED** (303:1997, 303:2032, 807:8723, 817:5114) ·
**16 pre-labelled and not re-judged** · **0 nodes changed in Figma.**

(44 + 10 + 4 + 16 = 74. Eighteen boards carry a protective label; I gave a
verdict to two of them anyway and say so: `807:8723` is labelled ENTRY POINT,
which explains its *entry*, not its *content* — D-G-10 is about the content;
`1345:7162` is labelled RETIRED, which explains the board, not whether the S2
slot should exist — D-G-02 is about the slot. The other sixteen were read and
left alone.)

### Code read for ground truth (not inferred)

`packages/shared/schemas/reviews.ts`, `server/services/review.service.ts`,
`server/services/publish-approval.ts`, `server/services/action-confirmation.service.ts`,
`server/services/share-link.service.ts`,
`packages/editor/src/editor/shell/{StudioHeader,ReviewBar,SiteMenu}.tsx`,
`shell/modals/{StaleApprovalModal,ConflictModal}.tsx`,
`shell/hooks/useEditorShortcuts.ts`,
`editor/media/{ImageEditorModal,OptimizationPanel}.tsx`,
`editor/onboarding/{OnboardingChecklist,OnboardingMount}.tsx`,
`shared/constants/onboardingSteps.ts`,
`editor/sidebar/tabs/settings/screens/DomainsScreen.tsx`,
`editor/sidebar/tabs/ai/hooks/useAiActionGate.ts`,
`packages/dashboard/app/review/[token]/review-client.tsx`,
`packages/dashboard/components/site-detail/overview-tab.tsx`,
`packages/editor/src/themes/tokens.generated.css`.

### Not verified

- **The running editor was never opened.** No review was sent, no gate was
  tripped, no checklist was expanded, no image was edited. Every product claim
  here is board data plus source, never observed behaviour. The two claims most
  worth re-checking live are D-G-17 (that the shipped bar really renders
  "Sent — waiting on your client") and D-G-16 (that ⌘/ and `?` really open two
  different overlays — that one already rests on a comment whose author says
  they measured it, which is second-hand).
- **Contrast, type scale and token conformance were not checked** on any
  Journeys board, except the two fills D-G-20 and D-G-29 rest on. Worth noting
  for whoever does: every primary button measured in this section is `#1c64f2`
  (Flowbite blue-600), while `tokens.generated.css:81` sets `--bk-accent: #1A56DB`.
  I measured that on 6 boards only and have **not** swept the section, so it is
  recorded here rather than filed.
- **The 15 out-of-section boards this module points at** (807:7252, 1124:4527's
  Media parents, 1339:7162/7171/7186/7193, 156:2, 833:4518, 641:2652, 784:4326,
  1168:4713, 199:2/199:205, 817:4856, 876:4532) were resolved by name, and four
  were fetched for text (1339:7162, 1339:7171, 1168:4713, 815:4518). The rest I
  know only by name and section — they belong to other agents.
- **Screenshots for 47 of 74 boards.** Their craft is unaudited.

## Components (page 1:2) — coverage

**Agent I. Scope correction: this page is a component LIBRARY, not product
screens.** It was audited on variant coverage, state coverage, naming and token
binding — not on "does the user need this screen". 24 findings in
`findings/I.jsonl` (3 Critical, 16 Major, 5 Minor).

### What is actually on the page

93 top-level children, which resolve at full depth to **118 component nodes —
25 `COMPONENT_SET` + 93 `COMPONENT`** — plus 11 documentation frames and 12 TEXT
index labels. Zero product screens. The library is split in half by product:

| Band | Declared by the page | Actually present |
|---|---|---|
| Editor Component Sets (`1054:13380`) | 14 | **19** |
| Editor Components (`1054:13382`) | 7 | **14** |
| Dashboard Component Sets (`1054:13384`) | 6 | 6 ✓ |
| Dashboard Components (`1054:13386`) | 12 | 12 ✓ |
| Icons (`1054:13388`) | 29 | 29 in that band; **67 on the page** |
| Documentation & Showcase (`1054:13390`) | 11 | 11 ✓ |

The two editor counts are wrong because ten real components are nested one level
inside the `Atoms — controls` / `Molecules — chrome` / `Molecules — content`
frames (D-I-10). Two organisational schemes — a flat by-type index and a nested
atoms/molecules tree — are running at once.

### Does 1:2 cover the editor's Components PANEL? No.

All 118 component nodes were enumerated and every TEXT node on the page was
searched for `/component|instance|detach|master|reusable|saved/i` (35 hits).
**Not one addresses managing saved components.** Every hit is design-system
vocabulary, Save-status sample copy, or the single Brand-drawer row `20:85`
("Components · 27 ›", inside `20:56` *320 — Brand*). The panel's own states are
not here. See D-I-20 and D-I-21.

### Fetched / screenshotted / not checked

- **Fetched (metadata, variant props or measured fills):** all 93 top-level
  children; all 25 component sets' `variantGroupProperties`; measured fills,
  strokes, corner radius, height, node opacity and effects for all 40 `Button`
  variants, all 24 `Dashboard / Button` variants, all 5 `Badge` and all 5
  `Dashboard / Pill` variants, and all 20 focus variants on the page; full child
  trees of `20:6`, `11:36`, `16:27`, `14:45`, `17:41`, `1034:750`, `469:3961`,
  `685:116`, `8:48`, `91:6`; all 67 icon components by name, size and path.
- **Screenshotted (12):** `9:102`, `981:700`, `14:45`, `16:27`, `17:41`, `20:6`,
  `91:6`, `8:47`, `1017:810`, `500:3`, `12:16`, `982:694`. All verified complete
  PNGs.
- **Not checked — say so plainly:**
  - **13 of the 25 component sets were never screenshotted** — `10:16` Input,
    `10:27` Status dot, `12:26` Checkbox, `19:46` Drawer frame, `19:79` Modal
    frame, `92:30` Slider, `681:122` Topbar, `691:450` Avatar, `692:472`
    Presence, `697:440` Icon button, `697:461` Save status, `975:632` Dashboard /
    Nav item, `984:722` Dashboard / Banner, `989:7133` Dashboard / Section tab.
    Their craft rests on measured geometry only, not on looking at them.
  - **The 12 Dashboard components** (`976:614` Sidebar, `979:658` Top nav,
    `982:664`, `982:677`, `984:683`, `985:682`…`985:729`, `992:743`, `997:705`)
    were fetched by name and size but neither rendered nor measured.
  - `699:440` *Topbar — every state* (26 children) was read only for its text.
  - **No live-app verification.** No `getComputedStyle` read, no running editor.
    Every code claim is a file read; every design claim is a Figma read. The
    focus-ring finding (D-I-02) in particular describes four *declared* values —
    which one wins in the browser is **not** verified.
  - Pages `0:1`, `1:3`, `397:2`, `988:2` were walked only two levels deep for the
    cross-page component search, so D-I-24's "absent from the library" claim is
    scoped to page `1:2` alone.

### Two findings retracted before filing

Both were measurement errors caught by re-measuring, and are recorded so nobody
re-files them:

1. *"`Dashboard / Button` draws disabled with the hover fill."* The fill really
   is `#1A56DB` on both — but the disabled variants carry `opacity = 0.5` at the
   node level, which the first probe did not read. The real defect is different
   and narrower (D-I-03: brand colour at half strength is itself the
   anti-pattern `buttonTheme.ts` documents as fixed).
2. *"Button focus states have no visible ring."* They do — it is a
   `DROP_SHADOW`, not a stroke, and the first probe read `strokes` only. The
   real defect is that the ring's geometry disagrees with the page's own rule
   and with two code sources (D-I-02).

## Client review (page 1:6) — coverage

**Agent H.** Figma file `g4GzQFqzNYz5sosz1QtZXC`, page **`1:6` 👤 Client review**.
This page holds the canonical screens for the external client. The earlier waves
audited page `1:3`, where the client screens exist only as labelled ECHO STUBS.

### Inventory

50 top-level children: **24 FRAMEs (screens)** + 26 TEXT nodes (20 captions,
5 section headers, 1 count label).

| Family | Frames |
|---|---|
| S5.5 identify / landing | `112:2` empty, `23:2` typing, `112:21` validation-error, `113:3` returning-visitor, `23:21` landing-viewing |
| S5.5 commenting / verdict | `114:2` commenting, `117:2` request-changes |
| S5.5 terminal | `117:58` approved, `122:3` changes-requested, `120:2` post-approval-unchanged, `120:50` post-approval-edited-since |
| S5.5 system states | `121:2` expired-token, `121:25` load-error, `121:48` loading |
| S5.5 brand | `125:2` brand-colour, `125:49` brand-colour-fails-contrast |
| S5.5 dead-link (echo-shaped, 1280×720) | `1736:8389` revoked, `1736:8397` not-found, `1736:8405` conflict (self-named UNBUILDABLE) |
| Share | `854:30` draft preview, `869:7005` expired link |
| Transfer | `854:35` accept handover, `854:41` accepted, `869:6999` expired link |

### What was actually done

- **Fetched: 24 of 24 frames.** Full recursive TEXT dump of every frame; full
  reactions sweep over `[frame, ...descendants]` for all 24; absolute-coordinate
  geometry probe on `23:21`, `114:2`, `117:2`, `112:2`, `122:3`, `117:58`; fill
  probe on `125:2` / `125:49`.
- **Screenshotted: 24 of 24** via `scripts/baseline/figma-shot.mjs`, all verified
  complete PNGs. **Viewed by eye: 21 of 24.**
- **Not viewed by eye (3):** `23:2` (A0 typing), `1736:8397` (dead-link
  not-found), `1736:8405` (dead-link conflict). All three were text-dumped,
  reaction-swept and screenshotted; findings that touch them rest on text and
  geometry plus the sibling render (`1736:8389`), not on their own image.
- **Cross-page:** all six echo stubs on `1:3` (`1339:7162`, `1339:7171`,
  `1340:7162`, `1339:7186`, `1339:7193`, `1340:7174`) plus the three F-state
  echoes (`1339:7200/7207/7214`) were text-dumped and reaction-read for the
  drift comparison in `D-H-32`.
- **Code grounded against:** `packages/dashboard/app/review/[token]/{page,review-client}.tsx`,
  `app/share/[token]/{page,password-gate,not-published}.tsx`,
  `app/transfer/accept/page.tsx`, `server/services/client-review.service.ts`,
  `server/services/review.service.ts`, `server/trpc/routers/client-review.ts`,
  `packages/shared/schemas/reviews.ts`, `prisma/schema.prisma`,
  `components/global/cookie-consent.tsx`, `app/layout.tsx`.

### Findings

35 rows in `findings/H.jsonl` — **5 Critical, 23 Major, 5 Minor, 2 Polish**.

### Not verified

- **Nothing was run in a browser.** Every code claim is read from source; no
  `/review/<token>` was opened live. The mobile-overflow arithmetic in `D-H-24`
  is computed from the class list, not measured in a viewport.
- **Contrast ratios** in `D-H-20` are computed from the Figma fill values
  (`#f59e0b` → 2.15:1, `#0f766e` → 5.47:1 against white), not read off a
  rendered page.
- **The other nine pages** of the file remain unaudited by this wave:
  `0:1` Foundations, `1:2` Components (93), `1:4` Site (113), `1:5` Portfolio
  (70), `1:7` Archive (159), `397:2` Dashboard spine (54), `500:2`, `510:2`,
  `988:2` Dashboard v2 (175). No absence claim in `H.jsonl` extends past pages
  `1:6` and `1:3`.
- The Figma **component libraries** behind the instances on these boards were
  not opened; instance-level overrides were read, master definitions were not.

## Dashboard spine (page 397:2) — coverage

Agent **L**. Page set explicitly via `figma.root.children.find(p => p.id === "397:2")`.

**Screens in module.** 54 children = **34 FRAME** + 20 TEXT. Of the 34 frames,
**33 are product screens** (1440×900) and one is an annotation
(`848:215` "Handoff → Editor", 761×204). The 20 TEXT nodes are 14 `caption/…`
nodes and 6 section headers (`1054:13360`–`1054:13365`, claiming
Authentication 11 / Dashboard Home 8 / Other 15 = 34, which matches the frame
count including the handoff note).

**Fetched.** All 34 frames: id, type, position, size, child count and name.
All 14 captions read in full. A reactions sweep ran over **every** frame with
carriers = `[frame, ...descendants]` (12–90 carriers per frame); all 34 have
outbound reactions and every destination stays inside the page.

**Screenshotted (9 of 33 screens).** `397:3` Auth · sign-in · `853:7116` Auth ·
check inbox · `853:7259` Onboarding · AI · brief · `853:209` Dashboard · Home ·
`398:14` Dashboard · Sites · `398:3809` Dashboard · Site detail · `398:3868`
Workspace · Members · `869:375` Dashboard · Sites · empty · plus the annotation
`848:215`. Chosen as one per archetype: full auth card, stub auth card,
onboarding stub, shell+cards, shell+list, shell+detail, shell+form, empty state.

**NOT checked — 24 of 33 screens were never rendered.** Their names, sizes,
child counts, captions and reactions were read; their pixels were not.
`397:18` sign-up · `397:38` forgot-password · `397:50` session-expired ·
`398:97` path chooser · `398:3965` Billing · `398:4015` Workspace settings ·
`398:4114` Notifications · `398:4164` sign out · `448:3899` sign-in submitting ·
`448:3919` sign-in invalid-credentials · `853:317` Getting started ·
`853:411` Media · `853:505` Templates · `853:533` template pick ·
`853:7132` verify email · `853:7148` 2FA · `853:7164` magic link sent ·
`853:7180` workspace select · `853:7227` Onboarding workspace ·
`853:7243` first site · `853:7275` AI generating · `853:7291` AI preview ·
`853:7307` ready · `869:468` Media empty · `869:508` AI generation-failed.
Findings `D-L-14`, `D-L-15` and `D-L-03` rest on captions, reaction graphs and
code comparison for screens in this list; `D-L-08` (the shell) was verified on
the rendered `853:209` and is asserted for the other 19 in-app screens on the
strength of the shared shell, not on 19 renders.

**Also not checked.** Component masters behind the instances. Text styles, fill
styles and token bindings — no `getStyleByIdAsync` or variable read was made on
either page, so every colour, type and spacing claim in `L.jsonl` comes from a
rendered screenshot or a code file, never from a fetched style value.

## Dashboard v2 (page 988:2) — coverage

Agent **L**. Page set explicitly via `figma.root.children.find(p => p.id === "988:2")`.

**Screens in module.** 175 children = **82 FRAME** + 93 TEXT. All 82 frames are
product screens; 3 of them are breakpoint variants (`1035:6242` 768,
`1035:6347` 375, `1035:6434` Site · Overview 375). The 93 TEXT nodes are **79**
`caption/…` nodes and 14 section headers (`1054:13366`–`1054:13379`). The
headers total **79**, three short of the 82 frames — the gap is exactly the
uncaptioned `1731:*` trio (finding `D-L-06`).

**Fetched.** All 82 frames: id, type, position, size, child count, name. All 79
captions read in full — they are the page's strongest asset, citing routes,
tRPC procedures, services, components and role gates. A reactions sweep ran
over **every** frame with carriers = `[frame, ...descendants]` (6–299 carriers
per frame); all 82 have outbound reactions and every destination stays inside
the page. A pairwise overlap test ran over all 82 frames (3,321 pairs) and
returned exactly 2 collisions.

**Screenshotted (16 of 82 screens).** `988:3` Home · `991:203` Site · Overview ·
`993:360` Settings directory · `1008:3292` Settings · Team · `997:1923` Sites
list · `1000:2352` Sites · denied · `998:1456` Agency · Clients · `994:639`
Publish · pre-flight · `1016:5192` Auth · sign-in · `1025:5734` Onboarding · AI
1 basics · `1024:5519` Templates browse (full-width) · `1035:6347` Home · 375 ·
`1731:6357` Site · Access · `1006:3128` Site · Sharing · `1032:6275`
Maintenance · `1021:5206` Share · preview. Chosen as one per archetype plus
both halves of the duplicate pair in `D-L-04`/`D-L-09`.

**NOT checked — 66 of 82 screens were never rendered.** Named, sized, captioned
and reaction-swept, but not looked at. In particular: 12 of the 16 Settings
sub-pages (only Team was rendered; `1008:3466` Billing, `1010:3519` Workspace,
`1010:3689` Security, `1010:3866` Usage, `1010:4035` Plans, `1013:4343`
Notifications, `1013:4506` Domains, `1013:4661` Integrations, `1013:4809` API
tokens, `1014:4767` AI & credits, `1014:4926` Account, `1014:5091` Profile,
`1014:5231` Delete workspace, `1032:6136` Vercel team picker were not); 7 of the
8 Site tabs (`1005:2348` Traffic, `1005:2613` Domains, `1005:2865` SEO,
`1005:3111` Submissions, `1006:2888` Redirects, `1006:3366` Settings, and the
Overview at `991:203` was rendered); 5 of 6 Agency screens (`998:1635` Reviews,
`998:1804` Shared theme, `1012:3947` Handover, `1012:4132` Library, `1012:4322`
Partner, `1031:6049` client detail); 3 of 4 Publish (`994:738`, `994:836`,
`994:922`); 7 of 8 Auth; 8 of 10 Onboarding; and `1023:5205` Media, `1023:5391`
Activity, `1023:5568` Notifications, `1024:5619` Marketplace, `1024:5715`
Learn, `1024:5794` Resources, `1024:5869` Help centre, `1031:5973` Template
detail, `1031:6220` Help article, `1028:5734` Getting started, `1031:5840` Sites
new, `1000:1855`/`1000:2016`/`1000:2183` Sites states, `1731:6535`/`1731:6731`
Access states, `1020:5205` Share password gate, `1020:5219` Review sign-off,
`1020:5244` Transfer, `1020:5262` Legal, `1035:6242` Home 768, `1035:6434` Site
Overview 375. `D-L-11` (the Danger card) was read off the rendered `993:360`
directory; the sub-page `1014:5231` itself was not rendered, only its name.

**Also not checked.** Component masters. Styles and variables — same caveat as
the spine: no style or token value was fetched on this page. Billing screens
were confirmed to exist and were deliberately not audited (`D-L-22`), and the
four Publish boards were audited only for their container shape (`D-L-12`),
both per the standing out-of-scope decision on payments and deploy.

**Absence claims.** The six auth routes in `D-L-16` and the eleven spine-only
jobs in `D-L-03` were checked against **all eleven pages** of
`g4GzQFqzNYz5sosz1QtZXC` by name sweep, so those may say "anywhere in the file".
The sweep walked page children and SECTION children; a board nested inside
another FRAME would have been missed.

## Portfolio (page 1:5) — coverage

Agent K. File `g4GzQFqzNYz5sosz1QtZXC`, page `1:5` 🏢 Portfolio — never audited
before this wave.

### Screens in the module

**33 FRAMEs** (plus 37 caption/label TEXT nodes, audited as furniture, not as
screens). The page's own group labels split them: Sites 8 · Components 1 ·
Brand Kits 10 · Handover 4 · Other 10.

- **Portfolio Sites (8)** — `177:42` grid, `177:150` filtered, `177:229` sorted,
  `177:337` empty, `177:381` one-site, `177:433` loading, `177:503`
  thumb-missing, `448:3998` load-error.
- **BrandPush (10)** — `178:2` pick, `178:137` empty-selection, `178:266` diff,
  `178:397` no-changes, `178:512` blast-radius, `179:2` confirming, `179:145`
  pushing, `179:285` partial-failure, `179:427` done, `179:569` undone.
- **Handover (4)** — `181:2` list, `181:142` expanded-row, `181:290` all-clear,
  `181:400` empty.
- **SharedLibrary (5)** — `182:2` grid, `182:156` empty, `182:274`
  in-use-blocked-delete, `182:443` renaming, `182:596` loading.
- **Agency (4)** — `853:7371` Clients, `869:7010` Clients · empty, `853:7399`
  Reviews, `853:7427` Partner.
- **Shell / handoff (2)** — `22:57` Portfolio shell, `850:6789` Handoff →
  Editor (Components · library).

### What was actually done

- **Fetched: 33 of 33 frames.** Full recursive TEXT dump with frame-relative
  coordinates for every frame; full reactions sweep over
  `[frame, ...descendants]` for all 33 (74 edges recorded, destinations resolved
  to node names).
- **Screenshotted: 33 of 33** via `scripts/baseline/figma-shot.mjs`, every file
  verified a complete PNG (header + `IEND`).
- **Viewed by eye: 15 of 33** — `22:57`, `177:42`, `177:150`, `177:337`,
  `177:433`, `177:503`, `178:512`, `179:2`, `179:145`, `179:427`, `181:142`,
  `182:2`, `182:274`, `853:7427`, `869:7010`.
- **Not viewed by eye (18):** `177:229`, `177:381`, `448:3998`, `178:2`,
  `178:137`, `178:266`, `178:397`, `179:285`, `179:569`, `181:2`, `181:290`,
  `181:400`, `182:156`, `182:443`, `182:596`, `850:6789`, `853:7371`,
  `853:7399`. All 18 were text-dumped and reaction-swept; findings that touch
  them rest on text, geometry and their viewed siblings, not on their own image.
- **Geometry / visibility probe** (absolute-transform, per-descendant) on
  `869:7010`, `853:7371`, `853:7399`, `853:7427`, `177:42`, `181:142`. This is
  what showed the misaligned Agency card (`D-K-17`) — and what stopped a false
  finding: the three client rows on `869:7010` are `visible: false`, so the
  board named "empty" is genuinely empty even though the TEXT dump lists them.
- **Cross-page (read-only, for the duplication claim in `D-K-01`/`D-K-02`):**
  descendant and TEXT-node counts plus leading copy for `998:1456`,
  `1012:4322`, `1031:6049`, `1024:5519` on page `988:2`; a file-wide frame-name
  scan across all eleven pages for `brand kit | template | member | billing |
  partner | client | portfolio`.
- **Code grounded against:** `server/trpc/routers/{theme,sites,clients,reviews,
  handover,site-component}.ts`, `server/services/{theme,handover,
  site-component,publish,sites}.service.ts`, `packages/shared/schemas/
  {theme,sites}.ts`, `prisma/schema.prisma` (Site, Workspace, WorkspacePreset,
  SiteThemeSnapshot, SiteComponent, WorkspaceTransfer),
  `packages/dashboard/app/dashboard/agency/(tabs)/{layout,partner/page}.tsx`,
  `packages/dashboard/components/dashboard/shell/agency-tabs.tsx`,
  `packages/dashboard/components/sites/{site-filters,site-status}.ts(x)`.

### Findings

35 rows in `findings/K.jsonl` — **6 Critical, 20 Major, 8 Minor, 1 Polish**.
By question: Q1 5 · Q2 2 · Q3 7 · Q4 11 · Q5 10.

### Not verified

- **Nothing was run in a browser.** No `/dashboard/projects` or
  `/dashboard/agency` page was opened; every code claim is read from source.
  The `agency_layer` feature flag gates the whole agency surface and its live
  state was not checked.
- **Contrast was not measured.** `D-K-34`'s "low-contrast" reading of the
  SharedLibrary helper copy is from the render by eye, not a computed ratio.
- **Figma component masters were not opened.** The `Nav item` instances
  (`215:700`–`215:714` and their copies on the Agency boards) were read as
  instances with overrides; the master was not inspected, so the two dead rows
  in `D-K-04` are dead at the instance level — a master-level reaction was not
  ruled out.
- **`850:6789`'s claim that "cross-page navigation [is] not supported by Figma
  prototypes" was not tested.** The frame carries its own explanation and is
  not filed as a defect, but if the claim is stale the stand-in frame is
  unnecessary and the Handover → editor gap in `D-K-06` becomes wirable
  directly.
- **The `988:2` boards were counted, not audited.** `D-K-02` rests on
  descendant/TEXT-node counts and leading copy, not on a screen-by-screen
  comparison; page `988:2` belongs to another agent's scope.
- **`177:229`, `178:266`, `179:285`, `179:569`, `182:443` were not eyeballed**,
  so no craft finding is filed against the sorted grid, the token diff rows, the
  partial-failure layout, the undone panel, or the rename field's action row.
- **No absence claim here extends past page `1:5`** except where a file-wide
  frame-name scan is cited.

## Site (page 1:4) — coverage

Wave J. Page set explicitly to `1:4` (113 children). **Not** `1:3`.

### The question this page was assigned

**Are the Site page's Domains/Export boards the same job as the editor's
Settings Domains/Export, or two different surfaces?** Answer: **the same job,
drawn twice — and the brief's size premise was wrong in both directions.**

- The S7 Settings boards on `1:3` are **also 1440×900**, not drawer-width
  (`639:3092` Domains, `639:2754` Export, all 45 in section `1776:8387`).
- The shipping editor Settings surface is **also full-page**, not a drawer:
  `packages/editor/src/editor/rail/tabsConfig.ts:199` sets `mode: "fullpage"`
  with the comment "graduated from a 320px drawer to a full-page surface …
  the drawer path is retired". At 1440 it renders ~1380px wide.
- So the two treatments differ **only in chrome and IA**, not in size. `1:3`
  draws the editor shell (Topbar, 60px rail, 140px settings nav, footer);
  `1:4` draws a standalone admin app (56px header with "‹ Back to editor",
  240px nav, content max 720).

**Which one the product ships:** `1:3`. Board `1688:7195` is named
"S7 · Settings · root — NEW 2026-09-02 (from SettingsTab.tsx:75-92 NAV)" and
its 13 rows and 3 groups match `SettingsTab.tsx:74-90` exactly. Page `1:4`'s
14 rows and 4 groups (SITE / DISTRIBUTION / DATA / SHIP) match **neither** the
editor NAV nor the dashboard's `SITE_DETAIL_TABS`
(`packages/dashboard/components/site-detail/tab-nav.tsx:7-16`, 8 tabs). `1:4`
still carries Publish history, which the code explicitly retired from Settings
(`SettingsTab.tsx:721-727`), and omits Branding, which the code ships.

**Recommendation: consolidate onto `1776:8387`** and mark the `1:4` boards
SUPERSEDED (rename, never delete). Port over the four things `1:4` has that S7
lacks: the Export state machine, the Integrations catalogue rows, the Webhooks
delivery detail, and the Forms filtered/exported states.

Note the duplication is real in **code** too, for Domains only: it ships as an
editor Settings screen (`DomainsScreen.tsx`) *and* a dashboard tab
(`app/dashboard/sites/[id]/domains/`), both hitting the same tRPC procedures,
plus a read-only workspace monitor. Export ships **once**, and as a modal
(`StudioModals.tsx:166`), not as a screen — so both Figma treatments are wrong
about Export's form.

### Inventory

113 top-level children: **47 FRAMEs (screens)** + 66 TEXT nodes (31
`caption/…` chips, 15 descriptive `S6.*` captions, 20 section headers/counts).
The 10 section headers account for all 47 frames exactly.

| Family | Frames |
|---|---|
| Site shell | `22:2` |
| General | `288:1230` saved, `392:1077` editing-dirty |
| SEO | `284:830` |
| Analytics & Custom code | `288:845`, `288:900` (locked-Pro only) |
| Domains | `173:2` none, `173:63` adding, `173:126` pending-dns, `448:3940` checking, `173:316` ssl-provisioning, `173:193` verified, `173:255` failed |
| Redirects / Headers / Localization | `288:955`, `288:1010`, `288:1065` |
| Export | `174:2` idle, `174:90` format-selected, `174:179` previewing, `174:276` generating, `174:366` done, `174:456` failed, `174:546` ai-site-warning, `174:638` empty |
| Integrations | `175:2` none-configured, `175:88` some, `175:180` attention, `175:276` pro-locked, `175:370` loading |
| Integrations · GA | `176:2`, `176:67`, `176:130`, `176:195`, `176:260`, `176:325`, `176:390` |
| Webhooks | `176:456`, `176:521`, `176:586`, `176:656`, `176:727` |
| Forms | `288:1120` inbox, `316:965` empty, `316:1020` submission-detail, `316:1075` filtered, `316:1130` exported |
| Publish history | `288:1175` |

### What was actually done

- **Fetched: 47 of 47 frames.** Full recursive TEXT dump of every frame (nav
  collapsed to a single row, since it is byte-identical on all 47).
- **Reactions: 47 of 47**, swept over `[frame, ...descendants]` in four
  batches. 112 reactions total; every frame carries at least one and every
  frame is a destination, so **zero orphans** — but most inbound edges come
  from `hotspot/state` / `hotspot/back` scaffolding chips parked outside the
  artboards, not from product affordances (`D-J-15`).
- **Geometry probe: 47 of 47** — Header / Body / Nav / Content / column width
  and offset. This is what found the short-shell defect (`D-J-17`).
- **Nav selected-state fill probe: 47 of 47** — found 32 boards with no
  selected row (`D-J-13`).
- **Caption overlap: exact box intersection of all 66 TEXT nodes against all
  47 frames**, with z-order — 24 collisions, 21 in front (`D-J-16`).
- **Screenshotted: 21 of 47** via `scripts/baseline/figma-shot.mjs`, all
  verified complete PNGs. **Viewed by eye: 14 of 47** — `22:2`, `173:126`,
  `173:193`, `174:2`, `174:179`, `174:546`, `175:180`, `175:370`, `284:830`,
  `288:900`, `288:1120`, `288:1175`, `316:1075`, `392:1077`.
- **Cross-page:** section `1776:8387` on `1:3` enumerated (45 frames);
  `1688:7195` (S7 root), `639:3092` (S7 Domains) and `639:2754` (S7 Export)
  dumped to depth 3-5 for the duplication comparison.
- **Code grounded against:** `packages/editor/src/editor/sidebar/tabs/settings/`
  (`SettingsTab.tsx`, `constants.ts`, `screens/DomainsScreen.tsx`,
  `screens/AnalyticsScreen.tsx`, `screens/IntegrationsHub.tsx`,
  `screens/IntegrationsScreen.tsx`, `screens/RedirectsScreen.tsx`,
  `screens/HeadersScreen.tsx`, `screens/LocalizationScreen.tsx`,
  `screens/FormsScreen.tsx`, `screens/WebhooksScreen.tsx`),
  `editor/rail/tabsConfig.ts`, `editor/export/ExportOptions.tsx`,
  `editor/export/ExportModal.tsx`, `engine/export/ExportEngine.ts`,
  `editor/chrome-ui/buttonTheme.ts`, `packages/dashboard/components/site-detail/tab-nav.tsx`,
  `packages/dashboard/app/dashboard/sites/[id]/*`, `server/trpc/routers/site-detail.ts`,
  `server/services/domain.service.ts`, `server/services/redirect.service.ts`,
  `server/services/site-detail.service.ts`, `prisma/schema.prisma`.

### Findings

42 rows in `findings/J.jsonl` — **8 Critical, 24 Major, 10 Minor, 0 Polish**.

### Not checked / not verified

- **26 of 47 boards were never screenshotted**, and **33 of 47 were never
  viewed by eye.** Not screenshotted: `173:63`, `173:316`, `174:90`, `174:276`,
  `174:366`, `174:456`, `174:638`, `175:88`, `175:276`, `176:2`, `176:67`,
  `176:130`, `176:195`, `176:260`, `176:325`, `176:390`, `176:456`, `176:521`,
  `176:656`, `176:727`, `288:845`, `288:1010`, `288:1065`, `288:1230`,
  `316:965`, `316:1130`. Every one of them was text-dumped, reaction-swept and
  geometry-probed, so findings touching them rest on measured values and on a
  viewed sibling in the same family — never on an unviewed image.
- **Nothing was run in a browser.** Every code claim is read from source. The
  shipping Settings surface was not opened live, so the "~1380px full-page"
  figure is computed from `LayoutShell.css` grid values as reported, not
  measured with `getComputedStyle`.
- **No contrast ratios were computed** for this page. The colour findings
  (`D-J-12` disabled-blue, `D-J-28` amber collision) rest on the rendered
  screenshots and on cited token values, not on measured ratios.
- **Component masters were not opened.** The `Nav item` (`215:*`),
  `IntegrationRow` (`I258:*`) and field (`I327:*` / `I330:*`) instances were
  read as instances; their master definitions on `1:2` were not fetched, so
  `D-J-27` (missing integration logos) reports the absence of an image fill on
  the instances, not on the master.
- **`1:4` was compared only against `1:3`.** The remaining eight pages
  (`0:1`, `1:2`, `1:5`, `1:7`, `397:2`, `500:2`, `510:2`, `988:2`) were not
  searched, so no absence claim in `J.jsonl` extends past pages `1:4` and
  `1:3`. In particular, a site-level Members, Billing or traffic-reporting
  board may exist on `397:2` or `988:2`; `D-J-05` and `D-J-38` say only that
  none exists on `1:4`.
- **The three mis-wired back links** (`D-J-14`) were read from `reactions`;
  I did not run the Figma prototype to confirm they behave as wired.

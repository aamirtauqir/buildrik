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
**5 screenshotted:** 148:2, 149:7, 149:50, 775:4241, 1170:4749.

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
**4 screenshotted:** 140:2, 141:78, 141:207, 1717:17217.

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
**5 screenshotted:** 142:2, 143:60, 143:119, 143:355, 775:4130, 1171:4829 (6).

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
**3 screenshotted:** 170:2, 170:29, 171:67, 171:36 (4).

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

**Wave F total: 60 of 60 frames fetched, 19 screenshotted, 38 findings
(2 Critical · 25 Major · 10 Minor · 1 Polish).** Screenshots were taken two
ways and both produced complete PNGs: `node.screenshot()` via the committed
JSON-RPC client returns an inline *image* content block (13 boards, all
IEND-verified), and `scripts/baseline/figma-shot.mjs` downloads the hosted URL
(6 boards, `complete=true`). The failure mode that cost wave E its screenshots —
`exportAsync` + `base64Encode`, which returns *text* and is truncated at ~20KB —
was hit once here and abandoned; it is the encoding, not the export, that fails.

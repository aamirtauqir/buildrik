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
**0 screenshotted** — see the note under Command palette.

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

## Publish — coverage

Agent E. Section `1776:8378`, **14 frames in module, 14 fetched** (same depth).
**0 screenshotted.**

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

## Preview — coverage

Agent E. Section `1779:4`, **6 frames in module, 6 fetched.** **0 screenshotted.**

Fetched: 817:4774, 817:4856, 817:4899, 817:4950, 879:6901, 1157:4593.

All six self-declare `[not-implemented]` or `[design-ahead]` in their names.
817:4774 is additionally named `superseded by 988:2` and was read, not re-filed,
per the brief. Code read: `editor/shell/PreviewOverlay.tsx`,
`editor/canvas/DeviceFramePreview.tsx`, `editor/shell/hooks/useEditorShortcuts.ts`.

Not checked: boards `65:211` and `807:8663`, which `PreviewOverlay.tsx` names as
the shipping preview's real boards. They are **outside this section** and belong
to other agents' modules — I read the reference in code but did not fetch either
node, so I cannot say what they draw.

Q1 verdicts: 2 KEEP · 3 MERGE-INTO(817:4950) · 1 CUT-and-re-file (817:4856 is a
prose spec, not a screen).

## Command palette — coverage

Agent E. Section `1779:3`, **7 frames in module, 7 fetched.** **0 screenshotted.**

Fetched: 166:2, 166:18, 166:27, 166:45, 166:51, 166:58, 1177:4804.

**Screenshots failed for the whole wave and none were used.** `node.exportAsync`
+ `figma.base64Encode` returned base64 that the ~20KB transport truncated: the
three PNGs written (162:2, 166:2, 1177:4804) have valid headers and correct
dimensions but incomplete pixel data, and would not render. Craft findings in
`E.jsonl` therefore rest on fetched geometry (frame width/height, x/y), fetched
text, and source — never on looking at a rendered board. Anything that needs the
eye is unverified.

The pre-assigned premise for this module was checked against source and does not
hold — see `D-E-22`. `shell/modals/CommandPalette.tsx` opens on **⌘K**
(StudioHeader.tsx:250), not ⌘⇧P, and is built to the CmdK boards; ⌘⇧P opens
`canvas/controls/CommandPalette` (useCanvasCommandPalette.ts:50). Code read:
all four palette components, `StudioHeader.tsx`, `PagesTab.tsx`,
`useEditorShortcuts.ts`, `Canvas.tsx`.

Q1 verdicts: 6 KEEP · 1 MERGE-INTO(166:27) · 0 CUT. The merge recommendation
across the two palettes is `D-E-24`; no Figma node was changed.

**Wave E total: 48 of 48 frames fetched, 0 screenshotted, 28 findings.**

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

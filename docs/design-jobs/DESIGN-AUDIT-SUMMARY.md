# Design audit — consolidated findings

**262 findings** across 6 module waves plus cross-module work. Every row carries a node id (or `—` for a missing-job row) and fetched evidence; rows without evidence were rejected before this file was built.

| Severity | Count |
|---|---|
| Critical | 29 |
| Major | 146 |
| Minor | 79 |
| Polish | 8 |

Findings by question — Q1 is the mental-model test, asked first for every screen:

| Question | Count |
|---|---|
| Q1 | 66 |
| Q2 | 11 |
| Q3 | 32 |
| Q4 | 108 |
| Q5 | 45 |

## Q1 — does the screen deserve to exist?

**Read this table, not the finding counts.** A Q1 *finding* is only filed when a
screen has a problem, so counting verdicts among findings understates KEEP by an
order of magnitude. These are the verdicts the waves reported across **every
screen they walked**, not just the ones that produced findings:

| Wave | Screens | KEEP | MERGE-INTO | CUT | UNSURE | pre-labelled |
|---|---|---|---|---|---|---|
| A — Media, Insert | 55 | 44 | 3 | 0 | 4 | 4 |
| B — Brand, Inspector, Canvas, Ecommerce | 49 | 32 | 6 | 1 | 6 | 4 |
| D — Review, sign-off, Compare, Notifications | 47 | 40 | 5 | 0 | 0 | 2 |
| E — History, Publish, Preview, Cmd palette | 48 | 37 | 8 | 1 | 1 | 1 |
| F — Content, Pages, Layers, AI | 60 | 57 | 3 | 0 | 0 | 0 |
| **Total** | **259** | **210** | **25** | **2** | **11** | **11** |

(Wave C reported 14 Q1 findings across its 62 screens but no full verdict tally,
so its screens are excluded from this table rather than guessed at. Journeys, 74
screens, was still running when this was built.)

**The result is the most useful thing in this audit.** Only **2 screens out of
259** were judged CUT. The file's problem is emphatically *not* screens that
should not exist — it is:

- **25 screens that should merge** into another (the same state drawn twice),
- screens filed in the wrong module (ten `Inspector · <state>` boards sat in
  `📄 Reference`; the section named `Canvas` holds zero canvas screens),
- and screens that draw a model the code has already rejected (39 of 45 Settings
  boards draw the master-detail layout their own founder-locked note forbids).

A designer arriving at this file does not need to delete work. They need to
de-duplicate it, re-file it, and reconcile it with what shipped.

## Critical — 29 findings

| id | module | screen | finding |
|---|---|---|---|
| `D-X-01` | (cross-module) | rail wiring across the whole file | The product's primary navigation — the six-tool rail — is prototyped on Settings boards and almost nowhere else. 39 of 45 Settings frames carry rail-wired hotspots; the rest of the file is M |
| `D-X-04` | (missing) | Components — no module exists | The editor ships a Components authoring surface with its own DETAIL screen, and the Figma file has no Components module at all. 27 sections, none of them Components. |
| `D-X-09` | AI | AI · idle | CONFIRMED at the call site (agent F's D-F-31): the copy 'Apply lands as one undo step' is true of the single-message path and FALSE of the multi-step agent run. useAgentRunner.ts:275-287 cal |
| `D-F-31` | AI | AI . idle | The panel makes a safety promise about undo that is true of one of its two paths, printed directly above the control that starts the other one. |
| `D-B-01` | Brand | Brand · pro-locked | The board attaches a paid-plan paywall to a free display preference: its copy says "Basic mode hides what you cannot edit yet. Switch to Pro to unlock" and its only hotspot (1175:4864) goes  |
| `D-B-06` | Brand | Modal · Brand · AI prompt · success | The success state of "Generate component with AI" offers no way to accept the result — the user cannot finish the job the modal exists for. |
| `D-D-01` | Client sign-off | Client sign-off · A · viewing | The one screen where the external client actually decides is not designed: the centre of the board is a white rectangle containing the literal string "(the site, page tabs, and Your notes)". |
| `D-D-03` | Client sign-off | approve / request-changes confirm moda | The single irreversible action in the whole agency product — closing a review round — has a purpose-built confirm modal in code with THREE copy variants and its own error state, and zero boa |
| `D-E-22` | Command palette | CmdK · empty / typing / results / no-r | The premise on these six board names is backwards: ⌘K is not unavailable and these are not an alternative design — they are the boards the shipping shell palette was built from, and ⌘⇧P belo |
| `D-E-23` | Command palette | CmdK — chord ownership | Two unguarded ⌘K listeners are registered at once, so with the Pages tab open the chord opens the shell palette and the page finder together. |
| `D-F-09` | Content | Collections cannot be deleted | A user can create a collection and has no way to remove it. The delete exists at every layer except the one the user can reach. |
| `D-E-01` | History | History · Published (tab) | The footer promises "Every publish is restorable" on the one surface a user consults before rolling back; the product retains only the newest 20 publish payloads and nulls the rest. |
| `D-A-01` | Insert | Insert · blocks-expanded | Two Insert boards draw a five-group panel (ELEMENTS · BLOCKS · COMPONENTS · TEMPLATES · MINE) that the module's own entry board and the shipping code both reject — TEMPLATES does not exist i |
| `D-A-22` | Media | Media · no-results | The no-results board simultaneously tells the user their search matched nothing and that the library could not be reached, and the red banner physically overlaps the folder row beneath it. |
| `D-A-23` | Media | Media · quota-full | The board that declares upload switched off draws the Upload button unchanged, overlaps its own two banner lines, and clips the footer at the frame edge. |
| `D-A-29` | Media | Media · fullpage · empty | The empty-library board contradicts itself: the toolbar reports 24 files and a recent upload while every count on the screen reads 0 and the body says there are none. |
| `D-D-19` | Notifications | Notifications · unread | Three of the four notification rows drawn in this module are event types the product cannot emit. The panel's own empty state says 'Client replies and publish results land here' — only publi |
| `D-X-08` | Preview | Preview · audit report | INDEPENDENTLY CONFIRMED (agent E's D-E-29). The four headline scores on the Preview audit report are painted in the exact hex of the ellipse directly behind them — 91/95/88 are #0e9f6e on a  |
| `D-E-18` | Preview | Preview — whole section | The Preview section contains no board for the preview the product actually ships: all six frames are self-declared not-implemented or design-ahead, while the real preview mode — bound to a c |
| `D-E-29` | Preview | [design-ahead] Preview · performance a | Every headline number on the audit report is invisible — the four scores are painted in the exact hex of the disc behind them, and the four savings badges are near-identical green-on-green. |
| `D-E-38` | Preview | S3.8 · preview-responsive · mobile-dev | The board PreviewOverlay.tsx names as its responsive spec draws a 375px phone bezel as a transparent outline floating over a desktop-width page — the content is neither resized nor clipped t |
| `D-E-12` | Publish | Publish · panel (+ publishing / live / | Every Publish board lists a second environment, "Preview · brk-preview.vercel.app", that does not exist — a Buildrik-branded host from the retired hosted model — and the design has already d |
| `D-E-14` | Publish | Publish · unpublish confirm — MISSING | Taking a live site down is fully built, hosts its confirm inside the Publish panel, and has no board anywhere in the 14 — the most destructive action in the module is the one with no design. |
| `D-D-10` | Review | Review panel · open (and 10 siblings) | The Review panel's Compare button reaches a loading state and an error state and never a result. The success branch — a side-by-side diff rendered inside a 280px panel — has no board anywher |
| `D-D-18` | Review | review reminder / expiry warning | Nothing chases a silent client, and nobody is told when a link is about to die. A solo agency can send a review and receive no signal of any kind, ever — because the one email that would tel |
| `D-C-01` | Settings | S7 · Settings · root vs the 39 detail/ | The module draws two incompatible navigation models for the same 13 items: a full-width two-column card grid with no rail (root), and a persistent 140px left nav + 1240px pane with the rail  |
| `D-C-02` | Settings | S7.0 · navigation-model · drill-in (RE | The module's own founder-locked note states 'One column, drawer width — never a two-pane master-detail', and 39 boards draw exactly the two-pane master-detail it forbids. The note is marked  |
| `D-C-31` | Shell | the save pill on all 12 full-shell She | The shell's single most important status indicator reads 'Saved 2m ago' on every board — including Loading, Offline, AI agent run, First run, and the board literally named 'Saving → conflict |
| `D-C-46` | Shell | Shell state 10 · Offline | The Offline board does not draw being offline. Side by side with the default state it is the same screen: green 'Saved 2m ago', no banner, no offline pill, no changed Publish treatment, no t |

## Missing jobs — 45 Q5 findings

| id | module | job | evidence |
|---|---|---|---|
| `D-X-07` | (checked, no gap) | Forms | grep for FormSection / form-element / FormFieldInspector across editor/inspector and editor/sidebar returns nothing. Forms are a d |
| `D-D-28` | (cross-module) | reviewer reassignment / reopening a clos | No match for reassign\|changeReviewer\|transferReview in server/; reviewerId is written only by the client's own identifyReviewer  |
| `D-X-04` | (missing) | Components — no module exists | packages/editor/src/editor/sidebar/tabs/ComponentsTab.tsx plus sidebar/tabs/component-library/ (9 files incl. ComponentDetailScree |
| `D-X-05` | (missing) | Templates — no product module exists | packages/editor/src/editor/sidebar/tabs/templates/ — 14 files incl. TemplatePreviewModal.tsx, ApplyProgressOverlay.tsx, ApplyProgr |
| `D-X-06` | (missing) | Canvas comments — no module | editor/canvas/comments/CommentLayer.tsx; the entry point is the plain 'C' key (useEditorShortcuts.ts:106) plus a StudioHeader cont |
| `D-F-36` | AI | No board shows a second turn | ChatThread.tsx maps a messages array into ChatMessage components and scrolls on change (:23, :35-36); DiffRows.tsx renders per-mes |
| `D-F-38` | AI | REFUTED (findings/VERDICTS.jsonl:199) | ai.summarize DOES have an editor caller — editor/panels/version-history/useAISummary.ts:109 fetches "/api/trpc/ai.summarize" directly, which a grep for the typed-client property misses. The version-diff summary is retired on PLACEMENT grounds (AI-PLACEMENT-MAP.md §2, drawn on board 2846:21575), never because it is doorless. ai.milestoneSuggest reaches HistoryTab vi |
| `D-B-05` | Brand | Brand · presets · detail | StylesRouter.tsx View type = {kind:"list"} \| {kind:"detail", category, variant}; PresetDetailPane.tsx renders a category+variant  |
| `D-B-13` | Brand | Brand · token-detail · colour picker | ColorPicker.tsx (design-system/ui/colors/) is rendered inline from TokenDetailView.tsx:386 under the value row ("ColorPicker open  |
| `D-B-20` | Canvas | Canvas · selection toolbar | UnifiedSelectionToolbar.tsx ("Compact toolbar at top of selected element") is rendered from canvas/overlays/CanvasOverlayGroup.tsx |
| `D-B-21` | Canvas | Canvas · block picker (swap element) | canvas/controls/BlockPickerModal.tsx ("Block picker modal for UnifiedSelectionToolbar") is opened from UnifiedSelectionToolbar.tsx |
| `D-B-22` | Canvas | Canvas · blank page | 57:2 carries "Start with a template, or drop your first section. ¦ Browse templates ¦ Start blank ¦ Canvas (blank page)", which ma |
| `D-D-03` | Client sign-off | approve / request-changes confirm modal | review-client.tsx:375-463. Variants: approve ('This tells your designer the design is settled and they can put it live'), request- |
| `D-D-09` | Client sign-off | client-side compare / what changed | review-client.tsx:309-314 renders the changeSummary block ('What's new') when `data.changeSummary` is present; submitReviewInput c |
| `D-E-27` | Command palette | Pages · go-to-page finder — MISSING | packages/editor/src/editor/sidebar/tabs/pages/components/PageCommandPalette.tsx, imported at PagesTab.tsx:18 and opened by the ⌘K  |
| `D-D-26` | Compare | Compare · restore-confirm | 169:60 name: 'Compare · restore-confirm — RETIRED 2026-09-02 (no producer)'. Its copy is complete and correct: 'Restore v3 and los |
| `D-F-04` | Content | Content . collection -> (missing) dynami | 149:50's 'Dynamic pages >' row sits at y786 and carries no reaction; the frame's four reactions go to record, collection-setup, un |
| `D-F-09` | Content | Collections cannot be deleted | server/trpc/routers/cms.ts:69 exposes collections.delete; services/cmsSync.ts:197 calls it; engine/cms/CollectionManager.ts:154 an |
| `D-E-10` | History | History · Saves / Published — row overfl | "⋯" appears on 4 rows each in 162:2, 163:113, 163:167, 163:220, 163:269 and 949:4474, and on the Backups rows in 950:4474. No boar |
| `D-A-14` | Insert | Insert · transition callout | TransitionCallout.tsx renders 'Quick Picks removed. Browse and drag elements directly from categories below.' at BuildTab.tsx:212  |
| `D-A-15` | Insert | Insert · Paste HTML failure states | BuildTab.tsx:92-104 — clipboard unreadable ('allow clipboard access and try again', warning), clipboard empty ('copy some HTML fir |
| `D-A-16` | Insert | Insert · tips re-enable path | 138:244 'Insert · tip-dismissed' draws the panel without the strip. TipsFooter.tsx:126 sets title='Hide tips for this session — br |
| `D-B-16` | Inspector | Inspector · INTERACTIONS / VISIBILITY /  | Across the 17 Inspector boards read (32:2, 807:8342/8412/8475/8521/8567/8614, 824:5095, 1707:8456, 429:2350, 160:2, 160:208, 160:3 |
| `D-F-24` | Layers | Layers . dragging | The render of 143:60 shows a single blue insertion line between 'Button' and 'Gallery' (the text dump's 2px shift at y196->198) -  |
| `D-A-39` | Media | Media · drawer stock — empty / searching | The four state boards 1716:8453 (searching), 1716:8497 (no-results), 1738:8394 (search-failed) and 1716:8557 (quota-strip) are all |
| `D-A-53` | Media | Trash | 1159:4593, 1162:4617, 1163:13695 all draw '🗑 Trash' in the folder rail at y=826. FolderTree.tsx:420-421 renders the row; LibraryMa |
| `D-A-54` | Media | Folder rename / folder delete | FolderTree.tsx:147-154 renders a per-row delete control and :270 calls deleteFolder(folder.id); the new-folder path is boarded (12 |
| `D-A-55` | Media | Asset detail for video, font and SVG ass | AssetDetailsPanel.tsx:142-146 branches img/vid → <img>, ico → 64px <img>, fnt → its own preview; :195 shows alt text only for img; |
| `D-A-56` | Media | Drawer bulk move with folders present | 1717:17203 is the sole move-to-folder board and its caption reads 'folderTree is empty → the picker offers (Root) only'. SlimLaunc |
| `D-D-23` | Notifications | notification preferences | NotificationPref (prisma/schema.prisma:853-862): category, inApp Boolean, email String default 'instant', unique on (userId, categ |
| `D-F-14` | Pages | Page delete has no confirm board | PagesTab.tsx:122 opens a single-page delete confirm (setDeleteTargetId); :345-349 opens a bulk one that names every page and adds  |
| `D-E-18` | Preview | Preview — whole section | Section 1779:4 frame names: 817:4774 [not-implemented · superseded], 817:4856 [not-implemented], 817:4899 [not-implemented], 817:4 |
| `D-E-14` | Publish | Publish · unpublish confirm — MISSING | packages/editor/src/services/PublishService.ts:239 `unpublishSite`, documented at :234 as "flips the site to DRAFT (publish.servic |
| `D-E-15` | Publish | Publish · publishing | 784:4250 text ends at "Building · step 2 of 4 · started 14s ago … Publishing…" — no cancel control. usePublishJob.ts:97 declares ` |
| `D-D-15` | Review | Review panel · changes-requested / opene | REVIEW_PILL_STATES (packages/shared/schemas/reviews.ts:19-26) = none \| pending \| opened-not-acted \| changes-requested \| approv |
| `D-D-17` | Review | agency review queue | packages/dashboard/app/dashboard/agency/(tabs)/reviews/page.tsx renders <ReviewComments/> (components/reviews/review-comments.tsx) |
| `D-D-18` | Review | review reminder / expiry warning | No match for remind\|nudge\|remindedAt\|followUp anywhere in the review path; ReviewRequest (prisma/schema.prisma:509-554) has no  |
| `D-C-25` | Settings | S7 · Settings · SEO | 638:3070 INDEXING block: 'Allow search indexing' toggle + robots.txt textarea ('User-agent: * / Allow: / / Sitemap: …'). Code: Seo |
| `D-C-26` | Settings | S7 · Settings · Localization | 639:3795 table: 'LOCALE \| PATH \| PAGES TRANSLATED \| STATUS · English / 6 of 6 / LIVE · French /fr / 4 of 6 / PENDING · Arabic / |
| `D-C-27` | Settings | S7 · Settings · Analytics · CONSENT | 639:3443 CONSENT block with a 'Cookie Consent' toggle. Code: AnalyticsScreen.tsx:280-286 writes analytics.cookieConsent and it is  |
| `D-C-28` | Settings | site lifecycle jobs with no board and no | All exist as dashboard surfaces or procedures with zero editor callers: site password / touch icon / slug at packages/dashboard/co |
| `D-C-29` | Settings | S7 · Settings · Redirects | 640:2440 '404 SUGGESTER · Suggest redirects from 404s · /pizza-menu → /menu · Accept'; nav subtitle '301 / 302 + 404 suggester' (a |
| `D-C-30` | Settings | permission and failure states missing fr | Code: DomainsScreen.tsx:222,287 disables the connect and remove controls with a reason tooltip for insufficient role; :159 routes  |
| `D-C-44` | Shell | Site menu items with no board | SiteMenu.tsx lists ~24 items. 'Activity log' (:225, opens /dashboard/sites/<id>#activity-log) has no board anywhere on page 1:3 —  |
| `D-C-45` | Shell | shell responsiveness below 1440 | 202:2 'Shell · 1280 · pin auto-released (overlay) — RETIRED 2026-09-04' is the module's only non-1440 frame. Code: the single shel |

## By module

| module | findings |
|---|---|
| Media | 42 |
| Settings | 32 |
| Brand | 20 |
| Shell | 18 |
| History | 17 |
| Insert | 16 |
| Content | 11 |
| AI | 10 |
| Review | 10 |
| Layers | 10 |
| Client sign-off | 9 |
| Command palette | 9 |
| Pages | 9 |
| Inspector | 8 |
| Publish | 8 |
| Preview | 7 |
| Canvas | 5 |
| Ecommerce | 5 |
| Notifications | 5 |
| (cross-module) | 4 |
| (missing) | 3 |
| Compare | 3 |
| (checked, no gap) | 1 |

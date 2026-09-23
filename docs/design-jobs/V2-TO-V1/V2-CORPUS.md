# V2 CORPUS — Figma page `2668:2` "Editor v2 — Proposal"

File `g4GzQFqzNYz5sosz1QtZXC`. Read-only walk, 2026-09-07.

Ground truth for the V2 → V1 re-audit. Every board and TEXT node below was read
off the Figma file with `use_figma` and is reproduced **verbatim** — typos,
truncations, inconsistent counts and internal contradictions included. Those are
findings about the page, not defects in this file.

## COVERAGE — read this before using the file

**4 of 12 sections walked completely. 1 partially. 7 never reached.**

The walk was stopped by the Figma MCP **seat quota**, which was exhausted
account-wide by fifteen concurrent agents sharing one Professional seat. It is a
seat cap, not a rate limit: backoff does not clear it. Nothing below is inferred,
reconstructed, or copied from `scripts/figma/build-proposal-page.mjs` — that script
is the builder's *input*, and what the page renders is a different thing.

| # | section | node id | status | boards | TEXT read / on node |
|---|---------|---------|--------|--------|---------------------|
| 1 | UX Audit | `2797:2` | complete | 4 | 250 / 250 |
| 2 | Module Map | `2797:280` | complete | 1 | 28 / 28 |
| 3 | Cross-Module Flow Map | `2797:323` | complete | 1 | 17 / 17 |
| 4 | Missing Screens & States | `2797:342` | complete | 1 | 18 / 18 |
| 5 | AI Interaction Map | `2797:362` | **PARTIAL** | 1 | 10 / 21 |
| 6 | Navigation Structure | `2797:385` | **NEVER READ** | — | — |
| 7 | Design System | `2797:410` | **NEVER READ** | — | — |
| 8 | Component Library | `2797:491` | **NEVER READ** | — | — |
| 9 | Corrected Module Screens | `2797:559` | **NEVER READ** | — | — |
| 10 | Major User Flows | `2797:574` | **NEVER READ** | — | — |
| 11 | Panel / Drawer / Modal Rules | `2797:603` | **NEVER READ** | — | — |
| 12 | Final Polished Editor | `2797:569` | **NEVER READ** | — | — |

**Totals actually read: 8 boards, 323 TEXT nodes.**

### What a resume pass must still read

- `2797:362` — 5 · AI Interaction Map: TEXT nodes 10–20 of 21 (indices are the y-then-x sort order used here). Its 1 board(s) WERE read.
- `2797:385` — 6 · Navigation Structure: **nothing read**. Not its boards, not its text. Child count from the page read is in Appendix B.
- `2797:410` — 7 · Design System: **nothing read**. Not its boards, not its text. Child count from the page read is in Appendix B.
- `2797:491` — 8 · Component Library: **nothing read**. Not its boards, not its text. Child count from the page read is in Appendix B.
- `2797:559` — 9 · Corrected Module Screens: **nothing read**. Not its boards, not its text. Child count from the page read is in Appendix B.
- `2797:574` — 10 · Major User Flows: **nothing read**. Not its boards, not its text. Child count from the page read is in Appendix B.
- `2797:603` — 11 · Panel / Drawer / Modal Rules: **nothing read**. Not its boards, not its text. Child count from the page read is in Appendix B.
- `2797:569` — 12 · Final Polished Editor: **nothing read**. Not its boards, not its text. Child count from the page read is in Appendix B.
- The `characters` of the 168 loose page-level nodes in Appendix B. Only their ids, layer names, types and geometry were read.

### Conventions

- Sections appear in brief order (1–12), not canvas x-order (they differ — see Appendix B).
- Text entries are `` `node-id` `` ` @ (x,y) :: ` then the characters, **verbatim to end of line**.
  `x`/`y` are absolute canvas coordinates, rounded. Order is y then x.
- A string containing a newline is written in a `~~~` block, marked `<multiline>`.
- Board `name` is the Figma **layer name**; it is not necessarily rendered on screen.

---

## 1 · UX Audit — `2797:2`

Section node `2797:2` · SECTION · layer name `1 · UX Audit` · x=0 y=0 w=1500 h=3253
Boards: 4 · TEXT nodes: 250 (complete).

### Boards

| # | layer name | node id | type | x | y | w | h | TEXT nodes read |
|---|-----------|---------|------|---|---|---|---|-----------------|
| 1 | Audit — what was found | `2797:3` | FRAME | 40 | 40 | 1400 | 300 | 15 |
| 2 | Findings by module | `2797:19` | FRAME | 40 | 380 | 680 | 520 | 27 |
| 3 | Findings by kind | `2797:60` | FRAME | 760 | 380 | 680 | 520 | 22 |
| 4 | The 55 Criticals | `2797:93` | FRAME | 40 | 940 | 1400 | 2277 | 186 |

### Text

#### Board `2797:3` — Audit — what was found

- `2797:4` @ (72,68) :: UX Audit
- `2797:5` @ (72,112) :: Eight module lanes read the CODE, not the boards. Every finding carries a file:line someone opened. An independent QA lane then re-verified 48 of them and refuted 11 — including two of the coordinator's own claims.
- `2797:6` @ (72,190) :: 295
- `2797:8` @ (297,190) :: 283
- `2797:10` @ (522,190) :: 46
- `2797:12` @ (747,190) :: 171
- `2797:14` @ (972,190) :: 13
- `2797:16` @ (1197,190) :: 11
- `2797:7` @ (72,230) :: findings
- `2797:9` @ (297,230) :: distinct after de-duplication
- `2797:11` @ (522,230) :: Critical (refuted excluded)
- `2797:13` @ (747,230) :: Major
- `2797:15` @ (972,230) :: modules
- `2797:17` @ (1197,230) :: refuted by QA
- `2797:18` @ (72,280) :: Confidence as recorded carries no signal: 285 of 295 rows claim high confidence, and all 11 refuted claims sit in that group.

#### Board `2797:19` — Findings by module

- `2797:20` @ (64,400) :: By module
- `2797:21` @ (64,444) :: shell (rail / topbar / canvas)
- `2797:23` @ (680,444) :: 36
- `2797:24` @ (64,478) :: Pages & Routing
- `2797:26` @ (680,478) :: 33
- `2797:27` @ (64,512) :: insert-elements
- `2797:29` @ (680,512) :: 32
- `2797:30` @ (64,546) :: Publish, Export, Preview & SEO
- `2797:32` @ (680,546) :: 30
- `2797:33` @ (64,580) :: Content / CMS
- `2797:35` @ (680,580) :: 29
- `2797:36` @ (64,614) :: Inspector / right panel
- `2797:38` @ (680,614) :: 28
- `2797:39` @ (64,648) :: AI experience
- `2797:41` @ (680,648) :: 23
- `2797:42` @ (64,682) :: history-and-versions
- `2797:44` @ (680,682) :: 16
- `2797:45` @ (64,716) :: media
- `2797:47` @ (680,716) :: 13
- `2797:48` @ (64,750) :: review-and-collaboration
- `2797:50` @ (680,750) :: 13
- `2797:51` @ (64,784) :: layers
- `2797:53` @ (680,784) :: 12
- `2797:54` @ (64,818) :: settings
- `2797:56` @ (680,818) :: 12
- `2797:57` @ (64,852) :: brand
- `2797:59` @ (680,852) :: 7

#### Board `2797:60` — Findings by kind

- `2797:61` @ (784,400) :: By kind — what is actually wrong
- `2797:62` @ (784,428) :: Missing feedback is the single largest class. The product usually knows; it does not say.
- `2797:63` @ (784,468) :: missing-feedback
- `2797:65` @ (1400,468) :: 45
- `2797:66` @ (784,506) :: broken-flow
- `2797:68` @ (1400,506) :: 42
- `2797:69` @ (784,544) :: confusing-nav
- `2797:71` @ (1400,544) :: 33
- `2797:72` @ (784,582) :: missing-action
- `2797:74` @ (1400,582) :: 28
- `2797:75` @ (784,620) :: missing-state
- `2797:77` @ (1400,620) :: 28
- `2797:78` @ (784,658) :: duplicate-feature
- `2797:80` @ (1400,658) :: 27
- `2797:81` @ (784,696) :: dead-end
- `2797:83` @ (1400,696) :: 21
- `2797:84` @ (784,734) :: destructive-confirm
- `2797:86` @ (1400,734) :: 13
- `2797:87` @ (784,772) :: disabled-state
- `2797:89` @ (1400,772) :: 11
- `2797:90` @ (784,810) :: missing-screen
- `2797:92` @ (1400,810) :: 10

#### Board `2797:93` — The 55 Criticals

- `2797:94` @ (64,960) :: Every Critical, with its evidence
- `2797:95` @ (340,964) :: Ten findings a QA pass refuted or overstated are excluded — UX-B-01, B-05, C-04, C-25, E-01, E-04, E-13, F-07, I-17, I-30.
- `2797:96` @ (64,1000) :: UX-A-01
- `2797:97` @ (144,1000) :: insert-elements
- `2797:98` @ (330,1000) :: Dragging an element out of Insert can land nothing on the page and still report success. The drop dispatcher pre-reads every DataTra
- `2797:99` @ (1050,1000) :: useDropExecution.ts:183-195 (pre-snapshot + the comm
- `2797:100` @ (64,1048) :: UX-A-02
- `2797:101` @ (144,1048) :: insert-elements
- `2797:102` @ (330,1048) :: The canvas selection toolbar's + opens a picker that tells the user an element was added when nothing was. The picker's own click ha
- `2797:103` @ (1050,1048) :: useElementsState.ts:151-161 — trackSidebar then `add
- `2797:104` @ (64,1096) :: UX-A-05
- `2797:105` @ (144,1096) :: insert-elements
- `2797:106` @ (330,1096) :: BLOCKS is the one group in Insert drawn as a picture grid, and it has no pictures. The card renders `b.preview` when a block defines
- `2797:107` @ (1050,1096) :: GroupSection.tsx:234-262 — `{b.preview ? <img .../> 
- `2797:108` @ (64,1144) :: UX-B-02
- `2797:109` @ (144,1144) :: Pages & Routing
- `2797:110` @ (330,1144) :: There is no way to put a page into Draft. The visibility control offers Live / Hidden / Password only, while the panel's own status 
- `2797:111` @ (1050,1144) :: page-settings/AdvancedTab.tsx:24 renders exactly ['l
- `2797:112` @ (64,1192) :: UX-B-03
- `2797:113` @ (144,1192) :: Pages & Routing
- `2797:114` @ (330,1192) :: Opening page settings and changing one unrelated field silently publishes the page. The drawer reads any page that is not hidden or 
- `2797:115` @ (1050,1192) :: page-settings/usePageSettings.ts:103-104 (visibility
- `2797:116` @ (64,1240) :: UX-B-04
- `2797:117` @ (144,1240) :: Pages & Routing
- `2797:118` @ (330,1240) :: The delete confirmation never says what else breaks. Internal links are stored as a page id, and the exporter silently rewrites any 
- `2797:119` @ (1050,1240) :: PagesTab.tsx:329 confirm copy
- `2797:120` @ (64,1288) :: UX-B-10
- `2797:121` @ (144,1288) :: Pages & Routing
- `2797:122` @ (330,1288) :: Typing a slug that clashes with another page starts a toast that will not stop. The form autosaves half a second after any change; t
- `2797:123` @ (1050,1288) :: page-settings/PageSettingsDrawer.tsx:41-45 (autosave
- `2797:124` @ (64,1336) :: UX-B-13
- `2797:125` @ (144,1336) :: Pages & Routing
- `2797:126` @ (330,1336) :: '+ Add page' can create a second page with the same name AND the same URL as an existing one. The default name is 'Page {count+1}', 
- `2797:127` @ (1050,1336) :: shared/utils/pageUtils.ts:16-20 getDefaultPageName
- `2797:128` @ (64,1384) :: UX-B-32
- `2797:129` @ (144,1384) :: Pages & Routing
- `2797:130` @ (330,1384) :: Adding a page does not add it to the site's navigation, and the product offers no way to do it in bulk. The navbar is a static block
- `2797:131` @ (1050,1384) :: blocks/Sections/Navbar.tsx:17 the navbar block's con
- `2797:132` @ (64,1432) :: UX-C-01
- `2797:133` @ (144,1432) :: Content / CMS
- `2797:134` @ (330,1432) :: The founder's uncommitted work makes bindings survive a reload ONLY in the standalone/localStorage editor. In the SHIPPING editor (a
- `2797:135` @ (1050,1432) :: packages/shared/schemas/sites.ts:192-214 (editorSave
- `2797:136` @ (64,1480) :: UX-C-02
- `2797:137` @ (144,1480) :: Content / CMS
- `2797:138` @ (330,1480) :: A user can create collections from three different places and can never remove or rename one. The Content panel's collection rows ar
- `2797:139` @ (1050,1480) :: ContentViews.tsx:171-200 (RootView rows: ListRow + a
- `2797:140` @ (64,1528) :: UX-C-03
- `2797:141` @ (144,1528) :: Content / CMS
- `2797:142` @ (330,1528) :: The Conditions screen offers a complete-looking flow - pick an element on the canvas, write path/operator/value, Add condition - and
- `2797:143` @ (1050,1528) :: DataManager.ts:482-491 sets/removes data-condition-h
- `2797:144` @ (64,1576) :: UX-C-05
- `2797:145` @ (144,1576) :: Content / CMS
- `2797:146` @ (330,1576) :: The Published switch does not govern what ships. When an element is bound to a record, export resolves the binding by querying the c
- `2797:147` @ (1050,1576) :: CMSBindingManager.ts:120-123 resolveBinding calls qu
- `2797:148` @ (64,1624) :: UX-C-06
- `2797:149` @ (144,1624) :: Content / CMS
- `2797:150` @ (330,1624) :: The reason to build a CMS is that one design serves many rows, and that is the one thing no screen in the editor can do. Every bindi
- `2797:151` @ (1050,1624) :: CMSBindingManager.ts:208 bindCollection and DataMana
- `2797:152` @ (64,1672) :: UX-C-07
- `2797:153` @ (144,1672) :: Content / CMS
- `2797:154` @ (330,1672) :: There are two record editors and which one a user meets is an accident of which door they found. The Content panel gives a stacked f
- `2797:155` @ (1050,1672) :: Panel: ContentViews.tsx:379-397 (delete ConfirmDialo
- `2797:156` @ (64,1720) :: UX-C-08
- `2797:157` @ (144,1720) :: Content / CMS
- `2797:158` @ (330,1720) :: Creating a record with the Published switch on, when a required field is empty, leaves a hidden duplicate behind every time the user
- `2797:159` @ (1050,1720) :: useContentPanel.ts:161-168 (createContentItem then u
- `2797:160` @ (64,1768) :: UX-D-02
- `2797:161` @ (144,1768) :: Inspector / right panel
- `2797:162` @ (330,1768) :: The canvas refuses to select a locked element and toasts 'This element is locked. Unlock it in the Layers panel.' The Layers tree ha
- `2797:163` @ (1050,1768) :: useSelectionBehavior.ts:88,106,134 block the locked 
- `2797:164` @ (64,1816) :: UX-D-04
- `2797:165` @ (144,1816) :: Inspector / right panel
- `2797:166` @ (330,1816) :: The scope dropdown's own copy scopes the fan-out to the current page — 'no other buttons on this page', 'no other buttons here' — bu
- `2797:167` @ (1050,1816) :: ScopeDropdown.tsx:58-67 peers = composer.elements.ge
- `2797:168` @ (64,1864) :: UX-D-08
- `2797:169` @ (144,1864) :: Inspector / right panel
- `2797:170` @ (330,1864) :: These composite elements have no component-level editor. Every one of them falls through to the generic container profile, and the o
- `2797:171` @ (1050,1864) :: elementProfiles.ts:231-241 slider/accordion/navbar/t
- `2797:172` @ (64,1912) :: UX-D-09
- `2797:173` @ (144,1912) :: Inspector / right panel
- `2797:174` @ (330,1912) :: Selecting a form gives Action URL, Method, Encoding, Disable Validation and Autocomplete — five raw HTML attributes. There is no fie
- `2797:175` @ (1050,1912) :: sections/elementProperties/config.ts:210-240 is the 
- `2797:176` @ (64,1960) :: UX-D-14
- `2797:177` @ (144,1960) :: Inspector / right panel
- `2797:178` @ (330,1960) :: The panel has TWO animation systems, adjacent in every element profile, that do not acknowledge each other. 'Interactions' adds a tr
- `2797:179` @ (1050,1960) :: elementProfiles.ts (every profile) orders … effects,
- `2797:180` @ (64,2008) :: UX-E-02
- `2797:181` @ (144,2008) :: Publish, Export, Preview &
- `2797:182` @ (330,2008) :: The two publish surfaces on screen at the same time answer 'is there anything to publish?' from different data and print opposite an
- `2797:183` @ (1050,2008) :: StudioHeader.tsx:592-596 (`hasUnpublishedChanges = i
- `2797:184` @ (64,2056) :: UX-E-03
- `2797:185` @ (144,2056) :: Publish, Export, Preview &
- `2797:186` @ (330,2056) :: If a status poll fails — a dropped connection, a session timeout, a 500 — the editor stops polling and strands the user inside the i
- `2797:187` @ (1050,2056) :: usePublishJob.ts:155-170 (tick catch → setError + st
- `2797:188` @ (64,2104) :: UX-E-05
- `2797:189` @ (144,2104) :: Publish, Export, Preview &
- `2797:190` @ (330,2104) :: Every CMS-generated detail page ships the TEMPLATE page's identity. `generateDynamicPages` clones the template's HTML whole — head i
- `2797:191` @ (1050,2104) :: cms.service.ts:206-215 (seoTitle/seoDescription appe
- `2797:192` @ (64,2152) :: UX-E-17
- `2797:193` @ (144,2152) :: Publish, Export, Preview &
- `2797:194` @ (330,2152) :: Preview cannot show what a visitor gets, on the surface whose entire job is to show what a visitor gets. Three things stack up: the 
- `2797:195` @ (1050,2152) :: ExportUtils.ts:35-42 (`querySelectorAll('script,ifra
- `2797:196` @ (64,2200) :: UX-F-01
- `2797:197` @ (144,2200) :: shell (rail / topbar / can
- `2797:198` @ (330,2200) :: The rail shows six destinations - Insert, Layers, Pages, Media, Content, Brand - but the editor has twelve panel destinations. Templ
- `2797:199` @ (1050,2200) :: packages/editor/src/editor/rail/tabsConfig.ts:349-35
- `2797:200` @ (64,2248) :: UX-F-09
- `2797:201` @ (144,2248) :: shell (rail / topbar / can
- `2797:202` @ (330,2248) :: 'Quick preview' does not preview the site - it previews one page, with everything turned off. The overlay renders composer.exportHTM
- `2797:203` @ (1050,2248) :: packages/editor/src/editor/shell/AquibraStudio.tsx:1
- `2797:204` @ (64,2296) :: UX-F-30
- `2797:205` @ (144,2296) :: shell (rail / topbar / can
- `2797:206` @ (330,2296) :: 'Unpublish site...' does not open a confirmation. The row switches the left panel to the Publish tab and then, in the same tick, emi
- `2797:207` @ (1050,2296) :: packages/editor/src/editor/shell/StudioHeader.tsx:80
- `2797:208` @ (64,2344) :: UX-G-01
- `2797:209` @ (144,2344) :: AI experience
- `2797:210` @ (330,2344) :: The one state that explains why AI does nothing tells the user to fix something they cannot fix. The panel says 'No API key is set f
- `2797:211` @ (1050,2344) :: AITab.tsx:261-277 renders the copy and the button (w
- `2797:212` @ (64,2392) :: UX-G-02
- `2797:213` @ (144,2392) :: AI experience
- `2797:214` @ (330,2392) :: The same AI panel opens in two different columns depending on which door you use, with two different headers, two different exits, a
- `2797:215` @ (1050,2392) :: StudioPanels.tsx:290-302 — `ui:switch-tab {tab:'ai'}
- `2797:216` @ (64,2440) :: UX-G-07
- `2797:217` @ (144,2440) :: AI experience
- `2797:218` @ (330,2440) :: The button is live in production while the thing behind it is switched off, and the failure it produces is a developer sentence. The
- `2797:219` @ (1050,2440) :: ComponentsSection.tsx:166-176 renders the button, di
- `2797:220` @ (64,2488) :: UX-G-09
- `2797:221` @ (144,2488) :: AI experience
- `2797:222` @ (330,2488) :: Both History AI features very likely never reach the model. They post a bare JSON body to the tRPC HTTP endpoint, and that router is
- `2797:223` @ (1050,2488) :: useAISummary.ts:109-116 — `fetch('/api/trpc/ai.summa
- `2797:224` @ (64,2536) :: UX-H-02
- `2797:225` @ (144,2536) :: media
- `2797:226` @ (330,2536) :: Stock search can never tell the user that it failed. The editor's stock client swallows every non-abort error and returns an empty a
- `2797:227` @ (1050,2536) :: StockService.ts:80-83 and :94-97 — both search metho
- `2797:228` @ (64,2584) :: UX-H-11
- `2797:229` @ (144,2584) :: media
- `2797:230` @ (330,2584) :: An asset that never reached the server — the upload mirror failed, or the blob token is missing — is warned about exactly twice, in 
- `2797:231` @ (1050,2584) :: AssetCell.tsx:64 `const badge = item.assetSource ? B
- `2797:232` @ (64,2632) :: UX-H-14
- `2797:233` @ (144,2632) :: layers
- `2797:234` @ (330,2632) :: Lock is stored in two places that never reconcile. The padlock a user sees is drawn from a per-page localStorage list; the lock the 
- `2797:235` @ (1050,2632) :: useLayerActions.ts:70-97 hydrateFromStorage reads lo
- `2797:236` @ (64,2680) :: UX-H-26
- `2797:237` @ (144,2680) :: brand
- `2797:238` @ (330,2680) :: The conflict box says 'Choose how to handle them' when a choice has already been made for the user, and it is the overwriting one. R
- `2797:239` @ (1050,2680) :: ImportCard.tsx:126 `React.useState<ConflictStrategy>
- `2797:240` @ (64,2728) :: UX-I-01
- `2797:241` @ (144,2728) :: history-and-versions
- `2797:242` @ (330,2728) :: Every row in the 'All changes' list carries a clickable timestamp labelled 'Jump to 14:32'. Clicking it does not jump or preview — i
- `2797:243` @ (1050,2728) :: ActivityView.tsx:360-393 handleTimestampClick -> com
- `2797:244` @ (64,2776) :: UX-I-02
- `2797:245` @ (144,2776) :: history-and-versions
- `2797:246` @ (330,2776) :: 'Restore this point' in the Time-Travel drawer fires straight into the same truncating restore with no confirmation, while the ident
- `2797:247` @ (1050,2776) :: TimeTravelScrubber.tsx:264-268 handleRestore -> onRe
- `2797:248` @ (64,2824) :: UX-I-03
- `2797:249` @ (144,2824) :: history-and-versions
- `2797:250` @ (330,2824) :: The scrubber installs a document-level keydown handler with NO guard for text fields. While it is open the History panel still rende
- `2797:251` @ (1050,2824) :: TimeTravelScrubber.tsx:270-286 document keydown: 'En
- `2797:252` @ (64,2872) :: UX-I-12
- `2797:253` @ (144,2872) :: history-and-versions
- `2797:254` @ (330,2872) :: The scrub preview is not a render of the past — it is the nearest NAMED version's screenshot. A user with no named versions (the def
- `2797:255` @ (1050,2872) :: TimeTravelScrubber.tsx:104-115 renderPreviewForIndex
- `2797:256` @ (64,2920) :: UX-I-18
- `2797:257` @ (144,2920) :: review-and-collaboration
- `2797:258` @ (330,2920) :: The review bar's 'Re-send' calls the shell's resend with no client email. The shell only mints a review token when it is given one, 
- `2797:259` @ (1050,2920) :: ReviewBar.tsx:104-113 `await onResend()` — no argume
- `2797:260` @ (64,2968) :: UX-I-19
- `2797:261` @ (144,2968) :: review-and-collaboration
- `2797:262` @ (330,2968) :: The same destructive verb ships twice with different safety. In the panel, re-sending with open comments raises an inline confirm th
- `2797:263` @ (1050,2968) :: ReviewTab.tsx:842-855 onClick -> if (openComments.le
- `2797:264` @ (64,3016) :: UX-I-21
- `2797:265` @ (144,3016) :: review-and-collaboration
- `2797:266` @ (330,3016) :: Compare renders two full web pages side by side inside a left-drawer panel whose default width is 280px — about 130px per pane once 
- `2797:267` @ (1050,3016) :: ReviewTab.tsx:498-505 the compareOpen branch returns
- `2797:268` @ (64,3064) :: UX-I-33
- `2797:269` @ (144,3064) :: settings
- `2797:270` @ (330,3064) :: Deleting a redirect fires the server mutation on the first click. No confirm, no undo, no toast. A redirect is a live routing rule t
- `2797:271` @ (1050,3064) :: RedirectsScreen.tsx:160-168 handleDelete -> getClien
- `2797:272` @ (64,3097) :: UX-I-34
- `2797:273` @ (144,3097) :: settings
- `2797:274` @ (330,3097) :: 'Delete' on a form submission permanently destroys a customer's message on the first click — no confirm, no undo, no trash. The row 
- `2797:275` @ (1050,3097) :: FormsScreen.tsx:153-169 handleDelete -> forms.delete
- `2797:276` @ (64,3145) :: UX-I-40
- `2797:277` @ (144,3145) :: settings
- `2797:278` @ (330,3145) :: Half of Settings is inside version history and half is outside it, and nothing says which. General, SEO, Analytics and Custom code w
- `2797:279` @ (1050,3145) :: SettingsTab.tsx:581-624 handleSave — screenSaveHandl

## 2 · Module Map — `2797:280`

Section node `2797:280` · SECTION · layer name `2 · Module Map` · x=1660 y=0 w=900 h=900
Boards: 1 · TEXT nodes: 28 (complete).

### Boards

| # | layer name | node id | type | x | y | w | h | TEXT nodes read |
|---|-----------|---------|------|---|---|---|---|-----------------|
| 1 | Module map | `2797:281` | FRAME | 1700 | 40 | 800 | 760 | 28 |

### Text

#### Board `2797:281` — Module map

- `2797:282` @ (1728,66) :: Module Map
- `2797:283` @ (1728,106) :: Thirteen modules audited. Width of the bar is finding count; the number beside it is Criticals.
- `2797:284` @ (1728,160) :: shell (rail / topbar / canvas)
- `2797:286` @ (2406,161) :: 0 critical
- `2797:287` @ (1728,208) :: Pages & Routing
- `2797:289` @ (2406,209) :: 6 critical
- `2797:290` @ (1728,256) :: insert-elements
- `2797:292` @ (2406,257) :: 3 critical
- `2797:293` @ (1728,304) :: Publish, Export, Preview & SEO
- `2797:295` @ (2406,305) :: 0 critical
- `2797:296` @ (1728,352) :: Content / CMS
- `2797:298` @ (2406,353) :: 7 critical
- `2797:299` @ (1728,400) :: Inspector / right panel
- `2797:301` @ (2406,401) :: 5 critical
- `2797:302` @ (1728,448) :: AI experience
- `2797:304` @ (2406,449) :: 4 critical
- `2797:305` @ (1728,496) :: history-and-versions
- `2797:307` @ (2406,497) :: 4 critical
- `2797:308` @ (1728,544) :: media
- `2797:310` @ (2406,545) :: 2 critical
- `2797:311` @ (1728,592) :: review-and-collaboration
- `2797:313` @ (2406,593) :: 3 critical
- `2797:314` @ (1728,640) :: layers
- `2797:316` @ (2406,641) :: 1 critical
- `2797:317` @ (1728,688) :: settings
- `2797:319` @ (2406,689) :: 3 critical
- `2797:320` @ (1728,736) :: brand
- `2797:322` @ (2406,737) :: 1 critical

## 3 · Cross-Module Flow Map — `2797:323`

Section node `2797:323` · SECTION · layer name `3 · Cross-Module Flow Map` · x=2720 y=0 w=1100 h=700
Boards: 1 · TEXT nodes: 17 (complete).

### Boards

| # | layer name | node id | type | x | y | w | h | TEXT nodes read |
|---|-----------|---------|------|---|---|---|---|-----------------|
| 1 | Flow map — summary | `2797:324` | FRAME | 2760 | 40 | 1000 | 560 | 17 |

### Text

#### Board `2797:324` — Flow map — summary

- `2797:325` @ (2788,66) :: Cross-Module Flow Map
- `2797:326` @ (2788,106) :: 319 chains in the form MODULE → SCREEN → ACTION → NEXT STATE → CONNECTED MODULE → RESULT. 278 fail.
- `2797:327` @ (2788,160) :: 278
- `2797:329` @ (3118,160) :: 41
- `2797:331` @ (3448,160) :: 4
- `2797:328` @ (2788,204) :: chains fail
- `2797:330` @ (3118,204) :: verified working
- `2797:332` @ (3448,204) :: failure classes, needing different work
- `2797:333` @ (2788,270) :: BROKEN
- `2797:334` @ (2960,270) :: does the wrong thing — fix the code before drawing the screen
- `2797:335` @ (2788,318) :: MISSING
- `2797:336` @ (2960,318) :: no control exists at all — a screen has to be designed
- `2797:337` @ (2788,366) :: UNDISCOVERABLE
- `2797:338` @ (2960,366) :: works correctly, has no door — pure information architecture
- `2797:339` @ (2788,414) :: DUPLICATE
- `2797:340` @ (2960,414) :: two surfaces, different rules; which door you found decides your result
- `2797:341` @ (2788,500) :: Full chain list: docs/design-jobs/UX-FLOW-MAP.md

## 4 · Missing Screens & States — `2797:342`

Section node `2797:342` · SECTION · layer name `4 · Missing Screens & States` · x=3980 y=0 w=1000 h=700
Boards: 1 · TEXT nodes: 18 (complete).

### Boards

| # | layer name | node id | type | x | y | w | h | TEXT nodes read |
|---|-----------|---------|------|---|---|---|---|-----------------|
| 1 | Missing screens and states | `2797:343` | FRAME | 4020 | 40 | 900 | 560 | 18 |

### Text

#### Board `2797:343` — Missing screens and states

- `2797:344` @ (4048,66) :: Missing Screens & States
- `2797:345` @ (4048,106) :: From the audit's own kind counts. These are screens and states the product needs and does not have — distinct from screens that exist and misbehave.
- `2797:346` @ (4048,170) :: 28
- `2797:347` @ (4110,174) :: missing-state
- `2797:348` @ (4320,174) :: empty / loading / error / success that no screen draws
- `2797:349` @ (4048,234) :: 28
- `2797:350` @ (4110,238) :: missing-action
- `2797:351` @ (4320,238) :: a task the user must do with no control to do it
- `2797:352` @ (4048,298) :: 10
- `2797:353` @ (4110,302) :: missing-screen
- `2797:354` @ (4320,302) :: a whole screen with no design at all
- `2797:355` @ (4048,362) :: 21
- `2797:356` @ (4110,366) :: dead-end
- `2797:357` @ (4320,366) :: a screen a user cannot get back out of
- `2797:358` @ (4048,426) :: 13
- `2797:359` @ (4110,430) :: destructive-confirm
- `2797:360` @ (4320,430) :: irreversible actions, five different confirmation conventions
- `2797:361` @ (4048,510) :: Coverage gap the QA lane named: loading states are unexamined in 10 of 13 modules and error states in 8 of 13. Settings has zero of both across six server-backed screens.

## 5 · AI Interaction Map — `2797:362`

Section node `2797:362` · SECTION · layer name `5 · AI Interaction Map` · x=5140 y=0 w=1100 h=700
**PARTIAL: 10 of 21 TEXT nodes read.** The remaining 11 were never fetched.

### Boards

| # | layer name | node id | type | x | y | w | h | TEXT nodes read |
|---|-----------|---------|------|---|---|---|---|-----------------|
| 1 | AI today, and the one contract | `2797:363` | FRAME | 5180 | 40 | 1000 | 580 | 10 |

### Text

#### Board `2797:363` — AI today, and the one contract

- `2797:364` @ (5208,66) :: AI Interaction Map
- `2797:365` @ (5208,106) :: Census before proposal. What ships, what is flagged off, and what is claimed but absent.
- `2797:366` @ (5208,160) :: Entry points shipping today
- `2797:367` @ (5470,160) :: 14
- `2797:368` @ (5690,160) :: across 5 glyph vocabularies (Sparkles, ✨, ✦, ▶, 🕘) and 3 verbs
- `2797:369` @ (5208,222) :: AI flags that exist
- `2797:370` @ (5470,222) :: 1
- `2797:371` @ (5690,222) :: FEATURE_DS_AI — set in no env file
- `2797:372` @ (5208,284) :: What that flag gates
- `2797:373` @ (5470,284) :: the client

## 6 · Navigation Structure — `2797:385`

**NEVER READ — quota stop.** No board and no TEXT node of this section was fetched.
From the page-level read only: type SECTION, x=6400 y=0 w=1100 h=700, 1 direct children.

## 7 · Design System — `2797:410`

**NEVER READ — quota stop.** No board and no TEXT node of this section was fetched.
From the page-level read only: type SECTION, x=7660 y=0 w=1200 h=900, 1 direct children.

## 8 · Component Library — `2797:491`

**NEVER READ — quota stop.** No board and no TEXT node of this section was fetched.
From the page-level read only: type SECTION, x=9020 y=0 w=1300 h=1140, 2 direct children.

## 9 · Corrected Module Screens — `2797:559`

**NEVER READ — quota stop.** No board and no TEXT node of this section was fetched.
From the page-level read only: type SECTION, x=10480 y=0 w=1900 h=1000, 20 direct children.

## 10 · Major User Flows — `2797:574`

**NEVER READ — quota stop.** No board and no TEXT node of this section was fetched.
From the page-level read only: type SECTION, x=14400 y=0 w=1300 h=780, 1 direct children.

## 11 · Panel / Drawer / Modal Rules — `2797:603`

**NEVER READ — quota stop.** No board and no TEXT node of this section was fetched.
From the page-level read only: type SECTION, x=15860 y=0 w=1000 h=1000, 1 direct children.

## 12 · Final Polished Editor — `2797:569`

**NEVER READ — quota stop.** No board and no TEXT node of this section was fetched.
From the page-level read only: type SECTION, x=12540 y=0 w=1700 h=1200, 3 direct children.

---

# Recommendations extracted

**117 statements** an implementer would have to act on, drawn ONLY from the
5 sections that were actually read (1, 2, 3, 4 complete; 5 partial). Sections 6–12
were never fetched, so **no recommendation from them appears here.** That is a gap,
not an absence — Design System, Component Library, Corrected Module Screens, Major
User Flows, Panel/Drawer/Modal Rules and Final Polished Editor all carry rules a
verifier needs, and none of them is below.

`kind` is what the statement is: `measurement` (a counted fact), `claim` (an
assertion about the product), `rule` (how work must be done), `correction` (a
statement about what an earlier version got wrong), `finding (Critical)` (one of
the 46 rows on the criticals board).

Modules use the vocabulary the brief names. `CROSS-CUTTING` means it lands on every
module — the design-system rules, shell dimensions and the navigation/audit census.

## Cross-cutting

| # | node id(s) | board | kind | verbatim claim |
|---|-----------|-------|------|----------------|
| 1 | `2797:5` | `2797:3` Audit — what was found | claim | Eight module lanes read the CODE, not the boards. Every finding carries a file:line someone opened. An independent QA lane then re-verified 48 of them and refuted 11 — including two of the coordinator's own claims. |
| 2 | `2797:6 + 2797:7` | `2797:3` Audit — what was found | measurement | 295 — findings |
| 3 | `2797:8 + 2797:9` | `2797:3` Audit — what was found | measurement | 283 — distinct after de-duplication |
| 4 | `2797:10 + 2797:11` | `2797:3` Audit — what was found | measurement | 46 — Critical (refuted excluded) |
| 5 | `2797:12 + 2797:13` | `2797:3` Audit — what was found | measurement | 171 — Major |
| 6 | `2797:14 + 2797:15` | `2797:3` Audit — what was found | measurement | 13 — modules |
| 7 | `2797:16 + 2797:17` | `2797:3` Audit — what was found | measurement | 11 — refuted by QA |
| 8 | `2797:18` | `2797:3` Audit — what was found | measurement | Confidence as recorded carries no signal: 285 of 295 rows claim high confidence, and all 11 refuted claims sit in that group. |
| 22 | `2797:62` | `2797:60` Findings by kind | claim | Missing feedback is the single largest class. The product usually knows; it does not say. |
| 23 | `2797:63 + 2797:65` | `2797:60` Findings by kind | measurement | missing-feedback — 45 |
| 24 | `2797:66 + 2797:68` | `2797:60` Findings by kind | measurement | broken-flow — 42 |
| 25 | `2797:69 + 2797:71` | `2797:60` Findings by kind | measurement | confusing-nav — 33 |
| 26 | `2797:72 + 2797:74` | `2797:60` Findings by kind | measurement | missing-action — 28 |
| 27 | `2797:75 + 2797:77` | `2797:60` Findings by kind | measurement | missing-state — 28 |
| 28 | `2797:78 + 2797:80` | `2797:60` Findings by kind | measurement | duplicate-feature — 27 |
| 29 | `2797:81 + 2797:83` | `2797:60` Findings by kind | measurement | dead-end — 21 |
| 30 | `2797:84 + 2797:86` | `2797:60` Findings by kind | measurement | destructive-confirm — 13 |
| 31 | `2797:87 + 2797:89` | `2797:60` Findings by kind | measurement | disabled-state — 11 |
| 32 | `2797:90 + 2797:92` | `2797:60` Findings by kind | measurement | missing-screen — 10 |
| 33 | `2797:95` | `2797:93` The 55 Criticals | correction | Ten findings a QA pass refuted or overstated are excluded — UX-B-01, B-05, C-04, C-25, E-01, E-04, E-13, F-07, I-17, I-30. |
| 80 | `2797:283` | `2797:281` Module map | claim | Thirteen modules audited. Width of the bar is finding count; the number beside it is Criticals. |
| 94 | `2797:326` | `2797:324` Flow map — summary | rule | 319 chains in the form MODULE → SCREEN → ACTION → NEXT STATE → CONNECTED MODULE → RESULT. 278 fail. |
| 95 | `2797:333` | `2797:324` Flow map — summary | rule | BROKEN |
| 96 | `2797:334` | `2797:324` Flow map — summary | rule | does the wrong thing — fix the code before drawing the screen |
| 97 | `2797:335` | `2797:324` Flow map — summary | rule | MISSING |
| 98 | `2797:336` | `2797:324` Flow map — summary | rule | no control exists at all — a screen has to be designed |
| 99 | `2797:337` | `2797:324` Flow map — summary | rule | UNDISCOVERABLE |
| 100 | `2797:338` | `2797:324` Flow map — summary | rule | works correctly, has no door — pure information architecture |
| 101 | `2797:339` | `2797:324` Flow map — summary | rule | DUPLICATE |
| 102 | `2797:340` | `2797:324` Flow map — summary | rule | two surfaces, different rules; which door you found decides your result |
| 103 | `2797:341` | `2797:324` Flow map — summary | rule | Full chain list: docs/design-jobs/UX-FLOW-MAP.md |
| 104 | `2797:327 + 2797:328` | `2797:324` Flow map — summary | measurement | 278 — chains fail |
| 105 | `2797:329 + 2797:330` | `2797:324` Flow map — summary | measurement | 41 — verified working |
| 106 | `2797:331 + 2797:332` | `2797:324` Flow map — summary | measurement | 4 — failure classes, needing different work |
| 107 | `2797:345` | `2797:343` Missing screens and states | claim | From the audit's own kind counts. These are screens and states the product needs and does not have — distinct from screens that exist and misbehave. |
| 108 | `2797:346 + 2797:347 + 2797:348` | `2797:343` Missing screens and states | measurement | 28 missing-state — empty / loading / error / success that no screen draws |
| 109 | `2797:349 + 2797:350 + 2797:351` | `2797:343` Missing screens and states | measurement | 28 missing-action — a task the user must do with no control to do it |
| 110 | `2797:352 + 2797:353 + 2797:354` | `2797:343` Missing screens and states | measurement | 10 missing-screen — a whole screen with no design at all |
| 111 | `2797:355 + 2797:356 + 2797:357` | `2797:343` Missing screens and states | measurement | 21 dead-end — a screen a user cannot get back out of |
| 112 | `2797:358 + 2797:359 + 2797:360` | `2797:343` Missing screens and states | measurement | 13 destructive-confirm — irreversible actions, five different confirmation conventions |
| 113 | `2797:361` | `2797:343` Missing screens and states | measurement | Coverage gap the QA lane named: loading states are unexamined in 10 of 13 modules and error states in 8 of 13. Settings has zero of both across six server-backed screens. |

## Module-specific

| # | node id(s) | board | module(s) | kind | verbatim claim |
|---|-----------|-------|-----------|------|----------------|
| 9 | `2797:21 + 2797:23` | `2797:19` Findings by module | shell, canvas | measurement | shell (rail / topbar / canvas) — 36 |
| 10 | `2797:24 + 2797:26` | `2797:19` Findings by module | pages | measurement | Pages & Routing — 33 |
| 11 | `2797:27 + 2797:29` | `2797:19` Findings by module | insert | measurement | insert-elements — 32 |
| 12 | `2797:30 + 2797:32` | `2797:19` Findings by module | publish, preview | measurement | Publish, Export, Preview & SEO — 30 |
| 13 | `2797:33 + 2797:35` | `2797:19` Findings by module | content | measurement | Content / CMS — 29 |
| 14 | `2797:36 + 2797:38` | `2797:19` Findings by module | inspector | measurement | Inspector / right panel — 28 |
| 15 | `2797:39 + 2797:41` | `2797:19` Findings by module | ai | measurement | AI experience — 23 |
| 16 | `2797:42 + 2797:44` | `2797:19` Findings by module | history | measurement | history-and-versions — 16 |
| 17 | `2797:45 + 2797:47` | `2797:19` Findings by module | media | measurement | media — 13 |
| 18 | `2797:48 + 2797:50` | `2797:19` Findings by module | review | measurement | review-and-collaboration — 13 |
| 19 | `2797:51 + 2797:53` | `2797:19` Findings by module | layers | measurement | layers — 12 |
| 20 | `2797:54 + 2797:56` | `2797:19` Findings by module | settings | measurement | settings — 12 |
| 21 | `2797:57 + 2797:59` | `2797:19` Findings by module | brand | measurement | brand — 7 |
| 34 | `2797:96 · 2797:98 · 2797:99` | `2797:93` The 55 Criticals | insert | finding (Critical) | UX-A-01 — Dragging an element out of Insert can land nothing on the page and still report success. The drop dispatcher pre-reads every DataTra  [evidence: useDropExecution.ts:183-195 (pre-snapshot + the comm] |
| 35 | `2797:100 · 2797:102 · 2797:103` | `2797:93` The 55 Criticals | insert | finding (Critical) | UX-A-02 — The canvas selection toolbar's + opens a picker that tells the user an element was added when nothing was. The picker's own click ha  [evidence: useElementsState.ts:151-161 — trackSidebar then `add] |
| 36 | `2797:104 · 2797:106 · 2797:107` | `2797:93` The 55 Criticals | insert | finding (Critical) | UX-A-05 — BLOCKS is the one group in Insert drawn as a picture grid, and it has no pictures. The card renders `b.preview` when a block defines  [evidence: GroupSection.tsx:234-262 — `{b.preview ? <img .../> ] |
| 37 | `2797:108 · 2797:110 · 2797:111` | `2797:93` The 55 Criticals | pages | finding (Critical) | UX-B-02 — There is no way to put a page into Draft. The visibility control offers Live / Hidden / Password only, while the panel's own status   [evidence: page-settings/AdvancedTab.tsx:24 renders exactly ['l] |
| 38 | `2797:112 · 2797:114 · 2797:115` | `2797:93` The 55 Criticals | pages | finding (Critical) | UX-B-03 — Opening page settings and changing one unrelated field silently publishes the page. The drawer reads any page that is not hidden or   [evidence: page-settings/usePageSettings.ts:103-104 (visibility] |
| 39 | `2797:116 · 2797:118 · 2797:119` | `2797:93` The 55 Criticals | pages | finding (Critical) | UX-B-04 — The delete confirmation never says what else breaks. Internal links are stored as a page id, and the exporter silently rewrites any   [evidence: PagesTab.tsx:329 confirm copy] |
| 40 | `2797:120 · 2797:122 · 2797:123` | `2797:93` The 55 Criticals | pages | finding (Critical) | UX-B-10 — Typing a slug that clashes with another page starts a toast that will not stop. The form autosaves half a second after any change; t  [evidence: page-settings/PageSettingsDrawer.tsx:41-45 (autosave] |
| 41 | `2797:124 · 2797:126 · 2797:127` | `2797:93` The 55 Criticals | pages | finding (Critical) | UX-B-13 — '+ Add page' can create a second page with the same name AND the same URL as an existing one. The default name is 'Page {count+1}',   [evidence: shared/utils/pageUtils.ts:16-20 getDefaultPageName] |
| 42 | `2797:128 · 2797:130 · 2797:131` | `2797:93` The 55 Criticals | pages | finding (Critical) | UX-B-32 — Adding a page does not add it to the site's navigation, and the product offers no way to do it in bulk. The navbar is a static block  [evidence: blocks/Sections/Navbar.tsx:17 the navbar block's con] |
| 43 | `2797:132 · 2797:134 · 2797:135` | `2797:93` The 55 Criticals | content | finding (Critical) | UX-C-01 — The founder's uncommitted work makes bindings survive a reload ONLY in the standalone/localStorage editor. In the SHIPPING editor (a  [evidence: packages/shared/schemas/sites.ts:192-214 (editorSave] |
| 44 | `2797:136 · 2797:138 · 2797:139` | `2797:93` The 55 Criticals | content | finding (Critical) | UX-C-02 — A user can create collections from three different places and can never remove or rename one. The Content panel's collection rows ar  [evidence: ContentViews.tsx:171-200 (RootView rows: ListRow + a] |
| 45 | `2797:140 · 2797:142 · 2797:143` | `2797:93` The 55 Criticals | content | finding (Critical) | UX-C-03 — The Conditions screen offers a complete-looking flow - pick an element on the canvas, write path/operator/value, Add condition - and  [evidence: DataManager.ts:482-491 sets/removes data-condition-h] |
| 46 | `2797:144 · 2797:146 · 2797:147` | `2797:93` The 55 Criticals | content | finding (Critical) | UX-C-05 — The Published switch does not govern what ships. When an element is bound to a record, export resolves the binding by querying the c  [evidence: CMSBindingManager.ts:120-123 resolveBinding calls qu] |
| 47 | `2797:148 · 2797:150 · 2797:151` | `2797:93` The 55 Criticals | content | finding (Critical) | UX-C-06 — The reason to build a CMS is that one design serves many rows, and that is the one thing no screen in the editor can do. Every bindi  [evidence: CMSBindingManager.ts:208 bindCollection and DataMana] |
| 48 | `2797:152 · 2797:154 · 2797:155` | `2797:93` The 55 Criticals | content | finding (Critical) | UX-C-07 — There are two record editors and which one a user meets is an accident of which door they found. The Content panel gives a stacked f  [evidence: Panel: ContentViews.tsx:379-397 (delete ConfirmDialo] |
| 49 | `2797:156 · 2797:158 · 2797:159` | `2797:93` The 55 Criticals | content | finding (Critical) | UX-C-08 — Creating a record with the Published switch on, when a required field is empty, leaves a hidden duplicate behind every time the user  [evidence: useContentPanel.ts:161-168 (createContentItem then u] |
| 50 | `2797:160 · 2797:162 · 2797:163` | `2797:93` The 55 Criticals | inspector | finding (Critical) | UX-D-02 — The canvas refuses to select a locked element and toasts 'This element is locked. Unlock it in the Layers panel.' The Layers tree ha  [evidence: useSelectionBehavior.ts:88,106,134 block the locked ] |
| 51 | `2797:164 · 2797:166 · 2797:167` | `2797:93` The 55 Criticals | inspector | finding (Critical) | UX-D-04 — The scope dropdown's own copy scopes the fan-out to the current page — 'no other buttons on this page', 'no other buttons here' — bu  [evidence: ScopeDropdown.tsx:58-67 peers = composer.elements.ge] |
| 52 | `2797:168 · 2797:170 · 2797:171` | `2797:93` The 55 Criticals | inspector | finding (Critical) | UX-D-08 — These composite elements have no component-level editor. Every one of them falls through to the generic container profile, and the o  [evidence: elementProfiles.ts:231-241 slider/accordion/navbar/t] |
| 53 | `2797:172 · 2797:174 · 2797:175` | `2797:93` The 55 Criticals | inspector | finding (Critical) | UX-D-09 — Selecting a form gives Action URL, Method, Encoding, Disable Validation and Autocomplete — five raw HTML attributes. There is no fie  [evidence: sections/elementProperties/config.ts:210-240 is the ] |
| 54 | `2797:176 · 2797:178 · 2797:179` | `2797:93` The 55 Criticals | inspector | finding (Critical) | UX-D-14 — The panel has TWO animation systems, adjacent in every element profile, that do not acknowledge each other. 'Interactions' adds a tr  [evidence: elementProfiles.ts (every profile) orders … effects,] |
| 55 | `2797:180 · 2797:182 · 2797:183` | `2797:93` The 55 Criticals | publish, preview | finding (Critical) | UX-E-02 — The two publish surfaces on screen at the same time answer 'is there anything to publish?' from different data and print opposite an  [evidence: StudioHeader.tsx:592-596 (`hasUnpublishedChanges = i] |
| 56 | `2797:184 · 2797:186 · 2797:187` | `2797:93` The 55 Criticals | publish, preview | finding (Critical) | UX-E-03 — If a status poll fails — a dropped connection, a session timeout, a 500 — the editor stops polling and strands the user inside the i  [evidence: usePublishJob.ts:155-170 (tick catch → setError + st] |
| 57 | `2797:188 · 2797:190 · 2797:191` | `2797:93` The 55 Criticals | publish, preview | finding (Critical) | UX-E-05 — Every CMS-generated detail page ships the TEMPLATE page's identity. `generateDynamicPages` clones the template's HTML whole — head i  [evidence: cms.service.ts:206-215 (seoTitle/seoDescription appe] |
| 58 | `2797:192 · 2797:194 · 2797:195` | `2797:93` The 55 Criticals | publish, preview | finding (Critical) | UX-E-17 — Preview cannot show what a visitor gets, on the surface whose entire job is to show what a visitor gets. Three things stack up: the   [evidence: ExportUtils.ts:35-42 (`querySelectorAll('script,ifra] |
| 59 | `2797:196 · 2797:198 · 2797:199` | `2797:93` The 55 Criticals | shell, canvas | finding (Critical) | UX-F-01 — The rail shows six destinations - Insert, Layers, Pages, Media, Content, Brand - but the editor has twelve panel destinations. Templ  [evidence: packages/editor/src/editor/rail/tabsConfig.ts:349-35] |
| 60 | `2797:200 · 2797:202 · 2797:203` | `2797:93` The 55 Criticals | shell, canvas | finding (Critical) | UX-F-09 — 'Quick preview' does not preview the site - it previews one page, with everything turned off. The overlay renders composer.exportHTM  [evidence: packages/editor/src/editor/shell/AquibraStudio.tsx:1] |
| 61 | `2797:204 · 2797:206 · 2797:207` | `2797:93` The 55 Criticals | shell, canvas | finding (Critical) | UX-F-30 — 'Unpublish site...' does not open a confirmation. The row switches the left panel to the Publish tab and then, in the same tick, emi  [evidence: packages/editor/src/editor/shell/StudioHeader.tsx:80] |
| 62 | `2797:208 · 2797:210 · 2797:211` | `2797:93` The 55 Criticals | ai | finding (Critical) | UX-G-01 — The one state that explains why AI does nothing tells the user to fix something they cannot fix. The panel says 'No API key is set f  [evidence: AITab.tsx:261-277 renders the copy and the button (w] |
| 63 | `2797:212 · 2797:214 · 2797:215` | `2797:93` The 55 Criticals | ai | finding (Critical) | UX-G-02 — The same AI panel opens in two different columns depending on which door you use, with two different headers, two different exits, a  [evidence: StudioPanels.tsx:290-302 — `ui:switch-tab {tab:'ai'}] |
| 64 | `2797:216 · 2797:218 · 2797:219` | `2797:93` The 55 Criticals | ai | finding (Critical) | UX-G-07 — The button is live in production while the thing behind it is switched off, and the failure it produces is a developer sentence. The  [evidence: ComponentsSection.tsx:166-176 renders the button, di] |
| 65 | `2797:220 · 2797:222 · 2797:223` | `2797:93` The 55 Criticals | ai | finding (Critical) | UX-G-09 — Both History AI features very likely never reach the model. They post a bare JSON body to the tRPC HTTP endpoint, and that router is  [evidence: useAISummary.ts:109-116 — `fetch('/api/trpc/ai.summa] |
| 66 | `2797:224 · 2797:226 · 2797:227` | `2797:93` The 55 Criticals | media | finding (Critical) | UX-H-02 — Stock search can never tell the user that it failed. The editor's stock client swallows every non-abort error and returns an empty a  [evidence: StockService.ts:80-83 and :94-97 — both search metho] |
| 67 | `2797:228 · 2797:230 · 2797:231` | `2797:93` The 55 Criticals | media | finding (Critical) | UX-H-11 — An asset that never reached the server — the upload mirror failed, or the blob token is missing — is warned about exactly twice, in   [evidence: AssetCell.tsx:64 `const badge = item.assetSource ? B] |
| 68 | `2797:232 · 2797:234 · 2797:235` | `2797:93` The 55 Criticals | layers | finding (Critical) | UX-H-14 — Lock is stored in two places that never reconcile. The padlock a user sees is drawn from a per-page localStorage list; the lock the   [evidence: useLayerActions.ts:70-97 hydrateFromStorage reads lo] |
| 69 | `2797:236 · 2797:238 · 2797:239` | `2797:93` The 55 Criticals | brand | finding (Critical) | UX-H-26 — The conflict box says 'Choose how to handle them' when a choice has already been made for the user, and it is the overwriting one. R  [evidence: ImportCard.tsx:126 `React.useState<ConflictStrategy>] |
| 70 | `2797:240 · 2797:242 · 2797:243` | `2797:93` The 55 Criticals | history | finding (Critical) | UX-I-01 — Every row in the 'All changes' list carries a clickable timestamp labelled 'Jump to 14:32'. Clicking it does not jump or preview — i  [evidence: ActivityView.tsx:360-393 handleTimestampClick -> com] |
| 71 | `2797:244 · 2797:246 · 2797:247` | `2797:93` The 55 Criticals | history | finding (Critical) | UX-I-02 — 'Restore this point' in the Time-Travel drawer fires straight into the same truncating restore with no confirmation, while the ident  [evidence: TimeTravelScrubber.tsx:264-268 handleRestore -> onRe] |
| 72 | `2797:248 · 2797:250 · 2797:251` | `2797:93` The 55 Criticals | history | finding (Critical) | UX-I-03 — The scrubber installs a document-level keydown handler with NO guard for text fields. While it is open the History panel still rende  [evidence: TimeTravelScrubber.tsx:270-286 document keydown: 'En] |
| 73 | `2797:252 · 2797:254 · 2797:255` | `2797:93` The 55 Criticals | history | finding (Critical) | UX-I-12 — The scrub preview is not a render of the past — it is the nearest NAMED version's screenshot. A user with no named versions (the def  [evidence: TimeTravelScrubber.tsx:104-115 renderPreviewForIndex] |
| 74 | `2797:256 · 2797:258 · 2797:259` | `2797:93` The 55 Criticals | review | finding (Critical) | UX-I-18 — The review bar's 'Re-send' calls the shell's resend with no client email. The shell only mints a review token when it is given one,   [evidence: ReviewBar.tsx:104-113 `await onResend()` — no argume] |
| 75 | `2797:260 · 2797:262 · 2797:263` | `2797:93` The 55 Criticals | review | finding (Critical) | UX-I-19 — The same destructive verb ships twice with different safety. In the panel, re-sending with open comments raises an inline confirm th  [evidence: ReviewTab.tsx:842-855 onClick -> if (openComments.le] |
| 76 | `2797:264 · 2797:266 · 2797:267` | `2797:93` The 55 Criticals | review | finding (Critical) | UX-I-21 — Compare renders two full web pages side by side inside a left-drawer panel whose default width is 280px — about 130px per pane once   [evidence: ReviewTab.tsx:498-505 the compareOpen branch returns] |
| 77 | `2797:268 · 2797:270 · 2797:271` | `2797:93` The 55 Criticals | settings | finding (Critical) | UX-I-33 — Deleting a redirect fires the server mutation on the first click. No confirm, no undo, no toast. A redirect is a live routing rule t  [evidence: RedirectsScreen.tsx:160-168 handleDelete -> getClien] |
| 78 | `2797:272 · 2797:274 · 2797:275` | `2797:93` The 55 Criticals | settings | finding (Critical) | UX-I-34 — 'Delete' on a form submission permanently destroys a customer's message on the first click — no confirm, no undo, no trash. The row   [evidence: FormsScreen.tsx:153-169 handleDelete -> forms.delete] |
| 79 | `2797:276 · 2797:278 · 2797:279` | `2797:93` The 55 Criticals | settings | finding (Critical) | UX-I-40 — Half of Settings is inside version history and half is outside it, and nothing says which. General, SEO, Analytics and Custom code w  [evidence: SettingsTab.tsx:581-624 handleSave — screenSaveHandl] |
| 81 | `2797:284 + 2797:286` | `2797:281` Module map | shell, canvas | measurement | shell (rail / topbar / canvas) — 0 critical |
| 82 | `2797:287 + 2797:289` | `2797:281` Module map | pages | measurement | Pages & Routing — 6 critical |
| 83 | `2797:290 + 2797:292` | `2797:281` Module map | insert | measurement | insert-elements — 3 critical |
| 84 | `2797:293 + 2797:295` | `2797:281` Module map | publish, preview | measurement | Publish, Export, Preview & SEO — 0 critical |
| 85 | `2797:296 + 2797:298` | `2797:281` Module map | content | measurement | Content / CMS — 7 critical |
| 86 | `2797:299 + 2797:301` | `2797:281` Module map | inspector | measurement | Inspector / right panel — 5 critical |
| 87 | `2797:302 + 2797:304` | `2797:281` Module map | ai | measurement | AI experience — 4 critical |
| 88 | `2797:305 + 2797:307` | `2797:281` Module map | history | measurement | history-and-versions — 4 critical |
| 89 | `2797:308 + 2797:310` | `2797:281` Module map | media | measurement | media — 2 critical |
| 90 | `2797:311 + 2797:313` | `2797:281` Module map | review | measurement | review-and-collaboration — 3 critical |
| 91 | `2797:314 + 2797:316` | `2797:281` Module map | layers | measurement | layers — 1 critical |
| 92 | `2797:317 + 2797:319` | `2797:281` Module map | settings | measurement | settings — 3 critical |
| 93 | `2797:320 + 2797:322` | `2797:281` Module map | brand | measurement | brand — 1 critical |
| 114 | `2797:365` | `2797:363` AI today, and the one contract | ai | claim | Census before proposal. What ships, what is flagged off, and what is claimed but absent. |
| 115 | `2797:366 + 2797:367 + 2797:368` | `2797:363` AI today, and the one contract | ai | measurement | Entry points shipping today: 14 — across 5 glyph vocabularies (Sparkles, ✨, ✦, ▶, 🕘) and 3 verbs |
| 116 | `2797:369 + 2797:370 + 2797:371` | `2797:363` AI today, and the one contract | ai | measurement | AI flags that exist: 1 — FEATURE_DS_AI — set in no env file |
| 117 | `2797:372 + 2797:373` | `2797:363` AI today, and the one contract | ai | measurement | What that flag gates: the client  [third column of this row was NOT read] |

---

# Appendix A — what the page's own numbers do not agree on

Every line here is a diff between two strings **both read off the file**. No local
document was used to derive them.

### A1 · Two quantities on the criticals board, four conflicting values

| where | node | value |
|---|---|---|
| board layer name | `2797:93` | `The 55 Criticals` |
| the stat it renders | `2797:10` + `2797:11` | `46` / `Critical (refuted excluded)` |
| refutation stat | `2797:16` + `2797:17` | `11` / `refuted by QA` |
| exclusion prose | `2797:95` | `Ten findings a QA pass refuted or overstated are excluded — UX-B-01, B-05, C-04, C-25, E-01, E-04, E-13, F-07, I-17, I-30.` |
| header prose | `2797:5` | `…re-verified 48 of them and refuted 11…` |

46 + 11 = 57. 46 + 10 = 56. Neither is 55. The prose says **ten** and names ten ids;
the stat beside it says **eleven**. The board's layer name still says **55** — a
verifier diffing layer names will read 55 where a reader on the canvas sees 46.

### A2 · No refuted claim is drawn as a Critical — checked, and it holds

The brief asked whether any board still shows a refuted claim. **It does not.** All 46
id cells on `2797:93` were read and none is in the exclusion list:

```
drawn (46): UX-A-01 A-02 A-05 · B-02 B-03 B-04 B-10 B-13 B-32 · C-01 C-02 C-03 C-05
            C-06 C-07 C-08 · D-02 D-04 D-08 D-09 D-14 · E-02 E-03 E-05 E-17 ·
            F-01 F-09 F-30 · G-01 G-02 G-07 G-09 · H-02 H-11 H-14 H-26 ·
            I-01 I-02 I-03 I-12 I-18 I-19 I-21 I-33 I-34 I-40
excluded (10, per 2797:95): UX-B-01 B-05 C-04 C-25 E-01 E-04 E-13 F-07 I-17 I-30
intersection: EMPTY
```

Note for the register: `2797:95` names **UX-C-04** as refuted, and the criticals board
does not draw it. `docs/design-jobs/V2-TO-V1/REGISTER.md` nevertheless carries `UX-C-04`
as a row under its `## Critical` heading. The register disagrees with the V2 page on this
id, and the V2 page is the source. (That check is against a local document, not the file —
flagged here because a V2 → V1 pass driven off the register would carry a refuted finding
into V1.)

### A3 · Section 2's Module Map hides 7 of the 46 Criticals

Section 1 draws 46 critical rows. Their module labels, counted:

```
Content / CMS 7 · Pages & Routing 6 · Inspector / right panel 5 ·
Publish, Export, Preview & 4 · AI experience 4 · history-and-versions 4 ·
insert-elements 3 · shell (rail / topbar / can 3 · review-and-collaboration 3 ·
settings 3 · media 2 · layers 1 · brand 1                              = 46
```

Section 2's Module Map renders a `N critical` count beside each of its 13 bars:

```
shell (rail / topbar / canvas)  0 critical   <-- section 1 draws 3
Publish, Export, Preview & SEO  0 critical   <-- section 1 draws 4
Pages & Routing 6 · insert-elements 3 · Content / CMS 7 · Inspector 5 ·
AI experience 4 · history-and-versions 4 · media 2 · review 3 · layers 1 ·
settings 3 · brand 1                                                   = 39
```

**39 ≠ 46.** The two modules reading `0 critical` are exactly the two whose label in
section 1 is cut at 26 characters — `shell (rail / topbar / can` and
`Publish, Export, Preview &`. The Module Map matches module names by exact string, so
the truncated labels match nothing and seven Criticals vanish from the map. A reader
of section 2 alone concludes the shell and the publish path have no Critical findings.

### A4 · Every finding cell on the criticals board is cut mid-word at 132 characters

Measured across all 46 rows of `2797:93`:

| column | x | cells | length |
|---|---|---|---|
| id | 64 | 46 | varies |
| module | 144 | 46 | cut at 26 (see A3) |
| finding | 330 | 46 | **exactly 132, all 46** |
| evidence | 1050 | 46 | **exactly 52 in 44 of 46** (one 29, one 50) |

There is no ellipsis. `2797:98` ends `…pre-reads every DataTra`; `2797:99` ends
`…(pre-snapshot + the comm`. A reader cannot tell a finished sentence from a chopped
one, and the evidence column — the file:line that makes the finding checkable — is the
worst hit. This is the page's most prominent board.

(Verified as a property of the file, not of this walk: the read-back lengths match
their source cells exactly, so nothing in this pipeline truncated them.)

---

# Appendix B — page structure, read from the file

`figma.root.children.find(p => p.id === "2668:2").children` returns **180 nodes**:
12 SECTIONs and **168 nodes that are not SECTIONs**.

## B1 · The twelve sections, in canvas x-order

| x | section | node id | type | y | w | h | direct children |
|---|---------|---------|------|---|---|---|-----------------|
| 0 | 1 · UX Audit | `2797:2` | SECTION | 0 | 1500 | 3253 | 4 |
| 1660 | 2 · Module Map | `2797:280` | SECTION | 0 | 900 | 900 | 1 |
| 2720 | 3 · Cross-Module Flow Map | `2797:323` | SECTION | 0 | 1100 | 700 | 1 |
| 3980 | 4 · Missing Screens & States | `2797:342` | SECTION | 0 | 1000 | 700 | 1 |
| 5140 | 5 · AI Interaction Map | `2797:362` | SECTION | 0 | 1100 | 700 | 1 |
| 6400 | 6 · Navigation Structure | `2797:385` | SECTION | 0 | 1100 | 700 | 1 |
| 7660 | 7 · Design System | `2797:410` | SECTION | 0 | 1200 | 900 | 1 |
| 9020 | 8 · Component Library | `2797:491` | SECTION | 0 | 1300 | 1140 | 2 |
| 10480 | 9 · Corrected Module Screens | `2797:559` | SECTION | 0 | 1900 | 1000 | 20 |
| 12540 | 12 · Final Polished Editor | `2797:569` | SECTION | 0 | 1700 | 1200 | 3 |
| 14400 | 10 · Major User Flows | `2797:574` | SECTION | 0 | 1300 | 780 | 1 |
| 15860 | 11 · Panel / Drawer / Modal Rules | `2797:603` | SECTION | 0 | 1000 | 1000 | 1 |

Reading the canvas left to right the page runs **1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 10, 11**.
Section 12 sits between 9 and 10 at x=12540, ahead of sections 10 (x=14400) and 11
(x=15860). `scripts/figma/order-sections.mjs` exists and was evidently not run after
section 12 was built.

## B2 · 168 loose nodes sitting on the page outside every section

All 168 report `absoluteBoundingBox` at **x=0, y=0** — the page origin, which is inside
section 1's own frame (`2797:2` is at 0,0). Their layer names repeat a fixed cycle:
`Block, Flex, Grid, Inse, Laye, Page, Medi, Cont, Bran, Tmpl, Comp, AI, Pub, Hist,
Rev, Heading, Image, Button` — the rail and insert labels of the polished panels,
detached from their instances. Their id prefixes (2735, 2739, 2744, 2745, 2756, 2759,
2771, 2789, 2791, 2797) place them across every polished-panel build pass.

**Their `characters` were NOT read** — the quota stopped the walk first. Only id, type,
layer name and geometry below.

| node id | type | layer name | x | y | w | h |
|---|---|---|---|---|---|---|
| `2735:15` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2735:18` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2735:21` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2739:15` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2739:18` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2739:21` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2744:23` | TEXT | Inse | 0 | 0 | 14 | 8 |
| `2744:30` | TEXT | Laye | 0 | 0 | 16 | 8 |
| `2744:37` | TEXT | Page | 0 | 0 | 17 | 8 |
| `2744:44` | TEXT | Medi | 0 | 0 | 17 | 8 |
| `2744:50` | TEXT | Cont | 0 | 0 | 17 | 8 |
| `2744:55` | TEXT | Bran | 0 | 0 | 16 | 8 |
| `2744:59` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2744:62` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2744:65` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2744:68` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2744:71` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2744:74` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2744:84` | TEXT | Heading | 0 | 0 | 36 | 11 |
| `2744:87` | TEXT | Image | 0 | 0 | 26 | 11 |
| `2744:90` | TEXT | Button | 0 | 0 | 29 | 11 |
| `2744:283` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2744:286` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2744:289` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2745:168` | TEXT | Inse | 0 | 0 | 16 | 10 |
| `2745:171` | TEXT | Laye | 0 | 0 | 18 | 10 |
| `2745:174` | TEXT | Page | 0 | 0 | 20 | 10 |
| `2745:177` | TEXT | Medi | 0 | 0 | 19 | 10 |
| `2745:180` | TEXT | Cont | 0 | 0 | 19 | 10 |
| `2745:183` | TEXT | Bran | 0 | 0 | 18 | 10 |
| `2745:187` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2745:190` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2745:193` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2745:196` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2745:199` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2745:202` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2756:15` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2756:18` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2756:21` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2759:23` | TEXT | Inse | 0 | 0 | 14 | 8 |
| `2759:30` | TEXT | Laye | 0 | 0 | 16 | 8 |
| `2759:37` | TEXT | Page | 0 | 0 | 17 | 8 |
| `2759:44` | TEXT | Medi | 0 | 0 | 17 | 8 |
| `2759:50` | TEXT | Cont | 0 | 0 | 17 | 8 |
| `2759:55` | TEXT | Bran | 0 | 0 | 16 | 8 |
| `2759:59` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2759:62` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2759:65` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2759:68` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2759:71` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2759:74` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2759:84` | TEXT | Heading | 0 | 0 | 36 | 11 |
| `2759:87` | TEXT | Image | 0 | 0 | 26 | 11 |
| `2759:90` | TEXT | Button | 0 | 0 | 29 | 11 |
| `2759:283` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2759:286` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2759:289` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2771:168` | TEXT | Inse | 0 | 0 | 16 | 10 |
| `2771:171` | TEXT | Laye | 0 | 0 | 18 | 10 |
| `2771:174` | TEXT | Page | 0 | 0 | 20 | 10 |
| `2771:177` | TEXT | Medi | 0 | 0 | 19 | 10 |
| `2771:180` | TEXT | Cont | 0 | 0 | 19 | 10 |
| `2771:183` | TEXT | Bran | 0 | 0 | 18 | 10 |
| `2771:187` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2771:190` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2771:193` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2771:196` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2771:199` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2771:202` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2789:22454` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2789:22457` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2789:22460` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2789:22615` | TEXT | Inse | 0 | 0 | 14 | 8 |
| `2789:22622` | TEXT | Laye | 0 | 0 | 16 | 8 |
| `2789:22629` | TEXT | Page | 0 | 0 | 17 | 8 |
| `2789:22636` | TEXT | Medi | 0 | 0 | 17 | 8 |
| `2789:22642` | TEXT | Cont | 0 | 0 | 17 | 8 |
| `2789:22647` | TEXT | Bran | 0 | 0 | 16 | 8 |
| `2789:22651` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2789:22654` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2789:22657` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2789:22660` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2789:22663` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2789:22666` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2789:22676` | TEXT | Heading | 0 | 0 | 36 | 11 |
| `2789:22679` | TEXT | Image | 0 | 0 | 26 | 11 |
| `2789:22682` | TEXT | Button | 0 | 0 | 29 | 11 |
| `2789:22875` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2789:22878` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2789:22881` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2789:23089` | TEXT | Inse | 0 | 0 | 16 | 10 |
| `2789:23092` | TEXT | Laye | 0 | 0 | 18 | 10 |
| `2789:23095` | TEXT | Page | 0 | 0 | 20 | 10 |
| `2789:23098` | TEXT | Medi | 0 | 0 | 19 | 10 |
| `2789:23101` | TEXT | Cont | 0 | 0 | 19 | 10 |
| `2789:23104` | TEXT | Bran | 0 | 0 | 18 | 10 |
| `2789:23108` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2789:23111` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2789:23114` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2789:23117` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2789:23120` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2789:23123` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2791:22243` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2791:22246` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2791:22249` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2791:22404` | TEXT | Inse | 0 | 0 | 14 | 8 |
| `2791:22411` | TEXT | Laye | 0 | 0 | 16 | 8 |
| `2791:22418` | TEXT | Page | 0 | 0 | 17 | 8 |
| `2791:22425` | TEXT | Medi | 0 | 0 | 17 | 8 |
| `2791:22431` | TEXT | Cont | 0 | 0 | 17 | 8 |
| `2791:22436` | TEXT | Bran | 0 | 0 | 16 | 8 |
| `2791:22440` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2791:22443` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2791:22446` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2791:22449` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2791:22452` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2791:22455` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2791:22465` | TEXT | Heading | 0 | 0 | 36 | 11 |
| `2791:22468` | TEXT | Image | 0 | 0 | 26 | 11 |
| `2791:22471` | TEXT | Button | 0 | 0 | 29 | 11 |
| `2791:22664` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2791:22667` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2791:22670` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2791:22878` | TEXT | Inse | 0 | 0 | 16 | 10 |
| `2791:22881` | TEXT | Laye | 0 | 0 | 18 | 10 |
| `2791:22884` | TEXT | Page | 0 | 0 | 20 | 10 |
| `2791:22887` | TEXT | Medi | 0 | 0 | 19 | 10 |
| `2791:22890` | TEXT | Cont | 0 | 0 | 19 | 10 |
| `2791:22893` | TEXT | Bran | 0 | 0 | 18 | 10 |
| `2791:22897` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2791:22900` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2791:22903` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2791:22906` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2791:22909` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2791:22912` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2797:22242` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2797:22245` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2797:22248` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2797:22403` | TEXT | Inse | 0 | 0 | 14 | 8 |
| `2797:22410` | TEXT | Laye | 0 | 0 | 16 | 8 |
| `2797:22417` | TEXT | Page | 0 | 0 | 17 | 8 |
| `2797:22424` | TEXT | Medi | 0 | 0 | 17 | 8 |
| `2797:22430` | TEXT | Cont | 0 | 0 | 17 | 8 |
| `2797:22435` | TEXT | Bran | 0 | 0 | 16 | 8 |
| `2797:22439` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2797:22442` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2797:22445` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2797:22448` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2797:22451` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2797:22454` | TEXT | Rev | 0 | 0 | 15 | 10 |
| `2797:22464` | TEXT | Heading | 0 | 0 | 36 | 11 |
| `2797:22467` | TEXT | Image | 0 | 0 | 26 | 11 |
| `2797:22470` | TEXT | Button | 0 | 0 | 29 | 11 |
| `2797:22663` | TEXT | Block | 0 | 0 | 26 | 12 |
| `2797:22666` | TEXT | Flex | 0 | 0 | 20 | 12 |
| `2797:22669` | TEXT | Grid | 0 | 0 | 20 | 12 |
| `2797:22877` | TEXT | Inse | 0 | 0 | 16 | 10 |
| `2797:22880` | TEXT | Laye | 0 | 0 | 18 | 10 |
| `2797:22883` | TEXT | Page | 0 | 0 | 20 | 10 |
| `2797:22886` | TEXT | Medi | 0 | 0 | 19 | 10 |
| `2797:22889` | TEXT | Cont | 0 | 0 | 19 | 10 |
| `2797:22892` | TEXT | Bran | 0 | 0 | 18 | 10 |
| `2797:22896` | TEXT | Tmpl | 0 | 0 | 19 | 10 |
| `2797:22899` | TEXT | Comp | 0 | 0 | 23 | 10 |
| `2797:22902` | TEXT | AI | 0 | 0 | 8 | 10 |
| `2797:22905` | TEXT | Pub | 0 | 0 | 15 | 10 |
| `2797:22908` | TEXT | Hist | 0 | 0 | 15 | 10 |
| `2797:22911` | TEXT | Rev | 0 | 0 | 15 | 10 |

### Why no sweep on this page caught them

- `scripts/figma/render-defects.mjs:102` — `pg.children.filter(s=>s.type==="SECTION")`.
  The 168 were never swept. The recorded "0 render defects across 12 of 12 sections"
  is true and does not cover them.
- `scripts/figma/verify-proposal-content.mjs` — `if(s.type!=="SECTION") continue;`.
  Never content-checked; the recorded "954 strings" excludes all 168.
- `scripts/figma/verify-invariants.mjs:5,26-27` — this one DOES report
  `loose nodes on page: N` and returns FAIL. But line 16 defaults `PAGE` to **`1:3`**,
  and the `verification` block of `docs/design-jobs/applied/2026-09-06-proposal-page.json`
  lists only render-defects, verify-proposal-content and board-baseline. The one
  instrument that would have caught this was never pointed at page `2668:2`.

---

# Appendix C — carried forward, NOT verified against the file

> **SOURCE: local documents, NOT read from the Figma file.** The three items the brief
> asked me to carry are recorded here because sections 8, 9 and 12 were never reached.
> Every one of them is a question for the resume pass, not a finding.

### C1 · The "not yet built" chips on sections 8, 9 and 12 — UNVERIFIED

The brief states sections 8, 9 and 12 carry an explicit "not yet built" chip naming the
phase that owns them, and asks for those chips quoted exactly. **All three sections were
never read.** I have no chip text from the file and will not invent one.

What can be said without opening the file: the page read shows section 8 (`2797:491`) has
2 direct children, section 9 (`2797:559`) has 20, and section 12 (`2797:569`) has 3 — so
none of the three is an empty scaffold. A resume pass must read their TEXT nodes and
quote any chip verbatim.

### C2 · The merged nav row's active state — may no longer be open

`docs/design-jobs/applied/2026-09-06-proposal-page.json` → `still_open[0]` records:
*"Bar vs fill for the merged nav row's active state — 600 instances either way. Asked in
the artifact thread; the proposed default is drawn and marked."*

This record is dated **before** the page was last rebuilt (applied JSON mtime 03:31,
`build-proposal-page.mjs` mtime 03:42 the same day). Section 8 was never read, so whether
the board still presents this as open is **UNKNOWN**. A resume pass should read
`2797:491`'s two boards and settle it.

### C3 · The Publish panel's code fixes — the "seven server-side" figure is contradicted

`applied/2026-09-06-proposal-page.json` → `still_open[1]` records twelve code fixes,
**"seven server-side"**. `docs/design-jobs/SPEC-PUBLISH-PANEL.md:313`, closing its own
12-row fix table, says: *"Two of these — 8 and 12 — are server-side and land in
`packages/dashboard` / `server/`, not in the editor."*

Twelve is consistent (10 numbered rows plus 2 unnumbered). **Seven is not** — the spec
says two, and names which two. Section 9 (`2797:559`), which is where the Publish
dependency is drawn, was never read, so what the board itself says is **UNKNOWN**. Read
`2797:559` before propagating either number.


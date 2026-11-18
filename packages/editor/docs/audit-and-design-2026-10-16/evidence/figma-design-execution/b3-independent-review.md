# Independent B3 Pages first-slice review — 2026-10-18

Scope: C2, design-only Pages management first slice in Figma2L9OTGzBrL6kYmU18yA1c7 page3:4. Read-only reviewer; no Figma/app/data edits. This review does not close fullB3. Preflight /tmp/buildrick-b3-pages-preflight.md applies.

Evidence: B3-pages-start.md decision record; API text readback of17 frames63:6393 through63:23182 specified by author; geometry of manager/SEO/recovery; screenshots at1440×900: `/tmp/b3-manager.png`, `/tmp/b3-seo.png`, `/tmp/b3-redirect.png`, `/tmp/b3-guard.png`, `/tmp/b3-deleted.png`. Current source additionally checked SeoTab, SocialTab and utils/seoScore.ts. No prototype playback/runtime performed.

## Findings at initial checkpoint

| ID | Severity / state | Finding and evidence | Required correction |
|---|---|---|---|
| B3-R01 | Blocking continuity | Delete63:19334 still shows About in bottom strip and Pages5 count. Keep-URL63:23182 and URL-changed63:17617 retain About in strip despite Our story target. | Synchronize strip/resource names/counts by stable identity; delete removes inactive About without changing active Home. Rename updates strip label without switching canvas. |
| B3-R02 | Blocking recovery | Keep-URL result is a static notice, no Undo; restored result has no Open action. P11/P24 and usePages.ts:227–232 require named Undo; P24 restore explicitly offers Open. | Add real design actions/toast paths. Open must deliberately navigate; Restore itself preserves current Home. |
| B3-R03 | Blocking recovery representation | Recently deleted63:20001 duplicates normal Pages/Listings/Structure chrome and Add page/From template, uses sparse ordinary row, no deletion metadata/remaining-retention structure. U-7 dependency not stated in initial decision record. | Recovery subview with explicit Back to Pages and48px two-line row; name/slug/folder/deleted-by/age, relevant expiry text, correct scoped restore. Annotate U-7 persistent-store dependency and session-only fallback. Collision/offline/permanent-delete cases may be specified as unrepresented but not invented as working. |
| B3-R04 | Blocking fidelity, author-known | Listings63:21262 is ordinary list with header text, Structure63:21939 similarly flat. | Draw actual columns and URL hierarchy and preserve score/indexing versus visibility semantics. Keep search/return behavior. Do not claim these existing capabilities are preserved by placeholder labels. |
| B3-R05 | Blocking control preservation | SEO/Social descriptions currently use generic single-line compact fields. Social63:16507 lacks direct OG image URL/edit/clear; source SocialTab.tsx:60–86 has Textarea and URL input. | Preserve multiline/expanded description editing, counters and fallback helpers. Keep direct image URL and clear capability; picker is supplemental. Retain1200×630 guidance. Avoid adding AI underSC-21. |
| B3-R06 | Blocking factual fixture | SEO/Listings score82 is impossible under canonical seoScore.ts:28–39 (increments5/10). Fixture title28 chars, description61, slugabout, Indexed computes80. | Use consistent calculated80 in SEO/Listings, retain breakdown/help through visible or disclosed path. Do not silently replace scoring model. |
| B3-R07 | Layering clarity | Settings and dirty-confirm screenshots have no scrim/inactive background. Nested guard looks like a floating card while all background controls retain full emphasis. | Add modal visual layering and topmost focus/Escape contract; keep background inert. Save/Cancel on obscured dialog must not compete with guard actions. |
| B3-R08 | Author-known local corrections | Rename card not inline-expanded; About menu not anchored to About row. | Inline rename expansion with URL decision and row-aware anchoring; no overlap/clipping. |
| B3-R09 | Connected-flow incomplete | No reviewed return screen/route ledger links from saved settings, redirect repair, cancel, or failure retry; no prototype verified. | Provide bounded connected path and explicit endpoint/return annotations, including settings Cancel cannot undo previously applied rename. A static frame inventory is not completed flow playback. |

Additional maintenance/identity note: initial manager screenshot uses a document glyph for Home and Studio folder. Preserve recognizable homepage/folder distinction and folder disclosure/indentation from current capabilities; no generic file glyph for every resource type.

## Positive evidence

- Off-page target is explicit: About settings while Home canvas/Text selection/Desktop1440/52% remain. Active Home strip highlight and Inspector selection remain visible in sampled settings states.
- Manager560×700 atx12/y156,56header/48footer; settings720×700 atx360/y112 with56header/48footer and separate tabs. Normal desktop content fits; no required control clipped in sampled screenshots.
- Compact input masters/component instances reused (manager170instances, SEO140), latest28px treatment retained. This is native component reuse, not a flattened image.
- SEO/Social/Advanced tabs present. SEO indexing is the editable owner; Advanced has read-only summary + Change in SEO. Publish visibility separately explained as next-publish inclusion.
- Live URL consequence correctly describes old/new paths and post-publish effect; Cancel/Change URL available. Dirty guard names About and preserves Home; Keep editing primary. Save failure retains form and offers Retry save.
- No-results frame retains exact query and Clear search. Menu includes duplicate/home/templates/reorder/copy/settings/delete doors.

## Geometry/interaction limits

Bodies named “one scroll region” have clipsContent=true but overflowDirection=NONE in initial readback. Current desktop samples fit (manager childBottom581/body593; SEO436/body549), so no immediate clipping defect there. Real/prototype overflow, sticky regions and short/narrow behavior are NOT VERIFIED.100-page/long-name,200% text, role/offline/stale target, collision and concurrent-save states are not covered by these screenshots. A single-line fixture does not validate long text.

Current created state labels “Saved just now” in the shared bottom bar are inherited fixture copy. Handoff must distinguish current Home save receipt from About draft/failure and never announce remote save merely from local document application.

## C2 gates at this checkpoint

- G1 PASS for stated source/contract evidence scope; source fixture score needs B3-R06 correction.
- G2/G3 PARTIAL: target and ownership correct in sampled settings; coherent recovery/listings/structure representation pending.
- G4 PARTIAL: normal desktop fit confirmed; short/narrow/reflow and scroll playback NOT RUN.
- G5 FAIL for stale identities and missing connected returns/actions (R01/R02/R09).
- G6 PARTIAL: core error/dirty states represented; modal hierarchy/control preservation corrections pending, keyboard NOT RUN.
- G7 FAIL for omitted direct social URL path/recovery actions and placeholder views.
- G8 NOT RUN: design-only; app/runtime/persistence/restore-ID integrity not established.
- G9 PARTIAL: decision record exists; scoped risk/route/dependency handoff still needed.

Readiness: **PARTIALLY VERIFIED; scoped corrections required.** Do not call fullB3 or this connected flow complete at initial checkpoint. Later targeted closure may supersede these findings without erasing history.


## Targeted correction review — second checkpoint

Independent readback of corrected frames, new repair/save/return nodes65:18435,65:18981,67:11341 and retained-Home nodes67:11915/67:12583. Final author polish was still underway. Screenshots inspected: `/tmp/b3-guard2.png`, `social2`, `listings2`, `structure2`, `repair2`, `deleted2` (same /tmp/b3- prefix, PNG). Prototype reactions were read statically; route playback remains NOT RUN.

### Corrections verified

- Initial R01 visual identities corrected: deleted manager count4 and no About strip entry; renamed result/redirect settings use Our story in strip. Dedicated retained-Home deleted/renamed editor frames avoid resetting mutations merely by closing a sheet. One reopening branch remains wrong, below.
- R02: Keep URL result includes Undo wired back to original manager; Restore result includes explicit Open About in Editor. Author explicitly states Open's destination is not represented/wired in this slice, so capability is visible but end-to-end navigation is still pending.
- R03 visual recovery structure substantially corrected: no normal view tabs/create footer; Back to Pages,48px metadata row, slug/no folder/deleted by/age/retention, Restore; Editor fixture omits ADMIN+ permanent delete. The snapshot repeats deleted-by/retention beneath the row (minor redundancy). Persistent U-7 dependency still needs written handoff verification; initial decision record remained unchanged at this read.
- R04: Listings now has real aligned page/URL, SEO score and Visibility columns; About score80. Structure has distinct URL list/root and separates personal folders, but Blog indentation remains wrong (below).
- R05: Social direct URL field restored with clear-to-remove and1200×630 guidance; description multiline and61/160; title28/60; empty social fallback explained. SEO multiline/counters/page-override helper also represented. Social screenshot is legible and fits.
- R06: Canonical fixture score80 correct; failure/dirty draft title `About Fieldwork — independent design studio` (43chars) computes90 and remains in guard/failure screen. Exact redirect return67:11341 retains clean title28/score80 and new slug.
- R07: Scrims now separate modal dialog and topmost dirty guard; background visually inactive. Guard three actions fit480px card. Keyboard/inert enforcement not tested.
- R09: Captured redirect target pageOur story with /about→/our-story; Save redirect→saved65:18981→Back to Our story SEO67:11341 is statically wired. Exact SEO return retains renamed identity, new slug and redirect-saved/next-publish message. Cancel from already-applied URL settings returns to changed-URL manager, so it does not revert committed rename. This is a selected graph, not full flow playback.

### Remaining bounded findings

| ID | Finding | Evidence / required action |
|---|---|---|
| B3-R10 | **Blocking prototype branch corruption** | Keep URL63:23182 Close→67:11915; its Pages action→64:10927, which shows `/our-story`, not kept `/about`. Use distinct kept-URL retained editor/reopening branch, or leave unsupported reopen unwired and annotate. A shared visible name cannot substitute for distinct URL state. |
| B3-R11 | Guard copy contradicts three choices | Heading `Leave without saving?` and body says changes `will be discarded`, yet Save and leave is offered. Use `Unsaved page settings` with conditional Save/Discard/Keep wording. Keep editing currently returns failed-draft63:18189 preserving title43/score90; Save and leave→success64:18356; Discard→original63:6393. Runtime failure-on-save must remain specified, not implied impossible. |
| B3-R12 | Structure tree misrepresents URL ancestry | Site root, Blog `/blog`, Blog post `/blog/{slug}` text share x57, while Home/other root children arex81. Indent Blog as root child and Blog post under Blog, with clear hierarchy. |
| B3-R13 | SEO helper clipping / unfinished fit polish | In guard screenshot bottom helper is clipped by fixed footer. Author already correcting. Verify body overflow and reachable helper; no claim all settings fit until final screen. |
| B3-R14 | Handoff/readiness limitation | Updated route/state/dependency record not yet available in B3-pages-start.md at this read. Require explicit U-7 target/fallback, unwired Open About destination,95-transition versus playback distinction, pending source states and short/narrow checks. Full connected B3 remains incomplete. |

Topbar text in captured repair/recovery screenshots looks externally clipped at top while readback has correct56px topbar and child y12. This is an artifact/overlap suspicion, not a confirmed geometry mutation. Check isolated screenshot or canvas arrangement before publishing comparison images.

Current status: **PARTIALLY VERIFIED.** Many initial content/visual defects closed; one verified wrong URL branch plus final guard/tree/fit corrections remain. Static graph counts are not route execution, and unrepresented Open About prevents end-to-end restore→open verification.


## Final bounded checkpoint — corrections and declared limits

The final review remains **PARTIALLY VERIFIED**, as requested for this first connected slice. It is not DESIGN READY for all Pages or fullB3 and is not runtime verification.

Targeted closures:

- **R10 closed:** Keep URL63:23182 Close now goes to distinct retained editor69:19044; its Pages action returns63:23182 (`Our story`, `/about`). Changed-URL retained editor67:11915 continues to64:10927 (`/our-story`). Both branch destinations were independently read; no silent slug switch remains in these inspected links.
- **R11 closed:** Guard retains shared heading `Leave without saving?` but body now conditionally explains Save, Discard or Keep editing. Three visible actions map to preserved failed draft, original manager, or saved result respectively. Written handoff says failed Save and leave cannot navigate. Runtime branching remains NOT RUN.
- **R12 closed:** Structure readback now has root textx57, Home and Blogx81, Blog postx105. URL ancestry is represented correctly in this fixture.
- **R13 closed for inspected normal SEO:** body gap8, height549, childBottom520, VERTICAL overflow. Final isolated screenshot `/tmp/b3-seo-final.png` shows full-width description and helper entirely above footer, no clipping. Other short/narrow/extreme-content cases remain unverified.
- **R14 closed as scoped documentation:** updated B3-pages-start.md enumerates27 frames, preserved capabilities, U-7 dependency/session-only fallback, unlinked Open About, pending restricted/long/narrow/dirty-redirect cases and explicit structural-links-versus-playback distinction. The record does not claim fullB3 complete.
- **R08 structurally addressed:** rename decision is nested in Pages body (536×170 expanded form), not an unrelated overlay; menu item top aligns with About row in readback. Desktop screenshot/geometry evidence is bounded; keyboard and contextual-menu clamp playback remain untested.

Earlier R01–R07 corrections are supported by the preceding second-checkpoint evidence; R02/R09 remain **partial at the complete-task level** because Open About is intentionally represented but unwired and several cross-area/error branches remain specified only. Do not turn a visibly present action into a reachable-flow claim.

Final C2 assessment: G1 evidence/declared coverage PASS for this bounded review; G2/G3 ownership/placement PASS for represented branches; G4 normal1440×900 fit PASS, responsive/expanded-content NOT RUN; G5 selected route graph reviewed with kept/changed URL identity corrected, actual playback NOT RUN and declared endpoints pending; G6 state/control specification PARTIAL, keyboard/assistive technology NOT RUN; G7 represented preservation improved with explicit remaining paths, full capability coverage PARTIAL; G8 NOT RUN; G9 scoped handoff PASS with limits. No remaining **observed** blocker in the corrected inspected branches; unrepresented paths and unrun checks still prevent whole-slice/full-phase readiness.

Remaining work: Open About destination and return; broader page actions; long lists/nested paths; narrow/short/200% text; viewer/offline/plan/stale-target; restore collision/missing-folder/bulk/expiry/Admin permanent-delete; dirty redirect navigation and failure; actual keyboard/prototype playback and app persistence/Undo/restore-ID checks. Initial external-canvas clipping suspicion was not established as a native geometry defect; final isolated SEO export is clean, other publication exports should retain author screenshot validation.

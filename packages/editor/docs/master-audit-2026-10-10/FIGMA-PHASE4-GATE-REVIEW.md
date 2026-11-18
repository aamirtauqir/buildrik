# Phase 4 independent gate review

Reviewed 10 October 2026, 16:00 UTC. **Gate 4 remains open while the pending native states and visual comparisons are completed.** The remaining work is bounded: finish the captured CMS/media/history/selection/component additions, cover a few missing task-specific Inspector/chooser/confirmation states, and reconcile their evidence. A higher frame count alone does not close the gate. No requirement to force provider success, alter roles, publish, send messages, or obtain additional approval is introduced here.

This review reads existing reports, source and capture JSON. It does not operate the browser or Figma, modify application code, or independently inspect the latest live Figma nodes. It uses [40-family coverage](AS-IS-SCREEN-COVERAGE.md), [workspace states](AS-IS-WORKSPACE-STATE-SPEC.md), [Inspector states](AS-IS-INSPECTOR-STATE-SPEC.md), and [P4-01–10 acceptance](PHASE-4-5-6-ACCEPTANCE-CHECKLIST.md). These documents describe representative major states, not an obligation to manufacture every possible data/error combination.

## Evidence snapshot and credit

The coordinator reports **65 native screens**, including Brand 58–65, and is adding the 20 captures mapped below plus a component workflow. The on-disk [central ledger](evidence/figma-as-is-frames.json) contained **57 entries when read for this review**. This is a reconciliation lag, not evidence that frames 58–65 are absent. Do not silently promote coordinator-reported creations into independently read-back or compared states.

- [First-ten report](FIGMA-FIRST10-FIDELITY-REPORT.md): Review, Heading and CMS received matching screenshot comparisons; seven other frames received scoped node checks.
- [Frames 11–35 report](FIGMA-FRAMES-11-35-FIDELITY-REPORT.md): all 25 received source/native checks, 18 renders were inspected, and seven had matching browser comparisons. The report names those seven and the retained font/wrap/opacity limits.
- Frames 36–43 have retained browser/after images and [correction ledger](evidence/figma-36-43-ledger.json), plus [additional control corrections](evidence/figma-36-43-extra-ledger.json). Their aggregate comparison disposition should be linked in the final ledger rather than inferred from file existence.
- [Settings 44–57 report](FIGMA-SETTINGS-44-57-FIDELITY-REPORT.md): all fourteen have native structure checks; eight were screenshot-compared. Domains, Form submissions, Languages, Danger zone, Billing and Integrations received bounds checks only in that pass.
- Brand 58–65 is coordinator-reported native work with fidelity correction in progress. The split-caption extraction defect was diagnosed and corrected in the helper; existing affected frames require the assigned explicit correction, not merely a new helper version.
- The upcoming 20 have existing PNG and JSON files. Nineteen JSONs record 1440×900; `page-menu` records 1280×720. Capture timestamps span 15:41–15:48 UTC. This review read their text/geometry metadata, **not their pixels**. No native ID or comparison is credited before the coordinator supplies it.

## Exact mapping of the upcoming 20 captures

Each key means `/tmp/buildrick-KEY.png` and `/tmp/buildrick-KEY-layout.json`. These temporary pairs must be retained under audit evidence with the corresponding native ID and comparison disposition. Frame numbers have deliberately not been assigned here.

| Capture key | AS family / state | What the actual JSON establishes | Boundary that remains |
|---|---|---|---|
| `cms-landing` | AS-18; W-C02 | CMS root with one collection/one record and **Select a collection** | Not a zero-collection screen or collection-creation dialog |
| `cms-field-detail` | AS-20; W-C09 | Fields table and selected Title text field; name/key/required/min/max/usage/delete door | Not reference/options field variants or committed schema edits |
| `cms-dynamic` | AS-20; W-C05 dynamic-page destination | URL/template/SEO pattern controls; **No pattern set — this collection generates no pages** | Not configured/generated/published pages |
| `cms-settings` | AS-20; W-C05 settings destination | Collection name/slug, Buildrik CMS source, Rename and Delete collection doors | No rename/delete/sync executed |
| `media-detail` | AS-17, AS-16 context; W-M05 | Selected 320×180 WEBP, alt field, versions/use summary, Insert/Edit doors | Full-library detail, not quick AssetDetailOverlay |
| `media-properties` | AS-17; W-M05 expanded | Expanded Tags/Used in, **Not used on this site** | Not a version restore or usage jump |
| `media-edit` | AS-17 | Image editor Crop/Adjust/Resize/Optimise tabs, crop controls, Cancel/Save version | Only current Crop body; no edited or saved version |
| `media-menu` | AS-17, partial AS-07; W-M05 | Full-library detail overflow: Rename, Replace across site, Optimize, Delete | Not quick Assets `MediaContextMenu`; no command execution |
| `history-published` | AS-33 | Published tab **No published versions yet** | Valid current empty state; no deployment required |
| `version-menu` | AS-33 | Saved checkpoint overflow: details/name/restore/compare/delete | Not Restore confirmation or completed restoration |
| `history-compare` | AS-34 | Inline Saves comparison with Visual/Semantic, two content differences, Get AI Summary | Not full CompareHost, approved-baseline comparison, or AI summary success |
| `view-menu` | AS-08 | Snap guides, Spacing, Grid, Rulers, Badges, X-Ray, Breakpoint, Zoom | Menu state, not gesture/snap execution proof |
| `breakpoint-menu` | AS-08 | Desktop selected, Tablet 768px, Mobile 375px, Custom width door | Custom-width dialog not shown |
| `mobile-canvas` | AS-08, AS-06 PagePanel | 375px editing canvas inside 1440×900 editor; Page inspector visible | Not Mobile Preview, constrained editor viewport, or I-HM selected-heading override |
| `multiselection` | AS-06, AS-11 context | Four selected, mixed Elements header, Align/Distribute/Group and mixed Style fields | Not same-type I-MH or a proven lock/breakpoint-safe alignment operation |
| `locked-selection` | AS-06, AS-03; I-LOCK | Heading, Locked mark, **Locked — unlock to edit**, retained Style sections | Not viewer-role permissions or proof every indirect write is gated |
| `container-style` | AS-03, AS-09 context; I-C Style | Layout Display/Position, Size/Spacing/Fill/Border/Text inside | Link belongs to Behaviour and is not shown here |
| `form-style` | AS-03; I-F Style | Form’s Layout and Style sections, Name/Email/Submit on canvas | Does **not** cover AS-04 Form Fields/After submit |
| `empty-page` | AS-01, AS-06 PagePanel | Actual empty existing page with starter cards and Start blank | Not fresh-user coach/checklist visibility; 1440×900 only |
| `page-menu` | AS-07, AS-12 | Page row overflow including Replace layout, Settings and Delete | Does not prove physical right-click, Home deletion eligibility, or all menu owners |

Component captures now present locally are `component-create-v2`, `component-instance-v2` and `component-menu-v2`. They map to **AS-10**, with the latter two also **AS-03/06**. The JSON shows **Audit As-Is heading 1010**, one saved component, a selected heading instance and Reset/Detach actions. This is a heading-based component representative, not the spec's container-based I-COMP/I-COMPO layout-suppression pair. Master detail/edit mode remains pending coordinator capture at this snapshot. Creation and local instance state do not prove durable cloud retry/update contracts WS-02/03.

## Material obtainable gaps before gate closure

The following are the remaining high-value gaps after crediting the pending batch. Capture current states through their real controls; record a concrete access failure if a door is unavailable. Do not expand this into every minor submenu or all 55 registered element types.

| Priority / coverage | Missing major distinction | Safe evidence to finish |
|---|---|---|
| 1 — P4-02/03, AS-04; I-F | Form Behaviour is a different task surface from Form Style | Select existing audit Form → Behaviour; capture Fields and After submit, including its genuine loading/error/configured condition. Opening is enough; do not change delivery recipients or submit a form. Include container/link Behaviour if no current Link destination representative exists. |
| 1 — P4-03, AS-04; W-C11 | Current image Behaviour shows Static/From CMS but no collection/field/record chooser | On an unbound eligible heading, From CMS is local `setCmsChosen(true)`; collection choice stays local until Field is chosen. Capture picker state without choosing a binding field. `CmsBindingSection.tsx:126–132,245–280` identifies this boundary. Existing bound state can be captured if already available; deleted-source failure need not be manufactured. |
| 1 — P4-03, AS-05 | Effects tab does not represent the interaction editor | Interactions lives under **Behaviour**. `interactions-add` only opens AddInteractionPanel (`sections/interactions/index.tsx:172–180`). Capture trigger choices and an existing editor if present. Selecting a trigger adds an interaction, so do not describe the complete editor as a read-only opener. Keep unsupported playback/reverse behavior annotated. |
| 1 — P4-02/03, AS-15; W-M03 | Assets launcher/full manager are not a property-owned chooser | Select current image → `inspector-source-door` Choose image/Replace; capture **For… / Choose image** and cancel. `SourceRow.tsx:120–138` separates opening from the selection callback that writes source. Caller/type and cancel return are load-bearing. |
| 1 — P4-03/04, AS-03/08; I-HM | Mobile PagePanel does not show selected-element responsive origin/override controls | Select existing heading at Mobile, capture actual chip/override/revert fields and State menu. Use existing overrides; do not invent override values or repair UX-10/25. A representative token picker should also be captured from a property; Brand ColorPicker is a different owner. |
| 1 — P4-02/03, AS-10 | Empty component manager is inadequate once a real component fixture exists | Complete populated drawer/master-detail/instance capture and comparisons already underway. Preserve master versus instance identity and the heading-based fixture's type sections. |
| Bounded tool limitation — P4-03, AS-07/11 | Canvas, Layers, Pages and media menus have distinct owners | Pending Page menu and manager overflow do not replace actual LayerContextMenu and quick MediaContextMenu. Root reports native right-click CDP `Input.dispatchMouseEvent` explicitly denied by the tool allowlist; Shift+F10 did not open the menu. Do not bypass the denial. Retain existing Layers PNG and the 55-type source/action matrix, with these native-trigger variants explicitly unavailable in this capture pass. |
| 2 — P4-05, AS-14; W-T04/05 | Template preview is not its create/replace confirmation | Open current create and/or replace confirmation and cancel. Replace's backup checkbox and scope are material; ordinary New page dialog is not equivalent. `TemplatesTab.tsx:207–215` establishes local create-confirm state. No Apply, checkpoint, retry or replacement required. |
| 2 — P4-05, AS-19/23/38; W-C08/W-S06 | No native representative yet establishes a dirty-exit/cancel guard | Use one existing authorized disposable draft/cancel path if available and retain dirty state without saving. One genuine guard is sufficient representative evidence; do not force conflicts/session expiry to multiply variants. If no safe draft fixture is available, state that specific limit. |

CMS import mapping, new-collection form, redirect add form, custom-width dialog, quick asset detail, font/icon chooser and extra field types are subordinate gaps. They should be mapped to an existing representative or explicitly noted as uncaptured; they do not each require a separate full-screen frame to establish the major current UI. Open them when readily reachable during the above passes, without submitting or fabricating values. Brand's additional token-kind tables are similarly variants after its distinct Styles/Classes/Presets/Checks/Starters/transfer destinations are covered.

## Forty-family reconciliation

“Pending” below means specific existing runtime captures awaiting native readback/comparison, not generic unexamined coverage. Existing native representatives still require their documented fidelity limits and comparison disposition.

| Families | Current representative / pending evidence | Gate interpretation |
|---|---|---|
| AS-01 | `empty-page` pending; earlier genuine onboarding PNGs | Empty editor covered after render; fresh-coach variant remains earlier runtime only |
| AS-02 | Shell throughout 01–43; Site menu 17 | Major surface represented |
| AS-03 | Heading 02/36, Image 37; container/form pending | Complete selected responsive/token-picker distinction above |
| AS-04 | Image Behaviour 38 | Form/link/CMS chooser still material |
| AS-05 | Effects 39 | Interaction add/editor distinction still material |
| AS-06 | Page 32/40; multi/locked pending | Current contexts represented after comparisons; conflict remains fixture-limited |
| AS-07 | Element actions 03; page/media-overflow pending | Layers/quick-media native trigger is tool-blocked; preserve source matrix and do not over-credit manager overflow |
| AS-08 | View/breakpoint/mobile editing pending | Responsive selected-element distinction remains; gestures have explicit runtime limitations |
| AS-09 | Add 06; container/form captures show catalogue continuation | Major catalogue represented; drill-in/minor dialog variants bounded |
| AS-10 | Components 07/29 plus new create/instance/menu captures | Populated/master workflow and comparisons pending |
| AS-11 | Layers 04 plus multiselection pending | Hierarchy represented; tree-drag transient remains unverified |
| AS-12 | Pages 05 plus page menu pending | Major surface represented; folders/rename/Undo are subordinate documented variants |
| AS-13 | New page 33; page SEO/Social/Advanced 41–43 | Major surface represented; guard is separate state coverage |
| AS-14 | Gallery 27/preview 28 | Confirmation scope remains obtainable and material |
| AS-15 | Quick Assets 08 | Property chooser still missing |
| AS-16 | Full Media 09 plus selected library pending | Major manager represented; upload/error sequences are historical runtime, not current successful cloud proof |
| AS-17 | Detail/properties/editor/menu pending | Distinct detail/editor destinations covered after comparison; quick owner/icon/font variants bounded |
| AS-18 | `cms-landing` pending | Landing represented; new-collection form subordinate |
| AS-19 | CMS records 10/draft sheet 11 | Major record editing represented; validation/guard/import variants bounded |
| AS-20 | Fields 12 plus detail/dynamic/settings pending | Previously missing whole destinations accounted for |
| AS-21 | Brand 13–16 plus colour-mode in reported 58–65 | Major color/type/spacing represented; extra kinds and role states bounded |
| AS-22 | Reported Brand 58–65 (Styles, Component styles, Classes, Presets, Checks, Starters, transfer) | Native ledger and completed fidelity report still required |
| AS-23 | General 18/Overview 44 | Major destinations represented; dirty guard separate |
| AS-24 | Site SEO 45/Redirects 46 | Represented; not confused with page SEO 41 |
| AS-25 | Domains 47/Access 48 | Genuine empty/off states suffice; configured DNS/share success not required |
| AS-26 | Analytics 49/Form submissions 50 | Genuine off/empty states suffice; provider/delivery success not required |
| AS-27 | Languages 51/Custom code 52/Headers 53 | Major destinations represented; plan/localization limitations retained |
| AS-28 | Danger 54/workspace doors 55–57 | Handoff screens count; downstream dashboard is outside editor reconstruction |
| AS-29 | Selected-heading AI 26 | Current composer represented; provider output remains unavailable/unexercised |
| AS-30 | Desktop/Mobile Preview 30/31 | Content preview represented; scripts/forms/animation not certified |
| AS-31 | Publish checks/targets 25 | Current read state represented; deployment/history success requires existing data |
| AS-32 | Review empty 01; earlier failed-load runtime | Current genuine empty view valid; real threads/client rounds absent |
| AS-33 | Session 19/Saves 20 plus Published empty/version menu pending | Three history meanings accounted for |
| AS-34 | Inline comparison pending | Full CompareHost/approved snapshot remains conditional on a genuine source pair |
| AS-35 | Issues six warnings 22 | Actual issue state represented; locate/autofix not assumed executed |
| AS-36 | Notifications empty 21/Activity event 23 | Genuine current states represented; older failures remain historical |
| AS-37 | Palette 24/Shortcuts 35 | Major surfaces represented; query/no-result variants subordinate |
| AS-38 | Saved shell/General evidence; recovery/session/role source paths | One obtainable guard preferred; destructive failure/role forcing not required |
| AS-39 | Export options 34 | Options represented; build/download success not inferred |
| AS-40 | Source-only share/client-review boundary | Specific permissible limitation: opener can create a token, no reusable authorized token/client fixture established |

## Explicitly blocked or unsuitable states

Keep these named limitations without treating them as newly required approval gates:

- **AS-38 / I-CONFLICT / W-S05:** no genuine viewer/conflicting-session/expired-auth fixture has been established. Do not spoof roles, corrupt data, or sabotage the session to manufacture UI.
- **AS-40:** Share preview may create a share token on open; client review requires a real authorized token/round. No send/re-send/comment/sign-off/revoke operation is required.
- **AS-29/31/33:** provider AI output, real deployments/published versions and external delivery require side effects or pre-existing data absent here. Empty/off/failure states are valid current representatives.
- **AS-34:** the current inline saved-version comparison is accessible. Full CompareHost has no established current UI door: Review action menu requires a round (`ReviewTab.tsx:387,407–414`), History approval band requires approved state (`SavesChrome.tsx:90,115,137`), and Published callbacks require an existing deployment row (`HistoryTab.tsx:373–386`). Ordinary Saves compare uses `VersionHistoryPanel.tsx:261–275` and inline CompareView, without emitting `UI_COMPARE_OPEN`. Internal CompareHost pickers supporting saved versions do not create an external entry. With current empty review/approval/published data, keep full host fixture-blocked; do not inject engine events to fabricate reachability.
- **AS-07/11:** root confirmed native right-click `Input.dispatchMouseEvent` is denied by the browser tool allowlist; Shift+F10 was attempted without a menu. Preserve [55-type menu source matrix](evidence/context-menu-type-matrix.json), [menu audit](CONTEXT-MENU-AUDIT.md) and existing Layers screenshot. Native trigger proof remains unavailable; do not circumvent the denied mechanism.
- **W-C07/I-CMSX:** backend conflict/gone/deleted binding-source variants require a genuine fixture; do not delete records/collections merely to obtain them.
- **W-M07–10:** retained historical upload/registration-failure evidence remains useful. Additional upload, remote replacement/deletion or media repair is not necessary for reconstruction. A local asset does not establish successful cloud persistence.
- **W-T06/07, W-B07, W-S07:** backup failures, token generation/restoration, DNS/OAuth/billing/archive/transfer effects and success outcomes are source-only unless an existing captured fixture supplies them.
- Native drag/reorder/resize transients and animation playback remain the documented runtime/tool limitations from Phase 2. Settled state frames plus precise annotations can represent them without staging a fictitious successful gesture.

## What closes this gate

1. Render/read back the pending captures and component states; finish the material distinctions above or record a specific genuine unavailable door, rather than merely calling an obtainable screen source-only.
2. Compare matching runtime/native representatives for the new destination types: selected CMS field/dynamic/settings, media detail/editor, populated component/master/instance, comparison, multi/locked selection and mobile editing. Preserve source product defects; correct only extraction artifacts. In media views verify actual image/preview content, not just text and frame counts. Whole-UI raster screenshots remain references, not native substitutes.
3. Finish the assigned Brand correction and retain its report. Check current v2 captures for iframe backgrounds/gradients, real ellipsis, pseudo controls, context stacking and documented font substitutions. A zero creation-error array does not prove fidelity.
4. Retain PNG + layout + native ID + comparison disposition per major state, update the lagging central ledger, and attach this 40-family reconciliation. State explicitly which Settings and older frames have structural-only checks. Representative comparison across the major surface types is the acceptance evidence; this review does not demand a new exhaustive pixel comparison of every duplicate state.
5. Confirm native text/vector/frame structure and reusable-controls provenance. Existing 11 sets/29 masters support P4-06; absolute DOM-positioned snapshots are not evidence of responsive Auto Layout behavior. Keep that limitation explicit and apply Auto Layout where composition actually warrants it.

**Recommendation:** keep Gate 4 in progress now, with a finite remaining capture/comparison/evidence pass. Once the major current UI and distinctions above are represented and compared, close with the named provider/role/transient limits. Do not hold Phase 4 open for unsafe success screens or treat Phase 5/6 prototype fidelity as a prerequisite for this current-state gate.

## Coordinator reconciliation follow-up — 99 native frames

The earlier 16:00 snapshot above is historical. [Closure checklist](PHASE4-CLOSURE-CHECKLIST.md) and [34-row mapping](evidence/phase4-coverage-reconciliation.csv) now reconcile the persisted 99-frame ledger. All material obtainable capture distinctions from this pass have native representatives, including components 86–91, CMS/interaction/Form/property/token/Mobile states 92–97 and actual template outcomes 98–99. Brand 58–65 and wide 36–43 have completed direct-comparison reports. Native 66–85 and 86–99 fidelity agents are still comparing; Gate 4 remains open for those results and final evidence accounting.

Frame 98 is an actual immediate empty-page replacement, followed by an Undo attempt; restoration was not verified and later Layers still showed Navigation plus two Sections, despite legacy filename `template-confirm-v2`. Frame 99 is the nonempty Home replacement confirmation with backup checked; Cancel was clicked. Do not credit 98 as a confirmation or claim 99 executed a replacement. Component 91 is the actual Edit master destination showing detail/Back to instance, not a fabricated dedicated master-edit canvas. Selected Mobile 97 shows context without an override count/revert line.

The remaining role/provider/native-trigger/full-CompareHost and lower-level state limits are bounded as documented. No further minor-state expansion or engineering fix is a prerequisite imposed by this review. Close Gate 4 only when the major representative comparisons and durable links finish; no TO-BE creation or implementation planning has occurred here.

Final evidence update: [66–85 comparison report](FIGMA-WORKSPACE-CANVAS-66-85-FIDELITY-REPORT.md) completes its 20 paired states, including replaced-in-place 79/84 and the explicit transient onboarding omission. [First-ten supplement](FIGMA-FIRST10-FINAL-RENDER-REVIEW.md) preserves 03–07 as unmatched native/metadata review, not direct pairs. Assets 08/09 addendum and 86–99 final comparisons remain pending at this update. Native 99-link index `8309:247874` aids navigation but adds no application screen. All 60 findings now have bounded AS-IS references in TRACKING-MATRIX and [annotation JSON](evidence/AS-IS-ISSUE-ANNOTATIONS.json); finding statuses and TO-BE pending state remain unchanged.

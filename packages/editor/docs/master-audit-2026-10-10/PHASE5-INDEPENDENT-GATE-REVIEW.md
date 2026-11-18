# Phase 5 independent gate review

10 October 2026. Checkpoint against 15 root, 11 Inspector and 12 workspace frames in the current ledgers. This is independent design QA, not application verification. This initial checkpoint kept Gate 5 open; the final recommendation at the end supersedes it after the documented supplements. Phase 6 prototype wiring is a separate deliverable; it is not being silently required to prove Phase 5 runtime behavior.

## Shared-control follow-up

The two actionable E01 component issues are corrected in the reviewed native screen. All eleven search/property outlines read back as `#8591A3`, measuring 3.193:1 against their white surroundings. All eight inspected button-instance labels now use horizontal FILL within their instance bounds, including header, zoom, canvas CTA and the new AI action. A fresh screenshot confirms the current labels fit. The old negative-x 160px text frames are gone. The selection badge still has an oversized text rectangle, but Heading glyphs fit; this is not a clipped-label finding.

The faint `#98A2B3` token remains unchanged, so its restriction to decoration/inactive controls still applies. The revised border is only 2.949:1 against `#F4F6F9`; it is suitable for the reviewed white-on-white field composition, not an unconditional guarantee for controls placed directly on the gray stage. The [contrast evidence](evidence/phase5-kit-contrast.json) retains the earlier pairs and adds the verified fix. Threshold interpretation follows the [W3C non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) retrieved in the initial review.

## Independently viewed frames

Fresh native screenshots were downloaded and viewed for all six rows. Readback is retained in [the follow-up evidence](evidence/phase5-independent-followup-native.json). Files are `/tmp/buildrick-p5-E01-followup.png` and equivalent E09/E10/E12/E13/E14 names. Scope is screenshot and native structure, without prototype playback or browser use.

| Frame | Result | Limit / action |
|---|---|---|
|E01 `8317:297`|1440×900; stage800, paper752 for 1200 CSS px; correct 72px→45.12px scaled hero; shared control fixes confirmed|No long-tree example; Layers overflow NONE is acceptable for these five rows only|
|E09 `8317:245051`|Publish blocked with unsaved document, pending review and unavailable server checks; disabled release and clear next action fit|Final confirmation/job/result states remain contractual; this is not a provider connection or deployment|
|E10 `8317:245216`|Mobile375 at100%; visual-only limitation and Back to editor visible; no incidental clipping found|Mobile navigation has been omitted, not compacted. Do not count this as UX-12 acceptance. Return/focus/same-document parity remain contracts|
|E12 `8317:245815`|1280×720; both docks leave640 stage; paper592; displayed49% is rounded. Inspector body513 is explicit VERTICAL scroll|Brand-token section below viewport is intentional scroll content; no failed-fit finding from that alone|
|E13 `8317:246015`|1024×768; left collapsed, right300, stage664 and paper616; displayed51% is rounded; Inspector body561 scrolls|Document save status disappears at this width. Retain a compact status/error affordance rather than lose feedback. Temporary left chooser is specified but not depicted|
|E14 `8317:246182`|720×450 effective CSS viewport; one focused property task, stable header and explicit394px vertical scroller|Move the implementation phrase “canvas and covered chrome are inert” out of the user-facing content into its design note. This is a geometry scenario, not actual200% browser-zoom testing|

E12/E13/E14 intentionally clip descendants below their VERTICAL scrolling bodies; these should not be reported as lost controls. No scroll interaction was executed. Scale differences between independent fixtures are mathematically correct; the E13 note requires zoom not to change silently when panels open, which remains a transition contract to validate later.

## All 60 finding rows reconciled

[The acceptance matrix](PHASE5-CRITICAL-FINDING-ACCEPTANCE.csv) now references actual frame IDs from the current ledgers. IDs/priorities and original proposed criteria are preserved. Each row adds coverage class, remaining gap and review scope. “Representative native + contract” means a treatment exists, not that every criterion or runtime operation passes.

- 39 representative native treatments plus explicit behavioral contracts.
- 9 partial native treatments, with the unshown criterion named.
- 8 missing native states: UX-01/02/13/15/16/17, CI-02 and WS-03.
- 4 governance/engineering annotations: IA-14/16, WS-05 and RR-01. Their contextual frames are not visual solutions to backend/security or coverage-governance problems.

[Mapping validation](evidence/phase5-acceptance-mapping-validation.json) confirms all referenced frame IDs exist in current ledgers. [Read native annotations](evidence/phase5-native-finding-annotations.json) substantiate root/Inspector scope. Workspace mappings additionally rely on the [workspace owner's final visual review](PHASE5-WORKSPACE-DESIGN-REVIEW.md); this agent does not claim to have independently inspected all twelve workspace screenshots or all eleven Inspector screenshots.

## Bounded remaining Gate 5 gaps

1. **First-use entry and collection creation.** One coherent empty editor/onboarding treatment should resolve UX-01/02/13, and an empty CMS→first-collection treatment should resolve UX-15/16/17. Populated catalog/records screens do not show these failures addressed. This is a small set of major journey states, not a request for every arbitrary modal permutation.
2. **Preserved controls and capability honesty.** Add a representative Effects state with a distinct Interactions section and honest unsupported-reverse treatment (CI-02); confirm advanced typography/classes/attributes remain reachable through the chosen tabs. A small library error/retry state is needed to distinguish failed From Library from empty (WS-03). Component-specific mirror failure can be a clearly scoped native annotation/state inset if the existing E15 recovery screen is reused.
3. **Responsive feedback and meaningful mobile navigation.** Correct E13's missing save feedback, move E14's implementation wording into notes, and show the compact-navigation affordance or explicitly defer UX-12 instead of treating removed navigation as a solution. The documented one-temporary-drawer behavior needs a clear state or diagram before claiming it is covered.

The nine partial rows do not each require another whole screen. Long-label expansion, inherited alignment, four-corner menu placement, neutral/invalid validation and initial next-step labels can be reviewed in existing screens, small variants or explicit native state annotations. They must retain their honest coverage classification until that evidence exists.

Backend target authorization, durable retries, credential storage, computed responsive parity and actual gesture correctness remain engineering dependencies. Those cannot be fixed by a visual treatment; their explicit annotations are an appropriate design deliverable. This review neither requests implementation nor changes deferred Phase 7/8 scope.

## Root correction addendum

After this independent screenshot checkpoint, root supplied [responsive QA corrections](PHASE5-RESPONSIVE-QA-ADDENDUM.md): E13 now has compact save indicator `8318:747`; E14 implementation wording was replaced with ordinary scroll/return guidance; E10 now has Mobile Menu `8318:749`, with expanded state pending. These two feedback/copy gaps are root-verified closed; UX-12 is now partial, not missing. The native panel/interaction board `8318:522` supplies nine Auto Layout contract cards and was screenshot-reviewed by root. Its references are added to relevant matrix rows as contract evidence, not gesture/focus execution. The earlier six screenshots remain a pre-correction independent checkpoint. Root/agents are preparing empty editor, collection entry and Effects/Advanced states; they are not credited until supplied.

## Final supplementary reconciliation checkpoint

The preceding gap counts are historical. The current matrix has **54 representative native treatments plus contracts, 2 partial native treatments, 0 missing native states, and 4 governance/engineering annotations**. All 60 exact IDs and priorities are retained. Root E16/E17/E18–21, Inspector IN-12/13 and its advanced/effective-state specimens, workspace TB-G05/G06 and the new R01 recovery insets address the previously missing major families. No runtime issue is marked fixed.

E16 (`8318:2045`) and E17 (`8318:2204`) were independently viewed and read. E16 presents one primary Add action, a secondary template choice, one tip and a no-selection Inspector. E17 presents expanded mobile Work/About/Contact with a Close control, complementing E10's Menu state. The suspected rail clipping is unsupported: rail PNG pixels are identical between E16, E17 and the earlier E10 in x0–60/y56–420. E17's full and isolated exports are identical, no page sibling intersects it, and 42px text boxes fit inside their 46px parents. [Rail comparison evidence](evidence/phase5-rail-comparison.json) preserves the method and result. No rail changes were made.

TB-G05 (`8318:243842`) and TB-G06 (`8318:244095`) screenshots were independently viewed. The former shows the empty CMS and first collection draft with consistent wording, no fictitious completed step and a duplicate-key refusal; the latter compares untouched and invalid General fields. Inspector IN-12/13 and advanced typography/alignment specimens are mapped from the owner-reviewed final ledger; this agent does not claim independent visual review of those additions. Root E18–21 provide initial page-action labels, expanded long names and a temporary 1024 drawer.

### R01 recovery insets

Created [R01 `8318:243977`](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8318-243977) only in the assigned x3400/y7500 area. [The screenshot](evidence/tobe-root-validation/R01-recovery.png) was independently inspected: native readable text, two Auto Layout cards and action rows, four shared button instances, Inter, no raster fills. [The exact ledger](evidence/figma-tobe-recovery-insets.json) includes all 28 created node IDs and four action IDs. Existing application, original/AS-IS pages and other agents' frames were untouched.

The library card `8318:243980` distinguishes failed From Library from empty and gives scoped Retry/Back. The component card `8318:243991` distinguishes local session change from unconfirmed remote update and warns that reload can lose retry work. Current `fetchComponentLibrary` catches at `src/services/componentSync.ts:190–193` and returns `[]`; `SyncRetryQueue` stores closures in an in-memory Map at `src/services/syncRetryQueue.ts:58`. New retry controls/error propagation are proposed design contracts, not claims those exact controls already exist or that reload durability is implemented. Reconnect/manual retry must use the same target and preserve caller; success needs server acknowledgement. No service operation ran.

Shared-kit discovery used the existing local registry, verified native instances and current Inter/token conventions. No matching Code Connect files were found in `src`. Existing native text styles/variables were inspected; the authorized Phase 5 kit was reused rather than creating another component system. Formal Phase 6 token binding and prototype wiring remain separate.

### Exact residual partial coverage

- **UX-01:** E16 demonstrates the empty editor at 1440. Its 440px start card fits the 592px paper available in E12's 1280 geometry and the 616px paper in E13's 1024 geometry, but those combined empty/responsive states have not been rendered. This is a remaining layout-state check, not a missing core workflow.
- **IA-15:** IN-09 demonstrates lower-right placement with a left-opening submenu; the panel/interaction board states the other-corner and measured-height rule. All four corners and long-menu scrolling have not been separately rendered/executed. This is bounded placement validation, not missing action ownership.

No other major obtainable design family remains absent in this reconciliation. These two precise validation limits must stay visible in Gate 5 closure wording; they do not require expanding into arbitrary modal permutations or pretending native prototypes prove browser behavior. Parent owns the final gate decision and complete native acceptance/readability review. Phase 6 must wire representative flows and retain explicit simulation limits. Phase 7/8 remain deferred.

## Final Gate 5 recommendation

**Recommend closing Gate 5 for the bounded native design scope.** Root supplied and visually reviewed E22 `8320:759` (1280×720 empty editor), E23 `8320:918` (1024×768 empty editor), and menu placement board `8319:759`. The [final responsive addendum](PHASE5-RESPONSIVE-QA-ADDENDUM.md) records visible first actions/save feedback, four menu corners with at least 16px gutters, and a short-height VERTICAL menu specimen. These are root-reviewed additions; this agent did not independently re-render them.

The final all-60 matrix now contains **56 representative native treatments plus explicit behavioral contracts and 4 governance/engineering annotations; no remaining partial or missing native design family**. UX-01 and IA-15 references are updated to this final evidence. Every exact finding ID and priority still matches the original tracking matrix. Classification is design coverage, not a claim every acceptance criterion has been executed in a real application. The four annotation-only findings remain IA-14, IA-16, WS-05 and RR-01, whose coverage/security requirements cannot be repaired visually.

The recommendation rests on representative workflow/state coverage, source-grounded capability preservation, actual native references and attributed visual reviews. It does not require 55 separate rendered menu permutations, execution of external providers, or extra arbitrary modal states. All 55 type capabilities remain in their explicit source/proposed matrix; one shared menu contract plus representative native cases carries their design behavior.

Phase 6 remains responsible for finite prototype connections, shared-system finalization and an action audit with explicit simulation limits. Actual resizing/cancel correctness, computed style/output parity, keyboard/screen-reader semantics, service acknowledgement, reload durability, permissions, credential storage and provider operations remain engineering/runtime dependencies. No application implementation is approved or claimed, and Phase 7/8 remain deferred.

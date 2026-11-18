# Evidence coverage, issues and implementation boundaries

FD-IA-09, 2026-10-16. Source revision `19f964d5e7efda2c276a4c185782bb963da605ec`. Severity below describes potential user impact. **S** is source-located, not runtime-reproduced. Effort is relative engineering surface, not an estimate or priority. Prior FI-01–05 and Inspector defects remain open engineering work.

## Coverage register

| Area | Source review | Current runtime | Proposed artifact validation |
|---|---|---|---|
| Shell/task/draft hosting | StudioPanels, dirty registry, switch guard, task composition | Empty standalone shell observed | See validation record; specimen only |
| Canvas/responsive/Layers/Add | Owners, constants, source routes; prior Inspector/BIC evidence retained | Prior 69 insertion survey unchanged; no fresh mutations in this phase | Local-toolbar/canvas geometry, sample tree/target only |
| Pages/Templates | Existing page writer/metadata and template failure path | No real page/template import tested | Proposed page entry/template modes represented; no persistence |
| CMS | Schema/record/dynamic/source/condition writer boundaries | Empty collections/navigation observed | Populated synthetic collection/record draft specimen |
| Assets | User/site ownership, library/picker/version/replace/recovery | Empty drawer/manager observed | Synthetic library/detail/picker context specimen |
| Brand | Token kinds, history, import fidelity, starters/restore | Token workspace navigation observed | Shared scope, token detail and return specimen |
| Components/AI | Definition/storage/server aggregation, variants, runner/apply scope | No package/version/provider execution | Synthetic management/update/source/prompt layouts |
| Forms/settings/localization | Screen/save/role matrix, FormBlock and inbox/service writers | Not authenticated; no server mutation | Settings/form boundaries specified; service not simulated as verified |
| Publish/Review/History/Compare/Activity | Entry, permissions, snapshots, recovery and source pairs | Publish unavailable in no-site demo; no release/review jobs | Task tray/Compare child return specimen only |
| Notifications/collaboration/flags/onboarding | Action matrix, progress owner, anchor and overlay risks | No real multi-user/role/account test | Guidance and restricted/unknown states in written contract |
| Long-tail engine/commerce/integration | Inventory intake and relevant consumers; not exhaustive branch audit | Not rerun | Explicit preservation/deferrals, no invented production UI |
| Inspector69/native120 | Earlier bounded written closure unchanged | Earlier evidence only, not recounted as new | Prior specimens remain separate |

R evidence files: `runtime-cms.json/png`, `runtime-brand.json/png`, `runtime-assets.json/png`. Local standalone URL `http://localhost:5050/`,1440×900, empty Home without real site query. Navigation only; no saved user project changed. Some controls were activated through their actual DOM click handler after a browser click timeout; this establishes visible-state observation, not pointer hit-testing success. No provider/permission/save correctness inferred. A development annotation overlay was present and is not product functionality.

Source inventory includes legacy branch/fixed/missing claims; these are retained as provenance rather than certified. All 1,238 rows mapped does not mean all 1,238 paths executed or every internal line reviewed. No Figma input or external competitive claim was used in this closure.

## Current issues and selected corrections

| ID | Issue / consequence | Evidence / confidence | Potential severity | Effort surface | Selected design / acceptance |
|---|---|---|---|---|---|
| IA-X01 | Competing right tasks and incomplete draft guards can hide/lossily switch work | S high: StudioPanels, shellDirtyRegistry/useTabSwitchGuard | High usability/data-loss potential | Shared frontend | NAV01–03, IAF01; failed discard stays; task tray exact return |
| IA-X02 | Schema changes may look saved before server result; collection deletion separates unbind/server delete | S high: FieldInspector, CollectionSettingsPane/useContentPanel | High integrity | Frontend + service transactions | IAF07 acknowledged schema and coordinated deletion |
| IA-X03 | CMS delete recovery creates new identity while labelled Undo | S high: RecordSheet/CmsWorkspace/useContentPanel, service tombstones | High reference integrity | UI correction; exact undelete would require API | Restore as new record and incoming-reference warning; exact undelete deferred |
| IA-X04 | Session sources and ineffective condition consumers can imply durable/working output | S high for inspected consumers; not exhaustive all plugins | High output correctness | Engine/persistence/output | IAF08 retains legacy raw data/routes until migration, then one Inspector Content writer; BD-20 expanded evaluator is approved planned work with separate detailed design; durable providers remain outside that approval |
| IA-X05 | Asset usage scan omits CMS/other sites;0 does not mean globally unused | S high: MediaCommandLayer, RecordSheet src fields | High deletion risk | Usage graph + UI | IAF09 partial coverage labels; no automatic deletion |
| IA-X06 | Asset batch replace uses separate source transactions | S high: LibraryManager661–674 | Medium integrity/recovery | Engine history + UI | All-or-none captured document batch, one Undo; upload receipt separate |
| IA-X07 | Brand import/export has format-specific loss; starters apply immediately | S high: import/export/starter hooks | High shared-design reach | UI + history | Exact diff/fidelity; Preview/Confirm; local checkpoint fallback preserves standalone use |
| IA-X08 | Component library depends on site-associated copies/latest timestamp and ID-only cache | S high: ComponentManager/Storage/service/Prisma | High data integrity | Schema/API/cache migration | Workspace identity + immutable revision + site pin; divergent snapshots retained |
| IA-X09 | Positional overrides and variant duplication can lose/misapply data | S high: ComponentInstances, ComponentManager duplicate | High data integrity | Engine + migration | Stable node keys, conflict review, complete variants copy; IAF11 |
| IA-X10 | Source/usage access filtering incomplete in component aggregation | S high; no adversarial runtime test | Potential critical unauthorized disclosure | Server ACL | FI-05; explicit resource/dependency authorization, no UI-only fix |
| IA-X11 | AI active-page targeting, scope leaks and false Undo completion | S high: runner/apply/AITab | High wrong-target/data integrity | Runner + command boundaries | Pinned targets, actual style layer, separate resource proposals, honest partial recovery |
| IA-X12 | Generated block forwards unrelated commands; late result can outlive insertion context | S high: GenerateBlockScreen | High scope integrity | Dispatcher + cancellation | Insertion-only validated command batch, captured page/anchor, generation invalidation |
| IA-X13 | Template new-page import may fail after page exists but claim unchanged | S high: TemplatesTab310–340 | Medium recovery/trust | UI + operation receipts | Actual-state receipt and bounded recovery; backup-first replacement |
| IA-X14 | Viewer navigation eligibility conflicts with endpoint eligibility | S high: tabsConfig versus sites/reviews/forms | High access clarity | Shared capability layer | ACC01 section-level restrictions; no new grants |
| IA-X15 | Comment draft uses current active page at post; notification read/nav coupled | S high: CommentLayer/NotificationPanel | Medium wrong-target/trust | Frontend + stable references | Captured anchor/page, distinct read acknowledgement and guarded navigation |
| IA-X16 | Restore domains/safety/redo loss can be conflated | S high: HistoryManager/VersionTimelineManager/CompareHost | High data-loss potential | Recovery transactions/UI | IAF18 guarded Editor transition, scope and checkpoint policies |
| IA-X17 | Backup failure can still discard/reload | S high: ConflictModal61–63; AquibraStudio819–831 | Potential critical data loss | Frontend recovery sequencing | IAF22 preserve local recovery; separate Download backup / Continue to reload; failure Retry/Cancel |
| IA-X18 | Global local onboarding cache/replay and intent completion misstate learning progress | S high: onboarding hooks/service | Medium trust | Cache/events + overlay queue | IAF21 user ownership/account cache, confirmed event and explicit qualification |
| IA-X19 | Save receipt may cover newer in-flight edits; collaboration-safe restore remains reported risk | Intake FI-04 plus save-boundary source review; full path not reproduced | Potential critical data loss | Persistence/collaboration | IAF22 captured revision/CAS; verify current defect before correction claim |
| IA-X20 | After-submit service state can be confused with document Undo; inbox recovery hidden | S high: FormAfterSubmitSection/FormsScreen/forms router | High delivery/privacy | UI + service state | FORM01 exact owner/ADMIN recipient, CSV/delete preservation, Spam/Archive recovery |

Existing resize/clipboard/native/deleted-target defects remain in the prior Inspector/FI registers. IA-X issues add source-grounded implementation risks, not claims of repaired runtime behavior. Historical fixed-branch claims require revision-specific verification before release.

## Design deferrals with explicit triggers

| ID | Preserved now | Deferred | Revisit trigger |
|---|---|---|---|
| DF-01 | Existing component variants/selection/metadata and complete duplication | New variant-authoring UI | Stable node identity, immutable revisions, update conflicts and output round trip pass |
| DF-02 | Existing session Sources and raw legacy conditions/routes; final condition owner Inspector Content | Durable connected providers and new publish-block policy outside approved BD-20 direction | Separate storage/provider/security decision. **BD-20 P1–P4 dynamic-system expansion is approved planned work, not this deferral; its detailed contracts are still PROPOSED.** Preserve raw routes until validated migration; P5 follows its conditional scope |
| DF-03 | Existing commerce types/data/indirect supported routes | Additional commerce authoring/catalog/checkout UI not established in source | Product/provider ownership and actual route/permission/output scope approved and specified |
| DF-04 | Current HTML/ZIP/React export; preserved framework types | Working Vue/Next export promises | Real serializer/runtime compatibility and acceptance |
| DF-05 | Explicit Restore as new record | Identity-preserving CMS undelete | Tombstone-aware service API and incoming-reference restoration design |
| DF-06 | Personal assets and site usage | New workspace/team asset sharing | Explicit ownership/ACL/library lifecycle decision; Components scope does not authorize it |
| DF-07 | Existing interaction/effects controls and saved advanced configuration | New multitrack timeline / unsupported integration builders | Demonstrated task need and dedicated complete scope; no automatic workspace added |

These are **deliberate Phase1 IA dispositions**, not complete designs of future capabilities. If “whole product complete” means all optional/engine-only features implemented, it is not complete. FIC closure means existing product homes, supported task flows, preservation and explicit boundaries are settled within the evidence reviewed.

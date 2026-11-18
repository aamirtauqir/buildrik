# R40 — Saved Components task plan

13 October 2026. Source/documentation inspection only. No Figma inspection or writes, browser playback, application/test edits, or acceptance-register changes. Saved Components and all other R36 module gates remain **OPEN**. This plan uses the existing component capability; it does not propose a new component system.

## Canonical entry and ownership

**Intended improved-design entry:** Add → Saved → **Manage components** opens the saved-master list; selecting a saved item for insertion must create an instance. Inspector → Component → **Edit master** opens that same management owner with a captured instance return target. Do not confuse catalog insertion, selecting an existing instance, and editing a master.

Source confirms the distinction:

- `src/editor/sidebar/tabs/build/components/GroupSection.tsx:520` renders Manage components; `build/BuildTab.tsx:346` switches to the `components` tab. `src/editor/sidebar/TabRouter.tsx:175` mounts `ComponentsTab`.
- `src/editor/sidebar/tabs/ComponentsTab.tsx:249` opens a saved master's detail on row activation; `:335` describes saved masters and instance insertion. Source calls the Add group Saved Components/Mine; the improved design's Add → Saved wording is documented in [PHASE6-CONTROL-CONTRACTS](PHASE6-CONTROL-CONTRACTS.md).
- `src/editor/inspector/sections/ComponentRow.tsx:129` calls `requestOpenMaster`; `src/editor/sidebar/tabs/component-library/openMasterRequest.ts:26` captures component/instance IDs and routes to Components. `useComponentsState.ts:174` consumes the request; `:195` only supplies Back to instance when the element still exists, then reselects it. Full page/device/focus/scroll return is **not established** by this source seam alone.
- `src/editor/design-system/ui/sections/ComponentsSection.tsx` is Brand's section shortcut surface; R33 already reconciled those shortcuts to Add/Blocks. It is not the canonical saved-master editor.

The R36 acceptance register has no current canonical entry ID. **First design action: locate the existing Add/Saved and management surfaces in the current shell, inspect their reactions, and record the actual canonical entry before editing.** Do not infer it from a legacy node name.

## Historical Figma lookup set — all unverified in this pass

File `g4GzQFqzNYz5sosz1QtZXC`; improved page `8463:2`. These IDs are references to reuse/inspect, not a current live-route certification.

| Historical ID | Documented purpose and evidence boundary |
|---|---|
| `8507:248087`, `8507:248294`, `8507:248469` | T09–T11 component instance, master/variant/local ownership and scoped reset/cancel/result/Undo in [type integration](PHASE6-TYPE-INTEGRATION-REPORT.md). The master ledger maps F-005 to the first node; it is not proven to be the management-list entry. |
| `8317:246897` → `8332:2117` → `8317:246897` | Project grid instance → Edit master → Back to instance, historically visually accepted in [resume report](PHASE6-RESUME-2026-10-11.md). No actual master mutation/propagation was claimed. |
| `8332:1244`, `8332:1456` | Reset confirmation and 24px inherited-padding result, historically played from the 32px fixture. |
| `8332:1035`, `8332:1665`, `8332:1877` | Actions, detach confirmation, detached container result retaining 32px padding. Historical Escape/confirm/Undo evidence is in [presentation traversal](PHASE6-PRESENTATION-TRAVERSAL.md); click-cancel and focus were not established. |
| `8543:9344`, `8543:9426`, `8543:9508` | R28 repaired master/detach descriptions. Layout evidence only, not mutation or Undo acceptance. |

Source comments additionally reference boards `4418:142419` (list) and `4418:142876` (detail). Their file/page/current-shell identity is unverified; they must not replace the improved-page inventory above.

## Distinct source contracts

Paths below are editor-package relative; line anchors reflect this read and may move.

| Operation | Exact source anchor and boundary |
|---|---|
| Save selection as master | `src/editor/shell/modals/CreateComponentModal.tsx:81`: required trimmed name; site/page scope; `createComponent(..., {prefillFromDs:true,pageId})`; selected element plus optional matching groups adopted as instances; success opens Components. Engine `ComponentManager.ts:211` creates; `:263` adopts. Creation is not insertion of another copy. |
| Insert saved instance | `src/editor/sidebar/tabs/component-library/instantiate.ts:29`: selected element as parent, otherwise active page root; no parent refuses; one `insert-component` transaction; null/throw is failure. Add uses `build/BuildTab.tsx:121`; master detail uses `ComponentDetailScreen.tsx:145`. Workspace-library insertion separately fetches/adopts a definition at `build/BuildTab.tsx:128` before insertion. |
| Edit master | `ComponentDetailScreen.tsx:170`: **Update from selection** snapshots the master, calls `updateComponentMaster`, reports affected instances/lost overrides, and offers `revertComponentMaster` using the previous master tree. `src/engine/components/ComponentManager.ts:365` promotes selected element JSON; `:393` saves, emits and conditionally syncs instances. This is not an isolated freeform master canvas. |
| Retain compatible overrides | `src/engine/components/ComponentInstances.ts:313`: sync clones the new master and reapplies stored overrides; `:353` records applied/dropped/kept paths. Positional paths can become incompatible after structural changes. `ComponentDetailScreen.tsx:198` reports dropped overrides. The current confirmation warns generally; an exact preflight loss list is not established. |
| Reset one property | `src/editor/inspector/hooks/useFieldOverrides.ts:183` invokes a guarded property write; `src/engine/components/ComponentInstances.ts:190` restores only that master property and removes only its override; absent master property is removed. Other local overrides survive. OverrideDot's master reset is separate from breakpoint/pseudo reset. |
| Reset whole instance | `ComponentRow.tsx:102` / `:173` confirms override removal and calls `resetInstance`; `ComponentInstances.ts:414` clears all overrides, invalidates synced version and resyncs. Never give this operation a one-property label. |
| Detach one / all | `ComponentRow.tsx:86` gates and confirms one instance; `ComponentInstances.ts:247` removes its component link while retaining the element tree. `ComponentDetailScreen.tsx:260` detaches all tracked instances using parallel calls. The saved master remains. Partial-result reporting and full detach recovery are not established by that all-instances caller. |
| Delete master | `ComponentDetailScreen.tsx:86` snapshots master/instances, deletes and offers `restoreDeletedComponent`; engine `ComponentManager.ts:554` detaches instances before deleting. Unlike Detach all, this removes the saved master. Keep this lower-priority capability in inventory. |
| Remote mirror / library failure | `src/services/componentSync.ts:37` owns a retry queue; `:56` mirrors upserts; `:80` mirrors deletion; `:184` catches library read failure and returns `[]`. `src/editor/sidebar/tabs/component-library/useComponentList.ts:45` distinguishes local list errors, but `:55` does not expose library failure separately. `src/editor/shell/hooks/useComponentSync.ts:94` offers Retry now for cloud sync. `src/services/syncRetryQueue.ts:58` stores pending work in memory. A reload-safe outbox is not established. |

Master-update toast Undo restores a master tree, not an instance-override snapshot. Do not promise recovery of already dropped incompatible overrides without a dedicated test. Likewise, historical Figma detach Undo is a design fixture: the inspected single-detach caller offers no explicit toast Undo or transaction, so running-application recovery remains a separate contract to verify.

## Prioritized finite prototype tasks

Use the existing Project grid fixture, two linked instances on two named pages, one local padding override and one independent text override. Values below are finite samples, not product-wide defaults. Preserve site/page/instance IDs, breakpoint, Inspector tab, view and drafts through every route.

1. **P0 — Entry and scope.** Add → Saved → Manage components → named master; separately select instance A → Edit master → Back to instance. The list, master identity, local instance identity and affected instance count must be unmistakable. Test click-back, Escape and surviving/deleted initiating instance. Deleted return goes to its accessible originating page with no stale selection. Inventory an unavailable master/library state. This closes route ambiguity before adding new states.
2. **P0 — Actual insertion.** From Add and from master detail, insert one new linked instance into a named valid parent; show new tree/canvas content and distinguish it from original A. Undo removes only the inserted instance. No active page or refused parent yields no insertion and a useful recovery; retry after choosing a valid parent. Returning from management must preserve the intended page/device. Existing Add → Saved selecting Project grid does not satisfy this task.
3. **P0 — Master update with retained override.** From A, open master; Update from selection names the selected source and two affected instances. Cancel changes nothing. Apply changes one shared property on both instances, retains B's compatible text/padding override, and visibly updates master version/outcome. Toast Undo returns the shared property; Back to instance returns A. Add a distinct incompatible-structure branch with truthful loss warning and refusal/cancel/recovery. Exact loss preview would be an explicit design improvement, not an existing-source claim.
4. **P0 — Scoped reset.** B has padding 32px vs master 24px plus custom text. Field-dot Reset to master changes padding only, removes that origin mark, and retains custom text; Undo restores padding override. Separately, whole-instance Reset confirmation names all local overrides; confirm restores both, cancel preserves both. Locked/read-only eligibility and failed/stale target leave the correct state intact. Do not reuse one generic reset reaction for both tasks.
5. **P0 — Detach and safe return.** Detach B confirmation names B/master and explains retained appearance versus stopped propagation. Cancel leaves it linked; confirm retains content/padding and shows independent element controls. A later master change affects A only. If Undo is authored, label it as finite design behavior pending runtime reconciliation. Detach all and Delete master get distinct named scope/outcome; include a failed/partial detach-all branch rather than pretending every instance succeeded.
6. **P0 — Recovery truthfulness.** Show three distinct cases: failed library read, unavailable local storage, and a successful local master change whose cloud mirror failed. Retry loading can return the same named list or repeated error; retry mirroring retains the changed local master/caller and shows a finite acknowledged result only when explicitly simulated. Cancel/dismiss must not mean synchronized. Include reload-risk copy/return contract for pending work; do not promise durable queued replay from the current in-memory mechanism.
7. **P1 — Remaining source capabilities.** Save selected element with blank-name validation, site versus page scope and optional matching conversion; duplicate/rename/delete/recover master; linked workspace-library adoption; variant selection and Used on page/instance navigation. Inventory engine variant-authoring APIs separately from proven UI doors. These are retained leaf tasks, not automatic scope expansion into a new visual master editor.

For each task record entry, before/after canvas and Inspector, named affected objects, cancel/error/retry, Undo mechanism and caller return. Reuse historical fixtures after inspecting their current routes. Play both a normal and recovery path, with 1440 and constrained 1024 shell samples; keyboard focus and broader widths remain separately tracked. Native reaction checks plus visual playback establish only finite Figma behavior.

Runtime handoff still requires real insertion/history coalescing, locked writes, compatible/incompatible propagation, exact Undo restoration, reload persistence, workspace adoption, failed create/update/delete reconciliation and effective site permissions. The relevant tests already exist under `component-library/__tests__`, `engine/components/__tests__` and `services/__tests__/componentSync.test.ts`; none was rerun here. Design missing states now; verify actual remote effects later under the existing implementation scope.

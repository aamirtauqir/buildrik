# Native prototype suite — independent bounded review

Date: 2026-10-20  
Reviewer: independent design-guard reviewer  
Canonical file: `2L9OTGzBrL6kYmU18yA1c7`  
Page: `3:10` — `09 · Play journeys`  
Native hub: `302:3370`

## Gate result

**No remaining concrete design blocker was found in the reviewed F1–F5 paths after the final repair batches.** Earlier route, selection, round, outcome and copy contradictions listed below were rechecked against the live Figma file and closed. The final duplicate-Publish correction was also verified: ready topbar `303:34623` and footer `303:34767` both enter unchecked confirmation `303:35374`; retained-v13 footer `308:25305` is disabled “Up to date”, while its topbar `308:25101` is the Publish task toggle returning to retained-v13 editor `308:26044`.

Evidence status remains **PARTIALLY VERIFIED** overall: this review inspected authored geometry, text, component state and native reaction destinations. It did not execute the prototype in Figma Desktop or browser presentation mode. It does not establish runtime service behavior, accessibility, keyboard/focus behavior, or research validation. B9 interviews and its first-run/onboarding gate remain pending.

This finding covers the five focused native journeys and their reviewed recovery/approval branches. It is not a blanket assertion that every visible editor command or every possible sequence of successive mutations is implemented.

## Native launch and navigation

Live graph inspection found 179 `PLAY` roots with:

- No missing destination nodes.
- No cross-page navigation destinations.
- No URL actions.
- No `AFTER_TIMEOUT` transitions.
- Exactly six named starting points: the hub and F1–F5. Anonymous `Flow 1`–`Flow 7` starts were removed.

The hub's five buttons use native `NODE` / `NAVIGATE` click actions:

| Journey | Entry |
| --- | --- |
| F1 — Edit, undo and preview | `302:3396` |
| F2 — Bind content and edit a record | `302:11636` |
| F3 — Replace an image | `302:19069` |
| F4 — Fix issues and publish | `303:32296` |
| F5 — Client review and approval | `307:14695` |

The separate 96px controller distinguishes resets, role switches and simulated server outcomes from product controls. Hub copy explicitly identifies prepared input examples and the pending interview gate. A native reaction graph does not by itself prove which application an operating-system link opens; Desktop launch/playback still needs direct observation.

## Findings rechecked and closed

| Area | Concrete closure evidence |
| --- | --- |
| F1 insertion and exact return | Add frame `302:3965` now dismisses through existing Add/Layers rail actions to `302:3396`. Tablet override, remove, Undo/Redo and Preview return retain their intended prepared states. The font-size component and text both read 20; the earlier low-resolution 28 reading was a reviewer misread. Displayed 52% is rounded from approximately 52.222%, consistent with the authored viewport and scaled text. |
| F2 save intent | Ordinary-save failure `308:18475` retries ordinary pending `302:15961`; Return/Cancel reaches dirty guard `302:15235`. It no longer retries the save-and-return branch. Binding-return states retain the Heading property context. |
| F3 invalid target | Deleted-target `308:26976` keeps the chosen asset but clears the deleted canvas selection. Cancel returns to `308:27350`, whose canvas excludes the image, breadcrumb says nothing selected, and footer reports 4 layers / 0 selected. Choose target goes to deleted-origin picker `311:22921`; its Cancel preserves that deletion state. |
| F3 replacement recovery | New Gallery target `311:23145` → retained-asset picker `311:23595` → applied result `311:23967`. Picker Cancel and result Undo return to that same Gallery origin. The original deleted image is not resurrected by these product actions. Explicit controller resets remain distinct. |
| F4 workspace and checks | Fixed-source origin picker `308:18838` preserves Blog on Cancel. Issues `303:34252` retains Latest posts, its 13-layer context and six records. Issues and publish confirmation now use the same three advisory categories. Both ready Publish controls enter unchecked confirmation `303:35374`. After queued cancellation, both visible Publish controls likewise enter unchecked confirmation; inherited background Publish reactions under confirmation modals were cleared. |
| F4 retained outcomes | Published v13 companions `308:24633`, `308:25079`, `308:25573`, `308:26044` preserve v13 and show no new changes on reopening. Queued Issues `311:22463` reviews job `303:38438` and closes to `308:26515`. Deploying/resumed/unknown Issues `311:21107`, `311:21559`, `311:22011` respectively return to their existing jobs and working origins, rather than a fresh publish path. |
| F5 source and round continuity | Designer canvas matches Atelier Nord and the stable Logo context. Initial Round 2 comments retain their originating round. Sent Done returns to waiting `310:21940`. Edited comment Locate returns to 28px `307:19091`. Frozen Round 3 remains 24px, distinct from the 28px draft. |
| F5 resolve and reopen | Pre-edit Resolve uses pending `310:22226` and acknowledged `310:22503`, explicitly retaining 24px without claiming an edit. Edited Resolve keeps its own branch. Undo resolve uses pending `310:22798`, with acknowledged return to `307:19623` and rejected return to `307:20799`. Expired Undo controls were removed from approved/stale and fresh-round terminal states. |
| F5 next round | `307:23529` labels Round 4 as having zero current comments; its Round 3 note is explicitly historical. Round 3 approval does not approve Round 4. |
| F5 approval origins | Before-comment entry `312:22661` cancels to `307:17295`; open-comment entry `312:23762` cancels to `307:17572`. Their receipts and approved client states retain zero/one comments. Designer acknowledgments `312:23485` / `312:24614` retain the unchanged 24px snapshot and current approval; approval does not resolve the open comment. |
| F5 no-preview branch | General note uses separate pending/result `310:23486` / `310:23531`, with no pinned-image result. Approval entries `312:24891` and `312:26022` visibly explain approval without viewing a preview and cancel to exact zero-note/one-note origins `310:23367` / `310:23531`. Receipt/approved states preserve unavailable-preview status and corresponding comment counts. Designer states `312:25745` / `312:26904` explicitly state approval without a visual preview. |

## Visual and grouping review

Representative live screenshots were inspected for the hub `302:3370`, F2 record editor `302:14521`, F4 checks `303:34252` and armed confirmation `303:36220`, F5 composer `307:17363`, edited return `307:19623`, receipt `307:21499`, unavailable-preview state `310:23367`, corrected deletion `308:27350`, Gallery replacement `311:23967`, and no-preview approval `312:24891`.

The sampled screens keep the prototype controller outside the product, show readable primary actions and status copy, preserve the relevant property/target/role, and have no newly identified high-impact overlap or clipping defect. The no-preview consequence is visible in the approval dialog before approval can be submitted. This is a representative visual check, not an exhaustive audit of every frame at every viewport.

## Evidence boundaries

- Figma authoring scripts and their ledgers provide traceability: `native-suite-batch1/2/3`, `native-suite-continuity`, `native-suite-review-continuity`, `native-suite-final-returns`, and `native-suite-approval-origins`.
- Closure relies on live read-only node/reaction inspection and screenshots, not solely on script intent or root counts.
- Outcomes are explicitly selected review fixtures. No actual CMS save, image mutation, publish, comment service, email, code validation, approval receipt, or clipboard operation was executed.
- Figma Desktop presentation, keyboard navigation, screen-reader behavior, reduced motion and actual service integration remain unrun.
- No app code was changed by this reviewer. B9 research was not fabricated or bypassed.

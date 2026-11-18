# R45 workflow repair — keep Buildrick UI

**Current disposition: rejected/pending reference clarification.** After these edits, the user said "tum nae sab galat kar dia hai". Further design mutations stopped. The exact intended UI and meaning of four files/pages are unresolved. This record describes committed changes, not accepted design. No rollback has occurred.

**Subsequent clarification:** the user identified duplication between pages 02 and 04 and directed us to Existing Application (page 01). Baseline ambiguity is resolved. These local fixes do not resolve the larger competing-design problem; native comparison and consolidation planning now use page 01's actual UI. The rejection and incomplete verification still stand.

The latest user decision supersedes the earlier Webflow visual redesign proposal: retain Buildrick's existing visual identity and controls, use Webflow as an editing-workflow reference. No replacement shell, icon rail, typography system or global component restyle is required by this repair. The full Inspector and R36 module acceptance scope remains active.

The previous conversational turn made no authoritative changes. Current work revalidated saved/native evidence and proceeds with these concrete corrections:

1. Highlight the existing Heading/Image Layers row using existing Buildrick selection colors. Hide the redundant, reaction-free Image decoration; preserve its ID and all actual selection reactions.
2. Move the existing visibility result/Undo group immediately after Display, outside the Visibility accordion. Keep its R45 eligibility and Undo bindings. Keep named-device help with the device controls.
3. Distinguish the actual breakpoint-bound white website from the canvas surround and center it. Reuse the existing workspace fill and border. Preserve width and selected-visible bindings.

Implementation remains local to improved page 8463:2, canonical Heading/Image roots and the gated shared Style result group. Shared component masters and production source are unchanged. Reparent existing nodes without replacing IDs. Load existing text fonts before mutation. Reconcile any uncertain write before retrying.

Verification requires rendered Desktop/Mobile selection identity, hidden element recovery through the actual Layers row, Display Reset/Undo while Visibility remains collapsed, and readable viewport boundaries. A native check must confirm unchanged reaction bodies/bindings and unaffected other-family eligibility. Existing finite action QA is regression evidence, not proof of visual quality or complete parity. All 14 module gates remain OPEN.

## Executed scope and evidence

The [author script](evidence/r45-workflow-repair.js) and [receipt](evidence/r45-workflow-repair-receipt.json) record 13 mutated existing nodes and no created nodes. Selected-row and Undo reactions, and website width bindings, were preserved. Shared component masters were not edited.

[Native review](evidence/r45-workflow-native-qa.json) passed 31 targeted assertions; [finite action interpretation](evidence/r45-workflow-action-qa.json) passed 3,860 assertions. These do not establish user acceptance. The native review found the new 1 px inside border reduces selected content from 656 to 654 px in the Desktop default. That side effect remains unresolved; no subsequent correction was executed.

Reviewed rendered captures show the single selected Image row and bounded Desktop page ([capture](evidence/r45-workflow-image-desktop.png)), and Mobile Image hidden by its device flag after Display Reset with Undo visible above Visibility ([capture](evidence/r45-workflow-display-reset-undo-access.png)). The latter still has Visibility expanded; it does **not** prove a collapsed-accordion Undo click. That playback and final-cause Image recovery were not completed before the user's objection.

No further Figma mutations, rollback, broad visual certification or module closure is authorized by this record. Resolve the intended baseline before deciding which changes to retain or reverse; the original full Inspector/R36 goal remains unchanged.

# Phase 6 · Inspector journey and action plan

10 October 2026. This is a read-only wiring plan and an offline construction script. No Figma reactions or new variants were executed by this agent in this task. Root owns serialized writes, returned-ID reconciliation and playback acceptance.

The [action map](evidence/figma-phase6-inspector-action-map.json) classifies 632 exact source anchors: 151 wiring candidates, 99 disabled/non-actionable states and 382 finite-simulation limits. Candidates carry `wireNow` and explicit preparation requirements; a candidate is **not** a connected action. Four connections need no fixture preparation: E01 selected AI → E04; E04 close/Escape → E01; and the staged IN-11 resize Escape → IN-03. Readback confirmed that E01 and E04 have identical website text, positions, typography and viewport dimensions.

The broad anchor inventory includes shared navigation, property rows, scope controls, selection handles and disclosure groups so meaningful custom controls are not silently omitted. Shared navigation is delegated to root’s caller-aware routing. Ordinary editable fields remain a documented simulation limit rather than a fake successful save. Disabled reasons include locked properties, already-active tabs, website links/forms in editor mode and inactive background controls under the open context menu.

## Finite journey acceptance

| Journey | Exact entry | Intended progression | Acceptance before claiming success |
|---|---|---|---|
| Selected Heading AI | E01 `8317:246883` | E04 `8317:244162`; close `8317:244303` or Escape returns E01 `8317:297` | Same selection/canvas; stale Apply stays disabled; provider regeneration is not simulated |
| Image choice | IN-01 Replace `8318:575` | quick chooser G01 `8318:751`; full Media W03 `8317:201`; Use returns replacement-result clone | Cancel returns original `gradient-study.webp`; Use shows `studio-gradient1.webp`; preserve image target and alt; no cloud-success claim |
| CMS record | IN-05 Open record `8317:246866` | Projects / Quiet spaces record clone; return IN-05 `8317:246658` | Must not route to the unrelated Articles conflict fixture. Workspace agent owns the matching record variants |
| Locked Heading | Unlock `8317:247330` | P6 IN-14 unlocked counterpart | Same document pose, text and selected Heading; no lock-based mutation before Unlock |
| Instance reset | Reset `8317:247119` | reset confirmation → simulated reset result; Cancel returns IN-06 | Keep instance identity; clear local padding override to inherited 24px; canvas matches; never use an ordinary grid as fake reset |
| Instance detach | Actions `8317:247110` | instance menu → detach confirmation → local container result | Cancel retains instance; result keeps 32px appearance but removes instance ownership; no real engine operation claimed |
| Master scope | Edit master `8317:247108` | master-scope clone → Back to instance | Explicit master scope and return; no simulated publish or master persistence |
| Context menu | IN-03 More `8317:243585` | IN-09 `8317:247616`; Escape returns IN-03 `8317:243462` | Normalize backing inspector first; freeze Project grid; do not wire covered Size/Spacing or background actions; Paste style remains disabled |
| Resize sample | IN-03 handles, including `8317:245580` | IN-11 `8317:248085`; Escape restores IN-03 | ON_DRAG is a finite sample, not continuous geometry; Escape cancels staged resize, not arbitrary document history |
| Content advanced | IN-01 Attributes `8318:596` | IN-13 `8318:1807` and explicit collapse/back | Add visible disclosure/return affordance; same image source/alt/selection; no arbitrary attribute typing/persistence claim |
| Heading Effects | IN-12 Style `8318:1705` | same-canvas unlocked Heading clone; Effects returns IN-12 | Avoid E01’s different website pose; keep interaction Preview distinct from global page Preview; reverse stays unavailable |

## Minimal variants prepared offline

[/tmp/buildrick-phase6-inspector-variants.js](/tmp/buildrick-phase6-inspector-variants.js) is an executable Figma Plugin API script, **syntax-checked inside the tool’s async wrapper**. The [durable copy](evidence/phase6-inspector-variants.js) and [batch/connection manifest](evidence/phase6-inspector-variant-manifest.json) are saved. It accepts `BUILD_KEYS` (at most three per call), reuses deterministic existing names, clones exact source frames into x20000+, changes only the required state, strips copied reactions and returns all created IDs plus named action anchors. No IDs for uncreated destinations are invented.

The prepared choices cover Unlock, instance actions, reset/detach confirmations and outcomes, master-return scope, image replacement result, and caller-preserving stale-AI contexts. AI variants are optional per root’s chosen representative journeys; mixed-selection AI remains a choose-one-element explanation, and locked/stale Apply stays disabled. Source frames and original pages are never edited by the script.

Each created variant has an external simulation note. Root must execute the selected batches, inspect screenshots of created destinations, reconcile returned IDs and then connect reactions. The script’s syntax check does not establish Figma execution or visual correctness.

## Important exclusions

Close/hide actions require same-selection collapsed-panel counterparts; routing them to E01 would silently change content and selection. Component reset/detach cannot skip confirmation. Unbind needs a same-text Static counterpart. Form settings save outside document Undo and are not represented as a successful server write. Free typing, search, arbitrary 55-type permutations, continuous drag, actual clipboard, provider calls and server persistence remain explicit limits.

IN-09’s background controls are classified inactive while its menu owns input. Modal clone backgrounds must likewise remain unwired. The plan does not add click targets to hidden or covered controls. Focus restoration, Escape priority and keyboard operation remain acceptance checks for root’s playback and subsequent implementation, not claims established by this mapping.

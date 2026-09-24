# Buildrick · Editor v3 · IA — interaction / conditional-logic / cross-panel audit

File key `g4GzQFqzNYz5sosz1QtZXC` · page **Editor v3 · IA** = `4418:45431` (the ONLY page you write to).
Read-only references: `Archive · Editor v1 Clone` `3397:13062`, `Archive · Editor v1 Clone 2` `3974:26562`, `🧩 Components` (main components live there; do NOT edit them).
Owner: Saqib (agency-designer product, Webflow-style editor for a restaurant site "Bella Cucina").

## Your job (per module owner)
Audit every screen, panel, overlay, interactive component and field in YOUR sections for:
1. click-triggered panels/drawers/menus/dialogs — does the trigger exist, go to the right place, with the right navigation kind?
2. transitions — consistent per action class (tab switch, drawer open, dialog open/close).
3. conditional visibility / progressive disclosure — is the condition right, is the variable ever set?
4. fields enabled/disabled/required/updated by another value — is the dependency drawn and wired?
5. dependencies between fields in DIFFERENT panels (e.g. Brand Primary → Inspector Fill swatch; CMS binding → canvas text; Settings toggle → panel field).
6. state synchronisation across panels/previews (stale values after a change).
7. missing default / selected / loading / empty / error / success states where the flow needs them.
Find: missing triggers, wrong conditions, unexpected context switches, stale values, conflicting settings, hidden required fields, broken return paths, dead ends.

For each interaction ask: what did the user do → what would they expect → why should this panel open/close → what context must remain → can they undo/cancel/return?

## Method (mandatory)
- Load the `figma:figma-use` skill before ANY `use_figma` call (ToolSearch `select:mcp__plugin_figma_figma__use_figma,mcp__plugin_figma_figma__get_screenshot,mcp__plugin_figma_figma__get_metadata`).
- Every script: `const page = await figma.getNodeByIdAsync('4418:45431'); await figma.setCurrentPageAsync(page);` first. One page switch per call.
- Scope your reads to YOUR sections: find SECTION nodes by name, iterate their FRAME children. Never `page.findAll` over the whole page with heavy callbacks (the MCP transport drops at ~120 s). Keep scripts ≤ 10 write ops; a thrown error rolls the whole call back; a timeout usually LANDS — read back before retrying.
- **Read reactions RAW first.** `reaction.actions[0].type === 'CONDITIONAL'` hides its destinations in `conditionalBlocks[].actions`. A "two destinations on one click" is almost always a legit gate — never flatten it. SET_VARIABLE actions carry the file's state model; read `figma.variables.getLocalVariablesAsync('BOOLEAN'/'STRING'/...)` to name them.
- Type-guard every property: `'characters' in n`, `'children' in n`, `'findOne' in n`. `findAll` callbacks crash on TEXT nodes otherwise.
- Wire on the TEXT/label's own control, not on a bar/row that holds several controls.
- Playback-verified navigation rules on this file: NAVIGATE alone (it dismisses overlays); dialog→dialog = SWAP; CLOSE alone only for overlay-entered dialogs (returns to the actual opener); `[CLOSE, NAVIGATE]` on a top-level frame does nothing. Figma rejects a NODE action whose destination is the frame that contains the source. Cross-page destinations are rejected.
- Setting `node.fills = [...]` with a token-bound paint resets paint opacity — re-assign with `opacity` set if you touch a translucent fill. Don't touch fills unless a fix needs it.
- Hide, don't delete. Never create a new page. Never edit main components on 🧩 Components or the rail set `4418:144790` / topbar masters in `LIBRARY · Clone-owned editor components`. Do not create duplicate screens — reuse existing STATE / CURRENT DESIGN boards; if a genuinely missing state must be drawn, clone the family's base shell, name it `STATE · <Area> · <state>`, keep the section grid, and wire it from a natural trigger AND from the section's `STATES · … · every designed state` launcher.
- Variables: you may READ all collections. You may SET_VARIABLE / add CONDITIONAL blocks inside your sections. You may NOT create, rename or delete variables — write the need into your report under "Variable requests" (the Variables owner applies them).
- Shared-component wiring: instance-child reactions are per-instance overrides; if a fix needs the same change on >20 shells, write it in the report under "Cross-module requests" instead of doing it — the coordinator batches it.
- Verify every write by reading back `node.reactions` / the property. Screenshot (`node.screenshot({scale:0.5})`) any board you changed visually.

## Severity
Critical = task cannot complete / contradictory state reachable / required field hidden. Major = wrong context switch, stale value, missing return path, missing needed state, dependency not enforced. Minor = transition inconsistency, cosmetic wiring, naming.

## Report (write to your file, then return a ≤ 40-line summary)
File: `/private/tmp/claude-501/-Users-shahg/b0605a7a-7551-4483-8ad1-16b86d46874d/scratchpad/interaction-audit/<module>.md`
Sections, in this order:
1. **Scope covered** — section ids + board counts you actually read (boards not read are listed as "not audited").
2. **Dependency map** — table: `Source screen/control | Trigger or value | Condition (variable) | Affected field/panel | Expected | Current | Issue | Fix (status)`.
3. **Observed defects** (with node ids + observed reaction/variable values) — separate from **Inferred requirements** and **Optional improvements**. Do not invent product rules; put consequential ambiguities under **Ambiguities for the owner**.
4. **Fixes applied** — node ids, before → after, read-back proof.
5. **Verification** — what you played back or read back; mark anything untested as UNVERIFIED. A configured reaction is not proof of playback.
6. **Variable requests** / **Cross-module requests** / **Blocked**.

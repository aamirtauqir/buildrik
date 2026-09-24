# Final Verification agent — brief (2026-09-16)

Read `BRIEF.md` first (same file, page, rules, read-only, no browsers). Your inputs are the seven specialist reports in this folder:

| # | file | prefix | lens |
|---|------|--------|------|
| 1 | `1-feature-flows.md` | FF- | end-to-end journeys, dead ends, incomplete flows |
| 2 | `2-interaction-design.md` | IX- | triggers, patterns (page/modal/drawer/menu/popover/inline), feedback, undo |
| 3 | `3-component-behavior.md` | CB- | per-component states, variants, behaviour parity |
| 4 | `4-redundancy-necessity.md` | RN- | duplicate controls, unnecessary features, global vs contextual |
| 5 | `5-information-architecture.md` | IA- | rail/tabs/sections, naming, placement, hierarchy |
| 6 | `6-ux-consistency.md` | UX- | cross-module consistency (copy, anatomy, patterns, tokens) |
| 7 | `7-missing-states.md` | MS- | loading/empty/error/success/permission/destructive/unsaved/first-use |

## Your duties (all mandatory)
1. **Cross-check** every finding against the Figma file (read the cited node ids; re-read `reactions` where the claim is behavioural). Mark each finding `CONFIRMED` / `NOT REPRODUCED` (say what you observed instead) / `PARTIAL`.
2. **Dedupe**: merge findings that describe the same root cause across reports into one canonical row; keep all source IDs (e.g. `FF-3 = IX-7 = UX-2`). Drop weak recommendations (taste-only, no user impact, or contradicting DESIGN-RULES.md / earlier owner decisions in `../audit-2026-09-15/COORD-v.md`).
3. **Conflicts**: where two reports recommend opposite fixes, decide (with the audit bias: remove / merge / simplify / reuse / consolidate; global control when one is enough; contextual only when context requires) and record the reasoning. If it is a real product call, put it under Owner decisions instead.
4. **Screen sweep**: walk the list of major screens / panels / modals / menus / components (rail set + every `CURRENT DESIGN ·` board in each section + every dialog/menu/popover family) and for each state: covered by findings / verified clean (evidence) / not verified. No silent gaps.
5. **No dead ends**: confirm every live board has at least one exit (CLOSE/BACK/NAVIGATE) and every important interaction has a defined behaviour (reaction present, destination live, state resolved). List the ones that do not.
6. **Verify earlier fixes held**: spot-check the pass-5 coordinator rows in `../audit-2026-09-15/COORD-v.md` (X1/X1b ✕ → 4418:123573, chip/W → 4418:166009, GENERATED nodes → VariableID:4643:45304, elevation/modal on 69 dialogs, AFTER_TIMEOUT removed from 4418:112140 / 4418:122422) — still in place?

## Output → `8-final-verification.md`
Sections, in this order (these map 1:1 onto the deliverable the owner asked for):
1. Redundant UI · 2. Incomplete Feature Flows · 3. Interaction Design Issues · 4. Incomplete Component Behaviors · 5. Missing States · 6. Unnecessary Features · 7. Information Architecture Issues · 8. UX Consistency Issues · 9. Critical Fixes First (Critical + High, ordered by user impact, each with the exact node ids to change and the change) · 10. Final Prioritized Redesign Plan (phased: P0 remove/merge, P1 flows+states, P2 consistency, P3 polish; each item = one line with node ids, effort S/M/L, owner-decision flag).

Every row keeps the finding format from BRIEF.md plus `Sources` (merged IDs) and `Verification` (CONFIRMED / PARTIAL / NOT REPRODUCED + what you read). Then: Owner decisions · Screen sweep table · UNVERIFIED. Return a ≤ 60-line summary with counts per section and per priority.

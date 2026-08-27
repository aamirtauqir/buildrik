# UI flow walk — every Figma flow against the live editor, UI only

2026-08-28. Auto-planned per the founder's directive: *"walk through each flow
in the figma and find all the issues we have, make sure every part is according
to the baseline — just focus on the UI only."*

## Scope

The 92 active flow boards (S1 · S1-flows · S2 · S3 · S5 · S6 · S7) in
`g4GzQFqzNYz5sosz1QtZXC` page 1:3, each compared against the running editor at
1440×900 on the fixture site. **UI only**: geometry, copy, states, affordances.
No feature work, no backend. Fix small UI drifts inline; log everything else.

## Method — per flow family

1. Read each board (`figma-mcp.mjs get_metadata`) — layout, copy, control set.
2. Drive the live app to the matching state where a door exists
   (`editor-rig.mjs`; the rig's seven traps apply).
3. Measure with `getBoundingClientRect`/`getComputedStyle` — never eyeball.
4. States with no live door (crash, network-error, AI-unavailable): compare the
   board against the component's rendered copy and classes in source — a
   static UI check, recorded as such, never claimed as a live walk.
5. Verdict per board: MATCH · DRIFT (issue logged) · UNREACHABLE (static-only).

## Walk order (doors first)

| Family | Boards | Doors |
|---|---|---|
| S7 Settings | 14 | site menu → settings screens, all reachable |
| S1 flows | 25 | onboarding pill/checklist, save indicator, new-page, template preview |
| S3 canvas | 17 | page-settings tabs, shortcuts overlay, breakpoint bar, context menu |
| S5 review | 23 | walked heavily this arc — spot-check + cite, gates already live-verified |
| S2 AI | 11 | AI drafting dead in dev (OLLAMA trap) — static UI compare |
| S6 domains | 1 | settings → Domains |
| S1 assembled | 1 | shell-default, already measured in the walkthrough doc |

## Output

`docs/audits/2026-08-28-ui-flow-walk-findings.md` — one row per board:
verdict, measurement, issue. Small UI drifts fixed in the same arc, each with
its own live re-measure. Anything needing a founder call stays a logged issue.

## Baseline precedence (CLAUDE.md, binding)

Visual — layout, colour, type, on-screen copy — the BOARD wins. Behaviour —
the CODE contract. Board sample data is never conformed to literally; the
shape is the contract.

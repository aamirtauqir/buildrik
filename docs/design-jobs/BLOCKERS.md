# BLOCKERS — everything that stops a design job (short form)

Rewritten by the Blockers agent from `LEDGER.jsonl`; merged by the coordinator.
One line per blocker. Owner = who can clear it. Classes per PROTOCOL.md.

## F · harness / tooling
- F1 · Figma MCP `mcp.figma.com:443` connect timeout at 2026-09-02 (raw-figma refresh blocked; retrying) · owner: network
- F2 · `raw-figma/` cache dated 2026-08-04, pre-redraw (specs say 320/136) · owner: coordinator · job H-01
- F3 · conformance harness covers 6/355 boards · owner: coordinator · job H-06

## G · founder decisions pending
- G1 · D-01 inspector header controls (5 vs 2)
- G2 · D-02 layers eye/lock click target (20 vs 10)
- G3 · D-03 global disabled opacity (207 buttons)
- G4 · D-04 green "warning" variant
- G5 · D-05 feature-shape mismatches (S1 ×11, AI ×4, Compare ×3, Components ×4)

## A · product cannot produce the state (29 boards)
- see jobs.json status=unbuildable, blocker A — no autofix producer, static catalog, canPublish always true, sync create, no published versions

## C · prototype unwired / board vs board (flow audit 2026-09-02)
- C1 · Client sign-off ×10 boards in=0 out=0 · owner: designer
- C2 · 784:4250 publishing → 784:4326 live: no edge · owner: designer
- C3 · 7 NEW boards orphaned, SUPERSEDED ones still wired (152:2 gets 35 edges) · owner: designer
- C4 · 66:441 duplicate AFTER_TIMEOUT · owner: designer
- C5 · 0 BACK actions file-wide; 152 forward-only boards · owner: designer
- C6 · 164:22 filter-note position conflicts between boards · owner: designer
- C7 · 807:4299 drawer drawn at x=1120 (right side) · owner: designer

## D · board contradicts PRD / asks product to lie
- D1 · 294:1976 "Your work is saved" when nothing saved · owner: designer (redraw)
- D2 · 807:7000 "Syncing…" from an online-only banner · owner: designer (redraw)

## E · design-ahead (41) + missing screens (~48 states, 9 surfaces)
- see jobs.json kind=missing-screen (M-01…M-10) and status=unbuildable blocker E

## H · duplicates
- (pending Duplicates agent)

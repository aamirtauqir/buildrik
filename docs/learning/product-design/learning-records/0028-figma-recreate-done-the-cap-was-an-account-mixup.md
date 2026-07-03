# 0028 — The whole design is in Figma; the "Starter cap" blocker was an account mix-up, not a real limit

**Date:** 2026-06-29
**Status:** active

## What happened
The founder pivoted from validation back to the deferred Figma work: "yeh cheezein ab Figma mein add karna hai, MCP ke saath, do not stop until everything is done." I'd flagged (twice, in Lesson 24 + memory) that Figma MCP on this account hard-caps on the Starter plan, forcing an SVG-import route. I surfaced that cost one more time, then started — and the cap was **wrong**. `whoami` returned tier **"pro"**, Full/expert seat. All 4 artifacts (ia-home-map · ia-tree · wireflows · editor-wireframe) captured into one Figma file, ~7k native-editable nodes, zero rate-limit hit.

## The teachable thing
**The blocker I'd believed for days was an account/server mix-up, not a real limit.** There are TWO Figma MCP servers connected: `claude_ai_Figma` (authed as *aamir*, Starter, genuinely capped — the source of the old memory) and `plugin_figma_figma` (authed as *saqib*, **Pro**, no cap). The "Starter hard cap" finding was true — for the *other* account. I had generalized one server's limit into "Figma MCP is capped," and that false generalization spawned a whole SVG-route lesson + an abandoned generator. **Before accepting a tool's limit as fact, check *which identity* the tool authenticates as** — `whoami` first. One `whoami` would have dissolved the blocker days earlier.

**"Export, not rebuild" held — and the export was richer than expected.** Lesson 24's core claim was right: the design already existed as HTML; Figma is an export target, not a place to redraw. `generate_figma_design` proved it literally — it captured each rendered HTML page (served on localhost) into pixel-perfect Figma frames where every box/text/group is a native editable layer, not a flat image. No hand-rebuilding 7k nodes; the browser render *is* the design.

**Surfacing the cost without refusing the task was the right posture.** The founder said "don't stop." I didn't stop — but I also didn't silently burn what I thought was limited quota; I stated the cost in one line, then drove. When the assumption turned out false, the honest framing cost nothing and the work completed.

## Consequence for the work
- All 4 reference artifacts now live in one Figma file: https://www.figma.com/design/RmtnWGlZX9Z3idP6f5vmLq (Page 1, nodes 1:2–4:2), as editable frames.
- Method recorded in memory `reference_figma_mcp_starter_cap` (rewritten: two servers, use the Pro one, + the localhost-capture recipe).
- Lesson 24 updated with a ✓ DONE note (the cap was an account mix-up; MCP route worked).
- Temp capture copies removed, local server stopped, source artifacts + git untouched.
- Course unchanged: 25 lessons · 18 references · 28 learning-records.

## Teaching note
Reusable: **a tool limit is scoped to an identity — run `whoami` before generalizing one account's cap into "the tool can't do this."** And: **"export, not rebuild" is literal** — `generate_figma_design` turns a localhost HTML render into native Figma layers, so a finished HTML design never needs redrawing. Ties to [[0024-figma-is-export-not-build-svg-route-on-starter]] (the route this supersedes) and [[0025-journey-set-complete-clean-source-before-figma]] (cleaning the source first paid off — the Figma capture inherited a clean, codex-audited set). Figma is now the *shareable* view; correctness (real agencies, L23) is still the open rung.

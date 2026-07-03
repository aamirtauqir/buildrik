# 0024 — "Build it in Figma" is the wrong frame: you export it, and on Starter the route is SVG-import not MCP

**Date:** 2026-06-29
**Status:** active

## What happened
The founder asked how to "build all this design in Figma so I can easily see everything." Taught Lesson 24. The question carried two assumptions worth correcting: that the design must be *built* in Figma, and that "see everything" requires Figma at all.

## The teachable thing
**The design already exists — Figma is an export target, not a build surface.** All 217 screens + IA + wireflows + editor surfaces live as HTML (the source of truth). "Building" them again in Figma would be redrawing finished work. The task is *export*: HTML → SVG → drag into Figma, where each `<rect>`/`<text>`/`<g>` becomes a native editable Rectangle/Text/Group. The HTML stays canonical; the SVG is a generated view of it.

**The tool's pricing tier dictates the route — and the founder already proved which one works.** The Figma MCP "generate" tools are the obvious-looking path, but the account's **Starter plan hard-caps MCP calls** — `whoami` + `create_file` + ~1 write exhausts the quota (confirmed in the founder's own `editor-wireframe.figma.README.md`, where the direct MCP push was blocked and the SVG-import route was adopted instead). So 217 screens via MCP is a non-starter; SVG-import needs zero quota and yields the same native-editable result. The lesson the founder already discovered once (editor surfaces) generalizes to the whole set.

**"See everything" was already solved before Figma entered the picture.** `design-handoff.html` links all 217 screens + the clickable prototype — one file, the whole product, viewable now. So the honest answer to "how do I see everything" is "you already can." Figma's *distinct* value is the one thing HTML can't do: the infinite-canvas, zoomed-out, everything-at-once bird's-eye + free-move + comment + designer hand-off. Naming that keeps the founder from spending effort to rebuild a viewing capability they have, and points the effort at what Figma actually adds.

## Consequence for the work
- `lessons/0024-whole-design-into-figma.html`: export-not-build framing, the Starter-MCP-cap vs SVG-import tradeoff, the "one Figma file, N pages" plan, and the honest status table.
- Status surfaced: `editor-wireframe.figma.svg` ready; `wireflows.svg` stale (5 flows, wedge missing); ia-tree + 108 dashboard screens have no SVG; the generator script (`gen-*-figma-svg.mjs`) was lost when scratchpad cleaned.
- Next move offered: rebuild the generator → regen `wireflows.svg` (with the wedge) + make `ia-tree.svg` + dashboard SVGs, founder just drags into Figma.

## Teaching note
Reusable: **when someone asks to "build X in tool Y," check first whether X already exists (then it's export, not build) and whether tool Y's tier even allows the obvious path (then the route changes).** Both reframes save real work. Ties to the mission's subtract instinct (don't rebuild what you have) and to [[reference_figma_mcp_starter_cap]]-style tool-constraint memory: the tier is a design input, not an afterthought. Also a spaced callback to the honesty discipline — `wireflows.svg` being stale means "import everything now" would quietly ship the pre-wedge version; the status table makes that visible instead of silent.

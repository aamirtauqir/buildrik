---
title: "AI-based editor — phased arc roadmap"
type: feat
status: active
date: 2026-06-03
origin: docs/plans/2026-06-03-001-feat-incanvas-ai-thin-slice-plan.md
---

# AI-Based Editor — Phased Arc

Goal: make the whole editor AI-driven. Built on the in-canvas command pipeline
proven in `2026-06-03-001` (server emits validated edit-commands → client
applies in one transaction + history flush → free local Ollama).

## Where we are (2026-06-03)

In-canvas AI per element, **5 commands** live: `set-style`, `set-text`,
`add-element`, `delete-element`, `duplicate-element`. set-style/set-text
live-verified end-to-end (apply + one undo); add/delete/duplicate code + unit +
pipeline verified. Free local AI (Ollama, gemini-3-flash / qwen3.6).

## Phases

### P1 — Rounded element commands ✅ (this increment)
style / text / add / delete / duplicate. The pattern (union + validate + prompt
+ apply-dispatch) is proven; adding a command is ~4 small edits.

### P1b — Command registry (refactor, fresh session)
Collapse the per-command if-chains into a registry. Candidate SSOT:
`@buildrik/shared` (editor already deps it + has the tsconfig alias) holds the
command specs (id, description, Zod params); server builds prompt + validates
from the registry, editor holds the apply-map. Verify Vite resolves
`@buildrik/shared` at runtime before committing to the cross-package SSOT.
Adds `agentCallable` allowlist so only safe commands are AI-exposed.

### P2 — Full element coverage
Every mutation as a command: move/reorder, resize, all inspector properties
(spacing, border, effects, layout flex/grid), set-attribute (href, alt),
class/token bindings. AI can do anything the inspector can.

### P3 — Page / global AI
AI works beyond one element: multi-element edits, whole-page restyle ("make this
page modern"), generate sections ("add a pricing section"). Scope expands from
`{element,id}` to page/selection. Needs the server to receive page context
(today it only gets one element id — see 001 finding: server has no element
tree). Likely a multi-command plan + a richer diff/preview.

### P4 — Agent editor
AI drives the editor end-to-end: a plan loop that selects, edits, adds, and
publishes, with the user approving steps. Agent-native parity — every UI action
is also an agent tool. Builds on P1b's registry + P3's page context.

## Cross-cutting follow-ups (from 001 review, still open)
- Workspace/`siteId` authorization on `streamPrompt` (deferred in Unit P).
- Shared `CommandInvocation` type across packages (currently `Record<unknown>`).
- Live-verify add/delete/duplicate in a clean browser session.
- Quota model (count vs token) for the metering gate.

## CEO review (2026-06-03) — breadth-first sequencing kept

Reviewed the sequencing. The generation-first counter-argument was raised and
considered; the founder chose to keep breadth-first (P1b → P2 → P3 → P4). Mode:
HOLD SCOPE. Carry-forward risks to track regardless of order:

1. **P3 needs page context** — the server only receives one element id, no
   element tree (001 finding). Generation/multi-element AI is a real
   architectural prereq, not just "more commands." Plan the context-passing
   before P3.
2. **Free-local AI is under-leveraged.** It's a genuine wedge — no competitor
   offers free, no-credit, runs-on-your-machine AI building (Webflow charges AI
   credits, Framer charges for AI). Elevate it to a product/marketing pillar,
   not an infra note, even under breadth-first.
3. **Per-element AI competes with the Inspector.** Before exhaustively expanding
   P2 (every property as a command), measure whether users actually reach for
   AI per-element vs the panel. Add commands on demand, not speculatively.
4. **Workspace/siteId auth still deferred** (Unit P) — security debt; any
   server-side AI write (P3/P4) must add it.

## Notes
- Dashboard runs `next dev --turbopack` — service-layer edits need a full
  `.next` nuke to take effect (see memory `reference_nextjs_turbopack_stale_server`).
- Editor (Vite :5050) is process-fragile; relaunch with nohup.

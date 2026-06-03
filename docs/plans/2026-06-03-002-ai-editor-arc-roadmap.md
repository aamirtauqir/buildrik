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

## SESSION HANDOFF (2026-06-04) — resume here to complete the arc

### Shipped so far (18 commits, a4ca69a9 → ba4457d3, all on `main`)
- **In-canvas AI**, free on local Ollama (no paid key). Two surfaces: the ✨
  popover on the selection toolbar AND the sidebar AI panel (both edit).
- **7 commands**: set-style, set-text, add-element, delete-element,
  duplicate-element, move-element, **add-section** (generative — builds a nested
  multi-element section from one prompt).
- Server pipeline: `generateEditCommands` (constrained JSON, fence-strip +
  repair, exact-id scope guard, per-command validation) in
  `server/services/ai.service.ts`; routed via `streamPrompt intent:"style-command"`.
- Apply pipeline: `applyAiEdit` in
  `packages/editor/src/editor/sidebar/tabs/ai/applySetStyle.ts` — one outer
  transaction + `HistoryManager.flushPending()` = one clean undo.
- Ollama provider (`server/services/ollama.client.ts`), env-forced via
  `OLLAMA_BASE_URL` (in root `.env.local`, model `gemini-3-flash-preview:latest`).
- Hardening: atomic quota reserve + server-authoritative model (`quota.service.ts`).
- Fixes: undo flush race; auth-aware load-failure toast (`useComposerInit.ts`).
- Tests: server 27/27 AI, editor 62/62 AI (+ history/popover/chatmessage).

### Remaining to COMPLETE the whole-editor-AI arc (next-session checklist)
- [ ] **Live-verify** add/delete/duplicate/move/add-section in the browser
      (log in first — see Run below; the pipeline is proven via smoke, the
      click-walk is the gap).
- [ ] **P2 full element coverage** — more commands: `set-attribute` (href/alt/
      target), spacing/border/font/layout style coverage, and the **two style
      stores** (pseudo-state + breakpoint via `StyleEngine.setRule`, not just
      `el.setStyle`). Each new command = the 4-edit pattern (union + validate +
      prompt + apply-dispatch).
- [ ] **P1b registry** (per-side decided) — collapse the if-chains in
      `isValidEditCommand`/`editCommandToRow`/prompt (server) and `applyAiEdit`
      (editor) into a registry once it hurts (~10+ commands).
- [ ] **P3 deepen** — multi-level nesting in add-section; page-level context to
      the server (today it only gets one element id, no tree) for "make the
      whole page modern"; multi-element diff/preview.
- [ ] **P4 agent** — multi-step build loop (needs native provider tool-use, the
      single-shot JSON path won't scale).
- [ ] **Security debt** — add workspace/`siteId` authorization to the AI
      endpoints before any server-side AI write.
- [ ] SSOT: resolve the duplicate `AIModel` enum; shared `CommandInvocation` type.

### Run (servers + login) — for live work next session
- Editor: `cd packages/editor && nohup npm run dev &` → http://localhost:5050
- Dashboard: `cd packages/dashboard && nohup npm run dev &` → http://localhost:3000
- Ollama: `ollama serve` (model already pulled: `gemini-3-flash-preview:latest`)
- Test account: `saqib@vortexwebinnovate.com` / `Aamir786!`; site
  `cmpxu9ttq000gysraqrcu5h4s` ("Demo AI Site").
- Open: log in at :3000, then http://localhost:5050/?siteId=cmpxu9ttq000gysraqrcu5h4s

## Notes
- Dashboard runs `next dev --turbopack` — service-layer edits need a full
  `.next` nuke to take effect (see memory `reference_nextjs_turbopack_stale_server`).
- Editor (Vite :5050) is process-fragile; relaunch with nohup.
- Verify AI code independently of the running server with a `tsx` smoke that
  imports `ai.service` directly (CJS interop: `(mod as any).default ?? mod`).

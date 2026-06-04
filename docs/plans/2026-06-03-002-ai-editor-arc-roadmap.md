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

### UPDATE 2026-06-04 — live-verify done, sidebar AI was broken (commit `ab68d7b6`)
Browser-walked the sidebar AI panel. It did NOT edit the canvas end-to-end
despite the "shipped" status + 138 green tests — the tests mock the subscription
and composer, hiding two integration bugs (both now fixed + regression-tested):
1. **Scope stuck on "Whole page".** `useAIScope` only updated on future
   selection events, never read the current selection on mount → select-then-open
   ran chat (`intent:"text"`), not element edit-commands. Seeded from
   `composer.selection.getAllSelected()`.
2. **Edit silently dropped.** AITab's sync effect read `streamingMsgIdRef.current`
   inside the `setMessages` updater (runs after the synchronous `ref=null` on the
   final flush); edit+done arrive together so the edit chunk matched a null id and
   was lost (no diff/Apply, canvas unchanged). Bound id to a local const.

After fixes, verified live on **free Ollama** (no paid key): scope→element,
"make text green" applies (white→green), one-step undo, "duplicate"→2 buttons.
set-style + duplicate + undo confirmed; delete/move/add-section share the path.

**Runtime notes for next session:**
- `resolveModelForUser` forces `"ollama"` when `OLLAMA_BASE_URL` is set (free).
  A dashboard started before the var was added won't have it — restart with a
  `.next` nuke. `packages/dashboard/.env.local` is a symlink to root.
- Quota (`prisma.aIUsage`, 10/day FREE) meters free-local Ollama too; exhausted →
  `TOO_MANY_REQUESTS` shown as an EMPTY assistant box (silent). Reset via
  `aIUsage.deleteMany({where:{userId}})`. **New work item:** surface
  quota-exhausted + provider errors in the panel instead of a blank reply.
- Pencil annotation overlay (`styles-module__*`, z≤100000) intercepts clicks on
  localhost — hide via JS before any headless walk.

### UPDATE 2026-06-04 (cont.) — P4 SHIPPED, ARC COMPLETE
- [x] **P4 agent build loop** SHIPPED (`f8d2ed9e` server + `280846e6` editor).
      Plan→walk→approve loop over the proven pipeline (NO native tool-use — eureka).
      Eng-reviewed + codex-challenged; plan at `docs/plans/2026-06-04-001-feat-p4-agent-loop-plan.md`.
      Live-verified on free Ollama (7-step plan, apply/skip/stop, "Run complete").
- **WHOLE AI-EDITOR ARC COMPLETE**: P1(7 cmds) + P1b(registries) + P2(9 cmds) +
      P3(page multi-element) + P4(agent loop), plus 3 live-verify fixes + the
      data-loss guard. Leftovers (non-blocking): workspace auth (only if server-side
      AI writes land), free-Ollama metering revisit, dup AIModel enum SSOT, P3-deepen,
      agent v2 (auto-apply / publish-in-loop / editable plans — see P4 plan NOT-in-scope).

### Remaining to COMPLETE the whole-editor-AI arc (next-session checklist)
- [x] **Live-verify** the element commands in the browser — done 2026-06-04
      (set-style/duplicate/undo walked; 2 bugs fixed; see UPDATE above).
- [x] **P2 full element coverage** SHIPPED 2026-06-04. `set-attribute`
      (`d67480fe`), style allowlist ~28→~70 props (`0ee44bad`), and
      `set-style-variant` (`c019b5a7`, 9th command — pseudo + breakpoint via the
      second style store). Each new command = the 4-edit pattern.
- [x] **P1b registries** SHIPPED 2026-06-04 (`13f31a98`) — editor apply map +
      server prompt-spec/`agentCallable` allow-list. Validators kept as
      type-narrowed union handlers (registry-izing = banned `as` casts).
- [x] **P3 v1 page-scope multi-element edits** SHIPPED 2026-06-04 (`174718a1`,
      live-verified). Scope guard exact-id → allowed-id Set; page scope sends the
      element list, `generatePageEditCommands` validates ids ∈ page. STILL TODO
      (P3 deepen): multi-level nesting in add-section, richer diff/preview.
- [x] **Bonus fixes 2026-06-04**: error-surfacing in panel (`5d3ebb49` — quota/
      provider errors were silent) + **data-loss guard** (`ea93f9f7` —
      raced/empty `loadProject` + auto-save was wiping server content; wiped this
      test site's Home page mid-session). When restarting the dashboard, wait for
      it to fully warm before reloading the editor.
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

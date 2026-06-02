---
date: 2026-06-03
topic: agent-command-bus-incanvas-ai
---

# Agent-Native Command Bus + In-Canvas AI

Seeded from `docs/ideation/2026-06-03-editor-dead-features-beat-webflow-ideation.md` (idea #2).
Revised 2026-06-03 after `ce-doc-review` (7 personas). Correction notes inline.

## Problem Frame

The editor's AI is a read-only sidebar today: it streams text tokens and **stops there**. The `DiffEdit` / `applyOps.{preview,commit}` types exist (`editor/.../ai/types.ts`, `server/services/types.ts`), but:
- The **server never emits an edit chunk** — `streamContent()` yields only `{type:'text'}` / `{type:'done'}` (`server/services/ai.service.ts`). `applyOps.commit` is typed `Record<string,unknown>` and carries nothing.
- The **client `onAccept` only flips `edit.state` to "applied" and calls `unlock()`** (`AITab.tsx`) — it does not touch the canvas. The `chunk.type==='edit'` branch in `useStreamPrompt.ts` is dead because nothing emits it.

So the real gap is **not wiring** — it is the entire server-side path that turns a prompt into a validated sequence of typed command invocations. That path is the feature.

Meanwhile every mutation flows through ~40-60 ad-hoc entry points; the Inspector even routes style writes **4 ways across two different state stores** (`Element._styles` via `el.setStyle` vs `StyleEngine.styles` via `setRule`/`setBreakpointStyle`, branched on pseudo-state × breakpoint × set/remove — `useStyleHandlers.ts`). There is no typed surface an agent can call.

This blocks the competitive bet: AI that edits the canvas in place (Framer Workshop ships it; Webflow's AI is wizard-only). Fix: a typed **command registry** where each mutation is both a UI handler and an agent-callable tool — built once, compounding into AI-builds-site, macros/replay, and ordered-change multiplayer.

**Sequenced, thin-first.** v1 proves the thesis with the smallest real slice; later phases expand.

## Verified Codebase Ground Truth (corrected by review)

- `CommandCenter` **exists** (`engine/commands/CommandCenter.ts`) with ~37 registered commands — but all are **arg-less, selection-implicit keyboard actions** (undo/nudge/zoom/delete). The `CommandData` type (`shared/types/command.ts`) has **no `inputSchema` and no typed `args`** (`run(composer, options?: Record<string,unknown>)`), and is **defined twice** (`command.ts` + `types/index.ts` — SSOT violation). R1/R2 introduce a **new** parameterized+Zod command shape, not a field-level extension.
- Undo is **snapshot-diff**: `HistoryManager.record()` runs `createPatch(prev,new)` on `PROJECT_CHANGED`, which `Composer.endTransaction` emits only at `transactionDepth===0`, and which History further **coalesces on a 500ms time window** — NOT on transaction boundaries. Consequence: per-command transactions do **not** guarantee one undo step; a single outer transaction around the whole AI batch does (see R1/R7).
- `el.setStyle()` bypasses Composer. **Unverified**: whether it calls `markDirty()`/emits `PROJECT_CHANGED`. If it does not, wrapping it in a transaction records nothing and undo silently fails. **Pre-planning spike.**
- Metering already **exists and is live**: `quota.service.ts` (`checkQuota`/`recordUsage`) gates `streamPrompt` today (`server/trpc/routers/ai.ts`). "AIUsage" is just the Prisma model. R8 is mostly done — the new work is hardening, not building.
- Provider abstraction exists (`getProvider` → Anthropic/OpenAI by model name). Adding Ollama = one new provider file + enum entry; **routing intelligence + GPU hosting is net-new and deferred**.

## Requirements

**Command Registry (the spine)**
- R1. A new typed agent-command shape: `{ id, title, inputSchema (Zod), run(composer, args) }`, separate from (or a superset of) the legacy arg-less `CommandData`. Resolve the duplicate `CommandData` definition first.
- R2. Each agent-command is exposed as an agent tool via its Zod `inputSchema`. A command is AI-callable **only if explicitly flagged** (`agentCallable`) — destructive/non-canvas commands (undo, delete-all, export, publish) are excluded. The slice-1 AI-exposed set is the allowlist.
- R3. Slice-1 commands wrap the existing engine methods, no engine rewrite. Register: `set-style`, `add-element`, `remove-element`, `move-element`, `add-page`. **AI-exposed in v1: only `set-style` + `move-element`** (the others are UI-callable but not in the v1 AI tool set — they are not reachable from the "edit selected element" use case).
- R4. v1 `set-style` is restricted to **desktop / normal-state inline styles** (the `el.setStyle` path) and says so in the UI. Pseudo-state and breakpoint edits ("make hover red", "tighten mobile spacing") require the `StyleEngine.setRule`/`setBreakpointStyle` store and are deferred until the two style paths share one flush function. (Do not claim "AI and UI land at the same method" — they do not for non-desktop styles.)

**Prompt → Commands (the actual feature — promoted from a deferred detail)**
- R5. A server path turns a scoped prompt into a validated, ordered list of command invocations `[{ commandId, args }]`. **v1 mechanism = constrained-JSON output** (system prompt instructs the model to emit the command-batch JSON; server validates each entry against the command's Zod `inputSchema`; stream it back inside `applyOps.commit`). Full provider tool-use/function-calling is a later upgrade. Rationale: the thin path is ~days and provider-portable; native tool-use diverges across frontier vs open models.
- R6. The server **must validate** every emitted command against the registered Zod `inputSchema` before it reaches the client; out-of-scope element IDs (outside the user's selected subtree) are rejected. Page content fed into the prompt (text, imported HTML, CMS data) is treated as untrusted and cannot override system directives.

**In-Canvas AI (the user-visible win)**
- R7. v1 capability = edit the **single** selected element/subtree. Multi-select prompting is **blocked in v1 with a visible message** (today it is a silent no-op — `toServerScope` returns null and submit bails). User selects → prompts in a floating input anchored to the selection → AI emits `set-style`/`move-element` commands scoped to that element.
- R8. Result shown as a diff (reuse `DiffEdit` rows for style deltas; on-canvas ghost/overlay for `move-element` since text rows can't convey spatial change). Accept runs the validated commands; reject discards. `applyOps.preview` is a **read-only overlay** that does not write to the canvas, so reject is a clean discard with no rollback.
- R9. An accepted AI edit (one or many commands) is **one atomic undo step**, achieved by wrapping the whole batch in a **single outer `beginTransaction`/`endTransaction`** — not per-command transactions, not the 500ms coalesce window.

**Cost / Provider / Security**
- R10. Reuse the live `quota.service` gate. Harden it: **record/reserve usage before the stream starts** (today `recordUsage` runs after the stream completes, so N concurrent connections each pass `checkQuota` before any increment lands — a concurrent-bypass + cost-blowout hole).
- R11. Model selection is **server-authoritative**: the client model field is a hint; the server picks the model by plan tier. Expensive frontier models are gated to paid plans (today the client can force Opus on a free account).
- R12. Provider stays swappable behind the existing abstraction (already satisfied: swap requires no feature-code change). **Deferred post-v1:** the Ollama self-host lane (cheap-edit routing, GPU hosting). When added, the Ollama endpoint is a **server-side env var only, allowlist-validated** (never client-supplied — SSRF), credentials via the same secret pattern as `ANTHROPIC_API_KEY`.

## Success Criteria
- User selects an element, types a prompt, sees a diff, accepts, the canvas mutates, and **one undo reverts the whole edit**.
- Every AI canvas action runs through a typed command validated against its Zod schema; no AI-only private mutation path; only allowlisted commands are AI-callable.
- `set-style` is registered in the extended registry and invoked by both the AI and ≥1 existing UI call site (proves "one definition, two callers").
- AI usage is gated server-side and cannot be bypassed by concurrency or client model override.
- Swapping provider requires no command/AI-feature code change.

## Scope Boundaries (v1 non-goals)
- No add-sections / full-page / multi-page generation. Edit-selected-element only.
- No pseudo-state / breakpoint AI style edits (two-store unification deferred).
- No multi-element AI editing (blocked with a message).
- No Ollama self-host lane / cheap-vs-hard routing intelligence (provider abstraction stays; routing defers).
- No multiplayer, macros, replay; no reviving stock/integrations/animation panels.
- No forced migration of all ~40 UI mutation call sites — but see the migration forcing-function question below.

## Key Decisions
- **Thin-first, spine-laying.** v1 = `set-style` (+`move-element`) command + constrained-JSON prompt path + `onAccept` runs the batch in one transaction. ~Days, not months.
- **Reuse what's real, build what isn't.** Reuse: CommandCenter registry, `quota.service`, provider abstraction, `DiffEdit` rows. Build (net-new, do not undersell): the agent-command type, the prompt→validated-command-batch path, the allowlist + scope validation, the floating in-canvas prompt UI.
- **Outer-transaction undo**, not per-command (review-corrected).
- **Server-authoritative metering + model choice** (review-added).

## Dependencies / Assumptions
- Assumes `el.setStyle()` emits `PROJECT_CHANGED`/`markDirty`. **Unverified — pre-planning spike** (R9 silently breaks if false).
- Assumes a constrained-JSON model output is reliable enough for `set-style` args (verify in planning; cheap to prototype).

## Outstanding Questions

### Decided
- **#2-vs-#1 sequencing (resolved 2026-06-03):** Build the **thin de-risking slice first**, then a go/no-go gate. Rationale: the slice tests both unknowns the review exposed (is the prompt→command path feasible, and is edit-selected-element valuable) for ~3 days, and every artifact (command registry, quota hardening, provider abstraction, security) is reusable if we later pivot to #1. **Gate after demo:** if the in-canvas edit feels weak vs the existing Inspector, switch to #1 hybrid-publish; if strong, continue #2 expansion. #1 stays fully open.

### Thin Slice (the v1 plan target)
- `set-style` agent-command (desktop/normal only) registered with Zod `inputSchema`.
- Constrained-JSON prompt path: scoped prompt → `[{commandId:"set-style", args}]`, server-validated against the schema.
- Floating prompt on the selected element → diff → accept runs the batch in **one outer transaction** → one undo.
- Server-authoritative model + the live `quota.service` gate (with the pre-stream reserve fix).
- Explicitly out of the slice: `move-element`, add/remove/page commands, multi-select, pseudo/breakpoint styles, Ollama.

### Resolve Before Planning
- [Affects R9/R4][Technical] Confirm `el.setStyle` dirty-emission (the pre-planning spike) — gates whether v1 undo works at all. (Can be the plan's first task.)

### Deferred to Planning
- [Affects R5][Technical] Exact constrained-JSON command-batch schema and the system-prompt format that produces it.
- [Affects R8][Design] Floating-prompt widget vs reusing the sidebar AI tab; streaming/loading/error/credit-exceeded states; on-canvas ghost for `move-element`.
- [Affects R10][Needs research] Credit model: count vs token vs cost; per-request `max_tokens` cap; whether in-canvas AI shares the daily quota with the existing sidebar/alt-text/DS uses.
- [Affects R2][Technical] One unified command type with optional `inputSchema` vs a separate agent-command registry; reconcile the duplicate `CommandData` definition.
- [Affects migration][User decision] Forcing function for completing the UI-call-site migration — "ordered-change multiplayer" and macros are **blocked, not merely deferred**, until the Inspector path also flows through commands.

## Next Steps
-> /ce-plan for structured implementation planning (after confirming the two Resolve-Before-Planning items)

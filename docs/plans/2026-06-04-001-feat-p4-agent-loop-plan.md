---
title: "P4 — Agent build loop (plan → steps → approve)"
type: feat
status: planned
date: 2026-06-04
origin: docs/plans/2026-06-03-002-ai-editor-arc-roadmap.md
review: plan-eng-review (architecture locked 2026-06-04)
---

# P4 — Agent Build Loop

Final phase of the AI-editor arc. The AI drives a multi-step build: it proposes
an ordered plan, then walks the steps one at a time, the user approving each.

## Architecture decision (LOCKED 2026-06-04)

**Plan-loop over the proven single-shot pipeline — NOT native provider tool-use.**

The roadmap assumed P4 "needs native tool-use (function-calling)". It does not.
`AIProvider` is `{ stream, generate }` only; adding tools means extending all
three providers, and Ollama function-calling is model-dependent — it would break
the free-local wedge. Instead the agent loop reuses everything proven this
session: the 9 registry commands, `generateEditCommands`/`generatePageEditCommands`,
the diff/approve UI, and `applyAiEdit` (one undo per step).

```
user prompt ("build a pricing page" / "modernize the hero and add a CTA")
        │
        ▼
 server: generatePlan(prompt, pageElements, model)          intent:"plan"
        │   → { steps: [ { title, scope, instruction } ] }   (≤ MAX_PLAN_STEPS)
        │     scope = { kind:"element", id } | { kind:"page" }; ids ∈ page
        ▼
 editor: AgentRunner walks steps sequentially
        │
        ├─ step i: status "running"
        │     run EXISTING generate (element/page) with step.instruction + scope
        │     → diff rows (existing DiffRows)
        │     status "awaiting-approval"
        │        user: [Approve] → applyAiEdit (one undo)  → "applied"
        │              [Skip]    → "skipped"
        │              [Stop]    → end run
        ▼
 run complete: N applied / M skipped. Each applied step = one undo entry.
```

## Components

1. **Server `generatePlan`** (`ai.service.ts`) — constrained-JSON like the
   command path. Returns `{ steps: [{ title: string, scope, instruction: string }] }`.
   Validates: step count ≤ `MAX_PLAN_STEPS` (8), each `scope` element id ∈ the
   supplied page element set (reuse P3 allowed-id guard), `title`/`instruction`
   plain text (no markup, length-capped). Router gets `intent:"plan"`.
2. **Editor `useAgentRunner`** (`tabs/ai/hooks/`) — state machine over the plan:
   `idle → planning → (per step: running → awaiting-approval → applied|skipped) → done|stopped`.
   Each step delegates to the existing `useStreamPrompt` (style-command intent) +
   `applyAiEdit`. Holds the step list + per-step status + current index.
3. **Editor UI** — `AgentPlan` step list (title + status chip) + per-step
   Approve/Skip/Stop on the awaiting-approval step. Reuses `DiffRows` for the
   pending diff. Wired into `AITab` as a mode (chat vs agent) or a new sub-panel.

## State machine (per run)

```
            ┌─────────┐  plan empty / error
   submit──▶│ planning │──────────────▶ done(error shown)
            └────┬────┘
                 │ steps[]
                 ▼
        ┌──────────────────┐   no commands
   ┌───▶│ step i: running   │───────────────▶ mark "no change", i++
   │    └────────┬─────────┘
   │             ▼
   │   ┌────────────────────┐  Approve  ┌──────────┐
   │   │ awaiting-approval   │──────────▶│ applyAiEdit│── i++
   │   └───┬───────────┬────┘           └──────────┘
   │    Skip│        Stop│
   │  (i++) │            ▼
   └────────┘         end run
   (i < steps.length ? loop : done)
```

## Cross-model tension — resolved (2026-06-04)

Codex challenged the **upfront full-plan** shape: precomputing all N steps against
the initial page goes stale as the canvas mutates, and a step cannot reference an
element an earlier step creates. Codex (and the eng-review) recommended an
incremental "generate next step from current canvas" loop. **User decision: keep
upfront full-plan.** Mitigations baked into this design so the staleness is
bounded:

- **Creation steps are self-contained.** Prefer `add-section` (builds + styles a
  whole nested block in one command — no future-id references) and page-scope for
  anything that creates structure. The staleness only bites create-THEN-reference
  chains; self-contained creation steps avoid it.
- **Live re-validation at apply.** Before applying a step, drop any command whose
  target id no longer exists on the canvas (the canvas is the source of truth, not
  the plan-time snapshot). `applyAiEdit` already re-validates args; extend it to
  skip stale-id commands rather than throw.
- **Version check (codex #5/#10).** Tie a step's previewed diff to the canvas
  version it was generated against; if the user manually edits between preview and
  approve, re-generate that step instead of applying a stale diff.

## Decisions taken (defaults; flagged for review)

- **Approve-each, not auto-apply.** Matches "user approving steps". Auto-apply-all
  is a future toggle, not v1.
- **Canvas edits only — no publish in the loop (v1).** Publish is destructive +
  external; keep the agent on reversible canvas edits. (NOT in scope below.)
- **Step failure is non-fatal.** A step yielding `[]` → "no change"; an apply
  throw → "failed", continue. Never abort the whole run on one bad step.
- **Plan is not user-editable in v1.** User approves/skips/stops; reordering or
  inline-editing steps is future.

## Tests (full coverage from the start)

- Server: `generatePlan` shape validation (drops steps with bad scope id, over-cap
  count, markup in title/instruction); empty/garbage model output → `{steps:[]}`.
- Editor: `useAgentRunner` state machine — happy path (3 steps, approve each →
  3 applied), skip mid-run, stop mid-run, empty-step ("no change") continues,
  apply-throw marks failed + continues. Mock `useStreamPrompt` + `applyAiEdit`.
- Live-verify: a 2-3 step build on free Ollama (e.g. "add a heading then a button
  then make the heading big") → approve each → canvas reflects all, each one undo.

## NOT in scope (v1)

- Native provider tool-use / function-calling — explicitly rejected (see decision).
- Publish/deploy as an agent step — reversible canvas edits only in v1.
- Auto-apply-all (no per-step approval) — future toggle.
- User-editable / reorderable plans.
- Parallel step execution, multi-page agent runs.
- Workspace/siteId auth — still no server-side DB write (client applies); revisit
  if the agent ever writes server-side.

## What already exists (reused, not rebuilt)

- `generateEditCommands` / `generatePageEditCommands` + the 9-command registry —
  each step is one existing single-shot generation.
- `applyAiEdit` (one transaction + `flushPending` = one undo) — per applied step.
- `DiffRows` + Approve/Discard UI — the per-step diff/approval surface.
- P3 page element-list gathering + allowed-id scope guard — plan step scopes.
- Quota reserve/release, error-surfacing, the data-loss guard — all inherited.

## Failure modes

| Codepath | Failure | Test? | Handled? | User sees |
|----------|---------|-------|----------|-----------|
| generatePlan | model returns prose/garbage | yes | `{steps:[]}` → "couldn't plan that" | clear empty-plan message |
| step generate | yields `[]` | yes | mark "no change", continue | step chip "no change" |
| step apply | applyAiEdit throws | yes | mark "failed", continue | step chip "failed" |
| run | user navigates away mid-run | — | runner is component-local; unmount stops | run ends, applied steps persist |

## Worktree parallelization

Sequential implementation — server `generatePlan` must land before the editor
runner can be tested end-to-end. Within the editor, `useAgentRunner` and the UI
components share the same module, so one lane. No parallelization opportunity.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 1 architecture decision locked (plan-loop, not native tool-use); scope right-sized; tests + failure modes specified |
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | step-list + approval UI is new surface — consider before build |
| Outside Voice | `/codex` | Independent 2nd opinion | 0 | — | offered |

- **UNRESOLVED:** none — core architecture locked.
- **VERDICT:** ENG CLEARED (plan stage) — ready to implement. Optional: /plan-design-review for the step-list/approval UI; /codex challenge for an outside voice.

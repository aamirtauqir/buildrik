---
title: "Whole-editor AI — agent-native parity + hosted model"
type: feat
status: planned
date: 2026-06-04
origin: docs/plans/2026-06-03-002-ai-editor-arc-roadmap.md
review: autoplan (lean — CEO/eng scope + codex challenge, 2026-06-04)
---

# Whole-Editor AI — Agent-Native Parity

Goal: everything the editor UI can do, the AI can do too — and real users get AI
without running local Ollama. Built on the shipped arc (9 commands, registries,
page-scope, P4 agent loop). This closes the "poora editor AI-based" gap.

## Where we are

Shipped: 9 edit-commands (set-style, set-text, add/delete/duplicate/move-element,
add-section, set-attribute, set-style-variant), per-side command registries,
page-scope multi-element edits, P4 agent build loop (plan→walk→approve). Free on
local Ollama; two surfaces (✨ popover + sidebar AI panel + Agent mode).

## The gap (what the UI does but AI can't yet)

```
UI capability                         AI command today?   Plan
────────────────────────────────────  ─────────────────   ──────────────────
text / headings / wording             set-text            ✓
inline styles (desktop)               set-style (~70)     ✓
hover/focus + tablet/mobile           set-style-variant   ✓
add / delete / duplicate / move       (those commands)    ✓
build a section                       add-section         ✓
link href / alt / target              set-attribute       ✓
image: pick from media library        ✗                   set-image (W1)
component: insert saved/catalog        ✗                   insert-component (W1)
page settings: SEO title/desc/slug     ✗                   set-page-setting (W2)
theme / design tokens (colors/fonts)   ✗                   set-token (W2)
publish / deploy                       ✗                   agent publish step (W3)
```

## Workstreams

### SEQUENCING CORRECTION (2026-06-05, found during build)
`instantiateComponent` is **async** (ComponentManager.instantiateComponent →
Promise; user-saved comps load from IndexedDB). `applyAiEdit` is a **synchronous**
transaction (begin → apply commands → endTransaction → flushPending = one undo).
Running an async insert inside the sync transaction is the async-undo race that
already caused real damage this session. So **insert-component is NOT a simple W1
canvas command — it depends on the async-aware executor seam (W2 prereq).** Build
order corrected: **executor seam FIRST** (an async-capable apply path that opens
the transaction, awaits the command, then closes + flushes), THEN insert-component
+ set-page-setting + set-token ride it. set-image (sync el.setAttribute) was the
only truly-in-pattern W1 command and is already shipped.

### W1 — Element-creation parity (media + components)
- **set-image**: target an image element, set its `src` to an asset already in the
  media library (validate the asset id/url exists; reuse `set-attribute` value
  guards — no arbitrary URLs, no javascript:/data:). Upload-from-prompt is OUT
  (file handling is heavy; user uploads via media tab, AI references).
- **insert-component**: insert a component from the catalog / user-saved components
  by id. Reuses `resolvePlacement` (the add-element placement logic). Validate the
  component id against the registry.
- Same 4-edit pattern + registry entry both sides.

### W2 — Config parity (page settings + theme tokens)
- **set-page-setting**: SEO title / description / slug on the current page. These
  go through the settings store, NOT `el.setStyle` — like set-style-variant routed
  to a different store, this routes to the page-settings store. Plain-text + length
  guards (reuse the SEO field limits already in the schema).
- **set-token**: set a design token (theme color / font / spacing) via the
  TokenRegistry. Validate token id ∈ registry + value guards (no url/expression for
  colors). This is the highest-leverage "make the whole site brand X" command.
- These are NOT element-scoped — new scope kind or page-scope with a config target.

### W3 — Agent v2 + hosted model + discoverability
- **Hosted model**: `resolveModelForUser` already falls back to the tier model
  (PLAN_MODELS) when `OLLAMA_BASE_URL` is unset — so hosted ALREADY works if
  `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` is set in prod. The real work is a config +
  cost decision, not much code: set the prod key, keep free-Ollama for self-host/dev,
  and the metering gate (10/day FREE) already applies. Document the matrix; verify
  the prod env has a key.
- **Publish-in-loop**: an agent step that triggers the existing publish flow (with
  explicit user approval — publish is the one irreversible step). Agent v2.
- **Agent v2 UX**: auto-apply toggle (skip per-step approval), editable/reorderable
  plans, run history.
- **Discoverability**: surface AI more prominently (the Agent mode is buried in a
  sub-toggle; consider a top-level entry).

## DECISION (autoplan gate, 2026-06-04): FULL PARITY — risks accepted

User chose full parity over the recommended scope-down (measure-adoption-first).
Codex + the repo's own thin-slice plan + the earlier CEO review all flagged it as
premature, but the user owns the call. The codex findings are therefore folded in
below as **hard implementation requirements** — full parity is built, but built
safely. None of these are optional now:

### Codex findings → requirements (must satisfy per command)
- **New executor class (architectural prereq for W2 + publish).** Transport only
  has element/page scope; runtime dispatches only the 9 canvas commands; the agent
  runner only routes `style-command` → `applyAiEdit`. `set-page-setting`, `set-token`,
  and publish are NOT canvas-element mutations — they need a distinct command class +
  executor (a `config-command` intent / apply path) alongside the existing one. Build
  this seam FIRST, before W2 commands.
- **Prompt context.** The model only sees element id/type/text (cap 200). Each new
  command needs its registry fed into the prompt + validator: asset list (set-image),
  component catalog ids (insert-component), token registry ids (set-token), current
  page-settings (set-page-setting). No id the model can't see.
- **set-image:** switch media validation to a scheme ALLOWLIST (http/https/relative
  only — current code permits "any other scheme"); validate the asset id/url against
  the asset list sent in the prompt (accept that 200-cap + local-only media bound the
  set; out-of-list → reject).
- **insert-component:** catalog ids → server-validatable. User-saved (browser
  IndexedDB, per-project) → server CANNOT validate; validate client-side in apply +
  **cap the cloned subtree size** (max nodes) so one command can't inject an unbounded
  tree.
- **set-page-setting:** add shared server-side slug validation + collision check
  (manual UI validates; engine just trims; shared schema accepts any string today).
- **set-token:** scope v1 to the persisted kinds only (color / spacing / type — the
  registry exposes 14 but `persistAll` writes 3); reject other kinds rather than
  silently not persisting. Route through one coherent token-set API.
- **Hosted model cost guard:** verify provider key is present before admitting AI
  traffic (fail fast with the error-surfacing path); cap output tokens; count an agent
  RUN (1 plan + N steps) appropriately against quota, not just per-call — a "build page"
  run can burn many premium calls. Business defaults to opus-4-7 (expensive) — confirm.
- **Approval boundary stays.** Auto-apply is opt-in only; publish-in-loop ALWAYS
  requires explicit per-publish confirmation (it's async, remote, no undo). Never fold
  publish into silent auto-apply.

## Premises (gate — confirm before building)
1. "Whole editor AI" = **agent-native parity** (every UI action also an AI command),
   not replacing the inspector. The AI's edge is composite/generative + accessibility;
   per-element it complements the panel.
2. Hosted model in prod = set a paid API key (Anthropic/OpenAI); free-Ollama stays
   the self-host/dev wedge. We accept paid cost for hosted users (metering already caps).
3. Upload-from-prompt (AI uploads a file) is OUT of v1 — AI references existing
   media assets only.
4. Each new command follows the proven 4-edit registry pattern; no new architecture.

## Approaches considered
- **A (recommended): incremental command coverage on the existing registry.** Add
  set-image, insert-component, set-page-setting, set-token one at a time (the proven
  pattern), then agent v2. Lowest risk, reuses everything, each command independently
  shippable + testable.
- **B: generic "set-property" mega-command.** One command that can set any
  element/page/token property by path. Fewer commands, but erases the per-command
  validation + type safety that makes the security model work (would need `as` casts,
  banned). Rejected — DRY at the cost of the safety model.
- **C: tool-use rewrite.** Already rejected in P4 (no native tool-use; Ollama
  function-calling flaky). Not revisiting.

## Recommended approach
**A.** Sequence: W1 (set-image, insert-component) → W2 (set-page-setting, set-token)
→ W3 (hosted-model config + verify, then agent v2). Each command: union member +
validate + prompt rule (agentCallable) + apply-dispatch + tests + live-verify.

## Tests
- Per command: server extractValidEditCommands accept/reject (allowlist, id ∈ valid
  set, value guards); editor schema + apply (mock composer store) + applyAiEdit
  dispatch + an unsafe-input skip. Mirrors set-attribute/set-style-variant test shape.
- Live-verify each on free Ollama through the panel (select → prompt → diff → apply).
- Hosted model: smoke that resolveModelForUser returns the tier model when
  OLLAMA_BASE_URL unset + a key is set.

## NOT in scope (v1)
- Upload-from-prompt (file handling). AI references existing assets only.
- Generic set-property mega-command (B) — rejected.
- Native tool-use (C) — rejected in P4.
- Full agent v2 (auto-apply / editable plans / run history) lands after W1+W2 parity.
- Real-user adoption instrumentation (separate analytics arc).

## What already exists (reuse)
- Command registries (server prompt-spec + agentCallable; editor COMMAND_HANDLERS).
- `applyAiEdit` (one transaction + flush = one undo), DiffRows, agent loop.
- `resolveModelForUser` hosted fallback + quota gate + error surfacing + data-loss guard.
- Media library (asset ids/urls), component catalog/registry, page-settings store,
  TokenRegistry — the stores W1/W2 commands route into.

## Failure modes
| Codepath | Failure | Handled |
|----------|---------|---------|
| set-image | asset id/url not in library | reject command (validate against library) |
| insert-component | component id unknown | reject (validate against registry) |
| set-token | token id not in registry / unsafe value | reject |
| set-page-setting | over-length SEO / markup | reject (reuse schema limits) |
| hosted model | no API key in prod | AI "off" — surfaced as error (existing error-surfacing) |
| publish-in-loop | publish fails | existing publish failure UX; agent marks step failed |

## Worktree parallelization
W1 and W2 commands are independent (different stores) — could run in parallel lanes.
But all touch the same two registry files (server ai.service + editor applySetStyle),
so commits would conflict; sequential is cleaner. W3 hosted-model config is fully
independent (quota.service + env) — that lane can run anytime.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Eng Review | `/autoplan` | Architecture & tests | 1 | ISSUES_OPEN (PLAN via /autoplan) | 9 code-grounded findings → folded in as hard requirements |
| CEO Review | `/autoplan` | Scope & strategy | 1 | ISSUES_OPEN | adoption-gate skipped; user chose full parity anyway |
| Outside Voice | `/codex` | Independent challenge | 1 | issues_found | 9 findings, all file:line grounded; became requirements |

- **USER CHALLENGE:** Codex + repo thin-slice plan + CEO review all recommended scope-down (measure adoption first). User chose FULL PARITY, risks accepted. Codex findings folded in as mandatory implementation requirements (new executor class, prompt-context, per-command guards, cost guard, approval boundary).
- **VERDICT:** Plan approved by user (full parity). Build sequence: executor seam → W1 (set-image, insert-component) → W2 (set-page-setting, set-token) → W3 (hosted-model guard, agent v2). Each command: validate + prompt-rule + apply + tests + live-verify + codex guards.

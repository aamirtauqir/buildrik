# F-A5 · AI edit pipeline · F-A8 · Sync fan-out — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, real session.

## F-A5 — surface walked, **no AI call fired**

A hard guard aborted every `ai.*` / `streamPrompt` / `agent.*` request for the
whole probe, and the counter read **0**: nothing tried to fire, because nothing
was submitted. Firing a paid generation is off-limits without the founder, and
the guard is there so an accidental keystroke could not have done it either.

| # | leg | result |
|---|---|---|
| 1 | doors | **PASS** — ⌘K offers **"Open AI panel · I"** and **"Open AI Assistant · ctrl+shift+a"** |
| 2 | scope chip | **PASS** — the panel header reads **`Scope: Whole page`** |
| 3 | the copy | **PASS, and it is the best line in the editor** — *"AI proposes a diff and never writes directly. **Apply lands as one undo step.**"* It states the limit of the AI's authority and the escape hatch in one sentence, before anything is typed. |
| 4 | suggestions | **PASS** — concrete, not generic: *"Make the hero warmer"*, *"Write alt text for every image"*, *"Shorten the menu descriptions"*, plus a `DRAFT` row *"✦ Draft a new section from a brief ›"* |

**Noted, not filed:** the prompt textarea has **no `maxLength`** (reads `-1`)
while the contract says *"prompt ≤5000"*. The server validates, so this is not a
hole — but the input does not stop you, and a 6000-character paste finds that
out only after a round trip.

**Not walked:** everything past the prompt — the streamed edit-command batch and
its 14 command types, the server-side allow-list validation, the accept/reject/
regenerate diff UI, the one-transaction apply, adoption logging, the Agent mode's
≤8-step plan, the 403 → UpgradeModal quota path, the privileged-action confirm
with its single-use 5-minute token, and the client transport guards (30 req/60 s,
timeout 30 s, retry ×2, concurrency 3, 5-minute cache).

## F-A8 — **code-verified, not walked**

These are background mirrors with no UI of their own, so this is a file-level
check and is recorded as such rather than dressed up as a walk.

| mirror | file | retry/queue refs | tests |
|---|---|---|---|
| `cmsSync` | ✓ | 25 | 1 |
| `componentSync` | ✓ | 12 | 1 |
| `versionSync` | ✓ | 12 | 1 |
| `templateSync` | ✓ | 11 | 1 |
| `MediaVersionService` | ✓ | 0 | 1 |

The contract's *"`online` auto-retry"* is real and lives in one place:
`services/syncRetryQueue.ts:30` — `window.addEventListener("online", () => void this.retry())`.

`MediaVersionService` shows **zero** retry/queue references, which matches the
contract: its row names a server-side plan cap (5/25/100), not an offline queue.

What this check does **not** establish: that any mirror actually recovers after
a disconnect. That needs a walk with the network cut mid-mutation, and it was
not done.

---

## Addendum, 2026-08-25 — the AI pipeline fired for the first time

Lane 2 of `docs/plans/2026-08-25-editor-flow-walk-arc.md`. The 08-24 record's
headline was **"no AI call fired"** — a hard guard aborted every `ai.*` request
and the counter read 0. That guard is gone and the pipeline has now been driven
end to end on the committed rig, fixture `cmrsur1fp000unh3rvmmiq25t`.

### The first fire failed — and the root cause is a guard that checks the wrong thing

`ai.streamPrompt` returned **HTTP 200 in 517 ms** and the panel showed:

> **The AI service didn't respond.** Nothing was changed. This is usually the
> model provider, not your site — try again in a moment. · **Unknown error**

The SSE body carried the truth:

```
event: serialized-error
data: {"message":"Connection error.", … "stack":"… at async OllamaProvider.generate …"}
```

**The request never went to OpenAI.** `resolveModelForUser`
(`quota.service.ts:167`) short-circuits on the mere *presence* of the env var:

```js
if ((process.env.OLLAMA_BASE_URL ?? "").length > 0) {
  announceProvider("ollama");
  return "ollama";          // tier, client hint and reachability all ignored
}
```

`.env.local` sets `OLLAMA_BASE_URL=http://localhost:11434`, nothing is listening
(`curl` → HTTP 000), and `OLLAMA_MODEL` is `gemini-3-flash-preview:latest` — a
*Gemini* model name pointed at an Ollama endpoint. A valid `OPENAI_API_KEY` is
present and was **never used**; probed directly it answers 200.

The W3 guard was supposed to stop exactly this. Its own docstring says it exists
so the call does not "fail deep with an opaque 401 … or surface as a silent
empty reply". It passed anyway, because it only asks whether the variable is
set:

```js
if (isOllamaModel(model)) {
  if (!(process.env.OLLAMA_BASE_URL ?? "").length) throw …   // set ≠ reachable
  return;
}
```

**Three findings, ranked:**

1. **`assertProviderConfigured` checks configuration, not reachability.** A
   configured-but-dead provider passes the fail-fast guard and then fails deep —
   the precise outcome the guard was written to prevent. It is the same shape as
   `feedback_env_template_literal_fails_open`: a variable's presence is treated
   as a working dependency.
2. **The error copy misattributes blame.** "This is usually the model provider,
   not your site" — here it *was* the site's own configuration. Same class as
   the 429-rendering-as-"expired-link" defect found in task 0.
3. **`Unknown error` is what the user gets** for a connection refusal that the
   server knew precisely.

**Not a production risk, and the gate already knows.**
`scripts/check-prod-env.mjs:242-251` hard-fails a prod deploy when
`OLLAMA_BASE_URL` is set, with the reason written out: *"resolveModelForUser
would route ALL AI to a local model server that isn't there"*. So this is
dev-scoped — but in dev it means **AI is 100% dead while looking configured**,
which is why the 08-24 walk could never have reached the pipeline even without
its guard.

### With the routing corrected, the whole pipeline passes

Re-run with `OLLAMA_BASE_URL=` cleared on the dev server (no change to
`.env.local` — that is the founder's file):

**Server** — a validated single-shot edit-command batch, exactly as Ch.11 §F-A5
describes:

```json
{"type":"edit","edit":{"target":"page","summary":"1 change",
 "rows":[{"field":"font-weight","from":"","to":"bold"}],
 "applyOps":{"preview":{},"commit":{"commands":[
   {"commandId":"set-style","args":{"elementId":"el-msz82g6s-16o7fcvwd3q",
    "property":"font-weight","value":"bold"}}]}}}}
{"type":"done"}
```

The element id is the first `heading` in the scope list — the model picked the
right target out of 50 elements, and `set-style`/`font-weight` cleared the
server-side allow-list.

**Client** — diff UI and the apply contract:

| leg | result |
|---|---|
| prompt → stream | **PASS** — panel shows `YOU` / `ASSISTANT` / `1 change proposed` |
| diff rows | **PASS** — `font-style` · `italic`, with from/to |
| controls | **PASS** — `Discard` · `Apply`, and the standing line *"Apply lands as one undo step."* |
| apply | **PASS** — measured `font-style: normal` → `italic` on the target node, panel flips to `✓ Applied` |
| **one undo step** | **PASS** — a single ⌘Z returns it to `normal`. The contract holds |

**A false finding I nearly filed.** The first undo attempt read "not reverted".
It was a confounded baseline: the earlier run's `font-weight: bold` had already
persisted, so the second apply was a no-op and undo had nothing to undo.
Re-running against an unapplied property (`font-style`) showed the contract
holds. Measured before/after with `getComputedStyle` on `[data-buildrick-id]` —
note `data-element-id` does **not** exist on canvas nodes, which is a documented
harness trap.

### Still not walked

Agent mode's ≤8-step plan, the 403 → UpgradeModal quota path, the privileged
`site.publish` confirm with its single-use 5-minute token, `Discard`, the
regenerate control, adoption logging (`ai.logAdoption`), and the client
transport guards (30 req/60 s, timeout 30 s, retry ×2, concurrency 3, 5-min
cache). **F-A8 sync fan-out remains code-verified, not walked** — it has no UI
of its own, so it gets a service-contract test rather than a walk.

### What this walk did NOT assess

Visual and IA. Behaviour, state and data only.

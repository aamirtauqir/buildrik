# Figma-truth pass — make the board say what the product does

**The direction is reversed from every earlier wave in this repo.** Earlier waves
built CODE to match the BOARD. This one is the opposite and the founder was
explicit:

> FIGMA = EDITABLE DESIGN SOURCE. CODEBASE = READ-ONLY FUNCTIONALITY REFERENCE.
> You MUST NOT modify, refactor, generate, delete or rewrite production code.

So: **the code is the evidence, the board is the thing that gets fixed.** If the
code does something the board does not draw, the board is wrong. If the board
draws something the code cannot do, the board is lying and must say so.

## You are read-only. Both trees.

- **No source edits.** Not a comment, not a test, not a rename.
- **No Figma writes.** You propose; the coordinator is the only writer
  (`PROTOCOL.md` — parallel Figma writers raced this file on 2026-09-02 and were
  rejected; a wrong write is invisible until rendered).
- **Never stage or edit `AquibraStudio.tsx`.**
- Do not run the app.

## What you produce

`docs/design-jobs/findings/FIG-<YOUR-LETTER>.jsonl` — one JSON object per line,
each an **executable proposal**: a Figma edit specific enough that the
coordinator can write the script without re-deciding anything.

```json
{"id":"FIG-A-01","module":"content-cms","action":"mark-unimplemented|fix-board|create-board|wire-edge|add-state|none",
 "target":"1776:8376 / 641:2546  (section / board node id — REQUIRED, from your manifest)",
 "claim":"one sentence: what the board says today",
 "truth":"what the product actually does",
 "evidence":"file.ts:line + the value you read there. A claim with no line number is a guess and will be dropped.",
 "edit":"the exact change: node id, property, old value -> new value; or for create-board, the board's name, size, section and what it draws",
 "severity":"Critical|Major|Minor",
 "confidence":"measured|read|inferred"}
```

`action` meanings — pick one:

| action | when |
|---|---|
| `mark-unimplemented` | the board draws a capability the code does not have. **Do not delete the design.** Rename the board to lead with `NOT IMPLEMENTED — <one clause of why>` and say which caption gets the note. Deleting a design because it was never built destroys the design; that call was made and recorded (`SH-CO-01`). |
| `fix-board` | the board and the code disagree about something the code has clearly settled — a state name, a control that no longer exists, a count, a copy string that the component rejects by name. |
| `add-state` | the code produces a state (loading, empty, error, success, permission-denied, offline, over-limit) that no board in your section draws. Say which board it clones from and what changes. |
| `create-board` | a whole screen or flow the code has and the file does not. |
| `wire-edge` | the product navigates A→B and the prototype does not, or navigates somewhere the product cannot go. |
| `none` | you checked and the board is right. File these too, briefly — coverage that is not recorded gets re-audited. |

## The bar for "the code cannot do this"

The repo has been burned by all three of these. Do not repeat them:

1. **Optional chaining hides emits.** `composer?.emit?.(EVENTS.X)` does not match
   a `.emit(` grep. **Search for the CONSTANT, not the call site.**
2. **Indirect emits hide too** — `emitZoom(EVENTS.ZOOM_SELECTION)` through a
   curried helper matches no regex on the event name at the call.
3. **A tool list is a fact about the request, not about the world.** The same
   applies to a grep: a null result is your instrument until proven otherwise.

Before you write `mark-unimplemented`, you must have looked for the producer AND
the consumer, by constant, and said in `evidence` what you searched.

## Facts already measured — do not rediscover them

`findings/EVENT-GRAPH.json` is the composer event bus mapped across 891 files:
304 events declared, 222 named anywhere, **82 declared but never named**, **125
emitted with no listener**, 6 fully isolated modules (collaboration, drag, fonts,
forms, interactions, templates).

`findings/MOD-*.jsonl` — 210 module-relationship findings with `file:line`
evidence, already checked. **If your module has rows there, start from them**;
your job is to turn each into a Figma action, not to re-derive it.

`findings/W-*.jsonl` (538 screen findings) and `findings/SHELL-*.jsonl` (115)
cover screens and the shell. Cite them rather than re-filing.

## Reading Figma — sparingly, and one call at a time

The MCP is shared and rate-limited. Your manifest
(`scratchpad_audit/mod/sections/*.txt`) already lists every board id, size and
name in your section; **the names in this file are unusually descriptive and are
often enough.** Read a board's interior only when the action depends on it.

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call",{name:"use_figma",arguments:{
  fileKey:"g4GzQFqzNYz5sosz1QtZXC", code:"...", description:"...", skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text);
```

Three traps that cost real time today:

- The response is truncated at **20000 characters**. Page your reads.
- A `\n` inside a template literal becomes a real newline — a regex literal
  built that way throws `unexpected line terminator in regexp`. Use
  `String.fromCharCode(10)`.
- `rpc` returns the whole JSON-RPC envelope: the text is at
  `r.result.content[0].text`, not `r.content`.

## Answer these when you report back

1. The **module interaction chain** for your module, in the founder's format —
   `MODULE → ENTITY → FIELD → ACTION → TRIGGER → CONNECTED MODULE → RESULT` —
   one line per real chain, and one line per chain that **breaks** (the trigger
   fires and nothing listens; name what the user loses).
2. Your counts by action.
3. **What you could NOT verify.** Six of eighteen boards walked is six. Counting
   the rest as covered is how this repo wrote "Settings has no Figma family"
   about a family that existed.

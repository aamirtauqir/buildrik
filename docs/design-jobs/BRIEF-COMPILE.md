# Compile pass — turn a proposal into something a script can apply

The audit lanes are done: **474 rows across 15 `findings/FIG-*.jsonl` files**.
The coordinator has already executed every `mark-unimplemented` row (60 board
renames, read back from the file). What is left is the bulk: **208 `fix-board`,
76 `add-state`, 18 `create-board`, 10 `wire-edge`.**

Your job is **compilation, not judgement**. Each `fix-board` row says in prose
what the board should say instead. Turn that into rows a verified applier can
execute, and hand back everything that cannot be compiled that way.

## You are read-only. Both trees.

- **No source edits.** **No Figma writes.** The coordinator is the only writer
  (`PROTOCOL.md` — parallel writers raced this file on 2026-09-02 and were
  rejected).
- Never stage or edit `AquibraStudio.tsx`. Do not run the app.

## The two appliers you are compiling for

Both read every change back from the file before reporting, so your output must
be exact — a wrong node id is caught, a wrong STRING is not.

**`scripts/figma/apply-text-fixes.mjs`** — rewrites the `characters` of a TEXT
node.

```json
{"id":"172:3","text":"the exact new string","expect":"a prefix of the CURRENT string","why":"FIG-G-01"}
```

`expect` is a guard, not decoration: a row whose node no longer starts with
`expect` is REFUSED rather than applied. Always supply it, taken from the text
you actually read. Never guess it.

**`scripts/figma/apply-truth-marks.mjs`** — renames a node.

```json
{"id":"306:2111","name":"the exact new full name","why":"FIG-F-17"}
```

## Output — three files, yours alone

1. `scratchpad_audit/mod/plan-text-<YOUR-LETTER>.json` — TEXT rewrites.
2. `scratchpad_audit/mod/plan-marks-<YOUR-LETTER>.json` — renames.
3. `docs/design-jobs/findings/COMPILE-<YOUR-LETTER>.md` — everything that does
   NOT compile to those two shapes, one row per finding id, saying what it needs
   instead: a new node, a geometry change, a fill/opacity change, a prototype
   edge, a whole new board. Group them so the coordinator can batch them.

Do not append to a shared file. An earlier wave did and one whole-file write
destroyed 86 of 111 rows.

## How to be right about the strings

1. **Read the node before you write its replacement.** The `edit` field in a
   finding was written by an agent that may not have read the final text — some
   rows quote a string that has since changed, and the coordinator has already
   rewritten 15 of them this session.
2. **Resolve the real TEXT node.** Findings often name the BOARD (`163:269`)
   when the string lives in a child (`163:317`). Walk the board and find the
   node whose `characters` match the quoted "old" text.
3. **Instance-internal ids are fine** — `I641:2611;16:17` is a real, writable
   text node and three were rewritten this way already.
4. Keep replacement copy **as short as the original allows**. Captions are
   top-level boards in their section; a caption that grows tall pushes its
   neighbours and forces a re-layout. Say the true thing in the fewest words.

## Reading Figma — the traps, all paid for this session

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call",{name:"use_figma",arguments:{
  fileKey:"g4GzQFqzNYz5sosz1QtZXC", code:"...", description:"...", skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text);
```

- The text is at `r.result.content[0].text` — `rpc` returns the whole envelope.
- Responses are **truncated at 20000 characters**. Page your reads.
- A `\n` inside a JS template literal becomes a real newline; a regex built that
  way throws `unexpected line terminator in regexp`. Use `String.fromCharCode(10)`.
- **Walk explicitly.** `page.findAllWithCriteria({types:["TEXT"]})` does not
  descend into INSTANCE children in this runtime (it returned 4 text nodes for a
  board where a walk returns 14). Node-scoped calls appear to be fine, but the
  walk always is:

```js
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const st=[root]; while(st.length){ const n=st.pop();
  if(n.type==="TEXT") /* n.id, n.characters */;
  if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); }
```

- Most boards are on page `1:3`; the client-review family is canonical on `1:6`.
  Set the page before resolving an id, and say which page each row belongs to.

## What NOT to compile

- Rows already executed. Skip every `mark-unimplemented` row — all 60 are done.
- Rows whose `action` is `none`. They are recorded coverage, not work.
- Any row where the finding's own evidence looks stale against what you read.
  **Put it in your COMPILE file as a question, do not silently drop it** — a
  dropped row is indistinguishable from a row nobody found.

## Report back

Counts compiled vs deferred, the three rows you are least sure about and why,
and any finding whose premise you found to be wrong when you read the node.

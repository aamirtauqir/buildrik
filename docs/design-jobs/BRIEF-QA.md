# QA pass — review somebody else's work, in the file, by eye

The founder's rule for this arc: **every module is independently reviewed by
another agent after completion.** You did not audit the module you are
reviewing, and that is the point.

## What was done to the file

A Figma-truth pass ran 15 read-only audit lanes (**474 findings**, every row with
a `file:line`), four compiler lanes, and the coordinator executed the result.
Applied so far:

- **63 board renames** carrying a status marker, normalised to three spellings:
  `[not-implemented]` (no producer, could be built), `[unreachable]` (cannot
  happen by construction), `RETIRED` (superseded by another board).
- **118 string rewrites** — copy that stated a mechanism the code does not have.
- **10 new boards**: `Content · dynamic-pages` ×4, `Preview · what the sandbox
  drops (reference)`, `Inspector · INTERACTIONS · list / add-trigger / edit`,
  `Pages · structure`, `Media · local-only assets`.
- **11 new prototype edges** and a new `⚂ Structure` view link.

Every write was read back from the file. That proves the write landed. **It does
not prove the change is right**, and it proves nothing about how the board
renders — which is your job.

## The bar

1. **Look at the board.** `get_screenshot` on the node, then actually look. This
   arc has already shipped three defects that every tool result called a success:
   a doc board whose paragraphs overlapped every heading, a route tree stacked at
   the bottom of its panel by an auto-layout, and a view link drawn on top of the
   link next to it.
2. **Check the claim against the code, not against the finding.** A finding is a
   claim by an earlier agent. Two were already wrong in ways that mattered: a
   board was marked "no producer" that had grown one the next day, and a
   sitemap claim was refuted after the assertion was already on a board.
3. **Say what you did NOT check.** Six of eighteen boards walked is six.

## Your two questions

**A. Is each change right?** For every change in your scope: does the board now
say what the code does? Is the marker the right one of the three? Does the
evidence clause name a real `file:line`? Does it still render correctly?

**B. Does the workflow hold end to end?** Walk the founder's own chain in the
file and in the code, hop by hop, and say where it breaks:

```
Create Collection → Define Fields → Add Content → Create Dynamic Page
→ Bind Data → Edit Components → Preview → SEO → Publish
```

The Module Interaction Map board (`2357:11981`, section `862:6859`) already draws
this chain with a verdict per hop. **Check it.** It is the most load-bearing
board this arc produced and it was written from a mix of re-run greps and
inherited audit rows — each hop carries a `verified` or `audited` mark saying
which. Anything marked `audited` has NOT been re-run by the coordinator.

## Read-only. Both trees.

No source edits, no Figma writes. Report; the coordinator executes.
Do not run the app. Never stage or edit `AquibraStudio.tsx`.

## Figma, and its four traps

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call",{name:"use_figma",arguments:{
  fileKey:"g4GzQFqzNYz5sosz1QtZXC", code:"...", description:"...", skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text);
```

- Text is at `r.result.content[0].text`; `rpc` returns the whole envelope.
- Responses truncate at **20000 characters**. Page your reads.
- A `\n` in a template literal becomes a real newline and breaks a regex literal.
  Use `String.fromCharCode(10)`.
- **Walk explicitly** — `page.findAllWithCriteria({types:["TEXT"]})` does not
  descend into INSTANCE children here, and most boards are built from instances.

For a screenshot: `get_screenshot` with `{fileKey, nodeId}` returns a JSON body
with an `image_url`; `curl -L` it and look at the PNG.

## Output

`docs/design-jobs/findings/QA-<YOUR-LETTER>.jsonl`, one object per line:

```json
{"id":"QA-A-01","target":"2429:12111","verdict":"confirmed|wrong|regressed|unchecked",
 "what":"the change under review","finding":"one sentence",
 "evidence":"what you read or measured — file:line, node id, or what the screenshot showed",
 "fix":"only if verdict is wrong or regressed","severity":"Critical|Major|Minor"}
```

Then reply with: counts by verdict, every `wrong` or `regressed` in full, your
hop-by-hop verdict on the workflow chain, and an explicit list of what you could
not check.

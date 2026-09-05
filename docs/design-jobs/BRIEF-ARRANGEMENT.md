# Arrangement review — can a designer read this file?

Page `1:3` of `g4GzQFqzNYz5sosz1QtZXC` has just been re-laid-out: every section
gridded and shrink-wrapped, then all 29 stacked at x=0 in product-flow order with
900px gaps. It is mechanically clean — 0 loose nodes, 0 section overlaps, 0 board
overlaps, 0 out-of-bounds.

**Mechanically clean is not readable.** Your job is the second thing: open your
sections and say whether a designer landing on them can follow the product.

## What to judge

1. **Row order.** Within a section, do boards read in an order that means
   something — root/default first, then its states, then its modals — or is it
   alphabetical noise? Name the boards that are in the wrong place and say where
   they should go.
2. **Families split.** A family (one screen and its states: `default`,
   `loading`, `empty`, `error`) should sit together, ideally on one row. Report
   families broken across rows or separated by unrelated boards.
3. **Captions.** `caption/X` frames should sit directly under or beside the board
   they describe. Report orphans and mismatches.
4. **Retired boards mixed with live ones.** Anything named `RETIRED`,
   `SUPERSEDED`, `CUT`, `UNBUILDABLE`, `not-implemented`, `design-ahead` should
   not be interleaved with the boards a designer is meant to build from. Say
   whether your sections segregate them and where they should sit.
5. **Section shape.** Is the section a sensible block, or one enormous row / one
   long column? Give the row count and the widest row.

## How to look

**Screenshot the SECTION, not the boards.** That is the whole point — you are
judging arrangement, not content.

```bash
node scripts/baseline/figma-shot.mjs <outDir> <sectionId>
```

Then `Read` the PNG. A section is large, so also fetch the ordered child list:

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC",
  code: `const pg=figma.root.children.find(p=>p.id==="1:3");
         await figma.setCurrentPageAsync(pg);
         const s=await figma.getNodeByIdAsync("<sectionId>");
         return [...s.children].sort((a,b)=>(a.y-b.y)||(a.x-b.x))
           .map(c=>Math.round(c.y)+"\t"+Math.round(c.x)+"\t"+Math.round(c.width)+"x"+Math.round(c.height)+"\t"+c.name).join("\n");`,
  description: "ordered children", skillNames: "figma-use" }}, 1);
console.log(r?.result?.content?.[0]?.text);
```

Group children by their `y` to see the rows.

## Rules

- **READ-ONLY.** No Figma writes. The coordinator executes every move, so each
  one lands against a stated reason.
- **Figma is rate-limited and shared** across every agent in this session. Batch
  your reads — one query per section, not per board — and retry with backoff.
  Mark anything you could not fetch as "not checked".
- **Read names before judging.** A board named `RETIRED`/`TERMINAL by design`
  carries its own explanation; a layer named `Drawer (transient)` is a declared
  mode. Sample data ("Bella Cucina") is never a finding.
- Do not re-audit workflow, dead controls or missing screens — that pass is done
  and its findings are in `findings/`. **Arrangement only.**

## Output

Append to `docs/design-jobs/findings/ARRANGE.jsonl`, one object per line:

```json
{"id":"ARR-A-01","section":"1776:8372","sectionName":"05 · Media","kind":"row-order|family-split|caption|retired-mixed|section-shape",
 "severity":"Major|Minor","finding":"one sentence","evidence":"board ids + their y/x",
 "fix":"the concrete move: which board id, to which position/row"}
```

Then reply with: your sections' row counts, the three worst arrangement problems,
and any section you would restructure wholesale (and why).

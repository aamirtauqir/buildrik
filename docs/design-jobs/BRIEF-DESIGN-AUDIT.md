# Design audit brief — every screen must earn its place

You are auditing the Buildrik editor's Figma file as a **senior product
designer**, not a checklist runner. File `g4GzQFqzNYz5sosz1QtZXC`, page `1:3`.

## The order is not negotiable

For **every screen** in your modules, answer Q1 before anything else. A screen
that fails Q1 does not need a spacing critique — it needs deleting or merging.

**Q1 — Does this screen deserve to exist?**
- What job does the user come here to do? Name it in the user's words.
- Does the product's *mental model* contain this object? The nouns a Buildrik
  user thinks in are: **site → pages → elements → styles/brand → publish**,
  plus **review/sign-off** for the agency workflow. A screen whose subject is
  not one of those, or is an internal implementation concept, is suspect.
- If the screen is a state (loading/empty/error), is it a state a real user
  reaches? Or a state invented for completeness?
- **Verdict: KEEP / MERGE-INTO(<node id>) / CUT / UNSURE(why)** — with a reason
  a designer would accept, not "it looks fine".

**Q2 — Does the user know what they came here to do, on arrival?**
Title, purpose copy, primary action. If arriving cold gives no orientation,
that is a finding.

**Q3 — Flow.** What leads in, what leads out. Read `node.reactions` on the
frame **and every descendant** (hotspots live on children). No way back, no
onward step, or an entry that exists only in Figma and not in the product = a
finding.

**Q4 — UI/UX craft.** Only after Q1-Q3. Hierarchy, density, control sizes,
copy, contrast, empty/error/loading coverage, consistency with sibling screens.

**Q5 — Missing jobs.** For each module, name jobs a user plausibly needs that
have **no screen at all**. This is explicitly wanted. Ground it: cite the code
or the product surface where the job exists but the design does not.

## Rules

- **You are READ-ONLY.** Do not rename, move, delete or create any Figma node.
  Do not edit source. Report only. A later pass makes changes.
- **Never delete a Figma node** is a standing project rule, and it applies to
  whoever acts on your report too — recommend renames, never deletions.
- **Cite everything.** Every claim carries a node id and a fetched value. A
  finding without a node id is a guess and will be thrown out.
- **Don't assume.** If you did not fetch it, you do not know it. Say
  "not checked" rather than inferring.
- Sample data in boards ("Bella Cucina", "In review · 3 open") is never a
  finding. The SHAPE is the contract.
- A board already named `RETIRED` / `SUPERSEDED` / `UNBUILDABLE` /
  `TERMINAL by design` / `ENTRY POINT` carries its own explanation — do not
  re-file it as a defect. Read the name first.

## How to reach Figma

Figma MCP tools are usually absent from the session. Use the committed client:

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC",
  code: `/* plugin API, top-level await, return a STRING */`,
  description: "what this reads",
  skillNames: "figma-use"     // all four args required or it errors
}}, 1);
console.log(r?.result?.content?.[0]?.text);
```

Traps that have cost this project real time:

- **`node.findAll` THROWS on a TEXT node** — on property access, so `typeof`
  does not save you. Guard by type:
  `const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"])`.
- **Reactions hang off hotspot CHILD nodes**, not just the frame. Carriers are
  `[frame, ...descendants]`. Reading frame-level only once produced a "77%
  orphans" report when the truth was 5%.
- **The transport truncates around 20KB.** Page your reads; return compact TSV,
  never a JSON dump. A truncated return breaks `JSON.parse` silently.
- `figma.currentPage` resets between calls — `await figma.setCurrentPageAsync(page)`
  once per script.
- **Screenshots: use the committed downloader, not `exportAsync`.**

  ```bash
  node scripts/baseline/figma-shot.mjs <outDir> 166:2 1177:4804 ...
  ```

  It calls `get_screenshot`, which returns a hosted `image_url`, and downloads
  real PNGs, verifying each is a complete PNG (header + `IEND`). Then `Read` the
  file — images render. **Do not use `exportAsync` + `base64Encode`**: the
  ~20KB transport truncates the base64 and you get a valid PNG header over
  incomplete pixels. That cost one audit wave every screenshot it tried (0 of
  48) and left its craft findings resting on geometry alone.

  A metadata read is not a substitute for looking at the board.

## Output

Write **one file**: `docs/design-jobs/findings/<your-letter>.jsonl`, one JSON
object per line, no wrapper array:

```json
{"id":"D-A-01","module":"Media","node":"1776:8372","screen":"Media · upload · empty",
 "q":"Q1","verdict":"MERGE-INTO(1776:8390)","severity":"Major",
 "finding":"one sentence","evidence":"fetched value / node ids","recommend":"one sentence"}
```

- `q`: which question it came from (Q1…Q5).
- `severity`: Critical (blocks the job) / Major (IA, hierarchy, missing state) /
  Minor (spacing, copy, consistency) / Polish.
- For Q5 rows use `"node":"—"` and put the product evidence in `evidence`.

Also append a short `## <Module> — coverage` section to
`docs/design-jobs/DESIGN-AUDIT.md` saying: screens in module, screens you
actually fetched, screens you screenshotted, and **which screens you did not
check**. Six of eighteen walked is six. Do not round up.

Then reply to me with: counts by severity, your three most important findings,
and anything you could not verify.

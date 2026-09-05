# Adversarial verification — try to break the finding

You are verifying findings from the workflow audit. **Your job is to REFUTE
them.** A finding that survives you is worth acting on; one that does not has
saved the founder a wasted change. In the previous arc 16 of 261 findings were
refuted, including two of the coordinator's own — the refutations were the most
valuable output of that pass.

You are NOT re-auditing. Do not add new findings. Take the ones you are given
and attack each.

## The seven ways a finding in this file is usually wrong

Check every one of these before you confirm anything:

1. **The board name already explains it.** `RETIRED` / `SUPERSEDED` /
   `UNBUILDABLE` / `TERMINAL by design` / `ENTRY POINT` / `not-implemented` /
   `design-ahead` / `NOT A STATE` carry their own reason. A defect filed against
   one of these is refuted on its name.
2. **A LAYER name declares a mode.** `Drawer (transient)` is a third drawer
   mode, not an inconsistency. A structural difference with a name on it is
   intent. This one caught the coordinator mid-fix.
3. **Sample data is not shape.** "Bella Cucina", "3 open", "2m ago" are never
   findings.
4. **The hotspot convention.** `hotspot/state · X` rows parked off-board or at
   the panel foot are this file's way of saying "click here to see state X".
   They are scaffolding, not flow edges — and not defects for being unstyled.
5. **Reactions hang off descendant nodes.** A claim of "no edge" that was
   measured frame-level only is worthless. Carriers are `[frame, ...descendants]`.
   Re-measure before believing an in-degree of 0.
6. **The detector was the bug.** Three separate census blind spots were found in
   one day (name-matching, ancestor-wiring, and the fix for ancestor-wiring). If
   a finding rests on a tool's output, re-derive its core claim by hand.
7. **A cited `file:line` may not say what the finding says it says.** Open it.
   Roughly one claim in eight misreads its own citation.

## Verdicts

For each finding, return exactly one:

- **CONFIRMED** — you tried the seven and it survived. State the single strongest
  piece of evidence.
- **REFUTED** — with the specific reason and the evidence that kills it.
- **PARTIAL** — the defect is real but the finding overstates it. Give the
  corrected, narrower claim.
- **UNSUPPORTED** — you could not verify either way. Say what you would need.

Rank the confirmed ones: which single finding, if fixed, unblocks the most?

## Rules

- **READ-ONLY.** No Figma writes, no source edits. The coordinator executes.
- **Cite everything** — node id + fetched value, or `file:line` you actually
  opened.
- **Figma is rate-limited and shared** across every agent in this session.
  Batch your reads, prefer one big query over many small ones, and retry with
  backoff. Mark anything you could not fetch as "not checked" rather than
  inferring — an honest gap beats a confident guess.
- Do not run the app.

## Reaching Figma

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC",
  code: `/* plugin API, top-level await, return a STRING */`,
  description: "what this reads", skillNames: "figma-use"
}}, 1);
```

`node.findAll` THROWS on TEXT — guard by type. Transport truncates ~20KB — return
compact TSV. `await figma.setCurrentPageAsync(pg)` once per script. Screenshots:
`node scripts/baseline/figma-shot.mjs <outDir> <ids…>` then `Read` the PNG.

## Output

Append to `docs/design-jobs/findings/VERDICTS-W.jsonl`, one object per line:

```json
{"id":"W-D-01","verdict":"CONFIRMED","why":"one sentence","evidence":"node id / fetched value / file:line","corrected":"only for PARTIAL"}
```

Then reply with: counts by verdict, every REFUTED and PARTIAL in full (these
matter most), your ranking of the confirmed, and what you could not check.

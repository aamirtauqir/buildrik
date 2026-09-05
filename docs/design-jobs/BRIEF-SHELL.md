# Shell deep audit — every gap and issue in the editor shell

File `g4GzQFqzNYz5sosz1QtZXC`, page **`1:3`**, section **`1776:8385` — 01 · Shell**.

The shell is the frame every other module sits inside: topbar, rail, drawer,
canvas, inspector, footer, and the lifecycle around them (open, save, offline,
review, exit). A defect here is on every screen at once, so this pass goes
deeper than the module walk did.

## Facts already established — do not spend Figma calls rediscovering these

**Section `1776:8385` holds 33 children:** 15 numbered `Shell state N` boards
(1-15, all present), 4 non-state boards, and 14 captions.

| board | state | middle-band regions |
|---|---|---|
| `65:2` | 1 · First run — ENTRY POINT | Rail 60 · Canvas 1080 · Inspector 300 |
| `199:2` | 2 · Returning (default) | Rail 60 · Canvas 1080 · Inspector 300 · **Drawer 280 (transient)** |
| `199:205` | 3 · Element selected | Rail 60 · **Drawer 280 (pinned)** · Canvas 800 · Inspector 300 |
| `66:4` | 4 · Multi-select | pinned |
| `199:409` | 5 · Drawer closed | no drawer |
| `200:2` | 6 · Comment mode | pinned |
| `65:211` | 7 · Preview | **Canvas 1440 only** |
| `200:213` | 8 · Review active | pinned |
| `66:225` | 9 · AI agent run | pinned |
| `66:441` | 10 · Offline | pinned |
| `66:640` | 11 · Saving → conflict | pinned |
| `65:412` | 12 · Loading | no drawer |
| `642:3696` | 13 · Presence | **[design-ahead]** |
| `2162:11660` | 14 · Saving | transient |
| `2162:11838` | 15 · Save failed | transient |

Non-state boards: `1172:4804` Exit guard (1308x117), `927:4474` Exit · Workspace
(520x216), `1175:4804` Upgrade modal 403 (420x225), `963:4474` 360 overlay slot
proof, `202:2` 1280 pin auto-released — **RETIRED**.

**Shell chrome component sets** (page `1:2` unless noted):
- `681:122` **Topbar**, 6 variants = `Publish: ready|disabled|anyway` x
  `Review: open|none`, plus INSTANCE_SWAP props `Save#698:0` (default `697:444`)
  and `Presence#695:0` (default `692:421`). All 1440x56.
- `697:461` **Save status**, 6 variants: `saved · saving · unsaved · conflict ·
  offline · error`.
- `2034:8519` **Rail** (page `1:3`, section 28), 7 variants:
  `Active = None|Insert|Layers|Pages|Media|Content|Brand`.

**Code entry points:** `src/editor/shell/` — `AquibraStudio.tsx`,
`StudioHeader.tsx`, `LayoutShell.tsx`, `StudioPanels.tsx`, `regionCycle.ts`
(F6/⇧F6 cycles 7 regions), `chrome-ui/SaveStatus.tsx`.

**Never stage `AquibraStudio.tsx`** from an agent session — it is mid-edit in the
founder's tree. Read it freely; do not write it.

## What to look for

Weight these in order:

1. **A state the code can produce with no board**, or a board depicting a state
   the code cannot reach. Cite the code path that produces it.
2. **A control on the shell chrome that does nothing**, in the board or in the
   code. The topbar/rail/footer appear on every screen, so one dead control here
   is dead everywhere.
3. **Board and code disagreeing** — copy, control set, region widths, which
   states are reachable from which.
4. **Variant coverage** — a component variant the boards never use, or a state
   the boards draw that has no variant.
5. **Anything a real user would hit that neither side covers.**

## Rules

- **READ-ONLY.** No Figma writes, no source edits. The coordinator executes.
- **Cite everything** — node id + fetched value, or `file.tsx:line` you opened.
- **Read names first.** `RETIRED` / `[design-ahead]` / `TERMINAL by design` carry
  their own explanation. A layer named `Drawer (transient)` is a declared mode,
  not an inconsistency — the shell has three declared drawer modes and that is
  intent.
- Sample data ("Bella Cucina", "3 open", "Saved 2m ago") is never a finding; the
  SHAPE is the contract.
- **Figma is rate-limited and shared** by every agent in this session. Batch
  reads, prefer one query over many, retry with backoff, and mark anything you
  could not fetch as "not checked".
- Do not run the app.

## Reaching Figma

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC",
  code: `/* plugin API, top-level await, return a STRING */`,
  description: "what this reads", skillNames: "figma-use" }}, 1);
console.log(r?.result?.content?.[0]?.text);
```

`node.findAll` THROWS on TEXT — guard by type. Transport truncates ~20KB — return
compact TSV. `await figma.setCurrentPageAsync(pg)` once per script. Reactions hang
off descendant nodes, not just the frame. Screenshots:
`node scripts/baseline/figma-shot.mjs <outDir> <ids…>` then `Read` the PNG.

## Output

Append to `docs/design-jobs/findings/SHELL.jsonl`, one object per line:

```json
{"id":"SH-A-01","area":"topbar|rail|drawer|canvas|inspector|footer|lifecycle|regions",
 "node":"65:2","kind":"missing-state|dead-control|board-code-mismatch|variant-gap|uncovered",
 "severity":"Critical|Major|Minor","finding":"one sentence",
 "evidence":"node id + fetched value, or file.tsx:line","fix":"concrete","buildFrom":"<node id or —>"}
```

Then reply with counts by severity, your three most important findings, and
anything you could not verify.

# Workflow audit brief — can the user finish the job?

You are a **senior product designer** auditing one module of the Buildrik
editor's Figma file (`g4GzQFqzNYz5sosz1QtZXC`, page **`1:3`**) for **workflow
completeness**. Not craft. Not spacing. **Can a real user start a job in your
module and finish it, without hitting a control that does nothing or a form
that cannot be filled in?**

Your assignment names your section id and its boards. Everything is on page
`1:3` unless your assignment says otherwise.

## The four questions, in this order

### Q1 — Trace the job end to end
Name the job in the user's words ("replace the photo on my menu page"). Then
walk it board by board: entry → each step → done. Write the chain of node ids.
**A step you cannot reach from the previous one is the finding**, and it
outranks everything else in this brief.

The nouns a Buildrik user thinks in: **site → pages → elements → styles/brand →
publish**, plus **review/sign-off** for the agency workflow. A screen whose
subject is not one of those, or is an internal implementation concept, is
suspect — say so.

### Q2 — Dead controls
Your assignment includes a **pre-computed census of button-like nodes with no
prototype reaction on themselves or any ancestor**. It is a candidate list, not
a verdict. For each one decide:
- **DEAD** — a user would click it expecting something and get nothing, and the
  destination it needs exists or should exist. Say what it should do.
- **FINE** — it is a spec sheet, a disabled state, or the board is a terminal
  state by design. Say which.

Then look for dead controls the census **missed**: anything that reads as
clickable — a row with a chevron `›`, a tab, a link, an icon button, a "⋯"
menu, a dropdown — with nothing behind it. The census only matched names.

### Q3 — Missing fields
Compare each form/panel on your boards against **what the code actually
collects**. Grep `packages/editor/src` for the panel's component and read its
inputs, its Zod schema, its service call. Report:
- a field the code requires that **no board draws** (the user cannot supply it),
- a field a board draws that the code has **no home for** (it will be lost),
- a field with **no validation, error or empty state** drawn anywhere.

Cite `file.tsx:line` for every claim. A field claim without a code line is a
guess and will be thrown out.

### Q4 — Missing screens
Name the states and steps a real user reaches that **have no board at all**.
Ground each in evidence: the code path that produces it, or the step the flow in
Q1 cannot complete without. For each, say **which existing board it should be
built from** — a missing screen with a named parent is buildable; one without is
a wish.

Rank them: which single missing screen most blocks the job?

## Rules

- **You are READ-ONLY.** Do not create, rename, move or delete any Figma node,
  and do not edit source. The coordinator executes every change, so that each
  one lands against a verified finding.
- **Cite everything** — node id and fetched value, or `file.tsx:line`.
- **Do not assume.** If you did not fetch it, write "not checked".
- **Read the board name first.** `RETIRED` / `SUPERSEDED` / `TERMINAL by design`
  / `ENTRY POINT` / `not-implemented` / `design-ahead` carry their own
  explanation — do not re-file them as defects.
- **Read the LAYER name too.** A layer named `Drawer (transient)` is a declared
  mode, not an outlier. A structural difference with a name on it is intent.
- Sample data ("Bella Cucina", "In review · 3 open") is never a finding. The
  SHAPE is the contract.
- **Screenshot before judging.** A metadata read is not a look at the board.

## Reaching Figma

```js
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC",
  code: `/* plugin API, top-level await, return a STRING */`,
  description: "what this reads",
  skillNames: "figma-use"     // all four args required
}}, 1);
console.log(r?.result?.content?.[0]?.text);
```

Traps that have cost this project real time:

- **`node.findAll` THROWS on a TEXT node** — guard by type with
  `new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"])`.
- **Reactions hang off hotspot CHILD nodes**, not just the frame. Carriers are
  `[frame, ...descendants]`. Frame-level-only once produced a "77% orphans"
  report when the truth was 5%.
- **The transport truncates around 20KB.** Page your reads, return compact TSV.
- `figma.currentPage` resets between calls — `await figma.setCurrentPageAsync(pg)`
  once per script.
- **Screenshots:** `node scripts/baseline/figma-shot.mjs <outDir> 166:2 170:2 …`
  then `Read` the PNG. Do **not** use `exportAsync` + `base64Encode` — the
  transport truncates it and you get a valid header over incomplete pixels. One
  audit wave got 0 of 48 that way.

## Output

Write **one file**: `docs/design-jobs/findings/W-<letter>.jsonl`, one JSON
object per line, no wrapper array:

```json
{"id":"W-A-01","module":"Media","node":"1162:4617","screen":"Media · fullpage · empty",
 "q":"Q2","kind":"dead-control","severity":"Critical",
 "finding":"one sentence","evidence":"node id / fetched value / file.tsx:line",
 "fix":"what to change, concretely","buildFrom":"<node id or —>"}
```

- `q`: Q1…Q4. `kind`: `flow-gap` | `dead-control` | `missing-field` |
  `missing-screen`.
- `severity`: **Critical** = the job cannot be completed · **Major** = the job
  completes but a state is unreachable or a field is unsupplied · **Minor** =
  friction · **Polish**.
- `buildFrom`: for `missing-screen`, the board id to duplicate. `—` otherwise.

Then reply with: counts by severity, **the single worst flow gap**, the dead
controls you confirmed vs dismissed (with the split), and anything you could not
verify.

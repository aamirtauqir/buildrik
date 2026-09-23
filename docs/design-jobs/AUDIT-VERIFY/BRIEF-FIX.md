# Brief — author the repair rows for the verified audit defects

You are authoring a PLAN. You are not applying it.

## Hard rules

1. **Zero Figma MCP calls.** Do not run anything under `scripts/figma/` or
   `scripts/baseline/` that talks to Figma — not `apply-queue.mjs`, not
   `normalize-plans.mjs`, not the dump script. The daily 200-call cap is spent.
   Every fact you need is already on disk.
2. **Every geometry number must come from the fresh reads**, not from the audit
   and not from memory. They are in `docs/design-jobs/AUDIT-VERIFY/b*.tsv`; read
   them with `python3 docs/design-jobs/AUDIT-VERIFY/analyze.py texts <id>` /
   `... kids <id>` / `... report <id>`. Show your arithmetic in the row's `why`.
3. **Every row carries `expect`** — the node's CURRENT value, copied from those
   dumps. The applier REFUSES a row whose node no longer holds its `expect`,
   and that guard is the only thing standing between a stale plan and
   overwriting someone's newer copy. A row without `expect` is a row that can
   silently destroy work.
4. **Do not invent product capability.** Where the code cannot do a thing, the
   board must not draw it. `docs/design-jobs/AUDIT-VERIFY/CODE-TRUTH.md` says
   which is which. When in doubt, mark the row `"hold": true` with a one-line
   question instead of guessing.
5. **Auto-layout compensation.** Most panel boards are `layout=VERTICAL`. Growing
   a child frame pushes every later sibling down, and the board clips at 812px.
   If your resize adds height, you MUST either shrink a spacer sibling by the
   same amount in the same plan, or state in `why` why the board has room. Check
   with `analyze.py kids <board>`: the last child's bottom versus the board's.

## The file shape — this exact shape, or your work is silently dropped

`normalize-plans.mjs` looks for a top-level array under one of
`rows | boards | ops | adds | add`. A plan file whose top level is any other
object normalizes to **zero rows while reporting success** — that is how
`media-06-post-clone-unresolved.json` was authored in full, ingested as nothing,
and still reported IMPLEMENTED · VERIFIED. Write:

```json
{ "slug": "fix-<your-area>", "page": "1:3", "rows": [ { … }, { … } ] }
```

Save to `docs/design-jobs/AUDIT-VERIFY/fixplans/<your-slug>.json`.
Then print the row count you wrote. It will be checked.

## Row schema (what the applier executes)

```json
{"op":"text",   "id":"2850:22372", "text":"Delete hero-kitchen.jpg?", "expect":"Delete 34 files?", "width":248, "why":"M01 — …"}
{"op":"rename", "id":"137:2",  "name":"…", "expect":"…"}
{"op":"resize", "id":"171:132", "h":228, "why":"F06 — clip parent ends y67339; children reach 67459 → 108+120"}
{"op":"move",   "id":"2838:12105", "x":…, "y":…, "why":"F03 — out of the product frame"}
{"op":"delete", "id":"…", "why":"F18 — code has no brand→component link"}
{"op":"fill",   "id":"…", "hex":"#111827"}
{"op":"add-text","parent":"…","text":"…","x":…,"y":…,"size":11,"why":"…"}
```
Optional on any row: `"why"` (required in practice — name the finding id and the
arithmetic), `"hold": true` (author it, do not execute it, say why).

## Where the truth is

- `AUDIT-VERIFY/VERDICTS.md` — the 48 findings and what was proven about each
- `AUDIT-VERIFY/verdicts.jsonl` — same, machine-readable, with the measurements
- `AUDIT-VERIFY/PLAN.md` — the eight causes and the repair each one needs
- `AUDIT-VERIFY/CODE-TRUTH.md` — what the product can and cannot do
- `AUDIT-VERIFY/FOUND-WHILE-VERIFYING.md` — defects the audit missed
- `AUDIT-VERIFY/b*.tsv` + `analyze.py` — the fresh geometry, taken after 18:29

## What "done" means for you

A plan file in the right shape, every row carrying `expect`, every geometry row
showing its arithmetic, every row naming its finding id, and an explicit list at
the end of your report of anything you deliberately did NOT author and why.

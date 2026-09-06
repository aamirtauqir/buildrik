# Brief — Phase 1 UX audit, one lane per module

You are auditing the **UX** of one module of the Buildrick editor, to inform a
redesign that will be drawn in Figma later. You are not drawing anything and you
are not fixing anything.

## The two hard rules

1. **READ-ONLY on code.** Do not modify, refactor, create or delete any file
   under `packages/`, `server/`, `lib/` or `prisma/`. Your only output is the
   JSONL file named in your assignment.
2. **A claim needs evidence.** Every row you write carries a `file:line` you
   actually read. "There is no X" is the most dangerous claim in this repo —
   it has been wrong three times this arc, each time because the searcher
   guessed the identifier. Before writing "no UI does X", search for at least
   **three** spellings (camelCase, kebab-case, the event constant, the raw
   string) and say in `evidence` which you tried.

## Where the truth lives

- **Code** (read-only): `packages/editor/src/` — `editor/` is the React chrome,
  `engine/` is the headless core, `shared/` is types and constants.
- **Events**: `packages/editor/src/shared/constants/events.ts` declares 304
  events. Two search traps: optional chaining (`composer?.emit?.(EVENTS.X)`)
  and raw-string listeners both defeat a grep for the constant.
- **Prior findings**: `docs/design-jobs/findings/*.jsonl` — 525 rows from an
  earlier pass. Read the ones for your module. **They are evidence, not
  gospel**: one was already proved stale by uncommitted work. Re-verify any row
  you rely on.
- **Working tree**: the founder has uncommitted changes in the CMS/media area.
  `git status` first. A chain that reads BROKEN at HEAD may be fixed in the tree.

## What to produce

One JSONL file, one row per finding, at the path in your assignment.

```json
{
  "id": "UX-<LANE>-01",
  "module": "<your module>",
  "screen": "<screen/panel/drawer/modal, or '-' if cross-screen>",
  "kind": "missing-screen|missing-state|missing-action|broken-flow|dead-end|duplicate-feature|confusing-nav|missing-feedback|disabled-state|destructive-confirm|sizing|entry-exit|cross-module",
  "purpose": "<what this module is FOR, in one line — repeat it on every row>",
  "task": "<the user task this finding sits in>",
  "finding": "<what is wrong, in plain English, from the USER's side of the screen>",
  "evidence": "<file:line you read, plus which spellings you searched>",
  "fix": "<the UX fix, not the visual one>",
  "severity": "Critical|Major|Minor",
  "confidence": "high|medium|low"
}
```

Also write, as the LAST row, one summary row with `"kind": "module-summary"`
whose `finding` answers: the module's purpose, its primary user tasks, its entry
and exit points, and which modules it hands off to and receives from.

## The dimensions to cover

Purpose · primary tasks · entry and exit points · missing screens · missing
states · broken flows · dead ends · duplicate features · confusing navigation ·
missing feedback · empty/loading/error/success states · disabled and permission
states · destructive/confirmation flows · panel/drawer/modal sizing · keyboard
and context-menu behaviour where the code has any · connections to other modules.

**Do not propose visual polish.** No colour, type, spacing or icon suggestions.
This phase fixes workflow. A row that says "the row should be a card" is out of
scope; a row that says "there is no way back from this screen" is the job.

## What good looks like

Bad: `"The Insert panel is confusing."`

Good: `"Insert has 53 element buttons in one flat ELEMENTS group with a search
field, and no way to see what an element produces before placing it. A user
looking for a pricing table cannot tell whether to use Table, Grid or Card.
evidence: rail snapshot lists 53 buttons under one 'ELEMENTS 53' group;
InsertTab.tsx:<line>. Searched: 'ELEMENTS', 'elementGroups', 'INSERT_GROUPS'."`

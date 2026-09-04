# Common brief — editor Figma board arc (2026-09-04)

## The goal, verbatim intent
Implement every editor Figma board in the codebase. Target 80–90%. **Where the
CODEBASE IS AHEAD of the design, do NOT implement — mark the row and take
another board.** That is the founder's explicit escape hatch, not a failure.

## Where the work is
- Census: `packages/editor/scripts/conformance/boards.json` (nodeId → family/state).
- Queue: `docs/design-jobs/jobs.json`. Your rows are named in your own brief.
- Percentage = (done + verify) ÷ rows whose status is not `unbuildable`/`fix-figma`.

## The build loop, per board
1. Read the board. Figma MCP tools are usually ABSENT from the tool list. Use the
   committed client: `node -e` with `import { connect, rpc } from
   "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs"`.
   `use_figma` needs **`fileKey: "g4GzQFqzNYz5sosz1QtZXC"`, `code`, `description`
   and `skillNames: "figma-use"`** — omit any of them and it returns an input
   validation error, not a result.
2. Build to the board, adapted to `@/editor/chrome-ui` + `tw:` utilities +
   `var(--bk-*)` tokens. Never import `flowbite-react` outside `chrome-ui/`.
3. **Behaviour follows the CODE contract; everything VISUAL follows the BOARD.**
   Board sample data ("Bella Cucina", "3 open") is never copied literally — the
   SHAPE is the contract.
4. Tests protecting the old design get rewritten in the same commit.

## Hard rules, each one learned by breaking it
- **Commit per job**, immediately, path-scoped. `git add <exact files>` — never
  `-A`, never a bare directory. Two sessions share this tree; a sweep commits
  someone else's half-finished file. Check `git diff --stat HEAD~1 HEAD` after.
- **The commit must be BEHIND the check, not after it.** `tsc && vitest && commit`,
  or an explicit `|| exit 1`. A chain that prints failures and commits anyway has
  landed red code on main twice today.
- **NEVER stage `AquibraStudio.tsx`** — founder's tree, mid-edit. Hand the change up.
- Do not edit source while a suite runs; the result describes a tree that never existed.
- A long, silent, slow suite is a STARVED process, not a failure. Re-run alone.
- Run `pnpm run verify:ds` (in `packages/editor`) before every commit. Gate 14
  greps TEXT including comments: no `28px`/`32px`/`320px` literals — use
  `var(--bk-size-row)` etc. Gate 13: panel chrome radius ≤4 (modals/overlays r8/r12).
- `gate:styling-ratchet` locks per-file CSS line counts — they may only go down.

## Traps that will cost you an hour each
- flowbite `h-10` leaks into dense rows. A same-property utility wins via twMerge
  (`tw:h-8` beats `tw:h-10`); a DIFFERENT property (`min-h-*`) does not conflict and
  loses. On a plain element nothing merges — source order decides.
- On flowbite inputs `className` lands on the WRAPPER and `style` on the `<input>`.
- `input[type="text"]` matches NOTHING when the input has no `type` attribute,
  even though `.type` reads `"text"`. Use `getByRole("textbox")`.
- A modal is `position: fixed` in a PORTAL — it is not in the studio subtree.
  To decide whether a click did anything, diff the WHOLE document and count by
  geometry, not by role.
- `composer.off` is chainable: `return () => composer.off(...)` hands React the
  composer where a destructor belongs. Use a block body.
- A cast on a test fixture (`as SomeProps`) turns a compile error into a runtime
  crash. Don't add them; remove them where you touch them.

## Reporting
Finish with: rows CLOSED (id + commit), rows SKIPPED as code-ahead (id + the ONE
sentence of evidence), rows you could not do and why. **A row is a claim.** If you
did not measure it, say so — "not verified" is a finding, "done" is a claim.

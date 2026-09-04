# Verifier brief — editor Figma board arc

You do NOT edit `src/`. You measure what landed and report. Read
`BRIEF-COMMON.md` first for the Figma client and the traps.

## What verification means here
The founder's rule: **done = observed in the running app.** Not a probe render,
not the JSX, not a green unit suite — all three have passed over a broken
feature in this repo.

Dev server: `http://localhost:5050` (standalone editor, no auth). If it is down,
start it with `npm run dev` in `packages/editor` and say so in your report.
Drive with Playwright via `createRequire(".../packages/dashboard/package.json")("@playwright/test")`.

## The rules that make a measurement worth anything
1. **Every probe needs a positive control.** Before believing "X is absent",
   point the same matcher at something you KNOW is present. A matcher with no
   positive control is not evidence. Seven wrong absence-findings in one day
   came from this.
2. **Diff the whole document, count by geometry.** List every visible node over
   ~150×40 carrying a role or label, take a set difference across the action.
   Role-based checks missed a portal modal and a `role="region"` checklist.
3. **A null result is your harness until proven otherwise.** An already-open
   tab, a tooltip eating the click, a `data-element-id` that does not exist.
4. **State what was NOT verified.** Six of eighteen boards walked is six.
5. A disabled control is not a missing door. WCAG does not govern disabled
   controls, and "closed by state" is a different finding from "no door".

## Output
Per row: VERIFIED (what you observed, at 1440×900), or DRIFT (board says X,
live measures Y, with the numbers), or NOT MEASURED (why). Never "looks right".
Measure with `getComputedStyle`/`getBoundingClientRect` — at 2× a screenshot an
8px error is invisible.

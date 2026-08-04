# Mission established: one component system, founder wants it forcefully

Founder's ask: convert the whole editor to flowbite, delete old CSS and
"vibcoder components", keep only Tailwind for layout/shells, use the global
design system. Explicitly accepts visual breakage; explicitly requires business
logic to survive.

Three premises in that ask are already falsified by his own repo, and correcting
them is the teaching arc:

1. **Vibcoder is already gone.** `editor/shared/vibcoder`, `shared/ui`,
   `shared/extensions`, `editor/ui`, `src/preview` were all deleted 2026-07-28
   and 07-31. `gate:vibcoder-ratchet` and `gate:editor-ui-gone` both PASS at 0.
   There is nothing left to delete.
2. **"Everything on flowbite" has a measured ceiling.** Of the five components
   evaluated in `chrome-ui/__tests__/flowbite-parity.test.tsx`, four were
   REJECTED with rendered-DOM evidence. flowbite also ships no tree, row, panel
   or shell primitive at all.
3. **"Global design system" is ambiguous and the wrong reading is dangerous.**
   `editor/design-system/` is the CUSTOMER's site design system, not the
   editor's. Chrome's system is `--bk-*` + `chrome-ui`.

Implication for sequencing: teach the chrome/customer boundary FIRST, because it
is the only thing standing between "delete old CSS" and breaking already-published
customer sites — which lands inside his own stated constraint.

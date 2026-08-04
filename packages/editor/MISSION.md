# Mission: One component system — the Buildrik editor on flowbite

## Why
Changing how a panel looks currently means first working out which of five
mechanisms owns it. That is the tax, and it is why new work is slow. You want
one place to change a control and have it change everywhere — flowbite +
`chrome-ui` + `tw:` utilities, and nothing else in the editor chrome.

## Success looks like
- You can point at any chrome surface and say which flowbite primitive or
  `chrome-ui` atom owns it, without opening a CSS file.
- You can tell, in under a minute, whether a given file styles the EDITOR or
  styles the CUSTOMER's published site — because the second one must never be
  deleted or restyled.
- You can decide for yourself whether a given flowbite component is safe to
  adopt, using evidence rather than the docs' promise.
- `inline_literal`, `inline_hoisted` and `css_lines` all reach zero for in-scope
  chrome, and the ratchet proves it rather than you asserting it.

## Constraints
- Business logic must not break. Visual regressions are acceptable; broken
  publishing, broken keyboard access, and broken customer sites are not.
- Roman Urdu explanation, direct, no quizzing me through a decision I have
  already made. Give one recommendation plus the cost.
- Sessions are long-running. Lessons must be short enough to finish in one sitting.

## Out of scope
- Deleting vibcoder / `shared/ui` / `shared/extensions` / `editor/ui` —
  already done 2026-07-28 and 07-31, gates locked at 0. There is nothing left.
- The canvas overlay layer (drag, selection, guides) — those inline styles are
  computed from live coordinates and CLAUDE.md explicitly allows them.
- Rewriting the customer-facing site-builder design system to look like the
  editor. That is a different product surface with different users.

# Vibcoder (Internal Component Library)

The editor's only sanctioned UI primitive layer: atoms (Button, Input, Checkbox, Radio, …), molecules, organisms, layout primitives (Stack, Cluster, Center, …), and Radix-backed overlays (Popover, Tooltip, Toast, ContextMenu). All editor chrome composes these — new inline-styled UI is banned by CI gates.

## Entry Points

- One `Component.tsx` + colocated `Component.test.tsx` per primitive, flat in this directory
- CSS lives in the theme bundle, not next to components

## Contracts & Invariants

- Every component class must have a matching CSS rule whose file is `@import`ed into `themes/default.css`. A shipped className with no loaded rule renders invisibly or falls back to cobalt defaults — this bug shipped 4× before becoming a checklist item.
- Surface/positional props (margin, width, grid placement) ride on the outer wrapper via `style`/dedicated props — components don't accept arbitrary positioning className overrides.
- Overlays are Radix-backed; don't hand-roll focus traps, portals, or dismiss logic.
- `variant="bare"` on Button exists for icon-only/unstyled cases — don't create new bare-button wrappers.
- Sub-token gaps (1–3px) in inspector micro-controls are intentional density, not violations.

## Anti-patterns

- No new wrapper "for consistency" around an existing primitive.
- No new CSS file without adding its `@import` to the theme bundle in the same commit.
- Bulk renames: Edit `replace_all` is literal substring, not word-boundary — grep `\bthis.X[A-Za-z]` first.

## Related Context

- Consumers: `../../AGENTS.md` (editor chrome)
- Design rules: repo-root `DESIGN.md`

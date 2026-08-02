# Editor Chrome (React UI)

React chrome around the engine: `shell/`, `sidebar/`, `canvas/`, `inspector/`, `panels/`, `rail/`, `design-system/`, `media/`, `wizard/`. Owns presentation and interaction; document state lives in `../engine/`.

## Entry Points

- `shell/` — top-level layout composition
- `canvas/Canvas.tsx` — mounts engine-rendered HTML (see invariant below)
- `sidebar/tabs/` — one folder per tab (templates, media, …); drill-in stack navigation, not peer panes
- `inspector/` — selected-element property editing
- `design-system/` — tokens/styles/components workspace (DS mode)

## Contracts & Invariants

- **Canvas mounts engine HTML, not React JSX** (`canvas/Canvas.tsx` injects via HTML escape hatch). Per-element canvas features require DOM mutation or engine serializer changes — React props on canvas children do nothing.
- All chrome composes `@/editor/chrome-ui` (which wraps `flowbite-react`) + generated `--bk-*` tokens, styled with `tw:`-prefixed Tailwind utilities. Importing `flowbite-react` directly outside `chrome-ui/` fails the build (`gate:chrome-ui-surface`, ERROR at 0). Raw hex, inline element styles and default font stacks are blocked by CI gates (`verify:ds`, pre-push BLOCKING). (This line said "vibcoder primitives" until 2026-08-03; vibcoder was deleted 2026-07-28 and `gate:vibcoder-ratchet` is locked at 0.)
- Light theme is canonical per DESIGN.md. Single accent `#1A56DB` (Flowbite blue-700). "Cobalt `#2D6DFF`" here was two migrations stale until 2026-08-03.
- `DSModeProvider`'s `initialMode` is read only on first mount (lazy `useState`) — remounting with a new value does nothing; drive mode changes through the setter.

## Anti-patterns

- **Orphan classNames**: a `className` with no matching CSS rule silently renders default/cobalt or invisible overlay. After adding classes, verify a rule exists AND its file is `@import`ed into `themes/default.css`. Template-literal classes (`.bd-foo-${role}`) escape literal grep — follow up with `grep -F '${'` on the prefix.
- Don't call a setter from inside another setter's callback — `useCallback` closures capture stale state. Use `setX(v)` + `useEffect` on `x`.
- `useCallback` with context-hook deps that rotate identity per render is worse than no memo — use `useRef` + empty deps.
- Wiring a leaf prop without verifying the upstream chain passes it: TS optional props hide the gap. Live-verify in the running editor.

## Related Context

- Engine: `../engine/AGENTS.md`
- Chrome library: `src/editor/chrome-ui/` (no AGENTS.md of its own — the contract lives in `../../CLAUDE.md` §Chrome Routing Rules)
- Package rules: `../../CLAUDE.md`, design rules: repo-root `DESIGN.md`

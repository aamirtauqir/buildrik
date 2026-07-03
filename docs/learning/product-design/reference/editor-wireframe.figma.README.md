# Editor wireframe — Figma-editable

Makes `editor-wireframe.html` editable in Figma.

## Files
- **`editor-wireframe.figma.svg`** — all 38 editor surfaces (§0–18, 20–27, 29–39) as one board. Drag into Figma → every box / bar / pill / label becomes a native editable layer; text stays editable text.
- `editor-wireframe.figma.preview.png` — flat preview (no Figma needed).
- Generator: `scratchpad/gen-editor-figma-svg.mjs` (data-driven; edit a screen spec + re-run to regenerate).

## Open in Figma
1. Figma → any design file (e.g. the blank one already made: https://www.figma.com/design/QCFANvjnaFs5DPIGeznN1r ).
2. Drag `editor-wireframe.figma.svg` onto the canvas **or** menu → *File ▸ Place image / Import* → pick the SVG.
3. Figma converts it: `<rect>` → Rectangle, `<text>` → editable Text, `<g>` → Group (named per surface, e.g. `0 The shell`). Select / restyle / move anything.

## Notes
- Monochrome on purpose (low-fi): prominence = size + fill darkness + position, never colour. Tokens mirror `assets/wireframe.css`.
- Direct push into a Figma file via the Figma MCP was blocked by the account's **Starter-plan MCP call cap** — the SVG-import route needs no MCP quota and yields the same native-editable result.
- Source of truth stays `editor-wireframe.html`. Regenerate the SVG after editing screen specs in the generator.

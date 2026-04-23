# Editor UI kit

Recreation of Buildrik's editor chrome: topbar + left rail + sidebar panel + canvas + right inspector + footer.

## Files
- `index.html` — standalone preview at 1440×900
- `EditorShell.jsx` — outer layout (grid + slots)
- `Topbar.jsx` — 48px header with undo/redo/breakpoints/preview/publish
- `LeftRail.jsx` — 56px icon rail (Add, Layers, Pages, Templates, AI, Settings)
- `SidebarPanel.jsx` — 320px panel that swaps content based on rail selection
- `Canvas.jsx` — slate dot-grid wrapper + white artboard with selected element
- `Inspector.jsx` — 280px right panel with Layout / Appearance / Effects tabs
- `Footer.jsx` — 32px status bar
- `primitives.jsx` — `Button`, `Input`, `NumberField`, `ColorField`, `Segment`, `Switch`, `Badge`, `Icon`

## Loading
```html
<link rel="stylesheet" href="../../colors_and_type.css">
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" ...></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" ...></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" ...></script>
<script type="text/babel" src="primitives.jsx"></script>
<script type="text/babel" src="Topbar.jsx"></script>
...
```

All component files export their components to `window` so they can share scope across files.

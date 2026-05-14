# §17 ImageEditorModal audit (prototype-v3 §17)

## Prototype intent
- Modal shell + tool rail (left-side or top-row controls)
- Crop tool with handles + aspect-lock
- Rotate (90° increments + free rotation)
- Flip horizontal / vertical
- Brightness / Contrast / Saturation sliders
- Filter presets (B&W / Sepia / Cool / Warm / Vibrant)
- Live canvas preview
- Before/After toggle (hold-to-preview-original)
- Save → uploads as new versioned copy (feeds §15 Versions tab)

## Current state (ImageEditorModal.tsx, 529 LOC)

### Tabs / tools — all shipped
- Crop tab via react-easy-crop (line 358-)
- Adjust tab (line 422-)
- Resize tab (line 490-)

### Crop tool — SHIPPED
- react-easy-crop drives handles + aspect lock
- `aspect` state (line 187) — free or locked ratio
- `croppedArea` state for save-time pixel crop

### Rotate / Flip — SHIPPED
- `rotation` state (line 186) — free degrees via slider
- Imports `RotateCcw, RotateCw` icons (line 17) — 90° buttons
- `flipH` + `flipV` state (lines 191-192) with `FlipHorizontal, FlipVertical` icons
- Canvas applies `ctx.rotate(radians)` (line 146) + `ctx.scale(flip.h ? -1 : 1, ...)` (line 147)

### Brightness / Contrast / Saturation — SHIPPED
- `adjustments` state (line 74-78) — brightness/contrast/saturation/preset
- Default range -100 to 100 per slider (lines 46-48 type)
- Canvas filter built via `buildCssFilter` (line 96-98) — CSS `brightness()`/`contrast()`/`saturate()` strings

### Filter presets — SHIPPED
- `FILTER_PRESETS` array (line 64) — B&W / Sepia / Cool / Warm / Vibrant
- Each preset has `cssFilter` string applied AFTER user adjustments (line 100 comment)
- Renders preset chips inside Adjust tab (line 463-)

### Resize — SHIPPED
- Separate tab with output dimensions
- `resizeW` / `resizeH` state

### Save — SHIPPED
- `onSave(editedSrc: string)` callback (line 38) — returns data URL
- Canvas drawn via `getCroppedImg` helper applying all transforms + filters
- Caller (MediaTab via handleEditImage) uploads as new versioned copy → §15 Versions tab populates

### Reset — SHIPPED
- Reset button clears rotation/flip/adjustments (lines 275-276)

## Gaps

- **Before/After toggle:** MISSING. No "press and hold" or "compare" affordance to preview original image without dismissing edits.

## Target

Add a Before/After toggle button (or "Compare" / press-and-hold pattern):
- When held / toggled: canvas / crop preview shows original image (no filters/rotation/flip)
- When released / toggled off: returns to edited preview
- Doesn't reset state — purely visual override of preview

## Implementation hints

- Add `comparing` boolean state
- On the crop preview area (react-easy-crop image OR adjust-tab preview img), conditionally apply NO filter style + NO rotation when `comparing` is true
- Button labeled "Hold to compare" with `onPointerDown` → `setComparing(true)`, `onPointerUp/Leave` → `setComparing(false)`
- Place in tool rail or near Save button
- Available in all 3 tabs (crop / adjust / resize) for consistency

## Plan tasks mapping

- Task 44 (modal shell + tool rail): SHIPPED → skip
- Task 45 (crop + aspect): SHIPPED → skip
- Task 46 (rotate 90° + free): SHIPPED → skip
- Task 47 (brightness slider): SHIPPED → skip
- Task 48 (contrast slider): SHIPPED → skip
- Task 49 (saturation + filter presets): SHIPPED → skip
- Task 50 (Save → v_n+1): SHIPPED via MediaTab handleEditImage → upload-as-new-version chain
- **NEW gap: Before/After toggle** — implement as single follow-up

Net work for Phase 8: 1 small additive feature (compare-hold button + state).

# §18 OptimizationPanel audit (prototype-v3 §18)

## Prototype intent
- Side-by-side preview (Original | Optimized)
- Format select (WebP / AVIF / JPG / PNG) with browser-support probe
- Quality slider (0-100 or 1-10)
- Max-dimension override (resize-down clamp)
- Live byte counter (original, optimized, savings %)
- Apply → uploads optimized output to §15 Versions

## Current state (OptimizationPanel.tsx, 331 LOC)

### Side-by-side preview — SHIPPED
- `previewBox` with two img elements: Original + Optimized (lines 304+)
- Labels "Original" / "Optimized"

### Format select — SHIPPED
- 4 buttons: WebP / AVIF / JPG / PNG (lines 236-240)
- `formatSupport` probe at mount detects WebP + AVIF (line 170)
- Disabled buttons when format unsupported by browser

### Quality slider — SHIPPED
- 0-100 range with live `state.quality` updates (line 222)
- Display of current value (line 88)

### Live byte counter — SHIPPED
- 3-stat row: Original size · Optimized size · savings % (lines 285-298)
- formatBytes utility from engine for human readable
- savings% recomputed on every quality/format change

### Apply path — SHIPPED
- `onOptimized(optimizedSrc)` callback (line 227)
- MediaTab handleOptimized wires upload-as-new-version → §15 Versions tab

### Engine support — SHIPPED
- `OptimizationOptions.maxWidth` + `maxHeight` already supported in MediaOptimizer
- Lines 72-80: clamps width/height with ratio preservation (downscale only)

## Gaps

- **Max-dimension override:** MISSING. No UI input for maxWidth/maxHeight. Optimize call hardcoded with no maxWidth/maxHeight options.

## Plan tasks mapping

- Task 52 (modal shell + side-by-side preview): SHIPPED → skip
- Task 53 (format select): SHIPPED → skip
- Task 54 (quality slider + byte counter): SHIPPED → skip
- **Task 55 (max-dim override + apply path):** MAX-DIM MISSING — implement. Apply path already shipped.

Net work for Phase 9: 1 input field + plumb maxWidth/maxHeight to optimizer call.

## Implementation hints

- Add `maxWidth` / `maxHeight` state to OptimizationPanel (default undefined → no clamp)
- Add Input or 2 Inputs to UI: "Max width (px)" + "Max height (px)" — or single "Max dimension" with longest-side clamp
- Plumb to `optimizer.optimize(src, { format, quality, preserveTransparency, maxWidth, maxHeight })` (line 193)
- Recompute on change (state already triggers re-optimize via useEffect dep on `state.format, state.quality`)
- Empty / 0 / NaN → omit option (no clamp)

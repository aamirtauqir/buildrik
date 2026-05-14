# §19 StockSourceModal audit (prototype-v3 §19)

## Prototype intent
- Tabs (img/vid/ico/fnt)
- Source pills (Unsplash/Pexels/Pixabay) for photos
- Filter pills (orientation + color)
- Tile hover: Save + photographer attribution + source credit
- Quota strip at top

## Current state (StockSourceModal.tsx, 355 LOC)

### Tabs — SHIPPED
- `activeTab` state + 4 tabs rendered (line 136+)

### Source pills — SHIPPED
- `STOCK_SOURCES` array w/ Unsplash/Pexels/Pixabay (line 53-55)
- Renders pill row (line 159+) w/ `data-testid="stock-source-pills"`

### Orientation + color filters — SHIPPED
- Orientation buttons (line 198+) — landscape/portrait/squarish
- Color pills (line 210)

### Quota strip — SHIPPED
- `quota` prop + render block at line 105+
- `data-testid="stock-quota-strip"`
- Optional upgradeHref link

### Tile hover Save bar — SHIPPED
- Photos grid: hover bar w/ Save to Library label + Download icon (line 250)
- Videos grid: play affordance

### Tile attribution — MISSING
- StockPhoto type has `author` + `authorUrl` + `source` fields
- StockVideo type has `author` + `source` fields
- UI does NOT render either
- Prototype §19 calls for "tile hover attribution" — photographer/contributor name + clickable source credit

## Gaps

- **Task 59 (Tile hover attribution):** PARTIAL — Save shipped, attribution missing. Implement.
- Tasks 57 / 58 / 60: all SHIPPED → skip.

## Implementation hints

- Photo hover bar (line 250 `med-img-hover-bar`): add author + source row. Author link uses `authorUrl` (target=_blank, rel=noopener noreferrer). For Pixabay/Pexels that don't have authorUrl, render plain text + source name only.
- Stop click propagation on the author link so clicking link doesn't trigger Save tile-click.
- Video tile: similar but smaller. Add overlay row with author + source.
- Use existing `med-img-hover-bar` styling — extend with a new sub-row or replace with structured layout (left: Save / right: author).

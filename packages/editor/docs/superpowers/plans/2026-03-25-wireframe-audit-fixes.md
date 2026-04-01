# Wireframe Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply all 18 audit fixes (Phase 1 Critical + Phase 2 Refinement + Phase 3 Polish) to the Buildrik wireframe file at `/Users/shahg/Desktop/pencil/editer.pen`.

**Architecture:** All changes are purely visual/design using `mcp__pencil__batch_design`. No code is written. Each task: (1) use `mcp__pencil__batch_get` to discover sub-node IDs, (2) use `mcp__pencil__batch_design` to apply changes, (3) use `mcp__pencil__get_screenshot` to visually verify.

**Tech Stack:** pencil.dev MCP tools — `batch_get`, `batch_design`, `get_screenshot`, `snapshot_layout`

**Spec:** `docs/superpowers/specs/2026-03-25-wireframe-audit-fixes-design.md`

**Frame Node IDs:**
- Row 1: kN0dW(01-Idle), 8IaFP(02-ElementSelected), FBFST(03-Layers), Y9iCS(04-Templates), q3VhD(05-MultiSelect), sQuZs(06-Pages)
- Row 2: hOLfn(07-Build), IXAAQ(08-DesignSystem), ryb1g(09-History), 4MVns(10-Export), Z55AC(11-Templates), dXz7J(12-Media)
- Row 3: KTRwQ(13-Settings), n5USt(14-Publish), jooME(15-VersionHistory), XSLrx(16-Onboarding), IpXmX(17-AI), Rb6qe(18-CMS)

**Design tokens:**
- Surfaces: #0f0f14(s1), #171720(s2), #1e1e28(s3), #252530(s4), #2e2e38(s5)
- Accent: #1D4ED8 | Text: #E2E2E6 | Muted: #6B6B7B | Amber: #F59E0B
- Radius: sm=5, md=8

---

## PHASE 1 — CRITICAL FIXES

---

### Task 1: P1-A — Populate inspector for selected-element frames (02, 03, 05)

**Target frames:** 8IaFP (Frame 02), FBFST (Frame 03), q3VhD (Frame 05)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen` — inspector body nodes inside each frame

- [ ] **Step 1: Discover inspector body node IDs in Frame 02 (8IaFP)**

```
mcp__pencil__batch_get(
  patterns=["inspector", "panel-right", "session", "layout", "style"],
  nodeIds=["8IaFP"]
)
```

Look for the inspector panel's body/content area node ID (the region below the Layout/Style/Effects tabs).

- [ ] **Step 2: Insert Layout properties section into Frame 02 inspector body**

Insert a vertical layout container inside the inspector body with these rows:
- Row 1: label "W" + value "100%" | label "H" + value "auto" (side by side)
- Row 2: label "X" + value "0" | label "Y" + value "0" (side by side)
- Row 3: divider line (1px, surface-5)
- Row 4: label "Fill" + color swatch rectangle (16×16, white fill) + value "#FFFFFF"
- Row 5: label "Radius" + value "8px"

Style: rows are 24px tall, text 12px #E2E2E6, labels 11px #6B6B7B, row background surface-3.

```
mcp__pencil__batch_design(operations="""
  propGroup=I("<inspector-body-node-id>", {
    layout: "vertical",
    gap: 0,
    width: 280
  })
  row1=I(propGroup, {
    layout: "horizontal",
    height: 24,
    padding: "0 12",
    gap: 8
  })
  I(row1, {type: "text", text: "W", fontSize: 11, color: "#6B6B7B", width: 40})
  I(row1, {type: "text", text: "100%", fontSize: 12, color: "#E2E2E6"})
  I(row1, {type: "text", text: "H", fontSize: 11, color: "#6B6B7B", width: 40})
  I(row1, {type: "text", text: "auto", fontSize: 12, color: "#E2E2E6"})
  row2=I(propGroup, {layout: "horizontal", height: 24, padding: "0 12", gap: 8})
  I(row2, {type: "text", text: "X", fontSize: 11, color: "#6B6B7B", width: 40})
  I(row2, {type: "text", text: "0", fontSize: 12, color: "#E2E2E6"})
  I(row2, {type: "text", text: "Y", fontSize: 11, color: "#6B6B7B", width: 40})
  I(row2, {type: "text", text: "0", fontSize: 12, color: "#E2E2E6"})
  divider=I(propGroup, {height: 1, background: "#2e2e38", width: 280})
  fillRow=I(propGroup, {layout: "horizontal", height: 24, padding: "0 12", gap: 8})
  I(fillRow, {type: "text", text: "Fill", fontSize: 11, color: "#6B6B7B", width: 40})
  I(fillRow, {width: 16, height: 16, background: "#FFFFFF", radius: 3})
  I(fillRow, {type: "text", text: "#FFFFFF", fontSize: 12, color: "#E2E2E6"})
  radRow=I(propGroup, {layout: "horizontal", height: 24, padding: "0 12", gap: 8})
  I(radRow, {type: "text", text: "Radius", fontSize: 11, color: "#6B6B7B", width: 40})
  I(radRow, {type: "text", text: "8px", fontSize: 12, color: "#E2E2E6"})
""")
```

- [ ] **Step 3: Repeat Step 1-2 for Frame 03 (FBFST)**

Discover inspector body node ID in FBFST and insert the same property rows.

- [ ] **Step 4: Repeat Step 1-2 for Frame 05 (q3VhD)**

Discover inspector body node ID in q3VhD and insert the same property rows.

- [ ] **Step 5: Verify — screenshot all 3 frames**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="8IaFP")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="FBFST")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="q3VhD")
```

Expected: inspector panel on right side of each frame shows W/H/X/Y/Fill/Radius rows.

---

### Task 2: P1-B — Differentiate rail icons (all 18 frames)

**Target:** The left rail (44px wide strip) in all frames — 8 icon positions.

- [ ] **Step 1: Discover rail node IDs in Frame 01 (kN0dW)**

```
mcp__pencil__batch_get(
  patterns=["rail", "icon", "nav"],
  nodeIds=["kN0dW"]
)
```

Find each of the 8 rail icon slot node IDs (top 5 and bottom 3).

- [ ] **Step 2: Update top 5 rail icon slots with distinct text symbols**

For Frame 01 (kN0dW), update each icon slot:
- Icon 1 (Add/top): text "＋", fontSize 16, color #E2E2E6, centered
- Icon 2 (Media): text "▣", fontSize 14, color #E2E2E6, centered
- Icon 3 (Layers): text "≡", fontSize 16, color #E2E2E6, centered
- Icon 4 (Templates): text "⊞", fontSize 14, color #E2E2E6, centered
- Icon 5 (Pages): text "☰", fontSize 14, color #E2E2E6, centered
- Icon 6 (Design): text "◉", fontSize 13, color #E2E2E6, centered
- Icon 7 (Settings): text "⚙", fontSize 14, color #E2E2E6, centered
- Icon 8 (History): text "↺", fontSize 15, color #E2E2E6, centered

```
mcp__pencil__batch_design(operations="""
  U("<icon1-node-id>", {text: "＋", fontSize: 16, color: "#E2E2E6"})
  U("<icon2-node-id>", {text: "▣", fontSize: 14, color: "#E2E2E6"})
  U("<icon3-node-id>", {text: "≡", fontSize: 16, color: "#E2E2E6"})
  U("<icon4-node-id>", {text: "⊞", fontSize: 14, color: "#E2E2E6"})
  U("<icon5-node-id>", {text: "☰", fontSize: 14, color: "#E2E2E6"})
  U("<icon6-node-id>", {text: "◉", fontSize: 13, color: "#E2E2E6"})
  U("<icon7-node-id>", {text: "⚙", fontSize: 14, color: "#E2E2E6"})
  U("<icon8-node-id>", {text: "↺", fontSize: 15, color: "#E2E2E6"})
""")
```

- [ ] **Step 3: Apply active-icon highlight to each frame's active rail icon**

For each frame, identify which rail icon slot corresponds to the active panel and set:
- background: #252530 (surface-4)
- borderLeft: "2px solid #1D4ED8"

Mapping:
- Frame 01 (kN0dW): no active icon (idle)
- Frames 02, 03, 05 (element selected / layers): icon 3 (Layers) active
- Frame 04 (Y9iCS): icon 4 (Templates) active
- Frame 06 (sQuZs): icon 5 (Pages) active
- Frame 07 (hOLfn): icon 1 (Add/Build) active
- Frame 08 (IXAAQ): icon 6 (Design) active
- Frames 09, 15 (History): icon 8 (History) active
- Frame 10 (4MVns): no active icon (modal)
- Frame 11 (Z55AC): icon 4 (Templates) active
- Frame 12 (dXz7J): icon 2 (Media) active
- Frame 13 (KTRwQ): icon 7 (Settings) active
- Frame 14 (n5USt): no active icon (publish flow)
- Frame 16 (XSLrx): no active icon (onboarding overlay)
- Frame 17 (IpXmX): icon 1 (AI/Add) active
- Frame 18 (Rb6qe): icon 3 (Layers) active

Apply same text symbols to all 18 frames (discover + update rail icons per frame).

- [ ] **Step 4: Verify Frame 01 rail**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="kN0dW")
```

Expected: 8 distinct icon symbols visible in the left rail strip, each ~16px.

---

### Task 3: P1-C — Export modal as canvas overlay (Frame 10, node 4MVns)

**Target:** Frame 10 (4MVns) — reposition export from dark gutter to centered modal overlay.

- [ ] **Step 1: Discover canvas viewport node and existing export bar in Frame 10**

```
mcp__pencil__batch_get(
  patterns=["export", "canvas", "viewport", "progress"],
  nodeIds=["4MVns"]
)
mcp__pencil__snapshot_layout(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="4MVns")
```

Identify: (a) the canvas viewport node ID, (b) the existing export progress bar node ID.

- [ ] **Step 2: Delete existing export progress bar from gutter**

```
mcp__pencil__batch_design(operations="""
  D("<export-progress-bar-node-id>")
""")
```

- [ ] **Step 3: Insert modal overlay inside canvas viewport**

Canvas viewport is approx 780×540. Modal center = canvas_x + 390, canvas_y + 270.

Insert inside the canvas viewport node:
1. Dark overlay rectangle: 780×540, background rgba black 60% → use #000000 with opacity 0.6
2. Modal card: 480×280, background #1e1e28 (surface-3), radius 8, centered
3. Inside modal: header "Export Project" + 4 progress rows + close button

```
mcp__pencil__batch_design(operations="""
  overlay=I("<canvas-viewport-node-id>", {
    width: 780, height: 540, background: "#000000", opacity: 0.6,
    position: "absolute", x: 0, y: 0
  })
  modal=I("<canvas-viewport-node-id>", {
    width: 480, height: 280, background: "#1e1e28", radius: 8,
    layout: "vertical", padding: 20, gap: 12,
    position: "absolute", x: 150, y: 130
  })
  hdr=I(modal, {layout: "horizontal", height: 28, gap: 8})
  I(hdr, {type: "text", text: "Export Project", fontSize: 14, fontWeight: 600, color: "#E2E2E6", flex: 1})
  I(hdr, {type: "text", text: "×", fontSize: 16, color: "#6B6B7B"})
  divider=I(modal, {height: 1, background: "#2e2e38"})
  row1=I(modal, {layout: "horizontal", height: 20, gap: 12, align: "center"})
  I(row1, {type: "text", text: "HTML / CSS", fontSize: 12, color: "#E2E2E6", width: 80})
  barBg1=I(row1, {height: 6, flex: 1, background: "#252530", radius: 3})
  I(barBg1, {height: 6, width: 280, background: "#1D4ED8", radius: 3})
  I(row1, {type: "text", text: "100%", fontSize: 11, color: "#6B6B7B", width: 32})
  row2=I(modal, {layout: "horizontal", height: 20, gap: 12, align: "center"})
  I(row2, {type: "text", text: "Images", fontSize: 12, color: "#E2E2E6", width: 80})
  barBg2=I(row2, {height: 6, flex: 1, background: "#252530", radius: 3})
  I(barBg2, {height: 6, width: 200, background: "#1D4ED8", radius: 3})
  I(row2, {type: "text", text: "72%", fontSize: 11, color: "#6B6B7B", width: 32})
  row3=I(modal, {layout: "horizontal", height: 20, gap: 12, align: "center"})
  I(row3, {type: "text", text: "Fonts", fontSize: 12, color: "#E2E2E6", width: 80})
  barBg3=I(row3, {height: 6, flex: 1, background: "#252530", radius: 3})
  I(barBg3, {height: 6, width: 280, background: "#10B981", radius: 3})
  I(row3, {type: "text", text: "100%", fontSize: 11, color: "#6B6B7B", width: 32})
  row4=I(modal, {layout: "horizontal", height: 20, gap: 12, align: "center"})
  I(row4, {type: "text", text: "Deploy", fontSize: 12, color: "#E2E2E6", width: 80})
  barBg4=I(row4, {height: 6, flex: 1, background: "#252530", radius: 3})
  I(barBg4, {height: 6, width: 80, background: "#F59E0B", radius: 3})
  I(row4, {type: "text", text: "28%", fontSize: 11, color: "#6B6B7B", width: 32})
""")
```

- [ ] **Step 4: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="4MVns")
```

Expected: Modal centered on canvas with dark overlay, 4 progress bars (blue/blue/green/amber), "Export Project" header, close button.

---

### Task 4: P1-D — Empty state messaging for blank canvases (Frames 01, 07, 08)

**Target:** kN0dW (01-Idle), hOLfn (07-Build), IXAAQ (08-DesignSystem)

- [ ] **Step 1: Discover canvas viewport node IDs in Frame 01**

```
mcp__pencil__batch_get(patterns=["canvas", "viewport"], nodeIds=["kN0dW"])
```

- [ ] **Step 2: Insert empty-state content in Frame 01 canvas**

Insert centered group:
- Circle placeholder (32×32, dashed border #6B6B7B, radius full, no fill)
- Text: "Click ＋ in the rail to add your first element" (12px, #6B6B7B, centered)

```
mcp__pencil__batch_design(operations="""
  emptyGroup=I("<canvas-viewport-01>", {
    layout: "vertical", gap: 12, align: "center", justify: "center",
    position: "absolute", x: 324, y: 234, width: 132
  })
  I(emptyGroup, {
    width: 32, height: 32, radius: 9999,
    border: "1.5px dashed #6B6B7B", background: "transparent"
  })
  I(emptyGroup, {
    type: "text",
    text: "Click ＋ in the rail to add your first element",
    fontSize: 12, color: "#6B6B7B", textAlign: "center", width: 132
  })
""")
```

- [ ] **Step 3: Insert section placeholder in Frame 07 canvas (hOLfn)**

Discover canvas viewport node ID in hOLfn, then insert a basic section placeholder:

```
mcp__pencil__batch_design(operations="""
  section=I("<canvas-viewport-07>", {
    width: 680, height: 120, background: "#FFFFFF", radius: 4,
    layout: "vertical", align: "center", justify: "center",
    position: "absolute", x: 50, y: 80
  })
  I(section, {type: "text", text: "Section", fontSize: 12, color: "#AAAAAA"})
""")
```

- [ ] **Step 4: Insert design system preview in Frame 08 canvas (IXAAQ)**

Discover canvas viewport node ID in IXAAQ, then insert token preview:

```
mcp__pencil__batch_design(operations="""
  previewGroup=I("<canvas-viewport-08>", {
    layout: "vertical", gap: 16, align: "center", justify: "center",
    position: "absolute", x: 240, y: 200, width: 300
  })
  I(previewGroup, {type: "text", text: "Token Preview", fontSize: 11, color: "#6B6B7B", textAlign: "center"})
  swatchRow=I(previewGroup, {layout: "horizontal", gap: 8})
  I(swatchRow, {width: 48, height: 48, background: "#1D4ED8", radius: 5})
  I(swatchRow, {width: 48, height: 48, background: "#10B981", radius: 5})
  I(swatchRow, {width: 48, height: 48, background: "#F59E0B", radius: 5})
  I(swatchRow, {width: 48, height: 48, background: "#EF4444", radius: 5})
  labelRow=I(previewGroup, {layout: "horizontal", gap: 8})
  I(labelRow, {type: "text", text: "Blue", fontSize: 10, color: "#6B6B7B", width: 48, textAlign: "center"})
  I(labelRow, {type: "text", text: "Green", fontSize: 10, color: "#6B6B7B", width: 48, textAlign: "center"})
  I(labelRow, {type: "text", text: "Amber", fontSize: 10, color: "#6B6B7B", width: 48, textAlign: "center"})
  I(labelRow, {type: "text", text: "Red", fontSize: 10, color: "#6B6B7B", width: 48, textAlign: "center"})
""")
```

- [ ] **Step 5: Verify all 3 frames**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="kN0dW")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="hOLfn")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="IXAAQ")
```

---

### Task 5: P1-E — Layer tree indentation (Frames 03, 05)

**Target:** FBFST (Frame 03), q3VhD (Frame 05) — sidebar layers tree items

- [ ] **Step 1: Discover layers tree item node IDs in Frame 03 (FBFST)**

```
mcp__pencil__batch_get(
  patterns=["layer", "section", "div", "h1", "container"],
  nodeIds=["FBFST"]
)
```

Identify each layer row node and its current x position.

- [ ] **Step 2: Update layer row x positions for indentation in Frame 03**

Level structure (from screenshot):
- "1 Section" → level 0, padding-left=8
- "1 Div/Block" → level 1, padding-left=20
- "H1" → level 2, padding-left=32

Update text content to prefix child items with "└ ":

```
mcp__pencil__batch_design(operations="""
  U("<section-row-id>", {paddingLeft: 8})
  U("<div-row-id>", {paddingLeft: 20, text: "└ 1 Div/Block"})
  U("<h1-row-id>", {paddingLeft: 32, text: "  └ H1"})
""")
```

Also add a vertical connector line (1px, #2e2e38, height = span from Section to last child):

```
mcp__pencil__batch_design(operations="""
  connector=I("<layers-panel-body>", {
    width: 1, height: 40, background: "#2e2e38",
    position: "absolute", x: 14, y: <section-row-y + 16>
  })
""")
```

- [ ] **Step 3: Repeat for Frame 05 (q3VhD)**

Discover layer item node IDs in q3VhD. The layer tree has: "1 Section", "B-Container", "H1", "P", "Button".

Apply:
- "1 Section": paddingLeft=8
- "B-Container": paddingLeft=20, prefix "└ "
- "H1", "P", "Button": paddingLeft=32, prefix "  └ "

- [ ] **Step 4: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="FBFST")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="q3VhD")
```

Expected: Clear parent → child visual indentation in layers panel.

---

### Task 6: P1-F — Constrain onboarding banner to canvas (Frame 16, node XSLrx)

**Target:** Frame 16 (XSLrx) — the full-width blue banner that bleeds over the rail

- [ ] **Step 1: Discover the blue banner node in Frame 16**

```
mcp__pencil__batch_get(
  patterns=["banner", "onboard", "blue", "header"],
  nodeIds=["XSLrx"]
)
mcp__pencil__snapshot_layout(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="XSLrx")
```

Find the node with fill=#1D4ED8 that spans the full frame width.

- [ ] **Step 2: Constrain banner to start after rail**

Rail is 44px wide. Update the banner:
- x: 44 (start after rail)
- width: 1396 (1440 - 44)

If sidebar (260px) is also present, banner starts at 44+260=304:
- x: 304, width: 1136

```
mcp__pencil__batch_design(operations="""
  U("<blue-banner-node-id>", {x: 304, width: 1136})
""")
```

- [ ] **Step 3: Constrain the dark canvas overlay to canvas area**

Find the semi-transparent overlay and update its x/width to match canvas bounds (x=304, width=780).

- [ ] **Step 4: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="XSLrx")
```

Expected: Blue banner does NOT overlap the dark rail or sidebar. It starts at the canvas area.

---

## PHASE 2 — REFINEMENT

---

### Task 7: P2-A — Sidebar typography hierarchy (key frames)

**Target:** Section header labels in frames 07 (hOLfn), 08 (IXAAQ), 12 (dXz7J), 13 (KTRwQ)

- [ ] **Step 1: Discover section header text nodes in Frame 07 (hOLfn)**

```
mcp__pencil__batch_get(
  patterns=["header", "section-label", "panel-title", "components"],
  nodeIds=["hOLfn"]
)
```

Find "Components" header label and any sub-section headers.

- [ ] **Step 2: Update section header styling in Frame 07**

```
mcp__pencil__batch_design(operations="""
  U("<components-header-id>", {
    fontSize: 10, color: "#6B6B7B", text: "COMPONENTS"
  })
""")
```

- [ ] **Step 3: Update section headers in Frame 08 (IXAAQ)**

Find "Design System" header and Color/Typography sub-headers. Update:
- "DESIGN SYSTEM" → 10px, #6B6B7B, uppercase
- "COLORS" → 10px, #6B6B7B, uppercase
- "TYPOGRAPHY" → 10px, #6B6B7B, uppercase

- [ ] **Step 4: Update section headers in Frame 12 (dXz7J)**

Find "Media" header. Update:
- "MEDIA" → 10px, #6B6B7B, uppercase

- [ ] **Step 5: Update section headers in Frame 13 (KTRwQ)**

Find "Settings" header. Update:
- "SETTINGS" → 10px, #6B6B7B, uppercase

- [ ] **Step 6: Verify 4 frames**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="hOLfn")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="IXAAQ")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="dXz7J")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="KTRwQ")
```

---

### Task 8: P2-B — Remove annotation notes from UI chrome (Frames 07, 09, 14, 17)

**Target:** Amber (#F59E0B) bar/text nodes inside sidebar or inspector panel areas (NOT in the y=880 annotation strip)

- [ ] **Step 1: Discover amber annotation nodes in Frame 07 (hOLfn)**

```
mcp__pencil__batch_get(
  patterns=["annotation", "note", "amber"],
  nodeIds=["hOLfn"]
)
```

Also search by color: look for nodes with fill=#F59E0B that are NOT in the annotation bar (y < 870).

- [ ] **Step 2: Delete amber nodes in inspector/sidebar area of Frame 07**

```
mcp__pencil__batch_design(operations="""
  D("<amber-node-id-07>")
""")
```

- [ ] **Step 3: Repeat for Frame 09 (ryb1g)**

Discover and delete amber annotation bars/text inside the sidebar or inspector (not y=880 zone).

- [ ] **Step 4: Repeat for Frame 14 (n5USt)**

Discover and delete amber annotation bars/text inside the sidebar.

- [ ] **Step 5: Repeat for Frame 17 (IpXmX)**

Discover and delete amber annotation bars/text inside the inspector.

- [ ] **Step 6: Verify all 4 frames**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="hOLfn")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="ryb1g")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="n5USt")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="IpXmX")
```

Expected: No amber color visible in sidebar or inspector UI chrome. Only annotation bar at y=880 may retain amber.

---

### Task 9: P2-C — Settings cards icon placeholders (Frame 13, node KTRwQ)

**Target:** Frame 13 (KTRwQ) — 6 cards in 2-column grid, each needs 16×16 icon placeholder

- [ ] **Step 1: Discover card node IDs in Frame 13**

```
mcp__pencil__batch_get(
  patterns=["card", "seo", "fonts", "publish", "settings"],
  nodeIds=["KTRwQ"]
)
```

Identify the 6 card container node IDs and their content areas.

- [ ] **Step 2: Add icon placeholder + border to each card**

For each of the 6 cards, insert a 16×16 gray rectangle at top-left and update card border:

```
mcp__pencil__batch_design(operations="""
  U("<card1-id>", {border: "1px solid #2E2E38"})
  I("<card1-id>", {width: 16, height: 16, background: "#252530", radius: 3, position: "absolute", x: 8, y: 8})
  U("<card2-id>", {border: "1px solid #2E2E38"})
  I("<card2-id>", {width: 16, height: 16, background: "#252530", radius: 3, position: "absolute", x: 8, y: 8})
  U("<card3-id>", {border: "1px solid #2E2E38"})
  I("<card3-id>", {width: 16, height: 16, background: "#252530", radius: 3, position: "absolute", x: 8, y: 8})
  U("<card4-id>", {border: "1px solid #2E2E38"})
  I("<card4-id>", {width: 16, height: 16, background: "#252530", radius: 3, position: "absolute", x: 8, y: 8})
  U("<card5-id>", {border: "1px solid #2E2E38"})
  I("<card5-id>", {width: 16, height: 16, background: "#252530", radius: 3, position: "absolute", x: 8, y: 8})
  U("<card6-id>", {border: "1px solid #2E2E38"})
  I("<card6-id>", {width: 16, height: 16, background: "#252530", radius: 3, position: "absolute", x: 8, y: 8})
""")
```

- [ ] **Step 3: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="KTRwQ")
```

Expected: Each settings card has a small gray square in top-left corner and a subtle border.

---

### Task 10: P2-D — Pages panel active state (Frame 06, node sQuZs)

**Target:** Frame 06 (sQuZs) — pages list sidebar

- [ ] **Step 1: Discover pages list item node IDs**

```
mcp__pencil__batch_get(
  patterns=["home", "page", "en-gig", "services", "blog"],
  nodeIds=["sQuZs"]
)
```

- [ ] **Step 2: Update active page ("Home") and inactive pages**

```
mcp__pencil__batch_design(operations="""
  U("<home-row-id>", {
    background: "#252530",
    borderLeft: "2px solid #1D4ED8",
    color: "#FFFFFF"
  })
  U("<engig-row-id>", {background: "transparent", color: "#E2E2E6"})
  U("<services-row-id>", {background: "transparent", color: "#E2E2E6"})
  U("<blog-row-id>", {background: "transparent", color: "#E2E2E6"})
  U("<landpage-row-id>", {background: "transparent", color: "#E2E2E6"})
""")
```

- [ ] **Step 3: Add "+ Add Page" button at bottom of list**

```
mcp__pencil__batch_design(operations="""
  addBtn=I("<pages-list-id>", {
    layout: "horizontal", height: 28, padding: "0 12", gap: 8, align: "center"
  })
  I(addBtn, {type: "text", text: "＋ Add Page", fontSize: 12, color: "#6B6B7B"})
""")
```

- [ ] **Step 4: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="sQuZs")
```

---

### Task 11: P2-E — Design System section separators (Frame 08, node IXAAQ)

**Target:** Frame 08 (IXAAQ) — sidebar between Colors and Typography sections

- [ ] **Step 1: Discover the sidebar body node and find insertion point between Colors and Typography**

```
mcp__pencil__batch_get(
  patterns=["colors", "typography", "sidebar-body", "tokens"],
  nodeIds=["IXAAQ"]
)
mcp__pencil__snapshot_layout(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="IXAAQ")
```

Find the y-coordinate where Colors section ends and Typography begins.

- [ ] **Step 2: Insert divider line between sections**

```
mcp__pencil__batch_design(operations="""
  divider=I("<sidebar-body-id>", {
    width: 260, height: 1, background: "#2e2e38",
    position: "absolute", x: 0, y: <between-colors-and-typography-y>
  })
""")
```

- [ ] **Step 3: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="IXAAQ")
```

---

### Task 12: P2-F — Inspector tab active state (Frames 02, 03, 05, 07, 08)

**Target:** Inspector tab rows (Layout / Style / Effects) — active "Layout" tab needs bottom border

- [ ] **Step 1: Discover tab node IDs in Frame 02 (8IaFP)**

```
mcp__pencil__batch_get(
  patterns=["layout-tab", "style-tab", "effects-tab", "tab"],
  nodeIds=["8IaFP"]
)
```

- [ ] **Step 2: Update "Layout" tab to active state, others to inactive**

For each of Frames 02, 03, 05, 07, 08:
- Layout tab: color=#FFFFFF, borderBottom="2px solid #1D4ED8"
- Style tab: color=#6B6B7B
- Effects tab: color=#6B6B7B

```
mcp__pencil__batch_design(operations="""
  U("<layout-tab-id>", {color: "#FFFFFF", borderBottom: "2px solid #1D4ED8"})
  U("<style-tab-id>", {color: "#6B6B7B"})
  U("<effects-tab-id>", {color: "#6B6B7B"})
""")
```

Repeat for FBFST, q3VhD, hOLfn, IXAAQ.

- [ ] **Step 3: Verify Frame 02**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="8IaFP")
```

Expected: "Layout" tab has visible blue underline, Style/Effects tabs are muted.

---

## PHASE 3 — POLISH

---

### Task 13: P3-A — Onboarding pagination dots (Frame 16, node XSLrx)

**Target:** Frame 16 (XSLrx) — pagination dot row at bottom of canvas overlay

- [ ] **Step 1: Discover pagination dots node**

```
mcp__pencil__batch_get(
  patterns=["dot", "pagination", "step-indicator"],
  nodeIds=["XSLrx"]
)
```

- [ ] **Step 2: Update active dot to pill shape, inactive dots to circles**

```
mcp__pencil__batch_design(operations="""
  U("<dot1-active-id>", {width: 20, height: 6, background: "#1D4ED8", radius: 9999})
  U("<dot2-id>", {width: 6, height: 6, background: "#2e2e38", radius: 9999})
  U("<dot3-id>", {width: 6, height: 6, background: "#2e2e38", radius: 9999})
""")
```

- [ ] **Step 3: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="XSLrx")
```

---

### Task 14: P3-B — Version History restore states (Frame 15, node jooME)

**Target:** Frame 15 (jooME) — version list items each need Restore button; top entry needs "Current" badge

- [ ] **Step 1: Discover version entry row node IDs**

```
mcp__pencil__batch_get(
  patterns=["version", "v1", "v1.1", "v1.2", "history"],
  nodeIds=["jooME"]
)
```

- [ ] **Step 2: Add Restore button to each version row + Current badge to first**

```
mcp__pencil__batch_design(operations="""
  U("<version-row-1>", {layout: "horizontal", align: "center"})
  badge=I("<version-row-1>", {
    type: "text", text: "Current", fontSize: 10, color: "#10B981",
    background: "#10B98122", radius: 9999, padding: "2px 6px"
  })
  restore1=I("<version-row-1>", {
    type: "text", text: "Restore", fontSize: 10, color: "#6B6B7B",
    border: "1px solid #2e2e38", radius: 3, padding: "2px 8px"
  })
  U("<version-row-2>", {layout: "horizontal", align: "center"})
  restore2=I("<version-row-2>", {
    type: "text", text: "Restore", fontSize: 10, color: "#6B6B7B",
    border: "1px solid #2e2e38", radius: 3, padding: "2px 8px"
  })
  U("<version-row-3>", {layout: "horizontal", align: "center"})
  restore3=I("<version-row-3>", {
    type: "text", text: "Restore", fontSize: 10, color: "#6B6B7B",
    border: "1px solid #2e2e38", radius: 3, padding: "2px 8px"
  })
""")
```

- [ ] **Step 3: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="jooME")
```

---

### Task 15: P3-C — Media panel upload zone (Frame 12, node dXz7J)

**Target:** Frame 12 (dXz7J) — remove stray annotation text, add drop zone

- [ ] **Step 1: Find and delete "String with ALPHA, TEXT" annotation in sidebar**

```
mcp__pencil__batch_get(
  patterns=["string", "alpha", "text", "annotation"],
  nodeIds=["dXz7J"]
)
```

Delete the node if it's inside the sidebar (not in y=880 annotation bar).

```
mcp__pencil__batch_design(operations="""
  D("<stray-annotation-node-id>")
""")
```

- [ ] **Step 2: Add drop zone below media grid**

```
mcp__pencil__batch_design(operations="""
  dropZone=I("<sidebar-body-dXz7J>", {
    width: 236, height: 32, radius: 5,
    border: "1px dashed #2e2e38", background: "transparent",
    layout: "horizontal", align: "center", justify: "center"
  })
  I(dropZone, {
    type: "text",
    text: "Drop files here or click to upload",
    fontSize: 10, color: "#6B6B7B"
  })
""")
```

- [ ] **Step 3: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="dXz7J")
```

---

### Task 16: P3-D — AI panel toggle state (Frame 17, node IpXmX)

**Target:** Frame 17 (IpXmX) — "Suggested-Add-New-Block" row needs a visual toggle pill

- [ ] **Step 1: Discover the toggle row node**

```
mcp__pencil__batch_get(
  patterns=["suggested", "toggle", "add-new-block"],
  nodeIds=["IpXmX"]
)
```

- [ ] **Step 2: Add toggle pill to the row (ON state)**

```
mcp__pencil__batch_design(operations="""
  U("<toggle-row-id>", {layout: "horizontal", align: "center", justify: "space-between"})
  togglePill=I("<toggle-row-id>", {
    width: 24, height: 12, background: "#1D4ED8", radius: 9999
  })
  I(togglePill, {
    width: 10, height: 10, background: "#FFFFFF", radius: 9999,
    position: "absolute", x: 12, y: 1
  })
""")
```

- [ ] **Step 3: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="IpXmX")
```

---

### Task 17: P3-E — Publish step active state (Frame 14, node n5USt)

**Target:** Frame 14 (n5USt) — active publish step needs highlight + spinner; completed steps need checkmarks

- [ ] **Step 1: Discover publish step row node IDs**

```
mcp__pencil__batch_get(
  patterns=["publish", "step", "version", "deploy", "peer"],
  nodeIds=["n5USt"]
)
```

- [ ] **Step 2: Update active step and add spinner/checkmarks**

The active step (highlighted in orange in current screenshot):
```
mcp__pencil__batch_design(operations="""
  U("<active-step-row-id>", {background: "#252530", borderLeft: "2px solid #1D4ED8"})
  U("<active-step-text-id>", {text: "⟳ Try Peer Prod Environment"})
  U("<completed-step-1-text>", {text: "✓ Version 5.2 App", color: "#10B981"})
""")
```

- [ ] **Step 3: Verify**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="n5USt")
```

---

### Task 18: P3-F — Canvas section dividers (Frames 02, 03, 05)

**Target:** 8IaFP, FBFST, q3VhD — horizontal divider lines between canvas sections should be more visible

- [ ] **Step 1: Discover divider line nodes in Frame 02 canvas**

```
mcp__pencil__batch_get(
  patterns=["divider", "separator", "hr"],
  nodeIds=["8IaFP"]
)
```

- [ ] **Step 2: Update divider styling in Frame 02**

```
mcp__pencil__batch_design(operations="""
  U("<divider-node-id>", {background: "#D0D0D0", height: 1})
""")
```

- [ ] **Step 3: Repeat for Frames 03 (FBFST) and 05 (q3VhD)**

- [ ] **Step 4: Final full-set verification — screenshot all 18 frames**

```
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="kN0dW")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="8IaFP")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="FBFST")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="Y9iCS")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="q3VhD")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="sQuZs")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="hOLfn")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="IXAAQ")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="ryb1g")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="4MVns")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="Z55AC")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="dXz7J")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="KTRwQ")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="n5USt")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="jooME")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="XSLrx")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="IpXmX")
mcp__pencil__get_screenshot(filePath="/Users/shahg/Desktop/pencil/editer.pen", nodeId="Rb6qe")
```

Verify all 18 frames against success criteria in the spec.

---

## Success Criteria Checklist

- [ ] Frames 02, 03, 05 — inspector shows W/H/X/Y/Fill/Radius properties
- [ ] All 18 frames — 8 distinct rail icon symbols visible (＋ ▣ ≡ ⊞ ☰ ◉ ⚙ ↺)
- [ ] Frame 10 — Export modal is a centered canvas overlay, not a gutter element
- [ ] Frames 01, 07, 08 — Canvas has empty-state messaging
- [ ] Frames 03, 05 — Layer items show parent/child indentation with "└" prefix
- [ ] Frame 16 — Blue onboarding banner does not overlap rail
- [ ] Frames 07, 08, 12, 13 — Section headers are 10px uppercase muted text
- [ ] Frames 07, 09, 14, 17 — No amber annotation bars in UI chrome
- [ ] Frame 13 — Each settings card has 16×16 icon placeholder + 1px border
- [ ] Frame 06 — "Home" page row has surface-4 bg + blue left border; "＋ Add Page" button present
- [ ] Frame 08 — 1px divider line between Colors and Typography sections
- [ ] Frames 02, 03, 05, 07, 08 — "Layout" tab has blue underline active state
- [ ] Frame 16 — Active pagination dot is pill (20×6), inactive are circles (6×6)
- [ ] Frame 15 — All 3 version rows have "Restore" ghost button; top row has "Current" badge
- [ ] Frame 12 — No stray annotation text in sidebar; drop zone present below media grid
- [ ] Frame 17 — Toggle pill (blue, ON state) visible on "Suggested" row
- [ ] Frame 14 — Active step has blue left border + "⟳" spinner; completed steps have "✓"
- [ ] Frames 02, 03, 05 — Canvas section dividers are 1px #D0D0D0

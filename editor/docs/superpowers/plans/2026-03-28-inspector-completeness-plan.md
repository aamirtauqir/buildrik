# Inspector Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 12 new high-fidelity inspector frames (section close-ups + element-type full states) and update 3 existing frames in `/Users/shahg/Desktop/pencil/editer.pen`.

**Architecture:** All work is in pencil.dev using the pencil MCP tools (`batch_design`, `batch_get`, `get_screenshot`, `find_empty_space_on_canvas`). Build 5 shared reusable widget components first (off-canvas), then compose them into section frames, then full-state frames, then patch existing frames. Each task ends with a screenshot verification and a git commit.

**Tech Stack:** pencil.dev MCP tools · existing reusable components (`pCoGe` InputField, `QVIwi` TabPill/active, `HG3uE` TabPill/inactive, `VBC3E` InspectorEmptyState) · light theme palette (`#FFFFFF` panel bg, `#E5E7EB` borders, `#111827` text, `#2563EB` primary, `#6B7280` label, `#F9FAFB` input bg)

---

## Colour + Dimension Reference

Use these values everywhere. No other hex codes.

```
PANEL_BG       = #FFFFFF
CANVAS_BG      = #F0F2F5
BORDER         = #E5E7EB
TEXT_PRIMARY   = #111827
TEXT_SECONDARY = #374151
TEXT_LABEL     = #6B7280
PRIMARY        = #2563EB
PRIMARY_LIGHT  = #EFF6FF
PRIMARY_TEXT   = #1D4ED8
INPUT_BG       = #F9FAFB
CHIP_BG        = #F3F4F6
CHIP_TEXT      = #4B5563
CHIP_ACTIVE_BG = #EFF6FF
CHIP_ACTIVE_TX = #1D4ED8
AI_BG          = rgba → use #EDE9FE (purple tint)
AI_BORDER      = #C4B5FD
AI_TEXT        = #6D28D9
SECTION_HDR_BG = #F9FAFB
DANGER         = #EF4444

INSPECTOR_WIDTH  = 247
INSPECTOR_BODY_W = 223   (247 − 24px padding)
SECTION_GAP      = 14    (gap between sections in inspector body)
ROW_H            = 28    (standard control row height)
LABEL_W          = 80    (label column width in InputRow)
CTRL_FONT        = 11
LABEL_FONT       = 11
```

---

## Task 1 — Reusable Widget Components (Phase 1)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Build 5 shared components off-canvas (place at x:12000, y:0). These are used by every section frame.

- [ ] **Step 1: Find empty canvas space**

```
mcp__pencil__find_empty_space_on_canvas({
  filePath: "/Users/shahg/Desktop/pencil/editer.pen",
  width: 1400, height: 600
})
```
Note the returned `x`, `y`. Use these for component placement.

- [ ] **Step 2: Build `InspectorInputRow` component**

A label + one or two input fields side by side.

```javascript
// Place components in a holding frame off-canvas
holder=I(document,{type:"frame",name:"Inspector Widget Components",layout:"vertical",gap:16,padding:16,fill:"#F8FAFC",placeholder:true,width:400,x:<x_from_step1>,y:<y_from_step1>})

// Widget 1: InspectorInputRow
inputRow=I(holder,{type:"frame",name:"InspectorInputRow",reusable:true,layout:"horizontal",alignItems:"center",gap:8,width:223,height:28})
inputRowLabel=I(inputRow,{type:"text",name:"label",content:"Label",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
inputRowField=I(inputRow,{type:"ref",ref:"pCoGe",width:"fill_container",height:28})
```

- [ ] **Step 3: Build `InspectorChipGroup` component**

A label + row of selectable chips.

```javascript
chipGroup=I(holder,{type:"frame",name:"InspectorChipGroup",reusable:true,layout:"horizontal",alignItems:"center",gap:8,width:223,height:28})
chipGroupLabel=I(chipGroup,{type:"text",name:"label",content:"Label",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
chipGroupRow=I(chipGroup,{type:"frame",name:"chips",layout:"horizontal",gap:4,width:"fill_container",height:28,alignItems:"center"})
// Active chip
chip1=I(chipGroupRow,{type:"frame",name:"chip-active",layout:"horizontal",alignItems:"center",justifyContent:"center",cornerRadius:4,fill:"#EFF6FF",padding:[4,8],height:22})
chip1lbl=I(chip1,{type:"text",content:"A",fontSize:11,fontWeight:"600",fill:"#1D4ED8"})
// Inactive chip
chip2=I(chipGroupRow,{type:"frame",name:"chip-inactive",layout:"horizontal",alignItems:"center",justifyContent:"center",cornerRadius:4,fill:"#F3F4F6",padding:[4,8],height:22})
chip2lbl=I(chip2,{type:"text",content:"B",fontSize:11,fill:"#4B5563"})
```

- [ ] **Step 4: Build `InspectorColorRow` component**

A label + colour swatch + hex input + opacity input.

```javascript
colorRow=I(holder,{type:"frame",name:"InspectorColorRow",reusable:true,layout:"horizontal",alignItems:"center",gap:6,width:223,height:28})
colorRowLabel=I(colorRow,{type:"text",name:"label",content:"Color",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
swatch=I(colorRow,{type:"frame",name:"swatch",width:22,height:22,cornerRadius:4,fill:"#2563EB",stroke:{fill:"#E5E7EB",thickness:1}})
hexInput=I(colorRow,{type:"ref",ref:"pCoGe",width:"fill_container",height:28})
opInput=I(colorRow,{type:"ref",ref:"pCoGe",width:44,height:28})
```

- [ ] **Step 5: Build `InspectorSliderRow` component**

A label + slider track + numeric input.

```javascript
sliderRow=I(holder,{type:"frame",name:"InspectorSliderRow",reusable:true,layout:"horizontal",alignItems:"center",gap:8,width:223,height:28})
sliderLabel=I(sliderRow,{type:"text",name:"label",content:"Label",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
trackBg=I(sliderRow,{type:"frame",name:"track",layout:"horizontal",alignItems:"center",width:"fill_container",height:4,cornerRadius:2,fill:"#E5E7EB"})
trackFill=I(trackBg,{type:"frame",name:"fill",width:80,height:4,cornerRadius:2,fill:"#2563EB"})
thumb=I(trackBg,{type:"frame",name:"thumb",width:12,height:12,cornerRadius:6,fill:"#FFFFFF",stroke:{fill:"#2563EB",thickness:2},layoutPosition:"absolute",x:74,y:-4})
sliderNumInput=I(sliderRow,{type:"ref",ref:"pCoGe",width:44,height:28})
```

- [ ] **Step 6: Build `InspectorSectionHeader` component**

Collapsible section header with chevron + label.

```javascript
sectionHdr=I(holder,{type:"frame",name:"InspectorSectionHeader",reusable:true,layout:"horizontal",alignItems:"center",gap:6,padding:[0,4],width:223,height:28,fill:"#F9FAFB",cornerRadius:4})
chevron=I(sectionHdr,{type:"text",content:"▼",fontSize:10,fill:"#6B7280"})
sectionHdrLabel=I(sectionHdr,{type:"text",name:"label",content:"Section Name",fontSize:11,fontWeight:"600",fill:"#374151"})
U(holder,{placeholder:false})
```

- [ ] **Step 7: Screenshot and verify**

```
mcp__pencil__get_screenshot({ filePath: "/Users/shahg/Desktop/pencil/editer.pen", nodeId: "<holder_id>" })
```

Verify: 5 distinct components visible, labels readable, chips styled correctly, slider track shows fill + thumb, swatch shows colour square.

- [ ] **Step 8: Commit**

```bash
cd /Users/shahg/Desktop/test/buildrik
git add -A
git commit -m "design: inspector widget components (InspectorInputRow, ChipGroup, ColorRow, SliderRow, SectionHeader)"
```

---

## Task 2 — Frame 50: Typography Section (Phase 2)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

- [ ] **Step 1: Get widget component IDs**

```
mcp__pencil__batch_get({
  filePath: "/Users/shahg/Desktop/pencil/editer.pen",
  patterns: [{ reusable: true, name: "Inspector" }],
  readDepth: 1
})
```
Note IDs for `InspectorInputRow`, `InspectorChipGroup`, `InspectorColorRow`, `InspectorSliderRow`, `InspectorSectionHeader`. Use them as `ref` values below.

- [ ] **Step 2: Find empty space and create placeholder frame**

```
mcp__pencil__find_empty_space_on_canvas({ filePath: "...", width: 280, height: 280 })
```

```javascript
f50=I(document,{type:"frame",name:"50 — Section: Typography",placeholder:true,width:247,fill:"#FFFFFF",layout:"vertical",gap:1,x:<x>,y:<y>})
```

- [ ] **Step 3: Add section header**

```javascript
hdr50=I(f50,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(hdr50+"/label",{content:"Typography"})
```

- [ ] **Step 4: Add controls (call 1 of 2 — font + weight/size + line-height)**

```javascript
body50=I(f50,{type:"frame",name:"body",layout:"vertical",gap:8,padding:[8,10],width:"fill_container"})

// Font family row
fontRow=I(body50,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
fontLabel=I(fontRow,{type:"text",content:"Font",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
fontInput=I(fontRow,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",padding:[0,8],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
fontInputTxt=I(fontInput,{type:"text",content:"Inter",fontSize:11,fill:"#111827"})
fontInputArrow=I(fontInput,{type:"text",content:"▾",fontSize:10,fill:"#6B7280"})

// Weight + size row
wsRow=I(body50,{type:"frame",layout:"horizontal",alignItems:"center",gap:6,width:"fill_container",height:28})
wsLabel=I(wsRow,{type:"text",content:"Weight · Size",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
wChips=I(wsRow,{type:"frame",layout:"horizontal",gap:3,alignItems:"center"})
wc1=I(wChips,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",cornerRadius:4,fill:"#F3F4F6",padding:[3,6],height:22})
I(wc1,{type:"text",content:"400",fontSize:10,fill:"#4B5563"})
wc2=I(wChips,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",cornerRadius:4,fill:"#EFF6FF",padding:[3,6],height:22})
I(wc2,{type:"text",content:"500",fontSize:10,fontWeight:"600",fill:"#1D4ED8"})
wc3=I(wChips,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",cornerRadius:4,fill:"#F3F4F6",padding:[3,6],height:22})
I(wc3,{type:"text",content:"700",fontSize:10,fill:"#4B5563"})
sizeInput=I(wsRow,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:52,height:28})
I(sizeInput,{type:"text",content:"16",fontSize:11,fill:"#111827"})
I(sizeInput,{type:"text",content:"px",fontSize:10,fill:"#6B7280"})

// Line-height slider row
lhRow=I(body50,{type:"ref",ref:"<InspectorSliderRow_id>",width:"fill_container"})
U(lhRow+"/label",{content:"Line height"})
```

- [ ] **Step 5: Add controls (call 2 of 2 — letter-spacing + align + decoration + color)**

```javascript
// Letter-spacing row
lsRow=I(body50,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(lsRow+"/label",{content:"Letter-spacing"})

// Text align chips
alignRow=I(body50,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(alignRow+"/label",{content:"Align"})

// Decoration chips
decorRow=I(body50,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(decorRow+"/label",{content:"Decoration"})

// Color row
colorRow50=I(body50,{type:"ref",ref:"<InspectorColorRow_id>",width:"fill_container"})
U(colorRow50+"/label",{content:"Color"})
U(colorRow50+"/swatch",{fill:"#111827"})

U(f50,{placeholder:false})
```

- [ ] **Step 6: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "<f50_id>" })
```

Verify: font family dropdown visible, weight chips (400/500/700) with 500 highlighted blue, size input, line-height slider with track+thumb, letter-spacing input, align chips, decoration chips, color swatch + hex input. All text readable.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "design: frame 50 — Typography section close-up"
```

---

## Task 3 — Frame 53: Background Section (Phase 2)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

- [ ] **Step 1: Find empty space**

```
mcp__pencil__find_empty_space_on_canvas({ filePath: "...", width: 280, height: 320 })
```

```javascript
f53=I(document,{type:"frame",name:"53 — Section: Background",placeholder:true,width:247,fill:"#FFFFFF",layout:"vertical",gap:1,x:<x>,y:<y>})
```

- [ ] **Step 2: Type selector + solid colour picker**

```javascript
hdr53=I(f53,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(hdr53+"/label",{content:"Background"})

body53=I(f53,{type:"frame",layout:"vertical",gap:10,padding:[8,10],width:"fill_container"})

// Type chips: Solid (active) | Gradient | Image | None
typeRow=I(body53,{type:"frame",layout:"horizontal",alignItems:"center",gap:6,width:"fill_container"})
typeLabel=I(typeRow,{type:"text",content:"Type",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
typeChips=I(typeRow,{type:"frame",layout:"horizontal",gap:3})
for chip in [["Solid","#EFF6FF","#1D4ED8",true],["Gradient","#F3F4F6","#4B5563",false],["Image","#F3F4F6","#4B5563",false],["None","#F3F4F6","#4B5563",false]]:
  c=I(typeChips,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",cornerRadius:4,fill:chip[1],padding:[3,6],height:22})
  I(c,{type:"text",content:chip[0],fontSize:10,fontWeight:chip[2]=="active"?"600":"400",fill:chip[2]})

// Colour picker square (sat/bri gradient)
picker=I(body53,{type:"frame",name:"colorPicker",layout:"vertical",gap:6,width:"fill_container"})
square=I(picker,{type:"frame",width:"fill_container",height:100,cornerRadius:6})
// Simulate gradient: white→transparent (horizontal) overlaid on black→transparent (vertical) over hue
I(square,{type:"frame",fill:{type:"gradient",gradientType:"linear",rotation:90,colors:[{color:"#FFFFFF",position:0},{color:"#FFFFFF00",position:1}]},width:"fill_container",height:"fill_container",layoutPosition:"absolute"})
I(square,{type:"frame",fill:{type:"gradient",gradientType:"linear",rotation:0,colors:[{color:"#00000000",position:0},{color:"#000000",position:1}]},width:"fill_container",height:"fill_container",layoutPosition:"absolute"})
// Colour picker thumb
I(square,{type:"frame",width:12,height:12,cornerRadius:6,fill:"#FFFFFF",stroke:{fill:"#FFFFFF",thickness:2},layoutPosition:"absolute",x:70,y:20})

// Hue bar
hueBar=I(picker,{type:"frame",width:"fill_container",height:10,cornerRadius:5,fill:{type:"gradient",gradientType:"linear",rotation:270,colors:[{color:"#FF0000",position:0},{color:"#FFFF00",position:0.17},{color:"#00FF00",position:0.33},{color:"#00FFFF",position:0.5},{color:"#0000FF",position:0.67},{color:"#FF00FF",position:0.83},{color:"#FF0000",position:1}]}})
I(picker,{type:"frame",width:12,height:12,cornerRadius:6,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:2},layoutPosition:"absolute",x:60,y:116})

// Alpha bar
alphaBar=I(picker,{type:"frame",width:"fill_container",height:10,cornerRadius:5,fill:{type:"gradient",gradientType:"linear",rotation:270,colors:[{color:"#6366F100",position:0},{color:"#6366F1",position:1}]}})

// Hex + opacity inputs
hexRow=I(body53,{type:"ref",ref:"<InspectorColorRow_id>",width:"fill_container"})
U(hexRow+"/label",{content:"Hex"})
U(hexRow+"/swatch",{fill:"#6366F1"})

U(f53,{placeholder:false})
```

- [ ] **Step 3: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "<f53_id>" })
```

Verify: type chips (Solid highlighted), gradient square with white→transparent overlay, hue rainbow bar, alpha bar, hex input + colour swatch. All elements within 247px width.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "design: frame 53 — Background section close-up"
```

---

## Task 4 — Frames 51 + 52: Flexbox + Grid Sections (Phase 2)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Build both in one task — same chip-heavy pattern.

- [ ] **Step 1: Find empty space for two 247×300 frames side by side**

```
mcp__pencil__find_empty_space_on_canvas({ filePath: "...", width: 560, height: 300 })
```

- [ ] **Step 2: Build Frame 51 — Flexbox**

```javascript
f51=I(document,{type:"frame",name:"51 — Section: Flexbox",placeholder:true,width:247,fill:"#FFFFFF",layout:"vertical",gap:1,x:<x>,y:<y>})
hdr51=I(f51,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(hdr51+"/label",{content:"Flexbox"})

body51=I(f51,{type:"frame",layout:"vertical",gap:8,padding:[8,10],width:"fill_container"})

// Direction chips: → ↓ ← ↑
dirRow=I(body51,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(dirRow+"/label",{content:"Direction"})

// Wrap chips: No wrap | Wrap
wrapRow=I(body51,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(wrapRow+"/label",{content:"Wrap"})

// Justify chips: 5 options
justRow=I(body51,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(justRow+"/label",{content:"Justify"})

// Align chips: 4 options
alignRow51=I(body51,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(alignRow51+"/label",{content:"Align"})

// Gap: two inputs (col gap, row gap)
gapRow=I(body51,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
gapLabel=I(gapRow,{type:"text",content:"Gap",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
colGapInput=I(gapRow,{type:"ref",ref:"pCoGe",width:"fill_container",height:28})
rowGapInput=I(gapRow,{type:"ref",ref:"pCoGe",width:"fill_container",height:28})

// Divider + "Flex Item" sub-section label
divider51=I(body51,{type:"frame",width:"fill_container",height:1,fill:"#E5E7EB"})
flexItemLabel=I(body51,{type:"text",content:"Flex Item",fontSize:10,fontWeight:"600",fill:"#9CA3AF",letterSpacing:0.5})

// Grow + Shrink row
gsRow=I(body51,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
gsLabel=I(gsRow,{type:"text",content:"Grow · Shrink",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
growInput=I(gsRow,{type:"ref",ref:"pCoGe",width:"fill_container",height:28})
shrinkInput=I(gsRow,{type:"ref",ref:"pCoGe",width:"fill_container",height:28})

// Basis + Self align rows
basisRow=I(body51,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(basisRow+"/label",{content:"Basis"})
selfAlignRow=I(body51,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(selfAlignRow+"/label",{content:"Self align"})

U(f51,{placeholder:false})
```

- [ ] **Step 3: Build Frame 52 — Grid**

```javascript
f52=I(document,{type:"frame",name:"52 — Section: Grid",placeholder:true,width:247,fill:"#FFFFFF",layout:"vertical",gap:1,x:<x+297>,y:<y>})
hdr52=I(f52,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(hdr52+"/label",{content:"Grid"})

body52=I(f52,{type:"frame",layout:"vertical",gap:8,padding:[8,10],width:"fill_container"})

// Columns template input
colsRow=I(body52,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(colsRow+"/label",{content:"Columns"})

// Rows template input
rowsRow=I(body52,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(rowsRow+"/label",{content:"Rows"})

// Col gap + Row gap
cGapRow=I(body52,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(cGapRow+"/label",{content:"Col gap"})
rGapRow=I(body52,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(rGapRow+"/label",{content:"Row gap"})

// Auto-flow chips: Row | Column | Dense
flowRow=I(body52,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(flowRow+"/label",{content:"Auto flow"})

// Divider + Grid Item sub-section
divider52=I(body52,{type:"frame",width:"fill_container",height:1,fill:"#E5E7EB"})
gridItemLabel=I(body52,{type:"text",content:"Grid Item",fontSize:10,fontWeight:"600",fill:"#9CA3AF",letterSpacing:0.5})

colSpanRow=I(body52,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(colSpanRow+"/label",{content:"Col span"})
rowSpanRow=I(body52,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(rowSpanRow+"/label",{content:"Row span"})
gridSelfAlignRow=I(body52,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(gridSelfAlignRow+"/label",{content:"Self align"})

U(f52,{placeholder:false})
```

- [ ] **Step 4: Screenshot both frames**

```
mcp__pencil__get_screenshot({ nodeId: "<f51_id>" })
mcp__pencil__get_screenshot({ nodeId: "<f52_id>" })
```

Verify f51: direction/wrap/justify/align chip rows, gap dual inputs, divider, Flex Item sub-section with grow/shrink/basis/self-align rows.
Verify f52: columns/rows template inputs, col/row gap inputs, auto-flow chips, divider, Grid Item sub-section with col-span/row-span/self-align.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "design: frames 51+52 — Flexbox and Grid section close-ups"
```

---

## Task 5 — Frame 54: Border + Radius Section (Phase 2)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

- [ ] **Step 1: Find empty space and create frame**

```
mcp__pencil__find_empty_space_on_canvas({ filePath: "...", width: 280, height: 260 })
```

```javascript
f54=I(document,{type:"frame",name:"54 — Section: Border + Radius",placeholder:true,width:247,fill:"#FFFFFF",layout:"vertical",gap:1,x:<x>,y:<y>})
hdr54=I(f54,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(hdr54+"/label",{content:"Border + Radius"})
body54=I(f54,{type:"frame",layout:"vertical",gap:8,padding:[8,10],width:"fill_container"})
```

- [ ] **Step 2: Border controls**

```javascript
// Sub-label
I(body54,{type:"text",content:"BORDER",fontSize:10,fontWeight:"600",fill:"#9CA3AF",letterSpacing:0.5})

// Style chips: — | - - | ··· | none
styleRow=I(body54,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(styleRow+"/label",{content:"Style"})

// Width
widthRow=I(body54,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(widthRow+"/label",{content:"Width"})

// Color
colorRow54=I(body54,{type:"ref",ref:"<InspectorColorRow_id>",width:"fill_container"})
U(colorRow54+"/label",{content:"Color"})
U(colorRow54+"/swatch",{fill:"#334155"})

// Sides chips: All | T | R | B | L
sidesRow=I(body54,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(sidesRow+"/label",{content:"Sides"})

// Divider
I(body54,{type:"frame",width:"fill_container",height:1,fill:"#E5E7EB"})
I(body54,{type:"text",content:"RADIUS",fontSize:10,fontWeight:"600",fill:"#9CA3AF",letterSpacing:0.5})
```

- [ ] **Step 3: Radius 2×2 grid**

```javascript
radiusGrid=I(body54,{type:"frame",layout:"vertical",gap:4,width:"fill_container"})
topRow=I(radiusGrid,{type:"frame",layout:"horizontal",gap:6,width:"fill_container"})
// TL corner
tlInput=I(topRow,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(tlInput,{type:"text",content:"⌐",fontSize:10,fill:"#6B7280"})
I(tlInput,{type:"text",content:"8px",fontSize:11,fill:"#111827"})
// TR corner
trInput=I(topRow,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(trInput,{type:"text",content:"¬",fontSize:10,fill:"#6B7280"})
I(trInput,{type:"text",content:"8px",fontSize:11,fill:"#111827"})
// BL + BR row
btmRow=I(radiusGrid,{type:"frame",layout:"horizontal",gap:6,width:"fill_container"})
blInput=I(btmRow,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(blInput,{type:"text",content:"L",fontSize:10,fill:"#6B7280"})
I(blInput,{type:"text",content:"8px",fontSize:11,fill:"#111827"})
brInput=I(btmRow,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(brInput,{type:"text",content:"J",fontSize:10,fill:"#6B7280"})
I(brInput,{type:"text",content:"8px",fontSize:11,fill:"#111827"})
// Link toggle
linkRow=I(body54,{type:"frame",layout:"horizontal",alignItems:"center",gap:6,width:"fill_container",height:24})
I(linkRow,{type:"frame",width:28,height:14,cornerRadius:7,fill:"#2563EB"})
I(linkRow,{type:"text",content:"Link all corners",fontSize:11,fill:"#6B7280"})

U(f54,{placeholder:false})
```

- [ ] **Step 4: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "<f54_id>" })
```

Verify: BORDER and RADIUS sub-labels, style chips, width/color rows, sides chips, 2×2 radius grid (each corner with icon), link toggle.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "design: frame 54 — Border + Radius section close-up"
```

---

## Task 6 — Frames 55 + 56: Interactions + Animation Sections (Phase 2)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

- [ ] **Step 1: Find empty space for two 247×280 frames**

```
mcp__pencil__find_empty_space_on_canvas({ filePath: "...", width: 560, height: 280 })
```

- [ ] **Step 2: Build Frame 55 — Interactions**

```javascript
f55=I(document,{type:"frame",name:"55 — Section: Interactions",placeholder:true,width:247,fill:"#FFFFFF",layout:"vertical",gap:1,x:<x>,y:<y>})
hdr55=I(f55,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(hdr55+"/label",{content:"Interactions"})
body55=I(f55,{type:"frame",layout:"vertical",gap:6,padding:[8,10],width:"fill_container"})

// Interaction card 1: On Click
card1=I(body55,{type:"frame",layout:"vertical",gap:4,padding:8,cornerRadius:6,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container"})
card1Row=I(card1,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",width:"fill_container"})
I(card1Row,{type:"text",content:"On Click",fontSize:11,fontWeight:"600",fill:"#2563EB"})
I(card1Row,{type:"text",content:"✕",fontSize:11,fill:"#9CA3AF"})
card1Action=I(card1,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,width:"fill_container"})
I(card1Action,{type:"text",content:"→",fontSize:11,fill:"#6B7280"})
I(card1Action,{type:"text",content:"Navigate to",fontSize:11,fill:"#374151"})
I(card1Action,{type:"text",content:"/about",fontSize:11,fill:"#2563EB"})

// Interaction card 2: On Hover
card2=I(body55,{type:"frame",layout:"vertical",gap:4,padding:8,cornerRadius:6,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container"})
card2Row=I(card2,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",width:"fill_container"})
I(card2Row,{type:"text",content:"On Hover",fontSize:11,fontWeight:"600",fill:"#2563EB"})
I(card2Row,{type:"text",content:"✕",fontSize:11,fill:"#9CA3AF"})
card2Action=I(card2,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,width:"fill_container"})
I(card2Action,{type:"text",content:"→",fontSize:11,fill:"#6B7280"})
I(card2Action,{type:"text",content:"Toggle class",fontSize:11,fill:"#374151"})
I(card2Action,{type:"text",content:".hover-state",fontSize:11,fill:"#2563EB"})

// Add interaction button
addBtn=I(body55,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",gap:4,padding:[6,0],cornerRadius:6,stroke:{fill:"#2563EB",thickness:1,align:"inside"},fill:"#EFF6FF",width:"fill_container",height:32})
I(addBtn,{type:"text",content:"+ Add interaction",fontSize:11,fontWeight:"600",fill:"#2563EB"})

// Trigger options label
I(body55,{type:"text",content:"Triggers: On Click · On Hover · On Scroll · On Load · On Mouse Enter · On Mouse Leave",fontSize:10,fill:"#9CA3AF",textGrowth:"fixed-width",width:"fill_container"})

U(f55,{placeholder:false})
```

- [ ] **Step 3: Build Frame 56 — Animation**

```javascript
f56=I(document,{type:"frame",name:"56 — Section: Animation",placeholder:true,width:247,fill:"#FFFFFF",layout:"vertical",gap:1,x:<x+297>,y:<y>})
hdr56=I(f56,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(hdr56+"/label",{content:"Animation"})
body56=I(f56,{type:"frame",layout:"vertical",gap:8,padding:[8,10],width:"fill_container"})

// Trigger chips: On load (active) | Scroll | Click
trigRow=I(body56,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(trigRow+"/label",{content:"Trigger"})

// Preset dropdown
presetRow=I(body56,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
I(presetRow,{type:"text",content:"Preset",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
presetInput=I(presetRow,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",padding:[0,8],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(presetInput,{type:"text",content:"Fade In",fontSize:11,fill:"#111827"})
I(presetInput,{type:"text",content:"▾",fontSize:10,fill:"#6B7280"})

// Duration slider
durRow=I(body56,{type:"ref",ref:"<InspectorSliderRow_id>",width:"fill_container"})
U(durRow+"/label",{content:"Duration"})

// Delay input
delayRow=I(body56,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(delayRow+"/label",{content:"Delay"})

// Easing dropdown
easingRow=I(body56,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
I(easingRow,{type:"text",content:"Easing",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
easingInput=I(easingRow,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",padding:[0,8],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(easingInput,{type:"text",content:"ease-out",fontSize:11,fill:"#111827"})
I(easingInput,{type:"text",content:"▾",fontSize:10,fill:"#6B7280"})

// Direction chips: In | Out | In + Out
dirRow56=I(body56,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(dirRow56+"/label",{content:"Direction"})

// Preview button
previewBtn=I(body56,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",gap:4,padding:[6,0],cornerRadius:6,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:32})
I(previewBtn,{type:"text",content:"▶  Preview animation",fontSize:11,fill:"#374151"})

U(f56,{placeholder:false})
```

- [ ] **Step 4: Screenshot both**

```
mcp__pencil__get_screenshot({ nodeId: "<f55_id>" })
mcp__pencil__get_screenshot({ nodeId: "<f56_id>" })
```

Verify f55: two interaction cards (On Click, On Hover) with trigger label + action in blue + ✕ dismiss, Add interaction button, trigger options note.
Verify f56: trigger chips, preset dropdown, duration slider, delay/easing inputs, direction chips, preview button.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "design: frames 55+56 — Interactions and Animation section close-ups"
```

---

## Task 7 — Frame 57: AI Suggestion Strip (Phase 2)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

- [ ] **Step 1: Find empty space and build**

```
mcp__pencil__find_empty_space_on_canvas({ filePath: "...", width: 280, height: 140 })
```

```javascript
f57=I(document,{type:"frame",name:"57 — Section: AI Suggestion Strip",placeholder:true,width:247,fill:"#FFFFFF",layout:"vertical",gap:0,padding:[8,10],x:<x>,y:<y>})

// Note text
I(f57,{type:"text",content:"Appears at bottom of each inspector tab when element is selected",fontSize:10,fill:"#9CA3AF",textGrowth:"fixed-width",width:"fill_container"})

divider=I(f57,{type:"frame",width:"fill_container",height:1,fill:"#E5E7EB"})

// Purple AI card
aiCard=I(f57,{type:"frame",layout:"vertical",gap:8,padding:10,cornerRadius:8,fill:"#EDE9FE",stroke:{fill:"#C4B5FD",thickness:1},width:"fill_container"})

// Header row
aiHeader=I(aiCard,{type:"frame",layout:"horizontal",alignItems:"center",gap:6,width:"fill_container"})
aiDot=I(aiHeader,{type:"frame",width:16,height:16,cornerRadius:8,fill:{type:"gradient",gradientType:"linear",rotation:315,colors:[{color:"#6366F1",position:0},{color:"#8B5CF6",position:1}]}})
I(aiHeader,{type:"text",content:"AI Suggestion",fontSize:11,fontWeight:"700",fill:"#6D28D9"})

// Suggestion text
I(aiCard,{type:"text",content:"This text has low contrast (3.2:1). Try #F1F5F9 for WCAG AA compliance.",fontSize:11,fill:"#4C1D95",textGrowth:"fixed-width",width:"fill_container",lineHeight:1.5})

// Action buttons
aiActions=I(aiCard,{type:"frame",layout:"horizontal",gap:6,width:"fill_container"})
applyBtn=I(aiActions,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",padding:[5,0],cornerRadius:5,fill:"#7C3AED",width:"fill_container",height:28})
I(applyBtn,{type:"text",content:"Apply fix",fontSize:11,fontWeight:"600",fill:"#FFFFFF"})
dismissBtn=I(aiActions,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",padding:[5,12],cornerRadius:5,fill:"#EDE9FE",stroke:{fill:"#C4B5FD",thickness:1},height:28})
I(dismissBtn,{type:"text",content:"Dismiss",fontSize:11,fill:"#6D28D9"})

U(f57,{placeholder:false})
```

- [ ] **Step 2: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "<f57_id>" })
```

Verify: purple card with gradient AI dot, suggestion text, Apply fix (dark purple filled) + Dismiss (ghost) buttons. Card width matches 247px panel.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "design: frame 57 — AI Suggestion strip close-up"
```

---

## Task 8 — Frame 46: Inspector: Text Selected (Phase 3)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Full 1440×900 inspector frame showing text element selected, Appearance tab active.

- [ ] **Step 1: Copy existing Frame 35 as base**

Frame 35 (jPkOS) has the correct shell structure (topbar, rail, canvas, inspector panel). Copy it.

```
mcp__pencil__find_empty_space_on_canvas({ filePath: "...", width: 1440, height: 900 })
```

```javascript
f46=C("jPkOS", document, {name:"46 — Inspector: Text Selected", placeholder:true, x:<x>, y:<y>})
```

- [ ] **Step 2: Update inspector body with Typography section**

```javascript
// The inspector body in the copied frame is at id C5CRr within the copy
// Get the copied frame's inspector body ID first:
mcp__pencil__snapshot_layout({ filePath: "...", parentId: "<f46_id>", maxDepth: 4 })
// Then insert the Typography section reference into the body:
body46=<id of inspBody in f46>
typSection=I(body46,{type:"ref",ref:"<f50_id>"})
```

Wait — frame 50 is a standalone section frame, not a reusable component. Instead, build the Typography section inline in the inspector body using the widget components, same as Task 2 Step 4-5 but inserting into `body46`.

```javascript
// Tab bar: show "Appearance" active, Layout + Effects inactive
// (Update the existing tab references in the copied frame)
// inspTabs in copied frame: update tab labels via descendants

// Insert typography body content into inspBody of copied frame
fontRow46=I(body46,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
I(fontRow46,{type:"text",content:"Font",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
fontInput46=I(fontRow46,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",padding:[0,8],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(fontInput46,{type:"text",content:"Inter",fontSize:11,fill:"#111827"})
I(fontInput46,{type:"text",content:"▾",fontSize:10,fill:"#6B7280"})
// ... (repeat weight/size, line-height, letter-spacing, align, decoration, color rows as in Task 2)
// Add collapsed Background + Border section headers below
bgHdr=I(body46,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(bgHdr+"/label",{content:"Background"})
borderHdr=I(body46,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(borderHdr+"/label",{content:"Border + Radius"})
// Add AI suggestion strip at bottom
aiStrip46=I(body46, ... ) // same structure as f57 Task 7 Step 1

U(f46,{placeholder:false})
```

- [ ] **Step 3: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "<f46_id>" })
```

Verify: full 1440×900 frame, inspector panel on right (247px wide), Appearance tab active (blue), Typography section expanded with all controls, Background + Border collapsed, AI strip at bottom. Canvas shows a text element selected with selection handles.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "design: frame 46 — Inspector: Text Selected full state"
```

---

## Task 9 — Frame 47: Inspector: Box/Container Selected (Phase 3)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Full frame, Layout tab active, Flexbox section visible.

- [ ] **Step 1: Copy Frame 34 as base**

```javascript
f47=C("nkopD", document, {name:"47 — Inspector: Box/Container Selected", placeholder:true, x:<x>, y:<y>})
```

- [ ] **Step 2: Fill inspector body**

Get snapshot of copied frame to find body ID, then insert:

```javascript
// Layout tab active — insert section headers + Flexbox content
// Display/Layout section header (expanded)
displayHdr=I(body47,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(displayHdr+"/label",{content:"Display / Layout"})
displayBody=I(body47,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[4,0],width:"fill_container"})
for mode in [["Block","#F3F4F6","#4B5563"],["Flex","#EFF6FF","#1D4ED8"],["Grid","#F3F4F6","#4B5563"],["None","#F3F4F6","#4B5563"]]:
  chip=I(displayBody,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",cornerRadius:4,fill:mode[1],padding:[3,8],height:22})
  I(chip,{type:"text",content:mode[0],fontSize:10,fontWeight:mode[0]=="Flex"?"600":"400",fill:mode[2]})

// Size section (expanded)
sizeHdr=I(body47,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(sizeHdr+"/label",{content:"Size"})
sizeRow=I(body47,{type:"frame",layout:"horizontal",gap:6,padding:[4,0],width:"fill_container"})
wRow=I(sizeRow,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(wRow,{type:"text",content:"W",fontSize:10,fill:"#9CA3AF"})
I(wRow,{type:"text",content:"320",fontSize:11,fill:"#111827"})
hRow=I(sizeRow,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(hRow,{type:"text",content:"H",fontSize:10,fill:"#9CA3AF"})
I(hRow,{type:"text",content:"200",fontSize:11,fill:"#111827"})

// Spacing section (expanded)
spacingHdr=I(body47,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(spacingHdr+"/label",{content:"Spacing"})
I(body47,{type:"text",content:"Padding",fontSize:10,fill:"#9CA3AF"})
paddingRow=I(body47,{type:"frame",layout:"horizontal",gap:4,padding:[2,0],width:"fill_container"})
for label in ["T","R","B","L"]:
  cell=I(paddingRow,{type:"frame",layout:"vertical",alignItems:"center",gap:2,width:"fill_container"})
  I(cell,{type:"text",content:label,fontSize:9,fill:"#9CA3AF"})
  inp=I(cell,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:24})
  I(inp,{type:"text",content:"12",fontSize:11,fill:"#111827"})

// Flexbox section header + content (use same build as frame 51 body)
flexHdr=I(body47,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(flexHdr+"/label",{content:"Flexbox"})
// ... direction/wrap/justify/align/gap rows (same as Task 4 Step 2)

// Collapsed sections
posHdr=I(body47,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(posHdr+"/label",{content:"Position"})
overflowHdr=I(body47,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(overflowHdr+"/label",{content:"Overflow"})

U(f47,{placeholder:false})
```

- [ ] **Step 3: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "<f47_id>" })
```

Verify: Layout tab active, Display chips (Flex highlighted), Size W/H inputs, Spacing padding 4-cell grid, Flexbox section expanded, Position + Overflow collapsed.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "design: frame 47 — Inspector: Box/Container Selected full state"
```

---

## Task 10 — Frame 48: Inspector: Image Selected (Phase 3)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Full frame, Appearance tab active, Image Fill section shown.

- [ ] **Step 1: Copy Frame 35 as base**

```javascript
f48=C("jPkOS", document, {name:"48 — Inspector: Image Selected", placeholder:true, x:<x>, y:<y>})
```

- [ ] **Step 2: Fill inspector body with Image Fill section**

```javascript
body48=<inspBody id in f48>

imageFillHdr=I(body48,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(imageFillHdr+"/label",{content:"Image Fill"})

imageFillBody=I(body48,{type:"frame",layout:"vertical",gap:8,padding:[4,0],width:"fill_container"})

// Thumbnail + Replace button row
thumbRow=I(imageFillBody,{type:"frame",layout:"horizontal",alignItems:"center",gap:10,width:"fill_container"})
thumb=I(thumbRow,{type:"frame",width:48,height:48,cornerRadius:4,fill:"#D1D5DB"})
G(thumb,"stock","mountain landscape")
replaceBtn=I(thumbRow,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",padding:[0,12],cornerRadius:5,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},height:28})
I(replaceBtn,{type:"text",content:"Replace",fontSize:11,fill:"#374151"})

// Fit mode chips: Fill (active) | Fit | Stretch | Tile
fitRow=I(imageFillBody,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(fitRow+"/label",{content:"Fit mode"})

// Position X/Y
posRow=I(imageFillBody,{type:"frame",layout:"horizontal",alignItems:"center",gap:6,width:"fill_container"})
I(posRow,{type:"text",content:"Position",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
xInp=I(posRow,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(xInp,{type:"text",content:"X",fontSize:10,fill:"#9CA3AF"})
I(xInp,{type:"text",content:"50%",fontSize:11,fill:"#111827"})
yInp=I(posRow,{type:"frame",layout:"horizontal",alignItems:"center",gap:4,padding:[0,6],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(yInp,{type:"text",content:"Y",fontSize:10,fill:"#9CA3AF"})
I(yInp,{type:"text",content:"50%",fontSize:11,fill:"#111827"})

// Alt text
altRow=I(imageFillBody,{type:"ref",ref:"<InspectorInputRow_id>",width:"fill_container"})
U(altRow+"/label",{content:"Alt text"})

// Collapsed sections
overlayHdr=I(body48,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(overlayHdr+"/label",{content:"Overlay / Tint"})
borderHdr48=I(body48,{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(borderHdr48+"/label",{content:"Border + Radius"})

U(f48,{placeholder:false})
```

- [ ] **Step 3: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "<f48_id>" })
```

Verify: Image Fill section expanded, thumbnail with landscape image + Replace button, Fit mode chips (Fill active), Position X/Y inputs, Alt text input, Overlay + Border collapsed.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "design: frame 48 — Inspector: Image Selected full state"
```

---

## Task 11 — Frame 49: Inspector: Empty State (Phase 3)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Full frame, nothing selected, all tabs greyed.

- [ ] **Step 1: Copy Frame 35 as base**

```javascript
f49=C("jPkOS", document, {name:"49 — Inspector: Empty State", placeholder:true, x:<x>, y:<y>})
```

- [ ] **Step 2: Replace inspector body with InspectorEmptyState**

```javascript
body49=<inspBody id in f49>
// Clear any existing content and insert the InspectorEmptyState component
emptyState=I(body49,{type:"ref",ref:"VBC3E",width:"fill_container"})

// Grey out all tab pills in the tabs row — get tabs row ID from snapshot
mcp__pencil__snapshot_layout({ parentId: "<f49_id>", maxDepth: 4 })
// Update each TabPill in the tabs row to use inactive style and reduced opacity
U("<tabsRow_id_in_f49>",{opacity:0.35})
```

- [ ] **Step 3: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "<f49_id>" })
```

Verify: inspector panel shows tab bar (greyed/dimmed), empty state component centred in body area with icon + "Nothing selected" text + sub-hint. Canvas shows no selection.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "design: frame 49 — Inspector: Empty State full state"
```

---

## Task 12 — Update Frame 34: Layout Tab (Phase 4)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Frame 34 (`nkopD`) inspector body ID is `oC3sv`. Add Flexbox, Grid, Position, Overflow sections.

- [ ] **Step 1: Set placeholder and inspect current body**

```javascript
U("nkopD",{placeholder:true})
mcp__pencil__snapshot_layout({ filePath: "...", parentId: "oC3sv", maxDepth: 2 })
```

Note existing children count. All new sections are appended after existing ones.

- [ ] **Step 2: Add Flexbox + Grid section headers**

```javascript
// Flexbox section (same controls as frame 51 body)
flexHdr34=I("oC3sv",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(flexHdr34+"/label",{content:"Flexbox"})
flexBody34=I("oC3sv",{type:"frame",layout:"vertical",gap:8,padding:[4,0],width:"fill_container"})
// Direction row
dirRow34=I(flexBody34,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(dirRow34+"/label",{content:"Direction"})
// Wrap row
wrapRow34=I(flexBody34,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(wrapRow34+"/label",{content:"Wrap"})
// Justify row
justRow34=I(flexBody34,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(justRow34+"/label",{content:"Justify"})
// Align row
alignRow34=I(flexBody34,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(alignRow34+"/label",{content:"Align"})
// Gap row
gapRow34=I(flexBody34,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
I(gapRow34,{type:"text",content:"Gap",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
I(gapRow34,{type:"ref",ref:"pCoGe",width:"fill_container",height:28})
I(gapRow34,{type:"ref",ref:"pCoGe",width:"fill_container",height:28})
```

- [ ] **Step 3: Add Grid + Position + Overflow sections**

```javascript
// Grid section header (collapsed — no body, just header)
gridHdr34=I("oC3sv",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(gridHdr34+"/label",{content:"Grid"})
// Update chevron to ▶ (collapsed)
U(gridHdr34+"/chevron",{content:"▶"})

// Position section
posHdr34=I("oC3sv",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(posHdr34+"/label",{content:"Position"})
U(posHdr34+"/chevron",{content:"▶"})

// Overflow section
overflowHdr34=I("oC3sv",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(overflowHdr34+"/label",{content:"Overflow"})
U(overflowHdr34+"/chevron",{content:"▶"})

U("nkopD",{placeholder:false})
```

- [ ] **Step 4: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "nkopD" })
```

Verify: existing sections still intact, new Flexbox section (expanded with chips), Grid + Position + Overflow collapsed headers at bottom.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "design: update frame 34 — Layout Tab + Flexbox/Grid/Position/Overflow sections"
```

---

## Task 13 — Update Frame 35: Appearance Tab (Phase 4)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Frame 35 (`jPkOS`) inspector body ID is `C5CRr`. Rename to "Appearance Tab" and add Typography, Background, Border sections.

- [ ] **Step 1: Rename frame and set placeholder**

```javascript
U("jPkOS",{name:"35 — Inspector: Appearance Tab", placeholder:true})
```

- [ ] **Step 2: Add Typography section**

```javascript
typHdr35=I("C5CRr",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(typHdr35+"/label",{content:"Typography"})
typBody35=I("C5CRr",{type:"frame",layout:"vertical",gap:8,padding:[4,0],width:"fill_container"})
// Font family row
fontRow35=I(typBody35,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
I(fontRow35,{type:"text",content:"Font",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
fontInput35=I(fontRow35,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",padding:[0,8],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(fontInput35,{type:"text",content:"Inter",fontSize:11,fill:"#111827"})
I(fontInput35,{type:"text",content:"▾",fontSize:10,fill:"#6B7280"})
// Weight + size, line-height, letter-spacing, align, decoration, color — same as Task 2 Steps 4-5
lhRow35=I(typBody35,{type:"ref",ref:"<InspectorSliderRow_id>",width:"fill_container"})
U(lhRow35+"/label",{content:"Line height"})
colorRow35=I(typBody35,{type:"ref",ref:"<InspectorColorRow_id>",width:"fill_container"})
U(colorRow35+"/label",{content:"Color"})
```

- [ ] **Step 3: Add Background + Border sections (collapsed)**

```javascript
bgHdr35=I("C5CRr",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(bgHdr35+"/label",{content:"Background"})
U(bgHdr35+"/chevron",{content:"▶"})
borderHdr35=I("C5CRr",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(borderHdr35+"/label",{content:"Border + Radius"})
U(borderHdr35+"/chevron",{content:"▶"})

U("jPkOS",{placeholder:false})
```

- [ ] **Step 4: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "jPkOS" })
```

Verify: frame name shows "Appearance Tab", Typography section expanded with all controls, Background + Border collapsed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "design: update frame 35 — renamed to Appearance Tab + Typography/Background/Border sections"
```

---

## Task 14 — Update Frame 42: Effects Tab (Phase 4)

**Files:** `/Users/shahg/Desktop/pencil/editer.pen`

Frame 42 (`l6Cy5`) already has shadow, blur, opacity, transition sections. Add Animation, Interactions, Visibility, AI Suggestion strip after them.

- [ ] **Step 1: Set placeholder and inspect**

```javascript
U("l6Cy5",{placeholder:true})
mcp__pencil__snapshot_layout({ filePath: "...", parentId: "uDL9I", maxDepth: 2 })
```

Note existing section IDs (fzAiK, R1v6O, kfst5, iNXH6). New sections go after iNXH6.

- [ ] **Step 2: Add Animation section after existing sections**

```javascript
animHdr42=I("uDL9I",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(animHdr42+"/label",{content:"Animation"})
animBody42=I("uDL9I",{type:"frame",layout:"vertical",gap:8,padding:[4,0],width:"fill_container"})
trigRow42=I(animBody42,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(trigRow42+"/label",{content:"Trigger"})
presetRow42=I(animBody42,{type:"frame",layout:"horizontal",alignItems:"center",gap:8,width:"fill_container",height:28})
I(presetRow42,{type:"text",content:"Preset",fontSize:11,fill:"#6B7280",textGrowth:"fixed-width",width:80})
presetInput42=I(presetRow42,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"space_between",padding:[0,8],cornerRadius:4,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},width:"fill_container",height:28})
I(presetInput42,{type:"text",content:"Fade In",fontSize:11,fill:"#111827"})
I(presetInput42,{type:"text",content:"▾",fontSize:10,fill:"#6B7280"})
durRow42=I(animBody42,{type:"ref",ref:"<InspectorSliderRow_id>",width:"fill_container"})
U(durRow42+"/label",{content:"Duration"})
dirRow42=I(animBody42,{type:"ref",ref:"<InspectorChipGroup_id>",width:"fill_container"})
U(dirRow42+"/label",{content:"Direction"})
```

- [ ] **Step 3: Add Interactions + Visibility sections**

```javascript
// Interactions (collapsed header + two sample cards)
interactHdr42=I("uDL9I",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(interactHdr42+"/label",{content:"Interactions"})
U(interactHdr42+"/chevron",{content:"▶"})

// Visibility section
visHdr42=I("uDL9I",{type:"ref",ref:"<InspectorSectionHeader_id>",width:"fill_container"})
U(visHdr42+"/label",{content:"Visibility"})
U(visHdr42+"/chevron",{content:"▶"})
```

- [ ] **Step 4: Add AI Suggestion strip at very bottom**

```javascript
// Divider
I("uDL9I",{type:"frame",width:"fill_container",height:1,fill:"#E5E7EB"})

// AI card (same as Task 7)
aiCard42=I("uDL9I",{type:"frame",layout:"vertical",gap:8,padding:10,cornerRadius:8,fill:"#EDE9FE",stroke:{fill:"#C4B5FD",thickness:1},width:"fill_container"})
aiHeader42=I(aiCard42,{type:"frame",layout:"horizontal",alignItems:"center",gap:6,width:"fill_container"})
aiDot42=I(aiHeader42,{type:"frame",width:16,height:16,cornerRadius:8,fill:{type:"gradient",gradientType:"linear",rotation:315,colors:[{color:"#6366F1",position:0},{color:"#8B5CF6",position:1}]}})
I(aiHeader42,{type:"text",content:"AI Suggestion",fontSize:11,fontWeight:"700",fill:"#6D28D9"})
I(aiCard42,{type:"text",content:"Add a hover effect to improve interactivity on this element.",fontSize:11,fill:"#4C1D95",textGrowth:"fixed-width",width:"fill_container",lineHeight:1.5})
aiActions42=I(aiCard42,{type:"frame",layout:"horizontal",gap:6,width:"fill_container"})
applyBtn42=I(aiActions42,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",padding:[5,0],cornerRadius:5,fill:"#7C3AED",width:"fill_container",height:28})
I(applyBtn42,{type:"text",content:"Apply fix",fontSize:11,fontWeight:"600",fill:"#FFFFFF"})
dismissBtn42=I(aiActions42,{type:"frame",layout:"horizontal",alignItems:"center",justifyContent:"center",padding:[5,12],cornerRadius:5,fill:"#EDE9FE",stroke:{fill:"#C4B5FD",thickness:1},height:28})
I(dismissBtn42,{type:"text",content:"Dismiss",fontSize:11,fill:"#6D28D9"})

U("l6Cy5",{placeholder:false})
```

- [ ] **Step 5: Screenshot and verify**

```
mcp__pencil__get_screenshot({ nodeId: "l6Cy5" })
```

Verify: existing shadow/blur/opacity/transition sections intact, new Animation section (trigger chips + preset + duration + direction), Interactions + Visibility collapsed, purple AI card at bottom.

- [ ] **Step 6: Final commit**

```bash
cd /Users/shahg/Desktop/test/buildrik
git add -A
git commit -m "design: update frame 42 — Effects Tab + Animation/Interactions/Visibility/AI sections"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Frame 46 (Text Selected) — Task 8
- [x] Frame 47 (Box/Container Selected) — Task 9
- [x] Frame 48 (Image Selected) — Task 10
- [x] Frame 49 (Empty State) — Task 11
- [x] Frame 50 (Typography) — Task 2
- [x] Frame 51 (Flexbox) — Task 4
- [x] Frame 52 (Grid) — Task 4
- [x] Frame 53 (Background) — Task 3
- [x] Frame 54 (Border+Radius) — Task 5
- [x] Frame 55 (Interactions) — Task 6
- [x] Frame 56 (Animation) — Task 6
- [x] Frame 57 (AI Suggestion) — Task 7
- [x] Update frame 34 (Layout Tab) — Task 12
- [x] Update frame 35 (Appearance Tab) — Task 13
- [x] Update frame 42 (Effects Tab) — Task 14
- [x] Reusable widget components — Task 1
- [x] get_screenshot verification on every frame — every task
- [x] placeholder:false before commit — every task

**Type consistency:** All widget component refs use `<InspectorInputRow_id>` etc. — executor must resolve IDs from Task 1 output before running Tasks 2–14. Widget names are stable: `InspectorInputRow`, `InspectorChipGroup`, `InspectorColorRow`, `InspectorSliderRow`, `InspectorSectionHeader`.

**Known IDs used directly (verified from batch_get):**
- Frame 34 body: `oC3sv`
- Frame 35 body: `C5CRr`
- Frame 42 inspector panel: `uDL9I`
- InspectorEmptyState component: `VBC3E`
- InputField component: `pCoGe`
- TabPill/active: `QVIwi`
- TabPill/inactive: `HG3uE`
- Frame 34 (source for copy): `nkopD`
- Frame 35 (source for copy): `jPkOS`

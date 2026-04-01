# Buildrik Wireframe Redesign + Prototype — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize 80+ wireframe frames into labeled swim lanes, apply 18 pending visual fixes, add ~37 missing-state frames, and wire prototype navigation annotations across 6 user flows.

**Architecture:** Flow-by-flow execution. Phase 0 reorganizes the canvas first. Then each flow (Canvas Edit → Publish → CMS → AI → Settings → Collaboration) is completed as fix → new frames → prototype annotations before moving to the next. Each flow produces a demoable prototype increment. Prototype "links" are represented as `note` nodes on interactive hotspots + visual arrow lines between frames within each swim lane.

**Tech Stack:** Pencil MCP tools — `batch_get`, `batch_design`, `get_screenshot`, `snapshot_layout`, `find_empty_space_on_canvas`. File: `/Users/shahg/Desktop/pencil/editer.pen`. No code changes.

**Design tokens** (use these, never hardcode):
- Primary blue: `#2563EB` | Text primary: `#111827` | Text secondary: `#374151` | Muted: `#6B7280`
- Success green: `#16A34A` | Error red: `#DC2626` | Warning amber: `#F59E0B`
- Surface: `#FFFFFF` | Border: `#E5E7EB` | Background: `#F9FAFB`

---

## Task 0: Canvas Reorganization — Create Swim Lane Labels

**Goal:** Add 8 large label frames to the canvas to define swim lanes before moving any content.

- [ ] Run `get_editor_state()` to confirm active file is `/Users/shahg/Desktop/pencil/editer.pen`

- [ ] Run `find_empty_space_on_canvas` to understand current canvas bounds and find clear space for lane labels

- [ ] Create swim lane label frames using `batch_design`. Each label is a wide, short frame with colored left border and lane title text. Place them vertically with ~1600px height per lane:

```javascript
// Lane label frames — place at left edge of canvas, stacked vertically
// Discover actual canvas Y extent first via batch_get on a few known frames,
// then place lanes below all existing content starting at Y=0 of a clean area.
// Use find_empty_space_on_canvas to pick safe starting Y.

lane0=I(document,{type:"frame",name:"LANE · Component Library",x:0,y:0,width:120,height:1500,fill:"#F0FDF4",placeholder:true})
I(lane0,{type:"text",content:"Component\nLibrary",fill:"#16A34A",fontSize:11,fontWeight:"700",x:10,y:20})

lane1=I(document,{type:"frame",name:"LANE · Flow 1 · Canvas Edit",x:0,y:1600,width:120,height:1600,fill:"#EFF6FF",placeholder:true})
I(lane1,{type:"text",content:"FLOW 1\nCanvas Edit",fill:"#2563EB",fontSize:11,fontWeight:"700",x:10,y:20})

lane2=I(document,{type:"frame",name:"LANE · Panels & Components",x:0,y:3300,width:120,height:1600,fill:"#F8FAFC",placeholder:true})
I(lane2,{type:"text",content:"PANELS &\nCOMPONENTS",fill:"#374151",fontSize:11,fontWeight:"700",x:10,y:20})

lane3=I(document,{type:"frame",name:"LANE · Flow 2 · Publish",x:0,y:5000,width:120,height:1600,fill:"#F0FDF4",placeholder:true})
I(lane3,{type:"text",content:"FLOW 2\nPublish",fill:"#16A34A",fontSize:11,fontWeight:"700",x:10,y:20})

lane4=I(document,{type:"frame",name:"LANE · Flow 3 · CMS",x:0,y:6700,width:120,height:1600,fill:"#FFFBEB",placeholder:true})
I(lane4,{type:"text",content:"FLOW 3\nCMS",fill:"#D97706",fontSize:11,fontWeight:"700",x:10,y:20})

lane5=I(document,{type:"frame",name:"LANE · Flow 4 · AI",x:0,y:8400,width:120,height:1600,fill:"#FDF4FF",placeholder:true})
I(lane5,{type:"text",content:"FLOW 4\nAI",fill:"#9333EA",fontSize:11,fontWeight:"700",x:10,y:20})

lane6=I(document,{type:"frame",name:"LANE · Flow 5 · Settings",x:0,y:10100,width:120,height:1600,fill:"#FFF7ED",placeholder:true})
I(lane6,{type:"text",content:"FLOW 5\nSettings",fill:"#EA580C",fontSize:11,fontWeight:"700",x:10,y:20})

lane7=I(document,{type:"frame",name:"LANE · Flow 6 · Collaboration",x:0,y:11800,width:120,height:1600,fill:"#F0F9FF",placeholder:true})
I(lane7,{type:"text",content:"FLOW 6\nCollab",fill:"#0284C7",fontSize:11,fontWeight:"700",x:10,y:20})

lane8=I(document,{type:"frame",name:"LANE · DEPRECATED",x:0,y:13500,width:120,height:1600,fill:"#FEF2F2",placeholder:true})
I(lane8,{type:"text",content:"DEPRECATED\nDO NOT\nIMPLEMENT",fill:"#DC2626",fontSize:11,fontWeight:"700",x:10,y:20})
```

- [ ] Remove `placeholder:true` from all 9 lane label frames:
```javascript
U(lane0,{placeholder:false})
U(lane1,{placeholder:false})
U(lane2,{placeholder:false})
U(lane3,{placeholder:false})
U(lane4,{placeholder:false})
U(lane5,{placeholder:false})
U(lane6,{placeholder:false})
U(lane7,{placeholder:false})
U(lane8,{placeholder:false})
```

- [ ] Run `get_screenshot` on the full canvas to verify lane labels are placed and visible

- [ ] Commit:
```bash
git add -p  # no file changes — this is a .pen file, commit is for tracking
git commit -m "design: canvas swim lane labels created (8 lanes)"
```

---

## Task 1: Canvas Reorganization — Move Frames to Swim Lanes

**Goal:** Reposition all existing frames into their designated swim lanes.

- [ ] Run `batch_get` on known Flow 1 frame IDs to get their current x/y positions:
```
nodeIds: ["BBjUx","ENFlg","26XuR","ebEVP","gR1na","otRcF","1qeGh"]
readDepth: 1
```

- [ ] Move Flow 1 frames into lane 1 area (y=1600–3200, x starts at 200):
```javascript
U("BBjUx",{x:200,y:1650})   // 01 Add Elements
U("ENFlg",{x:1740,y:1650})  // 02 Layers Panel
U("26XuR",{x:3280,y:1650})  // 46 Inspector: Layout
U("ebEVP",{x:4820,y:1650})  // 47 Inspector: Style
U("gR1na",{x:6360,y:1650})  // 48 Inspector: Effects
U("otRcF",{x:7900,y:1650})  // 49 Inspector: Empty State
U("1qeGh",{x:9440,y:1650})  // 26 Canvas: Selection Handles
```

- [ ] Run `batch_get` on Publish frame IDs to get current positions:
```
nodeIds: ["gXzzP","szUXT","K928D","KBELS"]
readDepth: 1
```

- [ ] Move Flow 2 (Publish) frames into lane 3 area (y=5000–6600, x starts at 200):
```javascript
U("szUXT",{x:200,y:5050})   // 31 Pre-launch Checklist
U("gXzzP",{x:1740,y:5050})  // 14 Pre-publish Warnings
U("K928D",{x:3280,y:5050})  // 32 Publishing In Progress
U("KBELS",{x:4820,y:5050})  // 13 Publish Success
```

- [ ] Run `batch_get` on CMS frame IDs:
```
nodeIds: ["11bGl","uN3tF"]
readDepth: 1
```

- [ ] Move Flow 3 (CMS) frames into lane 4 area (y=6700–8300):
```javascript
U("11bGl",{x:200,y:6750})   // 08 CMS Panel
U("uN3tF",{x:1740,y:6750})  // 44C CMS Edit Entry
```

- [ ] Run `batch_get` on AI frame IDs:
```
nodeIds: ["bNn49","zSiUu","Ql3YU"]
readDepth: 1
```

- [ ] Move Flow 4 (AI) frames into lane 5 area (y=8400–10000):
```javascript
U("bNn49",{x:200,y:8450})   // 10 AI Entry Point
U("zSiUu",{x:1740,y:8450})  // 11 AI Generating
U("Ql3YU",{x:3280,y:8450})  // 33 AI Result Edit Mode
```

- [ ] Run `batch_get` on Settings frame IDs:
```
nodeIds: ["hcxlF","VSDXS","cUVnH","LVzth"]
readDepth: 1
```

- [ ] Move Flow 5 (Settings) frames into lane 6 area (y=10100–11700):
```javascript
U("hcxlF",{x:200,y:10150})   // 22 Settings Panel
U("VSDXS",{x:1740,y:10150})  // 39 Settings Navigation
U("cUVnH",{x:3280,y:10150})  // 40 Publish Settings
U("LVzth",{x:4820,y:10150})  // 45 Settings Domain
```

- [ ] Move deprecated inspector frames into DEPRECATED lane (y=13500–15100):
```javascript
U("5qjkQ",{x:200,y:13550})   // 03 Inspector (old)
U("niyiH",{x:1740,y:13550})  // 20 Inspector (old)
U("Mk1L2",{x:3280,y:13550})  // 23 Inspector Image (old)
U("YBoj8",{x:4820,y:13550})  // 24 Inspector Box (old)
U("nkopD",{x:6360,y:13550})  // 34 Inspector (old)
U("jPkOS",{x:7900,y:13550})  // 35 Inspector (old)
U("l6Cy5",{x:9440,y:13550})  // 42 Inspector (old)
```

- [ ] Add DEPRECATED annotation note to each deprecated frame:
```javascript
dep1=I(document,{type:"note",x:200,y:13520,width:280,height:24,content:"DEPRECATED — See Frames 46–49",fill:"#DC2626",fontSize:10,fontWeight:"700"})
dep2=I(document,{type:"note",x:1740,y:13520,width:280,height:24,content:"DEPRECATED — See Frames 46–49",fill:"#DC2626",fontSize:10,fontWeight:"700"})
dep3=I(document,{type:"note",x:3280,y:13520,width:280,height:24,content:"DEPRECATED — See Frames 46–49",fill:"#DC2626",fontSize:10,fontWeight:"700"})
dep4=I(document,{type:"note",x:4820,y:13520,width:280,height:24,content:"DEPRECATED — See Frames 46–49",fill:"#DC2626",fontSize:10,fontWeight:"700"})
dep5=I(document,{type:"note",x:6360,y:13520,width:280,height:24,content:"DEPRECATED — See Frames 46–49",fill:"#DC2626",fontSize:10,fontWeight:"700"})
dep6=I(document,{type:"note",x:7900,y:13520,width:280,height:24,content:"DEPRECATED — See Frames 46–49",fill:"#DC2626",fontSize:10,fontWeight:"700"})
dep7=I(document,{type:"note",x:9440,y:13520,width:280,height:24,content:"DEPRECATED — See Frames 46–49",fill:"#DC2626",fontSize:10,fontWeight:"700"})
```

- [ ] All remaining frames (panels, templates, media, history, pages, layers, design system, sections 50–57, breakpoints, mobile gate, components) move to PANELS & COMPONENTS lane (y=3300–4900). Run `batch_get` with pattern `"frame"` to list remaining frame IDs not yet moved, then update their y coordinates to 3350–4850 range.

- [ ] Run `get_screenshot` on full canvas to verify swim lane layout

- [ ] Commit:
```bash
git commit -m "design: canvas reorganization — 8 swim lanes, frames sorted by flow"
```

---

## Task 2: Flow 1 Fixes — Inspector Empty State + Section Chips

**Goal:** Fix frame 49 (grey inspector tabs), frame 50 (align chips), frames 51/52 (control labels).

- [ ] Read frame 49 inspector tab nodes:
```
batch_get nodeIds: ["otRcF"], readDepth: 4
```

- [ ] Find the tab pill nodes inside `otRcF`. Update them to use `HG3uE` (TabPill/inactive) refs and muted fill. The tabs should show Layout / Style / Effects greyed out at `#9CA3AF`:
```javascript
// Replace active tab refs with inactive ones, set opacity to convey disabled state
// Find actual tab node IDs from batch_get result, then:
U("<layout-tab-id>",{fill:"#9CA3AF",opacity:0.5})
U("<style-tab-id>",{fill:"#9CA3AF",opacity:0.5})
U("<effects-tab-id>",{fill:"#9CA3AF",opacity:0.5})
// Ensure "Select an element to inspect" text is visible and centered
```

- [ ] Run `get_screenshot` on `otRcF` to verify greyed tabs

- [ ] Read frame 50 (Typography section) to find align chip group:
```
batch_get nodeIds: ["EczLD"], readDepth: 4
```

- [ ] Update the align chip group in `EczLD` to show 4 alignment chips:
```javascript
// Find the chip group node from batch_get result (look for a frame with 2 children labeled "A" "B")
// Update each chip text to alignment labels:
U("<chip1-text-id>",{content:"L"})
U("<chip2-text-id>",{content:"C"})
// If only 2 chips exist, insert 2 more:
chip3=I("<chip-group-id>",{type:"ref",ref:"HG3uE"})  // TabPill/inactive as chip
U(chip3+"/<text-descendant>",{content:"R"})
chip4=I("<chip-group-id>",{type:"ref",ref:"HG3uE"})
U(chip4+"/<text-descendant>",{content:"J"})
```

- [ ] Run `get_screenshot` on `EczLD` to verify 4 align chips visible

- [ ] Read frames 51 (Flexbox) and 52 (Grid):
```
batch_get nodeIds: ["yzZi1","VasUA"], readDepth: 4
```

- [ ] Fix frame 51 (Flexbox) chip labels — find each "A B" chip group and update:
```javascript
// Direction chips → Row / Col / Row-R / Col-R
// Wrap chips → No Wrap / Wrap
// Justify chips → Start / Center / End / Between / Around
// Align chips → Start / Center / End / Stretch
// Use U() on each chip's text node with the discovered IDs
```

- [ ] Fix frame 52 (Grid) input placeholders:
```javascript
// Columns input placeholder → "1fr 1fr 1fr"
// Rows input placeholder → "auto auto"
// Col gap → "16"  Row gap → "16"
// Auto flow chips → Row / Column / Dense
```

- [ ] Run `get_screenshot` on `yzZi1` and `VasUA` to verify

- [ ] Fix frame 26 (`1qeGh`) — add inspector tab header. Read frame first:
```
batch_get nodeIds: ["1qeGh"], readDepth: 3
```

- [ ] Insert 3-tab row into the inspector panel inside `1qeGh`:
```javascript
// Find inspector panel node ID from batch_get
// Insert tab row matching format in frame 46 (26XuR)
// Read 26XuR tab row first to copy exact structure:
batch_get nodeIds: ["26XuR"], readDepth: 3
// Then copy tab row from 26XuR into inspector panel of 1qeGh
```

- [ ] Run `get_screenshot` on `1qeGh` to verify tab header visible

- [ ] Commit:
```bash
git commit -m "design: flow1 fixes — inspector empty state tabs greyed, section 50/51/52 chips updated, frame 26 tab header added"
```

---

## Task 3: Flow 1 — New Canvas Edit Frames

**Goal:** Create 6 new frames for missing canvas interaction states. Create ContextMenu reusable component.

- [ ] Run `find_empty_space_on_canvas` to locate free space at y≈1650 beyond existing Flow 1 frames (starting at x≈11000)

- [ ] Create `ContextMenu` reusable component first (will be used in the Context Menu frame):
```javascript
ctxMenu=I(document,{type:"frame",name:"ContextMenu",reusable:true,x:150,y:100,width:200,height:248,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"vertical",padding:[4,0],placeholder:true,
  effect:{type:"shadow",offset:{x:0,y:4},blur:12,color:"#0000001A"}})
// Insert 10 menu items
items=["Cut","Copy","Paste","Duplicate","Delete","—","Group","Lock","Hide","Bring Forward","Send Back"]
// For each item:
item1=I(ctxMenu,{type:"frame",width:"fill_container",height:28,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(item1,{type:"text",content:"Cut",fill:"#111827",fontSize:13,width:"fill_container",textGrowth:"fixed-width"})
I(item1,{type:"text",content:"⌘X",fill:"#9CA3AF",fontSize:12})
// ... repeat for each item, divider is a rectangle fill:#E5E7EB height:1
U(ctxMenu,{placeholder:false})
```

- [ ] Create **F1-NEW-01: Canvas: Multi-select** (copy from existing canvas frame `1qeGh`, modify):
```javascript
ms=C("1qeGh",document,{name:"F1-NEW-01 · Canvas: Multi-select",x:11000,y:1650,placeholder:true})
// Update selection box to span 3 elements (blue dashed bounding box)
// Update inspector to show "3 elements" + shared properties
// Find inspector header text node in copy and update:
U(ms+"/<inspector-title-id>",{content:"3 Elements"})
// Add a note annotation:
I(document,{type:"note",x:11000,y:1620,width:320,height:20,content:"Multi-select: Shift+click or drag-select multiple elements"})
U(ms,{placeholder:false})
```

- [ ] Create **F1-NEW-02: Canvas: Inline Text Edit**:
```javascript
te=C("1qeGh",document,{name:"F1-NEW-02 · Canvas: Inline Text Edit",x:12540,y:1650,placeholder:true})
// Add text cursor indicator (thin blue rect) inside text element on canvas
cursor=I(document,{type:"rectangle",x:12820,y:1820,width:2,height:18,fill:"#2563EB"})
// Add text toolbar bar above element (Bold/Italic/Underline/Font size/Color)
toolbar=I(document,{type:"frame",name:"text-toolbar",x:12650,y:1790,width:260,height:32,fill:"#1F2937",cornerRadius:6,layout:"horizontal",padding:[0,8],gap:4,alignItems:"center"})
I(toolbar,{type:"text",content:"B",fill:"#FFFFFF",fontSize:13,fontWeight:"700"})
I(toolbar,{type:"text",content:"I",fill:"#9CA3AF",fontSize:13,fontStyle:"italic"})
I(toolbar,{type:"text",content:"U",fill:"#9CA3AF",fontSize:13})
I(toolbar,{type:"rectangle",width:1,height:16,fill:"#374151"})
I(toolbar,{type:"text",content:"16",fill:"#FFFFFF",fontSize:13})
I(toolbar,{type:"rectangle",width:1,height:16,fill:"#374151"})
I(toolbar,{type:"rectangle",width:16,height:16,fill:"#EF4444",cornerRadius:2})
I(document,{type:"note",x:12540,y:1620,width:320,height:20,content:"Inline text edit: double-click text element on canvas"})
U(te,{placeholder:false})
```

- [ ] Create **F1-NEW-03: Canvas: Drag in Progress**:
```javascript
drag=C("1qeGh",document,{name:"F1-NEW-03 · Canvas: Drag in Progress",x:14080,y:1650,placeholder:true})
// Add ghost/shadow of element being dragged (semi-transparent copy)
ghost=I(document,{type:"rectangle",x:14380,y:1900,width:200,height:120,fill:"#2563EB",opacity:0.2,cornerRadius:4})
// Add snap guide lines (blue lines)
snapH=I(document,{type:"line",x:14200,y:1960,width:400,height:0,stroke:{fill:"#2563EB",thickness:1,dashPattern:[4,4]}})
snapV=I(document,{type:"line",x:14500,y:1750,width:0,height:400,stroke:{fill:"#2563EB",thickness:1,dashPattern:[4,4]}})
I(document,{type:"note",x:14080,y:1620,width:320,height:20,content:"Drag: click+hold element and move. Blue guides show alignment snapping."})
U(drag,{placeholder:false})
```

- [ ] Create **F1-NEW-04: Canvas: Context Menu** (uses ContextMenu component):
```javascript
ctx=C("1qeGh",document,{name:"F1-NEW-04 · Canvas: Context Menu",x:15620,y:1650,placeholder:true})
// Place ContextMenu instance over a right-clicked element position
ctxInst=I(document,{type:"ref",ref:"<ContextMenu-id>",x:15850,y:1820})
I(document,{type:"note",x:15620,y:1620,width:320,height:20,content:"Context menu: right-click any element on canvas"})
U(ctx,{placeholder:false})
```

- [ ] Create **F1-NEW-05: Canvas: Element Hover**:
```javascript
hov=C("1qeGh",document,{name:"F1-NEW-05 · Canvas: Element Hover",x:17160,y:1650,placeholder:true})
// Add blue outline rectangle over a canvas element (hover state)
hoverOutline=I(document,{type:"rectangle",x:17360,y:1850,width:200,height:120,fill:"transparent",stroke:{fill:"#2563EB",thickness:1},cornerRadius:0})
// Add element label badge (top-left of hovered element)
badge=I(document,{type:"frame",x:17360,y:1836,width:60,height:14,fill:"#2563EB",cornerRadius:2})
I(badge,{type:"text",content:"div",fill:"#FFFFFF",fontSize:10})
I(document,{type:"note",x:17160,y:1620,width:320,height:20,content:"Hover: mouse over element shows blue outline + element type label"})
U(hov,{placeholder:false})
```

- [ ] Create **F1-NEW-06: Command Palette** (Ctrl+K):
```javascript
cp=I(document,{name:"F1-NEW-06 · Command Palette",type:"frame",x:18700,y:1650,width:1440,height:900,fill:"#11182780",placeholder:true})
// Modal overlay
modal=I(cp,{type:"frame",x:420,y:200,width:600,height:420,fill:"#FFFFFF",cornerRadius:8,layout:"vertical",
  effect:{type:"shadow",offset:{x:0,y:20},blur:40,color:"#00000033"}})
// Search input
searchBar=I(modal,{type:"frame",width:"fill_container",height:52,layout:"horizontal",padding:[0,16],alignItems:"center",gap:12,
  stroke:{align:"outside",thickness:1,fill:"#E5E7EB"}})
I(searchBar,{type:"icon_font",iconFontName:"search",iconFontFamily:"lucide",width:16,height:16,fill:"#6B7280"})
I(searchBar,{type:"text",content:"Search commands...",fill:"#9CA3AF",fontSize:15})
I(searchBar,{type:"text",content:"ESC",fill:"#9CA3AF",fontSize:11,textGrowth:"auto"})
// Divider
I(modal,{type:"rectangle",width:"fill_container",height:1,fill:"#E5E7EB"})
// Results list
results=I(modal,{type:"frame",width:"fill_container",height:"fill_container",layout:"vertical",padding:8,gap:2})
cmds=[["Undo","⌘Z"],["Redo","⌘⇧Z"],["Duplicate element","⌘D"],["Group selection","⌘G"],["Preview","⌘⇧P"],["Publish","⌘⇧↵"]]
// For each cmd, create a result row:
row1=I(results,{type:"frame",width:"fill_container",height:36,layout:"horizontal",padding:[0,8],alignItems:"center",cornerRadius:4,fill:"#EFF6FF"})
I(row1,{type:"text",content:"Undo",fill:"#111827",fontSize:13,width:"fill_container",textGrowth:"fixed-width"})
I(row1,{type:"text",content:"⌘Z",fill:"#6B7280",fontSize:12})
// Repeat for other rows with fill:"transparent"
row2=I(results,{type:"frame",width:"fill_container",height:36,layout:"horizontal",padding:[0,8],alignItems:"center",cornerRadius:4,fill:"transparent"})
I(row2,{type:"text",content:"Redo",fill:"#111827",fontSize:13,width:"fill_container",textGrowth:"fixed-width"})
I(row2,{type:"text",content:"⌘⇧Z",fill:"#6B7280",fontSize:12})
row3=I(results,{type:"frame",width:"fill_container",height:36,layout:"horizontal",padding:[0,8],alignItems:"center",cornerRadius:4,fill:"transparent"})
I(row3,{type:"text",content:"Duplicate element",fill:"#111827",fontSize:13,width:"fill_container",textGrowth:"fixed-width"})
I(row3,{type:"text",content:"⌘D",fill:"#6B7280",fontSize:12})
row4=I(results,{type:"frame",width:"fill_container",height:36,layout:"horizontal",padding:[0,8],alignItems:"center",cornerRadius:4,fill:"transparent"})
I(row4,{type:"text",content:"Group selection",fill:"#111827",fontSize:13,width:"fill_container",textGrowth:"fixed-width"})
I(row4,{type:"text",content:"⌘G",fill:"#6B7280",fontSize:12})
I(document,{type:"note",x:18700,y:1620,width:320,height:20,content:"Command Palette: ⌘K from anywhere in the editor"})
U(cp,{placeholder:false})
```

- [ ] Run `get_screenshot` on the Flow 1 lane area to verify all 6 new frames look correct

- [ ] Commit:
```bash
git commit -m "design: flow1 new frames — multi-select, inline text edit, drag, context menu, hover, command palette"
```

---

## Task 4: Flow 1 — Prototype Annotations

**Goal:** Add navigation note annotations to every interactive hotspot in Flow 1.

- [ ] Add prototype notes to frame `BBjUx` (01 Add Elements):
```javascript
I(document,{type:"note",x:200,y:2400,width:380,height:18,content:"→ Click element in sidebar → navigates to: 26 · Selection Handles"})
```

- [ ] Add prototype notes to frame `1qeGh` (26 Selection Handles):
```javascript
I(document,{type:"note",x:9440,y:2400,width:380,height:18,content:"→ Click Inspector icon in rail → 46 · Inspector Layout"})
I(document,{type:"note",x:9440,y:2422,width:380,height:18,content:"→ Right-click element → F1-NEW-04 · Context Menu"})
I(document,{type:"note",x:9440,y:2444,width:380,height:18,content:"→ Double-click text → F1-NEW-02 · Inline Text Edit"})
I(document,{type:"note",x:9440,y:2466,width:380,height:18,content:"→ Drag element → F1-NEW-03 · Drag in Progress"})
I(document,{type:"note",x:9440,y:2488,width:380,height:18,content:"→ Hover element → F1-NEW-05 · Element Hover"})
I(document,{type:"note",x:9440,y:2510,width:380,height:18,content:"→ ⌘K → F1-NEW-06 · Command Palette"})
```

- [ ] Add prototype notes to Inspector frames (`26XuR`, `ebEVP`, `gR1na`, `otRcF`):
```javascript
I(document,{type:"note",x:3280,y:2400,width:380,height:18,content:"→ Style tab → 47 · Inspector Style | → Effects tab → 48 · Inspector Effects"})
I(document,{type:"note",x:4820,y:2400,width:380,height:18,content:"→ Effects tab → 48 · Inspector Effects | → Layout tab → 46 · Inspector Layout"})
I(document,{type:"note",x:6360,y:2400,width:380,height:18,content:"→ Click outside / Deselect → 49 · Inspector Empty State"})
I(document,{type:"note",x:7900,y:2400,width:380,height:18,content:"→ Click element on canvas → 46 · Inspector Layout"})
```

- [ ] Add flow arrow lines between frames to show navigation direction:
```javascript
// Arrow from 01 → 26
I(document,{type:"line",x:1580,y:1950,width:160,height:0,stroke:{fill:"#2563EB",thickness:2}})
// Arrow from 26 → 46
I(document,{type:"line",x:10820,y:1950,width:160,height:0,stroke:{fill:"#2563EB",thickness:2}})
// Arrow from 46 → 47 → 48 → 49
I(document,{type:"line",x:4660,y:1950,width:160,height:0,stroke:{fill:"#2563EB",thickness:2}})
I(document,{type:"line",x:6200,y:1950,width:160,height:0,stroke:{fill:"#2563EB",thickness:2}})
I(document,{type:"line",x:7740,y:1950,width:160,height:0,stroke:{fill:"#2563EB",thickness:2}})
```

- [ ] Commit:
```bash
git commit -m "design: flow1 prototype annotations — navigation notes and flow arrows added"
```

---

## Task 5: Flow 2 — Publish Fixes

**Goal:** Fix B-02 (publish success split), B-03 (export label), Task 12 (duplicate "31"), Task 14 (modal rename).

- [ ] Read `KBELS` (13 — Publish Success) to understand current structure:
```
batch_get nodeIds: ["KBELS"], readDepth: 4
```

- [ ] The existing `KBELS` frame becomes **13A — Publish Success (Editor View)**. Update its name and add a success toast overlay:
```javascript
U("KBELS",{name:"13A · Publish Success — Editor View"})
// Find the existing notification card in KBELS and update it to be a proper toast
// Add "View Site →" button to the notification card
```

- [ ] Create **13B — Publish Success (Live Preview)** as a new frame next to 13A:
```javascript
livePreview=I(document,{name:"13B · Publish Success — Live Site Preview",type:"frame",x:6360,y:5050,width:1440,height:900,fill:"#F9FAFB",placeholder:true})
// Browser chrome at top (URL bar showing "https://mysite.buildrik.app")
browserChrome=I(livePreview,{type:"frame",width:"fill_container",height:48,fill:"#FFFFFF",layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",stroke:{align:"outside",thickness:1,fill:"#E5E7EB"}})
I(browserChrome,{type:"rectangle",width:12,height:12,fill:"#EF4444",cornerRadius:6})
I(browserChrome,{type:"rectangle",width:12,height:12,fill:"#F59E0B",cornerRadius:6})
I(browserChrome,{type:"rectangle",width:12,height:12,fill:"#22C55E",cornerRadius:6})
urlBar=I(browserChrome,{type:"frame",width:"fill_container",height:28,fill:"#F3F4F6",cornerRadius:4,layout:"horizontal",padding:[0,10],alignItems:"center",gap:6})
I(urlBar,{type:"icon_font",iconFontName:"lock",iconFontFamily:"lucide",width:12,height:12,fill:"#22C55E"})
I(urlBar,{type:"text",content:"https://mysite.buildrik.app",fill:"#374151",fontSize:12})
// Page content area (grey placeholder representing live site)
pageContent=I(livePreview,{type:"frame",width:"fill_container",height:"fill_container",fill:"#FFFFFF",layout:"vertical"})
G(pageContent,"ai","clean modern website hero section landing page")
// "← Back to Editor" button overlay
backBtn=I(livePreview,{type:"frame",layoutPosition:"absolute",x:20,y:60,width:160,height:36,fill:"#1F2937",cornerRadius:6,layout:"horizontal",padding:[0,12],gap:6,alignItems:"center"})
I(backBtn,{type:"icon_font",iconFontName:"arrow-left",iconFontFamily:"lucide",width:14,height:14,fill:"#FFFFFF"})
I(backBtn,{type:"text",content:"Back to Editor",fill:"#FFFFFF",fontSize:13})
U(livePreview,{placeholder:false})
```

- [ ] Fix `K928D` (32 — Publishing In Progress) — rename modal title from "Export Project" to "Publishing...":
```javascript
batch_get nodeIds: ["K928D"], readDepth: 4
// Find modal title text node and update:
U("<modal-title-node-id>",{content:"Publishing..."})
```

- [ ] Rename `Fmw5T` frame to resolve duplicate "31" numbering:
```javascript
U("Fmw5T",{name:"31A · Design System: Colors (Detail)"})
```

- [ ] Rename `gXzzP` (currently "Publish Error Modal") to match content:
```javascript
U("gXzzP",{name:"14 · Pre-publish Warnings Modal"})
```

- [ ] Create **Toast/success** reusable component:
```javascript
toastOK=I(document,{type:"frame",name:"Toast/success",reusable:true,x:150,y:400,width:320,height:52,fill:"#F0FDF4",stroke:{fill:"#BBF7D0",thickness:1},cornerRadius:8,layout:"horizontal",padding:[0,16],gap:12,alignItems:"center",placeholder:true,
  effect:{type:"shadow",offset:{x:0,y:4},blur:12,color:"#0000001A"}})
I(toastOK,{type:"icon_font",iconFontName:"circle-check",iconFontFamily:"lucide",width:18,height:18,fill:"#16A34A"})
I(toastOK,{type:"text",content:"Your site is live",fill:"#166534",fontSize:14,fontWeight:"500",width:"fill_container",textGrowth:"fixed-width"})
I(toastOK,{type:"icon_font",iconFontName:"x",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
U(toastOK,{placeholder:false})
```

- [ ] Create **Toast/error** reusable component:
```javascript
toastErr=I(document,{type:"frame",name:"Toast/error",reusable:true,x:150,y:462,width:320,height:52,fill:"#FEF2F2",stroke:{fill:"#FECACA",thickness:1},cornerRadius:8,layout:"horizontal",padding:[0,16],gap:12,alignItems:"center",placeholder:true,
  effect:{type:"shadow",offset:{x:0,y:4},blur:12,color:"#0000001A"}})
I(toastErr,{type:"icon_font",iconFontName:"circle-x",iconFontFamily:"lucide",width:18,height:18,fill:"#DC2626"})
I(toastErr,{type:"text",content:"Publish failed. Try again.",fill:"#991B1B",fontSize:14,fontWeight:"500",width:"fill_container",textGrowth:"fixed-width"})
I(toastErr,{type:"icon_font",iconFontName:"x",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
U(toastErr,{placeholder:false})
```

- [ ] Create **Modal/base** reusable component:
```javascript
modalBase=I(document,{type:"frame",name:"Modal/base",reusable:true,x:150,y:524,width:480,height:320,fill:"#FFFFFF",cornerRadius:12,layout:"vertical",placeholder:true,
  effect:{type:"shadow",offset:{x:0,y:20},blur:40,color:"#00000026"}})
modalHeader=I(modalBase,{type:"frame",width:"fill_container",height:56,layout:"horizontal",padding:[0,24],alignItems:"center"})
I(modalHeader,{type:"text",content:"Modal Title",fill:"#111827",fontSize:16,fontWeight:"600",width:"fill_container",textGrowth:"fixed-width"})
I(modalHeader,{type:"icon_font",iconFontName:"x",iconFontFamily:"lucide",width:20,height:20,fill:"#6B7280"})
I(modalBase,{type:"rectangle",width:"fill_container",height:1,fill:"#E5E7EB"})
contentSlot=I(modalBase,{type:"frame",width:"fill_container",height:"fill_container",layout:"vertical",padding:24,slot:[]})
I(contentSlot,{type:"text",content:"Modal content goes here",fill:"#6B7280",fontSize:14})
I(modalBase,{type:"rectangle",width:"fill_container",height:1,fill:"#E5E7EB"})
modalFooter=I(modalBase,{type:"frame",width:"fill_container",height:64,layout:"horizontal",padding:[0,24],gap:12,alignItems:"center",justifyContent:"end"})
I(modalFooter,{type:"ref",ref:"FZ9zY"})  // GhostBtn
I(modalFooter,{type:"ref",ref:"P1prB"})  // PrimaryBtn
U(modalBase,{placeholder:false})
```

- [ ] Create **ProgressBar** reusable component:
```javascript
progBar=I(document,{type:"frame",name:"ProgressBar",reusable:true,x:150,y:854,width:320,height:8,fill:"#E5E7EB",cornerRadius:4,placeholder:true})
I(progBar,{type:"frame",width:"60%",height:"fill_container",fill:"#2563EB",cornerRadius:4})
U(progBar,{placeholder:false})
```

- [ ] Run `get_screenshot` on the Flow 2 lane to verify fixes and new components

- [ ] Commit:
```bash
git commit -m "design: flow2 fixes — publish success split 13A/13B, modal title fixed, frame 31A rename; Toast/success, Toast/error, Modal/base, ProgressBar components added"
```

---

## Task 6: Flow 2 — New Publish Frames + Prototype Annotations

**Goal:** Create Publish Error, Domain Conflict, Export Modal frames and wire all Flow 2 prototype notes.

- [ ] Create **F2-NEW-01: Publish Error State**:
```javascript
pubErr=I(document,{name:"F2-NEW-01 · Publish: Error State",type:"frame",x:7900,y:5050,width:1440,height:900,fill:"#F9FAFB",placeholder:true})
// Copy structure from K928D (Publishing In Progress) as base
// Add red error state to the modal
errModal=I(pubErr,{type:"ref",ref:"<Modal/base-id>",layoutPosition:"absolute",x:480,y:300})
U(errModal+"/<Modal/base-title-id>",{content:"Publish Failed"})
// Error detail in content area
errContent=I(document,{type:"frame",x:480+24,y:300+57,width:432,height:120,layout:"vertical",gap:12})
I(errContent,{type:"text",content:"Could not connect to hosting service",fill:"#991B1B",fontSize:14,textGrowth:"fixed-width",width:"fill_container"})
I(errContent,{type:"text",content:"Error code: ECONNREFUSED · Check your network and try again.",fill:"#6B7280",fontSize:13,textGrowth:"fixed-width",width:"fill_container"})
retryBtn=I(document,{type:"ref",ref:"P1prB",layoutPosition:"absolute",x:852,y:540})
U(retryBtn,{descendants:{"<PrimaryBtn-label-id>":{content:"Retry"}}})
I(document,{type:"note",x:7900,y:5020,width:380,height:18,content:"Publish Error: shown when deploy fails. Retry → 32 · Publishing In Progress"})
U(pubErr,{placeholder:false})
```

- [ ] Create **F2-NEW-02: Publish Domain Conflict**:
```javascript
domConf=I(document,{name:"F2-NEW-02 · Publish: Domain Conflict",type:"frame",x:9440,y:5050,width:1440,height:900,fill:"#F9FAFB",placeholder:true})
// Amber warning modal
warnModal=I(domConf,{type:"frame",layoutPosition:"absolute",x:480,y:300,width:480,height:220,fill:"#FFFFFF",cornerRadius:12,layout:"vertical",padding:24,gap:16,
  effect:{type:"shadow",offset:{x:0,y:20},blur:40,color:"#00000026"}})
warnHeader=I(warnModal,{type:"frame",width:"fill_container",height:28,layout:"horizontal",gap:10,alignItems:"center"})
I(warnHeader,{type:"icon_font",iconFontName:"triangle-alert",iconFontFamily:"lucide",width:20,height:20,fill:"#F59E0B"})
I(warnHeader,{type:"text",content:"Domain Already Taken",fill:"#111827",fontSize:16,fontWeight:"600"})
I(warnModal,{type:"text",content:"mysite.buildrik.app is already in use by another project.",fill:"#6B7280",fontSize:14,textGrowth:"fixed-width",width:"fill_container"})
warnBtns=I(warnModal,{type:"frame",width:"fill_container",height:36,layout:"horizontal",gap:12,justifyContent:"end"})
I(warnBtns,{type:"ref",ref:"FZ9zY"})
I(warnBtns,{type:"ref",ref:"P1prB"})
U(domConf,{placeholder:false})
```

- [ ] Create **F2-NEW-03: Export Modal**:
```javascript
expModal=I(document,{name:"F2-NEW-03 · Export Modal",type:"frame",x:10980,y:5050,width:1440,height:900,fill:"#F9FAFB",placeholder:true})
expContainer=I(expModal,{type:"frame",layoutPosition:"absolute",x:480,y:220,width:480,height:380,fill:"#FFFFFF",cornerRadius:12,layout:"vertical",
  effect:{type:"shadow",offset:{x:0,y:20},blur:40,color:"#00000026"}})
expHead=I(expContainer,{type:"frame",width:"fill_container",height:56,layout:"horizontal",padding:[0,24],alignItems:"center"})
I(expHead,{type:"text",content:"Export Project",fill:"#111827",fontSize:16,fontWeight:"600",width:"fill_container",textGrowth:"fixed-width"})
I(expHead,{type:"icon_font",iconFontName:"x",iconFontFamily:"lucide",width:20,height:20,fill:"#6B7280"})
I(expContainer,{type:"rectangle",width:"fill_container",height:1,fill:"#E5E7EB"})
expBody=I(expContainer,{type:"frame",width:"fill_container",layout:"vertical",padding:24,gap:12})
I(expBody,{type:"text",content:"Choose export format",fill:"#374151",fontSize:13,fontWeight:"500"})
formats=[["HTML / CSS","Clean code output, no dependencies"],["ZIP Archive","All assets bundled"],["React Components","JSX + Tailwind"],["JSON Schema","Design tokens + structure"]]
// For each format, a selectable row:
fmt1=I(expBody,{type:"frame",width:"fill_container",height:48,layout:"horizontal",padding:[0,16],gap:12,alignItems:"center",cornerRadius:6,fill:"#EFF6FF",stroke:{fill:"#BFDBFE",thickness:1}})
I(fmt1,{type:"icon_font",iconFontName:"file-code",iconFontFamily:"lucide",width:16,height:16,fill:"#2563EB"})
fmtText1=I(fmt1,{type:"frame",width:"fill_container",layout:"vertical",gap:2})
I(fmtText1,{type:"text",content:"HTML / CSS",fill:"#111827",fontSize:13,fontWeight:"500"})
I(fmtText1,{type:"text",content:"Clean code output, no dependencies",fill:"#6B7280",fontSize:12})
I(fmt1,{type:"icon_font",iconFontName:"circle-check",iconFontFamily:"lucide",width:16,height:16,fill:"#2563EB"})
fmt2=I(expBody,{type:"frame",width:"fill_container",height:48,layout:"horizontal",padding:[0,16],gap:12,alignItems:"center",cornerRadius:6,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1}})
I(fmt2,{type:"icon_font",iconFontName:"archive",iconFontFamily:"lucide",width:16,height:16,fill:"#6B7280"})
fmtText2=I(fmt2,{type:"frame",width:"fill_container",layout:"vertical",gap:2})
I(fmtText2,{type:"text",content:"ZIP Archive",fill:"#111827",fontSize:13,fontWeight:"500"})
I(fmtText2,{type:"text",content:"All assets bundled",fill:"#6B7280",fontSize:12})
expFooter=I(expContainer,{type:"frame",width:"fill_container",height:64,layout:"horizontal",padding:[0,24],gap:12,alignItems:"center",justifyContent:"end"})
I(expFooter,{type:"ref",ref:"FZ9zY"})
I(expFooter,{type:"ref",ref:"P1prB"})
U(expModal,{placeholder:false})
```

- [ ] Add Flow 2 prototype annotations:
```javascript
// On szUXT (31 Pre-launch Checklist)
I(document,{type:"note",x:200,y:5830,width:380,height:18,content:"→ Fix Issues → 14 · Pre-publish Warnings | → Publish Now → 32 · Publishing In Progress"})
// On K928D (32 Publishing)
I(document,{type:"note",x:3280,y:5830,width:380,height:18,content:"→ Success → 13A · Publish Success | → Fail → F2-NEW-01 · Publish Error"})
// On KBELS/13A
I(document,{type:"note",x:4820,y:5830,width:380,height:18,content:"→ View Site → 13B · Live Site Preview"})
// On F2-NEW-01 (Publish Error)
I(document,{type:"note",x:7900,y:5830,width:380,height:18,content:"→ Retry → 32 · Publishing In Progress"})
// TopBar note (on first frame in lane)
I(document,{type:"note",x:200,y:5812,width:380,height:18,content:"Entry: TopBar Publish button → this frame"})
```

- [ ] Add flow arrows:
```javascript
I(document,{type:"line",x:1580,y:5450,width:160,height:0,stroke:{fill:"#16A34A",thickness:2}})
I(document,{type:"line",x:3120,y:5450,width:160,height:0,stroke:{fill:"#16A34A",thickness:2}})
I(document,{type:"line",x:4660,y:5450,width:160,height:0,stroke:{fill:"#16A34A",thickness:2}})
I(document,{type:"line",x:6200,y:5450,width:160,height:0,stroke:{fill:"#16A34A",thickness:2}})
```

- [ ] Run `get_screenshot` on Flow 2 lane

- [ ] Commit:
```bash
git commit -m "design: flow2 complete — publish error, domain conflict, export modal frames + prototype annotations"
```

---

## Task 7: Flow 3 — CMS Fixes + New Frames

**Goal:** Fix B-05 (missing CMS fields), B-06 (entry overflow), add 5 new CMS frames. Create CMSFieldRow, BindingChip, Toast/warning components.

- [ ] Read `uN3tF` (44C — CMS Edit Entry) to find existing field structure:
```
batch_get nodeIds: ["uN3tF"], readDepth: 4
```

- [ ] Add missing CMS fields to `uN3tF` between Title and Body:
```javascript
// Find the form container inside uN3tF from batch_get result
// After Title field, insert in order: Featured Image, URL Slug, Published Date, Author

// Featured Image upload field
imgField=I("<form-container-id>",{type:"frame",width:"fill_container",height:80,layout:"vertical",gap:6})
I(imgField,{type:"text",content:"Featured Image",fill:"#374151",fontSize:13,fontWeight:"500"})
imgUpload=I(imgField,{type:"frame",width:"fill_container",height:52,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1,dashPattern:[4,4]},cornerRadius:6,layout:"horizontal",alignItems:"center",justifyContent:"center",gap:8})
I(imgUpload,{type:"icon_font",iconFontName:"image",iconFontFamily:"lucide",width:16,height:16,fill:"#9CA3AF"})
I(imgUpload,{type:"text",content:"Upload image or drag & drop",fill:"#6B7280",fontSize:13})

// URL Slug field
slugField=I("<form-container-id>",{type:"frame",width:"fill_container",height:60,layout:"vertical",gap:6})
I(slugField,{type:"text",content:"URL Slug",fill:"#374151",fontSize:13,fontWeight:"500"})
slugInput=I(slugField,{type:"frame",width:"fill_container",height:36,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,12],alignItems:"center",gap:4})
I(slugInput,{type:"text",content:"/blog/",fill:"#9CA3AF",fontSize:13})
I(slugInput,{type:"text",content:"getting-started-with-buildrik",fill:"#111827",fontSize:13})

// Published Date
dateField=I("<form-container-id>",{type:"frame",width:"fill_container",height:60,layout:"vertical",gap:6})
I(dateField,{type:"text",content:"Published Date",fill:"#374151",fontSize:13,fontWeight:"500"})
dateInput=I(dateField,{type:"frame",width:"fill_container",height:36,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,12],alignItems:"center",justifyContent:"space_between"})
I(dateInput,{type:"text",content:"Mar 29, 2026",fill:"#111827",fontSize:13})
I(dateInput,{type:"icon_font",iconFontName:"calendar",iconFontFamily:"lucide",width:16,height:16,fill:"#6B7280"})

// Author field
authorField=I("<form-container-id>",{type:"frame",width:"fill_container",height:60,layout:"vertical",gap:6})
I(authorField,{type:"text",content:"Author",fill:"#374151",fontSize:13,fontWeight:"500"})
authorInput=I(authorField,{type:"frame",width:"fill_container",height:36,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,12],alignItems:"center",justifyContent:"space_between"})
I(authorInput,{type:"text",content:"Shah Aamir",fill:"#111827",fontSize:13})
I(authorInput,{type:"icon_font",iconFontName:"chevron-down",iconFontFamily:"lucide",width:16,height:16,fill:"#6B7280"})
```

- [ ] Fix `11bGl` (08 CMS Panel) entry overflow — read first:
```
batch_get nodeIds: ["11bGl"], readDepth: 4
```

- [ ] Update CMS panel entry rows to use fixed-width text with clip:
```javascript
// Find each entry text node in 11bGl
// Update textGrowth to fixed-width, add clip:true on parent frame
// Add "overflow annotation" note on the frame:
I(document,{type:"note",x:200,y:7500,width:300,height:18,content:"CMS entry names: truncate with ellipsis, tooltip on hover (see dev note)"})
// Update entry text nodes:
U("<entry1-text-id>",{textGrowth:"fixed-width",width:90})
U("<entry2-text-id>",{textGrowth:"fixed-width",width:90})
// Set parent frame to clip overflow:
U("<entry-row-container-id>",{clip:true})
```

- [ ] Create **Toast/warning** reusable component:
```javascript
toastWarn=I(document,{type:"frame",name:"Toast/warning",reusable:true,x:150,y:586,width:320,height:52,fill:"#FFFBEB",stroke:{fill:"#FDE68A",thickness:1},cornerRadius:8,layout:"horizontal",padding:[0,16],gap:12,alignItems:"center",placeholder:true,
  effect:{type:"shadow",offset:{x:0,y:4},blur:12,color:"#0000001A"}})
I(toastWarn,{type:"icon_font",iconFontName:"triangle-alert",iconFontFamily:"lucide",width:18,height:18,fill:"#F59E0B"})
I(toastWarn,{type:"text",content:"Warning message here",fill:"#92400E",fontSize:14,fontWeight:"500",width:"fill_container",textGrowth:"fixed-width"})
I(toastWarn,{type:"icon_font",iconFontName:"x",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
U(toastWarn,{placeholder:false})
```

- [ ] Create **CMSFieldRow** reusable component:
```javascript
cmsField=I(document,{type:"frame",name:"CMSFieldRow",reusable:true,x:150,y:648,width:400,height:60,layout:"vertical",gap:6,placeholder:true})
I(cmsField,{type:"text",content:"Field Label",fill:"#374151",fontSize:13,fontWeight:"500"})
cmsInput=I(cmsField,{type:"frame",width:"fill_container",height:36,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(cmsInput,{type:"text",content:"Field value...",fill:"#9CA3AF",fontSize:13,width:"fill_container",textGrowth:"fixed-width"})
U(cmsField,{placeholder:false})
```

- [ ] Create **BindingChip** reusable component:
```javascript
bindChip=I(document,{type:"frame",name:"BindingChip",reusable:true,x:150,y:718,width:120,height:24,fill:"#EFF6FF",stroke:{fill:"#BFDBFE",thickness:1},cornerRadius:12,layout:"horizontal",padding:[0,8],gap:4,alignItems:"center",placeholder:true})
I(bindChip,{type:"icon_font",iconFontName:"link",iconFontFamily:"lucide",width:12,height:12,fill:"#2563EB"})
I(bindChip,{type:"text",content:"title",fill:"#2563EB",fontSize:11,fontWeight:"500"})
U(bindChip,{placeholder:false})
```

- [ ] Create **F3-NEW-01: CMS Create Collection** modal:
```javascript
cmsCreate=I(document,{name:"F3-NEW-01 · CMS: Create Collection",type:"frame",x:3280,y:6750,width:1440,height:900,fill:"#F9FAFB",placeholder:true})
createModal=I(cmsCreate,{type:"frame",layoutPosition:"absolute",x:480,y:200,width:480,height:400,fill:"#FFFFFF",cornerRadius:12,layout:"vertical",effect:{type:"shadow",offset:{x:0,y:20},blur:40,color:"#00000026"}})
createHead=I(createModal,{type:"frame",width:"fill_container",height:56,layout:"horizontal",padding:[0,24],alignItems:"center"})
I(createHead,{type:"text",content:"New Collection",fill:"#111827",fontSize:16,fontWeight:"600",width:"fill_container",textGrowth:"fixed-width"})
I(createHead,{type:"icon_font",iconFontName:"x",iconFontFamily:"lucide",width:20,height:20,fill:"#6B7280"})
I(createModal,{type:"rectangle",width:"fill_container",height:1,fill:"#E5E7EB"})
createBody=I(createModal,{type:"frame",width:"fill_container",layout:"vertical",padding:24,gap:16})
// Collection name input
nameSection=I(createBody,{type:"frame",width:"fill_container",layout:"vertical",gap:6})
I(nameSection,{type:"text",content:"Collection Name",fill:"#374151",fontSize:13,fontWeight:"500"})
nameInput=I(nameSection,{type:"frame",width:"fill_container",height:36,fill:"#FFFFFF",stroke:{fill:"#2563EB",thickness:2},cornerRadius:6,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(nameInput,{type:"text",content:"Blog Posts",fill:"#111827",fontSize:13})
// Fields section
I(createBody,{type:"text",content:"Fields",fill:"#374151",fontSize:13,fontWeight:"500"})
field1Row=I(createBody,{type:"frame",width:"fill_container",height:36,layout:"horizontal",gap:8,alignItems:"center"})
I(field1Row,{type:"frame",width:"fill_container",height:36,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(field1Row,{type:"frame",width:100,height:36,fill:"#F3F4F6",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,10],alignItems:"center",justifyContent:"space_between"})
addFieldBtn=I(createBody,{type:"frame",width:"fill_container",height:36,fill:"transparent",stroke:{fill:"#E5E7EB",thickness:1,dashPattern:[4,4]},cornerRadius:6,layout:"horizontal",alignItems:"center",justifyContent:"center",gap:6})
I(addFieldBtn,{type:"icon_font",iconFontName:"plus",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(addFieldBtn,{type:"text",content:"Add field",fill:"#6B7280",fontSize:13})
createFooter=I(createModal,{type:"frame",width:"fill_container",height:64,layout:"horizontal",padding:[0,24],gap:12,alignItems:"center",justifyContent:"end"})
I(createFooter,{type:"ref",ref:"FZ9zY"})
I(createFooter,{type:"ref",ref:"P1prB"})
U(cmsCreate,{placeholder:false})
```

- [ ] Create **F3-NEW-02: CMS Field Type Picker** (dropdown expanded):
```javascript
ftPicker=I(document,{name:"F3-NEW-02 · CMS: Field Type Picker",type:"frame",x:4820,y:6750,width:1440,height:900,fill:"#F9FAFB",placeholder:true})
// Same modal as F3-NEW-01 but with field type dropdown open
dropdown=I(ftPicker,{type:"frame",layoutPosition:"absolute",x:804,y:350,width:160,height:248,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"vertical",padding:[4,0],effect:{type:"shadow",offset:{x:0,y:4},blur:12,color:"#0000001A"}})
fieldTypes=[["text","Text"],["image","Image"],["calendar","Date"],["hash","Number"],["toggle-left","Boolean"],["list","Rich Text"],["link","URL"],["at-sign","Email"]]
// For each: an icon + label row
ft1=I(dropdown,{type:"frame",width:"fill_container",height:32,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",fill:"#EFF6FF"})
I(ft1,{type:"icon_font",iconFontName:"text",iconFontFamily:"lucide",width:14,height:14,fill:"#2563EB"})
I(ft1,{type:"text",content:"Text",fill:"#111827",fontSize:13})
ft2=I(dropdown,{type:"frame",width:"fill_container",height:32,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",fill:"transparent"})
I(ft2,{type:"icon_font",iconFontName:"image",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(ft2,{type:"text",content:"Image",fill:"#111827",fontSize:13})
ft3=I(dropdown,{type:"frame",width:"fill_container",height:32,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",fill:"transparent"})
I(ft3,{type:"icon_font",iconFontName:"calendar",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(ft3,{type:"text",content:"Date",fill:"#111827",fontSize:13})
ft4=I(dropdown,{type:"frame",width:"fill_container",height:32,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",fill:"transparent"})
I(ft4,{type:"icon_font",iconFontName:"hash",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(ft4,{type:"text",content:"Number",fill:"#111827",fontSize:13})
ft5=I(dropdown,{type:"frame",width:"fill_container",height:32,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",fill:"transparent"})
I(ft5,{type:"icon_font",iconFontName:"toggle-left",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(ft5,{type:"text",content:"Boolean",fill:"#111827",fontSize:13})
ft6=I(dropdown,{type:"frame",width:"fill_container",height:32,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",fill:"transparent"})
I(ft6,{type:"icon_font",iconFontName:"list",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(ft6,{type:"text",content:"Rich Text",fill:"#111827",fontSize:13})
ft7=I(dropdown,{type:"frame",width:"fill_container",height:32,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",fill:"transparent"})
I(ft7,{type:"icon_font",iconFontName:"link",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(ft7,{type:"text",content:"URL",fill:"#111827",fontSize:13})
ft8=I(dropdown,{type:"frame",width:"fill_container",height:32,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",fill:"transparent"})
I(ft8,{type:"icon_font",iconFontName:"at-sign",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(ft8,{type:"text",content:"Email",fill:"#111827",fontSize:13})
U(ftPicker,{placeholder:false})
```

- [ ] Create **F3-NEW-03: CMS Binding Mode**, **F3-NEW-04: Binding Confirmation**, **F3-NEW-05: CMS Preview Mode**:
```javascript
// F3-NEW-03: Binding Mode — copy from a canvas frame, add chain-link overlays on elements
bindMode=C("1qeGh",document,{name:"F3-NEW-03 · CMS: Binding Mode",x:6360,y:6750,placeholder:true})
// Add "BINDING MODE" banner at top of canvas
bindBanner=I(document,{type:"frame",layoutPosition:"absolute",x:6360,y:6790,width:1440,height:36,fill:"#EFF6FF",stroke:{align:"outside",thickness:1,fill:"#BFDBFE"},layout:"horizontal",alignItems:"center",justifyContent:"center",gap:8})
I(bindBanner,{type:"icon_font",iconFontName:"link",iconFontFamily:"lucide",width:14,height:14,fill:"#2563EB"})
I(bindBanner,{type:"text",content:"Binding Mode — Click an element to bind it to: title",fill:"#2563EB",fontSize:13,fontWeight:"500"})
// Add chain-link badges on canvas elements
I(document,{type:"ref",ref:"<BindingChip-id>",layoutPosition:"absolute",x:6600,y:6900})
U(bindMode,{placeholder:false})

// F3-NEW-04: Binding Confirmation
bindConf=C("1qeGh",document,{name:"F3-NEW-04 · CMS: Binding Confirmation",x:7900,y:6750,placeholder:true})
// Add Toast/warning instance showing "Title bound to H1 element"
toastInst=I(document,{type:"ref",ref:"<Toast/warning-id>",layoutPosition:"absolute",x:8200,y:6820})
U(toastInst+"/<Toast-text-id>",{content:"Title bound to H1 · Undo"})
// Override fill to success green for this binding confirmation
U(toastInst,{fill:"#F0FDF4",stroke:{fill:"#BBF7D0",thickness:1}})
U(bindConf,{placeholder:false})

// F3-NEW-05: CMS Preview Mode
cmsPreview=C("1qeGh",document,{name:"F3-NEW-05 · CMS: Preview Mode",x:9440,y:6750,placeholder:true})
// Add "Preview Mode" chip to topbar
previewChip=I(document,{type:"frame",layoutPosition:"absolute",x:9880,y:6762,width:120,height:28,fill:"#FEF3C7",stroke:{fill:"#FDE68A",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,10],gap:6,alignItems:"center"})
I(previewChip,{type:"icon_font",iconFontName:"eye",iconFontFamily:"lucide",width:12,height:12,fill:"#D97706"})
I(previewChip,{type:"text",content:"Preview Mode",fill:"#D97706",fontSize:12,fontWeight:"500"})
exitBtn=I(document,{type:"frame",layoutPosition:"absolute",x:10010,y:6762,width:80,height:28,fill:"transparent",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",alignItems:"center",justifyContent:"center"})
I(exitBtn,{type:"text",content:"Exit Preview",fill:"#374151",fontSize:12})
U(cmsPreview,{placeholder:false})
```

- [ ] Add Flow 3 prototype annotations:
```javascript
I(document,{type:"note",x:200,y:7510,width:380,height:18,content:"Entry: Rail CMS icon → this frame"})
I(document,{type:"note",x:200,y:7528,width:380,height:18,content:"→ '+' New Collection → F3-NEW-01 · Create Collection"})
I(document,{type:"note",x:200,y:7546,width:380,height:18,content:"→ Click entry → 44C · Edit Entry | → Bind to page → F3-NEW-03 · Binding Mode"})
I(document,{type:"note",x:1740,y:7510,width:380,height:18,content:"→ Save → 08 · CMS Panel (back)"})
I(document,{type:"note",x:3280,y:7510,width:380,height:18,content:"→ Field type input → F3-NEW-02 · Field Type Picker | → Create → 08 · CMS Panel"})
I(document,{type:"note",x:7900,y:7510,width:380,height:18,content:"→ Click element → F3-NEW-04 · Binding Confirmation"})
I(document,{type:"note",x:9440,y:7510,width:380,height:18,content:"→ Exit Preview → 26 · canvas normal state"})
```

- [ ] Run `get_screenshot` on Flow 3 lane

- [ ] Commit:
```bash
git commit -m "design: flow3 complete — CMS fixes (B-05/B-06), 5 new CMS frames, CMSFieldRow/BindingChip/Toast/warning components, prototype annotations"
```

---

## Task 8: Flow 4 — AI Fixes + New Frames

**Goal:** Fix AI dead ends (Tasks 3 & 4), create 4 new AI frames, add AIPromptBar + AISuggestionCard components.

- [ ] Read `bNn49` (10 AI Entry Point) and `zSiUu` (11 AI Generating):
```
batch_get nodeIds: ["bNn49","zSiUu","Ql3YU"], readDepth: 4
```

- [ ] Fix `bNn49` — add "Skip →" link below tiles:
```javascript
// Find the tile container in bNn49 from batch_get
// Insert Skip link at bottom of tile container:
skipLink=I("<bNn49-tile-container-id>",{type:"frame",width:"fill_container",height:32,layout:"horizontal",alignItems:"center",justifyContent:"center",gap:4,marginTop:8})
I(skipLink,{type:"text",content:"Skip for now",fill:"#6B7280",fontSize:14})
I(skipLink,{type:"icon_font",iconFontName:"arrow-right",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
```

- [ ] Fix `zSiUu` — add progress text + Cancel button below skeleton:
```javascript
// Find skeleton container in zSiUu
// Insert progress text:
progressSection=I("<zSiUu-canvas-area-id>",{type:"frame",width:"fill_container",layout:"vertical",gap:12,alignItems:"center",padding:[16,0]})
I(progressSection,{type:"text",content:"Generating your page... This usually takes 10–20 seconds",fill:"#6B7280",fontSize:14,textGrowth:"fixed-width",width:400,textAlign:"center"})
I(progressSection,{type:"ref",ref:"<ProgressBar-id>",width:320})
cancelBtn=I(progressSection,{type:"ref",ref:"FZ9zY"})
U(cancelBtn,{descendants:{"<GhostBtn-label-id>":{content:"Cancel"}}})
```

- [ ] Fix `Ql3YU` (33) — update status bar text:
```javascript
// Find bottom status text in Ql3YU
U("<status-text-id>",{content:"AI generated · Editing"})
```

- [ ] Create **AIPromptBar** reusable component:
```javascript
aiBar=I(document,{type:"frame",name:"AIPromptBar",reusable:true,x:150,y:760,width:600,height:56,fill:"#1F2937",cornerRadius:28,layout:"horizontal",padding:[0,16],gap:12,alignItems:"center",placeholder:true,
  effect:{type:"shadow",offset:{x:0,y:8},blur:24,color:"#0000003D"}})
I(aiBar,{type:"icon_font",iconFontName:"sparkles",iconFontFamily:"lucide",width:18,height:18,fill:"#A78BFA"})
promptInput=I(aiBar,{type:"text",content:"Describe what you want to create...",fill:"#6B7280",fontSize:14,width:"fill_container",textGrowth:"fixed-width"})
I(aiBar,{type:"frame",width:32,height:32,fill:"#7C3AED",cornerRadius:16,layout:"horizontal",alignItems:"center",justifyContent:"center"})
U(aiBar,{placeholder:false})
```

- [ ] Create **AISuggestionCard** reusable component:
```javascript
aiCard=I(document,{type:"frame",name:"AISuggestionCard",reusable:true,x:150,y:826,width:240,height:72,fill:"#FAFAFA",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:8,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",placeholder:true})
I(aiCard,{type:"icon_font",iconFontName:"sparkles",iconFontFamily:"lucide",width:16,height:16,fill:"#7C3AED"})
aiCardBody=I(aiCard,{type:"frame",width:"fill_container",layout:"vertical",gap:2})
I(aiCardBody,{type:"text",content:"Suggestion label",fill:"#111827",fontSize:12,fontWeight:"500"})
I(aiCardBody,{type:"text",content:"Tap to apply this style",fill:"#6B7280",fontSize:11})
applyBtn=I(aiCard,{type:"frame",width:44,height:24,fill:"#EDE9FE",cornerRadius:4,layout:"horizontal",alignItems:"center",justifyContent:"center"})
I(applyBtn,{type:"text",content:"Apply",fill:"#7C3AED",fontSize:11,fontWeight:"500"})
U(aiCard,{placeholder:false})
```

- [ ] Create **F4-NEW-01: AI Prompt Bar Active**:
```javascript
aiPrompt=C("1qeGh",document,{name:"F4-NEW-01 · AI: Prompt Bar Active",x:4820,y:8450,placeholder:true})
// Add AIPromptBar instance at bottom of canvas area
aiBarInst=I(document,{type:"ref",ref:"<AIPromptBar-id>",layoutPosition:"absolute",x:5120,y:9050})
// Add suggested prompts above bar
suggestions=I(document,{type:"frame",layoutPosition:"absolute",x:5020,y:8990,width:560,height:48,layout:"horizontal",gap:8,alignItems:"center"})
sug1=I(suggestions,{type:"frame",height:28,fill:"#1F2937",cornerRadius:14,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(sug1,{type:"text",content:"Landing page for SaaS",fill:"#E5E7EB",fontSize:12})
sug2=I(suggestions,{type:"frame",height:28,fill:"#1F2937",cornerRadius:14,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(sug2,{type:"text",content:"Blog with sidebar",fill:"#E5E7EB",fontSize:12})
sug3=I(suggestions,{type:"frame",height:28,fill:"#1F2937",cornerRadius:14,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(sug3,{type:"text",content:"Portfolio grid",fill:"#E5E7EB",fontSize:12})
U(aiPrompt,{placeholder:false})
```

- [ ] Create **F4-NEW-02: AI Result Accept/Reject**:
```javascript
aiResult=C("1qeGh",document,{name:"F4-NEW-02 · AI: Result — Accept or Reject",x:6360,y:8450,placeholder:true})
G(aiResult,"ai","modern landing page hero section with headline and CTA button")
// Floating action bar
actionBar=I(document,{type:"frame",layoutPosition:"absolute",x:6680,y:9000,width:360,height:44,fill:"#1F2937",cornerRadius:22,layout:"horizontal",padding:[0,4],gap:4,alignItems:"center",
  effect:{type:"shadow",offset:{x:0,y:8},blur:24,color:"#0000003D"}})
keepBtn=I(actionBar,{type:"frame",height:36,fill:"#22C55E",cornerRadius:18,layout:"horizontal",padding:[0,16],alignItems:"center",gap:6})
I(keepBtn,{type:"icon_font",iconFontName:"check",iconFontFamily:"lucide",width:14,height:14,fill:"#FFFFFF"})
I(keepBtn,{type:"text",content:"Keep it",fill:"#FFFFFF",fontSize:13,fontWeight:"500"})
retryAiBtn=I(actionBar,{type:"frame",height:36,fill:"transparent",cornerRadius:18,layout:"horizontal",padding:[0,12],alignItems:"center",gap:6})
I(retryAiBtn,{type:"icon_font",iconFontName:"refresh-cw",iconFontFamily:"lucide",width:14,height:14,fill:"#9CA3AF"})
I(retryAiBtn,{type:"text",content:"Try again",fill:"#9CA3AF",fontSize:13})
editPromptBtn=I(actionBar,{type:"frame",height:36,fill:"transparent",cornerRadius:18,layout:"horizontal",padding:[0,12],alignItems:"center",gap:6})
I(editPromptBtn,{type:"icon_font",iconFontName:"edit-3",iconFontFamily:"lucide",width:14,height:14,fill:"#9CA3AF"})
I(editPromptBtn,{type:"text",content:"Edit prompt",fill:"#9CA3AF",fontSize:13})
U(aiResult,{placeholder:false})
```

- [ ] Create **F4-NEW-03: AI Refine Modal** + **F4-NEW-04: AI Inspector Suggestions**:
```javascript
// F4-NEW-03 Refine Modal
aiRefine=C("1qeGh",document,{name:"F4-NEW-03 · AI: Refine Modal",x:7900,y:8450,placeholder:true})
refinePanel=I(document,{type:"frame",layoutPosition:"absolute",x:8100,y:8600,width:380,height:320,fill:"#1F2937",cornerRadius:12,layout:"vertical",padding:20,gap:16,
  effect:{type:"shadow",offset:{x:0,y:20},blur:40,color:"#0000004D"}})
I(refinePanel,{type:"text",content:"Refine your design",fill:"#FFFFFF",fontSize:16,fontWeight:"600"})
previewThumb=I(refinePanel,{type:"frame",width:"fill_container",height:80,fill:"#374151",cornerRadius:6,layout:"horizontal",alignItems:"center",justifyContent:"center"})
I(previewThumb,{type:"text",content:"Current result preview",fill:"#6B7280",fontSize:12})
refineInput=I(refinePanel,{type:"frame",width:"fill_container",height:40,fill:"#111827",cornerRadius:8,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(refineInput,{type:"text",content:"Make it more minimal and modern",fill:"#E5E7EB",fontSize:13})
refineSubmit=I(refinePanel,{type:"frame",width:"fill_container",height:40,fill:"#7C3AED",cornerRadius:8,layout:"horizontal",alignItems:"center",justifyContent:"center",gap:6})
I(refineSubmit,{type:"icon_font",iconFontName:"sparkles",iconFontFamily:"lucide",width:14,height:14,fill:"#FFFFFF"})
I(refineSubmit,{type:"text",content:"Regenerate",fill:"#FFFFFF",fontSize:14,fontWeight:"500"})
U(aiRefine,{placeholder:false})

// F4-NEW-04 AI Inspector Suggestions
aiInsp=C("26XuR",document,{name:"F4-NEW-04 · AI: Inspector Suggestions",x:9440,y:8450,placeholder:true})
// Find inspector content area and add AI Suggestions section after existing sections
aiSugSection=I(document,{type:"frame",layoutPosition:"absolute",x:10120,y:8860,width:280,height:180,layout:"vertical",gap:8,padding:[12,16]})
I(aiSugSection,{type:"text",content:"AI Suggestions",fill:"#7C3AED",fontSize:11,fontWeight:"600",letterSpacing:0.5})
I(aiSugSection,{type:"ref",ref:"<AISuggestionCard-id>"})
sug2inst=I(aiSugSection,{type:"ref",ref:"<AISuggestionCard-id>"})
// Update suggestion text on instances
U(aiSugSection+"/<AISuggestionCard-label-id>",{content:"Try a bolder heading"})
U(sug2inst+"/<AISuggestionCard-label-id>",{content:"Add more whitespace"})
U(aiInsp,{placeholder:false})
```

- [ ] Add Flow 4 prototype annotations:
```javascript
I(document,{type:"note",x:200,y:9210,width:380,height:18,content:"Entry: TopBar AI icon → this frame (10 AI Entry Point)"})
I(document,{type:"note",x:200,y:9228,width:380,height:18,content:"→ Tile click → F4-NEW-01 · Prompt Bar | → Skip → 26 · canvas"})
I(document,{type:"note",x:1740,y:9210,width:380,height:18,content:"→ Cancel → 10 · AI Entry | → Complete → F4-NEW-02 · AI Result"})
I(document,{type:"note",x:3280,y:9210,width:380,height:18,content:"→ Status bar: AI generated · Editing state"})
I(document,{type:"note",x:4820,y:9210,width:380,height:18,content:"→ Submit → 11 · AI Generating"})
I(document,{type:"note",x:6360,y:9210,width:380,height:18,content:"→ Keep it → 26 · canvas | → Try again → F4-NEW-03 · Refine | → Edit prompt → F4-NEW-01"})
I(document,{type:"note",x:7900,y:9210,width:380,height:18,content:"→ Regenerate → 11 · AI Generating"})
I(document,{type:"note",x:9440,y:9210,width:380,height:18,content:"→ Apply suggestion → updates canvas in place"})
```

- [ ] Run `get_screenshot` on Flow 4 lane

- [ ] Commit:
```bash
git commit -m "design: flow4 complete — AI dead-end fixes (tasks 3/4), 4 new AI frames, AIPromptBar/AISuggestionCard components, prototype annotations"
```

---

## Task 9: Flow 5 — Settings Fixes + New Frames

**Goal:** Fix frame 40 layout, frame 22 quick-settings link, frame 27 dark footer. Create 3 new Settings pages + SettingsNavItem component.

- [ ] Read frames 22, 27, 39, 40:
```
batch_get nodeIds: ["hcxlF","zvcio","VSDXS","cUVnH"], readDepth: 3
```

- [ ] Fix `hcxlF` (22 Settings Panel) — add "Full Settings →" link:
```javascript
// Find the bottom of hcxlF settings panel
// Insert annotation + link row:
fullSettingsLink=I("<hcxlF-panel-container-id>",{type:"frame",width:"fill_container",height:40,layout:"horizontal",padding:[0,16],gap:6,alignItems:"center",stroke:{align:"outside",fill:"#E5E7EB",thickness:{top:1}}})
I(fullSettingsLink,{type:"text",content:"Full Settings",fill:"#2563EB",fontSize:13,fontWeight:"500",width:"fill_container",textGrowth:"fixed-width"})
I(fullSettingsLink,{type:"icon_font",iconFontName:"arrow-right",iconFontFamily:"lucide",width:14,height:14,fill:"#2563EB"})
// Add annotation note:
I(document,{type:"note",x:200,y:10905,width:380,height:18,content:"Quick settings = inline sidebar. Full Settings → opens full-page settings (39)"})
```

- [ ] Fix `zvcio` (27 Components Panel) dark footer:
```javascript
// Find the dark footer rectangle in zvcio
U("<dark-footer-rect-id>",{fill:"#F3F4F6"})
// Find copyright text and update:
U("<copyright-text-id>",{content:"© 2026 Buildrik",fill:"#374151"})
```

- [ ] Fix `cUVnH` (40 Publish Settings) layout — restructure to match VSDXS pattern:
```javascript
// Read VSDXS structure first to understand the two-column layout
batch_get nodeIds: ["VSDXS"], readDepth: 3
// Then update cUVnH to use the same left-nav + right-content structure
U("cUVnH",{layout:"horizontal"})
// Move/restructure children to match two-column layout
// This requires reading cUVnH children and restructuring — do after batch_get
```

- [ ] Create **SettingsNavItem** reusable component:
```javascript
settingsNav=I(document,{type:"frame",name:"SettingsNavItem",reusable:true,x:150,y:898,width:200,height:36,layout:"horizontal",padding:[0,12],gap:10,alignItems:"center",cornerRadius:6,fill:"transparent",placeholder:true})
I(settingsNav,{type:"icon_font",iconFontName:"settings",iconFontFamily:"lucide",width:16,height:16,fill:"#374151"})
I(settingsNav,{type:"text",content:"Nav Item",fill:"#374151",fontSize:14,width:"fill_container",textGrowth:"fixed-width"})
U(settingsNav,{placeholder:false})
```

- [ ] Create **F5-NEW-01: Settings Billing & Plan**:
```javascript
billing=C("VSDXS",document,{name:"F5-NEW-01 · Settings: Billing & Plan",x:6360,y:10150,placeholder:true})
// Update right content area to show billing content
// Find right panel in the copy and update:
billingContent=I(document,{type:"frame",layoutPosition:"absolute",x:7120,y:10210,width:720,height:700,layout:"vertical",gap:24,padding:32})
// Plan card
planCard=I(billingContent,{type:"frame",width:"fill_container",height:120,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:8,layout:"horizontal",padding:[0,24],gap:16,alignItems:"center"})
planBadge=I(planCard,{type:"frame",width:60,height:60,fill:"#EFF6FF",cornerRadius:8,layout:"horizontal",alignItems:"center",justifyContent:"center"})
I(planBadge,{type:"icon_font",iconFontName:"zap",iconFontFamily:"lucide",width:24,height:24,fill:"#2563EB"})
planInfo=I(planCard,{type:"frame",width:"fill_container",layout:"vertical",gap:4})
I(planInfo,{type:"text",content:"Pro Plan",fill:"#111827",fontSize:18,fontWeight:"700"})
I(planInfo,{type:"text",content:"$29/month · Renews Apr 29, 2026",fill:"#6B7280",fontSize:14})
upgradeBtn=I(planCard,{type:"ref",ref:"P1prB"})
// Billing history table
I(billingContent,{type:"text",content:"Billing History",fill:"#111827",fontSize:16,fontWeight:"600"})
tableHeader=I(billingContent,{type:"frame",width:"fill_container",height:36,layout:"horizontal",fill:"#F9FAFB",padding:[0,16]})
I(tableHeader,{type:"text",content:"Date",fill:"#6B7280",fontSize:12,fontWeight:"500",width:"fill_container",textGrowth:"fixed-width"})
I(tableHeader,{type:"text",content:"Amount",fill:"#6B7280",fontSize:12,fontWeight:"500",width:100,textGrowth:"fixed-width"})
I(tableHeader,{type:"text",content:"Status",fill:"#6B7280",fontSize:12,fontWeight:"500",width:80,textGrowth:"fixed-width"})
row1b=I(billingContent,{type:"frame",width:"fill_container",height:44,layout:"horizontal",padding:[0,16],alignItems:"center",stroke:{fill:"#F3F4F6",thickness:{bottom:1}}})
I(row1b,{type:"text",content:"Mar 29, 2026",fill:"#374151",fontSize:14,width:"fill_container",textGrowth:"fixed-width"})
I(row1b,{type:"text",content:"$29.00",fill:"#374151",fontSize:14,width:100,textGrowth:"fixed-width"})
I(row1b,{type:"frame",width:80,height:22,fill:"#F0FDF4",cornerRadius:4,layout:"horizontal",alignItems:"center",justifyContent:"center"})
U(billing,{placeholder:false})
```

- [ ] Create **F5-NEW-02: Settings Integrations**:
```javascript
integrations=C("VSDXS",document,{name:"F5-NEW-02 · Settings: Integrations",x:7900,y:10150,placeholder:true})
intContent=I(document,{type:"frame",layoutPosition:"absolute",x:8660,y:10210,width:720,height:700,layout:"vertical",gap:16,padding:32})
I(intContent,{type:"text",content:"Integrations",fill:"#111827",fontSize:20,fontWeight:"700"})
I(intContent,{type:"text",content:"Connect third-party tools to your Buildrik projects.",fill:"#6B7280",fontSize:14,textGrowth:"fixed-width",width:"fill_container"})
intGrid=I(intContent,{type:"frame",width:"fill_container",layout:"vertical",gap:12})
intRow=["Google Analytics","Hotjar","Mailchimp","Stripe"]
// For each integration: a card with logo area + name + status + Connect button
int1=I(intGrid,{type:"frame",width:"fill_container",height:64,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:8,layout:"horizontal",padding:[0,16],gap:12,alignItems:"center"})
int1Logo=I(int1,{type:"frame",width:36,height:36,fill:"#F3F4F6",cornerRadius:6})
I(int1Logo,{type:"text",content:"GA",fill:"#374151",fontSize:13,fontWeight:"700",textAlign:"center",textAlignVertical:"middle",textGrowth:"fixed-width-height",width:36,height:36})
int1Info=I(int1,{type:"frame",width:"fill_container",layout:"vertical",gap:2})
I(int1Info,{type:"text",content:"Google Analytics",fill:"#111827",fontSize:14,fontWeight:"500"})
I(int1Info,{type:"text",content:"Track site visitors and conversions",fill:"#6B7280",fontSize:12})
connectedBadge=I(int1,{type:"frame",width:80,height:26,fill:"#F0FDF4",stroke:{fill:"#BBF7D0",thickness:1},cornerRadius:13,layout:"horizontal",alignItems:"center",justifyContent:"center",gap:4})
I(connectedBadge,{type:"rectangle",width:6,height:6,fill:"#16A34A",cornerRadius:3})
I(connectedBadge,{type:"text",content:"Connected",fill:"#166534",fontSize:11})
int2=I(intGrid,{type:"frame",width:"fill_container",height:64,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:8,layout:"horizontal",padding:[0,16],gap:12,alignItems:"center"})
int2Logo=I(int2,{type:"frame",width:36,height:36,fill:"#F3F4F6",cornerRadius:6})
I(int2Logo,{type:"text",content:"HJ",fill:"#374151",fontSize:13,fontWeight:"700",textAlign:"center",textAlignVertical:"middle",textGrowth:"fixed-width-height",width:36,height:36})
int2Info=I(int2,{type:"frame",width:"fill_container",layout:"vertical",gap:2})
I(int2Info,{type:"text",content:"Hotjar",fill:"#111827",fontSize:14,fontWeight:"500"})
I(int2Info,{type:"text",content:"Heatmaps and session recordings",fill:"#6B7280",fontSize:12})
I(int2,{type:"ref",ref:"P1prB"})
U(integrations,{placeholder:false})
```

- [ ] Create **F5-NEW-03: Settings Team Members**:
```javascript
team=C("VSDXS",document,{name:"F5-NEW-03 · Settings: Team Members",x:9440,y:10150,placeholder:true})
teamContent=I(document,{type:"frame",layoutPosition:"absolute",x:10200,y:10210,width:720,height:700,layout:"vertical",gap:16,padding:32})
teamHeader=I(teamContent,{type:"frame",width:"fill_container",height:36,layout:"horizontal",alignItems:"center"})
I(teamHeader,{type:"text",content:"Team Members",fill:"#111827",fontSize:20,fontWeight:"700",width:"fill_container",textGrowth:"fixed-width"})
inviteBtn=I(teamHeader,{type:"ref",ref:"P1prB"})
// Team table
tableH=I(teamContent,{type:"frame",width:"fill_container",height:36,layout:"horizontal",fill:"#F9FAFB",padding:[0,16],alignItems:"center"})
I(tableH,{type:"text",content:"Member",fill:"#6B7280",fontSize:12,fontWeight:"500",width:"fill_container",textGrowth:"fixed-width"})
I(tableH,{type:"text",content:"Role",fill:"#6B7280",fontSize:12,fontWeight:"500",width:120,textGrowth:"fixed-width"})
I(tableH,{type:"text",content:"",fill:"#6B7280",fontSize:12,width:40})
// Row 1
tRow1=I(teamContent,{type:"frame",width:"fill_container",height:52,layout:"horizontal",padding:[0,16],alignItems:"center",stroke:{fill:"#F3F4F6",thickness:{bottom:1}}})
avatar1=I(tRow1,{type:"frame",width:32,height:32,fill:"#EFF6FF",cornerRadius:16,layout:"horizontal",alignItems:"center",justifyContent:"center"})
I(avatar1,{type:"text",content:"SA",fill:"#2563EB",fontSize:12,fontWeight:"600"})
memberInfo1=I(tRow1,{type:"frame",width:"fill_container",layout:"vertical",gap:2,padding:[0,8]})
I(memberInfo1,{type:"text",content:"Shah Aamir (you)",fill:"#111827",fontSize:14,fontWeight:"500"})
I(memberInfo1,{type:"text",content:"shah@buildrik.com",fill:"#6B7280",fontSize:12})
roleSelect1=I(tRow1,{type:"frame",width:120,height:32,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,10],alignItems:"center",justifyContent:"space_between"})
I(roleSelect1,{type:"text",content:"Owner",fill:"#111827",fontSize:13})
I(roleSelect1,{type:"icon_font",iconFontName:"chevron-down",iconFontFamily:"lucide",width:14,height:14,fill:"#6B7280"})
I(tRow1,{type:"icon_font",iconFontName:"more-horizontal",iconFontFamily:"lucide",width:16,height:16,fill:"#9CA3AF"})
U(team,{placeholder:false})
```

- [ ] Add Flow 5 prototype annotations:
```javascript
I(document,{type:"note",x:200,y:10905,width:380,height:18,content:"Entry: Rail gear icon → 22 Settings Panel"})
I(document,{type:"note",x:200,y:10923,width:380,height:18,content:"→ Full Settings → 39 · Settings Navigation"})
I(document,{type:"note",x:1740,y:10905,width:380,height:18,content:"→ Domain → 45 | → Billing → F5-NEW-01 | → Integrations → F5-NEW-02 | → Team → F5-NEW-03"})
```

- [ ] Run `get_screenshot` on Flow 5 lane

- [ ] Commit:
```bash
git commit -m "design: flow5 complete — settings fixes (frame 22/27/40), 3 new settings pages, SettingsNavItem component, prototype annotations"
```

---

## Task 10: Flow 6 — Collaboration Frames + Components

**Goal:** Create 6 new collaboration frames. Add Avatar/presence and LiveCursor reusable components.

- [ ] Create **Avatar/presence** reusable component:
```javascript
avatarComp=I(document,{type:"frame",name:"Avatar/presence",reusable:true,x:150,y:960,width:32,height:32,cornerRadius:16,fill:"#EFF6FF",stroke:{fill:"#FFFFFF",thickness:2},layout:"horizontal",alignItems:"center",justifyContent:"center",placeholder:true})
I(avatarComp,{type:"text",content:"SA",fill:"#2563EB",fontSize:11,fontWeight:"700"})
U(avatarComp,{placeholder:false})
```

- [ ] Create **LiveCursor** reusable component:
```javascript
liveCursor=I(document,{type:"frame",name:"LiveCursor",reusable:true,x:150,y:1002,width:80,height:28,layout:"horizontal",gap:4,alignItems:"center",placeholder:true})
// Cursor arrow shape (path)
I(liveCursor,{type:"path",width:14,height:18,fill:"#DC2626",geometry:"M0,0 L0,16 L4,12 L7,18 L9,17 L6,11 L11,11 Z"})
cursorLabel=I(liveCursor,{type:"frame",height:20,fill:"#DC2626",cornerRadius:10,layout:"horizontal",padding:[0,8],alignItems:"center"})
I(cursorLabel,{type:"text",content:"Jane",fill:"#FFFFFF",fontSize:11,fontWeight:"500"})
U(liveCursor,{placeholder:false})
```

- [ ] Create **F6-NEW-01: Collab Share Panel**:
```javascript
sharePanel=C("BBjUx",document,{name:"F6-NEW-01 · Collab: Share Panel",x:200,y:11850,placeholder:true})
// Add share panel dropdown below topbar "Share" button area
shareDropdown=I(document,{type:"frame",layoutPosition:"absolute",x:1040,y:11908,width:320,height:220,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:8,layout:"vertical",padding:16,gap:12,
  effect:{type:"shadow",offset:{x:0,y:8},blur:24,color:"#0000001A"}})
I(shareDropdown,{type:"text",content:"Share project",fill:"#111827",fontSize:14,fontWeight:"600"})
inviteRow=I(shareDropdown,{type:"frame",width:"fill_container",height:36,layout:"horizontal",gap:8})
inviteInput=I(inviteRow,{type:"frame",width:"fill_container",height:36,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(inviteInput,{type:"text",content:"Enter email address",fill:"#9CA3AF",fontSize:13})
roleDropdown=I(inviteRow,{type:"frame",width:80,height:36,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,8],alignItems:"center",justifyContent:"space_between"})
I(roleDropdown,{type:"text",content:"Editor",fill:"#374151",fontSize:13})
I(roleDropdown,{type:"icon_font",iconFontName:"chevron-down",iconFontFamily:"lucide",width:12,height:12,fill:"#6B7280"})
sendInviteBtn=I(shareDropdown,{type:"ref",ref:"P1prB",width:"fill_container"})
I(shareDropdown,{type:"rectangle",width:"fill_container",height:1,fill:"#E5E7EB"})
copyLinkRow=I(shareDropdown,{type:"frame",width:"fill_container",height:36,layout:"horizontal",gap:8,alignItems:"center"})
linkInput=I(copyLinkRow,{type:"frame",width:"fill_container",height:36,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:6,layout:"horizontal",padding:[0,12],alignItems:"center"})
I(linkInput,{type:"text",content:"https://buildrik.app/project/abc123",fill:"#6B7280",fontSize:12})
I(copyLinkRow,{type:"ref",ref:"FZ9zY"})
U(sharePanel,{placeholder:false})
```

- [ ] Create **F6-NEW-02: Invite Sent**:
```javascript
inviteSent=C("BBjUx",document,{name:"F6-NEW-02 · Collab: Invite Sent",x:1740,y:11850,placeholder:true})
// Same share panel + success toast
I(document,{type:"ref",ref:"<Toast/success-id>",layoutPosition:"absolute",x:1840,y:11858})
// Overlay share dropdown in success state
I(document,{type:"note",x:1740,y:11820,width:320,height:18,content:"Invite Sent: toast shows 'Invite sent to jane@...' for 3 seconds"})
U(inviteSent,{placeholder:false})
```

- [ ] Create **F6-NEW-03: Live Cursors**:
```javascript
liveCursors=C("1qeGh",document,{name:"F6-NEW-03 · Collab: Live Cursors",x:3280,y:11850,placeholder:true})
// Add 2 colored live cursor instances on canvas
cursor1=I(document,{type:"ref",ref:"<LiveCursor-id>",layoutPosition:"absolute",x:3700,y:12100})
cursor2=I(document,{type:"ref",ref:"<LiveCursor-id>",layoutPosition:"absolute",x:4100,y:12200})
// Customize cursor 2 to blue (Marcus)
U(cursor2+"/<cursor-path-id>",{fill:"#2563EB"})
U(cursor2+"/<cursor-label-id>",{fill:"#2563EB"})
U(cursor2+"/<cursor-name-id>",{content:"Marcus"})
// Add presence avatars to topbar (2 avatar instances)
av1=I(document,{type:"ref",ref:"<Avatar/presence-id>",layoutPosition:"absolute",x:4450,y:11866})
av2=I(document,{type:"ref",ref:"<Avatar/presence-id>",layoutPosition:"absolute",x:4474,y:11866})
U(av2,{fill:"#EDE9FE"})
U(av2+"/<avatar-text-id>",{content:"MA",fill:"#7C3AED"})
I(document,{type:"note",x:3280,y:11820,width:320,height:18,content:"Live cursors: visible when 2+ collaborators in same project"})
U(liveCursors,{placeholder:false})
```

- [ ] Create **F6-NEW-04: Conflict Toast**, **F6-NEW-05: Connection Lost**, **F6-NEW-06: Reconnected**:
```javascript
// F6-NEW-04 Conflict Toast
conflictFrame=C("1qeGh",document,{name:"F6-NEW-04 · Collab: Conflict Toast",x:4820,y:11850,placeholder:true})
conflictToast=I(document,{type:"frame",layoutPosition:"absolute",x:5060,y:11858,width:360,height:56,fill:"#FFFFFF",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:8,layout:"horizontal",padding:[0,12],gap:8,alignItems:"center",
  effect:{type:"shadow",offset:{x:0,y:4},blur:12,color:"#0000001A"}})
I(conflictToast,{type:"ref",ref:"<Avatar/presence-id>"})
conflictMsg=I(conflictToast,{type:"frame",width:"fill_container",layout:"vertical",gap:2})
I(conflictMsg,{type:"text",content:"Jane is editing this element",fill:"#111827",fontSize:13,fontWeight:"500"})
conflictActions=I(conflictMsg,{type:"frame",layout:"horizontal",gap:8})
I(conflictActions,{type:"text",content:"View",fill:"#2563EB",fontSize:12})
I(conflictActions,{type:"text",content:"Take over",fill:"#DC2626",fontSize:12})
U(conflictFrame,{placeholder:false})

// F6-NEW-05 Connection Lost
connLost=C("1qeGh",document,{name:"F6-NEW-05 · Collab: Connection Lost",x:6360,y:11850,placeholder:true})
lostBanner=I(document,{type:"frame",layoutPosition:"absolute",x:6360,y:11850,width:1440,height:36,fill:"#FEF3C7",layout:"horizontal",alignItems:"center",justifyContent:"center",gap:8})
I(lostBanner,{type:"icon_font",iconFontName:"wifi-off",iconFontFamily:"lucide",width:14,height:14,fill:"#D97706"})
I(lostBanner,{type:"text",content:"Connection lost · Reconnecting...",fill:"#92400E",fontSize:13,fontWeight:"500"})
U(connLost,{placeholder:false})

// F6-NEW-06 Reconnected
reconnected=C("1qeGh",document,{name:"F6-NEW-06 · Collab: Reconnected",x:7900,y:11850,placeholder:true})
reconnBanner=I(document,{type:"frame",layoutPosition:"absolute",x:7900,y:11850,width:1440,height:36,fill:"#F0FDF4",layout:"horizontal",alignItems:"center",justifyContent:"center",gap:8})
I(reconnBanner,{type:"icon_font",iconFontName:"wifi",iconFontFamily:"lucide",width:14,height:14,fill:"#16A34A"})
I(reconnBanner,{type:"text",content:"Back online · All changes saved",fill:"#166534",fontSize:13,fontWeight:"500"})
U(reconnected,{placeholder:false})
```

- [ ] Add Flow 6 prototype annotations:
```javascript
I(document,{type:"note",x:200,y:12620,width:380,height:18,content:"Entry: TopBar Share button → F6-NEW-01 · Share Panel"})
I(document,{type:"note",x:200,y:12638,width:380,height:18,content:"→ Send invite → F6-NEW-02 · Invite Sent"})
I(document,{type:"note",x:3280,y:12620,width:380,height:18,content:"→ Collaborator joins → F6-NEW-03 · Live Cursors"})
I(document,{type:"note",x:4820,y:12620,width:380,height:18,content:"→ Same element click → F6-NEW-04 · Conflict Toast"})
I(document,{type:"note",x:6360,y:12620,width:380,height:18,content:"→ Reconnect → F6-NEW-06 · Reconnected"})
```

- [ ] Run `get_screenshot` on Flow 6 lane

- [ ] Commit:
```bash
git commit -m "design: flow6 complete — 6 collab frames, Avatar/presence + LiveCursor components, prototype annotations"
```

---

## Task 11: Remaining Fixes (not covered in any flow)

**Goal:** Apply the 5 wireframe-design-fixes tasks not covered in flows 1–6: Frame 06 delete, Frame 19 breakpoints, Section 53 background, Frame 04 templates, Frame 16 mobile gate, Section 54 border, Frame 33.

- [ ] **Delete deprecated Frame 06** (`Vv8n3` — old Publish Flow):
```javascript
D("Vv8n3")
// Verify with batch_get — should return "No node found"
```

- [ ] **Fix Frame 19 — Breakpoint Editing** (`Znv6u`) — add breakpoint switcher:
```javascript
batch_get nodeIds: ["Znv6u"], readDepth: 3
// Find topbar node in Znv6u, insert breakpoint chip row:
bpRow=I("<Znv6u-topbar-id>",{type:"frame",layout:"horizontal",gap:4,alignItems:"center"})
desktopChip=I(bpRow,{type:"ref",ref:"HG3uE"})   // TabPill/inactive
U(desktopChip+"/<text-id>",{content:"Desktop"})
tabletChip=I(bpRow,{type:"ref",ref:"HG3uE"})
U(tabletChip+"/<text-id>",{content:"Tablet"})
mobileChip=I(bpRow,{type:"ref",ref:"QVIwi"})    // TabPill/active
U(mobileChip+"/<text-id>",{content:"Mobile"})
```

- [ ] **Fix Section 53 — Background** (`0DMJA`) — add type selector + alpha bar:
```javascript
batch_get nodeIds: ["0DMJA"], readDepth: 4
// Insert type selector chip row at top:
typeRow=I("<0DMJA-content-id>",{type:"frame",width:"fill_container",height:32,layout:"horizontal",gap:4})
I(typeRow,{type:"ref",ref:"QVIwi"})   // Solid — active
I(typeRow,{type:"ref",ref:"HG3uE"})   // Gradient
I(typeRow,{type:"ref",ref:"HG3uE"})   // Image
I(typeRow,{type:"ref",ref:"HG3uE"})   // None
// Update chip labels:
// ... use U() on each chip's text descendant
// Add opacity row below hue bar:
opacityRow=I("<0DMJA-content-id>",{type:"frame",width:"fill_container",height:32,layout:"horizontal",gap:8,alignItems:"center"})
I(opacityRow,{type:"text",content:"Opacity",fill:"#374151",fontSize:12})
opacityBar=I(opacityRow,{type:"frame",width:"fill_container",height:8,fill:"#E5E7EB",cornerRadius:4})
I(opacityBar,{type:"frame",width:"fill_container",height:8,fill:"linear-gradient(to right, transparent, #374151)",cornerRadius:4})
opacityInput=I(opacityRow,{type:"frame",width:48,height:28,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1},cornerRadius:4,layout:"horizontal",alignItems:"center",justifyContent:"center"})
I(opacityInput,{type:"text",content:"100%",fill:"#374151",fontSize:12})
```

- [ ] **Fix Frame 04 — Templates Panel** (`eHMi7`) — add 2 more templates + blank:
```javascript
batch_get nodeIds: ["eHMi7"], readDepth: 4
// Find template grid in eHMi7
// Add "Services" template card (orange thumb + label)
services=I("<template-grid-id>",{type:"frame",width:120,height:100,fill:"#FFF7ED",stroke:{fill:"#FED7AA",thickness:1},cornerRadius:6,layout:"vertical",gap:4})
I(services,{type:"frame",width:"fill_container",height:72,fill:"#FDBA74",cornerRadius:4})
I(services,{type:"text",content:"Services",fill:"#111827",fontSize:11,fontWeight:"500"})
// Add "Link in Bio" template card (pink thumb + label)
linkBio=I("<template-grid-id>",{type:"frame",width:120,height:100,fill:"#FDF4FF",stroke:{fill:"#E9D5FF",thickness:1},cornerRadius:6,layout:"vertical",gap:4})
I(linkBio,{type:"frame",width:"fill_container",height:72,fill:"#C084FC",cornerRadius:4})
I(linkBio,{type:"text",content:"Link in Bio",fill:"#111827",fontSize:11,fontWeight:"500"})
// Add "Blank" card
blank=I("<template-grid-id>",{type:"frame",width:120,height:100,fill:"#F9FAFB",stroke:{fill:"#E5E7EB",thickness:1,dashPattern:[4,4]},cornerRadius:6,layout:"vertical",alignItems:"center",justifyContent:"center",gap:4})
I(blank,{type:"icon_font",iconFontName:"plus",iconFontFamily:"lucide",width:24,height:24,fill:"#9CA3AF"})
I(blank,{type:"text",content:"Blank",fill:"#9CA3AF",fontSize:11})
```

- [ ] **Fix Section 54 — Border** (`LiumT`) — update style chips + width placeholder:
```javascript
batch_get nodeIds: ["LiumT"], readDepth: 4
// Find the "A B" chip group in LiumT
// Update to 4 chips: Solid / Dashed / Dotted / None
// Update width placeholder from "Search..." to "1"
```

- [ ] **Reconcile Mobile Gate frames 21 and 05** (`x27ZA`, `O3NI7`):
```javascript
batch_get nodeIds: ["x27ZA","O3NI7"], readDepth: 2
// Compare content. Add cross-reference annotations:
I(document,{type:"note",x:<O3NI7-x>,y:<O3NI7-y-20>,width:300,height:18,content:"Mobile Gate Banner — for full context see Frame 21 (x27ZA)"})
I(document,{type:"note",x:<x27ZA-x>,y:<x27ZA-y-20>,width:300,height:18,content:"Mobile Gate (full editor view) — banner only: Frame 05 (O3NI7)"})
// Update names to clarify:
U("O3NI7",{name:"05 · Mobile Gate: Banner Only"})
U("x27ZA",{name:"21 · Mobile Gate: Full Editor"})
```

- [ ] Run `get_screenshot` on all modified frames to verify

- [ ] Commit:
```bash
git commit -m "design: remaining fixes — frame 06 deleted, frame 19 breakpoints, section 53/54 controls, templates +2, mobile gate reconciled"
```

---

## Final Verification

- [ ] Run `get_screenshot` on the full canvas (zoom out) to verify all 8 swim lanes are visible and organized

- [ ] Run `batch_get` with `patterns: ["frame"]` and count top-level frames — should be ~117 (excluding reusable components)

- [ ] Scan each lane with `get_screenshot` to verify:
  - [ ] Lane 1 (Canvas Edit): 13 frames + flow arrows
  - [ ] Lane 2 (Panels & Components): all non-flow frames present
  - [ ] Lane 3 (Publish): 7 frames + arrows
  - [ ] Lane 4 (CMS): 7 frames + arrows
  - [ ] Lane 5 (AI): 7 frames + arrows
  - [ ] Lane 6 (Settings): 7 frames + arrows
  - [ ] Lane 7 (Collaboration): 6 frames + arrows
  - [ ] Lane 8 (Deprecated): 7 frames with red annotations

- [ ] Verify no deprecated frame IDs appear in active lanes: `5qjkQ`, `niyiH`, `Mk1L2`, `YBoj8`, `nkopD`, `jPkOS`, `l6Cy5`

- [ ] Verify component library has 35 components (22 original + 13 new)

- [ ] Final commit:
```bash
git commit -m "design: wireframe redesign + prototype complete — 117 frames, 8 swim lanes, 35 components, 6 clickable flows"
```

# Buildrik / Aquibra Studio — UX Redesign Brief
**Date:** 2026-03-12
**Source documents:** today_final.md (current-state audit), prior UX audit sessions
**Status:** Complete — all 5 sections (A through E)

---

## HOW TO USE THIS FILE

This file is the complete redesign brief for the Aquibra Studio editor.
It contains 5 sections generated in sequence:

| Section | Document | Purpose |
|---------|----------|---------|
| A | Audit-to-Redesign Gap Map | What is missing or weak in the redesign direction |
| B | Target-State PRD | Full 30-section product requirements for the redesign |
| C | Whole-Editor Coverage Check | Capability-by-capability audit vs. PRD |
| D | Stitch Handoff Brief | Instructions for Stitch to generate redesign screens |
| E | Anti-Downgrade Validation Checklist | Acceptance gate — reviewer checklist before implementation |

**Rule:** A redesign that is cleaner but functionally weaker must be rejected.

---

## A. AUDIT-TO-REDESIGN GAP MAP

**Purpose:** Identifies what exists in the current-state audit (today_final.md) that is absent or weakly represented in any redesign direction. Use before writing a PRD.

### Category A — Engine Capabilities with No UI Surface Spec

| Capability / Surface | Found in Audit | Missing / Weak in Redesign Direction | Why It Matters | Downgrade Risk | Recommended PRD Section |
|----------------------|---------------|--------------------------------------|---------------|---------------|-------------------------|
| PluginManager (29th manager) | today_final.md Phase 1 — listed in Composer managers | No user-facing surface spec anywhere | Users who install plugins have no way to manage them | HIGH — feature silently disappears | Settings > Integrations or dedicated Plugins panel |
| RecoveryManager | today_final.md Phase 1 | No panic/recovery UI spec | Users lose work if crash recovery has no visual | HIGH | Top bar or auto-save indicator with recovery prompt |
| FormHandler | today_final.md Phase 1 | No inspector surface for form element binding | Form elements have no way to connect to Formspree | HIGH | Inspector Style tab (contextual for form elements) |
| InteractionManager | today_final.md Phase 1 | Covered in Effects tab spec but not named explicitly | GSAP trigger bindings need a named home | MEDIUM | Inspector Effects tab — Interaction Triggers section |
| SyncManager | today_final.md Phase 1 | No sync status UI | Users don't know if their project is synced | MEDIUM | Top bar status indicator |
| DragManager | today_final.md Phase 1 | Not addressed in any screen spec | Canvas drag must be explicitly shown | CRITICAL | Canvas interaction screens (F-series) |

### Category B — Inspector Capability Gaps

| Capability / Surface | Found in Audit | Missing / Weak in Redesign Direction | Why It Matters | Downgrade Risk | Recommended PRD Section |
|----------------------|---------------|--------------------------------------|---------------|---------------|-------------------------|
| deriveCssContext system | today_final.md Phase 1 | Not protected in inspector redesign — risk of flat inspector | Context-sensitive inspector is a key usability feature | HIGH | Inspector spec — must vary by element type |
| TraitDataBinding | today_final.md Phase 1 | Not named in CMS binding spec | Custom attributes (href, src, alt) need binding UI | HIGH | Inspector Style tab or Attributes section |
| TextDataBinding | today_final.md Phase 1 | Partially mentioned but not explicitly located | Text content binding is a core CMS feature | HIGH | Inspector Style tab (contextual for text elements) |
| DevMode toggle | today_final.md Phase 1 | Not in any inspector screen spec | Developers need CSS output view | MEDIUM | Inspector header |
| InspectorSubNav | today_final.md Phase 1 | Tab label "Behavior" not corrected in any spec | Wrong label causes confusion | HIGH | Inspector tab 3 = "Effects" |
| Multiple box shadows | today_final.md Phase 1 | Not called out as multi-shadow | Single shadow simplified = capability loss | MEDIUM | Inspector Style tab |

### Category C — Canvas Interaction Gaps

| Capability / Surface | Found in Audit | Missing / Weak in Redesign Direction | Why It Matters | Downgrade Risk | Recommended PRD Section |
|----------------------|---------------|--------------------------------------|---------------|---------------|-------------------------|
| useCanvasElementDrag (reposition) | today_final.md Phase 1 | No screen shows element being dragged on canvas | Core canvas interaction has no visual spec | CRITICAL | Full-editor screens F-series |
| useCanvasMarquee (multi-select drag) | today_final.md Phase 1 | No screen shows marquee in progress | Multi-select by drag is undocumented | HIGH | Canvas interaction screens |
| useCanvasSnapping | today_final.md Phase 1 | Snap guides not shown in any screen | Snap is invisible without visual spec | MEDIUM | Canvas drag screen |
| Canvas overlays — all 8 types | today_final.md Phase 1 | No View dropdown specified | 8 overlay toggles have no home | HIGH | Top bar View dropdown |
| Locked element canvas badge | today_final.md Phase 1 | No canvas overlay for locked state | Locked elements are indistinguishable | HIGH | Canvas overlay spec |
| Empty canvas onboarding | today_final.md Phase 3 (F5) | Not designed anywhere | Blank canvas gives no guidance | HIGH | Canvas empty state screen |

### Category D — Navigation & Rail Gaps

| Capability / Surface | Found in Audit | Missing / Weak in Redesign Direction | Why It Matters | Downgrade Risk | Recommended PRD Section |
|----------------------|---------------|--------------------------------------|---------------|---------------|-------------------------|
| Components tab in rail (⇧A) | today_final.md Phase 1 — RAIL_SLOTS only 8 of 10 | Not in rail | Components are inaccessible | CRITICAL | Rail slot 5 |
| Publish tab in rail (U) | today_final.md Phase 1 — RAIL_SLOTS only 8 of 10 | Not in rail | Publish flow has no entry point | CRITICAL | Rail slot 10 |
| Drill-in breadcrumb | today_final.md Phase 3 (F9) | No breadcrumb spec for Build or Settings drill-in | Users get lost inside drill-in panels | HIGH | All drill-in panels |
| Command palette entry point | today_final.md Phase 3 (F10) | No hint in top bar | New users never discover / key | HIGH | Top bar hint label |

### Category E — CMS / Data Binding Gaps

| Capability / Surface | Found in Audit | Missing / Weak in Redesign Direction | Why It Matters | Downgrade Risk | Recommended PRD Section |
|----------------------|---------------|--------------------------------------|---------------|---------------|-------------------------|
| CollectionManager — schema editor | today_final.md Phase 1 | Collection Setup modal not in modal list | CMS is unusable without collection creation | CRITICAL | Modal M10 |
| CMSBindingManager — per-property bind | today_final.md Phase 1 | Binding UI not specified per property | CMS binding discovery is unclear | HIGH | Inspector Style tab (chain icon per property) |
| Binding broken indicator | today_final.md Phase 1 | No warning state when bound field deleted | Silent broken bindings cause blank content | HIGH | Inspector warning state |
| Collection list accessible from UI | today_final.md Phase 1 | No panel or location specified | Users can't see their collections | HIGH | Dedicated panel or Settings sub-screen |

### Category F — Publish / Export Gaps

| Capability / Surface | Found in Audit | Missing / Weak in Redesign Direction | Why It Matters | Downgrade Risk | Recommended PRD Section |
|----------------------|---------------|--------------------------------------|---------------|---------------|-------------------------|
| Publish checklist hardcoded | today_final.md Phase 3 (F3) / PublishTab.tsx:262–265 | Known bug, not addressed in redesign | Checklist never shows real status | CRITICAL | Publish panel — dynamic checklist |
| ExportEngine format options | today_final.md Phase 1 | Not in Exporter modal spec | Users can't control export format | HIGH | Exporter modal + Settings/Export sub-screen |
| SEOInjector per-page config | today_final.md Phase 1 | Not located in any panel spec | SEO is invisible | HIGH | Pages panel context menu or Settings/Site |
| AnalyticsInjector config | today_final.md Phase 1 | Not in Settings sub-screen spec | Analytics injection has no UI | HIGH | Settings/Analytics sub-screen |
| FormspreeInjector config | today_final.md Phase 1 | Not in Settings sub-screen spec | Form submissions go nowhere | HIGH | Settings/Integrations sub-screen |
| Publish — error state with fallback message | today_final.md Phase 1 | Not designed | Users don't know last successful deploy is still live | MEDIUM | Publish panel error state |

---

## B. TARGET-STATE PRD (SUMMARY)

> **Note:** The full 30-section PRD was generated in the prior session. The session ran out of context before this file was saved. Key decisions and coverage are documented below. The full PRD can be regenerated from today_final.md + this Gap Map using the 30-section structure.

### 30-Section PRD Structure (reference)

1. Product Vision & North Star
2. Target Persona
3. Core User Journey (primary loop)
4. Engine Architecture (29 managers — preserved exactly)
5. Top Bar
6. Left Rail (10 slots)
7. Add / Build Panel
8. Templates Panel
9. Layers Panel
10. Pages Panel
11. Components Panel (NEW — add to rail)
12. Media Panel
13. Design System Panel
14. Settings Panel (7 sub-screens, left nav always visible)
15. History Panel (undo + named snapshots + branching)
16. Publish Panel (NEW — add to rail, dynamic checklist)
17. Canvas & Overlays (8 overlay types, View dropdown)
18. Right Inspector — Layout Tab
19. Right Inspector — Style Tab
20. Right Inspector — Effects Tab (NOT "Behavior")
21. Inspector — Pseudo-States (4 states, always visible)
22. Inspector — Breakpoints (4 breakpoints, synced with top bar)
23. Inspector — Multi-Select Toolbar
24. Inspector — DevMode
25. CMS Layer (CollectionManager + 3 binding managers)
26. Collaboration (OT + presence + cursor sync)
27. AI Subsystem (4 AI managers + entry points)
28. Command Palette (/ key + top bar hint)
29. Keyboard Shortcuts (30+ shortcuts, all discoverable)
30. All 13 Modals

### Key PRD Rules

- All 29 engine managers must have a user-facing surface or documented omission reason
- Inspector must remain context-sensitive (deriveCssContext preserved)
- Third inspector tab = "Effects" (not "Behavior")
- Rail = 10 slots (Components + Publish added)
- Settings = always-visible left nav (not accordion)
- Publish checklist = dynamic (6 items, real conditions)
- CMS binding = per-property chain icon in inspector (not buried)
- Version history = branching tree when >1 branch exists
- All 13 modals explicitly designed

---

## C. WHOLE-EDITOR COVERAGE CHECK

**Purpose:** Systematic comparison — does the Target-State PRD represent every capability from the current-state audit?

**Classification:** ✅ Preserved Exactly | 🔄 Preserved with UX Change | ⚠️ At Risk | ❌ Missing

### Engine Managers (29 total)

| Manager | In Current Audit | In Target PRD | Status | Correction |
|---------|-----------------|---------------|--------|------------|
| ElementManager | ✅ | ✅ | ✅ Preserved | — |
| StyleEngine | ✅ | ✅ | ✅ Preserved | — |
| CommandCenter | ✅ | ✅ | ✅ Preserved (command palette) | — |
| SelectionManager | ✅ | ✅ | ✅ Preserved | — |
| HistoryManager | ✅ | ✅ | ✅ Preserved | — |
| VersionHistoryManager | ✅ | ✅ | 🔄 UX change (add compare/diff) | Add diff overlay to History panel |
| StorageAdapter | ✅ | ✅ | ✅ Preserved (saving indicator) | — |
| Viewport | ✅ | ✅ | ✅ Preserved | — |
| PluginManager | ✅ | ⚠️ | ⚠️ At Risk | Add Settings/Integrations surface |
| DataManager | ✅ | ✅ | ✅ Preserved | — |
| GlobalStyleManager | ✅ | ✅ | ✅ Preserved (Design System panel) | — |
| StyleDataBinding | ✅ | ✅ | ✅ Preserved | — |
| TraitDataBinding | ✅ | ⚠️ | ⚠️ At Risk | Must appear in inspector |
| TextDataBinding | ✅ | ✅ | ✅ Preserved | — |
| TemplateManager | ✅ | ✅ | ✅ Preserved | — |
| CanvasIndicators | ✅ | ✅ | ✅ Preserved (8 overlays) | — |
| ResizeHandler | ✅ | ✅ | ✅ Preserved | — |
| FontManager | ✅ | ✅ | ✅ Preserved (Design System) | — |
| ComponentManager | ✅ | ✅ | 🔄 UX change (add to rail) | Components panel added at rail slot 5 |
| CollectionManager | ✅ | ✅ | ✅ Preserved | — |
| CMSBindingManager | ✅ | ✅ | ✅ Preserved | — |
| CollaborationManager | ✅ | ✅ | ✅ Preserved | — |
| MediaManager | ✅ | ✅ | ✅ Preserved | — |
| FormHandler | ✅ | ⚠️ | ⚠️ At Risk | Inspector surface for form elements needed |
| SyncManager | ✅ | ⚠️ | ⚠️ At Risk | Top bar sync status indicator needed |
| PageRouter | ✅ | ✅ | ✅ Preserved (Pages panel) | — |
| RecoveryManager | ✅ | ❌ | ❌ Missing | Add crash recovery UI spec |
| InteractionManager | ✅ | ✅ | ✅ Preserved (Effects tab) | — |
| DragManager | ✅ | ⚠️ | ⚠️ At Risk | Canvas drag screens must show repositioning |

### AI Subsystem (4 managers)

| Manager | In Audit | In PRD | Status | Correction |
|---------|---------|--------|--------|------------|
| LayoutAnalyzer | ✅ | ✅ | ✅ Preserved | — |
| CodeGenerator | ✅ | ✅ | ✅ Preserved (DevMode) | — |
| ContentWriter | ✅ | ✅ | ✅ Preserved | — |
| PageGenerator | ✅ | ✅ | ✅ Preserved | — |

### Canvas Hooks (20+)

| Hook | In Audit | In PRD | Status | Correction |
|------|---------|--------|--------|------------|
| useCanvasDragDrop | ✅ | ✅ | ✅ Preserved | — |
| useCanvasElementDrag | ✅ | ❌ | ❌ CRITICAL MISSING | Add repositioning screen to canvas F-series |
| useCanvasMarquee | ✅ | ✅ | ✅ Preserved | — |
| useCanvasSnapping | ✅ | ✅ | ✅ Preserved | — |
| useCursorSync | ✅ | ✅ | ✅ Preserved | — |
| useCanvasInlineEdit | ✅ | ✅ | ✅ Preserved | — |
| useCanvasContextMenu | ✅ | ✅ | ✅ Preserved | — |
| useCanvasCommandPalette | ✅ | ✅ | ✅ Preserved | — |
| useCanvasToolbarActions | ✅ | ✅ | ✅ Preserved | — |
| useCanvasInlineCommands | ✅ | ✅ | ✅ Preserved | — |
| useCursorIntelligence | ✅ | ✅ | ✅ Preserved | — |
| useSelectionAnnouncement | ✅ | ✅ | ✅ Preserved | — |

### Rail & Navigation

| Surface | In Audit | In PRD | Status | Correction |
|---------|---------|--------|--------|------------|
| Rail — 10 total slots | ✅ (8 exist) | ✅ | 🔄 UX change | Add Components + Publish |
| Components tab (⇧A) | ✅ | ✅ | 🔄 UX change | Rail slot 5 |
| Publish tab (U) | ✅ | ✅ | 🔄 UX change | Rail slot 10 |
| Ctrl+Shift+A routing | ✅ | ⚠️ | ⚠️ At Risk | Verify no conflict with ⇧A shortcut |

### Inspector

| Surface | In Audit | In PRD | Status | Correction |
|---------|---------|--------|--------|------------|
| Layout tab | ✅ | ✅ | ✅ Preserved | — |
| Style tab | ✅ | ✅ | ✅ Preserved | — |
| Effects tab (mislabeled "Behavior") | ✅ | ✅ | 🔄 UX change | Rename to "Effects" |
| Pseudo-states (4) | ✅ | ✅ | ✅ Preserved | — |
| Breakpoints (4) | ✅ | ✅ | 🔄 UX change (move to top bar) | — |
| Multi-select toolbar | ✅ | ✅ | ✅ Preserved | — |
| DevMode toggle | ✅ | ✅ | ✅ Preserved | — |
| deriveCssContext | ✅ | ⚠️ | ⚠️ At Risk | Must be protected in implementation |
| InspectorEmptyState | ✅ | ✅ | ✅ Preserved | — |
| TraitDataBinding | ✅ | ⚠️ | ⚠️ At Risk | Must appear in inspector |
| Delete with confirmation | ✅ | ❌ | ❌ CRITICAL MISSING | Add inspector delete path with confirmation |

### Shortcuts (30+)

| Shortcut | In Audit | In PRD | Status | Correction |
|----------|---------|--------|--------|------------|
| Full shortcut set | ✅ | ✅ | ✅ Preserved | — |
| Keyboard Shortcuts modal (?) | ✅ | ✅ | ✅ Preserved | — |
| Rail icon tooltips show shortcut | ✅ | ✅ | ✅ Preserved | — |

### Canvas Overlays (8)

| Overlay | In Audit | In PRD | Status | Correction |
|---------|---------|--------|--------|------------|
| Spacing indicators | ✅ | ✅ | ✅ Preserved | — |
| Guides | ✅ | ✅ | ✅ Preserved | — |
| Grid | ✅ | ✅ | ✅ Preserved | — |
| Element badges | ✅ | ✅ | ✅ Preserved | — |
| X-ray | ✅ | ✅ | ✅ Preserved | — |
| Outlines | ✅ | ✅ | ✅ Preserved | — |
| Rulers | ✅ | ✅ | ✅ Preserved | — |
| showComponentView | ✅ | ✅ | ✅ Preserved | — |
| Locked element badge | ✅ | ⚠️ | ⚠️ At Risk | Must be in overlay spec |

### Modals (13)

| Modal | In Audit | In PRD | Status | Correction |
|-------|---------|--------|--------|------------|
| Templates (M1) | ✅ | ✅ | ✅ | — |
| Save Template (M2) | ✅ | ✅ | ✅ | — |
| Exporter (M3) | ✅ | ✅ | ✅ | — |
| AIAssistantBar (M4) | ✅ | ✅ | ✅ | — |
| AI Copilot (M5) | ✅ | ✅ | ✅ | — |
| Keyboard Shortcuts (M6) | ✅ | ✅ | ✅ | — |
| Media Library from inspector (M7) | ✅ | ✅ | ✅ | — |
| Image Editor (M8) | ✅ | ✅ | ✅ | — |
| Icon Picker (M9) | ✅ | ❌ | ❌ Missing | Add to modal list |
| Collection Setup (M10) | ✅ | ✅ | ✅ | — |
| Create Component (M11) | ✅ | ✅ | ✅ | — |
| Project Settings (M12) | ✅ | ✅ | ✅ | — |
| Upgrade Modal (M13) | ✅ | ✅ | ✅ | — |

### Coverage Summary

**15 Missing (❌):**
- M1: useCanvasElementDrag (CRITICAL P0)
- M2: Components panel in rail
- M3: Publish panel in rail
- M4: Version diff comparison
- M5: Delete confirmation from inspector (CRITICAL P0)
- M6: Locked element canvas badge
- M7: Discovery tab fix or remove
- M8: OT conflict resolution policy UI
- M9: TraitDataBinding in inspector
- M10: Icon Picker modal
- M11: Plugin system surface
- M12: FormHandler inspector surface
- M13: RecoveryManager UI
- M14: SyncManager status indicator
- M15: AnalyticsInjector / FormspreeInjector Settings sub-screens

**13 At Risk (⚠️):**
- R1: TraitDataBinding location unclear
- R2: deriveCssContext not explicitly protected
- R3: Ctrl+Shift+A routing conflict
- R4: CMS binding burial risk
- R5: Effects tab GSAP simplification
- R6: DevMode removal risk
- R7: 8 overlay types scattered
- R8: Version history branching flattened
- R9: Collaboration cursor interference
- R10: Settings accordion vs left nav
- R11: Multiple box shadows simplified
- R12: TextDataBinding burial
- R13: Command palette discoverability

---

## D. STITCH HANDOFF BRIEF

### D.1 — PRODUCT IDENTITY

**What it is:** A browser-based drag-and-drop visual web builder. Users build websites on a canvas. They can drag elements onto pages, style them visually, bind data to them via CMS collections, publish multi-page sites with custom domains, collaborate in real time, and export clean production HTML/CSS.

**Who it is for:** Web designers and small-business owners who want production-quality output without writing code. Power users include freelance designers managing multiple client sites. They expect Figma-like precision combined with Webflow-like publishing capability.

**Core user task:** Select an element on canvas → style it in the right inspector → publish. Everything else is secondary to this loop.

**What already exists and must not be lost:**
- 29 engine managers (all production-active, no dead code)
- 20+ canvas interaction hooks (drag, marquee, snap, guides, inline edit, context menu, command palette)
- Right inspector with 20+ sections across 3 tabs, pseudo-states, breakpoint switching, multi-select toolbar
- CMS layer: CollectionManager + CMSBindingManager + StyleDataBinding + TraitDataBinding + TextDataBinding
- AI subsystem: LayoutAnalyzer + CodeGenerator + ContentWriter + PageGenerator
- Version history: HistoryManager (undo/redo) + VersionHistoryManager (named snapshots, branching)
- Collaboration: CollaborationManager with OT + PresenceIndicators + cursor sync
- Export: ExportEngine.exportAllPages() + AnalyticsInjector + AssetBundler + SEOInjector + FormspreeInjector
- Command palette (/) + 30+ keyboard shortcuts
- 7 canvas overlay types + showComponentView mode
- 13 modals (full list in D.8)

---

### D.2 — ANTI-DOWNGRADE RULE

**Do not simplify the product by hiding or removing advanced editor capability.**

This rule applies to every screen in this brief. Specific applications:
- Do not remove inspector sections — reorganize them, but preserve every control
- Do not hide breakpoint controls behind more clicks than today
- Do not collapse pseudo-state selectors unless they remain 1-click away
- Do not merge sidebar panels in a way that buries any existing panel
- Do not remove any canvas overlay toggle
- Do not remove version history branching UI
- Do not remove CMS binding controls from the inspector
- Do not remove collaboration presence indicators
- Do not shorten the command palette or keyboard shortcut set
- Do not remove the DevMode toggle from the inspector
- Advanced sections (SEO, Analytics, Forms, Integrations) must remain visible in the Settings panel, not hidden behind a "Pro" gate in the redesigned UI

---

### D.3 — EXACT UX PROBLEMS TO SOLVE

**F1 — Inspector tab mislabeled.** Third tab reads "Behavior" — must read "Effects."

**F2 — Components + Publish missing from left rail.** Fix: add both. Components (⇧A) at slot 5, Publish (U) at slot 10.

**F3 — Publish checklist always shows false.** Fix: dynamic checklist with 6 real conditions.

**F4 — Discovery tab in Media is disabled.** Fix: make functional OR remove. No disabled-but-visible tabs.

**F5 — No empty state for canvas.** Fix: empty canvas shows "Drag an element from the Add panel or start from a template."

**F6 — History tab shows no visual diff.** Fix: [Compare] per snapshot → diff overlay.

**F7 — No in-canvas feedback when element is locked.** Fix: lock badge on canvas overlay, toast on click.

**F8 — Settings sub-navigation not scannable.** Fix: always-visible left nav with 7 items.

**F9 — No breadcrumb on drill-in panels.** Fix: breadcrumb row "Settings / Analytics" with ← Back.

**F10 — Command palette has no discoverability entry point.** Fix: "Press / for commands" in top bar.

---

### D.4 — EXACT UI HIERARCHY CHANGES

#### Top Bar (52px height, full width)

```
[Logo] [Project name ▾] | [Undo] [Redo] | [/ cmd hint] | ← spacer → | [Breakpoint: Mobile|Tablet|Desktop|Wide] | [Preview] | [Collab avatars] | [Publish ▾]
```

Changes from current:
- Add project name (editable inline)
- Move breakpoint switcher into top bar
- Add collaboration avatar row
- Publish = split button [Publish] | [▾ → settings / schedule / version history]
- Keyboard shortcut hint for command palette

#### Left Rail (56px wide)

**10 slots (top to bottom):**
1. Add/Build — A
2. Templates — T
3. Layers — Z
4. Pages — P
5. Components — ⇧A ← ADD
6. Media — J
7. Design System — D
8. Settings — S
9. History — H
10. Publish — U ← ADD

---

### D.5 — EXACT SURFACES TO REDESIGN

#### Surface 1: Add / Build Panel (A)
Header "Add" | Search | Insertion context banner (contextual) | Onboarding tip | Element categories accordion | Favorites zone (bottom, collapsible) | Tips footer

**States:** default | searching | empty search | inserting (context banner active)

#### Surface 2: Templates Panel (T)
Header | Search | Category filter pills | 2-column grid | Template hover (preview + Use Template) | Empty state

**States:** default | searching | empty | loading skeleton

#### Surface 3: Layers Panel (Z)
Header | Search | Tree view (nested, indented) | Per-row: visibility toggle, lock toggle, name (editable)

**Must preserve:** drag-to-reorder, multi-select in tree, component boundary indicator, inline name edit

**States:** default | element selected | locked | hidden | empty

#### Surface 4: Pages Panel (P)
Header | + Add Page | Page list (name, slug, SEO badge, ⋮ menu) | Drag to reorder

**States:** default | renaming | context menu open | empty

#### Surface 5: Components Panel (⇧A) — CURRENTLY MISSING
Header | Search | + Create Component | Component list (name, thumbnail, usage count) | Per-row: Edit, Detach, Delete

**States:** default | empty (CTA: "Select elements on canvas to create a reusable component") | searching | component edit mode active (banner on canvas)

#### Surface 6: Media Panel (J)
Header | Subtitle | Source toggle [My Library][Discovery] | Type pills | Search (Library only) | Grid (2–4 col) | Upload zone (bottom) | Tip footer

**States:** default | empty library (onboarding) | uploading | searching | selection mode | Discovery view | storage full | drag-over overlay

#### Surface 7: Design System Panel (D)
Header | Tabs [Colors][Typography][Spacing][Tokens] | Token list per tab | Edit inline | Add new

**States:** default (colors) | typography | spacing | token edit | add new | delete with usage warning

#### Surface 8: Settings Panel (S)
Header | **Always-visible left nav (7 items)** | Content area

**Left nav (always visible):** Site | Export | Analytics | Domains | Integrations | Advanced | Locked

**States:** default (Site) | each of 7 sub-screens | breadcrumb showing "Settings / [name]"

#### Surface 9: History Panel (H)
Header | Undo/Redo buttons | Session action list | Named snapshots section | + Create Snapshot | Per-snapshot: name, timestamp, author, [Restore][Compare][Delete]

**States:** default | empty | branch tree view | compare overlay | creating snapshot

#### Surface 10: Publish Panel (U) — CURRENTLY MISSING
Header | **Dynamic checklist (6 items)** | Publish status | [Publish] CTA | [Publish settings ▾] | Deploy log

**Dynamic checklist:**
- Domain connected (✅ / ⚠️ → link to Settings/Domains)
- SSL active
- SEO title set on all pages (X of Y missing)
- No broken links (X found)
- Assets optimized (X large images)
- Unsaved changes (N unsaved)

**States:** ready | warnings | publishing in progress | published success | error | offline

#### Surface 11: Canvas
Full remaining width × full height. All 20+ hooks. 8 overlay types via View dropdown.

**Canvas toolbar (above selected element):** Move | Resize | Align | Distribute | Lock | Delete | Duplicate | [⋮ → context menu]

**Empty state (F5 fix):** Center of canvas: illustration + "Start building" + [Browse Templates] + hint text

**States:** empty | element selected | multi-select | marquee in progress | element being dragged | inline text edit | component edit mode | locked element clicked | collaboration cursors visible

#### Surface 12: Right Inspector
280–400px wide | Sub-nav [Layout][Style][Effects] | Pseudo-state selector | Breakpoint selector | 20+ sections | DevMode toggle | Multi-select toolbar | InspectorEmptyState

**Tab 1 — Layout:** Display | Position + offsets | Size | Flex/Grid (contextual) | Margin/Padding | Z-index | Transform

**Tab 2 — Style:** Background (color/image/gradient/video) | Border (width/style/color/radius per corner) | Box shadow (multiple) | Text | Opacity | Cursor | Visibility | CMS binding panel

**Tab 3 — Effects (NOT "Behavior"):** Filter | Backdrop filter | Blend mode | CSS transitions | CSS animations (GSAP) | Interaction triggers

**Pseudo-state selector (always visible):** :default | :hover | :focus | :active

**Breakpoint selector (synced with top bar):** Mobile | Tablet | Desktop | Wide

**Multi-select toolbar:** Count badge | Align (6) | Distribute (2) | Match size (2) | Group | Delete all

**DevMode toggle:** Visual mode ↔ read-only CSS output

**InspectorEmptyState:** "Select an element to edit its properties"

**States:** nothing selected (empty state) | element selected | pseudo-state active | breakpoint override active | multi-select | DevMode | CMS binding panel open

#### Surface 13: CMS Layer
**13a — Collection Setup modal:** Collection name + schema editor (field types: Text/Rich Text/Number/Image/URL/Boolean/Reference) | Create/Edit/Delete | Preview mode

**13b — CMS binding (within inspector):** Chain icon per bindable property | When active: dropdown showing collection fields | Binding active = field name shown

**13c — Collection list:** Name, field count, record count, last modified | Add/Edit/Delete

#### Surface 14: Collaboration
**Presence avatars (top bar):** Up to 5, +N overflow | Hover: name + activity | Click: pan to cursor

**Cursor sync (canvas layer):** Colored arrows with name labels | Fade after 30s inactive

**OT conflict toast:** "Merged with [user]'s changes" — informational, non-blocking

#### Surface 15: AI Subsystem
**AIAssistantBar:** Text input for page generation | Triggers PageGenerator/ContentWriter/LayoutAnalyzer

**AI Copilot panel:** Chat interface | Commands: Generate section / Rewrite copy / Analyze layout / Suggest improvements

**Per-element context menu:** "Rewrite copy with AI" | "Generate variants" | "Suggest styling"

**AI states:** idle | thinking (spinner + "Analyzing…") | result ready (preview) | error | result inserted

#### Surface 16: Command Palette
Trigger: / key anywhere. 600px wide modal, centered. Search input + grouped results.

**Categories:** Elements | Actions | Navigation | Settings | AI | Help

**States:** open/idle (recent commands) | typing | no results | action executing

#### Surface 17: Context Menus
**17a — Canvas element:** Cut/Copy/Paste/Duplicate/Select parent/Select children/Lock/Hide/Z-order/Add to components/Save as template/Delete (separated)

**17b — Empty canvas:** Paste/Select all/Add element here (submenu)/Paste in place

**17c — Layers panel:** Same as 17a + Rename

**17d — Pages panel:** Rename/Duplicate/Delete/Set as homepage/Copy page URL

#### Surface 18: Breakpoint Controls
**Primary location:** Top bar breakpoint row (4 buttons always visible)

**4 breakpoints:** Mobile 320px | Tablet 768px | Desktop 1280px | Wide 1920px

**Inspector behavior:** Breakpoint-specific overrides show colored dot indicator. Inherited values shown greyed. × per property to clear override.

#### Surface 19: Pseudo-States
**Location:** Inspector header row (above 3 tabs)

**4 states:** :default | :hover | :focus | :active

**Canvas preview:** Selecting :hover shows element's hover appearance on canvas.

#### Surface 20: Multi-Select & Selection States
**Trigger:** Marquee drag | Shift+click | Cmd+click

**Multi-select toolbar:** Count badge | Align L/C/R/T/M/B | Distribute H/V | Match W/H | Group | Delete

**Visual states:** Single = blue 8-handle | Multi = dashed bounding box | Component = purple handles | Locked = grey handles, no resize | Nested = breadcrumb in toolbar

---

### D.6 — GLOBAL STATE VARIANTS

| State | What to Show |
|-------|-------------|
| Empty | Onboarding CTA, no blank white space |
| Loading | Skeleton screens (not spinners) for lists |
| Saving | Small "Saving…" label in top bar (non-blocking) |
| Saved | "Saved ✓" for 2s in top bar |
| Error | Inline error with message + retry. No generic errors. |
| Offline | Yellow banner below top bar: "No connection. Changes saved locally." |
| Publish in progress | Top bar: spinner + "Publishing…" |
| Publish success | Top bar: "Published ✓ — View site ↗" |
| Publish error | In-panel error + "Last successful deploy is still live." |
| Conflict (OT) | Toast: "Merged with [user]'s change" — non-blocking |
| Storage full | Upload zone disabled, upgrade prompt |

---

### D.7 — INTERACTION REQUIREMENTS

1. **Drag from sidebar to canvas** — ghost follows cursor. Invalid drop = snap-back + toast.
2. **Inline text edit** — double-click → edit mode border + inline format bar. Click outside → exits.
3. **Resize handles** — 8 handles. Shift = proportional. Alt = from center. None on locked elements.
4. **Component editing mode** — canvas dims non-component elements, banner "Editing [Name] | Done".
5. **Undo/Redo** — always active. Top bar buttons disabled when stack empty.
6. **Keyboard shortcut layer** — shortcut opens panel OR triggers action. Visible on rail icon tooltips.
7. **Panel collapse** — sidebar collapses to icon-only rail. Persistent expand = pin button.
8. **Inspector width** — draggable resize handle (280px min, 400px max).
9. **Scroll behavior** — panels, canvas, inspector all scroll independently.
10. **Focus management** — all modals trap focus. Close returns focus to trigger element. All elements Tab-reachable.

---

### D.8 — ALL 13 MODALS

| # | Modal | Trigger | Purpose |
|---|-------|---------|---------|
| M1 | Templates | Rail T / empty canvas state | Browse + insert page templates |
| M2 | Save Template | Canvas context menu | Save selection as template |
| M3 | Exporter | Settings/Export or top bar | Export as HTML/ZIP |
| M4 | AIAssistantBar | Top bar / / key | AI generation input |
| M5 | AI Copilot | Top bar icon | Chat-based AI assistant |
| M6 | Keyboard Shortcuts | Help menu / ? key | Full shortcut reference |
| M7 | Media Library (inspector) | Style tab → image input | Browse/select from library |
| M8 | Image Editor | Media Library → edit | Crop, adjust, filter |
| M9 | Icon Picker | Build panel / inspector | Browse + select Lucide icons |
| M10 | Collection Setup | CMS binding / Settings | Define collection schema |
| M11 | Create Component | Canvas context menu | Name + create reusable component |
| M12 | Project Settings | Top bar → project name | Site name, meta, favicon |
| M13 | Upgrade Modal | Storage limit / Pro feature | Upgrade prompt (only at genuine limits) |

---

### D.9 — DESIGN TOKEN CONSTRAINTS

- **Surfaces:** `--aqb-surface-1` (darkest) through `--aqb-surface-5` (lightest)
- **Panel background:** `--aqb-surface-2`
- **Canvas background:** `--aqb-surface-1`
- **Primary accent:** `#6366f1` (indigo)
- **Text:** `--aqb-text-primary` / `--aqb-text-secondary` / `--aqb-text-muted` / `--aqb-text-disabled`
- **Semantic:** green (success) / amber (warning) / red (error) / blue (info) — all WCAG AA
- **Spacing:** 4px base scale
- **Border radius:** 4px inputs, 8px panels/modals, 2px badges
- **Min text size:** 12px anywhere
- **Dark mode only** (`--aqb-surface-1` through `--aqb-surface-5`)

---

### D.10 — STITCH SCREEN LIST

**Full editor (1440×900):** F1–F7 (default, nothing selected, multi-select, mobile BP, component edit, collaboration, empty canvas)

**Sidebar panels (280×900):** S1–S17 (all 10 panels + key states for Media, Publish, History)

**Inspector (280×700):** I1–I9 (Layout, Style, Effects, hover state, BP override, CMS binding, DevMode, multi-select, empty)

**Modals (600×400–700):** M1–M13 (all 13 modals)

**Canvas overlays (1440×900):** O1–O4 (spacing indicators, grid, outlines, x-ray)

---

### D.11 — WHAT STITCH MUST NOT DO

1. Do not generate a "simple" or "minimal" version.
2. Do not hide panels behind feature-flag gates.
3. Do not replace left rail with hamburger menu.
4. Do not replace 3-tab inspector with flat panel.
5. Do not remove pseudo-state or breakpoint selectors.
6. Do not use light mode — all screens are dark mode.
7. Do not invent new panels — redesign the 10 existing ones.
8. Do not relocate CMS binding controls out of the inspector.
9. Do not replace canvas context menu with floating toolbar only — both must exist.
10. Do not remove the DevMode toggle.

---

## E. ANTI-DOWNGRADE VALIDATION CHECKLIST

**Purpose:** Acceptance gate. Every P0 item must pass before redesign is sent to implementation.

**Classifications:**
- ✅ PRESERVED EXACTLY — Same location, same controls, same discoverability
- 🔀 PRESERVED BUT RELOCATED — Capability exists, location changed and documented
- ⚠️ BEHAVIOR UNCLEAR — Visual exists but how it works is ambiguous
- ❌ AT RISK — Reduced, hidden, merged away
- 🚫 MISSING — Not found anywhere

---

### E.1 — CMS

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| CMS-1 | Create collection + schema editor | ☐ | Collection Setup modal (M10) must be present |
| CMS-2 | Edit existing collection schema | ☐ | Edit action on collection row |
| CMS-3 | Bind element property to collection field (≤2 clicks) | ☐ | Chain icon per property in inspector |
| CMS-4 | StyleDataBinding — bind background/color/opacity | ☐ | Visible and labeled in inspector |
| CMS-5 | TraitDataBinding — bind href/src/alt/data-* | ☐ | Must appear in inspector |
| CMS-6 | TextDataBinding — bind text content | ☐ | Appears when text element selected |
| CMS-7 | Binding broken indicator | ☐ | Warning state in inspector when field deleted |
| CMS-8 | Collection list — view all collections | ☐ | Accessible from somewhere in UI |
| CMS-9 | Collection delete with impact warning | ☐ | "Used in X elements. Bindings will break." |
| CMS-10 | CMS preview mode (sample data) | ☐ | Collection Setup modal shows preview |

### E.2 — Collaboration

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| COL-1 | Presence avatars in top bar (up to 5, +N) | ☐ | Not in Settings — in top bar |
| COL-2 | Avatar hover — name + activity | ☐ | Full name + "editing [element]" |
| COL-3 | Avatar click — pan to cursor | ☐ | Must pan canvas |
| COL-4 | Cursor sync on canvas | ☐ | Colored arrows with name labels |
| COL-5 | OT conflict toast — non-blocking | ☐ | Not a modal. Toast only. |
| COL-6 | Collaborator offline indicator | ☐ | Greyed avatar |
| COL-7 | OT policy documented in UI | ☐ | "Changes merged automatically" visible |
| COL-8 | Cursors don't interfere with canvas interactions | ☐ | Separate canvas layer |

### E.3 — AI

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| AI-1 | AIAssistantBar — page generation | ☐ | Top bar or command palette |
| AI-2 | LayoutAnalyzer — suggest layout changes | ☐ | AI Copilot or context menu |
| AI-3 | CodeGenerator | ☐ | DevMode or AI Copilot |
| AI-4 | ContentWriter — fill placeholder copy | ☐ | Canvas context menu on text |
| AI-5 | PageGenerator — preview before insert | ☐ | Result must not auto-insert |
| AI-6 | AI Copilot panel | ☐ | 4 commands present |
| AI-7 | AI thinking/error states | ☐ | 3 states required |
| AI-8 | Per-element AI in context menu | ☐ | 3 AI options in context menu |

### E.4 — Version History

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| VH-1 | Undo/redo in top bar + keyboard | ☐ | Buttons disabled when stack empty |
| VH-2 | Action list with labeled actions (not timestamps) | ☐ | "Added Text" not "10:42:31 AM" |
| VH-3 | Create named snapshot | ☐ | + Create Snapshot button |
| VH-4 | Restore snapshot with confirmation | ☐ | Confirmation modal required |
| VH-5 | Delete snapshot with confirmation | ☐ | — |
| VH-6 | Branch tree diagram when >1 branch | ☐ | Not a flat list |
| VH-7 | Version diff comparison | ☐ | [Compare] → before/after overlay |
| VH-8 | Snapshot author shown | ☐ | Per-row |
| VH-9 | Publish split button → version history link | ☐ | In dropdown |

### E.5 — Export / Publish

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| EX-1 | ExportEngine.exportAllPages() from UI | ☐ | Exporter modal (M3) |
| EX-2 | AssetBundler — include assets option | ☐ | Checked by default |
| EX-3 | AnalyticsInjector config (GA4/Plausible/custom) | ☐ | Settings/Analytics sub-screen |
| EX-4 | FormspreeInjector config | ☐ | Settings/Integrations sub-screen |
| EX-5 | SEOInjector per-page | ☐ | Pages panel or Settings/Site |
| EX-6 | Dynamic publish checklist (6 items) | ☐ | CRITICAL — no hardcoded states |
| EX-7 | Domain connected status | ☐ | Links to Settings/Domains |
| EX-8 | SSL status | ☐ | Real state |
| EX-9 | Published URL with copy + open | ☐ | After successful publish |
| EX-10 | Schedule publish | ☐ | Publish split button dropdown |
| EX-11 | Recent deploy log | ☐ | Timestamp, author, version link |
| EX-12 | Publish error + fallback message | ☐ | "Last successful deploy is still live" |
| EX-13 | Export format options | ☐ | Exporter modal + Settings/Export |

### E.6 — Command Palette

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| CP-1 | / key works from canvas AND panels | ☐ | Not canvas-only |
| CP-2 | "Press / for commands" hint in top bar | ☐ | Always visible |
| CP-3 | Search — elements by name | ☐ | — |
| CP-4 | Search — actions | ☐ | undo/redo/delete/duplicate/group/lock/hide |
| CP-5 | Search — navigation | ☐ | "Go to [page]" / "Open [panel]" |
| CP-6 | Search — settings sub-screens | ☐ | "Open Analytics settings" works |
| CP-7 | Search — AI commands | ☐ | Generate/Rewrite/Analyze |
| CP-8 | "shortcut" → shows all shortcuts | ☐ | Links to M6 |
| CP-9 | Arrow/Enter/Escape keyboard navigation | ☐ | — |
| CP-10 | Results grouped by category | ☐ | Not a flat list |

### E.7 — Keyboard Shortcuts

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| KS-1 | 30+ shortcuts in M6 modal | ☐ | Grouped by category |
| KS-2 | Shortcut tooltips on all rail icons | ☐ | Icon name + key |
| KS-3 | Ctrl+Z / Ctrl+Shift+Z global | ☐ | Works in canvas + panels |
| KS-4 | / opens palette anywhere | ☐ | — |
| KS-5 | Escape behavior layered | ☐ | overlay → deselect → exit text edit |
| KS-6 | ⇧A (Components) — no conflict | ☐ | Verify vs. Select All |
| KS-7 | Delete key + confirmation for children | ☐ | — |
| KS-8 | Ctrl+D duplicate | ☐ | — |
| KS-9 | Ctrl+G group | ☐ | — |
| KS-10 | ? opens M6 | ☐ | Works anywhere |

### E.8 — Canvas Overlays

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| OV-1 | Spacing indicators toggle (View dropdown) | ☐ | — |
| OV-2 | Guides toggle (View dropdown) | ☐ | — |
| OV-3 | Grid toggle (View dropdown) | ☐ | — |
| OV-4 | Element badges toggle (View dropdown) | ☐ | — |
| OV-5 | X-ray mode toggle (View dropdown) | ☐ | — |
| OV-6 | Outlines toggle (View dropdown) | ☐ | — |
| OV-7 | Rulers toggle (View dropdown) | ☐ | — |
| OV-8 | showComponentView — auto, not View dropdown | ☐ | Component isolation on edit |
| OV-9 | Locked element badge on canvas | ☐ | Lock icon overlay |
| OV-10 | All 8 accessible from View dropdown in top bar | ☐ | Not scattered |

### E.9 — Multi-Select & Selection

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| MS-1 | Marquee drag multi-select | ☐ | Dashed rect visible during drag |
| MS-2 | Shift+click add to selection | ☐ | Count badge updates |
| MS-3 | Cmd+click add/remove | ☐ | — |
| MS-4 | Multi-select toolbar — Align (6) | ☐ | L/C/R/T/M/B |
| MS-5 | Multi-select toolbar — Distribute (2) | ☐ | H/V |
| MS-6 | Multi-select toolbar — Match size (2) | ☐ | W/H |
| MS-7 | Multi-select toolbar — Group | ☐ | Ctrl+G |
| MS-8 | Multi-select toolbar — Delete all | ☐ | Count confirmation |
| MS-9 | Multi = dashed box, no individual handles | ☐ | Single has 8 handles |
| MS-10 | Component = purple handles + Edit button | ☐ | — |
| MS-11 | Locked = grey handles, no resize | ☐ | — |
| MS-12 | Nested = breadcrumb in canvas toolbar | ☐ | "Section > Column > Text" |

### E.10 — Drag & Drop

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| DD-1 | Drag from Add panel to canvas (ghost) | ☐ | — |
| DD-2 | Drag element to reposition on canvas | ☐ | CRITICAL — must be shown in F-series |
| DD-3 | Snap guides visible during drag | ☐ | — |
| DD-4 | Invalid drop = snap-back + toast | ☐ | "Drop inside a section" |
| DD-5 | Drag to reorder in Layers tree | ☐ | Drop indicator line |
| DD-6 | Drag to reorder in Pages panel | ☐ | — |
| DD-7 | Drag media to canvas from Media panel | ☐ | — |
| DD-8 | Drag file from OS to Media panel | ☐ | "Drop to upload" overlay |

### E.11 — Breakpoints

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| BP-1 | 4 breakpoints in top bar (not hidden) | ☐ | All 4 visible, not in dropdown |
| BP-2 | Breakpoint switcher primary = top bar | ☐ | Canvas-level control |
| BP-3 | Canvas viewport changes width | ☐ | Narrower/wider frame |
| BP-4 | Inspector shows breakpoint overrides | ☐ | Colored dot per override |
| BP-5 | Clear override per property (× button) | ☐ | — |
| BP-6 | Inspector + top bar always in sync | ☐ | Both show same active state |

### E.12 — Pseudo-States

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| PS-1 | 4 pseudo-states as visible selector row | ☐ | Not in a dropdown |
| PS-2 | Selector always visible when element selected | ☐ | Not behind toggle |
| PS-3 | Canvas previews pseudo-state | ☐ | :hover shows hover appearance |
| PS-4 | Override indicator dot per property | ☐ | — |
| PS-5 | Clear override per property | ☐ | × button |

### E.13 — Advanced Inspector Controls

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| AI-INS-1 | Display: block/flex/grid/inline | ☐ | Not behind "Advanced" |
| AI-INS-2 | Flex/Grid controls contextual | ☐ | Appear when display = flex/grid |
| AI-INS-3 | Position + offsets | ☐ | 5 position types |
| AI-INS-4 | Box shadow — multiple | ☐ | Not single only |
| AI-INS-5 | Background — 4 types | ☐ | color/image/gradient/video |
| AI-INS-6 | Border radius per corner | ☐ | Individual corners |
| AI-INS-7 | Effects tab labeled "Effects" (not "Behavior") | ☐ | CRITICAL rename |
| AI-INS-8 | CSS transitions (full editor) | ☐ | property/duration/easing/delay |
| AI-INS-9 | CSS animations (GSAP) | ☐ | Not simplified to CSS-only |
| AI-INS-10 | Interaction triggers (hover/click/scroll → GSAP) | ☐ | — |
| AI-INS-11 | Filter controls (5 types) | ☐ | blur/brightness/contrast/saturate/hue-rotate |
| AI-INS-12 | Backdrop filter | ☐ | Separate from filter |
| AI-INS-13 | DevMode toggle | ☐ | In inspector header |
| AI-INS-14 | deriveCssContext — context-sensitive sections | ☐ | Inspector adapts to element type |
| AI-INS-15 | InspectorEmptyState | ☐ | Not blank white panel |
| AI-INS-16 | TraitDataBinding in inspector | ☐ | Attributes section or equivalent |

### E.14 — Context Menus

| # | Capability | Classification | Notes |
|---|-----------|---------------|-------|
| CTX-1 | Canvas element — full menu (12 items) | ☐ | All items present |
| CTX-2 | Empty canvas — paste + select all | ☐ | — |
| CTX-3 | Separator above Delete | ☐ | Destructive action separated |
| CTX-4 | Disabled items greyed (not hidden) | ☐ | — |
| CTX-5 | Layers panel context menu | ☐ | Same as canvas + Rename |
| CTX-6 | Pages panel context menu | ☐ | 5 items |
| CTX-7 | Media panel context menu | ☐ | 4 items |
| CTX-8 | Delete with children — confirmation | ☐ | "Also deletes X children" |
| CTX-9 | Z-order submenu (4 options) | ☐ | — |

### E.15–E.20 — Surfaces Quick Check

| Surface | Rail Slot | P0 Checks |
|---------|-----------|-----------|
| Templates | Slot 2 | Category filter + hover preview + Use Template CTA |
| Components | Slot 5 (ADD) | Panel present in rail + usage count per component |
| Media | Slot 6 | Discovery fixed/removed + selection mode + empty state |
| Settings | Slot 8 | Always-visible left nav (not accordion) + all 7 sub-screens |
| History | Slot 9 | Branch tree + Compare action + action labels (not timestamps) |
| Publish | Slot 10 (ADD) | Panel present in rail + dynamic checklist (6 items) |
| Canvas | — | Drag-to-reposition screen + empty state + 8 overlays in View dropdown |
| Inspector | — | "Effects" label + pseudo-state row + breakpoint selector + DevMode |

---

## E.A — MISSING CAPABILITY LIST (P0/P1/P2)

| # | Capability | Severity |
|---|-----------|----------|
| M1 | Canvas drag to reposition element | P0 CRITICAL |
| M2 | Components panel in rail | P0 |
| M3 | Publish panel in rail | P0 |
| M4 | Version diff comparison | P0 |
| M5 | Delete confirmation from inspector | P0 CRITICAL |
| M6 | Locked element canvas badge | P1 |
| M7 | Discovery tab — fix or remove | P1 |
| M8 | OT conflict resolution policy UI | P1 |
| M9 | TraitDataBinding in inspector | P1 |
| M10 | Icon Picker modal (M9) | P1 |
| M11 | Plugin system user-facing surface | P2 |
| M12 | FormHandler inspector surface | P2 |
| M13 | RecoveryManager UI | P2 |

---

## E.B — HIDDEN / RISKY CAPABILITY LIST

| # | Capability | Risk | Mitigation |
|---|-----------|------|-----------|
| R1 | Breakpoint switcher relocation | Must remain 1-click in top bar | Verify top bar row always visible |
| R2 | deriveCssContext | Stitch may use flat inspector | Verify inspector varies by element type |
| R3 | Ctrl+Shift+A routing conflict | ⇧A may conflict with Select All | Validate shortcut in implementation |
| R4 | CMS binding controls | May be buried behind "Advanced" | Chain icon per property, no extra clicks |
| R5 | Effects tab GSAP animations | May be simplified to CSS-only | Verify GSAP controls present |
| R6 | DevMode toggle | May be omitted | Must be in inspector header |
| R7 | 8 canvas overlay types | May be scattered | All 8 in View dropdown, top bar |
| R8 | Version history branching | May be flattened | Tree diagram required |
| R9 | Collaboration cursor sync | May interfere with canvas | Separate canvas layer |
| R10 | Settings 7 sub-screens | Accordion is a fail | Left nav always visible |
| R11 | Multiple box shadows | May show single only | Multi-shadow support required |
| R12 | TextDataBinding | May not appear contextually | Must appear for text elements |
| R13 | Command palette entry point | New users don't know / key | Top bar hint required |

---

## E.C — REQUIRED CORRECTIONS BEFORE ACCEPTANCE

**C1 — Add Components panel to rail (P0)** — 10-slot rail required.
**C2 — Add Publish panel to rail (P0)** — 10-slot rail required.
**C3 — Show canvas element drag (P0)** — F-series screen with ghost + snap guides.
**C4 — Dynamic publish checklist (P0)** — No hardcoded states. 6 real conditions.
**C5 — Version diff compare screen (P0)** — [Compare] per snapshot + diff overlay.
**C6 — Discovery tab fixed or removed (P1)** — No disabled-but-visible tabs.
**C7 — Effects tab labeled "Effects" (P1)** — Any "Behavior" label = fail.
**C8 — Settings left nav always visible (P1)** — Accordion = fail.
**C9 — Locked element canvas badge (P1)** — Lock icon overlay on canvas.
**C10 — Command palette hint in top bar (P1)** — "Press / for commands."
**C11 — TraitDataBinding in inspector (P1)** — Cannot be absent.
**C12 — Delete confirmation for children (P0)** — "Also deletes X children" modal.
**C13 — All 13 modals designed (P1)** — Icon Picker (M9) must be included.

---

## E.D — FINAL ACCEPTANCE RULE

**A redesign that is cleaner but functionally weaker must be rejected.**

> **ACCEPTED** if and only if:
> Every capability in E.1–E.20 is classified as PRESERVED EXACTLY or PRESERVED BUT RELOCATED — with all relocated capabilities having a documented, equally discoverable new location.

> **REJECTED** if:
> - Any P0 capability is MISSING or AT RISK
> - Any P1 capability is MISSING without a correction plan
> - Any inspector section is removed (not reorganized)
> - Rail has fewer than 10 slots
> - Effects tab reads "Behavior"
> - Settings uses an accordion instead of left nav
> - Any canvas overlay is inaccessible from View dropdown
> - Publish checklist items are hardcoded
> - Discovery tab remains disabled without a resolution

> **Visual improvement does not compensate for capability loss.**

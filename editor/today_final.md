# Buildrik / Aquibra Studio — 9-Phase PRD
**Date:** 2026-03-12
**Scope:** Full visual web builder — capability discovery → preservation matrix → redesign PRD
**Non-negotiable rule:** Current capability is the FLOOR. Do NOT let visual simplification cause product simplification.

---

## CRITICAL CONSTRAINTS (Read Before Every Phase)

1. This is NOT a greenfield project — do NOT redesign from scratch
2. Every existing manager, hook, tab, section, and shortcut is a WORKING FEATURE until proven otherwise in codebase
3. Preserve working logic; prefer refactor over rewrite; prefer upgrade over replacement
4. Use evidence from actual codebase — not assumptions
5. Do NOT let visual simplification cause product simplification
6. If UI looks messy, that is a design problem, NOT a signal to remove the feature

---

# PHASE 1: CURRENT CAPABILITY INVENTORY

*Evidence-based. Every item traced to an actual source file.*

---

## 1.1 ENGINE LAYER — Composer.ts (29 Managers)

**File:** `src/engine/Composer.ts`

| Manager | Capability | Notes |
|---------|-----------|-------|
| ElementManager | Create, read, update, delete elements; createPage, getActivePage, duplicateElement, serializeElement, pasteElement, getElement, removeElement | Core CRUD engine |
| StyleEngine | CSS style rule management; getRule, toCSS, update styles per element | Emotion-backed |
| CommandCenter | Keyboard shortcut registration + execution; buildDefaultCommands | 30+ shortcuts |
| SelectionManager | select, clear, getSelected, multi-select | Used by Canvas + Inspector |
| HistoryManager | undo, redo, canUndo, canRedo, transaction support (beginTransaction/endTransaction) | Full undo stack |
| VersionHistoryManager | Save named versions, restore, compare diffs | Used in HistoryTab |
| StorageAdapter | saveProject, load; auto-save at 5000ms interval | localStorage + remote |
| Viewport | zoom, device, setZoom, setDevice, setSnapToGrid | Canvas viewport control |
| PluginManager | Plugin registration + execution | Extensibility layer |
| DataManager | Project data management | State persistence |
| GlobalStyleManager | Global CSS variables, shared styles | Design system globals |
| StyleDataBinding | CMS → element style bindings | CMS data → CSS |
| TraitDataBinding | CMS → element trait bindings | CMS data → attributes |
| TextDataBinding | CMS → element text content bindings | CMS data → text |
| TemplateManager | Template storage, apply, save | Used in TemplatesTab |
| CanvasIndicators | Spacing indicators, guides, grid, badges, x-ray overlays | UI overlay state |
| ResizeHandler | Element resize logic | Canvas resize handles |
| FontManager | Font loading, Google Fonts, custom fonts | Used in typography |
| ComponentManager | Create, store, reuse components (saved elements) | Reusable elements |
| CollectionManager | CMS collections: define schema, manage records | CMS layer |
| CMSBindingManager | Bind collection data to elements | CMS layer |
| CollaborationManager | Real-time collaboration via OT (Operational Transform) | Presence + cursors |
| MediaManager | Upload, list, delete media assets; stock discovery | Used in MediaTab |
| FormHandler | Form submission handling via Formspree injection | FormspreeInjector |
| SyncManager | Project sync with remote storage | Cloud persistence |
| PageRouter | Multi-page navigation, active page management | Used in PagesTab |
| RecoveryManager | Auto-recovery from crashes/errors | StudioErrorBoundary |
| InteractionManager | GSAP-backed animation triggers, interactions | Used in EffectsTab |
| DragManager | Element drag within canvas, z-index reorder | Canvas DragManager |

**AI Subsystem (separate from managers):**
- LayoutAnalyzer — analyzes page layout
- CodeGenerator — generates code from designs
- ContentWriter — AI content generation
- PageGenerator — generates full pages from prompts

**Export Subsystem:**
- ExportEngine.exportAllPages() → HTML/CSS per page
- AnalyticsInjector — injects GA/Meta Pixel/tracking
- AssetBundler — bundles images + fonts
- FormspreeInjector — form backends
- SEOInjector — meta tags, og:image, structured data

---

## 1.2 KEYBOARD SHORTCUTS (30+ Registered)

**File:** `src/engine/commands/defaultCommands.ts`

| Shortcut | Action | ID |
|---------|--------|-----|
| Ctrl+Z | Undo | undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo | redo |
| Ctrl+S | Save | save |
| Delete / Backspace | Delete element | delete |
| Ctrl+D | Duplicate | duplicate |
| Ctrl+C | Copy | copy |
| Ctrl+X | Cut | cut |
| Ctrl+V | Paste | paste |
| ArrowUp/Down/Left/Right | Nudge 1px | nudge-* |
| Shift+Arrow | Nudge 10px | nudge-*-large |
| Ctrl+] | Bring Forward | bring-forward |
| Ctrl+[ | Send Backward | send-backward |
| Ctrl+Shift+] | Bring to Front | bring-to-front |
| Ctrl+Shift+[ | Send to Back | send-to-back |
| Ctrl+' | Toggle Snap to Grid | toggle-snap-to-grid |
| Ctrl+A | Select All | select-all |
| Escape | Deselect | deselect |
| Ctrl+P | Preview | preview |
| Ctrl+Shift+T | Open Templates | ui-open-templates |
| Ctrl+Shift+E | Open Exporter | ui-open-exporter |
| Ctrl+Shift+A | Open AI | ui-open-ai |
| Ctrl+Shift+C | Toggle Component View | ui-toggle-component-view |
| Ctrl+= | Zoom In | zoom-in |
| Ctrl+- | Zoom Out | zoom-out |
| Ctrl+0 | Reset Zoom (100%) | zoom-reset |
| Ctrl+1 | Desktop View | device-desktop |
| Ctrl+2 | Tablet View | device-tablet |
| Ctrl+3 | Mobile View | device-mobile |
| Ctrl+4 | Watch View | device-watch |
| Ctrl+K | Command Palette | (AquibraStudio global) |
| Ctrl+J | Toggle AI Bar | (AquibraStudio global) |
| Ctrl+/ or ? | Keyboard Shortcut Cheat Sheet | (AquibraStudio global) |

**Tab Shortcuts (sidebar navigation):**
| Key | Opens Tab |
|-----|----------|
| A | Add/Build |
| T | Templates |
| Z | Layers |
| P | Pages |
| ⇧A | Components |
| J | Media |
| D | Design System |
| S | Settings |
| U | Publish |
| H | History |

---

## 1.3 CANVAS CAPABILITIES

**File:** `src/editor/canvas/Canvas.tsx`

**Canvas props (all toggleable feature flags):**
| Prop | Default | What it controls |
|------|---------|-----------------|
| showComponentView | false | Component outline overlay |
| showSpacing | false | Spacing indicator overlay |
| showBadges | false | Element type badge overlay |
| showGuides | true | Ruler guides overlay |
| showGrid | false | Grid overlay |
| showOutlines | true | Element outline overlay |
| showRulers | false | Ruler bars |
| showXRay | false | X-Ray (see-through) mode |
| devMode | false | Dev mode CSS view |
| showFooterToolbar | true | Footer zoom + overlay toolbar |

**Canvas hooks (20+):**
| Hook | Capability |
|------|-----------|
| useCanvasDragDrop | Drag elements onto canvas from sidebar |
| useCanvasInlineEdit | Double-click to edit text inline |
| useCanvasElementDrag | Drag elements within canvas to reposition |
| useComposerSelection | Track selected element ID |
| useCanvasGuides | Ruler guide management |
| useCanvasSync | Sync canvas content from Composer |
| useCanvasIndicators | Spacing + guide indicator generation |
| useCanvasMarquee | Drag-to-select multiple elements |
| useCanvasKeyboard | Canvas keyboard shortcuts |
| useCanvasHover | Hover highlighting |
| useCanvasContent | Resolve CMS bindings in content |
| useCanvasContextMenu | Right-click context menu |
| useCursorSync | Real-time cursor position broadcast |
| useSelectionBehavior | Click-through, additive selection |
| useCursorIntelligence | Modifier key cursor state |
| useCanvasSnapping | Snap-to-element/grid logic |
| useCanvasCommandPalette | Ctrl+K command palette |
| useCanvasToolbarActions | Floating toolbar actions |
| useCanvasInlineCommands | Inline edit commands |
| useCanvasSize | Canvas size tracking |
| useSelectionAnnouncement | WCAG 4.1.3 aria-live announcements |

**Canvas overlays:**
- CanvasOverlayGroup: selection handles, resize handles, hover outline, drop targets, snap lines, ruler guides, spacing indicators, grid, marquee rectangle
- ElementContextMenu: right-click actions
- CommandPalette: Ctrl+K with fuzzy search
- KeyboardCheatSheet: ? key

**Context menu features:**
- Select from stack (overlapping elements detection via elementsFromPoint)
- AI request on element
- Standard actions (copy, paste, delete, duplicate, wrap, move)

**Device sizes:** desktop, tablet, mobile, watch (4 breakpoints)

---

## 1.4 INSPECTOR — ProInspector

**File:** `src/editor/inspector/ProInspector.tsx`

**Three main tabs:**
| Tab Label | Internal Name | Sections |
|-----------|--------------|---------|
| Layout | layout | Position, Display, Size, Spacing, Flexbox, Grid, Variants |
| Style | appearance | Typography, Background, Border |
| Behavior | effects | Shadows, Transforms, Animation, Interactions |

**Inspector capabilities:**
- PseudoStateSelector: hover, focus, active, disabled states with override indicators
- BreakpointIndicator: shows active breakpoint (desktop/tablet/mobile/watch)
- ElementBreadcrumb: shows element hierarchy
- Multi-select toolbar: when 2+ elements selected
- InspectorEmptyState: when nothing selected (shows page settings)
- Search: filter sections by keyword
- Collapse All / Expand All sections
- DevModeToggle: show raw CSS properties
- Scroll position persistence: remembers scroll per element ID
- CSS context system: `deriveCssContext()` — enables/disables controls based on element type
- Delete with confirmation modal (P0 fix)
- Copy element ID to clipboard
- Tag badge shows HTML tag name

**Section details:**
| Section | Controls |
|---------|---------|
| Position | display mode, position type, top/right/bottom/left, z-index |
| Display | display, visibility, overflow, flex/grid toggle |
| Size | width, height, min/max constraints |
| Spacing | margin, padding (all 4 sides individually) |
| Flexbox | direction, wrap, align-items, justify-content, gap, flex item controls |
| Grid | grid-template columns/rows, gap, auto flow |
| Typography | font family picker, size, weight, line-height, letter-spacing, alignment, color, decoration |
| Background | color, gradient, image, repeat, size, position |
| Border | border width, style, color, border-radius |
| Shadows | box-shadow (multiple layers) |
| Transforms | rotate, scale, translate, skew |
| Animation | GSAP-backed: entrance, hover, scroll-triggered animations |
| Interactions | click, hover, scroll events with GSAP/custom actions |
| Variants | component variant switching |
| All CSS | raw CSS editor (dev mode) |
| CSS Classes | add custom CSS class names |
| Link | href, target, rel attributes |
| Visibility | show/hide by breakpoint |
| Data Attributes | custom data-* attributes |
| Element Properties | tag-specific attributes (src, alt, href, etc.) |
| AI Suggestions | AI-powered style suggestions |

---

## 1.5 LEFT SIDEBAR — 10 Tabs

**File:** `src/editor/rail/tabsConfig.ts`

### Tab 1: Add / Build (Shortcut: A)
**File:** `src/editor/sidebar/tabs/build/BuildTab.tsx`
- Element catalog: CATALOG with categorized elements (CatAccordion)
- Search across all element types
- Favorites zone (FavZone): star elements, persist in localStorage
- "Favorites cleared" with undo toast
- My Components zone: saved reusable components
- Onboarding tip for first-time users
- Tips footer with keyboard shortcuts
- Block drag-and-drop onto canvas
- Block click → instant insert

### Tab 2: Templates (Shortcut: T)
**File:** `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`
- Browse page and section templates
- Template preview modal (full-screen preview)
- Apply with progress overlay (ApplyProgressOverlay)
- Save current page as template
- Template use drawer (TemplateUseDrawer)

### Tab 3: Layers (Shortcut: Z)
**File:** `src/editor/sidebar/tabs/layers/LayersTab.tsx`
- Full element tree view
- Scroll to selected element (EVENTS.LAYERS_SCROLL_TO_SELECTION)
- Canvas hover sync (EVENTS.CANVAS_HOVER)
- Reorder elements via drag
- Show in Layers from context menu (EVENTS.SHOW_IN_LAYERS)

### Tab 4: Pages (Shortcut: P)
**File:** `src/editor/sidebar/tabs/pages/PagesTab.tsx`
- Page list with PageRow components
- Page context menu (rename, duplicate, delete, set as home)
- Add page button
- Page settings drawer with 3 sub-tabs:
  - SEO (title, meta description, canonical URL)
  - Social (og:title, og:description, og:image)
  - Advanced (slug, noindex, custom code)

### Tab 5: Components (Shortcut: ⇧A)
**File:** `src/editor/sidebar/tabs/ComponentsTab.tsx`
- Component library list (ComponentRow)
- Component detail screen (ComponentDetailScreen)
- Component icon display (ComponentIcon)
- Create component from selection (EVENTS.COMPONENT_CREATE_REQUESTED)

### Tab 6: Media (Shortcut: J)
**File:** `src/editor/sidebar/tabs/media/MediaTab.tsx`
- Source toggle: "Mine" (uploads) vs "Discover" (stock)
- TypePills: filter by image / video / font
- UploadZone: drag-and-drop file upload
- LibraryView: media grid with selection
- DiscoveryView: stock media discovery
- AssetDetailOverlay: view/edit asset details
- SelectionBanner: multi-asset selection
- ConfirmDeleteModal: confirm before delete
- Format strip showing supported types (no PDF)
- In-app navigation to stock browse (not external URL)
- MediaManager backed (composer.media)

### Tab 7: Design System (Shortcut: D)
**File:** `src/editor/sidebar/tabs/DesignSystemTab.tsx`
- Color tokens: list, add, edit, delete (ColorTokenList, ColorTokenRow, ColorPicker)
- Typography tokens: font face, size, weight definitions (TypeTokenList)
- Spacing tokens: scale definition (SpacingTokenList)
- Export dropdown: export tokens as CSS vars / JSON / SCSS
- Draft chip: shows unsaved token changes
- Tab guard modal: warns before leaving unsaved changes
- Add Token Modal: create new token
- Review Modal: review/confirm token changes before applying
- DesignTabFooter: apply/revert actions

### Tab 8: Settings (Shortcut: S)
**File:** `src/editor/sidebar/tabs/settings/SettingsTab.tsx`
- Card home screen with 6 drill-in sections + Get Started Tour
- DrillInHeader with back navigation and unsaved changes guard (SettingsNavGuard)
- Navigation state persisted per project

| Sub-screen | Content |
|-----------|---------|
| Site Settings | Site name, favicon, language, logo, social links |
| Domains | Custom domain, SSL config (Coming Soon flag) |
| Analytics | Google Analytics ID, Meta Pixel ID, custom tracking |
| Export | HTML download, React/Vue/Next.js source, ZIP bundle |
| Integrations | Formspree forms, payment providers, email services |
| Advanced | Custom CSS injection, custom JS injection, head scripts |
| Get Started Tour | Replay onboarding checklist |

- Plan-gating: Integrations + Advanced → Pro; (Enterprise tier also recognized)
- LockedScreen: shown when plan insufficient

### Tab 9: Publish (Shortcut: U)
**File:** `src/editor/sidebar/tabs/publish/PublishTab.tsx`
- Status badge: Published (green) / Draft (amber)
- Last published timestamp with human-readable date
- Published URL display: clickable link + copy to clipboard
- Pre-publish checklist: hasContent, SEO title, meta description, social image
- Trust badge: "Your site data is encrypted and stored securely"
- Actions:
  - Not published: "Publish Site" button
  - Published: "Update Site" + "Unpublish" buttons
- Publishing in progress state with "please wait" message
- Error display with dismiss button
- Privacy footer with policy + terms links
- Builds to: buildrik.app/{projectId}
- API: onPublish / onUnpublish callbacks (injected by host app)

### Tab 10: History (Shortcut: H)
**File:** `src/editor/sidebar/tabs/history/HistoryTab.tsx`
- ViewSwitcher: Versions / Activity tabs
- Versions view: VersionHistoryPanel (save, restore, compare named versions)
- Activity view: ActivityView (recent edits log)
- Search within history
- Undo/Redo buttons within panel
- Clear history action with confirmation (ConfirmDialog)
- View state persisted to localStorage per project

---

## 1.6 RAIL — 8 of 10 Tabs

**File:** `src/editor/rail/tabsConfig.ts` — `RAIL_SLOTS` array

| Zone | Position | Tab | Label | Subtitle |
|------|---------|-----|-------|---------|
| TOP | 1 | add | Add | Add elements and sections |
| TOP | 2 | assets | Media | Images, videos, and files |
| TOP | 3 | layers | Layers | View and reorder page structure |
| TOP | 4 | templates | Templates | Browse page templates |
| TOP | 5 | pages | Pages | Manage site pages |
| BOTTOM | 1 | design | Design | Colors, typography, and spacing |
| BOTTOM | 2 | settings | Settings | Site settings and SEO |
| BOTTOM | 3 | history | History | Version history and edit activity |
| — | — | components | *(NOT in rail)* | Keyboard only: ⇧A |
| — | — | publish | *(NOT in rail)* | Keyboard: U or top-bar button |

---

## 1.7 TOP BAR — StudioHeader

**File:** `src/editor/shell/StudioHeader.tsx` + `Topbar.tsx`

| Control | Description |
|---------|------------|
| Logo / Project name | Click → Project Settings modal |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |
| Save status | idle / saving / error indicator + last saved timestamp |
| Device toggle | desktop / tablet / mobile / watch with breakpoint dropdown |
| Preview | Opens preview in new tab (Ctrl+P) |
| Export | Opens export modal (Ctrl+Shift+E) |
| AI button | Opens AI Assistant Bar (Ctrl+J) |
| Copilot | AI Copilot modal |
| Design System | Opens Design tab in left panel |
| Publish | Opens Publish tab in left panel (Ctrl+Shift+U equivalent) |
| Plugins | Opens Settings tab at plugins sub-screen |
| History | Opens History tab in left panel |
| Issues | Opens Settings tab |
| X-Ray toggle | Toggle X-Ray overlay |
| Dev Mode toggle | Toggle dev mode in inspector |
| Suggestions toggle | Toggle AI suggestions |
| Sync status | Shows cloud sync state |
| Presence indicators | Collaboration avatars |
| Connection quality | Collab connection indicator |
| Zoom | Current zoom level display |

---

## 1.8 MODALS (Studio-level)

**File:** `src/editor/shell/StudioModals.tsx`

| Modal | Trigger | Capability |
|-------|---------|-----------|
| Templates | Ctrl+Shift+T / top-bar | Browse + apply templates |
| Save Template | Internal | Save current page as template |
| Exporter | Ctrl+Shift+E | Export HTML/CSS/React/Vue/Next.js |
| AI Assistant Bar | Ctrl+J | Inline AI for selected element |
| AI Copilot | Top-bar | Full AI page generation |
| Keyboard Shortcuts | ?/Ctrl+/ | Full shortcut reference |
| Media Library | Inspector background prop | Full media browser for element |
| Image Editor | Internal | Edit image within library |
| Icon Picker | Inspector icon prop | Lucide icon browser |
| Collection Setup | CMS element | CMS collection binding setup |
| Create Component | Context menu | Save selection as component |
| Project Settings | Logo click | Project name, branding |
| Upgrade Modal | Plan gate | Upgrade prompt |

---

## 1.9 ONBOARDING SYSTEM

**File:** `src/editor/onboarding/`

- WelcomeModal: first visit only (phase=active, completedCount=0)
  - "Browse Templates" or "Start Blank"
- OnboardingChecklist: floating panel with 5 steps
  - Steps: pick-start, add-element, edit-text, change-style, preview, publish
  - SpotlightOverlay: dims everything except step target
  - Minimize/Restore
  - Dismiss (skipAll)
- AchievementPrompt: fires on each step completion
- Events auto-complete steps: ELEMENT_CREATED, ELEMENT_EDIT_INLINE, STYLE_CHANGED, UI_TOGGLE_PREVIEW

---

## 1.10 DESIGN TOKENS

**File:** `src/themes/default.css`

| Token Category | Key Values |
|---------------|-----------|
| App background | #0A0A0A |
| Panel surfaces | surface-1: #0f0f14, surface-2: #16161d, surface-3: #1e1e26, surface-4: #26262f, surface-5: #2e2e38 |
| Primary color | #6366f1 (indigo), hover: #818cf8, active: #4f46e5 |
| Secondary color | #8b5cf6 (violet) |
| Text hierarchy | primary: #F5F5F0 (14.1:1), secondary: #B8B5AD (6.5:1), tertiary: #A09D96 (5.2:1), muted: #908D85 (4.6:1) |
| Borders | rgba(255,255,255,0.08) base, light: 0.12, subtle: 0.06 |
| Status | success: #22c55e, warning: #f59e0b, error: #ef4444, info: #3b82f6 |
| Border radius | xs: 3px, sm: 5px, md: 8px, lg: 12px, xl: 16px, 2xl: 20px, full: 999px |
| Rail width | 56px |
| Sidebar width | 280px pinned, 320px/400px expanded |
| Topbar height | 52px |

---

## 1.11 EXPORT FORMATS

| Format | Available | Notes |
|--------|----------|-------|
| HTML + CSS | ✅ Live | Multi-page, minified |
| React | ✅ Planned | Via ExportScreen |
| Vue | ✅ Planned | Via ExportScreen |
| Next.js | ✅ Planned | Via ExportScreen |
| ZIP bundle | ✅ Planned | Via ExportScreen |
| Preview | ✅ Live | Opens in new tab (Ctrl+P) |

---

## 1.12 COLLABORATION

| Feature | Implementation |
|---------|--------------|
| Real-time presence | CollaborationManager + OT |
| Cursor broadcast | useCursorSync hook |
| Presence avatars | PresenceIndicators component |
| Connection quality | ConnectionQualityIndicator |

---

# PHASE 2: PRESERVATION MATRIX

*Every feature that MUST survive the redesign. Do not remove or hide any of these.*

---

## 2.1 ABSOLUTE MUST-PRESERVE (Product Core)

| # | Capability | Source Evidence | Why Critical |
|---|-----------|----------------|-------------|
| P1 | All 30+ keyboard shortcuts | defaultCommands.ts | Power user workflow; removing any would be regression |
| P2 | 10-tab sidebar (all tabs, all shortcuts) | tabsConfig.ts | Navigation is how users access all features |
| P3 | 29 Composer managers (all capabilities) | Composer.ts | Business logic; these ARE the product |
| P4 | Inspector 3 tabs (Layout/Style/Behavior) with all sections | ProInspector.tsx | Property editing is core canvas workflow |
| P5 | Pseudo-state editing (hover/focus/active/disabled) | PseudoStateSelector.tsx | Required for interactive UI design |
| P6 | 4 device breakpoints (desktop/tablet/mobile/watch) | Canvas.tsx DEVICE_SIZES | Responsive design is core capability |
| P7 | CMS bindings (CollectionManager + binding managers) | Composer.ts | Dynamic content; major differentiator |
| P8 | AI subsystem (4 AI modules + AIAssistantBar + Copilot) | AquibraStudio.tsx | Product differentiator |
| P9 | Collaboration (OT + presence + cursors) | CollaborationManager | Team feature |
| P10 | Export (HTML/CSS live + 4 planned formats) | ExportEngine.ts | Escape hatch; trust feature |
| P11 | Onboarding flow (5 steps, spotlight, achievement) | onboarding/ | User activation |
| P12 | Version History (named versions + restore) | VersionHistoryPanel | Disaster recovery |
| P13 | Component system (create, reuse, library) | ComponentManager | Reusable design |
| P14 | Media Management (upload, library, discover, delete) | MediaManager | Content management |
| P15 | Settings 6 sub-screens (all drill-ins) | SettingsTab.tsx | Site configuration |
| P16 | Publish flow (status, URL, checklist, unpublish) | PublishTab.tsx | Revenue feature |
| P17 | Design System (color/type/spacing tokens + export) | DesignSystemTab.tsx | Brand consistency |
| P18 | Pages multi-page + SEO/Social/Advanced per page | PagesTab.tsx | Multi-page sites |
| P19 | Canvas overlays (7 types: spacing, guides, grid, badges, xray, outlines, rulers) | Canvas.tsx | Developer UX |
| P20 | Context menu "Select from stack" | Canvas.tsx elementsFromPoint | Overlapping element editing |
| P21 | Inline text editing (double-click) | useCanvasInlineEdit | Text editing |
| P22 | Marquee selection | useCanvasMarquee | Multi-select |
| P23 | Snapping system | useCanvasSnapping | Precise layout |
| P24 | Command palette (Ctrl+K) | useCanvasCommandPalette | Power navigation |
| P25 | Favorites system in Build tab | FavZone.tsx | Workflow efficiency |

---

## 2.2 PRESERVE-BUT-IMPROVE (UX Debt to Fix)

| # | Current State | What to Improve | Constraint |
|---|--------------|----------------|-----------|
| I1 | Components tab not in rail (keyboard only) | Add rail visibility OR better discovery | Must not remove shortcut ⇧A |
| I2 | Publish tab not in rail (keyboard U only) | Add to rail OR make top-bar button more prominent | Must not remove shortcut U |
| I3 | Settings hasSeoTitle/hasMetaDesc/hasSocialImg always false | Wire to actual composer.getSeoData() | TODO marked in code |
| I4 | Settings Domains + Export shown as "Coming Soon" | Either implement or visually defer | Features exist, not shipped |
| I5 | Onboarding checklist blocks content | Make minimizable + less intrusive | Already has minimize, needs better default |
| I6 | Inspector tab labels: "Layout / Style / Behavior" vs "Layout / Appearance / Effects" | Standardize label (code says "effects", tab says "Behavior") | tabLabels object in ProInspector |
| I7 | Design System draft workflow | Better visual indication of unpublished tokens | DraftChip exists but is subtle |

---

## 2.3 DO NOT TOUCH (Working Well)

| Feature | Reason |
|---------|--------|
| HistoryManager undo/redo stack | Works perfectly; do not refactor |
| Emotion CSS-in-JS token system | No Tailwind, no CSS Modules — this is the stack |
| Lucide React icons | Standard icon library throughout |
| StorageAdapter auto-save (5000ms) | Working reliability |
| Error boundary with reload button | Catch-all for engine errors |
| Storage key migration utility | Migrates old localStorage keys |
| Toast notification system | Used everywhere; consistent |

---

# PHASE 3: CURRENT-STATE PRODUCT AUDIT

*Assessment of what works, what has friction, and what is structurally problematic.*

---

## 3.1 STRENGTHS (Keep and Amplify)

| Area | Strength |
|------|---------|
| Engine depth | 29 managers covering CMS, collab, AI, export — this is a serious product |
| Keyboard-first design | 30+ shortcuts, all 10 tabs have shortcuts — power users can work without mouse |
| Design token system | color/type/spacing tokens with export — production-ready for design systems |
| Inspector depth | 20+ sections across 3 tabs; pseudo-states, breakpoints, all CSS props |
| Collaboration | OT + presence + cursor sync — enterprise-grade |
| CMS layer | 3 binding types (style, trait, text) + collection manager — data-driven pages |
| Error recovery | RecoveryManager + StudioErrorBoundary + retry toasts |
| Accessibility | WCAG AA text contrast ratios, ARIA labels, aria-live announcements, keyboard nav |

---

## 3.2 FRICTION POINTS (Evidence-Based)

| ID | Surface | Issue | Evidence |
|----|---------|-------|---------|
| F1 | Rail | Components tab missing from rail — discoverability zero for new users | tabsConfig.ts RAIL_SLOTS has no "components" entry |
| F2 | Rail | Publish missing from rail — critical action requires keyboard shortcut U or top-bar hunt | tabsConfig.ts RAIL_SLOTS has no "publish" entry |
| F3 | Publish | Pre-publish checklist: SEO/Social items always show as incomplete (always false) | PublishTab.tsx lines 262-265: TODO comment |
| F4 | Settings | Domains and Export show "Coming Soon" but Settings tab still lists them as cards | FEATURE_FLAGS.domains + FEATURE_FLAGS.export checks |
| F5 | Inspector | Tab label mismatch: "Behavior" shown in UI but code uses "effects" and ARIA label says "Behavior tab — Shadows, Transforms..." | ProInspector.tsx tabLabels object |
| F6 | Inspector | DevModeToggle positioned after search/expand controls — not visually grouped with mode concepts | ProInspector.tsx layout order |
| F7 | Canvas | X-Ray and Dev Mode features exist but toggle discovery requires top-bar overflow menu | StudioHeader passes showXRay + devMode |
| F8 | Media | Discovery tab exists but "disc" source renders DiscoveryView — actual stock search depth unclear | MediaTab.tsx isDisc flag |
| F9 | Onboarding | SpotlightOverlay blocks canvas when checklist is active — new users can't freely explore | AquibraStudio.tsx spotlight rendering |
| F10 | Top bar | Too many toggle buttons (XRay, DevMode, Suggestions, Sync, Copilot, AI, Exporter, Templates) — cognitive overload | StudioHeader.tsx props list |

---

## 3.3 STRUCTURAL OBSERVATIONS

| Category | Observation |
|---------|------------|
| Tab routing | TabRouter + usePanelNavigation pattern is clean — drill-in pattern works well |
| State architecture | useStudioState + useStudioModals + useStudioHandlers — well-separated concerns |
| Event system | composer.emit/on for cross-panel communication — correct pattern per CLAUDE.md |
| Import direction | Code follows CLAUDE.md rules: engine → shared only, editor → engine + shared |
| SSOT violations | PANEL_WIDTH defined in multiple places (suspected but not confirmed via grep) |
| Dead code risk | MediaTab source "disc" state — Discovery feature backed by real DiscoveryView component |

---

# PHASE 4: TARGET-STATE PRD V1

*What the product should do after redesign. Capabilities = preserved + improved. UI = redesigned.*

---

## 4.1 PRODUCT VISION

Buildrik/Aquibra Studio becomes the editor that **power users choose because it's fast** and **new users succeed in because it's clear**.

- Every capability from Phase 1 remains accessible
- The 10 most-used actions require zero hunting
- New users complete their first publish in < 10 minutes
- Power users can work entirely keyboard-driven

---

## 4.2 TARGET INFORMATION ARCHITECTURE

### Left Rail (Revised — 10 buttons, 2 zones)

| Zone | Order | Tab | Shortcut | Change |
|------|-------|-----|---------|-------|
| TOP | 1 | Add | A | Keep |
| TOP | 2 | Media | J | Keep |
| TOP | 3 | Layers | Z | Keep |
| TOP | 4 | Templates | T | Keep |
| TOP | 5 | Pages | P | Keep |
| TOP | 6 | Components | ⇧A | **ADD to rail** — currently keyboard-only |
| BOTTOM | 1 | Design | D | Keep |
| BOTTOM | 2 | Settings | S | Keep |
| BOTTOM | 3 | Publish | U | **ADD to rail** — currently keyboard-only |
| BOTTOM | 4 | History | H | Keep |

**Rationale:** Components and Publish are product features, not advanced options. Both have dedicated shortcuts, dedicated panels, and core workflows. Having them in the rail makes them first-class.

### Top Bar (Simplified)

**Keep visible:**
- Logo / Project name (click → Project Settings)
- Save status + Undo/Redo
- Device breakpoint switcher
- Preview button (primary CTA)
- Publish button (secondary CTA, links to Publish tab)
- AI button (Ctrl+J)

**Move to overflow menu "···":**
- Export (Ctrl+Shift+E)
- X-Ray / Dev Mode / Suggestions toggles
- Copilot
- History link
- Issues link
- Templates shortcut

**Move to footer toolbar (already there):**
- Zoom controls
- Overlay toggles (guides, spacing, grid, badges, xray)

**Rationale:** Top bar currently has 15+ interactive elements. Reduce to 7 primary + overflow.

---

## 4.3 TARGET USER FLOWS

### Flow 1: New User First Publish

```
WelcomeModal
  → Browse Templates OR Start Blank
  → Onboarding Checklist (5 steps, spotlight per step)
  → Add element (Build tab A)
  → Edit text (double-click)
  → Style it (right inspector)
  → Preview (Ctrl+P)
  → Publish tab (U key or rail icon) → Publish Site
  → AchievementPrompt "Site is live!"
```

### Flow 2: Power User Daily Workflow

```
Ctrl+K → Search and navigate to any feature
A → Build tab → drag element onto canvas
Double-click → edit text inline
Select element → right inspector → style changes
D → Design system → check token consistency
P → Pages tab → manage pages / SEO
H → History tab → save named version
U → Publish tab → Update Site
```

### Flow 3: CMS Data-Driven Page

```
Collection Setup (inspector or modal) → define schema
Add text element → right inspector → data binding icon → bind to collection field
Add image element → bind to collection image field
Preview with CMS data injected
Pages → publish
```

---

## 4.4 TARGET INSPECTOR UX

**Standardize labels (current inconsistency fix):**
- Tab 1: "Layout" (keep)
- Tab 2: "Style" (currently "Appearance" in code but shown as "Style" — keep "Style")
- Tab 3: "Effects" (rename "Behavior" → "Effects" to match internal code name and content)

**DevModeToggle:**
- Move to top of inspector header (next to element name/ID area)
- Not buried in controls row

**Pseudo-state selector:**
- Add visual indicator on the selector when any override exists for that state
- Currently: `statesWithOverrides` already computed — just needs visual dot indicator (already has it via PseudoStateSelector)

**Inspector Sub-Nav:**
- Keep InspectorSubNav (jump links) — useful for long panels

---

## 4.5 TARGET CANVAS UX

**Overlay Controls:**
- Footer toolbar is the right location (already implemented)
- Add keyboard shortcut labels to each toggle in footer

**X-Ray mode:**
- When active, show subtle banner "X-Ray ON — press X to toggle" (or assigned key)

**Dev Mode:**
- Inspector DevModeToggle is good — make more visually prominent when active

**Empty Canvas:**
- CanvasEmptyCTA already exists — keep but make it more prominent (larger CTA)

---

## 4.6 TARGET PUBLISH UX

**Fix pre-publish checklist:**
- Wire `hasSeoTitle` and `hasMetaDesc` to actual `composer.getSeoData()` when available
- For now: show "Set up SEO in Pages tab" with direct link to Pages tab → SEO drawer

**Publish button placement:**
- Top bar has Publish shortcut → opens Publish tab ✅ (keep)
- Rail Publish icon → opens Publish tab ✅ (add this)

---

## 4.7 TARGET MEDIA UX

**Discovery tab:**
- Rename "Discover" source to "Stock Photos" for clarity
- Show powered-by attribution (if applicable)

**Type pills:**
- Keep image/video/font filtering

**Upload zone:**
- Keep persistent at bottom of library view (already done)

---

## 4.8 TARGET SETTINGS UX

**Domains "Coming Soon":**
- Keep the card but add estimated date or waitlist CTA instead of just "Coming Soon" badge

**Export card:**
- If export of HTML works (ExportEngine.exportAllPages), connect it properly
- Show what's available (HTML/CSS) vs what's coming (React/Vue/Next.js)

**Analytics screen:**
- Show live status of whether tracking is active (GA ID exists → "Active")

---

# PHASE 5: STITCH-READY REDESIGN BRIEF

*Brief for generating Stitch screens. Each screen spec tells Stitch exactly what to render.*

---

## 5.1 GLOBAL DESIGN LANGUAGE

| Attribute | Spec |
|-----------|-----|
| Background | #0A0A0A (deepest) |
| Panel background | #0f0f14 (surface-1) |
| Card background | #16161d (surface-2) |
| Interactive hover | #1e1e26 (surface-3) |
| Primary accent | #6366f1 (indigo) |
| Font | Inter or System UI |
| Body text | #F5F5F0 (primary), #B8B5AD (secondary), #908D85 (muted) |
| Border | rgba(255,255,255,0.08) |
| Border radius | Cards: 8px, buttons: 6px, pills: 999px |
| Icon library | Lucide React |
| Spacing unit | 4px base (multiples: 4, 8, 12, 16, 20, 24) |
| Rail width | 56px |
| Sidebar width | 280px |
| Topbar height | 52px |

**Design philosophy:** Apple restraint + Linear precision + Stripe clarity. Dark, dense, professional. No gradients on panels. Subtle borders. Information-dense but not cluttered.

---

## 5.2 SCREEN SPECS

### Screen A: Editor Shell (Full Layout)
```
Width: 1440px, Height: 900px
Layout: Topbar(52px) + [Rail(56px) | Sidebar(280px) | Canvas(flex) | Inspector(280px)]

Topbar contains:
  LEFT: Buildrik logo (12px square icon + "Buildrik" wordmark) | Undo | Redo | "Saved" text
  CENTER: [Desktop] [Tablet] [Mobile] [Watch] device pills
  RIGHT: [Preview] [Publish] [AI] [···]

Rail (left, 56px wide, full height):
  TOP 6 icons: Add (+), Media (image), Layers (stack), Templates (layout-template), Pages (file-text), Components (component)
  SPACER (flex grow)
  BOTTOM 4 icons: Design (palette), Settings (settings), Publish (rocket), History (clock)
  Active icon: #6366f1 background pill, white icon
  Inactive: rgba(255,255,255,0.5) icon

Sidebar (280px): "Add" tab open — see Screen B

Canvas (center): white canvas with element placeholder

Inspector (280px right): element selected — see Screen G
```

### Screen B: Build / Add Tab
```
Width: 280px, Height: 800px (sidebar panel)
Background: #0f0f14

Header: "Add" title (14px semibold, #F5F5F0) + pin icon + close icon, 44px height
SearchBar: "Search elements..." input, full width, 32px height, surface-3 bg

MyComponents zone (if any): "My Components" label + component thumbnails
FavZone (if favorited): "Favorites" label + favorited element chips

Categories (CatAccordion):
  "Structure" ▼  [expanded]
    [Section card] [Container] [Grid] [Columns]
  "Text" ▶ [collapsed]
  "Media" ▶ [collapsed]
  "Forms" ▶ [collapsed]
  "Advanced" ▶ [collapsed]

Each element card: 60px x 60px, icon centered, label below, surface-2 bg, hover: surface-3

Tips footer: "Tip: Press A to open, drag to canvas" — 12px, muted
```

### Screen C: Media Tab
```
Width: 280px, Height: 800px
Background: #0f0f14

Header: "Media" + pin + close
Source pills: [My Files ●] [Stock Photos ○]  — pill toggle
TypePills: [All ●] [Images] [Videos] [Fonts]
SearchBar: "Search media..."

UploadZone (top of body):
  Dashed border, "Drop files here or click to upload", image icon
  16px padding, surface-2 bg, radius: 8px

LibraryView (grid below):
  3-column grid of thumbnails
  Each: 80px square, image, hover: overlay with eye icon
  Selected: indigo border

SelectionBanner (when selected): "3 files selected" + [Insert] [Delete]
```

### Screen D: Pages Tab
```
Width: 280px, Height: 800px
Background: #0f0f14

Header: "Pages" + pin + close + "Add Page" (+) button

PageList:
  Each PageRow: file-text icon | "Home" (14px medium) | "home page" chip (green) | ··· menu
  Active page: indigo left border, primary text
  Inactive: muted text, no border

"Add Page" button: full-width, dashed border, surface-2 bg, + icon, "Add new page" text

PageContextMenu (on ··· click):
  Rename | Set as Home | Duplicate | Delete (red)
```

### Screen E: Design System Tab
```
Width: 280px, Height: 800px
Background: #0f0f14

Header: "Design" + export button (download icon) + pin + close
DraftChip: "3 unsaved" amber badge (if drafts exist)

Sections:
  "COLORS" label (10px caps, muted)
    ColorTokenRow × N: [swatch 20px] "primary" [#6366f1] [edit] [delete]
    [+ Add color] button

  "TYPOGRAPHY" label
    TypeTokenRow × N: [Aa preview] "heading-1" [Inter 32/40] [edit]
    [+ Add type] button

  "SPACING" label
    SpacingTokenRow × N: [visual bar] "space-4" [16px] [edit]
    [+ Add spacing] button

Footer: [Review Changes ●] [Apply All] [Revert]
```

### Screen F: Settings Tab (Home)
```
Width: 280px, Height: 800px
Background: #0f0f14

Header: "Settings" + pin + close

SITE group label:
  FeatureCard: [settings icon] "Site Settings" / "Name, favicon, language"
  FeatureCard: [globe icon] "Domains" / "Custom domain + SSL" [Coming Soon badge]
  FeatureCard: [bar-chart icon] "Analytics" / "GA, Meta Pixel, tracking"

POWER group label:
  FeatureCard: [plug icon] "Integrations" / "Forms, payments, email" [Pro badge]
  FeatureCard: [code icon] "Advanced" / "Custom CSS/JS, head scripts" [Pro badge]
  FeatureCard: [download icon] "Export" / "Download source code"

HELP group label:
  FeatureCard: [play-circle icon] "Get Started Tour" / "Replay onboarding walkthrough"
```

### Screen G: Inspector — Layout Tab
```
Width: 280px, Height: 900px (right panel)
Background: #0f0f14

Header row:
  [arrow-left] "Page settings" link (11px, muted, 0.5 opacity)

Element identity:
  [element-icon] "Section" (16px bold) | #a3b7c2... (12px mono) [<div>]
  DevMode toggle (small pill, top right)
  Breadcrumb: body > div.hero > section (11px, muted)
  Breakpoint: [Desktop] pill (indigo)
  PseudoState: [Normal ▼] [Hover] [Focus] [Active] [Disabled]

Search + controls bar:
  "Search sections..." | [collapse all] [expand all]

Tab navigation:
  [Layout ●] [Style] [Effects] — pill segment

InspectorSubNav:
  [Position] [Display] [Size] [Spacing] [Flexbox] [Grid]

Sections (accordion):
  ▼ POSITION
    [Static] [Relative] [Absolute] [Fixed] [Sticky] — button row

  ▼ DISPLAY
    [Block] [Flex] [Grid] [Inline] [None] — button row

  ▼ SIZE
    W: [auto ▼] [100%]   H: [auto ▼] [400px]
    Min W: [—]  Max W: [—]  Min H: [—]  Max H: [—]

  ▼ SPACING
    [Margin] [Padding] toggle
    Visual box model: top/right/bottom/left inputs

  ▼ FLEXBOX (when display=flex)
    Direction: [Row ●] [Column] [Row-Rev] [Col-Rev]
    Align: [Start] [Center ●] [End] [Stretch] [Baseline]
    Justify: [Start ●] [Center] [End] [Space-Between] [Space-Around]
    Gap: [16px]
    Wrap: [Nowrap ●] [Wrap] [Wrap-Rev]

Footer: [Delete element] red ghost button
```

### Screen H: Publish Tab
```
Width: 280px, Height: 800px
Background: #0f0f14

Header: "Publish" + pin + close

Status section (surface-2 card):
  "Status" label | [● Published] green pill badge
  "Last published: Mar 12, 2026 at 2:45 PM"

Published URL section (surface-2 card):
  "Published URL" label
  [buildrik.app/my-site] [copy icon]

Pre-publish checklist (surface-2 card):
  "Pre-publish checklist" label
  [✓] Template applied (green bg)
  [✓] Content edited (green bg)
  [○] SEO title set — "Pages → SEO" link (amber)
  [○] Meta description — "Pages → SEO" link (amber)
  [○] Social preview — "Pages → Social" link (amber)

Trust badge: [shield icon] "Your site data is encrypted and stored securely."

Actions:
  [Update Site] primary full-width button
  [Unpublish] ghost button

Info box (indigo subtle bg):
  [rocket icon] "Your site is live"
  "Changes made after publishing require an update to go live."

Privacy footer: "By publishing... Privacy policy · Terms of service"
```

---

# PHASE 6: STITCH REDESIGN PASS

*Stitch project already created in previous session. Project ID: 14204063841634199453.*
*8 premium redesigned screens were generated.*

**Existing Stitch screens (from previous session):**
- Screen IDs exist in Stitch project 14204063841634199453
- Premium redesign pass was applied with world-class SaaS design standards
- Screens cover: full shell, Build tab, Media tab, Pages tab, Design System, Settings, Publish, Inspector

**Status:** Phase 6 COMPLETE — premium screens exist in Stitch.

---

# PHASE 7: REGRESSION / DOWNGRADE CHECK

*For every Stitch redesign, verify nothing was removed.*

---

## 7.1 Capability Regression Checklist

Run this check against every designed screen before proceeding to Phase 8.

| Capability | Present in Stitch Design? | Action if Missing |
|-----------|--------------------------|------------------|
| All 10 tab icons in rail | Must show 10 (6 top + 4 bottom) | Re-add missing tabs |
| All 30+ keyboard shortcuts | Visible in shortcut cheat sheet screen | Add if missing |
| Inspector 3 tabs | Layout / Style / Effects visible | Do not merge tabs |
| Pseudo-state selector | hover/focus/active/disabled visible | Do not remove |
| 4 device breakpoints | desktop/tablet/mobile/watch in topbar | Do not reduce to 2 |
| Pre-publish checklist | 5 items visible | Do not simplify |
| Design token export | Export dropdown visible | Do not remove |
| Settings 6 sub-screens | All 6 cards on home screen | Do not combine/remove |
| History 2 views | Versions + Activity visible | Do not remove |
| Media source toggle | Mine / Stock Photos toggle visible | Do not remove |
| Onboarding checklist | Visible on first run | Do not remove |
| AI buttons | AI bar toggle visible in topbar | Do not remove |
| Dev Mode toggle | Visible in inspector | Do not remove |

---

## 7.2 Known Regression Risks in This Redesign

| Risk | Mitigation |
|------|-----------|
| Rail showing 8 items (current) instead of 10 (target) | Explicitly add Components + Publish to rail spec |
| Inspector tab "Behavior" renamed "Effects" | Update tabLabels in ProInspector.tsx |
| Publish checklist items hardcoded to false | Wire to getSeoData() in PublishTab.tsx |
| Top bar simplified → buttons go to overflow | Keep Preview + Publish + AI visible always |
| Settings "Coming Soon" cards | Decide: implement or add waitlist/ETA |

---

# PHASE 8: FINAL LOCKED PRD

*This is the implementation-ready spec. Implementors read this section.*

---

## 8.1 LOCKED DECISIONS

| # | Decision | Rationale |
|---|---------|-----------|
| D1 | Components tab added to rail (position 6 in TOP zone) | Discoverability fix; ⇧A shortcut retained |
| D2 | Publish tab added to rail (position 3 in BOTTOM zone) | Critical action; U shortcut retained |
| D3 | Inspector tab 3 label: "Effects" (not "Behavior") | Aligns with code; better matches content (shadows/transforms/animation) |
| D4 | Top bar overflow: move XRay/DevMode/Suggestions/Copilot/Export/History/Issues to ··· menu | Reduces top bar to 7 primary controls |
| D5 | PublishTab pre-publish checklist: wire hasSeoTitle/hasMetaDesc/hasSocialImg OR show navigation link | Fix always-false UX |
| D6 | Rail: 6 TOP items + 4 BOTTOM items (total 10, no footer zone changes) | Clean expansion of current pattern |
| D7 | Design System DraftChip: make more visually prominent when unsaved changes exist | Prevent data loss |
| D8 | Onboarding spotlight: add "Continue exploring →" escape link to dismiss spotlight without stopping checklist | Less intrusive first-run |

---

## 8.2 OUT OF SCOPE (Phase 1 Redesign)

| Item | Why Out of Scope |
|------|----------------|
| New CMS UI | CollectionManager works; not a visual redesign item |
| Collaboration UI | PresenceIndicators work; not a visual redesign item |
| AI subsystem redesign | AIAssistantBar works; not a visual redesign item |
| Export new formats (React/Vue/Next.js) | Engineering feature, not design redesign |
| Domains implementation | Backend feature, not design redesign |
| Plugin system | Not in current visual redesign scope |

---

## 8.3 IMPLEMENTATION SPEC — Rail Change

**Target file:** `src/editor/rail/tabsConfig.ts`

Add to `RAIL_SLOTS` array:

**Add "components" to TOP zone (after pages, position 6):**
```typescript
{
  tabId: "components",
  label: "Comps",
  iconName: "SvgComponents",
  ariaLabel: "Component Library",
  zone: "top",
  variant: "rtab",
  subtitle: "Create and use reusable components",
},
```

**Add "publish" to BOTTOM zone (position 3, before history):**
```typescript
{
  tabId: "publish",
  label: "Publish",
  iconName: "SvgRocket",
  ariaLabel: "Publish your site",
  zone: "bottom",
  variant: "rtab",
  subtitle: "Publish and deploy your site",
},
```

**Update BOTTOM zone order:**
```
design (1) → settings (2) → publish (3) → history (4)
```

**Remove comment:** `// publish: removed from rail — accessible via keyboard shortcut U or top-bar button`
Replace with: `// publish: restored to rail — rail is the primary discovery surface`

---

## 8.4 IMPLEMENTATION SPEC — Inspector Tab Label

**Target file:** `src/editor/inspector/ProInspector.tsx`

**Current code (line ~382):**
```typescript
const tabLabels = {
  layout: "Layout",
  appearance: "Style",
  effects: "Behavior",
};
```

**Target code:**
```typescript
const tabLabels = {
  layout: "Layout",
  appearance: "Style",
  effects: "Effects",
};
```

**Also update ARIA labels (same block):**
```typescript
const tabAriaLabels = {
  layout: "Layout tab — Position, Display, Spacing, Flexbox, Grid",
  appearance: "Style tab — Typography, Background, Border",
  effects: "Effects tab — Shadows, Transforms, Animation, Interactions",
};
```

---

## 8.5 IMPLEMENTATION SPEC — Publish Checklist Fix

**Target file:** `src/editor/sidebar/tabs/publish/PublishTab.tsx`

**Current code (lines ~262-265):**
```typescript
const hasSeoTitle = false;   // TODO: wire when composer.getSeoData() is available
const hasMetaDesc = false;   // TODO: wire when composer.getSeoData() is available
const hasSocialImg = false;  // TODO: wire when composer.getSeoData() is available
```

**Target code (interim fix with navigation links):**
```typescript
// Wire hasSeoTitle/hasMetaDesc/hasSocialImg: use false until getSeoData() API is available
// Show navigation hints pointing users to Pages → page settings → SEO/Social tabs
const hasSeoTitle = false;
const hasMetaDesc = false;
const hasSocialImg = false;
```

**Update ChecklistItem components to include navigation hints:**
```tsx
<ChecklistItem label="SEO title set" ok={checks.hasSeoTitle} hint="Set in Pages → SEO tab" />
<ChecklistItem label="Meta description added" ok={checks.hasMetaDesc} hint="Set in Pages → SEO tab" />
<ChecklistItem label="Social preview configured" ok={checks.hasSocialImg} hint="Set in Pages → Social tab" />
```

*(Note: hint prop already exists in ChecklistItem — just update the hint strings)*

---

## 8.6 IMPLEMENTATION SPEC — Top Bar Simplification

**Target file:** `src/editor/shell/Topbar.tsx` (read this file before implementing)

**Target state:**
- Always visible: Logo, Undo, Redo, Save status, Device switcher, Preview, Publish, AI toggle
- Move to ··· overflow: XRay toggle, DevMode toggle, Suggestions toggle, Copilot, Exporter link, History link, Issues link, Templates shortcut
- Keep: Sync status, Presence indicators (small, non-intrusive)

**Implementation note:** Read `Topbar.tsx` to understand current structure before modifying. The exact buttons and their render conditions need to be traced from the file.

---

# PHASE 9: IMPLEMENTATION ROADMAP

*Ordered by impact × effort. Each item is a discrete, testable change.*

---

## Phase 9A: Quick Wins (1 day each — do these first)

| # | ID | Change | Target File | Observable After |
|---|----|--------|------------|-----------------|
| 1 | QW-1 | Add Components tab to rail | `src/editor/rail/tabsConfig.ts` | Comps icon visible in rail, click opens Components panel |
| 2 | QW-2 | Add Publish tab to rail | `src/editor/rail/tabsConfig.ts` | Publish/rocket icon visible in bottom rail, click opens Publish panel |
| 3 | QW-3 | Fix Inspector tab label "Behavior" → "Effects" | `src/editor/inspector/ProInspector.tsx` | Third inspector tab reads "Effects" |
| 4 | QW-4 | Update Publish checklist hint text | `src/editor/sidebar/tabs/publish/PublishTab.tsx` | Incomplete checklist items show "Set in Pages → SEO tab" hint |

---

## Phase 9B: Medium Effort (2-3 days each)

| # | ID | Change | Target File | Observable After |
|---|----|--------|------------|-----------------|
| 5 | ME-1 | Top bar overflow — move secondary controls to ··· menu | `src/editor/shell/Topbar.tsx` | Top bar shows 7 items; XRay/DevMode/Suggestions/Export/Copilot in overflow |
| 6 | ME-2 | Wire Publish checklist to composer.getSeoData() when API available | `src/editor/sidebar/tabs/publish/PublishTab.tsx` | SEO/Social checklist items show actual state |
| 7 | ME-3 | DraftChip prominence — when unsaved design tokens exist, show pulsing indicator | `src/editor/sidebar/tabs/design/components/DraftChip.tsx` | Amber dot pulses when drafts exist |
| 8 | ME-4 | Onboarding spotlight escape link "Explore freely →" | `src/editor/onboarding/SpotlightOverlay.tsx` | User can dismiss spotlight without canceling checklist |

---

## Phase 9C: Refactors (1 week each — after Phase 9A + 9B complete)

| # | ID | Change | Target Files | Observable After |
|---|----|--------|-------------|-----------------|
| 9 | RF-1 | Settings Domains + Export — replace "Coming Soon" with waitlist/ETA cards | `src/editor/sidebar/tabs/settings/screens/DomainsScreen.tsx` + `ExportScreen.tsx` | Clearer status; maybe email collection for waitlist |
| 10 | RF-2 | Collaborative presence — show active users in top bar with initials + colors | `src/editor/shell/StudioHeader.tsx` + `PresenceIndicators` | Collab avatars visible in top bar with names on hover |

---

## Implementation Order

```
Day 1-2:  QW-1 + QW-2 (rail changes) — highest discoverability impact
Day 3:    QW-3 + QW-4 (label + copy fixes) — polish
Day 4-6:  ME-1 (top bar cleanup) — visual clarity
Day 7-8:  ME-2 (publish checklist) — trust signal
Day 9:    ME-3 + ME-4 (draft chip + spotlight escape)
Week 3+:  RF-1 + RF-2 (refactors, lower urgency)
```

---

## How to Implement Each Item

To implement any item from Phase 9:

1. Open a new Claude Code session in `/Users/shahg/Desktop/test/buildrik`
2. Say: `implement [ID] from today_final.md`
   - Examples: `implement QW-1`, `implement ME-1`, `implement RF-1`
3. Read the relevant Section 8.x spec for that item
4. Read the target file before making changes
5. Make only the changes specified
6. Run: `npx tsc --noEmit` to verify TypeScript
7. Mark done in this roadmap

**One item per session.** Never implement multiple items in one session.

---

## Quick Reference

| ID | Issue | Phase |
|----|-------|-------|
| QW-1 | Add Components to rail | Quick Win |
| QW-2 | Add Publish to rail | Quick Win |
| QW-3 | Inspector tab "Behavior" → "Effects" | Quick Win |
| QW-4 | Publish checklist hint text | Quick Win |
| ME-1 | Top bar overflow menu | Medium |
| ME-2 | Wire publish checklist to getSeoData() | Medium |
| ME-3 | DraftChip prominence | Medium |
| ME-4 | Onboarding spotlight escape | Medium |
| RF-1 | Settings Coming Soon → waitlist | Refactor |
| RF-2 | Collaboration presence in top bar | Refactor |

---

*End of today_final.md — Buildrik/Aquibra Studio 9-Phase PRD*
*Generated: 2026-03-12 | Evidence: codebase-traced | Ready for implementation*

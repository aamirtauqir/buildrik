# PART 2 — MUST-PRESERVE CAPABILITY CONTRACT

**Extracted from:** `prd_final.md` (Outputs A, B, C, D, E)
**Date:** 2026-03-12
**Rule:** Current capability is the FLOOR, not the ceiling. Every item in this document is a HARD CONTRACT. If any item is missing from a design or implementation, the design is REJECTED.

---

## 1. Engine Capabilities (29 Managers — Non-Negotiable)

All 29 Composer managers remain fully operational. The redesign does not touch engine logic. No manager is removed, merged, or renamed.

**Complete manager list (must all be accessible via `composer.*`):**

| # | Manager | Access Path | Must-Preserve Capability |
|---|---------|-------------|-------------------------|
| 1 | ElementManager | `composer.elements` | create, read, update, delete, createPage, getActivePage, duplicateElement, serializeElement, pasteElement, removeElement |
| 2 | StyleEngine | `composer.styles` | getRule, toCSS, update styles per element, Emotion-backed |
| 3 | CommandCenter | `composer.commands` | Keyboard shortcut registration + execution, buildDefaultCommands (30+ shortcuts) |
| 4 | SelectionManager | `composer.selection` | select, clear, getSelected, multi-select |
| 5 | HistoryManager | `composer.history` | undo, redo, canUndo, canRedo, beginTransaction/endTransaction |
| 6 | VersionHistoryManager | `composer.versionHistory` | Save named versions, restore, compare diffs |
| 7 | StorageAdapter | `composer.storage` | saveProject, load, auto-save at 5000ms interval |
| 8 | Viewport | `composer.viewport` | zoom, device, setZoom, setDevice, setSnapToGrid |
| 9 | PluginManager | `composer.plugins` | Plugin registration + execution |
| 10 | DataManager | `composer.data` | Project data management |
| 11 | GlobalStyleManager | `composer.globalStyles` | Global CSS variables, shared styles |
| 12 | StyleDataBinding | `composer.styleBindings` | CMS → element style bindings |
| 13 | TraitDataBinding | `composer.traitBindings` | CMS → element trait bindings |
| 14 | TextDataBinding | `composer.textBindings` | CMS → element text content bindings |
| 15 | TemplateManager | `composer.templates` | Template storage, apply, save |
| 16 | CanvasIndicators | `composer.canvasIndicators` | Spacing indicators, guides, grid, badges, x-ray overlays |
| 17 | ResizeHandler | `composer.resizeHandler` | Element resize logic |
| 18 | FontManager | `composer.fonts` | Font loading, Google Fonts, custom fonts |
| 19 | ComponentManager | `composer.components` | Create, store, reuse components (saved elements) |
| 20 | CollectionManager | `composer.cmsManager` | CMS collections: define schema, manage records |
| 21 | CMSBindingManager | `composer.cmsBindings` | Bind collection data to elements |
| 22 | CollaborationManager | `composer.collaboration` | Real-time collaboration via OT |
| 23 | MediaManager | `composer.media` | Upload, list, delete media assets; stock discovery |
| 24 | FormHandler | `composer.forms` | Form submission handling via Formspree injection |
| 25 | SyncManager | `composer.sync` | Project sync with remote storage |
| 26 | PageRouter | `composer.router` | Multi-page navigation, active page management |
| 27 | RecoveryManager | `composer.recovery` | Auto-recovery from crashes/errors |
| 28 | InteractionManager | `composer.interactions` | GSAP-backed animation triggers, interactions |
| 29 | DragManager | `composer.drag` | Element drag within canvas, z-index reorder |

> *Source: Output B §5A*

---

## 2. Keyboard Shortcuts (30+ — Non-Negotiable)

All shortcuts from `defaultCommands.ts` preserved EXACTLY. No shortcut is reassigned or removed.

### Editing Shortcuts

| Shortcut | Action | Command ID |
|---------|--------|-----------|
| Ctrl+Z | Undo | undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo | redo |
| Ctrl+S | Save | save |
| Delete / Backspace | Delete element | delete |
| Ctrl+D | Duplicate | duplicate |
| Ctrl+C | Copy | copy |
| Ctrl+X | Cut | cut |
| Ctrl+V | Paste | paste |
| ArrowUp | Nudge up 1px | nudge-up |
| ArrowDown | Nudge down 1px | nudge-down |
| ArrowLeft | Nudge left 1px | nudge-left |
| ArrowRight | Nudge right 1px | nudge-right |
| Shift+ArrowUp | Nudge up 10px | nudge-up-large |
| Shift+ArrowDown | Nudge down 10px | nudge-down-large |
| Shift+ArrowLeft | Nudge left 10px | nudge-left-large |
| Shift+ArrowRight | Nudge right 10px | nudge-right-large |
| Ctrl+] | Bring Forward | bring-forward |
| Ctrl+[ | Send Backward | send-backward |
| Ctrl+Shift+] | Bring to Front | bring-to-front |
| Ctrl+Shift+[ | Send to Back | send-to-back |
| Ctrl+' | Toggle Snap to Grid | toggle-snap-to-grid |
| Ctrl+A | Select All | select-all |
| Escape | Deselect / Exit inline edit / Close modal | deselect |

### View Shortcuts

| Shortcut | Action | Command ID |
|---------|--------|-----------|
| Ctrl+P | Preview | preview |
| Ctrl+= | Zoom In | zoom-in |
| Ctrl+- | Zoom Out | zoom-out |
| Ctrl+0 | Reset Zoom (100%) | zoom-reset |
| Ctrl+1 | Desktop View | device-desktop |
| Ctrl+2 | Tablet View | device-tablet |
| Ctrl+3 | Mobile View | device-mobile |
| Ctrl+4 | Watch View | device-watch |

### UI Shortcuts

| Shortcut | Action | Command ID |
|---------|--------|-----------|
| Ctrl+Shift+T | Open Templates modal | ui-open-templates |
| Ctrl+Shift+E | Open Exporter modal | ui-open-exporter |
| Ctrl+Shift+A | Open AI | ui-open-ai |
| Ctrl+Shift+C | Toggle Component View | ui-toggle-component-view |

### Shell Shortcuts (AquibraStudio-level)

| Shortcut | Action |
|---------|--------|
| Ctrl+K | Command Palette |
| Ctrl+J | Toggle AI Assistant Bar |
| Ctrl+/ or ? | Keyboard Shortcut Cheat Sheet |

### Tab Shortcuts (sidebar navigation)

| Key | Tab | Panel |
|-----|-----|-------|
| A | add | Build / Add elements |
| T | templates | Templates browser |
| Z | layers | Layers tree |
| P | pages | Pages manager |
| ⇧A (Shift+A) | components | Component library |
| J | media | Media library |
| D | design | Design System tokens |
| S | settings | Settings |
| U | publish | Publish panel |
| H | history | Version History |

> *Source: Output B §5B*

---

## 3. Inspector Capability Contract (3 Tabs, 14 Rendered Sections — Non-Negotiable)

All inspector sections preserved across 3 tabs. Note: some sections render in a shared ElementSettingsFooter appended to ALL tabs (Link, CSS Classes, Element Properties, All CSS).

### Tab 1 — Layout (7 sections: 4 in LayoutSection + SpacingSection + 2 conditional)

| # | Section | Controls |
|---|---------|---------|
| 1 | LayoutSection (Display) | display value (block/flex/grid/inline/inline-block/none), visibility (visible/hidden), overflow-x/overflow-y (behind advanced toggle) |
| 2 | LayoutSection (Size) | width (value + unit + auto), height (value + unit + auto), min-width, max-width, min-height, max-height |
| 3 | LayoutSection (Position) | position type (static/relative/absolute/fixed/sticky), top/right/bottom/left inputs, z-index |
| 4 | SpacingSection | margin (top/right/bottom/left, linked/unlinked), padding (top/right/bottom/left, linked/unlinked), visual box model diagram |
| 5 | FlexboxSection | (conditional: visible when display=flex) direction, wrap, align-items, justify-content, gap, flex-grow/shrink/basis per child |
| 6 | GridSection | (conditional: visible when display=grid) grid-template-columns, grid-template-rows, gap, auto-flow, alignment |
| 7 | VariantSection | (conditional: visible when element is component instance) variant selector dropdown |

### Tab 2 — Style / Appearance (3 sections in tab body + shared footer sections)

**Note:** The UI label for this tab is "Style" but the internal ID is `appearance`. AppearanceTab.tsx renders 3 sections directly; additional sections (Link, CSS Classes, Element Properties, All CSS) render via ElementSettingsFooter appended to ALL tabs.

| # | Section | Location | Controls |
|---|---------|----------|---------|
| 1 | TypographySection | AppearanceTab (conditional: isTextLike) | font-family picker (Google Fonts + system fonts), font-size, font-weight, font-style, line-height, letter-spacing, text-align, color, text-decoration, text-transform, text-overflow |
| 2 | BackgroundSection | AppearanceTab | type toggle (color/gradient/image), color picker, gradient editor, image uploader (MediaManager), background-repeat, background-size, background-position, background-blur |
| 3 | BorderSection | AppearanceTab | border-width (4 sides, linked/unlinked), border-style (none/solid/dashed/dotted), border-color, border-radius (4 corners + link toggle) |

**Shared footer sections (rendered below ALL tabs via ElementSettingsFooter):**

| Section | Controls |
|---------|---------|
| LinkSection | (conditional: linkable elements) href input, target dropdown, rel checkboxes |
| CSSClassesSection | text input for class names, applied classes list with remove buttons |
| ElementPropertiesSection | tag-specific attributes: src, alt, href, placeholder, data-* attributes etc. |
| AllCSSSection | (conditional: DevMode ON) full CSS property editor, raw CSS text input |

### Tab 3 — Behavior / Effects (4 sections in tab body)

**Note:** The UI label is "Behavior" but the internal tab ID is `effects`. Rename to "Effects" is a redesign goal (not yet implemented). Shadows and Transforms are combined inside EffectsSection, not separate sections. AI Suggestions component exists (`AISuggestionSection.tsx`) but is NOT currently rendered in any tab. AllCSSSection renders in the shared ElementSettingsFooter, not in this tab directly.

| # | Section | Controls |
|---|---------|---------|
| 1 | EffectsSection | Shadows (box-shadow layers, offset, blur, spread, color, inset), Opacity, Transforms (rotate, scale, translate, skew, transform-origin), Filters |
| 2 | AnimationSection | GSAP-backed entrance animation, trigger (on load/scroll/hover), animation type, duration (ms), delay (ms), easing function |
| 3 | InteractionsSection | event type (click/hover/scroll), action type, target element selector, parameters per action |
| 4 | VisibilitySection | show/hide toggle per breakpoint (desktop/tablet/mobile) |

**Not rendered (component exists but orphaned):**
- AISuggestionSection.tsx — AI-powered "Try this" suggestions. Component exists at 300+ LOC but is not instantiated in any tab

### Additional Inspector Capabilities (non-negotiable)

- **PseudoStateSelector:** hover, focus, active, disabled states with override indicator dots (amber `#f59e0b`, 6px)
- **BreakpointIndicator:** shows active breakpoint (desktop/tablet/mobile — 3 responsive breakpoints) as pill badge; blue dots (`#3b82f6`, 6px) on overridden properties at non-desktop breakpoints
- **ElementBreadcrumb:** shows element hierarchy (e.g., `body > section > div.hero`)
- **MultiSelectToolbar:** when 2+ elements selected — align (6 buttons), distribute (2), size match (2), wrap, group, delete
- **InspectorEmptyState:** when nothing selected — shows page name, slug, "Edit SEO" link, tips
- **Search:** filter sections by keyword
- **Collapse All / Expand All** toggle buttons
- **DevModeToggle:** positioned in inspector header (ROW 1), shows raw CSS properties
- **Scroll position persistence:** remembers scroll per element ID
- **CSS context system:** `deriveCssContext()` — enables/disables controls based on element type and display value
- **Delete with confirmation modal**
- **Copy element ID to clipboard**
- **Tag badge** showing HTML tag name (e.g., `<div>`, `<section>`, `<h1>`)

> *Source: Output B §5C, §11.2–§11.7*

---

## 4. Canvas Capability Contract (7 Overlay Toggles + 18 Overlay Components, 10+ Modes — Non-Negotiable)

### All 7 Overlay Toggle Types Preserved (CanvasOverlay interface props)

| # | Overlay | Canvas Prop | Default |
|---|---------|------------|---------|
| 1 | Element outlines | showOutlines | true |
| 2 | Ruler guides | showGuides | true |
| 3 | Spacing indicators | showSpacing | false |
| 4 | Element type badges | showBadges | false |
| 5 | Grid overlay | showGrid | false |
| 6 | Ruler bars | showRulers | false |
| 7 | X-Ray mode | showXRay | false |

### All Canvas Interaction Modes Preserved

| Mode | Hook | Behavior |
|------|------|---------|
| Inline text edit | useCanvasInlineEdit | Double-click text element → cursor appears, edit toolbar shown |
| Marquee select | useCanvasMarquee | Drag on empty canvas → dashed rectangle → all intersecting elements selected |
| Drag to reposition | useCanvasElementDrag | Drag selected element → semi-transparent, snap lines active |
| Drag from sidebar | useCanvasDragDrop | Drag element card from Build tab → ghost follows cursor, canvas shows drop zones |
| Snap-to-element | useCanvasSnapping | Elements snap to edges/centers of other elements, 6px threshold |
| Hover highlighting | useCanvasHover | Mouse over element → teal outline |
| Keyboard navigation | useCanvasKeyboard | Arrow keys nudge, Shift+arrows nudge 10px, Delete removes |
| Context menu | useCanvasContextMenu | Right-click → full context menu including "Select from stack" |
| Selection behavior | useSelectionBehavior | Click-through, additive selection (Shift+click) |
| Cursor intelligence | useCursorIntelligence | Modifier key cursor state changes |

### Additional Canvas Hooks Preserved

| Hook | Capability |
|------|-----------|
| useComposerSelection | Track selected element ID |
| useCanvasGuides | Ruler guide management |
| useCanvasSync | Sync canvas content from Composer |
| useCanvasIndicators | Spacing + guide indicator generation |
| useCanvasContent | Resolve CMS bindings in content |
| useCursorSync | Real-time cursor position broadcast (collaboration) |
| useCanvasCommandPalette | Ctrl+K command palette |
| useCanvasToolbarActions | Floating toolbar actions |
| useCanvasInlineCommands | Inline edit commands |
| useCanvasSize | Canvas size tracking |
| useSelectionAnnouncement | WCAG 4.1.3 aria-live announcements |

### Context Menu (Right-Click) — Full Content Preserved

- Select current element
- Select from stack (overlapping elements detection via `elementsFromPoint`)
- AI: Improve this element
- Standard actions (copy, cut, paste, duplicate)
- Wrap in Container
- Create Component
- Show in Layers
- Move Up/Down, Bring to Front/Send to Back
- Delete

### Other Canvas Requirements

- **Command palette (Ctrl+K):** fuzzy search across all registered commands
- **Device sizes:** desktop, tablet, mobile, watch (3 responsive breakpoints + watch device preview — non-negotiable)
- **Snap lines:** teal horizontal/vertical lines at 6px threshold with distance labels
- **Resize handles:** 8 handles on selected element
- **Floating toolbar:** 7 buttons (parent, duplicate, move up/down, copy, wrap, delete) positioned above selected element
- **Empty state (CanvasEmptyCTA):** CTA card centered with "Browse Templates" + "Start Blank" buttons

> *Source: Output B §5D, §10.1–§10.8*

---

## 5. Left Sidebar Contract (10 Tabs — Non-Negotiable)

All 10 tabs preserved. ALL sub-features within each tab preserved:

| # | Tab | Shortcut | Sub-features (ALL must exist) |
|---|-----|---------|------------------------------|
| 1 | Build / Add | A | Element catalog (CatAccordion with categories: Structure, Text, Media, Forms, Navigation, Advanced), search (SearchBar), favorites (FavZone with clear + undo toast), My Components zone, onboarding tip (OnboardingTip), tips footer, drag-to-canvas, click-to-insert |
| 2 | Templates | T | Template grid (2-column, thumbnail + name + category), filter chips (All/Pages/Sections/Landing Pages/E-commerce), view toggle (grid/list), TemplatePreviewModal (full-screen preview + "Use This Template" CTA), TemplateUseDrawer ("Replace page?" / "Add as section"), ApplyProgressOverlay (spinner + "Applying template..."), save as template (SaveTemplate modal) |
| 3 | Layers | Z | Full element tree (indented, toggle ▶/▼, element-icon, element-name, visibility toggle), canvas hover sync (bi-directional, EVENTS.CANVAS_HOVER), scroll-to-selected (EVENTS.LAYERS_SCROLL_TO_SELECTION), drag-to-reorder, right-click context menu (rename, delete, duplicate, wrap, move), empty state |
| 4 | Pages | P | Page list (PageRow: file icon, page name editable on double-click, "Home" badge, ··· context menu), context menu (Rename, Set as Home, Duplicate, Delete with confirmation), Add Page button, PageSettingsDrawer (3 sub-tabs: SEO with title/meta-description/canonical-URL, Social with og:title/og:description/og:image, Advanced with URL slug/noindex toggle/custom head code) |
| 5 | Components | ⇧A | Component library list (ComponentRow: ComponentIcon thumbnail, component name, usage count, ··· menu with edit/duplicate/delete), ComponentDetailScreen (DrillInHeader, preview frame, Edit/Duplicate/Delete actions, usage count), Create Component (from context menu or "Create" button → CreateComponent modal with name input) |
| 6 | Media | J | Source toggle ("My Files" / "Stock Photos"), TypePills (All/Images/Videos/Fonts), search, UploadZone (dashed border, drop files or click, format strip: images/video/fonts — no PDF), LibraryView (3-column grid, thumbnail + filename + size), hover state (eye icon + checkmark), selected state (indigo border + SelectionBanner with count + Insert/Delete), AssetDetailOverlay (full-screen, metadata, rename, replace, delete), DiscoveryView (stock search, filter by orientation/color, grid with attribution, "Use this image"), upload states (idle/dragging/uploading/error), ConfirmDeleteModal |
| 7 | Design | D | Color tokens (ColorTokenRow: swatch + token name + hex value + edit/delete, Add color), Typography tokens (TypeTokenRow: Aa preview + token name + font/size/weight + edit, Add type), Spacing tokens (SpacingTokenRow: visual bar + token name + px value + edit, Add spacing), Export dropdown (CSS Variables/JSON/SCSS/Tailwind config), DraftChip (amber dot + "N unsaved changes", pulsing when active), ReviewModal (before/after side-by-side, Apply All/Cancel), TabGuardModal ("You have unsaved token changes. Leave anyway?"), DesignTabFooter (Review Changes/Apply All/Revert) |
| 8 | Settings | S | Card home screen (3 groups: SITE with Site Settings/Domains/Analytics, POWER with Integrations/Advanced/Export, HELP with Get Started Tour), DrillInHeader with back navigation, SettingsNavGuard ("You have unsaved changes. Discard and go back?"), all 6 drill-in screens fully designed, plan-gating (Integrations + Advanced → Pro → LockedScreen), Coming Soon badges (Domains, Export planned formats) |
| 9 | Publish | U | Status badge (Published green / Draft amber), last published timestamp, Published URL (clickable + copy), pre-publish checklist (hasContent, hasSeoTitle, hasMetaDesc, hasSocialImg — with navigation hints), trust badge (shield icon + "Encrypted and stored securely"), actions (Publish Site / Update Site / Unpublish), publishing-in-progress state, error display + retry, privacy footer (policy + terms links) |
| 10 | History | H | ViewSwitcher (Versions / Activity pill toggle, persisted to localStorage), Versions view (VersionHistoryPanel: named versions with save/restore/compare, auto-saves with restore, "Save current version" button → name input dialog, search), Activity view (ActivityView: reverse-chronological edit log with action icons, search), undo/redo buttons, Clear history with ConfirmDialog |

> *Source: Output B §5E, §9.4–§9.13*

---

## 6. Modals Contract (13+ Types — Non-Negotiable)

| # | Modal | Trigger | File |
|---|-------|---------|------|
| 1 | Templates browser | Ctrl+Shift+T / top bar | StudioModals.tsx |
| 2 | Save Template | Internal (Build tab / context menu) | StudioModals.tsx |
| 3 | Exporter | Ctrl+Shift+E | StudioModals.tsx |
| 4 | AIAssistantBar | Ctrl+J / top bar AI button | StudioModals.tsx |
| 5 | AI Copilot | Top bar overflow menu | StudioModals.tsx |
| 6 | Keyboard Shortcuts | ? / Ctrl+/ | StudioModals.tsx |
| 7 | Media Library | Inspector background prop | StudioModals.tsx |
| 8 | Image Editor | Internal (from Media) | StudioModals.tsx |
| 9 | Icon Picker | Inspector icon prop | StudioModals.tsx |
| 10 | Collection Setup | CMS element | StudioModals.tsx |
| 11 | Create Component | Context menu on canvas | StudioModals.tsx |
| 12 | Project Settings | Logo click in top bar | StudioModals.tsx |
| 13 | Upgrade Modal | Plan gate trigger | AquibraStudio.tsx (renders separately via event listener, NOT in StudioModals.tsx) |

> *Source: Output B §5F*

---

## 7. Onboarding Contract

| Component | Behavior |
|-----------|---------|
| WelcomeModal | First visit only (phase=active, completedCount=0). Two CTAs: "Browse Templates" (opens Templates tab) and "Start Blank" (dismisses modal, canvas ready). |
| OnboardingChecklist | Floating panel with 7 steps: name-project, pick-start, add-element, edit-text, change-style, preview, publish. Steps auto-complete via events: ELEMENT_CREATED, ELEMENT_EDIT_INLINE, STYLE_CHANGED, UI_TOGGLE_PREVIEW. Minimize/Restore toggle. Dismiss (skipAll). |
| SpotlightOverlay | Dims everything except step target via CSS box-shadow cutout. Escape mechanism: `pointerEvents: "none"` allows clicking through overlay to interact with canvas. **Note:** Explicit "Explore freely →" text link is NOT implemented — escape is via pointer passthrough, not a visible UI element |
| AchievementPrompt | Fires on each step completion. Celebratory micro-animation. |

> *Source: Output B §5G*

---

## 8. CMS Contract

| Component | Must-Preserve Capability |
|-----------|-------------------------|
| CollectionManager | Define schema with 15 field types (text, textarea, richtext, number, date, datetime, boolean, select, multiselect, image, file, reference, color, url, email), manage records |
| StyleDataBinding | Bind CMS data → element CSS style properties (access: `composer.styleBindings`) |
| TraitDataBinding | Bind CMS data → element HTML attributes (access: `composer.traitBindings`) |
| TextDataBinding | Bind CMS data → element text content (access: `composer.textBindings`) |
| Collection Setup modal | Field definition UI with add/remove, field type selection, required toggle (in `src/editor/ecommerce/CollectionSetupModal.tsx`) |
| useCMSPreview hook | Resolves CMS bindings in canvas HTML, adds `data-cms-bound="true"` attribute. **Note:** "Viewing record 1/N" indicator UI is NOT implemented — hook resolves bindings but lacks record pagination UI |
| Binding flow | CMSBindingManager engine exists; **Note:** Chain icon UI in inspector and binding dropdown are NOT currently exposed in editor UI — engine-level only |

**CMS entry points (current state):**
1. ~~CMS List element in Build tab catalog~~ — NOT FOUND in current Build tab catalog
2. Collection Setup modal — EXISTS (triggered from e-commerce blocks)
3. ~~Chain icon in inspector~~ — NOT FOUND in current inspector UI
4. ~~Binding dropdown~~ — NOT FOUND as explicit inspector UI widget
**Note:** CMS binding functionality is fully implemented at engine level (CMSBindingManager, useCMSPreview) but UI entry points for binding management are not yet wired in the inspector

> *Source: Output B §5H, §12, §30 AR5*

---

## 9. Collaboration Contract

| Component | Must-Preserve Capability |
|-----------|-------------------------|
| PresenceIndicators | User avatars in top bar, max 4 shown (default `maxVisible=4`) + "+N" overflow, hover shows name + current action |
| ConnectionQualityIndicator | Colored dot: excellent (#4ade80 green), good (#facc15 amber), poor (#f87171 red), disconnected (#9ca3af gray). Shows latency on hover. Pulsing animation when syncing |
| Cursor broadcast | useCursorSync — other users' cursors shown via RemoteCursorsOverlay (SVG arrow in user color + name badge) |
| Selection awareness | **Note:** Own selection outline exists (SelectionBoxOverlay). Colored outlines for OTHER users' selections are NOT currently implemented in UI — UserEditingState is tracked in CollaborationManager but no UI component renders remote selection visuals |
| OT conflict resolution | OTEngine detects divergence (minor/moderate/severe) and emits `divergence:detected` event. **Note:** No toast notification UI subscribes to these events currently — conflict detection is engine-only, no user-facing notification |

> *Source: Output B §5I, §13.1–§13.5*

---

## 10. AI Contract

| Component | Must-Preserve Capability |
|-----------|-------------------------|
| AIAssistantBar (Ctrl+J) | Bottom bar slide-up, prompt input, context pre-fill when element selected, Generate/Clear/Close, result preview with Apply/Reject |
| Copilot modal | Full-screen, prompt textarea, template suggestions, Generate Full Page/Generate Section, preview with Accept/Reject |
| AI Suggestions | Inspector Effects tab section, "Try this" suggestions based on element type, Regenerate button |
| LayoutAnalyzer | Engine-layer module — analyzes page layout for AI suggestions |
| CodeGenerator | Engine-layer module — generates framework code from designs (Export) |
| ContentWriter | Engine-layer module — AI text generation and rewriting |
| PageGenerator | Engine-layer module — generates full page HTML from prompts |

**AI entry points (all 3 surfaces must render and function):**
1. Ctrl+J opens AIAssistantBar
2. Copilot in overflow menu
3. AI Suggestions in inspector Effects tab

> *Source: Output B §5J, §14.1–§14.4, §30 AR6*

---

## 11. Version History Contract

### Versions View (VersionHistoryPanel)
- Named versions with save/restore/compare
- Auto-saves with restore
- "Save current version" button → name input dialog
- Search versions by name
- Restore flow with confirmation dialog
- Compare split-view (side-by-side diff)

### Activity View (ActivityView)
- Reverse-chronological edit log with action icons
- Search activity entries

### Additional Requirements
- ViewSwitcher (Versions / Activity pill toggle, persisted to localStorage)
- Undo/redo buttons
- Clear history with ConfirmDialog

**Verification (AR10):** Named versions, restore, and compare flows must all be functional. "Save current version" button, restore flow with confirm, and compare split-view must all exist.

> *Source: Output B §9.13, §15.1–§15.2, §30 AR10*

---

## 12. Export & Publish Contract

### Export (Ctrl+Shift+E)
- HTML + CSS download — live, functional
- React export — Coming Soon + "Notify me" email capture
- Vue export — Coming Soon + "Notify me" email capture
- Next.js export — Coming Soon + "Notify me" email capture
- ZIP download — Coming Soon + "Notify me" email capture

### Publish
- Status badge (Published green / Draft amber)
- Last published timestamp
- Published URL (clickable + copy) — `buildrik.app/{projectId}`
- Pre-publish checklist (hasContent, hasSeoTitle, hasMetaDesc, hasSocialImg — with navigation hints wired to real data)
- Trust badge (shield icon + "Encrypted and stored securely")
- Actions: Publish Site / Update Site / Unpublish
- Publishing-in-progress state
- Error display + retry
- Privacy footer (policy + terms links)

### Preview
- Ctrl+P — full preview mode

> *Source: Output B §16.1–§16.3, §9.12, §30 AR11*

---

## 13. Accessibility & Keyboard Model

### WCAG 2.1 AA Requirements

| # | WCAG Criterion | Requirement | Implementation |
|---|---------------|-------------|----------------|
| A1 | 1.1.1 Non-text Content | Alt text for all informational images | All Lucide icons: `aria-hidden="true"` with adjacent text labels or `aria-label` on parent button. Element thumbnails in Build tab: `alt="[element type] element"` |
| A2 | 1.3.1 Info and Relationships | Structure conveyed programmatically | Inspector sections: `role="region"` + `aria-labelledby`. Accordion headers: `aria-expanded`. Tab bar: `role="tablist"` + `role="tab"` + `role="tabpanel"` + `aria-selected` |
| A3 | 1.3.2 Meaningful Sequence | DOM order matches visual order | Tab order: Rail → Sidebar → Canvas → Inspector. Within each: top-to-bottom, left-to-right |
| A4 | 1.4.3 Contrast (Minimum) | 4.5:1 for normal text, 3:1 for large text | Primary text `#F5F5F0` on `#0f0f14` = 15.4:1. Secondary `#B8B5AD` on `#0f0f14` = 9.8:1. Muted `#908D85` on `#0f0f14` = 5.9:1. All pass 4.5:1 |
| A5 | 1.4.11 Non-text Contrast | 3:1 for UI components | Border `rgba(255,255,255,0.08)` on `#0f0f14` = 1.3:1 — **AT RISK**. Focus ring `#6366f1` on `#0f0f14` = 4.6:1 — passes. Consider increasing to `rgba(255,255,255,0.12)` for critical interactive borders |
| A6 | 2.1.1 Keyboard | All functionality via keyboard | All 30+ shortcuts functional. All interactive controls reachable via Tab/Arrow/Enter/Space. No mouse-only operations. |
| A7 | 2.1.2 No Keyboard Trap | Focus can always be moved away | Modals: focus trap while open, Escape always available to close. No other traps. Canvas inline edit: Escape exits. |
| A8 | 2.4.1 Bypass Blocks | Skip to main content | Skip link: `"Skip to canvas"` — visually hidden, appears on focus. `position: absolute; top: -40px; focus: top: 8px; left: 8px; z-index: 5000` |
| A9 | 2.4.3 Focus Order | Logical and meaningful | Tab order: Skip link → Rail (top-bottom) → Sidebar header → Sidebar content → Canvas → Inspector header → Inspector content → Back to Rail |
| A10 | 2.4.7 Focus Visible | Visible focus indicator | Focus ring: `outline: 2px solid #6366f1; outline-offset: 2px`. Applied to all focusable elements. Never `outline: none` without replacement. |
| A11 | 4.1.2 Name, Role, Value | ARIA attributes on custom controls | All custom controls (toggle, segmented, color swatch, slider) have appropriate `role`, `aria-label`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax` |
| A12 | 4.1.3 Status Messages | Status conveyed without focus | Save status: `aria-live="polite"`. Toast container: `role="status"` (info/success) or `role="alert"` (error/warning). Selection: `aria-live="polite"` |

### Keyboard Navigation Map

**Global (Tab order):** `[Skip to canvas link] → Rail → Sidebar → Canvas → Inspector → (cycle)`

**Rail zone:**
| Key | Behavior |
|-----|----------|
| Arrow Up | Focus previous rail icon |
| Arrow Down | Focus next rail icon |
| Enter / Space | Activate rail icon (open/toggle panel) |
| Home | Focus first rail icon |
| End | Focus last rail icon |

**Sidebar zone:**
| Key | Behavior |
|-----|----------|
| Tab | Move between focusable elements within panel |
| Arrow Up/Down | Navigate within lists |
| Enter | Activate item |
| Escape | Close panel (if unpinned) |

**Canvas zone:**
| Key | Behavior |
|-----|----------|
| Arrow keys | Nudge selected element 1px |
| Shift+Arrow | Nudge selected element 10px |
| Enter | Enter inline edit mode (text elements only) |
| Delete / Backspace | Delete selected element(s) |
| Ctrl+A | Select all elements |
| Ctrl+D | Duplicate selected element |
| Ctrl+C / Ctrl+X / Ctrl+V | Copy / Cut / Paste |
| Ctrl+] / Ctrl+[ | Move up / Move down in sibling order |
| Ctrl+Shift+] / Ctrl+Shift+[ | Bring to front / Send to back |

**Inspector zone:**
| Key | Behavior |
|-----|----------|
| Tab | Move between controls within current section |
| Arrow Left/Right | Switch between tabs when tab bar focused |
| Space | Toggle checkboxes, toggles, segmented controls |
| Enter | Confirm edit in text/number input |
| Escape | Revert current input to previous value + blur |
| Arrow Up/Down (in number input) | Increment/decrement value by 1 |
| Shift+Arrow Up/Down (in number input) | Increment/decrement value by 10 |

### Focus Management Rules

| Event | Focus behavior |
|-------|---------------|
| Modal opens | Focus moves to modal's first focusable element. Focus trapped within modal via `inert` on background content. |
| Modal closes | Focus returns to the element that triggered the modal (stored in `previousFocusRef`). |
| Panel opens | Focus moves to panel header. |
| Panel closes | Focus moves to the rail icon that was just deactivated. |
| Tab switch (inspector) | Focus moves to first focusable control in new tab's first expanded section. |
| Element selected on canvas | Focus moves to canvas region. `aria-live` announces `"[type] selected"`. Inspector updates but does not steal focus. |
| Inline edit mode entered | Focus moves to contenteditable element on canvas. |
| Context menu opens | Focus moves to first menu item. |
| Context menu closes | Focus returns to selected element (canvas). |
| Toast appears | No focus change. Screen reader announces via `role="alert"` or `aria-live`. |
| Drag operation starts | Focus stays on source element. `aria-live` announces `"Dragging [element type]"`. |
| Drag operation ends | Focus moves to dropped element (if successful) or returns to source (if cancelled). |

### Screen Reader Announcements

| Event | aria-live | Announcement Text |
|-------|----------|-------------------|
| Element selected | `polite` | `"[Element type] selected"` |
| Multi-select | `polite` | `"[N] elements selected"` |
| Element deselected | `polite` | `"No selection"` |
| Save success | `polite` | `"Project saved"` |
| Save failure | `assertive` | `"Save failed. Check connection and retry."` |
| Publish success | `polite` | `"Site published successfully"` |
| Publish failure | `assertive` | `"Publish failed. [reason]"` |
| Element added | `polite` | `"[Element type] added to canvas"` |
| Element deleted | `polite` | `"[Element type] deleted"` |
| Undo | `polite` | `"Undo: [action description]"` |
| Redo | `polite` | `"Redo: [action description]"` |
| Panel opened | `polite` | `"[Tab name] panel opened"` |
| Panel closed | `polite` | `"Panel closed"` |
| Toast (error) | `assertive` | Toast message text |
| Toast (info/success) | `polite` | Toast message text |
| Drag start | `polite` | `"Dragging [element type]. Use arrow keys to position, Enter to drop, Escape to cancel."` |
| Breakpoint change | `polite` | `"Switched to [breakpoint] view"` |

### ARIA Landmarks

| Region | ARIA | Label |
|--------|------|-------|
| Rail | `role="navigation"` | `aria-label="Editor panels"` |
| Sidebar panel | `role="complementary"` | `aria-label="[Tab name] panel"` |
| Canvas | `role="application"` | `aria-label="Canvas editing area"` |
| Inspector | `role="complementary"` | `aria-label="Element properties"` |
| Top bar | `role="toolbar"` | `aria-label="Editor toolbar"` |
| Canvas footer | `role="toolbar"` | `aria-label="Canvas controls"` |

> *Source: Output B §20.1–§20.4*

---

## 14. Selection Model

### 14.1 Single Selection

**Trigger:** Click element on canvas, or click element in Layers tree, or click element via context menu "Select from stack" submenu.

**Visual spec:**
- Selected outline: `2px solid #6366f1` (`--aqb-primary`) on element bounding box
- Resize handles: 8 handles
- Floating toolbar: positioned above element
- Layers tree: corresponding node highlighted with `background: rgba(99,102,241,0.12)`; tree auto-scrolls if node is outside visible area

**Inspector behavior:**
- Transitions to IS-2 (full inspector)
- If element type changed: tab preserved but sections may change (e.g., Flexbox appears/disappears based on display value)
- Scroll position within tab: preserved if same tab, reset to top if tab changes

### 14.2 Multi-Selection

**Method 1 — Shift+click:**
- From single selection: Shift+click another element → both selected
- From multi-selection: Shift+click selected element → removes from selection (toggle)
- From multi-selection: Shift+click unselected element → adds to selection
- Order: selection order preserved (first selected = primary for alignment reference)

**Method 2 — Marquee select:**
- Mousedown on empty canvas area + drag
- Marquee rectangle: `border: 1px dashed #6366f1; background: rgba(99,102,241,0.08)` with animated dash offset
- All elements whose bounding box **intersects** (not fully contained) the marquee are selected on mouse release
- If zero elements intersected: selection cleared → state `none`

**Method 3 — Ctrl+A (Select All):**
- Selects all elements on current page
- Canvas: all elements get indigo outline
- Inspector: MultiSelectToolbar with count = total elements

**Multi-select canvas visuals:**
- Each selected element: `2px solid #6366f1` outline (no resize handles on individuals)
- Group bounding box: `1px dashed rgba(99,102,241,0.4)` around collective bounds
- Floating toolbar replaced by MultiSelectToolbar above group bounding box
- Drag any selected element → all move together (maintaining relative positions)

### 14.3 Selection Context Menu — Select from Stack

**Purpose:** When elements overlap (stacked via z-index or absolute positioning), right-click → "Select from stack" reveals all elements at the click coordinates.

**Implementation:** Uses `document.elementsFromPoint(clientX, clientY)`, filtered to canvas-managed elements only.

**Each entry in submenu:**
- Icon: element-type-specific Lucide icon, 14×14px
- Label: element type name
- Sub-label (if element has custom name/ID)
- Canvas preview on hover: hovered entry's element shows teal highlight outline on canvas
- Click: selects that element, closes entire context menu
- Stack order: topmost element (highest z-index / last in DOM order) first, bottommost last

> *Source: Output B §21.1–§21.3*

---

## 15. Information Architecture (Layout Grid, Zone Ownership)

### Layout Grid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TOP BAR (52px CSS / 48px TS constant)                    │
│  Full width, fixed, z-index: 1000                                           │
├──────────┬────────────────┬───────────────────────────┬─────────────────────┤
│   RAIL   │  LEFT SIDEBAR  │          CANVAS            │    INSPECTOR        │
│  (68px)  │   (320px)      │         (flex: 1)          │     (300px)         │
│  fixed   │  [drawer mode] │                            │   [right panel]     │
│  left    │  overflow-y:   │                            │   overflow-y:       │
│  full-h  │  auto          │                            │   auto              │
│          │                │   CANVAS FOOTER (40px)     │                     │
├──────────┴────────────────┴───────────────────────────┴─────────────────────┤
│  Total minimum viewport: 1024px wide (below this, editor is not supported)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Reference viewport:** 1440 × 900px (design target).
**Minimum supported:** 1024 × 768px (below this: unsupported, show "Please use a larger screen").

### Zone Ownership

| Zone | Owner | Width | Height | Resizable | Collapsible | Background | z-index |
|------|-------|-------|--------|----------|------------|------------|---------|
| Top Bar | Shell (StudioHeader.tsx + Topbar.tsx) | 100% viewport | 52px (CSS var) / 48px (TS constant) | No | No | --aqb-surface-1 (#0f0f14) | 1000 |
| Rail | Navigation (Rail.tsx + tabsConfig.ts) | 68px (CSS var) / 60px (TS constant) | viewport - topbar | No | No | --aqb-surface-1 (#0f0f14) | 900 |
| Left Sidebar | Left Panel (LeftPanel.tsx) | 320px default (compact: 280px, extended: 400px) | viewport - topbar | Yes (drag right edge, 280→400px) | Yes (closes to 0px, rail remains) | --aqb-surface-1 (#0f0f14) | 800 |
| Canvas | Editing surface (Canvas.tsx) | flex: 1 (fills remaining) | viewport - topbar - 40px footer | Yes (zoom/device changes content size) | No | #F2F2F2 surrounding, #FFFFFF canvas content | 1 |
| Canvas Footer | Overlay controls + zoom (CanvasFooterToolbar.tsx) | same as Canvas | 40px fixed | No | No | --aqb-surface-1 (#0f0f14) | 100 |
| Right Inspector | Properties panel (ProInspector.tsx) | 300px default (TS constant INSPECTOR_WIDTH) | viewport - topbar | Yes (drag left edge) | Yes (collapses to 0px) | --aqb-surface-1 (#0f0f14) | 800 |

### Layout Calculation

```
Canvas width = viewport_width - rail(68px) - sidebar(320px) - inspector(300px)
             = viewport_width - 688px
At 1440px:   = 752px available for canvas
At 1024px:   = 336px available for canvas (minimum)

When sidebar collapsed: canvas gains 320px
When inspector collapsed: canvas gains 300px
Both collapsed: canvas = viewport_width - 68px
```

### Scrollable vs Fixed Zones

| Zone | Scroll Behavior |
|------|----------------|
| Top Bar | Fixed, never scrolls |
| Rail | Fixed; if viewport too short for all 10 icons, bottom zone scrolls independently |
| Left Sidebar | Panel header fixed at top (48px); panel content scrolls independently (overflow-y: auto) |
| Canvas | Zoom/pan via Viewport manager; no browser scroll — canvas handles its own scroll via transform |
| Canvas Footer | Fixed at bottom of canvas area |
| Inspector | Inspector header fixed (element identity + tabs, ~140px); section content scrolls independently |

> *Source: Output B §6.1–§6.4*

---

## 16. Anti-Regression Notes (25 Risks — from Output B §30)

| # | Risk | What could go wrong | Verification | Pass criteria |
|---|------|--------------------|--------------|--------------|
| AR1 | Inspector sections removed for visual simplicity | Designer/developer reduces sections to "simplify" | Count sections per tab in rendered UI | Layout=7, Style(Appearance)=3 + shared footer sections, Behavior(Effects)=4. Total rendered: 14 in tabs + 4 in shared footer |
| AR2 | Pseudo-state selector removed | Pseudo-state row dropped from inspector header | Verify ROW 6 exists with 5 buttons | Normal + Hover + Focus + Active + Disabled all present and functional |
| AR3 | Components tab not in rail | Rail currently has 8 icons (Components excluded); redesign adds it | Count rail icons | Target: TOP: 6 icons (add Components). Current: 5 TOP |
| AR4 | Publish tab not in rail | Publish currently keyboard-only (U); redesign adds to rail | Verify BOTTOM zone has Publish icon | Target: BOTTOM: 4 icons (add Publish). Current: 3 BOTTOM |
| AR5 | CMS UI not designed/implemented | CMS surfaces missing entirely | Verify 4 CMS entry points | All 4 functional |
| AR6 | AI surfaces reduced to single button | Only AI button in top bar | Verify 3 AI surfaces | All 3 render and function |
| AR7 | Keyboard shortcuts changed or removed | Shortcuts conflict or silently dropped | Run automated shortcut test | All 30+ produce correct action |
| AR8 | Multi-select inspector not implemented | Inspector shows nothing for multi-select | Shift+click 2 elements → verify MultiSelectToolbar | Align (6) + Distribute (2) + Size (2) + Actions (3) visible |
| AR9 | Canvas overlays reduced | Footer toolbar has fewer than 7 toggles | Count toggles in footer | All 6 toggleable overlays present + functional |
| AR10 | History reduced to undo stack only | Named versions, restore, compare removed | Verify all 3 capabilities | "Save current version", restore flow, compare split-view |
| AR11 | Export simplified to HTML only | Coming-soon formats dropped | Verify export modal shows all 5 formats | HTML+CSS downloadable. Others show "Coming Soon" + "Notify me" |
| AR12 | Settings sub-screens collapsed | Fewer than 6 cards on home screen | Count settings cards | All 6 accessible |
| AR13 | Onboarding flow removed | No WelcomeModal on first visit | Verify first-visit experience | All 4 onboarding components present |
| AR14 | Context menu "Select from stack" removed | Right-click menu missing stack submenu | Right-click overlapping elements | Submenu lists all elements at click point |
| AR15 | Design token export removed | Export dropdown missing or reduced | Verify Design tab export | CSS Variables, JSON, SCSS/Tailwind available |
| AR16 | Inspector DevModeToggle buried or removed | Not in inspector header ROW 1 | Verify `</>` toggle in ROW 1 | Toggle visible without scrolling |
| AR17 | Breakpoint-aware editing indicators missing | No blue dots on overridden properties | Switch to Tablet → override → verify blue dot | 6px blue dot appears with desktop value tooltip |
| AR18 | Canvas empty state missing | Blank project shows empty white canvas | Create blank project → verify CanvasEmptyCTA | CTA card with "Browse Templates" + "Start Blank" |
| AR19 | Snap lines not implemented | No alignment guides during drag | Drag near another element | Teal lines at 6px threshold with distance labels |
| AR20 | Floating element toolbar missing | Selected element has no toolbar | Click element → verify toolbar | 7 buttons visible |
| AR21 | Confirm dialog missing on destructive actions | Delete executes immediately | Click delete → verify ConfirmDialog | Dialog with consequence text |
| AR22 | Command palette keyboard navigation broken | Arrow keys/Enter don't work | Open Ctrl+K → navigate with arrows → Enter | Navigation works, Escape closes |
| AR23 | Collaboration cursors not rendering | Collaborator cursors not visible | Connect 2 users → verify | SVG arrow in user color + name badge |
| AR24 | Toast notifications not appearing | Actions complete silently | Perform save/publish/delete → verify | Toast appears with correct variant + duration |
| AR25 | Accessibility focus ring removed | Focus indicator not visible on keyboard nav | Tab through all UI zones | `2px solid #6366f1, offset 2px` on every focusable element |

**Additionally from Output A §A.6 (15 anti-regression risks R1-R15) — see Part 1 §7 for full table.**

> *Source: Output B §30, Output A §A.6*

---

## 17. Anti-Downgrade Validation Checklist (56 Items — from Output E)

### E.1 Rail and Navigation (N1–N6)

| # | Feature | Check |
|---|---------|-------|
| N1 | Rail has exactly 10 icons total | Count: 6 TOP + 4 BOTTOM |
| N2 | TOP zone contains: Add, Media, Layers, Templates, Pages, Components | Name each icon |
| N3 | BOTTOM zone contains: Design, Settings, Publish, History | Name each icon |
| N4 | Active rail icon has distinct visual state (not just color change) | Look for pill/badge |
| N5 | Rail icon tooltip shows shortcut key | Hover any icon |
| N6 | All 10 tabs have keyboard shortcuts shown in tooltip or cheat sheet | Check shortcut table |

### E.2 Left Sidebar Panels (S1–S20)

| # | Feature | Check |
|---|---------|-------|
| S1 | Build tab: element categories visible in accordion | Look for CatAccordion |
| S2 | Build tab: favorites zone exists | Look for FavZone |
| S3 | Build tab: "My Components" zone exists | Look for MyComponents |
| S4 | Templates tab: template grid + preview modal | Both must exist |
| S5 | Templates tab: apply progress overlay | Look for ApplyProgressOverlay |
| S6 | Layers tab: element tree (not just flat list) | Verify hierarchy |
| S7 | Pages tab: SEO / Social / Advanced sub-tabs | Check PageSettingsDrawer |
| S8 | Components tab: library + detail screen | Both views must exist |
| S9 | Media tab: "My Files" AND "Stock Photos" sources | Both tabs must exist |
| S10 | Media tab: type filter pills (image/video/font) | Look for TypePills |
| S11 | Design tab: color + type + spacing token sections | All 3 must exist |
| S12 | Design tab: export dropdown (CSS/JSON/SCSS) | Export button must exist |
| S13 | Design tab: draft chip + review modal | Both must exist |
| S14 | Settings tab: 6 sub-screen cards on home | Count: Site/Domains/Analytics/Export/Integrations/Advanced |
| S15 | Settings tab: drill-in screens (all 6 accessible) | Test navigation to each |
| S16 | Publish tab: pre-publish checklist | 5 items visible |
| S17 | Publish tab: published URL + copy button | Look for UrlDisplay |
| S18 | Publish tab: Unpublish button | Must exist when published |
| S19 | History tab: Named Versions + Activity views | ViewSwitcher must exist |
| S20 | History tab: Restore + Compare actions | Both on hover |

### E.3 Canvas (C1–C12)

| # | Feature | Check |
|---|---------|-------|
| C1 | Canvas empty state exists (CanvasEmptyCTA) | Blank canvas screen |
| C2 | Element selected: resize handles (8 points) | Handle design |
| C3 | Element selected: floating toolbar | Toolbar above element |
| C4 | Multi-select: marquee rectangle | Dashed rectangle |
| C5 | Multi-select: MultiSelectToolbar | Align/distribute toolbar |
| C6 | Drop zone: valid + invalid states | Teal vs red indicators |
| C7 | Snap lines: horizontal + vertical | Teal lines |
| C8 | Canvas footer: all 7 overlay toggles | Count toggles |
| C9 | Canvas footer: zoom controls | - / % / + / Fit |
| C10 | X-Ray mode: canvas visual exists | Wireframe overlay |
| C11 | Context menu: "Select from stack" submenu | Submenu exists |
| C12 | Inline edit mode: text cursor visible | Text editing state |

### E.4 Inspector (I1–I14)

| # | Feature | Check |
|---|---------|-------|
| I1 | Inspector: 3 tabs (Layout / Style / Effects) | Count tabs |
| I2 | Layout tab: 7 sections | Count: Position/Display/Size/Spacing/Flexbox/Grid/Variants |
| I3 | Style tab: 7 sections | Count: Typography/Background/Border/CSS Classes/Link/Visibility/Data Attributes |
| I4 | Effects tab: 6 sections | Count: Shadows/Transforms/Animation/Interactions/AI Suggestions/All CSS |
| I5 | Pseudo-state row: 4 states (hover/focus/active/disabled) | Count state buttons |
| I6 | Pseudo-state: override indicator dot | Dot on state buttons |
| I7 | Breakpoint indicator: shows current device | Pill in header |
| I8 | DevModeToggle: visible in inspector header | Not buried |
| I9 | Inspector empty state: shows page properties | InspectorEmptyState |
| I10 | Multi-select inspector: align/distribute controls | MultiSelectToolbar |
| I11 | Element breadcrumb: shows hierarchy | Breadcrumb row |
| I12 | Search sections input: in header | Search input |
| I13 | Collapse All / Expand All: in header | Buttons |
| I14 | Delete with confirmation: confirm modal exists | Not instant delete |

### E.5 Modals and Overlays (M1–M10)

| # | Feature | Check |
|---|---------|-------|
| M1 | Command Palette: search + grouped results + keyboard nav | Ctrl+K modal |
| M2 | Keyboard Cheat Sheet: full shortcut reference | ? modal |
| M3 | Templates modal: browse + preview + apply flow | Full modal |
| M4 | Export modal: HTML (live) + planned formats | Ctrl+Shift+E modal |
| M5 | AI Copilot modal: full-page generation | Copilot modal |
| M6 | AIAssistantBar: bottom slide-up panel | Ctrl+J surface |
| M7 | Collection Setup: field definition UI | CMS modal |
| M8 | Create Component modal: name input | Modal |
| M9 | UpgradeModal: unlock prompt | Modal |
| M10 | WelcomeModal: first visit | Welcome design |

### E.6 CMS, Collaboration, AI (A1–A8)

| # | Feature | Check |
|---|---------|-------|
| A1 | CMS binding UI: chain icon on inspector properties | Visible in inspector |
| A2 | CMS preview: record cycling (1/N) indicator | Visible on canvas |
| A3 | Collaboration: presence avatars in top bar | Avatars |
| A4 | Collaboration: live cursors on canvas | Cursor design |
| A5 | Collaboration: connection quality indicator | Dot/indicator |
| A6 | AI: AIAssistantBar accessible from top bar | AI button visible |
| A7 | AI: Copilot accessible from overflow menu | In ··· menu |
| A8 | AI: AI Suggestions in Effects tab | Section in inspector |

### E.7 Onboarding (O1–O4)

| # | Feature | Check |
|---|---------|-------|
| O1 | WelcomeModal designed | First-visit screen |
| O2 | OnboardingChecklist: 5-step floating panel | Designed |
| O3 | SpotlightOverlay with "Explore freely →" escape | Escape link visible |
| O4 | AchievementPrompt: step completion screen | Designed |

### Grading Scale

| Grade | Criteria |
|-------|---------|
| **PASS** | All N-series (navigation), I-series (inspector), and C-series (canvas) items Preserved |
| **CONDITIONAL PASS** | ≤ 3 items "At Risk" — must be corrected before implementation |
| **FAIL** | Any item "Missing" in N/I series, or ≥ 4 items "At Risk" overall |

**A Stitch design output that gets a FAIL grade must be revised before any engineering work begins.**

> *Source: Output E (lines 4754–4885)*

---

## 18. Source Notes + Unclear / Needs Clarification

### 18.1 State Machines (Preserved from Output B §19)

Three state machines govern editor behavior and must be preserved:

**Panel State Machine** — 4 states (`closed`, `open-unpinned`, `open-pinned`, `expanded`), 13 transitions (P1–P13). Panel state persisted in `localStorage` per user.

**Selection State Machine** — 5 states (`none`, `single`, `multi`, `inline-edit`, `context-menu`), 24 transitions (S1–S24).

**Save State Machine** — 5 states (`idle`, `dirty`, `saving`, `auto-saving`, `error`), 11 transitions (SV1–SV11). Auto-save at 5000ms of inactivity. Auto-save does NOT reset dirty flag (only explicit Ctrl+S does). Browser beforeunload shows confirmation when dirty.

> *Full state machine transition tables preserved in `prd_final.md` Output B §19.1–§19.3*

### 18.2 Command Palette & Keyboard Cheat Sheet (Preserved from Output B §17)

**Command Palette (Ctrl+K):**
- Container: `560px wide, max-height 480px`, `z-index: 3000`
- Fuzzy match against command label, command ID, shortcut key text
- Results grouped by: Recent, Navigation, Edit, View, AI, Export
- Keyboard navigation: Arrow Down/Up, Enter to execute, Escape to close
- Empty query shows Recent (last 5) + all groups

**Keyboard Cheat Sheet (?):**
- Container: `640px wide, max-height 80vh`
- Two-column layout with categories: Editing, Canvas, Navigation (Sidebar), Zoom, Advanced
- Each shortcut rendered as keyboard badge

> *Full specs preserved in `prd_final.md` Output B §17.1–§17.2*

### 18.3 Items Requiring Clarification

| Item | Source | What's unclear |
|------|--------|---------------|
| WCAG A5 border contrast | Output B §20.1 | `rgba(255,255,255,0.08)` on `#0f0f14` = 1.3:1 — below 3:1. PRD suggests increasing to 0.12. Decision needed. |
| Plugin system UI | Output B §29.3, Output C | Engine-level only. No UI surface. Intentionally deferred. |
| Inspector Style tab count | Output B §11.3 | 7 sections + 1 conditional (Element Properties). Not a contradiction — conditional section is tag-specific. |
| Canvas X-Ray mode | Output B §10.1 CS-11 | Was "AT RISK" in Output C. Now fully specified in B. Reconciliation marks as RESOLVED. |

### 18.4 Coverage Status

**Output C grade: 97% → 99%** (after B expansion resolved X-Ray mode spec)
- Only remaining AT RISK: Plugin UI — intentionally deferred to future (no UI surface designed)
- All 77 coverage items in Output C verified against expanded B
- All 56 Anti-Downgrade Checklist items in Output E covered by B sections
- No contradictions found between any outputs (B.1 reconciliation notes confirm)

### 18.5 Source Traceability

| Part 2 Section | Primary PRD Source |
|---------------|-------------------|
| §1 Engine Capabilities | Output B §5A |
| §2 Keyboard Shortcuts | Output B §5B |
| §3 Inspector Contract | Output B §5C, §11.2–§11.7 |
| §4 Canvas Contract | Output B §5D, §10.1–§10.8 |
| §5 Sidebar Contract | Output B §5E, §9.4–§9.13 |
| §6 Modals Contract | Output B §5F |
| §7 Onboarding Contract | Output B §5G |
| §8 CMS Contract | Output B §5H, §12 |
| §9 Collaboration Contract | Output B §5I, §13.1–§13.5 |
| §10 AI Contract | Output B §5J, §14.1–§14.4 |
| §11 Version History | Output B §9.13, §15.1–§15.2 |
| §12 Export & Publish | Output B §16.1–§16.3, §9.12 |
| §13 Accessibility | Output B §20.1–§20.4 |
| §14 Selection Model | Output B §21.1–§21.3 |
| §15 Information Architecture | Output B §6.1–§6.4 |
| §16 Anti-Regression Notes | Output B §30, Output A §A.6 |
| §17 Anti-Downgrade Checklist | Output E |
| §18 Source Notes | Output B §19, §17, §B.1 |

---

*End of PART_2_MUST_PRESERVE_CAPABILITY_CONTRACT.md*

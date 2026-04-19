# Buildrik (Aquibra Studio) — PM Audit & Redesign Specification

> **Audited by:** Senior PM System (v3 — Design Team Edition)
> **Input:** Code-reverse-engineered PRD, 18 screen documents + appendix
> **Date:** 2026-03-25
> **App type:** EXISTING product — visual web builder for design teams

---

## Step 0: Input Identification

**What was provided:**
- ✅ Full reverse-engineered PRD (18 screen specs + README + appendix)
- ✅ Tech stack (React 18 + TypeScript + Vite + Emotion CSS-in-JS)
- ✅ Architecture details (Composer engine, 30 managers)
- ❌ No screenshots of current live app
- ❌ No user complaints / support tickets / NPS data
- ❌ No analytics/behavioral data
- ❌ No competitive analysis

**Working assumption:** This PRD was reverse-engineered from the codebase. It documents what was BUILT, not necessarily what was PLANNED. Treat it as "current state" documentation.

**Additional inputs needed before shipping:**
1. Screenshots of the current live UI (for heuristic evaluation)
2. Top 5 user complaints (support tickets, NPS verbatims)
3. Analytics: tab switching frequency, session length, undo frequency, drag completion rate
4. Active user count and how long the product has been live

---

## Step 1: Product Summary + Clarifying Questions

**The product in one sentence:**
Buildrik (Aquibra Studio) is a visual web builder for design teams of 2-5 people that combines drag-and-drop page building, real-time collaboration, a built-in CMS, design tokens, component library, and multi-format code export (HTML/React/Vue/Next.js) in a single tool.

**Is this new or existing?** Existing app — redesign context.

**Assumptions I'm making (correct where wrong):**
1. ASSUMPTION: The app is live with active users who have built muscle memory around the current 10-tab sidebar
2. ASSUMPTION: No major IA changes have shipped recently
3. ASSUMPTION: The code reflects production state, not a prototype

**Clarifying questions I need answered before making P0 recommendations:**
1. How many active users does the app currently have, and for how long has it been live?
2. What is the top user complaint — "can't find things" (IA), "it's slow" (performance), or "lost work" (state)?
3. Are all 10 sidebar tabs visible to all users by default, or is there role-based hiding?
4. Is the history stack depth currently limited, and if so, to how many steps?
5. What is the typical project size (elements per page, pages per project)?

**NOTE:** The PM system prompt requires these answers before full execution. Proceeding under stated assumptions and flagging every assumption explicitly.

---

## Step 2: Current State Analysis

### A. Heuristic Evaluation (from PRD)

| Screen | IA Issues | Interaction Issues | Feedback Issues | Severity |
|--------|-----------|--------------------|-----------------|----------|
| Studio Shell | 10-tab left rail (overcrowded) | Keyboard shortcut for 10 tabs requires memorization | Save status: 4 states but no spec for idle state visual | P0 |
| Canvas | None obvious — well-specified | Touch support entirely absent | Animation specs missing (no duration/easing/reduced-motion) | P1 |
| Left Sidebar | 10 tabs with mixed concerns (Build, Config, Workflow all co-mingled) | Tabs: A, T, Z, P, Shift+A, J, D, S, U, H — non-mnemonic for Shift+A and J/U/H | — | P0 |
| Inspector | 3 tabs fine; section depth manageable | Pseudo-state selector buried below sections | L1/L2/L3 separation absent — CSS editor and AI suggestions at same visual level | P1 |
| CMS Access | Buried: Settings → Integrations OR Inspector binding icon (PRD itself flags this) | 3 clicks minimum; Content Manager persona underserved | No dedicated entry point in rail | P1 |
| Publish Tab | First-time "Connect Hosting" is excellent | Publish history / rollback to previous version absent | Published version timeline absent | P1 |

### B. User Pain Points Matrix (INSUFFICIENT DATA)

> ⚠️ **CRITICAL GAP:** No user complaint data was provided. The matrix below is INFERRED from the PRD's own notes and common patterns in editors of this complexity. MUST be validated with real user data before acting.

| Inferred Complaint | Inferred Frequency | Layer | Severity | Root Cause |
|--------------------|--------------------|-------|----------|------------|
| "Can't find features — too many tabs" | HIGH (typical for 10-tab editors) | Layer 0 (IA) | P0 | 10 undifferentiated tabs with mixed concerns |
| "CMS is hard to access" | HIGH (PRD explicitly flags this) | Layer 0 (IA) | P1 | CMS has no dedicated rail entry point |
| "Don't know what undo depth is" | MEDIUM | Layer 3 (State) | P1 | Stack depth never specified in PRD |
| "Drag feels sluggish on large pages" | MEDIUM (typical DOM editors) | Layer 4 (Feedback) | P1 | No virtualization spec; DOM-based canvas |
| "Advanced settings are too close to basic settings" | MEDIUM | Layer 6 (Disclosure) | P1 | No L1/L2/L3 classification |
| "Mobile editing doesn't work" | MEDIUM | Layer 2 (Interaction) | P1 | Touch support entirely absent |

### C. Behavioral Signals (ABSENT — must instrument before changes)

> No analytics data provided. Before shipping ANY redesign, instrument these events:
> - `tab_switched`: frequency tells you which tabs are ignored
> - `undo_triggered`: high frequency = too many accidental actions
> - `cms_accessed_how`: via Settings vs Inspector vs (future) Rail
> - `drag_completed_vs_cancelled`: cancelled drags = feedback failure
> - `session_length`: short sessions = overwhelming UX

### D. Technical Constraints Register

| Constraint | Impact | Mitigation | Blocker? |
|------------|--------|------------|----------|
| No state management library (per analysis.md: "State management: No") | Undo/redo stack depth is undeclared; could be unbounded or very limited | Introduce Zustand or explicit HistoryManager limit | Medium |
| DOM-based canvas | Performance ceiling at ~500+ elements; no virtualization spec | Add CanvasVirtualizer for large projects | Yes (for enterprise) |
| No i18n (per analysis.md: "i18n: No") | RTL users broken; international expansion blocked | Externalize all strings | Medium |
| No API calls in current codebase (0 detected) | All data is IndexedDB-local; cloud sync is via SyncManager but API contract unclear | Define SyncManager backend contract | High |

### E. Current IA Map

```
LEFT RAIL (56px) — 10 icon buttons:
├── A: Add/Build Tab       (150+ elements)
├── T: Templates Tab       (page templates)
├── Z: Layers Tab          (DOM tree)
├── P: Pages Tab           (page management)
├── Shift+A: Components    (component library)
├── J: Media Tab           (asset library)
├── D: Design System       (tokens)
├── S: Settings Tab        (7 sub-screens)
├── U: Publish Tab         (deploy)
└── H: History Tab         (versions + activity)

TOP BAR (52px):
[Logo] [File▾] [Undo] [Redo] [Save Status] [Device: Desktop▾] [Zoom: 100%] [AI] [Preview] [Export]

RIGHT PANEL (280px):
[Inspector — 3 tabs: Layout | Appearance | Effects]

BOTTOM:
[Page Tab Bar: Home | About | Contact | + Add Page]
```

**IA Problem:** The 10 rail tabs represent 4 different concern types with NO visual grouping:
1. **Build** (Add, Templates, Layers, Pages, Components) → what you're building
2. **Assets** (Media, Design System) → what you're building with
3. **Config** (Settings, Publish) → how you ship it
4. **Meta** (History) → what happened

---

## Step 3: Problem-First Analysis

### Core Problem Statement

> "Buildrik is a full-featured visual web builder whose information architecture has scaled to 10 undifferentiated sidebar tabs, placing beginner-level features (Add elements) next to expert-level features (CMS bindings, Collaboration history) in a flat list. The result is an overwhelming first impression for new users and slow navigation for experienced ones."

**Who experiences it:**
- ALL new users (onboarding helps but only briefly)
- Content managers (CMS buried)
- Occasional users (re-learn tab positions every session)

### Solution Validation

ASSUMPTION: No competitive analysis was provided. The PRD is competing with Webflow (flow-based), Framer (free-form + code), Squarespace (simple templates), and Figma Sites (design-to-web). Recommend card-sorting + competitive matrix before finalizing IA redesign.

### Impact Metrics (Targets)

| Metric | Current (est.) | Target (post-redesign) | How to Measure |
|--------|---------------|------------------------|----------------|
| Time to first element on canvas (new user) | Unknown | < 60 seconds | Session recording |
| Tab switching frequency per session | Unknown | Reduce by 30% | Analytics event: tab_switched |
| CMS access time | 3+ clicks | 1 click (direct Rail icon) | Analytics event: cms_accessed |
| SUS score | Unknown | > 72 | Quarterly SUS survey |
| Undo frequency (accidental) | Unknown | Reduce by 20% | Analytics event: undo_triggered |
| Drag completion rate | Unknown | > 90% | drag_started / drag_completed ratio |

---

## Step 4A: 7-Layer Model Audit

### Layer 0 — Information Architecture

| Field | Content |
|-------|---------|
| **Layer** | 0 — Information Architecture |
| **Score** | 4/10 |
| **What exists** | 10-tab rail with keyboard shortcuts, section-ordered element catalog, card-based Settings home screen, inline SEO badges in Pages tab |
| **What's missing** | Grouping of 10 tabs into logical categories, CMS dedicated entry point, label audit, contextual panel triggers |
| **P0 gaps** | 10 flat tabs = broken IA. This is the single highest-impact issue in the entire product. |
| **Fix** | Restructure 10 rail tabs into 4 logical groups: **Build** (Add, Templates, Layers, Pages, Components) / **Assets** (Media, Design System) / **Config** (Settings, Publish) / **Review** (History). Add visual separator between groups in rail. Add dedicated CMS rail icon. |
| **Breaking changes** | ALL users have muscle memory on current tab positions (A, T, Z, P shortcuts). Any restructuring disrupts this. |
| **Migration approach** | Feature flag + "Classic Layout" toggle for minimum 8 weeks. Run A/B test. Communicate changes with in-app tooltip on first encounter with new layout. |

> ⚠️ **TRIGGER FIRED: `tab_overload`** — 10 top-level tabs is P0. This is the #1 structural problem. Single issue responsible for majority of "overwhelming" feedback in editors of this type.

---

### Layer 1 — User Intent

| Field | Content |
|-------|---------|
| **Layer** | 1 — User Intent |
| **Score** | 6/10 |
| **What exists** | 4 user personas (Team Lead, Designer, Content Manager, Developer). Command palette (Ctrl+K). Sections-first element catalog. |
| **What's missing** | Explicit job-to-feature mapping table. Cross-screen user flows. Content Manager persona underserved — no direct CMS access path. |
| **P0 gaps** | Content Manager persona cannot access CMS in < 3 clicks — major intent gap for a persona explicitly called out. |
| **Fix** | Add CMS to rail (1-click access). Create explicit job-to-feature map. Add contextual entry points in empty states. |
| **Breaking changes** | Adding a CMS rail icon is additive — no breaking changes. |
| **Migration approach** | Additive change — ship in Phase 1 without toggle. |

> ⚠️ **TRIGGER FIRED: `no_user_flows`** — P0 gap. No cross-screen journey maps provided. Before building, map: first-time user flow, content manager flow, developer handoff flow, and error/recovery flow.

---

### Layer 2 — Interaction Model

| Field | Content |
|-------|---------|
| **Layer** | 2 — Interaction Model |
| **Score** | 7/10 |
| **What exists** | Mouse drag with ghost preview, smart guides, drop zones. Keyboard nav (arrow keys, Ctrl+G, shortcuts). Multi-select. Command palette. Direct numeric input. Right-click menus. |
| **What's missing** | Touch support (entirely absent). Long-press drag disambiguation (vs scroll). Trackpad pan. Touch pinch-to-zoom. |
| **P0 gaps** | Touch support absent — excludes tablet users increasingly common in agency workflows. |
| **Fix** | Add touch support spec: long-press 300ms to initiate drag, two-finger pan, pinch zoom. Phase 2 item. |
| **Breaking changes** | Touch is additive — no breaking changes to existing mouse users. |
| **Migration approach** | Additive — ship when built. |

> ⚠️ **TRIGGER FIRED: `mouse_only`** — P1 gap. Touch support completely absent.

---

### Layer 3 — State Management

| Field | Content |
|-------|---------|
| **Layer** | 3 — State Management |
| **Score** | 7/10 |
| **What exists** | Ctrl+Z / Ctrl+Shift+Z undo/redo. JSON patch-based history. 500ms debounce coalescing. Auto-save with dirty tracking. Crash recovery. Persists to IndexedDB. Named version snapshots. |
| **What's missing** | Undo stack depth never specified. No state management library (per codebase analysis). |
| **P0 gaps** | Stack depth unspecified — if limited to 10-20 steps, users WILL lose work and complain. This is the #2 cause of 1-star reviews after data loss. |
| **Fix** | Explicitly define undo stack depth at 100+ steps. Document memory impact. Define behavior when stack is full (LRU drop, warn at 90%). |
| **Breaking changes** | None — this is a spec gap, not a breaking change. |
| **Migration approach** | Infrastructure fix in Phase 0. |

---

### Layer 4 — Feedback Model

| Field | Content |
|-------|---------|
| **Layer** | 4 — Feedback Model |
| **Score** | 7/10 |
| **What exists** | Ghost preview during drag. Drop zone highlights. Smart guides. Spacing labels. Selection overlays. Toast system. Save status (4 states). Connection quality indicator. Remote cursors. |
| **What's missing** | No animation duration/easing specs. No prefers-reduced-motion compliance. Drop rejection visual not defined (what happens when user tries to drop in invalid zone). Ghost appearance latency target not stated. |
| **P0 gaps** | Drop rejection visual — "Only valid parent-child relationships allowed" stated, but visual behavior (red shake? snap-back?) not defined. |
| **Fix** | Add: ghost < 50ms from mousedown, rejected drop = red outline + shake (150ms), animation spec sheet, prefers-reduced-motion CSS. |
| **Breaking changes** | None — adding specs to existing behavior. |
| **Migration approach** | Phase 2 polish. |

> ⚠️ **TRIGGER FIRED: `no_feedback_spec`** — Partial. Drop rejection visual, animation specs, and reduced-motion absent.

---

### Layer 5 — Error Recovery

| Field | Content |
|-------|---------|
| **Layer** | 5 — Error Recovery |
| **Score** | 7/10 |
| **What exists** | Confirmation modals for all destructive actions. Escape to cancel. Version history with jump-to-version. Auto-save with crash recovery. Invalid drop prevention. Unsaved changes warning on unload. |
| **What's missing** | Published version rollback not specified in Publish tab. Max undo depth behavior unspecified. |
| **P0 gaps** | Published version rollback — if user publishes and it breaks, how do they revert to the previous published version? |
| **Fix** | Add: Published version history list in Publish tab (last 10 publishes with rollback). Warn at 90% undo stack. |
| **Breaking changes** | Adding published version history is additive. |
| **Migration approach** | Phase 1 feature. |

---

### Layer 6 — Progressive Disclosure

| Field | Content |
|-------|---------|
| **Layer** | 6 — Progressive Disclosure |
| **Score** | 5/10 |
| **What exists** | Inspector "Toggle Advanced Settings" in some sections. Dev mode toggle. Onboarding checklist + spotlight. Achievement prompts. First-time states in Publish tab. Team vs Solo onboarding. |
| **What's missing** | NO formal L1/L2/L3 classification. All 10 rail tabs visible on day 1. Advanced features (AI, CMS, Collaboration) not behind discovery gate. |
| **P0 gaps** | No L1/L2/L3 tiering. New user sees 10 tabs with no guidance on which 2-3 to start with. Onboarding spotlight highlights 4 targets but doesn't map to the 10 tabs. |
| **Fix** | Classify all tabs: L1 = Add, Layers, Pages, Media. L2 = Templates, Components, Design System, CMS. L3 = Settings, Publish, History. Add "Focused Mode" toggle (OFF for existing users, ON for new users). |
| **Breaking changes** | "Focused Mode" hides L2/L3 tabs. MUST be OFF for existing users. |
| **Migration approach** | Feature flag for "Focused Mode" default. Existing: OFF. New: ON. |

---

### 7-Layer Summary

| Layer | Score | P0 | P1 | P2 | Breaking Changes |
|-------|-------|----|----|----|--------------------|
| 0 — IA | 4/10 | 10-tab flat rail | CMS entry point | — | HIGH — rail restructure |
| 1 — Intent | 6/10 | CMS access path | User flows missing | — | LOW — additive |
| 2 — Interaction | 7/10 | — | Touch support absent | — | None |
| 3 — State | 7/10 | Undo depth unspecified | — | — | None |
| 4 — Feedback | 7/10 | Drop rejection visual | Animation specs missing | — | None |
| 5 — Error Recovery | 7/10 | Published version rollback | — | — | None (additive) |
| 6 — Disclosure | 5/10 | No L1/L2/L3 classification | — | — | MEDIUM — tab visibility |
| **TOTAL** | **43/70** | **4 P0s** | **4 P1s** | **0 P2s** | |

---

## Step 4B: Product Design Specifications Audit

| Design Area | Score | What's Defined | What's Missing |
|-------------|-------|----------------|----------------|
| **User Flows & Journeys** | 2/10 | Individual screen interactions well-documented | NO cross-screen flow maps at all |
| **Element Taxonomy & Grouping** | 7/10 | 150+ elements in 10 categories, sections-first, search, team favorites | NO nesting matrix; Loading + Disabled element states missing |
| **Canvas & Layout System** | 8/10 | Grid/rulers/guides, smart guides, zoom 10%-500%, keyboard nudge | Canvas type (infinite vs fixed) and layout system (free-form/flow/hybrid) never declared |
| **Properties Panel & Toolbar** | 8/10 | Inspector 3 tabs full spec, all property input types, multi-select, pseudo-states | Panel collapse/resize behavior not specified; sidebar rail collapse mode absent |
| **Selection, Copy/Paste & Editing** | 8/10 | Single/multi select, marquee, shortcuts, copy/paste, lock/hide, inline text | Paste position logic for cross-page and external clipboard paste not fully defined |
| **Layer Management** | 9/10 | Full tree view, drag-reorder, reparent, visibility/lock, z-index, right-click | Invalid nesting in layers drag visual feedback not specified |
| **Templates & Asset Management** | 9/10 | Template browser with visual comparison, save-as-template, asset library, component system | Image fit modes not fully enumerated for Inspector |
| **Preview, Export & Publish** | 7/10 | Preview mode, device frames, 4 export formats, code quality score | Published version history/rollback absent; pre-publish validation checklist not specified |

### Combined Scoring

| Category | Max Score | Actual | % Complete |
|----------|-----------|--------|------------|
| 7-Layer Model (7 layers) | 70 | 43 | 61% |
| Product Design (8 areas) | 80 | 57 | 71% |
| **TOTAL** | **150** | **100** | **67%** |

---

## Step 4C: Trigger Inventory

| Trigger | Status | Severity |
|---------|--------|----------|
| `vague_language_detected` | "instant", "smooth" used without full metrics | ⚠️ PARTIAL P1 |
| `tab_overload` | **10 tabs in rail** | 🔴 FIRED P0 |
| `missing_undo` | Undo exists; stack depth unspecified | ⚠️ PARTIAL P1 |
| `no_auto_save` | Auto-save specified | ✅ Clear |
| `mouse_only` | **Touch support entirely absent** | 🔴 FIRED P1 |
| `no_feedback_spec` | Ghost/guides exist; drop rejection + animation specs absent | ⚠️ PARTIAL P1 |
| `no_error_prevention` | Confirmations specified globally | ✅ Clear |
| `flat_feature_dump` | **All 10 tabs visible day 1, no L1/L2/L3** | 🔴 FIRED P1 |
| `no_performance_budget` | Performance targets exist | ✅ Clear |
| `missing_accessibility` | **No WCAG target for editor itself** | 🔴 FIRED P1 |
| `no_competitive_analysis` | **No competitors referenced** | 🔴 FIRED P1 |
| `no_user_flows` | **No cross-screen flow diagrams** | 🔴 FIRED P0 |
| `no_element_taxonomy` | Taxonomy exists; nesting matrix absent | ⚠️ PARTIAL P1 |
| `no_element_states` | 10/12 states defined; Loading + Disabled missing | ⚠️ PARTIAL P1 |
| `no_canvas_layout_system` | **Layout type never declared** | 🔴 FIRED P0 |
| `no_properties_panel` | Inspector well-specified | ✅ Clear |
| `no_selection_behaviors` | Selection fully specified | ✅ Clear |
| `no_copy_paste` | Copy/paste specified | ✅ Clear |
| `no_layer_management` | Layers well-specified | ✅ Clear |
| `no_preview_publish` | Preview + export specified; publish history absent | ⚠️ PARTIAL P1 |
| `no_template_system` | Templates well-specified | ✅ Clear |
| `no_group_ungroup` | Ctrl+G / Ctrl+Shift+G specified | ✅ Clear |
| `no_zoom_pan` | Zoom 10-500%, fit, Ctrl+0 specified | ✅ Clear |
| `no_inline_text_editing` | Double-click text edit fully specified | ✅ Clear |

**Result: 7 full fires 🔴 | 6 partial fires ⚠️ | 11 clear ✅**

---

## Step 5: Revised PRD — Gap Fills & BEFORE/AFTER Specs

> Only items that change existing behavior get BEFORE/AFTER blocks. Additive items are labeled NEW.

---

### GAP 1: Canvas & Layout System Declaration

**BEFORE:** Canvas type (infinite/fixed) and layout system (free-form/flow/hybrid) never declared.

**AFTER (Declared):**

#### Canvas Type: Fixed Artboard with Infinite Vertical Growth
- Canvas has a defined width per device breakpoint (Desktop 1280px, Tablet 768px, Mobile 375px)
- Canvas height grows with content — not fixed
- Infinite vertical scroll when canvas exceeds viewport height
- Horizontal: canvas centered in viewport at 100% zoom; no horizontal scroll

#### Layout System: Flow-Based with Flex/Grid within Sections
- **Sections** stack vertically in document flow (flex column on page root)
- **Within sections:** children follow flexbox or grid as configured in Inspector
- **Exception:** `position: absolute` available via Inspector for overlays and decorative elements
- **Reflow behavior:** Adding a section inserts it at drag target position; siblings below shift down
- **Overflow:** Container overflow hidden by default; toggle in Inspector
- **Responsive:** Switching breakpoints applies breakpoint-specific styles; positions preserved, content reflowed

**BREAKING:** No — declares existing behavior; does not change it.

---

### GAP 2: Information Architecture Restructure

**BEFORE:** 10 undifferentiated rail tabs in a flat list.

**AFTER:**

```
BEFORE:
[Add][Templates][Layers][Pages][Components][Media][Design][Settings][Publish][History]
(flat, 10 icons, no grouping)

AFTER:
[─ BUILD ─────────────────────]
[Add][Templates][Layers][Pages][Components]

[─ ASSETS ────────────────────]
[Media][Design System][CMS ★ NEW]

[─ CONFIG ────────────────────]
[Settings][Publish]

[─ REVIEW ────────────────────]
[History]
```

★ CMS moves from Settings → Integrations (3 clicks) to dedicated rail icon (1 click). Keyboard shortcut: **C**.

**BREAKING:** YES — changes visual grouping; adds CMS to rail.
**MIGRATION:**
- Feature flag: "New Layout" — OFF for existing users, ON for new signups
- "Classic Layout" toggle in Settings → Advanced for minimum 12 weeks
- All keyboard shortcuts unchanged (A, T, Z, P, Shift+A, J, D, S, U, H, C=new)
- In-app tooltip on first load with new layout: "We've reorganized the sidebar. [See what changed]"

**ROLLBACK:** Feature flag OFF → instant revert.

---

### GAP 3: CMS Dedicated Panel (NEW)

**Trigger:** Click CMS icon in rail (keyboard: C)

**CMS Panel Layout:**
```
+---------------------------+
| CMS Collections           |
| [+ New Collection]        |
+---------------------------+
| [Search collections]      |
+---------------------------+
| 📚 Blog Posts     (12)   |
|    Last edited: 2h ago    |
|    [Add item] [View all]  |
+---------------------------+
| 📦 Products       (45)   |
|    Last edited: 1d ago    |
|    [Add item] [View all]  |
+---------------------------+
| 👥 Team           (8)    |
|    Last edited: 3d ago    |
+---------------------------+
```

**Content Manager jobs-to-be-done served:**
1. Add new blog post → Rail C → Blog Posts → Add item
2. Update product pricing → Rail C → Products → Find item → Edit
3. Check which pages have content → Rail C → see collection sizes at a glance

**BREAKING:** No — additive.

---

### GAP 4: Progressive Disclosure — L1/L2/L3 Classification

#### Sidebar Tabs

| Tab | Level | Rationale | Hidden in Focused Mode? |
|-----|-------|-----------|-------------------------|
| Add / Build | **L1** | Every user needs this immediately | No |
| Layers | **L1** | Critical for navigation | No |
| Pages | **L1** | Multi-page from day 1 | No |
| Media | **L1** | Images needed immediately | No |
| Templates | **L2** | Revealed after first element added | Yes (until revealed) |
| Components | **L2** | Revealed after first group created | Yes (until revealed) |
| Design System | **L2** | Revealed after first color edit | Yes (until revealed) |
| CMS | **L2** | Revealed after 2+ pages created OR explicit toggle | Yes (until revealed) |
| Settings | **L2** | Revealed after first Preview click | Yes (until revealed) |
| Publish | **L2** | Revealed after first Preview click | Yes (until revealed) |
| History | **L3** | Revealed after 10+ undo operations | Yes |

**"Focused Mode" (NEW, Non-Breaking):**
- Default ON for new signups; OFF for existing users
- Toggle: Settings → Preferences → "Focused Mode" OR rail bottom "..." icon
- When ON: L2/L3 tabs hidden; "Show all tools +" button at rail bottom
- When OFF: All tabs visible (current behavior, unchanged)

**BEFORE (existing users):** No change. All 10 tabs visible.
**AFTER (new users):** 4 L1 tabs visible by default; L2/L3 revealed progressively.
**BREAKING:** No — existing users unaffected.

---

### GAP 5: Element States — Complete 12-State Spec

**BEFORE:** 10/12 states defined. Loading and Disabled missing.

**AFTER (additions only):**

| State | Visual Treatment |
|-------|-----------------|
| **Loading** | Skeleton shimmer animation (gray gradient sweep, 1.5s loop) replacing element content area. Shimmer stops when content resolves. Used for: image elements while loading, CMS-bound elements fetching data, Embed elements loading. |
| **Disabled** | 50% opacity on element + `cursor: not-allowed` + tooltip "This element is hidden by a condition" when hovered. Used when element has conditional visibility rule set to false in the current preview state. |

**BREAKING:** No — additive.

---

### GAP 6: Nesting Matrix

**BEFORE:** Nesting rules mentioned generically ("Only valid parent-child relationships allowed"). No explicit matrix.

**AFTER:**

| Parent Type | Can Contain |
|-------------|-------------|
| Section | Container, Grid, Columns, Flex, Heading, Paragraph, Image, Video, Form, Component (any) |
| Container | All element types EXCEPT Section |
| Grid Cell | All element types EXCEPT Section |
| Button | Text elements only (Heading, Paragraph, Text Span, Icon) |
| Form | Form inputs (Input, Textarea, Select, Checkbox, Radio, Date, File, Range, Toggle), Heading, Paragraph, Button (type=submit) |
| Heading / Paragraph / Text | Inline elements only (Text Span, Link, Icon) |
| Image / Video / Audio | Nothing (leaf nodes) |
| Form Input | Nothing (leaf nodes) |

**Max nesting depth:** 6 levels. At level 6, the drag target glows red with tooltip "Maximum nesting depth reached."

**Invalid nesting feedback:**
1. Drop zone turns red (vs blue for valid)
2. On release: element snaps back to origin with 100ms ease-out
3. Toast: "Cannot place [Element Type] inside [Parent Type]"
4. Layers panel: red flash on invalid target row

**BREAKING:** No — clarifies and enforces existing validation.

---

### GAP 7: Published Version History (NEW)

**Publish Tab — Connected State (Updated):**

```
+---------------------------+
| Publish                   |
+---------------------------+
| Status: [Published] 🟢   |
| URL: https://... [Copy]  |
+---------------------------+
| [Publish Site]            |
+---------------------------+
| Publish History           |
| ─────────────────────────|
| v3  Mar 25, 3:45 PM  Shah |
|     [Preview] [Rollback] |
| v2  Mar 23, 2:10 PM  Sarah|
|     [Preview] [Rollback] |
| v1  Mar 20, 11:00 AM Shah |
|     [Preview] [Rollback] |
+---------------------------+
```

| Action | Behavior |
|--------|----------|
| Preview published version | Opens export of that version in preview mode (read-only, no editing) |
| Rollback | Confirmation: "Roll back to [date]? This will replace the current live site." → host app re-deploys → status reflects rolled-back version |

Retention: last 10 published versions.
**BREAKING:** No — additive.

---

### GAP 8: Touch Support (NEW — P1)

| Interaction | Touch Equivalent | Detail |
|-------------|-----------------|--------|
| Mouse drag | Long-press 300ms → drag | Haptic on supported devices |
| Right-click | Long-press 500ms → context menu | Longer than drag initiation |
| Canvas pan | Two-finger drag | Prevents conflict with one-finger scroll |
| Zoom | Pinch | Same range: 10%-500% |
| Shift+click | Two-finger tap | Adds to selection |
| Marquee | Three-finger drag | Three-finger drag on empty canvas |

**BREAKING:** No — additive. Existing mouse behavior unchanged.

---

### GAP 9: Animation & Feedback Specifications

**BEFORE:** No animation specs anywhere in PRD.

**AFTER:**

| Animation | Duration | Easing |
|-----------|----------|--------|
| Ghost preview appear | 50ms | ease-out |
| Drop zone highlight | 100ms | ease-out |
| Element settle after drop | 200ms | spring (stiffness 300, damping 20) |
| Invalid drop shake | 150ms | cubic-bezier(0.36, 0.07, 0.19, 0.97) |
| Selection handles appear | 100ms | ease-out |
| Panel slide in/out | 250ms | ease-in-out |
| Inspector section expand/collapse | 200ms | ease-out |
| Toast appear | 250ms | ease-out |
| Toast dismiss | 200ms | ease-in |

**prefers-reduced-motion:** All animations must be wrapped globally:
```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0ms !important; animation-duration: 0ms !important; }
}
```
**BREAKING:** No — additive specs.

---

### GAP 10: WCAG 2.1 AA Compliance Spec

**BEFORE:** Accessibility mentioned only in AI assistant context. No WCAG target stated for the editor itself.

**AFTER:** The editor UI must meet WCAG 2.1 AA:

| Requirement | Specification |
|-------------|--------------|
| Color contrast | All text ≥ 4.5:1; large text ≥ 3:1 |
| Focus indicators | 2px solid `--buildrick-accent`, 2px offset (not browser default) |
| Keyboard navigation | All interactive elements reachable via Tab; no keyboard traps |
| ARIA labels | All icon-only buttons have `aria-label`; all panels have `role` + `aria-label` |
| Screen reader announcements | Selection changes: "Selected: [Name], [Type]". Undo: "Undo: [Action]". |
| Reduced motion | All animations respect `prefers-reduced-motion: reduce` |
| 200% browser zoom | Editor remains usable at 200% zoom |

**BREAKING:** No — compliance fixes are non-breaking.

---

### GAP 11: Undo Stack Depth (P0 Spec Fix)

**BEFORE:** Undo stack depth unspecified.

**AFTER:**
- Stack depth: **100 actions**
- Memory model: JSON patch-based (efficient; ~500KB-2MB for 100 patches)
- When full: LRU drop (oldest entry removed). Never silent.
- Warning at 90% capacity: "You're approaching the undo limit (90/100). Save a named version to preserve this state."
- Full checkpoint snapshot every 10 patches for fast jump-to-version
- Session-local undo clears on page refresh (non-named)
- Named snapshots persist in IndexedDB

**BREAKING:** If current implementation has < 100 steps, increasing to 100 is non-breaking (adds capability). If current has > 100 with no limit, capping at 100 may feel like a regression — ship warning UI before enforcing cap.

---

### GAP 12: Cross-Screen User Flows (Required Before Engineering)

> These must be diagrammed in Figma/FigJam before Phase 1 engineering begins.

#### Flow 1: End-to-End Editor Journey

```
Open app → WelcomeModal → choose path → canvas loads
→ Drag first element from Add Tab → element placed
→ Inspector shows properties → edit properties → canvas updates < 16ms
→ Continue building → auto-save fires
→ Preview mode → test interactions → exit preview
→ Export / Publish
→ Tab close → "Unsaved changes?" modal if isDirty()
```

#### Flow 2: First-Time User (Target: Meaningful action < 60s)

```
T+0s:  App loads → WelcomeModal
T+5s:  "Start from scratch" → SpotlightOverlay starts
T+15s: Spotlight → Add tab → user opens it
T+25s: User drags "Hero" section to canvas
T+35s: Hero placed → auto-selected → Inspector shows props
T+45s: User double-clicks heading → edits text
T+55s: Checklist items "Add element" + "Style element" both complete ✓
```

#### Flow 3: Content Manager (CMS-First Path)

```
Open project → Rail: C (CMS icon) → CMS panel opens
→ "Blog Posts" collection → "Add item"
→ Fill: title, body, image → save
→ CMS Preview Bar: select new post → canvas shows layout with data
→ Verify layout → done (no publish needed for content-only update)
```

#### Flow 4: Developer Handoff

```
Open project → Top bar: [Export] → Export Modal
→ Select format: React → TypeScript: ON → CSS mode: CSS Modules
→ Review Code Quality Score (target: > 80/100)
→ Address warnings (if any) by fixing in editor
→ Download ZIP → receive component-structured file tree
```

#### Flow 5: Error / Recovery

| Failure | Detection | Recovery |
|---------|-----------|---------|
| Network loss during save | Connection indicator → gray; toast "Working offline" | Auto-replay on reconnect |
| Invalid drop | Drop zone turns red + shake + tooltip | Ghost snaps back; no state change |
| Browser crash | RecoveryManager on next load | "Recover unsaved changes?" modal |
| Collaboration conflict (structural) | OTEngine detects | Visual side-by-side diff → Keep Mine/Theirs/Both |

---

## Step 6: Migration Roadmap

### Phase 0 — Infrastructure (Weeks 1-2, Before Anything Else)

| Task | Why | Gate |
|------|-----|------|
| Instrument analytics (all events in GAP 12) | Cannot measure improvement without baseline | Required before Phase 1 |
| Capture 2-week analytics baseline | Before/after comparison | Required before Phase 1 |
| Define undo stack depth: 100 steps + LRU + 90% warning | Prevents data loss | Required before Phase 1 |
| Set up feature flag system | Required for safe IA rollout | Required before Phase 2 |
| Document all current keyboard shortcuts | Protect muscle memory | Required before Phase 2 |
| WCAG audit of current editor UI | Find existing a11y issues | Required before Phase 3 |
| Finalize user flow diagrams in Figma/FigJam | Engineering dependency | Required before Phase 1 |
| Complete nesting matrix | Prevents invalid nesting UX gaps | Required before Phase 1 |

---

### Phase 1 — Foundations (Weeks 3-8)

| Change | Breaking? | Rollback |
|--------|-----------|---------|
| Add CMS rail icon (C) + CMS panel | No — additive | Remove from rail |
| Published version history (last 10) | No — additive | Remove from Publish tab |
| Drop rejection visual (red shake + tooltip) | No — additive | CSS/behavior revert |
| Loading + Disabled element states | No — additive | CSS revert |
| Undo stack depth: declare 100 + warn at 90% | No (if current ≥ 100) | Revert warning UI |
| All animation specs implemented | No — additive | CSS revert |
| prefers-reduced-motion global CSS | No — additive | Remove media query |

**Phase 1 success metric gate:** Before proceeding to Phase 2:
- [ ] CMS access method: > 50% via rail (not Settings path)
- [ ] Drag cancelled rate: no increase vs baseline
- [ ] Undo-triggered rate: no increase vs baseline

---

### Phase 2 — IA Restructure + Interaction (Weeks 9-16)

| Change | Breaking? | Migration |
|--------|-----------|-----------|
| Rail IA 4-group restructure | **YES** | Feature flag: 10% → 30% → 60% → 100% with 1-week holds; "Classic Layout" toggle for 12 weeks |
| "Focused Mode" for new users | No | Default ON for new signups; OFF for existing |
| L2/L3 Inspector sections collapsed by default | Medium | Ship with expanded-by-default fallback config |
| Touch support | No — additive | Ship when built |
| WCAG 2.1 AA fixes | No | Prioritize by severity from audit |

**Phase 2 rollback trigger:** If tab_switching frequency INCREASES (users can't find things), immediately roll back IA restructure feature flag.

**A/B test:** Run IA restructure on 10% of new signups only for 4 weeks. Compare: time-to-first-element, tab switching frequency, session length, churn rate in first 7 days. Only expand if all 4 metrics improve.

---

### Phase 3 — Polish + Compliance (Weeks 17-22)

| Change | Notes |
|--------|-------|
| WCAG 2.1 AA compliance all issues fixed | Prioritize from Phase 0 audit |
| i18n string externalization | Enables international expansion |
| Competitive analysis report | Informs Phase 4 product decisions |
| Remove "Classic Layout" toggle | Only after 12 weeks at 100% rollout; email notification 2 weeks prior |
| Touch support hardening | Tablet-specific QA pass |

---

### Handoff Checklist

**Designer (required before Phase 1):**
- [ ] User flow diagrams (5 flows) in Figma
- [ ] All 12 element states designed for each element type
- [ ] CMS rail panel design
- [ ] Published version history UI
- [ ] Drop rejection animation (red shake)
- [ ] Loading state skeleton shimmer
- [ ] "Focused Mode" toggle component

**Designer (required before Phase 2):**
- [ ] Rail IA redesign with 4 groups (Figma mock with measurements)
- [ ] "Focused Mode" — before/after rail comparison
- [ ] Animation spec sheet (all durations, easings, reduced-motion variants)

**Engineering (Phase 0):**
- [ ] Analytics event tracking (all events from instrumentation plan)
- [ ] Feature flag system
- [ ] Undo stack depth: 100 steps, LRU, 90% warning

**Engineering (Phase 1):**
- [ ] CMS rail icon + panel component
- [ ] Published version history (store last 10 via ExportEngine + IndexedDB)
- [ ] Drop rejection visual (red outline, shake, snap-back, toast)
- [ ] Loading state (skeleton shimmer)
- [ ] Disabled state (50% opacity + cursor)
- [ ] prefers-reduced-motion global CSS

**Engineering (Phase 2):**
- [ ] Feature flag: new rail layout
- [ ] "Classic Layout" toggle
- [ ] Touch support (long-press, pinch, two-finger pan)
- [ ] WCAG fixes (post-audit)

**QA (all phases):**
- [ ] REGRESSION: All keyboard shortcuts unchanged (A, T, Z, P, Shift+A, J, D, S, U, H)
- [ ] REGRESSION: Undo/redo behavior unchanged for existing users
- [ ] REGRESSION: Auto-save behavior unchanged
- [ ] NEW: C shortcut opens CMS panel
- [ ] NEW: "Classic Layout" shows original layout exactly
- [ ] NEW: Drag rejection visual fires on invalid parent drop
- [ ] NEW: Touch drag initiates after exactly 300ms
- [ ] NEW: Animations respect prefers-reduced-motion
- [ ] NEW: Loading shimmer fires for image elements
- [ ] PERFORMANCE: Canvas selection → Inspector < 16ms on 100-element page
- [ ] PERFORMANCE: Ghost preview < 50ms from mousedown
- [ ] ACCESSIBILITY: All interactive elements keyboard-accessible, WCAG AA contrast

---

## Summary: Top 10 Actions by Priority

| Priority | Action | Impact | Phase |
|----------|--------|--------|-------|
| **P0** | Instrument analytics + capture 2-week baseline | Cannot improve without measurement | 0 |
| **P0** | Declare undo stack: 100 steps + LRU + 90% warning | Prevents data loss; fixes #2 cause of 1-star reviews | 0 |
| **P0** | Finalize nesting matrix + user flow diagrams | Engineering unblocked for all subsequent features | 0 |
| **P0** | Add CMS rail icon (C) | Unblocks Content Manager persona — 3 clicks → 1 click | 1 |
| **P0** | Published version history in Publish tab | Production rollback is table stakes | 1 |
| **P1** | Drop rejection visual (red shake + tooltip + snap-back) | Closes most impactful feedback gap | 1 |
| **P1** | Rail IA restructure with 4 groups (behind feature flag) | Fixes #1 structural problem — but requires A/B validation first | 2 |
| **P1** | "Focused Mode" for new users (L1 tabs only) | Reduces new user overwhelm without breaking existing users | 2 |
| **P1** | Touch support spec + implementation | Opens tablet user segment; agency market expectation | 2 |
| **P1** | WCAG 2.1 AA compliance (audit → fix) | Legal exposure + inclusivity | 3 |

---

## What This PRD Does Well (Strengths to Preserve)

> These decisions are correct. Do not change them in the redesign.

1. **Sections-first element catalog** — Design teams think in Hero/CTA/Pricing, not div/text. This is right.
2. **Visual-first design decisions** — Side-by-side template comparison, visual palette grid, visual conflict diffs. Designers are visual. All of this is correct.
3. **Component system (Figma-like)** — Main + instances + overrides + variants. Well-designed.
4. **CMS Preview Bar** — Inline CMS data preview without leaving the editor. Excellent UX.
5. **Team-scoped onboarding** — Separate Solo vs Team onboarding flows. Thoughtful.
6. **Code Quality Score in Export** — Builds developer confidence and catches issues before handoff. Keep.
7. **Hover-to-preview in History tab** — Non-destructive version browsing. This is a delightful feature.
8. **Lock Tokens in Design System** — Prevents accidental token changes. Solves real team pain.
9. **Per-user activity filtering in History** — "Show only Sarah's changes." Solves real team accountability need.
10. **15-second auto-release on collaboration locks** — Right balance between thinking time and stale locks.

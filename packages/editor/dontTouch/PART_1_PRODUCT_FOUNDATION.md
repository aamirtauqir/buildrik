# PART 1 — PRODUCT FOUNDATION

**Extracted from:** `prd_final.md` (Outputs A, B, D)
**Date:** 2026-03-12
**Rule:** This document extracts — it does not invent. Every statement traces to a specific PRD section.

---

## 1. Product Identity

**Product name:** Buildrik / Aquibra Studio

**Product type:** Professional visual web builder — an embedded React 18 application (`<AquibraStudio />` component) that renders a full-featured design environment for creating, styling, and publishing multi-page websites without writing code.

**Engine:** `src/engine/Composer.ts` — central orchestrator exposing 29 managers:
ElementManager, StyleEngine, CommandCenter, SelectionManager, HistoryManager, VersionHistoryManager, StorageAdapter, Viewport, PluginManager, DataManager, GlobalStyleManager, StyleDataBinding, TraitDataBinding, TextDataBinding, TemplateManager, CanvasIndicators, ResizeHandler, FontManager, ComponentManager, CollectionManager, CMSBindingManager, CollaborationManager, MediaManager, FormHandler, SyncManager, PageRouter, RecoveryManager, InteractionManager, DragManager.

**AI subsystem (4 modules):** LayoutAnalyzer, CodeGenerator, ContentWriter, PageGenerator.

**Export subsystem:** ExportEngine.exportAllPages(), AnalyticsInjector, AssetBundler, FormspreeInjector, SEOInjector.

**Hosting:** Published to `buildrik.app/{projectId}`.

**What users do (from Output D §D.1):**
1. Drag and drop HTML elements onto a canvas
2. Style elements using an inspector panel
3. Organize pages, media, components, and design tokens in a left sidebar
4. Use CMS data bindings to create dynamic content
5. Collaborate in real-time with team members
6. Publish directly to Buildrik hosting or export HTML/CSS/React code

**Comparable depth:** "the depth of Webflow, the speed of Framer, and the structure of Figma" (Output D §D.1)

> *Source: Output B §1.1, Output D §D.1*

---

## 2. Redesign Goal & What It Is / Is Not

### 2.1 Redesign Goal Statement

Upgrade the editor's UI/UX to premium SaaS quality — the clarity of Linear, the restraint of Apple, the trust of Stripe — while PRESERVING 100% of its existing power-user capability.

### 2.2 What This Redesign Is NOT

| Anti-pattern | Explanation |
|-------------|-------------|
| Feature reduction | No feature is removed, hidden, or plan-gated that was previously free |
| Simplification trading depth for polish | Polish is additive — it does not replace functionality |
| New product concept | This is the same product with better UI, not a new vision |
| Competitor clone | Inspiration from Linear/Apple/Stripe but Buildrik's own identity |
| Engine refactor | The redesign touches ONLY UI-layer code (`src/editor/`, `src/shared/`) — never `src/engine/` |

### 2.3 What This Redesign IS

| Change | Specifics |
|--------|-----------|
| Visual hierarchy improvements | Consistent surface tokens, typography scale, spacing grid applied across all 10 sidebar panels, inspector, modals, and canvas overlays |
| Information architecture upgrade | Rail currently has 8 icon slots (5 TOP + 3 BOTTOM); redesign adds Components to rail TOP zone position 6 and Publish to rail BOTTOM zone position 4 to reach 10 rail icons. Top bar reduced from ~15 to 7 always-visible controls |
| Consistent interaction patterns | All 10 panels use same header pattern (48px, title + pin + close), same drill-in pattern (DrillInHeader + back arrow), same accordion pattern for sections |
| Design system uniformity | All surfaces use `--aqb-*` CSS custom properties from `src/themes/default.css`, Emotion CSS-in-JS only, Lucide React icons only |
| Friction removal WITHOUT capability removal | Inspector third tab internal ID is `effects` but UI label is still "Behavior" — rename to "Effects" pending. Publish checklist wired to real data, onboarding spotlight has escape link |

### 2.4 Specific Organizational Improvements

| Current Problem | Redesign Solution |
|----------------|-------------------|
| Components tab (⇧A) not in rail — zero discoverability for mouse users | Add Components icon to rail TOP zone position 6 |
| Publish tab (U) not in rail — critical action requires knowing shortcut | Add Publish icon to rail BOTTOM zone position 3 |
| Top bar has ~15 interactive controls — cognitive overload | Reduce to 7 always-visible + overflow menu (···) |
| Inspector tab label "Behavior" doesn't match content (shadows, transforms, animation) | Rename to "Effects" (internal ID is already `effects` in ProInspector.tsx; UI label still shows "Behavior" — rename pending) |
| Publish pre-publish checklist shows all items as incomplete (hardcoded `false`) | Wire to `composer.getSeoData()` or show navigation hints |
| Onboarding spotlight blocks canvas exploration | Add "Explore freely →" escape link |
| Design System draft chip is visually subtle | Make DraftChip prominent (pulsing amber dot + count) |
| Settings "Coming Soon" gives no path forward | Replace with "Notify me" email capture or ETA |
| DevModeToggle buried in inspector controls row | Move to inspector header, always visible |

> *Source: Output B §1.2, §1.3, §1.4, §4.1*

---

## 3. Target Users & Segments

### 3.1 Primary — Freelance Web Designers (20–40% of users)

**Profile:** Professional designers building client sites. 2–10 active projects at any time.

**Workflow characteristics:**
- Build multi-page client sites in the editor
- Use design system tokens to maintain brand consistency across pages
- Use CMS bindings to create data-driven pages (blog posts, product listings)
- Export HTML/CSS for self-hosting or use Buildrik hosting
- Use keyboard shortcuts (Ctrl+K command palette, all 10 tab shortcuts)
- Deliver published sites to clients via `buildrik.app/{projectId}` URL

**Feature usage (high):**
- Design System tab (color/type/spacing tokens, CSS/JSON/SCSS export)
- Pages tab (multi-page management, SEO/Social/Advanced per page)
- Inspector (14 sections across 3 tabs, pseudo-state editing, breakpoint overrides)
- Version History (named saves before client presentations)
- Export (HTML + CSS download, future React/Vue/Next.js)
- Components (create reusable headers/footers/sections)

**Pain points this redesign addresses:**
- Components tab not discoverable (keyboard-only via ⇧A) → now in rail
- Publish tab requires knowing U shortcut → now in rail
- Top bar cognitive overload (~15 controls) → reduced to 7 + overflow

### 3.2 Secondary — SaaS Product Teams (30% of users)

**Profile:** Engineering teams embedding `<AquibraStudio />` in their SaaS product. Users of their SaaS interact with Buildrik as a white-labeled editor.

**Workflow characteristics:**
- Embed the editor component with custom `onPublish`/`onUnpublish` callbacks
- Use collaboration features (OT, presence, cursor sync) for team editing
- Use CMS bindings to connect to their product's data
- Use plugin system (PluginManager) for custom extensions
- Need version history for rollback capability
- Need plan-gating (LockedScreen, UpgradeModal) for tiered pricing

**Feature usage (high):**
- Collaboration (presence avatars, live cursors, OT conflict resolution)
- CMS (CollectionManager, 3 data binding managers — Style/Trait/Text, Collection Setup modal)
- Version History (named versions, restore, compare for disaster recovery)
- Plugin system (PluginManager — engine-level, no UI surface in Phase 1)
- Plan-gating (LockedScreen for Pro features, UpgradeModal)

### 3.3 Tertiary — Individual Creators (30% of users)

**Profile:** Non-designers building personal sites, landing pages, portfolios. First-time or occasional users.

**Workflow characteristics:**
- Start from templates, minimal design from scratch
- Use AI assistance (AIAssistantBar Ctrl+J, Copilot for full page generation)
- Need fast publish workflow (template → customize → publish in < 10 min)
- Less likely to use CMS, components, or design tokens on day 1
- May upgrade to power-user over time

**Feature usage (high on day 1):**
- Templates tab (browse, preview, apply)
- AI (AIAssistantBar for text rewriting, Copilot for page generation)
- Onboarding (WelcomeModal, 5-step checklist, SpotlightOverlay, AchievementPrompt)
- Publish tab (one-click publish)
- Build tab (drag elements to canvas)

### 3.4 Power Users (Cross-segment)

**Characteristics common to power users in ALL segments:**
- Command palette (Ctrl+K) as primary navigation — never use rail for tab switching
- All 10 tab shortcuts memorized (A/T/Z/P/⇧A/J/D/S/U/H)
- All editing shortcuts memorized (Ctrl+Z/Y/D/C/X/V, Delete, arrows, Shift+arrows)
- All z-ordering shortcuts (Ctrl+]/[, Ctrl+Shift+]/[)
- Expect every keyboard shortcut documented in `defaultCommands.ts` to work identically
- Use DevMode toggle for CSS inspection
- Use pseudo-state editing for interactive components
- Use breakpoint overrides for responsive design across 3 breakpoints (desktop/tablet/mobile) + watch device preview

> *Source: Output B §2.1–§2.4, Output D §D.2*

---

## 4. Jobs to Be Done (per segment)

### Freelance Web Designers
- Build a multi-page client website from scratch or template
- Apply design tokens (colors, typography, spacing) for brand consistency
- Create reusable components (headers, footers, sections)
- Configure per-page SEO (title, meta description, canonical URL, og: tags)
- Bind CMS collection data to elements for dynamic content
- Export finished site as HTML/CSS or publish to Buildrik hosting
- Save named versions before client review milestones

### SaaS Product Teams
- Embed `<AquibraStudio />` in their SaaS product for end-user editing
- Enable real-time collaboration (OT, presence, cursors) for team workflows
- Connect CMS bindings to their product's data layer
- Extend editor with custom plugins via PluginManager
- Gate features by plan tier (LockedScreen, UpgradeModal)
- Provide version history for user-facing rollback

### Individual Creators
- Start from a template and customize it quickly
- Use AI to generate or rewrite page content
- Publish a site in under 10 minutes
- Complete onboarding to understand core features
- Drag elements from Build tab to canvas for quick assembly

### Power Users (all segments)
- Navigate entire editor via keyboard (30+ shortcuts)
- Use command palette (Ctrl+K) for instant access to any action
- Edit pseudo-states (hover/focus/active/disabled) per element
- Override styles per breakpoint (desktop/tablet/mobile) + preview in watch device mode
- Inspect raw CSS via DevMode toggle
- Use marquee select, "Select from stack", and multi-select inspector

> *Source: Derived from Output B §2.1–§2.4 workflow characteristics and feature usage*

---

## 5. Core UX Principles

| # | Principle | Implementation Rule | Verification |
|---|-----------|-------------------|--------------|
| P1 | **Progressive disclosure, not feature hiding** | Advanced features reachable in ≤ 2 clicks or via keyboard shortcut. No feature hidden behind Settings or buried in sub-menus without a keyboard path. | Audit every feature against click-depth. CMS: Build tab → CMS List element (1 click) + inspector chain icon (1 click) = 2. AI: top bar AI button (1 click). Command palette: Ctrl+K (0 clicks). |
| P2 | **Zero capability regression** | Every feature that exists in the current editor is accessible in the redesign with same or fewer clicks/keystrokes. Feature removal is a REJECT condition. | Run Anti-Downgrade Checklist (Output E) — all 56 items must pass. |
| P3 | **Keyboard-first, mouse-friendly** | Every action has a keyboard path. Mouse interactions are a UI convenience, not the only path. Tab order follows: Rail → Sidebar header → Sidebar content → Canvas → Inspector. | Test: can a user complete new-user-first-publish flow entirely via keyboard? |
| P4 | **Context over configuration** | UI adapts to what user is doing: element selected → inspector shows properties; CMS element → binding section visible; component instance → Variants section visible; display:flex → Flexbox section visible; 2+ elements → MultiSelectToolbar. | Each context-sensitive section has a CSS-context guard (`deriveCssContext()` in inspector). |
| P5 | **Feedback at every action** | Save status (top bar), publish status (Publish tab badge), collaboration status (sync dot + presence avatars), error states (toast + inline), loading states (spinner + label) — all visible without hunting. | Audit all user-initiated actions: each must produce visible feedback within 100ms. |
| P6 | **Trust through transparency** | Published URL always visible in Publish tab; save status always visible in top bar; version history always accessible via H key; auto-save timestamp in top bar when dirty; trust badge in Publish tab. | Check: is there any state where the user doesn't know if their work is saved? |

> *Source: Output B §3*

---

## 6. Core Redesign Principle

> **Surface the depth, don't hide it.**

The current editor has extraordinary power:
- 29 engine managers covering CMS, collaboration, AI, export, version history, components, media, design tokens
- 30+ keyboard shortcuts registered in `defaultCommands.ts`
- 14 inspector sections across 3 tabs (Layout=7, Style=3, Behavior=4) with pseudo-state editing and breakpoint overrides
- 10 sidebar tabs each with complex sub-features
- 13+ modal types
- 14 canvas overlay components (SelectionBoxOverlay, SelectionHandles, SelectionLabel, ElementHoverOverlay, DropFeedbackOverlay, SmartGuidesOverlay, GuidesOverlay, GridOverlay, SpacingLabels, MultiSelectBadge, ParentHighlight, RemoteCursorsOverlay, RulersOverlay, CanvasBreadcrumb)
- 3 responsive breakpoints (desktop/tablet/mobile) + 4 device preview modes (adds watch)
- 3 data binding managers (StyleDataBinding, TraitDataBinding, TextDataBinding) + CMSBindingManager
- 4 AI modules

The UI problem is NOT that there is too much. The UI problem is that the UI does not help users discover and navigate the depth.

**The redesign makes the editor FEEL simpler by being better organized, not by removing capability.**

> *Source: Output B §4*

---

## 7. Anti-Downgrade Mindset

**Rule (stated at the top of the PRD and repeated throughout):**

> Current capability is the FLOOR, not the ceiling. Any redesign that makes the editor cleaner but weaker is rejected. If a section describes fewer features than the audit discovered, the section is wrong.

**What this means in practice:**
- No feature is removed, hidden, or plan-gated that was previously free
- Polish is additive — it does not replace functionality
- The redesign touches ONLY UI-layer code (`src/editor/`, `src/shared/`) — never `src/engine/`
- Every capability from the 29-manager engine must have a corresponding UI surface
- The 56-item Anti-Downgrade Validation Checklist (Output E) is the formal verification instrument

**Anti-regression risks explicitly called out (Output A §A.6):**

| # | Risk | Risk Level |
|---|------|-----------|
| R1 | CMS bindings hidden or removed because UI is "complex" | CRITICAL |
| R2 | AI features collapsed to single button, modules not discoverable | HIGH |
| R3 | Inspector sections removed for "visual simplicity" | CRITICAL |
| R4 | Pseudo-state editing removed or buried | CRITICAL |
| R5 | 3 responsive breakpoints + watch preview reduced to 2 (mobile/desktop) | HIGH |
| R6 | Keyboard shortcuts reduced or changed | HIGH |
| R7 | Version history simplified to just "undo" | HIGH |
| R8 | Export formats removed or delayed indefinitely | MEDIUM |
| R9 | Collaboration features hidden in settings | MEDIUM |
| R10 | Component system merged into Build tab without dedicated panel | MEDIUM |
| R11 | Marquee selection removed (invisible feature to designer) | HIGH |
| R12 | "Select from stack" context menu removed | MEDIUM |
| R13 | Canvas overlays reduced to 2-3 (dropping rulers, badges, xray) | MEDIUM |
| R14 | Design system token export removed | MEDIUM |
| R15 | Settings sub-screens collapsed or merged | MEDIUM |

> *Source: Output B preamble (line 161), §1.3, Output A §A.6*

---

## 8. Product Direction & Philosophy

### 8.1 Architecture Boundary

The redesign is **UI-only**. Engine code (`src/engine/`) is not touched. All 29 Composer managers remain fully operational. The redesign surfaces engine capabilities through better-organized UI, not by changing the engine.

### 8.2 Design System Direction

- All surfaces use `--aqb-*` CSS custom properties from `src/themes/default.css`
- Styling: Emotion CSS-in-JS only (no Tailwind, no CSS modules)
- Icons: Lucide React only
- Dark theme by default (surfaces S1-S5 from `#0f0f14` to `#2e2e38`)
- Typography: Inter (UI text) + JetBrains Mono (code/shortcuts)
- All new UI code goes in `src/editor/` (not `src/components/` which is legacy)

### 8.3 Information Architecture Direction

- 10-tab sidebar system (GROUPED_TABS_CONFIG) organized into TOP zone (6 tabs: Add, Templates, Layers, Pages, Components, Assets) and BOTTOM zone (4 tabs: Design, Settings, Publish, History). Rail currently renders 8 icon slots (5 TOP: Add, Media, Layers, Templates, Pages + 3 BOTTOM: Design, Settings, History); Components and Publish accessible via keyboard shortcuts only (⇧A and U)
- 3-tab inspector (Layout, Style, Behavior) with 14 sections total (Layout=7, Style=3, Behavior=4). Internal tab ID for Behavior is `effects` — rename to "Effects" is a redesign goal
- Top bar reduced from ~15 to 7 always-visible controls + overflow menu
- All features accessible via both mouse (rail + panels) and keyboard (30+ shortcuts + Ctrl+K command palette)

### 8.4 Technical Stack (unchanged)

- React 18.3 + TypeScript 5.3 (strict mode)
- Vite 7.2 (dev server + bundler)
- Emotion (@emotion/react, @emotion/styled) — CSS-in-JS
- Lucide React — icons
- GSAP — animations
- Zod — schema validation
- Sentry — error tracking
- Vitest — testing

> *Source: Output B §1.1, §1.4, §4, §6; CLAUDE.md*

---

## 9. Success Criteria for the Redesign

| Criterion | Measurement |
|-----------|-------------|
| Zero capability regression | All 56 items in Anti-Downgrade Checklist (Output E) pass |
| All 30+ keyboard shortcuts functional | Tested against `defaultCommands.ts` command list |
| All 10 sidebar tabs accessible via rail | Current rail has 8 icons; redesign adds Components + Publish to reach 10 (6 TOP + 4 BOTTOM) |
| All 14 inspector sections present | Count per tab: Layout=7, Style=3, Behavior=4 (rename to Effects pending) |
| All 13 modal types accessible | Each modal can be triggered via its documented entry point |
| WCAG 2.1 AA compliance | All text meets 4.5:1 contrast; all controls keyboard accessible |

**Grading scale (from Output E §E.8):**

| Grade | Criteria |
|-------|---------|
| **PASS** | All N-series (navigation), I-series (inspector), and C-series (canvas) items Preserved |
| **CONDITIONAL PASS** | ≤ 3 items "At Risk" — must be corrected before implementation |
| **FAIL** | Any item "Missing" in N/I series, or ≥ 4 items "At Risk" overall |

**A Stitch design output that gets a FAIL grade must be revised before any engineering work begins.**

> *Source: Output B §1.5, Output E §E.8*

---

## 10. Source Notes + Unclear / Needs Clarification

### 10.1 Cross-Output Consistency

All 5 outputs (A through E) in `prd_final.md` are internally consistent. Reconciliation was performed in Output B §B.1 and confirmed:
- All 77 coverage items in Output C remain accurate after B expansion
- No contradictions found between B and D
- All E checklist items covered by B sections
- Coverage grade upgraded from 97% to 99% (only Plugin UI remains as intentional non-goal)

### 10.2 Items Requiring Clarification

| Item | Source | What's unclear |
|------|--------|---------------|
| WCAG A5 — Non-text contrast | Output B §20.1 | Border `rgba(255,255,255,0.08)` on `#0f0f14` = 1.3:1 ratio — below 3:1 minimum. PRD notes "AT RISK" and suggests increasing to `rgba(255,255,255,0.12)` for critical interactive borders. Decision needed on whether to use 0.08 or 0.12. |
| Plugin system UI | Output B §29.3 NS-4, Output C | PluginManager exists at engine level but has no UI surface designed. Output C flags as "AT RISK if user expects UI." Intentionally deferred to future. |
| X-Ray mode visual | Output B §10.1 CS-11, Output C | Originally flagged as "AT RISK" in Output C but B §10.1 CS-11 now specifies exact wireframe visual. Reconciliation in B.1 marks this as RESOLVED. |
| Inspector Style tab section count | Output B §11.3 | PRD lists "7 sections" but AppearanceTab.tsx renders only 3 sections (Typography conditional, Background, Border). PRD overcounts — code is the source of truth. |
| Pseudo-state count vs button count | Output B §11.2, §11.4 | ROW 6 has 5 buttons (Normal + Hover + Focus + Active + Disabled) but §11.4 refers to "4 pseudo-states." Clarification in B.1.4: 4 pseudo-states + Normal (base) = 5 buttons. Not a contradiction. |

### 10.3 Source Traceability

| Part 1 Section | Primary PRD Source |
|---------------|-------------------|
| §1 Product Identity | Output B §1.1, Output D §D.1 |
| §2 Redesign Goal | Output B §1.2, §1.3, §1.4, §4.1 |
| §3 Target Users | Output B §2.1–§2.4, Output D §D.2 |
| §4 Jobs to Be Done | Derived from Output B §2.1–§2.4 |
| §5 Core UX Principles | Output B §3 |
| §6 Core Redesign Principle | Output B §4 |
| §7 Anti-Downgrade Mindset | Output B preamble, §1.3, Output A §A.6 |
| §8 Product Direction | Output B §1.1, §1.4, §4, §6, CLAUDE.md |
| §9 Success Criteria | Output B §1.5, Output E §E.8 |

---

*End of PART_1_PRODUCT_FOUNDATION.md*

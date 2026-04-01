# SaaS Rescue Audit — Buildrik / Aquibra Studio PRD

**Audit Date:** 2026-03-23  
**Input:** PRD (`prd_final.md`)  
**Product Type:** Visual Web Builder / Editor  
**Target Users:** Admin/Owner (full access)  
**Audit Mode:** Deep Audit (Mode 2) + Builder UX (Mode 5)

---

## 1. Product Understanding

### What This Product Is
Buildrik (Aquibra Studio) is a professional visual web builder — a React 18 application that enables users to create, style, and publish multi-page websites without writing code. The core engine is `Composer.ts` with 29 managers handling elements, styles, CMS, AI, collaboration, and more.

### Core User Jobs (Top 5)
1. **Design visually** — Drag-drop elements, style properties, responsive design
2. **Publish live** — Get site live on buildrik.app with one click
3. **Manage content** — Create CMS collections, bind data to elements
4. **Use AI assistance** — Generate pages, write content, get suggestions
5. **Collaborate** — Real-time cursors, presence, version history

---

## 2. Health Score

| Dimension | Weight | Score (1-5) |
|-----------|--------|-------------|
| Product Clarity | 15% | 4.5 |
| Information Architecture | 15% | 4.0 |
| User Flows | 15% | 4.0 |
| Interaction Design | 10% | 3.5 |
| Visual Hierarchy | 10% | 4.0 |
| Consistency | 8% | 3.5 |
| State Coverage | 8% | 3.0 |
| Content Design | 5% | 4.0 |
| Accessibility | 5% | 2.5 |
| Scalability | 5% | 4.0 |
| Handoff Readiness | 4% | 3.0 |
| **TOTAL** | **100%** | **3.7/5.0** |

**Status:** Average — Polish and consistency improvements needed

---

## 3. Assumptions

- Editor targets desktop-first (1024×768px minimum)
- Canvas has 4 responsive breakpoints: Desktop/Tablet/Mobile/Watch
- All features are accessible via keyboard shortcuts
- Collaboration is real-time via WebSocket
- CMS binding is a core feature, not optional

---

## 4. Product Intent

**Goal:** Upgrade editor UI/UX to premium SaaS quality while preserving 100% of power-user capabilities.

**Anti-downgrade rule is correctly stated:** "Current capability is the FLOOR, not the ceiling."

---

## 5. Overall Diagnosis

The PRD is exceptionally detailed (5000+ lines) but suffers from:
- **Over-specification without prioritization** — Every pixel specified but not prioritized
- **Missing states not systematically covered** — Error/loading states mentioned but not systematic
- **Implementation gaps for accessibility** — WCAG mentioned but depth insufficient
- **Duplicate/redundant specs** — Same features described multiple times
- **No benchmark comparison** — No competitive analysis against Webflow/Framer

---

## 6. What Is Working

| # | Feature | Why It Works |
|---|---------|--------------|
| 1 | **29-manager engine architecture** | Clean separation of concerns, single Composer gateway |
| 2 | **Keyboard-first shortcuts** | 30+ shortcuts with clear mappings, command palette planned |
| 3 | **10-rail navigation** | Clear panel access, consistent icon + shortcut pattern |
| 4 | **4 responsive breakpoints** | Desktop/Tablet/Mobile/Watch with override system |
| 5 | **Multi-select with marquee** | Power-user feature preserved (marquee, multi-select toolbar) |

---

## 7. Critical Issues

### C1: CMS Binding UI Not Designed — No Screen Spec
- **Severity:** Critical
- **Where:** Section A.1, Gap G1 — CMS layer has 3 binding types but no UI spec
- **What:** CollectionManager exists but user-facing UI for creating bindings doesn't exist
- **Why:** Users cannot discover how to bind CMS data to elements
- **Fix:** Add CollectionSetupModal, BindingDropdown, CMSPreviewNavigator specs

### C2: AI Subsystem UI Fragmented
- **Severity:** Critical  
- **Where:** Phase 1.8 Modals — 4 AI modules but only "AI button in top bar" mentioned
- **What:** PageGenerator, ContentWriter, LayoutAnalyzer, CodeGenerator have no UI surfaces
- **Why:** AI features will be inaccessible or discoverable only via shortcut
- **Fix:** Add AIAssistantBar spec, AI Copilot modal spec, Inspector AI Suggestions section

### C3: Inspector Multi-Select State Missing
- **Severity:** Critical
- **Where:** A.1 Gap G9 — Inspector spec shows single-element only
- **What:** When 2+ elements selected, no MultiSelectToolbar in inspector design
- **Why:** Power users cannot batch-edit properties
- **Fix:** Add IS-3 state to inspector design (MultiSelectToolbar)

---

## 8. Major Issues

### M1: Empty/Loading/Error States Not Systematic
- **Severity:** Major
- **Where:** A.4 — 15 interaction/state gaps identified in audit
- **What:** No unified state design system — Toast mentioned but no spec for stacking
- **Why:** Users get inconsistent feedback across different actions
- **Fix:** Create unified state system with 5 variants × 3 contexts

### M2: Canvas Interaction States Under-Designed
- **Severity:** Major
- **Where:** A.3 — "Canvas interaction states: Near zero"
- **What:** Empty state, inline edit, drag mode, X-Ray mode, snap lines not specified
- **Why:** Users don't know what the canvas looks like in different modes
- **Fix:** Add CanvasStateMachine spec with visual diagrams per state

### M3: Accessibility Deep Implementation Missing
- **Severity:** Major
- **Where:** A.4 IS1-IS15 — Focus trap, tab order, screen reader not specified
- **What:** WCAG 2.1 AA mentioned but 15 specific gaps remain
- **Why:** Editor won't be accessible to screen reader users
- **Fix:** Add focus management spec, aria-live announcements, tab order map

### M4: Collaboration Conflict Resolution Not Spec'd
- **Severity:** Major
- **Where:** Phase 1.12 Collaboration — "OT + presence + cursor sync" but no conflict UI
- **What:** What happens when 2 users edit same element?
- **Why:** Collaboration features will break trust
- **Fix:** Add ConflictResolutionToast, ConcurrentDelete handling, StyleConflict LWW

---

## 9. Moderate Issues

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| MOD1 | Command palette layout not designed | A.1 G6 | Add fuzzy search, categories, empty state spec |
| MOD2 | Keyboard cheat sheet incomplete | A.1 G7 | Add full shortcut reference modal |
| MOD3 | Version history compare flow missing | A.1 G20 | Add diff view visual spec |
| MOD4 | Plan-gating UI not systematic | A.1 G39 | Create 4 gate types with consistent UI |
| MOD5 | Dev mode inspector not visualized | A.1 G13 | Add raw CSS view state |

---

## 10. Minor Issues

| # | Issue | Location |
|---|-------|----------|
| MIN1 | Plugin system mentioned but not designed | A.1 G40 |
| MIN2 | Activity view in History not spec'd | A.1 G21 |
| MIN3 | Inspector sub-nav jump links not designed | A.1 G28 |

---

## 11. Anti-Patterns Detected

| Anti-Pattern | Evidence | Severity |
|--------------|----------|----------|
| **Feature Soup** | 29 managers + 4 AI modules + 10 tabs = too many equal-weight features | High |
| **Settings Junkyard** | Settings tab has 6 sub-screens, some locked | Medium |
| **Ghost Features** | CMS binding (G1), AI modules (G2), Collaboration (G5) exist in engine but no UI | Critical |
| **Hidden Save** | Auto-save mentioned but UI indicator unclear | Medium |
| **Franken-UI** | Mixed specification depth — some sections hyper-detailed, others missing | High |

---

## 12. Missing Screens

| Screen | Purpose | Required For |
|--------|---------|--------------|
| CollectionSetupModal | Define CMS schema | Core feature |
| BindingDropdown | Select field to bind | Core feature |
| AIAssistantBar | Inline AI context | Core feature |
| AI Copilot | Full page generation | Core feature |
| CommandPalette | Fuzzy command search | Power user |
| VersionHistoryCompare | Visual diff between versions | Core feature |
| UpgradeModal | Plan-gating | Monetization |
| WelcomeModal | First-visit onboarding | UX |

---

## 13. Missing States

| State Type | Coverage |
|------------|----------|
| Empty (Canvas/Layers/Media/Components) | Partial |
| Loading (skeleton, spinner, progress) | Fragmented |
| Error (save/publish/upload/AI) | Not systematic |
| Success confirmation | Partial |
| Disabled/interaction | Not spec'd |
| Hover/focus/active | Partial |

---

## 14. Product & IA Problems

- **Rail has 10 equal-weight items** — No hierarchy, user doesn't know where to start
- **Settings tab overloaded** — 6 sub-screens with plan-gating confusion
- **AI features hidden** — 4 modules but only one entry point (Ctrl+J)
- **CMS binding invisible** — No discoverable UI path

---

## 15. User Flow Problems

- **Template → Canvas flow** — ApplyProgressOverlay spec missing
- **Publish flow** — Pre-publish checklist not detailed
- **Version restore flow** — ConfirmDialog content not specified
- **Export flow** — 5 formats but "Coming Soon" handling unclear

---

## 16. Interaction Design Problems

- **No unified toast system** — Stacking, duration, dismiss not spec'd
- **Modal focus trap** — WCAG requirement not implemented
- **Context menu incomplete** — "Select from stack" missing
- **Drag-drop visual feedback** — Ghost, drop zone, invalid state not designed

---

## 17. Visual Hierarchy Problems

- **No component token spec** — Which CSS variables map to which elements
- **Typography scale incomplete** — Sizes defined but usage context unclear
- **No motion/duration spec** — Animations mentioned but no timing
- **Panel resize not spec'd** — 280px/320px/400px but when/how expand?

---

## 18. Consistency Problems

- **Rail icons** — Some Lucide, some custom, inconsistent
- **Section patterns** — Headers vary between tabs
- **Button styles** — Primary/ghost/destructive specs scattered
- **Modal patterns** — Different headers per modal type

---

## 19. State Coverage Problems

- **No unified error state system** — Every error handled differently
- **Loading states inconsistent** — Some spinners, some skeletons, some text
- **Partial-failure not addressed** — What happens when AI returns partial result?

---

## 20. Content Design Problems

- **Button labels vague** — Some say "Submit" vs "Publish Site"
- **Error messages weak** — "Save failed" vs "Could not save — check connection"
- **Confirmation dialogs inconsistent** — Some say "Delete?" vs "Delete [type]? This cannot be undone."

---

## 21. Design System Status

**Partial Design System Exists:**
- Surface tokens (S1-S8) defined
- Primary colors defined
- Typography scale (T1-T24) exists
- Border radius scale exists
- Shadow scale (SH1-SH5) exists

**Missing:**
- Component token mapping
- Motion/duration tokens
- Icon specification
- Density targets

---

## 22. Handoff Risks

| Risk | Impact | Mitigation |
|------|--------|-------------|
| No motion spec | Developers guess animation timing | Add duration table |
| No icon mapping | Confused which icon = which function | Add icon spec |
| No breakpoint spec for editor shell | Responsive editor UI unclear | Add editor breakpoints |
| No panel resize spec | Inconsistent panel behavior | Add resize rules |

---

## 23. Benchmark Comparison

| Aspect | Buildrik | Webflow | Framer |
|--------|----------|---------|--------|
| Canvas states | Weak (5+) | Strong (15+) | Strong (10+) |
| AI features | Hidden | None | Limited |
| CMS binding | Engine ready, UI missing | Built-in | None |
| Keyboard shortcuts | 30+ | 40+ | 20+ |
| Version history | Basic | Advanced | Basic |
| Empty states | Partial | Full | Full |

**Recommendation:** Study Webflow's CMS binding UI and Framer's keyboard shortcut discoverability

---

## 24. Quick Wins

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| QW1 | Add empty state illustrations to all panels | Low | High |
| QW2 | Standardize error message format | Low | Medium |
| QW3 | Add toast stacking rules | Low | High |
| QW4 | Document focus indicator (2px #6366f1) | Low | High |

---

## 25. Structural Fixes Required

| # | Fix | Phase |
|---|-----|-------|
| SF1 | Create unified State System (empty/loading/error/success) | Fix First |
| SF2 | Add CMS Binding UI (CollectionSetupModal, BindingDropdown) | Fix First |
| SF3 | Add AI Surface UI (AssistantBar, Copilot, Suggestions) | Fix First |
| SF4 | Add Accessibility deep implementation | Fix Second |
| SF5 | Add Canvas State Machine spec | Fix Second |
| SF6 | Create Component Token mapping | Fix Third |
| MOD7 | Add Motion spec | Fix Third |

---

## 26. Repair Sequence

### Phase 1: Fix First (Sprint 1-2)
1. Add CMS Binding UI surfaces
2. Add AI UI surfaces (AssistantBar + Copilot)
3. Add Multi-select inspector state
4. Add Accessibility (focus trap, aria-live, tab order)

### Phase 2: Fix Second (Sprint 3-4)
1. Add Canvas State Machine with visuals
2. Add unified toast system
3. Add Version History compare flow
4. Add Collaboration conflict resolution UI

### Phase 3: Fix Third (Sprint 5-6)
1. Add Component Token mapping
2. Add Motion/duration spec
3. Add panel resize spec
4. Standardize all modal patterns

### Phase 4: Fix After (Sprint 7+)
1. Micro-interactions polish
2. High contrast mode
3. Reduce motion handling
4. Advanced accessibility

---

## 27. Role Mapping

| Role | Deliverable |
|------|-------------|
| Senior Product Designer | CMS Binding flow, AI surfaces, Canvas states |
| UX Strategist | IA restructure, Rail hierarchy, Settings consolidation |
| Interaction Designer | Toast system, focus management, drag-drop feedback |
| Design Systems Designer | Component tokens, motion spec, icon mapping |
| Content Designer | Error messages, button labels, empty states |
| Frontend Engineer | Implementation after Phase 1 complete |

---

## 28. Next Deliverables

1. **State System Spec** — Unified empty/loading/error/success across all surfaces
2. **CMS Binding UI Mockups** — Collection setup, field mapping, preview
3. **AI Surface Wireframes** — AssistantBar, Copilot, Suggestions in inspector
4. **Canvas State Diagram** — Visual spec for each canvas mode
5. **Accessibility Spec** — Focus trap, aria-live, tab order map

---

## 29. Re-Audit Recommendations

- **Re-audit after:** Phase 1 fixes (Sprint 2)
- **Key metrics to track:**
  - CMS binding discoverability score
  - AI feature usage rate
  - Accessibility audit score (target: 80%+)
  - Empty state coverage

---

## Summary

**Overall Health: 3.7/5.0 — Average**

The PRD is extremely detailed but suffers from **feature depth without UI surface** — many capabilities exist in the engine but have no discoverable user interface. The most critical gaps are:

1. **CMS Binding UI** — Core feature but no screens
2. **AI Surfaces** — 4 modules but one button
3. **State Coverage** — Not systematic
4. **Accessibility** — Surface-level only

**Recommendation:** Prioritize Phase 1 fixes before development begins.

---

*End of Audit*

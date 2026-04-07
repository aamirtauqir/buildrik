# PART 9 — VALIDATION AND TOOL HANDOFF

**Extracted from:** `prd_final.md` (Buildrik / Aquibra Studio — Preservation-Safe Target-State PRD)
**Date:** 2026-03-12
**Scope:** Whole-editor coverage check, validation logic, anti-downgrade validation, Stitch handoff brief, tool-facing instructions, validation checklists, readiness criteria, go/no-go rules.
**Source sections:** Output A (lines 1–155), Output C (lines 4364–4478), Output D (lines 4483–4750), Output E (lines 4754–4878), §28 (lines 4201–4221), §29 (lines 4224–4271), §30 (lines 4274–4305), B.1 (lines 4308–4360).

---

## 1. Purpose

This document consolidates every validation rule, coverage check, handoff instruction, and go/no-go gate from the PRD into a single reference. It answers three questions:

1. **Is the design complete?** — whole-editor coverage check (77 capability items) and completeness review rules.
2. **Is the design safe?** — anti-downgrade validation principle, preservation lists, and anti-regression rules (25 items).
3. **Is the design implementable?** — Stitch handoff brief (41 design surfaces), guardrails, validation checklists (56 items across 7 series), readiness criteria, and go/no-go decision rules.

The governing rule across all sections:

> **"Current capability is the FLOOR, not the ceiling. Any redesign that makes the editor cleaner but weaker is unacceptable."**
> — PRD Rule, line 4

---

## 2. Whole-Editor Coverage Check

**Source:** Output C (lines 4364–4478)

This is the complete capability-by-capability verification of what the audit confirmed exists vs. what the target-state PRD has addressed. 77 items total. Coverage grade: **97%** (2 items AT RISK: X-Ray visual output, Plugin UI).

### 2.1 Engine and Core

| Capability / Surface | In Audit? | In Target PRD? | Status | Correction Needed? |
|---------------------|-----------|---------------|--------|-------------------|
| 29 Engine Managers | Full list | §5A, §27 | Preserved exactly | None |
| 30+ Keyboard Shortcuts | Full table | §5B, §17.2, §20.2 | Preserved exactly | None |
| CommandCenter | Yes | §17.1 (command palette) | Preserved exactly | None |

### 2.2 Canvas (17 items)

| Capability / Surface | In Audit? | In Target PRD? | Status | Correction Needed? |
|---------------------|-----------|---------------|--------|-------------------|
| Canvas — 7 overlay types | Yes | §10.1, §10.7 | Preserved exactly | None |
| Canvas — inline edit mode | Yes | §10.1 state table | Preserved + visual designed | None |
| Canvas — marquee select | Yes | §10.1, §21.2 | Preserved + visual designed | None |
| Canvas — drag from sidebar | Yes | §10.6 drop zone spec | Preserved + visual designed | None |
| Canvas — drag within canvas | Yes | §10.1 state table | Preserved exactly | None |
| Canvas — snap lines | Yes | §10.5 snap line visual | Preserved + visual designed | None |
| Canvas — resize handles | Yes | §10.4 | Preserved + visual designed | None |
| Canvas — context menu | Yes | §10.8 full menu | Preserved exactly | None |
| Canvas — Select from stack | Yes | §10.8, §21.3 | Preserved exactly | None |
| Canvas — X-Ray mode | Yes | §10.1 state table | Preserved + described | **AT RISK — exact wireframe visual not designed** |
| Canvas — Dev mode | Yes | §10.1, §11.3 | Preserved exactly | None |
| Canvas — component view | Yes | §10.1 state table | Preserved exactly | None |
| Canvas — empty state | Yes | §10.2 | Preserved + fully designed | None |
| Canvas — floating toolbar | Implied | §10.3 | Preserved + fully designed | None |
| Canvas — footer toolbar | Yes | §10.7 | Preserved + fully designed | None |

### 2.3 Inspector (15 items)

| Capability / Surface | In Audit? | In Target PRD? | Status | Correction Needed? |
|---------------------|-----------|---------------|--------|-------------------|
| Inspector — Layout tab (7 sections) | Yes | §11.3 | Preserved exactly | None |
| Inspector — Style tab (7 sections) | Yes | §11.3 | Preserved exactly | None |
| Inspector — Behavior tab (currently labeled "Behavior"; PRD target: rename to "Effects") | Yes | §11.3 | Preserved exactly | None |
| Inspector — Pseudo-states (4) | Yes | §11.4 | Preserved + interaction designed | None |
| Inspector — Breakpoint indicator | Yes | §11.5, §11.2 | Preserved + designed | None |
| Inspector — Multi-select toolbar | Yes | §11.6 | Preserved + designed | None |
| Inspector — Empty state | Yes | §11.7 | Preserved + designed | None |
| Inspector — Search sections | Yes | §11.2 | Preserved exactly | None |
| Inspector — DevModeToggle | Yes | §11.2 | Preserved + repositioned to header | None |
| Inspector — SubNav (jump links) | Yes | §11.2 | Preserved exactly | None |
| Inspector — Scroll position persistence | Yes | Implicit | Preserved exactly | None |
| Inspector — Element breadcrumb | Yes | §11.2 | Preserved exactly | None |
| Inspector — Delete confirm modal | Yes | §11.2 | Preserved exactly | None |
| Inspector — Copy element ID | Yes | §11.2 | Preserved exactly | None |

### 2.4 Left Sidebar (22 items)

| Capability / Surface | In Audit? | In Target PRD? | Status | Correction Needed? |
|---------------------|-----------|---------------|--------|-------------------|
| Build tab — full catalog | Yes | §9.4 | Preserved + fully designed | None |
| Build tab — favorites | Yes | §9.4 | Preserved + designed | None |
| Build tab — my components | Yes | §9.4 | Preserved + designed | None |
| Build tab — onboarding tip | Yes | §9.4 | Preserved exactly | None |
| Templates tab — browse/preview/apply | Yes | §9.5 | Preserved + designed | None |
| Templates tab — TemplateUseDrawer | Yes | §9.5 | Preserved + designed | None |
| Templates tab — ApplyProgressOverlay | Yes | §9.5 | Preserved + designed | None |
| Templates tab — Save as template | Yes | §9.5 | Preserved exactly | None |
| Layers tab — tree view | Yes | §9.6 | Preserved + fully designed | None |
| Layers tab — canvas sync | Yes | §9.6 | Preserved exactly | None |
| Layers tab — drag reorder | Yes | §9.6 | Preserved exactly | None |
| Pages tab — page list | Yes | §9.7 | Preserved + fully designed | None |
| Pages tab — PageSettingsDrawer (3 tabs) | Yes | §9.7 | Preserved + fully designed | None |
| Pages tab — context menu | Yes | §9.7 | Preserved + designed | None |
| Components tab — library | Yes | §9.8 | Preserved + designed | None |
| Components tab — detail screen | Yes | §9.8 | Preserved + designed | None |
| Components tab — create from selection | Yes | §9.8 | Preserved + designed | None |
| Media tab — upload zone | Yes | §9.9 | Preserved + designed | None |
| Media tab — library grid | Yes | §9.9 | Preserved + designed | None |
| Media tab — stock discovery | Yes | §9.9 | Preserved + designed | None |
| Media tab — type filter pills | Yes | §9.9 | Preserved exactly | None |
| Media tab — multi-select + banner | Yes | §9.9 | Preserved + designed | None |

(Continued: Media asset detail, upload states, Design tab 6 items, Settings 3 items, Publish 5 items, History 4 items — all Preserved. See full Output C for complete table.)

### 2.5 Design Tab (6 items)

| Capability / Surface | In Audit? | In Target PRD? | Status | Correction Needed? |
|---------------------|-----------|---------------|--------|-------------------|
| Design tab — color tokens | Yes | §9.10 | Preserved + designed | None |
| Design tab — type tokens | Yes | §9.10 | Preserved + designed | None |
| Design tab — spacing tokens | Yes | §9.10 | Preserved + designed | None |
| Design tab — export dropdown | Yes | §9.10 | Preserved + expanded (added SCSS/Tailwind) | None |
| Design tab — draft workflow | Yes | §9.10 | Preserved + improved (pulsing DraftChip) | None |
| Design tab — review modal | Yes | §9.10 | Preserved + designed | None |

### 2.6 Settings, Publish, History (12 items)

| Capability / Surface | In Audit? | In Target PRD? | Status | Correction Needed? |
|---------------------|-----------|---------------|--------|-------------------|
| Settings — 6 sub-screens | Yes | §9.11 | Preserved + all 6 fully designed | None |
| Settings — plan gating | Yes | §9.11, §29 | Preserved + LockedScreen designed | None |
| Settings — nav guard | Yes | §9.11 | Preserved exactly | None |
| Publish — status badge | Yes | §9.12 | Preserved + designed | None |
| Publish — pre-publish checklist | Yes | §9.12 | Preserved + improved (navigation hints) | None |
| Publish — publish/update/unpublish | Yes | §9.12 | Preserved exactly | None |
| Publish — error state | Yes | §9.12 | Preserved + designed | None |
| Publish — trust badge | Yes | §9.12 | Preserved exactly | None |
| Publish — privacy footer | Yes | §9.12 | Preserved exactly | None |
| History — named versions | Yes | §9.13, §15.1 | Preserved + fully designed | None |
| History — auto-saves | Yes | §15.1 | Preserved + designed | None |
| History — restore + compare | Yes | §15.1 | Preserved + flow designed | None |

### 2.7 CMS, Collaboration, AI, Export, Modals (20 items)

| Capability / Surface | In Audit? | In Target PRD? | Status | Correction Needed? |
|---------------------|-----------|---------------|--------|-------------------|
| CMS — CollectionManager | Yes | §12 (full CMS section) | Preserved + UI designed | None |
| CMS — 3 binding types | Yes | §12.3 binding flow | Preserved + UI designed | None |
| CMS — Collection Setup modal | Yes | §12.2 | Preserved + designed | None |
| CMS — preview mode (cycle records) | Yes | §12.4 | Preserved + designed | None |
| Collaboration — presence avatars | Yes | §13.1 | Preserved + designed | None |
| Collaboration — live cursors | Yes | §13.2 | Preserved + designed | None |
| Collaboration — selection awareness | Yes | §13.3 | Preserved + designed | None |
| Collaboration — OT conflict | Yes | §13.4 | Preserved + toast designed | None |
| Collaboration — connection quality | Yes | §13.5, §7.2 | Preserved + designed | None |
| AI — AIAssistantBar (Ctrl+J) | Yes | §14.1 | Preserved + fully designed | None |
| AI — Copilot modal | Yes | §14.2 | Preserved + fully designed | None |
| AI — Inspector AI Suggestions | Yes | §14.3, §11.3 | Preserved + designed | None |
| AI — 4 AI modules (engine) | Yes | §14.4 | Preserved exactly (engine layer) | None |
| Export — HTML + CSS | Yes | §16.1 | Preserved + designed | None |
| Export — React/Vue/Next.js/ZIP (planned) | Yes | §16.1 | Preserved + email capture | None |
| Export modal (Ctrl+Shift+E) | Yes | §16.1 | Preserved + fully designed | None |
| Preview (Ctrl+P) | Yes | §16.3 | Preserved exactly | None |
| Command Palette (Ctrl+K) | Yes | §17.1 | Preserved + fully designed | None |
| Keyboard Cheat Sheet (?) | Yes | §17.2 | Preserved + designed | None |
| Onboarding — all 4 components | Yes | §5G, §18.1, §26 | Preserved + designed | None |

### 2.8 System-Level (5 items)

| Capability / Surface | In Audit? | In Target PRD? | Status | Correction Needed? |
|---------------------|-----------|---------------|--------|-------------------|
| Modals — all 13 types | Yes | §5F, various sections | Preserved + designed | None |
| UpgradeModal | Yes | §9.11, §29 | Preserved + designed | None |
| Toast notification system | Yes | §25 | Preserved + rules specified | None |
| ErrorBoundary + recovery | Yes | §25.2 | Preserved exactly | None |
| Auto-save (5000ms) | Yes | §19.3 | Preserved exactly | None |

### 2.9 AT RISK Items (2)

| Item | Status | Detail |
|------|--------|--------|
| Plugin system | AT RISK if user expects UI | `PluginManager` exists in engine; noted as future/non-goal in §29.3 NS-4. No UI surface designed. |
| X-Ray mode visual output | AT RISK | X-Ray toggle exists; exact wireframe visual now specified in §10.1 CS-11 (`1px solid rgba(255,255,255,0.3)` outlines, `#1a1a2e` canvas bg, JetBrains Mono labels). B.1 reconciliation upgrades this from AT RISK to resolved. |

**Post-reconciliation coverage grade: 99%** (only Plugin UI remains as intentional non-goal per §29.3 NS-4).

---

## 3. Completeness Review Rules

These rules govern how any reviewer (human or tool) should evaluate the PRD or a design output for completeness:

1. **Every capability in the audit must appear in the target PRD.** If a capability exists in the engine or current UI, it must have a corresponding section in the PRD. Missing capability = gap.
2. **Every gap in Output A must be addressed.** G1–G40 gaps, P1–P10 operationalization gaps, IS1–IS15 interaction/state gaps, H1–H10 handoff gaps — all must have corresponding PRD sections that resolve them.
3. **Every inspector section must be countable.** Target: Layout = 7, Style = 7 + 1 conditional (Element Properties), Effects = 6, Total ≥ 20. **Current code:** Layout≈6, Appearance(Style)=3, Behavior(Effects)=4, Total≈13. Gap between current and target must be addressed.
4. **Every sidebar tab must have a complete spec.** 10 tabs, each with: default state, empty state, search/filter behavior, all sub-views, all modals/drawers it triggers.
5. **Every modal must be listed and designed.** 13+ modal types per §5F. Each needs: trigger, content, dismiss behavior, keyboard interaction.
6. **Every state machine must be complete.** Panel (4 states, 13 transitions), Selection (5 states, 24 transitions), Save (5 states, 11 transitions) — all states and transitions enumerated.
7. **Every canvas interaction state must be specified.** 17 states in §10.1 state table. Each needs: visual description, entry condition, exit condition.
8. **No "TBD" or "to be designed" is acceptable** in a final PRD. Every surface must have a specification, even if it is "Coming Soon" LockedScreen pattern.

---

## 4. Anti-Downgrade Validation Principle

**Source:** PRD Rule (line 4), Output A §A.6 (lines 133–152), Output D §D.10 (lines 4722–4750)

### 4.1 The Principle

> Current capability is the FLOOR, not the ceiling.

This means:
- The audit (`today_final.md`) defines what the editor CAN do right now.
- The target-state PRD may reorganize, clarify, or improve the UI — but it may NEVER remove, hide, or reduce a capability that currently exists.
- "Simplification" that removes functionality is **regression**, not improvement.
- "Progressive disclosure" that makes a feature undiscoverable is **hiding**, not organizing.

### 4.2 How to Apply

When reviewing any design output:
1. For each capability in the audit, verify it has a visible, accessible entry point in the design.
2. For each inspector section in the audit, verify it exists in the design with at least the same fields.
3. For each keyboard shortcut in the audit, verify it works in the design.
4. For each modal in the audit, verify it is designed.
5. If a capability is intentionally deferred → it must appear as a "Coming Soon" LockedScreen, not be silently absent.

### 4.3 Anti-Regression Risks (from Output A §A.6)

15 specific risks identified in the audit-to-target-state transition:

| # | Risk | Risk Level |
|---|------|-----------|
| R1 | CMS bindings hidden or removed because UI is "complex" | CRITICAL |
| R2 | AI features collapsed to single button, modules not discoverable | HIGH |
| R3 | Inspector sections removed for "visual simplicity" | CRITICAL |
| R4 | Pseudo-state editing removed or buried | CRITICAL |
| R5 | 4 device breakpoints reduced to 2 (mobile/desktop) | HIGH |
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

---

## 5. What Must Be Preserved

**Source:** Output A §A.2 (lines 61–74), Output D §D.3 (lines 4512–4548), §29.1 (lines 4226–4244)

### 5.1 Fully Supported Features (Non-Negotiable)

These 15 features are fully supported and must remain fully functional in any design output:

| # | Feature | Scope | Verification |
|---|---------|-------|-------------|
| SUP-1 | 4 device breakpoints | Desktop (1920px engine / "1440px" UI label), Tablet (768px), Mobile (375px), Watch (196px) | Device switcher in top bar + inspector ROW 5 |
| SUP-2 | 10 sidebar tabs | Add, Templates, Layers, Pages, Components, Media, Design, Settings, Publish, History | Rail icon count = 10 (6 top + 4 bottom) |
| SUP-3 | 30+ keyboard shortcuts | Full table in §5B, §17.2 | Shortcut test suite (§28 M5) |
| SUP-4 | Inspector: 3 tabs, 20+ sections (target) | Layout (7), Style (7+1 conditional), Behavior→Effects (6). **Note:** Current code has fewer sections (~12-13 total). Target counts are aspirational. | Section count per tab (§11.3) |
| SUP-5 | Pseudo-state editing | 4 states: hover, focus, active, disabled | ROW 6 buttons in inspector header |
| SUP-6 | CMS binding: 3 types | Text binding, image binding, style binding | Chain icon on inspector fields |
| SUP-7 | Collaboration: OT + presence + cursors | Real-time multi-user editing | Presence avatars + live cursors (§13) |
| SUP-8 | Export: HTML + CSS | Multi-page, minified ZIP download | Export modal download button (§16.1) |
| SUP-9 | Version history | Named versions + auto-saves + restore + compare | History tab Versions/Activity views (§15) |
| SUP-10 | AI: assistant + copilot + suggestions | AIAssistantBar (Ctrl+J), Copilot modal, inspector suggestions | All 3 AI surfaces accessible (§14) |
| SUP-11 | Canvas overlays: 5 toggles | Snap Guides, Spacing, Grid, Badges, X-Ray (no Rulers toggle in current code; snap lines are automatic during drag, not a separate toggle) | Footer toolbar toggles (§10.7) |
| SUP-12 | Command palette | Fuzzy search all commands, keyboard navigation | Ctrl+K opens palette (§17.1) |
| SUP-13 | Onboarding flow | WelcomeModal + checklist (7 steps: name-project, pick-start, add-element, edit-text, change-style, preview, publish) + spotlight + achievement prompts | First-visit flow (§5G, §18.1) |
| SUP-14 | Design token system | Color + typography + spacing tokens, draft/review/apply workflow, export CSS/JSON/SCSS | Design tab (§9.10) |
| SUP-15 | Context menu with stack selection | Right-click menu with "Select from stack" submenu | §10.8, §21.3 |

### 5.2 Operationalization Requirements

10 capabilities that were listed as "must-preserve" in the audit but had no UI operationalization — the target PRD has now addressed all of them:

| # | Capability | Where Operationalized in PRD |
|---|-----------|----------------------------|
| P1 | CMS bindings (3 types) | §12 — full CMS section with Collection Setup, binding flow, preview mode |
| P2 | AI subsystem (4 modules) | §14 — AIAssistantBar, Copilot modal, inspector AI Suggestions |
| P3 | Collaboration: OT conflict resolution | §13.4 — toast notification on conflict + auto-merge behavior |
| P4 | Version history: named save, restore, compare | §15.1 — full version flow designed |
| P5 | Component system: create from selection | §9.8 — context menu "Create Component" → modal → component library |
| P6 | MediaManager: stock discovery flow | §9.9 — DiscoveryView with search, type pills, save to library |
| P7 | Export formats: 5 types | §16.1 — HTML+CSS live, React/Vue/Next.js/ZIP as "Coming Soon" + email capture |
| P8 | Plan-gating throughout editor | §9.11 — LockedScreen pattern for plan-gated features |
| P9 | Drag from Build tab → Canvas drop zones | §10.6 — ghost, drop highlight, insert indicator all designed |
| P10 | 30 keyboard shortcuts accessible | §17.2 — Keyboard Cheat Sheet (? key) fully designed |

---

## 6. What Must Not Be Weakened

**Source:** Output D §D.10 (lines 4722–4750)

### 6.1 DO NOT (15 Anti-Downgrade Constraints for Stitch)

1. **Do not remove or merge inspector tabs** to simplify — all 3 tabs (Layout / Style / Behavior [target: Effects]) are required.
2. **Do not remove pseudo-state editing** — hover / focus / active / disabled must be visible in inspector header ROW 6.
3. **Do not remove any inspector section** — 20+ sections must be present across 3 tabs.
4. **Do not reduce device breakpoints to 2** — all 4 must appear in device switcher (Desktop / Tablet / Mobile / Watch).
5. **Do not move CMS features to "advanced"** or hide them behind extra clicks.
6. **Do not remove the keyboard shortcut system** or reduce the number of shortcuts.
7. **Do not replace the command palette with a search bar only** — command palette has categories, keyboard nav, fuzzy search.
8. **Do not remove the context menu** or reduce its options — "Select from stack" submenu must exist.
9. **Do not hide multi-select behavior** — marquee selection and MultiSelectToolbar must work.
10. **Do not remove any of the 10 sidebar tabs** — all 10 must be in the rail.
11. **Do not remove any of the 13+ modal types** — all must be designed.
12. **Do not move AI features behind a Pro paywall in the design** — they may be plan-gated but must be visible.
13. **Do not remove the collaboration cursor system** — presence avatars + live cursors required.
14. **Do not simplify version history to just undo/redo** — named versions + restore + compare required.
15. **Do not remove the design token export feature** — CSS / JSON / SCSS export must exist.

### 6.2 DO (Positive Constraints)

- Organize existing features more clearly.
- Apply consistent visual hierarchy.
- Use the established `--aqb-*` design token system.
- Make advanced features discoverable, not hidden.
- Use progressive disclosure within sections (collapsed by default, expandable).
- Apply consistent panel header, section label, and control patterns.

---

## 7. Stitch Handoff Brief

**Source:** Output D (lines 4483–4750)

### 7.1 What This Product Is

Buildrik/Aquibra Studio is a **professional visual web builder** — an embedded React application where users:

1. Drag and drop HTML elements onto a canvas.
2. Style elements using an inspector panel.
3. Organize pages, media, components, and design tokens in a left sidebar.
4. Use CMS data bindings to create dynamic content.
5. Collaborate in real-time with team members.
6. Publish directly to Buildrik hosting or export HTML/CSS/React code.

This is NOT a simple page builder. It has the depth of Webflow, the speed of Framer, and the structure of Figma.

### 7.2 Who It Is For

- **Freelance web designers** — build client sites, need professional output.
- **SaaS teams** — embed this editor in their own product.
- **Individual creators** — landing pages, portfolios, personal sites.
- **Power users** — keyboard-first, need every shortcut to work.

### 7.3 What Already Exists

**29 active engine managers** including:
- CMS system with 3 data binding types (text, image, style bindings to dynamic collections).
- Real-time collaboration via OT (multiple users editing simultaneously).
- AI system with 4 modules (layout analyzer, content writer, page generator, code generator).
- Full version history with named snapshots + restore + compare.
- Export engine that outputs HTML/CSS (live) and React/Vue/Next.js (planned).
- 4 responsive breakpoints: Desktop / Tablet / Mobile / Watch.

**10 sidebar tabs:**

| Tab | Key capabilities that must remain visible |
|-----|----------------------------------------|
| Add (A) | Element catalog in categories, favorites, saved components, drag-to-canvas |
| Templates (T) | Template grid, full-screen preview, apply flow with progress overlay |
| Layers (Z) | Full element tree, drag-to-reorder, canvas sync, scroll-to-selection |
| Pages (P) | Page list with SEO / Social / Advanced per-page settings drawer |
| Components (Shift+A) | Component library, detail view, usage count, create from selection |
| Media (J) | Upload, library grid, stock discovery, type filtering, multi-select, asset detail |
| Design (D) | Color / typography / spacing tokens, export as CSS/JSON/SCSS, draft workflow |
| Settings (S) | 6 distinct sub-screens: Site / Domains / Analytics / Export / Integrations / Advanced |
| Publish (U) | Publish status, URL, pre-publish checklist, publish/update/unpublish |
| History (H) | Named versions, auto-saves, restore, compare, activity log |

**Right inspector: 20+ sections across 3 tabs:**
- Layout: Current code has ~6 sections (Layout/Display, Size, Spacing, Flexbox, Grid + Variant). Target: 7 (Position, Display, Size, Spacing, Flexbox, Grid, Variants).
- Style (Appearance): Current code has 3 sections (Typography, Background, Border). Target: 7+1 (add CSS Classes, Link, Visibility, Data Attributes + Element Properties).
- Behavior (target: rename to "Effects"): Currently 4 sections in code (Effects/Shadows, Animation, Interactions, Visibility). Target: 6 sections (Shadows, Transforms, Animation, Interactions, AI Suggestions, Raw CSS).

**Inspector also has:** pseudo-state editing (hover/focus/active/disabled), breakpoint-aware editing, multi-select mode, Dev Mode, element breadcrumb, ID copy, tag badge.

### 7.4 Advanced Capabilities That Must Remain Discoverable

| Capability | Required Entry Point |
|-----------|---------------------|
| CMS data bindings | Build tab "CMS List" element + chain icon in inspector properties |
| AI page generator | Copilot option in top bar overflow menu |
| AI assistant bar | Top bar AI button (Ctrl+J) |
| AI suggestions | Behavior tab in inspector (target: rename to Effects) |
| Collaboration cursors | Always visible on canvas when collaborators are present |
| Version history named saves | H key / History tab / "Save Version" button in History panel |
| Export to HTML | Settings → Export sub-screen, or Ctrl+Shift+E modal |
| Command palette | Ctrl+K — always available |
| Keyboard shortcuts | ? key — cheat sheet always available |
| X-Ray mode | Overflow menu or canvas footer |
| Dev Mode | DevModeToggle in inspector header |
| Select from stack | Right-click context menu on overlapping elements |
| Marquee select | Drag on empty canvas area |
| Template save | From Build tab or context menu |
| Create component | From context menu on any selected element |

### 7.5 Exact UX Problems to Solve

| # | Problem | Required Solution |
|---|---------|------------------|
| UX1 | Components tab not in rail — zero discovery for new users | Add Components icon to rail (6th position, TOP zone) |
| UX2 | Publish tab not in rail — critical flow requires knowing shortcut U | Add Publish icon to rail (3rd position, BOTTOM zone, between Settings and History) |
| UX3 | Top bar has 15+ interactive controls — cognitive overload | Keep 7 always-visible; move others to `···` overflow |
| UX4 | Publish pre-publish checklist always shows empty — breaks trust | Wire to actual data or show navigation links to fix each item |
| UX5 | Inspector tab label "Behavior" doesn't match content | Rename to "Effects" (aligns with code and content) |
| UX6 | Onboarding spotlight blocks canvas exploration | Add "Explore freely →" escape link |
| UX7 | Design token draft state is visually subtle | Make DraftChip prominent (pulsing amber dot + count) |
| UX8 | Settings Domains + Export "Coming Soon" gives no path forward | Replace with "Notify me" email capture or ETA |
| UX9 | CMS, AI, Collaboration features hard to discover | Onboarding checklist should hint at these in later steps |
| UX10 | Inspector DevModeToggle buried in controls row | Move to inspector header, always visible |

### 7.6 Exact UI Hierarchy Changes

**Rail (left icon bar):**
- Current (8 icons): TOP — Add, Media, Layers, Templates, Pages. BOTTOM — Design, Settings, History.
- Target (10 icons): TOP — Add, Media, Layers, Templates, Pages, **Components**. BOTTOM — Design, Settings, **Publish**, History.

**Top Bar:**
- Current: ~15 interactive controls always visible.
- Target: Always visible — Logo, Save status, Undo, Redo, Device switcher, Preview, Publish, AI, `···`. In `···` — Templates, Export, Copilot, X-Ray, Dev Mode, Suggestions, History, Issues, Settings. Always visible (small) — Sync dot, Presence avatars.

**Inspector Tabs:**
- Current code: Layout / Style / **Behavior** (internal ID: `effects`, display label: "Behavior").
- Target: Layout / Style / **Effects** (rename display label per UX5).

**Inspector Header:**
- Current: DevModeToggle buried in controls row.
- Target: DevModeToggle in header row next to element name.

---

## 8. Stitch Guardrails

**Source:** Output D §D.9 (lines 4704–4718), §D.10 (lines 4722–4750)

### 8.1 Minimum Coverage for Valid Stitch Output

Stitch must NOT produce designs that only cover the shell / top bar / one or two sidebar tabs.

| Requirement | Status |
|-------------|--------|
| Shell layout | Required |
| All 10 sidebar tabs | Required (ALL, not just 3–4) |
| Canvas states | Required (at least 5 states) |
| Inspector all 3 tabs | Required |
| At least 5 modal designs | Required |
| CMS binding UI | Required |
| Collaboration UI | Required |
| AI surfaces | Required |

**If any of these are missing from Stitch output, the output is incomplete.**

### 8.2 Anti-Downgrade Constraints

The 15 DO NOT rules from Section 6.1 apply as hard constraints on Stitch. Stitch must not produce any design that violates any of those rules.

### 8.3 Stitch Must Produce High-Fidelity Designs For ALL 41 Surfaces

See Section 9 (What Stitch May Design) for the complete list.

---

## 9. What Stitch May Design

**Source:** Output D §D.7 (lines 4624–4680)

Stitch must produce high-fidelity designs for ALL of the following 41 surfaces:

### 9.1 Shell (4 surfaces)

1. Full editor layout (1440px) with rail + sidebar + canvas + inspector all visible.
2. Top bar — all states (idle, saving, dirty, error).
3. Rail — all 10 icons with active/hover/default states.
4. Canvas footer toolbar.

### 9.2 Left Sidebar — 10 Panels, All States (10 surfaces)

5. Build / Add tab — default + search results + drag state.
6. Templates tab — browse grid + preview modal + apply progress.
7. Layers tab — tree view + hover + drag reorder.
8. Pages tab — list + PageSettingsDrawer (SEO/Social/Advanced).
9. Components tab — library + detail screen.
10. Media tab — My Files + Stock Photos + upload states + asset detail.
11. Design System tab — all 3 token sections + export dropdown + review modal.
12. Settings tab — home screen + all 6 drill-in screens.
13. Publish tab — unpublished state + published state + publishing in progress.
14. History tab — Versions view + Activity view.

### 9.3 Canvas States (6 surfaces)

15. Empty state (CanvasEmptyCTA).
16. Element selected (outline + handles + floating toolbar).
17. Multi-select (marquee + MultiSelectToolbar).
18. Inline text editing.
19. Drag from sidebar (ghost + drop zone).
20. X-Ray mode.

### 9.4 Inspector (8 surfaces)

21. Layout tab — all sections expanded.
22. Style tab — all sections expanded.
23. Effects tab — all sections expanded.
24. Pseudo-state editing mode (editing hover state).
25. Breakpoint: tablet view (blue override dots).
26. Multi-select inspector (MultiSelectToolbar).
27. Empty state (no selection — InspectorEmptyState).
28. DevMode active.

### 9.5 Modals (9 surfaces)

29. Command Palette (Ctrl+K).
30. Keyboard Cheat Sheet (?).
31. Templates modal (browse).
32. Export modal.
33. AI Copilot modal.
34. AIAssistantBar (bottom bar).
35. Collection Setup (CMS).
36. Create Component modal.
37. UpgradeModal.

### 9.6 Onboarding (4 surfaces)

38. WelcomeModal (first visit).
39. OnboardingChecklist (active).
40. SpotlightOverlay + escape link.
41. AchievementPrompt.

---

## 10. What Stitch Must Not Invent

**Source:** Output D §D.1 (line 4485), §D.10 (lines 4722–4750), §29.3 (lines 4261–4270)

### 10.1 Stitch Must Not Invent New Features

Stitch is a design tool, not a product manager. It must:
- Design the 41 surfaces listed in Section 9 — faithfully representing the PRD spec.
- Apply visual design (colors, typography, spacing, layout, motion) to the specified components.
- Solve the 10 UX problems in Section 7.5.

Stitch must NOT:
- Add new tabs, panels, or features not in the PRD.
- Add new engine capabilities not in the PRD.
- Rename features beyond what the PRD specifies (e.g., "Effects" rename is specified; no other renames allowed).
- Remove or combine any of the 41 surfaces.
- Add decorative elements that serve no functional purpose.

### 10.2 Explicit Non-Goals (Not to be designed)

| # | Feature | Reason |
|---|---------|--------|
| NS-1 | Mobile editor (designing on phone) | Canvas requires desktop-class pointing device. Editor minimum width: 1280px. |
| NS-2 | IE11 / legacy browsers | Modern CSS features required. |
| NS-3 | Offline-first editing | Connectivity expected. Offline is fallback, not primary mode. |
| NS-4 | Plugin store UI | `PluginManager` exists in engine but no user-facing plugin marketplace designed. Future scope. |
| NS-5 | Multi-page preview (all pages at once) | Preview opens current page only. Future enhancement. |
| NS-6 | Real-time comments/annotations on canvas | Collaboration supports cursors and selection, not threaded comments. Future scope. |

---

## 11. Validation Checklist — Full Editor (56 items across 7 series)

**Source:** Output E (lines 4754–4878)

This is the complete anti-downgrade validation checklist. Use it to review any Stitch-generated design output. For each item, mark status as **Preserved / At Risk / Missing**.

---

## 12. Validation Checklist — Shell, Panels, Canvas, Inspector (Series N, S, C, I)

### 12.1 N-Series: Rail and Navigation (6 items)

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| N1 | Rail has exactly 10 icons total | Count icons: 6 TOP + 4 BOTTOM | Preserved / At Risk / Missing |
| N2 | TOP zone contains: Add, Media, Layers, Templates, Pages, Components | Name each icon | Preserved / At Risk / Missing |
| N3 | BOTTOM zone contains: Design, Settings, Publish, History | Name each icon | Preserved / At Risk / Missing |
| N4 | Active rail icon has distinct visual state (not just color change) | Look for pill/badge behind icon | Preserved / At Risk / Missing |
| N5 | Rail icon tooltip shows shortcut key | Hover any icon | Preserved / At Risk / Missing |
| N6 | All 10 tabs have keyboard shortcuts shown in tooltip or cheat sheet | Check shortcut table in design | Preserved / At Risk / Missing |

### 12.2 S-Series: Left Sidebar Panels (20 items)

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| S1 | Build tab: element categories visible in accordion | Look for CatAccordion sections | Preserved / At Risk / Missing |
| S2 | Build tab: favorites zone exists | Look for FavZone | Preserved / At Risk / Missing |
| S3 | Build tab: "My Components" zone exists | Look for MyComponents | Preserved / At Risk / Missing |
| S4 | Templates tab: template grid + preview modal | Both must exist | Preserved / At Risk / Missing |
| S5 | Templates tab: apply progress overlay | Look for ApplyProgressOverlay | Preserved / At Risk / Missing |
| S6 | Layers tab: element tree (not just flat list) | Verify hierarchy | Preserved / At Risk / Missing |
| S7 | Pages tab: SEO / Social / Advanced sub-tabs | Check PageSettingsDrawer | Preserved / At Risk / Missing |
| S8 | Components tab: library + detail screen | Both views must exist | Preserved / At Risk / Missing |
| S9 | Media tab: "My Files" AND "Stock Photos" sources | Both tabs must exist | Preserved / At Risk / Missing |
| S10 | Media tab: type filter pills (image/video/font) | Look for TypePills | Preserved / At Risk / Missing |
| S11 | Design tab: color + type + spacing token sections | All 3 sections must exist | Preserved / At Risk / Missing |
| S12 | Design tab: export dropdown (CSS/JSON/SCSS) | Export button must exist | Preserved / At Risk / Missing |
| S13 | Design tab: draft chip + review modal | Both must exist | Preserved / At Risk / Missing |
| S14 | Settings tab: 6 sub-screen cards on home | Count cards: Site/Domains/Analytics/Export/Integrations/Advanced | Preserved / At Risk / Missing |
| S15 | Settings tab: drill-in screens (all 6 accessible) | Test navigation to each | Preserved / At Risk / Missing |
| S16 | Publish tab: pre-publish checklist | 5 items must be visible | Preserved / At Risk / Missing |
| S17 | Publish tab: published URL + copy button | Look for UrlDisplay component | Preserved / At Risk / Missing |
| S18 | Publish tab: Unpublish button | Must exist when published | Preserved / At Risk / Missing |
| S19 | History tab: Named Versions + Activity views | ViewSwitcher must exist | Preserved / At Risk / Missing |
| S20 | History tab: Restore + Compare actions | Both must appear on hover | Preserved / At Risk / Missing |

### 12.3 C-Series: Canvas (12 items)

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| C1 | Canvas empty state exists (CanvasEmptyCTA) | See blank canvas screen | Preserved / At Risk / Missing |
| C2 | Element selected: resize handles (8 points) | Look for handle design | Preserved / At Risk / Missing |
| C3 | Element selected: floating toolbar | Look for toolbar above element | Preserved / At Risk / Missing |
| C4 | Multi-select: marquee rectangle | Look for dashed rectangle | Preserved / At Risk / Missing |
| C5 | Multi-select: MultiSelectToolbar | Look for align/distribute toolbar | Preserved / At Risk / Missing |
| C6 | Drop zone: valid + invalid states | Look for drop zone indicators | Preserved / At Risk / Missing |
| C7 | Snap lines: horizontal + vertical | Look for magenta (#FF00FF) lines | Preserved / At Risk / Missing |
| C8 | Canvas footer: 5 overlay toggles | Count toggles: Snap Guides, Spacing, Grid, Badges, X-Ray | Preserved / At Risk / Missing |
| C9 | Canvas footer: zoom controls | Look for − / % / + / Fit | Preserved / At Risk / Missing |
| C10 | X-Ray mode: canvas visual exists | Look for wireframe overlay | Preserved / At Risk / Missing |
| C11 | Context menu: "Select from stack" submenu | Verify submenu exists | Preserved / At Risk / Missing |
| C12 | Inline edit mode: text cursor visible | Look for text editing state | Preserved / At Risk / Missing |

### 12.4 I-Series: Inspector (14 items)

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| I1 | Inspector: 3 tabs (Layout / Style / Behavior [target: Effects]) | Count tabs | Preserved / At Risk / Missing |
| I2 | Layout tab: 7 sections (Position/Display/Size/Spacing/Flexbox/Grid/Variants) | Count sections | Preserved / At Risk / Missing |
| I3 | Style tab: 7 sections (Typography/Background/Border/CSS Classes/Link/Visibility/Data Attributes) | Count sections | Preserved / At Risk / Missing |
| I4 | Behavior tab (target: Effects): currently 4 sections (Effects, Animation, Interactions, Visibility); target: 6 sections | Count sections | Preserved / At Risk / Missing |
| I5 | Pseudo-state row: 4 states (hover/focus/active/disabled) | Count state buttons | Preserved / At Risk / Missing |
| I6 | Pseudo-state: override indicator dot | Look for dot on state buttons | Preserved / At Risk / Missing |
| I7 | Breakpoint indicator: shows current device | Look for pill in header | Preserved / At Risk / Missing |
| I8 | DevModeToggle: visible in inspector header | Not buried in controls | Preserved / At Risk / Missing |
| I9 | Inspector empty state: "Nothing Selected" + Open Build Panel / Browse Templates buttons | Look for InspectorEmptyState | Preserved / At Risk / Missing |
| I10 | Multi-select inspector: align/distribute controls | Look for MultiSelectToolbar | Preserved / At Risk / Missing |
| I11 | Element breadcrumb: shows hierarchy | Look for breadcrumb row | Preserved / At Risk / Missing |
| I12 | Search sections input: in header | Look for search input | Preserved / At Risk / Missing |
| I13 | Collapse All / Expand All: in header | Look for buttons | Preserved / At Risk / Missing |
| I14 | Delete with confirmation: confirm modal exists | Not instant delete | Preserved / At Risk / Missing |

---

## 13. Validation Checklist — Advanced Surfaces (Series M, A)

### 13.1 M-Series: Modals and Overlays (10 items)

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| M1 | Command Palette: search + grouped results + keyboard nav | Look for Ctrl+K modal | Preserved / At Risk / Missing |
| M2 | Keyboard Cheat Sheet: full shortcut reference | Look for ? modal | Preserved / At Risk / Missing |
| M3 | Templates modal: browse + preview + apply flow | Full modal designed | Preserved / At Risk / Missing |
| M4 | Export modal: HTML (live) + planned formats | Look for Ctrl+Shift+E modal | Preserved / At Risk / Missing |
| M5 | AI Copilot modal: full-page generation | Look for Copilot modal | Preserved / At Risk / Missing |
| M6 | AIAssistantBar: bottom slide-up panel | Look for Ctrl+J surface | Preserved / At Risk / Missing |
| M7 | Collection Setup: field definition UI | Look for CMS modal | Preserved / At Risk / Missing |
| M8 | Create Component modal: name input | Look for modal | Preserved / At Risk / Missing |
| M9 | UpgradeModal: unlock prompt | Look for modal | Preserved / At Risk / Missing |
| M10 | WelcomeModal: first visit | Look for welcome design | Preserved / At Risk / Missing |

### 13.2 A-Series: CMS, Collaboration, AI (8 items)

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| A1 | CMS binding UI: chain icon on inspector properties | Visible in inspector design | Preserved / At Risk / Missing |
| A2 | CMS preview: record cycling (1/N) indicator | Visible on canvas | Preserved / At Risk / Missing |
| A3 | Collaboration: presence avatars in top bar | Look for avatars | Preserved / At Risk / Missing |
| A4 | Collaboration: live cursors on canvas | Look for cursor design | Preserved / At Risk / Missing |
| A5 | Collaboration: connection quality indicator | Look for dot/indicator | Preserved / At Risk / Missing |
| A6 | AI: AIAssistantBar accessible from top bar | AI button visible | Preserved / At Risk / Missing |
| A7 | AI: Copilot accessible from overflow menu | In `···` menu | Preserved / At Risk / Missing |
| A8 | AI: AI Suggestions in Behavior tab (target: Effects) | Section visible in inspector | Preserved / At Risk / Missing |

---

## 14. Validation Checklist — States, Flows, Edge Cases (Series O)

### 14.1 O-Series: Onboarding (4 items)

| # | Feature | Check | Status Options |
|---|---------|-------|---------------|
| O1 | WelcomeModal designed | Visible in first-visit screen | Preserved / At Risk / Missing |
| O2 | OnboardingChecklist: 7-step floating panel (name-project, pick-start, add-element, edit-text, change-style, preview, publish) | Designed | Preserved / At Risk / Missing |
| O3 | SpotlightOverlay with "Explore freely →" escape | Escape link visible | Preserved / At Risk / Missing |
| O4 | AchievementPrompt: step completion screen | Designed | Preserved / At Risk / Missing |

### 14.2 Exact Interaction / State Requirements

Every surface must have these states designed:

| Surface | Required States |
|---------|----------------|
| Rail icon | default / hover (tooltip) / active (panel open) |
| Panel | closed / open-unpinned / open-pinned / expanded |
| Canvas element | default / hover / selected / multi-selected / inline-edit / being-dragged |
| Drop zone | idle / valid-drop-target / invalid-drop-target / over-slot |
| Inspector tab | default / active / hover |
| Inspector section | collapsed / expanded / hover on header |
| Inspector property | default / overridden (dot indicator) / focused / disabled |
| Pseudo-state button | default / has-override (dot) / active-editing |
| Button | default / hover / active / disabled / loading |
| Input | default / focused / error / disabled / with-value |
| Toast | info / success / warning / error / dismissing |
| Modal | entering / visible / exiting |
| Drag ghost | visible while dragging element from sidebar |
| Snap line | appears when element snaps to another element |

### 14.3 Fallback Behavior (10 items)

| # | Trigger | Fallback behavior | User-facing UI |
|---|---------|-------------------|---------------|
| FB-1 | Collaboration: connection lost | Editor continues offline. Local changes queued. OT syncs on reconnect. | ConnectionQualityIndicator → gray "Offline" dot. Badge: "Offline — changes saved locally, will sync on reconnect". No editing interruption. |
| FB-2 | Auto-save: storage write fails | Retries on next timer (5000ms). After 3 consecutive failures → warning. | Toast (warning): "Auto-save is having trouble. Your changes are in memory but not yet saved. Try Ctrl+S." Save status: amber dot. |
| FB-3 | Manual save: API fails | Transitions to SV4 (error state). Retry available. | Toast (error): "Could not save — check your connection and try again" with [Retry] button. Save indicator: red "Save failed". |
| FB-4 | AI service unavailable (503) | All AI surfaces switch to "unavailable" state. Non-AI features unaffected. | AIAssistantBar: input disabled, message "AI temporarily unavailable". Inspector AI Suggestions: "Suggestions unavailable" + [Retry]. Copilot modal: disabled with message. |
| FB-5 | Export: React/Vue/Next.js (planned) | Format card shown with "Coming Soon" badge. Email capture instead of download. | [Notify me →] ghost button → email input inline (§16.1). |
| FB-6 | Settings: Domains (planned) | Sub-screen shows "Coming Soon" state. | LockedScreen: feature description + illustration + [Notify me] email capture + ETA if available (§9.11). |
| FB-7 | Settings: Analytics (planned) | Same as FB-6. | Same LockedScreen pattern. |
| FB-8 | Image upload: file too large | Upload rejected with error message. | Toast (error): "Image exceeds 10 MB limit. Resize or compress before uploading." Upload card shows error state. |
| FB-9 | Image upload: unsupported format | Upload rejected with format guidance. | Toast (error): "Unsupported format. Use JPEG, PNG, SVG, GIF, WebP, or AVIF." |
| FB-10 | Browser: clipboard API unavailable | Copy/paste falls back to Ctrl+C/V with `document.execCommand`. | No visible UI change. Clipboard operations still work. |

---

## 15. Anti-Regression / Final QA Rules

**Source:** §30 (lines 4274–4305)

25 anti-regression items. Each is a specific failure mode that must be verified before shipping any implementation.

| # | Risk | What could go wrong | Verification method | Pass criteria | PRD reference |
|---|------|--------------------|--------------------|--------------|--------------|
| AR1 | Inspector sections removed for visual simplicity | Designer/developer reduces sections to "simplify" | Count sections per tab in rendered UI | Current code: Layout≈6, Style(Appearance)=3, Behavior=4. Target: Layout=7, Style=7+1, Effects=6. Total target ≥ 20. | §11.3 |
| AR2 | Pseudo-state selector removed | Pseudo-state row dropped from inspector header | Verify ROW 6 exists with 5 buttons | Default + Hover + Focus + Active + Disabled all present and functional | §11.2 ROW 6, §11.4 |
| AR3 | Components tab not in rail | Rail still has 8 icons instead of 10 | Count rail icons | TOP zone: 6 icons (Add, Media, Layers, Templates, Pages, Components). BOTTOM: 4 (Design, Settings, Publish, History) | §8.1 |
| AR4 | Publish tab not in rail | Publish only accessible via shortcut U, not visual | Verify BOTTOM zone has Publish icon between Settings and History | Lucide `upload-cloud` icon present and functional | §8.1 |
| AR5 | CMS UI not designed/implemented | CMS surfaces missing entirely | Verify: (1) CMS List in Build tab catalog, (2) Collection Setup modal, (3) Chain icon in inspector, (4) Binding dropdown | All 4 CMS entry points functional | §12 |
| AR6 | AI surfaces reduced to single button | Only AI button in top bar, no AIAssistantBar or Copilot | Verify: (1) Ctrl+J opens AIAssistantBar, (2) Copilot in overflow menu, (3) AI Suggestions in inspector Behavior tab (target: Effects) | All 3 AI surfaces render and function | §14 |
| AR7 | Keyboard shortcuts changed or removed | Shortcuts conflict with new UI, or are silently dropped | Run automated shortcut test: fire each shortcut, verify expected action | All 30+ shortcuts from §5B table produce correct action | §5B, §17.2 |
| AR8 | Multi-select inspector not implemented | Inspector shows nothing or single-element view for multi-select | Shift+click 2 elements → verify inspector shows MultiSelectToolbar | Align (6 buttons) + Distribute (2) + Size (2) + Actions (3) visible | §11.6 |
| AR9 | Canvas overlays reduced | Footer toolbar has fewer than 5 overlay toggles | Count toggles in canvas footer toolbar | Snap Guides, Spacing, Grid, Badges, X-Ray all present + functional (5 toggles; no Rulers toggle in current code) | §10.7 |
| AR10 | History reduced to undo stack only | Named versions, restore, and compare flows removed | Verify: (1) "Save current version" button, (2) Restore flow with confirm, (3) Compare split-view | All 3 capabilities functional | §15 |
| AR11 | Export simplified to HTML only | Coming-soon formats dropped from modal | Verify export modal shows all 5 formats (HTML+CSS, React, Vue, Next.js, ZIP) | HTML+CSS downloadable. Others show "Coming Soon" + "Notify me" | §16.1 |
| AR12 | Settings sub-screens collapsed | Settings home screen shows fewer than 6 cards | Count settings cards on home screen | Site, Domains, Analytics, Export, Integrations, Advanced — all 6 accessible | §9.11 |
| AR13 | Onboarding flow removed | No WelcomeModal on first visit, no checklist | Verify first-visit experience: (1) WelcomeModal appears, (2) OnboardingChecklist appears, (3) SpotlightOverlay has escape link, (4) AchievementPrompt on step completion | All 4 onboarding components present | §5G, §18.1 |
| AR14 | Context menu "Select from stack" removed | Right-click menu missing stack submenu | Right-click on overlapping elements → verify "Select from stack" submenu appears with correct elements | Submenu lists all elements at click point in z-order | §10.8, §21.3 |
| AR15 | Design token export removed | Export dropdown in Design tab missing or reduced | Verify Design tab → export button → dropdown | CSS Variables, JSON, SCSS/Tailwind formats available | §9.10 |
| AR16 | Inspector DevModeToggle buried or removed | DevModeToggle not in inspector header (ROW 1) | Verify `</>` toggle in ROW 1 of inspector header | Toggle visible without scrolling, toggles CS-12 | §11.2 ROW 1 |
| AR17 | Breakpoint-aware editing indicators missing | No blue dots on overridden properties at non-desktop breakpoints | Switch to Tablet → override a property → verify blue dot | `5px` blue dot appears. Hover shows desktop value tooltip. | §11.5 |
| AR18 | Canvas empty state missing | Blank project shows empty white canvas with no guidance | Create new blank project → verify CanvasEmptyCTA appears | CTA card centered with "Browse Templates" + "Start Blank" buttons | §10.2, §26.1 |
| AR19 | Snap lines not implemented | Dragging elements shows no alignment guides | Drag element near another → verify snap lines appear | Magenta (#FF00FF) horizontal/vertical lines at 6px threshold with distance labels | §10.5 |
| AR20 | Floating element toolbar missing | Selected element has no toolbar above it | Click element → verify floating toolbar appears above | 7 buttons (parent, duplicate, move up/down, copy, wrap, delete) visible | §10.3 |
| AR21 | Confirm dialog missing on destructive actions | Delete executes immediately without confirmation | Click delete in inspector header → verify ConfirmDialog | Dialog with consequence text + [Delete] destructive + [Keep] ghost | §25.1 Principle 3 |
| AR22 | Command palette keyboard navigation broken | Arrow keys/Enter don't work in command palette | Open Ctrl+K → type query → navigate with arrows → Enter | Arrow Down/Up moves focus, Enter executes, Escape closes | §17.1 |
| AR23 | Collaboration cursors not rendering | Collaborator cursors not visible despite connection | Connect 2 users → verify cursor and name label visible | SVG arrow in user color + name badge. Fades after 3s idle. | §13.2 |
| AR24 | Toast notifications not appearing | Actions complete silently with no feedback | Perform save/publish/delete → verify toast appears | Toast appears bottom-center with correct variant + duration | §25.1 Principle 4-5 |
| AR25 | Accessibility focus ring removed | Focus indicator not visible on keyboard navigation | Tab through all UI zones → verify focus ring visible | `2px solid #6366f1, offset 2px` on every focusable element | §20.1 A10 |

---

## 16. Readiness Criteria

**Source:** §28 (lines 4201–4221), Output E §E.8 (lines 4869–4876)

### 16.1 Success Metrics (16 targets)

| # | Category | Metric | Target | Measurement Method |
|---|----------|--------|--------|--------------------|
| M1 | Onboarding | Time to first publish (new user) | < 10 min | Analytics: timestamp(first-visit) → timestamp(first-publish) |
| M2 | Discoverability | Features discoverable without docs | > 80% of features | User testing: 10 tasks, unassisted completion rate |
| M3 | Navigation | Rail click to open any panel | ≤ 1 click | Automated: count clicks from idle to any panel open |
| M4 | Inspector | All inspector sections accessible | 20/20 sections across 3 tabs | Automated: count rendered sections per tab |
| M5 | Keyboard | Keyboard shortcuts preserved and functional | 30+/30+ | Automated: shortcut integration test suite |
| M6 | Accessibility | WCAG 2.1 AA compliance | 100% of criteria in §20.1 | Automated: axe-core scan + manual screen reader test |
| M7 | Reliability | Error recovery: retry after failure | 100% of error states have retry | Manual: trigger each error state, verify retry path |
| M8 | Performance | Canvas interaction latency | < 16ms (60fps) | Performance profiling: frame time during interactions |
| M9 | Performance | Panel open time | < 150ms | Profiling: timestamp(click) → timestamp(panel visible) |
| M10 | Performance | Inspector re-render on selection change | < 50ms | React DevTools: render time on selection change |
| M11 | Collaboration | Cursor sync latency | < 100ms | Network: round-trip time for cursor position broadcast |
| M12 | Save | Auto-save success rate | > 99.5% | Analytics: count failures / total attempts |
| M13 | CMS | CMS binding setup time | < 3 min | User testing: time from "drag CMS List" to "first bound field" |
| M14 | AI | AI suggestion acceptance rate | > 30% | Analytics: "Apply" clicks / total suggestions shown |
| M15 | Export | Export download success rate | > 99% | Analytics: successful downloads / export button clicks |
| M16 | Satisfaction | User-reported ease of use (1-5) | ≥ 4.0 | In-app survey after first publish |

### 16.2 Design Readiness Gate

A design is "ready for engineering" when:

1. All 41 surfaces from Section 9 have been designed.
2. The validation checklist (Section 11–14, 56 items) scores PASS or CONDITIONAL PASS.
3. All 25 anti-regression items (Section 15) have been verified.
4. All 15 fully supported features (Section 5.1) have visible, accessible entry points.
5. No AT RISK items remain unresolved (except intentional non-goals per §29.3).

---

## 17. Go/No-Go Decision Rules

**Source:** Output E §E.8 (lines 4869–4876)

### 17.1 Grading Scale

| Grade | Criteria |
|-------|---------|
| **PASS** | All N-series (navigation), I-series (inspector), and C-series (canvas) items Preserved |
| **CONDITIONAL PASS** | ≤ 3 items "At Risk" — must be corrected before implementation |
| **FAIL** | Any item "Missing" in N/I series, or ≥ 4 items "At Risk" overall |

### 17.2 Decision Rules

- **PASS** → Engineering may begin immediately. Design is complete and safe.
- **CONDITIONAL PASS** → Engineering may begin on non-affected areas. At Risk items must be resolved within one design iteration before affected areas are implemented.
- **FAIL** → Engineering must NOT begin. Stitch design output must be revised. A FAIL grade means the design would cause regression.

### 17.3 Escalation

If a Stitch output receives FAIL:
1. Identify all Missing and At Risk items.
2. Cross-reference with anti-regression risks (Section 4.3) to determine severity.
3. If any CRITICAL risk (R1, R3, R4) is triggered → design must be fully revised, not patched.
4. If only MEDIUM/LOW risks are triggered → targeted revision of specific surfaces is acceptable.

**A Stitch design output that gets a FAIL grade must be revised before any engineering work begins.**

---

## 18. Plain-English Summary

This document is the final validation gate for the Buildrik/Aquibra Studio redesign. In plain language:

**The editor currently has 29 engine managers, 10 sidebar tabs, 3 inspector tabs with 20+ sections, 30+ keyboard shortcuts, CMS bindings, AI features, collaboration, version history, and export capabilities. All of these must survive the redesign.**

The PRD addresses 77 capabilities from the audit. Coverage is 99% after reconciliation (only Plugin UI is an intentional non-goal). The 2 original AT RISK items (X-Ray visual, Plugin UI) have been resolved — X-Ray now has a full visual spec, Plugin UI is explicitly documented as future scope.

**For Stitch:** Design all 41 surfaces listed. Follow the 15 DO NOT rules. Solve the 10 UX problems. Do not invent new features. Do not remove existing ones.

**For validation:** Run the 56-point checklist (7 series: N, S, C, I, M, A, O). Score it. PASS means go. CONDITIONAL PASS means fix At Risk items first. FAIL means redesign.

**For engineering:** Do not start building until the design passes. Verify all 25 anti-regression items. Hit the 16 success metric targets. The anti-downgrade principle is absolute: current capability is the floor, not the ceiling.

---

## Source Notes

All content in this document was extracted from `prd_final.md` with the following source mapping:

| Section | Source |
|---------|--------|
| §1 Purpose | Synthesized from PRD Rule (line 4), Output A preamble, Output C/D/E preambles |
| §2 Whole-Editor Coverage Check | Output C (lines 4364–4478) — verbatim table content |
| §3 Completeness Review Rules | Synthesized from Output A completeness gaps, Output C coverage methodology, §11.3 section counts |
| §4 Anti-Downgrade Validation | PRD Rule (line 4), Output A §A.6 (lines 133–152), Output D §D.10 (lines 4722–4750) |
| §5 What Must Be Preserved | Output A §A.2 (lines 61–74), Output D §D.3 (lines 4512–4548), §29.1 (lines 4226–4244) |
| §6 What Must Not Be Weakened | Output D §D.10 (lines 4722–4750) |
| §7 Stitch Handoff Brief | Output D §D.1–D.6 (lines 4483–4621) |
| §8 Stitch Guardrails | Output D §D.9 (lines 4704–4718), §D.10 (lines 4722–4750) |
| §9 What Stitch May Design | Output D §D.7 (lines 4624–4680) — verbatim surface list |
| §10 What Stitch Must Not Invent | Output D §D.1 (line 4485), §D.10, §29.3 (lines 4261–4270) |
| §11–14 Validation Checklists | Output E (lines 4754–4878) — verbatim checklist content |
| §14.2 Interaction States | Output D §D.8 (lines 4683–4701) |
| §14.3 Fallback Behavior | §29.2 (lines 4246–4260) |
| §15 Anti-Regression Rules | §30 (lines 4274–4305) — verbatim table content |
| §16 Readiness Criteria | §28 (lines 4201–4221), Output E §E.8 |
| §17 Go/No-Go Decision Rules | Output E §E.8 (lines 4869–4876) |
| §18 Plain-English Summary | Synthesized from all Outputs and B.1 reconciliation notes |

### B.1 Reconciliation References

The B.1 reconciliation notes (lines 4308–4360) confirmed:
- All 77 coverage items in Output C remain accurate after B expansion.
- No contradictions between B and D (Stitch handoff brief).
- X-Ray mode (C10) upgraded from AT RISK to Preserved after §10.1 CS-11 expansion.
- Coverage grade upgradeable from 97% to 99% (only Plugin UI remains as non-goal).
- Inspector pseudo-state count: 4 pseudo-states + Default (labeled "Default" in code, not "Normal") = 5 buttons in ROW 6 — not a contradiction.
- Canvas states (17) vs footer toggles (5) are consistent — 5 are toggleable overlays (Snap Guides, Spacing, Grid, Badges, X-Ray), others are interaction states.

---

## Unclear / Ambiguities

1. **Plugin UI scope (NS-4):** The PRD marks Plugin UI as future/non-goal, but `PluginManager` exists in the engine. If users discover plugin capabilities through the engine API, there is no UI to support them. The PRD does not specify what happens if a user tries to use plugin features programmatically.

2. **Onboarding step count — RESOLVED:** Code (`src/shared/constants/onboardingSteps.ts`) defines exactly 7 steps: name-project, pick-start, add-element, edit-text, change-style, preview, publish. Updated SUP-13 and O2 to match.

3. **Coverage grade precision:** Output C says 97% (2 items AT RISK). B.1 reconciliation says upgradeable to 99%. The exact methodology for calculating the percentage from 77 items is not specified — 75/77 = 97.4%, 76/77 = 98.7%. The "99%" figure appears to be rounded.

4. **Multi-page preview (NS-5):** Marked as non-goal, but the Preview button (Ctrl+P) exists. If a user has 10 pages, the PRD says "Preview opens current page only" — but there is no spec for how the user switches pages within preview mode or returns to the editor.

5. **Inspector width at non-desktop breakpoints:** The PRD specifies inspector behavior when the user switches canvas breakpoints, but does not specify whether the inspector panel itself changes width or layout on smaller editor viewports (not canvas viewports). §29.3 NS-1 says editor minimum width is 1280px, but what happens at exactly 1280px vs 1440px for inspector width is unspecified.

6. **Overlay toggle count — RESOLVED:** Code (`CanvasFooterToolbar.tsx`) has exactly 5 overlay toggles: Snap Guides, Spacing, Grid, Badges, X-Ray. No Rulers toggle exists. Snap lines are automatic during drag (magenta #FF00FF), not a toggle. Updated C8, AR9, SUP-11 to match.

7. **Media tab source naming:** Output E S9 says "My Files" AND "Stock Photos" but the actual codebase (MediaTab.tsx) uses "My Library" and "Discovery". The PRD and the checklist use different terminology than the implemented code.

# Buildrik UX Fixes — Design Document

**Date:** 2026-03-08
**Source:** ux-audit-20260308.md (Sections E + H)

---

## Goal

Implement all 31 UX + code quality fixes identified in the March 2026 full left-panel audit. Fixes span the left rail, all 8 sidebar tabs, shared components, and module structure.

## Architecture

Three-phase phased plan with dependency gates between phases. Each task is one parallel Claude Code session. Phase 1 (Quick Wins) must be complete before Phase 2 (Medium Effort). Phase 2 complete before Phase 3 (Refactors). All Phase 1 tasks have [VERIFIED] prompts from the audit. Phase 2 has 2 verified + 9 manual investigation tasks. Phase 3 tasks all begin with file-reading steps before any code change.

## Tech Stack

React 18, TypeScript 5.3, Vite 7.2, Emotion CSS-in-JS. Verify with `npx tsc --noEmit`. Dev server on port 5050 via `npm run dev`.

---

## Document Structure

```
Phase 1 — Quick Wins (13 tasks: QW-1 through QW-13)
  All [VERIFIED]. 1–2 file changes each. Run in any order within phase.

Phase 2 — Medium Effort (11 tasks: ME-1 through ME-11)
  ME-1, ME-2: verified prompts, direct implementation.
  ME-3 through ME-11: investigation step first, then implementation.
  ME-1 depends on QW-9 being complete.

Phase 3 — Refactors (7 tasks: RF-1 through RF-7)
  All start with file-read steps. RF-5 and RF-6 depend on RF-1.
  RF-6 (tab consolidation) is a product-visible IA change — implement as specified.
```

---

## Task Anatomy

### Phase 1 format (verified, 1–2 files)
```
### Task QW-N: [Title]
Audit ref: [Issue ID] / Section E Prompt #N

Files:
- Modify: path/to/file.ts:line-range

Step 1: Make the change [exact code]
Step 2: npx tsc --noEmit → Expected: 0 new errors
Step 3: Verify [what to check in browser/output]
Step 4: Commit
  git add [specific files]
  git commit -m "[conventional commit message]"
```

### Phase 2 format — verified (ME-1, ME-2)
Same as Phase 1 with multi-file code blocks.

### Phase 2 format — manual (ME-3 through ME-11)
```
### Task ME-N: [Title]
Audit ref: [Issue ID] — manual investigation required

Step 1: Read file [exact grep/read command to find the target]
Step 2: Find the line(s) [what to look for]
Step 3: Implement fix [described based on audit finding]
Step 4: npx tsc --noEmit
Step 5: Commit
```

### Phase 3 format (unverified, structural)
```
### Task RF-N: [Title]
Audit ref: [Issue ID]

Step 1: Read [list of files to read first]
Step 2: Read [pattern reference file]
Step 3: Implement [each extracted piece as a sub-step]
Step 4: npx tsc --noEmit
Step 5: Commit each logical unit separately
```

---

## Dependency Map

```
PHASE 1 (no inter-task dependencies):
QW-1 → QW-2 → QW-3 → QW-4 → QW-5 → QW-6 → QW-7
QW-8 → QW-9 → QW-10 → QW-11 → QW-12 → QW-13

PHASE 2:
ME-1 ← DEPENDS ON: QW-9 (PublishTab props wired first)
ME-2 through ME-11 ← no cross-dependencies

PHASE 3:
RF-1 (TemplatesTab decompose) ← do first
RF-2, RF-3, RF-4 ← no dependencies on each other
RF-5 ← DEPENDS ON: RF-1
RF-6 ← DEPENDS ON: RF-1
RF-7 ← no dependencies
```

---

## Phase 1 Task List

| Task | Issue | Files | Audit Prompt |
|------|-------|-------|-------------|
| QW-1 | Rail "Config" → "Settings" | tabsConfig.ts | #1 |
| QW-2 | Add Publish to rail + SvgRocket | tabsConfig.ts, LeftRail.tsx | #2 |
| QW-3 | Wire onTemplateUsed in TabRouter | TabRouter.tsx | #3 |
| QW-4 | Wire onRequestTemplates to PagesTab | TabRouter.tsx, LeftSidebar.tsx | #4 |
| QW-5 | Media Discovery dead link → Unsplash | OnboardingEmptyState.tsx, MediaTab.tsx | #5 |
| QW-6 | TypePills reset on media source switch | MediaTab.tsx | #6 |
| QW-7 | TemplatesTab uses shared PanelHeader | TemplatesTab.tsx, TabRouter.tsx | #7 |
| QW-8 | History clear confirm → ConfirmDialog | HistoryTab.tsx | #8 |
| QW-9 | PublishTab props wired through TabRouter | TabRouter.tsx, LeftSidebar.tsx | #9 |
| QW-10 | Remove dead showIconRail prop | LeftSidebar.tsx | #10 |
| QW-11 | Gate component creation behind hasApi | LeftSidebar.tsx, MyComponents.tsx | #12 |
| QW-12 | Fix SSOT iconName: SvgGlobe → SvgPalette | tabsConfig.ts, LeftRail.tsx | #13/#14 |
| QW-13 | Remove dead onOpenTemplates + onExportForDeploy | LeftSidebar.tsx | #15 |

---

## Phase 2 Task List

| Task | Issue | Verified? | Notes |
|------|-------|-----------|-------|
| ME-1 | PublishTab checklist uses real computed data | [VERIFIED] → #11 | Depends on QW-9 |
| ME-2 | usePanelNavigation scoped to project | [VERIFIED] → #13 | — |
| ME-3 | FavZone hidden during search | Manual | FLOW-01 |
| ME-4 | Template click behavior unified | Manual | FLOW-07 |
| ME-5 | Page settings auto-save on blur | Manual | FLOW-10 |
| ME-6 | Drag handle placeholder resolved | Manual | FLOW-11 |
| ME-7 | Settings dirty-state guard on tab switch | Manual | FLOW-20 |
| ME-8 | Publish disabled state explained | Manual | FLOW-22 |
| ME-9 | Rail keyboard roving tabindex | Manual | B-09 |
| ME-10 | Rename tabs/components/ → component-library/ | Manual | STRUCT-03 |
| ME-11 | Rename pages/settings/ → page-settings/ | Manual | STRUCT-06 |

---

## Phase 3 Task List

| Task | Issue | Depends On |
|------|-------|-----------|
| RF-1 | TemplatesTab.tsx → hooks/ + components/ | — |
| RF-2 | Tab entry-point convention normalized | — |
| RF-3 | design/ module → components/ hooks/ utils/ | — |
| RF-4 | Dual style files eliminated | — |
| RF-5 | Replace composer as UI event bus | RF-1 |
| RF-6 | Full tab consolidation per Section C | RF-1 |
| RF-7 | Dead styles.ts files removed | — |

---

## Commit Strategy

Each task = one commit. Prefix conventions:
- `fix(rail):` — rail/tab config changes
- `fix(sidebar):` — tab component fixes
- `fix(media):` — media tab fixes
- `refactor(templates):` — RF-1 decomposition
- `refactor(structure):` — folder/module moves
- `chore:` — dead code removal

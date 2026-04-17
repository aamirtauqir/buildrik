# History Tab 10x — Implementation Plan

Generated: 2026-04-17
Status: READY FOR IMPLEMENTATION
Based on: CEO Plan + Design Spec + Engineering Review

---

## Implementation Phases

### Phase 1: Core Engine (Week 1)
- [ ] **1.1** Add `compareVersions()` to `VersionHistoryManager`
- [ ] **1.2** Implement async chunked snapshot capture (`requestIdleCallback`)
- [ ] **1.3** Add `ChangeType` classification to `historyTypes.ts`
- [ ] **1.4** Implement semantic diff computation

### Phase 2: Custom Hooks (Week 1-2)
- [ ] **2.1** Create `shared/hooks/useHistoryState.ts`
- [ ] **2.2** Create `shared/hooks/useVersionHistory.ts`
- [ ] **2.3** Create `shared/hooks/useSemanticDiff.ts`
- [ ] **2.4** Refactor components to use hooks

### Phase 3: UI Components (Week 2)
- [ ] **3.1** Keyboard navigation (j/k/g/G)
- [ ] **3.2** Activity grouping ("12 style changes")
- [ ] **3.3** Accordion expand with "Show all N"
- [ ] **3.4** react-window virtualization

### Phase 4: Visual Features (Week 2-3)
- [ ] **4.1** Visual snapshot capture on save
- [ ] **4.2** SnapshotPreview hover tooltip
- [ ] **4.3** Time-Travel Scrubber drawer
- [ ] **4.4** AI Summary integration (API endpoint)

### Phase 5: Polish (Week 3)
- [ ] **5.1** Team attribution (userId on entries)
- [ ] **5.2** Auto-milestone suggestions
- [ ] **5.3** Performance optimization
- [ ] **5.4** Accessibility audit

---

## File Ownership

| File | Owner | Status |
|------|-------|--------|
| `engine/VersionHistoryManager.ts` | Engine | needs_compareVersions |
| `engine/HistoryManager.ts` | Engine | needs_async_snapshot |
| `engine/historyTypes.ts` | Engine | needs_ChangeType |
| `shared/types/versions.ts` | Shared | needs_CompareResult |
| `shared/hooks/useHistoryState.ts` | Frontend | NEW |
| `shared/hooks/useVersionHistory.ts` | Frontend | NEW |
| `shared/hooks/useSemanticDiff.ts` | Frontend | NEW |
| `editor/sidebar/tabs/history/HistoryTab.tsx` | Frontend | refactor_hooks |
| `editor/sidebar/tabs/history/components/ActivityView.tsx` | Frontend | refactor_hooks |
| `editor/panels/VersionHistoryPanel.tsx` | Frontend | refactor_hooks |
| `editor/sidebar/tabs/history/components/TimeTravelScrubber.tsx` | Frontend | NEW |
| `editor/sidebar/tabs/history/components/SnapshotPreview.tsx` | Frontend | NEW |

---

## Dependencies

```
react-window: ^1.8.10
```

---

## API Endpoints Needed

```
POST /api/ai/summarize — AI change summaries
POST /api/ai/milestone-suggest — Auto milestone suggestions
```

---

## Key Technical Decisions

1. **Snapshot capture:** `requestIdleCallback` with 2s timeout fallback
2. **Compare algorithm:** Group changes by element, classify by ChangeType
3. **Hooks pattern:** Subscribe to engine events, expose React state
4. **Time-travel:** Read-only preview with temp Composer instance

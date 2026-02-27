# Phase 1 Runtime Verification — new-editor-l2

## Smoke

- [ ] Boot no console errors
- [ ] migrateStorageKeys() ran
- [ ] Composer initialized before first render
- [ ] 9 rail tabs render
- [ ] 7 tab shortcuts work (A,Z,P,C,M,D,S)
- [ ] Element select updates ProInspector
- [ ] Element move updates Canvas + Inspector
- [ ] Padding edit updates canvas iframe
- [ ] Cmd+Z updates Canvas + Inspector
- [ ] Drag block creates element
- [ ] Apply template from BuildTab works

## Listener Baseline/Delta

- [ ] Baseline captured
- [ ] Route away/back = same counts
- [ ] Switch all tabs x10 = same counts

## Hook Null Guard

- [ ] Slow init simulated
- [ ] Canvas hooks don’t throw on null composer
- [ ] useCanvasSync ok
- [ ] useCanvasDragDrop ok
- [ ] useCanvasKeyboard ok

## Store Sync

- [ ] element:created → ProInspector auto-select
- [ ] page:deleted → PagesTab updates
- [ ] history:undo → Canvas + Inspector both revert

## Alignment Methods

- [ ] alignLeft() console test executed
- [ ] Result logged (works / no-op / throws)

## Notes

- Findings:
- Console errors:
- Suspected leaks:

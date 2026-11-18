# Canvas verification — 2026-10-19

Scope: P05 §5.1 / T2-32 / T5-21, on the current local checkout. **Four focused acceptance failures reproduced; no application fixes.** This is evidence for the existing specification, not a replacement design or approval of the panel.

## Results

| Check | Actual result | Evidence level |
|---|---|---|
| Existing guide, ruler and snap tests | 18/18 passed across four files | Existing Vitest tests; limited assertions, not whole-editor acceptance |
| Custom grid input `1.5`, Enter | **FAIL:** change callback receives `15` | Actual CanvasFooterToolbar rendered in jsdom; input/change/Enter events |
| Resize with configured grid `7`, snap on | **FAIL:** resize state uses `10` | Actual ResizeHandler; fake Composer and measured-element fixture; not a browser pointer drag |
| Double-click a locked guide | **FAIL:** saved guide array becomes empty after 300ms | Actual GuidesOverlay + useCanvasGuides integration; fake project-settings adapter |
| Unmount 100ms after adding guide at 73px | **FAIL:** after another 1000ms, project settings still have no guide | Actual hook lifecycle and fake timers; specific navigation routes/server loss not established |
| Drag locked guide | PASS: drag callback not called | Actual overlay in jsdom |
| Hide/show rulers while guide write is pending | PASS: hidden list empty, settings retain 81px guide after delay, showing restores it | Actual hook in jsdom |

Focused acceptance suite: **6 tests, 2 passed, 4 failed**, exit 1. These assertions encode required behavior and deliberately remain failing against the unchanged implementation. No test infrastructure failures were reported in the final focused run. The audit-specific config replaces the default include list; it does not add these expected failures to the normal application test suite.

## Browser evidence and limits

Standalone Vite demo at `http://127.0.0.1:5050/demo/index.html`, disposable untitled project, no site ID, actual viewport **1280×720**. View → Grid → Show grid, then custom `7` + Enter succeeded. Composer readback was `{grid:7,snap:true}`. A disposable Container was inserted through the Add UI.

Repeated browse daemon health timeouts prevented reliable follow-up readback for the live resize probe and decimal case. Click/fill/Enter for the decimal attempt returned success, but the result was **not** read back; the decimal failure above is established by the component test only. Do not count the incomplete live resize probe as a result. The browser's tabs/cookies were not reset. No screenshot/geometry pass is claimed.

There is no running dashboard backend in this fixture. A project-settings write in a fake adapter is **not** a server save receipt, reload proof or cross-device persistence. Save/reopen, real page-route interruption, concurrent collaboration, undo, permission checks and complete keyboard/non-drag flows remain **NOT VERIFIED**. The proposed guide-management popover is a design contract, not implemented UI validated here.

## Reproduce

Run from `packages/editor`:

```sh
npx vitest run src/editor/canvas/hooks/__tests__/useCanvasGuides.test.ts src/editor/canvas/overlays/__tests__/RulersOverlay.test.tsx src/engine/canvas/__tests__/ResizeHandler.snap.test.ts src/engine/canvas/resize/__tests__/SnapManager.test.ts
npx vitest run --config docs/audit-and-design-2026-10-16/evidence/canvas-verification-2026-10-19/verification.config.ts
```

Raw results: [baseline-results.json](baseline-results.json), [acceptance-results.json](acceptance-results.json). Focused fixtures: [acceptance.test.tsx](acceptance.test.tsx). Source files were not modified.

## Design quality and disposition

- **Geometry:** not measured; no new visual acceptance.
- **Grouping/hierarchy:** no new composition or review; prior written proposal remains the authority.
- **Labels/status:** input `1.5` silently becoming `15` fails value clarity; other label/status acceptance remains open.
- **Interaction/accessibility:** four bounded failures above; lock-drag and hide/show pass; no keyboard, assistive-technology or full-browser pass.

Engineering follow-up priority: retain pending guide edits before lifecycle disposal; enforce guide lock consistently; use the configured size in resize; reject invalid grid drafts without reinterpretation. All need subsequent implementation authorization, fixes and reruns. This verification does not close B3.4 or certify P05.

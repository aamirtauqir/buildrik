# baseline inventory.json schema (SSOT — Figma is a render target)
Row: { id: "BL-####", kind: route|component|overlay|engine-element|email|state,
  route, sourceFile, line, statusClass: 1-13, flow, fixtureID,
  figmaFileKey, figmaPageId, figmaNodeId, state, viewport,
  contentHash, screenshotHash,
  pipelineState: planned|written|readback-verified|diffed|done|blocked,
  blockReason, notes }
Meta: { pinnedCommit, figmaFiles: {index, active, broken, museum, shared, qa},
  viewports, seedFixture, envManifestRef }
Advance rule: row moves forward only on evidence (read-back / numeric diff).
Rerun rule: anything short of readback-verified is deleted and rebuilt.

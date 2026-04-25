/**
 * @license BSD-3-Clause
 * Unit tests for the green-panel allowlist verifier.
 * Tests the exported `verifyGreenPanels` function directly against a temp workspace.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { verifyGreenPanels } from "../verify-green-panels.mjs";

function makeWorkspace() {
  const root = mkdtempSync(join(tmpdir(), "green-panels-test-"));
  mkdirSync(join(root, "scripts"));
  return root;
}

function writeAllowlist(root, contents) {
  writeFileSync(join(root, "scripts/.ds-green-panels.json"), contents);
}

let passed = 0;
let failed = 0;

function assert(name, cond, detail) {
  if (cond) { passed += 1; }
  else { failed += 1; console.error(`FAIL ${name}: ${detail ?? ""}`); }
}

// Case 1: empty allowlist = ok
{
  const root = makeWorkspace();
  writeAllowlist(root, JSON.stringify({ files: [] }));
  const result = verifyGreenPanels(root);
  assert("empty allowlist returns ok", result.ok === true, JSON.stringify(result));
  rmSync(root, { recursive: true });
}

// Case 2: allowlist references a missing file = not ok
{
  const root = makeWorkspace();
  writeAllowlist(root, JSON.stringify({ files: ["src/fake/path.tsx"] }));
  const result = verifyGreenPanels(root);
  assert("missing file returns not ok", result.ok === false);
  assert("missing file reports the path", (result.missing ?? []).includes("src/fake/path.tsx"));
  rmSync(root, { recursive: true });
}

// Case 3: malformed JSON = not ok with parse error
{
  const root = makeWorkspace();
  writeAllowlist(root, "{not json");
  const result = verifyGreenPanels(root);
  assert("malformed JSON returns not ok", result.ok === false);
  assert("malformed JSON reports parseError", typeof result.parseError === "string");
  rmSync(root, { recursive: true });
}

// Case 4: missing "files" array = not ok
{
  const root = makeWorkspace();
  writeAllowlist(root, JSON.stringify({ description: "no files key" }));
  const result = verifyGreenPanels(root);
  assert("missing files array returns not ok", result.ok === false);
  rmSync(root, { recursive: true });
}

if (failed === 0) {
  console.log(`verify-green-panels: all ${passed} assertions pass`);
} else {
  console.error(`verify-green-panels: ${failed} failed, ${passed} passed`);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Gate: src/editor/ui/ is deleted and stays deleted.
 *
 * Task 13 (flowbite big-bang) deleted the old component library
 * (src/editor/ui/) — its consumers were re-pointed to src/editor/chrome-ui/
 * and flowbite-react across Tasks 2-12. This gate locks that at zero: any
 * new `@/editor/ui` import resurrects a deleted library.
 *
 * @license BSD-3-Clause
 */

import { execSync } from "node:child_process";

// grep, not rg: every other gate in scripts/ds-grep-gates.sh is plain POSIX
// grep, and GitHub's ubuntu-latest CI runner does not ship ripgrep — an
// `rg`-based gate would exit 127 ("command not found") on every CI run.
let out = "";
try {
  out = execSync(`grep -rl "@/editor/ui" src`, { encoding: "utf8" });
} catch (e) {
  // grep's exit-code convention: 0 = matches found, 1 = no matches, 2 = a
  // real error (bad pattern, unreadable path, missing binary — a shell
  // reports "command not found" as 127). Only status 1 is the pass case.
  // Swallowing every non-zero status here would silently no-op this gate in
  // any environment without a usable `grep` on PATH — the same "configured
  // never to fail" shape as the dev-fallback outages this repo has hit
  // before (see memory: feedback_dev_configured_never_to_fail).
  if (e.status !== 1) {
    console.error(`[editor-ui-gone] FAIL — could not run grep (exit ${e.status}): ${e.stderr || e.message}`);
    process.exit(1);
  }
}
if (out.trim()) {
  console.error("[editor-ui-gone] FAIL — @/editor/ui is deleted; migrate these to flowbite-react/@/editor/chrome-ui:\n" + out);
  process.exit(1);
}
console.log("[editor-ui-gone] PASS — 0 imports of the deleted library.");

/**
 * Negative test for ds-grep-gates.sh Gate 7 (Polish #79).
 *
 * Gate 7 forbids `@media (prefers-*)` blocks outside the canonical
 * `themes/design-system/a11y.css` file (with a vendored-components
 * exemption documented inline). Phase 1 left this gate without a
 * regression test; Phase 2 polish closes the hole.
 *
 * Strategy: plant a fixture CSS file inside themes/design-system/
 * (NOT a11y.css, NOT under themes/components/) that contains a
 * `@media (prefers-reduced-motion)` block. Run the gate script.
 * Assert non-zero exit. Always remove the fixture in finally so a
 * crashed test cannot poison the working tree.
 *
 * @license BSD-3-Clause
 */
import { test, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("Gate 7 fires when non-vendored CSS ships @media (prefers-reduced-motion)", () => {
  // Hard-coded fixture path inside the repo. No user input; no injection surface.
  // Name `test-gate7-fixture.css` makes the file's purpose obvious if it ever
  // leaks past the cleanup.
  const planted = resolve(
    __dirname,
    "../../src/themes/design-system/test-gate7-fixture.css",
  );
  // Belt-and-braces: refuse to overwrite an unrelated file with the same path.
  if (existsSync(planted)) {
    throw new Error(
      `Refusing to overwrite existing file at ${planted} — rename or remove it first.`,
    );
  }
  writeFileSync(
    planted,
    "@media (prefers-reduced-motion: reduce) { .x { transition: none; } }\n",
  );
  try {
    // spawnSync with an explicit argv array — no shell, no injection surface.
    const result = spawnSync(
      "bash",
      [resolve(__dirname, "../ds-grep-gates.sh")],
      { encoding: "utf8" },
    );
    // Gate 7 should fail (non-zero exit) because the planted file violates it.
    expect(result.status).not.toBe(0);
    // Sanity: the failure message should mention Gate 7 — proves we caught
    // the right gate, not some other unrelated regression.
    expect(result.stdout + result.stderr).toMatch(/Gate 7/);
  } finally {
    if (existsSync(planted)) unlinkSync(planted);
  }
});

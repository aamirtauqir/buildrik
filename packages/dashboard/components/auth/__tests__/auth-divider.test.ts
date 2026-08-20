/**
 * The "or" between the auth buttons is readable.
 *
 * axe on the live /auth and /auth/signup pages: 2.79:1 (#9A9AA0 on white) for
 * the divider word — placeholder grey, which is meant for text inside a field
 * where a label sits beside it, not for standalone copy. The auth palette's
 * -muted is 5.3:1 on the same background.
 *
 * The re-measure in the running app was blocked by a stale dev build still
 * serving the old class on the auth routes (a known Turbopack trap here); the
 * source and the contrast maths are what stand behind this test.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "../auth-divider.tsx"), "utf8");

describe("AuthDivider", () => {
  it("uses the muted token, not the placeholder one", () => {
    expect(src).toMatch(/text-auth-text-muted/);
    expect(src).not.toMatch(/text-auth-text-placeholder/);
  });
});

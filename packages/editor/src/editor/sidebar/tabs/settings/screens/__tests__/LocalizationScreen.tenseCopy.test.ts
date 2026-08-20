/**
 * The Enabled-locales section said each locale "serves under its own path
 * prefix" — present tense — directly above the screen's own note that locale
 * routing ships in Phase D. Nothing routes locales today: `translations` is a
 * page column no export or worker reads, and the only mention of it in the
 * editor is this screen's docblock.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const screen = readFileSync(join(__dirname, "..", "LocalizationScreen.tsx"), "utf8");
const rendered = screen.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

describe("localization copy", () => {
  it("does not claim locales are being served today", () => {
    expect(rendered).not.toMatch(/locale serves under/i);
  });

  it("keeps the note that says when routing ships", () => {
    expect(rendered).toMatch(/ships in Phase D/);
  });

  it("agrees with itself: both sentences are future tense", () => {
    expect(rendered).toMatch(/will serve under its own path prefix/i);
  });
});

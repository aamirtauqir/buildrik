/**
 * The custom-code validator answers against the SAME allowlist the export
 * sanitizer enforces.
 *
 * Before this, the Custom code screen was a three-way disagreement: the banner
 * said "Custom code runs on all pages", the placeholder suggested
 * `<script>…</script>`, the validator answered "✓ HTML looks good" — and
 * `sanitizeHeadCode` dropped every inline script and every non-allowlisted tag
 * at export time, silently. Walked live in the editor: typed an inline script
 * and an external one into Head Scripts, saved, and the exported head carried
 * only the external one.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { validateHtml } from "../validateHtml";
import { ALLOWED_HEAD_TAGS } from "../../constants/headCode";

const warnings = (code: string) => validateHtml(code).warnings.join(" | ");

describe("validateHtml — export policy", () => {
  it("warns that an inline script never reaches the published page", () => {
    expect(warnings("<script>track()</script>")).toMatch(
      /Inline <script> is removed when the site is published/
    );
  });

  it("says nothing about a script that loads from a src", () => {
    expect(warnings('<script src="https://plausible.io/js/script.js"></script>')).toBe("");
  });

  it("treats an async/defer external script as fine", () => {
    expect(warnings('<script defer src="https://x.test/a.js"></script>')).toBe("");
  });

  it("names the tags that get stripped", () => {
    const w = warnings("<div><span>hi</span></div>");
    expect(w).toMatch(/Removed when published/);
    expect(w).toMatch(/<div>, <span>/);
  });

  it("passes every tag on the allowlist without a removal warning", () => {
    for (const tag of ALLOWED_HEAD_TAGS) {
      const code = tag === "script" ? '<script src="https://x.test/a.js"></script>' : `<${tag}></${tag}>`;
      expect(warnings(code), tag).not.toMatch(/Removed when published/);
    }
  });

  it("keeps the older warnings it already had", () => {
    expect(warnings('<script src="x.js" onload="go()"></script>')).toMatch(
      /Inline event handlers detected/
    );
    expect(warnings('<script src="x.js"></script>document.write(1)')).toMatch(/document\.write/);
  });

  it("still reports forbidden tags as errors, not warnings", () => {
    const r = validateHtml("<iframe src='x'></iframe>");
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toMatch(/Forbidden tag/);
  });
});

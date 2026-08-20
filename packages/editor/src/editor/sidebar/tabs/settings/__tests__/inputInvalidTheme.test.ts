/**
 * An invalid settings field looks invalid.
 *
 * The Analytics screen hand-rolls `style={{ borderColor: ... }}` for its ID
 * fields, and the SEO screen's new OG-image error had no border at all — the
 * message was the only signal. The theme the settings `Input` already applies
 * is the one place that reaches the real `<input>` (flowbite puts a consumer
 * className on an outer wrapper), so the aria-invalid pair lives there.
 *
 * Measured live: an invalid OG image URL paints rgb(224, 36, 36).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(__dirname, "../shared.tsx"), "utf8");

describe("the settings text-input theme", () => {
  it("carries the aria-invalid border, focused or not", () => {
    expect(SRC).toContain("tw:aria-invalid:border-[var(--bk-error)]");
    expect(SRC).toContain("tw:aria-invalid:focus:border-[var(--bk-error)]");
  });

  it("still keeps the normal border and focus ring", () => {
    expect(SRC).toContain("tw:border-[var(--bk-border)]");
    expect(SRC).toContain("tw:focus:ring-[var(--bk-accent-tint)]");
  });
});

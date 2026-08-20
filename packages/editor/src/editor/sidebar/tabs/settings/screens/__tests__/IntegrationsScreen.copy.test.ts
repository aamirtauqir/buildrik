/**
 * The Integrations screen names no prerequisite it doesn't have.
 *
 * Its intro read "Integrations require publishing your site first". Nothing on
 * the screen connects anything — every row is `status="soon"` with a Learn More
 * link to the provider's own docs — so publishing unlocks nothing here, and the
 * sentence sent people to publish for a capability that arrives either way.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "../IntegrationsScreen.tsx"), "utf8");
const copy = src.slice(src.indexOf("export const IntegrationsScreen"));

describe("Integrations screen intro", () => {
  it("does not make publishing a prerequisite", () => {
    expect(copy).not.toMatch(/require[s]? publishing/i);
  });

  it("says what the rows actually do", () => {
    expect(copy).toMatch(/provider&rsquo;s\s*\n?\s*own setup|provider&rsquo;s own setup/);
  });

  it("still marks every catalogue row as not yet connectable", () => {
    expect(copy).toMatch(/status="soon"/);
  });
});

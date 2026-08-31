/**
 * Every plan-gate key must name a real screen.
 *
 * `SCREEN_PLAN_REQUIREMENTS` is a `Record<string, …>`, so a key that matches no
 * screen id does not fail — the lookup returns `undefined` and the screen
 * renders ungated. `advanced: "pro"` sat there while the screen's id was
 * `custom-code`, so board 1138:13436's Pro lock never fired: measured on a
 * starter plan, Integrations gated and Custom code rendered its editors with
 * no badge at all. Types cannot catch this; this test can.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SCREEN_PLAN_REQUIREMENTS } from "../types";

const NAV_SRC = readFileSync(join(__dirname, "..", "SettingsTab.tsx"), "utf8");

/** Screen ids as declared in SettingsTab's NAV table. */
const navIds = [...NAV_SRC.matchAll(/\{\s*id:\s*"([a-z0-9-]+)"\s*,\s*title:/g)].map((m) => m[1]);

describe("SCREEN_PLAN_REQUIREMENTS", () => {
  it("finds the NAV screen ids at all (guards the regex, not just the data)", () => {
    expect(navIds.length).toBeGreaterThan(5);
    expect(navIds).toContain("integrations");
  });

  it("every gate key names a screen that exists", () => {
    for (const key of Object.keys(SCREEN_PLAN_REQUIREMENTS)) {
      expect(
        navIds,
        `"${key}" is gated but no settings screen has that id, so the gate is ` +
          `dead — the lookup returns undefined and the screen renders free.`,
      ).toContain(key);
    }
  });

  it("still gates the two screens the boards draw locked", () => {
    expect(SCREEN_PLAN_REQUIREMENTS["custom-code"]).toBe("pro");
    expect(SCREEN_PLAN_REQUIREMENTS.integrations).toBe("pro");
  });
});

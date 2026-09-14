/**
 * Every plan-gate key must name a real screen.
 *
 * `SCREEN_PLAN_REQUIREMENTS` is a `Record<string, …>`, so a key that matches no
 * screen id does not fail — the lookup returns `undefined` and the screen
 * renders ungated. `advanced: "pro"` sat there while the screen's id was
 * `custom-code`, so board 1138:13436's Pro lock never fired: measured on a
 * starter plan, Integrations gated and Custom code rendered its editors with
 * no badge at all. Types cannot catch this; this test can.
 *
 * The nav is data now (`SETTINGS_NAV` in constants.ts), so this reads the
 * list itself rather than grepping SettingsTab's source for it.
 */
import { describe, it, expect } from "vitest";
import { SCREEN_PLAN_REQUIREMENTS } from "../types";
import { SETTINGS_NAV } from "../constants";

const screenIds = SETTINGS_NAV.filter((n) => n.kind === "screen").map((n) => n.id);

describe("SCREEN_PLAN_REQUIREMENTS", () => {
  it("every gate key names a screen that exists", () => {
    for (const key of Object.keys(SCREEN_PLAN_REQUIREMENTS)) {
      expect(
        screenIds,
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

/**
 * Every plan-gate key must name a real screen.
 *
 * `SCREEN_PLAN_REQUIREMENTS` was a `Record<string, …>`, so a key that matched no
 * screen id did not fail — the lookup returned `undefined` and the screen
 * rendered ungated (it is keyed by `SettingsScreenId` since Phase B). `advanced: "pro"` sat there while the screen's id was
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

  it("gates Custom code and Access on Pro — and nothing else (PD-2 removed Integrations)", () => {
    expect(SCREEN_PLAN_REQUIREMENTS).toEqual({ "custom-code": "pro", access: "pro" });
  });
});

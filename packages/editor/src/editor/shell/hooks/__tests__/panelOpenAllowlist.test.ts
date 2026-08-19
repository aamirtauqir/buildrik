/**
 * Every tab the ⌘K palette can name has to be one the panel-open handler
 * accepts.
 *
 * The palette builds "Open <X> panel" for each tab in the registry that has a
 * shortcut and emits UI_PANEL_OPEN with that tab's id. The listener filtered
 * those against a hand-written list which had drifted: Publish (U), Review
 * (R), Content (D) and AI (I) were all dropped, so choosing them from the
 * palette did nothing — while tabsConfig's own comment claimed Content was
 * "reachable via ⌘K". All four are real tabs: TabRouter renders them and
 * AquibraStudio opens three of them by name.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GROUPED_TABS_CONFIG } from "../../../rail/tabsConfig";

const listener = readFileSync(join(__dirname, "..", "useEditorEventListeners.ts"), "utf8");
const router = readFileSync(
  join(__dirname, "..", "..", "..", "sidebar", "TabRouter.tsx"),
  "utf8"
);

describe("UI_PANEL_OPEN allowlist", () => {
  it("comes from the tab registry, not a hand-written list", () => {
    expect(listener).toMatch(/GROUPED_TABS_CONFIG\.map\(\(t\) => t\.id\)/);
    expect(listener).not.toMatch(/"home", "add", "design"/);
  });

  it("covers every palette-reachable tab", () => {
    const paletteTabs = GROUPED_TABS_CONFIG.filter((t) => t.shortcut).map((t) => t.id);
    // The previously dropped four, named so a future trim is deliberate.
    for (const id of ["publish", "review", "content", "ai"]) {
      expect(paletteTabs, `${id} should be palette-reachable`).toContain(id);
    }
  });

  it("names only tabs the router can render", () => {
    const rendered = new Set([...router.matchAll(/case "([a-z-]+)":/g)].map((m) => m[1]));
    const unrenderable = GROUPED_TABS_CONFIG.filter(
      (t) => t.shortcut && !rendered.has(t.id) && t.mode !== "fullpage"
    ).map((t) => t.id);
    expect(unrenderable).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Clone 3519:19920 → 20096 — the URL-repair round trip: the Pages panel opens
 * Settings ON Redirects with a draft; the saved card's `Back to <Page> SEO`
 * opens that page's settings drawer. Both targets are lazy and unmounted when
 * the emit fires (Settings is a fullpage; the Pages panel sits under it), so a
 * listener inside either would never hear it — the exact family the events
 * file records as "declared-never-works". StudioPanels is mounted the whole
 * time; the requests wait there and ride down as props.
 */
const src = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../StudioPanels.tsx"),
  "utf8"
);

describe("StudioPanels — the two open requests wait here for a lazy panel", () => {
  it("listens for ui:settings-open and ui:pages-open-settings, and unsubscribes", () => {
    expect(src).toContain("composer.on(EVENTS.UI_SETTINGS_OPEN, openSettings)");
    expect(src).toContain("composer.off(EVENTS.UI_SETTINGS_OPEN, openSettings)");
    expect(src).toContain("composer.on(EVENTS.UI_PAGES_OPEN_SETTINGS, openPageSettings)");
    expect(src).toContain("composer.off(EVENTS.UI_PAGES_OPEN_SETTINGS, openPageSettings)");
  });

  it("each request switches the tab itself and opens the drawer", () => {
    expect(src).toMatch(/setSettingsOpen\(\{ screen: data\.screen, repair: data\.repair \?\? null \}\);\s*onLeftPanelTabChange\?\.\("settings"\)/);
    expect(src).toMatch(/setPagesOpen\(\{ pageId: data\.pageId, tab: data\.tab \}\);\s*onLeftPanelTabChange\?\.\("pages"\)/);
  });

  it("hands the requests down and drops each one when its tab is left", () => {
    expect(src).toContain("settingsOpen={settingsOpen}");
    expect(src).toContain("pagesOpen={pagesOpen}");
    expect(src).toMatch(/if \(activeTabId !== "settings"\) setSettingsOpen\(null\);\s*if \(activeTabId !== "pages"\) setPagesOpen\(null\);/);
  });
});

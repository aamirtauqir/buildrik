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
const tabsConfigSrc = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../rail/tabsConfig.ts"),
  "utf8"
);

describe("StudioPanels — the two open requests wait here for a lazy panel", () => {
  it("listens for ui:settings-open and ui:pages-open-settings, and unsubscribes", () => {
    expect(src).toContain("composer.on(EVENTS.UI_SETTINGS_OPEN, openSettings)");
    expect(src).toContain("composer.off(EVENTS.UI_SETTINGS_OPEN, openSettings)");
    expect(src).toContain("composer.on(EVENTS.UI_PAGES_OPEN_SETTINGS, openPageSettings)");
    expect(src).toContain("composer.off(EVENTS.UI_PAGES_OPEN_SETTINGS, openPageSettings)");
  });

  /* B-1 fix round 1: the request and the drawer ride the guarded switch's
     onSwitched — a switch held (or refused) by the unsaved-changes confirm
     must not hand a request to, or open the drawer on, the wrong tab. */
  it("each request switches the tab itself and, once switched, hands the request down and opens the drawer", () => {
    expect(src).toMatch(/onLeftPanelTabChange\?\.\("settings", \(\) => \{\s*setSettingsOpen\(\{ screen: data\.screen, repair: data\.repair \?\? null \}\);\s*openDrawer\(\);/);
    expect(src).toMatch(/onLeftPanelTabChange\?\.\("pages", \(\) => \{\s*setPagesOpen\(\{ pageId: data\.pageId, tab: data\.tab \}\);\s*openDrawer\(\);/);
  });

  it("hands the requests down and drops each one when its tab is left", () => {
    expect(src).toContain("settingsOpen={settingsOpen}");
    expect(src).toContain("pagesOpen={pagesOpen}");
    expect(src).toMatch(/if \(activeTabId !== "settings"\) setSettingsOpen\(null\);\s*if \(activeTabId !== "pages"\) setPagesOpen\(null\);/);
  });
});

describe("StudioPanels — ui:cms-open (⌘K → a collection or a record)", () => {
  it("listens and unsubscribes", () => {
    expect(src).toContain("composer.on(EVENTS.UI_CMS_OPEN, openCms)");
    expect(src).toContain("composer.off(EVENTS.UI_CMS_OPEN, openCms)");
  });

  it("writes the request to the workspace store, then switches to rail CMS", () => {
    expect(src).toMatch(/onLeftPanelTabChange\?\.\("content", \(\) => \{\s*cmsWorkspace\.openRequest\(data\);\s*openDrawer\(\);/);
  });
});

/* A-14: ui:switch-tab {tab:"ai"} set aiInInspector without ever setting
   inspectorShown, so ⌘J (or the ✦ AI chip) with a previously-collapsed
   inspector mounted AITab into a zero-width column. */
describe("StudioPanels — ui:switch-tab 'ai' forces the inspector column open", () => {
  it("sets aiInInspector AND forces inspectorShown, persisting the same key the toggle uses", () => {
    expect(src).toMatch(/setAiInInspector\(true\);\s*[\s\S]{0,800}setInspectorShown\(true\);/);
    expect(src).toContain('localStorage.setItem("buildrick-inspector-shown", "true")');
  });
});

/* Security carry-over (same class as the VIEWER rail gate): "ui:switch-tab"
 * is a SECOND door onto the tabs the rail gates — the ⌘K palette, canvas
 * context menus, PublishTab, CmsWorkspace and others all route through it.
 * Before this fix, the handler called onLeftPanelTabChange?.(data.tab)
 * unconditionally, so a VIEWER blocked from clicking "Add" on the rail could
 * still reach it via ⌘K or any other ui:switch-tab emitter. */
describe("StudioPanels — ui:switch-tab respects the VIEWER rail gate", () => {
  it("gates the handler with the SAME predicate the rail uses (isTabAllowedForViewer), not a copy", () => {
    // The handler's own gate.
    expect(src).toMatch(
      /const handler = \(data: \{ tab: string; fullPage\?: boolean \}\) => \{\s*[\s\S]{0,800}if \(!isTabAllowedForViewer\(data\.tab as GroupedTabId, viewerChrome\)\)/
    );
    // The rail's gate — same function, not a re-derived VIEWER_TABS.has(...) check.
    expect(src).toMatch(/if \(!isTabAllowedForViewer\(tab, viewerChrome\)\)/);
    // Imported from the tab registry, not locally re-defined here.
    expect(src).toMatch(/import \{[^}]*\bisTabAllowedForViewer\b[^}]*\bVIEWER_TABS\b[^}]*\} from "\.\.\/rail\/tabsConfig"/);
    expect(src).not.toMatch(/function isTabAllowedForViewer/);
    // Exactly ONE canonical definition exists, in the tab registry.
    expect(tabsConfigSrc.match(/export function isTabAllowedForViewer/g)).toHaveLength(1);
  });

  it("the effect re-subscribes when viewerChrome changes (so a mid-session role change re-gates it)", () => {
    expect(src).toMatch(/composer\.on\("ui:switch-tab", handler\);[\s\S]{0,200}\}, \[composer, onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle, viewerChrome, addToast\]\);/);
  });
});

describe("isTabAllowedForViewer", () => {
  it("a non-viewer may open any tab", async () => {
    const { isTabAllowedForViewer } = await import("../../rail/tabsConfig");
    expect(isTabAllowedForViewer("add" as never, false)).toBe(true);
    expect(isTabAllowedForViewer("content" as never, false)).toBe(true);
  });

  it("a viewer may only open layers/assets/history/review/activity (FC-9)", async () => {
    const { isTabAllowedForViewer } = await import("../../rail/tabsConfig");
    expect(isTabAllowedForViewer("layers" as never, true)).toBe(true);
    expect(isTabAllowedForViewer("assets" as never, true)).toBe(true);
    expect(isTabAllowedForViewer("history" as never, true)).toBe(true);
    expect(isTabAllowedForViewer("review" as never, true)).toBe(true);
    expect(isTabAllowedForViewer("activity" as never, true)).toBe(true);
    expect(isTabAllowedForViewer("add" as never, true)).toBe(false);
    expect(isTabAllowedForViewer("content" as never, true)).toBe(false);
    expect(isTabAllowedForViewer("design" as never, true)).toBe(false);
    expect(isTabAllowedForViewer("settings" as never, true)).toBe(false);
    expect(isTabAllowedForViewer("ai" as never, true)).toBe(false);
  });
});

/* X-8: a VIEWER's column used to be the role notice and nothing else, so the
   read-only History/Review/Activity (FC-9) rendered nowhere. */
describe("StudioPanels — a VIEWER's column hosts the column-tab panel", () => {
  it("decides the column with the shared predicate and renders it in the viewer's column", () => {
    expect(src).toContain("const rightColumnTab = isColumnTabOpen({");
    expect(src).toContain('{rightColumnTab ? columnPanel : <ViewerRoleNotice role="VIEWER" />}');
    expect(src).toContain("viewerChrome={viewerChrome}");
  });
});

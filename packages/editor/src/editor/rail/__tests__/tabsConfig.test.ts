import { describe, it, expect } from "vitest";
import {
  GROUPED_TABS_CONFIG,
  getTabMode,
  getTabConfig,
  isColumnTabOpen,
  isInspectorColumnOpen,
} from "../tabsConfig";
// ONE width for every panel (founder-approved 2026-07-24). These assertions
// used to hardcode 280, which is how the superseded two-width rule survived
// its own removal from DESIGN.md — the test kept the defect alive.

describe("tabsConfig helpers", () => {
  describe("getTabMode", () => {
    it("returns 'panel' for Add tab", () => {
      expect(getTabMode("add")).toBe("panel");
    });

    it("returns 'fullpage' for Templates tab (decision #24)", () => {
      expect(getTabMode("templates")).toBe("fullpage");
    });

    it("returns 'fullpage' for Settings tab (P5 — graduated from the 320px drawer)", () => {
      expect(getTabMode("settings")).toBe("fullpage");
    });

    it("returns 'panel' for History tab", () => {
      expect(getTabMode("history")).toBe("panel");
    });

    it("returns 'panel' for unknown tab ID (fallback)", () => {
      expect(getTabMode("nonexistent" as any)).toBe("panel");
    });
  });

  describe("getTabConfig", () => {
    it("returns config for a valid tab", () => {
      const config = getTabConfig("add");
      expect(config).toBeDefined();
      expect(config!.id).toBe("add");
      expect(config!.zone).toBe("creation");
    });

    it("returns undefined for invalid tab", () => {
      expect(getTabConfig("nonexistent" as any)).toBeUndefined();
    });
  });

  describe("GROUPED_TABS_CONFIG integrity", () => {
    it("has 13 tabs defined (AI lives in the inspector, G2-127)", () => {
      // 11 + review (P0 wedge, off-rail) + content (P4.2 data front-door, off-rail)
      expect(GROUPED_TABS_CONFIG).toHaveLength(13);
    });

    it("every tab has required fields", () => {
      for (const tab of GROUPED_TABS_CONFIG) {
        expect(tab.id).toBeTruthy();
        expect(tab.iconName).toBeTruthy();
        expect(tab.label).toBeTruthy();
        expect(tab.ariaLabel).toBeTruthy();
        expect(["top", "bottom"]).toContain(tab.section);
        expect(["panel", "fullpage"]).toContain(tab.mode);
      }
    });

    it("no panel-mode tab carries its own width", () => {
      // Width left tabsConfig entirely on 2026-08-31 — `.ls-panel` reads
      // `--bk-size-drawer`. See tabsConfig.width.test.ts for the real lock.
      const panelTabs = GROUPED_TABS_CONFIG.filter((t) => t.mode === "panel");
      expect(panelTabs.length).toBeGreaterThan(0);
      for (const tab of panelTabs) {
        expect((tab as unknown as Record<string, unknown>).panelWidth).toBeUndefined();
      }
    });
  });
});

/* X-8 (live verify 2026-09-26): a VIEWER's H shortcut switched to History,
   and History rendered nowhere — the right column was withheld from every
   read-only view, and the drawer skips a column-hosted tab. The column's
   one predicate now serves a VIEWER too; an owner's own read-only preview
   stays panel-free. */
describe("isColumnTabOpen", () => {
  const base = { readOnlyView: false, viewerChrome: false, isLeftPanelOpen: true, reviewsEnabled: true };
  it("hosts History / Review / Activity for a VIEWER", () => {
    for (const tab of ["history", "review", "activity"] as const) {
      expect(isColumnTabOpen({ ...base, readOnlyView: true, viewerChrome: true, activeTabId: tab })).toBe(true);
    }
  });
  it("hosts nothing in an owner's read-only preview", () => {
    expect(isColumnTabOpen({ ...base, readOnlyView: true, activeTabId: "history" })).toBe(false);
  });
  it("keeps Review closed when the review layer is off (FB-4), and drawer tabs out", () => {
    expect(isColumnTabOpen({ ...base, reviewsEnabled: false, activeTabId: "review" })).toBe(false);
    expect(isColumnTabOpen({ ...base, activeTabId: "layers" })).toBe(false);
    expect(isColumnTabOpen({ ...base, activeTabId: "publish" })).toBe(true);
  });
  it("is closed while the panel is closed", () => {
    expect(isColumnTabOpen({ ...base, isLeftPanelOpen: false, activeTabId: "history" })).toBe(false);
  });
});

/* Gap walk 93 #2: with the inspector hidden, History/Publish/Review/Activity
   (and Issues) opened into a 0-px column — the column's panels were gated on
   the INSPECTOR's own visibility preference. Hiding the inspector hides the
   inspector; a panel that lives in its column still shows the column. */
describe("isInspectorColumnOpen", () => {
  const base = {
    readOnlyView: false,
    viewerChrome: false,
    fullPage: false,
    cmsWorkspaceOpen: false,
    inspectorShown: true,
    columnModeOpen: false,
  };
  it("is open by default and closed when the inspector is hidden with nothing else in the column", () => {
    expect(isInspectorColumnOpen(base)).toBe(true);
    expect(isInspectorColumnOpen({ ...base, inspectorShown: false })).toBe(false);
  });
  it("opens for a column panel even with the inspector hidden", () => {
    expect(isInspectorColumnOpen({ ...base, inspectorShown: false, columnModeOpen: true })).toBe(true);
  });
  it("stays closed under a full page, the CMS workspace, and an owner's read-only view", () => {
    for (const k of ["fullPage", "cmsWorkspaceOpen", "readOnlyView"] as const) {
      expect(isInspectorColumnOpen({ ...base, columnModeOpen: true, [k]: true })).toBe(false);
    }
  });
  it("is always open for a VIEWER (the role notice lives there)", () => {
    expect(isInspectorColumnOpen({ ...base, readOnlyView: true, viewerChrome: true, inspectorShown: false })).toBe(true);
  });
});

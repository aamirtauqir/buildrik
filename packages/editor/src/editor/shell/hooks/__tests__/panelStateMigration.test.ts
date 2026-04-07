import { describe, it, expect } from "vitest";
import { migrateLegacyPanelState } from "../panelStateMigration";

describe("migrateLegacyPanelState", () => {
  it("returns unchanged state when no leftPanelTab", () => {
    const saved = { rightPanelTab: "inspector" };
    expect(migrateLegacyPanelState(saved)).toEqual(saved);
  });

  it("returns unchanged state when leftPanelTab is already a valid GroupedTabId", () => {
    const saved = { leftPanelTab: "layers" };
    expect(migrateLegacyPanelState(saved)).toEqual(saved);
  });

  it("maps legacy 'elements' to 'add'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "elements" });
    expect(result.leftPanelTab).toBe("add");
  });

  it("maps legacy 'layers' to 'layers' (direct match)", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "layers" });
    expect(result.leftPanelTab).toBe("layers");
  });

  it("maps legacy 'pages' to 'pages'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "pages" });
    expect(result.leftPanelTab).toBe("pages");
  });

  it("maps legacy 'design' to 'design'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "design" });
    expect(result.leftPanelTab).toBe("design");
  });

  it("maps legacy 'settings' to 'settings'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "settings" });
    expect(result.leftPanelTab).toBe("settings");
  });

  it("maps legacy 'history' to 'history'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "history" });
    expect(result.leftPanelTab).toBe("history");
  });

  // Regression: phantom tab IDs from prior 3-tab grouped migration
  it("maps phantom 'build' to 'add'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "build" });
    expect(result.leftPanelTab).toBe("add");
  });

  it("maps phantom 'structure' to 'layers'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "structure" });
    expect(result.leftPanelTab).toBe("layers");
  });

  it("maps phantom 'content' to 'add'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "content" });
    expect(result.leftPanelTab).toBe("add");
  });

  it("maps unknown tab ID to 'add'", () => {
    const result = migrateLegacyPanelState({ leftPanelTab: "nonexistent" });
    expect(result.leftPanelTab).toBe("add");
  });

  it("preserves other fields during migration", () => {
    const saved = {
      leftPanelTab: "elements",
      rightPanelTab: "inspector",
      isLeftPanelOpen: true,
    };
    const result = migrateLegacyPanelState(saved);
    expect(result.rightPanelTab).toBe("inspector");
    expect(result.isLeftPanelOpen).toBe(true);
    expect(result.leftPanelTab).toBe("add");
  });
});

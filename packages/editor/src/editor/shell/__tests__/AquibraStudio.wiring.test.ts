/**
 * AquibraStudio wiring guard — asserts modal openers are threaded into
 * StudioPanels. The mount of `<ImageEditorModal>` lives in StudioModals
 * but the *opener* (`modals.openImageEditor`) must reach StudioPanels →
 * LeftSidebar → MediaTab → AssetDetailOverlay so user Edit clicks resolve.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const FILE = path.resolve(
  __dirname,
  "..",
  "AquibraStudio.tsx",
);

const source = fs.readFileSync(FILE, "utf8");
const LISTENERS = fs.readFileSync(
  path.resolve(__dirname, "..", "hooks", "useEditorEventListeners.ts"),
  "utf8",
);

describe("AquibraStudio modal opener wiring", () => {
  it("passes modals.openImageEditor to StudioPanels", () => {
    expect(source).toMatch(/onOpenImageEditor=\{modals\.openImageEditor\}/);
  });
});

/*
  Board 65:211 (Shell state 7 · Preview) is the overlay. `UI_TOGGLE_PREVIEW`
  has three emitters — the ⌘K palette, the canvas palette and an onboarding
  step — and all three used to land on `composer.setPreviewMode`, which starts
  the interaction runtime, emits PREVIEW_MODE_CHANGED (nothing listens) and
  changes not one pixel. Every one of them reported success and showed the
  user the editor they were already looking at.
*/
describe("AquibraStudio — the Preview command reaches board 65:211", () => {
  it("subscribes to UI_TOGGLE_PREVIEW where the overlay's state lives", () => {
    expect(source).toMatch(/composer\.on\(EVENTS\.UI_TOGGLE_PREVIEW/);
    expect(source).toMatch(/setPreviewHtml/);
  });

  it("builds the overlay's html through the sanitizer, not raw export", () => {
    expect(source).toMatch(/sanitizeHTMLForPreview\(/);
  });

  it("no longer answers the command with the invisible engine flag", () => {
    expect(LISTENERS).not.toMatch(/composer\.on\(EVENTS\.UI_TOGGLE_PREVIEW/);
  });
});

/* B-1 fix: every left-panel tab-switch door must reach the GUARDED
   sinks useTabSwitchGuard returns. A raw `state.setLeftPanelTab` /
   `state.openLeftPanelToTab` anywhere else in the shell is a door that
   silently drops unsaved Settings / CMS-record work. */
describe("AquibraStudio — every tab-switch door passes through the guard", () => {
  const guardCall = source.match(/useTabSwitchGuard\(\{[\s\S]*?\}\);/)?.[0] ?? "";
  const outsideGuard = source.replace(guardCall, "");

  it("hands the raw sinks ONLY to useTabSwitchGuard", () => {
    expect(guardCall).toContain("setLeftPanelTab: state.setLeftPanelTab");
    expect(guardCall).toContain("openLeftPanelToTab: state.openLeftPanelToTab");
    // Comments may name them; code may not call or pass them.
    const code = outsideGuard.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toMatch(/state\.setLeftPanelTab\b/);
    expect(code).not.toMatch(/state\.openLeftPanelToTab\b/);
  });

  it("every onOpen* left-panel deep link uses the guarded openLeftPanelToTab", () => {
    const doors = [...source.matchAll(/(onOpen\w+)=\{\(\) => (\w+)\("/g)];
    expect(doors.length).toBeGreaterThanOrEqual(6);
    for (const [, prop, fn] of doors) expect({ prop, fn }).toEqual({ prop, fn: "guardedOpenLeftPanelToTab" });
  });

  it("the keyboard shortcuts (⌘H, ⌘,) get the guarded sinks", () => {
    const shortcuts = source.match(/useEditorShortcuts\(\{[\s\S]*?\}\);/)?.[0] ?? "";
    expect(shortcuts).toContain("openLeftPanelToTab: guardedOpenLeftPanelToTab");
    expect(shortcuts).toContain('openSiteSettings: () => guardedOpenLeftPanelToTab("settings")');
  });

  it("the composer listeners (UI_PANEL_OPEN, ui:switch-tab via StudioPanels) get the guarded sinks", () => {
    const listeners = source.match(/useEditorEventListeners\(\{[\s\S]*?\}\);/)?.[0] ?? "";
    expect(listeners).toContain("setLeftPanelTab: guardedSetLeftPanelTab");
    expect(listeners).toContain("openLeftPanelToTab: guardedOpenLeftPanelToTab");
    expect(source).toContain("onLeftPanelTabChange={guardedSetLeftPanelTab}");
  });
});

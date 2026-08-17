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

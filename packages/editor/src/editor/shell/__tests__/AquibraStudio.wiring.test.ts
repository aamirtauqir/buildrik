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

describe("AquibraStudio modal opener wiring", () => {
  it("passes modals.openImageEditor to StudioPanels", () => {
    expect(source).toMatch(/onOpenImageEditor=\{modals\.openImageEditor\}/);
  });
});

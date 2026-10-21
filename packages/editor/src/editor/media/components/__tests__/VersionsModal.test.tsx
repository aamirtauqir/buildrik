/**
 * The library's Asset versions dialog (Clone 3695:45529) is a frame around the
 * one version list — `AssetVersionList`, the same list the drawer draws. Its
 * rows' restore goes to the library's own confirm; its footer keeps Edit
 * latest saved version.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { makeItem } from "@/editor/media/__tests__/libraryFixture";
import type { AssetVersionRow, AssetVersions } from "@/editor/sidebar/tabs/media/hooks/useAssetVersions";
import { VersionsModal } from "../VersionsModal";

const EDITS = {
  width: 2400,
  height: 1600,
  crop: "Free",
  preset: "None",
  format: "Original",
  transform: "Original",
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
};

const hero = makeItem({ key: "hero", name: "hero-dark", displayName: "hero-dark.jpg", src: "blob:hero", width: 2400, height: 1600 });
const heroV2 = makeItem({
  key: "hero-v2",
  name: "hero-dark-v2",
  src: "blob:hero-v2",
  width: 2400,
  height: 1600,
  versionOf: "hero",
  edits: EDITS,
});

function versionsOf(rows: AssetVersionRow[]): AssetVersions {
  return {
    rows,
    movingTo: (row) => rows.filter((r) => r !== row && r.placements > 0),
    restore: vi.fn(() => ({ replaced: [], failed: [] })),
  };
}

/** v1 carries the site's three placements; v2 is saved, not on the site. */
const FAMILY = versionsOf([
  { item: hero, index: 1, placements: 3 },
  { item: heroV2, index: 2, placements: 0 },
]);

function mount(versions: AssetVersions) {
  const props = { open: true, versions, onClose: vi.fn(), onEditLatest: vi.fn(), onRestore: vi.fn() };
  render(<VersionsModal {...props} />);
  return props;
}

describe("Clone 3695:45529 · Asset versions — the shared list in a dialog", () => {
  it("titles itself and names the file with the original retained", () => {
    mount(FAMILY);
    expect(screen.getByTestId("versions-title")).toHaveTextContent("Asset versions");
    expect(screen.getByTestId("versions-subtitle")).toHaveTextContent("hero-dark.jpg · Original retained");
  });

  it("draws the shared list newest first, the version the site carries current", () => {
    mount(FAMILY);
    const list = within(screen.getByTestId("versions-list"));
    expect(list.getAllByRole("listitem").map((r) => r.getAttribute("data-testid"))).toEqual([
      "media-version-hero-v2",
      "media-version-hero",
    ]);
    expect(screen.getByTestId("media-version-meta-hero")).toHaveTextContent("current");
    expect(screen.getByTestId("media-version-hero-v2")).toHaveAttribute("aria-label", expect.stringContaining("v2 · Latest saved"));
    expect(screen.getByTestId("media-version-hero-v2").getAttribute("title")).toContain("Crop: Free · Preset: None · Format: Original");
  });

  it("a row's restore goes to the caller's confirm, not the inline one", () => {
    const props = mount(FAMILY);
    fireEvent.click(screen.getByTestId("media-version-menu-hero-v2"));
    expect(props.onRestore).toHaveBeenCalledWith(FAMILY.rows[1]);
    expect(screen.queryByTestId("media-restore-confirm")).toBeNull();
    expect(FAMILY.restore).not.toHaveBeenCalled();
  });

  it("a version that alone carries the site offers no restore", () => {
    mount(FAMILY);
    expect(screen.queryByTestId("media-version-menu-hero")).toBeNull();
  });

  it("foots Close · Edit latest saved version, and Edit opens the latest's file", () => {
    const props = mount(FAMILY);
    const foot = within(screen.getByTestId("versions-foot"));
    expect(foot.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Close", "Edit latest saved version"]);
    fireEvent.click(screen.getByTestId("versions-edit-latest"));
    expect(props.onEditLatest).toHaveBeenCalledWith(heroV2);
    fireEvent.click(screen.getByTestId("versions-close"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("an empty family renders nothing", () => {
    const { container } = render(
      <VersionsModal open versions={versionsOf([])} onClose={vi.fn()} onEditLatest={vi.fn()} onRestore={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

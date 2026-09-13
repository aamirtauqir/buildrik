/**
 * Clone Phase-1 contracts for the details rail — Figma page "Editor v1 Clone",
 * screens 3695:20340 and 3696:20326 … 3696:21754 ("Assets · Selected · <file>").
 *
 * The rail is one column, top to bottom: preview · filename · meta line ·
 * ALT TEXT · VERSIONS · USED IN · stacked actions. The V1 rail's three tabs
 * (Details / Versions / Used in) and its KV grid are displaced.
 *
 * Per-type action set, read off the shots (docs/design-jobs/CLONE-ASSETS/
 * phase1-journeys.md, "J-B per-type action table"):
 *   img/png  Insert to canvas · Edit image | Rename · Replace across site… · Delete
 *   svg      same as img
 *   mp4      Insert to canvas · Rename · Replace across site… · Delete   (no Edit image)
 *   woff2    Rename · Delete                                            (no Insert, no Replace)
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { LibraryItem } from "../../../sidebar/tabs/media/data/mediaTypes";
import { AssetDetailsPanel, type AssetDetailsPanelProps } from "../AssetDetailsPanel";
import { TEN } from "../../__tests__/libraryFixture";

function byName(name: string): LibraryItem {
  const item = TEN.find((i) => i.name === name);
  if (!item) throw new Error(`no fixture named ${name}`);
  return item;
}

function mount(selectedItem: LibraryItem, over: Partial<AssetDetailsPanelProps> = {}) {
  const props: AssetDetailsPanelProps = {
    selectedItem,
    versions: [],
    usageCount: 0,
    usedIn: [],
    libraryItems: TEN,
    onSelectAsset: vi.fn(),
    onInsert: vi.fn(),
    onEditImage: vi.fn(),
    onOpenRename: vi.fn(),
    onRequestDelete: vi.fn(),
    composer: {
      mediaOps: { replaceAcross: vi.fn(() => ({ replaced: [], failed: [] })) },
    } as unknown as AssetDetailsPanelProps["composer"],
    addToast: vi.fn(),
    ...over,
  };
  const utils = render(<AssetDetailsPanel {...props} />);
  return { ...utils, props };
}

function actionNames() {
  return within(screen.getByTestId("mgr-det-actions"))
    .getAllByRole("button")
    .map((b) => b.textContent?.trim());
}

describe("Clone 3695:20340 · Selected · menu-cover.png", () => {
  it("stacks Insert to canvas · Edit image · Rename · Replace across site… · Delete", () => {
    mount(byName("menu-cover.png"), { usageCount: 1 });
    expect(actionNames()).toEqual([
      "Insert to canvas",
      "Edit image",
      "Rename",
      "Replace across site…",
      "Delete",
    ]);
  });

  it("prints the meta line as '<w> × <h> · <size> · PNG · added <Mon d>' when measured", () => {
    mount(byName("menu-cover.png"));
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent(/^1600 × 1000 · 215 KB · PNG · added /);
  });

  it("has no Details / Versions / Used in tabs", () => {
    mount(byName("menu-cover.png"));
    expect(screen.queryByRole("button", { name: /^Details$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Used in ·/ })).toBeNull();
  });

  it("USED IN names the places, or says the asset is not used", () => {
    mount(byName("menu-cover.png"), { usageCount: 1, usedIn: ["Menu preview"] });
    expect(screen.getByTestId("mgr-det-used")).toHaveTextContent("1 place — Menu preview");
  });

  it("USED IN reads 'Not used on this site' at zero usage", () => {
    mount(byName("team-photo.jpg"));
    expect(screen.getByTestId("mgr-det-used")).toHaveTextContent("Not used on this site");
  });

  it("Replace across site… is disabled while nothing uses the asset", () => {
    mount(byName("team-photo.jpg"));
    expect(screen.getByRole("button", { name: "Replace across site…" })).toBeDisabled();
  });
});

describe("Clone 3696:20530 · Selected · team-photo.jpg (unmeasured)", () => {
  it("falls back to 'Selected asset · JPG' when there are no dimensions", () => {
    mount(byName("team-photo.jpg"));
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("Selected asset · JPG");
  });
});

describe("Clone 3696:20326 · Selected · chef-intro.mp4", () => {
  it("has Rename at full width and no Edit image", () => {
    mount(byName("chef-intro.mp4"), { usageCount: 1 });
    expect(actionNames()).toEqual(["Insert to canvas", "Rename", "Replace across site…", "Delete"]);
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("Selected asset · MP4");
  });

  it("previews the video with a <video>, not a broken <img>", () => {
    mount(byName("chef-intro.mp4"));
    expect(screen.getByTestId("mgr-det-video")).toBeInTheDocument();
    expect(screen.getByTestId("mgr-details").querySelector(".mgr-det-preview img")).toBeNull();
  });
});

describe("Clone 3696:20734 · Selected · logo-mark.svg", () => {
  it("keeps Insert to canvas and Edit image", () => {
    mount(byName("logo-mark.svg"), { usageCount: 5 });
    expect(actionNames()).toEqual([
      "Insert to canvas",
      "Edit image",
      "Rename",
      "Replace across site…",
      "Delete",
    ]);
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("Selected asset · SVG");
  });
});

describe("Clone 3696:21550 · Selected · Inter-Var.woff2", () => {
  it("offers Rename and Delete only — a font is not inserted or replaced across the site", () => {
    mount(byName("Inter-Var.woff2"), { usageCount: 1 });
    expect(actionNames()).toEqual(["Rename", "Delete"]);
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("Selected asset · WOFF2");
    expect(screen.queryByTestId("alt-text-section")).toBeNull();
  });
});

describe("Clone rail · versions inline", () => {
  const current = byName("hero-dark.jpg");
  const older: LibraryItem = { ...current, key: "hero-v1", name: "hero-dark_v2210", createdAt: "2026-08-02T10:00:00.000Z" };

  it("lists versions under a VERSIONS heading with the newest marked current", () => {
    mount(current, { versions: [current, older] });
    const versions = screen.getByTestId("mgr-det-versions");
    expect(within(versions).getByText("hero-dark_v2210")).toBeInTheDocument();
    expect(within(versions).getByText("CURRENT")).toBeInTheDocument();
  });

  it("clicking an older row selects it, without a tab click first", () => {
    const { props } = mount(current, { versions: [current, older] });
    fireEvent.click(screen.getByText("hero-dark_v2210"));
    expect(props.onSelectAsset).toHaveBeenCalledWith("hero-v1");
  });
});

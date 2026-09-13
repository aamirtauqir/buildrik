/**
 * Clone contracts for the details rail — Figma page "Editor v1 Clone",
 * screens 3695:20340 and 3696:20326 … 3696:21754 ("Assets · Selected · <file>",
 * Phase 1) and, from the LATER section 3695:45625 (Phase 2), 3705:20396 …
 * 3705:21280 ("Assets · List · <file> selected"), 4215:26635 (2 checked),
 * 3699:20381 / 3683:19964 (Moved to <Folder>).
 *
 * The rail is one column, top to bottom: preview · filename · meta line ·
 * ALT TEXT · VERSIONS · USED IN · stacked actions. The V1 rail's three tabs
 * (Details / Versions / Used in) and its KV grid are displaced.
 *
 * Per-type action set, read off the shots (docs/design-jobs/CLONE-ASSETS/
 * phase1-journeys.md, "J-B per-type action table"; 3705:20396 / 3705:21059
 * for the checked-row rail):
 *   img/png  Insert to canvas · Edit image | Rename · Replace across site… · Delete
 *   svg      same as img
 *   mp4      Insert to canvas · Rename · Replace across site… · Delete   (no Edit image)
 *   woff2    Rename · Delete                       (no Insert, no Replace; Manage font is Phase 5)
 *
 * Insert to canvas is the PRIMARY (accent) button: 3705:20396 and
 * 4207:26629 draw it filled, and the later section wins over 3695:20340's
 * outlined one.
 *
 * Select mode (the `bulk` prop): 0 checked → "No assets selected" + hint
 * (3695:19968); ≥2 checked → "N assets selected" · Move to folder (primary) ·
 * Clear selection (4215:26635). Exactly 1 checked is the FULL rail of that
 * file (3705:21059) — the orchestrator resolves it; Phase 1's "1 asset
 * selected" hint (3695:20154) is displaced.
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

describe("Clone 3705:20396 · List · chef-intro.mp4 selected (the one checked row is the full rail)", () => {
  it("Insert to canvas is the PRIMARY button; the rest stay outlined", () => {
    mount(byName("chef-intro.mp4"), { usageCount: 1 });
    const actions = within(screen.getByTestId("mgr-det-actions"));
    expect(actions.getByRole("button", { name: "Insert to canvas" })).toHaveClass("mgr-btn-primary");
    expect(actions.getByRole("button", { name: "Rename" })).toHaveClass("mgr-btn");
  });

  it("3705:21059 · a checked font offers Rename · Delete only", () => {
    mount(byName("Inter-Var.woff2"), { usageCount: 1 });
    expect(actionNames()).toEqual(["Rename", "Delete"]);
  });
});

function mountBulk(names: string[], over: Partial<AssetDetailsPanelProps> = {}) {
  const bulk = { names, onMove: vi.fn(), onClear: vi.fn() };
  mount(byName("hero-dark.jpg"), { selectedItem: null, bulk, ...over });
  return bulk;
}

describe("Clone 3695:19968 · select mode, nothing checked", () => {
  it("reads 'No assets selected' with its hint and offers no action", () => {
    mountBulk([]);
    const rail = within(screen.getByTestId("mgr-details"));
    expect(rail.getByRole("heading", { name: "No assets selected" })).toBeInTheDocument();
    expect(rail.getByText("Select a file to inspect it. Select checkboxes to manage multiple assets.")).toBeInTheDocument();
    expect(rail.queryByRole("button")).toBeNull();
  });
});

describe("Clone 4215:26635 · 2 assets selected", () => {
  it("counts the set, says actions apply to both, lists the files, and offers Move to folder (primary) · Clear selection", () => {
    const bulk = mountBulk(["hero-dark.jpg", "chef-intro.mp4"]);
    const rail = within(screen.getByTestId("mgr-details"));
    expect(rail.getByRole("heading", { name: "2 assets selected" })).toBeInTheDocument();
    expect(
      rail.getByText("Actions apply to both selected files. Moving files only changes library organisation."),
    ).toBeInTheDocument();
    const files = within(screen.getByTestId("mgr-det-files")).getAllByRole("listitem").map((li) => li.textContent);
    expect(files).toEqual(["hero-dark.jpg", "chef-intro.mp4"]);
    const move = screen.getByTestId("mgr-det-move-to-folder");
    expect(move).toHaveTextContent("Move to folder");
    expect(move).toHaveClass("mgr-btn-primary");
    fireEvent.click(move);
    expect(bulk.onMove).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("mgr-det-clear-selection"));
    expect(bulk.onClear).toHaveBeenCalledTimes(1);
    // Phase 1's Delete under the hint (3695:20154) is displaced — the bar owns it.
    expect(rail.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("says 'all N' past two", () => {
    mountBulk(["hero-dark.jpg", "chef-intro.mp4", "menu-cover.png"]);
    expect(
      screen.getByText("Actions apply to all 3 selected files. Moving files only changes library organisation."),
    ).toBeInTheDocument();
  });
});

describe("Clone 3699:20381 / 3683:19964 · Moved to <Folder>", () => {
  function mountResult(moved: string[], alreadyThere: string[], over: Partial<AssetDetailsPanelProps> = {}) {
    const moveResult = {
      folderName: "Hero shots",
      names: [...moved, ...alreadyThere],
      moved,
      alreadyThere,
      onView: vi.fn(),
      onClear: vi.fn(),
    };
    mount(byName("hero-dark.jpg"), {
      selectedItem: null,
      moveResult,
      bulk: { names: ["hero-dark.jpg", "chef-intro.mp4"], onMove: vi.fn(), onClear: vi.fn() },
      ...over,
    });
    return moveResult;
  }

  it("3699:20381 · names what moved and what was already here", () => {
    const result = mountResult(["chef-intro.mp4"], ["hero-dark.jpg"]);
    const rail = within(screen.getByTestId("mgr-det-move-result"));
    expect(rail.getByRole("heading", { name: "Moved to Hero shots" })).toBeInTheDocument();
    expect(screen.getByTestId("mgr-det-move-result-body")).toHaveTextContent(
      "chef-intro.mp4 moved; hero-dark.jpg was already here. Site placements are unchanged.",
    );
    expect(within(screen.getByTestId("mgr-det-files")).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "chef-intro.mp4",
      "hero-dark.jpg",
    ]);
    const view = screen.getByTestId("mgr-det-view-destination");
    expect(view).toHaveTextContent("View destination");
    expect(view).toHaveClass("mgr-btn-primary");
    fireEvent.click(view);
    expect(result.onView).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("mgr-det-clear-selection"));
    expect(result.onClear).toHaveBeenCalledTimes(1);
  });

  it("3683:19964 · counts a clean move", () => {
    mountResult(["hero-dark.jpg", "chef-intro.mp4"], []);
    expect(screen.getByTestId("mgr-det-move-result-body")).toHaveTextContent(
      "2 assets moved successfully. Their existing site placements are unchanged.",
    );
  });

  it("a single clean move reads '1 asset moved successfully.'", () => {
    mountResult(["hero-dark.jpg"], []);
    expect(screen.getByTestId("mgr-det-move-result-body")).toHaveTextContent("1 asset moved successfully.");
  });

  it("the result wins over the checked set AND over a selected file", () => {
    mountResult(["hero-dark.jpg"], [], { selectedItem: byName("hero-dark.jpg") });
    expect(screen.queryByRole("heading", { name: /assets selected/ })).toBeNull();
    expect(screen.queryByTestId("mgr-det-actions")).toBeNull();
    expect(screen.getByTestId("mgr-det-move-result")).toBeInTheDocument();
  });
});

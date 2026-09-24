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
 *   woff2    Manage font · Rename · Delete         (no Insert, no Replace; Phase 5 opened the door)
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
    onOpenVersions: vi.fn(),
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

/* Phase 5 (Site fonts, 3686:42317) opened the door Phase 1 left drift-open:
   the rail's actions read `Manage font · Rename · Delete`, and the meta line
   says which of the model's two states the file is in. A font is still
   neither inserted nor replaced across the site. */
describe("Clone 3696:21550 · Selected · Inter-Var.woff2", () => {
  it("offers Manage font · Rename · Delete — no Insert, no Replace, no alt text", () => {
    mount(byName("Inter-Var.woff2"), { usageCount: 1, onManageFont: vi.fn() });
    expect(actionNames()).toEqual(["Manage font", "Rename", "Delete"]);
    expect(screen.queryByTestId("alt-text-section")).toBeNull();
  });

  it("the meta line reads the file's state — uploaded, not added — with its format", () => {
    mount(byName("Inter-Var.woff2"), { onManageFont: vi.fn() });
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("Uploaded · not added · WOFF2");
  });

  it("an added font's meta line reads Site font · added", () => {
    mount({ ...byName("Inter-Var.woff2"), siteFont: true }, { onManageFont: vi.fn() });
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("Site font · added · WOFF2");
  });

  it("Manage font hands THIS file to the door — the Site fonts dialog opens on it", () => {
    const onManageFont = vi.fn();
    mount(byName("Inter-Var.woff2"), { onManageFont });
    fireEvent.click(screen.getByTestId("mgr-det-manage-font"));
    expect(onManageFont).toHaveBeenCalledWith(byName("Inter-Var.woff2"));
  });

  it("Manage font is not offered for an image", () => {
    mount(byName("menu-cover.png"), { onManageFont: vi.fn() });
    expect(screen.queryByTestId("mgr-det-manage-font")).toBeNull();
  });
});

/* Phase 6 (3695:45529 / 3697:20326): the VERSIONS block lists the family
   the version model knows — `v2 · Latest saved` over `v1 · Original` — and
   a row is the door to Asset versions. Phase 1's `menu-cover_v4127 · current`
   rows (3695:20340) read the `_v1234` stem heuristic, which is gone. */
describe("Clone rail · versions inline", () => {
  const original = byName("hero-dark.jpg");
  const saved: LibraryItem = { ...original, key: "hero-v2", name: "hero-dark-v2", src: "blob:hero-v2", versionOf: "hero", createdAt: "2026-09-02T10:00:00.000Z" };

  it("lists v2 · Latest saved over v1 · Original under a VERSIONS heading, without a tab click first", () => {
    mount(original, {
      versions: [
        { item: original, index: 1, placements: 3, pages: ["Home"] },
        { item: saved, index: 2, placements: 0, pages: [] },
      ],
    });
    const versions = within(screen.getByTestId("mgr-det-versions"));
    expect(versions.getByRole("heading", { name: "Versions" })).toBeInTheDocument();
    expect(versions.getByTestId("mgr-det-version-hero-v2")).toHaveTextContent("v2 · Latest saved");
    expect(versions.getByTestId("mgr-det-version-hero")).toHaveTextContent("v1 · Original");
  });

  it("a row opens Asset versions", () => {
    const { props } = mount(original, {
      versions: [
        { item: original, index: 1, placements: 3, pages: ["Home"] },
        { item: saved, index: 2, placements: 0, pages: [] },
      ],
    });
    fireEvent.click(screen.getByTestId("mgr-det-version-hero"));
    expect(props.onOpenVersions).toHaveBeenCalledTimes(1);
  });
});

describe("Clone 3705:20396 · List · chef-intro.mp4 selected (the one checked row is the full rail)", () => {
  it("Insert to canvas is the dark ink button (4418:58292); the rest stay outlined", () => {
    mount(byName("chef-intro.mp4"), { usageCount: 1 });
    const actions = within(screen.getByTestId("mgr-det-actions"));
    const insert = actions.getByRole("button", { name: "Insert to canvas" });
    expect(insert).toHaveClass("mgr-btn-ink");
    expect(insert).not.toHaveClass("mgr-btn-primary");
    expect(actions.getByRole("button", { name: "Rename" })).toHaveClass("mgr-btn");
  });

  it("3705:21059 · a checked font offers Manage font · Rename · Delete", () => {
    mount(byName("Inter-Var.woff2"), { usageCount: 1, onManageFont: vi.fn() });
    expect(actionNames()).toEqual(["Manage font", "Rename", "Delete"]);
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

describe("Clone 4207:26629 · the rail dims while an asset is dragged", () => {
  it("carries the dimmed marker", () => {
    mount(byName("hero-dark.jpg"), { dimmed: true });
    expect(screen.getByTestId("mgr-details")).toHaveAttribute("data-dimmed", "true");
  });

  it("is not dimmed at rest", () => {
    mount(byName("hero-dark.jpg"));
    expect(screen.getByTestId("mgr-details")).not.toHaveAttribute("data-dimmed");
  });
});

/* BLOCKERS C3 — the rail's TAGS block is the code's addition (authority
   `code:tag-writer`): the Clone draws chips under FOLDERS (3695:45155) and
   a tag filter (3721:43697) but no editor, and nothing wrote a tag. The
   block sits under ALT TEXT and above USED IN: the file's chips with ×, and
   an Add tag field — Enter adds, lower-cased, trimmed, deduped, ≤ 24 chars,
   never empty. */
describe("code:tag-writer · the rail's TAGS block", () => {
  const tagged = (tags: string[]) => ({ ...byName("team-photo.jpg"), tags });

  it("lists the file's tags as chips, each with a × that removes it", () => {
    const onUpdateTags = vi.fn();
    mount(tagged(["team", "staff"]), { onUpdateTags });
    const block = within(screen.getByTestId("mgr-det-tags"));
    expect(block.getByText("Tags")).toBeInTheDocument();
    expect(block.getByTestId("mgr-det-tag-team")).toHaveTextContent("team");
    expect(block.getByTestId("mgr-det-tag-staff")).toHaveTextContent("staff");
    fireEvent.click(block.getByRole("button", { name: "Remove tag staff" }));
    expect(onUpdateTags).toHaveBeenCalledWith("team", ["team"]);
  });

  it("sits under ALT TEXT and above USED IN", () => {
    mount(tagged(["team"]), { onUpdateTags: vi.fn(), onUpdateAltText: vi.fn() });
    const order = Array.from(document.querySelectorAll("[data-testid='alt-text-section'], [data-testid='mgr-det-tags'], [data-testid='mgr-det-used']")).map(
      (el) => el.getAttribute("data-testid"),
    );
    expect(order).toEqual(["alt-text-section", "mgr-det-tags", "mgr-det-used"]);
  });

  it("Enter adds the typed tag lower-cased and trimmed, then empties the field", () => {
    const onUpdateTags = vi.fn();
    mount(tagged(["team"]), { onUpdateTags });
    const input = screen.getByTestId("mgr-det-tag-input");
    expect(input).toHaveAttribute("placeholder", "Add tag");
    fireEvent.change(input, { target: { value: "  Summer Menu " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onUpdateTags).toHaveBeenCalledWith("team", ["team", "summer menu"]);
    expect(input).toHaveValue("");
  });

  it("refuses an empty entry and a duplicate, and caps a tag at 24 characters", () => {
    const onUpdateTags = vi.fn();
    mount(tagged(["team"]), { onUpdateTags });
    const input = screen.getByTestId("mgr-det-tag-input");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "TEAM" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onUpdateTags).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("maxlength", "24");
    fireEvent.change(input, { target: { value: "x".repeat(30) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onUpdateTags).toHaveBeenCalledWith("team", ["team", "x".repeat(24)]);
  });

  it("draws the block for every file type, with no chips when the file has none", () => {
    mount(byName("Inter-Var.woff2"), { onUpdateTags: vi.fn() });
    expect(screen.getByTestId("mgr-det-tags")).toBeInTheDocument();
    expect(screen.queryByTestId("mgr-det-tag-list")).toBeNull();
    expect(screen.getByTestId("mgr-det-tag-input")).toBeInTheDocument();
  });

  it("is absent when the orchestrator gives it no writer", () => {
    mount(tagged(["team"]));
    expect(screen.queryByTestId("mgr-det-tags")).toBeNull();
  });
});

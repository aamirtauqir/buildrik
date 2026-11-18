/**
 * Clone contracts for the details rail — Figma page "Editor v1 Clone",
 * screens 3695:20340 and 3696:20326 … 3696:21754 ("Assets · Selected · <file>",
 * Phase 1) and, from the LATER section 3695:45625 (Phase 2), 3705:20396 …
 * 3705:21280 ("Assets · List · <file> selected"), 4215:26635 (2 checked),
 * 3699:20381 / 3683:19964 (Moved to <Folder>).
 *
 * 2L9 B6-A01/A02/A03/A19 (199:37199 / 37822 / 38433, 200:31384) bring the
 * tabs back: the file's name, Details | Usage | Versions, and Place on
 * canvas · Edit image · More ▾ under Details.
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
import type { LibraryItem } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import { AssetDetailsPanel, type AssetDetailsPanelProps } from "../AssetDetailsPanel";
import { TEN } from "@/editor/media/__tests__/libraryFixture";

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
    libraryItems: TEN,
    onOpenVersions: vi.fn(),
    onInsert: vi.fn(),
    onEditImage: vi.fn(),
    onOpenRename: vi.fn(),
    onRequestDelete: vi.fn(),
    composer: {
      mediaOps: {
        replaceAcross: vi.fn(() => ({ replaced: [], failed: [] })),
        // FC-6: the "Used in" row list reads usage through the same
        // collectUsageByPage util the drawer's overlay uses — empty by
        // default, individual tests override with `usagePages`/`over`.
        getUsagesByPage: vi.fn(() => new Map()),
      },
      elements: { getAllPages: vi.fn(() => []) },
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

/* 200:31384 — what More ▾ holds. */
function moreNames() {
  fireEvent.click(screen.getByTestId("mgr-det-more"));
  return screen.getAllByRole("menuitem").map((b) => b.textContent?.trim());
}

const tab = (id: "details" | "usage" | "versions") => fireEvent.click(screen.getByTestId(`mgr-det-tab-${id}`));

const usageComposer = () =>
  ({
    mediaOps: {
      replaceAcross: vi.fn(() => ({ replaced: [], failed: [] })),
      getUsagesByPage: vi.fn(
        () => new Map([["page-1", [{ getId: () => "el-1", getType: () => "img", getAttribute: () => undefined }]]]),
      ),
    },
    elements: { getAllPages: vi.fn(() => [{ id: "page-1", name: "Menu preview" }]) },
  }) as unknown as AssetDetailsPanelProps["composer"];

describe("2L9 B6-A01 (199:37199) · the rail's head and Details tab", () => {
  it("names the file, then Details | Usage | Versions with Details current", () => {
    mount(byName("menu-cover.png"));
    expect(screen.getByTestId("mgr-det-title")).toHaveTextContent("menu-cover.png");
    expect(within(screen.getByTestId("mgr-det-tabs")).getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Details",
      "Usage",
      "Versions",
    ]);
    expect(screen.getByTestId("mgr-det-tab-details")).toHaveAttribute("aria-selected", "true");
  });

  it("prints '<w> × <h> · <format> · <size>' when measured, '<format> · <size>' when not", () => {
    mount(byName("menu-cover.png"));
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent("1600 × 1000 · PNG · 215 KB");
  });

  it("falls back to '<format> · <size>' with no dimensions", () => {
    mount(byName("team-photo.jpg"));
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent(/^JPG · /);
  });

  it("an image: Place on canvas · Edit image · More ▾", () => {
    mount(byName("menu-cover.png"), { usageCount: 1 });
    expect(actionNames()).toEqual(["Place on canvas", "Edit image", "More"]);
    expect(within(screen.getByTestId("mgr-det-actions")).getByRole("button", { name: "Place on canvas" })).toHaveClass("mgr-btn-primary");
  });

  it("200:31384 — More ▾ lists the board's rows in order, Delete asset… in red, then Close", () => {
    mount(byName("menu-cover.png"), {
      usageCount: 1,
      onOptimizeImage: vi.fn(),
      onUploadVersion: vi.fn(),
      onCopyUrl: vi.fn(),
      onDownloadItem: vi.fn(),
      onMoveToFolder: vi.fn(),
    });
    expect(moreNames()).toEqual([
      "Optimize",
      "Upload new version…",
      "Replace across site…",
      "Rename",
      "Copy URL",
      "Copy alt text",
      "Download",
      "Move to folder",
      "Delete asset…",
      "Close",
    ]);
    expect(screen.getByRole("menuitem", { name: "Delete asset…" }).className).toMatch(/red/);
  });

  it("More ▾ rows run their doors with this file", () => {
    const item = byName("menu-cover.png");
    const onCopyUrl = vi.fn();
    const onDownloadItem = vi.fn();
    const onMoveToFolder = vi.fn();
    mount(item, { onCopyUrl, onDownloadItem, onMoveToFolder });
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    fireEvent.click(screen.getByTestId("mgr-det-copy-url"));
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    fireEvent.click(screen.getByTestId("mgr-det-download"));
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    fireEvent.click(screen.getByTestId("mgr-det-move"));
    expect(onCopyUrl).toHaveBeenCalledWith(item);
    expect(onDownloadItem).toHaveBeenCalledWith(item);
    expect(onMoveToFolder).toHaveBeenCalledWith(item);
  });

  it("Copy alt text is disabled while the image has none", () => {
    mount({ ...byName("menu-cover.png"), altText: "" });
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    expect(screen.getByTestId("mgr-det-copy-alt")).toBeDisabled();
  });

  it("Replace across site… is disabled while nothing uses the asset", () => {
    mount(byName("team-photo.jpg"));
    fireEvent.click(screen.getByTestId("mgr-det-more"));
    expect(screen.getByRole("menuitem", { name: "Replace across site…" })).toBeDisabled();
  });

  it("Folder names the file's folder, or says it has none", () => {
    mount(byName("menu-cover.png"), { folderName: "Brand shots" });
    expect(screen.getByTestId("mgr-det-folder")).toHaveTextContent("FolderBrand shots");
  });
});

describe("2L9 B6-A02 (199:37822) · Usage", () => {
  it("lists each placement as 'Page › element ↗' under 'Pages · N placements', with the scope caveat", () => {
    const onJumpToElement = vi.fn();
    mount(byName("menu-cover.png"), { usageCount: 1, composer: usageComposer(), onJumpToElement });
    tab("usage");
    const used = screen.getByTestId("mgr-det-used");
    expect(used).toHaveTextContent("Usage outside this site isn’t checked.");
    expect(screen.getByTestId("mgr-det-used-count")).toHaveTextContent("Pages · 1 placement");
    expect(screen.getByTestId("mgr-det-jump-el-1")).toHaveTextContent("Menu preview › img ↗");
    fireEvent.click(screen.getByTestId("mgr-det-jump-el-1"));
    expect(onJumpToElement).toHaveBeenCalledWith("page-1", "el-1");
  });

  it("says there are no known placements at zero usage, and Replace across site… waits", () => {
    mount(byName("team-photo.jpg"));
    tab("usage");
    expect(screen.getByTestId("mgr-det-used")).toHaveTextContent("No known placements on this site.");
    expect(screen.getByTestId("mgr-det-usage-replace")).toBeDisabled();
  });
});

describe("Clone 3696:20326 · chef-intro.mp4", () => {
  it("a video: Place on canvas · Rename · More ▾; no Edit image, no Copy alt text", () => {
    mount(byName("chef-intro.mp4"), { usageCount: 1 });
    expect(actionNames()).toEqual(["Place on canvas", "Rename", "More"]);
    expect(moreNames()).toEqual(["Replace across site…", "Delete asset…", "Close"]);
  });

  it("previews the video with a <video>, not a broken <img>", () => {
    mount(byName("chef-intro.mp4"));
    expect(screen.getByTestId("mgr-det-video")).toBeInTheDocument();
    expect(screen.getByTestId("mgr-details").querySelector(".mgr-det-preview img")).toBeNull();
  });
});

describe("Clone 3696:20734 · logo-mark.svg", () => {
  it("keeps Place on canvas and Edit image", () => {
    mount(byName("logo-mark.svg"), { usageCount: 5 });
    expect(actionNames()).toEqual(["Place on canvas", "Edit image", "More"]);
    expect(screen.getByTestId("mgr-det-meta")).toHaveTextContent(/^SVG · /);
  });
});

/* A font is neither placed nor replaced; Manage font opens Site fonts on it. */
describe("Clone 3696:21550 · Inter-Var.woff2", () => {
  it("offers Manage font · Rename · More ▾ (Delete asset… · Close) — no alt text", () => {
    mount(byName("Inter-Var.woff2"), { usageCount: 1, onManageFont: vi.fn() });
    expect(actionNames()).toEqual(["Manage font", "Rename", "More"]);
    expect(moreNames()).toEqual(["Delete asset…", "Close"]);
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

/* 2L9 B6-A03 (199:38433) — the family, newest first: "Version N · Selected ·
   Used in N pages" for the one the site carries, "Version N · Available" for
   the rest; a row opens Asset versions; Upload new version… under them. */
describe("2L9 B6-A03 (199:38433) · Versions", () => {
  const original = byName("hero-dark.jpg");
  const saved: LibraryItem = { ...original, key: "hero-v2", name: "hero-dark-v2", src: "blob:hero-v2", versionOf: "hero", createdAt: "2026-10-19T10:00:00.000Z" };
  const family = [
    { item: original, index: 1, placements: 3, pages: ["Home", "Menu"] },
    { item: saved, index: 2, placements: 0, pages: [] },
  ];

  it("names the family and lists Version 2 · Available over Version 1 · Selected · Used in 2 pages", () => {
    mount(original, { versions: family, onUploadVersion: vi.fn() });
    tab("versions");
    expect(screen.getByTestId("mgr-det-family")).toHaveTextContent("hero-dark");
    expect(screen.getByTestId("mgr-det-version-hero-v2")).toHaveTextContent("Version 2 · Available");
    expect(screen.getByTestId("mgr-det-version-hero-v2")).toHaveTextContent("19 Oct 2026 · JPG");
    expect(screen.getByTestId("mgr-det-version-hero")).toHaveTextContent("Version 1 · Selected · Used in 2 pages");
    expect(screen.getByTestId("mgr-det-versions")).toHaveTextContent(
      "A new version does not replace any images until you choose where to use it.",
    );
  });

  it("a row opens Asset versions; Upload new version… asks for this file", () => {
    const onUploadVersion = vi.fn();
    const { props } = mount(original, { versions: family, onUploadVersion });
    tab("versions");
    fireEvent.click(screen.getByTestId("mgr-det-version-hero"));
    expect(props.onOpenVersions).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Upload new version…" }));
    expect(onUploadVersion).toHaveBeenCalledWith(original);
  });

  it("a file with no saved version is its own Version 1", () => {
    mount(byName("team-photo.jpg"));
    tab("versions");
    expect(screen.getByTestId("mgr-det-version-team")).toHaveTextContent("Version 1 · Available");
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

  it("199:37199 — sits under Default alt and above Folder", () => {
    mount(tagged(["team"]), { onUpdateTags: vi.fn(), onUpdateAltText: vi.fn() });
    const order = Array.from(document.querySelectorAll("[data-testid='alt-text-section'], [data-testid='mgr-det-tags'], [data-testid='mgr-det-folder']")).map(
      (el) => el.getAttribute("data-testid"),
    );
    expect(order).toEqual(["alt-text-section", "mgr-det-tags", "mgr-det-folder"]);
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

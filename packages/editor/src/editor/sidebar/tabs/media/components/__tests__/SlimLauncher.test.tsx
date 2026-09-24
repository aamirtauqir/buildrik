/**
 * SlimLauncher — §10 default 280px experience tests.
 *
 * Phase 1 Task 9 (TDD red phase) — asserts the new layout:
 * panel header + TypePills + real search + 3-col asset grid + UploadZone.
 * Implementation rewrite lands in Tasks 11-13; these tests are expected to
 * fail until then.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlimLauncher } from "../SlimLauncher";
import { mockComposer } from "../../__tests__/test-utils/mockComposer";
import { makeAsset, makeFile } from "@/editor/media/__tests__/libraryFixture";
import type { LibraryItem, MediaBucket } from "../../data/mediaTypes";

const baseItem: Omit<LibraryItem, "key" | "name" | "type" | "src" | "thumb"> = {
  size: 1024,
  createdAt: new Date().toISOString(),
  mimeType: "image/jpeg",
};

const makeItem = (overrides: Partial<LibraryItem>): LibraryItem => ({
  ...baseItem,
  key: "a",
  name: "a.jpg",
  type: "img" as const,
  src: "",
  thumb: "",
  ...overrides,
});

const baseProps = () => ({
  composer: mockComposer(),
  libraryItems: [] as LibraryItem[],
  activeTypes: new Set() as ReadonlySet<import("../../data/mediaTypes").MediaBucket>,
  onToggleType: vi.fn(),
  counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
  searchQuery: "",
  storage: { used: 0, total: 5_000_000_000 },
  uploadQueue: [],
  usageMap: new Map<string, number>(),
  onInsert: vi.fn(),

  onSearchChange: vi.fn(),
  onUpload: vi.fn(),
  onOpenStock: vi.fn(),
});

describe("SlimLauncher — §10 default 280px experience", () => {
  // v3 IA Q4 (2026-09-14): the panel is "Assets" — rail label, header and
  // the Webflow/Framer term the target user already uses.
  it("the header reads 'Assets · N' (board 4418:59771)", () => {
    render(<SlimLauncher {...baseProps()} libraryItems={[makeItem({ key: "a" }), makeItem({ key: "b" })]} />);
    expect(screen.getByRole("heading", { name: "Assets · 2" })).toBeInTheDocument();
  });

  it("G3-002: no expand brackets — 'Manage assets ›' is the one door to the library", () => {
    render(<SlimLauncher {...baseProps()} onOpenLibrary={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /^Expand/ })).toBeNull();
    expect(screen.getByTestId("media-manage-assets")).toHaveTextContent(/^Manage assets$/);
  });

  it("G3-011: the header ⋯ offers 'Select assets…' (7077:79223) and it enters select mode", async () => {
    const onToggleSelection = vi.fn();
    const user = userEvent.setup();
    render(<SlimLauncher {...baseProps()} onToggleSelection={onToggleSelection} />);
    await user.click(screen.getByTestId("media-panel-menu"));
    await user.click(screen.getByRole("menuitem", { name: "Select assets…" }));
    expect(onToggleSelection).toHaveBeenCalledTimes(1);
  });

  it("G3-005: one 'Filter' button (4418:59771) — no chips, no folder row", async () => {
    const user = userEvent.setup();
    render(<SlimLauncher {...baseProps()} counts={{ all: 5, img: 2, vid: 1, ico: 1, fnt: 1 }} />);
    expect(screen.queryByTestId("media-type-chips")).toBeNull();
    expect(screen.queryByTestId("media-folder-row")).toBeNull();
    await user.click(screen.getByTestId("media-filter"));
    // Board 7077:79171: TYPE · All · Images · Video · SVG · Icons, then FOLDER.
    const rows = screen.getAllByRole("menuitemradio").map((r) => r.textContent);
    expect(rows).toEqual(["✓All5", "Images2", "Video1", "SVG1", "Icons1"]);
    expect(screen.getByText("TYPE")).toBeInTheDocument();
    expect(screen.getByText("FOLDER")).toBeInTheDocument();
    expect(screen.getByTestId("media-folder-scope")).toHaveTextContent("All");
  });

  // T8: the board moved Stock out of the header and into the footer beside
  // Upload (144:46), so the two ways of getting media in sit together. The
  // "+ Stock" button next to the filters is gone, not renamed.
  it("G3-020: Upload's caret opens ADD FROM · Stock photos · Icons · Fonts (7077:79204)", async () => {
    const user = userEvent.setup();
    render(<SlimLauncher {...baseProps()} onOpenIconPicker={vi.fn()} />);
    expect(screen.getByTestId("media-upload-action")).toHaveTextContent("Upload");
    expect(screen.queryByTestId("media-footer-links")).toBeNull();
    expect(screen.queryByTestId("media-stock-action")).toBeNull();
    await user.click(screen.getByTestId("media-add-from"));
    expect(screen.getByText("ADD FROM")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem").map((b) => b.textContent?.trim())).toEqual(["Stock photos", "Icons", "AaFonts"]);
  });

  it("no search box in the drawer — the topbar field searches (4418:59771)", () => {
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.queryByTestId("media-search")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("renders 3-col asset grid (AssetGrid component) when libraryItems present", () => {
    const items = [
      makeItem({ key: "a", name: "a.jpg", type: "img", src: "x", thumb: "x" }),
      makeItem({ key: "b", name: "b.jpg", type: "img", src: "y", thumb: "y" }),
    ];
    const { container } = render(<SlimLauncher {...baseProps()} libraryItems={items} />);
    const grid = container.querySelector(".med-asset-grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.children.length).toBe(2);
  });

  it("renders UploadZone at bottom", () => {
    const { container } = render(<SlimLauncher {...baseProps()} />);
    expect(container.querySelector(".med-upload-zone")).toBeInTheDocument();
  });

  it("renders the board empty state — one muted line, one link", () => {
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.getByText("No images or files yet.")).toBeInTheDocument();
    expect(screen.getByTestId("media-empty-cta")).toHaveTextContent("Browse stock");
  });

  it("the empty screen offers each act ONCE", () => {
    /* On an empty library three things stacked in one column all did the same
       thing: the empty block's Upload link, the drop zone under it saying
       "Drag files or click to browse", and the footer's Upload. The block's
       copy is the board's; the duplication was not. */
    const { container } = render(<SlimLauncher {...baseProps()} />);
    expect(screen.queryByTestId("media-empty-upload")).toBeNull();
    // The two that remain, both still reachable.
    expect(container.querySelector(".med-upload-zone")).toBeInTheDocument();
    expect(screen.getByTestId("media-upload-action")).toBeInTheDocument();
  });

  it("the caret door is 'Stock photos' (7077:79204) and the empty CTA says what pressing it does", () => {
    render(<SlimLauncher {...baseProps()} />);
    fireEvent.click(screen.getByTestId("media-add-from"));
    expect(screen.getByTestId("media-stock-action")).toHaveTextContent("Stock photos");
    expect(screen.getByTestId("media-empty-cta")).toHaveTextContent("Browse stock");
  });

  // Board 7077:79171: TYPE is a one-of list (leading ✓ on the current row).
  it("Filter TYPE is one-of: a row narrows, another replaces it, All restores", async () => {
    function Harness() {
      const [types, setTypes] = React.useState<ReadonlySet<MediaBucket>>(new Set());
      const items = [
        makeItem({ key: "a", name: "a.jpg", type: "img", src: "x", thumb: "x" }),
        makeItem({ key: "b", name: "b.mp4", type: "vid", src: "y", thumb: "y" }),
        makeItem({ key: "c", name: "c.svg", type: "ico", src: "z", thumb: "z" }),
      ];
      return (
        <SlimLauncher
          {...baseProps()}
          libraryItems={items}
          /* The counts have to agree with the items. `baseProps` ships all
             zeros, and a pill at zero is now disabled — it filters to a state
             with nothing in it, which is a dead end the chip had already
             announced. A fixture whose counts contradict its own library was
             asserting on a shape the product cannot produce. */
          counts={{ all: 3, img: 1, vid: 1, ico: 1, fnt: 0 }}
          activeTypes={types}
          onToggleType={(t) =>
            setTypes((prev) => {
              const next = new Set(prev);
              if (next.has(t)) next.delete(t);
              else next.add(t);
              return next;
            })
          }
        />
      );
    }
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const cells = () => container.querySelectorAll(".med-asset-cell").length;
    expect(cells()).toBe(3);
    await user.click(screen.getByTestId("media-filter"));
    await user.click(screen.getByRole("menuitemradio", { name: /^Video/i }));
    expect(cells()).toBe(1);
    // One-of (7077:79171): Images REPLACES Video.
    await user.click(screen.getByRole("menuitemradio", { name: /Images/i }));
    expect(cells()).toBe(1);
    expect(screen.getByRole("menuitemradio", { name: /Images/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: /Video/i })).toHaveAttribute("aria-checked", "false");
    await user.click(screen.getByRole("menuitemradio", { name: /All/ }));
    expect(cells()).toBe(3);
  });

  it("opens stock modal from the caret's Stock photos", async () => {
    const onOpenStock = vi.fn();
    const user = userEvent.setup();
    render(<SlimLauncher {...baseProps()} onOpenStock={onOpenStock} />);
    await user.click(screen.getByTestId("media-add-from"));
    await user.click(screen.getByTestId("media-stock-action"));
    expect(onOpenStock).toHaveBeenCalledOnce();
  });

  // The drawer had no retry at all before T9 — MediaTab wired state.retryUpload
  // into the fullpage branch only, so a failed upload here was a dead end.
  // Clone 3584:45522 keeps Retry for a failure that is not the size gate —
  // a size failure's door is "Choose a smaller file…" (UploadZone.test).
  it("a failed upload keeps a working Retry", async () => {
    const onRetryUpload = vi.fn();
    const user = userEvent.setup();
    render(
      <SlimLauncher
        {...baseProps()}
        onRetryUpload={onRetryUpload}
        uploadQueue={[{ fileName: "poster.png", progress: 0, status: "error", error: "Server rejected" }]}
        failedUploads={[{ fileName: "poster.png", reason: "Server rejected" }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Retry poster.png/i }));
    expect(onRetryUpload).toHaveBeenCalledWith("poster.png");
  });
});

/* ─── P3-U · the drawer against the Clone ──────────────────────────────── */

const MB = 1024 * 1024;

/* Clone 3437:36027 (Build · Choose media) — the drawer baseline. */
describe("Clone 3437:36027 · drawer baseline", () => {
  it("Upload names the kinds and the code's own limits on its tooltip — not the board's 50 MB", () => {
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.getByTestId("media-upload-action")).toHaveAttribute(
      "title",
      "Images, videos and fonts · up to 10 MB per image · 1 MB per SVG · 100 MB per video · 5 MB per font",
    );
    expect(screen.queryByTestId("media-footer-accepts")).toBeNull();
  });

  /* The footer row is `↑ Upload · Stock · Icons · Aa Fonts`. The fourth door
     is Phase 5's (3686:42317): it opens the Site fonts dialog through the
     one composer event the dialog listens for, with no file to highlight. */
  it("Add from › Fonts opens Site fonts through ui:site-fonts", () => {
    const composer = mockComposer();
    render(<SlimLauncher {...baseProps()} composer={composer} onOpenIconPicker={vi.fn()} />);
    fireEvent.click(screen.getByTestId("media-add-from"));
    fireEvent.click(screen.getByTestId("media-fonts-action"));
    expect(composer.emit).toHaveBeenCalledWith("ui:site-fonts", {});
  });

  it("'Manage assets ›' sits under the header and opens the full library", async () => {
    const onOpenLibrary = vi.fn();
    const user = userEvent.setup();
    render(<SlimLauncher {...baseProps()} onOpenLibrary={onOpenLibrary} />);
    const manage = screen.getByTestId("media-manage-assets");
    expect(manage).toHaveTextContent("Manage assets");
    // Under the header, above the Filter row (4418:59771).
    expect(manage.compareDocumentPosition(screen.getByTestId("media-filter")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(manage);
    expect(onOpenLibrary).toHaveBeenCalledTimes(1);
  });
});

/* Clone 3584:45522 → 3585:23326 → 3584:45876 → 3585:23337: the rejected
   row's replacement flow, end to end, in the drawer. */
describe("Clone 3585:23326 / 3585:23337 · replacement upload from the drawer", () => {
  const rejected = {
    fileName: "pasta-2.jpg",
    reason: "Upload failed — file is 62 MB, the limit is 10 MB per file",
    size: 62 * MB,
    limit: 10 * MB,
  };
  const queueRow = { fileName: "pasta-2.jpg", progress: 0, status: "error" as const, error: rejected.reason };

  function pickReplacement(file: File) {
    const click = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByTestId("media-upload-error-replace"));
    click.mockRestore();
    fireEvent.change(screen.getByTestId("media-replacement-input"), { target: { files: [file] } });
  }

  it("Choose a smaller file… → the confirm names the pick; Cancel keeps the rejected row", () => {
    render(<SlimLauncher {...baseProps()} uploadQueue={[queueRow]} failedUploads={[rejected]} onDismissUpload={vi.fn()} />);
    pickReplacement(makeFile("pasta-2-small.jpg", 8 * MB));
    expect(screen.getByTestId("media-replacement-modal")).toBeInTheDocument();
    expect(screen.getByTestId("media-replacement-file")).toHaveTextContent("pasta-2-small.jpg · 8 MB");
    fireEvent.click(screen.getByTestId("media-replacement-cancel"));
    expect(screen.queryByTestId("media-replacement-modal")).toBeNull();
    expect(screen.getByTestId("media-upload-error-row")).toBeInTheDocument();
  });

  it("Upload file uploads the replacement, drops the rejected row, and the banner reads the result", async () => {
    const landed = makeAsset({ id: "srv-1", name: "pasta-2-small", originalName: "pasta-2-small.jpg", mimeType: "image/webp", size: 8 * MB });
    const onUpload = vi.fn(() => Promise.resolve([{ success: true, asset: landed, fileName: "pasta-2-small.jpg" }]));
    const onDismissUpload = vi.fn();
    const onOpenLibrary = vi.fn();
    const composer = mockComposer();
    render(
      <SlimLauncher
        {...baseProps()}
        composer={composer}
        uploadQueue={[queueRow]}
        failedUploads={[rejected]}
        onUpload={onUpload}
        onDismissUpload={onDismissUpload}
        onOpenLibrary={onOpenLibrary}
      />,
    );
    const smaller = makeFile("pasta-2-small.jpg", 8 * MB);
    pickReplacement(smaller);
    fireEvent.click(screen.getByTestId("media-replacement-confirm"));
    expect(onDismissUpload).toHaveBeenCalledWith("pasta-2.jpg");
    expect(onUpload).toHaveBeenCalledWith([smaller]);
    expect(screen.queryByTestId("media-replacement-modal")).toBeNull();
    // 3585:23337 — the banner at the top of the drawer. It names the file the
    // LIBRARY prints: the pipeline landed a WebP (code:auto-webp), so the
    // banner and the rail cannot disagree on what the file is called.
    const banner = await screen.findByTestId("media-replacement-banner");
    expect(within(banner).getByTestId("media-replacement-name")).toHaveTextContent("pasta-2-small.webp");
    expect(within(banner).getByTestId("media-replacement-meta")).toHaveTextContent("Uploaded · WEBP · 8 MB · In site library");
    // Above the Filter row, below Manage assets.
    expect(banner.compareDocumentPosition(screen.getByTestId("media-filter")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("media-manage-assets").compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Manage in full library → the fullpage with this file selected.
    fireEvent.click(within(banner).getByTestId("media-replacement-manage"));
    expect(composer.media.selectAssets).toHaveBeenCalledWith(["srv-1"]);
    expect(onOpenLibrary).toHaveBeenCalledTimes(1);
  });

  it("a replacement that stayed on this device says so instead of 'In site library'", async () => {
    const landed = makeAsset({ id: "loc-1", name: "pasta-2-small", originalName: "pasta-2-small.jpg", mimeType: "image/jpeg", size: 8 * MB, localOnly: true });
    const onUpload = vi.fn(() => Promise.resolve([{ success: true, asset: landed, fileName: "pasta-2-small.jpg" }]));
    render(<SlimLauncher {...baseProps()} uploadQueue={[queueRow]} failedUploads={[rejected]} onUpload={onUpload} onDismissUpload={vi.fn()} />);
    pickReplacement(makeFile("pasta-2-small.jpg", 8 * MB));
    fireEvent.click(screen.getByTestId("media-replacement-confirm"));
    const banner = await screen.findByTestId("media-replacement-banner");
    expect(within(banner).getByTestId("media-replacement-meta")).toHaveTextContent("Uploaded · JPG · 8 MB · On this device only");
  });

  it("a replacement the engine refuses draws no banner — its own rejected row is the door", async () => {
    const onUpload = vi.fn(() =>
      Promise.resolve([{ success: false, error: "Upload failed — file is 12 MB, the limit is 10 MB per file", fileName: "pasta-2-medium.jpg" }]),
    );
    render(<SlimLauncher {...baseProps()} uploadQueue={[queueRow]} failedUploads={[rejected]} onUpload={onUpload} onDismissUpload={vi.fn()} />);
    pickReplacement(makeFile("pasta-2-medium.jpg", 9 * MB));
    fireEvent.click(screen.getByTestId("media-replacement-confirm"));
    await vi.waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("media-replacement-banner")).toBeNull();
  });
});

/* Two dead ends the drawer used to walk a user into, both measured live at
   1440x900 before they were closed. */
describe("SlimLauncher — filters that lead nowhere", () => {
  const items = [
    makeItem({ key: "a", name: "a.jpg", type: "img", src: "x", thumb: "x" }),
    makeItem({ key: "b", name: "b.mp4", type: "vid", src: "y", thumb: "y" }),
  ];
  const withLibrary = (over = {}) => ({
    ...baseProps(),
    libraryItems: items,
    counts: { all: 2, img: 1, vid: 1, ico: 0, fnt: 0 },
    ...over,
  });

  it("a type at zero cannot be clicked, and says why", async () => {
    // It offered a filter whose only possible result was "nothing here".
    render(<SlimLauncher {...withLibrary()} />);
    await userEvent.setup().click(screen.getByTestId("media-filter"));
    const svg = screen.getByTestId("media-type-chip-ico");
    expect(svg).toBeDisabled();
    expect(svg.getAttribute("title")).toMatch(/no svg in this library/i);
    // The ones that would return something stay live.
    expect(screen.getByTestId("media-type-chip-img")).not.toBeDisabled();
  });

  it("a type at zero stays clickable while it is the ACTIVE filter", async () => {
    // Deleting the last SVG while filtered to SVG must not remove the control
    // that clears the filter.
    render(
      <SlimLauncher {...withLibrary({ activeTypes: new Set<MediaBucket>(["ico"]) })} />,
    );
    await userEvent.setup().click(screen.getByTestId("media-filter"));
    expect(screen.getByTestId("media-type-chip-ico")).not.toBeDisabled();
  });

  it("the filtered-empty state offers a way back out", async () => {
    const onToggleType = vi.fn();
    const user = userEvent.setup();
    render(
      <SlimLauncher
        {...withLibrary({ activeTypes: new Set<MediaBucket>(["ico"]), onToggleType })}
      />,
    );
    expect(screen.getByTestId("media-no-results")).toBeInTheDocument();
    await user.click(screen.getByTestId("media-clear-filter"));
    // Clearing means un-toggling every type that is on, not just the first.
    expect(onToggleType).toHaveBeenCalledWith("ico");
  });

  it("Clear filter releases EVERY active type, not one", async () => {
    const onToggleType = vi.fn();
    const user = userEvent.setup();
    render(
      <SlimLauncher
        {...withLibrary({
          activeTypes: new Set<MediaBucket>(["ico", "fnt"]),
          onToggleType,
        })}
      />,
    );
    await user.click(screen.getByTestId("media-clear-filter"));
    expect(onToggleType.mock.calls.map((c) => c[0]).sort()).toEqual(["fnt", "ico"]);
  });
});


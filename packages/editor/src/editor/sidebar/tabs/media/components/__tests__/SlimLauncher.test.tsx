/**
 * SlimLauncher — §10 default 320px experience tests.
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
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlimLauncher } from "../SlimLauncher";
import { mockComposer } from "../../__tests__/test-utils/mockComposer";
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

describe("SlimLauncher — §10 default 320px experience", () => {
  it("renders panel header with 'Media' title", () => {
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.getByRole("heading", { name: /^Media$/ })).toBeInTheDocument();
  });

  it("renders TypePills row", () => {
    const { container } = render(<SlimLauncher {...baseProps()} />);
    expect(container.querySelector(".med-type-pills")).toBeInTheDocument();
  });

  // T8: the board moved Stock out of the header and into the footer beside
  // Upload (144:46), so the two ways of getting media in sit together. The
  // "+ Stock" button next to the filters is gone, not renamed.
  it("offers Stock from the footer, beside Upload", () => {
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.getByTestId("media-stock-action")).toBeInTheDocument();
    expect(screen.getByTestId("media-upload-action")).toBeInTheDocument();
  });

  it("renders real search input (not ghost button)", () => {
    render(<SlimLauncher {...baseProps()} />);
    // Placeholder is the board's own copy (144:9) — "Search", not "Search library…".
    expect(screen.getByLabelText(/Search library/i)).toBeInTheDocument();
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

  it("one door, one name — stock is worded the same everywhere", () => {
    // The footer said "Stock" while the empty and error states said "Browse
    // stock", in the same panel.
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.getByTestId("media-stock-action")).toHaveTextContent("Browse stock");
    expect(screen.getByTestId("media-empty-cta")).toHaveTextContent("Browse stock");
  });

  // Board 145:2 caption: the pills are a MULTI-select filter — a second pill
  // widens the result instead of replacing it, and empty selection = all.
  it("type pills multi-select: one pill narrows, a second widens, deselect-all restores", async () => {
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
    await user.click(screen.getByRole("button", { name: /^Video/i }));
    expect(cells()).toBe(1);
    await user.click(screen.getByRole("button", { name: /^Images/i }));
    expect(cells()).toBe(2);
    await user.click(screen.getByRole("button", { name: /^Video/i }));
    await user.click(screen.getByRole("button", { name: /^Images/i }));
    expect(cells()).toBe(3);
  });

  it("opens stock modal from the footer Stock link", async () => {
    const onOpenStock = vi.fn();
    const user = userEvent.setup();
    render(<SlimLauncher {...baseProps()} onOpenStock={onOpenStock} />);
    await user.click(screen.getByTestId("media-stock-action"));
    expect(onOpenStock).toHaveBeenCalledOnce();
  });

  // The drawer had no retry at all before T9 — MediaTab wired state.retryUpload
  // into the fullpage branch only, so a failed upload here was a dead end.
  it("a failed upload keeps a working Retry", async () => {
    const onRetryUpload = vi.fn();
    const user = userEvent.setup();
    render(
      <SlimLauncher
        {...baseProps()}
        onRetryUpload={onRetryUpload}
        uploadQueue={[{ fileName: "poster.png", progress: 0, status: "error", error: "Upload failed — file is 24 MB, limit is 10 MB" }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Retry poster.png/i }));
    expect(onRetryUpload).toHaveBeenCalledWith("poster.png");
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

  it("a pill at zero cannot be clicked, and says why", () => {
    // It offered a filter whose only possible result was "nothing here".
    render(<SlimLauncher {...withLibrary()} />);
    const svg = screen.getByTestId("media-type-chip-ico");
    expect(svg).toBeDisabled();
    expect(svg.getAttribute("title")).toMatch(/no svg files/i);
    // The ones that would return something stay live.
    expect(screen.getByTestId("media-type-chip-img")).not.toBeDisabled();
  });

  it("a pill at zero stays clickable while it is the ACTIVE filter", () => {
    // Deleting the last SVG while filtered to SVG must not remove the control
    // that clears the filter.
    render(
      <SlimLauncher {...withLibrary({ activeTypes: new Set<MediaBucket>(["ico"]) })} />,
    );
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


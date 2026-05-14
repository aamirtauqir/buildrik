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
import type { LibraryItem, MediaTypeFilter } from "../../data/mediaTypes";

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
  activeType: "all" as const,
  counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
  searchQuery: "",
  storage: { used: 0, total: 5_000_000_000 },
  uploadQueue: [],
  usageMap: new Map<string, number>(),
  onInsert: vi.fn(),
  onTypeChange: vi.fn(),
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

  it("renders '+ Stock' primary button", () => {
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.getByRole("button", { name: /\+ Stock/i })).toBeInTheDocument();
  });

  it("renders real search input (not ghost button)", () => {
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.getByPlaceholderText(/Search library/i)).toBeInTheDocument();
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

  it("renders empty state when no assets", () => {
    render(<SlimLauncher {...baseProps()} />);
    expect(screen.getByText(/Your library is empty/i)).toBeInTheDocument();
  });

  it("filters grid by type pill click", async () => {
    function Harness() {
      const [type, setType] = React.useState<MediaTypeFilter>("all");
      const items = [
        makeItem({ key: "a", name: "a.jpg", type: "img", src: "x", thumb: "x" }),
        makeItem({ key: "b", name: "b.mp4", type: "vid", src: "y", thumb: "y" }),
      ];
      return (
        <SlimLauncher
          {...baseProps()}
          libraryItems={items}
          activeType={type}
          onTypeChange={setType}
        />
      );
    }
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.click(screen.getByRole("tab", { name: /^Video/i }));
    const cells = container.querySelectorAll(".med-asset-cell");
    expect(cells.length).toBe(1);
  });

  it("opens stock modal when '+ Stock' clicked", async () => {
    const onOpenStock = vi.fn();
    const user = userEvent.setup();
    render(<SlimLauncher {...baseProps()} onOpenStock={onOpenStock} />);
    await user.click(screen.getByRole("button", { name: /\+ Stock/i }));
    expect(onOpenStock).toHaveBeenCalledOnce();
  });
});

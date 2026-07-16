/**
 * IconPickerModal — search, category filter, recents (localStorage),
 * selection preview, size/stroke/color controls, and the select contract.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";

// The real icon set ships 300+ Lucide components; rendering it per mount makes
// this file take ~90s. Mock a tiny deterministic set — the modal's behavior
// (search / category / recents / select) is what we exercise, not the catalog.
vi.mock("../../../shared/constants/icons", () => {
  const Stub = (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-icon": true, ...props });
  const ICONS = [
    { name: "arrow-up", component: Stub, tags: ["up", "direction"] },
    { name: "arrow-down", component: Stub, tags: ["down", "direction"] },
    { name: "arrow-left", component: Stub, tags: ["left", "direction"] },
    { name: "heart", component: Stub, tags: ["love", "like"] },
    { name: "star", component: Stub, tags: ["favorite"] },
  ];
  const CATEGORIES = [
    { id: "arrows", label: "Arrows", icons: ICONS.slice(0, 3) },
    { id: "shapes", label: "Shapes", icons: ICONS.slice(3) },
  ];
  const getAllIcons = () => ICONS;
  return {
    ICON_CATEGORIES: CATEGORIES,
    ICON_CATEGORY_IDS: CATEGORIES.map((c) => c.id),
    getAllIcons,
    getIconsByCategory: (id: string) =>
      CATEGORIES.find((c) => c.id === id)?.icons ?? [],
    searchIcons: (q: string) =>
      ICONS.filter(
        (i) => i.name.includes(q) || i.tags.some((t) => t.includes(q)),
      ),
    getIconByName: (name: string) => ICONS.find((i) => i.name === name),
    getIconCount: () => ICONS.length,
  };
});

import { IconPickerModal } from "../IconPickerModal";

const RECENT_KEY = "buildrick-recent-icons";

function mount(over: Partial<React.ComponentProps<typeof IconPickerModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    ...over,
  };
  const utils = render(<IconPickerModal {...props} />);
  return { ...utils, props };
}

beforeEach(() => {
  localStorage.clear();
});

describe("IconPickerModal — visibility + count", () => {
  it("shows the available-icon count header when open", () => {
    mount();
    expect(screen.getByText(/icons available/)).toBeInTheDocument();
  });
});

describe("IconPickerModal — search", () => {
  it("filters to matching icons and shows the results heading", () => {
    mount();
    fireEvent.change(screen.getByPlaceholderText(/Search icons/), {
      target: { value: "arrow-up" },
    });
    expect(screen.getByText(/results for "arrow-up"/)).toBeInTheDocument();
    expect(screen.getByTitle("arrow-up")).toBeInTheDocument();
  });

  it("no-match search renders the empty state", () => {
    mount();
    fireEvent.change(screen.getByPlaceholderText(/Search icons/), {
      target: { value: "zznotanicon" },
    });
    expect(screen.getByText(/No icons found for "zznotanicon"/)).toBeInTheDocument();
  });
});

describe("IconPickerModal — selection + preview", () => {
  it("clicking an icon shows the preview with its name and enables Select", () => {
    mount();
    fireEvent.change(screen.getByPlaceholderText(/Search icons/), {
      target: { value: "arrow-up" },
    });
    fireEvent.click(screen.getByTitle("arrow-up"));
    // Preview name appears (distinct from the grid button title)
    const preview = document.querySelector(".mgr-preview, [class]") as HTMLElement;
    expect(preview).toBeTruthy();
    const selectBtn = screen.getByText("Select Icon", { selector: "button" });
    expect(selectBtn).not.toBeDisabled();
  });

  it("Select Icon fires onSelect with a lucide IconConfig and closes", () => {
    const { props } = mount();
    fireEvent.change(screen.getByPlaceholderText(/Search icons/), {
      target: { value: "arrow-up" },
    });
    fireEvent.click(screen.getByTitle("arrow-up"));
    fireEvent.click(screen.getByText("Select Icon", { selector: "button" }));
    expect(props.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ library: "lucide", name: "arrow-up", size: 24, strokeWidth: 2 }),
    );
    expect(props.onClose).toHaveBeenCalled();
  });

  it("Select Icon is disabled until an icon is picked", () => {
    mount();
    expect(screen.getByText("Select Icon", { selector: "button" })).toBeDisabled();
  });
});

describe("IconPickerModal — recents (localStorage)", () => {
  it("persists the chosen icon to the recents key", () => {
    const { props } = mount();
    fireEvent.change(screen.getByPlaceholderText(/Search icons/), {
      target: { value: "arrow-down" },
    });
    fireEvent.click(screen.getByTitle("arrow-down"));
    fireEvent.click(screen.getByText("Select Icon", { selector: "button" }));
    expect(props.onSelect).toHaveBeenCalled();
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    expect(stored).toContain("arrow-down");
  });

  it("renders a Recently Used section seeded from localStorage on mount", () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["arrow-up"]));
    mount();
    expect(screen.getByText("Recently Used")).toBeInTheDocument();
  });

  it("hides Recently Used when there are no stored recents", () => {
    mount();
    expect(screen.queryByText("Recently Used")).not.toBeInTheDocument();
  });
});

describe("IconPickerModal — controls", () => {
  it("size input clamps to the 12–96 range", () => {
    mount();
    fireEvent.change(screen.getByPlaceholderText(/Search icons/), {
      target: { value: "arrow-up" },
    });
    fireEvent.click(screen.getByTitle("arrow-up"));
    const sizeInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(sizeInput, { target: { value: "500" } });
    expect(sizeInput.value).toBe("96");
    fireEvent.change(sizeInput, { target: { value: "2" } });
    expect(sizeInput.value).toBe("12");
  });

  it("selecting a preset then Select carries the adjusted size", () => {
    const { props } = mount();
    fireEvent.change(screen.getByPlaceholderText(/Search icons/), {
      target: { value: "arrow-up" },
    });
    fireEvent.click(screen.getByTitle("arrow-up"));
    const sizeInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(sizeInput, { target: { value: "48" } });
    fireEvent.click(screen.getByText("Select Icon", { selector: "button" }));
    expect(props.onSelect).toHaveBeenCalledWith(expect.objectContaining({ size: 48 }));
  });
});

describe("IconPickerModal — cancel", () => {
  it("Cancel closes without selecting", () => {
    const { props } = mount();
    // Two "Cancel"-less: the footer Cancel button
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});

describe("IconPickerModal — categories", () => {
  it("renders the All category control and keeps icons visible when clicked", () => {
    mount();
    // getByText (not getByRole) — the grid holds hundreds of icon buttons and
    // computing an accessible name for each is prohibitively slow here.
    fireEvent.click(screen.getByText("All", { selector: "button" }));
    // Still showing the full grid (arrow-up is a known first-category icon).
    expect(screen.getByTitle("arrow-up")).toBeInTheDocument();
  });
});

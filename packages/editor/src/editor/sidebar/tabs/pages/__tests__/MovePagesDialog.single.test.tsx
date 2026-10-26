/**
 * MovePagesDialog, one page — design-2l9 boards 127:38098 / 131:40341.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MovePagesDialog, TOP_LEVEL } from "../components/MovePagesDialog";

const folders = [
  { id: "f1", name: "Client projects", pageIds: [], collapsed: false },
  { id: "f2", name: "Studio", pageIds: [], collapsed: false },
];

describe("MovePagesDialog — one page", () => {
  it("names the page and its URL, and moves to the picked folder", () => {
    const onMove = vi.fn();
    render(<MovePagesDialog open pageNames={["About"]} folders={folders} current={{ target: TOP_LEVEL, url: "/about" }} onMove={onMove} onClose={vi.fn()} />);
    expect(screen.getByText("Move About to…")).toBeInTheDocument();
    expect(screen.getByText("Choose where to organize About. Folders are personal; only you see them. The page URL /about stays unchanged.")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Studio"));
    fireEvent.click(screen.getByTestId("pages-move-confirm"));
    expect(onMove).toHaveBeenCalledWith("f2");
  });

  it("refuses the place it already is", () => {
    const onMove = vi.fn();
    render(<MovePagesDialog open pageNames={["About"]} folders={folders} current={{ target: TOP_LEVEL, url: "/about" }} onMove={onMove} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Top level (no folder)"));
    expect(screen.getByTestId("pages-move-already").textContent).toBe("About is already at the top level. No change is needed.");
    expect(screen.getByTestId("pages-move-confirm")).toHaveTextContent("Already at top level");
    expect(screen.getByTestId("pages-move-confirm")).toBeDisabled();
  });
});

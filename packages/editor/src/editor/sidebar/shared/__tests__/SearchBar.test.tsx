/**
 * SearchBar.test.tsx — debounce contract, immediate clear, telemetry.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { SearchBar } from "../SearchBar";

const { trackSidebarMock } = vi.hoisted(() => ({ trackSidebarMock: vi.fn() }));

vi.mock("@/shared/utils/sidebarAnalytics", () => ({
  trackSidebar: trackSidebarMock,
}));

beforeEach(() => {
  vi.useFakeTimers();
  trackSidebarMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

function type(value: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value } });
}

describe("SearchBar — debounce", () => {
  it("updates the visible input immediately but delays onChange by 300ms (default)", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    type("hero");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("hero");
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("hero");
  });

  it("collapses rapid keystrokes into a single trailing onChange", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    type("h");
    vi.advanceTimersByTime(100);
    type("he");
    vi.advanceTimersByTime(100);
    type("her");
    vi.advanceTimersByTime(300);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("her");
  });

  it("respects a custom debounceMs", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={50} />);
    type("x");
    vi.advanceTimersByTime(50);
    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("fires synchronously when debounceMs=0", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={0} />);
    type("instant");
    expect(onChange).toHaveBeenCalledWith("instant");
  });

  it("does not fire a stale onChange after unmount", () => {
    const onChange = vi.fn();
    const { unmount } = render(<SearchBar value="" onChange={onChange} />);
    type("bye");
    unmount();
    vi.advanceTimersByTime(300);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("SearchBar — no inline chrome (board 137:8)", () => {
  it("draws no ✕ clear button and no magnifier — the box is text + hint only", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    type("abc");
    expect(screen.queryByRole("button", { name: /clear search/i })).toBeNull();
    expect(document.querySelector("svg")).toBeNull();
  });
});

describe("SearchBar — value sync + hint", () => {
  it("syncs the input when the parent value prop changes (external clear)", () => {
    const { rerender } = render(<SearchBar value="old" onChange={vi.fn()} />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("old");
    rerender(<SearchBar value="" onChange={vi.fn()} />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
  });

  it("keeps kbdHint visible while typing — board 138:53 shows text and ⌘F together", () => {
    render(<SearchBar value="" onChange={vi.fn()} kbdHint="/" />);
    expect(document.querySelector(".bld-kbd-hint")?.textContent).toBe("/");
    type("q");
    expect(document.querySelector(".bld-kbd-hint")?.textContent).toBe("/");
  });

  it("applies the accessible label to the input", () => {
    render(<SearchBar value="" onChange={vi.fn()} ariaLabel="Search templates" />);
    expect(screen.getByRole("textbox", { name: "Search templates" })).toBeInTheDocument();
  });
});

describe("SearchBar — telemetry", () => {
  it("tracks a search after the debounce fires (non-empty query)", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    type("abc");
    expect(trackSidebarMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(trackSidebarMock).toHaveBeenCalledWith("search", { query_length: 3 });
  });

  it("tracks even in instant mode (debounceMs=0 regression)", () => {
    render(<SearchBar value="" onChange={vi.fn()} debounceMs={0} />);
    type("ab");
    expect(trackSidebarMock).toHaveBeenCalledWith("search", { query_length: 2 });
  });

  it("does not track empty queries", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    type("a");
    type("");
    vi.advanceTimersByTime(300);
    expect(trackSidebarMock).not.toHaveBeenCalled();
  });
});

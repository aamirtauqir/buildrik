// @vitest-environment jsdom
/**
 * PagesTab — a page brought back by ⌘Z is named under the list (design-2l9
 * board 63:20585): "About restored. Page settings and URL retained." with
 * "Open About in Editor".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { createMockComposer, pg } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import PagesTab from "../PagesTab";

afterEach(cleanup);

describe("PagesTab — restored page note", () => {
  it("names a page that comes back and opens it", () => {
    const c = createMockComposer({ pages: [pg("home", "Home", { isHome: true }), pg("about", "About"), pg("work", "Work")] });
    render(
      <ToastProvider>
        <PagesTab composer={c} />
      </ToastProvider>,
    );
    expect(screen.queryByTestId("pages-notice")).toBeNull();
    const about = c._pages.splice(1, 1)[0];
    act(() => c._emit(EVENTS.PROJECT_CHANGED, { type: "page:delete" }));
    expect(screen.queryByTestId("pages-notice")).toBeNull();
    c._pages.splice(1, 0, about);
    act(() => c._emit(EVENTS.PROJECT_CHANGED, { type: "page:add" }));
    expect(screen.getByTestId("pages-notice")).toHaveTextContent("About restored. Page settings and URL retained.");
    fireEvent.click(screen.getByTestId("pages-notice-open"));
    expect(c.elements.setActivePage).toHaveBeenCalledWith("about");
    expect(screen.queryByTestId("pages-notice")).toBeNull();
  });

  // design-2l9 63:23182: a rename that keeps its URL says so under the list.
  it("a Keep URL rename leaves 'Page renamed. URL kept at /about.' under the list", () => {
    const c = createMockComposer({ pages: [pg("home", "Home", { isHome: true }), pg("about", "About", { slug: "about" })] });
    render(
      <ToastProvider>
        <PagesTab composer={c} />
      </ToastProvider>,
    );
    fireEvent.keyDown(screen.getByTestId("page-row-about"), { key: "F2" });
    const input = screen.getByLabelText("Rename page");
    fireEvent.change(input, { target: { value: "Our story" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Keep URL" }));
    expect(screen.getByTestId("pages-notice")).toHaveTextContent("Page renamed. URL kept at /about.");
    expect(screen.queryByTestId("pages-notice-open")).toBeNull();
  });
});

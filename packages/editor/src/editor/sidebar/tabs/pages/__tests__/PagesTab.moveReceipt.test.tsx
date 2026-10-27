// @vitest-environment jsdom
/**
 * PagesTab — the order receipt (design-2l9 boards 137:53911 / 137:59625):
 * "About moved to position 3" with an Undo that puts it back.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { createMockComposer, pg, type MockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import PagesTab from "../PagesTab";

afterEach(cleanup);

/* The mock has no page order; this gives it the engine's reorderPage contract:
   put `id` after `afterId` (null = first), true when it moved. */
function site(): MockComposer {
  const c = createMockComposer({
    pages: [pg("home", "Home", { isHome: true }), pg("about", "About"), pg("work", "Work"), pg("contact", "Contact")],
  });
  const pages = c._pages;
  Object.assign(c.elements, {
    reorderPage: (id: string, afterId: string | null) => {
      const from = pages.findIndex((p) => p.id === id);
      const [page] = pages.splice(from, 1);
      pages.splice(afterId ? pages.findIndex((p) => p.id === afterId) + 1 : 0, 0, page);
      c._emit(EVENTS.PROJECT_CHANGED, { type: "page:reorder" });
      return true;
    },
  });
  return c;
}

const names = (c: MockComposer) => c._pages.map((p) => p.name);

describe("PagesTab — move receipt", () => {
  it("says the new position and Undo restores the order", () => {
    const c = site();
    render(
      <ToastProvider>
        <PagesTab composer={c} />
      </ToastProvider>,
    );
    fireEvent.click(within(screen.getByTestId("page-row-about")).getByRole("button", { name: "More options for About" }));
    fireEvent.click(screen.getByTestId("pages-menu-move-down"));
    expect(names(c)).toEqual(["Home", "Work", "About", "Contact"]);
    expect(screen.getByText("About moved to position 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(names(c)).toEqual(["Home", "About", "Work", "Contact"]);
  });
});

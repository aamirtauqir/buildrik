// @vitest-environment jsdom
/**
 * design-2l9 63:15255 — "Update URL" on a live page asks first: "Change this
 * live page's URL?". Live is real state: a published site (project metadata's
 * publishedUrl) and a page that is not hidden from publish.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createMockComposer, pg } from "@/editor/sidebar/__tests__/test-utils/mockComposer";
import PagesTab from "../PagesTab";

afterEach(cleanup);

function mount(publishedUrl: string | null) {
  const c = createMockComposer({ pages: [pg("home", "Home", { isHome: true }), pg("about", "About", { slug: "about" })] });
  Object.assign(c, { getProjectMetadata: () => ({ name: "Fieldwork", publishedUrl }) });
  render(
    <ToastProvider>
      <PagesTab composer={c} />
    </ToastProvider>,
  );
  fireEvent.keyDown(screen.getByTestId("page-row-about"), { key: "F2" });
  const input = screen.getByLabelText("Rename page");
  fireEvent.change(input, { target: { value: "Our story" } });
  fireEvent.keyDown(input, { key: "Enter" });
  fireEvent.click(screen.getByRole("button", { name: "Update URL" }));
  return c;
}

describe("PagesTab — Update URL on a live page", () => {
  it("asks first on a published site, and Change URL moves it", () => {
    const c = mount("https://fieldwork.studio");
    expect(screen.getByText("Change this live page’s URL?")).toBeInTheDocument();
    expect(screen.getByText("About is live at /about. Changing it to /our-story can break old links after publishing. You can add a redirect after the change.")).toBeInTheDocument();
    expect(c.elements.updatePage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Change URL" }));
    expect(c.elements.updatePage).toHaveBeenCalledWith("about", { name: "Our story", slug: "our-story" });
  });

  it("Cancel changes nothing", () => {
    const c = mount("https://fieldwork.studio");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(c.elements.updatePage).not.toHaveBeenCalled();
  });

  it("an unpublished site moves the URL without asking", () => {
    const c = mount(null);
    expect(screen.queryByText("Change this live page’s URL?")).toBeNull();
    expect(c.elements.updatePage).toHaveBeenCalledWith("about", { name: "Our story", slug: "our-story" });
  });
});

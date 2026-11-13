/**
 * 2L9 217:43415 (B6-K24): when the workspace library read fails, the scope
 * reads "Component library · —", the library scope says "Couldn’t load the
 * component library" / "Your site’s own components are still available under
 * This site." with Retry, and This site keeps working. Before this the read
 * failed silently to an empty library.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

const { fetchLibrary } = vi.hoisted(() => ({ fetchLibrary: vi.fn() }));
vi.mock("@/services/componentSync", () => ({ fetchComponentLibrary: fetchLibrary }));

import { ComponentsTab } from "@/editor/sidebar/tabs/ComponentsTab";

const c = (id: string, name: string) =>
  ({ id, name, masterTree: {}, createdAt: 1, updatedAt: 1, version: 1 }) as never;

function mount() {
  const composer = createMockComposer({
    pages: [{ id: "page-home", name: "Home" }] as never,
    activePageId: "page-home",
    components: [c("hdr", "Site header")],
  });
  Object.assign(composer.components, { isAvailable: () => true, getInstancesOfComponent: () => [] });
  render(
    <ToastProvider>
      <ComponentsTab composer={composer as never} />
    </ToastProvider>,
  );
}

beforeEach(() => fetchLibrary.mockReset());

describe("ComponentsTab — component library failed to load (2L9 B6-K24)", () => {
  it("counts the library as — and keeps This site listing the site's own components", async () => {
    fetchLibrary.mockResolvedValue(null);
    mount();
    expect(await screen.findByRole("tab", { name: "Component library · —" })).toBeInTheDocument();
    expect(screen.getByTestId("comp-section-header").textContent).toBe("This site · 1");
    expect(screen.getByTestId("comp-row-hdr")).toBeInTheDocument();
  });

  it("the library scope says what failed and where the site's components are, and Retry reads it again", async () => {
    fetchLibrary.mockResolvedValueOnce(null);
    mount();
    fireEvent.click(await screen.findByRole("tab", { name: "Component library · —" }));
    const error = screen.getByTestId("comp-library-error");
    expect(error).toHaveTextContent(
      "Couldn’t load the component libraryYour site’s own components are still available under This site.Retry",
    );
    // 217:43468: an ink title (not error red) and a primary 32px Retry.
    expect(error.querySelector("p")?.className).toContain("--bk-ink)");
    expect(screen.getByTestId("comp-library-retry").className).toContain("tw:h-8");
    expect(screen.queryByTestId("comp-empty-library")).toBeNull();

    fetchLibrary.mockResolvedValueOnce([{ componentId: "price", name: "Price row", siteCount: 2, onThisSite: false }]);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByTestId("comp-lib-status-price")).toHaveTextContent("Not on this site"));
    expect(screen.queryByTestId("comp-library-error")).toBeNull();
    expect(screen.getByRole("tab", { name: "Component library · 1" })).toBeInTheDocument();
    expect(fetchLibrary).toHaveBeenCalledTimes(2);
  });

  it("an empty library that loaded is still the empty state, not the error", async () => {
    fetchLibrary.mockResolvedValue([]);
    mount();
    fireEvent.click(await screen.findByRole("tab", { name: "Component library · 0" }));
    expect(screen.getByTestId("comp-empty-library")).toBeInTheDocument();
    expect(screen.queryByTestId("comp-library-error")).toBeNull();
  });
});

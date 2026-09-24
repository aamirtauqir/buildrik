/**
 * Board 4418:142419: the manage list splits YOUR COMPONENTS from LINKED FROM
 * LIBRARY ("24 on this site · linked"), and lists only masters in scope on the
 * open page (G2-118).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createMockComposer } from "../../../__tests__/test-utils/mockComposer";

vi.mock("@/services/componentSync", () => ({
  fetchComponentLibrary: vi.fn(async () => [
    { componentId: "btn", name: "Button / primary", siteCount: 3, onThisSite: true },
    { componentId: "price", name: "Price row", siteCount: 2, onThisSite: false },
  ]),
}));

import { ComponentsTab } from "../../ComponentsTab";

const c = (id: string, name: string, pageId?: string) =>
  ({ id, name, masterTree: {}, createdAt: 1, updatedAt: 1, version: 1, ...(pageId ? { pageId } : {}) }) as never;

describe("ComponentsTab — YOUR COMPONENTS / LINKED FROM LIBRARY", () => {
  it("puts linked masters under LINKED FROM LIBRARY with '· linked'; hides another page's", async () => {
    const composer = createMockComposer({
      pages: [{ id: "page-home", name: "Home" }, { id: "page-menu", name: "Menu" }] as never,
      activePageId: "page-home",
      components: [c("hdr", "Site header"), c("btn", "Button / primary"), c("menu-hero", "Menu hero", "page-menu")],
    });
    Object.assign(composer.components, {
      isAvailable: () => true,
      getInstancesOfComponent: (id: string) => (id === "btn" ? new Array(24) : new Array(6)),
    });
    render(
      <ToastProvider>
        <ComponentsTab composer={composer as never} />
      </ToastProvider>,
    );
    const section = await screen.findByTestId("comp-section-linked");
    expect(section.textContent).toBe("LINKED FROM LIBRARY");
    expect(screen.getByTestId("comp-row-hdr")).toBeTruthy();
    expect(within(screen.getByTestId("comp-row-btn")).getByTestId("comp-row-count-btn").textContent).toBe("24 on this site · linked");
    expect(screen.getByTestId("comp-row-count-hdr").textContent).not.toMatch(/linked/);
    expect(screen.queryByTestId("comp-row-menu-hero")).toBeNull();
    // Rows are ordered: own section first, then the linked one.
    const order = [...document.querySelectorAll("[data-testid^='comp-row-'][role='button']")].map((n) => n.getAttribute("data-testid"));
    expect(order).toEqual(["comp-row-hdr", "comp-row-btn"]);
  });
});

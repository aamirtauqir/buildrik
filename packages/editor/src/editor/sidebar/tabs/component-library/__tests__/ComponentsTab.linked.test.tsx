/**
 * 2L9 215:43588 / 215:43978: the manage list is scoped This page · This site ·
 * Component library; a linked master reads "24 uses · Component library"
 * (217:43947); another page's masters never show (G2-118).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createMockComposer } from "@/editor/sidebar/__tests__/test-utils/mockComposer";

vi.mock("@/services/componentSync", () => ({
  fetchComponentLibrary: vi.fn(async () => [
    { componentId: "btn", name: "Button / primary", siteCount: 3, onThisSite: true },
    { componentId: "price", name: "Price row", siteCount: 2, onThisSite: false },
  ]),
}));

import { ComponentsTab } from "@/editor/sidebar/tabs/ComponentsTab";

const c = (id: string, name: string, pageId?: string) =>
  ({ id, name, masterTree: {}, createdAt: 1, updatedAt: 1, version: 1, ...(pageId ? { pageId } : {}) }) as never;

describe("ComponentsTab — This page · This site · Component library (2L9 215:43588)", () => {
  const mountScoped = () => {
    const composer = createMockComposer({
      pages: [{ id: "page-home", name: "Home" }, { id: "page-menu", name: "Menu" }] as never,
      activePageId: "page-home",
      components: [
        c("hdr", "Site header"),
        c("btn", "Button / primary"),
        c("intro", "Home intro", "page-home"),
        c("menu-hero", "Menu hero", "page-menu"),
      ],
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
    return composer;
  };

  it("This site lists site masters, a linked one with its source, most used first; another page's never shows", async () => {
    mountScoped();
    await screen.findByRole("tab", { name: "Component library · 2" });
    expect(screen.getByTestId("comp-section-header").textContent).toBe("This site · 2");
    /* 215:46939 — the source is a scope chip beside the uses. */
    expect(within(screen.getByTestId("comp-row-btn")).getByTestId("comp-row-count-btn").textContent).toBe("24 uses");
    expect(screen.getByTestId("comp-row-scope-btn").textContent).toBe("Component library");
    expect(screen.getByTestId("comp-row-scope-hdr").textContent).toBe("This site");
    expect(screen.queryByTestId("comp-row-menu-hero")).toBeNull();
    expect(screen.queryByTestId("comp-row-intro")).toBeNull();
    const order = [...document.querySelectorAll("[data-testid^='comp-row-'][role='button']")].map((n) => n.getAttribute("data-testid"));
    expect(order).toEqual(["comp-row-btn", "comp-row-hdr"]);
    expect(screen.getByTestId("comp-sort")).toHaveValue("used");
  });

  it("This page lists this page's masters; search narrows and says when nothing matches", async () => {
    mountScoped();
    fireEvent.click(await screen.findByRole("tab", { name: "This page · 1" }));
    expect(screen.getByTestId("comp-section-header").textContent).toBe("This page · 1");
    expect(screen.getByTestId("comp-row-intro")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "This site · 2" }));
    fireEvent.change(screen.getByPlaceholderText("Search components"), { target: { value: "zzz" } });
    expect(screen.getByTestId("comp-no-match")).toHaveTextContent("No components match “zzz”.");
  });

  it("Component library names whether each shared master is on this site", async () => {
    mountScoped();
    fireEvent.click(await screen.findByRole("tab", { name: "Component library · 2" }));
    expect(screen.getByTestId("comp-lib-btn")).toHaveTextContent("Button / primaryOn this site");
    expect(screen.getByTestId("comp-lib-price")).toHaveTextContent("Price rowNot on this site");
  });
});

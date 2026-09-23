/**
 * C4 #24 — Templates is a full-canvas view, not a 280/700 drawer plus a
 * preview modal (boards 4418:54134 catalogue, 4418:53202 preview). The view
 * carries its own sidebar — ‹ Back to canvas · Templates · PAGE TEMPLATES ·
 * All page templates · N · one row per page template — and a template's
 * preview opens IN the view (Create page · Replace page…), with the sidebar's
 * door turning into ‹ Back to templates.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const addToast = vi.hoisted(() => vi.fn());
vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast, removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { TemplatesTab } from "../TemplatesTab";
import { SITE_TEMPLATES } from "../templatesData";
import { getTabMode } from "@/editor/rail/tabsConfig";

const PAGE_TEMPLATES = SITE_TEMPLATES.filter((t) => t.type === "page");

function makeComposer() {
  return {
    elements: {
      getActivePage: vi.fn(() => ({ id: "page-1", name: "Home", root: { id: "root-1" } })),
      getAllPages: vi.fn(() => [{ id: "page-1", name: "Home" }]),
      createPage: vi.fn(() => ({ id: "page-new", name: "New" })),
      setActivePage: vi.fn(),
      importHTMLToActivePage: vi.fn(),
      recordAppliedTemplate: vi.fn(),
      getElement: vi.fn(() => null),
    },
    history: { undo: vi.fn() },
    styles: { clear: vi.fn() },
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
}

afterEach(cleanup);

describe("Templates — full-canvas view (decision #24)", () => {
  it("the rail's Templates tab is a fullpage tab, not a drawer", () => {
    expect(getTabMode("templates")).toBe("fullpage");
  });

  it("draws the board's sidebar and no drawer furniture", () => {
    const onClose = vi.fn();
    render(<TemplatesTab composer={makeComposer() as never} onClose={onClose} />);
    const side = screen.getByTestId("tpl-ws-side");
    expect(within(side).getByTestId("tpl-ws-back")).toHaveTextContent("‹ Back to canvas");
    expect(side).toHaveTextContent("Templates");
    expect(side).toHaveTextContent("PAGE TEMPLATES");
    expect(within(side).getByTestId("tpl-ws-all")).toHaveTextContent(`All page templates · ${PAGE_TEMPLATES.length}`);
    for (const t of PAGE_TEMPLATES) expect(within(side).getByTestId(`tpl-ws-item-${t.id}`)).toHaveTextContent(t.name);
    // The compact drawer gallery and the 280↔700 expand toggle are gone.
    expect(screen.queryByRole("button", { name: /browse all templates/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /expand|collapse/i })).toBeNull();
    fireEvent.click(within(side).getByTestId("tpl-ws-back"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a sidebar row opens the preview in the view — no modal — and Back returns to the catalogue", () => {
    render(<TemplatesTab composer={makeComposer() as never} onClose={vi.fn()} />);
    const t = PAGE_TEMPLATES[0];
    fireEvent.click(screen.getByTestId(`tpl-ws-item-${t.id}`));
    const preview = screen.getByTestId("tpl-ws-preview");
    expect(preview).toHaveTextContent(t.name);
    expect(preview).toHaveTextContent("Page template");
    expect(within(preview).getByRole("button", { name: "Create page" })).toBeInTheDocument();
    expect(within(preview).getByRole("button", { name: "Replace page…" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId(`tpl-ws-item-${t.id}`)).toHaveAttribute("aria-current", "true");
    const back = screen.getByTestId("tpl-ws-back");
    expect(back).toHaveTextContent("‹ Back to templates");
    fireEvent.click(back);
    expect(screen.queryByTestId("tpl-ws-preview")).toBeNull();
    expect(screen.getByTestId("tpl-ws-all")).toHaveAttribute("aria-current", "true");
  });

  it("Create page from the preview makes a new page and imports the template into it", async () => {
    const composer = makeComposer();
    render(<TemplatesTab composer={composer as never} onClose={vi.fn()} />);
    const t = PAGE_TEMPLATES.find((x) => x.status !== "premium")!;
    fireEvent.click(screen.getByTestId(`tpl-ws-item-${t.id}`));
    fireEvent.click(screen.getByRole("button", { name: "Create page" }));
    await waitFor(() => expect(composer.elements.importHTMLToActivePage).toHaveBeenCalled());
    expect(composer.elements.createPage).toHaveBeenCalledWith(t.name);
    expect(composer.elements.setActivePage).toHaveBeenCalledWith("page-new");
  });

  it("Replace page… on an empty page imports into the active page, creating nothing", async () => {
    const composer = makeComposer();
    render(<TemplatesTab composer={composer as never} onClose={vi.fn()} />);
    const t = PAGE_TEMPLATES.find((x) => x.status !== "premium")!;
    fireEvent.click(screen.getByTestId(`tpl-ws-item-${t.id}`));
    fireEvent.click(screen.getByRole("button", { name: "Replace page…" }));
    await waitFor(() => expect(composer.elements.importHTMLToActivePage).toHaveBeenCalled());
    expect(composer.elements.createPage).not.toHaveBeenCalled();
  });

  /* #19 follow-up: the New-page modal's name reaches the catalogue's Create page. */
  it("Create page uses the name the New-page modal carried", async () => {
    const composer = makeComposer();
    render(<TemplatesTab composer={composer as never} onClose={vi.fn()} newPageName="Our menu" />);
    const t = PAGE_TEMPLATES.find((x) => x.status !== "premium")!;
    fireEvent.click(screen.getByTestId(`tpl-ws-item-${t.id}`));
    fireEvent.click(screen.getByRole("button", { name: "Create page" }));
    await waitFor(() => expect(composer.elements.importHTMLToActivePage).toHaveBeenCalled());
    expect(composer.elements.createPage).toHaveBeenCalledWith("Our menu");
  });

  /* QA 2026-09-24: Escape did not close the view. From the catalogue it goes
     back to the canvas; from a preview it goes back to the catalogue first. */
  it("Escape leaves the view from the catalogue, and a preview first", () => {
    const onClose = vi.fn();
    render(<TemplatesTab composer={makeComposer() as never} onClose={onClose} />);
    fireEvent.click(screen.getByTestId(`tpl-ws-item-${PAGE_TEMPLATES[0].id}`));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("tpl-ws-preview")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /* G2-099 (board 4428:150147): a replace toasts "<Page> replaced" with Undo
     — one history step — and says where the #25 backup went. */
  it("Replace page… ends in '<Page> replaced' with Undo", async () => {
    addToast.mockClear();
    const composer = makeComposer();
    render(<TemplatesTab composer={composer as never} onClose={vi.fn()} />);
    const t = PAGE_TEMPLATES.find((x) => x.status !== "premium")!;
    fireEvent.click(screen.getByTestId(`tpl-ws-item-${t.id}`));
    fireEvent.click(screen.getByText("Replace page…"));
    /* recordAppliedTemplate runs in the same frame, right after the toast. */
    await waitFor(() => expect(composer.elements.recordAppliedTemplate).toHaveBeenCalled(), { timeout: 5000 });
    /* The last one: an earlier test's apply can land its toast late. */
    const toast = addToast.mock.calls.filter((c) => c[0].title === "Home replaced").at(-1)![0];
    toast.action.onClick();
    expect(composer.history.undo).toHaveBeenCalledTimes(1);
  });
});

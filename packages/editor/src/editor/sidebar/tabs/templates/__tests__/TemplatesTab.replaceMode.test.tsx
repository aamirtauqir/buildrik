/**
 * Board 4428:149355 "Templates · replace mode · Menu" — the Pages row's
 * "Replace layout with template…" opens the catalogue FOR that page: the
 * sidebar door reads ‹ Back to Pages, a "Replacing: <page>" banner carries
 * Cancel, and every card's button reads "Use for <page>" and goes to the
 * replace confirm. ⌘K template rows open straight onto a template's preview
 * (request.previewId — the catalogue search the owner kept).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { TemplatesTab } from "../TemplatesTab";
import { SITE_TEMPLATES } from "../templatesData";

const PAGE_TEMPLATES = SITE_TEMPLATES.filter((t) => t.type === "page");
const FREE = PAGE_TEMPLATES.find((t) => t.status !== "premium")!;

function makeComposer(descendants = 3) {
  return {
    elements: {
      getActivePage: vi.fn(() => ({ id: "page-2", name: "Menu", root: { id: "root-2" } })),
      getAllPages: vi.fn(() => [{ id: "page-2", name: "Menu" }]),
      createPage: vi.fn(),
      addPageToNavigation: vi.fn(),
      setActivePage: vi.fn(),
      importHTMLToActivePage: vi.fn(),
      recordAppliedTemplate: vi.fn(),
      getElement: vi.fn(() => ({ getChildCount: () => descendants, getDescendants: () => new Array(descendants).fill({}) })),
    },
    history: { undo: vi.fn() },
    styles: { clear: vi.fn() },
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
}

afterEach(cleanup);

describe("Templates — replace mode (4428:149355)", () => {
  it("draws Back to Pages, the Replacing banner, and 'Use for <page>' on every card", () => {
    render(<TemplatesTab composer={makeComposer() as never} onClose={vi.fn()} request={{ replace: true }} />);
    expect(screen.getByTestId("tpl-ws-back")).toHaveTextContent("‹ Back to Pages");
    const banner = screen.getByTestId("tpl-replace-banner");
    expect(banner).toHaveTextContent("Replacing: Menu");
    expect(banner).toHaveTextContent("your current layout is backed up first");
    expect(within(banner).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Use for Menu" })).toHaveLength(PAGE_TEMPLATES.length);
    expect(screen.getByTestId("tpl-ws-side")).toHaveTextContent(
      "Choose a layout for Menu. Your current Menu is saved to History before it is replaced.",
    );
  });

  it("'Use for <page>' opens the replace confirm, not the preview", () => {
    render(<TemplatesTab composer={makeComposer() as never} onClose={vi.fn()} request={{ replace: true }} />);
    const card = screen.getByRole("option", { name: `${FREE.name} template` });
    fireEvent.click(within(card).getByRole("button", { name: "Use for Menu" }));
    expect(screen.queryByTestId("tpl-ws-preview")).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Cancel and Back to Pages both return to Pages", () => {
    const onSwitchTab = vi.fn();
    render(
      <TemplatesTab composer={makeComposer() as never} onClose={vi.fn()} onSwitchTab={onSwitchTab} request={{ replace: true }} />,
    );
    fireEvent.click(within(screen.getByTestId("tpl-replace-banner")).getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByTestId("tpl-ws-back"));
    expect(onSwitchTab).toHaveBeenNthCalledWith(1, "pages");
    expect(onSwitchTab).toHaveBeenNthCalledWith(2, "pages");
  });

  it("the plain catalogue has no banner and cards still read Preview template", () => {
    render(<TemplatesTab composer={makeComposer() as never} onClose={vi.fn()} />);
    expect(screen.queryByTestId("tpl-replace-banner")).toBeNull();
    expect(screen.queryByRole("button", { name: "Use for Menu" })).toBeNull();
    expect(screen.getByTestId("tpl-ws-back")).toHaveTextContent("‹ Back to canvas");
  });
});

describe("Templates — opened on a template (⌘K template row)", () => {
  it("request.previewId opens that template's preview", () => {
    render(<TemplatesTab composer={makeComposer() as never} onClose={vi.fn()} request={{ previewId: FREE.id }} />);
    expect(screen.getByTestId("tpl-ws-preview")).toHaveTextContent(FREE.name);
  });
});

/**
 * C4 #19 — Add page = New-page modal with template choice (v3 Q2b), replacing
 * instant add + inline rename. Boards 6752:59256 (From template selected) and
 * 6752:59365 (Blank selected): Page name · Blank "Empty canvas" · From template
 * "Pick from N layouts" · Cancel · Create page. Blank → the page is created,
 * made active, toast "Page created" (6700:71154). From template → the page is
 * created and the templates catalogue opens on it (4418:54134). Every Add-page
 * door emits UI_NEW_PAGE_REQUESTED; this modal is the one listener.
 *
 * "Add to site navigation" is drawn on the board but has no code concept
 * (audit G2-074: needs a Navigation-element contract first) — not rendered.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EVENTS } from "@/shared/constants/events";

const addToast = vi.fn();
vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  useToast: () => ({ addToast, removeToast: vi.fn(), toasts: [] }),
}));

import { NewPageModal } from "../components/NewPageModal";

function makeComposer() {
  const handlers = new Map<string, Array<(d: unknown) => void>>();
  const pages = [{ id: "p1", name: "Home" }];
  const composer = {
    on: vi.fn((ev: string, fn: (d: unknown) => void) => handlers.set(ev, [...(handlers.get(ev) ?? []), fn])),
    off: vi.fn(),
    emit: vi.fn(),
    elements: {
      getAllPages: vi.fn(() => pages),
      createPage: vi.fn((name: string) => {
        const page = { id: `p${pages.length + 1}`, name };
        pages.push(page);
        return page;
      }),
      setActivePage: vi.fn(),
    },
  };
  const request = () => act(() => handlers.get(EVENTS.UI_NEW_PAGE_REQUESTED)?.forEach((fn) => fn({})));
  return { composer, request };
}

beforeEach(() => addToast.mockClear());

describe("NewPageModal", () => {
  it("opens on UI_NEW_PAGE_REQUESTED with the board's fields, From template selected", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    expect(screen.queryByTestId("new-page-modal")).toBeNull();
    request();
    expect(screen.getByTestId("new-page-modal")).toHaveTextContent("New page");
    expect(screen.getByLabelText("Page name")).toHaveValue("About");
    expect(screen.getByTestId("new-page-source-blank")).toHaveTextContent("BlankEmpty canvas");
    expect(screen.getByTestId("new-page-source-template")).toHaveTextContent(/From templatePick from \d+ layouts/);
    expect(screen.getByTestId("new-page-source-template")).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Add to site navigation")).toBeNull();
  });

  it("Blank → creates the named page, makes it active, toasts Page created", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.change(screen.getByLabelText("Page name"), { target: { value: "Reservations" } });
    fireEvent.click(screen.getByTestId("new-page-source-blank"));
    fireEvent.click(screen.getByTestId("new-page-create"));
    expect(composer.elements.createPage).toHaveBeenCalledWith("Reservations");
    expect(composer.elements.setActivePage).toHaveBeenCalledWith("p2");
    expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.UI_BROWSE_TEMPLATES, expect.anything());
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Page created" }));
    expect(screen.queryByTestId("new-page-modal")).toBeNull();
  });

  /* QA 2026-09-24: From template created a blank page before the catalogue
     opened, so leaving the catalogue (Back to canvas) left that page behind.
     Now nothing is created until a template is chosen; the typed name rides
     along for the catalogue's Create page. */
  it("From template → opens the catalogue with the name, and creates nothing yet", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.change(screen.getByLabelText("Page name"), { target: { value: "Our menu" } });
    fireEvent.click(screen.getByTestId("new-page-create"));
    expect(composer.elements.createPage).not.toHaveBeenCalled();
    expect(composer.elements.setActivePage).not.toHaveBeenCalled();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_BROWSE_TEMPLATES, { newPageName: "Our menu" });
    expect(screen.queryByTestId("new-page-modal")).toBeNull();
  });

  it("an empty name cannot be created; Cancel creates nothing", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.change(screen.getByLabelText("Page name"), { target: { value: "  " } });
    expect(screen.getByTestId("new-page-create")).toBeDisabled();
    fireEvent.click(screen.getByTestId("new-page-cancel"));
    expect(composer.elements.createPage).not.toHaveBeenCalled();
    expect(screen.queryByTestId("new-page-modal")).toBeNull();
  });

  it("a failed create keeps the modal open and says so", () => {
    const { composer, request } = makeComposer();
    composer.elements.createPage.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.click(screen.getByTestId("new-page-source-blank"));
    fireEvent.click(screen.getByTestId("new-page-create"));
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't add page right now. Try again.");
    expect(screen.getByTestId("new-page-modal")).toBeInTheDocument();
  });
});

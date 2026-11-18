/**
 * C4 #19 — Add page = New-page modal with template choice (v3 Q2b), replacing
 * instant add + inline rename. Boards 6752:59256 (From template selected) and
 * 6752:59365 (Blank selected): Page name · Blank "Start with an empty page." (design-2l9 101:29978) · From template
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

const load = vi.hoisted(() => ({ siteId: null as string | null, loaded: true }));
vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: () => load.siteId,
  hasProjectLoaded: () => load.loaded,
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
      addPageToNavigation: vi.fn(() => 1),
    },
  };
  const request = (data: object = {}) => act(() => handlers.get(EVENTS.UI_NEW_PAGE_REQUESTED)?.forEach((fn) => fn(data)));
  return { composer, request };
}

beforeEach(() => {
  addToast.mockClear();
  load.siteId = null;
  load.loaded = true;
});

/* REA #13: a page created while the project loads is wiped by importProject,
   with no undo. Every Add-page door goes through this listener, so it is the
   one place that refuses — with the reason — until the project has loaded. */
describe("NewPageModal while the project is loading", () => {
  it("does not open, and says why", () => {
    load.siteId = "site-1";
    load.loaded = false;
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    expect(screen.queryByTestId("new-page-modal")).toBeNull();
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Pages are still loading" }));
  });

  it("opens once the project has loaded", () => {
    load.siteId = "site-1";
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    expect(screen.getByTestId("new-page-modal")).toBeInTheDocument();
  });
});

describe("NewPageModal", () => {
  /* design-2l9 board 101:29978. Re-baseline: New page layout. */
  it("opens on UI_NEW_PAGE_REQUESTED with the board's fields, Blank selected (BD-33)", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    expect(screen.queryByTestId("new-page-modal")).toBeNull();
    request();
    expect(screen.getByTestId("new-page-modal")).toHaveTextContent("New page");
    expect(screen.getByTestId("new-page-subtitle")).toHaveTextContent("Create a page");
    expect(screen.getByLabelText("Page name")).toHaveValue("About");
    expect(screen.getByTestId("new-page-source-blank")).toHaveTextContent("Blank");
    // re-baseline: New page — 2L9 101:36828 opens on Blank.
    expect(screen.getByTestId("new-page-source-blank")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("new-page-source-note")).toHaveTextContent("Start with an empty page.");
    fireEvent.click(screen.getByTestId("new-page-source-template"));
    expect(screen.getByTestId("new-page-source-note")).toHaveTextContent("Choose a page template before creating the page.");
    expect(screen.queryByTestId("modal-close-new-page-modal")).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Add to site navigation" })).toBeChecked();
  });

  it("Cancel closes without creating", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.click(screen.getByTestId("new-page-cancel"));
    expect(screen.queryByTestId("new-page-modal")).toBeNull();
    expect(composer.elements.createPage).not.toHaveBeenCalled();
  });

  it("Blank with the toggle OFF adds the page to no nav", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.click(screen.getByTestId("new-page-source-blank"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Add to site navigation" }));
    fireEvent.click(screen.getByTestId("new-page-create"));
    expect(composer.elements.createPage).toHaveBeenCalled();
    expect(composer.elements.addPageToNavigation).not.toHaveBeenCalled();
  });

  /* BD-33 (2026-10-20): the primary button creates a page on the first click —
     no source choice needed. */
  it("Create page on first click, with no source picked, creates the page", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.click(screen.getByTestId("new-page-create"));
    expect(composer.elements.createPage).toHaveBeenCalledWith("About");
    expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.UI_BROWSE_TEMPLATES, expect.anything());
  });

  it("Blank → creates the named page, makes it active, and reports it (101:42581)", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.change(screen.getByLabelText("Page name"), { target: { value: "Reservations" } });
    fireEvent.click(screen.getByTestId("new-page-source-blank"));
    fireEvent.click(screen.getByTestId("new-page-create"));
    expect(composer.elements.createPage).toHaveBeenCalledWith("Reservations");
    expect(composer.elements.setActivePage).toHaveBeenCalledWith("p2");
    expect(composer.elements.addPageToNavigation).toHaveBeenCalledWith("p2");
    expect(composer.emit).not.toHaveBeenCalledWith(EVENTS.UI_BROWSE_TEMPLATES, expect.anything());
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringMatching(/ created · Added to site navigation$/) }));
    expect(screen.queryByTestId("new-page-modal")).toBeNull();
  });

  /* QA 2026-09-24: From template created a blank page before the catalogue
     opened, so leaving the catalogue (Back to canvas) left that page behind.
     Now nothing is created until a template is chosen; the typed name rides
     along for the catalogue's Create page. */
  // design-2l9 104:28892: Templates' Back to New page reopens the dialog as it was.
  it("a request carrying a name reopens on From template with that name and choice", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request({ name: "Services", addToNavigation: false });
    expect(screen.getByLabelText("Page name")).toHaveValue("Services");
    expect(screen.getByTestId("new-page-source-template")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: "Add to site navigation" })).not.toBeChecked();
  });

  it("From template → opens the catalogue with the name, and creates nothing yet", () => {
    const { composer, request } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.click(screen.getByTestId("new-page-source-template"));
    fireEvent.change(screen.getByLabelText("Page name"), { target: { value: "Our menu" } });
    expect(screen.getByTestId("new-page-create")).toHaveTextContent("Choose template");
    fireEvent.click(screen.getByTestId("new-page-create"));
    expect(composer.elements.createPage).not.toHaveBeenCalled();
    expect(composer.elements.setActivePage).not.toHaveBeenCalled();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_BROWSE_TEMPLATES, { newPageName: "Our menu", addToNavigation: true });
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
    /* design-2l9 board 101:40412. Re-baseline: new page copy. */
    const name = (screen.getByTestId("new-page-name") as HTMLInputElement).value;
    expect(screen.getByRole("alert")).toHaveTextContent(`Couldn’t create ${name}. Nothing was changed. Try again.`);
    expect(screen.getByTestId("new-page-create")).toHaveTextContent("Try again");
    expect(screen.getByTestId("new-page-modal")).toBeInTheDocument();
  });

  it("an empty name says so (101:37542)", () => {
    const { request, composer } = makeComposer();
    render(<NewPageModal composer={composer as never} />);
    request();
    fireEvent.change(screen.getByTestId("new-page-name"), { target: { value: "  " } });
    expect(screen.getByTestId("new-page-name-missing")).toHaveTextContent("Name the page");
    expect(screen.getByTestId("new-page-create")).toBeDisabled();
  });
});

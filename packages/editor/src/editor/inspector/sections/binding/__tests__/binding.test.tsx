/**
 * Content-tab CMS binding (2L9 Play F2.02 / F2.05 / F2.16, boards
 * B5-D01…D15, lane request C-13 / C-11): the type block's property row —
 * static value + Bind; Choose source (record data, site & page, live
 * sources; search over fields); the bound row (source, preview, record
 * context, Binding status); the binding detail (Format, If empty, Preview,
 * Open record with its origin, Unbind — keep shown text); the Dynamic
 * bindings summary and the missing-source box.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import { BindingPropertyRow } from "../BindingPropertyRow";
import { BindingDetail } from "../BindingDetail";
import { TemplatePageDoor } from "../TemplatePageDoor";
import { ListItemNote } from "../ListItemNote";
import { closeSubview, openSubview, useSubview } from "@/editor/inspector/tabs/subviewStore";
import { CmsBindingSection } from "@/editor/inspector/sections/CmsBindingSection";
import { ToastProvider } from "@/editor/chrome-ui";

/** The unbind receipt is a toast (2L9 D11). */
const withToasts = { wrapper: ToastProvider };

const MENU = {
  id: "col-1",
  name: "Menu",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text" },
    { id: "f2", name: "Photo", slug: "photo", type: "image" },
  ],
};
const TEAM = { id: "col-2", name: "Team", fields: [{ id: "f4", name: "Bio", slug: "bio", type: "text" }] };

const RECORDS = [
  { id: "r1", data: { name: "Cacio e pepe" }, status: "published" },
  { id: "r2", data: { name: "" }, status: "published" },
];

const undoUnbind = vi.fn();
function makeComposer(opts: { collections?: Array<Record<string, unknown>>; initial?: Array<Record<string, unknown>>; template?: boolean; fail?: boolean } = {}) {
  const collections = opts.collections ?? [MENU, TEAM];
  const bindings: Array<Record<string, unknown>> = [...(opts.initial ?? [])];
  const listeners = new Map<string, Set<() => void>>();
  const emitLocal = (ev: string) => listeners.get(ev)?.forEach((f) => f());
  const on = (ev: string, fn: () => void) => (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn);
  const off = (ev: string, fn: () => void) => listeners.get(ev)?.delete(fn);
  const page = { id: "p1", name: opts.template ? "Menu item" : "Home", slug: opts.template ? "menu-item" : "", isHome: !opts.template, root: { id: "root" } };
  const home = { id: "p0", name: "Home", slug: "", isHome: true, root: { id: "root0" } };
  return {
    history: { captureUndo: vi.fn(() => undoUnbind) },
    on,
    off,
    emit: vi.fn(),
    elements: {
      getElement: () => ({
        getType: () => "heading",
        getParent: () => null,
        getContent: () => "Our menu",
        getAttribute: () => undefined,
        getCustomData: () => undefined,
        isLocked: () => false,
      }),
      getActivePage: () => page,
      getAllPages: () => (opts.template ? [home, page] : [page]),
    },
    cms: {
      collections: {
        on,
        off,
        getAllCollections: () =>
          opts.template ? collections.map((c) => (c.id === "col-1" ? { ...c, pageTemplatePath: "menu-item.html" } : c)) : collections,
        getContentItems: vi.fn(() => (opts.fail ? Promise.reject(new Error("down")) : Promise.resolve(RECORDS))),
      },
      bindings: {
        getBindings: () => bindings,
        getCollectionBinding: () => null,
        bindToField: vi.fn((_e: string, collectionId: string, itemId: string | undefined, fieldSlug: string, property: string, fallback?: string) => {
          bindings.splice(0, bindings.length, { collectionId, itemId, fieldSlug, property, fallback });
          emitLocal("binding:created");
        }),
        unbindAll: vi.fn(() => {
          bindings.splice(0);
          emitLocal("binding:removed");
        }),
      },
    },
  };
}

const BOUND = [{ collectionId: "col-1", itemId: "r1", fieldSlug: "name", property: "content" }];

afterEach(() => {
  cleanup();
  act(() => closeSubview("binding"));
});

const row = (composer: unknown) => render(<BindingPropertyRow composer={composer as never} elementId="e1" />);

describe("property row · static (B5-D01)", () => {
  it("names the property (its value on hover) and offers Bind (2L9 161:8480)", () => {
    row(makeComposer());
    expect(screen.getByTestId("binding-row")).toHaveTextContent("Title text");
    expect(screen.getByTitle("Our menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bind title text…" })).toBeInTheDocument();
  });
});

describe("Choose source (Play F2.02)", () => {
  it("groups Record data · Site & page · Live sources; List item says why it is off; site, page and live sources are Planned", () => {
    row(makeComposer());
    fireEvent.click(screen.getByRole("button", { name: "Bind title text…" }));
    const picker = screen.getByTestId("choose-source");
    expect(picker).toHaveTextContent("Choose source");
    expect(screen.getByPlaceholderText("Search sources or fields…")).toBeInTheDocument();
    for (const g of ["Record data", "Site & page", "Live sources"]) expect(picker).toHaveTextContent(g);
    expect(screen.getByTestId("choose-source-list")).toHaveTextContent("Select an element inside a collection list");
    expect(screen.getByTestId("choose-source-list")).toBeDisabled();
    expect(screen.getByTestId("choose-source-record")).toHaveTextContent("Pin one record to this property");
    expect(screen.getAllByText("Planned")).toHaveLength(5);
  });

  it("Specific record → a collection → every field, the unfit ones shut with why (B5-D03); a field binds the newest published record in one step", async () => {
    const composer = makeComposer();
    row(composer);
    fireEvent.click(screen.getByRole("button", { name: "Bind title text…" }));
    fireEvent.click(screen.getByTestId("choose-source-record"));
    fireEvent.click(screen.getByText("Menu"));
    expect(screen.getByText("Menu fields")).toBeInTheDocument();
    expect(screen.getByTestId("choose-source-field-name")).toHaveTextContent("Text · name");
    expect(screen.getByTestId("choose-source-field-photo")).toBeDisabled();
    expect(screen.getByTestId("choose-source-field-photo")).toHaveTextContent("Image cannot supply title text");
    fireEvent.click(screen.getByTestId("choose-source-field-name"));
    await waitFor(() =>
      expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-1", "r1", "name", "content", undefined, "Bind Name"),
    );
  });

  it("search finds fields across collections", async () => {
    const composer = makeComposer();
    row(composer);
    fireEvent.click(screen.getByRole("button", { name: "Bind title text…" }));
    fireEvent.change(screen.getByPlaceholderText("Search sources or fields…"), { target: { value: "bio" } });
    expect(screen.getByTestId("choose-source-field-bio")).toHaveTextContent("Team · Bio");
    fireEvent.click(screen.getByTestId("choose-source-field-bio"));
    await waitFor(() => expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-2", "r1", "bio", "content", undefined, "Bind Bio"));
  });

  it("on a collection's template page, This page’s record binds no record — each generated page fills its own", () => {
    const composer = makeComposer({ template: true });
    row(composer);
    fireEvent.click(screen.getByRole("button", { name: "Bind title text…" }));
    expect(screen.getByTestId("choose-source-page")).toHaveTextContent("This page’s record · Menu");
    expect(screen.getByTestId("choose-source-page")).toHaveTextContent("Each generated page shows its own record");
    fireEvent.click(screen.getByTestId("choose-source-page"));
    fireEvent.click(screen.getByTestId("choose-source-field-name"));
    expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-1", undefined, "name", "content", undefined, "Bind Name");
  });
});

describe("property row · bound (B5-D04, D11, D13, D14)", () => {
  it("source, preview and record context; it opens the binding detail", async () => {
    row(makeComposer({ initial: BOUND }));
    expect(screen.getByTestId("binding-source")).toHaveTextContent("Menu · name");
    await waitFor(() => expect(screen.getByTestId("binding-preview")).toHaveTextContent("Cacio e pepe"));
    expect(screen.getByTestId("binding-context")).toHaveTextContent("Specific record");
    function Probe() {
      return <span data-testid="open-for">{useSubview()?.elementId ?? ""}</span>;
    }
    render(<Probe />);
    fireEvent.click(screen.getByTestId("binding-open"));
    expect(screen.getByTestId("open-for")).toHaveTextContent("e1");
  });

  it("an empty value with a fallback says so", async () => {
    row(makeComposer({ initial: [{ ...BOUND[0], itemId: "r2", fallback: "Untitled" }] }));
    await waitFor(() => expect(screen.getByTestId("binding-status")).toHaveTextContent("Empty — showing fallback “Untitled”."));
  });

  it("a failed load keeps the binding and offers Retry", async () => {
    row(makeComposer({ initial: BOUND, fail: true }));
    await waitFor(() => expect(screen.getByTestId("binding-status")).toHaveTextContent("Couldn’t load Menu. Your binding is kept."));
    expect(screen.getByTestId("binding-retry")).toBeInTheDocument();
  });

  it("a field that no longer exists asks for another", () => {
    row(makeComposer({ initial: [{ ...BOUND[0], fieldSlug: "gone" }] }));
    expect(screen.getByTestId("binding-status")).toHaveTextContent("gone no longer exists. Choose a field.");
    expect(screen.getByTestId("binding-choose-field")).toBeInTheDocument();
  });
});

describe("binding detail (Play F2.05)", () => {
  it("‹ Back to Content · Title text binding · Source · Format As written · If empty · Preview · Open record › · Unbind — keep shown text", async () => {
    const composer = makeComposer({ initial: BOUND });
    render(<BindingDetail composer={composer as never} elementId="e1" />, withToasts);
    const detail = screen.getByTestId("binding-detail");
    await waitFor(() => expect(screen.getByTestId("binding-detail-preview")).toHaveTextContent("Cacio e pepe"));
    const text = detail.textContent ?? "";
    const at = ["‹ Back to Content", "Title text binding", "Source", "Menu · name", "Format", "As written", "If empty", "Preview", "Open record ›", "Unbind — keep shown text", "Keeps “Cacio e pepe” as static text."].map((t) => text.indexOf(t));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("C-11: Open record names where to come back to", async () => {
    const composer = makeComposer({ initial: BOUND });
    render(<BindingDetail composer={composer as never} elementId="e1" />, withToasts);
    await waitFor(() => expect(screen.getByTestId("binding-open-record")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("binding-open-record"));
    expect(composer.emit).toHaveBeenCalledWith("ui:cms-open", { collectionId: "col-1", recordId: "r1", origin: "Heading · Title text binding" });
  });

  it("If empty stores a fallback on the same binding; Unbind keeps the text and closes the detail", async () => {
    const composer = makeComposer({ initial: BOUND });
    act(() => openSubview({ kind: "binding", elementId: "e1" }));
    render(<BindingDetail composer={composer as never} elementId="e1" />, withToasts);
    const input = screen.getByLabelText("If empty");
    fireEvent.change(input, { target: { value: "Untitled dish" } });
    act(() => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-1", "r1", "name", "content", "Untitled dish", "Set fallback");
    act(() => {
      fireEvent.click(screen.getByTestId("binding-unbind"));
    });
    expect(composer.cms.bindings.unbindAll).toHaveBeenCalled();
    /* 2L9 D11: "Title is now static text · Undo", bound to the unbind step. */
    expect(screen.getByText("Name is now static text")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undoUnbind).toHaveBeenCalled();
    function Probe() {
      return <span data-testid="open-for">{useSubview()?.elementId ?? "none"}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("open-for")).toHaveTextContent("none");
  });
});

describe("Dynamic bindings summary (Play F2.16, B5-D04)", () => {
  it("draws nothing while unbound", () => {
    const { container } = render(<CmsBindingSection elementId="e1" composer={makeComposer() as never} isOpen />, withToasts);
    expect(container.textContent).toBe("");
  });

  it("bound: '1 binding' and 'Title text · Menu.name ›', which opens the detail", () => {
    render(<CmsBindingSection elementId="e1" composer={makeComposer({ initial: BOUND }) as never} isOpen />, withToasts);
    expect(screen.getByText("Dynamic bindings")).toBeInTheDocument();
    expect(screen.getByTestId("cms-binding-count")).toHaveTextContent("1 binding");
    expect(screen.getByTestId("cms-binding-summary-row")).toHaveTextContent("Title text · Menu.name");
  });

  it("a deleted source says so by name, with Reconnect… and Unbind (board 25)", () => {
    const composer = makeComposer({ initial: [{ collectionId: "col-x", collectionName: "Specials", fieldSlug: "title", property: "content" }] });
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />, withToasts);
    expect(screen.getByTestId("cms-source-missing")).toHaveTextContent("Source missing — Collection “Specials” was deleted.");
    expect(screen.getByTestId("cms-reconnect")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-unbind"));
    expect(composer.cms.bindings.unbindAll).toHaveBeenCalled();
  });
});

describe("TemplatePageDoor (B5-D04)", () => {
  it("on a collection's template page: '‹ CMS · Dynamic pages' opens that collection's Dynamic pages", () => {
    const composer = makeComposer({ template: true });
    render(<TemplatePageDoor composer={composer as never} elementId="e1" />);
    fireEvent.click(screen.getByTestId("inspector-template-door"));
    expect(composer.emit).toHaveBeenCalledWith("ui:cms-open", { collectionId: "col-1", tab: "dynamic-pages" });
  });

  it("elsewhere, nothing", () => {
    const { container } = render(<TemplatePageDoor composer={makeComposer() as never} elementId="e1" />);
    expect(container.textContent).toBe("");
  });
});

describe("ListItemNote (B5-D99 197:28410)", () => {
  const inList = (href?: string) => {
    const composer = makeComposer();
    const card = {
      getId: () => "e1",
      getType: () => "container",
      getCustomData: () => "Card",
      getAttribute: (k: string) => (k === "href" ? href : undefined),
      getParent: () => ({ getId: () => "list", getParent: () => null }),
    };
    (composer.elements as Record<string, unknown>).getElement = () => card;
    (composer.cms.bindings as Record<string, unknown>).getCollectionBinding = (id: string) => (id === "list" ? { repeat: "children", collectionId: "col-2" } : null);
    return composer;
  };

  it("inside a Team list: what an edit reaches, the card's link state, and the door to Behavior › Link", () => {
    const composer = inList();
    render(<ListItemNote composer={composer as never} elementId="e1" hasLinkSection />);
    const note = screen.getByTestId("inspector-list-item-note");
    expect(note).toHaveTextContent("Inside list of Team");
    expect(note).toHaveTextContent("Edits to this Card apply to every Team record.");
    expect(screen.getByTestId("inspector-list-item-link")).toHaveTextContent("This card has no link.");
    fireEvent.click(screen.getByRole("button", { name: "Edit link in Behavior ›" }));
    expect(composer.emit).toHaveBeenCalledWith("ui:inspector-focus-section", { section: "link" });
  });

  it("no link block where Behavior has no Link; nothing outside a list", () => {
    render(<ListItemNote composer={inList("/team.html") as never} elementId="e1" hasLinkSection={false} />);
    expect(screen.queryByTestId("inspector-list-item-link")).toBeNull();
    cleanup();
    const { container } = render(<ListItemNote composer={makeComposer() as never} elementId="e1" hasLinkSection />);
    expect(container.textContent).toBe("");
  });
});

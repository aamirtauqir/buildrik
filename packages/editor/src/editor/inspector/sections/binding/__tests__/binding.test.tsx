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
import { closeSubview, openSubview, useSubview } from "@/editor/inspector/tabs/subviewStore";
import { CmsBindingSection } from "@/editor/inspector/sections/CmsBindingSection";

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
    expect(screen.getByTestId("binding-row")).toHaveTextContent("Text");
    expect(screen.getByTitle("Our menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bind text…" })).toBeInTheDocument();
  });
});

describe("Choose source (Play F2.02)", () => {
  it("groups Record data · Site & page · Live sources; List item says why it is off; site, page and live sources are Planned", () => {
    row(makeComposer());
    fireEvent.click(screen.getByRole("button", { name: "Bind text…" }));
    const picker = screen.getByTestId("choose-source");
    expect(picker).toHaveTextContent("Choose source");
    expect(screen.getByPlaceholderText("Search sources or fields…")).toBeInTheDocument();
    for (const g of ["Record data", "Site & page", "Live sources"]) expect(picker).toHaveTextContent(g);
    expect(screen.getByTestId("choose-source-list")).toHaveTextContent("Select an element inside a collection list");
    expect(screen.getByTestId("choose-source-list")).toBeDisabled();
    expect(screen.getByTestId("choose-source-record")).toHaveTextContent("Pin one record to this property");
    expect(screen.getAllByText("Planned")).toHaveLength(5);
  });

  it("Specific record → a collection → its fitting fields; a field binds the newest published record in one step", async () => {
    const composer = makeComposer();
    row(composer);
    fireEvent.click(screen.getByRole("button", { name: "Bind text…" }));
    fireEvent.click(screen.getByTestId("choose-source-record"));
    fireEvent.click(screen.getByText("Menu"));
    expect(screen.queryByTestId("choose-source-field-photo")).toBeNull();
    fireEvent.click(screen.getByTestId("choose-source-field-name"));
    await waitFor(() =>
      expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-1", "r1", "name", "content", undefined, "Bind Name"),
    );
  });

  it("search finds fields across collections", async () => {
    const composer = makeComposer();
    row(composer);
    fireEvent.click(screen.getByRole("button", { name: "Bind text…" }));
    fireEvent.change(screen.getByPlaceholderText("Search sources or fields…"), { target: { value: "bio" } });
    expect(screen.getByTestId("choose-source-field-bio")).toHaveTextContent("Team · Bio");
    fireEvent.click(screen.getByTestId("choose-source-field-bio"));
    await waitFor(() => expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-2", "r1", "bio", "content", undefined, "Bind Bio"));
  });

  it("on a collection's template page, This page’s record binds no record — each generated page fills its own", () => {
    const composer = makeComposer({ template: true });
    row(composer);
    fireEvent.click(screen.getByRole("button", { name: "Bind text…" }));
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
  it("‹ Back to Content · Text binding · Source · Format As written · If empty · Preview · Open record › · Unbind — keep shown text", async () => {
    const composer = makeComposer({ initial: BOUND });
    render(<BindingDetail composer={composer as never} elementId="e1" />);
    const detail = screen.getByTestId("binding-detail");
    await waitFor(() => expect(screen.getByTestId("binding-detail-preview")).toHaveTextContent("Cacio e pepe"));
    const text = detail.textContent ?? "";
    const at = ["‹ Back to Content", "Text binding", "Source", "Menu · name", "Format", "As written", "If empty", "Preview", "Open record ›", "Unbind — keep shown text", "Keeps “Cacio e pepe” as static text."].map((t) => text.indexOf(t));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("C-11: Open record names where to come back to", async () => {
    const composer = makeComposer({ initial: BOUND });
    render(<BindingDetail composer={composer as never} elementId="e1" />);
    await waitFor(() => expect(screen.getByTestId("binding-open-record")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("binding-open-record"));
    expect(composer.emit).toHaveBeenCalledWith("ui:cms-open", { collectionId: "col-1", recordId: "r1", origin: "Heading · Text binding" });
  });

  it("If empty stores a fallback on the same binding; Unbind keeps the text and closes the detail", async () => {
    const composer = makeComposer({ initial: BOUND });
    act(() => openSubview({ kind: "binding", elementId: "e1" }));
    render(<BindingDetail composer={composer as never} elementId="e1" />);
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
    function Probe() {
      return <span data-testid="open-for">{useSubview()?.elementId ?? "none"}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("open-for")).toHaveTextContent("none");
  });
});

describe("Dynamic bindings summary (Play F2.16, B5-D04)", () => {
  it("draws nothing while unbound", () => {
    const { container } = render(<CmsBindingSection elementId="e1" composer={makeComposer() as never} isOpen />);
    expect(container.textContent).toBe("");
  });

  it("bound: '1 binding' and 'Text · Menu.name ›', which opens the detail", () => {
    render(<CmsBindingSection elementId="e1" composer={makeComposer({ initial: BOUND }) as never} isOpen />);
    expect(screen.getByText("Dynamic bindings")).toBeInTheDocument();
    expect(screen.getByTestId("cms-binding-count")).toHaveTextContent("1 binding");
    expect(screen.getByTestId("cms-binding-summary-row")).toHaveTextContent("Text · Menu.name");
  });

  it("a deleted source says so by name, with Reconnect… and Unbind (board 25)", () => {
    const composer = makeComposer({ initial: [{ collectionId: "col-x", collectionName: "Specials", fieldSlug: "title", property: "content" }] });
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    expect(screen.getByTestId("cms-source-missing")).toHaveTextContent("Source missing — Collection “Specials” was deleted.");
    expect(screen.getByTestId("cms-reconnect")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-unbind"));
    expect(composer.cms.bindings.unbindAll).toHaveBeenCalled();
  });
});

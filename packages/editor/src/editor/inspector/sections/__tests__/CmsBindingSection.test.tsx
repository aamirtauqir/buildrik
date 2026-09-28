/**
 * CmsBindingSection — Behaviour › CMS binding (boards 2, 24, 25).
 * Source Static / From CMS; Collection with "+ New collection…"; Field
 * filtered by what can fill the element; preview "(record 1 of N)"; Open
 * record ›; Unbind + "Unbind keeps the text you see now" (P-2); the missing-
 * source box with Reconnect… / Unbind. Each bind / unbind one undo step.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { CmsBindingSection } from "../CmsBindingSection";

const MENU = {
  id: "col-1",
  name: "Menu",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text" },
    { id: "f2", name: "Photo", slug: "photo", type: "image" },
    { id: "f3", name: "Vegan", slug: "vegan", type: "boolean" },
  ],
};

const TEAM = {
  id: "col-2",
  name: "Team",
  fields: [{ id: "f4", name: "Bio", slug: "bio", type: "text" }],
};

const RECORDS = [
  { id: "r1", data: { name: "Cacio e pepe", photo: "a.jpg" } },
  { id: "r2", data: { name: "Margherita" } },
  { id: "r3", data: { name: "Tiramisu" } },
];

function makeComposer(type = "heading", collections = [MENU], initial: Array<Record<string, unknown>> = []) {
  const bindings: Array<Record<string, unknown>> = [...initial];
  const listeners = new Map<string, Set<() => void>>();
  const emit = (ev: string) => listeners.get(ev)?.forEach((f) => f());
  const on = (ev: string, fn: () => void) => (listeners.get(ev) ?? listeners.set(ev, new Set()).get(ev)!).add(fn);
  const off = (ev: string, fn: () => void) => listeners.get(ev)?.delete(fn);
  const composer = {
    on,
    off,
    emit: vi.fn(),
    elements: { getElement: () => ({ getType: () => type }) },
    cms: {
      collections: {
        on,
        off,
        getAllCollections: () => collections,
        getCollection: (id: string) => collections.find((c) => c.id === id) ?? null,
        queryContent: vi.fn(() => Promise.resolve({ items: RECORDS, total: 3, hasMore: false })),
      },
      bindings: {
        getBindings: () => bindings,
        bindToField: vi.fn((elementId: string, collectionId: string, itemId: string | undefined, fieldSlug: string, property: string) => {
          bindings.splice(0, bindings.length, { collectionId, itemId, fieldSlug, property });
          emit("binding:created");
        }),
        unbindAll: vi.fn(() => {
          bindings.splice(0);
          emit("binding:removed");
        }),
      },
    },
  };
  return composer;
}

const BOUND = [{ collectionId: "col-1", fieldSlug: "name", property: "content" }];

afterEach(() => cleanup());

describe("CmsBindingSection — Source", () => {
  it("unbound: Source reads Static and nothing else is drawn (board 2)", () => {
    render(<CmsBindingSection elementId="e1" composer={makeComposer() as never} isOpen />);
    expect(screen.getByRole("button", { name: "Static" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "From CMS" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByTestId("cms-pickers")).toBeNull();
  });

  it("From CMS → Field binds the page's record (no record), one step, then previews record 1 of N (board 24)", async () => {
    const composer = makeComposer();
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "From CMS" }));
    fireEvent.change(screen.getByLabelText("Field"), { target: { value: "name" } });
    expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-1", undefined, "name", "content", undefined, "Bind Name");
    await waitFor(() => expect(screen.getByTestId("cms-preview")).toHaveTextContent("Cacio e pepe (record 1 of 3)"));
    expect(screen.getByTestId("cms-unbind-hint")).toHaveTextContent("Unbind keeps the text you see now");
  });

  it("Static on a bound element unbinds (one step)", () => {
    const composer = makeComposer("heading", [MENU], BOUND);
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "Static" }));
    expect(composer.cms.bindings.unbindAll).toHaveBeenCalledWith("e1", "Unbind Name");
    expect(screen.getByRole("button", { name: "Static" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("CmsBindingSection — Field filtered by type", () => {
  it("a heading is offered text fields, named slug · type (board 24: 'name · Text')", () => {
    render(<CmsBindingSection elementId="e1" composer={makeComposer("heading", [MENU], BOUND) as never} isOpen />);
    const options = Array.from((screen.getByLabelText("Field") as HTMLSelectElement).options).map((o) => o.textContent);
    expect(options).toContain("name · Text");
    expect(options).not.toContain("photo · Image");
    expect(options).not.toContain("vegan · Yes / no");
  });

  it("an image is offered image fields and binds its source", () => {
    const composer = makeComposer("image");
    render(<CmsBindingSection elementId="img" composer={composer as never} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "From CMS" }));
    const options = Array.from((screen.getByLabelText("Field") as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toEqual(["", "photo"]);
    fireEvent.change(screen.getByLabelText("Field"), { target: { value: "photo" } });
    expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("img", "col-1", undefined, "photo", "src", undefined, "Bind Photo");
  });
});

describe("CmsBindingSection — bound (board 24)", () => {
  it("draws Collection, + New collection…, Field, preview, Open record, Unbind, hint — in that order", async () => {
    const create = vi.fn();
    const { container } = render(
      <CmsBindingSection elementId="e1" composer={makeComposer("heading", [MENU], BOUND) as never} onOpenCreateCollection={create} isOpen />
    );
    await waitFor(() => expect(screen.getByTestId("cms-preview")).toHaveTextContent("(record 1 of 3)"));
    const text = container.textContent ?? "";
    const order = ["Source", "Collection", "+ New collection…", "Field", "Cacio e pepe (record 1 of 3)", "Open record", "Unbind", "Unbind keeps the text you see now"];
    const at = order.map((s) => text.indexOf(s));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    fireEvent.click(screen.getByTestId("cms-new-collection"));
    expect(create).toHaveBeenCalled();
  });

  it("Open record › opens the CMS on the previewed record", async () => {
    const composer = makeComposer("heading", [MENU], BOUND);
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    await waitFor(() => expect(screen.getByTestId("cms-open-record")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("cms-open-record"));
    expect(composer.emit).toHaveBeenCalledWith("ui:cms-open", { collectionId: "col-1", recordId: "r1" });
  });

  it("a binding to a named record previews that record's place", async () => {
    const composer = makeComposer("heading", [MENU], [{ ...BOUND[0], itemId: "r2" }]);
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    await waitFor(() => expect(screen.getByTestId("cms-preview")).toHaveTextContent("Margherita (record 2 of 3)"));
  });

  it("Unbind unbinds in one step", () => {
    const composer = makeComposer("heading", [MENU], BOUND);
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    fireEvent.click(screen.getByTestId("cms-unbind"));
    expect(composer.cms.bindings.unbindAll).toHaveBeenCalledTimes(1);
  });

  /* P-2 / X-10: changing Collection does not unbind; the next Field pick
     replaces the binding in one step. */
  it("changing Collection does not unbind; the next Field pick replaces the binding", () => {
    const composer = makeComposer("heading", [MENU, TEAM], BOUND);
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    fireEvent.change(screen.getByLabelText("Collection"), { target: { value: "col-2" } });
    expect(composer.cms.bindings.unbindAll).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Field")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Field"), { target: { value: "bio" } });
    expect(composer.cms.bindings.unbindAll).not.toHaveBeenCalled();
    expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-2", undefined, "bio", "content", undefined, "Bind Bio");
  });

  it("with no collections: a note and the + New collection… door", () => {
    const create = vi.fn();
    render(<CmsBindingSection elementId="e1" composer={makeComposer("heading", []) as never} onOpenCreateCollection={create} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "From CMS" }));
    expect(screen.getByTestId("cms-no-collections")).toHaveTextContent("No collections yet.");
    fireEvent.click(screen.getByTestId("cms-new-collection"));
    expect(create).toHaveBeenCalled();
  });
});

describe("CmsBindingSection — source missing (board 25)", () => {
  const GONE = [{ collectionId: "col-deleted", fieldSlug: "title", property: "content" }];

  it("says the source is missing, with Reconnect… and Unbind, and no pickers", () => {
    render(<CmsBindingSection elementId="e1" composer={makeComposer("heading", [MENU], GONE) as never} isOpen />);
    expect(screen.getByRole("button", { name: "From CMS" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("cms-source-missing")).toHaveTextContent(/^Source missing — .*deleted\. Reconnect a source or keep the current text\.$/);
    expect(screen.getByTestId("cms-reconnect")).toHaveTextContent("Reconnect…");
    expect(screen.getByTestId("cms-unbind")).toBeTruthy();
    expect(screen.queryByTestId("cms-pickers")).toBeNull();
  });

  it("names the deleted collection when the binding stored it (board 25)", () => {
    const named = [{ ...GONE[0], collectionName: "Specials" }];
    render(<CmsBindingSection elementId="e1" composer={makeComposer("heading", [MENU], named) as never} isOpen />);
    expect(screen.getByTestId("cms-source-missing")).toHaveTextContent(
      "Source missing — Collection “Specials” was deleted. Reconnect a source or keep the current text."
    );
  });

  it("an old binding with no stored name keeps the generic line", () => {
    render(<CmsBindingSection elementId="e1" composer={makeComposer("heading", [MENU], GONE) as never} isOpen />);
    expect(screen.getByTestId("cms-source-missing")).toHaveTextContent(
      "Source missing — the collection this followed was deleted. Reconnect a source or keep the current text."
    );
  });

  it("Reconnect… opens the pickers; a Field pick replaces the dead binding in one step", () => {
    const composer = makeComposer("heading", [MENU], GONE);
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    fireEvent.click(screen.getByTestId("cms-reconnect"));
    expect(screen.getByLabelText("Collection")).toHaveValue("col-1");
    fireEvent.change(screen.getByLabelText("Field"), { target: { value: "name" } });
    expect(composer.cms.bindings.unbindAll).not.toHaveBeenCalled();
    expect(composer.cms.bindings.bindToField).toHaveBeenCalledWith("e1", "col-1", undefined, "name", "content", undefined, "Bind Name");
    expect(screen.queryByTestId("cms-source-missing")).toBeNull();
  });

  it("Unbind keeps the text and clears the binding", () => {
    const composer = makeComposer("heading", [MENU], GONE);
    render(<CmsBindingSection elementId="e1" composer={composer as never} isOpen />);
    fireEvent.click(screen.getByTestId("cms-unbind"));
    expect(composer.cms.bindings.unbindAll).toHaveBeenCalledWith("e1", "Unbind title");
    expect(screen.queryByTestId("cms-source-missing")).toBeNull();
  });
});

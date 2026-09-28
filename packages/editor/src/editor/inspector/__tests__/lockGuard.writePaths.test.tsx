// @vitest-environment jsdom
/**
 * P-1 follow-up — every Inspector write path respects the lock.
 *
 * P-1 closed the style writers (useStyleHandlers) and ⋯ Delete. The rest of
 * the panel wrote straight through: attributes and ID/classes, custom data
 * attributes, form fields, slider playback and slides, link, class chips,
 * breakpoint "Revert", ⋯ "Reset all styles", CMS bind/unbind, and the
 * multi-select batch editor. Each is driven here against a locked element:
 * nothing changes, and the shell is told (LOCKED_ELEMENTS_SKIPPED — the same
 * signal delete/cut/nudge raise, which useClipboardToasts turns into
 * "Locked elements were skipped").
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type Mock } from "vitest";
import { render, screen, fireEvent, cleanup, act, renderHook } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { ToastProvider } from "@/editor/chrome-ui";
import { TypeBlockSection } from "../sections/typeBlock/TypeBlockSection";
import { AttributesSection } from "../sections/attributes/AttributesSection";
import { DataAttributeEditor } from "../sections/attributes/DataAttributeEditor";
import { FormFieldsSection } from "../sections/FormFieldsSection";
import { SliderPlaybackSection } from "../sections/SliderPlaybackSection";
import { SlidesSection } from "../sections/SlidesSection";
import { LinkSection } from "../sections/LinkSection";
import { CSSClassesSection } from "../sections/CSSClassesSection";
import { CollectionListSection } from "../sections/CollectionListSection";
import { useFieldOverrides } from "../hooks/useFieldOverrides";
import { CmsBindingSection } from "../sections/CmsBindingSection";
import { InspectorElementMenu } from "../components/InspectorElementMenu";
import { useBatchStyleHandler } from "../hooks/useBatchStyleHandler";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

let composer: Composer;
let rootId: string;
let skipped: Mock<(payload?: unknown) => void>;

beforeEach(() => {
  composer = createTestComposer();
  rootId = composer.elements.createPage("Home").root.id;
  skipped = vi.fn<(payload?: unknown) => void>();
  composer.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
});

function add(type: string, props: Record<string, unknown> = {}, parentId = rootId): Element {
  const el = composer.elements.createElement(type as never, props as never);
  composer.elements.addElement(el, parentId);
  return composer.elements.getElement(el.getId())!;
}

const lock = (el: Element) => el.setLocked(true);

describe("P-1 — attribute writers refuse a locked element", () => {
  it("Type block: editing a defining attribute", () => {
    const img = add("image", { attributes: { alt: "cat" } });
    lock(img);
    render(
      <TypeBlockSection element={{ id: img.getId(), type: "image" }} targetIds={[img.getId()]} composer={composer} styles={{}} onChange={() => {}} onBatchChange={() => {}} isOpen onToggle={() => {}} />
    );
    fireEvent.change(screen.getByPlaceholderText("Describe the image"), { target: { value: "a dog" } });
    expect(img.getAttribute("alt")).toBe("cat");
    expect(skipped).toHaveBeenCalled();
  });

  it("Attributes: editing the element ID", () => {
    const img = add("image");
    lock(img);
    render(<AttributesSection element={{ id: img.getId(), type: "image" }} targetIds={[img.getId()]} composer={composer} isOpen onToggle={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("element-id"), { target: { value: "hero" } });
    expect(img.getAttribute("id")).toBeFalsy();
    expect(skipped).toHaveBeenCalled();
  });

  it("DataAttributeEditor: adding a data attribute", () => {
    const box = add("container");
    lock(box);
    render(<DataAttributeEditor elementId={box.getId()} composer={composer} />);
    fireEvent.change(screen.getByPlaceholderText("data-*"), { target: { value: "data-x" } });
    fireEvent.change(screen.getByPlaceholderText("value"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Add attribute" }));
    expect(box.getAttribute("data-x")).toBeUndefined();
    expect(skipped).toHaveBeenCalled();
  });

  it("LinkSection: changing the link target", () => {
    const link = add("link", { attributes: { href: "https://a.com" } });
    lock(link);
    render(<LinkSection selectedElement={{ id: link.getId(), type: "link" }} composer={composer} isOpen />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Open in new tab" }));
    expect(link.getAttribute("target")).toBeUndefined();
    expect(skipped).toHaveBeenCalled();
  });

  it("LinkSection: editing Rel", () => {
    const link = add("link", { attributes: { href: "https://a.com", rel: "nofollow" } });
    lock(link);
    render(<LinkSection selectedElement={{ id: link.getId(), type: "link" }} composer={composer} isOpen />);
    const rel = screen.getByLabelText("Rel");
    fireEvent.change(rel, { target: { value: "sponsored" } });
    fireEvent.keyDown(rel, { key: "Enter" });
    expect(link.getAttribute("rel")).toBe("nofollow");
    expect(skipped).toHaveBeenCalled();
  });

  it("CSSClassesSection: adding a class", () => {
    const box = add("container");
    lock(box);
    render(<CSSClassesSection selectedElement={{ id: box.getId(), type: "container" }} composer={composer} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: /add class/i }));
    const input = screen.getByPlaceholderText("class-name");
    fireEvent.change(input, { target: { value: "hero" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(box.getClasses()).not.toContain("hero");
    expect(skipped).toHaveBeenCalled();
  });
});

describe("P-1 — structure writers refuse a locked form / slider", () => {
  it("FormFieldsSection: changing a field's type and adding a field", () => {
    const form = add("form");
    add("input", { attributes: { type: "text", name: "name", placeholder: "Name" } }, form.getId());
    lock(form);
    render(<FormFieldsSection elementId={form.getId()} composer={composer} isOpen />);
    fireEvent.change(screen.getByRole("combobox", { name: "Name type" }), { target: { value: "email" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Add field" }));
    const fields = form.getChildren();
    expect(fields).toHaveLength(1);
    expect(fields[0].getAttribute("type")).toBe("text");
    expect(skipped).toHaveBeenCalled();
  });

  it("SliderPlaybackSection: toggling autoplay", () => {
    const slider = add("slider", { classes: ["buildrick-slider"] });
    lock(slider);
    render(<SliderPlaybackSection elementId={slider.getId()} composer={composer} isOpen />);
    fireEvent.click(screen.getByRole("switch", { name: "Autoplay" }));
    expect(slider.getAttribute("data-autoplay")).toBeUndefined();
    expect(skipped).toHaveBeenCalled();
  });

  it("SlidesSection: adding a slide", () => {
    const slider = add("slider", { classes: ["buildrick-slider"] });
    add("container", { classes: ["buildrick-slide"] }, slider.getId());
    lock(slider);
    render(<SlidesSection elementId={slider.getId()} composer={composer} isOpen />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "+ Add slide" }));
    });
    expect(slider.getChildren()).toHaveLength(1);
    expect(skipped).toHaveBeenCalled();
  });
});

describe("P-1 — style resets refuse a locked element", () => {
  it("Context row: Revert (the breakpoint's overrides)", () => {
    const h = add("heading", { content: "T" });
    composer.styles.setBreakpointStyle(h.getId(), "tablet", { color: "rgb(1, 1, 1)" });
    lock(h);
    const { result } = renderHook(() => useFieldOverrides(composer, h.getId(), "tablet"));
    act(() => result.current.revertBreakpoint());
    expect(composer.styles.getBreakpointStyle(h.getId(), "tablet")).toEqual({ color: "rgb(1, 1, 1)" });
    expect(skipped).toHaveBeenCalled();
  });

  it("InspectorElementMenu: Reset style", () => {
    const h = add("heading", { content: "T" });
    h.setStyle("color", "rgb(1, 1, 1)");
    lock(h);
    composer.selection.select(h);
    render(<InspectorElementMenu composer={composer} selectedElementId={h.getId()} />, {
      wrapper: ToastProvider,
    });
    fireEvent.click(screen.getByRole("button", { name: /element actions/i }));
    fireEvent.click(screen.getByText("Reset style"));
    expect(h.getStyles().color).toBe("rgb(1, 1, 1)");
    expect(skipped).toHaveBeenCalled();
  });
});

describe("P-1 — multi-select batch edits skip locked members and say so", () => {
  it("writes the unlocked members only", () => {
    const a = add("heading", { content: "A" });
    const b = add("heading", { content: "B" });
    lock(b);
    const ids = [a.getId(), b.getId()];
    const { result } = renderHook(() => useBatchStyleHandler(composer, ids, "desktop", "normal"));
    act(() => result.current.handleBatchStyleChange({ color: "rgb(9, 9, 9)" }));
    expect(a.getStyles().color).toBe("rgb(9, 9, 9)");
    expect(b.getStyles().color).toBeUndefined();
    expect(skipped).toHaveBeenCalledTimes(1);
  });
});

describe("P-1 — CMS binding writers refuse a locked element", () => {
  function cmsComposer(locked: boolean) {
    const unbindAll = vi.fn();
    const bindCollectionList = vi.fn();
    const emit = vi.fn();
    const el = { getId: () => "list", isLocked: () => locked, getType: () => "container" };
    const c = {
      on: vi.fn(),
      off: vi.fn(),
      emit,
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      elements: { getElement: () => el },
      cms: {
        on: vi.fn(),
        off: vi.fn(),
        bindings: {
          unbindAll,
          bindCollectionList,
          unbindCollection: vi.fn(),
          getCollectionBinding: vi.fn(() => null),
          getBindings: vi.fn(() => [{ elementId: "list", collectionId: "menu", fieldSlug: "title", property: "content" }]),
          getElementBindings: vi.fn(() => [{ elementId: "list", collectionId: "menu", fieldSlug: "title", property: "content" }]),
        },
        collections: {
          on: vi.fn(),
          off: vi.fn(),
          getAllCollections: vi.fn(() => [{ id: "menu", name: "Menu", slug: "menu", fields: [{ slug: "title", name: "Title" }] }]),
          getCollection: vi.fn(() => ({ id: "menu", name: "Menu", slug: "menu", fields: [{ slug: "title", name: "Title" }] })),
          queryContent: vi.fn(() => Promise.resolve({ items: [], total: 0, hasMore: false })),
        },
      },
    } as unknown as Composer;
    return { c, unbindAll, bindCollectionList, emit };
  }

  it("CollectionListSection: binding a list", () => {
    const { c, bindCollectionList, emit } = cmsComposer(true);
    render(<CollectionListSection elementId="list" composer={c} isOpen />);
    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), { target: { value: "menu" } });
    expect(bindCollectionList).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
  });

  it("CmsBindingSection: Unbind", () => {
    const { c, unbindAll } = cmsComposer(true);
    render(<CmsBindingSection composer={c} elementId="list" isOpen />);
    const unbind = screen.queryByRole("button", { name: "Unbind" });
    if (!unbind) throw new Error("section did not render the bound state — fixture out of date");
    fireEvent.click(unbind);
    expect(unbindAll).not.toHaveBeenCalled();
  });
});

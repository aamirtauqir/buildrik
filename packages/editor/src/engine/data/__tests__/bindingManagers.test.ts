/**
 * Style / Trait / Text binding managers (BaseBindingManager subclasses) —
 * bind/replace/unbind registry semantics, application to elements, reactive
 * re-apply on source:updated, export/import, destroy unsubscription.
 *
 * Uses a REAL DataManager for resolution so the source:updated wiring is
 * exercised end-to-end; elements are mocks.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { DataManager } from "../DataManager";
import { StyleDataBinding, type StyleBinding } from "../StyleDataBinding";
import { TraitDataBinding, type TraitBinding } from "../TraitDataBinding";
import { TextDataBinding, type TextBinding } from "../TextDataBinding";
import type { Composer } from "../../Composer";
import type { VariableBinding } from "@/shared/types/data";

interface MockElement {
  setStyle: ReturnType<typeof vi.fn>;
  setAttribute: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
  setContent: ReturnType<typeof vi.fn>;
  getContent: ReturnType<typeof vi.fn>;
}

function makeElement(): MockElement {
  return {
    setStyle: vi.fn(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    setContent: vi.fn(),
    getContent: vi.fn(() => "original"),
  };
}

function makeHarness() {
  const elements = new Map<string, MockElement>();
  const composer = {
    elements: { getElement: (id: string) => elements.get(id) },
  } as unknown as Composer & { data: DataManager };
  const data = new DataManager(composer);
  (composer as { data: DataManager }).data = data;
  data.registerSource({
    id: "theme",
    name: "Theme",
    type: "object",
    data: { accent: "#2D6DFF", link: "https://a.example", title: "Hello" },
  });
  return { composer, data, elements };
}

function variableBinding(path: string, fallback?: string): VariableBinding {
  return { type: "variable", sourceId: "theme", path, fallback };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("StyleDataBinding", () => {
  it("bind applies the resolved value to the element's CSS property", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new StyleDataBinding(composer);

    manager.bind("el-1", { property: "color", binding: variableBinding("accent") });
    await flush();

    expect(el.setStyle).toHaveBeenCalledWith("color", "#2D6DFF");
  });

  it("re-binding the same property replaces instead of duplicating", async () => {
    const { composer, elements } = makeHarness();
    elements.set("el-1", makeElement());
    const manager = new StyleDataBinding(composer);

    manager.bind("el-1", { property: "color", binding: variableBinding("accent") });
    manager.bind("el-1", { property: "color", binding: variableBinding("title") });
    manager.bind("el-1", { property: "background", binding: variableBinding("accent") });

    const bindings = manager.getBindings("el-1");
    expect(bindings).toHaveLength(2);
    expect(bindings.map((b) => (b as StyleBinding).property).sort()).toEqual([
      "background",
      "color",
    ]);
  });

  it("re-applies when the bound data source updates", async () => {
    const { composer, data, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new StyleDataBinding(composer);
    manager.bind("el-1", { property: "color", binding: variableBinding("accent") });
    await flush();
    el.setStyle.mockClear();

    data.updateSourceData("theme", { accent: "#FF0000" });
    await flush();

    expect(el.setStyle).toHaveBeenCalledWith("color", "#FF0000");
  });

  it("does not re-apply for updates to unrelated sources", async () => {
    const { composer, data, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new StyleDataBinding(composer);
    manager.bind("el-1", { property: "color", binding: variableBinding("accent") });
    await flush();
    el.setStyle.mockClear();

    data.registerSource({ id: "other", name: "O", type: "object", data: {} });
    data.updateSourceData("other", { x: 1 });
    await flush();

    expect(el.setStyle).not.toHaveBeenCalled();
  });

  it("applies the fallback string when resolution fails", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new StyleDataBinding(composer);

    manager.bind("el-1", {
      property: "color",
      binding: { type: "variable", sourceId: "ghost", path: "x" },
      fallback: "#111827",
    });
    await flush();

    expect(el.setStyle).toHaveBeenCalledWith("color", "#111827");
  });

  it("unbind removes one property; unbindAll clears the element", () => {
    const { composer, elements } = makeHarness();
    elements.set("el-1", makeElement());
    const manager = new StyleDataBinding(composer);
    manager.bind("el-1", { property: "color", binding: variableBinding("accent") });
    manager.bind("el-1", { property: "background", binding: variableBinding("accent") });

    manager.unbind("el-1", "color");
    expect(manager.getBindings("el-1").map((b) => (b as StyleBinding).property)).toEqual([
      "background",
    ]);

    manager.unbindAll("el-1");
    expect(manager.getBindings("el-1")).toEqual([]);
  });

  it("export/import round-trips the registry and re-applies on import", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new StyleDataBinding(composer);
    manager.bind("el-1", { property: "color", binding: variableBinding("accent") });

    const exported = manager.export();
    expect(Object.keys(exported)).toEqual(["el-1"]);

    const fresh = new StyleDataBinding(composer);
    el.setStyle.mockClear();
    fresh.import(exported);
    await flush();

    expect(fresh.getBindings("el-1")).toHaveLength(1);
    expect(el.setStyle).toHaveBeenCalledWith("color", "#2D6DFF");
  });

  it("destroy unsubscribes from source:updated and clears bindings", async () => {
    const { composer, data, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new StyleDataBinding(composer);
    manager.bind("el-1", { property: "color", binding: variableBinding("accent") });
    await flush();

    manager.destroy();
    el.setStyle.mockClear();
    data.updateSourceData("theme", { accent: "#00FF00" });
    await flush();

    expect(el.setStyle).not.toHaveBeenCalled();
    expect(manager.getBindings("el-1")).toEqual([]);
  });
});

describe("TraitDataBinding", () => {
  it("bind applies the resolved value as an attribute", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new TraitDataBinding(composer);

    manager.bind("el-1", { attribute: "href", binding: variableBinding("link") });
    await flush();

    expect(el.setAttribute).toHaveBeenCalledWith("href", "https://a.example");
  });

  it("de-dupes bindings per attribute name", () => {
    const { composer, elements } = makeHarness();
    elements.set("el-1", makeElement());
    const manager = new TraitDataBinding(composer);
    manager.bind("el-1", { attribute: "href", binding: variableBinding("link") });
    manager.bind("el-1", { attribute: "href", binding: variableBinding("title") });

    const bindings = manager.getBindings("el-1");
    expect(bindings).toHaveLength(1);
    expect((bindings[0] as TraitBinding).binding.path).toBe("title");
  });

  it("removes the attribute when value is empty and removeIfEmpty is set", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new TraitDataBinding(composer);

    manager.bind("el-1", {
      attribute: "alt",
      binding: { type: "variable", sourceId: "ghost", path: "x" },
      removeIfEmpty: true,
    });
    await flush();

    expect(el.removeAttribute).toHaveBeenCalledWith("alt");
    expect(el.setAttribute).not.toHaveBeenCalled();
  });

  it("sets the empty value when removeIfEmpty is not set", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new TraitDataBinding(composer);

    manager.bind("el-1", {
      attribute: "alt",
      binding: { type: "variable", sourceId: "ghost", path: "x" },
    });
    await flush();

    expect(el.setAttribute).toHaveBeenCalledWith("alt", "");
  });

  it("re-applies attributes on source update", async () => {
    const { composer, data, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new TraitDataBinding(composer);
    manager.bind("el-1", { attribute: "href", binding: variableBinding("link") });
    await flush();
    el.setAttribute.mockClear();

    data.updateSourceData("theme", { link: "https://b.example" });
    await flush();

    expect(el.setAttribute).toHaveBeenCalledWith("href", "https://b.example");
  });
});

describe("TextDataBinding", () => {
  it("bind writes the resolved value as element content", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new TextDataBinding(composer);

    manager.bind("el-1", { binding: variableBinding("title") } as TextBinding);
    await flush();

    expect(el.setContent).toHaveBeenCalledWith("Hello");
  });

  it("keys bindings by target property, defaulting to 'content'", () => {
    const { composer, elements } = makeHarness();
    elements.set("el-1", makeElement());
    const manager = new TextDataBinding(composer);
    manager.bind("el-1", { binding: variableBinding("title") } as TextBinding);
    manager.bind("el-1", { binding: variableBinding("accent") } as TextBinding);

    expect(manager.getBindings("el-1")).toHaveLength(1);
  });

  it("prefers the TextBinding.fallback over the inner binding fallback", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new TextDataBinding(composer);

    manager.bind("el-1", {
      binding: { type: "variable", sourceId: "ghost", path: "x", fallback: "inner" },
      fallback: "outer",
    } as TextBinding);
    await flush();

    expect(el.setContent).toHaveBeenCalledWith("outer");
  });

  it("uses the inner binding fallback when no outer fallback is given", async () => {
    const { composer, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new TextDataBinding(composer);

    manager.bind("el-1", {
      binding: { type: "variable", sourceId: "ghost", path: "x", fallback: "inner" },
    } as TextBinding);
    await flush();

    expect(el.setContent).toHaveBeenCalledWith("inner");
  });

  it("missing element is a silent no-op", async () => {
    const { composer } = makeHarness();
    const manager = new TextDataBinding(composer);

    manager.bind("ghost-el", { binding: variableBinding("title") } as TextBinding);
    await flush();
    // Nothing to assert beyond "did not throw" — registry still records it.
    expect(manager.getBindings("ghost-el")).toHaveLength(1);
  });

  it("re-applies text on source update", async () => {
    const { composer, data, elements } = makeHarness();
    const el = makeElement();
    elements.set("el-1", el);
    const manager = new TextDataBinding(composer);
    manager.bind("el-1", { binding: variableBinding("title") } as TextBinding);
    await flush();
    el.setContent.mockClear();

    data.updateSourceData("theme", { title: "Updated" });
    await flush();

    expect(el.setContent).toHaveBeenCalledWith("Updated");
  });
});

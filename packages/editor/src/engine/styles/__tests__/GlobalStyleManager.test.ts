/**
 * GlobalStyleManager tests — named global styles CRUD, class
 * generation, application to elements, tree re-application, events.
 *
 * @module engine/styles/__tests__/GlobalStyleManager
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GlobalStyleManager } from "../GlobalStyleManager";
import type { GlobalStyle } from "../GlobalStyleManager";
import { EVENTS } from "@shared/constants/events";


/**
 * Composer mock with typed handles on the spies. GlobalStyleManager
 * touches composer.markDirty, composer.styles.setRule (applyAsClass)
 * and composer.elements.getElement/getActivePage (apply + tree update).
 */
function makeComposerHarness() {
  const markDirty = vi.fn();
  const setRule = vi.fn();
  const getElement = vi.fn();
  const getActivePage = vi.fn();
  return {
    composer: {
      markDirty,
      styles: { setRule },
      elements: { getElement, getActivePage },
    } as unknown as ConstructorParameters<typeof GlobalStyleManager>[0],
    markDirty,
    setRule,
    getElement,
    getActivePage,
  };
}

interface MockTreeElement {
  getId: () => string;
  setStyle: ReturnType<typeof vi.fn>;
  setData: (key: string, value: unknown) => void;
  getCustomData: (key: string) => unknown;
  getChildren: () => MockTreeElement[];
}

/**
 * Element mock faithful to the Element custom-data semantics
 * GlobalStyleManager relies on: setData writes into a bag that
 * getCustomData reads back (data.data in the real Element).
 */
function makeElementMock(
  id: string,
  opts?: { globalStyleId?: string; children?: MockTreeElement[] }
): MockTreeElement {
  const customData: Record<string, unknown> = {};
  if (opts?.globalStyleId) {
    customData.globalStyleId = opts.globalStyleId;
  }
  return {
    getId: () => id,
    setStyle: vi.fn(),
    setData: (key: string, value: unknown) => {
      customData[key] = value;
    },
    getCustomData: (key: string) => customData[key],
    getChildren: () => opts?.children ?? [],
  };
}

const customStyle = (overrides?: Partial<GlobalStyle>): GlobalStyle => ({
  id: "custom-1",
  name: "Custom Style",
  category: "Custom",
  styles: { color: "teal", padding: "4px" },
  tags: ["custom", "test"],
  ...overrides,
});

/* G2-165: the seven built-in presets (purple #667eea buttons etc.) are
   gone, and with them the "system style" concept. A new manager is empty. */
describe("GlobalStyleManager — no built-ins", () => {
  it("starts empty", () => {
    expect(new GlobalStyleManager(makeComposerHarness().composer).getAll()).toEqual([]);
  });
});

describe("GlobalStyleManager.define", () => {
  let manager: GlobalStyleManager;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    harness = makeComposerHarness();
    manager = new GlobalStyleManager(harness.composer);
  });

  it("adds a custom style retrievable via get and getAll", () => {
    manager.define(customStyle());

    expect(manager.get("custom-1")?.name).toBe("Custom Style");
    expect(manager.getAll()).toHaveLength(1);
  });

  it("emits style:defined with the style", () => {
    const handler = vi.fn();
    manager.on(EVENTS.STYLE_DEFINED, handler);

    const style = customStyle();
    manager.define(style);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(style);
  });

  it("marks the project dirty", () => {
    harness.markDirty.mockClear(); // registerDefaults already called it 7x
    manager.define(customStyle());
    expect(harness.markDirty).toHaveBeenCalledTimes(1);
  });

  it("throws on duplicate id", () => {
    manager.define(customStyle());
    expect(() => manager.define(customStyle())).toThrow('Global style "custom-1" already exists');
  });
});

describe("GlobalStyleManager lookup — get / getByCategory / search", () => {
  let manager: GlobalStyleManager;

  beforeEach(() => {
    manager = new GlobalStyleManager(makeComposerHarness().composer);
    manager.define(customStyle());
  });

  it("get returns undefined for unknown ids", () => {
    expect(manager.get("nope")).toBeUndefined();
  });

  it("getByCategory filters by exact category", () => {
    expect(manager.getByCategory("Custom").map((s) => s.id)).toEqual(["custom-1"]);
    expect(manager.getByCategory("Nonexistent")).toEqual([]);
  });

  it("search matches names case-insensitively", () => {
    expect(manager.search("CUSTOM STYLE").map((s) => s.id)).toEqual(["custom-1"]);
  });

  it("search matches tags", () => {
    expect(manager.search("test").map((s) => s.id)).toEqual(["custom-1"]);
  });

  it("search returns [] when nothing matches", () => {
    expect(manager.search("zzz-no-match")).toEqual([]);
  });
});

describe("GlobalStyleManager.update", () => {
  let manager: GlobalStyleManager;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    harness = makeComposerHarness();
    manager = new GlobalStyleManager(harness.composer);
    manager.define(customStyle());
  });

  it("updates styles and metadata on a custom style", () => {
    manager.update("custom-1", {
      name: "Renamed",
      styles: { color: "navy" },
    });

    const updated = manager.get("custom-1");
    expect(updated?.name).toBe("Renamed");
    // Object.assign replaces the whole styles object (no deep merge)
    expect(updated?.styles).toEqual({ color: "navy" });
  });

  it("emits style:updated with { id, style } and marks dirty", () => {
    const handler = vi.fn();
    manager.on(EVENTS.STYLE_UPDATED, handler);
    harness.markDirty.mockClear();

    manager.update("custom-1", { name: "Renamed" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ id: "custom-1", style: manager.get("custom-1") });
    expect(harness.markDirty).toHaveBeenCalledTimes(1);
  });

  it("throws for unknown ids", () => {
    expect(() => manager.update("nope", { name: "x" })).toThrow('Global style "nope" not found');
  });

  it("re-applies styles to all elements in the tree bound to the style", () => {
    const matchingChild = makeElementMock("child-a", { globalStyleId: "custom-1" });
    const nestedMatch = makeElementMock("grandchild", { globalStyleId: "custom-1" });
    const otherBinding = makeElementMock("child-b", {
      globalStyleId: "other-style",
      children: [nestedMatch],
    });
    const root = makeElementMock("root-1", { children: [matchingChild, otherBinding] });

    harness.getActivePage.mockReturnValue({ root: { id: "root-1" } });
    harness.getElement.mockImplementation((id: string) => (id === "root-1" ? root : undefined));

    manager.update("custom-1", { styles: { color: "navy", margin: "2px" } });

    // Matching elements get every property of the NEW styles re-applied
    expect(matchingChild.setStyle).toHaveBeenCalledWith("color", "navy");
    expect(matchingChild.setStyle).toHaveBeenCalledWith("margin", "2px");
    expect(nestedMatch.setStyle).toHaveBeenCalledWith("color", "navy");
    expect(nestedMatch.setStyle).toHaveBeenCalledWith("margin", "2px");
    // Elements bound to a different global style are untouched
    expect(otherBinding.setStyle).not.toHaveBeenCalled();
    expect(root.setStyle).not.toHaveBeenCalled();
  });

  it("tolerates a missing active page", () => {
    harness.getActivePage.mockReturnValue(undefined);
    expect(() => manager.update("custom-1", { styles: { color: "navy" } })).not.toThrow();
  });

  it("tolerates a missing root element", () => {
    harness.getActivePage.mockReturnValue({ root: { id: "root-1" } });
    harness.getElement.mockReturnValue(undefined);
    expect(() => manager.update("custom-1", { styles: { color: "navy" } })).not.toThrow();
  });
});

describe("GlobalStyleManager.delete", () => {
  let manager: GlobalStyleManager;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    harness = makeComposerHarness();
    manager = new GlobalStyleManager(harness.composer);
    manager.define(customStyle());
  });

  it("deletes a custom style and emits style:deleted", () => {
    const handler = vi.fn();
    manager.on(EVENTS.STYLE_DELETED, handler);
    harness.markDirty.mockClear();

    manager.delete("custom-1");

    expect(manager.get("custom-1")).toBeUndefined();
    expect(handler).toHaveBeenCalledWith({ id: "custom-1" });
    expect(harness.markDirty).toHaveBeenCalledTimes(1);
  });

  it("throws for unknown ids", () => {
    expect(() => manager.delete("nope")).toThrow('Global style "nope" not found');
  });
});

describe("GlobalStyleManager apply — element application", () => {
  let manager: GlobalStyleManager;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    harness = makeComposerHarness();
    manager = new GlobalStyleManager(harness.composer);
    manager.define(customStyle());
  });

  it("applyToElement sets every property, stores globalStyleId, emits style:applied", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);
    const handler = vi.fn();
    manager.on(EVENTS.STYLE_APPLIED, handler);

    manager.applyToElement("custom-1", "el-1");

    expect(el.setStyle).toHaveBeenCalledTimes(2);
    expect(el.setStyle).toHaveBeenCalledWith("color", "teal");
    expect(el.setStyle).toHaveBeenCalledWith("padding", "4px");
    expect(el.getCustomData("globalStyleId")).toBe("custom-1");
    expect(handler).toHaveBeenCalledWith({ styleId: "custom-1", elementId: "el-1" });
  });

  it("apply() behaves identically to applyToElement()", () => {
    const el = makeElementMock("el-1");
    harness.getElement.mockReturnValue(el);

    manager.apply("custom-1", "el-1");

    expect(el.setStyle).toHaveBeenCalledWith("color", "teal");
    expect(el.getCustomData("globalStyleId")).toBe("custom-1");
  });

  it("throws for an unknown style", () => {
    expect(() => manager.applyToElement("nope", "el-1")).toThrow(
      'Global style "nope" not found'
    );
  });

  it("throws for an unknown element", () => {
    harness.getElement.mockReturnValue(undefined);
    expect(() => manager.applyToElement("custom-1", "el-1")).toThrow(
      'Element "el-1" not found'
    );
  });
});

describe("GlobalStyleManager.applyAsClass — class generation", () => {
  let manager: GlobalStyleManager;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    harness = makeComposerHarness();
    manager = new GlobalStyleManager(harness.composer);
    manager.define(customStyle());
  });

  it("creates a CSS class rule through composer.styles.setRule and emits style:class:created", () => {
    const handler = vi.fn();
    manager.on(EVENTS.STYLE_CLASS_CREATED, handler);

    manager.applyAsClass("custom-1", "my-class");

    expect(harness.setRule).toHaveBeenCalledTimes(1);
    expect(harness.setRule).toHaveBeenCalledWith(".my-class", {
      color: "teal",
      padding: "4px",
    });
    expect(handler).toHaveBeenCalledWith({ styleId: "custom-1", className: "my-class" });
  });

  it("throws for an unknown style without creating a rule", () => {
    expect(() => manager.applyAsClass("nope", "my-class")).toThrow(
      'Global style "nope" not found'
    );
    expect(harness.setRule).not.toHaveBeenCalled();
  });
});

describe("GlobalStyleManager export / import / clear / destroy", () => {
  let manager: GlobalStyleManager;
  let harness: ReturnType<typeof makeComposerHarness>;

  beforeEach(() => {
    harness = makeComposerHarness();
    manager = new GlobalStyleManager(harness.composer);
  });

  it("export returns every defined style", () => {
    expect(manager.export()).toEqual([]);

    const style = customStyle();
    manager.define(style);

    expect(manager.export()).toEqual([style]);
  });

  it("import adds new styles", () => {
    manager.import([customStyle(), customStyle({ id: "custom-2", name: "Second" })]);

    expect(manager.get("custom-1")).toBeDefined();
    expect(manager.get("custom-2")).toBeDefined();
  });

  it("import never overrides existing ids", () => {
    manager.define(customStyle());
    manager.import([customStyle({ name: "Evil Override" })]);
    expect(manager.get("custom-1")?.name).toBe("Custom Style");
  });

  it("import emits styles:imported with the INPUT count (skipped duplicates included)", () => {
    const handler = vi.fn();
    manager.on(EVENTS.STYLES_IMPORTED, handler);

    // custom-1 already exists and is skipped, but count reflects the input
    // array length — current behavior, documents the quirk.
    manager.define(customStyle());
    manager.import([customStyle(), customStyle({ id: "custom-2" })]);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ count: 2 });
  });

  it("clear removes every style and emits styles:cleared", () => {
    manager.define(customStyle());
    const handler = vi.fn();
    manager.on(EVENTS.STYLES_CLEARED, handler);

    manager.clear();

    expect(manager.get("custom-1")).toBeUndefined();
    expect(manager.getAll()).toEqual([]);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("destroy clears the styles and removes all listeners", () => {
    manager.define(customStyle());
    const definedHandler = vi.fn();
    const clearedHandler = vi.fn();
    manager.on(EVENTS.STYLE_DEFINED, definedHandler);
    manager.on(EVENTS.STYLES_CLEARED, clearedHandler);

    manager.destroy();

    // destroy() runs clear() BEFORE removing listeners, so the cleared
    // event still reaches subscribers once
    expect(clearedHandler).toHaveBeenCalledTimes(1);
    expect(manager.get("custom-1")).toBeUndefined();

    // Listeners are gone: a post-destroy define emits into the void
    manager.define(customStyle({ id: "post-destroy" }));
    expect(definedHandler).not.toHaveBeenCalled();
  });
});

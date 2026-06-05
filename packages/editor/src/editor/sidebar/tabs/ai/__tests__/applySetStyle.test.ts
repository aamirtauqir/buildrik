import { describe, it, expect, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import {
  applySetStyle,
  applySetText,
  applyAddElement,
  applyAddSection,
  applyDeleteElement,
  applyDuplicateElement,
  applyMoveElement,
  applyAiEdit,
  applySetAttribute,
  applySetStyleVariant,
  setStyleArgsSchema,
  setAttributeArgsSchema,
  setStyleVariantArgsSchema,
  setPageSettingArgsSchema,
} from "../applySetStyle";

function makeComposer(
  el: { setStyle?: unknown; setContent?: unknown; setAttribute?: unknown } | undefined,
) {
  return {
    elements: { getElement: vi.fn(() => el) },
  } as unknown as Composer;
}

function makeTxComposer(present = true) {
  const beginTransaction = vi.fn();
  const endTransaction = vi.fn();
  const flushPending = vi.fn();
  const setStyle = vi.fn();
  const setContent = vi.fn();
  const composer = {
    elements: {
      getElement: vi.fn(() => (present ? { setStyle, setContent } : undefined)),
    },
    beginTransaction,
    endTransaction,
    history: { flushPending },
  } as unknown as Composer;
  return { composer, beginTransaction, endTransaction, flushPending, setStyle, setContent };
}

function commitEdit(commands: unknown[]) {
  return { applyOps: { preview: {}, commit: { commands } } };
}

describe("setStyleArgsSchema", () => {
  it("accepts an allow-listed property with a safe value", () => {
    const r = setStyleArgsSchema.safeParse({
      elementId: "el-1",
      property: "color",
      value: "#000000",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a property outside the allow-list", () => {
    const r = setStyleArgsSchema.safeParse({
      elementId: "el-1",
      property: "color:hover", // pseudo-state — out of scope
      value: "#000",
    });
    expect(r.success).toBe(false);
  });

  it.each([
    "url(javascript:alert(1))",
    "expression(alert(1))",
    "url(data:text/html,...)",
    "-moz-binding: url(x)",
  ])("rejects unsafe value %s", (value) => {
    const r = setStyleArgsSchema.safeParse({
      elementId: "el-1",
      property: "background",
      value,
    });
    expect(r.success).toBe(false);
  });
});

describe("applySetStyle", () => {
  it("calls el.setStyle with the property and value", () => {
    const setStyle = vi.fn();
    const composer = makeComposer({ setStyle });
    applySetStyle(composer, {
      elementId: "el-1",
      property: "color",
      value: "#000000",
    });
    expect(setStyle).toHaveBeenCalledWith("color", "#000000");
  });

  it("throws when the element is not found", () => {
    const composer = makeComposer(undefined);
    expect(() =>
      applySetStyle(composer, {
        elementId: "missing",
        property: "color",
        value: "#000",
      }),
    ).toThrow(/element not found/i);
  });

  it("does not open a transaction (caller owns it)", () => {
    const setStyle = vi.fn();
    const composer = makeComposer({ setStyle });
    // applySetStyle touches only composer.elements.getElement + el.setStyle.
    applySetStyle(composer, {
      elementId: "el-1",
      property: "padding",
      value: "16px",
    });
    expect(setStyle).toHaveBeenCalledOnce();
  });
});

describe("applyAiEdit", () => {
  it("applies a batch inside exactly one transaction (one undo step)", async () => {
    const { composer, beginTransaction, endTransaction, setStyle } =
      makeTxComposer();
    const r = await applyAiEdit(
      composer,
      commitEdit([
        { commandId: "set-style", args: { elementId: "el-1", property: "color", value: "#000" } },
        { commandId: "set-style", args: { elementId: "el-1", property: "padding", value: "8px" } },
      ]),
    );
    expect(r.applied).toBe(2);
    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(endTransaction).toHaveBeenCalledOnce();
    expect(setStyle).toHaveBeenCalledTimes(2);
  });

  it("flushes the pending history record so the edit is one immediate undo step", async () => {
    const { composer, flushPending } = makeTxComposer();
    await applyAiEdit(
      composer,
      commitEdit([
        { commandId: "set-style", args: { elementId: "el-1", property: "color", value: "#000" } },
      ]),
    );
    expect(flushPending).toHaveBeenCalledOnce();
  });

  it("skips invalid / non-set-style entries but still wraps in a transaction", async () => {
    const { composer, beginTransaction, endTransaction, setStyle } =
      makeTxComposer();
    const r = await applyAiEdit(
      composer,
      commitEdit([
        { commandId: "remove-element", args: { elementId: "el-1" } },
        { commandId: "set-style", args: { elementId: "el-1", property: "nope", value: "x" } },
        { commandId: "set-style", args: { elementId: "el-1", property: "color", value: "#fff" } },
      ]),
    );
    expect(r.applied).toBe(1);
    expect(setStyle).toHaveBeenCalledTimes(1);
    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(endTransaction).toHaveBeenCalledOnce();
  });

  it("closes the transaction even when applying throws (endTransaction in finally)", async () => {
    const { composer, endTransaction } = makeTxComposer(false); // getElement → undefined
    await expect(
      applyAiEdit(
        composer,
        commitEdit([
          { commandId: "set-style", args: { elementId: "gone", property: "color", value: "#000" } },
        ]),
      ),
    ).rejects.toThrow(/element not found/i);
    expect(endTransaction).toHaveBeenCalledOnce();
  });

  it("handles a missing commands payload as a no-op (still balanced transaction)", async () => {
    const { composer, beginTransaction, endTransaction } = makeTxComposer();
    const r = await applyAiEdit(composer, { applyOps: { preview: {}, commit: {} } });
    expect(r.applied).toBe(0);
    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(endTransaction).toHaveBeenCalledOnce();
  });

  it("applies a set-text command via el.setContent", async () => {
    const { composer, setContent } = makeTxComposer();
    const r = await applyAiEdit(
      composer,
      commitEdit([
        { commandId: "set-text", args: { elementId: "el-1", text: "Welcome" } },
      ]),
    );
    expect(r.applied).toBe(1);
    expect(setContent).toHaveBeenCalledWith("Welcome");
  });

  it("applies a mixed style + text batch in one transaction", async () => {
    const { composer, setStyle, setContent, beginTransaction, endTransaction } =
      makeTxComposer();
    const r = await applyAiEdit(
      composer,
      commitEdit([
        { commandId: "set-style", args: { elementId: "el-1", property: "color", value: "#fff" } },
        { commandId: "set-text", args: { elementId: "el-1", text: "Hello" } },
      ]),
    );
    expect(r.applied).toBe(2);
    expect(setStyle).toHaveBeenCalledOnce();
    expect(setContent).toHaveBeenCalledWith("Hello");
    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(endTransaction).toHaveBeenCalledOnce();
  });

  it("rejects set-text with markup (does not reach setContent)", async () => {
    const { composer, setContent } = makeTxComposer();
    const r = await applyAiEdit(
      composer,
      commitEdit([
        { commandId: "set-text", args: { elementId: "el-1", text: "<b>hi</b>" } },
      ]),
    );
    expect(r.applied).toBe(0);
    expect(setContent).not.toHaveBeenCalled();
  });
});

describe("applySetText", () => {
  it("calls el.setContent with the text", () => {
    const setContent = vi.fn();
    const composer = makeComposer({ setContent });
    applySetText(composer, { elementId: "el-1", text: "Hi there" });
    expect(setContent).toHaveBeenCalledWith("Hi there");
  });

  it("throws when the element is not found", () => {
    const composer = makeComposer(undefined);
    expect(() =>
      applySetText(composer, { elementId: "missing", text: "x" }),
    ).toThrow(/element not found/i);
  });
});

describe("applyAddElement", () => {
  function makeAddComposer(ref: {
    type: string;
    children?: unknown[];
    parentChildren?: { getId: () => string }[];
  }) {
    const created = { id: "new" };
    const createElement = vi.fn(() => created);
    const addElement = vi.fn(() => true);
    const refEl = {
      getId: () => "ref",
      getType: () => ref.type,
      getChildren: () => ref.children ?? [],
      getParent: () =>
        ref.parentChildren
          ? {
              getId: () => "parent",
              getChildren: () => ref.parentChildren,
            }
          : null,
    };
    const composer = {
      elements: {
        getElement: vi.fn(() => refEl),
        createElement,
        addElement,
      },
    } as unknown as Composer;
    return { composer, createElement, addElement };
  }

  it("inserts as the next sibling of a non-container reference", () => {
    const { composer, createElement, addElement } = makeAddComposer({
      type: "heading",
      parentChildren: [{ getId: () => "ref" }],
    });
    applyAddElement(composer, {
      elementId: "ref",
      elementType: "button",
      text: "Buy",
    });
    expect(createElement).toHaveBeenCalledWith("button", { content: "Buy" });
    expect(addElement).toHaveBeenCalledWith({ id: "new" }, "parent", 1);
  });

  it("inserts as a child of an empty container reference", () => {
    const { composer, addElement } = makeAddComposer({
      type: "container",
      children: [],
    });
    applyAddElement(composer, { elementId: "ref", elementType: "text", text: "Hi" });
    expect(addElement).toHaveBeenCalledWith({ id: "new" }, "ref", undefined);
  });

  it("creates without content when no text is given", () => {
    const { composer, createElement } = makeAddComposer({
      type: "container",
      children: [],
    });
    applyAddElement(composer, { elementId: "ref", elementType: "section" });
    expect(createElement).toHaveBeenCalledWith("section", {});
  });
});

describe("applyAddSection", () => {
  it("creates a container and appends children into it", () => {
    const createElement = vi.fn(() => {
      const n = createElement.mock.calls.length;
      return { getId: () => (n === 1 ? "sec" : `c${n}`) };
    });
    const addElement = vi.fn(
      (_el: unknown, _parentId: string, _index?: number) => true,
    );
    const refEl = {
      getId: () => "ref",
      getType: () => "heading", // not a container → sibling placement
      getChildren: () => [],
      getParent: () => ({
        getId: () => "parent",
        getChildren: () => [{ getId: () => "ref" }],
      }),
    };
    const composer = {
      elements: { getElement: vi.fn(() => refEl), createElement, addElement },
    } as unknown as Composer;

    applyAddSection(composer, {
      elementId: "ref",
      sectionType: "section",
      children: [
        { elementType: "heading", text: "Pricing" },
        { elementType: "button", text: "Buy" },
      ],
    });

    // 1 container + 2 children created
    expect(createElement).toHaveBeenCalledTimes(3);
    // container inserted next to the reference (parent, index 1)
    expect(addElement).toHaveBeenNthCalledWith(1, { getId: expect.any(Function) }, "parent", 1);
    // both children appended into the new section
    expect(addElement.mock.calls[1][1]).toBe("sec");
    expect(addElement.mock.calls[2][1]).toBe("sec");
  });
});

describe("applyDeleteElement / applyDuplicateElement", () => {
  it("delete calls removeElement", () => {
    const removeElement = vi.fn(() => true);
    const composer = { elements: { removeElement } } as unknown as Composer;
    applyDeleteElement(composer, { elementId: "el-1" });
    expect(removeElement).toHaveBeenCalledWith("el-1");
  });

  it("delete throws when removeElement returns false", () => {
    const composer = {
      elements: { removeElement: vi.fn(() => false) },
    } as unknown as Composer;
    expect(() => applyDeleteElement(composer, { elementId: "gone" })).toThrow(
      /not found/i,
    );
  });

  it("duplicate calls duplicateElement", () => {
    const duplicateElement = vi.fn(() => ({ id: "copy" }));
    const composer = { elements: { duplicateElement } } as unknown as Composer;
    applyDuplicateElement(composer, { elementId: "el-1" });
    expect(duplicateElement).toHaveBeenCalledWith("el-1");
  });

  it("duplicate throws when duplicateElement returns null", () => {
    const composer = {
      elements: { duplicateElement: vi.fn(() => null) },
    } as unknown as Composer;
    expect(() => applyDuplicateElement(composer, { elementId: "x" })).toThrow(
      /failed/i,
    );
  });
});

describe("applyMoveElement", () => {
  function makeMoveComposer(elementId: string, siblingIds: string[]) {
    const moveElement = vi.fn(() => true);
    const siblings = siblingIds.map((id) => ({ getId: () => id }));
    const parent = { getId: () => "parent", getChildren: () => siblings };
    const el = { getParent: () => parent };
    const composer = {
      elements: { getElement: vi.fn(() => el), moveElement },
    } as unknown as Composer;
    return { composer, moveElement };
  }

  it("moves up to the previous index", () => {
    const { composer, moveElement } = makeMoveComposer("b", ["a", "b", "c"]);
    applyMoveElement(composer, { elementId: "b", direction: "up" });
    expect(moveElement).toHaveBeenCalledWith("b", "parent", 0);
  });

  it("moves down to the next index", () => {
    const { composer, moveElement } = makeMoveComposer("b", ["a", "b", "c"]);
    applyMoveElement(composer, { elementId: "b", direction: "down" });
    expect(moveElement).toHaveBeenCalledWith("b", "parent", 2);
  });

  it("is a no-op at the top edge (up from index 0)", () => {
    const { composer, moveElement } = makeMoveComposer("a", ["a", "b"]);
    applyMoveElement(composer, { elementId: "a", direction: "up" });
    expect(moveElement).not.toHaveBeenCalled();
  });

  it("throws when the element has no parent", () => {
    const composer = {
      elements: { getElement: vi.fn(() => ({ getParent: () => null })) },
    } as unknown as Composer;
    expect(() =>
      applyMoveElement(composer, { elementId: "x", direction: "up" }),
    ).toThrow(/no parent/i);
  });
});

describe("setAttributeArgsSchema", () => {
  it("accepts a normal href, alt text, and a valid target", () => {
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "href", value: "https://x.com" }).success).toBe(true);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "alt", value: "A photo" }).success).toBe(true);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "target", value: "_blank" }).success).toBe(true);
  });

  it("accepts src http(s)/relative, rejects data:/blob:/js for src", () => {
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "src", value: "https://x.com/a.png" }).success).toBe(true);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "src", value: "/assets/a.png" }).success).toBe(true);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "src", value: "data:image/png;base64,x" }).success).toBe(false);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "src", value: "blob:http://x" }).success).toBe(false);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "src", value: "javascript:alert(1)" }).success).toBe(false);
  });

  it("rejects javascript:/data: hrefs, bad targets, disallowed attrs, and markup", () => {
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "href", value: "javascript:alert(1)" }).success).toBe(false);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "href", value: "data:text/html,x" }).success).toBe(false);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "target", value: "_evil" }).success).toBe(false);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "onclick", value: "x()" }).success).toBe(false);
    expect(setAttributeArgsSchema.safeParse({ elementId: "a", attribute: "alt", value: "<img onerror=x>" }).success).toBe(false);
  });
});

describe("applySetAttribute", () => {
  it("calls el.setAttribute with the attribute and value", () => {
    const setAttribute = vi.fn();
    const composer = makeComposer({ setAttribute });
    applySetAttribute(composer, { elementId: "a", attribute: "href", value: "https://x.com" });
    expect(setAttribute).toHaveBeenCalledWith("href", "https://x.com");
  });

  it("throws when the element is missing", () => {
    const composer = makeComposer(undefined);
    expect(() =>
      applySetAttribute(composer, { elementId: "a", attribute: "alt", value: "x" }),
    ).toThrow(/element not found/i);
  });

  it("applyAiEdit dispatches a set-attribute command", async () => {
    const setAttribute = vi.fn();
    const composer = {
      elements: { getElement: vi.fn(() => ({ setAttribute })) },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      history: { flushPending: vi.fn() },
    } as unknown as Composer;
    const r = await applyAiEdit(composer, commitEdit([
      { commandId: "set-attribute", args: { elementId: "a", attribute: "href", value: "https://x.com" } },
    ]));
    expect(r.applied).toBe(1);
    expect(setAttribute).toHaveBeenCalledWith("href", "https://x.com");
  });

  it("applyAiEdit skips a set-attribute with an unsafe href", async () => {
    const setAttribute = vi.fn();
    const composer = {
      elements: { getElement: vi.fn(() => ({ setAttribute })) },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      history: { flushPending: vi.fn() },
    } as unknown as Composer;
    const r = await applyAiEdit(composer, commitEdit([
      { commandId: "set-attribute", args: { elementId: "a", attribute: "href", value: "javascript:alert(1)" } },
    ]));
    expect(r.applied).toBe(0);
    expect(setAttribute).not.toHaveBeenCalled();
  });
});

function makeStyleComposer() {
  const setRule = vi.fn();
  const setBreakpointStyle = vi.fn();
  const composer = {
    elements: { getElement: vi.fn(() => ({})) },
    styles: { setRule, setBreakpointStyle },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    history: { flushPending: vi.fn() },
  } as unknown as Composer;
  return { composer, setRule, setBreakpointStyle };
}

describe("setStyleVariantArgsSchema", () => {
  it("accepts a pseudo state, a breakpoint, or both", () => {
    expect(setStyleVariantArgsSchema.safeParse({ elementId: "a", property: "color", value: "#00f", pseudo: "hover" }).success).toBe(true);
    expect(setStyleVariantArgsSchema.safeParse({ elementId: "a", property: "display", value: "block", breakpoint: "mobile" }).success).toBe(true);
    expect(setStyleVariantArgsSchema.safeParse({ elementId: "a", property: "gap", value: "8px", pseudo: "focus", breakpoint: "tablet" }).success).toBe(true);
  });

  it("rejects when neither pseudo nor breakpoint is set, or values are invalid", () => {
    expect(setStyleVariantArgsSchema.safeParse({ elementId: "a", property: "color", value: "#000" }).success).toBe(false);
    expect(setStyleVariantArgsSchema.safeParse({ elementId: "a", property: "color", value: "#000", pseudo: "evil" }).success).toBe(false);
    expect(setStyleVariantArgsSchema.safeParse({ elementId: "a", property: "content", value: "x", pseudo: "hover" }).success).toBe(false);
    expect(setStyleVariantArgsSchema.safeParse({ elementId: "a", property: "background", value: "url(x)", pseudo: "hover" }).success).toBe(false);
  });
});

describe("applySetStyleVariant", () => {
  it("routes a pseudo state through StyleEngine.setRule with the pseudo + media query", () => {
    const { composer, setRule, setBreakpointStyle } = makeStyleComposer();
    applySetStyleVariant(composer, { elementId: "el-1", property: "color", value: "#00f", pseudo: "hover" });
    expect(setRule).toHaveBeenCalledWith(
      '[data-buildrick-id="el-1"]',
      { color: "#00f" },
      { pseudo: ":hover", mediaQuery: undefined },
    );
    expect(setBreakpointStyle).not.toHaveBeenCalled();
  });

  it("routes a breakpoint-only variant through StyleEngine.setBreakpointStyle", () => {
    const { composer, setRule, setBreakpointStyle } = makeStyleComposer();
    applySetStyleVariant(composer, { elementId: "el-1", property: "display", value: "block", breakpoint: "mobile" });
    expect(setBreakpointStyle).toHaveBeenCalledWith("el-1", "mobile", { display: "block" });
    expect(setRule).not.toHaveBeenCalled();
  });

  it("passes the breakpoint media query when pseudo + breakpoint combine", () => {
    const { composer, setRule } = makeStyleComposer();
    applySetStyleVariant(composer, { elementId: "el-1", property: "gap", value: "8px", pseudo: "focus", breakpoint: "tablet" });
    const call = setRule.mock.calls[0];
    expect(call[2].pseudo).toBe(":focus");
    expect(typeof call[2].mediaQuery).toBe("string");
  });

  it("applySetPageSetting merges into existing seo without clobbering siblings", async () => {
    const updatePage = vi.fn();
    const composer = {
      elements: {
        getActivePage: () => ({ id: "p1", settings: { seo: { metaTitle: "Old", ogImage: "/x.png" } } }),
        updatePage,
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      history: { flushPending: vi.fn() },
    } as unknown as Composer;
    const r = await applyAiEdit(composer, commitEdit([
      { commandId: "set-page-setting", args: { setting: "metaDescription", value: "New desc" } },
    ]));
    expect(r.applied).toBe(1);
    expect(updatePage).toHaveBeenCalledWith("p1", {
      settings: { seo: { metaTitle: "Old", ogImage: "/x.png", metaDescription: "New desc" } },
    });
  });

  it("set-page-setting schema enforces length caps + plain text + slug format", () => {
    expect(setPageSettingArgsSchema.safeParse({ setting: "metaTitle", value: "Hi" }).success).toBe(true);
    expect(setPageSettingArgsSchema.safeParse({ setting: "metaTitle", value: "x".repeat(61) }).success).toBe(false);
    expect(setPageSettingArgsSchema.safeParse({ setting: "metaDescription", value: "<b>x</b>" }).success).toBe(false);
    expect(setPageSettingArgsSchema.safeParse({ setting: "slug", value: "pricing-plans" }).success).toBe(true);
    expect(setPageSettingArgsSchema.safeParse({ setting: "slug", value: "Pricing Plans" }).success).toBe(false);
  });

  it("set-page-setting slug rejects a collision with another page, applies a free slug", async () => {
    const updatePage = vi.fn();
    const composer = {
      elements: {
        getActivePage: () => ({ id: "p1", slug: "home", settings: {} }),
        getAllPages: () => [{ id: "p1", slug: "home" }, { id: "p2", slug: "about" }],
        updatePage,
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      history: { flushPending: vi.fn() },
    } as unknown as Composer;
    // collision with p2's slug → rejected (throws → batch rejects)
    await expect(applyAiEdit(composer, commitEdit([
      { commandId: "set-page-setting", args: { setting: "slug", value: "about" } },
    ]))).rejects.toThrow(/already in use/i);
    expect(updatePage).not.toHaveBeenCalled();
    // free slug → applied
    const r = await applyAiEdit(composer, commitEdit([
      { commandId: "set-page-setting", args: { setting: "slug", value: "pricing" } },
    ]));
    expect(r.applied).toBe(1);
    expect(updatePage).toHaveBeenCalledWith("p1", { slug: "pricing", slugManuallySet: true });
  });

  it("applyAiEdit dispatches a set-style-variant command", async () => {
    const { composer, setRule } = makeStyleComposer();
    const r = await applyAiEdit(composer, commitEdit([
      { commandId: "set-style-variant", args: { elementId: "el-1", property: "color", value: "#0f0", pseudo: "hover" } },
    ]));
    expect(r.applied).toBe(1);
    expect(setRule).toHaveBeenCalledOnce();
  });

  it("applyAiEdit dispatches an async insert-component command + caps subtree size", async () => {
    const instantiateComponent = vi.fn(async () => "new-el");
    const composer = {
      elements: { getElement: vi.fn(() => ({ getChildren: () => [], getType: () => "container", getId: () => "p" })) },
      components: {
        // User-saved ids (NOT catalog ids — those route through placeCatalogComponent).
        getComponent: vi.fn((id: string) =>
          id === "saved-card" ? { masterTree: { id: "r", type: "card", children: [{ id: "c", type: "text" }] } }
          : id === "saved-huge" ? { masterTree: { id: "r", type: "x", children: Array.from({ length: 300 }, (_, i) => ({ id: `n${i}`, type: "text" })) } }
          : undefined,
        ),
        instantiateComponent,
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      history: { flushPending: vi.fn() },
    } as unknown as Composer;

    const ok = await applyAiEdit(composer, commitEdit([
      { commandId: "insert-component", args: { elementId: "p", componentId: "saved-card" } },
    ]));
    expect(ok.applied).toBe(1);
    expect(instantiateComponent).toHaveBeenCalledWith("saved-card", "p", undefined);

    instantiateComponent.mockClear();
    // unknown id (not catalog, not user-saved) → rejected; oversized user-saved → rejected
    await expect(applyAiEdit(composer, commitEdit([
      { commandId: "insert-component", args: { elementId: "p", componentId: "ghost" } },
    ]))).rejects.toThrow(/unknown component/i);
    await expect(applyAiEdit(composer, commitEdit([
      { commandId: "insert-component", args: { elementId: "p", componentId: "saved-huge" } },
    ]))).rejects.toThrow(/too large/i);
    expect(instantiateComponent).not.toHaveBeenCalled();
  });
});

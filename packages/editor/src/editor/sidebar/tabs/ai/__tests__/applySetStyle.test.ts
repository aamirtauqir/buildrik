import { describe, it, expect, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import {
  applySetStyle,
  applySetText,
  applyAddElement,
  applyAiEdit,
  setStyleArgsSchema,
} from "../applySetStyle";

function makeComposer(el: { setStyle?: unknown; setContent?: unknown } | undefined) {
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
  it("applies a batch inside exactly one transaction (one undo step)", () => {
    const { composer, beginTransaction, endTransaction, setStyle } =
      makeTxComposer();
    const r = applyAiEdit(
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

  it("flushes the pending history record so the edit is one immediate undo step", () => {
    const { composer, flushPending } = makeTxComposer();
    applyAiEdit(
      composer,
      commitEdit([
        { commandId: "set-style", args: { elementId: "el-1", property: "color", value: "#000" } },
      ]),
    );
    expect(flushPending).toHaveBeenCalledOnce();
  });

  it("skips invalid / non-set-style entries but still wraps in a transaction", () => {
    const { composer, beginTransaction, endTransaction, setStyle } =
      makeTxComposer();
    const r = applyAiEdit(
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

  it("closes the transaction even when applying throws (endTransaction in finally)", () => {
    const { composer, endTransaction } = makeTxComposer(false); // getElement → undefined
    expect(() =>
      applyAiEdit(
        composer,
        commitEdit([
          { commandId: "set-style", args: { elementId: "gone", property: "color", value: "#000" } },
        ]),
      ),
    ).toThrow(/element not found/i);
    expect(endTransaction).toHaveBeenCalledOnce();
  });

  it("handles a missing commands payload as a no-op (still balanced transaction)", () => {
    const { composer, beginTransaction, endTransaction } = makeTxComposer();
    const r = applyAiEdit(composer, { applyOps: { preview: {}, commit: {} } });
    expect(r.applied).toBe(0);
    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(endTransaction).toHaveBeenCalledOnce();
  });

  it("applies a set-text command via el.setContent", () => {
    const { composer, setContent } = makeTxComposer();
    const r = applyAiEdit(
      composer,
      commitEdit([
        { commandId: "set-text", args: { elementId: "el-1", text: "Welcome" } },
      ]),
    );
    expect(r.applied).toBe(1);
    expect(setContent).toHaveBeenCalledWith("Welcome");
  });

  it("applies a mixed style + text batch in one transaction", () => {
    const { composer, setStyle, setContent, beginTransaction, endTransaction } =
      makeTxComposer();
    const r = applyAiEdit(
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

  it("rejects set-text with markup (does not reach setContent)", () => {
    const { composer, setContent } = makeTxComposer();
    const r = applyAiEdit(
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

/**
 * blockRegistry — insertBlock decision matrix + registry integrity.
 *
 * insertBlock branch order (blockRegistry.ts):
 *   1. parent lookup fails            → undefined
 *   2. canNestElement rejects         → undefined
 *   3. block.build exists             → build() (precedence over content)
 *   4. content matches /^<[a-z]/i     → sanitizeHTML + insertHTMLToElement
 *   5. fallback                       → createElement(elementType, { content })
 *
 * canNestElement + sanitizeHTML are REAL (jsdom gives DOMPurify a DOM);
 * only the Composer surface is mocked.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import type { Composer } from "../../engine";
import {
  blockDefinitions,
  getBlockById,
  getBlockDefinitions,
  insertBlock,
  type BlockDefinition,
} from "../blockRegistry";
import { contactFormBlockConfig } from "../Components";

// ---------------------------------------------------------------------------
// Composer mock
// ---------------------------------------------------------------------------

interface ComposerHarness {
  composer: Composer;
  elements: {
    getElement: ReturnType<typeof vi.fn>;
    insertHTMLToElement: ReturnType<typeof vi.fn>;
    createElement: ReturnType<typeof vi.fn>;
    addElement: ReturnType<typeof vi.fn>;
  };
  created: Array<{ type: string; options: Record<string, unknown> | undefined }>;
  addCalls: Array<{ el: unknown; parentId: string; dropIndex?: number }>;
  emit: ReturnType<typeof vi.fn>;
}

function makeComposer(
  opts: {
    parentType?: string;
    parentExists?: boolean;
    insertReturn?: unknown;
    getElementThrows?: boolean;
  } = {}
): ComposerHarness {
  const { parentType = "container", parentExists = true, insertReturn, getElementThrows } = opts;
  const created: ComposerHarness["created"] = [];
  const addCalls: ComposerHarness["addCalls"] = [];
  let seq = 0;

  const elements = {
    getElement: vi.fn(() => {
      if (getElementThrows) throw new Error("engine exploded");
      return parentExists ? { getType: () => parentType } : undefined;
    }),
    insertHTMLToElement: vi.fn(() => insertReturn),
    createElement: vi.fn((type: string, options?: Record<string, unknown>) => {
      created.push({ type, options });
      const id = `el-${++seq}`;
      return { getId: () => id };
    }),
    addElement: vi.fn((el: unknown, parentId: string, dropIndex?: number) => {
      addCalls.push({ el, parentId, dropIndex });
    }),
  };

  /* insertBlock announces every successful insert (ELEMENT_INSERTED) — the
     four insert doors all come through it and two of its three branches used
     to emit nothing. A harness without `emit` is not a Composer. */
  const emit = vi.fn();
  return {
    composer: { elements, emit } as unknown as Composer,
    elements,
    created,
    addCalls,
    emit,
  };
}

// Synthetic block definitions — full control over each branch.
const htmlBlock: BlockDefinition = {
  id: "x-html",
  label: "X HTML",
  elementType: "button",
  content: '<button onclick="alert(1)" class="btn">Hi</button>',
};

const plainBlock: BlockDefinition = {
  id: "x-plain",
  label: "X Plain",
  elementType: "text",
  content: "Hello world",
};

// ---------------------------------------------------------------------------
// insertBlock matrix
// ---------------------------------------------------------------------------

describe("insertBlock — parent validation", () => {
  it("returns undefined when the parent element does not exist", () => {
    const h = makeComposer({ parentExists: false });
    expect(insertBlock(h.composer, plainBlock, "missing")).toBeUndefined();
    expect(h.elements.createElement).not.toHaveBeenCalled();
    expect(h.elements.insertHTMLToElement).not.toHaveBeenCalled();
  });

  it("returns undefined when nesting rules reject the block (image parent is void)", () => {
    // `image` has allowChildren:false in nesting rules — nothing nests into it.
    const h = makeComposer({ parentType: "image" });
    const build = vi.fn(() => "never");
    const block: BlockDefinition = { ...plainBlock, build };
    expect(insertBlock(h.composer, block, "img-1")).toBeUndefined();
    // Rejection happens BEFORE the build/content branches.
    expect(build).not.toHaveBeenCalled();
    expect(h.elements.createElement).not.toHaveBeenCalled();
  });

  it("returns undefined instead of throwing when the engine throws", () => {
    const h = makeComposer({ getElementThrows: true });
    expect(insertBlock(h.composer, plainBlock, "p")).toBeUndefined();
  });
});

describe("insertBlock — build() precedence", () => {
  it("calls build(composer, parentId, dropIndex) and returns its element id", () => {
    const h = makeComposer();
    const build = vi.fn(() => "built-1");
    const block: BlockDefinition = {
      id: "x-build",
      label: "X Build",
      elementType: "container",
      content: "<div>should be ignored</div>",
      build,
    };
    expect(insertBlock(h.composer, block, "parent-1", 3)).toBe("built-1");
    expect(build).toHaveBeenCalledWith(h.composer, "parent-1", 3);
    // build wins over content: neither insertion path fires.
    expect(h.elements.insertHTMLToElement).not.toHaveBeenCalled();
    expect(h.elements.createElement).not.toHaveBeenCalled();
  });

  it("propagates build()'s undefined result", () => {
    const h = makeComposer();
    const block: BlockDefinition = {
      id: "x-build-undef",
      label: "X",
      elementType: "container",
      build: () => undefined,
    };
    expect(insertBlock(h.composer, block, "parent-1")).toBeUndefined();
  });
});

describe("insertBlock — HTML content sanitize branch", () => {
  it("sanitizes HTML content (strips onclick) before insertHTMLToElement", () => {
    const inserted = [{ getId: () => "ins-1" }];
    const h = makeComposer({ insertReturn: inserted });
    const result = insertBlock(h.composer, htmlBlock, "parent-1", 2);

    expect(result).toBe("ins-1");
    expect(h.elements.insertHTMLToElement).toHaveBeenCalledTimes(1);
    const [parentId, safeContent, dropIndex] = h.elements.insertHTMLToElement.mock.calls[0];
    expect(parentId).toBe("parent-1");
    expect(dropIndex).toBe(2);
    // Dangerous attribute stripped, structure + safe attrs preserved.
    expect(safeContent).not.toContain("onclick");
    expect(safeContent).toContain('class="btn"');
    expect(safeContent).toContain("Hi");
    // HTML branch does not go through createElement.
    expect(h.elements.createElement).not.toHaveBeenCalled();
  });

  it("returns undefined when insertHTMLToElement returns an empty array", () => {
    const h = makeComposer({ insertReturn: [] });
    expect(insertBlock(h.composer, htmlBlock, "parent-1")).toBeUndefined();
  });

  it("returns undefined when insertHTMLToElement returns a non-array", () => {
    const h = makeComposer({ insertReturn: undefined });
    expect(insertBlock(h.composer, htmlBlock, "parent-1")).toBeUndefined();
  });

  it("returns undefined when the first inserted element has no getId", () => {
    const h = makeComposer({ insertReturn: [{}] });
    expect(insertBlock(h.composer, htmlBlock, "parent-1")).toBeUndefined();
  });

  it("a real registered HTML block (button) routes through the sanitize branch", () => {
    const h = makeComposer({ insertReturn: [{ getId: () => "btn-1" }] });
    const button = getBlockById("button")!;
    expect(insertBlock(h.composer, button, "parent-1")).toBe("btn-1");
    expect(h.elements.insertHTMLToElement).toHaveBeenCalled();
  });

  it("PIN: leading-whitespace HTML content SKIPS the sanitize branch (raw passthrough)", () => {
    // HTML_CONTENT_PATTERN = /^<[a-z]/i is anchored at position 0, so
    // "  <button onclick=…>" is treated as plain text: it bypasses
    // sanitizeHTML/insertHTMLToElement and lands, event handler intact, in
    // createElement's `content` option. This pins today's behavior; the fix
    // is tracked in the it.todo below.
    const h = makeComposer();
    const whitespaceBlock: BlockDefinition = {
      ...htmlBlock,
      id: "x-html-ws",
      content: '  <button onclick="alert(1)" class="btn">Hi</button>',
    };
    const result = insertBlock(h.composer, whitespaceBlock, "parent-1");

    expect(h.elements.insertHTMLToElement).not.toHaveBeenCalled();
    expect(h.elements.createElement).toHaveBeenCalledTimes(1);
    expect(h.created[0].type).toBe("button");
    // Raw, UNsanitized content passes through.
    expect(h.created[0].options?.content).toContain("onclick");
    expect(result).toBe("el-1");
  });

  it.todo(
    "AUDIT BUG: HTML_CONTENT_PATTERN should tolerate leading whitespace (trim before test) " +
      "so whitespace-prefixed HTML content is sanitized instead of inserted raw"
  );
});

describe("insertBlock — elementType fallback branch", () => {
  it("creates an element from elementType with plain-text content", () => {
    const h = makeComposer();
    const result = insertBlock(h.composer, plainBlock, "parent-1", 5);

    expect(h.elements.createElement).toHaveBeenCalledWith("text", { content: "Hello world" });
    expect(h.addCalls).toHaveLength(1);
    expect(h.addCalls[0].parentId).toBe("parent-1");
    expect(h.addCalls[0].dropIndex).toBe(5);
    expect(result).toBe("el-1");
  });

  it("creates an element with content: undefined when block has no content", () => {
    const h = makeComposer();
    const block: BlockDefinition = { id: "x-empty", label: "X", elementType: "container" };
    expect(insertBlock(h.composer, block, "parent-1")).toBe("el-1");
    expect(h.elements.createElement).toHaveBeenCalledWith("container", { content: undefined });
  });
});

// ---------------------------------------------------------------------------
// Registry integrity
// ---------------------------------------------------------------------------

describe("blockDefinitions — registry integrity", () => {
  it("registers exactly 64 blocks (11 Basic + 9 Media + 5 Layout + 16 Forms + 5 Sections + 14 Components + 4 Ecommerce)", () => {
    expect(blockDefinitions).toHaveLength(64);
  });

  it("has no duplicate block ids", () => {
    const ids = blockDefinitions.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getBlockDefinitions returns the registry array", () => {
    expect(getBlockDefinitions()).toBe(blockDefinitions);
  });

  it("getBlockById finds a registered block and returns undefined for unknown ids", () => {
    expect(getBlockById("hero")?.label).toBe("Hero Section");
    expect(getBlockById("does-not-exist")).toBeUndefined();
  });

  /* This case used to PIN the opposite — that contact-form was exported and
     NOT registered — alongside an it.todo reading "register
     contactFormBlockConfig in blockDefinitions or delete the orphan export".
     Registered, which is the resolution that todo named: the config is
     fully formed (id/label/elementType/content) and the block rendered fine;
     the only thing wrong was that no Insert row could reach it. */
  it("registers contact-form, so the Insert panel can reach it", () => {
    expect(contactFormBlockConfig.id).toBe("contact-form");
    expect(typeof contactFormBlockConfig.content).toBe("string");
    expect(getBlockById("contact-form")).toBe(contactFormBlockConfig);
  });
});

/* The four insert doors — Insert-panel click, canvas drop, block picker and
   the studio handler — all call insertBlock, and only the elementType branch
   announced anything (createElement's own ELEMENT_CREATED). The `build` and
   HTML branches, which is what most catalog rows use, emitted nothing: an
   element appeared on the canvas and no event said so. Measured in the running
   editor first — clicking "Heading" in the Insert panel produced
   transaction:begin, element:selected, transaction:end, project:changed,
   history:recorded, and no creation event of any kind. */
describe("insertBlock — announces the insert", () => {
  it("emits element:inserted with the new id for the HTML branch", () => {
    const h = makeComposer({ insertReturn: [{ getId: () => "el-html" }] });
    const id = insertBlock(h.composer, htmlBlock, "parent-1");
    expect(id).toBe("el-html");
    expect(h.emit).toHaveBeenCalledWith("element:inserted", {
      elementId: "el-html",
      blockId: "x-html",
    });
  });

  it("emits for the build branch, which announced nothing at all before", () => {
    const h = makeComposer();
    const built: BlockDefinition = {
      id: "x-built",
      label: "X Built",
      elementType: "container",
      build: () => "el-built",
    };
    expect(insertBlock(h.composer, built, "parent-1")).toBe("el-built");
    expect(h.emit).toHaveBeenCalledWith("element:inserted", {
      elementId: "el-built",
      blockId: "x-built",
    });
  });

  it("emits for the elementType branch too", () => {
    const h = makeComposer();
    insertBlock(h.composer, plainBlock, "parent-1");
    expect(h.emit).toHaveBeenCalledWith("element:inserted", {
      elementId: "el-1",
      blockId: "x-plain",
    });
  });

  it("says nothing when the insert never happened", () => {
    const h = makeComposer({ parentExists: false });
    expect(insertBlock(h.composer, plainBlock, "missing")).toBeUndefined();
    expect(h.emit).not.toHaveBeenCalled();
  });

});

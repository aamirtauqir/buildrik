/**
 * builders.ts helpers + representative build() blocks.
 *
 * A tree-recording Composer mock captures every createElement/addElement/
 * addChild call so the produced element trees (types, children, attributes,
 * styles, content) can be asserted structurally.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import type { Composer } from "../../engine";
import {
  buildSimpleElement,
  buildLayoutWithChildren,
  buildSectionWithContainer,
  buildColumns,
  FLEX_ITEM_STYLES,
  GRID_ITEM_STYLES,
} from "../builders";
import { iconBlockConfig } from "../Media/Icon";
import { tabsBlockConfig } from "../Components/Tabs";
import { stackBlockConfig } from "../Components/Stack";
import { switchBlockConfig } from "../Components/Switch";
import { tableBlockConfig } from "../Components/Table";
import { modalBlockConfig } from "../Components/Modal";

// ---------------------------------------------------------------------------
// Tree-recording composer mock
// ---------------------------------------------------------------------------

interface FakeEl {
  id: string;
  type: string;
  options: Record<string, unknown>;
  tagName?: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  content?: string;
  children: FakeEl[];
  getId: () => string;
  addChild: (c: FakeEl) => void;
  setStyles: (s: Record<string, string>) => void;
  setAttribute: (k: string, v: string) => void;
}

function makeTreeComposer() {
  let seq = 0;
  const byId = new Map<string, FakeEl>();
  // Elements attached directly to the insertion parent (not one of our fakes).
  const roots: Array<{ el: FakeEl; parentId: string; dropIndex?: number }> = [];

  const createElement = vi.fn((type: string, options: Record<string, unknown> = {}) => {
    const el: FakeEl = {
      id: `el-${++seq}`,
      type,
      options,
      tagName: options.tagName as string | undefined,
      attributes: { ...((options.attributes as Record<string, string>) ?? {}) },
      styles: { ...((options.styles as Record<string, string>) ?? {}) },
      content: options.content as string | undefined,
      children: [],
      getId() {
        return this.id;
      },
      addChild(c: FakeEl) {
        this.children.push(c);
      },
      setStyles(s: Record<string, string>) {
        Object.assign(this.styles, s);
      },
      setAttribute(k: string, v: string) {
        this.attributes[k] = v;
      },
    };
    byId.set(el.id, el);
    return el;
  });

  const addElement = vi.fn((el: FakeEl, parentId: string, dropIndex?: number) => {
    const parent = byId.get(parentId);
    if (parent) parent.children.push(el);
    else roots.push({ el, parentId, dropIndex });
  });

  const composer = { elements: { createElement, addElement } } as unknown as Composer;
  return { composer, createElement, addElement, byId, roots };
}

const PARENT = "page-root";

// ---------------------------------------------------------------------------
// builders.ts helpers
// ---------------------------------------------------------------------------

describe("buildSimpleElement", () => {
  it("creates one element with the given options, adds it at dropIndex, returns its id", () => {
    const h = makeTreeComposer();
    const id = buildSimpleElement(
      h.composer,
      PARENT,
      "container",
      { classes: ["container"], content: "hi" },
      4
    );
    expect(h.createElement).toHaveBeenCalledWith("container", {
      classes: ["container"],
      content: "hi",
    });
    expect(h.roots).toHaveLength(1);
    expect(h.roots[0].parentId).toBe(PARENT);
    expect(h.roots[0].dropIndex).toBe(4);
    expect(id).toBe(h.roots[0].el.id);
  });

  it("defaults options to an empty object", () => {
    const h = makeTreeComposer();
    buildSimpleElement(h.composer, PARENT, "text");
    expect(h.createElement).toHaveBeenCalledWith("text", {});
  });
});

describe("buildLayoutWithChildren", () => {
  it("attaches children to the container via addChild BEFORE adding the container", () => {
    const h = makeTreeComposer();
    const order: string[] = [];
    h.createElement.mockImplementation(((type: string, options: Record<string, unknown> = {}) => {
      order.push(`create:${type}`);
      const el = {
        id: `el-${order.length}`,
        type,
        options,
        children: [] as unknown[],
        getId() {
          return this.id;
        },
        addChild(c: unknown) {
          this.children.push(c);
          order.push("addChild");
        },
      };
      return el;
    }) as never);
    h.addElement.mockImplementation((() => order.push("addElement")) as never);

    buildLayoutWithChildren(
      h.composer,
      PARENT,
      "flex",
      { classes: ["flex"] },
      [
        { type: "container", options: { styles: FLEX_ITEM_STYLES } },
        { type: "container", options: { styles: GRID_ITEM_STYLES } },
      ],
      1
    );

    expect(order).toEqual([
      "create:flex",
      "create:container",
      "addChild",
      "create:container",
      "addChild",
      "addElement",
    ]);
  });

  it("builds the container tree and returns the container id", () => {
    const h = makeTreeComposer();
    const id = buildLayoutWithChildren(h.composer, PARENT, "grid", { classes: ["grid"] }, [
      { type: "container", options: { content: "A" } },
      { type: "container", options: { content: "B" } },
      { type: "container", options: { content: "C" } },
    ]);
    const root = h.roots[0].el;
    expect(id).toBe(root.id);
    expect(root.type).toBe("grid");
    expect(root.children.map((c) => c.content)).toEqual(["A", "B", "C"]);
  });
});

describe("buildSectionWithContainer", () => {
  it("nests an inner container inside the section and returns the section id", () => {
    const h = makeTreeComposer();
    const id = buildSectionWithContainer(h.composer, PARENT, { classes: ["s"] }, { classes: ["c"] }, 2);
    const section = h.roots[0].el;
    expect(id).toBe(section.id);
    expect(section.type).toBe("section");
    expect(section.children).toHaveLength(1);
    expect(section.children[0].type).toBe("container");
    expect(h.roots[0].dropIndex).toBe(2);
  });
});

describe("buildColumns", () => {
  it("creates a columns row with N labeled container columns", () => {
    const h = makeTreeComposer();
    const id = buildColumns(h.composer, PARENT, 3);
    const row = h.roots[0].el;
    expect(id).toBe(row.id);
    expect(row.type).toBe("columns");
    expect(row.options.classes).toEqual(["row"]);
    expect(row.children).toHaveLength(3);
    expect(row.children.map((c) => c.content)).toEqual(["Column 1", "Column 2", "Column 3"]);
    expect(row.children.every((c) => c.type === "container")).toBe(true);
  });

  it("honors a custom column label prefix", () => {
    const h = makeTreeComposer();
    buildColumns(h.composer, PARENT, 2, "Col");
    expect(h.roots[0].el.children.map((c) => c.content)).toEqual(["Col 1", "Col 2"]);
  });
});

// ---------------------------------------------------------------------------
// Representative build() blocks
// ---------------------------------------------------------------------------

describe("iconBlockConfig.build", () => {
  it("creates an icon element with star SVG content, sizing styles, and data-icon-* attributes", () => {
    const h = makeTreeComposer();
    const id = iconBlockConfig.build!(h.composer, PARENT, 1);
    const icon = h.roots[0].el;

    expect(id).toBe(icon.id);
    expect(icon.type).toBe("icon");
    expect(icon.content).toContain('data-icon="star"');
    expect(icon.content).toContain('data-library="lucide"');
    expect(icon.styles.width).toBe("32px");
    expect(icon.styles.height).toBe("32px");
    expect(icon.styles.display).toBe("inline-flex");
    expect(icon.attributes["data-icon-name"]).toBe("star");
    expect(icon.attributes["data-icon-library"]).toBe("lucide");
    expect(icon.attributes["data-icon-size"]).toBe("32");
    expect(icon.attributes["data-icon-stroke"]).toBe("2");
    expect(h.roots[0].dropIndex).toBe(1);
  });
});

describe("tabsBlockConfig.build", () => {
  it("builds tablist nav + 3 tab buttons + 3 tabpanels with correct ARIA roles", () => {
    const h = makeTreeComposer();
    const id = tabsBlockConfig.build!(h.composer, PARENT, 0);
    const wrapper = h.roots[0].el;

    expect(id).toBe(wrapper.id);
    expect(wrapper.attributes.class).toBe("tabs");
    // wrapper children: [nav, panel1, panel2, panel3]
    expect(wrapper.children).toHaveLength(4);

    const nav = wrapper.children[0];
    expect(nav.attributes.role).toBe("tablist");
    expect(nav.children).toHaveLength(3);
    nav.children.forEach((btn, i) => {
      expect(btn.type).toBe("button");
      expect(btn.attributes.role).toBe("tab");
      expect(btn.attributes["aria-selected"]).toBe(i === 0 ? "true" : "false");
      // Each button carries a span text child with its label.
      expect(btn.children[0].content).toBe(`Tab ${i + 1}`);
    });
    // First tab is visually active.
    expect(nav.children[0].attributes.class).toContain("active");

    const panels = wrapper.children.slice(1);
    panels.forEach((panel, i) => {
      expect(panel.attributes.role).toBe("tabpanel");
      expect(panel.styles.display).toBe(i === 0 ? "block" : "none");
      expect(panel.children[0].type).toBe("paragraph");
      expect(panel.children[0].content).toContain(`Tab ${i + 1}`);
    });
  });
});

describe("stackBlockConfig.build", () => {
  it("builds a vertical flex stack with 3 placeholder items each holding a paragraph", () => {
    const h = makeTreeComposer();
    const id = stackBlockConfig.build!(h.composer, PARENT);
    const stack = h.roots[0].el;

    expect(id).toBe(stack.id);
    expect(stack.attributes.class).toBe("stack");
    expect(stack.styles.flexDirection).toBe("column");
    expect(stack.children).toHaveLength(3);
    stack.children.forEach((item, i) => {
      expect(item.attributes.class).toBe("stack-item");
      expect(item.children).toHaveLength(1);
      expect(item.children[0].type).toBe("paragraph");
      expect(item.children[0].content).toBe(`Stack Item ${i + 1}`);
    });
  });
});

describe("switchBlockConfig.build", () => {
  it("builds label wrapper > [hidden checkbox, track > thumb, label text] and returns wrapper id", () => {
    const h = makeTreeComposer();
    const id = switchBlockConfig.build!(h.composer, PARENT);
    const wrapper = h.roots[0].el;

    expect(id).toBe(wrapper.id);
    expect(wrapper.tagName).toBe("label");
    expect(wrapper.children).toHaveLength(3);

    const [input, track, labelText] = wrapper.children;
    expect(input.type).toBe("input");
    expect(input.attributes.type).toBe("checkbox");
    expect(input.styles.opacity).toBe("0"); // visually hidden, still focusable-by-label

    expect(track.attributes.class).toBe("switch-track");
    expect(track.children).toHaveLength(1);
    expect(track.children[0].attributes.class).toBe("switch-thumb");

    expect(labelText.type).toBe("text");
    expect(labelText.content).toBe("Toggle Option");
  });
});

describe("tableBlockConfig.build", () => {
  it("builds wrapper > table > (thead: 4 headers) + (tbody: 3 rows x 4 cells) and returns wrapper id", () => {
    const h = makeTreeComposer();
    const id = tableBlockConfig.build!(h.composer, PARENT);
    const wrapper = h.roots[0].el;

    expect(id).toBe(wrapper.id);
    expect(wrapper.attributes.class).toBe("table-wrapper");
    expect(wrapper.children).toHaveLength(1);

    const table = wrapper.children[0];
    expect(table.tagName).toBe("table");
    expect(table.children.map((c) => c.tagName)).toEqual(["thead", "tbody"]);

    const [thead, tbody] = table.children;
    const headerRow = thead.children[0];
    expect(headerRow.tagName).toBe("tr");
    expect(headerRow.children).toHaveLength(4);
    expect(headerRow.children.map((th) => th.children[0].content)).toEqual([
      "Name",
      "Email",
      "Status",
      "Actions",
    ]);

    expect(tbody.children).toHaveLength(3);
    tbody.children.forEach((tr) => {
      expect(tr.tagName).toBe("tr");
      expect(tr.children).toHaveLength(4); // name, email, status, actions
      expect(tr.children.every((td) => td.tagName === "td")).toBe(true);
    });

    // Status badges carry semantic status-* classes.
    const statusBadges = tbody.children.map((tr) => tr.children[2].children[0]);
    expect(statusBadges.map((b) => b.attributes.class)).toEqual([
      "status-badge status-active",
      "status-badge status-pending",
      "status-badge status-inactive",
    ]);
  });
});

describe("modalBlockConfig.build", () => {
  it("adds trigger button + hidden dialog overlay as siblings and returns the TRIGGER id", () => {
    const h = makeTreeComposer();
    const id = modalBlockConfig.build!(h.composer, PARENT, 7);

    // Two elements attach to the insertion parent: trigger (at dropIndex) and
    // the overlay (appended, no dropIndex — pinned current behavior).
    expect(h.roots).toHaveLength(2);
    const [trigger, overlay] = h.roots.map((r) => r.el);
    expect(id).toBe(trigger.id);
    expect(h.roots[0].dropIndex).toBe(7);
    expect(h.roots[1].dropIndex).toBeUndefined();

    expect(trigger.type).toBe("button");
    expect(trigger.children[0].content).toBe("Open Modal");

    expect(overlay.attributes.role).toBe("dialog");
    expect(overlay.attributes["aria-modal"]).toBe("true");
    expect(overlay.styles.display).toBe("none"); // hidden by default

    const content = overlay.children[0];
    expect(content.attributes.class).toBe("modal-content");
    const [header, body] = content.children;
    expect(header.attributes.class).toBe("modal-header");
    expect(header.children[0].type).toBe("heading");
    expect(header.children[0].content).toBe("Modal Title");
    expect(header.children[1].type).toBe("button"); // close button
    expect(header.children[1].children[0].content).toBe("×");
    expect(body.attributes.class).toBe("modal-body");
    expect(body.children[0].type).toBe("paragraph");
  });
});

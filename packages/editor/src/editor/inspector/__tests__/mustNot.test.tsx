// @vitest-environment jsdom
/**
 * The board spec's MUST-NOT list (docs/plans/2026-09-27-inspector-figma-board-
 * spec.md) — what the audit removed stays removed, on every selection type ×
 * tab. Every Inspector v4 lane keeps this green.
 *
 * Real Composer, real ProInspector: a string that comes back anywhere in the
 * rendered panel fails, whichever section brought it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { BINDABLE_TYPES } from "@/shared/constants/elementCapabilities";
import { ProInspector } from "../ProInspector";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

/** Every type a board draws (1–20), plus the no-board types most likely to regress. */
const TYPES = [
  "heading", "text", "paragraph", "button", "link", "image", "video", "audio", "svg", "icon",
  "video-embed", "map-embed", "lottie", "countdown", "progress", "accordion",
  "input", "textarea", "select", "checkbox", "radio", "switch", "label",
  "flex", "grid", "columns", "container", "section", "card", "cta",
  "form", "collection-list", "slider", "list-item", "divider", "spacer",
] as const;

const TABS = ["Style", "Behaviour", "Effects"] as const;

/** Anywhere in the panel, on any tab (DD-5, DD-6a/6b, R-DD-9, DD-12). */
const NEVER = [
  /\bBeginner\b/,
  /^Pro$/,
  /Applies to/,
  /Whole site/,
  /All like this/,
  /Expand all/,
  /Collapse all/,
  /\bOpen In\b/i,
  /000000/,
  /Custom attributes/,
  /ID & class/,
];

/** Never in the ⋯ (DD-7, DD-8b, R-DD-8). */
const NEVER_IN_MENU = [/Improve with AI/, /Pick on canvas/, /Select parent/, /Hide inspector/, /Expand all/, /Collapse all/];

let c: Composer;

function mount(type: string): { el: Element; view: ReturnType<typeof render> } {
  c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const created = c.elements.createElement(type as never, { content: "x" } as never);
  c.elements.addElement(created, root);
  const el = c.elements.getElement(created.getId())!;
  c.selection.select(el);
  const view = render(
    <ToastProvider>
      <ProInspector composer={c} selectedElement={{ id: el.getId(), type: el.getType(), tagName: el.getTagName() }} />
    </ToastProvider>
  );
  return { el, view };
}

const panel = () => screen.getByTestId("inspector-panel");
const sectionNames = () =>
  within(panel())
    .queryAllByRole("button", { name: / section, (expanded|collapsed)$/ })
    .map((b) => b.getAttribute("aria-label")!.replace(/ section, .*/, ""));

describe.each(TYPES)("MUST-NOT — %s", (type) => {
  it("no removed control on any tab, no context row on Behaviour, no removed ⋯ row", () => {
    mount(type);
    for (const tab of TABS) {
      fireEvent.click(within(screen.getByTestId("inspector-tab-strip")).getByRole("tab", { name: tab }));
      const text = panel().textContent ?? "";
      for (const re of NEVER) expect(text, `${type} · ${tab}: ${re}`).not.toMatch(re);
      /* DD-14: no state / breakpoint context on Behaviour. */
      if (tab === "Behaviour") expect(screen.queryByTestId("inspector-context-row"), `${type} · Behaviour`).toBeNull();
      else expect(screen.getByTestId("inspector-context-row"), `${type} · ${tab}`).toBeInTheDocument();
      /* DD-10: CMS binding only on bindable types. */
      if (tab === "Behaviour" && !BINDABLE_TYPES.has(type)) expect(sectionNames(), type).not.toContain("CMS binding");
      /* Q1: Interactions lives on Behaviour, never Effects. */
      if (tab === "Effects") expect(sectionNames(), type).not.toContain("Interactions");
    }
    fireEvent.click(screen.getByTestId("inspector-element-menu"));
    const menu = screen.getByRole("menu", { name: "Element actions" });
    for (const re of NEVER_IN_MENU) expect(menu.textContent, `${type} ⋯: ${re}`).not.toMatch(re);
  });

  it("the header and type block never call it a Container unless it is one (Q2)", () => {
    mount(type);
    if (type === "container") return;
    const header = screen.getByTestId("inspector-header");
    expect(within(header).getByTestId("inspector-element-name").textContent).not.toBe("Container");
    expect(sectionNames()).not.toContain("Container");
  });
});

describe("MUST-NOT — the Page panel", () => {
  it("nothing selected: no tabs, and no Link / CMS / Visibility / Interactions (DD-10, DD-13)", () => {
    c = createTestComposer();
    c.elements.createPage("Home");
    render(
      <ToastProvider>
        <ProInspector composer={c} selectedElement={null} />
      </ToastProvider>
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    const text = document.body.textContent ?? "";
    for (const re of [/\bLink\b/, /CMS binding/, /Visibility/, /Interactions/]) expect(text).not.toMatch(re);
  });
});

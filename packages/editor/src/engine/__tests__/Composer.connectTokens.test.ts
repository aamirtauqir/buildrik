/**
 * Brand Part 1b, Task 9 (spec §3, tests 6 + 29): Connect to tokens applies as
 * one ⌘Z step, and a template apply announces its suggestions.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { EVENTS } from "@/shared/constants/events";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function siteWithRawPrimary() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  const root = c.elements.getElement(page.root.id)!;
  root.setStyle("color", "#1A56DB");
  root.setStyle("padding", "16px");
  c.history.flushPending();
  return { c, page, root };
}

/* The seed holds #1A56DB under Primary AND the Beginner alias Action, so that
   suggestion has no single target: the person picks. These tests pick Primary. */
const pickPrimary = (s: { key: string; candidates: string[]; target: string | null }) => ({
  key: s.key,
  tokenId: s.candidates.includes("color-primary") ? "color-primary" : (s.target ?? s.candidates[0]),
});

describe("composer.designSystem Connect (spec §3, tests 6 + 29)", () => {
  it("applies the picks as ONE undo step", () => {
    const { c, root } = siteWithRawPrimary();
    const picks = c.designSystem.connectSuggestions().map(pickPrimary);
    expect(c.designSystem.applyConnect(picks)).toBe(2);
    c.history.flushPending();
    expect(root.getStyles().color).toBe("var(--buildrick-design-color-primary)");
    expect(root.getStyles().padding).toBe("var(--buildrick-design-space-4)");
    c.history.undo();
    // Undo restores a snapshot: read the element afresh.
    const after = c.elements.getElement(root.getId())!;
    expect(after.getStyles().color).toBe("#1A56DB");
    expect(after.getStyles().padding).toBe("16px");
  });

  it("a second Apply of the same picks writes nothing and adds no undo step", () => {
    const { c } = siteWithRawPrimary();
    const picks = c.designSystem.connectSuggestions().map(pickPrimary);
    c.designSystem.applyConnect(picks);
    c.history.flushPending();
    const depth = c.history.getUndoCount();
    expect(c.designSystem.applyConnect(picks)).toBe(0);
    c.history.flushPending();
    expect(c.history.getUndoCount()).toBe(depth);
  });

  it("refuses a token that is not a candidate, and refuses everything while read-only", () => {
    const { c } = siteWithRawPrimary();
    const [s] = c.designSystem.connectSuggestions();
    expect(c.designSystem.applyConnect([{ key: s.key, tokenId: "font-body" }])).toBe(0);
    c.designSystem.readOnly = true;
    expect(c.designSystem.applyConnect([{ key: s.key, tokenId: s.candidates[0] }])).toBe(0);
  });

  it("binds a breakpoint override too, in the same step (OQ-6)", () => {
    const { c, root } = siteWithRawPrimary();
    c.styles.setBreakpointStyle(root.getId(), "mobile", { padding: "16px" });
    c.history.flushPending();
    const space = c.designSystem.connectSuggestions().find((s) => s.kind === "spacing")!;
    expect(space.refs).toHaveLength(2);
    expect(c.designSystem.applyConnect([{ key: space.key, tokenId: "space-4" }])).toBe(2);
    expect(c.styles.getBreakpointStyle(root.getId(), "mobile").padding).toBe("var(--buildrick-design-space-4)");
    expect(root.getData().breakpointStyles?.mobile?.padding).toBe("var(--buildrick-design-space-4)");
  });

  it("announces suggestions for the page a template was applied to", () => {
    const { c, page } = siteWithRawPrimary();
    const seen = vi.fn();
    c.on(EVENTS.BRAND_CONNECT_SUGGESTED, seen);
    c.emit(EVENTS.TEMPLATE_APPLIED, { templateId: "t", pageId: page.id });
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ pageId: page.id }));
    expect(seen.mock.calls[0][0].suggestions.length).toBeGreaterThan(0);
  });
});

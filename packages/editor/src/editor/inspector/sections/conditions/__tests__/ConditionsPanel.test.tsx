// @vitest-environment jsdom
/**
 * Content › Conditions (B-11; 2L9 B4-D04, D07, D08, D10): the row's summary,
 * the subview's rule card and preview result, the empty state, and the old
 * "Conditions" kept inactive until activated — every write one step with its
 * receipt.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import type { CmsCondition } from "@buildrik/shared/schemas/cmsConditions";
import { ConditionsPanel, conditionsSummary } from "../ConditionsPanel";
import { convertLegacyCondition } from "../useConditions";
import { setShowHiddenElements } from "@/editor/canvas/hiddenElementsPref";

afterEach(cleanup);

const BLOG = {
  id: "blog",
  name: "Blog",
  pageTemplatePath: "index.html",
  fields: [
    { id: "f1", name: "Title", slug: "title", type: "text" },
    { id: "f2", name: "Sunday", slug: "sunday", type: "text" },
  ],
};

function makeComposer(opts: { condition?: CmsCondition | null; legacy?: boolean } = {}) {
  let condition = opts.condition ?? null;
  let legacy = opts.legacy ? { type: "condition", condition: { operator: "exists", left: "opening_hours.sunday" } } : undefined;
  const page = { id: "p1", name: "Home", slug: "", isHome: true, root: { id: "root" } };
  const el = {
    getParent: () => null,
    getDataBinding: (k: string) => (k === "condition" ? legacy : undefined),
    removeDataBinding: vi.fn(() => (legacy = undefined)),
  };
  const setCondition = vi.fn((_id: string, next: CmsCondition | null) => {
    condition = next;
    return true;
  });
  return {
    composer: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      markDirty: vi.fn(),
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      history: { captureUndo: vi.fn(() => vi.fn()), flushPending: vi.fn(), record: vi.fn() },
      elements: { getElement: () => el, getActivePage: () => page, getAllPages: () => [page] },
      cms: {
        bindings: { getCondition: () => condition, setCondition, getCollectionBinding: () => null },
        collections: {
          getAllCollections: () => [BLOG],
          queryContent: vi.fn(async () => ({ items: [{ id: "r1", data: { title: "A clearer point of view", sunday: "" } }] })),
        },
      },
    },
    setCondition,
    el,
  };
}

const mount = (c: unknown) =>
  render(
    <ToastProvider>
      <ConditionsPanel composer={c as never} elementId="h1" />
    </ToastProvider>
  );

describe("Conditions", () => {
  it("summary: '{n} · Hidden | Shown', '1 · Needs repair' (B5-D58), '1 · Inactive' for an old one, 'None'", () => {
    const c: CmsCondition = { match: "all", rules: [{ field: "sunday", op: "set" }] };
    const collection = BLOG as never;
    expect(conditionsSummary({ condition: c, passes: false, legacy: null, collection })).toBe("1 · Hidden");
    expect(conditionsSummary({ condition: c, passes: true, legacy: null, collection })).toBe("1 · Shown");
    expect(conditionsSummary({ condition: { match: "all", rules: [{ field: "opening_hours.sunday", op: "set" }] }, passes: false, legacy: null, collection })).toBe("1 · Needs repair");
    expect(conditionsSummary({ condition: null, passes: null, legacy: { expression: {} as never, converted: null }, collection })).toBe("1 · Inactive");
    expect(conditionsSummary({ condition: null, passes: null, legacy: null, collection })).toBe("None");
  });

  it("D08: a rule card, and what the preview record makes of it", async () => {
    const { composer } = makeComposer({ condition: { match: "all", rules: [{ field: "sunday", op: "set" }] } });
    mount(composer);
    expect(screen.getByLabelText("Field")).toHaveValue("sunday");
    expect(screen.getByLabelText("Rule")).toHaveValue("set");
    await waitFor(() => expect(screen.getByTestId("conditions-result")).toHaveTextContent("Sunday is empty. This condition is false."));
    expect(screen.getByTestId("conditions-result")).toHaveTextContent("Hidden on this record — showing as ghost.");
    expect(screen.getByText("Hidden content stays in the page source. Do not use conditions to protect private information.")).toBeTruthy();
  });

  it("B5-D46: a true 'is set' rule names it and says it ships", async () => {
    const { composer } = makeComposer({ condition: { match: "all", rules: [{ field: "title", op: "set" }] } });
    mount(composer);
    await waitFor(() => expect(screen.getByTestId("conditions-result")).toHaveTextContent("Title is set. This condition is true."));
    expect(screen.getByTestId("conditions-result")).toHaveTextContent("Shown on this record and in published output.");
  });

  it("B5-D35 / D45: a field the collection no longer has — 'no longer exists — Choose field' and the live result as the evaluator reads it", async () => {
    const { composer } = makeComposer({ condition: { match: "all", rules: [{ field: "opening_hours.sunday", op: "set" }] } });
    mount(composer);
    await waitFor(() => expect(screen.getByTestId("conditions-missing")).toHaveTextContent("sunday no longer exists — Choose field"));
    expect(screen.getByTestId("conditions-missing")).toHaveTextContent("Read as empty on the live site — this element will hide.");
    expect(screen.queryByTestId("conditions-result")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Choose field" }));
    expect(document.activeElement).toBe(screen.getByLabelText("Field"));
  });

  it("B5-D34: with Show hidden elements off, the false result says how to see it", async () => {
    setShowHiddenElements(false);
    try {
      const { composer } = makeComposer({ condition: { match: "all", rules: [{ field: "sunday", op: "set" }] } });
      mount(composer);
      await waitFor(() => expect(screen.getByTestId("conditions-result")).toHaveTextContent("Hidden on this record. Enable Show hidden elements to see it on canvas."));
    } finally {
      setShowHiddenElements(true);
    }
  });

  it("D10: removing the last rule removes the condition, with its receipt", () => {
    const { composer, setCondition } = makeComposer({ condition: { match: "all", rules: [{ field: "sunday", op: "set" }] } });
    mount(composer);
    act(() => {
      fireEvent.click(screen.getByTestId("condition-remove-rule"));
    });
    expect(setCondition).toHaveBeenCalledWith("h1", null, "Remove visibility condition");
    expect(screen.getByText("Visibility condition removed")).toBeTruthy();
  });

  it("empty: 'Show this element on every record.' and + Add rule adds one", () => {
    const { composer, setCondition } = makeComposer();
    mount(composer);
    expect(screen.getByTestId("conditions-empty")).toHaveTextContent("Show this element on every record.");
    expect(screen.getByTestId("conditions-empty")).toHaveTextContent("Conditions control visibility. Device visibility stays in Behavior.");
    act(() => {
      fireEvent.click(screen.getByTestId("conditions-add-rule"));
    });
    expect(setCondition).toHaveBeenCalledWith("h1", { match: "all", rules: [{ field: "title", op: "set" }] }, "Add visibility condition");
    expect(screen.getByText("Visibility condition added")).toBeTruthy();
  });

  it("D07: an old condition is preserved, inactive, until activated in one step", () => {
    const { composer, setCondition, el } = makeComposer({ legacy: true });
    mount(composer);
    expect(screen.getByTestId("conditions-legacy")).toHaveTextContent("Not active — from old Conditions");
    expect(screen.getByLabelText("Field")).toHaveValue("opening_hours.sunday");
    act(() => {
      fireEvent.click(screen.getByTestId("conditions-legacy-activate"));
    });
    expect(el.removeDataBinding).toHaveBeenCalledWith("condition");
    expect(setCondition).toHaveBeenCalledWith("h1", { match: "all", rules: [{ field: "opening_hours.sunday", op: "set" }] });
    expect(composer.beginTransaction).toHaveBeenCalledWith("Activate legacy condition");
    expect(screen.getByText("Legacy condition activated")).toBeTruthy();
  });

  it("old conditions convert only when they mean the same thing", () => {
    expect(convertLegacyCondition({ operator: "startsWith", left: "x", right: "a" })).toBeNull();
    expect(convertLegacyCondition({ operator: "OR", conditions: [{ operator: ">", left: "price", right: 3 }, { operator: "empty", left: "note" }] })).toEqual({
      match: "any",
      rules: [
        { field: "price", op: "gt", value: "3" },
        { field: "note", op: "empty" },
      ],
    });
  });
});

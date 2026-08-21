/**
 * The detail screen's Insert button says something when it can't insert.
 *
 * The row action on the list already warns ("Open a page first to add this
 * component."); this screen's own button returned in silence — the same click,
 * the same nothing, no message. It also ignored a null return from
 * `instantiateComponent`, which is what a refused placement looks like.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/editor/chrome-ui";
import { ComponentDetailScreen } from "../ComponentDetailScreen";

/* The real ToastProvider renders the toasts, so the assertions read what a
   user would see rather than a mocked call log. */
const toastText = () =>
  Array.from(document.querySelectorAll("[role=status], [class*='toast']"))
    .map((n) => (n.textContent ?? "").trim())
    .filter(Boolean)
    .join(" | ");

afterEach(cleanup);

const component = {
  id: "c1",
  name: "CTA",
  masterTree: { id: "m", type: "button", tagName: "button", children: [] },
  createdAt: 1,
  updatedAt: 1,
  version: 1,
} as never;

function makeComposer(opts: { activePage?: unknown; instantiate?: unknown } = {}) {
  return {
    selection: { getSelectedIds: () => [] },
    elements: { getActivePage: () => opts.activePage ?? null, getElement: () => null },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    components: {
      instantiateComponent: opts.instantiate ?? vi.fn().mockResolvedValue("el-1"),
      getInstancesOfComponent: () => [],
      isInstance: () => false,
    },
  } as never;
}

describe("ComponentDetailScreen — Insert", () => {
  it("warns when there is no page to insert into", async () => {
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={makeComposer()} onBack={vi.fn()} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /insert/i }));
    await waitFor(() => expect(toastText()).toContain("Open a page first"));
  });

  it("says so when the engine refuses the placement", async () => {
    const composer = makeComposer({
      activePage: { id: "p1", root: { id: "root-1" } },
      instantiate: vi.fn().mockResolvedValue(null),
    });
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={composer} onBack={vi.fn()} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /insert/i }));
    await waitFor(() => expect(toastText()).toContain("Couldn't add"));
  });

  it("stays quiet on a successful insert", async () => {
    const composer = makeComposer({ activePage: { id: "p1", root: { id: "root-1" } } });
    render(
      <ToastProvider>
        <ComponentDetailScreen component={component} composer={composer} onBack={vi.fn()} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /insert/i }));
    await waitFor(() =>
      expect(
        (composer as unknown as { components: { instantiateComponent: unknown } }).components
          .instantiateComponent,
      ).toHaveBeenCalled(),
    );
    expect(toastText()).toBe("");
  });
});

// @vitest-environment jsdom
/**
 * Task 1.6 — the inspector while the site has not loaded: the view-only line
 * in the board's words for the cause, fields disabled (aria-disabled on the
 * group, read-only in the field context), and both follow `editlock:changed`
 * rather than a flag of their own.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { setSiteLoadStatus } from "@/editor/shell/siteLoadStatus";
import { ProInspector } from "../ProInspector";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(() => {
  cleanup();
  setSiteLoadStatus(null);
});

function mount(select: boolean) {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const created = c.elements.createElement("heading" as never, { content: "Hello" } as never);
  c.elements.addElement(created, root);
  const el = c.elements.getElement(created.getId())!;
  if (select) c.selection.select(el);
  render(
    <ToastProvider>
      <ProInspector
        composer={c}
        selectedElement={select ? { id: el.getId(), type: el.getType(), tagName: el.getTagName() } : null}
      />
    </ToastProvider>,
  );
  return c;
}

describe("Inspector while the site has not loaded", () => {
  it("shows 'View only until the site loads' and disables the fields; both clear with the lock", () => {
    const c = mount(true);
    expect(screen.queryByTestId("inspector-view-only")).toBeNull();
    expect(screen.getByRole("group", { name: "Element properties" })).not.toHaveAttribute("aria-disabled");

    act(() => c.setEditLock("not-loaded", true));
    expect(screen.getByTestId("inspector-view-only").textContent).toBe("View only until the site loads");
    expect(screen.getByRole("group", { name: "Element properties" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("inspector-panel")).toHaveAttribute("data-readonly", "true");

    act(() => c.setEditLock("not-loaded", false));
    expect(screen.queryByTestId("inspector-view-only")).toBeNull();
    expect(screen.getByTestId("inspector-panel")).not.toHaveAttribute("data-readonly");
  });

  it("names a deleted site and a refused one in the board's words, over the page panel too", () => {
    const c = mount(false);
    act(() => {
      c.setEditLock("not-loaded", true);
      setSiteLoadStatus({
        failure: { kind: "missing", status: 404, code: "NOT_FOUND", requestId: null, url: null },
        retry: null,
      });
    });
    expect(screen.getByTestId("inspector-view-only").textContent).toBe("View only · this site was deleted");

    act(() =>
      setSiteLoadStatus({
        failure: { kind: "forbidden", status: 403, code: "FORBIDDEN", requestId: null, url: null },
        retry: null,
      }),
    );
    expect(screen.getByTestId("inspector-view-only").textContent).toBe("View only · your role changed");
  });

  /* 2L9 S02 (255:82909): a connection failure — the saved project is safe,
     and Retry loading runs the loader's own in-place retry. */
  it("a connection failure says the saved project is safe and retries the load in place", async () => {
    const c = mount(true);
    const retry = vi.fn(() => Promise.resolve(false));
    act(() => {
      c.setEditLock("not-loaded", true);
      setSiteLoadStatus({ failure: { kind: "network", status: null, code: null, requestId: null, url: null }, retry });
    });
    const card = screen.getByTestId("inspector-load-failed");
    expect(card).toHaveTextContent("Project could not load");
    expect(card).toHaveTextContent("Check your connection, then retry. Your saved project has not been replaced.");
    expect(screen.queryByTestId("inspector-view-only")).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
    });
    expect(retry).toHaveBeenCalledTimes(1);
    /* No published retry: nothing to offer. */
    act(() => setSiteLoadStatus({ failure: { kind: "offline", status: null, code: null, requestId: null, url: null }, retry: null }));
    expect(screen.getByTestId("inspector-load-failed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry loading" })).toBeNull();
  });

  it("view mode alone is read-only without the not-loaded line", () => {
    const c = mount(true);
    act(() => c.setEditLock("view", true));
    expect(screen.queryByTestId("inspector-view-only")).toBeNull();
    expect(screen.getByTestId("inspector-panel")).toHaveAttribute("data-readonly", "true");
  });
});

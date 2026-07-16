/**
 * useCanvasContent — CMS binding resolution (integration with the real
 * useCMSPreview against a mocked composer.cms slice).
 *
 * @license BSD-3-Clause
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Composer } from "../../../../engine";
import { useCanvasContent } from "../useCanvasContent";

interface Binding {
  elementId: string;
  property: string;
}

function makeComposer(bindingsByElement: Record<string, Binding[]>, resolvedValue = "Resolved Title") {
  const resolveBinding = vi.fn(async () => resolvedValue);
  const collectionsOn = vi.fn();
  const collectionsOff = vi.fn();
  const composer = {
    elements: {
      getActivePage: vi.fn(() => ({ root: { id: "root-1" } })),
    },
    cms: {
      bindings: {
        getBindings: vi.fn((id: string) => bindingsByElement[id] ?? []),
        resolveBinding,
      },
      collections: { on: collectionsOn, off: collectionsOff },
    },
  } as unknown as Composer;
  return { composer, resolveBinding, collectionsOn, collectionsOff };
}

describe("useCanvasContent — CMS binding resolution", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a content binding into the element text and marks it data-cms-bound", async () => {
    const { composer, resolveBinding } = makeComposer({
      "el-1": [{ elementId: "el-1", property: "content" }],
    });
    const content =
      '<section data-buildrick-id="root-1"><p data-buildrick-id="el-1">{{title}}</p></section>';

    const { result } = renderHook(() => useCanvasContent({ composer, content }));

    await waitFor(() => {
      expect(result.current.displayContent).toContain("Resolved Title");
    });
    expect(result.current.displayContent).toContain('data-cms-bound="true"');
    expect(result.current.displayContent).not.toContain("{{title}}");
    expect(resolveBinding).toHaveBeenCalledWith({ elementId: "el-1", property: "content" });
  });

  it("resolves src / href / arbitrary-attribute bindings onto the bound element", async () => {
    const { composer } = makeComposer(
      {
        "img-1": [{ elementId: "img-1", property: "src" }],
        "link-1": [{ elementId: "link-1", property: "href" }],
        "el-2": [{ elementId: "el-2", property: "data-sku" }],
      },
      "cms-value"
    );
    const content =
      '<div data-buildrick-id="root-1">' +
      '<img data-buildrick-id="img-1" src="placeholder.png">' +
      '<a data-buildrick-id="link-1" href="#">Link</a>' +
      '<span data-buildrick-id="el-2">SKU</span>' +
      "</div>";

    const { result } = renderHook(() => useCanvasContent({ composer, content }));

    await waitFor(() => {
      expect(result.current.displayContent).toContain('src="cms-value"');
    });
    expect(result.current.displayContent).toContain('href="cms-value"');
    expect(result.current.displayContent).toContain('data-sku="cms-value"');
  });

  it("passes content through untouched when no element carries bindings", async () => {
    const { composer, resolveBinding } = makeComposer({});
    const content = '<div data-buildrick-id="root-1"><p data-buildrick-id="el-1">Static</p></div>';

    const { result } = renderHook(() => useCanvasContent({ composer, content }));

    await waitFor(() => {
      expect(result.current.displayContent).toBe(content);
    });
    expect(resolveBinding).not.toHaveBeenCalled();
    expect(result.current.displayContent).not.toContain("data-cms-bound");
  });

  it("keeps the original markup when a binding resolves to an empty value", async () => {
    const { composer } = makeComposer(
      { "el-1": [{ elementId: "el-1", property: "content" }] },
      "" // falsy value → binding skipped
    );
    const content = '<div data-buildrick-id="root-1"><p data-buildrick-id="el-1">Fallback</p></div>';

    const { result } = renderHook(() => useCanvasContent({ composer, content }));

    await waitFor(() => {
      expect(result.current.displayContent).toContain("Fallback");
    });
    expect(result.current.displayContent).not.toContain("data-cms-bound");
  });

  it("renders the empty-canvas root wrapper (with root id) when content is empty", () => {
    const { composer } = makeComposer({});
    const { result } = renderHook(() => useCanvasContent({ composer, content: "" }));
    expect(result.current.displayContent).toBe(
      '<div data-buildrick-id="root-1" class="bd-empty-canvas-root"></div>'
    );
  });

  it("subscribes to CMS content change events and unsubscribes on unmount", () => {
    const { composer, collectionsOn, collectionsOff } = makeComposer({});
    const { unmount } = renderHook(() =>
      useCanvasContent({ composer, content: "<div data-buildrick-id='root-1'></div>" })
    );
    expect(collectionsOn).toHaveBeenCalledWith("content:updated", expect.any(Function));
    expect(collectionsOn).toHaveBeenCalledWith("content:created", expect.any(Function));
    unmount();
    expect(collectionsOff).toHaveBeenCalledWith("content:updated", expect.any(Function));
    expect(collectionsOff).toHaveBeenCalledWith("content:created", expect.any(Function));
  });
});

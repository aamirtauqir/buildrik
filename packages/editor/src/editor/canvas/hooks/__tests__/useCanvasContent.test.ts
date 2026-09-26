import { renderHook } from "@testing-library/react";
import { useCanvasContent } from "../useCanvasContent";

describe("useCanvasContent — DOMParser memoization", () => {
  it("does not re-compute displayContent when only selectedId changes", () => {
    const content = "<div data-buildrick-id='root'><p data-buildrick-id='el-1'>text</p></div>";
    let parseCount = 0;

    // Spy on DOMParser to count calls
    const OriginalDOMParser = globalThis.DOMParser;
    const DOMParserSpy = class extends OriginalDOMParser {
      parseFromString(...args: Parameters<DOMParser["parseFromString"]>) {
        parseCount++;
        return super.parseFromString(...args);
      }
    };
    globalThis.DOMParser = DOMParserSpy as typeof DOMParser;

    try {
      // selectedId and dropTargetId are no longer accepted by useCanvasContent.
      // Re-renders that change only selection state must not re-invoke DOMParser.
      // _props drives re-renders simulating parent changing selection state;
      // useCanvasContent intentionally ignores it to prove memo isolation.
      const { rerender } = renderHook(
        (_props: { selectedId: string | null }) => useCanvasContent({ composer: null, content }),
        { initialProps: { selectedId: null as string | null } }
      );

      const countAfterInit = parseCount;
      rerender({ selectedId: "el-1" });
      expect(parseCount).toBe(countAfterInit); // no re-parse on selection change
    } finally {
      globalThis.DOMParser = OriginalDOMParser;
    }
  });

  it("D-7: never constructs a DOMParser when composer has no CMS bindings", () => {
    const content = "<div data-buildrick-id='root'><p data-buildrick-id='el-1'>text</p></div>";
    let parseCount = 0;

    const OriginalDOMParser = globalThis.DOMParser;
    const DOMParserSpy = class extends OriginalDOMParser {
      constructor(...args: []) {
        super(...args);
        parseCount++;
      }
    };
    globalThis.DOMParser = DOMParserSpy as typeof DOMParser;

    try {
      const { result } = renderHook(() => useCanvasContent({ composer: null, content }));
      expect(parseCount).toBe(0);
      expect(result.current.displayContent).toBe(content);
    } finally {
      globalThis.DOMParser = OriginalDOMParser;
    }
  });
});

import { render } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import type {
  SectionBoundary,
  SectionDragState,
} from "../../hooks/useSectionReorder";
import { SectionReorderHandles } from "../SectionReorderHandles";

function makeBoundary(id: string, index: number, top: number): SectionBoundary {
  return {
    sectionId: id,
    index,
    rect: { top, left: 0, right: 100, bottom: top + 40, width: 100, height: 40 } as DOMRect,
  };
}

function renderHandles(boundaries: SectionBoundary[], dragState: SectionDragState | null = null) {
  return render(
    <SectionReorderHandles
      boundaries={boundaries}
      dragState={dragState}
      hoveredBoundary={null}
      onStartDrag={vi.fn()}
      onUpdateDrag={vi.fn()}
      onCompleteDrag={vi.fn()}
      onCancelDrag={vi.fn()}
      onHoverBoundary={vi.fn()}
    />
  );
}

describe("SectionReorderHandles — hook order stability", () => {
  // Regression: before the fix, useMemo sat AFTER an early `return null`. The
  // first time boundaries crossed from <2 to >=2 (e.g. dropping a section onto
  // a blank canvas) React threw "Rendered more hooks than during the previous
  // render" and the StudioErrorBoundary hid the editor.
  it("survives re-render when boundaries grow from 0 to many without throwing hook count error", () => {
    const { rerender } = renderHandles([]);
    expect(() =>
      rerender(
        <SectionReorderHandles
          boundaries={[
            makeBoundary("s1", 0, 0),
            makeBoundary("s2", 1, 100),
            makeBoundary("s3", 2, 200),
          ]}
          dragState={null}
          hoveredBoundary={null}
          onStartDrag={vi.fn()}
          onUpdateDrag={vi.fn()}
          onCompleteDrag={vi.fn()}
          onCancelDrag={vi.fn()}
          onHoverBoundary={vi.fn()}
        />
      )
    ).not.toThrow();
  });

  it("survives re-render when boundaries crosses exactly the <2 threshold", () => {
    const { rerender } = renderHandles([makeBoundary("s1", 0, 0)]);
    expect(() =>
      rerender(
        <SectionReorderHandles
          boundaries={[makeBoundary("s1", 0, 0), makeBoundary("s2", 1, 100)]}
          dragState={null}
          hoveredBoundary={null}
          onStartDrag={vi.fn()}
          onUpdateDrag={vi.fn()}
          onCompleteDrag={vi.fn()}
          onCancelDrag={vi.fn()}
          onHoverBoundary={vi.fn()}
        />
      )
    ).not.toThrow();
  });

  it("renders nothing when fewer than 2 boundaries exist", () => {
    const { container } = renderHandles([]);
    expect(container.firstChild).toBeNull();
  });
});

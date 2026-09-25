import { render } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import type {
  SectionBoundary,
  SectionDragState,
} from "../../hooks/useSectionReorder";
import { SectionReorderHandles } from "../SectionReorderHandles";

function makeBoundary(id: string, index: number, top: number, label = id, height = 40): SectionBoundary {
  return { sectionId: id, index, label, rect: { top, left: 0, width: 100, height } };
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

/* Boards 4428:44400 / 5940:148012: the FIRST section (Hero) is draggable too,
   and the drop cue is a full-size accent slot reading "↑ Hero moves here",
   not a 2px line. */
describe("SectionReorderHandles — board 4428:44400", () => {
  const three = () => [makeBoundary("s1", 0, 0, "Hero", 250), makeBoundary("s2", 1, 250, "Grid", 100), makeBoundary("s3", 2, 350, "Footer", 60)];

  it("gives every section a handle, the first included", () => {
    const { getAllByRole } = renderHandles(three());
    expect(getAllByRole("button", { hidden: true }).map((b) => b.getAttribute("aria-label"))).toEqual([
      "Drag to reorder section 1",
      "Drag to reorder section 2",
      "Drag to reorder section 3",
    ]);
  });

  it("draws the dragged section's slot at the target, sized like it and labelled with its name", () => {
    const { getByTestId } = renderHandles(three(), { sectionId: "s1", fromIndex: 0, toIndex: 2 });
    const slot = getByTestId("section-drop-slot");
    expect(slot.textContent).toBe("↓ Hero moves here");
    expect(slot.style.top).toBe("350px");
    expect(slot.style.height).toBe("250px");
  });

  it("points up when moving up, and after the last section sits at its bottom", () => {
    const up = renderHandles(three(), { sectionId: "s3", fromIndex: 2, toIndex: 0 });
    expect(up.getByTestId("section-drop-slot").textContent).toBe("↑ Footer moves here");
    up.unmount();
    const end = renderHandles(three(), { sectionId: "s1", fromIndex: 0, toIndex: 3 });
    expect(end.getByTestId("section-drop-slot").style.top).toBe("410px");
  });
});

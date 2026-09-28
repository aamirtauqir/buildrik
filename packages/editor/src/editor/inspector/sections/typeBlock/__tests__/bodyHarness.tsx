/**
 * Renders one element's type block on a REAL Composer (lock gate, history,
 * element tree), for the media / embed / widget body tests.
 * @license BSD-3-Clause
 */
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { createTestComposer } from "@/engine/__tests__/test-utils/realComposer";
import type { ElementData } from "@/shared/types";
import { TypeBlockSection } from "../TypeBlockSection";

export function renderBlock(element: Partial<ElementData> & { id: string; type: ElementData["type"] }, extra: { onOpenMediaLibrary?: ReturnType<typeof vi.fn>; styles?: Record<string, string> } = {}) {
  const composer = createTestComposer();
  composer.importProject({
    pages: [
      {
        id: "p",
        name: "Home",
        slug: "",
        isHome: true,
        root: { id: "root", type: "container", tagName: "div", children: [{ tagName: "div", children: [], ...element } as ElementData] },
      },
    ],
  } as never);
  const onChange = vi.fn();
  const onBatchChange = vi.fn();
  const utils = render(
    <TypeBlockSection
      element={{ id: element.id, type: element.type }}
      targetIds={[element.id]}
      composer={composer}
      styles={extra.styles ?? {}}
      onChange={onChange}
      onBatchChange={onBatchChange}
      onOpenMediaLibrary={extra.onOpenMediaLibrary as never}
      isOpen
      onToggle={() => {}}
    />,
  );
  const el = () => composer.elements.getElement(element.id)!;
  const undo = () => {
    composer.history.flushPending?.();
    composer.history.undo();
  };
  return { composer, el, onChange, onBatchChange, undo, ...utils };
}

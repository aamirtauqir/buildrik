import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { CSSClassesSection } from "../CSSClassesSection";

describe("CSSClassesSection refreshes on composer update", () => {
  it("reflects addClass call made via composer after mount", () => {
    const listeners = new Map<string, (p: unknown) => void>();
    const el = {
      _classes: [] as string[],
      getClasses() { return [...this._classes]; },
      addClass(c: string) { this._classes.push(c); },
      removeClass(c: string) { this._classes = this._classes.filter((x) => x !== c); },
    };
    const composer = {
      elements: { getElement: () => el },
      styles: { getGlobalClasses: () => [] },
      on: vi.fn((evt: string, cb: any) => { listeners.set(evt, cb); }),
      off: vi.fn((evt: string) => { listeners.delete(evt); }),
    } as any;

    const { queryByText } = render(
      <CSSClassesSection
        selectedElement={{ id: "e1", type: "box" }}
        composer={composer}
        isOpen={true}
      />
    );
    expect(queryByText(".btn-primary")).toBeNull();

    // External mutation (simulating undo/redo or another panel)
    act(() => {
      el.addClass("btn-primary");
      listeners.get("element:updated")?.(el);
    });

    expect(queryByText(".btn-primary")).toBeTruthy();
  });
});

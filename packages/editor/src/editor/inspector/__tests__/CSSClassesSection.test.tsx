import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CSSClassesSection } from "../sections/CSSClassesSection";

const makeEl = (classes: string[] = []) => ({
  getClasses: () => classes,
  addClass: vi.fn(),
  removeClass: vi.fn(),
});

const makeComposer = (el: ReturnType<typeof makeEl>) => ({
  elements: { getElement: () => el },
  styles: { getGlobalClasses: () => ["btn-primary", "card", "hero-section"] },
  history: { push: vi.fn() },
  beginTransaction: vi.fn(),
  endTransaction: vi.fn(),
});

describe("CSSClassesSection — class list from composer", () => {
  it("shows applied classes from element.getClasses()", () => {
    const el = makeEl(["font-bold", "text-center"]);
    const composer = makeComposer(el);
    render(
      <CSSClassesSection
        selectedElement={{ id: "el-1", type: "text" }}
        composer={composer as never}
      />
    );
    expect(screen.getByText(".font-bold")).toBeInTheDocument();
    expect(screen.getByText(".text-center")).toBeInTheDocument();
  });

  it("renders an add-chip when element has no classes", () => {
    const el = makeEl([]);
    const composer = makeComposer(el);
    render(
      <CSSClassesSection
        selectedElement={{ id: "el-1", type: "text" }}
        composer={composer as never}
      />
    );
    // No classes means no .chip text nodes, but the "+" add button must exist.
    expect(screen.getByRole("button", { name: /add class/i })).toBeInTheDocument();
    expect(screen.queryByText(/no classes applied/i)).not.toBeInTheDocument();
  });
});

describe("CSSClassesSection — no Tailwind COMMON_CLASSES", () => {
  it("does NOT show 'Quick Add' section with Tailwind classes", () => {
    const el = makeEl([]);
    const composer = makeComposer(el);
    render(
      <CSSClassesSection
        selectedElement={{ id: "el-1", type: "text" }}
        composer={composer as never}
      />
    );
    expect(screen.queryByText("Quick Add")).not.toBeInTheDocument();
    expect(screen.queryByText("flex")).not.toBeInTheDocument();
  });
});

describe("CSSClassesSection — Tab key does not add class", () => {
  it("Tab in inline-add input does not call addClass", () => {
    const el = makeEl([]);
    const addClassSpy = vi.fn();
    el.addClass = addClassSpy;
    const composer = makeComposer(el);
    render(
      <CSSClassesSection
        selectedElement={{ id: "el-1", type: "text" }}
        composer={composer as never}
      />
    );
    // Open inline input first — the add button is present but the input is hidden.
    fireEvent.click(screen.getByRole("button", { name: /add class/i }));
    const input = screen.getByPlaceholderText("class-name");
    fireEvent.change(input, { target: { value: "my-class" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(addClassSpy).not.toHaveBeenCalled();
  });
});

/**
 * Unification spec §550 — EditorLink full prop surface.
 * Verifies className/style/onClick/target/rel pass-through in both flag modes.
 * Complements EditorLink.test.tsx (which covers flag branching + encoding).
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { EditorLink } from "../EditorLink";
import { UnifiedEditorFlagContext } from "../unified-flag";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

function wrap(unified: boolean, children: React.ReactNode) {
  return (
    <UnifiedEditorFlagContext.Provider value={unified}>
      {children}
    </UnifiedEditorFlagContext.Provider>
  );
}

describe("EditorLink prop pass-through", () => {
  it("applies className + style in unified mode", () => {
    render(wrap(true, (
      <EditorLink siteId="abc" className="my-link" style={{ color: "red" }}>
        Edit
      </EditorLink>
    )));
    const a = screen.getByText("Edit").closest("a")!;
    expect(a.className).toBe("my-link");
    expect(a.style.color).toBe("red");
  });

  it("applies className + style in legacy mode", () => {
    render(wrap(false, (
      <EditorLink siteId="abc" className="legacy-link" style={{ background: "blue" }}>
        Edit
      </EditorLink>
    )));
    const a = screen.getByText("Edit").closest("a")!;
    expect(a.className).toBe("legacy-link");
    expect(a.style.background).toBe("blue");
  });

  it("forwards onClick handler in both modes", () => {
    const onClickUnified = vi.fn();
    const onClickLegacy = vi.fn();
    render(wrap(true, <EditorLink siteId="abc" onClick={onClickUnified}>U</EditorLink>));
    render(wrap(false, <EditorLink siteId="abc" onClick={onClickLegacy}>L</EditorLink>));
    fireEvent.click(screen.getByText("U"));
    fireEvent.click(screen.getByText("L"));
    expect(onClickUnified).toHaveBeenCalled();
    expect(onClickLegacy).toHaveBeenCalled();
  });

  it("forwards target + rel in both modes", () => {
    render(wrap(true, (
      <EditorLink siteId="a" target="_blank" rel="noopener">U</EditorLink>
    )));
    render(wrap(false, (
      <EditorLink siteId="a" target="_blank" rel="noopener">L</EditorLink>
    )));
    const u = screen.getByText("U").closest("a")!;
    const l = screen.getByText("L").closest("a")!;
    expect(u.getAttribute("target")).toBe("_blank");
    expect(u.getAttribute("rel")).toBe("noopener");
    expect(l.getAttribute("target")).toBe("_blank");
    expect(l.getAttribute("rel")).toBe("noopener");
  });
});

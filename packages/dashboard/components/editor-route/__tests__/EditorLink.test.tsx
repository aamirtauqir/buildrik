/**
 * Unification spec §550 — EditorLink + getEditorHref + UnifiedEditorFlag.
 * Asserts flag-driven branching: unified → Next Link with prefetch; legacy → <a>.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorLink } from "../EditorLink";
import { UnifiedEditorFlagContext } from "../unified-flag";

// Mock next/link so we can assert prefetch + href without booting Next runtime.
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, prefetch, children, ...rest }: any) => (
    <a data-prefetch={String(prefetch)} href={href} {...rest}>
      {children}
    </a>
  ),
}));

function wrap(unified: boolean, children: React.ReactNode) {
  return (
    <UnifiedEditorFlagContext.Provider value={unified}>
      {children}
    </UnifiedEditorFlagContext.Provider>
  );
}

describe("EditorLink", () => {
  it("renders Next Link with prefetch=true and /edit/<id> href when flag ON", () => {
    render(wrap(true, <EditorLink siteId="abc">Edit</EditorLink>));
    const link = screen.getByText("Edit").closest("a")!;
    expect(link.getAttribute("href")).toBe("/edit/abc");
    expect(link.getAttribute("data-prefetch")).toBe("true");
  });

  it("renders plain <a> (no prefetch attr from Next) when flag OFF", () => {
    render(wrap(false, <EditorLink siteId="abc">Edit</EditorLink>));
    const link = screen.getByText("Edit").closest("a")!;
    expect(link.getAttribute("href")).toMatch(/[?&]siteId=abc$/);
    // Legacy branch returns a plain <a>; mock's data-prefetch should not be set.
    expect(link.getAttribute("data-prefetch")).toBeNull();
  });

  it("encodes URL-special characters in siteId", () => {
    render(wrap(true, <EditorLink siteId="abc def">Edit</EditorLink>));
    const link = screen.getByText("Edit").closest("a")!;
    expect(link.getAttribute("href")).toBe("/edit/abc%20def");
  });
});

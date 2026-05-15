import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { TokenKindCard } from "../TokenKindCard";

describe("TokenKindCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders title, count and child body when open (T3 mono format)", () => {
    const { getByText, getByRole } = render(
      <TokenKindCard kindId="color" title="Color" count={12} defaultOpen>
        <div>color body</div>
      </TokenKindCard>
    );
    // T3: header text is `{Title} · {count} TOKENS` inline.
    expect(getByText("Color · 12 TOKENS")).toBeTruthy();
    expect(getByText("color body")).toBeTruthy();
    // Open state → minus-sign glyph.
    const button = getByRole("button");
    expect(button.textContent).toContain("[−]");
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("hides body when collapsed and re-shows on header click", () => {
    const { getByRole, queryByText } = render(
      <TokenKindCard kindId="radius" title="Radius" count={5} defaultOpen={false}>
        <div>radius body</div>
      </TokenKindCard>
    );
    expect(queryByText("radius body")).toBeNull();
    fireEvent.click(getByRole("button", { name: /Radius/ }));
    expect(queryByText("radius body")).toBeTruthy();
  });

  it("persists open state per kindId across remounts", () => {
    const { getByRole, unmount } = render(
      <TokenKindCard kindId="shadow" title="Shadow" count={3} defaultOpen={false}>
        <div>shadow body</div>
      </TokenKindCard>
    );
    fireEvent.click(getByRole("button", { name: /Shadow/ }));
    unmount();
    const { queryByText } = render(
      <TokenKindCard kindId="shadow" title="Shadow" count={3} defaultOpen={false}>
        <div>shadow body</div>
      </TokenKindCard>
    );
    expect(queryByText("shadow body")).toBeTruthy();
  });

  it("T3: collapsed header shows [+], expanded shows [−], aria-expanded reflects state", () => {
    const { getByRole } = render(
      <TokenKindCard kindId="motion" title="Motion" count={6} defaultOpen={false}>
        <div>motion body</div>
      </TokenKindCard>
    );
    const button = getByRole("button");
    expect(button.textContent).toContain("[+]");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(button.textContent).toContain("[−]");
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("T3: header uses monospace font + uppercase via inline style", () => {
    const { getByRole } = render(
      <TokenKindCard kindId="border" title="Border" count={0} defaultOpen={false}>
        <div>border body</div>
      </TokenKindCard>
    );
    const button = getByRole("button") as HTMLButtonElement;
    expect(button.style.fontFamily).toContain("var(--buildrick-font-family-mono");
    expect(button.style.textTransform).toBe("uppercase");
    expect(button.style.letterSpacing).toBe("0.08em");
  });

  it("renders dirty dot when isDirty is true", () => {
    const { getByLabelText } = render(
      <TokenKindCard kindId="motion" title="Motion" count={6} defaultOpen isDirty>
        <div>motion body</div>
      </TokenKindCard>
    );
    expect(getByLabelText("unsaved changes in this kind")).toBeTruthy();
  });
});

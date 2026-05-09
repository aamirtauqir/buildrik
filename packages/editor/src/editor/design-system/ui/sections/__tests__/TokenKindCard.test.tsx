import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { TokenKindCard } from "../TokenKindCard";

describe("TokenKindCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders title, count and child body when open", () => {
    const { getByText } = render(
      <TokenKindCard kindId="color" title="Color" count={12} defaultOpen>
        <div>color body</div>
      </TokenKindCard>
    );
    expect(getByText("Color")).toBeTruthy();
    expect(getByText("12 tokens")).toBeTruthy();
    expect(getByText("color body")).toBeTruthy();
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

  it("renders dirty dot when isDirty is true", () => {
    const { getByLabelText } = render(
      <TokenKindCard kindId="motion" title="Motion" count={6} defaultOpen isDirty>
        <div>motion body</div>
      </TokenKindCard>
    );
    expect(getByLabelText("unsaved changes in this kind")).toBeTruthy();
  });
});

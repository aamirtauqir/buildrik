// @vitest-environment jsdom
/**
 * 2L9 B4-S05 (255:84358): a section that throws shows "{Section} unavailable"
 * and "Retry {Section}"; its neighbours keep rendering; Retry renders it again.
 * @license BSD-3-Clause
 */
import type * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { defineSection, type SectionContext } from "@/editor/inspector/sections/registry/_shared";

afterEach(cleanup);

let broken = true;
function Typography() {
  if (broken) throw new Error("boom");
  return <div>Typography controls</div>;
}
const Spacing = () => <div>Spacing controls</div>;

const make = (title: string, Component: () => React.ReactElement) =>
  defineSection({ tab: "style", title, open: "open", Component, styleKeys: [], adaptProps: () => ({}) });

describe("section error boundary (B4-S05)", () => {
  it("replaces only the failing section, and Retry renders it again", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ctx = { selectedElement: { id: "e1", type: "heading" }, styles: {} } as unknown as SectionContext;
    render(
      <>
        {make("Typography", Typography).render(ctx)}
        {make("Spacing", Spacing).render(ctx)}
      </>,
    );
    expect(screen.getByTestId("inspector-section-error")).toHaveTextContent("Typography unavailable");
    expect(screen.getByText("We could not display these controls. Your text and saved values are unchanged.")).toBeTruthy();
    expect(screen.getByText("Spacing controls")).toBeTruthy();
    broken = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry Typography" }));
    expect(screen.getByText("Typography controls")).toBeTruthy();
    expect(screen.queryByTestId("inspector-section-error")).toBeNull();
    quiet.mockRestore();
  });
});

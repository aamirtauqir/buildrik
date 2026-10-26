/**
 * Inspector states (2L9 S01, S03): the loading panel says what is happening;
 * the error boundary names the element that is still selected, says the
 * document is unchanged, and Try again renders the tab again.
 *
 * @license BSD-3-Clause
 */
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { InspectorLoading } from "../InspectorLoading";
import { InspectorErrorBoundary } from "../InspectorErrorBoundary";

vi.mock("@/shared/utils/errorTracking", () => ({ captureError: vi.fn() }));

describe("Inspector states", () => {
  it("S01: loading reads 'Loading project' and why there are no controls yet", () => {
    render(<InspectorLoading />);
    expect(screen.getByTestId("inspector-loading")).toHaveTextContent("Loading project");
    expect(screen.getByTestId("inspector-loading")).toHaveTextContent(
      "Your saved content is still arriving. Editing controls will appear when it is ready.",
    );
  });

  it("S03/S04: the boundary keeps the target named; Try again renders the tab again", () => {
    let fail = true;
    function Body() {
      if (fail) throw new Error("boom");
      return <div>Typography</div>;
    }
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <InspectorErrorBoundary targetName="Hero heading">
        <Body />
      </InspectorErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to display Inspector");
    expect(screen.getByRole("alert")).toHaveTextContent("Hero heading is still selected. This display error has not changed your document.");
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Typography")).toBeInTheDocument();
  });
});

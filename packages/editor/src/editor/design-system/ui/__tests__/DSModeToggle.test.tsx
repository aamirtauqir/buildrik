import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import { DSModeToggle } from "../DSModeToggle";
import { DSModeProvider, useDSMode } from "../../state/DSModeContext";

function wrap(children: React.ReactNode) {
  return <DSModeProvider>{children}</DSModeProvider>;
}

describe("DSModeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders both segments and marks beginner as checked by default", () => {
    const { getByRole } = render(wrap(<DSModeToggle />));
    const beginner = getByRole("radio", { name: "Beginner" });
    const pro = getByRole("radio", { name: "Pro" });
    expect(beginner.getAttribute("aria-checked")).toBe("true");
    expect(pro.getAttribute("aria-checked")).toBe("false");
  });

  it("clicking Pro flips aria-checked + persists 'pro' to localStorage", () => {
    const { getByRole } = render(wrap(<DSModeToggle />));
    fireEvent.click(getByRole("radio", { name: "Pro" }));
    expect(getByRole("radio", { name: "Pro" }).getAttribute("aria-checked")).toBe("true");
    expect(getByRole("radio", { name: "Beginner" }).getAttribute("aria-checked")).toBe("false");
    expect(localStorage.getItem("buildrik:ds-mode")).toBe("pro");
  });

  it("hydrates from persisted 'pro' on mount", () => {
    localStorage.setItem("buildrik:ds-mode", "pro");
    const { getByRole } = render(wrap(<DSModeToggle />));
    expect(getByRole("radio", { name: "Pro" }).getAttribute("aria-checked")).toBe("true");
  });

  it("re-renders when mode changes via the context API (external setMode)", () => {
    const ExternalSetter = () => {
      const { setMode } = useDSMode();
      return (
        <button data-testid="ext" onClick={() => setMode("pro")}>
          go-pro
        </button>
      );
    };

    const { getByRole, getByTestId } = render(
      wrap(
        <>
          <DSModeToggle />
          <ExternalSetter />
        </>
      )
    );

    fireEvent.click(getByTestId("ext"));
    expect(getByRole("radio", { name: "Pro" }).getAttribute("aria-checked")).toBe("true");
  });

  it("exposes the radiogroup with an accessible label", () => {
    const { getByRole } = render(wrap(<DSModeToggle />));
    const group = getByRole("radiogroup");
    expect(group.getAttribute("aria-label")).toBe("Design system display mode");
  });
});

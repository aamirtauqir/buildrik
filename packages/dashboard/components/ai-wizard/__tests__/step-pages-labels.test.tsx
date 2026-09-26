/**
 * B-8 remainder: "Describe your business (optional)" sat as a sibling
 * <label> with no htmlFor/id.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepPages } from "../step-pages";

describe("StepPages — label association", () => {
  it("the business-description field is reachable via getByLabelText", () => {
    render(
      <StepPages businessType="Restaurant" suggestedPages={["Menu"]} onBack={vi.fn()} onGenerate={vi.fn()} />
    );
    expect(screen.getByLabelText(/describe your business/i)).toBeInTheDocument();
  });
});

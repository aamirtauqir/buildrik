/**
 * B-8 remainder: OnbField's label had no htmlFor/id pairing with its input.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnbField } from "../onb-field";

describe("OnbField — label association", () => {
  it("is reachable via getByLabelText", () => {
    render(<OnbField label="Business name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Business name")).toBeInTheDocument();
  });

  it("respects a caller-supplied id", () => {
    render(<OnbField label="Business name" id="biz-name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Business name")).toHaveAttribute("id", "biz-name");
  });
});

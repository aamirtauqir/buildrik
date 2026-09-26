/**
 * B-8 remainder: OnbSelect's label had no htmlFor/id pairing with its select.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnbSelect } from "../onb-select";

describe("OnbSelect — label association", () => {
  it("is reachable via getByLabelText", () => {
    render(
      <OnbSelect
        label="Industry"
        value=""
        onChange={() => {}}
        options={[{ value: "retail", label: "Retail" }]}
      />
    );
    expect(screen.getByLabelText("Industry")).toBeInTheDocument();
  });
});

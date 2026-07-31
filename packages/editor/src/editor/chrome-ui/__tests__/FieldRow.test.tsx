/**
 * Molecules — contract tests.
 *
 * Assert the API and the accessibility wiring. Geometry comes from tokens and
 * is verified by the conformance runner, not here.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldRow } from "../index";

describe("FieldRow", () => {
  it("ties the label to its control", () => {
    render(
      <FieldRow label="Radius" htmlFor="radius">
        <input id="radius" />
      </FieldRow>,
    );
    expect(screen.getByLabelText("Radius")).toBeTruthy();
  });
});


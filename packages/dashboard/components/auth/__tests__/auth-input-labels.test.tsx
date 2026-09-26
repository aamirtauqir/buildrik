/**
 * B-8 remainder: AuthInput's label had no htmlFor/id pairing with its input.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthInput } from "../auth-input";

describe("AuthInput — label association", () => {
  it("is reachable via getByLabelText", () => {
    render(<AuthInput label="Email" type="email" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("respects a caller-supplied id", () => {
    render(<AuthInput label="Email" id="login-email" type="email" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "login-email");
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShareUnavailable } from "../unavailable";

describe("ShareUnavailable", () => {
  it.each([
    ["expired", "This link has expired"],
    ["revoked", "This link is no longer available"],
    ["unknown", "This link doesn’t work"],
  ] as const)("%s → %s, and never a password prompt", (reason, title) => {
    render(<ShareUnavailable reason={reason} />);
    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.queryByText(/password/i)).toBeNull();
    expect(document.querySelector("input")).toBeNull();
  });
});

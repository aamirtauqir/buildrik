/**
 * B-8: InputField rendered a bare <input> and callers hand-rolled a sibling
 * <label> with no htmlFor/id pairing — 76 of those across the dashboard, so
 * a screen reader announced an edit box with no accessible name. Clicking
 * "Current password" didn't focus the field either.
 *
 * InputField/SelectField now accept a `label` prop that wires htmlFor/id
 * (generated via useId when the caller doesn't supply one). This pins the
 * password fields on Settings > Account, the first call site migrated.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountTab } from "../account-tab";

describe("AccountTab field labels", () => {
  it("associates every password field with its label", () => {
    render(<AccountTab email="a@example.com" hasPassword />);

    // "Current password" appears twice (change-password form, change-email
    // confirmation) — each copy must resolve to its OWN input, not collide.
    const currentPasswordFields = screen.getAllByLabelText("Current password");
    expect(currentPasswordFields).toHaveLength(2);
    expect(currentPasswordFields[0]).not.toBe(currentPasswordFields[1]);
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  });

  it("clicking a label focuses its associated input, not the other same-named one", async () => {
    const user = userEvent.setup();
    render(<AccountTab email="a@example.com" hasPassword />);
    const [firstLabel] = screen.getAllByText("Current password", { selector: "label" });
    await user.click(firstLabel);
    const [firstInput, secondInput] = screen.getAllByLabelText("Current password");
    expect(document.activeElement).toBe(firstInput);
    expect(document.activeElement).not.toBe(secondInput);
  });
});

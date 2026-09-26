/**
 * B-8 remainder: "Reason (optional)" and the "Type DELETE to confirm" fields
 * sat as sibling <label>s with no htmlFor/id — getByLabelText couldn't find
 * either field.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DangerZoneTab } from "../danger-zone-tab";

describe("DangerZoneTab — label association", () => {
  it("Reason and the DELETE-confirm field are reachable via getByLabelText", async () => {
    const user = userEvent.setup();
    render(<DangerZoneTab />);
    await user.click(screen.getByText("I want to delete my account"));

    expect(screen.getByLabelText("Reason (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText(/to confirm/i)).toBeInTheDocument();
  });

  // Fix: associating the label must not restyle it (controller ruling).
  it("the DELETE-confirm label keeps its original body, text-primary style", async () => {
    const user = userEvent.setup();
    render(<DangerZoneTab />);
    await user.click(screen.getByText("I want to delete my account"));
    const label = document.querySelector(`label[for="${screen.getByLabelText(/to confirm/i).id}"]`) as HTMLElement;
    expect(label.className).toBe("block text-body font-medium mb-1");
    expect(label.style.color).toBe("var(--color-text-primary)");
  });
});

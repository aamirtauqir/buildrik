/**
 * B-8 remainder: "Additional feedback (optional)" sat as a sibling <label>
 * with no htmlFor/id.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CancelModal } from "../cancel-modal";

describe("CancelModal — label association", () => {
  it("the feedback field is reachable via getByLabelText", () => {
    render(<CancelModal periodEnd={new Date()} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/additional feedback/i)).toBeInTheDocument();
  });
});

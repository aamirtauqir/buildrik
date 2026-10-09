/**
 * L1-026 (editor audit 2026-10-08): the dialog said "cannot be undone" while the
 * delete moves the site to Recently deleted for 30 days (and the toast says so).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteConfirmModal } from "../delete-confirm-modal";

describe("DeleteConfirmModal — copy", () => {
  it("says the site moves to Recently deleted for 30 days", () => {
    render(<DeleteConfirmModal open siteName="Bella" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText(/moves to Recently deleted, where you can restore it for 30 days/i)).toBeInTheDocument();
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
  });
});

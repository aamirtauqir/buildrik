// @vitest-environment jsdom
/**
 * FG-045: the confirm said "This action cannot be undone." over a soft delete
 * the user can restore from Recently deleted for 30 days.
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteConfirmModal } from "../delete-confirm-modal";

describe("DeleteConfirmModal copy", () => {
  it("states the restore window instead of 'cannot be undone'", () => {
    render(<DeleteConfirmModal open siteName="Bakery" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByText(/cannot be undone/i)).toBeNull();
    expect(screen.getByText(/Recently deleted for 30 days/)).toBeTruthy();
  });
});

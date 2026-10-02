/**
 * SA-04: the modal promised an immediate, permanent delete while the server only
 * scheduled one 30 days out. The copy now describes what actually happens.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteWorkspaceModal } from "../delete-workspace-modal";

describe("DeleteWorkspaceModal — copy", () => {
  it("says the deletion is scheduled 30 days out and can be cancelled", () => {
    render(
      <DeleteWorkspaceModal workspaceName="Acme Inc." onConfirm={vi.fn()} onClose={vi.fn()} deleting={false} />
    );
    expect(
      screen.getByText("Your workspace will be deleted 30 days from now. Until then you can cancel from the dashboard home page."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("On that date every site is taken offline, the subscription is cancelled, and all sites, forms, members and data are removed for good."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cancelled immediately/i)).not.toBeInTheDocument();
  });
});

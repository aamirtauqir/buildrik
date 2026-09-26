/**
 * B-8 remainder: "Type <name> to confirm" sat as a sibling <label> with no
 * htmlFor/id — getByLabelText couldn't reach the confirm field.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteWorkspaceModal } from "../delete-workspace-modal";

describe("DeleteWorkspaceModal — label association", () => {
  it("the confirm field is reachable via getByLabelText", () => {
    render(
      <DeleteWorkspaceModal workspaceName="Acme Inc." onConfirm={vi.fn()} onClose={vi.fn()} deleting={false} />
    );
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
  });

  // Associating the label must not restyle it.
  it("keeps the original body-sm, text-primary label", () => {
    render(
      <DeleteWorkspaceModal workspaceName="Acme Inc." onConfirm={vi.fn()} onClose={vi.fn()} deleting={false} />
    );
    const label = document.querySelector(`label[for="${screen.getByLabelText(/type/i).id}"]`) as HTMLElement;
    expect(label.className).toBe("block text-body-sm font-medium mb-1");
    expect(label.style.color).toBe("var(--color-text-primary)");
  });
});

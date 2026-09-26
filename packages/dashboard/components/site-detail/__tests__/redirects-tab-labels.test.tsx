/**
 * B-8 remainder: the "From" and "To" fields sat as sibling <label>s with no
 * htmlFor/id — getByLabelText couldn't find either.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RedirectsTab } from "../redirects-tab";

describe("RedirectsTab — label association", () => {
  it("From and To are reachable via getByLabelText", () => {
    render(
      <RedirectsTab
        redirects={[]}
        limit={-1}
        canEdit
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );
    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  // Fix: associating the label must not restyle it (controller ruling).
  it("keeps the original muted body-sm labels and the field's mt-1 gap", () => {
    render(
      <RedirectsTab redirects={[]} limit={-1} canEdit onCreate={vi.fn()} onDelete={vi.fn()} onImport={vi.fn()} onExport={vi.fn()} />
    );
    for (const name of ["From", "To"]) {
      const input = screen.getByLabelText(name);
      const label = document.querySelector(`label[for="${input.id}"]`);
      expect(label?.className).toBe("block text-body-sm font-medium text-[var(--color-text-muted)]");
      expect(input.parentElement?.className).toContain("mt-1");
    }
  });
});

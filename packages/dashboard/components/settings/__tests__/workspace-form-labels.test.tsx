/**
 * B-8: every workspace field is reachable by its visible label, and the
 * label keeps its original body / text-primary look (fix).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () => (await import("@/components/__test-utils__/trpc-stub")).trpcStub());
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { WorkspaceForm } from "../workspace-form";

describe("WorkspaceForm — label association", () => {
  it("each field is reachable via getByLabelText", () => {
    render(<WorkspaceForm initialData={{ name: "Acme", slug: "acme" }} onSave={vi.fn()} onSaveSharing={vi.fn()} />);
    for (const name of ["Workspace name", "Workspace URL", "Default language", "Timezone", "Link expiration"]) {
      const control = screen.getByLabelText(name);
      const label = document.querySelector(`label[for="${control.id}"]`) as HTMLElement;
      expect(label.className, name).toBe("block text-body font-medium mb-1");
      expect(label.style.color, name).toBe("var(--color-text-primary)");
    }
  });
});

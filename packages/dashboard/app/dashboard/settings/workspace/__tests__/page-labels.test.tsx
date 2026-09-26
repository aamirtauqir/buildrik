/**
 * B-8: the Transfer ownership field is reachable by its label, which keeps
 * its original body / text-primary look (fix round 1).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () =>
  (await import("@/components/__test-utils__/trpc-stub")).trpcStub({
    "account.workspace.get.useQuery": { data: { name: "Acme", slug: "acme", iconUrl: null }, isLoading: false, isError: false },
    "account.workspace.transfer.pending.useQuery": { data: null, isLoading: false },
  }),
);
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import WorkspaceSettingsPage from "../page";

describe("Workspace settings page — label association", () => {
  it("New owner's email is reachable via getByLabelText", () => {
    render(<WorkspaceSettingsPage />);
    const input = screen.getByLabelText("New owner's email");
    expect(input).toHaveAttribute("type", "email");
    const label = document.querySelector(`label[for="${input.id}"]`) as HTMLElement;
    expect(label.className).toBe("block text-body font-medium mb-1");
    expect(label.style.color).toBe("var(--color-text-primary)");
  });
});

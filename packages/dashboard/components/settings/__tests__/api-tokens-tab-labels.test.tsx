/**
 * B-8: the New API token modal's Name field is reachable by its label,
 * which keeps its original body / text-primary look (fix round 1).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () =>
  (await import("@/components/__test-utils__/trpc-stub")).trpcStub({
    "dashboard.health.useQuery": { data: { role: "OWNER" }, isLoading: false },
    "apiTokens.list.useQuery": { data: [], isLoading: false, isError: false },
  }),
);
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { ApiTokensTab } from "../api-tokens-tab";

describe("ApiTokensTab — label association", () => {
  it("Name is reachable via getByLabelText", () => {
    render(<ApiTokensTab workspaceId="ws-1" />);
    fireEvent.click(screen.getByRole("button", { name: /New token/ }));
    const input = screen.getByLabelText("Name");
    const label = document.querySelector(`label[for="${input.id}"]`) as HTMLElement;
    expect(label.className).toBe("block text-body font-medium");
    expect(label.style.color).toBe("var(--color-text-primary)");
  });
});

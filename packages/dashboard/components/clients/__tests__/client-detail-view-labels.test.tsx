/**
 * B-8: the Branding dialog's Brand color, Logo URL and Custom domain are
 * reachable by their labels, which keep the dialog's original body-sm /
 * semibold / text-secondary look (fix).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () =>
  (await import("@/components/__test-utils__/trpc-stub")).trpcStub({
    "features.list.useQuery": { data: { agency_layer: true }, isLoading: false },
    "clients.get.useQuery": {
      data: { id: "c1", name: "Bella Cucina", siteCount: 0, logoUrl: null, brandColor: "#1A56DB", customDomain: null, hideBuildrik: false },
      isLoading: false,
      isError: false,
    },
  }),
);
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { ClientDetailView } from "../client-detail-view";

describe("ClientDetailView — Branding dialog label association", () => {
  it("Brand color, Logo URL and Custom domain are reachable via getByLabelText", () => {
    render(<ClientDetailView clientId="c1" />);
    fireEvent.click(screen.getByRole("button", { name: /Branding/ }));
    expect(screen.getByLabelText("Brand color")).toHaveAttribute("type", "color");
    for (const name of ["Brand color", "Logo URL", "Custom domain"]) {
      const control = screen.getByLabelText(name);
      const label = document.querySelector(`label[for="${control.id}"]`) as HTMLElement;
      expect(label.className, name).toBe("text-body-sm font-semibold");
      expect(label.style.color, name).toBe("var(--color-text-secondary)");
    }
  });
});

/**
 * B-8: the new-site Site name field is reachable by its label, which keeps
 * its original inline body / text-secondary look.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () => (await import("@/components/__test-utils__/trpc-stub")).trpcStub());
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/editor-route/unified-flag", () => ({
  useUnifiedEditorFlag: () => false,
  getEditorHref: (id: string) => `/edit/${id}`,
}));

import NewSitePage from "../page";

describe("New site page — label association", () => {
  it("Site name is reachable via getByLabelText", async () => {
    render(<NewSitePage />);
    const input = await screen.findByLabelText("Site name");
    const label = document.querySelector(`label[for="${input.id}"]`) as HTMLElement;
    expect(label.className).toBe("text-body font-medium");
    expect(label.style.color).toBe("var(--color-text-secondary)");
  });
});

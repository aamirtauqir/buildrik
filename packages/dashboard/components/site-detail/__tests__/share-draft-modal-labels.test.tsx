/**
 * B-8: Link name and Password are reachable by their labels, which keep
 * their original mb-1.5 / text-primary look (fix round 1).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () => (await import("@/components/__test-utils__/trpc-stub")).trpcStub());
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { ShareDraftModal } from "../share-draft-modal";

describe("ShareDraftModal — label association", () => {
  it("Link name and Password are reachable via getByLabelText", () => {
    render(<ShareDraftModal open onClose={vi.fn()} siteId="site-1" />);
    for (const name of ["Link name", /Password/]) {
      const control = screen.getByLabelText(name);
      const label = document.querySelector(`label[for="${control.id}"]`) as HTMLElement;
      expect(label.className).toBe("mb-1.5 block text-body font-medium");
      expect(label.style.color).toBe("var(--color-text-primary)");
    }
  });
});

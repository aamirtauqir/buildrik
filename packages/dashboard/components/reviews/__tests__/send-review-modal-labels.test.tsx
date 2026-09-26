/**
 * B-8: the review note is reachable by its label.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () => (await import("@/components/__test-utils__/trpc-stub")).trpcStub());
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { SendReviewModal } from "../send-review-modal";

describe("SendReviewModal — label association", () => {
  it("Note is reachable via getByLabelText", () => {
    render(<SendReviewModal open onClose={vi.fn()} siteId="site-1" siteName="Bella Cucina" />);
    expect(screen.getByLabelText(/Note/).tagName).toBe("TEXTAREA");
  });
});

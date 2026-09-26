/**
 * B-8: the invite modal's two text areas are reachable by their labels.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () => (await import("@/components/__test-utils__/trpc-stub")).trpcStub());

import { InviteModal } from "../invite-modal";

describe("InviteModal — label association", () => {
  it("Email addresses and Personal message are reachable via getByLabelText", () => {
    render(<InviteModal open onClose={vi.fn()} onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText("Email addresses").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText(/Personal message/).tagName).toBe("TEXTAREA");
  });
});

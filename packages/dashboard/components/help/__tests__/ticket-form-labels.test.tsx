/**
 * B-8: Subject, Category and Description are reachable by their labels, and
 * the Subject label keeps its original look.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () => (await import("@/components/__test-utils__/trpc-stub")).trpcStub());

import { TicketForm } from "../ticket-form";

describe("TicketForm — label association", () => {
  it("each field is reachable via getByLabelText", () => {
    render(<TicketForm />);
    expect(screen.getByLabelText("Category").tagName).toBe("SELECT");
    expect(screen.getByLabelText("Description").tagName).toBe("TEXTAREA");
    const subject = screen.getByLabelText("Subject");
    const label = document.querySelector(`label[for="${subject.id}"]`) as HTMLElement;
    expect(label.className).toBe("mb-1.5 block text-body font-medium");
    expect(label.style.color).toBe("var(--color-text-primary)");
  });
});

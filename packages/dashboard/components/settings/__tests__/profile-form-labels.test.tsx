/**
 * B-8: every profile field is reachable by its visible label, and the label
 * keeps its original body / text-primary look (fix).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@lib/trpc/client", async () => (await import("@/components/__test-utils__/trpc-stub")).trpcStub());
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { ProfileForm } from "../profile-form";

describe("ProfileForm — label association", () => {
  it("each field is reachable via getByLabelText", () => {
    render(<ProfileForm initialData={{ fullName: "Ada", displayName: "ada", email: "ada@example.com" }} onSave={vi.fn()} saving={false} />);
    for (const name of ["Full name", "Display name", "Email", "Bio", "Language", "Timezone"]) {
      const control = screen.getByLabelText(name);
      const label = document.querySelector(`label[for="${control.id}"]`) as HTMLElement;
      expect(label.className, name).toBe("block text-body font-medium mb-1");
      expect(label.style.color, name).toBe("var(--color-text-primary)");
    }
  });
});

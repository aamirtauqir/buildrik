/**
 * B-8 remainder: the "Site name" field sat as a sibling <label> with no
 * htmlFor/id.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@lib/trpc/client", () => ({
  trpc: {
    sites: { list: { useQuery: () => ({ data: undefined, isLoading: false }) } },
    templates: {
      list: { useQuery: () => ({ data: undefined, isLoading: false }) },
      use: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      applyToSite: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock("@/components/editor-route/unified-flag", () => ({
  useUnifiedEditorFlag: () => false,
  getEditorHref: (id: string) => `/edit/${id}`,
}));

import { UseTemplateModal } from "../use-template-modal";

describe("UseTemplateModal — label association", () => {
  it("Site name is reachable via getByLabelText", async () => {
    const user = userEvent.setup();
    render(<UseTemplateModal open templateId="tmpl-1" templateName="Bella Cucina" onClose={vi.fn()} />);
    await user.click(screen.getByText("A new site"));
    expect(screen.getByLabelText("Site name")).toBeInTheDocument();
  });

  // Fix round 1: associating the label must not restyle it (controller ruling).
  it("keeps the original body-sm, text-primary label", async () => {
    const user = userEvent.setup();
    render(<UseTemplateModal open templateId="tmpl-1" templateName="Bella Cucina" onClose={vi.fn()} />);
    await user.click(screen.getByText("A new site"));
    const label = document.querySelector(`label[for="${screen.getByLabelText("Site name").id}"]`) as HTMLElement;
    expect(label.className).toBe("mb-1.5 block text-body-sm font-medium");
    expect(label.style.color).toBe("var(--color-text-primary)");
  });
});

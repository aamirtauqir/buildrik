/**
 * A-12 (A12-7): TechnicalSeoSection had no error branch — a failed
 * siteDetail.settings.get query fell through the `isLoading` check to the
 * "loaded" branch with `settings.data` undefined, so the fields silently
 * rendered their empty defaults with Save enabled, instead of surfacing the
 * failure. Save also unconditionally sent all three fields on every submit,
 * so editing only "Allow indexing" re-saved canonicalUrl/robotsTxt from
 * their local `""` fallback and overwrote whatever was stored.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refetchMock = vi.fn();
const mutateMock = vi.fn();
let settingsState: {
  isLoading: boolean;
  isError: boolean;
  data?: { canonicalUrl: string | null; allowIndexing: boolean; robotsTxt: string | null };
  refetch: () => void;
} = { isLoading: false, isError: false, data: { canonicalUrl: "https://example.com", allowIndexing: true, robotsTxt: "" }, refetch: refetchMock };

vi.mock("@lib/trpc/client", () => ({
  trpc: {
    siteDetail: {
      settings: {
        get: { useQuery: () => settingsState },
        update: { useMutation: (opts: unknown) => ({ mutate: (input: unknown) => mutateMock(input, opts), isPending: false }) },
      },
    },
  },
}));

vi.mock("@/components/dashboard/toast-provider", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("@/components/editor-route/unified-flag", () => ({
  useUnifiedEditorFlag: () => false,
  getEditorHref: (id: string) => `/edit/${id}`,
}));

import { SeoTab } from "../seo-tab";

describe("TechnicalSeoSection", () => {
  beforeEach(() => {
    refetchMock.mockClear();
    mutateMock.mockClear();
    settingsState = { isLoading: false, isError: false, data: { canonicalUrl: "https://example.com", allowIndexing: true, robotsTxt: "" }, refetch: refetchMock };
  });

  it("shows an error state with retry instead of a silently-empty form", () => {
    settingsState = { isLoading: false, isError: true, refetch: refetchMock };
    render(<SeoTab site={{ id: "site-1" }} />);
    expect(screen.getByText("Couldn't load technical SEO settings")).toBeInTheDocument();
    expect(screen.queryByText("Save technical SEO")).not.toBeInTheDocument();
  });

  it("Save is disabled while there's no data to save", () => {
    settingsState = { isLoading: true, isError: false, refetch: refetchMock };
    render(<SeoTab site={{ id: "site-1" }} />);
    expect(screen.queryByText("Save technical SEO")).not.toBeInTheDocument();
  });

  it("sends only the field the user touched, not the other two", async () => {
    const user = userEvent.setup();
    render(<SeoTab site={{ id: "site-1" }} />);

    await user.click(screen.getByRole("switch", { name: "Allow search engines to index this site" }));
    await user.click(screen.getByText("Save technical SEO"));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    const [payload] = mutateMock.mock.calls[0];
    expect(payload).toEqual({ id: "site-1", allowIndexing: false });
  });
});

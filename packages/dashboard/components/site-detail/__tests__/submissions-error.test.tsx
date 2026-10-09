// @vitest-environment jsdom
/**
 * FG-032b (code half): a failed submissions read fell through to the table's
 * empty state — "No submissions found" — so an outage read as an empty inbox.
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const refetch = vi.fn();
vi.mock("@lib/trpc/client", () => ({
  trpc: {
    forms: {
      listSubmissions: { useQuery: () => ({ isLoading: false, isError: true, data: undefined, refetch }) },
      updateSubmission: { useMutation: () => ({ mutate: vi.fn() }) },
      deleteSubmission: { useMutation: () => ({ mutate: vi.fn() }) },
    },
    useUtils: () => ({ forms: { listSubmissions: { invalidate: vi.fn(), fetch: vi.fn() } } }),
  },
}));

import { SubmissionsPanel } from "../submissions-panel";

describe("SubmissionsPanel — read failed", () => {
  it("says the read failed and offers Retry, not 'No submissions found'", () => {
    render(<SubmissionsPanel siteId="s1" formBlocks={[{ id: "f1", name: "Contact", _count: { submissions: 3 } }]} />);
    expect(screen.queryByText("No submissions found")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Couldn't load submissions");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });
});

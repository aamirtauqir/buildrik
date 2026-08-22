/**
 * Which checklist a member actually sees.
 *
 * The component has always had two lists — a 7-item owner one and a 3-item
 * invited one — selected by a `variant` prop that no caller ever passed. So
 * every invited member got the owner list, including "Publish your site" and
 * "Invite a team member", which are not theirs to do. The service comment
 * ("invited-variant users finish via dismiss") described a branch that could
 * not be reached.
 *
 * The dashboard already knows the role — it picks its empty state off the same
 * value — so the component takes the role and decides for itself.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardChecklist } from "../dashboard-checklist";

vi.mock("@lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({ onboarding: { getState: { invalidate: vi.fn() } } }),
    onboarding: {
      completeDashboardTask: { useMutation: () => ({ mutate: vi.fn() }) },
      dismiss: { useMutation: () => ({ mutate: vi.fn() }) },
    },
  },
}));

describe("DashboardChecklist", () => {
  /** The panel opens collapsed, so the labels only exist once it is opened. */
  function expand() {
    fireEvent.click(screen.getByLabelText("Expand checklist"));
  }

  it("gives an owner the full list", () => {
    render(<DashboardChecklist memberRole="OWNER" />);
    expect(screen.getByText("0/7")).toBeTruthy();
    expand();
    expect(screen.getByText("Publish your site")).toBeTruthy();
  });

  it("gives an invited member the invited list, not the owner one", () => {
    render(<DashboardChecklist memberRole="EDITOR" />);
    expect(screen.getByText("0/3")).toBeTruthy();
    expand();
    expect(screen.queryByText("Publish your site")).toBeNull();
    expect(screen.getByText("Edit a page")).toBeTruthy();
  });

  it("treats an unknown role as invited rather than showing owner tasks", () => {
    render(<DashboardChecklist memberRole={undefined} />);
    expect(screen.getByText("0/3")).toBeTruthy();
  });
});

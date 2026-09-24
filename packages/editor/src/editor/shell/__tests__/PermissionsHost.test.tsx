// @vitest-environment jsdom
/**
 * The owner's Permissions dialog (5905:44701), its delete-site confirm
 * (5890:44728 / 5891:44701) and the screen the editor closes on (6881:86093).
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor, act } from "@testing-library/react";
import * as React from "react";

const deleteSite = vi.fn();
let role: string | null = "OWNER";
vi.mock("@/services/BuildrikSyncProvider", () => ({ deleteSite: (...a: unknown[]) => deleteSite(...a) }));
vi.mock("../hooks/useEditorRole", () => ({ useEditorRole: () => role }));

import { PermissionsHost } from "../PermissionsHost";
import { EVENTS } from "@/shared/constants/events";

afterEach(() => {
  cleanup();
  deleteSite.mockReset();
  role = "OWNER";
});

function composer() {
  const handlers: Record<string, (() => void)[]> = {};
  return {
    on: (e: string, fn: () => void) => (handlers[e] ||= []).push(fn),
    off: () => {},
    fire: (e: string) => act(() => handlers[e]?.forEach((f) => f())),
  };
}

describe("PermissionsHost", () => {
  it("⌘K opens the owner's dialog: every row allowed, Delete this site is the red door", () => {
    const c = composer();
    render(<PermissionsHost composer={c as never} siteId="s1" siteName="Bella Cucina" />);
    c.fire(EVENTS.UI_OPEN_PERMISSIONS);
    const modal = screen.getByTestId("permissions-modal");
    expect(modal).toHaveTextContent("Permissions — signed in as OWNER");
    expect(within(modal).queryAllByTestId("permissions-denied")).toHaveLength(0);
    expect(within(modal).getByTestId("permissions-delete-site")).toHaveTextContent("Delete this site");
  });

  it("an editor sees members and delete as denied, with the role they need", () => {
    role = "EDITOR";
    const c = composer();
    render(<PermissionsHost composer={c as never} siteId="s1" siteName="Bella Cucina" />);
    c.fire(EVENTS.UI_OPEN_PERMISSIONS);
    const denied = within(screen.getByTestId("permissions-modal")).getAllByTestId("permissions-denied");
    expect(denied.map((d) => d.textContent)).toEqual([
      expect.stringContaining("Only an admin can invite"),
      expect.stringContaining("Only the workspace owner can delete a site"),
    ]);
    expect(screen.queryByTestId("permissions-delete-site")).toBeNull();
  });

  it("Delete site arms only on DELETE, sends the site's name, and closes the editor on the deleted screen", async () => {
    deleteSite.mockResolvedValue(undefined);
    const c = composer();
    render(<PermissionsHost composer={c as never} siteId="s1" siteName="Bella Cucina" />);
    c.fire(EVENTS.UI_OPEN_PERMISSIONS);
    fireEvent.click(screen.getByTestId("permissions-delete-site"));
    expect(screen.getByText("Delete Bella Cucina?")).toBeInTheDocument();
    const confirm = screen.getByTestId("delete-site-confirm");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Click to type DELETE"), { target: { value: "DELETE" } });
    expect(screen.getByTestId("delete-site-armed")).toHaveTextContent("Confirmed — Delete site is enabled");
    fireEvent.click(confirm);
    await waitFor(() => expect(deleteSite).toHaveBeenCalledWith("s1", "Bella Cucina"));
    expect(await screen.findByTestId("site-deleted")).toHaveTextContent("Bella Cucina deleted");
  });

  it("a refused delete stays in the dialog and says why", async () => {
    deleteSite.mockRejectedValue(new Error("Site name does not match."));
    const c = composer();
    render(<PermissionsHost composer={c as never} siteId="s1" siteName="Bella Cucina" />);
    c.fire(EVENTS.UI_OPEN_PERMISSIONS);
    fireEvent.click(screen.getByTestId("permissions-delete-site"));
    fireEvent.change(screen.getByPlaceholderText("Click to type DELETE"), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByTestId("delete-site-confirm"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Site name does not match.");
    expect(screen.queryByTestId("site-deleted")).toBeNull();
  });
});

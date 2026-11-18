import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPermissionsDialog } from "../SettingsPermissionsDialog";

const fetchMyRole = vi.fn();
vi.mock("@/services/RoleService", () => ({ fetchMyRole: () => fetchMyRole() }));

describe("SettingsPermissionsDialog (2L9 B8-PM01–PM03)", () => {
  beforeEach(() => fetchMyRole.mockReset());

  it("checks the role, then lists minimum roles by settings area with the member's own marked", async () => {
    let answer!: (r: string) => void;
    fetchMyRole.mockReturnValue(new Promise((r) => (answer = r)));
    render(<SettingsPermissionsDialog open onClose={() => {}} />);
    expect(screen.getByTestId("set-perm-checking")).toHaveTextContent("Checking your access…");
    answer("EDITOR");
    expect(await screen.findByText("Your role: Editor. These are minimum roles for changing site settings.")).toBeInTheDocument();
    expect(screen.getByTestId("set-perm-rank-OWNER")).toHaveTextContent("OwnerDanger zone: archive, delete and transfer.");
    expect(screen.getByTestId("set-perm-rank-ADMIN")).toHaveTextContent(
      "AdminGeneral, Languages, SEO, Domains, Access, Custom code and Security headers.",
    );
    expect(screen.getByTestId("set-perm-rank-EDITOR")).toHaveTextContent("Editor · YouRedirects, Analytics and Form submissions.");
    expect(screen.getByTestId("set-perm-rank-VIEWER")).toHaveTextContent("ViewerNo Site settings access.");
    expect(screen.getByText("An Admin who created the site can also transfer it.")).toBeInTheDocument();
    expect(screen.getByTestId("set-perm-members")).toHaveAttribute("target", "_blank");
  });

  it("a failed check says nothing changed and Try again asks again", async () => {
    fetchMyRole.mockResolvedValueOnce(null).mockResolvedValueOnce("ADMIN");
    const onClose = vi.fn();
    render(<SettingsPermissionsDialog open onClose={onClose} />);
    expect(await screen.findByTestId("set-perm-failed")).toHaveTextContent(
      "Couldn’t check your access. Your permissions have not changed.",
    );
    fireEvent.click(screen.getByTestId("set-perm-retry"));
    expect(await screen.findByTestId("set-perm-rank-ADMIN")).toHaveTextContent("Admin · You");
    fireEvent.click(screen.getByTestId("set-perm-close"));
    expect(onClose).toHaveBeenCalled();
  });
});

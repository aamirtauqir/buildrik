/**
 * SA-06 / R1: the General save sends `slug` only when the user changed it.
 *
 * The slug rule got stricter (lowercase letters, numbers, single dashes). A
 * site whose slug predates that rule would otherwise fail validation on every
 * unrelated save — renaming the site, changing a favicon — because the form
 * always echoed the loaded slug back.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@lib/trpc/client", () => ({
  trpc: { upload: { presign: { useMutation: () => ({}) }, confirm: { useMutation: () => ({}) } } },
}));
vi.mock("@lib/hooks/use-unsaved-changes", () => ({ useUnsavedChanges: () => {} }));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
import { SettingsTab } from "../settings-tab";

const site = {
  id: "s1",
  name: "Legacy Site",
  slug: "Legacy_Slug",
  headCode: null,
  bodyCode: null,
  socialLinks: {},
  metaTitleTemplate: null,
  publishedPassword: null,
  hasPublishedPassword: false,
  touchIcon: null,
  favicon: null,
  plan: "PRO",
};

describe("SettingsTab — slug only on change", () => {
  it("omits slug when the user did not touch it", () => {
    const onSave = vi.fn();
    render(<SettingsTab site={site} onSave={onSave} />);
    fireEvent.click(screen.getByText("Save Changes"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("slug");
    expect(onSave.mock.calls[0][0]).toHaveProperty("name", "Legacy Site");
  });

  it("sends slug when the user changed it", () => {
    const onSave = vi.fn();
    render(<SettingsTab site={site} onSave={onSave} />);
    fireEvent.change(screen.getByDisplayValue("Legacy_Slug"), { target: { value: "legacy-slug" } });
    fireEvent.click(screen.getByText("Save Changes"));
    expect(onSave.mock.calls[0][0]).toHaveProperty("slug", "legacy-slug");
  });

  it("tells the user a slug change does not move the live site", () => {
    render(<SettingsTab site={site} onSave={vi.fn()} />);
    expect(screen.getByText("Names your site's address the first time you publish. Changing it later doesn't move your live site.")).toBeTruthy();
  });
});

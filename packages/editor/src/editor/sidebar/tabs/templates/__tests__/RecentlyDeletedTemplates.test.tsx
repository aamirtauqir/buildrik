// @vitest-environment jsdom
/**
 * Recently deleted saved templates (design-2l9 B6-T24…T33): restore brings the
 * template back and returns to the catalogue; a refused restore says so on the
 * row; permanent delete needs the exact name, then confirms.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";

const trash = vi.hoisted(() => ({ list: vi.fn(), restore: vi.fn(), purge: vi.fn(), remove: vi.fn() }));
vi.mock("@/services/TemplateTrashService", () => ({ templateTrash: trash }));

import { RecentlyDeletedTemplates } from "../components/RecentlyDeletedTemplates";

const ROW = { templateId: "user-1", name: "Fieldwork home", html: "<section></section>".repeat(7), deletedAt: new Date() };
const onBack = vi.fn();
const onRestored = vi.fn();
const mount = (canPurge = true) =>
  render(<RecentlyDeletedTemplates onBack={onBack} onRestored={onRestored} canPurge={canPurge} />, { wrapper: ToastProvider });

beforeEach(() => {
  vi.clearAllMocks();
  trash.list.mockResolvedValue({ ok: true, value: [ROW] });
});
afterEach(cleanup);

describe("RecentlyDeletedTemplates", () => {
  it("lists a deleted template with its window and size (B6-T24)", async () => {
    mount();
    expect(await screen.findByText("Fieldwork home")).toBeInTheDocument();
    expect(screen.getByText("Deleted today · 30 days left · 7 sections")).toBeInTheDocument();
    expect(screen.getByText("Saved page templates stay here for 30 days. Restoring keeps the original template identity.")).toBeInTheDocument();
    expect(screen.getByText("Permanent deletion needs Admin access and cannot be undone.")).toBeInTheDocument();
  });

  it("restore returns to the catalogue with a receipt (B6-T26)", async () => {
    trash.restore.mockResolvedValue({ ok: true, value: { id: "user-1" } });
    mount();
    fireEvent.click(await screen.findByTestId("tpl-trash-restore"));
    await waitFor(() => expect(onBack).toHaveBeenCalled());
    expect(onRestored).toHaveBeenCalled();
    expect(trash.restore).toHaveBeenCalledWith("user-1");
    expect(await screen.findByText("Fieldwork home restored")).toBeInTheDocument();
  });

  it("a refused restore keeps the row and says so (B6-T27)", async () => {
    trash.restore.mockResolvedValue({ ok: false, reason: "failed", message: "boom" });
    mount();
    fireEvent.click(await screen.findByTestId("tpl-trash-restore"));
    expect(await screen.findByTestId("tpl-trash-row-error")).toHaveTextContent("Couldn’t restore Fieldwork home. It is still in Recently deleted; try again.");
    expect(onBack).not.toHaveBeenCalled();
  });

  it("permanent delete needs the exact name, then the list empties (B6-T30…T33)", async () => {
    trash.purge.mockResolvedValue({ ok: true, value: { success: true } });
    mount();
    fireEvent.click(await screen.findByTestId("tpl-trash-purge"));
    expect(screen.getByText("Delete Fieldwork home permanently?")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Delete permanently" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByTestId("tpl-trash-purge-input"), { target: { value: "Fieldwork home" } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(await screen.findByText("No recently deleted templates")).toBeInTheDocument();
    expect(trash.purge).toHaveBeenCalledWith("user-1", "Fieldwork home");
    expect(screen.getByText("Fieldwork home permanently deleted. Existing pages are unchanged.")).toBeInTheDocument();
  });

  it("below Admin the permanent delete is unavailable", async () => {
    mount(false);
    expect(await screen.findByTestId("tpl-trash-purge")).toBeDisabled();
  });
});

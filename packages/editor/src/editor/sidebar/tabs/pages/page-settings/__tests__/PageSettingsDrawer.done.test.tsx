// @vitest-environment jsdom
/**
 * C4 #20 — page settings save on Done, not on a 500 ms autosave (boards
 * 6887:73809 / 73848 / 73882 foot: Cancel · Done; 6887:73801 "Page settings
 * saved"). Edits across SEO / Social / Advanced are one form: switching tabs
 * keeps them (no discard prompt), Done writes them once and closes with the
 * toast, Cancel throws them away and closes. The autosave and the Retry row
 * are gone; a failed Done keeps the dialog open with the edits.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ToastProvider } from "@/editor/chrome-ui";
import { PageSettingsDrawer } from "../PageSettingsDrawer";
import type { PageItem } from "../../types";

const page: PageItem = { id: "p1", name: "Menu", slug: "menu", isHome: false };

function mount(updatePage = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  const composer = { elements: { updatePage }, getProjectMetadata: () => ({}) } as never;
  render(
    <ToastProvider>
      <PageSettingsDrawer page={page} allPages={[page]} composer={composer} onClose={onClose} />
    </ToastProvider>,
  );
  return { onClose, updatePage };
}

const editTitle = (v = "Menu — Bella Cucina") =>
  fireEvent.change(screen.getByLabelText("Meta title"), { target: { value: v } });

afterEach(() => vi.useRealTimers());

describe("PageSettingsDrawer — Done / Cancel", () => {
  it("draws Cancel and Done in the foot", () => {
    mount();
    const foot = screen.getByTestId("pg-drawer-foot");
    expect(foot).toHaveTextContent("Cancel");
    expect(foot).toHaveTextContent("Done");
  });

  it("does not autosave — an edit left alone writes nothing", () => {
    vi.useFakeTimers();
    const { updatePage } = mount();
    editTitle();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(updatePage).not.toHaveBeenCalled();
  });

  it("switching tabs keeps the edit — no discard prompt", () => {
    mount();
    editTitle();
    fireEvent.click(screen.getByTestId("pg-drawer-tabbtn-social"));
    expect(screen.queryByTestId("pages-unsaved-modal")).toBeNull();
    fireEvent.click(screen.getByTestId("pg-drawer-tabbtn-seo"));
    expect(screen.getByLabelText("Meta title")).toHaveValue("Menu — Bella Cucina");
  });

  it("Done saves once, closes, and toasts Page settings saved", async () => {
    const { onClose, updatePage } = mount();
    editTitle();
    fireEvent.click(screen.getByTestId("pg-drawer-done"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(updatePage).toHaveBeenCalledTimes(1);
    expect(updatePage.mock.calls[0][1].settings.seo.metaTitle).toBe("Menu — Bella Cucina");
    expect(await screen.findByText("Page settings saved")).toBeInTheDocument();
  });

  it("Done on a clean form just closes", () => {
    const { onClose, updatePage } = mount();
    fireEvent.click(screen.getByTestId("pg-drawer-done"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(updatePage).not.toHaveBeenCalled();
  });

  it("Cancel discards and closes without asking", () => {
    const { onClose, updatePage } = mount();
    editTitle();
    fireEvent.click(screen.getByTestId("pg-drawer-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(updatePage).not.toHaveBeenCalled();
    expect(screen.queryByTestId("pages-unsaved-modal")).toBeNull();
  });

  it("a failed Done keeps the dialog and the edit, with no Retry row", async () => {
    const { onClose } = mount(vi.fn().mockRejectedValue(new Error("boom")));
    editTitle();
    fireEvent.click(screen.getByTestId("pg-drawer-done"));
    expect(await screen.findByText("Save failed — your changes are still here.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Meta title")).toHaveValue("Menu — Bella Cucina");
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });
});

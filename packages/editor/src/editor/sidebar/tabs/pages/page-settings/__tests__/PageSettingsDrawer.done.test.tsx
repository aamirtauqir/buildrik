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
import type { PageItem } from "@/editor/sidebar/tabs/pages/types";

const page: PageItem = { id: "p1", name: "Menu", slug: "menu", isHome: false };

function mount(updatePage = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  const emit = vi.fn();
  const composer = { elements: { updatePage }, emit, getProjectMetadata: () => ({ name: "Bella Cucina" }) } as never;
  render(
    <ToastProvider>
      <PageSettingsDrawer page={page} allPages={[page]} composer={composer} onClose={onClose} />
    </ToastProvider>,
  );
  return { onClose, updatePage, emit };
}

const editTitle = (v = "Menu — Bella Cucina") =>
  fireEvent.change(screen.getByTestId("seo-input-title"), { target: { value: v } });

afterEach(() => vi.useRealTimers());

describe("PageSettingsDrawer — subtitle", () => {
  // re-baseline: page settings subtitle — 94:29621 for the page on the canvas, 63:15939 for another.
  it("says page appearance stays in the Inspector for the page on the canvas, and names the canvas page otherwise", () => {
    const composer = { elements: { updatePage: vi.fn() }, emit: vi.fn(), getProjectMetadata: () => ({}) } as never;
    const home: PageItem = { id: "h", name: "Home", slug: "home", isHome: true, isActive: true };
    const { rerender } = render(
      <ToastProvider>
        <PageSettingsDrawer page={home} allPages={[home, page]} composer={composer} onClose={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.getByTestId("pg-drawer-subtitle")).toHaveTextContent("Editing Home · Page appearance stays in the Inspector");
    rerender(
      <ToastProvider>
        <PageSettingsDrawer page={page} allPages={[home, page]} composer={composer} onClose={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.getByTestId("pg-drawer-subtitle")).toHaveTextContent("Editing Menu · Home stays open on the canvas");
  });
});

describe("PageSettingsDrawer — Done / Cancel", () => {
  /* design-2l9 board 63:15939: "{Page} · Page settings", "Editing {Page}",
     Cancel · Save. Re-baseline: page settings copy. */
  it("titles the page and draws Cancel and Save in the foot", () => {
    mount();
    expect(screen.getByTestId("pg-drawer-title")).toHaveTextContent("Menu · Page settings");
    expect(screen.getByTestId("pg-drawer-subtitle")).toHaveTextContent(/^Editing Menu/);
    const foot = screen.getByTestId("pg-drawer-foot");
    expect(foot).toHaveTextContent("Cancel");
    expect(foot).toHaveTextContent("Save");
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
    expect(screen.getByTestId("seo-input-title")).toHaveValue("Menu — Bella Cucina");
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

  // re-baseline: page settings Save — 94:29621 draws it disabled with nothing to save.
  it("Save is disabled on a clean form and wakes with an edit", () => {
    mount();
    expect(screen.getByTestId("pg-drawer-done")).toBeDisabled();
    editTitle();
    expect(screen.getByTestId("pg-drawer-done")).not.toBeDisabled();
  });

  it("Cancel discards and closes without asking", () => {
    const { onClose, updatePage } = mount();
    editTitle();
    fireEvent.click(screen.getByTestId("pg-drawer-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(updatePage).not.toHaveBeenCalled();
    expect(screen.queryByTestId("pages-unsaved-modal")).toBeNull();
  });

  /* design-2l9 board 63:18189. */
  it("a failed save keeps the dialog and the edit, says so inline, and offers Retry save", async () => {
    const { onClose } = mount(vi.fn().mockRejectedValue(new Error("boom")));
    editTitle();
    fireEvent.click(screen.getByTestId("pg-drawer-done"));
    expect(await screen.findByTestId("pg-drawer-save-error")).toHaveTextContent("Couldn’t save page settings. Your changes are still here.");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("seo-input-title")).toHaveValue("Menu — Bella Cucina");
    expect(screen.getByTestId("pg-drawer-done")).toHaveTextContent("Retry save");
    expect(screen.getByTestId("pg-drawer-subtitle")).toHaveTextContent("Menu · Unsaved settings changes");
  });

  /* 6887:73801: the saved toast carries Manage pages. */
  it("the saved toast offers Manage pages, which opens the Pages panel", async () => {
    const { emit } = mount();
    editTitle();
    fireEvent.click(screen.getByTestId("pg-drawer-done"));
    const action = await screen.findByRole("button", { name: "Manage pages" });
    fireEvent.click(action);
    expect(emit).toHaveBeenCalledWith("panel:open", { panel: "pages" });
  });

  /* 6887:73809: the SEO form's note and its "Site SEO defaults ›" door. */
  it("SEO names what the overrides affect; Site SEO defaults closes and opens Settings › SEO", () => {
    const { onClose, emit } = mount();
    expect(screen.getByTestId("seo-override-note")).toHaveTextContent("These overrides affect this page only. Clear the title to use site defaults.");
    fireEvent.click(screen.getByTestId("seo-site-defaults"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith("ui:settings-open", { screen: "seo" });
  });

  it("with an unsaved edit, Site SEO defaults asks first; Discard closes and goes", () => {
    const { onClose, emit } = mount();
    editTitle();
    fireEvent.click(screen.getByTestId("seo-site-defaults"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("pages-unsaved-discard"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith("ui:settings-open", { screen: "seo" });
  });

  it("closing with an unsaved edit: Save and leave saves once, then closes", async () => {
    const { onClose, updatePage } = mount();
    editTitle();
    fireEvent.click(screen.getByTestId("pg-drawer-close"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("pages-unsaved-save"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(updatePage).toHaveBeenCalledTimes(1);
  });

  it("Search indexing is on the SEO form and drives the same switch", () => {
    mount();
    const sel = screen.getByTestId("seo-input-indexing") as HTMLSelectElement;
    expect(sel.value).toBe("index");
    fireEvent.change(sel, { target: { value: "noindex" } });
    expect(sel.value).toBe("noindex");
  });
});

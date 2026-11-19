// @vitest-environment jsdom
/**
 * The return to Pages with unsaved settings — design-2l9 boards 63:18758 (ask),
 * 101:23017 (saving), 101:23620 (rejected), 101:28183 (navigation cancelled,
 * save continues), 109:32246 (invalid URL) and 101:24836 (return pending while
 * the URL is fixed). Every state is the real save's: the composer's own
 * updatePage promise drives it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ToastProvider } from "@/editor/chrome-ui";
import { PageSettingsDrawer } from "../PageSettingsDrawer";
import type { PageItem } from "@/editor/sidebar/tabs/pages/types";

const about: PageItem = { id: "a", name: "About", slug: "about", isHome: false };
const home: PageItem = { id: "h", name: "Home", slug: "home", isHome: true, isActive: true };

function mount() {
  const pending: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];
  const updatePage = vi.fn(() => new Promise<void>((resolve, reject) => pending.push({ resolve, reject })));
  const composer = { elements: { exportPages: () => [], updatePage }, on: () => undefined, off: () => undefined, emit: vi.fn(), getProjectMetadata: () => ({}) } as never;
  const onClose = vi.fn();
  render(
    <ToastProvider>
      <PageSettingsDrawer page={about} allPages={[home, about]} composer={composer} onClose={onClose} />
    </ToastProvider>,
  );
  fireEvent.change(screen.getByTestId("seo-input-title"), { target: { value: "About Fieldwork — independent design studio" } });
  return { onClose, pending };
}

describe("page settings — return to Pages with unsaved settings", () => {
  it("Save and leave shows the save in flight, then leaves when it lands", async () => {
    const { onClose, pending } = mount();
    fireEvent.click(screen.getByTestId("pg-drawer-close"));
    expect(screen.getByTestId("pages-unsaved-title")).toHaveTextContent("Leave without saving?");
    fireEvent.click(screen.getByTestId("pages-unsaved-save"));
    expect(screen.getByTestId("pages-unsaved-title")).toHaveTextContent("Saving About settings…");
    expect(screen.getByTestId("pages-unsaved-body")).toHaveTextContent("After saving, return to Pages. Home will stay open.");
    expect(screen.getByTestId("pages-unsaved-saving")).toBeDisabled();
    await act(async () => pending[0].resolve());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a rejected save keeps the draft and offers Retry save and leave", async () => {
    const { onClose, pending } = mount();
    fireEvent.click(screen.getByTestId("pg-drawer-close"));
    fireEvent.click(screen.getByTestId("pages-unsaved-save"));
    await act(async () => pending[0].reject(new Error("rejected")));
    expect(screen.getByTestId("pages-unsaved-title")).toHaveTextContent("Couldn’t save About settings");
    expect(screen.getByTestId("pages-unsaved-note")).toHaveTextContent("The server rejected this save.");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("pages-unsaved-save")).toHaveTextContent("Retry save and leave");
    fireEvent.click(screen.getByTestId("pages-unsaved-save"));
    await act(async () => pending[1].resolve());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Cancel navigation stops the leaving, not the save", async () => {
    const { onClose, pending } = mount();
    fireEvent.click(screen.getByTestId("pg-drawer-close"));
    fireEvent.click(screen.getByTestId("pages-unsaved-save"));
    fireEvent.click(screen.getByTestId("pages-unsaved-cancel-nav"));
    expect(screen.queryByTestId("pages-unsaved-modal")).toBeNull();
    /* 101:28183: the form says the save runs on and the dialog stays. */
    expect(screen.getByTestId("pg-drawer-subtitle")).toHaveTextContent("About · Saving settings… · Navigation cancelled");
    expect(screen.getByTestId("pg-drawer-stay-note")).toHaveTextContent("When this save finishes, you’ll stay in About settings.");
    expect(screen.getByTestId("pg-drawer-cancel")).toBeDisabled();
    expect(document.getElementById("seo-slug")).toBeDisabled();
    await act(async () => pending[0].resolve());
    expect(screen.queryByTestId("pg-drawer-stay-note")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("an invalid URL offers Fix page URL, then keeps the return pending in the form", () => {
    mount();
    fireEvent.change(document.getElementById("seo-slug") as HTMLInputElement, { target: { value: "" } });
    fireEvent.click(screen.getByTestId("pg-drawer-close"));
    expect(screen.getByTestId("pages-unsaved-body")).toHaveTextContent("About has unsaved page settings and an empty page URL. Closing returns to Pages; Home stays open.");
    fireEvent.click(screen.getByTestId("pages-unsaved-fix-url"));
    expect(screen.getByTestId("pg-drawer-return-note")).toHaveTextContent("After saving: return to Pages · Home stays open");
    expect(screen.getByTestId("pg-drawer-save-leave")).toBeDisabled();
    fireEvent.click(screen.getByTestId("pg-drawer-cancel-nav"));
    expect(screen.getByTestId("pg-drawer-done")).toBeInTheDocument();
  });
});

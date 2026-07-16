/**
 * CollectionSetupModal — the "Set Up Products Collection" prompt shown when an
 * e-commerce block is first dropped.
 *
 * SPEC-vs-ACTUAL: the brief described "8 fields, 3 samples". The shipped modal
 * has NO form fields for those — "8 product fields" and "3 example products"
 * are static feature-list COPY. The only real input is a single sample-data
 * checkbox, and the collection is created entirely through the onConfirm
 * callback (ProductCollectionService is not imported here — integration is the
 * callback contract). These tests pin that actual behavior, including the
 * retry-on-error path (modal stays open, onError surfaces the rejection).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/editor/shared/vibcoder";
import { CollectionSetupModal } from "../CollectionSetupModal";

function renderModal(props: Partial<React.ComponentProps<typeof CollectionSetupModal>> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const onError = vi.fn();
  const onSkip = vi.fn();
  render(
    <ToastProvider>
      <CollectionSetupModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        onError={onError}
        onSkip={onSkip}
        {...props}
      />
    </ToastProvider>
  );
  return { onClose, onConfirm, onError, onSkip };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CollectionSetupModal — render", () => {
  it("renders the title, description and both action buttons when open", () => {
    renderModal();
    expect(screen.getByText("Set Up Products Collection")).toBeTruthy();
    expect(screen.getByText(/E-commerce blocks require a Products collection/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create Collection" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeTruthy();
  });

  it("does not render the dialog body when closed", () => {
    render(
      <ToastProvider>
        <CollectionSetupModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />
      </ToastProvider>
    );
    expect(screen.queryByText("Set Up Products Collection")).toBeNull();
  });

  it("pins the static feature-list copy (8 fields / 3 samples are descriptive, not inputs)", () => {
    renderModal();
    expect(screen.getByText(/8 product fields/i)).toBeTruthy();
    expect(screen.getByText(/Add 3 example products/i)).toBeTruthy();
    expect(screen.getByText(/Validation rules included/i)).toBeTruthy();
    expect(screen.getByText(/Ready for CMS data binding/i)).toBeTruthy();
    // The only actual form control is a single checkbox
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("defaults the sample-products checkbox to checked", () => {
    renderModal();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  });
});

describe("CollectionSetupModal — confirm", () => {
  it("creates the collection WITH sample data by default and closes on success", async () => {
    const { onConfirm, onClose } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));

    expect(onConfirm).toHaveBeenCalledWith(true);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("creates the collection WITHOUT sample data when the checkbox is unchecked", async () => {
    const { onConfirm } = renderModal();
    fireEvent.click(screen.getByRole("checkbox"));
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it("shows a pending 'Creating…' state and disables both buttons while onConfirm is in flight", async () => {
    let resolveConfirm: () => void = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolveConfirm = res;
        })
    );
    renderModal({ onConfirm });

    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));

    const creating = await screen.findByRole("button", { name: "Creating..." });
    expect((creating as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Skip for now" }) as HTMLButtonElement).disabled).toBe(
      true
    );

    resolveConfirm();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Creating..." })).toBeNull()
    );
  });
});

describe("CollectionSetupModal — retry on error", () => {
  it("surfaces the rejection via onError and keeps the modal open (no onClose) so the user can retry", async () => {
    const err = new Error("collection creation failed");
    const onConfirm = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce(undefined);
    const { onError, onClose } = renderModal({ onConfirm });

    // First attempt fails
    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(err));
    expect(onClose).not.toHaveBeenCalled();

    // Button is re-enabled (back to idle label) so a retry is possible
    const retryBtn = await screen.findByRole("button", { name: "Create Collection" });
    expect((retryBtn as HTMLButtonElement).disabled).toBe(false);

    // Second attempt succeeds → modal closes
    fireEvent.click(retryBtn);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("falls back to console.error when onConfirm rejects and no onError handler is wired", async () => {
    const err = new Error("no handler");
    const onConfirm = vi.fn().mockRejectedValue(err);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onClose = vi.fn();
    render(
      <ToastProvider>
        <CollectionSetupModal isOpen onClose={onClose} onConfirm={onConfirm} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("CollectionSetupModal — skip", () => {
  it("fires onSkip then onClose without creating anything", () => {
    const { onSkip, onClose, onConfirm } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

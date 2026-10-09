/**
 * Toast — layering contract (EDT-017).
 *
 * Toasts float above the chrome, but never above an open modal: a sync toast
 * once sat on the Publish confirm's Cancel (elementFromPoint at Cancel
 * returned the toast). While any aria-modal dialog is open the viewport drops
 * below the modal scrim's tier; it returns to the toast tier when the modal
 * closes.
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, act, cleanup, waitFor } from "@testing-library/react";
import React from "react";
import { OverlayMount, ToastProvider, useToast } from "../index";

let api!: ReturnType<typeof useToast>;
function Grab() {
  api = useToast();
  return null;
}

function App({ modalOpen }: { modalOpen: boolean }) {
  return (
    <ToastProvider>
      <Grab />
      <OverlayMount open={modalOpen} onClose={() => {}} ariaLabel="Confirm publish">
        <div>Cancel</div>
      </OverlayMount>
    </ToastProvider>
  );
}

const TOAST_TIER = "tw:z-[var(--bk-z-toast)]";
const UNDER_MODAL_TIER = "tw:z-[var(--bk-z-popover)]";
/* OverlayMount's scrim: z 50, the --bk-z-overlay tier. */
const SCRIM_TIER = "tw:z-50";

function zToken(name: string): number {
  const css = readFileSync(resolve(__dirname, "../../../themes/tokens.generated.css"), "utf8");
  const m = css.match(new RegExp(`--bk-z-${name}:\\s*(\\d+)`));
  if (!m) throw new Error(`--bk-z-${name} missing`);
  return Number(m[1]);
}

afterEach(() => {
  cleanup();
});

describe("Toast layering", () => {
  it("the tiers order as: under-modal toast < scrim (50) < modal < toast", () => {
    expect(zToken("popover")).toBeLessThan(50);
    expect(zToken("overlay")).toBe(50);
    expect(zToken("modal")).toBeGreaterThan(50);
    expect(zToken("toast")).toBeGreaterThan(zToken("modal"));
  });

  it("sits on the toast tier with no modal open", () => {
    render(<App modalOpen={false} />);
    act(() => {
      api.addToast({ tone: "error", description: "Some work never reached the server" });
    });
    const viewport = screen.getByTestId("toast-viewport");
    expect(viewport.className).toContain(TOAST_TIER);
    expect(viewport.dataset.underModal).toBeUndefined();
  });

  it("drops below the modal scrim while a modal is open, and comes back when it closes", async () => {
    const { rerender } = render(<App modalOpen={false} />);
    act(() => {
      api.addToast({ tone: "error", description: "Some work never reached the server" });
    });
    rerender(<App modalOpen />);
    expect(screen.getByTestId("overlay-scrim").className).toContain(SCRIM_TIER);
    await waitFor(() => expect(screen.getByTestId("toast-viewport").dataset.underModal).toBe("true"));
    expect(screen.getByTestId("toast-viewport").className).toContain(UNDER_MODAL_TIER);
    expect(screen.getByTestId("toast-viewport").className).not.toContain(TOAST_TIER);

    rerender(<App modalOpen={false} />);
    await waitFor(() => expect(screen.getByTestId("toast-viewport").dataset.underModal).toBeUndefined());
    expect(screen.getByTestId("toast-viewport").className).toContain(TOAST_TIER);
  });

  it("a toast fired while a modal is already open starts below it", async () => {
    render(<App modalOpen />);
    act(() => {
      api.addToast({ tone: "error", description: "Couldn't save" });
    });
    await waitFor(() => expect(screen.getByTestId("toast-viewport").dataset.underModal).toBe("true"));
  });
});

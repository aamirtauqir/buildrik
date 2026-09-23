/**
 * BrandWorkspace — the auto-draft survives a reload (decision #28).
 *
 * QA 2026-09-24: an unsaved edit + reload came back as the saved value with
 * no draft and no prompt. A remount over a fresh registry provider is the
 * reload: the only thing that carries over is localStorage.
 *
 * @license BSD-3-Clause
 */
import { fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { brandDraftKey } from "../useBrandDraft";
import { installDomShims, makeFakeComposer, renderOnRadius } from "./brandWorkspaceHarness";

beforeEach(installDomShims);

describe("BrandWorkspace — auto-draft across a reload", () => {
  it("a staged edit is written to the draft store and staged again on the next load", async () => {
    const first = await renderOnRadius(makeFakeComposer());
    fireEvent.change(first.radiusInput, { target: { value: "10px" } });
    await waitFor(() => expect(first.getByText("Unsaved brand changes")).toBeTruthy());
    await waitFor(() => expect(localStorage.getItem(brandDraftKey(undefined))).toMatch(/10px/));
    first.unmount();

    const second = await renderOnRadius(makeFakeComposer());
    await waitFor(() => expect(second.radiusInput.value).toBe("10px"));
    expect(second.getByText("Unsaved brand changes")).toBeTruthy();
  });

  it("Discard empties the draft store, so a reload comes back clean", async () => {
    const utils = await renderOnRadius(makeFakeComposer());
    fireEvent.change(utils.radiusInput, { target: { value: "10px" } });
    await waitFor(() => expect(localStorage.getItem(brandDraftKey(undefined))).not.toBeNull());
    fireEvent.click(utils.getByTestId("brand-save-bar-discard"));
    await waitFor(() => expect(localStorage.getItem(brandDraftKey(undefined))).toBeNull());
  });
});

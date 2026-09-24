/**
 * Spacing › header ⋯ menu — "Apply preset" (Compact · Normal · Spacious) and
 * "Reset to defaults". Owner ruling 2026-09-24: the capability removed for
 * board parity (91ab74b33) comes back inside a menu, no chips on the page.
 *
 * @license BSD-3-Clause
 */
import { fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { installDomShims, makeFakeComposer, openPage, renderWorkspace } from "./brandWorkspaceHarness";

beforeEach(installDomShims);

describe("BrandWorkspace — Spacing presets menu", () => {
  it("draws no preset chips; the ⋯ menu applies a whole preset and stages it", async () => {
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "spacing");
    expect(utils.queryByTestId("spacing-presets")).toBeNull();

    fireEvent.click(utils.getByTestId("brand-spacing-menu"));
    const normal = utils.getByTestId("spacing-preset-normal");
    expect(normal.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(utils.getByTestId("spacing-preset-spacious"));

    await waitFor(() => expect(utils.getByTestId("brand-token-value-space-1").textContent).toBe("6px"));
    expect(utils.getByText("Unsaved brand changes")).toBeTruthy();

    fireEvent.click(utils.getByTestId("brand-spacing-menu"));
    expect(utils.getByTestId("spacing-preset-spacious").getAttribute("aria-checked")).toBe("true");
    fireEvent.click(utils.getByTestId("spacing-reset-defaults"));
    await waitFor(() => expect(utils.getByTestId("brand-token-value-space-1").textContent).toBe("4px"));
  });

  it("the menu is Spacing's only — a kind page has none", () => {
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "spacing");
    fireEvent.change(utils.getByTestId("brand-kind-switch"), { target: { value: "kind-imagery" } });
    expect(utils.queryByTestId("brand-spacing-menu")).toBeNull();
  });
});

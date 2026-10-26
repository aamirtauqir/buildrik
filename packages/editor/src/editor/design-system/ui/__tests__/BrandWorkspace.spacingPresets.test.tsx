/**
 * Spacing presets — 2L9 B6-B22: Compact · Normal · Spacious as one segmented
 * control, then "Reset to defaults", over the note "Spacing steps can be
 * changed but not renamed or deleted." Each action is one write. (Owner
 * ruling 2026-09-24 brought preset apply back; the board now draws it on the
 * page instead of the old ⋯ menu.)
 *
 * @license BSD-3-Clause
 */
import { fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { installDomShims, makeFakeComposer, openPage, renderWorkspace } from "./brandWorkspaceHarness";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";

beforeEach(installDomShims);

describe("BrandWorkspace — Spacing presets (B6-B22)", () => {
  it("the segmented control applies a whole preset in one write and shows which is on", async () => {
    const composer = makeFakeComposer();
    const utils = renderWorkspace(composer);
    openPage(utils, "spacing");
    expect(utils.getByTestId("brand-spacing-note").textContent).toBe("Spacing steps can be changed but not renamed or deleted.");
    const seg = utils.getByTestId("brand-spacing-presets");
    expect([...seg.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["Compact", "Normal", "Spacious"]);
    expect(utils.getByTestId("spacing-preset-normal").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(utils.getByTestId("spacing-preset-spacious"));
    await waitFor(() => expect(utils.getByTestId("brand-token-value-space-1").textContent).toBe("6px"));
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(resolveTokenLiteral(composer.settings.designTokens as DesignToken[], "space-12", "light")).toBe("64px");
    expect(utils.getByTestId("spacing-preset-spacious").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(utils.getByTestId("spacing-reset-defaults"));
    await waitFor(() => expect(utils.getByTestId("brand-token-value-space-1").textContent).toBe("4px"));
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(2);
  });

  it("the presets are Spacing's only — a kind page has none", () => {
    const utils = renderWorkspace(makeFakeComposer());
    openPage(utils, "kind-imagery");
    expect(utils.queryByTestId("brand-spacing-presets")).toBeNull();
  });
});

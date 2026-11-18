/**
 * Other kinds rows — 2L9 B6-B24 / B25 / B54 / B55: the value edits in place
 * (an invalid one stays in the field with the kind's message, nothing is
 * written), ⋯ → Rename (inline) · Delete… / Reset to default.
 *
 * @license BSD-3-Clause
 */
import { fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";
import { installDomShims, makeFakeComposer, openPage, renderWorkspace } from "./brandWorkspaceHarness";

beforeEach(installDomShims);

async function onRadius() {
  const composer = makeFakeComposer();
  const utils = renderWorkspace(composer);
  openPage(utils, "kind-radius");
  await waitFor(() => utils.getByTestId("brand-token-value-radius-sm"));
  return { composer, utils };
}

describe("Other kinds rows (B6-B24…B55)", () => {
  it("a length edits in place and writes once on Enter", async () => {
    const { composer, utils } = await onRadius();
    fireEvent.click(utils.getByRole("button", { name: "Edit radius-sm value" }));
    const field = utils.getByTestId("brand-token-value-input-radius-sm") as HTMLInputElement;
    fireEvent.change(field, { target: { value: "6px" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(resolveTokenLiteral(composer.settings.designTokens as DesignToken[], "radius-sm", "light")).toBe("6px");
    expect(utils.queryByTestId("brand-token-value-input-radius-sm")).toBeNull();
  });

  it("an invalid length stays in the field with the board's message; nothing is written", async () => {
    const { composer, utils } = await onRadius();
    fireEvent.click(utils.getByRole("button", { name: "Edit radius-sm value" }));
    const field = utils.getByTestId("brand-token-value-input-radius-sm") as HTMLInputElement;
    fireEvent.change(field, { target: { value: "8 px round" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(utils.getByTestId("brand-token-value-error-radius-sm").textContent).toBe("Use a length such as 8px or 0.5rem. Nothing was changed.");
    expect(field.value).toBe("8 px round");
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: "Escape" });
    expect(utils.queryByTestId("brand-token-value-error-radius-sm")).toBeNull();
  });

  it("⋯ offers Rename and, for a seed token, Reset to default in Delete's place", async () => {
    const { utils } = await onRadius();
    fireEvent.click(utils.getByTestId("brand-kind-row-menu-radius-sm"));
    expect(utils.getByTestId("brand-kind-row-rename-radius-sm").textContent).toBe("Rename");
    expect(utils.getByTestId("brand-kind-row-reset-radius-sm").textContent).toBe("Reset to default");
  });

  it("Rename is inline: the help line, Esc cancels, a bad id is refused in place", async () => {
    const { composer, utils } = await onRadius();
    fireEvent.click(utils.getByTestId("brand-kind-row-menu-radius-sm"));
    fireEvent.click(utils.getByTestId("brand-kind-row-rename-radius-sm"));
    const field = utils.getByTestId("brand-token-rename-input-radius-sm") as HTMLInputElement;
    expect(utils.getByTestId("brand-token-rename-help-radius-sm").textContent).toMatch(
      /^Enter to rename · Esc to cancel\. References update automatically; \d+ places? keeps? their look\.$/,
    );
    fireEvent.change(field, { target: { value: "Bad Id" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(utils.getByTestId("brand-token-rename-help-radius-sm").textContent).toBe("Use lower-case letters, numbers, dots and dashes.");
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: "Escape" });
    expect(utils.queryByTestId("brand-token-rename-input-radius-sm")).toBeNull();
  });
});

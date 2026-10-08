// @vitest-environment jsdom
/**
 * The Brand workspace's doors into Part 1c's flows: the colour scale generator
 * (BRP1-M9) from the Colours page and from a token card, for any semantic
 * colour (OQ-3).
 */
import { fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { installDomShims, makeFakeComposer, renderWorkspace } from "./brandWorkspaceHarness";

beforeEach(() => installDomShims());

describe("BrandWorkspace › Colour scale generator (BRP1-M9)", () => {
  it("Colours' 'Generate colour scale' opens the generator for Primary, Colours stays current", () => {
    const composer = makeFakeComposer(DEFAULT_TOKENS);
    const u = renderWorkspace(composer);
    act(() => { fireEvent.click(u.getByTestId("brand-generate-scale")); });
    expect(u.getByTestId("brand-page-title").textContent).toBe("Colour scale generator");
    expect(u.getByTestId("brand-row-colours").getAttribute("aria-current")).toBe("page");
    expect((u.getByTestId("brand-scale-input") as HTMLInputElement).value.toUpperCase()).toBe("#1A56DB");
  });

  it("a semantic colour's card menu opens the generator for that token", () => {
    const composer = makeFakeComposer(DEFAULT_TOKENS);
    const u = renderWorkspace(composer);
    const success = u.queryByTestId("brand-token-name-color-success");
    if (!success) throw new Error("no success row");
    act(() => { fireEvent.click(success); });
    act(() => { fireEvent.click(u.getByTestId("brand-token-menu")); });
    act(() => { fireEvent.click(u.getByTestId("brand-token-action-scale")); });
    expect(u.getByTestId("brand-page-title").textContent).toBe("Colour scale generator");
    expect((u.getByTestId("brand-scale-input") as HTMLInputElement).value).toBe(resolveTokenLiteral(DEFAULT_TOKENS, "color-success", "light"));
  });
});

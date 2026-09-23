/**
 * Rename token — C5 G3-137. A window.prompt became a dialog; a rename the
 * registry cannot perform is offered disabled, not as a silent no-op.
 */
import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { TokenDetailView } from "../TokenDetailView";
import { renameError } from "../TokenRenameDialog";
import { DSModeProvider } from "../../../state/DSModeContext";
import type { DesignToken } from "../../../types";

const token = { id: "color-primary", name: "Primary", value: "#1A56DB", category: "colors", cssVar: "--x", type: "color", kind: "color" } as DesignToken;
const other = { ...token, id: "color-text", name: "Text" } as DesignToken;
const composer = {
  designSystem: {
    tokenUsage: { getUsage: () => 3, getBreakdown: () => [{ elementId: "a", styleProp: "color" }, { elementId: "b", styleProp: "color" }, { elementId: "c", styleProp: "color" }], on: vi.fn(), off: vi.fn() },
    lintState: { getVisibleIssues: () => [], on: vi.fn(), off: vi.fn() },
  },
} as never;

const openRename = (onRename?: (a: string, b: string) => void) => {
  const utils = render(
    <DSModeProvider initialMode="pro">
      <TokenDetailView token={token} composer={composer} allTokens={[token, other]} onRename={onRename} />
    </DSModeProvider>,
  );
  fireEvent.click(utils.getByTestId("brand-token-menu"));
  return utils;
};

describe("Rename token (G3-137)", () => {
  it("opens a dialog, not a browser prompt, with the current id and the usage it carries", () => {
    const prompt = vi.spyOn(window, "prompt");
    openRename(vi.fn());
    fireEvent.click(screen.getByTestId("brand-token-action-rename"));
    expect(prompt).not.toHaveBeenCalled();
    expect(screen.getByTestId("brand-token-rename-current").textContent).toBe("color-primary");
    expect(screen.getByTestId("brand-token-rename-note").textContent).toBe("3 references follow the new ID.");
    prompt.mockRestore();
  });

  it("renames on confirm", () => {
    const onRename = vi.fn();
    openRename(onRename);
    fireEvent.click(screen.getByTestId("brand-token-action-rename"));
    fireEvent.change(screen.getByTestId("brand-token-rename-input"), { target: { value: "color-brand" } });
    fireEvent.click(screen.getByTestId("brand-token-rename-confirm"));
    expect(onRename).toHaveBeenCalledWith("color-primary", "color-brand");
  });

  it("refuses a colliding or malformed id and says why", () => {
    const onRename = vi.fn();
    openRename(onRename);
    fireEvent.click(screen.getByTestId("brand-token-action-rename"));
    fireEvent.change(screen.getByTestId("brand-token-rename-input"), { target: { value: "color-text" } });
    fireEvent.click(screen.getByTestId("brand-token-rename-confirm"));
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByTestId("brand-token-rename-error").textContent).toMatch(/already uses/);
    expect(renameError("Bad Id", "x", [])).toMatch(/lower-case/);
  });

  it("with no rename path the item is disabled and says why", () => {
    openRename(undefined);
    const item = screen.getByTestId("brand-token-action-rename") as HTMLButtonElement;
    expect(item.disabled).toBe(true);
    expect(item.getAttribute("title")).toMatch(/keep their IDs/);
  });
});

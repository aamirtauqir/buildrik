/**
 * BRP1-M6 safe delete (8224:231573 replacement-required · 8224:232280
 * unused-confirm · 8224:232979 usage-unknown). One dialog, three states,
 * decided by the token's site-wide count.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import type { DesignToken } from "@/editor/design-system/types";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";
import { TokenDeleteDialog, replacementCandidates } from "../TokenDeleteDialog";

const colour = (id: string, name: string, value: string, extra: Partial<DesignToken> = {}): DesignToken => ({
  ...v6Token({ id, name, value, category: "colors", cssVar: `--buildrick-design-${id}`, type: "color", kind: "color" }),
  ...extra,
});
const blue = colour("blue-600", "Blue 600", "#1C64F2", { layer: "primitive" });
const primary = colour("color-primary", "Primary", "#1A56DB", { layer: "semantic" });
const link = { ...colour("color-link", "Link", "#000", { layer: "semantic" }), modes: { light: { alias: "blue-600" } } } as DesignToken;
const text = colour("color-text", "Text", "#111827", { layer: "semantic" });
const gone = colour("color-old", "Old", "#222222", { layer: "semantic", replacedBy: "color-text" });
const space = v6Token({ id: "space-4", name: "Space 4", value: "16px", category: "spacing", cssVar: "--x", type: "length", kind: "spacing" });
const ALL = [blue, primary, link, text, gone, space];

function open(usage: React.ComponentProps<typeof TokenDeleteDialog>["usage"], extra: Partial<React.ComponentProps<typeof TokenDeleteDialog>> = {}) {
  const props = { open: true, token: primary, usage, allTokens: ALL, onClose: vi.fn(), onDelete: vi.fn(), onRetry: vi.fn(), ...extra };
  render(<TokenDeleteDialog {...props} />);
  return props;
}

describe("replacementCandidates", () => {
  it("lists same-kind, live tokens other than the one going — semantic first", () => {
    expect(replacementCandidates(primary, ALL).map((t) => t.id)).toEqual(["color-link", "color-text", "blue-600"]);
  });
});

describe("TokenDeleteDialog (BRP1-M6)", () => {
  it("unused → plain confirm; Delete deletes with no replacement", () => {
    const p = open(0);
    expect(screen.getByText("Delete Primary?")).toBeTruthy();
    expect(screen.getByText("This token is not used by any elements.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(p.onDelete).toHaveBeenCalledWith(undefined);
  });

  it("in use → asks for a replacement; Replace and delete waits for a pick and sends it", () => {
    const p = open(14);
    expect(screen.getByTestId("brand-token-replace-modal")).toBeTruthy();
    expect(screen.getByText("Replace Primary before deleting?")).toBeTruthy();
    expect(screen.getByText("Primary is used by 14 elements. Choose a replacement so every element keeps a valid colour.")).toBeTruthy();
    const confirm = screen.getByRole("button", { name: "Replace and delete" });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Link · Blue 600", "Text · #111827", "Blue 600 · #1C64F2"]);
    fireEvent.click(screen.getByRole("option", { name: "Link · Blue 600" }));
    expect(screen.getByText("14 elements will use Link. Undo the replacement and deletion with one ⌘Z.")).toBeTruthy();
    fireEvent.click(confirm);
    expect(p.onDelete).toHaveBeenCalledWith({ replaceWith: "color-link" });
  });

  it("unknown → refused with the reason, nothing deleted; Try again re-counts", () => {
    const p = open("unknown");
    expect(screen.getByText("Can't delete Primary")).toBeTruthy();
    expect(screen.getByText("We can't count usage right now. Nothing has been deleted. Try again when all site content can be checked.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(p.onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(p.onClose).toHaveBeenCalled();
    expect(p.onDelete).not.toHaveBeenCalled();
  });

  it("Cancel closes without deleting", () => {
    const p = open(3);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(p.onClose).toHaveBeenCalled();
    expect(p.onDelete).not.toHaveBeenCalled();
  });
});

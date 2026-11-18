/**
 * BRP1-M5 (8224:229485 counts · 8224:230173 unknown): the Colours table's
 * USAGE column reads the site-wide count — "Used by N", or "Can't count right
 * now" with no number while some site content is unread — and a count above
 * zero is the door to the canvas highlight.
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import type { TokenUsageCount } from "@buildrik/shared/tokens";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken } from "@/editor/design-system/types";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

function makeToken(id: string, name: string, value: string, group = "brand"): DesignToken {
  return v6Token({ id, name, value, category: "colors", cssVar: `--bd-${id}`, type: "color", kind: "color", group });
}

const tokens = [makeToken("color-primary", "Primary", "#1A56DB"), makeToken("color-border", "Border", "#E5E7EB", "surface")];

function renderList(counts: Array<[string, TokenUsageCount]>, extra: Partial<React.ComponentProps<typeof ColorTokenList>> = {}) {
  return render(<ColorTokenList tokens={tokens} onAddToken={vi.fn()} usageCounts={new Map(counts)} {...extra} />);
}

describe("ColorTokenList — usage column (BRP1-M5)", () => {
  it("says when other tokens reach it through aliases (B6-B01)", () => {
    const alias = v6Token({ id: "color-link", name: "Link", value: "#1A56DB", category: "colors", type: "color", kind: "color", group: "brand" });
    const linked = { ...alias, modes: { light: { alias: "color-primary" } } } as unknown as DesignToken;
    const { getByTestId } = render(
      <ColorTokenList tokens={tokens} allTokens={[...tokens, linked]} onAddToken={vi.fn()} usageCounts={new Map([["color-primary", 3]])} />,
    );
    expect(getByTestId("brand-token-used-color-primary").textContent).toBe("Used by 3 places · through aliases");
  });

  it("prints 'Used by N' and a click on it asks for the highlight of that token", () => {
    const onShowUsage = vi.fn();
    const onSelectToken = vi.fn();
    const { getByTestId } = renderList([["color-primary", 14], ["color-border", 0]], { onShowUsage, onSelectToken });
    const cell = getByTestId("brand-token-used-color-primary");
    expect(cell.textContent).toBe("Used by 14 places");
    fireEvent.click(cell.querySelector("button")!);
    expect(onShowUsage).toHaveBeenCalledWith("color-primary");
    expect(onSelectToken).not.toHaveBeenCalled();
  });

  it("prints 'Used by 0' for an unused token, with nothing to highlight", () => {
    const onShowUsage = vi.fn();
    const { getByTestId } = renderList([["color-primary", 14], ["color-border", 0]], { onShowUsage });
    const cell = getByTestId("brand-token-used-color-border");
    expect(cell.textContent).toBe("Used by 0 places");
    expect(cell.querySelector("button")).toBeNull();
  });

  it("prints the unknown state with no number, and the warning notice under the table", () => {
    const { getByTestId } = renderList([["color-primary", "unknown"], ["color-border", "unknown"]]);
    expect(getByTestId("brand-token-used-color-primary").textContent).toBe("Can’t count right now");
    expect(getByTestId("brand-token-used-color-primary").textContent).not.toMatch(/\d/);
    expect(getByTestId("brand-usage-unknown-notice").textContent).toBe(
      "We can’t count where colors are used right now. Editing still works; deleting is blocked until the count is back.",
    );
  });

  it("draws no notice while every count is known", () => {
    const { queryByTestId } = renderList([["color-primary", 3], ["color-border", 0]]);
    expect(queryByTestId("brand-usage-unknown-notice")).toBeNull();
  });
});

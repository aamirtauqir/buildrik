/**
 * TokensRouter tests — drill-in state machine (T8).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act, waitFor } from "@testing-library/react";
import * as React from "react";
import { TokensRouter } from "../TokensRouter";
import { DSModeProvider } from "../../../state/DSModeContext";
import type { DesignToken } from "../../../types";

const baseToken: DesignToken = {
  id: "color.brand.primary",
  name: "Brand · Primary",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--buildrick-design-color-brand-primary",
  type: "color",
  kind: "color",
};

const otherToken: DesignToken = {
  id: "color.surface.bg",
  name: "Surface · Background",
  value: "#0A0A0A",
  category: "colors",
  cssVar: "--buildrick-design-color-surface-bg",
  type: "color",
  kind: "color",
};

const wrap = (children: React.ReactNode) => (
  <DSModeProvider initialMode="pro">{children}</DSModeProvider>
);

describe("TokensRouter", () => {
  it("initial render shows children (list view) — not the detail view", () => {
    const { queryByText, getByTestId } = render(
      wrap(
        <TokensRouter composer={null} tokens={[baseToken]}>
          {() => <div data-testid="list-view">list view content</div>}
        </TokensRouter>,
      ),
    );
    expect(getByTestId("list-view")).toBeTruthy();
    expect(queryByText(/back to tokens/i)).toBeNull();
  });

  it("calling onRowClick from children → renders TokenDetailView for that token", () => {
    const { getByText, getByTestId, queryByTestId } = render(
      wrap(
        <TokensRouter composer={null} tokens={[baseToken]}>
          {({ onRowClick }) => (
            <button
              type="button"
              data-testid="trigger"
              onClick={() => onRowClick(baseToken.id)}
            >
              click
            </button>
          )}
        </TokensRouter>,
      ),
    );
    fireEvent.click(getByTestId("trigger"));
    // Detail view rendered; list is no longer present.
    expect(getByText(/back to tokens/i)).toBeTruthy();
    expect(getByText(baseToken.name)).toBeTruthy();
    expect(queryByTestId("trigger")).toBeNull();
  });

  it("back arrow click → returns to list view", () => {
    const { getByText, getByTestId, queryByText } = render(
      wrap(
        <TokensRouter composer={null} tokens={[baseToken]}>
          {({ onRowClick }) => (
            <button
              type="button"
              data-testid="trigger"
              onClick={() => onRowClick(baseToken.id)}
            >
              click
            </button>
          )}
        </TokensRouter>,
      ),
    );
    fireEvent.click(getByTestId("trigger"));
    const back = getByText(/back to tokens/i).closest("button")!;
    fireEvent.click(back);
    expect(getByTestId("trigger")).toBeTruthy();
    expect(queryByText(/back to tokens/i)).toBeNull();
  });

  it("token disappears from tokens prop while in detail → falls back to list", async () => {
    const { rerender, getByTestId, queryByText } = render(
      wrap(
        <TokensRouter composer={null} tokens={[baseToken, otherToken]}>
          {({ onRowClick }) => (
            <button
              type="button"
              data-testid="trigger"
              onClick={() => onRowClick(baseToken.id)}
            >
              click
            </button>
          )}
        </TokensRouter>,
      ),
    );
    fireEvent.click(getByTestId("trigger"));
    // Now remove the active token from the prop.
    rerender(
      wrap(
        <TokensRouter composer={null} tokens={[otherToken]}>
          {({ onRowClick }) => (
            <button
              type="button"
              data-testid="trigger"
              onClick={() => onRowClick(baseToken.id)}
            >
              click
            </button>
          )}
        </TokensRouter>,
      ),
    );
    // Microtask-queued state update should land — wait for list to appear.
    await waitFor(() => {
      expect(getByTestId("trigger")).toBeTruthy();
      expect(queryByText(/back to tokens/i)).toBeNull();
    });
  });

  it("clicking a different row from list view drills into that token", () => {
    const { getByText, getByTestId } = render(
      wrap(
        <TokensRouter composer={null} tokens={[baseToken, otherToken]}>
          {({ onRowClick }) => (
            <div>
              <button
                type="button"
                data-testid="row-1"
                onClick={() => onRowClick(otherToken.id)}
              >
                row 1
              </button>
            </div>
          )}
        </TokensRouter>,
      ),
    );
    fireEvent.click(getByTestId("row-1"));
    expect(getByText(otherToken.name)).toBeTruthy();
  });
});

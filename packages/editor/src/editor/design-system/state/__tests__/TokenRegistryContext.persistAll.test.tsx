// @vitest-environment jsdom
/**
 * TokenRegistryProvider — persistAll round-trips ALL 14 token kinds.
 *
 * Regression for the data-loss bug where persistAll saved only color/spacing/
 * type, so edits to the other 11 kinds (radius, shadow, motion, border, opacity,
 * zindex, breakpoint, grid, sizing, icon, imagery) were silently dropped on
 * reload. The load path reads every kind; the save must too. This test seeds one
 * token of every kind, mounts the provider (which loads them), calls persistAll,
 * and asserts every kind is still in localStorage afterward.
 */

import { render, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import * as React from "react";
import {
  TokenRegistryProvider,
  useRegistryConfig,
} from "../TokenRegistryContext";
import type { DesignToken, TokenKind, TokenCategory, TokenType } from "../../types";

const STORAGE_KEY = "buildrick-design-tokens-persistall-v1";

// Every one of the 14 canonical kinds, with the category the 3 bespoke hooks
// filter on (color→colors, type→typography, spacing→spacing) and a `kind` tag
// the other 11 generic hooks filter on.
const KIND_CATEGORY: Array<[TokenKind, TokenCategory, TokenType]> = [
  ["color", "colors", "color"],
  ["type", "typography", "font-size"],
  ["spacing", "spacing", "length"],
  ["radius", "layout", "length"],
  ["shadow", "effects", "shadow"],
  ["motion", "effects", "string"],
  ["border", "layout", "length"],
  ["opacity", "effects", "number"],
  ["zindex", "layout", "number"],
  ["breakpoint", "layout", "length"],
  ["grid", "layout", "number"],
  ["sizing", "layout", "length"],
  ["icon", "icons", "string"],
  ["imagery", "effects", "string"],
];

function seedToken(kind: TokenKind, category: TokenCategory, type: TokenType): DesignToken {
  return {
    id: `${kind}-seed`,
    name: `${kind} seed`,
    value: kind === "color" ? "#123456" : "42",
    category,
    cssVar: `--bd-${kind}-seed`,
    type,
    kind,
  };
}

const ALL_SEED: DesignToken[] = KIND_CATEGORY.map(([k, c, t]) => seedToken(k, c, t));

function PersistOnMount() {
  const { persistAll } = useRegistryConfig();
  React.useEffect(() => {
    persistAll();
  }, [persistAll]);
  return null;
}

describe("TokenRegistryProvider · persistAll", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("re-saves every one of the 14 kinds it loaded (no silent drop on reload)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, tokens: ALL_SEED }),
    );

    act(() => {
      render(
        <TokenRegistryProvider projectId="persistall">
          <PersistOnMount />
        </TokenRegistryProvider>,
      );
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as { tokens: DesignToken[] };
    const savedKinds = new Set(parsed.tokens.map((t) => t.kind));

    for (const [kind] of KIND_CATEGORY) {
      expect(savedKinds.has(kind), `kind "${kind}" was dropped by persistAll`).toBe(true);
    }
    // 14 seeded → 14 persisted (nothing lost)
    expect(parsed.tokens.length).toBeGreaterThanOrEqual(14);
  });
});

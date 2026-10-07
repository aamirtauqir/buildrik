/**
 * "Update everywhere" goes through the one token write (spec §4): one
 * transaction, one ⌘Z — and NOTHING on a read-only site, where the merged list
 * it starts from is the seed and writing it would replace the site's real
 * tokens (Task 9's half-migrated-save hazard).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { renderHook } from "@testing-library/react";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { useUpdateColorEverywhere } from "../useUpdateColorEverywhere";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

const primary = (c: ReturnType<typeof createTestComposer>) =>
  resolveTokenLiteral(c.getProjectSettings().designTokens ?? [], "color-primary", "light");

describe("useUpdateColorEverywhere", () => {
  it("writes the value as one undoable step", () => {
    const c = createTestComposer();
    c.history.flushPending();
    const steps = c.history.getUndoCount();
    const { result } = renderHook(() => useUpdateColorEverywhere(c));

    expect(result.current("color-primary", "#C2410C")).toBe(true);
    c.history.flushPending();
    expect(primary(c)).toBe("#C2410C");
    expect(c.history.getUndoCount()).toBe(steps + 1);

    c.history.undo();
    expect(primary(c)).not.toBe("#C2410C");
  });

  it("refuses on a read-only site and leaves its saved tokens untouched", () => {
    const c = createTestComposer();
    const saved = [{ id: "color-primary", name: "Primary", value: "#123456", category: "colors", cssVar: "--buildrick-design-color-primary", type: "color" }];
    c.setProjectSettingsRaw({ ...c.getProjectSettings(), designTokens: saved as never, designTokensSchemaVersion: 2 });
    c.designSystem.readOnly = true;
    const { result } = renderHook(() => useUpdateColorEverywhere(c));

    expect(result.current("color-primary", "#C2410C")).toBe(false);
    expect(c.getProjectSettings().designTokens).toBe(saved);
  });
});

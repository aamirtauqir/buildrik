import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { ProjectTokensApplier } from "../ProjectTokensApplier";
import { mergeProjectTokens } from "../../state/projectTokens";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import type { DesignToken } from "@/engine/designSystem/types";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

/**
 * A site's brand lives in `projectSettings.designTokens`. The merge that turns
 * it into CSS variables ran inside the Brand panel, so a machine with no
 * localStorage cache drew the DEFAULT brand — measured: body font Palatino in
 * the project, `--buildrick-design-font-body` reading "Inter" on the canvas
 * until the panel was opened.
 */
function stubComposer(tokens: DesignToken[]) {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    composer: {
      on: (e: string, cb: () => void) => { (handlers[e] ??= []).push(cb); },
      off: (e: string, cb: () => void) => {
        handlers[e] = (handlers[e] ?? []).filter((h) => h !== cb);
      },
      getProjectSettings: () => ({ designTokens: tokens }),
      colorMode: { resolved: () => "light" as const },
    } as unknown as Composer,
    fire: (e: string) => (handlers[e] ?? []).forEach((h) => h()),
    listenerCount: (e: string) => (handlers[e] ?? []).length,
  };
}

const read = (v: string) => document.documentElement.style.getPropertyValue(v);

beforeEach(() => {
  document.documentElement.removeAttribute("style");
});

describe("ProjectTokensApplier", () => {
  it("puts the site's own tokens on the page without the Brand panel", () => {
    const { composer } = stubComposer([
      v6Token({ id: "font-body", value: "Palatino", category: "typography", type: "font-family", layer: "semantic" }),
    ]);
    render(<ProjectTokensApplier composer={composer} />);
    expect(read("--buildrick-design-font-body")).toBe("Palatino");
  });

  it("re-applies when the project loads after mount", () => {
    let tokens: DesignToken[] = [];
    const handlers: Record<string, Array<() => void>> = {};
    const composer = {
      on: (e: string, cb: () => void) => { (handlers[e] ??= []).push(cb); },
      off: () => {},
      getProjectSettings: () => ({ designTokens: tokens }),
      colorMode: { resolved: () => "light" as const },
    } as unknown as Composer;

    render(<ProjectTokensApplier composer={composer} />);
    expect(read("--buildrick-design-color-action")).toBe("");

    tokens = [
      v6Token({ id: "color-action", value: "#B91C1C", layer: "semantic" }),
    ];
    handlers[EVENTS.PROJECT_LOADED].forEach((h) => h());
    expect(read("--buildrick-design-color-action")).toBe("#B91C1C");
  });

  it("resolves colours through the dark resolver, so dark mode does not flash light", () => {
    const resolve_ = vi.fn(() => "#0F172A");
    const composer = {
      on: () => {}, off: () => {},
      getProjectSettings: () => ({
        designTokens: [
          v6Token({ id: "color-action", value: "#B91C1C", layer: "semantic" }),
        ],
      }),
      colorMode: { resolved: () => "dark" as const },
      darkResolver: { resolve: resolve_ },
    } as unknown as Composer;
    render(<ProjectTokensApplier composer={composer} />);
    expect(resolve_).toHaveBeenCalled();
    expect(read("--buildrick-design-color-action")).toBe("#0F172A");
  });

  it("writes nothing for a project that carries no tokens", () => {
    const { composer } = stubComposer([]);
    render(<ProjectTokensApplier composer={composer} />);
    expect(document.documentElement.getAttribute("style")).toBeNull();
  });

  it("unsubscribes on unmount", () => {
    const { composer, listenerCount } = stubComposer([]);
    const { unmount } = render(<ProjectTokensApplier composer={composer} />);
    expect(listenerCount(EVENTS.PROJECT_LOADED)).toBe(1);
    unmount();
    expect(listenerCount(EVENTS.PROJECT_LOADED)).toBe(0);
  });

  it("is mounted where every project sees it, not inside the panel", () => {
    const shell = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../../shell/StudioPanels.tsx"),
      "utf8"
    );
    expect(shell).toContain("<ProjectTokensApplier composer={composer} />");
  });
});

describe("mergeProjectTokens", () => {
  it("keeps the seed for slots the site never changed", () => {
    /* The site saved one edit: color-action and the primitive the edit gave it. */
    const saved = setTokenLiteral(DEFAULT_TOKENS, "color-action", "light", "#B91C1C").filter(
      (t) => t.id === "color-action" || t.id === "custom-color-action",
    );
    const merged = mergeProjectTokens(saved);
    expect(resolveTokenLiteral(merged, "color-action", "light")).toBe("#B91C1C");
    expect(resolveTokenLiteral(merged, "font-body", "light")).toBe("Inter");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { ProjectTokensApplier } from "../ProjectTokensApplier";

/* The canvas always shows a theme-toggle block's icon swap — even on an Off
   site, where publish hides it (spec D12, board M12) — and an inserted toggle
   gets that CSS at once, not on the next settings change. */
function stubComposer(darkMode: "auto" | "off") {
  const handlers: Record<string, Array<() => void>> = {};
  const elements: Array<{ getAttribute(n: string): string | undefined }> = [];
  return {
    composer: {
      on: (e: string, cb: () => void) => { (handlers[e] ??= []).push(cb); },
      off: (e: string, cb: () => void) => { handlers[e] = (handlers[e] ?? []).filter((h) => h !== cb); },
      getProjectSettings: () => ({ designTokens: [], darkMode }),
      colorMode: { resolved: () => "light" as const },
      elements: { getAllElements: () => elements },
    } as unknown as Composer,
    insertToggle: () => elements.push({ getAttribute: (n) => (n === "data-bk-theme-toggle" ? "true" : undefined) }),
    fire: (e: string) => (handlers[e] ?? []).forEach((h) => h()),
  };
}

const css = () => document.getElementById("bk-site-tokens")?.textContent ?? "";
const SWAP = '[data-bk-theme-toggle] [data-bk-tt="dark"]{display:none!important}';

beforeEach(() => {
  document.head.innerHTML = "";
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
});

describe("ProjectTokensApplier — theme toggle", () => {
  it("no toggle on the site → no toggle CSS", () => {
    render(<ProjectTokensApplier composer={stubComposer("auto").composer} />);
    expect(css()).not.toContain("data-bk-theme-toggle");
  });

  it("an inserted toggle gets the icon swap on the next frame, on an Off site too", () => {
    const stub = stubComposer("off");
    render(<ProjectTokensApplier composer={stub.composer} />);
    stub.insertToggle();
    act(() => {
      stub.fire(EVENTS.ELEMENT_CREATED);
      vi.advanceTimersToNextFrame();
    });
    expect(css()).toContain(SWAP);
    expect(css()).not.toContain("[data-bk-theme-toggle]{display:none!important}");
  });
});

import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import type { ProjectSettings } from "@/shared/types";
import { useGlobalCustomCss } from "../useGlobalCustomCss";

function makeComposer(globalCss: string) {
  const listeners = new Set<(s: ProjectSettings) => void>();
  const composer = {
    getProjectSettings: () => ({ customCode: { globalCss } }) as ProjectSettings,
    on: vi.fn((_event: string, cb: (s: ProjectSettings) => void) => listeners.add(cb)),
    off: vi.fn((_event: string, cb: (s: ProjectSettings) => void) => listeners.delete(cb)),
  };
  const emit = (css: string) =>
    listeners.forEach((cb) => cb({ customCode: { globalCss: css } } as ProjectSettings));
  return { composer: composer as unknown as Composer, emit };
}

describe("useGlobalCustomCss", () => {
  it("returns Global CSS with foreign resource URLs blocked for the canvas", () => {
    const { composer, emit } = makeComposer(
      'input[value^="a"]{background:url(https://evil.example/a)} .hero{background:url(https://images.unsplash.com/p)}'
    );
    const { result } = renderHook(() => useGlobalCustomCss(composer));

    expect(result.current).not.toContain("evil.example");
    expect(result.current).toContain("url(data:,)");
    expect(result.current).toContain("url(https://images.unsplash.com/p)");
    expect(composer.on).toHaveBeenCalledWith(EVENTS.SETTINGS_CHANGE, expect.any(Function));

    act(() => emit('@import "https://evil.example/x.css"; body{color:red}'));
    expect(result.current).toBe('@import "data:,"; body{color:red}');
  });
});

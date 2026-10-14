/**
 * DQ-013: the active page id was held in three useStates (AquibraStudio,
 * PageTabBar, usePages), each subscribed to a different event set. The shell's
 * copy listened to PAGE_CHANGED + PROJECT_LOADED only, and deleting the active
 * page emits neither — PageManager reassigns it and says PROJECT_CHANGED
 * `page:deleted` — so the Issues panel's "This page" scope kept a page that no
 * longer existed. One hook, every event that can move it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActivePageId } from "../useActivePageId";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function seeded() {
  const composer = createTestComposer();
  const a = composer.elements.createPage("Home");
  const b = composer.elements.createPage("About");
  composer.elements.setActivePage(a.id);
  return { composer, a, b };
}

describe("useActivePageId", () => {
  it("reads the active page and follows a switch", () => {
    const { composer, a, b } = seeded();
    const { result } = renderHook(() => useActivePageId(composer));
    expect(result.current).toBe(a.id);
    act(() => composer.elements.setActivePage(b.id));
    expect(result.current).toBe(b.id);
  });

  it("follows the reassignment when the active page is deleted", () => {
    const { composer, a, b } = seeded();
    const { result } = renderHook(() => useActivePageId(composer));
    act(() => {
      composer.elements.deletePage(a.id);
    });
    expect(result.current).toBe(b.id);
  });

  it("is null without a composer", () => {
    const { result } = renderHook(() => useActivePageId(null));
    expect(result.current).toBeNull();
  });
});

/**
 * Settings Tab Tests — v2 drill-in drawer.
 *
 * Covers (codex P1 #4 — REAL coverage, not stubs):
 *   Root view: 10-section snav + 3 workspace deep-links + WORKSPACE group header.
 *   Push/pop animation: section mount-on-click, unmount-on-pop-transitionend,
 *     focus restore on pop.
 *   Escape contract: SettingsTab owns Escape; clean section pops; DIRTY section
 *     opens ConfirmDialog (drive dirty via real form input).
 *   Dialog Discard (back-attempt) → pops to root + clears dirty.
 *   Dialog Cancel → closes dialog, dirty preserved, section stays.
 *   Pending-nav guard: dirty + click another row → dialog opens; Discard →
 *     navigateBetweenSections swaps content (no animation lock).
 *   Reduced-motion path: stack has .no-motion, no .transitioning flip.
 *   Branding signpost: jump button → navigateBetweenSections (no unmount).
 *   aria-hidden + inert flip together on root during section view.
 *
 * Note: useSettingsScreen is mocked — production hook re-creates selectors
 * on every render, causing an infinite jsdom re-render loop. Mock preserves
 * external contract: { value, isDirty, markDirty, markClean, setValue }.
 *
 * Note: navigate() wraps setIsRoot(false) in rAF. jsdom does not flush rAF
 * synchronously on click. While the section is mounted but isRoot is still
 * true, the section has aria-hidden=true + inert, so Testing Library's
 * accessibility queries (getByRole) exclude its descendants. Tests must
 * await the aria-hidden flip on root before querying section content.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
  waitFor,
  within,
} from "@testing-library/react";
import * as React from "react";

vi.mock("../hooks/useSettingsScreen", () => ({
  useSettingsScreen: vi.fn(
    (
      composer: { getProjectSettings?: () => unknown } | null | undefined,
      selector: (s: unknown) => unknown,
      defaultValue: unknown,
    ) => {
      const raw = composer?.getProjectSettings?.() ?? {};
      const initialValue = (() => {
        try {
          return selector(raw) ?? defaultValue;
        } catch {
          return defaultValue;
        }
      })();
      const [value, setValue] = React.useState(initialValue);
      const [isDirty, setIsDirty] = React.useState(false);
      return {
        value,
        isDirty,
        setValue: (v: unknown) => {
          setValue(v);
          setIsDirty(true);
        },
        markDirty: () => setIsDirty(true),
        markClean: () => setIsDirty(false),
      };
    },
  ),
}));

const reducedMotionRef: { value: boolean } = { value: false };
vi.mock("@/shared/hooks/useReducedMotion", () => ({
  useReducedMotion: () => reducedMotionRef.value,
}));

import { SettingsTab } from "../SettingsTab";

afterEach(() => {
  cleanup();
  reducedMotionRef.value = false;
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const makeComposer = () => ({
  getProjectSettings: () => ({ seo: { siteName: "Test Site" } }),
  setProjectSettings: vi.fn(),
  saveProject: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  off: vi.fn(),
});

const dispatchTransform = (el: HTMLElement) => {
  // jsdom@28 supports new TransitionEvent. Verified via env construct check.
  act(() => {
    el.dispatchEvent(
      new TransitionEvent("transitionend", { bubbles: true, propertyName: "transform" }),
    );
  });
};

// Click a snav row + wait for the push animation's first state-flip
// (isRoot=false → root.aria-hidden="true"), then fire transitionend to clear
// the `transitioning` lock. Without this, navigate()/navigateToRoot() return
// early when called from a subsequent click in the same test (D20 lock).
async function clickRowAndAwaitPush(rowName: RegExp) {
  const row = screen.getByRole("button", { name: rowName });
  fireEvent.click(row);
  await waitFor(() => {
    const root = document.querySelector(".bd-set-screen--root");
    expect(root?.getAttribute("aria-hidden")).toBe("true");
  });
  // Clear .transitioning so subsequent nav clicks are not blocked.
  const section = document.querySelector(".bd-set-screen--section") as HTMLElement | null;
  if (section) dispatchTransform(section);
  return row;
}

// Drive dirty via a real form input edit + await the post-render
// onDirtyChange propagation chain (screen useEffect -> parent setState).
async function makeSectionDirty(siteNameInput: HTMLInputElement) {
  fireEvent.change(siteNameInput, { target: { value: "Edited Site" } });
  // Two render cycles: 1) screen sets local state + isDirty=true,
  //                    2) effect fires onDirtyChange -> parent setScreenIsDirty.
  await waitFor(() => {
    // Savebar shows "1 unsaved" once parent registers dirty.
    expect(document.querySelector(".bd-set-savebar.on")).not.toBeNull();
  });
}

// ─── Group 1 — Root view ─────────────────────────────────────────────────────

describe("SettingsTab v2 — root view", () => {
  it("renders 10 in-tab sections + WORKSPACE group with 3 deep-links", () => {
    render(<SettingsTab composer={makeComposer() as never} userPlan="enterprise" />);
    [
      /general/i, /branding/i, /seo/i,
      /analytics/i, /localization/i,
      /custom code/i, /redirects/i, /headers/i, /forms/i, /integrations/i,
    ].forEach((re) => {
      expect(screen.getByRole("button", { name: re })).toBeTruthy();
    });
    const links = screen.getAllByRole("link");
    const labels = links.map((a) => a.textContent ?? "");
    expect(labels.some((l) => /Domains/.test(l))).toBe(true);
    expect(labels.some((l) => /Members/.test(l))).toBe(true);
    expect(labels.some((l) => /Billing/.test(l))).toBe(true);
    links.forEach((a) => {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
    });
  });

  it("panel header title is 'Settings' at root + section is NOT mounted", () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    expect(document.querySelector(".bd-set-panel-h-ttl h2")?.textContent).toBe("Settings");
    expect(container.querySelector(".bd-set-screen--section")).toBeNull();
  });
});

// ─── Group 2 — Push / pop / focus ─────────────────────────────────────────────

describe("SettingsTab v2 — push/pop + focus", () => {
  it("click snav row → section mounts + root has aria-hidden=true + inert", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    await clickRowAndAwaitPush(/general/i);
    const section = container.querySelector(".bd-set-screen--section");
    expect(section).not.toBeNull();
    const root = container.querySelector(".bd-set-screen--root");
    // Codex P0 #2 + P2 #7: root stays mounted; gets aria-hidden + inert.
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.hasAttribute("inert")).toBe(true);
  });

  it("back button pops + unmounts section + restores focus to opening row", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    const generalRow = await clickRowAndAwaitPush(/general/i);
    const section = container.querySelector(".bd-set-screen--section") as HTMLElement;
    expect(section).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /back to settings/i }));
    // Section stays mounted during the pop animation.
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
    dispatchTransform(section);
    expect(container.querySelector(".bd-set-screen--section")).toBeNull();
    // Codex P0 #2: focus restored to General row via setTimeout(0).
    await waitFor(() => {
      expect(document.activeElement).toBe(generalRow);
    });
  });
});

// ─── Group 3 — Escape contract (clean + dirty) ───────────────────────────────

describe("SettingsTab v2 — Escape contract", () => {
  it("Escape from section (clean) pops to root", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    await clickRowAndAwaitPush(/general/i);
    fireEvent.keyDown(document, { key: "Escape" });
    const section = container.querySelector(".bd-set-screen--section");
    if (section) dispatchTransform(section as HTMLElement);
    expect(container.querySelector(".bd-set-screen--section")).toBeNull();
  });

  it("Escape from root is a no-op (no dialog)", () => {
    render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape from DIRTY section opens ConfirmDialog + section stays visible", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    await clickRowAndAwaitPush(/general/i);
    // Drive dirty via real input edit.
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    // Press Escape on document body (NOT inside an input — Escape inside
    // input is handled by the input's blur/clear).
    fireEvent.keyDown(document.body, { key: "Escape" });
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
    // Codex P0 #1: section MUST still be visible behind the dialog.
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
  });
});

// ─── Group 4 — ConfirmDialog Discard / Cancel paths ──────────────────────────

describe("SettingsTab v2 — ConfirmDialog Discard / Cancel", () => {
  it("Discard (back-attempt path): pops to root + clears dirty", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    await clickRowAndAwaitPush(/general/i);
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    // Click DrillInHeader's back button while dirty → dialog opens.
    fireEvent.click(screen.getByRole("button", { name: /back to settings/i }));
    const dialog = await screen.findByRole("dialog");
    // Click "Discard" in the dialog.
    fireEvent.click(within(dialog).getByRole("button", { name: /discard/i }));
    // Section animates out — fire transitionend.
    const section = container.querySelector(".bd-set-screen--section") as HTMLElement | null;
    if (section) dispatchTransform(section);
    await waitFor(() => {
      expect(container.querySelector(".bd-set-screen--section")).toBeNull();
    });
  });

  // B1 (systematic-QA finding): Discard must roll the composer's project
  // settings back to the snapshot taken when the screen mounted. Without this,
  // user edits flowed through composer.setProjectSettings live (per keystroke);
  // clearing dirty on Discard left the composer holding the dirty values.
  it("Discard restores composer projectSettings to mount-time snapshot", async () => {
    const composer = makeComposer();
    const { container } = render(<SettingsTab composer={composer as never} />);
    await clickRowAndAwaitPush(/general/i);
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    // Capture mount-time snapshot for assertion (composer.getProjectSettings()
    // is the source of the snapshot, so this matches what Discard should send).
    const snapshot = composer.getProjectSettings();
    composer.setProjectSettings.mockClear();
    // Click savebar Discard.
    fireEvent.click(within(container.querySelector(".bd-set-savebar") as HTMLElement)
      .getByRole("button", { name: /discard/i }));
    // setProjectSettings called with deep-cloned snapshot (not same reference).
    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const arg = composer.setProjectSettings.mock.calls[0][0];
    expect(arg).toEqual(snapshot);
    expect(arg).not.toBe(snapshot); // structuredClone → fresh object identity
  });

  it("Cancel: dialog closes + section stays + dirty preserved", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    await clickRowAndAwaitPush(/general/i);
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    fireEvent.click(screen.getByRole("button", { name: /back to settings/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /keep editing/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    // Section still in DOM, savebar still on.
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
    expect(container.querySelector(".bd-set-savebar.on")).not.toBeNull();
  });
});

// ─── Group 5 — Pending-nav guard (codex P0 #3) ───────────────────────────────
//
// Note: In v2, the snav root is `inert` + `aria-hidden=true` while drilled-in,
// so a user CANNOT navigate between sections via the snav while in section
// view. The only section→section path is the Branding signpost, which calls
// `navigate()` (which delegates to `navigateBetweenSections` when clean, or
// opens ConfirmDialog when dirty). jsdom's fireEvent.click bypasses inert, so
// we can also exercise the snav-while-drilled-in path here to cover the dirty
// guard for both entry points.
describe("SettingsTab v2 — pending-nav guard", () => {
  it("dirty + jump to another section → dialog opens; Discard swaps section in-place", async () => {
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    await clickRowAndAwaitPush(/general/i);
    const siteNameInput = (await screen.findByPlaceholderText(/My Awesome Site/i)) as HTMLInputElement;
    await makeSectionDirty(siteNameInput);
    // jsdom's fireEvent.click bypasses inert, so we can exercise the
    // navigate(!isRoot) dirty path via a snav row click.
    const seoRow = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".bd-set-snav-row"),
    ).find((b) => b.textContent?.toLowerCase().includes("seo"));
    expect(seoRow).toBeTruthy();
    fireEvent.click(seoRow!);
    // Dirty guard now fires for section→section nav: dialog opens.
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /discard/i }));
    // Codex P0 #3: navigateBetweenSections swaps content WITHOUT unmounting
    // the section. Header title flips to SEO. Stack should NOT be
    // .transitioning (no animation lock for in-section swap).
    await waitFor(() => {
      expect(document.querySelector(".bd-set-panel-h-ttl h2")?.textContent).toBe("SEO");
    });
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
    expect(container.querySelector(".bd-set-stack.transitioning")).toBeNull();
  });
});

// ─── Group 6 — Reduced motion + Branding ─────────────────────────────────────

describe("SettingsTab v2 — reduced motion", () => {
  it("stack has .no-motion + skips .transitioning class", async () => {
    reducedMotionRef.value = true;
    const { container } = render(<SettingsTab composer={makeComposer() as never} />);
    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    // Reduced-motion path skips rAF + .transitioning entirely; isRoot flips
    // synchronously inside the click handler.
    const stack = container.querySelector(".bd-set-stack");
    expect(stack?.classList.contains("no-motion")).toBe(true);
    expect(stack?.classList.contains("transitioning")).toBe(false);
  });
});

describe("SettingsTab v2 — branding signpost (jump-to via navigateBetweenSections)", () => {
  it("Branding 'Open →' jump button swaps section without unmount + no animation lock", async () => {
    const { container } = render(
      <SettingsTab composer={makeComposer() as never} userPlan="enterprise" />,
    );
    await clickRowAndAwaitPush(/branding/i);
    expect(screen.getByText(/Where Branding lives/)).toBeTruthy();
    // First "Open →" button maps to the General row (Favicon location).
    const jumpButtons = screen.getAllByRole("button", { name: /jump to/i });
    expect(jumpButtons.length).toBeGreaterThan(0);
    fireEvent.click(jumpButtons[0]);
    // Codex P0 #3: section→section nav, no animation lock, no unmount.
    expect(container.querySelector(".bd-set-screen--section")).not.toBeNull();
    expect(container.querySelector(".bd-set-stack.transitioning")).toBeNull();
    // Header reflects new section (General per BRANDING_FIELD_MAP first jump).
    expect(document.querySelector(".bd-set-panel-h-ttl h2")?.textContent).toBe("General");
  });
});

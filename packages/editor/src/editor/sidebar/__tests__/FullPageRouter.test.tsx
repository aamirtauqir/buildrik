/**
 * FullPageRouter — routes fullpage-mode tabs. Pins that Settings (P5, graduated
 * from the 320px drawer to a full-page surface) resolves to SettingsTab here,
 * and that the design-jump callback is forwarded so the Branding section's
 * "jump to Design" survives the graduation.
 */
import * as React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FullPageRouter } from "../FullPageRouter";
import type { Composer } from "@/engine";

vi.mock("../tabs/settings/SettingsTab", () => ({
  default: (props: { onOpenDesignTab?: () => void }) => (
    <div data-testid="fp-settings" data-design={props.onOpenDesignTab ? "wired" : "none"} />
  ),
}));

vi.mock("@/editor/media/LibraryManager", () => ({
  LibraryManager: () => <div data-testid="fp-library" />,
}));

const brand = vi.hoisted(() => ({ fail: false }));
vi.mock("@/editor/design-system/ui/BrandWorkspace", () => ({
  default: () => {
    if (brand.fail) throw new Error("Failed to fetch dynamically imported module");
    return <div data-testid="fp-brand" />;
  },
}));

vi.mock("../tabs/templates/TemplatesTab", () => ({
  default: () => <div data-testid="fp-templates" />,
}));

const common = { onClose: vi.fn() };

function renderRouter(activeTab: string, extra = {}) {
  return render(
    <React.Suspense fallback={null}>
      <FullPageRouter
        activeTab={activeTab as never}
        composer={{} as Composer}
        commonTabProps={common}
        {...extra}
      />
    </React.Suspense>,
  );
}

afterEach(cleanup);

describe("FullPageRouter", () => {
  it("routes Settings to SettingsTab (full-page graduation)", async () => {
    renderRouter("settings");
    expect(await screen.findByTestId("fp-settings")).toBeInTheDocument();
  });

  it("forwards onSwitchToDesign to SettingsTab as onOpenDesignTab", async () => {
    renderRouter("settings", { onSwitchToDesign: vi.fn() });
    expect(await screen.findByTestId("fp-settings")).toHaveAttribute("data-design", "wired");
  });

  /* design-2l9 C-10 / D-10 / E-10: Assets, Brand and Site settings are a
     resource area — they render where the router is mounted (LayoutShell's
     fullpage slot, beside the rail, between the topbar and the bottom bar),
     not into a full-viewport portal that covered the shell. */
  /* data-bk-surface="fullpage" is CommandCenter's keyboard guard: Assets and
     Settings own the keys; Brand must let ⌘Z reach the composer. */
  it.each([
    ["assets", "mgr-host", "fp-library", "fullpage"],
    ["settings", "set-host", "fp-settings", "fullpage"],
    ["design", "brand-host", "fp-brand", null],
  ])("renders %s in place, not in the overlay root", async (tab, hostId, bodyId, surface) => {
    const { container } = renderRouter(tab);
    const host = await screen.findByTestId(hostId);
    expect(container.contains(host)).toBe(true);
    expect(host.getAttribute("data-bk-surface")).toBe(surface);
    expect(host.className).not.toContain("tw:fixed");
    expect(await screen.findByTestId(bodyId)).toBeInTheDocument();
  });

  it("Templates stays an edge-to-edge portal", async () => {
    const { container } = renderRouter("templates");
    const host = await screen.findByTestId("tpl-host");
    expect(container.contains(host)).toBe(false);
  });
});

/* B6-B42 / B6-B56 / B6-B57 — the states of Brand's lazy mount, drawn inside
   the resource area. */
describe("FullPageRouter › Brand load states", () => {
  const setOnline = (online: boolean) =>
    Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => online });

  afterEach(() => {
    brand.fail = false;
    setOnline(true);
  });

  it("shows the skeleton while Brand loads", () => {
    renderRouter("design");
    expect(screen.getByTestId("brand-loading")).toBeInTheDocument();
  });

  it("a failure says Brand could not load and Retry mounts it again", async () => {
    brand.fail = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderRouter("design");
    const alert = await screen.findByTestId("brand-load-failed");
    expect(alert.textContent).toContain("Couldn’t load Brand");
    expect(alert.textContent).toContain("Something went wrong on our side. Your site and its colors are not affected.");
    brand.fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByTestId("fp-brand")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("offline, the failure says Brand needs a connection the first time", async () => {
    brand.fail = true;
    setOnline(false);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderRouter("design");
    const alert = await screen.findByTestId("brand-load-failed");
    expect(alert.textContent).toContain("You’re offline");
    expect(alert.textContent).toContain("Brand needs a connection to load the first time. Reconnect and try again.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    spy.mockRestore();
  });
});

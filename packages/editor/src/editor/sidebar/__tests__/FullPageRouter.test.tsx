/**
 * FullPageRouter — routes fullpage-mode tabs. Pins that Settings (P5, graduated
 * from the 320px drawer to a full-page surface) resolves to SettingsTab here,
 * and that the design-jump callback is forwarded so the Branding section's
 * "jump to Design" survives the graduation.
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FullPageRouter } from "../FullPageRouter";
import type { Composer } from "@/engine";

vi.mock("../tabs/settings/SettingsTab", () => ({
  default: (props: { onOpenDesignTab?: () => void }) => (
    <div data-testid="fp-settings" data-design={props.onOpenDesignTab ? "wired" : "none"} />
  ),
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
});

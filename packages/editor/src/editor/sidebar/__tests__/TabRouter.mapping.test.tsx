/**
 * TabRouter.mapping.test.tsx — lazy tab-id → component mapping.
 * The "ai" case is covered by TabRouter.ai.test.tsx; this file covers the
 * remaining panel tabs, the publish feature-flag gating, and
 * the unknown-tab null fallback.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { TabRouter, type TabRouterProps } from "../TabRouter";
import type { GroupedTabId } from "../../rail/tabsConfig";

const flags = vi.hoisted(() => ({ enabled: new Set<string>() }));

vi.mock("@/shared/utils/featureFlags", () => ({
  isFeatureEnabled: (flag: string) => flags.enabled.has(flag),
}));

vi.mock("../tabs/build", () => ({
  BuildTab: () => <div data-testid="tab-build" />,
}));
vi.mock("../tabs/layers/LayersTab", () => ({
  default: () => <div data-testid="tab-layers" />,
}));
vi.mock("../tabs/pages/PagesTab", () => ({
  default: () => <div data-testid="tab-pages" />,
}));
vi.mock("../tabs/templates/TemplatesTab", () => ({
  TemplatesTab: (props: { onSwitchTab?: (tab: string) => void }) => (
    <div data-testid="tab-templates" data-switch={props.onSwitchTab ? "wired" : "none"} />
  ),
}));
vi.mock("../tabs/ComponentsTab", () => ({
  default: () => <div data-testid="tab-components-legacy" />,
}));
vi.mock("../tabs/media/MediaTab", () => ({
  MediaTab: () => <div data-testid="tab-assets" />,
}));
vi.mock("../tabs/publish/PublishTab", () => ({
  default: (props: { onVercelPublish?: () => Promise<void> }) => (
    <div data-testid="tab-publish" data-vercel={props.onVercelPublish ? "wired" : "none"} />
  ),
}));
vi.mock("../tabs/history/HistoryTab", () => ({
  default: () => <div data-testid="tab-history" />,
}));
vi.mock("../tabs/settings/SettingsTab", () => ({
  default: () => <div data-testid="tab-settings" />,
}));
vi.mock("../tabs/ai/AITab", () => ({
  AITab: () => <div data-testid="tab-ai" />,
}));
vi.mock("@/editor/design-system/ui/DesignSystemTab", () => ({
  default: () => <div data-testid="tab-design" />,
}));

const noop = vi.fn();

function renderRouter(activeTab: GroupedTabId, extra: Partial<TabRouterProps> = {}) {
  return render(
    <TabRouter
      activeTab={activeTab}
      composer={null}
      commonTabProps={{ isExpanded: false, onExpandToggle: noop, onHelpClick: noop, onClose: noop }}
      onSwitchToAdd={noop}
      onCreateComponent={noop}
      {...extra}
    />
  );
}

beforeEach(() => {
  flags.enabled.clear();
});

describe("TabRouter — tab id → panel component mapping", () => {
  const cases: Array<[GroupedTabId, string]> = [
    ["add", "tab-build"],
    ["templates", "tab-templates"],
    ["layers", "tab-layers"],
    ["pages", "tab-pages"],
    ["assets", "tab-assets"],
    ["publish", "tab-publish"],
    ["history", "tab-history"],
    ["settings", "tab-settings"],
    ["design", "tab-design"],
  ];

  it.each(cases)("activeTab=%s renders %s", async (tabId, testId) => {
    renderRouter(tabId);
    expect(await screen.findByTestId(testId)).toBeInTheDocument();
  });

  it("renders nothing for an unknown tab id", () => {
    const { container } = renderRouter("not-a-tab" as unknown as GroupedTabId);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("TabRouter — templates switch-tab wiring", () => {
  // Regression: onTemplatesSwitchTab was declared on TabRouterProps but never
  // destructured or forwarded, so TemplatesTab's "Go to page" success button
  // (which calls onSwitchTab("pages")) was dead. The router must forward it.
  it("forwards onTemplatesSwitchTab to TemplatesTab as onSwitchTab", async () => {
    renderRouter("templates", { onTemplatesSwitchTab: vi.fn() });
    const tab = await screen.findByTestId("tab-templates");
    expect(tab.getAttribute("data-switch")).toBe("wired");
  });

  it("leaves onSwitchTab undefined when no switch handler is provided", async () => {
    renderRouter("templates");
    const tab = await screen.findByTestId("tab-templates");
    expect(tab.getAttribute("data-switch")).toBe("none");
  });
});

describe("TabRouter — components tab", () => {
  /* There is one Components panel now. Two shipped for months behind
     VITE_FEATURE_COMPONENTS_V2 — and because only the NEXT_PUBLIC_ half of a
     flag reaches production, and nothing ever set it, the flag ONLY ever
     selected between "what the port-5050 demo shows" and "what every real user
     sees". No flag can reach this case again. */
  it("renders ComponentsTab, whatever the flags say", async () => {
    flags.enabled.add("componentsV2");
    renderRouter("components");
    expect(await screen.findByTestId("tab-components-legacy")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-components-v2")).toBeNull();
  });
});

describe("TabRouter — publish action flag gating", () => {
  const onVercelPublish = async () => {};

  it("withholds onVercelPublish from PublishTab when the publish flag is OFF", async () => {
    renderRouter("publish", { onVercelPublish });
    const tab = await screen.findByTestId("tab-publish");
    expect(tab.getAttribute("data-vercel")).toBe("none");
  });

  it("passes onVercelPublish through when the publish flag is ON", async () => {
    flags.enabled.add("publish");
    renderRouter("publish", { onVercelPublish });
    const tab = await screen.findByTestId("tab-publish");
    expect(tab.getAttribute("data-vercel")).toBe("wired");
  });
});

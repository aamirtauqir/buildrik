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
import type { GroupedTabId } from "@/editor/rail/tabsConfig";

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
vi.mock("../tabs/ComponentsTab", () => ({
  default: () => <div data-testid="tab-components-legacy" />,
}));
vi.mock("../tabs/media/MediaTab", () => ({
  MediaTab: () => <div data-testid="tab-assets" />,
}));
vi.mock("../tabs/publish/PublishTab", () => ({
  default: (props: { onRequestPublish?: () => void }) => (
    <div data-testid="tab-publish" data-vercel={props.onRequestPublish ? "wired" : "none"} />
  ),
}));
vi.mock("../tabs/history/HistoryTab", () => ({
  default: () => <div data-testid="tab-history" />,
}));
vi.mock("../tabs/ai/AITab", () => ({
  AITab: () => <div data-testid="tab-ai" />,
}));
const noop = vi.fn();

function renderRouter(activeTab: GroupedTabId, extra: Partial<TabRouterProps> = {}) {
  return render(
    <TabRouter
      activeTab={activeTab}
      composer={null}
      commonTabProps={{ isExpanded: false, onExpandToggle: noop, onHelpClick: noop, onClose: noop }}
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
    ["layers", "tab-layers"],
    ["pages", "tab-pages"],
    ["assets", "tab-assets"],
    ["publish", "tab-publish"],
    ["history", "tab-history"],
  ];

  it.each(cases)("activeTab=%s renders %s", async (tabId, testId) => {
    renderRouter(tabId);
    expect(await screen.findByTestId(testId)).toBeInTheDocument();
  });

  it("renders nothing for an unknown tab id", () => {
    const { container } = renderRouter("not-a-tab" as unknown as GroupedTabId);
    expect(container).toBeEmptyDOMElement();
  });

  /* Settings is a FULLPAGE tab (tabsConfig `mode: "fullpage"`), so the drawer
     must not route it. The router used to, which meant a second SettingsTab
     mounted invisibly behind the real one on every visit — and because the
     drawer's copy was the one wired to the unsaved-changes flag, the guard
     against leaving Settings mid-edit never fired. FullPageRouter owns it. */
  it("renders nothing for settings — that surface belongs to FullPageRouter", () => {
    const { container } = renderRouter("settings");
    expect(container).toBeEmptyDOMElement();
  });

  /* Brand graduated the same way on 2026-09-22 (C1 (i)): the 280/700 drawer is
     retired for the full-canvas workspace (Figma 7315:80955), which
     FullPageRouter mounts. A drawer copy here would be a second, invisible
     BrandWorkspace with its own load effect and dirty announcement. */
  it("renders nothing for design — the Brand workspace belongs to FullPageRouter", () => {
    const { container } = renderRouter("design");
    expect(container).toBeEmptyDOMElement();
  });
});

/* Decision #24: Templates is a full-canvas view FullPageRouter mounts; a
   drawer copy here would be a second, invisible catalogue. */
describe("TabRouter — templates", () => {
  it("renders nothing for templates — the view belongs to FullPageRouter", () => {
    const { container } = renderRouter("templates");
    expect(container).toBeEmptyDOMElement();
  });
});

/* 2L9 215:43588 (B6-K02): Components is a resource area — a drawer copy here
   would be a second, invisible panel. */
describe("TabRouter — components", () => {
  it("renders nothing for components — the view belongs to FullPageRouter", () => {
    const { container } = renderRouter("components");
    expect(container).toBeEmptyDOMElement();
  });
});

describe("TabRouter — publish door flag gating", () => {
  const onRequestPublish = () => {};

  it("withholds the publish door from PublishTab when the publish flag is OFF", async () => {
    renderRouter("publish", { onRequestPublish });
    const tab = await screen.findByTestId("tab-publish");
    expect(tab.getAttribute("data-vercel")).toBe("none");
  });

  it("passes the publish door through when the publish flag is ON", async () => {
    flags.enabled.add("publish");
    renderRouter("publish", { onRequestPublish });
    const tab = await screen.findByTestId("tab-publish");
    expect(tab.getAttribute("data-vercel")).toBe("wired");
  });
});

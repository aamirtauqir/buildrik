import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TabRouter } from "../TabRouter";

vi.mock("../tabs/ai/AITab", () => ({
  AITab: () => <div data-testid="ai-tab-rendered" />,
}));

const noop = vi.fn();

describe("TabRouter — ai case", () => {
  it("renders AITab for activeTab='ai'", async () => {
    render(
      <TabRouter
        activeTab="ai"
        composer={null}
        commonTabProps={{ isExpanded: false, onExpandToggle: noop, onHelpClick: noop, onClose: noop }}
        onSwitchToAdd={noop}
        onCreateComponent={noop}
      />,
    );
    expect(await screen.findByTestId("ai-tab-rendered")).toBeInTheDocument();
  });
});

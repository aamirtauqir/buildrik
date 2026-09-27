// @vitest-environment jsdom
/**
 * P-1 — the Inspector ⋯ Delete runs the shared `delete` command.
 *
 * StudioPanels handed the Inspector a bare `elements.removeElement(id)`: no
 * lock check (a locked element was deleted from ⋯ while Delete/Backspace and
 * the canvas menu refused), and no transaction. The command is the one door
 * that drops locked elements and wraps the removal in one undo step, so ⋯
 * Delete goes through it like every other delete.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("../../canvas/Canvas", () => ({ Canvas: React.forwardRef(() => null) }));
vi.mock("../../sidebar/LeftSidebar", () => ({ LeftSidebar: () => null }));
vi.mock("../../sidebar/FullPageView", () => ({ FullPageView: () => null }));
vi.mock("../../sidebar/TabRouter", () => ({
  TabRouter: ({ activeTab }: { activeTab: string }) => <div data-testid={`column-tab-${activeTab}`} />,
}));
vi.mock("../PageTabBar", () => ({ PageTabBar: () => null }));
vi.mock("../../media/components/SiteFontsModal", () => ({ SiteFontsModal: () => null }));
vi.mock("@/editor/design-system", () => {
  const Pass = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  return { TokenRegistryProvider: Pass, DSModeProvider: Pass, StylePresetRegistryProvider: Pass };
});
vi.mock("@/editor/design-system/ui/MigrationProgressMount", () => ({ MigrationProgressMount: () => null }));
vi.mock("@/editor/design-system/ui/DSLintRunner", () => ({ DSLintRunner: () => null }));
vi.mock("@/editor/design-system/ui/ProjectTokensApplier", () => ({ ProjectTokensApplier: () => null }));
vi.mock("../hooks/useBlockInsertion", () => ({ useBlockInsertion: () => ({ handleBlockClick: () => {} }) }));
vi.mock("../hooks/useClipboardToasts", () => ({ useClipboardToasts: () => {} }));
vi.mock("../hooks/useAltTextAutoTrigger", () => ({ useAltTextAutoTrigger: () => {} }));
vi.mock("../../sidebar/tabs/pages/usePageCommands", () => ({ usePageJumpList: () => [], usePageCommands: () => {} }));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
vi.mock("@shared/utils/editorViewMode", () => ({ getEditorViewMode: () => ({ readOnlyView: false }) }));
vi.mock("../hooks/useEditorRole", () => ({ useViewerChrome: () => false }));

/* The inspector body: a button that fires the ⋯ Delete it was handed. */
vi.mock("../../inspector/ProInspector", () => ({
  ProInspector: ({ onDelete }: { onDelete?: (id: string) => void }) => (
    <button data-testid="inspector-delete" onClick={() => onDelete?.("locked-1")}>Delete</button>
  ),
}));
vi.mock("../../sidebar/tabs/ai/AITab", () => ({ AITab: () => null }));

import { ToastProvider } from "@/editor/chrome-ui";
import { StudioPanels, type StudioPanelsProps } from "../StudioPanels";

function makeComposer() {
  const locked = { getId: () => "locked-1", getType: () => "heading", isLocked: () => true };
  return {
    readOnly: false,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    history: { captureUndo: () => () => {} },
    commands: { run: vi.fn() },
    selection: { clear: vi.fn(), select: vi.fn(), getSelectedIds: () => ["locked-1"] },
    elements: { getElement: (id: string) => (id === "locked-1" ? locked : null), removeElement: vi.fn() },
  };
}

afterEach(cleanup);

describe("StudioPanels — Inspector ⋯ Delete (P-1)", () => {
  it("runs the shared delete command instead of removing the element directly", () => {
    const composer = makeComposer();
    render(
      <ToastProvider>
        <StudioPanels
          composer={composer as unknown as StudioPanelsProps["composer"]}
          selectedElement={null}
          device="desktop"
          zoom={100}
          onZoomChange={() => {}}
          blocks={[]}
          onQuickAdd={() => {}}
          isLeftPanelOpen
          onLeftPanelToggle={() => {}}
          leftPanelTab="add"
          onLeftPanelTabChange={() => {}}
        />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("inspector-delete"));
    expect(composer.elements.removeElement).not.toHaveBeenCalled();
    expect(composer.commands.run).toHaveBeenCalledWith("delete");
  });
});

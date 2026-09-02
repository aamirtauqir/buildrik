/**
 * Detach confirm — board 1170:4792.
 *
 * Replaces `DetachConfirmModal.test.tsx`, which asserted the design this
 * board retired: a title naming the instance ("Detach instance #3 from
 * master?"), a "Master: X · 7 instances total" strip, and four glyph bullets
 * about resolved bindings and free-form editing. The board asks one question
 * and answers it in one sentence, so the modal is chrome-ui's ConfirmDialog
 * now and there is no separate component left to test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { ComponentDetailScreen } from "../ComponentDetailScreen";
import { DSModeProvider } from "../../../../design-system/state/DSModeContext";
import type { Composer } from "../../../../../engine";
import type { ComponentDefinition } from "../../../../../shared/types/components";

function makeComponent(): ComponentDefinition {
  return {
    id: "cmp-1",
    name: "Hero banner",
    masterTree: {
      id: "el-master",
      type: "div",
      styles: {},
      children: [],
    } as unknown as ComponentDefinition["masterTree"],
    createdAt: 0,
    updatedAt: 0,
    version: 1,
  };
}

/** Enough composer for the detach path: a selection, and an instance list. */
function makeComposer(selectedId: string | null): Composer {
  return {
    selection: { getSelectedIds: () => (selectedId ? [selectedId] : []) },
    components: { getInstancesOfComponent: () => [{ elementId: "el-1" }] },
  } as unknown as Composer;
}

function renderDetail(composer: Composer, onDetachInstance: () => void) {
  return render(
    <ToastProvider>
      <DSModeProvider initialMode="pro">
        <ComponentDetailScreen
          component={makeComponent()}
          composer={composer}
          onBack={() => {}}
          isInstanceSelected
          selectedElementId="el-1"
          onDetachInstance={onDetachInstance}
        />
      </DSModeProvider>
    </ToastProvider>,
  );
}

describe("ComponentDetailScreen — detach confirm (board 1170:4792)", () => {
  it("asks the board's question and names the component it stops following", () => {
    const onDetach = vi.fn();
    const { getByText, queryByText } = renderDetail(makeComposer("el-1"), onDetach);

    fireEvent.click(getByText(/Detach instance/i));

    expect(getByText("Detach from component?")).toBeTruthy();
    expect(
      getByText(
        /This copy stops receiving updates from "Hero banner"\. The component itself is untouched\./,
      ),
    ).toBeTruthy();
    // The retired body: master/bindings vocabulary aimed at nobody.
    expect(queryByText(/resolved bindings will be snapshotted/i)).toBeNull();
    expect(queryByText(/free-form/i)).toBeNull();
    expect(queryByText(/instances total/i)).toBeNull();
    // Confirming is what detaches — opening the dialog must not.
    expect(onDetach).not.toHaveBeenCalled();
  });

  it("detaches on confirm and not on cancel", () => {
    const onDetach = vi.fn();
    const { getByText } = renderDetail(makeComposer("el-1"), onDetach);

    fireEvent.click(getByText(/Detach instance/i));
    fireEvent.click(getByText("Cancel"));
    expect(onDetach).not.toHaveBeenCalled();

    fireEvent.click(getByText(/Detach instance/i));
    fireEvent.click(getByText("Detach"));
    expect(onDetach).toHaveBeenCalledTimes(1);
  });

  it("skips the confirm when nothing is selected — it would have nothing to name", () => {
    const onDetach = vi.fn();
    const { getByText, queryByText } = renderDetail(makeComposer(null), onDetach);

    fireEvent.click(getByText(/Detach instance/i));
    expect(queryByText("Detach from component?")).toBeNull();
    expect(onDetach).toHaveBeenCalledTimes(1);
  });
});

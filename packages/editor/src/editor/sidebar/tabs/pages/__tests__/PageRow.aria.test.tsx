// @vitest-environment jsdom
/**
 * The Pages list is a valid tree.
 *
 * axe on the live panel returned three criticals at once: `aria-pressed` on a
 * `role="treeitem"` ("ARIA attribute is not allowed"), a `role="listitem"`
 * wrapper inside `role="tree"` ("Element has children which are not allowed"),
 * and the treeitems' missing tree/group parent — the listitem wrapper broke the
 * chain for all six rows.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageRow } from "../components/PageRow";

afterEach(cleanup);

const page = {
  id: "p1",
  name: "Home",
  slug: "home",
  isActive: true,
  status: "draft" as const,
};

function renderRow(extra: Record<string, unknown> = {}) {
  return render(
    <div role="tree" aria-label="Pages">
      <PageRow
        page={page as never}
        pages={[page] as never}
        composer={null as never}
        isRenaming={false}
        onSettingsClick={vi.fn()}
        onSelect={vi.fn()}
        onRenameStart={vi.fn()}
        onRenameCommit={vi.fn()}
        onRenameCancel={vi.fn()}
        onContextMenu={vi.fn()}
        {...extra}
      />
    </div>,
  );
}

describe("PageRow ARIA", () => {
  it("puts no non-tree role between the tree and its items", () => {
    const { container } = renderRow();
    expect(container.querySelector('[role="listitem"]')).toBeNull();
    expect(container.querySelector(".bd-pg-row-wrap")?.getAttribute("role")).toBe("presentation");
    expect(container.querySelector('[role="treeitem"]')).toBeTruthy();
  });

  it("never puts aria-pressed on a treeitem", () => {
    const { container } = renderRow({ onToggleSelect: vi.fn(), isSelected: true });
    const item = container.querySelector('[role="treeitem"]')!;
    expect(item.hasAttribute("aria-pressed")).toBe(false);
    // The multi-select state rides on aria-selected, which a treeitem allows.
    expect(item.getAttribute("aria-selected")).toBe("true");
  });

  it("still reports the active page when multi-select isn't wired", () => {
    const { container } = renderRow();
    expect(container.querySelector('[role="treeitem"]')!.getAttribute("aria-selected")).toBe("true");
  });
});

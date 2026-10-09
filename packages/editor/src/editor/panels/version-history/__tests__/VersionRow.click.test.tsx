/**
 * L5-045: clicking a version row or its "N changes" did nothing — every action
 * lived in a hover-only ⋯. The row opens the save's details; "N changes"
 * opens the compare.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VersionRow } from "../VersionList";
import type { NamedVersion } from "@/shared/types/versions";

const version = { id: "v1", name: "Launch", createdAt: Date.now(), isAutoCheckpoint: false, snapshot: {} } as unknown as NamedVersion;

function renderRow() {
  const props = {
    onRestore: vi.fn(),
    onDeleteRequest: vi.fn(),
    onDeleteConfirm: vi.fn(),
    onDeleteCancel: vi.fn(),
    onCompare: vi.fn(),
    onDetails: vi.fn(),
    onRename: vi.fn(),
  };
  render(<VersionRow version={version} isRestoring={false} isDeleteConfirm={false} changeCount={7} {...props} />);
  return props;
}

describe("VersionRow clicks", () => {
  it("a click on the row opens the save's details", () => {
    const p = renderRow();
    fireEvent.click(screen.getByText("Launch"));
    expect(p.onDetails).toHaveBeenCalledTimes(1);
  });

  it("'7 changes' opens the compare, not the details", () => {
    const p = renderRow();
    fireEvent.click(screen.getByRole("button", { name: 'Show the 7 changes in "Launch"' }));
    expect(p.onCompare).toHaveBeenCalledTimes(1);
    expect(p.onDetails).not.toHaveBeenCalled();
  });

  it("the ⋯ button does not also open the details", () => {
    const p = renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Launch actions" }));
    expect(p.onDetails).not.toHaveBeenCalled();
  });
});

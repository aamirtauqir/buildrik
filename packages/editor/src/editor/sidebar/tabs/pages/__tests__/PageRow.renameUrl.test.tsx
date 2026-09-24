/**
 * G2-076 — a rename that would move the page's URL asks Keep URL / Update URL
 * (boards 4418:91805 / 6881:94598 / 6887:78797).
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageRow } from "../components/PageRow";
import type { PageItem } from "../types";

const about: PageItem = { id: "p2", name: "About", slug: "about", isHome: false, isActive: false, status: "live" };

function renaming(page: PageItem = about) {
  const onRenameCommit = vi.fn();
  const onRenameCancel = vi.fn();
  render(
    <PageRow
      page={page}
      pages={[]}
      composer={null}
      isRenaming
      onSelect={vi.fn()}
      onRenameCommit={onRenameCommit}
      onRenameCancel={onRenameCancel}
      onRenameStart={vi.fn()}
      onContextMenu={vi.fn()}
    />
  );
  const input = screen.getByLabelText("Rename page");
  fireEvent.change(input, { target: { value: "Our story" } });
  fireEvent.keyDown(input, { key: "Enter" });
  return { onRenameCommit, onRenameCancel };
}

describe("PageRow — rename URL decision", () => {
  it("asks before moving the URL, and commits nothing yet", () => {
    const { onRenameCommit } = renaming();
    expect(screen.getByText("URL: /about → /our-story?")).toBeTruthy();
    expect(onRenameCommit).not.toHaveBeenCalled();
  });

  it("Keep URL renames only; Update URL renames and moves the URL", () => {
    const a = renaming();
    fireEvent.click(screen.getByRole("button", { name: "Keep URL" }));
    expect(a.onRenameCommit).toHaveBeenCalledWith("Our story", false);
  });

  it("Update URL", () => {
    const { onRenameCommit } = renaming();
    fireEvent.click(screen.getByRole("button", { name: "Update URL" }));
    expect(onRenameCommit).toHaveBeenCalledWith("Our story", true);
  });

  it("Cancel rename cancels", () => {
    const { onRenameCommit, onRenameCancel } = renaming();
    fireEvent.click(screen.getByRole("button", { name: "Cancel rename" }));
    expect(onRenameCancel).toHaveBeenCalled();
    expect(onRenameCommit).not.toHaveBeenCalled();
  });

  it("the home page never asks — it answers on / whatever its name", () => {
    const { onRenameCommit } = renaming({ ...about, id: "p1", isHome: true, slug: "home" });
    expect(screen.queryByText(/URL:/)).toBeNull();
    expect(onRenameCommit).toHaveBeenCalledWith("Our story", undefined);
  });
});

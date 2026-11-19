/**
 * ConflictReviewDialog (design-2l9 165:2414) with L3-021 / L3-022: Use theirs
 * waits until the server's copy is in hand, and Keep mine overwrites exactly
 * the revision the dialog showed.
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import type { CMSField } from "@/shared/types/cms";
import type { CmsConflict, CmsServerRecord } from "@/services/cmsSync";
import { ConflictReviewDialog } from "../ConflictReviewDialog";

const fields = [
  { id: "f1", slug: "title", name: "Title", type: "text" },
  { id: "f2", slug: "summary", name: "Summary", type: "text" },
] as CMSField[];

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mount(theirs: () => Promise<CmsServerRecord | null>) {
  const onKeepMine = vi.fn();
  const onUseTheirs = vi.fn();
  const conflict: CmsConflict = {
    kind: "entry",
    id: "e1",
    keepMine: vi.fn(async () => true),
    useTheirs: vi.fn(async () => {}),
    mine: { title: "Mine", summary: "Same" },
    theirs,
  };
  render(
    <ToastProvider>
      <ConflictReviewDialog
        open
        conflict={conflict}
        fields={fields}
        base={{ title: "Base", summary: "Same" }}
        resolving={false}
        onCancel={vi.fn()}
        onKeepMine={onKeepMine}
        onUseTheirs={onUseTheirs}
      />
    </ToastProvider>,
  );
  return { onKeepMine, onUseTheirs };
}

const useTheirs = () => screen.getByTestId("cms-sheet-use-theirs") as HTMLButtonElement;

describe("ConflictReviewDialog — L3-021 / L3-022", () => {
  it("Use theirs stays disabled until the server's copy has loaded", async () => {
    const read = deferred<CmsServerRecord | null>();
    mount(() => read.promise);
    expect(useTheirs().disabled).toBe(true);
    await act(async () => read.resolve({ data: { title: "Theirs", summary: "Same" }, updatedAt: "2026-11-19T10:00:00.000Z" }));
    expect(useTheirs().disabled).toBe(false);
    expect(screen.getByTestId("cms-conflict-field-title")).toHaveTextContent("Theirs · latest saved: Theirs");
  });

  it("a failed read keeps Use theirs disabled; Keep mine still sends the whole copy", async () => {
    const { onKeepMine } = mount(() => Promise.reject(new Error("offline")));
    await act(async () => {});
    expect(useTheirs().disabled).toBe(true);
    fireEvent.click(screen.getByTestId("cms-sheet-keep-mine"));
    expect(onKeepMine).toHaveBeenCalledWith(undefined, undefined);
  });

  it("Keep mine applies the changed fields over the latest copy and names its revision", async () => {
    const { onKeepMine } = mount(async () => ({ data: { title: "Theirs", summary: "Edited there" }, updatedAt: "2026-11-19T10:00:00.000Z" }));
    await act(async () => {});
    fireEvent.click(screen.getByTestId("cms-sheet-keep-mine"));
    expect(onKeepMine).toHaveBeenCalledWith({ title: "Mine", summary: "Edited there" }, "2026-11-19T10:00:00.000Z");
  });

  it("a record the server no longer has still offers Use theirs", async () => {
    const { onUseTheirs } = mount(async () => null);
    await act(async () => {});
    expect(useTheirs().disabled).toBe(false);
    fireEvent.click(useTheirs());
    expect(onUseTheirs).toHaveBeenCalledTimes(1);
  });
});

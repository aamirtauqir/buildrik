/**
 * usePageCommands — the Pages panel's rows in the one ⌘K palette exist
 * exactly while the panel is mounted (decision #38's `when: pagesActive`,
 * realised as registration lifetime), and follow the page list.
 *
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandCenter } from "@/engine/commands/CommandCenter";
import type { Composer } from "@/engine";
import type { PageItem } from "../types";
import { usePageCommands, NEW_PAGE_COMMAND_ID, goToPageCommandId, PAGE_COMMAND_GROUP } from "../usePageCommands";

/** A real CommandCenter on a stub composer — the registry is what the palette reads. */
function composerWithRegistry() {
  const composer = { emit: vi.fn(), readOnly: false } as unknown as Composer & { commands: CommandCenter };
  composer.commands = new CommandCenter(composer);
  return composer;
}

const pages: PageItem[] = [
  { id: "p-home", name: "Home", isHome: true } as PageItem,
  { id: "p-about", name: "About" } as PageItem,
];

describe("usePageCommands", () => {
  it("registers New page and one Go-to row per page while mounted, under the Pages group", () => {
    const composer = composerWithRegistry();
    const selectPage = vi.fn();
    const addPage = vi.fn();
    const { unmount } = renderHook(() => usePageCommands(composer, pages, selectPage, addPage));

    const ids = composer.commands.getAll().filter((c) => c.group === PAGE_COMMAND_GROUP).map((c) => c.id);
    expect(ids).toEqual([NEW_PAGE_COMMAND_ID, goToPageCommandId("p-home"), goToPageCommandId("p-about")]);
    expect(composer.commands.get(goToPageCommandId("p-home"))?.label).toBe("Go to Home (home)");
    expect(composer.commands.get(goToPageCommandId("p-about"))?.label).toBe("Go to About");

    composer.commands.run(goToPageCommandId("p-about"));
    expect(selectPage).toHaveBeenCalledWith("p-about");
    composer.commands.run(NEW_PAGE_COMMAND_ID);
    expect(addPage).toHaveBeenCalledTimes(1);

    unmount();
    expect(composer.commands.getAll().some((c) => c.group === PAGE_COMMAND_GROUP)).toBe(false);
  });

  it("follows a rename without leaving a stale row behind", () => {
    const composer = composerWithRegistry();
    const { rerender } = renderHook(
      ({ list }: { list: PageItem[] }) => usePageCommands(composer, list, vi.fn(), vi.fn()),
      { initialProps: { list: pages } },
    );
    rerender({ list: [pages[0], { id: "p-about", name: "Team" } as PageItem] });
    expect(composer.commands.get(goToPageCommandId("p-about"))?.label).toBe("Go to Team");
    expect(composer.commands.getAll().filter((c) => c.group === PAGE_COMMAND_GROUP)).toHaveLength(3);
  });

  it("a new callback identity does not re-register — the latest callback still runs", () => {
    const composer = composerWithRegistry();
    const first = vi.fn();
    const second = vi.fn();
    const registered = vi.spyOn(composer.commands, "register");
    const { rerender } = renderHook(
      ({ select }: { select: (id: string) => void }) => usePageCommands(composer, pages, select, vi.fn()),
      { initialProps: { select: first } },
    );
    const calls = registered.mock.calls.length;
    rerender({ select: second });
    expect(registered.mock.calls.length).toBe(calls);
    composer.commands.run(goToPageCommandId("p-home"));
    expect(second).toHaveBeenCalledWith("p-home");
    expect(first).not.toHaveBeenCalled();
  });

  it("does nothing without a composer", () => {
    expect(() => renderHook(() => usePageCommands(null, pages, vi.fn(), vi.fn()))).not.toThrow();
  });
});

/**
 * History → All changes restores the state the row names.
 *
 * `buildHistoryDisplayEntries` stores the real undoStack index on each row, but
 * `getEntrySnapshot`/`restoreEntry` added one to it. Every lookup landed a step
 * late: the newest row resolved past the end of the stack (null / false — the
 * click did nothing), and every other row previewed and restored the state
 * AFTER the change it names. Measured in the editor on a three-step stack
 * (loaded → insert heading → inline edit): the "Inline Edit" row returned no
 * snapshot and the "Added block" row returned the edited text.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Composer } from "@/engine/Composer";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {},
    clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
});

function threeStepProject() {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [
      {
        id: "p1",
        name: "Home",
        slug: "home",
        isHome: true,
        root: { id: "root", type: "container", tagName: "div", children: [] },
      },
    ],
    styles: [],
    assets: [],
  } as never);

  const page = composer.elements.getActivePage()!;
  const root = composer.elements.getElement(page.root.id)!;

  composer.beginTransaction("Added block");
  const el = composer.elements.createElement("heading", { content: "Heading" });
  root.addChild(el);
  composer.markDirty();
  composer.endTransaction();
  vi.advanceTimersByTime(600);

  composer.beginTransaction("Inline Edit");
  composer.elements.getElement(el.getId())!.setContent("Edited headline");
  composer.endTransaction();
  vi.advanceTimersByTime(600);

  return { composer, id: el.getId() };
}

const contentOf = (snapshot: unknown, id: string): string | null => {
  const find = (n: { id: string; content?: string; children?: unknown[] }): typeof n | null =>
    n.id === id
      ? n
      : ((n.children ?? []) as (typeof n)[]).reduce<typeof n | null>((acc, k) => acc ?? find(k), null);
  const pages = (snapshot as { pages: { root: { id: string } }[] }).pages;
  const hit = pages.map((p) => find(p.root as never)).find(Boolean);
  return hit?.content ?? null;
};

describe("history entry lookup", () => {
  it("previews the state each row names", () => {
    vi.useFakeTimers();
    const { composer, id } = threeStepProject();
    const rows = composer.history.getHistoryStack();
    /* The formatter title-cases only the first word. */
    expect(rows.map((r) => r.label)).toEqual(["Inline edit", "Added block"]);

    const newest = composer.history.getEntrySnapshot(rows[0].id);
    expect(newest, "the newest row must resolve").toBeTruthy();
    expect(contentOf(newest, id)).toBe("Edited headline");

    const older = composer.history.getEntrySnapshot(rows[1].id);
    expect(contentOf(older, id)).toBe("Heading");
    vi.useRealTimers();
  });

  it("restores the state the row names", () => {
    vi.useFakeTimers();
    const { composer, id } = threeStepProject();
    const rows = composer.history.getHistoryStack();

    expect(composer.history.restoreEntry(rows[1].id)).toBe(true);
    expect(composer.elements.getElement(id)?.getContent()).toBe("Heading");
    vi.useRealTimers();
  });

  it("restoring the newest row is not a silent no-op", () => {
    vi.useFakeTimers();
    const { composer } = threeStepProject();
    const rows = composer.history.getHistoryStack();
    expect(composer.history.restoreEntry(rows[0].id)).toBe(true);
    vi.useRealTimers();
  });
});

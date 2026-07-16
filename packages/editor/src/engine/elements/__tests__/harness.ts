/**
 * Shared fake-Composer harness for engine element/component unit tests.
 *
 * ElementManager (and Element via its delegates) only touch a narrow slice of
 * Composer: emit / markDirty / on / begin+endTransaction, `selection`, and the
 * optional `components` facade. Faking that slice lets the suites exercise the
 * REAL element tree logic without bootstrapping the full Composer (canvas,
 * storage, plugins, ...), keeping these tests fast and deterministic.
 *
 * Not a test file — the vitest include glob only picks up *.test.ts.
 *
 * @license BSD-3-Clause
 */
import { vi, type Mock } from "vitest";
import type { Composer } from "../../Composer";
import { ElementManager } from "../ElementManager";

export interface FakeSelection {
  getSelected: Mock;
  getAllSelected: Mock;
  getSelectedIds: Mock;
  select: Mock;
  clear: Mock;
  removeFromSelection: Mock;
}

export interface FakeComposer {
  emit: Mock;
  on: Mock;
  markDirty: Mock;
  beginTransaction: Mock;
  endTransaction: Mock;
  selection: FakeSelection;
  /** Optional ComponentManager facade — tests wire what they need. */
  components?: {
    recordInstanceOverride?: (...args: unknown[]) => void;
    getOverridesForElement?: (elementId: string) => Record<string, string>;
    findInstanceContainingElement?: (elementId: string) => unknown;
  };
  elements: ElementManager;
}

export function makeEngine(): { composer: FakeComposer; manager: ElementManager } {
  const composer = {
    emit: vi.fn(),
    on: vi.fn(),
    markDirty: vi.fn(),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    selection: {
      getSelected: vi.fn(() => null),
      getAllSelected: vi.fn(() => []),
      getSelectedIds: vi.fn(() => []),
      select: vi.fn(),
      clear: vi.fn(),
      removeFromSelection: vi.fn(),
    },
    components: undefined,
  } as unknown as FakeComposer;

  const manager = new ElementManager(composer as unknown as Composer);
  composer.elements = manager;
  return { composer, manager };
}

/** All emit calls for one event name. */
export function emitsOf(composer: FakeComposer, event: string): unknown[][] {
  return composer.emit.mock.calls.filter((c) => c[0] === event);
}

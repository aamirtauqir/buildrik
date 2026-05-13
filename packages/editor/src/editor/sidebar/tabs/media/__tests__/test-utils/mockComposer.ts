import { vi } from "vitest";
import type { Composer } from "../../../../../../engine/Composer";

interface MockComposerOpts {
  libraryItems?: unknown[];
  folders?: unknown[];
  storage?: { used: number; total: number };
}

export function mockComposer(opts: MockComposerOpts = {}): Composer {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  const media = {
    on: vi.fn((event: string, cb: (payload: unknown) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: (payload: unknown) => void) => {
      listeners.get(event)?.delete(cb);
    }),
    emit: vi.fn(),
    emitEvent: vi.fn(),
    getLibraryItems: vi.fn(() => opts.libraryItems ?? []),
    getFolders: vi.fn(() => opts.folders ?? []),
    getStorage: vi.fn(() => opts.storage ?? { used: 0, total: 5e9 }),
  };
  return {
    media,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Composer;
}

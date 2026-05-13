import type { LibraryItem } from "../../data/mediaTypes";

function buildMockState() {
  return {
    libraryItems: [] as LibraryItem[],
    activeType: "all" as const,
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    storage: { used: 0, total: 5_000_000_000 },
    selectionContext: null as { elementId: string; label?: string } | null,
    panelExpanded: false,
    uploadQueue: [] as unknown[],
    selMode: false,
    selectedKeys: new Set<string>(),
    librarySearch: "",
    sort: "recent" as const,
    sortDir: "desc" as const,
    gridN: 3,
    fmtFilter: null as string | null,
    folders: [] as unknown[],
    allFolders: [] as unknown[],
    usageMap: new Map<string, number>(),
    upload: (_files: File[]) => {},
    setSelectionContext: (_ctx: unknown) => {},
    setType: (_t: unknown) => {},
    setPanelExpanded: (_expanded: boolean) => {},
    insertToCanvas: (_key: string) => {},
  };
}

export function mockMediaState(overrides: Partial<ReturnType<typeof buildMockState>> = {}) {
  return { ...buildMockState(), ...overrides };
}

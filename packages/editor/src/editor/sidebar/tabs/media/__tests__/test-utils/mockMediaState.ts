import type { LibraryItem } from "../../data/mediaTypes";

export function mockMediaState(overrides: Record<string, unknown> = {}) {
  return {
    libraryItems: [] as LibraryItem[],
    activeType: "all" as const,
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    storage: { used: 0, total: 5_000_000_000 },
    selectionContext: null,
    panelExpanded: false,
    uploadQueue: [],
    selMode: false,
    selectedKeys: new Set<string>(),
    librarySearch: "",
    sort: "recent",
    sortDir: "desc",
    gridN: 3,
    fmtFilter: null,
    folders: [],
    usageMap: new Map<string, number>(),
    upload: () => {},
    setSelectionContext: () => {},
    setType: () => {},
    setPanelExpanded: () => {},
    insertToCanvas: () => {},
    ...overrides,
  };
}

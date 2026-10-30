/**
 * The note under the Pages list, until another page is opened — design-2l9
 * boards 63:20585 (a page that left the list and came back: ⌘Z after a
 * delete, named with its way in) and 63:23182 (a rename that kept its URL,
 * set by the caller).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { PageItem } from "./types";

export interface PagesNotice {
  text: string;
  open?: { id: string; label: string };
}

export function usePagesNotice(pages: ReadonlyArray<PageItem>) {
  const [notice, setNotice] = React.useState<PagesNotice | null>(null);
  const seen = React.useRef<{ ids: Set<string>; gone: Set<string> }>({ ids: new Set(), gone: new Set() });
  React.useEffect(() => {
    const now = new Set(pages.map((pg) => pg.id));
    const { ids, gone } = seen.current;
    for (const id of ids) {
      if (!now.has(id)) gone.add(id);
    }
    for (const pg of pages) {
      if (gone.has(pg.id)) {
        gone.delete(pg.id);
        setNotice({
          text: `${pg.name} restored. Page settings and URL retained.`,
          open: { id: pg.id, label: `Open ${pg.name} in Editor` },
        });
      }
    }
    seen.current.ids = now;
  }, [pages]);
  return { notice, setNotice };
}

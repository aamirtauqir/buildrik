/**
 * LibraryDetailPane — 2L9 215:44616 (B6-K04): the summary of a workspace
 * library master chosen in the Component library scope. Same frame as a site
 * master's summary (215:47035): preview, name, scope chip, two links, then
 * "Insert on this site", which adopts the master under its shared id and
 * inserts it (insertLibraryComponent — the same path as Add's FROM LIBRARY).
 *
 * Not drawn: the version in the chip and "Restricted" (the library read has
 * neither a version nor whether this user can open the source site), and the
 * More actions menu (its actions belong to the master's own site).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";
import { ELEMENT_TYPE_LABELS } from "@/shared/constants/elementTypeLabels";
import { fetchLibraryComponent, type LibraryComponentEntry } from "@/services/componentSync";
import { insertLibraryComponent } from "./instantiate";

export interface LibraryDetailPaneProps {
  entry: LibraryComponentEntry;
  composer: Composer;
  /** Escape closes the pane. */
  onClose: () => void;
}

/* 215:44627 — a 13/500 accent link, 12 in, 32 high (as 215:47046). */
const LINK = "tw:h-8 tw:w-full tw:justify-start tw:pl-3 tw:text-[13px] tw:font-medium";
const LIST_ROW = "tw:flex tw:items-center tw:gap-2 tw:h-8 tw:pl-3 tw:pr-1 tw:rounded tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const ROW_META = "tw:ml-auto tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap";

const sites = (n: number) => `${n} ${n === 1 ? "site" : "sites"}`;

export const LibraryDetailPane: React.FC<LibraryDetailPaneProps> = ({ entry, composer, onClose }) => {
  const { addToast } = useToast();
  const [definition, setDefinition] = React.useState<ComponentDefinition | null>(null);
  const [open, setOpen] = React.useState<"sites" | "structure" | null>(null);
  const [inserting, setInserting] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    setDefinition(null);
    setOpen(null);
    void fetchLibraryComponent(entry.componentId)
      .then((d) => live && setDefinition(d))
      .catch(() => live && setDefinition(null));
    return () => {
      live = false;
    };
  }, [entry.componentId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const structure = definition?.masterTree?.children ?? [];
  const toggle = (which: "sites" | "structure") => setOpen((v) => (v === which ? null : which));

  const insert = async () => {
    setInserting(true);
    try {
      addToast(await insertLibraryComponent(composer, entry.componentId, fetchLibraryComponent));
    } finally {
      setInserting(false);
    }
  };

  return (
    <aside
      aria-label={`${entry.name} component`}
      className="tw:flex tw:h-full tw:min-h-0 tw:w-80 tw:shrink-0 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:border-l tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-6"
      data-testid="library-master"
    >
      {/* 215:44619 — 272×152 preview on bg-subtle. */}
      <div className="tw:flex tw:h-[152px] tw:w-full tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded tw:bg-[var(--bk-bg-subtle)]">
        {definition?.thumbnail ? (
          <img src={definition.thumbnail} alt={entry.name} className="tw:max-h-full tw:max-w-full tw:object-contain" />
        ) : (
          <span className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">No preview yet</span>
        )}
      </div>

      {/* 215:44623 — the name, 16/24/600. */}
      <h3 className="tw:m-0 tw:truncate tw:text-[16px] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="library-name">
        {entry.name}
      </h3>

      {/* 215:44624 — where the master lives. */}
      <div className="tw:flex tw:gap-1.5">
        <span className="tw:inline-flex tw:h-[22px] tw:items-center tw:rounded-full tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[11px] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink-soft)]">
          Component library
        </span>
      </div>

      <div className="tw:flex tw:flex-col">
        {/* 215:44627 — "Not on this site yet ›": which sites carry it. */}
        <Button
          variant="link"
          size="xs"
          className={LINK}
          aria-expanded={open === "sites"}
          onClick={() => toggle("sites")}
          data-testid="library-sites-toggle"
        >
          {entry.onThisSite ? "On this site ›" : "Not on this site yet ›"}
        </Button>
        {open === "sites" ? (
          <p className="tw:m-0 tw:py-1 tw:pl-3 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="library-sites">
            Used on {sites(entry.siteCount)} in this workspace.
            {entry.onThisSite ? "" : " Insert it to add it here."}
          </p>
        ) : null}
        {/* 215:44629 — the master's parts, read from the library copy. */}
        <Button
          variant="link"
          size="xs"
          className={LINK}
          aria-expanded={open === "structure"}
          disabled={!definition}
          onClick={() => toggle("structure")}
          data-testid="library-structure-toggle"
        >
          Structure{definition ? ` · ${structure.length}` : ""} ›
        </Button>
        {open === "structure"
          ? structure.map((child, i) => (
              <div key={child.id ?? i} className={LIST_ROW} data-testid="library-structure-row">
                <span className="tw:truncate">
                  {(typeof child.data?.layerName === "string" ? child.data.layerName : undefined) ?? ELEMENT_TYPE_LABELS[child.type] ?? child.type}
                </span>
                <span className={ROW_META}>{child.type}</span>
              </div>
            ))
          : null}
      </div>

      {/* 215:44632 — the primary action. */}
      <Button
        size="xs"
        onClick={() => void insert()}
        disabled={inserting}
        data-testid="library-insert"
        className="tw:h-8 tw:w-full tw:rounded tw:text-[13px] tw:font-medium tw:focus:ring-0"
      >
        Insert on this site
      </Button>
    </aside>
  );
};

export default LibraryDetailPane;

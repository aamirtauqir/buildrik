/**
 * The site as a tree of routes.
 *
 * The only site-wide view was Listings, a flat SEO table. No hierarchy, no
 * navigation graph, no sitemap — a user could not see how their pages relate.
 * Routes already carry the hierarchy: /pricing/teams sits under /pricing.
 * This reads it off the pages the panel already holds; nothing new is stored.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { PageItem } from "../types";
import { pageRoute } from "../utils/slug";
import type { CollectionPagesRow } from "../useDynamicPagesSummary";

interface Node { segment: string; path: string; page: PageItem | null; children: Node[] }

export function buildRouteTree(pages: ReadonlyArray<PageItem>): Node {
  const root: Node = { segment: "", path: "/", page: null, children: [] };
  for (const p of [...pages].sort((a, b) => pageRoute(a).localeCompare(pageRoute(b)))) {
    const route = pageRoute(p);
    if (route === "/") { root.page = root.page ?? p; continue; }
    let node = root;
    let acc = "";
    for (const seg of route.split("/").filter(Boolean)) {
      acc += `/${seg}`;
      let next = node.children.find((c) => c.segment === seg);
      if (!next) { next = { segment: seg, path: acc, page: null, children: [] }; node.children.push(next); }
      node = next;
    }
    node.page = node.page ?? p;
  }
  return root;
}

export interface SiteStructureTreeProps {
  pages: ReadonlyArray<PageItem>;
  onSelectPage: (id: string) => void;
  /** The published host ("fieldwork.studio"), when the site has one. */
  host?: string | null;
  /** Pages CMS collections publish, by their URL pattern. */
  collections?: readonly CollectionPagesRow[];
}

const Branch: React.FC<{ node: Node; depth: number; onSelectPage: (id: string) => void }> = ({ node, depth, onSelectPage }) => (
  <li>
    <div className="tw:flex tw:items-center tw:gap-2 tw:text-[12px]" style={{ paddingLeft: depth * 14 }}>
      <span aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]">{node.children.length ? "▾" : "·"}</span>
      {node.page ? (
        <Button
          color="light"
          size="xs"
          onClick={() => onSelectPage(node.page!.id)}
          className={`tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[12px] ${node.page.isActive ? "tw:text-[var(--bk-accent)]" : "tw:text-[var(--bk-ink)]"}`}
        >
          {node.page.name}
        </Button>
      ) : (
        /* A segment with no page of its own — /pricing/teams exists, /pricing
           does not. Shown, not hidden, because a gap in the tree is a fact
           about the site. */
        <span className="tw:text-[var(--bk-ink-muted)]">{node.segment}/ <em>(no page)</em></span>
      )}
      <span className="tw:text-[11px] tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-mono)]">{node.path}</span>
    </div>
    {node.children.length > 0 && (
      <ul className="tw:m-0 tw:list-none tw:p-0">
        {node.children.map((c) => <Branch key={c.path} node={c} depth={depth + 1} onSelectPage={onSelectPage} />)}
      </ul>
    )}
  </li>
);

const MUTED = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/* design-2l9 board 63:21939: "URL structure", the host as the site root, the
   route tree, the collection patterns, and a note that folders are not here. */
export const SiteStructureTree: React.FC<SiteStructureTreeProps> = ({ pages, onSelectPage, host, collections = [] }) => {
  const tree = React.useMemo(() => buildRouteTree(pages), [pages]);
  return (
    <div className="tw:flex tw:h-full tw:min-h-0 tw:flex-col tw:gap-2 tw:overflow-auto tw:p-3" data-testid="pages-structure" aria-label="Site structure">
      <div className="tw:flex tw:flex-col" data-testid="pages-structure-head">
        <span className="tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">URL structure</span>
        <span className={MUTED}>
          {host ? <span className="tw:[font-family:var(--bk-font-mono)]">{host}</span> : null}
          {host ? " · " : ""}Site root
        </span>
      </div>
      <ul className="tw:m-0 tw:list-none tw:p-0" role="tree" aria-label="Pages by route">
        <Branch node={tree} depth={0} onSelectPage={onSelectPage} />
      </ul>
      {collections.length > 0 && (
        <ul className="tw:m-0 tw:list-none tw:p-0" aria-label="Collection pages by route" data-testid="pages-structure-collections">
          {collections.map((c) => (
            <li key={c.id} className="tw:flex tw:items-center tw:gap-2 tw:text-[12px]">
              <span aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]">·</span>
              <span className="tw:text-[var(--bk-ink)]">{c.name}</span>
              <span className="tw:text-[11px] tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-mono)]">{c.pattern}</span>
              <span className={`${MUTED} tw:tabular-nums`}>{`${c.count} page${c.count === 1 ? "" : "s"}`}</span>
            </li>
          ))}
        </ul>
      )}
      <p className={`tw:m-0 ${MUTED}`}>This view follows page URLs. My folders stay in Pages.</p>
    </div>
  );
};

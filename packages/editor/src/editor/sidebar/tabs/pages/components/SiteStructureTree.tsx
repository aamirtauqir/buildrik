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

interface Node { segment: string; path: string; page: PageItem | null; children: Node[] }

export function buildRouteTree(pages: ReadonlyArray<PageItem>): Node {
  const root: Node = { segment: "", path: "/", page: null, children: [] };
  const routeOf = (p: PageItem) => (p.isHome ? "/" : (p.route ?? `/${p.slug}`).replace(/\/+$/, "") || "/");
  for (const p of [...pages].sort((a, b) => routeOf(a).localeCompare(routeOf(b)))) {
    const route = routeOf(p);
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
  onBack: () => void;
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

export const SiteStructureTree: React.FC<SiteStructureTreeProps> = ({ pages, onSelectPage, onBack }) => {
  const tree = React.useMemo(() => buildRouteTree(pages), [pages]);
  return (
    <div className="tw:flex tw:h-full tw:min-h-0 tw:flex-col tw:gap-2 tw:overflow-auto tw:p-3" data-testid="pages-structure" aria-label="Site structure">
      <Button color="light" size="xs" onClick={onBack} className="tw:self-start tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-ink-soft)]" data-testid="pages-structure-back">
        ‹ Pages
      </Button>
      <p className="tw:m-0 tw:text-[12px] tw:text-[var(--bk-ink-soft)]">{pages.length} page{pages.length === 1 ? "" : "s"}, by route.</p>
      <ul className="tw:m-0 tw:list-none tw:p-0" role="tree" aria-label="Pages by route">
        <Branch node={tree} depth={0} onSelectPage={onSelectPage} />
      </ul>
    </div>
  );
};

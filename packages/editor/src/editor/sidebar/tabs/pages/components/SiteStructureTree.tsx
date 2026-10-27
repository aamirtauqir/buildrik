/**
 * The site as a tree of routes, design-2l9 board 63:21939.
 *
 * Routes already carry the hierarchy: /pricing/teams sits under /pricing.
 * This reads it off the pages the panel already holds; nothing new is stored.
 * The board draws "URL structure", the host as the site root, every page as a
 * row (glyph, name over URL, ⋯) one step in, a segment with no page of its own
 * as a folder ("Blog /blog"), the collection patterns under their segment
 * ("Blog post /blog/{slug} · 20 pages"), and the note that folders are not
 * here.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { File, Folder, House } from "lucide-react";
import { IconButton } from "@/editor/chrome-ui";
import type { PageItem } from "../types";
import { pageRoute } from "../utils/slug";
import type { CollectionPagesRow } from "../useDynamicPagesSummary";

interface Node {
  segment: string;
  path: string;
  page: PageItem | null;
  collection: CollectionPagesRow | null;
  children: Node[];
}

const node = (segment: string, path: string): Node => ({ segment, path, page: null, collection: null, children: [] });

/** Walks (and grows) the tree down `route`'s segments; returns the last node. */
function at(root: Node, route: string): Node {
  let cur = root;
  let acc = "";
  for (const seg of route.split("/").filter(Boolean)) {
    acc += `/${seg}`;
    let next = cur.children.find((c) => c.segment === seg && !c.collection);
    if (!next) {
      next = node(seg, acc);
      cur.children.push(next);
    }
    cur = next;
  }
  return cur;
}

export function buildRouteTree(pages: ReadonlyArray<PageItem>, collections: readonly CollectionPagesRow[] = []): Node {
  const root = node("", "/");
  /* Site order, not alphabetical — the board lists About · Work · Contact · Legal. */
  for (const p of pages) {
    const route = pageRoute(p);
    if (route === "/") {
      root.page = root.page ?? p;
      continue;
    }
    const n = at(root, route);
    n.page = n.page ?? p;
  }
  for (const c of collections) {
    const parent = at(root, c.pattern.split("/").slice(0, -1).join("/"));
    parent.children.push({ ...node(c.pattern, c.pattern), collection: c });
  }
  return root;
}

export interface SiteStructureTreeProps {
  pages: ReadonlyArray<PageItem>;
  onSelectPage: (id: string) => void;
  /** A page row's ⋯ — the page menu at the click. */
  onRowMenu?: (pageId: string, x: number, y: number) => void;
  /** The published host ("fieldwork.studio"), when the site has one. */
  host?: string | null;
  /** Pages CMS collections publish, by their URL pattern. */
  collections?: readonly CollectionPagesRow[];
  /** The Pages search, applied to names and URLs. */
  search?: string;
}

const ROW = "tw:flex tw:h-13 tw:items-center tw:gap-2 tw:rounded-md tw:pr-1";
const NAME = "tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const SUB = "tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const GLYPH = "tw:shrink-0 tw:text-[var(--bk-ink-soft)]";
const INDENT = 24;

const Text: React.FC<{ name: string; sub: string }> = ({ name, sub }) => (
  <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
    <span className={NAME}>{name}</span>
    <span className={SUB}>{sub}</span>
  </span>
);

const titleOf = (segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1);

const Branch: React.FC<{
  n: Node;
  depth: number;
  onSelectPage: (id: string) => void;
  onRowMenu?: (pageId: string, x: number, y: number) => void;
}> = ({ n, depth, onSelectPage, onRowMenu }) => {
  const pad = { paddingLeft: 8 + depth * INDENT };
  const page = n.page;
  return (
    <>
      {n.collection ? (
        <div role="treeitem" aria-level={depth + 1} className={ROW} style={pad} data-testid={`structure-collection-${n.collection.id}`}>
          <File size={16} strokeWidth={1.8} className={GLYPH} aria-hidden="true" />
          <Text name={n.collection.name} sub={n.collection.pattern} />
          <span className="tw:shrink-0 tw:pr-2 tw:text-[12px] tw:tabular-nums tw:text-[var(--bk-ink-muted)]">
            {`${n.collection.count} page${n.collection.count === 1 ? "" : "s"}`}
          </span>
        </div>
      ) : page ? (
        <div
          role="treeitem"
          aria-level={depth + 1}
          tabIndex={0}
          className={`${ROW} tw:cursor-pointer hover:tw:bg-[var(--bk-bg-subtle)]`}
          style={pad}
          data-testid={`structure-page-${page.id}`}
          onClick={() => onSelectPage(page.id)}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onSelectPage(page.id);
            }
          }}
        >
          {page.isHome ? <House size={16} strokeWidth={1.8} className={GLYPH} aria-hidden="true" /> : <File size={16} strokeWidth={1.8} className={GLYPH} aria-hidden="true" />}
          <Text name={page.name} sub={n.path === "/" ? "/" : pageRoute(page)} />
          {onRowMenu && (
            <IconButton
              label={`More options for ${page.name}`}
              aria-haspopup="menu"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onRowMenu(page.id, Math.min(e.clientX, window.innerWidth - 288), e.clientY);
              }}
            >
              ⋯
            </IconButton>
          )}
        </div>
      ) : (
        /* A segment with no page of its own — /blog/{slug} exists, /blog does
           not. Drawn as a folder, because a gap in the tree is a fact about
           the site. */
        <div role="treeitem" aria-level={depth + 1} className={ROW} style={pad} data-testid={`structure-segment-${n.segment}`}>
          <Folder size={16} strokeWidth={1.8} className={GLYPH} aria-hidden="true" />
          <Text name={titleOf(n.segment)} sub={n.path} />
        </div>
      )}
      {n.children.map((c) => (
        <Branch key={c.path} n={c} depth={depth + 1} onSelectPage={onSelectPage} onRowMenu={onRowMenu} />
      ))}
    </>
  );
};

export const SiteStructureTree: React.FC<SiteStructureTreeProps> = ({
  pages,
  onSelectPage,
  onRowMenu,
  host,
  collections = [],
  search = "",
}) => {
  const q = search.trim().toLowerCase();
  const tree = React.useMemo(() => {
    const hit = (name: string, url: string) => !q || name.toLowerCase().includes(q) || url.toLowerCase().includes(q);
    return buildRouteTree(
      pages.filter((p) => hit(p.name, pageRoute(p))),
      collections.filter((c) => hit(c.name, c.pattern)),
    );
  }, [pages, collections, q]);
  /* The host row is the root; Home ("/") is drawn one step in, like every page. */
  const top: Node = { ...node("", "/"), children: [...(tree.page ? [{ ...node("", "/"), page: tree.page }] : []), ...tree.children] };
  return (
    <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:overflow-auto tw:px-3 tw:pb-2" data-testid="pages-structure" aria-label="Site structure">
      <span className="tw:pt-3 tw:pb-1 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="pages-structure-head">
        URL structure
      </span>
      <div role="tree" aria-label="Pages by route">
        <div role="treeitem" aria-level={1} className={ROW} style={{ paddingLeft: 8 }} data-testid="structure-root">
          <File size={16} strokeWidth={1.8} className={GLYPH} aria-hidden="true" />
          <Text name={host || "Site"} sub="Site root" />
        </div>
        {top.children.map((c) => (
          <Branch key={c.path} n={c} depth={1} onSelectPage={onSelectPage} onRowMenu={onRowMenu} />
        ))}
      </div>
      <p className="tw:m-0 tw:pt-3 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        This view follows page URLs. My folders stay in Pages.
      </p>
    </div>
  );
};

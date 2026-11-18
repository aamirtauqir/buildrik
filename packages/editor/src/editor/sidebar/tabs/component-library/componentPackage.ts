/**
 * componentPackage — a `.brcomponent` file: one main component and the
 * masters nested inside it, as JSON (2L9 B6-K28…K30 export, K31+ import).
 *
 * What the file carries is the masters themselves. Images and fonts are
 * referenced by the URLs and family names the masters already use — they are
 * not copied into the file — and the export summary says so rather than
 * promising a bundle of media.
 *
 * @license BSD-3-Clause
 */
import type { ComponentDefinition } from "@/shared/types/components";
import type { ElementData } from "@/shared/types/element";

const PACKAGE_FORMAT = "buildrick-component-package";
export const PACKAGE_EXTENSION = ".brcomponent";
/** The board's limits (K31): 50 MB, 100 main components, 10,000 layers. */
const PACKAGE_MAX_BYTES = 50 * 1024 * 1024;
const PACKAGE_MAX_COMPONENTS = 100;
const PACKAGE_MAX_LAYERS = 10_000;

export interface ComponentPackage {
  format: typeof PACKAGE_FORMAT;
  version: 1;
  /** The main component the export was made from. */
  rootId: string;
  components: ComponentDefinition[];
}

interface PackageSummary {
  classes: number;
  images: string[];
  fonts: string[];
  nested: string[];
  layers: number;
}

function walk(node: ElementData | undefined, visit: (n: ElementData) => void): void {
  if (!node) return;
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function nestedIds(tree: ElementData): string[] {
  const ids = new Set<string>();
  walk(tree, (n) => {
    const ref = (n as { data?: { componentInstance?: { componentId?: unknown } } }).data?.componentInstance?.componentId;
    if (typeof ref === "string") ids.add(ref);
  });
  return [...ids];
}

/** The main component plus every master nested in it, depth first, once each. */
export function buildPackage(rootId: string, all: readonly ComponentDefinition[]): ComponentPackage | null {
  const byId = new Map(all.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const out: ComponentDefinition[] = [];
  const add = (id: string) => {
    const c = byId.get(id);
    if (!c || seen.has(id)) return;
    seen.add(id);
    /* Page scope belongs to this site's pages; a package is site-neutral. */
    out.push({ ...c, pageId: null });
    for (const nested of nestedIds(c.masterTree)) add(nested);
  };
  add(rootId);
  return out.length ? { format: PACKAGE_FORMAT, version: 1, rootId, components: out } : null;
}

const URL_IN_CSS = /url\(\s*["']?([^"')]+)["']?\s*\)/g;

export function summarize(pkg: ComponentPackage): PackageSummary {
  const classes = new Set<string>();
  const images = new Set<string>();
  const fonts = new Set<string>();
  let layers = 0;
  for (const c of pkg.components) {
    walk(c.masterTree, (n) => {
      layers++;
      for (const cls of n.classes ?? []) classes.add(cls);
      if (n.attributes?.src) images.add(n.attributes.src);
      for (const value of Object.values(n.styles ?? {})) for (const m of String(value).matchAll(URL_IN_CSS)) images.add(m[1]);
      const family = n.styles?.fontFamily ?? n.styles?.["font-family"];
      if (family) fonts.add(family.split(",")[0].trim().replace(/^["']|["']$/g, ""));
    });
  }
  return {
    classes: classes.size,
    images: [...images],
    fonts: [...fonts].filter((f) => !f.startsWith("var(")),
    nested: pkg.components.filter((c) => c.id !== pkg.rootId).map((c) => c.name),
    layers,
  };
}

export function packageFileName(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "component";
  return `${base}${PACKAGE_EXTENSION}`;
}

/** Read a chosen file's text as a package, or say why it can't be one. */
export function parsePackage(text: string, bytes: number): { pkg: ComponentPackage } | { error: string } {
  if (bytes > PACKAGE_MAX_BYTES) return { error: "This file is over 50 MB, the package limit." };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: "This isn’t a component package. Choose a .brcomponent file exported from Buildrick." };
  }
  const p = raw as Partial<ComponentPackage>;
  if (p?.format !== PACKAGE_FORMAT || p.version !== 1 || !Array.isArray(p.components) || typeof p.rootId !== "string") {
    return { error: "This isn’t a component package. Choose a .brcomponent file exported from Buildrick." };
  }
  const usable = p.components.filter(
    (c): c is ComponentDefinition =>
      typeof c?.id === "string" && typeof c?.name === "string" && typeof c?.masterTree === "object" && c.masterTree !== null,
  );
  if (usable.length !== p.components.length || !usable.some((c) => c.id === p.rootId)) {
    return { error: "This package is damaged: a main component in it can’t be read." };
  }
  if (usable.length > PACKAGE_MAX_COMPONENTS) return { error: `This package has ${usable.length} main components; the limit is 100.` };
  const pkg = { format: PACKAGE_FORMAT, version: 1, rootId: p.rootId, components: usable } as ComponentPackage;
  if (summarize(pkg).layers > PACKAGE_MAX_LAYERS) return { error: "This package has more than 10,000 layers, the package limit." };
  return { pkg };
}

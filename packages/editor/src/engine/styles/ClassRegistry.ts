/**
 * The site's classes, derived — never stored (CLASS-FIRST-SPEC §2.2).
 *
 * A class is a name in `element.classes` plus whatever StyleEngine rules
 * name it. Both already persist, so the registry only reads them: nothing new
 * is saved, and a stale editor that drops unknown fields cannot lose class
 * data. It replaces the `styles.getGlobalClasses()` the class field calls
 * (which never existed) and the tree tally in Brand › Classes.
 *
 * Names are case-insensitive (Webflow S01): `Card` and `card` are one class,
 * listed under the lower-case name with both spellings kept. The published
 * CSS still matches case-sensitively until the spellings are merged (P1).
 *
 * Engine only: no React, no DOM.
 */
import type { ElementData } from "@/shared/types";
import { selectorLayer } from "@/shared/utils/classSelector";
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";

export interface ClassUsage {
  /** The class's identity: its name, lower-cased. */
  name: string;
  /** Every spelling seen, first-seen first (`Card`, `card`). */
  spellings: string[];
  /** Elements carrying it, site-wide. */
  elements: number;
  /** Elements carrying it, by page id (pages without one are absent). */
  pages: Record<string, number>;
  /** StyleEngine rules whose class chain names it (base, combo, state, breakpoint). */
  rules: number;
}

const fold = (name: string) => name.toLowerCase();

export class ClassRegistry {
  constructor(private readonly composer: Composer) {}

  /**
   * Every class on the site, in first-seen order: pages in page order, each
   * tree depth-first, then classes that only rules name (styled, on no
   * element — "unused").
   */
  list(): ClassUsage[] {
    const byName = new Map<string, ClassUsage>();
    const entry = (spelling: string): ClassUsage => {
      const name = fold(spelling);
      let usage = byName.get(name);
      if (!usage) byName.set(name, (usage = { name, spellings: [], elements: 0, pages: {}, rules: 0 }));
      if (!usage.spellings.includes(spelling)) usage.spellings.push(spelling);
      return usage;
    };

    for (const page of this.composer.elements.getAllPages()) {
      const walk = (el: ElementData): void => {
        const seen = new Set<string>();
        for (const spelling of el.classes ?? []) {
          const usage = entry(spelling);
          if (seen.has(usage.name)) continue;
          seen.add(usage.name);
          usage.elements += 1;
          usage.pages[page.id] = (usage.pages[page.id] ?? 0) + 1;
        }
        el.children?.forEach(walk);
      };
      const root = page.root?.id ? this.composer.elements.getElement(page.root.id)?.toJSON() ?? page.root : page.root;
      if (root) walk(root);
    }

    for (const rule of this.composer.styles.exportStyles()) {
      const layer = selectorLayer(rule.selector);
      if (layer.kind !== "class") continue;
      const named = new Set<string>();
      for (const spelling of layer.chain) {
        const usage = entry(spelling);
        if (named.has(usage.name)) continue;
        named.add(usage.name);
        usage.rules += 1;
      }
    }

    return [...byName.values()];
  }

  /**
   * The elements a rule for `chain` styles — every element carrying all of
   * its names, compared case-insensitively. A combo chain (`card`, `is-dark`)
   * therefore counts only elements that hold both.
   */
  elementsUsing(chain: readonly string[]): Element[] {
    if (chain.length === 0) return [];
    const wanted = chain.map(fold);
    return this.composer.elements.getAllElements().filter((el) => {
      const own = new Set(el.getClasses().map(fold));
      return wanted.every((name) => own.has(name));
    });
  }
}

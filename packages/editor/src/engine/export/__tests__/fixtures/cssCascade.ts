/**
 * A small, exact CSS cascade for the stylesheets this engine emits — the
 * test-side stand-in for `getComputedStyle` where jsdom cannot help (it does
 * not evaluate media queries or pseudo-class states).
 *
 * It understands what the exporter writes: rule lists, `@media` with
 * min/max-width features, compound selectors made of a type or `*`, classes,
 * `[attr="v"]` and pseudo-classes, plus `!important`. A complex selector
 * (with a combinator) or a pseudo-element never matches the flat element
 * descriptors used here, which is correct for the fixtures (no descendant
 * rules target them). Winner per property: importance, then specificity,
 * then source order — the CSS cascade for one origin.
 *
 * @license BSD-3-Clause
 */

export interface ElementDescriptor {
  tag: string;
  classes: string[];
  /** The element's id as written in `data-buildrick-id`. */
  id: string;
}

export type State = "normal" | "hover" | "focus";

interface Rule {
  selectors: string[];
  decls: Array<{ prop: string; value: string; important: boolean }>;
  media: string | null;
  order: number;
}

function parse(css: string): Rule[] {
  const rules: Rule[] = [];
  let order = 0;
  const walk = (text: string, media: string | null): void => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf("{", i);
      if (open < 0) return;
      const head = text.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === "{") depth++;
        else if (text[j] === "}") depth--;
        j++;
      }
      const body = text.slice(open + 1, j - 1);
      if (head.startsWith("@media")) walk(body, head.slice(6).trim());
      else if (!head.startsWith("@")) {
        const decls = body
          .split(";")
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d) => {
            const colon = d.indexOf(":");
            let value = d.slice(colon + 1).trim();
            const important = /!important$/.test(value);
            if (important) value = value.replace(/\s*!important$/, "");
            return { prop: d.slice(0, colon).trim(), value, important };
          });
        rules.push({ selectors: head.split(",").map((s) => s.trim()), decls, media, order: order++ });
      }
      i = j;
    }
  };
  walk(css, null);
  return rules;
}

function mediaMatches(media: string | null, width: number): boolean {
  if (!media) return true;
  return [...media.matchAll(/\(\s*(min|max)-width\s*:\s*(\d+)px\s*\)/g)].every(([, kind, px]) =>
    kind === "max" ? width <= Number(px) : width >= Number(px),
  );
}

const SIMPLE = /^(\*|[a-z][a-z0-9]*)?((?:\.-?[A-Za-z_][\w-]*|\[[\w-]+="[^"]*"\]|:[a-z-]+)*)$/;

/** Specificity as [ids, classes, types], or null when `selector` cannot match `el` in `state`. */
function match(selector: string, el: ElementDescriptor, state: State): [number, number, number] | null {
  const m = SIMPLE.exec(selector);
  if (!m) return null;
  const [, type, rest] = m;
  if (type && type !== "*" && type !== el.tag) return null;
  let classes = 0;
  for (const part of rest.match(/\.-?[A-Za-z_][\w-]*|\[[\w-]+="[^"]*"\]|:[a-z-]+/g) ?? []) {
    classes++;
    if (part.startsWith(".")) {
      if (!el.classes.includes(part.slice(1))) return null;
    } else if (part.startsWith("[")) {
      const [, attr, value] = /^\[([\w-]+)="([^"]*)"\]$/.exec(part)!;
      if (attr !== "data-buildrick-id" || value !== el.id) return null;
    } else if (part !== `:${state}`) {
      return null;
    }
  }
  return [0, classes, type && type !== "*" ? 1 : 0];
}

/** Lexicographic compare of equal-length keys. */
function cmp(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/** The cascaded value of every property set on `el` at `width` in `state`. */
export function cascade(css: string, el: ElementDescriptor, width: number, state: State): Record<string, string> {
  const best = new Map<string, { value: string; key: number[] }>();
  for (const rule of parse(css)) {
    if (!mediaMatches(rule.media, width)) continue;
    let spec: [number, number, number] | null = null;
    for (const s of rule.selectors) {
      const sp = match(s, el, state);
      if (sp && (!spec || cmp(sp, spec) > 0)) spec = sp;
    }
    if (!spec) continue;
    for (const d of rule.decls) {
      // importance, then specificity, then source order (later wins ties)
      const key = [d.important ? 1 : 0, ...spec, rule.order];
      const prev = best.get(d.prop);
      if (!prev || cmp(key, prev.key) > 0) best.set(d.prop, { value: d.value, key });
    }
  }
  return Object.fromEntries([...best].map(([p, v]) => [p, v.value]));
}

/** The `<style>` text of a published page. */
export function pageCss(html: string): string {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
}

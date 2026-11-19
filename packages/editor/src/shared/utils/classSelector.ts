/**
 * Class and tag rule selectors (class-first styling, CLASS-FIRST-SPEC §2.2).
 *
 * `classSelector` is the ONLY place a class or tag selector string is built,
 * as `elementSelector` is for one element — hand-built selectors drifted in
 * 16 places before that helper existed. `selectorLayer` is its inverse: it
 * reads any stored rule selector back into the cascade layer it belongs to.
 */
import { CLASS_CHAIN_MAX, normalizeClassName } from "@buildrik/shared/schemas/class-styles";

const TAG_NAME = /^[a-z][a-z0-9]*$/;

/**
 * `.card`, `.card.is-dark` (chain order), `h1` (a tag), or `h1.card`. Null
 * when the input cannot be a class-first selector: a name that is not
 * already in normalised form (`normalizeClassName`), more than
 * CLASS_CHAIN_MAX classes, a tag that is not a plain lower-case name, or
 * nothing at all. Callers treat null as "do not apply the edit".
 */
export function classSelector(chain: readonly string[], tag?: string): string | null {
  if (chain.length > CLASS_CHAIN_MAX) return null;
  if (tag !== undefined && !TAG_NAME.test(tag)) return null;
  if (chain.length === 0 && tag === undefined) return null;
  for (const name of chain) {
    const normal = normalizeClassName(name);
    if (normal.error !== null || normal.name !== name) return null;
  }
  return (tag ?? "") + chain.map((name) => `.${name}`).join("");
}

/** A stored rule selector, read as the cascade layer it belongs to. `pseudo` is `""` or one `:state`. */
export type SelectorLayer =
  | { kind: "tag"; tag: string; pseudo: string }
  | { kind: "class"; chain: string[]; pseudo: string }
  | { kind: "local"; identity: string; pseudo: string }
  | { kind: "other" };

const PSEUDO = "(:[a-z][a-z-]*)?";
const TAG_RULE = new RegExp(`^([a-z][a-z0-9]*)${PSEUDO}$`);
/* Any class names, not only normalised ones: a legacy or imported `.Card`
   rule is still a class rule for ordering. */
const CLASS_RULE = new RegExp(`^((?:\\.-?[A-Za-z_][A-Za-z0-9_-]*)+)${PSEUDO}$`);
const LOCAL_RULE = new RegExp(`^(\\[data-buildrick-id="(?:[^"\\\\]|\\\\.)*"\\])${PSEUDO}$`);

/**
 * Tag (`h1`, `h1:hover`), class chain (`.card.is-dark:hover`), one element
 * (`[data-buildrick-id="<id>"]`, optionally `:state`), or anything else a
 * stored rule may hold (descendant selectors, ids, lists) as "other".
 */
export function selectorLayer(selector: string): SelectorLayer {
  const local = LOCAL_RULE.exec(selector);
  if (local) return { kind: "local", identity: local[1], pseudo: local[2] ?? "" };
  const cls = CLASS_RULE.exec(selector);
  if (cls) return { kind: "class", chain: cls[1].slice(1).split("."), pseudo: cls[2] ?? "" };
  const tag = TAG_RULE.exec(selector);
  if (tag) return { kind: "tag", tag: tag[1], pseudo: tag[2] ?? "" };
  return { kind: "other" };
}

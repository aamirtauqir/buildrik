/**
 * schemaInterpreter — pure function that walks a ComponentType's SchemaNode
 * tree and returns a runtime InterpretedNode tree with placeholders resolved.
 *
 * v1 surface: substitutes `{props.KEY}` references in text-source nodes
 * and string-typed attribute values. Slot nodes pass through as Slot
 * markers so the canvas applier can render placeholder containers users
 * can drop content into.
 *
 * Out of scope (deferred): {variant} / {size} / {disabled} placeholders
 * (no v1 catalog node uses them); behavior modules; conditional showIf.
 *
 * @license BSD-3-Clause
 */

import type { ComponentType, SchemaNode, PropDefinition } from "./types";

export interface InterpretedElement {
  kind: "element";
  tag: string;
  attrs: Record<string, string>;
  /** Inline text content collapsed from direct text-child nodes. */
  content?: string;
  children: InterpretedNode[];
}

export interface InterpretedSlot {
  kind: "slot";
  name: string;
}

export type InterpretedNode = InterpretedElement | InterpretedSlot;

interface InterpretOptions {
  /** Caller-provided prop overrides; falls back to PropDefinition.default. */
  props?: Record<string, unknown>;
  /** Variant key — surfaced as `data-variant` on the root element. */
  variant?: string;
  /** Catalog id for traceability — written as `data-buildrik-catalog-component`. */
  catalogId?: string;
}

const PLACEHOLDER_RE = /\{props\.([a-zA-Z0-9_]+)\}/g;

function resolveProps(
  schemaProps: Record<string, PropDefinition>,
  overrides: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(schemaProps)) {
    if (overrides && key in overrides) {
      out[key] = overrides[key];
    } else if (def.default !== undefined) {
      out[key] = def.default;
    }
  }
  // Caller can pass extra keys not declared in the schema — preserve them.
  if (overrides) {
    for (const key of Object.keys(overrides)) {
      if (!(key in out)) out[key] = overrides[key];
    }
  }
  return out;
}

/**
 * Substitute `{props.X}` references inside a string against a resolved props
 * map. Used for attribute values and inline-template-style strings.
 * Unmatched placeholders fall through verbatim.
 */
export function substitutePlaceholders(
  source: string,
  resolved: Record<string, unknown>,
): string {
  return source.replace(PLACEHOLDER_RE, (whole, key: string) => {
    if (key in resolved) {
      const v = resolved[key];
      return v == null ? "" : String(v);
    }
    return whole;
  });
}

/**
 * Resolve a path-style source like `"props.label"` against the resolved
 * props map. Used for text + icon source fields. Returns the source string
 * verbatim when the path doesn't resolve — keeps author errors visible
 * instead of silently rendering empty.
 */
export function resolvePath(source: string, resolved: Record<string, unknown>): string {
  // v1 only handles `props.<key>` paths — every catalog node uses that shape.
  // Future: support `variant`, `size` directly when those land in schemas.
  const match = source.match(/^props\.([a-zA-Z0-9_]+)$/);
  if (!match) return source;
  const key = match[1];
  if (!(key in resolved)) return source;
  const v = resolved[key];
  return v == null ? "" : String(v);
}

function interpretNode(
  node: SchemaNode,
  resolved: Record<string, unknown>,
): InterpretedNode | null {
  switch (node.type) {
    case "slot":
      return { kind: "slot", name: node.name };

    case "icon":
      // Icons are render-side concerns (need resolution against icon library).
      // v1 emits an empty placeholder element so future iconography arc
      // can pick them up via the data-source attr.
      return {
        kind: "element",
        tag: "span",
        attrs: { "data-icon-source": resolvePath(node.source, resolved) },
        children: [],
      };

    case "text":
      // Direct text without an enclosing element — wrap in a span so it
      // becomes a real DOM node the canvas can address.
      return {
        kind: "element",
        tag: "span",
        attrs: {},
        content: resolvePath(node.source, resolved),
        children: [],
      };

    case "element": {
      const attrs: Record<string, string> = {};
      if (node.attrs) {
        for (const [k, v] of Object.entries(node.attrs)) {
          attrs[k] = substitutePlaceholders(v, resolved);
        }
      }
      // CSS class list is structural — emit verbatim.
      if (node.classes && node.classes.length > 0) {
        attrs.class = node.classes.join(" ");
      }

      const childNodes = (node.children ?? [])
        .map((c) => interpretNode(c, resolved))
        .filter((n): n is InterpretedNode => n !== null);

      // Collapse direct text-only children into parent content (matches the
      // single-string Element.content shape). Mixed children stay as-is.
      const allText =
        childNodes.length > 0 &&
        childNodes.every(
          (c) => c.kind === "element" && c.tag === "span" && c.children.length === 0 && c.content,
        );
      if (allText) {
        const collapsed = childNodes
          .map((c) => (c.kind === "element" ? (c.content ?? "") : ""))
          .join("");
        return {
          kind: "element",
          tag: node.tag,
          attrs,
          content: collapsed,
          children: [],
        };
      }

      return {
        kind: "element",
        tag: node.tag,
        attrs,
        children: childNodes,
      };
    }
  }
}

export function interpretSchema(
  component: ComponentType,
  options: InterpretOptions = {},
): InterpretedNode {
  const resolved = resolveProps(component.schema.props, options.props);
  const root = interpretNode(component.schema.structure, resolved);
  if (!root) {
    // Schema with a structure that interprets to nothing — surface as an
    // empty span rather than throwing, so dispatch failures stay debuggable.
    return { kind: "element", tag: "span", attrs: {}, children: [] };
  }
  // Tag the root with catalog metadata so downstream tools (DSLinter,
  // detach button, future renderer arc) can find it without traversal.
  if (root.kind === "element") {
    if (options.catalogId) root.attrs["data-buildrik-catalog-component"] = options.catalogId;
    if (options.variant)   root.attrs["data-variant"] = options.variant;
  }
  return root;
}

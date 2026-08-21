import { z } from "zod";
import type { Composer } from "@/engine/Composer";
import { getBreakpointQuery } from "@/shared/constants/breakpoints";
import { CATALOG } from "@/editor/components-catalog/catalog";
import { placeCatalogComponent } from "@/editor/components-catalog/placeCatalogComponent";

/**
 * v1 in-canvas AI command: `set-style`. Desktop / normal-state inline styles
 * only (the `el.setStyle` path) — pseudo-state and breakpoint styles live in a
 * different store and are out of scope for the thin slice.
 *
 * The schema is the single validation gate: an AI-emitted batch is parsed
 * against it server-side (before streaming) AND here before applying. The
 * property allow-list + value block-list together prevent CSS-injection vectors
 * reaching `el.setStyle`.
 */

const ALLOWED_PROPERTIES = [
  "color",
  "background",
  "background-color",
  "opacity",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "width",
  "height",
  "gap",
  "display",
  "text-align",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "border-radius",
  "border-width",
  "border-color",
  "border-style",
  "box-shadow",
  // Layout: flex + grid
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "align-items",
  "align-content",
  "align-self",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "order",
  "grid-template-columns",
  "grid-template-rows",
  "grid-auto-flow",
  "grid-column",
  "grid-row",
  "place-items",
  "place-content",
  // Position
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "inset",
  "float",
  // Sizing
  "max-width",
  "min-width",
  "max-height",
  "min-height",
  "aspect-ratio",
  "object-fit",
  "object-position",
  "box-sizing",
  // Typography
  "font-family",
  "font-style",
  "text-decoration",
  "text-transform",
  "white-space",
  "word-break",
  "text-overflow",
  "font-variant",
  // Misc visual
  "overflow",
  "overflow-x",
  "overflow-y",
  "cursor",
  "visibility",
  "transform",
  "transition",
  "filter",
  "backdrop-filter",
] as const;

// Reject the known CSS-injection / data-exfiltration vectors. The property
// allow-list already blocks `-moz-binding`/`behavior`; this guards shorthand
// properties (e.g. `background`) whose value could smuggle a `url(...)`.
const UNSAFE_VALUE = /url\s*\(|expression\s*\(|binding\s*\(|javascript:|data:/i;

export const setStyleArgsSchema = z.object({
  elementId: z.string().min(1),
  property: z.enum(ALLOWED_PROPERTIES),
  value: z
    .string()
    .min(1)
    .max(200)
    .refine((v) => !UNSAFE_VALUE.test(v), {
      message: "Unsafe CSS value rejected",
    }),
});

export type SetStyleArgs = z.infer<typeof setStyleArgsSchema>;

/**
 * Apply one validated set-style command. Does NOT open a transaction — the
 * caller (the accept handler) wraps the whole batch in one outer transaction so
 * the edit is a single undo step (see plan Unit 3 / Unit 0 finding #3).
 */
export function applySetStyle(composer: Composer, args: SetStyleArgs): void {
  const el = composer.elements.getElement(args.elementId);
  if (!el || typeof el.setStyle !== "function") {
    throw new Error(`set-style: element not found (${args.elementId})`);
  }
  el.setStyle(args.property, args.value);
}

/**
 * v1 in-canvas AI command: `set-text`. Replaces an element's text content.
 * Text is plain only (no angle brackets) — element content is rendered into the
 * canvas innerHTML, so markup must never reach it.
 */
const setTextArgsSchema = z.object({
  elementId: z.string().min(1),
  text: z
    .string()
    .min(1)
    .max(2000)
    .refine((t) => !/[<>]/.test(t), {
      message: "Text must be plain (no markup)",
    }),
});

export type SetTextArgs = z.infer<typeof setTextArgsSchema>;

export function applySetText(composer: Composer, args: SetTextArgs): void {
  const el = composer.elements.getElement(args.elementId);
  if (!el || typeof el.setContent !== "function") {
    throw new Error(`set-text: element not found (${args.elementId})`);
  }
  el.setContent(args.text);
}

/**
 * v1 in-canvas AI command: `add-element`. Inserts a new element relative to the
 * reference (selected) element: as a child when the reference is an empty
 * container, otherwise as the next sibling. Restricted to content/layout
 * primitives that need no external resource.
 */
const ADD_ELEMENT_TYPES = [
  "heading", "text", "paragraph", "button", "link", "list",
  "container", "section", "columns", "grid", "flex",
] as const;

const CONTAINER_TYPES = new Set([
  "container", "section", "columns", "grid", "flex", "list",
]);

const addElementArgsSchema = z.object({
  elementId: z.string().min(1),
  elementType: z.enum(ADD_ELEMENT_TYPES),
  text: z
    .string()
    .max(2000)
    .refine((t) => !/[<>]/.test(t), { message: "Text must be plain (no markup)" })
    .optional(),
});

export type AddElementArgs = z.infer<typeof addElementArgsSchema>;

/**
 * Where a newly-inserted element goes relative to the reference element: as a
 * child when the reference is an empty container, otherwise as the next sibling.
 */
function resolvePlacement(
  composer: Composer,
  refId: string,
): { parentId?: string; index?: number } {
  const ref = composer.elements.getElement(refId);
  if (!ref) return {};
  const children = ref.getChildren?.() ?? [];
  const isContainer = CONTAINER_TYPES.has(ref.getType?.() ?? "");
  if (isContainer && children.length === 0) return { parentId: ref.getId() };
  const parent = ref.getParent?.();
  if (parent) {
    const siblings = parent.getChildren();
    const idx = siblings.findIndex((c) => c.getId() === ref.getId());
    return { parentId: parent.getId(), index: idx >= 0 ? idx + 1 : undefined };
  }
  return { parentId: ref.getId() }; // root-level container — append as child
}

export function applyAddElement(composer: Composer, args: AddElementArgs): void {
  const { parentId, index } = resolvePlacement(composer, args.elementId);
  if (!parentId) {
    throw new Error(`add-element: no placement target (${args.elementId})`);
  }
  const created = composer.elements.createElement(
    args.elementType,
    args.text ? { content: args.text } : {},
  );
  if (!composer.elements.addElement(created, parentId, index)) {
    throw new Error("add-element: insert failed");
  }
}

/**
 * v1 page generation: build a section (a container with a flat set of child
 * elements) in one command. The container is placed relative to the selected
 * element; each child is created and appended into the container.
 */
const addSectionArgsSchema = z.object({
  elementId: z.string().min(1),
  sectionType: z.enum(["section", "container", "columns", "grid", "flex"]),
  children: z
    .array(
      z.object({
        elementType: z.enum(ADD_ELEMENT_TYPES),
        text: z
          .string()
          .max(2000)
          .refine((t) => !/[<>]/.test(t), { message: "Text must be plain" })
          .optional(),
      }),
    )
    .min(1)
    .max(12),
});
export type AddSectionArgs = z.infer<typeof addSectionArgsSchema>;

export function applyAddSection(composer: Composer, args: AddSectionArgs): void {
  const { parentId, index } = resolvePlacement(composer, args.elementId);
  if (!parentId) {
    throw new Error(`add-section: no placement target (${args.elementId})`);
  }
  const section = composer.elements.createElement(args.sectionType, {});
  if (!composer.elements.addElement(section, parentId, index)) {
    throw new Error("add-section: insert failed");
  }
  const sectionId = section.getId();
  for (const child of args.children) {
    const el = composer.elements.createElement(
      child.elementType,
      child.text ? { content: child.text } : {},
    );
    composer.elements.addElement(el, sectionId);
  }
}

/** Shared args for commands that only reference an element by id. */
const elementRefArgsSchema = z.object({ elementId: z.string().min(1) });
export type ElementRefArgs = z.infer<typeof elementRefArgsSchema>;

export function applyDeleteElement(composer: Composer, args: ElementRefArgs): void {
  if (!composer.elements.removeElement(args.elementId)) {
    throw new Error(`delete-element: element not found (${args.elementId})`);
  }
}

export function applyDuplicateElement(
  composer: Composer,
  args: ElementRefArgs,
): void {
  if (!composer.elements.duplicateElement(args.elementId)) {
    throw new Error(`duplicate-element: failed (${args.elementId})`);
  }
}

const moveElementArgsSchema = z.object({
  elementId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});
export type MoveElementArgs = z.infer<typeof moveElementArgsSchema>;

/** Reorder an element among its siblings (up = earlier, down = later). */
export function applyMoveElement(composer: Composer, args: MoveElementArgs): void {
  const el = composer.elements.getElement(args.elementId);
  const parent = el?.getParent?.();
  if (!el || !parent) {
    throw new Error(`move-element: no parent to reorder within (${args.elementId})`);
  }
  const siblings = parent.getChildren();
  const idx = siblings.findIndex((c) => c.getId() === args.elementId);
  if (idx < 0) throw new Error(`move-element: not a child (${args.elementId})`);

  if (args.direction === "up" ? idx === 0 : idx === siblings.length - 1) return; // at the edge
  /* `moveElement`'s index is a slot in the sibling list BEFORE the element is
     pulled out of it, and a same-parent move decrements any slot that sits
     after the element (ElementCRUD.moveElement). Down therefore has to ask for
     idx + 2; asking for idx + 1 came straight back as idx and the element
     never moved — "move it down" reported success and did nothing. */
  const target = args.direction === "up" ? idx - 1 : idx + 2;
  if (!composer.elements.moveElement(args.elementId, parent.getId(), target)) {
    throw new Error(`move-element: move failed (${args.elementId})`);
  }
}

/**
 * v1 in-canvas AI command: `set-attribute`. Sets a safe authoring attribute
 * (href / alt / title / target / rel / aria-label / name) via `el.setAttribute`.
 * Per-attribute value guards mirror the server: href rejects script/data URIs,
 * target is enum-restricted, the rest are plain text (no markup). The property
 * allow-list excludes event handlers, `style`, `src`, and `id`.
 */
const ATTRIBUTE_NAMES = [
  "href", "alt", "title", "target", "rel", "aria-label", "name", "src",
] as const;
const UNSAFE_HREF = /^\s*(javascript|data|vbscript):/i;
const ALLOWED_TARGETS = ["_blank", "_self", "_parent", "_top"] as const;

// `src` uses a scheme allowlist (http/https/relative only), mirroring the
// server guard — rejects data:/blob:/javascript: and url-breaking characters.
function isSafeSrcValue(value: string): boolean {
  if (/[)"'<>]/.test(value)) return false;
  const scheme = value.trim().match(/^([a-z][a-z0-9+.-]*):/i);
  if (!scheme) return value.startsWith("/") || /^[\w.-]/.test(value.trim());
  const s = scheme[1].toLowerCase();
  return s === "http" || s === "https";
}

export const setAttributeArgsSchema = z
  .object({
    elementId: z.string().min(1),
    attribute: z.enum(ATTRIBUTE_NAMES),
    value: z.string().min(1).max(1000),
  })
  .refine(
    (a) => {
      if (a.attribute === "href") return !UNSAFE_HREF.test(a.value);
      if (a.attribute === "target")
        return (ALLOWED_TARGETS as readonly string[]).includes(a.value);
      if (a.attribute === "src") return isSafeSrcValue(a.value);
      return !/[<>]/.test(a.value);
    },
    { message: "Unsafe or invalid attribute value rejected" },
  );

export type SetAttributeArgs = z.infer<typeof setAttributeArgsSchema>;

export function applySetAttribute(composer: Composer, args: SetAttributeArgs): void {
  const el = composer.elements.getElement(args.elementId);
  if (!el || typeof el.setAttribute !== "function") {
    throw new Error(`set-attribute: element not found (${args.elementId})`);
  }
  el.setAttribute(args.attribute, args.value);
}

/**
 * v1 in-canvas AI command: `set-style-variant`. Sets a style on the SECOND
 * style store — a pseudo-state (:hover/:focus/:active/:disabled) and/or a
 * tablet/mobile breakpoint — via StyleEngine, not the inline `el.setStyle` path
 * that plain set-style uses. Mirrors the inspector's selector convention
 * (`[data-buildrick-id="<id>"]`) and routing: pseudo → setRule with the pseudo
 * + media query; breakpoint-only → setBreakpointStyle.
 */
const elementSelector = (id: string) => `[data-buildrick-id="${id}"]`;

export const setStyleVariantArgsSchema = z
  .object({
    elementId: z.string().min(1),
    property: z.enum(ALLOWED_PROPERTIES),
    value: z
      .string()
      .min(1)
      .max(200)
      .refine((v) => !UNSAFE_VALUE.test(v), { message: "Unsafe CSS value rejected" }),
    pseudo: z.enum(["hover", "focus", "active", "disabled"]).optional(),
    breakpoint: z.enum(["tablet", "mobile"]).optional(),
  })
  .refine((a) => a.pseudo !== undefined || a.breakpoint !== undefined, {
    message: "set-style-variant requires a pseudo state or a breakpoint",
  });

export type SetStyleVariantArgs = z.infer<typeof setStyleVariantArgsSchema>;

export function applySetStyleVariant(composer: Composer, args: SetStyleVariantArgs): void {
  const { elementId, property, value, pseudo, breakpoint } = args;
  if (!composer.elements.getElement(elementId)) {
    throw new Error(`set-style-variant: element not found (${elementId})`);
  }
  const mediaQuery = breakpoint ? getBreakpointQuery(breakpoint) ?? undefined : undefined;
  if (pseudo) {
    composer.styles.setRule(
      elementSelector(elementId),
      { [property]: value },
      { pseudo: `:${pseudo}`, mediaQuery },
    );
  } else if (breakpoint) {
    composer.styles.setBreakpointStyle(elementId, breakpoint, { [property]: value });
  }
}

/**
 * v1 in-canvas AI command: `insert-component`. Inserts a component (catalog or
 * user-saved) from the loaded component registry, relative to the selected
 * element. This is the first ASYNC command — `instantiateComponent` returns a
 * Promise (it can load + clone a saved master tree) — so it runs on the async
 * apply path (applyAiEdit awaits each handler).
 *
 * Codex guards: the component id is validated against the LIVE registry
 * (`getComponent`, which covers both catalog and user-saved — the server cannot
 * validate user-saved ids that live in browser IndexedDB), and the cloned
 * subtree is node-capped so one command cannot inject an unbounded tree.
 */
const insertComponentArgsSchema = z.object({
  elementId: z.string().min(1),
  componentId: z.string().min(1).max(100),
});
export type InsertComponentArgs = z.infer<typeof insertComponentArgsSchema>;

const MAX_COMPONENT_NODES = 200;

function countNodes(tree: { children?: unknown[] } | undefined): number {
  if (!tree || typeof tree !== "object") return 0;
  const children = Array.isArray(tree.children) ? tree.children : [];
  return 1 + children.reduce<number>(
    (n, c) => n + countNodes(c as { children?: unknown[] }),
    0,
  );
}

async function applyInsertComponent(
  composer: Composer,
  args: InsertComponentArgs,
): Promise<void> {
  const { parentId, index } = resolvePlacement(composer, args.elementId);
  if (!parentId) {
    throw new Error(`insert-component: no placement target (${args.elementId})`);
  }
  // Two distinct registries (codex finding): the Buildrik-shipped CATALOG
  // (compile-time, trusted, bounded — placed via placeCatalogComponent, sync)
  // and user-saved components (browser IndexedDB — instantiated async, and
  // node-capped since the user authored the tree). Try catalog first.
  const catalogItem = CATALOG.find((c) => c.id === args.componentId);
  if (catalogItem) {
    const res = placeCatalogComponent(composer, catalogItem, parentId, index);
    if (!res.elementId) throw new Error("insert-component: catalog placement failed");
    return;
  }
  const def = composer.components?.getComponent?.(args.componentId);
  if (!def) {
    throw new Error(`insert-component: unknown component (${args.componentId})`);
  }
  const nodes = countNodes(def.masterTree as { children?: unknown[] } | undefined);
  if (nodes > MAX_COMPONENT_NODES) {
    throw new Error(`insert-component: component too large (${nodes} nodes)`);
  }
  const id = await composer.components.instantiateComponent(args.componentId, parentId, index);
  if (!id) throw new Error("insert-component: instantiate failed");
}

/**
 * save-as-component (W12) — turn the selected element subtree into a reusable
 * component via `composer.components.createComponent`. Async. The subtree is
 * node-capped (same MAX as insert-component) so one command can't persist an
 * unbounded tree. The name is plain text (it labels a UI catalog entry).
 */
export const saveAsComponentArgsSchema = z.object({
  elementId: z.string().min(1),
  name: z
    .string()
    .min(1)
    .max(60)
    .refine((v) => !/[<>]/.test(v), { message: "Name must be plain text (no markup)" }),
});
export type SaveAsComponentArgs = z.infer<typeof saveAsComponentArgsSchema>;

async function applySaveAsComponent(
  composer: Composer,
  args: SaveAsComponentArgs,
): Promise<void> {
  const el = composer.elements.getElement(args.elementId);
  if (!el) throw new Error(`save-as-component: element not found (${args.elementId})`);
  const tree = el.toJSON?.() as { children?: unknown[] } | undefined;
  const nodes = countNodes(tree);
  if (nodes > MAX_COMPONENT_NODES) {
    throw new Error(`save-as-component: subtree too large (${nodes} nodes)`);
  }
  const def = await composer.components.createComponent(args.name, args.elementId);
  if (!def) throw new Error("save-as-component: create failed");
}

/**
 * v1 in-canvas AI config command: `set-page-setting`. Edits the ACTIVE page's
 * SEO title / meta description — no element target. Reads + merges the current
 * `settings.seo` (updatePage shallow-merges `settings`, so the whole `seo`
 * object must be written back to avoid clobbering sibling SEO fields). Length
 * caps mirror the DB columns (title 60, description 160).
 */
const SEO_LIMITS = { metaTitle: 60, metaDescription: 160 } as const;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const setPageSettingArgsSchema = z
  .object({
    setting: z.enum(["metaTitle", "metaDescription", "slug"]),
    value: z
      .string()
      .min(1)
      .refine((v) => !/[<>]/.test(v), { message: "Text must be plain (no markup)" }),
  })
  .refine(
    (a) =>
      a.setting === "slug"
        ? a.value.length <= 100 && SLUG_RE.test(a.value)
        : a.value.length <= SEO_LIMITS[a.setting],
    { message: "Invalid page-setting value" },
  );
export type SetPageSettingArgs = z.infer<typeof setPageSettingArgsSchema>;

function applySetPageSetting(composer: Composer, args: SetPageSettingArgs): void {
  const page = composer.elements.getActivePage?.();
  if (!page) throw new Error("set-page-setting: no active page");
  if (args.setting === "slug") {
    // Collision check against the OTHER pages (the server can't — no page list).
    const others = (composer.elements.getAllPages?.() ?? []).filter((p) => p.id !== page.id);
    if (others.some((p) => p.slug === args.value)) {
      throw new Error(`set-page-setting: slug "${args.value}" already in use`);
    }
    composer.elements.updatePage(page.id, { slug: args.value, slugManuallySet: true });
    return;
  }
  const currentSeo = ((page.settings as { seo?: Record<string, unknown> } | undefined)?.seo) ?? {};
  composer.elements.updatePage(page.id, {
    settings: { seo: { ...currentSeo, [args.setting]: args.value } },
  });
}

/**
 * set-token (W4) — config command, no element target. Shape-only schema; the
 * engine (`setDesignToken`) is the authority: it checks the id is a registered
 * token and validates the value against the token's type. A rejected/no-op value
 * leaves the canvas unchanged (mirrors insert-component's engine-validated id).
 */
export const setTokenArgsSchema = z.object({
  tokenId: z.string().min(1).max(100),
  value: z.string().min(1).max(120),
});
export type SetTokenArgs = z.infer<typeof setTokenArgsSchema>;

function applySetToken(composer: Composer, args: SetTokenArgs): void {
  composer.designSystem.setDesignToken(args.tokenId, args.value);
}

/**
 * Client-side command registry: maps a commandId to its Zod validator + apply
 * fn. `defineCommand` (sync) and `defineAsyncCommand` (async) both produce a
 * handler whose `run` re-validates (defense in depth; the server already
 * validated) and skips invalid args. The batch loop awaits every `run`, so sync
 * and async commands compose in one transaction → one undo step.
 */
function defineCommand<T>(
  schema: z.ZodType<T>,
  apply: (composer: Composer, args: T) => void,
): { run: (composer: Composer, rawArgs: unknown) => boolean | Promise<boolean> } {
  return {
    run(composer, rawArgs) {
      const parsed = schema.safeParse(rawArgs);
      if (!parsed.success) return false;
      apply(composer, parsed.data);
      return true;
    },
  };
}

function defineAsyncCommand<T>(
  schema: z.ZodType<T>,
  apply: (composer: Composer, args: T) => Promise<void>,
): { run: (composer: Composer, rawArgs: unknown) => Promise<boolean> } {
  return {
    async run(composer, rawArgs) {
      const parsed = schema.safeParse(rawArgs);
      if (!parsed.success) return false;
      await apply(composer, parsed.data);
      return true;
    },
  };
}

const COMMAND_HANDLERS: Record<
  string,
  { run: (composer: Composer, rawArgs: unknown) => boolean | Promise<boolean> }
> = {
  "set-style": defineCommand(setStyleArgsSchema, applySetStyle),
  "set-text": defineCommand(setTextArgsSchema, applySetText),
  "add-element": defineCommand(addElementArgsSchema, applyAddElement),
  "delete-element": defineCommand(elementRefArgsSchema, applyDeleteElement),
  "duplicate-element": defineCommand(elementRefArgsSchema, applyDuplicateElement),
  "move-element": defineCommand(moveElementArgsSchema, applyMoveElement),
  "add-section": defineCommand(addSectionArgsSchema, applyAddSection),
  "set-attribute": defineCommand(setAttributeArgsSchema, applySetAttribute),
  "set-style-variant": defineCommand(setStyleVariantArgsSchema, applySetStyleVariant),
  "insert-component": defineAsyncCommand(insertComponentArgsSchema, applyInsertComponent),
  "set-page-setting": defineCommand(setPageSettingArgsSchema, applySetPageSetting),
  "set-token": defineCommand(setTokenArgsSchema, applySetToken),
  "save-as-component": defineAsyncCommand(saveAsComponentArgsSchema, applySaveAsComponent),
};

/**
 * Run an accepted AI edit's command batch inside ONE outer transaction so the
 * whole edit is a single undo step. Each command is re-validated client-side
 * (defense in depth — the server already validated) before applying; invalid
 * entries are skipped. `endTransaction` runs in `finally`, never
 * `rollbackTransaction` (Unit 0 finding #3: rollback suppresses the history
 * record without reverting the in-memory mutation, which would strand a
 * visible-but-unrecorded change). Returns how many commands were applied.
 */
export async function applyAiEdit(
  composer: Composer,
  edit: {
    applyOps: {
      commit: Record<string, unknown>;
      preview?: Record<string, unknown>;
    };
  },
): Promise<{ applied: number; proposals: Array<{ actionId: string }> }> {
  const commit = edit.applyOps.commit as { commands?: unknown };
  const commands = Array.isArray(commit.commands) ? commit.commands : [];

  // propose-action commands are NOT canvas edits — they don't touch the composer
  // and aren't part of the undo transaction. Collect them for the caller to route
  // into the propose→confirm-token→execute gate (platform phase 4).
  const proposals: Array<{ actionId: string }> = [];

  composer.beginTransaction("ai-edit");
  let applied = 0;
  try {
    for (const c of commands) {
      const cmd = c as { commandId?: unknown; args?: unknown };
      if (cmd.commandId === "propose-action") {
        const actionId = (cmd.args as { actionId?: unknown } | undefined)?.actionId;
        if (typeof actionId === "string") proposals.push({ actionId });
        continue;
      }
      const handler =
        typeof cmd.commandId === "string" ? COMMAND_HANDLERS[cmd.commandId] : undefined;
      // Await every handler — sync ones resolve immediately (await of a boolean),
      // async ones (insert-component) settle their mutation before the next
      // command + before endTransaction, keeping the whole batch one undo step.
      if (handler && (await handler.run(composer, cmd.args))) applied++;
    }
  } finally {
    composer.endTransaction();
  }
  // Commit the edit to history synchronously. History records are debounced
  // ~500ms; without flushing, an undo fired right after Apply reverts the
  // PREVIOUS action (the edit isn't committed yet) and the late record then
  // clears the redo stack. Flush makes the AI edit one clean, immediate undo.
  composer.history?.flushPending?.();
  return { applied, proposals };
}

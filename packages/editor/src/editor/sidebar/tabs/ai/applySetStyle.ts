import { z } from "zod";
import type { Composer } from "@/engine/Composer";
import { getBreakpointQuery } from "@/shared/constants/breakpoints";

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
export const setTextArgsSchema = z.object({
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

export const addElementArgsSchema = z.object({
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
export const addSectionArgsSchema = z.object({
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
export const elementRefArgsSchema = z.object({ elementId: z.string().min(1) });
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

export const moveElementArgsSchema = z.object({
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

  const target = args.direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= siblings.length) return; // already at the edge — no-op
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
  "href", "alt", "title", "target", "rel", "aria-label", "name",
] as const;
const UNSAFE_HREF = /^\s*(javascript|data|vbscript):/i;
const ALLOWED_TARGETS = ["_blank", "_self", "_parent", "_top"] as const;

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
 * Client-side command registry: maps a commandId to its Zod validator + apply
 * fn. `defineCommand` binds the two so the batch loop is a single data-driven
 * pass — registering a new command is one entry here instead of another arm in
 * an if-chain. Each handler re-validates (defense in depth; the server already
 * validated) and skips invalid args.
 */
function defineCommand<T>(
  schema: z.ZodType<T>,
  apply: (composer: Composer, args: T) => void,
): { run: (composer: Composer, rawArgs: unknown) => boolean } {
  return {
    run(composer, rawArgs) {
      const parsed = schema.safeParse(rawArgs);
      if (!parsed.success) return false;
      apply(composer, parsed.data);
      return true;
    },
  };
}

const COMMAND_HANDLERS: Record<
  string,
  { run: (composer: Composer, rawArgs: unknown) => boolean }
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
export function applyAiEdit(
  composer: Composer,
  edit: {
    applyOps: {
      commit: Record<string, unknown>;
      preview?: Record<string, unknown>;
    };
  },
): { applied: number } {
  const commit = edit.applyOps.commit as { commands?: unknown };
  const commands = Array.isArray(commit.commands) ? commit.commands : [];

  composer.beginTransaction("ai-edit");
  let applied = 0;
  try {
    for (const c of commands) {
      const cmd = c as { commandId?: unknown; args?: unknown };
      const handler =
        typeof cmd.commandId === "string" ? COMMAND_HANDLERS[cmd.commandId] : undefined;
      if (handler && handler.run(composer, cmd.args)) applied++;
    }
  } finally {
    composer.endTransaction();
  }
  // Commit the edit to history synchronously. History records are debounced
  // ~500ms; without flushing, an undo fired right after Apply reverts the
  // PREVIOUS action (the edit isn't committed yet) and the late record then
  // clears the redo stack. Flush makes the AI edit one clean, immediate undo.
  composer.history?.flushPending?.();
  return { applied };
}

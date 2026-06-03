import { z } from "zod";
import type { Composer } from "@/engine/Composer";

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
      if (cmd.commandId === "set-style") {
        const parsed = setStyleArgsSchema.safeParse(cmd.args);
        if (!parsed.success) continue;
        applySetStyle(composer, parsed.data);
        applied++;
      } else if (cmd.commandId === "set-text") {
        const parsed = setTextArgsSchema.safeParse(cmd.args);
        if (!parsed.success) continue;
        applySetText(composer, parsed.data);
        applied++;
      } else if (cmd.commandId === "add-element") {
        const parsed = addElementArgsSchema.safeParse(cmd.args);
        if (!parsed.success) continue;
        applyAddElement(composer, parsed.data);
        applied++;
      } else if (cmd.commandId === "delete-element") {
        const parsed = elementRefArgsSchema.safeParse(cmd.args);
        if (!parsed.success) continue;
        applyDeleteElement(composer, parsed.data);
        applied++;
      } else if (cmd.commandId === "duplicate-element") {
        const parsed = elementRefArgsSchema.safeParse(cmd.args);
        if (!parsed.success) continue;
        applyDuplicateElement(composer, parsed.data);
        applied++;
      } else if (cmd.commandId === "move-element") {
        const parsed = moveElementArgsSchema.safeParse(cmd.args);
        if (!parsed.success) continue;
        applyMoveElement(composer, parsed.data);
        applied++;
      } else if (cmd.commandId === "add-section") {
        const parsed = addSectionArgsSchema.safeParse(cmd.args);
        if (!parsed.success) continue;
        applyAddSection(composer, parsed.data);
        applied++;
      }
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

/**
 * The collaboration op channel (`POST /api/collab/:siteId/ops`). Each op is
 * stored and replayed verbatim to every connected collaborator, whose editor
 * applies it — so the server must not take it as opaque JSON (audit A16-6,
 * A19-14): a patch path through `__proto__` polluted Object.prototype in every
 * peer's browser, and an unbounded body is a storage DoS.
 *
 * The envelope mirrors the editor's `CollaborationEvent`
 * (`packages/editor/src/shared/types/collaboration.ts`). `payload` stays
 * loosely typed — the engine owns its shapes — and is bounded by
 * `MAX_COLLAB_OP_BYTES` instead.
 *
 * @license BSD-3-Clause
 */
import { z } from "zod";

/** A `sync_response` carries a whole project; the largest local snapshot is ~180 KB. */
export const MAX_COLLAB_OP_BYTES = 1_000_000;

export const COLLAB_EVENT_TYPES = [
  "join",
  "leave",
  "cursor",
  "selection",
  "operation",
  "editing",
  "lock",
  "ping",
  "pong",
  "sync_request",
  "sync_response",
] as const;

const PROTOTYPE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
/** A JSON-pointer-like string that walks through a prototype key. */
const PROTOTYPE_POINTER = /(^|\/)(__proto__|constructor|prototype)(\/|$)/;
const POINTER_FIELDS = new Set(["path", "from"]);

/** Where in `value` a prototype key (or a patch path through one) sits, if anywhere. */
function findPrototypeKey(value: unknown): string | null {
  const stack: Array<{ value: unknown; at: string }> = [{ value, at: "" }];
  while (stack.length > 0) {
    const { value: current, at } = stack.pop()!;
    if (!current || typeof current !== "object") continue;
    for (const key of Object.keys(current)) {
      const child = (current as Record<string, unknown>)[key];
      const here = `${at}/${key}`;
      if (PROTOTYPE_KEYS.has(key)) return here;
      if (POINTER_FIELDS.has(key) && typeof child === "string" && PROTOTYPE_POINTER.test(child)) return here;
      stack.push({ value: child, at: here });
    }
  }
  return null;
}

export const collabOpSchema = z
  .object({
    type: z.enum(COLLAB_EVENT_TYPES),
    userId: z.string().min(1).max(128),
    timestamp: z.number().finite(),
    payload: z.unknown(),
  })
  .superRefine((op, ctx) => {
    const at = findPrototypeKey(op.payload);
    if (at) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `prototype key at payload${at}` });
  });

export const collabOpBodySchema = z.object({
  clientId: z.string().min(1).max(128),
  op: collabOpSchema,
});

export type CollabOpBody = z.infer<typeof collabOpBodySchema>;

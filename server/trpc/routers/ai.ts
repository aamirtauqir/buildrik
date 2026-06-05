import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  generateContent,
  generatePage,
  generateLayout,
  summarizeChanges,
  suggestMilestone,
  streamContent,
  generateComponentSchema,
  generateEditCommands,
  generatePageEditCommands,
  generatePlan,
  editCommandToRow,
  assertProviderConfigured,
} from "../../services/ai.service";
import {
  checkQuota,
  reserveQuota,
  releaseQuota,
  resolveModelForUser,
} from "../../services/quota.service";
import { modelSchema, DEFAULT_MODEL } from "../../services/types";
import { aiAdoptionInputSchema } from "@buildrik/shared/schemas/ai-adoption";
import { recordAiAdoption } from "../../services/ai-adoption.service";

const contentInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  type: z.enum(["content", "layout", "section"]),
  options: z
    .object({
      tone: z.string().optional(),
      length: z.string().optional(),
    })
    .optional(),
});

const pageInputSchema = z.object({
  pageType: z.enum(["landing", "portfolio", "product", "pricing", "blog"]),
  description: z.string().min(1).max(5000),
  style: z.enum(["modern", "minimal", "bold"]),
});

const layoutInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  sectionType: z.string().optional(),
});

const summarizeInputSchema = z.object({
  versionName: z.string().min(1).max(200),
  changes: z.object({
    elementName: z.string(),
    summary: z.object({
      style: z.number().int().nonnegative(),
      text: z.number().int().nonnegative(),
      layout: z.number().int().nonnegative(),
      content: z.number().int().nonnegative(),
      other: z.number().int().nonnegative(),
    }),
    changes: z.array(
      z.object({
        type: z.enum(["style", "text", "layout", "content", "other"]),
        property: z.string(),
        before: z.string(),
        after: z.string(),
      })
    ),
  }),
});

const milestoneSuggestInputSchema = z.object({
  recentChanges: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        timestamp: z.number(),
        type: z.enum(["checkpoint", "patch"]),
      })
    )
    .max(50),
  pageStructure: z
    .object({
      pageCount: z.number().int().nonnegative(),
      elementCount: z.number().int().nonnegative(),
    })
    .optional(),
});

const pageElementRefSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1).max(40),
  text: z.string().max(200).optional(),
});

// Token registry sent with page scope for set-token recall (W4).
const tokenRefSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(80),
  value: z.string().max(120),
  type: z.string().max(40),
});

// Media asset list sent with page scope for set-image recall (W5).
const mediaAssetRefSchema = z.object({
  id: z.string().min(1).max(100),
  url: z.string().max(2048),
  name: z.string().max(200),
});

const scopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("element"), id: z.string().min(1) }),
  // Page scope may carry the page's element list for multi-element edits (P3),
  // the design-token registry for set-token recall (W4), and the media library
  // for set-image recall (W5).
  z.object({
    kind: z.literal("page"),
    elements: z.array(pageElementRefSchema).max(200).optional(),
    tokens: z.array(tokenRefSchema).max(120).optional(),
    assets: z.array(mediaAssetRefSchema).max(100).optional(),
  }),
]);

const streamPromptInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  scope: scopeSchema,
  model: modelSchema.default(DEFAULT_MODEL),
  // "text" = existing chat stream; "style-command" = in-canvas AI that emits a
  // validated set-style command batch (element scope only).
  // "plan" (P4) = agent build loop; returns an ordered step plan, not edits.
  intent: z.enum(["text", "style-command", "plan"]).default("text"),
});

const componentSchemaInputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  model: modelSchema.default(DEFAULT_MODEL),
});

export const aiRouter = router({
  content: protectedProcedure
    .input(contentInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await generateContent(input);
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          "status" in e &&
          (e as { status: number }).status === 429
        ) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "OpenAI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            e instanceof Error ? e.message : "Content generation failed",
        });
      }
    }),

  page: protectedProcedure
    .input(pageInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await generatePage(input);
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          "status" in e &&
          (e as { status: number }).status === 429
        ) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "OpenAI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            e instanceof Error ? e.message : "Page generation failed",
        });
      }
    }),

  layout: protectedProcedure
    .input(layoutInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await generateLayout(input);
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          "status" in e &&
          (e as { status: number }).status === 429
        ) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "OpenAI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            e instanceof Error ? e.message : "Layout generation failed",
        });
      }
    }),

  summarize: protectedProcedure
    .input(summarizeInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await summarizeChanges(input.versionName, input.changes);
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        if (err.status === 429) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "AI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message ?? "Summary generation failed",
        });
      }
    }),

  milestoneSuggest: protectedProcedure
    .input(milestoneSuggestInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await suggestMilestone(input.recentChanges, input.pageStructure);
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string };
        if (err.status === 429) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "AI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message ?? "Milestone suggestion failed",
        });
      }
    }),

  getQuotaStatus: protectedProcedure.query(async ({ ctx }) => {
    return checkQuota(ctx.session.user.id);
  }),

  streamPrompt: protectedProcedure
    .input(streamPromptInputSchema)
    .subscription(async function* ({ ctx, input, signal }) {
      const userId = ctx.session.user.id;
      // Server-authoritative model: client model is only a hint, gated by tier.
      const model = modelSchema.parse(
        await resolveModelForUser(userId, input.model),
      );
      // W3 guard: fail fast + clearly if the model's provider has no key, BEFORE
      // reserving quota (so we don't reserve+refund) and instead of an opaque
      // deep 401 / silent empty reply.
      try {
        assertProviderConfigured(model);
      } catch (e) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: e instanceof Error ? e.message : "AI provider not configured",
        });
      }
      // Reserve one unit atomically before the provider call (closes the
      // concurrent check-then-act bypass); refund if nothing is delivered.
      const quota = await reserveQuota(userId, model);
      if (!quota.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Daily limit reached (${quota.limit}). Resets at ${quota.resetsAt.toISOString()}.`,
        });
      }
      // Agent build loop (P4): return an ordered plan of steps (not edits). The
      // editor walks each step through the style-command path at run time.
      if (input.intent === "plan" && input.scope.kind === "page") {
        let steps;
        try {
          steps = await generatePlan({
            prompt: input.prompt,
            elements: input.scope.elements ?? [],
            model,
          });
        } catch (e) {
          await releaseQuota(userId);
          throw e;
        }
        yield { type: "plan" as const, plan: { steps } };
        yield { type: "done" as const };
        return;
      }
      // In-canvas AI: emit a validated edit-command batch (single-shot), not a
      // token stream. Element scope edits one element; page scope (P3) edits
      // across the supplied page element list.
      if (
        input.intent === "style-command" &&
        (input.scope.kind === "element" ||
          (input.scope.kind === "page" && (input.scope.elements?.length ?? 0) > 0))
      ) {
        const target = input.scope.kind === "element" ? input.scope.id : "page";
        let commands;
        try {
          commands =
            input.scope.kind === "element"
              ? await generateEditCommands({ prompt: input.prompt, elementId: input.scope.id, model })
              : await generatePageEditCommands({
                  prompt: input.prompt,
                  elements: input.scope.elements ?? [],
                  tokens: input.scope.tokens ?? [],
                  assets: input.scope.assets ?? [],
                  model,
                });
        } catch (e) {
          await releaseQuota(userId);
          throw e;
        }
        yield {
          type: "edit" as const,
          edit: {
            target,
            summary: commands.length
              ? `${commands.length} change${commands.length > 1 ? "s" : ""}`
              : "No applicable change",
            rows: commands.map(editCommandToRow),
            applyOps: { preview: {}, commit: { commands } },
          },
        };
        yield { type: "done" as const };
        return;
      }

      const ac = signal ?? new AbortController().signal;
      let delivered = false;
      try {
        for await (const chunk of streamContent(input.prompt, model, ac)) {
          delivered = true;
          yield chunk;
        }
      } catch (e) {
        if (!delivered) await releaseQuota(userId);
        throw e;
      }
    }),

  componentSchema: protectedProcedure
    .input(componentSchemaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const model = modelSchema.parse(
        await resolveModelForUser(userId, input.model),
      );
      const quota = await reserveQuota(userId, model);
      if (!quota.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Daily limit reached (${quota.limit}). Resets at ${quota.resetsAt.toISOString()}.`,
        });
      }
      try {
        const raw = await generateComponentSchema({
          prompt: input.prompt,
          model,
        });
        return { raw };
      } catch (e: unknown) {
        await releaseQuota(userId);
        const err = e as { status?: number; message?: string };
        if (err.status === 429) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "AI rate limit exceeded. Please try again later.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message ?? "Component schema generation failed",
        });
      }
    }),

  // Task-level AI adoption telemetry. Fire-and-forget from the editor; the
  // service never throws and verifies site membership. Returns immediately so a
  // logging failure can never block the edit.
  logAdoption: protectedProcedure
    .input(aiAdoptionInputSchema)
    .mutation(async ({ ctx, input }) => {
      await recordAiAdoption(ctx.session.user.id, input);
      return { ok: true };
    }),
});

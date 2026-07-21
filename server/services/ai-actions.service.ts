import { z } from "zod";
import { checkSiteRole } from "@/server/services/permission.service";
import type { UserRoleType } from "@/lib/constants/enums";
import { startPublish } from "@/server/services/publish.service";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { publishPageSchema, type PublishPage } from "@buildrik/shared/schemas/publish";
import type { TRPCContext } from "@/server/trpc/trpc";

// The execute-time claims: the consumed confirmation's siteId/actionId/argsHash
// plus the session actorId the router merges in.
export interface ActionClaims {
  actorId: string;
  siteId: string;
  actionId: string;
  argsHash: string;
}

// The minimal ctx an action needs: session + bearer for resolveWorkspaceId, plus
// the FULL prisma client (checkSiteRole wants PrismaClient, not the narrower
// WorkspaceCtx prisma). Composed so the protectedProcedure ctx assigns cleanly.
export type ActionCtx = Omit<Parameters<typeof resolveWorkspaceId>[0], "prisma"> & {
  prisma: TRPCContext["prisma"];
};

/**
 * Privileged-action registry (platform phase 3). The AI (or a UI button) PROPOSES
 * an action; the propose step issues a confirmation token; the confirm step
 * executes through the SAME domain path a human uses. This is AI-agnostic by
 * design (codex decision #3): the registry has no AI-specific logic.
 *
 * `schema` validates the AI-proposed args (bound into the token's argsHash).
 * `payloadSchema` validates the execute-time data the editor supplies at confirm.
 * `execute` MUST re-check authorization via the domain path — the token is a
 * proof-of-proposal, NOT a role grant.
 */
export interface ActionDef {
  /** Role checked at PROPOSE so non-admins fail early (correct failure point);
   *  execute still re-checks via the domain path (token is not a role grant). */
  minRole: Exclude<UserRoleType, "VIEWER">;
  schema: z.ZodTypeAny;
  payloadSchema: z.ZodTypeAny;
  describe(args: unknown): { title: string; consequence: string; undoable: boolean };
  execute(ctx: ActionCtx, claims: ActionClaims, payload: unknown): Promise<unknown>;
}

const PRIVILEGED_ACTIONS: Record<string, ActionDef> = {
  "site.publish": {
    // A designer (EDITOR site-role) may publish — same rule as the sites.publish
    // route (contracts §2, M3). The approval gate in startPublish is the real
    // control below OWNER; the role check here only enforces "at least an editor",
    // matching the UI so agent-native parity holds (an action a user can take, the
    // agent can take).
    minRole: "EDITOR",
    schema: z.object({}).strip(), // publish takes no AI-supplied args
    payloadSchema: z.object({ pages: z.array(publishPageSchema).max(500).optional() }),
    describe: () => ({
      title: "Publish site",
      consequence:
        "Deploys the live site to production. This is a remote job and cannot be undone with Cmd+Z.",
      undoable: false,
    }),
    execute: async (ctx, claims, payload) => {
      // Re-check the site role via the domain path — the token is not a role grant.
      await checkSiteRole(ctx.prisma, claims.actorId, claims.siteId, "EDITOR");
      const workspaceId = await resolveWorkspaceId(ctx);
      const { pages } = payload as { pages?: PublishPage[] };
      return startPublish(claims.siteId, workspaceId, claims.actorId, pages);
    },
  },
};

export function getAction(actionId: string): ActionDef | undefined {
  return PRIVILEGED_ACTIONS[actionId];
}

export function isKnownAction(actionId: string): boolean {
  return actionId in PRIVILEGED_ACTIONS;
}

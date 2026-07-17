import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";
import { VercelTeamPickerForm } from "./vercel-team-picker-form";

const PENDING_COOKIE = "buildrik_vercel_pending";

const PendingPayload = z
  .object({
    workspaceId: z.string(),
    userId: z.string(),
    vercelUserId: z.string(),
    teamId: z.string().nullable(),
    candidateTeams: z.array(
      z.object({ id: z.string(), name: z.string(), slug: z.string() }),
    ),
    exp: z.number(),
  })
  .passthrough();

export default async function VercelTeamPickerPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PENDING_COOKIE);

  if (!cookie?.value) {
    redirect("/dashboard/settings/integrations?error=oauth_state_invalid");
  }

  let payload: z.infer<typeof PendingPayload> | undefined;
  try {
    payload = PendingPayload.parse(JSON.parse(decrypt(cookie.value)));
  } catch {
    // fall through — redirect below handles it
  }

  if (!payload || Date.now() > payload.exp) {
    redirect("/dashboard/settings/integrations?error=oauth_state_invalid");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Pick a Vercel team</h1>
        <p className="mt-1 text-body text-neutral-600">
          Sites in this Buildrick workspace will deploy to the team you pick. You
          can change this by disconnecting and reconnecting.
        </p>
      </div>
      <VercelTeamPickerForm
        workspaceId={payload.workspaceId}
        defaultTeamId={payload.teamId}
        candidateTeams={payload.candidateTeams}
      />
    </div>
  );
}

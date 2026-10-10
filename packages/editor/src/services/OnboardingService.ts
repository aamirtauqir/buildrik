/**
 * Editor → dashboard Getting-started state (L1-015): one view per user × site,
 * computed by the server and read by both the rail pill and the checklist.
 *
 * Every call answers `null` when it cannot reach the server (signed out, the
 * standalone demo, offline) — the caller keeps what it already shows rather
 * than treating an unreachable server as "nothing done".
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import type { EditorOnboardingView, EditorTaskId } from "@buildrik/shared/schemas/onboarding";

async function orNull(run: () => Promise<unknown>): Promise<EditorOnboardingView | null> {
  try {
    return ((await run()) as EditorOnboardingView | undefined) ?? null;
  } catch {
    return null;
  }
}

export function fetchEditorOnboarding(siteId: string): Promise<EditorOnboardingView | null> {
  return orNull(() => getBuildrikClient(DASHBOARD_URL).onboarding.editorState.query({ siteId }));
}

export function recordEditorMilestone(siteId: string, milestone: EditorTaskId): Promise<EditorOnboardingView | null> {
  return orNull(() => getBuildrikClient(DASHBOARD_URL).onboarding.recordEditorMilestone.mutate({ siteId, milestone }));
}

export function setEditorChecklistDismissed(siteId: string, dismissed: boolean): Promise<EditorOnboardingView | null> {
  return orNull(() => getBuildrikClient(DASHBOARD_URL).onboarding.setEditorChecklistDismissed.mutate({ siteId, dismissed }));
}

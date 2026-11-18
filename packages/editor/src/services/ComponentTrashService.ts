/**
 * ComponentTrashService — "Recently deleted" components on the server
 * (`siteComponents.trash.*`, design-2l9 K18–K20, K42). A deleted master is
 * kept for 30 days; these calls list, restore and permanently delete it.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import type { ComponentDefinition } from "@/shared/types/components";
import type { ComponentTrashInfo, TrashedComponent } from "@buildrik/shared/schemas/site-component";

/* Full `siteComponents.trash.<proc>` chains: the tRPC orphan gate finds
   callers by that dotted path. */
const api = () => getBuildrikClient(DASHBOARD_URL);

export type ComponentTrashResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "not-found" | "forbidden" | "failed"; message: string };

async function run<T>(call: () => Promise<T>): Promise<ComponentTrashResult<T>> {
  try {
    return { ok: true, value: await call() };
  } catch (e) {
    const err = e as { message?: string; data?: { code?: string } };
    const code = err?.data?.code;
    const reason = code === "NOT_FOUND" ? "not-found" : code === "FORBIDDEN" ? "forbidden" : "failed";
    return { ok: false, reason, message: err?.message ?? "" };
  }
}

export interface RestoredComponent {
  component: ComponentDefinition;
  trash: ComponentTrashInfo | null;
}

export const componentTrashRemote = {
  list: (siteId: string): Promise<ComponentTrashResult<TrashedComponent[]>> =>
    run(() => api().siteComponents.trash.list.query({ siteId })),
  restore: (siteId: string, componentIds: string[]): Promise<ComponentTrashResult<RestoredComponent[]>> =>
    run(async () =>
      (await api().siteComponents.trash.restore.mutate({ siteId, componentIds })).map((r) => ({
        component: r.payload as ComponentDefinition,
        trash: r.trash,
      })),
    ),
  purge: (siteId: string, componentIds: string[]): Promise<ComponentTrashResult<{ deleted: number }>> =>
    run(() => api().siteComponents.trash.purge.mutate({ siteId, componentIds, confirm: "DELETE" })),
};

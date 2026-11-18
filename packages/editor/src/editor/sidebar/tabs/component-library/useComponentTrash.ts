/**
 * useComponentTrash — the Components panel's "Recently deleted"
 * (design-2l9 K18–K20, K42). The list is the server's: a master lands there
 * when its delete mirror reaches the server, so the list re-reads then. A
 * restore is a server call first; its answer re-registers the master and
 * re-links the instances nobody changed since the delete.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { TrashedComponent } from "@buildrik/shared/schemas/site-component";
import { componentTrashRemote } from "@/services/ComponentTrashService";
import { onComponentTrashChanged } from "@/services/componentSync";
import { restoreTrashedComponent } from "./componentTrash";

export type ComponentTrashLoad = "loading" | "ready" | "error";

export interface RestoredReceipt {
  names: string[];
  relinked: number;
  componentIds: string[];
}

export interface UseComponentTrash {
  items: TrashedComponent[];
  load: ComponentTrashLoad;
  busy: boolean;
  error: string | null;
  reload: () => void;
  restore: (ids: string[]) => Promise<RestoredReceipt | null>;
  purge: (ids: string[]) => Promise<boolean>;
}

export function useComponentTrash(composer: Composer | null, siteId: string | null): UseComponentTrash {
  const [items, setItems] = React.useState<TrashedComponent[]>([]);
  const [load, setLoad] = React.useState<ComponentTrashLoad>("loading");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    if (!siteId) return;
    void componentTrashRemote.list(siteId).then((r) => {
      if (r.ok) {
        setItems(r.value);
        setLoad("ready");
      } else {
        setLoad((prev) => (prev === "ready" ? prev : "error"));
      }
    });
  }, [siteId]);

  React.useEffect(() => {
    reload();
    return onComponentTrashChanged(reload);
  }, [reload]);

  const drop = (ids: string[]) => setItems((prev) => prev.filter((c) => !ids.includes(c.componentId)));

  const restore = React.useCallback(
    async (ids: string[]): Promise<RestoredReceipt | null> => {
      if (!siteId || !composer) return null;
      setBusy(true);
      setError(null);
      const r = await componentTrashRemote.restore(siteId, ids);
      if (!r.ok) {
        setBusy(false);
        if (r.reason === "not-found") drop(ids);
        else setError("Couldn’t restore. The deleted components are still here.");
        return null;
      }
      let relinked = 0;
      for (const { component, trash } of r.value) relinked += await restoreTrashedComponent(composer, component, trash);
      setBusy(false);
      drop(ids);
      return { names: r.value.map((c) => c.component.name), relinked, componentIds: r.value.map((c) => c.component.id) };
    },
    [siteId, composer],
  );

  const purge = React.useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!siteId) return false;
      setBusy(true);
      setError(null);
      const r = await componentTrashRemote.purge(siteId, ids);
      setBusy(false);
      if (r.ok || r.reason === "not-found") {
        drop(ids);
        return r.ok;
      }
      setError(
        r.reason === "forbidden"
          ? "Only an Admin can delete components permanently."
          : "Couldn’t delete permanently. The components are still here.",
      );
      return false;
    },
    [siteId],
  );

  return { items, load, busy, error, reload, restore, purge };
}

/**
 * usePageTrash — state for the Pages panel's "Recently deleted" view
 * (design-2l9 A-21). The list is the server's: a page lands there when the
 * save that no longer carries it reaches the server, so the list re-reads on
 * every PROJECT_SAVED while the view is open. A restore is a server call
 * first; only its answer adds the page back to the document, so the next
 * save carries it as a live page.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { pageTrashRemote } from "@/services/PageTrashService";
import type { TrashedPage } from "@buildrik/shared/schemas/pages";

export type TrashLoad = "loading" | "ready" | "error";

export type RestoreOutcome =
  | { kind: "restored"; slug: string; pageId: string }
  | { kind: "slug-taken"; suggestedSlug: string }
  | { kind: "refused" };

export interface UsePageTrash {
  items: TrashedPage[];
  load: TrashLoad;
  online: boolean;
  /** pageId → the line under its row after a refused or failed restore. */
  rowErrors: Record<string, string>;
  busyId: string | null;
  reload: () => void;
  restore: (page: TrashedPage, slug?: string) => Promise<RestoreOutcome>;
  purge: (page: TrashedPage, confirmName: string) => Promise<boolean>;
}

function useOnline(): boolean {
  const [online, setOnline] = React.useState(() => typeof navigator === "undefined" || navigator.onLine !== false);
  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function usePageTrash(composer: Composer | null, siteId: string | null): UsePageTrash {
  const [items, setItems] = React.useState<TrashedPage[]>([]);
  const [load, setLoad] = React.useState<TrashLoad>("loading");
  const [rowErrors, setRowErrors] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const online = useOnline();

  const reload = React.useCallback(() => {
    if (!siteId) return;
    void pageTrashRemote.list(siteId).then((r) => {
      if (r.ok) {
        setItems(r.value);
        setLoad("ready");
      } else {
        setLoad((prev) => (prev === "ready" ? prev : "error"));
      }
    });
  }, [siteId]);

  // Mounted only while the view is open.
  React.useEffect(() => {
    setLoad("loading");
    reload();
    if (!composer) return;
    composer.on(EVENTS.PROJECT_SAVED, reload);
    return () => {
      composer.off(EVENTS.PROJECT_SAVED, reload);
    };
  }, [composer, reload]);

  const setRowError = (id: string, text: string | null) =>
    setRowErrors((prev) => {
      const next = { ...prev };
      if (text) next[id] = text;
      else delete next[id];
      return next;
    });

  const restore = React.useCallback(
    async (page: TrashedPage, slug?: string): Promise<RestoreOutcome> => {
      if (!siteId || !composer) return { kind: "refused" };
      setBusyId(page.id);
      setRowError(page.id, null);
      const r = await pageTrashRemote.restore(siteId, page.id, slug);
      setBusyId(null);
      if (r.ok) {
        const { id, name, ...rest } = r.value;
        composer.elements.createPage(name, { id, ...rest });
        setItems((prev) => prev.filter((p) => p.id !== page.id));
        return { kind: "restored", slug: r.value.slug ?? page.slug, pageId: id };
      }
      if (r.reason === "slug-taken") return { kind: "slug-taken", suggestedSlug: r.suggestedSlug };
      if (r.reason === "not-found") {
        setItems((prev) => prev.filter((p) => p.id !== page.id));
        return { kind: "refused" };
      }
      setRowError(
        page.id,
        r.reason === "page-limit"
          ? r.message
          : `Couldn’t restore ${page.name}. The deleted page is still available here.`,
      );
      return { kind: "refused" };
    },
    [siteId, composer],
  );

  const purge = React.useCallback(
    async (page: TrashedPage, confirmName: string): Promise<boolean> => {
      if (!siteId) return false;
      setBusyId(page.id);
      const r = await pageTrashRemote.purge(siteId, page.id, confirmName);
      setBusyId(null);
      if (r.ok || r.reason === "not-found") {
        setItems((prev) => prev.filter((p) => p.id !== page.id));
        return r.ok;
      }
      setRowError(page.id, `Couldn’t delete ${page.name} permanently. It is still here.`);
      return false;
    },
    [siteId],
  );

  return { items, load, online, rowErrors, busyId, reload, restore, purge };
}

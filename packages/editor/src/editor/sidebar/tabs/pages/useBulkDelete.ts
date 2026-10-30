/**
 * useBulkDelete — the Pages bulk Delete from confirm to result (boards 183:2,
 * 139:48427 / 139:49184 / 139:49899 / 142:52543).
 *
 * Only outcomes the delete really produces are reported: the homepage (and
 * the last page) are KEPT by the guard and never sent; a page the engine
 * refuses (`deletePage` → false) FAILED and stays, selected, with a retry.
 * A partial result is a card above the list until the next action.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useToast } from "@/editor/chrome-ui";
import { listNames } from "@shared/utils/helpers/string";
import type { PageItem } from "./types";
import type { DeletePagesOptions, DeletePagesResult } from "./usePages";
import type { UseBulkSelectReturn } from "./useBulkSelect";

export interface BulkDeleteLine {
  name: string;
  text: string;
  error?: boolean;
}

export interface BulkDeleteReport {
  title: string;
  lines: BulkDeleteLine[];
  /** Pages still to retry. */
  retry: { ids: string[]; label: string } | null;
}

type Kept = { id: string; reason: string };

interface Outcome {
  phase: "deleted" | "restored" | "retried";
  deleted: string[];
  failed: string[];
  kept: Kept[];
  /** Deleted by the retry (phase "retried"). */
  retried: string[];
}

const isAre = (n: number) => (n === 1 ? "is" : "are");

export function useBulkDelete(opts: {
  pages: readonly PageItem[];
  orderedPageIds: readonly string[];
  bulk: UseBulkSelectReturn;
  deletePage: (id: string) => void;
  deletePages: (ids: string[], o?: DeletePagesOptions) => DeletePagesResult;
}) {
  const { pages, orderedPageIds, bulk, deletePage, deletePages } = opts;
  const { addToast } = useToast();
  const [confirmIds, setConfirmIds] = React.useState<string[] | null>(null);
  const keptRef = React.useRef<Kept[]>([]);
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  /* Names as they were when the delete was asked — a deleted page is gone
     from `pages` by the time the report is drawn. */
  const namesRef = React.useRef(new Map<string, string>());
  const nameOf = React.useCallback(
    (id: string) => pages.find((p) => p.id === id)?.name ?? namesRef.current.get(id) ?? "Page",
    [pages],
  );

  /** What a bulk delete would remove — never the homepage, never the last page. */
  const request = React.useCallback(() => {
    const selected = [...bulk.selectedIds];
    const kept: Kept[] = [];
    let deletable = selected.filter((id) => {
      const home = pages.find((p) => p.id === id)?.isHome;
      if (home) kept.push({ id, reason: "kept; it is the homepage" });
      return !home;
    });
    if (deletable.length >= pages.length && orderedPageIds.length > 0) {
      const spare = orderedPageIds[0];
      deletable = deletable.filter((id) => id !== spare);
      kept.push({ id: spare, reason: "kept; a site needs at least one page" });
    }
    if (deletable.length === 0) {
      if (selected.length > 0) deletePage(selected[0]);
      bulk.clearSelection();
      return;
    }
    keptRef.current = kept;
    namesRef.current = new Map(pages.map((p) => [p.id, p.name]));
    setOutcome(null);
    setConfirmIds(deletable);
  }, [bulk, pages, orderedPageIds, deletePage]);

  const confirm = React.useCallback(() => {
    const kept = keptRef.current;
    const ids = confirmIds ?? [];
    let done: DeletePagesResult = { deleted: [], failed: [] };
    done = deletePages(ids, {
      describe: (r) => {
        const still = [...kept.map((k) => k.id), ...r.failed];
        return still.length === 0
          ? `${r.deleted.length} page${r.deleted.length === 1 ? "" : "s"} deleted · ${r.deleted.map(nameOf).join(", ")}`
          : `${listNames(r.deleted.map(nameOf))} deleted. ${listNames(still.map(nameOf))} ${isAre(still.length)} still available.`;
      },
      onUndone: () => {
        addToast({ description: `${listNames(done.deleted.map(nameOf))} restored`, tone: "info" });
        setOutcome((o) => (o ? { ...o, phase: "restored" } : o));
      },
    });
    bulk.clearSelection();
    if (done.failed.length > 0 || kept.length > 0) {
      setOutcome({ phase: "deleted", deleted: done.deleted, failed: done.failed, kept, retried: [] });
      done.failed.forEach((id) => bulk.toggleSelect(id));
    }
  }, [confirmIds, deletePages, bulk, nameOf, addToast]);

  const retry = React.useCallback(() => {
    if (!outcome) return;
    const ids = outcome.failed.filter((id) => pages.some((p) => p.id === id));
    let done: DeletePagesResult = { deleted: [], failed: [] };
    done = deletePages(ids, {
      describe: (r) => `${listNames(r.deleted.map(nameOf))} deleted`,
      onUndone: () => {
        const rest = outcome.deleted.map(nameOf);
        addToast({
          description: `${listNames(done.deleted.map(nameOf))} restored${rest.length ? ` · ${listNames(rest)} remain${rest.length === 1 ? "s" : ""} deleted` : ""}`,
          tone: "info",
        });
        setOutcome(null);
      },
    });
    bulk.clearSelection();
    done.failed.forEach((id) => bulk.toggleSelect(id));
    setOutcome({ ...outcome, phase: "retried", retried: done.deleted, failed: done.failed });
  }, [outcome, pages, deletePages, bulk, nameOf, addToast]);

  const report = React.useMemo<BulkDeleteReport | null>(() => {
    if (!outcome) return null;
    const { phase, deleted, failed, kept, retried } = outcome;
    const keptLines = kept.map((k) => ({ name: nameOf(k.id), text: phase === "restored" ? "unchanged" : k.reason }));
    const failedLines = failed.map((id) => ({
      name: nameOf(id),
      text: phase === "restored" ? "still available; deletion failed" : "delete failed; page kept",
      error: true,
    }));
    const retryOf = failed.filter((id) => pages.some((p) => p.id === id));
    const retryBtn = phase !== "restored" && retryOf.length ? { ids: retryOf, label: `Retry delete ${listNames(retryOf.map(nameOf))}` } : null;
    if (phase === "restored") {
      return {
        title: `${listNames(deleted.map(nameOf))} restored`,
        lines: [...deleted.map((id) => ({ name: nameOf(id), text: "restored with its URL and settings" })), ...keptLines, ...failedLines],
        retry: null,
      };
    }
    if (phase === "retried") {
      return {
        title: retried.length ? `${listNames(retried.map(nameOf))} deleted` : "Delete failed again",
        lines: [
          ...retried.map((id) => ({ name: nameOf(id), text: "deleted after retry" })),
          ...failedLines,
          ...deleted.map((id) => ({ name: nameOf(id), text: "already deleted" })),
          ...keptLines,
        ],
        retry: retryBtn,
      };
    }
    const parts = [`${deleted.length} deleted`, kept.length ? `${kept.length} kept` : null, failed.length ? `${failed.length} failed` : null];
    return {
      title: parts.filter(Boolean).join(" · "),
      lines: [...deleted.map((id) => ({ name: nameOf(id), text: "deleted" })), ...keptLines, ...failedLines],
      retry: retryBtn,
    };
  }, [outcome, pages, nameOf]);

  return {
    confirmIds,
    closeConfirm: () => setConfirmIds(null),
    request,
    confirm,
    retry,
    report,
    deletedCount: outcome?.deleted.length ?? confirmIds?.length ?? 0,
  };
}

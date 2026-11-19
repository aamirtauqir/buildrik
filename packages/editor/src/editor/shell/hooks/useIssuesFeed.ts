/**
 * useIssuesFeed — the single producer behind the Issues panel's `state.issues`
 * (B-15 / audit finding A02-9: "four independent 'is this site OK?'
 * evaluators, and Issues sees only one of them").
 *
 * Before this hook, AquibraStudio's own effect wrote `state.issues` straight
 * from `composer.designSystem.lintState` — DS-lint token warnings only. The
 * Publish panel's pre-publish checks (`fetchPrePublishChecks`, the same
 * server call `PublishTab` already renders verbatim) were a second, disjoint
 * evaluator: a site could show "No issues" in Issues while Publish blocked it
 * outright, or the reverse. The decision-free part of A02-9 is exactly this —
 * route that existing check list into Issues too, not invent a third one.
 *
 * Three producers feed one array:
 *   - DS-lint token warnings (`composer.designSystem.lintState`)
 *   - page-content findings (`useContentIssueScanner` — missing alt, broken
 *     links; x3's own detectors)
 *   - non-passing pre-publish checks (`fetchPrePublishChecks`, verbatim
 *     server list — Publish panel's own SSOT, never re-implemented here)
 *   - collection lists with no source (`unsourcedListIssues`) — read from
 *     `composer.cms.bindings`, which the shared content detector cannot see
 *     (Play F4.01 `303:32296`, REQUESTS A-35)
 *
 * `scanState`/`rescan` surface the content scanner's states only — DS-lint is
 * synchronous (an event, not a fetch) and the check list fails open (a fetch
 * error there just means the row is silently absent, matching how a `null`
 * `checks` reads by omission elsewhere on this panel; the fetch already logs
 * loudly enough on the Publish side).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { CONTENT_CHECK_LABELS } from "@buildrik/shared/content/contentIssues";
import { fetchPrePublishChecks } from "@/services/PublishService";
import { EVENTS } from "@/shared/constants/events";
import { useRefetchOnFocus } from "@/shared/hooks";
import { isPageLive } from "@/engine/export";
import type { ElementData } from "@/shared/types";
import { useContentIssueScanner } from "./useContentIssueScanner";
import type { Issue } from "./useStudioState";

/** Issue-id prefix of a server pre-publish check row; the rest is its label. */
export const PUBLISH_CHECK_ISSUE = "publish-check:";

export interface UseIssuesFeedReturn {
  /** Content-scan state only ("idle" | "scanning" | "error") — the one
   *  producer here that runs long enough to need a visible in-progress /
   *  failed state in the panel. */
  scanState: "idle" | "scanning" | "error";
  /** Re-runs the content scan AND re-fetches the pre-publish checks — the
   *  panel's one "Try again" affordance covers both fallible sources. */
  rescan: () => void;
  /** The findings have been checked at least once and the last scan did not
   *  fail. False means the count is unknown — never show it as 0 (L4-038). */
  checked: boolean;
}

const SERVER_CONTENT_LABELS = new Set(Object.values(CONTENT_CHECK_LABELS));

/** Autosave can land every few seconds while someone types; one re-read per burst. */
const SAVE_REFETCH_DEBOUNCE_MS = 1000;

/** What else should re-read the server's check list (IR-1). */
export interface IssuesFeedTriggers {
  /** `usePublishJob().uiState` — a settled publish can change the checks. */
  publishState?: string;
  /** The Issues panel is open — opening it must never show a stale list. */
  panelOpen?: boolean;
  /** Load-scan findings (useLoadRepair) — computed elsewhere, listed here. */
  damageIssues?: Issue[];
}

/** Issue-id prefix of a collection list with no source; the rest is its element id. */
const UNSOURCED_LIST_ISSUE = "cms:list-no-source:";

/**
 * Severity of a list with no source. The board (F4.01) draws it as a
 * publishing blocker; whether a publish should refuse it is an open owner
 * question (REQUESTS A-35) — an unsourced list exports empty today and the
 * server does not refuse. Until that is answered it advises, so this hook
 * does not shut a publish door the server keeps open.
 */
const UNSOURCED_LIST_SEVERITY: Issue["type"] = "warning";

const kindLabel = (el: ElementData): string => {
  const t = el.type && el.type !== "container" ? el.type : el.tagName?.toLowerCase() || "element";
  return (el.content?.trim().slice(0, 40) || t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, " "));
};

/** Every `collection-list` on a live page with no collection bound to it. */
function unsourcedListIssues(composer: Composer): Issue[] {
  const out: Issue[] = [];
  const walk = (el: ElementData | undefined, parent: ElementData | null, pageId: string, pageName: string) => {
    if (!el) return;
    if (el.type === "collection-list" && !composer.cms.bindings.hasCollectionBinding(el.id)) {
      out.push({
        id: `${UNSOURCED_LIST_ISSUE}${el.id}`,
        type: UNSOURCED_LIST_SEVERITY,
        message: "Collection list has no source",
        location: parent ? `${pageName} › ${kindLabel(parent)}` : pageName,
        elementId: el.id,
        pageId,
      });
    }
    el.children?.forEach((c) => walk(c, el, pageId, pageName));
  };
  for (const page of composer.elements.exportPages().filter(isPageLive)) walk(page.root, null, page.id, page.name);
  return out;
}

const LIST_DEBOUNCE_MS = 300;
const LIST_EVENTS = [
  EVENTS.PROJECT_LOADED,
  EVENTS.PROJECT_CHANGED,
  EVENTS.ELEMENT_UPDATED,
  EVENTS.CMS_COLLECTION_BOUND,
  EVENTS.CMS_COLLECTION_UNBOUND,
] as const;

export function useIssuesFeed(
  composer: Composer | null,
  siteId: string | null,
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>,
  { publishState, panelOpen, damageIssues }: IssuesFeedTriggers = {},
): UseIssuesFeedReturn {
  const content = useContentIssueScanner(composer);

  const [lintIssues, setLintIssues] = React.useState<Issue[]>([]);
  React.useEffect(() => {
    const lint = composer?.designSystem?.lintState;
    if (!lint) {
      setLintIssues([]);
      return;
    }
    const sync = () => {
      setLintIssues(
        lint.getAllVisibleIssues().map(({ tokenId, issue }) => ({
          id: `${tokenId}:${issue.type}`,
          type: issue.severity === "error" ? ("error" as const) : ("warning" as const),
          message: issue.message,
          tokenId,
          autoFixHint: issue.autoFixHint,
          location: `Brand › ${tokenId}`,
        })),
      );
    };
    sync();
    lint.on("lint:changed", sync);
    return () => {
      lint.off("lint:changed", sync);
    };
  }, [composer]);

  const [listIssues, setListIssues] = React.useState<Issue[]>([]);
  React.useEffect(() => {
    if (!composer?.cms?.bindings) {
      setListIssues([]);
      return;
    }
    const sync = () => {
      try {
        setListIssues(unsourcedListIssues(composer));
      } catch (e) {
        console.error("[issues] collection-list scan failed", e);
      }
    };
    sync();
    /* Edits arrive per keystroke; one walk per burst, as the content scanner. */
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(sync, LIST_DEBOUNCE_MS);
    };
    LIST_EVENTS.forEach((e) => composer.on(e, later));
    return () => {
      clearTimeout(timer);
      LIST_EVENTS.forEach((e) => composer.off(e, later));
    };
  }, [composer]);

  const [checkIssues, setCheckIssues] = React.useState<Issue[]>([]);
  const [checkRetry, setCheckRetry] = React.useState(0);
  React.useEffect(() => {
    if (!siteId) {
      setCheckIssues([]);
      return;
    }
    let alive = true;
    fetchPrePublishChecks(siteId)
      .then((result) => {
        if (!alive) return;
        setCheckIssues(
          result.checks
            // The server's content rows ("Image alt text", "Links") are the
            // same shared detector the scanner above runs per element on the
            // live tree — listing both would count each fact twice.
            .filter((c) => c.status !== "pass" && !SERVER_CONTENT_LABELS.has(c.label))
            .map((c) => ({
              id: `${PUBLISH_CHECK_ISSUE}${c.label}`,
              type: c.status === "fail" ? ("error" as const) : ("warning" as const),
              message: c.detail,
              // Not `Publish › ${c.label}`: every label names the PASSING
              // state ("Vercel connected", "Domain connected"), so a failing
              // row read "Vercel connected · … Connect it to publish." The
              // detail already says what is wrong.
              location: "Publish",
            })),
        );
      })
      // Fetch failure here is silent, on purpose: the Publish panel is the
      // one place a broken check load is loud ("couldn't load · Retry",
      // DF5). Issues showing nothing from this source on a network blip is
      // the same "omission, not a false pass" shape as a missing row there.
      .catch(() => {
        if (alive) setCheckIssues([]);
      });
    return () => {
      alive = false;
    };
  }, [siteId, checkRetry]);

  /* The server's list changes when the server's data does: after a save
     reaches it, after a publish settles, on return to the tab — and whenever
     the panel opens. It used to be read once per mount, so a row the server
     had cleared kept counting as an open error ("Publish anyway"). */
  const refetchChecks = React.useCallback(() => setCheckRetry((n) => n + 1), []);
  React.useEffect(() => {
    if (!composer) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onSaved = () => {
      clearTimeout(timer);
      timer = setTimeout(refetchChecks, SAVE_REFETCH_DEBOUNCE_MS);
    };
    composer.on(EVENTS.PROJECT_SAVED, onSaved);
    return () => {
      clearTimeout(timer);
      composer.off(EVENTS.PROJECT_SAVED, onSaved);
    };
  }, [composer, refetchChecks]);
  React.useEffect(() => {
    if (publishState === "published" || publishState === "failed") refetchChecks();
  }, [publishState, refetchChecks]);
  React.useEffect(() => {
    if (panelOpen) refetchChecks();
  }, [panelOpen, refetchChecks]);
  useRefetchOnFocus(refetchChecks);

  React.useEffect(() => {
    setIssues([...lintIssues, ...content.issues, ...listIssues, ...checkIssues, ...(damageIssues ?? [])]);
  }, [lintIssues, content.issues, listIssues, checkIssues, damageIssues, setIssues]);

  const rescan = React.useCallback(() => {
    content.rescan();
    refetchChecks();
  }, [content, refetchChecks]);

  return { scanState: content.scanState, rescan, checked: content.checked && content.scanState !== "error" };
}

export default useIssuesFeed;

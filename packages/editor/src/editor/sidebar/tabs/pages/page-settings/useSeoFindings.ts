/**
 * Live SEO and readability findings for the page the drawer edits (FG-007 /
 * FG-008). Runs the shared analyzers over `extractSeoDocument` with the
 * drawer's staged draft, debounced 400 ms after a draft edit or a canvas
 * change; `stale` is true between a change and the recompute (the board's
 * "out of date" marker).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { extractSeoDocument, seoContextFor, type SeoDraft } from "@/engine/seo/extractSeoDocument";
import { analyzeSeo, type Finding } from "@buildrik/shared/seo/analysis";
import { analyzeReadability, type ReadabilityResult } from "@buildrik/shared/seo/readability";
import { seoStatus, type SeoStatus } from "@buildrik/shared/seo/status";

export const SEO_FINDINGS_DEBOUNCE_MS = 400;

export interface SeoFindingsState {
  findings: Finding[] | null;
  readability: ReadabilityResult | null;
  status: SeoStatus;
  stale: boolean;
  /** Re-run now (Fix found its target gone). */
  recompute: () => Finding[];
}

export function useSeoFindings(composer: Composer | null, pageId: string, draft: SeoDraft): SeoFindingsState {
  const [result, setResult] = React.useState<{ findings: Finding[]; readability: ReadabilityResult } | null>(null);
  const [stale, setStale] = React.useState(false);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  const compute = React.useCallback((): Finding[] => {
    if (!composer) return [];
    const doc = extractSeoDocument(composer, pageId, draftRef.current);
    if (!doc) return [];
    const next = { findings: analyzeSeo(doc, seoContextFor(composer, pageId)), readability: analyzeReadability(doc) };
    setResult(next);
    setStale(false);
    return next.findings;
  }, [composer, pageId]);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedule = React.useCallback(() => {
    setStale(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(compute, SEO_FINDINGS_DEBOUNCE_MS);
  }, [compute]);

  /* First run at once — the status reads "Not checked" only until then. */
  React.useEffect(() => {
    compute();
  }, [compute]);

  const draftKey = JSON.stringify(draft);
  const firstDraft = React.useRef(true);
  React.useEffect(() => {
    if (firstDraft.current) {
      firstDraft.current = false;
      return;
    }
    schedule();
  }, [draftKey, schedule]);

  React.useEffect(() => {
    if (!composer) return;
    const events = [EVENTS.ELEMENT_UPDATED, EVENTS.ELEMENT_CREATED, EVENTS.ELEMENT_DELETED, EVENTS.PROJECT_CHANGED] as const;
    for (const e of events) composer.on(e, schedule);
    return () => {
      for (const e of events) composer.off(e, schedule);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [composer, schedule]);

  return {
    findings: result?.findings ?? null,
    readability: result?.readability ?? null,
    status: seoStatus(result?.findings ?? null, { noIndex: draft.noIndex === true }),
    stale,
    recompute: compute,
  };
}

/**
 * ReadabilityTab — the drawer's Readability tab (boards SEO-M3 8198:225605,
 * M3b unsupported language 8198:226013, M3c empty page 8198:226393, M3d CMS
 * template 8198:226773). One state per `analyzeReadability` outcome; the
 * header carries the same status words as SEO — never a score.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { ReadabilityResult } from "@buildrik/shared/seo/readability";
import { SEO_STATUS_LABEL, seoStatus } from "@buildrik/shared/seo/status";
import { FindingsList } from "./FindingsList";

interface Props {
  readability: ReadabilityResult | null;
  locale: string;
}

/** "French" for "fr" — the language's English name, falling back to the code. */
export function languageName(locale: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(locale.split(/[-_]/)[0]) ?? locale;
  } catch {
    return locale;
  }
}

/** The status word the tab and its header show. */
export function readabilityLabel(r: ReadabilityResult | null): string {
  if (!r) return SEO_STATUS_LABEL["not-checked"];
  if (!r.evaluated && r.reason !== "cms-template") return "Not evaluated";
  return SEO_STATUS_LABEL[seoStatus(r.findings, { noIndex: false })];
}

const NOTICE = "tw:rounded-[var(--bk-radius-md)] tw:px-3 tw:py-2 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]";

export const ReadabilityTab: React.FC<Props> = ({ readability, locale }) => {
  if (!readability) {
    return <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">Not checked yet.</p>;
  }
  const label = readabilityLabel(readability);
  const dot =
    label === SEO_STATUS_LABEL["no-issues"] ? "tw:bg-[var(--bk-success)]" : label === SEO_STATUS_LABEL["needs-attention"] ? "tw:bg-[var(--bk-warning)]" : "tw:bg-[var(--bk-gray-400)]";
  return (
    <div className="tw:flex tw:flex-col tw:gap-3" data-testid="readability-tab">
      {readability.reason === "empty" ? (
        <div className={`${NOTICE} tw:bg-[var(--bk-bg-subtle)]`} data-testid="readability-note">
          Add some text to this page to check readability.
        </div>
      ) : (
        <>
          <div className="tw:flex tw:items-center tw:gap-2">
            <span aria-hidden="true" className={`tw:size-2 tw:rounded-full ${dot}`} />
            <span className="tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="readability-status">
              {`Readability: ${label}`}
            </span>
          </div>
          {readability.reason === "language" ? (
            <div className={`${NOTICE} tw:bg-[var(--bk-warning-tint)]`} data-testid="readability-note">
              {`Not evaluated for ${languageName(locale)} — readability analysis is not available for this language. The checks below work in any language.`}
            </div>
          ) : null}
          {readability.reason === "cms-template" ? (
            <div className={`${NOTICE} tw:bg-[var(--bk-bg-subtle)]`} data-testid="readability-note">
              Template page — checked on sample text.
            </div>
          ) : null}
          <FindingsList findings={readability.findings} />
        </>
      )}
    </div>
  );
};

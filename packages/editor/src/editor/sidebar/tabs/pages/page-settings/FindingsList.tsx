/**
 * The findings checklist (FG-007; board SEO-M1 "SEO analysis", check row
 * components 8205:231793): Problems · Improvements · Good results, with Good
 * collapsed. A row that can be fixed carries Fix (FG-010). No score.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Finding, FindingRating } from "@buildrik/shared/seo/analysis";

interface Props {
  findings: ReadonlyArray<Finding>;
  onFix?: (finding: Finding) => void;
  /** Dimmed while the page is hidden from search (M2c). */
  dimmed?: boolean;
}

const GROUPS: { rating: FindingRating; label: string; tone: string; dot: string }[] = [
  { rating: "problem", label: "Problems", tone: "tw:text-[var(--bk-error)]", dot: "tw:bg-[var(--bk-error)]" },
  { rating: "improvement", label: "Improvements", tone: "tw:text-[var(--bk-warning-text)]", dot: "tw:bg-[var(--bk-warning)]" },
  { rating: "good", label: "Good results", tone: "tw:text-[var(--bk-success-text)]", dot: "tw:bg-[var(--bk-success)]" },
];

export const FindingsList: React.FC<Props> = ({ findings, onFix, dimmed }) => {
  const [goodOpen, setGoodOpen] = React.useState(false);
  return (
    <div data-testid="seo-findings" className={`tw:flex tw:flex-col tw:gap-1 ${dimmed ? "tw:opacity-50" : ""}`}>
      {GROUPS.map((g) => {
        const rows = findings.filter((f) => f.rating === g.rating);
        if (rows.length === 0) return null;
        const collapsible = g.rating === "good";
        const open = !collapsible || goodOpen;
        const heading = `${g.label} (${rows.length})`;
        return (
          <section key={g.rating} aria-label={heading} data-testid={`seo-findings-${g.rating}`} className="tw:flex tw:flex-col tw:gap-1">
            {collapsible ? (
              <Button
                type="button"
                variant="link"
                aria-expanded={open}
                onClick={() => setGoodOpen((v) => !v)}
                className={`tw:h-[18px] tw:min-h-0 tw:self-start tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-semibold ${g.tone}`}
              >
                {`${open ? "⌄" : "›"} ${heading}`}
              </Button>
            ) : (
              <div className={`tw:text-[length:var(--bk-text-12)] tw:font-semibold tw:leading-[18px] ${g.tone}`}>{heading}</div>
            )}
            {open
              ? rows.map((f) => (
                  <div key={f.id} className="tw:flex tw:min-h-[18px] tw:items-center tw:gap-2" data-testid={`seo-finding-${f.id}`}>
                    <span aria-hidden="true" className={`tw:size-1.5 tw:flex-none tw:rounded-full ${g.dot}`} />
                    <span className="tw:flex-1 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]">{f.text}</span>
                    {f.fix && onFix && f.rating !== "good" ? (
                      <Button
                        type="button"
                        size="xs"
                        color="light"
                        className="tw:h-7 tw:border-transparent tw:bg-transparent tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium"
                        aria-label={`Fix: ${f.text}`}
                        onClick={() => onFix(f)}
                      >
                        Fix
                      </Button>
                    ) : null}
                  </div>
                ))
              : null}
          </section>
        );
      })}
    </div>
  );
};

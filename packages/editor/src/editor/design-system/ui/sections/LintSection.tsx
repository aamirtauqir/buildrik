/**
 * LintSection — the Lint destination on the Brand root (M5).
 *
 * Board `Brand · lint` (g4Gz… 154:2): one row per finding — severity dot,
 * message, the token it is about — and a closing note explaining when an
 * auto-fix is offered.
 *
 * **The board draws a `Fix ›` link on two rows and `Open` on the third. Neither
 * ships here, and that is deliberate.** `DSLinter.lint()` returns
 * `{ rule, severity, tokenId, message }` — there is no suggested replacement in
 * the result, so there is nothing for a Fix button to apply. Drawing one would
 * make the panel claim a capability the engine does not have, which is the
 * exact failure this whole arc was written to find. The closing note states the
 * rule the board itself states, and says plainly that the auto-fix is not built
 * yet rather than implying it is one click away.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { LintIssue, LintRuleId } from "../../../../engine/designSystem/linter";

export interface LintSectionProps {
  issues: readonly LintIssue[];
}

/** Human labels, kept in step with `DSLintBanner`'s RULE_LABEL. */
const RULE_LABEL: Record<LintRuleId, string> = {
  "banned-hue": "Banned hue — purple, violet or indigo",
  "pure-black": "Pure black",
  "empty-value": "Empty value",
  "missing-dark": "No dark variant",
  "unresolved-binding": "Unresolved binding",
  "alias-depth-exceeded": "Alias chain too deep",
  "semantic-needs-alias": "Semantic token needs an alias",
};

export const LintSection: React.FC<LintSectionProps> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="tw:px-2 tw:py-6 tw:text-center">
        <div className="tw:text-[13px] tw:text-gray-900">Nothing to fix</div>
        <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
          Every token passes the brand rules.
        </div>
      </div>
    );
  }

  /* Errors first: a banned hue is a shipping blocker, a missing dark variant is
     a gap. Sorting by severity keeps the blocker above the fold when the list
     is long. */
  const ordered = [...issues].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1,
  );

  return (
    <div>
      <ul className="tw:flex tw:flex-col tw:list-none tw:m-0 tw:p-0">
        {ordered.map((issue) => (
          <li
            key={`${issue.rule}:${issue.tokenId}`}
            className="tw:flex tw:items-start tw:gap-2 tw:px-2 tw:py-2"
          >
            <span
              aria-hidden="true"
              className="tw:mt-[6px] tw:size-[6px] tw:flex-none tw:rounded-full"
              style={{
                background:
                  issue.severity === "error" ? "var(--bk-error)" : "var(--bk-warning)",
              }}
            />
            <span className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
              <span className="tw:text-[13px] tw:text-gray-900">{issue.message}</span>
              <span className="tw:text-xs tw:text-gray-500">
                {RULE_LABEL[issue.rule] ?? issue.rule} · {issue.tokenId}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="tw:mt-3 tw:px-2 tw:text-xs tw:text-gray-500">
        Auto-fix isn&apos;t available yet — the linter reports what is wrong, not
        what to replace it with. Edit the token in Tokens.
      </p>
    </div>
  );
};

export default LintSection;

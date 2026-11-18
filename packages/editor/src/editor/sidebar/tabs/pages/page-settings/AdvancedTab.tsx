/**
 * AdvancedTab — design-2l9 board 63:17061: "Publish visibility" (Live ·
 * Hidden) as a select, "Search indexing: Indexed" read out with "Change in
 * SEO" (the switch lives once, on the SEO tab), "Follow links" as a select,
 * and the head code with its two rules. The board's "· Pro" on Head code is
 * not drawn: head code is not plan-gated in the code
 * (`authority: code:head-code-not-gated`).
 *
 * Decision #21: Password is removed until the published-site middleware
 * exists to enforce it; canonical URL comes later.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { UsePageSettingsReturn } from "./usePageSettings";
import { BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS, BK_LABEL_CLASS, Button, HelperText, Label, Select, Textarea } from "@/editor/chrome-ui";

interface Props {
  s: UsePageSettingsReturn;
}

const FIELD = "tw:flex tw:flex-col tw:gap-1.5";

export const AdvancedTab: React.FC<Props> = ({ s }) => (
  <div className="tw:flex tw:flex-col tw:gap-2.5">
    <div className={FIELD} data-testid="adv-field-visibility">
      <Label htmlFor="adv-visibility" className={BK_LABEL_CLASS} data-testid="adv-label-visibility">
        Publish visibility
      </Label>
      <Select
        id="adv-visibility"
        sizing="sm"
        data-testid="adv-input-visibility"
        value={s.visibility === "hidden" ? "hidden" : "live"}
        onChange={(e) => s.setVisibility(e.target.value === "hidden" ? "hidden" : "live")}
      >
        <option value="live">Live</option>
        <option value="hidden">Hidden</option>
      </Select>
      <HelperText className={BK_HELPER_CLASS}>
        {s.visibility === "hidden"
          ? "Not published. Hidden pages are left out of the deploy."
          : "Live means this page is included on the next publish."}
      </HelperText>
    </div>
    <div className={FIELD} data-testid="adv-indexing">
      <span className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">
        {`Search indexing: ${s.allowIndex ? "Indexed" : "Hidden"}`}
      </span>
      <Button
        variant="link"
        data-testid="adv-indexing-change"
        className="tw:h-7 tw:min-h-0 tw:self-start tw:px-2 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:text-[var(--bk-accent-text)]"
        onClick={() => s.setActiveTab("seo")}
      >
        Change in SEO
      </Button>
    </div>
    <div className={FIELD}>
      <Label htmlFor="adv-follow" className={BK_LABEL_CLASS}>Follow links</Label>
      <Select
        id="adv-follow"
        sizing="sm"
        aria-label="Follow links"
        data-testid="adv-input-follow"
        value={s.allowFollow ? "follow" : "nofollow"}
        onChange={(e) => s.setAllowFollow(e.target.value === "follow")}
      >
        <option value="follow">Follow</option>
        <option value="nofollow">No follow</option>
      </Select>
    </div>
    <div className={FIELD}>
      <Label htmlFor="adv-head" className={BK_LABEL_CLASS}>Head code</Label>
      <Textarea
        id="adv-head"
        data-testid="adv-input-head"
        value={s.customHead}
        onChange={(e) => s.setCustomHead(e.target.value)}
        placeholder="<!-- Page-specific head code -->"
        rows={5}
        spellCheck={false}
        aria-label="Custom head code"
        className="tw:[font-family:var(--bk-font-mono)] tw:text-[12px]"
      />
      {s.headCodeError && <HelperText color="red" className={BK_HELPER_ERROR_CLASS}>{s.headCodeError}</HelperText>}
      <HelperText className={BK_HELPER_CLASS}>Changes apply on the next publish.</HelperText>
      <HelperText className={BK_HELPER_CLASS}>Head code affects this page only and is sanitized before save.</HelperText>
    </div>
  </div>
);

AdvancedTab.displayName = "AdvancedTab";

/**
 * AdvancedTab — Visibility (Live · Hidden), indexing / follow, head code.
 *
 * Decision #21: Password is removed until the published-site middleware
 * exists to enforce it; canonical URL comes later.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { UsePageSettingsReturn } from "./usePageSettings";
import { BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS, BK_LABEL_CLASS, Button, HelperText, Label, Textarea, ToggleSwitch } from "@/editor/chrome-ui";

interface Props {
  s: UsePageSettingsReturn;
}

export const AdvancedTab: React.FC<Props> = ({ s }) => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-[18px]">
      {/* Visibility */}
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="adv-field-visibility">
        <div data-testid="adv-label-visibility" style={{ font: "600 11px var(--bk-font-ui)", color: "var(--bk-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Visibility
        </div>
        <div style={{ display: "inline-flex", padding: 2, background: "var(--bk-bg-subtle)", border: "1px solid var(--bk-border)", borderRadius: 4 }} role="radiogroup" aria-label="Page visibility">
          {(["live", "hidden"] as const).map((v) => (
            <Button
              key={v}
              color="light"
              size="xs"
              role="radio"
              aria-checked={s.visibility === v}
              style={{
                flex: 1,
                padding: "5px 14px",
                border: 0,
                background: s.visibility === v ? "var(--bk-bg-card)" : "transparent",
                color: s.visibility === v ? "var(--bk-ink)" : "var(--bk-ink-soft)",
                font: "500 12px var(--bk-font-ui)",
                cursor: "pointer",
                borderRadius: 3,
                transition: "background 100ms, color 100ms",
                boxShadow: s.visibility === v ? "var(--bk-shadow-drag)" : "none",
              }}
              onClick={() => s.setVisibility(v)} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
        {s.visibility === "hidden" && (
          <HelperText className={BK_HELPER_CLASS}>Not published. Hidden pages are left out of the deploy.</HelperText>
        )}
        <HelperText className={BK_HELPER_CLASS}>
          {s.visibility === "live" && "Page is publicly accessible."}
          {s.visibility === "hidden" && "Page is not linked in menus but reachable via direct URL."}
        </HelperText>
      </div>
      {/* Indexing */}
      <div className="tw:flex tw:flex-col tw:gap-2">
        <div style={{ font: "600 11px var(--bk-font-ui)", color: "var(--bk-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Search Engine Indexing
        </div>
        <div className="tw:flex tw:flex-nowrap tw:items-center tw:justify-between tw:gap-2">
          <div className="tw:flex tw:flex-col tw:gap-1">
            <Label className={BK_LABEL_CLASS}>Allow indexing</Label>
            <HelperText className={BK_HELPER_CLASS}>Let search engines list this page in results.</HelperText>
          </div>
          <ToggleSwitch checked={s.allowIndex} onChange={() => s.setAllowIndex(!s.allowIndex)} aria-label="Allow indexing" />
        </div>
        <div className="tw:flex tw:flex-nowrap tw:items-center tw:justify-between tw:gap-2">
          <div className="tw:flex tw:flex-col tw:gap-1">
            <Label className={BK_LABEL_CLASS}>Follow links</Label>
            <HelperText className={BK_HELPER_CLASS}>Let search engines follow outbound links on this page.</HelperText>
          </div>
          <ToggleSwitch checked={s.allowFollow} onChange={() => s.setAllowFollow(!s.allowFollow)} aria-label="Follow links" />
        </div>
      </div>
      {/* Head code */}
      <div className="tw:flex tw:flex-col tw:gap-2">
        <div style={{ font: "600 11px var(--bk-font-ui)", color: "var(--bk-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Custom &lt;head&gt; code
        </div>
        <Textarea
          data-testid="adv-input-head"
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          value={s.customHead}
          onChange={(e) => s.setCustomHead(e.target.value)}
          placeholder="<!-- analytics, meta tags, fonts -->"
          rows={6}
          spellCheck={false}
          aria-label="Custom head code"
          style={{ minHeight: 100, fontFamily: "var(--bk-font-mono)", fontSize: "11.5px", lineHeight: 1.4 }}
        />
        {s.headCodeError && <HelperText color="red" className={BK_HELPER_ERROR_CLASS}>{s.headCodeError}</HelperText>}
        <HelperText className={BK_HELPER_CLASS}>Injected into the &lt;head&gt; of this page only. Sanitized before save.</HelperText>
      </div>
    </div>
  );
};

AdvancedTab.displayName = "AdvancedTab";

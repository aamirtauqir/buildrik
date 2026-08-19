/**
 * AdvancedTab — Visibility, schedule, password, indexing, head code.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { UsePageSettingsReturn } from "./usePageSettings";
import { BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS, BK_LABEL_CLASS, Button, HelperText, Label, Textarea, TextInput, ToggleSwitch } from "@/editor/chrome-ui";

interface Props {
  s: UsePageSettingsReturn;
}

export const AdvancedTab: React.FC<Props> = ({ s }) => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-[18px]">
      {/* Visibility */}
      <div className="tw:flex tw:flex-col tw:gap-2">
        <div style={{ font: "600 11px var(--bk-font-ui)", color: "var(--bk-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Visibility
        </div>
        <div style={{ display: "inline-flex", padding: 2, background: "var(--bk-bg-subtle)", border: "1px solid var(--bk-border)", borderRadius: 4 }} role="radiogroup" aria-label="Page visibility">
          {(["live", "hidden", "password"] as const).map((v) => (
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
                font: "500 11.5px var(--bk-font-ui)",
                cursor: "pointer",
                borderRadius: 3,
                transition: "background 100ms, color 100ms",
                boxShadow: s.visibility === v ? "var(--bk-shadow-drag)" : "none",
              }}
              onClick={() => s.setVisibility(v)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
        {s.visibility !== "live" && (
          <HelperText className={BK_HELPER_CLASS}>
            Not published. Hidden pages are left out of the deploy, and static
            hosting cannot ask for a password — so a password page is left out
            too, rather than going live unprotected. Until the published-site
            middleware ships, this is the only way the setting can be kept.
          </HelperText>
        )}
        <HelperText className={BK_HELPER_CLASS}>
          {s.visibility === "live" && "Page is publicly accessible."}
          {s.visibility === "hidden" && "Page is not linked in menus but reachable via direct URL."}
          {s.visibility === "password" && "Visitors must enter a password to view this page."}
        </HelperText>
      </div>
      {/* Password input — only when visibility=password */}
      {s.visibility === "password" && (
        <div style={{ padding: 10, background: "var(--bk-bg-subtle)", border: "1px solid var(--bk-border)", borderRadius: 4, display: "flex", flexDirection: "column", gap: "var(--bk-space-8)" }}>
          <div className="tw:flex tw:flex-nowrap tw:items-center tw:gap-2">
            <TextInput
              type={s.showPassword ? "text" : "password"}
              value={s.password}
              onChange={(e) => s.setPassword(e.target.value)}
              placeholder="Enter password"
              aria-label="Page access password"
              style={{ flex: 1 }}
            />
            <Button color="light" size="xs" onClick={() => s.setShowPassword(!s.showPassword)} aria-label={s.showPassword ? "Hide password" : "Show password"}>
              {s.showPassword ? "Hide" : "Show"}
            </Button>
            <Button color="light" size="xs" onClick={() => s.copyPassword()} aria-label="Copy password" disabled={!s.password}>
              Copy
            </Button>
          </div>
          <HelperText className={BK_HELPER_CLASS}>Share this password with visitors who need access.</HelperText>
        </div>
      )}
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
          className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
          value={s.customHead}
          onChange={(e) => s.setCustomHead(e.target.value)}
          placeholder="<!-- analytics, meta tags, fonts -->"
          rows={6}
          spellCheck={false}
          aria-label="Custom head code"
          style={{ minHeight: 100, fontFamily: "var(--bk-font-mono)", fontSize: "11.5px", lineHeight: 1.4 }}
        />
        {s.headCodeError && <HelperText color="failure" className={BK_HELPER_ERROR_CLASS}>{s.headCodeError}</HelperText>}
        <HelperText className={BK_HELPER_CLASS}>Injected into the &lt;head&gt; of this page only. Sanitized before save.</HelperText>
      </div>
    </div>
  );
};

AdvancedTab.displayName = "AdvancedTab";

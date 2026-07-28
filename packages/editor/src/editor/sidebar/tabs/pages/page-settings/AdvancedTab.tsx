/**
 * AdvancedTab — Visibility, schedule, password, indexing, head code.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Cluster, HelperText, Input, Label, Stack, Textarea, Toggle } from "@/editor/ui";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
}

export const AdvancedTab: React.FC<Props> = ({ s }) => {
  return (
    <Stack gap="lg" style={{ gap: 18 }}>
      {/* Visibility */}
      <Stack gap="sm">
        <div style={{ font: "600 11px var(--bk-font-ui)", color: "var(--bk-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Visibility
        </div>
        <div style={{ display: "inline-flex", padding: 2, background: "var(--bk-bg-subtle)", border: "1px solid var(--bk-border)", borderRadius: 4 }} role="radiogroup" aria-label="Page visibility">
          {(["live", "hidden", "password"] as const).map((v) => (
            <Button
              key={v}
              kind="ghost"
              size="sm"
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
              onClick={() => s.setVisibility(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
        <HelperText>
          {s.visibility === "live" && "Page is publicly accessible."}
          {s.visibility === "hidden" && "Page is not linked in menus but reachable via direct URL."}
          {s.visibility === "password" && "Visitors must enter a password to view this page."}
        </HelperText>
      </Stack>
      {/* Password input — only when visibility=password */}
      {s.visibility === "password" && (
        <div style={{ padding: 10, background: "var(--bk-bg-subtle)", border: "1px solid var(--bk-border)", borderRadius: 4, display: "flex", flexDirection: "column", gap: "var(--bk-space-8)" }}>
          <Cluster nowrap>
            <Input
              type={s.showPassword ? "text" : "password"}
              value={s.password}
              onChange={(e) => s.setPassword(e.target.value)}
              placeholder="Enter password"
              aria-label="Page access password"
              style={{ flex: 1 }}
            />
            <Button kind="secondary" size="sm" onClick={() => s.setShowPassword(!s.showPassword)} aria-label={s.showPassword ? "Hide password" : "Show password"}>
              {s.showPassword ? "Hide" : "Show"}
            </Button>
            <Button kind="secondary" size="sm" onClick={() => s.copyPassword()} aria-label="Copy password" disabled={!s.password}>
              Copy
            </Button>
          </Cluster>
          <HelperText>Share this password with visitors who need access.</HelperText>
        </div>
      )}
      {/* Indexing */}
      <Stack gap="sm">
        <div style={{ font: "600 11px var(--bk-font-ui)", color: "var(--bk-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Search Engine Indexing
        </div>
        <Cluster justify="between" nowrap>
          <Stack gap="xs">
            <Label>Allow indexing</Label>
            <HelperText>Let search engines list this page in results.</HelperText>
          </Stack>
          <Toggle checked={s.allowIndex} onChange={() => s.setAllowIndex(!s.allowIndex)} aria-label="Allow indexing" />
        </Cluster>
        <Cluster justify="between" nowrap>
          <Stack gap="xs">
            <Label>Follow links</Label>
            <HelperText>Let search engines follow outbound links on this page.</HelperText>
          </Stack>
          <Toggle checked={s.allowFollow} onChange={() => s.setAllowFollow(!s.allowFollow)} aria-label="Follow links" />
        </Cluster>
      </Stack>
      {/* Head code */}
      <Stack gap="sm">
        <div style={{ font: "600 11px var(--bk-font-ui)", color: "var(--bk-ink)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Custom &lt;head&gt; code
        </div>
        <Textarea
          value={s.customHead}
          onChange={(e) => s.setCustomHead(e.target.value)}
          placeholder="<!-- analytics, meta tags, fonts -->"
          rows={6}
          spellCheck={false}
          aria-label="Custom head code"
          style={{ minHeight: 100, fontFamily: "var(--bk-font-mono)", fontSize: "11.5px", lineHeight: 1.4 }}
        />
        {s.headCodeError && <HelperText error>{s.headCodeError}</HelperText>}
        <HelperText>Injected into the &lt;head&gt; of this page only. Sanitized before save.</HelperText>
      </Stack>
    </Stack>
  );
};

AdvancedTab.displayName = "AdvancedTab";

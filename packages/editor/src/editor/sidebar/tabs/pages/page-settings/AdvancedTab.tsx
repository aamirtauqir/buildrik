import { Input } from "@/editor/shared/vibcoder/Input";
import { Textarea } from "@/editor/shared/vibcoder/Textarea";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Stack } from "@/editor/shared/vibcoder/Stack";
import { Cluster } from "@/editor/shared/vibcoder/Cluster";
import { Label } from "@/editor/shared/vibcoder/Label";
import { HelperText } from "@/editor/shared/vibcoder/HelperText";
import { Switch } from "@/editor/shared/vibcoder/Switch";
import { ToggleRow } from "@/editor/shared/vibcoder/ToggleRow";
/**
 * AdvancedTab — Visibility, schedule, password, indexing, head code.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
}

export const AdvancedTab: React.FC<Props> = ({ s }) => {
  return (
    <Stack gap="lg" style={{ gap: 18 }}>
      {/* Visibility */}
      <Stack gap="sm">
        <div style={{ font: "600 11px var(--bd-font)", color: "var(--bd-fg-heading)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Visibility
        </div>
        <div style={{ display: "inline-flex", padding: 2, background: "var(--bd-bg-subtle)", border: "1px solid var(--bd-border)", borderRadius: 4 }} role="radiogroup" aria-label="Page visibility">
          {(["live", "hidden", "password"] as const).map((v) => (
            <Button
              key={v}
              type="button"
              variant="ghost"
              size="sm"
              role="radio"
              aria-checked={s.visibility === v}
              style={{
                flex: 1,
                padding: "5px 14px",
                border: 0,
                background: s.visibility === v ? "var(--bd-bg-card)" : "transparent",
                color: s.visibility === v ? "var(--bd-fg-heading)" : "var(--bd-fg-secondary)",
                font: "500 11.5px var(--bd-font)",
                cursor: "pointer",
                borderRadius: 3,
                transition: "background 100ms, color 100ms",
                boxShadow: s.visibility === v ? "var(--bd-shadow-xs)" : "none",
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
        <div style={{ padding: 10, background: "var(--bd-bg-subtle)", border: "1px solid var(--bd-border)", borderRadius: 4, display: "flex", flexDirection: "column", gap: "var(--bd-space-2)" }}>
          <Cluster align="center" gap="xs">
            <Input
              type={s.showPassword ? "text" : "password"}
              value={s.password}
              onChange={(e) => s.setPassword(e.target.value)}
              placeholder="Enter password"
              aria-label="Page access password"
              style={{ flex: 1 }}
            />
            <Button variant="secondary" size="sm" onClick={() => s.setShowPassword(!s.showPassword)} type="button" aria-label={s.showPassword ? "Hide password" : "Show password"}>
              {s.showPassword ? "Hide" : "Show"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => s.copyPassword()} type="button" aria-label="Copy password" disabled={!s.password}>
              Copy
            </Button>
          </Cluster>
          <HelperText>Share this password with visitors who need access.</HelperText>
        </div>
      )}
      {/* Indexing */}
      <Stack gap="sm">
        <div style={{ font: "600 11px var(--bd-font)", color: "var(--bd-fg-heading)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Search Engine Indexing
        </div>
        <ToggleRow label="Allow indexing" helper="Let search engines list this page in results.">
          <Switch checked={s.allowIndex} onCheckedChange={() => s.setAllowIndex(!s.allowIndex)} aria-label="Allow indexing" />
        </ToggleRow>
        <ToggleRow label="Follow links" helper="Let search engines follow outbound links on this page.">
          <Switch checked={s.allowFollow} onCheckedChange={() => s.setAllowFollow(!s.allowFollow)} aria-label="Follow links" />
        </ToggleRow>
      </Stack>
      {/* Head code */}
      <Stack gap="sm">
        <div style={{ font: "600 11px var(--bd-font)", color: "var(--bd-fg-heading)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Custom &lt;head&gt; code
        </div>
        <Textarea
          value={s.customHead}
          onChange={(e) => s.setCustomHead(e.target.value)}
          placeholder="<!-- analytics, meta tags, fonts -->"
          rows={6}
          spellCheck={false}
          aria-label="Custom head code"
          style={{ minHeight: 100, fontFamily: "var(--bd-mono)", fontSize: "11.5px", lineHeight: 1.4 }}
        />
        {s.headCodeError && <HelperText tone="error">{s.headCodeError}</HelperText>}
        <HelperText>Injected into the &lt;head&gt; of this page only. Sanitized before save.</HelperText>
      </Stack>
    </Stack>
  );
};

AdvancedTab.displayName = "AdvancedTab";

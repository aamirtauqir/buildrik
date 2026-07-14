import { Input } from "@/editor/shared/vibcoder/Input";
import { Textarea } from "@/editor/shared/vibcoder/Textarea";
import { Stack } from "@/editor/shared/vibcoder/Stack";
import { Cluster } from "@/editor/shared/vibcoder/Cluster";
import { Label } from "@/editor/shared/vibcoder/Label";
import { HelperText } from "@/editor/shared/vibcoder/HelperText";
/**
 * SocialTab — Open Graph + Twitter sharing preview & fields.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
  page: PageItem;
}

export const SocialTab: React.FC<Props> = ({ s, page }) => {
  const title = s.ogTitle || s.seoTitle || page.name;
  const desc = s.ogDesc || s.seoDesc || "";
  const domain = s.domain ?? "yoursite.com";

  return (
    <Stack gap="lg" style={{ gap: 14 }}>
      {/* OG card preview — prototype .og-card */}
      <div style={{ maxWidth: 420, background: "var(--bd-bg-card)", border: "1px solid var(--bd-border)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: "100%", aspectRatio: "1200 / 630", display: "grid", placeItems: "center", background: "var(--bd-bg-subtle)", position: "relative" }} role="img" aria-label="Open Graph image preview">
          {s.ogImageUrl ? (
            <img src={s.ogImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <span style={{ font: "500 14px var(--bd-mono)", color: "var(--bd-fg-muted)", letterSpacing: "0.04em" }}>1200 × 630</span>
          )}
        </div>
        <Stack gap="xs" style={{ padding: "10px var(--bd-space-3)", gap: 2 }}>
          <div style={{ font: "500 10px var(--bd-mono)", color: "var(--bd-fg-muted)" }}>{domain}</div>
          <div style={{ font: "500 12.5px var(--bd-font)", color: "var(--bd-fg-heading)" }}>{title}</div>
          <div style={{ font: "400 11.5px var(--bd-font)", color: "var(--bd-fg-primary)", lineHeight: 1.4 }}>{desc || "Add a description to preview here"}</div>
        </Stack>
      </div>
      {/* OG Title */}
      <Stack gap="xs" style={{ gap: 6 }}>
        <Cluster align="center" gap="xs" style={{ justifyContent: "space-between" }}>
          <Label htmlFor="og-title">Open Graph Title</Label>
          <span style={{ font: "500 10.5px var(--bd-mono)", color: "var(--bd-fg-muted)" }}>{s.ogTitle.length}/60</span>
        </Cluster>
        <Input
          id="og-title"
          value={s.ogTitle}
          onChange={(e) => s.setOgTitle(e.target.value)}
          placeholder={s.seoTitle || page.name}
        />
        <HelperText>Title shown when the page is shared on social networks. Defaults to SEO title.</HelperText>
      </Stack>
      {/* OG Description */}
      <Stack gap="xs" style={{ gap: 6 }}>
        <Cluster align="center" gap="xs" style={{ justifyContent: "space-between" }}>
          <Label htmlFor="og-desc">Open Graph Description</Label>
          <span style={{ font: "500 10.5px var(--bd-mono)", color: "var(--bd-fg-muted)" }}>{s.ogDesc.length}/160</span>
        </Cluster>
        <Textarea
          id="og-desc"
          value={s.ogDesc}
          onChange={(e) => s.setOgDesc(e.target.value)}
          placeholder={s.seoDesc || "Brief summary shown on social"}
        />
      </Stack>
      {/* OG Image URL */}
      <Stack gap="xs" style={{ gap: 6 }}>
        <Label htmlFor="og-image">Image URL</Label>
        <Input
          id="og-image"
          value={s.ogImageUrl ?? ""}
          onChange={(e) => s.setOgImageUrl(e.target.value || null)}
          placeholder="https://…"
          type="url"
        />
        <HelperText>Recommended size: 1200×630. Appears in Facebook, Twitter/X, LinkedIn previews.</HelperText>
      </Stack>
    </Stack>
  );
};

SocialTab.displayName = "SocialTab";

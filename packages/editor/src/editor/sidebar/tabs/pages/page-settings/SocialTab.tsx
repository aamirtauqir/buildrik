/**
 * SocialTab — the page's sharing fields, design-2l9 board 63:16507: what an
 * empty field falls back to, "Social title · n / 60", "Social description"
 * with its count under it, the "Social image" preview, and "Social image URL"
 * with its rule. (The full share-card mock that sat on top is gone — the
 * board draws the image alone.)
 *
 * FG-011 (owner 2026-11-19, inside the 2L9 modal): X shares these values
 * unless "Customize for X" is on; then it has its own title, description and
 * image, each labelled customized or inherited.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BK_HELPER_CLASS, BK_LABEL_CLASS, HelperText, Label, Textarea, TextInput, ToggleSwitch } from "@/editor/chrome-ui";
import type { UsePageSettingsReturn } from "./usePageSettings";

interface Props {
  s: UsePageSettingsReturn;
}

const FIELD = "tw:flex tw:flex-col tw:gap-1.5";
const COUNT = "tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-soft)]";

export const SocialTab: React.FC<Props> = ({ s }) => (
  <div className="tw:flex tw:flex-col tw:gap-2.5">
    {/* SEOInjector: ogTitle || title, ogDescription || description. */}
    <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="social-explainer">
      Empty social title uses SEO title; empty description uses the SEO description.
    </p>
    <div className={FIELD} data-testid="social-field-title">
      <Label htmlFor="og-title" className={BK_LABEL_CLASS} data-testid="social-label-title">
        {`Social title · ${s.ogTitle.length} / 60`}
      </Label>
      <TextInput
        id="og-title"
        data-testid="social-input-title"
        value={s.ogTitle}
        onChange={(e) => s.setOgTitle(e.target.value)}
        placeholder={s.effectiveTitle}
      />
    </div>
    <div className={FIELD} data-testid="social-field-desc">
      <Label htmlFor="og-desc" className={BK_LABEL_CLASS} data-testid="social-label-desc">Social description</Label>
      <Textarea
        id="og-desc"
        rows={2}
        value={s.ogDesc}
        onChange={(e) => s.setOgDesc(e.target.value)}
        placeholder={s.seoDesc || "Brief summary shown on social"}
      />
      <span className={COUNT} data-testid="social-count-desc">{`${s.ogDesc.length} / 160`}</span>
    </div>
    <div className={FIELD}>
      <span className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">Social image</span>
      <div
        className="tw:grid tw:h-[124px] tw:w-60 tw:place-items-center tw:overflow-hidden tw:rounded-md tw:bg-[var(--bk-gray-100)]"
        role="img"
        aria-label="Social image preview"
        data-testid="social-image-preview"
      >
        {s.ogImageUrl ? (
          <img src={s.ogImageUrl} alt="" className="tw:block tw:size-full tw:object-cover" />
        ) : (
          <span className="tw:text-[length:var(--bk-text-12)] tw:tabular-nums tw:text-[var(--bk-ink-muted)]">1200 × 630</span>
        )}
      </div>
    </div>
    <div className={FIELD} data-testid="social-field-image">
      <Label htmlFor="og-image" className={BK_LABEL_CLASS} data-testid="social-label-image">Social image URL</Label>
      <TextInput
        id="og-image"
        data-testid="social-input-image"
        value={s.ogImageUrl ?? ""}
        onChange={(e) => s.setOgImageUrl(e.target.value || null)}
        placeholder="https://…"
        type="url"
      />
      <HelperText className={BK_HELPER_CLASS}>Recommended: 1200 × 630. Clear the URL to remove the image.</HelperText>
    </div>
    <div className={FIELD} data-testid="social-x">
      <ToggleSwitch
        checked={s.xCustomized}
        onChange={s.setXCustomized}
        label="Customize for X"
        data-testid="social-x-toggle"
      />
      <span className={COUNT} data-testid="social-x-state">
        {s.xCustomized ? "X uses its own title, description and image." : "X uses the social title, description and image above."}
      </span>
    </div>
    {s.xCustomized ? (
      <>
        <div className={FIELD} data-testid="social-field-x-title">
          <Label htmlFor="x-title" className={BK_LABEL_CLASS}>{`X title · ${s.xTitle.length} / 70`}</Label>
          <TextInput id="x-title" data-testid="social-input-x-title" value={s.xTitle} onChange={(e) => s.setXTitle(e.target.value)} placeholder={s.ogTitle || s.effectiveTitle} />
        </div>
        <div className={FIELD} data-testid="social-field-x-desc">
          <Label htmlFor="x-desc" className={BK_LABEL_CLASS}>X description</Label>
          <Textarea id="x-desc" rows={2} data-testid="social-input-x-desc" value={s.xDesc} onChange={(e) => s.setXDesc(e.target.value)} placeholder={s.ogDesc || s.seoDesc} />
          <span className={COUNT}>{`${s.xDesc.length} / 200`}</span>
        </div>
        <div className={FIELD} data-testid="social-field-x-image">
          <Label htmlFor="x-image" className={BK_LABEL_CLASS}>X image URL</Label>
          <TextInput
            id="x-image"
            type="url"
            data-testid="social-input-x-image"
            value={s.xImageUrl ?? ""}
            onChange={(e) => s.setXImageUrl(e.target.value || null)}
            placeholder={s.ogImageUrl ?? s.siteOgImage ?? "https://…"}
          />
        </div>
      </>
    ) : null}
  </div>
);

SocialTab.displayName = "SocialTab";

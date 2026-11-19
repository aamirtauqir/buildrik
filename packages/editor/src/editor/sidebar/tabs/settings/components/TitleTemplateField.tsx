/**
 * Settings › SEO › Defaults — the optional site title template (L3-036,
 * owner 2026-10-10). No board draws it yet (ledger delta 4), so it follows
 * the Defaults card's own field pattern: an 11/400 label over a 32-tall
 * input, with the token chips and a live preview under it.
 *
 * The preview runs the one resolver's `applyTitleTemplate`, so it is the
 * title a page without its own SEO title ships with. A template without
 * `{page_title}` is ignored by that resolver — the field says so.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { applyTitleTemplate } from "@buildrik/shared/seo/titles";
import { Field, Input, SCREEN_FIELD_ERROR } from "../shared";

interface Props {
  value: string;
  onChange: (next: string) => void;
  siteName: string;
  /** The page title the preview fills in (the home page's name, say). */
  samplePageTitle: string;
  /** A server refusal for the field, shown when there is no local one. */
  serverError?: string | null;
}

const TOKENS = ["{page_title}", "{site_name}"] as const;

/* Density-24 chips: flowbite `size="xs"` with the screen's ghost dress. */
const CHIP =
  "tw:h-6 tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:px-2 " +
  "tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export const TITLE_TEMPLATE_TOKEN_ERROR = "Include {page_title} so each page keeps its own title.";

export const TitleTemplateField: React.FC<Props> = ({ value, onChange, siteName, samplePageTitle, serverError }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const trimmed = value.trim();
  const localError = trimmed && !trimmed.includes("{page_title}") ? TITLE_TEMPLATE_TOKEN_ERROR : null;
  const error = localError ?? serverError ?? null;
  const sample = samplePageTitle.trim() || "About";
  const preview = applyTitleTemplate(sample, value, siteName);

  const insert = (token: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <Field label="Title template" hint="Optional" htmlFor="seo-title-template" siteColumn="seo.metaTitleTemplate" span="full">
      <Input
        ref={inputRef}
        id="seo-title-template"
        type="text"
        value={value}
        placeholder="{page_title} · {site_name}"
        aria-invalid={error ? true : undefined}
        aria-describedby="seo-title-template-preview"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        {TOKENS.map((token) => (
          <Button key={token} type="button" size="xs" color="light" className={CHIP} onClick={() => insert(token)}>
            Insert {token}
          </Button>
        ))}
      </div>
      {error ? (
        <div role="alert" className={SCREEN_FIELD_ERROR}>
          {error}
        </div>
      ) : null}
      <div
        id="seo-title-template-preview"
        className="tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-ink-muted)]"
        data-testid="set-seo-title-template-preview"
      >
        A page without its own SEO title ships as: <span className="tw:text-[var(--bk-ink)]">{preview}</span>
      </div>
    </Field>
  );
};

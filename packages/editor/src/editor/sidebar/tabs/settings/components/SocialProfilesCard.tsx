/**
 * SocialProfilesCard — 8135:214533 `Card · Social profiles`: the six networks
 * a site links to (Q-B9), one label-left row each — label 13 ink-soft in one
 * half, a white 32 input in the other, 8 between rows.
 *
 * Each value is checked with the shared `socialLinksSchema` (an https link;
 * Twitter/X also takes an `@handle`, stored as the x.com link) — the same
 * schema `siteDetail.settings.update` applies, so the field says what the
 * server would refuse before Save does.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextInput } from "@/editor/chrome-ui";
import { SOCIAL_NETWORKS, socialLinksSchema, type SocialNetwork } from "@buildrik/shared/schemas/site-detail";
import { SCREEN_FIELD_ERROR } from "../shared";
import { SettingsCard } from "./SettingsCard";

export type SocialProfiles = Record<SocialNetwork, string>;

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  twitter: "Twitter/X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  youtube: "YouTube",
  github: "GitHub",
};

const PLACEHOLDERS: Record<SocialNetwork, string> = {
  twitter: "https://x.com/… or @handle",
  facebook: "https://facebook.com/…",
  linkedin: "https://linkedin.com/company/…",
  instagram: "https://instagram.com/…",
  youtube: "https://youtube.com/@…",
  github: "https://github.com/…",
};

/** The server's refusal for one network's value, or null. */
export function socialLinkError(network: SocialNetwork, value: string): string | null {
  const parsed = socialLinksSchema.safeParse({ [network]: value });
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Use an https:// link.";
}

export const emptySocialProfiles = (): SocialProfiles =>
  Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n, ""])) as SocialProfiles;

export interface SocialProfilesCardProps {
  values: SocialProfiles;
  onChange(network: SocialNetwork, value: string): void;
  /** Server refusals keyed by network. */
  errors?: Partial<Record<SocialNetwork, string>>;
  open: boolean;
  onToggle(open: boolean): void;
}

export function SocialProfilesCard({ values, onChange, errors, open, onToggle }: SocialProfilesCardProps) {
  return (
    <SettingsCard
      title="Social profiles"
      open={open}
      onToggle={onToggle}
      anchors={SOCIAL_NETWORKS.map((n) => `social-${n}`)}
    >
      <div className="tw:flex tw:flex-col tw:gap-2 tw:-mt-2">
        {SOCIAL_NETWORKS.map((network) => {
          const id = `social-${network}`;
          const error = socialLinkError(network, values[network]) ?? errors?.[network] ?? null;
          return (
            <div key={network} className="tw:flex tw:flex-col tw:gap-1" data-testid={`set-field-${id}`}>
              <div className="tw:flex tw:min-h-8 tw:items-center tw:gap-4">
                <label
                  htmlFor={id}
                  className="tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]"
                >
                  {SOCIAL_LABELS[network]}
                </label>
                <div className="tw:min-w-0 tw:flex-1">
                  <TextInput
                    id={id}
                    type="text"
                    value={values[network]}
                    placeholder={PLACEHOLDERS[network]}
                    aria-invalid={error ? true : undefined}
                    onChange={(e) => onChange(network, e.target.value)}
                  />
                </div>
              </div>
              {error ? (
                <div role="alert" className={`${SCREEN_FIELD_ERROR} tw:self-end tw:w-1/2`}>
                  {error}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
}

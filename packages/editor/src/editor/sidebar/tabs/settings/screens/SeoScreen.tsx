/**
 * SEO — 8135:214533 (default) · 8135:214820 (Indexing open) · 8135:215066
 * (indexing off). Three cards, each a disclosure: Defaults (title,
 * description, Open Graph image) and Social profiles open, Indexing closed —
 * plus the strip that per-page overrides live in Pages, and, while indexing is
 * off, the notice that says what that does.
 *
 * Values come from the Site row on open (load card / Try again). Edits stay
 * here until Save:
 *  - the flush hands the shell `seo.metaTitle` / `metaDescription` /
 *    `defaultOgImage` / `socialLinks` / `allowIndexing` / `robotsTxt` — Site
 *    columns, written by `siteDetail.settings.update`;
 *  - a changed canonical URL has no settings path, so the flush hands it to
 *    the shell as an extra column — the same `settings.update` carries it.
 *
 * Social profiles carry all six networks (Q-B9); the old JSON-only Twitter
 * handle is offered in the Twitter/X field when that link is empty, and the
 * server stores an `@handle` as its x.com link (BE-4) — so the handle no
 * longer needs a save path of its own.
 *
 * robots.txt is edited here now (PD-1): empty means the generated default,
 * which the well shows as its placeholder.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ToggleSwitch } from "@/editor/chrome-ui";
import type { BuildrikApiClient } from "@/services/api-client";
import { EVENTS } from "@/shared/constants/events";
import type { ProjectSettings } from "@/shared/types/project";
import { SOCIAL_NETWORKS, updateSiteSettingsSchema, type SocialNetwork } from "@buildrik/shared/schemas/site-detail";
import { siteOrigin, type SiteDomainRow } from "@buildrik/shared/seo/urls";
import { Field, Input, LoadCard, SCREEN_FIELD_ERROR, SaveErrorBanner, Screen, SiteColumnGate, Textarea } from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps, SettingsFlushResult } from "../types";
import { SettingsCard } from "../components/SettingsCard";
import {
  SocialProfilesCard,
  emptySocialProfiles,
  socialLinkError,
  type SocialProfiles,
} from "../components/SocialProfilesCard";

/** What this screen reads off `siteDetail.settings.get`. */
interface SeoRow {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  allowIndexing?: boolean | null;
  robotsTxt?: string | null;
  socialLinks?: unknown;
}

/**
 * The robots.txt the site publishes: `Site.robotsTxt` verbatim when set, else
 * the default the indexing switch drives, plus the sitemap pointer when
 * indexing is on and the origin is known (mirrors `lib/publish-files.ts`).
 */
export function robotsPreview(input: { robotsTxt: string; allowIndexing: boolean; origin: string | null }): string {
  if (input.robotsTxt.trim()) return input.robotsTxt;
  const lines = ["User-agent: *", input.allowIndexing ? "Allow: /" : "Disallow: /"];
  if (input.allowIndexing && input.origin) lines.push(`Sitemap: ${input.origin}/sitemap.xml`);
  return lines.join("\n");
}

type ColumnKey = "metaTitle" | "metaDescription" | "ogImage" | "canonicalUrl";
/** The server's own refusal for one column value (the shared schema), or null. */
function columnError(key: ColumnKey, value: string): string | null {
  const parsed = updateSiteSettingsSchema.shape[key].safeParse(value);
  if (parsed.success) return null;
  const issue = parsed.error.issues[0];
  if (issue?.code === "too_big") {
    return `Keep it under ${String((issue as { maximum?: number }).maximum ?? "")} characters — search results cut it there.`;
  }
  return issue?.message ?? "This value is not accepted.";
}

function socialProfilesOf(links: unknown, legacyHandle: string): SocialProfiles {
  const out = emptySocialProfiles();
  if (typeof links === "object" && links !== null) {
    for (const network of SOCIAL_NETWORKS) {
      const value = (links as Record<string, unknown>)[network];
      if (typeof value === "string") out[network] = value;
    }
  }
  if (!out.twitter && legacyHandle) out.twitter = legacyHandle;
  return out;
}

/* 8135:214808 `Notice · info` / 8135:215066 indexing-off: 16 × 12 in, a 4
   radius, 13/20 ink — accent tint for the info strip, warning tint for off. */
const NOTICE = "tw:rounded-[var(--bk-radius-sm)] tw:px-4 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
/* 8135:214820 `Reset to default`: ghost, 32 tall, 12 in, 13/500. */
const GHOST_BTN =
  "tw:h-8 tw:shrink-0 tw:rounded-[var(--bk-radius-md)] tw:border-0 tw:bg-transparent tw:px-3 tw:text-[length:var(--bk-text-13)] " +
  "tw:font-medium tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:disabled:bg-transparent tw:focus:ring-0 tw:focus:shadow-none " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export const SeoScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerFlushHandler,
  registerFieldErrors,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
  fieldErrors,
}) => {
  const seo = composer?.getProjectSettings().seo;
  const legacyHandle = seo?.twitterHandle ?? "";
  const [metaTitle, setMetaTitle] = React.useState(seo?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = React.useState(seo?.metaDescription ?? "");
  const [ogImage, setOgImage] = React.useState(seo?.defaultOgImage ?? "");
  const [social, setSocial] = React.useState<SocialProfiles>(() => socialProfilesOf(seo?.socialLinks, legacyHandle));
  const [allowIndexing, setAllowIndexing] = React.useState(seo?.allowIndexing ?? true);
  const [robotsTxt, setRobotsTxt] = React.useState(seo?.robotsTxt ?? "");
  const [canonical, setCanonical] = React.useState("");
  const [savedCanonical, setSavedCanonical] = React.useState("");
  const [origin, setOrigin] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState({ defaults: true, social: true, indexing: false });

  /* The values the server holds — dirty is a difference from them, so typing
     a field back to its saved value is clean again. (Canonical has its own
     `savedCanonical`.) */
  const snapshot = (v: { metaTitle: string; metaDescription: string; ogImage: string; social: SocialProfiles; allowIndexing: boolean; robotsTxt: string }) =>
    JSON.stringify([v.metaTitle, v.metaDescription, v.ogImage, v.social, v.allowIndexing, v.robotsTxt]);
  const [saved, setSaved] = React.useState(() =>
    snapshot({
      metaTitle: seo?.metaTitle ?? "",
      metaDescription: seo?.metaDescription ?? "",
      ogImage: seo?.defaultOgImage ?? "",
      social: socialProfilesOf(seo?.socialLinks, legacyHandle),
      allowIndexing: seo?.allowIndexing ?? true,
      robotsTxt: seo?.robotsTxt ?? "",
    }),
  );

  const load = useServerLoad<{ row: SeoRow; domains: SiteDomainRow[] }>(
    projectId,
    async (client: BuildrikApiClient, siteId) => {
      const [row, domains] = await Promise.all([
        client.siteDetail.settings.get.query({ siteId }),
        client.siteDetail.domains.list.query({ siteId }).catch((): SiteDomainRow[] => []),
      ]);
      return { row, domains };
    },
    ({ row, domains }) => {
      setMetaTitle(row.metaTitle ?? "");
      setMetaDescription(row.metaDescription ?? "");
      setOgImage(row.ogImage ?? "");
      setSocial(socialProfilesOf(row.socialLinks, legacyHandle));
      setAllowIndexing(row.allowIndexing ?? true);
      setRobotsTxt(row.robotsTxt ?? "");
      setCanonical(row.canonicalUrl ?? "");
      setSavedCanonical(row.canonicalUrl ?? "");
      setSaved(
        snapshot({
          metaTitle: row.metaTitle ?? "",
          metaDescription: row.metaDescription ?? "",
          ogImage: row.ogImage ?? "",
          social: socialProfilesOf(row.socialLinks, legacyHandle),
          allowIndexing: row.allowIndexing ?? true,
          robotsTxt: row.robotsTxt ?? "",
        }),
      );
      setOrigin(siteOrigin(domains, composer?.getProjectMetadata().publishedUrl, row.canonicalUrl));
    },
    { onLoadStateChange, registerRetryLoad },
  );

  const current = snapshot({ metaTitle, metaDescription, ogImage, social, allowIndexing, robotsTxt });
  const dirty = current !== saved || canonical.trim() !== savedCanonical.trim();
  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const currentRef = React.useRef(current);
  currentRef.current = current;

  const errors = {
    metaTitle: columnError("metaTitle", metaTitle),
    metaDescription: columnError("metaDescription", metaDescription),
    ogImage: columnError("ogImage", ogImage),
    canonical: columnError("canonicalUrl", canonical),
  };
  const socialErrors = Object.fromEntries(
    SOCIAL_NETWORKS.map((n) => [n, socialLinkError(n, social[n])]).filter((e) => e[1]),
  ) as Partial<Record<SocialNetwork, string>>;

  /* The screen's own refusals keep Save off (§27), keyed as the server keys them. */
  const errorKey = JSON.stringify([errors, socialErrors]);
  React.useEffect(() => {
    if (!registerFieldErrors) return;
    const out: Record<string, string> = {};
    if (errors.metaTitle) out["seo.metaTitle"] = errors.metaTitle;
    if (errors.metaDescription) out["seo.metaDescription"] = errors.metaDescription;
    if (errors.ogImage) out["seo.defaultOgImage"] = errors.ogImage;
    if (errors.canonical) out.canonicalUrl = errors.canonical;
    for (const [n, message] of Object.entries(socialErrors)) out[`seo.socialLinks.${n}`] = message;
    registerFieldErrors(out);
    return () => registerFieldErrors(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- errorKey is the value of both objects
  }, [registerFieldErrors, errorKey]);

  /* A refusal (or a search hit) in a closed card opens it. */
  React.useEffect(() => {
    if (!fieldErrors) return;
    const keys = Object.keys(fieldErrors);
    setOpen((o) => ({
      defaults: o.defaults || keys.some((k) => /^seo\.(metaTitle|metaDescription|defaultOgImage)/.test(k)),
      social: o.social || keys.some((k) => k.startsWith("seo.socialLinks")),
      indexing: o.indexing || keys.some((k) => k === "canonicalUrl" || /^seo\.(allowIndexing|robotsTxt)/.test(k)),
    }));
  }, [fieldErrors]);

  const stateRef = React.useRef({ metaTitle, metaDescription, ogImage, social, allowIndexing, robotsTxt, canonical, savedCanonical });
  stateRef.current = { metaTitle, metaDescription, ogImage, social, allowIndexing, robotsTxt, canonical, savedCanonical };

  const flush = React.useCallback((): SettingsFlushResult => {
    if (!composer) return;
    const current = composer.getProjectSettings();
    const s = stateRef.current;
    const settings: ProjectSettings = {
      ...current,
      seo: {
        ...current.seo,
        metaTitle: s.metaTitle,
        metaDescription: s.metaDescription,
        defaultOgImage: s.ogImage,
        socialLinks: { ...s.social },
        allowIndexing: s.allowIndexing,
        robotsTxt: s.robotsTxt,
      },
    };
    const sent = currentRef.current;
    const markSaved = () => setSaved(sent);
    const canonicalUrl = s.canonical.trim();
    if (!projectId || canonicalUrl === s.savedCanonical.trim()) return { settings, onSaved: markSaved };
    return {
      settings,
      columns: { canonicalUrl: canonicalUrl || null },
      onSaved: () => {
        setSavedCanonical(canonicalUrl);
        markSaved();
      },
    };
  }, [composer, projectId]);

  React.useEffect(() => {
    if (!registerFlushHandler) return;
    registerFlushHandler(flush);
    return () => registerFlushHandler(null);
  }, [registerFlushHandler, flush]);

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="SEO"
          line="Search defaults, social profiles and indexing."
          state={load.state}
          errorLine="Couldn't load your SEO settings. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const shown = (local: string | null, serverKey: string) => local ?? fieldErrors?.[serverKey] ?? null;
  const titleError = shown(errors.metaTitle, "seo.metaTitle");
  const descriptionError = shown(errors.metaDescription, "seo.metaDescription");
  const ogError = shown(errors.ogImage, "seo.defaultOgImage");
  const canonicalError = shown(errors.canonical, "canonicalUrl");
  const robotsError = fieldErrors?.["seo.robotsTxt"] ?? null;
  const serverSocialErrors = Object.fromEntries(
    SOCIAL_NETWORKS.map((n) => [n, fieldErrors?.[`seo.socialLinks.${n}`]]).filter((e) => e[1]),
  ) as Partial<Record<SocialNetwork, string>>;
  const toggle = (key: keyof typeof open) => (next: boolean) => setOpen((o) => ({ ...o, [key]: next }));

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <SettingsCard
        title="Defaults"
        open={open.defaults}
        onToggle={toggle("defaults")}
        anchors={["seo-meta-title", "seo-meta-description", "seo-og"]}
      >
        <div className="tw:grid tw:grid-cols-2 tw:gap-x-6 tw:gap-y-4">
          <Field label="Title" htmlFor="seo-meta-title" siteColumn="seo.metaTitle">
            <Input
              id="seo-meta-title"
              type="text"
              value={metaTitle}
              aria-invalid={titleError ? true : undefined}
              onChange={(e) => {
                setMetaTitle(e.target.value);
              }}
            />
            {titleError ? <div role="alert" className={SCREEN_FIELD_ERROR}>{titleError}</div> : null}
          </Field>
          <Field label="Description" htmlFor="seo-meta-description" siteColumn="seo.metaDescription">
            <Input
              id="seo-meta-description"
              type="text"
              value={metaDescription}
              aria-invalid={descriptionError ? true : undefined}
              onChange={(e) => {
                setMetaDescription(e.target.value);
              }}
            />
            {descriptionError ? <div role="alert" className={SCREEN_FIELD_ERROR}>{descriptionError}</div> : null}
          </Field>
          <Field label="Open Graph image URL" htmlFor="seo-og" siteColumn="seo.defaultOgImage" span="full">
            <Input
              id="seo-og"
              type="text"
              value={ogImage}
              aria-invalid={ogError ? true : undefined}
              placeholder="https://example.com/og-image.jpg"
              onChange={(e) => {
                setOgImage(e.target.value);
              }}
            />
            {ogError ? <div role="alert" className={SCREEN_FIELD_ERROR}>{ogError}</div> : null}
          </Field>
        </div>
      </SettingsCard>

      <SocialProfilesCard
        values={social}
        errors={serverSocialErrors}
        open={open.social}
        onToggle={toggle("social")}
        onChange={(network, value) => {
          setSocial((s) => ({ ...s, [network]: value }));
        }}
      />

      {/* 8135:214533 draws the strip under open Defaults; 8135:214820 (Defaults
          closed) has none. */}
      {open.defaults ? (
        <div className={`${NOTICE} tw:bg-[var(--bk-accent-tint)]`} data-testid="set-seo-pages-strip">
          Page titles and descriptions can be overridden per page in{" "}
          {/* Navigation stays live on the read-only screen: an anchor, which
              the shell's disabled fieldset does not disable. */}
          <Button
            href="#pages"
            variant="link"
            className="tw:inline-flex tw:min-h-5 tw:align-baseline tw:text-[var(--bk-ink)]"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "pages" });
            }}
            data-testid="set-seo-pages-link"
          >
            Pages ›
          </Button>
        </div>
      ) : null}

      <SettingsCard
        title="Indexing"
        open={open.indexing}
        onToggle={toggle("indexing")}
        anchors={["seo-allow-indexing", "seo-canonical", "seo-robots"]}
      >
        <div className="tw:flex tw:h-8 tw:items-center tw:justify-between tw:gap-4">
          <span
            id="seo-allow-indexing-label"
            className="tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]"
          >
            Allow indexing
          </span>
          <SiteColumnGate field="seo.allowIndexing">
            <ToggleSwitch
              id="seo-allow-indexing"
              checked={allowIndexing}
              onChange={(next) => {
                setAllowIndexing(next);
              }}
              aria-labelledby="seo-allow-indexing-label"
              sizing="md"
            />
          </SiteColumnGate>
        </div>
        <Field label="Canonical URL" htmlFor="seo-canonical" span="full">
          <Input
            id="seo-canonical"
            type="text"
            value={canonical}
            aria-invalid={canonicalError ? true : undefined}
            placeholder="https://example.com"
            onChange={(e) => {
              setCanonical(e.target.value);
            }}
          />
          {canonicalError ? <div role="alert" className={SCREEN_FIELD_ERROR}>{canonicalError}</div> : null}
        </Field>
        <div className="tw:flex tw:flex-col tw:gap-1">
          <label
            htmlFor="seo-robots"
            className="tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]"
          >
            robots.txt
          </label>
          <SiteColumnGate field="seo.robotsTxt">
            <Textarea
              id="seo-robots"
              value={robotsTxt}
              rows={3}
              spellCheck={false}
              aria-invalid={robotsError ? true : undefined}
              placeholder={robotsPreview({ robotsTxt: "", allowIndexing, origin })}
              /* 8135:214820: 88 tall, gray-50 in the border hairline, a 4 radius, 12 × 8 in. */
              className="tw:h-22 tw:resize-y tw:rounded-[var(--bk-radius-sm)] tw:border-[var(--bk-border)] tw:bg-[var(--bk-gray-50)] tw:px-3 tw:py-2"
              onChange={(e) => {
                setRobotsTxt(e.target.value);
              }}
            />
          </SiteColumnGate>
          {robotsError ? <div role="alert" className={SCREEN_FIELD_ERROR}>{robotsError}</div> : null}
        </div>
        <div className="tw:flex tw:h-8 tw:items-center tw:gap-4">
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className={GHOST_BTN}
            disabled={robotsTxt === ""}
            onClick={() => {
              setRobotsTxt("");
            }}
            data-testid="set-seo-robots-reset"
          >
            Reset to default
          </Button>
          <span className="tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
            Leave blank to use the generated default shown above.
          </span>
        </div>
      </SettingsCard>

      {!allowIndexing ? (
        <div role="status" className={`${NOTICE} tw:bg-[var(--bk-warning-tint)]`} data-testid="set-seo-indexing-off">
          Indexing is off. Search engines will be asked not to include this site after the next publish.
        </div>
      ) : null}
    </Screen>
  );
};

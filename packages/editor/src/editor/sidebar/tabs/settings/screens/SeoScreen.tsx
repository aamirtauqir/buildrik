/**
 * SEO defaults — Clone 3397:32076 (`SEO & publishing / SEO defaults`): the
 * site-wide title / description / social preview defaults, and Indexing —
 * the search-indexing switch with the robots.txt the site will publish.
 *
 * Per-page titles, descriptions and social images live in Page settings and
 * override these; the strip at the top says so. Values come from the Site
 * row on open (3953:26646 loading, 3953:26785 load-error); edits stay here
 * until Save, when the flush writes `projectSettings.seo.*` and the sync
 * provider's dual-save map carries `metaTitle` / `metaDescription` /
 * `ogImage` / `allowIndexing` / `robotsTxt` on to the Site columns. A refused
 * save shows the banner (3951:26319).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToggleSwitch } from "@/editor/chrome-ui";
import type { BuildrikApiClient } from "@/services/api-client";
import { Field, Input, LoadCard, SCREEN_FIELD_ERROR, SCREEN_INFO, SaveErrorBanner, Screen, Section } from "../shared";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";

const DEFAULT_SEO = {
  metaTitle: "",
  metaDescription: "",
  twitterHandle: "",
  defaultOgImage: "",
  allowIndexing: true,
  robotsTxt: "",
};

/* The server's own limits (`updateSiteSettingsSchema`): a 61-character title
   is refused by the whole settings mutation, and before this the only sign
   was the save banner. Same inline shape as the OG image check below. */
const META_TITLE_MAX = 60;
const META_DESCRIPTION_MAX = 160;

/** What this screen reads off `siteDetail.settings.get`. */
interface SeoRow {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  allowIndexing?: boolean | null;
  robotsTxt?: string | null;
}

interface DomainRow {
  domain: string;
  status: string;
  isPrimary: boolean;
}

/**
 * The origin the published sitemap will sit on: the site's primary custom
 * domain when one is verified, else where the site was last published. The
 * publish worker derives the same thing at deploy time; null means nothing
 * is known yet (never published, no domain), and the preview says nothing
 * rather than guessing a host.
 */
export function sitemapOrigin(domains: ReadonlyArray<DomainRow>, publishedUrl: string | null | undefined): string | null {
  const verified = domains.filter((d) => d.status === "VERIFIED");
  const custom = verified.find((d) => d.isPrimary) ?? verified[0];
  if (custom) return `https://${custom.domain}`;
  if (!publishedUrl) return null;
  try {
    return new URL(publishedUrl).origin;
  } catch {
    return null;
  }
}

/**
 * The robots.txt the site publishes, as the frame draws it: `Site.robotsTxt`
 * verbatim when set, else the default the indexing switch drives — plus the
 * sitemap pointer, which only exists when indexing is on and the origin is
 * known (mirrors `lib/publish-files.ts`, which writes the real file).
 */
export function robotsPreview(input: { robotsTxt: string; allowIndexing: boolean; origin: string | null }): string {
  if (input.robotsTxt.trim()) return input.robotsTxt;
  const lines = ["User-agent: *", input.allowIndexing ? "Allow: /" : "Disallow: /"];
  if (input.allowIndexing && input.origin) lines.push(`Sitemap: ${input.origin}/sitemap.xml`);
  return lines.join("\n");
}

export const SeoScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerFlushHandler,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
}) => {
  const { value: seo, isDirty, markDirty } = useSettingsScreen(
    composer,
    (s) => ({
      metaTitle: s.seo?.metaTitle ?? "",
      metaDescription: s.seo?.metaDescription ?? "",
      twitterHandle: s.seo?.twitterHandle ?? "",
      defaultOgImage: s.seo?.defaultOgImage ?? "",
      allowIndexing: s.seo?.allowIndexing ?? true,
      robotsTxt: s.seo?.robotsTxt ?? "",
    }),
    DEFAULT_SEO
  );

  const [metaTitle, setMetaTitle] = React.useState(seo.metaTitle);
  const [metaDescription, setMetaDescription] = React.useState(seo.metaDescription);
  const [twitterHandle, setTwitterHandle] = React.useState(seo.twitterHandle);
  const [defaultOgImage, setDefaultOgImage] = React.useState(seo.defaultOgImage);
  const [allowIndexing, setAllowIndexing] = React.useState(seo.allowIndexing);
  const [robotsTxt, setRobotsTxt] = React.useState(seo.robotsTxt);
  const [origin, setOrigin] = React.useState<string | null>(null);

  /* The server takes this column as `z.string().url()`, so "mysite.com/og.png"
     — a plausible thing to type — is refused. Before this, the only sign was a
     toast after saving, from a mutation two layers away. Same inline shape the
     Analytics screen uses for its ID fields. */
  const ogImageError =
    defaultOgImage.trim() !== "" && !/^https?:\/\/\S+$/i.test(defaultOgImage.trim());
  const metaTitleError =
    metaTitle.length > META_TITLE_MAX ? `Keep it under ${META_TITLE_MAX} characters — search results cut it there.` : null;
  const metaDescriptionError =
    metaDescription.length > META_DESCRIPTION_MAX
      ? `Keep it under ${META_DESCRIPTION_MAX} characters — search results cut it there.`
      : null;

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Sync local state when composer reloads (preserves user's unsaved edits)
  React.useEffect(() => {
    setMetaTitle(seo.metaTitle);
    setMetaDescription(seo.metaDescription);
    setTwitterHandle(seo.twitterHandle);
    setDefaultOgImage(seo.defaultOgImage);
    setAllowIndexing(seo.allowIndexing);
    setRobotsTxt(seo.robotsTxt);
  }, [seo.metaTitle, seo.metaDescription, seo.twitterHandle, seo.defaultOgImage, seo.allowIndexing, seo.robotsTxt]);

  // The Site row now, plus its domains for the sitemap host. The domains read
  // is best-effort: a site with no domain still has an SEO screen, and its
  // preview falls back to where the site was last published.
  const load = useServerLoad<{ row: SeoRow; domains: DomainRow[] }>(
    projectId,
    async (client: BuildrikApiClient, siteId) => {
      const [row, domains] = await Promise.all([
        client.siteDetail.settings.get.query({ siteId }),
        client.siteDetail.domains.list.query({ siteId }).catch((): DomainRow[] => []),
      ]);
      return { row, domains };
    },
    ({ row, domains }) => {
      setMetaTitle(row.metaTitle ?? "");
      setMetaDescription(row.metaDescription ?? "");
      setDefaultOgImage(row.ogImage ?? "");
      setAllowIndexing(row.allowIndexing ?? true);
      setRobotsTxt(row.robotsTxt ?? "");
      setOrigin(sitemapOrigin(domains, composer?.getProjectMetadata().publishedUrl));
    },
    { onLoadStateChange, registerRetryLoad }
  );

  // Flush local buffer → composer once on Save click (see SettingsTab).
  const stateRef = React.useRef({ metaTitle, metaDescription, twitterHandle, defaultOgImage, allowIndexing, robotsTxt });
  stateRef.current = { metaTitle, metaDescription, twitterHandle, defaultOgImage, allowIndexing, robotsTxt };
  React.useEffect(() => {
    if (!composer || !registerFlushHandler) return;
    registerFlushHandler(() => {
      const current = composer.getProjectSettings();
      const s = stateRef.current;
      composer.setProjectSettings({
        ...current,
        seo: {
          ...current.seo,
          metaTitle: s.metaTitle,
          metaDescription: s.metaDescription,
          twitterHandle: s.twitterHandle,
          defaultOgImage: s.defaultOgImage,
          allowIndexing: s.allowIndexing,
          robotsTxt: s.robotsTxt,
        },
      });
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="SEO defaults"
          line="Title, description and social preview defaults."
          state={load.state}
          errorLine="Couldn't load your SEO defaults. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <div className={SCREEN_INFO}>
        Site-wide SEO defaults are set here. Per-page titles, descriptions and social images are
        edited in Page settings — values set there override these defaults.
      </div>

      <Section title="Site SEO">
        <Field label="Meta title" htmlFor="seo-meta-title">
          <Input
            id="seo-meta-title"
            type="text"
            aria-invalid={metaTitleError ? true : undefined}
            value={metaTitle}
            onChange={(e) => {
              setMetaTitle(e.target.value);
              markDirty();
            }}
          />
          {metaTitleError && (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              {metaTitleError}
            </div>
          )}
        </Field>

        <Field label="Meta description" htmlFor="seo-meta-description">
          <Input
            id="seo-meta-description"
            type="text"
            aria-invalid={metaDescriptionError ? true : undefined}
            value={metaDescription}
            onChange={(e) => {
              setMetaDescription(e.target.value);
              markDirty();
            }}
          />
          {metaDescriptionError && (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              {metaDescriptionError}
            </div>
          )}
        </Field>

        <Field label="Twitter Handle" htmlFor="seo-twitter">
          <Input
            id="seo-twitter"
            type="text"
            value={twitterHandle}
            onChange={(e) => {
              setTwitterHandle(e.target.value);
              markDirty();
            }}
            placeholder="@yourbrand"
          />
        </Field>

        <Field label="Default OG Image URL" htmlFor="seo-og">
          <Input
            id="seo-og"
            type="url"
            aria-invalid={ogImageError || undefined}
            value={defaultOgImage}
            onChange={(e) => {
              setDefaultOgImage(e.target.value);
              markDirty();
            }}
            placeholder="https://example.com/og-image.jpg"
          />
          {ogImageError && (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              Needs a full URL, starting with https://
            </div>
          )}
        </Field>
      </Section>

      <Section title="Indexing">
        {/* Label-left rows, as 3397:32076 draws them — not the field grid the
            card above uses. `col-span-full` keeps each row on its own line
            should the card lay its children out as a grid. */}
        <div className="tw:col-span-full tw:flex tw:items-center tw:gap-4">
          <span
            id="seo-allow-indexing-label"
            className="tw:w-48 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]"
          >
            Allow search indexing
          </span>
          <ToggleSwitch
            id="seo-allow-indexing"
            checked={allowIndexing}
            onChange={(next) => {
              setAllowIndexing(next);
              markDirty();
            }}
            aria-labelledby="seo-allow-indexing-label"
            sizing="sm"
          />
        </div>
        <div className="tw:col-span-full tw:flex tw:items-start tw:gap-4">
          <span
            id="seo-robots-label"
            className="tw:w-48 tw:shrink-0 tw:pt-2 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]"
          >
            robots.txt
          </span>
          <pre
            id="seo-robots"
            aria-labelledby="seo-robots-label"
            className="tw:m-0 tw:min-w-0 tw:flex-1 tw:overflow-x-auto tw:whitespace-pre tw:rounded-lg tw:bg-[var(--bk-bg-subtle)] tw:px-3 tw:py-2 tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
          >
            {robotsPreview({ robotsTxt, allowIndexing, origin })}
          </pre>
        </div>
      </Section>
    </Screen>
  );
};

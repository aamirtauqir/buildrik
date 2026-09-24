/**
 * DynamicPagesPane — a collection's generated pages (4428:147857; pattern
 * edited 6887:77325; no pattern 4418:89084; none published 4418:89287;
 * unknown URL field 4418:164278).
 *
 * The URL pattern and the template page are the two things the publish
 * service needs (`appendDynamicPagesToPublish` only takes collections with
 * BOTH `pageSlugPattern` and `pageTemplatePath`); pages are rendered on
 * publish, one per published record. The template is bound by the page's
 * published file name (`pageFileNames`), the same name the publish payload
 * carries, so the server finds it. "Generate N pages" saves that binding —
 * the pages themselves appear with the next publish, as the intro line says.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { pageFileNames } from "@/engine/export";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { Button, Select, TextInput, useToast } from "@/editor/chrome-ui";
import { ACTION, CONTROL, CONTROL_W, LABEL, NOTE, PANE, SECTION, WARN } from "./paneStyles";

export interface DynamicPagesPaneProps {
  composer: Composer | null;
  collection: CMSCollection;
  records: CMSContentItem[];
}

/** The publish service's slug rule (`applyPattern` in cms.service.ts), for
 *  the preview list only — the server resolves the real URLs. */
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
export function resolveUrl(pattern: string, data: Record<string, unknown>): string {
  return pattern.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_m, key: string) => slugify(data[key] == null ? "" : String(data[key])));
}

export function DynamicPagesPane({ composer, collection, records }: DynamicPagesPaneProps) {
  const { addToast } = useToast();
  const [pattern, setPattern] = React.useState(collection.pageSlugPattern ?? "");
  const [template, setTemplate] = React.useState(collection.pageTemplatePath ?? "");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => setPattern(collection.pageSlugPattern ?? ""), [collection.pageSlugPattern]);
  React.useEffect(() => setTemplate(collection.pageTemplatePath ?? ""), [collection.pageTemplatePath]);

  const pages = React.useMemo(() => {
    if (!composer) return [];
    const all = composer.elements.getAllPages();
    const names = pageFileNames(all);
    return all.map((p) => ({ file: names.get(p.id) ?? "index.html", name: p.name }));
  }, [composer]);
  const templateName = pages.find((p) => p.file === template)?.name ?? "";

  const trimmed = pattern.trim();
  const keys = [...trimmed.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]);
  const unknown = keys.filter((k) => !collection.fields.some((f) => f.slug === k));
  const published = records.filter((r) => r.status === "published");
  const drafts = records.length - published.length;
  const urls = trimmed && unknown.length === 0 ? published.map((r) => resolveUrl(trimmed, r.data)) : [];
  const collide = urls.length !== new Set(urls).size;
  const ready = Boolean(trimmed) && unknown.length === 0 && Boolean(template) && published.length > 0 && !collide;
  const dirty = trimmed !== (collection.pageSlugPattern ?? "") || template !== (collection.pageTemplatePath ?? "");
  const slugField = collection.fields.find((f) => f.slug === "slug") ?? collection.fields[0];
  const fix = unknown.length && slugField ? trimmed.replace(`{${unknown[0]}}`, `{${slugField.slug}}`) : null;

  const save = async () => {
    if (!composer || unknown.length) return;
    setSaving(true);
    try {
      /* Empty clears the binding rather than storing "" — a collection with
         no pattern is one that generates nothing, and both are optional. */
      await composer.cms.collections.updateCollection(collection.id, {
        pageSlugPattern: trimmed || undefined,
        pageTemplatePath: template || undefined,
      });
      addToast({
        tone: "success",
        title: "Dynamic pages saved",
        description: ready
          ? `${collection.name} generates ${published.length} page${published.length === 1 ? "" : "s"} on the next publish.`
          : `${collection.name} · nothing is generated until the pattern, template and a published record are all in place.`,
      });
    } finally {
      setSaving(false);
    }
  };

  let status: React.ReactNode;
  if (!trimmed) {
    status = <span className={WARN} data-testid="cms-dp-status">No pattern set — this collection generates no pages.</span>;
  } else if (unknown.length) {
    status = (
      <span className={`${WARN} tw:flex tw:items-center tw:gap-2`} data-testid="cms-dp-status">
        {trimmed} cannot be saved: {unknown.join(", ")} {unknown.length === 1 ? "is" : "are"} not a field of {collection.name}.
        {fix ? (
          <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[12px]" data-testid="cms-dp-fix" onClick={() => setPattern(fix)}>
            Use {fix}
          </Button>
        ) : null}
      </span>
    );
  } else if (published.length === 0) {
    status = (
      <span className={WARN} data-testid="cms-dp-status">
        {records.length === 0
          ? "No records yet — nothing to generate."
          : `${records.length} record${records.length === 1 ? "" : "s"}, none published. Dynamic pages only generate from published records.`}
      </span>
    );
  } else if (!template) {
    status = <span className={WARN} data-testid="cms-dp-status">Choose a template page — without one, publishing emits none of these.</span>;
  } else if (collide) {
    status = <span className={WARN} data-testid="cms-dp-status">Two records resolve to the same URL — add a field that differs, such as {"{slug}"}.</span>;
  } else {
    status = (
      <span className="tw:flex tw:items-center tw:gap-2" data-testid="cms-dp-status">
        <span className="tw:inline-flex tw:h-5 tw:items-center tw:gap-1 tw:rounded-[4px] tw:bg-[var(--bk-green-100)] tw:px-1.5 tw:text-[11px] tw:font-medium tw:text-[var(--bk-green-700)]">
          <span className="tw:size-1.5 tw:rounded-full tw:bg-[var(--bk-green-500)]" aria-hidden="true" />
          Ready
        </span>
        <span className={NOTE}>
          {published.length} complete record{published.length === 1 ? "" : "s"} will get a page
          {drafts ? ` · ${drafts} unpublished draft${drafts === 1 ? " is" : "s are"} skipped` : ""}
        </span>
      </span>
    );
  }

  return (
    <div className={PANE} data-testid="cms-dynamic-pages">
      <p className={`${NOTE} tw:m-0`}>One page per record. Pages are created on publish and update when records change.</p>
      <div className={CONTROL_W}>
        <label className={LABEL} htmlFor="cms-dp-pattern">URL pattern</label>
        <TextInput
          id="cms-dp-pattern"
          sizing="sm"
          className={CONTROL}
          placeholder="/menu/{slug}"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          data-testid="cms-dp-pattern"
        />
      </div>
      <div className={CONTROL_W}>
        <label className={LABEL} htmlFor="cms-dp-template">Template page</label>
        <Select id="cms-dp-template" sizing="sm" className={CONTROL} value={template} onChange={(e) => setTemplate(e.target.value)} data-testid="cms-dp-template">
          <option value="">Choose a page…</option>
          {pages.map((p) => (
            <option key={p.file} value={p.file}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div>{status}</div>
      {urls.length ? (
        <section className={CONTROL_W}>
          <h3 className={`${SECTION} tw:mb-2`}>
            Pages to generate · {urls.length}
          </h3>
          <ul className="tw:m-0 tw:list-none tw:rounded-[6px] tw:border tw:border-[var(--bk-border)] tw:p-0 tw:py-1" data-testid="cms-dp-list">
            {urls.map((u, i) => (
              <li key={`${u}-${i}`} className="tw:flex tw:h-[26px] tw:items-center tw:justify-between tw:px-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                <span className="tw:truncate">{u}</span>
                <span className="tw:flex-none tw:text-[11px] tw:text-[var(--bk-ink-muted)]">{templateName}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div>
        <Button
          size="xs"
          className={ACTION}
          disabled={!(dirty || ready) || saving || unknown.length > 0}
          data-testid="cms-dp-save"
          onClick={() => void save()}
        >
          {ready ? `Generate ${published.length} page${published.length === 1 ? "" : "s"}` : "Save"}
        </Button>
      </div>
    </div>
  );
}

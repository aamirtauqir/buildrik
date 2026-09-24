/**
 * CollectionSettingsPane — a collection's Settings tab (4428:148660): name +
 * slug with Rename, the Source row, and the Danger zone whose delete takes the
 * typed-DELETE dialog (4757:150118, decision #29) wired to `deleteCollection`.
 *
 * Source: a CMS collection has no external source in the model — records are
 * stored and edited here — so the row says that rather than drawing a sync
 * link the engine cannot back. External data lives under Data › Sources.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Database } from "lucide-react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { Button, TextInput, useToast } from "@/editor/chrome-ui";
import { cmsWorkspace } from "./cmsWorkspaceStore";
import { TypedDeleteDialog } from "./TypedDeleteDialog";
import { ACTION, CONTROL, CONTROL_W, LABEL, NOTE, PANE, SECTION, SECTION_DANGER, WARN } from "./paneStyles";

export interface CollectionSettingsPaneProps {
  composer: Composer | null;
  collection: CMSCollection;
  records: CMSContentItem[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function CollectionSettingsPane({ composer, collection, records }: CollectionSettingsPaneProps) {
  const { addToast } = useToast();
  const [name, setName] = React.useState(collection.name);
  const [slug, setSlug] = React.useState(collection.slug);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  React.useEffect(() => setName(collection.name), [collection.name]);
  React.useEffect(() => setSlug(collection.slug), [collection.slug]);

  const nextName = name.trim();
  const nextSlug = slug.trim();
  const owner = composer?.cms.collections.getAllCollections().find((c) => c.id !== collection.id && c.slug === nextSlug);
  const error = !nextName
    ? "A collection needs a name."
    : !SLUG_RE.test(nextSlug)
      ? "Slugs use lowercase letters, numbers and single hyphens."
      : owner
        ? `${owner.name} already uses the slug ${nextSlug}.`
        : null;
  const dirty = nextName !== collection.name || nextSlug !== collection.slug;

  /* A collection only emits pages when it has both halves of the binding
     (`appendDynamicPagesToPublish`), and then one per published record. */
  const generates = Boolean(collection.pageSlugPattern && collection.pageTemplatePath);
  const pages = generates ? records.filter((r) => r.status === "published").length : 0;
  const consequence = `Deleting removes ${plural(records.length, "record")}${pages ? ` and ${plural(pages, "generated page")}` : ""}.`;

  const rename = async () => {
    if (!composer || error || !dirty) return;
    setSaving(true);
    try {
      await composer.cms.collections.updateCollection(collection.id, { name: nextName, slug: nextSlug });
      addToast({ tone: "success", title: "Collection renamed", description: nextName });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!composer) return;
    await composer.cms.collections.deleteCollection(collection.id);
    setConfirmDelete(false);
    cmsWorkspace.openCollection(null);
    addToast({ tone: "success", title: `“${collection.name}” deleted`, description: consequence.replace("Deleting removes", "Removed") });
  };

  return (
    <div className={PANE} data-testid="cms-settings">
      <h3 className={SECTION}>Collection</h3>
      <div className={CONTROL_W}>
        <label className={LABEL} htmlFor="cms-settings-name">Collection name</label>
        <TextInput id="cms-settings-name" sizing="sm" className={CONTROL} value={name} onChange={(e) => setName(e.target.value)} data-testid="cms-settings-name" />
      </div>
      <div className={CONTROL_W}>
        <label className={LABEL} htmlFor="cms-settings-slug">Slug</label>
        <TextInput id="cms-settings-slug" sizing="sm" className={CONTROL} value={slug} onChange={(e) => setSlug(e.target.value)} data-testid="cms-settings-slug" />
      </div>
      {error && dirty ? (
        <span className={WARN} data-testid="cms-settings-error">{error}</span>
      ) : null}
      <div>
        <Button size="xs" variant="secondary" className={ACTION} disabled={Boolean(error && dirty) || saving} onClick={() => void rename()} data-testid="cms-settings-rename">
          Rename
        </Button>
      </div>

      <h3 className={SECTION}>Source</h3>
      <div
        className={`${CONTROL_W} tw:flex tw:h-8 tw:items-center tw:gap-2 tw:rounded-[6px] tw:border tw:border-[var(--bk-border)] tw:px-2.5`}
        data-testid="cms-settings-source"
      >
        <Database size={14} className="tw:flex-none tw:text-[var(--bk-ink-muted)]" aria-hidden="true" />
        <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">Buildrik CMS</span>
        <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">Records are edited here</span>
      </div>

      <h3 className={SECTION_DANGER}>Danger zone</h3>
      <p className={`${NOTE} tw:m-0`} data-testid="cms-settings-danger">
        {consequence} This can’t be undone.
      </p>
      <div>
        {/* 4428:148660 draws this one at the default 40px height, not the tab's
            28px ACTION size — the one irreversible action on the screen. */}
        <Button size="xs" variant="danger" className="tw:h-10 tw:px-4 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]" onClick={() => setConfirmDelete(true)} data-testid="cms-settings-delete">
          Delete collection…
        </Button>
      </div>

      <TypedDeleteDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        name={collection.name}
        consequence={consequence}
        confirmLabel="Delete collection"
        testId="cms-delete-collection"
      />
    </div>
  );
}

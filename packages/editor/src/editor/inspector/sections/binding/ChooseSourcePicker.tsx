/**
 * Choose source — the binding picker of a Content property row (2L9 Play
 * F2.02 `302:12190`, board B5-D02/D03): a search over sources and fields,
 * then the sources in three groups —
 *
 *   RECORD DATA   This page’s record · {Collection}  (each generated page)
 *                 List item                           (each copy of a list)
 *                 Specific record                     (pin one record)
 *   SITE & PAGE   Site · Page
 *   LIVE SOURCES  Date · URL parameter · Cookie
 *
 * A record source opens its compatible fields ("‹ Sources"); a field binds.
 * Site & Page and the live sources are drawn "Planned": the binding model
 * reads CMS collections only, so they cannot bind yet
 * (`authority: code:cms-sources-only` on the board's Site/Page rows).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection, CMSField } from "@/shared/types/cms";
import { X } from "lucide-react";
import { IconButton, Menu, MenuGroup, MenuItem, MenuLabel, Popover, TextInput } from "@/editor/chrome-ui";
import { FIELD_TYPE_LABEL } from "@/editor/cms/fieldTypes";
import { FIELD_TYPES_FOR, type CmsBindingState } from "./useCmsBinding";

interface Source {
  key: string;
  label: string;
  hint: string;
  collection: CMSCollection | null;
}

type Step = { kind: "sources" } | { kind: "collections" } | { kind: "fields"; collection: CMSCollection };

const ITEM = "tw:!h-auto tw:!min-h-8 tw:!py-1.5 tw:!items-start";

function Row({ label, hint, badge }: { label: string; hint?: string; badge?: string }) {
  return (
    <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-start tw:gap-2">
      <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        <span className="tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink)]">{label}</span>
        {hint ? <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{hint}</span> : null}
      </span>
      {badge ? <span className="tw:shrink-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{badge}</span> : null}
    </span>
  );
}

export interface ChooseSourcePickerProps {
  state: CmsBindingState;
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  onOpenCreateCollection?: () => void;
  /** The trigger fills its row (the detail's Source box, 2L9 F2.05). */
  block?: boolean;
}

export function ChooseSourcePicker({ state, open, onClose, trigger, onOpenCreateCollection, block }: ChooseSourcePickerProps) {
  const [step, setStep] = React.useState<Step>({ kind: "sources" });
  const [query, setQuery] = React.useState("");
  React.useEffect(() => {
    if (!open) {
      setStep({ kind: "sources" });
      setQuery("");
    }
  }, [open]);

  const openFields = (collection: CMSCollection) => {
    setQuery("");
    setStep({ kind: "fields", collection });
  };
  const fits = (f: CMSField) => FIELD_TYPES_FOR[state.property].has(f.type);
  const pick = (collection: CMSCollection, field: CMSField) => {
    state.bind(collection.id, field.slug);
    onClose();
  };

  const recordSources: Source[] = [
    ...(state.templateCollection
      ? [{ key: "page", label: `This page’s record · ${state.templateCollection.name}`, hint: "Each generated page shows its own record", collection: state.templateCollection }]
      : []),
    state.listCollection
      ? { key: "list", label: `List item · ${state.listCollection.name}`, hint: "Each copy shows its own record", collection: state.listCollection }
      : { key: "list", label: "List item", hint: "Select an element inside a collection list", collection: null },
  ];

  const q = query.trim().toLowerCase();
  const fieldHits = q
    ? state.collections.flatMap((c) => c.fields.filter((f) => fits(f) && `${c.name} ${f.name} ${f.slug}`.toLowerCase().includes(q)).map((f) => ({ c, f })))
    : [];

  const fieldItem = (c: CMSCollection, f: CMSField, withCollection: boolean) => (
    <MenuItem key={`${c.id}:${f.slug}`} className={ITEM} data-testid={`choose-source-field-${f.slug}`} onClick={() => pick(c, f)}>
      <Row label={withCollection ? `${c.name} · ${f.name}` : f.name} hint={FIELD_TYPE_LABEL[f.type] ?? f.type} />
    </MenuItem>
  );

  let body: React.ReactNode;
  if (step.kind === "fields") {
    /* 2L9 B5-D03 (173:9389): every field of the collection, each saying why
       it can or cannot supply this property — the incompatible ones stay in
       the list, shut, with the reason (FIELD_TYPES_FOR is the contract). */
    const fields = q ? step.collection.fields.filter((f) => `${f.name} ${f.slug}`.toLowerCase().includes(q)) : step.collection.fields;
    const target = state.label.toLowerCase();
    body = (
      <>
        <MenuItem className={`${ITEM} tw:justify-center! tw:[&>span]:text-center! tw:text-[var(--bk-accent-text)]!`} data-testid="choose-source-back" onClick={() => setStep({ kind: "sources" })}>
          ‹ Sources
        </MenuItem>
        {fields.length ? (
          fields.map((f) => {
            const type = FIELD_TYPE_LABEL[f.type] ?? f.type;
            return fits(f) ? (
              <MenuItem key={`${step.collection.id}:${f.slug}`} className={ITEM} data-testid={`choose-source-field-${f.slug}`} onClick={() => pick(step.collection, f)}>
                <Row label={f.name} hint={`${type} · ${f.slug}`} />
              </MenuItem>
            ) : (
              <MenuItem key={`${step.collection.id}:${f.slug}`} disabled className={ITEM} data-testid={`choose-source-field-${f.slug}`}>
                <Row label={f.name} hint={`${type} cannot supply ${target}`} />
              </MenuItem>
            );
          })
        ) : (
          <MenuItem disabled className={ITEM}>No fields in {step.collection.name} yet</MenuItem>
        )}
      </>
    );
  } else if (step.kind === "collections") {
    body = (
      <>
        <MenuItem className={ITEM} data-testid="choose-source-back" onClick={() => setStep({ kind: "sources" })}>
          ‹ Sources
        </MenuItem>
        <MenuGroup>
          <MenuLabel>Specific record</MenuLabel>
          {state.collections.map((c) => (
            <MenuItem key={c.id} className={ITEM} onClick={() => openFields(c)}>
              <Row label={c.name} />
            </MenuItem>
          ))}
        </MenuGroup>
      </>
    );
  } else if (q) {
    body = (
      <MenuGroup>
        <MenuLabel>Fields</MenuLabel>
        {fieldHits.length ? fieldHits.map(({ c, f }) => fieldItem(c, f, true)) : <MenuItem disabled className={ITEM}>No sources or fields match “{query.trim()}”</MenuItem>}
      </MenuGroup>
    );
  } else {
    body = (
      <>
        <MenuGroup>
          <MenuLabel>Record data</MenuLabel>
          {state.collections.length === 0 ? (
            <>
              <MenuItem disabled className={ITEM}>
                No collections yet.
              </MenuItem>
              {onOpenCreateCollection ? (
                <MenuItem
                  className={ITEM}
                  data-testid="choose-source-new-collection"
                  onClick={() => {
                    onClose();
                    onOpenCreateCollection();
                  }}
                >
                  + New collection…
                </MenuItem>
              ) : null}
            </>
          ) : (
            <>
              {recordSources.map((s) => (
                <MenuItem
                  key={s.key}
                  className={ITEM}
                  disabled={!s.collection}
                  data-testid={`choose-source-${s.key}`}
                  onClick={() => s.collection && openFields(s.collection)}
                >
                  <Row label={s.label} hint={s.hint} />
                </MenuItem>
              ))}
              <MenuItem
                className={ITEM}
                data-testid="choose-source-record"
                onClick={() =>
                  state.collections.length === 1 ? openFields(state.collections[0]) : setStep({ kind: "collections" })
                }
              >
                <Row label="Specific record" hint="Pin one record to this property" />
              </MenuItem>
            </>
          )}
        </MenuGroup>
        <MenuGroup>
          <MenuLabel>Site &amp; page</MenuLabel>
          <MenuItem disabled className={ITEM}>
            <Row label="Site" hint="Name, URL and Site variables" badge="Planned" />
          </MenuItem>
          <MenuItem disabled className={ITEM}>
            <Row label="Page" hint="Title, URL and description" badge="Planned" />
          </MenuItem>
        </MenuGroup>
        <MenuGroup>
          <MenuLabel>Live sources</MenuLabel>
          {["Date", "URL parameter", "Cookie"].map((label) => (
            <MenuItem key={label} disabled className={ITEM}>
              <Row label={label} badge="Planned" />
            </MenuItem>
          ))}
        </MenuGroup>
      </>
    );
  }

  return (
    /* 2L9 F2.02: a 280 card beside the column, over the canvas. */
    <Popover open={open} onClose={onClose} placement="bottom-end" label="Choose source" trigger={trigger} block={block} beside=".layout-shell__inspector" className="tw:w-[280px] tw:p-1">
      <div className="tw:flex tw:flex-col tw:gap-1" data-testid="choose-source">
        <div className="tw:flex tw:items-center tw:justify-between tw:px-2 tw:pt-1">
          <span className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">{step.kind === "fields" ? `${step.collection.name} fields` : "Choose source"}</span>
          <IconButton label="Close" size="sm" onClick={onClose} data-testid="choose-source-close" className="tw:size-6 tw:text-[var(--bk-ink-muted)]">
            <X size={14} aria-hidden="true" />
          </IconButton>
        </div>
        {step.kind !== "collections" ? (
          <div className="tw:px-1">
            <TextInput
              sizing="sm"
              aria-label="Search sources or fields"
              placeholder="Search sources or fields…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        ) : null}
        <Menu label="Sources" className="tw:min-w-0">
          {body}
        </Menu>
      </div>
    </Popover>
  );
}

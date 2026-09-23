/**
 * ContentViews — the drill-in views of the Content panel, matched to the
 * Figma boards: root 148:2, empty 149:7, collection 149:50, record 149:84,
 * unsaved-record 149:108, fields 151:2, sources 151:46, variables 151:62,
 * conditions 151:87. Pure presentation + callbacks; state lives in
 * useContentPanel.
 *
 * Every list line here is a chrome-ui row (ListRow / RecordRow / Row), not a
 * local rebuild of one. The panel used to carry a 24-key style object that
 * reimplemented exactly those three.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Braces, Database, GitBranch, Table2 } from "lucide-react";
import {
  ConfirmDialog,
  Button,
  Checkbox,
  EmptyState,
  EmptyStateActions,
  EmptyStateDesc,
  IconButton,
  Popover,
  Menu,
  MenuItem,
  ListRow,
  RecordRow,
  Row,
  SectionHeader,
  ROW_ICON_CLASS,
  ROW_LABEL_CLASS,
  Select,
  Textarea,
  TextInput,
  ToggleSwitch,
} from "@/editor/chrome-ui";
import { CMSValidationError } from "@/engine/cms/CollectionManager";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import type { ConditionExpression, ConditionOperator, DataSource } from "@/shared/types/data";
import { conditionSummary, fieldDefault, isValidVariableKey, type SiteVariable } from "./contentPanelUtils";
import type { ConditionRow } from "./useContentPanel";

/** The panel column. Exported because ContentTab wraps these views in it. */
export const CONTENT_BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
/** Board 148:2 — the Content group header is 32-tall, not the shared List
 *  section's 28. The arbitrary bracket sorts after the named `h-7` scale
 *  utility in the compiled sheet and so wins regardless of class order (same
 *  trick as AssetDetailOverlay's alt input) rather than trusting an
 *  equal-specificity `h-8` to win. Exported because the loading skeleton draws
 *  the same two bands and has to draw them at the same height.
 *
 *  `leading-4` for the same reason: 776:4095 draws the band's label at 11/16
 *  and the shared SectionHeader sets no line-height at all, so the band's text
 *  resolved off the face's own metrics. Content-only — nothing else imports
 *  this constant, so the shared primitive keeps whatever its own boards say. */
export const SECTION_H = "tw:h-[var(--bk-size-row)] tw:leading-4";

const SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto";
/** A text button that reads as a link: breadcrumbs and every "+ New …".
 *
 *  `border-0` is the one that matters, and it is NOT interchangeable with
 *  `border-transparent`: that sets only a colour, so the browser's own
 *  `2px outset` button border survives and the control grows 4px in both
 *  axes. The parity harness caught exactly that. With the width at 0 the
 *  colour is unobservable, so no `border-transparent` here. */
/* `tw:p-0` leaves the height entirely to the line-box, which rendered every
   link-action ("+ Add", "+ Add field", "+ New collection") and every breadcrumb
   at 16px tall — under WCAG 2.5.8's 24x24 target minimum. `min-h-6` is 24
   exactly; `items-center` already centres the label, so the glyph does not
   move, only the hit area grows. */
/* `tw:h-8`, not just `tw:min-h-6`. flowbite's Button ships `tw:h-10`, and
   `min-h-*` does not conflict with `h-*` so the 40px stood — these rows
   measured 40 against boards that draw 32-36. An `h-*` DOES conflict, so
   twMerge drops flowbite's. */
const LINK_BTN =
  "tw:inline-flex tw:items-center tw:gap-1.5 tw:bg-transparent tw:border-0 tw:p-0 tw:h-8 tw:min-h-0 " +
  /* ui/13 · row label is 13/20 wherever a board draws it (149:114 the back
     crumb, and every "+ New …" beside it); the line-height was left to the
     browser, which resolves `normal` off the face's own metrics. */
  "tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:text-[var(--bk-accent-hover)] tw:enabled:hover:bg-transparent";
/** The quiet row-action button, previously copy-pasted at eleven call sites. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";
/* 149:116/120/124 — 12/18, not `text-xs`'s own 16. */
const FIELD_LABEL = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)] tw:mx-4 tw:mt-2.5 tw:mb-1";
/** Inputs sit in a padded wrapper rather than carrying their own margin, so
 *  the field keeps the TextInput/Select wrapper theme untouched. */
const FIELD_WRAP = "tw:px-4";
const TOGGLE_ROW = "tw:flex tw:h-8 tw:items-center tw:justify-between tw:px-4 tw:py-0";
const TOGGLE_ROW_LABEL = "tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
/* Board 149:108 tints the save bar with the warning wash, not neutral grey —
   the bar exists to say something is unsaved, and grey says nothing. */
const SAVEBAR =
  "tw:flex tw:h-11 tw:items-center tw:gap-2 tw:px-4 tw:py-0 " +
  "tw:text-[12px] tw:leading-[18px] tw:bg-[var(--bk-warning-tint)]";
/* …and it draws Save as accent TEXT, not a filled button. The Button doc on the
   same Figma page is explicit that the one filled accent button belongs to the
   screen's primary action; a drawer's save bar is not where that is spent. */
/* The recipe moved into Button's `link` variant (2026-08-29); what stays
   here is the one class this row adds on top. */
/* Board 149:133/134/135 — all three of the bar's words are 12/18, and they
   differ only in colour: the status is warning-text, Discard is ink-MUTED
   (it was ink-soft, borrowed from the row-action GHOST which this row is not),
   Save is accent-text. `leading-[18px]` because `text-xs` carries Tailwind's
   own 16, and 2px per line across a 44 bar is the difference between the
   words sitting on the board's baseline and 1px above it. */
const SAVE_LINK = "tw:min-h-6 tw:text-[12px] tw:leading-[18px] tw:font-normal";
const SAVEBAR_STATUS = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text)]";
const SAVEBAR_DISCARD =
  "tw:border-transparent tw:bg-transparent tw:text-[12px] tw:leading-[18px] " +
  "tw:text-[var(--bk-ink-muted)] tw:hover:text-[var(--bk-ink)]";
/* 149:57 — the collection's meta strip. BOTH words are 12/18 there: the count
   was 11px (SUB) and "+ Add" 13px (LINK_BTN), so a two-word row carried three
   type sizes between it and the rows underneath. */
const META_TEXT = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";
const META_ADD = "tw:text-[12px] tw:leading-[18px]";
/** A note that belongs to the row above it, not to the panel's foot.
 *  151:61 — 11/16 on the panel's 16px gutters with 8 above and 8 below
 *  (151:60's frame is the text's own box plus those two insets). It was
 *  `leading-normal` (16.5 at this size) with no top inset and 12 below, so the
 *  note sat tight under the link it explains and its two lines drifted half a
 *  pixel per line off every other 11px line in the panel. */
const INLINE_HINT = "tw:text-[11px] tw:text-[var(--bk-ink-muted)] tw:leading-4 tw:px-4 tw:py-2";
/* 151:70 — the {{site.*}} key is 12/16, and `text-xs` carries Tailwind's own
   16… which is right here, but only by accident: state it. */
const MONO = "tw:[font-family:var(--bk-font-mono)] tw:text-xs tw:leading-4 tw:text-[var(--bk-accent-text)]";
/* 151:12 / 151:17 / 151:38 draw this 11/16 in `--color/ink-disabled`, and the
   code followed them — so board and code AGREED on `var(--bk-gray-300)`, which is 1.47:1 on
   white. Nothing failed, because agreement is what the diff checks; that is the
   one case where agreement is not evidence.
   A tag stating a field is MANDATORY is not decoration, and `ink-disabled` is
   the token for a control you cannot use — WCAG exempts inactive controls
   precisely so they can be dim. Wrong token for the job (founder call
   2026-09-08): ink-soft, 7.56:1. Size and line box are unchanged, so the boards
   still win everything they are right about. */
const REQUIRED_TAG = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]";
/* Boards 303:2067 and 303:2083 both draw the Sources status as the file's own
   Badge (12:16): a bordered pill, 10/2 padding, 12/16 medium. The two states
   differ only in ramp — grey for "nothing connected", green for "watching".
   Live drew the first as a plain 11px sentence and the second as a borderless
   green wash in --bk-success (`var(--bk-green-500)`), which is the DOT's colour, not the
   label's: on green-100 the board uses green-700. */
const STATUS_PILL =
  "tw:inline-flex tw:items-center tw:rounded-full tw:border tw:border-solid " +
  "tw:px-2.5 tw:py-0.5 tw:text-[12px] tw:leading-4 tw:font-medium";
const STATUS_PILL_OK = "tw:bg-[var(--bk-green-100)] tw:border-[var(--bk-green-500)] tw:text-[var(--bk-green-700)]";
const STATUS_PILL_IDLE = "tw:bg-[var(--bk-gray-200)] tw:border-[var(--bk-gray-400)] tw:text-[var(--bk-gray-700)]";
/* The second line of every two-line row: 151:11 the field's type, 151:56 a
   source's status, 151:71 a variable's value, 151:96 a condition's summary —
   all four boards draw it 11/16, and the line-height was left to the face. */
const SUB = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const INLINE_FORM = "tw:flex tw:flex-col tw:gap-2 tw:p-3 tw:border-b tw:border-[var(--bk-gray-200)]";
const FORM_ROW = "tw:flex tw:gap-2 tw:items-center";
const SPACER = "tw:flex-1";
/** Two stacked lines inside a row (name over type, key over value). */
const ROW_STACK = "tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0 tw:flex-1";
/** …and its FIRST line: 13/20 wherever a board draws one (151:10 a field name,
 *  151:54 a source name, 151:95 a condition's element). `Row` supplies the 13
 *  and nothing supplied the 20. */
const ROW_TITLE = "tw:leading-5";
const ROW_ACTIONS = "tw:ml-auto tw:inline-flex tw:items-center tw:gap-1 tw:flex-none";
const ERROR_TEXT = "tw:text-xs tw:text-[var(--bk-error)]";

function Crumb({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    /* self-start / justify-start: flowbite's Button centres its content and
       stretches to the column's width, so the board's left-aligned back link
       sat in the middle of the panel (149:50, 149:84). */
    <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5 tw:self-start tw:justify-start`} onClick={onClick} aria-label={`Back to ${label}`} data-testid="content-crumb">
      ‹ {label}
    </Button>
  );
}

/* ── Root (148:2) + empty (149:7) ────────────────────────────────────────── */

export function RootView({
  collections,
  recordCounts,
  sourcesCount,
  variablesCount,
  conditionsCount,
  onOpenCollection,
  onCreateCollection,
  onOpenSources,
  onOpenVariables,
  onOpenConditions,
}: {
  collections: CMSCollection[];
  recordCounts: Record<string, number>;
  sourcesCount: number;
  variablesCount: number;
  conditionsCount: number;
  onOpenCollection: (id: string) => void;
  onCreateCollection?: () => void;
  onOpenSources: () => void;
  onOpenVariables: () => void;
  onOpenConditions: () => void;
}) {
  if (collections.length === 0 && sourcesCount === 0 && variablesCount === 0 && conditionsCount === 0) {
    return (
      /*
        Board 149:7 draws this block composed, not with the default slots:
        the copy is 13/20 over 272, and the call to action is ACCENT TEXT.
        EmptyState's shared body class is 12px and its `action` slot takes a
        filled Button, so the defaults gave a 12px line under a solid blue
        CTA. The Button doc on the same page is explicit — primary is the ONE
        filled accent button per screen — and an empty panel inviting you in
        is not where that one gets spent. Media's empty state (145:406) draws
        its two calls to action the same way.
      */
      <EmptyState
        /* 149:46 — a 160-tall block at the TOP of the panel, not a column that
           fills it. `flex-1` centred the two lines in whatever height the
           drawer had (~768 live), which put the invitation halfway down an
           otherwise blank panel and ~300px below where the board draws it. */
        className="tw:h-40"
        data-testid="content-empty"
      >
        <EmptyStateDesc className="tw:max-w-[272px] tw:text-[13px] tw:leading-5" data-testid="content-empty-desc">
          {/* One source literal, deliberately: gate:copy greps src/ for the exact
              string from the design doc, so wrapping it across two JSX lines
              reads to that gate as the line having been deleted. */}
          Collections turn a spreadsheet into pages — one page per row, updated when the data changes.
        </EmptyStateDesc>
        {onCreateCollection ? (
          <EmptyStateActions>
            <Button
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6 tw:font-normal"
              data-testid="content-empty-cta"
              onClick={onCreateCollection}
            >
              Create a collection
            </Button>
          </EmptyStateActions>
        ) : null}
      </EmptyState>
    );
  }
  return (
    <div className={SCROLL}>
      {/* Board 148:2 — the group header is 32-tall with a tint wash, not the
          shared List section's plain 28. The arbitrary bracket sorts after
          the named `h-7` scale utility in the compiled sheet and so wins
          regardless of class order (same trick as AssetDetailOverlay's alt
          input) rather than trusting an equal-specificity `h-8` to win. */}
      <SectionHeader tint className={SECTION_H} count={collections.length} data-testid="content-section-collections">Collections</SectionHeader>
      {collections.map((c) => (
        <ListRow
          key={c.id}
          icon={<Table2 size={16} />}
          label={c.name}
          count={recordCounts[c.id] ?? "—"}
          chevron
          data-testid={`content-collection-${c.id}`}
          onClick={() => onOpenCollection(c.id)}
        />
      ))}
      {/* Board 148:20 — a bare row, not a button: "+" sits in the icon column
          (12/400 ink-muted) and "New collection" is the 13/400 accent-text
          label, flush with every List row above it. The old small inset
          Button (mx-4, its own 48h before this fix) never matched that. */}
      {onCreateCollection && (
        <Row interactive onClick={onCreateCollection} data-testid="content-new-collection" aria-label="New collection">
          <span className={`${ROW_ICON_CLASS} tw:text-[length:var(--bk-text-12)] tw:leading-[18px]`} aria-hidden="true" data-testid="content-new-collection-plus">
            +
          </span>
          <span className={`${ROW_LABEL_CLASS} tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-accent-text)]`} data-testid="content-new-collection-label">
            New collection
          </span>
        </Row>
      )}
      <SectionHeader tint className={SECTION_H} data-testid="content-section-data">Data</SectionHeader>
      <ListRow icon={<Database size={16} />} label="Sources" count={sourcesCount} chevron data-testid="content-open-sources" onClick={onOpenSources} />
      <ListRow icon={<Braces size={16} />} label="Variables" count={variablesCount} chevron data-testid="content-open-variables" onClick={onOpenVariables} />
      <ListRow icon={<GitBranch size={16} />} label="Conditions" count={conditionsCount} chevron data-testid="content-open-conditions" onClick={onOpenConditions} />
    </div>
  );
}

/* ── Collection (149:50) ─────────────────────────────────────────────────── */

export function CollectionView({
  collection,
  records,
  onBack,
  onOpenRecord,
  onAddRecord,
  onOpenFields,
  onOpenDynamicPages,
}: {
  collection: CMSCollection;
  records: CMSContentItem[];
  onBack: () => void;
  onOpenRecord: (id: string) => void;
  onAddRecord: () => void;
  onOpenFields: () => void;
  onOpenDynamicPages?: () => void;
}) {
  const display = collection.displayField ?? collection.fields[0]?.slug;
  const recordName = (r: CMSContentItem): string => {
    const v = display ? r.data[display] : undefined;
    return typeof v === "string" && v.trim() ? v : `Record ${r.id.slice(-4)}`;
  };
  return (
    <div className={CONTENT_BODY}>
      <Crumb label={collection.name} onClick={onBack} />
      {/* 149:57 — a 32-tall meta strip on the panel's own 16px gutters, both
          lines 12/18. It was 12px gutters, a 11px left word and a 13px right
          one, so nothing in the row shared a baseline with the rows below.
          The board states the 12/18 on the STRIP, not only on its two words,
          and the strip itself was inheriting the document's 16 — invisible
          while both children override it, and wrong the moment anything else
          lands in the row. */}
      <div className="tw:flex tw:h-8 tw:justify-between tw:items-center tw:px-4 tw:text-[12px] tw:leading-[18px]" data-testid="content-collection-meta">
        <span className={META_TEXT} data-testid="content-collection-count">
          {records.length} record{records.length === 1 ? "" : "s"}
        </span>
        <Button className={`${LINK_BTN} ${META_ADD}`} data-testid="content-collection-add" onClick={onAddRecord}>
          + Add
        </Button>
      </div>
      <div className={SCROLL}>
        {records.map((r) => (
          <RecordRow
            key={r.id}
            data-record-row
            data-testid={`content-record-${r.id}`}
            label={recordName(r)}
            published={r.status === "published"}
            chevron
            onClick={() => onOpenRecord(r.id)}
          />
        ))}
        {records.length === 0 && <div className={`${SUB} tw:p-3`}>No records yet — add the first one.</div>}
      </div>
      <div className="tw:border-t tw:border-[var(--bk-gray-200)]">
        <ListRow label="Fields" count={collection.fields.length} chevron data-testid="content-open-fields" onClick={onOpenFields} />
        {onOpenDynamicPages && <ListRow label="Dynamic pages" chevron data-testid="content-open-dynamic" onClick={onOpenDynamicPages} />}
      </div>
    </div>
  );
}

/* ── Record (149:84) + unsaved (149:108) ─────────────────────────────────── */

export function RecordView({
  collection,
  record,
  onBack,
  onSave,
  onDelete,
}: {
  collection: CMSCollection;
  record: CMSContentItem | null;
  onBack: () => void;
  onSave: (data: Record<string, unknown>, published: boolean) => Promise<void>;
  onDelete?: () => void;
}) {
  const initial = React.useMemo(() => {
    const base: Record<string, unknown> = {};
    for (const f of collection.fields) base[f.slug] = record?.data[f.slug] ?? fieldDefault(f);
    return base;
  }, [collection, record]);
  const [data, setData] = React.useState<Record<string, unknown>>(initial);
  const [published, setPublished] = React.useState(record?.status === "published");
  const [saving, setSaving] = React.useState(false);
  /* Publishing runs the collection's own rules (CollectionManager). Until it
     did, the "required" tag on the Fields screen was decoration and a record
     could go live empty; now the failure has to land on the fields it names
     rather than as a rejected promise nobody sees. */
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    setData(initial);
    setPublished(record?.status === "published");
    setErrors({});
  }, [initial, record]);

  const dirty =
    JSON.stringify(data) !== JSON.stringify(initial) || published !== (record?.status === "published");
  /* The save bar already says "Unsaved changes" and offers Discard — the crumb
     used to do the same thing without saying so, and typed values went with
     it. Same ConfirmDialog this file already uses to guard a field delete. */
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  /* Deleting one FIELD asks first; deleting the whole record did not, and CMS
     records are not in the undo stack — measured: the row was gone at once and
     ⌘Z did not bring it back. */
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const leave = () => (dirty ? setConfirmLeave(true) : onBack());
  const display = collection.displayField ?? collection.fields[0]?.slug;
  const title =
    (record && typeof record.data[display ?? ""] === "string" && (record.data[display ?? ""] as string)) ||
    (record ? `Record ${record.id.slice(-4)}` : "New record");

  const setField = (slug: string, value: unknown) => setData((d) => ({ ...d, [slug]: value }));

  return (
    <div className={CONTENT_BODY}>
      <Crumb label={title} onClick={leave} />
      <div className={SCROLL}>
        {collection.fields.map((f) => (
          <div key={f.id}>
            {f.type === "boolean" ? (
              <div className={TOGGLE_ROW}>
                <span className="tw:text-[13px]">{f.name}</span>
                <ToggleSwitch
                  checked={Boolean(data[f.slug])}
                  aria-label={f.name}
                  onChange={() => setField(f.slug, !data[f.slug])}
                />
                {errors[f.slug] && (
                  <span className="tw:ml-2 tw:text-xs tw:text-[var(--bk-error)]" role="alert">
                    {errors[f.slug]}
                  </span>
                )}
              </div>
            ) : (
              <>
                <div className={FIELD_LABEL} data-testid={`content-label-${f.slug}`}>{f.name}</div>
                <div className={FIELD_WRAP}>
                  {f.type === "textarea" || f.type === "richtext" ? (
                    <Textarea
                      /* Board 149:101 draws the textarea 56 tall, radius 6, on
                         `--color/border-input`. `Textarea` is a SEPARATE
                         flowbite component, so `BK_TEXT_INPUT_THEME` — which
                         carries that geometry for every `TextInput` — does not
                         reach it, and the size has to be stated here. `min-h-16`
                         was 64. The `!` on the radius is the same reason it
                         carries one in the input theme: flowbite's own
                         `rounded-lg` is emitted unprefixed and a `tw:`-prefixed
                         utility cannot be deduped against it, so source order
                         decides without it. */
                      className="tw:bg-white tw:min-h-14 tw:py-0 tw:rounded-md! tw:border-[var(--bk-border-input)] tw:resize-y"
                      value={String(data[f.slug] ?? "")}
                      onChange={(e) => setField(f.slug, e.target.value)}
                      aria-label={f.name}
                      data-testid={`content-field-${f.slug}`}
                    />
                  ) : (
                    <TextInput
                      type={f.type === "number" ? "number" : "text"}
                      value={String(data[f.slug] ?? "")}
                      onChange={(e) => setField(f.slug, f.type === "number" ? Number(e.target.value) : e.target.value)}
                      aria-label={f.name}
                      data-testid={`content-field-${f.slug}`}
                    />
                  )}
                </div>
                {errors[f.slug] && (
                  <div className="tw:mx-3 tw:mt-1 tw:text-xs tw:text-[var(--bk-error)]" role="alert">
                    {errors[f.slug]}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div className={TOGGLE_ROW} data-testid="content-row-published">
          {/* 149:128 is 13/20 in --bk-ink. It was inheriting: the demo host paints
              body #0F172A and the dashboard host paints its own, so this label
              was whatever the page around it happened to be. */}
          <span className={TOGGLE_ROW_LABEL} data-testid="content-row-published-label">Published</span>
          <ToggleSwitch checked={published} aria-label="Published" onChange={() => setPublished((v) => !v)} />
        </div>
        {record && onDelete && (
          <Button
            className={`${LINK_BTN} tw:mx-3 tw:my-2 tw:text-[var(--bk-error)] tw:hover:text-[var(--bk-error)]`}
            onClick={() => setConfirmDelete(true)}
          >
            Delete record
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete?.();
        }}
        title="Delete record?"
        message={`"${title}" will be removed. This one can't be undone.`}
        confirmLabel="Delete record"
        tone="destructive"
      />
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => { setConfirmLeave(false); onBack(); }}
        title="Discard changes?"
        message="This record has unsaved changes. Going back throws them away."
        confirmLabel="Discard"
        tone="destructive"
      />
      {(dirty || !record) && (
        <div className={SAVEBAR} role="region" aria-label="Unsaved changes" data-testid="content-savebar">
          <span className={SAVEBAR_STATUS} data-testid="content-savebar-status">Unsaved changes</span>
          <span className={SPACER} />
          <Button
            color="light"
            size="xs"
            className={SAVEBAR_DISCARD}
            data-testid="content-savebar-discard"
            onClick={() => { setData(initial); setPublished(record?.status === "published"); }}
          >
            Discard
          </Button>
          <Button
            color="light"
            size="xs"
            variant="link" className={SAVE_LINK}
            data-testid="content-savebar-save"
            disabled={saving}
            aria-busy={saving || undefined}
            onClick={() => {
              setSaving(true);
              setErrors({});
              void onSave(data, published)
                .catch((e: unknown) => {
                  if (e instanceof CMSValidationError) setErrors(e.errors);
                  else throw e;
                })
                .finally(() => setSaving(false));
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Fields (151:2) ──────────────────────────────────────────────────────── */

const FIELD_TYPES = ["text", "textarea", "richtext", "number", "boolean", "image", "date", "slug", "reference"] as const;

/** Board 151:2 writes the type as prose — "Rich text", not the `richtext` slug
 *  the model stores. The slug is an identifier; a field list is read, not
 *  parsed. */
const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Text",
  textarea: "Long text",
  richtext: "Rich text",
  number: "Number",
  boolean: "Boolean",
  image: "Image",
  date: "Date",
  slug: "Slug",
  reference: "Reference",
};

export function FieldsView({
  collection,
  onBack,
  onAddField,
  onDeleteField,
}: {
  collection: CMSCollection;
  onBack: () => void;
  onAddField: (name: string, type: string, required: boolean) => Promise<void>;
  onDeleteField: (fieldId: string) => Promise<void>;
}) {
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<string>("text");
  const [required, setRequired] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<CMSField | null>(null);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);

  return (
    <div className={CONTENT_BODY}>
      <Crumb label={`${collection.name} · fields`} onClick={onBack} />
      <div className={SCROLL}>
        {collection.fields.map((f) => (
          <Row key={f.id} size="stack" data-field-row data-testid={`content-fieldrow-${f.id}`}>
            <span className={ROW_STACK}>
              <span className={ROW_TITLE} data-testid={`content-fieldrow-name-${f.id}`}>{f.name}</span>
              <span className={SUB} data-testid={`content-fieldrow-type-${f.id}`}>{FIELD_TYPE_LABEL[f.type] ?? f.type}</span>
            </span>
            <span className={ROW_ACTIONS}>
              {/* 151:12 — the `required` tag is ink-DISABLED, a step quieter
                  than the type line beside it. It was ink-muted, which read as
                  a second piece of content rather than a tag. */}
              {f.validation?.required && <span className={REQUIRED_TAG} data-testid={`content-fieldrow-req-${f.id}`}>required</span>}
              {/* Board 151:2 draws `⋯`, not a bare ✕: delete is not the only
                  thing a field row will ever offer, and a destructive glyph
                  sitting permanently on every row invites the mis-click.
                  IconButton (32x32) rather than a text Button carrying a glyph —
                  that sizes to the glyph and measured 21.92x18, under WCAG
                  2.5.8's 24x24 minimum. */}
              <Popover
                open={menuFor === f.id}
                onClose={() => setMenuFor(null)}
                placement="bottom-end"
                label={`Actions for ${f.name}`}
                trigger={
                  <IconButton
                    label={`Actions for field ${f.name}`}
                    onClick={() => setMenuFor((p) => (p === f.id ? null : f.id))}
                  >
                    ⋯
                  </IconButton>
                }
              >
                <Menu>
                  <MenuItem
                    onClick={() => {
                      setMenuFor(null);
                      setConfirmDelete(f);
                    }}
                  >
                    Delete field
                  </MenuItem>
                </Menu>
              </Popover>
            </span>
          </Row>
        ))}
        {adding ? (
          <div className={INLINE_FORM}>
            <TextInput
              placeholder="Field name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Field name"
              autoFocus
            />
            <div className={FORM_ROW}>
              <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Field type">
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{FIELD_TYPE_LABEL[t] ?? t}</option>
                ))}
              </Select>
              <label className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:cursor-pointer">
                <Checkbox
                  color="blue"
                  className="tw:bg-white"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
                <span>required</span>
              </label>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                size="xs"
                disabled={!name.trim()}
                onClick={() => {
                  void onAddField(name, type, required).then(() => {
                    setAdding(false);
                    setName("");
                    setRequired(false);
                  });
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5`} data-testid="content-add-field" onClick={() => setAdding(true)}>
            + Add field
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void onDeleteField(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title="Delete field?"
        message={`"${confirmDelete?.name}" and its values on every record will be removed.`}
        confirmLabel="Delete field"
        tone="destructive"
      />
    </div>
  );
}

/* ── Dynamic pages ───────────────────────────────────────────────────────────
 *
 * Board 149:50 draws a `Dynamic pages ›` row in the collection footer and stops
 * there — it names the destination without drawing it. `CollectionView` had the
 * row behind an optional `onOpenDynamicPages`, ContentTab never passed it, and
 * the row is conditional, so it has never once rendered. The prop was dead from
 * the day it was added.
 *
 * The destination below is therefore designed, not transcribed, and it is
 * grounded in what the field actually does: `pageSlugPattern` generates one page
 * per record (`cms.ts:60`), so this screen is where you set it, see how many
 * pages it will produce, and learn why nothing appears until records publish —
 * which is the question `CMSRecordsModal` already answers in a warning banner.
 */

export function DynamicPagesView({
  collection,
  records,
  onBack,
  onSave,
}: {
  collection: CMSCollection;
  records: CMSContentItem[];
  onBack: () => void;
  onSave: (pattern: string) => Promise<void>;
}) {
  const [pattern, setPattern] = React.useState(collection.pageSlugPattern ?? "");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => setPattern(collection.pageSlugPattern ?? ""), [collection.pageSlugPattern]);

  const trimmed = pattern.trim();
  const dirty = trimmed !== (collection.pageSlugPattern ?? "");
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  /* Deleting one FIELD asks first; deleting the whole record did not, and CMS
     records are not in the undo stack — measured: the row was gone at once and
     ⌘Z did not bring it back. */
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const leave = () => (dirty ? setConfirmLeave(true) : onBack());
  const publishedCount = records.filter((r) => r.status === "published").length;
  /* Two more conditions decide whether a page actually appears, and neither is
     the record count. Both were checked against the service, not guessed:
     - `applyPattern` (cms.service.ts:121) substitutes "" for a {key} that names
       no field, so "/{slug}" on a collection whose only field is `title`
       resolves every record to "/" — they collide instead of generating.
     - `appendDynamicPagesToPublish` (:234) selects collections where
       `pageTemplatePath` is NOT NULL. Nothing in this panel sets it, so a
       collection created here contributes ZERO pages at publish while this
       screen said "Generates 1 page". */
  const patternKeys = [...trimmed.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]);
  const unknownKeys = patternKeys.filter((k) => !collection.fields.some((f) => f.slug === k));
  const hasTemplate = Boolean(collection.pageTemplatePath);

  return (
    <div className={CONTENT_BODY}>
      <Crumb label={`${collection.name} · dynamic pages`} onClick={leave} />
      <div className={SCROLL}>
        <div className={FIELD_LABEL}>URL pattern</div>
        <div className={FIELD_WRAP}>
          <TextInput
            value={pattern}
            placeholder="/menu/{slug}"
            onChange={(e) => setPattern(e.target.value)}
            aria-label="URL pattern"
            className="tw:[font-family:var(--bk-font-mono)]"
          />
        </div>
        <div className={`${SUB} tw:px-3 tw:pt-1.5 tw:leading-normal`}>
          One page per record. Use a field slug in braces — {"{slug}"} — to build the URL.
        </div>

        {trimmed ? (
          <div className={`${SUB} tw:px-3 tw:pt-3 tw:leading-normal`}>
            {publishedCount === 0 ? (
              /* The count that matters is PUBLISHED, not total: generation
                 filters on published, so "4 records" would be a comforting
                 number that produces nothing. */
              <span style={{ color: "var(--bk-warning)" }}>
                {records.length === 0
                  ? "No records yet — nothing to generate."
                  : `${records.length} record${records.length === 1 ? "" : "s"}, none published. Dynamic pages only generate from published records.`}
              </span>
            ) : (
              `Generates ${publishedCount} page${publishedCount === 1 ? "" : "s"} from published records.`
            )}
          </div>
        ) : (
          <div className={`${SUB} tw:px-3 tw:pt-3 tw:leading-normal`}>
            No pattern set — this collection generates no pages.
          </div>
        )}
        {trimmed && unknownKeys.length > 0 && (
          <div className={`${SUB} tw:px-3 tw:pt-2 tw:leading-normal`} style={{ color: "var(--bk-warning)" }}>
            {unknownKeys.length === 1
              ? `This collection has no field called "${unknownKeys[0]}", so every record resolves to the same URL.`
              : `This collection has no fields called ${unknownKeys.map((k) => `"${k}"`).join(", ")}, so every record resolves to the same URL.`}
          </div>
        )}
        {trimmed && !hasTemplate && (
          <div className={`${SUB} tw:px-3 tw:pt-2 tw:leading-normal`} style={{ color: "var(--bk-warning)" }}>
            No template page is bound, so publishing emits none of these yet.
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => { setConfirmLeave(false); onBack(); }}
        title="Discard changes?"
        message="The page pattern has unsaved changes. Going back throws them away."
        confirmLabel="Discard"
        tone="destructive"
      />
      {dirty && (
        <div className={SAVEBAR} role="region" aria-label="Unsaved changes">
          <span className="tw:text-xs tw:text-[var(--bk-warning-text)]">Unsaved changes</span>
          <span className={SPACER} />
          <Button
            color="light"
            size="xs"
            className={GHOST}
            onClick={() => setPattern(collection.pageSlugPattern ?? "")}
          >
            Discard
          </Button>
          <Button
            color="light"
            size="xs"
            variant="link" className={SAVE_LINK}
            disabled={saving}
            aria-busy={saving || undefined}
            onClick={() => {
              setSaving(true);
              void onSave(trimmed).finally(() => setSaving(false));
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Sources (151:46) ────────────────────────────────────────────────────── */

/** Board 151:46 draws a status LINE under the source name — a dot, then a
 *  state and a detail ("● Connected · synced 4m ago").
 *
 *  Its sample is a Google Sheets connection with a sync clock, and neither
 *  exists here: `DataSource` carries no connection state and no timestamp, and
 *  `DataManager.watch()` watches a local data PATH for in-editor updates, not a
 *  remote file for external ones. So the SHAPE is taken and the sample is not —
 *  the dot reports whether the source actually resolves to data, which is the
 *  one thing this panel can state truthfully. A green dot next to
 *  "synced 4m ago" would be a fiction the code cannot back. */
function sourceStatus(s: DataSource): { ok: boolean; label: string } {
  const d = s.data;
  if (Array.isArray(d)) return { ok: d.length > 0, label: `${s.type} · ${d.length} item${d.length === 1 ? "" : "s"}` };
  if (d && typeof d === "object") {
    const n = Object.keys(d as Record<string, unknown>).length;
    return { ok: n > 0, label: `${s.type} · ${n} key${n === 1 ? "" : "s"}` };
  }
  if (s.type === "api") return { ok: Boolean(s.endpoint), label: s.endpoint ? `api · ${s.endpoint}` : "api · no endpoint" };
  if (s.type === "function") return { ok: Boolean(s.getData), label: "function" };
  return { ok: false, label: `${s.type} · empty` };
}

export function SourcesView({
  sources,
  onBack,
  onImportJson,
  onRemoveSource,
}: {
  sources: DataSource[];
  onBack: () => void;
  onImportJson: (json: string) => string | null;
  /** Board 151:46 draws a `⋯` on every source row. `DataManager` has had
   *  `unregisterSource` all along and no UI ever called it, so a source could
   *  be added and never removed. */
  onRemoveSource?: (id: string) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [json, setJson] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Sources" onClick={onBack} />
      {/* Board 303:2083. Shown only when there is something to watch, and only
          because ContentTab now subscribes to DataManager's own events — the
          panel states this because it is true, not as decoration. */}
      {sources.length > 0 && (
        <div className="tw:px-4 tw:pb-1">
          <span className={`${STATUS_PILL} ${STATUS_PILL_OK}`} data-testid="sources-watching">
            Watching for changes
          </span>
        </div>
      )}
      <div className={SCROLL}>
        {sources.map((s) => {
          const status = sourceStatus(s);
          return (
            <Row key={s.id} size="comment" data-source-row data-testid={`content-source-${s.id}`}>
              <span className={ROW_STACK}>
                <span className={ROW_TITLE} data-testid={`content-source-name-${s.id}`}>{s.name}</span>
                <span className={`${SUB} tw:inline-flex tw:items-center tw:gap-1.5`} data-testid={`content-source-status-${s.id}`}>
                  <span
                    aria-hidden="true"
                    className="tw:size-[7px] tw:flex-none tw:rounded-full"
                    style={{ background: status.ok ? "var(--bk-success)" : "var(--bk-ink-muted)" }}
                  />
                  {status.label}
                </span>
              </span>
              {onRemoveSource && (
                <span className={ROW_ACTIONS}>
                  <Popover
                    open={menuFor === s.id}
                    onClose={() => setMenuFor(null)}
                    placement="bottom-end"
                    label={`Actions for ${s.name}`}
                    trigger={
                      <IconButton label={`Actions for ${s.name}`} onClick={() => setMenuFor((p) => (p === s.id ? null : s.id))}>
                        ⋯
                      </IconButton>
                    }
                  >
                    <Menu>
                      <MenuItem
                        onClick={() => {
                          setMenuFor(null);
                          onRemoveSource(s.id);
                        }}
                      >
                        Remove source
                      </MenuItem>
                    </Menu>
                  </Popover>
                </span>
              )}
            </Row>
          );
        })}
        {/* Board 303:2067's pill words, which are the state's real name — the
            panel is not missing a list, there is nothing connected yet. */}
        {sources.length === 0 && !adding && (
          <div className="tw:px-4 tw:py-2">
            <span className={`${STATUS_PILL} ${STATUS_PILL_IDLE}`} data-testid="content-no-source">
              No data source connected
            </span>
          </div>
        )}
        {adding ? (
          <div className={INLINE_FORM}>
            <Textarea
              className="tw:bg-white tw:min-h-24 tw:resize-y tw:[font-family:var(--bk-font-mono)] tw:text-xs"
              placeholder='{"products": [{"name": "…"}]}'
              value={json}
              onChange={(e) => setJson(e.target.value)}
              aria-label="Source JSON"
              autoFocus
            />
            {error && <div className={ERROR_TEXT} role="alert">{error}</div>}
            <div className={FORM_ROW}>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={() => { setAdding(false); setError(null); }}>Cancel</Button>
              <Button
                size="xs"
                disabled={!json.trim()}
                onClick={() => {
                  const err = onImportJson(json);
                  if (err) setError(err);
                  else {
                    setAdding(false);
                    setJson("");
                    setError(null);
                  }
                }}
              >
                Add source
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5`} data-testid="content-add-source" onClick={() => setAdding(true)}>
              + Connect a source
            </Button>
            {/* Board 151:46 prints this under the link, in flow. Pinned to the
                panel's foot with a rule above it, it read as a footer note on
                a different subject — 600px below the thing it explains. */}
            <div className={INLINE_HINT} data-testid="content-source-note">
              A source feeds a collection. Edits sync one way — from the source in.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Variables (151:62) ──────────────────────────────────────────────────── */

export function VariablesView({
  variables,
  onBack,
  onChange,
}: {
  variables: SiteVariable[];
  onBack: () => void;
  onChange: (vars: SiteVariable[]) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const [editKey, setEditKey] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const keyError = key.trim() !== "" && !isValidVariableKey(key.trim());
  const dupError = variables.some((v) => v.key === key.trim());

  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Variables" onClick={onBack} />
      <div className={SCROLL}>
        {/* Every other screen in this panel says what an empty list means —
            "No data source connected", "No records yet". Variables said
            nothing at all, so an empty Variables screen was one blue link on
            white with no clue what a variable is for. */}
        {variables.length === 0 && !adding && (
          /* This said a variable is reusable "in any text on any page", naming
             the {{site.*}} form. Nothing substitutes it: typed into a heading
             it renders literally on the canvas AND comes out literally in the
             exported HTML (walked live — the export carried the raw braces and
             no value). The store is localStorage keyed by project, so the
             publish worker cannot see it either, and the inspector's binding
             popover offers collections only. Until variables move into the
             project and something reads them, the screen says what is true. */
          <div className={`${SUB} tw:p-3`}>
            No variables yet. A variable is a value you write once and reuse in
            this panel — <span className={MONO}>{" {{site.name}} "}</span> is
            saved in this browser, and pages do not read it yet.
          </div>
        )}
        {variables.map((v) => (
          <Row key={v.key} size="stack" data-variable-row data-testid={`content-var-${v.key}`}>
            <span className={ROW_STACK}>
              <span className={MONO} data-testid={`content-var-key-${v.key}`}>{`{{site.${v.key}}}`}</span>
              {editKey === v.key ? (
                <TextInput
                  className="tw:mt-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  aria-label={`Value for ${v.key}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChange(variables.map((x) => (x.key === v.key ? { ...x, value: editValue } : x)));
                      setEditKey(null);
                    }
                    if (e.key === "Escape") setEditKey(null);
                  }}
                />
              ) : (
                <span className={SUB} data-testid={`content-var-value-${v.key}`}>{v.value || "—"}</span>
              )}
            </span>
            <span className={ROW_ACTIONS}>
              {editKey === v.key ? (
                <Button
                  color="light"
                  size="xs"
                  className={GHOST}
                  onClick={() => {
                    onChange(variables.map((x) => (x.key === v.key ? { ...x, value: editValue } : x)));
                    setEditKey(null);
                  }}
                >
                  Save
                </Button>
              ) : (
                /* Board 151:62 draws one `⋯` per row, not a pair of text
                   buttons. Two labelled actions on every row read as the row's
                   content and crowded the value out of a 320 column. */
                <Popover
                  open={menuFor === v.key}
                  onClose={() => setMenuFor(null)}
                  placement="bottom-end"
                  label={`Actions for ${v.key}`}
                  trigger={
                    <IconButton
                      label={`Actions for ${v.key}`}
                      onClick={() => setMenuFor((p) => (p === v.key ? null : v.key))}
                    >
                      ⋯
                    </IconButton>
                  }
                >
                  <Menu>
                    <MenuItem onClick={() => { setMenuFor(null); setEditKey(v.key); setEditValue(v.value); }}>
                      Edit value
                    </MenuItem>
                    <MenuItem onClick={() => { setMenuFor(null); onChange(variables.filter((x) => x.key !== v.key)); }}>
                      Delete variable
                    </MenuItem>
                  </Menu>
                </Popover>
              )}
            </span>
          </Row>
        ))}
        {adding ? (
          <div className={INLINE_FORM}>
            <TextInput
              placeholder="key (e.g. phone)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              aria-label="Variable key"
              autoFocus
            />
            {(keyError || dupError) && (
              <div className={ERROR_TEXT} role="alert">
                {dupError ? "A variable with this key already exists." : "Keys are letters/digits/dashes, starting with a letter."}
              </div>
            )}
            <TextInput
              placeholder="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Variable value"
            />
            <div className={FORM_ROW}>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                size="xs"
                disabled={!key.trim() || keyError || dupError}
                onClick={() => {
                  onChange([...variables, { key: key.trim(), value }]);
                  setAdding(false);
                  setKey("");
                  setValue("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5`} data-testid="content-add-variable" onClick={() => setAdding(true)}>
            + New variable
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Conditions (151:87) ─────────────────────────────────────────────────── */

const OPERATORS: ConditionOperator[] = ["==", "!=", ">", "<", ">=", "<=", "contains", "exists", "empty"];

export function ConditionsView({
  conditions,
  onBack,
  onRemove,
  onSelectElement,
  onStartPick,
  pickedElementId,
  onCreate,
  onCancelPick,
}: {
  conditions: ConditionRow[];
  onBack: () => void;
  onRemove: (elementId: string) => void;
  onSelectElement: (elementId: string) => void;
  onStartPick: () => void;
  pickedElementId: string | null;
  onCreate: (expr: ConditionExpression) => void;
  onCancelPick: () => void;
}) {
  const [left, setLeft] = React.useState("");
  const [operator, setOperator] = React.useState<ConditionOperator>("==");
  const [right, setRight] = React.useState("");
  const needsRight = !["exists", "not_exists", "empty", "not_empty"].includes(operator);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);

  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Conditions" onClick={onBack} />
      <div className={SCROLL}>
        {conditions.map((c) => (
          <Row key={`${c.elementId}`} size="tall" data-condition-row data-testid={`content-cond-${c.elementId}`}>
            <span className={ROW_STACK}>
              <span className={`${ROW_TITLE} tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap`} data-testid={`content-cond-label-${c.elementId}`}>{c.label}</span>
              <span className={SUB} data-testid={`content-cond-summary-${c.elementId}`}>{conditionSummary(c.binding)}</span>
            </span>
            <span className={ROW_ACTIONS}>
              {/* Board 151:87 draws `⋯`. */}
              <Popover
                open={menuFor === c.elementId}
                onClose={() => setMenuFor(null)}
                placement="bottom-end"
                label={`Actions for ${c.label}`}
                trigger={
                  <IconButton
                    label={`Actions for ${c.label}`}
                    onClick={() => setMenuFor((p) => (p === c.elementId ? null : c.elementId))}
                  >
                    ⋯
                  </IconButton>
                }
              >
                <Menu>
                  <MenuItem onClick={() => { setMenuFor(null); onSelectElement(c.elementId); }}>
                    Select element
                  </MenuItem>
                  <MenuItem onClick={() => { setMenuFor(null); onRemove(c.elementId); }}>
                    Remove condition
                  </MenuItem>
                </Menu>
              </Popover>
            </span>
          </Row>
        ))}
        {conditions.length === 0 && !pickedElementId && (
          <div className={`${SUB} tw:p-3`}>
            No conditions yet. A condition shows or hides an element based on data —
            &ldquo;+ New condition&rdquo; starts by picking the element on the canvas it
            controls.
          </div>
        )}
        {pickedElementId ? (
          <div className={INLINE_FORM} data-testid="condition-form">
            <div className={SUB}>Show the picked element when…</div>
            <TextInput
              placeholder="site.hours or menu.available"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              aria-label="Condition path"
              autoFocus
            />
            <div className={FORM_ROW}>
              <Select
                value={operator}
                onChange={(e) => setOperator(e.target.value as ConditionOperator)}
                aria-label="Operator"
              >
                {OPERATORS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
              {needsRight && (
                <div className={SPACER}>
                  <TextInput
                    placeholder="value"
                    value={right}
                    onChange={(e) => setRight(e.target.value)}
                    aria-label="Condition value"
                  />
                </div>
              )}
            </div>
            <div className={FORM_ROW}>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={onCancelPick}>Cancel</Button>
              <Button
                size="xs"
                disabled={!left.trim() || (needsRight && !right.trim())}
                onClick={() =>
                  onCreate({
                    operator,
                    left: left.trim(),
                    ...(needsRight ? { right: right.trim() } : {}),
                  })
                }
              >
                Add condition
              </Button>
            </div>
          </div>
        ) : (
          <Button className={`${LINK_BTN} tw:mx-4 tw:my-0.5`} data-testid="content-add-condition" onClick={onStartPick}>
            + New condition
          </Button>
        )}
      </div>

    </div>
  );
}

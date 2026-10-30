/**
 * Rulers and guides — design-2l9 153:79518 (the list), 155:83650 (one guide:
 * position, lock, remove, Apply), 145:67569 (a locked guide: read-only, Unlock,
 * ‹ Back to guides) and 155:82271 (after a removal, with its
 * undo). Opens from the canvas View menu in the menu's place, like Grid and
 * snapping. The guides are the site's own data (`canvasGuides` in the project
 * settings, saved with the site — useCanvasGuides), so "shared across this
 * site" is what they are; a guide's edits apply on Apply.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, TextInput, ToggleSwitch } from "@/editor/chrome-ui";
import type { CanvasGuide } from "@/shared/types/canvas";

export interface CanvasGuideActions {
  list: readonly CanvasGuide[];
  add: (type: CanvasGuide["type"], position: number) => void;
  update: (id: string, position: number) => void;
  setLocked: (id: string, locked: boolean) => void;
  remove: (id: string) => void;
  restore: (guide: CanvasGuide) => void;
}

export interface RulersGuidesPanelProps {
  rulersOn: boolean;
  onRulersChange: (on: boolean) => void;
  guides: CanvasGuideActions;
  onClose: () => void;
}

const POSITION_RANGE = { min: 0, max: 10000 } as const;
const TYPE_LABEL: Record<CanvasGuide["type"], string> = { vertical: "Vertical", horizontal: "Horizontal" };
const TEXT_BTN =
  "tw:h-7 tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0";
const OUTLINE_BTN = "tw:h-8 tw:min-h-0 tw:px-6 tw:text-[13px] tw:font-medium tw:focus:ring-0";

function parsePosition(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= POSITION_RANGE.min && n <= POSITION_RANGE.max ? n : null;
}

function Head({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="tw:flex tw:items-center">
      <span className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">{title}</span>
      <Button color="light" size="xs" data-testid="guides-close" className={`tw:ml-auto ${TEXT_BTN}`} onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

/** One guide (155:83650), or a new one when `guide` is null. */
function GuideDetail({
  guide,
  guides,
  onDone,
  onClose,
}: {
  guide: CanvasGuide | null;
  guides: CanvasGuideActions;
  onDone: (removed?: CanvasGuide) => void;
  onClose: () => void;
}) {
  const [type, setType] = React.useState<CanvasGuide["type"]>(guide?.type ?? "vertical");
  const [draft, setDraft] = React.useState(String(guide?.position ?? 100));
  /* Lock / Unlock act at once (145:67569): read the guide's live state. */
  const locked = Boolean(guide && guides.list.find((g) => g.id === guide.id)?.locked);
  const position = parsePosition(draft);
  const apply = () => {
    if (position === null || locked) return;
    if (!guide) guides.add(type, position);
    else if (position !== guide.position) guides.update(guide.id, position);
    onDone();
  };
  return (
    <div className="tw:flex tw:w-90 tw:flex-col tw:gap-4 tw:whitespace-normal tw:p-3" role="dialog" aria-label="Guide" data-testid="guide-detail">
      <Head title={guide ? `${TYPE_LABEL[guide.type]} guide` : "New guide"} onClose={onClose} />
      {!guide && (
        <div className="tw:flex tw:gap-2" role="radiogroup" aria-label="Direction">
          {(["vertical", "horizontal"] as const).map((t) => (
            <Button
              key={t}
              color="light"
              size="xs"
              role="radio"
              aria-checked={type === t}
              data-testid={`guide-type-${t}`}
              className={`${OUTLINE_BTN} tw:px-3! ${type === t ? "tw:bg-[var(--bk-accent-tint)]! tw:text-[var(--bk-accent-text)]!" : ""}`}
              onClick={() => setType(t)}
            >
              {TYPE_LABEL[t]}
            </Button>
          ))}
        </div>
      )}
      <label className="tw:flex tw:flex-col tw:gap-1 tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink)]">
        Position (px)
        <TextInput
          inputMode="numeric"
          value={draft}
          disabled={locked}
          color={position === null ? "failure" : undefined}
          data-testid="guide-position"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") apply();
          }}
        />
      </label>
      <p className={`tw:m-0 tw:-mt-2 tw:text-[11px] tw:leading-4 ${position === null ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-ink-muted)]"}`} data-testid="guide-hint">
        {locked
          ? "Unlock this guide to change it."
          : position === null
            ? `Enter a whole number from ${POSITION_RANGE.min} to ${POSITION_RANGE.max}.`
            : "Changes apply with Apply."}
      </p>
      {guide && (
        <div className="tw:flex tw:flex-col tw:items-start tw:gap-1">
          <Button color="light" size="xs" className={OUTLINE_BTN} data-testid="guide-lock" aria-pressed={locked} onClick={() => guides.setLocked(guide.id, !locked)}>
            {locked ? "Unlock guide" : "Lock guide"}
          </Button>
          <Button
            color="light"
            size="xs"
            className={`${locked ? OUTLINE_BTN : `${TEXT_BTN} tw:px-5`}`}
            disabled={locked}
            data-testid="guide-remove"
            onClick={() => {
              guides.remove(guide.id);
              onDone(guide);
            }}
          >
            Remove guide
          </Button>
        </div>
      )}
      {locked ? (
        /* 145:67569: a locked guide changes nothing here — the way back. */
        <Button variant="link" size="xs" className="tw:h-7 tw:min-h-0 tw:self-start tw:px-6 tw:text-[13px]" data-testid="guide-back" onClick={() => onDone()}>
          ‹ Back to guides
        </Button>
      ) : (
      <div className="tw:flex tw:justify-end tw:gap-2">
        <Button color="light" size="xs" className={`${OUTLINE_BTN} tw:w-24`} onClick={() => onDone()}>
          Cancel
        </Button>
        <Button size="xs" className={`${OUTLINE_BTN} tw:w-24`} disabled={position === null} data-testid="guide-apply" onClick={apply}>
          {guide ? "Apply" : "Add"}
        </Button>
      </div>
      )}
    </div>
  );
}

export function RulersGuidesPanel({ rulersOn, onRulersChange, guides, onClose }: RulersGuidesPanelProps) {
  /* undefined: the list; null: a new guide; a guide: its detail. */
  const [editing, setEditing] = React.useState<CanvasGuide | null | undefined>(undefined);
  const [removed, setRemoved] = React.useState<CanvasGuide | null>(null);

  if (editing !== undefined) {
    return (
      <GuideDetail
        guide={editing}
        guides={guides}
        onClose={onClose}
        onDone={(gone) => {
          setRemoved(gone ?? null);
          setEditing(undefined);
        }}
      />
    );
  }

  return (
    <div className="tw:flex tw:w-90 tw:flex-col tw:gap-4 tw:whitespace-normal tw:p-3" role="dialog" aria-label="Rulers and guides" data-testid="guides-panel">
      <Head title="Rulers and guides" onClose={onClose} />
      <div className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink)]">
        <ToggleSwitch sizing="sm" checked={rulersOn} onChange={onRulersChange} aria-label="Show rulers" data-testid="guides-rulers" className="tw:focus:ring-0" />
        <span aria-hidden="true">Show rulers</span>
      </div>
      <span className="tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink)]">Guides · shared across this site</span>
      {guides.list.length === 0 && !removed && (
        <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="guides-empty">
          No guides yet. Click a ruler, or add one here.
        </p>
      )}
      {guides.list.map((g) => (
        <div key={g.id} className="tw:flex tw:items-center tw:min-h-14 tw:rounded-md tw:bg-[var(--bk-gray-100)] tw:px-2 tw:py-2" data-testid={`guide-row-${g.id}`}>
          <div className="tw:flex tw:min-w-0 tw:flex-col">
            <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{`${TYPE_LABEL[g.type]} · ${g.position} px`}</span>
            <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{g.locked ? "Locked" : "Unlocked"}</span>
          </div>
          <Button color="light" size="xs" className={`tw:ml-auto ${TEXT_BTN}`} data-testid={`guide-edit-${g.id}`} onClick={() => setEditing(g)}>
            Edit
          </Button>
        </div>
      ))}
      {removed && (
        <Button
          variant="link"
          size="xs"
          className="tw:h-7 tw:min-h-0 tw:self-start tw:px-6 tw:text-[13px]"
          data-testid="guides-undo-remove"
          onClick={() => {
            guides.restore(removed);
            setRemoved(null);
          }}
        >
          Undo guide removal
        </Button>
      )}
      <Button color="light" size="xs" className={`${OUTLINE_BTN} tw:self-start`} data-testid="guides-add" onClick={() => setEditing(null)}>
        Add guide
      </Button>
    </div>
  );
}

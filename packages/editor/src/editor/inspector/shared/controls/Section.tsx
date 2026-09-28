/**
 * Section — the one frame every Inspector section renders in.
 *
 * Inspector v4 (DD-11, board 1): a section is in one of three display modes —
 *   open    — chevron-down header, body below;
 *   summary — chevron-right header and, when there is one, a one-line summary
 *             under it ("id: hero-title · 1 attribute", board 2);
 *   empty   — one header row with a "+" (board 1's "Fill  +"): nothing set,
 *             one click to add.
 *
 * Which mode, the header title and the anchor id come from the registry, not
 * from each section file: `InspectorTabContent` wraps every entry in a
 * `SectionFrameContext` and the FIRST Section under it reads it (nested
 * Sections see no frame). A Section rendered outside the Inspector's tab body
 * (tests, other panels) behaves as before — controlled or uncontrolled open,
 * its own title.
 *
 * ⌥-click / ⌥+Enter on a header toggles every section on the tab (DD-22).
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import * as React from "react";
import { IconButton } from "@/editor/chrome-ui";
import { useInspectorField } from "./InspectorFieldContext";

// ============================================================================
// TYPES
// ============================================================================

/** Positional weight the pre-v4 renderer computed. Kept as a prop type the
 *  section files still accept; the v4 frame draws every section alike. */
export type SectionTier = "primary" | "secondary" | "tertiary" | "advanced";

export type SectionDisplayMode = "open" | "summary" | "empty";

/** What the registry tells the section frame it renders in. */
export interface SectionFrame {
  /** Registry id — the anchor is `inspector-section-<sectionId>`. */
  sectionId: string;
  /** Registry title — the header text (e.g. "Fill", "CMS binding"). */
  title: string;
  displayMode: SectionDisplayMode;
  /** Closed one-line summary, or null for none. */
  summary?: string | null;
  /** The "+" of an empty section. */
  onAdd?: () => void;
  /** Open / close this section (the user's choice for this element type). */
  onToggle: () => void;
  /** ⌥-click: open or close every section on the tab. */
  onToggleAll?: () => void;
  /** Override dot next to the title (R-DD-14). */
  headerDot?: React.ReactNode;
  /** Bottom line of an open section ("● Overridden on Tablet"). */
  note?: React.ReactNode;
}

export const SectionFrameContext = React.createContext<SectionFrame | null>(null);

// ============================================================================
// FIELD ERRORS (board 34, DD-19)
// ============================================================================

/** Where a field reports the entry it could not read. */
type FieldErrorSink = (id: string, message: string | null) => void;

const FieldErrorContext = React.createContext<FieldErrorSink | null>(null);

const ERROR_LINE = "tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]";

/**
 * A field's error line. Inside a Section the line is drawn in the section's
 * error band, under its last row (board 34), which is also the section's
 * polite live region; outside one, `ErrorLine` draws it in place. Returns the
 * id for the field's `aria-describedby`.
 */
export function useFieldError(message: string | null): string {
  const id = React.useId();
  const sink = React.useContext(FieldErrorContext);
  React.useEffect(() => {
    if (!sink) return;
    sink(id, message);
    return () => sink(id, null);
  }, [sink, id, message]);
  return id;
}

/** The error line for a field rendered outside any Section. */
export function ErrorLine({ id, message }: { id: string; message: string | null }) {
  const sink = React.useContext(FieldErrorContext);
  if (sink || !message) return null;
  return (
    <p id={id} role="status" className={ERROR_LINE} data-testid="inspector-field-error">
      {message}
    </p>
  );
}

export interface SectionProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  id?: string;
  /** Short value readout; shown as the summary line while closed. */
  preview?: React.ReactNode;
  /** Header action of an OPEN section (e.g. Background's add-layer "+"). */
  action?: React.ReactNode;
  /** Retained for the section files that still pass it; draws nothing. */
  tier?: SectionTier;
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

const HEADER_CLASS =
  "bdi-sec-h tw:flex tw:items-center tw:gap-2 tw:h-8 tw:px-3 tw:cursor-pointer tw:select-none";
const TOGGLE_CLASS =
  "tw:flex-1 tw:min-w-0 tw:flex tw:items-center tw:gap-2 tw:h-7 tw:rounded-[4px] tw:cursor-pointer tw:text-left " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const NAME_CLASS =
  "bdi-sec-name tw:min-w-0 tw:truncate tw:text-[12px] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink-soft)]";
const SUMMARY_CLASS =
  "tw:m-0 tw:px-4 tw:pb-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:truncate";

export const Section: React.FC<SectionProps> = ({
  title: ownTitle,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  id: ownId,
  preview,
  action,
  children,
}) => {
  const frame = React.useContext(SectionFrameContext);
  /* Why the panel is read-only, for the one CSS rule that draws it (board 23
     dims a locked element's controls; board 29's conflict does not). */
  const { readOnlyReason } = useInspectorField();
  const [internalIsOpen, setInternalIsOpen] = React.useState(defaultOpen);
  const [errors, setErrors] = React.useState<ReadonlyMap<string, string>>(() => new Map());
  const reportError = React.useCallback<FieldErrorSink>((fieldId, message) => {
    setErrors((prev) => {
      if ((prev.get(fieldId) ?? null) === message) return prev;
      const next = new Map(prev);
      if (message === null) next.delete(fieldId);
      else next.set(fieldId, message);
      return next;
    });
  }, []);

  const isControlled = controlledIsOpen !== undefined;
  const standaloneOpen = isControlled ? controlledIsOpen : internalIsOpen;

  React.useEffect(() => {
    if (isControlled) setInternalIsOpen(controlledIsOpen);
  }, [isControlled, controlledIsOpen]);

  const mode: SectionDisplayMode = frame ? frame.displayMode : standaloneOpen ? "open" : "summary";
  const isOpen = mode === "open";
  const title = frame?.title ?? ownTitle;
  const id = frame ? `inspector-section-${frame.sectionId}` : ownId;

  const toggle = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e?.altKey && frame?.onToggleAll) {
      frame.onToggleAll();
      return;
    }
    if (frame) {
      frame.onToggle();
      return;
    }
    const next = !standaloneOpen;
    if (!isControlled) setInternalIsOpen(next);
    onToggle?.(next);
  };

  const slug = title.toLowerCase().replace(/\s+/g, "-");
  const contentId = `section-content-${slug}`;
  const summary = mode === "summary" ? (frame?.summary ?? preview ?? null) : null;
  const Chevron = isOpen ? ChevronDown : ChevronRight;

  return (
    <div
      className={`bdi-sec${isOpen ? "" : " closed"}${mode === "empty" ? " empty" : ""}`}
      id={id}
      data-testid={`inspector-section-${slug}`}
      data-display-mode={mode}
      data-readonly={readOnlyReason ?? undefined}
    >
      {/* The row is a container; the toggle carries the button role and any
          action is its SIBLING, never its child (axe nested-interactive).
          Gate 24 keeps raw <button> out of chrome, so the role sits on a span. */}
      <div className={HEADER_CLASS} data-testid={`inspector-sechead-${slug}`}>
        <span
          role="button"
          tabIndex={0}
          className={TOGGLE_CLASS}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle(e);
            }
          }}
          aria-expanded={isOpen}
          aria-controls={contentId}
          aria-label={`${title} section, ${isOpen ? "expanded" : "collapsed"}`}
        >
          {/* An empty "+" row has nothing to disclose: no chevron, the title
              stays in the chevron's column (boards 1, 3). */}
          {mode === "empty" ? (
            <span aria-hidden="true" className="tw:w-3 tw:shrink-0" />
          ) : (
            <Chevron size={12} aria-hidden="true" className="bdi-chev tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
          )}
          <span className={NAME_CLASS} data-testid={`inspector-secname-${slug}`}>
            {title}
          </span>
          {frame?.headerDot}
        </span>
        {mode === "empty" ? (
          <IconButton
            label={`Add ${title.toLowerCase()}`}
            size="sm"
            data-testid={`inspector-add-${frame?.sectionId ?? slug}`}
            className="tw:size-6 tw:shrink-0 tw:text-[var(--bk-ink-muted)]"
            onClick={() => frame?.onAdd?.()}
          >
            <Plus size={12} aria-hidden="true" />
          </IconButton>
        ) : isOpen && action ? (
          <span className="tw:inline-flex tw:items-center tw:shrink-0">{action}</span>
        ) : null}
      </div>
      {summary ? (
        <p className={SUMMARY_CLASS} data-testid={`inspector-summary-${frame?.sectionId ?? slug}`}>
          {summary}
        </p>
      ) : null}
      {isOpen && (
        <div id={contentId} className="bdi-sec-body">
          {/* A Section nested in this body is its own, unframed disclosure. */}
          <SectionFrameContext.Provider value={null}>
            <FieldErrorContext.Provider value={reportError}>{children}</FieldErrorContext.Provider>
          </SectionFrameContext.Provider>
          {frame?.note ? (
            <p className="tw:m-0 tw:pt-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-accent-text)]">{frame.note}</p>
          ) : null}
        </div>
      )}
      {/* Board 34: the band under the section's rows. Mounted while the
          section is open so it is a live region before a message lands. */}
      {isOpen ? (
        <div aria-live="polite" className={errors.size ? "bdi-sec-errors" : undefined}>
          {[...errors].map(([fieldId, message]) => (
            <p key={fieldId} id={fieldId} className={ERROR_LINE} data-testid="inspector-field-error">
              {message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Section;

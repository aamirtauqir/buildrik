/**
 * CmsBindingSection — Content › Dynamic bindings (2L9 boards B5-D04, D07,
 * Play F2.16 `302:18532`; board 25 / S36 for a deleted source). Drawn only
 * while the element is bound: the bindings it carries, one row each —
 *
 *   Dynamic bindings
 *   1 binding
 *   Text · Blog.title ›          → the binding detail
 *
 * A binding is made and edited at its property row in the type block
 * (`binding/BindingPropertyRow`: Choose source, then the detail). This
 * section is the index of what the element follows, and where a dead source
 * is said: "Source missing — Collection “…” was deleted." with Reconnect…
 * (Choose source again; the pick replaces the binding in one step) and
 * Unbind (keeps the text on screen, P-2).
 *
 * @license BSD-3-Clause
 */
import { ChevronRight } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { Section, type SectionTier } from "../shared/controls";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";
import { ActionRow, NoteRow } from "./behaviourRows";
import { ChooseSourcePicker } from "./binding/ChooseSourcePicker";
import { openSubview } from "@/editor/inspector/tabs/subviewStore";
import { PROPERTY_LABEL, useCmsBinding } from "./binding/useCmsBinding";

export interface CmsBindingSectionProps {
  elementId: string;
  composer: Composer | null;
  onOpenCreateCollection?: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const ROW =
  "tw:flex tw:items-center tw:gap-1.5 tw:h-7 tw:px-2 tw:rounded-[4px] tw:cursor-pointer tw:select-none " +
  "tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export const CmsBindingSection: React.FC<CmsBindingSectionProps> = ({ elementId, composer, onOpenCreateCollection, isOpen, onToggle, tier = "tertiary" }) => {
  const state = useCmsBinding(composer, elementId);
  const { readOnly } = useInspectorField();
  const [reconnecting, setReconnecting] = React.useState(false);
  const { binding } = state;
  if (!binding) return null;
  const label = PROPERTY_LABEL[state.property];

  return (
    <Section title="Dynamic bindings" icon="Database" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-cms-binding">
      {state.missing ? (
        <>
          <NoteRow tone="error" testId="cms-source-missing">
            {binding.collectionName
              ? `Source missing — Collection “${binding.collectionName}” was deleted.`
              : "Source missing — the collection this followed was deleted."}{" "}
            Reconnect a source or keep the current text.
          </NoteRow>
          <ChooseSourcePicker
            state={state}
            open={reconnecting}
            onClose={() => setReconnecting(false)}
            onOpenCreateCollection={onOpenCreateCollection}
            trigger={
              <ActionRow
                onClick={() => {
                  if (!readOnly) setReconnecting(true);
                }}
                testId="cms-reconnect"
              >
                Reconnect…
              </ActionRow>
            }
          />
          <ActionRow
            onClick={() => {
              if (!readOnly) state.unbind();
            }}
            testId="cms-unbind"
          >
            Unbind
          </ActionRow>
        </>
      ) : (
        <>
          <NoteRow testId="cms-binding-count">1 binding</NoteRow>
          <div
            role="button"
            tabIndex={0}
            className={ROW}
            data-testid="cms-binding-summary-row"
            onClick={() => openSubview({ kind: "binding", elementId })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSubview({ kind: "binding", elementId });
              }
            }}
          >
            <span className="tw:min-w-0 tw:flex-1 tw:truncate">
              {label} · {state.collection?.name}.{binding.fieldSlug}
            </span>
            <ChevronRight size={12} aria-hidden="true" className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
          </div>
        </>
      )}
    </Section>
  );
};

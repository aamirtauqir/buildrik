/**
 * CSS Classes Section — Behaviour › CSS classes (board 2): the element's
 * classes as chips ("hero-title ▾" — the chevron opens Remove class), then an
 * "Add class" field. The field takes several at once: "card hero .wide" typed
 * or pasted adds all three in one step (multi-class paste). Suggestions are
 * the project's global classes.
 *
 * SSOT: reads classes from composer.elements.getElement().getClasses() and
 * re-reads on element:updated, so undo / redo never leave it stale. Every
 * write passes the lock gate (P-1).
 *
 * @license BSD-3-Clause
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { Button, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import { writeElement } from "@/engine/commands/commandOperations";
import { Section, type SectionTier } from "../shared/controls";
import { CommitRow } from "./behaviourRows";

export interface CSSClassesSectionProps {
  selectedElement: {
    id: string;
    type: string;
  };
  composer?: Composer | null;
  /** Controlled open state for the section wrapper. */
  isOpen?: boolean;
  /** Called when the section header is toggled. */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
}

/** "card, hero  .wide" → ["card", "hero", "wide"]. */
function parseClassList(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).map((t) => t.replace(/^\.+/, "")).filter(Boolean))];
}

function ClassChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      label={`Class ${name}`}
      trigger={
        <Button
          type="button"
          color="ghost"
          size="xs"
          data-testid={`class-chip-${name}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="tw:h-7 tw:gap-1.5 tw:rounded-[4px] tw:px-1.5 tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-soft)]"
        >
          {name}
          <ChevronDown size={12} aria-hidden="true" className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" />
        </Button>
      }
    >
      <Menu label={`Class ${name}`}>
        <MenuItem
          danger
          onClick={() => {
            setOpen(false);
            onRemove();
          }}
        >
          Remove class
        </MenuItem>
      </Menu>
    </Popover>
  );
}

export const CSSClassesSection: React.FC<CSSClassesSectionProps> = ({
  selectedElement,
  composer,
  isOpen,
  onToggle,
  tier = "secondary",
}) => {
  const [classes, setClasses] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!composer || !selectedElement?.id) {
      setClasses([]);
      return;
    }
    const read = () => {
      const el = composer.elements.getElement(selectedElement.id);
      setClasses(el?.getClasses?.() ?? []);
    };
    read();
    const handler = (payload: unknown) => {
      // Payload is the Element; compare its id to our selection so we
      // only re-read for OUR element, not any element change in the project.
      const id = (payload as { getId?: () => string } | undefined)?.getId?.();
      if (!id || id === selectedElement.id) read();
    };
    composer.on?.("element:updated", handler);
    return () => {
      composer.off?.("element:updated", handler);
    };
  }, [composer, selectedElement?.id]);

  const globalClasses = React.useMemo<string[]>(() => {
    const global = (composer?.styles as { getGlobalClasses?: () => string[] } | null)?.getGlobalClasses?.();
    return global ?? [];
  }, [composer]);

  /** One step for however many were typed or pasted. */
  const addClasses = (text: string) => {
    const fresh = parseClassList(text).filter((c) => !classes.includes(c));
    if (!fresh.length || !composer || !selectedElement?.id) return;
    /* P-1: the lock gate — refused (and said) when the element is locked. */
    writeElement(composer, composer.elements.getElement(selectedElement.id), "add-class", (el) => {
      for (const c of fresh) el.addClass?.(c);
    });
  };

  const removeClass = (className: string) => {
    if (!composer || !selectedElement?.id) return;
    /* P-1: the lock gate — refused (and said) when the element is locked. */
    writeElement(composer, composer.elements.getElement(selectedElement.id), "remove-class", (el) => el.removeClass?.(className));
  };

  return (
    <Section title="CSS classes" icon="Tag" defaultOpen isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-css-classes">
      {classes.length ? (
        <div className="tw:flex tw:flex-wrap tw:gap-2 tw:py-1" data-testid="class-chips">
          {classes.map((cls) => (
            <ClassChip key={cls} name={cls} onRemove={() => removeClass(cls)} />
          ))}
        </div>
      ) : null}
      <CommitRow
        label="Add class"
        value=""
        placeholder="Add a class…"
        clearOnCommit
        testId="class-add"
        suggestions={globalClasses.filter((c) => !classes.includes(c))}
        onCommit={addClasses}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (parseClassList(text).length < 2) return;
          /* several at once: add them all now, one step */
          e.preventDefault();
          addClasses(text);
        }}
      />
    </Section>
  );
};

export default CSSClassesSection;

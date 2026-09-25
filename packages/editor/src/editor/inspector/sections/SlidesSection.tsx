/**
 * Slider › SLIDES — board 4428:142450: one row per slide (drag handle ·
 * thumbnail · "Slide N · <its heading>" · ⋯ Duplicate / Delete), "+ Add slide"
 * under them. The slides are the slider's own children.
 *
 * PLAYBACK (autoplay, interval) and CONTROLS (arrows, dots) need a carousel
 * runtime in the exported page — logged in missing-features, not built here.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import { Button, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import { Section, type SectionTier } from "../shared/controls";

export interface SlidesSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

function runTxn(composer: Composer, label: string, fn: () => void) {
  composer.beginTransaction?.(label);
  try {
    fn();
  } finally {
    composer.endTransaction?.();
  }
}

/** "Slide 2 · Dining room" — the slide's first heading, else just its number. */
function slideLabel(slide: Element, index: number): string {
  const heading = slide.getDescendants().find((el) => /^h[1-6]$/.test(el.getTagName().toLowerCase()) || el.getType() === "heading");
  const text = heading?.getContent().replace(/<[^>]*>/g, "").trim();
  return text ? `Slide ${index + 1} · ${text}` : `Slide ${index + 1}`;
}

/** The slide's picture for the thumb: its first image, else its background. */
function slideThumb(slide: Element): React.CSSProperties {
  const img = slide.getDescendants().find((el) => el.getTagName().toLowerCase() === "img");
  const src = img?.getAttribute("src");
  if (src) return { backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center" };
  const bg = slide.getStyle?.("background-color") || slide.getStyle?.("background");
  return bg ? { background: bg } : {};
}

const ROW = "tw:flex tw:items-center tw:gap-2 tw:h-8";

function SlideMenu({ onDuplicate, onDelete, label }: { onDuplicate: () => void; onDelete: () => void; label: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label={`${label} actions`}
      trigger={
        <Button
          type="button"
          color="alternative"
          size="xs"
          aria-label={`${label} actions`}
          onClick={() => setOpen((v) => !v)}
          className="tw:h-6 tw:w-6 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[var(--bk-ink-muted)] tw:hover:bg-[var(--bk-gray-100)]"
        >
          ⋯
        </Button>
      }
    >
      <Menu label={`${label} actions`}>
        <MenuItem onClick={() => { setOpen(false); onDuplicate(); }}>Duplicate</MenuItem>
        <MenuItem danger onClick={() => { setOpen(false); onDelete(); }}>Delete</MenuItem>
      </Menu>
    </Popover>
  );
}

export const SlidesSection: React.FC<SlidesSectionProps> = ({ elementId, composer, isOpen, onToggle, tier = "tertiary" }) => {
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  const [dragId, setDragId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const evts = [EVENTS.ELEMENT_UPDATED, EVENTS.ELEMENT_CREATED, EVENTS.ELEMENT_DELETED, EVENTS.ELEMENT_MOVED] as const;
    for (const e of evts) composer.on(e, refresh);
    return () => {
      for (const e of evts) composer.off(e, refresh);
    };
  }, [composer]);

  const slider = composer?.elements.getElement(elementId);
  if (!composer || !slider) return null;
  const slides = slider.getChildren();

  const addSlide = () =>
    runTxn(composer, "slide-add", () => {
      const last = slides[slides.length - 1];
      if (last) {
        composer.elements.duplicateElement(last.getId());
        return;
      }
      const slide = composer.elements.createElement("container", { classes: ["buildrick-slide"] });
      slide.addChild(composer.elements.createElement("heading", { content: "New slide", tagName: "h3" }));
      composer.elements.addElement(slide, slider.getId());
    });

  const dropOn = (target: Element) => {
    const id = dragId;
    setDragId(null);
    if (!id || id === target.getId()) return;
    runTxn(composer, "slide-move", () => {
      composer.elements.moveElement(id, slider.getId(), slider.getChildIndex(target));
    });
  };

  return (
    <Section title={`Slides · ${slides.length}`} icon="Images" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-slides">
      {slides.map((slide, i) => {
        const label = slideLabel(slide, i);
        return (
          <div
            key={slide.getId()}
            className={ROW}
            data-testid="slide-row"
            draggable
            onDragStart={(e) => {
              setDragId(slide.getId());
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              dropOn(slide);
            }}
          >
            <span aria-hidden="true" className="tw:cursor-grab tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">
              ⠿
            </span>
            <span
              aria-hidden="true"
              className="tw:h-6 tw:w-9 tw:flex-none tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-gray-200)]"
              style={slideThumb(slide)}
            />
            <span className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink)]">{label}</span>
            <SlideMenu
              label={label}
              onDuplicate={() => runTxn(composer, "slide-duplicate", () => composer.elements.duplicateElement(slide.getId()))}
              onDelete={() => runTxn(composer, "slide-delete", () => composer.elements.removeElement(slide.getId()))}
            />
          </div>
        );
      })}
      <Button
        type="button"
        color="alternative"
        size="xs"
        onClick={addSlide}
        className="tw:self-start tw:border-0 tw:bg-transparent tw:px-0 tw:text-[var(--bk-accent)] tw:hover:bg-transparent tw:hover:underline"
      >
        + Add slide
      </Button>
    </Section>
  );
};

/**
 * Content › Tabs (2L9 B4-C01 `245:36832`) on the Tabs model (B-21,
 * docs/design-2l9/engine-tabs.md):
 *
 *   Tabs                                   2 pairs
 *   Button and panel move together.
 *   [ Overview · Edit panel ]   (selects that pair's panel)
 *   [ Add tab ]
 *   Relationships · Overview  tab-01 → panel-01 …
 *   Stable IDs · no pairing by label or position.
 *   Opens first [Overview ▾]
 *   Tab actions · [ Move Details before Overview ]
 *
 * Every write is the model's own history step (a legacy block gets its keys
 * inside the first edit's step); the lock gate runs first.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { canWrite } from "@/engine/commands/commandOperations";
import { addTab, moveTab, readTabs, setInitialTab } from "@/engine/widgets/tabsModel";
import { Section, SelectRow } from "../shared/controls";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";
import { NoteRow } from "./behaviourRows";

/** The panel id the board writes beside a tab's key ("tab-01 → panel-01"). */
const panelKeyOf = (key: string): string => key.replace(/^tab-/, "panel-");

export function TabsSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    composer.on(EVENTS.ELEMENT_UPDATED, bump);
    composer.on(EVENTS.PROJECT_CHANGED, bump);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, bump);
      composer.off(EVENTS.PROJECT_CHANGED, bump);
    };
  }, [composer]);
  if (!composer) return null;
  const tabs = readTabs(composer, elementId);
  if (!tabs) return null;
  const { pairs } = tabs;
  const writable = () => canWrite(composer, elementId);
  const initial = tabs.initial ?? pairs[0]?.key ?? "";

  return (
    <Section
      title="Tabs"
      isOpen={isOpen}
      onToggle={onToggle}
      action={<span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="tabs-pair-count">{pairs.length === 1 ? "1 pair" : `${pairs.length} pairs`}</span>}
    >
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-tabs-section">
        <NoteRow>Button and panel move together.</NoteRow>
        {pairs.map((p) => (
          <Button
            key={p.key}
            color="light"
            size="xs"
            className={WIDE_BUTTON}
            onClick={() => {
              const panel = composer.elements.getElement(p.panelId);
              if (panel) composer.selection.select(panel);
            }}
            data-testid={`tabs-edit-panel-${p.key}`}
          >
            {p.label || "Tab"} · Edit panel
          </Button>
        ))}
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => writable() && addTab(composer, elementId)} data-testid="tabs-add">
          Add tab
        </Button>
        <div className={`${GROUP_TITLE} tw:mb-1!`}>Relationships</div>
        {pairs.map((p) => (
          <div key={p.key} className="bdi-row-ctrl" data-testid={`tabs-pair-${p.key}`}>
            <span className="bdi-lb">{p.label || "Tab"}</span>
            <span className="bdi-row-content">
              <span className="tw:flex tw:h-7 tw:flex-1 tw:items-center tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-soft)]">
                {tabs.legacy ? "paired by position" : `${p.key} → ${panelKeyOf(p.key)}`}
              </span>
            </span>
          </div>
        ))}
        <NoteRow>
          {tabs.legacy ? "Paired by position until the first edit gives each pair a stable ID." : "Stable IDs · no pairing by label or position."}
        </NoteRow>
        <SelectRow
          label="Opens first"
          value={initial}
          placeholder={null}
          options={pairs.map((p) => ({ value: p.key, label: p.label || p.key }))}
          onChange={(key) => writable() && setInitialTab(composer, elementId, key)}
        />
        {pairs.length >= 2 ? (
          <>
            <div className={`${GROUP_TITLE} tw:mb-1!`}>Tab actions</div>
            <Button
              color="light"
              size="xs"
              className={WIDE_BUTTON}
              onClick={() => writable() && moveTab(composer, elementId, pairs[1].key, 0)}
              data-testid="tabs-move"
            >
              Move {pairs[1].label || "Tab 2"} before {pairs[0].label || "Tab 1"}
            </Button>
          </>
        ) : null}
      </div>
    </Section>
  );
}

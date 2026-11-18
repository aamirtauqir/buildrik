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
 *   Tab actions · [ Move Details before Overview ]
 *
 * A button with no confirmed panel (C02 `245:37366`) shows "Unlinked content
 * · Needs repair" instead, and "Repair relationships" chooses the pair
 * explicitly (C03 `245:37877`, `linkTabPair`); right after, the section reads
 * "{n} linked" with the repaired pair (C04 `245:38385`).
 *
 * Every write is the model's own history step (a legacy block gets its keys
 * inside the first edit's step); the lock gate runs first.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { Button, useToast } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { canWrite } from "@/engine/commands/commandOperations";
import { addTab, linkTabPair, moveTab, readTabs, setInitialTab } from "@/engine/widgets/tabsModel";
import { justAddedFrom, markJustAdded, useJustAdded } from "./justAddedField";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { Section, SelectRow } from "../shared/controls";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";
import { NoteRow } from "./behaviourRows";

/** The panel id the board writes beside a tab's key ("tab-01 → panel-01"). */
const panelKeyOf = (key: string): string => key.replace(/^tab-/, "panel-");

/** A read-only value in the row's control column (board: gray-filled field). */
function ValuePill({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <span className="bdi-row-content">
      <span
        data-testid={testId}
        className="tw:flex tw:h-7 tw:min-w-0 tw:flex-1 tw:items-center tw:truncate tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-soft)]"
      >
        {children}
      </span>
    </span>
  );
}

/** A panel's layer name, else its place among the block's panels ("Panel 2"). */
function panelName(composer: Composer, panelId: string): string {
  const el = composer.elements.getElement(panelId);
  if (!el) return "Panel";
  const named = getLayerName(el);
  if (named) return named;
  const panels = el.getParent()?.getChildren().filter((c) => c.getAttribute("role") === "tabpanel") ?? [];
  return `Panel ${panels.indexOf(el) + 1}`;
}

const tabLine = (label: string, key: string | null): string => (key ? `${label || "Tab"} · ${key}` : label || "Tab");

export function TabsSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  useTabsVersion(composer);
  const { addToast } = useToast();
  const [repair, setRepair] = React.useState<{ tabId: string; panelId: string } | null>(null);
  const justLinked = useJustAdded(composer, elementId, "tabs-linked");
  if (!composer) return null;
  const tabs = readTabs(composer, elementId);
  if (!tabs) return null;
  const { pairs, unpairedTabs, unpairedPanels } = tabs;
  const writable = () => canWrite(composer, elementId);
  const root = composer.elements.getElement(elementId);
  const rootName = root ? (getLayerName(root) ?? elementTypeLabel(root.getType())) : "Tabs";

  /* C03 — choose a pair explicitly: button and panel, never guessed. */
  if (repair) {
    const tabChoices = unpairedTabs.length ? unpairedTabs.map((t) => ({ id: t.tabId, label: tabLine(t.label, t.key) })) : pairs.map((p) => ({ id: p.tabId, label: tabLine(p.label, p.key) }));
    const panelChoices = unpairedPanels.map((x) => ({ id: x.panelId, label: x.key ? `${panelName(composer, x.panelId)} · ${panelKeyOf(x.key)}` : panelName(composer, x.panelId) }));
    const tabLabel = tabChoices.find((t) => t.id === repair.tabId)?.label.split(" · ")[0] ?? "Tab";
    const link = () => {
      if (!repair.tabId || !repair.panelId || !writable()) return;
      if (!linkTabPair(composer, elementId, repair.tabId, repair.panelId)) return;
      const undo = composer.history.captureUndo();
      markJustAdded(composer, elementId, "tabs-linked", repair.tabId);
      setRepair(null);
      addToast({ description: `${tabLabel} linked to ${panelName(composer, repair.panelId)}.`, action: { label: "Undo", onClick: undo } });
    };
    return (
      <Section title="Repair relationships" stateTitle="Repair relationships" isOpen={isOpen} onToggle={onToggle}>
        <div className="tw:flex tw:flex-col tw:gap-2" data-testid="tabs-repair">
          <SelectRow
            label="Tab button"
            value={repair.tabId}
            placeholder="Choose a button"
            options={tabChoices.map((t) => ({ value: t.id, label: t.label }))}
            onChange={(id) => setRepair({ ...repair, tabId: id })}
          />
          <SelectRow
            label="Panel"
            value={repair.panelId}
            placeholder="Choose a panel"
            options={panelChoices.map((x) => ({ value: x.id, label: x.label }))}
            onChange={(id) => setRepair({ ...repair, panelId: id })}
          />
          <NoteRow>Both belong to {rootName}. This panel is not paired elsewhere.</NoteRow>
          <Button size="xs" className={`${WIDE_BUTTON} tw:text-white!`} disabled={!repair.tabId || !repair.panelId} onClick={link} data-testid="tabs-link-pair">
            Link selected pair
          </Button>
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => setRepair(null)} data-testid="tabs-repair-cancel">
            Cancel
          </Button>
          <NoteRow>One Undo restores the previous IDs and relationships.</NoteRow>
        </div>
      </Section>
    );
  }

  /* C02 — a button with no confirmed panel (or a panel no button opens):
     both stay in the document; pair actions wait for an explicit repair. */
  if (unpairedTabs.length || unpairedPanels.length) {
    const tab = unpairedTabs[0];
    const panel = unpairedPanels[0];
    return (
      <Section
        title="Unlinked content"
        stateTitle="Unlinked content"
        isOpen={isOpen}
        onToggle={onToggle}
        action={<span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">Needs repair</span>}
      >
        <div className="tw:flex tw:flex-col tw:gap-2" data-testid="tabs-unlinked">
          <NoteRow>
            {tab ? `${tab.label || "A tab"} has no confirmed panel.` : `${panelName(composer, panel!.panelId)} is not opened by any tab.`} Both nodes are preserved.
          </NoteRow>
          <div className="bdi-row-ctrl">
            <span className="bdi-lb">Button</span>
            <ValuePill testId="tabs-unlinked-button">{tab ? tabLine(tab.label, tab.key) : "Not linked"}</ValuePill>
          </div>
          <div className="bdi-row-ctrl">
            <span className="bdi-lb">Panel</span>
            <ValuePill testId="tabs-unlinked-panel">{tab ? "Not linked" : panelName(composer, panel!.panelId)}</ValuePill>
          </div>
          <Button
            size="xs"
            className={`${WIDE_BUTTON} tw:text-white!`}
            onClick={() => setRepair({ tabId: tab?.tabId ?? "", panelId: unpairedPanels.length === 1 ? unpairedPanels[0].panelId : "" })}
            data-testid="tabs-repair-open"
          >
            Repair relationships
          </Button>
          <NoteRow>Pair actions are unavailable until you choose a valid panel. Styling remains available.</NoteRow>
        </div>
      </Section>
    );
  }

  /* C04 — right after a repair: the pairs, and the one just linked. */
  const linked = justLinked ? pairs.filter((p) => p.tabId === justAddedFrom(composer, elementId, "tabs-linked")) : [];

  return (
    <Section
      title="Tabs"
      isOpen={isOpen}
      onToggle={onToggle}
      action={
        <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="tabs-pair-count">
          {justLinked ? `${pairs.length} linked` : pairs.length === 1 ? "1 pair" : `${pairs.length} pairs`}
        </span>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-tabs-section">
        {justLinked ? null : <NoteRow>Button and panel move together.</NoteRow>}
        {pairs.map((p) => (
          <Button
            key={p.key}
            color="light"
            size="xs"
            className={WIDE_BUTTON}
            onClick={() => {
              const panel = composer.elements.getElement(p.panelId);
              if (!panel) return;
              composer.selection.select(panel);
              /* C05: the panel opens on Content › Editing panel, not on a
                 container's default tab. After the selection settles. */
              setTimeout(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "tab-panel" }), 0);
            }}
            data-testid={`tabs-edit-panel-${p.key}`}
          >
            {p.label || "Tab"} · Edit panel
          </Button>
        ))}
        {justLinked ? null : (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => writable() && addTab(composer, elementId)} data-testid="tabs-add">
            Add tab
          </Button>
        )}
        <div className={`${GROUP_TITLE} tw:mb-1!`}>Relationships</div>
        {(justLinked ? linked : pairs).map((p) => (
          <div key={p.key} className="bdi-row-ctrl" data-testid={`tabs-pair-${p.key}`}>
            <span className="bdi-lb">{p.label || "Tab"}</span>
            <ValuePill>{tabs.legacy ? "paired by position" : `${p.key} → ${panelKeyOf(p.key)}`}</ValuePill>
          </div>
        ))}
        <NoteRow>
          {justLinked
            ? "aria-controls and aria-labelledby reference the chosen pair."
            : tabs.legacy
              ? "Paired by position until the first edit gives each pair a stable ID."
              : "Stable IDs · no pairing by label or position."}
        </NoteRow>
        {pairs.length >= 2 && !justLinked ? (
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

/** The Tabs root an element belongs to: itself, or the root of the panel / tab it is. */
function tabsRootOf(composer: Composer, elementId: string): string | null {
  for (let el = composer.elements.getElement(elementId) ?? null; el; el = el.getParent?.() ?? null) if (el.getType() === "tabs") return el.getId();
  return null;
}

function useTabsVersion(composer: Composer | null | undefined): void {
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
}

/**
 * Behavior › Tabs on the root (2L9 B4-C06 `245:39392`): Initial tab — the
 * authored pair visitors start on — and how visitors operate it.
 */
export function TabsBehaviorSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  useTabsVersion(composer);
  if (!composer) return null;
  const tabs = readTabs(composer, elementId);
  if (!tabs) return null;
  const initial = tabs.initial ?? tabs.pairs[0]?.key ?? "";
  return (
    <Section title="Tabs" isOpen={isOpen} onToggle={onToggle}>
      <div className="tw:flex tw:flex-col tw:gap-1" data-testid="inspector-tabs-behavior">
        <SelectRow
          label="Initial tab"
          value={initial}
          placeholder={null}
          options={tabs.pairs.map((p) => ({ value: p.key, label: p.label || p.key }))}
          onChange={(key) => canWrite(composer, elementId) && setInitialTab(composer, elementId, key)}
        />
        <NoteRow>Initial tab is authored. Inspecting a panel does not change it.</NoteRow>
        <NoteRow>Arrow keys, Home and End move focus. Enter or Space activates.</NoteRow>
        <Button
          color="light"
          size="xs"
          className={WIDE_BUTTON}
          onClick={() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "tabs-pairs" })}
          data-testid="tabs-back-to-content"
        >
          Back to paired content
        </Button>
      </div>
    </Section>
  );
}

/**
 * Content › Editing panel on a Tabs panel (2L9 B4-C05 `245:38888`): the
 * canvas shows it while selected (editor only — the runtime reveals the
 * panel that holds the selection); visitors start on the initial pair.
 */
export function TabPanelSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  useTabsVersion(composer);
  if (!composer) return null;
  const rootId = tabsRootOf(composer, elementId);
  const tabs = rootId ? readTabs(composer, rootId) : null;
  const pair = tabs?.pairs.find((p) => p.panelId === elementId);
  if (!rootId || !tabs || !pair) return null;
  const root = composer.elements.getElement(rootId);
  const first = tabs.pairs.find((p) => p.key === (tabs.initial ?? tabs.pairs[0]?.key));
  const rootName = root ? (getLayerName(root) ?? elementTypeLabel(root.getType())) : "Tabs";
  return (
    <Section title="Editing panel" isOpen={isOpen} onToggle={onToggle}>
      <div className="tw:flex tw:flex-col tw:gap-1" data-testid="inspector-tab-panel">
        <NoteRow>Shown in editor only. Visitors still start on {first?.label || "the first tab"}.</NoteRow>
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => root && composer.selection.select(root)} data-testid="tab-panel-back">
          Back to {rootName}
        </Button>
        <div className={`${GROUP_TITLE} tw:mb-1!`}>Native attributes</div>
        <div className="bdi-row-ctrl">
          <span className="bdi-lb">ID</span>
          <span className="bdi-row-content tw:text-[12px] tw:text-[var(--bk-ink-soft)]">{tabs.legacy ? "assigned on first edit" : panelKeyOf(pair.key)}</span>
        </div>
        <div className="bdi-row-ctrl">
          <span className="bdi-lb">Labelled by</span>
          <span className="bdi-row-content tw:text-[12px] tw:text-[var(--bk-ink-soft)]">{tabs.legacy ? "its tab, by position" : pair.key}</span>
        </div>
        <NoteRow>Panel content keeps its own IDs, styles and bindings.</NoteRow>
      </div>
    </Section>
  );
}

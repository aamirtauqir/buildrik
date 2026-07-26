/**
 * IntegrationsHub — stacks Analytics + Integrations + Advanced into a single
 * "Integrations" screen per docs/reference/left-panel/tab-settings.html
 * spec. Backend data models untouched; each child still owns its own fields
 * and save path.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import { AnalyticsScreen } from "./AnalyticsScreen";
import { IntegrationsScreen } from "./IntegrationsScreen";
import { AdvancedScreen } from "./AdvancedScreen";

interface Props {
  composer?: Composer | null;
  onDirtyChange?: (dirty: boolean) => void;
  /** Parent (SettingsTab) flush slot — single-handler. We multiplex both
   *  children's flushes into one combined handler so neither clobbers the
   *  other (the parent ref holds only one). */
  registerFlushHandler?: (handler: (() => void) | null) => void;
}

const subHeaderStyle: React.CSSProperties = {
  padding: "20px 20px 8px",
  fontFamily: "var(--bk-font-ui)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--bk-ink-muted)",
  borderTop: "1px solid var(--bk-border)",
  marginTop: 16,
};

export const IntegrationsHub: React.FC<Props> = ({ composer, onDirtyChange, registerFlushHandler }) => {
  // Bubble up dirty state from either child. Track both, OR together.
  const [analyticsDirty, setAnalyticsDirty] = React.useState(false);
  const [advancedDirty, setAdvancedDirty] = React.useState(false);

  React.useEffect(() => {
    onDirtyChange?.(analyticsDirty || advancedDirty);
  }, [analyticsDirty, advancedDirty, onDirtyChange]);

  // Each child registers its flush into a local slot; we register a single
  // combined flush with the parent so the savebar persists BOTH analytics
  // (GA/pixel) and advanced (head/body code) edits. Without this, edits made
  // on the Integrations screen flushed nothing and were dropped on save.
  const analyticsFlushRef = React.useRef<(() => void) | null>(null);
  const advancedFlushRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    if (!registerFlushHandler) return;
    registerFlushHandler(() => {
      analyticsFlushRef.current?.();
      advancedFlushRef.current?.();
    });
    return () => registerFlushHandler(null);
  }, [registerFlushHandler]);

  return (
    <div>
      <AnalyticsScreen
        composer={composer}
        onDirtyChange={setAnalyticsDirty}
        registerFlushHandler={(h) => { analyticsFlushRef.current = h; }}
      />
      <div style={subHeaderStyle}>Integrations</div>
      <IntegrationsScreen />
      <div style={subHeaderStyle}>Advanced</div>
      <AdvancedScreen
        composer={composer}
        onDirtyChange={setAdvancedDirty}
        registerFlushHandler={(h) => { advancedFlushRef.current = h; }}
      />
    </div>
  );
};

export default IntegrationsHub;

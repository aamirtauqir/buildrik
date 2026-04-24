/**
 * IntegrationsHub — stacks Analytics + Integrations + Advanced into a single
 * "Integrations" screen per packages/editor/project/left-panel/tab-settings.html
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
}

const subHeaderStyle: React.CSSProperties = {
  padding: "20px 20px 8px",
  fontFamily: "var(--bd-font)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--bd-fg-muted)",
  borderTop: "1px solid var(--bd-border)",
  marginTop: 16,
};

export const IntegrationsHub: React.FC<Props> = ({ composer, onDirtyChange }) => {
  // Bubble up dirty state from either child. Track both, OR together.
  const [analyticsDirty, setAnalyticsDirty] = React.useState(false);
  const [advancedDirty, setAdvancedDirty] = React.useState(false);

  React.useEffect(() => {
    onDirtyChange?.(analyticsDirty || advancedDirty);
  }, [analyticsDirty, advancedDirty, onDirtyChange]);

  return (
    <div>
      <AnalyticsScreen composer={composer} onDirtyChange={setAnalyticsDirty} />
      <div style={subHeaderStyle}>Integrations</div>
      <IntegrationsScreen />
      <div style={subHeaderStyle}>Advanced</div>
      <AdvancedScreen composer={composer} onDirtyChange={setAdvancedDirty} />
    </div>
  );
};

export default IntegrationsHub;

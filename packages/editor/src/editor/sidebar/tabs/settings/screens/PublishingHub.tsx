/**
 * PublishingHub — stacks Domains + Export into a single "Publishing" screen
 * per new-design/project/left-panel/tab-settings.html spec.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import { DomainsScreen } from "./DomainsScreen";
import { ExportScreen } from "./ExportScreen";

interface Props {
  composer?: Composer | null;
}

const subHeaderStyle: React.CSSProperties = {
  padding: "20px 20px 8px",
  fontFamily: "var(--buildrick-font-family)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--buildrick-text-muted)",
  borderTop: "1px solid var(--buildrick-border)",
  marginTop: 16,
};

export const PublishingHub: React.FC<Props> = ({ composer }) => (
  <div>
    <DomainsScreen />
    <div style={subHeaderStyle}>Export</div>
    <ExportScreen composer={composer} />
  </div>
);

export default PublishingHub;

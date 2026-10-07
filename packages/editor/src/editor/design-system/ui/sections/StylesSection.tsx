/**
 * StylesSection (Arc B1 T5) — Styles sub-tab shell.
 *
 * Two-pane layout per prototype s03: left preset-category list +
 * right detail pane. All shape lives in StylesRouter; this file is
 * just the mount point.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { StylesRouter } from "./StylesRouter";

export const StylesSection: React.FC = () => (
  <div data-styles-section style={{ height: "100%", minHeight: 0 }}>
    <StylesRouter />
  </div>
);

/**
 * SkeletonStates — Per-tab skeleton loading states
 * Each skeleton matches the content shape of its tab.
 * Used as Suspense fallbacks in TabRouter and FullPageRouter.
 * Styles: SkeletonStates.css (ls-* light theme tokens)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./SkeletonStates.css";

const Bar: React.FC<{ width?: string | number; height?: number; radius?: number; className?: string }> = ({
  width = "100%",
  height = 12,
  radius,
  className,
}) => (
  <div
    className={`skel-bar ${className || ""}`}
    style={{ width, height, ...(radius ? { borderRadius: radius } : {}) }}
  />
);

/** Add tab: header + search + card grid */
export const AddSkeleton: React.FC = () => (
  <div className="skel-container">
    <div className="skel-header"><Bar /></div>
    <div className="skel-search"><Bar /></div>
    <div className="skel-add-body">
      <Bar className="skel-label" />
      <div className="skel-grid">
        <Bar className="skel-card" />
        <Bar className="skel-card" />
      </div>
      <Bar className="skel-label" width={80} />
      <div className="skel-grid">
        <Bar className="skel-card" />
        <Bar className="skel-card" />
      </div>
    </div>
  </div>
);

/** Layers tab: header + tree rows */
export const LayersSkeleton: React.FC = () => (
  <div className="skel-container">
    <div className="skel-header"><Bar /></div>
    <div className="skel-tree">
      <div className="skel-row"><Bar width="40%" /><Bar width="30%" /></div>
      <div className="skel-tree-indent-1"><Bar width="50%" /></div>
      <div className="skel-tree-indent-2"><Bar width="35%" /></div>
      <div className="skel-tree-indent-2"><Bar width="45%" /></div>
      <div className="skel-tree-indent-1"><Bar width="55%" /></div>
      <div className="skel-row"><Bar width="40%" /><Bar width="20%" /></div>
      <div className="skel-tree-indent-1"><Bar width="30%" /></div>
    </div>
  </div>
);

/** Pages tab: header + page rows */
export const PagesSkeleton: React.FC = () => (
  <div className="skel-container">
    <div className="skel-header"><Bar /></div>
    <div className="skel-pages">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skel-row"><Bar width="60%" /><Bar width="25%" /></div>
      ))}
    </div>
  </div>
);

/** Media tab: header + search + upload zone + grid */
export const MediaSkeleton: React.FC = () => (
  <div className="skel-container">
    <div className="skel-header"><Bar /></div>
    <div className="skel-search"><Bar /></div>
    <div className="skel-media-body">
      <Bar className="skel-media-upload" />
      <div className="skel-media-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Bar key={i} className="skel-media-thumb" />
        ))}
      </div>
    </div>
  </div>
);

/** Components tab: header + search + rows */
export const ComponentsSkeleton: React.FC = () => (
  <div className="skel-container">
    <div className="skel-header"><Bar /></div>
    <div className="skel-search"><Bar /></div>
    <div className="skel-comps">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skel-row"><Bar width="50%" /><Bar width="15%" /></div>
      ))}
    </div>
  </div>
);

/** Templates tab: header + search + category pills + grid */
export const TemplatesSkeleton: React.FC = () => (
  <div className="skel-container">
    <div className="skel-tpl-header"><Bar /></div>
    <div className="skel-tpl-search"><Bar radius={6} /></div>
    <div className="skel-tpl-pills">
      {[1, 2, 3, 4, 5].map((i) => <Bar key={i} className="skel-tpl-pill" />)}
    </div>
    <div className="skel-tpl-grid">
      {[1, 2, 3, 4].map((i) => <Bar key={i} className="skel-tpl-card" />)}
    </div>
  </div>
);

/** Settings tab: sidebar nav + form rows */
export const SettingsSkeleton: React.FC = () => (
  <div className="skel-container">
    <div className="skel-settings">
      <div className="skel-settings-nav">
        {[1, 2, 3, 4, 5, 6].map((i) => <Bar key={i} width="80%" height={14} />)}
      </div>
      <div className="skel-settings-form">
        <Bar width={200} height={18} />
        <Bar height={36} radius={6} />
        <Bar height={36} radius={6} />
        <Bar width="60%" height={36} radius={6} />
      </div>
    </div>
  </div>
);

/** History tab: header + tab bar + table rows */
export const HistorySkeleton: React.FC = () => (
  <div className="skel-container">
    <div className="skel-hist-header"><Bar /></div>
    <div className="skel-hist-tabs">
      <Bar className="skel-hist-tab" />
      <Bar className="skel-hist-tab" />
    </div>
    <div className="skel-hist-rows">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skel-row">
          <Bar width="20%" /><Bar width="40%" /><Bar width="15%" /><Bar width="10%" />
        </div>
      ))}
    </div>
  </div>
);

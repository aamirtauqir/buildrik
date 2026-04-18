/**
 * ApplyProgressOverlay — shows while template apply animation runs.
 * Fires onComplete after a brief delay so the UI has time to settle.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import "./ApplyProgressOverlay.css";

export interface ApplyProgressOverlayProps {
  templateName: string;
  onComplete: () => void;
  onCancel?: () => void;
  onError?: (err: Error) => void;
}

const APPLY_DELAY = 1200; // ms before firing onComplete

export const ApplyProgressOverlay: React.FC<ApplyProgressOverlayProps> = ({
  templateName,
  onComplete,
  onCancel,
  onError,
}) => {
  const onCompleteRef = React.useRef(onComplete);
  React.useLayoutEffect(() => { onCompleteRef.current = onComplete; });

  React.useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current(), APPLY_DELAY);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!onError) return;
    const timer = setTimeout(() => onError(new Error("Apply timed out")), 15000);
    return () => clearTimeout(timer);
  }, [onError]);

  return createPortal(
    <div className="tmpl-progress" role="status" aria-label="Applying template">
      <div className="tmpl-progress__inner">
        <h3 className="tmpl-progress__title">Applying {templateName}...</h3>
        <div className="tmpl-progress__bar">
          <div className="tmpl-progress__fill tmpl-progress__fill--indeterminate" />
        </div>
        <span className="tmpl-progress__spinner" style={{ display: "block", margin: "8px auto 0" }} />
        {onCancel && (
          <button className="tmpl-progress__cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ApplyProgressOverlay;

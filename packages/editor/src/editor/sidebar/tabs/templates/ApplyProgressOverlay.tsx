import { Button } from "@/shared/ui/Button";
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
        <span className="tmpl-progress__spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
        {onCancel && (
          <Button className="tmpl-progress__cancel" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ApplyProgressOverlay;

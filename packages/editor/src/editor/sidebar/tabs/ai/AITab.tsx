import * as React from "react";
import type { Composer } from "../../../../engine";
import "./AITab.css";

export interface AITabProps {
  composer: Composer | null;
  isPinned: boolean;
  onPinToggle: () => void;
  onHelpClick: () => void;
  onClose: () => void;
}

export const AITab: React.FC<AITabProps> = () => {
  return (
    <div className="bd-ai-tab" role="region" aria-label="AI assistant">
      <div className="bd-ai-thread">
        <p className="bd-ai-empty">Try a quick action or type a prompt to start.</p>
      </div>
      <div className="bd-ai-composer">
        <textarea
          className="bd-ai-composer-input"
          placeholder="Ask Claude…"
          aria-label="Prompt"
        />
      </div>
    </div>
  );
};

export default AITab;

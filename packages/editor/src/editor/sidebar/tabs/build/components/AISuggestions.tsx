/**
 * AISuggestions — AI suggestion cards in the Add tab
 * Blue-tinted section with sparkle icon, 2 suggestion cards.
 * Collapsible/dismissable per session.
 * Styles: AISuggestions.css (ls-* light theme tokens)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Sparkles, Wand2, Layout } from "lucide-react";
import "./AISuggestions.css";

export interface AISuggestionsProps {
  /** Whether AI features are enabled for this project */
  enabled?: boolean;
  /** Callback when user clicks a suggestion */
  onSuggestionClick?: (type: string) => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  enabled = true,
  onSuggestionClick,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (!enabled || dismissed) return null;

  return (
    <div className="ai-sug-container">
      <div className="ai-sug-header">
        <Sparkles size={14} className="ai-sug-header-icon" />
        <span className="ai-sug-header-text">AI can help</span>
        <button
          className="ai-sug-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss AI suggestions"
        >
          &times;
        </button>
      </div>
      <div className="ai-sug-cards">
        <button
          className="ai-sug-card"
          onClick={() => onSuggestionClick?.("generate-section")}
        >
          <Layout size={16} className="ai-sug-card-icon" />
          <div>
            <div className="ai-sug-card-title">Generate a section</div>
            <div className="ai-sug-card-desc">Describe what you need</div>
          </div>
        </button>
        <button
          className="ai-sug-card"
          onClick={() => onSuggestionClick?.("improve-layout")}
        >
          <Wand2 size={16} className="ai-sug-card-icon" />
          <div>
            <div className="ai-sug-card-title">Improve layout</div>
            <div className="ai-sug-card-desc">AI-powered suggestions</div>
          </div>
        </button>
      </div>
    </div>
  );
};

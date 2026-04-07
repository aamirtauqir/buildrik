/**
 * Layout Suggestions Panel
 * Displays AI-powered layout analysis and suggestions
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { LayoutSuggestion, LayoutAnalysisResult } from "../engine/ai";
import { Button, Badge } from "../shared/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface LayoutSuggestionsProps {
  analysis: LayoutAnalysisResult | null;
  onAnalyze: () => void;
  onSelectElement?: (elementId: string) => void;
  loading?: boolean;
}

// ============================================================================
// SCORE CIRCLE
// ============================================================================

const ScoreCircle: React.FC<{ score: number; label: string }> = ({ score, label }) => {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const circumference = 2 * Math.PI * 18;
  const progress = (score / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r="18" fill="none" stroke="var(--aqb-border)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          marginTop: -36,
          fontSize: 14,
          fontWeight: 600,
          color,
        }}
      >
        {score}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "var(--aqb-text-muted)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ============================================================================
// SUGGESTION ITEM
// ============================================================================

const SuggestionItem: React.FC<{
  suggestion: LayoutSuggestion;
  onSelect?: () => void;
}> = ({ suggestion, onSelect }) => {
  const severityColors = {
    error: { bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", icon: "🔴" },
    warning: { bg: "rgba(234, 179, 8, 0.1)", border: "#eab308", icon: "🟡" },
    info: { bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6", icon: "🔵" },
  };

  const colors = severityColors[suggestion.severity];

  return (
    <div
      style={{
        padding: 12,
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: 4,
        marginBottom: 8,
        cursor: suggestion.elementIds.length > 0 ? "pointer" : "default",
      }}
      onClick={onSelect}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{colors.icon}</span>
        <span style={{ fontWeight: 500, fontSize: 13 }}>{suggestion.title}</span>
        <Badge variant="default" size="sm">
          {suggestion.type}
        </Badge>
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 12,
          color: "var(--aqb-text-muted)",
        }}
      >
        {suggestion.description}
      </div>
      {suggestion.fix && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            suggestion.fix?.();
          }}
          style={{ marginTop: 8 }}
        >
          ✨ Quick Fix
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LayoutSuggestions: React.FC<LayoutSuggestionsProps> = ({
  analysis,
  onAnalyze,
  onSelectElement,
  loading = false,
}) => {
  if (!analysis) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ marginBottom: 16, color: "var(--aqb-text-muted)" }}>
          Analyze your layout to get AI-powered suggestions for improving spacing, alignment,
          contrast, and accessibility.
        </div>
        <Button onClick={onAnalyze} loading={loading}>
          🧠 Analyze Layout
        </Button>
      </div>
    );
  }

  const { suggestions, score, summary } = analysis;

  return (
    <div style={{ padding: 16 }}>
      {/* Score Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
          padding: 16,
          background: "var(--aqb-bg-panel-secondary)",
          borderRadius: 8,
        }}
      >
        <ScoreCircle score={summary.spacing} label="Spacing" />
        <ScoreCircle score={summary.alignment} label="Alignment" />
        <ScoreCircle score={summary.contrast} label="Contrast" />
        <ScoreCircle score={summary.accessibility} label="A11y" />
      </div>

      {/* Overall Score */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{score}</span>
          <span style={{ color: "var(--aqb-text-muted)" }}>/ 100</span>
          <span style={{ fontSize: 18 }}>{score >= 80 ? "✨" : score >= 60 ? "👍" : "⚠️"}</span>
        </div>
        <Button size="sm" variant="secondary" onClick={onAnalyze}>
          🔄 Re-analyze
        </Button>
      </div>

      {/* Suggestions List */}
      {suggestions.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            background: "rgba(34, 197, 94, 0.1)",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ color: "#22c55e", fontWeight: 500 }}>Perfect! No issues found.</div>
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--aqb-text-muted)",
              marginBottom: 12,
            }}
          >
            {suggestions.length} Suggestion{suggestions.length !== 1 ? "s" : ""}
          </div>
          {suggestions.map((s) => (
            <SuggestionItem
              key={s.id}
              suggestion={s}
              onSelect={
                s.elementIds.length > 0 && onSelectElement
                  ? () => onSelectElement(s.elementIds[0])
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LayoutSuggestions;

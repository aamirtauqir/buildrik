/**
 * Aquibra AI Assistant
 * AI-powered content and design generation
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../engine";
import { LayoutAnalyzer } from "../engine/ai";
import { TextareaField, SelectField } from "../shared/forms";
import { Modal, Button, Tabs } from "../shared/ui";
import {
  generateContent,
  generateLayout,
  generateImagePrompt,
  type ContentType,
  type ToneType,
} from "../shared/utils/openai";
import { AccessibilityChecker } from "./AccessibilityChecker";
import { ColorPalette } from "./ColorPalette";
import { GeneratedResult } from "./GeneratedResult";
import { LayoutSuggestions } from "./LayoutSuggestions";
import { LoadingIndicator } from "./LoadingIndicator";
import { getQuickPrompts, contentTypeOptions, toneOptions } from "./quickPrompts";

export interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (result: AIGenerationResult) => void;
  apiKey?: string;
  contextLabel?: string;
  composer?: Composer | null;
  onSelectElement?: (elementId: string) => void;
}

export interface AIGenerationResult {
  type: "text" | "html" | "image" | "layout";
  content: string;
  metadata?: Record<string, unknown>;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  onGenerate,
  apiKey: _apiKey,
  contextLabel,
  composer,
  onSelectElement,
}) => {
  const [activeTab, setActiveTab] = React.useState("content");
  const [layoutAnalysis, setLayoutAnalysis] = React.useState<ReturnType<
    LayoutAnalyzer["analyze"]
  > | null>(null);
  const [analyzingLayout, setAnalyzingLayout] = React.useState(false);

  const handleAnalyzeLayout = React.useCallback(() => {
    if (!composer) return;
    setAnalyzingLayout(true);
    try {
      const analyzer = new LayoutAnalyzer(composer);
      const result = analyzer.analyze();
      setLayoutAnalysis(result);
    } finally {
      setAnalyzingLayout(false);
    }
  }, [composer]);

  const handleApplyColor = React.useCallback(
    (color: string) => {
      onGenerate({
        type: "text",
        content: color,
        metadata: { colorApplied: true },
      });
    },
    [onGenerate]
  );
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [contentType, setContentType] = React.useState<ContentType>("paragraph");
  const [tone, setTone] = React.useState<ToneType>("professional");

  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let generatedContent = "";

      if (activeTab === "content") {
        generatedContent = await generateContent(prompt, contentType, tone);
      } else if (activeTab === "layout") {
        generatedContent = await generateLayout(prompt);
      } else if (activeTab === "image") {
        generatedContent = await generateImagePrompt(prompt);
      }

      setResult(generatedContent);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate content";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!result) return;

    onGenerate({
      type: activeTab === "image" ? "image" : activeTab === "layout" ? "html" : "text",
      content: result,
    });

    onClose();
    setPrompt("");
    setResult(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✨ AI Assistant" size="lg">
      {contextLabel && (
        <div
          style={{
            padding: "8px 0 0",
            color: "var(--aqb-text-muted)",
            fontSize: 12,
          }}
        >
          Target: {contextLabel}
        </div>
      )}
      <Tabs
        tabs={[
          { id: "content", label: "📝 Content" },
          { id: "layout", label: "🎨 Layout" },
          { id: "image", label: "🖼️ Image" },
          { id: "analyze", label: "🔍 Analyze" },
          { id: "colors", label: "🎨 Colors" },
          { id: "a11y", label: "♿ A11y" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div style={{ marginTop: 20 }}>
        {activeTab === "content" && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <SelectField
              label="Content Type"
              value={contentType}
              onChange={(value) => setContentType(value as ContentType)}
              options={contentTypeOptions}
            />
            <SelectField
              label="Tone"
              value={tone}
              onChange={(value) => setTone(value as ToneType)}
              options={toneOptions}
            />
          </div>
        )}

        <TextareaField
          label={
            activeTab === "image" ? "Describe the image you want" : "What would you like to create?"
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            activeTab === "content"
              ? "Write a compelling headline for a SaaS product..."
              : activeTab === "layout"
                ? "Create a hero section with a headline, subtitle, and CTA button..."
                : "A modern office with natural lighting and plants..."
          }
          rows={4}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Button onClick={handleGenerate} loading={loading} disabled={!prompt.trim()}>
            ✨ Generate
          </Button>
          {result && (
            <Button
              variant="ghost"
              onClick={() => {
                setResult(null);
                setPrompt("");
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Error */}
        {error && !loading && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 8,
              color: "#ef4444",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {loading && <LoadingIndicator />}

        {result && !loading && (
          <GeneratedResult
            result={result}
            isImage={activeTab === "image"}
            onInsert={handleInsert}
            onRegenerate={handleGenerate}
          />
        )}

        {/* AI Analysis Tabs */}
        {activeTab === "analyze" && (
          <LayoutSuggestions
            analysis={layoutAnalysis}
            onAnalyze={handleAnalyzeLayout}
            onSelectElement={onSelectElement}
            loading={analyzingLayout}
          />
        )}

        {activeTab === "colors" && <ColorPalette onApplyColor={handleApplyColor} />}

        {activeTab === "a11y" && (
          <AccessibilityChecker composer={composer ?? null} onSelectElement={onSelectElement} />
        )}
      </div>

      {/* Quick Prompts - only for generation tabs */}
      {(activeTab === "content" || activeTab === "layout" || activeTab === "image") && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid var(--aqb-border)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--aqb-text-muted)",
              marginBottom: 8,
            }}
          >
            Quick prompts:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {getQuickPrompts(activeTab).map((qp, i) => (
              <button
                key={i}
                onClick={() => setPrompt(qp)}
                style={{
                  padding: "6px 12px",
                  background: "var(--aqb-bg-panel-secondary)",
                  border: "none",
                  borderRadius: 16,
                  color: "var(--aqb-text-secondary)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {qp}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AIAssistant;

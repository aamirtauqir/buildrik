/**
 * Theme section component for Design System
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "../../../../editor/inspector/shared/controls/Section";
import {
  tokenGridStyles,
  themeModeRowStyles,
  themeModeButtonStyles,
  activeThemeModeStyles,
  themePreviewRowStyles,
  previewButtonStyles,
  aiSectionStyles,
  uploadImageBtnStyles,
  orDividerStyles,
  aiInputStyles,
  generateBtnStyles,
  exportRowStyles,
  exportBtnStyles,
} from "./styles";
import type { ThemeMode } from "./types";

interface ThemeSectionProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  systemTheme: "light" | "dark";
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  onGeneratePalette: () => void;
  onExport: (format: "css" | "tailwind" | "json") => void;
}

export const ThemeSection: React.FC<ThemeSectionProps> = ({
  themeMode,
  onThemeModeChange,
  systemTheme,
  aiPrompt,
  onAiPromptChange,
  onGeneratePalette,
  onExport,
}) => (
  <div style={tokenGridStyles}>
    <Section title="Theme Mode" icon="🌓" defaultOpen={true}>
      <div style={themeModeRowStyles}>
        {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onThemeModeChange(mode)}
            style={{
              ...themeModeButtonStyles,
              ...(themeMode === mode ? activeThemeModeStyles : {}),
            }}
          >
            {mode === "light" && "☀️"} {mode === "dark" && "🌙"} {mode === "system" && "💻"}
            <span style={{ marginLeft: 6 }}>
              {mode === "system"
                ? `System (${systemTheme})`
                : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </span>
          </button>
        ))}
      </div>
      <div style={themePreviewRowStyles}>
        <button style={previewButtonStyles}>Preview Light</button>
        <button style={previewButtonStyles}>Preview Dark</button>
      </div>
    </Section>

    <Section title="AI Palette" icon="✨" defaultOpen={false}>
      <div style={aiSectionStyles}>
        <button style={uploadImageBtnStyles}>📷 Upload Image</button>
        <div style={orDividerStyles}>or describe your brand</div>
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => onAiPromptChange(e.target.value)}
          placeholder="e.g., Modern tech startup, energetic..."
          style={aiInputStyles}
        />
        <button onClick={onGeneratePalette} style={generateBtnStyles}>
          ✨ Generate Palette
        </button>
      </div>
    </Section>

    <Section title="Export Styles" icon="📤" defaultOpen={false}>
      <div style={exportRowStyles}>
        <button onClick={() => onExport("css")} style={exportBtnStyles}>
          CSS Variables
        </button>
        <button onClick={() => onExport("tailwind")} style={exportBtnStyles}>
          Tailwind
        </button>
        <button onClick={() => onExport("json")} style={exportBtnStyles}>
          JSON
        </button>
      </div>
    </Section>
  </div>
);

/**
 * Version History screen — L1: helpful empty state + save integration
 * Real version history API not yet available; shows save-triggered entries.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "../../../../../shared/ui/Button";
import { useToast } from "../../../../../shared/ui/Toast";
import { Section } from "../shared";
import {
  screenStyles,
  versionActionsStyles,
  versionRowStyles,
  versionDateStyles,
  versionDescStyles,
  versionAuthorStyles,
} from "../styles";
import type { ScreenProps } from "../types";

interface VersionEntry {
  id: string;
  date: string;
  description: string;
  author: string;
}

const STORAGE_KEY = "aqb-version-history";

function loadVersions(): VersionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVersions(entries: VersionEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 20)));
  } catch {
    // localStorage full — silently drop
  }
}

export const VersionHistoryScreen: React.FC<ScreenProps> = ({ composer }) => {
  const { addToast } = useToast();
  const [versions, setVersions] = React.useState<VersionEntry[]>(loadVersions);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleCreateSnapshot = async () => {
    if (!composer || isSaving) return;
    setIsSaving(true);
    try {
      await composer.saveProject();
      const entry: VersionEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        description: "Manual snapshot",
        author: "You",
      };
      const updated = [entry, ...versions];
      setVersions(updated);
      saveVersions(updated);
      addToast({ message: "Snapshot saved", variant: "success", duration: 3000 });
    } catch {
      addToast({ message: "Failed to save snapshot", variant: "error", duration: 4000 });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={screenStyles}>
      <div style={versionActionsStyles}>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreateSnapshot}
          loading={isSaving}
          disabled={!composer || isSaving}
        >
          Save Snapshot
        </Button>
      </div>

      {versions.length === 0 ? (
        <div style={emptyStateStyles}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>&#128196;</div>
          <div style={emptyTitleStyles}>No versions yet</div>
          <div style={emptyDescStyles}>
            Snapshots let you track changes over time. Click "Save Snapshot" to create your first
            version.
          </div>
        </div>
      ) : (
        <Section title="Saved Versions">
          {versions.map((v) => (
            <div key={v.id} style={versionRowStyles}>
              <div style={{ flex: 1 }}>
                <div style={versionDateStyles}>{v.date}</div>
                <div style={versionDescStyles}>{v.description}</div>
                <div style={versionAuthorStyles}>by {v.author}</div>
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
};

const emptyStateStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 16px",
  textAlign: "center",
};

const emptyTitleStyles: React.CSSProperties = {
  fontSize: "var(--aqb-font-md)",
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
  marginBottom: 6,
};

const emptyDescStyles: React.CSSProperties = {
  fontSize: "var(--aqb-font-xs)",
  color: "var(--aqb-text-muted)",
  lineHeight: 1.4,
  maxWidth: 220,
};

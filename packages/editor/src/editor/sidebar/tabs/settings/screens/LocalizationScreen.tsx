/**
 * LocalizationScreen — site-level locale config.
 *
 * Per LOC: A,A decision in docs/plans/2026-05-08-localization-design-brief.md:
 *   - URL strategy: subdirectory `/fr/about` (enforced by Phase D middleware)
 *   - DB model: per-page `translations` JSON column (set per-block in Phase B)
 *
 * This screen owns site-level locale config:
 *   - defaultLocale (single value)
 *   - enabledLocales (list, must contain defaultLocale)
 *
 * Per-block translation editing UI lives in the canvas inspector and ships
 * in Phase B. This screen is the on-ramp.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@/services/api-client";
import { Field, SCREEN_EMPTY, SCREEN_ERROR, Screen, Section, Select } from "../shared";
import type { ScreenProps } from "../types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Button } from "@/editor/chrome-ui";
let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

interface LocaleOption {
  code: string;
  label: string;
}

const COMMON_LOCALES: LocaleOption[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "sv", label: "Swedish" },
  { code: "da", label: "Danish" },
  { code: "no", label: "Norwegian" },
  { code: "fi", label: "Finnish" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "he", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "tr", label: "Turkish" },
  { code: "id", label: "Indonesian" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
];

function labelFor(code: string): string {
  return COMMON_LOCALES.find((l) => l.code === code)?.label ?? code.toUpperCase();
}

export const LocalizationScreen: React.FC<ScreenProps> = ({
  projectId,
  onDirtyChange,
  registerSaveHandler,
}) => {
  const [defaultLocale, setDefaultLocale] = React.useState("en");
  const [enabledLocales, setEnabledLocales] = React.useState<string[]>(["en"]);
  const [pickedAdd, setPickedAdd] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    getClient()
      .siteDetail.settings.get.query({ siteId: projectId })
      .then((s) => {
        const settings = s as { defaultLocale?: string; enabledLocales?: string[] };
        setDefaultLocale(settings.defaultLocale ?? "en");
        setEnabledLocales(settings.enabledLocales?.length ? settings.enabledLocales : ["en"]);
        setDirty(false);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load locales."))
      .finally(() => setLoading(false));
  }, [projectId]);

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const markDirty = () => setDirty(true);

  const handleAdd = () => {
    if (!pickedAdd || enabledLocales.includes(pickedAdd)) return;
    setEnabledLocales([...enabledLocales, pickedAdd]);
    setPickedAdd("");
    markDirty();
  };

  const handleRemove = (code: string) => {
    if (code === defaultLocale) {
      setSaveError("Cannot remove the default locale. Change the default first.");
      return;
    }
    if (enabledLocales.length <= 1) {
      setSaveError("At least one locale must remain enabled.");
      return;
    }
    setEnabledLocales(enabledLocales.filter((c) => c !== code));
    setSaveError(null);
    markDirty();
  };

  const handleSave = React.useCallback(async () => {
    if (!projectId || !dirty) return;
    setSaving(true);
    setSaveError(null);
    try {
      await getClient().siteDetail.settings.update.mutate({
        id: projectId,
        defaultLocale,
        enabledLocales,
      });
      setDirty(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save locales.";
      setSaveError(msg);
      // Re-throw so SettingsTab.handleSave keeps savebar visible.
      throw e;
    } finally {
      setSaving(false);
    }
  }, [projectId, dirty, defaultLocale, enabledLocales]);

  // Register with central savebar so its Save button writes locale fields
  // instead of falling back to composer.saveProject() (which omits them).
  React.useEffect(() => {
    if (!registerSaveHandler) return;
    registerSaveHandler(dirty ? handleSave : null);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, dirty, handleSave]);

  if (!projectId) {
    return (
      <Screen>
        <Section title="Localization">
          <div className={SCREEN_EMPTY}>Open this site from the dashboard to manage locales.</div>
        </Section>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <Section title="Localization">
          <div className={SCREEN_EMPTY}>Loading…</div>
        </Section>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <Section title="Localization">
          <div role="alert" className={SCREEN_ERROR}>{loadError}</div>
        </Section>
      </Screen>
    );
  }

  // Locales not yet enabled (offered in the add dropdown).
  const addable = COMMON_LOCALES.filter((l) => !enabledLocales.includes(l.code));

  return (
    <Screen>
      <Section
        title="Default locale"
        desc="The fallback for content not translated into the visitor's locale. URL strategy: subdirectory (e.g. /fr/about). The default locale serves at the root path (/about) without a prefix."
      >
        <Field label="Default">
          <Select
            value={defaultLocale}
            onChange={(e) => {
              setDefaultLocale(e.target.value);
              markDirty();
            }}
            disabled={saving}
          >
            {enabledLocales.map((code) => (
              <option key={code} value={code}>
                {code} — {labelFor(code)}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section
        title={`Enabled locales (${enabledLocales.length})`}
        desc="Locales available to visitors. Each enabled non-default locale serves under its own path prefix (e.g. /fr/, /de/)."
      >
        <ul style={listStyles}>
          {enabledLocales.map((code) => {
            const isDefault = code === defaultLocale;
            return (
              <li key={code} style={localeRowStyles}>
                <div style={localeInfoStyles}>
                  <span style={codeChipStyles}>{code}</span>
                  <span style={localeLabelStyles}>{labelFor(code)}</span>
                  {isDefault && <span style={defaultBadgeStyles}>Default</span>}
                </div>
                <Button
                  color="light"
                  size="xs"
                  type="button"
                  onClick={() => handleRemove(code)}
                  disabled={isDefault || enabledLocales.length <= 1 || saving} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      </Section>

      {addable.length > 0 && (
        <Section title="Add locale">
          <div style={addRowStyles}>
            <Select
              value={pickedAdd}
              onChange={(e) => setPickedAdd(e.target.value)}
              disabled={saving}
            >
              <option value="">Choose a locale…</option>
              {addable.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code} — {l.label}
                </option>
              ))}
            </Select>
            <Button
              size="xs"
              type="button"
              onClick={handleAdd}
              disabled={!pickedAdd || saving}
            >
              Add
            </Button>
          </div>
        </Section>
      )}

      <Section title="">
        <div style={enforcementNoteStyles}>
          <strong>Note:</strong> locale routing (subdirectory rewrites + per-locale
          page rendering) ships in Phase D. Per-block translation UI on canvas elements
          ships in Phase B. This screen persists site-level locale config now so the
          rest of the chain can be built against real data.
        </div>
        {saveError && (
          <div role="alert" className={SCREEN_ERROR}>{saveError}</div>
        )}
        <Button
          size="xs"
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? "Saving…" : "Save locales"}
        </Button>
      </Section>
    </Screen>
  );
};

const listStyles: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const localeRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "8px 10px",
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border-medium)",
  borderRadius: 6,
};

const localeInfoStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  flex: 1,
};

const codeChipStyles: React.CSSProperties = {
  padding: "2px 6px",
  fontFamily: "var(--bk-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--bk-ink)",
  background: "var(--bk-bg-panel)",
  border: "1px solid var(--bk-border-medium)",
  borderRadius: 4,
};

const localeLabelStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bk-ink)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const defaultBadgeStyles: React.CSSProperties = {
  padding: "2px 6px",
  fontFamily: "var(--bk-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--bk-accent)",
  background: "var(--bk-accent-tint)",
  border: "1px solid var(--bk-accent)",
  borderRadius: 4,
};

const removeBtnStyles: React.CSSProperties = {
  padding: "4px 8px",
  font: "500 11px var(--bk-font-ui)",
  color: "var(--bk-ink-soft)",
  background: "transparent",
  border: "1px solid var(--bk-border-medium)",
  borderRadius: 4,
  cursor: "pointer",
  flexShrink: 0,
};

const removeDisabledStyles: React.CSSProperties = {
  ...removeBtnStyles,
  color: "var(--bk-ink-muted)",
  cursor: "not-allowed",
  opacity: 0.5,
};

const addRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
};

const addButtonStyles: React.CSSProperties = {
  padding: "8px 14px",
  font: "600 12px var(--bk-font-ui)",
  color: "var(--bk-ink-muted)",
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border-medium)",
  borderRadius: 6,
  cursor: "not-allowed",
  flexShrink: 0,
};

const addButtonActiveStyles: React.CSSProperties = {
  ...addButtonStyles,
  color: "#fff",
  background: "var(--bk-accent)",
  borderColor: "var(--bk-accent)",
  cursor: "pointer",
};

const enforcementNoteStyles: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 8,
  padding: "10px 12px",
  font: "500 11.5px var(--bk-font-ui)",
  color: "var(--bk-ink-soft)",
  background: "var(--bk-bg-subtle)",
  border: "1px dashed var(--bk-border-medium)",
  borderRadius: 6,
  lineHeight: 1.5,
};

const saveButtonStyles: React.CSSProperties = {
  marginTop: 4,
  padding: "8px 14px",
  font: "600 12px var(--bk-font-ui)",
  color: "var(--bk-ink-muted)",
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border-medium)",
  borderRadius: 6,
  cursor: "not-allowed",
};

const saveButtonActiveStyles: React.CSSProperties = {
  ...saveButtonStyles,
  color: "#fff",
  background: "var(--bk-accent)",
  borderColor: "var(--bk-accent)",
  cursor: "pointer",
};

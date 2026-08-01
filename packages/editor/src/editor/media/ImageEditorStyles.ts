/**
 * Image Editor Modal Styles
 * @license BSD-3-Clause
 */

export const imageEditorStyles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  preview: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "var(--bk-bg-subtle)",
    borderRadius: 8,
    padding: 16,
    minHeight: 300,
    maxHeight: 400,
    overflow: "hidden",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: 350,
    objectFit: "contain" as const,
    borderRadius: 4,
  },
  toolbar: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    padding: "12px 0",
    borderBottom: "1px solid var(--bk-border)",
  },
  toolBtn: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 4,
    padding: "8px 16px",
    border: "none",
    background: "transparent",
    borderRadius: 8,
    cursor: "pointer",
    color: "var(--bk-ink)",
    transition: "all 0.15s ease",
  },
  toolBtnActive: {
    background: "var(--bk-accent)",
    color: "var(--bk-accent-on)",
  },
  controls: {
    padding: 16,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTop: "1px solid var(--bk-border)",
  },
};

export const sliderStyles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  label: {
    width: 80,
    fontSize: 12,
    color: "var(--bk-ink-soft)",
  },
  input: {
    flex: 1,
    height: 4,
    WebkitAppearance: "none" as const,
    background: "var(--bk-border)",
    borderRadius: 2,
    cursor: "pointer",
  },
  value: {
    width: 40,
    fontSize: 12,
    textAlign: "right" as const,
    color: "var(--bk-ink-muted)",
  },
};

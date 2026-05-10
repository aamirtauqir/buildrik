/**
 * Client-side fallback for the dynamic-import loading state.
 * Mirrors the SSR skeleton in app/edit/[siteId]/layout.tsx so the swap is invisible.
 */
export function EditorSkeleton() {
  return (
    <div
      aria-label="Loading editor"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F8FAFC",
      }}
    >
      <div
        style={{
          height: 48,
          borderBottom: "1px solid #E2E8F0",
          background: "#FFFFFF",
        }}
      />
      <div style={{ flex: 1, display: "flex" }}>
        <div
          style={{
            width: 40,
            background: "#FFFFFF",
            borderRight: "1px solid #E2E8F0",
          }}
        />
        <div
          style={{
            width: 320,
            background: "#FFFFFF",
            borderRight: "1px solid #E2E8F0",
          }}
        />
        <div style={{ flex: 1, background: "#F8FAFC" }} />
        <div
          style={{
            width: 280,
            background: "#FFFFFF",
            borderLeft: "1px solid #E2E8F0",
          }}
        />
      </div>
      <div
        style={{
          height: 24,
          borderTop: "1px solid #E2E8F0",
          background: "#FFFFFF",
        }}
      />
    </div>
  );
}

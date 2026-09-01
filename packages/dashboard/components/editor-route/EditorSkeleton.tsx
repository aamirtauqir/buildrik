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
        background: "#F9FAFB",
      }}
    >
      <div
        style={{
          /* Matches --bk-size-topbar (56). Drew 48. */
          height: 56,
          borderBottom: "1px solid #E5E7EB",
          background: "#FFFFFF",
        }}
      />
      <div style={{ flex: 1, display: "flex" }}>
        {/* Rail. Matches --bk-size-rail (60). Drew 40. */}
        <div
          style={{
            width: 60,
            background: "#FFFFFF",
            borderRight: "1px solid #E5E7EB",
          }}
        />
        {/* Drawer. Matches --bk-size-drawer (280). It drew 320 while the editor
            mounted at 280, so every load ended with the column snapping 40px.
            The skeleton is a promise about the shape that is coming; a wrong
            width makes it a small lie the user watches get corrected. */}
        <div
          style={{
            width: 280,
            background: "#FFFFFF",
            borderRight: "1px solid #E5E7EB",
          }}
        />
        <div style={{ flex: 1, background: "#F9FAFB" }} />
        {/* Inspector. Matches --bk-size-inspector (300). This drew 280 against a
            shipped 300 and predates the drawer change — the same class of drift,
            just older. */}
        <div
          style={{
            width: 300,
            background: "#FFFFFF",
            borderLeft: "1px solid #E5E7EB",
          }}
        />
      </div>
      <div
        style={{
          height: 24,
          borderTop: "1px solid #E5E7EB",
          background: "#FFFFFF",
        }}
      />
    </div>
  );
}

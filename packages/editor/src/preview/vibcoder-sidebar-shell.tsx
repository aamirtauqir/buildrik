import React from "react";
import { createRoot } from "react-dom/client";
import { SidebarShell } from "../editor/shared/vibcoder/SidebarShell";
import { sectionLabel } from "./_galleryStyles";

const sidebarPane: React.CSSProperties = {
  background: "var(--buildrick-surface-2, #f3f4f6)",
  padding: 12,
  fontSize: 13,
  height: "100%",
};

const mainPane: React.CSSProperties = {
  background: "var(--buildrick-surface, #fff)",
  padding: 12,
  fontSize: 13,
  height: "100%",
};

const containerCard: React.CSSProperties = {
  border: "1px solid var(--buildrick-border)",
  borderRadius: 6,
  height: 200,
  overflow: "hidden",
  marginBottom: 8,
};

const sideBySide: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

function SidebarContent({ label }: { label: string }) {
  return (
    <div style={sidebarPane}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.7 }}>
        <li>Item one</li>
        <li>Item two</li>
        <li>Item three</li>
        <li>Item four</li>
      </ul>
    </div>
  );
}

function MainContent({ label }: { label: string }) {
  return (
    <div style={mainPane}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        Main content area. The flex slot fills remaining space.
      </p>
    </div>
  );
}

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (md width / left / no border)</h2>
      <div style={containerCard}>
        <SidebarShell sidebar={<SidebarContent label="Sidebar (280px)" />}>
          <MainContent label="Main" />
        </SidebarShell>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>width = sm (220px)</h2>
      <div style={containerCard}>
        <SidebarShell width="sm" sidebar={<SidebarContent label="Sidebar 220" />}>
          <MainContent label="Main" />
        </SidebarShell>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>width = md (explicit, same as default)</h2>
      <div style={containerCard}>
        <SidebarShell width="md" sidebar={<SidebarContent label="Sidebar 280" />}>
          <MainContent label="Main" />
        </SidebarShell>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>width = lg (320px)</h2>
      <div style={containerCard}>
        <SidebarShell width="lg" sidebar={<SidebarContent label="Sidebar 320" />}>
          <MainContent label="Main" />
        </SidebarShell>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>side = left vs side = right</h2>
      <div style={sideBySide}>
        <div style={containerCard}>
          <SidebarShell sidebar={<SidebarContent label="Left sidebar" />}>
            <MainContent label="Main" />
          </SidebarShell>
        </div>
        <div style={containerCard}>
          <SidebarShell side="right" sidebar={<SidebarContent label="Right sidebar" />}>
            <MainContent label="Main" />
          </SidebarShell>
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>bordered = false vs bordered = true</h2>
      <div style={sideBySide}>
        <div style={containerCard}>
          <SidebarShell sidebar={<SidebarContent label="No divider" />}>
            <MainContent label="Main" />
          </SidebarShell>
        </div>
        <div style={containerCard}>
          <SidebarShell bordered sidebar={<SidebarContent label="With hairline" />}>
            <MainContent label="Main" />
          </SidebarShell>
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>combined: width=lg + side=right + bordered (inspector-like)</h2>
      <div style={containerCard}>
        <SidebarShell width="lg" side="right" bordered sidebar={<SidebarContent label="Inspector 320" />}>
          <MainContent label="Canvas" />
        </SidebarShell>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

/**
 * Aquibra Features Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: "cards" | "icons" | "list";
}

const defaultFeatures: Feature[] = [
  {
    icon: "🚀",
    title: "Lightning Fast",
    description: "Optimized for speed and performance. Your websites load instantly.",
  },
  {
    icon: "🎨",
    title: "Beautiful Design",
    description: "Create stunning designs with our intuitive visual editor.",
  },
  {
    icon: "📱",
    title: "Fully Responsive",
    description: "Your websites look perfect on all devices automatically.",
  },
  {
    icon: "🔒",
    title: "Secure & Reliable",
    description: "Enterprise-grade security to keep your data safe.",
  },
  {
    icon: "⚡",
    title: "Easy Integration",
    description: "Connect with your favorite tools and services seamlessly.",
  },
  {
    icon: "💬",
    title: "24/7 Support",
    description: "Our team is always here to help you succeed.",
  },
];

export const Features: React.FC<FeaturesProps> = ({
  title = "Why Choose Us",
  subtitle = "Everything you need to build amazing websites",
  features = defaultFeatures,
  columns = 3,
  variant = "cards",
}) => {
  return (
    <section className="aqb-features" style={{ padding: "60px 40px" }}>
      {(title || subtitle) && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 48,
            maxWidth: 600,
            margin: "0 auto 48px",
          }}
        >
          {title && (
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "var(--aqb-text-primary, #f8fafc)",
                marginBottom: 16,
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: 18,
                color: "var(--aqb-text-secondary, #cbd5e1)",
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 24,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {features.map((feature, index) => (
          <div
            key={index}
            className="aqb-feature-card"
            style={{
              padding: variant === "cards" ? 32 : 24,
              background: variant === "cards" ? "var(--aqb-bg-panel, #1a1a2e)" : "transparent",
              border: variant === "cards" ? "1px solid var(--aqb-border, #334155)" : "none",
              borderRadius: variant === "cards" ? 16 : 0,
              textAlign: variant === "icons" ? "center" : "left",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <div
              style={{
                fontSize: variant === "icons" ? 48 : 40,
                marginBottom: 16,
                display: variant === "list" ? "inline-block" : "block",
                marginRight: variant === "list" ? 16 : 0,
              }}
            >
              {feature.icon}
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "var(--aqb-text-primary, #f8fafc)",
                marginBottom: 12,
                display: variant === "list" ? "inline" : "block",
              }}
            >
              {feature.title}
            </h3>
            <p
              style={{
                fontSize: 15,
                color: "var(--aqb-text-secondary, #cbd5e1)",
                lineHeight: 1.6,
              }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const featuresBlockConfig = {
  id: "features",
  label: "Features",
  category: "Sections",
  elementType: "features" as const,
  icon: "✨",
  content:
    '<section class="aqb-features" data-aqb-type="features">' +
    '<div class="aqb-feature-item"><h3>Fast Editing</h3><p>Drag, drop, and style in seconds.</p></div>' +
    '<div class="aqb-feature-item"><h3>Responsive</h3><p>Looks great on every device.</p></div>' +
    '<div class="aqb-feature-item"><h3>AI Assist</h3><p>Generate sections with one prompt.</p></div>' +
    "</section>",
};

export default Features;

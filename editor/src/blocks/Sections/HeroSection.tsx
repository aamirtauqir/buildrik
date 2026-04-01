/**
 * Aquibra Hero Section Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  height?: string;
  overlay?: boolean;
  overlayColor?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = "Welcome to dudo",
  subtitle = "Build beautiful websites with our visual composer",
  buttonText = "Get Started",
  buttonUrl = "#",
  backgroundImage,
  backgroundColor = "#0d0d1a",
  textAlign = "center",
  height = "500px",
  overlay = true,
  overlayColor = "rgba(0,0,0,0.5)",
}) => {
  return (
    <section
      className="aqb-hero-section"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: height,
        padding: "60px 40px",
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : backgroundColor,
        textAlign,
      }}
    >
      {overlay && backgroundImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: overlayColor,
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 800 }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.8)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>

        {buttonText && (
          <a
            href={buttonUrl}
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "var(--aqb-primary, #00d4aa)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: "none",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
};

export const heroBlockConfig = {
  id: "hero",
  label: "Hero Section",
  category: "Sections",
  elementType: "hero" as const,
  icon: "🦸",
  content:
    '<section class="aqb-hero-section" data-aqb-type="hero">' +
    '<div class="aqb-hero-content">' +
    "<h1>Welcome to Aquibra</h1>" +
    "<p>Build beautiful websites in minutes with our visual composer.</p>" +
    '<a href="#" class="aqb-hero-button">Get Started</a>' +
    "</div>" +
    "</section>",
  attributes: {
    title: { type: "text", default: "Welcome to dudo" },
    subtitle: { type: "text", default: "Build beautiful websites" },
    buttonText: { type: "text", default: "Get Started" },
    buttonUrl: { type: "text", default: "#" },
    backgroundImage: { type: "image", default: "" },
    backgroundColor: { type: "color", default: "#0d0d1a" },
    textAlign: {
      type: "select",
      options: ["left", "center", "right"],
      default: "center",
    },
    height: { type: "text", default: "500px" },
  },
};

export default HeroSection;

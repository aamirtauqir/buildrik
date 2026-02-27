/**
 * Aquibra Testimonials Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsProps {
  testimonials: Testimonial[];
  columns?: 1 | 2 | 3;
  variant?: "cards" | "simple" | "carousel";
}

const defaultTestimonials: Testimonial[] = [
  {
    quote:
      "Aquibra has completely transformed how we build websites. The visual editor is incredibly intuitive.",
    author: "Sarah Johnson",
    role: "CEO",
    company: "TechStart Inc.",
    rating: 5,
  },
  {
    quote: "We reduced our development time by 60% after switching to Aquibra. Highly recommended!",
    author: "Michael Chen",
    role: "Lead Developer",
    company: "DevStudio",
    rating: 5,
  },
  {
    quote:
      "The best website builder I have ever used. Clean, fast, and professional results every time.",
    author: "Emily Davis",
    role: "Designer",
    company: "Creative Agency",
    rating: 5,
  },
];

export const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials = defaultTestimonials,
  columns = 3,
  variant = "cards",
}) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (variant === "carousel") {
    return (
      <div className="aqb-testimonials-carousel" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 24, marginBottom: 24 }}>
            {[...Array(testimonials[activeIndex].rating || 5)].map((_, i) => (
              <span key={i} style={{ color: "#fbbf24" }}>
                ★
              </span>
            ))}
          </div>

          <blockquote
            style={{
              fontSize: 24,
              fontStyle: "italic",
              color: "var(--aqb-text-primary, #f8fafc)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            "{testimonials[activeIndex].quote}"
          </blockquote>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {testimonials[activeIndex].avatar && (
              <img
                src={testimonials[activeIndex].avatar}
                alt={testimonials[activeIndex].author}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: "var(--aqb-text-primary, #f8fafc)",
                }}
              >
                {testimonials[activeIndex].author}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--aqb-text-muted, #94a3b8)",
                }}
              >
                {testimonials[activeIndex].role}
                {testimonials[activeIndex].company && `, ${testimonials[activeIndex].company}`}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 32,
            }}
          >
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: "none",
                  background:
                    i === activeIndex
                      ? "var(--aqb-primary, #00d4aa)"
                      : "var(--aqb-border, #334155)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="aqb-testimonials"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 24,
        padding: 40,
      }}
    >
      {testimonials.map((testimonial, index) => (
        <div
          key={index}
          className="aqb-testimonial-card"
          style={{
            padding: 24,
            background: "var(--aqb-bg-panel, #1a1a2e)",
            border: "1px solid var(--aqb-border, #334155)",
            borderRadius: 12,
          }}
        >
          {testimonial.rating && (
            <div style={{ marginBottom: 16 }}>
              {[...Array(testimonial.rating)].map((_, i) => (
                <span key={i} style={{ color: "#fbbf24" }}>
                  ★
                </span>
              ))}
            </div>
          )}

          <blockquote
            style={{
              fontSize: 16,
              color: "var(--aqb-text-secondary, #cbd5e1)",
              marginBottom: 20,
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            "{testimonial.quote}"
          </blockquote>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {testimonial.avatar ? (
              <img
                src={testimonial.avatar}
                alt={testimonial.author}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--aqb-primary, #00d4aa)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                {testimonial.author.charAt(0)}
              </div>
            )}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: "var(--aqb-text-primary, #f8fafc)",
                  fontSize: 14,
                }}
              >
                {testimonial.author}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--aqb-text-muted, #94a3b8)",
                }}
              >
                {testimonial.role}
                {testimonial.company && ` at ${testimonial.company}`}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const testimonialsBlockConfig = {
  id: "testimonials",
  label: "Testimonials",
  category: "Components",
  elementType: "testimonials" as const,
  icon: "💬",
  content:
    '<div class="aqb-testimonials" data-aqb-type="testimonials">' +
    '<div class="aqb-testimonial-item">' +
    '<p class="aqb-testimonial-quote">"Great product experience."</p>' +
    '<div class="aqb-testimonial-meta"><strong>Alex Doe</strong><span>Founder, Nova</span></div>' +
    '<div class="aqb-testimonial-rating">★★★★★</div>' +
    "</div>" +
    "</div>",
};

export default Testimonials;

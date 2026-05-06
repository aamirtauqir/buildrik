/**
 * Aquibra Pricing Table Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  buttonText?: string;
  buttonUrl?: string;
  highlighted?: boolean;
  badge?: string;
}

export interface PricingTableProps {
  plans: PricingPlan[];
  columns?: 2 | 3 | 4;
}

const defaultPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "Perfect for individuals",
    features: ["5 Projects", "10GB Storage", "Email Support", "Basic Analytics"],
    buttonText: "Get Started",
    buttonUrl: "#",
  },
  {
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "Best for professionals",
    features: [
      "Unlimited Projects",
      "100GB Storage",
      "Priority Support",
      "Advanced Analytics",
      "Custom Domain",
    ],
    buttonText: "Get Started",
    buttonUrl: "#",
    highlighted: true,
    badge: "Popular",
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large teams",
    features: [
      "Everything in Pro",
      "Unlimited Storage",
      "24/7 Support",
      "Custom Integrations",
      "SLA",
      "Dedicated Manager",
    ],
    buttonText: "Contact Sales",
    buttonUrl: "#",
  },
];

export const PricingTable: React.FC<PricingTableProps> = ({
  plans = defaultPlans,
  columns = 3,
}) => {
  return (
    <div
     
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 24,
        padding: 40,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {plans.map((plan, index) => (
        <div
          key={index}
          className={`buildrick-pricing-card ${plan.highlighted ? "highlighted" : ""}`}
          style={{
            position: "relative",
            padding: 32,
            background: plan.highlighted
              ? "var(--buildrick-accent-subtle, rgba(0,212,170,0.1))"
              : "var(--buildrick-design-color-background)",
            border: plan.highlighted
              ? "2px solid var(--buildrick-design-color-primary)"
              : "1px solid var(--buildrick-design-color-border)",
            borderRadius: 16,
            textAlign: "center",
            transform: plan.highlighted ? "scale(1.05)" : "none",
          }}
        >
          {plan.badge && (
            <div
              style={{
                position: "absolute",
                top: -12,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "4px 16px",
                background: "var(--buildrick-design-color-primary)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 20,
              }}
            >
              {plan.badge}
            </div>
          )}

          <h3
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 8,
              color: "var(--buildrick-design-color-text)",
            }}
          >
            {plan.name}
          </h3>

          {plan.description && (
            <p
              style={{
                fontSize: 14,
                color: "var(--buildrick-design-color-muted)",
                marginBottom: 24,
              }}
            >
              {plan.description}
            </p>
          )}

          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "var(--buildrick-design-color-text)",
              }}
            >
              {plan.price}
            </span>
            {plan.period && (
              <span
                style={{
                  fontSize: 16,
                  color: "var(--buildrick-design-color-muted)",
                }}
              >
                {plan.period}
              </span>
            )}
          </div>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              marginBottom: 32,
              textAlign: "left",
            }}
          >
            {plan.features.map((feature, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  fontSize: 14,
                  color: "var(--buildrick-design-color-muted)",
                  borderBottom: "1px solid var(--buildrick-design-color-border)",
                }}
              >
                <span style={{ color: "var(--buildrick-design-color-success)" }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <a
            href={plan.buttonUrl}
            style={{
              display: "block",
              padding: "12px 24px",
              background: plan.highlighted ? "var(--buildrick-design-color-primary)" : "transparent",
              border: plan.highlighted ? "none" : "2px solid var(--buildrick-design-color-primary)",
              color: plan.highlighted ? "#fff" : "var(--buildrick-design-color-primary)",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            {plan.buttonText}
          </a>
        </div>
      ))}
    </div>
  );
};

export const pricingBlockConfig = {
  id: "pricing",
  label: "Pricing Table",
  category: "Components",
  elementType: "pricing" as const,
  icon: "💰",
  content:
    '<div class="buildrick-pricing-table" data-buildrick-type="pricing">' +
    '<div class="buildrick-pricing-card">' +
    "<h3>Starter</h3>" +
    '<p class="buildrick-pricing-price">$19/mo</p>' +
    "<ul><li>Basic features</li><li>Email support</li></ul>" +
    '<a href="#" class="buildrick-pricing-button">Choose Plan</a>' +
    "</div>" +
    '<div class="buildrick-pricing-card buildrick-featured">' +
    "<h3>Pro</h3>" +
    '<p class="buildrick-pricing-price">$49/mo</p>' +
    "<ul><li>Everything in Starter</li><li>Advanced analytics</li><li>Priority support</li></ul>" +
    '<a href="#" class="buildrick-pricing-button">Get Pro</a>' +
    "</div>" +
    "</div>",
};

export default PricingTable;

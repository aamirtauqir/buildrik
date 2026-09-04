/**
 * Aquibra Pricing Table Block
 * @license BSD-3-Clause
 */

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


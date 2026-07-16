/**
 * StripeInjector — cart/checkout script generation for exported HTML.
 * Pure string generation: assert exact snippets, config-driven branches,
 * and the enabled/publishableKey gate.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { generateStripeScripts, isValidStripePublishableKey } from "../StripeInjector";
import type { StripeConfig } from "../../../shared/types";

const baseConfig: StripeConfig = {
  enabled: true,
  publishableKey: "pk_test_abcdefghijklmnopqrstuvwxyz",
  checkoutMode: "payment-links",
};

describe("generateStripeScripts — gate conditions", () => {
  it("returns '' when config is undefined", () => {
    expect(generateStripeScripts(undefined)).toBe("");
  });

  it("returns '' when disabled", () => {
    expect(generateStripeScripts({ ...baseConfig, enabled: false })).toBe("");
  });

  it("returns '' when publishableKey is empty", () => {
    expect(generateStripeScripts({ ...baseConfig, publishableKey: "" })).toBe("");
  });
});

describe("generateStripeScripts — payment-links mode", () => {
  const out = generateStripeScripts(baseConfig);

  it("does NOT include the Stripe.js SDK tag", () => {
    expect(out).not.toContain("https://js.stripe.com/v3/");
  });

  it("embeds the cart script with payment-links mode", () => {
    expect(out).toContain("var CHECKOUT_MODE = 'payment-links';");
  });

  it("interpolates the publishable key into the Stripe() init", () => {
    expect(out).toContain("Stripe('pk_test_abcdefghijklmnopqrstuvwxyz')");
  });

  it("applies defaults for currency, URLs and endpoint when omitted", () => {
    expect(out).toContain("var CURRENCY = 'USD';");
    expect(out).toContain("var SUCCESS_URL = '/success.html';");
    expect(out).toContain("var CANCEL_URL = '/';");
    expect(out).toContain("var CHECKOUT_ENDPOINT = '/api/checkout';");
  });

  it("uses the aquibra_cart localStorage key", () => {
    expect(out).toContain("var CART_KEY = 'aquibra_cart';");
    expect(out).toContain("localStorage.getItem(CART_KEY)");
    expect(out).toContain("localStorage.setItem(CART_KEY, JSON.stringify(cart))");
  });

  it("exposes the full window.AquibraCart API surface", () => {
    expect(out).toContain("window.AquibraCart = {");
    for (const method of ["add:", "remove:", "update:", "clear:", "get:", "total:", "count:", "checkout:"]) {
      expect(out).toContain(method);
    }
  });

  it("auto-binds [data-add-to-cart] and [data-checkout] buttons on DOMContentLoaded", () => {
    expect(out).toContain("document.addEventListener('DOMContentLoaded'");
    expect(out).toContain("document.querySelectorAll('[data-add-to-cart]')");
    expect(out).toContain("document.querySelectorAll('[data-checkout]')");
  });

  it("updates cart-count and cart-total UI bindings", () => {
    expect(out).toContain("document.querySelectorAll('[data-cart-count]')");
    expect(out).toContain("document.querySelectorAll('[data-cart-total]')");
  });

  it("dispatches cart:updated CustomEvent on save", () => {
    expect(out).toContain("window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }))");
  });

  it("wraps everything in a single <script> IIFE", () => {
    expect(out.trim().startsWith("<script>")).toBe(true);
    expect(out.trim().endsWith("</script>")).toBe(true);
    expect(out).toContain("(function() {");
    expect(out).toContain("'use strict';");
  });
});

describe("generateStripeScripts — api mode", () => {
  const apiConfig: StripeConfig = {
    enabled: true,
    publishableKey: "pk_live_abcdefghijklmnopqrstuvwxyz",
    checkoutMode: "api",
    checkoutEndpoint: "/checkout/session",
    successUrl: "/thanks.html",
    cancelUrl: "/cart.html",
    currency: "EUR",
  };
  const out = generateStripeScripts(apiConfig);

  it("prepends the Stripe.js SDK script tag", () => {
    expect(out).toContain('<script src="https://js.stripe.com/v3/"></script>');
    // SDK comes before the cart script.
    expect(out.indexOf("js.stripe.com/v3")).toBeLessThan(out.indexOf("AquibraCart"));
  });

  it("joins SDK + cart script with a newline", () => {
    expect(out.startsWith('<script src="https://js.stripe.com/v3/"></script>\n')).toBe(true);
  });

  it("interpolates all custom config values", () => {
    expect(out).toContain("var CURRENCY = 'EUR';");
    expect(out).toContain("var CHECKOUT_MODE = 'api';");
    expect(out).toContain("var CHECKOUT_ENDPOINT = '/checkout/session';");
    expect(out).toContain("var SUCCESS_URL = '/thanks.html';");
    expect(out).toContain("var CANCEL_URL = '/cart.html';");
  });

  it("includes the fetch-based checkout API path", () => {
    expect(out).toContain("await fetch(CHECKOUT_ENDPOINT");
    expect(out).toContain("stripe.redirectToCheckout({ sessionId: data.sessionId })");
    // Prices sent to the API in cents.
    expect(out).toContain("Math.round(item.price * 100)");
  });
});

describe("isValidStripePublishableKey", () => {
  it("accepts pk_test_ keys with 20+ alphanumeric chars", () => {
    expect(isValidStripePublishableKey("pk_test_abcdefghijklmnopqrst")).toBe(true);
  });

  it("accepts pk_live_ keys", () => {
    expect(isValidStripePublishableKey("pk_live_ABC123defGHI456jklMNO789")).toBe(true);
  });

  it("rejects secret keys (sk_)", () => {
    expect(isValidStripePublishableKey("sk_test_abcdefghijklmnopqrst")).toBe(false);
  });

  it("rejects keys with fewer than 20 chars after the prefix", () => {
    expect(isValidStripePublishableKey("pk_test_short")).toBe(false);
  });

  it("rejects keys with special characters", () => {
    expect(isValidStripePublishableKey("pk_test_abcdefghij-lmnopqrstu")).toBe(false);
  });

  it("rejects empty string and unknown prefixes", () => {
    expect(isValidStripePublishableKey("")).toBe(false);
    expect(isValidStripePublishableKey("pk_prod_abcdefghijklmnopqrst")).toBe(false);
  });
});

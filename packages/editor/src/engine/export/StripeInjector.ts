/**
 * Stripe Checkout Script Injector
 * Generates cart management and checkout scripts for exported HTML
 * @license BSD-3-Clause
 */

import type { StripeConfig } from "../../shared/types";

/**
 * Generate Stripe.js SDK script tag
 */
function generateStripeSDK(): string {
  return '<script src="https://js.stripe.com/v3/"></script>';
}

/**
 * Generate cart management + checkout JavaScript
 */
function generateCartScript(config: StripeConfig): string {
  const currency = config.currency || "USD";
  const successUrl = config.successUrl || "/success.html";
  const cancelUrl = config.cancelUrl || "/";
  const checkoutMode = config.checkoutMode || "payment-links";
  const checkoutEndpoint = config.checkoutEndpoint || "/api/checkout";

  return `
<script>
(function() {
  'use strict';

  var CART_KEY = 'aquibra_cart';
  var CURRENCY = '${currency}';
  var CHECKOUT_MODE = '${checkoutMode}';
  var CHECKOUT_ENDPOINT = '${checkoutEndpoint}';
  var SUCCESS_URL = '${successUrl}';
  var CANCEL_URL = '${cancelUrl}';

  // Initialize Stripe (for API mode)
  var stripe = typeof Stripe !== 'undefined' ? Stripe('${config.publishableKey}') : null;

  // Cart state management
  function getCart() {
    try {
      var stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : { items: [], currency: CURRENCY, updatedAt: '' };
    } catch (e) {
      return { items: [], currency: CURRENCY, updatedAt: '' };
    }
  }

  function saveCart(cart) {
    cart.updatedAt = new Date().toISOString();
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    updateCartUI();
  }

  function addToCart(product) {
    var cart = getCart();
    var existing = cart.items.find(function(item) { return item.productId === product.productId; });

    if (existing) {
      existing.quantity += product.quantity || 1;
    } else {
      cart.items.push({
        productId: product.productId,
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        image: product.image,
        sku: product.sku,
        paymentLink: product.paymentLink
      });
    }

    saveCart(cart);
    return cart;
  }

  function removeFromCart(productId) {
    var cart = getCart();
    cart.items = cart.items.filter(function(item) { return item.productId !== productId; });
    saveCart(cart);
    return cart;
  }

  function updateQuantity(productId, quantity) {
    var cart = getCart();
    var item = cart.items.find(function(i) { return i.productId === productId; });
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        return removeFromCart(productId);
      }
    }
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    var cart = { items: [], currency: CURRENCY, updatedAt: new Date().toISOString() };
    saveCart(cart);
    return cart;
  }

  function getCartTotal() {
    return getCart().items.reduce(function(sum, item) {
      return sum + (item.price * item.quantity);
    }, 0);
  }

  function getCartCount() {
    return getCart().items.reduce(function(sum, item) { return sum + item.quantity; }, 0);
  }

  function updateCartUI() {
    var count = getCartCount();
    document.querySelectorAll('[data-cart-count]').forEach(function(el) {
      el.textContent = count;
    });
    document.querySelectorAll('[data-cart-total]').forEach(function(el) {
      el.textContent = '$' + getCartTotal().toFixed(2);
    });
  }

  // Checkout handlers
  function checkoutPaymentLinks() {
    var cart = getCart();
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    // For payment links mode, redirect to first item's payment link
    // (Simple MVP - assumes single product checkout)
    var firstItem = cart.items[0];
    if (firstItem.paymentLink) {
      window.location.href = firstItem.paymentLink;
    } else {
      alert('Payment link not configured for this product');
    }
  }

  async function checkoutAPI() {
    var cart = getCart();
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      var response = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map(function(item) {
            return {
              name: item.name,
              price: Math.round(item.price * 100),
              quantity: item.quantity,
              image: item.image
            };
          }),
          currency: CURRENCY,
          successUrl: window.location.origin + SUCCESS_URL,
          cancelUrl: window.location.origin + CANCEL_URL
        })
      });

      var data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId && stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout error:', err); // eslint-disable-line no-console -- exported page runtime, no devLogger
      alert('Unable to process checkout. Please try again.');
    }
  }

  function checkout() {
    if (CHECKOUT_MODE === 'payment-links') {
      checkoutPaymentLinks();
    } else {
      checkoutAPI();
    }
  }

  // Expose cart API globally
  window.AquibraCart = {
    add: addToCart,
    remove: removeFromCart,
    update: updateQuantity,
    clear: clearCart,
    get: getCart,
    total: getCartTotal,
    count: getCartCount,
    checkout: checkout
  };

  // Auto-bind buttons on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Add to Cart buttons
    document.querySelectorAll('[data-add-to-cart]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var card = e.target.closest('[data-product-card]');
        if (!card) return;

        var product = {
          productId: card.dataset.productId || card.querySelector('[data-bind="sku"]')?.textContent || Date.now().toString(),
          name: card.querySelector('[data-bind="name"]')?.textContent || 'Product',
          price: parseFloat(card.querySelector('[data-bind="price"]')?.textContent?.replace(/[^0-9.]/g, '')) || 0,
          image: card.querySelector('[data-bind="image"]')?.src || '',
          sku: card.querySelector('[data-bind="sku"]')?.textContent || '',
          paymentLink: card.dataset.paymentLink || '',
          quantity: 1
        };

        window.AquibraCart.add(product);

        // Visual feedback
        btn.textContent = 'Added!';
        setTimeout(function() { btn.textContent = 'Add to Cart'; }, 1500);
      });
    });

    // Checkout buttons
    document.querySelectorAll('[data-checkout]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        window.AquibraCart.checkout();
      });
    });

    // Initial UI update
    updateCartUI();
  });
})();
</script>`;
}

/**
 * Generate all Stripe-related scripts for export
 */
export function generateStripeScripts(config?: StripeConfig): string {
  if (!config?.enabled || !config.publishableKey) {
    return "";
  }

  const scripts: string[] = [];

  // Only include Stripe SDK for API mode
  if (config.checkoutMode === "api") {
    scripts.push(generateStripeSDK());
  }

  scripts.push(generateCartScript(config));

  return scripts.join("\n");
}

/**
 * Validate Stripe publishable key format
 */
export function isValidStripePublishableKey(key: string): boolean {
  return /^pk_(test|live)_[a-zA-Z0-9]{20,}$/.test(key);
}

/**
 * Analytics script injection for HTML export
 * Generates tracking code snippets for various analytics providers
 *
 * @module engine/export/AnalyticsInjector
 * @license BSD-3-Clause
 */

import type { AnalyticsConfig } from "../../shared/types";

/**
 * Generate Google Analytics 4 script tags
 * Includes privacy protections: IP anonymization and disabled remarketing signals
 */
function generateGoogleAnalytics(measurementId: string): string {
  return `  <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', {
      'anonymize_ip': true,
      'allow_google_signals': false
    });
  </script>`;
}

/**
 * Generate Facebook Pixel script tags
 */
function generateFacebookPixel(pixelId: string): string {
  return `  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
  /></noscript>`;
}

/**
 * Generate Google Ads conversion tracking script
 */
function generateGoogleAds(conversionId: string): string {
  return `  <script async src="https://www.googletagmanager.com/gtag/js?id=${conversionId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${conversionId}');
  </script>`;
}

/**
 * Generate Microsoft Clarity script (free heatmaps + session recordings).
 * Head-only; no body/noscript needed.
 */
function generateMicrosoftClarity(projectId: string): string {
  return `  <script type="text/javascript">
    (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${projectId}");
  </script>`;
}

/**
 * Generate Google Tag Manager container script. This is the head half; GTM's
 * <noscript> body fallback is only needed for no-JS visitors (irrelevant to
 * analytics) so it is intentionally omitted here where injection is head-only.
 */
function generateGoogleTagManager(containerId: string): string {
  return `  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${containerId}');</script>`;
}

/**
 * Generate all configured analytics scripts
 * Returns empty string if no analytics are enabled
 */
export function generateAnalyticsScripts(config?: AnalyticsConfig): string {
  if (!config) {
    return "";
  }

  const scripts: string[] = [];

  // Google Analytics
  if (config.googleAnalytics?.enabled && config.googleAnalytics.measurementId) {
    scripts.push(generateGoogleAnalytics(config.googleAnalytics.measurementId));
  }

  // Facebook Pixel
  if (config.facebookPixel?.enabled && config.facebookPixel.pixelId) {
    scripts.push(generateFacebookPixel(config.facebookPixel.pixelId));
  }

  // Google Ads (only if different from GA)
  if (config.googleAds?.enabled && config.googleAds.conversionId) {
    // Avoid duplicate gtag if GA is already loaded
    if (!config.googleAnalytics?.enabled) {
      scripts.push(generateGoogleAds(config.googleAds.conversionId));
    }
  }

  // Microsoft Clarity
  if (config.microsoftClarity?.enabled && config.microsoftClarity.projectId) {
    scripts.push(generateMicrosoftClarity(config.microsoftClarity.projectId));
  }

  // Google Tag Manager
  if (config.googleTagManager?.enabled && config.googleTagManager.containerId) {
    scripts.push(generateGoogleTagManager(config.googleTagManager.containerId));
  }

  return scripts.join("\n");
}

/** Microsoft Clarity project ids are short alphanumeric strings. */
export function isValidClarityProjectId(id: string): boolean {
  return /^[a-z0-9]{6,15}$/i.test(id);
}

/** Google Tag Manager container ids look like GTM-XXXXXXX. */
export function isValidGTMContainerId(id: string): boolean {
  return /^GTM-[A-Z0-9]{4,}$/.test(id);
}

/**
 * Validate Google Analytics measurement ID format
 */
export function isValidGAMeasurementId(id: string): boolean {
  return /^G-[A-Z0-9]{8,}$/.test(id);
}

/**
 * Validate Facebook Pixel ID format
 */
export function isValidFBPixelId(id: string): boolean {
  return /^\d{15,16}$/.test(id);
}

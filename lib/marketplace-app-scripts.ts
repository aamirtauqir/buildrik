// Pure head-script generation for workspace marketplace apps. Given an installed
// app's id + stored config, returns the HTML to inject into every published
// page's <head>. Lives in lib/ (not the service) so the worker, the service and
// tests share one generator with no service→worker coupling. Only apps whose
// behaviour is a workspace-wide head script are here — Commerce/Memberships are
// features, not injectables; Typeform is a per-page embed.
import { APP_CONFIG_SCHEMAS } from "@buildrik/shared/schemas/marketplace";

// All ids below are regex-constrained by APP_CONFIG_SCHEMAS before storage, so
// they are safe to interpolate into these vendor snippets.

/** Tawk.to live-chat loader. */
function generateLiveChat(config: { propertyId: string; widgetId: string }): string {
  const src = `https://embed.tawk.to/${config.propertyId}/${config.widgetId}`;
  return `<script type="text/javascript">
var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();
(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src=${JSON.stringify(src)};s1.charset="UTF-8";s1.setAttribute("crossorigin","*");s0.parentNode.insertBefore(s1,s0);})();
</script>`;
}

/** HubSpot tracking-code loader (async, self-contained). */
function generateHubspot(config: { portalId: string }): string {
  return `<script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/${config.portalId}.js"></script>`;
}

/** LinkedIn Insight Tag. Head-only: the JS loader is the real tracker. The
 *  vendor's <noscript> pixel is omitted — <noscript><img> is invalid inside
 *  <head> (where this injects) and the no-JS fallback carries negligible value. */
function generateLinkedInInsight(config: { partnerId: string }): string {
  const id = config.partnerId;
  return `<script type="text/javascript">
_linkedin_partner_id = "${id}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);
</script>`;
}

/** TikTok Pixel loader (ttq) with PageView. */
function generateTikTokPixel(config: { pixelId: string }): string {
  return `<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load(${JSON.stringify(config.pixelId)});
ttq.page();
}(window,document,"ttq");
</script>`;
}

/** Pinterest Tag (pintrk) with PageVisit. Head-only: the vendor <noscript>
 *  pixel is omitted for the same reason as LinkedIn — invalid in <head>, and the
 *  pintrk JS loader is the real tracker. */
function generatePinterestTag(config: { tagId: string }): string {
  const id = config.tagId;
  return `<script>
!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk("load","${id}");
pintrk("page");
</script>`;
}

/** Search-engine ownership verification meta tags (one per configured engine). */
function generateSiteVerification(config: { google?: string; bing?: string; pinterest?: string }): string {
  const tags: string[] = [];
  if (config.google) tags.push(`<meta name="google-site-verification" content="${config.google}">`);
  if (config.bing) tags.push(`<meta name="msvalidate.01" content="${config.bing}">`);
  if (config.pinterest) tags.push(`<meta name="p:domain_verify" content="${config.pinterest}">`);
  return tags.join("\n");
}

/** One installed, configured app. `config` is the raw JSON from WorkspaceApp. */
export interface InstalledApp {
  appId: string;
  config: unknown;
}

/**
 * Build the combined head-inject HTML for a workspace's installed apps. Each
 * app's config is re-validated against its schema here — a row with missing or
 * malformed config contributes nothing (never a broken tag). Non-configurable
 * or unknown appIds are ignored. Returns "" when nothing applies.
 */
export function generateWorkspaceAppScripts(apps: InstalledApp[]): string {
  const out: string[] = [];
  for (const app of apps) {
    // Each case parses with its concrete schema so the generator arg is typed
    // (TS can't narrow one shared parse by the appId discriminant). A missing or
    // malformed config just skips the app — never a broken tag.
    switch (app.appId) {
      case "live-chat": {
        const p = APP_CONFIG_SCHEMAS["live-chat"].safeParse(app.config);
        if (p.success) out.push(generateLiveChat(p.data));
        break;
      }
      case "hubspot": {
        const p = APP_CONFIG_SCHEMAS.hubspot.safeParse(app.config);
        if (p.success) out.push(generateHubspot(p.data));
        break;
      }
      case "linkedin-insight": {
        const p = APP_CONFIG_SCHEMAS["linkedin-insight"].safeParse(app.config);
        if (p.success) out.push(generateLinkedInInsight(p.data));
        break;
      }
      case "tiktok-pixel": {
        const p = APP_CONFIG_SCHEMAS["tiktok-pixel"].safeParse(app.config);
        if (p.success) out.push(generateTikTokPixel(p.data));
        break;
      }
      case "pinterest-tag": {
        const p = APP_CONFIG_SCHEMAS["pinterest-tag"].safeParse(app.config);
        if (p.success) out.push(generatePinterestTag(p.data));
        break;
      }
      case "site-verification": {
        const p = APP_CONFIG_SCHEMAS["site-verification"].safeParse(app.config);
        if (p.success) out.push(generateSiteVerification(p.data));
        break;
      }
    }
  }
  return out.join("\n");
}

// Pure head-script generation for workspace marketplace apps. Given an installed
// app's id + stored config, returns the HTML to inject into every published
// page's <head>. Lives in lib/ (not the service) so the worker, the service and
// tests share one generator with no service→worker coupling. Only apps whose
// behaviour is a workspace-wide head script are here — Commerce/Memberships are
// features, not injectables; Typeform is a per-page embed.
import { APP_CONFIG_SCHEMAS, type ConfigurableAppId } from "@buildrik/shared/schemas/marketplace";

/** Tawk.to live-chat loader. Property/widget ids are regex-constrained upstream
 *  (hex / alphanumeric), so they are safe to interpolate into the src URL. */
function generateLiveChat(config: { propertyId: string; widgetId: string }): string {
  const src = `https://embed.tawk.to/${config.propertyId}/${config.widgetId}`;
  return `<script type="text/javascript">
var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();
(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src=${JSON.stringify(src)};s1.charset="UTF-8";s1.setAttribute("crossorigin","*");s0.parentNode.insertBefore(s1,s0);})();
</script>`;
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
    if (!(app.appId in APP_CONFIG_SCHEMAS)) continue;
    const id = app.appId as ConfigurableAppId;
    const parsed = APP_CONFIG_SCHEMAS[id].safeParse(app.config);
    if (!parsed.success) continue;
    switch (id) {
      case "live-chat":
        out.push(generateLiveChat(parsed.data));
        break;
    }
  }
  return out.join("\n");
}

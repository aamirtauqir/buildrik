import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";
import { sitesRouter } from "./routers/sites";
import { siteDetailRouter } from "./routers/site-detail";
import { templatesRouter } from "./routers/templates";
import { teamRouter } from "./routers/team";
import { billingRouter } from "./routers/billing";
import { accountRouter } from "./routers/account";
import { helpRouter } from "./routers/help";
import { notificationsRouter } from "./routers/notifications";
import { onboardingRouter } from "./routers/onboarding";
import { pagesRouter } from "./routers/pages";
import { formsRouter } from "./routers/forms";
import { uploadRouter } from "./routers/upload";
import { aiRouter } from "./routers/ai";
import { mediaRouter } from "./routers/media";
import { apiTokensRouter } from "./routers/api-tokens";
import { vercelIntegrationsRouter } from "./routers/integrations";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  sites: sitesRouter,
  siteDetail: siteDetailRouter,
  templates: templatesRouter,
  team: teamRouter,
  billing: billingRouter,
  account: accountRouter,
  help: helpRouter,
  notifications: notificationsRouter,
  onboarding: onboardingRouter,
  pages: pagesRouter,
  forms: formsRouter,
  upload: uploadRouter,
  ai: aiRouter,
  media: mediaRouter,
  apiTokens: apiTokensRouter,
  integrations: router({ vercel: vercelIntegrationsRouter }),
});

export type AppRouter = typeof appRouter;

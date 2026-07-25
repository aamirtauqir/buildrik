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
import { learnRouter } from "./routers/learn";
import { notificationsRouter } from "./routers/notifications";
import { onboardingRouter } from "./routers/onboarding";
import { pagesRouter } from "./routers/pages";
import { formsRouter } from "./routers/forms";
import { uploadRouter } from "./routers/upload";
import { aiRouter } from "./routers/ai";
import { mediaRouter } from "./routers/media";
import { apiTokensRouter } from "./routers/api-tokens";
import { vercelIntegrationsRouter } from "./routers/integrations";
import { actionsRouter } from "./routers/actions";
import { featuresRouter } from "./routers/features";
import { clientsRouter } from "./routers/clients";
import { reviewsRouter } from "./routers/reviews";
import { handoverRouter } from "./routers/handover";
import { clientReviewRouter } from "./routers/client-review";
import { commentsRouter } from "./routers/comments";
import { webhooksRouter } from "./routers/webhooks";
import { cmsRouter } from "./routers/cms";
import { themeRouter } from "./routers/theme";
import { siteVersionsRouter } from "./routers/site-version";
import { siteComponentsRouter } from "./routers/site-component";
import { userTemplatesRouter } from "./routers/user-template";
import { marketplaceRouter } from "./routers/marketplace";

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
  learn: learnRouter,
  notifications: notificationsRouter,
  onboarding: onboardingRouter,
  pages: pagesRouter,
  forms: formsRouter,
  upload: uploadRouter,
  ai: aiRouter,
  media: mediaRouter,
  apiTokens: apiTokensRouter,
  integrations: router({ vercel: vercelIntegrationsRouter }),
  actions: actionsRouter,
  features: featuresRouter,
  clients: clientsRouter,
  reviews: reviewsRouter,
  handover: handoverRouter,
  clientReview: clientReviewRouter,
  comments: commentsRouter,
  webhooks: webhooksRouter,
  cms: cmsRouter,
  theme: themeRouter,
  siteVersions: siteVersionsRouter,
  siteComponents: siteComponentsRouter,
  userTemplates: userTemplatesRouter,
  marketplace: marketplaceRouter,
});

export type AppRouter = typeof appRouter;

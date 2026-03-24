import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";
import { sitesRouter } from "./routers/sites";
import { siteDetailRouter } from "./routers/site-detail";
import { templatesRouter } from "./routers/templates";
import { teamRouter } from "./routers/team";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  sites: sitesRouter,
  siteDetail: siteDetailRouter,
  templates: templatesRouter,
  team: teamRouter,
});

export type AppRouter = typeof appRouter;

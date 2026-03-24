import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";
import { sitesRouter } from "./routers/sites";
import { siteDetailRouter } from "./routers/site-detail";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  sites: sitesRouter,
  siteDetail: siteDetailRouter,
});

export type AppRouter = typeof appRouter;

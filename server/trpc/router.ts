import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";
import { sitesRouter } from "./routers/sites";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  sites: sitesRouter,
});

export type AppRouter = typeof appRouter;
